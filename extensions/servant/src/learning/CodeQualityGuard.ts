import * as vscode from 'vscode';
import type { Notifier } from '../ui/Notifier';
import { EventBus, ServantEvents, globalEventBus } from '../core/EventBus';

/**
 * コード品質問題のカテゴリ
 */
export enum QualityIssueCategory {
  /** コードの重複 */
  DUPLICATION = 'duplication',
  /** 未使用のコード */
  DEAD_CODE = 'dead-code',
  /** 変数スコープの問題 */
  SCOPE_ISSUE = 'scope-issue',
  /** 論理エラー */
  LOGIC_ERROR = 'logic-error',
  /** パフォーマンス問題 */
  PERFORMANCE = 'performance',
  /** セキュリティ問題 */
  SECURITY = 'security',
}

/**
 * 検出された品質問題
 */
export interface QualityIssue {
  category: QualityIssueCategory;
  file: string;
  lineStart: number;
  lineEnd: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

/**
 * コード品質ガード - 失敗パターンをリアルタイムで検出・防止
 *
 * 今回の教訓: HTMLコード内の重複した関数定義が原因で天体儀が表示されなかった
 */
export class CodeQualityGuard {
  private workspaceRoot: string;
  private notifier: Notifier;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private statusUpdateCallback: ((status: string) => void) | null = null;
  private eventBus: EventBus;

  // 検出済み問題のキャッシュ（ファイルパス -> 問題リスト）
  private issuesCache = new Map<string, QualityIssue[]>();

  constructor(
    workspaceRoot: string,
    notifier: Notifier,
    eventBus: EventBus = globalEventBus
  ) {
    this.workspaceRoot = workspaceRoot;
    this.notifier = notifier;
    this.eventBus = eventBus;
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('servant-quality');
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
    // EventBus経由で通知
    this.eventBus.emit(ServantEvents.STATUS_UPDATE, {
      message: status,
      icon: status.includes('🔍') ? '🔍' : undefined
    });

    // 後方互換性のため既存のコールバックも呼び出す
    if (this.statusUpdateCallback) {
      this.statusUpdateCallback(status);
    }
  }

  /**
   * ファイル保存時のリアルタイム検証
   */
  public async validateOnSave(document: vscode.TextDocument): Promise<QualityIssue[]> {
    if (!this.shouldValidate(document)) {
      return [];
    }

    this.updateStatus('🔍 品質検証中...');
    const issues: QualityIssue[] = [];
    const content = document.getText();

    // 1. 関数重複の検出（最優先 - 今回の失敗原因）
    issues.push(...this.detectDuplicateFunctions(document, content));

    // 2. HTML内のJavaScript/TypeScriptコード重複
    if (document.languageId === 'typescript' || document.languageId === 'javascript') {
      issues.push(...this.detectDuplicateCodeInHTML(document, content));
    }

    // 3. 変数スコープ問題（const/let が後で上書きされている）
    issues.push(...this.detectScopeIssues(document, content));

    // 4. 未使用の関数/変数
    issues.push(...this.detectDeadCode(document, content));

    // キャッシュ更新
    this.issuesCache.set(document.uri.fsPath, issues);

    // 診断情報を更新
    this.updateDiagnostics(document, issues);

    if (issues.length > 0) {
      // 品質問題検出イベントを発行
      this.eventBus.emit(ServantEvents.QUALITY_ISSUE_DETECTED, {
        file: document.uri.fsPath,
        issues: issues.length
      });

      this.updateStatus(`⚠️ 品質問題: ${issues.length}件`);
    } else {
      this.updateStatus('✅ 品質OK');
    }

    return issues;
  }

  /**
   * 関数の重複定義を検出（最優先）
   */
  private detectDuplicateFunctions(document: vscode.TextDocument, content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // 関数定義のパターン: function name(...) または const/let/var name = function(...)
    const functionPattern = /(?:function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>)/g;

    const functionMap = new Map<string, number[]>(); // 関数名 -> 行番号の配列
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      let match;
      while ((match = functionPattern.exec(line)) !== null) {
        const functionName = match[1] || match[2] || match[3];
        if (!functionMap.has(functionName)) {
          functionMap.set(functionName, []);
        }
        functionMap.get(functionName)!.push(index);
      }
    });

    // 重複をチェック
    functionMap.forEach((lineNumbers, functionName) => {
      if (lineNumbers.length > 1) {
        lineNumbers.forEach((lineNum, idx) => {
          issues.push({
            category: QualityIssueCategory.DUPLICATION,
            file: document.uri.fsPath,
            lineStart: lineNum,
            lineEnd: lineNum,
            severity: 'error',
            message: `関数 "${functionName}" が ${lineNumbers.length} 回定義されています（${idx + 1}回目）。後の定義が前の定義を上書きします。`,
            suggestion: idx === lineNumbers.length - 1
              ? `この定義を残す場合、他の定義（${lineNumbers.slice(0, -1).map(l => `${l + 1}行目`).join(', ')}）を削除してください。`
              : `この定義は ${lineNumbers[lineNumbers.length - 1] + 1}行目の定義で上書きされます。削除を検討してください。`,
            autoFixable: false, // 手動確認が必要
          });
        });
      }
    });

    return issues;
  }

  /**
   * HTML文字列内のJavaScript重複検出
   */
  private detectDuplicateCodeInHTML(document: vscode.TextDocument, content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // HTML文字列（テンプレートリテラルまたは文字列連結）を探す
    const htmlStringPattern = /`[\s\S]*?<script[\s\S]*?<\/script>[\s\S]*?`|['"][\s\S]*?<script[\s\S]*?<\/script>[\s\S]*?['"]/g;

    const matches = content.match(htmlStringPattern);
    if (!matches) return issues;

    matches.forEach(htmlString => {
      // HTML内のscriptタグを抽出
      // Note: これは実際のHTMLパースではなく、コード内のHTML文字列の静的解析です
      // セキュリティ上の懸念を軽減するため、より厳格なパターンを使用
      const scriptPattern = /<script(?:\s+[^>]*)?>(.+?)<\/script>/gs;
      const scriptContents: string[] = [];
      let scriptMatch;

      while ((scriptMatch = scriptPattern.exec(htmlString)) !== null) {
        // scriptMatch[1]が存在し、文字列である場合のみ追加
        if (scriptMatch[1] && typeof scriptMatch[1] === 'string') {
          scriptContents.push(scriptMatch[1]);
        }
      }

      // 各scriptブロックで関数を抽出
      const functionNames = new Map<string, number>();
      scriptContents.forEach(script => {
        const funcPattern = /function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/g;
        let funcMatch;
        while ((funcMatch = funcPattern.exec(script)) !== null) {
          const funcName = funcMatch[1] || funcMatch[2];
          functionNames.set(funcName, (functionNames.get(funcName) || 0) + 1);
        }
      });

      // 重複をレポート
      functionNames.forEach((count, name) => {
        if (count > 1) {
          const startPos = document.positionAt(content.indexOf(htmlString));
          issues.push({
            category: QualityIssueCategory.DUPLICATION,
            file: document.uri.fsPath,
            lineStart: startPos.line,
            lineEnd: startPos.line,
            severity: 'error',
            message: `HTML内のscriptタグで関数 "${name}" が ${count} 回定義されています。`,
            suggestion: '重複したscriptブロックを削除してください。',
            autoFixable: false,
          });
        }
      });
    });

    return issues;
  }

  /**
   * 変数スコープ問題の検出
   */
  private detectScopeIssues(document: vscode.TextDocument, content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const lines = content.split('\n');

    // const/let 宣言後に同じ変数を再代入しようとしている
    const declarations = new Map<string, { line: number; type: 'const' | 'let' | 'var' }>();

    lines.forEach((line, index) => {
      const declMatch = /^\s*(?:(const|let|var)\s+(\w+)\s*=)/g.exec(line);
      if (declMatch) {
        const [, type, varName] = declMatch;
        declarations.set(varName, { line: index, type: type as any });
      }
    });

    lines.forEach((line, index) => {
      // 再代入パターン: varName = ...（ただし宣言ではない）
      const reassignMatch = /^\s*(\w+)\s*=/g.exec(line);
      if (reassignMatch && !line.includes('const') && !line.includes('let') && !line.includes('var')) {
        const varName = reassignMatch[1];
        const decl = declarations.get(varName);
        if (decl && decl.type === 'const') {
          issues.push({
            category: QualityIssueCategory.SCOPE_ISSUE,
            file: document.uri.fsPath,
            lineStart: index,
            lineEnd: index,
            severity: 'error',
            message: `const変数 "${varName}" (${decl.line + 1}行目で宣言) への再代入は不可能です。`,
            suggestion: `${decl.line + 1}行目の宣言を "let" に変更するか、このコードを削除してください。`,
            autoFixable: false,
          });
        }
      }
    });

    return issues;
  }

  /**
   * デッドコード（未使用コード）の検出
   */
  private detectDeadCode(_document: vscode.TextDocument, _content: string): QualityIssue[] {
    // TODO: より高度な解析が必要（TypeScript Language Serviceの利用を検討）
    return [];
  }

  /**
   * 診断情報を更新（VS Codeの問題パネルに表示）
   */
  private updateDiagnostics(document: vscode.TextDocument, issues: QualityIssue[]): void {
    const diagnostics: vscode.Diagnostic[] = issues.map(issue => {
      const range = new vscode.Range(
        issue.lineStart,
        0,
        issue.lineEnd,
        Number.MAX_SAFE_INTEGER
      );

      const severity = issue.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : issue.severity === 'warning'
        ? vscode.DiagnosticSeverity.Warning
        : vscode.DiagnosticSeverity.Information;

      const diagnostic = new vscode.Diagnostic(
        range,
        issue.message + (issue.suggestion ? `\n💡 ${issue.suggestion}` : ''),
        severity
      );

      diagnostic.source = 'Servant Quality Guard';
      diagnostic.code = issue.category;

      return diagnostic;
    });

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * このファイルを検証すべきか判定
   */
  private shouldValidate(document: vscode.TextDocument): boolean {
    const ext = document.uri.fsPath.split('.').pop()?.toLowerCase();
    const validExts = ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'];

    if (!ext || !validExts.includes(ext)) {
      return false;
    }

    // node_modules, dist, build などは除外
    const excludePatterns = ['node_modules', 'dist', 'build', '.git', 'coverage'];
    const relativePath = vscode.workspace.asRelativePath(document.uri.fsPath);

    return !excludePatterns.some(pattern => relativePath.includes(pattern));
  }

  /**
   * 全問題のクリア
   */
  public clearAll(): void {
    this.issuesCache.clear();
    this.diagnosticCollection.clear();
  }

  /**
   * ファイルの問題をクリア
   */
  public clearFile(document: vscode.TextDocument): void {
    this.issuesCache.delete(document.uri.fsPath);
    this.diagnosticCollection.delete(document.uri);
  }

  /**
   * Dispose
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
    this.issuesCache.clear();
  }
}
