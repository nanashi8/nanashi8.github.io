---
description: ドキュメント作成・更新時のカテゴリ索引
category: documentation
---

# 📂 Category: Documentation

## 🎯 このカテゴリの対象

- ドキュメントの作成
- ドキュメントの更新
- ドキュメント構造の改善
- ドキュメント品質の向上

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. ドキュメント命名規則 ⭐ 最優先

📄 **[document-naming-guard.instructions.md](../document-naming-guard.instructions.md)**

**命名規則**:
- 大文字スネークケース: `MY_DOCUMENT.md`
- 単語はアンダースコア `_` で区切る
- 動詞から始める: `IMPLEMENT_`, `FIX_`, `ADD_`

**禁止**:
- ❌ キャメルケース: `myDocument.md`
- ❌ ケバブケース: `my-document.md`
- ❌ スペース: `my document.md`

---

### 2. ドキュメント強制ガイド

📄 **[documentation-enforcement.instructions.md](../documentation-enforcement.instructions.md)**

**ドキュメント作成の原則**:
1. 目的を明確にする
2. 対象読者を明確にする
3. Diátaxis分類を決める（Tutorial / How-to / Reference / Explanation）
4. SSOT（Single Source of Truth）を守る

---

### 3. SSOT強制

📄 **[ssot-enforcement.instructions.md](../ssot-enforcement.instructions.md)**

**同じ情報を複数箇所に書かない**:
- 1つの情報は1箇所にのみ記述
- 他の箇所からはリンクで参照
- 更新時の同期忘れを防ぐ

---

## 📖 Diátaxis分類

### Tutorial（チュートリアル）
- 学習指向
- ステップバイステップ
- 初心者向け
- 例: `GETTING_STARTED.md`

### How-to Guide（ハウツーガイド）
- タスク指向
- 問題解決手順
- 中級者向け
- 例: `HOW_TO_ADD_NEW_QUESTION.md`

### Reference（リファレンス）
- 情報指向
- API・設定・仕様
- すべてのレベル
- 例: `API_REFERENCE.md`

### Explanation（説明）
- 理解指向
- 背景・設計判断
- 上級者向け
- 例: `BATCH_SYSTEM_DESIGN.md`

---

## 📁 ドキュメント配置

```
docs/
├── INDEX.md                    # エントリーポイント
├── tutorials/                  # チュートリアル
├── how-to/                     # ハウツーガイド
├── references/                 # リファレンス
├── explanations/               # 説明
├── specifications/             # 仕様書
├── design/                     # 設計ドキュメント
├── reports/                    # レポート
└── archive/                    # 古いドキュメント
```

---

## ✍️ ドキュメント作成フロー

```
1. 目的を明確化
   - 誰のため？
   - 何を伝える？
   ↓
2. Diátaxis分類を決定
   - Tutorial / How-to / Reference / Explanation
   ↓
3. ファイル名を決定
   - document-naming-guard.instructions.md に従う
   - 大文字スネークケース
   ↓
4. 配置ディレクトリを決定
   - docs/の適切なサブディレクトリ
   ↓
5. 既存ドキュメントと重複しないか確認
   - SSOT原則
   - 重複があればリンクで参照
   ↓
6. frontmatterを追加
   - description, date, author等
   ↓
7. 内容を記述
   - 明確・簡潔・正確
   ↓
8. リンクチェック
   npm run docs:analyze
   ↓
9. コミット
```

---

## 🔍 ドキュメント品質チェック

```bash
# リンク切れチェック
npm run docs:analyze

# 命名規則違反チェック
npm run docs:analyze:naming

# 全体チェック
npm run docs:check

# 統計表示
npm run docs:stats
```

---

## 🚫 禁止事項

- ❌ ドキュメント命名規則違反
- ❌ SSOT違反（同じ情報を複数箇所に記述）
- ❌ 目的不明のドキュメント
- ❌ 対象読者不明のドキュメント
- ❌ Diátaxis分類なし
- ❌ 古い情報の放置

---

## 📚 関連 Individual Instructions 一覧

- [document-naming-guard.instructions.md](../document-naming-guard.instructions.md) ⭐ 最優先
- [documentation-enforcement.instructions.md](../documentation-enforcement.instructions.md) ⭐ Critical
- [ssot-enforcement.instructions.md](../ssot-enforcement.instructions.md) ⭐ Critical

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
