/**
 * 記憶獲得アルゴリズム
 *
 * 「その日のうちに一旦100％記憶を定着させる」ための同日集中復習システム。
 * 4段階の復習タイミング（即時→早期→中期→終了時）で記憶統合を促進。
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
  isAcquisitionComplete: boolean; // 記憶獲得完了フラグ
  currentQueue: QueueType | null; // 現在のキュー
  queuedAt: number; // キューに追加された時刻
  todayReviews: ReviewRecord[]; // 今日の復習記録
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

// デフォルトタブ設定
export const DEFAULT_TAB_CONFIGS: Record<QuestionCategory, TabConfig> = {
  [QuestionCategory.MEMORIZATION]: {
    consolidationThreshold: 3,
    enableImmediateReview: true,
    enableEarlyReview: true,
    enableMidReview: true,
    enableEndReview: true,
    newQuestionRatio: 0.6,
  },
  [QuestionCategory.TRANSLATION]: {
    consolidationThreshold: 2,
    enableImmediateReview: true,
    enableEarlyReview: false,
    enableMidReview: false,
    enableEndReview: true,
    newQuestionRatio: 0.7,
  },
  [QuestionCategory.SPELLING]: {
    consolidationThreshold: 4,
    enableImmediateReview: true,
    enableEarlyReview: true,
    enableMidReview: true,
    enableEndReview: true,
    newQuestionRatio: 0.5,
  },
  [QuestionCategory.GRAMMAR]: {
    consolidationThreshold: 3,
    enableImmediateReview: true,
    enableEarlyReview: true,
    enableMidReview: false,
    enableEndReview: true,
    newQuestionRatio: 0.6,
  },
};

// キューサイズ制限
const MAX_QUEUE_SIZE = {
  immediate: 10,
  early: 20,
  mid: 30,
  end: 50,
};

const QUEUE_EXPIRY_TIME = 7200000; // 2時間
const MAX_SAME_WORD_ATTEMPTS = 10;

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
    progress.todayReviews.push({
      timestamp: Date.now(),
      queueType: currentQueue,
      isCorrect: true,
      responseTime,
    });

    // 次のキューへ自動昇格
    // difficultyとcategoryが渡されない場合はentryから取得
    let finalDifficulty = difficulty;
    let finalCategory = category;

    if (finalDifficulty === undefined || finalCategory === undefined) {
      const entry = this.findWordInQueues(word);
      if (entry) {
        finalDifficulty = entry.difficulty;
        finalCategory = entry.category;
      }
    }

    if (finalDifficulty !== undefined && finalCategory !== undefined) {
      if (currentQueue === QueueType.IMMEDIATE && this.shouldEnqueueEarly(word, progress)) {
        this.enqueueToEarly(word, finalDifficulty, finalCategory);
      } else if (currentQueue === QueueType.EARLY && this.shouldEnqueueMid(word, progress)) {
        this.enqueueToMid(word, finalDifficulty, finalCategory);
      } else if (currentQueue === QueueType.MID && this.shouldEnqueueEnd(word, progress)) {
        this.enqueueToEnd(word, finalDifficulty, finalCategory);
      }
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
    progress.todayReviews.push({
      timestamp: Date.now(),
      queueType: currentQueue,
      isCorrect: false,
      responseTime,
    });

    // 即時復習キューに再追加（リセット）
    // difficultyとcategoryが渡されない場合はentryから取得
    let finalDifficulty = difficulty;
    let finalCategory = category;

    if (finalDifficulty === undefined || finalCategory === undefined) {
      const entry = this.findWordInQueues(word);
      if (entry) {
        finalDifficulty = entry.difficulty;
        finalCategory = entry.category;
      }
    }

    if (finalDifficulty !== undefined && finalCategory !== undefined) {
      // 誤答したら現在のキューから削除して即時復習キューに戻す
      this.removeFromAllQueues(word);

      if (currentQueue !== QueueType.IMMEDIATE) {
        console.log(`❌ 誤答により即時復習キューに戻します: ${word}`);
      }

      // 難易度を上げて即時復習キューに追加
      this.enqueueToImmediate(word, Math.min(finalDifficulty + 1, 5), finalCategory, 1);
    }
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
      this.acquisitionProgress.set(word, {
        todayFirstSeen: Date.now(),
        todayCorrectCount: 0,
        todayWrongCount: 0,
        isAcquisitionComplete: false,
        currentQueue: null,
        queuedAt: 0,
        todayReviews: [],
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
    const entry = this.findWordInQueues(word);
    if (!entry) return false;

    const config = this.tabConfigs[entry.category];
    const threshold = config.consolidationThreshold;

    // 条件1: 閾値回数以上正答
    if (progress.todayCorrectCount < threshold) {
      return false;
    }

    // 条件2: 最低でも2つのキューを通過
    const uniqueQueues = new Set(
      progress.todayReviews.filter((r) => r.isCorrect).map((r) => r.queueType)
    );
    if (uniqueQueues.size < 2) {
      return false;
    }

    // 条件3: 最後の2回が連続正答
    const recentReviews = progress.todayReviews.slice(-2);
    if (recentReviews.length < 2 || !recentReviews.every((r) => r.isCorrect)) {
      return false;
    }

    return true;
  }

  private isDuplicateInQueue(word: string, queueType: QueueType): boolean {
    return this.queues[queueType].some((entry) => entry.word === word);
  }

  private enqueueWithLimit(queue: QueueEntry[], entry: QueueEntry, maxSize: number): void {
    if (queue.length >= maxSize) {
      console.warn(`キューが満杯です（${maxSize}語）。古いエントリを削除します。`);
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

    if (attempts >= MAX_SAME_WORD_ATTEMPTS) {
      console.error(`同じ単語の試行回数が上限に達しました: ${word}`);
      this.removeFromAllQueues(word);
      return false;
    }

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
