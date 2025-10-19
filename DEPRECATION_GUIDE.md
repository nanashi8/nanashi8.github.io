# 非推奨構文対策ガイド

このドキュメントは、プロジェクトで非推奨構文を防ぐために実装された対策の使用方法を説明します。

---

## 📋 実装された対策一覧

### 1. ドキュメント（`.copilot/`）
- **`deprecated-patterns.md`**: 非推奨パターンの詳細リスト
- **`quick-ref.md`**: 実装時の即座な参照用（非推奨セクション追加済み）
- **`prompts/code-review.md`**: コードレビュー手順

### 2. 自動チェックツール
- **`.swiftlint.yml`**: SwiftLintによる静的解析
- **`.git/hooks/pre-commit`**: コミット前の自動チェック
- **`.github/workflows/code-quality.yml`**: CI/CDでの自動チェック

---

## 🚀 セットアップ手順

### SwiftLintのインストール（推奨）

```bash
# Homebrewでインストール
brew install swiftlint

# プロジェクトディレクトリで実行
cd /Users/yuichinakamura/Documents/20251006_002/SimpleWord
swiftlint
```

### Git Hooksの有効化（自動）

Git Hooksは既に設定済みです。コミット時に自動的に実行されます。

手動で実行する場合：
```bash
.git/hooks/pre-commit
```

---

## 🔍 使用方法

### コード作成前
1. `.copilot/deprecated-patterns.md` を確認
2. 非推奨パターンを避けてコーディング

### コード作成後
1. SwiftLintを実行して自動チェック：
```bash
swiftlint
```

2. 手動で非推奨構文を検索：
```bash
# onChange の古い構文を検索
grep -r "\.onChange(of:.*) { _ in" SimpleWord/

# NavigationView の使用を検索
grep -r "NavigationView" SimpleWord/
```

3. ビルドして警告を確認：
```bash
xcodebuild -project SimpleWord.xcodeproj -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  clean build 2>&1 | grep -i "deprecated"
```

### コミット時
自動的に非推奨構文がチェックされます。エラーがある場合、コミットは中止されます。

---

## ⚠️ 現在の非推奨パターン

### iOS 17以降で使用禁止

```swift
// ❌ 使用禁止
.onChange(of: value) { _ in
    // 処理
}

.onChange(of: value) { newValue in
    // 処理
}

// ✅ 正しい書き方
.onChange(of: value) {
    // 古い値が不要な場合
}

.onChange(of: value) { oldValue, newValue in
    // 古い値と新しい値が必要な場合
}
```

### iOS 16以降で推奨変更（将来対応）

```swift
// ⚠️ 非推奨（まだエラーではない）
NavigationView {
    // コンテンツ
}

// ✅ 推奨（iOS 16+）
NavigationStack {
    // コンテンツ
}
```

**注意**: プロジェクトのDeployment TargetがiOS 15.0のため、`NavigationStack`への移行はまだ行っていません。

---

## 🛠️ トラブルシューティング

### SwiftLintの警告が多すぎる場合
`.swiftlint.yml` を編集して、特定のルールを無効化できます。

### Git Hooksが動作しない場合
実行権限を確認：
```bash
chmod +x .git/hooks/pre-commit
```

### GitHub Actionsが失敗する場合
ローカルで同じチェックを実行して問題を特定：
```bash
swiftlint lint --reporter github-actions-logging
```

---

## 📚 詳細情報

- 非推奨パターンの詳細: `.copilot/deprecated-patterns.md`
- コードレビュー手順: `.copilot/prompts/code-review.md`
- 実装パターン集: `.copilot/quick-ref.md`
- 変更履歴: `.copilot/changelog.md`

---

## 🔄 定期メンテナンス

### 毎年のiOS新バージョンリリース時
1. Apple Developer Documentationで非推奨APIを確認
2. `.copilot/deprecated-patterns.md` を更新
3. `.swiftlint.yml` にルールを追加
4. プロジェクト内を検索して該当箇所を確認

### 四半期ごと
1. SwiftLintを最新版にアップデート
2. 警告レベルを見直し
3. チーム内で非推奨パターンの共有

---

最終更新: 2025年10月19日
