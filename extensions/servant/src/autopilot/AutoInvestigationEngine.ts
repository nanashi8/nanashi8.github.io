import * as vscode from 'vscode';
import type { GitIntegration } from '../git/GitIntegration';
import type { InstructionsLoader } from '../loader/InstructionsLoader';
import type { AIAction } from '../learning/AIActionTracker';
import { SeniorEngineerQualityCheck, type QualityReport } from './SeniorEngineerQualityCheck';

/**
 * 自動調査・分析・対策立案エンジン
 * ユーザーが「分からない」と回答した際に、AIが自動で調査を行う
 */
export class AutoInvestigationEngine {
  private qualityChecker: SeniorEngineerQualityCheck;

  constructor(
    private outputChannel: vscode.OutputChannel,
    private gitIntegration: GitIntegration,
    private instructionsLoader: InstructionsLoader
  ) {
    this.qualityChecker = new SeniorEngineerQualityCheck(outputChannel);
  }

  /**
   * 「分からない」状態を分析し、対策を立案
   */
  async investigateAndPropose(
    action: AIAction,
    context: {
      suggestedPatternIds?: string[];
      wasAccepted?: boolean;
      trigger?: string;
    }
  ): Promise<InvestigationResult> {
    this.outputChannel.appendLine('');
    const trigger = (context.trigger || '').trim();
    const reason = trigger ? `（trigger: ${trigger}）` : '';
    this.outputChannel.appendLine(`🔍 [自動調査開始] 詳細調査を実施します... ${reason}`);

    const result: InvestigationResult = {
      timestamp: Date.now(),
      actionId: action.id,
      findings: [],
      recommendations: [],
      qualityIssues: [],
      nextActions: [],
      qualityReport: null
    };

    // 1. 上級SE視点での品質評価（最初に実行）
    result.qualityReport = await this.qualityChecker.evaluateQuality(action);

    // 2. 変更内容の分析
    await this.analyzeChanges(action, result);

    // 3. コード品質の分析（基本的なチェック）
    await this.analyzeCodeQuality(action, result);

    // 4. 関連指示書の確認
    await this.checkRelevantInstructions(action, result);

    // 5. Git履歴からの学習
    await this.learnFromHistory(action, result);

    // 6. 総合評価と推奨事項
    this.generateRecommendations(result);

    // 結果を出力
    this.reportFindings(result);

    return result;
  }

  /**
   * 変更内容を分析
   */
  private async analyzeChanges(action: AIAction, result: InvestigationResult): Promise<void> {
    this.outputChannel.appendLine('📊 [分析1] 変更内容を調査中...');

    const files = action.changedFiles || [];
    result.findings.push(`変更ファイル数: ${files.length}`);

    if (files.length === 0) {
      result.findings.push('⚠️ 変更ファイルがありません。何も変更されなかった可能性があります。');
      result.qualityIssues.push({
        severity: 'warning',
        category: 'no-changes',
        message: '変更がない場合、タスクが未完了か、不要な作業だった可能性があります'
      });
      return;
    }

    // 変更規模の分析
    const totalLines = (action.linesAdded || 0) + (action.linesDeleted || 0);
    result.findings.push(`変更行数: +${action.linesAdded || 0} / -${action.linesDeleted || 0} (合計: ${totalLines})`);

    if (totalLines > 500) {
      result.qualityIssues.push({
        severity: 'warning',
        category: 'large-change',
        message: '変更が大きすぎます。小さく分割することで、レビューしやすくなります'
      });
    }

    // ファイルタイプの分析
    const filesByType = this.categorizeFiles(files);
    result.findings.push(`ファイルタイプ: ${Object.keys(filesByType).join(', ')}`);

    // 複数領域にまたがる変更の検出
    if (Object.keys(filesByType).length > 3) {
      result.qualityIssues.push({
        severity: 'info',
        category: 'multi-domain',
        message: '複数の領域にまたがる変更です。関連性を明確にしましょう'
      });
    }
  }

  /**
   * コード品質を分析
   */
  private async analyzeCodeQuality(action: AIAction, result: InvestigationResult): Promise<void> {
    this.outputChannel.appendLine('🔍 [分析2] コード品質を調査中...');

    // コンパイルエラーのチェック
    if (action.compileErrors && action.compileErrors > 0) {
      result.qualityIssues.push({
        severity: 'error',
        category: 'compile-error',
        message: `コンパイルエラーが ${action.compileErrors} 件あります。まずこれを解決する必要があります`
      });
      result.nextActions.push('❗ コンパイルエラーを修正する（最優先）');
    }

    // Lint違反のチェック
    if (action.violations && action.violations > 0) {
      result.qualityIssues.push({
        severity: 'warning',
        category: 'lint-violation',
        message: `Lint違反が ${action.violations} 件あります。コード品質基準を満たしていません`
      });
      result.nextActions.push('⚠️ Lint違反を修正する');
    }

    // 成功したが問題がある場合
    if (action.success && (action.compileErrors === 0) && (action.violations === 0)) {
      result.findings.push('✅ コンパイルエラー・Lint違反なし');
    }

    // 失敗した場合
    if (!action.success) {
      result.qualityIssues.push({
        severity: 'error',
        category: 'action-failed',
        message: 'アクションが失敗しています。エラーログを確認してください'
      });
      result.nextActions.push('❗ エラーログを確認し、失敗原因を特定する');
    }
  }

  /**
   * 関連する指示書を確認
   */
  private async checkRelevantInstructions(action: AIAction, result: InvestigationResult): Promise<void> {
    this.outputChannel.appendLine('📖 [分析3] 関連指示書を確認中...');

    const files = action.changedFiles || [];
    if (files.length === 0) return;

    try {
      const allInstructions = this.instructionsLoader.getInstructions();
      const relevantInstructions: string[] = [];

      for (const file of files) {
        const matchingInstructions = allInstructions.filter((inst: any) => {
          if (!inst.applyTo) return false;
          // applyToパターンに一致するか確認（簡易実装）
          const pattern = inst.applyTo.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          const regex = new RegExp(pattern);
          return regex.test(file);
        });

        matchingInstructions.forEach((inst: any) => {
          const instPath = inst.filePath || '(unknown)';
          if (!relevantInstructions.includes(instPath)) {
            relevantInstructions.push(instPath);
          }
        });
      }

      if (relevantInstructions.length > 0) {
        result.findings.push(`関連指示書: ${relevantInstructions.length} 件見つかりました`);
        result.nextActions.push('📖 関連指示書を確認し、ルールに従っているか検証する');
        relevantInstructions.slice(0, 5).forEach(path => {
          this.outputChannel.appendLine(`   - ${path}`);
        });
      } else {
        result.findings.push('関連指示書: 該当なし');
      }
    } catch (error) {
      this.outputChannel.appendLine(`⚠️ 指示書確認中にエラー: ${String(error)}`);
    }
  }

  /**
   * Git履歴から学習
   */
  private async learnFromHistory(_action: AIAction, result: InvestigationResult): Promise<void> {
    this.outputChannel.appendLine('📚 [分析4] Git履歴から学習中...');

    // TODO: GitIntegration に getRecentCommits メソッドを実装後に有効化
    result.findings.push('Git履歴分析: （今後実装予定）');

    // 暫定的に新規パターンとして扱う
    result.qualityIssues.push({
      severity: 'info',
      category: 'git-history-pending',
      message: 'Git履歴との比較は今後実装予定です。手動でgit logを確認してください'
    });
  }

  /**
   * 総合評価と推奨事項を生成
   */
  private generateRecommendations(result: InvestigationResult): void {
    this.outputChannel.appendLine('💡 [総合評価] 推奨事項を生成中...');

    // エラーレベルの問題がある場合
    const errorIssues = result.qualityIssues.filter(i => i.severity === 'error');
    if (errorIssues.length > 0) {
      result.recommendations.push({
        priority: 'high',
        category: 'fix-errors',
        action: 'エラーを修正する',
        reason: `${errorIssues.length} 件の重大な問題があります`,
        details: errorIssues.map(i => `- ${i.message}`).join('\n')
      });
    }

    // 警告レベルの問題がある場合
    const warningIssues = result.qualityIssues.filter(i => i.severity === 'warning');
    if (warningIssues.length > 0) {
      result.recommendations.push({
        priority: 'medium',
        category: 'improve-quality',
        action: 'コード品質を向上させる',
        reason: `${warningIssues.length} 件の警告があります`,
        details: warningIssues.map(i => `- ${i.message}`).join('\n')
      });
    }

    // すべて正常な場合
    if (errorIssues.length === 0 && warningIssues.length === 0) {
      result.recommendations.push({
        priority: 'low',
        category: 'review',
        action: '手動レビューを実施する',
        reason: '自動検出では問題は見つかりませんでしたが、人間の目で確認することを推奨します',
        details: '- DECISIONS.md に変更理由を記録\n- 関連するテストを実行\n- レビュアーに確認を依頼'
      });
    }

    // 変更規模に応じた推奨
    const files = result.findings.find(f => f.startsWith('変更ファイル数:'));
    if (files) {
      const fileCount = parseInt(files.match(/\d+/)?.[0] || '0');
      if (fileCount > 10) {
        result.recommendations.push({
          priority: 'medium',
          category: 'split-work',
          action: '作業を分割する',
          reason: `${fileCount} ファイルの変更は多すぎます`,
          details: '- 論理的な単位で複数のコミットに分割\n- 各コミットは独立してレビュー可能に\n- コミットメッセージで関連性を明記'
        });
      }
    }
  }

  /**
   * 調査結果を報告
   */
  private reportFindings(result: InvestigationResult): void {
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('=' .repeat(80));
    this.outputChannel.appendLine('🔍 自動調査レポート');
    this.outputChannel.appendLine('=' .repeat(80));
    this.outputChannel.appendLine('');

    // 調査結果
    this.outputChannel.appendLine('📊 調査結果:');
    result.findings.forEach(finding => {
      this.outputChannel.appendLine(`   ${finding}`);
    });
    this.outputChannel.appendLine('');

    // 品質問題
    if (result.qualityIssues.length > 0) {
      this.outputChannel.appendLine('⚠️ 検出された問題:');
      result.qualityIssues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        this.outputChannel.appendLine(`   ${icon} [${issue.category}] ${issue.message}`);
      });
      this.outputChannel.appendLine('');
    }

    // 推奨事項
    if (result.recommendations.length > 0) {
      this.outputChannel.appendLine('💡 推奨事項:');
      result.recommendations.forEach((rec, index) => {
        const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        this.outputChannel.appendLine(`   ${priorityIcon} [${rec.priority.toUpperCase()}] ${rec.action}`);
        this.outputChannel.appendLine(`      理由: ${rec.reason}`);
        if (rec.details) {
          this.outputChannel.appendLine(`      詳細:`);
          rec.details.split('\n').forEach(line => {
            this.outputChannel.appendLine(`         ${line}`);
          });
        }
        if (index < result.recommendations.length - 1) {
          this.outputChannel.appendLine('');
        }
      });
      this.outputChannel.appendLine('');
    }

    // 次のアクション
    if (result.nextActions.length > 0) {
      this.outputChannel.appendLine('🎯 次にやるべきこと:');
      result.nextActions.forEach((action, index) => {
        this.outputChannel.appendLine(`   ${index + 1}. ${action}`);
      });
      this.outputChannel.appendLine('');
    }

    this.outputChannel.appendLine('=' .repeat(80));
    this.outputChannel.appendLine('💡 このレポートを参考に、次のステップを決めてください。');
    this.outputChannel.appendLine('   詳細が必要な場合は、Servant の各種コマンドで追加調査が可能です。');
    this.outputChannel.appendLine('=' .repeat(80));
    this.outputChannel.appendLine('');
  }

  /**
   * ファイルをタイプ別に分類
   */
  private categorizeFiles(files: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {};

    files.forEach(file => {
      let category = 'other';

      if (file.endsWith('.ts') || file.endsWith('.tsx')) category = 'typescript';
      else if (file.endsWith('.js') || file.endsWith('.jsx')) category = 'javascript';
      else if (file.endsWith('.md')) category = 'documentation';
      else if (file.endsWith('.json')) category = 'config';
      else if (file.endsWith('.css') || file.endsWith('.scss')) category = 'style';
      else if (file.includes('/tests/') || file.includes('/test/') || file.includes('.test.') || file.includes('.spec.')) category = 'test';
      else if (file.includes('.instructions.md')) category = 'instructions';

      if (!categories[category]) categories[category] = [];
      categories[category].push(file);
    });

    return categories;
  }
}

/**
 * 調査結果の型定義
 */
export interface InvestigationResult {
  timestamp: number;
  actionId: string;
  findings: string[];
  recommendations: Recommendation[];
  qualityIssues: QualityIssue[];
  nextActions: string[];
  qualityReport: QualityReport | null;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  reason: string;
  details?: string;
}

interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
}
