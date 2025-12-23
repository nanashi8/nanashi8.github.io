/**
 * ScaffoldingSystem - 段階的指導システム
 *
 * **役割**: 学習者の理解度に応じて適切なヒントレベルを提供
 *
 * **ヒントレベル**:
 * - Level 0: ヒントなし（通常出題）
 * - Level 1: 軽いヒント（最初の文字、品詞など）
 * - Level 2: 中程度のヒント（最初の3文字 + 文字数）
 * - Level 3: 強いヒント（ほぼ答え、伏せ字1-2文字）
 *
 * **アルゴリズム**:
 * - 連続エラー0回 → ヒントなし
 * - 連続エラー1回 → 軽いヒント
 * - 連続エラー2回 → 中程度のヒント
 * - 連続エラー3回以上 → 強いヒント
 *
 * Phase 5: 感情的サポート統合
 */

import type { WordProgress } from '../../../storage/progress/types';

/**
 * ヒントレベル（0-3）
 */
export type HintLevel = 0 | 1 | 2 | 3;

/**
 * ヒント情報
 */
export interface HintInfo {
  /** ヒントレベル */
  level: HintLevel;
  /** ヒントテキスト */
  text: string | null;
  /** ヒント理由 */
  reason: string;
}

/**
 * 単語情報（ヒント生成用）
 */
export interface WordInfo {
  /** 英単語 */
  english: string;
  /** 日本語意味 */
  japanese: string;
  /** 品詞（optional） */
  partOfSpeech?: string;
  /** 例文（optional） */
  exampleSentence?: string;
}

/**
 * ScaffoldingSystem - 段階的指導
 */
export class ScaffoldingSystem {
  /**
   * 適切なヒントレベルの決定
   *
   * @param progress 単語の学習進捗
   * @param consecutiveErrors 連続エラー回数
   * @returns ヒントレベル（0-3）
   */
  determineHintLevel(
    progress: WordProgress,
    consecutiveErrors: number
  ): HintLevel {
    // 連続エラー回数に基づいてヒントレベルを決定
    if (consecutiveErrors === 0) {
      return 0; // ヒントなし
    } else if (consecutiveErrors === 1) {
      return 1; // 軽いヒント
    } else if (consecutiveErrors === 2) {
      return 2; // 中程度のヒント
    } else {
      return 3; // 強いヒント（3回以上エラー）
    }
  }

  /**
   * ヒントの生成
   *
   * @param word 単語情報
   * @param hintLevel ヒントレベル
   * @returns ヒント情報
   */
  generateHint(
    word: WordInfo,
    hintLevel: HintLevel
  ): HintInfo {
    if (hintLevel === 0) {
      return {
        level: 0,
        text: null,
        reason: '通常出題'
      };
    }

    const hintGenerators = {
      1: () => this.generateLightHint(word),
      2: () => this.generateMediumHint(word),
      3: () => this.generateStrongHint(word)
    };

    const text = hintGenerators[hintLevel]();
    const reasons = {
      1: '1回目のエラー - 軽いヒント',
      2: '2回目のエラー - 中程度のヒント',
      3: '3回以上のエラー - 強いヒント'
    };

    return {
      level: hintLevel,
      text,
      reason: reasons[hintLevel]
    };
  }

  /**
   * Level 1: 軽いヒント
   * - 最初の文字
   * - 品詞（もしあれば）
   */
  private generateLightHint(word: WordInfo): string {
    const firstChar = word.english[0];
    const hints: string[] = [`最初の文字は「${firstChar}」です`];

    // 品詞があれば追加
    if (word.partOfSpeech) {
      hints.push(`品詞: ${word.partOfSpeech}`);
    }

    return `💡 ヒント: ${hints.join(' / ')}`;
  }

  /**
   * Level 2: 中程度のヒント
   * - 最初の3文字
   * - 文字数
   * - 品詞
   */
  private generateMediumHint(word: WordInfo): string {
    const first3 = word.english.substring(0, Math.min(3, word.english.length));
    const length = word.english.length;
    const hints: string[] = [`${first3}... (${length}文字)`];

    // 品詞があれば追加
    if (word.partOfSpeech) {
      hints.push(`品詞: ${word.partOfSpeech}`);
    }

    return `💡 ヒント: ${hints.join(' / ')}`;
  }

  /**
   * Level 3: 強いヒント
   * - ほぼ答え（1文字おきに伏せ字）
   * - または例文
   */
  private generateStrongHint(word: WordInfo): string {
    // パターン1: 伏せ字（1文字おきに表示）
    const masked = word.english
      .split('')
      .map((char, i) => {
        // 最初と最後は必ず表示
        if (i === 0 || i === word.english.length - 1) {
          return char;
        }
        // 1文字おきに伏せ字
        return i % 2 === 0 ? char : '_';
      })
      .join('');

    let hint = `💡 強いヒント: ${masked}`;

    // パターン2: 例文があれば追加
    if (word.exampleSentence) {
      hint += `\n📝 例文: ${word.exampleSentence}`;
    }

    return hint;
  }

  /**
   * ヒントの段階的提供
   *
   * 学習者がエラーを繰り返すたびに、より強いヒントを提供
   *
   * @param word 単語情報
   * @param progress 学習進捗
   * @param currentError 現在の連続エラー回数
   * @returns ヒント情報
   */
  provideProgressiveHint(
    word: WordInfo,
    progress: WordProgress,
    currentError: number
  ): HintInfo {
    // エラー回数に基づいてヒントレベルを決定
    const hintLevel = this.determineHintLevel(progress, currentError);

    // ヒントを生成
    return this.generateHint(word, hintLevel);
  }

  /**
   * ヒント履歴の記録
   *
   * 学習者がどのレベルのヒントで成功したかを記録し、
   * 将来の出題戦略に活用
   */
  recordHintSuccess(
    _progress: WordProgress,
    _hintLevel: HintLevel,
    _wasCorrect: boolean
  ): void {
    // TODO: progressに hintHistory フィールドを追加して記録
    // 例: progress.hintHistory = { level: hintLevel, success: wasCorrect, timestamp: Date.now() }

    // Phase 5-2では型定義のみ。Phase 5-3で実装予定
  }

  /**
   * 最適なヒントレベルの学習
   *
   * 過去のヒント使用履歴から、学習者に最適なヒントレベルを学習
   * （将来の拡張機能）
   */
  learnOptimalHintLevel(progress: WordProgress): HintLevel {
    // TODO: 機械学習的なアプローチで最適化
    // 現状はルールベース

    const errorRate = progress.incorrectCount / (progress.correctCount + progress.incorrectCount || 1);

    if (errorRate > 0.7) {
      return 2; // 高エラー率 → 中程度のヒントから開始
    } else if (errorRate > 0.5) {
      return 1; // 中エラー率 → 軽いヒントから開始
    } else {
      return 0; // 低エラー率 → ヒントなし
    }
  }
}
