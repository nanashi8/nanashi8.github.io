# コードレビュープロンプト

コード生成・修正後に必ず実行するレビュー手順です。

---

## 📋 必須チェックリスト

### 1. 非推奨API・構文のチェック

- [ ] `onChange(of:) { _ in }` を使用していない
- [ ] `onChange(of:) { newValue in }` を使用していない
- [ ] iOS 17の新しい構文 `onChange(of:) { }` または `onChange(of:) { old, new in }` を使用
- [ ] 他の非推奨APIを使用していない（`.copilot/deprecated-patterns.md` を参照）

### 2. 構文・スタイルのチェック

- [ ] インデントはスペース4つ
- [ ] 命名は説明的で理解しやすい
- [ ] 日本語コメントで意図を補足している
- [ ] Swift公式ガイドに準拠している

### 3. アーキテクチャのチェック

- [ ] Feature-First / Vertical Slice Architecture に従っている
- [ ] 責務分離ができている（View / Model / Store / Service）
- [ ] 過度なラッパー・多段継承を避けている
- [ ] 既存の設計・パッケージを優先利用している

### 4. iOS互換性のチェック

- [ ] Deployment Target（iOS 15.0）に対応している
- [ ] iOS 15でサポートされていないAPIを使用していない
- [ ] 必要に応じて`@available`属性を使用している

### 5. パフォーマンスのチェック

- [ ] 不要な`GeometryReader`を使用していない
- [ ] 重い処理をメインスレッドでブロックしていない
- [ ] メモリリークの可能性がない

---

## 🔍 自動検証コマンド

### ビルド警告の確認
```bash
cd /Users/yuichinakamura/Documents/20251006_002/SimpleWord
xcodebuild -project SimpleWord.xcodeproj -scheme SimpleWord \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  clean build 2>&1 | grep -i "deprecated"
```

### 非推奨パターンの検索
```bash
# onChange の古い構文を検索
grep -r "\.onChange(of:.*) { _ in" SimpleWord/
grep -r "\.onChange(of:.*) { \w\+ in" SimpleWord/

# NavigationView の使用箇所を検索
grep -r "NavigationView" SimpleWord/
```

### エラーチェック
Xcodeで開いて、以下を確認：
1. Build Issues（⌘+B でビルド）
2. Runtime Issues（シミュレータで実行）
3. Warnings（Issue Navigatorで確認）

---

## 🛠️ 修正方法

### onChange の修正
```swift
// ❌ 修正前
.onChange(of: value) { _ in
    doSomething()
}

// ✅ 修正後
.onChange(of: value) {
    doSomething()
}
```

### NavigationView の修正（将来対応時）
```swift
// ❌ 修正前
NavigationView {
    // コンテンツ
}

// ✅ 修正後（iOS 16+ のみ）
NavigationStack {
    // コンテンツ
}
```

---

## 📝 レビュー後のアクション

1. **`.copilot/changelog.md` に記録**
   - 変更内容
   - 修正した非推奨パターン
   - 影響範囲

2. **必要に応じて `.copilot/deprecated-patterns.md` を更新**
   - 新しい非推奨パターンを発見した場合
   - Appleの新しいガイドラインに準拠

3. **`.copilot/structure-map.md` を更新**
   - 大規模な変更の場合
   - 新しいファイルを追加した場合

---

## 🎯 優先度

### 🔴 高優先度（必ず修正）
- ビルドエラー
- iOS 17で非推奨の構文（`onChange`の古い形式など）
- メモリリーク
- クラッシュの原因

### 🟡 中優先度（計画的に修正）
- iOS 16で非推奨の構文（`NavigationView`など）
- パフォーマンス改善
- コードの可読性

### 🟢 低優先度（時間があれば修正）
- コメントの改善
- 命名の最適化
- リファクタリング

---

## 📚 参考資料

- `.copilot/deprecated-patterns.md` - 非推奨パターン一覧
- `.copilot/quick-ref.md` - 実装パターン集
- `.copilot/structure-map.md` - アーキテクチャ全体像
- `docs/仕様書/` - 詳細仕様

---

## 💡 Tips

### レビューを効率化するには
1. **小さな単位でレビュー**: 大きな変更は複数回に分けてレビュー
2. **自動化を活用**: SwiftLintなどのツールを導入
3. **定期的なチェック**: 週1回は全体をスキャン

### よくある間違い
1. `onChange`の古い構文を使ってしまう
2. `@EnvironmentObject`の引き継ぎを忘れる
3. アニメーションの`value:`パラメータを忘れる
4. Deployment Targetを超えたAPIを使用してしまう

---

最終更新: 2025年10月19日
