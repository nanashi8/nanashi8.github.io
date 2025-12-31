---
description: テスト追加・修正時のカテゴリ索引
category: testing
---

# 📂 Category: Testing

## 🎯 このカテゴリの対象

- ユニットテストの追加・修正
- 統合テストの追加・修正
- E2Eテストの追加・修正
- テストカバレッジの改善
- テスト品質の向上

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. テスト品質ガイド ⭐ 最優先

📄 **[test-quality.instructions.md](../test-quality.instructions.md)**

**テスト品質の基準**:
- テストが何を検証しているか明確
- テストが失敗したら即座に原因特定可能
- テストが壊れにくい（実装詳細に依存しない）
- テストが高速

---

### 2. テストガイドライン

📄 **[testing-guidelines.instructions.md](../testing-guidelines.instructions.md)**

**テスト戦略**:
- ユニットテスト: 関数・クラス単位
- 統合テスト: モジュール間の連携
- E2Eテスト: ユーザーシナリオ

**テスト命名規則**:
```typescript
describe('対象システム', () => {
  it('条件が満たされた時、期待する動作をする', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

### 3. AI・学習システムのテスト

**Position階層テスト**:
```bash
npm run test:unit:fast -- tests/unit/ai/scheduler/QuestionScheduler.positionHierarchy.test.ts
```

**カテゴリースロットテスト**:
```bash
npm run test:unit:fast -- tests/unit/ai/scheduler/QuestionScheduler.categorySlots.test.ts
```

**バッチ方式テスト**:
```bash
npm run test:unit:fast -- tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts
```

---

## 🧪 テスト実行コマンド

### ユニットテスト

```bash
# 全テスト（高速）
npm run test:unit:fast

# 全テスト（カバレッジ付き）
npm run test:unit:coverage

# 特定ファイルのテスト
npm run test:unit:fast -- tests/unit/path/to/test.ts

# ウォッチモード
npm run test:unit:watch

# UI付き
npm run test:unit:ui
```

### E2Eテスト

```bash
# スモークテスト（高速）
npm run test:smoke

# スモークテスト（完全版）
npm run test:smoke:full

# UI付き
npm run test:smoke:ui

# デバッグ
npm run test:smoke:debug
```

---

## 📝 テスト作成のベストプラクティス

### 1. Arrange-Act-Assert パターン

```typescript
it('should prioritize incorrect words', () => {
  // Arrange: テストデータ準備
  const words = [
    { word: 'apple', position: 80, category: 'incorrect' },
    { word: 'banana', position: 30, category: 'new' },
  ];
  
  // Act: 実行
  const result = scheduler.schedule(words);
  
  // Assert: 検証
  expect(result[0].word).toBe('apple');
});
```

### 2. テストの独立性

```typescript
// ❌ 悪い例: 前のテストに依存
let sharedState;
it('test 1', () => {
  sharedState = 1;
});
it('test 2', () => {
  expect(sharedState).toBe(1); // test 1に依存
});

// ✅ 良い例: 各テストで初期化
it('test 1', () => {
  const state = 1;
  expect(state).toBe(1);
});
it('test 2', () => {
  const state = 1;
  expect(state).toBe(1);
});
```

### 3. モックの適切な使用

```typescript
// ✅ 外部依存はモック
vi.mock('@/storage/manager/storageManager', () => ({
  saveProgressData: vi.fn(async () => true),
  loadProgressData: vi.fn(async () => null),
}));
```

---

## 🎯 テストカバレッジ目標

```typescript
// vitest.config.ts
thresholds: {
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70,
}
```

---

## 🚫 禁止事項

- ❌ テストが失敗しても原因不明
- ❌ テストが実装詳細に強く依存
- ❌ テストが遅い（10秒以上）
- ❌ テストが他のテストに依存
- ❌ `skip` / `only` をコミット
- ❌ テストなしで機能追加

---

## 📚 関連 Individual Instructions 一覧

- [test-quality.instructions.md](../test-quality.instructions.md) ⭐ 最優先
- [testing-guidelines.instructions.md](../testing-guidelines.instructions.md)
- [code-quality.instructions.md](../code-quality.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
