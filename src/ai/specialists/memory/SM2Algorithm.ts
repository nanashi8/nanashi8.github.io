/**
 * SM-2 Algorithm (SuperMemo 2)
 *
 * SuperMemoによって開発された間隔反復アルゴリズム
 * 参考: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * アルゴリズムの概要:
 * 1. 正答品質（Quality: 0-5）に基づいてEaseFactor（難易度係数）を調整
 * 2. 連続正解回数（Repetitions）を追跡
 * 3. 指数関数的に復習間隔を延ばす（1日 → 6日 → EF倍...）
 *
 * 記憶の定着を最大化し、忘却を防ぐ科学的根拠のある手法
 */

/**
 * SM-2計算結果
 */
export interface SM2Result {
  /** 次回復習までの間隔（日数） */
  nextInterval: number;

  /** 更新された難易度係数（1.3-3.0） */
  easeFactor: number;

  /** 更新された連続正解回数 */
  repetitions: number;

  /** 次回復習の推奨日時 */
  nextReviewDate: Date;
}

/**
 * 正答品質（Quality）の定義
 *
 * 0: 完全失敗 - 全く思い出せない
 * 1: 失敗 - 思い出せなかったが、答えを見て納得
 * 2: 長考正解 - かなり考えて正解
 * 3: 正解（迷い有） - 少し考えて正解
 * 4: 正解（迷い無） - すぐに正解
 * 5: 完璧 - 瞬時に正解
 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SM-2 Algorithmの実装クラス
 */
export class SM2Algorithm {
  /** EaseFactorの下限（これ以下にはならない） */
  private static readonly MIN_EASE_FACTOR = 1.3;

  /** EaseFactorの初期値 */
  private static readonly DEFAULT_EASE_FACTOR = 2.5;

  /** 最初の復習間隔（日数） */
  private static readonly FIRST_INTERVAL = 1;

  /** 2回目の復習間隔（日数） */
  private static readonly SECOND_INTERVAL = 6;

  /**
   * SM-2アルゴリズムによる次回復習計算
   *
   * @param quality - 正答品質（0-5）
   * @param easeFactor - 現在の難易度係数（初期値2.5）
   * @param interval - 前回の復習間隔（日数）
   * @param repetitions - 連続正解回数
   * @returns SM-2計算結果
   */
  calculateNextReview(
    quality: SM2Quality,
    easeFactor: number = SM2Algorithm.DEFAULT_EASE_FACTOR,
    interval: number = SM2Algorithm.FIRST_INTERVAL,
    repetitions: number = 0
  ): SM2Result {
    // 1️⃣ EaseFactor（難易度係数）の更新
    const newEF = this.updateEaseFactor(easeFactor, quality);

    // 2️⃣ 連続正解回数の更新
    const newReps = this.updateRepetitions(repetitions, quality);

    // 3️⃣ 次回の復習間隔の計算
    const newInterval = this.calculateInterval(newReps, interval, newEF, quality);

    // 4️⃣ 次回復習日時の計算
    const nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

    return {
      nextInterval: newInterval,
      easeFactor: newEF,
      repetitions: newReps,
      nextReviewDate
    };
  }

  /**
   * EaseFactor（難易度係数）の更新
   *
   * 計算式: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
   *
   * @param currentEF - 現在のEaseFactor
   * @param quality - 正答品質（0-5）
   * @returns 更新されたEaseFactor（下限1.3）
   */
  private updateEaseFactor(currentEF: number, quality: SM2Quality): number {
    // SM-2の公式
    const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // 下限チェック（1.3未満にはならない）
    return Math.max(SM2Algorithm.MIN_EASE_FACTOR, newEF);
  }

  /**
   * 連続正解回数の更新
   *
   * @param currentReps - 現在の連続正解回数
   * @param quality - 正答品質（0-5）
   * @returns 更新された連続正解回数
   */
  private updateRepetitions(currentReps: number, quality: SM2Quality): number {
    if (quality < 3) {
      // Quality 0-2: 失敗 → 連続正解回数をリセット
      return 0;
    } else {
      // Quality 3-5: 正解 → 連続正解回数を+1
      return currentReps + 1;
    }
  }

  /**
   * 次回復習間隔の計算
   *
   * SM-2のルール:
   * - Quality < 3（失敗）: 1日後
   * - Repetition 1回目: 1日後
   * - Repetition 2回目: 6日後
   * - Repetition 3回目以降: 前回の間隔 × EaseFactor
   *
   * @param repetitions - 連続正解回数
   * @param interval - 前回の間隔（日数）
   * @param easeFactor - 難易度係数
   * @param quality - 正答品質
   * @returns 次回復習までの間隔（日数）
   */
  private calculateInterval(
    repetitions: number,
    interval: number,
    easeFactor: number,
    quality: SM2Quality
  ): number {
    // 失敗した場合 → 1日後
    if (quality < 3) {
      return SM2Algorithm.FIRST_INTERVAL;
    }

    // 連続正解回数に応じた間隔
    switch (repetitions) {
      case 1:
        // 1回目の正解 → 1日後
        return SM2Algorithm.FIRST_INTERVAL;

      case 2:
        // 2回目の正解 → 6日後
        return SM2Algorithm.SECOND_INTERVAL;

      default:
        // 3回目以降 → 前回の間隔 × EaseFactor（指数関数的増加）
        return Math.round(interval * easeFactor);
    }
  }

  /**
   * 現在の学習状況からQuality値を推定
   *
   * @param isCorrect - 正解したか
   * @param responseTime - 回答時間（ミリ秒）
   * @param hesitation - 迷いがあったか
   * @param attempts - 試行回数（失敗回数）
   * @returns 推定されたQuality値（0-5）
   */
  determineQuality(
    isCorrect: boolean,
    responseTime: number,
    hesitation: boolean = false,
    attempts: number = 1
  ): SM2Quality {
    // 不正解の場合
    if (!isCorrect) {
      if (attempts > 2) {
        return 0; // 完全失敗（3回以上間違えた）
      }
      return 1; // 失敗（1-2回間違えた）
    }

    // 正解の場合 - 回答時間と迷いで判定
    if (responseTime < 3000 && !hesitation) {
      return 5; // 完璧（3秒以内、迷いなし）
    }

    if (responseTime < 5000 && !hesitation) {
      return 4; // 迷いなく正解（5秒以内）
    }

    if (responseTime < 10000) {
      return 3; // 少し考えて正解（10秒以内）
    }

    // 10秒以上かかった、または迷いがあった
    return 2; // 長考正解
  }

  /**
   * Quality値の説明テキストを取得
   *
   * @param quality - Quality値（0-5）
   * @returns 説明テキスト
   */
  getQualityDescription(quality: SM2Quality): string {
    const descriptions = {
      0: '完全失敗 - 全く思い出せない',
      1: '失敗 - 思い出せなかったが、答えを見て納得',
      2: '長考正解 - かなり考えて正解',
      3: '正解（迷い有） - 少し考えて正解',
      4: '正解（迷い無） - すぐに正解',
      5: '完璧 - 瞬時に正解'
    };

    return descriptions[quality];
  }

  /**
   * デバッグ用: SM-2計算の詳細ログ
   *
   * @param quality - 正答品質
   * @param easeFactor - 難易度係数
   * @param interval - 復習間隔
   * @param repetitions - 連続正解回数
   * @param result - 計算結果
   */
  logCalculation(
    quality: SM2Quality,
    easeFactor: number,
    interval: number,
    repetitions: number,
    result: SM2Result
  ): void {
    if (!import.meta.env?.DEV) return;

    console.log('📚 [SM-2] 計算詳細');
    console.log(`  入力: Quality=${quality}, EF=${easeFactor.toFixed(2)}, Interval=${interval}日, Reps=${repetitions}`);
    console.log(`  出力: EF=${result.easeFactor.toFixed(2)}, Interval=${result.nextInterval}日, Reps=${result.repetitions}`);
    console.log(`  次回復習: ${result.nextReviewDate.toLocaleDateString('ja-JP')}`);
    console.log(`  説明: ${this.getQualityDescription(quality)}`);
  }
}
