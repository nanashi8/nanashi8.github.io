/**
 * ContextRotationSystem統合テスト
 *
 * Phase 6: 多様な復習方法統合
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextRotationSystem, ReviewMethod, type Word } from '../../../src/ai/specialists/context/ContextRotationSystem';
import type { WordProgress } from '../../../src/storage/progress/types';

describe('ContextRotationSystem', () => {
  let system: ContextRotationSystem;
  let sampleWord: Word;
  let distractors: string[];

  beforeEach(() => {
    system = new ContextRotationSystem();
    sampleWord = {
      english: 'apple',
      japanese: 'りんご',
      exampleSentence: 'I eat an apple every day.',
      audioUrl: '/audio/apple.mp3',
      imageUrl: '/images/apple.jpg'
    };
    distractors = ['orange', 'banana', 'grape'];
  });

  describe('selectReviewMethod', () => {
    it('初回はRECOGNITIONを選択', () => {
      const progress: Partial<WordProgress> = {
        memorizationAttempts: 0,
        correctCount: 0
      };
      const method = system.selectReviewMethod(sampleWord, progress as WordProgress);
      expect(method).toBe(ReviewMethod.RECOGNITION);
    });

    it('2-3回目はRECALLを選択', () => {
      const progress: Partial<WordProgress> = {
        memorizationAttempts: 2,
        correctCount: 1
      };
      const method = system.selectReviewMethod(sampleWord, progress as WordProgress);
      expect(method).toBe(ReviewMethod.RECALL);
    });

    it('4-6回目で正答率70%以上ならSENTENCEを選択', () => {
      const progress: Partial<WordProgress> = {
        memorizationAttempts: 5,
        correctCount: 4 // 80%
      };
      const method = system.selectReviewMethod(sampleWord, progress as WordProgress);
      expect(method).toBe(ReviewMethod.SENTENCE);
    });

    it('4-6回目で正答率70%未満ならRECALLに戻す', () => {
      const progress: Partial<WordProgress> = {
        memorizationAttempts: 5,
        correctCount: 2 // 40%
      };
      const method = system.selectReviewMethod(sampleWord, progress as WordProgress);
      expect(method).toBe(ReviewMethod.RECALL);
    });

    it('7回以上はランダムメソッドを選択', () => {
      const progress: Partial<WordProgress> = {
        memorizationAttempts: 10,
        correctCount: 8
      };
      const method = system.selectReviewMethod(sampleWord, progress as WordProgress);
      expect([
        ReviewMethod.RECOGNITION,
        ReviewMethod.RECALL,
        ReviewMethod.SENTENCE,
        ReviewMethod.LISTENING,
        ReviewMethod.PRODUCTION
      ]).toContain(method);
    });
  });

  describe('generateQuestion', () => {
    it('RECOGNITIONの問題を生成', () => {
      const question = system.generateQuestion(
        sampleWord,
        ReviewMethod.RECOGNITION,
        distractors
      );

      expect(question.type).toBe(ReviewMethod.RECOGNITION);
      expect(question.prompt).toBe(sampleWord.english);
      expect(question.answer).toBe(sampleWord.japanese);
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(sampleWord.japanese);
    });

    it('RECALLの問題を生成', () => {
      const question = system.generateQuestion(
        sampleWord,
        ReviewMethod.RECALL,
        distractors
      );

      expect(question.type).toBe(ReviewMethod.RECALL);
      expect(question.prompt).toBe(sampleWord.japanese);
      expect(question.answer).toBe(sampleWord.english);
      expect(question.choices).toBeUndefined();
    });

    it('SENTENCEの問題を生成（例文あり）', () => {
      const question = system.generateQuestion(
        sampleWord,
        ReviewMethod.SENTENCE,
        distractors
      );

      expect(question.type).toBe(ReviewMethod.SENTENCE);
      expect(question.prompt).toContain('______');
      expect(question.answer).toBe(sampleWord.english);
    });

    it('SENTENCEの問題を生成（例文なし）', () => {
      const wordWithoutSentence: Word = {
        english: 'test',
        japanese: 'テスト'
      };
      const question = system.generateQuestion(
        wordWithoutSentence,
        ReviewMethod.SENTENCE,
        distractors
      );

      expect(question.type).toBe(ReviewMethod.SENTENCE);
      expect(question.prompt).toContain('______');
      expect(question.answer).toBe(wordWithoutSentence.english);
    });

    it('LISTENINGの問題を生成', () => {
      const question = system.generateQuestion(
        sampleWord,
        ReviewMethod.LISTENING,
        distractors
      );

      expect(question.type).toBe(ReviewMethod.LISTENING);
      expect(question.prompt).toBe('音声を聞いて、単語を入力してください');
      expect(question.answer).toBe(sampleWord.english);
      expect(question.audioUrl).toBe(sampleWord.audioUrl);
    });

    it('PRODUCTIONの問題を生成', () => {
      const question = system.generateQuestion(
        sampleWord,
        ReviewMethod.PRODUCTION,
        distractors
      );

      expect(question.type).toBe(ReviewMethod.PRODUCTION);
      expect(question.prompt).toContain('英語で表現してください');
      expect(question.answer).toBe(sampleWord.english);
      expect(question.imageUrl).toBe(sampleWord.imageUrl);
    });
  });

  describe('generateRecognitionQuestion', () => {
    it('4択問題を生成（日本語選択肢）', () => {
      const question = system['generateRecognitionQuestion'](
        sampleWord,
        distractors
      );

      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(sampleWord.japanese);
      expect(new Set(question.choices).size).toBe(4); // 重複なし
    });

    it('選択肢が不足時にダミーを追加', () => {
      const question = system['generateRecognitionQuestion'](
        sampleWord,
        ['orange'] // 1個のみ
      );

      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(sampleWord.japanese);
    });
  });

  describe('generateRecallQuestion', () => {
    it('日本語プロンプト、英語解答', () => {
      const question = system['generateRecallQuestion'](sampleWord);

      expect(question.prompt).toBe(sampleWord.japanese);
      expect(question.answer).toBe(sampleWord.english);
      expect(question.instruction).toContain('英語で入力');
    });
  });

  describe('generateSentenceQuestion', () => {
    it('例文から穴埋め問題を生成', () => {
      const question = system['generateSentenceQuestion'](sampleWord);

      expect(question.prompt).toContain('______');
      expect(question.prompt).toContain('I eat an');
      expect(question.answer).toBe(sampleWord.english);
    });

    it('例文がない場合、デフォルト例文を生成', () => {
      const wordWithoutSentence: Word = {
        english: 'test',
        japanese: 'テスト'
      };
      const question = system['generateSentenceQuestion'](wordWithoutSentence);

      expect(question.prompt).toContain('______');
      expect(question.answer).toBe(wordWithoutSentence.english);
    });
  });

  describe('selectRandomMethod', () => {
    it('正答率80%以上でLISTENING/PRODUCTIONを含む', () => {
      const methods = new Set<ReviewMethod>();

      // 100回試行して全メソッドが出現することを確認
      for (let i = 0; i < 100; i++) {
        const method = system['selectRandomMethod'](0.85);
        methods.add(method);
      }

      expect(methods.has(ReviewMethod.LISTENING) || methods.has(ReviewMethod.PRODUCTION)).toBe(true);
    });

    it('正答率80%未満でLISTENING/PRODUCTIONを除外', () => {
      const methods = new Set<ReviewMethod>();

      for (let i = 0; i < 50; i++) {
        const method = system['selectRandomMethod'](0.60);
        methods.add(method);
      }

      expect(methods.has(ReviewMethod.LISTENING)).toBe(false);
      expect(methods.has(ReviewMethod.PRODUCTION)).toBe(false);
    });
  });

  describe('generateDefaultSentence', () => {
    it('デフォルト例文を生成（名詞）', () => {
      const word: Word = { english: 'apple', japanese: 'りんご' };
      const sentence = system['generateDefaultSentence'](word);
      expect(sentence).toContain('apple');
      expect(sentence).toContain('______');
    });

    it('デフォルト例文を生成（動詞）', () => {
      const word: Word = { english: 'run', japanese: '走る' };
      const sentence = system['generateDefaultSentence'](word);
      expect(sentence).toContain('run');
      expect(sentence).toContain('______');
    });
  });

  describe('統合テスト', () => {
    it('学習進捗に応じた問題シーケンスを生成', () => {
      const progressStages: Partial<WordProgress>[] = [
        { memorizationAttempts: 0, correctCount: 0 },
        { memorizationAttempts: 2, correctCount: 2 },
        { memorizationAttempts: 5, correctCount: 4 },
        { memorizationAttempts: 10, correctCount: 9 }
      ];

      const expectedMethods = [
        ReviewMethod.RECOGNITION,
        ReviewMethod.RECALL,
        ReviewMethod.SENTENCE,
        // 7回以上はランダム（チェック省略）
      ];

      for (let i = 0; i < 3; i++) {
        const method = system.selectReviewMethod(
          sampleWord,
          progressStages[i] as WordProgress
        );
        expect(method).toBe(expectedMethods[i]);
      }
    });

    it('全メソッドタイプの問題生成', () => {
      const methods = [
        ReviewMethod.RECOGNITION,
        ReviewMethod.RECALL,
        ReviewMethod.SENTENCE,
        ReviewMethod.LISTENING,
        ReviewMethod.PRODUCTION
      ];

      for (const method of methods) {
        const question = system.generateQuestion(sampleWord, method, distractors);
        expect(question.type).toBe(method);
        expect(question.prompt).toBeDefined();
        expect(question.answer).toBe(sampleWord.english);
      }
    });
  });
});
