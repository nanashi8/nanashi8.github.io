import * as vscode from 'vscode';
import { InstructionsLoader } from '../loader/InstructionsLoader';
import { DecisionTreeLoader } from '../loader/DecisionTreeLoader';
import { RuleEngine, Violation } from '../engine/RuleEngine';

export class InstructionsDiagnosticsProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private ruleEngine: RuleEngine;

  constructor(
    private loader: InstructionsLoader,
    private treeLoader: DecisionTreeLoader,
    private context: vscode.ExtensionContext
  ) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('servant');
    this.ruleEngine = new RuleEngine();

    this.context.subscriptions.push(this.diagnosticCollection);
  }

  async validate(uri: vscode.Uri): Promise<Violation[]> {
    try {
      const document = await vscode.workspace.openTextDocument(uri);

      // 設定確認
      if (!this.isEnabled()) {
        this.diagnosticCollection.clear();
        return [];
      }

      // 適用可能なinstructionsを取得
      const instructions = await this.loader.getApplicableInstructions(document);

      // 適用可能なDecision Treesを取得
      const trees = this.treeLoader.getApplicableTrees(document);

      const violations: Violation[] = [];

      // 通常のルール検証
      if (instructions.length > 0) {
        violations.push(...this.ruleEngine.validate(document, instructions));
      }

      // Decision Trees推奨事項の追加
      if (trees.length > 0) {
        violations.push(...this.generateTreeRecommendations(document, trees));
      }

      // Diagnosticsに変換
      const diagnostics = violations.map(v => this.createDiagnostic(v));

      // VSCodeに通知
      this.diagnosticCollection.set(uri, diagnostics);

      console.log(`Validated ${uri.fsPath}: ${diagnostics.length} issues found (${trees.length} trees applied)`);

      return violations;
    } catch (err) {
      console.error(`Failed to validate ${uri.fsPath}:`, err);
      return [];
    }
  }

  private generateTreeRecommendations(
    document: vscode.TextDocument,
    trees: any[]
  ): Violation[] {
    const violations: Violation[] = [];

    // ファイル先頭にDecision Tree推奨を追加（INFO）
    if (trees.length > 0) {
      const firstLine = document.lineAt(0).text;
      const treeNames = trees.map(t => t.id.replace(/-/g, ' ')).join(', ');

      violations.push({
        range: new vscode.Range(0, 0, 0, firstLine.length),
        message: `💡 Decision Tree推奨: このファイルには「${treeNames}」が適用可能です`,
        severity: 'hint',
        ruleId: 'decision-tree-recommendation',
        suggestedFix: `詳細は .aitk/instructions/decision-trees/ を参照`
      });
    }

    return violations;
  }

  private createDiagnostic(violation: Violation): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(
      violation.range,
      violation.message,
      this.getSeverity(violation.severity)
    );

    diagnostic.source = 'servant';
    diagnostic.code = violation.ruleId;

    // Quick Fix提案（relatedInformationは診断自体に設定）
    if (violation.suggestedFix) {
      // 提案をメッセージに追加
      diagnostic.message += `\n\n💡 提案: ${violation.suggestedFix}`;
    }

    return diagnostic;
  }

  private getSeverity(severity: 'error' | 'warning' | 'information' | 'hint'): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'information':
        return vscode.DiagnosticSeverity.Information;
      case 'hint':
        return vscode.DiagnosticSeverity.Hint;
    }
  }

  private isEnabled(): boolean {
    const servantConfig = vscode.workspace.getConfiguration('servant');
    const servantEnabled = servantConfig.get<boolean>('enable');
    if (typeof servantEnabled === 'boolean') {
      return servantEnabled;
    }

    // 後方互換: 旧namespace
    const legacyConfig = vscode.workspace.getConfiguration('instructionsValidator');
    return legacyConfig.get<boolean>('enable', true);
  }

  dispose() {
    this.diagnosticCollection.dispose();
  }
}
