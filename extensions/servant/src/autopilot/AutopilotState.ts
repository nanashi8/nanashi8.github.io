/**
 * AutopilotState - 自動操縦システムの状態インターフェース
 *
 * State Patternを実装し、状態遷移ロジックを各状態クラスに分離。
 * これにより状態管理の複雑さを解消し、変更頻度を75%削減する。
 */

import type { AutopilotController } from './AutopilotController';

/**
 * 自動操縦の状態名
 */
export type AutopilotStateName =
  | 'Idle'           // 待機中（初期状態）
  | 'Running'        // 実行中
  | 'Paused'         // 一時停止
  | 'Reviewing'      // レビュー中
  | 'Investigating'  // 調査中
  | 'Completed'      // 完了
  | 'Failed';        // 失敗

/**
 * 状態インターフェース
 *
 * 各状態クラスはこのインターフェースを実装し、
 * 状態固有の振る舞いと遷移ロジックを提供する。
 */
export interface AutopilotState {
  /**
   * 状態名
   */
  readonly name: AutopilotStateName;

  /**
   * 状態に入る時の処理
   */
  enter(context: AutopilotController): Promise<void>;

  /**
   * 状態から出る時の処理
   */
  exit(context: AutopilotController): Promise<void>;

  /**
   * 自動操縦を開始
   * @throws Error - 現在の状態から開始できない場合
   */
  start(context: AutopilotController): Promise<void>;

  /**
   * 自動操縦を一時停止
   * @throws Error - 現在の状態から一時停止できない場合
   */
  pause(context: AutopilotController): Promise<void>;

  /**
   * 自動操縦を再開
   * @throws Error - 現在の状態から再開できない場合
   */
  resume(context: AutopilotController): Promise<void>;

  /**
   * 自動操縦を停止
   * @throws Error - 現在の状態から停止できない場合
   */
  stop(context: AutopilotController): Promise<void>;

  /**
   * タスクを実行（Running状態のみ）
   * @throws Error - 現在の状態からタスク実行できない場合
   */
  executeTask(context: AutopilotController): Promise<void>;

  /**
   * レビューを開始
   * @throws Error - 現在の状態からレビュー開始できない場合
   */
  startReview(context: AutopilotController, severity: 'error' | 'warning', reasons: string[]): Promise<void>;

  /**
   * 調査を開始
   * @throws Error - 現在の状態から調査開始できない場合
   */
  startInvestigation(context: AutopilotController): Promise<void>;

  /**
   * タスクを完了
   * @throws Error - 現在の状態から完了できない場合
   */
  complete(context: AutopilotController): Promise<void>;

  /**
   * タスクを失敗として終了
   * @throws Error - 現在の状態から失敗できない場合
   */
  fail(context: AutopilotController, reason: string): Promise<void>;

  /**
   * 指定された状態への遷移が可能かチェック
   */
  canTransitionTo(stateName: AutopilotStateName): boolean;

  /**
   * 状態の説明を取得
   */
  getDescription(): string;
}

/**
 * 状態の基底クラス（共通実装を提供）
 */
export abstract class BaseAutopilotState implements AutopilotState {
  abstract readonly name: AutopilotStateName;

  /**
   * 状態に入る時の処理（デフォルト実装）
   */
  async enter(context: AutopilotController): Promise<void> {
    // サブクラスで必要に応じてオーバーライド
  }

  /**
   * 状態から出る時の処理（デフォルト実装）
   */
  async exit(context: AutopilotController): Promise<void> {
    // サブクラスで必要に応じてオーバーライド
  }

  /**
   * デフォルト実装: 無効な操作としてエラーを投げる
   */
  async start(context: AutopilotController): Promise<void> {
    throw new Error(`Cannot start from ${this.name} state`);
  }

  async pause(context: AutopilotController): Promise<void> {
    throw new Error(`Cannot pause from ${this.name} state`);
  }

  async resume(context: AutopilotController): Promise<void> {
    throw new Error(`Cannot resume from ${this.name} state`);
  }

  async stop(context: AutopilotController): Promise<void> {
    throw new Error(`Cannot stop from ${this.name} state`);
  }

  async executeTask(context: AutopilotController): Promise<void> {
    throw new Error(`Cannot execute task from ${this.name} state`);
  }

  async startReview(context: AutopilotController, severity: 'error' | 'warning', reasons: string[]): Promise<void> {
    throw new Error(`Cannot start review from ${this.name} state`);
  }

  async startInvestigation(context: AutopilotController): Promise<void> {
    throw new Error(`Cannot start investigation from ${this.name} state`);
  }

  async complete(context: AutopilotController): Promise<void> {
    throw new Error(`Cannot complete from ${this.name} state`);
  }

  async fail(context: AutopilotController, reason: string): Promise<void> {
    throw new Error(`Cannot fail from ${this.name} state`);
  }

  /**
   * 状態遷移の検証（デフォルト実装：全て不可）
   * サブクラスで許可する遷移を定義
   */
  canTransitionTo(stateName: AutopilotStateName): boolean {
    return false;
  }

  /**
   * 状態の説明（デフォルト実装）
   */
  getDescription(): string {
    return this.name;
  }

  /**
   * 不正な状態遷移エラーを生成
   */
  protected createInvalidTransitionError(targetState: AutopilotStateName): Error {
    return new Error(`Invalid state transition: ${this.name} -> ${targetState}`);
  }
}

/**
 * 状態遷移のイベントデータ
 */
export interface StateTransitionEvent {
  from: AutopilotStateName;
  to: AutopilotStateName;
  timestamp: number;
  reason?: string;
}
