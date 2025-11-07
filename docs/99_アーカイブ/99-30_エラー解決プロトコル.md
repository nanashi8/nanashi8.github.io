# エラー解決プロトコル

最終更新: 2025年10月23日

## 📌 このドキュメントの目的

GitHub Copilotがエラー修正を行う際の**必須手順**を定義し、修正漏れやデグレードを防止する。

**⚠️ エラー修正時は必ずこのドキュメントを最初に参照すること**

---

## 🚨 最重要：QuizView無限ループ問題の教訓（2025-10-23）

### 問題の症状
- ContentViewからQuizViewへの画面遷移が動作しない
- ボタンタップ後、何の反応もない
- CPUとメモリが際限なく増加し続ける

### 根本原因
1. **環境オブジェクトの注入漏れ**
2. **`.onReceive`による無限ループ**

### なぜ10回以上の修正でも解決できなかったか
- ビルド成功 ≠ 正常動作 を理解していなかった
- 実機/シミュレータでの動作確認を怠った
- CPUとメモリの異常増加を見逃した
- `.onReceive`の無限ループに気づかなかった

### 正しい修正方法

```swift
// ✅ ContentView: 環境オブジェクトを明示的に注入
struct ContentView: View {
    @EnvironmentObject var wordScoreStore: WordScoreStore
    @EnvironmentObject var currentCSV: CurrentCSV
    @EnvironmentObject var quizSettings: QuizSettings
    
    var body: some View {
        NavigationStack {
            NavigationLink(destination: QuizView()
                .environmentObject(wordScoreStore)  // 必須
                .environmentObject(currentCSV)
                .environmentObject(quizSettings)) {
                Text("クイズをはじめる")
            }
        }
    }
}

// ✅ QuizView: .onReceiveを削除
var body: some View {
    VStack {
        // UI
    }
    .onAppear {
        loadContent()  // 一度だけ実行
    }
    // .onReceive は削除（無限ループの原因だった）
}
```

---

## 📋 エラー解決の必須手順

### フェーズ1: 問題理解（15分）

#### 必須チェック項目
- [ ] エラーメッセージ全文を確認
- [ ] 再現手順をステップバイステップで確認
- [ ] Debug Navigator（CPU、メモリ）を確認
- [ ] 前回の修正内容を確認（繰り返しを避ける）

#### 症状別の原因推定
- **画面遷移しない** → 環境オブジェクト不足、Navigation設定ミス
- **CPU 50%以上持続** → 無限ループ
- **メモリ際限なく増加** → 無限ループまたはメモリリーク

---

### フェーズ2: 原因特定（20分）

#### 必須調査項目
```bash
1. read_file で対象ファイル全体を読む（部分読み禁止）
2. @EnvironmentObject の宣言を全て確認
3. NavigationLink で環境オブジェクトが注入されているか確認
4. .onReceive, .onChange の使用箇所を確認
```

#### SwiftUI頻出問題パターン

**パターン1: 環境オブジェクト欠落（最頻出）**
```swift
// ❌ 悪い例
NavigationLink(destination: SomeView()) { ... }

// ✅ 良い例
NavigationLink(destination: SomeView()
    .environmentObject(store1)
    .environmentObject(store2)) { ... }
```

**パターン2: 無限ループ（CPU/メモリ異常の主原因）**
```swift
// ❌ 悪い例
.onReceive(publisher) { _ in
    loadContent()  // 状態更新 → 再レンダリング → onReceive → 無限ループ
}

// ✅ 良い例
.onAppear {
    loadContent()  // 一度だけ実行
}
```

---

### フェーズ3: 修正実装（25分）

#### 修正前チェック
- [ ] ファイル全体を理解した
- [ ] 環境オブジェクトの伝搬経路を確認した
- [ ] 最小限の変更で済むか検討した

#### 修正後の必須検証（絶対に省略禁止）
```bash
# ステップ1: コンパイルチェック
1. get_errors でエラー確認

# ステップ2: ビルド
2. run_in_terminal でビルド実行

# ステップ3: 実機/シミュレータ確認（最重要）
3. アプリ起動
4. 問題の操作を再現
5. Debug Navigatorで確認：
   - CPU: 通常10%以下、操作時30%以下
   - メモリ: 増加し続けていない

# ステップ4: リグレッション確認
6. 関連画面の動作確認
```

---

### フェーズ4: 3回で解決しない場合

1. **立ち止まる**
2. このドキュメントを再読
3. より詳細なデバッグログを追加
4. ユーザーに追加情報を求める

---

## 🔧 SwiftUI重要原則

### 1. 環境オブジェクトは明示的に注入
```swift
// NavigationLinkは環境オブジェクトを自動継承しない！
NavigationLink(destination: View()
    .environmentObject(obj1)
    .environmentObject(obj2)) { ... }
```

### 2. .onReceiveは極めて慎重に
```swift
// 推奨: .onAppearのみ使用
.onAppear { loadData() }

// 必要な場合: 条件チェック必須
.onReceive(publisher) { value in
    guard currentValue != value else { return }
    currentValue = value
}
```

### 3. ビューライフサイクル理解
- `init()` → `body`（複数回） → `.onAppear`（一度）
- データロードは `.onAppear` で行う

---

## 🚨 緊急対応フロー

### CPU/メモリ異常増加
1. `.onReceive`, `.onChange`, `didSet` を疑う
2. デバッグログで無限ループ確認
3. `.onReceive`を削除し`.onAppear`に変更

### 画面遷移しない
1. NavigationStack配置確認
2. 環境オブジェクト全て注入されているか確認
3. デバッグログで遷移先View生成確認

---

## ✅ チェックリスト

### 修正前
- [ ] 問題を完全理解
- [ ] ファイル全体を読んだ
- [ ] 環境オブジェクト確認
- [ ] 根本原因を特定

### 修正後
- [ ] コンパイルエラーなし
- [ ] ビルド成功
- [ ] 実機/シミュレータで動作確認
- [ ] CPU/メモリ正常
- [ ] リグレッションなし

---

## 📝 報告フォーマット

```markdown
## 修正完了

### 問題
[症状]

### 根本原因
[原因]

### 修正内容
- ファイル: 変更内容

### 検証
- [x] ビルド成功
- [x] 動作確認完了
- [x] CPU/メモリ正常
```

---

**このドキュメントは実際の失敗から学んだ教訓です。必ず参照してください。**
