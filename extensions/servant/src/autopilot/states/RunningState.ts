/**
 * RunningState - 実行中状態
 * 
 * 自動操縦が実行中。定期的にタスクを実行する。
 * pause() で一時停止、stop() で停止、startReview() でレビューへ遷移できる。
 */

import { BaseAutopilotState, type AutopilotStateName } from '../AutopilotState';
import type { AutopilotController } from '../AutopilotController';
import { PausedState } from './PausedState';
import { IdleState } from './IdleState';
import { ReviewingState } from './ReviewingState';
import { InvestigatingState } from './InvestigatingState';
import { CompletedState } from './CompletedState';
import { FailedState } from './FailedState';

export class RunningState extends BaseAutopilotState {
  readonly name: AutopilotStateName = 'Running';
  private intervalId?: NodeJS.Timeout;

  async enter(context: AutopilotController): Promise<void> {
    // ステータスバーを更新
    context.updateStatusBar('🚀 実行中');
    context.logToOutput('[Autopilot] 実行状態に入りました');

    // 定期実行を開始
    const interval = context.getConfig('autopilot.interval', 60000);
    this.intervalId = setInterval(async () => {
      try {
        await this.executeTask(context);
      } catch (error) {
        context.logToOutput(`[Autopilot] タスク実行エラー: ${error}`);
        // エラーが発生した場合は自動的にFailed状態へ遷移
        await this.fail(context, String(error));
      }
    }, interval);
  }

  async exit(context: AutopilotController): Promise<void> {
    // 定期実行を停止
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    context.logToOutput('[Autopilot] 実行状態から出ました');
  }

  async pause(context: AutopilotController): Promise<void> {
    await context.transitionToState(new PausedState());
  }

  async stop(context: AutopilotController): Promise<void> {
    await context.transitionToState(new IdleState());
  }

  async executeTask(context: AutopilotController): Promise<void> {
    // 実際のタスク実行ロジック（既存のrunAutopilotTaskを呼び出す）
    await context.executeAutopilotTask();
  }

  async startReview(context: AutopilotController, severity: 'error' | 'warning', reasons: string[]): Promise<void> {
    await context.transitionToState(new ReviewingState(severity, reasons));
  }

  async startInvestigation(context: AutopilotController): Promise<void> {
    await context.transitionToState(new InvestigatingState());
  }

  async complete(context: AutopilotController): Promise<void> {
    await context.transitionToState(new CompletedState());
  }

  async fail(context: AutopilotController, reason: string): Promise<void> {
    await context.transitionToState(new FailedState(reason));
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return ['Paused', 'Idle', 'Reviewing', 'Investigating', 'Completed', 'Failed'].includes(stateName);
  }

  getDescription(): string {
    return '自動操縦が実行中です。定期的にタスクを実行しています。';
  }
}
