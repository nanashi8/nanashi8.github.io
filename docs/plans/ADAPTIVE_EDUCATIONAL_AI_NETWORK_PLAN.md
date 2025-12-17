# 適応的教育AIネットワーク実装計画
**プロ家庭教師のように複数の戦略を使い分ける革新的学習システム**

---

## 📋 プロジェクト概要

### 🎯 目的
複数の学習アプローチを信号強度に基づいて動的に切り替え、「押してダメなら引いてみる」ような適応的指導を実現する

### 💡 核心的コンセプト
> **"プロ家庭教師が成績不振の生徒をあらゆるアプローチで成長させる"**
> 
> - 生徒の反応を常に観察
> - 効果がない戦略は即座に切り替え
> - 過去の成功パターンから学習
> - 個人に最適化された指導

### 🧬 システムの革新性
1. **メタ認知型AI**: AIが自身の戦略を評価・改善
2. **信号駆動型判断**: データに基づく動的戦略選択
3. **多戦略統合**: 既存の7つのAIモジュールを統合
4. **効果測定ループ**: 戦略の効果を継続的に評価

---

## 🏗️ システムアーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────────────────────────────┐
│                    UI層（MemorizationView）                  │
│  - 戦略切り替え通知表示                                       │
│  - 効果測定ダッシュボード                                     │
│  - プロ家庭教師モードインジケーター                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│          メタ戦略コントローラー（新規実装）                   │
│  AdaptiveEducationalAINetwork                                │
│  - 信号収集・統合                                            │
│  - 最適戦略選択                                              │
│  - 効果測定                                                  │
│  - 戦略切り替え判断                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
┌────────▼─────┐ ┌────▼─────┐ ┌────▼──────┐
│ 信号検出層    │ │ 戦略実行層│ │ 効果測定層 │
│ SignalDetector│ │ Strategy  │ │ Effectiveness│
│               │ │ Executor  │ │ Tracker    │
└────────┬──────┘ └────┬─────┘ └────┬──────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  既存AIモジュール層                           │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ 適応型学習AI     │  │ 認知負荷管理AI   │                  │
│  │ (記憶獲得・保持) │  │ (疲労検出)      │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ エラー予測AI     │  │ 学習スタイルAI   │                  │
│  │ (混同検出)      │  │ (個人化)        │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ 言語学的関連性AI │  │ 文脈学習AI       │                  │
│  │ (ネットワーク)   │  │ (意味的関連)    │                  │
│  └─────────────────┘  └─────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 実装フェーズ

### 総工数見積もり: **80時間（10日間）**
- 調査・設計: 24時間（3日）
- コア実装: 40時間（5日）
- 統合・テスト: 16時間（2日）

### 品質重視の方針
✅ **十分な調査時間を確保**（既存AIの深い理解）  
✅ **段階的実装**（小さく作って動かして検証）  
✅ **包括的テスト**（複雑なロジックなので重点的に）  
✅ **メンテナンス性**（将来の拡張を考慮した設計）

---

## 🔍 Phase 1: 調査・設計フェーズ【24時間】

### 🔬 工程1: 既存AI統合ポイント詳細分析 [8時間]

#### 目的
7つの既存AIモジュールの入出力、状態管理、統合ポイントを完全に理解する

#### 調査対象

##### 1.1 適応型学習AIの分析 [2時間]
**ファイル:**
- `src/strategies/memoryAcquisitionAlgorithm.ts` (800行)
- `src/strategies/memoryRetentionAlgorithm.ts` (432行)
- `src/strategies/learningPhaseDetector.ts` (450行)
- `src/hooks/useAdaptiveLearning.ts` (415行)

**調査項目:**
```typescript
// どのような信号を出力できるか？
interface AcquisitionSignals {
  consecutiveErrors: number;      // 連続誤答数
  sameWordAttempts: number;       // 同一単語の試行回数
  dynamicThreshold: number;       // 現在の動的閾値
  isConsolidated: boolean;        // 定着完了フラグ
  phase: LearningPhase;           // 現在のフェーズ
}

// どのように戦略として実行するか？
interface AcquisitionStrategy {
  enqueueImmediate(word: string): void;
  enqueueEarly(word: string): void;
  forceReview(word: string): void;
  getNextQuestion(): Question | null;
}
```

##### 1.2 認知負荷管理AIの分析 [1.5時間]
**ファイル:**
- `src/ai/cognitive/cognitiveLoadAI.ts` (354行)

**調査項目:**
```typescript
// 疲労度信号の取得方法
interface CognitiveLoadSignals {
  fatigueLevel: number;           // 0-100
  concentrationLevel: number;     // 0-100
  shouldBreak: boolean;           // 休憩推奨フラグ
  breakReason: string;            // 休憩理由
  isDecreasing: boolean;          // 正答率下降トレンド
}

// 戦略としての実行内容
interface CognitiveLoadStrategy {
  recommendBreak(): void;
  reduceLoad(): void;             // 難易度下げ
  switchToReview(): void;         // 復習モード切替
}
```

##### 1.3 エラー予測AIの分析 [1.5時間]
**ファイル:**
- `src/ai/prediction/errorPredictionAI.ts` (487行)

**調査項目:**
```typescript
interface ErrorPredictionSignals {
  errorRisk: number;              // 0-100%
  confusionPairs: ConfusionPair[];
  warningLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryPattern: ErrorPattern;
}

interface ErrorPredictionStrategy {
  showWarning(word: string): void;
  provideHints(word: string): string[];
  reviewConfusionPair(word1: string, word2: string): void;
}
```

##### 1.4 学習スタイルAIの分析 [1時間]
**ファイル:**
- `src/ai/adaptation/learningStyleAI.ts` (約300行)

**調査項目:**
```typescript
interface LearningStyleSignals {
  optimalTimeOfDay: 'morning' | 'afternoon' | 'evening';
  optimalSessionLength: number;   // 分
  learningStyle: 'short_burst' | 'moderate' | 'extended';
  performanceTrend: 'improving' | 'stable' | 'declining';
}

interface LearningStyleStrategy {
  adjustSessionLength(): void;
  recommendTime(): void;
  personalizeSchedule(): void;
}
```

##### 1.5 言語学的関連性AI・文脈学習AIの分析 [2時間]
**ファイル:**
- `src/ai/analysis/linguisticRelationsAI.ts` (680行)
- `src/ai/optimization/contextualLearningAI.ts` (657行)

**調査項目:**
```typescript
interface RelationalLearningSignals {
  hasRelatedWords: boolean;
  clusterSize: number;
  relationType: LinguisticRelationType;
  shouldStudyTogether: boolean;
}

interface RelationalLearningStrategy {
  presentCluster(words: string[]): void;
  showRelations(word: string): void;
  sequentialPresentation(): void;
}
```

#### 成果物
1. `docs/analysis/EXISTING_AI_INTEGRATION_ANALYSIS.md` (各AIの統合可能性分析)
2. `docs/analysis/SIGNAL_CATALOG.md` (全信号の一覧とデータ型)
3. `docs/analysis/STRATEGY_CATALOG.md` (全戦略の一覧と実行方法)

---

### 🏛️ 工程2: システムアーキテクチャ詳細設計 [8時間]

#### 2.1 データモデル設計 [3時間]

```typescript
/**
 * 学習信号（各AIが出力する情報）
 */
export interface LearningSignal {
  // 基本情報
  source: SignalSource;           // 信号の発信元AI
  timestamp: number;              // 発生時刻
  
  // 戦略推奨
  recommendedStrategy: StrategyType;
  strength: number;               // 信号強度（0-100）
  confidence: number;             // 信頼度（0-1）
  
  // 根拠情報
  reason: string;                 // 人間可読な理由
  evidence: SignalEvidence;       // 根拠となるデータ
  
  // メタ情報
  priority: number;               // 緊急度（0-10）
  category: 'cognitive' | 'performance' | 'memory' | 'engagement';
}

/**
 * 信号源（どのAIから来たか）
 */
export enum SignalSource {
  MEMORY_ACQUISITION = 'memory_acquisition',
  COGNITIVE_LOAD = 'cognitive_load',
  ERROR_PREDICTION = 'error_prediction',
  LEARNING_STYLE = 'learning_style',
  LINGUISTIC_RELATIONS = 'linguistic_relations',
  CONTEXTUAL_LEARNING = 'contextual_learning',
}

/**
 * 戦略タイプ（何をすべきか）
 */
export enum StrategyType {
  // 反復系
  IMMEDIATE_REPETITION = 'immediate_repetition',
  SPACED_REPETITION = 'spaced_repetition',
  
  // 認知負荷系
  REDUCE_DIFFICULTY = 'reduce_difficulty',
  TAKE_BREAK = 'take_break',
  SWITCH_TO_REVIEW = 'switch_to_review',
  
  // 関連性系
  CLUSTER_LEARNING = 'cluster_learning',
  CONTEXTUAL_LEARNING = 'contextual_learning',
  CONFUSION_RESOLUTION = 'confusion_resolution',
  
  // 個人化系
  ADJUST_TIMING = 'adjust_timing',
  PERSONALIZE_PACE = 'personalize_pace',
  
  // マルチモーダル系
  MULTIMODAL_ENHANCEMENT = 'multimodal_enhancement',
}

/**
 * 信号の根拠
 */
export interface SignalEvidence {
  // 数値データ
  metrics: Record<string, number>;
  
  // 具体的な証拠
  facts: string[];
  
  // 関連する単語
  relatedWords?: string[];
  
  // 履歴データ
  historicalData?: any;
}

/**
 * 戦略実行結果
 */
export interface StrategyExecutionResult {
  strategy: StrategyType;
  executedAt: number;
  duration: number;               // 実行時間（ms）
  
  // 即時効果
  immediateOutcome: {
    questionsPresented: number;
    correctAnswers: number;
    averageResponseTime: number;
  };
  
  // メタデータ
  wasCompleted: boolean;
  interruptedBy?: StrategyType;   // 途中で別の戦略に切り替わった場合
}

/**
 * 戦略効果測定
 */
export interface StrategyEffectiveness {
  strategy: StrategyType;
  
  // 効果指標
  effectiveness: {
    shortTerm: number;            // 短期効果（0-100）
    mediumTerm: number;           // 中期効果（0-100）
    longTerm: number;             // 長期効果（0-100）
    overall: number;              // 総合効果（0-100）
  };
  
  // 統計
  stats: {
    timesUsed: number;            // 使用回数
    successRate: number;          // 成功率（0-1）
    averageImprovement: number;   // 平均改善度
    lastUsed: number;             // 最終使用時刻
  };
  
  // 適用条件
  conditions: {
    bestFor: string[];            // 最適な状況
    avoidWhen: string[];          // 避けるべき状況
  };
}

/**
 * 適応的ネットワークの状態
 */
export interface AdaptiveNetworkState {
  // 現在の戦略
  currentStrategy: StrategyType | null;
  strategyStartTime: number;
  strategyDuration: number;
  
  // 信号履歴（直近10件）
  recentSignals: LearningSignal[];
  
  // 戦略実行履歴（直近20件）
  strategyHistory: StrategyExecutionResult[];
  
  // 効果測定結果
  strategyEffectiveness: Map<StrategyType, StrategyEffectiveness>;
  
  // 学習者プロファイル
  learnerProfile: {
    preferredStrategies: StrategyType[];
    avoidedStrategies: StrategyType[];
    learningPattern: 'adaptive' | 'consistent' | 'variable';
  };
  
  // セッション統計
  sessionStats: {
    strategySwitches: number;     // 戦略切り替え回数
    totalQuestions: number;
    overallImprovement: number;   // 0-100
    startTime: number;
  };
}
```

#### 2.2 コアアルゴリズム設計 [3時間]

```typescript
/**
 * メタ戦略コントローラーの疑似コード
 */
class AdaptiveEducationalAINetwork {
  
  // ===========================
  // 信号収集
  // ===========================
  
  /**
   * 全AIモジュールから信号を収集
   */
  collectSignals(context: LearningContext): LearningSignal[] {
    const signals: LearningSignal[] = [];
    
    // 1. 記憶獲得AIから信号取得
    const acquisitionSignal = this.detectAcquisitionSignal(context);
    if (acquisitionSignal) signals.push(acquisitionSignal);
    
    // 2. 認知負荷AIから信号取得
    const cognitiveSignal = this.detectCognitiveLoadSignal(context);
    if (cognitiveSignal) signals.push(cognitiveSignal);
    
    // 3. エラー予測AIから信号取得
    const errorSignal = this.detectErrorPredictionSignal(context);
    if (errorSignal) signals.push(errorSignal);
    
    // 4. 学習スタイルAIから信号取得
    const styleSignal = this.detectLearningStyleSignal(context);
    if (styleSignal) signals.push(styleSignal);
    
    // 5. 関連性AIから信号取得
    const relationSignal = this.detectRelationSignal(context);
    if (relationSignal) signals.push(relationSignal);
    
    // 信号を強度でソート
    return signals.sort((a, b) => b.strength - a.strength);
  }
  
  // ===========================
  // 戦略選択
  // ===========================
  
  /**
   * 最適戦略を選択（プロ家庭教師の判断）
   */
  selectOptimalStrategy(signals: LearningSignal[]): StrategyType {
    // ステップ1: 最も強い信号を確認
    const strongestSignal = signals[0];
    
    // ステップ2: 現在の戦略が効果的か評価
    if (this.isCurrentStrategyEffective()) {
      // 効果的なら継続
      return this.state.currentStrategy!;
    }
    
    // ステップ3: 新しい戦略を試す（押してダメなら引く）
    const alternativeStrategy = this.findAlternativeStrategy(
      strongestSignal,
      signals
    );
    
    return alternativeStrategy;
  }
  
  /**
   * 現在の戦略が効果的か判定
   */
  isCurrentStrategyEffective(): boolean {
    if (!this.state.currentStrategy) return false;
    
    // 直近5問の改善度を計算
    const recent5 = this.strategyHistory.slice(-5);
    const improvement = this.calculateImprovement(recent5);
    
    // 戦略実行時間をチェック
    const duration = Date.now() - this.state.strategyStartTime;
    const minDuration = 3 * 60 * 1000; // 最低3分は試す
    
    // 判定基準
    return (
      improvement > 0 &&              // 改善が見られる
      duration < 10 * 60 * 1000       // まだ10分未満
    );
  }
  
  /**
   * 代替戦略を見つける
   */
  findAlternativeStrategy(
    primarySignal: LearningSignal,
    allSignals: LearningSignal[]
  ): StrategyType {
    // 優先順位1: まだ試していない戦略
    const untriedStrategies = this.getUntriedStrategies();
    if (untriedStrategies.length > 0) {
      // 信号強度が最も高い未試行戦略を選択
      return this.selectBySignalStrength(untriedStrategies, allSignals);
    }
    
    // 優先順位2: 過去に効果があった戦略
    const effectiveStrategies = this.getMostEffectiveStrategies();
    if (effectiveStrategies.length > 0) {
      return effectiveStrategies[0];
    }
    
    // フォールバック: 最も強い信号の推奨戦略
    return primarySignal.recommendedStrategy;
  }
  
  // ===========================
  // 戦略実行
  // ===========================
  
  /**
   * 戦略を実行
   */
  executeStrategy(strategy: StrategyType, context: LearningContext): void {
    // 戦略切り替えログ
    this.logStrategySwitching(strategy);
    
    // 実行
    switch (strategy) {
      case StrategyType.IMMEDIATE_REPETITION:
        this.executeImmediateRepetition(context);
        break;
        
      case StrategyType.TAKE_BREAK:
        this.executeTakeBreak(context);
        break;
        
      case StrategyType.CLUSTER_LEARNING:
        this.executeClusterLearning(context);
        break;
        
      case StrategyType.CONFUSION_RESOLUTION:
        this.executeConfusionResolution(context);
        break;
        
      // ... 他の戦略
    }
    
    // 状態更新
    this.state.currentStrategy = strategy;
    this.state.strategyStartTime = Date.now();
  }
  
  // ===========================
  // 効果測定
  // ===========================
  
  /**
   * 戦略の効果を測定
   */
  measureStrategyEffectiveness(
    strategy: StrategyType,
    result: StrategyExecutionResult
  ): void {
    // 短期効果（即時の正答率改善）
    const shortTermEffect = this.calculateShortTermEffect(result);
    
    // 中期効果（次のセッションでの定着率）
    const mediumTermEffect = this.calculateMediumTermEffect(strategy);
    
    // 長期効果（1週間後の保持率）
    const longTermEffect = this.calculateLongTermEffect(strategy);
    
    // 効果データを更新
    const effectiveness = this.state.strategyEffectiveness.get(strategy) || {
      strategy,
      effectiveness: { shortTerm: 0, mediumTerm: 0, longTerm: 0, overall: 0 },
      stats: { timesUsed: 0, successRate: 0, averageImprovement: 0, lastUsed: 0 },
      conditions: { bestFor: [], avoidWhen: [] }
    };
    
    effectiveness.effectiveness.shortTerm = shortTermEffect;
    effectiveness.effectiveness.mediumTerm = mediumTermEffect;
    effectiveness.effectiveness.longTerm = longTermEffect;
    effectiveness.effectiveness.overall = 
      (shortTermEffect + mediumTermEffect + longTermEffect) / 3;
    
    effectiveness.stats.timesUsed++;
    effectiveness.stats.lastUsed = Date.now();
    
    this.state.strategyEffectiveness.set(strategy, effectiveness);
  }
  
  // ===========================
  // 学習と適応
  // ===========================
  
  /**
   * 過去のデータから学習
   */
  learnFromHistory(): void {
    // 各戦略の成功パターンを分析
    for (const [strategy, effectiveness] of this.state.strategyEffectiveness) {
      // 成功した状況を抽出
      const successConditions = this.extractSuccessConditions(strategy);
      effectiveness.conditions.bestFor = successConditions;
      
      // 失敗した状況を抽出
      const failureConditions = this.extractFailureConditions(strategy);
      effectiveness.conditions.avoidWhen = failureConditions;
    }
    
    // 学習者プロファイルを更新
    this.updateLearnerProfile();
  }
}
```

#### 2.3 統合設計 [2時間]

```typescript
/**
 * useAdaptiveLearning への統合方法
 */
export function useAdaptiveLearning(
  category: QuestionCategory = QuestionCategory.MEMORIZATION,
  sessionId?: string
): UseAdaptiveLearningResult {
  // 既存のアルゴリズムインスタンス
  const phaseDetectorRef = useRef<LearningPhaseDetector | null>(null);
  const acquisitionAlgoRef = useRef<AcquisitionQueueManager | null>(null);
  // ... 他のアルゴリズム
  
  // 🆕 新規: 適応的ネットワークインスタンス
  const adaptiveNetworkRef = useRef<AdaptiveEducationalAINetwork | null>(null);
  
  // 初期化
  useEffect(() => {
    if (!adaptiveNetworkRef.current) {
      adaptiveNetworkRef.current = new AdaptiveEducationalAINetwork({
        // 既存のAIへの参照を渡す
        acquisitionAlgo: acquisitionAlgoRef.current,
        cognitiveLoadAI: cognitiveLoadRef.current,
        errorPredictionAI: errorPredictionRef.current,
        // ...
      });
    }
  }, []);
  
  // 問題選択時にネットワークを経由
  const selectNextQuestion = useCallback((candidates: Question[]) => {
    // 信号を収集
    const signals = adaptiveNetworkRef.current!.collectSignals({
      candidates,
      sessionStats,
      // ...
    });
    
    // 最適戦略を選択
    const strategy = adaptiveNetworkRef.current!.selectOptimalStrategy(signals);
    
    // 戦略を実行して問題を取得
    return adaptiveNetworkRef.current!.executeAndGetQuestion(strategy, candidates);
  }, []);
  
  // 回答記録時に効果測定
  const recordAnswer = useCallback((word: string, isCorrect: boolean, responseTime: number) => {
    // 既存の記録処理
    // ...
    
    // 効果測定
    adaptiveNetworkRef.current!.recordOutcome(word, isCorrect, responseTime);
  }, []);
  
  return {
    selectNextQuestion,
    recordAnswer,
    // 🆕 ネットワーク状態を公開
    networkState: adaptiveNetworkRef.current?.getState(),
    // ...
  };
}
```

#### 成果物
1. `docs/design/ADAPTIVE_NETWORK_ARCHITECTURE.md` (完全なアーキテクチャ図)
2. `docs/design/DATA_MODELS.md` (全データ型の定義)
3. `docs/design/CORE_ALGORITHMS.md` (疑似コード付きアルゴリズム)
4. `docs/design/INTEGRATION_STRATEGY.md` (既存コードとの統合方法)

---

### 📝 工程3: 実装仕様書作成 [8時間]

#### 3.1 API仕様書 [3時間]

```typescript
/**
 * 公開API仕様
 */

// ===========================
// メインクラス
// ===========================

export class AdaptiveEducationalAINetwork {
  constructor(config: NetworkConfig);
  
  // 信号収集
  collectSignals(context: LearningContext): LearningSignal[];
  
  // 戦略選択
  selectOptimalStrategy(signals: LearningSignal[]): StrategyType;
  
  // 戦略実行
  executeStrategy(strategy: StrategyType, context: LearningContext): void;
  
  // 効果測定
  measureEffectiveness(result: StrategyExecutionResult): void;
  
  // 状態取得
  getState(): AdaptiveNetworkState;
  
  // リセット
  reset(): void;
  
  // デバッグ
  getDebugInfo(): NetworkDebugInfo;
}

// ===========================
// ヘルパークラス
// ===========================

export class SignalDetector {
  detectFromAcquisition(algo: AcquisitionQueueManager): LearningSignal | null;
  detectFromCognitiveLoad(monitor: CognitiveLoadMonitor): LearningSignal | null;
  detectFromErrorPrediction(prediction: ErrorPrediction): LearningSignal | null;
  // ...
}

export class StrategyExecutor {
  executeImmediateRepetition(context: LearningContext): void;
  executeTakeBreak(context: LearningContext): void;
  executeClusterLearning(context: LearningContext): void;
  // ...
}

export class EffectivenessTracker {
  track(strategy: StrategyType, result: StrategyExecutionResult): void;
  getEffectiveness(strategy: StrategyType): StrategyEffectiveness;
  getMostEffective(): StrategyType[];
  getLeastEffective(): StrategyType[];
}
```

#### 3.2 テスト仕様書 [3時間]

```typescript
/**
 * テストケース一覧（100ケース以上）
 */

describe('AdaptiveEducationalAINetwork', () => {
  
  // ===========================
  // 信号検出テスト（20ケース）
  // ===========================
  
  describe('Signal Detection', () => {
    test('連続3回誤答で反復信号を検出');
    test('疲労度70%超で休憩信号を検出');
    test('混同ペア検出で関連学習信号を検出');
    test('複数信号の優先順位付け');
    test('信号強度の正規化');
    // ... 15ケース
  });
  
  // ===========================
  // 戦略選択テスト（30ケース）
  // ===========================
  
  describe('Strategy Selection', () => {
    test('最強信号の戦略を選択');
    test('現在の戦略が効果的なら継続');
    test('効果なしで代替戦略に切り替え');
    test('未試行戦略を優先');
    test('過去の成功パターンから選択');
    test('緊急度の高い信号を優先');
    test('認知負荷信号は最優先');
    // ... 23ケース
  });
  
  // ===========================
  // 戦略実行テスト（25ケース）
  // ===========================
  
  describe('Strategy Execution', () => {
    test('即時反復戦略の実行');
    test('休憩推奨の表示');
    test('クラスター学習の問題選択');
    test('混同解消の対比学習');
    test('戦略切り替えの記録');
    // ... 20ケース
  });
  
  // ===========================
  // 効果測定テスト（15ケース）
  // ===========================
  
  describe('Effectiveness Measurement', () => {
    test('短期効果の計算');
    test('中期効果の計算');
    test('長期効果の計算');
    test('成功条件の抽出');
    test('失敗条件の抽出');
    // ... 10ケース
  });
  
  // ===========================
  // 統合テスト（10ケース）
  // ===========================
  
  describe('Integration', () => {
    test('useAdaptiveLearningとの統合');
    test('MemorizationViewでの動作');
    test('複数セッションでの学習');
    test('状態の永続化と復元');
    // ... 6ケース
  });
});
```

#### 3.3 エラーハンドリング仕様 [2時間]

```typescript
/**
 * エラーハンドリング戦略
 */

// カスタムエラー定義
export class AdaptiveNetworkError extends Error {
  constructor(
    public code: ErrorCode,
    public details: any,
    message: string
  ) {
    super(message);
  }
}

export enum ErrorCode {
  SIGNAL_DETECTION_FAILED = 'SIGNAL_DETECTION_FAILED',
  STRATEGY_SELECTION_FAILED = 'STRATEGY_SELECTION_FAILED',
  STRATEGY_EXECUTION_FAILED = 'STRATEGY_EXECUTION_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  AI_MODULE_UNAVAILABLE = 'AI_MODULE_UNAVAILABLE',
}

// エラー処理
try {
  const signals = network.collectSignals(context);
} catch (error) {
  if (error instanceof AdaptiveNetworkError) {
    // ログ記録
    logger.error('Adaptive Network Error:', {
      code: error.code,
      details: error.details,
      message: error.message
    });
    
    // フォールバック戦略
    return fallbackStrategy();
  }
  throw error;
}
```

#### 成果物
1. `docs/specifications/API_SPECIFICATION.md`
2. `docs/specifications/TEST_SPECIFICATION.md`
3. `docs/specifications/ERROR_HANDLING.md`

---

## 🔨 Phase 2: コア実装フェーズ【40時間】

### 工程4: SignalDetector実装 [8時間]

#### 4.1 基本信号検出 [4時間]
```typescript
// src/ai/meta/SignalDetector.ts (新規作成)
export class SignalDetector {
  // 記憶獲得AIから信号検出
  detectFromAcquisition(
    algo: AcquisitionQueueManager,
    word: string
  ): LearningSignal | null {
    const progress = algo.getWordProgress(word);
    
    // 連続誤答検出
    if (progress.consecutiveErrors >= 3) {
      return {
        source: SignalSource.MEMORY_ACQUISITION,
        timestamp: Date.now(),
        recommendedStrategy: StrategyType.IMMEDIATE_REPETITION,
        strength: 90,
        confidence: 0.95,
        reason: `連続${progress.consecutiveErrors}回誤答`,
        evidence: {
          metrics: {
            consecutiveErrors: progress.consecutiveErrors,
            attempts: progress.attempts
          },
          facts: ['記憶未形成', '即時復習必要']
        },
        priority: 9,
        category: 'memory'
      };
    }
    
    return null;
  }
  
  // 認知負荷AIから信号検出
  detectFromCognitiveLoad(
    monitor: CognitiveLoadMonitor
  ): LearningSignal | null {
    // 疲労度チェック
    if (monitor.fatigueLevel > 70) {
      return {
        source: SignalSource.COGNITIVE_LOAD,
        recommendedStrategy: StrategyType.TAKE_BREAK,
        strength: 95,
        reason: `疲労度${monitor.fatigueLevel}%`,
        priority: 10, // 最優先
        category: 'cognitive'
      };
    }
    
    return null;
  }
  
  // ... 他のAIからの信号検出
}
```

#### 4.2 複合信号処理 [2時間]
```typescript
// 複数信号の統合
combineSignals(signals: LearningSignal[]): LearningSignal[] {
  // 重複除去
  const unique = this.deduplicateSignals(signals);
  
  // 優先度でソート
  const sorted = unique.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.strength - a.strength;
  });
  
  return sorted;
}
```

#### 4.3 テスト作成 [2時間]
```typescript
// tests/unit/SignalDetector.test.ts
describe('SignalDetector', () => {
  test('連続誤答で反復信号', () => {
    const signal = detector.detectFromAcquisition(algo, 'run');
    expect(signal?.recommendedStrategy).toBe(StrategyType.IMMEDIATE_REPETITION);
    expect(signal?.strength).toBeGreaterThan(80);
  });
  
  // ... 20テスト
});
```

---

### 工程5: StrategyExecutor実装 [10時間]

#### 5.1 反復系戦略 [3時間]
```typescript
// src/ai/meta/StrategyExecutor.ts (新規作成)
export class StrategyExecutor {
  
  executeImmediateRepetition(context: LearningContext): Question | null {
    // 即時復習キューに追加
    context.acquisitionAlgo.enqueueImmediate(context.currentWord);
    
    // 次の問題を取得
    return context.acquisitionAlgo.getNextQuestion();
  }
  
  executeSpacedRepetition(context: LearningContext): Question | null {
    // 分散学習スケジュールを更新
    context.retentionAlgo.scheduleReview(
      context.currentWord,
      context.personalParams
    );
    
    return context.retentionAlgo.getNextReview();
  }
}
```

#### 5.2 認知負荷系戦略 [2時間]
```typescript
executeTakeBreak(context: LearningContext): void {
  // UI通知を発行
  context.notifyUI({
    type: 'break_recommendation',
    message: '少し休憩しませんか？',
    duration: 10, // 10分推奨
    reason: context.signal.reason
  });
}

executeReduceDifficulty(context: LearningContext): Question | null {
  // 簡単な問題を選択
  const easyQuestions = context.candidates.filter(
    q => q.difficulty <= 2
  );
  
  return easyQuestions[0] || null;
}
```

#### 5.3 関連性系戦略 [3時間]
```typescript
executeClusterLearning(context: LearningContext): Question[] {
  // 関連語クラスターを取得
  const cluster = context.linguisticAI.getRelatedCluster(
    context.currentWord
  );
  
  // クラスター内の単語を連続出題
  return cluster.relatedWords.map(w => 
    context.candidates.find(q => q.word === w)
  ).filter(q => q !== undefined);
}

executeConfusionResolution(context: LearningContext): Question[] {
  // 混同ペアを取得
  const confusionPair = context.errorPredictionAI.getConfusionPair(
    context.currentWord
  );
  
  // 対比学習用の問題セット
  return [
    { ...context.currentQuestion, emphasis: 'distinction' },
    { word: confusionPair.confusedWith, emphasis: 'distinction' }
  ];
}
```

#### 5.4 テスト作成 [2時間]

---

### 工程6: EffectivenessTracker実装 [8時間]

#### 6.1 効果計算 [4時間]
```typescript
// src/ai/meta/EffectivenessTracker.ts (新規作成)
export class EffectivenessTracker {
  
  calculateShortTermEffect(result: StrategyExecutionResult): number {
    // 即時の正答率改善度
    const improvement = 
      result.immediateOutcome.correctAnswers / 
      result.immediateOutcome.questionsPresented * 100;
    
    return improvement;
  }
  
  calculateMediumTermEffect(strategy: StrategyType): number {
    // 次のセッションでの定着率
    // 前回の戦略実行後、今回のセッションまでの保持率を計算
    const wordsLearned = this.getWordsLearnedWith(strategy);
    const retainedWords = wordsLearned.filter(w => 
      this.isRetainedInNextSession(w)
    );
    
    return (retainedWords.length / wordsLearned.length) * 100;
  }
  
  calculateLongTermEffect(strategy: StrategyType): number {
    // 1週間後の保持率
    const wordsLearned = this.getWordsLearnedWith(strategy, 7);
    const retainedWords = wordsLearned.filter(w =>
      this.isRetainedAfterWeek(w)
    );
    
    return (retainedWords.length / wordsLearned.length) * 100;
  }
}
```

#### 6.2 パターン学習 [3時間]
```typescript
extractSuccessConditions(strategy: StrategyType): string[] {
  const successes = this.strategyHistory.filter(
    h => h.strategy === strategy && h.wasSuccessful
  );
  
  // 共通パターンを抽出
  const patterns = this.analyzeCommonPatterns(successes);
  
  return patterns.map(p => p.description);
}

extractFailureConditions(strategy: StrategyType): string[] {
  // 失敗ケースの共通パターン
  // ...
}
```

#### 6.3 テスト作成 [1時間]

---

### 工程7: AdaptiveEducationalAINetwork統合 [10時間]

#### 7.1 メインクラス実装 [6時間]
```typescript
// src/ai/meta/AdaptiveEducationalAINetwork.ts (新規作成)
export class AdaptiveEducationalAINetwork {
  private signalDetector: SignalDetector;
  private strategyExecutor: StrategyExecutor;
  private effectivenessTracker: EffectivenessTracker;
  private state: AdaptiveNetworkState;
  
  constructor(config: NetworkConfig) {
    this.signalDetector = new SignalDetector(config);
    this.strategyExecutor = new StrategyExecutor(config);
    this.effectivenessTracker = new EffectivenessTracker();
    this.state = this.initializeState();
  }
  
  // メインフロー
  selectNextQuestion(context: LearningContext): Question | null {
    // 1. 信号収集
    const signals = this.collectSignals(context);
    
    // 2. 戦略選択
    const strategy = this.selectOptimalStrategy(signals);
    
    // 3. 戦略実行
    const question = this.executeStrategy(strategy, context);
    
    // 4. 状態更新
    this.updateState(strategy, signals);
    
    return question;
  }
  
  // 効果測定
  recordOutcome(word: string, isCorrect: boolean, responseTime: number): void {
    const result: StrategyExecutionResult = {
      strategy: this.state.currentStrategy!,
      executedAt: this.state.strategyStartTime,
      duration: Date.now() - this.state.strategyStartTime,
      immediateOutcome: {
        questionsPresented: 1,
        correctAnswers: isCorrect ? 1 : 0,
        averageResponseTime: responseTime
      },
      wasCompleted: true
    };
    
    this.effectivenessTracker.track(this.state.currentStrategy!, result);
  }
}
```

#### 7.2 状態管理 [2時間]
```typescript
// 状態の永続化
saveState(): void {
  localStorage.setItem(
    'adaptive-network-state',
    JSON.stringify(this.state)
  );
}

loadState(): void {
  const saved = localStorage.getItem('adaptive-network-state');
  if (saved) {
    this.state = JSON.parse(saved);
  }
}
```

#### 7.3 テスト作成 [2時間]

---

### 工程8: useAdaptiveLearning統合 [4時間]

```typescript
// src/hooks/useAdaptiveLearning.ts（既存ファイルに追加）

export function useAdaptiveLearning(...) {
  // 既存コード...
  
  // 🆕 適応的ネットワーク
  const adaptiveNetworkRef = useRef<AdaptiveEducationalAINetwork | null>(null);
  
  useEffect(() => {
    adaptiveNetworkRef.current = new AdaptiveEducationalAINetwork({
      acquisitionAlgo: acquisitionAlgoRef.current!,
      retentionAlgo: retentionAlgoRef.current!,
      // ... 他のAI
    });
  }, []);
  
  const selectNextQuestion = useCallback((candidates: Question[]) => {
    return adaptiveNetworkRef.current!.selectNextQuestion({
      candidates,
      acquisitionAlgo: acquisitionAlgoRef.current!,
      // ...
    });
  }, []);
  
  const recordAnswer = useCallback((word, isCorrect, responseTime) => {
    // 既存の記録
    acquisitionAlgoRef.current?.recordAnswer(word, isCorrect, responseTime);
    
    // 🆕 ネットワークに記録
    adaptiveNetworkRef.current?.recordOutcome(word, isCorrect, responseTime);
  }, []);
  
  return {
    selectNextQuestion,
    recordAnswer,
    networkState: adaptiveNetworkRef.current?.getState(), // 🆕
    // ...
  };
}
```

---

## 🧪 Phase 3: 統合・テストフェーズ【16時間】

### 工程9: ユニットテスト [6時間]

```bash
# テストカバレッジ目標: 90%以上
npm run test:coverage

# 各モジュールのテスト
- SignalDetector: 20 tests
- StrategyExecutor: 25 tests
- EffectivenessTracker: 15 tests
- AdaptiveEducationalAINetwork: 30 tests
- Integration: 10 tests
---
Total: 100+ tests
```

---

### 工程10: E2Eテスト [4時間]

```typescript
// tests/e2e/adaptive-network.spec.ts
describe('Adaptive Network E2E', () => {
  test('連続誤答→即時反復→改善のフロー', async () => {
    // 1. 連続で3回誤答
    await page.click('[data-testid="answer-wrong"]');
    await page.click('[data-testid="answer-wrong"]');
    await page.click('[data-testid="answer-wrong"]');
    
    // 2. 即時反復戦略が発動
    await expect(page.locator('[data-testid="strategy-notification"]'))
      .toContainText('即時反復学習');
    
    // 3. 同じ単語が連続出題
    const word1 = await page.textContent('[data-testid="question-word"]');
    await page.click('[data-testid="show-answer"]');
    await page.click('[data-testid="next"]');
    
    const word2 = await page.textContent('[data-testid="question-word"]');
    expect(word1).toBe(word2);
    
    // 4. 正答率が改善
    await page.click('[data-testid="answer-correct"]');
    // ...
  });
  
  test('疲労検出→休憩推奨→難易度低下のフロー');
  test('混同検出→対比学習→区別成功のフロー');
  // ... 10 tests
});
```

---

### 工程11: UI統合とドキュメント [6時間]

#### 11.1 MemorizationViewへのUI追加 [3時間]

```typescript
// src/components/MemorizationView.tsx（既存ファイルに追加）

function MemorizationView(...) {
  const { networkState } = useAdaptiveLearning();
  
  return (
    <div>
      {/* 🆕 戦略表示 */}
      {networkState?.currentStrategy && (
        <div className="strategy-indicator">
          <span className="strategy-icon">
            {getStrategyIcon(networkState.currentStrategy)}
          </span>
          <span className="strategy-name">
            {getStrategyName(networkState.currentStrategy)}
          </span>
          <button onClick={() => setShowStrategyDetails(true)}>
            詳細
          </button>
        </div>
      )}
      
      {/* 🆕 効果ダッシュボード（モーダル） */}
      {showStrategyDetails && (
        <StrategyEffectivenessModal
          state={networkState}
          onClose={() => setShowStrategyDetails(false)}
        />
      )}
      
      {/* 既存のUI */}
      {/* ... */}
    </div>
  );
}
```

#### 11.2 ドキュメント作成 [3時間]

**成果物:**
1. `docs/USER_GUIDE_ADAPTIVE_NETWORK.md` (ユーザーガイド)
2. `docs/DEVELOPER_GUIDE_ADAPTIVE_NETWORK.md` (開発者ガイド)
3. `docs/API_REFERENCE_ADAPTIVE_NETWORK.md` (APIリファレンス)
4. `CHANGELOG.md` 更新

---

## 📅 実装スケジュール

### タイムライン（10日間）

```
Day 1-3: 調査・設計フェーズ
├─ Day 1: 既存AI統合ポイント分析 [8h]
├─ Day 2: アーキテクチャ設計 [8h]
└─ Day 3: 実装仕様書作成 [8h]

Day 4-8: コア実装フェーズ
├─ Day 4: SignalDetector実装 [8h]
├─ Day 5: StrategyExecutor実装（前半） [8h]
├─ Day 6: StrategyExecutor実装（後半）+ EffectivenessTracker [8h]
├─ Day 7: AdaptiveEducationalAINetwork統合 [8h]
└─ Day 8: useAdaptiveLearning統合 + バグ修正 [8h]

Day 9-10: 統合・テストフェーズ
├─ Day 9: ユニットテスト + E2Eテスト [10h]
└─ Day 10: UI統合 + ドキュメント + 最終レビュー [6h]

Total: 80時間
```

---

## ✅ 品質基準

### コード品質
- ✅ TypeScript型安全性100%
- ✅ ESLintエラー0件
- ✅ テストカバレッジ90%以上
- ✅ 全テスト成功

### ドキュメント品質
- ✅ 全公開APIにJSDocコメント
- ✅ アーキテクチャ図の完成
- ✅ ユーザーガイドの完成
- ✅ 開発者ガイドの完成

### パフォーマンス
- ✅ 信号収集: < 50ms
- ✅ 戦略選択: < 20ms
- ✅ 問題選択全体: < 100ms

### メンテナンス性
- ✅ 各クラス300行以内
- ✅ 関数の複雑度10以下
- ✅ 依存関係の明確化
- ✅ 拡張性を考慮した設計

---

## 🎯 期待される成果

### 技術的成果
1. **世界初**の適応的教育AIネットワークの実装
2. 7つのAIモジュールの統合
3. メタ認知型学習システムの実現

### 学習効果
1. 記憶定着率: **50%以上向上**（予測）
2. 学習継続率: **30%以上向上**
3. 個人最適化: **完全パーソナライズ**

### ユーザー体験
1. プロ家庭教師レベルの適応的指導
2. 押してダメなら引く柔軟性
3. 透明性のある戦略説明

---

## 🚀 将来の拡張性

### Phase 4以降の発展（将来）
1. **機械学習統合**: 戦略選択の自動最適化
2. **感情認識**: 表情・音声から学習意欲を検出
3. **マルチモーダル強化**: VR/AR学習環境
4. **協調学習**: 複数学習者間での戦略共有

---

## 📊 リスク管理

### リスクと対策

| リスク | 影響 | 確率 | 対策 |
|--------|------|------|------|
| 既存AIとの統合不具合 | 高 | 中 | 十分な調査時間を確保 |
| パフォーマンス劣化 | 中 | 低 | 信号収集の最適化 |
| 複雑性によるバグ | 高 | 中 | 包括的テスト |
| 工数オーバー | 中 | 中 | 余裕を持った計画 |

### 緊急時の対応
- **Plan B**: 段階的ロールアウト（一部機能のみ先行実装）
- **Plan C**: 既存システムへのフォールバック機能

---

## 🎓 まとめ

この計画は：
- ✅ **十分な調査時間**（24時間）を確保
- ✅ **高品質実装**を重視
- ✅ **メンテナンス性**を考慮
- ✅ **段階的実装**で低リスク
- ✅ **包括的テスト**で安定性確保

プロジェクトの根幹となる革新的システムを、**最高品質**で構築します。

---

**策定日**: 2025年12月16日  
**見積もり**: 80時間（10日間）  
**優先度**: 最高  
**革新度**: ★★★★★（世界初）
