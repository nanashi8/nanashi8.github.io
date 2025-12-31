---
description: コード変更・修正時のカテゴリ索引
category: code-modification
---

# 📂 Category: Code Modification

## 🎯 このカテゴリの対象

- 既存コードの修正
- バグ修正（コード変更を伴うもの）
- リファクタリング
- コード品質改善

---

## 🚨 必須: 変更前に必ず確認

### 1. 最優先確認事項

**すべてのコード変更は、以下を完了してから開始すること**:

📄 **[modification-enforcement.instructions.md](../modification-enforcement.instructions.md)**
- コード変更の絶対禁止事項
- 既存実装の確認手順
- 仕様確認の証拠を残す方法

---

### 2. 変更前の自動ガード（必須実行）

```bash
# リアルタイムガード起動
node scripts/ai-guard-check.mjs "<ユーザー依頼>" [変更予定ファイル]
```

これが自動的に:
- 過去の類似失敗を検索
- 危険な変更パターンを検出
- 関連仕様書を提示

---

## 📋 変更対象別の Individual Instructions

### 変更対象: MemorizationView / QuestionScheduler / GamificationAI

**これらは最重要システムです。必ず以下をすべて確認:**

1. 📄 **[batch-system-enforcement.instructions.md](../batch-system-enforcement.instructions.md)**
   - バッチ方式の3原則（不変条件）
   - バッチ確定後は配列を変更しない
   - 完全消化まで再計算しない

2. 📄 **[position-hierarchy-enforcement.instructions.md](../position-hierarchy-enforcement.instructions.md)**
   - Position階層の不変条件
   - 70-100: incorrect
   - 60-69: still_learning (boosted)
   - 40-59: new (boosted)
   - 20-39: new (normal)
   - 0-19: mastered

3. 📄 **[category-slots-enforcement.instructions.md](../category-slots-enforcement.instructions.md)**
   - カテゴリースロット方式の不変条件
   - スロット配分ルール
   - useCategorySlots=true時の特別ルール

4. 📄 **[meta-ai-priority.instructions.md](../meta-ai-priority.instructions.md)**
   - QuestionScheduler + GamificationAI の現在の設計
   - トラブルシューティング手順
   - デバッグログの確認方法

---

### 変更対象: CSS / スタイル

📄 **[css-modification-rules.instructions.md](../css-modification-rules.instructions.md)**
- CSS変更の原則
- Tailwind優先
- ダークモード禁止

---

### 変更対象: データ / コンテンツ

📄 **[learning-content-quality-guard.instructions.md](../learning-content-quality-guard.instructions.md)**
- 学習コンテンツの品質基準
- データ検証手順

---

### 変更対象: 型定義

📄 **[property-naming-convention.instructions.md](../property-naming-convention.instructions.md)**
- プロパティ命名規則
- 型定義の確認方法
- 古いプロパティ名の検出

---

## 🧪 変更後の必須確認

### 1. テスト実行

```bash
# ユニットテスト（高速）
npm run test:unit:fast

# 該当ファイルのテストのみ
npm run test:unit:fast -- tests/unit/path/to/test.ts
```

### 2. 型チェック

```bash
npm run typecheck
```

### 3. Lint

```bash
npm run lint:errors-only
```

---

## 🔄 変更フロー（推奨）

```
1. Entry Point (INDEX.md) を読む
   ↓
2. このCategory Index を読む
   ↓
3. 変更対象に応じた Individual Instructions を読む
   ↓
4. ai-guard-check を実行
   ↓
5. 修正セッション開始（record-ai-failure.mjs start）
   ↓
6. コード変更
   ↓
7. テスト・型チェック・Lint
   ↓
8. 成功を記録（record-ai-failure.mjs success）
   ↓
9. コミット（pre-commit hookで自動ガード）
```

---

## 🚫 禁止事項（Critical）

- ❌ Individual Instructions を読まずにコード変更
- ❌ バッチ確定後に配列を変更
- ❌ Position階層を逆転させる
- ❌ 推測でプロパティ名を使用
- ❌ 症状的修正（根本原因を特定せず）

---

## 📚 関連 Individual Instructions 一覧

- [modification-enforcement.instructions.md](../modification-enforcement.instructions.md) ⭐ 最優先
- [batch-system-enforcement.instructions.md](../batch-system-enforcement.instructions.md) ⭐ Critical
- [position-hierarchy-enforcement.instructions.md](../position-hierarchy-enforcement.instructions.md) ⭐ Critical
- [category-slots-enforcement.instructions.md](../category-slots-enforcement.instructions.md) ⭐ Critical
- [meta-ai-priority.instructions.md](../meta-ai-priority.instructions.md)
- [specification-enforcement.instructions.md](../specification-enforcement.instructions.md)
- [css-modification-rules.instructions.md](../css-modification-rules.instructions.md)
- [property-naming-convention.instructions.md](../property-naming-convention.instructions.md)
- [learning-content-quality-guard.instructions.md](../learning-content-quality-guard.instructions.md)
- [ai-failure-prevention.instructions.md](../ai-failure-prevention.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
