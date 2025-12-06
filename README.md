# 英語学習アプリ

[![CSS品質チェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![ビルドチェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)

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

# システム健康診断
npm run health-check
```

## CSV形式

quiz-app互換の7列形式（**10カテゴリシステム**）:
```csv
語句,読み,意味,語源等解説,関連語,関連分野,難易度
apple,アˊップル,りんご,古英語の "æppel" が語源。,"fruit(フルート): 果物, pear(ペˊア): 洋なし",食・健康,初級
```

### 10個の正式カテゴリ(厳密一致必須)

1. 言語基本
1. 学校・学習
1. 日常生活
1. 人・社会
1. 自然・環境
1. 食・健康
1. 運動・娯楽
1. 場所・移動
1. 時間・数量
1. 科学・技術

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

### 必読ガイドライン（2025-12-02更新）

- **[CSS開発ガイドライン](docs/CSS_DEVELOPMENT_GUIDELINES.md)** - BEM命名規約、CSS変数使用、重複禁止ルール
- **[TypeScript/React開発ガイドライン](docs/TYPESCRIPT_DEVELOPMENT_GUIDELINES.md)** - コンポーネント設計、型定義、状態管理
- **[品質管理パイプライン](docs/QUALITY_PIPELINE.md)** - テスト戦略、Git Hooks、CI/CD、品質基準

### その他ドキュメント

- [UI開発ガイドライン](docs/UI_DEVELOPMENT_GUIDELINES.md) - UI変更時の必須要件とベストプラクティス
- [長文読解パッセージガイド](docs/READING_PASSAGES_GUIDE.md) - パッセージ生成システムの概要
- [VS Code Simple Browser ガイド](docs/VS_CODE_SIMPLE_BROWSER_GUIDE.md) - 開発環境での表示確認方法

### AI開発アシスタント向け

- [開発指示書](.aitk/instructions/development-guidelines.instructions.md) - GitHub Copilot等AI支援用の統合ガイド

## コード品質管理

### システム健康診断

定期的にコードベースの健全性をチェックできます：

```bash
npm run health-check
```

**診断項目:**
- localStorage キーの一貫性
- 重複コンポーネント/関数の検出
- useEffect 依存配列の警告
- 未使用変数のチェック
- CSS クラスの重複
- デバッグコード残留チェック
- 型定義の重複
- 大きすぎるファイルの検出
- import文の整理状況

詳細レポート: [docs/quality/HEALTH_CHECK_REPORT.md](docs/quality/HEALTH_CHECK_REPORT.md)

**推奨サイクル:**
- 毎週: 軽量診断実行
- 毎月: 詳細レポート作成
- 四半期: リファクタリング実施
