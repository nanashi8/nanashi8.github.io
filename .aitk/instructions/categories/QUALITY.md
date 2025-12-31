---
description: 品質保証・コード品質改善時のカテゴリ索引
category: quality
---

# 📂 Category: Quality Assurance

## 🎯 このカテゴリの対象

- コード品質の改善
- リファクタリング
- 品質保証プロセス
- コードレビュー

---

## 🌳 判断が必要な場合: Decision Trees

**判断に迷ったら、Decision Treeから開始してください**:

📄 **[Quality Decision Tree](../decision-trees/quality-decision.instructions.md)** - 品質改善の判断

📄 **[Refactoring Decision Tree](../decision-trees/refactoring-decision.instructions.md)** - リファクタリングの判断

これらのDecision Treesが自動的に:
- リファクタリングの必要性判定
- 品質改善の優先度決定
- 安全な実行手順の提示

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. コード品質チェックリスト ⭐ 最優先

📄 **[code-quality.instructions.md](../code-quality.instructions.md)**

**コード品質の基準**:
- 可読性
- 保守性
- テスタビリティ
- パフォーマンス
- セキュリティ

---

### 2. リファクタリング安全ガイド

📄 **[refactoring-safety-guide.instructions.md](../refactoring-safety-guide.instructions.md)**

**リファクタリングの原則**:
1. テストが通っている状態から開始
2. 小さい単位で変更
3. 各ステップでテストを実行
4. 動作が変わらないことを確認

**禁止**:
- ❌ テストなしでリファクタリング
- ❌ 大規模な一括変更
- ❌ 動作変更とリファクタリングを同時に実行

---

### 3. エラーゼロポリシー

📄 **[error-zero-policy.instructions.md](../error-zero-policy.instructions.md)**

**エラーゼロの原則**:
- TypeScriptエラー: 0
- Lintエラー: 0
- テスト失敗: 0
- コンソールエラー: 0

**例外**:
- 警告（Warning）は残存可能（要議論）
- 外部ライブラリの型エラー（要対処計画）

---

### 4. AI品質チェックリスト

📄 **[ai-code-quality-checklist.instructions.md](../ai-code-quality-checklist.instructions.md)**

**AIコードの品質基準**:
- アルゴリズムの正当性
- デバッグログの完備
- テストカバレッジ
- パフォーマンス

---

## 🔍 品質チェックコマンド

### 型チェック

```bash
npm run typecheck
```

### Lint

```bash
# エラーのみ
npm run lint:errors-only

# すべて（警告含む）
npm run lint

# CSS Lint
npm run lint:css

# Markdown Lint
npm run lint:md
```

### テスト

```bash
# ユニットテスト（高速）
npm run test:unit:fast

# カバレッジ付き
npm run test:unit:coverage
```

### 統合チェック

```bash
# 品質チェック（エラーのみ）
npm run quality:check

# 品質チェック（厳格版、警告含む）
npm run quality:strict
```

---

## 📝 リファクタリングフロー

```
1. テスト確認
   npm run test:unit:fast
   ↓
2. 変更前の状態を記録
   git add .
   git commit -m "Before refactoring"
   ↓
3. 小さい単位で変更
   - 1つの関数
   - 1つのクラス
   ↓
4. テスト実行
   npm run test:unit:fast
   ↓
5. 型チェック
   npm run typecheck
   ↓
6. Lint
   npm run lint:errors-only
   ↓
7. コミット
   git commit -m "Refactor: ..."
   ↓
8. 繰り返し
```

---

## 🎯 品質メトリクス

### コードカバレッジ

```
目標: 70%以上
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%
```

### バンドルサイズ

```
目標:
- Main Bundle: 500 KB以下
- React Vendor: 200 KB以下
- CSS Bundle: 100 KB以下
```

### Lighthouse スコア

```
目標: すべて90以上
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
```

---

## 🚫 禁止事項

- ❌ TypeScriptエラーを無視
- ❌ Lintエラーを無視
- ❌ テスト失敗を放置
- ❌ コンソールエラーを放置
- ❌ テストなしでリファクタリング
- ❌ 大規模な一括変更
- ❌ 品質チェックをスキップしてコミット

---

## 📚 関連 Individual Instructions 一覧

- [code-quality.instructions.md](../code-quality.instructions.md) ⭐ 最優先
- [refactoring-safety-guide.instructions.md](../refactoring-safety-guide.instructions.md) ⭐ Critical
- [error-zero-policy.instructions.md](../error-zero-policy.instructions.md) ⭐ Critical
- [ai-code-quality-checklist.instructions.md](../ai-code-quality-checklist.instructions.md)
- [test-quality.instructions.md](../test-quality.instructions.md)
- [security-best-practices.instructions.md](../security-best-practices.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
