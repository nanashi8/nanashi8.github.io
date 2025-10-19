# 新機能追加プロンプト

## 使用タイミング
- 新しい画面や機能を追加する時
- 既存機能を拡張する時
- 新しいデータモデルを追加する時

## ステップ1: 要件の明確化

```
以下を明確にしてください：
1. 何を実現したいか（目的）
2. どのような画面・UIが必要か
3. どのようなデータを扱うか
4. 既存のどの機能と連携するか
```

## ステップ2: 影響範囲の調査

```
`.copilot/structure-map.md` を確認し、以下を特定してください：
1. 影響を受ける既存ファイル
2. 利用できる既存コンポーネント
3. 新規作成が必要なファイル
4. 変更が必要な @EnvironmentObject
```

## ステップ3: 設計

### データモデル設計
```
必要なデータ構造を設計：
- struct/class名
- プロパティとその型
- Codable/Identifiable の必要性
- デフォルト値
```

### UI設計
```
画面構成を設計：
- メインView
- サブコンポーネント
- 再利用できる既存コンポーネント
- 新規作成が必要なコンポーネント
```

### 状態管理設計
```
状態の持ち方を決定：
- @State: View内部の状態
- @EnvironmentObject: アプリ全体で共有
- @ObservedObject/@StateObject: ViewModel
- UserDefaults/FileManager: 永続化
```

## ステップ4: 実装計画

```
`.copilot/task-template.md` を使用して、以下の順で実装計画を立ててください：

### Phase 1: データモデル
1. データ構造の定義
2. サンプルデータの作成
3. 単体テスト（必要に応じて）

### Phase 2: ビジネスロジック
1. データ読み込み処理
2. データ変換・加工処理
3. 永続化処理（必要に応じて）

### Phase 3: UI実装
1. プロトタイプ（静的データ表示）
2. 実データとの接続
3. インタラクション実装
4. アニメーション・エフェクト

### Phase 4: 統合
1. 既存画面からのナビゲーション
2. 既存データとの連携
3. エラーハンドリング
```

## ステップ5: 非推奨構文チェック（必須）

**実装前に必ず確認:**
1. `.copilot/deprecated-patterns.md` を確認
2. `.copilot/quick-ref.md` の非推奨セクションを確認
3. iOS 17以降の非推奨構文を使用しない

**特に注意すべきパターン:**
```swift
// ❌ 絶対に使用禁止
.onChange(of: value) { _ in }
.onChange(of: value) { newValue in }

// ✅ 必ず使用
.onChange(of: value) { }
.onChange(of: value) { oldValue, newValue in }
```

## ステップ6: 段階的実装

### Phase 1: データモデル
```swift
// 1. 新しいファイル作成: [ModelName].swift
struct [ModelName]: Identifiable, Codable {
    let id: UUID
    // ... プロパティ
    
    init(...) {
        // ... 初期化
    }
}

// 2. サンプルデータ
extension [ModelName] {
    static let sample = [ModelName](...)
}
```

### Phase 2: ビジネスロジック
```swift
// 1. ViewModel または Store 作成
class [FeatureName]Store: ObservableObject {
    @Published var items: [ModelName] = []
    
    func load() {
        // データ読み込み
    }
    
    func save() {
        // データ保存
    }
}

// 2. App.swift に登録
@StateObject private var [featureName]Store = [FeatureName]Store()

.environmentObject([featureName]Store)
```

### Phase 3: UI実装
```swift
// 1. メインView作成
struct [FeatureName]View: View {
    @EnvironmentObject var store: [FeatureName]Store
    
    var body: some View {
        // プロトタイプ実装
    }
}

// 2. プレビュー追加
#Preview {
    [FeatureName]View()
        .environmentObject([FeatureName]Store())
}

// 3. 段階的に機能追加
```

### Phase 4: 統合
```swift
// 既存のナビゲーションに追加
NavigationLink(destination: [FeatureName]View()) {
    Text("新機能")
}
```

## ステップ6: テストと検証

```
以下を確認してください：
- [ ] データの読み込み・保存が正常に動作する
- [ ] UI が仕様通りに表示される
- [ ] インタラクションが期待通りに動作する
- [ ] エラーケースが適切に処理される
- [ ] 既存機能に影響がない
- [ ] パフォーマンスに問題がない
```

## ステップ7: ドキュメント更新

```
以下を更新してください：
1. `.copilot/structure-map.md` に新機能を追加
2. `.copilot/changelog.md` に実装記録を追加
3. 新しいパターンがあれば `.copilot/quick-ref.md` に追加
4. 新しいコンポーネントの仕様書を `.copilot/components/` に作成
```

## 例: 単語帳機能の追加

### Phase 1: データモデル
```swift
// WordSet.swift
struct WordSet: Identifiable, Codable {
    let id: UUID
    var name: String
    var words: [QuestionItem]
    var createdAt: Date
}
```

### Phase 2: ビジネスロジック
```swift
// WordSetStore.swift
class WordSetStore: ObservableObject {
    @Published var wordSets: [WordSet] = []
    
    func addWordSet(_ wordSet: WordSet) { ... }
    func removeWordSet(id: UUID) { ... }
    func load() { ... }
    func save() { ... }
}
```

### Phase 3: UI実装
```swift
// WordSetListView.swift
struct WordSetListView: View {
    @EnvironmentObject var store: WordSetStore
    
    var body: some View {
        List(store.wordSets) { wordSet in
            NavigationLink(destination: WordSetDetailView(wordSet: wordSet)) {
                Text(wordSet.name)
            }
        }
    }
}
```

### Phase 4: 統合
```swift
// ContentView.swift に追加
NavigationLink(destination: WordSetListView()) {
    Label("単語帳", systemImage: "book")
}
```

## チェックリスト

- [ ] 要件を明確にした
- [ ] structure-map.md で影響範囲を確認した
- [ ] データモデルを設計した
- [ ] UI設計を行った
- [ ] 状態管理方法を決定した
- [ ] 段階的に実装した
- [ ] 各Phaseでテストした
- [ ] 既存機能への影響を確認した
- [ ] ドキュメントを更新した

## トラブルシューティング

### Preview が動作しない
→ 必要な @EnvironmentObject を Preview に渡してください

### データが保存されない
→ save() メソッドが適切なタイミングで呼ばれているか確認してください

### ナビゲーションが動作しない
→ NavigationStack/NavigationView で囲まれているか確認してください
