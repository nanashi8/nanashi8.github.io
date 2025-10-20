# SimpleWord ドキュメントインデックス

**最終更新**: 2025-10-25  
**プロジェクト**: SimpleWord v2.0

このドキュメントは、SimpleWordプロジェクトのすべてのドキュメントへの索引です。

---

## 📚 ドキュメント体系

```
docs/
├── COMPREHENSIVE_SPECIFICATION.md    # ★ 包括的仕様書（最重要）
├── CUSTOM_INSTRUCTIONS.md            # ★ カスタムインストラクション
├── PROMPT_TEMPLATES.md               # ★ プロンプトテンプレート集
├── DOCUMENT_INDEX.md                 # このファイル
├── CONTAMINATION_RECOVERY_SUMMARY_20251024.md
├── ERROR_FIX_IMPROVEMENT_REPORT_20251023.md
├── FILE_CONTAMINATION_RECOVERY_20251024.md
└── COMPLETION_SUMMARY_20251023.md

ルートディレクトリ/
├── README.md                         # プロジェクトREADME
├── ADAPTIVE_LEARNING_GUIDE.md        # 適応型学習ガイド
├── DEPRECATION_GUIDE.md              # 非推奨構文対策
├── TEST_GUIDE.md                     # テストガイド
├── REPAIR_REPORT.md                  # 修復レポート
└── README_RECOVERED.md               # 復旧版README

.copilot/
├── README.md                         # AI作業ガイド
├── structure-map.md                  # アーキテクチャマップ
├── quick-ref.md                      # 実装パターン集
├── changelog.md                      # 変更履歴
├── deprecated-patterns.md            # 非推奨パターン一覧
├── components/                       # コンポーネント仕様
└── prompts/                          # プロンプトテンプレート

SimpleWord/docs/仕様書/
├── 00_編集ガイド.md
├── 01_クイズ機能_仕様書.md
├── 02_出題設定_仕様書.md
├── 03_問題集管理_CSV_仕様書.md
├── 04_ナビゲーター機能_仕様書.md
├── 05_成績表示_仕様書.md
├── 06_IDマップ管理_仕様書.md
├── 07_CSV編集_仕様書.md
├── 08_外観_仕様書.md
├── 09_出題ロジック_仕様書.md
└── 99_ファイル索引.md
```

---

## 🎯 目的別ドキュメントガイド

### 新規参加者・プロジェクト理解

最初に読むべきドキュメント：

1. **README.md** - プロジェクト概要
2. **docs/COMPREHENSIVE_SPECIFICATION.md** - 包括的仕様書（必読）
3. **.copilot/structure-map.md** - アーキテクチャマップ
4. **SimpleWord/docs/仕様書/00_編集ガイド.md** - 編集ガイド

### 機能開発

機能開発時に参照すべきドキュメント：

1. **docs/CUSTOM_INSTRUCTIONS.md** - コーディング規約
2. **docs/PROMPT_TEMPLATES.md** - プロンプトテンプレート
3. **.copilot/quick-ref.md** - 実装パターン集
4. **該当する機能の仕様書** - SimpleWord/docs/仕様書/

### バグ修正

バグ修正時に参照すべきドキュメント：

1. **docs/COMPREHENSIVE_SPECIFICATION.md** - 期待される動作の確認
2. **.copilot/deprecated-patterns.md** - 非推奨パターンの確認
3. **DEPRECATION_GUIDE.md** - 非推奨構文対策
4. **該当する機能の仕様書** - 詳細な仕様の確認

### テスト作成

テスト作成時に参照すべきドキュメント：

1. **TEST_GUIDE.md** - テストガイド
2. **docs/COMPREHENSIVE_SPECIFICATION.md** - テスト戦略
3. **docs/PROMPT_TEMPLATES.md** - テスト作成プロンプト

### ドキュメント更新

ドキュメント更新時の優先順位：

1. **.copilot/changelog.md** - 変更履歴（最優先）
2. **docs/COMPREHENSIVE_SPECIFICATION.md** - 包括的仕様書
3. **該当する機能の仕様書** - 機能別詳細仕様
4. **.copilot/quick-ref.md** - 実装パターン集

---

## 📖 主要ドキュメント詳細

### docs/COMPREHENSIVE_SPECIFICATION.md

**最重要ドキュメント**: プロジェクト全体の包括的仕様書

**内容**:
- プロジェクト概要
- アーキテクチャ設計
- 主要機能の詳細
- データモデル仕様
- 学習アルゴリズムの詳細
- ファイル構成
- API仕様
- UI/UX仕様
- データ永続化
- テスト戦略

**対象者**: すべての開発者・編集者

**更新頻度**: 高（機能追加・変更時に必ず更新）

---

### docs/CUSTOM_INSTRUCTIONS.md

**AIとの協働作業のための指示書**

**内容**:
- プロジェクト概要
- コーディング規約
- アーキテクチャ原則
- プロジェクト構造
- 重要な実装パターン
- 非推奨パターンの回避
- ファイル編集時の注意事項
- 典型的なタスクの実行手順
- テスト戦略
- トラブルシューティング

**対象者**: AIアシスタント（GitHub Copilot等）を使用する開発者

**更新頻度**: 中（アーキテクチャ変更時、規約変更時）

---

### docs/PROMPT_TEMPLATES.md

**AIへの依頼テンプレート集**

**内容**:
- 機能追加のプロンプト
- バグ修正のプロンプト
- リファクタリングのプロンプト
- ドキュメント更新のプロンプト
- テスト作成のプロンプト
- パフォーマンス改善のプロンプト
- UI/UX改善のプロンプト
- プロンプト使用のコツ

**対象者**: AIアシスタントを使用する開発者

**更新頻度**: 低（新しいパターンが確立された時）

---

### ADAPTIVE_LEARNING_GUIDE.md

**適応型学習システムの実装ガイド**

**内容**:
- 記憶定着段階モデル
- 記憶定着度追跡
- 学習モード別出題戦略
- 記憶進捗の視覚化
- QuizViewへの統合
- 技術的な詳細
- 今後の拡張案

**対象者**: 学習アルゴリズムを理解・変更する開発者

**更新頻度**: 中（アルゴリズム変更時）

---

### DEPRECATION_GUIDE.md

**非推奨構文対策ガイド**

**内容**:
- 実装された対策一覧
- セットアップ手順
- 使用方法
- 現在の非推奨パターン
- トラブルシューティング
- 定期メンテナンス

**対象者**: すべての開発者

**更新頻度**: 中（新しいiOSバージョンリリース時）

---

### TEST_GUIDE.md

**テスト戦略とガイドライン**

**内容**:
- ユニットテストの方針
- UIテストの方針
- テスト環境のセットアップ
- テストカバレッジ目標
- テスト実行方法

**対象者**: テストを作成・実行する開発者

**更新頻度**: 低（テスト方針変更時）

---

### .copilot/structure-map.md

**アーキテクチャマップ**

**内容**:
- ディレクトリ構造
- 主要コンポーネントの関係
- データフロー
- 依存関係

**対象者**: アーキテクチャを理解する必要がある開発者

**更新頻度**: 中（大きな構造変更時）

---

### .copilot/quick-ref.md

**実装パターン集**

**内容**:
- 頻出する実装パターン
- コードスニペット
- ベストプラクティス
- アンチパターン

**対象者**: 日常的なコーディングを行う開発者

**更新頻度**: 高（新しいパターンが確立された時）

---

### .copilot/changelog.md

**変更履歴**

**内容**:
- 時系列での変更記録
- 各変更の理由と影響
- バージョン履歴

**対象者**: プロジェクトの変更履歴を追う必要がある開発者

**更新頻度**: 最高（変更のたびに更新）

---

### SimpleWord/docs/仕様書/

**機能別詳細仕様書**

各機能の詳細な実装仕様を記述。以下のファイルから構成：

- **01_クイズ機能_仕様書.md**: QuizViewの詳細
- **02_出題設定_仕様書.md**: QuizSettingsViewの詳細
- **03_問題集管理_CSV_仕様書.md**: CSVManagerViewの詳細
- **04_ナビゲーター機能_仕様書.md**: NavigatorViewの詳細
- **05_成績表示_仕様書.md**: 成績表示機能の詳細
- **06_IDマップ管理_仕様書.md**: ID管理機能の詳細
- **07_CSV編集_仕様書.md**: CSV編集機能の詳細
- **08_外観_仕様書.md**: 外観設定の詳細
- **09_出題ロジック_仕様書.md**: 適応型学習ロジックの詳細

**対象者**: 特定の機能を編集する開発者

**更新頻度**: 高（該当機能の変更時）

---

## 🔄 ドキュメント更新フロー

### 機能追加時

```
1. 機能を実装
2. .copilot/changelog.md に記録
3. docs/COMPREHENSIVE_SPECIFICATION.md を更新
4. 該当する機能の仕様書を更新
5. 必要に応じて .copilot/quick-ref.md を更新
```

### バグ修正時

```
1. バグを修正
2. .copilot/changelog.md に記録
3. 必要に応じて仕様書を更新（仕様の誤記があった場合）
```

### リファクタリング時

```
1. リファクタリングを実行
2. .copilot/changelog.md に記録
3. .copilot/structure-map.md を更新（構造変更の場合）
4. docs/COMPREHENSIVE_SPECIFICATION.md のファイル構成を更新
```

### アーキテクチャ変更時

```
1. アーキテクチャを変更
2. .copilot/changelog.md に記録
3. docs/COMPREHENSIVE_SPECIFICATION.md を大幅更新
4. .copilot/structure-map.md を更新
5. docs/CUSTOM_INSTRUCTIONS.md を更新
6. 関連する機能の仕様書をすべて更新
```

---

## 📝 ドキュメント作成・更新のガイドライン

### 1. 常に日本語で記述

すべてのドキュメントは日本語で記述します。コード例は除く。

### 2. マークダウン形式

- 見出しは `#` で階層化
- コードブロックは ` ```言語名 ` で囲む
- リストは `-` または `1.` を使用
- 強調は `**太字**` または `*斜体*`

### 3. メタ情報を含める

各ドキュメントの冒頭に以下を記載：

```markdown
# タイトル

**最終更新**: YYYY-MM-DD
**バージョン**: X.X
**対象者**: 誰が読むべきか
```

### 4. 目次を含める（長いドキュメント）

長いドキュメント（500行以上）には目次を含める。

### 5. コード例は動作確認済みのものを

コード例は必ず動作確認してから記載。

### 6. 参考資料へのリンク

関連するドキュメントへは相対パスでリンク。

```markdown
詳細は [包括的仕様書](COMPREHENSIVE_SPECIFICATION.md) を参照。
```

---

## 🔍 ドキュメント検索Tips

### ファイル名で検索

```bash
find . -name "*SPEC*.md"
find . -name "*仕様書*.md"
```

### 内容で検索

```bash
# AdaptiveSchedulerに関する記述を検索
grep -r "AdaptiveScheduler" docs/

# 特定の機能に関する記述を検索
grep -r "クイズ機能" docs/
```

### VSCode検索

- `⌘ + Shift + F` で全体検索
- `docs/` ディレクトリに絞って検索

---

## ❓ よくある質問

### Q: どのドキュメントから読めばいい？

**A**: 以下の順序で読むことを推奨：

1. README.md（プロジェクト概要）
2. docs/COMPREHENSIVE_SPECIFICATION.md（包括的仕様書）
3. .copilot/structure-map.md（アーキテクチャ）
4. 興味のある機能の仕様書

### Q: ドキュメントが古い場合は？

**A**: 以下の優先順位で判断：

1. 実装コード（最も正確）
2. docs/COMPREHENSIVE_SPECIFICATION.md（公式仕様）
3. 機能別仕様書
4. その他のドキュメント

矛盾がある場合は、ドキュメントを更新してください。

### Q: 新しいドキュメントを追加したい場合は？

**A**: 以下の手順で追加：

1. 適切な場所に配置（docs/ または .copilot/）
2. このDOCUMENT_INDEX.mdに追加
3. .copilot/changelog.mdに記録
4. 関連ドキュメントからリンク

### Q: ドキュメントの更新頻度は？

**A**: 

- **高頻度**: changelog.md、機能別仕様書
- **中頻度**: COMPREHENSIVE_SPECIFICATION.md、structure-map.md
- **低頻度**: CUSTOM_INSTRUCTIONS.md、PROMPT_TEMPLATES.md

変更があった際は、該当するドキュメントを必ず更新してください。

---

## 🎯 まとめ

### ドキュメント体系の特徴

1. **階層的**: プロジェクト全体 → 機能別 → 詳細
2. **目的別**: 理解・開発・保守・AI協働
3. **最新性重視**: 変更のたびに更新
4. **検索可能**: 明確な命名とリンク

### ドキュメント活用のベストプラクティス

1. **まず検索**: 似たような内容がないか確認
2. **複数参照**: 1つのドキュメントだけでなく関連文書も確認
3. **更新を忘れずに**: コード変更時はドキュメントも更新
4. **質問を記録**: よくある質問をFAQに追加

---

**最終更新**: 2025-10-25  
**バージョン**: 2.0  
**メンテナ**: GitHub Copilot
