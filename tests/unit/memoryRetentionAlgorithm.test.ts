import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryRetentionManager,
  DEFAULT_RETENTION_CONFIG,
  isOptimalReviewTime,
  calculateReviewEfficiency,
  type ReviewResult,
} from '../../src/strategies/memoryRetentionAlgorithm';

describe('MemoryRetentionManager', () => {
  let manager: MemoryRetentionManager;

  beforeEach(() => {
    manager = new MemoryRetentionManager();
  });

  describe('初期状態', () => {
    it('TC1.1: 新規単語の初期状態が正しく設定される', () => {
      const status = manager.getRetentionStatus('word');

      expect(status.sm2.interval).toBe(1);
      expect(status.sm2.repetition).toBe(0);
      expect(status.sm2.easeFactor).toBe(2.5);
      expect(status.retentionRate).toBe(1.0);
      expect(status.forgettingIndex).toBe(1.0);
      expect(status.totalReviews).toBe(0);
      expect(status.totalCorrect).toBe(0);
    });

    it('TC1.2: デフォルト設定が正しく適用される', () => {
      expect(DEFAULT_RETENTION_CONFIG.minEaseFactor).toBe(1.3);
      expect(DEFAULT_RETENTION_CONFIG.maxEaseFactor).toBe(2.5);
      expect(DEFAULT_RETENTION_CONFIG.initialInterval).toBe(1);
    });

    it('TC1.3: カスタム設定が正しく適用される', () => {
      const customManager = new MemoryRetentionManager({
        minEaseFactor: 1.5,
        initialInterval: 2,
      });

      const status = customManager.getRetentionStatus('word');
      expect(status.sm2.interval).toBe(2);
    });
  });

  describe('復習記録（正答）', () => {
    it('TC2.1: 1回目の正答でinterval=1日になる', () => {
      const result: ReviewResult = {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: Date.now(),
      };

      const status = manager.recordReview('word', result);

      expect(status.totalReviews).toBe(1);
      expect(status.totalCorrect).toBe(1);
      expect(status.consecutiveCorrect).toBe(1);
      expect(status.sm2.repetition).toBe(1);
      expect(status.sm2.interval).toBe(1);
    });

    it('TC2.2: 2回目の正答でinterval=6日になる', () => {
      const now = Date.now();

      // 1回目
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      // 2回目
      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now + 86400000,
      });

      expect(status.sm2.repetition).toBe(2);
      expect(status.sm2.interval).toBe(6);
      expect(status.consecutiveCorrect).toBe(2);
    });

    it('TC2.3: 3回目以降はinterval * easeFactorで計算される', () => {
      const now = Date.now();

      // 1回目
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      // 2回目
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now + 86400000,
      });

      // 3回目
      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now + 86400000 * 7,
      });

      expect(status.sm2.repetition).toBe(3);
      // interval = 6 * easeFactor (約2.5-2.6) = 15-16日
      expect(status.sm2.interval).toBeGreaterThanOrEqual(14);
      expect(status.sm2.interval).toBeLessThanOrEqual(16);
    });

    it('TC2.4: 自信度が高いとeaseFactorが維持または上昇する', () => {
      const now = Date.now();

      // 1回目
      const status1 = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      const initialEF = status1.sm2.easeFactor;

      // 2回目（confidence=5で高評価）
      const status2 = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5, // 完璧
        timestamp: now + 86400000,
      });

      // confidence=5の場合、easeFactorは維持または上昇する
      expect(status2.sm2.easeFactor).toBeGreaterThanOrEqual(initialEF - 0.01);
    });

    it('TC2.5: 自信度が低いとeaseFactorが下降する', () => {
      const now = Date.now();

      const status1 = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 2, // 難しい
        timestamp: now,
      });

      expect(status1.sm2.easeFactor).toBeLessThan(2.5);
    });

    it('TC2.6: 応答時間が遅いと間隔が短縮される', () => {
      const now = Date.now();

      // 1回目（速い）
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      // 2回目（遅い）
      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 5000, // 5秒（遅い）
        confidence: 5,
        timestamp: now + 86400000,
      });

      // 通常6日だが、応答時間が遅いため短縮される
      expect(status.sm2.interval).toBeLessThanOrEqual(6);
    });

    it('TC2.7: 平均応答時間が更新される', () => {
      const now = Date.now();

      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 2000,
        confidence: 5,
        timestamp: now + 86400000,
      });

      // 移動平均（alpha=0.3）: 1000 * 0.7 + 2000 * 0.3 = 1300
      // ただし初期値が0なので1回目は0 * 0.7 + 1000 * 0.3 = 300、2回目は300 * 0.7 + 2000 * 0.3 = 810
      expect(status.averageResponseTime).toBeGreaterThan(700);
      expect(status.averageResponseTime).toBeLessThan(1000);
    });
  });

  describe('復習記録（誤答）', () => {
    it('TC3.1: 誤答するとrepetitionがリセットされる', () => {
      const now = Date.now();

      // 正答を重ねる
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now + 86400000,
      });

      // 誤答
      const status = manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000 * 7,
      });

      expect(status.sm2.repetition).toBe(0);
      expect(status.sm2.interval).toBe(1);
      expect(status.consecutiveCorrect).toBe(0);
      expect(status.consecutiveWrong).toBe(1);
    });

    it('TC3.2: 誤答するとeaseFactorが減少する', () => {
      const now = Date.now();

      // 1回正答
      const status1 = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      const easeFactorBefore = status1.sm2.easeFactor;

      // 誤答
      const status2 = manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000,
      });

      expect(status2.sm2.easeFactor).toBeLessThan(easeFactorBefore);
      expect(status2.sm2.easeFactor).toBeGreaterThanOrEqual(DEFAULT_RETENTION_CONFIG.minEaseFactor);
    });

    it('TC3.3: 連続誤答回数が記録される', () => {
      const now = Date.now();

      manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now,
      });

      const status = manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000,
      });

      expect(status.consecutiveWrong).toBe(2);
    });

    it('TC3.4: 誤答後の正答で連続正答回数がリセットされる', () => {
      const now = Date.now();

      manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now,
      });

      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now + 86400000,
      });

      expect(status.consecutiveCorrect).toBe(1);
      expect(status.consecutiveWrong).toBe(0);
    });
  });

  describe('復習期限の判定', () => {
    it('TC4.1: 復習期限前の単語は取得されない', () => {
      const now = Date.now();

      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 0.5, // 0.5日前に復習
      });

      const dueWords = manager.getDueWords(['word1'], now);
      expect(dueWords).toHaveLength(0);
    });

    it('TC4.2: 復習期限を過ぎた単語が取得される', () => {
      const now = Date.now();

      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 2, // 2日前に復習（interval=1）
      });

      const dueWords = manager.getDueWords(['word1'], now);
      expect(dueWords).toHaveLength(1);
      expect(dueWords[0]).toBe('word1');
    });

    it('TC4.3: 優先度順にソートされる', () => {
      const now = Date.now();

      // word1: 2日遅れ
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 3,
      });

      // word2: 1日遅れ
      manager.recordReview('word2', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 2,
      });

      const dueWords = manager.getDueWords(['word1', 'word2'], now);
      expect(dueWords[0]).toBe('word1'); // より遅れている方が優先
    });

    it('TC4.4: 忘却指数が高い単語が優先される', () => {
      const now = Date.now();

      // word1: 正答率が高い（忘却指数が低い）
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 2,
      });
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 1.5,
      });

      // word2: 誤答が多い（忘却指数が高い）
      manager.recordReview('word2', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now - 86400000 * 2,
      });

      const dueWords = manager.getDueWords(['word1', 'word2'], now);
      expect(dueWords[0]).toBe('word2'); // 忘却指数が高い方が優先
    });
  });

  describe('復習スケジュール', () => {
    it('TC5.1: 7日間のスケジュールが生成される', () => {
      const now = Date.now();

      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      const schedule = manager.getReviewSchedule(['word1'], 7);
      expect(schedule.has('word1')).toBe(true);

      const dates = schedule.get('word1')!;
      expect(dates.length).toBeGreaterThan(0);
    });

    it('TC5.2: 復習期限が期間外の単語はスケジュールに含まれない', () => {
      const now = Date.now();

      // interval=6日に設定
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000,
      });

      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      // 3日間のスケジュール（interval=6日なので含まれない）
      const schedule = manager.getReviewSchedule(['word1'], 3);
      expect(schedule.has('word1')).toBe(false);
    });
  });

  describe('保持統計', () => {
    it('TC6.1: 統計情報が正しく計算される', () => {
      const now = Date.now();

      // word1: 正答
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 2,
      });

      // word2: 正答
      manager.recordReview('word2', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 2,
      });

      const stats = manager.getRetentionStatistics(['word1', 'word2']);

      expect(stats.averageRetentionRate).toBeGreaterThan(0);
      expect(stats.averageEaseFactor).toBeGreaterThan(0);
      expect(stats.averageInterval).toBeGreaterThan(0);
      expect(stats.dueCount).toBe(2); // 両方とも期限切れ
    });

    it('TC6.2: 十分に学習された単語がカウントされる', () => {
      const now = Date.now();

      // word1を6回連続正答（連続5回以上）
      for (let i = 0; i < 6; i++) {
        manager.recordReview('word1', {
          isCorrect: true,
          responseTime: 1000,
          confidence: 5,
          timestamp: now - 86400000 * (100 - i * 10),
        });
      }

      const stats = manager.getRetentionStatistics(['word1']);

      expect(stats.wellLearnedCount).toBe(1);
    });

    it('TC6.3: 期限超過日数が正しくカウントされる', () => {
      const now = Date.now();

      // word1: 2日超過
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 3,
      });

      const stats = manager.getRetentionStatistics(['word1']);

      expect(stats.overdueCount).toBe(1);
    });
  });

  describe('保持率の推定', () => {
    it('TC7.1: 復習直後は保持率が高い', () => {
      const now = Date.now();

      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      expect(status.retentionRate).toBeGreaterThan(0.9);
    });

    it('TC7.2: 時間経過とともに保持率が減衰する', () => {
      const now = Date.now();

      // 1日前に復習（interval=1日）
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000,
      });

      const status = manager.getRetentionStatus('word');
      const retentionRate = manager.estimateRetentionRate(status);

      // 期限ちょうどなので保持率は中程度
      expect(retentionRate).toBeLessThan(1.0);
      expect(retentionRate).toBeGreaterThan(0.3);
    });

    it('TC7.3: 期限超過後は保持率が急速に減衰する', () => {
      const now = Date.now();

      // 3日前に復習（interval=1日、2日超過）
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * 3,
      });

      const status = manager.getRetentionStatus('word');
      const retentionRate = manager.estimateRetentionRate(status);

      expect(retentionRate).toBeLessThan(0.5);
    });
  });

  describe('忘却指数', () => {
    it('TC8.1: 誤答が多いと忘却指数が高くなる', () => {
      const now = Date.now();

      // 5回復習、2回正答、3回誤答
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000,
      });

      manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000 * 2,
      });

      manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000 * 3,
      });

      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now + 86400000 * 4,
      });

      expect(status.forgettingIndex).toBeGreaterThan(1.5);
    });

    it('TC8.2: 応答時間が遅いと忘却指数が高くなる', () => {
      const now = Date.now();

      // 応答時間が常に遅い
      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 4000,
        confidence: 3,
        timestamp: now,
      });

      const status = manager.recordReview('word', {
        isCorrect: true,
        responseTime: 4500,
        confidence: 3,
        timestamp: now + 86400000,
      });

      expect(status.forgettingIndex).toBeGreaterThan(1.0);
    });

    it('TC8.3: 連続誤答が多いと忘却指数が高くなる', () => {
      const now = Date.now();

      manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now,
      });

      manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000,
      });

      const status = manager.recordReview('word', {
        isCorrect: false,
        responseTime: 3000,
        confidence: 1,
        timestamp: now + 86400000 * 2,
      });

      expect(status.forgettingIndex).toBeGreaterThan(2.0);
    });
  });

  describe('データ管理', () => {
    it('TC9.1: データをリセットできる', () => {
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: Date.now(),
      });

      manager.reset();

      const status = manager.getRetentionStatus('word1');
      expect(status.totalReviews).toBe(0);
    });

    it('TC9.2: データをエクスポートできる', () => {
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: Date.now(),
      });

      const exported = manager.exportRetentionData();
      expect(exported.has('word1')).toBe(true);
    });

    it('TC9.3: データをインポートできる', () => {
      const data = new Map();
      data.set('word1', {
        lastReviewDate: Date.now(),
        nextReviewDate: Date.now() + 86400000,
        sm2: { interval: 6, repetition: 2, easeFactor: 2.5 },
        retentionRate: 0.8,
        forgettingIndex: 1.2,
        totalReviews: 5,
        totalCorrect: 4,
        consecutiveCorrect: 2,
        consecutiveWrong: 0,
        averageResponseTime: 1500,
        lastResponseTime: 1400,
      });

      manager.importRetentionData(data);

      const status = manager.getRetentionStatus('word1');
      expect(status.totalReviews).toBe(5);
      expect(status.sm2.interval).toBe(6);
    });
  });

  describe('パフォーマンス', () => {
    it('TC10.1: 100語の復習記録が1秒以内に完了する', () => {
      const start = Date.now();
      const now = Date.now();

      for (let i = 1; i <= 100; i++) {
        manager.recordReview(`word${i}`, {
          isCorrect: true,
          responseTime: 1000,
          confidence: 5,
          timestamp: now,
        });
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('TC10.2: 1000語の期限チェックが1秒以内に完了する', () => {
      const now = Date.now();

      for (let i = 1; i <= 1000; i++) {
        manager.recordReview(`word${i}`, {
          isCorrect: true,
          responseTime: 1000,
          confidence: 5,
          timestamp: now - 86400000 * 2,
        });
      }

      const start = Date.now();
      const wordList = Array.from({ length: 1000 }, (_, i) => `word${i + 1}`);
      const dueWords = manager.getDueWords(wordList, now);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
      expect(dueWords.length).toBe(1000);
    });
  });

  describe('定着評価（1日＋7日 複合）', () => {
    it('1日先と7日先の保持率を返し、複合スコアはその間に収まる', () => {
      const now = Date.now();

      manager.recordReview('word', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });

      const status = manager.getRetentionStatus('word');
      const evalResult = manager.evaluateConsolidation(status, now, [1, 7], [0.5, 0.5]);

      const r1 = evalResult.retentionAtHorizon[1];
      const r7 = evalResult.retentionAtHorizon[7];
      expect(r1).toBeGreaterThan(0);
      expect(r1).toBeLessThanOrEqual(1);
      expect(r7).toBeGreaterThan(0);
      expect(r7).toBeLessThanOrEqual(1);
      expect(evalResult.compositeRetention).toBeLessThanOrEqual(Math.max(r1, r7));
      expect(evalResult.compositeRetention).toBeGreaterThanOrEqual(Math.min(r1, r7));
    });

    it('間隔が長いほど（学習が進むほど）複合スコアが高くなる傾向', () => {
      const now = Date.now();

      // interval=1（初回）
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });
      const s1 = manager.getRetentionStatus('word1');
      const e1 = manager.evaluateConsolidation(s1, now).compositeRetention;

      // interval=6（2回目正答）
      manager.recordReview('word2', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now,
      });
      manager.recordReview('word2', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now + 86400000,
      });
      const s2 = manager.getRetentionStatus('word2');
      const e2 = manager.evaluateConsolidation(s2, now).compositeRetention;

      expect(e2).toBeGreaterThan(e1);
    });
  });
});

describe('isOptimalReviewTime', () => {
  it('期限を過ぎている場合は最適なタイミング', () => {
    const now = Date.now();
    const status = {
      nextReviewDate: now - 3600000, // 1時間前
      retentionRate: 0.8,
    } as any;

    const result = isOptimalReviewTime(status, now);
    expect(result.isOptimal).toBe(true);
    expect(result.reason).toContain('過ぎて');
  });

  it('期限が2時間以内に迫っている場合は最適なタイミング', () => {
    const now = Date.now();
    const status = {
      nextReviewDate: now + 3600000, // 1時間後
      retentionRate: 0.8,
    } as any;

    const result = isOptimalReviewTime(status, now);
    expect(result.isOptimal).toBe(true);
    expect(result.reason).toContain('近づいて');
  });

  it('保持率が60%未満の場合は最適なタイミング', () => {
    const now = Date.now();
    const status = {
      nextReviewDate: now + 86400000 * 2, // 2日後
      retentionRate: 0.5,
    } as any;

    const result = isOptimalReviewTime(status, now);
    expect(result.isOptimal).toBe(true);
    expect(result.reason).toContain('保持率');
  });

  it('期限まで余裕があり保持率も高い場合は不要', () => {
    const now = Date.now();
    const status = {
      nextReviewDate: now + 86400000 * 5, // 5日後
      retentionRate: 0.9,
    } as any;

    const result = isOptimalReviewTime(status, now);
    expect(result.isOptimal).toBe(false);
    expect(result.reason).toContain('必要はありません');
  });
});

describe('calculateReviewEfficiency', () => {
  it('単語がない場合は効率0', () => {
    const manager = new MemoryRetentionManager();
    const efficiency = calculateReviewEfficiency(manager, []);
    expect(efficiency).toBe(0);
  });

  it('効率が正しく計算される', () => {
    const manager = new MemoryRetentionManager();
    const now = Date.now();

    // 複数回正答して習得レベルを上げる
    for (let i = 0; i < 5; i++) {
      manager.recordReview('word1', {
        isCorrect: true,
        responseTime: 1000,
        confidence: 5,
        timestamp: now - 86400000 * (100 - i * 15),
      });
    }

    const efficiency = calculateReviewEfficiency(manager, ['word1']);
    expect(efficiency).toBeGreaterThan(0);
    expect(efficiency).toBeLessThanOrEqual(1.0);
  });
});
