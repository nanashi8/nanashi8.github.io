# SimpleWord - AI 作業効率化ガイド

**最終更新: 2025-10-18**

## GitHub Copilot Chat Settings との連携

### 1. Copilot Instructions (Global)
**場所**: `~/.github/copilot-instructions.md` (グローバル設定)
**用途**: すべてのプロジェクトに適用される基本的なコーディング規約
**内容例**:
- コーディングスタイル（インデント、命名規則）
- 言語固有のベストプラクティス
- セキュリティガイドライン

### 2. Copilot Instructions (Current Workspace)
**場所**: `.github/instructions/CustumInstruction.instructions.md`
**用途**: このプロジェクト固有のルールと設計原則
**内容**:
- プロジェクト概要
- アーキテクチャ原則（Feature-First, 責務分離）
- Swift コーディング規約
- **`.copilot/` への参照を含める**

### 3. Custom Instructions
**用途**: セッション単位の特定タスクに対する指示
**使用例**:
- 「QuizView のリファクタリング中は `.copilot/components/` を優先参照」
- 「バグ修正時は `.copilot/changelog.md` で履歴確認」

### 4. Prompt Files
**場所**: `.copilot/prompts/` (任意)
**用途**: 繰り返し使用するタスク用のプロンプトテンプレート
**例**:
- `refactor-component.md` - コンポーネント分割用
- `add-feature.md` - 新機能追加用
- `fix-bug.md` - バグ修正用

## `.copilot/` ディレクトリ構成

```
.copilot/
├── README.md                    # このファイル（全体ガイド）
├── structure-map.md             # アーキテクチャマップ
├── quick-ref.md                 # クイックリファレンス
├── changelog.md                 # 変更履歴
├── task-template.md             # タスク分割テンプレート
├── components/                  # コンポーネント仕様書
│   ├── QuizStatisticsView.md
│   ├── QuestionCardView.md
│   ├── ChoiceCardView.md
│   ├── DontKnowCardView.md
│   └── QuizNavigationButtonsView.md
└── prompts/                     # プロンプトテンプレート（任意）
    ├── refactor-component.md
    ├── add-feature.md
    └── fix-bug.md
```

## トークン効率化戦略

### レベル1: 小規模変更（単一ファイル、100行以内）
```
1. quick-ref.md を参照
2. 直接実装
3. changelog.md に記録
```
**トークン使用量**: 低

### レベル2: 中規模変更（複数ファイル、または新機能追加）
```
1. structure-map.md で影響範囲確認
2. 関連する components/*.md を参照
3. task-template.md で段階的実装
4. changelog.md に記録
```
**トークン使用量**: 中

### レベル3: 大規模リファクタリング
```
1. structure-map.md で全体像把握
2. task-template.md で作業を分割
3. 各タスクごとに components/*.md 参照
4. 段階的に実装・検証
5. changelog.md に詳細記録
```
**トークン使用量**: 高（分割により最適化）

## AI への指示方法

### 作業開始時の基本フロー
```markdown
1. 「`.copilot/structure-map.md` を確認してください」
2. 「影響範囲を特定し、関連する `.copilot/components/` の仕様を確認してください」
3. 「`.copilot/task-template.md` に従って段階的に実装してください」
4. 「完了後、`.copilot/changelog.md` に変更を記録してください」
```

### タスク別の指示例

#### 新機能追加
```
「`.copilot/structure-map.md` で影響範囲を確認し、
新しいコンポーネント仕様を `.copilot/components/` に作成してから実装してください」
```

#### バグ修正
```
「`.copilot/changelog.md` で関連する過去の変更を確認し、
`.copilot/quick-ref.md` のパターンに従って修正してください」
```

#### リファクタリング
```
「`.copilot/structure-map.md` の分割推奨に従い、
Phase 1 から順に `.copilot/task-template.md` を使って段階的に実装してください」
```

## ファイルの更新頻度

| ファイル | 更新頻度 | 更新タイミング |
|---------|---------|--------------|
| README.md | 低 | 構成変更時 |
| structure-map.md | 低 | 大規模リファクタリング時 |
| quick-ref.md | 中 | 新パターン追加時 |
| changelog.md | 高 | 毎変更時 |
| task-template.md | 低 | ワークフロー変更時 |
| components/*.md | 中 | コンポーネント分割・変更時 |
| prompts/*.md | 低 | 新しいタスクタイプ追加時 |

## ベストプラクティス

### ✅ 推奨
- 変更前に必ず関連ファイルを確認
- 小さな変更でも changelog に記録
- 新しいパターンが出たら quick-ref に追加
- コンポーネント分割時は仕様書を先に作成

### ❌ 非推奨
- `.copilot/` を参照せずに大規模変更
- changelog の更新を忘れる
- 仕様書なしでコンポーネントを分割
- structure-map と実装の不整合を放置

## 隠しフォルダ `.copilot/` の運用と対処方法

### なぜ隠しフォルダ（ドット付き）なのか
- **メリット**: Finder で通常非表示となり、作業ツリーが散らからない
- **デメリット**: 存在を忘れやすく、ナビゲータに表示されない
- **表示方法**: Finder で `⌘ + Shift + .` を押す（隠しファイル表示の切替）

### 存在を忘れたときの問題と対処

#### 問題のシナリオ
1. `.copilot/` の存在を忘れる
2. AI が古い情報（`structure-map.md` など）を参照して誤った回答をする
3. 実際のコードと `.copilot/` 内のドキュメントが乖離している

#### 対処方法（AI に対する直接的な指示）

**最も効果的な指示**:
```
「.copilot/ 内の情報を無視して、実際のコードだけを見てください」
「structure-map.md は古いので参照しないでください」
「quick-ref.md の内容は現在のコードと矛盾しています。実装を優先してください」
```

AI は上記の指示に従い、`.copilot/` を参照せずに実際のコードベースだけを見て回答します。

### 定期的な整合性チェック（推奨運用）

#### 週次チェック（5分程度）
```bash
# 1) .copilot/ フォルダの存在確認
ls -la .copilot/

# 2) 最終更新日時を確認
stat -f "%Sm" -t "%Y-%m-%d" .copilot/changelog.md

# 3) 最新のコミット日時と比較
git log -1 --format="%cd" --date=short

# 4) 乖離が1週間以上なら更新が必要
```

#### 月次チェック（15分程度）
```bash
# 1) 実際のファイル構成と structure-map.md を比較
echo "=== 実際のファイル構成 ==="
find SimpleWord -name "*.swift" -type f | head -20

echo "=== structure-map.md の内容確認 ==="
cat .copilot/structure-map.md | grep -A 5 "コアファイル"

# 2) QuizView の行数確認（分割推奨の判断材料）
wc -l SimpleWord/QuizView.swift

# 3) changelog.md の最終エントリ確認
tail -20 .copilot/changelog.md
```

#### 矛盾を発見した場合
1. **AI に指示**: 「.copilot/structure-map.md を実際のコードに合わせて更新してください」
2. **手動更新**: 該当ファイルを直接編集
3. **記録**: `.copilot/changelog.md` に更新内容を記録

### 可視化オプション（任意）

隠しフォルダを可視化したい場合は以下の手順でリネーム可能:

```bash
# Git管理下でリネーム
git mv .copilot copilot

# プロジェクト内の参照を更新（.github/instructions/ など）
grep -R ".copilot" . --exclude-dir=.git

# コミット
git commit -m "Rename .copilot to copilot for better visibility"
```

**注意**: リネーム後は `.github/instructions/CustumInstruction.instructions.md` などの参照も更新する必要があります。

### トラブルシューティング

#### Q: `.copilot/` が見つからない
```bash
# 存在確認
ls -la | grep copilot

# Finder で表示（隠しファイル表示を有効化）
open . && echo "Finder で ⌘ + Shift + . を押してください"
```

#### Q: AI が古い情報を参照し続ける
**対処**: セッションの最初に以下を宣言する
```
「このセッションでは .copilot/ 内の情報を参照せず、
実際のコードファイルのみを信頼してください」
```

#### Q: changelog.md とコードが1ヶ月以上乖離している
**対処**: 以下のコマンドで最近の変更を確認し、changelog に追記
```bash
# 最近30日のコミット履歴を取得
git log --since="30 days ago" --pretty=format:"%h %ad %s" --date=short

# AI に changelog 更新を依頼
# 「上記のコミット履歴を .copilot/changelog.md に反映してください」
```

## メンテナンス

### 月次レビュー
- [ ] changelog から頻繁な変更箇所を特定
- [ ] structure-map の分割計画を更新
- [ ] quick-ref に新パターンを追加
- [ ] 使われていないコンポーネント仕様を削除
- [ ] **`.copilot/` とコードの整合性をチェック（新規追加）**
- [ ] **最終更新日時が1ヶ月以内であることを確認（新規追加）**

### リリース前チェック
- [ ] 全ての変更が changelog に記録されている
- [ ] structure-map が現在の実装と一致している
- [ ] コンポーネント仕様が最新である
- [ ] 不要なファイルを削除
- [ ] **`.copilot/` とコードの乖離がないことを確認（新規追加）**
