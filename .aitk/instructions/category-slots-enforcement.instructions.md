---
description: 【絶対厳守】カテゴリースロット方式の不変条件 - 修正には必ずユーザー同意が必要
applyTo: '**/ai/**/*.{ts,tsx},**/components/**/*.{ts,tsx}'
---

# 🚨 カテゴリースロット方式の不変条件【絶対厳守】

## 🚨 修正前の必須確認

**本ファイルを修正する前に、必ず以下を確認してください：**

1. **modification-enforcement.instructions.md** - 修正前の強制チェックリスト【最優先】
2. **batch-system-enforcement.instructions.md** - バッチ方式の絶対原則
3. **position-hierarchy-enforcement.instructions.md** - Position階層の不変条件

## ⛔ 修正禁止事項（ユーザー同意が必須）

以下の設計原則は**振動防止の根幹**です。修正する場合は**必ずユーザーに確認**してください。

### 1. useCategorySlots=true の時の動作（変更禁止）

```typescript
// 【不変条件】カテゴリースロット方式では再出題差し込みを無効化
const useCategorySlots = true; // この値を変更する場合はユーザー同意が必要

// 【絶対ルール】バッチ内で各語は1回のみ出題
// ❌ useQuestionRequeue による差し込みは禁止
// ❌ _reAddQuestion() は実行してはならない
if ((!isCorrect || isStillLearning) && !useCategorySlots) {
  // 再出題差し込み（従来方式でのみ有効）
  _reAddQuestion(...);
} else if (useCategorySlots) {
  // スキップ（カテゴリースロット方式では無効化）
  console.log('⏭️ [再出題スキップ] useCategorySlots=true のため再出題無効');
}
```

### 2. scheduleCategorySlots() の5段階パイプライン（変更禁止）

```typescript
// 【不変条件】この順序と処理内容は変更してはならない

// ① カテゴリ分類（Position計算）
const classified = params.questions.map(q => {
  const basePosition = calculator.calculate(wp);
  const category = PositionCalculator.categoryOf(basePosition);
  // DTA: 直近語はペナルティ、ただしカテゴリ帯の最低値でクランプ
  const position = recentSet.has(q.word) 
    ? Math.max(minPositionForCategory(category), basePosition - 30)
    : basePosition;
  return { question: q, position, category };
});

// ② スロット割当（カテゴリ比率）
const slots = {
  incorrect: Math.min(incorrectCount, Math.floor(totalSlots * 0.4)), // 上限40%
  still_learning: Math.min(stillCount, Math.floor(remaining * 0.5)),
  new: Math.min(newCount, remaining),
  mastered: remaining
};

// ③ スロット内整列（Position降順＋いもづる式学習）
const processedSlots = {
  incorrect: applyChainLearning(
    dedupeByWord(byCategory.incorrect.slice(0, slots.incorrect)
      .sort((a, b) => b.position - a.position))
  ),
  // ... 他のスロットも同様
};

// ④ スロット間並び替え（GamificationAI.interleaveByCategory）
const interleaved = gamificationAI.interleaveByCategory(allWithCategory);

// ⑤ 最終重複排除
const result = interleaved.filter((q) => {
  if (seen.has(q.word)) return false;
  seen.add(q.word);
  return true;
});
```

### 3. スロット割当比率（変更には理由が必要）

```typescript
// 【現在の設定】変更する場合はユーザーに理由を説明すること
const slots = {
  incorrect: Math.min(incorrectCount, Math.floor(totalSlots * 0.4)), // 40%上限
  still_learning: Math.min(stillCount, Math.floor(remaining * 0.5)),  // 残りの50%
  new: Math.min(newCount, remaining),                                 // 残り全て
  mastered: remaining                                                 // 余り
};

// 変更例（要ユーザー同意）:
// - incorrect の上限を40% → 50% に変更
// - still_learning の優先度を変更
// - 新規語の最低保証数を設定
```

### 4. いもづる式学習の適用（変更禁止）

```typescript
// 【不変条件】スロット内で関連語を近接配置
const applyChainLearning = (items: Classified[]): Classified[] => {
  if (!params.useChainLearning || items.length <= 2) return items;
  
  // Position帯（10刻み）ごとに分割
  const buckets = new Map<number, Classified[]>();
  items.forEach(item => {
    const bucket = Math.floor(item.position / 10);
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(item);
  });
  
  // 貪欲法: 関連度が高い順に次を選ぶ
  // ...
};

// ❌ この処理を削除または無効化してはならない
// ❌ Position帯の分割単位（10）を変更する場合はユーザー同意が必要
```

---

## ✅ 実行時検証（必須）

### MemorizationView: useCategorySlots 状態の保存

```typescript
// localStorage に保存してデバッグパネルで可視化
useEffect(() => {
  try {
    localStorage.setItem(
      'debug_useCategorySlots',
      JSON.stringify({ 
        enabled: useCategorySlots, 
        source: 'hardcoded', 
        timestamp: Date.now() 
      })
    );
  } catch {}
}, [useCategorySlots]);
```

### QuestionScheduler: バッチ内重複チェック

```typescript
// 最終結果で重複を検出
const seen = new Set<string>();
const result = interleaved.filter((q) => {
  if (seen.has(q.word)) {
    if (import.meta.env.DEV) {
      console.error('🚨 バッチ内重複:', q.word);
    }
    return false; // 重複除外
  }
  seen.add(q.word);
  return true;
});

// 統計に記録
stats.duplicatesRemoved = interleaved.length - result.length;
```

### MemorizationView: 連続出題防止

```typescript
// 回答処理後、次の語が同じ語でないか最大20問先までチェック
const maxSkip = Math.min(nextIndex + 20, questionsForNextIndex.length);
let skippedCount = 0;
while (
  nextIndex < maxSkip &&
  questionsForNextIndex[nextIndex].word === currentQuestion.word
) {
  skippedCount++;
  nextIndex++;
}

if (skippedCount > 0 && import.meta.env.DEV) {
  console.warn(`🚫 [連続出題防止] ${currentQuestion.word} を${skippedCount}問スキップ`);
}
```

---

## 🛡️ テストによる保護

`tests/unit/ai/scheduler/QuestionScheduler.categorySlots.test.ts` で以下を検証：

1. ✅ スロット割当比率が正しい（incorrect≤40%, still_learning, new, mastered）
2. ✅ 各スロット内でPosition降順が維持されている
3. ✅ バッチ内に重複語がない（duplicatesRemoved統計が0または最小限）
4. ✅ 直近10語がペナルティを受けているが、カテゴリは維持されている
5. ✅ GamificationAI.interleaveByCategory() が呼ばれている

---

## ⚠️ 修正時の確認プロセス

カテゴリースロット方式に関わるコードを修正する場合：

1. **ユーザーに確認**: "カテゴリースロット方式の動作を変更します。以下でよろしいですか？"
2. **影響範囲を明示**: 
   - スロット割当比率が変わるか？
   - 再出題差し込みの動作が変わるか？
   - Position優先順位が変わるか？
3. **テスト実行**: `npm run test:unit:fast` で回帰確認
4. **デバッグパネル確認**: 5段階パイプラインの各段階が正常か

---

## 🚫 禁止パターン

### ❌ NG例1: 再出題差し込みの復活

```typescript
// ❌ useCategorySlots=true なのに差し込みを実行
if ((!isCorrect || isStillLearning)) {
  _reAddQuestion(...); // 無条件で差し込み
}
```

### ❌ NG例2: スロット順序の破壊

```typescript
// ❌ Position降順を無視してシャッフル
const shuffled = processedSlots.incorrect.sort(() => Math.random() - 0.5);
```

### ❌ NG例3: GamificationAIのスキップ

```typescript
// ❌ interleaveByCategory を呼ばずに結合
const result = [
  ...processedSlots.incorrect,
  ...processedSlots.still_learning,
  ...processedSlots.new
];
```

---

## ✅ 正しい実装例

### ✅ OK例1: useCategorySlots による条件分岐

```typescript
const useCategorySlots = true;

if ((!isCorrect || isStillLearning) && !useCategorySlots) {
  // 従来方式: 再出題差し込み
  const updated = _reAddQuestion(...);
  setQuestions(updated);
} else if ((!isCorrect || isStillLearning) && useCategorySlots) {
  // カテゴリースロット方式: スキップ
  console.log('⏭️ [再出題スキップ] useCategorySlots=true のため無効');
}
```

### ✅ OK例2: 5段階パイプラインの順守

```typescript
// ① カテゴリ分類
const classified = classifyByPosition(questions);

// ② スロット割当
const slots = allocateSlots(classified, totalSlots);

// ③ スロット内整列
const sorted = sortWithinSlots(slots);

// ④ スロット間並び替え
const interleaved = gamificationAI.interleaveByCategory(sorted);

// ⑤ 重複排除
const result = deduplicateFinal(interleaved);
```

---

## 📋 関連ファイル

- `src/ai/scheduler/QuestionScheduler.ts` - scheduleCategorySlots()
- `src/components/MemorizationView.tsx` - useCategorySlots と再出題制御
- `src/components/RequeuingDebugPanel.tsx` - 5段階可視化
- `tests/unit/ai/scheduler/QuestionScheduler.categorySlots.test.ts` - スロット方式テスト

---

## 📊 デバッグパネルでの確認

デバッグパネル（虫アイコン）→「Markdown生成」で以下を確認：

1. **⚙️ スケジューリング設定**
   - `useCategorySlots: true` であること
   - 挿入（inserted）が **0回** であること

2. **🎯 カテゴリースロット方式：5段階パイプライン**
   - ①～⑤の各段階が表示されること
   - ⑤確定バッチTOP30 で実際の順序を確認

3. **🔄 再出題差し込みログ**
   - `inserted=0, skipped=N` となっていること
   - inserted > 0 の場合は**警告**が表示される

---

**🔒 この指示ファイル自体の修正もユーザー同意が必要です**
