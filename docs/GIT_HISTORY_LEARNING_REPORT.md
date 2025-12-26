# Git履歴学習レポート

**学習日時**: 2025-12-26T19:51:55.986Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 402件
- **抽出パターン数**: 351件
- **新規パターン**: 0件
- **更新パターン**: 351件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）


1. **src/App.tsx** - 101回修正
   - リスクレベル: 高


2. **src/components/ScoreBoard.tsx** - 100回修正
   - リスクレベル: 高


3. **src/components/GrammarQuizView.tsx** - 93回修正
   - リスクレベル: 高


4. **src/components/MemorizationView.tsx** - 88回修正
   - リスクレベル: 高


5. **src/components/SpellingView.tsx** - 85回修正
   - リスクレベル: 高


6. **src/components/ComprehensiveReadingView.tsx** - 82回修正
   - リスクレベル: 高


7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高


8. **src/components/QuestionCard.tsx** - 45回修正
   - リスクレベル: 高


9. **src/progressStorage.ts** - 41回修正
   - リスクレベル: 高


10. **src/components/StatsView.tsx** - 32回修正
   - リスクレベル: 高


---

## 📋 抽出された失敗パターン


### 1. logic-error

**説明**: fix: prevent incorrect requeue from getting stuck


**影響ファイル**: src/hooks/useQuestionRequeue.ts, tests/unit/useQuestionRequeue.test.ts


### 2. property-naming-error


**修正前**: `**修正前**: `            actualCorrect !== log.progress.correctCount``
**修正後**: `**修正後**: `attempts: progress.memorizationAttempts`
**影響ファイル**: ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md, docs/GIT_HISTORY_LEARNING_REPORT.md, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/GamificationAI.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx, src/components/SpellingView.tsx, src/hooks/useQuestionRequeue.ts, src/utils/DebugTracer.ts, src/utils/debugStorage.ts, tests/integration/interleaveRatioTolerance.spec.ts, tests/unit/gamificationAI.interleaveByCategory.test.ts


### 3. logic-error

**説明**: feat: stabilize new question interleave ratio (4:1 fixed cycle)


**影響ファイル**: ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md, docs/GIT_HISTORY_LEARNING_REPORT.md, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/GamificationAI.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx, src/components/SpellingView.tsx, src/hooks/useQuestionRequeue.ts, src/utils/DebugTracer.ts, src/utils/debugStorage.ts, tests/integration/interleaveRatioTolerance.spec.ts, tests/unit/gamificationAI.interleaveByCategory.test.ts


### 4. logic-error

**説明**: fix(debug): separate scheduler/debug outputs by mode


**影響ファイル**: src/ai/scheduler/QuestionScheduler.ts, src/components/RequeuingDebugPanel.tsx


### 5. logic-error

**説明**: fix: 分からない連打で新規が消える問題を解消


**影響ファイル**: src/ai/scheduler/QuestionScheduler.ts, src/components/RequeuingDebugPanel.tsx, src/utils/DebugTracer.ts


### 6. logic-error

**説明**: fix: まだまだブースト時の文字点滅を削除


**影響ファイル**: src/components/ScoreBoard.tsx


### 7. logic-error

**説明**: fix: 復習モード時は🔥アイコン自体を点滅


**影響ファイル**: src/components/ScoreBoard.tsx


### 8. logic-error

**説明**: fix: 苦手語少数時の振動防止（新規混入量を増加）


**影響ファイル**: src/ai/specialists/GamificationAI.ts


### 9. property-naming-error


**修正前**: `        attempts: (wordProgress?.correctCount || 0) + (wordProgress?.incorrectCount`
**修正後**: `        const attempts = wp.memorizationAttempts`
**影響ファイル**: src/ai/scheduler/QuestionScheduler.ts, src/components/ScoreBoard.tsx


### 10. logic-error

**説明**: fix: variant Cで新規が混ざらない問題を修正


**影響ファイル**: src/ai/scheduler/QuestionScheduler.ts, src/components/ScoreBoard.tsx


---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 351件
2. **高リスクファイル**: 20ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:
- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-26T19:51:55.986Z
