# メタAI統合ガイド - QuestionCardへの組み込み例

## 概要

このドキュメントでは、`QuestionCard`コンポーネントに適応的教育AIネットワークを統合する方法を説明します。

## 統合手順

### 1. useAdaptiveNetworkフックをインポート

```tsx
import { useAdaptiveNetwork } from '../hooks/useAdaptiveNetwork';
import { StrategyType } from '../ai/meta';
```

### 2. フックを初期化

```tsx
function QuestionCard({ question, onAnswer, ... }: QuestionCardProps) {
  const {
    enabled: adaptiveEnabled,
    processQuestion,
    currentStrategy,
    isLoading: adaptiveLoading,
  } = useAdaptiveNetwork();

  // 既存のステート...
}
```

### 3. 回答処理時にメタAIを呼び出す

既存の`onAnswer`の直前または直後に以下のコードを追加:

```tsx
// 回答処理（例: 選択肢クリック時）
const handleChoiceClick = async (choice: string, choiceQuestion: Question | null) => {
  const isCorrect = choice === question.meaning;
  
  // 既存の処理
  if (!isCorrect) {
    setAttemptCount((prev) => prev + 1);
  }
  onAnswer(choice, question.meaning, choiceQuestion);
  
  // メタAIネットワークによる分析と戦略推奨
  if (adaptiveEnabled) {
    try {
      const context = {
        currentDifficulty: calculateDifficulty(question),
        timeOfDay: getTimeOfDay(),
        recentErrors: getRecentErrors(),
        sessionLength: getSessionLength(),
        consecutiveCorrect: getConsecutiveCorrect(),
      };
      
      const recommendation = await processQuestion(
        question.word,
        isCorrect ? 'correct' : 'incorrect',
        context
      );
      
      // 推奨された戦略に応じてアクションを実行
      handleStrategyRecommendation(recommendation);
      
    } catch (error) {
      console.error('[QuestionCard] Adaptive AI error:', error);
      // エラー時はグレースフルフォールバック（通常学習を継続）
    }
  }
};
```

### 4. 戦略に応じたアクション実装

```tsx
const handleStrategyRecommendation = (recommendation: StrategyRecommendation) => {
  switch (recommendation.strategy) {
    case StrategyType.IMMEDIATE_REPETITION:
      // 次の質問で同じ単語を再出題
      queueWordForImmediateRepetition(question.word);
      break;
      
    case StrategyType.TAKE_BREAK:
      // 休憩通知を表示
      showBreakNotification(recommendation.metadata?.restDuration || 300000); // 5分
      break;
      
    case StrategyType.USE_CONFUSION_PAIRS:
      // 混同ペアを次の質問に含める
      const confusionPairs = recommendation.metadata?.confusionPairs || [];
      queueConfusionPairs(confusionPairs);
      break;
      
    case StrategyType.REDUCE_DIFFICULTY:
      // 難易度を下げる
      adjustDifficultyLevel(-1);
      break;
      
    case StrategyType.SPACED_REPETITION:
      // 間隔反復スケジュールに追加
      scheduleForSpacedRepetition(question.word, recommendation.metadata?.interval);
      break;
      
    case StrategyType.CONTEXTUAL_LEARNING:
      // 例文や文脈情報を表示
      showContextualExamples(question.word);
      break;
      
    case StrategyType.GROUP_BY_THEME:
      // テーマ別グループ学習モードに切り替え
      switchToThematicLearning(recommendation.metadata?.theme);
      break;
      
    case StrategyType.ADJUST_SESSION_LENGTH:
      // セッション長を調整
      adjustSessionLength(recommendation.metadata?.targetLength);
      break;
      
    case StrategyType.USE_ETYMOLOGY:
      // 語源情報を表示
      showEtymology(question.word);
      break;
      
    case StrategyType.TIME_OF_DAY_OPTIMIZATION:
      // 最適な学習時間を提案
      suggestOptimalStudyTime(recommendation.metadata?.optimalHour);
      break;
      
    case StrategyType.INCREASE_EXPOSURE:
      // 露出頻度を上げる
      increaseWordExposure(question.word);
      break;
      
    case StrategyType.CONTINUE_NORMAL:
    default:
      // 通常学習を継続（何もしない）
      break;
  }
  
  // 推奨理由をログに記録（デバッグ用）
  console.log('[AdaptiveAI]', recommendation.reason, {
    strategy: recommendation.strategy,
    confidence: recommendation.confidence,
    signals: recommendation.signals.length,
  });
};
```

### 5. ヘルパー関数（例）

```tsx
// 難易度計算
const calculateDifficulty = (q: Question): number => {
  // 難易度を0-1で返す（0=簡単、1=難しい）
  const gradeWeight = (q.grade || 1) / 9; // Grade 1-9 -> 0.11-1.0
  return Math.min(Math.max(gradeWeight, 0), 1);
};

// 最近のエラー数を取得
const getRecentErrors = (): number => {
  const recentAnswers = JSON.parse(
    sessionStorage.getItem('recentAnswers') || '[]'
  );
  return recentAnswers.filter((a: any) => !a.correct).length;
};

// セッション長を取得（分）
const getSessionLength = (): number => {
  const startTime = sessionStorage.getItem('sessionStartTime');
  if (!startTime) return 0;
  return Math.floor((Date.now() - parseInt(startTime)) / 60000);
};

// 連続正解数を取得
const getConsecutiveCorrect = (): number => {
  return parseInt(sessionStorage.getItem('currentCorrectStreak') || '0');
};
```

### 6. UI表示（オプション）

現在の戦略を表示する場合:

```tsx
{adaptiveEnabled && currentStrategy && (
  <div className="adaptive-strategy-badge">
    <span>🧠 {STRATEGY_DISPLAY_NAMES[currentStrategy]}</span>
  </div>
)}
```

## 完全な統合例

```tsx
import { useAdaptiveNetwork } from '../hooks/useAdaptiveNetwork';
import { StrategyType, type StrategyRecommendation } from '../ai/meta';

function QuestionCard({ question, onAnswer, ... }: QuestionCardProps) {
  const {
    enabled: adaptiveEnabled,
    processQuestion,
    currentStrategy,
  } = useAdaptiveNetwork();

  const handleChoiceClick = async (choice: string, choiceQuestion: Question | null) => {
    const isCorrect = choice === question.meaning;
    
    if (!isCorrect) {
      setAttemptCount((prev) => prev + 1);
    }
    
    // 既存の回答処理
    onAnswer(choice, question.meaning, choiceQuestion);
    
    // 適応的AI処理
    if (adaptiveEnabled) {
      try {
        const recommendation = await processQuestion(
          question.word,
          isCorrect ? 'correct' : 'incorrect',
          {
            currentDifficulty: calculateDifficulty(question),
            timeOfDay: getTimeOfDay(),
            recentErrors: getRecentErrors(),
            sessionLength: getSessionLength(),
            consecutiveCorrect: getConsecutiveCorrect(),
          }
        );
        
        handleStrategyRecommendation(recommendation);
      } catch (error) {
        console.error('[QuestionCard] Adaptive AI error:', error);
      }
    }
  };

  const handleStrategyRecommendation = (rec: StrategyRecommendation) => {
    // 戦略に応じた処理（上記参照）
    console.log('[AdaptiveAI]', rec.reason);
  };

  return (
    <div ref={cardRef} className="question-card">
      {/* 既存のUI */}
      
      {/* 適応的戦略表示（オプション） */}
      {adaptiveEnabled && currentStrategy && (
        <div className="adaptive-strategy-badge">
          🧠 {STRATEGY_DISPLAY_NAMES[currentStrategy]}
        </div>
      )}
      
      {/* 既存の選択肢など */}
    </div>
  );
}
```

## 注意事項

1. **グレースフルフォールバック**: メタAIが失敗しても通常学習は継続される
2. **パフォーマンス**: `processQuestion`は非同期で実行され、ユーザー体験を妨げない
3. **段階的導入**: `adaptiveEnabled`フラグで簡単にON/OFF可能
4. **既存機能との両立**: 既存の`useAdaptiveLearning`と競合しない

## テスト方法

1. 設定画面でメタAIを有効化
2. 質問に回答
3. コンソールログで推奨戦略を確認
4. 各戦略の動作をテスト

## さらなる統合

- 設定画面に`AdaptiveNetworkControl`コンポーネントを追加
- ダッシュボードに効果指標を表示
- A/Bテストで効果を測定
