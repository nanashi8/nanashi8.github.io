# Adaptive Educational AI Network - API仕様書

## 概要

本ドキュメントは、Adaptive Educational AI Networkの全クラス・メソッドの詳細API仕様を定義します。

**作成日**: 2025年12月16日  
**バージョン**: 1.0.0  
**フェーズ**: Phase 1, Step 3

---

## 1. AdaptiveEducationalAINetwork（メインコントローラー）

### 1.1 クラス定義

```typescript
class AdaptiveEducationalAINetwork {
  private signalDetector: SignalDetector;
  private strategyExecutor: StrategyExecutor;
  private effectivenessTracker: EffectivenessTracker;
  private state: AdaptiveNetworkState;
  private config: NetworkConfig;
}
```

### 1.2 コンストラクタ

```typescript
constructor(config?: Partial<NetworkConfig>)
```

**パラメータ**:
- `config` (optional): ネットワーク設定の部分的なオーバーライド

**デフォルト動作**:
- `config.enabled = false` (保守的なデフォルト)
- LocalStorageから既存の状態を復元
- 状態が存在しない場合は初期化

**エラー**:
- LocalStorage読み込みエラー時は警告ログを出力し、新規状態を作成

**例**:
```typescript
const network = new AdaptiveEducationalAINetwork({
  enabled: true,
  minSignalStrength: 0.3
});
```

---

### 1.3 initialize()

```typescript
async initialize(): Promise<void>
```

**目的**: ネットワークの初期化（非同期データロードなど）

**戻り値**: `Promise<void>`

**処理内容**:
1. SignalDetectorの初期化
2. StrategyExecutorの初期化
3. EffectivenessTrackerの履歴データロード
4. 状態の検証と修復

**エラー**:
- 初期化失敗時は`NetworkInitializationError`をスロー
- 部分的な失敗は警告ログを出力し続行

**使用例**:
```typescript
const network = new AdaptiveEducationalAINetwork();
await network.initialize();
```

---

### 1.4 processQuestion()

```typescript
async processQuestion(
  word: string,
  result: 'correct' | 'incorrect',
  context: QuestionContext
): Promise<StrategyRecommendation>
```

**目的**: 質問の結果を処理し、次の戦略を決定

**パラメータ**:
- `word`: 学習中の単語
- `result`: 回答結果（'correct' | 'incorrect'）
- `context`: 質問のコンテキスト情報
  ```typescript
  interface QuestionContext {
    timeSpent: number;           // 回答時間（ミリ秒）
    attemptNumber: number;        // 試行回数
    sessionDuration: number;      // セッション経過時間
    recentErrors: number;         // 直近のエラー数
    cognitiveLoad?: number;       // 現在の認知負荷
  }
  ```

**戻り値**: `Promise<StrategyRecommendation>`
```typescript
interface StrategyRecommendation {
  strategy: StrategyType;
  confidence: number;           // 0-1
  reason: string;               // 人間可読な理由
  signals: LearningSignal[];    // 決定に使用されたシグナル
  metadata?: Record<string, any>;
}
```

**処理フロー**:
1. SignalDetectorからシグナルを収集
2. StrategyExecutorで最適戦略を選択
3. EffectivenessTrackerで効果を記録
4. 状態を更新してLocalStorageに保存
5. 推奨戦略を返す

**エラー処理**:
- シグナル検出失敗時はデフォルト戦略（CONTINUE_NORMAL）を返す
- 戦略選択失敗時はフォールバック戦略を使用
- トラッキング失敗は警告ログのみ（処理は続行）

**パフォーマンス**:
- 通常: 10-50ms
- 最大: 200ms（タイムアウト設定可能）

**使用例**:
```typescript
const recommendation = await network.processQuestion(
  'apple',
  'incorrect',
  {
    timeSpent: 5000,
    attemptNumber: 3,
    sessionDuration: 600000,
    recentErrors: 2
  }
);

console.log(`推奨戦略: ${recommendation.strategy}`);
console.log(`理由: ${recommendation.reason}`);
```

---

### 1.5 getState()

```typescript
getState(): Readonly<AdaptiveNetworkState>
```

**目的**: 現在のネットワーク状態を取得（読み取り専用）

**戻り値**: `Readonly<AdaptiveNetworkState>`
```typescript
interface AdaptiveNetworkState {
  enabled: boolean;
  currentStrategy: StrategyType | null;
  activeSignals: LearningSignal[];
  effectiveness: Map<StrategyType, StrategyEffectiveness>;
  sessionStats: SessionStatistics;
  lastUpdated: number;
}
```

**注意**:
- 状態は読み取り専用（immutable）
- 変更するには`updateConfig()`を使用

**使用例**:
```typescript
const state = network.getState();
console.log(`有効: ${state.enabled}`);
console.log(`現在の戦略: ${state.currentStrategy}`);
```

---

### 1.6 updateConfig()

```typescript
updateConfig(config: Partial<NetworkConfig>): void
```

**目的**: ネットワーク設定を動的に更新

**パラメータ**:
- `config`: 更新する設定項目

**更新可能な設定**:
- `enabled`: ネットワークのON/OFF
- `minSignalStrength`: 最小シグナル強度閾値
- `minConfidence`: 最小信頼度閾値
- `maxActiveSignals`: 最大アクティブシグナル数
- `effectivenessWindowSize`: 効果測定のウィンドウサイズ

**副作用**:
- 設定変更はLocalStorageに即座に保存
- 次の`processQuestion()`呼び出しから反映

**使用例**:
```typescript
// ネットワークを有効化
network.updateConfig({ enabled: true });

// シグナル感度を上げる
network.updateConfig({ minSignalStrength: 0.2 });
```

---

### 1.7 resetState()

```typescript
resetState(): void
```

**目的**: ネットワーク状態を初期状態にリセット

**処理内容**:
- すべての効果測定データをクリア
- アクティブシグナルをクリア
- セッション統計をリセット
- LocalStorageから状態を削除

**使用例**:
```typescript
network.resetState();
```

---

### 1.8 exportState()

```typescript
exportState(): string
```

**目的**: 現在の状態をJSON文字列としてエクスポート

**戻り値**: JSON文字列（デバッグ・バックアップ用）

**使用例**:
```typescript
const stateJson = network.exportState();
localStorage.setItem('backup', stateJson);
```

---

### 1.9 importState()

```typescript
importState(stateJson: string): void
```

**目的**: JSON文字列から状態をインポート

**パラメータ**:
- `stateJson`: エクスポートされたJSON文字列

**エラー**:
- 無効なJSONの場合は`InvalidStateError`をスロー
- スキーマ不一致の場合は警告を出して部分的にインポート

**使用例**:
```typescript
const backup = localStorage.getItem('backup');
if (backup) {
  network.importState(backup);
}
```

---

## 2. SignalDetector（シグナル検出器）

### 2.1 クラス定義

```typescript
class SignalDetector {
  private memoryAcquisition: MemoryAcquisitionAlgorithm;
  private cognitiveLoadAI: CognitiveLoadAI;
  private errorPredictionAI: ErrorPredictionAI;
  private learningStyleAI: LearningStyleAI;
  private linguisticRelationsAI: LinguisticRelationsAI;
  private contextualLearningAI: ContextualLearningAI;
  private config: NetworkConfig;
}
```

---

### 2.2 detectSignals()

```typescript
async detectSignals(
  word: string,
  result: 'correct' | 'incorrect',
  context: QuestionContext
): Promise<LearningSignal[]>
```

**目的**: すべてのAIモジュールからシグナルを検出

**パラメータ**:
- `word`: 学習中の単語
- `result`: 回答結果
- `context`: 質問コンテキスト

**戻り値**: `Promise<LearningSignal[]>`
```typescript
interface LearningSignal {
  source: SignalSource;
  type: StrategyType;
  strength: number;          // 0-1
  confidence: number;        // 0-1
  priority: number;          // 1-10
  timestamp: number;
  metadata?: Record<string, any>;
}
```

**処理フロー**:
1. 並列で全AIモジュールに問い合わせ
2. 各モジュールからシグナルを収集
3. `minSignalStrength`未満のシグナルをフィルタ
4. 優先度でソート
5. 上位`maxActiveSignals`件を返す

**エラー処理**:
- 個別のAIモジュールエラーは無視（ログ出力のみ）
- すべてのモジュールが失敗した場合は空配列を返す
- タイムアウト: 150ms（設定可能）

**パフォーマンス最適化**:
- Promise.allで並列処理
- 各AIモジュールは非同期対応
- キャッシング可能なシグナルはキャッシュ

**使用例**:
```typescript
const signals = await detector.detectSignals('apple', 'incorrect', context);
console.log(`検出されたシグナル: ${signals.length}件`);
signals.forEach(s => {
  console.log(`${s.source}: ${s.type} (強度: ${s.strength})`);
});
```

---

### 2.3 detectMemoryAcquisitionSignals()

```typescript
private async detectMemoryAcquisitionSignals(
  word: string,
  result: 'correct' | 'incorrect'
): Promise<LearningSignal[]>
```

**目的**: Memory Acquisition AIからシグナルを検出

**検出シグナル**:
1. **IMMEDIATE_REPETITION** (strength: 0.8-1.0)
   - 条件: 不正解 AND 連続エラー3回以上
   - priority: 9
   
2. **SPACED_REPETITION** (strength: 0.6-0.8)
   - 条件: 正解 AND 習得進捗50%以上
   - priority: 7
   
3. **INCREASE_EXPOSURE** (strength: 0.5-0.7)
   - 条件: 不正解 AND 露出回数不足
   - priority: 8

**メタデータ**:
```typescript
{
  currentExposure: number,
  targetExposure: number,
  consecutiveErrors: number,
  acquisitionProgress: number  // 0-100
}
```

---

### 2.4 detectCognitiveLoadSignals()

```typescript
private async detectCognitiveLoadSignals(
  context: QuestionContext
): Promise<LearningSignal[]>
```

**目的**: Cognitive Load AIからシグナルを検出

**検出シグナル**:
1. **TAKE_BREAK** (strength: 0.9-1.0)
   - 条件: 認知負荷 > 0.8
   - priority: 10 (最高優先度)
   
2. **REDUCE_DIFFICULTY** (strength: 0.6-0.8)
   - 条件: 認知負荷 > 0.6 AND 連続エラー
   - priority: 8
   
3. **ADJUST_SESSION_LENGTH** (strength: 0.4-0.6)
   - 条件: セッション時間 > 30分
   - priority: 6

**メタデータ**:
```typescript
{
  cognitiveLoad: number,      // 0-1
  sessionDuration: number,
  recommendedBreakDuration: number,
  fatigueLevel: 'low' | 'medium' | 'high'
}
```

---

### 2.5 detectErrorPredictionSignals()

```typescript
private async detectErrorPredictionSignals(
  word: string,
  result: 'correct' | 'incorrect'
): Promise<LearningSignal[]>
```

**目的**: Error Prediction AIからシグナルを検出

**検出シグナル**:
1. **USE_CONFUSION_PAIRS** (strength: 0.7-0.9)
   - 条件: 混同ペアが検出された
   - priority: 8
   
2. **CONTEXTUAL_LEARNING** (strength: 0.5-0.7)
   - 条件: 文脈不足による誤答
   - priority: 7

**メタデータ**:
```typescript
{
  confusionPairs: string[],
  errorType: 'spelling' | 'meaning' | 'pronunciation',
  predictedDifficulty: number
}
```

---

### 2.6 detectLearningStyleSignals()

```typescript
private async detectLearningStyleSignals(
  context: QuestionContext
): Promise<LearningSignal[]>
```

**目的**: Learning Style AIからシグナルを検出

**検出シグナル**:
1. **TIME_OF_DAY_OPTIMIZATION** (strength: 0.3-0.5)
   - 条件: 時間帯による学習効率差
   - priority: 4
   
2. **ADJUST_SESSION_LENGTH** (strength: 0.4-0.6)
   - 条件: セッション長の最適化
   - priority: 5

**メタデータ**:
```typescript
{
  optimalTimeOfDay: string,
  currentTimeOfDay: string,
  optimalSessionLength: number,
  learningStyleProfile: object
}
```

---

### 2.7 detectLinguisticRelationsSignals()

```typescript
private async detectLinguisticRelationsSignals(
  word: string
): Promise<LearningSignal[]>
```

**目的**: Linguistic Relations AIからシグナルを検出

**検出シグナル**:
1. **GROUP_BY_THEME** (strength: 0.6-0.8)
   - 条件: 関連語彙が3つ以上存在
   - priority: 6
   
2. **USE_ETYMOLOGY** (strength: 0.4-0.6)
   - 条件: 語源情報が利用可能
   - priority: 5

**メタデータ**:
```typescript
{
  relatedWords: string[],
  etymologyInfo: object,
  wordFamily: string[],
  semanticCluster: string
}
```

---

### 2.8 detectContextualLearningSignals()

```typescript
private async detectContextualLearningSignals(
  word: string,
  result: 'correct' | 'incorrect'
): Promise<LearningSignal[]>
```

**目的**: Contextual Learning AIからシグナルを検出

**検出シグナル**:
1. **CONTEXTUAL_LEARNING** (strength: 0.7-0.9)
   - 条件: 不正解 AND 文脈例文あり
   - priority: 7
   
2. **GROUP_BY_THEME** (strength: 0.5-0.7)
   - 条件: テーマ別学習が効果的
   - priority: 6

**メタデータ**:
```typescript
{
  availableContexts: number,
  themeCategory: string,
  relatedThemeWords: string[]
}
```

---

## 3. StrategyExecutor（戦略実行器）

### 3.1 クラス定義

```typescript
class StrategyExecutor {
  private config: NetworkConfig;
  private strategyHistory: StrategyRecord[];
}
```

---

### 3.2 selectBestStrategy()

```typescript
selectBestStrategy(
  signals: LearningSignal[],
  effectiveness: Map<StrategyType, StrategyEffectiveness>
): StrategyRecommendation
```

**目的**: シグナルから最適な戦略を選択

**パラメータ**:
- `signals`: 検出されたシグナル配列
- `effectiveness`: 各戦略の効果測定データ

**戻り値**: `StrategyRecommendation`

**選択アルゴリズム**:
```typescript
function calculateScore(signal: LearningSignal, effectiveness: StrategyEffectiveness): number {
  const baseScore = signal.strength * signal.priority;
  const confidenceBonus = signal.confidence * 2;
  const effectivenessBonus = effectiveness.successRate * 3;
  const recencyPenalty = (Date.now() - effectiveness.lastUsed) / 1000000; // 減衰
  
  return baseScore + confidenceBonus + effectivenessBonus - recencyPenalty;
}
```

**優先ルール**:
1. **緊急度優先**: priority 10のシグナルは無条件で選択
2. **信頼度閾値**: confidence < `minConfidence`のシグナルは除外
3. **効果測定**: 過去の成功率を加味
4. **多様性**: 同じ戦略の連続使用にペナルティ

**フォールバック**:
- シグナルなし → `CONTINUE_NORMAL`
- 選択不可 → `SPACED_REPETITION`（デフォルト戦略）

**使用例**:
```typescript
const recommendation = executor.selectBestStrategy(signals, effectiveness);
console.log(`選択された戦略: ${recommendation.strategy}`);
console.log(`信頼度: ${recommendation.confidence}`);
```

---

### 3.3 executeStrategy()

```typescript
async executeStrategy(
  strategy: StrategyType,
  word: string,
  context: QuestionContext
): Promise<StrategyExecutionResult>
```

**目的**: 選択された戦略を実際に実行

**パラメータ**:
- `strategy`: 実行する戦略タイプ
- `word`: 対象単語
- `context`: 実行コンテキスト

**戻り値**: `Promise<StrategyExecutionResult>`
```typescript
interface StrategyExecutionResult {
  success: boolean;
  strategy: StrategyType;
  actions: ExecutedAction[];
  duration: number;          // 実行時間（ミリ秒）
  error?: Error;
}

interface ExecutedAction {
  type: string;
  timestamp: number;
  metadata?: any;
}
```

**戦略別実行内容**:

#### IMMEDIATE_REPETITION
```typescript
{
  actions: [
    { type: 'QUEUE_FRONT', timestamp, metadata: { word, position: 0 } }
  ]
}
```

#### TAKE_BREAK
```typescript
{
  actions: [
    { type: 'PAUSE_SESSION', timestamp, metadata: { duration: 300000 } },
    { type: 'SHOW_BREAK_NOTIFICATION', timestamp }
  ]
}
```

#### USE_CONFUSION_PAIRS
```typescript
{
  actions: [
    { type: 'LOAD_CONFUSION_PAIRS', timestamp, metadata: { pairs: [...] } },
    { type: 'QUEUE_RELATED_WORDS', timestamp }
  ]
}
```

**エラーハンドリング**:
- 実行失敗時は`success: false`を返す
- エラー詳細は`error`フィールドに格納
- フォールバック戦略への自動切り替えなし（呼び出し側で判断）

---

## 4. EffectivenessTracker（効果測定器）

### 4.1 クラス定義

```typescript
class EffectivenessTracker {
  private effectiveness: Map<StrategyType, StrategyEffectiveness>;
  private config: NetworkConfig;
  private measurements: EffectivenessMeasurement[];
}
```

---

### 4.2 recordOutcome()

```typescript
recordOutcome(
  strategy: StrategyType,
  outcome: LearningOutcome
): void
```

**目的**: 戦略実行の結果を記録

**パラメータ**:
- `strategy`: 使用された戦略
- `outcome`: 学習結果
  ```typescript
  interface LearningOutcome {
    word: string;
    success: boolean;
    timeToMastery?: number;      // 習得までの時間
    retentionRate?: number;       // 定着率（次回正答率）
    timestamp: number;
  }
  ```

**処理内容**:
1. 対応する`StrategyEffectiveness`を更新
2. 成功/失敗カウントを増分
3. 平均指標を再計算
4. LocalStorageに保存

**効果測定指標**:
```typescript
interface StrategyEffectiveness {
  strategyType: StrategyType;
  totalUses: number;
  successCount: number;
  failureCount: number;
  successRate: number;           // successCount / totalUses
  averageTimeToMastery: number;
  averageRetentionRate: number;
  lastUsed: number;
  confidence: number;             // 測定の信頼性（サンプル数依存）
}
```

**信頼度計算**:
```typescript
function calculateConfidence(totalUses: number): number {
  // ベイズ的信頼度: サンプル数が多いほど高い
  const alpha = 2; // 事前分布のパラメータ
  const beta = 2;
  return Math.min(1, totalUses / (totalUses + alpha + beta));
}
```

---

### 4.3 getEffectiveness()

```typescript
getEffectiveness(strategy: StrategyType): StrategyEffectiveness | undefined
```

**目的**: 指定された戦略の効果測定データを取得

**パラメータ**:
- `strategy`: 戦略タイプ

**戻り値**: 
- データが存在する場合: `StrategyEffectiveness`
- データがない場合: `undefined`

---

### 4.4 getAllEffectiveness()

```typescript
getAllEffectiveness(): Map<StrategyType, StrategyEffectiveness>
```

**目的**: すべての戦略の効果測定データを取得

**戻り値**: `Map<StrategyType, StrategyEffectiveness>`

**使用例**:
```typescript
const allEffectiveness = tracker.getAllEffectiveness();
for (const [strategy, data] of allEffectiveness) {
  console.log(`${strategy}: 成功率 ${data.successRate * 100}%`);
}
```

---

### 4.5 compareStrategies()

```typescript
compareStrategies(
  strategy1: StrategyType,
  strategy2: StrategyType
): StrategyComparison
```

**目的**: 2つの戦略の効果を比較

**戻り値**: `StrategyComparison`
```typescript
interface StrategyComparison {
  betterStrategy: StrategyType | null;
  successRateDiff: number;
  confidenceLevel: number;        // 統計的有意性
  recommendation: string;
}
```

**統計的検定**:
- フィッシャーの正確確率検定を使用
- p < 0.05で有意差ありと判定

**使用例**:
```typescript
const comparison = tracker.compareStrategies(
  StrategyType.IMMEDIATE_REPETITION,
  StrategyType.SPACED_REPETITION
);
console.log(`より効果的: ${comparison.betterStrategy}`);
```

---

### 4.6 exportMetrics()

```typescript
exportMetrics(): EffectivenessReport
```

**目的**: 効果測定レポートをエクスポート

**戻り値**: `EffectivenessReport`
```typescript
interface EffectivenessReport {
  generatedAt: number;
  totalMeasurements: number;
  strategies: StrategyEffectiveness[];
  topPerformers: StrategyType[];     // 上位3つ
  recommendations: string[];
}
```

**使用例**:
```typescript
const report = tracker.exportMetrics();
console.log('トップ3戦略:');
report.topPerformers.forEach(s => console.log(s));
```

---

## 5. React Hooks統合

### 5.1 useAdaptiveLearning()

```typescript
function useAdaptiveLearning(): AdaptiveLearningHook
```

**目的**: Reactコンポーネントから簡単にネットワークを利用

**戻り値**: `AdaptiveLearningHook`
```typescript
interface AdaptiveLearningHook {
  enabled: boolean;
  currentStrategy: StrategyType | null;
  processQuestion: (
    word: string,
    result: 'correct' | 'incorrect',
    context: QuestionContext
  ) => Promise<StrategyRecommendation>;
  toggleEnabled: () => void;
  resetState: () => void;
  effectiveness: Map<StrategyType, StrategyEffectiveness>;
  isLoading: boolean;
  error: Error | null;
}
```

**内部実装**:
```typescript
function useAdaptiveLearning(): AdaptiveLearningHook {
  const [network] = useState(() => new AdaptiveEducationalAINetwork());
  const [enabled, setEnabled] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<StrategyType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    network.initialize().catch(setError);
  }, []);

  const processQuestion = useCallback(async (word, result, context) => {
    if (!enabled) return DEFAULT_RECOMMENDATION;
    
    setIsLoading(true);
    try {
      const recommendation = await network.processQuestion(word, result, context);
      setCurrentStrategy(recommendation.strategy);
      return recommendation;
    } catch (e) {
      setError(e);
      return FALLBACK_RECOMMENDATION;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, network]);

  // ...
}
```

**使用例**:
```typescript
function VocabularyQuiz() {
  const {
    enabled,
    processQuestion,
    toggleEnabled,
    currentStrategy,
    isLoading
  } = useAdaptiveLearning();

  const handleAnswer = async (word: string, correct: boolean) => {
    const recommendation = await processQuestion(word, 
      correct ? 'correct' : 'incorrect',
      {
        timeSpent: answerTime,
        attemptNumber: attempts,
        sessionDuration: sessionTime,
        recentErrors: errors
      }
    );
    
    // 推奨戦略に基づいてUIを更新
    if (recommendation.strategy === StrategyType.TAKE_BREAK) {
      showBreakScreen();
    }
  };

  return (
    <div>
      <button onClick={toggleEnabled}>
        {enabled ? 'AI Network ON' : 'AI Network OFF'}
      </button>
      {currentStrategy && <div>現在の戦略: {currentStrategy}</div>}
      {/* Quiz UI */}
    </div>
  );
}
```

---

## 6. エラー定義

### 6.1 NetworkInitializationError

```typescript
class NetworkInitializationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'NetworkInitializationError';
  }
}
```

**発生条件**:
- LocalStorage読み込み失敗
- AIモジュールの初期化失敗

---

### 6.2 InvalidStateError

```typescript
class InvalidStateError extends Error {
  constructor(message: string, public invalidState?: any) {
    super(message);
    this.name = 'InvalidStateError';
  }
}
```

**発生条件**:
- `importState()`で無効なJSON
- 状態スキーマの不一致

---

### 6.3 SignalDetectionError

```typescript
class SignalDetectionError extends Error {
  constructor(message: string, public source?: SignalSource) {
    super(message);
    this.name = 'SignalDetectionError';
  }
}
```

**発生条件**:
- AIモジュールからのシグナル取得失敗
- タイムアウト

---

### 6.4 StrategyExecutionError

```typescript
class StrategyExecutionError extends Error {
  constructor(message: string, public strategy?: StrategyType) {
    super(message);
    this.name = 'StrategyExecutionError';
  }
}
```

**発生条件**:
- 戦略実行中のエラー
- 無効な戦略タイプ

---

## 7. LocalStorage スキーマ

### 7.1 キー定義

```typescript
const STORAGE_KEYS = {
  NETWORK_STATE: 'adaptive_network_state',
  EFFECTIVENESS: 'adaptive_network_effectiveness',
  CONFIG: 'adaptive_network_config',
  VERSION: 'adaptive_network_version'
};
```

---

### 7.2 データ構造

#### network_state
```json
{
  "version": "1.0.0",
  "enabled": false,
  "currentStrategy": null,
  "activeSignals": [],
  "sessionStats": {
    "questionsAnswered": 0,
    "correctAnswers": 0,
    "incorrectAnswers": 0,
    "sessionStartTime": 1734336000000,
    "totalSessionTime": 0
  },
  "lastUpdated": 1734336000000
}
```

#### effectiveness
```json
{
  "version": "1.0.0",
  "strategies": {
    "IMMEDIATE_REPETITION": {
      "strategyType": "IMMEDIATE_REPETITION",
      "totalUses": 50,
      "successCount": 35,
      "failureCount": 15,
      "successRate": 0.7,
      "averageTimeToMastery": 120000,
      "averageRetentionRate": 0.65,
      "lastUsed": 1734336000000,
      "confidence": 0.85
    }
  },
  "measurements": []
}
```

#### config
```json
{
  "version": "1.0.0",
  "enabled": false,
  "minSignalStrength": 0.3,
  "minConfidence": 0.5,
  "maxActiveSignals": 10,
  "effectivenessWindowSize": 50,
  "debug": false
}
```

---

## 8. パフォーマンス要件

### 8.1 レスポンスタイム

| メソッド | 目標 | 最大 |
|---------|------|------|
| `processQuestion()` | 30ms | 200ms |
| `detectSignals()` | 20ms | 150ms |
| `selectBestStrategy()` | 5ms | 50ms |
| `recordOutcome()` | 2ms | 20ms |

### 8.2 メモリ使用量

- ネットワークインスタンス: < 5MB
- LocalStorage: < 2MB
- アクティブシグナル: < 1MB

### 8.3 LocalStorage I/O

- 読み込み: 初期化時のみ
- 書き込み: 状態変更時（バッチ処理）
- デバウンス: 500ms

---

## 9. バージョニング

### 9.1 セマンティックバージョニング

**形式**: `MAJOR.MINOR.PATCH`

- **MAJOR**: 破壊的変更（LocalStorageスキーマ変更など）
- **MINOR**: 新機能追加（後方互換性あり）
- **PATCH**: バグフィックス

### 9.2 マイグレーション

```typescript
interface VersionMigration {
  from: string;
  to: string;
  migrate: (oldState: any) => any;
}

const migrations: VersionMigration[] = [
  {
    from: '1.0.0',
    to: '1.1.0',
    migrate: (state) => {
      // マイグレーションロジック
      return { ...state, newField: defaultValue };
    }
  }
];
```

---

## 10. デバッグ・ロギング

### 10.1 ログレベル

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}
```

### 10.2 ログ出力

```typescript
interface LogEntry {
  level: LogLevel;
  timestamp: number;
  message: string;
  context?: any;
}
```

**有効化**:
```typescript
network.updateConfig({ debug: true });
```

**出力例**:
```
[2025-12-16 10:30:45] [INFO] Signal detected: IMMEDIATE_REPETITION (strength: 0.85)
[2025-12-16 10:30:45] [DEBUG] Strategy selected: IMMEDIATE_REPETITION (confidence: 0.92)
[2025-12-16 10:30:46] [INFO] Strategy executed successfully (duration: 25ms)
```

---

## 11. テスト可能性

### 11.1 モック対応

すべてのクラスはインターフェースを実装し、依存性注入可能：

```typescript
interface ISignalDetector {
  detectSignals(word: string, result: string, context: QuestionContext): Promise<LearningSignal[]>;
}

class MockSignalDetector implements ISignalDetector {
  async detectSignals(): Promise<LearningSignal[]> {
    return [/* mock signals */];
  }
}
```

### 11.2 テスト用ユーティリティ

```typescript
class TestUtils {
  static createMockNetwork(config?: Partial<NetworkConfig>): AdaptiveEducationalAINetwork;
  static createMockSignal(overrides?: Partial<LearningSignal>): LearningSignal;
  static createMockContext(overrides?: Partial<QuestionContext>): QuestionContext;
}
```

---

## 付録A: 戦略タイプ一覧

| 戦略 | 優先度 | 適用条件 | 期待効果 |
|-----|--------|---------|---------|
| `TAKE_BREAK` | 10 | 認知負荷 > 0.8 | 疲労回復 |
| `IMMEDIATE_REPETITION` | 9 | 連続エラー3回以上 | 即時強化 |
| `USE_CONFUSION_PAIRS` | 8 | 混同ペア検出 | 識別強化 |
| `REDUCE_DIFFICULTY` | 8 | 高認知負荷 + エラー | 負荷軽減 |
| `SPACED_REPETITION` | 7 | 習得進捗50%以上 | 長期定着 |
| `CONTEXTUAL_LEARNING` | 7 | 文脈不足 | 意味理解 |
| `GROUP_BY_THEME` | 6 | 関連語彙多数 | 関連付け |
| `ADJUST_SESSION_LENGTH` | 5 | 長時間学習 | 集中維持 |
| `USE_ETYMOLOGY` | 5 | 語源利用可能 | 深い理解 |
| `TIME_OF_DAY_OPTIMIZATION` | 4 | 時間帯最適化 | 効率向上 |
| `CONTINUE_NORMAL` | 1 | デフォルト | 通常学習 |

---

## 付録B: シグナルソース一覧

| ソース | 担当AI | 主な検出内容 |
|--------|--------|------------|
| `MEMORY_ACQUISITION` | Memory Acquisition AI | 習得進捗、露出回数 |
| `COGNITIVE_LOAD` | Cognitive Load AI | 認知負荷、疲労度 |
| `ERROR_PREDICTION` | Error Prediction AI | 混同ペア、エラーパターン |
| `LEARNING_STYLE` | Learning Style AI | 時間帯、セッション長 |
| `LINGUISTIC_RELATIONS` | Linguistic Relations AI | 語源、関連語彙 |
| `CONTEXTUAL_LEARNING` | Contextual Learning AI | 文脈、テーマ |
| `GAMIFICATION` | Gamification AI | モチベーション（将来） |

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | 2025-12-16 | 初版作成 |

---

**文書終了**
