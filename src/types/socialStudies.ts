/**
 * 社会科教材の型定義
 *
 * 東京書籍『新編 新しい社会』シリーズ準拠
 * 歴史・地理・公民の一問一答形式
 */

// ===== 基本型 =====

/**
 * 社会科の分野
 */
export type SocialStudiesField =
  | '歴史-古代'
  | '歴史-中世'
  | '歴史-近世'
  | '歴史-近代'
  | '歴史-現代'
  | '地理-日本'
  | '地理-世界'
  | '地理-産業'
  | '地理-環境'
  | '公民-政治'
  | '公民-経済'
  | '公民-国際'
  | '公民-人権';

/**
 * 難易度（1-5）
 */
export type SocialStudiesDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * 関連タイプ（いもづる式学習用）
 */
export type RelationType =
  | 'related' // 一般的な関連
  | 'cause' // 原因：A→Bの原因
  | 'effect' // 結果：A→Bの結果
  | 'chronological_before' // 時系列：AはBの前
  | 'chronological_after' // 時系列：AはBの後
  | 'person_achievement' // 人物→業績
  | 'location_event'; // 場所→出来事

// ===== 問題データ型 =====

/**
 * 社会科問題（JSONデータ）
 */
export interface SocialStudiesQuestion {
  /** 語句（徳川家康、明治維新等） */
  term: string;

  /** 読み仮名（ひらがな） */
  reading: string;

  /** 事項（江戸幕府を開いた人物等） */
  matter: string;

  /** 問題文 */
  question: string;

  /** 詳細解説 */
  explanation: string;

  /** 関連事項（|区切り） */
  relatedMatters: string;

  /** 関連分野（|区切り） */
  relatedFields: string;

  /** 難易度（1-5） */
  difficulty: SocialStudiesDifficulty;

  /** データソース（junior固定） */
  source: 'junior';

  /** 年代（歴史のみ、4桁西暦） */
  year?: number;

  /** 選択肢生成ヒント（|区切り） */
  choiceHints: string;
}

/**
 * CSVからの問題データ（変換前）
 */
export interface SocialStudiesQuestionCSV {
  語句: string;
  読み: string;
  事項: string;
  問題文: string;
  説明: string;
  関連事項: string;
  関連分野: string;
  難易度: string;
  source: string;
  年代: string;
  選択肢生成ヒント: string;
}

// ===== 関連付け型 =====

/**
 * 語句間の関連（いもづる式学習用）
 */
export interface SocialStudiesRelationship {
  /** 元の語句 */
  sourceTerm: string;

  /** 関連する語句 */
  targetTerm: string;

  /** 関連の強度（0-100） */
  strength: number;

  /** 関連のタイプ */
  relationType: RelationType;
}

/**
 * 関連タイプの優先順位
 */
export const RELATION_TYPE_PRIORITY: Record<RelationType, number> = {
  cause: 100, // 原因を最優先
  effect: 90, // 結果を次に
  chronological_before: 80, // 時系列的に前
  chronological_after: 70, // 時系列的に後
  person_achievement: 60, // 人物の業績
  location_event: 55, // 場所と出来事
  related: 50, // 一般関連
};

// ===== 学習進捗型 =====

/**
 * 社会科問題の学習進捗（英語と同じPosition 0-100ベース）
 */
export interface SocialStudiesProgress {
  /** 語句 */
  term: string;

  /** 習熟度（0-100、既存のQuestionSchedulerと同じ管理方式） */
  position: number;

  /** 正解回数 */
  correctCount: number;

  /** 不正解回数 */
  incorrectCount: number;

  /** 最終回答日時 */
  lastAnswered: Date;

  /** 次回復習日時 */
  nextReviewDate: Date;

  /** 分野 */
  field: SocialStudiesField;

  /** 年代（歴史のみ） */
  year?: number;
}

// ===== 選択肢生成型 =====

/**
 * 選択肢（3択 + 分からない）
 */
export interface SocialStudiesChoice {
  /** 選択肢のテキスト */
  text: string;

  /** 正解かどうか */
  isCorrect: boolean;

  /** 選択肢の種類 */
  type: 'correct' | 'distractor' | 'dontknow';
}

/**
 * 出題用の問題（選択肢付き）
 */
export interface SocialStudiesQuiz {
  /** 問題データ */
  question: SocialStudiesQuestion;

  /** 選択肢（3択 + 分からない） */
  choices: SocialStudiesChoice[];
}

// ===== ユーティリティ関数 =====

/**
 * CSVの関連事項フィールドをパースして関連タイプを判定
 *
 * 記法：
 * - →語句 = cause（この語句が原因）
 * - ←語句 = effect（この語句が結果）
 * - ・語句 = related（一般的な関連）
 * - 語句（記号なし） = related（デフォルト）
 */
export function parseRelatedMatters(
  relatedMattersStr: string
): Array<{ term: string; type: RelationType }> {
  if (!relatedMattersStr || relatedMattersStr.trim() === '') {
    return [];
  }

  return relatedMattersStr.split('|').map((item) => {
    const trimmed = item.trim();

    if (trimmed.startsWith('→')) {
      return { term: trimmed.substring(1), type: 'cause' as RelationType };
    } else if (trimmed.startsWith('←')) {
      return { term: trimmed.substring(1), type: 'effect' as RelationType };
    } else if (trimmed.startsWith('・')) {
      return { term: trimmed.substring(1), type: 'related' as RelationType };
    } else {
      return { term: trimmed, type: 'related' as RelationType };
    }
  });
}

/**
 * 年代から時系列関連を自動生成
 *
 * @param terms 語句リスト（年代情報付き）
 * @param maxYearDiff 時系列関連とみなす最大年差（デフォルト: 50年）
 */
export function generateChronologicalRelations(
  terms: Array<{ term: string; year: number }>,
  maxYearDiff: number = 50
): SocialStudiesRelationship[] {
  const relations: SocialStudiesRelationship[] = [];

  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const term1 = terms[i];
      const term2 = terms[j];

      const yearDiff = Math.abs(term1.year - term2.year);
      if (yearDiff <= maxYearDiff) {
        // 年代が近い場合、時系列関連として登録
        if (term1.year < term2.year) {
          relations.push({
            sourceTerm: term1.term,
            targetTerm: term2.term,
            strength: Math.max(50, 100 - yearDiff), // 年差が小さいほど強い関連
            relationType: 'chronological_before',
          });
        } else {
          relations.push({
            sourceTerm: term2.term,
            targetTerm: term1.term,
            strength: Math.max(50, 100 - yearDiff),
            relationType: 'chronological_before',
          });
        }
      }
    }
  }

  return relations;
}

/**
 * 分野がバリデーション
 */
export function isValidSocialStudiesField(field: string): field is SocialStudiesField {
  const validFields: SocialStudiesField[] = [
    '歴史-古代',
    '歴史-中世',
    '歴史-近世',
    '歴史-近代',
    '歴史-現代',
    '地理-日本',
    '地理-世界',
    '地理-産業',
    '地理-環境',
    '公民-政治',
    '公民-経済',
    '公民-国際',
    '公民-人権',
  ];
  return validFields.includes(field as SocialStudiesField);
}

/**
 * 難易度のバリデーション
 */
export function isValidDifficulty(difficulty: number): difficulty is SocialStudiesDifficulty {
  return difficulty >= 1 && difficulty <= 5 && Number.isInteger(difficulty);
}
