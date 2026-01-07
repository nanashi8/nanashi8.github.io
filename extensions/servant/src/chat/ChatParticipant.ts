import * as vscode from 'vscode';

export interface ProblemSummary {
  total: number;
  errors: number;
  warnings: number;
  byFile: Map<string, vscode.Diagnostic[]>;
}

export interface LearningPattern {
  pattern: string;
  category: string;
  occurrences: number;
  weight: number;
  successRate: number;
  description?: string;
  examples: string[];
}

export class ServantChatParticipant {
  private participant: vscode.ChatParticipant | undefined;
  private pendingLearningReport: LearningPattern[] | null = null;

  constructor(private context: vscode.ExtensionContext) {}

  public register(): void {
    // Chat Participant として @servant を登録
    this.participant = vscode.chat.createChatParticipant('servant.chat', this.handleRequest.bind(this));
    this.participant.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'icon.png');

    this.context.subscriptions.push(this.participant);
  }

  private async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    const prompt = request.prompt.toLowerCase();

    // 学習レポートの承認
    if (prompt.includes('承認') || prompt.includes('approve') || prompt === 'y' || prompt === 'yes') {
      if (this.pendingLearningReport) {
        await this.approveLearningReport(stream, token);
        return { metadata: { command: 'approveLearning' } };
      } else {
        stream.markdown('⚠️ 承認待ちの学習レポートはありません。\n');
        return { metadata: { command: 'noReport' } };
      }
    }

    // 学習レポートの拒否
    if (prompt.includes('拒否') || prompt.includes('reject') || prompt === 'n' || prompt === 'no') {
      if (this.pendingLearningReport) {
        this.pendingLearningReport = null;
        stream.markdown('❌ 学習レポートを拒否しました。Instructionsは更新されません。\n');
        return { metadata: { command: 'rejectLearning' } };
      }
    }

    // 問題パネルの確認
    if (prompt.includes('問題') || prompt.includes('エラー') || prompt.includes('error') || prompt.includes('問') || prompt === '') {
      await this.reportProblems(stream, token);
      return { metadata: { command: 'checkProblems' } };
    }

    // プロジェクト情報
    if (prompt.includes('プロジェクト') || prompt.includes('project')) {
      await this.reportProjectInfo(stream, token);
      return { metadata: { command: 'projectInfo' } };
    }

    // デフォルト: ヘルプ
    stream.markdown('## Servant - プロジェクトサーバント\n\n');
    stream.markdown('以下のコマンドが使えます：\n\n');
    stream.markdown('- **問題** - VSCode問題パネルのエラー/警告を報告\n');
    stream.markdown('- **プロジェクト** - プロジェクト構成情報を表示\n');
    stream.markdown('- **y / 承認** - 学習レポートを承認してInstructionsに反映\n');
    stream.markdown('- **n / 拒否** - 学習レポートを拒否\n');
    stream.markdown('\n例: `@servant 問題を確認して修正して`\n');

    return { metadata: { command: 'help' } };
  }

  private async reportProblems(stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
    if (token.isCancellationRequested) return;

    const problems = this.collectProblems();

    if (problems.total === 0) {
      stream.markdown('✅ **問題は見つかりませんでした。**\n\n');
      stream.markdown('VSCode問題パネルにエラーや警告はありません。\n');
      return;
    }

    stream.markdown(`## 🔍 問題パネルの状態\n\n`);
    stream.markdown(`合計: **${problems.total}件** (エラー: ${problems.errors}, 警告: ${problems.warnings})\n\n`);

    // ファイル別に詳細を表示
    let fileCount = 0;
    const maxFiles = 10; // 最大10ファイルまで表示

    for (const [uri, diagnostics] of problems.byFile) {
      if (fileCount >= maxFiles) {
        stream.markdown(`\n*...他 ${problems.byFile.size - maxFiles} ファイル*\n`);
        break;
      }

      const fileName = vscode.workspace.asRelativePath(uri);
      stream.markdown(`### 📄 ${fileName}\n\n`);

      diagnostics.slice(0, 5).forEach((diag) => {
        const severity = diag.severity === vscode.DiagnosticSeverity.Error ? '❌' : '⚠️';
        const line = diag.range.start.line + 1;
        stream.markdown(`${severity} **行${line}**: ${diag.message}\n`);
        if (diag.source) {
          stream.markdown(`   *ソース: ${diag.source}*\n`);
        }
      });

      if (diagnostics.length > 5) {
        stream.markdown(`   *...他 ${diagnostics.length - 5} 件*\n`);
      }
      stream.markdown('\n');
      fileCount++;
    }

    stream.markdown('\n---\n\n');
    stream.markdown('💡 **修正方法**:\n');
    stream.markdown('- 上記のエラーを確認して、コードを修正してください\n');
    stream.markdown('- 必要に応じて「このエラーを修正して」とCopilotに依頼できます\n');
  }

  private async reportProjectInfo(stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
    if (token.isCancellationRequested) return;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      stream.markdown('ワークスペースが開かれていません。\n');
      return;
    }

    stream.markdown('## 📦 プロジェクト情報\n\n');
    stream.markdown(`**パス**: \`${workspaceFolder.uri.fsPath}\`\n\n`);

    // package.json を読み取り
    try {
      const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
      const content = await vscode.workspace.fs.readFile(packageJsonUri);
      const packageJson = JSON.parse(content.toString());

      stream.markdown(`**プロジェクト名**: ${packageJson.name || 'N/A'}\n`);
      stream.markdown(`**バージョン**: ${packageJson.version || 'N/A'}\n`);
      stream.markdown(`**説明**: ${packageJson.description || 'N/A'}\n\n`);

      if (packageJson.scripts) {
        stream.markdown('### 主なスクリプト\n\n');
        const mainScripts = ['dev', 'build', 'test', 'deploy', 'lint'];
        mainScripts.forEach((script) => {
          if (packageJson.scripts[script]) {
            stream.markdown(`- \`npm run ${script}\` - ${packageJson.scripts[script]}\n`);
          }
        });
      }
    } catch {
      stream.markdown('*package.jsonの読み取りに失敗しました*\n');
    }
  }

  private collectProblems(): ProblemSummary {
    const byFile = new Map<string, vscode.Diagnostic[]>();
    let errors = 0;
    let warnings = 0;

    const diagnostics = vscode.languages.getDiagnostics();

    for (const [uri, fileDiagnostics] of diagnostics) {
      if (fileDiagnostics.length === 0) continue;

      // node_modules などは除外
      const path = uri.fsPath;
      if (path.includes('node_modules') || path.includes('dist') || path.includes('.git')) {
        continue;
      }

      byFile.set(uri.fsPath, fileDiagnostics);

      fileDiagnostics.forEach((diag) => {
        if (diag.severity === vscode.DiagnosticSeverity.Error) {
          errors++;
        } else if (diag.severity === vscode.DiagnosticSeverity.Warning) {
          warnings++;
        }
      });
    }

    return {
      total: errors + warnings,
      errors,
      warnings,
      byFile,
    };
  }

  /**
   * 学習レポートをChatに送信（承認待ち）
   */
  public async submitLearningReport(patterns: LearningPattern[]): Promise<void> {
    this.pendingLearningReport = patterns;

    // Copilot Chatを開いて、レポート内容をクリップボードにコピー
    const message = this.formatLearningReportForChat(patterns);
    await vscode.env.clipboard.writeText(`@servant\n${message}`);

    const action = await vscode.window.showInformationMessage(
      `🧠 Servant: 学習完了（${patterns.length}個の高リスクパターン検出）`,
      'Copilot Chatで確認',
      '後で'
    );

    if (action === 'Copilot Chatで確認') {
      await vscode.commands.executeCommand('workbench.action.chat.open');
      vscode.window.showInformationMessage(
        '💡 クリップボードの内容をChatに貼り付けて、レポートを確認してください。'
      );
    }
  }

  private formatLearningReportForChat(patterns: LearningPattern[]): string {
    let message = '# 🧠 適応学習レポート\n\n';
    message += `**検出パターン数**: ${patterns.length}個\n\n`;

    if (patterns.length === 0) {
      message += '現時点で高リスクパターンは検出されていません。\n';
      return message;
    }

    message += '## 📊 検出された高リスクパターン\n\n';

    patterns.forEach((pattern, index) => {
      message += `### ${index + 1}. ${pattern.pattern}\n\n`;
      message += `- **カテゴリ**: ${pattern.category}\n`;
      message += `- **発生回数**: ${pattern.occurrences}回\n`;
      message += `- **リスクスコア**: ${(pattern.weight * 100).toFixed(0)}%\n`;
      message += `- **復旧成功率**: ${(pattern.successRate * 100).toFixed(0)}%\n\n`;

      if (pattern.description) {
        message += `**説明**: ${pattern.description}\n\n`;
      }

      if (pattern.examples.length > 0) {
        message += `**直近の例**:\n`;
        pattern.examples.slice(0, 2).forEach((example) => {
          message += `- ${example}\n`;
        });
        message += '\n';
      }
    });

    message += '---\n\n';
    message += '✅ このレポートを承認してInstructionsに反映するには、**y** または **承認** と入力してください。\n';
    message += '❌ 拒否する場合は **n** または **拒否** と入力してください。\n';

    return message;
  }

  /**
   * 学習レポートの承認処理
   */
  private async approveLearningReport(
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    if (!this.pendingLearningReport || token.isCancellationRequested) {
      return;
    }

    stream.markdown('✅ **学習レポートを承認しました。**\n\n');
    stream.markdown('Instructionsファイルを更新しています...\n\n');

    // コマンド実行でInstructions更新をトリガー
    await vscode.commands.executeCommand('servant.applyLearningReport', this.pendingLearningReport);

    stream.markdown(`✅ **完了**: ${this.pendingLearningReport.length}パターンをInstructionsに反映しました。\n\n`);
    stream.markdown('📄 生成先: `.aitk/instructions/adaptive-learned-patterns.instructions.md`\n');

    this.pendingLearningReport = null;
  }

  /**
   * プログラムから直接Chatにメッセージを送る（自動報告用）
   */
  public async sendAutoReport(message: string): Promise<void> {
    // Chat APIにはプログラムからメッセージを送る直接的な方法がないため、
    // クリップボードにコピー＋通知で対応
    await vscode.env.clipboard.writeText(`@servant ${message}`);

    // クリップボードの内容（@servant ...）を貼り付けるようガイド
    vscode.window.showInformationMessage(
      '💡 クリップボードに「@servant ...」をコピーしました。Chatに貼り付けてください。'
    );
  }
}
