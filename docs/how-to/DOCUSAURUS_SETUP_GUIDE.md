# Docusaurus Configuration Guide

## 概要

このファイルは将来のDocusaurus導入に向けた設定ガイドです。現在は手動スクリプト（`scripts/analyze-doc-links.mjs`）とGitHub Actionsで運用中ですが、より高度な自動化のためにSSG（Static Site Generator）の導入を推奨します。

## なぜDocusaurusか？

1. **ビルド時リンク検証**: 存在しないファイルへのリンクは自動的にエラー
2. **自動パス解決**: ファイル移動時にリンクを自動更新
3. **検索機能**: Algolia検索が標準装備
4. **バージョニング**: ドキュメントのバージョン管理が容易
5. **プラグインエコシステム**: Mermaid図表、OpenAPI仕様書など多数

## 導入手順（将来実施）

### Phase 1: セットアップ（1-2時間）

```bash
# Docusaurusプロジェクト作成
npx create-docusaurus@latest docs-site classic

# 既存docs/を移行
mv docs-site/docs docs-site/docs-backup
cp -r docs docs-site/docs

# Front Matterは既に全ファイルに追加済み
# → そのまま使用可能
```

### Phase 2: 設定調整（1時間）

```javascript
// docs-site/docusaurus.config.js
module.exports = {
  title: 'Quiz App Documentation',
  tagline: 'AI-Powered English Learning Platform',
  url: 'https://nanashi8.github.io',
  baseUrl: '/docs/',

  onBrokenLinks: 'throw', // 断線を即座に検出
  onBrokenMarkdownLinks: 'throw',

  themeConfig: {
    navbar: {
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'specifications',
          label: 'Specifications',
        },
        {
          type: 'docSidebar',
          sidebarId: 'guidelines',
          label: 'Guidelines',
        },
        {
          type: 'docSidebar',
          sidebarId: 'howto',
          label: 'How-To Guides',
        },
      ],
    },

    // 検索設定
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'quiz-app-docs',
    },
  },

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'specifications',
        path: 'docs/specifications',
        routeBasePath: 'specifications',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // 他のディレクトリも同様に設定
  ],
};
```

### Phase 3: ビルドとデプロイ（30分）

```bash
# ビルド（リンク検証も同時実行）
cd docs-site
npm run build

# ローカルプレビュー
npm run serve

# GitHub Pagesへデプロイ
GIT_USER=<your-github-username> npm run deploy
```

## 代替案: VitePress

より軽量な選択肢として、Vue.js製のVitePressも推奨：

```bash
# VitePressセットアップ
npm add -D vitepress

# 設定ファイル
# .vitepress/config.ts
export default {
  title: 'Quiz App Docs',
  description: 'AI-Powered Learning',

  themeConfig: {
    nav: [
      { text: 'Specifications', link: '/specifications/' },
      { text: 'Guidelines', link: '/guidelines/' },
    ],

    sidebar: {
      '/specifications/': [
        // 自動生成可能
      ],
    },
  },
}
```

**VitePressの利点**:

- ビルド速度が極めて速い（Vite使用）
- 設定がシンプル
- TypeScript完全サポート

## 現在の運用（Phase 0）

現在は以下のツールで運用中：

1. **手動スクリプト**: `scripts/analyze-doc-links.mjs`（679リンク追跡）
2. **GitHub Actions**: `.github/workflows/link-checker.yml`
3. **Pre-commit Hook**: `.husky/check-doc-naming`（命名規則強制）
4. **VS Code統合**: Markdownリアルタイム検証

→ **これだけでも十分機能している**が、SSG導入でさらに効率化可能

## 導入タイミング

**今すぐ導入すべきケース**:

- ドキュメントを外部公開する予定がある
- 検索機能が必要
- バージョン管理が必要（v1.0、v2.0など）

**現状維持でOKなケース**:

- 内部ドキュメントとして使用
- 現在のスクリプトで十分管理できている
- 679リンクが許容範囲内で安定している

→ **現時点では導入不要、将来の選択肢として保持**

## ベンチマーク

| プロジェクト | ファイル数 | ツール             | ビルド時間 |
| ------------ | ---------- | ------------------ | ---------- |
| Kubernetes   | ~2000      | Hugo + CI          | 3-5分      |
| React        | ~500       | Docusaurus         | 1-2分      |
| TypeScript   | ~300       | VitePress          | 10-30秒    |
| **あなた**   | **304**    | **手動スクリプト** | **5秒**    |

→ 現在の手法は**非常に効率的**

## 参考リンク

- [Docusaurus公式](https://docusaurus.io/)
- [VitePress公式](https://vitepress.dev/)
- [Diátaxis Framework](https://diataxis.fr/)
- [Algolia DocSearch](https://docsearch.algolia.com/)

## 結論

**現在のアプローチ（手動スクリプト + GitHub Actions + Pre-commit Hook）は非常に優秀**です。SSGは将来の拡張オプションとして残し、現在は既存ツールの改善に注力することを推奨します。

---

作成日: 2025-12-21  
更新日: 2025-12-21  
ステータス: Planning
