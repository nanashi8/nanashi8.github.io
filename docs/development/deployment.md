---
title: 23. デプロイメント
created: 2025-11-22
updated: 2025-12-07
status: in-progress
tags: [development, ai, test]
---

# 23. デプロイメント

## 📌 概要

GitHub Pagesへの自動デプロイ手順とワークフロー。
`gh-pages`ブランチを使用した静的サイトホスティング。

## 🎯 デプロイ環境

- **ホスティング**: GitHub Pages
- **URL**: <https://nanashi8.github.io/>
- **ブランチ**: `gh-pages`（デプロイ専用）
- **ソースブランチ**: `main`

## 🚀 デプロイ手順

### 1. ローカルビルド

```bash
npm run build
```

**実行内容**:

- Viteでプロダクションビルド
- `dist/`ディレクトリに出力
- 最適化・圧縮を実行

### 2. デプロイ

```bash
npm run deploy
```

**実行内容**:

1. `npm run build`を実行
1. `gh-pages -d dist`で`dist/`を`gh-pages`ブランチにプッシュ
1. GitHub Pagesが自動的にデプロイ

## 📦 package.jsonスクリプト

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

## 🔧 Vite設定

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // GitHub Pagesのルートパス
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
```

## 🌐 GitHub Pages設定

### リポジトリ設定

1. **Settings** → **Pages**
1. **Source**: Deploy from a branch
1. **Branch**: `gh-pages` / `root`
1. **Custom domain**: なし

### ビルド設定

- ✅ GitHub Actionsは不使用（gh-pagesツールで直接デプロイ）
- ✅ Jekyll処理をスキップ（`.nojekyll`ファイル自動生成）

## 📊 ビルド成果物

### ディレクトリ構造

```
dist/
├── index.html              # エントリーポイント
├── assets/
│   ├── index-xxxxx.js      # メインJSバンドル（~580KB）
│   ├── index-xxxxx.css     # スタイル（~155KB）
│   └── scoreBoardTests-xxxxx.js  # テストコード（~6KB）
└── data/                   # 問題データ（コピー）
    ├── beginner-1.json
    ├── intermediate-1.json
    └── ...
```

### ファイルサイズ

| ファイル   | サイズ | gzip圧縮後 |
| ---------- | ------ | ---------- |
| index.js   | ~580KB | ~190KB     |
| index.css  | ~155KB | ~25KB      |
| index.html | ~0.6KB | ~0.4KB     |

## ⚠️ 注意事項

### チャンクサイズ警告

```
(!) Some chunks are larger than 500 kB after minification.
```

**現在の対応**: 警告のみ（機能に問題なし）

**将来の改善案**:

- Dynamic importでコード分割
- `manualChunks`で細かく分割

### データファイル

`public/data/`配下のファイルは自動的にコピーされる:

```typescript
// vite.config.ts
export default defineConfig({
  publicDir: 'public', // デフォルト設定
});
```

## 🔄 デプロイフロー

```mermaid
graph LR
    A[コード変更] --> B[git commit]
    B --> C[git push origin main]
    C --> D[npm run deploy]
    D --> E[ビルド実行]
    E --> F[dist/生成]
    F --> G[gh-pagesブランチにプッシュ]
    G --> H[GitHub Pages自動デプロイ]
    H --> I[本番反映完了]
```

## 🕐 デプロイ時間

- **ビルド時間**: 約1.5秒
- **アップロード時間**: 約3-5秒
- **GitHub Pages反映**: 約30秒〜2分

**合計**: 約1〜3分で本番反映

## 🔍 デプロイ確認

### 1. ローカルプレビュー

```bash
npm run preview
```

本番ビルドをローカルで確認（<http://localhost:4173/>）

### 2. 本番確認

デプロイ後、以下を確認:

- [ ] <https://nanashi8.github.io/> にアクセス可能
- [ ] 和訳・スペル・長文タブが動作
- [ ] データ読み込み成功
- [ ] ダークモード切り替え可能
- [ ] 統計データ表示正常

## 🐛 トラブルシューティング

### デプロイ失敗

**症状**: `npm run deploy`でエラー

**確認事項**:

1. `gh-pages`パッケージがインストールされているか
1. GitHubにプッシュ権限があるか
1. `dist/`ディレクトリが生成されているか

```bash
# gh-pagesの再インストール
npm install --save-dev gh-pages

# dist/の手動削除と再ビルド
rm -rf dist/
npm run build
npm run deploy
```

### 404エラー

**症状**: デプロイ後に404 Not Found

**原因**: `base`設定が誤っている

**解決**:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/', // サブディレクトリの場合は '/repo-name/'
});
```

### データ読み込みエラー

**症状**: JSONファイルが読み込めない

**確認事項**:

1. `public/data/`にファイルが存在するか
1. ファイル名が正しいか
1. ブラウザコンソールでエラー確認

## 🔐 環境変数

本番環境用の設定:

```bash
# .env.production
VITE_APP_ENV=production
VITE_API_URL=https://api.example.com
```

## 📈 デプロイ履歴

最近のデプロイ:

```
2025-11-22: ドキュメント整理、エラー解消
2025-11-17: AIコメント機能実装
2025-11-15: スコアボード改善
2025-11-12: 長文読解機能追加
2025-11-10: AI機能7種類実装
```

## 🚀 CI/CDの検討

現在は手動デプロイだが、将来的にGitHub Actionsでの自動化を検討:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 📝 関連ドキュメント

- [22-開発環境セットアップ](./22-development-setup.md)
- [24-テスト戦略](./24-testing-strategy.md)
- [01-プロジェクト概要](./01-project-overview.md)
