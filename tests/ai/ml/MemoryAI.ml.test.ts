/**
 * MemoryAI ML統合の簡易テスト
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MemoryAI } from '@/ai/specialists/MemoryAI';
import type { AIAnalysisInput } from '@/ai/types';
import type { Question } from '@/types';

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
    const testWord: Question = {
      word: 'test',
      meaning: 'テスト',
      questionType: 'memorization',
    };

    const input: AIAnalysisInput = {
      word: testWord,
      progress: null,
      currentTab: 'memorization',
      sessionStats: {
        questionsAnswered: 0,
        correctAnswers: 0,
        currentAccuracy: 0,
        sessionDuration: 0,
        startTime: Date.now(),
      },
      cognitiveLoad: 0.5,
    };

    const signal = await memoryAI.analyze(input);

    expect(signal.aiId).toBe('memory');
    expect(signal.confidence).toBeGreaterThan(0);
    expect(signal.forgettingRisk).toBeGreaterThanOrEqual(0);
  });

  it('should extract features correctly', () => {
    const testWord: Question = {
      word: 'example',
      meaning: '例,サンプル',
      questionType: 'memorization',
    };

    const input: AIAnalysisInput = {
      word: testWord,
      progress: {
        word: 'example',
        memorizationAttempts: {
          totalAttempts: 10,
          correctCount: 7,
          wrongCount: 3,
          consecutiveCorrect: 2,
          consecutiveWrong: 0,
          lastAttemptCorrect: true,
        },
        translationAttempts: {
          totalAttempts: 5,
          correctCount: 4,
          wrongCount: 1,
          consecutiveCorrect: 1,
          consecutiveWrong: 0,
          lastAttemptCorrect: true,
        },
        spellingAttempts: {
          totalAttempts: 3,
          correctCount: 2,
          wrongCount: 1,
          consecutiveCorrect: 1,
          consecutiveWrong: 0,
          lastAttemptCorrect: true,
        },
        lastStudied: Date.now() - 86400000, // 1日前
        reviewInterval: 1,
        easeFactor: 2.5,
        repetitions: 2,
      },
      currentTab: 'memorization',
      sessionStats: {
        questionsAnswered: 15,
        correctAnswers: 10,
        currentAccuracy: 0.67,
        sessionDuration: 300,
        startTime: Date.now() - 300000,
      },
      cognitiveLoad: 0.6,
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
