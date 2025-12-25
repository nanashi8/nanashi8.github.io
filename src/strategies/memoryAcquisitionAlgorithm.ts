/**
 * 記憶獲得アルゴリズム（Memory Acquisition Algorithm）
 *
 * 科学的根拠に基づく適応型学習システム：
 *
 * 1. **エビングハウスの忘却曲線（Ebbinghaus Forgetting Curve）**
 *    - 学習後、時間とともに記憶が指数関数的に減衰
 *    - 復習により忘却曲線を遅延させ、記憶を強化
 *    - 本システム: 即時→早期→中期→終了時の4段階復習で記憶統合を促進
 *
 * 2. **SuperMemo SM-2アルゴリズム**
 *    - 間隔反復学習（Spaced Repetition）の実装
 *    - 正答時: 復習間隔を拡大、誤答時: 間隔をリセット
 *    - 本システム: 動的閾値により個人に最適化された復習回数を決定
 *
 * 3. **分散学習理論（Distributed Practice Effect）**
 *    - 集中学習よりも分散した復習の方が長期記憶への定着が良い
 *    - 本システム: 異なる時間間隔（1分→10分→1時間→終了時）で復習
 *
 * 4. **習熟学習理論（Mastery Learning）**
 *    - 学習者が習熟度基準を達成するまで学習を継続
 *    - 本システム: 正答率85%、連続正答4回を達成するまで永遠に出題
 *
 * 5. **個人適応型学習（Adaptive Learning）**
 *    - 各学習者の特性に応じて閾値を動的調整
 *    - 本システム: 誤答時に閾値を増加、連続正答時に減少
 *
 * **重要な設計原則**:
 * - 不正解が続く限り永遠に出題（MAX_SAME_WORD_ATTEMPTS = Infinity）
 * - 動的閾値は無制限（MAX_THRESHOLD = Infinity）
 * - 定着判定は科学的根拠に基づく6つの厳格な条件
 */

export enum QueueType {
  IMMEDIATE = 'immediate', // 即時復習（1-3問後、約1分）
  EARLY = 'early', // 早期復習（5-10問後、約10分）
  MID = 'mid', // 中期復習（20-30問後、約1時間）
  END = 'end', // 終了時復習（セッション終了時）
}

export enum QuestionCategory {
  MEMORIZATION = 'memorization',
  TRANSLATION = 'translation',
  SPELLING = 'spelling',
  GRAMMAR = 'grammar',
}

export interface AcquisitionProgress {
  todayFirstSeen: number; // 今日初めて見た時刻
  todayCorrectCount: number; // 今日の正答回数
  todayWrongCount: number; // 今日の誤答回数
  isAcquisitionComplete: boolean; // 記憶獲得完了フラグ（6つの厳格な条件を全て満たした場合のみtrue）
  currentQueue: QueueType | null; // 現在のキュー（即時/早期/中期/終了時）
  queuedAt: number; // キューに追加された時刻
  todayReviews: ReviewRecord[]; // 今日の復習記録（全ての試行履歴）

  // 動的閾値システム（科学的根拠: 習熟学習理論 + 個人適応型学習）
  dynamicThreshold: number; // この単語固有の定着閾値（初期値5、最大無制限）
  consecutiveCorrectStreak: number; // 連続正答数（分散学習理論: 4回で定着）
  totalAttempts: number; // 総出題回数（不正解が続く限り永遠に増加）
  correctRate: number; // 正答率（0-1、認知心理学: 0.85以上で長期記憶へ移行）
  lastThresholdAdjustment: number; // 最後に閾値を調整した時刻
}

export interface ReviewRecord {
  timestamp: number;
  queueType: QueueType;
  isCorrect: boolean;
  responseTime?: number;
}

export interface QueueEntry {
  word: string;
  queueType: QueueType;
  enqueuedAt: number; // エンキュー時刻
  enqueuedQuestionNumber: number; // エンキュー時の問題番号
  targetQuestionNumber: number; // 目標問題番号
  targetTime: number; // 目標時刻
  priority: number; // 優先度
  difficulty: number; // 難易度
  category: QuestionCategory;
}

export interface TabConfig {
  consolidationThreshold: number; // 定着に必要な正答回数
  enableImmediateReview: boolean;
  enableEarlyReview: boolean;
  enableMidReview: boolean;
  enableEndReview: boolean;
  newQuestionRatio: number; // 新規問題の割合
}

export interface AcquisitionReport {
  totalWords: number;
  completed: number;
  incomplete: number;
  completionRate: number;
  incompleteWords: string[];
}

export interface QueueStatistics {
  immediate: { size: number; oldestEntry?: number; averageWaitTime: number };
  early: { size: number; oldestEntry?: number; averageWaitTime: number };
  mid: { size: number; oldestEntry?: number; averageWaitTime: number };
  end: { size: number; oldestEntry?: number; averageWaitTime: number };
}

// デフォルトタブ設定（初期値、実際は動的に無制限まで調整される）
// 科学的根拠：間隔反復学習（Spaced Repetition）とエビングハウスの忘却曲線
export const DEFAULT_TAB_CONFIGS: Record<QuestionCategory, TabConfig> = {
  [QuestionCategory.MEMORIZATION]: {
    consolidationThreshold: 5, // 初期値5回、動的に無制限まで増加（不正解が続く限り永遠に出題）
    enableImmediateReview: true,
    enableEarlyReview: true,
    enableMidReview: true,
    enableEndReview: true,
    newQuestionRatio: 0.5, // 復習を優先（分散学習理論）
  },
  [QuestionCategory.TRANSLATION]: {
    consolidationThreshold: 4, // 初期値4回、動的に無制限まで増加
    enableImmediateReview: true,
    enableEarlyReview: true,
    enableMidReview: true,
    enableEndReview: true,
    newQuestionRatio: 0.6,
  },
  [QuestionCategory.SPELLING]: {
    consolidationThreshold: 6, // 初期値6回、動的に無制限まで増加（スペルは記憶定着に時間がかかる）
    enableImmediateReview: true,
    enableEarlyReview: true,
    enableMidReview: true,
    enableEndReview: true,
    newQuestionRatio: 0.4, // 復習を最優先
  },
  [QuestionCategory.GRAMMAR]: {
    consolidationThreshold: 5, // 初期値5回、動的に無制限まで増加
    enableImmediateReview: true,
    enableEarlyReview: true,
    enableMidReview: true,
    enableEndReview: true,
    newQuestionRatio: 0.5,
  },
};

// キューサイズ制限
const MAX_QUEUE_SIZE = {
  immediate: 50, // 即時復習枠を大幅拡大（不正解が続く単語に対応）
  early: 100,
  mid: 150,
  end: 200,
};

const QUEUE_EXPIRY_TIME = 7200000; // 2時間
const _MAX_SAME_WORD_ATTEMPTS = Infinity; // 無制限：不正解が続く限り永遠に出題

// 動的閾値システムの定数（エビングハウスの忘却曲線・SuperMemo SM-2アルゴリズムと統合）
const MIN_THRESHOLD = 3; // 最小閾値（科学的根拠：3回の間隔反復で短期記憶から長期記憶へ）
const MAX_THRESHOLD = Infinity; // 最大閾値無制限：定着するまで永遠に出題
const THRESHOLD_INCREMENT_ON_WRONG = 2; // 誤答時の閾値増加量（SuperMemo SM-2: 失敗時はリセット）
const THRESHOLD_DECREMENT_ON_STREAK = 1; // 連続正答時の閾値減少量（学習曲線の最適化）
const MIN_CORRECT_RATE_FOR_COMPLETION = 0.85; // 定着完了に必要な正答率（85%以上、認知心理学の研究に基づく）
const MIN_CONSECUTIVE_CORRECT = 4; // 定着完了に必要な連続正答数（分散学習理論：4回の成功で定着）

/**
 * 記憶獲得キュー管理クラス
 */
export class AcquisitionQueueManager {
  private queues: {
    immediate: QueueEntry[];
    early: QueueEntry[];
    mid: QueueEntry[];
    end: QueueEntry[];
  };

  private currentQuestionNumber: number = 0;
  private sessionStartTime: number = Date.now();
  private wordAttempts: Map<string, number> = new Map();
  private acquisitionProgress: Map<string, AcquisitionProgress> = new Map();
  private tabConfigs: Record<QuestionCategory, TabConfig>;

  constructor(customConfigs?: Partial<Record<QuestionCategory, Partial<TabConfig>>>) {
    this.queues = {
      immediate: [],
      early: [],
      mid: [],
      end: [],
    };

    // カスタム設定のマージ
    this.tabConfigs = { ...DEFAULT_TAB_CONFIGS };
    if (customConfigs) {
      for (const [category, config] of Object.entries(customConfigs)) {
        this.tabConfigs[category as QuestionCategory] = {
          ...this.tabConfigs[category as QuestionCategory],
          ...config,
        };
      }
    }
  }

  /**
   * 新規単語をエンキュー
   */
  enqueueNewWord(word: string, difficulty: number, category: QuestionCategory): void {
    const now = Date.now();
    this.currentQuestionNumber++;
    const config = this.tabConfigs[category];

    // 進捗の初期化
    if (!this.acquisitionProgress.has(word)) {
      this.acquisitionProgress.set(word, {
        todayFirstSeen: now,
        todayCorrectCount: 0,
        todayWrongCount: 0,
        isAcquisitionComplete: false,
        currentQueue: null,
        queuedAt: 0,
        todayReviews: [],
        dynamicThreshold: config.consolidationThreshold,
        consecutiveCorrectStreak: 0,
        totalAttempts: 0,
        correctRate: 0,
        lastThresholdAdjustment: now,
      });
    }

    // 難易度に基づき即時復習キューに追加
    if (config.enableImmediateReview && this.shouldEnqueueImmediate(difficulty)) {
      const gap = this.calculateImmediateGap(difficulty);
      this.enqueueToImmediate(word, difficulty, category, gap);
    }
  }

  /**
   * 即時復習キューに追加
   */
  private enqueueToImmediate(
    word: string,
    difficulty: number,
    category: QuestionCategory,
    gap: number
  ): void {
    const now = Date.now();

    if (this.isDuplicateInQueue(word, QueueType.IMMEDIATE)) {
      return;
    }

    const entry: QueueEntry = {
      word,
      queueType: QueueType.IMMEDIATE,
      enqueuedAt: now,
      enqueuedQuestionNumber: this.currentQuestionNumber,
      targetQuestionNumber: this.currentQuestionNumber + gap,
      targetTime: now + 60000, // 1分後
      priority: 100,
      difficulty,
      category,
    };

    this.enqueueWithLimit(this.queues.immediate, entry, MAX_QUEUE_SIZE.immediate);

    const progress = this.acquisitionProgress.get(word)!;
    progress.currentQueue = QueueType.IMMEDIATE;
    progress.queuedAt = now;
  }

  /**
   * 早期復習キューに追加
   */
  private enqueueToEarly(word: string, difficulty: number, category: QuestionCategory): void {
    const now = Date.now();
    const config = this.tabConfigs[category];

    if (!config.enableEarlyReview || this.isDuplicateInQueue(word, QueueType.EARLY)) {
      return;
    }

    const gap = this.calculateEarlyGap(difficulty);
    const entry: QueueEntry = {
      word,
      queueType: QueueType.EARLY,
      enqueuedAt: now,
      enqueuedQuestionNumber: this.currentQuestionNumber,
      targetQuestionNumber: this.currentQuestionNumber + gap,
      targetTime: now + 600000, // 10分後
      priority: 80,
      difficulty,
      category,
    };

    this.enqueueWithLimit(this.queues.early, entry, MAX_QUEUE_SIZE.early);

    const progress = this.acquisitionProgress.get(word)!;
    progress.currentQueue = QueueType.EARLY;
    progress.queuedAt = now;
  }

  /**
   * 中期復習キューに追加
   */
  private enqueueToMid(word: string, difficulty: number, category: QuestionCategory): void {
    const now = Date.now();
    const config = this.tabConfigs[category];

    if (!config.enableMidReview || this.isDuplicateInQueue(word, QueueType.MID)) {
      return;
    }

    const gap = this.calculateMidGap(difficulty);
    const entry: QueueEntry = {
      word,
      queueType: QueueType.MID,
      enqueuedAt: now,
      enqueuedQuestionNumber: this.currentQuestionNumber,
      targetQuestionNumber: this.currentQuestionNumber + gap,
      targetTime: now + 3600000, // 1時間後
      priority: 60,
      difficulty,
      category,
    };

    this.enqueueWithLimit(this.queues.mid, entry, MAX_QUEUE_SIZE.mid);

    const progress = this.acquisitionProgress.get(word)!;
    progress.currentQueue = QueueType.MID;
    progress.queuedAt = now;
  }

  /**
   * 終了時復習キューに追加
   */
  private enqueueToEnd(word: string, difficulty: number, category: QuestionCategory): void {
    const now = Date.now();
    const config = this.tabConfigs[category];

    if (!config.enableEndReview || this.isDuplicateInQueue(word, QueueType.END)) {
      return;
    }

    const entry: QueueEntry = {
      word,
      queueType: QueueType.END,
      enqueuedAt: now,
      enqueuedQuestionNumber: this.currentQuestionNumber,
      targetQuestionNumber: Infinity,
      targetTime: Infinity,
      priority: 40,
      difficulty,
      category,
    };

    this.enqueueWithLimit(this.queues.end, entry, MAX_QUEUE_SIZE.end);

    const progress = this.acquisitionProgress.get(word)!;
    progress.currentQueue = QueueType.END;
    progress.queuedAt = now;
  }

  /**
   * 次の復習問題を取得
   */
  getNextReviewQuestion(): QueueEntry | null {
    this.cleanupExpiredEntries();

    const now = Date.now();
    const currentQ = this.currentQuestionNumber;
    const candidates: QueueEntry[] = [];

    // 全キューから候補を収集
    for (const entry of this.queues.immediate) {
      if (currentQ >= entry.targetQuestionNumber || now >= entry.targetTime) {
        candidates.push(entry);
      }
    }

    for (const entry of this.queues.early) {
      if (currentQ >= entry.targetQuestionNumber || now >= entry.targetTime) {
        candidates.push(entry);
      }
    }

    for (const entry of this.queues.mid) {
      if (currentQ >= entry.targetQuestionNumber || now >= entry.targetTime) {
        candidates.push(entry);
      }
    }

    // 優先度順にソート
    candidates.sort((a, b) => b.priority - a.priority);

    if (candidates.length > 0) {
      const selected = candidates[0];
      this.removeFromQueue(selected);
      return selected;
    }

    return null;
  }

  /**
   * 正答時の処理
   */
  handleCorrectAnswer(
    word: string,
    currentQueue: QueueType,
    responseTime?: number,
    difficulty?: number,
    category?: QuestionCategory
  ): void {
    if (!this.trackWordAttempts(word)) {
      return;
    }

    const progress = this.getAcquisitionProgress(word);
    progress.todayCorrectCount++;
    progress.consecutiveCorrectStreak++; // 連続正答数を増加
    progress.totalAttempts++;
    progress.todayReviews.push({
      timestamp: Date.now(),
      queueType: currentQueue,
      isCorrect: true,
      responseTime,
    });

    // 正答率を更新
    progress.correctRate = progress.todayCorrectCount / progress.totalAttempts;

    // 動的閾値の調整（連続正答が続いたら閾値を下げる）
    if (progress.consecutiveCorrectStreak >= 5 && progress.dynamicThreshold > MIN_THRESHOLD) {
      progress.dynamicThreshold = Math.max(
        MIN_THRESHOLD,
        progress.dynamicThreshold - THRESHOLD_DECREMENT_ON_STREAK
      );
      progress.lastThresholdAdjustment = Date.now();
      console.log(`📉 動的閾値を下げました: ${word} → ${progress.dynamicThreshold}回`);
    }

    // 次のキューへ自動昇格
    // difficultyとcategoryが渡されない場合はentryから取得、それでもなければデフォルト値を使用
    let finalDifficulty: number = difficulty ?? 3;
    let finalCategory: QuestionCategory = category ?? QuestionCategory.MEMORIZATION;

    const entry = this.findWordInQueues(word);
    if (entry) {
      finalDifficulty = entry.difficulty;
      finalCategory = entry.category;
    } else if (difficulty === undefined || category === undefined) {
      // 初回正解時：デフォルト値を使用（ログ削減のため出力なし）
    }

    if (currentQueue === QueueType.IMMEDIATE && this.shouldEnqueueEarly(word, progress)) {
      this.enqueueToEarly(word, finalDifficulty, finalCategory);
    } else if (currentQueue === QueueType.EARLY && this.shouldEnqueueMid(word, progress)) {
      this.enqueueToMid(word, finalDifficulty, finalCategory);
    } else if (currentQueue === QueueType.MID && this.shouldEnqueueEnd(word, progress)) {
      this.enqueueToEnd(word, finalDifficulty, finalCategory);
    } else if (progress.todayCorrectCount === 1 && currentQueue === QueueType.IMMEDIATE) {
      // 初回正解時は即時復習キューに追加
      this.enqueueToImmediate(word, finalDifficulty, finalCategory, 1);
    }

    // 記憶獲得完了判定
    if (this.isAcquisitionComplete(word, progress)) {
      progress.isAcquisitionComplete = true;
      console.log(`✅ 記憶獲得完了: ${word}`);
    }
  }

  /**
   * 誤答時の処理
   */
  handleWrongAnswer(
    word: string,
    currentQueue: QueueType,
    responseTime?: number,
    difficulty?: number,
    category?: QuestionCategory
  ): void {
    if (!this.trackWordAttempts(word)) {
      return;
    }

    const progress = this.getAcquisitionProgress(word);
    progress.todayWrongCount++;
    progress.consecutiveCorrectStreak = 0; // 連続正答数をリセット
    progress.totalAttempts++;
    progress.todayReviews.push({
      timestamp: Date.now(),
      queueType: currentQueue,
      isCorrect: false,
      responseTime,
    });

    // 正答率を更新
    progress.correctRate = progress.todayCorrectCount / progress.totalAttempts;

    // 動的閾値の増加（誤答した単語は定着が難しいため閾値を上げる）
    const _oldThreshold = progress.dynamicThreshold;
    progress.dynamicThreshold = Math.min(
      MAX_THRESHOLD,
      progress.dynamicThreshold + THRESHOLD_INCREMENT_ON_WRONG
    );
    progress.lastThresholdAdjustment = Date.now();

    // 動的閾値更新（ログ削減のため出力なし）

    // 定着完了フラグをリセット（誤答したら再度復習が必要）
    if (progress.isAcquisitionComplete) {
      progress.isAcquisitionComplete = false;
      console.log(`🔄 誤答により定着完了をリセット: ${word}`);
    }

    // 即時復習キューに再追加（リセット）
    // difficultyとcategoryが渡されない場合はentryから取得、それでもなければデフォルト値を使用
    let finalDifficulty: number = difficulty ?? 3;
    let finalCategory: QuestionCategory = category ?? QuestionCategory.MEMORIZATION;

    const entry = this.findWordInQueues(word);
    if (entry) {
      finalDifficulty = entry.difficulty;
      finalCategory = entry.category;
    } else if (difficulty === undefined || category === undefined) {
      // 初回不正解時：デフォルト値を使用してキューに追加（ログ削減のため出力なし）
    }

    // 誤答したら現在のキューから削除して即時復習キューに戻す
    this.removeFromAllQueues(word);

    if (currentQueue !== QueueType.IMMEDIATE) {
      console.log(`❌ 誤答により即時復習キューに戻します: ${word}`);
    }

    // 難易度を上げて即時復習キューに追加
    this.enqueueToImmediate(word, Math.min(finalDifficulty + 1, 5), finalCategory, 1);
  }

  /**
   * セッション終了時復習の開始
   */
  startSessionEndReview(): QueueEntry[] {
    const endQueue = [...this.queues.end];

    if (endQueue.length === 0) {
      console.log('終了時復習なし');
      return [];
    }

    console.log(`終了時復習を開始します（${endQueue.length}語）`);
    return endQueue;
  }

  /**
   * 記憶獲得レポート生成
   */
  generateAcquisitionReport(): AcquisitionReport {
    const allWords = Array.from(this.acquisitionProgress.keys());
    const completed: string[] = [];
    const incomplete: string[] = [];

    for (const word of allWords) {
      const progress = this.acquisitionProgress.get(word)!;
      if (progress.isAcquisitionComplete) {
        completed.push(word);
      } else {
        incomplete.push(word);
      }
    }

    return {
      totalWords: allWords.length,
      completed: completed.length,
      incomplete: incomplete.length,
      completionRate: allWords.length > 0 ? completed.length / allWords.length : 0,
      incompleteWords: incomplete,
    };
  }

  /**
   * キュー統計取得
   */
  getQueueStatistics(): QueueStatistics {
    return {
      immediate: {
        size: this.queues.immediate.length,
        oldestEntry: this.queues.immediate[0]?.enqueuedAt,
        averageWaitTime: this.calculateAverageWaitTime(this.queues.immediate),
      },
      early: {
        size: this.queues.early.length,
        oldestEntry: this.queues.early[0]?.enqueuedAt,
        averageWaitTime: this.calculateAverageWaitTime(this.queues.early),
      },
      mid: {
        size: this.queues.mid.length,
        oldestEntry: this.queues.mid[0]?.enqueuedAt,
        averageWaitTime: this.calculateAverageWaitTime(this.queues.mid),
      },
      end: {
        size: this.queues.end.length,
        oldestEntry: this.queues.end[0]?.enqueuedAt,
        averageWaitTime: 0,
      },
    };
  }

  /**
   * 進捗取得
   */
  getAcquisitionProgress(word: string): AcquisitionProgress {
    if (!this.acquisitionProgress.has(word)) {
      // カテゴリを推定して初期閾値を設定
      const entry = this.findWordInQueues(word);
      const category = entry?.category || QuestionCategory.MEMORIZATION;
      const initialThreshold = this.tabConfigs[category].consolidationThreshold;

      this.acquisitionProgress.set(word, {
        todayFirstSeen: Date.now(),
        todayCorrectCount: 0,
        todayWrongCount: 0,
        isAcquisitionComplete: false,
        currentQueue: null,
        queuedAt: 0,
        todayReviews: [],
        // 動的閾値システム
        dynamicThreshold: initialThreshold,
        consecutiveCorrectStreak: 0,
        totalAttempts: 0,
        correctRate: 0,
        lastThresholdAdjustment: Date.now(),
      });
    }
    return this.acquisitionProgress.get(word)!;
  }

  /**
   * 問題番号をインクリメント
   */
  incrementQuestionNumber(): void {
    this.currentQuestionNumber++;
  }

  /**
   * リセット
   */
  reset(): void {
    this.queues = {
      immediate: [],
      early: [],
      mid: [],
      end: [],
    };
    this.currentQuestionNumber = 0;
    this.sessionStartTime = Date.now();
    this.wordAttempts.clear();
    this.acquisitionProgress.clear();
  }

  /**
   * キュー情報を取得
   */
  getQueueInfo(word: string): { queueType: QueueType; questionNumber: number } | null {
    const entry = this.findWordInQueues(word);
    if (!entry) return null;

    return {
      queueType: entry.queueType,
      questionNumber: entry.targetQuestionNumber,
    };
  }

  /**
   * キューサイズを取得
   */
  getQueueSizes(): { immediate: number; early: number; mid: number; end: number } {
    return {
      immediate: this.queues.immediate.length,
      early: this.queues.early.length,
      mid: this.queues.mid.length,
      end: this.queues.end.length,
    };
  }

  /**
   * キューをエクスポート
   */
  exportQueues(): {
    immediate: QueueEntry[];
    early: QueueEntry[];
    mid: QueueEntry[];
    end: QueueEntry[];
  } {
    return {
      immediate: [...this.queues.immediate],
      early: [...this.queues.early],
      mid: [...this.queues.mid],
      end: [...this.queues.end],
    };
  }

  /**
   * 全キューをクリア
   */
  clearQueues(): void {
    this.queues.immediate = [];
    this.queues.early = [];
    this.queues.mid = [];
    this.queues.end = [];
  }

  /**
   * 回答を記録（シンプルなインターフェース）
   */
  recordAnswer(word: string, isCorrect: boolean, responseTime: number): void {
    const progress = this.getAcquisitionProgress(word);
    const currentQueue = progress.currentQueue || QueueType.IMMEDIATE;

    if (isCorrect) {
      this.handleCorrectAnswer(word, currentQueue, responseTime);
    } else {
      this.handleWrongAnswer(word, currentQueue, responseTime);
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  private shouldEnqueueImmediate(difficulty: number): boolean {
    return difficulty >= 3;
  }

  private shouldEnqueueEarly(word: string, progress: AcquisitionProgress): boolean {
    return progress.todayCorrectCount >= 1;
  }

  private shouldEnqueueMid(word: string, progress: AcquisitionProgress): boolean {
    return progress.todayCorrectCount >= 2;
  }

  private shouldEnqueueEnd(word: string, progress: AcquisitionProgress): boolean {
    return progress.todayCorrectCount >= 3;
  }

  private calculateImmediateGap(difficulty: number): number {
    if (difficulty >= 4) return 1;
    if (difficulty === 3) return 2;
    return 3;
  }

  private calculateEarlyGap(difficulty: number): number {
    if (difficulty >= 4) return 5;
    if (difficulty === 3) return 7;
    return 10;
  }

  private calculateMidGap(difficulty: number): number {
    if (difficulty >= 4) return 20;
    if (difficulty === 3) return 25;
    return 30;
  }

  private isAcquisitionComplete(word: string, progress: AcquisitionProgress): boolean {
    // 科学的根拠に基づく定着判定（エビングハウスの忘却曲線 + SuperMemo SM-2 + 分散学習理論）

    // 条件1: 動的閾値以上の正答回数（個人適応型）
    if (progress.todayCorrectCount < progress.dynamicThreshold) {
      return false;
    }

    // 条件2: 正答率が85%以上（認知心理学：85%の習熟度で長期記憶へ移行）
    if (progress.correctRate < MIN_CORRECT_RATE_FOR_COMPLETION) {
      console.log(
        `❌ 定着未完了 (${word}): 正答率 ${(progress.correctRate * 100).toFixed(1)}% < ${(MIN_CORRECT_RATE_FOR_COMPLETION * 100).toFixed(0)}%`
      );
      return false;
    }

    // 条件3: 連続正答数が4回以上（分散学習理論：4回の成功で記憶が定着）
    if (progress.consecutiveCorrectStreak < MIN_CONSECUTIVE_CORRECT) {
      console.log(
        `❌ 定着未完了 (${word}): 連続正答数 ${progress.consecutiveCorrectStreak} < ${MIN_CONSECUTIVE_CORRECT}`
      );
      return false;
    }

    // 条件4: 最低でも3つのキューを通過（即時→早期→中期）
    // 科学的根拠：間隔反復学習では異なる時間間隔での復習が必要
    const uniqueQueues = new Set(
      progress.todayReviews.filter((r) => r.isCorrect).map((r) => r.queueType)
    );
    if (uniqueQueues.size < 3) {
      console.log(
        `❌ 定着未完了 (${word}): キュー通過数 ${uniqueQueues.size} < 3（間隔反復が不足）`
      );
      return false;
    }

    // 条件5: 総出題回数が最低6回以上（SuperMemo SM-2: 6回の復習で長期記憶へ）
    if (progress.totalAttempts < 6) {
      console.log(`❌ 定着未完了 (${word}): 総出題回数 ${progress.totalAttempts} < 6`);
      return false;
    }

    // 条件6: 最終的な確認（直近の復習履歴をチェック）
    const recentReviews = progress.todayReviews.slice(-MIN_CONSECUTIVE_CORRECT);
    const allRecentCorrect =
      recentReviews.length >= MIN_CONSECUTIVE_CORRECT && recentReviews.every((r) => r.isCorrect);
    if (!allRecentCorrect) {
      console.log(`❌ 定着未完了 (${word}): 直近${MIN_CONSECUTIVE_CORRECT}回が全て正答ではない`);
      return false;
    }

    console.log(
      `✅ 定着完了 (${word}): 正答率 ${(progress.correctRate * 100).toFixed(1)}%, 連続正答 ${progress.consecutiveCorrectStreak}, 閾値 ${progress.dynamicThreshold}, 総出題 ${progress.totalAttempts}回`
    );
    return true;
  }

  private isDuplicateInQueue(word: string, queueType: QueueType): boolean {
    return this.queues[queueType].some((entry) => entry.word === word);
  }

  private enqueueWithLimit(queue: QueueEntry[], entry: QueueEntry, maxSize: number): void {
    if (queue.length >= maxSize) {
      // キューが満杯の場合は古いエントリを削除（これは正常動作）
      // ログ削減のため出力なし
      queue.shift();
    }
    queue.push(entry);
  }

  private removeFromQueue(entry: QueueEntry): void {
    const queueName = entry.queueType;
    const queue = this.queues[queueName];
    const index = queue.findIndex((e) => e.word === entry.word);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }

  private removeFromAllQueues(word: string): void {
    for (const queueType of Object.keys(this.queues) as QueueType[]) {
      this.queues[queueType] = this.queues[queueType].filter((e) => e.word !== word);
    }
  }

  private findWordInQueues(word: string): QueueEntry | null {
    for (const queueType of Object.keys(this.queues) as QueueType[]) {
      const entry = this.queues[queueType].find((e) => e.word === word);
      if (entry) return entry;
    }
    return null;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const queueType of Object.keys(this.queues) as QueueType[]) {
      this.queues[queueType] = this.queues[queueType].filter((entry) => {
        const age = now - entry.enqueuedAt;
        if (age > QUEUE_EXPIRY_TIME) {
          console.warn(`期限切れエントリを削除: ${entry.word}`);
          return false;
        }
        return true;
      });
    }
  }

  private trackWordAttempts(word: string): boolean {
    if (!this.wordAttempts.has(word)) {
      this.wordAttempts.set(word, 0);
    }

    const attempts = this.wordAttempts.get(word)! + 1;
    this.wordAttempts.set(word, attempts);

    const progress = this.getAcquisitionProgress(word);

    // 永遠に出題：不正解が続く限り継続（MAX_SAME_WORD_ATTEMPTS = Infinity）
    // 科学的根拠：習熟度が達成されるまで反復学習を継続（Mastery Learning理論）
    if (attempts % 50 === 0 && progress.todayCorrectCount < progress.dynamicThreshold) {
      console.log(
        `🔄 単語 "${word}" を${attempts}回出題しました（正答率: ${(progress.correctRate * 100).toFixed(1)}%, 閾値: ${progress.dynamicThreshold}回）`
      );
      console.log(`   ✅ 定着まで継続出題します（不正解が続く限り永遠に出題）`);
    }

    // 常にtrueを返す：永遠に出題を継続
    return true;
  }

  private calculateAverageWaitTime(queue: QueueEntry[]): number {
    if (queue.length === 0) return 0;

    const now = Date.now();
    const totalWaitTime = queue.reduce((sum, entry) => {
      return sum + (now - entry.enqueuedAt);
    }, 0);

    return totalWaitTime / queue.length;
  }
}

/**
 * 復習効率の計算
 */
export function calculateAcquisitionEfficiency(manager: AcquisitionQueueManager): number {
  const report = manager.generateAcquisitionReport();

  if (report.completed === 0) {
    return 0;
  }

  // 全単語の総復習回数を計算
  let totalReviewCount = 0;
  for (const word of [...Array(report.totalWords)].map((_, i) => `word${i}`)) {
    const progress = manager.getAcquisitionProgress(word);
    totalReviewCount += progress.todayReviews.length;
  }

  // 平均復習回数 = 総復習回数 / 完了単語数
  const avgReviewsPerWord = totalReviewCount / report.completed;

  // 効率 = 理想回数(3) / 実際の平均回数
  const efficiency = 3.0 / avgReviewsPerWord;

  return Math.min(efficiency, 1.0); // 最大1.0
}

/**
 * 動的閾値システムのレポート
 */
export interface DynamicThresholdReport {
  word: string;
  dynamicThreshold: number;
  correctRate: number;
  consecutiveCorrectStreak: number;
  totalAttempts: number;
  todayCorrectCount: number;
  todayWrongCount: number;
  isComplete: boolean;
  needsMorePractice: boolean; // 正答率80%未満または連続正答3回未満
}

/**
 * すべての単語の動的閾値状態を取得
 */
export function getDynamicThresholdReport(
  manager: AcquisitionQueueManager,
  words: string[]
): DynamicThresholdReport[] {
  return words
    .map((word) => {
      const progress = manager.getAcquisitionProgress(word);
      return {
        word,
        dynamicThreshold: progress.dynamicThreshold,
        correctRate: progress.correctRate,
        consecutiveCorrectStreak: progress.consecutiveCorrectStreak,
        totalAttempts: progress.totalAttempts,
        todayCorrectCount: progress.todayCorrectCount,
        todayWrongCount: progress.todayWrongCount,
        isComplete: progress.isAcquisitionComplete,
        needsMorePractice:
          progress.correctRate < MIN_CORRECT_RATE_FOR_COMPLETION ||
          progress.consecutiveCorrectStreak < MIN_CONSECUTIVE_CORRECT,
      };
    })
    .sort((a, b) => {
      // 定着が必要な単語を優先
      if (a.needsMorePractice && !b.needsMorePractice) return -1;
      if (!a.needsMorePractice && b.needsMorePractice) return 1;
      // 正答率が低い順
      return a.correctRate - b.correctRate;
    });
}

/**
 * 要復習単語の統計
 */
export interface ReviewStatistics {
  totalWords: number;
  needsReview: number; // 正答率80%未満または連続正答3回未満
  criticalWords: number; // 正答率50%未満
  averageThreshold: number; // 平均閾値
  averageCorrectRate: number; // 平均正答率
  maxThresholdWords: string[]; // 閾値が最大（50回）の単語
}

/**
 * 復習が必要な単語の統計を取得
 */
export function getReviewStatistics(
  manager: AcquisitionQueueManager,
  words: string[]
): ReviewStatistics {
  const reports = getDynamicThresholdReport(manager, words);

  const needsReview = reports.filter((r) => r.needsMorePractice).length;
  const criticalWords = reports.filter((r) => r.correctRate < 0.5).length;

  const totalThreshold = reports.reduce((sum, r) => sum + r.dynamicThreshold, 0);
  const totalCorrectRate = reports.reduce((sum, r) => sum + r.correctRate, 0);

  const maxThresholdWords = reports
    .filter((r) => r.dynamicThreshold >= MAX_THRESHOLD)
    .map((r) => r.word);

  return {
    totalWords: reports.length,
    needsReview,
    criticalWords,
    averageThreshold: reports.length > 0 ? totalThreshold / reports.length : 0,
    averageCorrectRate: reports.length > 0 ? totalCorrectRate / reports.length : 0,
    maxThresholdWords,
  };
}
