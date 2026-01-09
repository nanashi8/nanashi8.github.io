/**
 * Servant Event Bus - モジュール間のイベント駆動通信
 *
 * Observer Patternを実装し、疎結合なモジュール間通信を実現。
 * ステータスバー更新、学習完了通知、エラー検出などのイベントを一元管理。
 */

export type EventListener<T = any> = (data: T) => void;

export interface EventSubscription {
  unsubscribe(): void;
}

/**
 * イベントバス - 全モジュールのイベント通信を仲介
 */
export class EventBus {
  private listeners = new Map<string, Set<EventListener>>();
  private onceListeners = new Map<string, Set<EventListener>>();

  /**
   * イベントリスナーを登録
   */
  on<T = any>(event: string, listener: EventListener<T>): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return {
      unsubscribe: () => this.off(event, listener),
    };
  }

  /**
   * 一度だけ実行されるリスナーを登録
   */
  once<T = any>(event: string, listener: EventListener<T>): EventSubscription {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(listener);

    return {
      unsubscribe: () => {
        const listeners = this.onceListeners.get(event);
        if (listeners) {
          listeners.delete(listener);
        }
      },
    };
  }

  /**
   * イベントリスナーを削除
   */
  off<T = any>(event: string, listener: EventListener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * イベントを発行
   */
  emit<T = any>(event: string, data?: T): void {
    // 通常のリスナーを実行
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for event "${event}":`, error);
        }
      }
    }

    // 一度だけのリスナーを実行して削除
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      for (const listener of onceListeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`[EventBus] Error in once-listener for event "${event}":`, error);
        }
      }
      this.onceListeners.delete(event);
    }
  }

  /**
   * 全てのリスナーをクリア
   */
  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  /**
   * 特定イベントのリスナー数を取得
   */
  listenerCount(event: string): number {
    const normalCount = this.listeners.get(event)?.size || 0;
    const onceCount = this.onceListeners.get(event)?.size || 0;
    return normalCount + onceCount;
  }

  /**
   * 登録されている全イベント名を取得
   */
  eventNames(): string[] {
    const names = new Set<string>();
    for (const event of this.listeners.keys()) {
      names.add(event);
    }
    for (const event of this.onceListeners.keys()) {
      names.add(event);
    }
    return Array.from(names);
  }
}

/**
 * グローバルイベントバスのシングルトンインスタンス
 */
export const globalEventBus = new EventBus();

/**
 * 標準イベント名（型安全性のため）
 */
export const ServantEvents = {
  // ステータスバー更新
  STATUS_UPDATE: 'status.update',

  // ドキュメント関連
  DOCUMENT_CREATED: 'document.created',
  DOCUMENT_VIOLATION: 'document.violation',
  DOCUMENT_FIXED: 'document.fixed',

  // 学習システム
  LEARNING_STARTED: 'learning.started',
  LEARNING_COMPLETED: 'learning.completed',
  PATTERN_DETECTED: 'pattern.detected',

  // コード品質
  QUALITY_CHECK_STARTED: 'quality.check.started',
  QUALITY_ISSUE_DETECTED: 'quality.issue.detected',
  QUALITY_CHECK_COMPLETED: 'quality.check.completed',

  // GitHub Actions
  ACTIONS_CHECK_STARTED: 'actions.check.started',
  ACTIONS_ISSUE_DETECTED: 'actions.issue.detected',
  ACTIONS_CHECK_COMPLETED: 'actions.check.completed',

  // Autopilot
  AUTOPILOT_STATE_CHANGED: 'autopilot.state.changed',
  AUTOPILOT_TASK_STARTED: 'autopilot.task.started',
  AUTOPILOT_TASK_COMPLETED: 'autopilot.task.completed',

  // 検証
  VALIDATION_STARTED: 'validation.started',
  VALIDATION_COMPLETED: 'validation.completed',
  VALIDATION_FAILED: 'validation.failed',
} as const;

/**
 * イベントデータ型定義
 */
export interface EventData {
  [ServantEvents.STATUS_UPDATE]: { message: string; icon?: string };
  [ServantEvents.DOCUMENT_VIOLATION]: { file: string; violations: number };
  [ServantEvents.LEARNING_COMPLETED]: { patterns: number };
  [ServantEvents.QUALITY_ISSUE_DETECTED]: { file: string; issues: number };
  [ServantEvents.AUTOPILOT_STATE_CHANGED]: { from: string; to: string; timestamp: number };
  [ServantEvents.AUTOPILOT_TASK_STARTED]: { taskId: string };
  [ServantEvents.AUTOPILOT_TASK_COMPLETED]: { taskId: string; success: boolean };
}
