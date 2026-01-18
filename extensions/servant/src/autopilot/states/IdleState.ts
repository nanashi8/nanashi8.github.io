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
    context.logToOutput('[自動サポート] 待機中です');
  }

  async start(context: AutopilotController): Promise<void> {
    // Running状態へ遷移
    await context.transitionToState(new RunningState());
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return stateName === 'Running';
  }

  getDescription(): string {
    return '自動サポートは待機中です。開始するときは「開始」を選んでください。';
  }
}
