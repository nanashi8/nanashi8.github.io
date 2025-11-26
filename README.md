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

quiz-app互換の7列形式（**10カテゴリシステム**）:
```csv
語句,読み,意味,語源等解説,関連語,関連分野,難易度
apple,ア́ップル,りんご,古英語の "æppel" が語源。,"fruit(フルート): 果物, pear(ペ́ア): 洋なし",食・健康,初級
```

### 10個の正式カテゴリ（厳密一致必須）
1. 言語基本 2. 学校・学習 3. 日常生活 4. 人・社会 5. 自然・環境
6. 食・健康 7. 運動・娯楽 8. 場所・移動 9. 時間・数量 10. 科学・技術

詳細: [docs/19-junior-high-vocabulary.md](docs/19-junior-high-vocabulary.md)

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

## 開発ドキュメント

- [UI開発ガイドライン](docs/UI_DEVELOPMENT_GUIDELINES.md) - UI変更時の必須要件とベストプラクティス
- [長文読解パッセージガイド](docs/READING_PASSAGES_GUIDE.md) - パッセージ生成システムの概要
- [VS Code Simple Browser ガイド](docs/VS_CODE_SIMPLE_BROWSER_GUIDE.md) - 開発環境での表示確認方法
