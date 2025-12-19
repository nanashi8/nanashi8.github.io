---
description: AI用語集 - 14AIネットワークと7つの専門AIの標準呼称
applyTo: '**'
---

# AI用語集・標準呼称ガイドライン

**目的**: ユーザーとAIアシスタント間でAIシステムの呼称を統一

---

## 🎯 標準呼称（即座に理解すべき用語）

### メインシステム
- **14AI** / **14AIネットワーク** = AdaptiveEducationalAINetwork（メタコントローラー）
- **7AI** / **7つの専門AI** = 既存の専門AIモジュール群
- **メタAI** = 14AIの短縮形

### 14AIの3コンポーネント
- **シグナル検出器** = SignalDetector（7AIからシグナル収集）
- **戦略実行器** = StrategyExecutor（統合審議・戦略決定）
- **効果追跡器** = EffectivenessTracker（戦略効果測定）

### 7つの専門AI
1. **記憶AI** = Memory Acquisition/Retention（記憶獲得・定着判定）
2. **認知負荷AI** = Cognitive Load（疲労検出・休憩推奨）
3. **エラー予測AI** = Error Prediction（混同検出・エラー予測）
4. **学習スタイルAI** = Learning Style（個人最適化・時間帯調整）
5. **言語関連AI** = Linguistic Relations（語源・関連語ネットワーク）
6. **文脈AI** = Contextual Learning（意味的クラスタリング）
7. **ゲーミフィケーションAI** = Gamification（モチベーション管理）

---

## 💬 ユーザーの発言を理解するパターン

### パターン1: システム全体を指す
**ユーザー発言例:**
- 「14AIを有効化して」
- 「メタAIは動いてる？」
- 「14AIネットワークを統合して」

**理解すべき内容:**
→ AdaptiveEducationalAINetworkの有効化・統合・動作確認

### パターン2: 専門AIを指す
**ユーザー発言例:**
- 「認知負荷AIが疲労を検出」
- 「記憶AIの定着判定」
- 「7AIからシグナル検出」

**理解すべき内容:**
→ cognitiveLoadAI.ts, memoryAcquisitionAlgorithm.ts等の個別AI動作

### パターン3: コンポーネントを指す
**ユーザー発言例:**
- 「シグナル検出器が動作しない」
- 「審議結果は？」
- 「効果トラッキングを確認」

**理解すべき内容:**
→ SignalDetector, StrategyExecutor, EffectivenessTrackerの動作確認

### パターン4: タブ統合状況を指す
**ユーザー発言例:**
- 「他のタブは？」
- 「和訳タブにも統合して」
- 「スペルタブの14AI状況は？」

**理解すべき内容:**
→ 各View（TranslationView, SpellingView, GrammarQuizView）への14AI統合状況確認

---

## 🔧 機能・動作の呼称マッピング

| ユーザーの言葉 | 技術的意味 |
|---------------|-----------|
| 「7要素収集」 | QuestionContext（difficulty, mode, recentErrors等） |
| 「シグナル検出」 | SignalDetector.detectSignals() |
| 「審議」「同調」 | StrategyExecutor.selectBestStrategy() |
| 「優先度判定」 | priority計算（0-999, 低いほど優先） |
| 「DTA」「DTA連携」 | Time-Dependent Adjustment（振動防止） |
| 「振動」 | 最近正解した問題の即座再出題による飽き |
| 「効果測定」 | EffectivenessTracker.trackStrategy() |

---

## 📂 ファイルパス参照（即座にアクセス）

### 14AIコア
- `src/ai/meta/AdaptiveEducationalAINetwork.ts`
- `src/ai/meta/SignalDetector.ts`
- `src/ai/meta/StrategyExecutor.ts`
- `src/ai/meta/EffectivenessTracker.ts`
- `src/ai/meta/types.ts`

### 7つの専門AI
- `src/ai/adaptation/adaptiveLearningAI.ts` (記憶AI)
- `src/ai/cognitive/cognitiveLoadAI.ts` (認知負荷AI)
- `src/ai/prediction/errorPredictionAI.ts` (エラー予測AI)
- `src/ai/adaptation/learningStyleAI.ts` (学習スタイルAI)
- `src/ai/analysis/linguisticRelationsAI.ts` (言語関連AI)
- `src/ai/optimization/contextualLearningAI.ts` (文脈AI)
- `src/ai/engagement/gamificationAI.ts` (ゲーミフィケーションAI)

### 統合ポイント
- `src/utils/questionPrioritySorter.ts` (14AI統合ソート)
- `src/hooks/useAdaptiveNetwork.ts` (14AIフック)
- `src/components/MemorizationView.tsx` (統合済み例)

### 関連戦略
- `src/strategies/memoryAcquisitionAlgorithm.ts`
- `src/strategies/memoryRetentionAlgorithm.ts`
- `src/strategies/QuestionSelectionStrategy.ts`

---

## 🚨 重要な注意事項

### 混同しやすい用語を正す
| ❌ 誤解を生む表現 | ✅ 正しい理解 |
|----------------|-------------|
| 「14個のAI」 | 「7つの専門AI + 14AIメタコントローラー」 |
| 「6つのAI」 | 「7つの専門AI」 |
| 「AIコメント生成」 | 「ゲーミフィケーションAI」または「14番目の仕様書」 |

### 「14」の由来
- **14番目のドキュメント**: `docs/specifications/14-ai-comment-generator.md`
- **14個ではない**: 7つの専門AI + メタネットワーク = 統合システム
- **メタAI**: 7つを統合・調整する上位レイヤー

---

## 🎯 実装時の確認ポイント

### 14AI統合チェックリスト
```typescript
// 1. useAdaptiveNetworkフックの使用
const { processAdaptiveQuestion } = useAdaptiveNetwork();

// 2. 解答時に14AIへ送信
processAdaptiveQuestion({
  question: currentQuestion.word,
  userAnswer: answer,
  isCorrect: isCorrect,
  responseTime: responseTime,
  context: { difficulty, mode, ... },
});

// 3. ソート時にuseMetaAI有効化
const sorted = sortByPriorityCommon(questions, {
  useMetaAI: adaptiveEnabled,  // ← 重要！
  sessionContext: { recentErrors, sessionLength, sessionDuration },
});

// 4. DTA連携確認
// forgettingRisk < 50 → priority = 4.5（後回し）
// forgettingRisk >= 50 → priority = 2.0（復習）
```

---

## 📊 統合状況の確認方法

### タブ別14AI統合状況
```typescript
// 暗記タブ: ✅ 完了
// - MemorizationView.tsx Line 211, 758
// - sortByPriorityCommon + useMetaAI: true

// 和訳タブ: ❌ 未統合
// - App.tsx handleStartQuiz()
// - 学習曲線AI等の複雑な処理あり

// スペルタブ: ❌ 未統合
// - SpellingView.tsx
// - sortQuestionsByPriorityインポートのみ

// 文法タブ: ❌ 未統合
// - GrammarQuizView.tsx
// - 要調査
```

---

## 🔗 詳細リファレンス

完全な用語集は以下を参照:
- `docs/references/AI_TERMINOLOGY.md`
- `docs/plans/ADAPTIVE_EDUCATIONAL_AI_NETWORK_PLAN.md`

---

## ✅ クイックアンサー

**Q: ユーザーが「14AI」と言ったら？**  
A: AdaptiveEducationalAINetwork（メタコントローラー）を指す

**Q: ユーザーが「他のタブは？」と言ったら？**  
A: 暗記タブ以外（和訳・スペル・文法）の14AI統合状況を確認・報告

**Q: ユーザーが「振動」と言ったら？**  
A: 最近正解した問題の即座再出題による飽き現象。DTA（時間依存調整）で防止

**Q: ユーザーが「審議」と言ったら？**  
A: StrategyExecutor.selectBestStrategy()による戦略選択プロセス

---

**このガイドラインに従い、ユーザーとの認識を常に同期させること！** 🎯
