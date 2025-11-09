# SimpleWord AI Workflow Guide

最終更新: 2025年10月23日

---

## 🤖 AI自動化システムの完全ガイド

このガイドは、AIが**完全自動で作業を実行**するための仕組みをまとめたものです。

---

## 📂 プロジェクト構成（重要）

現在のフォルダ構成は **Feature-First / Vertical Slice Architecture** を採用:

```
SimpleWord/
├── App/                    # アプリケーションエントリポイント
├── Features/               # 機能別垂直分割
│   ├── Quiz/              # クイズ機能
│   └── Study/             # 適応型学習機能
├── Models/                # データモデル（Core統合予定）
├── QuizModels/            # クイズモデル（統合予定）
├── QuizComponents/        # クイズUI部品（統合予定）
├── Views/                 # ビュー（Feature統合予定）
├── Services/              # サービス層（Core統合予定）
├── Stores/                # 状態管理（Core統合予定）
├── Utils/                 # ユーティリティ（Core統合予定）
├── Persistence/           # 永続化（Core統合予定）
├── CoreData/              # CoreDataモデル
├── Resources/             # リソースファイル
├── Config/                # 設定ファイル
└── Tools/                 # ツール
```

**詳細**: `.copilot/structure-map.md`

**移行計画**: `.copilot/REFACTOR-PLAN-20251022.md`

---

## ⚡ 最重要: 自動バージョン管理

### トリガーフレーズ（これを言うだけ！）

```
✅ "バージョン管理してください"
✅ "バージョン管理して"
✅ "バージョニングしてください"
✅ "新しいバージョンを作成"
✅ "リリース準備"
✅ "ブランチを切って"
```

### AIが自動で実行する内容（全9ステップ）

1. **分析** → 変更行数、ファイル数を自動計算
2. **判定** → バージョン番号を自動決定
3. **ブランチ作成** → 命名規則に従って自動作成
4. **コミット** → 意味のあるメッセージで自動コミット
5. **タグ付け** → バージョンタグを自動作成
6. **ドキュメント生成** → `.copilot/versions/` に自動生成
7. **Changelog更新** → 変更履歴を自動追記
8. **ビルドテスト** → Xcodeビルドを自動実行
9. **レポート表示** → 完了サマリーを美しく表示

**詳細**: `.copilot/AI-TRIGGER-GUIDE.md`

---

## 📋 作業規模別ワークフロー

### 小規模変更（100行以内）
1. `.copilot/quick-ref.md` で実装パターン確認
2. コードを実装
3. 「バージョン管理してください」

### 中規模変更（新機能）
1. `.copilot/structure-map.md` で影響範囲確認
2. `.copilot/prompts/add-feature.md` の手順に従う
3. コードを実装
4. 「バージョン管理してください」

### 大規模変更（リファクタリング）
1. `.copilot/structure-map.md` で全体像把握
2. `.copilot/prompts/refactor-component.md` の手順に従う
3. 複数フェーズに分割して実装
4. 各フェーズ完了時に「バージョン管理してください」

---

## 📚 ドキュメント体系

### レベル1: クイックリファレンス
- `.copilot/quick-ref.md` - よく使う実装パターン
- `.copilot/AI-TRIGGER-GUIDE.md` - 自動化ガイド

### レベル2: アーキテクチャ
- `.copilot/structure-map.md` - 全体構造マップ
- `.copilot/changelog.md` - 変更履歴

### レベル3: 作業手順
- `.copilot/prompts/add-feature.md` - 新機能追加
- `.copilot/prompts/fix-bug.md` - バグ修正
- `.copilot/prompts/refactor-component.md` - リファクタリング
- `.copilot/prompts/auto-versioning.md` - 自動バージョン管理

### レベル4: バージョン履歴
- `.copilot/versions/v*.md` - 各バージョンの詳細

---

## 📊 バージョン判定ルール

| 変更行数 | バージョンタイプ | 例 |
|---------|----------------|-----|
| 1000行以上 | メジャー | v0.5.0 → v1.0.0 |
| 100-999行 | マイナー | v1.0.0 → v1.1.0 |
| 1-99行 | パッチ | v1.1.0 → v1.1.1 |

---

## 🌿 ブランチ命名規則

```
v{バージョン}_{タイプ}/{説明}

例:
✅ v1.2.0_feature/quizview-complete
✅ v1.2.1_bugfix/fix-crash
✅ v1.3.0_refactor/improve-performance
```

---

## 🎯 まとめ

### ユーザーがすること
```
1. コードを書く
2. 「バージョン管理してください」と言う
```

### AIがすること
```
すべて自動実行！
```

**完全自動化！ユーザーは何もする必要がありません！** 🎉
