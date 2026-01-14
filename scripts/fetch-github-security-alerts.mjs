#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function parseArgs(argv) {
  const args = {
    repo: undefined,
    state: 'open',
    out: undefined,
    include: 'dependabot,code-scanning,secret-scanning',
    raw: true,
    transport: 'auto', // auto | gh | token
    severity: undefined, // code-scanning filter: high|medium|low|note|warning|error
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') args.repo = argv[++i];
    else if (a === '--state') args.state = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--include') args.include = argv[++i];
    else if (a === '--no-raw') args.raw = false;
    else if (a === '--transport') args.transport = argv[++i];
    else if (a === '--severity') args.severity = argv[++i];
    else if (a === '-h' || a === '--help') args.help = true;
    else if (a && a.startsWith('--repo=')) args.repo = a.split('=', 2)[1];
    else if (a && a.startsWith('--state=')) args.state = a.split('=', 2)[1];
    else if (a && a.startsWith('--out=')) args.out = a.split('=', 2)[1];
    else if (a && a.startsWith('--include=')) args.include = a.split('=', 2)[1];
    else if (a && a.startsWith('--transport=')) args.transport = a.split('=', 2)[1];
    else if (a && a.startsWith('--severity=')) args.severity = a.split('=', 2)[1];
    else {
      // ignore unknown args for forward-compat
    }
  }

  return args;
}

function printHelp() {

  console.log(`\nUsage:\n  npm run security:alerts -- [options]\n\nOptions:\n  --repo <owner/name>           Target repo (default: inferred from git origin)\n  --state <open|fixed|dismissed|all>  Alert state (default: open)\n  --include <csv>               dependabot,code-scanning,secret-scanning (default: all)\n  --severity <level>            Filter code-scanning by severity (high|medium|low|note|warning|error)\n  --out <path>                  Write JSON output (default: scripts/output/github-security-alerts-<date>.json)\n  --no-raw                      Only write summary (no raw alert arrays)\n  --transport <auto|gh|token>   Use gh CLI or token (default: auto)\n\nAuth:\n  Preferred: GitHub CLI (gh) logged in.\n  Alternative: set GITHUB_TOKEN (or GH_TOKEN) with appropriate read permissions.\n`);
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
}

function hasGh() {
  const r = run('gh', ['--version']);
  return r.status === 0;
}

function ghAuthOk() {
  const r = run('gh', ['auth', 'status', '-h', 'github.com']);
  return r.status === 0;
}

function detectRepoFromGitOrigin() {
  const r = run('git', ['remote', 'get-url', 'origin']);
  if (r.status !== 0) {
    throw new Error(`Failed to read git origin: ${r.stderr || r.stdout || 'unknown error'}`);
  }
  const url = (r.stdout || '').trim();

  // git@github.com:owner/repo.git
  let m = url.match(/^git@github\.com:([^/]+)\/([^/]+?)(\.git)?$/);
  if (m) return `${m[1]}/${m[2]}`;

  // https://github.com/owner/repo(.git)
  m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
  if (m) return `${m[1]}/${m[2]}`;

  // other common forms
  m = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(\.git)?$/);
  if (m) return `${m[1]}/${m[2]}`;

  throw new Error(`Could not infer owner/repo from origin URL: ${url}`);
}

function normalizeRepo(repo) {
  if (!repo) return repo;
  const trimmed = repo.trim();
  if (!trimmed) return undefined;
  // Allow full URL too
  const m = trimmed.match(/github\.com[/:]([^/]+)\/([^/]+?)(\.git)?$/);
  if (m) return `${m[1]}/${m[2]}`;
  return trimmed;
}

function pickToken() {
  return (
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GITHUB_ACCESS_TOKEN ||
    ''
  ).trim();
}

async function fetchPaginated({ baseUrl, token, pathWithQuery }) {
  const out = [];

  // If query already has per_page/page, keep it; otherwise add per_page=100
  const hasPerPage = /(^|[?&])per_page=/.test(pathWithQuery);
  const sep = pathWithQuery.includes('?') ? '&' : '?';
  const basePath = hasPerPage ? pathWithQuery : `${pathWithQuery}${sep}per_page=100`;

  for (let page = 1; page < 1000; page++) {
    const url = new URL(baseUrl);
    url.pathname = basePath.split('?')[0];
    const query = basePath.includes('?') ? basePath.split('?')[1] : '';
    url.search = query ? `?${query}` : '';

    if (!/(^|[?&])page=/.test(url.search)) {
      url.search += (url.search ? '&' : '?') + `page=${page}`;
    }

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const msg = `HTTP ${res.status} ${res.statusText} for ${url} ${text ? `\n${text}` : ''}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    const json = await res.json();
    const items = Array.isArray(json) ? json : [json];

    if (items.length === 0) break;
    out.push(...items);

    // If less than per_page, no more pages
    if (items.length < 100) break;
  }

  return out;
}

function parseGhJson(stdout) {
  const text = (stdout || '').trim();
  if (!text) return [];

  // 1) single JSON value
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : [v];
  } catch {
    // continue
  }

  // 2) JSON-per-line (or multiple arrays/objects)
  const parts = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];
  for (const p of parts) {
    try {
      const v = JSON.parse(p);
      if (Array.isArray(v)) out.push(...v);
      else out.push(v);
    } catch {
      // ignore non-JSON lines
    }
  }
  return out;
}

function ghApiPaginated(pathWithQuery) {
  const r = run('gh', ['api', '--paginate', '-H', 'Accept: application/vnd.github+json', pathWithQuery]);
  if (r.status !== 0) {
    const stderr = (r.stderr || '').trim();
    const stdout = (r.stdout || '').trim();
    throw new Error(`gh api failed for ${pathWithQuery}\n${stderr || stdout || 'unknown error'}`);
  }
  return parseGhJson(r.stdout);
}

function inc(map, key) {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
}

function topNCountMap(map, n = 10) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ key: k, count: v }));
}

function summarizeDependabot(alerts) {
  const bySeverity = {};
  const byEcosystem = {};
  for (const a of alerts) {
    const severity = (a?.security_advisory?.severity || a?.security_vulnerability?.severity || '').toLowerCase();
    inc(bySeverity, severity || 'unknown');
    const eco = a?.dependency?.package?.ecosystem || 'unknown';
    inc(byEcosystem, eco);
  }
  return {
    count: alerts.length,
    bySeverity,
    topEcosystems: topNCountMap(byEcosystem, 10),
  };
}

function summarizeCodeScanning(alerts) {
  const bySecuritySeverityLevel = {};
  const byRuleSeverity = {};
  const byTool = {};
  const byPath = {};
  const byRuleId = {};
  const byRuleName = {};

  for (const a of alerts) {
    const level = (
      a?.rule?.security_severity_level ||
      a?.security_severity_level ||
      a?.most_recent_instance?.analysis?.security_severity_level ||
      ''
    ).toLowerCase();
    inc(bySecuritySeverityLevel, level || 'unknown');

    const ruleSeverity = (a?.rule?.severity || '').toLowerCase();
    inc(byRuleSeverity, ruleSeverity || 'unknown');

    const tool = a?.tool?.name || a?.most_recent_instance?.analysis?.tool?.name || 'unknown';
    inc(byTool, tool);

    const path = a?.most_recent_instance?.location?.path || 'unknown';
    inc(byPath, path);

    const ruleId = a?.rule?.id || 'unknown';
    inc(byRuleId, ruleId);
    const ruleName = a?.rule?.name || 'unknown';
    inc(byRuleName, ruleName);
  }

  return {
    count: alerts.length,
    bySecuritySeverityLevel,
    byRuleSeverity,
    topRuleIds: topNCountMap(byRuleId, 25),
    topRuleNames: topNCountMap(byRuleName, 25),
    topTools: topNCountMap(byTool, 10),
    topPaths: topNCountMap(byPath, 20),
  };
}

function summarizeSecretScanning(alerts) {
  const byState = {};
  const bySecretType = {};
  for (const a of alerts) {
    const state = (a?.state || '').toLowerCase();
    inc(byState, state || 'unknown');
    const secretType = a?.secret_type_display_name || a?.secret_type || 'unknown';
    inc(bySecretType, secretType);
  }
  return {
    count: alerts.length,
    byState,
    topSecretTypes: topNCountMap(bySecretType, 20),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const state = args.state;
  const severityFilter = (args.severity || '').trim().toLowerCase() || undefined;
  const includeSet = new Set(
    (args.include || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const repo = normalizeRepo(args.repo) || detectRepoFromGitOrigin();
  const [owner, name] = repo.split('/', 2);
  if (!owner || !name) throw new Error(`Invalid repo: ${repo}`);

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const defaultOut = `scripts/output/github-security-alerts-${y}${m}${d}.json`;
  const outPath = args.out || defaultOut;

  const wantsGh = args.transport === 'gh' || args.transport === 'auto';
  const wantsToken = args.transport === 'token' || args.transport === 'auto';

  let transport = 'token';
  if (wantsGh && hasGh() && ghAuthOk()) {
    transport = 'gh';
  } else if (wantsToken) {
    const token = pickToken();
    if (token) transport = 'token';
    else {
      const hint = hasGh()
        ? 'Run `gh auth login` (recommended) or set GITHUB_TOKEN.'
        : 'Install GitHub CLI (gh) or set GITHUB_TOKEN.';
      throw new Error(
        `No auth available. ${hint}\n` +
          `- gh detected: ${hasGh() ? 'yes' : 'no'}\n` +
          `- gh authenticated: ${hasGh() && ghAuthOk() ? 'yes' : 'no'}\n` +
          `- GITHUB_TOKEN set: ${pickToken() ? 'yes' : 'no'}`
      );
    }
  }

  const baseUrl = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
  const token = transport === 'token' ? pickToken() : '';

  const result = {
    generatedAt: new Date().toISOString(),
    repo,
    state,
    transport,
    summary: {
      dependabot: undefined,
      codeScanning: undefined,
      secretScanning: undefined,
    },
    raw: args.raw
      ? {
          dependabot: undefined,
          codeScanning: undefined,
          secretScanning: undefined,
        }
      : undefined,
    errors: [],
  };

  async function getAlerts(kind, pathWithQuery) {
    if (transport === 'gh') {
      return ghApiPaginated(pathWithQuery);
    }
    return fetchPaginated({ baseUrl, token, pathWithQuery });
  }

  // Dependabot
  if (includeSet.has('dependabot')) {
    try {
      const path = `/repos/${owner}/${name}/dependabot/alerts?state=${encodeURIComponent(state)}&per_page=100`;
      const alerts = await getAlerts('dependabot', path);
      result.summary.dependabot = summarizeDependabot(alerts);
      if (args.raw) result.raw.dependabot = alerts;
    } catch (e) {
      result.errors.push({ kind: 'dependabot', message: String(e?.message || e) });
    }
  }

  // Code scanning (CodeQL)
  if (includeSet.has('code-scanning')) {
    try {
      const path = `/repos/${owner}/${name}/code-scanning/alerts?state=${encodeURIComponent(state)}&per_page=100`;
      let alerts = await getAlerts('code-scanning', path);
      if (severityFilter) {
        alerts = alerts.filter((a) => {
          const ruleSeverity = (a?.rule?.severity || '').toLowerCase();
          const securityLevel = (a?.rule?.security_severity_level || a?.security_severity_level || '').toLowerCase();
          return ruleSeverity === severityFilter || securityLevel === severityFilter;
        });
      }
      result.summary.codeScanning = summarizeCodeScanning(alerts);
      if (args.raw) result.raw.codeScanning = alerts;
    } catch (e) {
      result.errors.push({ kind: 'code-scanning', message: String(e?.message || e) });
    }
  }

  // Secret scanning
  if (includeSet.has('secret-scanning')) {
    try {
      const path = `/repos/${owner}/${name}/secret-scanning/alerts?state=${encodeURIComponent(state)}&per_page=100`;
      const alerts = await getAlerts('secret-scanning', path);
      result.summary.secretScanning = summarizeSecretScanning(alerts);
      if (args.raw) result.raw.secretScanning = alerts;
    } catch (e) {
      result.errors.push({ kind: 'secret-scanning', message: String(e?.message || e) });
    }
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');


  console.log(`\n✅ GitHub security alerts fetched (${repo})`);

  console.log(`- transport: ${transport}`);

  console.log(`- state: ${state}`);
  if (severityFilter) {

    console.log(`- severity: ${severityFilter}`);
  }

  console.log(`- output: ${outPath}`);

  if (result.summary.dependabot) {

    console.log(`- dependabot: ${result.summary.dependabot.count}`);
  }
  if (result.summary.codeScanning) {

    console.log(`- code-scanning: ${result.summary.codeScanning.count}`);
  }
  if (result.summary.secretScanning) {

    console.log(`- secret-scanning: ${result.summary.secretScanning.count}`);
  }

  if (result.errors.length) {

    console.log(`\n⚠️ Some endpoints failed:`);
    for (const err of result.errors) {

      console.log(`- ${err.kind}: ${err.message}`);
    }
  }
}

main().catch((e) => {

  console.error(`\n❌ Failed: ${e?.message || e}`);
  process.exit(1);
});
