import * as vscode from 'vscode';
import { CommandHandler } from '../CommandRegistry';
import { DocumentGuard } from '../../guard/DocumentGuard';

/**
 * ドキュメント検証コマンド
 */
export class ValidateDocumentsCommand implements CommandHandler {
  readonly id = 'servant.validateDocuments';

  constructor(private documentGuard: DocumentGuard) {}

  async execute(): Promise<void> {
    await this.documentGuard.validateExistingDocuments();
  }
}
