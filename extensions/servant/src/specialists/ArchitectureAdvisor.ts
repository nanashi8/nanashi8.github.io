import * as fs from 'fs';
import * as path from 'path';

/**
 * アーキテクチャ上の問題
 */
export interface ArchitectureIssue {
  /** 問題の種類 */
  type: 'design-pattern' | 'code-smell' | 'architecture' | 'documentation' | 'pipeline' | 'security' | 'accessibility' | 'performance' | 'compliance' | 'monitoring';
  /** 重大度 */
  severity: 'info' | 'warning' | 'critical';
  /** 対象ファイル/ディレクトリ */
  target: string;
  /** 問題の説明 */
  description: string;
  /** 推奨される改善策 */
  recommendation: string;
  /** 適用すべきパターン/プラクティス */
  suggestedPattern?: string;
  /** 参考リンク */
  references?: string[];
}

/**
 * プロジェクト分析結果
 */
export interface ProjectAnalysis {
  /** 総ファイル数 */
  totalFiles: number;
  /** TypeScript/JavaScript ファイル数 */
  codeFiles: number;
  /** テストファイル数 */
  testFiles: number;
  /** ドキュメントファイル数 */
  docFiles: number;
  /** 平均ファイルサイズ（行数） */
  avgFileSize: number;
  /** 最大ファイルサイズ（行数） */
  maxFileSize: number;
  /** 循環依存の有無 */
  hasCircularDependencies: boolean;
  /** テストカバレッジの有無 */
  hasTestCoverage: boolean;
  /** CI/CDパイプラインの有無 */
  hasCIPipeline: boolean;
  /** ドキュメントの充実度 */
  documentationScore: number; // 0-100
  /** セキュリティ設定の有無 */
  hasSecurityConfig: boolean;
  /** アクセシビリティ設定の有無 */
  hasA11yConfig: boolean;
  /** エラー追跡の有無 */
  hasErrorTracking: boolean;
  /** パフォーマンスモニタリングの有無 */
  hasPerformanceMonitoring: boolean;
}

/**
 * アーキテクチャアドバイザー
 *
 * プロジェクトの構造を分析し、設計パターン、リファクタリング、
 * アーキテクチャ改善を提案する。
 */
export class ArchitectureAdvisor {
  private workspaceRoot: string;
  private analysisCache: ProjectAnalysis | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * プロジェクト全体を分析
   */
  public async analyzeProject(): Promise<ProjectAnalysis> {
    console.log('🏗️ [ArchitectureAdvisor] Analyzing project structure...');

    const files = await this.getAllFiles();
    const codeFiles = files.filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && !f.includes('node_modules'));
    const testFiles = codeFiles.filter(f => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f));
    const docFiles = files.filter(f => /\.(md|txt)$/.test(f));

    // ファイルサイズ分析
    const fileSizes = await Promise.all(
      codeFiles.slice(0, 100).map(async f => {
        try {
          const content = fs.readFileSync(path.join(this.workspaceRoot, f), 'utf-8');
          return content.split('\n').length;
        } catch {
          return 0;
        }
      })
    );

    const avgFileSize = fileSizes.length > 0
      ? Math.round(fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length)
      : 0;
    const maxFileSize = fileSizes.length > 0 ? Math.max(...fileSizes) : 0;

    // CI/CDパイプラインの検出
    const hasCIPipeline = files.some(f =>
      f.includes('.github/workflows') ||
      f.includes('.gitlab-ci.yml') ||
      f.includes('Jenkinsfile')
    );

    // テストカバレッジ設定の検出
    const hasTestCoverage = files.some(f =>
      f.includes('coverage') ||
      f.includes('jest.config') ||
      f.includes('vitest.config')
    );

    // ドキュメントスコア（簡易版）
    const documentationScore = this.calculateDocumentationScore(docFiles.length, codeFiles.length);

    // セキュリティ設定の検出
    const hasSecurityConfig = files.some(f =>
      f.includes('security.txt') ||
      f.includes('SECURITY.md') ||
      f.includes('.snyk') ||
      f.includes('dependabot.yml')
    );

    // アクセシビリティ設定の検出
    const hasA11yConfig = files.some(f =>
      f.includes('.pa11yrc') ||
      f.includes('axe.config') ||
      f.includes('a11y') ||
      codeFiles.some(cf => {
        try {
          const content = fs.readFileSync(path.join(this.workspaceRoot, cf), 'utf-8');
          return content.includes('aria-') || content.includes('role=');
        } catch {
          return false;
        }
      })
    );

    // エラートラッキングの検出
    const hasErrorTracking = files.some(f =>
      f.includes('sentry') ||
      f.includes('bugsnag') ||
      f.includes('rollbar')
    ) || codeFiles.slice(0, 20).some(f => {
      try {
        const content = fs.readFileSync(path.join(this.workspaceRoot, f), 'utf-8');
        return content.includes('Sentry') || content.includes('ErrorBoundary');
      } catch {
        return false;
      }
    });

    // パフォーマンスモニタリングの検出
    const hasPerformanceMonitoring = files.some(f =>
      f.includes('lighthouse') ||
      f.includes('web-vitals') ||
      f.includes('performance.mark')
    );

    this.analysisCache = {
      totalFiles: files.length,
      codeFiles: codeFiles.length,
      testFiles: testFiles.length,
      docFiles: docFiles.length,
      avgFileSize,
      maxFileSize,
      hasCircularDependencies: false, // TODO: 実装
      hasTestCoverage,
      hasCIPipeline,
      documentationScore,
      hasSecurityConfig,
      hasA11yConfig,
      hasErrorTracking,
      hasPerformanceMonitoring
    };

    console.log(`✅ [ArchitectureAdvisor] Analysis complete: ${codeFiles.length} code files`);
    return this.analysisCache;
  }

  /**
   * アーキテクチャ上の問題を検出
   */
  public async detectIssues(): Promise<ArchitectureIssue[]> {
    const analysis = this.analysisCache || await this.analyzeProject();
    const issues: ArchitectureIssue[] = [];

    // 1. 巨大ファイルの検出（God Object）
    if (analysis.maxFileSize > 500) {
      issues.push({
        type: 'code-smell',
        severity: 'warning',
        target: 'Large files detected',
        description: `最大ファイルサイズが${analysis.maxFileSize}行です。500行を超えるファイルは保守性が低下します。`,
        recommendation: 'Single Responsibility Principleに従い、ファイルを分割してください。',
        suggestedPattern: 'Module Pattern, Facade Pattern',
        references: [
          'https://refactoring.guru/refactoring/smells/long-method',
          'https://refactoring.guru/design-patterns/facade'
        ]
      });
    }

    // 2. テストカバレッジの欠如
    if (!analysis.hasTestCoverage && analysis.codeFiles > 10) {
      issues.push({
        type: 'pipeline',
        severity: 'warning',
        target: 'Testing infrastructure',
        description: 'テストカバレッジ測定の仕組みが検出されませんでした。',
        recommendation: 'Jest/Vitestのカバレッジレポート設定を追加してください。',
        references: [
          'https://vitest.dev/guide/coverage.html',
          'https://jestjs.io/docs/configuration#collectcoverage-boolean'
        ]
      });
    }

    // 3. CI/CDパイプラインの欠如
    if (!analysis.hasCIPipeline && analysis.codeFiles > 20) {
      issues.push({
        type: 'pipeline',
        severity: 'warning',
        target: 'CI/CD Pipeline',
        description: 'CI/CDパイプラインが検出されませんでした。',
        recommendation: 'GitHub Actions/GitLab CIでビルド・テスト自動化を設定してください。',
        references: [
          'https://docs.github.com/en/actions',
          'https://docs.gitlab.com/ee/ci/'
        ]
      });
    }

    // 4. ドキュメント不足
    if (analysis.documentationScore < 30) {
      issues.push({
        type: 'documentation',
        severity: 'info',
        target: 'Project Documentation',
        description: `ドキュメントスコア: ${analysis.documentationScore}/100。ドキュメントが不足しています。`,
        recommendation: 'README.md、アーキテクチャ図、API仕様書を追加してください。',
        references: [
          'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes'
        ]
      });
    }

    // 5. テスト/コード比率
    const testRatio = analysis.codeFiles > 0 ? analysis.testFiles / analysis.codeFiles : 0;
    if (testRatio < 0.3 && analysis.codeFiles > 10) {
      issues.push({
        type: 'pipeline',
        severity: 'warning',
        target: 'Test Coverage',
        description: `テスト/コード比率が${Math.round(testRatio * 100)}%と低いです。`,
        recommendation: '重要なロジックに対してユニットテストを追加してください。',
        suggestedPattern: 'Test-Driven Development (TDD)',
        references: [
          'https://martinfowler.com/bliki/TestCoverage.html'
        ]
      });
    }

    // 6. プロジェクトサイズに対する構造化不足
    if (analysis.codeFiles > 50 && analysis.avgFileSize > 200) {
      issues.push({
        type: 'architecture',
        severity: 'critical',
        target: 'Project Structure',
        description: 'プロジェクトが大きくなっていますが、モジュール化が不十分です。',
        recommendation: 'レイヤードアーキテクチャやClean Architectureの導入を検討してください。',
        suggestedPattern: 'Layered Architecture, Clean Architecture, Hexagonal Architecture',
        references: [
          'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
          'https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/'
        ]
      });
    }

    // 7. セキュリティ設定の欠如（業界標準）
    if (!analysis.hasSecurityConfig && analysis.codeFiles > 10) {
      issues.push({
        type: 'security',
        severity: 'critical',
        target: 'Security Configuration',
        description: 'セキュリティポリシーや脆弱性スキャン設定が検出されませんでした。',
        recommendation: 'SECURITY.md、Dependabot、Snykなどのセキュリティツールを導入してください。',
        suggestedPattern: 'OWASP Top 10, Secure Coding Practices',
        references: [
          'https://owasp.org/www-project-top-ten/',
          'https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository',
          'https://github.com/dependabot'
        ]
      });
    }

    // 8. アクセシビリティの欠如（業界標準）
    if (!analysis.hasA11yConfig && analysis.codeFiles > 5) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        target: 'Accessibility (A11y)',
        description: 'アクセシビリティ対応が検出されませんでした。',
        recommendation: 'WCAG 2.1/2.2に準拠したアクセシビリティテストを導入してください。',
        suggestedPattern: 'WCAG 2.1 Level AA, ARIA',
        references: [
          'https://www.w3.org/WAI/WCAG21/quickref/',
          'https://github.com/pa11y/pa11y',
          'https://www.deque.com/axe/'
        ]
      });
    }

    // 9. エラートラッキングの欠如（業界標準）
    if (!analysis.hasErrorTracking && analysis.codeFiles > 20) {
      issues.push({
        type: 'monitoring',
        severity: 'warning',
        target: 'Error Tracking',
        description: 'エラー追跡・監視システムが検出されませんでした。',
        recommendation: 'Sentry、Bugsnag、Rollbarなどのエラートラッキングツールを導入してください。',
        references: [
          'https://sentry.io/',
          'https://www.bugsnag.com/',
          'https://rollbar.com/'
        ]
      });
    }

    // 10. パフォーマンスモニタリングの欠如（業界標準）
    if (!analysis.hasPerformanceMonitoring && analysis.codeFiles > 15) {
      issues.push({
        type: 'performance',
        severity: 'info',
        target: 'Performance Monitoring',
        description: 'パフォーマンス測定の仕組みが検出されませんでした。',
        recommendation: 'Lighthouse、Web Vitals、Performance APIでパフォーマンスを監視してください。',
        suggestedPattern: 'Core Web Vitals, Performance Budget',
        references: [
          'https://web.dev/vitals/',
          'https://developers.google.com/web/tools/lighthouse',
          'https://developer.mozilla.org/en-US/docs/Web/API/Performance_API'
        ]
      });
    }

    console.log(`🔍 [ArchitectureAdvisor] Detected ${issues.length} issues`);
    return issues;
  }

  /**
   * デザインパターンの適用機会を検出
   */
  public async suggestPatterns(): Promise<ArchitectureIssue[]> {
    const suggestions: ArchitectureIssue[] = [];
    const files = await this.getAllFiles();

    // 重複コードの検出（簡易版）
    const duplicatePatterns = await this.detectDuplicateCode(files);
    if (duplicatePatterns > 3) {
      suggestions.push({
        type: 'design-pattern',
        severity: 'info',
        target: 'Code Duplication',
        description: '類似したコードパターンが複数箇所で検出されました。',
        recommendation: 'Strategy PatternやTemplate Method Patternで共通化を検討してください。',
        suggestedPattern: 'Strategy Pattern, Template Method Pattern, Factory Pattern',
        references: [
          'https://refactoring.guru/design-patterns/strategy',
          'https://refactoring.guru/design-patterns/template-method'
        ]
      });
    }

    return suggestions;
  }

  /**
   * リファクタリング提案を生成
   */
  public async suggestRefactoring(): Promise<string> {
    const issues = await this.detectIssues();
    const patterns = await this.suggestPatterns();
    const allSuggestions = [...issues, ...patterns];

    if (allSuggestions.length === 0) {
      return '✅ プロジェクトは良好な状態です。特に改善の必要はありません。';
    }

    let report = '## 🏗️ アーキテクチャ改善提案\n\n';

    // 重大度別に分類
    const critical = allSuggestions.filter(s => s.severity === 'critical');
    const warnings = allSuggestions.filter(s => s.severity === 'warning');
    const info = allSuggestions.filter(s => s.severity === 'info');

    if (critical.length > 0) {
      report += '### 🔴 Critical Issues\n\n';
      critical.forEach(issue => {
        report += this.formatIssue(issue);
      });
    }

    if (warnings.length > 0) {
      report += '### ⚠️ Warnings\n\n';
      warnings.forEach(issue => {
        report += this.formatIssue(issue);
      });
    }

    if (info.length > 0) {
      report += '### 💡 Suggestions\n\n';
      info.forEach(issue => {
        report += this.formatIssue(issue);
      });
    }

    return report;
  }

  /**
   * 問題のフォーマット
   */
  private formatIssue(issue: ArchitectureIssue): string {
    let formatted = `**${issue.target}** (${issue.type})\n`;
    formatted += `- 問題: ${issue.description}\n`;
    formatted += `- 推奨: ${issue.recommendation}\n`;
    if (issue.suggestedPattern) {
      formatted += `- パターン: ${issue.suggestedPattern}\n`;
    }
    if (issue.references && issue.references.length > 0) {
      formatted += `- 参考: ${issue.references[0]}\n`;
    }
    formatted += '\n';
    return formatted;
  }

  /**
   * ドキュメントスコアを計算
   */
  private calculateDocumentationScore(docFiles: number, codeFiles: number): number {
    if (codeFiles === 0) return 0;

    // 基本スコア: ドキュメント/コード比率
    const ratio = Math.min(docFiles / codeFiles, 0.5) * 2; // 最大0.5比率で100%

    return Math.round(ratio * 100);
  }

  /**
   * 重複コード検出（簡易版）
   */
  private async detectDuplicateCode(_files: string[]): Promise<number> {
    // TODO: より高度な実装
    return 0;
  }

  /**
   * すべてのファイルを取得
   */
  private async getAllFiles(): Promise<string[]> {
    const files: string[] = [];

    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;

          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.workspaceRoot, fullPath);

          if (entry.isDirectory()) {
            walk(fullPath);
          } else {
            files.push(relativePath);
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    };

    walk(this.workspaceRoot);
    return files;
  }
}
