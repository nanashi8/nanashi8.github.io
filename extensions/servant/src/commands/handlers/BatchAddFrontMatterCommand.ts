import * as vscode from 'vscode';
import { CommandHandler } from '../CommandRegistry';
import { DocumentGuard } from '../../guard/DocumentGuard';

/**
 * Front Matter 一括追加コマンド
 */
export class BatchAddFrontMatterCommand implements CommandHandler {
  readonly id = 'servant.batchAddFrontMatter';

  constructor(private documentGuard: DocumentGuard) {}

  async execute(): Promise<void> {
    const confirmation = await vscode.window.showWarningMessage(
      'すべてのドキュメントに Front Matter を追加しますか？',
      '実行',
      'キャンセル'
    );
    if (confirmation === '実行') {
      await this.documentGuard.batchAddFrontMatter();
    }
  }
}
