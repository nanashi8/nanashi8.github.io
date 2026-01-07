#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir } from 'node:fs/promises';
import { cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function run(cmd, args, { cwd } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
      },
    });

    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 0, output });
    });
  });
}

async function ensureDir(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch {
    // ignore
  }
}

async function copyDistContents(distDir, targetDir) {
  const entries = await readdir(distDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(distDir, entry.name);
    const dst = path.join(targetDir, entry.name);
    await cp(src, dst, { recursive: true, force: true });
  }
}

const distDir = path.resolve(process.argv[2] || 'dist');
const repoRoot = process.cwd();

// 1) Resolve repo URL from current git config.
{
  const { code, output } = await run('git', ['config', '--get', 'remote.origin.url'], {
    cwd: repoRoot,
  });
  if (code !== 0) {
    process.stderr.write(output);
    process.exit(code);
  }
  var repoUrl = output.trim();
}

if (!repoUrl) {
  process.stderr.write('[deploy-gh-pages] remote.origin.url is empty.\n');
  process.exit(1);
}

// 2) Clone gh-pages branch into a temp directory (avoids node_modules/.cache issues).
const tmpBase = path.join(os.tmpdir(), 'gh-pages-deploy-');
const tmpDir = await mkdtemp(tmpBase);

await ensureDir(tmpDir);

{
  const { code, output } = await run(
    'git',
    ['clone', '--depth', '1', '--branch', 'gh-pages', '--single-branch', repoUrl, tmpDir],
    { cwd: repoRoot },
  );
  if (code !== 0) {
    process.stderr.write(output);
    process.exit(code);
  }
}

// 3) Replace contents.
{
  await run('git', ['rm', '-r', '--ignore-unmatch', '--quiet', '.'], { cwd: tmpDir });
  await copyDistContents(distDir, tmpDir);
}

// 4) Commit only if something changed.
{
  const addRes = await run('git', ['add', '-A'], { cwd: tmpDir });
  if (addRes.code !== 0) {
    process.stderr.write(addRes.output);
    process.exit(addRes.code);
  }

  const diffRes = await run('git', ['diff', '--cached', '--quiet'], { cwd: tmpDir });
  if (diffRes.code === 0) {
    process.stdout.write('[deploy-gh-pages] No changes to publish; done.\n');
    process.exit(0);
  }

  // Ensure identity (fallback to existing config if present).
  await run('git', ['config', 'user.email', 'actions@github.com'], { cwd: tmpDir });
  await run('git', ['config', 'user.name', 'gh-pages-bot'], { cwd: tmpDir });

  const commitRes = await run('git', ['commit', '-m', 'Deploy'], { cwd: tmpDir });
  if (commitRes.code !== 0) {
    process.stderr.write(commitRes.output);
    process.exit(commitRes.code);
  }

  const pushRes = await run('git', ['push', 'origin', 'gh-pages'], { cwd: tmpDir });
  if (pushRes.code !== 0) {
    process.stderr.write(pushRes.output);
    process.exit(pushRes.code);
  }

  process.stdout.write('[deploy-gh-pages] Published to gh-pages.\n');
}
