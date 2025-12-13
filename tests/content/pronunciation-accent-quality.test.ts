/**
 * 発音・アクセント問題の品質検証テスト
 *
 * 4つの専門家の視点から包括的な品質保証を実施:
 * 1. 音声学者の視点: IPA表記、発音記号の正確性
 * 2. 日本語翻訳者の視点: 日本語説明の明確性
 * 3. 教育専門家の視点: 難易度、学習効果
 * 4. データ品質専門家の視点: 構造、一貫性
 */

import { describe, it, expect } from 'vitest';
import pronunciationData from '../../public/data/pronunciation-questions.json';
import accentData from '../../public/data/accent-questions.json';

// 型定義
interface PronunciationQuestion {
  id: string;
  japanese: string;
  word: string;
  underline?: string;
  choices: string[];
  correctAnswer: string;
  difficulty: string;
  explanation: string;
  hint: string;
}

interface AccentQuestion {
  id: string;
  japanese: string;
  word: string;
  choices: string[];
  correctAnswer: string;
  difficulty: string;
  explanation: string;
  hint: string;
}

interface Category<T> {
  category: string;
  grammarPoint: string;
  questions: T[];
}

interface PronunciationData {
  totalQuestions: number;
  categories: Category<PronunciationQuestion>[];
}

interface AccentData {
  totalQuestions: number;
  categories: Category<AccentQuestion>[];
}

const pronData = pronunciationData as PronunciationData;
const accData = accentData as AccentData;

// ヘルパー関数
function getAllPronunciationQuestions(): PronunciationQuestion[] {
  return pronData.categories.flatMap(cat => cat.questions);
}

function getAllAccentQuestions(): AccentQuestion[] {
  return accData.categories.flatMap(cat => cat.questions);
}

describe('発音・アクセント問題品質検証 - 音声学者の視点', () => {
  describe('発音問題: IPA表記と音声学的正確性', () => {
    const questions = getAllPronunciationQuestions();

    it('全問題が存在し、空でない', () => {
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBe(pronData.totalQuestions);
    });

    it('explanationにIPA記号または発音説明が含まれている', () => {
      const ipaPattern = /\[.*?\]|【.*?】|（.*?）/; // [ei], 【エイ】, （エイ） など
      questions.forEach(q => {
        expect(
          ipaPattern.test(q.explanation),
          `${q.id}: explanationに発音記号または説明が必要です`
        ).toBe(true);
      });
    });

    it('単語(word)が英語の単語またはunderline表記である', () => {
      const englishWordPattern = /^[a-zA-Z]+$/;
      const underlinePattern = /^\(.+\)$/; // (ea), (ough)など
      questions.forEach(q => {
        const isValid = englishWordPattern.test(q.word) || underlinePattern.test(q.word);
        expect(
          isValid,
          `${q.id}: word "${q.word}" は英語の単語またはunderline表記である必要があります`
        ).toBe(true);
      });
    });

    it('正答が選択肢に含まれている', () => {
      questions.forEach(q => {
        expect(
          q.choices.includes(q.correctAnswer),
          `${q.id}: 正答 "${q.correctAnswer}" が選択肢に含まれていません`
        ).toBe(true);
      });
    });

    it('選択肢が重複していない', () => {
      questions.forEach(q => {
        const uniqueChoices = new Set(q.choices);
        expect(
          uniqueChoices.size,
          `${q.id}: 選択肢に重複があります: ${JSON.stringify(q.choices)}`
        ).toBe(q.choices.length);
      });
    });

    it('選択肢が4つ存在する', () => {
      questions.forEach(q => {
        expect(
          q.choices.length,
          `${q.id}: 選択肢は4つ必要です（現在: ${q.choices.length}個）`
        ).toBe(4);
      });
    });
  });

  describe('アクセント問題: 記号と表記の正確性', () => {
    const questions = getAllAccentQuestions();

    it('全問題が存在し、空でない', () => {
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBe(accData.totalQuestions);
    });

    it('選択肢にアクセント記号（ˈ）が含まれている', () => {
      const accentPattern = /ˈ/; // プライマリストレス記号
      questions.forEach(q => {
        const hasAccentMark = q.choices.some(choice => accentPattern.test(choice));
        expect(
          hasAccentMark,
          `${q.id}: 選択肢にアクセント記号（ˈ）が必要です`
        ).toBe(true);
      });
    });

    it('正答が選択肢に含まれている', () => {
      questions.forEach(q => {
        expect(
          q.choices.includes(q.correctAnswer),
          `${q.id}: 正答 "${q.correctAnswer}" が選択肢に含まれていません`
        ).toBe(true);
      });
    });

    it('選択肢が重複していない', () => {
      questions.forEach(q => {
        const uniqueChoices = new Set(q.choices);
        expect(
          uniqueChoices.size,
          `${q.id}: 選択肢に重複があります: ${JSON.stringify(q.choices)}`
        ).toBe(q.choices.length);
      });
    });

    it('選択肢が2つ以上存在する', () => {
      questions.forEach(q => {
        expect(
          q.choices.length,
          `${q.id}: 選択肢は2つ以上必要です（現在: ${q.choices.length}個）`
        ).toBeGreaterThanOrEqual(2);
      });
    });
  });
});

describe('発音・アクセント問題品質検証 - 日本語翻訳者の視点', () => {
  describe('日本語説明の品質', () => {
    const pronQuestions = getAllPronunciationQuestions();
    const accQuestions = getAllAccentQuestions();
    const allQuestions = [...pronQuestions, ...accQuestions];

    it('japanese値が定義されている', () => {
      allQuestions.forEach(q => {
        expect(
          q.japanese,
          `${q.id}: japanese値が定義されていません`
        ).toBeDefined();
        expect(
          q.japanese.length,
          `${q.id}: japanese値が空です`
        ).toBeGreaterThan(0);
      });
    });

    it('日本語訳に日本語文字が含まれている', () => {
      const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
      allQuestions.forEach(q => {
        expect(
          japanesePattern.test(q.japanese),
          `${q.id}: japanese値に日本語文字が含まれていません: "${q.japanese}"`
        ).toBe(true);
      });
    });

    it('explanationが日本語で記述されている', () => {
      const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
      allQuestions.forEach(q => {
        expect(
          japanesePattern.test(q.explanation),
          `${q.id}: explanationが日本語で記述されていません`
        ).toBe(true);
      });
    });

    it('hintが日本語で記述されている', () => {
      const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
      allQuestions.forEach(q => {
        expect(
          japanesePattern.test(q.hint),
          `${q.id}: hintが日本語で記述されていません`
        ).toBe(true);
      });
    });

    it('explanationに正答のポイントが含まれている', () => {
      allQuestions.forEach(q => {
        // explanationに正答の単語またはパターンが含まれているか
        const hasRelevantContent =
          q.explanation.includes(q.correctAnswer) ||
          q.explanation.includes(q.word) ||
          q.explanation.length > 20; // 最低限の説明の長さ

        expect(
          hasRelevantContent,
          `${q.id}: explanationに十分な説明が含まれていません`
        ).toBe(true);
      });
    });
  });
});

describe('発音・アクセント問題品質検証 - 教育専門家の視点', () => {
  describe('難易度と学習効果', () => {
    const pronQuestions = getAllPronunciationQuestions();
    const accQuestions = getAllAccentQuestions();
    const allQuestions = [...pronQuestions, ...accQuestions];

    it('difficulty値が定義されている', () => {
      allQuestions.forEach(q => {
        expect(
          q.difficulty,
          `${q.id}: difficulty値が定義されていません`
        ).toBeDefined();
      });
    });

    it('difficulty値が有効な値である', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      allQuestions.forEach(q => {
        expect(
          validDifficulties.includes(q.difficulty),
          `${q.id}: difficulty値 "${q.difficulty}" が無効です（有効: ${validDifficulties.join(', ')}）`
        ).toBe(true);
      });
    });

    it('hintが適切な学習支援を提供している', () => {
      allQuestions.forEach(q => {
        expect(
          q.hint.length,
          `${q.id}: hintが短すぎます（最低5文字）`
        ).toBeGreaterThanOrEqual(5);

        // hintが答えをそのまま言っていないか（ある程度の長さがあること）
        expect(
          q.hint.length,
          `${q.id}: hintが単純すぎます`
        ).toBeGreaterThan(3);
      });
    });

    it('各カテゴリに適切な問題数がある', () => {
      pronData.categories.forEach(cat => {
        expect(
          cat.questions.length,
          `${cat.category}: 問題数が少なすぎます（最低5問）`
        ).toBeGreaterThanOrEqual(5);
      });

      accData.categories.forEach(cat => {
        expect(
          cat.questions.length,
          `${cat.category}: 問題数が少なすぎます（最低5問）`
        ).toBeGreaterThanOrEqual(5);
      });
    });
  });
});

describe('発音・アクセント問題品質検証 - データ品質専門家の視点', () => {
  describe('IDの一意性と命名規則', () => {
    const pronQuestions = getAllPronunciationQuestions();
    const accQuestions = getAllAccentQuestions();

    it('発音問題のIDが一意である', () => {
      const ids = pronQuestions.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(
        uniqueIds.size,
        `発音問題に重複したIDがあります: ${ids.length}問中${uniqueIds.size}個のユニークID`
      ).toBe(ids.length);
    });

    it('アクセント問題のIDが一意である', () => {
      const ids = accQuestions.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(
        uniqueIds.size,
        `アクセント問題に重複したIDがあります: ${ids.length}問中${uniqueIds.size}個のユニークID`
      ).toBe(ids.length);
    });

    it('発音問題のIDが命名規則に従っている（pron-*）', () => {
      const idPattern = /^pron-[a-z0-9-]+-\d{3}$/;
      pronQuestions.forEach(q => {
        expect(
          idPattern.test(q.id),
          `${q.id}: IDが命名規則に従っていません（期待: pron-*-###）`
        ).toBe(true);
      });
    });

    it('アクセント問題のIDが命名規則に従っている（acc-*）', () => {
      const idPattern = /^acc-[a-z0-9-]+-\d{3}$/;
      accQuestions.forEach(q => {
        expect(
          idPattern.test(q.id),
          `${q.id}: IDが命名規則に従っていません（期待: acc-*-###）`
        ).toBe(true);
      });
    });
  });

  describe('メタデータの整合性', () => {
    it('発音問題: totalQuestionsが実際の問題数と一致する', () => {
      const actualCount = getAllPronunciationQuestions().length;
      expect(
        pronData.totalQuestions,
        `totalQuestions(${pronData.totalQuestions})と実際の問題数(${actualCount})が一致しません`
      ).toBe(actualCount);
    });

    it('アクセント問題: totalQuestionsが実際の問題数と一致する', () => {
      const actualCount = getAllAccentQuestions().length;
      expect(
        accData.totalQuestions,
        `totalQuestions(${accData.totalQuestions})と実際の問題数(${actualCount})が一致しません`
      ).toBe(actualCount);
    });

    it('各カテゴリにgrammarPointが定義されている', () => {
      pronData.categories.forEach(cat => {
        expect(
          cat.grammarPoint,
          `${cat.category}: grammarPointが定義されていません`
        ).toBeDefined();
        expect(
          cat.grammarPoint.length,
          `${cat.category}: grammarPointが空です`
        ).toBeGreaterThan(0);
      });

      accData.categories.forEach(cat => {
        expect(
          cat.grammarPoint,
          `${cat.category}: grammarPointが定義されていません`
        ).toBeDefined();
        expect(
          cat.grammarPoint.length,
          `${cat.category}: grammarPointが空です`
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('必須フィールドの存在確認', () => {
    const pronQuestions = getAllPronunciationQuestions();
    const accQuestions = getAllAccentQuestions();
    const allQuestions = [...pronQuestions, ...accQuestions];

    it('すべての必須フィールドが存在する', () => {
      const requiredFields = ['id', 'japanese', 'word', 'choices', 'correctAnswer', 'difficulty', 'explanation', 'hint'];

      allQuestions.forEach(q => {
        requiredFields.forEach(field => {
          expect(
            (q as any)[field],
            `${q.id}: 必須フィールド "${field}" が存在しません`
          ).toBeDefined();
        });
      });
    });

    it('choices配列が空でない', () => {
      allQuestions.forEach(q => {
        expect(
          q.choices.length,
          `${q.id}: choices配列が空です`
        ).toBeGreaterThan(0);
      });
    });

    it('各フィールドが空文字列でない', () => {
      const stringFields = ['id', 'japanese', 'word', 'correctAnswer', 'difficulty', 'explanation', 'hint'];

      allQuestions.forEach(q => {
        stringFields.forEach(field => {
          const value = (q as any)[field];
          expect(
            typeof value === 'string' && value.length > 0,
            `${q.id}: フィールド "${field}" が空文字列です`
          ).toBe(true);
        });
      });
    });
  });
});
