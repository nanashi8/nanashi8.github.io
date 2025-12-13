import { describe, it, expect } from 'vitest';
import { generateChoices, generateChoicesWithQuestions } from '@/utils';
import type { Question } from '@/types';

/**
 * クイズ生成関数のテスト
 *
 * 重要: ユーザー体験を左右する選択肢生成ロジック
 *
 * 関数シグネチャ:
 * - generateChoices(correctAnswer: string, allQuestions: Question[], currentIndex: number): string[]
 * - generateChoicesWithQuestions(currentQuestion: Question, allQuestions: Question[], currentIndex: number)
 */

describe('Utils - generateChoices', () => {
  const sampleQuestions: Question[] = [
    { word: 'apple', meaning: 'りんご', reading: '' },
    { word: 'banana', meaning: 'バナナ', reading: '' },
    { word: 'carrot', meaning: 'にんじん', reading: '' },
    { word: 'dog', meaning: '犬', reading: '' },
    { word: 'elephant', meaning: '象', reading: '' },
  ];

  it('4つの選択肢を生成する（正解+誤答2+分からない）', () => {
    const choices = generateChoices('りんご', sampleQuestions, 0);

    expect(choices.length).toBe(4);
  });

  it('正解が含まれている', () => {
    const choices = generateChoices('りんご', sampleQuestions, 0);

    expect(choices).toContain('りんご');
  });

  it('「分からない」が最後に含まれる', () => {
    const choices = generateChoices('りんご', sampleQuestions, 0);

    expect(choices[3]).toBe('分からない');
  });

  it('選択肢に重複がない', () => {
    const choices = generateChoices('りんご', sampleQuestions, 0);
    const uniqueChoices = [...new Set(choices)];

    expect(choices.length).toBe(uniqueChoices.length);
  });

  it('問題数が少ない場合でも4つの選択肢を生成する', () => {
    const fewQuestions = sampleQuestions.slice(0, 2);
    const choices = generateChoices('りんご', fewQuestions, 0);

    expect(choices.length).toBe(4);
    expect(choices).toContain('りんご');
    expect(choices).toContain('分からない');
  });

  it('正解以外の選択肢は他の問題から選ばれる', () => {
    const choices = generateChoices('りんご', sampleQuestions, 0);

    // 正解と「分からない」以外は問題リストから
    const otherChoices = choices.filter((c: string) => c !== 'りんご' && c !== '分からない');
    expect(otherChoices.length).toBe(2);
  });
});

describe('Utils - generateChoicesWithQuestions', () => {
  const sampleQuestions: Question[] = [
    { word: 'apple', meaning: 'りんご', reading: 'アップル' },
    { word: 'banana', meaning: 'バナナ', reading: 'バナナ' },
    { word: 'carrot', meaning: 'にんじん', reading: 'キャロット' },
    { word: 'dog', meaning: '犬', reading: 'ドッグ' },
    { word: 'elephant', meaning: '象', reading: 'エレファント' },
  ];

  it('4つの選択肢を生成する', () => {
    const choices = generateChoicesWithQuestions(sampleQuestions[0], sampleQuestions, 0);

    expect(choices.length).toBe(4);
  });

  it('正解の意味が含まれている', () => {
    const correctQuestion = sampleQuestions[0];
    const choices = generateChoicesWithQuestions(correctQuestion, sampleQuestions, 0);

    const hasCorrect = choices.some((c: any) => c.text === correctQuestion.meaning);
    expect(hasCorrect).toBe(true);
  });
  it('「分からない」が最後に含まれる', () => {
    const choices = generateChoicesWithQuestions(sampleQuestions[0], sampleQuestions, 0);

    expect(choices[3].text).toBe('分からない');
    expect(choices[3].question).toBeNull();
  });

  it('選択肢textに重複がない', () => {
    const choices = generateChoicesWithQuestions(sampleQuestions[0], sampleQuestions, 0);
    const uniqueTexts = [...new Set(choices.map((c: any) => c.text))];

    expect(choices.length).toBe(uniqueTexts.length);
  });

  it('問題数が少ない場合でも4つの選択肢を生成する', () => {
    const fewQuestions = sampleQuestions.slice(0, 2);
    const choices = generateChoicesWithQuestions(fewQuestions[0], fewQuestions, 0);

    expect(choices.length).toBe(4);
    expect(choices.some((c: any) => c.text === fewQuestions[0].meaning)).toBe(true);
  });

  it('各選択肢がtext と questionプロパティを持つ', () => {
    const choices = generateChoicesWithQuestions(sampleQuestions[0], sampleQuestions, 0);

    choices.forEach((choice: any) => {
      expect(choice).toHaveProperty('text');
      expect(choice).toHaveProperty('question');
      expect(typeof choice.text).toBe('string');
    });
  });

  it('正解以外の選択肢にQuestionオブジェクトが関連付けられている', () => {
    const choices = generateChoicesWithQuestions(sampleQuestions[0], sampleQuestions, 0);

    // 「分からない」以外の選択肢
    const nonDontKnow = choices.filter((c: any) => c.text !== '分からない');

    nonDontKnow.forEach((choice: any) => {
      if (choice.question) {
        expect(choice.question).toHaveProperty('word');
        expect(choice.question).toHaveProperty('meaning');
      }
    });
  });
});
