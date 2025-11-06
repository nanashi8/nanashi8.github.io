# 適応型学習システム実装ガイド

## 概要

SimpleWord に適応型学習システムを実装しました。このシステムは記憶定着理論に基づき、ユーザーの学習進捗に応じて最適な出題を行います。

## 実装した機能

### 1. **記憶定着段階モデル（MemoryStage）**
- **場所**: `SimpleWord/Features/Study/Domain/MemoryStage.swift`
- **機能**:
  - 6段階の記憶定着レベル: 未学習 → 初回接触 → 短期記憶 → 中期記憶 → 長期記憶 → 習熟済み
  - 各段階での推奨出題間隔・繰り返し回数・優先度を定義
  - StudyRecord から自動的に記憶段階を判定

### 2. **記憶定着度追跡（MemoryConsolidationTracker）**
- **場所**: `SimpleWord/Features/Study/Domain/MemoryStage.swift`
- **機能**:
  - 各単語の記憶段階を追跡
  - 学習モード（normal/review/remediation）に応じた優先度フィルタリング
  - 正答率・誤答連続数・期日超過などを考慮した動的な優先度計算
  - 記憶段階別の統計情報を提供

### 3. **学習モード別出題戦略**
- **Normal（通常モード）**: 新規学習と復習をバランス良く出題
- **Review（復習モード）**: 短期・中期記憶の単語を重点的に出題
- **Remediation（補習モード）**: 習熟していない単語を集中的に出題

### 4. **記憶進捗の視覚化（MemoryProgressView）**
- **場所**: `SimpleWord/Features/Quiz/Views/MemoryProgressView.swift`
- **機能**:
  - 記憶段階別の単語数を色分けして表示
  - 各段階の割合を進捗バーで表示
  - 全体の習熟率を計算して表示

### 5. **QuizView への統合**
- **場所**: `SimpleWord/Features/Quiz/Views/QuizView.swift`
- **変更点**:
  - 学習モード表示を `quizSettings.model.learningMode` から取得
  - バッチ準備時に記憶段階に応じた繰り返し回数を自動計算
  - 回答処理で AdaptiveScheduler へ結果を記録
  - 記憶進捗統計を画面に表示

## 使用方法

### 段階的な有効化

QuizView 内のデバッグフラグで新機能を段階的に有効化できます:

```swift
// デバッグフラグ: 新機能を段階的に有効化
private let enableMemoryTracking = false  // 記憶定着度追跡を有効化
private let enableAdaptiveScheduling = false  // 適応型スケジューリングを有効化
```

#### フェーズ1: 従来の動作（現在の設定）
- `enableMemoryTracking = false`
- `enableAdaptiveScheduling = false`
- 既存の動作を維持（互換性確認用）

#### フェーズ2: 記憶追跡のみ有効化
- `enableMemoryTracking = true`
- `enableAdaptiveScheduling = false`
- 記憶段階の統計表示と繰り返し回数の最適化を有効化

#### フェーズ3: 完全な適応型学習
- `enableMemoryTracking = true`
- `enableAdaptiveScheduling = true`
- 記憶追跡 + AdaptiveScheduler による最適な出題順序

## 技術的な詳細

### 記憶段階の判定ロジック

```swift
public static func determine(from record: StudyRecord) -> MemoryStage {
    // 習熟済み判定
    if record.mastered && record.smoothedAccuracy >= 0.9 && record.correctStreak >= 5 {
        return .mastered
    }

    // 試行回数と間隔で段階を判定
    let attempts = record.totalAttempts
    let interval = record.interval

    if attempts == 0 {
        return .unseen
    } else if attempts <= 2 {
        return .initial
    } else if attempts <= 5 || interval < 300 {
        return .shortTerm
    } else if attempts <= 10 || interval < 86400 {
        return .midTerm
    } else {
        return .longTerm
    }
}
```

### 優先度計算

各単語の出題優先度は以下の要素で計算されます:

1. **記憶段階による基本優先度**: 学習モードごとに異なる優先度
2. **正答率による補正**: 低い正答率の単語を優先
3. **誤答連続による補正**: 連続誤答が多い単語を優先
4. **期日超過による補正**: 復習期日を過ぎた単語を優先

```swift
var priority = stage.priority(for: mode)
let accPenalty = (1.0 - record.smoothedAccuracy) * 2.0
priority += accPenalty
let wrongStreakBonus = Double(record.wrongStreak) * 0.5
priority += wrongStreakBonus
```

### バッチ準備の流れ

1. **候補の選択**: `order` から出題候補を取得
2. **フィルタリング**: `MemoryConsolidationTracker.filter()` で学習モードに応じた優先度付け
3. **スケジューリング**: `AdaptiveScheduler.scheduleNextBatch()` で最適な出題順を決定
4. **繰り返し設定**: 記憶段階に応じた繰り返し回数を計算
5. **ラウンドロビン配置**: 同じ単語が連続しないように分散

## 今後の拡張案

### 1. 学習効率分析
- 学習速度の追跡（単語あたりの平均学習時間）
- 定着率の分析（長期記憶到達率）
- 最適な学習時間帯の提案

### 2. パーソナライズ
- ユーザーごとの最適な繰り返し回数の学習
- 記憶曲線のパーソナル化
- 難易度の動的調整

### 3. モチベーション機能
- 学習ストリークの追跡
- マイルストーン達成の通知
- 学習グラフの可視化

### 4. グループ学習
- 学習進捗の共有
- 競争要素の追加
- 協力学習モード

## トラブルシューティング

### 問題: 新機能を有効化すると動作しない
- **対処**: デバッグフラグを `false` に戻して従来の動作を確認
- **確認**: `StudyProgressRepository` が正しく動作しているか確認
- **ログ**: 実装にデバッグログを追加して問題を特定

### 問題: 記憶段階が更新されない
- **対処**: `AdaptiveScheduler.record()` が正しく呼ばれているか確認
- **確認**: `StudyRecord` の保存が正しく行われているか確認

### 問題: 出題順序がおかしい
- **対処**: `MemoryConsolidationTracker.filter()` の優先度計算をログで確認
- **調整**: 学習モードごとの優先度バランスを調整

## 参考資料

- **記憶の科学**: エビングハウスの忘却曲線
- **間隔反復法**: Spaced Repetition System (SRS)
- **SuperMemo アルゴリズム**: SM-2, SM-15 などの適応型アルゴリズム

## 変更履歴

- **2025-10-24**: 初版作成
  - 記憶定着段階モデルの実装
  - 記憶定着度追跡システムの実装
  - QuizView への統合（デバッグフラグで制御）
  - 記憶進捗の視覚化

---

**注意**: 現在はデバッグフラグが `false` に設定されており、従来の動作で実行されます。
新機能を有効化する場合は、QuizView の該当フラグを `true` に変更してください。
