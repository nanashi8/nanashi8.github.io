// サーバント改善: リアルタイム健全性チェック
// extensions/servant/src/health/RealtimeHealthMonitor.ts

import * as vscode from 'vscode';

export class RealtimeHealthMonitor {
  private disposables: vscode.Disposable[] = [];

  constructor(private outputChannel: vscode.OutputChannel) {}

  activate() {
    // 1. ファイル保存時の自動チェック
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        this.checkFileHealth(document);
      })
    );

    // 2. ファイル変更時のリアルタイム警告
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.checkRealtimeMetrics(event.document);
      })
    );
  }

  private checkFileHealth(document: vscode.TextDocument) {
    const lines = document.lineCount;
    const text = document.getText();
    const complexity = this.calculateComplexity(text);

    this.outputChannel.appendLine('');
    this.outputChannel.appendLine(`🏥 [Health Check] ${document.fileName}`);
    this.outputChannel.appendLine(`   行数: ${lines}`);
    this.outputChannel.appendLine(`   複雑度: ${complexity}`);

    // 行数警告
    if (lines > 500) {
      vscode.window.showWarningMessage(
        `⚠️ ${document.fileName} が ${lines} 行あります。500行以下に分割を検討してください。`,
        'リファクタリング提案を見る'
      ).then(selection => {
        if (selection) {
          this.showRefactoringTips(document);
        }
      });
    }

    // 複雑度警告
    if (complexity > 20) {
      vscode.window.showWarningMessage(
        `⚠️ ${document.fileName} の複雑度が高い（${complexity}）です。関数を分割してください。`
      );
    }
  }

  private checkRealtimeMetrics(document: vscode.TextDocument) {
    // 500行を超えたらステータスバーに警告表示
    if (document.lineCount > 500) {
      vscode.window.setStatusBarMessage(
        `⚠️ ${document.lineCount}行 - 分割推奨`,
        3000
      );
    }
  }

  private calculateComplexity(text: string): number {
    // サイクロマティック複雑度の簡易計算
    const ifCount = (text.match(/\bif\b/g) || []).length;
    const forCount = (text.match(/\bfor\b/g) || []).length;
    const whileCount = (text.match(/\bwhile\b/g) || []).length;
    const caseCount = (text.match(/\bcase\b/g) || []).length;
    const catchCount = (text.match(/\bcatch\b/g) || []).length;

    return 1 + ifCount + forCount + whileCount + caseCount + catchCount;
  }

  private showRefactoringTips(document: vscode.TextDocument) {
    const tips = [
      '📋 リファクタリング提案:',
      '',
      '1. UIコンポーネントを別ファイルに分割',
      '   → ConstellationControls.ts',
      '   → ConstellationRenderer.ts',
      '',
      '2. データ処理ロジックを分離',
      '   → ConstellationDataProcessor.ts',
      '',
      '3. イベントハンドラを抽出',
      '   → ConstellationEventHandlers.ts',
      '',
      '4. 定数・型定義を別ファイルへ',
      '   → ConstellationTypes.ts',
    ].join('\n');

    vscode.window.showInformationMessage(
      tips,
      { modal: true }
    );
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
