/**
 * DocumentGuard - ドキュメント作成ルール強制モジュール
 *
 * 機能:
 * - docs/ 配下への新規 Markdown ファイル作成を監視
 * - DOCUMENTATION_OPERATIONS.md のルールに基づいて配置先を検証
 * - Front Matter の有無をチェック
 * - docs 直下への配置を警告
 * - 適切な配置先を提案
 * - Front Matter テンプレートを自動挿入
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { EventBus, ServantEvents } from '../core/EventBus';

interface DocumentRule {
  pattern: RegExp;
  recommendedDir: string;
  description: string;
}

interface FrontMatter {
  title: string;
  created: string;
  updated: string;
  status: 'draft' | 'review' | 'implemented' | 'archived';
  tags: string[];
}

export class DocumentGuard {
  private workspaceRoot: string;
  private docsPath: string;
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private statusUpdateCallback: ((status: string) => void) | null = null;
  private eventBus: EventBus;
  private stats = {
    monitored: 0,
    violations: 0,
    autoFixed: 0,
  };

  // ドキュメント配置ルール
  private rules: DocumentRule[] = [
    {
      pattern: /spec|specification|仕様/i,
      recommendedDir: 'specifications',
      description: '機能の仕様を定める',
    },
    {
      pattern: /report|completion|完了|レポート/i,
      recommendedDir: 'reports',
      description: '実装・テストの結果報告',
    },
    {
      pattern: /plan|roadmap|計画/i,
      recommendedDir: 'plans',
      description: '今後の計画・ロードマップ',
    },
    {
      pattern: /guideline|rule|規約/i,
      recommendedDir: 'guidelines',
      description: 'コーディング規約・ルール',
    },
    {
      pattern: /development|dev|開発/i,
      recommendedDir: 'development',
      description: '開発環境・手順',
    },
    {
      pattern: /how-to|guide|ガイド/i,
      recommendedDir: 'how-to',
      description: '使い方・操作手順',
    },
    {
      pattern: /quality|test|品質|テスト/i,
      recommendedDir: 'quality',
      description: '品質管理・テスト',
    },
    {
      pattern: /reference|参照|リファレンス/i,
      recommendedDir: 'references',
      description: '技術情報・用語集',
    },
    {
      pattern: /process|workflow|プロセス/i,
      recommendedDir: 'processes',
      description: 'ワークフロー',
    },
    {
      pattern: /maintenance|保守|メンテナンス/i,
      recommendedDir: 'maintenance',
      description: '保守・メンテナンス',
    },
    {
      pattern: /ai|adaptive|学習/i,
      recommendedDir: 'specifications/ai',
      description: 'AI関連仕様',
    },
    {
      pattern: /grammar|文法/i,
      recommendedDir: 'guidelines/grammar',
      description: '文法機能ガイドライン',
    },
    {
      pattern: /passage|長文|パッセージ/i,
      recommendedDir: 'guidelines/passage',
      description: 'パッセージ機能ガイドライン',
    },
  ];

  constructor(workspaceRoot: string, eventBus?: EventBus) {
    this.workspaceRoot = workspaceRoot;
    this.docsPath = path.join(workspaceRoot, 'docs');
    this.eventBus = eventBus || new EventBus(); // デフォルトは新規インスタンス
  }

  /**
   * ステータス更新コールバックを設定
   */
  public setStatusUpdateCallback(callback: (status: string) => void): void {
    this.statusUpdateCallback = callback;
  }

  /**
   * ステータスを更新
   */
  private updateStatus(status: string): void {
    // EventBusでイベント発行
    this.eventBus.emit(ServantEvents.STATUS_UPDATE, { message: status });

    // 既存のコールバックも維持（後方互換性）
    if (this.statusUpdateCallback) {
      this.statusUpdateCallback(status);
    }
  }

  /**
   * 統計情報を取得
   */
  public getStats(): { monitored: number; violations: number; autoFixed: number } {
    return { ...this.stats };
  }

  /**
   * ファイル監視を開始
   */
  public startWatching(): vscode.Disposable {
    // docs/ 配下の Markdown ファイル作成を監視
    const pattern = new vscode.RelativePattern(this.docsPath, '**/*.md');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.fileWatcher.onDidCreate(async (uri) => {
      this.stats.monitored++;
      this.updateStatus(`📄 監視中 (${this.stats.monitored}件)`);
      await this.handleNewDocument(uri);
    });

    this.updateStatus('📄 監視中');
    return this.fileWatcher;
  }

  /**
   * 新規ドキュメント作成時の処理
   */
  private async handleNewDocument(uri: vscode.Uri): Promise<void> {
    // private/ は除外
    if (uri.fsPath.includes('/private/')) {
      return;
    }

    const relativePath = path.relative(this.docsPath, uri.fsPath);
    const fileName = path.basename(uri.fsPath);
    const dirName = path.dirname(relativePath);

    // docs 直下かチェック
    const isRootLevel = dirName === '.';

    // INDEX.md, README.md は除外
    if (isRootLevel && (fileName === 'INDEX.md' || fileName === 'README.md' || fileName === 'DOCUMENTATION_OPERATIONS.md')) {
      return;
    }

    // ファイルが作成されるまで少し待つ
    await new Promise(resolve => setTimeout(resolve, 500));
    const content = await this.readFileContent(uri);

    // Front Matter の有無をチェック
    const hasFrontMatter = this.checkFrontMatter(content);

    // ルール違反をチェック
    const violations: string[] = [];
    const suggestions: string[] = [];

    if (isRootLevel) {
      violations.push('❌ docs 直下への配置は推奨されません');
      const recommendedDir = this.suggestDirectory(fileName);
      if (recommendedDir) {
        suggestions.push(`📂 推奨配置先: docs/${recommendedDir}/`);
      }
    }

    if (!hasFrontMatter) {
      violations.push('❌ Front Matter がありません');
      suggestions.push('📝 Front Matter を自動挿入できます');
    }

    // 違反がある場合は通知
    if (violations.length > 0) {
      this.stats.violations++;
      this.updateStatus(`⚠️ 違反検出 (${this.stats.violations}件)`);

      // EventBusでイベント発行
      this.eventBus.emit(ServantEvents.DOCUMENT_VIOLATION, {
        file: relativePath,
        violations: violations.length
      });

      await this.showViolationNotification(uri, violations, suggestions, hasFrontMatter);
    } else {
      this.updateStatus('✅ 準拠');
      // 2秒後に監視中に戻す
      setTimeout(() => {
        this.updateStatus(`📄 監視中 (${this.stats.monitored}件)`);
      }, 2000);
    }
  }

  /**
   * ファイル名から推奨ディレクトリを提案
   */
  private suggestDirectory(fileName: string): string | null {
    const baseName = path.basename(fileName, '.md');

    for (const rule of this.rules) {
      if (rule.pattern.test(baseName)) {
        return rule.recommendedDir;
      }
    }

    return null;
  }

  /**
   * Front Matter の有無をチェック
   */
  private checkFrontMatter(content: string): boolean {
    return content.trim().startsWith('---');
  }

  /**
   * ルール違反通知を表示
   */
  private async showViolationNotification(
    uri: vscode.Uri,
    violations: string[],
    suggestions: string[],
    hasFrontMatter: boolean
  ): Promise<void> {
    const message = [
      '⚠️ ドキュメント作成ルール違反を検出',
      '',
      ...violations,
      '',
      ...suggestions,
    ].join('\n');

    const actions: string[] = [];

    if (!hasFrontMatter) {
      actions.push('Front Matter を追加');
    }

    if (violations.some(v => v.includes('docs 直下'))) {
      actions.push('移動する');
    }

    actions.push('無視');
    actions.push('ルールを確認');

    const choice = await vscode.window.showWarningMessage(
      message,
      ...actions
    );

    if (choice === 'Front Matter を追加') {
      await this.insertFrontMatter(uri);
      this.stats.autoFixed++;
      this.updateStatus(`✅ 自動修正 (${this.stats.autoFixed}件)`);
    } else if (choice === '移動する') {
      await this.moveToRecommendedLocation(uri);
      this.stats.autoFixed++;
      this.updateStatus(`✅ 自動修正 (${this.stats.autoFixed}件)`);
    } else if (choice === 'ルールを確認') {
      await this.openDocumentationRules();
    }
  }

  /**
   * Front Matter を自動挿入
   */
  private async insertFrontMatter(uri: vscode.Uri): Promise<void> {
    const content = await this.readFileContent(uri);
    const fileName = path.basename(uri.fsPath, '.md');
    const today = new Date().toISOString().split('T')[0];

    // タイトルを推測（kebab-case → Title Case）
    const title = fileName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // タグを推測
    const tags = this.suggestTags(fileName);

    const frontMatter = [
      '---',
      `title: ${title}`,
      `created: ${today}`,
      `updated: ${today}`,
      `status: draft`,
      `tags: [${tags.join(', ')}]`,
      '---',
      '',
    ].join('\n');

    const newContent = frontMatter + content;

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      uri,
      new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE),
      newContent
    );

    await vscode.workspace.applyEdit(edit);
    await vscode.window.showInformationMessage('✅ Front Matter を追加しました');
  }

  /**
   * ファイル名からタグを推測
   */
  private suggestTags(fileName: string): string[] {
    const tags: string[] = [];

    if (/ai|adaptive|learning/i.test(fileName)) {
      tags.push('ai');
    }
    if (/test|quality/i.test(fileName)) {
      tags.push('test');
    }
    if (/spec|specification/i.test(fileName)) {
      tags.push('specification');
    }
    if (/plan|roadmap/i.test(fileName)) {
      tags.push('plan');
    }
    if (/report|completion/i.test(fileName)) {
      tags.push('report');
    }
    if (/guideline|rule/i.test(fileName)) {
      tags.push('guideline');
    }
    if (/development|dev/i.test(fileName)) {
      tags.push('development');
    }

    return tags.length > 0 ? tags : ['documentation'];
  }

  /**
   * 推奨配置先に移動
   */
  private async moveToRecommendedLocation(uri: vscode.Uri): Promise<void> {
    const fileName = path.basename(uri.fsPath);
    const recommendedDir = this.suggestDirectory(fileName);

    if (!recommendedDir) {
      await vscode.window.showInformationMessage('推奨配置先が見つかりませんでした');
      return;
    }

    const targetDir = path.join(this.docsPath, recommendedDir);
    const targetPath = path.join(targetDir, fileName);

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // ファイルを移動
    const edit = new vscode.WorkspaceEdit();
    edit.renameFile(uri, vscode.Uri.file(targetPath));

    const success = await vscode.workspace.applyEdit(edit);

    if (success) {
      await vscode.window.showInformationMessage(
        `✅ ファイルを docs/${recommendedDir}/ に移動しました`
      );
    }
  }

  /**
   * ドキュメント運用ルールを開く
   */
  private async openDocumentationRules(): Promise<void> {
    const rulesPath = path.join(this.docsPath, 'DOCUMENTATION_OPERATIONS.md');
    const uri = vscode.Uri.file(rulesPath);
    await vscode.window.showTextDocument(uri);
  }

  /**
   * ファイル内容を読み込み
   */
  private async readFileContent(uri: vscode.Uri): Promise<string> {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(bytes).toString('utf-8');
    } catch (error) {
      return '';
    }
  }

  /**
   * コマンド: 既存ドキュメントの検証
   */
  public async validateExistingDocuments(): Promise<void> {
    const output = vscode.window.createOutputChannel('Document Guard');
    output.show();
    output.appendLine('📄 既存ドキュメントを検証中...');

    const pattern = new vscode.RelativePattern(this.docsPath, '**/*.md');
    const files = await vscode.workspace.findFiles(pattern, '**/private/**');

    let violations = 0;
    let rootLevelFiles = 0;
    let missingFrontMatter = 0;

    for (const file of files) {
      const relativePath = path.relative(this.docsPath, file.fsPath);
      const dirName = path.dirname(relativePath);
      const isRootLevel = dirName === '.';
      const fileName = path.basename(file.fsPath);

      // INDEX.md, README.md は除外
      if (fileName === 'INDEX.md' || fileName === 'README.md' || fileName === 'DOCUMENTATION_OPERATIONS.md') {
        continue;
      }

      const content = await this.readFileContent(file);
      const hasFrontMatter = this.checkFrontMatter(content);

      if (isRootLevel) {
        rootLevelFiles++;
        output.appendLine(`⚠️  ${relativePath} - docs 直下に配置`);
        violations++;
      }

      if (!hasFrontMatter) {
        missingFrontMatter++;
        output.appendLine(`⚠️  ${relativePath} - Front Matter なし`);
        violations++;
      }
    }

    output.appendLine('');
    output.appendLine('=== 検証結果 ===');
    output.appendLine(`総ファイル数: ${files.length}`);
    output.appendLine(`docs 直下のファイル: ${rootLevelFiles}`);
    output.appendLine(`Front Matter なし: ${missingFrontMatter}`);
    output.appendLine(`違反総数: ${violations}`);

    if (violations === 0) {
      await vscode.window.showInformationMessage('✅ すべてのドキュメントがルールに準拠しています');
    } else {
      await vscode.window.showWarningMessage(
        `⚠️ ${violations} 件のルール違反が見つかりました（詳細は出力パネルを確認）`
      );
    }
  }

  /**
   * コマンド: Front Matter を一括追加
   */
  public async batchAddFrontMatter(): Promise<void> {
    const pattern = new vscode.RelativePattern(this.docsPath, '**/*.md');
    const files = await vscode.workspace.findFiles(pattern, '**/private/**');

    let added = 0;

    for (const file of files) {
      const content = await this.readFileContent(file);
      const hasFrontMatter = this.checkFrontMatter(content);

      if (!hasFrontMatter) {
        await this.insertFrontMatter(file);
        added++;
      }
    }

    await vscode.window.showInformationMessage(
      `✅ ${added} 件のファイルに Front Matter を追加しました`
    );
  }

  /**
   * クリーンアップ
   */
  public dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
  }
}
