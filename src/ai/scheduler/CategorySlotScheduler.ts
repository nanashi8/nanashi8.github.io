import type { Question } from '@/types';
import type { ScheduleParams, ScheduleResult } from './types';
import { PositionCalculator } from './PositionCalculator';
import { logger } from '@/utils/logger';
import { writeDebugJSON } from '@/utils/debugStorage';
import { GamificationAI } from '@/ai/specialists/GamificationAI';
import { SlotConfigManager } from './SlotConfigManager';
import { getStrengthLookupForScheduling } from '@/ai/utils/vocabularyNetwork';
import {
  diversifyByHeadCharWithinPositionBuckets,
  fnv1a32,
  maxAdjacentHeadRun,
  pickChainSeedIndex,
} from './wordOrdering';

export class CategorySlotScheduler {
  async schedule(
    params: ScheduleParams,
    startTime: number,
    ctx: {
      progressMap: Record<string, any>;
      recentWords: string[];
      isVerboseDebug: boolean;
    }
  ): Promise<ScheduleResult> {
    const { progressMap, recentWords, isVerboseDebug } = ctx;
    const calculator = new PositionCalculator(
      params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
    );

    // 0. 振動防止: 直近10語のSetを作成（優先順位を下げる）
    const recentSet = new Set(recentWords);

    if (import.meta.env.DEV && recentWords.length > 0) {
      logger.info('[QuestionScheduler] 振動防止（DTA）', {
        recentWords: recentWords.length,
        words: recentWords,
      });
      console.log('🚫 [振動防止] 直近10語（Position -30ペナルティ）:');
      recentWords.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w}`);
      });
    }

    // 1. 全問にPositionを計算（直近語はPosition -30ペナルティ）
    type Classified = {
      question: Question;
      position: number;
      category: 'incorrect' | 'still_learning' | 'new' | 'mastered';
    };

    const minPositionForCategory = (category: Classified['category']): number => {
      switch (category) {
        case 'incorrect':
          return 70;
        case 'still_learning':
          return 40;
        case 'new':
          return 20;
        case 'mastered':
          return 0;
        default:
          return 0;
      }
    };

    const classified: Classified[] = params.questions.map((q) => {
      const wp = progressMap[q.word];
      const basePosition = wp ? calculator.calculate(wp) : 35; // 未学習は new の標準値
      const category = PositionCalculator.categoryOf(basePosition);

      let position = basePosition;
      // 振動防止: 直近10語はPosition -30（優先順位を下げる）
      // 重要: カテゴリ境界を跨いで「incorrect→still_learning」等にならないよう、カテゴリ帯の最低値でクランプする
      if (recentSet.has(q.word)) {
        position = Math.max(minPositionForCategory(category), basePosition - 30);
      }

      return { question: q, position, category };
    });

    // 2. カテゴリ別に分類
    const byCategory: Record<string, Classified[]> = {
      incorrect: classified.filter((c) => c.category === 'incorrect'),
      still_learning: classified.filter((c) => c.category === 'still_learning'),
      new: classified.filter((c) => c.category === 'new'),
      mastered: classified.filter((c) => c.category === 'mastered'),
    };

    // 3. 各カテゴリ内でPosition降順ソート
    Object.keys(byCategory).forEach((cat) => {
      byCategory[cat].sort((a, b) => b.position - a.position);
    });

    // 4. スロット割当（🆕 バッチサイズ設定対応）
    // - バッチサイズ設定がある場合: その値を使用
    // - 設定なしの場合: 従来通り最大100語
    const totalSlots = params.batchSize
      ? Math.min(params.questions.length, params.batchSize)
      : Math.min(params.questions.length, 100);

    const incorrectCount = byCategory.incorrect.length;
    const stillCount = byCategory.still_learning.length;
    const newCount = byCategory.new.length;
    const masteredCount = byCategory.mastered.length;

    // 4.5 スロット配分（SSOT: SlotConfigManager）
    // 要求仕様（暗記）:
    // - 分からない（要復習）: 20%
    // - まだまだ（学習中）: 20%
    // - 覚えてる（定着済）: 10%
    // - 未出題: 残り
    const slotConfig = new SlotConfigManager({ debugMode: import.meta.env.DEV }).getSlotConfig(
      params.mode as 'memorization' | 'translation' | 'spelling' | 'grammar'
    );

    const slots = {
      incorrect: Math.min(incorrectCount, Math.floor(totalSlots * slotConfig.incorrectRatio)),
      still_learning: Math.min(stillCount, Math.floor(totalSlots * slotConfig.stillLearningRatio)),
      mastered: Math.min(masteredCount, Math.floor(totalSlots * slotConfig.masteredRatio)),
      new: 0,
    };

    // 未出題は「残り」を基本とする
    let remaining = totalSlots - (slots.incorrect + slots.still_learning + slots.mastered);
    if (remaining < 0) remaining = 0;
    slots.new = Math.min(newCount, remaining);
    remaining -= slots.new;

    // それでも余る場合（例: 未出題が不足）には、在庫があるカテゴリに再配分
    if (remaining > 0) {
      const addTo = (
        key: 'incorrect' | 'still_learning' | 'mastered' | 'new',
        available: number
      ) => {
        if (remaining <= 0) return;
        const canAdd = Math.max(0, available - slots[key]);
        if (canAdd <= 0) return;
        const toAdd = Math.min(remaining, canAdd);
        slots[key] += toAdd;
        remaining -= toAdd;
      };

      // 既存の学習設計に合わせ、復習系を優先して埋める
      addTo('incorrect', incorrectCount);
      addTo('still_learning', stillCount);
      addTo('mastered', masteredCount);
      addTo('new', newCount);
    }

    // 5. いもづる式学習: カテゴリ内で関連語を近くに配置
    const applyChainLearning = (items: Classified[]): Classified[] => {
      if (!params.useChainLearning || items.length <= 2) return items;

      const lookup = getStrengthLookupForScheduling(params.questions);
      const getStrength = (a: string, b: string): number => {
        const s1 = lookup.get(a)?.get(b) ?? 0;
        const s2 = lookup.get(b)?.get(a) ?? 0;
        return Math.max(s1, s2);
      };

      // Position帯（10刻み）ごとに分割して、帯内で関連語を近くに
      const buckets = new Map<number, Classified[]>();
      items.forEach((item) => {
        const bucket = Math.floor(item.position / 10);
        if (!buckets.has(bucket)) buckets.set(bucket, []);
        buckets.get(bucket)!.push(item);
      });

      const reordered: Classified[] = [];
      buckets.forEach((band) => {
        if (band.length <= 1) {
          reordered.push(...band);
          return;
        }

        // 貪欲法: “開始語”は入力順依存を避け、帯内で最も総関連度が高い語を起点にする
        const remaining = [...band];
        const seedIdx = pickChainSeedIndex(remaining, getStrength);
        const seed = remaining.splice(seedIdx, 1)[0];
        const selected: Classified[] = [seed];

        while (remaining.length > 0) {
          const last = selected[selected.length - 1];
          let bestIdx = 0;
          let bestStrength = getStrength(last.question.word, remaining[0].question.word);
          let bestHash = fnv1a32(remaining[0].question.word);

          for (let i = 1; i < remaining.length; i++) {
            const strength = getStrength(last.question.word, remaining[i].question.word);
            const h = fnv1a32(remaining[i].question.word);
            if (strength > bestStrength || (strength === bestStrength && h < bestHash)) {
              bestStrength = strength;
              bestIdx = i;
              bestHash = h;
            }
          }

          selected.push(remaining[bestIdx]);
          remaining.splice(bestIdx, 1);
        }

        reordered.push(...selected);
      });

      return reordered;
    };

    // 6. 各スロット内でPosition降順ソート＋いもづる式学習
    // 📌 重複排除: 各カテゴリ内で同じ語が重複しないよう、word でユニーク化
    const dedupeByWord = (items: Classified[]): Classified[] => {
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.question.word)) return false;
        seen.add(item.question.word);
        return true;
      });
    };

    const processedSlots: Record<string, Classified[]> = {
      incorrect: applyChainLearning(
        dedupeByWord(
          byCategory.incorrect.slice(0, slots.incorrect).sort((a, b) => b.position - a.position)
        )
      ),
      still_learning: applyChainLearning(
        dedupeByWord(
          byCategory.still_learning
            .slice(0, slots.still_learning)
            .sort((a, b) => b.position - a.position)
        )
      ),
      new: applyChainLearning(
        dedupeByWord(byCategory.new.slice(0, slots.new).sort((a, b) => b.position - a.position))
      ),
      mastered: applyChainLearning(
        dedupeByWord(
          byCategory.mastered.slice(0, slots.mastered).sort((a, b) => b.position - a.position)
        )
      ),
    };

    // 🆕 new語の頭文字分散（ABC順の“固まり”を抑制）
    // - categorySlots は progressなしの語が basePosition=35 になりやすく、Positionが同一だと入力順がそのまま残りやすい
    // - いもづる式（useChainLearning）が有効な場合は、関連語を近づける並び替えを優先したい
    //   → ただし同頭文字が固まりすぎている時だけ、学習体験を守るために分散を入れる
    // - 重要: Position階層は崩さないため、Position帯（5刻み）ごとに分散する
    if (maxAdjacentHeadRun(processedSlots.new) > 2) {
      processedSlots.new = diversifyByHeadCharWithinPositionBuckets(processedSlots.new, 5);
    }

    // 7. スロット間をGamificationで交互配置（incorrect連続を防ぐ）
    // 🛡️ 実行時検証: still_learning語がPosition 60-69範囲内か
    if (import.meta.env.DEV) {
      const stillLearning = processedSlots.still_learning || [];
      const violations = stillLearning.filter((c) => c.position < 40 || c.position >= 70);
      if (violations.length > 0) {
        console.error('🚨 Position階層違反（まだまだ語）:', violations);
        logger.error('[QuestionScheduler] Position階層違反', {
          violationCount: violations.length,
          violations: violations.map((v) => ({
            word: v.question.word,
            position: v.position,
            category: v.category,
          })),
        });
        // DEVモードでは例外をthrow（問題を早期検知）
        throw new Error(`Position階層違反: まだまだ語が40-69範囲外（${violations.length}語）`);
      }
    }

    type PQ = { position: number; attempts?: number; question: Question };
    const allWithCategory: PQ[] = [
      ...processedSlots.incorrect.map((c) => ({
        position: c.position,
        attempts: (progressMap[c.question.word]?.memorizationAttempts ?? 0) > 0 ? 1 : 0,
        question: c.question,
      })),
      ...processedSlots.still_learning.map((c) => ({
        position: c.position,
        attempts: (progressMap[c.question.word]?.memorizationAttempts ?? 0) > 0 ? 1 : 0,
        question: c.question,
      })),
      ...processedSlots.new.map((c) => ({
        position: c.position,
        attempts: 0,
        question: c.question,
      })),
      ...processedSlots.mastered.map((c) => ({
        position: c.position,
        attempts: (progressMap[c.question.word]?.memorizationAttempts ?? 0) > 0 ? 1 : 0,
        question: c.question,
      })),
    ];

    const gamificationAI = new GamificationAI();
    const interleaved = gamificationAI.interleaveByCategory(allWithCategory);

    // 📌 バッチ全体で重複排除（念のため最終確認）
    const seen = new Set<string>();
    const result = interleaved
      .map((pq) => pq.question)
      .filter((q) => {
        if (seen.has(q.word)) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ [重複検出] ${q.word} がバッチ内で2回目の出題 → 除外`);
          }
          return false;
        }
        seen.add(q.word);
        return true;
      });

    // 📊 デバッグ用統計
    const stats = {
      total: result.length,
      incorrect: slots.incorrect,
      still_learning: slots.still_learning,
      new: slots.new,
      mastered: slots.mastered,
      chainLearning: params.useChainLearning || false,
      interleavedByCategory: true,
      duplicatesRemoved: interleaved.length - result.length,
    };

    const processingTime = performance.now() - startTime;

    if (import.meta.env.DEV) {
      logger.info('[QuestionScheduler] カテゴリースロット方式', {
        allocated: result.length,
        processingTime: `${processingTime.toFixed(2)}ms`,
        stats,
      });

      // 🔍 出題順序を明示的にログ出力（振動検出用）
      console.log('📝 [出題順序] 先頭30問:');
      result.slice(0, 30).forEach((q, i) => {
        const c = classified.find((x) => x.question.word === q.word);
        const wasRecent = recentSet.has(q.word);
        console.log(
          `  ${(i + 1).toString().padStart(2)}. ${q.word.padEnd(20)} | Pos: ${c?.position.toFixed(0).padStart(3)} | Cat: ${c?.category.padEnd(15)} ${wasRecent ? '⚠️ 直近' : ''}`
        );
      });

      const top30 = result.slice(0, 30).map((q, i) => {
        const c = classified.find((x) => x.question.word === q.word);
        return {
          rank: i + 1,
          word: q.word,
          category: c?.category,
          position: c?.position,
          wasRecent: recentSet.has(q.word),
        };
      });
      // 出題回数マップ（デバッグパネルで表示用）
      const top30AttemptsMap: Record<string, number> = {};
      result.slice(0, 30).forEach((q) => {
        const wp = progressMap[q.word];
        if (wp) {
          const mode = params.mode;
          const attempts =
            mode === 'memorization'
              ? wp.memorizationAttempts || 0
              : mode === 'translation'
                ? wp.translationAttempts || 0
                : mode === 'spelling'
                  ? wp.spellingAttempts || 0
                  : wp.grammarAttempts || 0;
          top30AttemptsMap[q.word] = attempts;
        }
      });
      writeDebugJSON(
        'debug_categorySlots_output',
        { timestamp: new Date().toISOString(), mode: params.mode, stats, top30, top30AttemptsMap },
        { mode: params.mode }
      );
    }

    // 🚨 強制検証: バッチ内で連続する同一単語を検出（振動の原因）
    if (import.meta.env.DEV) {
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i].word === result[i + 1].word) {
          const errorMsg = `🚨🚨🚨 [致命的エラー] バッチ内で連続重複を検出: "${result[i].word}" が位置${i}と${i + 1}で連続出題！`;
          console.error(errorMsg);
          logger.error('[QuestionScheduler] バッチ内連続重複検出', {
            word: result[i].word,
            position1: i,
            position2: i + 1,
            batchSize: result.length,
            mode: params.mode,
          });
          // DEVモードでは例外をthrow（即座に問題を検知）
          throw new Error(errorMsg);
        }
      }

      // 念のため全体の重複チェックも実施
      const allWords = result.map((q) => q.word);
      const uniqueWords = new Set(allWords);
      if (allWords.length !== uniqueWords.size) {
        const duplicates = allWords.filter((word, index) => allWords.indexOf(word) !== index);
        const errorMsg = `🚨 [警告] バッチ内に重複語あり（非連続）: ${[...new Set(duplicates)].join(', ')}`;
        console.error(errorMsg);
        logger.error('[QuestionScheduler] バッチ内重複検出（非連続）', {
          duplicates: [...new Set(duplicates)],
          batchSize: result.length,
          uniqueSize: uniqueWords.size,
          mode: params.mode,
        });
      } else {
        console.log(`✅ [検証成功] バッチ内に重複なし（${result.length}問、全ユニーク）`);
      }
    }

    return {
      scheduledQuestions: result,
      vibrationScore: 0,
      processingTime,
      signalCount: 0,
    };
  }

  // NOTE: 並び替え用のヘルパー（頭文字分散・ハッシュ等）は wordOrdering.ts に集約
}
