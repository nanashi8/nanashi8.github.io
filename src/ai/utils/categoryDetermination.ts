/**
 * 学習段階（position）判定ユーティリティ（統合レイヤー）
 *
 * 設計思想:
 * 1. ゴールファースト判定（連続正解による即座の定着判定）
 * 2. 複雑なケースは基本的な計算で対応
 * 3. 7つのAIの統合はQuestionSchedulerで実施（循環依存回避）
 *
 * Position = 0-100の優先度スコア
 * - 0-20: mastered (定着済み)
 * - 20-40: new (新規)
 * - 40-70: still_learning (学習中)
 * - 70-100: incorrect (要復習)
 *
 * スコアが高いほど優先的に出題される
 */

import type { WordProgress } from '@/storage/progress/types';
import type { WordPosition } from '@/ai/types';
import type { WordCategory } from '@/ai/types';
import {
  POSITION_VALUES,
  CONSECUTIVE_THRESHOLDS,
  ACCURACY_THRESHOLDS,
  BOOST_VALUES,
  ATTEMPT_THRESHOLDS,
  normalizePosition,
} from './positionConstants';

// NOTE:
// - Position は SSOT（POSITION_VALUES）に揃え、テストで期待される固定値（75/85/50 等）を返す。
// - 「カテゴリ内で回数に応じてPositionを微調整する」方式は、値がテスト/仕様と乖離しやすいため採用しない。

/**
 * 単語の学習優先度スコア（Position）を計算
 *
 * 🎯 ゴール: まだまだ・分からない（Position 40+）を0にする
 *
 * アーキテクチャ:
 * 1. ゴールファースト判定（連続正解による即座の定着判定）
 * 2. 基本的な計算（正答率・連続不正解・時間経過）
 *
 * 注: 7つのAI統合はQuestionSchedulerで実施（循環依存回避のため）
 *
 * @param progress - 単語の進捗情報
 * @param mode - 学習モード（タブ別Position管理）
 * @returns Position スコア (0-100)
 */
export type LearningMode = 'memorization' | 'translation' | 'spelling' | 'grammar';

export type SavedPositionDecisionForDebug = {
  mode: LearningMode;
  savedPosition: number;
  decision: 'use_saved_position' | 'ignore_saved_position';
  reason?: 'auto_promoted_still_learning_progress' | 'other';
  accuracyForOverride: number;
  modeAttempts: number;
  modeCorrect: number;
  modeStillLearning: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
};

function getSavedPosition(progress: WordProgress, mode: LearningMode): number | undefined {
  switch (mode) {
    case 'memorization':
      return progress.memorizationPosition;
    case 'translation':
      return progress.translationPosition;
    case 'spelling':
      return progress.spellingPosition;
    case 'grammar':
      return progress.grammarPosition;
  }
}

function getModeCounts(
  progress: WordProgress,
  mode: LearningMode
): { attempts: number; correct: number; stillLearning: number } {
  switch (mode) {
    case 'memorization':
      return {
        attempts: progress.memorizationAttempts || 0,
        correct: progress.memorizationCorrect || 0,
        stillLearning: progress.memorizationStillLearning || 0,
      };
    case 'translation':
      return {
        attempts: progress.translationAttempts || 0,
        correct: progress.translationCorrect || 0,
        stillLearning: 0,
      };
    case 'spelling':
      return {
        attempts: progress.spellingAttempts || 0,
        correct: progress.spellingCorrect || 0,
        stillLearning: 0,
      };
    case 'grammar':
      return {
        attempts: progress.grammarAttempts || 0,
        correct: progress.grammarCorrect || 0,
        stillLearning: 0,
      };
  }
}

function evaluateSavedPositionUsage(params: {
  mode: LearningMode;
  savedPosition: number;
  attempts: number;
  correct: number;
  stillLearning: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}): { decision: 'use_saved_position' | 'ignore_saved_position'; reason?: SavedPositionDecisionForDebug['reason']; accuracyForOverride: number } {
  const {
    mode,
    savedPosition,
    attempts,
    correct,
    stillLearning,
    consecutiveCorrect,
    consecutiveIncorrect,
  } = params;

  const accuracyForOverride = attempts > 0 ? (correct + stillLearning * 0.5) / attempts : 0;
  const isSavedStillLearningBand = savedPosition >= 40 && savedPosition < 70;
  const isPromotedStillLearning = mode === 'memorization' && stillLearning === 0;

  const shouldIgnoreSavedForProgress =
    isPromotedStillLearning &&
    isSavedStillLearningBand &&
    consecutiveCorrect === CONSECUTIVE_THRESHOLDS.STRUGGLING &&
    consecutiveIncorrect === 0 &&
    accuracyForOverride >= ACCURACY_THRESHOLDS.FAIR;

  if (shouldIgnoreSavedForProgress) {
    return {
      decision: 'ignore_saved_position',
      reason: 'auto_promoted_still_learning_progress',
      accuracyForOverride,
    };
  }

  return {
    decision: 'use_saved_position',
    reason: 'other',
    accuracyForOverride,
  };
}

export function getSavedPositionDecisionForDebug(
  progress: WordProgress | null | undefined,
  mode: LearningMode = 'memorization'
): SavedPositionDecisionForDebug | null {
  if (!progress) return null;

  const savedPosition = getSavedPosition(progress, mode);
  if (savedPosition === undefined || savedPosition === null) return null;

  const { attempts, correct, stillLearning } = getModeCounts(progress, mode);
  const consecutiveCorrect = progress.consecutiveCorrect || 0;
  const consecutiveIncorrect = progress.consecutiveIncorrect || 0;

  const decision = evaluateSavedPositionUsage({
    mode,
    savedPosition,
    attempts,
    correct,
    stillLearning,
    consecutiveCorrect,
    consecutiveIncorrect,
  });

  return {
    mode,
    savedPosition,
    decision: decision.decision,
    reason: decision.reason,
    accuracyForOverride: decision.accuracyForOverride,
    modeAttempts: attempts,
    modeCorrect: correct,
    modeStillLearning: stillLearning,
    consecutiveCorrect,
    consecutiveIncorrect,
  };
}

export function determineWordPosition(
  progress: WordProgress | null | undefined,
  mode: LearningMode = 'memorization',
  options: { ignoreSaved?: boolean } = {}
): WordPosition {
  // 学習履歴が未作成の単語は新規扱い
  if (!progress) {
    return POSITION_VALUES.NEW_DEFAULT;
  }

  // 🚨 最優先: LocalStorageに保存されたタブ別Positionを読み込み
  // これにより、「まだまだ」「分からない」の状態が確実に保持される
  const savedPosition = getSavedPosition(progress, mode);
  const shouldUseSavedPosition = !options.ignoreSaved;

  // ✅ タブ別フィールドを使用（各タブで独立したカウント）
  const modeCounts = getModeCounts(progress, mode);
  const attempts = modeCounts.attempts;
  const correct = modeCounts.correct;
  const stillLearning = modeCounts.stillLearning;

  const consecutiveCorrect = progress.consecutiveCorrect || 0;
  const consecutiveIncorrect = progress.consecutiveIncorrect || 0;
  const lastStudied = progress.lastStudied || Date.now();

  // 🎯 CRITICAL: LocalStorageのタブ別Positionを最優先
  // 理由: 「まだまだ」「分からない」の状態を確実に保持するため
  // - 解答直後にPositionが保存されている場合は、それを信頼する
  // - 動的計算は、保存されたPositionが存在しない場合のみ実行
  if (shouldUseSavedPosition && savedPosition !== undefined && savedPosition !== null) {
    // ⚠️ ただし、連続正解で定着した場合は動的計算を優先（まだまだ解消）
    if (consecutiveCorrect >= CONSECUTIVE_THRESHOLDS.MASTERED) {
      // 3回連続正解 → 完全定着（LocalStorageのPositionを無視）
      return POSITION_VALUES.MASTERED_PERFECT;
    }
    if (consecutiveCorrect >= CONSECUTIVE_THRESHOLDS.LEARNING) {
      // 2回連続正解 → ほぼ定着
      const accuracy = attempts > 0 ? (correct + stillLearning * 0.5) / attempts : 0;
      if (accuracy >= ACCURACY_THRESHOLDS.GOOD) {
        return POSITION_VALUES.MASTERED_ALMOST; // 正答率80%以上なら定着扱い
      }
      return POSITION_VALUES.NEAR_MASTERY; // まだ新規扱い（もう1回正解で定着）
    }

    // ✅ 例外: 「分からない→(自動的に)まだまだ」昇格は、改善が見えたら savedPosition を固定しない
    // 背景:
    // - savedPosition(例: 55) を常に返すと、正解で改善しても Position が変わらず「解消されない」印象になる
    // - ただし「まだまだボタン」由来 (memorizationStillLearning>0) は維持し、埋もれを防ぐ
    // 方針:
    // - stillLearning履歴が無い（ボタン未使用）かつ savedPosition が still_learning 帯(40-69)
    // - 直近で改善が見えている（consecutiveCorrect=1）かつ精度が一定以上（>=60%）
    // → 動的計算へフォールスルーして、new(30) などへ自然に降ろす
    const decision = evaluateSavedPositionUsage({
      mode,
      savedPosition,
      attempts,
      correct,
      stillLearning,
      consecutiveCorrect,
      consecutiveIncorrect,
    });

    if (decision.decision === 'ignore_saved_position') {
      // fallthrough（savedPosition を使わず、下の通常計算へ）
    } else {
      // 📍 保存されたPositionを返す（まだまだ・分からないの状態を保持）
      if (import.meta.env?.DEV) {
        console.log(`📍 [Position優先読み込み] ${mode}: savedPosition=${savedPosition}`);
      }
      return savedPosition;
    }
  }

  // 時間経過計算
  const daysSince = (Date.now() - lastStudied) / (1000 * 60 * 60 * 24);

  // 「まだまだ」を0.5回の正解として計算（暗記モードのみ）
  const effectiveCorrect = correct + stillLearning * 0.5;
  const accuracy = attempts > 0 ? effectiveCorrect / attempts : 0;

  // 未出題の新規単語
  if (attempts === 0) {
    return POSITION_VALUES.NEW_DEFAULT; // new範囲の中央 (20-40)
  }

  // ========================================
  // 🎯 GOAL-FIRST: 学習完了判定（最優先）
  // ========================================
  // ゴール: まだまだ・分からないを0にする
  // → 連続正解でPosition < 40（覚えてる）に即座に移行

  if (consecutiveCorrect >= CONSECUTIVE_THRESHOLDS.MASTERED) {
    // 3回連続正解 → 完全定着
    return POSITION_VALUES.MASTERED_PERFECT;
  }

  if (consecutiveCorrect >= CONSECUTIVE_THRESHOLDS.LEARNING) {
    // 2回連続正解 → ほぼ定着
    if (accuracy >= ACCURACY_THRESHOLDS.GOOD) {
      return POSITION_VALUES.MASTERED_ALMOST; // 正答率80%以上なら定着扱い
    }
    return POSITION_VALUES.NEAR_MASTERY; // まだ新規扱い（もう1回正解で定着）
  }

  // ========================================
  // 🟡 STILL LEARNING (memorization): 「まだまだ」履歴の保持
  // ========================================
  // 目的: 「まだまだ」を押した単語が、直後に1回正解しただけで new (<40) に落ちて
  //       大量の新規語に埋もれて再出題されない現象を防ぐ。
  // ルール: 2回連続正解（かつ精度が十分）で初めて <40 へ移行。
  if (
    mode === 'memorization' &&
    stillLearning > 0 &&
    consecutiveIncorrect === 0 &&
    consecutiveCorrect < CONSECUTIVE_THRESHOLDS.LEARNING
  ) {
    // ✅ 方針: 「まだまだ」履歴がある語は、少なくとも still_learning の中央付近に固定して再出題されやすくする。
    // - 固定値にすることで、SSOT（POSITION_VALUES）とテスト期待が一致しやすくなる。
    return POSITION_VALUES.STILL_LEARNING_DEFAULT;
  }

  if (consecutiveCorrect === CONSECUTIVE_THRESHOLDS.STRUGGLING) {
    // 1回正解 → 新規～まだまだ
    if (accuracy >= ACCURACY_THRESHOLDS.EXCELLENT && attempts <= ATTEMPT_THRESHOLDS.QUICK_LEARNER) {
      return POSITION_VALUES.ONE_SHOT_CORRECT; // 1発正解または2回で90%以上 → 定着扱い
    }
    if (accuracy >= ACCURACY_THRESHOLDS.FAIR) {
      return POSITION_VALUES.NEW_NEAR_MASTERY; // 正答率60%以上 → 新規（次の正解で定着）
    }
    return POSITION_VALUES.STILL_LEARNING_LOW; // まだまだ（学習中）
  }

  // ========================================
  // ⚠️ PENALTY: 連続不正解（要復習）
  // ========================================
  // 連続で間違えている → 分からない（70-100）

  // ✅ 方針: incorrect は固定値（SSOT）で段階化する
  // - 3連続不正解以上: 85（最優先）
  // - 2連続不正解: 75（高優先度）
  // - 1連続不正解: 正答率に応じて 55（まだまだ） or 70（分からない）
  if (consecutiveIncorrect >= CONSECUTIVE_THRESHOLDS.INCORRECT) {
    return POSITION_VALUES.INCORRECT_URGENT;
  }
  if (consecutiveIncorrect >= CONSECUTIVE_THRESHOLDS.HIGH_PRIORITY) {
    return POSITION_VALUES.INCORRECT_HIGH;
  }
  if (consecutiveIncorrect >= CONSECUTIVE_THRESHOLDS.STRUGGLING) {
    return accuracy >= ACCURACY_THRESHOLDS.POOR
      ? POSITION_VALUES.INCORRECT_LIGHT
      : POSITION_VALUES.INCORRECT_MEDIUM;
  }

  // ========================================
  // � STILL LEARNING: 「まだまだ」選択時の処理
  // ========================================
  // 「まだまだ」は学習中として扱い、Position 40-50に配置
  // （連続正解・連続不正解がどちらも0 = まだまだ選択）

  if (stillLearning > 0 && consecutiveCorrect === 0 && consecutiveIncorrect === 0) {
    return POSITION_VALUES.STILL_LEARNING_DEFAULT;
  }

  // ========================================
  // �📊 BASIC CALCULATION: 基本的な計算
  // ========================================
  // 連続正解も連続不正解もない複雑なケースは、
  // 正答率・時間経過から基本的なPositionを計算
  // （7つのAI統合はQuestionSchedulerで実施）

  // === BaseScore計算 ===
  const baseScore =
    POSITION_VALUES.STILL_LEARNING_DEFAULT - accuracy * 30 + consecutiveIncorrect * 10;

  // === 時間経過ブースト ===
  const timeBoost = Math.min(
    daysSince * BOOST_VALUES.TIME_DECAY_MULTIPLIER,
    BOOST_VALUES.TIME_DECAY_MAX
  );

  // === 最終Position ===
  const rawPosition = baseScore + timeBoost;
  const position = normalizePosition(rawPosition);

  return position;
}

/**
 * Position(0-100)を学習カテゴリへ変換
 */
export function positionToCategory(position: WordPosition): WordCategory {
  if (position >= 70) return 'incorrect';
  if (position >= 40) return 'still_learning';
  if (position >= 20) return 'new';
  return 'mastered';
}

/**
 * カテゴリーから優先度への変換（SSOT）
 * @param category 単語のカテゴリー
 * @returns 優先度（1が最高、5が最低）
 */
export function categoryToPriority(category: WordCategory): number {
  switch (category) {
    case 'incorrect':
      return 1;
    case 'still_learning':
      return 2;
    case 'new':
      return 3;
    case 'mastered':
      return 5;
    default:
      return 5;
  }
}
