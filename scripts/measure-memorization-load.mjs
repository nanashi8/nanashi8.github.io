/**
 * 暗記タブの表示完了までの時間を計測するスクリプト
 *
 * 測定対象:
 * - アプリ表示 → 暗記タブクリック → 暗記UI（"分からない"ボタン）表示まで
 *
 * 使い方:
 * - `node scripts/measure-memorization-load.mjs`
 *
 * オプション:
 * - `BASE_URL` 環境変数でURL指定（例: http://127.0.0.1:5176）
 *   - 指定した場合、devサーバーは自動起動せず、そのURLを測定します
 * - 第1引数でURL指定（例: node ... http://127.0.0.1:5176）
 * - `RUNS` 環境変数で繰り返し回数（既定3）
 * - `PORT` 環境変数で自動起動時のポート（既定5176）
 */

import { chromium } from 'playwright';
import { performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return null;
  const idx = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(p * sortedValues.length) - 1));
  return sortedValues[idx];
}

async function waitForServer(page, url) {
  const maxAttempts = 60;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 2000 });
      return;
    } catch {
      await page.waitForTimeout(250);
    }
  }
  throw new Error(`Dev server not reachable: ${url}`);
}

async function startDevServer({ host, port }) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, '..');
  const args = ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort'];

  const proc = spawn('npm', args, {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  });

  let stdoutBuffer = '';
  let stderrBuffer = '';
  proc.stdout.on('data', (c) => {
    stdoutBuffer += c.toString();
  });
  proc.stderr.on('data', (c) => {
    stderrBuffer += c.toString();
  });

  const timeoutMs = 20_000;
  const url = `http://${host}:${port}/`;

  const start = performance.now();
  while (true) {
    const elapsed = performance.now() - start;
    if (elapsed > timeoutMs) {
      proc.kill('SIGINT');
      throw new Error(
        `Dev server did not become ready within ${timeoutMs}ms (url: ${url})\n\n` +
          `--- stdout ---\n${stdoutBuffer}\n\n--- stderr ---\n${stderrBuffer}`
      );
    }

    if (proc.exitCode !== null) {
      throw new Error(
        `Dev server exited early (code ${proc.exitCode})\n\n` +
          `--- stdout ---\n${stdoutBuffer}\n\n--- stderr ---\n${stderrBuffer}`
      );
    }

    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) break;
    } catch {
      // not ready yet
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return {
    url,
    stop: async () => {
      if (proc.exitCode !== null) return;
      proc.kill('SIGINT');
      // すぐ落ちない場合に備え、少し待つ
      const exitPromise = once(proc, 'exit');
      const stopTimeoutMs = 5_000;
      await Promise.race([
        exitPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Dev server did not stop')), stopTimeoutMs)),
      ]).catch(() => {
        try {
          proc.kill('SIGKILL');
        } catch {
          // ignore
        }
      });
    },
  };
}

async function measureOnce(baseUrl, { enableVerboseDebug = false } = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await waitForServer(page, baseUrl);

  // デバッグフラグを設定（要求された場合）
  if (enableVerboseDebug) {
    await page.evaluate(() => {
      localStorage.setItem('debug-scheduler-verbose', 'true');
    });
  }

  // タブが描画されるまで待機
  await page.locator('button:has-text("暗記")').first().waitFor({ state: 'visible', timeout: 10_000 });

  const start = performance.now();

  // 暗記タブをクリック
  await page.locator('button:has-text("暗記")').first().click();

  // 暗記UIの主要ボタンが出るまで待つ（= 読み込み完了の代表）
  await page.locator('button[aria-label="分からない"]').waitFor({ state: 'visible', timeout: 10_000 });

  const end = performance.now();

  await browser.close();

  return end - start;
}

async function main() {
  const argUrl = process.argv[2];
  const baseUrlFromEnv = process.env.BASE_URL;
  const providedUrl = baseUrlFromEnv || argUrl || null;

  const host = '127.0.0.1';
  const defaultPort = Number.parseInt(process.env.PORT || '5176', 10);

  const startServerFlag = (process.env.START_SERVER || 'true').toLowerCase();
  const allowStartServer = startServerFlag !== 'false' && startServerFlag !== '0';

  let derivedPort = defaultPort;
  let isLocalUrl = false;
  if (providedUrl) {
    try {
      const u = new URL(providedUrl);
      isLocalUrl = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
      if (u.port) derivedPort = Number.parseInt(u.port, 10);
    } catch {
      // ignore parse error; fall back to defaults
    }
  }

  const shouldAutoStartServer = allowStartServer && (!providedUrl || isLocalUrl);
  const baseUrl = providedUrl;
  const runs = Number.parseInt(process.env.RUNS || '3', 10);

  if (!Number.isFinite(runs) || runs <= 0) {
    throw new Error(`Invalid RUNS: ${process.env.RUNS}`);
  }

  let server = null;
  let urlToMeasure = baseUrl;

  if (shouldAutoStartServer) {
    if (!Number.isFinite(derivedPort) || derivedPort <= 0) {
      throw new Error(`Invalid PORT: ${process.env.PORT}`);
    }

    console.log(`🚀 Starting dev server... (port ${derivedPort})`);
    server = await startDevServer({ host, port: derivedPort });
    urlToMeasure = baseUrl || server.url;
  }

  console.log(`📏 Measuring memorization tab load time`);
  console.log(`   URL: ${urlToMeasure}`);
  console.log(`   RUNS: ${runs}`);

  // 通常モード（デバッグOFF）
  console.log(`\n🔹 Normal mode (verbose debug OFF)`);
  const normalResults = [];
  for (let i = 0; i < runs; i++) {
    const ms = await measureOnce(urlToMeasure, { enableVerboseDebug: false });
    normalResults.push(ms);
    console.log(`   #${i + 1}: ${ms.toFixed(0)} ms`);
  }

  // デバッグモード（verbose debug ON）
  console.log(`\n🔸 Debug mode (verbose debug ON)`);
  const debugResults = [];
  try {
    for (let i = 0; i < runs; i++) {
      const ms = await measureOnce(urlToMeasure, { enableVerboseDebug: true });
      debugResults.push(ms);
      console.log(`   #${i + 1}: ${ms.toFixed(0)} ms`);
    }
  } finally {
    if (server) {
      console.log(`\n🛑 Stopping dev server...`);
      await server.stop();
    }
  }

  const normalSorted = [...normalResults].sort((a, b) => a - b);
  const normalAvg = normalResults.reduce((a, b) => a + b, 0) / normalResults.length;
  const normalP50 = percentile(normalSorted, 0.5);
  const normalP90 = percentile(normalSorted, 0.9);

  const debugSorted = [...debugResults].sort((a, b) => a - b);
  const debugAvg = debugResults.reduce((a, b) => a + b, 0) / debugResults.length;
  const debugP50 = percentile(debugSorted, 0.5);
  const debugP90 = percentile(debugSorted, 0.9);

  console.log(`\n✅ Summary`);
  console.log(`\n🔹 Normal mode (verbose debug OFF):`);
  console.log(`   avg: ${normalAvg.toFixed(0)} ms`);
  if (normalP50 != null) console.log(`   p50: ${normalP50.toFixed(0)} ms`);
  if (normalP90 != null) console.log(`   p90: ${normalP90.toFixed(0)} ms`);

  console.log(`\n🔸 Debug mode (verbose debug ON):`);
  console.log(`   avg: ${debugAvg.toFixed(0)} ms`);
  if (debugP50 != null) console.log(`   p50: ${debugP50.toFixed(0)} ms`);
  if (debugP90 != null) console.log(`   p90: ${debugP90.toFixed(0)} ms`);

  const diff = debugAvg - normalAvg;
  const diffPercent = ((diff / normalAvg) * 100).toFixed(1);
  console.log(`\n📊 Difference:`);
  console.log(`   ${diff >= 0 ? '+' : ''}${diff.toFixed(0)} ms (${diffPercent}%)`);
  if (diff > 100) {
    console.log(`   ⚠️  Debug mode adds significant overhead`);
  } else if (diff < 50) {
    console.log(`   ✅ Debug overhead is minimal`);
  }
}

main().catch((err) => {
  console.error('❌ Measurement failed');
  console.error(err);
  process.exitCode = 1;
});
