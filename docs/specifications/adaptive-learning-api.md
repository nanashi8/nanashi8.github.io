# 適応型学習AI API仕様

## 概要

適応型学習AIは、認知心理学の記憶獲得・記憶保持理論に基づいた学習最適化システムです。

このドキュメントでは、開発者向けに`useAdaptiveLearning`フックのAPI仕様を説明します。

## useAdaptiveLearning

Reactフックとして提供される適応型学習AIのメインインターフェース。

### インポート

```typescript
import { useAdaptiveLearning } from '@/hooks/useAdaptiveLearning';
```

### 使用例

```typescript
function MyLearningComponent() {
  const adaptiveLearning = useAdaptiveLearning('MEMORIZATION');
  
  // 次の問題を選択
  const question = adaptiveLearning.selectNextQuestion(questions);
  
  // 回答を記録
  adaptiveLearning.recordAnswer('apple', true, 2000);
  
  // 学習状態を取得
  const { currentPhase, queueSizes, sessionProgress } = adaptiveLearning.state;
  
  return (
    <div>
      <p>現在のフェーズ: {currentPhase}</p>
      <p>学習問題数: {sessionProgress.totalQuestions}</p>
    </div>
  );
}
```

### パラメータ

#### category: LearningCategory

学習カテゴリーを指定します。各カテゴリーは独立した学習状態を持ちます。

```typescript
type LearningCategory = 
  | 'MEMORIZATION'   // 暗記タブ
  | 'TRANSLATION'    // 和訳タブ
  | 'SPELLING'       // スペルタブ
  | 'GRAMMAR';       // 文法タブ
```

### 戻り値

#### selectNextQuestion

次に出題する問題を選択します。

```typescript
selectNextQuestion: (candidates: QuizQuestion[]) => QuizQuestion | null
```

**パラメータ:**
- `candidates`: 出題候補の問題配列

**戻り値:**
- 選択された問題、または候補が空の場合は`null`

**動作:**
1. 候補の中から学習状態に基づいて最適な問題を選択
2. セッション進行状況を更新（totalQuestions++）
3. 新規単語の場合はnewWords++、復習の場合はreviews++

#### recordAnswer

学習者の回答を記録します。

```typescript
recordAnswer: (word: string, isCorrect: boolean, responseTime: number) => void
```

**パラメータ:**
- `word`: 回答した単語
- `isCorrect`: 正解したかどうか
- `responseTime`: 応答時間（ミリ秒）

**動作:**
1. 記憶獲得アルゴリズムに回答を記録（新規単語の場合）
2. 記憶保持アルゴリズムに復習結果を記録（復習の場合）
3. 20問ごとに個人パラメータを自動更新

#### state

現在の学習状態を取得します。

```typescript
state: AdaptiveLearningState
```

**型定義:**

```typescript
interface AdaptiveLearningState {
  // 現在の学習フェーズ
  currentPhase: LearningPhase | null;
  
  // 個人パラメータ（20問以降で利用可能）
  personalParams: PersonalParameters | null;
  
  // 各キューのサイズ
  queueSizes: {
    immediate: number;  // IMMEDIATE キュー
    early: number;      // EARLY キュー
    mid: number;        // MID キュー
    end: number;        // END キュー
  };
  
  // セッション進行状況
  sessionProgress: {
    totalQuestions: number;  // 総問題数
    newWords: number;        // 新規単語数
    reviews: number;         // 復習問題数
  };
}
```

## 型定義

### LearningPhase

学習フェーズを表す列挙型。

```typescript
enum LearningPhase {
  ENCODING = 'ENCODING',                          // 符号化
  INITIAL_CONSOLIDATION = 'INITIAL_CONSOLIDATION', // 初期固定化
  SHORT_TERM_RETENTION = 'SHORT_TERM_RETENTION',   // 短期保持
  LONG_TERM_RETENTION = 'LONG_TERM_RETENTION',     // 長期保持
  AUTOMATIZATION = 'AUTOMATIZATION'                // 自動化
}
```

**フェーズ判定基準:**

| フェーズ | 条件 | 説明 |
|---------|------|------|
| ENCODING | reviewCount = 0 | 初回学習 |
| INITIAL_CONSOLIDATION | reviewCount ≥ 1 かつ lastReviewTime < 24時間前 | 記憶の初期定着期 |
| SHORT_TERM_RETENTION | 24時間 ≤ lastReviewTime < 1週間 | 短期記憶の保持 |
| LONG_TERM_RETENTION | 1週間 ≤ lastReviewTime < 1ヶ月 | 長期記憶の形成 |
| AUTOMATIZATION | lastReviewTime ≥ 1ヶ月 | 完全自動化 |

### PersonalParameters

学習者の個人パラメータ。

```typescript
interface PersonalParameters {
  learningSpeed: number;     // 学習速度 (0.5-2.0)
  forgettingRate: number;    // 忘却速度 (0.5-2.0)
  confidence: number;        // 信頼度 (0.0-1.0)
}
```

**推定方法:**
- 20問の回答データから統計的に推定
- 正答率、応答時間、復習間隔などを総合的に分析
- 学習速度が速い: 少ない復習回数で定着
- 忘却速度が速い: 復習間隔が短くても忘れやすい

### QuizQuestion

問題の型定義。

```typescript
interface QuizQuestion {
  word: string;           // 単語
  reading: string;        // 読み
  meaning: string;        // 意味
  etymology?: string;     // 語源等解説
  relatedWords?: string;  // 関連語
  category?: string;      // 関連分野
  difficulty: string;     // 難易度
}
```

## アルゴリズム概要

### 1. 学習フェーズ検出

学習者の記憶状態を5つのフェーズで自動判定します。

- **実装**: `learningPhaseDetector.ts` (450行)
- **テスト**: 55/55成功、カバレッジ97.91%

### 2. 記憶獲得アルゴリズム

新規単語の学習を最適化します。

- **実装**: `memoryAcquisitionAlgorithm.ts` (800行)
- **テスト**: 44/44成功、カバレッジ92.07%
- **キュー管理**:
  - IMMEDIATE: すぐに復習（間隔0-30秒）
  - EARLY: 早期復習（間隔30秒-5分）
  - MID: 中期復習（間隔5-30分）
  - END: 後期復習（間隔30分以降）

### 3. 記憶保持アルゴリズム

復習タイミングを最適化します。

- **実装**: `memoryRetentionAlgorithm.ts` (432行)
- **テスト**: 40/40成功、カバレッジ100%
- **間隔計算**: エビングハウスの忘却曲線に基づく

### 4. 個人パラメータ推定

学習者の特性を推定します。

- **実装**: `personalParameterEstimator.ts` (403行)
- **テスト**: 30/30成功、カバレッジ94.53%
- **推定頻度**: 20問ごとに自動更新

### 5. 混合戦略出題ロジック

新規と復習を最適な比率で混合します。

- **実装**: `hybridQuestionSelector.ts` (389行)
- **テスト**: 34/34成功、カバレッジ98.01%
- **優先度計算**: 4要素の重み付け合計（0-100点）

## localStorage連携

学習状態は自動的にlocalStorageに保存されます。

### 保存キー

```typescript
`adaptive_learning_${category}_acquisition_queue`  // 記憶獲得キュー
`adaptive_learning_${category}_retention_queue`    // 記憶保持キュー
```

### 保存タイミング

- 問題選択時: selectNextQuestion実行後
- 回答記録時: recordAnswer実行後

### 復元タイミング

- フック初期化時: useAdaptiveLearning呼び出し時

## パフォーマンス

### ベンチマーク結果

- **100回の問題選択**: < 1秒
- **100回の回答記録**: < 1秒

### メモリ使用量

- 各カテゴリーごとに独立したアルゴリズムインスタンスを保持
- 4カテゴリー × 5アルゴリズム = 20インスタンス
- 推定メモリ: ~1MB程度

## エラーハンドリング

すべてのエラーはconsole.errorに出力され、アプリケーションの動作は継続します。

```typescript
// 不正な単語名でもエラーにならない
recordAnswer('', true, 2000);  // 内部でエラーログ出力、動作継続

// 負の応答時間でもエラーにならない
recordAnswer('apple', true, -1000);  // 内部で0に補正

// 候補が空でもnullを返す
selectNextQuestion([]);  // null
```

## 統合テスト

統合テストで以下のシナリオを検証しています：

1. **初期化**: 正しく初期化される
2. **問題選択**: 候補から問題を選択できる
3. **回答記録**: 正解・不正解を記録できる
4. **セッション状態**: キューサイズ、進行状況、個人パラメータを取得できる
5. **localStorage連携**: キューの保存・復元ができる
6. **エラーハンドリング**: 不正な入力でもエラーにならない
7. **統合シナリオ**: 典型的な学習フロー、長時間セッション、カテゴリー独立性
8. **パフォーマンス**: 大量の選択・記録でも高速

**テスト結果**: 22/22成功（100%）

## 設計ドキュメント

詳細なアルゴリズム設計は以下を参照してください：

- [適応型学習AI詳細設計](design/adaptive-learning-design.md) (950行)
- [アルゴリズム詳細設計](design/adaptive-learning-algorithm-design.md) (1800行)

## ライセンス

このプロジェクトのライセンスに準じます。
