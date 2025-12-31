import * as vscode from 'vscode';
import { RuleEngine, Violation } from '../engine/RuleEngine';
import { InstructionsLoader } from '../loader/InstructionsLoader';
import { Notifier } from '../ui/Notifier';

/**
 * Instructions違反に対するQuick Fix機能を提供
 */
export class InstructionsCodeActionProvider implements vscode.CodeActionProvider {
  constructor(
    private loader: InstructionsLoader,
    private engine: RuleEngine
  ) {}

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // このプロバイダーは診断に基づくQuick Fixのみを提供
    for (const diagnostic of context.diagnostics) {
      if (
        diagnostic.source === 'servant' ||
        diagnostic.source === 'instructions-validator' ||
        diagnostic.source === 'Instructions Validator' ||
        diagnostic.source === 'Servant'
      ) {
        const quickFixes = this.createQuickFixes(document, diagnostic);
        actions.push(...quickFixes);
      }
    }

    return actions;
  }

  private createQuickFixes(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // diagnosticのメッセージから違反タイプを判定
    const message = diagnostic.message;

    // メッセージが存在しない場合は空配列を返す
    if (!message || typeof message !== 'string') {
      return actions;
    }

    // Position階層不変条件違反のQuick Fix
    if (message.includes('Position階層不変条件')) {
      actions.push(this.createPositionFix(document, diagnostic));
    }

    // バッチ方式3原則違反のQuick Fix
    if (message.includes('バッチ方式3原則')) {
      if (message.includes('1つのファイルで1つのルールのみ')) {
        actions.push(this.createSplitPositionFix(document, diagnostic));
      }
      if (message.includes('修正は1つのファイルで完結')) {
        actions.push(this.createSingleFileFix(document, diagnostic));
      }
      if (message.includes('順次実行')) {
        actions.push(this.createSequentialFix(document, diagnostic));
      }
    }

    // 仕様書参照違反のQuick Fix
    if (message.includes('仕様書を参照')) {
      actions.push(this.createSpecReferenceFix(document, diagnostic));
    }

    // ジェネリックルール違反のQuick Fix
    if (message.includes('コメントに記載')) {
      actions.push(this.createCommentFix(document, diagnostic));
    }

    return actions;
  }

  /**
   * Position階層不変条件違反の修正
   */
  private createPositionFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '💡 Positionの階層構造を修正',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    const edit = new vscode.WorkspaceEdit();
    const line = document.lineAt(diagnostic.range.start.line);
    const text = line.text;

    // Position継承の修正例
    if (text.includes('class') && text.includes('Position')) {
      // BasePosition → Positionの修正
      if (text.includes('BasePosition')) {
        const newText = text.replace(/class\s+(\w+)\s+extends\s+BasePosition/, 'class $1 extends Position');
        edit.replace(document.uri, line.range, newText);
      }
    }

    action.edit = edit;
    return action;
  }

  /**
   * バッチ方式: Position分割の修正
   */
  private createSplitPositionFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '💡 複数のPositionを別ファイルに分割することを提案',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];

    // 実際の分割は手動で行う必要があるため、情報提供のみ
    action.command = {
      command: 'servant.showSplitGuidance',
      title: 'Position分割ガイダンスを表示',
      arguments: [document.uri, diagnostic.range]
    };

    return action;
  }

  /**
   * バッチ方式: 単一ファイル完結の修正
   */
  private createSingleFileFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '💡 単一ファイル完結ガイダンス',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];

    action.command = {
      command: 'servant.showSingleFileGuidance',
      title: '単一ファイル完結ガイダンスを表示',
      arguments: [document.uri]
    };

    return action;
  }

  /**
   * バッチ方式: 順次実行の修正
   */
  private createSequentialFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '💡 並列実行を順次実行に変更',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];

    const edit = new vscode.WorkspaceEdit();
    const line = document.lineAt(diagnostic.range.start.line);
    const text = line.text;

    // Promise.all → 順次実行の修正
    if (text.includes('Promise.all')) {
      const indentation = text.match(/^\s*/)?.[0] || '';
      const newText = `${indentation}// TODO: Promise.allを順次実行(for...of + await)に変更してください\n${text}`;
      edit.replace(document.uri, line.range, newText);
    }

    action.edit = edit;
    return action;
  }

  /**
   * 仕様書参照違反の修正
   */
  private createSpecReferenceFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '💡 仕様書参照コメントを追加',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    const edit = new vscode.WorkspaceEdit();
    const line = document.lineAt(diagnostic.range.start.line);
    const indentation = line.text.match(/^\s*/)?.[0] || '';

    // コード修正の前に仕様書参照コメントを追加
    const commentText = `${indentation}// 参考: [仕様書名](仕様書パス) - セクション名\n`;
    edit.insert(document.uri, line.range.start, commentText);

    action.edit = edit;
    return action;
  }

  /**
   * ジェネリックルール: コメント追加
   */
  private createCommentFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '💡 説明コメントを追加',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];

    const edit = new vscode.WorkspaceEdit();
    const line = document.lineAt(diagnostic.range.start.line);
    const indentation = line.text.match(/^\s*/)?.[0] || '';

    // コードの前に説明コメントを追加
    const commentText = `${indentation}// TODO: このコードの目的と動作を説明してください\n`;
    edit.insert(document.uri, line.range.start, commentText);

    action.edit = edit;
    return action;
  }

  /**
   * 複数のQuick Fixをグループ化
   */
  private createRefactorAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '🔧 Instructions違反を自動修正',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];

    // 複数の修正を組み合わせる
    const edit = new vscode.WorkspaceEdit();

    // ここで複数の修正を適用
    // (実装は将来的に拡張)

    action.edit = edit;
    return action;
  }
}

/**
 * Quick Fixガイダンスコマンドの登録
 */
export function registerQuickFixCommands(
  context: vscode.ExtensionContext,
  notifier?: Notifier
): void {
  const guidanceNotifier = notifier ?? new Notifier();
  // Position分割ガイダンス
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'servant.showSplitGuidance',
      (uri: vscode.Uri, range: vscode.Range) => {
        const message =
          '💡 Position分割ガイダンス:\n\n' +
          '1. 各Positionを別々のファイルに移動\n' +
          '2. ファイル名は[Position名].tsとする\n' +
          '3. 1ファイル1Positionの原則を守る\n\n' +
          '詳細: https://github.com/...';

        void guidanceNotifier.modalInfo(message);
      }
    )
  );

  // 後方互換: 旧コマンドID
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'instructions-validator.showSplitGuidance',
      (uri: vscode.Uri, range: vscode.Range) => {
        vscode.commands.executeCommand('servant.showSplitGuidance', uri, range);
      }
    )
  );

  // 単一ファイル完結ガイダンス
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'servant.showSingleFileGuidance',
      (uri: vscode.Uri) => {
        const message =
          '💡 単一ファイル完結ガイダンス:\n\n' +
          '1. 修正は1つのファイルで完結させる\n' +
          '2. 複数ファイルにまたがる修正は避ける\n' +
          '3. 必要に応じてリファクタリングで分割\n\n' +
          '詳細: https://github.com/...';

        void guidanceNotifier.modalInfo(message);
      }
    )
  );

  // 後方互換: 旧コマンドID
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'instructions-validator.showSingleFileGuidance',
      (uri: vscode.Uri) => {
        vscode.commands.executeCommand('servant.showSingleFileGuidance', uri);
      }
    )
  );
}
