/**
 * IdleState - 待機中状態
 * 
 * 自動操縦が開始されていない初期状態。
 * この状態からのみ start() で実行を開始できる。
 */

import { BaseAutopilotState, type AutopilotStateName } from '../AutopilotState';
import type { AutopilotController } from '../AutopilotController';
import { RunningState } from './RunningState';

export class IdleState extends BaseAutopilotState {
  readonly name: AutopilotStateName = 'Idle';

  async enter(context: AutopilotController): Promise<void> {
    // ステータスバーを更新
    context.updateStatusBar('⏸️ 待機中');
    context.logToOutput('[Autopilot] 待機状態に入りました');
  }

  async start(context: AutopilotController): Promise<void> {
    // Running状態へ遷移
    await context.transitionToState(new RunningState());
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return stateName === 'Running';
  }

  getDescription(): string {
    return '自動操縦は待機中です。開始するには start() を呼び出してください。';
  }
}
