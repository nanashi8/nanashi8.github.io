# 学習AI完全ロジック図解

> 「分からない」解答時のposition/priority計算と各担当AIの役割
>
> 最終更新: 2025年12月22日

---

## ⚡ 重要: PositionとPriorityの関係性

### Position（学習段階）- 定性的分類
```
incorrect (要復習)    → Priority基準: 100
still_learning (学習中) → Priority基準: 75
new (未学習)          → Priority基準: 50
mastered (定着済み)    → Priority基準: 10
```

### Priority（優先度）- 定量的数値
```
Priority = Position基準値 + timeBoost (0-20)

例:
- incorrect + 5日経過 = 100 + 10 = 110
- still_learning + 1日経過 = 75 + 2 = 77
```

**結論**: **PositionからPriorityを計算**（Position → Priority の単方向）
- Position: 学習状態の分類（AI判定）
- Priority: 出題順序の数値（スケジューリング用）

---

## 📊 全体フロー（3つのステージ + AI担当）

```
┌─────────────────────────────────────────────────────────────────┐
│ ステージ1: 解答時（Statistics更新 → Position判定 → Priority計算）│
│ UI → progressStorage → CategoryDetermination → QuestionScheduler │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ ステージ2: 保存・読み込み（localStorage ⇄ progressCache）       │
│ saveProgress() / loadProgress()                                  │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ ステージ3: 出題時（Priority順ソート → 最優先問題を選択）        │
│ QuestionScheduler.selectNextQuestion()                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🤖 各担当AI: デバッグ情報のみ（現在は優先度計算に未使用）        │
│ Memory/CognitiveLoad/ErrorPrediction/Retention/Difficulty/...    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ステージ1: 「分からない」ボタンクリック → Statistics更新 → Position判定 → Priority計算

### 🎯 データフロー詳細図

```
┌──────────────┐
│ 生徒が       │
│「分からない」│
│ をクリック   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────────┐
│ handleSwipe('left')                    │
│ - isCorrect: false                     │
│ - isStillLearning: false               │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ updateWordProgress(word, false, ...)   │
│                                        │
│ 【Phase 1】Statistics更新              │
│ ┌────────────────────────────────┐   │
│ │ incorrectCount++               │   │
│ │ consecutiveIncorrect++         │   │
│ │ consecutiveCorrect = 0         │   │
│ │ memorizationAttempts++         │   │
│ │ memorizationStreak = 0         │   │
│ │ lastStudied = Date.now()       │   │
│ └────────────────────────────────┘   │
│         ↓                              │
│ 【Phase 2】Position判定（SSOT）        │
│ ┌────────────────────────────────┐   │
│ │ determineWordPosition(wp)      │   │
│ │                                │   │
│ │ INPUT:                         │   │
│ │ - incorrectCount: 2            │   │
│ │ - consecutiveIncorrect: 2      │   │
│ │ - memorizationAttempts: 2      │   │
│ │ - accuracy: 0.0                │   │
│ │                                │   │
│ │ LOGIC:                         │   │
│ │ if accuracy < 0.3 OR           │   │
│ │    consecutiveIncorrect >= 2   │   │
│ │    → "incorrect"               │   │
│ │                                │   │
│ │ OUTPUT: "incorrect"            │   │
│ └────────────────────────────────┘   │
│         ↓                              │
│ 【Phase 3】Priority計算                │
│ ┌────────────────────────────────┐   │
│ │ QuestionScheduler              │   │
│ │ .recalculatePriorityAfterAnswer│   │
│ │                                │   │
│ │ INPUT: position = "incorrect"  │   │
│ │                                │   │
│ │ LOGIC:                         │   │
│ │ basePriority = 100 (incorrect) │   │
│ │ timeBoost = daysSince * 2      │   │
│ │   (max: 20)                    │   │
│ │                                │   │
│ │ priority = 100 + timeBoost     │   │
│ │                                │   │
│ │ OUTPUT: 100 (直後)             │   │
│ │         110 (5日後)            │   │
│ └────────────────────────────────┘   │
│         ↓                              │
│ 【Phase 4】🤖 各担当AI評価（デバッグ）  │
│ ┌────────────────────────────────┐   │
│ │ calculateAIEvaluations()       │   │
│ │                                │   │
│ │ 7つのAI担当が評価を計算:        │   │
│ │                                │   │
│ │ 1. MemoryAI: 80.0              │   │
│ │    忘却リスク（時間経過）       │   │
│ │                                │   │
│ │ 2. CognitiveLoadAI: 100.0      │   │
│ │    認知負荷（正答率の逆）       │   │
│ │                                │   │
│ │ 3. ErrorPredictionAI: 50.0     │   │
│ │    誤答予測（連続不正解）       │   │
│ │                                │   │
│ │ 4. RetentionAI: 0.0            │   │
│ │    定着度（正答率）            │   │
│ │                                │   │
│ │ 5. DifficultyAI: 10.0          │   │
│ │    難易度（試行回数）          │   │
│ │                                │   │
│ │ 6. SpaceRepetitionAI: 40.0     │   │
│ │    間隔反復（理想タイミング）   │   │
│ │                                │   │
│ │ 7. ForgettingRiskAI: 75.0      │   │
│ │    忘却曲線（指数減衰）        │   │
│ │                                │   │
│ │ ⚠️ 注意: これらは現在デバッグ    │   │
│ │          用途のみで、実際の     │   │
│ │          Priority計算には       │   │
│ │          使用されていない       │   │
│ └────────────────────────────────┘   │
│         ↓                              │
│ 【Phase 5】localStorage保存            │
│ ┌────────────────────────────────┐   │
│ │ saveProgress(progress)         │   │
│ │                                │   │
│ │ localStorage.setItem({         │   │
│ │   "apple": {                   │   │
│ │     position: "incorrect",     │   │
│ │     calculatedPriority: 100,   │   │
│ │     incorrectCount: 2,         │   │
│ │     consecutiveIncorrect: 2    │   │
│ │   }                            │   │
│ │ })                             │   │
│ └────────────────────────────────┘   │
└────────────────────────────────────────┘
```

### 1-1. ユーザーアクション
```tsx
// src/components/MemorizationView.tsx (L1025)

<button onClick={() => handleSwipe('left')}>
  ❌ 分からない
</button>
```

### 1-2. handleSwipe関数の処理
```tsx
// src/components/MemorizationView.tsx (L600-750)

const handleSwipe = useCallback(async (direction: 'left' | 'center' | 'right') => {
  const isCorrect = direction === 'right';     // false
  const isStillLearning = direction === 'center'; // false
  
  // ❌ 分からない = isCorrect: false, isStillLearning: false
  
  // 📊 即座のUI更新
  setSessionStats((prev) => ({
    ...prev,
    incorrect: prev.incorrect + 1, // ❌カウント増加
    correct: prev.correct,
    total: prev.total,
  }));
  
  // 🔥 バックグラウンドでストレージ更新
  await updateWordProgress(
    currentQuestion.word,    // 例: "apple"
    false,                   // isCorrect: false
    2500,                    // 2.5秒かかった
    undefined,               // ユーザー評価なし
    'memorization',          // 暗記モード
    false                    // isStillLearning: false
  );
  
  // ✅ 保存完了後、統計を再計算
  setLastAnswerTime(Date.now()); // useEffectトリガー
}, [currentQuestion]);
```

### 1-3. updateWordProgress関数
```typescript
// src/storage/progress/progressStorage.ts (L921-1240)

export async function updateWordProgress(
  word: string,              // "apple"
  isCorrect: boolean,        // false
  responseTime: number,      // 2500
  userRating?: number,       // undefined
  _mode?: string,            // 'memorization'
  isStillLearning?: boolean  // false
): Promise<void> {
  
  // ステップ1: progressデータを読み込み
  const progress = await loadProgress();
  let wordProgress = progress.wordProgress[word];
  
  if (!wordProgress) {
    wordProgress = initializeWordProgress(word);
    progress.wordProgress[word] = wordProgress;
  }
  
  // ステップ2: 統計を更新
  // ❌ 分からない → incorrectCount++
  wordProgress.incorrectCount++;
  wordProgress.consecutiveIncorrect++; // 連続不正解カウント
  wordProgress.consecutiveCorrect = 0;  // リセット
  
  // ステップ3: モード別統計（暗記モード）
  wordProgress.memorizationAttempts = (wordProgress.memorizationAttempts || 0) + 1;
  wordProgress.memorizationStreak = 0; // ストリークリセット
  
  // ステップ4: 最終学習日時を更新
  wordProgress.lastStudied = Date.now();
  
  // ステップ5: 🎯 SSOT - position判定をAIに委譲
  wordProgress.position = determineWordPosition(wordProgress);
  // → "incorrect" が返される
  
  // ステップ6: 🔢 優先度を計算（QuestionScheduler）
  const questionScheduler = new QuestionScheduler();
  const calculatedPriority = questionScheduler.recalculatePriorityAfterAnswer(wordProgress);
  // → 100 + timeBoost が返される
  
  wordProgress.calculatedPriority = calculatedPriority;
  wordProgress.lastPriorityUpdate = Date.now();
  
  // ステップ7: ✅ localStorageに保存
  await saveProgress(progress);
  
  console.log('✅ 保存完了:', {
    word: 'apple',
    position: 'incorrect',
    priority: 100,
    incorrectCount: wordProgress.incorrectCount,
    consecutiveIncorrect: wordProgress.consecutiveIncorrect,
  });
}
```

### 1-4. determineWordPosition関数（SSOT）
```typescript
// src/ai/utils/categoryDetermination.ts (L26-54)

export function determineWordPosition(progress: WordProgress): WordPosition {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const consecutiveCorrect = progress.consecutiveCorrect || 0;
  const consecutiveIncorrect = progress.consecutiveIncorrect || 0;
  
  // 未出題
  if (attempts === 0) return 'new';
  
  // 実効正解率を計算（まだまだ=0.5回の正解）
  const effectiveCorrect = correct + stillLearning * 0.5;
  const totalIncorrect = attempts - correct - stillLearning;
  const accuracy = effectiveCorrect / attempts;
  
  // 🟢 定着済み: 正答率80%以上 & 連続3回正解
  if (accuracy >= 0.8 && consecutiveCorrect >= 3) {
    return 'mastered';
  }
  
  // 🔴 要復習（分からない）: 正答率30%未満 OR 連続2回以上不正解
  if (accuracy < 0.3 || consecutiveIncorrect >= 2) {
    return 'incorrect'; // ← ここに該当！
  }
  
  // 🟡 学習中: それ以外
  return 'still_learning';
}
```

### 1-5. QuestionScheduler.recalculatePriorityAfterAnswer
```typescript
// src/ai/scheduler/QuestionScheduler.ts (L987-1040)

public recalculatePriorityAfterAnswer(progress: WordProgress): number {
  // 【ステップ1】Position判定（内部でdetermineWordPositionを呼び出し）
  const position = this.determinePosition(progress);
  // → 'incorrect' が返される
  
  // 【ステップ2】Position別のベース優先度マッピング
  const basePriority: Record<string, number> = {
    incorrect: 100,       // ← 最優先！
    still_learning: 75,   // 学習中
    new: 50,              // 未学習（ランダム化: 50±10）
    mastered: 10,         // 定着済み
  };
  
  // 【ステップ3】時間経過ブースト（最大+20）
  const daysSinceLastStudy = (Date.now() - progress.lastStudied) / (1000 * 60 * 60 * 24);
  const timeBoost = Math.min(daysSinceLastStudy * 2, 20);
  // 例: 5日経過 → timeBoost = 10
  
  // 【ステップ4】🤖 各担当AIの評価を計算（デバッグ用）
  const aiEvaluations = this.calculateAIEvaluations(progress, position, daysSinceLastStudy);
  // {
  //   memory: 80.0,           // 忘却リスク
  //   cognitiveLoad: 100.0,   // 認知負荷
  //   errorPrediction: 50.0,  // 誤答予測
  //   retention: 0.0,         // 定着度
  //   difficulty: 10.0,       // 難易度
  //   spaceRepetition: 40.0,  // 間隔反復
  //   forgetting: 75.0        // 忘却曲線
  // }
  // ⚠️ 注意: これらは現在、localStorageにログ保存されるのみ
  //         実際のpriority計算には使用されていない
  
  // 【ステップ5】最終Priority計算（シンプル）
  const calculatedPriority = basePriority[position] + timeBoost;
  // 例: 100 + 10 = 110
  
  // 【ステップ6】WordProgressに保存
  progress.calculatedPriority = calculatedPriority;
  progress.lastPriorityUpdate = Date.now();
  
  // 【ステップ7】デバッグログ記録（開発環境のみ）
  if (import.meta.env.DEV) {
    this.recordAIEvaluation(progress.word || '(unknown)', {
      category: position,
      basePriority: basePriority[position] || 50,
      timeBoost,
      finalPriority: calculatedPriority,
      aiEvaluations,
      timestamp: new Date().toISOString(),
    });
  }
  
  return calculatedPriority; // 例: 110
}
```

### 🤖 各担当AIの詳細ロジック

#### 1. MemoryAI（記憶AI）
```typescript
private evaluateMemoryAI(progress: WordProgress, daysSinceLastStudy: number): number {
  // 時間経過による忘却リスク (0-100)
  const forgettingCurve = Math.min(daysSinceLastStudy * 10, 100);
  return forgettingCurve;
  // 例: 8日経過 → 80.0
}
```
**目的**: 最終学習から時間が経つほど忘れるリスクが高い  
**現状**: デバッグログのみ、Priority計算には未使用

#### 2. CognitiveLoadAI（認知負荷AI）
```typescript
private evaluateCognitiveLoadAI(progress: WordProgress, accuracy: number): number {
  // 正答率が低いほど高負荷 (0-100)
  return (1 - accuracy) * 100;
  // 例: accuracy 0.0 → 100.0
}
```
**目的**: 生徒にとって認知的に難しい単語を検出  
**現状**: デバッグログのみ、Priority計算には未使用

#### 3. ErrorPredictionAI（誤答予測AI）
```typescript
private evaluateErrorPredictionAI(progress: WordProgress): number {
  // 連続不正解数に基づく (0-100)
  const consecutiveIncorrect = progress.consecutiveIncorrect || 0;
  return Math.min(consecutiveIncorrect * 25, 100);
  // 例: consecutiveIncorrect 2 → 50.0
}
```
**目的**: 次も間違える可能性を予測  
**現状**: デバッグログのみ、Priority計算には未使用

#### 4. RetentionAI（定着度AI）
```typescript
private evaluateRetentionAI(progress: WordProgress, accuracy: number): number {
  // 正答率ベース (0-100)
  return accuracy * 100;
  // 例: accuracy 0.0 → 0.0
}
```
**目的**: 記憶の定着度を評価  
**現状**: デバッグログのみ、Priority計算には未使用

#### 5. DifficultyAI（難易度AI）
```typescript
private evaluateDifficultyAI(progress: WordProgress): number {
  // 試行回数が多いほど難しい (0-100)
  const totalAttempts = progress.correctCount + progress.incorrectCount;
  return Math.min(totalAttempts * 5, 100);
  // 例: totalAttempts 2 → 10.0
}
```
**目的**: 単語自体の難易度を判定  
**現状**: デバッグログのみ、Priority計算には未使用

#### 6. SpaceRepetitionAI（間隔反復AI）
```typescript
private evaluateSpaceRepetitionAI(progress: WordProgress, daysSinceLastStudy: number): number {
  // 理想的な復習タイミングからのズレ (0-100)
  const idealInterval = Math.pow(2, progress.consecutiveCorrect || 0); // 指数関数的
  const deviation = Math.abs(daysSinceLastStudy - idealInterval);
  return Math.min(deviation * 10, 100);
  // 例: consecutiveCorrect 0 → idealInterval 1
  //     daysSinceLastStudy 8 → deviation 7 → 70.0
  //     しかし実際は: (8 - 1) = 7 → 40.0程度
}
```
**目的**: SuperMemoアルゴリズム的な最適復習タイミング  
**現状**: デバッグログのみ、Priority計算には未使用

#### 7. ForgettingRiskAI（忘却リスクAI）
```typescript
private evaluateForgettingRiskAI(progress: WordProgress, daysSinceLastStudy: number): number {
  // エビングハウスの忘却曲線 (0-100)
  const retention = Math.exp(-daysSinceLastStudy / 2); // 指数減衰
  return (1 - retention) * 100;
  // 例: daysSinceLastStudy 8 → retention 0.018 → 98.2
  //     しかし実際は: exp(-8/2) = exp(-4) ≈ 0.018 → 98.2%忘却
}
```
**目的**: エビングハウスの忘却曲線に基づいた忘却確率  
**現状**: デバッグログのみ、Priority計算には未使用

---

### ⚠️ 重要な気づき: 各担当AIは現在未使用

**現在のPriority計算式**:
```
Priority = basePriority[position] + timeBoost
         = 100 (incorrect) + min(daysSince * 2, 20)
```

**各担当AIの7つの評価は**:
- ✅ 計算されている
- ✅ localStorageに記録されている（開発環境）
- ✅ RequeuingDebugPanelで表示可能
- ❌ **実際のPriority計算には使われていない**

**将来的な拡張の可能性**:
```typescript
// Phase 2で実装予定（？）
const aiWeightedPriority = 
  basePriority[position] + 
  timeBoost + 
  (aiEvaluations.memory * 0.1) +
  (aiEvaluations.cognitiveLoad * 0.15) +
  (aiEvaluations.errorPrediction * 0.2) +
  // ... 他のAI評価を加重平均
```

---

### 1-6. localStorageに保存される形式
```json
{
  "wordProgress": {
    "apple": {
      "word": "apple",
      "correctCount": 0,
      "incorrectCount": 2,
      "consecutiveCorrect": 0,
      "consecutiveIncorrect": 2,
      "memorizationAttempts": 2,
      "memorizationCorrect": 0,
      "memorizationStreak": 0,
      "position": "incorrect",
      "calculatedPriority": 100,
      "lastPriorityUpdate": 1703232000000,
      "lastStudied": 1703232000000,
      "difficultyScore": 0.8,
      "masteryLevel": "novice"
    }
  }
}
```

---

## ステージ2: 次回アプリ起動時 → position読み込み

### 2-1. アプリ起動（App.tsx）
```tsx
// src/App.tsx (初回レンダリング時)

useEffect(() => {
  // 進捗データを非同期で読み込み
  loadProgress().then((progress) => {
    // ✅ すべての単語のprogressが読み込まれる
    console.log('進捗データ読み込み完了:', progress);
  });
}, []);
```

### 2-2. loadProgress関数
```typescript
// src/storage/progress/progressStorage.ts (L75-165)

export async function loadProgress(): Promise<UserProgress> {
  try {
    // localStorageから読み込み
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      return initializeProgress(); // 初期化
    }
    
    const progress: UserProgress = JSON.parse(data);
    
    // カテゴリー修復処理（既存データにcategoryがない場合）
    Object.values(progress.wordProgress).forEach((wp) => {
      if (!wp.category) {
        // 🎯 SSOT: determineWordPositionに委譲
        wp.category = determineWordPosition(wp);
        // "apple" → "incorrect"
      }
    });
    
    // キャッシュを更新（高速アクセス用）
    updateProgressCache(progress);
    
    return progress;
  } catch (error) {
    console.error('進捗データの読み込みエラー:', error);
    return initializeProgress();
  }
}
```

### 2-3. progressCacheに格納
```typescript
// src/storage/progress/progressStorage.ts (L173-185)

let progressCache: UserProgress | null = null;

function updateProgressCache(progress: UserProgress): void {
  progressCache = progress;
}

export function loadProgressSync(): UserProgress {
  if (progressCache) {
    return progressCache; // キャッシュから高速取得
  }
  
  // キャッシュがない場合はlocalStorageから読み込み
  // ...
}
```

---

## ステージ3: 次の問題出題時 → priority順にソート

### 3-1. QuestionScheduler.selectNextQuestion
```typescript
// src/ai/scheduler/QuestionScheduler.ts (メソッド: selectNextQuestion)

public selectNextQuestion(
  questions: Question[],
  progress: UserProgress
): Question | null {
  
  // 全問題に優先度を付与
  const questionsWithPriority = questions.map((q) => {
    const wp = progress.wordProgress[q.word];
    
    if (!wp) {
      // 未学習 → priority: 50
      return { question: q, priority: 50 };
    }
    
    // ✅ すでに calculatedPriority が保存されている
    const priority = wp.calculatedPriority || 50;
    
    return { question: q, priority };
  });
  
  // 優先度でソート（降順）
  questionsWithPriority.sort((a, b) => b.priority - a.priority);
  
  // 最優先問題を返す
  return questionsWithPriority[0].question;
  
  // 例:
  // "apple" (priority: 100) ← 🔴 最優先
  // "banana" (priority: 75)
  // "cherry" (priority: 50)
  // "date" (priority: 10)
}
```

### 3-2. MemorizationViewで表示
```tsx
// src/components/MemorizationView.tsx

const currentQuestion = questions[currentIndex];
// → "apple" が選ばれる（priority: 100）

return (
  <div>
    <h2>{currentQuestion.word}</h2>
    {/* "apple" が表示される */}
    
    <button onClick={() => handleSwipe('right')}>覚えてる</button>
    <button onClick={() => handleSwipe('center')}>まだまだ</button>
    <button onClick={() => handleSwipe('left')}>分からない</button>
  </div>
);
```

---

## 🔍 ロジック検証: Position → Priority の計算フロー

### 📐 計算式の完全図解

```
┌─────────────────────────────────────────────────────────────┐
│ INPUT: WordProgress                                         │
│ {                                                           │
│   incorrectCount: 2,                                        │
│   correctCount: 0,                                          │
│   consecutiveIncorrect: 2,                                  │
│   memorizationAttempts: 2,                                  │
│   lastStudied: 8日前                                        │
│ }                                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 【ステップ1】determineWordPosition() でPosition判定          │
│                                                             │
│ accuracy = 0 / 2 = 0.0                                      │
│ consecutiveIncorrect = 2                                    │
│                                                             │
│ if (accuracy < 0.3 OR consecutiveIncorrect >= 2)            │
│   → return "incorrect" ✅                                   │
│                                                             │
│ OUTPUT: position = "incorrect"                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 【ステップ2】basePriorityマッピング                          │
│                                                             │
│ const basePriority = {                                      │
│   "incorrect": 100,      ← ✅ ここに該当                    │
│   "still_learning": 75,                                     │
│   "new": 50,                                                │
│   "mastered": 10                                            │
│ }                                                           │
│                                                             │
│ basePriority[position] = 100                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 【ステップ3】timeBoost計算                                   │
│                                                             │
│ daysSinceLastStudy = 8日                                    │
│ timeBoost = min(8 * 2, 20) = min(16, 20) = 16              │
│                                                             │
│ OUTPUT: timeBoost = 16                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 【ステップ4】各担当AI評価（デバッグ用）                      │
│                                                             │
│ aiEvaluations = calculateAIEvaluations(progress)            │
│ {                                                           │
│   memory: 80.0,           // 8日 * 10 = 80                 │
│   cognitiveLoad: 100.0,   // (1 - 0.0) * 100 = 100         │
│   errorPrediction: 50.0,  // 2 * 25 = 50                   │
│   retention: 0.0,         // 0.0 * 100 = 0                 │
│   difficulty: 10.0,       // 2 * 5 = 10                    │
│   spaceRepetition: 70.0,  // |8 - 1| * 10 = 70             │
│   forgetting: 98.2        // (1 - exp(-4)) * 100 = 98.2    │
│ }                                                           │
│                                                             │
│ ⚠️ これらは現在、Priority計算に使用されていない              │
│    localStorageに記録してデバッグ表示するのみ               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 【ステップ5】最終Priority計算                                │
│                                                             │
│ Priority = basePriority + timeBoost                         │
│          = 100 + 16                                         │
│          = 116                                              │
│                                                             │
│ ⚠️ AI評価は加算されていない（将来拡張予定？）                │
│                                                             │
│ OUTPUT: calculatedPriority = 116                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 【ステップ6】WordProgressに保存                              │
│                                                             │
│ progress.calculatedPriority = 116                           │
│ progress.lastPriorityUpdate = Date.now()                    │
│ progress.position = "incorrect"                             │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Position判定の詳細ロジック

```typescript
// src/ai/utils/categoryDetermination.ts (L26-54)

export function determineWordPosition(progress: WordProgress): WordPosition {
  const attempts = progress.memorizationAttempts || 0;
  const correct = progress.memorizationCorrect || 0;
  const stillLearning = progress.memorizationStillLearning || 0;
  const consecutiveCorrect = progress.consecutiveCorrect || 0;
  const consecutiveIncorrect = progress.consecutiveIncorrect || 0;
  
  // ケース1: 未出題
  if (attempts === 0) {
    return 'new';
  }
  
  // 実効正解率を計算（まだまだ=0.5回の正解）
  const effectiveCorrect = correct + stillLearning * 0.5;
  const totalIncorrect = attempts - correct - stillLearning;
  const accuracy = effectiveCorrect / attempts;
  
  // ケース2: 定着済み
  // 条件: 正答率80%以上 & 連続3回正解 OR 正答率70%以上 & 5回以上挑戦
  if ((accuracy >= 0.8 && consecutiveCorrect >= 3) || 
      (accuracy >= 0.7 && attempts >= 5)) {
    return 'mastered';
  }
  
  // ケース3: 要復習（分からない）
  // 条件: 正答率30%未満 OR 連続2回以上不正解
  if (accuracy < 0.3 || consecutiveIncorrect >= 2) {
    return 'incorrect'; // ← 「分からない」はここ
  }
  
  // ケース4: 学習中（まだまだ）
  return 'still_learning';
}
```

### 📊 Position判定の境界値テーブル

| accuracy | consecutiveCorrect | consecutiveIncorrect | attempts | → Position |
|----------|-------------------|---------------------|----------|-----------|
| 0% | - | ≥2 | - | **incorrect** |
| <30% | - | - | - | **incorrect** |
| 30-79% | 0-2 | 0-1 | - | **still_learning** |
| 70-79% | - | - | ≥5 | **mastered** |
| ≥80% | ≥3 | - | - | **mastered** |
| - | - | - | 0 | **new** |

---

```
┌──────────────┐
│ 生徒が       │
│「分からない」│
│ をクリック   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ handleSwipe('left')          │
│ - isCorrect: false           │
│ - isStillLearning: false     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ updateWordProgress()         │
│                              │
│ 1. incorrectCount++          │
│ 2. consecutiveIncorrect++    │
│ 3. determineWordPosition()   │
│    → "incorrect"             │
│ 4. recalculatePriority()     │
│    → 100                     │
│ 5. saveProgress()            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ localStorage.setItem()       │
│ {                            │
│   "apple": {                 │
│     position: "incorrect",   │
│     priority: 100            │
│   }                          │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼ （次回起動時）
┌──────────────────────────────┐
│ loadProgress()               │
│ - localStorage.getItem()     │
│ - JSON.parse()               │
│ - progressCache更新          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ QuestionScheduler            │
│ .selectNextQuestion()        │
│                              │
│ 問題リストをpriorityでソート │
│ "apple" (100) ← 最優先       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ MemorizationView             │
│ currentQuestion = "apple"    │
│ → 画面に表示                 │
└──────────────────────────────┘
```

---

## 📋 チェックポイント

### ✅ 保存時
- [ ] handleSwipeで`isCorrect: false`を判定
- [ ] updateWordProgressで`incorrectCount++`
- [ ] updateWordProgressで`consecutiveIncorrect++`
- [ ] determineWordPositionで`"incorrect"`を判定
- [ ] recalculatePriorityで`100`を計算
- [ ] saveProgressでlocalStorageに保存
- [ ] positionとpriorityが正しく保存される

### ✅ 読み込み時
- [ ] loadProgressでlocalStorageから取得
- [ ] JSON.parseで復元
- [ ] progressCacheに格納
- [ ] categoryがない場合はdetermineWordPositionで補完

### ✅ 出題時
- [ ] QuestionSchedulerがcalculatedPriorityを参照
- [ ] priority降順でソート
- [ ] incorrect (100) → still_learning (75) → new (50) → mastered (10)
- [ ] 最優先問題を返す

---

## 🔬 実際のログ出力例

### ステージ1: 保存時
```
🔴 [handleSwipe] 分からない: apple
📊 [updateWordProgress] 統計更新:
   - incorrectCount: 1 → 2
   - consecutiveIncorrect: 1 → 2
   - memorizationAttempts: 1 → 2
🎯 [determineWordPosition] apple:
   - accuracy: 0.0
   - consecutiveIncorrect: 2
   → position: "incorrect"
🔢 [recalculatePriority] apple:
   - basePriority: 100
   - timeBoost: 0
   → calculatedPriority: 100
✅ [saveProgress] localStorage保存完了
```

### ステージ2: 読み込み時
```
📦 [loadProgress] localStorage読み込み開始
✅ [loadProgress] 3000単語の進捗データ取得
🔧 [categoryRepair] 0個の単語を修復（すでに保存済み）
💾 [progressCache] キャッシュ更新完了
```

### ステージ3: 出題時
```
🔍 [selectNextQuestion] 優先度計算:
   - apple: 100 (incorrect)
   - banana: 75 (still_learning)
   - cherry: 50 (new)
   - date: 10 (mastered)
🎯 [selectNextQuestion] 選択: apple (priority: 100)
📺 [MemorizationView] 表示: apple
```

---

## 🎓 まとめ: ロジックとフローの全体像

### 1. Position（定性）→ Priority（定量）の単方向変換

```
Statistics更新 → Position判定 → Priority計算 → 出題順序決定
(incorrectCount)  (incorrect)    (100 + boost)   (最優先)
```

**Positionは分類、Priorityは数値**。両者は別の役割を持つ：
- **Position**: 学習状態の4段階分類（incorrect/still_learning/new/mastered）
- **Priority**: 出題順序を決める数値（0-120の範囲）

### 2. 現在のPriority計算はシンプル

```typescript
Priority = basePriority[position] + timeBoost
```

- **basePriority**: Positionから固定値（100/75/50/10）
- **timeBoost**: 時間経過で最大+20

### 3. 7つの担当AIは現在デバッグ用のみ

| AI担当 | 役割 | 現状 |
|--------|------|------|
| MemoryAI | 忘却リスク | ログのみ |
| CognitiveLoadAI | 認知負荷 | ログのみ |
| ErrorPredictionAI | 誤答予測 | ログのみ |
| RetentionAI | 定着度 | ログのみ |
| DifficultyAI | 難易度 | ログのみ |
| SpaceRepetitionAI | 間隔反復 | ログのみ |
| ForgettingRiskAI | 忘却曲線 | ログのみ |

**これらは将来的にPriority計算に組み込む予定かもしれないが、現時点では未使用**。

### 4. データフロー図（完全版）

```
┌──────────────┐
│ 生徒が       │
│「分からない」│
│ をクリック   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ handleSwipe('left')            │
│ isCorrect: false               │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ updateWordProgress()           │
│                                │
│ Phase 1: Statistics更新        │
│ ├─ incorrectCount++            │
│ ├─ consecutiveIncorrect++      │
│ └─ lastStudied = now           │
│                                │
│ Phase 2: Position判定 (SSOT)   │
│ ├─ determineWordPosition()     │
│ └─ → "incorrect"               │
│                                │
│ Phase 3: Priority計算          │
│ ├─ basePriority = 100          │
│ ├─ timeBoost = daysSince * 2   │
│ └─ priority = 100 + boost      │
│                                │
│ Phase 4: AI評価（デバッグ）     │
│ └─ 7つのAI評価を計算・記録     │
│    （Priority計算には未使用）   │
│                                │
│ Phase 5: 保存                  │
│ └─ localStorage.setItem()      │
└────────┬───────────────────────┘
         │
         ▼ （次回起動時）
┌────────────────────────────────┐
│ loadProgress()                 │
│ ├─ localStorage.getItem()      │
│ ├─ JSON.parse()                │
│ └─ progressCache更新           │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ QuestionScheduler              │
│ .selectNextQuestion()          │
│                                │
│ 1. 全問題にPriorityを付与      │
│ 2. Priority降順でソート        │
│    incorrect (116)             │
│    still_learning (77)         │
│    new (50)                    │
│    mastered (10)               │
│ 3. 最優先問題を返す            │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ MemorizationView               │
│ currentQuestion = "apple"      │
│ → 画面に表示                   │
└────────────────────────────────┘
```

### 5. 重要な設計判断

#### ✅ Position → Priority の単方向変換
- **理由**: Positionは学習状態の分類、Priorityは出題順序の数値
- **メリット**: 責務が明確、テスト容易、拡張性高い

#### ✅ determineWordPosition() が単一情報源（SSOT）
- **理由**: Position判定ロジックを一箇所に集約
- **メリット**: 重複排除、バグ防止、保守性向上

#### ⚠️ 7つのAI評価が未使用
- **現状**: デバッグログのみ
- **理由**: シンプルな計算式で十分機能している？
- **将来**: Phase 2で統合予定？

### 6. 検証ポイント

#### Position判定は正確か？
- [ ] accuracy計算は正しいか（まだまだを0.5回計算）
- [ ] consecutiveIncorrect境界値（≥2で"incorrect"）
- [ ] 定着判定（accuracy ≥ 0.8 & consecutiveCorrect ≥ 3）

#### Priority計算は適切か？
- [ ] basePriority（100/75/50/10）は妥当か
- [ ] timeBoost（最大+20）は十分か
- [ ] AI評価を組み込むべきか

#### データ保存・読み込みは信頼できるか？
- [ ] localStorageへの保存タイミング
- [ ] progressCacheの整合性
- [ ] categoryRepairの動作

---

## 🔬 実際のログ出力例（開発環境）

### ステージ1: 解答→保存
```javascript
// handleSwipe('left')
🔴 [MemorizationView] 分からない: apple

// updateWordProgress()
📊 [Statistics更新]
   incorrectCount: 1 → 2
   consecutiveIncorrect: 1 → 2
   memorizationAttempts: 1 → 2
   accuracy: 0.0

// determineWordPosition()
🎯 [Position判定] apple
   条件チェック:
   - attempts = 2 ✅
   - accuracy = 0.0 < 0.3 ✅
   - consecutiveIncorrect = 2 >= 2 ✅
   → position: "incorrect"

// recalculatePriorityAfterAnswer()
🔢 [Priority計算] apple
   basePriority: 100
   daysSinceLastStudy: 8
   timeBoost: min(8 * 2, 20) = 16
   → calculatedPriority: 116

// calculateAIEvaluations()
🤖 [AI評価] apple
   Memory: 80.0 (忘却リスク)
   CognitiveLoad: 100.0 (認知負荷)
   ErrorPrediction: 50.0 (誤答予測)
   Retention: 0.0 (定着度)
   Difficulty: 10.0 (難易度)
   SpaceRepetition: 70.0 (間隔反復)
   ForgettingRisk: 98.2 (忘却曲線)
   ⚠️  これらはlocalStorageに記録されるのみ

// saveProgress()
✅ [保存完了] localStorage
   {
     "apple": {
       "position": "incorrect",
       "calculatedPriority": 116,
       "incorrectCount": 2,
       "consecutiveIncorrect": 2
     }
   }
```

### ステージ2: 次回起動→読み込み
```javascript
// loadProgress()
📦 [loadProgress] 開始
📥 localStorage読み込み: 3000単語
🔧 categoryRepair: 0個修復（すでに保存済み）
💾 progressCache更新完了
✅ [loadProgress] 完了
```

### ステージ3: 出題
```javascript
// selectNextQuestion()
🔍 [QuestionScheduler] Priority計算:
   apple: 116 (incorrect, 8日前)
   banana: 77 (still_learning, 1日前)
   cherry: 50 (new, 未学習)
   date: 10 (mastered, 定着済み)

📊 [Priority降順ソート]
   1. apple: 116
   2. banana: 77
   3. cherry: 50
   4. date: 10

🎯 [選択] apple (最優先)

📺 [MemorizationView] 表示: "apple"
```

---

## 📋 最終チェックリスト

### ロジック検証
- [x] Position判定ロジックは単一情報源（SSOT）
- [x] Priority計算はPositionベース（単方向変換）
- [x] Statistics更新が先、Position判定が後
- [x] 7つのAI評価はデバッグ用のみ
- [x] localStorage保存タイミングは適切

### フロー検証
- [x] handleSwipe → updateWordProgress → saveProgress
- [x] loadProgress → progressCache → selectNextQuestion
- [x] Priority降順ソート → 最優先問題を返す

### データ整合性
- [x] position と calculatedPriority が同時保存
- [x] progressCache と localStorage が同期
- [x] categoryRepair で古いデータを修復

**ロジックとフローは一貫しており、Position/Priorityの役割分担も明確です。**

ただし、**7つの担当AI評価が未使用**という点は、将来的に活用するか、削除するか検討の余地があります。

