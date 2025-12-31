import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
}

describe('ai-guard-check.mjs (smoke / regression)', () => {
  it('MemorizationView.tsx を対象にすると、危険パターン+必須仕様+チェックリストを出力する', () => {
    const repoRoot = process.cwd();
    const scriptPath = path.join(repoRoot, 'scripts', 'ai-guard-check.mjs');

    const result = spawnSync(process.execPath, [scriptPath, '（テスト）ガード出力の回帰検証', 'src/components/MemorizationView.tsx'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        // 色付きでもstripするが、CIログを読みやすくするため
        NO_COLOR: '1',
      },
    });

    expect(result.status).toBe(0);

    const stdout = stripAnsi(result.stdout ?? '');

    expect(stdout).toContain('リアルタイムガード起動');
    expect(stdout).toContain('危険な変更パターンを検出中');
    expect(stdout).toContain('4個の危険パターンを検出しました');
    expect(stdout).toContain('確認すべき仕様書');

    // 常に含まれるべき仕様（mandatorySpecsのうち、repo内に存在するもの）
    expect(stdout).toContain('ai-failure-prevention.instructions.md');

    // MemorizationView/QuestionScheduler系はバッチ仕様が必須
    expect(stdout).toContain('batch-system-enforcement.instructions.md');

    expect(stdout).toContain('CRITICAL: 修正前の必須チェックリスト');
    expect(stdout).toContain('ガードチェック完了');
  });

  it('ユーザー依頼が未指定なら usage を表示して終了コード1', () => {
    const repoRoot = process.cwd();
    const scriptPath = path.join(repoRoot, 'scripts', 'ai-guard-check.mjs');

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        NO_COLOR: '1',
      },
    });

    expect(result.status).toBe(1);

    const stderr = stripAnsi(result.stderr ?? '');
    const stdout = stripAnsi(result.stdout ?? '');

    expect(stderr + stdout).toContain('使用方法');
    expect(stderr + stdout).toContain('ai-guard-check.mjs');
  });
});
