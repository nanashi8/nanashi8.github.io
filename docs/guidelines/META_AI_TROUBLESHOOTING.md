---
canonical: docs/guidelines/META_AI_TROUBLESHOOTING.md
status: stable
lastUpdated: 2025-12-19
diataxisCategory: how-to
references:
  - .aitk/instructions/meta-ai-priority.instructions.md
  - .aitk/instructions/tools.instructions.md
  - tests/simulation/README.md
  - tests/simulation/IMPLEMENTATION_SUMMARY.md
  - docs/specifications/QUESTION_SCHEDULER_SPEC.md
  - docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md
doNotMove: true
---

# メタAIトラブルシューティングガイド

**最終更新**: 2025年12月19日  
**対象**: 開発者・AIアシスタント  
**目的**: 出題機能の不具合時にメタAI（QuestionScheduler）を最優先で確認・修正するためのガイド

---

## 🎯 このガイドの使用タイミング

以下のような出題不具合が報告された場合、**このガイドを最初に参照**すること：

- 復習単語（まだまだ・分からない）が出題されない
- 正解した問題ばかり出題される
- 優先度が機能していない
- カテゴリー分類が正しく動作していない
- スキップボタンを押しても同じ単語が出続ける

---

## 📊 メタAIシステムの全体像

```
適応的教育AIシステム
│
├─ メタAI統合層（QuestionScheduler）
│   ├─ シグナル検出: 疲労・苦戦・過学習・最適状態
│   ├─ 優先度計算: 基本優先度 + DTA + シグナル反映
│   ├─ 振動防止: 最近1分以内/連続3回正解を除外
│   └─ 確実性保証: incorrect → still_learning → その他
│
└─ 7つの専門AI
    ├─ 記憶AI: 記憶獲得・定着判定
    ├─ 認知負荷AI: 疲労検出・休憩推奨
    ├─ エラー予測AI: 混同検出・誤答リスク予測
    ├─ 学習スタイルAI: 個人最適化・時間帯調整
    ├─ 言語関連AI: 語源・関連語ネットワーク
    ├─ 文脈AI: 意味的クラスタリング
    └─ ゲーミフィケーションAI: モチベーション管理
```

**重要**: AIシステムは全部で**8個**（7つの専門AI + 1つのメタAI統合層）

---

## 🔍 トラブルシューティングフロー

### Step 1: デバッグログの確認

ブラウザのコンソール（F12）で以下のログを確認：

#### 1.1 Category修復ログ
```
[Category Repair] 修復された単語数: X
```
- **期待値**: 初回起動時に既存単語のcategoryが修復される
- **問題**: ログが表示されない → `loadProgress()`が実行されていない

#### 1.2 カテゴリー統計ログ
```
[QuestionScheduler] カテゴリー統計:
  incorrect: X
  still_learning: Y
  mastered: Z
  new: W
```
- **期待値**: incorrect/still_learningに不正解単語が含まれる
- **問題**: incorrect=0, still_learning=0 → category更新が機能していない

#### 1.3 確実性保証ログ
```
[確実性保証] 強制カテゴリー優先配置:
  incorrect優先: X問
  still_learning優先: Y問
```
- **期待値**: 復習単語が上位に強制配置される
- **問題**: 0問 → categoryがnullまたは未設定

#### 1.4 優先度計算ログ
```
[QuestionScheduler] 優先度計算:
  単語: abandon
  基本優先度: 8.5
  DTA: 2.5
  シグナル反映後: 10.2
```
- **期待値**: 不正解単語の優先度が高い（7.0以上）
- **問題**: 正解単語の優先度が高い → DTA計算が誤っている

---

### Step 2: QuestionSchedulerの動作確認

#### 2.1 ファイル: `src/ai/scheduler/QuestionScheduler.ts`

##### 確認ポイント1: `detectSignals()` - シグナル検出
```typescript
// Line 194-267
private detectSignals(context: ScheduleContext): Signal[] {
  // 疲労シグナル: セッション20分超 or 認知負荷70%超
  // 苦戦シグナル: エラー率40%超
  // 過学習シグナル: 連続10回以上正解
  // 最適状態シグナル: エラー率20-35%
}
```
**チェック**:
- [ ] 4種類のシグナルが実装されているか
- [ ] confidenceとactionが正しく返されるか
- [ ] 空配列ではなく実際のシグナルが検出されるか

##### 確認ポイント2: `applySignals()` - シグナル反映
```typescript
// Line 377-428
private applySignals(basePriority: number, signals: Signal[], question: Question): number {
  // 疲労時: mastered優先度+20%
  // 苦戦時: incorrect/still_learning優先度+30%
  // 過学習時: 新規問題優先度+15%
  // 最大30%調整
}
```
**チェック**:
- [ ] シグナルに基づいた優先度調整が実装されているか
- [ ] 最大30%制限が機能しているか
- [ ] questionのcategoryを参照しているか

##### 確認ポイント3: `scheduleQuestions()` - 優先度計算
```typescript
// Line 304-327: DTA計算
const forgettingRisk = this.calculateForgettingRisk(wordProgress);
if (forgettingRisk < 30) dtaBoost = 10.0;
else if (forgettingRisk < 70) dtaBoost = 5.0;
else dtaBoost = 2.5;
```
**チェック**:
- [ ] DTA閾値が正しいか（<30: 10.0, 30-70: 5.0, >=70: 2.5）
- [ ] forgettingRiskの計算が正しいか
- [ ] categoryがnullの場合のフォールバック処理があるか

##### 確認ポイント4: `sortAndBalance()` - 確実性保証
```typescript
// Line 534-600
private sortAndBalance(questions: PrioritizedQuestion[]): PrioritizedQuestion[] {
  // 強制カテゴリー優先: incorrect → still_learning → その他
  // 上位20%保証: incorrect/still_learningが上位に含まれるか監視
}
```
**チェック**:
- [ ] incorrect単語が最優先で配置されるか
- [ ] still_learning単語が次点で配置されるか
- [ ] 上位20%監視ログが出力されるか

---

### Step 3: category管理システムの確認

#### 3.1 ファイル: `src/utils/progressStorage.ts`

##### 確認ポイント1: `initializeWordProgress()` - 初期化
```typescript
// Line 631
category: 'new', // QuestionScheduler用: 初期値は新規
```
**チェック**:
- [ ] 新規単語のcategoryが'new'に設定されるか

##### 確認ポイント2: `updateWordProgress()` - category更新
```typescript
// Line 1097-1117
if (masteryResult.isMastered) {
  wordProgress.category = 'mastered';
} else if (wordProgress.consecutiveIncorrect >= 2) {
  wordProgress.category = 'incorrect';
} else if (wordProgress.incorrectCount > 0 || isStillLearning) {
  wordProgress.category = 'still_learning';
}
```
**チェック**:
- [ ] 回答時にcategoryが正しく更新されるか
- [ ] 連続2回不正解で'incorrect'になるか
- [ ] 不正解歴がある場合'still_learning'になるか
- [ ] 定着判定で'mastered'になるか

##### 確認ポイント3: `loadProgress()` - 修復処理
```typescript
// Line 131-151
if (!wp.category) {
  // 既存データにcategoryがない場合、推測して付与
  // 修復後はlocalStorageに保存
}
```
**チェック**:
- [ ] 起動時にcategoryがない単語が修復されるか
- [ ] 修復ログが出力されるか
- [ ] 修復後のデータがlocalStorageに保存されるか

##### 確認ポイント4: `getWordStatus()` - フォールバック
```typescript
// Line 467-509
if (!wordProgress.category) {
  // consecutiveIncorrectから推測
}
```
**チェック**:
- [ ] categoryがない場合の推測処理が実装されているか

---

### Step 4: 型定義の整合性確認

#### 4.1 ファイル: `src/ai/scheduler/types.ts`

```typescript
export interface WordProgress {
  category?: 'new' | 'still_learning' | 'incorrect' | 'mastered';
  // ...
}

export interface ScheduleResult {
  scheduledQuestions: Question[];  // ⚠️ 'questions'ではない
  // ...
}
```
**チェック**:
- [ ] WordProgress.categoryフィールドが存在するか
- [ ] ScheduleResult.scheduledQuestionsが正しく型定義されているか
- [ ] 全ての使用箇所で`scheduledQuestions`を使用しているか

---

### Step 5: 4タブでのAPI使用確認

#### 5.1 暗記タブ（MemorizationView.tsx）
```typescript
// Line 232: 初期ソート
const scheduleResult = questionScheduler.scheduleQuestions(...);
const sortedQuestions = scheduleResult.scheduledQuestions; // ✅ 正しい

// Line 498: 再ソート
const resortResult = questionScheduler.scheduleQuestions(...);
const resorted = resortResult.scheduledQuestions; // ✅ 正しい
```

#### 5.2 和訳タブ（TranslationView.tsx）
```typescript
// hybridMode実装の確認
const hybridResult = questionScheduler.scheduleHybridMode(...);
const questions = hybridResult.scheduledQuestions; // ✅ 正しい
```

#### 5.3 スペルタブ（SpellingView.tsx）
```typescript
// useEffect依存配列の確認
useEffect(() => {
  // resetStats, sessionStatsを依存配列に含めない
}, [questions, currentQuestionIndex]); // ✅ 正しい
```

#### 5.4 文法タブ（GrammarQuizView.tsx）
```typescript
// Line 420
const scheduleResult = questionScheduler.scheduleQuestions(...);
const sorted = scheduleResult.scheduledQuestions; // ✅ 正しい
```

**チェック**:
- [ ] 全てのタブで`scheduledQuestions`を使用しているか
- [ ] `questions`プロパティを参照していないか
- [ ] useEffect依存配列に問題がないか

---

## 🛠️ よくある問題と解決策

### 問題1: 復習単語が出題されない

**症状**:
- `incorrect: 0, still_learning: 0`とログに表示
- 「まだまだ・分からない」を100個貯めても出題されない

**原因**:
- `updateWordProgress()`でcategoryが更新されていない

**解決策**:
1. Line 1097-1117のcategory更新ロジックを確認
2. デバッグログで`wordProgress.category`の値を確認
3. `loadProgress()`の修復処理を確認

---

### 問題2: 優先度計算が機能していない

**症状**:
- 正解した単語の優先度が高い
- DTAブーストが適用されていない

**原因**:
- DTA閾値が誤っている
- `calculateForgettingRisk()`の計算が誤っている

**解決策**:
1. Line 304-327のDTA計算ロジックを確認
2. `forgettingRisk`の値をログで確認
3. 閾値を修正: `<30: 10.0, 30-70: 5.0, >=70: 2.5`

---

### 問題3: シグナル統合が機能していない

**症状**:
- シグナルが空配列`[]`
- 疲労時でもmastered単語が優先されない

**原因**:
- `detectSignals()`が実装されていない
- `applySignals()`がダミー実装のまま

**解決策**:
1. Line 194-267の`detectSignals()`を完全実装
2. Line 377-428の`applySignals()`を完全実装
3. デバッグログでシグナルの内容を確認

---

### 問題4: 無限ループが発生する

**症状**:
- "Maximum update depth exceeded"エラー
- ブラウザがフリーズする

**原因**:
- useEffect依存配列に`resetStats`や`sessionStats`が含まれている

**解決策**:
1. SpellingView.tsxのuseEffect依存配列を確認
2. `resetStats`と`sessionStats`を削除
3. `questions`と`currentQuestionIndex`のみを依存配列に含める

---

### 問題5: API不一致エラー

**症状**:
- `filteredQuestions is undefined`
- `sortedQuestions is undefined`

**原因**:
- `scheduleResult.questions`を参照している（誤）
- 正しくは`scheduleResult.scheduledQuestions`

**解決策**:
1. 全ファイルで`scheduledQuestions`を検索
2. `questions`プロパティを`scheduledQuestions`に変更
3. 型定義（types.ts）を確認

---

## 📋 修正時の必須チェックリスト

### 修正前
- [ ] デバッグログを確認した
- [ ] 問題箇所を特定した
- [ ] 関連する型定義を確認した
- [ ] 4タブ全てでの影響を検討した

### 修正実装
- [ ] QuestionScheduler.tsの動作を理解している
- [ ] category管理システムを理解している
- [ ] 既存のログ出力を削除していない
- [ ] 型定義を正しく使用している

### 修正後
- [ ] デバッグログで動作を確認した
- [ ] 4タブ全てで動作確認した
- [ ] リグレッションが発生していないか確認した
- [ ] ユーザーに確認を依頼した

---

## 🎓 メタAIの理解度チェック

以下の質問に答えられるか確認してください：

1. **8個のAIシステム**とは何か？
   - 7つの専門AI + 1つのメタAI統合層

2. **category**の4種類とは？
   - new, still_learning, incorrect, mastered

3. **DTA閾値**は？
   - <30: 10.0, 30-70: 5.0, >=70: 2.5

4. **4種類のシグナル**とは？
   - 疲労、苦戦、過学習、最適状態

5. **確実性保証**の仕組みは？
   - incorrect → still_learning → その他の強制配置

6. **scheduledQuestions**と**questions**の違いは？
   - scheduledQuestionsが正しいAPI（questionsは誤り）

7. **「14AI」**は正しい表記か？
   - 誤り。正しくは「メタAI統合」または「8個のAIシステム」

---

## 📚 参照ドキュメント

- `docs/references/AI_TERMINOLOGY.md` - AIシステムの用語定義
- `docs/specifications/QUESTION_SCHEDULER_SPEC.md` - QuestionSchedulerの詳細仕様
- `docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md` - 品質保証手順
- `.aitk/instructions/meta-ai-priority.instructions.md` - AIアシスタント用指示書

---

**このガイドは、出題機能の不具合時に開発者とAIアシスタントが最優先で参照すべきドキュメントです。**
