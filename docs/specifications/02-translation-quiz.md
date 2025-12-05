# 02. 和訳クイズ

## 📌 概要

英単語・フレーズから日本語訳を選ぶ4択クイズ機能。
最も基本的な学習モードで、語彙の意味理解に重点を置く。

**データ仕様参照**:
- 単語データ: [19-junior-high-vocabulary.md](./19-junior-high-vocabulary.md)
- フレーズデータ: [20-junior-high-phrases.md](./20-junior-high-phrases.md)
- データ構造: [15-data-structures.md](./15-data-structures.md)

## 🎯 機能仕様

### 基本フロー

1. **問題表示**: 英単語・フレーズを表示
2. **選択肢提示**: 3つの日本語訳 + 「分からない」の4択を提示
3. **解答**: ユーザーが1つ選択
4. **判定**: 即座に正誤判定
5. **フィードバック**: AIコメント表示（条件付き）
6. **次の問題**: 自動的に次へ進む

### 出題形式

```
問題: abandon
━━━━━━━━━━━━━━━━━━━━
選択肢:
□ 1. 捨てる、放棄する
□ 2. 受け入れる
□ 3. 達成する
□ 4. 分からない
```

### 学習状態の管理

| 状態 | 条件 | 出題頻度 |
|------|------|---------|
| **定着済み** | 1発正解 または 連続2回以上正解 | しばらく出題を見送り |
| **学習中** | 1回目不正解（「分からない」含む） | 継続して出題 |
| **要復習** | 2回以上不正解 | 優先的に出題 |

**注意**: 「分からない」を選択した場合は不正解扱いとなり、要復習にカウントされます。

## 🎛️ フィルター機能

### 難易度フィルター

| レベル | 対象 | 単語数 |
|--------|------|--------|
| All | 全レベル | ~1,300語 |
| Beginner | 初級（基礎単語） | ~400語 |
| Intermediate | 中級（中学受験頻出） | ~600語 |
| Advanced | 上級（難関校対応） | ~300語 |

### 単語/フレーズフィルター

| フィルター | 説明 | 例 |
|-----------|------|-----|
| All | すべて表示 | - |
| Words Only | 単語のみ | abandon, accept |
| Phrases Only | フレーズのみ | give up, look forward to |

### フレーズタイプフィルター

句動詞やイディオムをさらに細分化:

| タイプ | 説明 | 例 |
|--------|------|-----|
| All | すべてのフレーズ | - |
| Phrasal Verb | 句動詞 | give up, look after |
| Idiom | イディオム | break the ice, piece of cake |
| Collocation | 連語 | make a decision, take a look |
| Other | その他の表現 | as well as, in order to |

## 🔊 音声機能

### 読み上げ機能

- **対応**: 英単語・フレーズの音声読み上げ
- **エンジン**: Web Speech API (speechSynthesis)
- **言語**: en-US（アメリカ英語）
- **速度**: 0.9倍速（聞き取りやすい速度）

```typescript
function speakEnglish(text: string) {
  if (!isSpeechSynthesisSupported()) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  speechSynthesis.speak(utterance);
}
```

### 対応ブラウザ

- ✅ Chrome/Edge（高品質）
- ✅ Safari（iOS対応）
- ✅ Firefox
- ❌ 一部古いブラウザ

## 🎨 UI/UX

### 選択肢のデザイン

#### 通常状態
```css
.choice-btn {
  padding: 16px;
  font-size: max(16px, 1em);
  border: 2px solid #c0c0c0;
  border-radius: 10px;
  background: #fafafa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  color: #2c3e50;
  font-weight: 500;
}
```

#### ホバー時
```css
.choice-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #f0f4ff;
}
```

#### 正解時
```css
.choice-btn.correct {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
  font-weight: 600;
}
```

#### 不正解時
```css
.choice-btn.incorrect {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}
```

### レイアウト

#### PC/タブレット（横向き）
- 2列グリッド表示
- gap: 14px

#### スマホ（縦向き）
- 1列表示
- gap: 12px

### 固定高さレイアウト

画面スクロールを防ぐため固定高さを設定:

```css
.question-content-inline {
  min-height: 100px;
  justify-content: center;
}

.comment-bar-container {
  min-height: 80px;
  margin-bottom: 16px;
}
```

## 📊 選択肢生成アルゴリズム

### 基本方針

1. **正解**: 問題の正しい訳
2. **誤答1**: 同じカテゴリーから選択
3. **誤答2**: ランダムに選択
4. **「分からない」**: 固定で最後に配置

### カテゴリー同一化

混同を誘発するため、同じ品詞・カテゴリーから選択:

```typescript
function generateChoicesWithQuestions(
  currentQuestion: Question,
  allQuestions: Question[],
  currentIndex: number
): Array<{ text: string; question: Question | null }> {
  // 誤答を2つ選択
  const wrongQuestions = selectWrongQuestions(allQuestions, currentQuestion, 2);
  
  // 正解と誤答2つをシャッフル
  const firstThreeChoices = shuffle([
    { text: currentQuestion.meaning, question: currentQuestion },
    ...wrongQuestions.map(q => ({ text: q.meaning, question: q }))
  ]);
  
  // 最後に「分からない」を追加
  return [
    ...firstThreeChoices,
    { text: '分からない', question: null }
  ];
}
```
  
  const wrongChoice1 = sameCategory[Math.floor(Math.random() * sameCategory.length)];
  
  // ランダムから1つ
  const wrongChoice2 = allQuestions
    .filter(q => q.meaning !== correctAnswer && q.meaning !== wrongChoice1);
  
  return shuffle([correctAnswer, wrongChoice1, wrongChoice2]);
}
```

## 🧠 AI連携

### エラー予測AI

過去の誤答パターンから苦手単語を予測:

```typescript
const prediction = await predictErrorRisk(word, userProgress);
if (prediction.risk > 0.7) {
  // 高リスク単語は警告表示
  showWarning('この単語は間違えやすいので注意！');
}
```

### 認知負荷AI

疲労度を測定して難易度を自動調整:

```typescript
const cognitiveLoad = calculateCognitiveLoad(sessionResponses);
if (cognitiveLoad.fatigue > 0.8) {
  // 難易度を下げる
  difficulty = adjustDifficulty(difficulty, -1);
  showMessage(generateFatigueMessage(cognitiveLoad));
}
```

### 文脈学習AI

関連単語をグループ化して連続出題:

```typescript
const sequence = generateContextualSequence(
  nextWord,
  allQuestions,
  userProgress
);
// 類義語・反義語・語源が同じ単語を連続で出題
```

## 📱 タッチ最適化

### iOS対応

```css
.choice-btn {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}
```

### 最小タッチサイズ

```css
.choice-btn {
  min-height: 56px; /* iOS推奨44px以上 */
}
```

## 📈 進捗記録

### 解答データの保存

```typescript
interface QuizResult {
  questionId: string;
  word: string;
  meaning: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTime: number; // ミリ秒
  timestamp: number;
}
```

### 単語ごとの進捗

```typescript
interface WordProgress {
  word: string;
  correctCount: number;
  incorrectCount: number;
  lastAttempt: number;
  retentionRate: number; // 0-100%
  masteryLevel: 'struggling' | 'learning' | 'mastered';
  averageResponseTime: number;
}
```

### ストレージ

- **IndexedDB**: wordProgressの保存（大容量対応）
- **メモリキャッシュ**: セッション中の高速アクセス

## 🎮 キーボードショートカット

| キー | 動作 |
|------|------|
| 1 | 選択肢1を選択 |
| 2 | 選択肢2を選択 |
| 3 | 選択肢3を選択 |
| 4 | 選択肢4を選択（分からない） |
| Space | 音声再生 |
| Enter | 次の問題へ（解答後） |

## 🔄 適応型出題

### 優先度計算

```typescript
function calculateQuestionPriorities(
  questions: Question[],
  progress: UserProgress
): Question[] {
  return questions.map(q => {
    const wordProgress = progress.wordProgress[q.word];
    
    // 優先度スコア計算
    let priority = 0;
    
    // 1. 未学習単語は最優先
    if (!wordProgress) priority += 100;
    
    // 2. 要復習単語は高優先度
    if (wordProgress?.masteryLevel === 'struggling') priority += 80;
    
    // 3. 最終学習からの経過時間
    const daysSince = (Date.now() - wordProgress?.lastAttempt) / (1000 * 60 * 60 * 24);
    priority += Math.min(daysSince * 5, 50);
    
    // 4. 正答率が低い単語
    const accuracy = wordProgress 
      ? wordProgress.correctCount / (wordProgress.correctCount + wordProgress.incorrectCount)
      : 0;
    priority += (1 - accuracy) * 30;
    
    return { ...q, priority };
  }).sort((a, b) => b.priority - a.priority);
}
```

## 🐛 エラーハンドリング

### データ読み込みエラー

```typescript
try {
  const questions = await loadQuestions();
} catch (error) {
  console.error('問題データの読み込みに失敗:', error);
  showErrorMessage('問題データを読み込めませんでした。');
}
```

### 音声再生エラー

```typescript
if (!isSpeechSynthesisSupported()) {
  console.warn('音声機能は非対応です');
  // 音声ボタンを非表示
}
```

## 📊 統計情報

### セッション統計

```typescript
interface SessionStats {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  currentStreak: number;
  maxStreak: number;
  averageResponseTime: number;
  sessionDuration: number;
}
```

## 📝 関連ドキュメント

- [01-プロジェクト概要](./01-project-overview.md)
- [03-スペルクイズ](./03-spelling-quiz.md)
- [08-エラー予測AI](./08-error-prediction-ai.md)
- [15-データ構造](./15-data-structures.md)
