import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
}

describe('pre-commit-ai-guard.sh (regression)', () => {
  it('バッチ配列の変更（questions.sort）を含む差分なら exit 1 でブロックする', () => {
    const repoRoot = process.cwd();
    const scriptPath = path.join(repoRoot, 'scripts', 'pre-commit-ai-guard.sh');

    const result = spawnSync('sh', [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        AI_GUARD_CHANGED_FILES: 'src/components/MemorizationView.tsx',
        AI_GUARD_DIFF: `diff --git a/src/components/MemorizationView.tsx b/src/components/MemorizationView.tsx\n+questions.sort((a,b)=>0)\n`,
      },
    });

    expect(result.status).toBe(1);
    const output = stripAnsi((result.stdout ?? '') + (result.stderr ?? ''));
    expect(output).toContain('CRITICAL');
    expect(output).toContain('バッチ配列の変更を検出');
    expect(output).toContain('git commit --no-verify');
  });

  it('useEffect依存配列の変更だけなら警告は出すが exit 0', () => {
    const repoRoot = process.cwd();
    const scriptPath = path.join(repoRoot, 'scripts', 'pre-commit-ai-guard.sh');

    const result = spawnSync('sh', [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        AI_GUARD_CHANGED_FILES: 'src/components/SpellingView.tsx',
        AI_GUARD_DIFF: `diff --git a/src/components/SpellingView.tsx b/src/components/SpellingView.tsx\n+useEffect(() => setX(1), [x])\n`,
      },
    });

    expect(result.status).toBe(0);
    const output = stripAnsi((result.stdout ?? '') + (result.stderr ?? ''));
    expect(output).toContain('[HIGH] useEffect依存配列の変更を検出');
    expect(output).toContain('✅ ガードチェック完了');
  });

  it('対象拡張子の変更ファイルが無ければスキップ（exit 0）', () => {
    const repoRoot = process.cwd();
    const scriptPath = path.join(repoRoot, 'scripts', 'pre-commit-ai-guard.sh');

    const result = spawnSync('sh', [scriptPath], {
      cwd: repoRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        AI_GUARD_CHANGED_FILES: '',
        AI_GUARD_DIFF: '',
      },
    });

    expect(result.status).toBe(0);
    const output = stripAnsi((result.stdout ?? '') + (result.stderr ?? ''));
    expect(output).toContain('変更ファイルなし - スキップ');
  });
});
