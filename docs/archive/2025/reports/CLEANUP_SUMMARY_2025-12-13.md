---
title: フォルダ構成整理サマリー
created: 2025-12-15
updated: 2025-12-15
status: in-progress
tags: [report, test]
---

# フォルダ構成整理サマリー

**実行日時**: 2025年12月13日  
**目的**: 重複ファイル・不要フォルダの削除とパイプライン関連の統合  
**Phase 2完了**: 「2」ファイルの統合とドキュメント整理

## ✅ 削除したもの

### 1. 重複ファイル

- ✅ `nanashi8.github.io/.copilot-instructions 2` - 重複(本体の `.copilot-instructions.md` を保持)
- ✅ `nanashi8.github.io-archive-2025-12-11/CHANGELOG 2.md` - アーカイブ内の重複

### 2. 不要フォルダ

- ✅ `nanashi8.github.io/Documents/` - 謎の循環構造フォルダ
- ✅ `nanashi8.github.io.bfg-report/` - BFG git cleaner一時レポート
- ✅ `test-results/` (ルート) - 古いテスト結果(プロジェクト内のものを保持)

### 3. 統合・移動（パイプライン関連）

- ✅ `scripts/` (ルート) → `nanashi8.github.io/scripts/` に統合
  - `map_to_core_palette.py`
  - `rebuild_grade2_complete.py`
  - `validate_all_content.py`
  - `validate_and_fix_duplicates.py`
  - `validate_ui_specifications.py`
- ✅ `docs/` (ルート) → `nanashi8.github.io/docs/quality/` に統合
  - `INTEGRATED_QUALITY_PIPELINE.md`
  - `QUALITY_AUTOMATION_GUIDE.md`

````
nanashi8-github-io-git/
├── .git/
├── .github/
│   └── workflows/
│       └── quality-check.yml            # CI/CD (パス更新済み)
├── .venv/
├── nanashi8.github.io/                  # メインプロジェクト（全統合）
│   ├── docs/
│   │   ├── quality/                     # 品質パイプライン関連
│   │   │   ├── INTEGRATED_QUALITY_PIPELINE.md
│   │   │   └── QUALITY_AUTOMATION_GUIDE.md
│   │   ├── guidelines/
│   │   ├── specifications/
│   │   └── ...
│   ├── scripts/                         # 全スクリプト統合（33個）
│   │   ├── validate_all_content.py
│   │   ├── validate_ui_specifications.py
│   │   ├── map_to_core_palette.py
│   │   ├── rebuild_grade2_complete.py
│   │   └── ...
│   ├── src/
│   ├── tests/
│   ├── test-results/
│   └── public/
├── nanashi8.github.io-archive-2025-12-11/   # アーカイブ(保持)
├── README_QUALITY_PIPELINE.md               # ルートREADME（パス更新済み）
└── package-lock.json
``` nanashi8.github.io-archive-2025-12-11/   # アーカイブ(保持)
├── README_QUALITY_PIPELINE.md
└── package-lock.json
````

## 🎯 統合後の構成

### `/nanashi8.github.io/` (シングルアプリ構成)

全てのプロジェクトリソースを統合:

- **`docs/`**: 全ドキュメント（品質・仕様・ガイドライン）
  - `quality/`: 品質パイプライン関連（統合済み）
  - `guidelines/`: 開発ガイドライン
  - `specifications/`: 機能仕様
- **`scripts/`**: 全自動化スクリプト（33個）
  - 品質検証スクリプト（統合済み）
  - データ処理スクリプト
  - 自動修正ツール

- **実行方法**: `cd nanashi8.github.io && python3 scripts/...`

## ✅ 更新された参照

**以下のファイルを更新済み:**

- ✅ `README_QUALITY_PIPELINE.md` - スクリプトパス更新
- ✅ `.github/workflows/quality-check.yml` - CI/CD working-directory追加
- ✅ `nanashi8.github.io/docs/quality/INTEGRATED_QUALITY_PIPELINE.md` - パス修正

**機能への影響:**

- ✅ 全スクリプトは正常に動作（パス更新済み）
- ✅ CI/CDは正常に動作（working-directory設定済み）
- ✅ アーカイブは保持

## ✅ Phase 2: 「2」ファイルと重複ドキュメントの整理

### 削除・統合したファイル

**「2」付き重複ファイル:**

- ✅ `CSS_DEVELOPMENT_GUIDELINES 2.md` - 削除（完全同一）
- ✅ `TYPESCRIPT_DEVELOPMENT_GUIDELINES 2.md` - 削除（完全同一）
- ✅ `15-data-structures-v2 2.md` - 削除（完全同一）

**v2ファイルの統合:**

- ✅ `15-data-structures-v2.md` → `15-data-structures.md` に昇格（詳細版）
- ✅ 旧 `15-data-structures.md` → `-old.md` にリネーム

**品質ドキュメント整理（→ archive/）:**

- ✅ `README_QUALITY_PIPELINE.md`
- ✅ `CONTINUOUS_IMPROVEMENT_PIPELINE.md`
- ✅ `QUALITY_PIPELINE.md`
- ✅ `GRAMMAR_QUALITY_ASSURANCE.md`

**スクリプト整理（→ archive/）:**

- ✅ `check-data-quality.sh` - validate_all_content.pyと重複
- ✅ `data-quality-check.py` - 同上
- ✅ `validate_grammar_questions.py` - 古いバージョン
- ✅ `refactor-checkpoint.sh` - 一時ファイル

### 整理結果

- **docs/quality/**: 13ファイル（重複なし、最新版のみ）
- **docs/quality/archive/**: 4ファイル
- **scripts/**: 28アクティブスクリプト
- **scripts/archive/**: 4古いスクリプト

## 📝 今後の推奨事項

1. **アーカイブの圧縮**
   - `nanashi8.github.io-archive-2025-12-11/` を `.tar.gz` で圧縮
   - 必要に応じて別の場所に移動

2. **命名規則の明確化**
   - `*-grade2.json` は学年を示すため正常（保持）
   - バージョン管理は Git に任せ、ファイル名に「2」「v2」は使わない

## 🔍 整理の効果

- **可読性向上**: ルート階層が超シンプルに（プロジェクトフォルダ＋README）
- **保守性向上**: 全リソースが`nanashi8.github.io/`に集約
- **実行の簡単化**: `cd nanashi8.github.io`で全スクリプト実行可能
- **一貫性向上**: シングルアプリ構成として統一
- **容量削減**: 不要フォルダ・重複ファイルの削除
- **可読性向上**: ルート階層がシンプルに
- **保守性向上**: スクリプト・ドキュメントの場所が明確に
- **容量削減**: 不要フォルダ・重複ファイルの削除
- **一貫性向上**: docs/scripts の役割が明確に分離
