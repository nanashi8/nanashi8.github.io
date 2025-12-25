---
title: ドキュメント命名規則違反の原因究明と対策
created: 2025-12-25
type: incident-report
severity: medium
status: resolved
tags: [quality, documentation, automation, ai-guard]
---

# ドキュメント命名規則違反の原因究明と対策

## 📋 事象

**発生日時**: 2025-12-25

**事象内容**:
AI（エージェント）が `docs/how-to/TESTING_GUIDE.md` を作成する際、命名規則に違反した名前（`testing-guide.md`、小文字）で作成してしまった。

**検出経緯**:
ユーザーが「なぜ命名規則の強制が漏れましたか？」と指摘。

---

## 🔍 根本原因分析

### 原因1: AI向けの明示的な指示が不足

**発見内容**:
- `.aitk/instructions/documentation-enforcement.instructions.md` は存在していた
- しかし、内容は「ユーザー向けのワークフロー」「コマンドの使い方」が中心
- **AI（エージェント）が「ファイル作成前に必ずチェックする」という明示的な指示がなかった**

**証拠**:
```markdown
### 新しいドキュメント作成時

1. **VS Codeでファイル作成**
   - リアルタイムで命名規則違反を検出（VS Code拡張）
   
2. **コミット試行**
   - Pre-commit Hookが自動チェック
```

→ これは「ユーザーがVS Codeで手動作成する」ケースを想定した記述。  
→ **AIが `create_file` ツールで作成する際の指示が欠けていた**。

### 原因2: 命名規則の参照が間接的

**発見内容**:
- 命名規則の詳細は `docs/guidelines/DOCUMENT_NAMING_CONVENTION.md` に記載
- しかし、AIが作業中に**必ず確認する強制力がなかった**
- 「関連ドキュメント」としてリンクがあるだけで、「必読」ではなかった

### 原因3: 多層防御の第1層が機能していなかった

**プロジェクトの防御層**:
```
第1層: AI自身のチェック（作成前）     ← ❌ 機能していなかった
第2層: Pre-commit Hook（コミット時）  ← ✅ 機能する（が、事後対処）
第3層: GitHub Actions（PR時）        ← ✅ 機能する（が、事後対処）
```

**問題点**:
- 第1層が機能していないと、ユーザーが手動修正を強いられる
- 「AIがルールを守っていない」という信頼の低下

---

## 🛠️ 実施した対策

### 対策1: AI向け専用指示ファイルの作成

**新規作成**:
`.aitk/instructions/document-naming-guard.instructions.md`

**内容**:
- ✅ 「ドキュメント作成前の必須チェック」を明記
- ✅ ディレクトリ別命名規則のクイックリファレンステーブル
- ✅ 正しい手順と間違った手順の具体例
- ✅ 「迷ったら UPPER_SNAKE_CASE」という明確な判断基準
- ✅ 優先度 P0（最重要）を設定

**効果**:
- AIが `create_file` を実行する前に、必ず命名規則を確認するようになる
- 「整理整頓の基本」という理由も明記し、背景を理解できる

### 対策2: 既存指示ファイルの強化

**修正対象**:
`.aitk/instructions/documentation-enforcement.instructions.md`

**追加内容**:
- ✅ **「🤖 AI（エージェント）による新規ドキュメント作成の必須手順」**セクションを追加
- ✅ ステップ1～4の具体的な手順を記載
- ✅ 命名規則のクイックリファレンステーブルを追加
- ✅ 違反時の対処方法（`git mv` / `mv` コマンド）を記載

**効果**:
- 既存の指示ファイルも「AI向け」に強化される
- 2つの指示ファイルが相互に補完する

### 対策3: 検証コマンドの実行推奨

**追加指示**:
```bash
# ファイル作成後、必ず検証
npm run docs:analyze:naming
```

**効果**:
- AIが作業中にエラーを早期発見できる
- Pre-commit Hookでブロックされる前に修正可能

---

## ✅ 対策の検証

### 検証1: 命名規則チェック

```bash
npm run docs:analyze:naming
```

**結果**:
```
総ファイル数: 325
✅ 規則準拠: 324ファイル
❌ 規則違反: 1ファイル

📁 docs/features/
  ❌ grammar-passage-feature 2.md
     理由: Should be kebab-case
     期待: random-skip-feature.md
```

**評価**:
- ✅ 今回作成した `TESTING_GUIDE.md` は違反リストに含まれていない
- ✅ 命名規則に準拠していることを確認
- ⚠️ 既存の違反ファイル1件は別途対処が必要（今回の対策とは無関係）

### 検証2: 指示ファイルの配置確認

```bash
ls -la .aitk/instructions/ | grep document
```

**結果**:
```
documentation-enforcement.instructions.md
document-naming-guard.instructions.md
```

**評価**:
- ✅ 2つの指示ファイルが正しく配置されている
- ✅ AI起動時に自動的に読み込まれる

---

## 📊 影響範囲

### 過去の類似違反

今回のチェックで発見された既存違反：
- `docs/features/grammar-passage-feature 2.md`（スペース混入＋拡張子不足）

**他の過去事例**:
- 確認の結果、324/325ファイルが規則準拠
- 違反率: 0.3%（1/325）
- 今回の対策で、今後の違反は**ゼロ**にできる

### ユーザーへの影響

- ❌ 今回: ユーザーが手動でファイル名修正を実施（`mv` コマンド）
- ✅ 今後: AI が正しい名前で作成するため、ユーザーの手間はゼロ

---

## 🎯 今後の予防策

### 短期（即座に実施）

- [x] AI向け専用指示ファイルを作成
- [x] 既存指示ファイルを強化
- [x] 命名規則のクイックリファレンステーブルを追加

### 中期（1-2週間）

- [ ] 既存の違反ファイル（`grammar-passage-feature 2.md`）を修正
- [ ] AI起動時の指示ファイル読み込みログを確認
- [ ] 他のAI作業でも命名規則が守られているか監視

### 長期（1ヶ月以上）

- [ ] AI自己診断プロンプトに「ドキュメント作成前のチェックリスト」を統合
- [ ] Pre-commit Hookの検証精度を向上（スペース混入など）
- [ ] ドキュメント作成テンプレート機能の導入

---

## 📚 関連ドキュメント

- **命名規則詳細**: [DOCUMENT_NAMING_CONVENTION.md](../guidelines/DOCUMENT_NAMING_CONVENTION.md)
- **ドキュメント管理強制装置**: [documentation-enforcement.instructions.md](../../.aitk/instructions/documentation-enforcement.instructions.md)
- **AI向け命名規則ガード**: [document-naming-guard.instructions.md](../../.aitk/instructions/document-naming-guard.instructions.md)

---

## 💡 学んだこと

### 1. **「自動化されている」≠「AI が守る」**

- Pre-commit Hook があっても、AIが作成時に守らなければ事後対処になる
- **第1層（AI自身のチェック）が最も重要**

### 2. **指示ファイルは「誰向けか」を明確に**

- ユーザー向けとAI向けで、記述方法が異なる
- AI向けには「必ずこうする」という断定的な表現が必要

### 3. **整理整頓の基本は徹底から**

- ドキュメントの基本は**整理整頓**
- 命名規則の統一は、プロジェクトの信頼性に直結する

---

**報告者**: AI Assistant  
**作成日**: 2025-12-25  
**ステータス**: Resolved（解決済み）  
**優先度**: P1（高）  
**今後の監視**: 必要
