# Adaptive Educational AI Network - エラーハンドリング戦略

## 概要

本ドキュメントは、Adaptive Educational AI Networkの包括的なエラーハンドリング戦略を定義します。

**作成日**: 2025年12月16日  
**バージョン**: 1.0.0  
**フェーズ**: Phase 1, Step 3

---

## 目次

1. [エラー分類](#1-エラー分類)
2. [エラーハンドリング原則](#2-エラーハンドリング原則)
3. [モジュール別エラー処理](#3-モジュール別エラー処理)
4. [フォールバック戦略](#4-フォールバック戦略)
5. [ロギング戦略](#5-ロギング戦略)
6. [リカバリー戦略](#6-リカバリー戦略)
7. [ユーザー通知](#7-ユーザー通知)

---

## 1. エラー分類

### 1.1 エラーレベル

```typescript
enum ErrorLevel {
  FATAL = 'FATAL',       // システム全体が停止
  ERROR = 'ERROR',       // 機能が動作不能だが、システムは継続
  WARNING = 'WARNING',   // 機能は動作するが、期待と異なる可能性
  INFO = 'INFO'          // 情報提供のみ
}
```

### 1.2 エラーカテゴリ

| カテゴリ | 説明 | レベル | リカバリー可能性 |
|---------|------|--------|----------------|
| **InitializationError** | 初期化失敗 | FATAL | 部分的 |
| **SignalDetectionError** | シグナル検出失敗 | WARNING | 可能 |
| **StrategyExecutionError** | 戦略実行失敗 | ERROR | 可能 |
| **StateManagementError** | 状態管理失敗 | ERROR | 可能 |
| **StorageError** | LocalStorage失敗 | WARNING | 可能 |
| **ValidationError** | 入力検証失敗 | WARNING | 可能 |
| **TimeoutError** | タイムアウト | WARNING | 可能 |
| **NetworkError** | ネットワーク失敗 | WARNING | 可能（該当なし） |

---

## 2. エラーハンドリング原則

### 2.1 基本原則

#### P1: グレースフル・デグラデーション（優雅な劣化）
```typescript
// ✅ 良い例: AIが失敗してもシステムは動作継続
async processQuestion(word: string, result: string, context: QuestionContext) {
  try {
    const signals = await this.signalDetector.detectSignals(word, result, context);
    return this.selectStrategy(signals);
  } catch (error) {
    logger.warn('AI detection failed, using fallback', error);
    return this.getFallbackStrategy();  // デフォルト戦略で継続
  }
}

// ❌ 悪い例: エラーを上位に伝播
async processQuestion(word: string, result: string, context: QuestionContext) {
  const signals = await this.signalDetector.detectSignals(word, result, context);
  return this.selectStrategy(signals);
}
```

#### P2: フェイル・ファスト（早期失敗）
```typescript
// ✅ 良い例: 入力検証を最初に実行
processQuestion(word: string, result: string, context: QuestionContext) {
  if (!word || typeof word !== 'string') {
    throw new ValidationError('Invalid word parameter');
  }
  if (result !== 'correct' && result !== 'incorrect') {
    throw new ValidationError('Result must be "correct" or "incorrect"');
  }
  // 処理を続行...
}
```

#### P3: エラー情報の保持
```typescript
// ✅ 良い例: 元のエラーを保持
catch (error) {
  throw new SignalDetectionError(
    'Failed to detect signals from Memory Acquisition AI',
    { cause: error, source: SignalSource.MEMORY_ACQUISITION }
  );
}
```

#### P4: ログとユーザー通知の分離
```typescript
// ✅ 良い例: 技術的詳細はログ、ユーザーには簡潔なメッセージ
catch (error) {
  logger.error('AI module crashed', { error, stack: error.stack, context });
  return {
    success: false,
    userMessage: 'AIが一時的に利用できません。通常の学習を続けます。'
  };
}
```

### 2.2 エラーハンドリングパターン

#### パターン1: Try-Catch with Fallback
```typescript
async detectSignals(word: string, result: string, context: QuestionContext): Promise<LearningSignal[]> {
  const signals: LearningSignal[] = [];
  
  // 各AIモジュールを独立して処理（1つ失敗しても他は続行）
  try {
    const memorySignals = await this.detectMemoryAcquisitionSignals(word, result);
    signals.push(...memorySignals);
  } catch (error) {
    logger.warn('Memory Acquisition AI failed', error);
    // 続行（このモジュールのシグナルなしで）
  }
  
  try {
    const cognitiveSignals = await this.detectCognitiveLoadSignals(context);
    signals.push(...cognitiveSignals);
  } catch (error) {
    logger.warn('Cognitive Load AI failed', error);
    // 続行
  }
  
  // ... 他のAIモジュール
  
  if (signals.length === 0) {
    logger.warn('No signals detected from any AI module');
    // 空配列を返す（呼び出し側でデフォルト戦略を使用）
  }
  
  return signals;
}
```

#### パターン2: Promise.allSettled（並列処理）
```typescript
async detectSignalsParallel(word: string, result: string, context: QuestionContext): Promise<LearningSignal[]> {
  const detectionPromises = [
    this.detectMemoryAcquisitionSignals(word, result),
    this.detectCognitiveLoadSignals(context),
    this.detectErrorPredictionSignals(word, result),
    this.detectLearningStyleSignals(context),
    this.detectLinguisticRelationsSignals(word),
    this.detectContextualLearningSignals(word, result)
  ];
  
  const results = await Promise.allSettled(detectionPromises);
  
  const signals: LearningSignal[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      signals.push(...result.value);
    } else {
      logger.warn(`AI module ${index} failed`, result.reason);
    }
  });
  
  return signals;
}
```

#### パターン3: タイムアウト付きPromise
```typescript
async detectSignalsWithTimeout(
  word: string,
  result: string,
  context: QuestionContext
): Promise<LearningSignal[]> {
  const timeoutMs = 150;
  
  const timeoutPromise = new Promise<LearningSignal[]>((_, reject) => {
    setTimeout(() => reject(new TimeoutError('Signal detection timeout')), timeoutMs);
  });
  
  const detectionPromise = this.detectSignals(word, result, context);
  
  try {
    return await Promise.race([detectionPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof TimeoutError) {
      logger.warn('Signal detection timed out, using cached signals');
      return this.getCachedSignals() || [];
    }
    throw error;
  }
}
```

---

## 3. モジュール別エラー処理

### 3.1 AdaptiveEducationalAINetwork

#### エラー: 初期化失敗
```typescript
async initialize(): Promise<void> {
  try {
    await this.signalDetector.initialize();
    await this.strategyExecutor.initialize();
    await this.effectivenessTracker.loadHistory();
  } catch (error) {
    logger.error('Network initialization failed', error);
    
    // 部分的な初期化を試みる
    try {
      this.initializeWithDefaults();
      logger.info('Initialized with default configuration');
    } catch (fallbackError) {
      throw new NetworkInitializationError(
        'Failed to initialize Adaptive Network',
        { cause: error, fallbackCause: fallbackError }
      );
    }
  }
}

private initializeWithDefaults(): void {
  this.state = {
    enabled: false,
    currentStrategy: null,
    activeSignals: [],
    effectiveness: new Map(),
    sessionStats: this.createDefaultSessionStats(),
    lastUpdated: Date.now()
  };
}
```

**リカバリー戦略**:
1. デフォルト設定で初期化を試みる
2. 失敗した場合はエラーをスロー（ユーザーに通知）

---

#### エラー: processQuestion()失敗
```typescript
async processQuestion(
  word: string,
  result: 'correct' | 'incorrect',
  context: QuestionContext
): Promise<StrategyRecommendation> {
  // 入力検証
  try {
    this.validateInput(word, result, context);
  } catch (error) {
    logger.error('Invalid input', { word, result, context, error });
    return this.getDefaultRecommendation();
  }
  
  // ネットワーク無効時
  if (!this.state.enabled) {
    return this.getDefaultRecommendation();
  }
  
  try {
    // シグナル検出
    const signals = await this.signalDetector.detectSignals(word, result, context);
    
    // 戦略選択
    const recommendation = this.strategyExecutor.selectBestStrategy(
      signals,
      this.state.effectiveness
    );
    
    // 効果記録（非同期、エラーは無視）
    this.recordEffectiveness(recommendation, word).catch(error => {
      logger.warn('Failed to record effectiveness', error);
    });
    
    // 状態更新
    this.updateState(recommendation, signals);
    
    return recommendation;
    
  } catch (error) {
    logger.error('Question processing failed', { word, result, context, error });
    
    // フォールバック: デフォルト推奨を返す
    return {
      strategy: StrategyType.CONTINUE_NORMAL,
      confidence: 0,
      reason: 'AI処理が一時的に利用できないため、通常学習を続けます。',
      signals: [],
      metadata: { error: true, fallback: true }
    };
  }
}
```

**リカバリー戦略**:
1. 入力検証エラー → デフォルト推奨
2. シグナル検出失敗 → デフォルト推奨（ログ記録）
3. 戦略選択失敗 → CONTINUE_NORMAL戦略
4. 効果記録失敗 → 無視（警告ログのみ）

---

### 3.2 SignalDetector

#### エラー: AIモジュール失敗
```typescript
async detectSignals(
  word: string,
  result: 'correct' | 'incorrect',
  context: QuestionContext
): Promise<LearningSignal[]> {
  const signals: LearningSignal[] = [];
  const errors: Array<{ module: string; error: Error }> = [];
  
  // Memory Acquisition
  try {
    const memorySignals = await this.detectMemoryAcquisitionSignals(word, result);
    signals.push(...memorySignals);
  } catch (error) {
    errors.push({ module: 'MemoryAcquisition', error });
    logger.warn('Memory Acquisition AI failed', error);
  }
  
  // Cognitive Load
  try {
    const cognitiveSignals = await this.detectCognitiveLoadSignals(context);
    signals.push(...cognitiveSignals);
  } catch (error) {
    errors.push({ module: 'CognitiveLoad', error });
    logger.warn('Cognitive Load AI failed', error);
  }
  
  // ... 他のAIモジュール（同様のパターン）
  
  // すべて失敗した場合
  if (signals.length === 0 && errors.length > 0) {
    logger.error('All AI modules failed', { errors });
    // 空配列を返す（デフォルト戦略にフォールバック）
  }
  
  // 部分的な失敗を記録
  if (errors.length > 0 && signals.length > 0) {
    logger.warn('Some AI modules failed', {
      failed: errors.length,
      succeeded: signals.length
    });
  }
  
  return signals;
}
```

**リカバリー戦略**:
- 各AIモジュールを独立して処理
- 一部失敗しても他のシグナルを返す
- すべて失敗した場合は空配列（呼び出し側でフォールバック）

---

#### エラー: タイムアウト
```typescript
async detectSignalsWithTimeout(
  word: string,
  result: 'correct' | 'incorrect',
  context: QuestionContext
): Promise<LearningSignal[]> {
  const timeout = this.config.signalDetectionTimeout || 150;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError('Signal detection timeout')), timeout);
  });
  
  try {
    return await Promise.race([
      this.detectSignals(word, result, context),
      timeoutPromise
    ]);
  } catch (error) {
    if (error instanceof TimeoutError) {
      logger.warn('Signal detection timed out', { timeout });
      
      // キャッシュされたシグナルを試す
      const cached = this.getCachedSignals(word);
      if (cached && cached.length > 0) {
        logger.info('Using cached signals');
        return cached;
      }
      
      // キャッシュもなければ空配列
      return [];
    }
    throw error;
  }
}
```

**リカバリー戦略**:
1. タイムアウト検出
2. キャッシュされたシグナルを試す
3. キャッシュもなければ空配列（デフォルト戦略）

---

### 3.3 StrategyExecutor

#### エラー: 戦略選択失敗
```typescript
selectBestStrategy(
  signals: LearningSignal[],
  effectiveness: Map<StrategyType, StrategyEffectiveness>
): StrategyRecommendation {
  try {
    // 入力検証
    if (!Array.isArray(signals)) {
      throw new ValidationError('Signals must be an array');
    }
    
    // シグナルなし
    if (signals.length === 0) {
      logger.info('No signals provided, using default strategy');
      return this.getDefaultRecommendation();
    }
    
    // 信頼度フィルタリング
    const validSignals = signals.filter(s => s.confidence >= this.config.minConfidence);
    
    if (validSignals.length === 0) {
      logger.warn('No signals meet confidence threshold', {
        totalSignals: signals.length,
        minConfidence: this.config.minConfidence
      });
      return this.getDefaultRecommendation();
    }
    
    // スコア計算
    const scores = validSignals.map(signal => ({
      signal,
      score: this.calculateScore(signal, effectiveness)
    }));
    
    // 最高スコアを選択
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    
    return {
      strategy: best.signal.type,
      confidence: best.signal.confidence,
      reason: this.generateReason(best.signal),
      signals: validSignals,
      metadata: { score: best.score }
    };
    
  } catch (error) {
    logger.error('Strategy selection failed', { signals, error });
    return this.getFallbackRecommendation(error);
  }
}

private getFallbackRecommendation(error?: Error): StrategyRecommendation {
  return {
    strategy: StrategyType.CONTINUE_NORMAL,
    confidence: 0,
    reason: '戦略選択に失敗したため、通常学習を続けます。',
    signals: [],
    metadata: { error: true, fallback: true, errorMessage: error?.message }
  };
}
```

**リカバリー戦略**:
- シグナルなし/無効 → デフォルト推奨
- 計算エラー → フォールバック推奨

---

#### エラー: 戦略実行失敗
```typescript
async executeStrategy(
  strategy: StrategyType,
  word: string,
  context: QuestionContext
): Promise<StrategyExecutionResult> {
  const startTime = Date.now();
  
  try {
    // 戦略タイプ検証
    if (!Object.values(StrategyType).includes(strategy)) {
      throw new ValidationError(`Invalid strategy type: ${strategy}`);
    }
    
    const actions: ExecutedAction[] = [];
    
    // 戦略別実行
    switch (strategy) {
      case StrategyType.IMMEDIATE_REPETITION:
        actions.push(await this.executeImmediateRepetition(word));
        break;
        
      case StrategyType.TAKE_BREAK:
        actions.push(...await this.executeTakeBreak(context));
        break;
        
      // ... 他の戦略
      
      default:
        logger.warn(`No execution logic for strategy: ${strategy}`);
    }
    
    return {
      success: true,
      strategy,
      actions,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    logger.error('Strategy execution failed', { strategy, word, error });
    
    return {
      success: false,
      strategy,
      actions: [],
      duration: Date.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
```

**リカバリー戦略**:
- 実行失敗を記録（`success: false`）
- エラー詳細を返す
- システムは停止しない

---

### 3.4 EffectivenessTracker

#### エラー: 記録失敗
```typescript
recordOutcome(strategy: StrategyType, outcome: LearningOutcome): void {
  try {
    // 検証
    if (!Object.values(StrategyType).includes(strategy)) {
      throw new ValidationError(`Invalid strategy: ${strategy}`);
    }
    
    if (typeof outcome.success !== 'boolean') {
      throw new ValidationError('Outcome.success must be boolean');
    }
    
    // 効果データ取得または作成
    let effectiveness = this.effectiveness.get(strategy);
    if (!effectiveness) {
      effectiveness = this.createDefaultEffectiveness(strategy);
      this.effectiveness.set(strategy, effectiveness);
    }
    
    // 更新
    effectiveness.totalUses++;
    if (outcome.success) {
      effectiveness.successCount++;
    } else {
      effectiveness.failureCount++;
    }
    effectiveness.successRate = effectiveness.successCount / effectiveness.totalUses;
    effectiveness.lastUsed = outcome.timestamp;
    
    // 平均値更新
    if (outcome.timeToMastery !== undefined) {
      this.updateAverage(effectiveness, 'averageTimeToMastery', outcome.timeToMastery);
    }
    if (outcome.retentionRate !== undefined) {
      this.updateAverage(effectiveness, 'averageRetentionRate', outcome.retentionRate);
    }
    
    // 信頼度更新
    effectiveness.confidence = this.calculateConfidence(effectiveness.totalUses);
    
    // LocalStorageに保存（非同期、エラーは無視）
    this.saveToStorage().catch(error => {
      logger.warn('Failed to save effectiveness to storage', error);
    });
    
  } catch (error) {
    logger.error('Failed to record outcome', { strategy, outcome, error });
    // エラーをスローしない（記録失敗はクリティカルではない）
  }
}
```

**リカバリー戦略**:
- 検証エラー → ログ記録、処理継続
- 保存失敗 → 警告ログのみ、メモリ内データは保持

---

## 4. フォールバック戦略

### 4.1 戦略選択のフォールバック階層

```typescript
class FallbackChain {
  private static readonly FALLBACK_ORDER = [
    StrategyType.SPACED_REPETITION,    // 第1フォールバック（安全な戦略）
    StrategyType.CONTINUE_NORMAL        // 第2フォールバック（デフォルト）
  ];
  
  static getFallbackStrategy(
    failedStrategy: StrategyType,
    reason: string
  ): StrategyRecommendation {
    logger.info('Using fallback strategy', { failedStrategy, reason });
    
    const fallback = this.FALLBACK_ORDER[0];
    
    return {
      strategy: fallback,
      confidence: 0.5,
      reason: `${reason} ${fallback}戦略を使用します。`,
      signals: [],
      metadata: {
        fallback: true,
        originalStrategy: failedStrategy
      }
    };
  }
}
```

### 4.2 データソースのフォールバック

```typescript
class DataFallback {
  // LocalStorage → メモリ → デフォルト値
  static async loadState(): Promise<AdaptiveNetworkState> {
    try {
      // 優先: LocalStorage
      const stored = localStorage.getItem(STORAGE_KEYS.NETWORK_STATE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.warn('Failed to load from LocalStorage', error);
    }
    
    try {
      // フォールバック: インメモリキャッシュ
      const cached = this.getFromMemoryCache();
      if (cached) {
        logger.info('Using cached state');
        return cached;
      }
    } catch (error) {
      logger.warn('Failed to load from cache', error);
    }
    
    // 最終フォールバック: デフォルト値
    logger.info('Using default state');
    return this.createDefaultState();
  }
}
```

---

## 5. ロギング戦略

### 5.1 ログレベル

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  debug(message: string, context?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }
  
  info(message: string, context?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, context);
    }
  }
  
  warn(message: string, context?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context);
    }
  }
  
  error(message: string, context?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context);
    }
  }
}

export const logger = new Logger();
```

### 5.2 構造化ログ

```typescript
interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: any;
  stackTrace?: string;
}

class StructuredLogger extends Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  private log(level: LogLevel, message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      stackTrace: level === LogLevel.ERROR ? new Error().stack : undefined
    };
    
    this.logs.push(entry);
    
    // 古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // コンソール出力
    super[LogLevel[level].toLowerCase()](message, context);
  }
  
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }
  
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

### 5.3 ログ内容の指針

| レベル | 記録内容 | 例 |
|--------|---------|---|
| **DEBUG** | 詳細な実行トレース | シグナル強度、スコア計算過程 |
| **INFO** | 重要な状態変化 | 戦略選択、初期化完了 |
| **WARN** | 回復可能なエラー | AIモジュール失敗、タイムアウト |
| **ERROR** | 重大なエラー | 初期化失敗、データ破損 |

---

## 6. リカバリー戦略

### 6.1 自動リカバリー

#### 状態破損の検出と修復
```typescript
class StateRecovery {
  static async recoverState(): Promise<AdaptiveNetworkState> {
    try {
      const state = await this.loadState();
      
      // 整合性チェック
      if (!this.isValidState(state)) {
        logger.warn('Invalid state detected, attempting repair');
        return this.repairState(state);
      }
      
      return state;
      
    } catch (error) {
      logger.error('State recovery failed', error);
      return this.createFreshState();
    }
  }
  
  private static isValidState(state: any): boolean {
    return (
      state &&
      typeof state.enabled === 'boolean' &&
      Array.isArray(state.activeSignals) &&
      state.effectiveness instanceof Map
    );
  }
  
  private static repairState(state: any): AdaptiveNetworkState {
    const repaired: AdaptiveNetworkState = this.createFreshState();
    
    // 可能な限りデータを復元
    if (typeof state.enabled === 'boolean') {
      repaired.enabled = state.enabled;
    }
    
    if (Array.isArray(state.activeSignals)) {
      repaired.activeSignals = state.activeSignals.filter(s => 
        s && typeof s.source === 'string' && typeof s.strength === 'number'
      );
    }
    
    logger.info('State repaired', {
      original: state,
      repaired
    });
    
    return repaired;
  }
}
```

#### LocalStorage容量不足時の対応
```typescript
class StorageManager {
  static async saveWithFallback(key: string, data: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        logger.warn('LocalStorage full, attempting cleanup');
        
        // 古いデータを削除
        await this.cleanupOldData();
        
        // 再試行
        try {
          localStorage.setItem(key, JSON.stringify(data));
          logger.info('Save successful after cleanup');
        } catch (retryError) {
          logger.error('Save failed even after cleanup', retryError);
          // メモリキャッシュに保存
          this.saveToMemoryCache(key, data);
        }
      } else {
        throw error;
      }
    }
  }
  
  private static async cleanupOldData(): Promise<void> {
    const keys = Object.keys(localStorage);
    const timestampedKeys = keys
      .filter(key => key.startsWith('adaptive_'))
      .map(key => ({
        key,
        data: JSON.parse(localStorage.getItem(key) || '{}'),
      }))
      .filter(item => item.data.lastUpdated)
      .sort((a, b) => a.data.lastUpdated - b.data.lastUpdated);
    
    // 古い方から25%削除
    const toRemove = Math.ceil(timestampedKeys.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(timestampedKeys[i].key);
    }
    
    logger.info(`Cleaned up ${toRemove} old entries`);
  }
}
```

### 6.2 手動リカバリー

#### ユーザーによるリセット
```typescript
class ManualRecovery {
  static resetToDefaults(): void {
    try {
      // LocalStorageをクリア
      Object.keys(localStorage)
        .filter(key => key.startsWith('adaptive_'))
        .forEach(key => localStorage.removeItem(key));
      
      // メモリキャッシュをクリア
      this.clearMemoryCache();
      
      logger.info('Manual reset completed');
      
      // ユーザーに通知
      this.notifyUser('設定をリセットしました。ページを再読み込みしてください。');
      
    } catch (error) {
      logger.error('Manual reset failed', error);
      this.notifyUser('リセットに失敗しました。ブラウザのデータをクリアしてください。');
    }
  }
}
```

---

## 7. ユーザー通知

### 7.1 通知レベル

```typescript
enum NotificationLevel {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

interface UserNotification {
  level: NotificationLevel;
  message: string;
  technical?: string;  // 開発者向け詳細（デバッグモード時のみ表示）
  action?: {
    label: string;
    handler: () => void;
  };
}
```

### 7.2 エラーメッセージのユーザー向け変換

```typescript
class ErrorMessageTranslator {
  static toUserFriendly(error: Error): string {
    if (error instanceof NetworkInitializationError) {
      return 'AI学習システムの初期化に失敗しました。ページを再読み込みしてください。';
    }
    
    if (error instanceof SignalDetectionError) {
      return 'AI分析が一時的に利用できません。通常の学習を続けます。';
    }
    
    if (error instanceof StrategyExecutionError) {
      return '学習戦略の適用に失敗しました。通常の学習を続けます。';
    }
    
    if (error instanceof TimeoutError) {
      return 'AI処理がタイムアウトしました。通常の学習を続けます。';
    }
    
    if (error instanceof ValidationError) {
      return 'データが正しくありません。ページを再読み込みしてください。';
    }
    
    // デフォルト
    return '予期しないエラーが発生しました。問題が続く場合はサポートにお問い合わせください。';
  }
}
```

### 7.3 通知UI統合

```typescript
interface NotificationService {
  show(notification: UserNotification): void;
  showError(error: Error, context?: string): void;
  showSuccess(message: string): void;
}

class ToastNotificationService implements NotificationService {
  show(notification: UserNotification): void {
    // Toastライブラリと統合
    toast[notification.level](notification.message, {
      action: notification.action
    });
    
    // デバッグモードの場合は技術的詳細も表示
    if (DEBUG_MODE && notification.technical) {
      console.info('[Technical Details]', notification.technical);
    }
  }
  
  showError(error: Error, context?: string): void {
    const message = ErrorMessageTranslator.toUserFriendly(error);
    
    this.show({
      level: NotificationLevel.ERROR,
      message: context ? `${context}: ${message}` : message,
      technical: error.message,
      action: {
        label: 'リセット',
        handler: () => ManualRecovery.resetToDefaults()
      }
    });
  }
  
  showSuccess(message: string): void {
    this.show({
      level: NotificationLevel.SUCCESS,
      message
    });
  }
}
```

---

## 8. デバッグモード

### 8.1 デバッグモードの有効化

```typescript
class DebugMode {
  private static enabled = false;
  
  static enable(): void {
    this.enabled = true;
    logger.setLevel(LogLevel.DEBUG);
    console.log('%c🐛 Debug Mode Enabled', 'color: yellow; font-size: 16px; font-weight: bold');
  }
  
  static disable(): void {
    this.enabled = false;
    logger.setLevel(LogLevel.INFO);
  }
  
  static isEnabled(): boolean {
    return this.enabled;
  }
}

// ブラウザコンソールから有効化
// window.enableDebugMode = () => DebugMode.enable();
```

### 8.2 デバッグ情報の表示

```typescript
class DebugInfo {
  static logNetworkState(network: AdaptiveEducationalAINetwork): void {
    if (!DebugMode.isEnabled()) return;
    
    const state = network.getState();
    
    console.group('🔍 Network State');
    console.log('Enabled:', state.enabled);
    console.log('Current Strategy:', state.currentStrategy);
    console.log('Active Signals:', state.activeSignals.length);
    console.table(state.activeSignals.map(s => ({
      source: s.source,
      type: s.type,
      strength: s.strength.toFixed(2),
      confidence: s.confidence.toFixed(2),
      priority: s.priority
    })));
    console.log('Session Stats:', state.sessionStats);
    console.groupEnd();
  }
  
  static logStrategySelection(
    signals: LearningSignal[],
    recommendation: StrategyRecommendation
  ): void {
    if (!DebugMode.isEnabled()) return;
    
    console.group('🎯 Strategy Selection');
    console.log('Input Signals:', signals.length);
    console.log('Selected Strategy:', recommendation.strategy);
    console.log('Confidence:', recommendation.confidence);
    console.log('Reason:', recommendation.reason);
    console.table(signals.map(s => ({
      source: s.source,
      type: s.type,
      strength: s.strength,
      priority: s.priority
    })));
    console.groupEnd();
  }
}
```

---

## 9. エラー監視・アラート

### 9.1 エラー率の監視

```typescript
class ErrorMonitor {
  private errorCounts: Map<string, number> = new Map();
  private readonly ALERT_THRESHOLD = 10;  // 10回で警告
  private readonly RESET_INTERVAL = 3600000;  // 1時間でリセット
  
  constructor() {
    setInterval(() => this.reset(), this.RESET_INTERVAL);
  }
  
  recordError(errorType: string): void {
    const count = (this.errorCounts.get(errorType) || 0) + 1;
    this.errorCounts.set(errorType, count);
    
    if (count >= this.ALERT_THRESHOLD) {
      this.alert(errorType, count);
    }
  }
  
  private alert(errorType: string, count: number): void {
    logger.error(`High error rate detected`, {
      errorType,
      count,
      threshold: this.ALERT_THRESHOLD
    });
    
    // ユーザーに通知
    notificationService.show({
      level: NotificationLevel.WARNING,
      message: 'AI学習システムで問題が発生しています。一時的に無効化されます。',
      action: {
        label: 'リセット',
        handler: () => ManualRecovery.resetToDefaults()
      }
    });
    
    // 自動無効化
    this.disableNetwork();
  }
  
  private disableNetwork(): void {
    // ネットワークを自動的に無効化
    const network = AdaptiveEducationalAINetwork.getInstance();
    network.updateConfig({ enabled: false });
    logger.info('Network automatically disabled due to high error rate');
  }
  
  private reset(): void {
    this.errorCounts.clear();
    logger.debug('Error counts reset');
  }
}

export const errorMonitor = new ErrorMonitor();
```

---

## 10. テスト時のエラーハンドリング

### 10.1 モックエラー

```typescript
class MockError {
  static injectError(
    target: any,
    method: string,
    errorType: Error,
    probability: number = 1.0
  ): void {
    const original = target[method];
    
    target[method] = function(...args: any[]) {
      if (Math.random() < probability) {
        throw errorType;
      }
      return original.apply(this, args);
    };
  }
  
  static injectAsyncError(
    target: any,
    method: string,
    errorType: Error,
    probability: number = 1.0
  ): void {
    const original = target[method];
    
    target[method] = async function(...args: any[]) {
      if (Math.random() < probability) {
        throw errorType;
      }
      return await original.apply(this, args);
    };
  }
}

// テストでの使用例
describe('Error Handling', () => {
  test('should handle AI module failure', async () => {
    MockError.injectAsyncError(
      SignalDetector.prototype,
      'detectMemoryAcquisitionSignals',
      new SignalDetectionError('Mock error'),
      1.0
    );
    
    const network = new AdaptiveEducationalAINetwork({ enabled: true });
    const recommendation = await network.processQuestion('apple', 'incorrect', mockContext);
    
    // エラーがあってもデフォルト戦略を返すことを確認
    expect(recommendation.strategy).toBe(StrategyType.CONTINUE_NORMAL);
  });
});
```

---

## 付録A: エラー一覧表

| エラークラス | コード | レベル | リカバリー | ユーザーメッセージ |
|------------|-------|--------|-----------|------------------|
| `NetworkInitializationError` | INIT-001 | FATAL | 部分的 | 初期化に失敗しました |
| `SignalDetectionError` | SIG-001 | WARNING | 可能 | AI分析が一時的に利用できません |
| `StrategyExecutionError` | EXEC-001 | ERROR | 可能 | 学習戦略の適用に失敗しました |
| `InvalidStateError` | STATE-001 | ERROR | 可能 | データが破損しています |
| `ValidationError` | VAL-001 | WARNING | 可能 | データが正しくありません |
| `TimeoutError` | TIME-001 | WARNING | 可能 | 処理がタイムアウトしました |
| `StorageError` | STORE-001 | WARNING | 可能 | データの保存に失敗しました |

---

## 付録B: チェックリスト

実装時に確認すべき項目：

- [ ] すべてのエラーにtry-catchを適用
- [ ] ユーザー向けメッセージと技術的メッセージを分離
- [ ] フォールバック戦略を実装
- [ ] ログレベルを適切に設定
- [ ] エラー発生時もシステムが継続動作
- [ ] LocalStorageエラーを処理
- [ ] タイムアウトを実装
- [ ] 入力検証を実装
- [ ] エラー監視を実装
- [ ] デバッグモードを実装

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | 2025-12-16 | 初版作成 |

---

**文書終了**
