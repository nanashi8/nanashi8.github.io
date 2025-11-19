# 適応的学習AI・進捗管理システム仕様書

## 📌 概要

ユーザーの学習進捗を追跡し、AIによる適応的な問題選択と学習支援を提供するシステム。

**作成日**: 2025年11月19日  
**最終更新**: 2025年11月19日

## 🎯 機能要件

### 主要機能

1. **進捗追跡（progressStorage.ts）**
   - ユーザーの回答履歴を記録
   - 単語ごとの習熟度を管理
   - カテゴリー・難易度別の統計を集計

2. **適応的学習（adaptiveLearningAI.ts）**
   - 間隔反復学習スケジュールの生成
   - 記憶保持率の計算
   - 復習タイミングの最適化

3. **学習アシスタント（learningAssistant.ts）**
   - スキップされた単語の管理
   - 弱点単語の優先的出題
   - AI人格によるコメント生成

4. **レーダーチャート分析（radarChartAI.ts）**
   - カテゴリー別の弱点分析
   - 改善プランの自動生成
   - 学習進捗の可視化

5. **言語学的関連性（linguisticRelationsAI.ts）**
   - 語源・語根による関連語抽出
   - 意味分野による関連付け
   - 効率的な語彙習得支援

## 📊 データ構造

### UserProgress型

```typescript
interface UserProgress {
  userId: string;
  totalQuizzes: number;
  totalCorrect: number;
  totalIncorrect: number;
  quizResults: QuizResult[];
  wordProgress: {
    [word: string]: WordProgress;
  };
  lastUpdated: number;
}
```

### WordProgress型

```typescript
interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  lastStudied: number;
  masteryLevel: 'new' | 'learning' | 'mastered';
  reviewCount: number;
  skipCount: number;
  isSkipExcluded: boolean;
  difficultyRating?: number;
}
```

### QuizResult型

```typescript
interface QuizResult {
  id: string;
  timestamp: number;
  mode: 'translation' | 'spelling' | 'reading';
  score: number;
  total: number;
  accuracy: number;
  category: string;
  difficulty: string;
  wordResults: WordResult[];
  timeSpent: number;
}
```

### WordResult型

```typescript
interface WordResult {
  word: string;
  meaning: string;
  isCorrect: boolean;
  attemptCount: number;
  responseTime: number;
  category: string;
  difficulty: string;
}
```

### SpacedRepetitionSchedule型

```typescript
interface SpacedRepetitionSchedule {
  word: string;
  lastReview: number;
  nextReview: number;
  interval: number;
  repetitionCount: number;
  easinessFactor: number;
  memoryRetention: number;
}
```

## 🔧 実装詳細

### 1. 進捗追跡システム（progressStorage.ts）

#### 主要関数

**loadProgress()**
```typescript
export function loadProgress(): UserProgress {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) return getDefaultProgress();
    
    const progress = JSON.parse(data);
    
    // 自動圧縮: 30日以上前のデータを削除
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    progress.quizResults = progress.quizResults.filter(
      (r: QuizResult) => r.timestamp > thirtyDaysAgo
    );
    
    return progress;
  } catch (error) {
    console.error('進捗読み込みエラー:', error);
    return getDefaultProgress();
  }
}
```

**addQuizResult()**
```typescript
export function addQuizResult(result: QuizResult): void {
  const progress = loadProgress();
  
  progress.quizResults.push(result);
  progress.totalQuizzes++;
  progress.totalCorrect += result.score;
  progress.totalIncorrect += result.total - result.score;
  progress.lastUpdated = Date.now();
  
  saveProgress(progress);
}
```

**updateWordProgress()**
```typescript
export function updateWordProgress(
  word: string,
  isCorrect: boolean,
  category: string,
  difficulty: string,
  responseTime: number
): void {
  const progress = loadProgress();
  
  if (!progress.wordProgress[word]) {
    progress.wordProgress[word] = {
      word,
      correctCount: 0,
      incorrectCount: 0,
      lastStudied: Date.now(),
      masteryLevel: 'new',
      reviewCount: 0,
      skipCount: 0,
      isSkipExcluded: false,
    };
  }
  
  const wordProg = progress.wordProgress[word];
  
  if (isCorrect) {
    wordProg.correctCount++;
  } else {
    wordProg.incorrectCount++;
  }
  
  wordProg.lastStudied = Date.now();
  wordProg.reviewCount++;
  
  // 習熟度の更新
  const totalAttempts = wordProg.correctCount + wordProg.incorrectCount;
  const accuracy = wordProg.correctCount / totalAttempts;
  
  if (totalAttempts >= 5 && accuracy >= 0.8) {
    wordProg.masteryLevel = 'mastered';
  } else if (totalAttempts >= 2) {
    wordProg.masteryLevel = 'learning';
  }
  
  saveProgress(progress);
}
```

### 2. 間隔反復学習（adaptiveLearningAI.ts）

#### SM-2アルゴリズム実装

**generateSpacedRepetitionSchedule()**
```typescript
export function generateSpacedRepetitionSchedule(
  word: string,
  isCorrect: boolean,
  previousSchedule?: SpacedRepetitionSchedule
): SpacedRepetitionSchedule {
  const now = Date.now();
  
  if (!previousSchedule) {
    // 初回学習
    return {
      word,
      lastReview: now,
      nextReview: now + 24 * 60 * 60 * 1000, // 1日後
      interval: 1,
      repetitionCount: 1,
      easinessFactor: 2.5,
      memoryRetention: isCorrect ? 0.9 : 0.5,
    };
  }
  
  const { repetitionCount, easinessFactor } = previousSchedule;
  
  // イージネスファクターの更新
  let newEF = easinessFactor;
  if (isCorrect) {
    newEF = Math.max(1.3, easinessFactor + 0.1);
  } else {
    newEF = Math.max(1.3, easinessFactor - 0.2);
  }
  
  // 次回復習までの間隔を計算
  let newInterval: number;
  if (!isCorrect) {
    newInterval = 1; // 不正解の場合は1日後に再復習
  } else if (repetitionCount === 1) {
    newInterval = 6; // 2回目は6日後
  } else {
    newInterval = Math.round(previousSchedule.interval * newEF);
  }
  
  return {
    word,
    lastReview: now,
    nextReview: now + newInterval * 24 * 60 * 60 * 1000,
    interval: newInterval,
    repetitionCount: isCorrect ? repetitionCount + 1 : 1,
    easinessFactor: newEF,
    memoryRetention: calculateMemoryRetention(newInterval),
  };
}
```

**calculateMemoryRetention()**
```typescript
export function calculateMemoryRetention(daysSinceStudy: number): number {
  // エビングハウスの忘却曲線を近似
  const retentionRate = Math.exp(-daysSinceStudy / 7);
  return Math.max(0, Math.min(1, retentionRate));
}
```

### 3. 学習アシスタント（learningAssistant.ts）

#### スキップ管理

**recordWordSkip()**
```typescript
export function recordWordSkip(
  word: string,
  category: string,
  difficulty: string
): void {
  const progress = loadProgress();
  
  if (!progress.wordProgress[word]) {
    progress.wordProgress[word] = {
      word,
      correctCount: 0,
      incorrectCount: 0,
      lastStudied: Date.now(),
      masteryLevel: 'new',
      reviewCount: 0,
      skipCount: 0,
      isSkipExcluded: false,
    };
  }
  
  const wordProg = progress.wordProgress[word];
  wordProg.skipCount++;
  
  // 3回以上スキップしたら出題から除外
  if (wordProg.skipCount >= 3) {
    wordProg.isSkipExcluded = true;
    addToSkipGroup(word, category, difficulty);
  }
  
  saveProgress(progress);
}
```

**filterSkippedWords()**
```typescript
export function filterSkippedWords<T extends { word: string }>(
  questions: T[]
): T[] {
  const progress = loadProgress();
  return questions.filter(q => {
    const wordProg = progress.wordProgress[q.word];
    return !wordProg || !wordProg.isSkipExcluded;
  });
}
```

### 4. レーダーチャート分析（radarChartAI.ts）

**analyzeRadarChart()**
```typescript
export function analyzeRadarChart(
  allQuestions: Question[],
  categoryList: string[]
): RadarChartAnalysis {
  const progress = loadProgress();
  const categoryStats = getStatsByCategory();
  
  const weakCategories: WeakCategory[] = [];
  const categoryScores: { [category: string]: number } = {};
  
  categoryList.forEach(category => {
    const stats = categoryStats.get(category);
    const accuracy = stats ? stats.accuracy : 0;
    categoryScores[category] = accuracy;
    
    if (accuracy < 60) {
      weakCategories.push({
        category,
        accuracy,
        totalStudied: stats?.totalCount || 0,
        priority: 100 - accuracy,
      });
    }
  });
  
  // 優先度順にソート
  weakCategories.sort((a, b) => b.priority - a.priority);
  
  return {
    categoryScores,
    weakCategories,
    overallAccuracy: calculateOverallAccuracy(),
    aiRecommendations: generateRecommendations(weakCategories),
  };
}
```

### 5. AI人格システム（aiCommentGenerator.ts）

#### AI人格タイプ

```typescript
export type AIPersonality = 
  | 'drill-sergeant'     // 鬼軍曹（厳しい）
  | 'kind-teacher'       // 優しい先生
  | 'analyst'            // 冷静な分析官
  | 'enthusiastic-coach' // 熱血コーチ
  | 'wise-sage';         // 賢者
```

**generateComment()**
```typescript
export function generateComment(
  context: CommentContext,
  personality: AIPersonality
): string {
  const { isCorrect, correctStreak, word, difficulty } = context;
  
  switch (personality) {
    case 'drill-sergeant':
      if (isCorrect) {
        if (correctStreak >= 5) {
          return `よし！${correctStreak}連続正解だ！この調子を維持しろ！`;
        }
        return `まあまあだな。次も気を抜くな。`;
      } else {
        return `何をやっている！"${word}"は基本中の基本だぞ！気合を入れろ！`;
      }
      
    case 'kind-teacher':
      if (isCorrect) {
        return `素晴らしいです！"${word}"の意味をしっかり理解できていますね。`;
      } else {
        return `大丈夫、次は正解できますよ。"${word}"の語源を思い出してみましょう。`;
      }
      
    case 'analyst':
      const accuracy = context.userAccuracy.toFixed(1);
      if (isCorrect) {
        return `正解です。現在の正答率は${accuracy}%です。統計的に順調な進捗です。`;
      } else {
        return `不正解。"${word}"は${context.previousAttempts}回目の挑戦です。復習を推奨します。`;
      }
      
    // ... 他の人格タイプ
  }
}
```

## 🎨 UI統合

### 統計表示（StatsView.tsx）

```typescript
<div className="stats-container">
  <h2>学習統計</h2>
  
  {/* 全体統計 */}
  <div className="overall-stats">
    <div>総クイズ数: {progress.totalQuizzes}</div>
    <div>正答数: {progress.totalCorrect}</div>
    <div>誤答数: {progress.totalIncorrect}</div>
    <div>正答率: {overallAccuracy}%</div>
  </div>
  
  {/* カテゴリー別レーダーチャート */}
  <CategoryRadarChart data={categoryScores} />
  
  {/* 弱点カテゴリー */}
  <div className="weak-categories">
    <h3>強化推奨カテゴリー</h3>
    {weakCategories.map(wc => (
      <div key={wc.category}>
        {wc.category}: {wc.accuracy.toFixed(1)}%
      </div>
    ))}
  </div>
  
  {/* 最近の学習履歴 */}
  <div className="recent-results">
    {recentResults.map(result => (
      <div key={result.id}>
        {new Date(result.timestamp).toLocaleDateString()}
        - {result.mode}: {result.accuracy}%
      </div>
    ))}
  </div>
</div>
```

### 設定画面（SettingsView.tsx）

```typescript
<div className="settings-container">
  <h2>設定</h2>
  
  {/* AI人格選択 */}
  <div className="setting-group">
    <label>AI人格タイプ</label>
    <select value={aiPersonality} onChange={handlePersonalityChange}>
      <option value="drill-sergeant">🎖️ 鬼軍曹</option>
      <option value="kind-teacher">👩‍🏫 優しい先生</option>
      <option value="analyst">📊 冷静な分析官</option>
      <option value="enthusiastic-coach">🔥 熱血コーチ</option>
      <option value="wise-sage">🧙 賢者</option>
    </select>
  </div>
  
  {/* 適応的学習モード */}
  <div className="setting-group">
    <label>
      <input
        type="checkbox"
        checked={adaptiveMode}
        onChange={e => setAdaptiveMode(e.target.checked)}
      />
      適応的学習モード（弱点を重点的に出題）
    </label>
  </div>
  
  {/* 自動進行設定 */}
  <div className="setting-group">
    <label>
      <input
        type="checkbox"
        checked={autoAdvance}
        onChange={e => setAutoAdvance(e.target.checked)}
      />
      自動進行
    </label>
    <input
      type="range"
      min="0.5"
      max="3"
      step="0.5"
      value={autoAdvanceDelay}
      onChange={e => setAutoAdvanceDelay(Number(e.target.value))}
    />
    <span>{autoAdvanceDelay}秒</span>
  </div>
  
  {/* データ管理 */}
  <div className="setting-group">
    <button onClick={handleExportProgress}>進捗データをエクスポート</button>
    <button onClick={handleImportProgress}>進捗データをインポート</button>
    <button onClick={handleClearProgress}>進捗データをクリア</button>
  </div>
</div>
```

## 💾 LocalStorage管理

### データ圧縮戦略

LocalStorageの容量制限（約5MB）に対応するため、以下の戦略を実装：

1. **自動圧縮**: 30日以上前のデータを自動削除
2. **選択的保存**: 重要な単語の進捗のみ保持
3. **警告表示**: 4MB以上で警告を表示

```typescript
function checkLocalStorageSize() {
  let totalSize = 0;
  const details: { key: string; size: number }[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        totalSize += size;
        details.push({ key, size });
      }
    }
  }
  
  const totalMB = totalSize / (1024 * 1024);
  
  if (totalMB > 4) {
    console.warn('⚠️ LocalStorageの使用量が多いため、古いデータを自動削除しています。');
    const progress = loadProgress(); // 自動圧縮を実行
  }
}
```

## 📈 学習効果の測定

### 指標

1. **正答率**: 全体・カテゴリー別・難易度別
2. **習熟単語数**: new / learning / mastered の分類
3. **学習時間**: 日別・週別の累積
4. **記憶定着率**: 間隔反復学習による予測値

### データエクスポート

```typescript
export function exportProgress(): string {
  const progress = loadProgress();
  return JSON.stringify(progress, null, 2);
}
```

## 🔄 機能復元手順

### 進捗追跡システムの復元

1. `src/progressStorage.ts` を作成
2. 上記の `loadProgress()`, `saveProgress()`, `addQuizResult()` を実装
3. `App.tsx` で進捗追跡を統合:

```typescript
import { addQuizResult, updateWordProgress } from './progressStorage';

const handleAnswer = (answer: string, correct: string) => {
  const isCorrect = answer === correct;
  const responseTime = Date.now() - questionStartTimeRef.current;
  
  // 進捗を記録
  updateWordProgress(
    currentQuestion.word,
    isCorrect,
    currentQuestion.category,
    currentQuestion.difficulty,
    responseTime
  );
  
  // ... 既存の処理
};
```

### 統計画面の復元

1. `src/components/StatsView.tsx` を作成
2. レーダーチャートコンポーネントを実装
3. `App.tsx` にタブとして追加:

```typescript
<button
  className={activeTab === 'stats' ? 'active' : ''}
  onClick={() => setActiveTab('stats')}
>
  📊 統計
</button>

{activeTab === 'stats' && (
  <StatsView allQuestions={allQuestions} categoryList={categoryList} />
)}
```

## 📝 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-11-19 | 初版作成 |
