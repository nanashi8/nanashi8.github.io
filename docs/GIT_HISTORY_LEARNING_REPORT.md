# Git履歴学習レポート

**学習日時**: 2025-12-31T23:45:08.935Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 414件
- **抽出パターン数**: 364件
- **新規パターン**: 0件
- **更新パターン**: 364件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）


1. **src/App.tsx** - 106回修正
   - リスクレベル: 高


2. **src/components/ScoreBoard.tsx** - 105回修正
   - リスクレベル: 高


3. **src/components/GrammarQuizView.tsx** - 94回修正
   - リスクレベル: 高


4. **src/components/MemorizationView.tsx** - 92回修正
   - リスクレベル: 高


5. **src/components/ComprehensiveReadingView.tsx** - 91回修正
   - リスクレベル: 高


6. **src/components/SpellingView.tsx** - 87回修正
   - リスクレベル: 高


7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高


8. **src/components/QuestionCard.tsx** - 46回修正
   - リスクレベル: 高


9. **src/progressStorage.ts** - 41回修正
   - リスクレベル: 高


10. **src/storage/progress/progressStorage.ts** - 34回修正
   - リスクレベル: 高


---

## 📋 抽出された失敗パターン


### 1. logic-error

**説明**: fix: Restore used parameter names in SlotAllocator methods


**影響ファイル**: src/ai/scheduler/SlotAllocator.ts


### 2. logic-error

**説明**: fix: Resolve all ESLint warnings (unused vars/imports) - 57 warnings fixed


**影響ファイル**: .aitk/.commit-count, extensions/servant/src/context/ProjectContextDB.ts, extensions/servant/src/engine/RuleEngine.ts, extensions/servant/src/git/HookInstaller.ts, extensions/servant/src/learning/AIActionTracker.ts, extensions/servant/src/learning/AIEvaluator.ts, extensions/servant/src/learning/GitHistoryAnalyzer.ts, extensions/servant/src/neural/NeuralDependencyGraph.ts, extensions/servant/src/neural/NeuralLearningEngine.ts, extensions/servant/src/neural/OptimizationEngine.ts, extensions/servant/src/neural/WorkflowLearner.ts, extensions/servant/src/performance/IncrementalValidator.ts, extensions/servant/src/performance/ValidationCache.ts, extensions/servant/src/providers/InstructionsCodeActionProvider.ts, extensions/servant/src/specialists/ArchitectureAdvisor.ts, extensions/servant/tests/InstructionsCodeActionProvider.test.ts, extensions/servant/tests/MermaidParser.test.ts, extensions/servant/tests/NeuralDependencyGraph.test.ts, extensions/servant/tests/OptimizationEngine.test.ts, extensions/servant/tests/RuleEngine.test.ts, extensions/servant/tests/WorkflowLearner.test.ts, extensions/servant/tests/__mocks__/vscode.ts, src/App.css, src/ai/demo.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/scheduler/CategoryClassifier.ts, src/ai/scheduler/CategoryPositionCalculator.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/SlotAllocator.ts


### 3. logic-error

**説明**: fix: Remove duplicate script and resolve linting errors


**影響ファイル**: extensions/servant/src/learning/AIActionTracker.ts, extensions/servant/src/parser/MermaidParser.ts, src/ai/scheduler/QuestionScheduler.ts, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx


### 4. property-naming-error


**修正前**: `        modeAttempts = (wordProgress.correctCount || 0) + (wordProgress.incorrectCount`
**修正後**: `  const attempts = wordProgress.memorizationAttempts`
**影響ファイル**: .aitk/.commit-count, .aitk/ai-failure-history.json, .aitk/instructions/EVOLUTION_PLAN.md, .aitk/instructions/INDEX.md, .aitk/instructions/README.md, .aitk/instructions/ai-failure-prevention.instructions.md, .aitk/instructions/batch-system-enforcement.instructions.md, .aitk/instructions/categories/AI_SYSTEM.md, .aitk/instructions/categories/BUG_FIX.md, .aitk/instructions/categories/CODE_MODIFICATION.md, .aitk/instructions/categories/DOCUMENTATION.md, .aitk/instructions/categories/FEATURE_IMPLEMENTATION.md, .aitk/instructions/categories/PERFORMANCE.md, .aitk/instructions/categories/PROJECT.md, .aitk/instructions/categories/QUALITY.md, .aitk/instructions/categories/TESTING.md, .aitk/instructions/category-slots-enforcement.instructions.md, .aitk/instructions/learning-ai-protection.instructions.md, .aitk/instructions/modification-enforcement.instructions.md, .aitk/instructions/position-hierarchy-enforcement.instructions.md, .aitk/instructions/specification-enforcement.instructions.md, .github/workflows/servant-auto-learning.yml, docs/AI_FAILURE_COLLECTION_SYSTEM.md, docs/AI_FAILURE_LEARNING_REPORT.md, docs/AI_REALTIME_GUARD_SYSTEM.md, docs/GOVERNANCE_INTEGRATION_PLAN.md, docs/fixes/VIBRATION_ISSUE_20251229.md, docs/plans/VSCODE_EXTENSION_IMPLEMENTATION_PLAN.md, docs/specifications/CATEGORY_SLOT_SYSTEM_SPECIFICATION.md, index.html, scripts/ai-guard-check.mjs, scripts/ai-workflow.mjs, scripts/learn-from-ai-failures.mjs, scripts/measure-memorization-load.mjs, scripts/pre-commit-ai-guard.sh, scripts/record-ai-failure.mjs, scripts/simulate-memorization-vibration.mjs, src/App.css, src/App.tsx, src/ai/demo.ts, src/ai/meta/AdaptiveEducationalAINetwork.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/scheduler/BatchManager.ts, src/ai/scheduler/CategoryClassifier.ts, src/ai/scheduler/CategoryPositionCalculator.ts, src/ai/scheduler/PositionCalculator.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/SlotAllocator.ts, src/ai/scheduler/SlotConfigManager.ts, src/ai/scheduler/index.ts, src/ai/scheduler/types.ts, src/ai/specialists/GamificationAI.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx, src/components/ScoreBoard.tsx, src/components/SpellingView.tsx, src/hooks/useLearningEngine.ts, src/hooks/useQuestionRequeue.ts, src/storage/progress/progressStorage.ts, src/utils/DebugTracer.ts, tests/integration/learning-ai-integration.test.ts, tests/setup.ts, tests/unit/ai/scheduler/QuestionScheduler.categorySlots.test.ts, tests/unit/ai/scheduler/QuestionScheduler.positionHierarchy.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/learningAI.test.ts, tests/unit/progressStorage.localStorageFallback.test.ts, tests/unit/scripts/aiGuardCheck.test.ts, tests/unit/scripts/preCommitAiGuard.test.ts, src/components/MemorizationView.tsx, src/components/SpellingView.tsx, tests/unit/useQuestionRequeue.test.ts


### 5. type-error

**説明**: fix: Resolve all TypeScript and linting errors (103 errors fixed)


**影響ファイル**: .aitk/.commit-count, .aitk/ai-failure-history.json, .aitk/instructions/EVOLUTION_PLAN.md, .aitk/instructions/INDEX.md, .aitk/instructions/README.md, .aitk/instructions/ai-failure-prevention.instructions.md, .aitk/instructions/batch-system-enforcement.instructions.md, .aitk/instructions/categories/AI_SYSTEM.md, .aitk/instructions/categories/BUG_FIX.md, .aitk/instructions/categories/CODE_MODIFICATION.md, .aitk/instructions/categories/DOCUMENTATION.md, .aitk/instructions/categories/FEATURE_IMPLEMENTATION.md, .aitk/instructions/categories/PERFORMANCE.md, .aitk/instructions/categories/PROJECT.md, .aitk/instructions/categories/QUALITY.md, .aitk/instructions/categories/TESTING.md, .aitk/instructions/category-slots-enforcement.instructions.md, .aitk/instructions/learning-ai-protection.instructions.md, .aitk/instructions/modification-enforcement.instructions.md, .aitk/instructions/position-hierarchy-enforcement.instructions.md, .aitk/instructions/specification-enforcement.instructions.md, .github/workflows/servant-auto-learning.yml, docs/AI_FAILURE_COLLECTION_SYSTEM.md, docs/AI_FAILURE_LEARNING_REPORT.md, docs/AI_REALTIME_GUARD_SYSTEM.md, docs/GOVERNANCE_INTEGRATION_PLAN.md, docs/fixes/VIBRATION_ISSUE_20251229.md, docs/plans/VSCODE_EXTENSION_IMPLEMENTATION_PLAN.md, docs/specifications/CATEGORY_SLOT_SYSTEM_SPECIFICATION.md, index.html, scripts/ai-guard-check.mjs, scripts/ai-workflow.mjs, scripts/learn-from-ai-failures.mjs, scripts/measure-memorization-load.mjs, scripts/pre-commit-ai-guard.sh, scripts/record-ai-failure.mjs, scripts/simulate-memorization-vibration.mjs, src/App.css, src/App.tsx, src/ai/demo.ts, src/ai/meta/AdaptiveEducationalAINetwork.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/scheduler/BatchManager.ts, src/ai/scheduler/CategoryClassifier.ts, src/ai/scheduler/CategoryPositionCalculator.ts, src/ai/scheduler/PositionCalculator.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/SlotAllocator.ts, src/ai/scheduler/SlotConfigManager.ts, src/ai/scheduler/index.ts, src/ai/scheduler/types.ts, src/ai/specialists/GamificationAI.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx, src/components/ScoreBoard.tsx, src/components/SpellingView.tsx, src/hooks/useLearningEngine.ts, src/hooks/useQuestionRequeue.ts, src/storage/progress/progressStorage.ts, src/utils/DebugTracer.ts, tests/integration/learning-ai-integration.test.ts, tests/setup.ts, tests/unit/ai/scheduler/QuestionScheduler.categorySlots.test.ts, tests/unit/ai/scheduler/QuestionScheduler.positionHierarchy.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/learningAI.test.ts, tests/unit/progressStorage.localStorageFallback.test.ts, tests/unit/scripts/aiGuardCheck.test.ts, tests/unit/scripts/preCommitAiGuard.test.ts, src/components/MemorizationView.tsx, src/components/SpellingView.tsx, tests/unit/useQuestionRequeue.test.ts


### 6. logic-error

**説明**: fix: Resolve all TypeScript and linting errors (103 errors fixed)


**影響ファイル**: .aitk/.commit-count, .aitk/ai-failure-history.json, .aitk/instructions/EVOLUTION_PLAN.md, .aitk/instructions/INDEX.md, .aitk/instructions/README.md, .aitk/instructions/ai-failure-prevention.instructions.md, .aitk/instructions/batch-system-enforcement.instructions.md, .aitk/instructions/categories/AI_SYSTEM.md, .aitk/instructions/categories/BUG_FIX.md, .aitk/instructions/categories/CODE_MODIFICATION.md, .aitk/instructions/categories/DOCUMENTATION.md, .aitk/instructions/categories/FEATURE_IMPLEMENTATION.md, .aitk/instructions/categories/PERFORMANCE.md, .aitk/instructions/categories/PROJECT.md, .aitk/instructions/categories/QUALITY.md, .aitk/instructions/categories/TESTING.md, .aitk/instructions/category-slots-enforcement.instructions.md, .aitk/instructions/learning-ai-protection.instructions.md, .aitk/instructions/modification-enforcement.instructions.md, .aitk/instructions/position-hierarchy-enforcement.instructions.md, .aitk/instructions/specification-enforcement.instructions.md, .github/workflows/servant-auto-learning.yml, docs/AI_FAILURE_COLLECTION_SYSTEM.md, docs/AI_FAILURE_LEARNING_REPORT.md, docs/AI_REALTIME_GUARD_SYSTEM.md, docs/GOVERNANCE_INTEGRATION_PLAN.md, docs/fixes/VIBRATION_ISSUE_20251229.md, docs/plans/VSCODE_EXTENSION_IMPLEMENTATION_PLAN.md, docs/specifications/CATEGORY_SLOT_SYSTEM_SPECIFICATION.md, index.html, scripts/ai-guard-check.mjs, scripts/ai-workflow.mjs, scripts/learn-from-ai-failures.mjs, scripts/measure-memorization-load.mjs, scripts/pre-commit-ai-guard.sh, scripts/record-ai-failure.mjs, scripts/simulate-memorization-vibration.mjs, src/App.css, src/App.tsx, src/ai/demo.ts, src/ai/meta/AdaptiveEducationalAINetwork.ts, src/ai/ml/MLEnhancedSpecialistAI.ts, src/ai/scheduler/BatchManager.ts, src/ai/scheduler/CategoryClassifier.ts, src/ai/scheduler/CategoryPositionCalculator.ts, src/ai/scheduler/PositionCalculator.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/scheduler/SlotAllocator.ts, src/ai/scheduler/SlotConfigManager.ts, src/ai/scheduler/index.ts, src/ai/scheduler/types.ts, src/ai/specialists/GamificationAI.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx, src/components/ScoreBoard.tsx, src/components/SpellingView.tsx, src/hooks/useLearningEngine.ts, src/hooks/useQuestionRequeue.ts, src/storage/progress/progressStorage.ts, src/utils/DebugTracer.ts, tests/integration/learning-ai-integration.test.ts, tests/setup.ts, tests/unit/ai/scheduler/QuestionScheduler.categorySlots.test.ts, tests/unit/ai/scheduler/QuestionScheduler.positionHierarchy.test.ts, tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts, tests/unit/learningAI.test.ts, tests/unit/progressStorage.localStorageFallback.test.ts, tests/unit/scripts/aiGuardCheck.test.ts, tests/unit/scripts/preCommitAiGuard.test.ts, src/components/MemorizationView.tsx, src/components/SpellingView.tsx, tests/unit/useQuestionRequeue.test.ts


### 7. logic-error

**説明**: fix(deps): update vite to 5.4.21 (esbuild security fix)


**影響ファイル**: .aitk/.commit-count, .github/dependabot.yml, package-lock.json, package.json


### 8. logic-error

**説明**: fix(ci): deduplicate dependency update PRs


**影響ファイル**: .github/dependabot.yml, .github/workflows/auto-fix.yml


### 9. property-naming-error


**修正前**: `**修正前**: `**修正前**: ` actualCorrect !== log.progress.correctCount``
**修正後**: `**修正後**: `attempts: progress.memorizationAttempts`
**影響ファイル**: .aitk/.commit-count, .husky/pre-push, docs/GIT_HISTORY_LEARNING_REPORT.md, docs/plans/MEMORIZATION_MULTI_SUBJECT_INTEGRATION_PLAN.md, package.json, public/data/grammar/grammar_grade1_unit0.json, public/data/grammar/grammar_grade1_unit1.json, public/data/grammar/grammar_grade1_unit10.json, public/data/grammar/grammar_grade1_unit2.json, public/data/grammar/grammar_grade1_unit3.json, public/data/grammar/grammar_grade1_unit4.json, public/data/grammar/grammar_grade1_unit5.json, public/data/grammar/grammar_grade1_unit6.json, public/data/grammar/grammar_grade1_unit7.json, public/data/grammar/grammar_grade1_unit8.json, public/data/grammar/grammar_grade1_unit9.json, public/data/grammar/grammar_grade2_unit0.json, public/data/grammar/grammar_grade2_unit1.json, public/data/grammar/grammar_grade2_unit2.json, public/data/grammar/grammar_grade2_unit3.json, public/data/grammar/grammar_grade2_unit4.json, public/data/grammar/grammar_grade2_unit5.json, public/data/grammar/grammar_grade2_unit6.json, public/data/grammar/grammar_grade2_unit7.json, public/data/grammar/grammar_grade3_unit0.json, public/data/grammar/grammar_grade3_unit1.json, public/data/grammar/grammar_grade3_unit2.json, public/data/grammar/grammar_grade3_unit3.json, public/data/grammar/grammar_grade3_unit4.json, public/data/grammar/grammar_grade3_unit5.json, public/data/grammar/grammar_grade3_unit6.json, scripts/check-data-quality.sh, scripts/check-specification-compliance.mjs, scripts/convert-social-studies-csv.ts, scripts/data-quality-check.mjs, src/App.tsx, src/ai/specialists/LearningEfficiencyAI.ts, src/ai/specialists/SocialStudiesEfficiencyAI.ts, src/components/ComprehensiveReadingView.tsx, src/components/SocialStudiesView.tsx, src/storage/progress/socialStudiesProgress.ts, src/utils/grammarQuestionIntegrity.ts, tools/check-grammar-integrity.ts, tools/fix-grammar-fill-verb-leaks.ts, tools/fix-grammar-sentenceordering-passage-leaks.ts, tsconfig.node.json, tsconfig.tools.json


### 10. logic-error

**説明**: fix: data quality checks and grammar data


**影響ファイル**: .aitk/.commit-count, .husky/pre-push, docs/GIT_HISTORY_LEARNING_REPORT.md, docs/plans/MEMORIZATION_MULTI_SUBJECT_INTEGRATION_PLAN.md, package.json, public/data/grammar/grammar_grade1_unit0.json, public/data/grammar/grammar_grade1_unit1.json, public/data/grammar/grammar_grade1_unit10.json, public/data/grammar/grammar_grade1_unit2.json, public/data/grammar/grammar_grade1_unit3.json, public/data/grammar/grammar_grade1_unit4.json, public/data/grammar/grammar_grade1_unit5.json, public/data/grammar/grammar_grade1_unit6.json, public/data/grammar/grammar_grade1_unit7.json, public/data/grammar/grammar_grade1_unit8.json, public/data/grammar/grammar_grade1_unit9.json, public/data/grammar/grammar_grade2_unit0.json, public/data/grammar/grammar_grade2_unit1.json, public/data/grammar/grammar_grade2_unit2.json, public/data/grammar/grammar_grade2_unit3.json, public/data/grammar/grammar_grade2_unit4.json, public/data/grammar/grammar_grade2_unit5.json, public/data/grammar/grammar_grade2_unit6.json, public/data/grammar/grammar_grade2_unit7.json, public/data/grammar/grammar_grade3_unit0.json, public/data/grammar/grammar_grade3_unit1.json, public/data/grammar/grammar_grade3_unit2.json, public/data/grammar/grammar_grade3_unit3.json, public/data/grammar/grammar_grade3_unit4.json, public/data/grammar/grammar_grade3_unit5.json, public/data/grammar/grammar_grade3_unit6.json, scripts/check-data-quality.sh, scripts/check-specification-compliance.mjs, scripts/convert-social-studies-csv.ts, scripts/data-quality-check.mjs, src/App.tsx, src/ai/specialists/LearningEfficiencyAI.ts, src/ai/specialists/SocialStudiesEfficiencyAI.ts, src/components/ComprehensiveReadingView.tsx, src/components/SocialStudiesView.tsx, src/storage/progress/socialStudiesProgress.ts, src/utils/grammarQuestionIntegrity.ts, tools/check-grammar-integrity.ts, tools/fix-grammar-fill-verb-leaks.ts, tools/fix-grammar-sentenceordering-passage-leaks.ts, tsconfig.node.json, tsconfig.tools.json


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 364件
2. **高リスクファイル**: 20ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-31T23:45:08.936Z
