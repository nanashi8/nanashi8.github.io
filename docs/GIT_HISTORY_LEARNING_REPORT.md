# Git履歴学習レポート

**学習日時**: 2025-12-23T08:00:47.006Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 368件
- **抽出パターン数**: 312件
- **新規パターン**: 0件
- **更新パターン**: 312件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）

1. **src/App.tsx** - 95回修正
   - リスクレベル: 高

2. **src/components/ScoreBoard.tsx** - 93回修正
   - リスクレベル: 高

3. **src/components/GrammarQuizView.tsx** - 86回修正
   - リスクレベル: 高

4. **src/components/SpellingView.tsx** - 77回修正
   - リスクレベル: 高

5. **src/components/ComprehensiveReadingView.tsx** - 74回修正
   - リスクレベル: 高

6. **src/components/MemorizationView.tsx** - 70回修正
   - リスクレベル: 高

7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高

8. **src/components/QuestionCard.tsx** - 42回修正
   - リスクレベル: 高

9. **src/progressStorage.ts** - 40回修正
   - リスクレベル: 高

10. **src/components/StatsView.tsx** - 31回修正

- リスクレベル: 高

---

## 📋 抽出された失敗パターン

### 1. logic-error

**説明**: fix: GamificationAIのPosition引き上げ対象を拡大 (>=30 → >=20)

**影響ファイル**: .aitk/.commit-count, src/ai/specialists/GamificationAI.ts

### 2. property-naming-error

**修正前**: `      const totalAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount`
**修正後**: `  wordProgress.memorizationAttempts = (wordProgress.memorizationAttempts`
**影響ファイル**: .aitk/.commit-count, .aitk/instructions/ai-modification-guard.instructions.md, .aitk/instructions/no-fix-on-fix.instructions.md, .aitk/instructions/no-symptomatic-fixes.instructions.md, .github/CONTRIBUTING.md, .github/workflows/quality-check.yml, README.md, docs/ML_OPERATION_GUIDE.md, docs/design/ARCHITECTURE.md, docs/development/COMPLETE_LEARNING_SYSTEM_ROADMAP.md, docs/development/POSITION_SCORING_REFACTORING_PROPOSAL.md, docs/development/STRATEGY_PATTERN_REFACTORING_PLAN.md, docs/development/STRATEGY_PATTERN_VS_SPECIALIST_AI_ANALYSIS.md, docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md, docs/reports/FAILURE_ANALYSIS_REQUEUE_DUPLICATE.md, docs/reports/PHASE6_COMPLETION_REPORT.md, docs/research/ADAPTIVE_LEARNING_RESEARCH_2024.md, docs/roadmap/PLATFORM_ROADMAP.md, docs/specifications/QUESTION_ANSWER_FLOW.md, docs/specifications/REQUEUEING_MECHANISM.md, package-lock.json, package.json, scripts/check-symptomatic-fixes.sh, scripts/pre-commit-fix-check.sh, scripts/pre-commit-symptomatic-check, src/App.tsx, src/ai/AICoordinator.ts, src/ai/demo.ts, src/ai/explainability/priorityExplanation.ts, src/ai/meta/AdaptiveEducationalAINetwork.ts, src/ai/meta/EffectivenessTracker.ts, src/ai/meta/SignalDetector.ts, src/ai/meta/StrategyExecutor.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/ml/types.ts, src/ai/scheduler/AntiVibrationFilter.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/types.ts, src/ai/specialists/CognitiveLoadAI.ts, src/ai/specialists/ContextualAI.ts, src/ai/specialists/EmotionalAI.ts, src/ai/specialists/ErrorPredictionAI.ts, src/ai/specialists/GamificationAI.ts, src/ai/specialists/LearningStyleAI.ts, src/ai/specialists/LinguisticAI.ts, src/ai/specialists/MemoryAI.ts, src/ai/specialists/context/ContextRotationSystem.ts, src/ai/specialists/context/ResourceManager.ts, src/ai/specialists/memory/ForgettingCurveModel.ts, src/ai/specialists/memory/LongTermMemoryStrategy.ts, src/ai/specialists/memory/SM2Algorithm.ts, src/ai/specialists/scaffolding/ScaffoldingSystem.ts, src/ai/types.ts, src/ai/utils/categoryDetermination.ts, src/ai/utils/positionConstants.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/QuestionCard.tsx, src/components/RequeuingDebugPanel.tsx, src/components/RequeuingDebugPanel.tsx.bak, src/components/ScoreBoard.tsx, src/components/SettingsView.tsx, src/components/SpellingView.tsx, src/components/TranslationView.tsx, src/components/quiz/EncouragementDisplay.tsx, src/components/quiz/HintDisplay.tsx, src/components/quiz/QuestionVariantCard.tsx, src/hooks/useAdaptiveNetwork.ts, src/hooks/useQuestionRequeue.ts, src/metrics/ab/aggregate.ts, src/metrics/ab/divergenceGuard.ts, src/metrics/ab/identity.ts, src/metrics/ab/positionGuard.ts, src/metrics/ab/snapshot.ts, src/metrics/ab/storage.ts, src/metrics/ab/types.ts, src/metrics/ab/variant.ts, src/metrics/ab/vibrationGuard.ts, src/storage/progress/progressStorage.ts, src/storage/progress/statistics.ts, src/storage/progress/types.ts, src/strategies/memoryAcquisitionAlgorithm.ts, src/styles/encouragement.css, src/styles/question-variant.css, src/utils/debugAIEvaluations.ts, src/utils/performance-monitor.ts, tests/ai/context/ContextRotationSystem.test.ts, tests/ai/context/ResourceManager.test.ts, tests/ai/ml/MemoryAI.ml.test.ts, tests/unit/ai/utils/positionConstants.test.ts

### 3. logic-error

**説明**: fix: ルートdocs/への断線リンクを修正

**影響ファイル**: .aitk/.commit-count, .github/workflows/link-checker.yml, README.md, README.old.md, tests/docsIntegrity.spec.ts

### 4. logic-error

**説明**: fix: 実装からドキュメントへの配線修正（5箇所）

**影響ファイル**: .aitk/.commit-count, docs/how-to/QUESTION_SCHEDULER_RECOVERY.md, src/App.tsx, src/constants/categories.ts, src/types.ts, src/utils.ts

### 5. logic-error

**説明**: docs: リンク断線修正完了レポート作成

**影響ファイル**: .aitk/.commit-count, docs/reports/LINK_FIX_COMPLETION_REPORT.md

### 6. logic-error

**説明**: fix: 未作成ファイルへのリンク削除（2箇所）

**影響ファイル**: .aitk/.commit-count, docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md, docs/plans/LINK_FIX_PLAN.md

### 7. logic-error

**説明**: fix: 存在しないファイルへのリンク削除と残り断線修正（9箇所）

**影響ファイル**: .aitk/.commit-count, docs/processes/REFACTORING_SAFETY.md, docs/quality/CONTENT_QUALITY_TESTING_REPORT.md, docs/quality/QUALITY_CHECKLIST.md, docs/quality/TECHNICAL_VISION.md, docs/references/QUESTION_SCHEDULER_API.md, docs/references/QUESTION_SCHEDULER_TYPES.md, docs/references/QUICK_REFERENCE.md, docs/specifications/01-project-overview.md, docs/specifications/15-data-structures.md

### 8. logic-error

**説明**: fix: 現行ドキュメント断線一括修正（16箇所）

**影響ファイル**: .aitk/.commit-count, docs/quality/QUALITY_CHECKLIST.md, docs/references/DDA_IMPLEMENTATION.md, docs/references/EMERGENCY_RECOVERY_GUIDE.md, docs/specifications/01-project-overview.md, docs/specifications/15-data-structures.md, docs/specifications/19-junior-high-vocabulary.md, docs/specifications/20-junior-high-phrases.md

### 9. logic-error

**説明**: fix: 高参照ファイルの断線修正完了（52箇所）

**影響ファイル**: .aitk/.commit-count, .husky/check-doc-naming, docs/processes/DOCS_REORGANIZATION_PLAN.md, docs/quality/INTEGRATED_QUALITY_PIPELINE.md, docs/references/DATA_MANAGEMENT_GUIDE.md, docs/references/QUICK_REFERENCE.md, docs/roadmap/PLATFORM_ROADMAP.md, scripts/analyze-naming-violations.mjs, scripts/rename-with-link-update.mjs

### 10. logic-error

**説明**: fix: ドキュメントリンク断線をさらに5箇所修正 (143→138)

**影響ファイル**: docs/development/CSS_COLOR_BEST_PRACTICES.md, docs/development/CSS_DEVELOPMENT_GUIDELINES.md, docs/development/REFACTORING_PLAN.md, docs/development/UI_IMMUTABLE_SPECIFICATIONS.md, docs/features/random-skip-feature.md, docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md

---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 312件
2. **高リスクファイル**: 17ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:

- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-23T08:00:47.006Z
