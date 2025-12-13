/**
 * カスタム問題セット機能の型定義
 */

/**
 * カスタム単語/熟語
 * 既存の語彙形式と互換性を持つ
 */
export interface CustomWord {
  /** 英語の単語または熟語 */
  word: string;
  /** 日本語の意味 */
  meaning: string;
  /** IPA発音記号 (オプション) */
  ipa?: string;
  /** カタカナ発音 (オプション) */
  katakana?: string;
  /** 出典 (どのタブから追加されたか) */
  source?: 'reading' | 'memorization' | 'translation' | 'spelling' | 'dictionary' | 'manual';
  /** 出典の詳細情報 (例: パッセージID、問題番号など) */
  sourceDetail?: string;
  /** 追加日時 */
  addedAt?: string;
  /** タグ (カテゴリ分類用) */
  tags?: string[];
}

/**
 * カスタム問題セット
 */
export interface CustomQuestionSet {
  /** セットの一意ID */
  id: string;
  /** セット名 */
  name: string;
  /** 説明 (オプション) */
  description?: string;
  /** 単語/熟語のリスト */
  words: CustomWord[];
  /** 作成日時 */
  createdAt: string;
  /** 最終更新日時 */
  updatedAt: string;
  /** セットの色 (UI表示用) */
  color?: string;
  /** アイコン絵文字 (UI表示用) */
  icon?: string;
}

/**
 * カスタム問題セットの管理状態
 */
export interface CustomQuestionState {
  /** すべてのカスタム問題セット */
  sets: CustomQuestionSet[];
  /** 現在アクティブなセットのID */
  activeSetId: string | null;
  /** 最近使用したセットのIDリスト (最大5件) */
  recentSetIds: string[];
}
