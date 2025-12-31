import * as vscode from 'vscode';
import * as path from 'path';
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
import { NeuralDependencyGraph } from './neural/NeuralDependencyGraph';
import { NeuralLearningEngine } from './neural/NeuralLearningEngine';
import { OptimizationEngine, TaskState } from './neural/OptimizationEngine';
import { WorkflowLearner } from './neural/WorkflowLearner';
import { ProjectContextDB } from './context/ProjectContextDB';
import { ArchitectureAdvisor } from './specialists/ArchitectureAdvisor';
import { Notifier } from './ui/Notifier';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  console.log('Servant is now active');

  // Output Channel作成
  outputChannel = vscode.window.createOutputChannel('Servant');

  const notifier = new Notifier(outputChannel);

  // ワークスペースルート取得
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    notifier.critical('No workspace folder found');
    return;
  }

  const workspaceRoot = workspaceFolder.uri.fsPath;

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
  const adaptiveGuard = new AdaptiveGuard(context, notifier);
  const gitAnalyzer = new GitHistoryAnalyzer(workspaceRoot, notifier);
  const contextDB = new ProjectContextDB(workspaceRoot);
  const aiTracker = new AIActionTracker(workspaceRoot);
  const aiEvaluator = new AIEvaluator(workspaceRoot);
  const feedbackCollector = new FeedbackCollector(workspaceRoot);

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
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      notifier.commandInfo('No active editor');
      return;
    }

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
  };

  const validateBeforeCommit = async () => {
    outputChannel.appendLine('[Command] Validate before commit triggered');

    // staged filesを取得
    const stagedFiles = await gitIntegration.getStagedFilesFromSCM();
    if (stagedFiles.length === 0) {
      notifier.commandInfo('No staged files to validate');
      return;
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
    }

    // 結果表示
    await preCommitValidator.showViolations(result);

    // エラーがあればコマンド失敗として返す（Git hookから使用される）
    if (!result.success) {
      throw new Error('Validation failed');
    }
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

  // コマンド登録: Git hooks インストール（servant + 互換エイリアス）
  const installHooksCommand = vscode.commands.registerCommand('servant.installHooks', installHooks);
  const installHooksCommandLegacy = vscode.commands.registerCommand('instructionsValidator.installHooks', installHooks);

  // コマンド登録: Git hooks アンインストール（servant + 互換エイリアス）
  const uninstallHooksCommand = vscode.commands.registerCommand('servant.uninstallHooks', uninstallHooks);
  const uninstallHooksCommandLegacy = vscode.commands.registerCommand('instructionsValidator.uninstallHooks', uninstallHooks);

  // ファイル変更監視
  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/*.{ts,tsx,js,jsx,md,json}'
  );

  watcher.onDidChange(async (uri) => {
    if (isEnabled()) {
      await diagnosticsProvider.validate(uri);
    }
  });

  watcher.onDidCreate(async (uri) => {
    if (isEnabled()) {
      await diagnosticsProvider.validate(uri);
    }
  });

  // 設定変更監視
  const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('servant') || e.affectsConfiguration('instructionsValidator')) {
      // 再検証
      const editor = vscode.window.activeTextEditor;
      if (editor && isEnabled()) {
        diagnosticsProvider.validate(editor.document.uri);
      }
    }
  });

  // Phase 7: 新しいコマンドの登録
  const learnFromHistoryCommand = vscode.commands.registerCommand('servant.learnFromHistory', async () => {
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
    } catch (error) {
      notifier.commandError(`Git履歴解析エラー: ${error}`);
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
    installHooksCommand,
    installHooksCommandLegacy,
    uninstallHooksCommand,
    uninstallHooksCommandLegacy,
    learnFromHistoryCommand,
    showHotspotsCommand,
    showLearningStatsCommand,
    resetLearningCommand,
    indexProjectCommand,
    showProjectMapCommand,
    showAIStatsCommand,
    showRecentAIActionsCommand,
    resetAITrackingCommand,
    evaluateAICommand,
    showAITrendCommand,
    buildNeuralGraphCommand,
    showNeuralGraphCommand,
    propagateForwardCommand,
    showNeuralLearningStatsCommand,
    learnFromGitCommand,
    optimizeCurrentTaskCommand,
    showOptimizationStatsCommand,
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
