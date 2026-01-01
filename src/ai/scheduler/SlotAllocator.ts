/**
 * SlotAllocator - スロット割当アルゴリズム
 *
 * カテゴリー別に出題枠（スロット）を割り当て
 *
 * 【割当フロー】
 * 1. カテゴリー分類（CategoryClassifier）
 * 2. カテゴリー内Position計算（CategoryPositionCalculator）
 * 3. スロット設定取得（SlotConfigManager）
 * 4. カテゴリー別にスロット割当
 * 5. 余剰スロットの再配分
 * 6. 最終的な出題順序を決定
 *
 * 【使用例】
 * ```typescript
 * const allocator = new SlotAllocator();
 * const result = allocator.allocateSlots({
 *   questions,
 *   progressMap,
 *   mode: 'memorization',
 *   totalSlots: 100,
 * });
 * ```
 */

import type { Question } from '@/types';
import type { WordProgress } from '@/storage/progress/types';
import type { LearningCategory, CategoryStats, BatchSlotConfig, CategoryPosition } from './types';
import { CategoryClassifier } from './CategoryClassifier';
import { CategoryPositionCalculator } from './CategoryPositionCalculator';
import { SlotConfigManager } from './SlotConfigManager';
import { getStrengthLookupForScheduling } from '@/ai/utils/vocabularyNetwork';
import { logger } from '@/utils/logger';

export interface SlotAllocationParams {
  /** 出題候補の問題リスト */
  questions: Question[];

  /** 学習進捗マップ */
  progressMap: Record<string, WordProgress>;

  /** 学習モード */
  mode: 'memorization' | 'translation' | 'spelling' | 'grammar';

  /** 総スロット数（出題数） */
  totalSlots: number;

  /** スロット設定（省略時はSlotConfigManagerから取得） */
  slotConfig?: BatchSlotConfig;

  /** 直近出題語（いもづる式学習用） */
  recentWords?: string[];

  /** いもづる式学習を有効化 */
  useChainLearning?: boolean;
}

export interface SlotAllocationResult {
  /** 割り当てられた問題リスト（出題順） */
  allocatedQuestions: Question[];

  /** カテゴリー統計 */
  stats: CategoryStats;

  /** カテゴリー別の割り当て詳細 */
  categoryDetails: Record<
    LearningCategory,
    {
      requested: number;
      allocated: number;
      words: string[];
    }
  >;
}

export class SlotAllocator {
  private classifier: CategoryClassifier;
  private positionCalculator: CategoryPositionCalculator;
  private configManager: SlotConfigManager;
  private debugMode: boolean;

  private static readonly REGULAR_TIE_WINDOW = 8;
  private static readonly REGULAR_TIE_MAX_DELTA = 3;
  private static readonly REGULAR_TIE_MIN_STRENGTH = 40;

  constructor() {
    this.classifier = new CategoryClassifier();
    this.positionCalculator = new CategoryPositionCalculator();
    this.configManager = new SlotConfigManager({ debugMode: import.meta.env.DEV });
    // スイッチ類を減らす方針: DEVでは常に有効（本番では無効）
    this.debugMode = import.meta.env.DEV;
  }

  /**
   * スロットを割り当て
   */
  allocateSlots(params: SlotAllocationParams): SlotAllocationResult {
    const startTime = performance.now();

    // 1. スロット設定を取得
    let slotConfig = params.slotConfig || this.configManager.getSlotConfig(params.mode);

    // 🆕 動的上限システム: 分からない・まだまだの上限チェック
    if (params.mode === 'memorization') {
      slotConfig = this.applyDynamicLimits(slotConfig, params.progressMap, params.totalSlots);
    }

    // 2. 単語をカテゴリー別に分類
    const categorizedWords = this.categorizeWords(params.questions, params.progressMap, params.mode);

    // 3. カテゴリー内Positionを計算してソート
    const sortedByCategory = this.sortWordsByCategory(
      categorizedWords,
      params.progressMap,
      params.mode
    );

    // 4. スロット数を計算
    const allocatedSlots = this.calculateSlots(slotConfig, params.totalSlots, categorizedWords);

    // 5. 余剰スロットを再配分
    const finalSlots = this.redistributeSurplus(allocatedSlots, categorizedWords, params.totalSlots);

    // 6. 各カテゴリーからスロット数だけ選出
    // 🆕 いもづる式学習が有効な場合はメタデータ優先版を使用
    const selectedWords = params.useChainLearning
      ? this.selectFromCategoriesWithChaining(
          sortedByCategory,
          finalSlots,
          slotConfig,
          params.recentWords || [],
          params.questions
        )
      : this.selectFromCategories(sortedByCategory, finalSlots);

    // 7. 出題順序を決定（カテゴリーミックス）
    const orderedQuestions = this.arrangeQuestions(selectedWords, params.questions);

    // 8. 統計を生成
    const stats = this.generateStats(allocatedSlots, finalSlots, categorizedWords);

    const processingTime = performance.now() - startTime;

    if (this.debugMode) {
      logger.info('[SlotAllocator] スロット割当完了', {
        totalSlots: params.totalSlots,
        allocated: orderedQuestions.length,
        useChainLearning: params.useChainLearning,
        processingTime: `${processingTime.toFixed(2)}ms`,
        stats,
      });
    }

    return {
      allocatedQuestions: orderedQuestions,
      stats,
      categoryDetails: this.generateCategoryDetails(finalSlots, selectedWords),
    };
  }

  /**
   * 単語をカテゴリー別に分類
   */
  private categorizeWords(
    questions: Question[],
    progressMap: Record<string, WordProgress>,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): Record<LearningCategory, string[]> {
    const categorized: Record<LearningCategory, string[]> = {
      new: [],
      incorrect: [],
      still_learning: [],
      mastered: [],
    };

    for (const question of questions) {
      const word = question.word;
      const progress = progressMap[word];

      if (!progress) {
        categorized.new.push(word);
        continue;
      }

      const category = this.classifier.determineCategory(progress, mode);
      categorized[category].push(word);
    }

    return categorized;
  }

  /**
   * カテゴリー内でPositionソート
   */
  private sortWordsByCategory(
    categorizedWords: Record<LearningCategory, string[]>,
    progressMap: Record<string, WordProgress>,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar'
  ): Record<LearningCategory, Array<{ word: string; position: CategoryPosition }>> {
    const sorted: Record<LearningCategory, Array<{ word: string; position: CategoryPosition }>> = {
      new: [],
      incorrect: [],
      still_learning: [],
      mastered: [],
    };

    for (const category of Object.keys(categorizedWords) as LearningCategory[]) {
      const words = categorizedWords[category];
      sorted[category] = this.positionCalculator.sortByPriority(words, progressMap, category, mode);
    }

    return sorted;
  }

  /**
   * スロット数を計算
   */
  private calculateSlots(
    slotConfig: BatchSlotConfig,
    totalSlots: number,
    _categorizedWords: Record<LearningCategory, string[]>
  ): Record<LearningCategory, number> {
    return {
      new: Math.floor(totalSlots * slotConfig.newRatio),
      incorrect: Math.floor(totalSlots * slotConfig.incorrectRatio),
      still_learning: Math.floor(totalSlots * slotConfig.stillLearningRatio),
      mastered: Math.floor(totalSlots * slotConfig.masteredRatio),
    };
  }

  /**
   * 余剰スロットを再配分
   *
   * 優先順位: incorrect > still_learning > new > mastered
   */
  private redistributeSurplus(
    allocatedSlots: Record<LearningCategory, number>,
    categorizedWords: Record<LearningCategory, string[]>,
    _totalSlots: number
  ): Record<LearningCategory, number> {
    const finalSlots = { ...allocatedSlots };
    let surplus = 0;

    // 1. 各カテゴリーで実際の語数がスロット数より少ない場合、余剰を計算
    for (const category of Object.keys(finalSlots) as LearningCategory[]) {
      const allocated = finalSlots[category];
      const available = categorizedWords[category].length;

      if (available < allocated) {
        surplus += allocated - available;
        finalSlots[category] = available;
      }
    }

    if (surplus === 0) return finalSlots;

    // 2. 余剰を優先度順に再配分
    const priorityOrder: LearningCategory[] = ['incorrect', 'still_learning', 'new', 'mastered'];

    for (const category of priorityOrder) {
      if (surplus === 0) break;

      const allocated = finalSlots[category];
      const available = categorizedWords[category].length;
      const canAdd = available - allocated;

      if (canAdd > 0) {
        const toAdd = Math.min(surplus, canAdd);
        finalSlots[category] += toAdd;
        surplus -= toAdd;
      }
    }

    if (this.debugMode && surplus > 0) {
      logger.warn('[SlotAllocator] 余剰スロットを完全に再配分できませんでした', {
        surplus,
        finalSlots,
      });
    }

    return finalSlots;
  }

  /**
   * 各カテゴリーからスロット数だけ選出
   */
  private selectFromCategories(
    sortedByCategory: Record<LearningCategory, Array<{ word: string; position: CategoryPosition }>>,
    finalSlots: Record<LearningCategory, number>
  ): Record<LearningCategory, string[]> {
    const selected: Record<LearningCategory, string[]> = {
      new: [],
      incorrect: [],
      still_learning: [],
      mastered: [],
    };

    for (const category of Object.keys(sortedByCategory) as LearningCategory[]) {
      const sorted = sortedByCategory[category];
      const slotCount = finalSlots[category];

      // Position降順で上位N個を選出
      selected[category] = sorted.slice(0, slotCount).map((item) => item.word);
    }

    return selected;
  }

  /**
   * 各カテゴリーからスロット数だけ選出（いもづる式優先版）
   *
   * メタデータの結びつきが強い語を優先的に選出
   */
  private selectFromCategoriesWithChaining(
    sortedByCategory: Record<LearningCategory, Array<{ word: string; position: CategoryPosition }>>,
    finalSlots: Record<LearningCategory, number>,
    slotConfig: BatchSlotConfig,
    recentWords: string[],
    questions: Question[]
  ): Record<LearningCategory, string[]> {
    const selected: Record<LearningCategory, string[]> = {
      new: [],
      incorrect: [],
      still_learning: [],
      mastered: [],
    };

    // 語彙ネットワークの結びつき強度を取得
    // - QuestionのrelatedFields等を使って近傍を作るため、実際のquestionsを渡す
    const strengthLookup = getStrengthLookupForScheduling(questions);

    for (const category of Object.keys(sortedByCategory) as LearningCategory[]) {
      const sorted = sortedByCategory[category];
      const slotCount = finalSlots[category];

      if (slotCount === 0 || sorted.length === 0) continue;

      // いもづる優先枠（カテゴリースロットの30%まで）
      const chainLearningRatio = slotConfig.chainLearningRatio || 0.3;
      const chainSlots = Math.floor(slotCount * chainLearningRatio);
      const regularSlots = slotCount - chainSlots;

      const selectedInCategory: string[] = [];

      // 1. メタデータ優先枠（直近語との結びつきが強い語）
      if (chainSlots > 0 && recentWords.length > 0) {
        const chainCandidates = this.findRelatedWords(
          sorted.map((item) => item.word),
          recentWords,
          strengthLookup,
          70 // 結びつき強度の閾値
        );

        selectedInCategory.push(...chainCandidates.slice(0, chainSlots));

        if (this.debugMode && chainCandidates.length > 0) {
          logger.info(`[SlotAllocator] いもづる優先: ${category}`, {
            chainSlots,
            selected: chainCandidates.slice(0, chainSlots),
          });
        }
      }

      // 2. 残りはPosition順（いもづる優先で選ばれなかった語）
      const remainingItems = sorted.filter((item) => !selectedInCategory.includes(item.word));

      // ✅ 通常枠（regularSlots）にも「僅差のみ関連性でタイブレーク」を適用
      // - まずはPosition（categoryPosition）順
      // - Positionが近い上位候補に限り、直近語との関連性が高い語を前に出す
      const regularPick = this.selectRegularWithRelatedTieBreak({
        remainingItems,
        count: regularSlots,
        recentWords,
        strengthLookup,
        window: SlotAllocator.REGULAR_TIE_WINDOW,
        maxDelta: SlotAllocator.REGULAR_TIE_MAX_DELTA,
        minStrength: SlotAllocator.REGULAR_TIE_MIN_STRENGTH,
      });

      selectedInCategory.push(...regularPick.selected);

      if (this.debugMode && regularPick.tieBreakAppliedCount > 0) {
        logger.info(`[SlotAllocator] 通常枠タイブレーク発動: ${category}`, {
          applied: regularPick.tieBreakAppliedCount,
          window: SlotAllocator.REGULAR_TIE_WINDOW,
          maxDelta: SlotAllocator.REGULAR_TIE_MAX_DELTA,
          minStrength: SlotAllocator.REGULAR_TIE_MIN_STRENGTH,
        });
      }

      selected[category] = selectedInCategory;
    }

    return selected;
  }

  private selectRegularWithRelatedTieBreak(params: {
    remainingItems: Array<{ word: string; position: CategoryPosition }>;
    count: number;
    recentWords: string[];
    strengthLookup: Map<string, Map<string, number>>;
    window: number;
    maxDelta: number;
    minStrength: number;
  }): { selected: string[]; tieBreakAppliedCount: number } {
    const selected: string[] = [];
    const pool = [...params.remainingItems];

    let tieBreakAppliedCount = 0;

    if (params.count <= 0 || pool.length === 0) return { selected, tieBreakAppliedCount };

    const canUseRelatedness = params.recentWords.length > 0 && params.strengthLookup.size > 0;

    while (selected.length < params.count && pool.length > 0) {
      if (!canUseRelatedness) {
        selected.push(pool.shift()!.word);
        continue;
      }

      const top = pool[0];
      const topPos = top.position.positionInCategory;

      // Positionが僅差の上位候補だけをタイブレーク対象にする
      const candidates = pool
        .slice(0, Math.min(params.window, pool.length))
        .filter((item) => topPos - item.position.positionInCategory <= params.maxDelta);

      if (candidates.length <= 1) {
        selected.push(pool.shift()!.word);
        continue;
      }

      const computeMaxStrength = (word: string): number => {
        let maxStrength = 0;
        for (const recentWord of params.recentWords) {
          const s = params.strengthLookup.get(recentWord)?.get(word) || 0;
          if (s > maxStrength) maxStrength = s;
        }
        return maxStrength;
      };

      const topStrength = computeMaxStrength(top.word);

      let bestIndexInPool = 0;
      let bestStrength = topStrength;

      for (let i = 1; i < candidates.length; i++) {
        const strength = computeMaxStrength(candidates[i].word);
        if (strength > bestStrength) {
          bestStrength = strength;
          bestIndexInPool = i;
        }
      }

      // 関連性が十分強い場合だけ、上位候補の入れ替えを許可
      if (bestIndexInPool > 0 && bestStrength >= params.minStrength && bestStrength > topStrength) {
        const bestWord = candidates[bestIndexInPool].word;
        const removeIndex = pool.findIndex((item) => item.word === bestWord);
        if (removeIndex >= 0) {
          pool.splice(removeIndex, 1);
          selected.push(bestWord);
          tieBreakAppliedCount += 1;
          continue;
        }
      }

      selected.push(pool.shift()!.word);
    }

    return { selected, tieBreakAppliedCount };
  }

  /**
   * 直近語と結びつきが強い語を探す
   *
   * @param candidates 候補語リスト
   * @param recentWords 直近出題語（5-10語）
   * @param strengthLookup 結びつき強度マップ
   * @param threshold 結びつき強度の閾値（0-100）
   * @returns 結びつきが強い順にソートされた語リスト
   */
  private findRelatedWords(
    candidates: string[],
    recentWords: string[],
    strengthLookup: Map<string, Map<string, number>>,
    threshold: number
  ): string[] {
    const wordStrengths: Array<{ word: string; maxStrength: number }> = [];

    for (const word of candidates) {
      let maxStrength = 0;

      // 直近語との最大結びつき強度を計算
      for (const recentWord of recentWords) {
        const strength = strengthLookup.get(recentWord)?.get(word) || 0;
        if (strength > maxStrength) {
          maxStrength = strength;
        }
      }

      if (maxStrength >= threshold) {
        wordStrengths.push({ word, maxStrength });
      }
    }

    // 結びつき強度降順でソート
    return wordStrengths
      .sort((a, b) => b.maxStrength - a.maxStrength)
      .map((item) => item.word);
  }

  /**
   * 出題順序を決定（カテゴリーミックス）
   *
   * incorrect, still_learning, new, mastered の順にインターリーブ
   */
  private arrangeQuestions(
    selectedWords: Record<LearningCategory, string[]>,
    allQuestions: Question[]
  ): Question[] {
    const wordToQuestion = new Map<string, Question>();
    for (const q of allQuestions) {
      wordToQuestion.set(q.word, q);
    }

    const arranged: Question[] = [];
    const categories: LearningCategory[] = ['incorrect', 'still_learning', 'new', 'mastered'];
    const indices: Record<LearningCategory, number> = {
      incorrect: 0,
      still_learning: 0,
      new: 0,
      mastered: 0,
    };

    // ラウンドロビンでカテゴリーから1つずつ選出
    let hasMore = true;
    while (hasMore) {
      hasMore = false;

      for (const category of categories) {
        const words = selectedWords[category];
        const index = indices[category];

        if (index < words.length) {
          const word = words[index];
          const question = wordToQuestion.get(word);
          if (question) {
            arranged.push(question);
          }
          indices[category]++;
          hasMore = true;
        }
      }
    }

    return arranged;
  }

  /**
   * 統計を生成
   */
  private generateStats(
    allocatedSlots: Record<LearningCategory, number>,
    finalSlots: Record<LearningCategory, number>,
    categorizedWords: Record<LearningCategory, string[]>
  ): CategoryStats {
    const counts: Record<LearningCategory, number> = {
      new: categorizedWords.new.length,
      incorrect: categorizedWords.incorrect.length,
      still_learning: categorizedWords.still_learning.length,
      mastered: categorizedWords.mastered.length,
    };

    const totalAllocated = Object.values(finalSlots).reduce((sum, count) => sum + count, 0);
    const totalAvailable = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const surplusSlots = totalAvailable - totalAllocated;

    const hasShortage = Object.keys(finalSlots).some((category) => {
      const cat = category as LearningCategory;
      return counts[cat] < allocatedSlots[cat];
    });

    return {
      counts,
      allocatedSlots: finalSlots,
      surplusSlots,
      hasShortage,
    };
  }

  /**
   * カテゴリー詳細を生成
   */
  private generateCategoryDetails(
    finalSlots: Record<LearningCategory, number>,
    selectedWords: Record<LearningCategory, string[]>
  ): Record<
    LearningCategory,
    {
      requested: number;
      allocated: number;
      words: string[];
    }
  > {
    const details: Record<
      LearningCategory,
      {
        requested: number;
        allocated: number;
        words: string[];
      }
    > = {} as any;

    for (const category of Object.keys(finalSlots) as LearningCategory[]) {
      details[category] = {
        requested: finalSlots[category],
        allocated: selectedWords[category].length,
        words: selectedWords[category],
      };
    }

    return details;
  }

  /**
   * 🆕 動的上限システム: 分からない・まだまだの上限チェック
   *
   * 上限到達時の配分:
   * - 分からない+まだまだ: 40%
   * - 未出題: 30%
   * - 覚えてる: 10%（変化なし）
   *
   * @param baseConfig ベーススロット設定
   * @param progressMap 進捗マップ
   * @param totalSlots 総スロット数
   * @returns 調整後のスロット設定
   */
  private applyDynamicLimits(
    baseConfig: BatchSlotConfig,
    progressMap: Record<string, WordProgress>,
    totalSlots: number
  ): BatchSlotConfig {
    // LocalStorageから上限比率を取得（デフォルト20%）
    const reviewLimitRatio = (() => {
      try {
        const saved = localStorage.getItem('memorization-review-ratio-limit');
        return saved ? parseInt(saved) / 100 : 0.2;
      } catch {
        return 0.2;
      }
    })();

    // 現在の分からない・まだまだの語数をカウント
    const reviewWordCount = Object.values(progressMap).filter((progress) => {
      const category = this.classifier.determineCategory(progress, 'memorization');
      return category === 'incorrect' || category === 'still_learning';
    }).length;

    const reviewRatio = totalSlots > 0 ? reviewWordCount / totalSlots : 0;

    // 上限に達していない場合は基本設定を返す
    if (reviewRatio < reviewLimitRatio) {
      if (this.debugMode) {
        logger.info('[SlotAllocator] 動的上限: 未到達', {
          reviewWordCount,
          totalSlots,
          reviewRatio: `${(reviewRatio * 100).toFixed(1)}%`,
          reviewLimitRatio: `${(reviewLimitRatio * 100).toFixed(1)}%`,
        });
      }
      return baseConfig;
    }

    // 上限到達: 配分を変更
    const adjustedConfig: BatchSlotConfig = {
      ...baseConfig,
      incorrectRatio: 0.2, // 分からない20%
      stillLearningRatio: 0.2, // まだまだ20%
      newRatio: 0.3, // 未出題30%（抑制）
      masteredRatio: 0.1, // 覚えてる10%（固定）
    };

    if (this.debugMode) {
      logger.info('[SlotAllocator] 動的上限: 到達 → 配分変更', {
        reviewWordCount,
        totalSlots,
        reviewRatio: `${(reviewRatio * 100).toFixed(1)}%`,
        reviewLimitRatio: `${(reviewLimitRatio * 100).toFixed(1)}%`,
        before: {
          incorrect: `${(baseConfig.incorrectRatio * 100).toFixed(0)}%`,
          stillLearning: `${(baseConfig.stillLearningRatio * 100).toFixed(0)}%`,
          new: `${(baseConfig.newRatio * 100).toFixed(0)}%`,
        },
        after: {
          incorrect: '20%',
          stillLearning: '20%',
          new: '30%',
        },
      });
    }

    return adjustedConfig;
  }
}
