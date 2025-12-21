---
title: ルートファイル整理レポート 2025-12-15
created: 2025-12-15
updated: 2025-12-15
status: in-progress
tags: [report, ai, test, dark-mode]
---

# ルートファイル整理レポート 2025-12-15

## 概要

ルート直下に散在していた9ファイル（ドキュメント、デモHTML、データファイル）を適切なフォルダに整理しました。

## 実施内容

### 1. デザイン関連 → `docs/design/` (3ファイル)

| ファイル名           | 内容                          | 用途                 |
| -------------------- | ----------------------------- | -------------------- |
| `DARK_MODE_GUIDE.md` | ライト/ダークモード開発ガイド | デザインガイドライン |
| `DESIGN_FREEZE.md`   | デザインフリーズ宣言          | デザイン方針         |
| `color-mapping.md`   | 80色→22色マッピング表         | カラーシステム       |

### 2. レポート → `docs/reports/` (2ファイル)

| ファイル名                            | 内容                               | 用途         |
| ------------------------------------- | ---------------------------------- | ------------ |
| `DATA_COVERAGE_REPORT.md`             | データ品質テストカバレッジレポート | 品質レポート |
| `VERIFICATION_TRANSLATION_HISTORY.md` | 和訳タブ履歴表示の検証手順         | 実装検証記録 |

### 3. デモファイル → `tools/demos/` (2ファイル)

| ファイル名           | 内容               | 用途           |
| -------------------- | ------------------ | -------------- |
| `color-palette.html` | カラーパレットデモ | デザインツール |
| `geometry-demo.html` | 幾何学図形デモ     | 開発ツール     |

### 4. データファイル → `tools/data/` (4ファイル)

| ファイル名                           | 内容                 | 用途             |
| ------------------------------------ | -------------------- | ---------------- |
| `grammar_translation_fixes.json`     | 文法翻訳修正データ   | 開発データ       |
| `maintenance_report.json`            | メンテナンスレポート | 自動生成レポート |
| `quality_nervous_system_report.json` | 品質神経系レポート   | 自動生成レポート |
| `unused_css_classes.txt`             | 未使用CSSクラス一覧  | 開発データ       |

## 参照リンク更新

### 更新したファイル (3ファイル)

1. `.ai-instructions/CRITICAL_RULES.md`
   - `DARK_MODE_GUIDE.md` → `docs/design/DARK_MODE_GUIDE.md`

2. `scripts/check-no-dark-mode.mjs`
   - `DARK_MODE_GUIDE.md` → `docs/design/DARK_MODE_GUIDE.md`

3. `docs/plans/PHASE_1_TASKS.md`
   - `geometry-demo.html` のタスク完了マーク

## 効果

### Before

```
nanashi8.github.io/
├── README.md ⭕
├── index.html ⭕
├── package.json ⭕
├── DARK_MODE_GUIDE.md ❌
├── DESIGN_FREEZE.md ❌
├── DATA_COVERAGE_REPORT.md ❌
├── VERIFICATION_TRANSLATION_HISTORY.md ❌
├── color-mapping.md ❌
├── color-palette.html ❌
├── geometry-demo.html ❌
├── grammar_translation_fixes.json ❌
├── maintenance_report.json ❌
├── quality_nervous_system_report.json ❌
├── unused_css_classes.txt ❌
└── (設定ファイル群) ⭕
```

### After

```
nanashi8.github.io/
├── README.md ✅
├── index.html ✅
├── package.json ✅
├── (設定ファイルのみ) ✅
├── docs/
│   ├── design/
│   │   ├── DARK_MODE_GUIDE.md ✅
│   │   ├── DESIGN_FREEZE.md ✅
│   │   └── color-mapping.md ✅
│   └── reports/
│       ├── DATA_COVERAGE_REPORT.md ✅
│       └── VERIFICATION_TRANSLATION_HISTORY.md ✅
└── tools/
    ├── demos/
    │   ├── color-palette.html ✅
    │   └── geometry-demo.html ✅
    └── data/
        ├── grammar_translation_fixes.json ✅
        ├── maintenance_report.json ✅
        ├── quality_nervous_system_report.json ✅
        └── unused_css_classes.txt ✅
```

### メリット

1. **整理整頓**: ルート直下がスッキリし、必要なファイルが見つけやすい
2. **カテゴリ明確化**: 用途別にフォルダ分けされ、管理しやすい
3. **スケーラビリティ**: 新規ファイル追加時の配置ルールが明確
4. **プロフェッショナル**: GitHubプロジェクトとしての見栄えが向上

## ルート直下に残るファイル（正常）

### 必須ファイル

- `README.md` - プロジェクト説明
- `index.html` - メインアプリケーション
- `package.json` - Node.js設定
- `package-lock.json` - 依存関係ロック
- `requirements.txt` - Python依存関係
- `setup.sh` - セットアップスクリプト

### 設定ファイル

- `tsconfig.json` - TypeScript設定
- `tsconfig.node.json` - Node用TypeScript設定
- `vite.config.ts` - Vite設定
- `vitest.config.ts` - Vitest設定
- `playwright.config.ts` - Playwright設定
- `tailwind.config.js` - Tailwind設定
- `postcss.config.cjs` - PostCSS設定
- `eslint.config.js` - ESLint設定
- `commitlint.config.js` - Commitlint設定
- `lighthouserc.js` - Lighthouse CI設定

これらは業界標準の配置で、ルート直下に置くべきファイルです。

## 統計

- **移動ファイル**: 9ファイル (git mv: 6, mv: 3)
- **新規フォルダ**: 2フォルダ (tools/demos/, tools/data/)
- **参照更新**: 3ファイル
- **リンク切れ**: 0件
- **git差分**: 38ファイルがrenameされています

## 今後の運用

### ファイル配置ルール

| ファイル種別                   | 配置先          |
| ------------------------------ | --------------- |
| デザインガイド・カラーシステム | `docs/design/`  |
| 実装・検証レポート             | `docs/reports/` |
| デモ・プロトタイプHTML         | `tools/demos/`  |
| 開発用データ・レポートJSON     | `tools/data/`   |
| 設定ファイル                   | ルート直下      |

### 推奨事項

1. HTMLデモファイルは`tools/demos/`に配置
2. 自動生成JSONレポートは`tools/data/`または`.gitignore`追加
3. デザイン関連ドキュメントは`docs/design/`に統一
4. ルート直下には設定ファイルとメインファイルのみ

## 関連ドキュメント

- [ドキュメント整理レポート](./DOCS_REORGANIZATION_2025-12-15.md)
- [デザインフリーズ宣言](../design/DESIGN_FREEZE.md)
- [プロジェクト構造検証](../design/PROJECT_STRUCTURE_VALIDATION.md)
