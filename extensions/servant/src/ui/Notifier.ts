import * as vscode from 'vscode';

export type NotificationMode = 'quiet' | 'standard' | 'strict';
export type NotificationSource = 'command' | 'auto' | 'system';
export type NotificationLevel = 'info' | 'warning' | 'error';

export class Notifier {
  private lastShownAt = new Map<string, number>();
  private statusUpdateCallback: ((status: string) => void) | null = null;

  constructor(private outputChannel?: vscode.OutputChannel) {}

  /**
   * ステータスバー更新コールバックを設定
   */
  public setStatusUpdateCallback(callback: (status: string) => void): void {
    this.statusUpdateCallback = callback;
  }

  /**
   * ステータスバーを更新（静かな通知）
   */
  private updateStatus(status: string): void {
    if (this.statusUpdateCallback) {
      this.statusUpdateCallback(status);
    }
  }

  public commandInfo(message: string, ...actions: string[]): Thenable<string | undefined> | undefined {
    return this.show('info', 'command', message, { actions });
  }

  public commandWarning(message: string, ...actions: string[]): Thenable<string | undefined> | undefined {
    return this.show('warning', 'command', message, { actions });
  }

  public commandError(message: string, ...actions: string[]): Thenable<string | undefined> | undefined {
    return this.show('error', 'command', message, { actions });
  }

  public autoInfo(message: string, key?: string): Thenable<string | undefined> | undefined {
    return this.show('info', 'auto', message, { key });
  }

  public autoWarning(message: string, key?: string): Thenable<string | undefined> | undefined {
    return this.show('warning', 'auto', message, { key });
  }

  public critical(message: string, ...actions: string[]): Thenable<string | undefined> {
    // critical は常に割り込み
    return this.showForced('error', message, { actions });
  }

  /**
   * “止める”用途の割り込み（モーダル）。
   * ユーザーが選択/キャンセルするまで入力を要求する。
   *
   * 注: このメソッドは静かな通知モードでは、ステータスバー＋出力パネルのみに通知します。
   * 重要な場合のみモーダルを表示します。
   */
  public blockingCritical(message: string, ...actions: string[]): Thenable<string | undefined> {
    this.outputChannel?.appendLine(`[Notify][blocking][error] ${message}`);

    // ステータスバーに表示
    this.updateStatus(`⚠️ ${message.substring(0, 40)}...`);

    // quiet モードではステータスバーと出力パネルのみ、それ以外は選択可能なダイアログを表示
    const mode = this.getMode();
    if (mode === 'quiet') {
      // 出力パネルに詳細を表示
      this.outputChannel?.appendLine(`[Notify] アクション: ${actions.join(', ')}`);
      this.outputChannel?.show(true); // 出力パネルを表示

      // 非モーダルな警告として表示（邪魔にならない）
      return vscode.window.showWarningMessage(message, ...actions);
    }

    // standard/strict モードでは従来通りモーダル表示
    return vscode.window.showErrorMessage(message, { modal: true }, ...actions);
  }

  public modalInfo(message: string): Thenable<void> {
    // モーダルは「ユーザーが明示的に実行したガイダンス」用途のみを想定
    return vscode.window.showInformationMessage(message, { modal: true }).then(() => {});
  }

  private getMode(): NotificationMode {
    const config = vscode.workspace.getConfiguration('servant');
    const mode = config.get<string>('notifications.mode', 'quiet');
    if (mode === 'standard' || mode === 'strict' || mode === 'quiet') return mode;
    return 'quiet';
  }

  private getCooldownMs(): number {
    const config = vscode.workspace.getConfiguration('servant');
    const value = config.get<number>('notifications.cooldownMs', 60_000);
    return typeof value === 'number' && value >= 0 ? value : 60_000;
  }

  private shouldShow(level: NotificationLevel, source: NotificationSource): boolean {
    const mode = this.getMode();

    if (level === 'error') {
      return true;
    }

    if (mode === 'strict') {
      return true;
    }

    if (mode === 'standard') {
      // standard はコマンド起点だけ表示
      return source === 'command';
    }

    // quiet は「ユーザーが押したコマンドの結果（成功）」だけ返す
    return source === 'command' && level === 'info';
  }

  private show(
    level: NotificationLevel,
    source: NotificationSource,
    message: string,
    opts?: { actions?: string[]; key?: string }
  ): Thenable<string | undefined> | undefined {
    if (!this.shouldShow(level, source)) {
      this.outputChannel?.appendLine(`[Notify][suppressed][${source}][${level}] ${message}`);
      return undefined;
    }

    const key = opts?.key ?? `${source}:${level}:${message}`;
    if (!this.passesCooldown(key)) {
      this.outputChannel?.appendLine(`[Notify][cooldown][${source}][${level}] ${message}`);
      return undefined;
    }

    return this.showForced(level, message, { actions: opts?.actions });
  }

  private showForced(
    level: NotificationLevel,
    message: string,
    opts?: { actions?: string[] }
  ): Thenable<string | undefined> {
    const actions = opts?.actions ?? [];

    if (level === 'error') {
      this.outputChannel?.appendLine(`[Notify][error] ${message}`);
      return vscode.window.showErrorMessage(message, ...actions);
    }

    if (level === 'warning') {
      this.outputChannel?.appendLine(`[Notify][warning] ${message}`);
      return vscode.window.showWarningMessage(message, ...actions);
    }

    this.outputChannel?.appendLine(`[Notify][info] ${message}`);
    return vscode.window.showInformationMessage(message, ...actions);
  }

  private passesCooldown(key: string): boolean {
    const cooldownMs = this.getCooldownMs();
    if (cooldownMs === 0) return true;

    const now = Date.now();
    const last = this.lastShownAt.get(key);
    if (typeof last === 'number' && now - last < cooldownMs) {
      return false;
    }

    this.lastShownAt.set(key, now);
    return true;
  }
}
