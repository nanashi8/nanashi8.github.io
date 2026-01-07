/**
 * ScheduleStrategy - Strategy Patternインターフェース
 *
 * QuestionSchedulerのモード切り替えロジックを個別Strategyクラスへ分離
 *
 * 【設計方針】
 * - Open/Closed Principle: 新モード追加時は既存コード変更不要
 * - Single Responsibility: 各Strategyは1つのスケジューリング戦略に専念
 * - Dependency Injection: 依存関係を明示的に注入
 *
 * 【使用例】
 * ```typescript
 * const strategy = new HybridScheduleStrategy(dependencies);
 * const result = await strategy.schedule(context);
 * ```
 */

import type { PrioritizedQuestion, ScheduleResult, ScheduleParams } from '../types';
import type { AntiVibrationFilter } from '../AntiVibrationFilter';
import type { AICoordinator } from '@/ai/AICoordinator';
import type { SlotAllocator } from '../SlotAllocator';
import type { BatchManager } from '../BatchManager';

/**
 * スケジューリング戦略の共通インターフェース
 */
export interface ScheduleStrategy {
  /**
   * 問題をスケジューリング
   *
   * @param context - スケジューリングコンテキスト
   * @returns スケジューリング結果
   */
  schedule(context: ScheduleContext): Promise<ScheduleResult>;
}

/**
 * スケジューリングコンテキスト
 *
 * Strategy実行に必要な全情報を集約
 */
export interface ScheduleContext {
  /** スケジューリングパラメータ */
  params: ScheduleParams;

  /** スケジューリング開始時刻（performance.now()） */
  startTime: number;

  /** 依存関係 */
  dependencies: SchedulerDependencies;

  /** 進捗データ（wordProgress） */
  progressData: Record<string, any>;
}

/**
 * Schedulerの依存関係
 *
 * Dependency Injectionで注入される外部コンポーネント
 */
export interface SchedulerDependencies {
  /** 振動防止フィルタ */
  antiVibration: AntiVibrationFilter;

  /** AIコーディネーター（7AI統合） */
  aiCoordinator: AICoordinator;

  /** スロット割り当て管理 */
  slotAllocator: SlotAllocator;

  /** バッチ管理（nullの場合はバッチモード無効） */
  batchManager: BatchManager | null;

  /**
   * QuestionSchedulerインスタンス（Context）
   *
   * Strategy PatternにおけるContextとして機能。
   * Strategyから共通処理（buildContext, detectSignals等）を呼び出すために必要。
   *
   * TODO: 工程6で共通ヘルパーに抽出し、この依存を削除
   */
  scheduler: any; // QuestionScheduler型（循環参照回避のためany）
}

/**
 * ベース戦略クラス
 *
 * 共通処理を実装し、各Strategy実装の重複を削減
 */
export abstract class BaseScheduleStrategy implements ScheduleStrategy {
  protected deps: SchedulerDependencies;

  constructor(deps: SchedulerDependencies) {
    this.deps = deps;
  }

  /**
   * スケジューリング実行（抽象メソッド）
   *
   * 各Strategy実装で具体的なロジックを定義
   */
  abstract schedule(context: ScheduleContext): Promise<ScheduleResult>;

  /**
   * 結果を構築（共通処理）
   *
   * @param questions - 優先度付き問題リスト
   * @param meta - メタ情報
   * @returns スケジューリング結果
   */
  protected buildResult(
    questions: PrioritizedQuestion[],
    meta: {
      source: string;
      elapsed: number;
      vibrationScore?: number;
      signalCount?: number;
      debugInfo?: any;
    }
  ): ScheduleResult {
    return {
      scheduledQuestions: questions.map((pq) => pq.question),
      vibrationScore: meta.vibrationScore ?? 0,
      processingTime: meta.elapsed,
      signalCount: meta.signalCount ?? 0,
      debug: {
        dtaApplied: 0, // Strategyで計算して設定
        antiVibrationApplied: 0, // Strategyで計算して設定
        signalsDetected: [],
        ...meta.debugInfo,
      },
    };
  }

  /**
   * デバッグログ出力（共通処理）
   *
   * @param message - ログメッセージ
   * @param data - ログデータ
   */
  protected log(message: string, data?: any): void {
    if (import.meta.env.DEV && localStorage.getItem('debug-scheduler-verbose') === 'true') {
      console.log(`[${this.constructor.name}] ${message}`, data || '');
    }
  }

  /**
   * エラーログ出力（共通処理）
   *
   * @param message - エラーメッセージ
   * @param error - エラーオブジェクト
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.constructor.name}] ${message}`, error || '');
  }
}
