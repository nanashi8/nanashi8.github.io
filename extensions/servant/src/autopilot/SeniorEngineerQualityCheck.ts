import * as vscode from 'vscode';
import type { AIAction } from '../learning/AIActionTracker';

/**
 * 上級システムエンジニア視点でのコード品質評価
 *
 * 単なるlint/compileエラーだけでなく、設計・保守性・可読性の観点から評価する
 */
export class SeniorEngineerQualityCheck {
  constructor(private outputChannel: vscode.OutputChannel) {}

  /**
   * コード品質を総合評価
   */
  async evaluateQuality(action: AIAction): Promise<QualityReport> {
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('🎓 [上級SE視点] コード品質を評価中...');

    const report: QualityReport = {
      timestamp: Date.now(),
      actionId: action.id,
      overallScore: 100,
      categories: {
        design: { score: 100, issues: [], strengths: [] },
        maintainability: { score: 100, issues: [], strengths: [] },
        readability: { score: 100, issues: [], strengths: [] },
        testing: { score: 100, issues: [], strengths: [] },
        documentation: { score: 100, issues: [], strengths: [] },
      },
      recommendations: [],
    };

    // 各観点から評価
    await this.checkDesignQuality(action, report);
    await this.checkMaintainability(action, report);
    await this.checkReadability(action, report);
    await this.checkTestingStrategy(action, report);
    await this.checkDocumentation(action, report);

    // 総合スコア計算
    this.calculateOverallScore(report);

    // レポート出力
    this.reportQuality(report);

    return report;
  }

  /**
   * 設計品質のチェック
   */
  private async checkDesignQuality(action: AIAction, report: QualityReport): Promise<void> {
    const files = action.changedFiles || [];
    const category = report.categories.design;

    // 1. ファイル数と変更規模のバランス
    if (files.length > 20) {
      category.issues.push({
        severity: 'warning',
        message: '変更ファイル数が多すぎます（20+）',
        impact: '関心の分離が不十分な可能性があります',
        suggestion: '機能ごとにPRを分割することを検討してください',
      });
      category.score -= 15;
    } else if (files.length <= 5) {
      category.strengths.push('適切な変更スコープ（5ファイル以内）');
    }

    // 2. 同時に変更される領域の分析
    const domains = this.analyzeDomainCoupling(files);
    if (domains.size > 4) {
      category.issues.push({
        severity: 'warning',
        message: `${domains.size} 個の異なる領域にまたがる変更`,
        impact: '密結合の可能性があります',
        suggestion: '共通ロジックを抽出し、依存関係を整理してください',
      });
      category.score -= 10;
    } else if (domains.size === 1) {
      category.strengths.push('単一の関心領域に集中した変更');
    }

    // 3. テストコードと実装コードの比率
    const testFiles = files.filter(
      (f) =>
        f.includes('/tests/') ||
        f.includes('/test/') ||
        f.includes('.test.') ||
        f.includes('.spec.')
    );
    const implFiles = files.filter((f) => !testFiles.includes(f));

    if (implFiles.length > 0 && testFiles.length === 0) {
      category.issues.push({
        severity: 'error',
        message: '実装コードに対応するテストが追加されていません',
        impact: 'リグレッションリスクが高まります',
        suggestion: '変更した機能に対するテストを必ず追加してください',
      });
      category.score -= 25;
    } else if (testFiles.length > 0) {
      category.strengths.push(`テストカバレッジを考慮（テストファイル: ${testFiles.length} 件）`);
    }

    // 4. コンパイルエラー・違反の存在
    if (action.compileErrors && action.compileErrors > 0) {
      category.issues.push({
        severity: 'critical',
        message: `コンパイルエラー: ${action.compileErrors} 件`,
        impact: 'コードが動作しません',
        suggestion: '最優先で修正してください',
      });
      category.score -= 50;
    }

    if (action.violations && action.violations > 0) {
      category.issues.push({
        severity: 'warning',
        message: `Lint違反: ${action.violations} 件`,
        impact: 'コード品質基準を満たしていません',
        suggestion: 'Lint違反を解消してください',
      });
      category.score -= Math.min(20, action.violations * 2);
    }
  }

  /**
   * 保守性のチェック
   */
  private async checkMaintainability(action: AIAction, report: QualityReport): Promise<void> {
    const files = action.changedFiles || [];
    const category = report.categories.maintainability;

    // 1. 変更の粒度
    const totalLines = (action.linesAdded || 0) + (action.linesDeleted || 0);
    const avgLinesPerFile = files.length > 0 ? totalLines / files.length : 0;

    if (avgLinesPerFile > 100) {
      category.issues.push({
        severity: 'warning',
        message: `ファイルあたりの変更行数が多い（平均 ${Math.round(avgLinesPerFile)} 行）`,
        impact: 'レビューが困難で、バグが混入しやすくなります',
        suggestion: '変更を論理的な単位で分割してください',
      });
      category.score -= 15;
    } else if (avgLinesPerFile < 20) {
      category.strengths.push('小さく理解しやすい変更');
    }

    // 2. 削除行数の分析（リファクタリング指標）
    const deletionRatio = totalLines > 0 ? (action.linesDeleted || 0) / totalLines : 0;
    if (deletionRatio > 0.3) {
      category.strengths.push('積極的なコード整理（削除率30%以上）');
    }

    // 3. 設定ファイル・ドキュメントの更新
    const _configFiles = files.filter(
      (f) => f.includes('package.json') || f.includes('.config.') || f.includes('tsconfig')
    );
    const docFiles = files.filter((f) => f.endsWith('.md'));

    if (files.length > 10 && docFiles.length === 0) {
      category.issues.push({
        severity: 'info',
        message: '大きな変更ですが、ドキュメントが更新されていません',
        impact: 'チームメンバーが変更内容を理解しにくくなります',
        suggestion: 'README やドキュメントの更新を検討してください',
      });
      category.score -= 5;
    }
  }

  /**
   * 可読性のチェック
   */
  private async checkReadability(_action: AIAction, report: QualityReport): Promise<void> {
    const category = report.categories.readability;

    // 実際のファイル内容を読み取るのは重いので、
    // ここでは基本的なヒューリスティックのみ実装

    // TODO: 将来的には以下を実装
    // - 関数の長さ
    // - ネストの深さ
    // - 変数名の質
    // - コメントの有無と質

    category.strengths.push('（詳細分析は手動レビューで実施）');
  }

  /**
   * テスト戦略のチェック
   */
  private async checkTestingStrategy(action: AIAction, report: QualityReport): Promise<void> {
    const files = action.changedFiles || [];
    const category = report.categories.testing;

    const testFiles = files.filter(
      (f) =>
        f.includes('/tests/') ||
        f.includes('/test/') ||
        f.includes('.test.') ||
        f.includes('.spec.')
    );

    // 1. テストの存在
    if (testFiles.length === 0 && files.length > 0) {
      const hasImplementation = files.some(
        (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
      );

      if (hasImplementation) {
        category.issues.push({
          severity: 'error',
          message: 'テストが追加されていません',
          impact: '品質保証が不十分です',
          suggestion: 'ユニットテストまたは統合テストを追加してください',
        });
        category.score -= 30;
      }
    } else if (testFiles.length > 0) {
      category.strengths.push(`テストファイル: ${testFiles.length} 件`);

      // 2. テストと実装のバランス
      const implFiles = files.filter(
        (f) =>
          !testFiles.includes(f) &&
          (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'))
      );

      if (testFiles.length >= implFiles.length * 0.5) {
        category.strengths.push('適切なテストカバレッジ（実装:テスト比が良好）');
      }
    }

    // 3. E2Eテストの考慮
    const e2eTests = testFiles.filter((f) => f.includes('e2e') || f.includes('playwright'));
    if (e2eTests.length > 0) {
      category.strengths.push('E2Eテストを含む');
    }
  }

  /**
   * ドキュメンテーションのチェック
   */
  private async checkDocumentation(action: AIAction, report: QualityReport): Promise<void> {
    const files = action.changedFiles || [];
    const category = report.categories.documentation;

    const docFiles = files.filter((f) => f.endsWith('.md'));
    const instructionFiles = files.filter((f) => f.includes('.instructions.md'));

    // 1. ドキュメントの存在
    if (docFiles.length === 0 && files.length > 10) {
      category.issues.push({
        severity: 'warning',
        message: '大規模な変更ですが、ドキュメントが更新されていません',
        impact: 'チームの知識共有が不十分になります',
        suggestion: 'READMEや設計ドキュメントの更新を検討してください',
      });
      category.score -= 15;
    } else if (docFiles.length > 0) {
      category.strengths.push(`ドキュメント更新: ${docFiles.length} 件`);
    }

    // 2. 指示書の更新
    if (instructionFiles.length > 0) {
      category.strengths.push('ルール・ガイドラインを更新（指示書の更新）');
    }

    // 3. DECISIONS.md の確認
    const hasDecisions = files.some((f) => f.includes('DECISIONS.md'));
    if (hasDecisions) {
      category.strengths.push('意思決定を記録（DECISIONS.md）');
    } else if (files.length > 5) {
      category.issues.push({
        severity: 'info',
        message: 'DECISIONS.md が更新されていません',
        impact: '設計判断が記録されません',
        suggestion: '重要な設計判断を DECISIONS.md に記録してください',
      });
      category.score -= 5;
    }
  }

  /**
   * 総合スコアを計算
   */
  private calculateOverallScore(report: QualityReport): void {
    const categories = Object.values(report.categories);
    const avgScore =
      categories.reduce((sum, cat) => sum + Math.max(0, cat.score), 0) / categories.length;
    report.overallScore = Math.round(avgScore);

    // 推奨事項の生成
    categories.forEach((cat) => {
      cat.issues.forEach((issue) => {
        if (issue.severity === 'critical' || issue.severity === 'error') {
          report.recommendations.push({
            priority: 'high',
            action: issue.suggestion,
            reason: issue.message,
          });
        } else if (issue.severity === 'warning') {
          report.recommendations.push({
            priority: 'medium',
            action: issue.suggestion,
            reason: issue.message,
          });
        }
      });
    });
  }

  /**
   * 品質レポートを出力
   */
  private reportQuality(report: QualityReport): void {
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('='.repeat(80));
    this.outputChannel.appendLine('🎓 上級SE視点: コード品質評価レポート');
    this.outputChannel.appendLine('='.repeat(80));
    this.outputChannel.appendLine('');

    // 総合スコア
    const scoreIcon = report.overallScore >= 80 ? '🟢' : report.overallScore >= 60 ? '🟡' : '🔴';
    this.outputChannel.appendLine(`${scoreIcon} 総合スコア: ${report.overallScore}/100`);
    this.outputChannel.appendLine('');

    // カテゴリ別評価
    const categoryNames = {
      design: '設計品質',
      maintainability: '保守性',
      readability: '可読性',
      testing: 'テスト戦略',
      documentation: 'ドキュメンテーション',
    };

    Object.entries(report.categories).forEach(([key, cat]) => {
      const catScore = Math.max(0, cat.score);
      const catIcon = catScore >= 80 ? '✅' : catScore >= 60 ? '⚠️' : '❌';

      this.outputChannel.appendLine(
        `${catIcon} ${categoryNames[key as keyof typeof categoryNames]}: ${catScore}/100`
      );

      if (cat.issues.length > 0) {
        this.outputChannel.appendLine('   問題:');
        cat.issues.forEach((issue) => {
          const issueIcon =
            issue.severity === 'critical'
              ? '🔴'
              : issue.severity === 'error'
                ? '❌'
                : issue.severity === 'warning'
                  ? '⚠️'
                  : 'ℹ️';
          this.outputChannel.appendLine(`   ${issueIcon} ${issue.message}`);
          this.outputChannel.appendLine(`      影響: ${issue.impact}`);
          this.outputChannel.appendLine(`      対策: ${issue.suggestion}`);
        });
      }

      if (cat.strengths.length > 0) {
        this.outputChannel.appendLine('   強み:');
        cat.strengths.forEach((strength) => {
          this.outputChannel.appendLine(`   ✨ ${strength}`);
        });
      }

      this.outputChannel.appendLine('');
    });

    // 優先推奨事項
    if (report.recommendations.length > 0) {
      this.outputChannel.appendLine('🎯 優先推奨事項:');

      const highPriority = report.recommendations.filter((r) => r.priority === 'high');
      const mediumPriority = report.recommendations.filter((r) => r.priority === 'medium');

      if (highPriority.length > 0) {
        this.outputChannel.appendLine('   🔴 高優先度:');
        highPriority.forEach((rec, i) => {
          this.outputChannel.appendLine(`   ${i + 1}. ${rec.action}`);
          this.outputChannel.appendLine(`      理由: ${rec.reason}`);
        });
        this.outputChannel.appendLine('');
      }

      if (mediumPriority.length > 0) {
        this.outputChannel.appendLine('   🟡 中優先度:');
        mediumPriority.forEach((rec, i) => {
          this.outputChannel.appendLine(`   ${i + 1}. ${rec.action}`);
          this.outputChannel.appendLine(`      理由: ${rec.reason}`);
        });
        this.outputChannel.appendLine('');
      }
    }

    // 総評
    this.outputChannel.appendLine('📝 総評:');
    if (report.overallScore >= 80) {
      this.outputChannel.appendLine('   ✅ 高品質なコードです。レビュー準備完了。');
    } else if (report.overallScore >= 60) {
      this.outputChannel.appendLine('   ⚠️ いくつか改善点があります。推奨事項を確認してください。');
    } else {
      this.outputChannel.appendLine(
        '   ❌ 品質基準を満たしていません。重大な問題を修正してください。'
      );
    }

    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('='.repeat(80));
    this.outputChannel.appendLine('');
  }

  /**
   * 領域結合度の分析
   */
  private analyzeDomainCoupling(files: string[]): Set<string> {
    const domains = new Set<string>();

    files.forEach((file) => {
      // パスから領域を推定
      if (file.includes('/components/')) domains.add('UI');
      else if (file.includes('/ai/')) domains.add('AI');
      else if (file.includes('/utils/')) domains.add('Utils');
      else if (file.includes('/tests/')) domains.add('Test');
      else if (file.includes('/extensions/')) domains.add('Extension');
      else if (file.includes('/docs/')) domains.add('Documentation');
      else if (file.includes('/.aitk/')) domains.add('Instructions');
      else domains.add('Other');
    });

    return domains;
  }
}

/**
 * 品質レポートの型定義
 */
export interface QualityReport {
  timestamp: number;
  actionId: string;
  overallScore: number;
  categories: {
    design: CategoryScore;
    maintainability: CategoryScore;
    readability: CategoryScore;
    testing: CategoryScore;
    documentation: CategoryScore;
  };
  recommendations: QualityRecommendation[];
}

interface CategoryScore {
  score: number;
  issues: QualityIssue[];
  strengths: string[];
}

interface QualityIssue {
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  impact: string;
  suggestion: string;
}

interface QualityRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}
