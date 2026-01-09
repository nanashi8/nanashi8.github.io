/**
 * InvestigatingState - 調査中状態
 * 
 * エラーの原因を自動調査している状態。
 * complete() で完了、resume() で実行再開できる。
 */

import { BaseAutopilotState, type AutopilotStateName } from '../AutopilotState';
import type { AutopilotController } from '../AutopilotController';
import { CompletedState } from './CompletedState';
import { RunningState } from './RunningState';
import { IdleState } from './IdleState';

export class InvestigatingState extends BaseAutopilotState {
  readonly name: AutopilotStateName = 'Investigating';

  async enter(context: AutopilotController): Promise<void> {
    context.updateStatusBar('🔍 調査中');
    context.logToOutput('[Autopilot] 調査状態に入りました');

    // 自動調査エンジンを起動
    await context.startAutoInvestigation();
  }

  async complete(context: AutopilotController): Promise<void> {
    await context.transitionToState(new CompletedState());
  }

  async resume(context: AutopilotController): Promise<void> {
    // 調査後に実行を再開
    await context.transitionToState(new RunningState());
  }

  async stop(context: AutopilotController): Promise<void> {
    await context.transitionToState(new IdleState());
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return ['Completed', 'Running', 'Idle'].includes(stateName);
  }

  getDescription(): string {
    return 'エラーの原因を自動調査中です。';
  }
}
