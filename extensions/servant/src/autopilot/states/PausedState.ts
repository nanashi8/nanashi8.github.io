/**
 * PausedState - 一時停止状態
 *
 * 実行が一時停止されている状態。
 * resume() で実行再開、stop() で完全停止できる。
 */

import { BaseAutopilotState, type AutopilotStateName } from '../AutopilotState';
import type { AutopilotController } from '../AutopilotController';
import { RunningState } from './RunningState';
import { IdleState } from './IdleState';

export class PausedState extends BaseAutopilotState {
  readonly name: AutopilotStateName = 'Paused';

  async enter(context: AutopilotController): Promise<void> {
    context.updateStatusBar('⏸️ 一時停止');
    context.logToOutput('[自動サポート] 一時停止しました');
  }

  async resume(context: AutopilotController): Promise<void> {
    await context.transitionToState(new RunningState());
  }

  async stop(context: AutopilotController): Promise<void> {
    await context.transitionToState(new IdleState());
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return ['Running', 'Idle'].includes(stateName);
  }

  getDescription(): string {
    return '自動サポートは一時停止中です。再開を選ぶと続きます。';
  }
}
