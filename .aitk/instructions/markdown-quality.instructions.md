---
description: Markdown品質ガイドライン - markdownlintエラーの防止
applyTo: '**/*.md'
---

# Markdown品質ガイドライン

## 🎯 目的

このinstructionsファイルは、markdownlintエラーを防止し、Markdownファイルの品質を保つためのガイドラインを定義します。

---

## 🚨 よくあるエラーと対策

### 1. MD038: コードスパン内のスペース

**エラー内容**: Spaces inside code span elements

**NG例**:
```markdown
`agent ` や `npm ` のようにバッククォート内の末尾・先頭にスペース
```

**OK例**:
```markdown
`agent` や `npm` のようにスペースなし
```

**修正方法**:
- バッククォート（`）内の**先頭と末尾のスペースを削除**
- 文中で必要なスペースはバッククォートの**外側**に配置

**具体例**:
```markdown
❌ Quick Open（⌘P）から `agent ` でアクセスできる
✅ Quick Open（⌘P）から `agent` でアクセスできる

❌ `npm ` コマンドを実行
✅ `npm` コマンドを実行

❌ ` hello ` world
✅ `hello` world
```

---

## ✅ Markdownファイル作成・編集時のチェックリスト

### コード記法使用時
- [ ] バッククォート内の先頭・末尾にスペースがないか確認
- [ ] コマンド例やコード例は正確にコピー
- [ ] 日本語文中の英単語を `code` で囲む場合、前後のスペースは外側に

### 保存前の確認
- [ ] VS Codeの問題パネル（⌘⇧M）でエラー0を確認
- [ ] 特にMD038エラーがないことを確認

### AI（Copilot/Claude等）使用時の注意
- コードスパン（バッククォート）を生成する際、**末尾にスペースを入れない**よう指示
- 既存ファイルを編集する際は、コードスパンのスペースに注意

---

## 🔧 設定情報

### 現在の.markdownlint.json設定

以下のルールが無効化されています（プロジェクト方針）:
- MD001, MD007, MD009, MD012, MD013, MD022, MD024, MD025, MD026, MD031, MD032, MD034, MD036, MD040, MD041, MD047, MD029, MD051, MD056, MD058, MD060

**MD038は有効**（品質維持のため）

### 無効化されていない重要ルール

- **MD038**: コードスパン内のスペース禁止 ← 本ガイドラインの主要対象

---

## 📚 参考リンク

- [markdownlintルール一覧](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)
- [MD038詳細](https://github.com/DavidAnson/markdownlint/blob/main/doc/md038.md)

---

## 🤖 AIへの指示例

### Copilot/Claude使用時

```
Markdownファイルを編集する際は、以下に注意してください：
1. バッククォート（`）内の先頭・末尾にスペースを入れない
2. 例: `agent ` → `agent`
3. MD038エラーを防ぐため、コードスパンのスペースに注意
```

---

## 🛡️ サーバントによる自動チェック

### Pre-commit Hook

コミット時に自動的にmarkdownlintがチェックされます:
```bash
# .husky/pre-commit で実行
npm run lint
```

エラーがある場合、コミットが中断されます。

### 修正後の確認方法

```bash
# 手動でlintチェック
npm run lint

# 特定ファイルのみチェック
npx markdownlint docs/path/to/file.md
```

---

## 📊 統計情報

- MD038エラー発生頻度: **低（稀）**
- 主な発生箇所: **日本語文書内のコマンド例**
- 対策効果: **本ガイドライン導入により予防可能**

---

## 🔄 更新履歴

- 2026-01-09: 初版作成（MD038エラー対策）
