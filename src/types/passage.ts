/**
 * 節句分割・依存解析（UD）連携用の型定義
 *
 * 注意:
 * - UIの表示や解析処理で共通利用するため、外部サービスに依存しない純粋なデータ型のみを定義する。
 */

/**
 * SVOCM要素
 */
export type SVOCMComponent = 'S' | 'V' | 'O' | 'C' | 'M';

/**
 * 単語のSVOCM情報
 */
export interface WordWithSVOCM {
  word: string;
  component?: SVOCMComponent;
  isMainClause: boolean;
}

/**
 * 節句分割された文
 */
export interface ClauseParsedSentence {
  original: string;
  segments: ClauseSegment[];
}

/**
 * 節句セグメント
 */
export interface ClauseSegment {
  text: string;
  type: 'main-clause' | 'subordinate-clause' | 'phrase' | 'clause-text';
  words: WordWithSVOCM[];
  children?: ClauseSegment[];
}

/**
 * 依存構造解析（UD想定）のトークン
 * - start/end は文文字列内の 0-based 文字インデックス（endはexclusive）
 */
export interface DependencyToken {
  id: number;
  text: string;
  lemma?: string;
  upos?: string;
  xpos?: string;
  head?: number;
  deprel?: string;
  start: number;
  end: number;
}

export interface DependencyParsedSentence {
  id?: number;
  text: string;
  tokens: DependencyToken[];
}

export interface DependencyParsedPassage {
  passageId: string;
  generatedAt?: string;
  sentences: DependencyParsedSentence[];
}

/**
 * 文データ
 */
export interface SentenceData {
  id: number;
  english: string;
  japanese: string;
  phraseIds?: string[];
  isParagraphStart?: boolean;
}

/**
 * フレーズデータ
 */
export interface PhraseData {
  id: string;
  english: string;
  japanese: string;
}

/**
 * 重要語句
 */
export interface KeyPhrase {
  phrase: string;
  meaning: string;
  type?: string;
  positions: number[];
}

/**
 * 注釈付き単語
 */
export interface AnnotatedWord {
  word: string;
  inText: string;
  meaning: string;
}

/**
 * 完全なパッセージデータ
 */
export interface CompletePassageData {
  passageId: string;
  sentences: SentenceData[];
  phrases: PhraseData[];
  keyPhrases: KeyPhrase[];
  annotatedWords: AnnotatedWord[];
  metadata: {
    wordCount: number;
    sentenceCount: number;
  };
}

/**
 * 選択された文の詳細情報
 */
export interface SelectedSentenceDetail {
  sentenceData: SentenceData;
  clauseParsed: ClauseParsedSentence;
  relatedPhrases: PhraseData[];
  keyPhrases: KeyPhrase[];
}
