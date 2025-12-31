---
description: 【絶対厳守】Position階層の不変条件 - 修正には必ずユーザー同意が必要
applyTo: '**/ai/**/*.{ts,tsx}'
---

# 🚨 Position階層の不変条件【絶対厳守】

## 🚨 修正前の必須確認

**本ファイルを修正する前に、必ず以下を確認してください：**

1. **modification-enforcement.instructions.md** - 修正前の強制チェックリスト【最優先】
2. **batch-system-enforcement.instructions.md** - バッチ方式の絶対原則
3. **category-slots-enforcement.instructions.md** - カテゴリースロット方式

## ⛔ 修正禁止事項（ユーザー同意が必須）

以下の設計原則は**システムの根幹**です。修正する場合は**必ずユーザーに確認**してください。

### 1. Position階層の定義（変更禁止）

```typescript
// 【不変条件】この順序と範囲は変更してはならない
Position 70-100: incorrect（分からない）    ← 第1優先
Position 60-69:  still_learning（まだまだ） ← 第2優先（ブースト後）
Position 40-59:  new（新規・引き上げ）      ← 第3優先（ブースト後）
Position 20-39:  new（新規・通常）          ← 第4優先
Position 0-19:   mastered（定着済）         ← 第5優先
```

### 2. ブースト範囲の制約（変更禁止）

```typescript
// 【不変条件】まだまだ語ブーストは60-69に固定
// ❌ 絶対にPosition 70以上にしない（incorrectと混ざらない）
// ❌ 絶対にPosition 60未満にしない（新規より下位にしない）
boostStillLearning(position: number): number {
  // Position 40-69 → 60-69 に引き上げ
  const boosted = position + 5 (最大+10);
  return Math.min(69, Math.max(60, boosted)); // 60-69にクランプ
}

// 【不変条件】新規語ブーストは40-59に固定
// ❌ 絶対にPosition 60以上にしない（まだまだを超えない）
// ❌ 絶対にPosition 40未満にしない（通常新規と混ざらない）
adjustPositionForInterleaving(position: number): number {
  const adjusted = position + 15;
  return Math.min(59, Math.max(40, adjusted)); // 40-59にクランプ
}
```

### 3. DTA（直近語ペナルティ）の制約（変更禁止）

```typescript
// 【不変条件】ペナルティ適用後もカテゴリを維持
// ❌ incorrect語が still_learning に落ちてはならない
// ❌ still_learning語が new に落ちてはならない

const minPositionForCategory = (category: CategoryType): number => {
  switch (category) {
    case 'incorrect': return 70;      // incorrect帯の最低値
    case 'still_learning': return 40; // still_learning帯の最低値
    case 'new': return 20;            // new帯の最低値
    case 'mastered': return 0;        // mastered帯の最低値
  }
};

// ペナルティ適用時は必ずクランプ
const basePosition = calculator.calculate(wp);
const category = PositionCalculator.categoryOf(basePosition);
let position = basePosition;

if (recentSet.has(q.word)) {
  // 【重要】カテゴリ帯の最低値でクランプ
  position = Math.max(minPositionForCategory(category), basePosition - 30);
}
```

---

## ✅ 実行時検証（必須）

以下のアサーションを**必ず**実装してください：

### QuestionScheduler.scheduleCategorySlots()

```typescript
// スロット処理後の検証
if (import.meta.env.DEV) {
  const stillLearning = byCategory.still_learning || [];
  const allStillInRange = stillLearning.every(c => c.position >= 60 && c.position < 70);
  if (!allStillInRange) {
    const violations = stillLearning.filter(c => c.position < 60 || c.position >= 70);
    console.error('🚨 Position階層違反（まだまだ語）:', violations);
    throw new Error(`Position階層違反: まだまだ語が60-69範囲外（${violations.length}語）`);
  }
}
```

### GamificationAI.boostStillLearningQuestions()

```typescript
// ブースト後の検証
if (import.meta.env.DEV) {
  const violations = boosted.filter(q => q.position < 60 || q.position >= 70);
  if (violations.length > 0) {
    console.error('🚨 まだまだ語ブースト違反:', violations);
    throw new Error(`まだまだ語が60-69範囲外: ${violations.length}語`);
  }
}
```

### GamificationAI.adjustPositionForInterleaving()

```typescript
// 新規語引き上げ後の検証
if (import.meta.env.DEV) {
  const violations = adjusted.filter(q => q.position < 40 || q.position >= 60);
  if (violations.length > 0) {
    console.error('🚨 新規語引き上げ違反:', violations);
    throw new Error(`新規語が40-59範囲外: ${violations.length}語`);
  }
}
```

---

## 🛡️ テストによる保護

`tests/unit/ai/scheduler/QuestionScheduler.positionHierarchy.test.ts` で以下を検証：

1. ✅ まだまだ語ブースト後、全語がPosition 60-69範囲内
2. ✅ 新規語引き上げ後、全語がPosition 40-59範囲内
3. ✅ DTA適用後、カテゴリが変わっていない
4. ✅ スロット内でPosition降順が維持されている
5. ✅ incorrect > still_learning > new > mastered の優先順位

---

## ⚠️ 修正時の確認プロセス

Position階層に関わるコードを修正する場合：

1. **ユーザーに確認**: "Position階層の不変条件に影響する修正を行います。以下の変更でよろしいですか？"
2. **影響範囲を明示**: どのPosition範囲が変わるか、どのカテゴリに影響するか
3. **テスト実行**: `npm run test:unit:fast` で回帰を確認
4. **実行時検証**: DEVモードでアサーションが発動しないか確認

---

## 📋 関連ファイル

- `src/ai/scheduler/QuestionScheduler.ts` - スロット割当とDTA
- `src/ai/specialists/GamificationAI.ts` - Position分散とブースト
- `src/utils/PositionCalculator.ts` - Position計算とカテゴリ判定
- `tests/unit/ai/scheduler/QuestionScheduler.positionHierarchy.test.ts` - 階層検証テスト

---

## 🚫 禁止パターン

### ❌ NG例1: ブースト範囲の変更

```typescript
// ❌ まだまだ語を70以上にする（incorrectと混ざる）
boostStillLearningQuestions(questions) {
  return questions.map(q => ({
    ...q,
    position: q.position + 20 // 70を超える可能性
  }));
}
```

### ❌ NG例2: カテゴリ境界の変更

```typescript
// ❌ Position判定基準を変える
categoryOf(position: number): CategoryType {
  if (position >= 65) return 'incorrect'; // 70から変更
  // ...
}
```

### ❌ NG例3: DTAでカテゴリ崩壊

```typescript
// ❌ ペナルティでカテゴリが変わる
if (recentSet.has(q.word)) {
  position = basePosition - 30; // クランプなし
  const category = categoryOf(position); // 再判定でカテゴリ変わる
}
```

---

## ✅ 正しい実装例

### ✅ OK例1: まだまだ語ブースト

```typescript
boostStillLearningQuestions(questions) {
  const boosted = questions.map(q => {
    const newPos = Math.min(69, Math.max(60, q.position + 5));
    return { ...q, position: newPos };
  });
  
  // 検証
  if (import.meta.env.DEV) {
    const violations = boosted.filter(q => q.position < 60 || q.position >= 70);
    if (violations.length > 0) throw new Error('Position階層違反');
  }
  
  return boosted;
}
```

### ✅ OK例2: DTA with クランプ

```typescript
const basePosition = calculator.calculate(wp);
const category = categoryOf(basePosition); // 先にカテゴリ確定

if (recentSet.has(q.word)) {
  const minPos = minPositionForCategory(category);
  position = Math.max(minPos, basePosition - 30); // カテゴリ維持
}
```

---

**🔒 この指示ファイル自体の修正もユーザー同意が必要です**
