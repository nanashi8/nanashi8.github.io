/**
 * AI機能の統合エクスポート
 */

// 認知負荷AI
export {
  calculateCognitiveLoad,
  adjustDifficultyByCognitiveLoad,
  generateFatigueMessage,
  type CognitiveLoadMonitor,
  type SessionResponse,
} from './cognitive/cognitiveLoadAI';

// エラー予測AI
export {
  analyzeErrorPatterns,
  batchPredictErrors,
  type ErrorPrediction,
  type ErrorAnalysis,
} from './prediction/errorPredictionAI';

// 適応学習AI
export type {
  MemoryRetention,
  ReviewEvent,
  SpacedRepetitionSchedule,
  UserLearningCharacteristics,
} from './adaptation/adaptiveLearningAI';
export {
  calculateMemoryRetention,
  generateSpacedRepetitionSchedule,
  selectNextQuestions,
  buildUserLearningCharacteristics,
  calculateRetentionRate,
} from './adaptation/adaptiveLearningAI';

export {
  recordSessionStats,
  saveSessionToHistory,
  loadSessionHistory,
  generateLearningStyleProfile,
  generateRecommendationMessage,
  getTimeOfDay as getTimeOfDayStyle,
} from './adaptation/learningStyleAI';

// 分析AI
export {
  analyzeRadarChart,
  prioritizeWeakCategoryQuestions,
  saveImprovementProgress,
  updateImprovementProgress,
  getImprovementProgress,
} from './analysis/radarChartAI';

export {
  analyzeLearningHistory,
  calculateQuestionPriorities,
  planConsolidationSequence,
  type WordLearningHistory,
  type LearningAttempt,
  type QuestionPriority,
} from './analysis/learningCurveAI';

export * from './analysis/linguisticRelationsAI';

// 最適化AI
export * from './optimization/learningOptimizer';
export { generateContextualSequence } from './optimization/contextualLearningAI';

// エンゲージメントAI
export {
  processSessionEnd,
  getMotivationalMessage,
  type GamificationStats,
} from './engagement/gamificationAI';
