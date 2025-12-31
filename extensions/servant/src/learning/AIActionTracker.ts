import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * ワークフロー学習インターフェース（循環参照回避）
 */
export interface IWorkflowLearner {
  learnFromAIActions(actions: AIAction[], limit: number): Promise<number>;
}

/**
 * AI処理の記録
 */
export interface AIAction {
  /** タスクID */
  id: string;

  /** タスク種別 */
  type: 'bug-fix' | 'feature' | 'refactor' | 'test' | 'docs' | 'unknown';

  /** 開始時刻 */
  startTime: Date;

  /** 終了時刻 */
  endTime?: Date;

  /** 変更されたファイル */
  changedFiles: string[];

  /** 追加行数 */
  linesAdded: number;

  /** 削除行数 */
  linesDeleted: number;

  /** AIモデル情報 */
  aiModel?: string;

  /** 成功/失敗 */
  success: boolean;

  /** エラーメッセージ */
  error?: string;

  /** コンパイルエラー数 */
  compileErrors: number;

  /** 違反数 */
  violations: number;
}

/**
 * AI処理ログ
 */
interface AIActionLog {
  actions: AIAction[];
  lastUpdated: string;
}

/**
 * AI処理追跡システム
 *
 * AIがどのファイルをどう変更したかを記録し、
 * 後で自己評価・学習に活用する。
 */
export class AIActionTracker {
  private logPath: string;
  private log: AIActionLog;
  private currentAction: AIAction | null = null;
  private changedFilesSinceLastSave: Set<string> = new Set();
  private fileChangeListener: vscode.Disposable | null = null;
  private isCopilotActive: boolean = false;
  private idleTimer: NodeJS.Timeout | null = null;
  private workflowLearner: IWorkflowLearner | null = null;

  // 自動終了のアイドル時間（ms）
  private static readonly AUTO_END_IDLE_MS = 2 * 60 * 1000;
  // 自動学習の閾値（ログ件数）
  private static readonly AUTO_LEARN_THRESHOLD = 10;
  // 診断の重み付け
  private static readonly DIAGNOSTIC_WEIGHTS = {
    ERROR: 10,
    WARNING: 1,
    INFO: 0.1,
  };

  constructor(workspaceRoot: string) {
    this.logPath = path.join(workspaceRoot, '.vscode', 'ai-action-log.json');
    this.log = this.loadLog();

    // 現状、Copilotの稼働検出が外部から供給されないケースが多い。
    // ログが一切溜まらないのを避けるため、デフォルトは有効として扱う。
    this.isCopilotActive = true;
  }

  /**
   * WorkflowLearnerを設定（自動学習用）
   */
  setWorkflowLearner(learner: IWorkflowLearner): void {
    this.workflowLearner = learner;
  }

  /**
   * 現在アクションが進行中か
   */
  hasActiveAction(): boolean {
    return this.currentAction !== null;
  }

  /**
   * ログを読み込む
   */
  private loadLog(): AIActionLog {
    if (fs.existsSync(this.logPath)) {
      try {
        const content = fs.readFileSync(this.logPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error('Failed to load AI action log:', error);
      }
    }

    return {
      actions: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * ログを保存
   */
  private async saveLog(): Promise<void> {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.log.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.logPath, JSON.stringify(this.log, null, 2), 'utf-8');
  }

  /**
   * Copilot起動状態を設定
   */
  setCopilotActive(active: boolean): void {
    this.isCopilotActive = active;

    if (active) {
      console.log('🤖 [AIActionTracker] Copilot active, starting tracking');
      this.startTracking();
    } else {
      console.log('🤖 [AIActionTracker] Copilot inactive, stopping tracking');
      this.stopTracking();
    }
  }

  /**
   * 追跡を開始
   */
  startTracking(): void {
    if (this.fileChangeListener) {
      return; // Already tracking
    }

    // ファイル変更を監視
    this.fileChangeListener = vscode.workspace.onDidSaveTextDocument((document) => {
      if (!this.isCopilotActive) {
        return;
      }

      const filePath = vscode.workspace.asRelativePath(document.uri);

      // 自動セグメント: 最初の変更でアクション開始
      if (!this.currentAction) {
        const inferred = this.inferTaskType({ files: [filePath] });
        this.startAction(inferred);
      }

      this.changedFilesSinceLastSave.add(filePath);
      console.log(`🤖 [AIActionTracker] File changed: ${filePath}`);

      // アイドルタイマーをリセットし、一定時間無操作なら自動終了
      this.resetIdleTimer();
    });
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    this.idleTimer = setTimeout(() => {
      this.autoEndCurrentAction().catch((err) => {
        console.error('[AIActionTracker] Auto endAction failed:', err);
      });
    }, AIActionTracker.AUTO_END_IDLE_MS);
  }

  private async autoEndCurrentAction(): Promise<void> {
    if (!this.currentAction) return;

    const changedFiles = Array.from(this.changedFilesSinceLastSave);
    const { compileErrors, violations } = this.getDiagnosticsCounts(changedFiles);
    const success = compileErrors === 0;

    await this.endAction({ success, compileErrors, violations });
  }

  private getDiagnosticsCounts(relativeFiles: string[]): {
    compileErrors: number;
    violations: number;
  } {
    const getDiagnostics = vscode.languages?.getDiagnostics;
    if (!getDiagnostics) {
      return { compileErrors: 0, violations: 0 };
    }

    const normalize = (p: string) => p.replace(/\\/g, '/');
    const targets = new Set(relativeFiles.map(normalize));

    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let weightedScore = 0;

    try {
      for (const [uri, diags] of vscode.languages.getDiagnostics()) {
        const rel = normalize(vscode.workspace.asRelativePath(uri));
        if (targets.size > 0 && !targets.has(rel)) continue;

        for (const d of diags) {
          if (d.severity === vscode.DiagnosticSeverity.Error) {
            errorCount += 1;
            weightedScore += AIActionTracker.DIAGNOSTIC_WEIGHTS.ERROR;
          } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
            warningCount += 1;
            weightedScore += AIActionTracker.DIAGNOSTIC_WEIGHTS.WARNING;
          } else if (d.severity === vscode.DiagnosticSeverity.Information) {
            infoCount += 1;
            weightedScore += AIActionTracker.DIAGNOSTIC_WEIGHTS.INFO;
          }
        }
      }
    } catch {
      return { compileErrors: 0, violations: 0 };
    }

    // violations は Warning + Info の重み付き合計（整数化）
    const violations = Math.round(warningCount + infoCount * 0.1);

    return { compileErrors: errorCount, violations };
  }

  /**
   * 追跡を停止
   */
  stopTracking(): void {
    if (this.fileChangeListener) {
      this.fileChangeListener.dispose();
      this.fileChangeListener = null;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * AI処理を開始
   */
  startAction(type: AIAction['type'] = 'unknown'): string {
    const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentAction = {
      id,
      type,
      startTime: new Date(),
      changedFiles: [],
      linesAdded: 0,
      linesDeleted: 0,
      success: false,
      compileErrors: 0,
      violations: 0,
    };

    this.changedFilesSinceLastSave.clear();
    console.log(`🤖 [AIActionTracker] Started action: ${id} (${type})`);

    return id;
  }

  /**
   * AI処理を終了
   */
  async endAction(options: {
    success: boolean;
    error?: string;
    compileErrors?: number;
    violations?: number;
  }): Promise<void> {
    if (!this.currentAction) {
      console.warn('[AIActionTracker] No active action to end');
      return;
    }

    this.currentAction.endTime = new Date();
    this.currentAction.success = options.success;
    this.currentAction.error = options.error;
    this.currentAction.compileErrors = options.compileErrors || 0;
    this.currentAction.violations = options.violations || 0;
    this.currentAction.changedFiles = Array.from(this.changedFilesSinceLastSave);

    // Git diff から行数を取得（簡易版）
    const { linesAdded, linesDeleted } = await this.calculateLineChanges(
      this.currentAction.changedFiles
    );
    this.currentAction.linesAdded = linesAdded;
    this.currentAction.linesDeleted = linesDeleted;

    this.log.actions.push(this.currentAction);
    await this.saveLog();

    console.log(`🤖 [AIActionTracker] Ended action: ${this.currentAction.id}`);
    console.log(
      `   Files: ${this.currentAction.changedFiles.length}, +${linesAdded}/-${linesDeleted}`
    );
    console.log(
      `   Success: ${options.success}, Errors: ${options.compileErrors}, Violations: ${options.violations}`
    );

    this.currentAction = null;
    this.changedFilesSinceLastSave.clear();

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // 自動学習: ログが閾値を超えたら学習実行
    await this.autoLearnIfNeeded();
  }

  /**
   * ログが一定数溜まったら自動で学習実行
   */
  private async autoLearnIfNeeded(): Promise<void> {
    if (!this.workflowLearner) return;

    const totalActions = this.log.actions.length;
    if (totalActions > 0 && totalActions % AIActionTracker.AUTO_LEARN_THRESHOLD === 0) {
      console.log(`🎓 [AIActionTracker] Auto-learning triggered (${totalActions} actions)`);
      try {
        await this.workflowLearner.learnFromAIActions(this.log.actions, 200);
        console.log(`✅ [AIActionTracker] Auto-learning completed`);
      } catch (error) {
        console.error('[AIActionTracker] Auto-learning failed:', error);
      }
    }
  }

  /**
   * 行数の変更を計算（Git diff実測）
   */
  private async calculateLineChanges(files: string[]): Promise<{
    linesAdded: number;
    linesDeleted: number;
  }> {
    if (files.length === 0) {
      return { linesAdded: 0, linesDeleted: 0 };
    }

    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { linesAdded: 0, linesDeleted: 0 };
      }

      // git diff --shortstat HEAD で作業ツリーの変更を集計
      const output = execSync('git diff --shortstat HEAD', {
        cwd: workspaceRoot,
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();

      // 出力例: " 3 files changed, 45 insertions(+), 12 deletions(-)"
      const insertMatch = output.match(/(\d+) insertion/);
      const deleteMatch = output.match(/(\d+) deletion/);

      const linesAdded = insertMatch ? parseInt(insertMatch[1], 10) : 0;
      const linesDeleted = deleteMatch ? parseInt(deleteMatch[1], 10) : 0;

      return { linesAdded, linesDeleted };
    } catch (error) {
      // Git未使用やエラー時はフォールバック（概算）
      const estimatedLines = files.length * 10;
      return {
        linesAdded: estimatedLines,
        linesDeleted: Math.floor(estimatedLines * 0.3),
      };
    }
  }

  /**
   * タスク種別を推定
   */
  inferTaskType(context: {
    commitMessage?: string;
    branchName?: string;
    files?: string[];
  }): AIAction['type'] {
    const text = [context.commitMessage || '', context.branchName || '', ...(context.files || [])]
      .join(' ')
      .toLowerCase();

    if (text.includes('fix') || text.includes('bug')) {
      return 'bug-fix';
    }
    if (text.includes('feature') || text.includes('feat')) {
      return 'feature';
    }
    if (text.includes('refactor')) {
      return 'refactor';
    }
    if (text.includes('test')) {
      return 'test';
    }
    if (text.includes('doc')) {
      return 'docs';
    }

    return 'unknown';
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    totalActions: number;
    successRate: number;
    avgLinesAdded: number;
    avgLinesDeleted: number;
    avgViolations: number;
    avgCompileErrors: number;
    typeDistribution: Record<AIAction['type'], number>;
  } {
    if (this.log.actions.length === 0) {
      return {
        totalActions: 0,
        successRate: 0,
        avgLinesAdded: 0,
        avgLinesDeleted: 0,
        avgViolations: 0,
        avgCompileErrors: 0,
        typeDistribution: {
          'bug-fix': 0,
          feature: 0,
          refactor: 0,
          test: 0,
          docs: 0,
          unknown: 0,
        },
      };
    }

    const successCount = this.log.actions.filter((a) => a.success).length;
    const totalLines = this.log.actions.reduce((sum, a) => sum + a.linesAdded, 0);
    const totalDeleted = this.log.actions.reduce((sum, a) => sum + a.linesDeleted, 0);
    const totalViolations = this.log.actions.reduce((sum, a) => sum + a.violations, 0);
    const totalErrors = this.log.actions.reduce((sum, a) => sum + a.compileErrors, 0);

    const typeDistribution: Record<AIAction['type'], number> = {
      'bug-fix': 0,
      feature: 0,
      refactor: 0,
      test: 0,
      docs: 0,
      unknown: 0,
    };

    this.log.actions.forEach((action) => {
      typeDistribution[action.type]++;
    });

    return {
      totalActions: this.log.actions.length,
      successRate: successCount / this.log.actions.length,
      avgLinesAdded: totalLines / this.log.actions.length,
      avgLinesDeleted: totalDeleted / this.log.actions.length,
      avgViolations: totalViolations / this.log.actions.length,
      avgCompileErrors: totalErrors / this.log.actions.length,
      typeDistribution,
    };
  }

  /**
   * 直近のアクションを取得
   */
  getRecentActions(limit: number = 10): AIAction[] {
    return this.log.actions.slice(-limit).reverse();
  }

  /**
   * 全てのアクションを取得
   */
  getAllActions(): AIAction[] {
    return this.log.actions;
  }

  /**
   * アクションをリセット
   */
  async reset(): Promise<void> {
    this.log = {
      actions: [],
      lastUpdated: new Date().toISOString(),
    };
    await this.saveLog();
    console.log('🤖 [AIActionTracker] Reset all actions');
  }

  /**
   * クリーンアップ
   */
  dispose(): void {
    this.stopTracking();
  }
}
