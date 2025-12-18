# メタAI統合ガイド - QuestionScheduler中心アーキテクチャ

**カテゴリー**: Tutorial（チュートリアル）  
**対象者**: フロントエンド開発者、AI統合担当者  
**最終更新**: 2025-12-19  
**バージョン**: 3.0.0（QuestionScheduler統合版）

---

## 📋 概要

このドキュメントでは、**QuestionScheduler（メタAI）**と**7つの専門AI**の統合アーキテクチャを説明します。

### アーキテクチャの変更点（v2 → v3）

**旧アーキテクチャ（v2）**:
- ❌ QuestionCardが直接7つのAIを呼び出す
- ❌ 各タブが独立したスケジューリングロジック
- ❌ AI間の調整なし

**新アーキテクチャ（v3）**:
- ✅ **QuestionScheduler（メタAI）**が7つのAIを統合
- ✅ 4タブ共通のスケジューリングロジック
- ✅ DetectedSignalによるAI間調整

---

## 🏗️ システム構成

### 8つのAI構成

```
┌─────────────────────────────────────────────────────────┐
│         QuestionScheduler（メタAI - 第8のAI）          │
│  -Step 2: QuestionSchedulerの初期化

```tsx
function MemorizationTab() {
  const [scheduler] = useState(() => new QuestionScheduler());
  const [scheduledQuestions, setScheduledQuestions] = useState<Question[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<RecentAnswer[]>([]);
  
  // sessionStatsの追跡
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    still_learning: 0,
    consecutiveCorrect: 0,
    duration: 0,
  });
  
  // セッション開始時刻
  const sessionStartTime = useRef(Date.now());
  
  //   │ Load AI  │  │Prediction│  │ Style AI │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
┌──────────┐  ┌──────────┐  ┌──────────┐
│Linguistic│  │Contextual│  │Gamifica- │
│   AI     │  │Relevance │  │  tion AI │
└──────────┘  └──────────┘  └──────────┘
```

### 7つの専門AI（現在は未使用、将来統合予定）

| AI | 役割 | 出力 | 状態 |
|----|------|------|------|
| MemoryAI | 記憶定着支援 | 復習タイミング | 🔄 統合予定 |
| CognitiveLoadAI | 認知負荷管理 | 難易度調整 | 🔄 統合予定 |
| ErrorPredictionAI | エラー予測 | 間違えやすい問題 | 🔄 統合予定 |
| LearningStyleAI | 学習スタイル分析 | 個別最適化 | 🔄 統合予定 |
| LinguisticAI | 言語パターン分析 | 混同ペア検出 | 🔄 統合予定 |
| ContextualRelevanceAI | 文脈関連性 | テーマ別学習 | 🔄 統合予定 |
| GamificationAI | ゲーミフィケーション | モチベーション | 🔄 統合予定 |

**現状（v3.0）**: QuestionSchedulerが独自にシグナル検出を実装  
**将来（v4.0）**: 7つのAIの出力をQuestionSchedulerが統合

---

## 🚀 統合手順（4タブ共通）

### Step 1: QuestionSchedulerのインポート

```tsx
// 例: MemorizationTab.tsx
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import type { ScheduleParams, ScheduleResult } from '@/ai/scheduler/types';
```

### 2. フックを初期化

```tsx
function QuestionCard({ question, onAnswer, ... }: QuestionCardProps) {
  const {
    enabled: adaptiveEnabled,
    Step 3: スケジューリング実行（出題順序決定）

```tsx
useEffect(() => {
  const scheduleQuestions = async () => {
    try {
      // 1. スケジューリングパラメータ準備
      const params: ScheduleParams = {
        questions: allQuestions,  // フィルター済みの全問題
        recentAnswers: recentAnswers.slice(0, 100),  // 直近100回答
        mode: 'memorization',  // タブ種別
        sessionStats: {
          correct: sessionStats.correct,
          incorrect: sessionStats.incorrect,
          still_learning: sessionStats.still_learning,
          consecutiveCorrect: sessionStats.consecutiveCorrect,
          duration: Date.now() - sessionStartTime.current,
        },
        useMetaAI: true,  // ⭐ QuestionSchedulerを有効化
        hybridMode: false,  // 旧ロジックとの併用OFF
        timeOfDay: getTimeOfDay(),  // 'morning' | 'afternoon' | 'evening' | 'night'
        cognitiveLoad: calculateCognitiveLoad(),  // 0.0-1.0
      };
      
      // 2. スケジューリング実行
      const result: ScheduleResult = scheduler.schedule(params);
      
      // 3. スケジュール済み問題をセット
      setScheduledQuestions(result.scheduledQuestions);
      
      // 4. メタデータをログ出力（デバッグ用）
      console.log('✅ [Scheduling] 完了', {
        totalCandidates: params.questions.length,
        scheduledCount: result.scheduledQuestions.length,
        vibrationScore: result.vibrationScore,
        signalCounts: result.metadata?.signalCounts,
        top10: result.scheduledQuestions.slice(0, 10).map(q => q.word),
      });
      
    } catch (error) {
      console.error('[Scheduling] エラー', error);
      // フォールバック: 元の順序を使用
      setScheduledQuestions(allQuestions);
    }
  };
  
  // 初回 + 問題リスト変更時にスケジューリング
  scheduleQuestions();
}, [allQuestions, recentAnswers]);
```

### Step 4: 回答処理とrecentAnswersの更新

```tsx
const handleAnswer = (choice: string, correctAnswer: string) => {
  const isCorrect = choice === correctAnswer;
  const now = Date.now();
  
  // 1. sessionStatsを更新
  setSessionStats(prev => ({
    correct: prev.correct + (isCorrect ? 1 : 0),
    incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    still_learning: prev.still_learning,
    consecutiveCorrect: isCorrect ? prev.consecutiveCorrect + 1 : 0,
    duration: now - sessionStartTime.current,
  }));
  
  // 2. recentAnswersに追加
  const newAnswer: RecentAnswer = {
    word: currentQuestion.word,
    correct: isCorrect,
    timestamp: now,
    consecutiveCorrect: isCorrect ? sessionStats.consecutiveCorrect + 1 : 0,
  };
  
  setRecentAnswers(prev => [newAnswer, ...prev].slice(0, 100));  // 最新100件保持
  
  // 3. 次の問題に進む（スケジュール順）
  setCurrentQuestionIndex(prev => prev + 1);   );
      
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
