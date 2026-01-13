import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InstructionsLoader } from './loader/InstructionsLoader';
import { DecisionTreeLoader } from './loader/DecisionTreeLoader';
import { InstructionsDiagnosticsProvider } from './providers/InstructionsDiagnosticsProvider';
import { InstructionsCodeActionProvider, registerQuickFixCommands } from './providers/InstructionsCodeActionProvider';
import { RuleEngine } from './engine/RuleEngine';
import { PreCommitValidator } from './git/PreCommitValidator';
import { GitIntegration } from './git/GitIntegration';
import { HookInstaller } from './git/HookInstaller';
import { ValidationCache } from './performance/ValidationCache';
import { IncrementalValidator } from './performance/IncrementalValidator';
import { AdaptiveGuard } from './learning/AdaptiveGuard';
import { GitHistoryAnalyzer } from './learning/GitHistoryAnalyzer';
import { AIActionTracker } from './learning/AIActionTracker';
import { AIEvaluator } from './learning/AIEvaluator';
import { FeedbackCollector } from './learning/FeedbackCollector';
import { CodeQualityGuard } from './learning/CodeQualityGuard';
import { NeuralDependencyGraph } from './neural/NeuralDependencyGraph';
import { NeuralLearningEngine } from './neural/NeuralLearningEngine';
import { NeuralSignalStore } from './neural/NeuralSignalStore';
import { OptimizationEngine, TaskState } from './neural/OptimizationEngine';
import { WorkflowLearner } from './neural/WorkflowLearner';
import { ProjectContextDB } from './context/ProjectContextDB';
import { ArchitectureAdvisor } from './specialists/ArchitectureAdvisor';
import { Notifier } from './ui/Notifier';
import { AutopilotController } from './autopilot/AutopilotController';
import { ConstellationViewPanel } from './ui/ConstellationViewPanel';
import { quickFixCommit } from './commands/quickFixCommit';
import { ServantChatParticipant } from './chat/ChatParticipant';
import { ProblemsMonitor } from './chat/ProblemsMonitor';
import { ProblemsIntegrationMonitor } from './chat/ProblemsIntegrationMonitor';
import { ServantWarningLogger } from './ui/ServantWarningLogger';
import { ActionsHealthMonitor } from './monitoring/ActionsHealthMonitor';
import type { ViewModeName } from './ui/ViewState';
import {
  recordSpecCheck,
  computeRequiredInstructionsForFiles,
  BASELINE_REQUIRED_INSTRUCTIONS,
  isSpecCheckFresh,
  loadSpecCheckRecord,
} from './guard/SpecCheck';
import { ScriptsGuardRunner } from './guard/ScriptsGuardRunner';
import { DocumentGuard } from './guard/DocumentGuard';
import { globalEventBus, ServantEvents, type EventData } from './core/EventBus';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  console.log('Servant is now active');

  // Output Channel作成
  outputChannel = vscode.window.createOutputChannel('Servant');

  // 実行中の拡張機能が「どのビルド/パス」かを確実に識別するためのログ
  try {
    const ext = context.extension;
    const mode = vscode.ExtensionMode?.[context.extensionMode] ?? String(context.extensionMode);
    outputChannel.appendLine(`[Servant] Extension: ${ext.id} v${ext.packageJSON?.version ?? 'unknown'} (${mode})`);
    outputChannel.appendLine(`[Servant] ExtensionPath: ${ext.extensionPath}`);
  } catch {
    // ignore
  }

  const notifier = new Notifier(outputChannel);

  // ステータスバー更新コールバックを後で設定（updateServantStatusBar定義後）
  let notifierStatusCallbackSet = false;

  // 統合ターミナルにステータスを表示（任意）
  let servantTerminal: vscode.Terminal | null = null;
  const escapeForSingleQuotes = (s: string): string => s.replace(/'/g, `'"'"'`);
  const writeTerminalYellow = (message: string) => {
    const enabled = vscode.workspace
      .getConfiguration('servant')
      .get<boolean>('terminalStatus.enabled', false);
    if (!enabled) return;

    if (!servantTerminal) {
      servantTerminal = vscode.window.createTerminal({ name: 'Servant' });
      context.subscriptions.push(servantTerminal);
    }

    // 目に入るようにターミナルは表示するが、フォーカスは奪わない
    servantTerminal.show(true);

    const safe = escapeForSingleQuotes(message);
    // ANSI yellow: \x1b[33m ... \x1b[0m
    servantTerminal.sendText(`printf '\\x1b[33m${safe}\\x1b[0m\\n'`);
  };

  writeTerminalYellow(`[Servant] Activated: ${new Date().toLocaleString('ja-JP')}`);

  // 保存イベントの「動いてる感」ログ（スパム抑制つき）
  let saveEventCount = 0;
  const lastSaveLoggedAtByFile = new Map<string, number>();
  const SAVE_LOG_THROTTLE_MS = 2000;

  // Servant稼働状況（enable/disable + 活動状況）をステータスバーに表示
  const servantStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 110);
  let lastServantEnabled: boolean | null = null;
  let currentActivity = '待機中';
  const updateServantStatusBar = (activity?: string) => {
    if (activity) {
      currentActivity = activity;
    }
    const enabled = isEnabled();
    servantStatusBar.text = enabled ? `🛡️ Servant: ${currentActivity}` : 'Servant: OFF';
    servantStatusBar.tooltip = enabled
      ? `Servantは有効です\n現在: ${currentActivity}\n\nクリックで詳細表示`
      : 'Servantは無効です（設定: servant.enable を true にすると有効化）';
    servantStatusBar.backgroundColor = enabled
      ? undefined
      : new vscode.ThemeColor('statusBarItem.warningBackground');
    servantStatusBar.command = 'servant.showOutput';
    servantStatusBar.show();

    // ステータスバーの情報を解析してサマリー表示
    if (enabled && activity && warningLogger) {
      const match = activity.match(/監視中\s*\(?(\d+)件.*違反:\s*(\d+).*修正:\s*(\d+)/);
      if (match) {
        const monitored = parseInt(match[1], 10);
        const violations = parseInt(match[2], 10);
        const fixed = parseInt(match[3], 10);
        
        warningLogger.updateStats(monitored, violations, fixed);
        
        // 違反または修正がある時だけサマリーを出力（頻繁すぎないように）
        if (violations > 0 || fixed > 0) {
          warningLogger.logStatusSummary();
        }
      }
    }

    if (lastServantEnabled === null || lastServantEnabled !== enabled) {
      writeTerminalYellow(`[Servant] Status: ${enabled ? 'ON' : 'OFF'} (servant.enable)`);
      lastServantEnabled = enabled;
    }
  };
  updateServantStatusBar();
  context.subscriptions.push(servantStatusBar);

  // EventBusリスナー設定（ステータスバー更新を一元化）
  const eventBusSubscription = globalEventBus.on(
    ServantEvents.STATUS_UPDATE,
    (data: EventData[typeof ServantEvents.STATUS_UPDATE]) => {
      updateServantStatusBar(data.message);
    }
  );
  // EventSubscriptionをvscode.Disposableに変換
  context.subscriptions.push({
    dispose: () => eventBusSubscription.unsubscribe()
  });

  // EventBusのクリーンアップ処理
  context.subscriptions.push({
    dispose: () => globalEventBus.clear()
  });

  // Notifierにステータス更新コールバックを設定（後方互換性のため残す）
  if (!notifierStatusCallbackSet) {
    notifier.setStatusUpdateCallback((status) => {
      updateServantStatusBar(status);
    });
    notifierStatusCallbackSet = true;
  }

  // ステータスバークリックで出力チャネル表示
  const showOutputCommand = vscode.commands.registerCommand('servant.showOutput', () => {
    outputChannel.show();
    // Outputを開いた時にサマリーを表示
    if (warningLogger) {
      warningLogger.logStatusSummary();
    }
  });
  context.subscriptions.push(showOutputCommand);

  // 天体儀ステータスバー（🌟アイコン、常時表示）
  // priority を最高レベル（10000）に設定して、右端に確実に表示
  const constellationStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10000);
  constellationStatusBar.text = '🌟 天体儀';
  constellationStatusBar.tooltip = '天体儀メニューを開く';
  constellationStatusBar.command = 'servant.openConstellationMenu';
  constellationStatusBar.show();
  context.subscriptions.push(constellationStatusBar);

  // Restricted Mode（未信頼ワークスペース）では、拡張は通常「起動しない」扱いになる。
  // ただしユーザー体験としては🌟が見えないのが致命的なので、最小限の導線だけ提供して終了する。
  if (!vscode.workspace.isTrusted) {
    outputChannel.appendLine('[Servant] Workspace is not trusted (Restricted Mode).');

    servantStatusBar.text = 'Servant: TRUST';
    servantStatusBar.tooltip = 'ワークスペースが未信頼のため、Servantのフル機能は無効です。信頼すると有効化されます。';
    servantStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    servantStatusBar.show();

    constellationStatusBar.tooltip = 'ワークスペースを信頼すると天体儀が有効になります';

    // 🌟クリックで信頼導線を出す（この時点では他コマンドは登録しない）
    const showConstellationCommand = vscode.commands.registerCommand('servant.showConstellation', async () => {
      const choice = await vscode.window.showWarningMessage(
        '天体儀を表示するには、このワークスペースを信頼する必要があります。',
        'ワークスペースを信頼'
      );
      if (choice === 'ワークスペースを信頼') {
        await vscode.commands.executeCommand('workbench.action.manageWorkspaceTrust');
      }
    });
    context.subscriptions.push(showConstellationCommand);

    // メニューコマンドも同じ導線へ
    const openConstellationMenuCommand = vscode.commands.registerCommand('servant.openConstellationMenu', async () => {
      await vscode.commands.executeCommand('servant.showConstellation');
    });
    context.subscriptions.push(openConstellationMenuCommand);

    return;
  }

  // ワークスペースルート取得
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    notifier.critical('No workspace folder found');
    return;
  }

  const existsGitMarker = (dir: string): boolean => {
    try {
      const gitPath = path.join(dir, '.git');
      if (!fs.existsSync(gitPath)) return false;

      const stat = fs.lstatSync(gitPath);
      // Worktree/submodule style: .git is a file (gitdir: ...)
      if (stat.isFile()) return true;

      if (stat.isDirectory()) {
        // Standard repo style: .git/HEAD exists
        return fs.existsSync(path.join(gitPath, 'HEAD'));
      }

      return false;
    } catch {
      return false;
    }
  };

  const resolveWorkspaceRoot = (dir: string): string => {
    if (existsGitMarker(dir)) return dir;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return dir;
    }

    const candidates: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (name === 'node_modules' || name === '.git' || name.startsWith('.')) continue;

      const child = path.join(dir, name);
      if (existsGitMarker(child)) {
        candidates.push(child);
      }
    }

    if (candidates.length === 1) return candidates[0];
    if (candidates.length === 0) return dir;

    // Heuristic: prefer a repo that looks like a JS project and/or contains this extension.
    const score = (p: string): number => {
      let s = 0;
      if (fs.existsSync(path.join(p, 'package.json'))) s += 2;
      if (fs.existsSync(path.join(p, 'extensions', 'servant', 'package.json'))) s += 3;
      if (fs.existsSync(path.join(p, 'vite.config.ts'))) s += 1;
      return s;
    };

    candidates.sort((a, b) => score(b) - score(a));
    return candidates[0];
  };

  const rootScore = (p: string): number => {
    let s = 0;
    if (existsGitMarker(p)) s += 5;
    if (fs.existsSync(path.join(p, 'package.json'))) s += 2;
    if (fs.existsSync(path.join(p, 'extensions', 'servant', 'package.json'))) s += 3;
    if (fs.existsSync(path.join(p, 'vite.config.ts'))) s += 1;
    return s;
  };

  const resolvedRoots = workspaceFolders
    .map((wf) => wf.uri.fsPath)
    .map((raw) => ({ raw, resolved: resolveWorkspaceRoot(raw) }));

  // Pick best resolved root (handles multi-root + parent-folder workspace)
  let workspaceRoot = resolvedRoots[0].resolved;
  let workspaceRootRaw = resolvedRoots[0].raw;
  let best = rootScore(workspaceRoot);
  for (const item of resolvedRoots) {
    const s = rootScore(item.resolved);
    if (s > best) {
      best = s;
      workspaceRoot = item.resolved;
      workspaceRootRaw = item.raw;
    }
  }

  outputChannel.appendLine(`[Servant] Workspace root: ${workspaceRoot}`);
  if (workspaceRoot !== workspaceRootRaw) {
    outputChannel.appendLine(`[Servant] Workspace root adjusted: ${workspaceRootRaw} -> ${workspaceRoot}`);
  }

  // 保存イベントをターミナルに出す（成長/稼働の可視化用）
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      const fsPath = doc.uri.fsPath;
      const now = Date.now();

      // ローカル完結の「信号」記録（ターミナル表示の有無に依存させない）
      try {
        if (fsPath.startsWith(workspaceRoot)) {
          const rel = path.relative(workspaceRoot, fsPath).replace(/\\/g, '/');
          if (rel && !rel.startsWith('..')) {
            const store = new NeuralSignalStore(workspaceRoot);
            store.record({
              timestamp: new Date().toISOString(),
              type: 'save',
              target: rel,
              strength: 0.25,
            });
          }
        }
      } catch {
        // ignore
      }

      // コード品質ガードによる検証（リアルタイム失敗検出）
      if (isEnabled()) {
        try {
          const guard = ensureQualityGuard();
          const issues = await guard.validateOnSave(doc);

          if (issues.length > 0) {
            const errorCount = issues.filter(i => i.severity === 'error').length;
            const warningCount = issues.filter(i => i.severity === 'warning').length;

            // 静かに警告：ログのみ（通知なし）
            outputChannel.appendLine(
              `[CodeQualityGuard] ${doc.fileName}: ${errorCount} errors, ${warningCount} warnings`
            );

            updateServantStatusBar(`品質チェック: ${issues.length}件検出`);
            setTimeout(() => updateServantStatusBar('待機中'), 3000);
          }
        } catch (e) {
          outputChannel.appendLine(`[CodeQualityGuard] Error: ${e}`);
        }
      }

      const terminalEnabled = vscode.workspace
        .getConfiguration('servant')
        .get<boolean>('terminalStatus.enabled', false);
      if (!terminalEnabled) return;

      const last = lastSaveLoggedAtByFile.get(fsPath) ?? 0;
      if (now - last < SAVE_LOG_THROTTLE_MS) return;
      lastSaveLoggedAtByFile.set(fsPath, now);

      saveEventCount += 1;
      const relPath = path.isAbsolute(fsPath) ? path.relative(workspaceRoot, fsPath) : fsPath;
      writeTerminalYellow(
        `[Servant] Saved #${saveEventCount}: ${relPath} (${isEnabled() ? 'ON' : 'OFF'})`
      );
    })
  );

  // Instructions Loaderの初期化
  const loader = new InstructionsLoader(context);

  // Decision Tree Loaderの初期化
  const treeLoader = new DecisionTreeLoader(workspaceRoot);

  // Rule Engineの初期化
  const engine = new RuleEngine();

  // パフォーマンス機能の初期化
  const validationCache = new ValidationCache(workspaceRoot);
  const incrementalValidator = new IncrementalValidator(
    validationCache,
    engine,
    loader,
    outputChannel
  );

  // Phase 7: 学習システムの初期化
  const adaptiveGuard = new AdaptiveGuard(context, notifier, globalEventBus);
  // 後方互換性のため既存のコールバックも設定
  adaptiveGuard.setStatusUpdateCallback((status) => {
    updateServantStatusBar(status);
  });
  const gitAnalyzer = new GitHistoryAnalyzer(workspaceRoot, notifier);
  const contextDB = new ProjectContextDB(workspaceRoot);
  const aiTracker = new AIActionTracker(workspaceRoot);
  const aiEvaluator = new AIEvaluator(workspaceRoot);
  const feedbackCollector = new FeedbackCollector(workspaceRoot);

  // Phase 7.5: コード品質ガード（リアルタイム失敗検出）
  let qualityGuard: CodeQualityGuard | null = null;

  // 初期化は遅延実行（最初の保存時）
  const ensureQualityGuard = () => {
    if (!qualityGuard) {
      qualityGuard = new CodeQualityGuard(workspaceRoot, notifier, globalEventBus);
      // 後方互換性のため既存のコールバックも設定
      qualityGuard.setStatusUpdateCallback((status) => {
        updateServantStatusBar(status);
      });
      context.subscriptions.push(qualityGuard);
      outputChannel.appendLine('[Servant] CodeQualityGuard initialized');
    }
    return qualityGuard;
  };

  // Phase 9: ニューラルネットワーク的依存関係グラフ
  const neuralGraph = new NeuralDependencyGraph(workspaceRoot);
  const neuralLearning = new NeuralLearningEngine(neuralGraph, workspaceRoot);

  // Phase 10: 最適化エンジンとワークフロー学習
  const optimizationEngine = new OptimizationEngine(neuralGraph, neuralLearning, workspaceRoot);
  const workflowLearner = new WorkflowLearner(optimizationEngine, workspaceRoot);

  // Phase 11: アーキテクチャアドバイザー
  const architectureAdvisor = new ArchitectureAdvisor(workspaceRoot);

  // AI処理追跡を開始（自動学習のためにWorkflowLearnerを注入）
  aiTracker.setWorkflowLearner(workflowLearner);
  aiTracker.startTracking();

  // Git統合の初期化
  const gitIntegration = new GitIntegration(outputChannel);
  const hookInstaller = new HookInstaller(outputChannel, notifier);
  const preCommitValidator = new PreCommitValidator(
    engine,
    loader,
    outputChannel,
    incrementalValidator,
    notifier
  );

  // Chat Participant の初期化（@servant）
  const chatParticipant = new ServantChatParticipant(context);
  chatParticipant.register();

  // 問題パネルの監視（自動報告機能）
  const problemsMonitor = new ProblemsMonitor(chatParticipant, context);
  problemsMonitor.start();
  context.subscriptions.push(problemsMonitor);

  // 問題パネル統合監視（全ての診断ソースを静かにログ記録）
  const problemsIntegrationMonitor = new ProblemsIntegrationMonitor(outputChannel, workspaceRoot);
  problemsIntegrationMonitor.start();
  context.subscriptions.push(problemsIntegrationMonitor);

  // GitHub Actions 健全性監視（週次で重複/無駄をチェック）
  const warningLogger = new ServantWarningLogger(outputChannel);
  const actionsHealthMonitor = new ActionsHealthMonitor(workspaceRoot, warningLogger, globalEventBus);
  // 後方互換性のため既存のコールバックも設定
  actionsHealthMonitor.setStatusUpdateCallback((status) => {
    updateServantStatusBar(status);
  });
  context.subscriptions.push(actionsHealthMonitor);

  // ドキュメント作成ルール強制（docs/ 配下の新規 Markdown ファイルを監視）
  const documentGuard = new DocumentGuard(workspaceRoot, globalEventBus);
  // 後方互換性のため既存のコールバックも設定
  documentGuard.setStatusUpdateCallback((status) => {
    updateServantStatusBar(status);
  });
  const documentWatcher = documentGuard.startWatching();
  context.subscriptions.push(documentWatcher);
  context.subscriptions.push(documentGuard);
  outputChannel.appendLine('[DocumentGuard] ドキュメント監視を開始しました');

  // 統計情報を定期的に表示（10秒ごと）
  const statsInterval = setInterval(() => {
    const stats = documentGuard.getStats();
    if (stats.monitored > 0) {
      updateServantStatusBar(`📄 監視中 (${stats.monitored}件 | 違反: ${stats.violations} | 修正: ${stats.autoFixed})`);
    }
  }, 10000);
  context.subscriptions.push({ dispose: () => clearInterval(statsInterval) });

  // DocumentGuard コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('servant.validateDocuments', async () => {
      await documentGuard.validateExistingDocuments();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('servant.batchAddFrontMatter', async () => {
      const confirmation = await vscode.window.showWarningMessage(
        'すべてのドキュメントに Front Matter を追加しますか？',
        '実行',
        'キャンセル'
      );
      if (confirmation === '実行') {
        await documentGuard.batchAddFrontMatter();
      }
    })
  );

  // AdaptiveGuard と ChatParticipant の連携
  // 学習完了時に自動的にChatにレポートを送信
  adaptiveGuard.setOnLearningComplete(async (patterns) => {
    await chatParticipant.submitLearningReport(patterns);
  });

  // 学習レポート承認コマンドの登録
  context.subscriptions.push(
    vscode.commands.registerCommand('servant.applyLearningReport', async (patterns) => {
      try {
        await adaptiveGuard.updateInstructions(patterns);
        vscode.window.showInformationMessage('✅ Instructions が更新されました！');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`❌ Instructions の更新に失敗しました: ${errorMessage}`);
      }
    })
  );

  // Autopilot: コマンド暗記ゼロで「事前誘導→事後レビュー」を回す
  const autopilot = new AutopilotController(
    workspaceRoot,
    outputChannel,
    notifier,
    gitIntegration,
    loader,
    aiTracker,
    aiEvaluator,
    feedbackCollector,
    optimizationEngine,
    workflowLearner,
    incrementalValidator,
    neuralGraph  // Constellation用にグラフを渡す
  );
  autopilot.start(context);

  // Diagnostics Providerの初期化
  const diagnosticsProvider = new InstructionsDiagnosticsProvider(loader, treeLoader, context);

  // Code Action Provider (Quick Fix) の初期化
  const codeActionProvider = new InstructionsCodeActionProvider(loader, engine);
  const codeActionDisposable = vscode.languages.registerCodeActionsProvider(
    [
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'typescriptreact' },
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'markdown' },
      { scheme: 'file', language: 'json' }
    ],
    codeActionProvider,
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
    }
  );

  // Quick Fixコマンド登録
  registerQuickFixCommands(context, notifier);

  const validateActiveEditor = async () => {
    updateServantStatusBar('手動検証中');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      notifier.commandInfo('No active editor');
      updateServantStatusBar('待機中');
      return;
    }

    writeTerminalYellow(`[Servant] Validate: ${editor.document.uri.fsPath}`);

    const violations = await diagnosticsProvider.validate(editor.document.uri);

    const learningEnabled = vscode.workspace.getConfiguration('servant').get<boolean>('learning.enabled', true);
    if (learningEnabled) {
      const filePath = editor.document.uri.fsPath;
      const relPath = path.isAbsolute(filePath) ? path.relative(workspaceRoot, filePath) : filePath;

      if (violations.length === 0) {
        // NOTE: recordRecovery は既知パターン名(string)を受け取る。
        // ここでは「手動検証で違反なし」を統計的に扱わない（必要なら将来拡張）。
        await adaptiveGuard.recordRecovery('manual-validate');
      } else {
        for (const v of violations) {
          await adaptiveGuard.recordViolation({
            rule: v.ruleId || 'unknown',
            category: 'diagnostics',
            filePath: relPath,
            message: v.message
          });
        }
      }
    }

    notifier.commandInfo('Instructions validation completed');
    writeTerminalYellow(`[Servant] Validate done: ${violations.length} issues`);
    updateServantStatusBar('待機中');
  };

  const validateBeforeCommit = async () => {
    updateServantStatusBar('コミット前検証中');
    outputChannel.appendLine('[Command] Validate before commit triggered');

    writeTerminalYellow('[Servant] Validate Before Commit: start');

    // staged filesを取得
    const stagedFiles = await gitIntegration.getStagedFilesFromSCM();
    if (stagedFiles.length === 0) {
      notifier.commandInfo('No staged files to validate');
      return;
    }

    // Optional: run repo-local pre-commit guard script inside VS Code.
    // Default is disabled to avoid double-running (the git hook already prefers repo guard).
    const runRepoGuard = vscode.workspace
      .getConfiguration('servant')
      .get<boolean>('guard.runRepoScriptsBeforeCommit', false);

    if (runRepoGuard) {
      const guardRunner = new ScriptsGuardRunner({ kind: 'pre-commit-ai-guard' });
      const guardResult = await guardRunner.run({
        workspaceRoot,
      });

      if (!guardResult.success) {
        if (aiTracker.hasActiveAction()) {
          const errorCount = guardResult.violations.filter((v) => v.severity === 'error').length;
          const warningCount = guardResult.violations.filter((v) => v.severity === 'warning').length;
          await aiTracker.endAction({
            success: false,
            error: 'Repo guard failed',
            compileErrors: errorCount,
            violations: warningCount
          });
        }

        const learningEnabled = vscode.workspace.getConfiguration('servant').get<boolean>('learning.enabled', true);
        if (learningEnabled) {
          for (const v of guardResult.violations) {
            await adaptiveGuard.recordViolation({
              rule: 'repo-guard',
              category: 'preCommit',
              filePath: v.file ?? 'scripts/pre-commit-ai-guard.sh',
              message: v.message
            });
          }
        }

        await preCommitValidator.showViolations(guardResult);
        writeTerminalYellow('[Servant] Validate Before Commit: FAIL (repo guard)');
        throw new Error('Repo guard failed');
      }
    }

    // 検証実行
    const result = await preCommitValidator.checkBeforeCommit(stagedFiles);

    // AIActionTracker: pre-commit結果で現在アクションを確定終了（ログ学習の実信号にする）
    if (aiTracker.hasActiveAction()) {
      const errorCount = result.violations.filter(v => v.severity === 'error').length;
      const warningCount = result.violations.filter(v => v.severity === 'warning').length;
      await aiTracker.endAction({
        success: result.success,
        error: result.success ? undefined : 'Pre-commit validation failed',
        compileErrors: errorCount,
        violations: warningCount
      });
    }

    const learningEnabled = vscode.workspace.getConfiguration('servant').get<boolean>('learning.enabled', true);
    if (learningEnabled) {
      if (result.violations.length === 0) {
        await adaptiveGuard.recordRecovery('pre-commit');
      } else {
        for (const v of result.violations) {
          const relPath = path.isAbsolute(v.file) ? path.relative(workspaceRoot, v.file) : v.file;
          await adaptiveGuard.recordViolation({
            rule: 'pre-commit',
            category: 'preCommit',
            filePath: relPath,
            message: v.message
          });
        }
      }

      // Phase 9.2: pre-commit失敗を逆伝播学習の信号として取り込む（ベストエフォート）
      // - グラフ未構築の場合も、ユーザー要望により自動で構築してから発火する
      if (result.violations.length > 0) {
        try {
          // 1) グラフをロード（無ければ自動構築）
          let loaded = await neuralGraph.loadGraph();
          if (!loaded) {
            outputChannel.appendLine('[NeuralLearning] Neural graph not found. Building automatically...');
            await neuralGraph.buildGraph();

            // Constellationデータ生成（ゴール・優先度・変更頻度）
            const goalManager = new (await import('./goals/GoalManager.js')).GoalManager(workspaceRoot);
            await neuralGraph.updateChangeFrequencies(gitIntegration);
            neuralGraph.computePriorityScores(goalManager);
            await neuralGraph.saveGraph();

            loaded = true;
            outputChannel.appendLine('[NeuralLearning] Neural graph build complete (with Constellation data)');
          }

          if (loaded) {
            // 2) file別に集約して逆伝播
            const byFile = new Map<string, { errors: number; warnings: number; messages: string[] }>();
            for (const v of result.violations) {
              const absOrRel = v.file;
              const rel = path.isAbsolute(absOrRel) ? path.relative(workspaceRoot, absOrRel) : absOrRel;
              const normalized = rel.replace(/\\/g, '/');
              if (!normalized || normalized.startsWith('..')) continue;

              const entry = byFile.get(normalized) ?? { errors: 0, warnings: 0, messages: [] };
              if (v.severity === 'error') entry.errors++;
              else entry.warnings++;
              if (entry.messages.length < 3) entry.messages.push(v.message);
              byFile.set(normalized, entry);
            }

            for (const [failureFile, agg] of byFile.entries()) {
              await neuralLearning.propagateBackward({
                failureFile,
                error: agg.messages.join(' / ') || 'Pre-commit validation failed',
                violations: agg.warnings,
                compileErrors: agg.errors
              });
            }
          }
        } catch (e) {
          outputChannel.appendLine(`[NeuralLearning] Backpropagation failed (ignored): ${e}`);
        }
      }
    }

    // 結果表示
    await preCommitValidator.showViolations(result);

    writeTerminalYellow(
      `[Servant] Validate Before Commit: ${result.success ? 'OK' : 'FAIL'} (${result.violations.length} issues)`
    );

    updateServantStatusBar('待機中');

    // エラーがあればコマンド失敗として返す（Git hookから使用される）
    if (!result.success) {
      throw new Error('Validation failed');
    }
  };

  const recordSpecCheckCommandImpl = async () => {
    const note = await vscode.window.showInputBox({
      title: 'Record Spec Check',
      prompt: '今回の作業内容（任意）を入力してください',
      placeHolder: '例: UD解析の接続点テスト追加 / QuestionScheduler調査'
    });

    // キャンセルは何もしない
    if (note === undefined) {
      return;
    }

    recordSpecCheck(workspaceRoot, note);
    notifier.commandInfo('✅ Specチェックを記録しました（.aitk/spec-check.json）');
  };

  const reviewRequiredInstructionsCommandImpl = async () => {
    const stagedFiles = await gitIntegration.getStagedFiles(workspaceRoot);
    const enforce = stagedFiles.length > 0;

    // staged が無い場合でも baseline は提示する（作業開始導線として）
    const required = enforce
      ? computeRequiredInstructionsForFiles(workspaceRoot, stagedFiles, loader.getInstructions())
      : Array.from(BASELINE_REQUIRED_INSTRUCTIONS);

    // 指示書を順に開く（不足チェックの“照会”を自動化）
    for (const relPath of required) {
      const abs = path.join(workspaceRoot, relPath);
      try {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(abs));
        await vscode.window.showTextDocument(doc, { preview: true, preserveFocus: true });
      } catch {
        // ファイルが無い場合でも継続（ガードは SpecCheck 側で行われる）
      }
    }

    const note = await vscode.window.showInputBox({
      title: 'Review Required Instructions',
      prompt: '確認した指示書/作業内容（任意）を入力してください（stagedがある場合はその対象に対する記録になります）',
      placeHolder: '例: ReadingPassageViewの追加に伴う指示書確認'
    });

    if (note === undefined) {
      return;
    }

    recordSpecCheck(workspaceRoot, note, { requiredInstructions: required });
    notifier.commandInfo('✅ 必須指示書の確認として Specチェックを記録しました');
  };

  const getSpecBookPaths = () => {
    const config = vscode.workspace.getConfiguration('servant');

    const specRelOrAbs = (config.get<string>('specBook.specPath', 'docs/specifications/WORKING_SPEC.md') ?? '').trim();
    const decisionsRelOrAbs = (config.get<string>('specBook.decisionsPath', 'docs/specifications/DECISIONS.md') ?? '').trim();

    const effectiveSpec = specRelOrAbs.length > 0 ? specRelOrAbs : 'docs/specifications/WORKING_SPEC.md';
    const effectiveDecisions = decisionsRelOrAbs.length > 0 ? decisionsRelOrAbs : 'docs/specifications/DECISIONS.md';

    const specAbs = path.isAbsolute(effectiveSpec) ? effectiveSpec : path.join(workspaceRoot, effectiveSpec);
    const decisionsAbs = path.isAbsolute(effectiveDecisions) ? effectiveDecisions : path.join(workspaceRoot, effectiveDecisions);

    return { specAbs, decisionsAbs };
  };

  const ensureFileExists = (absPath: string, initialContent: string) => {
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(absPath)) {
      fs.writeFileSync(absPath, initialContent, 'utf-8');
    }
  };

  const openSpecBookCommandImpl = async () => {
    const { specAbs } = getSpecBookPaths();
    ensureFileExists(
      specAbs,
      [
        '# WORKING SPEC\n',
        '\n',
        '- このファイルは「強制力が働く仕様書（作業の正）」です。\n',
        '- 変更は最小の差分で行い、理由は DECISIONS.md に追記します。\n',
      ].join('')
    );

    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(specAbs));
    await vscode.window.showTextDocument(doc, { preview: false });
    notifier.commandInfo('📖 Working Spec を開きました');
  };

  const appendDecisionLogCommandImpl = async () => {
    const { decisionsAbs } = getSpecBookPaths();
    ensureFileExists(
      decisionsAbs,
      [
        '# DECISIONS\n',
        '\n',
        '- ここは仕様の変更理由・矛盾解消・運用決定のログです。\n',
        '- 形式: `- YYYY-MM-DDTHH:mm:ss.sssZ: 決定内容`\n',
        '\n'
      ].join('')
    );

    const note = await vscode.window.showInputBox({
      title: 'Append Decision Log',
      prompt: '決定した内容（1行）を入力してください',
      placeHolder: '例: Working Specは docs/specifications/WORKING_SPEC.md を正とする'
    });

    if (note === undefined) {
      return;
    }

    const trimmed = note.trim();
    if (trimmed.length === 0) {
      notifier.commandError('空の決定は追記できません');
      return;
    }

    const line = `- ${new Date().toISOString()}: ${trimmed}\n`;
    fs.appendFileSync(decisionsAbs, line, 'utf-8');

    // 「決定した」という行為自体もSpecチェックとしてローカル記録しておく（ゴミではなく行動ログ）
    recordSpecCheck(workspaceRoot, `DecisionLog: ${trimmed}`);

    // 信号としても記録（発火モデルの材料）
    try {
      const store = new NeuralSignalStore(workspaceRoot);
      store.record({
        timestamp: new Date().toISOString(),
        type: 'decision:append',
        target: vscode.workspace.asRelativePath(decisionsAbs).replace(/\\/g, '/'),
        strength: 0.9,
        meta: { note: trimmed }
      });
    } catch {
      // ignore
    }

    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(decisionsAbs));
    await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: true });
    notifier.commandInfo('✅ 決定ログへ追記しました');
  };

  const buildAIContextPacket = async (options?: { openEditor?: boolean; notify?: boolean }) => {
    const openEditor = options?.openEditor ?? false;
    const notify = options?.notify ?? false;

    const config = vscode.workspace.getConfiguration('servant');
    const outputRelOrAbs = (config.get<string>('context.outputPath', '.aitk/context/AI_CONTEXT.md') ?? '').trim();
    const outputAbs = path.isAbsolute(outputRelOrAbs) ? outputRelOrAbs : path.join(workspaceRoot, outputRelOrAbs);

    const { specAbs, decisionsAbs } = getSpecBookPaths();

    const dir = path.dirname(outputAbs);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stagedFiles = await gitIntegration.getStagedFiles(workspaceRoot);

    // 信号: コンテキスト生成
    try {
      const store = new NeuralSignalStore(workspaceRoot);
      store.record({
        timestamp: new Date().toISOString(),
        type: 'context:build',
        strength: 0.6,
        meta: { stagedCount: stagedFiles.length }
      });
    } catch {
      // ignore
    }

    const requiredInstructions = stagedFiles.length
      ? computeRequiredInstructionsForFiles(workspaceRoot, stagedFiles, loader.getInstructions())
      : Array.from(BASELINE_REQUIRED_INSTRUCTIONS);

    const maxAgeHours = config.get<number>('specCheck.maxAgeHours', 24);
    const freshness = isSpecCheckFresh(workspaceRoot, maxAgeHours, requiredInstructions);
    const specCheckRecord = loadSpecCheckRecord(workspaceRoot);

    const safeReadTail = (absPath: string, maxChars: number): string => {
      try {
        if (!fs.existsSync(absPath)) return '(missing)';
        const content = fs.readFileSync(absPath, 'utf-8');
        if (content.length <= maxChars) return content;
        return content.slice(-maxChars);
      } catch {
        return '(unreadable)';
      }
    };

    const nowIso = new Date().toISOString();
    const specRel = vscode.workspace.asRelativePath(specAbs);
    const decisionsRel = vscode.workspace.asRelativePath(decisionsAbs);
    const outputRel = vscode.workspace.asRelativePath(outputAbs);

    const lines: string[] = [];
    lines.push('# AI CONTEXT PACKET');
    lines.push('');
    lines.push(`- generatedAt: ${nowIso}`);
    lines.push('');
    lines.push('## Single Source of Truth');
    lines.push('');
    lines.push(`- WORKING_SPEC: ${specRel}`);
    lines.push(`- DECISIONS: ${decisionsRel}`);
    lines.push('');
    lines.push('## Staged Files');
    lines.push('');

    // --- Related extraction (Neural Graph) ---
    let startNode: string | null = null;
    let startNodeSource: 'signals' | 'activeEditor' | 'stagedFiles' | 'none' = 'none';

    const signalStore = new NeuralSignalStore(workspaceRoot);
    const hotTargets = signalStore.getHotTargets({ windowHours: 24 });
    for (const h of hotTargets) {
      const abs = path.join(workspaceRoot, h.target);
      if (fs.existsSync(abs)) {
        startNode = h.target.replace(/\\/g, '/');
        startNodeSource = 'signals';
        break;
      }
    }

    const editor = vscode.window.activeTextEditor;
    if (!startNode && editor) {
      startNode = vscode.workspace.asRelativePath(editor.document.uri).replace(/\\/g, '/');
      startNodeSource = 'activeEditor';
    } else if (!startNode && stagedFiles.length > 0) {
      const first = stagedFiles[0];
      const rel = path.isAbsolute(first) ? path.relative(workspaceRoot, first) : first;
      startNode = rel.replace(/\\/g, '/');
      startNodeSource = 'stagedFiles';
    }

    // Signals section (final startNodeSource reflected)
    lines.push('## Signals (Recent, Decayed)');
    lines.push('');
    lines.push(`- windowHours: 24`);
    lines.push(`- candidates: ${hotTargets.length}`);
    lines.push(`- startNodeSource: ${startNodeSource}`);
    if (hotTargets.length === 0) {
      lines.push('- (none)');
    } else {
      for (const h of hotTargets.slice(0, 10)) {
        lines.push(`- ${h.target} (hot=${h.score})`);
      }
    }
    lines.push('');

    if (startNode) {
      try {
        // グラフが未構築でも、ここで必ず最新化する（ローカル完結の掌握）
        await neuralGraph.buildGraph();

        // 発火モデル: hotTargets + startNode を seed として伝播
        const seeds: Array<{ file: string; activation: number; source: string; signalTypes?: string }> = [];
        // NOTE: 上位hot targetが存在しない/削除済みの場合、正規化が潰れてseedが弱くなる。
        // 実在ファイルだけで maxHot を計算して分解能を保つ。
        const existingHotScores: number[] = [];
        for (const h of hotTargets.slice(0, 10)) {
          const abs = path.join(workspaceRoot, h.target);
          if (fs.existsSync(abs)) existingHotScores.push(h.score);
        }
        const maxHot = existingHotScores.length > 0 ? Math.max(...existingHotScores) : 0;

        for (const h of hotTargets.slice(0, 5)) {
          const abs = path.join(workspaceRoot, h.target);
          if (!fs.existsSync(abs)) continue;
          const normalized = maxHot > 0 ? h.score / maxHot : 0;

          // signal type 内訳を文字列化
          const typeSummary = h.signalTypes
            .slice(0, 3)
            .map((st) => `${st.type}:${st.contribution.toFixed(2)}`)
            .join(', ');

          seeds.push({
            file: h.target.replace(/\\/g, '/'),
            activation: Math.max(0, Math.min(1, normalized)),
            source: 'signal',
            signalTypes: typeSummary
          });
        }

        // staged files を弱seedとして追加（作業中の文脈を反映）
        for (const f of stagedFiles.slice(0, 5)) {
          const rel = path.isAbsolute(f) ? path.relative(workspaceRoot, f) : f;
          const normalizedRel = rel.replace(/\\/g, '/');
          const abs = path.join(workspaceRoot, normalizedRel);
          if (!normalizedRel || normalizedRel.startsWith('..')) continue;
          if (!fs.existsSync(abs)) continue;
          if (seeds.some((s) => s.file === normalizedRel)) continue;
          // startNodeは後で必ず入るので、重複は避ける
          if (startNode && normalizedRel === startNode) continue;
          seeds.push({ file: normalizedRel, activation: 0.15, source: 'stagedFiles' });
        }

        // startNode を必ず含める（active/staged の場合に特に重要）
        if (!seeds.some((s) => s.file === startNode)) {
          seeds.unshift({ file: startNode, activation: 1.0, source: startNodeSource });
        }

        const propagation = neuralLearning.propagateForwardFromSeeds(
          seeds.map((s) => ({ file: s.file, activation: s.activation }))
        );

        const seedSet = new Set(seeds.map((s) => s.file));

        const related = Array.from(propagation.affectedFiles.entries())
          .filter(([file]) => !seedSet.has(file))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15);

        lines.push('## Related (Neural Propagation)');
        lines.push('');
        lines.push(`- startNode: ${startNode}`);
        lines.push(`- seeds: ${seeds.length}`);
        lines.push(`- affectedFiles: ${propagation.affectedFiles.size}`);
        lines.push(`- computationTimeMs: ${propagation.computationTime}`);
        lines.push('');

        lines.push('### Seeds');
        lines.push('');
        for (const s of seeds) {
          const extra = s.signalTypes ? `, signals=[${s.signalTypes}]` : '';
          lines.push(`- ${s.file} (activation=${s.activation.toFixed(3)}, source=${s.source}${extra})`);
        }
        lines.push('');

        if (related.length === 0) {
          lines.push('- (no related files detected)');
        } else {
          for (const [file, score] of related) {
            lines.push(`- ${file} (activation=${score.toFixed(3)})`);
          }
        }
        lines.push('');
      } catch (error) {
        lines.push('## Related (Neural Propagation)');
        lines.push('');
        lines.push(`- startNode: ${startNode}`);
        lines.push(`- error: ${String(error)}`);
        lines.push('');
      }
    }
    if (stagedFiles.length === 0) {
      lines.push('- (none)');
    } else {
      for (const f of stagedFiles) {
        const rel = path.isAbsolute(f) ? path.relative(workspaceRoot, f) : f;
        lines.push(`- ${rel.replace(/\\/g, '/')}`);
      }
    }
    lines.push('');
    lines.push('## Required Instructions (Enforced)');
    lines.push('');
    for (const p of requiredInstructions) {
      lines.push(`- ${p}`);
    }
    lines.push('');
    lines.push('## SpecCheck Freshness');
    lines.push('');
    if (freshness.ok) {
      lines.push(`- ok: true`);
      lines.push(`- recordedAt: ${freshness.recordedAt}`);
      lines.push(`- ageHours: ${freshness.ageHours.toFixed(2)}`);
    } else {
      lines.push(`- ok: false`);
      lines.push(`- reason: ${freshness.reason}`);
      if (freshness.ageHours !== undefined) lines.push(`- ageHours: ${freshness.ageHours.toFixed(2)}`);
      if (freshness.reason === 'missing_required_instructions' && freshness.missingInstructions?.length) {
        lines.push('');
        lines.push('### Missing Instructions');
        lines.push('');
        for (const m of freshness.missingInstructions) {
          lines.push(`- ${m}`);
        }
      }
    }
    lines.push('');
    lines.push('## Latest SpecCheck Record (Raw)');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(specCheckRecord ?? null, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('## Recent DECISIONS (Tail)');
    lines.push('');
    lines.push('```');
    lines.push(safeReadTail(decisionsAbs, 4000));
    lines.push('```');
    lines.push('');
    lines.push('## Notes');
    lines.push('');
    lines.push('- This packet is generated locally (no external model).');
    lines.push(`- Output path: ${outputRel}`);
    lines.push('');

    fs.writeFileSync(outputAbs, lines.join('\n') + '\n', 'utf-8');

    if (openEditor) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(outputAbs));
      await vscode.window.showTextDocument(doc, { preview: false });
    }
    if (notify) {
      notifier.commandInfo('📦 AI Context Packet を生成しました');
    }
  };

  const buildAIContextPacketCommandImpl = async () => {
    await buildAIContextPacket({ openEditor: true, notify: true });
  };

  const installHooks = async () => {
    const isGitRepo = await gitIntegration.isGitRepository(workspaceRoot);
    if (!isGitRepo) {
      notifier.commandError('Current workspace is not a Git repository');
      return;
    }

    const hooksDir = await gitIntegration.getHooksDirectory(workspaceRoot);
    if (!hooksDir) {
      notifier.commandError('Failed to locate .git/hooks directory');
      return;
    }

    const success = await hookInstaller.installAllHooks(hooksDir);
    if (success) {
      notifier.commandInfo('✅ Git hooks installed successfully!');
    } else {
      notifier.commandError('❌ Failed to install Git hooks');
    }
  };

  const uninstallHooks = async () => {
    const hooksDir = await gitIntegration.getHooksDirectory(workspaceRoot);
    if (!hooksDir) {
      notifier.commandError('Failed to locate .git/hooks directory');
      return;
    }

    const success = await hookInstaller.uninstallAllHooks(hooksDir);
    if (success) {
      notifier.commandInfo('✅ Git hooks uninstalled successfully!');
    } else {
      notifier.commandError('❌ Failed to uninstall Git hooks');
    }
  };

  // コマンド登録: 手動検証（servant + 互換エイリアス）
  const validateCommand = vscode.commands.registerCommand('servant.validate', validateActiveEditor);
  const validateCommandLegacy = vscode.commands.registerCommand('instructionsValidator.validate', validateActiveEditor);

  // コマンド登録: pre-commit検証（servant + 互換エイリアス）
  const validateBeforeCommitCommand = vscode.commands.registerCommand('servant.validateBeforeCommit', validateBeforeCommit);
  const validateBeforeCommitCommandLegacy = vscode.commands.registerCommand('instructionsValidator.validateBeforeCommit', validateBeforeCommit);

  // コマンド登録: Specチェック記録
  const recordSpecCheckCommand = vscode.commands.registerCommand('servant.recordSpecCheck', recordSpecCheckCommandImpl);
  const recordSpecCheckCommandLegacy = vscode.commands.registerCommand('instructionsValidator.recordSpecCheck', recordSpecCheckCommandImpl);

  // コマンド登録: 必須指示書の照会 + Specチェック記録
  const reviewRequiredInstructionsCommand = vscode.commands.registerCommand(
    'servant.reviewRequiredInstructions',
    reviewRequiredInstructionsCommandImpl
  );

  // コマンド登録: Git hooks インストール（servant + 互換エイリアス）
  const installHooksCommand = vscode.commands.registerCommand('servant.installHooks', installHooks);
  const installHooksCommandLegacy = vscode.commands.registerCommand('instructionsValidator.installHooks', installHooks);

  // コマンド登録: Git hooks アンインストール（servant + 互換エイリアス）
  const uninstallHooksCommand = vscode.commands.registerCommand('servant.uninstallHooks', uninstallHooks);
  const uninstallHooksCommandLegacy = vscode.commands.registerCommand('instructionsValidator.uninstallHooks', uninstallHooks);

  // コマンド登録: 強制仕様書/決定ログ（正の場所）
  const openSpecBookCommand = vscode.commands.registerCommand('servant.specBook.open', openSpecBookCommandImpl);
  const appendDecisionLogCommand = vscode.commands.registerCommand(
    'servant.specBook.appendDecision',
    appendDecisionLogCommandImpl
  );

  // コマンド登録: AIコンテキストパック生成（ローカル完結の“配達”）
  const buildAIContextPacketCommand = vscode.commands.registerCommand(
    'servant.context.build',
    buildAIContextPacketCommandImpl
  );

  // 🚀 ワンクリック修正コマンド
  const quickFixCommitCommand = vscode.commands.registerCommand(
    'servant.quickFixCommit',
    () => quickFixCommit(outputChannel)
  );

  // 📢 Chat連携: 問題パネルの内容をCopilot Chatに報告
  const reportProblemsCommand = vscode.commands.registerCommand(
    'servant.chat.reportProblems',
    async () => {
      await chatParticipant.sendAutoReport('問題パネルのエラーを確認して修正方法を提案してください');
    }
  );

  // ファイル変更監視
  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/*.{ts,tsx,js,jsx,md,json}'
  );

  // AI_CONTEXT 自動配達（起動時/仕様変更時）
  let instructionsLoaded = false;
  let contextBuildTimer: NodeJS.Timeout | null = null;
  let lastContextBuildAt = 0;

  const isContextSourceFile = (uri: vscode.Uri): boolean => {
    const rel = vscode.workspace.asRelativePath(uri).replace(/\\/g, '/');
    const cfg = vscode.workspace.getConfiguration('servant');
    const specPath = (cfg.get<string>('specBook.specPath', 'docs/specifications/WORKING_SPEC.md') ?? '').replace(/\\/g, '/');
    const decisionsPath = (cfg.get<string>('specBook.decisionsPath', 'docs/specifications/DECISIONS.md') ?? '').replace(/\\/g, '/');

    if (!rel) return false;
    if (rel === specPath || rel === decisionsPath) return true;
    if (rel.startsWith('.aitk/instructions/')) return true;
    if (rel === '.aitk/failure-patterns.json') return true;
    return false;
  };

  const scheduleAutoContextBuild = (reason: 'startup' | 'spec-change') => {
    const cfg = vscode.workspace.getConfiguration('servant');
    const enabled = cfg.get<boolean>(
      reason === 'startup' ? 'context.autoBuildOnStartup' : 'context.autoBuildOnSpecChange',
      true
    );
    if (!enabled) return;
    if (!instructionsLoaded) return;

    const throttleMs = cfg.get<number>('context.autoBuildThrottleMs', 15000);
    const now = Date.now();
    const waitMs = Math.max(0, throttleMs - (now - lastContextBuildAt));

    if (contextBuildTimer) {
      clearTimeout(contextBuildTimer);
      contextBuildTimer = null;
    }

    contextBuildTimer = setTimeout(async () => {
      contextBuildTimer = null;
      lastContextBuildAt = Date.now();
      try {
        await buildAIContextPacket({ openEditor: false, notify: false });
      } catch {
        // ignore (best-effort)
      }
    }, waitMs);
  };

  watcher.onDidChange(async (uri) => {
    if (isEnabled()) {
      const fileName = path.basename(uri.fsPath);
      updateServantStatusBar(`検証中: ${fileName}`);
      await diagnosticsProvider.validate(uri);
      updateServantStatusBar('待機中');
    }

    if (isContextSourceFile(uri)) {
      scheduleAutoContextBuild('spec-change');
    }
  });

  watcher.onDidCreate(async (uri) => {
    if (isEnabled()) {
      const fileName = path.basename(uri.fsPath);
      updateServantStatusBar(`検証中: ${fileName}`);
      await diagnosticsProvider.validate(uri);
      updateServantStatusBar('待機中');
    }

    if (isContextSourceFile(uri)) {
      scheduleAutoContextBuild('spec-change');
    }
  });

  // 設定変更監視
  const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('servant') || e.affectsConfiguration('instructionsValidator')) {
      updateServantStatusBar();

      // ターミナル通知をONに切り替えた直後は、現在状態を明示的に出す
      if (e.affectsConfiguration('servant.terminalStatus.enabled')) {
        const enabledNow = isEnabled();
        // updateServantStatusBar() は enable の変化が無いと出力しないので、ここで補う
        const terminalEnabled = vscode.workspace
          .getConfiguration('servant')
          .get<boolean>('terminalStatus.enabled', false);
        if (terminalEnabled) {
          writeTerminalYellow(`[Servant] Terminal status enabled. Current: ${enabledNow ? 'ON' : 'OFF'}`);
        }
      }

      // 再検証
      const editor = vscode.window.activeTextEditor;
      if (editor && isEnabled()) {
        diagnosticsProvider.validate(editor.document.uri);
      }
    }
  });

  // Phase 7: 新しいコマンドの登録
  const learnFromHistoryCommand = vscode.commands.registerCommand('servant.learnFromHistory', async () => {
    updateServantStatusBar('Git履歴学習中');
    try {
      outputChannel.appendLine('[Learning] Analyzing Git history...');
      const patterns = await gitAnalyzer.extractFailurePatterns();

      for (const pattern of patterns) {
        await adaptiveGuard.recordViolation({
          rule: pattern.pattern,
          category: pattern.category,
          filePath: pattern.affectedFiles?.[0] || '',
          message: pattern.description || ''
        });
      }

      const stats = await gitAnalyzer.getStats();
      notifier.commandInfo(`🧠 Git履歴解析完了: ${stats.totalCommits}コミット, ${patterns.length}パターン抽出`);
      outputChannel.appendLine(`[Learning] Extracted ${patterns.length} patterns`);
      updateServantStatusBar('待機中');
    } catch (error) {
      notifier.commandError(`Git履歴解析エラー: ${error}`);
      updateServantStatusBar('待機中');
    }
  });

  const showHotspotsCommand = vscode.commands.registerCommand('servant.showHotspots', async () => {
    try {
      const hotspots = await gitAnalyzer.detectHotspots();

      if (hotspots.length === 0) {
        notifier.commandInfo('ホットスポットは検出されませんでした');
        return;
      }

      const items = hotspots.slice(0, 10).map(h => ({
        label: `$(warning) ${h.file}`,
        description: `リスク: ${h.riskScore}, 違反: ${h.violationCount}回`,
        detail: h.topPatterns.map(p => `${p.pattern} (${p.count}回)`).join(', '),
        hotspot: h
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: '問題頻発ファイル（ホットスポット）'
      });

      if (selected) {
        const uri = vscode.Uri.file(workspaceRoot + '/' + selected.hotspot.file);
        await vscode.window.showTextDocument(uri);
      }
    } catch (error) {
      notifier.commandError(`ホットスポット検出エラー: ${error}`);
    }
  });

  const showAIHotspotsCommand = vscode.commands.registerCommand('servant.showAIHotspots', async () => {
    try {
      const hotspots = aiTracker.getFileHotspots({ minCount: 2, limit: 15 });

      if (hotspots.length === 0) {
        notifier.commandInfo('AIアクション由来のホットスポットは検出されませんでした');
        return;
      }

      const items = hotspots.map(h => ({
        label: `$(warning) ${h.file}`,
        description: `変更: ${h.changeCount}回, 違反あり: ${h.violationActions}回`,
        hotspot: h
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'AIアクションログ由来の重点レビュー対象（ホットスポット）'
      });

      if (selected) {
        const targetPath = path.isAbsolute(selected.hotspot.file)
          ? selected.hotspot.file
          : path.join(workspaceRoot, selected.hotspot.file);
        const uri = vscode.Uri.file(targetPath);
        await vscode.window.showTextDocument(uri);
      }
    } catch (error) {
      notifier.commandError(`AIホットスポット表示エラー: ${error}`);
    }
  });

  const showLearningStatsCommand = vscode.commands.registerCommand('servant.showLearningStats', () => {
    const stats = adaptiveGuard.getStats();

    outputChannel.clear();
    outputChannel.appendLine('=== Servant Learning Statistics ===');
    outputChannel.appendLine(`総パターン数: ${stats.totalPatterns}`);
    outputChannel.appendLine(`高リスクパターン: ${stats.highRiskPatterns}`);
    outputChannel.appendLine(`平均復旧成功率: ${(stats.averageSuccessRate * 100).toFixed(1)}%`);
    outputChannel.appendLine(`次回学習まで: ${stats.validationsUntilNextLearning}回`);
    outputChannel.appendLine(`総学習サイクル: ${stats.totalLearningCycles}回`);
    outputChannel.appendLine(`最終学習日時: ${stats.lastLearningDate || 'N/A'}`);
    outputChannel.show();

    notifier.commandInfo(`学習統計: ${stats.totalPatterns}パターン, ${stats.highRiskPatterns}個が高リスク`);
  });

  const resetLearningCommand = vscode.commands.registerCommand('servant.resetLearning', async () => {
    const confirm = await vscode.window.showWarningMessage(
      '学習データをリセットしますか？',
      { modal: true },
      'はい'
    );

    if (confirm === 'はい') {
      await adaptiveGuard.resetLearning();
    }
  });

  const indexProjectCommand = vscode.commands.registerCommand('servant.indexProject', async () => {
    try {
      outputChannel.appendLine('[Indexing] Starting project indexing...');
      await contextDB.indexProject();

      const stats = contextDB.getStats();
      if (stats) {
        notifier.commandInfo(`🗺️ プロジェクトインデックス完了: ${stats.totalFiles}ファイル`);
        outputChannel.appendLine(`[Indexing] Indexed ${stats.totalFiles} files`);
      }
    } catch (error) {
      notifier.commandError(`インデックスエラー: ${error}`);
    }
  });

  const showProjectMapCommand = vscode.commands.registerCommand('servant.showProjectMap', () => {
    const stats = contextDB.getStats();

    if (!stats) {
      notifier.commandError('プロジェクトをインデックス化してください');
      return;
    }

    outputChannel.clear();
    outputChannel.appendLine('=== Servant Project Knowledge Map ===');
    outputChannel.appendLine(`総ファイル数: ${stats.totalFiles}`);
    outputChannel.appendLine(`総依存関係: ${stats.totalDependencies}`);
    outputChannel.appendLine(`平均インポート数: ${stats.avgImports.toFixed(1)}`);
    outputChannel.appendLine(`最終インデックス: ${stats.lastIndexed}`);
    outputChannel.show();
  });

  // Phase 8: AI処理追跡コマンド
  const showAIStatsCommand = vscode.commands.registerCommand('servant.showAIStats', () => {
    const stats = aiTracker.getStats();

    outputChannel.clear();
    outputChannel.appendLine('=== AI Action Statistics ===');
    outputChannel.appendLine(`総アクション数: ${stats.totalActions}`);
    outputChannel.appendLine(`成功率: ${(stats.successRate * 100).toFixed(1)}%`);
    outputChannel.appendLine(`平均追加行数: ${stats.avgLinesAdded.toFixed(0)}`);
    outputChannel.appendLine(`平均削除行数: ${stats.avgLinesDeleted.toFixed(0)}`);
    outputChannel.appendLine(`平均違反数: ${stats.avgViolations.toFixed(1)}`);
    outputChannel.appendLine(`平均エラー数: ${stats.avgCompileErrors.toFixed(1)}`);
    outputChannel.appendLine('');
    outputChannel.appendLine('タスク種別分布:');
    Object.entries(stats.typeDistribution).forEach(([type, count]) => {
      if (count > 0) {
        outputChannel.appendLine(`  ${type}: ${count}`);
      }
    });
    outputChannel.show();

    notifier.commandInfo(`AI統計: ${stats.totalActions}アクション, 成功率 ${(stats.successRate * 100).toFixed(0)}%`);
  });

  const showRecentAIActionsCommand = vscode.commands.registerCommand('servant.showRecentAIActions', () => {
    const actions = aiTracker.getRecentActions(20);

    if (actions.length === 0) {
      notifier.commandInfo('AI処理の履歴がありません');
      return;
    }

    outputChannel.clear();
    outputChannel.appendLine('=== Recent AI Actions ===');
    actions.forEach((action, index) => {
      const duration = action.endTime
        ? ((new Date(action.endTime).getTime() - new Date(action.startTime).getTime()) / 1000).toFixed(1)
        : 'N/A';
      const status = action.success ? '✅' : '❌';

      outputChannel.appendLine(`${index + 1}. ${status} ${action.type} (${duration}s)`);
      outputChannel.appendLine(`   Files: ${action.changedFiles.length}, +${action.linesAdded}/-${action.linesDeleted}`);
      outputChannel.appendLine(`   Violations: ${action.violations}, Errors: ${action.compileErrors}`);
      if (action.error) {
        outputChannel.appendLine(`   Error: ${action.error}`);
      }
      outputChannel.appendLine('');
    });
    outputChannel.show();
  });

  const resetAITrackingCommand = vscode.commands.registerCommand('servant.resetAITracking', async () => {
    const confirm = await vscode.window.showWarningMessage(
      'AI処理追跡データをリセットしますか？',
      { modal: true },
      'はい'
    );

    if (confirm === 'はい') {
      await aiTracker.reset();
      notifier.commandInfo('AI処理追跡データをリセットしました');
    }
  });

  // Phase 8.2: AI自己評価コマンド
  const evaluateAICommand = vscode.commands.registerCommand('servant.evaluateAI', async () => {
    const actions = aiTracker.getAllActions();

    if (actions.length === 0) {
      notifier.commandInfo('評価するAI処理がありません');
      return;
    }

    const metrics = aiEvaluator.evaluate(actions);
    await aiEvaluator.saveMetrics(metrics);

    // Phase 8.3: フィードバック生成
    const feedback = feedbackCollector.collectFeedback(metrics, actions);
    await feedbackCollector.saveFeedback(feedback);

    outputChannel.clear();
    outputChannel.appendLine('=== AI Self-Evaluation Report ===');
    outputChannel.appendLine(`評価日時: ${new Date(metrics.timestamp).toLocaleString('ja-JP')}`);
    outputChannel.appendLine(`評価対象: ${metrics.actionsEvaluated}件のAI処理`);
    outputChannel.appendLine('');
    outputChannel.appendLine(`🎯 総合スコア: ${metrics.overallScore}/100`);
    outputChannel.appendLine('');
    outputChannel.appendLine('--- 詳細メトリクス ---');
    outputChannel.appendLine(`✅ タスク完了率: ${metrics.taskCompletionRate}%`);
    outputChannel.appendLine(`⚠️  違反発生率: ${metrics.violationRate}%`);
    outputChannel.appendLine(`📊 コード品質: ${metrics.codeQualityScore}/100`);
    outputChannel.appendLine(`⚡ 効率性: ${metrics.efficiencyScore}/100`);
    outputChannel.appendLine('');
    outputChannel.appendLine('--- フィードバック ---');

    if (feedback.strengths.length > 0) {
      outputChannel.appendLine('');
      outputChannel.appendLine('✅ 強み:');
      feedback.strengths.forEach(s => outputChannel.appendLine(`  - ${s}`));
    }

    if (feedback.weaknesses.length > 0) {
      outputChannel.appendLine('');
      outputChannel.appendLine('⚠️  弱点:');
      feedback.weaknesses.forEach(w => outputChannel.appendLine(`  - ${w}`));
    }

    if (feedback.improvements.length > 0) {
      outputChannel.appendLine('');
      outputChannel.appendLine('💡 改善提案:');
      feedback.improvements.forEach(i => outputChannel.appendLine(`  - ${i}`));
    }

    if (feedback.warnings.length > 0) {
      outputChannel.appendLine('');
      outputChannel.appendLine('🚨 警告:');
      feedback.warnings.forEach(w => outputChannel.appendLine(`  - ${w}`));
    }

    if (feedback.recommendedActions.length > 0) {
      outputChannel.appendLine('');
      outputChannel.appendLine('🎯 推奨アクション:');
      feedback.recommendedActions.forEach(a => outputChannel.appendLine(`  - ${a}`));
    }

    outputChannel.show();

    // スコアに応じた通知
    if (metrics.overallScore < 50) {
      (notifier.commandWarning(
        `⚠️ AI総合スコアが低下しています（${metrics.overallScore}/100）。改善が必要です。`,
        'フィードバックを表示'
      ) ?? Promise.resolve(undefined)).then(selection => {
        if (selection) {
          outputChannel.show();
        }
      });
    } else if (metrics.overallScore >= 80) {
      notifier.commandInfo(`✅ AI処理が良好です！総合スコア: ${metrics.overallScore}/100`);
    }
  });

  const autopilotShowLastReportCommand = vscode.commands.registerCommand(
    'servant.autopilot.showLastReport',
    async () => {
      const latest = feedbackCollector.getLatestFeedback();
      if (!latest) {
        notifier.commandInfo('Autopilotレポートがまだありません');
        return;
      }
      feedbackCollector.showFeedback(latest, outputChannel);
    }
  );

  const autopilotAdjustCommand = vscode.commands.registerCommand('servant.autopilot.adjust', async () => {
    const config = vscode.workspace.getConfiguration('servant');

    const promptModePick = await vscode.window.showQuickPick(
      [
        {
          label: '自動（高リスク/大作業だけ強め）',
          description: '普段は静か、必要時だけ強めに確認',
          value: 'auto' as const
        },
        {
          label: '常に強め（毎回確認）',
          description: '開始時に必ず確認を出す',
          value: 'always' as const
        },
        {
          label: '強め通知しない（Output中心）',
          description: 'Output/ステータスバーのみ。モーダル確認なし',
          value: 'never' as const
        }
      ],
      {
        title: 'Servant Autopilot: 事前調整',
        placeHolder: '強め通知の方針を選んでください'
      }
    );

    if (!promptModePick) return;
    await config.update('autopilot.promptMode', promptModePick.value, vscode.ConfigurationTarget.Workspace);

    const revealPick = await vscode.window.showQuickPick(
      [
        { label: '常にOutputを表示する（おすすめ）', value: true },
        { label: 'Outputは表示しない（必要時に自分で開く）', value: false }
      ],
      {
        title: 'Servant Autopilot: 事前調整',
        placeHolder: '作業開始時にOutputを自動で開きますか？'
      }
    );

    if (!revealPick) return;
    await config.update('autopilot.revealOutputOnStart', revealPick.value, vscode.ConfigurationTarget.Workspace);

    const currentThreshold = config.get<number>('autopilot.largeWorkThresholdFiles', 20);
    const thresholdInput = await vscode.window.showInputBox({
      title: 'Servant Autopilot: 事前調整',
      prompt: '「大作業」と判定する変更ファイル数（この数以上で強めになります）',
      value: String(currentThreshold),
      validateInput: (value) => {
        if (value.trim() === '') return '数値を入力してください';
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) return '1以上の数値を入力してください';
        if (!Number.isInteger(n)) return '整数を入力してください';
        return undefined;
      }
    });

    if (thresholdInput === undefined) return;
    await config.update(
      'autopilot.largeWorkThresholdFiles',
      Number(thresholdInput),
      vscode.ConfigurationTarget.Workspace
    );

    notifier.commandInfo('✅ Autopilotの事前調整を更新しました');
  });

  // Phase 9: ニューラルグラフコマンド
  const buildNeuralGraphCommand = vscode.commands.registerCommand('servant.buildNeuralGraph', async () => {
    try {
      outputChannel.appendLine('[Neural] Building dependency graph...');
      await neuralGraph.buildGraph();

      const stats = neuralGraph.getStats();
      notifier.commandInfo(`🧠 グラフ構築完了: ${stats.totalNodes}ノード, ${stats.totalEdges}エッジ`);
      outputChannel.appendLine(`[Neural] Graph built: ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);
    } catch (error) {
      notifier.commandError(`グラフ構築エラー: ${error}`);
    }
  });

  const showNeuralGraphCommand = vscode.commands.registerCommand('servant.showNeuralGraph', () => {
    const stats = neuralGraph.getStats();

    outputChannel.clear();
    outputChannel.appendLine('=== Neural Dependency Graph ===');
    outputChannel.appendLine('');
    outputChannel.appendLine(`ノード数: ${stats.totalNodes}`);
    outputChannel.appendLine(`エッジ数: ${stats.totalEdges}`);
    outputChannel.appendLine(`平均エントロピー: ${stats.avgEntropy}`);
    outputChannel.appendLine(`平均活性化: ${stats.avgActivation}`);
    outputChannel.appendLine(`平均重み: ${stats.avgWeight}`);
    outputChannel.appendLine('');
    outputChannel.appendLine('--- 最もアクティブなノード ---');
    stats.mostActiveNodes.forEach((node, index) => {
      outputChannel.appendLine(`${index + 1}. ${node.file} (活性: ${node.activation})`);
    });
    outputChannel.appendLine('');
    outputChannel.appendLine('--- 最も強い接続 ---');
    stats.strongestConnections.forEach((conn, index) => {
      outputChannel.appendLine(`${index + 1}. ${conn.from} → ${conn.to} (重み: ${conn.weight})`);
    });
    outputChannel.show();
  });

  // Phase 9.2: ニューラル学習コマンド
  const propagateForwardCommand = vscode.commands.registerCommand('servant.propagateForward', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      notifier.commandError('アクティブなエディタがありません');
      return;
    }

    const filePath = vscode.workspace.asRelativePath(editor.document.uri);
    const result = neuralLearning.propagateForward(filePath);

    outputChannel.clear();
    outputChannel.appendLine('=== Forward Propagation Result ===');
    outputChannel.appendLine(`起点ファイル: ${filePath}`);
    outputChannel.appendLine(`計算時間: ${result.computationTime}ms`);
    outputChannel.appendLine('');
    outputChannel.appendLine(`影響を受けるファイル: ${result.affectedFiles.size}件`);

    // 上位10件を表示
    const sorted = Array.from(result.affectedFiles.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    outputChannel.appendLine('');
    outputChannel.appendLine('--- 影響度ランキング (Top 10) ---');
    sorted.forEach(([file, activation], index) => {
      outputChannel.appendLine(`${index + 1}. ${file} (活性: ${activation.toFixed(3)})`);
    });

    outputChannel.show();
    notifier.commandInfo(`🧠 ${result.affectedFiles.size}件のファイルが影響を受けます`);
  });

  const showNeuralLearningStatsCommand = vscode.commands.registerCommand('servant.showNeuralLearningStats', () => {
    const stats = neuralLearning.getStats();

    outputChannel.clear();
    outputChannel.appendLine('=== Neural Learning Statistics ===');
    outputChannel.appendLine('');
    outputChannel.appendLine(`現在のエポック: ${stats.currentEpoch}`);
    outputChannel.appendLine(`フィードバック数: ${stats.feedbackCount}/10`);
    outputChannel.appendLine(`学習率: ${stats.learningRate}`);
    outputChannel.appendLine(`収束スコア: ${stats.convergence}/100`);
    outputChannel.appendLine('');

    if (stats.convergence >= 80) {
      outputChannel.appendLine('✅ 学習が収束しています');
    } else if (stats.convergence >= 50) {
      outputChannel.appendLine('🟡 学習が進行中です');
    } else {
      outputChannel.appendLine('🔴 学習が不安定です');
    }

    outputChannel.show();
  });

  // Phase 10: 最適化エンジンとワークフロー学習
  const learnFromGitCommand = vscode.commands.registerCommand('servant.learnFromGit', async () => {
    notifier.commandInfo('📚 Git履歴/AIログから学習中...');

    try {
      await optimizationEngine.loadPatterns();
      await workflowLearner.learnFromGitHistory(100);

      // AIActionTrackerの実運用ログからも学習（成功/時間/違反が実測値）
      const learnedFromAI = await workflowLearner.learnFromAIActions(aiTracker.getAllActions(), 200);

      const stats = optimizationEngine.getStats();
      notifier.commandInfo(
        `✅ 学習完了: ${stats.totalPatterns}個のパターン (AIログ学習: ${learnedFromAI}件, 平均成功率: ${(stats.avgSuccessRate * 100).toFixed(1)}%)`
      );
    } catch (error) {
      notifier.commandError(`❌ 学習失敗: ${error}`);
    }
  });

  const optimizeCurrentTaskCommand = vscode.commands.registerCommand('servant.optimizeCurrentTask', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      notifier.commandError('アクティブなエディタがありません');
      return;
    }

    const currentFile = editor.document.uri.fsPath;
    const relPath = path.relative(workspaceRoot, currentFile);

    // staged → working tree → fallback(アクティブファイル) の順で対象ファイル集合を決める
    let targetAbsFiles = await gitIntegration.getStagedFilesFromSCM();
    if (targetAbsFiles.length === 0) {
      targetAbsFiles = await gitIntegration.getStagedFiles(workspaceRoot);
    }
    if (targetAbsFiles.length === 0) {
      targetAbsFiles = await gitIntegration.getWorkingTreeFiles(workspaceRoot);
    }

    const targetRelFiles = targetAbsFiles
      .map(p => path.relative(workspaceRoot, p))
      .filter(p => p && !p.startsWith('..'));

    const modifiedFiles = targetRelFiles.length > 0 ? targetRelFiles : [relPath];
    if (!modifiedFiles.includes(relPath)) {
      modifiedFiles.unshift(relPath);
    }

    // タスク状態を作成
    const taskState: TaskState = {
      taskType: 'unknown',
      currentFile: relPath,
      modifiedFiles,
      startTime: new Date()
    };

    try {
      await optimizationEngine.loadPatterns();

      const suggestion = await optimizationEngine.optimize(taskState);
      const workflow = await workflowLearner.suggestWorkflow(taskState);

      outputChannel.clear();
      outputChannel.appendLine('=== タスク最適化提案 ===');
      outputChannel.appendLine('');
      outputChannel.appendLine(`タスク種別: ${workflow.classification.taskType} (信頼度: ${(workflow.classification.confidence * 100).toFixed(0)}%)`);
      outputChannel.appendLine(`推奨ワークフロー: ${workflow.recommendation}`);
      outputChannel.appendLine('');
      outputChannel.appendLine('--- 推奨手順 ---');
      workflow.steps.forEach(step => {
        outputChannel.appendLine(step);
      });
      outputChannel.appendLine('');
      outputChannel.appendLine('--- 次に変更すべきファイル (Top 5) ---');
      suggestion.recommendedOrder.slice(0, 5).forEach((file, index) => {
        const risk = suggestion.risks.find(r => r.file === file);
        const riskMark = risk ? ` [${risk.riskLevel.toUpperCase()}]` : '';
        outputChannel.appendLine(`${index + 1}. ${file}${riskMark}`);
        if (risk) {
          outputChannel.appendLine(`   理由: ${risk.reason}`);
        }
      });
      outputChannel.appendLine('');
      outputChannel.appendLine('--- 予測 ---');
      outputChannel.appendLine(`成功率: ${(suggestion.predictedSuccessRate * 100).toFixed(1)}%`);
      outputChannel.appendLine(`予測時間: ${Math.round(suggestion.predictedTime / 60)}分`);

      outputChannel.show();
      notifier.commandInfo('🎯 最適化提案を表示しました');
    } catch (error) {
      notifier.commandError(`❌ 最適化失敗: ${error}`);
    }
  });

  const showOptimizationStatsCommand = vscode.commands.registerCommand('servant.showOptimizationStats', () => {
    const optimizationStats = optimizationEngine.getStats();
    const workflowStats = workflowLearner.getStats();

    outputChannel.clear();
    outputChannel.appendLine('=== Optimization & Workflow Statistics ===');
    outputChannel.appendLine('');
    outputChannel.appendLine('--- 最適化エンジン ---');
    outputChannel.appendLine(`学習済みパターン: ${optimizationStats.totalPatterns}個`);
    outputChannel.appendLine(`平均成功率: ${(optimizationStats.avgSuccessRate * 100).toFixed(1)}%`);

    if (optimizationStats.bestPattern) {
      outputChannel.appendLine('');
      outputChannel.appendLine('最高パターン:');
      outputChannel.appendLine(`  種別: ${optimizationStats.bestPattern.taskType}`);
      outputChannel.appendLine(`  成功率: ${(optimizationStats.bestPattern.successRate * 100).toFixed(1)}%`);
      outputChannel.appendLine(`  使用回数: ${optimizationStats.bestPattern.usageCount}回`);
    }

    outputChannel.appendLine('');
    outputChannel.appendLine('--- ワークフロー学習 ---');
    outputChannel.appendLine(`分析コミット数: ${workflowStats.totalCommits}件`);
    outputChannel.appendLine(`平均成功率: ${(workflowStats.avgSuccessRate * 100).toFixed(1)}%`);

    if (Object.keys(workflowStats.taskTypeDistribution).length > 0) {
      outputChannel.appendLine('');
      outputChannel.appendLine('タスク種別分布:');
      for (const [type, count] of Object.entries(workflowStats.taskTypeDistribution)) {
        outputChannel.appendLine(`  ${type}: ${count}件`);
      }
    }

    outputChannel.show();
  });

  const showAITrendCommand = vscode.commands.registerCommand('servant.showAITrend', () => {
    const trend = aiEvaluator.getTrend(10);

    if (trend.length === 0) {
      notifier.commandInfo('評価履歴がありません');
      return;
    }

    outputChannel.clear();
    outputChannel.appendLine('=== AI Performance Trend (最新10件) ===');
    outputChannel.appendLine('');

    trend.forEach((m, index) => {
      const date = new Date(m.timestamp).toLocaleString('ja-JP');
      outputChannel.appendLine(`${index + 1}. ${date}`);
      outputChannel.appendLine(`   総合: ${m.overallScore}/100, 完了率: ${m.taskCompletionRate}%, 品質: ${m.codeQualityScore}/100`);
    });

    outputChannel.appendLine('');
    outputChannel.appendLine('--- 推移分析 ---');

    if (trend.length >= 2) {
      const latest = trend[trend.length - 1];
      const previous = trend[trend.length - 2];
      const diff = latest.overallScore - previous.overallScore;

      if (diff > 5) {
        outputChannel.appendLine(`📈 改善傾向: スコアが ${diff.toFixed(1)} 向上`);
      } else if (diff < -5) {
        outputChannel.appendLine(`📉 悪化傾向: スコアが ${Math.abs(diff).toFixed(1)} 低下`);
      } else {
        outputChannel.appendLine(`➡️  安定: スコア変動なし`);
      }
    }

    outputChannel.show();
  });

  // Phase 6: Constellation天体儀ビューコマンド
  const showConstellationCommand = vscode.commands.registerCommand(
    'servant.showConstellation',
    async (openOptions?: { mode?: ViewModeName; query?: string; filters?: Record<string, any>; nodeId?: string }) => {
    try {
      // グラフの読み込み（または自動構築）
      let loaded = await neuralGraph.loadGraph();
      if (!loaded) {
        const answer = await vscode.window.showInformationMessage(
          '🌟 天体儀データがまだありません。プロジェクトをスキャンしますか？',
          'スキャンする',
          'キャンセル'
        );

        if (answer !== 'スキャンする') {
          return;
        }

        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: '🌟 天体儀データを生成中...',
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 30, message: 'プロジェクトをスキャン中...' });
          await neuralGraph.buildGraph();

          progress.report({ increment: 30, message: 'ゴール距離を計算中...' });
          const { GoalManager } = await import('./goals/GoalManager.js');
          const goalManager = new GoalManager(workspaceRoot);

          progress.report({ increment: 20, message: '変更頻度を分析中...' });
          await neuralGraph.updateChangeFrequencies(gitIntegration);

          progress.report({ increment: 20, message: '優先度スコアを計算中...' });
          neuralGraph.computePriorityScores(goalManager);
          await neuralGraph.saveGraph();
        });

        loaded = true;
        notifier.commandInfo('✅ 天体儀データを生成しました');
      }

      // ConstellationDataGenerator とGoalManagerを初期化
      const { GoalManager } = await import('./goals/GoalManager.js');
      const { ConstellationDataGenerator } = await import('./constellation/ConstellationDataGenerator.js');

      const goalManager = new GoalManager(workspaceRoot);
      const generator = new ConstellationDataGenerator(neuralGraph, goalManager);

      // WebView Panelを開く
      ConstellationViewPanel.createOrShow(
        context.extensionUri,
        neuralGraph,
        goalManager,
        generator,
        openOptions
      );

    } catch (error) {
      notifier.commandError(`天体儀の表示に失敗: ${error}`);
      outputChannel.appendLine(`[Constellation] Error: ${error}`);
    }
  });

  // Constellationのサブモードとして、メンテナンス（健全診断）を開く
  const showMaintenanceCommand = vscode.commands.registerCommand('servant.showMaintenance', async () => {
    await vscode.commands.executeCommand('servant.showConstellation', { mode: 'Maintenance' as ViewModeName });
  });
  context.subscriptions.push(showMaintenanceCommand);

  // 🌟ステータスバー起点のメニュー（QuickPick）
  const openConstellationMenuCommand = vscode.commands.registerCommand('servant.openConstellationMenu', async () => {
    const selected = await vscode.window.showQuickPick(
      [
        {
          label: '🌟 天体儀（全体表示）',
          description: 'プロジェクト全体の3D表示',
          mode: 'Overview' as ViewModeName,
        },
        {
          label: '🩺 メンテナンス（健全診断）',
          description: 'プロジェクトの健全性チェックと実行ボタン',
          mode: 'Maintenance' as ViewModeName,
        },
        {
          label: '🔍 天体儀（検索）',
          description: 'ノード名/パスで検索',
          mode: 'Search' as ViewModeName,
        },
        {
          label: '🎯 天体儀（フィルター）',
          description: 'タイプ等で絞り込み',
          mode: 'Filter' as ViewModeName,
        },
      ],
      {
        placeHolder: '天体儀メニュー',
      }
    );

    if (!selected) return;

    await vscode.commands.executeCommand('servant.showConstellation', { mode: selected.mode });
  });

  // Phase 11: アーキテクチャアドバイザーコマンド
  const analyzeArchitectureCommand = vscode.commands.registerCommand('servant.analyzeArchitecture', async () => {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'プロジェクトアーキテクチャを分析中...',
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ increment: 30, message: 'プロジェクト構造を分析...' });
        const analysis = await architectureAdvisor.analyzeProject();

        progress.report({ increment: 40, message: '問題を検出中...' });
        const report = await architectureAdvisor.suggestRefactoring();

        outputChannel.clear();
        outputChannel.appendLine('=== プロジェクト分析 ===');
        outputChannel.appendLine('');
        outputChannel.appendLine(`📁 総ファイル数: ${analysis.totalFiles}`);
        outputChannel.appendLine(`💻 コードファイル: ${analysis.codeFiles}`);
        outputChannel.appendLine(`🧪 テストファイル: ${analysis.testFiles}`);
        outputChannel.appendLine(`📚 ドキュメント: ${analysis.docFiles}`);
        outputChannel.appendLine(`📊 平均ファイルサイズ: ${analysis.avgFileSize}行`);
        outputChannel.appendLine(`📈 最大ファイルサイズ: ${analysis.maxFileSize}行`);
        outputChannel.appendLine(`✅ テストカバレッジ: ${analysis.hasTestCoverage ? 'あり' : 'なし'}`);
        outputChannel.appendLine(`🔄 CI/CD: ${analysis.hasCIPipeline ? 'あり' : 'なし'}`);
        outputChannel.appendLine(`📖 ドキュメントスコア: ${analysis.documentationScore}/100`);
        outputChannel.appendLine('');
        outputChannel.appendLine('=== 業界標準チェック ===');
        outputChannel.appendLine(`🔒 セキュリティ設定: ${analysis.hasSecurityConfig ? '✅' : '❌'}`);
        outputChannel.appendLine(`♿ アクセシビリティ: ${analysis.hasA11yConfig ? '✅' : '❌'}`);
        outputChannel.appendLine(`📊 エラートラッキング: ${analysis.hasErrorTracking ? '✅' : '❌'}`);
        outputChannel.appendLine(`⚡ パフォーマンス監視: ${analysis.hasPerformanceMonitoring ? '✅' : '❌'}`);
        outputChannel.appendLine('');
        outputChannel.appendLine(report);
        outputChannel.show();

        (notifier.commandInfo('✅ アーキテクチャ分析完了！', 'レポートを表示') ??
          Promise.resolve(undefined)
        ).then((selection) => {
          if (selection) {
            outputChannel.show();
          }
        });
      } catch (error) {
        notifier.commandError(`分析エラー: ${error}`);
      }
    });
  });

  // エディタ切り替え時の検証
  const editorWatcher = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && isEnabled()) {
      diagnosticsProvider.validate(editor.document.uri);
    }
  });

  // リソース登録
  context.subscriptions.push(
    validateCommand,
    validateCommandLegacy,
    validateBeforeCommitCommand,
    validateBeforeCommitCommandLegacy,
    recordSpecCheckCommand,
    recordSpecCheckCommandLegacy,
    reviewRequiredInstructionsCommand,
    installHooksCommand,
    installHooksCommandLegacy,
    uninstallHooksCommand,
    uninstallHooksCommandLegacy,
    openSpecBookCommand,
    appendDecisionLogCommand,
    buildAIContextPacketCommand,
    quickFixCommitCommand,
    reportProblemsCommand,
    learnFromHistoryCommand,
    showHotspotsCommand,
    showAIHotspotsCommand,
    showLearningStatsCommand,
    resetLearningCommand,
    indexProjectCommand,
    showProjectMapCommand,
    showAIStatsCommand,
    showRecentAIActionsCommand,
    resetAITrackingCommand,
    evaluateAICommand,
    autopilotAdjustCommand,
    autopilotShowLastReportCommand,
    showAITrendCommand,
    buildNeuralGraphCommand,
    showNeuralGraphCommand,
    propagateForwardCommand,
    showNeuralLearningStatsCommand,
    learnFromGitCommand,
    optimizeCurrentTaskCommand,
    showOptimizationStatsCommand,
    showConstellationCommand,
    openConstellationMenuCommand,
    analyzeArchitectureCommand,
    editorWatcher,
    codeActionDisposable,
    watcher,
    configWatcher
  );

  // 初期ロード
  Promise.all([
    loader.load(),
    treeLoader.load()
  ]).then(async () => {
    instructionsLoaded = true;
    // 起動時にAI_CONTEXTを自動生成（ベストエフォート・無通知・エディタを開かない）
    scheduleAutoContextBuild('startup');

    // Phase 7: プロジェクトインデックス自動構築
    const learningEnabled = vscode.workspace.getConfiguration('servant').get<boolean>('learning.enabled', true);
    if (learningEnabled) {
      try {
        outputChannel.appendLine('[Activation] Building project index...');
        await contextDB.indexProject();
        outputChannel.appendLine('[Activation] Project index ready');
      } catch (error) {
        outputChannel.appendLine(`[Activation] Index failed: ${error}`);
      }
    }

    // Git hooksの自動インストール（初回のみ）
    const config = vscode.workspace.getConfiguration('servant');
    const autoInstall = config.get<boolean>('preCommit.autoInstall', true);

    if (autoInstall) {
      const isGitRepo = await gitIntegration.isGitRepository(workspaceRoot);
      if (isGitRepo) {
        const hooksDir = await gitIntegration.getHooksDirectory(workspaceRoot);
        if (hooksDir) {
          const isInstalled = await hookInstaller.isHookInstalled(hooksDir, 'pre-commit');
          if (!isInstalled) {
            outputChannel.appendLine('[Activation] Auto-installing Git hooks...');
            await hookInstaller.installAllHooks(hooksDir);
            outputChannel.appendLine('[Activation] Git hooks installed');
          }
        }
      }
    }
  }).catch(err => {
    console.error('Failed to load instructions/trees:', err);
    notifier.critical(`Servant: ${err.message}`);
  });
}

export function deactivate() {
  console.log('Servant is now deactivated');
}

function isEnabled(): boolean {
  const servantConfig = vscode.workspace.getConfiguration('servant');
  const servantEnabled = servantConfig.get<boolean>('enable');
  if (typeof servantEnabled === 'boolean') {
    return servantEnabled;
  }

  // 後方互換: 旧namespace
  const legacyConfig = vscode.workspace.getConfiguration('instructionsValidator');
  return legacyConfig.get<boolean>('enable', true);
}
