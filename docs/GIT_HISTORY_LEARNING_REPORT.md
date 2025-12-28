# Git履歴学習レポート

**学習日時**: 2025-12-28T10:25:37.095Z
**学習範囲**: 学習AI実装開始以降

---

## 📊 学習サマリー

- **解析コミット数**: 400件
- **抽出パターン数**: 350件
- **新規パターン**: 0件
- **更新パターン**: 350件
- **ホットスポット**: 20ファイル

---

## 🔥 ホットスポット（頻繁に修正されるファイル）

1. **src/components/ScoreBoard.tsx** - 100回修正
   - リスクレベル: 高

2. **src/App.tsx** - 99回修正
   - リスクレベル: 高

3. **src/components/GrammarQuizView.tsx** - 93回修正
   - リスクレベル: 高

4. **src/components/MemorizationView.tsx** - 89回修正
   - リスクレベル: 高

5. **src/components/ComprehensiveReadingView.tsx** - 88回修正
   - リスクレベル: 高

6. **src/components/SpellingView.tsx** - 84回修正
   - リスクレベル: 高

7. **src/components/QuizView.tsx** - 56回修正
   - リスクレベル: 高

8. **src/components/QuestionCard.tsx** - 44回修正
   - リスクレベル: 高

9. **src/progressStorage.ts** - 40回修正
   - リスクレベル: 高

10. **src/storage/progress/progressStorage.ts** - 33回修正

- リスクレベル: 高

---

## 📋 抽出された失敗パターン

### 1. logic-error

**説明**: fix: 上の文法構造で品詞を表示するよう変更

**影響ファイル**: .aitk/.commit-count

### 2. logic-error

**説明**: fix: 上の文法構造で品詞を表示するよう変更

**影響ファイル**: .aitk/.commit-count, src/components/ComprehensiveReadingView.tsx

### 3. logic-error

**説明**: fix: getGrammarTagLabel関数を追加

**影響ファイル**: .aitk/.commit-count, src/components/ComprehensiveReadingView.tsx

### 4. logic-error

**説明**: fix: 文法構造に文法役割表示を復元（主語・動詞・前置詞）

**影響ファイル**: .aitk/.commit-count

### 5. logic-error

**説明**: fix: 文法構造に文法役割表示を復元

**影響ファイル**: .aitk/.commit-count, src/components/ComprehensiveReadingView.tsx

### 6. logic-error

**説明**: fix: prevent incorrect requeue from getting stuck

**影響ファイル**: src/hooks/useQuestionRequeue.ts, tests/unit/useQuestionRequeue.test.ts

### 7. property-naming-error

**修正前**: `**修正前**: ` actualCorrect !== log.progress.correctCount``**修正後**:`**修正後**: `attempts: progress.memorizationAttempts`
**影響ファイル**: ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md, docs/GIT_HISTORY_LEARNING_REPORT.md, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/GamificationAI.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx, src/components/SpellingView.tsx, src/hooks/useQuestionRequeue.ts, src/utils/DebugTracer.ts, src/utils/debugStorage.ts, tests/integration/interleaveRatioTolerance.spec.ts, tests/unit/gamificationAI.interleaveByCategory.test.ts

### 8. logic-error

**説明**: feat: stabilize new question interleave ratio (4:1 fixed cycle)

**影響ファイル**: ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md, docs/GIT_HISTORY_LEARNING_REPORT.md, src/ai/scheduler/QuestionScheduler.ts, src/ai/specialists/GamificationAI.ts, src/components/GrammarQuizView.tsx, src/components/MemorizationView.tsx, src/components/RequeuingDebugPanel.tsx, src/components/SpellingView.tsx, src/hooks/useQuestionRequeue.ts, src/utils/DebugTracer.ts, src/utils/debugStorage.ts, tests/integration/interleaveRatioTolerance.spec.ts, tests/unit/gamificationAI.interleaveByCategory.test.ts

### 9. logic-error

**説明**: fix(debug): separate scheduler/debug outputs by mode

**影響ファイル**: src/ai/scheduler/QuestionScheduler.ts, src/components/RequeuingDebugPanel.tsx

### 10. logic-error

**説明**: fix: 分からない連打で新規が消える問題を解消

**影響ファイル**: src/ai/scheduler/QuestionScheduler.ts, src/components/RequeuingDebugPanel.tsx, src/utils/DebugTracer.ts

---

## 🎓 学習結果

サーバントは過去の失敗から以下を学習しました：

1. **頻出エラーパターン**: 350件
2. **高リスクファイル**: 20ファイル
3. **成功率向上**: Git履歴から学習したパターンは全て「修正済み」として記録

**次回のアクション**:

- ホットスポットファイルに特に注意
- 抽出されたパターンをInstructionsに反映
- CI/CDパイプラインに自動チェックを追加

---

**生成日時**: 2025-12-28T10:25:37.095Z
