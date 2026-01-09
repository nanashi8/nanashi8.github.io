# Document Component System (DocPart)

**ドキュメントを電子部品のように扱い、依存関係を管理・可視化するシステム**

## 📦 概要

DocPartは、プロジェクト内のMarkdownドキュメント間の依存関係を自動的に抽出・検証・可視化するツールです。

### 主な機能

- 🔍 **自動解析**: 473ファイル、894リンクを自動抽出
- 🔗 **依存関係の可視化**: Mermaidグラフで639接続を図示
- ✅ **リンク切れ検出**: 存在しないファイルへのリンクを警告
- 🎯 **型システム**: 7種類のSignal型で情報を分類
- 🤖 **CI統合**: PRごとに自動検証

---

## 🚀 クイックスタート

```bash
# 初期化（既存docsを解析）
npm run docpart:init

# 検証（リンク切れチェック）
npm run docpart:lint

# グラフ生成（依存関係の可視化）
npm run docpart:graph
```

**生成されるファイル**:
- `docs/_components.yaml` - 部品マップ（473コンポーネント）
- `docs/_graph.mmd` - Mermaidグラフ（VS Codeでプレビュー可能）
- `docs/_graph.json` - JSON形式（機械可読）

---

## 📊 統計情報（現在）

| 項目 | 値 |
|------|------|
| 総ファイル数 | 473 |
| 総依存関係数 | 639 |
| Guide | 354 |
| Report | 57 |
| Spec | 61 |
| ADR | 1 |

---

## 📚 ドキュメント

- **[使い方ガイド](../docs/how-to/DOCPART_USAGE.md)** - 日常的な使い方
- **[技術仕様書](../docs/design/DOCPART_SPECIFICATION.md)** - 詳細な設計
- **[テンプレート集](../docs/templates/)** - spec/guide/adr のテンプレート

---

## 🎯 設計思想

### 1. レゴブロック原則
- 接続点（Port）は最大3個まで
- 型（Signal）は5〜7種類で固定
- 見れば分かる、間違えても壊れない

### 2. コンセント原則
- 抜き差し容易（依存が壊れても警告のみ）
- 標準規格（YAML、Markdown、無変更）
- 後方互換（ツールなしでも動く）

### 3. 立つ鳥跡を濁さず原則
- 既存ファイルは無変更
- 外部マッピング（`_components.yaml`）で管理
- ツール削除後も破綻しない

---

## 🔧 コマンド詳細

### `npm run docpart:init`

既存のdocs配下を解析し、初期マッピングを生成。

```bash
npm run docpart:init [--force] [--config=path]
```

**オプション**:
- `--force`: 既存ファイルを上書き
- `--config`: 設定ファイルのパス

### `npm run docpart:lint`

マッピングファイルの整合性を検証。

```bash
npm run docpart:lint [--config=path]
```

**検証項目**:
- 構造の妥当性
- ID の重複
- 未解決の requires
- 孤立部品
- 循環依存

### `npm run docpart:graph`

依存関係グラフを生成。

```bash
npm run docpart:graph [--config=path]
```

**出力**:
- `docs/_graph.mmd` - Mermaid形式
- `docs/_graph.json` - JSON形式

---

## 🤖 CI統合

PRごとに自動検証：

```yaml
# .github/workflows/docpart-validation.yml
name: DocPart Validation
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run docpart:lint
      - run: npm run docpart:graph
```

---

## 🔗 2人3脚の連携

### Copilot（あなた・私） ← → Servant ← → DocPart

```
[DocPart]
  ├─ _components.yaml を生成
  └─ 依存関係を抽出

[Servant]
  ├─ _components.yaml を監視
  ├─ CodeLensで部品情報を表示（将来）
  └─ Diagnosticsで警告（将来）

[Copilot]
  ├─ _components.yaml を読み取り
  └─ 適切な参照先を提案
```

---

## 📈 効果測定

| 指標 | 現状 | 目標 |
|------|------|------|
| リンク切れ検出 | ✅ 実装済み | 0件維持 |
| 依存関係の可視化 | ✅ 639エッジ | 100%カバー |
| 未解決依存の削減 | 警告あり | 50%削減 |
| Copilot提案の質 | 改善中 | 主観評価向上 |

---

## 🛠️ 実装詳細

### ディレクトリ構造

```
scripts/docpart/
├── core/               # コアロジック（将来外部化可能）
│   ├── types.ts        # 型定義
│   ├── parser.ts       # YAMLパーサー
│   ├── analyzer.ts     # 依存関係解析
│   ├── markdown.ts     # Markdownパーサー
│   └── config.ts       # 設定ローダー
├── init.ts             # 初期化コマンド
├── lint.ts             # 検証コマンド
├── graph.ts            # グラフ生成コマンド
└── cli.ts              # CLIエントリーポイント
```

---

## 🚀 ロードマップ

### ✅ Phase 1-3: 基本機能（完了）
- 仕様策定
- コア実装
- 初期データ生成

### ✅ Phase 4: CI統合（完了）
- GitHub Actions
- PR自動検証

### 🔜 Phase 5: Servant統合（次期）
- CodeLens
- Diagnostics
- TreeView

### 🔜 Phase 6: 双方向連携（将来）
- knowledge-base.json
- タスクキュー

---

## 📄 ライセンス

このプロジェクトと同じライセンス

---

## 🙏 謝辞

- **DITA / Topic-Based Authoring**: モジュール文書の先行例
- **Backstage / Service Catalog**: 部品台帳の概念
- **OpenAPI / AsyncAPI**: 契約ベース設計の思想

---

**Version**: 1.0.0  
**Created**: 2026-01-09  
**Status**: Production Ready
