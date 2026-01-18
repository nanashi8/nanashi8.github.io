/**
 * CompletedState - 完了状態
 *
 * タスクが正常に完了した状態。
 * stop() でIdle状態へ戻ることができる。
 */

import { BaseAutopilotState, type AutopilotStateName } from '../AutopilotState';
import type { AutopilotController } from '../AutopilotController';
import { IdleState } from './IdleState';

export class CompletedState extends BaseAutopilotState {
  readonly name: AutopilotStateName = 'Completed';

  async enter(context: AutopilotController): Promise<void> {
    context.updateStatusBar('✅ 完了');
    context.logToOutput('[自動サポート] 完了しました');

    // 完了通知
    await context.notifyCompletion();
  }

  async stop(context: AutopilotController): Promise<void> {
    await context.transitionToState(new IdleState());
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return stateName === 'Idle';
  }

  getDescription(): string {
    return '作業が完了しました。';
  }
}
