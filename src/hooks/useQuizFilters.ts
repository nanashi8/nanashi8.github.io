/**
 * フィルター状態管理カスタムフック
 * カテゴリ、難易度、データソースなどのフィルター状態を管理
 */

import { useState } from 'react';
// App.tsxで定義されている型を使用
type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';
type WordPhraseFilter = 'all' | 'words-only' | 'phrases-only';
type PhraseTypeFilter = 'all' | 'phrasal-verb' | 'idiom' | 'collocation' | 'other';
type DataSource = 'all' | 'junior' | 'intermediate' | 'advanced' | 'standard' | string;

export function useQuizFilters() {
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('all');
  const [selectedWordPhraseFilter, setSelectedWordPhraseFilter] = useState<WordPhraseFilter>('all');
  const [selectedPhraseTypeFilter, setSelectedPhraseTypeFilter] = useState<PhraseTypeFilter>('all');

  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>(() => {
    const saved = localStorage.getItem('selectedDataSource');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return 'all';
      }
    }
    return 'all';
  });

  return {
    categoryList,
    setCategoryList,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedWordPhraseFilter,
    setSelectedWordPhraseFilter,
    selectedPhraseTypeFilter,
    setSelectedPhraseTypeFilter,
    selectedDataSource,
    setSelectedDataSource,
  };
}
