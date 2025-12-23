# 再出題メカニズム仕様書

> **画像キャプチャ不要の開発ガイド**
>
> 最終更新: 2025年12月22日

## 🎯 目的

「まだまだ」「分からない」と回答した問題を、**生徒が飽きないタイミング**で再出題する。

**🔒 強制装置**: まだまだ・分からないが**0になるまで学習を完了させない**。

---

## 📋 要件定義

### 基本要件

1. **解答時**: 優先度を計算し、学習段階（position）を判定
2. **保存**: まだまだ/分からないの問題をリストに記録
3. **再出題**: 適切なタイミング（3-5問後）で自動挿入
4. **振動防止**: 同じ問題が連続で出ないようにする
5. **🔒 完了強制**: まだまだ/分からないが0になるまで終了させない

### 非機能要件

- **レスポンス**: 解答から再出題まで遅延なし
- **UX**: 生徒が意識しない自然な再出題
- **デバッグ**: 内部状態を可視化できる
- **🔒 強制力**: システムが完了条件を強制する

---

## 🏗️ アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────┐
│                 MemorizationView                     │
│  (メイン学習画面)                                     │
└───────────┬─────────────────────────────────────────┘
            │
            ├─ handleAnswer() → 解答処理
            │   │
            │   ├─ updateWordProgress() → progressStorage
            │   │   └─ determineWordPosition() → AI判定
            │   │
            │   ├─ reAddQuestion() → useQuestionRequeue
            │   │   └─ questions配列に3-5問後に挿入
            │   │
            │   └─ QuestionScheduler.recalculatePriority()
            │       └─ localStorage に AI評価を記録
            │
            └─ 次の問題表示
                ↓
            ┌───────────────────────────────────────┐
            │  RequeuingDebugPanel (開発モード)      │
            │  - 再出題リスト表示                     │
            │  - 次の10問表示                        │
            │  - AI評価表示                          │
            └───────────────────────────────────────┘
```

### データフロー

```
1. 生徒が「まだまだ」ボタンをクリック
   ↓
2. handleAnswer(false, false) 実行
   ↓
3. updateWordProgress(word, false, ...) → WordProgress更新
   ↓
4. determineWordPosition(progress) → "still_learning"
   ↓
5. reAddQuestion(question, questions, currentIndex)
   ↓
6. questions配列の currentIndex + 3~5 の位置に挿入
   ↓
7. setQuestions(newQuestions) → 再レンダリング
   ↓
8. 3-5問後に同じ問題が再度出題される
```

---

## 🔧 実装詳細

### 1. 解答処理（handleAnswer）

**場所**: `src/components/MemorizationView.tsx`

```typescript
const handleAnswer = async (isCorrect: boolean, isPartial: boolean) => {
  // 1. WordProgress更新
  await updateWordProgress(
    currentQuestion.word,
    isCorrect,
    responseTime,
    undefined,
    'memorization'
  );

  // 2. まだまだ/分からない の場合、再出題リストに追加
  if (!isCorrect || isPartial) {
    setQuestions((prev) => {
      return reAddQuestion(currentQuestion, prev, currentIndex);
    });
  }

  // 3. 次の問題へ
  // ...
};
```

**重要ポイント**:
- `updateWordProgress` が先に実行される（AI判定のため）
- `reAddQuestion` は questions 配列を返す（副作用なし）
- `setQuestions` でReact stateを更新

### 2. 再出題ロジック（useQuestionRequeue）

**場所**: `src/hooks/useQuestionRequeue.ts`

```typescript
const reAddQuestion = (question, questions, currentIndex) => {
  // 1. 重複チェック: 次の10問以内に同じ問題があるか？
  const windowSize = 10;
  const upcoming = questions.slice(currentIndex + 1, currentIndex + windowSize + 1);
  if (upcoming.some(q => q.word === question.word)) {
    console.log('🔄 重複スキップ: 既に次の10問以内に存在');
    return questions; // 追加しない
  }

  // 2. 挿入位置を計算: 3-5問後（ランダム）
  const offset = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
  const insertPosition = Math.min(currentIndex + offset, questions.length);

  // 3. マーキング
  const markedQuestion = {
    ...question,
    sessionPriority: Date.now(), // 再出題フラグ
    reAddedCount: (question.reAddedCount || 0) + 1,
  };

  // 4. 配列に挿入
  return [
    ...questions.slice(0, insertPosition),
    markedQuestion,
    ...questions.slice(insertPosition),
  ];
};
```

**重要ポイント**:
- **振動防止**: 10問ウィンドウで重複チェック
- **ランダム化**: 3-5問後でランダム（パターン化防止）
- **マーキング**: `sessionPriority` で再出題であることを記録

### 3. AI評価（QuestionScheduler）

**場所**: `src/ai/scheduler/QuestionScheduler.ts`

```typescript
public recalculatePriorityAfterAnswer(progress: WordProgress): number {
  // 1. 学習段階（position）を判定
  const position = this.determinePosition(progress);

  // 2. ベース優先度
  const basePriority = {
    incorrect: 100,      // 分からない: 最優先
    still_learning: 75,  // まだまだ: 高優先度
    new: 50,             // 未学習: 中優先度
    mastered: 10,        // 定着済: 低優先度
  };

  // 3. 時間経過ブースト
  const daysSinceLastStudy = (Date.now() - progress.lastStudied) / (1000 * 60 * 60 * 24);
  const timeBoost = Math.min(daysSinceLastStudy * 2, 20);

  // 4. 最終優先度
  const finalPriority = basePriority[position] + timeBoost;

  // 5. localStorage に記録（デバッグ用）
  this.recordAIEvaluation(progress.word, {
    category: position,
    basePriority: basePriority[position],
    timeBoost,
    finalPriority,
    timestamp: new Date().toISOString(),
  });

  return finalPriority;
}
```

**重要ポイント**:
- `determinePosition()` は `determineWordPosition()` に委譲（SSOT原則）
- AI評価は localStorage に記録（デバッグパネルで可視化）

---

## 🐛 デバッグ方法

### デバッグパネルの使い方

1. **開発モードで起動**:
   ```bash
   npm run dev
   ```

2. **暗記モードを開く**

3. **右下の「🔍 再出題デバッグ」ボタンをクリック**

4. **パネルを確認**:
   - **現在位置**: 何問目か
   - **再出題リスト**: 今後出題される問題
   - **次の10問**: 出題予定
   - **AI評価**: 最新5件の判定結果

### ログの見方

```typescript
// ブラウザのコンソールに出力される
🔄 [useQuestionRequeue] 重複スキップ: 既に次の10問以内に存在
  { word: "apple", currentIndex: 5, windowEnd: 15 }

✅ [Priority Loaded] apple: 保存済み優先度を使用 (85.3)

🔍 [QuestionScheduler] apple: localStorage.position = still_learning
```

### localStorage の確認

```javascript
// ブラウザのDevToolsで実行
JSON.parse(localStorage.getItem('debug_ai_evaluations'))
JSON.parse(localStorage.getItem('progress-data'))
```

---

## 📊 テストシナリオ

### シナリオ1: まだまだ → 再出題

1. 問題を表示
2. 「まだまだ」ボタンをクリック
3. **期待**: 3-5問後に同じ問題が再出題される
4. **確認**: デバッグパネルの「再出題リスト」に表示される

### シナリオ2: 分からない → 再出題

1. 問題を表示
2. 「分からない」ボタンをクリック
3. **期待**: 3-5問後に同じ問題が再出題される
4. **確認**: AI評価が "incorrect" で記録される

### シナリオ3: 振動防止

1. 問題Aで「まだまだ」
2. 3問後に問題Aが再出題
3. 再度「まだまだ」をクリック
4. **期待**: すぐには再出題されない（10問ウィンドウ内に存在するため）
5. **確認**: コンソールに「重複スキップ」のログが出る

### シナリオ4: 飽き防止

1. 「分からない」を連続3回
2. **期待**: 3問後に3問連続で復習問題が来るのではなく、分散される
3. **確認**: 次の10問を見て、再出題が均等に分散されているか

---

## 🔧 トラブルシューティング

### 問題: 再出題されない

**チェック項目**:
1. ✅ `updateWordProgress` が呼ばれているか？
2. ✅ `reAddQuestion` が呼ばれているか？
3. ✅ questions配列が更新されているか？
4. ✅ 重複チェックで弾かれていないか？

**確認方法**:
```typescript
// handleAnswer内に追加
console.log('🔍 reAddQuestion前:', questions.length);
const newQuestions = reAddQuestion(currentQuestion, questions, currentIndex);
console.log('🔍 reAddQuestion後:', newQuestions.length);
```

### 問題: 同じ問題が連続で出る

**原因**: 振動防止が機能していない

**確認方法**:
- デバッグパネルで「次の10問」を確認
- 同じ単語が2回以上入っていないか？

**対策**:
- `windowSize` を拡大（現在は10）
- `offset` を大きくする（現在は3-5）

### 問題: AI評価がおかしい

**原因**: `determineWordPosition()` の判定ミス

**確認方法**:
1. localStorage の `progress-data` を確認
2. WordProgress の `consecutiveIncorrect`, `consecutiveCorrect` を確認
3. デバッグパネルのAI評価を確認

**対策**:
- `src/ai/utils/categoryDetermination.ts` を確認
- 判定条件を調整

---

## 📈 今後の改善案

### 短期（1週間以内）

- [ ] デバッグパネルを常時表示（開発モード）
- [ ] 再出題理由を記録（incorrect/still_learning）
- [ ] ログレベルを設定可能に

### 中期（1ヶ月以内）

- [ ] 再出題タイミングをカスタマイズ可能に（3-5問 → 設定可能）
- [ ] 統計情報を表示（再出題率、成功率）
- [ ] A/Bテスト機能（3問後 vs 5問後）

### 長期（3ヶ月以内）

- [ ] AI学習: 生徒の忘却パターンを学習して最適なタイミングを自動調整
- [ ] パーソナライズ: 生徒ごとに再出題タイミングを最適化
- [ ] アニメーション: 再出題時に視覚的フィードバック

---

## 🎯 成功指標（KPI）

### 定量指標

- **再出題実行率**: 80%以上（まだまだ/分からないの80%が実際に再出題される）
- **振動発生率**: 5%以下（同じ問題が直近5問以内に2回出る）
- **生徒満足度**: 4.0以上（5段階評価）

### 定性指標

- 生徒から「飽きる」というフィードバックがない
- 「しつこい」というフィードバックがない
- 「ちょうどいいタイミング」というフィードバックがある

---

## 📝 チェックリスト（開発時）

### コード変更前

- [ ] 仕様書を読んだ
- [ ] 既存の実装を確認した（grep検索）
- [ ] デバッグパネルで現在の動作を確認した
- [ ] 対症療法検知スクリプトを実行した

### コード変更後

- [ ] デバッグパネルで動作を確認した
- [ ] コンソールログで想定通りの動作を確認した
- [ ] localStorage のデータを確認した
- [ ] テストシナリオを実行した
- [ ] 対症療法検知スクリプトをパスした

### PR提出前

- [ ] README にスクリーンショットを添付した（デバッグパネル）
- [ ] 変更内容を仕様書に反映した
- [ ] CI/CDをパスした
- [ ] コードレビュー依頼を送った

---

**この仕様書に従えば、画像キャプチャなしで開発・デバッグが可能です。**
