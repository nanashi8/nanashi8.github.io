---
description: リファクタリング時の安全手順 - ロジック変更を避け、構造のみ改善するための必須ガイド
applyTo: '**/*.{ts,tsx,js,jsx}'
---

# リファクタリング安全実行ガイド

## 🎯 リファクタリングの定義

**リファクタリング**とは：
- ✅ 外部から見た動作を**一切変更せず**
- ✅ コードの**内部構造のみ**を改善すること

**リファクタリングではない**：
- ❌ ロジックの変更
- ❌ アルゴリズムの改善
- ❌ パフォーマンスの最適化
- ❌ バグ修正

---

## 📋 リファクタリング前のチェックリスト

### 1. 目的の明確化

**質問**：このリファクタリングは何を改善するか？

- [ ] 重複コードの削除
- [ ] 関数の抽出
- [ ] 変数名の改善
- [ ] モジュール構造の改善
- [ ] 型安全性の向上

**禁止事項**：
- ❌ 「ついでに」ロジックを変更
- ❌ 「改善」という名目でアルゴリズム変更
- ❌ 複数の目的を同時に達成

### 2. 影響範囲の調査

```bash
# ステップ1: 対象関数の使用箇所を検索
npm run grep:search -- "関数名"

# ステップ2: 型定義を確認
cat src/path/to/types.ts

# ステップ3: テストを確認
npm run test:unit -- --listTests | grep "関数名"
```

**リスク評価**：
- 使用箇所が**1-3箇所**: 低リスク、即座に実行可能
- 使用箇所が**4-10箇所**: 中リスク、段階的に実行
- 使用箇所が**11箇所以上**: 高リスク、細分化して実行

### 3. テストの準備

**既存テストの確認**：

```bash
# 対象関数のテストを実行
npm run test:unit -- src/path/to/file.test.ts

# テストカバレッジを確認
npm run test:coverage -- src/path/to/file.ts
```

**テストがない場合**：
1. リファクタリング前にテストを追加
2. テストが成功することを確認
3. リファクタリング実行
4. テストが引き続き成功することを確認

---

## 🔧 リファクタリングの実行手順

### パターン1: 重複コードの統一化

**事例**: カテゴリー判定が3箇所に重複

#### ステップ1: 元のコードを完全保存

```bash
# 変更前の状態をgitで保存
git add -A
git commit -m "refactor: カテゴリー判定統一化の準備"

# 元のコードをバックアップ
git show HEAD:src/ai/specialists/MemoryAI.ts > backup-MemoryAI.ts
```

#### ステップ2: 1箇所目のコードを完全コピー

```typescript
// ❌ 悪い例：記憶で再実装
export function determineCategory(progress: WordProgress) {
  const correct = progress.correctCount || 0; // プロパティ名が誤り
  // ...
}

// ✅ 良い例：元のコードを完全コピー
export function determineCategory(progress: WordProgress): WordCategory {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const streak = progress.memorizationStreak || 0;

  if (attempts === 0) return 'new';

  // まだまだを0.5回の正解として計算
  const effectiveCorrect = correct + stillLearning * 0.5;
  const totalAttempts = attempts;
  const incorrectCount = attempts - correct - stillLearning;
  const accuracy = totalAttempts > 0 ? effectiveCorrect / totalAttempts : 0;

  // 元のコメントも完全に維持
  if ((accuracy >= 0.8 && streak >= 3) || (accuracy >= 0.7 && totalAttempts >= 5)) {
    return 'mastered';
  }

  if (accuracy < 0.3 || incorrectCount >= 2) {
    return 'incorrect';
  }

  return 'still_learning';
}
```

**重要なポイント**：
- ✅ 変数名を一文字も変えない
- ✅ 計算式を一切変更しない
- ✅ コメントも含めて移植
- ✅ 空白・改行も維持

#### ステップ3: 2箇所目、3箇所目を置き換え

```typescript
// MemoryAI.ts
import { determineWordCategory } from '../utils/categoryDetermination';

class MemoryAI {
  private determineCategory(progress: WordProgress): WordCategory {
    // ❌ 元のコードを削除しない、コメントアウト
    /*
    const attempts = progress.memorizationAttempts || 0;
    // ... 元のコード全体をコメントアウト
    */
    
    // ✅ 新しい統一関数を呼び出し
    return determineWordCategory(progress);
  }
}
```

**段階的な置き換え**：
1. 1箇所ずつ置き換え
2. 各箇所でテスト実行
3. テスト成功を確認してから次へ

#### ステップ4: テストの実行

```bash
# 1箇所置き換え後
npm run test:unit -- src/ai/specialists/MemoryAI.test.ts

# 2箇所置き換え後
npm run test:unit -- src/ai/scheduler/QuestionScheduler.test.ts

# 3箇所置き換え後
npm run test:integration
```

**失敗時の対応**：
- テスト失敗 → 即座にgit revert
- 原因調査 → 元のコードと比較
- プロパティ名の誤り → 型定義を再確認

#### ステップ5: 元のコードの削除

**すべてのテストが成功した後のみ**：

```typescript
// MemoryAI.ts
class MemoryAI {
  private determineCategory(progress: WordProgress): WordCategory {
    // コメントアウトしていた元のコードを削除
    return determineWordCategory(progress);
  }
}
```

---

### パターン2: 関数の抽出

**事例**: 長い関数を小さな関数に分割

#### ステップ1: テストを追加

```typescript
// 元の関数のテストを追加
describe('calculatePriority', () => {
  it('正答率80%、連続3回正解で優先度が低い', () => {
    const result = calculatePriority({ /* ... */ });
    expect(result).toBeLessThan(50);
  });
});
```

#### ステップ2: 関数を抽出

```typescript
// ❌ 悪い例：ロジックを変更
function extractedFunction(data: Data): number {
  // 「改善」してしまう
  return data.value * 2 + 10; // 元は data.value * 2
}

// ✅ 良い例：ロジックを完全に維持
function extractedFunction(data: Data): number {
  // 元のコードを完全コピー
  const result = data.value * 2;
  return result;
}
```

#### ステップ3: 元の関数から呼び出し

```typescript
function originalFunction(data: Data): number {
  // 元のコードをコメントアウト
  // const result = data.value * 2;
  
  // 抽出した関数を呼び出し
  const result = extractedFunction(data);
  
  return result + otherCalculation();
}
```

#### ステップ4: テストを実行

```bash
npm run test:unit -- src/path/to/file.test.ts
```

**期待結果**：
- ✅ すべてのテストが引き続き成功
- ❌ テスト失敗 → 即座にrevert

---

### パターン3: 変数名の改善

**事例**: わかりにくい変数名を明確にする

#### ステップ1: 型定義を確認

```typescript
// src/storage/progress/types.ts
interface WordProgress {
  memorizationAttempts?: number;      // 暗記モード総試行回数
  memorizationCorrect?: number;       // 暗記モード正解回数
  memorizationStillLearning?: number; // 「まだまだ」回数
}
```

#### ステップ2: 変数名を変更（ロジックは変更しない）

```typescript
// ❌ 悪い例：変数名とロジックを同時に変更
const totalAttempts = correct + incorrect; // ロジック変更

// ✅ 良い例：変数名のみ変更
const totalAttempts = attempts; // 元のロジックを維持
```

---

## 🚨 よくある失敗パターン

### 失敗パターン1: プロパティ名の推測

```typescript
// ❌ 悪い例
const correct = progress.correctCount || 0; // 推測で実装

// ✅ 良い例
// 1. types.ts を確認
// 2. プロパティ名をコピー
const correct = progress.memorizationCorrect || 0;
```

### 失敗パターン2: ロジックの「改善」

```typescript
// ❌ 悪い例：「まだまだ」の扱いを変更
const totalAttempts = correct + incorrect; // まだまだ除外

// ✅ 良い例：元のロジックを維持
const effectiveCorrect = correct + stillLearning * 0.5; // 0.5点計算
const totalAttempts = attempts; // 全試行回数
```

### 失敗パターン3: 一度に複数箇所を変更

```bash
# ❌ 悪い例：3箇所を同時に変更
git diff
# modified:   src/ai/specialists/MemoryAI.ts
# modified:   src/ai/scheduler/QuestionScheduler.ts
# modified:   src/ai/explainability/priorityExplanation.ts

# ✅ 良い例：1箇所ずつ変更
git add src/ai/specialists/MemoryAI.ts
git commit -m "refactor: MemoryAIのカテゴリー判定を統一関数に変更"
npm run test:unit # テスト確認
```

---

## 🔍 セルフレビューチェックリスト

リファクタリング完了後、以下をすべて確認：

### ロジックの維持

- [ ] 元のコードと完全に同じ動作をする
- [ ] プロパティ名を型定義から確認した
- [ ] 計算式を一切変更していない
- [ ] 条件分岐を一切変更していない
- [ ] 「まだまだ」の扱いを維持した

### テストの成功

- [ ] 既存テストがすべて成功
- [ ] 型チェックが成功（`npm run type-check`）
- [ ] ESLintエラーがゼロ
- [ ] 統合テストが成功

### コミットの品質

- [ ] コミットメッセージが明確
- [ ] 1コミット1変更を守った
- [ ] 差分が理解しやすい
- [ ] 不要なコードを削除した

---

## 📚 参考資料

- [Martin Fowler - Refactoring](https://refactoring.com/)
- [TypeScript Deep Dive - Refactoring](https://basarat.gitbook.io/typescript/)
- [プロジェクト内ガイドライン](../../docs/guidelines/)

---

## 🤖 AI実装時の必須ルール

1. **元のコードを完全コピー**する
2. **型定義を必ず確認**する
3. **1箇所ずつ段階的**に実行する
4. **各段階でテスト**を実行する
5. **失敗時は即座にrevert**する

これらを守らない場合、**必ず失敗する**。
