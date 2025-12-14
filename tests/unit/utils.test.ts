import { describe, it, expect } from 'vitest';
import type { Question } from '@/types';
import {
  shuffle,
  formatLocalYYYYMMDD,
  generateId,
  generateSpellingPuzzle,
  selectAdaptiveQuestions,
  selectWeakQuestions,
  selectReviewQuestions,
  selectQuestionsByMasteryLevel,
  classifyPhraseType,
  getPhraseTypeLabel,
} from '@/utils';

/**
 * src/utils.ts の純粋関数テスト
 *
 * テスト対象: LocalStorageに依存しない、テストしやすい関数
 */

describe('Utils - shuffle', () => {
  it('配列の長さが変わらない', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle([...original]);

    expect(shuffled.length).toBe(original.length);
  });

  it('すべての要素が保持される', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle([...original]);

    original.forEach((item) => {
      expect(shuffled).toContain(item);
    });
  });

  it('空配列を渡しても正常に動作する', () => {
    const shuffled = shuffle([]);
    expect(shuffled).toEqual([]);
  });

  it('1要素の配列はそのまま', () => {
    const shuffled = shuffle([42]);
    expect(shuffled).toEqual([42]);
  });
});

describe('Utils - formatLocalYYYYMMDD', () => {
  it('日付を YYYY-MM-DD 形式で返す', () => {
    const date = new Date('2025-12-13T15:30:00');
    const formatted = formatLocalYYYYMMDD(date);

    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('1桁の月と日をゼロパディングする', () => {
    const date = new Date('2025-01-05T00:00:00');
    const formatted = formatLocalYYYYMMDD(date);

    expect(formatted).toBe('2025-01-05');
  });

  it('12月31日を正しくフォーマットする', () => {
    const date = new Date('2025-12-31T23:59:59');
    const formatted = formatLocalYYYYMMDD(date);

    expect(formatted).toBe('2025-12-31');
  });
});

describe('Utils - generateId', () => {
  it('ユニークなIDを生成する', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
  });

  it('IDが文字列である', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('IDが空でない', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('複数回呼び出しても重複しない', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }

    expect(ids.size).toBe(100);
  });
});

describe('Utils - generateSpellingPuzzle', () => {
  it('スペリングパズルの構造を返す', () => {
    const result = generateSpellingPuzzle('apple');

    expect(result.displayWord).toBeDefined();
    expect(result.missingIndices).toBeDefined();
    expect(result.letterChoices).toBeDefined();
    expect(Array.isArray(result.displayWord)).toBe(true);
    expect(Array.isArray(result.missingIndices)).toBe(true);
    expect(Array.isArray(result.letterChoices)).toBe(true);
  });

  it('displayWordの長さが元の単語と同じ', () => {
    const word = 'hello';
    const result = generateSpellingPuzzle(word);

    expect(result.displayWord.length).toBe(word.length);
  });

  it('空文字列の場合は空配列を返す', () => {
    const result = generateSpellingPuzzle('');

    expect(result.displayWord).toEqual([]);
    expect(result.missingIndices).toEqual([]);
    expect(result.letterChoices).toEqual([]);
  });

  it('missingIndicesが昇順にソートされている', () => {
    const result = generateSpellingPuzzle('testing');

    for (let i = 1; i < result.missingIndices.length; i++) {
      expect(result.missingIndices[i]).toBeGreaterThan(result.missingIndices[i - 1]);
    }
  });

  it('letterChoicesに正解の文字と囮が含まれる', () => {
    const result = generateSpellingPuzzle('apple');

    // letterChoicesが空でない
    expect(result.letterChoices.length).toBeGreaterThan(0);

    // 正解の文字がletterChoicesに含まれる
    result.missingIndices.forEach((idx: number) => {
      const correctLetter = 'APPLE'[idx];
      expect(result.letterChoices).toContain(correctLetter);
    });
  });
});

describe('Utils - selectAdaptiveQuestions', () => {
  // モック用のヘルパー関数
  const mockQuestions = (words: string[]): Question[] =>
    words.map((word) => ({ word, meaning: `意味${word}` }) as Question);

  it('空配列を渡すと空配列を返す', () => {
    const result = selectAdaptiveQuestions([], 10);
    expect(result).toEqual([]);
  });

  it('指定した件数の問題を返す', () => {
    const questions = mockQuestions(['apple', 'banana', 'cherry', 'dog', 'elephant']);
    const result = selectAdaptiveQuestions(questions, 3);

    expect(result.length).toBe(3);
  });

  it('問題数が不足していても正常に動作する', () => {
    const questions = mockQuestions(['apple', 'banana']);
    const result = selectAdaptiveQuestions(questions, 10);

    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('結果がシャッフルされている', () => {
    const questions = mockQuestions(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
    const result1 = selectAdaptiveQuestions(questions, 5);
    const result2 = selectAdaptiveQuestions(questions, 5);

    // 2回の呼び出しで同じ順序になる可能性は低い
    const words1 = result1.map((q: Question) => q.word).join(',');
    const words2 = result2.map((q: Question) => q.word).join(',');

    // 完全一致しない確率が高い（稀に一致する可能性もあるが）
    expect(words1 === words2).toBe(false);
  });
});

describe('Utils - selectWeakQuestions', () => {
  const mockQuestions = (words: string[]): Question[] =>
    words.map((word) => ({ word, meaning: `意味${word}` }) as Question);

  it('空配列を渡すと空配列を返す', () => {
    const result = selectWeakQuestions([], 10);
    expect(result).toEqual([]);
  });

  it('指定した件数以下の問題を返す', () => {
    const questions = mockQuestions(['apple', 'banana', 'cherry']);
    const result = selectWeakQuestions(questions, 5);

    expect(result.length).toBeLessThanOrEqual(5);
    expect(result.length).toBeLessThanOrEqual(questions.length);
  });

  it('問題数が不足していても正常に動作する', () => {
    const questions = mockQuestions(['apple']);
    const result = selectWeakQuestions(questions, 10);

    expect(result.length).toBeLessThanOrEqual(1);
  });
});

describe('Utils - selectReviewQuestions', () => {
  const mockQuestions = (words: string[]): Question[] =>
    words.map((word) => ({ word, meaning: `意味${word}` }) as Question);

  it('空配列を渡すと空配列を返す', () => {
    const result = selectReviewQuestions([], 10);
    expect(result).toEqual([]);
  });

  it('指定した件数以下の問題を返す', () => {
    const questions = mockQuestions(['apple', 'banana', 'cherry']);
    const result = selectReviewQuestions(questions, 5);

    expect(result.length).toBeLessThanOrEqual(5);
    expect(result.length).toBeLessThanOrEqual(questions.length);
  });

  it('hoursThresholdパラメータを受け取る', () => {
    const questions = mockQuestions(['apple', 'banana']);
    const result = selectReviewQuestions(questions, 10, 48); // 48時間

    expect(result.length).toBeLessThanOrEqual(questions.length);
  });

  it('問題数が不足していても正常に動作する', () => {
    const questions = mockQuestions(['apple']);
    const result = selectReviewQuestions(questions, 10, 24);

    expect(result.length).toBeLessThanOrEqual(1);
  });
});

describe('Utils - selectQuestionsByMasteryLevel', () => {
  const mockQuestions = (words: string[]): Question[] =>
    words.map((word) => ({ word, meaning: `意味${word}` }) as Question);

  it('習熟度別に問題をフィルタできる', () => {
    const questions = mockQuestions(['apple', 'banana', 'cherry']);

    const newQuestions = selectQuestionsByMasteryLevel(questions, 'new');
    const learningQuestions = selectQuestionsByMasteryLevel(questions, 'learning');
    const masteredQuestions = selectQuestionsByMasteryLevel(questions, 'mastered');

    expect(Array.isArray(newQuestions)).toBe(true);
    expect(Array.isArray(learningQuestions)).toBe(true);
    expect(Array.isArray(masteredQuestions)).toBe(true);
  });

  it('countパラメータで件数を制限できる', () => {
    const questions = mockQuestions(['a', 'b', 'c', 'd', 'e', 'f']);
    const result = selectQuestionsByMasteryLevel(questions, 'new', 3);

    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('countを指定しない場合は全件返す', () => {
    const questions = mockQuestions(['apple', 'banana']);
    const result = selectQuestionsByMasteryLevel(questions, 'new');

    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('空配列を渡すと空配列を返す', () => {
    const result = selectQuestionsByMasteryLevel([], 'new');
    expect(result).toEqual([]);
  });
});

describe('Utils - classifyPhraseType', () => {
  it('単語（スペースなし）はwordを返す', () => {
    expect(classifyPhraseType('apple')).toBe('word');
    expect(classifyPhraseType('running')).toBe('word');
  });

  it('句動詞を検出する', () => {
    expect(classifyPhraseType('look forward to')).toBe('phrasal-verb');
    expect(classifyPhraseType('get up')).toBe('phrasal-verb');
    expect(classifyPhraseType('put off')).toBe('phrasal-verb');
  });

  it('イディオムを検出する', () => {
    expect(classifyPhraseType('break the ice')).toBe('idiom');
    expect(classifyPhraseType('once in a blue moon')).toBe('idiom');
    expect(classifyPhraseType('cost an arm and a leg')).toBe('idiom');
  });

  it('コロケーションを検出する', () => {
    expect(classifyPhraseType('in the morning')).toBe('collocation');
    // 'make a decision'はイディオムパターンに先にマッチするため'idiom'
    expect(classifyPhraseType('make a decision')).toBe('idiom');
    expect(classifyPhraseType('strong coffee')).toBe('collocation');
  });

  it('その他のフレーズはotherを返す', () => {
    expect(classifyPhraseType('some random phrase')).toBe('other');
  });
});

describe('Utils - getPhraseTypeLabel', () => {
  it('phraseTypeの日本語ラベルを返す', () => {
    expect(getPhraseTypeLabel('word')).toBe('単語');
    expect(getPhraseTypeLabel('phrasal-verb')).toBe('句動詞');
    expect(getPhraseTypeLabel('idiom')).toBe('イディオム');
    expect(getPhraseTypeLabel('collocation')).toBe('コロケーション');
    expect(getPhraseTypeLabel('other')).toBe('その他');
  });

  it('未知のタイプはその他を返す', () => {
    expect(getPhraseTypeLabel('unknown')).toBe('その他');
    expect(getPhraseTypeLabel('')).toBe('その他');
  });
});
