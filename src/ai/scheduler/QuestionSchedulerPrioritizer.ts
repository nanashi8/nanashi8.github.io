import type { Question } from '@/types';
import type { PrioritizedQuestion, ScheduleContext, ScheduleParams } from './types';
import { DebugTracer } from '@/utils/DebugTracer';
import { GamificationAI } from '@/ai/specialists/GamificationAI';

type QuestionSchedulerPrioritizerDeps = {
  recordFunctionCall: (funcName: string, params: any) => void;
  loadProgressCache: () => any;
  getWordStatusFromCache: (word: string, mode: ScheduleParams['mode'], progressCache: any) => any;
  isVerboseDebug: () => boolean;
};

export class QuestionSchedulerPrioritizer {
  constructor(private readonly deps: QuestionSchedulerPrioritizerDeps) {}

  /**
   * Position計算（7つのAI評価統合）
   * ⚡ パフォーマンス最適化: localStorageを1回だけ読み込む
   */
  public calculatePriorities(
    questions: Question[],
    context: ScheduleContext,
    signals: any[],
    hybridMode = false
  ): PrioritizedQuestion[] {
    // 📞 関数呼び出しトレース
    this.deps.recordFunctionCall('calculatePriorities', {
      questionsCount: questions.length,
      hybridMode,
    });

    // ⚡ 最適化: localStorage を一度だけ読み込んでキャッシュ
    const progressCache = this.deps.loadProgressCache();

    // 🐛 DEBUG: 入力時点でまだまだ語が含まれているか確認
    let calcSpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = questions.filter((q) => {
        const status = this.deps.getWordStatusFromCache(q.word, context.mode, progressCache);
        return status && status.attempts > 0 && status.position >= 40;
      });

      calcSpanId = DebugTracer.startSpan('QuestionScheduler.calculatePriorities', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: questions.length,
        weakWords: weakWordsInInput.map((q) => q.word),
      });
    }

    // 🎯 難易度別適応学習: 中級・上級の正答率が悪い場合、初級を優先
    const difficultyAdaptation = this.calculateDifficultyAdaptation(progressCache);

    const prioritized = questions.map((q, index) => {
      const status = this.deps.getWordStatusFromCache(q.word, context.mode, progressCache);

      // ハイブリッドモード: 元の順序を保持（indexベース）
      if (hybridMode) {
        const position = (index / questions.length) * 100; // 0-100の範囲
        return {
          question: q,
          position,
          status,
          signals: [],
          originalIndex: index,
          attempts: status?.attempts || 0, // 出題回数を追加
        };
      }

      // ✅ Position = 0-100スコア（determineWordPosition()で計算済み）
      // すでに7つのAI評価・TimeBoost・全ての要素が統合されている
      let position = status?.position || 35; // デフォルト: new範囲

      // 🐛 DEBUG: statusがnullの場合を検出
      if (import.meta.env.DEV && status === null && index < 20) {
        console.warn(
          `⚠️ [calculatePriorities] ${q.word}: status is NULL (using default position=35)`
        );
      }

      // 🎯 難易度別適応: 中級・上級が苦手な場合、初級を優先
      position = this.applyDifficultyAdaptation(position, q, difficultyAdaptation);

      // 🔍 デバッグ: Position値確認（開発環境のみ、最初の20単語のみ）
      if (import.meta.env.DEV && index < 20) {
        console.log(
          `🔍 [calculatePriorities] ${q.word}: position=${position}, status.position=${status?.position}, status=${status ? 'OK' : 'NULL'}`
        );
      }

      return {
        question: q,
        position: position,
        status,
        signals: [],
        originalIndex: index,
        attempts: status?.attempts || 0, // 出題回数を追加
      };
    });

    // 🎮 Position分散適用（インターリーブ）
    const adjusted = this.applyInterleavingAdjustment(prioritized, context.mode, questions.length);

    // 🎫 スパン終了（calculatePriorities完了）
    if (import.meta.env.DEV && calcSpanId) {
      const weakWordsAfter = adjusted.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );
      DebugTracer.endSpan(calcSpanId, {
        weakWordsCount: weakWordsAfter.length,
        totalCount: adjusted.length,
        weakWords: weakWordsAfter.map((pq) => pq.question.word),
      });
    }

    return adjusted;
  }

  /**
   * GamificationAIによるPosition調整（インターリーブ用）
   */
  private applyInterleavingAdjustment(
    prioritized: PrioritizedQuestion[],
    mode: ScheduleParams['mode'],
    questionsCount: number
  ): PrioritizedQuestion[] {
    // 📞 関数呼び出しトレース
    this.deps.recordFunctionCall('applyInterleavingAdjustment', {
      prioritizedCount: prioritized.length,
      mode,
      questionsCount,
    });

    // 🐛 DEBUG: GamificationAI入力時点でまだまだ語を確認
    let gamificationSpanId: string | undefined;
    if (import.meta.env.DEV) {
      const weakWordsInInput = prioritized.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );

      gamificationSpanId = DebugTracer.startSpan('QuestionScheduler.beforeGamification', {
        weakWordsCount: weakWordsInInput.length,
        totalCount: prioritized.length,
        weakWords: weakWordsInInput.map((pq) => pq.question.word),
      });
    }

    const gamificationAI = new GamificationAI();

    // 🔍 デバッグ: Position分散前の統計（正確なカテゴリ判定）
    const before = {
      stillLearning: prioritized.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      ).length,
      incorrect: prioritized.filter((pq) => pq.position >= 70).length,
      new: prioritized.filter((pq) => pq.position < 40).length,
      boostable: prioritized.filter(
        (pq) => pq.position >= 25 && pq.position < 40 && (pq.attempts ?? 0) === 0
      ).length,
    };

    // まだまだ語のブースト（Position 45 → 60）
    const { result: boostedStill, changed: stillChanged } =
      gamificationAI.boostStillLearningQuestions(prioritized);

    // 新規語のPosition引き上げ
    const { result, changed } = gamificationAI.adjustPositionForInterleaving(boostedStill);

    // 🔍 デバッグ: Position分散後の統計（正確なカテゴリ判定）
    const after = {
      stillLearning: result.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      ).length,
      incorrect: result.filter((pq) => pq.position >= 70).length,
      new: result.filter((pq) => pq.position < 40).length,
      boostable: result.filter(
        (pq) => pq.position >= 25 && pq.position < 40 && (pq.attempts ?? 0) === 0
      ).length,
    };

    // 🔍 Position階層検証（「あっちを立てればこっちが立たず」防止）
    const stillInBoostedZone = result.filter((pq) => {
      const isStill = pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0;
      return isStill && pq.position >= 60 && pq.position < 70; // まだまだ語が60-69範囲内
    }).length;
    const newInBoostedZone = result.filter((pq) => {
      const isNew = pq.position >= 40 && (pq.attempts ?? 0) === 0;
      return isNew && pq.position >= 40 && pq.position < 60; // 新規語（ブースト後）が40-59範囲内
    }).length;
    const hierarchyViolation = result.filter((pq) => {
      const isNew = (pq.attempts ?? 0) === 0;
      const isStill = (pq.attempts ?? 0) > 0 && pq.position >= 40 && pq.position < 70;
      // 新規 > まだまだ の逆転をチェック
      return (isNew && pq.position >= 60) || (isStill && pq.position < 60);
    });

    if (this.deps.isVerboseDebug() && hierarchyViolation.length > 0) {
      console.error(
        `❌ [Position階層違反] 「あっちを立てればこっちが立たず」検出: ${hierarchyViolation.length}語`
      );
      console.error('🚨 新規語がPosition 60以上、またはまだまだ語がPosition 60未満');
      hierarchyViolation.slice(0, 3).forEach((pq) => {
        const word = pq.question.word;
        const type = (pq.attempts ?? 0) === 0 ? '新規' : 'まだまだ';
        console.error(`  • ${word} (${type}): Position ${pq.position.toFixed(0)}`);
      });
    }

    // localStorage保存（デバッグパネル用）
    if (this.deps.isVerboseDebug()) {
      try {
        const snapshot = {
          mode,
          questionsCount,
          stillInBoostedZone,
          newInBoostedZone,
          violations: hierarchyViolation.map((pq) => ({
            word: pq.question.word,
            position: pq.position,
            attempts: pq.attempts ?? 0,
            type: (pq.attempts ?? 0) === 0 ? 'new_exceeds_60' : 'still_below_60',
          })),
          violationCount: hierarchyViolation.length,
          isValid: hierarchyViolation.length === 0,
          timestamp: new Date().toISOString(),
        };

        // legacy
        localStorage.setItem('debug_position_hierarchy_validation', JSON.stringify(snapshot));
        // by-mode
        localStorage.setItem(
          `debug_position_hierarchy_validation_${mode}`,
          JSON.stringify(snapshot)
        );
      } catch {
        // localStorage失敗は無視
      }
    }

    // Position変更があった問題を記録 (すでにGamificationAIから返ってくる)

    // localStorage保存
    if (this.deps.isVerboseDebug()) {
      try {
        const snapshot = {
          mode,
          questionsCount,
          timestamp: new Date().toISOString(),
          before,
          after,
          stillChanged,
          changed,
          summary: {
            stillBoosted: stillChanged.length,
            newBoosted: changed.length,
            working: stillChanged.length > 0 || changed.length > 0,
          },
        };

        // legacy
        localStorage.setItem('debug_position_interleaving', JSON.stringify(snapshot));
        // by-mode
        const byModeKey = `debug_position_interleaving_${mode}`;
        localStorage.setItem(byModeKey, JSON.stringify(snapshot));
        // history
        const historyKey = `debug_position_interleaving_history_${mode}`;
        try {
          const existingRaw = localStorage.getItem(historyKey);
          const existing = JSON.parse(existingRaw || '[]');
          const arr = Array.isArray(existing) ? existing : [];
          arr.push(snapshot);
          while (arr.length > 5) arr.shift();
          localStorage.setItem(historyKey, JSON.stringify(arr));
        } catch {
          // ignore
        }
      } catch {
        // localStorage失敗は無視
      }
    }

    if (this.deps.isVerboseDebug()) {
      console.log('🎮 [GamificationAI] Position分散前:', before);
      console.log('🎮 [GamificationAI] Position分散後:', after);
      if (stillChanged.length > 0) {
        console.log(
          '✅ [GamificationAI] まだまだ語ブースト:',
          stillChanged.slice(0, 10).map((c) => ({
            word: c.word,
            before: c.before.toFixed(0),
            after: c.after.toFixed(0),
          }))
        );
      }
      if (changed.length > 0) {
        console.log(
          '✅ [GamificationAI] 新規語Position引き上げ:',
          changed.slice(0, 10).map((c) => ({
            word: c.word,
            before: c.before.toFixed(0),
            after: c.after.toFixed(0),
          }))
        );
      } else {
        // まだまだ語が0の場合はPosition分散がスキップされる（正常動作）
        if (before.stillLearning === 0 && before.incorrect === 0) {
          console.log(
            'ℹ️ [GamificationAI] まだまだ・分からない語が0語 → Position分散スキップ（正常動作）'
          );
        } else {
          console.warn('⚠️ [GamificationAI] Position変更なし - 新規語が不足している可能性');
        }
      }
    }

    // 🎯 まだまだ語のPosition引き上げ（新規より優先させる）
    const { result: stillLearningBoosted, changed: stillLearningChanges } =
      gamificationAI.boostStillLearningQuestions(result);

    // localStorage保存
    if (this.deps.isVerboseDebug()) {
      try {
        const snapshot = {
          mode,
          questionsCount,
          timestamp: new Date().toISOString(),
          boosted: stillLearningChanges.length,
          changes: stillLearningChanges,
          working: stillLearningChanges.length > 0,
        };
        // legacy
        localStorage.setItem('debug_still_learning_boost', JSON.stringify(snapshot));
        // by-mode
        localStorage.setItem(`debug_still_learning_boost_${mode}`, JSON.stringify(snapshot));
      } catch {
        // localStorage失敗は無視
      }
    }

    if (this.deps.isVerboseDebug() && stillLearningChanges.length > 0) {
      console.log(
        '🎯 [GamificationAI] まだまだ語ブースト:',
        stillLearningChanges.slice(0, 10).map((c) => ({
          word: c.word,
          before: c.before.toFixed(0),
          after: c.after.toFixed(0),
        }))
      );
    }

    // 🎫 スパン終了（GamificationAI処理完了）
    if (import.meta.env.DEV && gamificationSpanId) {
      const weakWordsAfter = stillLearningBoosted.filter(
        (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
      );
      DebugTracer.endSpan(gamificationSpanId, {
        weakWordsCount: weakWordsAfter.length,
        totalCount: stillLearningBoosted.length,
        weakWords: weakWordsAfter.map((pq) => pq.question.word),
      });
    }

    return stillLearningBoosted;
  }

  /**
   * 🎯 難易度別適応学習: 中級・上級の正答率計算
   *
   * 目的: 中級・上級の正答率が悪い場合、初級の習熟を優先させる
   *
   * @param progressCache - プログレスキャッシュ
   * @returns 難易度別の正答率と推奨戦略
   */
  private calculateDifficultyAdaptation(progressCache: any): {
    beginner: number;
    intermediate: number;
    advanced: number;
    shouldPrioritizeBeginner: boolean;
    priorityBoost: number; // 初級への優先度ブースト（0-20）
  } {
    if (!progressCache || !progressCache.wordProgress) {
      return {
        beginner: 70,
        intermediate: 60,
        advanced: 50,
        shouldPrioritizeBeginner: false,
        priorityBoost: 0,
      };
    }

    const wordProgresses = Object.values(progressCache.wordProgress || {}) as any[];

    // 難易度別の正答率計算
    const difficultyStats = {
      beginner: { correct: 0, total: 0 },
      intermediate: { correct: 0, total: 0 },
      advanced: { correct: 0, total: 0 },
    };

    wordProgresses.forEach((wp: any) => {
      const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
        初級: 'beginner',
        中級: 'intermediate',
        上級: 'advanced',
      };
      const difficulty = difficultyMap[wp.difficulty as string];

      if (difficulty && difficultyStats[difficulty]) {
        const total = (wp.correctCount || 0) + (wp.incorrectCount || 0);
        difficultyStats[difficulty].total += total;
        difficultyStats[difficulty].correct += wp.correctCount || 0;
      }
    });

    const accuracy = {
      beginner:
        difficultyStats.beginner.total > 0
          ? (difficultyStats.beginner.correct / difficultyStats.beginner.total) * 100
          : 70,
      intermediate:
        difficultyStats.intermediate.total > 0
          ? (difficultyStats.intermediate.correct / difficultyStats.intermediate.total) * 100
          : 60,
      advanced:
        difficultyStats.advanced.total > 0
          ? (difficultyStats.advanced.correct / difficultyStats.advanced.total) * 100
          : 50,
    };

    // 🎯 判定: 中級・上級の正答率が悪い場合、初級を優先
    // 条件: 中級 < 60% OR 上級 < 50%
    const shouldPrioritizeBeginner = accuracy.intermediate < 60 || accuracy.advanced < 50;

    // 優先度ブースト計算: 中級・上級の正答率が低いほど初級のブーストが大きい
    let priorityBoost = 0;
    if (shouldPrioritizeBeginner) {
      const intermediateGap = Math.max(0, 60 - accuracy.intermediate);
      const advancedGap = Math.max(0, 50 - accuracy.advanced);
      priorityBoost = Math.min(20, (intermediateGap + advancedGap) / 2); // 最大20点
    }

    return {
      ...accuracy,
      shouldPrioritizeBeginner,
      priorityBoost,
    };
  }

  /**
   * 🎯 難易度別適応: Position調整
   *
   * 中級・上級の正答率が悪い場合:
   * - 初級の問題: Position を下げる（優先度UP）
   * - 中級・上級: Position を少し上げる（優先度DOWN、ただし完全に避けない）
   *
   * @param position - 元のPosition
   * @param question - 問題
   * @param adaptation - 難易度適応情報
   * @returns 調整後のPosition
   */
  private applyDifficultyAdaptation(
    position: number,
    question: Question,
    adaptation: ReturnType<typeof this.calculateDifficultyAdaptation>
  ): number {
    if (!adaptation.shouldPrioritizeBeginner) {
      return position; // 適応不要
    }

    const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      初級: 'beginner',
      中級: 'intermediate',
      上級: 'advanced',
    };
    const difficulty = difficultyMap[question.difficulty];

    if (!difficulty) {
      return position; // 難易度情報なし
    }

    // 🎯 初級を優先: Position を下げる（優先度UP）
    if (difficulty === 'beginner') {
      return Math.max(0, position - adaptation.priorityBoost);
    }

    // ⚠️ 中級・上級を少し抑える: Position を上げる（優先度DOWN）
    // ただし完全に避けるわけではない（最大+10点）
    if (difficulty === 'intermediate' || difficulty === 'advanced') {
      return Math.min(100, position + Math.min(10, adaptation.priorityBoost / 2));
    }

    return position;
  }
}
