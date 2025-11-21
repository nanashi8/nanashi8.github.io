# 08. エラー予測AI仕様書

## 🎯 概要

エラー予測AIは、ユーザーの過去の誤答パターンを分析し、次に間違えそうな問題を0-100%のリスクスコアで予測します。リスクレベルに応じて事前警告やヒントを提供し、予防的学習を促進します。

### 主な機能

- **誤答パターン分析**: 過去のエラーから8種類の傾向を検出
- **リスク予測**: 次の問題の誤答リスクを0-100%で算出
- **適応的サポート**: リスクレベルに応じたヒント提供
- **混同単語検出**: よく間違える単語ペアを特定

---

## 🎯 機能仕様

### 1. エラーパターンの種類

```typescript
export type ErrorPattern = 
  | 'similar_spelling'      // 綴りが似ている
  | 'similar_meaning'       // 意味が似ている
  | 'similar_sound'         // 発音が似ている
  | 'confusion_pair'        // 特定の単語と混同
  | 'grammar_error'         // 文法的な間違い
  | 'length_based'          // 単語の長さに起因
  | 'category_weakness'     // カテゴリー全体の弱点
  | 'timing_based';         // 時間経過による忘却
```

### 2. リスク予測アルゴリズム

```typescript
export function predictErrorRisk(
  word: string,
  wordProgress: WordProgress | undefined,
  errorAnalysis: ErrorAnalysis,
  currentFatigue: number,
  recentErrors: number
): ErrorPrediction {
  let baseRisk = 30; // ベースリスク
  const riskFactors: RiskFactor[] = [];
  
  // 1. 個別単語の過去の誤答率
  if (wordProgress) {
    const total = wordProgress.correctCount + wordProgress.incorrectCount;
    const errorRate = (wordProgress.incorrectCount / total) * 100;
    if (errorRate > 50) {
      baseRisk += 30;
    }
  }
  
  // 2. 混同ペア（よく間違える単語との関連）
  const confusionPair = errorAnalysis.confusionPairs.find(
    p => p.word1 === word || p.word2 === word
  );
  if (confusionPair && confusionPair.confusionCount >= 2) {
    baseRisk += 15;
  }
  
  // 3. 疲労度の影響
  if (currentFatigue > 60) {
    baseRisk += Math.min(25, (currentFatigue - 60) * 0.5);
  }
  
  // 4. 連続誤答の影響
  if (recentErrors >= 2) {
    baseRisk += 15;
  }
  
  // リスクレベルを判定
  const warningLevel = 
    baseRisk >= 75 ? 'critical' :
    baseRisk >= 60 ? 'high' :
    baseRisk >= 40 ? 'medium' : 'low';
  
  return {
    word,
    errorRisk: Math.min(100, baseRisk),
    confidence: 85,
    primaryPattern: 'category_weakness',
    riskFactors,
    warningLevel,
    suggestedSupport: generateSupport(warningLevel, word)
  };
}
```

### 3. サポート戦略

```typescript
export interface SupportStrategy {
  showWarning: boolean;      // 警告を表示するか
  warningMessage: string;    // 警告メッセージ
  hints: string[];           // ヒント
  reviewWords: string[];     // 一緒に復習すべき単語
  confidenceBooster: string; // 励ましのメッセージ
}

function generateSupport(
  warningLevel: 'low' | 'medium' | 'high' | 'critical',
  word: string
): SupportStrategy {
  if (warningLevel === 'critical') {
    return {
      showWarning: true,
      warningMessage: 'この単語は誤答リスクが高いです。慎重に回答しましょう。',
      hints: ['語源から意味を推測', '類似単語と比較'],
      reviewWords: [],
      confidenceBooster: '落ち着いて考えれば大丈夫！'
    };
  }
  
  if (warningLevel === 'high') {
    return {
      showWarning: true,
      warningMessage: '注意が必要な単語です',
      hints: ['綴りに注意'],
      reviewWords: [],
      confidenceBooster: 'じっくり確認しましょう'
    };
  }
  
  return {
    showWarning: false,
    warningMessage: '',
    hints: [],
    reviewWords: [],
    confidenceBooster: ''
  };
}
```

### 4. 混同ペア検出

```typescript
export interface ConfusionPair {
  word1: string;
  word2: string;
  confusionCount: number;    // 混同回数
  lastConfusion: number;     // 最終混同日時
  pattern: ErrorPattern;
}

// 混同ペアの例
const confusionPairs: ConfusionPair[] = [
  { word1: 'affect', word2: 'effect', confusionCount: 5, lastConfusion: Date.now(), pattern: 'similar_spelling' },
  { word1: 'accept', word2: 'except', confusionCount: 3, lastConfusion: Date.now(), pattern: 'similar_sound' }
];
```

### 5. UI統合

```tsx
{errorPrediction.warningLevel === 'high' && (
  <div className="error-warning">
    ⚠️ {errorPrediction.suggestedSupport.warningMessage}
    {errorPrediction.suggestedSupport.hints.map((hint, idx) => (
      <div key={idx} className="hint">💡 {hint}</div>
    ))}
  </div>
)}
```

---

## 📚 関連ドキュメント

- [07. 認知負荷管理AI](./07-cognitive-load-ai.md) - 疲労度検出
- [09. 文脈学習AI](./09-contextual-learning-ai.md) - 関連単語のグループ化
- [12. 学習曲線AI](./12-learning-curve-ai.md) - 習得速度の予測
