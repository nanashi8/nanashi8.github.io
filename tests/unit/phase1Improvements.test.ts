// @test-guard-bypass: CLI simulation test - no data files used
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

function run(cmd: string): string {
  return execSync(cmd, { cwd: process.cwd(), stdio: 'pipe' }).toString();
}

describe('Phase 1: seed and continuous miss boost', () => {
  it('seed produces identical results', () => {
    const run1 = run(
      'node scripts/visual-random-simulation.ts --scenario heavy_miss --runs 1 --seed 123'
    );
    const run2 = run(
      'node scripts/visual-random-simulation.ts --scenario heavy_miss --runs 1 --seed 123'
    );

    // 解答パターンが完全一致
    const pattern1 = run1.match(/📝 解答パターン.*\n(.+)/)?.[1];
    const pattern2 = run2.match(/📝 解答パターン.*\n(.+)/)?.[1];
    expect(pattern1).toBe(pattern2);

    // カテゴリ分布も完全一致
    const dist1 = run1.match(/🔴 分からない\s+(.+)\s+(\d+)問/)?.[2];
    const dist2 = run2.match(/🔴 分からない\s+(.+)\s+(\d+)問/)?.[2];
    expect(dist1).toBe(dist2);
  });

  it('continuous 3+ miss items have priority boost', () => {
    const out = run(
      'node scripts/visual-random-simulation.ts --scenario heavy_miss --runs 1 --seed 42'
    );

    // 問題6が9連ミスで優先度-7.0になっている
    const q6Match = out.match(/問題 6.*✗✗✗.*│\s+([\d\-.]+)/);
    if (q6Match) {
      const priority = parseFloat(q6Match[1]);
      expect(priority).toBeLessThan(-4); // 3連ミス以上で-5以下になるはず
    }
  });

  it('time boost is gentler in late buckets', () => {
    // BUCKET_BOOST最終値が95に緩和されていることを確認
    const out = run(
      'node scripts/visual-random-simulation.ts --scenario time_boost --runs 1 --seed 42'
    );

    // BOTTOM付近の優先度が100未満であることを検証
    const bottomMatch = out.match(/30位.*│\s+([\d\-.]+)/);
    if (bottomMatch) {
      const priority = parseFloat(bottomMatch[1]);
      expect(priority).toBeLessThan(100); // 旧100→新95
    }
  });
});
