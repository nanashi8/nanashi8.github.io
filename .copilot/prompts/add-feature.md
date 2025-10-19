# バグ修正プロンプト

## 使用タイミング
- アプリがクラッシュする時
- 期待通りに動作しない時
- UIが正しく表示されない時
- データが保存されない時

## ステップ1: 問題の特定

```
以下を明確にしてください：
1. 何が起きているか（現象）
2. 何が期待されるか（期待値）
3. いつ発生するか（再現手順）
4. エラーメッセージ（あれば）
```

## ステップ2: 関連コードの調査

```
`.copilot/changelog.md` を確認し、以下を特定してください：
1. 最近変更された関連ファイル
2. 同じ箇所の過去の修正履歴
3. 関連する機能の変更履歴
```

```
`.copilot/structure-map.md` を確認し、以下を特定してください：
1. 問題が発生しているファイル
2. 依存している他のファイル
3. 影響を受ける可能性のあるコンポーネント
```

## ステップ3: 原因の仮説

### よくある原因パターン

#### 1. 状態管理の問題
```
チェック項目：
- [ ] @State/@Published の更新が UI に反映されていない
- [ ] @Binding が正しく渡されていない
- [ ] @EnvironmentObject が見つからない
- [ ] 非同期更新が DispatchQueue.main で行われていない
```

#### 2. データフローの問題
```
チェック項目：
- [ ] nil チェックが不足している
- [ ] 配列の範囲外アクセス
- [ ] 型変換の失敗
- [ ] データの読み込み順序の問題
```

#### 3. UI レイアウトの問題
```
チェック項目：
- [ ] 制約の競合
- [ ] フレームサイズの計算ミス
- [ ] アニメーションのタイミング
- [ ] 条件分岐の誤り
```

#### 4. ライフサイクルの問題
```
チェック項目：
- [ ] onAppear が複数回呼ばれる
- [ ] onDisappear でクリーンアップしていない
- [ ] タイマーやObserverが解放されていない
- [ ] メモリリーク
```

## ステップ4: デバッグ手法

### 1. ログ出力
```swift
// 重要な箇所にログを追加
print("🔍 [関数名] 変数名: \(変数)")
print("⚠️ [関数名] エラー: \(error)")
```

### 2. ブレークポイント
```
1. Xcode で該当行にブレークポイントを設置
2. 実行して変数の値を確認
3. ステップ実行で処理の流れを追跡
```

### 3. Preview デバッグ
```swift
#Preview {
    // 問題が起きる状態を再現
    let store = QuizSettings()
    store.someValue = problemValue
    
    return QuizView()
        .environmentObject(store)
}
```

### 4. 単純化テスト
```swift
// 問題箇所を最小限のコードで再現
struct TestView: View {
    var body: some View {
        // 問題が起きる最小限のコード
    }
}
```

## ステップ5: 修正実装

### パターン1: nil 安全性の追加
```swift
// Before
let item = items[index]

// After
guard index < items.count else { return }
let item = items[index]
```

### パターン2: 非同期処理の修正
```swift
// Before
someAsyncFunction { result in
    self.data = result  // ❌ メインスレッドでない可能性
}

// After
someAsyncFunction { result in
    DispatchQueue.main.async {
        self.data = result  // ✅ メインスレッドで更新
    }
}
```

### パターン3: 状態更新の修正
```swift
// Before
func updateValue() {
    value = newValue
    // アニメーションが動作しない
}

// After
func updateValue() {
    withAnimation {
        value = newValue  // ✅ アニメーション付きで更新
    }
}
```

### パターン4: メモリリークの修正
```swift
// Before
class ViewModel: ObservableObject {
    var timer: Timer?
    
    func start() {
        timer = Timer.scheduledTimer(...)  // ❌ 解放されない
    }
}

// After
class ViewModel: ObservableObject {
    var timer: Timer?
    
    func start() {
        timer = Timer.scheduledTimer(...)
    }
    
    deinit {
        timer?.invalidate()  // ✅ 解放時にクリーンアップ
    }
}
```

## ステップ6: 修正後の非推奨構文チェック（必須）

**修正実装時に非推奨構文を使用していないか確認:**

### 1. 非推奨パターンの確認
```bash
# 修正したファイルで非推奨構文をチェック
grep "\.onChange(of:.*) { _ in" [修正したファイル]
```

### 2. よくある間違い
```swift
// ❌ バグ修正時に古い構文を使ってしまう例
.onChange(of: selectedValue) { _ in
    updateUI()  // 非推奨！
}

// ✅ 正しい修正
.onChange(of: selectedValue) {
    updateUI()
}
```

### 3. 参照ドキュメント
- `.copilot/deprecated-patterns.md` - 非推奨パターン一覧
- `.copilot/quick-ref.md` - 正しい書き方の参照

## ステップ7: 検証

```
以下を確認してください：
- [ ] 問題が解決した（再現手順で確認）
- [ ] 他の機能に影響がない
- [ ] エッジケースでも動作する
- [ ] パフォーマンスが劣化していない
```

### エッジケースの確認
```
- [ ] 空のデータ
- [ ] 大量のデータ
- [ ] 極端な値（0, 負の数, 最大値）
- [ ] 特殊文字・絵文字
- [ ] ダークモード/ライトモード
- [ ] 異なる画面サイズ
```

## ステップ7: ドキュメント更新

```
`.copilot/changelog.md` に以下を記録してください：

## 2025-XX-XX: [バグ修正タイトル]
- ファイル: [ファイル名]
- 問題: [問題の説明]
- 原因: [根本原因]
- 修正: [修正内容]
- 影響範囲: [影響を受ける機能]
```

## 実例: アニメーションが動作しないバグ

### 問題
```
合格数と総出題数の変化時に光るエフェクトが表示されない
```

### 調査
```
1. changelog.md 確認 → 最近アニメーション機能を追加
2. QuizView.swift 確認 → shouldAnimate フラグが存在
3. ログ追加 → フラグが true になっていない
```

### 原因
```
prepareBatch() 内でアニメーションをトリガーしているが、
その直後に batchCorrect = 0 でリセットされるため、
値の変化が検出されていない
```

### 修正
```swift
// Before (prepareBatch内)
let newPassedCount = batchCorrect  // この時点で0
if newPassedCount > previousPassedCount { ... }
self.batchCorrect = 0  // すぐリセット

// After (select関数内)
let oldBatchCorrect = batchCorrect
batchCorrect += 1
if batchCorrect > oldBatchCorrect {  // 変化を検出
    shouldAnimatePassedCount = true
}
```

### 検証
```
- [x] 正解時にアニメーションが表示される
- [x] 誤答時は総出題数のみアニメーション
- [x] 既存の正答率計算に影響なし
```

## チェックリスト

- [ ] 問題を明確に特定した
- [ ] changelog.md で関連する変更履歴を確認した
- [ ] 原因の仮説を立てた
- [ ] デバッグ手法を使って原因を特定した
- [ ] 修正を実装した
- [ ] 問題が解決したことを確認した
- [ ] エッジケースも確認した
- [ ] 他の機能に影響がないことを確認した
- [ ] changelog.md に記録した

## トラブルシューティング

### 修正しても問題が再発する
→ 根本原因を修正できていない可能性。別の仮説を立ててください

### 他の機能が壊れた
→ 修正の影響範囲が広すぎる。より局所的な修正を検討してください

### 再現しない
→ 環境依存の問題の可能性。デバイス、OS、設定を確認してください
