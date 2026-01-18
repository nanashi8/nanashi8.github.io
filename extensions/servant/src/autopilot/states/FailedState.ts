/**
 * FailedState - 失敗状態
 *
 * タスク実行が失敗した状態。
 * stop() でIdle状態へ戻ることができる。
 */

import { BaseAutopilotState, type AutopilotStateName } from '../AutopilotState';
import type { AutopilotController } from '../AutopilotController';
import { IdleState } from './IdleState';

export class FailedState extends BaseAutopilotState {
  readonly name: AutopilotStateName = 'Failed';

  constructor(private reason: string) {
    super();
  }

  async enter(context: AutopilotController): Promise<void> {
    context.updateStatusBar('❌ 問題発生');
    context.logToOutput(`[自動サポート] 問題が発生しました: ${this.reason}`);

    // 失敗通知
    await context.notifyFailure(this.reason);
  }

  async stop(context: AutopilotController): Promise<void> {
    await context.transitionToState(new IdleState());
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return stateName === 'Idle';
  }

  getDescription(): string {
    return `作業に問題が起きました: ${this.reason}`;
  }

  getReason(): string {
    return this.reason;
  }
}
