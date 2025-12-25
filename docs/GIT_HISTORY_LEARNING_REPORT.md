# Git履歴学習レポート

**学習日時**: 2025-12-25T07:40:00.184Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 383件
- **抽出パターン数**: 332件
- **新規パターン**: 0件
- **更新パターン**: 332件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）


1. **src/App.tsx** - 97回修正
   - リスクレベル: 高


2. **src/components/ScoreBoard.tsx** - 95回修正
   - リスクレベル: 高


3. **src/components/GrammarQuizView.tsx** - 91回修正
   - リスクレベル: 高


4. **src/components/MemorizationView.tsx** - 85回修正
   - リスクレベル: 高


5. **src/components/SpellingView.tsx** - 82回修正
   - リスクレベル: 高


6. **src/components/ComprehensiveReadingView.tsx** - 74回修正
   - リスクレベル: 高


7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高


8. **src/components/QuestionCard.tsx** - 44回修正
   - リスクレベル: 高


9. **src/progressStorage.ts** - 40回修正
   - リスクレベル: 高


10. **src/components/StatsView.tsx** - 31回修正
   - リスクレベル: 高


---

## 📋 抽出された失敗パターン


### 1. logic-error

**説明**: fix: 再スケジューリング時にまだまだ語が消失する問題を修正


**影響ファイル**: .aitk/.commit-count, src/components/MemorizationView.tsx


### 2. logic-error

**説明**: fix: スパン終了処理を追加して所要時間を計測


**影響ファイル**: .aitk/.commit-count, src/ai/scheduler/QuestionScheduler.ts, src/components/MemorizationView.tsx, src/utils/DebugTracer.ts


### 3. logic-error

**説明**: fix: デバッグパネルの計算ロジックを修正


**影響ファイル**: .aitk/.commit-count, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx


### 4. property-naming-error


**修正前**: `            actualCorrect !== log.progress.correctCount`
**修正後**: `        attempts: progress.memorizationAttempts`
**影響ファイル**: .aitk/.commit-count, .aitk/instructions/document-naming-guard.instructions.md, .aitk/instructions/documentation-enforcement.instructions.md, README_EN.md, docs/how-to/TESTING_GUIDE.md, docs/maintenance/SELF_MANAGING_PROJECT.md, docs/quality/TECHNICAL_VISION.md, docs/quality/grammar_quality_report.md, docs/references/DATA_MANAGEMENT_GUIDE.md, docs/references/EMERGENCY_RECOVERY_GUIDE.md, docs/references/QUESTION_SCHEDULER_API.md, docs/references/QUESTION_SCHEDULER_TYPES.md, docs/reports/DOCUMENT_NAMING_VIOLATION_INCIDENT_REPORT.md, docs/specifications/01-project-overview.md, docs/specifications/16-storage-strategy.md, scripts/adaptive-guard-checks.sh, scripts/test-runner.sh, src/App.css, src/App.tsx, src/ai/optimization/contextualLearningAI.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/GamificationAI.ts, src/ai/utils/categoryDetermination.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/PriorityBadge.tsx, src/components/RequeuingDebugPanel.tsx, src/components/ScoreBoard.tsx, src/components/SpellingView.tsx, src/hooks/useLearningEngine.ts, src/hooks/useQuestionRequeue.ts, src/utils/performance-monitor.ts, tests/unit/ai/specialists/MemoryAI.test.ts, tests/unit/useQuestionRequeue.test.ts


### 5. test-error

**説明**: feat: テスト実践ガイド作成とドキュメント命名規則強化


**影響ファイル**: .aitk/.commit-count, .aitk/instructions/document-naming-guard.instructions.md, .aitk/instructions/documentation-enforcement.instructions.md, README_EN.md, docs/how-to/TESTING_GUIDE.md, docs/maintenance/SELF_MANAGING_PROJECT.md, docs/quality/TECHNICAL_VISION.md, docs/quality/grammar_quality_report.md, docs/references/DATA_MANAGEMENT_GUIDE.md, docs/references/EMERGENCY_RECOVERY_GUIDE.md, docs/references/QUESTION_SCHEDULER_API.md, docs/references/QUESTION_SCHEDULER_TYPES.md, docs/reports/DOCUMENT_NAMING_VIOLATION_INCIDENT_REPORT.md, docs/specifications/01-project-overview.md, docs/specifications/16-storage-strategy.md, scripts/adaptive-guard-checks.sh, scripts/test-runner.sh, src/App.css, src/App.tsx, src/ai/optimization/contextualLearningAI.ts, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/GamificationAI.ts, src/ai/utils/categoryDetermination.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/PriorityBadge.tsx, src/components/RequeuingDebugPanel.tsx, src/components/ScoreBoard.tsx, src/components/SpellingView.tsx, src/hooks/useLearningEngine.ts, src/hooks/useQuestionRequeue.ts, src/utils/performance-monitor.ts, tests/unit/ai/specialists/MemoryAI.test.ts, tests/unit/useQuestionRequeue.test.ts


### 6. property-naming-error


**修正前**: `**修正前**: `        const totalCorrect = (wp.correctCount``
**修正後**: `**修正後**: `return (progress.memorizationAttempts`
**影響ファイル**: docs/GIT_HISTORY_LEARNING_REPORT.md


### 7. logic-error

**説明**: docs: fix markdownlint errors


**影響ファイル**: docs/GIT_HISTORY_LEARNING_REPORT.md


### 8. logic-error

**説明**: test: remove orphaned quickCategoryDetermination test and fix doc path


**影響ファイル**: .aitk/.commit-count, README_EN.md, tests/integration/maintenance-ai.test.ts, tests/unit/ai/utils/quickCategoryDetermination.test.ts


### 9. test-error

**説明**: test: remove orphaned quickCategoryDetermination test and fix doc path


**影響ファイル**: .aitk/.commit-count, README_EN.md, tests/integration/maintenance-ai.test.ts, tests/unit/ai/utils/quickCategoryDetermination.test.ts


### 10. logic-error

**説明**: fix(debug): RequeuingDebugPanel 500エラー修正と次30問表示の整合


**影響ファイル**: .aitk/.commit-count, src/components/RequeuingDebugPanel.tsx, src/hooks/useQuestionRequeue.ts


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 332件
2. **高リスクファイル**: 19ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-25T07:40:00.185Z
