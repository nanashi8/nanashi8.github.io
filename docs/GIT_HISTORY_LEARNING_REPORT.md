# Git履歴学習レポート

**学習日時**: 2025-12-20T11:05:05.057Z  
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 344件
- **抽出パターン数**: 292件
- **新規パターン**: 3件
- **更新パターン**: 289件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）

1. **src/App.tsx** - 92回修正
   - リスクレベル: 高

2. **src/components/ScoreBoard.tsx** - 90回修正
   - リスクレベル: 高

3. **src/components/GrammarQuizView.tsx** - 83回修正
   - リスクレベル: 高

4. **src/components/SpellingView.tsx** - 75回修正
   - リスクレベル: 高

5. **src/components/ComprehensiveReadingView.tsx** - 73回修正
   - リスクレベル: 高

6. **src/components/MemorizationView.tsx** - 67回修正
   - リスクレベル: 高

7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高

8. **src/progressStorage.ts** - 40回修正
   - リスクレベル: 高

9. **src/components/QuestionCard.tsx** - 39回修正
   - リスクレベル: 高

10. **src/components/StatsView.tsx** - 30回修正

- リスクレベル: 高

---

## 📋 抽出された失敗パターン

### 1. logic-error

**説明**: perf(grammar): handleStartQuizの無限ループを修正してパフォーマンス改善

**影響ファイル**: src/components/GrammarQuizView.tsx

### 2. logic-error

**説明**: fix: LocalStorageキー不一致(progress-data→english-progress)

**影響ファイル**: src/storage/progress/progressStorage.ts

### 3. logic-error

**説明**: fix: 新規単語のcategory/priorityが保存されない致命的バグを修正

**影響ファイル**: src/storage/progress/progressStorage.ts

### 4. logic-error

**説明**: fix(pre-commit): ステージング済みファイルのみPrettier整形するよう改善

**影響ファイル**: .husky/pre-commit

### 5. logic-error

**説明**: fix(ai): 暗記タブのカテゴリー判定ロジックを正答率ベースに修正

**影響ファイル**: docs/fixes/memorization-category-bug-fix.md, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/MemoryAI.ts, src/storage/progress/progressStorage.ts

### 6. logic-error

**説明**: fix(aitk): サポートされていないYAML属性と存在しないリンクを削除

**影響ファイル**: .aitk/instructions/ai-terminology.instructions.md, .aitk/instructions/context/project-state.instructions.md, .aitk/instructions/context/quality-standards.instructions.md, .aitk/instructions/context/scope-control.instructions.md, .aitk/instructions/context/technical-constraints.instructions.md, .aitk/instructions/css-modification-rules.instructions.md, .aitk/instructions/decision-trees/bug-fix-decision.instructions.md, .aitk/instructions/decision-trees/dependency-decision.instructions.md, .aitk/instructions/decision-trees/deployment-decision.instructions.md, .aitk/instructions/decision-trees/documentation-decision.instructions.md, .aitk/instructions/decision-trees/feature-implementation-decision.instructions.md, .aitk/instructions/decision-trees/maintenance-decision.instructions.md, .aitk/instructions/decision-trees/performance-decision.instructions.md, .aitk/instructions/decision-trees/quality-decision.instructions.md, .aitk/instructions/decision-trees/refactoring-decision.instructions.md, .aitk/instructions/decision-trees/rollback-decision.instructions.md, .aitk/instructions/decision-trees/security-decision.instructions.md, .aitk/instructions/decision-trees/testing-decision.instructions.md, .aitk/instructions/diagnostics/P0-playbooks.instructions.md, .aitk/instructions/diagnostics/P1-build-data-test-playbooks.instructions.md, .aitk/instructions/diagnostics/P1-typescript-react-playbooks.instructions.md, .aitk/instructions/diagnostics/P2-playbooks.instructions.md, .aitk/instructions/healing/auto-healing.instructions.md, .aitk/instructions/healing/known-problems.instructions.md, .aitk/instructions/specification-enforcement.instructions.md, .aitk/instructions/work-management.instructions.md

### 7. logic-error

**説明**: fix(ci): 存在しないPythonスクリプトのチェックをスキップ

**影響ファイル**: .github/workflows/self-healing.yml, .github/workflows/structure-validation.yml

### 8. property-naming-error

**修正前**: `        } else if (wordProgress.incorrectCount && wordProgress.incorrectCount`
**修正後**: `      if (wordProgress?.memorizationAttempts && wordProgress.memorizationAttempts`
**影響ファイル**: README.md, docs/AI_INTEGRATION_GUIDE.md, docs/HOW_TO_ENABLE_AI.md, docs/PHASE1_2_COMPLETION_REPORT.md, src/App.tsx, src/ai/AICoordinator.ts, src/ai/architecture.md, src/ai/demo.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/CognitiveLoadAI.ts, src/ai/specialists/ContextualAI.ts, src/ai/specialists/ErrorPredictionAI.ts, src/ai/specialists/GamificationAI.ts, src/ai/specialists/LearningStyleAI.ts, src/ai/specialists/LinguisticAI.ts, src/ai/specialists/MemoryAI.ts, src/ai/types.ts, src/components/AISimulator.tsx, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/SettingsView.tsx, src/components/SpellingView.tsx, src/storage/progress/progressStorage.ts, tests/phase1-integration-test.spec.ts, tests/simulation/runAllSimulations.ts, tests/simulation/visualizeProgress.ts, tests/smoke-fast.spec.ts, tests/unit/questionScheduler.test.ts

### 9. logic-error

**説明**: docs: README.mdの煽り文句を平文に修正

**影響ファイル**: README.md

### 10. logic-error

**説明**: fix(ui): unify layout spacing and fullscreen button position per user request

**影響ファイル**: playwright.config.ts, src/App.tsx, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/QuizView.tsx, src/components/SpellingView.tsx, src/hooks/useAdaptiveLearning.ts, src/strategies/hybridQuestionSelector.ts, tests/smoke-fast.spec.ts, tests/unit/useAdaptiveLearning.test.ts

---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 292件
2. **高リスクファイル**: 17ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:

- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-20T11:05:05.057Z
