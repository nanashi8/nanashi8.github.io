import * as vscode from 'vscode';
import { CommandHandler } from '../CommandRegistry';

/**
 * Servant 出力パネル表示コマンド
 */
export class ShowOutputCommand implements CommandHandler {
  readonly id = 'servant.showOutput';

  constructor(private outputChannel: vscode.OutputChannel) {}

  execute(): void {
    this.outputChannel.show();
  }
}
