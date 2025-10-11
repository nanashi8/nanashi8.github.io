---
applyTo: "**/*"
---
# Project Overview
このプロジェクトは語句を効率的に学習するためのクイズアプリケーション（Swift/SwiftUI）。

## 主要機能
- **適応型学習**: ユーザーの習熟度に応じた出題制御（AdaptiveScheduler）
- **視覚的フィードバック**: 合格数・総出題数の光るエフェクト（スプリングアニメーション）
- **バッチ学習**: 段階的な学習進行管理
- **明確なUI**: 問題カード・選択肢カード・分からないカードの独立表示

---

# Architecture Principles
- **Feature-First / Vertical Slice Architecture** を採用
- **責務分離**: View / Model / Store / Service を明確に分離
- **単一実装**: 過度なラッパー・多段継承を避け、単一の実装・管理点に集約
- **既存優先**: 既存の設計・コード・パッケージを優先利用（再発明を避ける）
- **実用性優先**: オーバーエンジニアリングを避け、容易性・可読性・保守性・拡張性を重視

---

# Swift Coding Standards
- Swift公式ガイドに従い、可読性と明瞭性を最優先
- インデントはスペース4つ
- 命名は説明的に、必要な型情報を明示
- 関数には日本語コメントで意図を補足
- Swiftファイル（.swift）はSwift言語のみで記述（他言語・独自記法の混入を防止）

---

# AI Work Efficiency System
**重要: 作業開始前に必ず `.copilot/` ディレクトリを参照すること**

## 作業規模別の参照フロー

### 小規模変更（単一ファイル、100行以内）
1. `.copilot/quick-ref.md` で実装パターン確認
2. 直接実装
3. `.copilot/changelog.md` に記録

### 中規模変更（複数ファイル、新機能）
1. `.copilot/structure-map.md` で影響範囲確認
2. `.copilot/prompts/add-feature.md` の手順に従う
3. 関連する `.copilot/components/*.md` を参照
4. `.copilot/changelog.md` に記録

### 大規模変更（リファクタリング）
1. `.copilot/structure-map.md` で全体像把握
2. `.copilot/prompts/refactor-component.md` の手順に従う
3. `.copilot/task-template.md` で作業を複数フェーズに分割
4. `.copilot/structure-map.md` を更新
5. `.copilot/changelog.md` に詳細記録

---

# 重要な実装パターン

## アニメーション（合格数・総出題数）
```swift
// 値変更前に保存 → 変更 → 変化検出してアニメーション
let oldValue = currentValue
currentValue += 1
if currentValue > oldValue {
    shouldAnimate = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
        self.shouldAnimate = false
    }
}
```

## カード分離パターン
問題カード・選択肢カード・分からないカードは独立したセクションとして表示。
各セクションに「選択肢」「その他」などのラベルを付ける。

## 状態管理
- @EnvironmentObject: QuizSettings, ScoreStore, WordScoreStore, CurrentCSV
- @State: View内部の一時的な状態
- UserDefaults: 永続化が必要な設定

---

# トラブルシューティング
問題発生時は以下を確認：
1. `.copilot/changelog.md` で最近の変更履歴を確認
2. `.copilot/prompts/fix-bug.md` の手順に従う
3. 該当する `docs/仕様書/*.md` を参照

---

# 必須の作業ルール

## 禁止事項
- `.copilot/` を参照せずに大規模変更を行う
- changelog.md の更新を忘れる
- 仕様書（`docs/仕様書/`）なしでコンポーネントを分割
- structure-map.md と実装の不整合を放置

---

# 参考資料
- AI作業ガイド: `.copilot/README.md`
- アーキテクチャ: `.copilot/structure-map.md`
- 実装パターン: `.copilot/quick-ref.md`
- 編集ガイド: `docs/仕様書/00_編集ガイド.md`

---

# セッション開始時の推奨宣言
```
「.copilot/structure-map.md を確認してください」
「小規模変更です。quick-ref.md を参照してください」
「新機能追加です。prompts/add-feature.md の手順に従ってください」
「完了後、changelog.md に今回の変更を記録してください」
```
