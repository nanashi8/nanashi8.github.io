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
    context.updateStatusBar('❌ 失敗');
    context.logToOutput(`[Autopilot] 失敗状態に入りました: ${this.reason}`);

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
    return `タスクが失敗しました: ${this.reason}`;
  }

  getReason(): string {
    return this.reason;
  }
}
