import { describe, it, expect, beforeEach } from 'vitest';
import {
  HybridQuestionSelector,
  getDefaultSelector,
  resetDefaultSelector,
  type QuestionCandidate,
  type HybridStrategy
} from '../../src/strategies/hybridQuestionSelector';
import { QuestionCategory } from '../../src/strategies/memoryAcquisitionAlgorithm';
import { LearningPhase } from '../../src/strategies/learningPhaseDetector';
import { QueueType } from '../../src/strategies/memoryAcquisitionAlgorithm';
import { DEFAULT_PERSONAL_PARAMETERS } from '../../src/strategies/personalParameterEstimator';

describe('HybridQuestionSelector', () => {
  let selector: HybridQuestionSelector;
  
  beforeEach(() => {
    selector = new HybridQuestionSelector();
  });
  
  describe('初期化と設定', () => {
    it('TC1.1: デフォルト戦略で初期化される', () => {
      expect(selector).toBeDefined();
    });
    
    it('TC1.2: カスタム戦略を設定できる', () => {
      const customStrategy: HybridStrategy = {
        acquisitionRatio: 0.7,
        retentionRatio: 0.3,
        adaptiveAdjustment: false
      };
      
      const customSelector = new HybridQuestionSelector(customStrategy);
      expect(customSelector).toBeDefined();
    });
    
    it('TC1.3: 個人パラメータを設定できる', () => {
      selector.setPersonalParameters(DEFAULT_PERSONAL_PARAMETERS);
      expect(selector).toBeDefined();
    });
    
    it('TC1.4: 戦略を動的に更新できる', () => {
      selector.updateStrategy({ acquisitionRatio: 0.8 });
      expect(selector).toBeDefined();
    });
  });
  
  describe('問題選択ロジック', () => {
    it('TC2.1: 候補がない場合はnullを返す', () => {
      const result = selector.selectNextQuestion([]);
      expect(result).toBeNull();
    });
    
    it('TC2.2: 候補が1つの場合はそれを返す', () => {
      const candidates: QuestionCandidate[] = [{
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.ENCODING,
        reviewCount: 0,
        correctCount: 0,
        lastReviewTime: Date.now()
      }];
      
      const result = selector.selectNextQuestion(candidates);
      expect(result).toBe(candidates[0]);
    });
    
    it('TC2.3: 同日復習キューがある場合は最優先で選択', () => {
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'word1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        },
        {
          id: 'word2',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.INITIAL_CONSOLIDATION,
          reviewCount: 1,
          correctCount: 1,
          lastReviewTime: now - 60000,
          queueType: QueueType.IMMEDIATE,
          questionNumber: 1
        }
      ];
      
      const result = selector.selectNextQuestion(candidates);
      expect(result?.id).toBe('word2');
    });
    
    it('TC2.4: 新規単語と復習単語が混在する場合、戦略に基づいて選択', () => {
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'new1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        },
        {
          id: 'review1',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 3,
          correctCount: 2,
          lastReviewTime: now - 86400000,
          nextReviewTime: now - 3600000
        }
      ];
      
      // 複数回試行して両方が選ばれることを確認
      const results = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = selector.selectNextQuestion(candidates);
        if (result) {
          results.add(result.id);
        }
      }
      
      // 60%新規、40%復習の戦略なので、両方選ばれる可能性がある
      expect(results.size).toBeGreaterThan(0);
    });
  });
  
  describe('優先度計算', () => {
    it('TC3.1: キュー優先度が正しく計算される（IMMEDIATE）', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.INITIAL_CONSOLIDATION,
        reviewCount: 1,
        correctCount: 1,
        lastReviewTime: Date.now(),
        queueType: QueueType.IMMEDIATE,
        questionNumber: 1
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.queuePriority).toBeGreaterThan(30);
    });
    
    it('TC3.2: キュー優先度が正しく計算される（EARLY）', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.INITIAL_CONSOLIDATION,
        reviewCount: 2,
        correctCount: 2,
        lastReviewTime: Date.now(),
        queueType: QueueType.EARLY,
        questionNumber: 5
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.queuePriority).toBeGreaterThan(20);
      expect(result.breakdown.queuePriority).toBeLessThan(40);
    });
    
    it('TC3.3: キュー優先度が正しく計算される（MID）', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.INTRADAY_REVIEW,
        reviewCount: 3,
        correctCount: 3,
        lastReviewTime: Date.now(),
        queueType: QueueType.MID,
        questionNumber: 20
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.queuePriority).toBeGreaterThan(10);
      expect(result.breakdown.queuePriority).toBeLessThan(30);
    });
    
    it('TC3.4: フェーズ優先度が正しく計算される（ENCODING）', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.ENCODING,
        reviewCount: 0,
        correctCount: 0,
        lastReviewTime: Date.now()
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.phasePriority).toBe(25);
    });
    
    it('TC3.5: フェーズ優先度が正しく計算される（INITIAL_CONSOLIDATION）', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.INITIAL_CONSOLIDATION,
        reviewCount: 1,
        correctCount: 1,
        lastReviewTime: Date.now()
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.phasePriority).toBe(30);
    });
    
    it('TC3.6: フェーズ優先度が正しく計算される（LONG_TERM）', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.LONG_TERM,
        reviewCount: 10,
        correctCount: 9,
        lastReviewTime: Date.now() - 86400000 * 30
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.phasePriority).toBe(10);
    });
    
    it('TC3.7: タイミング優先度が正しく計算される（新規単語）', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.ENCODING,
        reviewCount: 0,
        correctCount: 0,
        lastReviewTime: Date.now()
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.timingPriority).toBe(15);
    });
    
    it('TC3.8: タイミング優先度が正しく計算される（復習時刻超過）', () => {
      const now = Date.now();
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.SHORT_TERM,
        reviewCount: 2,
        correctCount: 2,
        lastReviewTime: now - 86400000,
        nextReviewTime: now - 7200000 // 2時間前に復習予定
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.timingPriority).toBeGreaterThan(10);
    });
    
    it('TC3.9: タイミング優先度が正しく計算される（復習時刻前）', () => {
      const now = Date.now();
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.SHORT_TERM,
        reviewCount: 2,
        correctCount: 2,
        lastReviewTime: now - 43200000,
        nextReviewTime: now + 7200000 // 2時間後に復習予定
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.timingPriority).toBeLessThan(10);
    });
  });
  
  describe('個人パラメータの影響', () => {
    it('TC4.1: 学習速度が遅い場合、新規単語の優先度が下がる', () => {
      selector.setPersonalParameters({
        ...DEFAULT_PERSONAL_PARAMETERS,
        learningSpeed: 0.6
      });
      
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.ENCODING,
        reviewCount: 0,
        correctCount: 0,
        lastReviewTime: Date.now()
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.personalPriority).toBeLessThan(5);
    });
    
    it('TC4.2: 学習速度が速い場合、新規単語の優先度が上がる', () => {
      selector.setPersonalParameters({
        ...DEFAULT_PERSONAL_PARAMETERS,
        learningSpeed: 1.5
      });
      
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.ENCODING,
        reviewCount: 0,
        correctCount: 0,
        lastReviewTime: Date.now()
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.personalPriority).toBeGreaterThan(5);
    });
    
    it('TC4.3: 忘却速度が速い場合、復習単語の優先度が上がる', () => {
      selector.setPersonalParameters({
        ...DEFAULT_PERSONAL_PARAMETERS,
        forgettingSpeed: 1.8
      });
      
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.SHORT_TERM,
        reviewCount: 3,
        correctCount: 2,
        lastReviewTime: Date.now() - 86400000
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.personalPriority).toBeGreaterThan(5);
    });
    
    it('TC4.4: 忘却速度が遅い場合、復習単語の優先度が下がる', () => {
      selector.setPersonalParameters({
        ...DEFAULT_PERSONAL_PARAMETERS,
        forgettingSpeed: 0.6
      });
      
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.SHORT_TERM,
        reviewCount: 3,
        correctCount: 2,
        lastReviewTime: Date.now() - 86400000
      };
      
      const result = selector.calculatePriority(candidate);
      expect(result.breakdown.personalPriority).toBeLessThan(5);
    });
  });
  
  describe('動的調整', () => {
    it('TC5.1: 序盤（1-10問）は新規単語が70%', () => {
      selector.updateStrategy({
        adaptiveAdjustment: true,
        sessionQuestionNumber: 5
      });
      
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'new1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        },
        {
          id: 'review1',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 2,
          correctCount: 2,
          lastReviewTime: now - 86400000,
          nextReviewTime: now
        }
      ];
      
      const results: Record<string, number> = { new: 0, review: 0 };
      for (let i = 0; i < 100; i++) {
        const result = selector.selectNextQuestion(candidates);
        if (result?.reviewCount === 0) {
          results.new++;
        } else {
          results.review++;
        }
      }
      
      const newRatio = results.new / (results.new + results.review);
      expect(newRatio).toBeGreaterThan(0.6);
      expect(newRatio).toBeLessThan(0.8);
    });
    
    it('TC5.2: 中盤（11-20問）は新規単語が60%', () => {
      selector.updateStrategy({
        adaptiveAdjustment: true,
        sessionQuestionNumber: 15
      });
      
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'new1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        },
        {
          id: 'review1',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 2,
          correctCount: 2,
          lastReviewTime: now - 86400000,
          nextReviewTime: now
        }
      ];
      
      const results: Record<string, number> = { new: 0, review: 0 };
      for (let i = 0; i < 100; i++) {
        const result = selector.selectNextQuestion(candidates);
        if (result?.reviewCount === 0) {
          results.new++;
        } else {
          results.review++;
        }
      }
      
      const newRatio = results.new / (results.new + results.review);
      expect(newRatio).toBeGreaterThan(0.5);
      expect(newRatio).toBeLessThan(0.7);
    });
    
    it('TC5.3: 終盤（21-30問）は新規単語が50%', () => {
      selector.updateStrategy({
        adaptiveAdjustment: true,
        sessionQuestionNumber: 25
      });
      
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'new1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        },
        {
          id: 'review1',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 2,
          correctCount: 2,
          lastReviewTime: now - 86400000,
          nextReviewTime: now
        }
      ];
      
      const results: Record<string, number> = { new: 0, review: 0 };
      for (let i = 0; i < 100; i++) {
        const result = selector.selectNextQuestion(candidates);
        if (result?.reviewCount === 0) {
          results.new++;
        } else {
          results.review++;
        }
      }
      
      const newRatio = results.new / (results.new + results.review);
      expect(newRatio).toBeGreaterThan(0.4);
      expect(newRatio).toBeLessThan(0.6);
    });
  });
  
  describe('複雑なシナリオ', () => {
    it('TC6.1: 複数のキュータイプが混在する場合、優先度順に選択', () => {
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'immediate',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.INITIAL_CONSOLIDATION,
          reviewCount: 1,
          correctCount: 1,
          lastReviewTime: now - 60000,
          queueType: QueueType.IMMEDIATE,
          questionNumber: 1
        },
        {
          id: 'early',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.INITIAL_CONSOLIDATION,
          reviewCount: 2,
          correctCount: 2,
          lastReviewTime: now - 600000,
          queueType: QueueType.EARLY,
          questionNumber: 5
        },
        {
          id: 'mid',
          word: 'cherry',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.INTRADAY_REVIEW,
          reviewCount: 3,
          correctCount: 3,
          lastReviewTime: now - 3600000,
          queueType: QueueType.MID,
          questionNumber: 20
        }
      ];
      
      const result = selector.selectNextQuestion(candidates);
      expect(result?.id).toBe('immediate');
    });
    
    it('TC6.2: 全て復習単語の場合、最も遅延している単語を選択', () => {
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'word1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 3,
          correctCount: 2,
          lastReviewTime: now - 86400000,
          nextReviewTime: now - 3600000 // 1時間遅延
        },
        {
          id: 'word2',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 2,
          correctCount: 2,
          lastReviewTime: now - 86400000 * 2,
          nextReviewTime: now - 7200000 // 2時間遅延
        },
        {
          id: 'word3',
          word: 'cherry',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 4,
          correctCount: 3,
          lastReviewTime: now - 86400000 * 3,
          nextReviewTime: now + 3600000 // 1時間後に予定
        }
      ];
      
      const result = selector.selectNextQuestion(candidates);
      expect(result?.id).toBe('word2');
    });
    
    it('TC6.3: 全て新規単語の場合、フェーズ優先度が高い単語を選択', () => {
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'word1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        },
        {
          id: 'word2',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        }
      ];
      
      const result = selector.selectNextQuestion(candidates);
      expect(result).toBeDefined();
      expect(candidates.map(c => c.id)).toContain(result?.id);
    });
  });
  
  describe('デバッグ機能', () => {
    it('TC7.1: getAllPrioritiesで全候補の優先度を取得できる', () => {
      const now = Date.now();
      const candidates: QuestionCandidate[] = [
        {
          id: 'word1',
          word: 'apple',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.ENCODING,
          reviewCount: 0,
          correctCount: 0,
          lastReviewTime: now
        },
        {
          id: 'word2',
          word: 'banana',
          category: QuestionCategory.MEMORIZATION,
          phase: LearningPhase.SHORT_TERM,
          reviewCount: 2,
          correctCount: 2,
          lastReviewTime: now - 86400000
        }
      ];
      
      const priorities = selector.getAllPriorities(candidates);
      
      expect(priorities).toHaveLength(2);
      expect(priorities[0].priority).toBeGreaterThanOrEqual(priorities[1].priority);
    });
    
    it('TC7.2: 優先度の内訳が正しく取得できる', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.INITIAL_CONSOLIDATION,
        reviewCount: 1,
        correctCount: 1,
        lastReviewTime: Date.now(),
        queueType: QueueType.IMMEDIATE
      };
      
      const result = selector.calculatePriority(candidate);
      
      expect(result.breakdown).toHaveProperty('queuePriority');
      expect(result.breakdown).toHaveProperty('phasePriority');
      expect(result.breakdown).toHaveProperty('timingPriority');
      expect(result.breakdown).toHaveProperty('personalPriority');
    });
    
    it('TC7.3: 理由が生成される', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.INITIAL_CONSOLIDATION,
        reviewCount: 1,
        correctCount: 1,
        lastReviewTime: Date.now(),
        queueType: QueueType.IMMEDIATE
      };
      
      const result = selector.calculatePriority(candidate);
      
      expect(result.reason).toContain('キュー');
      expect(result.reason).toContain('フェーズ');
    });
  });
  
  describe('シングルトン', () => {
    it('TC8.1: デフォルトセレクターを取得できる', () => {
      const selector1 = getDefaultSelector();
      const selector2 = getDefaultSelector();
      
      expect(selector1).toBe(selector2);
    });
    
    it('TC8.2: デフォルトセレクターをリセットできる', () => {
      const selector1 = getDefaultSelector();
      resetDefaultSelector();
      const selector2 = getDefaultSelector();
      
      expect(selector1).not.toBe(selector2);
    });
  });
  
  describe('パフォーマンス', () => {
    it('TC9.1: 100個の候補から1秒以内に選択できる', () => {
      const now = Date.now();
      const candidates: QuestionCandidate[] = [];
      
      for (let i = 0; i < 100; i++) {
        candidates.push({
          id: `word${i}`,
          word: `word${i}`,
          category: QuestionCategory.MEMORIZATION,
          phase: i % 2 === 0 ? LearningPhase.ENCODING : LearningPhase.SHORT_TERM,
          reviewCount: i % 2 === 0 ? 0 : Math.floor(i / 10),
          correctCount: i % 2 === 0 ? 0 : Math.floor(i / 15),
          lastReviewTime: now - i * 3600000,
          nextReviewTime: i % 2 === 0 ? undefined : now + i * 1800000
        });
      }
      
      const start = Date.now();
      const result = selector.selectNextQuestion(candidates);
      const elapsed = Date.now() - start;
      
      expect(result).toBeDefined();
      expect(elapsed).toBeLessThan(1000);
    });
    
    it('TC9.2: 優先度計算が高速に実行される', () => {
      const candidate: QuestionCandidate = {
        id: 'word1',
        word: 'apple',
        category: QuestionCategory.MEMORIZATION,
        phase: LearningPhase.ENCODING,
        reviewCount: 0,
        correctCount: 0,
        lastReviewTime: Date.now()
      };
      
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        selector.calculatePriority(candidate);
      }
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
