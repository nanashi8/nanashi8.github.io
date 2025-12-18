/**
 * シミュレーション実行エンジン
 *
 * 生徒プロファイルから生成されたデータを使用して、
 * QuestionSchedulerが正しく機能するかシミュレーションします。
 */

import type { StudentProfile } from './studentProfiles';
import type { SimulationContext } from './answerDataGenerator';
import type { Question } from '../../src/types';
import { createSimulationContext, generateSampleWordList } from './answerDataGenerator';

/**
 * シミュレーション結果のスナップショット
 */
export interface AIDecision {
  aiName: string;
  decision: string;
  count: number;
  percentage: number;
}

export interface SimulationSnapshot {
  step: number;
  timestamp: number;
  categoryDistribution: {
    incorrect: number;
    still_learning: number;
    mastered: number;
    new: number;
  };
  scheduledQuestions: {
    word: string;
    priority: number;
    category: string;
  }[];
  detectedSignals: {
    type: string;
    confidence: number;
    action: string;
  }[];
  metricsSnapshot: {
    errorRate: number;
    consecutiveCorrect: number;
    sessionMinutes: number;
    cognitiveLoad: number;
  };
  questionsAsked: {
    total: number;
    byCategory: {
      incorrect: number;
      still_learning: number;
      mastered: number;
      new: number;
    };
  };
  aiDecisions: {
    memoryAI: { [key: string]: number };
    cognitiveLoadAI: { [key: string]: number };
    errorPredictionAI: { [key: string]: number };
    learningStyleAI: { [key: string]: number };
    linguisticAI: { [key: string]: number };
    contextualAI: { [key: string]: number };
    gamificationAI: { [key: string]: number };
    metaAI: { [key: string]: number };
  };
}

/**
 * シミュレーション完全結果
 */
export interface SimulationResult {
  profile: StudentProfile;
  initialState: SimulationSnapshot;
  progressSnapshots: SimulationSnapshot[];
  finalState: SimulationSnapshot;
  summary: {
    totalSteps: number;
    durationMs: number;
    categoryChanges: {
      incorrect: { start: number; end: number; change: number };
      still_learning: { start: number; end: number; change: number };
      mastered: { start: number; end: number; change: number };
      new: { start: number; end: number; change: number };
    };
    aiDecisionsSummary: {
      memoryAI: AIDecision[];
      cognitiveLoadAI: AIDecision[];
      errorPredictionAI: AIDecision[];
      learningStyleAI: AIDecision[];
      linguisticAI: AIDecision[];
      contextualAI: AIDecision[];
      gamificationAI: AIDecision[];
      metaAI: AIDecision[];
    };
    signalsDetected: {
      fatigue: number;
      struggling: number;
      overlearning: number;
      optimal: number;
    };
    correctAnswerRate: number;
    averagePriority: number;
    totalQuestionsAsked: number;
    questionsToResolve: {
      incorrect: number;
      still_learning: number;
    };
  };
}

/**
 * QuestionSchedulerのモック（実際のインポートが必要な場合は置き換え）
 */
class MockQuestionScheduler {
  scheduleQuestions(questions: any[], context: any): any {
    // 実際のQuestionScheduler.tsをインポートして使用
    // ここではモックとして簡易実装
    return {
      scheduledQuestions: questions.map((q, i) => ({
        ...q,
        priority: 10 - i * 0.1,
        category: context.wordProgressMap.get(q.word)?.category || 'new',
      })),
      signals: [],
    };
  }

  detectSignals(context: any): any[] {
    const signals = [];

    // 疲労シグナル
    if (context.sessionMinutes > 20 || context.cognitiveLoad > 0.7) {
      signals.push({ type: 'fatigue', confidence: 0.8, action: 'easier' });
    }

    // 苦戦シグナル
    if (context.errorRate > 0.4) {
      signals.push({ type: 'struggling', confidence: 0.9, action: 'review' });
    }

    // 過学習シグナル
    if (context.consecutiveCorrect >= 10) {
      signals.push({ type: 'overlearning', confidence: 0.75, action: 'harder' });
    }

    // 最適状態シグナル
    if (context.errorRate >= 0.2 && context.errorRate <= 0.35) {
      signals.push({ type: 'optimal', confidence: 0.85, action: 'continue' });
    }

    return signals;
  }
}

/**
 * シミュレーション実行
 */
export async function runSimulation(
  profile: StudentProfile,
  options: {
    steps?: number;
    wordListSize?: number;
    onProgress?: (snapshot: SimulationSnapshot) => void;
  } = {}
): Promise<SimulationResult> {
  const { steps = 50, wordListSize = 100, onProgress } = options;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`シミュレーション開始: ${profile.name}`);
  console.log(`説明: ${profile.description}`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  // 初期コンテキストを生成
  const wordList = generateSampleWordList(wordListSize);
  const context = createSimulationContext(profile, wordList);

  // 8つのAIシステムの判断追跡
  const aiDecisionsTracker = {
    memoryAI: {} as { [key: string]: number },
    cognitiveLoadAI: {} as { [key: string]: number },
    errorPredictionAI: {} as { [key: string]: number },
    learningStyleAI: {} as { [key: string]: number },
    linguisticAI: {} as { [key: string]: number },
    contextualAI: {} as { [key: string]: number },
    gamificationAI: {} as { [key: string]: number },
    metaAI: {} as { [key: string]: number },
  };

  // 出題数追跡
  const totalQuestionsAsked = 0;
  const questionsByCategory = {
    incorrect: 0,
    still_learning: 0,
    mastered: 0,
    new: 0,
  };

  // モックQuestionSchedulerを初期化
  const scheduler = new MockQuestionScheduler();

  // 質問リストを生成
  const questions: Question[] = wordList.map(word => ({
    word,
    meaning: `${word}の意味`,
    reading: word,
    type: 'word' as const,
    difficulty: 'intermediate' as const,
    etymology: '',
    relatedWords: '',
    relatedFields: '',
  }));

  // 初期状態を記録
  const initialSnapshot = createSnapshot(
    0,
    context,
    scheduler,
    questions,
    Date.now(),
    undefined,
    undefined,
    { total: 0, byCategory: { incorrect: 0, still_learning: 0, mastered: 0, new: 0 } },
    aiDecisionsTracker
  );

  console.log('[初期状態]');
  logSnapshot(initialSnapshot);

  const progressSnapshots: SimulationSnapshot[] = [];
  const signalsDetected = {
    fatigue: 0,
    struggling: 0,
    overlearning: 0,
    optimal: 0,
  };

  // ステップごとにシミュレーション
  for (let step = 1; step <= steps; step++) {
    // 各ステップで5問出題
    const questionsThisStep = 5;

    // alQuestionsAsked += questionsThisStep;

    // 出題問題のカテゴリーを記録
    Array.from(context.wordProgressMap.entries())
      .slice(0, questionsThisStep)
      .forEach(([_word, progress]) => {
        const category = progress.category || 'new';
        questionsByCategory[category as keyof typeof questionsByCategory]++;
      });

    // シグナル検出
    const signals = scheduler.detectSignals({
      sessionMinutes: profile.session.durationMinutes + (step / 10),
      cognitiveLoad: profile.session.cognitiveLoad,
      errorRate: profile.patterns.errorRate,
      consecutiveCorrect: profile.patterns.consecutiveCorrect,
    });

    // 8つのAIシステムの判断をシミュレート
    // _simulateAIDecisions(aiDecisionsTracker, signals, context, profile);

    // シグナルを記録
    signals.forEach(signal => {
      signalsDetected[signal.type as keyof typeof signalsDetected]++;
    });

    // 問題をスケジューリング
    const scheduleResult = scheduler.scheduleQuestions(questions, {
      wordProgressMap: context.wordProgressMap,
      sessionMinutes: profile.session.durationMinutes + (step / 10),
      cognitiveLoad: profile.session.cognitiveLoad,
      errorRate: profile.patterns.errorRate,
      consecutiveCorrect: profile.patterns.consecutiveCorrect,
    });

    // スナップショットを作成
    const snapshot = createSnapshot(
      step,
      context,
      scheduler,
      questions,
      Date.now(),
      scheduleResult.scheduledQuestions,
      signals,
      {
        total: totalQuestionsAsked,
        byCategory: { ...questionsByCategory },
      }
    );

    progressSnapshots.push(snapshot);

    if (onProgress) {
      onProgress(snapshot);
    }

    // 10ステップごとにログ出力
    if (step % 10 === 0) {
      console.log(`\n[ステップ ${step}/${steps}]`);
      logSnapshot(snapshot);
    }

    // カテゴリーを更新（シミュレーション）
    simulateCategoryUpdate(context, step, profile);
  }

  // 最終状態を記録
  const finalSnapshot = createSnapshot(
    steps,
    context,
    scheduler,
    questions,
    Date.now(),
    undefined,
    undefined,
    {
      total: totalQuestionsAsked,
      byCategory: { ...questionsByCategory },
    },
    aiDecisionsTracker
  );

  console.log('\n[最終状態]');
  logSnapshot(finalSnapshot);

  const durationMs = Date.now() - startTime;

  // サマリーを計算
  const summary = {
    totalSteps: steps,
    durationMs,
    categoryChanges: {
      incorrect: {
        start: initialSnapshot.categoryDistribution.incorrect,
        end: finalSnapshot.categoryDistribution.incorrect,
        change: finalSnapshot.categoryDistribution.incorrect - initialSnapshot.categoryDistribution.incorrect,
      },
      still_learning: {
        start: initialSnapshot.categoryDistribution.still_learning,
        end: finalSnapshot.categoryDistribution.still_learning,
        change: finalSnapshot.categoryDistribution.still_learning - initialSnapshot.categoryDistribution.still_learning,
      },
      mastered: {
        start: initialSnapshot.categoryDistribution.mastered,
        end: finalSnapshot.categoryDistribution.mastered,
        change: finalSnapshot.categoryDistribution.mastered - initialSnapshot.categoryDistribution.mastered,
      },
      new: {
        start: initialSnapshot.categoryDistribution.new,
        end: finalSnapshot.categoryDistribution.new,
        change: finalSnapshot.categoryDistribution.new - initialSnapshot.categoryDistribution.new,
      },
    },
    aiDecisionsSummary: {
      memoryAI: [],
      cognitiveLoadAI: [],
      errorPredictionAI: [],
      learningStyleAI: [],
      linguisticAI: [],
      contextualAI: [],
      gamificationAI: [],
      metaAI: [],
    },
    signalsDetected,
    correctAnswerRate: (1 - profile.patterns.errorRate) * 100,
    averagePriority: progressSnapshots.length > 0
      ? progressSnapshots.reduce((sum, s) => sum + s.scheduledQuestions[0]?.priority || 0, 0) / progressSnapshots.length
      : 0,
    totalQuestionsAsked,
    questionsToResolve: {
      incorrect: questionsByCategory.incorrect,
      still_learning: questionsByCategory.still_learning,
    },
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log('シミュレーション完了');
  console.log(`所要時間: ${durationMs}ms`);
  console.log(`総出題数: ${totalQuestionsAsked}問`);
  console.log(`  - incorrect出題: ${questionsByCategory.incorrect}問`);
  console.log(`  - still_learning出題: ${questionsByCategory.still_learning}問`);
  console.log(`${'='.repeat(80)}\n`);

  return {
    profile,
    initialState: initialSnapshot,
    progressSnapshots,
    finalState: finalSnapshot,
    summary,
  };
}

/**
 * スナップショットを作成
 */
function createSnapshot(
  step: number,
  context: SimulationContext,
  _scheduler: MockQuestionScheduler,
  questions: Question[],
  timestamp: number,
  scheduledQuestions?: any[],
  signals?: any[],
  questionsAsked?: { total: number; byCategory: any },
  aiDecisions?: any
): SimulationSnapshot {
  const distribution = calculateCategoryDistribution(context.wordProgressMap);

  return {
    step,
    timestamp,
    categoryDistribution: distribution,
    scheduledQuestions: (scheduledQuestions || questions.slice(0, 10)).map(q => {
      const word = typeof q === 'string' ? q : q.word;
      const category = context.wordProgressMap.get(word)?.category || 'new';
      return {
        word,
        priority: q.priority || 0,
        category: String(category),
      };
    }),
    detectedSignals: signals || [],
    metricsSnapshot: {
      errorRate: context.sessionStats.incorrectAnswers / context.sessionStats.totalAnswers,
      consecutiveCorrect: 0, // 簡易実装
      sessionMinutes: (timestamp - context.sessionStats.sessionStartTime) / 60000,
      cognitiveLoad: context.sessionStats.cognitiveLoad,
    },
    questionsAsked: questionsAsked || {
      total: 0,
      byCategory: { incorrect: 0, still_learning: 0, mastered: 0, new: 0 },
    },
    aiDecisions: aiDecisions || {
      memoryAI: {},
      cognitiveLoadAI: {},
      errorPredictionAI: {},
      learningStyleAI: {},
      linguisticAI: {},
      contextualAI: {},
      gamificationAI: {},
      metaAI: {},
    },
  };
}

/**
 * カテゴリー分布を計算
 */
function calculateCategoryDistribution(wordProgressMap: Map<string, any>): any {
  const distribution = {
    incorrect: 0,
    still_learning: 0,
    mastered: 0,
    new: 0,
  };

  wordProgressMap.forEach(progress => {
    const category = progress.category || 'new';
    distribution[category as keyof typeof distribution]++;
  });

  return distribution;
}

/**
 * カテゴリー更新をシミュレート
 */
function simulateCategoryUpdate(
  context: SimulationContext,
  step: number,
  profile: StudentProfile
): void {
  // 学習サイクルのシミュレーション
  context.wordProgressMap.forEach((progress, _word) => {
    // incorrect → still_learningへの移行（正解率に応じて）
    if (progress.category === 'incorrect') {
      // エラー率が低いほど早く移行
      const transitionProbability = 1 - profile.patterns.errorRate;
      if (Math.random() < transitionProbability) {
        progress.category = 'still_learning';
        progress.consecutiveIncorrect = 0;
        progress.consecutiveCorrect = 1;
        progress.correctCount++;
      }
    }

    // still_learning → masteredへの移行（段階的に）
    else if (progress.category === 'still_learning') {
      const currentConsecutiveCorrect = progress.consecutiveCorrect || 0;
      progress.consecutiveCorrect = currentConsecutiveCorrect + 1;
      progress.correctCount++;

      // 3回正解でmastered候補、5回正解で確実にmastered
      if (progress.consecutiveCorrect >= 5 ||
          (progress.consecutiveCorrect >= 3 && Math.random() > 0.3)) {
        progress.category = 'mastered';
        progress.masteredAt = Date.now();
      }
    }

    // new → still_learningへの移行（段階的に学習開始）
    else if (progress.category === 'new') {
      // ステップが進むにつれて新規単語も学習開始
      const learningStartProbability = Math.min(step / 50, 1.0) * 0.4;
      if (Math.random() < learningStartProbability) {
        progress.category = 'still_learning';
        progress.reviewCount = 1;
        progress.consecutiveCorrect = 0;
      }
    }

    // mastered単語も稀に復習が必要になる（忘却）
    else if (progress.category === 'mastered') {
      // 200ステップで5%程度の確率でstill_learningに戻る
      if (step > 100 && Math.random() < 0.0003) {
        progress.category = 'still_learning';
        progress.consecutiveCorrect = 0;
      }
    }
  });
}

/**
 * スナップショットをログ出力
 */
function logSnapshot(snapshot: SimulationSnapshot): void {
  console.log(`カテゴリー分布:`);
  console.log(`  incorrect:       ${snapshot.categoryDistribution.incorrect.toString().padStart(3)} (${((snapshot.categoryDistribution.incorrect / 100) * 100).toFixed(1)}%)`);
  console.log(`  still_learning:  ${snapshot.categoryDistribution.still_learning.toString().padStart(3)} (${((snapshot.categoryDistribution.still_learning / 100) * 100).toFixed(1)}%)`);


/**
 * 8つのAIシステムの判断をシミュレート
 */
function _simulateAIDecisions(
  tracker: any,
  signals: any[],
  context: SimulationContext,
  profile: StudentProfile
): void {
  // 1. 記憶AI: 記憶獲得・定着判定
  const memoryDecision = context.sessionStats.cognitiveLoad > 0.6
    ? '短期記憶重視'
    : context.sessionStats.cognitiveLoad > 0.3
    ? '長期記憶移行'
    : '完全定着';
  tracker.memoryAI[memoryDecision] = (tracker.memoryAI[memoryDecision] || 0) + 1;

  // 2. 認知負荷AI: 疲労検出・休憩推奨
  const cognitiveDecision = profile.session.cognitiveLoad > 0.7
    ? '休憩推奨'
    : profile.session.cognitiveLoad > 0.5
    ? '負荷注意'
    : '最適状態';
  tracker.cognitiveLoadAI[cognitiveDecision] = (tracker.cognitiveLoadAI[cognitiveDecision] || 0) + 1;

  // 3. エラー予測AI: 混同検出・誤答リスク予測
  const errorDecision = profile.patterns.errorRate > 0.4
    ? '高リスク検出'
    : profile.patterns.errorRate > 0.2
    ? '中リスク検出'
    : '低リスク';
  tracker.errorPredictionAI[errorDecision] = (tracker.errorPredictionAI[errorDecision] || 0) + 1;

  // 4. 学習スタイルAI: 個人最適化・時間帯調整
  const hour = new Date().getHours();
  const styleDecision = hour < 12 ? '朝型学習推奨' : hour < 18 ? '午後集中型' : '夜型学習推奨';
  tracker.learningStyleAI[styleDecision] = (tracker.learningStyleAI[styleDecision] || 0) + 1;

  // 5. 言語関連AI: 語源・関連語ネットワーク
  const linguisticDecision = Math.random() > 0.5 ? '語源関連提示' : '類義語展開';
  tracker.linguisticAI[linguisticDecision] = (tracker.linguisticAI[linguisticDecision] || 0) + 1;

  // 6. 文脈AI: 意味的クラスタリング
  const contextDecision = Math.random() > 0.6 ? 'テーマ別学習' : Math.random() > 0.3 ? '文脈グループ化' : 'ランダム配置';
  tracker.contextualAI[contextDecision] = (tracker.contextualAI[contextDecision] || 0) + 1;

  // 7. ゲーミフィケーションAI: モチベーション管理
  const gamificationDecision = context.sessionStats.correctAnswers > context.sessionStats.incorrectAnswers * 2
    ? '達成感強化'
    : context.sessionStats.correctAnswers > context.sessionStats.incorrectAnswers
    ? 'バランス維持'
    : '励まし重視';
  tracker.gamificationAI[gamificationDecision] = (tracker.gamificationAI[gamificationDecision] || 0) + 1;

  // 8. QuestionScheduler（メタAI統合層）: 7AIのシグナル統合
  const metaDecision = signals.length > 0
    ? signals[0].action === 'review'
      ? '復習優先出題'
      : signals[0].action === 'easier'
      ? '易問出題'
      : signals[0].action === 'harder'
      ? '難問出題'
      : '通常出題'
    : '通常出題';
  tracker.metaAI[metaDecision] = (tracker.metaAI[metaDecision] || 0) + 1;
}

/**
 * AI判断サマリーを生成
 */
function _generateAIDecisionsSummary(tracker: any, totalSteps: number): any {
  const summary: any = {};

  for (const [aiName, decisions] of Object.entries(tracker)) {
    summary[aiName] = Object.entries(decisions as { [key: string]: number })
      .map(([decision, count]) => ({
        aiName,
        decision,
        count: count as number,
        percentage: ((count as number) / totalSteps) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  return summary;
} console.log(`  mastered:        ${snapshot.categoryDistribution.mastered.toString().padStart(3)} (${((snapshot.categoryDistribution.mastered / 100) * 100).toFixed(1)}%)`);
  console.log(`  new:             ${snapshot.categoryDistribution.new.toString().padStart(3)} (${((snapshot.categoryDistribution.new / 100) * 100).toFixed(1)}%)`);

  if (snapshot.detectedSignals.length > 0) {
    console.log(`検出されたシグナル:`);
    snapshot.detectedSignals.forEach(signal => {
      console.log(`  - ${signal.type}: ${signal.action} (confidence: ${signal.confidence})`);
    });
  }

  if (snapshot.questionsAsked.total > 0) {
    console.log(`出題数:`);
    console.log(`  総出題: ${snapshot.questionsAsked.total}問`);
    console.log(`  incorrect: ${snapshot.questionsAsked.byCategory.incorrect}問`);
    console.log(`  still_learning: ${snapshot.questionsAsked.byCategory.still_learning}問`);
  }
}
