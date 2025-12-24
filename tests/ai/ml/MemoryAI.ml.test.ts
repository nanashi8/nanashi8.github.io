/**
 * MemoryAI ML統合の簡易テスト
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MemoryAI } from '@/ai/specialists/MemoryAI';
import type { AIAnalysisInput, SessionStats, WordData } from '@/ai/types';
import type { WordProgress as StorageWordProgress } from '@/storage/progress/types';

function createSessionStats(overrides: Partial<SessionStats> = {}): SessionStats {
  return {
    totalAttempts: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    stillLearningAnswers: 0,
    sessionStartTime: Date.now(),
    sessionDuration: 0,
    consecutiveIncorrect: 0,
    masteredCount: 0,
    stillLearningCount: 0,
    incorrectCount: 0,
    newCount: 0,
    questionsAnswered: 0,
    currentAccuracy: 0,
    ...overrides,
  };
}

describe('MemoryAI ML Integration', () => {
  let memoryAI: MemoryAI;

  beforeAll(async () => {
    memoryAI = new MemoryAI();
    // ML機能は有効化しないでテスト（ルールベースのみ）
  });

  it('should initialize MemoryAI with ML capability', () => {
    expect(memoryAI.id).toBe('memory');
    expect(memoryAI.name).toBe('Memory AI');
    expect(memoryAI.icon).toBe('🧠');
  });

  it('should analyze using rules when ML is disabled', async () => {
    const testWord: WordData = {
      word: 'test',
      meaning: 'テスト',
    };

    const input: AIAnalysisInput = {
      word: testWord,
      progress: null,
      currentTab: 'memorization',
      sessionStats: createSessionStats(),
      allProgress: {},
    };

    const signal = await memoryAI.analyze(input);

    expect(signal.aiId).toBe('memory');
    expect(signal.confidence).toBeGreaterThan(0);
    expect(signal.forgettingRisk).toBeGreaterThanOrEqual(0);
  });

  it('should extract features correctly', () => {
    const testWord: WordData = {
      word: 'example',
      meaning: '例,サンプル',
    };

    const progress: StorageWordProgress = {
      word: 'example',
      correctCount: 7,
      incorrectCount: 3,
      consecutiveCorrect: 2,
      consecutiveIncorrect: 0,
      lastStudied: Date.now() - 86400000, // 1日前
      totalResponseTime: 0,
      averageResponseTime: 0,
      difficultyScore: 50,
      masteryLevel: 'learning',
      responseTimes: [],

      memorizationAttempts: 10,
      memorizationCorrect: 7,
      memorizationStillLearning: 0,
      memorizationStreak: 2,

      translationAttempts: 5,
      spellingAttempts: 3,

      reviewInterval: 1,
      easeFactor: 2.5,
      repetitions: 2,
    };

    const input: AIAnalysisInput = {
      word: testWord,
      progress,
      currentTab: 'memorization',
      sessionStats: createSessionStats({
        totalAttempts: 15,
        correctAnswers: 10,
        incorrectAnswers: 5,
        questionsAnswered: 15,
        currentAccuracy: 0.67,
        sessionStartTime: Date.now() - 300000,
        sessionDuration: 300000,
      }),
      allProgress: { example: progress },
    };

    // @ts-ignore - accessing protected method for testing
    const features = memoryAI.extractFeatures(input);

    expect(features).toHaveLength(15);
    expect(features[0]).toBeGreaterThan(0); // word length
    expect(features[3]).toBeGreaterThan(0); // accuracy
  });

  it('should validate signal correctly', () => {
    const validSignal = {
      aiId: 'memory' as const,
      confidence: 0.8,
      timestamp: Date.now(),
      forgettingRisk: 50,
      timeBoost: 0.3,
      category: 'still_learning' as const,
      retentionStrength: 0.7,
    };

    expect(memoryAI.validateSignal(validSignal)).toBe(true);
  });

  it('should reject invalid signal', () => {
    const invalidSignal = {
      aiId: 'wrong' as any,
      confidence: 1.5, // invalid
      timestamp: Date.now(),
      forgettingRisk: -10, // invalid
      timeBoost: 0.3,
      category: 'invalid' as any,
      retentionStrength: 0.7,
    };

    expect(memoryAI.validateSignal(invalidSignal)).toBe(false);
  });

  it('should get ML state', () => {
    const state = memoryAI.getMLState();

    expect(state).toHaveProperty('initialized');
    expect(state).toHaveProperty('ready');
    expect(state).toHaveProperty('trainingCount');
  });
});
