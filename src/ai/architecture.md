# 7AI責任分離アーキテクチャ設計

## 概要

QuestionScheduler（メタAI）を中心に、7つの専門AIが協調動作する教育AI システムを構築します。

## 既存インフラ活用

- **SignalDetector**: すでに実装済み - 各種学習指標の検出
- **AdaptiveEducationalAINetwork**: 8AI統合フレームワーク

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────┐
│          QuestionScheduler (メタAI)                  │
│  ┌─────────────────────────────────────────────┐   │
│  │         AICoordinator                       │   │
│  │  - シグナル収集・統合                        │   │
│  │  - 優先度計算の最終調整                      │   │
│  └─────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────┘
                    │ 統合シグナル
        ┌───────────┴───────────┐
        │   7つの専門AI          │
        └───────────┬───────────┘
                    │
    ┌───────┬───────┼───────┬───────┬───────┬───────┐
    ▼       ▼       ▼       ▼       ▼       ▼       ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Memory  ││Cognitive││Error   ││Learning││Linguistic││Contextual││Gamifi- │
│AI      ││LoadAI  ││Prediction││StyleAI ││AI      ││AI      ││cationAI│
│        ││        ││AI      ││        ││        ││        ││        │
│🧠      ││💤      ││🔮      ││🎯      ││📚      ││🌍      ││🎮      │
└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
```

## 7つの専門AI

### 1. MemoryAI (🧠 記憶AI)

**責任**: 記憶の定着度と忘却リスクの評価

**入力データ**:

- `lastStudied`: 最終学習時刻
- `attempts`: 学習回数
- `correct`: 正解回数
- `streak`: 連続正解数
- `reviewInterval`: 復習間隔

**出力シグナル**:

```typescript
interface MemorySignal {
  forgettingRisk: number; // 0-200: 忘却リスク
  timeBoost: number; // 0-1: 時間経過ブースト
  category: WordCategory; // カテゴリー判定
  retentionStrength: number; // 0-1: 記憶定着度
}
```

**アルゴリズム**:

- 時間ブースト: 2分→15%, 5分→30%, 15分→50%, 30分→60%
- 忘却リスク: `(経過日数 / 復習間隔) × 100`
- カテゴリー判定: 連続回数 + 正答率ベース

### 2. CognitiveLoadAI (💤 認知負荷AI)

**責任**: 学習者の認知負荷レベルの推定

**入力データ**:

- `sessionCorrectRate`: セッション正答率
- `consecutiveIncorrect`: 連続不正解数
- `avgResponseTime`: 平均解答時間
- `sessionDuration`: セッション継続時間

**出力シグナル**:

```typescript
interface CognitiveLoadSignal {
  loadLevel: 'low' | 'medium' | 'high' | 'overload';
  fatigueScore: number; // 0-1: 疲労度
  recommendedBreak: boolean; // 休憩推奨
  difficultyAdjustment: number; // -0.2 ~ +0.2: 難易度調整
}
```

**アルゴリズム**:

- 連続3回不正解 → 認知負荷「高」
- セッション30分超 → 疲労度上昇
- 正答率50%未満 → 難易度下げ推奨

### 3. ErrorPredictionAI (🔮 誤答予測AI)

**責任**: 誤答パターンから弱点を予測

**入力データ**:

- `errorHistory`: 誤答履歴
- `errorPatterns`: 誤答パターン（文法項目、単語カテゴリー）
- `similarWords`: 類似語句の正答状況

**出力シグナル**:

```typescript
interface ErrorPredictionSignal {
  weaknessAreas: string[]; // 弱点分野
  confusionPairs: [string, string][]; // 混同ペア
  preemptiveReview: string[]; // 予防的復習推奨語句
  patternConfidence: number; // 0-1: パターン信頼度
}
```

**アルゴリズム**:

- 同一文法項目で3回以上誤答 → 弱点認定
- 類似語句（IPA、形態）の誤答率相関分析

### 4. LearningStyleAI (🎯 学習スタイルAI)

**責任**: 学習者の学習スタイルの推定と最適化

**入力データ**:

- `preferredQuestionTypes`: 好む問題形式
- `studyTimePatterns`: 学習時間帯パターン
- `visualVsAuditory`: 視覚/聴覚学習傾向

**出力シグナル**:

```typescript
interface LearningStyleSignal {
  styleProfile: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  optimalSessionLength: number; // 分
  preferredDifficulty: 'gradual' | 'challenge' | 'mixed';
  motivationType: 'mastery' | 'performance' | 'social';
}
```

**アルゴリズム**:

- IPA/音声利用頻度 → 聴覚学習者
- 長時間セッション傾向 → 集中型学習者

### 5. LinguisticAI (📚 言語学的AI)

**責任**: 言語学的特徴に基づく難易度評価

**入力データ**:

- `wordFrequency`: 語彙頻度
- `phoneticComplexity`: 音韻複雑度（IPA）
- `morphologicalStructure`: 形態的構造
- `semanticRelations`: 意味的関係

**出力シグナル**:

```typescript
interface LinguisticSignal {
  inherentDifficulty: number; // 0-1: 固有難易度
  phoneticSimilarity: string[]; // 音韻類似語
  semanticCluster: string[]; // 意味的クラスター
  grammarComplexity: number; // 0-1: 文法複雑度
}
```

**アルゴリズム**:

- IPA音素数 > 10 → 音韻的に複雑
- 多義語 → 意味的難易度高

### 6. ContextualAI (🌍 文脈的AI)

**責任**: 学習文脈と環境の考慮

**入力データ**:

- `currentTab`: 現在のタブ（暗記/文法/総合）
- `recentlyStudiedTopics`: 最近の学習トピック
- `timeOfDay`: 学習時間帯
- `deviceType`: デバイス種類

**出力シグナル**:

```typescript
interface ContextualSignal {
  contextRelevance: number; // 0-1: 文脈関連性
  topicContinuity: boolean; // トピック継続性
  environmentFit: number; // 0-1: 環境適合度
  crossTabSynergy: string[]; // 他タブとの相乗効果
}
```

**アルゴリズム**:

- 文法タブ → 同一文法項目の語彙優先
- 朝 → 新規学習優先、夜 → 復習優先

### 7. GamificationAI (🎮 ゲーミフィケーションAI)

**責任**: モチベーション維持とエンゲージメント向上

**入力データ**:

- `streakDays`: 連続学習日数
- `achievementProgress`: 達成度進捗
- `competitiveScore`: 競争スコア
- `recentEngagement`: 最近のエンゲージメント

**出力シグナル**:

```typescript
interface GamificationSignal {
  motivationLevel: number; // 0-1: モチベーション
  rewardTiming: boolean; // 報酬付与タイミング
  challengeLevel: 'easy' | 'medium' | 'hard';
  socialFeedback: string; // SNS共有推奨メッセージ
}
```

**アルゴリズム**:

- 連続7日達成 → 報酬付与
- モチベーション低下時 → 簡単な問題優先

## AICoordinator（統合調整役）

**責任**: 7つのAIシグナルを統合し、最終的な優先度を計算

**統合ロジック**:

```typescript
finalPriority = basePriority
  × memorySignal.timeBoost        // 時間ブースト
  × (1 + cognitiveLoadSignal.difficultyAdjustment) // 認知負荷調整
  × (1 - errorPredictionSignal.patternConfidence * 0.3) // 弱点優先
  × contextualSignal.contextRelevance // 文脈関連性
  × (1 - gamificationSignal.motivationLevel * 0.1) // モチベーション調整
```

**緊急フラグ**:

- 忘却リスク150+ → 最優先 (priority = 0.1)
- 認知負荷「過負荷」→ 休憩推奨
- 連続5回不正解 → 難易度緩和

## QuestionScheduler統合

**既存コードとの互換性**:

- 現在の`calculatePriorities()`を保持
- AICoordinatorを内部で呼び出し
- 段階的移行を可能にする

**段階的移行計画**:

1. Phase 2: 7AI実装 + AICoordinator
2. Phase 3: QuestionSchedulerに統合（フラグで切り替え可能）
3. Phase 4: テスト完了後、デフォルト有効化

## データフロー

```
UserAction (解答)
  ↓
Progress更新 (localStorage)
  ↓
QuestionScheduler.selectNextQuestion()
  ↓
AICoordinator.analyzeAndCoordinate()
  ↓
7つのAI並列実行
  ↓
シグナル統合
  ↓
最終優先度計算
  ↓
問題選択
```

## パフォーマンス最適化

- **並列処理**: 7つのAIは独立して並列実行可能
- **キャッシュ**: SignalDetectorの結果をキャッシュ
- **遅延計算**: 必要な時だけAI実行
- **軽量化**: 各AIはステートレス、純粋関数

## テスト戦略

- **単体テスト**: 各AI個別にテスト
- **統合テスト**: AICoordinatorのシグナル統合テスト
- **E2Eテスト**: 実際の学習フローでのシミュレーション
- **A/Bテスト**: 既存アルゴリズムとの比較

## 実装優先順位

1. **最優先**: MemoryAI, CognitiveLoadAI (Phase 1バグ修正の延長)
2. **高優先**: ErrorPredictionAI (弱点検出)
3. **中優先**: LearningStyleAI, ContextualAI
4. **低優先**: LinguisticAI, GamificationAI (付加価値機能)

## 将来の拡張性

- AI追加: 新しい専門AIを簡単に追加可能
- カスタマイズ: ユーザーごとにAIの重み付け調整
- 学習: 各AIが学習データから自動調整
