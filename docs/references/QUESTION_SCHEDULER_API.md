# QuestionScheduler API仕様書

**カテゴリー**: Reference（リファレンス）  
**対象者**: フロントエンド開発者、TypeScript開発者  
**最終更新**: 2025-12-19  
**バージョン**: 1.0.0

---

## 📋 概要

QuestionScheduler APIの完全な仕様を提供します。このドキュメントは、実装者が正しくAPIを使用するために必要な全ての情報を含みます。

---

## 🚀 クイックスタート

### 最小限の使用例

```typescript
import { QuestionScheduler } from '@/ai/scheduler/QuestionScheduler';
import type { ScheduleParams, ScheduleResult } from '@/ai/scheduler/types';

const scheduler = new QuestionScheduler();

const result: ScheduleResult = scheduler.schedule({
  questions: allQuestions,
  recentAnswers: [],
  mode: 'memorization',
  sessionStats: {
    correct: 0,
    incorrect: 0,
    still_learning: 0,
    consecutiveCorrect: 0,
    duration: 0,
  },
  useMetaAI: true,
});

// 結果を使用
const scheduledQuestions = result.scheduledQuestions;
```

---

## 📖 API リファレンス

### QuestionScheduler クラス

```typescript
class QuestionScheduler {
  constructor();
  schedule(params: ScheduleParams): ScheduleResult;
}
```

#### コンストラクタ

```typescript
const scheduler = new QuestionScheduler();
```

**パラメータ**: なし  
**戻り値**: QuestionSchedulerインスタンス  
**例外**: なし

**使用例**:
```typescript
// シングルトンパターン（推奨）
const [scheduler] = useState(() => new QuestionScheduler());

// または毎回生成（非推奨）
const scheduler = new QuestionScheduler();
```

---

### schedule メソッド

**シグネチャ**:
```typescript
schedule(params: ScheduleParams): ScheduleResult
```

**パラメータ**: `ScheduleParams`  
**戻り値**: `ScheduleResult`  
**例外**: なし（内部でエラーハンドリング）

#### ScheduleParams

```typescript
interface ScheduleParams {
  questions: Question[];              // 必須: 出題可能な問題リスト
  recentAnswers: RecentAnswer[];      // 必須: 直近の回答履歴
  mode: string;                       // 必須: タブ種別
  sessionStats: SessionStats;         // 必須: セッション統計
  useMetaAI?: boolean;                // オプション: デフォルトfalse
  hybridMode?: boolean;               // オプション: デフォルトfalse
  timeOfDay?: TimeOfDay;              // オプション: デフォルト'afternoon'
  cognitiveLoad?: number;             // オプション: デフォルト0.5
}
```

**詳細**:

| フィールド | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| `questions` | `Question[]` | ✅ | - | 出題可能な問題リスト（最低1問） |
| `recentAnswers` | `RecentAnswer[]` | ✅ | - | 振動防止用の直近回答履歴（空配列可） |
| `mode` | `string` | ✅ | - | 'memorization' \| 'translation' \| 'spelling' \| 'grammar' |
| `sessionStats` | `SessionStats` | ✅ | - | セッション統計情報 |
| `useMetaAI` | `boolean` | - | `false` | QuestionSchedulerを有効化 |
| `hybridMode` | `boolean` | - | `false` | 旧ロジックとの併用モード |
| `timeOfDay` | `TimeOfDay` | - | `'afternoon'` | 'morning' \| 'afternoon' \| 'evening' \| 'night' |
| `cognitiveLoad` | `number` | - | `0.5` | 0.0-1.0の範囲 |

**バリデーション**:
- `questions.length >= 1`（空配列はエラー）
- `mode` は 'memorization', 'translation', 'spelling', 'grammar' のいずれか
- `cognitiveLoad` は 0.0-1.0 の範囲
- `useMetaAI === true && hybridMode === true` は無効な組み合わせ

---

#### Question インターフェース

```typescript
interface Question {
  id: string;                          // 必須: 一意識別子
  word: string;                        // 必須: 英単語
  meaning: string;                     // 必須: 日本語訳
  type?: 'memorization' | 'translation' | 'spelling' | 'grammar';
  category?: 'incorrect' | 'still_learning' | 'new' | 'mastered';
  difficulty?: number;
  [key: string]: any;                  // その他のプロパティ
}
```

**使用例**:
```typescript
const questions: Question[] = [
  {
    id: 'memorize_apple_001',
    word: 'apple',
    meaning: 'りんご',
    type: 'memorization',
    category: 'incorrect',  // ⭐ 重要: incorrectは最優先で出題
  },
  {
    id: 'memorize_banana_002',
    word: 'banana',
    meaning: 'バナナ',
    type: 'memorization',
    category: 'new',
  },
];
```

---

#### RecentAnswer インターフェース

```typescript
interface RecentAnswer {
  word: string;                        // 必須: 回答した単語
  correct: boolean;                    // 必須: 正解したか
  timestamp: number;                   // 必須: 回答日時（Unix timestamp ms）
  consecutiveCorrect?: number;         // オプション: 連続正解回数
}
```

**使用例**:
```typescript
const recentAnswers: RecentAnswer[] = [
  {
    word: 'apple',
    correct: true,
    timestamp: Date.now() - 30000,  // 30秒前
    consecutiveCorrect: 1,
  },
  {
    word: 'banana',
    correct: false,
    timestamp: Date.now() - 60000,  // 1分前
    consecutiveCorrect: 0,
  },
];
```

**振動防止ルール**:
- `timestamp` が現在から1分以内（60000ms）かつ `correct === true` の場合、該当単語は除外される
- 連続正解3回以上の単語も除外される

---

#### SessionStats インターフェース

```typescript
interface SessionStats {
  correct: number;                     // 必須: 正解回数
  incorrect: number;                   // 必須: 不正解回数
  still_learning: number;              // 必須: 学習中回数
  consecutiveCorrect: number;          // 必須: 連続正解回数
  duration: number;                    // 必須: セッション時間（ミリ秒）
}
```

**使用例**:
```typescript
const sessionStats: SessionStats = {
  correct: 15,
  incorrect: 5,
  still_learning: 3,
  consecutiveCorrect: 2,
  duration: Date.now() - sessionStartTime,  // セッション開始からの経過時間
};
```

**シグナル検出への影響**:
- `duration > 1200000`（20分）→ 疲労シグナル
- `incorrect / (correct + incorrect) > 0.4` → 苦戦シグナル
- `consecutiveCorrect > 10` → 過学習シグナル

---

#### ScheduleResult インターフェース

```typescript
interface ScheduleResult {
  scheduledQuestions: Question[];      // スケジュール済み問題リスト
  vibrationScore: number;              // 振動スコア（0-100）
  metadata?: {                         // デバッグ用メタデータ
    totalCandidates: number;
    filteredCount: number;
    signalCounts: Record<string, number>;
    avgPriority: number;
  };
}
```

**使用例**:
```typescript
const result: ScheduleResult = scheduler.schedule(params);

console.log(`スケジュール済み: ${result.scheduledQuestions.length}問`);
console.log(`振動スコア: ${result.vibrationScore}`);
console.log(`除外数: ${result.metadata?.filteredCount}`);

// 上位10問を表示
const top10 = result.scheduledQuestions.slice(0, 10);
console.log('上位10問:', top10.map(q => q.word));
```

**vibrationScoreの解釈**:
- `0-30`: 良好（問題の多様性が高い）
- `30-60`: 普通
- `60-100`: 注意（同じ問題が繰り返される可能性）

---

## 🎯 使用パターン集

### パターン1: 基本的な使用（暗記タブ）

```typescript
function MemorizationTab() {
  const [scheduler] = useState(() => new QuestionScheduler());
  const [scheduledQuestions, setScheduledQuestions] = useState<Question[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    incorrect: 0,
    still_learning: 0,
    consecutiveCorrect: 0,
    duration: 0,
  });
  const sessionStartTime = useRef(Date.now());
  
  useEffect(() => {
    const result = scheduler.schedule({
      questions: allMemorizationQuestions,
      recentAnswers: getRecentAnswers(),  // localStorageから取得
      mode: 'memorization',
      sessionStats: {
        ...sessionStats,
        duration: Date.now() - sessionStartTime.current,
      },
      useMetaAI: true,
      timeOfDay: getTimeOfDay(),
      cognitiveLoad: calculateCognitiveLoad(sessionStats),
    });
    
    setScheduledQuestions(result.scheduledQuestions);
  }, [allMemorizationQuestions, sessionStats]);
  
  return (
    <div>
      {scheduledQuestions.map(q => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}
```

---

### パターン2: スペルタブでの使用

```typescript
function SpellingTab() {
  const [scheduler] = useState(() => new QuestionScheduler());
  
  const scheduleSpellingQuestions = () => {
    const result = scheduler.schedule({
      questions: spellingQuestions,
      recentAnswers: getRecentAnswersForMode('spelling'),  // モード別履歴
      mode: 'spelling',
      sessionStats: getCurrentSessionStats(),
      useMetaAI: true,
    });
    
    return result.scheduledQuestions;
  };
  
  // ...
}
```

---

### パターン3: フィルタリングとの併用

```typescript
function FilteredScheduling() {
  const scheduler = new QuestionScheduler();
  
  // 1. ユーザーの選択に基づいてフィルタリング
  const filteredByUser = allQuestions.filter(q => {
    if (selectedGrade !== 'all' && q.grade !== selectedGrade) return false;
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    return true;
  });
  
  // 2. QuestionSchedulerでスケジューリング
  const result = scheduler.schedule({
    questions: filteredByUser,  // フィルタ済み問題
    recentAnswers: recentAnswers,
    mode: 'memorization',
    sessionStats: sessionStats,
    useMetaAI: true,
  });
  
  // 3. スケジュール済み問題を使用
  return result.scheduledQuestions;
}
```

---

### パターン4: エラーハンドリング

```typescript
function SafeScheduling() {
  const scheduler = new QuestionScheduler();
  
  try {
    // バリデーション
    if (allQuestions.length === 0) {
      console.warn('[Scheduling] 問題が0件です。フォールバック使用。');
      return { scheduledQuestions: [], vibrationScore: 0 };
    }
    
    // スケジューリング
    const result = scheduler.schedule({
      questions: allQuestions,
      recentAnswers: recentAnswers,
      mode: 'memorization',
      sessionStats: sessionStats,
      useMetaAI: true,
    });
    
    // 結果の検証
    if (result.scheduledQuestions.length === 0) {
      console.warn('[Scheduling] スケジュール結果が0件です。');
      // 振動防止で全て除外された可能性
      return { scheduledQuestions: allQuestions, vibrationScore: 100 };
    }
    
    return result;
    
  } catch (error) {
    console.error('[Scheduling] エラー発生:', error);
    // フォールバック: 元の順序を使用
    return { scheduledQuestions: allQuestions, vibrationScore: 0 };
  }
}
```

---

## 🧪 テストケース

### テスト1: incorrect単語が最優先

```typescript
describe('QuestionScheduler', () => {
  it('incorrect単語が最優先で出題される', () => {
    const scheduler = new QuestionScheduler();
    
    const result = scheduler.schedule({
      questions: [
        { id: '1', word: 'apple', meaning: 'りんご', category: 'incorrect' },
        { id: '2', word: 'banana', meaning: 'バナナ', category: 'new' },
        { id: '3', word: 'cat', meaning: '猫', category: 'mastered' },
      ],
      recentAnswers: [],
      mode: 'memorization',
      sessionStats: { correct: 0, incorrect: 0, still_learning: 0, consecutiveCorrect: 0, duration: 0 },
      useMetaAI: true,
    });
    
    expect(result.scheduledQuestions[0].word).toBe('apple');
    expect(result.scheduledQuestions[0].category).toBe('incorrect');
  });
});
```

### テスト2: 振動防止が機能

```typescript
it('1分以内に正解した問題は除外される', () => {
  const scheduler = new QuestionScheduler();
  const now = Date.now();
  
  const result = scheduler.schedule({
    questions: [
      { id: '1', word: 'apple', meaning: 'りんご' },
    ],
    recentAnswers: [
      {
        word: 'apple',
        correct: true,
        timestamp: now - 30000,  // 30秒前に正解
      },
    ],
    mode: 'memorization',
    sessionStats: { correct: 1, incorrect: 0, still_learning: 0, consecutiveCorrect: 1, duration: 30000 },
    useMetaAI: true,
  });
  
  expect(result.scheduledQuestions.length).toBe(0);
});
```

### テスト3: カテゴリー別ソート

```typescript
it('incorrect → still_learning → その他の順序', () => {
  const scheduler = new QuestionScheduler();
  
  const result = scheduler.schedule({
    questions: [
      { id: '1', word: 'apple', meaning: 'りんご', category: 'mastered' },
      { id: '2', word: 'banana', meaning: 'バナナ', category: 'incorrect' },
      { id: '3', word: 'cat', meaning: '猫', category: 'still_learning' },
      { id: '4', word: 'dog', meaning: '犬', category: 'new' },
    ],
    recentAnswers: [],
    mode: 'memorization',
    sessionStats: { correct: 0, incorrect: 0, still_learning: 0, consecutiveCorrect: 0, duration: 0 },
    useMetaAI: true,
  });
  
  expect(result.scheduledQuestions[0].category).toBe('incorrect');  // banana
  expect(result.scheduledQuestions[1].category).toBe('still_learning');  // cat
  expect(['new', 'mastered']).toContain(result.scheduledQuestions[2].category);
});
```

---

## ⚠️ 注意事項

### 1. パフォーマンス

```typescript
// ✅ 推奨: インスタンスを再利用
const [scheduler] = useState(() => new QuestionScheduler());

// ❌ 非推奨: 毎回生成
useEffect(() => {
  const scheduler = new QuestionScheduler();  // 毎回生成は非効率
  // ...
}, [dependencies]);
```

**理由**: QuestionSchedulerは内部で AntiVibrationFilter を保持します。毎回生成すると無駄なインスタンスが作成されます。

---

### 2. recentAnswersの管理

```typescript
// ✅ 推奨: 最新100件のみ保持
setRecentAnswers(prev => [newAnswer, ...prev].slice(0, 100));

// ❌ 非推奨: 全履歴を保持
setRecentAnswers(prev => [newAnswer, ...prev]);  // メモリリーク
```

**理由**: 全履歴を保持すると振動防止の計算コストが増加します。最新100件で十分です。

---

### 3. sessionStatsの更新

```typescript
// ✅ 推奨: 不変更新
setSessionStats(prev => ({
  ...prev,
  correct: prev.correct + 1,
  consecutiveCorrect: prev.consecutiveCorrect + 1,
}));

// ❌ 非推奨: 可変更新
sessionStats.correct++;  // React が検出できない
```

---

### 4. useMetaAIフラグの使い分け

```typescript
// useMetaAI: true（推奨）
// - QuestionSchedulerの全機能を使用
// - シグナル検出、優先度計算、振動防止が有効

// useMetaAI: false
// - 旧ロジックのみ使用
// - デバッグ時や比較検証時のみ推奨
```

---

## 🔧 デバッグ

### ログ確認

```typescript
// ブラウザコンソールで確認
localStorage.getItem('debug_scheduler_calls');

// 出力例
[
  {
    timestamp: "2025-12-19T10:30:00.000Z",
    mode: "memorization",
    questionCount: 50,
    useMetaAI: true,
    firstQuestions: ["apple", "banana", "cat", ...]
  }
]
```

### デバッグモード有効化

```typescript
// localStorage にフラグをセット
localStorage.setItem('debug-scheduler', 'true');

// コンソールに詳細ログが出力される
// ✅✅✅ [QuestionScheduler] 優先単語配置完了
// incorrectCount: 5
// stillLearningCount: 10
// top10: [...]
```

---

## 📚 関連ドキュメント

- [QuestionScheduler 完全仕様書](../specifications/QUESTION_SCHEDULER_SPEC.md) - アルゴリズム詳細
- [型定義リファレンス](../references/QUESTION_SCHEDULER_TYPES.md) - 全インターフェース定義
- [復旧手順書](QUESTION_SCHEDULER_RECOVERY.md) - 機能喪失時の復旧方法
- [メタAI統合ガイド](../guidelines/META_AI_INTEGRATION_GUIDE.md) - 4タブへの統合方法
- [DetectedSignal活用ガイド](DETECTED_SIGNAL_USAGE_GUIDE.md) - シグナルのUI統合

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-19 | 1.0.0 | 初版作成（Phase 2完了） |
