/**
 * ドメイン型定義
 * コアビジネスロジックに関する型
 */

import { OFFICIAL_CATEGORIES, DIFFICULTY_LEVELS } from '@/constants/categories';
import type { CategoryType, DifficultyType } from '@/constants/categories';

// 定数を再エクスポート
export { OFFICIAL_CATEGORIES, DIFFICULTY_LEVELS };
export type { CategoryType, DifficultyType };

export interface Question {
  word: string; // 語句（単語 or 熟語、熟語の場合スペース含む）
  reading: string; // 読み（国際基準アクセント記号をカタカナで正確に）
  meaning: string; // 意味（正解）
  etymology: string; // 語源等解説（小中学生向け派生語習得支援）
  relatedWords: string; // 関連語（熟語・派生語と読みと意味）
  relatedFields: string; // 関連分野（表示用・CSVから読み込み）
  category?: string; // 関連分野（フィルター用・内部処理）
  difficulty: string; // 難易度（CSVから読み込み）
  source?: 'junior' | 'intermediate'; // データソース（高校受験 or 中級1800）
  type?: 'word' | 'phrase'; // 単語か熟語か（オプショナル、将来の拡張用）
  isPhraseOnly?: boolean; // 複数単語から成る熟語かどうか（スペース含む場合true）
}

// バリデーション用のヘルパー関数
export function isValidCategory(category: string): category is CategoryType {
  return (OFFICIAL_CATEGORIES as readonly string[]).includes(category);
}

export function isValidDifficulty(difficulty: string): difficulty is DifficultyType {
  return (DIFFICULTY_LEVELS as readonly string[]).includes(difficulty);
}

export interface CreatedQuestion {
  word: string;
  reading: string;
  meaning: string;
  etymology: string;
  relatedWords: string;
  relatedFields: string;
  difficulty: string;
}

// 問題集（単語セット）の型
export interface QuestionSet {
  id: string; // 一意のID
  name: string; // 問題集の名前
  questions: Question[]; // 問題リスト
  createdAt: number; // 作成日時（タイムスタンプ）
  isBuiltIn: boolean; // 組み込みサンプルかどうか（削除不可）
  source?: string; // 作成元（例: "長文抽出", "CSV読み込み", "手動作成"）
}
