/**
 * UI関連型定義
 * ユーザーインターフェース、フィルター、表示状態に関する型
 */

export type Tab =
  | 'memorization'
  | 'translation'
  | 'spelling'
  | 'grammar'
  | 'reading'
  | 'grammar-guide'
  | 'dictionary'
  | 'stats'
  | 'settings';
export type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type WordPhraseFilter = 'all' | 'words-only' | 'phrases-only';
export type PhraseTypeFilter = 'all' | 'phrasal-verb' | 'idiom' | 'collocation' | 'other';
export type DataSource = 'all' | 'junior' | 'intermediate' | 'advanced' | 'standard' | string; // stringはカスタム問題セットID

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedAnswer: string | null;
}

// スペルクイズ用の状態
export interface SpellingState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedLetters: (string | null)[]; // 選択されたアルファベット
  correctWord: string; // 正解の単語
}

// 暗記タブ用の型定義
export interface MemorizationCardState {
  showWord: boolean; // 単語（常に表示）
  showMeaning: boolean; // 意味（初期: 表示）
  showPronunciation: boolean; // 読み（タップで切り替え）
  showExample: boolean; // 例文（タップで切り替え）
  showEtymology: boolean; // 語源（タップで切り替え）
  showRelated: boolean; // 関連語（タップで切り替え）
}

// 暗記タブの学習設定
export interface MemorizationSettings {
  // 音声読み上げ
  autoVoice: boolean; // 自動音声読み上げ
  voiceWord: boolean; // 語句を読み上げ
  voiceMeaning: boolean; // 意味も読み上げ
  voiceDelay?: number; // 語句と意味の間の待機時間（秒）
  voiceWithMeaning?: boolean; // 後方互換性のため残す（非推奨）

  // インターリービング（異なる分野を混ぜる）
  interleavingMode: 'off' | 'medium' | 'high';

  // カード表示設定（永続化）
  cardDisplaySettings: MemorizationCardState;
}

// Questionインポート（他の型定義ファイルから参照）
import type { Question } from './domain';
