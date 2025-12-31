import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { FailurePattern, FileHotspot } from './FailurePattern';
import type { Notifier } from '../ui/Notifier';

const execAsync = promisify(exec);

/**
 * コミット解析結果
 */
export interface CommitAnalysis {
  /** コミットハッシュ */
  hash: string;

  /** コミットメッセージ */
  message: string;

  /** 変更されたファイル */
  files: string[];

  /** 検出された違反パターン */
  violations: string[];

  /** コミット日時 */
  timestamp: Date;

  /** 作成者 */
  author: string;
}

/**
 * Git履歴アナライザー
 *
 * Git履歴を解析して失敗パターンを抽出し、ホットスポットを検出。
 */
export class GitHistoryAnalyzer {
  private workspaceRoot: string;
  private notifier?: Notifier;

  constructor(workspaceRoot: string, notifier?: Notifier) {
    this.workspaceRoot = workspaceRoot;
    this.notifier = notifier;
  }

  /**
   * Git リポジトリかどうかをチェック
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.workspaceRoot });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 直近のコミットを解析
   */
  async analyzeRecentCommits(limit: number = 100): Promise<CommitAnalysis[]> {
    if (!(await this.isGitRepository())) {
      this.notifier?.autoWarning('Servant: Git リポジトリではありません', 'git-not-a-repo');
      return [];
    }

    const commits: CommitAnalysis[] = [];

    try {
      // コミット履歴を取得（ハッシュ、日時、作成者、メッセージ）
      const { stdout } = await execAsync(
        `git log -${limit} --pretty=format:"%H|%aI|%an|%s"`,
        { cwd: this.workspaceRoot }
      );

      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        const [hash, timestamp, author, message] = line.split('|');

        // コミットの変更ファイルを取得
        const files = await this.getChangedFiles(hash);

        // 違反パターンを推測（コミットメッセージから）
        const violations = this.extractViolationsFromMessage(message);

        commits.push({
          hash,
          message,
          files,
          violations,
          timestamp: new Date(timestamp),
          author
        });
      }

      console.log(`✅ Analyzed ${commits.length} commits`);
      return commits;

    } catch (error) {
      console.error('Failed to analyze Git history:', error);
      return [];
    }
  }

  /**
   * 特定のコミットで変更されたファイルを取得
   */
  private async getChangedFiles(hash: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        `git diff-tree --no-commit-id --name-only -r ${hash}`,
        { cwd: this.workspaceRoot }
      );

      return stdout.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * コミットメッセージから違反パターンを抽出
   */
  private extractViolationsFromMessage(message: string): string[] {
    const violations: string[] = [];
    const lowerMessage = message.toLowerCase();

    // キーワードから違反を推測
    const patterns = [
      { keyword: 'fix', pattern: 'bug-fix' },
      { keyword: 'bug', pattern: 'bug-fix' },
      { keyword: 'error', pattern: 'error-handling' },
      { keyword: 'naming', pattern: 'naming-convention' },
      { keyword: 'refactor', pattern: 'code-quality' },
      { keyword: 'type', pattern: 'type-error' },
      { keyword: 'test', pattern: 'test-failure' },
      { keyword: 'lint', pattern: 'lint-error' },
      { keyword: 'format', pattern: 'formatting' }
    ];

    patterns.forEach(({ keyword, pattern }) => {
      if (lowerMessage.includes(keyword)) {
        violations.push(pattern);
      }
    });

    return violations;
  }

  /**
   * ホットスポットを検出
   */
  async detectHotspots(): Promise<FileHotspot[]> {
    const commits = await this.analyzeRecentCommits(100);

    // ファイルごとに変更回数と違反回数を集計
    const fileStats = new Map<string, {
      changeCount: number;
      violations: Map<string, number>;
    }>();

    commits.forEach(commit => {
      commit.files.forEach(file => {
        if (!fileStats.has(file)) {
          fileStats.set(file, { changeCount: 0, violations: new Map() });
        }

        const stats = fileStats.get(file)!;
        stats.changeCount++;

        commit.violations.forEach(violation => {
          stats.violations.set(
            violation,
            (stats.violations.get(violation) || 0) + 1
          );
        });
      });
    });

    // ホットスポット配列に変換
    const hotspots: FileHotspot[] = [];

    fileStats.forEach((stats, file) => {
      const violationCount = Array.from(stats.violations.values())
        .reduce((sum, count) => sum + count, 0);

      const topPatterns = Array.from(stats.violations.entries())
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // リスクスコア = 変更回数 × 違反回数
      const riskScore = Math.min(stats.changeCount * violationCount, 100);

      hotspots.push({
        file,
        violationCount,
        topPatterns,
        riskScore,
        lastViolation: new Date().toISOString()
      });
    });

    // リスクスコア降順でソート
    return hotspots
      .filter(h => h.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 20); // 上位20件
  }

  /**
   * 失敗パターンを抽出
   */
  async extractFailurePatterns(): Promise<FailurePattern[]> {
    const commits = await this.analyzeRecentCommits(100);
    const patternMap = new Map<string, {
      occurrences: number;
      examples: string[];
      files: Set<string>;
    }>();

    commits.forEach(commit => {
      commit.violations.forEach(violation => {
        if (!patternMap.has(violation)) {
          patternMap.set(violation, {
            occurrences: 0,
            examples: [],
            files: new Set()
          });
        }

        const data = patternMap.get(violation)!;
        data.occurrences++;

        if (data.examples.length < 5) {
          data.examples.push(`${commit.hash.slice(0, 7)}: ${commit.message}`);
        }

        commit.files.forEach(file => data.files.add(file));
      });
    });

    // FailurePattern 配列に変換
    const patterns: FailurePattern[] = [];

    patternMap.forEach((data, pattern) => {
      patterns.push({
        pattern,
        category: this.categorizePattern(pattern),
        occurrences: data.occurrences,
        weight: Math.min(0.5 + (data.occurrences * 0.05), 1.0),
        lastOccurred: new Date().toISOString(),
        examples: data.examples,
        recoveries: 0,
        successRate: 0,
        description: `Git履歴から抽出: ${data.occurrences}回発生`,
        affectedFiles: Array.from(data.files)
      });
    });

    return patterns.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * パターンをカテゴリ分類
   */
  private categorizePattern(pattern: string): string {
    if (pattern.includes('naming')) return 'naming';
    if (pattern.includes('type')) return 'type';
    if (pattern.includes('test')) return 'testing';
    if (pattern.includes('lint')) return 'code-quality';
    if (pattern.includes('bug') || pattern.includes('fix')) return 'bug';
    if (pattern.includes('error')) return 'error';
    return 'other';
  }

  /**
   * 統計情報を取得
   */
  async getStats(limit: number = 20): Promise<{
    totalCommits: number;
    analyzedFiles: number;
    totalViolations: number;
    topViolations: Array<{ pattern: string; count: number }>;
  }> {
    const commits = await this.analyzeRecentCommits(limit);
    const fileSet = new Set<string>();
    const violationMap = new Map<string, number>();

    commits.forEach(commit => {
      commit.files.forEach(file => fileSet.add(file));
      commit.violations.forEach(violation => {
        violationMap.set(violation, (violationMap.get(violation) || 0) + 1);
      });
    });

    const topViolations = Array.from(violationMap.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCommits: commits.length,
      analyzedFiles: fileSet.size,
      totalViolations: Array.from(violationMap.values()).reduce((a, b) => a + b, 0),
      topViolations
    };
  }
}
