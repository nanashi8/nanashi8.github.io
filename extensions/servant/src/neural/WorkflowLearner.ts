import * as fs from 'fs';
import * as path from 'path';
import { OptimizationEngine, TaskState } from './OptimizationEngine';
import { simpleGit, SimpleGit } from 'simple-git';
import type { AIAction } from '../learning/AIActionTracker';

/**
 * Git履歴エントリ
 */
export interface GitHistoryEntry {
  /** コミットハッシュ */
  hash: string;
  /** コミットメッセージ */
  message: string;
  /** 変更ファイル */
  files: string[];
  /** タイムスタンプ */
  timestamp: Date;
  /** 成功（次のコミットまでビルドエラーなし） */
  success: boolean;

  /** 推定所要時間（秒） */
  estimatedTimeSec?: number;

  /** 推定違反数（暫定） */
  estimatedViolations?: number;
}

/**
 * タスク分類結果
 */
export interface TaskClassification {
  /** タスク種別 */
  taskType: 'bug-fix' | 'feature' | 'refactor' | 'test' | 'docs' | 'unknown';
  /** 信頼度（0-1） */
  confidence: number;
  /** 判定理由 */
  reason: string;
}

/**
 * ワークフロー学習エンジン
 */
export class WorkflowLearner {
  private optimizationEngine: OptimizationEngine;
  private workspaceRoot: string;
  private git: SimpleGit;
  private historyPath: string;

  constructor(optimizationEngine: OptimizationEngine, workspaceRoot: string) {
    this.optimizationEngine = optimizationEngine;
    this.workspaceRoot = workspaceRoot;
    this.git = simpleGit(workspaceRoot);
    this.historyPath = path.join(workspaceRoot, '.vscode', 'workflow-history.json');

    // Check if it's actually a git repository
    this.git.checkIsRepo().then(isRepo => {
      if (!isRepo) {
        console.log('[WorkflowLearner] Not a git repository, skipping git-based learning');
      }
    }).catch(err => {
      console.error('[WorkflowLearner] Error checking git repository:', err);
    });
  }

  /**
   * AIActionTracker のログから学習
   * （実運用の success / duration / violations をそのまま学習データとして使う）
   */
  public async learnFromAIActions(actions: AIAction[], limit: number = 200): Promise<number> {
    const recent = actions.slice(-limit);
    let learned = 0;

    for (const action of recent) {
      if (!action.endTime) continue;
      if (!action.changedFiles || action.changedFiles.length === 0) continue;

      const start = new Date(action.startTime).getTime();
      const end = new Date(action.endTime).getTime();
      const durationSec = Math.max(1, Math.round((end - start) / 1000));
      const violations = (action.violations || 0) + (action.compileErrors || 0);

      await this.optimizationEngine.learnPattern(
        action.type,
        action.changedFiles,
        action.success,
        durationSec,
        violations
      );
      learned++;
    }

    console.log(`✅ [Workflow] Learned ${learned} patterns from AI actions`);
    return learned;
  }

  /**
   * Git履歴から学習
   */
  public async learnFromGitHistory(limit: number = 100): Promise<void> {
    console.log('📚 [Workflow] Learning from Git history...');

    try {
      // Check if it's a git repository first
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        console.log('⚠️ [Workflow] Not a git repository, skipping git history learning');
        return;
      }

      // Git履歴を取得（新しい→古い順）
      const log = await this.git.log({ maxCount: limit });
      const entries: GitHistoryEntry[] = [];

      for (let i = 0; i < log.all.length; i++) {
        const commit = log.all[i];
        const files = await this.getCommitFiles(commit.hash);
        const timestamp = new Date(commit.date);

        // 所要時間の推定: 直前（より新しい）コミットとの差分
        const prev = i > 0 ? new Date(log.all[i - 1].date) : null;
        const estimatedTimeSec = prev
          ? Math.max(30, Math.min(2 * 60 * 60, Math.round((prev.getTime() - timestamp.getTime()) / 1000)))
          : 300;

        // 成功/失敗の推定: Revert/WIP/Fail 系は失敗寄りとして扱う（完全な真値ではない）
        const msg = (commit.message || '').toLowerCase();
        const success = !(
          msg.startsWith('revert') ||
          msg.includes('wip') ||
          msg.includes('broken') ||
          msg.includes('fail')
        );

        // 違反の推定: lint/format 修正は軽微な違反として 1 を付与
        const estimatedViolations = msg.includes('lint') || msg.includes('format') ? 1 : 0;

        entries.push({
          hash: commit.hash,
          message: commit.message,
          files,
          timestamp,
          success,
          estimatedTimeSec,
          estimatedViolations
        });
      }

      // パターンを抽出して学習
      for (const entry of entries) {
        const classification = this.classifyCommit(entry);

        await this.optimizationEngine.learnPattern(
          classification.taskType,
          entry.files,
          entry.success,
          entry.estimatedTimeSec ?? 300,
          entry.estimatedViolations ?? 0
        );
      }

      console.log(`✅ [Workflow] Learned from ${entries.length} commits`);

      // 履歴を保存
      await this.saveHistory(entries);
    } catch (error) {
      console.error('❌ [Workflow] Failed to learn from Git history:', error);
    }
  }

  /**
   * コミットのファイルを取得
   */
  private async getCommitFiles(hash: string): Promise<string[]> {
    try {
      const result = await this.git.show([hash, '--name-only', '--pretty=format:']);
      return result
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(file => file.trim());
    } catch (error) {
      console.error(`❌ [Workflow] Failed to get files for commit ${hash}:`, error);
      return [];
    }
  }

  /**
   * コミットを分類
   */
  private classifyCommit(entry: GitHistoryEntry): TaskClassification {
    const message = entry.message.toLowerCase();
    const files = entry.files;

    // キーワードベースの分類
    if (message.includes('fix') || message.includes('bug') || message.includes('修正')) {
      return {
        taskType: 'bug-fix',
        confidence: 0.8,
        reason: 'コミットメッセージに "fix" または "bug" が含まれる'
      };
    }

    if (message.includes('test') || files.some(f => f.includes('test') || f.includes('spec'))) {
      return {
        taskType: 'test',
        confidence: 0.9,
        reason: 'テストファイルの変更またはメッセージに "test" が含まれる'
      };
    }

    if (message.includes('docs') || message.includes('readme') || files.some(f => f.endsWith('.md'))) {
      return {
        taskType: 'docs',
        confidence: 0.9,
        reason: 'ドキュメントファイルの変更'
      };
    }

    if (message.includes('refactor') || message.includes('clean') || message.includes('リファクタ')) {
      return {
        taskType: 'refactor',
        confidence: 0.7,
        reason: 'コミットメッセージに "refactor" が含まれる'
      };
    }

    if (message.includes('feat') || message.includes('add') || message.includes('追加')) {
      return {
        taskType: 'feature',
        confidence: 0.7,
        reason: 'コミットメッセージに "feat" または "add" が含まれる'
      };
    }

    return {
      taskType: 'unknown',
      confidence: 0.5,
      reason: '明確な分類キーワードが見つからない'
    };
  }

  /**
   * 現在のタスクを分類
   */
  public async classifyCurrentTask(taskState: TaskState): Promise<TaskClassification> {
    const files = taskState.modifiedFiles;

    // ファイルパターンから推測
    const hasTests = files.some(f => f.includes('test') || f.includes('spec'));
    const hasDocs = files.some(f => f.endsWith('.md'));
    const hasSource = files.some(f => f.endsWith('.ts') || f.endsWith('.js'));

    // テストファイルが含まれる場合
    if (hasTests) {
      return {
        taskType: 'test',
        confidence: hasSource ? 0.8 : 0.9,
        reason: hasSource ? 'テストファイルとソースファイルの変更' : 'テストファイルのみの変更'
      };
    }

    if (hasDocs && !hasSource) {
      return {
        taskType: 'docs',
        confidence: 0.9,
        reason: 'ドキュメントファイルのみの変更'
      };
    }

    if (taskState.taskType && taskState.taskType !== 'unknown') {
      return {
        taskType: taskState.taskType as any,
        confidence: 0.8,
        reason: 'ユーザーが指定したタスク種別'
      };
    }

    return {
      taskType: 'unknown',
      confidence: 0.5,
      reason: 'タスク種別を特定できません'
    };
  }

  /**
   * ワークフロー提案
   */
  public async suggestWorkflow(taskState: TaskState): Promise<{
    classification: TaskClassification;
    recommendation: string;
    steps: string[];
  }> {
    console.log('💡 [Workflow] Suggesting workflow...');

    // タスクを分類
    const classification = await this.classifyCurrentTask(taskState);

    // 最適化提案を取得
    const optimization = await this.optimizationEngine.optimize(taskState);

    // 推奨ワークフローを生成
    const { recommendation, steps } = this.generateWorkflowRecommendation(
      classification,
      optimization
    );

    return {
      classification,
      recommendation,
      steps
    };
  }

  /**
   * ワークフロー推奨を生成
   */
  private generateWorkflowRecommendation(
    classification: TaskClassification,
    optimization: any
  ): { recommendation: string; steps: string[] } {
    let recommendation = '';
    let steps: string[] = [];

    switch (classification.taskType) {
      case 'bug-fix':
        recommendation = 'バグ修正ワークフロー';
        steps = [
          '1. テストを追加して不具合を再現',
          '2. 原因となるファイルを特定',
          '3. 修正を実装',
          '4. テストが通ることを確認',
          '5. 関連ファイルへの影響を確認'
        ];
        break;

      case 'feature':
        recommendation = '機能追加ワークフロー';
        steps = [
          '1. インターフェースを定義',
          '2. テストを作成',
          '3. 実装を追加',
          '4. テストを実行',
          '5. ドキュメントを更新'
        ];
        break;

      case 'refactor':
        recommendation = 'リファクタリングワークフロー';
        steps = [
          '1. 既存のテストが通ることを確認',
          '2. 小さな単位でリファクタ',
          '3. 各変更後にテストを実行',
          '4. コードレビューを実施',
          '5. パフォーマンスを確認'
        ];
        break;

      case 'test':
        recommendation = 'テスト追加ワークフロー';
        steps = [
          '1. テスト対象のコードを確認',
          '2. テストケースを設計',
          '3. テストを実装',
          '4. カバレッジを確認',
          '5. エッジケースを追加'
        ];
        break;

      case 'docs':
        recommendation = 'ドキュメント更新ワークフロー';
        steps = [
          '1. 変更内容を確認',
          '2. 関連ドキュメントを特定',
          '3. 内容を更新',
          '4. リンク切れをチェック',
          '5. レビューを依頼'
        ];
        break;

      default:
        recommendation = '汎用ワークフロー';
        steps = [
          '1. 変更内容を計画',
          '2. 小さな単位で実装',
          '3. テストを実行',
          '4. レビューを実施',
          '5. デプロイ'
        ];
    }

    // 最適化提案を追加
    if (optimization.nextActions && optimization.nextActions.length > 0) {
      steps.push('', '次のアクション:');
      steps.push(...optimization.nextActions.map((a: string) => `  ${a}`));
    }

    return { recommendation, steps };
  }

  /**
   * 履歴を保存
   */
  private async saveHistory(entries: GitHistoryEntry[]): Promise<void> {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        entries,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.historyPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('💾 [Workflow] History saved');
    } catch (error) {
      console.error('❌ [Workflow] Failed to save history:', error);
    }
  }

  /**
   * 提案を採用したことを記録（効果測定用）
   */
  public async recordSuggestionAdopted(
    suggestionId: string,
    patternIds: string[],
    wasSuccessful: boolean
  ): Promise<void> {
    console.log(`📊 [Workflow] Recording suggestion adoption: ${suggestionId}`);
    await this.optimizationEngine.recordSuggestionOutcome(
      patternIds,
      true, // wasAccepted
      wasSuccessful
    );
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    totalCommits: number;
    taskTypeDistribution: Record<string, number>;
    avgSuccessRate: number;
  } {
    try {
      if (!fs.existsSync(this.historyPath)) {
        return {
          totalCommits: 0,
          taskTypeDistribution: {},
          avgSuccessRate: 0
        };
      }

      const data = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
      const entries: GitHistoryEntry[] = data.entries || [];

      const distribution: Record<string, number> = {};
      for (const entry of entries) {
        const classification = this.classifyCommit(entry);
        distribution[classification.taskType] = (distribution[classification.taskType] || 0) + 1;
      }

      const successCount = entries.filter(e => e.success).length;
      const avgSuccessRate = entries.length > 0 ? successCount / entries.length : 0;

      return {
        totalCommits: entries.length,
        taskTypeDistribution: distribution,
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100
      };
    } catch (error) {
      console.error('❌ [Workflow] Failed to get stats:', error);
      return {
        totalCommits: 0,
        taskTypeDistribution: {},
        avgSuccessRate: 0
      };
    }
  }
}
