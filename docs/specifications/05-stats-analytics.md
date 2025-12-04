# 05. 統計・分析機能

## 📌 概要

学習進捗を多角的に分析・可視化する統計機能。
5つのタブで異なる視点から学習状況を把握し、効率的な学習をサポート。

## 🎯 スコアボード構成

### タブ一覧

1. **統計タブ** - 基本統計情報
2. **定着度タブ** - 単語ごとの定着度分析
3. **目標タブ** - 学習目標の設定と進捗
4. **プランタブ** - 今日・今週・今月の学習推奨量
5. **履歴タブ** - 日別・週別の学習履歴グラフ

---

## 1️⃣ 統計タブ

### 表示項目

#### 基本統計
- **総問題数**: これまでに解いた問題の総数
- **正答率**: 全体の正解率（%）
- **最高連続正解**: 過去最高の連続正解数
- **現在の連続正解**: 現在進行中の連続正解数
- **学習時間**: 累計学習時間（時間:分）

#### カテゴリー別正答率
6つのカテゴリーごとの正答率をレーダーチャートで表示:
- 動詞 (Verbs)
- 名詞 (Nouns)  
- 形容詞 (Adjectives)
- 副詞 (Adverbs)
- 前置詞・接続詞 (Prep/Conj)
- フレーズ (Phrases)

```typescript
interface CategoryStats {
  verbs: number;      // 0-100%
  nouns: number;
  adjectives: number;
  adverbs: number;
  prepConj: number;
  phrases: number;
}
```

#### レベル別統計
- **Beginner**: 初級単語の正答率と問題数
- **Intermediate**: 中級単語の正答率と問題数
- **Advanced**: 上級単語の正答率と問題数

---

## 2️⃣ 定着度タブ

### 定着度の分類

単語の習熟度を3段階に分類:

| 状態 | 条件 | 色 | アイコン |
|------|------|-----|---------|
| 完全定着 | 正解3回以上 & 直近正解率80%以上 | 緑 | 🟢 |
| 学習中 | 正解1〜2回 or 正解率50〜80% | 黄 | 🟡 |
| 要復習 | 不正解2回以上 or 正解率50%未満 | 赤 | 🔴 |

### プログレスバー表示

```
完全定着 45% | 学習中 35% | 要復習 20%
[■■■■■■■■■□□□□□□□□□□□] 100%
```

### 詳細統計

```typescript
interface RetentionStats {
  masteredCount: number;      // 完全定着語数
  masteredPercentage: number; // 完全定着率
  learningCount: number;      // 学習中語数
  learningPercentage: number; // 学習中率
  strugglingCount: number;    // 要復習語数
  strugglingPercentage: number; // 要復習率
  totalWords: number;         // 総学習語数
}
```

### 表示カラム

- **単語**: 英単語
- **意味**: 日本語訳
- **正解/不正解**: 正解回数 / 不正解回数
- **正答率**: パーセンテージ
- **定着度**: 0〜100%（独自アルゴリズム）
- **状態**: 完全定着/学習中/要復習

### ソート機能

- 定着度降順/昇順
- 正答率降順/昇順
- 単語アルファベット順

---

## 3️⃣ 目標タブ

### 目標設定

#### デイリー目標
- **新規単語数**: 1日に学習する新単語数（5〜50語）
- **復習単語数**: 1日に復習する単語数（10〜100語）
- **正答率目標**: 目標正答率（70〜95%）

#### ウィークリー目標
- **週間学習時間**: 1週間の学習時間目標（1〜10時間）
- **週間問題数**: 1週間の問題数目標（50〜500問）

### 進捗表示

```typescript
interface GoalProgress {
  dailyNewWords: {
    current: number;
    target: number;
    percentage: number;
  };
  dailyReview: {
    current: number;
    target: number;
    percentage: number;
  };
  weeklyTime: {
    current: number; // 分単位
    target: number;
    percentage: number;
  };
  weeklyQuestions: {
    current: number;
    target: number;
    percentage: number;
  };
}
```

### 達成状況の可視化

プログレスバーで視覚的に表示:

```
今日の新規単語: 8 / 10語
[■■■■■■■■□□] 80%

今日の復習: 25 / 30語
[■■■■■■■■■□] 83%
```

---

## 4️⃣ プランタブ

### 学習推奨量の計算

AIが学習履歴・定着度・目標から最適な学習量を算出。

#### 今日の推奨
- **新規単語**: X語（目標の80〜120%）
- **復習単語**: Y語（要復習単語を優先）
- **長文読解**: Z本（レベルに応じて）

#### 今週の推奨
- **総学習時間**: X時間
- **総問題数**: Y問
- **カテゴリー別**: 弱点カテゴリーを多めに

#### 今月の推奨
- **マイルストーン**: 月末までの達成目標
- **長期学習プラン**: 3ヶ月後の習得目標

### 推奨アルゴリズム

```typescript
function calculateRecommendation(
  progress: UserProgress,
  goals: Goals,
  weakCategories: string[]
): Recommendation {
  // 1. 要復習単語を優先
  const reviewWords = getReviewWords(progress);
  
  // 2. 弱点カテゴリーから新規単語を選択
  const newWords = selectNewWords(weakCategories, goals.daily);
  
  // 3. 学習時間を考慮した調整
  const adjusted = adjustByAvailableTime(reviewWords, newWords);
  
  return adjusted;
}
```

---

## 5️⃣ 履歴タブ

### 日別履歴

過去30日間の学習履歴を棒グラフで表示:

- **横軸**: 日付
- **縦軸**: 問題数 or 学習時間
- **色分け**: 正解(緑) / 不正解(赤)

```typescript
interface DailyHistory {
  date: string; // YYYY-MM-DD
  correct: number;
  incorrect: number;
  totalTime: number; // 分単位
  newWords: number;
  reviewWords: number;
}
```

### 週別履歴

過去12週間の学習履歴を折れ線グラフで表示:

- **横軸**: 週番号
- **縦軸**: 正答率 or 学習時間
- **トレンド線**: 移動平均

### セッション履歴

最新20セッションの詳細:

```typescript
interface SessionHistory {
  id: string;
  timestamp: number;
  mode: 'translation' | 'spelling' | 'reading';
  questions: number;
  correct: number;
  incorrect: number;
  duration: number; // 秒単位
  accuracy: number; // %
}
```

---

## 📊 データ永続化

### ストレージ方式

- **IndexedDB**: メイン統計データ（大容量対応）
- **LocalStorage**: 設定データ（高速アクセス）

### データ構造

```typescript
interface UserProgress {
  wordProgress: Record<string, WordProgress>;
  sessionHistory: SessionHistory[];
  goals: Goals;
  categoryStats: CategoryStats;
  retentionStats: RetentionStats;
  dailyHistory: DailyHistory[];
  weeklyHistory: WeeklyHistory[];
}

interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  lastAttempt: number;
  retentionRate: number; // 0-100%
  masteryLevel: 'struggling' | 'learning' | 'mastered';
}
```

---

## 🎨 UI/UXデザイン

### タブ切り替え

```tsx
<div className="score-board-tabs">
  <button className={activeTab === 'stats' ? 'active' : ''}>
    統計
  </button>
  <button className={activeTab === 'breakdown' ? 'active' : ''}>
    定着度
  </button>
  <button className={activeTab === 'goals' ? 'active' : ''}>
    目標
  </button>
  <button className={activeTab === 'plan' ? 'active' : ''}>
    プラン
  </button>
  <button className={activeTab === 'history' ? 'active' : ''}>
    履歴
  </button>
</div>
```

### レスポンシブ対応

- **PC**: 5つのタブを横並び表示
- **タブレット**: 3つ+ドロップダウン
- **スマホ**: ドロップダウンのみ

### フォント統一

すべてのタブで一貫したフォントサイズ:

```css
.stat-text-value { font-size: 1.1em; }
.retention-segment { font-size: 0.95em; }
.goals-compact { font-size: 1em; }
.plan-progress-text { font-size: 0.9em; }
```

---

## 🔄 リアルタイム更新

### 自動更新タイミング

- **問題解答後**: 即座に統計を更新
- **セッション終了時**: 履歴に追加
- **日付変更時**: デイリー目標をリセット

### パフォーマンス最適化

```typescript
// 統計の増分更新
function updateStats(result: QuizResult) {
  // 全体を再計算せず、差分のみ更新
  const current = getStats();
  current.totalQuestions++;
  current.correctCount += result.isCorrect ? 1 : 0;
  current.accuracy = (current.correctCount / current.totalQuestions) * 100;
  saveStats(current);
}
```

---

## 📈 分析アルゴリズム

### 定着度計算

```typescript
function calculateRetentionRate(wordProgress: WordProgress): number {
  const { correctCount, incorrectCount, lastAttempt } = wordProgress;
  
  // 基本スコア（正答率）
  const baseScore = (correctCount / (correctCount + incorrectCount)) * 100;
  
  // 時間減衰（最終解答から時間経過で減少）
  const daysSinceLastAttempt = (Date.now() - lastAttempt) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.max(0, 1 - (daysSinceLastAttempt / 30));
  
  // 試行回数ボーナス（多く解くほど信頼度向上）
  const attemptBonus = Math.min(1, (correctCount + incorrectCount) / 10);
  
  return Math.round(baseScore * timeDecay * attemptBonus);
}
```

### カテゴリー分類

```typescript
function categorizeWord(word: string): Category {
  // 品詞タグから判定
  if (word.includes('(動)')) return 'verbs';
  if (word.includes('(名)')) return 'nouns';
  if (word.includes('(形)')) return 'adjectives';
  if (word.includes('(副)')) return 'adverbs';
  if (word.includes('(前)') || word.includes('(接)')) return 'prepConj';
  return 'phrases';
}
```

---

## 📝 関連ドキュメント

- [12-学習曲線AI](./12-learning-curve-ai.md)
- [13-レーダーチャートAI](./13-radar-chart-ai.md)
- [15-データ構造](./15-data-structures.md)
- [16-ストレージ戦略](./16-storage-strategy.md)
