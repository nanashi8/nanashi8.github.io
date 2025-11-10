# 英単語3択クイズアプリ

TypeScript + React で構築された、インタラクティブな英単語クイズアプリケーションです。

## 特徴

- ✅ **型安全**: TypeScriptによる完全な型付け
- 📱 **モバイル最適化**: iPhone Safari対応、single-screen layout
- 📁 **CSV互換**: quiz-app互換の7列形式をサポート
- 🎯 **インタラクティブ**: リアルタイムスコア表示、3択問題
- 📝 **問題作成**: ブラウザ上で問題を作成・エクスポート可能

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## CSV形式

quiz-app互換の7列形式:
```
語句,読み,意味,語源等解説,関連語,関連分野,難易度
apple,アップル,りんご,果物の一種,fruit;banana,食べ物;果物,1
```

## デプロイ

GitHub Pagesへのデプロイ:
```bash
npm run build
# distフォルダの内容をGitHub Pagesにデプロイ
```

## 技術スタック

- React 18
- TypeScript 5
- Vite 5
- CSS Modules
