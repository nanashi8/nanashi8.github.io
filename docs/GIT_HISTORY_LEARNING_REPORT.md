# Git履歴学習レポート

**学習日時**: 2025-12-25T00:12:46.578Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 381件
- **抽出パターン数**: 328件
- **新規パターン**: 0件
- **更新パターン**: 328件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）

1. **src/App.tsx** - 98回修正
   - リスクレベル: 高

2. **src/components/ScoreBoard.tsx** - 95回修正
   - リスクレベル: 高

3. **src/components/GrammarQuizView.tsx** - 90回修正
   - リスクレベル: 高

4. **src/components/SpellingView.tsx** - 83回修正
   - リスクレベル: 高

5. **src/components/MemorizationView.tsx** - 75回修正
   - リスクレベル: 高

6. **src/components/ComprehensiveReadingView.tsx** - 75回修正
   - リスクレベル: 高

7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高

8. **src/components/QuestionCard.tsx** - 45回修正
   - リスクレベル: 高

9. **src/progressStorage.ts** - 41回修正
   - リスクレベル: 高

10. **src/components/StatsView.tsx** - 31回修正

- リスクレベル: 高

---

## 📋 抽出された失敗パターン

### 1. logic-error

**説明**: test: remove orphaned quickCategoryDetermination test and fix doc path

**影響ファイル**: .aitk/.commit-count, README_EN.md, tests/integration/maintenance-ai.test.ts, tests/unit/ai/utils/quickCategoryDetermination.test.ts

### 2. test-error

**説明**: test: remove orphaned quickCategoryDetermination test and fix doc path

**影響ファイル**: .aitk/.commit-count, README_EN.md, tests/integration/maintenance-ai.test.ts, tests/unit/ai/utils/quickCategoryDetermination.test.ts

### 3. logic-error

**説明**: fix(debug): RequeuingDebugPanel 500エラー修正と次30問表示の整合

**影響ファイル**: .aitk/.commit-count, src/components/RequeuingDebugPanel.tsx, src/hooks/useQuestionRequeue.ts

### 4. logic-error

**説明**: fix(debug): RequeuingDebugPanelでPosition降順ソート表示に修正

**影響ファイル**: .aitk/.commit-count, src/components/RequeuingDebugPanel.tsx

### 5. property-naming-error

**修正前**: `        const totalCorrect = (wp.correctCount`
**修正後**: `    return (progress.memorizationAttempts`
**影響ファイル**: .aitk/.commit-count, docs/features/grammar-passage-feature.md, docs/maintenance/WORD_GROUPING_OPERATIONS_GUIDE.md, public/data/vocabulary/high-school-intermediate-phrases.csv, src/ai/AICoordinator.ts, src/ai/demo.ts, src/ai/explainability/priorityExplanation.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/optimization/contextualLearningAI.ts, src/ai/optimization/wordGroupingQualityMetrics.ts, src/ai/optimization/wordMetadata.ts, src/ai/optimization/wordMetadataCache.ts, src/ai/optimization/wordMetadataDebug.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/types.ts, src/ai/services/PredictionLogger.ts, src/ai/specialists/ContextualAI.ts, src/ai/specialists/ErrorPredictionAI.ts, src/ai/specialists/LearningStyleAI.ts, src/ai/specialists/LinguisticAI.ts, src/ai/specialists/MemoryAI.ts, src/ai/types.ts, src/ai/utils/categoryDetermination.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/QuestionCard.tsx, src/components/RequeuingDebugPanel.tsx, src/components/SpellingView.tsx, src/components/TranslationView.tsx, src/hooks/useQuestionRequeue.ts, src/hooks/useWordPriority.ts, src/index.css, src/storage/progress/progressStorage.ts, src/storage/progress/statistics.ts, src/storage/progress/types.ts, src/utils/db-connection-pool.ts, tests/ai/ml/MemoryAI.ml.test.ts, tests/integration/learning-ai-integration.test.ts, tests/integration/phase1-performance.test.ts, tests/unit/ai/explainability/priorityExplanation.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/ai/specialists/MemoryAI.test.ts, tests/unit/ai/utils/quickCategoryDetermination.test.ts, tests/unit/questionScheduler.test.ts, tests/unit/utils/db-connection-pool.test.ts

### 6. logic-error

**説明**: fix: テスト全通過のための修正とデータ品質改善

**影響ファイル**: .aitk/.commit-count, docs/features/grammar-passage-feature.md, docs/maintenance/WORD_GROUPING_OPERATIONS_GUIDE.md, public/data/vocabulary/high-school-intermediate-phrases.csv, src/ai/AICoordinator.ts, src/ai/demo.ts, src/ai/explainability/priorityExplanation.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/optimization/contextualLearningAI.ts, src/ai/optimization/wordGroupingQualityMetrics.ts, src/ai/optimization/wordMetadata.ts, src/ai/optimization/wordMetadataCache.ts, src/ai/optimization/wordMetadataDebug.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/types.ts, src/ai/services/PredictionLogger.ts, src/ai/specialists/ContextualAI.ts, src/ai/specialists/ErrorPredictionAI.ts, src/ai/specialists/LearningStyleAI.ts, src/ai/specialists/LinguisticAI.ts, src/ai/specialists/MemoryAI.ts, src/ai/types.ts, src/ai/utils/categoryDetermination.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/QuestionCard.tsx, src/components/RequeuingDebugPanel.tsx, src/components/SpellingView.tsx, src/components/TranslationView.tsx, src/hooks/useQuestionRequeue.ts, src/hooks/useWordPriority.ts, src/index.css, src/storage/progress/progressStorage.ts, src/storage/progress/statistics.ts, src/storage/progress/types.ts, src/utils/db-connection-pool.ts, tests/ai/ml/MemoryAI.ml.test.ts, tests/integration/learning-ai-integration.test.ts, tests/integration/phase1-performance.test.ts, tests/unit/ai/explainability/priorityExplanation.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/ai/specialists/MemoryAI.test.ts, tests/unit/ai/utils/quickCategoryDetermination.test.ts, tests/unit/questionScheduler.test.ts, tests/unit/utils/db-connection-pool.test.ts

### 7. test-error

**説明**: fix: テスト全通過のための修正とデータ品質改善

**影響ファイル**: .aitk/.commit-count, docs/features/grammar-passage-feature.md, docs/maintenance/WORD_GROUPING_OPERATIONS_GUIDE.md, public/data/vocabulary/high-school-intermediate-phrases.csv, src/ai/AICoordinator.ts, src/ai/demo.ts, src/ai/explainability/priorityExplanation.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/optimization/contextualLearningAI.ts, src/ai/optimization/wordGroupingQualityMetrics.ts, src/ai/optimization/wordMetadata.ts, src/ai/optimization/wordMetadataCache.ts, src/ai/optimization/wordMetadataDebug.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/types.ts, src/ai/services/PredictionLogger.ts, src/ai/specialists/ContextualAI.ts, src/ai/specialists/ErrorPredictionAI.ts, src/ai/specialists/LearningStyleAI.ts, src/ai/specialists/LinguisticAI.ts, src/ai/specialists/MemoryAI.ts, src/ai/types.ts, src/ai/utils/categoryDetermination.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/QuestionCard.tsx, src/components/RequeuingDebugPanel.tsx, src/components/SpellingView.tsx, src/components/TranslationView.tsx, src/hooks/useQuestionRequeue.ts, src/hooks/useWordPriority.ts, src/index.css, src/storage/progress/progressStorage.ts, src/storage/progress/statistics.ts, src/storage/progress/types.ts, src/utils/db-connection-pool.ts, tests/ai/ml/MemoryAI.ml.test.ts, tests/integration/learning-ai-integration.test.ts, tests/integration/phase1-performance.test.ts, tests/unit/ai/explainability/priorityExplanation.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/ai/specialists/MemoryAI.test.ts, tests/unit/ai/utils/quickCategoryDetermination.test.ts, tests/unit/questionScheduler.test.ts, tests/unit/utils/db-connection-pool.test.ts

### 8. property-naming-error

**修正前**: `      attempts: (wordProgress.correctCount || 0) + (wordProgress.incorrectCount`
**修正後**: `        modeAttempts = wordProgress.memorizationAttempts`
**影響ファイル**: .aitk/.commit-count, src/ai/scheduler/QuestionScheduler.ts, src/ai/utils/categoryDetermination.ts

### 9. logic-error

**説明**: fix: まだまだ・分からないの永続化とモード別試行回数の修正

**影響ファイル**: .aitk/.commit-count, src/ai/scheduler/QuestionScheduler.ts, src/ai/utils/categoryDetermination.ts

### 10. property-naming-error

**修正前**: `**修正前**: ` wordProgress.incorrectCount+`**修正後**:` "fix": " const transCorrect = wordStat.translationCorrect`
**影響ファイル**: .aitk/.commit-count, .aitk/failure-patterns.json, .aitk/instructions/adaptive-guard-system.instructions.md, docs/GIT_HISTORY_LEARNING_REPORT.md, scripts/adaptive-guard-checks.sh, src/ai/scheduler/QuestionScheduler.ts, src/components/RequeuingDebugPanel.tsx

---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 328件
2. **高リスクファイル**: 19ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:

- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-25T00:12:46.578Z
