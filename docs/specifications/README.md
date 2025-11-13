# 英単語クイズアプリ - 仕様書

## 📚 ドキュメント構成

本ディレクトリには、英単語クイズアプリの機能復元・保守のための仕様書が格納されています。

### 仕様書一覧

1. **[00-overview.md](./00-overview.md)** - システム全体概要
2. **[01-translation-quiz.md](./01-translation-quiz.md)** - 和訳タブ仕様
3. **[02-spelling-quiz.md](./02-spelling-quiz.md)** - スペルタブ仕様
4. **[03-reading-comprehension.md](./03-reading-comprehension.md)** - 長文タブ仕様
5. **[04-question-creator.md](./04-question-creator.md)** - 問題作成タブ仕様
6. **[05-data-structures.md](./05-data-structures.md)** - データ構造仕様
7. **[06-styling.md](./06-styling.md)** - スタイリング仕様
8. **[07-high-school-vocabulary.md](./07-high-school-vocabulary.md)** - 高校受験英単語集作成仕様 🆕

### 参考資料

- **[../references/](../references/)** - デプロイ手順などの参考資料

## 🎯 使用方法

### 新機能開発時
1. 該当する仕様書を参照
2. データ構造・UIコンポーネント・スタイルを確認
3. 既存機能との整合性を保ちながら実装

### 機能復元時
1. 失われた機能の仕様書を開く
2. 「実装コード」セクションを参照
3. 必要なファイルに実装を復元

### メンテナンス時
1. 関連する仕様書を更新
2. 変更履歴に日付と変更内容を記録

## 📋 仕様書の更新ルール

- 機能追加時は該当する仕様書を更新
- 大きな変更は「変更履歴」セクションに記録
- コード例は最新の実装を反映

## 🔧 技術スタック

- **フレームワーク**: React + TypeScript + Vite
- **スタイリング**: CSS (App.css)
- **状態管理**: React useState
- **データ形式**: CSV (7列形式)

## 📱 対応環境

- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- レスポンシブデザイン対応
- モバイルデバイス対応
