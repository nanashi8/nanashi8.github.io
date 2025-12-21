# AI用語集・共有用語リファレンス

**最終更新**: 2025年12月17日  
**目的**: 開発者とAIアシスタント間でAIシステムの呼称を統一し、コミュニケーションを円滑化する

---

## 📊 システム構成概要

```
適応的教育AIシステム
│
├─ 14AIネットワーク (メタコントローラー)
│   ├─ SignalDetector (シグナル検出器)
│   ├─ StrategyExecutor (戦略実行器)
│   └─ EffectivenessTracker (効果追跡器)
│
└─ 7つの専門AIモジュール
    ├─ Memory Acquisition/Retention AI (記憶AI)
    ├─ Cognitive Load AI (認知負荷AI)
    ├─ Error Prediction AI (エラー予測AI)
    ├─ Learning Style AI (学習スタイルAI)
    ├─ Linguistic Relations AI (言語関連AI)
    ├─ Contextual Learning AI (文脈AI)
    └─ Gamification AI (ゲーミフィケーションAI)
```

---

## 🎯 標準呼称一覧

### メインシステム

| 呼称 | 正式名 | 説明 | ファイル |
|------|--------|------|---------|
| **14AI** | AdaptiveEducationalAINetwork | メタAIネットワーク全体 | AdaptiveEducationalAINetwork.ts |
| **14AIネットワーク** | 同上 | より正式な呼称 | 同上 |
| **メタAI** | 同上 | 短縮形 | 同上 |
| **適応AIネットワーク** | 同上 | 日本語表記 | 同上 |

### 14AIの3コンポーネント

| 呼称 | 正式名 | 役割 | ファイル |
|------|--------|------|---------|
| **シグナル検出器** | SignalDetector | 7AIからシグナル収集 | SignalDetector.ts |
| **戦略実行器** | StrategyExecutor | 統合審議・戦略決定 | StrategyExecutor.ts |
| **効果追跡器** | EffectivenessTracker | 戦略効果測定 | EffectivenessTracker.ts |

### 7つの専門AI

| 番号 | 呼称 | 正式名 | 主な機能 | ファイル |
|------|------|--------|---------|---------|
| 1 | **記憶AI** | Memory Acquisition/Retention | 記憶獲得・定着判定 | memoryAcquisitionAlgorithm.ts |
| 2 | **認知負荷AI** | Cognitive Load | 疲労検出・休憩推奨 | cognitiveLoadAI.ts |
| 3 | **エラー予測AI** | Error Prediction | 混同検出・エラー予測 | errorPredictionAI.ts |
| 4 | **学習スタイルAI** | Learning Style | 個人最適化・時間帯調整 | learningStyleAI.ts |
| 5 | **言語関連AI** | Linguistic Relations | 語源・関連語ネットワーク | linguisticRelationsAI.ts |
| 6 | **文脈AI** | Contextual Learning | 意味的クラスタリング | contextualLearningAI.ts |
| 7 | **ゲーミフィケーションAI** | Gamification | モチベーション管理 | gamificationAI.ts |

---

## 🔧 機能・動作の呼称

### データフロー

| 段階 | 呼称 | 説明 |
|------|------|------|
| 収集 | **7要素収集** | difficulty, mode, recentErrors, sessionLength, etc. |
| 検出 | **7AI検出** / **マルチシグナル** | 7つのAIから並列でシグナル検出 |
| 審議 | **14AI審議** / **ネットワーク同調** | StrategyExecutorによる戦略選択 |
| 判定 | **優先度判定** | 忘却スコア・優先度の計算 |
| 出題 | **優先度ソート** / **DTA連携** | 振動防止付き出題順序決定 |
| 測定 | **効果トラッキング** | 戦略の成功率測定 |

### シグナルタイプ

| カテゴリ | シグナル例 | 推奨戦略 |
|---------|-----------|---------|
| **疲労系** | TAKE_BREAK, REDUCE_DIFFICULTY | 休憩推奨、難易度低減 |
| **記憶系** | IMMEDIATE_REPETITION, SPACED_REPETITION | 即座復習、間隔反復 |
| **エラー系** | USE_CONFUSION_PAIRS, CONTEXTUAL_LEARNING | 混同ペア学習、文脈学習 |
| **飽き系** | REDUCE_FREQUENCY, VARIETY_INCREASE | 出題頻度低減、問題多様化 |
| **時間系** | TIME_OF_DAY_OPTIMIZATION, ADJUST_SESSION_LENGTH | 時間帯調整、セッション長調整 |

---

## 💬 会話での使い分け

### 簡潔バージョン（日常会話）
```
✅ 「14AI」 = メタAIシステム全体
✅ 「7AI」 = 専門AIモジュール群
✅ 「シグナル検出」 = SignalDetector
✅ 「審議」 = StrategyExecutor
✅ 「DTA」 = Time-Dependent Adjustment（振動防止）
```

### 正確バージョン（技術議論）
```
✅ 「14AIネットワーク」 = AdaptiveEducationalAINetwork
✅ 「7つの専門AI」 = 既存AIモジュール群
✅ 「シグナル検出器」 = SignalDetector
✅ 「戦略実行器」 = StrategyExecutor
✅ 「効果追跡器」 = EffectivenessTracker
```

### 技術的バージョン（コードレビュー）
```
✅ AdaptiveEducationalAINetwork
✅ SignalDetector.detectSignals()
✅ StrategyExecutor.selectBestStrategy()
✅ EffectivenessTracker.trackStrategy()
✅ questionPrioritySorter.ts { useMetaAI: true }
```

---

## 📝 使用例

### ケース1: 機能要望
**ユーザー**: 「14AIを和訳タブにも統合してください」  
**AI理解**: AdaptiveEducationalAINetworkをTranslationView/App.tsxに統合

### ケース2: バグ報告
**ユーザー**: 「認知負荷AIが疲労を検出しません」  
**AI理解**: cognitiveLoadAI.tsのfatigueLevel計算を確認

### ケース3: 実装確認
**ユーザー**: 「シグナル検出はちゃんと動いてますか？」  
**AI理解**: SignalDetector.detectSignals()の動作を確認

### ケース4: 統合状況確認
**ユーザー**: 「他のタブは？」  
**AI理解**: 暗記タブ以外（和訳・スペル・文法）の14AI統合状況を確認

---

## 🏗️ アーキテクチャ参照

### ファイル構造
```
src/
├── ai/
│   ├── meta/
│   │   ├── AdaptiveEducationalAINetwork.ts  # 14AIメインコントローラー
│   │   ├── SignalDetector.ts                # シグナル検出器
│   │   ├── StrategyExecutor.ts              # 戦略実行器
│   │   ├── EffectivenessTracker.ts          # 効果追跡器
│   │   └── types.ts                         # 型定義
│   ├── adaptation/
│   │   ├── adaptiveLearningAI.ts            # 記憶AI
│   │   └── learningStyleAI.ts               # 学習スタイルAI
│   ├── cognitive/
│   │   └── cognitiveLoadAI.ts               # 認知負荷AI
│   ├── prediction/
│   │   └── errorPredictionAI.ts             # エラー予測AI
│   ├── analysis/
│   │   └── linguisticRelationsAI.ts         # 言語関連AI
│   └── optimization/
│       └── contextualLearningAI.ts          # 文脈AI
├── utils/
│   └── questionPrioritySorter.ts            # 14AI統合ソート
├── hooks/
│   └── useAdaptiveNetwork.ts                # 14AIフック
└── components/
    └── MemorizationView.tsx                 # 14AI統合済み（暗記タブ）
```

### 統合フラグ
```typescript
// questionPrioritySorter.ts
interface SortOptions {
  useMetaAI?: boolean;  // 14AI有効化フラグ
  sessionContext?: {
    recentErrors: number;
    sessionLength: number;
    sessionDuration: number;
  };
}
```

---

## 🔗 関連ドキュメント

- [適応的教育AIネットワーク実装計画](../plans/ADAPTIVE_EDUCATIONAL_AI_NETWORK_PLAN.md)
- [14AI統合テスト](../../tests/unit/learningAI.test.ts)
- [振動防止シミュレーション](../../scripts/category-balance-dta-simulation.ts)
- [クイックリファレンス](./QUICK_REFERENCE.md)

---

## 📌 重要な注意事項

### 「14」の由来
- **14番目の仕様書**: `docs/specifications/14-ai-comment-generator.md`
- **14個のAIではない**: 7つの専門AI + メタコントローラー = 統合システム
- **メタAI**: 7つのAIを統合・調整する上位システム

### 混同しやすい用語
| ❌ 避ける | ✅ 使う | 理由 |
|---------|--------|------|
| 14個のAI | 7つの専門AI + 14AIネットワーク | 正確な構成 |
| AIコメント生成 | ゲーミフィケーションAI | 役割の明確化 |
| メタAIネットワーク | 14AIネットワーク | 統一呼称 |
| 6つのAI | 7つの専門AI | 正確な数 |

---

## 🎯 クイックリファレンス

**最頻出の質問と回答:**

**Q: 「14AIとは？」**  
A: 7つの専門AIを統合・調整するメタコントローラーシステム（AdaptiveEducationalAINetwork）

**Q: 「7AIとは？」**  
A: 記憶・認知負荷・エラー予測・学習スタイル・言語関連・文脈・ゲーミフィケーションの7つの専門AIモジュール

**Q: 「振動とは？」**  
A: 正解した問題が即座に再出題され、ユーザーが飽きる現象。DTA（時間依存調整）で防止

**Q: 「DTA連携とは？」**  
A: 14AIの優先度判定 + 時間経過による忘却リスク計算で、最近正解した問題を後回しにする仕組み

---

**この用語集を使って、開発者とAIの認識を完全に同期させましょう！** 🚀
