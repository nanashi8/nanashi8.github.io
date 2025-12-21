# Git履歴学習レポート

**学習日時**: 2025-12-21T10:15:18.992Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 357件
- **抽出パターン数**: 303件
- **新規パターン**: 0件
- **更新パターン**: 303件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）


1. **src/App.tsx** - 92回修正
   - リスクレベル: 高


2. **src/components/ScoreBoard.tsx** - 91回修正
   - リスクレベル: 高


3. **src/components/GrammarQuizView.tsx** - 85回修正
   - リスクレベル: 高


4. **src/components/SpellingView.tsx** - 76回修正
   - リスクレベル: 高


5. **src/components/ComprehensiveReadingView.tsx** - 73回修正
   - リスクレベル: 高


6. **src/components/MemorizationView.tsx** - 69回修正
   - リスクレベル: 高


7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高


8. **src/progressStorage.ts** - 40回修正
   - リスクレベル: 高


9. **src/components/QuestionCard.tsx** - 40回修正
   - リスクレベル: 高


10. **src/components/StatsView.tsx** - 31回修正
   - リスクレベル: 高


---

## 📋 抽出された失敗パターン


### 1. logic-error

**説明**: fix: ドキュメントリンク断線をさらに5箇所修正 (143→138)


**影響ファイル**: docs/development/CSS_COLOR_BEST_PRACTICES.md, docs/development/CSS_DEVELOPMENT_GUIDELINES.md, docs/development/REFACTORING_PLAN.md, docs/development/UI_IMMUTABLE_SPECIFICATIONS.md, docs/features/random-skip-feature.md, docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md


### 2. logic-error

**説明**: fix: ドキュメントリンク断線をさらに23箇所修正 (166→143)


**影響ファイル**: docs/design/PROJECT_STRUCTURE_VALIDATION.md, docs/development/REFACTORING_PLAN.md, docs/development/deployment.md, docs/development/setup.md, docs/development/testing-strategy.md, docs/features/random-skip-feature.md, docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md, docs/how-to/QUESTION_SCHEDULER_RECOVERY.md, docs/maintenance/SELF_MANAGING_PROJECT.md, docs/maintenance/SERVANT_AUTO_FIX_EXPANSION.md, docs/plans/ADAPTIVE_AI_INTEGRATION_PLAN_2025-12-17.md, docs/plans/DOCUMENTATION_IMPLEMENTATION_ALIGNMENT_PLAN.md, docs/plans/LINK_FIX_PLAN.md, docs/plans/PHASE_1_TASKS.md, docs/plans/PROJECT_CLEANUP_PLAN_2025-12-17.md, docs/processes/AUTOMATION_GUIDE.md


### 3. logic-error

**説明**: fix: ドキュメントリンク断線をさらに5箇所修正 (171→166)


**影響ファイル**: docs/design/DARK_MODE_GUIDE.md, docs/design/INDUSTRY_STANDARDS_ADOPTION_PLAN.md, docs/design/PROJECT_STRUCTURE_VALIDATION.md, docs/development/CSS_COLOR_BEST_PRACTICES.md, docs/development/CSS_DEVELOPMENT_GUIDELINES.md, docs/development/CSS_LEARNING_PATH.md, docs/development/CSS_MAINTENANCE_COST_ANALYSIS.md, docs/development/REFACTORING_PLAN.md, docs/development/TYPESCRIPT_DEVELOPMENT_GUIDELINES.md, docs/development/UI_DEVELOPMENT_GUIDELINES.md, docs/development/UI_IMMUTABLE_SPECIFICATIONS.md, docs/development/VISUAL_REGRESSION_TESTING.md, docs/references/VS_CODE_SIMPLE_BROWSER_GUIDE.md


### 4. logic-error

**説明**: fix: ドキュメントリンク断線を53箇所修正 (224→171)


**影響ファイル**: .aitk/.commit-count, docs/ADAPTIVE_GUARD_SYSTEM.md, docs/design/PROJECT_STRUCTURE_VALIDATION.md, docs/development/CSS_MAINTENANCE_COST_ANALYSIS.md, docs/development/UI_DEVELOPMENT_GUIDELINES.md, docs/development/UI_IMMUTABLE_SPECIFICATIONS.md, docs/development/deployment.md, docs/development/setup.md, docs/development/testing-strategy.md, docs/quality/QUALITY_CHECKLIST.md, docs/references/DATA_MANAGEMENT_GUIDE.md, docs/references/EMERGENCY_RECOVERY_GUIDE.md, docs/references/QUICK_REFERENCE.md, scripts/analyze-doc-links.mjs


### 5. logic-error

**説明**: fix: docs/README.mdから存在しないファイルへのリンク削除 (228→224)


**影響ファイル**: docs/README.md


### 6. logic-error

**説明**: fix: docs/README.mdのリンクをさらに3箇所修正 (231→228)


**影響ファイル**: docs/README.md


### 7. logic-error

**説明**: fix: docs/README.mdの断線リンクを29箇所修正 (257→231)


**影響ファイル**: docs/README.md


### 8. logic-error

**説明**: fix: ドキュメントリンク断線を6箇所修正 (263→257)


**影響ファイル**: .aitk/.commit-count, docs/ADAPTIVE_GUARD_SYSTEM.md, docs/AI_INTEGRATION_GUIDE.md, docs/MAINTENANCE_AI_GUIDE.md, docs/README.md, docs/plans/LINK_FIX_PLAN.md, docs/plans/grammar-multiple-correct-answers-verification-plan.md, scripts/add-frontmatter.mjs, scripts/analyze-doc-links.mjs, scripts/fix-aitk-links.sh


### 9. test-error

**説明**: test: ランダム飛ばし機能に対応したテスト更新


**影響ファイル**: .aitk/.commit-count, tests/integration/learning-ai-integration.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts


### 10. property-naming-error


**修正前**: `    wordProgress.incorrectCount+`
**修正後**: `const correct = progress.memorizationCorrect`
**影響ファイル**: .aitk/.commit-count, .aitk/instructions/ai-code-quality-checklist.instructions.md, .aitk/instructions/ai-self-check-prompts.instructions.md, .aitk/instructions/property-naming-convention.instructions.md, .aitk/instructions/refactoring-safety-guide.instructions.md, .aitk/instructions/ui-performance-priority.instructions.md, .github/workflows/adaptive-guard-learning.yml, .github/workflows/pr-validation.yml, .github/workflows/quality-check.yml, ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md, docs/ADAPTIVE_GUARD_SYSTEM.md, docs/MAINTENANCE_AI_GUIDE.md, docs/QUALITY_ASSURANCE_SYSTEM_REPORT.md, docs/SERVANT_SCOPE.md, docs/guidelines/ci-cd-enhancement-plan.md, docs/plans/AI_IMPROVEMENT_ROADMAP.md, docs/plans/EXPERIMENT_PLAN.md, docs/plans/IMPLEMENTATION_CHECKLIST.md, docs/plans/METRICS_DEFINITION.md, docs/plans/PHASE1_COMPLETION_REPORT.md, docs/plans/PHASE1_P0_TASKS.md, docs/plans/QUICKSTART.md, docs/plans/README.md, docs/plans/RESPONSIBILITY_SEPARATION_PLAN.md, docs/plans/RISK_REGISTER.md, public/data/fill-in-blank-questions-grade3.json, public/data/verb-form-questions-grade3.json, public/debug-priority.html, scripts/analyze-failure-pattern.mjs, scripts/detect-dangerous-patterns.mjs, scripts/learn-from-git-history.mjs, scripts/update-instructions.mjs, scripts/update-pipelines.mjs, scripts/update-specifications.mjs, src/ai/AICoordinator.ts, src/ai/architecture.md, src/ai/experiments/ABTestManager.ts, src/ai/experiments/MetricsCollector.ts, src/ai/experiments/experiments.ts, src/ai/explainability/priorityExplanation.ts, src/ai/meta/AdaptiveEducationalAINetwork.ts, src/ai/metrics/calibration.ts, src/ai/models/ForgettingCurveModel.ts, src/ai/scheduler/AntiVibrationFilter.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/services/PredictionLogger.ts, src/ai/specialists/CognitiveLoadAI.ts, src/ai/specialists/ContextualAI.ts, src/ai/specialists/ErrorPredictionAI.ts, src/ai/specialists/GamificationAI.ts, src/ai/specialists/LinguisticAI.ts, src/ai/types.ts, src/ai/utils/categoryDetermination.ts, src/components/ABTestResults.tsx, src/components/AISimulator.tsx, src/components/CalibrationDashboard.tsx, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/PriorityBadge.tsx, src/components/QuestionCard.tsx, src/components/SpellingView.tsx, src/components/StatsView.tsx, src/components/TranslationView.tsx, src/hooks/useWordPriority.ts, src/storage/progress/progressStorage.ts, src/storage/progress/types.ts, src/strategies/hybridQuestionSelector.ts, src/strategies/memoryAcquisitionAlgorithm.ts, test-priority.mjs, tests/integration/AdaptiveNetwork.integration.test.ts, tests/integration/learning-ai-e2e.test.ts, tests/integration/learning-ai-integration.test.ts, tests/phase1-integration-test.spec.ts, tests/simulation/answerDataGenerator.ts, tests/simulation/runAllSimulations.ts, tests/simulation/simulationEngine.ts, tests/simulation/studentProfiles.ts, tests/simulation/visualizeProgress.ts, tests/unit/ai/experiments/ABTestManager.test.ts, tests/unit/ai/experiments/MetricsCollector.test.ts, tests/unit/ai/explainability/priorityExplanation.test.ts, tests/unit/ai/metrics/calibration.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/ai/services/PredictionLogger.test.ts, tests/unit/ai/specialists/MemoryAI.test.ts, tests/unit/customQuestionStorage.test.ts, tests/unit/hybridQuestionSelector.test.ts, tests/unit/learningPhaseDetector.test.ts, tests/unit/memoryAcquisitionAlgorithm.test.ts, tests/unit/practicalStudentScenario.test.ts, tests/unit/progressStorage.test.ts, tests/unit/questionScheduler.test.ts, tests/unit/sessionHistory.test.ts


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 303件
2. **高リスクファイル**: 17ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-21T10:15:18.992Z
