/**
 * hybridQuestionSelector.ts
 *
 * 混合戦略出題ロジック
 * 記憶獲得（同日復習）と記憶保持（分散学習）を適切に混合して出題
 *
 * @author AI Assistant
 * @version 1.0
 * @since 2025-12-16
 */

import { LearningPhase } from './learningPhaseDetector';
import type { PersonalParameters } from './personalParameterEstimator';
import { QueueType, QuestionCategory } from './memoryAcquisitionAlgorithm';

/**
 * 問題選択の基本情報
 */
export interface QuestionCandidate {
  /** 単語ID */
  id: string;

  /** 単語テキスト */
  word: string;

  /** カテゴリ */
  category: QuestionCategory;

  /** 現在のフェーズ */
  phase: LearningPhase;

  /** 復習回数 */
  reviewCount: number;

  /** 正答回数 */
  correctCount: number;

  /** 最終復習時刻 */
  lastReviewTime: number;

  /** 初回出題時刻（新規単語用、短時間SM-2で使用） */
  firstSeenTime?: number;

  /** 次回復習予定時刻 */
  nextReviewTime?: number;

  /** 同日復習キュータイプ（あれば） */
  queueType?: QueueType;

  /** 問題番号（キュー内での位置） */
  questionNumber?: number;

  /** 難易度（1-5） */
  difficulty?: number;
}

/**
 * 混合戦略設定
 */
export interface HybridStrategy {
  /** 記憶獲得（新規単語）の割合（0-1） */
  acquisitionRatio: number;

  /** 記憶保持（復習単語）の割合（0-1） */
  retentionRatio: number;

  /** 動的調整を有効化 */
  adaptiveAdjustment: boolean;

  /** セッション内の問題番号（動的調整用） */
  sessionQuestionNumber?: number;
}

/**
 * デフォルトの混合戦略
 */
export const DEFAULT_HYBRID_STRATEGY: HybridStrategy = {
  acquisitionRatio: 0.6,
  retentionRatio: 0.4,
  adaptiveAdjustment: true,
  sessionQuestionNumber: 0,
};

/**
 * 優先度計算結果
 */
export interface PriorityResult {
  /** 問題候補 */
  candidate: QuestionCandidate;

  /** 計算された優先度（0-100） */
  priority: number;

  /** 優先度の内訳 */
  breakdown: {
    queuePriority: number; // キュー優先度（0-40）
    phasePriority: number; // フェーズ優先度（0-30）
    timingPriority: number; // タイミング優先度（0-20）
    personalPriority: number; // 個人パラメータ優先度（0-10）
  };

  /** デバッグ用情報 */
  reason: string;
}

/**
 * 混合戦略出題ロジック
 *
 * 新規単語（記憶獲得）と復習単語（記憶保持）を適切に混合して出題
 */
export class HybridQuestionSelector {
  private strategy: HybridStrategy;
  private personalParams: PersonalParameters | null = null;

  constructor(strategy: HybridStrategy = DEFAULT_HYBRID_STRATEGY) {
    this.strategy = { ...strategy };
  }

  /**
   * 個人パラメータを設定
   */
  setPersonalParameters(params: PersonalParameters): void {
    this.personalParams = params;
  }

  /**
   * 混合戦略を更新
   */
  updateStrategy(strategy: Partial<HybridStrategy>): void {
    this.strategy = { ...this.strategy, ...strategy };
  }

  /**
   * 次の問題を選択
   *
   * 選択ロジック:
   * 1. 同日復習キューの優先処理
   * 2. 混合比率に基づく新規/復習の選択
   * 3. 個人パラメータによる調整
   */
  selectNextQuestion(candidates: QuestionCandidate[]): QuestionCandidate | null {
    if (candidates.length === 0) {
      return null;
    }

    // 優先度を計算
    const priorities = candidates.map((c) => this.calculatePriority(c));

    // 優先度でソート（降順）
    priorities.sort((a, b) => b.priority - a.priority);

    // 同日復習キューが存在する場合は最優先
    const queuedQuestion = priorities.find((p) => p.candidate.queueType !== undefined);
    if (queuedQuestion) {
      return queuedQuestion.candidate;
    }

    // 混合戦略に基づく選択
    return this.selectByStrategy(priorities);
  }

  /**
   * 優先度を計算
   */
  calculatePriority(candidate: QuestionCandidate): PriorityResult {
    const breakdown = {
      queuePriority: this.calculateQueuePriority(candidate),
      phasePriority: this.calculatePhasePriority(candidate),
      timingPriority: this.calculateTimingPriority(candidate),
      personalPriority: this.calculatePersonalPriority(candidate),
    };

    const priority = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    const reason = this.generatePriorityReason(candidate, breakdown);

    return {
      candidate,
      priority,
      breakdown,
      reason,
    };
  }

  /**
   * キュー優先度の計算（0-40）
   */
  private calculateQueuePriority(candidate: QuestionCandidate): number {
    if (!candidate.queueType) {
      return 0;
    }

    // キュータイプ別の基本優先度
    const baseQueuePriority: Record<QueueType, number> = {
      [QueueType.IMMEDIATE]: 40, // 即時復習: 最優先
      [QueueType.EARLY]: 30, // 早期復習: 高優先
      [QueueType.MID]: 20, // 中期復習: 中優先
      [QueueType.END]: 10, // 終了時復習: 低優先（セッション終了時のみ）
    };

    let priority = baseQueuePriority[candidate.queueType] || 0;

    // 問題番号が小さいほど優先度を上げる（キュー内での順序）
    if (candidate.questionNumber !== undefined) {
      const positionBonus = Math.max(0, 5 - candidate.questionNumber * 0.5);
      priority += positionBonus;
    }

    return Math.min(40, priority);
  }

  /**
   * フェーズ優先度の計算（0-30）
   */
  private calculatePhasePriority(candidate: QuestionCandidate): number {
    // フェーズ別の基本優先度
    const phasePriorityMap: Record<LearningPhase, number> = {
      [LearningPhase.ENCODING]: 25, // 初見: 高優先
      [LearningPhase.INITIAL_CONSOLIDATION]: 30, // 初期統合: 最優先
      [LearningPhase.INTRADAY_REVIEW]: 20, // 同日復習: 中優先
      [LearningPhase.SHORT_TERM]: 15, // 短期記憶: やや低優先
      [LearningPhase.LONG_TERM]: 10, // 長期記憶: 低優先
    };

    return phasePriorityMap[candidate.phase] || 0;
  }

  /**
   * タイミング優先度の計算（0-20）
   * 短時間SM-2: 秒・分単位での時間経過を優先度に反映
   */
  private calculateTimingPriority(candidate: QuestionCandidate): number {
    const now = Date.now();

    // 新規単語の場合: 初回出題からの経過時間を優先度に反映（短時間SM-2）
    if (candidate.reviewCount === 0 && candidate.firstSeenTime) {
      const secondsSinceFirstSeen = (now - candidate.firstSeenTime) / 1000;

      // 時間経過に応じて優先度を上げる（振動防止）
      // 1分経過 = +5点、2分 = +7点、5分 = +10点、10分以上 = +15点
      if (secondsSinceFirstSeen >= 600) return 15; // 10分以上
      if (secondsSinceFirstSeen >= 300) return 10; // 5分以上
      if (secondsSinceFirstSeen >= 120) return 7; // 2分以上
      if (secondsSinceFirstSeen >= 60) return 5; // 1分以上
      return 0; // 1分未満は基本優先度のみ
    }

    // 復習予定時刻がない場合（古い新規単語）
    if (!candidate.nextReviewTime) {
      return 15; // 中程度の優先度
    }

    // 復習予定時刻との差（ms）
    const timeDiff = now - candidate.nextReviewTime;

    // 予定時刻を過ぎている場合
    if (timeDiff >= 0) {
      // 遅延時間に応じて優先度を上げる（最大20）
      const hoursOverdue = timeDiff / (1000 * 60 * 60);
      return Math.min(20, 10 + hoursOverdue * 2);
    }

    // まだ予定時刻に達していない場合
    const hoursEarly = Math.abs(timeDiff) / (1000 * 60 * 60);

    // 予定時刻まで1時間以内なら優先度を上げる
    if (hoursEarly <= 1) {
      return 10 - hoursEarly * 5;
    }

    // それ以外は低優先度
    return 0;
  }

  /**
   * 個人パラメータ優先度の計算（0-10）
   */
  private calculatePersonalPriority(candidate: QuestionCandidate): number {
    if (!this.personalParams) {
      return 5; // デフォルト（中立）
    }

    let priority = 5;

    // 学習速度が遅い場合、新規単語の優先度を下げる
    if (candidate.reviewCount === 0 && this.personalParams.learningSpeed < 0.8) {
      priority -= 2;
    }

    // 学習速度が速い場合、新規単語の優先度を上げる
    if (candidate.reviewCount === 0 && this.personalParams.learningSpeed > 1.2) {
      priority += 2;
    }

    // 忘却速度が速い場合、復習単語の優先度を上げる
    if (candidate.reviewCount > 0 && this.personalParams.forgettingSpeed > 1.2) {
      priority += 3;
    }

    // 忘却速度が遅い場合、復習単語の優先度を下げる
    if (candidate.reviewCount > 0 && this.personalParams.forgettingSpeed < 0.8) {
      priority -= 2;
    }

    return Math.max(0, Math.min(10, priority));
  }

  /**
   * 混合戦略に基づく決定的選択（業界標準: Anki/FSRS準拠）
   *
   * バケット分類 + タイブレーカーによる決定論的選択。
   * 1. 優先度を3段階のバケットに分類
   * 2. 上位バケットから選択
   * 3. バケット内では優先度→最終復習時刻でソート
   */
  private selectByStrategy(priorities: PriorityResult[]): QuestionCandidate | null {
    if (priorities.length === 0) {
      return null;
    }

    // セッション進行に応じたバイアスを計算
    const acquisitionBias = this.calculateAdaptiveBias();

    // 新規単語にバイアスを適用
    const adjustedPriorities = priorities.map((p) => ({
      ...p,
      adjustedPriority: p.candidate.reviewCount === 0 ? p.priority + acquisitionBias : p.priority,
    }));

    // バケット分類（高: 60+, 中: 30-59, 低: 0-29）
    const highPriority = adjustedPriorities.filter((p) => p.adjustedPriority >= 60);
    const midPriority = adjustedPriorities.filter(
      (p) => p.adjustedPriority >= 30 && p.adjustedPriority < 60
    );
    const lowPriority = adjustedPriorities.filter((p) => p.adjustedPriority < 30);

    // 上位バケットから選択
    const bucket =
      highPriority.length > 0 ? highPriority : midPriority.length > 0 ? midPriority : lowPriority;

    if (bucket.length === 0) {
      return null;
    }

    // バケット内でソート:
    // 1. 優先度が5点以上離れていれば優先度順
    // 2. 5点以内なら最終復習時刻が古い方を優先（FSRS準拠）
    bucket.sort((a, b) => {
      const priorityDiff = b.adjustedPriority - a.adjustedPriority;

      // 優先度が明確に異なる場合
      if (Math.abs(priorityDiff) >= 5) {
        return priorityDiff;
      }

      // 優先度が近い場合、時刻でタイブレーク（短時間SM-2）
      // 初回出題時刻も考慮し、古い方を優先
      const timeA = a.candidate.lastReviewTime || a.candidate.firstSeenTime || 0;
      const timeB = b.candidate.lastReviewTime || b.candidate.firstSeenTime || 0;

      // 両方とも時刻記録がない場合のみ辞書順
      if (timeA === 0 && timeB === 0) {
        return a.candidate.word.localeCompare(b.candidate.word);
      }

      return timeA - timeB;
    });

    return bucket[0].candidate;
  }

  /**
   * 文字列のシンプルなハッシュ関数（安定ソート用）
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32ビット整数に変換
    }
    return Math.abs(hash);
  }

  /**
   * セッション進行に応じた決定的バイアススコア計算
   * （業界標準: 確率ではなく優先度調整として実装）
   */
  private calculateAdaptiveBias(): number {
    if (!this.strategy.adaptiveAdjustment || this.strategy.sessionQuestionNumber === undefined) {
      return 0; // デフォルト: バイアスなし
    }

    const questionNumber = this.strategy.sessionQuestionNumber;

    // 序盤（1-10問）: 新規に+15点のバイアス
    if (questionNumber <= 10) {
      return 15;
    }

    // 中盤（11-20問）: 新規に+10点のバイアス
    if (questionNumber <= 20) {
      return 10;
    }

    // 終盤（21-30問）: 新規に+5点のバイアス
    if (questionNumber <= 30) {
      return 5;
    }

    // それ以降: バイアスなし（復習が自然に優先される）
    return 0;
  }

  /**
   * 優先度の理由を生成（デバッグ用）
   */
  private generatePriorityReason(
    candidate: QuestionCandidate,
    _breakdown: PriorityResult['breakdown']
  ): string {
    const reasons: string[] = [];

    if (candidate.queueType) {
      reasons.push(`キュー: ${candidate.queueType}`);
    }

    reasons.push(`フェーズ: ${candidate.phase}`);

    if (candidate.nextReviewTime) {
      const now = Date.now();
      const diff = now - candidate.nextReviewTime;
      const hours = Math.abs(diff / (1000 * 60 * 60));

      if (diff >= 0) {
        reasons.push(`遅延: ${hours.toFixed(1)}時間`);
      } else {
        reasons.push(`予定まで: ${hours.toFixed(1)}時間`);
      }
    }

    if (candidate.reviewCount === 0) {
      reasons.push('新規単語');
    } else {
      reasons.push(`復習${candidate.reviewCount}回目`);
    }

    return reasons.join(', ');
  }

  /**
   * 優先度の内訳を取得（デバッグ用）
   */
  getAllPriorities(candidates: QuestionCandidate[]): PriorityResult[] {
    return candidates.map((c) => this.calculatePriority(c)).sort((a, b) => b.priority - a.priority);
  }
}

/**
 * シングルトンインスタンス
 */
let defaultSelector: HybridQuestionSelector | null = null;

/**
 * デフォルトセレクターを取得
 */
export function getDefaultSelector(): HybridQuestionSelector {
  if (!defaultSelector) {
    defaultSelector = new HybridQuestionSelector();
  }
  return defaultSelector;
}

/**
 * デフォルトセレクターをリセット
 */
export function resetDefaultSelector(): void {
  defaultSelector = null;
}
