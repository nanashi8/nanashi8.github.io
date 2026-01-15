import type { Question } from '@/types';
import type { WordProgress } from '@/storage/progress/types';
import { PositionCalculator } from './PositionCalculator';
import { MemoryAI } from '@/ai/specialists/MemoryAI';
import { CognitiveLoadAI } from '@/ai/specialists/CognitiveLoadAI';
import { ErrorPredictionAI } from '@/ai/specialists/ErrorPredictionAI';
import { LinguisticAI } from '@/ai/specialists/LinguisticAI';
import { ContextualAI } from '@/ai/specialists/ContextualAI';
import { LearningStyleAI } from '@/ai/specialists/LearningStyleAI';
import { GamificationAI } from '@/ai/specialists/GamificationAI';

export class QuestionSchedulerEvaluation {
  constructor(private readonly opts: { isVerboseDebug: () => boolean }) {}

  recalculatePriorityAfterAnswer(
    word: string,
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    // ✅ Position = 0-100スコア（7つのAI評価統合済み、タブ別）
    // 解答直後は progress の各カウンタが更新された直後なので、
    // 直前に保存されている tab別Position（savedPosition）は“古い値”になり得る。
    // ここでは savedPosition を一時的に無視して再計算する（解答結果を即反映）。
    const positionBefore = (() => {
      switch (mode) {
        case 'memorization':
          return progress.memorizationPosition ?? 50;
        case 'translation':
          return progress.translationPosition ?? 50;
        case 'spelling':
          return progress.spellingPosition ?? 50;
        case 'grammar':
          return progress.grammarPosition ?? 50;
        default:
          return 50;
      }
    })();

    const position = this.determinePositionAfterAnswer(progress, mode);

    const bucket = PositionCalculator.categoryOf(position);

    // 正答率を計算
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    progress.accuracyRate = totalAttempts > 0 ? progress.correctCount / totalAttempts : 0;

    // モード別統計（デバッグ用）
    let modeAttempts = 0;
    let modeCorrect = 0;
    let modeStillLearning = 0;
    switch (mode) {
      case 'memorization':
        modeAttempts = progress.memorizationAttempts || 0;
        modeCorrect = progress.memorizationCorrect || 0;
        modeStillLearning = progress.memorizationStillLearning || 0;
        break;
      case 'translation':
        modeAttempts = progress.translationAttempts || 0;
        modeCorrect = progress.translationCorrect || 0;
        break;
      case 'spelling':
        modeAttempts = progress.spellingAttempts || 0;
        modeCorrect = progress.spellingCorrect || 0;
        break;
      case 'grammar':
        modeAttempts = progress.grammarAttempts || 0;
        modeCorrect = progress.grammarCorrect || 0;
        break;
    }

    // 🔍 解答直後のPosition計算ログをlocalStorageに保存
    try {
      const answerLog = {
        timestamp: new Date().toISOString(),
        word,
        mode,
        positionBefore,
        positionAfter: position,

        progress: {
          correctCount: progress.correctCount,
          incorrectCount: progress.incorrectCount,
          consecutiveCorrect: progress.consecutiveCorrect || 0,
          consecutiveIncorrect: progress.consecutiveIncorrect || 0,
          accuracy: progress.accuracyRate || 0,
          modeAttempts,
          modeCorrect,
          modeStillLearning,
        },
      };

      const stored = localStorage.getItem('debug_answer_logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push(answerLog);
      // 最新20件のみ保持
      if (logs.length > 20) logs.shift();
      if (this.opts.isVerboseDebug()) {
        localStorage.setItem('debug_answer_logs', JSON.stringify(logs));
      }
    } catch {
      // localStorage失敗は無視
    }

    if (import.meta.env.DEV) {
      const daysSince = (Date.now() - (progress.lastStudied || Date.now())) / (1000 * 60 * 60 * 24);
      const aiProposals = this.calculateAIEvaluations(progress, position, daysSince);
      this.recordAIEvaluation(word, {
        category: bucket,
        position,
        aiProposals,
        consecutiveCorrect: progress.consecutiveCorrect || 0,
        consecutiveIncorrect: progress.consecutiveIncorrect || 0,
        accuracy: progress.accuracyRate || 0,
        attempts: totalAttempts,
        daysSince,
        timestamp: new Date().toISOString(),
      });
    }

    return position; // ✅ Position（0-100）を返却
  }

  private calculateAIEvaluations(
    progress: WordProgress,
    _position: number,
    daysSinceLastStudy: number
  ): Record<string, number> {
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    const accuracy = totalAttempts > 0 ? progress.correctCount / totalAttempts : 0;
    const consecutiveCorrect = progress.consecutiveCorrect || 0;
    const consecutiveIncorrect = progress.consecutiveIncorrect || 0;

    // 各AIのインスタンス生成
    const memoryAI = new MemoryAI();
    const cognitiveLoadAI = new CognitiveLoadAI();
    const errorPredictionAI = new ErrorPredictionAI();
    const linguisticAI = new LinguisticAI();
    const contextualAI = new ContextualAI();
    const learningStyleAI = new LearningStyleAI();
    const gamificationAI = new GamificationAI();

    return {
      memory: memoryAI.proposePosition(progress, '', daysSinceLastStudy, accuracy, totalAttempts),
      cognitiveLoad: cognitiveLoadAI.proposePosition(progress, consecutiveIncorrect),
      errorPrediction: errorPredictionAI.proposePosition(progress, accuracy, totalAttempts),
      linguistic: linguisticAI.proposePosition(progress, accuracy),
      contextual: contextualAI.proposePosition(progress, daysSinceLastStudy),
      learningStyle: learningStyleAI.proposePosition(progress, accuracy, totalAttempts),
      gamification: gamificationAI.proposePosition(progress, consecutiveCorrect, accuracy),
    };
  }

  private recordAIEvaluation(word: string, evaluation: any): void {
    try {
      const key = 'debug_ai_evaluations';
      const stored = localStorage.getItem(key);
      const evaluations = stored ? JSON.parse(stored) : {};

      // ✅ evaluation オブジェクトに word を追加
      evaluations[word] = { ...evaluation, word };

      // 最新100件のみ保持
      const entries = Object.entries(evaluations);
      if (entries.length > 100) {
        const latest = Object.fromEntries(entries.slice(-100));
        localStorage.setItem(key, JSON.stringify(latest));
      } else {
        localStorage.setItem(key, JSON.stringify(evaluations));
      }

      // コンソールに表示形式で出力
      const aiEvalMap = (evaluation?.aiEvaluations ?? evaluation?.aiProposals ?? {}) as Record<
        string,
        number
      >;
      const aiScores = Object.values(aiEvalMap)
        .map((v) => Number(v).toFixed(1))
        .join('/');
      const finalPriority = Number(evaluation?.finalPriority ?? evaluation?.position ?? 0);
      console.log(
        `🤖 [AI評価] ${word}: ${finalPriority.toFixed(1)}[${aiScores}] (${evaluation?.category ?? 'n/a'})`
      );
    } catch {
      // localStorage失敗は無視
    }
  }

  private determinePosition(
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    return new PositionCalculator(mode).calculate(progress);
  }

  private determinePositionAfterAnswer(
    progress: WordProgress,
    mode: 'memorization' | 'translation' | 'spelling' | 'grammar' = 'memorization'
  ): number {
    return new PositionCalculator(mode).calculate(progress, { ignoreSaved: true });
  }

  // 以降は将来の再利用用（現状は外部から参照されない）
  private enforceCompletionRequirement(position: number): number {
    // incorrect（分からない 70-100）: 最優先で再出題
    if (position >= 70) {
      return 100;
    }
    // still_learning（まだまだ 40-70）: 高優先度で再出題
    if (position >= 40) {
      return 75;
    }
    // mastered (0-20) / new (20-40): 通常優先度
    return position < 20 ? 10 : 50;
  }

  private calculateDifficultyAdaptation(progressCache: any): {
    beginner: number;
    intermediate: number;
    advanced: number;
    shouldPrioritizeBeginner: boolean;
    priorityBoost: number;
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
