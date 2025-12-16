/**
 * 学習フェーズ判定エンジン - ユニットテスト
 * 
 * テストカバレッジ目標: 95%以上
 * テストケース数: 45個
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  LearningPhaseDetector,
  LearningPhase,
  QuestionStatus,
  DEFAULT_PHASE_THRESHOLDS,
  DEFAULT_PERSONAL_PARAMETERS,
  analyzePhaseDistribution,
  type PersonalParameters
} from '../../src/strategies/learningPhaseDetector';

// テストヘルパー関数
function createStatus(
  reviewCount: number,
  correctCount: number,
  wrongCount: number,
  lastReviewTime: number,
  lastCorrectTime?: number,
  averageResponseTime: number = 1000,
  consecutiveCorrect: number = 0,
  consecutiveWrong: number = 0
): QuestionStatus {
  return {
    word: 'test',
    reviewCount,
    correctCount,
    wrongCount,
    lastReviewTime,
    lastCorrectTime: lastCorrectTime ?? lastReviewTime,
    averageResponseTime,
    consecutiveCorrect,
    consecutiveWrong
  };
}

describe('LearningPhaseDetector', () => {
  let detector: LearningPhaseDetector;
  let now: number;

  beforeEach(() => {
    detector = new LearningPhaseDetector();
    now = Date.now();
  });

  // ========================================
  // 1. ENCODING フェーズ判定（10ケース）
  // ========================================

  describe('ENCODING フェーズ判定', () => {
    test('TC1.1: 初見単語はENCODINGフェーズ', () => {
      const status = createStatus(0, 0, 0, 0);
      const result = detector.detectPhaseWithReason('apple', status);
      
      expect(result.phase).toBe(LearningPhase.ENCODING);
      expect(result.matchedCondition).toBe(1);
      expect(result.reason).toContain('初見単語');
    });

    test('TC1.2: 30秒以内の単語はENCODINGフェーズ', () => {
      const status = createStatus(1, 1, 0, now - 15000);
      const result = detector.detectPhaseWithReason('book', status);
      
      expect(result.phase).toBe(LearningPhase.ENCODING);
      expect(result.matchedCondition).toBe(2);
      expect(result.metrics.timeSinceLastReview).toBeLessThan(30000);
    });

    test('TC1.3: 一度も正答していない単語はENCODINGフェーズ', () => {
      const status = createStatus(5, 0, 5, now - 86400000);
      const result = detector.detectPhaseWithReason('difficult', status);
      
      expect(result.phase).toBe(LearningPhase.ENCODING);
      expect(result.matchedCondition).toBe(3);
    });

    test('TC1.4: 完全忘却（1-7日、正答率50%未満）', () => {
      const status = createStatus(10, 3, 7, now - 172800000); // 2日前、30%
      const result = detector.detectPhaseWithReason('forgotten', status);
      
      expect(result.phase).toBe(LearningPhase.ENCODING);
      expect(result.matchedCondition).toBe(6);
      expect(result.metrics.correctRate).toBeLessThan(0.5);
    });

    test('TC1.5: 超長期放置（1000日以上）', () => {
      const status = createStatus(50, 40, 10, now - 86400000 * 1001);
      const result = detector.detectPhaseWithReason('ancient', status);
      
      expect(result.phase).toBe(LearningPhase.ENCODING);
      expect(result.matchedCondition).toBe(101);
      expect(result.metrics.daysSinceLastReview).toBeGreaterThan(1000);
    });

    test('TC1.6: 超高頻度誤答（100回以上連続）でリセット', () => {
      const status = createStatus(150, 50, 100, now - 3600000, now - 3600000, 1000, 0, 100);
      const result = detector.detectPhaseWithReason('impossible', status);
      
      expect(result.phase).toBe(LearningPhase.ENCODING);
      expect(result.matchedCondition).toBe(103);
    });

    test('TC1.7: 応答時間0msの異常値処理', () => {
      const status = createStatus(10, 8, 2, now - 86400000 * 10, now - 86400000 * 10, 0);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.metrics.averageResponseTime).toBe(1000); // デフォルト値
    });

    test('TC1.8: 未来のタイムスタンプの異常値処理', () => {
      const futureTime = now + 86400000;
      const status = createStatus(5, 3, 2, futureTime, futureTime);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.metrics.timeSinceLastReview).toBeLessThanOrEqual(1000);
    });

    test('TC1.9: 境界値: 正確に30秒後', () => {
      const status = createStatus(1, 1, 0, now - 30000);
      const result = detector.detectPhaseWithReason('word', status);
      
      // 30秒ちょうどは作業記憶を超えているのでENCODINGではない
      expect(result.phase).not.toBe(LearningPhase.ENCODING);
    });

    test('TC1.10: 境界値: 正確に50%の正答率', () => {
      const status = createStatus(10, 5, 5, now - 172800000); // 2日前
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.metrics.correctRate).toBe(0.5);
      // 50%ちょうどはSHORT_TERM（50%以上）
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });
  });

  // ========================================
  // 2. INITIAL_CONSOLIDATION フェーズ判定（5ケース）
  // ========================================

  describe('INITIAL_CONSOLIDATION フェーズ判定', () => {
    test('TC2.1: 初回正答後30分はINITIAL_CONSOLIDATION', () => {
      const status = createStatus(2, 1, 1, now - 100000, now - 1800000); // 30分前に正答
      const result = detector.detectPhaseWithReason('car', status);
      
      expect(result.phase).toBe(LearningPhase.INITIAL_CONSOLIDATION);
      expect(result.matchedCondition).toBe(4);
    });

    test('TC2.2: 初回正答後59分59秒はまだINITIAL_CONSOLIDATION', () => {
      const status = createStatus(2, 1, 1, now - 100000, now - 3599000);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.INITIAL_CONSOLIDATION);
    });

    test('TC2.3: 初回正答後1時間1秒はINITIAL_CONSOLIDATION卒業', () => {
      const status = createStatus(2, 1, 1, now - 100000, now - 3601000);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).not.toBe(LearningPhase.INITIAL_CONSOLIDATION);
    });

    test('TC2.4: 1回正答でも1時間経過していればINITIAL_CONSOLIDATION卒業', () => {
      const status = createStatus(3, 1, 2, now - 7200000, now - 7200000); // 2時間前
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).not.toBe(LearningPhase.INITIAL_CONSOLIDATION);
    });

    test('TC2.5: correctCount=1でも同日内2回目の正答でINTRADAY_REVIEWへ', () => {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const lastCorrect = today.getTime() + 3600000;
      const status = createStatus(3, 2, 1, now - 100000, lastCorrect);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
    });
  });

  // ========================================
  // 3. INTRADAY_REVIEW フェーズ判定（5ケース）
  // ========================================

  describe('INTRADAY_REVIEW フェーズ判定', () => {
    test('TC3.1: 同日内2回正答でINTRADAY_REVIEW', () => {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const lastCorrect = today.getTime() + 3600000;
      const status = createStatus(3, 2, 1, now - 100000, lastCorrect);
      const result = detector.detectPhaseWithReason('learn', status);
      
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
      expect(result.matchedCondition).toBe(5);
    });

    test('TC3.2: 同日内3回正答でもINTRADAY_REVIEW（翌日まで）', () => {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const lastCorrect = today.getTime() + 7200000;
      const status = createStatus(4, 3, 1, now - 100000, lastCorrect);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
    });

    test('TC3.3: 前日23:59の正答は今日0:00には同日扱いしない', () => {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const yesterday = today.getTime() - 60000; // 1分前（前日23:59）
      
      const status = createStatus(3, 2, 1, now - 100000, yesterday);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).not.toBe(LearningPhase.INTRADAY_REVIEW);
    });

    test('TC3.4: 同日内でもcorrectCount=1ならINTRADAY_REVIEWではない', () => {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const lastCorrect = today.getTime() + 3600000;
      const status = createStatus(2, 1, 1, now - 100000, lastCorrect);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).not.toBe(LearningPhase.INTRADAY_REVIEW);
    });

    test('TC3.5: 同日内5回正答でもINTRADAY_REVIEW（記憶獲得完了）', () => {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const lastCorrect = today.getTime() + 7200000;
      const status = createStatus(6, 5, 1, now - 100000, lastCorrect);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
    });
  });

  // ========================================
  // 4. SHORT_TERM フェーズ判定（10ケース）
  // ========================================

  describe('SHORT_TERM フェーズ判定', () => {
    test('TC4.1: 1日後、正答率60%でSHORT_TERM', () => {
      const status = createStatus(10, 6, 4, now - 86400000);
      const result = detector.detectPhaseWithReason('remember', status);
      
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
      expect(result.matchedCondition).toBe(6);
      expect(result.metrics.daysSinceLastReview).toBeGreaterThanOrEqual(1);
      expect(result.metrics.correctRate).toBeGreaterThanOrEqual(0.5);
      expect(result.metrics.correctRate).toBeLessThan(0.8);
    });

    test('TC4.2: 3日後、正答率70%でSHORT_TERM', () => {
      const status = createStatus(10, 7, 3, now - 86400000 * 3);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });

    test('TC4.3: 7日後、正答率75%でSHORT_TERM', () => {
      const status = createStatus(20, 15, 5, now - 86400000 * 7);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });

    test('TC4.4: 境界値 - 正確に1日後', () => {
      const status = createStatus(10, 6, 4, now - 86400000);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });

    test('TC4.5: 境界値 - 正確に7日後、正答率79.9%はSHORT_TERM', () => {
      const status = createStatus(1000, 799, 201, now - 86400000 * 7);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.metrics.correctRate).toBeLessThan(0.8);
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });

    test('TC4.6: 10日後、正答率60%でもSHORT_TERM（80%未満）', () => {
      const status = createStatus(10, 6, 4, now - 86400000 * 10);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });

    test('TC4.7: 30日後、正答率70%でもSHORT_TERM', () => {
      const status = createStatus(10, 7, 3, now - 86400000 * 30);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });

    test('TC4.8: 1日後、正答率50%ちょうどでSHORT_TERM', () => {
      const status = createStatus(10, 5, 5, now - 86400000);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.metrics.correctRate).toBe(0.5);
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });

    test('TC4.9: 7日後、正答率80%ちょうどならLONG_TERM候補', () => {
      const status = createStatus(10, 8, 2, now - 86400000 * 8, now - 86400000 * 8, 1000);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.metrics.correctRate).toBe(0.8);
      // 応答時間も1秒なのでLONG_TERM
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC4.10: 12時間前はINTRADAY_REVIEW判定', () => {
      const status = createStatus(5, 3, 2, now - 43200000); // 12時間前
      const result = detector.detectPhaseWithReason('word', status);
      
      // 24時間以内なのでINTRADAY_REVIEW（当日復習）フェーズ
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
    });
  });

  // ========================================
  // 5. LONG_TERM フェーズ判定（10ケース）
  // ========================================

  describe('LONG_TERM フェーズ判定', () => {
    test('TC5.1: 10日後、正答率90%、応答1秒でLONG_TERM', () => {
      const status = createStatus(20, 18, 2, now - 86400000 * 10, now - 86400000 * 10, 1000);
      const result = detector.detectPhaseWithReason('master', status);
      
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
      expect(result.matchedCondition).toBe(7);
      expect(result.metrics.daysSinceLastReview).toBeGreaterThan(7);
      expect(result.metrics.correctRate).toBeGreaterThanOrEqual(0.8);
      expect(result.metrics.averageResponseTime).toBeLessThan(1500);
    });

    test('TC5.2: 30日後、正答率95%、応答0.5秒でLONG_TERM', () => {
      const status = createStatus(20, 19, 1, now - 86400000 * 30, now - 86400000 * 30, 500);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC5.3: 100日後、正答率85%、応答1.2秒でLONG_TERM', () => {
      const status = createStatus(20, 17, 3, now - 86400000 * 100, now - 86400000 * 100, 1200);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC5.4: 境界値 - 正確に7日1秒後、正答率80%、応答1.4秒でLONG_TERM', () => {
      const status = createStatus(10, 8, 2, now - (86400000 * 7 + 1000), now - (86400000 * 7 + 1000), 1400);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC5.5: 境界値 - 応答時間1.5秒より長いとLONG_TERMにならない', () => {
      const status = createStatus(10, 8, 2, now - 86400000 * 10, now - 86400000 * 10, 1501);
      const result = detector.detectPhaseWithReason('word', status);
      
      // 1.5秒より大きいので自動化されておらず、条件7でSHORT_TERMへ
      expect(result.phase).not.toBe(LearningPhase.LONG_TERM);
      expect([LearningPhase.SHORT_TERM, LearningPhase.ENCODING]).toContain(result.phase);
    });

    test('TC5.6: 超高頻度正答（100回連続）で確実にLONG_TERM', () => {
      const status = createStatus(150, 148, 2, now - 86400000, now - 86400000, 800, 100, 0);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
      expect(result.matchedCondition).toBe(102);
    });

    test('TC5.7: 365日後、正答率100%でLONG_TERM', () => {
      const status = createStatus(30, 30, 0, now - 86400000 * 365, now - 86400000 * 365, 600);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC5.8: 10日後、正答率80%ちょうど、応答1.49秒でLONG_TERM', () => {
      const status = createStatus(10, 8, 2, now - 86400000 * 10, now - 86400000 * 10, 1490);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC5.9: 7日後、正答率85%でも応答3秒だとLONG_TERMにならない', () => {
      const status = createStatus(20, 17, 3, now - 86400000 * 8, now - 86400000 * 8, 3000);
      const result = detector.detectPhaseWithReason('word', status);
      
      // 応答時間3秒 > 1.5秒なのでLONG_TERMにならない
      expect(result.phase).not.toBe(LearningPhase.LONG_TERM);
      expect([LearningPhase.SHORT_TERM, LearningPhase.ENCODING]).toContain(result.phase);
    });

    test('TC5.10: 10日後、正答率75%でSHORT_TERM（80%未満）', () => {
      const status = createStatus(20, 15, 5, now - 86400000 * 10, now - 86400000 * 10, 1000);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
    });
  });

  // ========================================
  // 6. フェーズ遷移テスト（5ケース）
  // ========================================

  describe('フェーズ遷移テスト', () => {
    test('TC6.1: 正常な学習フロー: ENCODING → ... → LONG_TERM', () => {
      // 初見
      let result = detector.detectPhaseWithReason('word1', createStatus(0, 0, 0, now));
      expect(result.phase).toBe(LearningPhase.ENCODING);
      
      // 1回正答後30分
      result = detector.detectPhaseWithReason('word1', createStatus(1, 1, 0, now - 100000, now - 1800000));
      expect(result.phase).toBe(LearningPhase.INITIAL_CONSOLIDATION);
      
      // 同日2回正答
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const lastCorrect = today.getTime() + 3600000;
      result = detector.detectPhaseWithReason('word1', createStatus(2, 2, 0, now - 100000, lastCorrect));
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
      
      // 3日後、正答率70%
      result = detector.detectPhaseWithReason('word1', createStatus(10, 7, 3, now - 86400000 * 3));
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
      
      // 30日後、正答率90%、応答1秒
      result = detector.detectPhaseWithReason('word1', createStatus(20, 18, 2, now - 86400000 * 30, now - 86400000 * 30, 1000));
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC6.2: 忘却による退行フロー: LONG_TERM → ENCODING', () => {
      // LONG_TERM
      let result = detector.detectPhaseWithReason('word', createStatus(20, 18, 2, now - 86400000 * 30, now - 86400000 * 30, 1000));
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
      
      // 正答率低下でSHORT_TERM
      result = detector.detectPhaseWithReason('word', createStatus(30, 21, 9, now - 86400000 * 60, now - 86400000 * 60, 1000));
      expect(result.phase).toBe(LearningPhase.SHORT_TERM);
      
      // さらに正答率低下でENCODING
      result = detector.detectPhaseWithReason('word', createStatus(40, 15, 25, now - 86400000 * 90));
      expect(result.phase).toBe(LearningPhase.ENCODING);
    });

    test('TC6.3: 高速学習フロー（スキップあり）', () => {
      // 初見
      let result = detector.detectPhaseWithReason('word', createStatus(0, 0, 0, now));
      expect(result.phase).toBe(LearningPhase.ENCODING);
      
      // 1日で3回正答（INTRADAY_REVIEWスキップされる場合もある）
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const lastCorrect2 = today.getTime() + 3600000;
      result = detector.detectPhaseWithReason('word', createStatus(5, 5, 0, now - 100000, lastCorrect2));
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
    });

    test('TC6.4: 停滞フロー（INTRADAY_REVIEWで長期停滞）', () => {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      // INTRADAY_REVIEWで停滞（何度も誤答）
      const lastCorrect = today.getTime() + 7200000;
      const result = detector.detectPhaseWithReason('word', createStatus(20, 5, 15, now - 100000, lastCorrect));
      
      // correctCount >= 2なのでINTRADAY_REVIEW
      expect(result.phase).toBe(LearningPhase.INTRADAY_REVIEW);
    });

    test('TC6.5: canTransition - フェーズ遷移の可否チェック', () => {
      const status = createStatus(5, 3, 2, now - 86400000);
      
      // 同じフェーズへの遷移は可能
      expect(detector.canTransition('word', status, LearningPhase.SHORT_TERM)).toBe(true);
      
      // 1段階の前進は可能
      expect(detector.canTransition('word', status, LearningPhase.LONG_TERM)).toBe(true);
      
      // 退行は常に可能
      expect(detector.canTransition('word', status, LearningPhase.ENCODING)).toBe(true);
    });
  });

  // ========================================
  // 7. 個人パラメータによる調整テスト（5ケース）
  // ========================================

  describe('個人パラメータによる調整', () => {
    test('TC7.1: 学習速度2.0（速い）で統合時間が半分に', () => {
      const fastParams: PersonalParameters = {
        ...DEFAULT_PERSONAL_PARAMETERS,
        learningSpeed: 2.0
      };
      const fastDetector = new LearningPhaseDetector(fastParams);
      
      // 30分後にINITIAL_CONSOLIDATION卒業（通常は1時間）
      const status = createStatus(2, 1, 1, now - 100000, now - 1900000); // 31.6分前
      const result = fastDetector.detectPhaseWithReason('word', status);
      
      expect(result.phase).not.toBe(LearningPhase.INITIAL_CONSOLIDATION);
    });

    test('TC7.2: 学習速度0.5（遅い）で統合時間が2倍に', () => {
      const slowParams: PersonalParameters = {
        ...DEFAULT_PERSONAL_PARAMETERS,
        learningSpeed: 0.5
      };
      const slowDetector = new LearningPhaseDetector(slowParams);
      
      // 1時間半後でもINITIAL_CONSOLIDATION（通常は1時間で卒業）
      const status = createStatus(2, 1, 1, now - 100000, now - 5400000); // 1.5時間前
      const result = slowDetector.detectPhaseWithReason('word', status);
      
      expect(result.phase).toBe(LearningPhase.INITIAL_CONSOLIDATION);
    });

    test('TC7.3: 応答時間閾値の個人化', () => {
      const fastParams: PersonalParameters = {
        ...DEFAULT_PERSONAL_PARAMETERS,
        learningSpeed: 2.0
      };
      const fastDetector = new LearningPhaseDetector(fastParams);
      
      // 学習速度2.0なら応答時間閾値は3秒（1.5秒 * 2.0）
      const status = createStatus(10, 9, 1, now - 86400000 * 10, now - 86400000 * 10, 2500);
      const result = fastDetector.detectPhaseWithReason('word', status);
      
      // 2.5秒でもLONG_TERMと判定される
      expect(result.phase).toBe(LearningPhase.LONG_TERM);
    });

    test('TC7.4: updateThresholds でパラメータ更新', () => {
      detector.updateThresholds({ ...DEFAULT_PERSONAL_PARAMETERS, learningSpeed: 3.0 });
      
      // 20分後にINITIAL_CONSOLIDATION卒業（1時間 / 3.0 = 20分）
      const status = createStatus(2, 1, 1, now - 100000, now - 1300000); // 21.6分前
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result.phase).not.toBe(LearningPhase.INITIAL_CONSOLIDATION);
    });

    test('TC7.5: clearCache でキャッシュクリア', () => {
      const status = createStatus(10, 6, 4, now - 86400000);
      
      // 1回目の判定
      detector.detectPhase('word', status);
      
      // キャッシュクリア
      detector.clearCache();
      
      // 2回目の判定（キャッシュなし）
      const result = detector.detectPhase('word', status);
      expect(result).toBe(LearningPhase.SHORT_TERM);
    });
  });

  // ========================================
  // 8. ユーティリティ関数テスト（3ケース）
  // ========================================

  describe('ユーティリティ関数', () => {
    test('TC8.1: analyzePhaseDistribution - フェーズ分布分析', () => {
      const words = [
        { word: 'word1', status: createStatus(0, 0, 0, 0) },
        { word: 'word2', status: createStatus(10, 6, 4, now - 86400000) },
        { word: 'word3', status: createStatus(20, 18, 2, now - 86400000 * 30, now - 86400000 * 30, 1000) }
      ];
      
      const distribution = analyzePhaseDistribution(words, detector);
      
      expect(distribution[LearningPhase.ENCODING]).toBe(1);
      expect(distribution[LearningPhase.SHORT_TERM]).toBe(1);
      expect(distribution[LearningPhase.LONG_TERM]).toBe(1);
    });

    test('TC8.2: detectPhaseWithReason - 理由付き判定', () => {
      const status = createStatus(0, 0, 0, 0);
      const result = detector.detectPhaseWithReason('word', status);
      
      expect(result).toHaveProperty('phase');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('matchedCondition');
      expect(result).toHaveProperty('metrics');
    });

    test('TC8.3: キャッシュの動作確認', () => {
      const status = createStatus(10, 6, 4, now - 86400000);
      
      // 1回目の判定
      const start1 = performance.now();
      detector.detectPhase('cached-word', status);
      const time1 = performance.now() - start1;
      
      // 2回目の判定（キャッシュヒット）
      const start2 = performance.now();
      detector.detectPhase('cached-word', status);
      const time2 = performance.now() - start2;
      
      // キャッシュヒット時の方が速い（ただし計測誤差があるので大まかな確認）
      expect(time2).toBeLessThanOrEqual(time1 * 2);
    });
  });

  // ========================================
  // 9. パフォーマンステスト（2ケース）
  // ========================================

  describe('パフォーマンステスト', () => {
    test('TC9.1: フェーズ判定が1ms以内', () => {
      const status = createStatus(10, 6, 4, now - 86400000);
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        detector.detectPhase(`word${i}`, status);
      }
      const elapsed = performance.now() - start;
      
      const avgTime = elapsed / 100;
      expect(avgTime).toBeLessThan(1); // 平均1ms以内
    });

    test('TC9.2: 1000語のフェーズ分析が1秒以内', () => {
      const words = Array.from({ length: 1000 }, (_, i) => ({
        word: `word${i}`,
        status: createStatus(10, 6, 4, now - 86400000)
      }));
      
      const start = performance.now();
      analyzePhaseDistribution(words, detector);
      const elapsed = performance.now() - start;
      
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
