/**
 * Position Constants テスト
 *
 * positionConstants.tsで定義された定数の妥当性を検証
 */

import { describe, it, expect } from 'vitest';
import {
  POSITION_RANGES,
  CONSECUTIVE_THRESHOLDS,
  ACCURACY_THRESHOLDS,
  POSITION_VALUES,
  BOOST_VALUES,
  GAMIFICATION_THRESHOLDS,
  ATTEMPT_THRESHOLDS,
  isInRange,
  getPositionCategory,
  validatePosition,
  normalizePosition
} from '@/ai/utils/positionConstants';

describe('positionConstants', () => {
  describe('POSITION_RANGES', () => {
    it('範囲が重複せずに0-100を完全にカバーする', () => {
      expect(POSITION_RANGES.MASTERED.min).toBe(0);
      expect(POSITION_RANGES.MASTERED.max).toBe(20);
      expect(POSITION_RANGES.NEW.min).toBe(20);
      expect(POSITION_RANGES.NEW.max).toBe(40);
      expect(POSITION_RANGES.STILL_LEARNING.min).toBe(40);
      expect(POSITION_RANGES.STILL_LEARNING.max).toBe(70);
      expect(POSITION_RANGES.INCORRECT.min).toBe(70);
      expect(POSITION_RANGES.INCORRECT.max).toBe(100);
    });

    it('デフォルト値が範囲内にある', () => {
      expect(POSITION_RANGES.MASTERED.default).toBeGreaterThanOrEqual(POSITION_RANGES.MASTERED.min);
      expect(POSITION_RANGES.MASTERED.default).toBeLessThanOrEqual(POSITION_RANGES.MASTERED.max);

      expect(POSITION_RANGES.NEW.default).toBeGreaterThanOrEqual(POSITION_RANGES.NEW.min);
      expect(POSITION_RANGES.NEW.default).toBeLessThanOrEqual(POSITION_RANGES.NEW.max);

      expect(POSITION_RANGES.STILL_LEARNING.default).toBeGreaterThanOrEqual(POSITION_RANGES.STILL_LEARNING.min);
      expect(POSITION_RANGES.STILL_LEARNING.default).toBeLessThanOrEqual(POSITION_RANGES.STILL_LEARNING.max);

      expect(POSITION_RANGES.INCORRECT.default).toBeGreaterThanOrEqual(POSITION_RANGES.INCORRECT.min);
      expect(POSITION_RANGES.INCORRECT.default).toBeLessThanOrEqual(POSITION_RANGES.INCORRECT.max);
    });
  });

  describe('CONSECUTIVE_THRESHOLDS', () => {
    it('閾値が論理的な順序になっている', () => {
      expect(CONSECUTIVE_THRESHOLDS.MASTERED).toBe(3);
      expect(CONSECUTIVE_THRESHOLDS.LEARNING).toBe(2);
      expect(CONSECUTIVE_THRESHOLDS.STRUGGLING).toBe(1);
      expect(CONSECUTIVE_THRESHOLDS.HIGH_PRIORITY).toBe(2);
      expect(CONSECUTIVE_THRESHOLDS.INCORRECT).toBe(3);
    });
  });

  describe('ACCURACY_THRESHOLDS', () => {
    it('閾値が0-1の範囲内で降順になっている', () => {
      expect(ACCURACY_THRESHOLDS.EXCELLENT).toBe(0.9);
      expect(ACCURACY_THRESHOLDS.GOOD).toBe(0.8);
      expect(ACCURACY_THRESHOLDS.FAIR).toBe(0.6);
      expect(ACCURACY_THRESHOLDS.POOR).toBe(0.5);

      expect(ACCURACY_THRESHOLDS.EXCELLENT).toBeGreaterThan(ACCURACY_THRESHOLDS.GOOD);
      expect(ACCURACY_THRESHOLDS.GOOD).toBeGreaterThan(ACCURACY_THRESHOLDS.FAIR);
      expect(ACCURACY_THRESHOLDS.FAIR).toBeGreaterThan(ACCURACY_THRESHOLDS.POOR);
    });
  });

  describe('POSITION_VALUES', () => {
    it('定着済み範囲の値が正しい', () => {
      expect(POSITION_VALUES.MASTERED_PERFECT).toBe(10);
      expect(POSITION_VALUES.MASTERED_ALMOST).toBe(15);
      expect(POSITION_VALUES.ONE_SHOT_CORRECT).toBe(18);

      // すべて MASTERED 範囲（0-20）内
      expect(POSITION_VALUES.MASTERED_PERFECT).toBeGreaterThanOrEqual(POSITION_RANGES.MASTERED.min);
      expect(POSITION_VALUES.MASTERED_PERFECT).toBeLessThanOrEqual(POSITION_RANGES.MASTERED.max);
      expect(POSITION_VALUES.MASTERED_ALMOST).toBeLessThanOrEqual(POSITION_RANGES.MASTERED.max);
      expect(POSITION_VALUES.ONE_SHOT_CORRECT).toBeLessThanOrEqual(POSITION_RANGES.MASTERED.max);
    });

    it('新規範囲の値が正しい', () => {
      expect(POSITION_VALUES.NEAR_MASTERY).toBe(25);
      expect(POSITION_VALUES.NEW_NEAR_MASTERY).toBe(30);
      expect(POSITION_VALUES.NEW_DEFAULT).toBe(35);

      // すべて NEW 範囲（20-40）内
      expect(POSITION_VALUES.NEAR_MASTERY).toBeGreaterThanOrEqual(POSITION_RANGES.NEW.min);
      expect(POSITION_VALUES.NEAR_MASTERY).toBeLessThanOrEqual(POSITION_RANGES.NEW.max);
      expect(POSITION_VALUES.NEW_NEAR_MASTERY).toBeLessThanOrEqual(POSITION_RANGES.NEW.max);
      expect(POSITION_VALUES.NEW_DEFAULT).toBeLessThanOrEqual(POSITION_RANGES.NEW.max);
    });

    it('学習中範囲の値が正しい', () => {
      expect(POSITION_VALUES.STILL_LEARNING_LOW).toBe(45);
      expect(POSITION_VALUES.STILL_LEARNING_DEFAULT).toBe(50);
      expect(POSITION_VALUES.INCORRECT_LIGHT).toBe(55);

      // すべて STILL_LEARNING 範囲（40-70）内
      expect(POSITION_VALUES.STILL_LEARNING_LOW).toBeGreaterThanOrEqual(POSITION_RANGES.STILL_LEARNING.min);
      expect(POSITION_VALUES.STILL_LEARNING_LOW).toBeLessThanOrEqual(POSITION_RANGES.STILL_LEARNING.max);
      expect(POSITION_VALUES.STILL_LEARNING_DEFAULT).toBeLessThanOrEqual(POSITION_RANGES.STILL_LEARNING.max);
      expect(POSITION_VALUES.INCORRECT_LIGHT).toBeLessThanOrEqual(POSITION_RANGES.STILL_LEARNING.max);
    });

    it('要復習範囲の値が正しい', () => {
      expect(POSITION_VALUES.INCORRECT_MEDIUM).toBe(70);
      expect(POSITION_VALUES.INCORRECT_HIGH).toBe(75);
      expect(POSITION_VALUES.INCORRECT_URGENT).toBe(85);

      // すべて INCORRECT 範囲（70-100）内
      expect(POSITION_VALUES.INCORRECT_MEDIUM).toBeGreaterThanOrEqual(POSITION_RANGES.INCORRECT.min);
      expect(POSITION_VALUES.INCORRECT_MEDIUM).toBeLessThanOrEqual(POSITION_RANGES.INCORRECT.max);
      expect(POSITION_VALUES.INCORRECT_HIGH).toBeLessThanOrEqual(POSITION_RANGES.INCORRECT.max);
      expect(POSITION_VALUES.INCORRECT_URGENT).toBeLessThanOrEqual(POSITION_RANGES.INCORRECT.max);
    });
  });

  describe('BOOST_VALUES', () => {
    it('ブースト値が正の値である', () => {
      expect(BOOST_VALUES.STILL_LEARNING_MAX).toBeGreaterThan(0);
      expect(BOOST_VALUES.STILL_LEARNING_MULTIPLIER).toBeGreaterThan(0);
      expect(BOOST_VALUES.TIME_DECAY_MAX).toBeGreaterThan(0);
      expect(BOOST_VALUES.TIME_DECAY_MULTIPLIER).toBeGreaterThan(0);
    });

    it('まだまだブーストの最大値が適切', () => {
      // 最大ブーストを加えてもSTILL_LEARNING範囲を超えない
      const maxBoost = BOOST_VALUES.STILL_LEARNING_MAX;
      expect(POSITION_VALUES.STILL_LEARNING_LOW + maxBoost).toBeLessThanOrEqual(
        POSITION_RANGES.STILL_LEARNING.max
      );
    });
  });

  describe('GAMIFICATION_THRESHOLDS', () => {
    it('Position階層不変条件を満たす', () => {
      // 新規語: 40-59
      expect(GAMIFICATION_THRESHOLDS.NEW_MIN).toBe(40);
      expect(GAMIFICATION_THRESHOLDS.NEW_MAX).toBe(59);

      // まだまだ語: 60-69
      expect(GAMIFICATION_THRESHOLDS.STILL_MIN).toBe(60);
      expect(GAMIFICATION_THRESHOLDS.STILL_MAX).toBe(69);

      // 重複なし
      expect(GAMIFICATION_THRESHOLDS.NEW_MAX).toBeLessThan(GAMIFICATION_THRESHOLDS.STILL_MIN);

      // STILL_LEARNING範囲内
      expect(GAMIFICATION_THRESHOLDS.NEW_MIN).toBeGreaterThanOrEqual(POSITION_RANGES.STILL_LEARNING.min);
      expect(GAMIFICATION_THRESHOLDS.STILL_MAX).toBeLessThanOrEqual(POSITION_RANGES.STILL_LEARNING.max);
    });
  });

  describe('ATTEMPT_THRESHOLDS', () => {
    it('試行回数の閾値が昇順になっている', () => {
      expect(ATTEMPT_THRESHOLDS.QUICK_LEARNER).toBe(2);
      expect(ATTEMPT_THRESHOLDS.NORMAL_LEARNER).toBe(5);
      expect(ATTEMPT_THRESHOLDS.SLOW_LEARNER).toBe(6);

      expect(ATTEMPT_THRESHOLDS.QUICK_LEARNER).toBeLessThan(ATTEMPT_THRESHOLDS.NORMAL_LEARNER);
      expect(ATTEMPT_THRESHOLDS.NORMAL_LEARNER).toBeLessThan(ATTEMPT_THRESHOLDS.SLOW_LEARNER);
    });
  });

  describe('isInRange', () => {
    it('mastered範囲を正しく判定する', () => {
      expect(isInRange.mastered(0)).toBe(true);
      expect(isInRange.mastered(10)).toBe(true);
      expect(isInRange.mastered(20)).toBe(true);
      expect(isInRange.mastered(21)).toBe(false);
      expect(isInRange.mastered(-1)).toBe(false);
    });

    it('new範囲を正しく判定する', () => {
      expect(isInRange.new(20)).toBe(true);
      expect(isInRange.new(30)).toBe(true);
      expect(isInRange.new(40)).toBe(true);
      expect(isInRange.new(19)).toBe(false);
      expect(isInRange.new(41)).toBe(false);
    });

    it('stillLearning範囲を正しく判定する', () => {
      expect(isInRange.stillLearning(40)).toBe(true);
      expect(isInRange.stillLearning(55)).toBe(true);
      expect(isInRange.stillLearning(70)).toBe(true);
      expect(isInRange.stillLearning(39)).toBe(false);
      expect(isInRange.stillLearning(71)).toBe(false);
    });

    it('incorrect範囲を正しく判定する', () => {
      expect(isInRange.incorrect(70)).toBe(true);
      expect(isInRange.incorrect(85)).toBe(true);
      expect(isInRange.incorrect(100)).toBe(true);
      expect(isInRange.incorrect(69)).toBe(false);
      expect(isInRange.incorrect(101)).toBe(false);
    });
  });

  describe('getPositionCategory', () => {
    it('Position値から正しいカテゴリラベルを返す', () => {
      expect(getPositionCategory(10)).toBe('定着済み');
      expect(getPositionCategory(30)).toBe('新規');
      expect(getPositionCategory(50)).toBe('学習中');
      expect(getPositionCategory(85)).toBe('要復習');
    });

    it('境界値で正しいカテゴリを返す', () => {
      expect(getPositionCategory(0)).toBe('定着済み');
      expect(getPositionCategory(20)).toBe('定着済み'); // 20はmastered範囲に含まれる（先に判定）
      expect(getPositionCategory(40)).toBe('新規'); // 40はnew範囲に含まれる（先に判定）
      expect(getPositionCategory(70)).toBe('学習中'); // 70はstill_learning範囲に含まれる（先に判定）
      expect(getPositionCategory(100)).toBe('要復習');
    });

    it('範囲外の値で「不明」を返す', () => {
      expect(getPositionCategory(-1)).toBe('不明');
      expect(getPositionCategory(101)).toBe('不明');
    });
  });

  describe('validatePosition', () => {
    it('0-100の範囲内でtrueを返す', () => {
      expect(validatePosition(0)).toBe(true);
      expect(validatePosition(50)).toBe(true);
      expect(validatePosition(100)).toBe(true);
    });

    it('範囲外でfalseを返す', () => {
      expect(validatePosition(-1)).toBe(false);
      expect(validatePosition(101)).toBe(false);
      expect(validatePosition(-100)).toBe(false);
      expect(validatePosition(1000)).toBe(false);
    });
  });

  describe('normalizePosition', () => {
    it('範囲内の値はそのまま返す', () => {
      expect(normalizePosition(0)).toBe(0);
      expect(normalizePosition(50)).toBe(50);
      expect(normalizePosition(100)).toBe(100);
    });

    it('負の値は0にクランプされる', () => {
      expect(normalizePosition(-1)).toBe(0);
      expect(normalizePosition(-100)).toBe(0);
    });

    it('100を超える値は100にクランプされる', () => {
      expect(normalizePosition(101)).toBe(100);
      expect(normalizePosition(1000)).toBe(100);
    });
  });
});
