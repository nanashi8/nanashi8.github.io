import * as vscode from 'vscode';

/**
 * コマンドハンドラーインターフェース
 */
export interface CommandHandler {
  /**
   * コマンドID
   */
  readonly id: string;

  /**
   * レガシーID（後方互換性用）
   */
  readonly legacyId?: string;

  /**
   * コマンド実行
   */
  execute(...args: any[]): Promise<void> | void;
}

/**
 * コマンド登録を一元管理するレジストリ
 *
 * extension.ts の肥大化を防ぎ、コマンドハンドラーを分離管理する。
 * 新規コマンド追加時は handlers/ にファイルを追加するだけで、
 * extension.ts の変更は不要。
 */
export class CommandRegistry {
  private handlers = new Map<string, CommandHandler>();

  /**
   * コマンドハンドラーを登録
   */
  register(handler: CommandHandler): void {
    this.handlers.set(handler.id, handler);
  }

  /**
   * 複数のコマンドハンドラーを一括登録
   */
  registerAll(handlers: CommandHandler[]): void {
    for (const handler of handlers) {
      this.register(handler);
    }
  }

  /**
   * 登録済みコマンドをVS Codeに登録
   */
  activateAll(context: vscode.ExtensionContext): void {
    for (const handler of this.handlers.values()) {
      // メインID登録
      const disposable = vscode.commands.registerCommand(
        handler.id,
        (...args: any[]) => handler.execute(...args)
      );
      context.subscriptions.push(disposable);

      // レガシーID登録（後方互換性）
      if (handler.legacyId) {
        const legacyDisposable = vscode.commands.registerCommand(
          handler.legacyId,
          (...args: any[]) => handler.execute(...args)
        );
        context.subscriptions.push(legacyDisposable);
      }
    }
  }

  /**
   * 登録済みコマンド一覧を取得
   */
  getRegisteredCommands(): string[] {
    const commands: string[] = [];
    for (const handler of this.handlers.values()) {
      commands.push(handler.id);
      if (handler.legacyId) {
        commands.push(handler.legacyId);
      }
    }
    return commands;
  }

  /**
   * コマンドが登録されているか確認
   */
  has(commandId: string): boolean {
    for (const handler of this.handlers.values()) {
      if (handler.id === commandId || handler.legacyId === commandId) {
        return true;
      }
    }
    return false;
  }
}
