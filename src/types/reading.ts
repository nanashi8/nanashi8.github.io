/**
 * 長文読解関連型定義
 */

// removed unused import to satisfy lint
// import type { Question } from './domain';

// 長文読解用の型
export interface ReadingPassage {
  id: string;
  title: string;
  level?: string; // 難易度レベル（初級/中級/上級）
  theme?: string; // テーマ
  targetWordCount?: number; // 目標語数
  actualWordCount?: number; // 実際の語数
  phrases: ReadingPhrase[]; // 文節ごとのグループ
  translation?: string; // 全体の和訳（オプショナル）
  originalText?: string; // 元の全文テキスト（passages-originalから読み込み、オプショナル）
}

export interface ReadingPhrase {
  id?: number; // フレーズID（オプショナル）
  words?: string[]; // 文節内の単語リスト(例: ["Modern", "technology"]) - オプショナル（segmentsから生成可能）
  phraseMeaning: string; // 文節全体の和訳(例: "現代の技術")
  segments: ReadingSegment[]; // 個別単語の詳細
  isUnknown?: boolean; // 文節全体が分からないとマークされているか - 旧バージョンとの互換性のため
}

export interface ReadingSegment {
  word: string; // 単語（表示形：変化形のまま）
  meaning: string; // 意味
  isUnknown: boolean; // 分からない単語としてマークされているか

  // Question型互換フィールド（単語帳保存用）
  lemma?: string; // 原形（辞書形）- gatheredならgather
  reading?: string; // カタカナ読み（例: ギャザー）
  etymology?: string; // 語源等解説（小中学生向け）
  relatedWords?: string; // 関連語（熟語・派生語と読みと意味）
  relatedFields?: string; // 関連分野
  difficulty?: string; // 難易度（beginner/intermediate/advanced）
}
