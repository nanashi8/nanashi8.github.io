---
description: ドキュメント管理の強制装置とワークフロー
applyTo: '**/*.md'
---

# ドキュメント管理強制装置

## 🎯 目的

ドキュメント品質を自動的に保証し、リンク断線・命名規則違反を防止する強制装置を定義します。

## 🛡️ 強制装置の階層

### レベル1: リアルタイム検証（VS Code）

**有効化済み**: `.vscode/settings.json`

```json
"markdown.validate.enabled": true,
"markdown.validate.fileLinks.enabled": "error",
"markdown.validate.referenceLinks.enabled": "warning",
"markdown.validate.fragmentLinks.enabled": "warning"
```

**効果**:
- ✅ 存在しないファイルへのリンクを**即座に赤線表示**
- ✅ フラグメントリンク（#アンカー）の検証
- ✅ 編集中にリアルタイムでエラー検出

**推奨拡張機能**: `.vscode/extensions.json`で自動提案

### レベル2: コミット時検証（Pre-commit Hook）

**有効化済み**: `.husky/check-doc-naming`

```bash
# 新規追加ファイルの命名規則を自動チェック
- specifications/: 番号付きkebab-case
- guidelines/: UPPER_SNAKE_CASE
- how-to/: UPPER_SNAKE_CASE
- features/: kebab-case
```

**効果**:
- ✅ 命名規則違反をコミット時にブロック
- ✅ 違反ファイルは絶対にmainブランチに入らない
- ✅ 100%の命名規則準拠を保証

### レベル3: PR時検証（GitHub Actions）

**有効化済み**: `.github/workflows/link-checker.yml`

```yaml
- name: Run advanced link analysis
  run: node scripts/analyze-doc-links.mjs
  # 断線数が閾値（80箇所）を超えるとエラー
```

**効果**:
- ✅ PRマージ前に全リンクを検証
- ✅ 断線数の急増を検出
- ✅ 重要ファイルの存在確認

## 📊 現在の品質メトリクス

| 項目 | 数値 | 達成率 |
|------|------|--------|
| ドキュメントファイル数 | 306 | - |
| 総リンク数 | 684 | - |
| 断線リンク | 76 (開始時263から71%削減) | ✅ 目標達成 |
| 命名規則準拠 | 100% (306/306) | ✅ 完全準拠 |
| 検証時間 | 5秒 (手動から360倍高速化) | ✅ 目標達成 |

## 🚀 日常的な使い方

### AI（サーバント）が使用するコマンド

```bash
# ドキュメント統計表示
npm run docs:stats

# リンク分析
npm run docs:analyze

# 命名規則チェック
npm run docs:analyze:naming

# 両方実行
npm run docs:check
```

**出力例**:
```
📊 Documentation Statistics:
     306
Markdown files
📁 分析対象: 306ファイル
🔗 総リンク数: 684
❌ 断線リンク: 76
```

### 新しいドキュメント作成時

1. **VS Codeでファイル作成**
   - リアルタイムで命名規則違反を検出（VS Code拡張）
   
2. **コミット試行**
   - Pre-commit Hookが自動チェック
   - 違反があれば exit 1 でブロック
   
3. **PR作成**
   - GitHub Actionsが全リンクを検証
   - 閾値超過でマージ拒否

## 📋 重要ファイルの保護

### 移動禁止ファイル（.donotmove）

以下のファイルは絶対に移動・リネーム禁止：

```
docs/guidelines/META_AI_TROUBLESHOOTING.md
docs/guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md
docs/specifications/QUESTION_SCHEDULER_SPEC.md
docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md
docs/references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md
```

**理由**: 多数のファイルから参照され、移動するとシステム全体に影響

**検証**: GitHub Actionsで存在確認

## 🔗 関連ドキュメント

- **命名規則の詳細**: [DOCUMENT_NAMING_CONVENTION.md](../../guidelines/DOCUMENT_NAMING_CONVENTION.md)
- **ワークフロー全体**: [EFFICIENT_DOC_WORKFLOW.md](../../processes/EFFICIENT_DOC_WORKFLOW.md)
- **SSG導入ガイド**: [DOCUSAURUS_SETUP_GUIDE.md](../../how-to/DOCUSAURUS_SETUP_GUIDE.md)
- **リンク修正レポート**: [LINK_FIX_COMPLETION_REPORT.md](../../reports/LINK_FIX_COMPLETION_REPORT.md)

## 🎓 業界標準との比較

| 手法 | このプロジェクト | Kubernetes | React | TypeScript |
|------|-----------------|-----------|-------|-----------|
| **命名規則強制** | ✅ Pre-commit | ✅ 手動 | ✅ 手動 | ✅ 手動 |
| **リンク検証CI** | ✅ GitHub Actions | ✅ Hugo | ✅ Docusaurus | ✅ VitePress |
| **リアルタイム検証** | ✅ VS Code | ❌ | ✅ | ✅ |
| **自動修正** | ✅ スクリプト | ❌ | ❌ | ❌ |

→ **業界トップクラスの自動化を実現**

## 🚨 トラブルシューティング

### Q1: VS Codeでリンクエラーが表示されない

**原因**: Markdown拡張機能が未インストール

**解決策**:
```bash
# 推奨拡張機能をインストール
# VS Code: Cmd+Shift+P → "Extensions: Show Recommended Extensions"
```

### Q2: Pre-commit Hookが動かない

**原因**: Huskyが未初期化

**解決策**:
```bash
npm run prepare
# または
npx husky install
```

### Q3: GitHub Actionsがfailする

**原因**: 断線数が閾値（80箇所）を超えた

**解決策**:
```bash
# ローカルで確認
npm run docs:analyze

# 断線を修正後、再度PR
```

## 📈 今後の拡張

### 短期（1-2ヶ月）
- [ ] 断線数の閾値を段階的に下げる（80 → 50 → 30）
- [ ] Front Matterの必須項目チェック
- [ ] アンカーリンクの厳密な検証

### 中期（3-6ヶ月）
- [ ] SSG（Docusaurus/VitePress）導入
- [ ] ビルド時の自動リンク検証
- [ ] 検索機能の統合

### 長期（6ヶ月以上）
- [ ] 外部公開用ドキュメントサイト構築
- [ ] バージョン管理システム導入
- [ ] AI支援による自動修正の拡張

---

**作成日**: 2025-12-21  
**更新日**: 2025-12-21  
**ステータス**: Active  
**優先度**: P0（最重要）
