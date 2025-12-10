import type { CustomQuestionSet, CustomQuestionState, CustomWord } from '../types/customQuestions';

const STORAGE_KEY = 'customQuestionSets';

/**
 * LocalStorageからカスタム問題セットの状態を読み込む
 */
export function loadCustomQuestionState(): CustomQuestionState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        sets: parsed.sets || [],
        activeSetId: parsed.activeSetId || null,
        recentSetIds: parsed.recentSetIds || [],
      };
    }
  } catch (error) {
    console.error('Failed to load custom question state:', error);
  }
  
  return {
    sets: [],
    activeSetId: null,
    recentSetIds: [],
  };
}

/**
 * カスタム問題セットの状態をLocalStorageに保存
 */
export function saveCustomQuestionState(state: CustomQuestionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save custom question state:', error);
  }
}

/**
 * 新しいカスタム問題セットを作成
 */
export function createCustomQuestionSet(
  name: string,
  description?: string,
  icon?: string,
  color?: string
): CustomQuestionSet {
  const now = new Date().toISOString();
  return {
    id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    words: [],
    createdAt: now,
    updatedAt: now,
    icon,
    color,
  };
}

/**
 * セットに単語を追加
 */
export function addWordToSet(
  state: CustomQuestionState,
  setId: string,
  word: CustomWord
): CustomQuestionState {
  const sets = state.sets.map((set) => {
    if (set.id !== setId) return set;
    
    // 既に存在する場合は追加しない
    if (set.words.some((w) => w.word === word.word)) {
      return set;
    }
    
    return {
      ...set,
      words: [...set.words, { ...word, addedAt: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    };
  });
  
  return {
    ...state,
    sets,
    recentSetIds: updateRecentSetIds(state.recentSetIds, setId),
  };
}

/**
 * セットから単語を削除
 */
export function removeWordFromSet(
  state: CustomQuestionState,
  setId: string,
  word: CustomWord
): CustomQuestionState {
  const sets = state.sets.map((set) => {
    if (set.id !== setId) return set;
    
    return {
      ...set,
      words: set.words.filter((w) => w.word !== word.word),
      updatedAt: new Date().toISOString(),
    };
  });
  
  return { ...state, sets };
}

/**
 * セットを削除
 */
export function deleteCustomQuestionSet(
  state: CustomQuestionState,
  setId: string
): CustomQuestionState {
  return {
    ...state,
    sets: state.sets.filter((set) => set.id !== setId),
    activeSetId: state.activeSetId === setId ? null : state.activeSetId,
    recentSetIds: state.recentSetIds.filter((id) => id !== setId),
  };
}

/**
 * セット情報を更新
 */
export function updateCustomQuestionSet(
  state: CustomQuestionState,
  setId: string,
  updates: Partial<Pick<CustomQuestionSet, 'name' | 'description' | 'icon' | 'color'>>
): CustomQuestionState {
  const sets = state.sets.map((set) => {
    if (set.id !== setId) return set;
    
    return {
      ...set,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  });
  
  return { ...state, sets };
}

/**
 * 最近使用したセットIDリストを更新（最大5件）
 */
function updateRecentSetIds(recentSetIds: string[], setId: string): string[] {
  const filtered = recentSetIds.filter((id) => id !== setId);
  const updated = [setId, ...filtered];
  return updated.slice(0, 5);
}

/**
 * 単語が特定のセットに含まれているか確認
 */
export function isWordInSet(set: CustomQuestionSet, word: string): boolean {
  return set.words.some((w) => w.word === word);
}

/**
 * 単語がいずれかのセットに含まれているか確認
 */
export function isWordInAnySets(sets: CustomQuestionSet[], word: string): boolean {
  return sets.some((set) => isWordInSet(set, word));
}

/**
 * 単語を含むすべてのセットを取得
 */
export function getSetsContainingWord(sets: CustomQuestionSet[], word: string): CustomQuestionSet[] {
  return sets.filter((set) => isWordInSet(set, word));
}

/**
 * セットIDでセットを取得
 */
export function getSetById(sets: CustomQuestionSet[], setId: string): CustomQuestionSet | undefined {
  return sets.find((set) => set.id === setId);
}

/**
 * すべてのセットの単語を結合して取得（重複なし）
 */
export function getAllUniqueWords(sets: CustomQuestionSet[]): CustomWord[] {
  const wordMap = new Map<string, CustomWord>();
  
  sets.forEach((set) => {
    set.words.forEach((word) => {
      if (!wordMap.has(word.word)) {
        wordMap.set(word.word, word);
      }
    });
  });
  
  return Array.from(wordMap.values());
}

/**
 * セットの統計情報を取得
 */
export function getSetStatistics(set: CustomQuestionSet) {
  const totalWords = set.words.length;
  const sources = set.words.reduce((acc, word) => {
    const source = word.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const tags = set.words.reduce((acc, word) => {
    (word.tags || []).forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalWords,
    sources,
    tags,
    hasIPA: set.words.filter((w) => w.ipa).length,
    hasKatakana: set.words.filter((w) => w.katakana).length,
  };
}
