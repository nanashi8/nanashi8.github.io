#!/usr/bin/env node

/**
 * Data quality checker (lightweight, tracked).
 *
 * Requirements (used by pre-commit hook):
 * - Scan `public/data/` (recursive) for `.json` / `.csv`
 * - Print report lines containing:
 *     "  🔴 エラー: <N>"
 *     "  🟡 警告: <N>"
 * - Write report to `scripts/output/data-quality-report.txt`
 * - Exit with code 1 if errors exist
 */

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const publicDataDir = path.join(repoRoot, 'public', 'data');
const reportPath = path.join(repoRoot, 'scripts', 'output', 'data-quality-report.txt');

/** @typedef {{ level: 'error'|'warning', file: string, message: string, id?: string }} Issue */

function isGrammarUnitFile(filePath) {
  return (
    filePath.includes(`${path.sep}public${path.sep}data${path.sep}grammar${path.sep}`) &&
    /grammar_grade\d+_unit\d+\.json$/.test(path.basename(filePath))
  );
}

function walkFiles(dir) {
  /** @type {string[]} */
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

/** @returns {Issue[]} */
function checkGrammarUnit(filePath, data) {
  /** @type {Issue[]} */
  const issues = [];
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    issues.push({ level: 'error', file: filePath, message: 'Root must be an object' });
    return issues;
  }

  for (const key of ['unit', 'title', 'questions']) {
    if (!(key in data)) {
      issues.push({ level: 'error', file: filePath, message: `Missing required key: ${key}` });
    }
  }

  const questions = data.questions;
  if (questions === undefined) return issues;
  if (!Array.isArray(questions)) {
    issues.push({ level: 'error', file: filePath, message: 'questions must be an array' });
    return issues;
  }

  questions.forEach((q, idx) => {
    if (typeof q !== 'object' || q === null || Array.isArray(q)) {
      issues.push({ level: 'error', file: filePath, message: `questions[${idx}] must be an object` });
      return;
    }
    const id = q.id ? String(q.id) : undefined;
    if (!q.id) issues.push({ level: 'error', file: filePath, message: `questions[${idx}] missing id` });
    if (!q.type)
      issues.push({ level: 'error', file: filePath, message: `questions[${idx}] missing type`, id });
    if (!q.difficulty)
      issues.push({ level: 'warning', file: filePath, message: `questions[${idx}] missing difficulty`, id });
  });

  return issues;
}

/** @returns {Issue[]} */
function scanPublicData() {
  /** @type {Issue[]} */
  const issues = [];

  if (!fs.existsSync(publicDataDir)) {
    issues.push({ level: 'error', file: publicDataDir, message: 'Data directory not found' });
    return issues;
  }

  const files = walkFiles(publicDataDir);

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.json') {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (isGrammarUnitFile(filePath)) {
          issues.push(...checkGrammarUnit(filePath, data));
        }
      } catch (e) {
        issues.push({ level: 'error', file: filePath, message: `Invalid JSON: ${String(e)}` });
      }
    } else if (ext === '.csv') {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (!raw.trim()) {
          issues.push({ level: 'warning', file: filePath, message: 'Empty CSV file' });
          continue;
        }
        // Lightweight: ensure it has at least a header row
        const lines = raw.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) {
          issues.push({ level: 'warning', file: filePath, message: 'CSV has too few rows' });
        }
      } catch (e) {
        issues.push({ level: 'error', file: filePath, message: `Invalid CSV: ${String(e)}` });
      }
    }
  }

  return issues;
}

function writeReport(issues) {
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  /** @type {string[]} */
  const lines = [];
  lines.push('='.repeat(80));
  lines.push('データ品質チェックレポート');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push('📊 統計:');
  lines.push(`  🔴 エラー: ${errors.length}`);
  lines.push(`  🟡 警告: ${warnings.length}`);

  if (errors.length) {
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('🔴 エラー詳細:');
    lines.push('='.repeat(80));
    errors.slice(0, 50).forEach((e) => {
      lines.push(`  📁 ${e.file}${e.id ? ` (id: ${e.id})` : ''}`);
      lines.push(`  💬 ${e.message}`);
      lines.push('');
    });
    if (errors.length > 50) lines.push(`  ... 他 ${errors.length - 50}件`);
  }

  if (warnings.length) {
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('🟡 警告詳細:');
    lines.push('='.repeat(80));
    warnings.slice(0, 50).forEach((w) => {
      lines.push(`  📁 ${w.file}${w.id ? ` (id: ${w.id})` : ''}`);
      lines.push(`  💬 ${w.message}`);
      lines.push('');
    });
    if (warnings.length > 50) lines.push(`  ... 他 ${warnings.length - 50}件`);
  }

  lines.push('');
  lines.push('='.repeat(80));
  if (!errors.length && !warnings.length) lines.push('✅ すべてのチェックに合格しました！');
  else if (!errors.length) lines.push('⚠️  エラーはありませんが、警告があります。');
  else lines.push('❌ エラーが検出されました。修正が必要です。');
  lines.push('='.repeat(80));

  const report = lines.join('\n');

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(report);
  return { errorCount: errors.length, warningCount: warnings.length };
}

function main() {
  const issues = scanPublicData();
  const { errorCount } = writeReport(issues);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
