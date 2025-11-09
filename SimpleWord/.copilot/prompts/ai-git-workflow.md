# AI統合Gitワークフロー

**作成日**: 2025年10月19日  
**対象**: すべての開発作業（機能追加、バグ修正、リファクタリング）

---

## 📋 概要

AIが自動的にGit操作を行うことで、開発者はコードに集中できます。
各作業ステップで自動的にチェックポイントを作成し、問題発生時は即座にロールバックします。

---

## 🎯 AIの自動実行内容

### 作業開始時
1. ✅ **Gitブランチ作成**: 作業用の独立した環境を自動作成
2. ✅ **初期コミット**: 作業開始のマーカーを記録

### 各ステップで
3. ✅ **ファイル変更**: 指示された作業を実行
4. ✅ **ビルド確認**: `xcodebuild clean build` で確認
5. ✅ **テスト実行**: `xcodebuild test` で確認（存在する場合）
6. ✅ **自動コミット**: 成功したら `git commit` でチェックポイント作成

### 問題発生時
7. ✅ **自動ロールバック**: `git reset --hard HEAD~1` で前の状態に復元
8. ✅ **原因分析**: 何が問題だったかを報告
9. ✅ **代替案提示**: 別のアプローチを提案

### 作業完了時
10. ✅ **changelog更新**: `.copilot/changelog.md` に記録
11. ✅ **バージョンタグ**: 変更規模に応じたタグを作成
12. ✅ **完了報告**: 実施内容と次のバージョン番号を報告

---

## 🔧 実装パターン

### パターン1: 小規模な変更

```bash
# ユーザー指示
「QuizView.swift のコメントを追加してください。Git統合ワークフローで」

# AI実行
git checkout -b feature-add-comments-20251019
git commit --allow-empty -m "開始: コメント追加"

# ファイル変更
# ...

git add SimpleWord/QuizView.swift
xcodebuild clean build -scheme SimpleWord 2>&1 | tail -5
# ✅ BUILD SUCCEEDED

git commit -m "✨ 追加: QuizView.swiftにコメント追加

- 主要メソッドに日本語コメント追加
- 責務を明確化

ビルド: ✅ 成功
影響範囲: QuizView.swift のみ"

# ユーザーに報告
「✅ 完了しました。
ブランチ: feature-add-comments-20251019
コミット: a1b2c3d
mainにマージしますか？」
```

---

### パターン2: 大規模リファクタリング

```bash
# ユーザー指示
「.copilot/prompts/large-scale-refactoring.md をGit統合ワークフローで実行」

# AI実行
git checkout -b refactor-quiz-view-20251019
git commit --allow-empty -m "開始: QuizViewリファクタリング"

# Phase 1
# QuizEngine.swift 作成
git add SimpleWord/Features/Quiz/QuizEngine.swift
xcodebuild clean build -scheme SimpleWord 2>&1 | tail -5
# ✅ BUILD SUCCEEDED

git commit -m "✅ Phase1完了: QuizEngineスケルトン作成

- QuizEngine.swift を作成
- 最小限の実装（print文のみ）
- Xcodeプロジェクトに追加

ビルド: ✅ 成功
テスト: ✅ 全て通過 (0 failures)
次のステップ: Phase 1, Step 1.2"

# Phase 2
# QuizView.swift に統合
git add SimpleWord/QuizView.swift
xcodebuild clean build -scheme SimpleWord 2>&1 | tail -5
# ❌ BUILD FAILED

# 自動ロールバック
git reset --hard HEAD~1

# ユーザーに報告
「⚠️ Phase 2でビルドエラーが発生しました。
自動的にPhase 1に戻しました（5秒）。

エラー内容:
- QuizEngine.start() のシグネチャ不一致

提案:
- QuizEngine.start() の引数を確認してから再試行
- または、より小さな単位で統合（onAppear のみ先に追加）

どちらのアプローチで進めますか？」
```

---

### パターン3: 実験的な変更

```bash
# ユーザー指示
「アニメーション速度を2倍にしてみてください。気に入らなければ元に戻します」

# AI実行
git checkout -b experiment-animation-speed
git commit --allow-empty -m "実験: アニメーション速度変更"

# ファイル変更
git add SimpleWord/QuizView.swift
xcodebuild clean build -scheme SimpleWord 2>&1 | tail -5
# ✅ BUILD SUCCEEDED

git commit -m "🧪 実験: アニメーション速度2倍

- duration: 0.6 → 0.3
- Line 450を変更

ビルド: ✅ 成功
動作: 未確認（ユーザー確認待ち）"

# ユーザーに報告
「✅ 実験完了しました。
シミュレータで確認してください。

気に入らなければ：
「元に戻して」→ 5秒で復旧
気に入れば：
「mainにマージして」→ 本採用」
```

---

## 📝 自動コミットメッセージフォーマット

### プレフィックス（絵文字）

| 種別 | 絵文字 | 例 |
|-----|-------|-----|
| 新機能 | ✨ | `✨ 追加: クイズ結果保存機能` |
| バグ修正 | 🐛 | `🐛 修正: アニメーション二重発火` |
| リファクタリング | ♻️ | `♻️ リファクタ: QuizEngine抽出` |
| ドキュメント | 📝 | `📝 ドキュメント: README更新` |
| パフォーマンス | ⚡️ | `⚡️ 改善: 出題速度30%向上` |
| テスト | ✅ | `✅ テスト: QuizView単体テスト追加` |
| 実験 | 🧪 | `🧪 実験: 新しいUI試作` |
| ロールバック | ⏪ | `⏪ ロールバック: Phase2 → Phase1` |

### メッセージ構造

```
<絵文字> <種別>: <簡潔な説明>

<詳細な説明（箇条書き）>
- 変更内容1
- 変更内容2

ビルド: ✅/❌
テスト: ✅/❌ (X failures)
影響範囲: <ファイル名>
```

**例:**

```
✨ 追加: 合格数の光るエフェクト

- 合格数更新時にスプリングアニメーション追加
- scaleEffect: 1.0 → 1.12
- 色変更: デフォルト → ゴールド
- 1.2秒後に元に戻る

ビルド: ✅ 成功
テスト: ✅ 全て通過 (0 failures)
影響範囲: QuizStatisticsView.swift
```

---

## 🚨 エラー時の自動対応フロー

### ケース1: ビルドエラー

```bash
# ビルド失敗を検出
xcodebuild clean build 2>&1 | grep "error:"

# 自動ロールバック
git reset --hard HEAD~1

# ユーザーに報告
「⚠️ ビルドエラーが発生しました。自動的に前の状態に戻しました（5秒）。

エラー内容:
- Line 450: Use of undeclared identifier 'quizEngine'

原因:
- QuizEngine プロパティの宣言が不足

提案:
- QuizEngine プロパティを追加してから再試行
- または、段階的に統合（プロパティ追加 → 初期化 → 使用）

どちらのアプローチで進めますか？」
```

### ケース2: テスト失敗

```bash
# テスト失敗を検出
xcodebuild test 2>&1 | grep "failed"

# 自動ロールバック
git reset --hard HEAD~1

# ユーザーに報告
「⚠️ テストが失敗しました。自動的に前の状態に戻しました（5秒）。

失敗したテスト:
- testQuizEngineIntegration: Expected 4 choices, got 0

原因:
- QuizEngine.generateChoices() が空の配列を返している

提案:
- QuizEngine の選択肢生成ロジックを確認
- または、テストを一時的にスキップして先に進む

どちらにしますか？」
```

### ケース3: 実行時エラー（ユーザー報告）

```bash
# ユーザー: 「動きません」

# ログ確認を提案
「実行時エラーの可能性があります。以下を確認させてください:

1. Xcodeのコンソールにエラーが表示されていますか？
2. どの画面で問題が起きましたか？
3. 具体的にどの操作で問題が発生しましたか？

または、即座にロールバックして前の安定版に戻しますか？」

# ユーザー: 「戻してください」

git reset --hard HEAD~1
xcodebuild clean build 2>&1 | tail -5
# ✅ BUILD SUCCEEDED

「✅ 前の安定版に戻しました。
現在の状態: <前回のコミットメッセージ>
コミット: a1b2c3d

問題を分析してから、別のアプローチで再挑戦します。」
```

---

## 📊 ブランチ命名規則

### 機能追加
```
feature-<機能名>-<日付>
例: feature-quiz-save-20251019
```

### バグ修正
```
fix-<問題名>-<日付>
例: fix-double-animation-20251019
```

### リファクタリング
```
refactor-<対象>-<日付>
例: refactor-quiz-view-20251019
```

### 実験
```
experiment-<内容>-<日付>
例: experiment-animation-speed-20251019
```

---

## 🎯 マージ戦略

### 小規模な変更（1-2コミット）
```bash
# Fast-forward merge
git checkout main
git merge feature-add-comments-20251019
git push origin main
git branch -d feature-add-comments-20251019
```

### 大規模な変更（複数コミット）
```bash
# Squash merge（履歴を整理）
git checkout main
git merge --squash refactor-quiz-view-20251019
git commit -m "♻️ リファクタ: QuizView出題ロジック抽出（Phase1-3完了）"
git push origin main
git branch -d refactor-quiz-view-20251019
```

### 実験（不採用）
```bash
# ブランチを削除（マージしない）
git branch -D experiment-animation-speed
```

---

## ✅ チェックリスト（AIが自動確認）

### 作業開始時
- [ ] Gitの状態確認（`git status`）
- [ ] ブランチ作成（`git checkout -b <name>`）
- [ ] 初期コミット（`git commit --allow-empty`）

### 各ステップで
- [ ] ファイル変更実施
- [ ] ビルド確認（`xcodebuild clean build`）
- [ ] テスト実行（`xcodebuild test`）
- [ ] Git add（`git add .`）
- [ ] コミット（`git commit -m "..."`）
- [ ] ユーザーに進捗報告

### エラー発生時
- [ ] エラー内容をログに記録
- [ ] 自動ロールバック（`git reset --hard HEAD~1`）
- [ ] ビルド確認（元の状態に戻ったか）
- [ ] 原因分析
- [ ] 代替案提示

### 作業完了時
- [ ] changelog.md 更新
- [ ] バージョンタグ作成（該当する場合）
- [ ] 完了報告（コミットID、ブランチ名）
- [ ] マージ確認（「mainにマージしますか？」）

---

## 🔧 設定ファイル（オプション）

### .gitignore の推奨追加項目

```
# Xcode
*.xcuserstate
*.xcworkspace/xcuserdata/
DerivedData/

# Swift
.build/

# AI作業用の一時ファイル
.copilot/tmp/
*.backup.*
```

---

## 📚 関連ドキュメント

- `.copilot/prompts/version-management.md` - バージョン管理ルール
- `.copilot/prompts/large-scale-refactoring.md` - 大規模リファクタリング手順
- `参考資料/大規模リファクタリング実現方策.md` - 詳細な手順書
- `参考資料/リファクタリング失敗分析_20251019.md` - 失敗から学んだ教訓

---

## 💡 使用例

### 例1: 新機能追加（小規模）

**ユーザー指示:**
```
「クイズ結果を保存する機能を追加してください。Git統合ワークフローで」
```

**AI実行:**
1. ブランチ作成: `feature-quiz-save-20251019`
2. QuizResultStore.swift 作成 → ビルド → コミット
3. QuizView.swift に統合 → ビルド → コミット
4. テスト作成 → ビルド → テスト → コミット
5. changelog.md 更新
6. バージョンタグ: v0.2.0
7. 完了報告

---

### 例2: バグ修正（小規模）

**ユーザー指示:**
```
「アニメーションが2回発火する問題を修正してください」
```

**AI実行:**
1. ブランチ作成: `fix-double-animation-20251019`
2. 原因特定（didSet と willSet の二重呼び出し）
3. QuizView.swift 修正 → ビルド → コミット
4. 動作確認の依頼
5. changelog.md 更新
6. バージョンタグ: v0.1.1
7. 完了報告

---

### 例3: 大規模リファクタリング

**ユーザー指示:**
```
「.copilot/prompts/large-scale-refactoring.md をGit統合ワークフローで実行してください」
```

**AI実行:**
1. ブランチ作成: `refactor-quiz-view-20251019`
2. 事前準備（テスト作成、依存関係マップ） → コミット
3. Phase 1, Step 1.1 → ビルド → コミット
4. Phase 1, Step 1.2 → ビルド → コミット
5. ...各ステップで自動的にビルド・テスト・コミット
6. エラー発生時は自動ロールバック
7. 全Phase完了後、changelog.md 更新
8. バージョンタグ: v1.0.0
9. 完了報告

---

## 🎓 まとめ

**Git統合ワークフローの本質:**
- **AIが自動的にGit操作**（開発者はコードに集中）
- **各ステップでチェックポイント**（いつでもロールバック可能）
- **問題発生時は即座に復旧**（5秒で元に戻る）

**開発者の負担:**
- Gitコマンドを覚える必要なし
- 自然言語で指示するだけ
- 「元に戻して」で5秒復旧

**AIの責任:**
- ブランチ作成、コミット、ロールバックをすべて自動実行
- ビルド・テスト確認を必ず実施
- 問題発生時は原因分析と代替案提示
