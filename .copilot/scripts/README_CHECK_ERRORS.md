# エラーチェック自動化ガイド

最終更新: 2025年10月23日

## 概要

よくあるSwiftUIエラーパターンを自動検出するスクリプト。

---

## 使用方法

### 全ファイルをチェック
```bash
cd /path/to/SimpleWord
./.copilot/scripts/check_common_errors.sh
```

### 特定のファイルをチェック
```bash
./.copilot/scripts/check_common_errors.sh SimpleWord/Views/ContentView.swift
```

### 特定のディレクトリをチェック
```bash
find SimpleWord/Views -name "*.swift" -exec ./.copilot/scripts/check_common_errors.sh {} \;
```

---

## チェック項目

### 1. NavigationLinkの環境オブジェクト
**検出内容**: NavigationLinkで環境オブジェクトが注入されていない可能性

**問題例**:
```swift
// ⚠️ 警告が出る
NavigationLink(destination: QuizView()) { ... }
```

**修正方法**:
```swift
// ✅ 正しい
NavigationLink(destination: QuizView()
    .environmentObject(store)) { ... }
```

### 2. .onReceiveの使用
**検出内容**: 無限ループのリスクがある.onReceiveの使用

**問題例**:
```swift
// ⚠️ 警告が出る
.onReceive(publisher) { _ in
    loadContent()
}
```

**修正方法**:
```swift
// ✅ 推奨
.onAppear {
    loadContent()
}
```

### 3. 非推奨の.onChange構文
**検出内容**: iOS 17で非推奨の.onChange構文

**問題例**:
```swift
// ❌ エラー
.onChange(of: value) { _ in }
```

**修正方法**:
```swift
// ✅ 正しい
.onChange(of: value) { }
```

### 4. NavigationView
**検出内容**: iOS 16以降非推奨のNavigationView

**問題例**:
```swift
// ❌ エラー
NavigationView { ... }
```

**修正方法**:
```swift
// ✅ 正しい
NavigationStack { ... }
```

### 5. @Published with didSet
**検出内容**: 無限ループのリスクがある@PublishedのdidSet

**問題例**:
```swift
// ⚠️ 警告が出る
@Published var value: String {
    didSet { updateOther() }
}
```

**修正方法**:
```swift
// ✅ 推奨
@Published var value: String

func updateValue(_ newValue: String) {
    value = newValue
    updateOther()
}
```

---

## 出力例

```
🔍 SwiftUI よくあるエラーパターンをチェック中...

📋 パターン1: NavigationLinkの環境オブジェクトチェック
⚠️  SimpleWord/Views/ContentView.swift
37:    NavigationLink(destination: QuizView()
   → 環境オブジェクトの注入を確認してください

================================
チェック完了
================================
エラー: 0
警告: 1

詳細は docs/ERROR_RESOLUTION_PROTOCOL.md を参照してください
```

---

## CI/CDへの組み込み

### GitHub Actionsの例
```yaml
- name: Check Common Errors
  run: |
    chmod +x .copilot/scripts/check_common_errors.sh
    ./.copilot/scripts/check_common_errors.sh
```

### Git Pre-commit Hookの例
```bash
#!/bin/bash
# .git/hooks/pre-commit

./.copilot/scripts/check_common_errors.sh
```

---

## カスタマイズ

スクリプトを編集して、プロジェクト固有のパターンを追加できます。

例：
```bash
# カスタムパターンの追加
echo "📋 パターン6: カスタムチェック"
while IFS= read -r file; do
    if grep -n "YOUR_PATTERN" "$file" > /dev/null 2>&1; then
        echo "⚠️  $file"
        # ...
    fi
done <<< "$FILES"
```

---

## トラブルシューティング

### スクリプトが実行できない
```bash
chmod +x .copilot/scripts/check_common_errors.sh
```

### 特定のパターンを無視したい
スクリプト内の該当セクションをコメントアウト

---

## 参考

- `docs/ERROR_RESOLUTION_PROTOCOL.md` - エラー解決の標準手順
- `.copilot/ERROR_FIX_GUIDELINES.md` - エラー修正クイックガイド
