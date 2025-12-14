import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadCustomQuestionState,
  saveCustomQuestionState,
  createCustomQuestionSet,
  addWordToSet,
  isWordInSet,
  isWordInAnySets,
  getSetsContainingWord,
  getSetById,
  getAllUniqueWords,
  getSetStatistics,
} from '../../src/utils/customQuestionStorage';
// Unused in this test scope
// import { removeWordFromSet, deleteCustomQuestionSet, updateCustomQuestionSet } from '@/storage/customQuestionStorage';
import type { CustomQuestionState, CustomWord } from '../../src/types/customQuestions';

/**
 * customQuestionStorage.ts のユニットテスト
 *
 * テスト戦略: TDD推奨（100%カバレッジ目標）
 * - LocalStorage操作の完全モック
 * - エラーハンドリングの網羅的検証
 * - エッジケース（空配列、重複、存在しないID等）のテスト
 */

describe('customQuestionStorage', () => {
  // LocalStorageのモック
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    // 各テスト前にlocalStorageをクリーンアップ
    localStorageMock = {};

    // LocalStorageのモックを設定（vi.stubGlobalを使用）
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: Object.keys(localStorageMock).length,
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
    });

    // console.errorをモック（エラーログをテストで抑制）
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('loadCustomQuestionState', () => {
    it('LocalStorageにデータがない場合、初期状態を返す', () => {
      const result = loadCustomQuestionState();

      expect(result).toEqual({
        sets: [],
        activeSetId: null,
        recentSetIds: [],
      });
    });

    it('LocalStorageから正常にデータを読み込む', () => {
      const mockState: CustomQuestionState = {
        sets: [
          {
            id: 'set1',
            name: 'Test Set',
            words: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        activeSetId: 'set1',
        recentSetIds: ['set1'],
      };

      localStorageMock['customQuestionSets'] = JSON.stringify(mockState);

      const result = loadCustomQuestionState();

      expect(result).toEqual(mockState);
    });

    it('不正なJSONの場合、初期状態を返す', () => {
      localStorageMock['customQuestionSets'] = 'invalid json{';

      const result = loadCustomQuestionState();

      expect(result).toEqual({
        sets: [],
        activeSetId: null,
        recentSetIds: [],
      });
      expect(console.error).toHaveBeenCalled();
    });

    it('部分的なデータがある場合、デフォルト値で補完する', () => {
      localStorageMock['customQuestionSets'] = JSON.stringify({ sets: [] });

      const result = loadCustomQuestionState();

      expect(result).toEqual({
        sets: [],
        activeSetId: null,
        recentSetIds: [],
      });
    });
  });

  describe('saveCustomQuestionState', () => {
    it('状態をLocalStorageに正常に保存する', () => {
      const state: CustomQuestionState = {
        sets: [
          {
            id: 'set1',
            name: 'Test Set',
            words: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        activeSetId: 'set1',
        recentSetIds: ['set1'],
      };

      saveCustomQuestionState(state);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'customQuestionSets',
        JSON.stringify(state)
      );
      expect(localStorageMock['customQuestionSets']).toBe(JSON.stringify(state));
    });

    it('保存エラー時にconsole.errorを呼び出す', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const state: CustomQuestionState = {
        sets: [],
        activeSetId: null,
        recentSetIds: [],
      };

      saveCustomQuestionState(state);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save custom question state:',
        expect.any(Error)
      );
    });
  });

  describe('createCustomQuestionSet', () => {
    it('必須パラメータのみで新しいセットを作成する', () => {
      const name = 'My Vocabulary Set';
      const set = createCustomQuestionSet(name);

      expect(set).toMatchObject({
        id: expect.stringMatching(/^set_\d+_[a-z0-9]+$/),
        name: 'My Vocabulary Set',
        description: undefined,
        words: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        icon: undefined,
        color: undefined,
      });

      // createdAtとupdatedAtが同じ
      expect(set.createdAt).toBe(set.updatedAt);

      // ISO 8601フォーマット検証
      expect(new Date(set.createdAt).toISOString()).toBe(set.createdAt);
    });

    it('オプションパラメータを含めてセットを作成する', () => {
      const set = createCustomQuestionSet(
        'Business English',
        'Words for business meetings',
        '💼',
        '#3B82F6'
      );

      expect(set).toMatchObject({
        name: 'Business English',
        description: 'Words for business meetings',
        icon: '💼',
        color: '#3B82F6',
        words: [],
      });
    });

    it('ユニークなIDを生成する（複数回呼び出し）', () => {
      const set1 = createCustomQuestionSet('Set 1');
      const set2 = createCustomQuestionSet('Set 2');
      const set3 = createCustomQuestionSet('Set 3');

      // IDがすべて異なることを確認
      expect(set1.id).not.toBe(set2.id);
      expect(set2.id).not.toBe(set3.id);
      expect(set1.id).not.toBe(set3.id);
    });
  });

  describe('addWordToSet', () => {
    it('セットに新しい単語を追加する', () => {
      const state: CustomQuestionState = {
        sets: [
          {
            id: 'set1',
            name: 'Test Set',
            words: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        activeSetId: null,
        recentSetIds: [],
      };

      const word: CustomWord = {
        word: 'apple',
        meaning: 'りんご',
        ipa: 'ˈæp.əl',
        source: 'manual',
      };

      const result = addWordToSet(state, 'set1', word);

      expect(result.sets[0].words).toHaveLength(1);
      expect(result.sets[0].words[0]).toMatchObject({
        word: 'apple',
        meaning: 'りんご',
        ipa: 'ˈæp.əl',
        source: 'manual',
        addedAt: expect.any(String),
      });

      // updatedAtが更新されている
      expect(result.sets[0].updatedAt).not.toBe('2025-01-01T00:00:00.000Z');

      // recentSetIdsが更新されている
      expect(result.recentSetIds).toContain('set1');
    });

    it('重複する単語は追加しない', () => {
      const state: CustomQuestionState = {
        sets: [
          {
            id: 'set1',
            name: 'Test Set',
            words: [
              {
                word: 'apple',
                meaning: 'りんご',
                source: 'manual',
                addedAt: '2025-01-01T00:00:00.000Z',
              },
            ],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        activeSetId: null,
        recentSetIds: [],
      };

      const word: CustomWord = {
        word: 'apple',
        meaning: 'リンゴ', // 異なる意味でも同じ単語
        source: 'manual',
      };

      const result = addWordToSet(state, 'set1', word);

      // 単語数は変わらない
      expect(result.sets[0].words).toHaveLength(1);
      // 元の単語がそのまま
      expect(result.sets[0].words[0].meaning).toBe('りんご');
    });

    it('存在しないセットIDの場合、状態を変更しない', () => {
      const state: CustomQuestionState = {
        sets: [
          {
            id: 'set1',
            name: 'Test Set',
            words: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        activeSetId: null,
        recentSetIds: [],
      };

      const word: CustomWord = {
        word: 'apple',
        meaning: 'りんご',
        source: 'manual',
      };

      const result = addWordToSet(state, 'nonexistent', word);

      // 元の状態と同じ（単語は追加されない）
      expect(result.sets[0].words).toHaveLength(0);
    });

    it('複数のセットがある場合、指定されたセットのみ更新する', () => {
      const state: CustomQuestionState = {
        sets: [
          {
            id: 'set1',
            name: 'Set 1',
            words: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'set2',
            name: 'Set 2',
            words: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        activeSetId: null,
        recentSetIds: [],
      };

      const word: CustomWord = {
        word: 'apple',
        meaning: 'りんご',
        source: 'manual',
      };

      const result = addWordToSet(state, 'set2', word);

      expect(result.sets[0].words).toHaveLength(0); // set1は変更なし
      expect(result.sets[1].words).toHaveLength(1); // set2に追加
    });
  });

  describe('isWordInSet', () => {
    it('単語がセットに含まれている場合、trueを返す', () => {
      const set = {
        id: 'set1',
        name: 'Test Set',
        words: [
          { word: 'apple', meaning: 'りんご', source: 'manual' as const },
          { word: 'banana', meaning: 'バナナ', source: 'manual' as const },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(isWordInSet(set, 'apple')).toBe(true);
      expect(isWordInSet(set, 'banana')).toBe(true);
    });

    it('単語がセットに含まれていない場合、falseを返す', () => {
      const set = {
        id: 'set1',
        name: 'Test Set',
        words: [{ word: 'apple', meaning: 'りんご', source: 'manual' as const }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(isWordInSet(set, 'orange')).toBe(false);
    });

    it('空のセットの場合、falseを返す', () => {
      const set = {
        id: 'set1',
        name: 'Test Set',
        words: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(isWordInSet(set, 'apple')).toBe(false);
    });
  });

  describe('isWordInAnySets', () => {
    const sets = [
      {
        id: 'set1',
        name: 'Fruits',
        words: [{ word: 'apple', meaning: 'りんご', source: 'manual' as const }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'set2',
        name: 'Vegetables',
        words: [{ word: 'carrot', meaning: 'にんじん', source: 'manual' as const }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    it('いずれかのセットに含まれている場合、trueを返す', () => {
      expect(isWordInAnySets(sets, 'apple')).toBe(true);
      expect(isWordInAnySets(sets, 'carrot')).toBe(true);
    });

    it('どのセットにも含まれていない場合、falseを返す', () => {
      expect(isWordInAnySets(sets, 'orange')).toBe(false);
    });

    it('空の配列の場合、falseを返す', () => {
      expect(isWordInAnySets([], 'apple')).toBe(false);
    });
  });

  describe('getSetsContainingWord', () => {
    const sets = [
      {
        id: 'set1',
        name: 'Fruits',
        words: [
          { word: 'apple', meaning: 'りんご', source: 'manual' as const },
          { word: 'banana', meaning: 'バナナ', source: 'manual' as const },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'set2',
        name: 'Common Words',
        words: [
          { word: 'apple', meaning: 'りんご', source: 'manual' as const },
          { word: 'hello', meaning: 'こんにちは', source: 'manual' as const },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'set3',
        name: 'Vegetables',
        words: [{ word: 'carrot', meaning: 'にんじん', source: 'manual' as const }],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    it('単語を含む複数のセットを返す', () => {
      const result = getSetsContainingWord(sets, 'apple');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('set1');
      expect(result[1].id).toBe('set2');
    });

    it('単語を含むセットが1つの場合、そのセットのみを返す', () => {
      const result = getSetsContainingWord(sets, 'banana');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('set1');
    });

    it('単語を含むセットがない場合、空配列を返す', () => {
      const result = getSetsContainingWord(sets, 'orange');

      expect(result).toEqual([]);
    });
  });

  describe('getSetById', () => {
    const sets = [
      {
        id: 'set1',
        name: 'Test Set 1',
        words: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'set2',
        name: 'Test Set 2',
        words: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    it('指定されたIDのセットを返す', () => {
      const result = getSetById(sets, 'set1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('set1');
      expect(result?.name).toBe('Test Set 1');
    });

    it('存在しないIDの場合、undefinedを返す', () => {
      const result = getSetById(sets, 'nonexistent');

      expect(result).toBeUndefined();
    });

    it('空の配列の場合、undefinedを返す', () => {
      const result = getSetById([], 'set1');

      expect(result).toBeUndefined();
    });
  });

  describe('getAllUniqueWords', () => {
    const sets = [
      {
        id: 'set1',
        name: 'Set 1',
        words: [
          { word: 'apple', meaning: 'りんご', source: 'manual' as const },
          { word: 'banana', meaning: 'バナナ', source: 'manual' as const },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'set2',
        name: 'Set 2',
        words: [
          { word: 'apple', meaning: 'りんご', source: 'manual' as const },
          { word: 'carrot', meaning: 'にんじん', source: 'manual' as const },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    it('重複を除外してすべての単語を返す', () => {
      const result = getAllUniqueWords(sets);

      expect(result).toHaveLength(3);
      expect(result.map((w) => w.word)).toEqual(['apple', 'banana', 'carrot']);
    });

    it('空の配列の場合、空配列を返す', () => {
      const result = getAllUniqueWords([]);

      expect(result).toEqual([]);
    });

    it('すべてのセットが空の場合、空配列を返す', () => {
      const emptySets = [
        {
          id: 'set1',
          name: 'Empty Set',
          words: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const result = getAllUniqueWords(emptySets);

      expect(result).toEqual([]);
    });
  });

  describe('getSetStatistics', () => {
    it('セットの統計情報を正確に計算する', () => {
      const set = {
        id: 'set1',
        name: 'Test Set',
        words: [
          { word: 'apple', meaning: 'りんご', source: 'manual' as const },
          { word: 'banana', meaning: 'バナナ', source: 'quiz' as const },
          { word: 'carrot', meaning: 'にんじん', source: 'memorization' as const },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };

      const stats = getSetStatistics(set);

      expect(stats.totalWords).toBe(3);
      expect(stats.sources).toEqual({
        manual: 1,
        quiz: 1,
        memorization: 1,
      });
      expect(stats.hasIPA).toBe(0);
      expect(stats.hasKatakana).toBe(0);
      expect(stats.tags).toEqual({});
    });

    it('空のセットの統計情報を正確に計算する', () => {
      const set = {
        id: 'set1',
        name: 'Empty Set',
        words: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const stats = getSetStatistics(set);

      expect(stats.totalWords).toBe(0);
      expect(stats.sources).toEqual({});
      expect(stats.hasIPA).toBe(0);
      expect(stats.hasKatakana).toBe(0);
      expect(stats.tags).toEqual({});
    });

    it('同じソースの単語が複数ある場合、正確にカウントする', () => {
      const set = {
        id: 'set1',
        name: 'Test Set',
        words: [
          { word: 'apple', meaning: 'りんご', source: 'manual' as const },
          { word: 'banana', meaning: 'バナナ', source: 'manual' as const },
          { word: 'carrot', meaning: 'にんじん', source: 'manual' as const },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const stats = getSetStatistics(set);

      expect(stats.totalWords).toBe(3);
      expect(stats.sources.manual).toBe(3);
      expect(stats.sources.quiz).toBeUndefined(); // 存在しないsourceはundefined
    });
  });
});
