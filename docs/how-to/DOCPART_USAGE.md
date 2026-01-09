# Document Component System - 使い方ガイド

## 📋 概要

**DocPart（ドキュメント部品システム）** は、ドキュメントを電子部品のように扱い、依存関係を管理・可視化するシステムです。

### できること

- ✅ **依存関係の可視化**: ドキュメント間のリンクを自動抽出してグラフ化
- ✅ **リンク切れ検出**: 存在しないファイルへのリンクを自動検出
- ✅ **孤立ファイル検出**: 誰からも参照されていないドキュメントを発見
- ✅ **型システム**: 7種類のSignal型で情報の種類を分類
- ✅ **CI統合**: PRごとに自動検証

---

## 🚀 クイックスタート

### 1. 初期化（初回のみ）

既存のdocs配下を解析して、初期マッピングを生成します。

```bash
npm run docpart:init
```

**出力**:
- `docs/_components.yaml` - 部品マップ（5000行程度）
- コンソールに統計情報を表示

### 2. 検証

マッピングファイルの整合性を検証します。

```bash
npm run docpart:lint
```

**チェック項目**:
- 必須フィールドの存在
- ID の重複
- 未解決の `requires`（リンク切れ）
- 孤立部品の検出

### 3. グラフ生成

依存関係グラフを生成します。

```bash
npm run docpart:graph
```

**出力**:
- `docs/_graph.mmd` - Mermaid形式（VS Codeでプレビュー可能）
- `docs/_graph.json` - JSON形式（機械可読）

### 4. グラフの表示

VS Codeで `docs/_graph.mmd` を開き：
- **Mermaid Preview拡張機能** を使う（`bierner.markdown-mermaid`）
- または https://mermaid.live/ にペースト

---

## 📝 日常の使い方

### ドキュメントを新規作成する時

1. **普通にMarkdownファイルを作成**（変更なし）
2. **リンクを普通に書く**（変更なし）
   ```markdown
   詳細は [AI統合ガイド](../ai-systems/integration-guide.md) を参照
   ```
3. **再解析** (任意)
   ```bash
   npm run docpart:init --force
   ```

### ドキュメントを編集する時

- **通常通り編集してください**
- `_components.yaml` は手動で編集する必要はありません
- リンクを追加/削除したら `npm run docpart:init --force` で再生成

### リンク切れを確認する時

```bash
npm run docpart:lint
```

**警告が出たら**:
- リンク先のファイルパスを確認
- 必要なら修正
- 不要なリンクなら削除

---

## 🎯 高度な使い方

### frontmatter で明示的に管理

重要なドキュメントは、ファイル内で明示的に部品情報を定義できます。

```markdown
---
docpart:
  id: DOC:SERVANT:AUTO_LEARNING
  type: spec
  version: '1.0.0'
  provides:
    - name: learning_policy
      signal: Policy:v1
  requires:
    - name: guard_rules
      signal: Policy:v1
      from: DOC:AI:GUARD_SYSTEM
---

# サーバント自動学習システム

...
```

**優先順位**:
1. frontmatter（最優先）
2. `_components.yaml`
3. 自動推論

### 設定のカスタマイズ

`.docpartrc.yaml` を編集：

```yaml
# 型推論ルールを追加
typeInference:
  patterns:
    - pattern: 'my-specs/*.md'
      type: spec
  keywords:
    - keyword: TUTORIAL
      type: guide

# 除外パターンを追加
exclude:
  - 'drafts/**'
  - 'archive/**'
```

---

## 🔧 トラブルシューティング

### Q: `npm run docpart:init` でエラーが出る

**A**: Node.js 18以上が必要です。

```bash
node --version  # 18以上か確認
npm install     # 依存関係を再インストール
```

### Q: グラフが大きすぎて表示できない

**A**: `.docpartrc.yaml` で制限を緩和：

```yaml
graph:
  maxNodes: 200  # デフォルト100
```

または、特定のディレクトリだけ解析：

```yaml
rootDir: docs/specifications  # サブディレクトリのみ
```

### Q: リンク切れ警告が多すぎる

**A**: `docs/` 外へのリンク（scripts/, .github/）は正常です。

警告を減らすには：
- `.docpartrc.yaml` の `lint.unresolvedAsWarning: true` で警告扱い
- または対象ファイルも `_components.yaml` に追加

### Q: `_components.yaml` が Git で大きくなりすぎる

**A**: これは正常です（5000行程度）。

- YAMLは圧縮効率が高い（gzipで1/10以下）
- Gitは差分のみ記録するので、実際の増加は小さい
- 気になる場合は `.gitattributes` で圧縮を指定

---

## 📚 関連ドキュメント

- [技術仕様書](../design/DOCPART_SPECIFICATION.md) - 詳細な設計
- [テンプレート集](../templates/) - spec/guide/adr のテンプレート
- [README](../../scripts/docpart/README.md) - 実装詳細

---

## 🆘 サポート

問題が発生したら：

1. `npm run docpart:lint` でエラー詳細を確認
2. [技術仕様書](../design/DOCPART_SPECIFICATION.md) を確認
3. Issueを作成（ラベル: `docpart`）

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-09
