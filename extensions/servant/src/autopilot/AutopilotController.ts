import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import type { InstructionsLoader } from '../loader/InstructionsLoader';
import type { GitIntegration } from '../git/GitIntegration';
import type { Notifier } from '../ui/Notifier';
import type { AIAction, AIActionTracker } from '../learning/AIActionTracker';
import type { AIEvaluator } from '../learning/AIEvaluator';
import type { FeedbackCollector } from '../learning/FeedbackCollector';
import type { OptimizationEngine, TaskState } from '../neural/OptimizationEngine';
import type { WorkflowLearner } from '../neural/WorkflowLearner';
import type { IncrementalValidator } from '../performance/IncrementalValidator';
import type { NeuralDependencyGraph } from '../neural/NeuralDependencyGraph';
import { AutoInvestigationEngine } from './AutoInvestigationEngine';
import { GoalManager } from '../goals/GoalManager';
import { ConstellationDataGenerator } from '../constellation/ConstellationDataGenerator';
import { ServantWarningLogger } from '../ui/ServantWarningLogger';
import {
  computeRequiredInstructionsForFiles,
  isSpecCheckFresh,
} from '../guard/SpecCheck';

type SuggestionSnapshot = {
  actionId: string;
  patternIds: string[];
  createdAt: number;
  summary: string;
};

type AutopilotPromptMode = 'auto' | 'always' | 'never';

export class AutopilotController {
  private statusBar: vscode.StatusBarItem;
  private suggestionByActionId = new Map<string, SuggestionSnapshot>();
  private snoozedUntil = 0;
  private disposables: vscode.Disposable[] = [];
  private activeTaskState: TaskState | null = null;
  private activeActionId: string | null = null;
  private lastReplanAt = 0;
  private pendingReview: {
    severity: 'error' | 'warning';
    reasons: string[];
    createdAt: number;
    actionId?: string;
  } | null = null;

  private preflightTerminal: vscode.Terminal | null = null;
  private runningPreflight: {
    command: string;
    startedAt: number;
    child: ReturnType<typeof spawn>;
  } | null = null;

  private investigationEngine: AutoInvestigationEngine;

  private postReviewContextByActionId = new Map<
    string,
    { actionId: string; patternIds: string[]; actionSuccess: boolean }
  >();
  private lastPostReviewActionId: string | null = null;
  private lastSpecCheckPromptTime = 0; // Specチェックプロンプトの最終表示時刻
  private warningLogger: ServantWarningLogger;

  private goalManager: GoalManager | null = null;
  private constellationGenerator: ConstellationDataGenerator | null = null;

  private computePlusScore(action: AIAction): number {
    // 1〜7 の範囲で「結果の分かりやすい目安」を出す（詳細はOutput/ログに残す）
    // 成功寄り: +, ++, ..., +++++++
    let score = 4;
    score += action.success ? 2 : -2;

    const compileErrors = action.compileErrors || 0;
    const violations = action.violations || 0;

    score += compileErrors === 0 ? 1 : -2;
    score += violations === 0 ? 0 : -1;

    // 変更が小さいほど安全に寄せたいので、極端な大作業は少し控えめ
    const changedFiles = action.changedFiles?.length ?? 0;
    if (changedFiles >= 30) score -= 1;
    else if (changedFiles >= 15) score -= 0;
    else if (changedFiles > 0) score += 0;

    return Math.max(1, Math.min(7, score));
  }

  private formatPlusScore(score: number): string {
    return '+'.repeat(Math.max(1, Math.min(7, score)));
  }

  constructor(
    private workspaceRoot: string,
    private outputChannel: vscode.OutputChannel,
    private notifier: Notifier,
    private gitIntegration: GitIntegration,
    private instructionsLoader: InstructionsLoader,
    private aiTracker: AIActionTracker,
    private aiEvaluator: AIEvaluator,
    private feedbackCollector: FeedbackCollector,
    private optimizationEngine: OptimizationEngine,
    private workflowLearner: WorkflowLearner,
    private incrementalValidator: IncrementalValidator,
    private graph?: NeuralDependencyGraph
  ) {
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBar.text = 'Servant: Autopilot';
    this.statusBar.tooltip = 'Servant Autopilot（先回り誘導・事後レビュー）';
    this.statusBar.command = 'servant.autopilot.showLastReport';

    // 警告ロガーの初期化
    this.warningLogger = new ServantWarningLogger(outputChannel);

    // 自動調査エンジンの初期化
    this.investigationEngine = new AutoInvestigationEngine(
      outputChannel,
      gitIntegration,
      instructionsLoader
    );

    // Constellation（天体儀）システムの初期化
    if (this.graph) {
      this.goalManager = new GoalManager(workspaceRoot);
      this.constellationGenerator = new ConstellationDataGenerator(this.graph, this.goalManager);
      this.outputChannel.appendLine('🌟 [Autopilot] Constellation system initialized');
    }
  }

  public start(context: vscode.ExtensionContext): void {
    const enabled = vscode.workspace
      .getConfiguration('servant')
      .get<boolean>('autopilot.enabled', true);
    if (!enabled) return;

    this.statusBar.show();
    this.setStatusIdle();

    // 「審議（承認待ち）」をステータスバーから再表示できるようにする
    this.disposables.push(
      vscode.commands.registerCommand('servant.autopilot.review', async () => {
        if (!this.pendingReview) {
          this.setStatusIdle();
          return;
        }
        await this.openReviewPrompt(this.pendingReview);
      })
    );

    // Copilot/AIの返答を取り込み、提案効果や学びを蓄積する
    this.disposables.push(
      vscode.commands.registerCommand(
        'servant.autopilot.ingestPostReviewFromClipboard',
        async () => {
          await this.ingestPostReviewFromClipboard();
        }
      )
    );

    this.disposables.push(
      this.aiTracker.onActionStarted((action) => {
        this.onActionStarted(action).catch((e) => {
          this.outputChannel.appendLine(`[Autopilot] onActionStarted error: ${String(e)}`);
        });
      })
    );

    this.disposables.push(
      this.aiTracker.onActionEnded((action) => {
        this.onActionEnded(action).catch((e) => {
          this.outputChannel.appendLine(`[Autopilot] onActionEnded error: ${String(e)}`);
        });
      })
    );

    // 作業中の「先回り」: 保存のたびにspec-checkの鮮度だけ軽く確認（重い検証はしない）
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        this.onSaved(doc).catch((e) => {
          this.outputChannel.appendLine(`[Autopilot] onSaved error: ${String(e)}`);
        });
      })
    );

    context.subscriptions.push(this.statusBar, ...this.disposables);
  }

  private extractJsonFromText(text: string): string | null {
    const fenced = /```json\s*([\s\S]*?)\s*```/i.exec(text);
    if (fenced?.[1]) return fenced[1].trim();

    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1).trim();
    }
    return null;
  }

  private appendAutopilotInteractionLog(entry: unknown): void {
    try {
      const dir = path.join(this.workspaceRoot, '.aitk', 'autopilot');
      const file = path.join(dir, 'interactions.jsonl');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf-8');
    } catch (e) {
      this.outputChannel.appendLine(`⚠️ [Autopilot] interaction log write failed: ${String(e)}`);
    }
  }

  private async ingestPostReviewFromClipboard(): Promise<void> {
    const actionId = this.lastPostReviewActionId;
    if (!actionId) {
      this.notifier.commandInfo('取り込む対象がありません（直近の事後照会が未生成です）');
      return;
    }

    const ctx = this.postReviewContextByActionId.get(actionId);
    if (!ctx) {
      this.notifier.commandInfo('取り込む対象がありません（内部コンテキストが見つかりません）');
      return;
    }

    const clip = await vscode.env.clipboard.readText();
    const jsonText = this.extractJsonFromText(clip);
    if (!jsonText) {
      this.notifier.commandWarning(
        'クリップボードからJSONを抽出できませんでした（```json ... ``` 形式を推奨）'
      );
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      this.notifier.commandWarning(`JSONのパースに失敗しました: ${String(e)}`);
      return;
    }

    const acceptedRaw = String(parsed?.suggestionAccepted ?? 'unknown');
    const accepted = acceptedRaw === 'yes' ? true : acceptedRaw === 'no' ? false : null;

    if (accepted !== null && ctx.patternIds.length > 0) {
      await this.optimizationEngine.recordSuggestionOutcome(
        ctx.patternIds,
        accepted,
        ctx.actionSuccess
      );
    }

    const entry = {
      kind: 'autopilot-post-review',
      recordedAt: Date.now(),
      actionId: ctx.actionId,
      patternIds: ctx.patternIds,
      actionSuccess: ctx.actionSuccess,
      aiAnswer: parsed,
    };
    this.appendAutopilotInteractionLog(entry);

    this.outputChannel.appendLine('');
    this.outputChannel.appendLine(
      `✅ [Autopilot] 事後照会の返答を取り込みました: action=${ctx.actionId} suggestionAccepted=${acceptedRaw}`
    );
    this.notifier.commandInfo('✅ 事後照会の返答を取り込みました（学習/記録に反映）');
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.preflightTerminal?.dispose();
    this.preflightTerminal = null;
    this.statusBar.dispose();
  }

  private isSnoozed(): boolean {
    return Date.now() < this.snoozedUntil;
  }

  private setStatusIdle(): void {
    if (this.isSnoozed()) {
      this.setStatusSnoozed();
      return;
    }
    this.statusBar.backgroundColor = undefined;
    this.statusBar.text = 'Servant: Autopilot';
    this.statusBar.tooltip = 'Autopilot待機中（クリックで最新レポート）';
    this.statusBar.command = 'servant.autopilot.showLastReport';
  }

  private setStatusAnalyzing(actionId: string): void {
    if (this.isSnoozed()) {
      this.setStatusSnoozed();
      return;
    }
    this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    this.statusBar.text = 'Servant: Autopilot (ANALYZE)';
    this.statusBar.tooltip = `提案/リスクを計算中… (${actionId})`;
  }

  private setStatusSnoozed(): void {
    const minutesLeft = Math.max(0, Math.ceil((this.snoozedUntil - Date.now()) / (60 * 1000)));
    this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    this.statusBar.text = 'Servant: Autopilot (SNOOZED)';
    this.statusBar.tooltip =
      minutesLeft > 0 ? `Autopilotは一時停止中（残り約${minutesLeft}分）` : 'Autopilotは一時停止中';
    this.statusBar.command = 'servant.autopilot.showLastReport';
  }

  private setStatusReviewRequired(opts: { severity: 'error' | 'warning'; reason: string }): void {
    this.statusBar.backgroundColor = new vscode.ThemeColor(
      opts.severity === 'error'
        ? 'statusBarItem.errorBackground'
        : 'statusBarItem.warningBackground'
    );
    this.statusBar.text = 'Servant: Autopilot (REVIEW REQUIRED)';
    this.statusBar.tooltip = `審議（承認）が必要: ${opts.reason}（クリックで審議を開く）`;
    this.statusBar.command = 'servant.autopilot.review';
  }

  private buildCopilotDeliberationTemplate(review: {
    severity: 'error' | 'warning';
    reasons: string[];
    createdAt: number;
    actionId?: string;
  }): string {
    const reasonText = review.reasons.join(' / ') || '要審議';
    const timestamp = new Date(review.createdAt).toLocaleString('ja-JP');
    const actionLine = review.actionId ? review.actionId : '(なし)';

    return [
      'Servant Autopilot: 審議（Copilot用）',
      `論点: ${reasonText}`,
      `Severity: ${review.severity} / ActionId: ${actionLine} / 時刻: ${timestamp}`,
      '',
      '依頼: 最短で安全に進める手順を3〜7ステップで。必要な最小検証セットも。',
      '',
      '補足（空でOK）:',
      '- 目的/完了条件: ',
      '- 触るファイル（分かる範囲）: ',
      '- 制約/避けたいこと: ',
    ].join('\n');
  }

  private async openReviewPrompt(review: {
    severity: 'error' | 'warning';
    reasons: string[];
    createdAt: number;
    actionId?: string;
  }): Promise<void> {
    const reasonText = review.reasons.join(' / ') || '要審議';
    this.setStatusReviewRequired({ severity: review.severity, reason: reasonText });

    // “審議”は承認（または中止）まで止める
    // Output確認が必要な場合は「Outputを開いて審議を続ける」で一旦閉じて再表示する
    let keepAsking = true;
    while (keepAsking) {
      const actionLine = review.actionId
        ? `アクションID: ${review.actionId}`
        : 'アクションID: (なし)';
      const timestamp = new Date(review.createdAt).toLocaleString('ja-JP');

      const selection = await this.notifier.blockingCritical(
        [
          'Servant Autopilot: 審議（承認）',
          '',
          `論点: ${reasonText}`,
          actionLine,
          `時刻: ${timestamp}`,
          '',
          '要求（承認条件）:',
          '- 何をするか（目的/完了条件）を一言で決める',
          '- 変更順序（最初に触るファイル/最後に触るファイル）を決める',
          '- 影響範囲（壊れそうな箇所）とリスク対策を決める',
          '',
          'ヒント: 既に提案は Output に出ています（必要なら開いて確認）。',
        ].join('\n'),
        '承認して開始',
        'Copilot用テンプレをコピー',
        '型チェックを実行（npm run typecheck）',
        'コミット前検証を実行（Servant）',
        '方針を事前調整…',
        'Outputを開いて審議を続ける',
        '今回は中止（30分）'
      );

      if (selection === '承認して開始') {
        const memo = await vscode.window.showInputBox({
          title: '審議メモ（必須）',
          prompt: '承認の根拠（方針/順序/リスク対策）を短く残してください',
          placeHolder: '例: 影響範囲をgrepで確認→1ファイルずつ修正→最後にtypecheck',
          validateInput: (value) => {
            const v = value.trim();
            if (v.length === 0) return 'メモは必須です';
            if (v.length < 6) return 'もう少し具体的に（6文字以上）';
            return undefined;
          },
        });

        // キャンセルした場合は審議継続
        if (memo === undefined) {
          this.pendingReview = review;
          this.setStatusReviewRequired({ severity: review.severity, reason: reasonText });
          keepAsking = false;
          return;
        }

        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('=== Servant Autopilot: 審議ログ ===');
        this.outputChannel.appendLine(`論点: ${reasonText}`);
        if (review.actionId) this.outputChannel.appendLine(`Action: ${review.actionId}`);
        this.outputChannel.appendLine(`決定: 承認して開始`);
        this.outputChannel.appendLine(`メモ: ${memo.trim()}`);

        this.pendingReview = null;
        this.setStatusIdle();
        keepAsking = false;
        return;
      }

      if (selection === 'Copilot用テンプレをコピー') {
        const template = this.buildCopilotDeliberationTemplate(review);
        await vscode.env.clipboard.writeText(template);
        this.outputChannel.appendLine(
          '[Autopilot] Copilot用テンプレをクリップボードへコピーしました'
        );
        this.notifier.commandInfo(
          'Copilot用テンプレをコピーしました（チャットに貼り付けてください）'
        );
        continue;
      }

      if (selection === '方針を事前調整…') {
        await vscode.commands.executeCommand('servant.autopilot.adjust');
        // 調整後も審議は継続（同じ理由で再提示）
        continue;
      }

      if (selection === '型チェックを実行（npm run typecheck）') {
        const ts = new Date().toLocaleString('ja-JP');
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(`[Autopilot] Preflight started (${ts}): npm run typecheck`);
        if (review.actionId)
          this.outputChannel.appendLine(
            `[Autopilot] Context: action=${review.actionId} / deliberation=${reasonText}`
          );
        this.runPreflightCommand('npm run typecheck');
        continue;
      }

      if (selection === 'コミット前検証を実行（Servant）') {
        const ts = new Date().toLocaleString('ja-JP');
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(
          `[Autopilot] Preflight started (${ts}): Servant Validate Before Commit`
        );
        if (review.actionId)
          this.outputChannel.appendLine(
            `[Autopilot] Context: action=${review.actionId} / deliberation=${reasonText}`
          );
        await vscode.commands.executeCommand('servant.validateBeforeCommit');
        continue;
      }

      if (selection === 'Outputを開いて審議を続ける') {
        this.outputChannel.show(true);
        continue;
      }

      if (selection === '今回は中止（30分）') {
        this.pendingReview = null;
        this.applySnooze(30);
        keepAsking = false;
        return;
      }

      // ×/Esc は審議継続（ステータスバーから再提示）
      this.pendingReview = review;
      this.setStatusReviewRequired({ severity: review.severity, reason: reasonText });
      keepAsking = false;
      return;
    }
  }

  private runPreflightCommand(command: string): void {
    // 速度重視: 終了コード/所要時間を取るため、拡張側でプロセス実行する。
    // 例外時のみターミナル実行へフォールバック。
    if (this.runningPreflight) {
      this.outputChannel.appendLine(
        `[Autopilot] Preflight is already running: ${this.runningPreflight.command}`
      );
      this.notifier.commandWarning(`Preflightが実行中です: ${this.runningPreflight.command}`);
      return;
    }

    const startedAt = Date.now();
    const child = spawn(command, {
      cwd: this.workspaceRoot,
      shell: true,
      env: process.env,
    });
    this.runningPreflight = { command, startedAt, child };

    this.outputChannel.show(true);
    this.outputChannel.appendLine(`[Autopilot] Preflight running: ${command}`);

    child.stdout?.on('data', (chunk) => {
      this.outputChannel.append(String(chunk));
    });

    child.stderr?.on('data', (chunk) => {
      this.outputChannel.append(String(chunk));
    });

    child.on('close', (code, signal) => {
      const finishedAt = Date.now();
      const ms = finishedAt - startedAt;
      this.runningPreflight = null;

      if (signal) {
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(
          `[Autopilot] Preflight aborted (signal=${signal}) after ${ms}ms: ${command}`
        );
        this.notifier.commandError(`Preflightが中断されました: ${command}`);
        return;
      }

      const exitCode = typeof code === 'number' ? code : -1;
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(
        `[Autopilot] Preflight finished (exit=${exitCode}) in ${ms}ms: ${command}`
      );

      if (exitCode === 0) {
        this.notifier.commandInfo(`Preflight成功: ${command}`);
      } else {
        this.notifier.commandError(`Preflight失敗(Exit ${exitCode}): ${command}`);
      }
    });

    child.on('error', (err) => {
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(`[Autopilot] Preflight spawn error: ${String(err)}`);
      this.runningPreflight = null;

      // フォールバック: どうしても実行できない場合はターミナル送信
      if (!this.preflightTerminal) {
        this.preflightTerminal = vscode.window.createTerminal({
          name: 'Servant: Preflight',
          cwd: this.workspaceRoot,
        });
      }
      this.preflightTerminal.show(true);
      this.preflightTerminal.sendText(command, true);
    });
  }

  private buildCopilotPostReviewPrompt(params: {
    action: AIAction;
    suggestion?: SuggestionSnapshot;
  }): string {
    const { action, suggestion } = params;
    const timestamp = new Date().toLocaleString('ja-JP');

    const lines: string[] = [];
    lines.push('Servant Autopilot: 事後照会（Copilot/AI向け）');
    lines.push(`時刻: ${timestamp}`);
    lines.push(`Action: ${action.id} (${action.type})`);
    lines.push(
      `Result: ${action.success ? 'SUCCESS' : 'FAIL'} | errors=${action.compileErrors} | warnings=${action.violations}`
    );
    lines.push('');

    if (suggestion) {
      lines.push('【参考: 直前の提案（事前誘導）】');
      lines.push(`- 提案サマリ: ${suggestion.summary}`);
      lines.push(`- patternIds: ${suggestion.patternIds.join(', ')}`);
      lines.push('');
    }

    lines.push('依頼: 次の2点を、可能な範囲で評価・提案してください。');
    lines.push(
      '制約: ユーザーへの追加質問はしない。不明な点は「unknown」として扱い、推測する場合は推測だと明示する。'
    );
    lines.push('');
    lines.push('Q1. 今回、他にもっと良い進め方はありましたか？');
    lines.push('- より安全/速い順序、最小検証セット、避けるべき落とし穴の提案をください');
    lines.push('');
    lines.push('出力フォーマット（必須・コピペ用）:');
    lines.push('```json');
    lines.push('{');
    lines.push('  "suggestionAccepted": "yes" | "no" | "unknown",');
    lines.push('  "betterApproach": "...",');
    lines.push('  "minimalVerification": ["..."],');
    lines.push('  "risks": ["..."]');
    lines.push('}');
    lines.push('```');

    lines.push('');
    lines.push(
      '取り込み: Copilotの回答(JSON)をコピーした後、コマンド「Servant: Ingest Autopilot Post-Review (from Clipboard)」を実行してください。'
    );

    return lines.join('\n');
  }

  private applySnooze(minutes: number): void {
    this.snoozedUntil = Date.now() + minutes * 60 * 1000;
    this.setStatusSnoozed();
  }

  private getAutopilotPromptMode(): AutopilotPromptMode {
    return vscode.workspace
      .getConfiguration('servant')
      .get<AutopilotPromptMode>('autopilot.promptMode', 'auto');
  }

  private shouldRevealOutputOnStart(): boolean {
    return vscode.workspace
      .getConfiguration('servant')
      .get<boolean>('autopilot.revealOutputOnStart', true);
  }

  private getLargeWorkThresholdFiles(): number {
    const threshold = vscode.workspace
      .getConfiguration('servant')
      .get<number>('autopilot.largeWorkThresholdFiles', 20);
    return Number.isFinite(threshold) && threshold > 0 ? threshold : 20;
  }

  private async onSaved(_doc: vscode.TextDocument): Promise<void> {
    if (this.isSnoozed()) return;

    const config = vscode.workspace.getConfiguration('servant');
    const proactiveSpecCheckEnabled = config.get<boolean>('autopilot.proactiveSpecCheck', true);
    const closedLoopEnabled = config.get<boolean>('autopilot.closedLoopReplanOnSave', false);

    if (!proactiveSpecCheckEnabled && !closedLoopEnabled) return;

    // 1) Specチェック（軽いガード）
    if (proactiveSpecCheckEnabled) {
      const absFiles = await this.gitIntegration.getWorkingTreeFiles(this.workspaceRoot);
      if (absFiles.length === 0) return;

      const maxAgeHours = config.get<number>('specCheck.maxAgeHours', 24);

      const required = computeRequiredInstructionsForFiles(
        this.workspaceRoot,
        absFiles,
        this.instructionsLoader.getInstructions()
      );

      const freshness = isSpecCheckFresh(this.workspaceRoot, maxAgeHours, required);
      if (!freshness.ok) {
        // Specチェックは“審議（承認待ち）”として可視化する（ただし承認ボタンは出さず、記録を促す）
        this.pendingReview = {
          severity: 'error',
          reasons: ['Specチェック'],
          createdAt: Date.now(),
        };
        this.setStatusReviewRequired({ severity: 'error', reason: 'Specチェック' });

        // 構造化ログを出力（AI対応用）
        this.warningLogger.logSpecCheckWarning(required, maxAgeHours);

        // Specチェックで止めた場合は、閉ループも回さない
        return;
      }
    }

    // 2) 閉ループ: 保存→増分検証→再計画（軽量・スロットル付き）
    if (closedLoopEnabled && this.activeTaskState && this.activeActionId) {
      const throttleMs = config.get<number>('autopilot.closedLoopThrottleMs', 8000);
      const now = Date.now();
      if (now - this.lastReplanAt < throttleMs) return;

      const fsPath = _doc.uri.fsPath;
      const rel = path.relative(this.workspaceRoot, fsPath).replace(/\\/g, '/');
      if (!rel || rel.startsWith('..')) return;

      const results = await this.incrementalValidator.validateIncremental([fsPath]);
      const violations = results.get(fsPath) ?? [];

      const errorCount = violations.filter((v) => v.severity === 'error').length;
      const warningCount = violations.filter((v) => v.severity === 'warning').length;
      if (errorCount === 0 && warningCount === 0) return;

      const nextTaskState: TaskState = {
        ...this.activeTaskState,
        currentFile: rel,
        modifiedFiles: this.activeTaskState.modifiedFiles.includes(rel)
          ? this.activeTaskState.modifiedFiles
          : [rel, ...this.activeTaskState.modifiedFiles],
      };

      try {
        const suggestion = await this.optimizationEngine.optimize(nextTaskState);

        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(
          '=== Servant Autopilot: 閉ループ再計画（save→validate→replan） ==='
        );
        this.outputChannel.appendLine(
          `Trigger: save + violations (errors=${errorCount}, warnings=${warningCount})`
        );
        this.outputChannel.appendLine(`File: ${rel}`);
        this.outputChannel.appendLine('--- 次に変更すべきファイル (Top 3) ---');
        suggestion.recommendedOrder.slice(0, 3).forEach((file, index) => {
          const risk = suggestion.risks.find((r) => r.file === file);
          const mark = risk ? ` [${risk.riskLevel.toUpperCase()}]` : '';
          this.outputChannel.appendLine(`${index + 1}. ${file}${mark}`);
          if (risk) this.outputChannel.appendLine(`   理由: ${risk.reason}`);
        });

        this.activeTaskState = nextTaskState;
        this.lastReplanAt = now;
      } catch (e) {
        this.outputChannel.appendLine(`[Autopilot] Closed-loop replan error: ${String(e)}`);
      }
    }
  }

  private async onActionStarted(action: AIAction): Promise<void> {
    if (this.isSnoozed()) return;

    this.setStatusAnalyzing(action.id);

    // Constellation（天体儀）コンテキストを生成・出力
    if (this.constellationGenerator) {
      try {
        const context = await this.generateConstellationContext();
        if (context) {
          this.outputChannel.appendLine('');
          this.outputChannel.appendLine(context);

          // 通知（プロジェクトゴールを表示）
          const goalName = this.goalManager?.getMainGoal()?.name ?? 'プロジェクトのゴール';
          vscode.window.showInformationMessage(
            `🌟 サーバント: ${goalName}に向かって作業を進めます`
          );
        }
      } catch (error) {
        this.outputChannel.appendLine(
          `⚠️ [Autopilot] Constellation context generation failed: ${error}`
        );
      }
    }

    const autoOptimize = vscode.workspace
      .getConfiguration('servant')
      .get<boolean>('autopilot.autoOptimizeOnStart', true);
    if (!autoOptimize) return;

    // 現在の作業対象ファイル集合を決める（staged → working tree → アクティブファイル）
    const editor = vscode.window.activeTextEditor;
    const activeAbs = editor?.document?.uri?.fsPath;

    let targetAbsFiles = await this.gitIntegration.getStagedFilesFromSCM();
    if (targetAbsFiles.length === 0) {
      targetAbsFiles = await this.gitIntegration.getWorkingTreeFiles(this.workspaceRoot);
    }

    const targetRelFiles = targetAbsFiles
      .map((p) => path.relative(this.workspaceRoot, p))
      .filter((p) => p && !p.startsWith('..'));

    const activeRel = activeAbs ? path.relative(this.workspaceRoot, activeAbs) : undefined;

    const modifiedFiles = targetRelFiles.length > 0 ? targetRelFiles : activeRel ? [activeRel] : [];

    const currentFile = activeRel;

    if (modifiedFiles.length === 0 && !currentFile) return;

    const taskState: TaskState = {
      taskType: action.type,
      currentFile,
      modifiedFiles:
        currentFile && !modifiedFiles.includes(currentFile)
          ? [currentFile, ...modifiedFiles]
          : modifiedFiles,
      startTime: new Date(),
    };

    // 閉ループのために現在タスク状態を保持
    this.activeTaskState = taskState;
    this.activeActionId = action.id;

    await this.optimizationEngine.loadPatterns();

    const suggestion = await this.optimizationEngine.optimize(taskState);
    const workflow = await this.workflowLearner.suggestWorkflow(taskState);

    const largeWorkThresholdFiles = this.getLargeWorkThresholdFiles();
    const isLargeWork = taskState.modifiedFiles.length >= largeWorkThresholdFiles;

    // Outputに“最善の入口”を常に書く（通知は最小）
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('=== Servant Autopilot: 事前誘導（最善手順の提案） ===');
    this.outputChannel.appendLine(`アクション: ${action.type} (${action.id})`);
    this.outputChannel.appendLine(
      `推定タスク: ${workflow.classification.taskType} (信頼度: ${(workflow.classification.confidence * 100).toFixed(0)}%)`
    );
    this.outputChannel.appendLine(`推奨ワークフロー: ${workflow.recommendation}`);
    this.outputChannel.appendLine(
      `作業量: 変更対象 ${taskState.modifiedFiles.length} ファイル${isLargeWork ? '（大作業）' : ''}`
    );
    this.outputChannel.appendLine('--- 推奨手順 ---');
    workflow.steps.forEach((s) => this.outputChannel.appendLine(s));
    this.outputChannel.appendLine('--- 次に変更すべきファイル (Top 5) ---');
    suggestion.recommendedOrder.slice(0, 5).forEach((file, index) => {
      const risk = suggestion.risks.find((r) => r.file === file);
      const mark = risk ? ` [${risk.riskLevel.toUpperCase()}]` : '';
      this.outputChannel.appendLine(`${index + 1}. ${file}${mark}`);
      if (risk) this.outputChannel.appendLine(`   理由: ${risk.reason}`);
    });
    this.outputChannel.appendLine('--- 次のアクション ---');
    suggestion.nextActions.forEach((a) => this.outputChannel.appendLine(`- ${a}`));

    const hasHighRisk = suggestion.risks.some((r) => r.riskLevel === 'high');

    this.suggestionByActionId.set(action.id, {
      actionId: action.id,
      patternIds: suggestion.patternIds,
      createdAt: Date.now(),
      summary: hasHighRisk
        ? '高リスクが予測されています。先に提案順序/指示書を確認推奨。'
        : '提案をOutputに出しました（必要なら参照）。',
    });

    if (hasHighRisk && isLargeWork) {
      this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      this.statusBar.text = 'Servant: Autopilot (RISK/LARGE)';
      this.statusBar.tooltip = '高リスク + 大作業。方針を固めてから進めてください。';
    } else if (hasHighRisk) {
      this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      this.statusBar.text = 'Servant: Autopilot (RISK)';
      this.statusBar.tooltip = '高リスク。方針を固めてから進めてください。';
    } else if (isLargeWork) {
      this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.statusBar.text = 'Servant: Autopilot (LARGE)';
      this.statusBar.tooltip = '大作業。作業を分割/順序確定してから進めてください。';
    } else {
      this.statusBar.backgroundColor = undefined;
      this.statusBar.text = 'Servant: Autopilot (OK)';
      this.statusBar.tooltip = '提案をOutputに出力済み。';
    }

    if (this.shouldRevealOutputOnStart()) {
      this.outputChannel.show(true);
    }

    const promptMode = this.getAutopilotPromptMode();
    const shouldBlockForApproval = promptMode === 'always' && (hasHighRisk || isLargeWork);
    const shouldSoftPrompt = promptMode === 'auto' && (hasHighRisk || isLargeWork);

    if (shouldBlockForApproval || shouldSoftPrompt) {
      const reasons: string[] = [];
      if (hasHighRisk) reasons.push('高リスク');
      if (isLargeWork) reasons.push('大作業');
      const reasonText = reasons.length > 0 ? `（${reasons.join(' / ')}）` : '';

      this.pendingReview = {
        severity: hasHighRisk ? 'error' : 'warning',
        reasons,
        createdAt: Date.now(),
        actionId: action.id,
      };

      if (shouldBlockForApproval) {
        // 審議（承認）が終わるまで作業開始を止める（promptMode=always のみ）
        await this.openReviewPrompt(this.pendingReview);
        // 承認されていなければ、ここで打ち切る
        if (this.pendingReview) {
          this.outputChannel.appendLine('');
          this.outputChannel.appendLine(
            `🛑 [Autopilot] 審議中のため開始を停止しました ${reasonText}`
          );
          return;
        }
      } else {
        // promptMode=auto は非ブロッキング: 審議モーダルは出さず、ステータスバーから任意で開けるようにする
        const reasonLabel = reasons.join(' / ') || '要審議';
        this.setStatusReviewRequired({
          severity: this.pendingReview.severity,
          reason: reasonLabel,
        });
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine(
          `[Autopilot] ⚠️ 審議（承認）ダイアログは省略しました: ${reasonText}（必要ならステータスバーから審議を開けます）`
        );
      }
    }

    // ここに来るのは「強め通知なし」の場合のみ（ログは常にOutputへ出力済み）
  }

  /**
   * Constellation（天体儀）コンテキストを生成
   * プロジェクトの全体像をAIに提供する
   */
  private async generateConstellationContext(): Promise<string | null> {
    if (!this.constellationGenerator || !this.goalManager) {
      return null;
    }

    try {
      const data = this.constellationGenerator.generate();
      const goal = data.goal;

      // 重要度上位10ファイル
      const topNodes = data.nodes.sort((a, b) => b.priority - a.priority).slice(0, 10);

      const topFilesText = topNodes
        .map((n, i) => {
          const category = n.category !== 'Other' ? ` [${n.category}]` : '';
          const changeInfo =
            n.metadata.changeFrequency > 0.5
              ? ` (変更頻度: ${(n.metadata.changeFrequency * 100).toFixed(0)}%)`
              : '';
          return `${i + 1}. ${n.label}${category} (優先度: ${n.priority.toFixed(2)})${changeInfo}`;
        })
        .join('\n');

      // リスク高いファイル（頻繁に変更 + 重要）
      const riskyNodes = this.constellationGenerator.getRiskyNodes();
      const riskyFilesText =
        riskyNodes.length > 0
          ? riskyNodes
              .slice(0, 5)
              .map(
                (n) =>
                  `- ${n.label} (優先度: ${n.priority.toFixed(2)}, 変更頻度: ${(n.metadata.changeFrequency * 100).toFixed(0)}%)`
              )
              .join('\n')
          : '（該当なし）';

      // カテゴリ別統計
      const categoryStats = this.constellationGenerator.getCategoryStats();
      const categorySummary = Array.from(categoryStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, count]) => `- ${cat}: ${count}ファイル`)
        .join('\n');

      return `
═══════════════════════════════════════════════════════════
🌟 プロジェクトの全体像（天体儀ビュー）
═══════════════════════════════════════════════════════════

## 🎯 プロジェクトのゴール
**${goal.name}**
${goal.description}

## ⭐ 重要度上位ファイル（ゴールに近い）
${topFilesText}

## ⚠️ 注意が必要なファイル（頻繁に変更 + 重要）
${riskyFilesText}

## 📊 ファイルカテゴリ別構成
${categorySummary}

## 💡 推奨アクション
- ゴールに近いファイルを優先的に改善してください
- 変更頻度が高いファイルは、慎重に扱ってください
- 周辺ファイル（優先度 < 0.4）の変更は、影響範囲を確認してください
- 重要度が高いファイルの変更は、テストを追加してください

═══════════════════════════════════════════════════════════
`;
    } catch (error) {
      this.outputChannel.appendLine(
        `❌ [Autopilot] Constellation context generation error: ${error}`
      );
      return null;
    }
  }

  private async onActionEnded(action: AIAction): Promise<void> {
    if (this.isSnoozed()) return;

    // 閉ループ状態をクリア
    if (this.activeActionId === action.id) {
      this.activeActionId = null;
      this.activeTaskState = null;
    }

    const askPost = vscode.workspace
      .getConfiguration('servant')
      .get<boolean>('autopilot.askPostReview', true);

    const plusScore = this.computePlusScore(action);
    const plusText = this.formatPlusScore(plusScore);

    // 事後評価（AI自己評価+フィードバック）を毎回作って保存（表示は必要時だけ）
    const actions = this.aiTracker.getAllActions();
    const metrics = this.aiEvaluator.evaluate(actions);
    await this.aiEvaluator.saveMetrics(metrics);

    const feedback = this.feedbackCollector.collectFeedback(metrics, actions);
    await this.feedbackCollector.saveFeedback(feedback);

    // 失敗/エラーがあった時だけ、目立つ形で“次回に活かす促し”を出す
    const shouldInterrupt = !action.success || action.compileErrors > 0;

    if (shouldInterrupt) {
      // 失敗/エラー時も、まずは短い評価をOutputへ残す（UIより先に“記録”）
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(
        `🧾 [Autopilot] Quick grade: ${plusText} (${plusScore}/7) / action=${action.id} (${action.type})`
      );

      this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      this.statusBar.text = 'Servant: Autopilot (FAIL)';
      this.statusBar.tooltip = '失敗/エラー検出。振り返り推奨。';

      const selection = await this.notifier.critical(
        'Servant Autopilot: 失敗/エラーが検出されました。このまま終えると次回も再発しやすいです。今すぐ振り返りを残してください。',
        '振り返りする',
        'Outputでレポートを見る',
        '今回はスキップ'
      );

      if (selection === 'Outputでレポートを見る') {
        this.feedbackCollector.showFeedback(feedback, this.outputChannel);
        return;
      }

      if (selection !== '振り返りする') {
        return;
      }

      // 追加質問なしで自動調査を実行（失敗時の自己修正ループ）
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(
        '🤖 [Autopilot] 失敗/エラーのため、自動調査（上級SE視点）を実行します...'
      );
      try {
        const snapshot = this.postReviewContextByActionId.get(action.id);
        await this.investigationEngine.investigateAndPropose(action, {
          suggestedPatternIds: snapshot?.patternIds,
          wasAccepted: undefined,
          trigger: 'failure-or-error',
        });
      } catch (e) {
        this.outputChannel.appendLine(`❌ [Autopilot] 自動調査に失敗しました: ${String(e)}`);
      }
    } else {
      // 成功時は静かにOutputへ（通知は出さない）
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(
        `✅ [Autopilot] Action ended successfully: ${action.id} (${action.type}) / 結果: ${plusText} (${plusScore}/7)`
      );
    }

    if (!askPost) return;

    // 事後照会は「ユーザーに質問」ではなく、「Copilot/AI向けプロンプト」を出す
    const suggestion = this.suggestionByActionId.get(action.id);
    if (suggestion) {
      // AI返答の取り込みで学習に反映できるよう、最低限のコンテキストを保持しておく
      this.postReviewContextByActionId.set(action.id, {
        actionId: action.id,
        patternIds: suggestion.patternIds,
        actionSuccess: action.success,
      });
      this.lastPostReviewActionId = action.id;
      this.suggestionByActionId.delete(action.id);
    } else {
      // 提案が無い場合でも、直近の取り込み対象として actionId を保持する
      this.postReviewContextByActionId.set(action.id, {
        actionId: action.id,
        patternIds: [],
        actionSuccess: action.success,
      });
      this.lastPostReviewActionId = action.id;
    }

    const postReviewPrompt = this.buildCopilotPostReviewPrompt({ action, suggestion });

    try {
      await vscode.env.clipboard.writeText(postReviewPrompt);
      await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
      await this.notifier.commandInfo(
        '✅ 事後照会（Copilot/AI向け）のプロンプトをクリップボードにコピーしました。Copilot Chat に貼り付けてください。'
      );
    } catch (e) {
      this.outputChannel.appendLine(
        `❌ 事後照会プロンプトのコピー/Chat起動に失敗しました: ${String(e)}`
      );
    }

    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('=== Servant Autopilot: 事後照会（Copilot/AI向け） ===');
    this.outputChannel.appendLine(postReviewPrompt);

    // 最後に“促し”をOutputへ残す（次回の自分/AIへの導線）
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('=== Servant Autopilot: 事後レビュー（次回に活かす） ===');
    this.outputChannel.appendLine(`Action: ${action.id} (${action.type})`);
    this.outputChannel.appendLine(
      `Result: ${action.success ? 'SUCCESS' : 'FAIL'} | errors=${action.compileErrors} | warnings=${action.violations}`
    );
    this.outputChannel.appendLine(`Quick grade: ${plusText} (${plusScore}/7)`);
    this.outputChannel.appendLine('Suggestion accepted: unknown');

    // レポートは保存済み。必要ならユーザーがステータスバーから開ける。
  }

  /**
   * AI改善案プロンプトを生成
   */
  private async generateAIImprovementPrompt(investigationResult: any, action: any): Promise<void> {
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('🤖 AI改善案プロンプトを生成しています...');

    // 改善案プロンプトを構築
    const prompt = this.buildImprovementPrompt(investigationResult, action);

    // Copilot Chat を開く
    try {
      // プロンプトをクリップボードにコピー
      await vscode.env.clipboard.writeText(prompt);

      // GitHub Copilot Chat を開く
      await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');

      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('✅ AI改善案プロンプトをクリップボードにコピーしました。');
      this.outputChannel.appendLine(
        '   GitHub Copilot Chat に貼り付けて、改善案を生成してください。'
      );
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('='.repeat(80));
      this.outputChannel.appendLine('📋 プロンプト内容:');
      this.outputChannel.appendLine('='.repeat(80));
      this.outputChannel.appendLine(prompt);
      this.outputChannel.appendLine('='.repeat(80));

      await this.notifier.commandInfo(
        '✅ AI改善案プロンプトをクリップボードにコピーしました。Copilot Chat に貼り付けてください。'
      );
    } catch (error) {
      this.outputChannel.appendLine(`❌ Copilot Chat を開けませんでした: ${String(error)}`);
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine('📋 以下のプロンプトを手動でCopilot Chatに貼り付けてください:');
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(prompt);
    }
  }

  /**
   * 改善案プロンプトを構築
   */
  private buildImprovementPrompt(investigationResult: any, action: any): string {
    const lines: string[] = [];

    lines.push('# コード品質改善のリファクタリング依頼');
    lines.push('');
    lines.push(
      'サーバントの自動調査で以下の問題が検出されました。具体的な改善案を提案してください。'
    );
    lines.push('');

    // 総合スコア
    if (investigationResult.qualityReport) {
      const score = investigationResult.qualityReport.overallScore;
      const icon = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
      lines.push(`## 総合スコア: ${icon} ${score}/100`);
      lines.push('');
    }

    // 高優先度の問題
    const highPriorityRecs = investigationResult.recommendations.filter(
      (r: any) => r.priority === 'high'
    );
    if (highPriorityRecs.length > 0) {
      lines.push('## 🔴 高優先度の問題');
      lines.push('');
      highPriorityRecs.forEach((rec: any, index: number) => {
        lines.push(`### ${index + 1}. ${rec.action}`);
        lines.push(`- **理由**: ${rec.reason}`);
        if (rec.details) {
          lines.push(`- **詳細**:`);
          lines.push(
            rec.details
              .split('\n')
              .map((line: string) => `  ${line}`)
              .join('\n')
          );
        }
        lines.push('');
      });
    }

    // 中優先度の問題
    const mediumPriorityRecs = investigationResult.recommendations.filter(
      (r: any) => r.priority === 'medium'
    );
    if (mediumPriorityRecs.length > 0) {
      lines.push('## 🟡 中優先度の問題');
      lines.push('');
      mediumPriorityRecs.forEach((rec: any, index: number) => {
        lines.push(`### ${index + 1}. ${rec.action}`);
        lines.push(`- **理由**: ${rec.reason}`);
        lines.push('');
      });
    }

    // 変更ファイル情報
    if (action.changedFiles && action.changedFiles.length > 0) {
      lines.push('## 📁 変更ファイル');
      lines.push('');
      action.changedFiles.slice(0, 10).forEach((file: string) => {
        lines.push(`- ${file}`);
      });
      if (action.changedFiles.length > 10) {
        lines.push(`- ... 他 ${action.changedFiles.length - 10} ファイル`);
      }
      lines.push('');
    }

    // 依頼内容
    lines.push('## 🎯 依頼内容');
    lines.push('');
    lines.push('上記の問題を解決するために、以下を提案してください:');
    lines.push('');
    lines.push('1. **具体的なリファクタリング手順**');
    lines.push('   - どのファイルをどう変更するか');
    lines.push('   - コードの Before/After を示す');
    lines.push('');
    lines.push('2. **テスト戦略**');
    lines.push('   - 追加すべきテストの種類と内容');
    lines.push('   - テストファイルの配置場所');
    lines.push('');
    lines.push('3. **ドキュメント更新**');
    lines.push('   - 更新すべきREADMEやドキュメント');
    lines.push('   - DECISIONS.mdへの記録内容');
    lines.push('');
    lines.push('4. **実装順序**');
    lines.push('   - どの順番で対応すべきか');
    lines.push('   - 各ステップのリスク評価');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('**注意**: 実装前に、提案内容をレビューして承認してください。');

    return lines.join('\n');
  }
}
