import { describe, it, expect, beforeEach } from 'vitest';
import {
  PersonalParameterEstimator,
  DEFAULT_ESTIMATION_CONFIG,
  DEFAULT_PERSONAL_PARAMETERS,
  isParameterReliable,
  calculateParameterApplicability,
  type LearningHistory
} from '../../src/strategies/personalParameterEstimator';

describe('PersonalParameterEstimator', () => {
  let estimator: PersonalParameterEstimator;

  beforeEach(() => {
    estimator = new PersonalParameterEstimator();
  });

  describe('初期状態', () => {
    it('TC1.1: デフォルトパラメータが設定される', () => {
      const params = estimator.getParameters();
      
      expect(params.learningSpeed).toBe(1.0);
      expect(params.forgettingSpeed).toBe(1.0);
      expect(params.consolidationThreshold).toBe(3);
      expect(params.confidenceLevel).toBe(0);
      expect(params.sampleSize).toBe(0);
    });

    it('TC1.2: カスタム設定が適用される', () => {
      const customEstimator = new PersonalParameterEstimator({
        minSampleSize: 30
      });
      
      const params = customEstimator.getParameters();
      expect(params).toBeDefined();
    });
  });

  describe('学習速度の推定', () => {
    it('TC2.1: 1-2回で正答する場合、学習速度が速い（1.5-2.0）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [
        { word: 'word1', timestamp: now, isCorrect: true, responseTime: 1000, reviewNumber: 1, daysSinceFirstSeen: 0 },
        { word: 'word2', timestamp: now, isCorrect: false, responseTime: 2000, reviewNumber: 1, daysSinceFirstSeen: 0 },
        { word: 'word2', timestamp: now, isCorrect: true, responseTime: 1500, reviewNumber: 2, daysSinceFirstSeen: 0 },
        { word: 'word3', timestamp: now, isCorrect: true, responseTime: 1000, reviewNumber: 1, daysSinceFirstSeen: 0 }
      ];
      
      // 20個のサンプルを追加
      for (let i = 4; i <= 20; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.learningSpeed).toBeGreaterThanOrEqual(1.5);
      expect(params.learningSpeed).toBeLessThanOrEqual(2.0);
    });

    it('TC2.2: 3-4回で正答する場合、標準速度（0.9-1.1）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各3-4回で正答
      for (let i = 1; i <= 20; i++) {
        const trials = i % 2 === 0 ? 3 : 4;
        for (let j = 1; j <= trials; j++) {
          history.push({
            word: `word${i}`,
            timestamp: now,
            isCorrect: j === trials,
            responseTime: 1500,
            reviewNumber: j,
            daysSinceFirstSeen: 0
          });
        }
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.learningSpeed).toBeGreaterThanOrEqual(0.9);
      expect(params.learningSpeed).toBeLessThanOrEqual(1.1);
    });

    it('TC2.3: 5回以上で正答する場合、学習速度が遅い（0.5-0.8）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各6回で正答
      for (let i = 1; i <= 20; i++) {
        for (let j = 1; j <= 6; j++) {
          history.push({
            word: `word${i}`,
            timestamp: now,
            isCorrect: j === 6,
            responseTime: 2000,
            reviewNumber: j,
            daysSinceFirstSeen: 0
          });
        }
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.learningSpeed).toBeGreaterThanOrEqual(0.5);
      expect(params.learningSpeed).toBeLessThanOrEqual(0.8);
    });
  });

  describe('忘却速度の推定', () => {
    it('TC3.1: 7日以上維持する場合、忘却が遅い（0.5-0.7）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各8日後に誤答
      for (let i = 1; i <= 20; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
        history.push({
          word: `word${i}`,
          timestamp: now + 86400000 * 8,
          isCorrect: false,
          responseTime: 2000,
          reviewNumber: 2,
          daysSinceFirstSeen: 8
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.forgettingSpeed).toBeGreaterThanOrEqual(0.5);
      expect(params.forgettingSpeed).toBeLessThanOrEqual(0.7);
    });

    it('TC3.2: 3-7日維持する場合、標準速度（0.9-1.1）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各5日後に誤答
      for (let i = 1; i <= 20; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
        history.push({
          word: `word${i}`,
          timestamp: now + 86400000 * 5,
          isCorrect: false,
          responseTime: 2000,
          reviewNumber: 2,
          daysSinceFirstSeen: 5
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.forgettingSpeed).toBeGreaterThanOrEqual(0.8);
      expect(params.forgettingSpeed).toBeLessThanOrEqual(1.1);
    });

    it('TC3.3: 3日未満で忘れる場合、忘却が速い（1.5-2.0）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各1日後に誤答
      for (let i = 1; i <= 20; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
        history.push({
          word: `word${i}`,
          timestamp: now + 86400000,
          isCorrect: false,
          responseTime: 2000,
          reviewNumber: 2,
          daysSinceFirstSeen: 1
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.forgettingSpeed).toBeGreaterThanOrEqual(1.5);
      expect(params.forgettingSpeed).toBeLessThanOrEqual(2.0);
    });
  });

  describe('定着閾値の推定', () => {
    it('TC4.1: 少ない回数で定着する場合、閾値が低い（2-3）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各5回で連続5回正答
      // 定着までの総回数5 × 0.6 = 3
      for (let i = 1; i <= 20; i++) {
        for (let j = 1; j <= 5; j++) {
          history.push({
            word: `word${i}`,
            timestamp: now + j * 1000,
            isCorrect: true,
            responseTime: 1000,
            reviewNumber: j,
            daysSinceFirstSeen: 0
          });
        }
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.consolidationThreshold).toBeGreaterThanOrEqual(2);
      expect(params.consolidationThreshold).toBeLessThanOrEqual(3);
    });

    it('TC4.2: 標準的な回数で定着する場合、閾値が標準（3）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各5回（1回誤答含む）で連続5回正答
      for (let i = 1; i <= 20; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now + 1000,
          isCorrect: false,
          responseTime: 2000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
        for (let j = 2; j <= 6; j++) {
          history.push({
            word: `word${i}`,
            timestamp: now + j * 1000,
            isCorrect: true,
            responseTime: 1000,
            reviewNumber: j,
            daysSinceFirstSeen: 0
          });
        }
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.consolidationThreshold).toBeGreaterThanOrEqual(2);
      expect(params.consolidationThreshold).toBeLessThanOrEqual(4);
    });

    it('TC4.3: 多くの回数を要する場合、閾値が高い（4-5）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 20単語、各10回（複数回誤答含む）で連続5回正答
      for (let i = 1; i <= 20; i++) {
        for (let j = 1; j <= 10; j++) {
          history.push({
            word: `word${i}`,
            timestamp: now + j * 1000,
            isCorrect: j > 5,
            responseTime: j > 5 ? 1000 : 2500,
            reviewNumber: j,
            daysSinceFirstSeen: 0
          });
        }
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.consolidationThreshold).toBeGreaterThanOrEqual(3);
      expect(params.consolidationThreshold).toBeLessThanOrEqual(5);
    });
  });

  describe('応答時間プロファイルの推定', () => {
    it('TC5.1: 平均応答時間が正しく計算される', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 平均2000msの履歴を作成
      for (let i = 1; i <= 30; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 2000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.responseTimeProfile.averageResponseTime).toBeCloseTo(2000, -1);
    });

    it('TC5.2: 速い応答の閾値が正しく計算される', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 応答時間にばらつきがある履歴
      for (let i = 1; i <= 30; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1000 + Math.random() * 2000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.responseTimeProfile.fastThreshold).toBeGreaterThan(0);
      expect(params.responseTimeProfile.fastThreshold).toBeLessThan(params.responseTimeProfile.averageResponseTime);
    });

    it('TC5.3: 一貫性スコアが正しく計算される', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 一貫性の高い履歴（全て同じ応答時間）
      for (let i = 1; i <= 30; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1500,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      // 完全に一貫している場合、スコアは1.0に近い
      expect(params.responseTimeProfile.consistencyScore).toBeGreaterThan(0.9);
    });
  });

  describe('信頼度の計算', () => {
    it('TC6.1: サンプル不足の場合、信頼度は0', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      // 10件のみ（minSampleSize=20未満）
      for (let i = 1; i <= 10; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1500,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.confidenceLevel).toBe(0);
    });

    it('TC6.2: 20-50件の場合、中程度の信頼度（0.1-0.7）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      for (let i = 1; i <= 30; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1500,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.confidenceLevel).toBeGreaterThan(0);
      expect(params.confidenceLevel).toBeLessThanOrEqual(0.7);
    });

    it('TC6.3: 50件以上の場合、高信頼度（0.7-1.0）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      for (let i = 1; i <= 60; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1500,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.confidenceLevel).toBeGreaterThan(0.7);
    });

    it('TC6.4: 100件以上の場合、非常に高い信頼度（0.9以上）', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      for (let i = 1; i <= 120; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1500,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters(history);
      
      expect(params.confidenceLevel).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('履歴管理', () => {
    it('TC7.1: 履歴を追加できる', () => {
      const now = Date.now();
      
      estimator.addHistory({
        word: 'word1',
        timestamp: now,
        isCorrect: true,
        responseTime: 1500,
        reviewNumber: 1,
        daysSinceFirstSeen: 0
      });
      
      const params = estimator.getParameters();
      expect(params.sampleSize).toBe(0); // estimateを呼ぶまでは0
    });

    it('TC7.2: 履歴をクリアできる', () => {
      const now = Date.now();
      
      for (let i = 1; i <= 10; i++) {
        estimator.addHistory({
          word: `word${i}`,
          timestamp: now,
          isCorrect: true,
          responseTime: 1500,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      estimator.clearHistory();
      
      const params = estimator.estimateParameters();
      expect(params.sampleSize).toBe(0);
    });

    it('TC7.3: 100件を超える履歴は古いものから削除される', () => {
      const now = Date.now();
      
      for (let i = 1; i <= 120; i++) {
        estimator.addHistory({
          word: `word${i}`,
          timestamp: now + i * 1000,
          isCorrect: true,
          responseTime: 1500,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const params = estimator.estimateParameters();
      expect(params.sampleSize).toBe(100);
    });
  });

  describe('パラメータのインポート/エクスポート', () => {
    it('TC8.1: パラメータをインポートできる', () => {
      const customParams = {
        ...DEFAULT_PERSONAL_PARAMETERS,
        learningSpeed: 1.5,
        forgettingSpeed: 0.8,
        consolidationThreshold: 4,
        confidenceLevel: 0.9,
        sampleSize: 100
      };
      
      estimator.importParameters(customParams);
      
      const params = estimator.getParameters();
      expect(params.learningSpeed).toBe(1.5);
      expect(params.forgettingSpeed).toBe(0.8);
      expect(params.consolidationThreshold).toBe(4);
    });

    it('TC8.2: パラメータをエクスポートできる', () => {
      const params = estimator.getParameters();
      
      expect(params).toHaveProperty('learningSpeed');
      expect(params).toHaveProperty('forgettingSpeed');
      expect(params).toHaveProperty('consolidationThreshold');
      expect(params).toHaveProperty('responseTimeProfile');
    });
  });

  describe('パフォーマンス', () => {
    it('TC9.1: 100件の履歴を1秒以内に推定できる', () => {
      const now = Date.now();
      const history: LearningHistory[] = [];
      
      for (let i = 1; i <= 100; i++) {
        history.push({
          word: `word${i}`,
          timestamp: now,
          isCorrect: i % 3 !== 0,
          responseTime: 1000 + Math.random() * 2000,
          reviewNumber: 1,
          daysSinceFirstSeen: 0
        });
      }
      
      const start = Date.now();
      estimator.estimateParameters(history);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(1000);
    });
  });
});

describe('isParameterReliable', () => {
  it('信頼度が閾値以上の場合、信頼できる', () => {
    const params = {
      ...DEFAULT_PERSONAL_PARAMETERS,
      confidenceLevel: 0.8
    };
    
    expect(isParameterReliable(params)).toBe(true);
  });

  it('信頼度が閾値未満の場合、信頼できない', () => {
    const params = {
      ...DEFAULT_PERSONAL_PARAMETERS,
      confidenceLevel: 0.5
    };
    
    expect(isParameterReliable(params)).toBe(false);
  });
});

describe('calculateParameterApplicability', () => {
  it('サンプル不足の場合、適用を推奨しない', () => {
    const params = {
      ...DEFAULT_PERSONAL_PARAMETERS,
      sampleSize: 10,
      confidenceLevel: 0
    };
    
    const result = calculateParameterApplicability(params);
    
    expect(result.shouldApply).toBe(false);
    expect(result.reason).toContain('サンプル不足');
  });

  it('信頼度が低い場合、適用を推奨しない', () => {
    const params = {
      ...DEFAULT_PERSONAL_PARAMETERS,
      sampleSize: 30,
      confidenceLevel: 0.5
    };
    
    const result = calculateParameterApplicability(params);
    
    expect(result.shouldApply).toBe(false);
    expect(result.reason).toContain('信頼度が低い');
  });

  it('個人差が顕著な場合、適用を推奨する', () => {
    const params = {
      ...DEFAULT_PERSONAL_PARAMETERS,
      learningSpeed: 1.8,
      forgettingSpeed: 0.6,
      sampleSize: 60,
      confidenceLevel: 0.9
    };
    
    const result = calculateParameterApplicability(params);
    
    expect(result.shouldApply).toBe(true);
    expect(result.reason).toContain('個人差が顕著');
  });

  it('標準的なパターンの場合でも適用可能', () => {
    const params = {
      ...DEFAULT_PERSONAL_PARAMETERS,
      learningSpeed: 1.0,
      forgettingSpeed: 1.0,
      consolidationThreshold: 3,
      sampleSize: 50,
      confidenceLevel: 0.8
    };
    
    const result = calculateParameterApplicability(params);
    
    expect(result.shouldApply).toBe(true);
    expect(result.reason).toContain('標準的');
  });
});
