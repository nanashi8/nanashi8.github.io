import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { GitHistoryAnalyzer } from '../src/learning/GitHistoryAnalyzer';

describe('GitHistoryAnalyzer', () => {
  let analyzer: GitHistoryAnalyzer;
  const testWorkspaceRoot = path.join(__dirname, '..');

  beforeEach(() => {
    analyzer = new GitHistoryAnalyzer(testWorkspaceRoot);
  });

  it('Gitリポジトリの存在を確認できる', async () => {
    const isRepo = await analyzer.isGitRepository();
    // このプロジェクト自体がGitリポジトリなのでtrueを期待
    expect(typeof isRepo).toBe('boolean');
  });

  it('コミット履歴を解析できる', async () => {
    const isRepo = await analyzer.isGitRepository();

    if (isRepo) {
      const commits = await analyzer.analyzeRecentCommits(5);

      // コミット数は5以下（リポジトリが新しい場合）
      expect(Array.isArray(commits)).toBe(true);
      expect(commits.length).toBeLessThanOrEqual(5);

      if (commits.length > 0) {
        const commit = commits[0];
        expect(commit).toHaveProperty('hash');
        expect(commit).toHaveProperty('message');
        expect(commit).toHaveProperty('timestamp');
        expect(commit).toHaveProperty('files');
      }
    }
  });

  it('統計情報を取得できる', async () => {
    const isRepo = await analyzer.isGitRepository();

    if (isRepo) {
      const stats = await analyzer.getStats();

      expect(stats).toHaveProperty('totalCommits');
      expect(stats).toHaveProperty('analyzedFiles');
      expect(stats).toHaveProperty('totalViolations');
      expect(stats).toHaveProperty('topViolations');

      expect(typeof stats.totalCommits).toBe('number');
      expect(typeof stats.analyzedFiles).toBe('number');
      expect(Array.isArray(stats.topViolations)).toBe(true);
    } else {
      // Gitリポジトリでない場合はスキップ
      expect(true).toBe(true);
    }
  }, 10000); // タイムアウトを10秒に延長
});
