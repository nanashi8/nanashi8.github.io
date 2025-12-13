# 英語学習アプリ

[![CSS品質チェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![ビルドチェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)
[![文法データ品質](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/grammar-quality-check.yml)

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

# 開発ガイドラインチェック
./scripts/check-guidelines.sh
```

### 開発ドキュメント

- [開発ガイドライン](.github/DEVELOPMENT_GUIDELINES.md) - **必読** 二重記録などの問題を防ぐための重要なガイド
- [コントリビューションガイド](.github/CONTRIBUTING.md) - Pull Requestを送る前に確認
- [進捗記録パターン](.aitk/instructions/progress-tracking-patterns.instructions.md) - 実装パターンのクイックリファレンス
- [自動化システムガイド](docs/AUTOMATION_GUIDE.md) - **AI自律実行** 自動承認・自動デプロイの仕組み

### データ品質ガイドライン

- [文法データ品質ガイドライン](docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md) - 文法問題データの品質基準と検証手順
  - 日本語フィールドは必ず英文の翻訳であること
  - 文法用語（「過去形」「現在進行形」など）は使用禁止
  - 自動検証ツールと品質メトリクス

### コンテンツ品質テストシステム 🛡️

**誤検出率 0%** を達成した包括的なコンテンツ品質保証システム:

- **[コンテンツ品質テスト実装ガイド](docs/quality/CONTENT_QUALITY_TESTING.md)** - テストシステムの全容
- **[品質原則ガイド](docs/quality/CONTENT_QUALITY_PRINCIPLES.md)** - 質 > スピード、質 > 量、質 > 効率

#### 品質改善実績

**Phase 1 完了** ✅ - [完了レポート](docs/quality/PHASE_1_COMPLETION_REPORT.md)
- verbForm/fillInBlank: **367問**改善
- カバレッジ: 5% → 13% (+160%)
- テスト: 26/26 (100% パス)

**Phase 2 Step 1 完了** ✅ - [完了レポート](docs/quality/PHASE_2_STEP1_COMPLETION_REPORT.md)
- sentenceOrdering: **4,600問**改善
- カバレッジ: 13% → 18%+ (+38%)
- 実装時間: 0.5時間 (Phase 1の1/7)

**Phase 2 Step 2 完了** ✅ - [完了レポート](docs/quality/PHASE_2_STEP2_COMPLETION_REPORT.md)
- Pronunciation/Accent: **120問**検証
- 新規テスト: **30項目**作成
- データ正規化: **29問**
- 実装時間: 0.5時間

**累積効果** 🚀
- 総改善問題数: **4,996問**
- 総検証問題数: **24,669問**
- カバレッジ: 5% → 18.5%+ (+270%)
- テスト: 56/56 (100% パス維持)

- **テスト対象**: Vocabulary (4,549エントリー), Grammar (24,549+問), Translation API
- **テスト観点**: 英文法学者、翻訳者、校正者、教育専門家の4視点
- **仕様検証ガード**: テスト実装時の必須確認プロセスを強制

```bash
# コンテンツ品質テスト実行
npx vitest run tests/content/

# 特定テストのみ
npx vitest run tests/content/vocabulary-quality-validator.test.ts
npx vitest run tests/content/grammar-questions-quality.test.ts  # ✅ 26/26 tests passing
npx vitest run tests/content/translation-api-validator.test.ts
```

**Phase 1成果 (2025-12-13)**:
- ✅ **100% テストパス** (26/26 tests) - 品質妥協なし
- ✅ **367問の品質改善** - explanationに正答を明示
- ✅ **カバレッジ向上** - 5% → 13% (+160%)
- 🛠️ **自動改善ツール** - `scripts/improve-explanation-quality.py`

**テスト実装時の注意**:
- テストファイルをコミットする前に、ガードスクリプトが実データサンプルを表示
- 仕様書の確認、データ構造の理解、既存実装の確認が必須
- "カタカナ混入"等の誤検出パターンを自動警告

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
- **[品質保証システム](docs/quality/QUALITY_SYSTEM.md)** - テスト戦略、Git Hooks、CI/CD、品質基準、データ品質検証

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
