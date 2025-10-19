---
applyTo: "**/*"
---
# SimpleWord Project Instructions

最終更新: 2025年10月19日

---

## 🎯 プロジェクト概要

語句を効率的に学習するためのクイズアプリケーション（Swift/SwiftUI）。
適応型学習、バッチ管理、視覚的フィードバックを備えた本格的な学習アプリ。

### 主要機能
- **適応型学習**: ユーザーの習熟度に応じた出題制御（WordScoreStore連携）
- **バッチ学習**: 段階的な学習進行管理、繰り返し出題
- **視覚的フィードバック**: 合格数・総出題数の光るエフェクト
- **タイマー機能**: 制限時間、カウントダウン表示
- **音声再生**: AVSpeechSynthesizerによる発音
- **自動遷移**: 回答後の自動次問題移行

### 現在のバージョン
**v1.2.0** - QuizView完全実装完了（264行）

---

## 🤖 AI自動化システム - 最重要

### ⚡ バージョン管理の完全自動化

**トリガーフレーズ**（これを言うだけで全自動実行）:
```
✅ "バージョン管理してください"
✅ "バージョン管理して"
✅ "バージョニングしてください"
```

**自動実行内容**:
1. 変更内容の分析（変更行数、ファイル数）
2. バージョン番号の自動決定（1000行以上=メジャー、100行以上=マイナー）
3. ブランチの自動作成（`v{version}_{type}/{description}`形式）
4. コミットとタグの自動作成
5. ドキュメントの自動生成
6. Changelog・Structure Mapの自動更新
7. ビルドテストの自動実行
8. 完了レポートの表示

**詳細**: `.copilot/AI-TRIGGER-GUIDE.md`

---

## 🏗️ Architecture Principles

- **Feature-First / Vertical Slice Architecture**
- **責務分離**: View / Model / Store / Service を明確に分離
- **単一実装**: 過度なラッパー・多段継承を避ける
- **既存優先**: 既存コード・パッケージを優先利用
- **実用性優先**: 容易性・可読性・保守性・拡張性を重視

---

## 📝 Swift Coding Standards

- インデントはスペース4つ
- 命名は説明的に、必要な型情報を明示
- 日本語コメントで意図を補足
- Viewファイルは項目の内容が分かる日本語コメント
- Swiftファイル（.swift）はSwift言語のみで記述

---

## 📂 AI Work Efficiency System

**作業開始前に必ず `.copilot/` ディレクトリを参照**

### 作業規模別フロー

#### 小規模変更（100行以内）
1. `.copilot/quick-ref.md` で実装パターン確認
2. 実装
3. 「バージョン管理してください」← AI自動実行

#### 中規模変更（新機能）
1. `.copilot/structure-map.md` で影響範囲確認
2. `.copilot/prompts/add-feature.md` の手順に従う
3. 実装
4. 「バージョン管理してください」← AI自動実行

#### 大規模変更（リファクタリング）
1. `.copilot/structure-map.md` で全体像把握
2. `.copilot/prompts/refactor-component.md` の手順に従う
3. フェーズ分割して実装
4. 各フェーズ完了時に「バージョン管理してください」← AI自動実行

---

## 📚 参考資料

- **AI作業ガイド**: `.copilot/README.md`
- **自動化ガイド**: `.copilot/AI-TRIGGER-GUIDE.md`
- **アーキテクチャ**: `.copilot/structure-map.md`
- **実装パターン**: `.copilot/quick-ref.md`
- **変更履歴**: `.copilot/changelog.md`

---

## 🚫 禁止事項

- `.copilot/` を参照せずに大規模変更
- `changelog.md` 更新忘れ
- `structure-map.md` との不整合放置
- 非推奨構文の使用

---

## 🎯 セッション開始時の推奨宣言

```
「.copilot/structure-map.md を確認してください」
「バージョン管理してください」← 最も重要！
```

**「バージョン管理してください」と言うだけで、すべてが自動化されています！**
