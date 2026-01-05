#!/usr/bin/env node

/**
 * Spec check record command
 *
 * 目的:
 * - コード変更前に必須指示ファイルを確認したことを“記録”し、ガード/サーバントが参照できるようにする。
 *
 * 使い方:
 *   node scripts/record-spec-check.mjs --note "<作業内容>"
 *
 * 出力:
 *   .aitk/spec-check.json
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.join(__dirname, '..');
const AITK_DIR = path.join(WORKSPACE_ROOT, '.aitk');
const RECORD_PATH = path.join(AITK_DIR, 'spec-check.json');

const REQUIRED_INSTRUCTIONS = [
  '.aitk/instructions/mandatory-spec-check.instructions.md',
  '.aitk/instructions/meta-ai-priority.instructions.md',
];

function parseArgs(argv) {
  const args = {
    note: '',
    print: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--note') {
      args.note = argv[i + 1] || '';
      i++;
      continue;
    }
    if (a === '--print') {
      args.print = true;
      continue;
    }
    if (a === '--force') {
      args.force = true;
      continue;
    }
  }

  return args;
}

function getGitInfo() {
  const safe = (cmd) => {
    try {
      return execSync(cmd, { cwd: WORKSPACE_ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return '';
    }
  };

  return {
    branch: safe('git rev-parse --abbrev-ref HEAD'),
    head: safe('git rev-parse HEAD'),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(AITK_DIR)) {
    fs.mkdirSync(AITK_DIR, { recursive: true });
  }

  const record = {
    version: 1,
    recordedAt: new Date().toISOString(),
    requiredInstructions: REQUIRED_INSTRUCTIONS,
    note: args.note,
    git: getGitInfo(),
  };

  if (!args.force && fs.existsSync(RECORD_PATH)) {
    // 既存の記録があれば上書きするが、情報を少し残す
    try {
      const prev = JSON.parse(fs.readFileSync(RECORD_PATH, 'utf-8'));
      record.previousRecordedAt = prev.recordedAt;
    } catch {
      // ignore
    }
  }

  fs.writeFileSync(RECORD_PATH, JSON.stringify(record, null, 2) + '\n', 'utf-8');

  if (args.print) {
    process.stdout.write(JSON.stringify(record, null, 2) + '\n');
  } else {
    process.stdout.write(`✅ Recorded spec check: ${path.relative(WORKSPACE_ROOT, RECORD_PATH)}\n`);
  }
}

main();
