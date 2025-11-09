# GitHub Copilot エラー修正ガイドライン

最終更新: 2025年10月23日

## 🚨 エラー修正時の必須ルール

### 1. 最初に必ず参照するドキュメント
```
docs/ERROR_RESOLUTION_PROTOCOL.md
```

### 2. 修正前の必須確認
- [ ] ファイル全体を読む（部分読み禁止）
- [ ] 環境オブジェクトの伝搬経路を確認
- [ ] 過去の類似問題を確認

### 3. 修正後の必須検証
- [ ] get_errors でエラー確認
- [ ] ビルド実行
- [ ] **実機/シミュレータで動作確認**（最重要）
- [ ] Debug Navigatorで CPU/メモリ確認

### 4. 3回で解決しない場合
- 立ち止まり、ERROR_RESOLUTION_PROTOCOL.md を再読
- アプローチを変更
- ユーザーに追加情報を求める

---

## SwiftUI 頻出エラーパターン

### パターン1: 環境オブジェクト欠落（最頻出）
```swift
// ❌ NG
NavigationLink(destination: View()) { ... }

// ✅ OK
NavigationLink(destination: View()
    .environmentObject(obj1)
    .environmentObject(obj2)) { ... }
```

### パターン2: 無限ループ
```swift
// ❌ NG
.onReceive(publisher) { _ in
    loadContent()  // 無限ループ
}

// ✅ OK
.onAppear {
    loadContent()  // 一度だけ
}
```

---

## 重要な教訓

- **ビルド成功 ≠ 正常動作**
- 必ず実機/シミュレータで確認
- CPU 50%以上持続 = 無限ループ
- メモリ際限なく増加 = 無限ループ/リーク

---

**エラー修正時は必ず docs/ERROR_RESOLUTION_PROTOCOL.md を参照すること**
