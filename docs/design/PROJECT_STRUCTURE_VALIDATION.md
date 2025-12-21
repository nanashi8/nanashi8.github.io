---
title: プロジェクト構造自動検証システム
created: 2025-12-13
updated: 2025-12-15
status: in-progress
tags: [design, ai]
---

# プロジェクト構造自動検証システム

**作成日**: 2025年12月13日  
**目的**: 設計方針に従ったプロジェクト構造を自動的に維持

---

## 🎯 概要

このシステムは、プロジェクトの設計方針（ファイル配置、命名規則、ドキュメント参照）を**自動的に検証**し、不整合を早期に検出します。

### 検証項目

1. ✅ **必須ファイルの存在確認**
   - `docs/quality/QUALITY_SYSTEM.md`
   - `scripts/validate_all_content.py`
   - `.aitk/instructions/*.instructions.md`

1. 🚫 **禁止ファイルの検出**
   - スペース+2 (`file 2.md`)
   - v2サフィックス (`file-v2.md`)
   - アーカイブ済みファイルの復活

1. 🔗 **ドキュメント参照の整合性**
   - instructions → ガイドラインへの正しい参照
   - 古いパス（`docs/` → `docs/quality/`）の検出

---

## 🚀 使用方法

### 手動実行

```bash
# プロジェクトルートで実行
cd nanashi8.github.io
python3 scripts/validate_project_structure.py
```

**出力例:**

```
============================================================
プロジェクト構造検証
============================================================

📁 ディレクトリ構造検証
  docs/quality/
    ✓ QUALITY_SYSTEM.md
    ✓ QUALITY_AUTOMATION_GUIDE.md
    ✗ OLD_FILE.md (削除すべき)

🚫 禁止パターン検出
  ⚠ docs/specifications/15-data-structures-v2.md

🔗 参照整合性チェック
  .aitk/instructions/code-quality.instructions.md
    ✓ docs/quality/QUALITY_SYSTEM.md
    ✗ docs/OLD_GUIDE.md (参照なし)

============================================================
✗ エラー: 2件
⚠ 警告: 1件
```

### 自動実行

#### 1. Pre-commit Hook（推奨）

コミット時に自動実行されます：

```bash
git add .
git commit -m "Your message"  # → 自動的に検証実行
```

#### 2. CI/CD (GitHub Actions)

プッシュ時に自動実行：

- ワークフロー: `.github/workflows/structure-validation.yml`
- トリガー: `main`, `develop` ブランチへのプッシュ/PR

---

## 🔧 カスタマイズ

### 検証ルールの追加

`scripts/validate_project_structure.py` の `EXPECTED_STRUCTURE` を編集：

```python
EXPECTED_STRUCTURE = {
    "docs/quality/": {
        "required": [
            "QUALITY_SYSTEM.md",
            "NEW_DOCUMENT.md",  # 追加
        ],
        "forbidden": [
            "OLD_FILE.md",  # 禁止ファイル追加
        ]
    },
}
```

### 禁止パターンの追加

```python
FORBIDDEN_PATTERNS = [
    "*2.md",
    "*-v2.md",
    "*-draft.md",  # 追加
]
```

---

## 🏗️ 業界標準との比較

### あなたのプロジェクト

```
✅ Documentation as Code
✅ Schema Validation (validate_project_structure.py)
✅ Pre-commit Hooks
✅ CI/CD Integration
✅ 自動リンクチェック
```

### 他プロジェクトの例

#### Next.js

- `lint-staged` + Husky
- ESLint + Prettier自動修正
- Turborepoでモノレポ検証

#### Kubernetes

- `make verify` で構造検証
- Bazelでビルドルール強制
- プロトコルバッファでスキーマ検証

#### React

- Dangerでプロジェクト規約チェック
- `size-limit` でバンドルサイズ監視
- CircleCIで自動検証

---

## 📊 メトリクス

検証スクリプトの実行統計：

| 項目           | 値     |
| -------------- | ------ |
| 検証ファイル数 | 13個   |
| 禁止パターン   | 3種類  |
| 参照チェック   | 2箇所  |
| 実行時間       | ~0.1秒 |

---

## 🐛 トラブルシューティング

### エラー: "必須ファイルが不足"

**原因**: ファイルが削除またはリネームされた

**解決策**:

```bash
# ファイルを復元
git checkout main -- docs/quality/QUALITY_SYSTEM.md

# または、archiveから復元
cp docs/quality/archive/OLD_FILE.md docs/quality/NEW_FILE.md
```

### エラー: "禁止パターンが検出"

**原因**: `*2.md` や `*-v2.md` ファイルが作成された

**解決策**:

```bash
# ファイルを削除または統合
rm "docs/file 2.md"

# v2を正式版に
mv docs/file-v2.md docs/file.md
```

### エラー: "参照が見つかりません"

**原因**: instructionsファイルが古いパスを参照

**解決策**:

```bash
# 一括置換
find .aitk/instructions -name "*.md" -exec sed -i '' 's|OLD_PATH|NEW_PATH|g' {} \;
```

---

## 📝 更新履歴

| 日付       | 変更内容       |
| ---------- | -------------- |
| 2025-12-13 | 初版作成       |
| 2025-12-13 | Pre-commit統合 |
| 2025-12-13 | CI/CD統合      |

---

## 🔗 関連ドキュメント

- [品質保証システム](.../quality/QUALITY_SYSTEM.md)
- [プロジェクト構造検証指示](../.aitk/instructions/project-structure.instructions.md)
- [開発ガイドライン](../.aitk/instructions/development-guidelines.instructions.md)
