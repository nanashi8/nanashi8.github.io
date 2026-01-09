/**
 * ReviewingState - レビュー中状態
 * 
 * エラーや警告が発生し、レビューが必要な状態。
 * ユーザーの承認待ち、または自動レビュー実行中。
 * complete() で完了、resume() で実行再開できる。
 */

import { BaseAutopilotState, type AutopilotStateName } from '../AutopilotState';
import type { AutopilotController } from '../AutopilotController';
import { CompletedState } from './CompletedState';
import { RunningState } from './RunningState';
import { IdleState } from './IdleState';

export class ReviewingState extends BaseAutopilotState {
  readonly name: AutopilotStateName = 'Reviewing';

  constructor(
    private severity: 'error' | 'warning',
    private reasons: string[]
  ) {
    super();
  }

  async enter(context: AutopilotController): Promise<void> {
    const icon = this.severity === 'error' ? '❌' : '⚠️';
    context.updateStatusBar(`${icon} レビュー中`);
    context.logToOutput(`[Autopilot] レビュー状態に入りました (${this.severity}): ${this.reasons.join(', ')}`);

    // レビューUIを表示
    await context.showReviewUI(this.severity, this.reasons);
  }

  async complete(context: AutopilotController): Promise<void> {
    await context.transitionToState(new CompletedState());
  }

  async resume(context: AutopilotController): Promise<void> {
    // レビュー後に実行を再開
    await context.transitionToState(new RunningState());
  }

  async stop(context: AutopilotController): Promise<void> {
    await context.transitionToState(new IdleState());
  }

  canTransitionTo(stateName: AutopilotStateName): boolean {
    return ['Completed', 'Running', 'Idle'].includes(stateName);
  }

  getDescription(): string {
    return `レビューが必要です (${this.severity}): ${this.reasons.join(', ')}`;
  }

  getSeverity(): 'error' | 'warning' {
    return this.severity;
  }

  getReasons(): string[] {
    return this.reasons;
  }
}
