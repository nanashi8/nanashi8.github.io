# DetectedSignal 活用ガイド

**カテゴリー**: How-to（手順書）  
**対象者**: フロントエンド開発者、UI/UX実装者  
**最終更新**: 2025-12-19

---

## 📋 概要

このドキュメントでは、QuestionSchedulerが検出する**DetectedSignal**を活用して、学習者に適切なフィードバックを提供する方法を説明します。

### DetectedSignalとは？

```typescript
interface DetectedSignal {
  type: 'fatigue' | 'boredom' | 'overlearning' | 'struggling' | 'optimal';
  confidence: number;  // 0.0-1.0
  action: 'easier' | 'harder' | 'diverse' | 'review' | 'continue';
}
```

QuestionSchedulerが学習者の状態を分析し、以下を検出:
- **疲労**: 長時間学習による注意力低下
- **飽き**: 同じ問題の繰り返しによる飽き
- **過学習**: 簡単すぎる問題による成長停滞
- **苦戦**: 難しすぎる問題による挫折リスク
- **最適**: 理想的な学習状態

---

## 🚀 基本的な使い方

### Step 1: ScheduleResultからシグナルを取得

```tsx
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import type { ScheduleResult, DetectedSignal } from '@/ai/scheduler/types';

function MyLearningTab() {
  const [scheduler] = useState(() => new QuestionScheduler());
  const [detectedSignals, setDetectedSignals] = useState<DetectedSignal[]>([]);
  
  useEffect(() => {
    const result: ScheduleResult = scheduler.schedule({
      // ... パラメータ
    });
    
    // ⚠️ 現在のQuestionSchedulerはmetadataにシグナルを含めていません
    // 将来のバージョンで対応予定
    
    // 代替方法: scheduler内部のdetectSignals()結果をログから取得
    // またはカスタムフックで直接detectSignals()を呼び出す
    
  }, [/* 依存配列 */]);
}
```

**注意**: 現在のQuestionScheduler（v3.0）は、シグナルを内部でのみ使用し、UIには公開していません。将来のバージョン（v4.0）で対応予定です。

---

## 🎯 シグナル別活用方法

### 1. Fatigue（疲労）シグナル

#### 検出条件
- セッション時間 > 20分
- 認知負荷 > 0.7

#### 推奨アクション
```tsx
function handleFatigueSignal(signal: DetectedSignal) {
  if (signal.confidence > 0.7) {
    // 高信頼度: 強制休憩を提案
    showModal({
      title: '休憩時間です！',
      message: `${Math.floor((Date.now() - sessionStartTime) / 60000)}分学習しました。\n5分休憩しませんか？`,
      buttons: [
        {
          label: '休憩する（5分）',
          action: () => startBreakTimer(300000),  // 5分
        },
        {
          label: '続ける',
          action: () => dismissModal(),
        },
      ],
    });
  } else if (signal.confidence > 0.5) {
    // 中信頼度: 通知バナー
    showNotificationBanner({
      type: 'warning',
      message: '長時間学習しています。こまめに休憩を取りましょう。',
      duration: 5000,
    });
  }
}
```

#### UI実装例

```tsx
// 休憩タイマーコンポーネント
function BreakTimer({ duration }: { duration: number }) {
  const [remaining, setRemaining] = useState(duration);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(timer);
          showNotification({ message: '休憩終了！再開しましょう。' });
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return (
    <div className="break-timer">
      <h2>🌟 休憩中</h2>
      <p className="timer">{minutes}:{seconds.toString().padStart(2, '0')}</p>
      <p>深呼吸してリラックスしましょう</p>
    </div>
  );
}
```

---

### 2. Struggling（苦戦）シグナル

#### 検出条件
- 誤答率 > 40%
- 試行回数 >= 5

#### 推奨アクション
```tsx
function handleStrugglingSignal(signal: DetectedSignal) {
  if (signal.confidence > 0.6) {
    showModal({
      title: '少し難しいようです',
      message: '基礎問題に戻って復習しますか？',
      buttons: [
        {
          label: '基礎から復習',
          action: () => {
            // 難易度を下げる
            setDifficultyLevel('beginner');
            // incorrectカテゴリーのみに絞る
            setFilterCategory('incorrect');
          },
        },
        {
          label: 'ヒントを表示',
          action: () => {
            showHints(currentQuestion);
          },
        },
        {
          label: '続ける',
          action: () => dismissModal(),
        },
      ],
    });
  }
}
```

#### ヒント表示の実装

```tsx
function HintPanel({ question }: { question: Question }) {
  const [hintsShown, setHintsShown] = useState(0);
  
  const hints = [
    `最初の文字は「${question.word[0]}」です`,
    `単語の長さは${question.word.length}文字です`,
    `この単語の意味は「${question.meaning}」です`,
  ];
  
  return (
    <div className="hint-panel">
      <h3>💡 ヒント</h3>
      {hints.slice(0, hintsShown).map((hint, i) => (
        <p key={i}>{hint}</p>
      ))}
      {hintsShown < hints.length && (
        <button onClick={() => setHintsShown(prev => prev + 1)}>
          次のヒントを表示
        </button>
      )}
    </div>
  );
}
```

---

### 3. Overlearning（過学習）シグナル

#### 検出条件
- 連続正解 > 10回

#### 推奨アクション
```tsx
function handleOverlearningSignal(signal: DetectedSignal) {
  if (signal.confidence > 0.8) {
    showModal({
      title: '🎉 素晴らしい！',
      message: `${consecutiveCorrect}問連続正解です！\n新しい単語に挑戦しませんか？`,
      buttons: [
        {
          label: '新しい単語に挑戦',
          action: () => {
            setFilterCategory('new');
            setDifficultyLevel('advanced');
          },
        },
        {
          label: '次のグレードに進む',
          action: () => {
            setCurrentGrade(prev => Math.min(prev + 1, 3));
          },
        },
        {
          label: 'このまま続ける',
          action: () => dismissModal(),
        },
      ],
    });
  }
}
```

#### レベルアップアニメーション

```tsx
function LevelUpAnimation() {
  return (
    <div className="level-up-animation">
      <div className="stars">⭐⭐⭐</div>
      <h2>レベルアップ！</h2>
      <p>新しい単語に挑戦できるようになりました</p>
    </div>
  );
}
```

---

### 4. Boredom（飽き）シグナル

#### 検出条件
- 同じ問題の繰り返し検出（将来実装予定）

#### 推奨アクション
```tsx
function handleBoredomSignal(signal: DetectedSignal) {
  showNotification({
    type: 'info',
    message: '学習モードを変更してみませんか？',
    actions: [
      {
        label: 'スペルクイズに切り替え',
        action: () => navigateToTab('spelling'),
      },
      {
        label: '文法問題に切り替え',
        action: () => navigateToTab('grammar'),
      },
    ],
  });
}
```

---

### 5. Optimal（最適）シグナル

#### 検出条件
- 誤答率 20-35%
- 連続正解 < 8回

#### 推奨アクション
```tsx
function handleOptimalSignal(signal: DetectedSignal) {
  // 何もしない（学習を継続）
  console.log('✅ 最適な学習状態です');
  
  // オプション: 励ましのメッセージ
  if (Math.random() < 0.1) {  // 10%の確率
    showToast({
      message: '良いペースです！この調子で続けましょう 💪',
      duration: 3000,
    });
  }
}
```

---

## 🎨 UI/UX パターン集

### パターン1: 通知バナー（軽度な警告）

```tsx
function NotificationBanner({ signal }: { signal: DetectedSignal }) {
  const getBannerStyle = () => {
    switch (signal.type) {
      case 'fatigue':
        return { bg: 'bg-yellow-100', icon: '😴', color: 'text-yellow-800' };
      case 'struggling':
        return { bg: 'bg-red-100', icon: '😓', color: 'text-red-800' };
      case 'overlearning':
        return { bg: 'bg-green-100', icon: '🎉', color: 'text-green-800' };
      default:
        return { bg: 'bg-blue-100', icon: 'ℹ️', color: 'text-blue-800' };
    }
  };
  
  const style = getBannerStyle();
  
  return (
    <div className={`notification-banner ${style.bg} ${style.color} p-4 rounded-lg`}>
      <span className="text-2xl mr-2">{style.icon}</span>
      <span>{getSignalMessage(signal)}</span>
    </div>
  );
}
```

### パターン2: モーダル（重要な通知）

```tsx
function SignalModal({ signal, onClose }: { signal: DetectedSignal; onClose: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{getSignalTitle(signal)}</h2>
        <p>{getSignalMessage(signal)}</p>
        <div className="modal-actions">
          <button onClick={() => handleSignalAction(signal)}>
            {getSignalActionLabel(signal)}
          </button>
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
```

### パターン3: トースト通知（非侵襲的）

```tsx
function SignalToast({ signal }: { signal: DetectedSignal }) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="toast">
      {getSignalIcon(signal)} {getSignalMessage(signal)}
    </div>
  );
}
```

---

## 📊 シグナル統合パターン

### 複数シグナルの優先度制御

```tsx
function handleMultipleSignals(signals: DetectedSignal[]) {
  // 優先度: fatigue > struggling > overlearning > boredom > optimal
  const priorityOrder = ['fatigue', 'struggling', 'overlearning', 'boredom', 'optimal'];
  
  // 最高優先度のシグナルを取得
  const topSignal = signals.reduce((highest, current) => {
    const highestPriority = priorityOrder.indexOf(highest.type);
    const currentPriority = priorityOrder.indexOf(current.type);
    
    if (currentPriority < highestPriority) {
      return current;
    } else if (currentPriority === highestPriority) {
      // 同じ優先度の場合はconfidenceで比較
      return current.confidence > highest.confidence ? current : highest;
    }
    return highest;
  });
  
  // 最高優先度のシグナルのみ処理
  switch (topSignal.type) {
    case 'fatigue':
      handleFatigueSignal(topSignal);
      break;
    case 'struggling':
      handleStrugglingSignal(topSignal);
      break;
    case 'overlearning':
      handleOverlearningSignal(topSignal);
      break;
    case 'boredom':
      handleBoredomSignal(topSignal);
      break;
    case 'optimal':
      handleOptimalSignal(topSignal);
      break;
  }
}
```

---

## 🧪 テストとデバッグ

### シグナル検出のシミュレーション

```tsx
// 開発環境でシグナルを強制的に発火
function debugTriggerSignal(type: DetectedSignal['type']) {
  const mockSignal: DetectedSignal = {
    type,
    confidence: 0.9,
    action: type === 'fatigue' ? 'easier' : 
            type === 'struggling' ? 'review' :
            type === 'overlearning' ? 'harder' :
            type === 'boredom' ? 'diverse' : 'continue',
  };
  
  handleSignal(mockSignal);
}

// 使用例
<button onClick={() => debugTriggerSignal('fatigue')}>
  疲労シグナルをテスト
</button>
```

### デバッグコンソール

```tsx
function SignalDebugger({ signals }: { signals: DetectedSignal[] }) {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="signal-debugger">
      <h3>🐛 DetectedSignal Debug</h3>
      {signals.map((signal, i) => (
        <div key={i} className="signal-item">
          <span className="signal-type">{signal.type}</span>
          <span className="signal-confidence">{(signal.confidence * 100).toFixed(0)}%</span>
          <span className="signal-action">{signal.action}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## ⚙️ カスタマイズ

### 信頼度閾値のカスタマイズ

```tsx
const SIGNAL_THRESHOLDS = {
  fatigue: {
    high: 0.7,   // モーダル表示
    medium: 0.5, // バナー表示
    low: 0.3,    // 無視
  },
  struggling: {
    high: 0.6,
    medium: 0.4,
    low: 0.2,
  },
  overlearning: {
    high: 0.8,
    medium: 0.6,
    low: 0.4,
  },
};

function shouldShowModal(signal: DetectedSignal): boolean {
  const thresholds = SIGNAL_THRESHOLDS[signal.type];
  return signal.confidence >= thresholds.high;
}
```

### メッセージのカスタマイズ

```tsx
const SIGNAL_MESSAGES = {
  fatigue: {
    high: '疲れていませんか？5分休憩しましょう。',
    medium: '長時間学習しています。こまめに休憩を。',
    low: '集中力が少し下がっているかもしれません。',
  },
  struggling: {
    high: '少し難しいようです。基礎問題に戻りますか？',
    medium: 'ヒントを見ますか？',
    low: '焦らず、じっくり考えてみましょう。',
  },
  // ...
};

function getSignalMessage(signal: DetectedSignal): string {
  const messages = SIGNAL_MESSAGES[signal.type];
  
  if (signal.confidence >= SIGNAL_THRESHOLDS[signal.type].high) {
    return messages.high;
  } else if (signal.confidence >= SIGNAL_THRESHOLDS[signal.type].medium) {
    return messages.medium;
  } else {
    return messages.low;
  }
}
```

---

## 📈 効果測定

### シグナル応答率の追跡

```tsx
function trackSignalResponse(signal: DetectedSignal, userAction: 'accepted' | 'dismissed') {
  const analytics = {
    timestamp: Date.now(),
    signalType: signal.type,
    confidence: signal.confidence,
    userAction,
  };
  
  // ローカルストレージに保存
  const history = JSON.parse(localStorage.getItem('signal_analytics') || '[]');
  history.push(analytics);
  localStorage.setItem('signal_analytics', JSON.stringify(history.slice(-100)));
  
  // サーバーに送信（オプション）
  fetch('/api/analytics/signal', {
    method: 'POST',
    body: JSON.stringify(analytics),
  });
}
```

### 効果分析レポート

```tsx
function analyzeSignalEffectiveness() {
  const history = JSON.parse(localStorage.getItem('signal_analytics') || '[]');
  
  const stats = history.reduce((acc, item) => {
    if (!acc[item.signalType]) {
      acc[item.signalType] = { accepted: 0, dismissed: 0 };
    }
    acc[item.signalType][item.userAction]++;
    return acc;
  }, {});
  
  console.table(stats);
  
  // 受け入れ率を計算
  Object.keys(stats).forEach(type => {
    const total = stats[type].accepted + stats[type].dismissed;
    const acceptanceRate = (stats[type].accepted / total) * 100;
    console.log(`${type}: ${acceptanceRate.toFixed(1)}% 受け入れ率`);
  });
}
```

---

## 🚨 注意事項

### 1. シグナルの過剰表示を避ける

```tsx
// 同じシグナルを短時間に複数回表示しない
const lastShownSignals = useRef<Map<string, number>>(new Map());

function shouldShowSignal(signal: DetectedSignal): boolean {
  const now = Date.now();
  const lastShown = lastShownSignals.current.get(signal.type) || 0;
  
  // 同じシグナルは最低5分間隔
  if (now - lastShown < 300000) {
    return false;
  }
  
  lastShownSignals.current.set(signal.type, now);
  return true;
}
```

### 2. ユーザー設定の尊重

```tsx
// シグナル通知のON/OFF設定
function useSignalPreferences() {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('signal_preferences');
    return saved ? JSON.parse(saved) : {
      fatigue: true,
      struggling: true,
      overlearning: true,
      boredom: false,  // デフォルトOFF
      optimal: false,  // デフォルトOFF
    };
  });
  
  const savePreferences = (newPrefs: typeof preferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('signal_preferences', JSON.stringify(newPrefs));
  };
  
  return [preferences, savePreferences] as const;
}
```

---

## 📚 関連ドキュメント

- [QuestionScheduler 完全仕様書](../specifications/QUESTION_SCHEDULER_SPEC.md)
- [型定義リファレンス](../references/QUESTION_SCHEDULER_TYPES.md)
- [メタAI統合ガイド](../guidelines/META_AI_INTEGRATION_GUIDE.md)

---

## 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-12-19 | 初版作成（Phase 2完了） |
