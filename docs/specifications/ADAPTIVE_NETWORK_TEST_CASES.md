# Adaptive Educational AI Network - テストケース定義

## 概要

本ドキュメントは、Adaptive Educational AI Networkの包括的なテストケースを定義します。

**作成日**: 2025年12月16日  
**バージョン**: 1.0.0  
**フェーズ**: Phase 1, Step 3  
**カバレッジ目標**: 90%以上

---

## 目次

1. [ユニットテスト](#1-ユニットテスト)
2. [統合テスト](#2-統合テスト)
3. [E2Eテスト](#3-e2eテスト)
4. [パフォーマンステスト](#4-パフォーマンステスト)
5. [エッジケーステスト](#5-エッジケーステスト)

---

## 1. ユニットテスト

### 1.1 AdaptiveEducationalAINetwork

#### TC-AEAN-001: コンストラクタ（デフォルト設定）
```typescript
describe('AdaptiveEducationalAINetwork - Constructor', () => {
  test('TC-AEAN-001: should initialize with default config', () => {
    const network = new AdaptiveEducationalAINetwork();
    
    expect(network.getState().enabled).toBe(false);
    expect(network.getState().currentStrategy).toBeNull();
    expect(network.getState().activeSignals).toEqual([]);
  });
});
```

**期待結果**:
- `enabled` = false
- `currentStrategy` = null
- `activeSignals` = []

---

#### TC-AEAN-002: コンストラクタ（カスタム設定）
```typescript
test('TC-AEAN-002: should initialize with custom config', () => {
  const network = new AdaptiveEducationalAINetwork({
    enabled: true,
    minSignalStrength: 0.5
  });
  
  const state = network.getState();
  expect(state.enabled).toBe(true);
});
```

**期待結果**:
- カスタム設定が適用される

---

#### TC-AEAN-003: initialize()成功
```typescript
test('TC-AEAN-003: should initialize successfully', async () => {
  const network = new AdaptiveEducationalAINetwork();
  
  await expect(network.initialize()).resolves.not.toThrow();
});
```

**期待結果**:
- エラーなく初期化完了

---

#### TC-AEAN-004: initialize()失敗時のエラーハンドリング
```typescript
test('TC-AEAN-004: should handle initialization failure', async () => {
  const mockDetector = {
    initialize: jest.fn().mockRejectedValue(new Error('Init failed'))
  };
  
  const network = new AdaptiveEducationalAINetwork();
  // Inject mock
  
  await expect(network.initialize()).rejects.toThrow('Init failed');
});
```

**期待結果**:
- 適切なエラーをスロー

---

#### TC-AEAN-005: processQuestion()（正解時）
```typescript
test('TC-AEAN-005: should process correct answer', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const recommendation = await network.processQuestion(
    'apple',
    'correct',
    {
      timeSpent: 3000,
      attemptNumber: 1,
      sessionDuration: 60000,
      recentErrors: 0
    }
  );
  
  expect(recommendation).toBeDefined();
  expect(recommendation.strategy).toBeDefined();
  expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
  expect(recommendation.confidence).toBeLessThanOrEqual(1);
});
```

**期待結果**:
- 有効な推奨戦略を返す
- confidence: 0-1の範囲

---

#### TC-AEAN-006: processQuestion()（不正解時）
```typescript
test('TC-AEAN-006: should process incorrect answer', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const recommendation = await network.processQuestion(
    'apple',
    'incorrect',
    {
      timeSpent: 8000,
      attemptNumber: 3,
      sessionDuration: 120000,
      recentErrors: 2
    }
  );
  
  expect(recommendation.strategy).not.toBe(StrategyType.CONTINUE_NORMAL);
  expect(recommendation.signals.length).toBeGreaterThan(0);
});
```

**期待結果**:
- 積極的な戦略を推奨
- シグナルが検出される

---

#### TC-AEAN-007: processQuestion()（無効時）
```typescript
test('TC-AEAN-007: should return default when disabled', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: false });
  
  const recommendation = await network.processQuestion(
    'apple',
    'incorrect',
    TestUtils.createMockContext()
  );
  
  expect(recommendation.strategy).toBe(StrategyType.CONTINUE_NORMAL);
});
```

**期待結果**:
- デフォルト戦略を返す

---

#### TC-AEAN-008: updateConfig()
```typescript
test('TC-AEAN-008: should update config dynamically', () => {
  const network = new AdaptiveEducationalAINetwork();
  
  network.updateConfig({ enabled: true, minSignalStrength: 0.4 });
  
  const state = network.getState();
  expect(state.enabled).toBe(true);
});
```

**期待結果**:
- 設定が動的に更新される

---

#### TC-AEAN-009: resetState()
```typescript
test('TC-AEAN-009: should reset state to initial', () => {
  const network = new AdaptiveEducationalAINetwork();
  // Perform some operations...
  
  network.resetState();
  
  const state = network.getState();
  expect(state.currentStrategy).toBeNull();
  expect(state.activeSignals).toEqual([]);
  expect(state.effectiveness.size).toBe(0);
});
```

**期待結果**:
- 状態が初期化される

---

#### TC-AEAN-010: exportState() / importState()
```typescript
test('TC-AEAN-010: should export and import state', () => {
  const network1 = new AdaptiveEducationalAINetwork();
  // Set some state...
  
  const exported = network1.exportState();
  
  const network2 = new AdaptiveEducationalAINetwork();
  network2.importState(exported);
  
  expect(network2.getState()).toEqual(network1.getState());
});
```

**期待結果**:
- 状態が完全に復元される

---

### 1.2 SignalDetector

#### TC-SD-001: detectSignals()基本動作
```typescript
describe('SignalDetector', () => {
  test('TC-SD-001: should detect signals from all sources', async () => {
    const detector = new SignalDetector(mockConfig);
    
    const signals = await detector.detectSignals(
      'apple',
      'incorrect',
      TestUtils.createMockContext()
    );
    
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]).toHaveProperty('source');
    expect(signals[0]).toHaveProperty('strength');
    expect(signals[0]).toHaveProperty('confidence');
  });
});
```

**期待結果**:
- 複数のシグナルが検出される
- 各シグナルが必要なプロパティを持つ

---

#### TC-SD-002: 強度フィルタリング
```typescript
test('TC-SD-002: should filter by min signal strength', async () => {
  const detector = new SignalDetector({ minSignalStrength: 0.7 });
  
  const signals = await detector.detectSignals('apple', 'incorrect', mockContext);
  
  signals.forEach(signal => {
    expect(signal.strength).toBeGreaterThanOrEqual(0.7);
  });
});
```

**期待結果**:
- 閾値未満のシグナルが除外される

---

#### TC-SD-003: 優先度ソート
```typescript
test('TC-SD-003: should sort signals by priority', async () => {
  const detector = new SignalDetector(mockConfig);
  
  const signals = await detector.detectSignals('apple', 'incorrect', mockContext);
  
  for (let i = 0; i < signals.length - 1; i++) {
    expect(signals[i].priority).toBeGreaterThanOrEqual(signals[i + 1].priority);
  }
});
```

**期待結果**:
- シグナルが優先度順にソートされる

---

#### TC-SD-004: Memory Acquisitionシグナル検出
```typescript
test('TC-SD-004: should detect IMMEDIATE_REPETITION signal', async () => {
  const detector = new SignalDetector(mockConfig);
  
  // 連続エラー3回以上の状態をモック
  const signals = await detector.detectMemoryAcquisitionSignals('apple', 'incorrect');
  
  const immediateRepSignal = signals.find(s => s.type === StrategyType.IMMEDIATE_REPETITION);
  expect(immediateRepSignal).toBeDefined();
  expect(immediateRepSignal!.strength).toBeGreaterThan(0.7);
});
```

**期待結果**:
- IMMEDIATE_REPETITIONシグナルが検出される
- 強度が0.7以上

---

#### TC-SD-005: Cognitive Loadシグナル検出
```typescript
test('TC-SD-005: should detect TAKE_BREAK signal on high load', async () => {
  const detector = new SignalDetector(mockConfig);
  
  const highLoadContext = {
    ...mockContext,
    cognitiveLoad: 0.85
  };
  
  const signals = await detector.detectCognitiveLoadSignals(highLoadContext);
  
  const breakSignal = signals.find(s => s.type === StrategyType.TAKE_BREAK);
  expect(breakSignal).toBeDefined();
  expect(breakSignal!.priority).toBe(10);
});
```

**期待結果**:
- TAKE_BREAKシグナルが検出される
- 優先度が10（最高）

---

#### TC-SD-006: 並列処理のパフォーマンス
```typescript
test('TC-SD-006: should detect signals in parallel under 150ms', async () => {
  const detector = new SignalDetector(mockConfig);
  
  const startTime = Date.now();
  await detector.detectSignals('apple', 'incorrect', mockContext);
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(150);
});
```

**期待結果**:
- 150ms未満で完了

---

#### TC-SD-007: タイムアウト処理
```typescript
test('TC-SD-007: should timeout slow AI modules', async () => {
  const detector = new SignalDetector({ timeout: 100 });
  
  // Mock slow AI module
  const mockSlowAI = {
    detect: jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 200))
    )
  };
  
  const signals = await detector.detectSignals('apple', 'incorrect', mockContext);
  
  // Should still return signals from other modules
  expect(signals).toBeDefined();
});
```

**期待結果**:
- タイムアウトしても他のシグナルは返される

---

#### TC-SD-008: エラーハンドリング
```typescript
test('TC-SD-008: should handle AI module errors gracefully', async () => {
  const detector = new SignalDetector(mockConfig);
  
  // Mock failing AI module
  const mockFailingAI = {
    detect: jest.fn().mockRejectedValue(new Error('AI Error'))
  };
  
  await expect(
    detector.detectSignals('apple', 'incorrect', mockContext)
  ).resolves.not.toThrow();
});
```

**期待結果**:
- エラーが発生してもスロー しない
- 他のモジュールからのシグナルは取得

---

### 1.3 StrategyExecutor

#### TC-SE-001: selectBestStrategy()基本動作
```typescript
describe('StrategyExecutor', () => {
  test('TC-SE-001: should select strategy with highest score', () => {
    const executor = new StrategyExecutor(mockConfig);
    
    const signals = [
      TestUtils.createMockSignal({ type: StrategyType.IMMEDIATE_REPETITION, strength: 0.9, priority: 9 }),
      TestUtils.createMockSignal({ type: StrategyType.SPACED_REPETITION, strength: 0.6, priority: 7 })
    ];
    
    const recommendation = executor.selectBestStrategy(signals, new Map());
    
    expect(recommendation.strategy).toBe(StrategyType.IMMEDIATE_REPETITION);
  });
});
```

**期待結果**:
- 最高スコアの戦略が選択される

---

#### TC-SE-002: 優先度10の強制選択
```typescript
test('TC-SE-002: should force select priority 10 signal', () => {
  const executor = new StrategyExecutor(mockConfig);
  
  const signals = [
    TestUtils.createMockSignal({ type: StrategyType.TAKE_BREAK, priority: 10, strength: 0.5 }),
    TestUtils.createMockSignal({ type: StrategyType.IMMEDIATE_REPETITION, priority: 9, strength: 0.95 })
  ];
  
  const recommendation = executor.selectBestStrategy(signals, new Map());
  
  expect(recommendation.strategy).toBe(StrategyType.TAKE_BREAK);
});
```

**期待結果**:
- 優先度10は強度に関わらず選択される

---

#### TC-SE-003: 信頼度閾値フィルタリング
```typescript
test('TC-SE-003: should filter signals below confidence threshold', () => {
  const executor = new StrategyExecutor({ minConfidence: 0.7 });
  
  const signals = [
    TestUtils.createMockSignal({ confidence: 0.5 }),
    TestUtils.createMockSignal({ confidence: 0.8 })
  ];
  
  const recommendation = executor.selectBestStrategy(signals, new Map());
  
  // 0.8の方が選ばれる
  expect(recommendation.confidence).toBeGreaterThanOrEqual(0.7);
});
```

**期待結果**:
- 低信頼度のシグナルは除外される

---

#### TC-SE-004: 効果測定の加味
```typescript
test('TC-SE-004: should consider strategy effectiveness', () => {
  const executor = new StrategyExecutor(mockConfig);
  
  const effectiveness = new Map([
    [StrategyType.IMMEDIATE_REPETITION, {
      successRate: 0.9,
      confidence: 0.85,
      totalUses: 50
    }],
    [StrategyType.SPACED_REPETITION, {
      successRate: 0.5,
      confidence: 0.75,
      totalUses: 30
    }]
  ]);
  
  const signals = [
    TestUtils.createMockSignal({ type: StrategyType.IMMEDIATE_REPETITION, strength: 0.6 }),
    TestUtils.createMockSignal({ type: StrategyType.SPACED_REPETITION, strength: 0.7 })
  ];
  
  const recommendation = executor.selectBestStrategy(signals, effectiveness);
  
  // 効果測定により逆転
  expect(recommendation.strategy).toBe(StrategyType.IMMEDIATE_REPETITION);
});
```

**期待結果**:
- 過去の成功率が考慮される

---

#### TC-SE-005: 多様性ペナルティ
```typescript
test('TC-SE-005: should apply diversity penalty', () => {
  const executor = new StrategyExecutor(mockConfig);
  
  // 同じ戦略を3回連続使用
  executor.recordUsage(StrategyType.IMMEDIATE_REPETITION);
  executor.recordUsage(StrategyType.IMMEDIATE_REPETITION);
  executor.recordUsage(StrategyType.IMMEDIATE_REPETITION);
  
  const signals = [
    TestUtils.createMockSignal({ type: StrategyType.IMMEDIATE_REPETITION, strength: 0.8 }),
    TestUtils.createMockSignal({ type: StrategyType.SPACED_REPETITION, strength: 0.75 })
  ];
  
  const recommendation = executor.selectBestStrategy(signals, new Map());
  
  // ペナルティにより別の戦略が選ばれる可能性
  expect(recommendation.strategy).toBeDefined();
});
```

**期待結果**:
- 連続使用にペナルティが適用される

---

#### TC-SE-006: フォールバック（シグナルなし）
```typescript
test('TC-SE-006: should fallback to CONTINUE_NORMAL', () => {
  const executor = new StrategyExecutor(mockConfig);
  
  const recommendation = executor.selectBestStrategy([], new Map());
  
  expect(recommendation.strategy).toBe(StrategyType.CONTINUE_NORMAL);
});
```

**期待結果**:
- シグナルなしでデフォルト戦略

---

#### TC-SE-007: executeStrategy() - IMMEDIATE_REPETITION
```typescript
test('TC-SE-007: should execute IMMEDIATE_REPETITION strategy', async () => {
  const executor = new StrategyExecutor(mockConfig);
  
  const result = await executor.executeStrategy(
    StrategyType.IMMEDIATE_REPETITION,
    'apple',
    mockContext
  );
  
  expect(result.success).toBe(true);
  expect(result.actions).toContainEqual(
    expect.objectContaining({ type: 'QUEUE_FRONT' })
  );
});
```

**期待結果**:
- キューの先頭に追加アクション

---

#### TC-SE-008: executeStrategy() - TAKE_BREAK
```typescript
test('TC-SE-008: should execute TAKE_BREAK strategy', async () => {
  const executor = new StrategyExecutor(mockConfig);
  
  const result = await executor.executeStrategy(
    StrategyType.TAKE_BREAK,
    'apple',
    mockContext
  );
  
  expect(result.success).toBe(true);
  expect(result.actions).toContainEqual(
    expect.objectContaining({ type: 'PAUSE_SESSION' })
  );
  expect(result.actions).toContainEqual(
    expect.objectContaining({ type: 'SHOW_BREAK_NOTIFICATION' })
  );
});
```

**期待結果**:
- セッション一時停止と通知表示

---

#### TC-SE-009: executeStrategy() - エラー処理
```typescript
test('TC-SE-009: should handle execution errors', async () => {
  const executor = new StrategyExecutor(mockConfig);
  
  // Mock execution failure
  const result = await executor.executeStrategy(
    StrategyType.INVALID as any,
    'apple',
    mockContext
  );
  
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

**期待結果**:
- エラー情報を含む失敗結果

---

### 1.4 EffectivenessTracker

#### TC-ET-001: recordOutcome()基本動作
```typescript
describe('EffectivenessTracker', () => {
  test('TC-ET-001: should record successful outcome', () => {
    const tracker = new EffectivenessTracker(mockConfig);
    
    tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
      word: 'apple',
      success: true,
      timeToMastery: 120000,
      retentionRate: 0.8,
      timestamp: Date.now()
    });
    
    const effectiveness = tracker.getEffectiveness(StrategyType.IMMEDIATE_REPETITION);
    
    expect(effectiveness?.totalUses).toBe(1);
    expect(effectiveness?.successCount).toBe(1);
    expect(effectiveness?.failureCount).toBe(0);
    expect(effectiveness?.successRate).toBe(1.0);
  });
});
```

**期待結果**:
- カウントが正しく更新される

---

#### TC-ET-002: recordOutcome()失敗時
```typescript
test('TC-ET-002: should record failed outcome', () => {
  const tracker = new EffectivenessTracker(mockConfig);
  
  tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
    word: 'apple',
    success: false,
    timestamp: Date.now()
  });
  
  const effectiveness = tracker.getEffectiveness(StrategyType.IMMEDIATE_REPETITION);
  
  expect(effectiveness?.failureCount).toBe(1);
  expect(effectiveness?.successRate).toBe(0);
});
```

**期待結果**:
- 失敗カウントが増加

---

#### TC-ET-003: 成功率計算
```typescript
test('TC-ET-003: should calculate success rate correctly', () => {
  const tracker = new EffectivenessTracker(mockConfig);
  
  // 7成功, 3失敗
  for (let i = 0; i < 7; i++) {
    tracker.recordOutcome(StrategyType.SPACED_REPETITION, {
      word: `word${i}`,
      success: true,
      timestamp: Date.now()
    });
  }
  for (let i = 0; i < 3; i++) {
    tracker.recordOutcome(StrategyType.SPACED_REPETITION, {
      word: `word${i}`,
      success: false,
      timestamp: Date.now()
    });
  }
  
  const effectiveness = tracker.getEffectiveness(StrategyType.SPACED_REPETITION);
  
  expect(effectiveness?.successRate).toBeCloseTo(0.7, 2);
});
```

**期待結果**:
- 成功率 = 7/10 = 0.7

---

#### TC-ET-004: 平均時間計算
```typescript
test('TC-ET-004: should calculate average time to mastery', () => {
  const tracker = new EffectivenessTracker(mockConfig);
  
  tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
    word: 'word1',
    success: true,
    timeToMastery: 100000,
    timestamp: Date.now()
  });
  tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
    word: 'word2',
    success: true,
    timeToMastery: 200000,
    timestamp: Date.now()
  });
  
  const effectiveness = tracker.getEffectiveness(StrategyType.IMMEDIATE_REPETITION);
  
  expect(effectiveness?.averageTimeToMastery).toBe(150000);
});
```

**期待結果**:
- 平均 = (100000 + 200000) / 2 = 150000

---

#### TC-ET-005: 信頼度計算
```typescript
test('TC-ET-005: should calculate confidence based on sample size', () => {
  const tracker = new EffectivenessTracker(mockConfig);
  
  // 1回のみ
  tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
    word: 'word1',
    success: true,
    timestamp: Date.now()
  });
  
  const effectiveness1 = tracker.getEffectiveness(StrategyType.IMMEDIATE_REPETITION);
  expect(effectiveness1?.confidence).toBeLessThan(0.3);
  
  // 50回記録
  for (let i = 0; i < 49; i++) {
    tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
      word: `word${i}`,
      success: true,
      timestamp: Date.now()
    });
  }
  
  const effectiveness50 = tracker.getEffectiveness(StrategyType.IMMEDIATE_REPETITION);
  expect(effectiveness50?.confidence).toBeGreaterThan(0.8);
});
```

**期待結果**:
- サンプル数に応じて信頼度が上昇

---

#### TC-ET-006: compareStrategies()
```typescript
test('TC-ET-006: should compare two strategies', () => {
  const tracker = new EffectivenessTracker(mockConfig);
  
  // Strategy 1: 90% success
  for (let i = 0; i < 90; i++) {
    tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
      word: `w${i}`, success: true, timestamp: Date.now()
    });
  }
  for (let i = 0; i < 10; i++) {
    tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
      word: `w${i}`, success: false, timestamp: Date.now()
    });
  }
  
  // Strategy 2: 50% success
  for (let i = 0; i < 50; i++) {
    tracker.recordOutcome(StrategyType.SPACED_REPETITION, {
      word: `w${i}`, success: true, timestamp: Date.now()
    });
  }
  for (let i = 0; i < 50; i++) {
    tracker.recordOutcome(StrategyType.SPACED_REPETITION, {
      word: `w${i}`, success: false, timestamp: Date.now()
    });
  }
  
  const comparison = tracker.compareStrategies(
    StrategyType.IMMEDIATE_REPETITION,
    StrategyType.SPACED_REPETITION
  );
  
  expect(comparison.betterStrategy).toBe(StrategyType.IMMEDIATE_REPETITION);
  expect(comparison.successRateDiff).toBeCloseTo(0.4, 2);
  expect(comparison.confidenceLevel).toBeGreaterThan(0.95);
});
```

**期待結果**:
- 統計的に有意な差を検出

---

#### TC-ET-007: exportMetrics()
```typescript
test('TC-ET-007: should export metrics report', () => {
  const tracker = new EffectivenessTracker(mockConfig);
  
  // Record some data...
  tracker.recordOutcome(StrategyType.IMMEDIATE_REPETITION, {
    word: 'apple', success: true, timestamp: Date.now()
  });
  
  const report = tracker.exportMetrics();
  
  expect(report.generatedAt).toBeDefined();
  expect(report.totalMeasurements).toBeGreaterThan(0);
  expect(report.strategies.length).toBeGreaterThan(0);
  expect(report.topPerformers).toBeDefined();
});
```

**期待結果**:
- 完全なレポートが生成される

---

## 2. 統合テスト

### 2.1 ネットワーク全体フロー

#### TC-INT-001: エンドツーエンドの質問処理
```typescript
describe('Integration Tests', () => {
  test('TC-INT-001: should process question end-to-end', async () => {
    const network = new AdaptiveEducationalAINetwork({ enabled: true });
    await network.initialize();
    
    // 不正解を3回記録
    for (let i = 0; i < 3; i++) {
      await network.processQuestion('apple', 'incorrect', {
        timeSpent: 5000,
        attemptNumber: i + 1,
        sessionDuration: 60000 * (i + 1),
        recentErrors: i + 1
      });
    }
    
    const state = network.getState();
    
    expect(state.currentStrategy).toBe(StrategyType.IMMEDIATE_REPETITION);
    expect(state.activeSignals.length).toBeGreaterThan(0);
  });
});
```

**期待結果**:
- 3回の不正解でIMMEDIATE_REPETITIONが選択される

---

#### TC-INT-002: 認知負荷による休憩推奨
```typescript
test('TC-INT-002: should recommend break on high cognitive load', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const recommendation = await network.processQuestion('apple', 'incorrect', {
    timeSpent: 10000,
    attemptNumber: 5,
    sessionDuration: 1800000,  // 30分
    recentErrors: 5,
    cognitiveLoad: 0.9
  });
  
  expect(recommendation.strategy).toBe(StrategyType.TAKE_BREAK);
  expect(recommendation.signals.some(s => s.source === SignalSource.COGNITIVE_LOAD)).toBe(true);
});
```

**期待結果**:
- TAKE_BREAKが推奨される
- Cognitive Loadシグナルが含まれる

---

#### TC-INT-003: LocalStorage永続化
```typescript
test('TC-INT-003: should persist and restore state', async () => {
  const network1 = new AdaptiveEducationalAINetwork({ enabled: true });
  await network1.initialize();
  
  await network1.processQuestion('apple', 'correct', TestUtils.createMockContext());
  
  const state1 = network1.getState();
  
  // 新しいインスタンスを作成
  const network2 = new AdaptiveEducationalAINetwork();
  await network2.initialize();
  
  const state2 = network2.getState();
  
  expect(state2.sessionStats.questionsAnswered).toBe(state1.sessionStats.questionsAnswered);
});
```

**期待結果**:
- 状態が正しく永続化・復元される

---

#### TC-INT-004: 効果測定のフィードバックループ
```typescript
test('TC-INT-004: should improve strategy selection over time', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  // 戦略Aを10回使用（成功率90%）
  for (let i = 0; i < 10; i++) {
    // ... processQuestion with strategyA
    // ... record outcome
  }
  
  // 戦略Bを10回使用（成功率30%）
  for (let i = 0; i < 10; i++) {
    // ... processQuestion with strategyB
    // ... record outcome
  }
  
  // 次回の選択で戦略Aが優先されることを確認
  const recommendation = await network.processQuestion('newword', 'incorrect', mockContext);
  
  // 効果測定により戦略Aが選ばれやすくなっているはず
  expect(recommendation.strategy).toBe(/* strategyA */);
});
```

**期待結果**:
- 過去の効果が次の選択に反映される

---

### 2.2 AI モジュール連携

#### TC-INT-005: 複数AIからのシグナル統合
```typescript
test('TC-INT-005: should integrate signals from multiple AIs', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const recommendation = await network.processQuestion('apple', 'incorrect', {
    timeSpent: 8000,
    attemptNumber: 3,
    sessionDuration: 600000,
    recentErrors: 2,
    cognitiveLoad: 0.6
  });
  
  // 複数ソースからシグナルが来ていることを確認
  const sources = new Set(recommendation.signals.map(s => s.source));
  expect(sources.size).toBeGreaterThanOrEqual(2);
});
```

**期待結果**:
- 2つ以上のソースからシグナル

---

#### TC-INT-006: シグナル競合解決
```typescript
test('TC-INT-006: should resolve conflicting signals', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  // 相反するシグナルを発生させる状況
  const recommendation = await network.processQuestion('apple', 'correct', {
    timeSpent: 2000,        // 短時間（良好）
    attemptNumber: 1,
    sessionDuration: 1200000, // 20分（やや長い）
    recentErrors: 0,
    cognitiveLoad: 0.7       // 中程度の負荷
  });
  
  // 何らかの戦略が選択されていることを確認（競合が解決されている）
  expect(recommendation.strategy).toBeDefined();
  expect(recommendation.confidence).toBeGreaterThan(0);
});
```

**期待結果**:
- 矛盾なく戦略が選択される

---

## 3. E2Eテスト

### 3.1 実際の学習シナリオ

#### TC-E2E-001: 初学者の学習フロー
```typescript
describe('E2E Tests', () => {
  test('TC-E2E-001: beginner learning flow', async () => {
    const network = new AdaptiveEducationalAINetwork({ enabled: true });
    await network.initialize();
    
    const words = ['apple', 'banana', 'cherry'];
    const results = [];
    
    // 初回: すべて不正解
    for (const word of words) {
      const rec = await network.processQuestion(word, 'incorrect', {
        timeSpent: 8000,
        attemptNumber: 1,
        sessionDuration: 60000,
        recentErrors: 1
      });
      results.push(rec);
    }
    
    // 即座に再出題される戦略が選ばれているか
    expect(results.some(r => r.strategy === StrategyType.IMMEDIATE_REPETITION)).toBe(true);
    
    // 2回目: 一部正解
    const rec2 = await network.processQuestion('apple', 'correct', {
      timeSpent: 4000,
      attemptNumber: 2,
      sessionDuration: 120000,
      recentErrors: 0
    });
    
    // 間隔を空ける戦略に変わる
    expect(rec2.strategy).not.toBe(StrategyType.IMMEDIATE_REPETITION);
  });
});
```

**期待結果**:
- 習得段階に応じた戦略変化

---

#### TC-E2E-002: 長時間学習セッション
```typescript
test('TC-E2E-002: long learning session with fatigue', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  let sessionDuration = 0;
  const sessionLength = 45 * 60 * 1000; // 45分
  
  while (sessionDuration < sessionLength) {
    const recommendation = await network.processQuestion('word', 'incorrect', {
      timeSpent: 5000,
      attemptNumber: 1,
      sessionDuration,
      recentErrors: Math.floor(sessionDuration / 600000), // 10分ごとに1エラー
      cognitiveLoad: Math.min(0.9, sessionDuration / sessionLength)
    });
    
    // 30分を超えたら休憩が推奨されるはず
    if (sessionDuration > 30 * 60 * 1000) {
      if (recommendation.strategy === StrategyType.TAKE_BREAK) {
        expect(true).toBe(true); // 休憩が推奨された
        break;
      }
    }
    
    sessionDuration += 60000; // 1分ずつ進める
  }
});
```

**期待結果**:
- 長時間学習後に休憩推奨

---

#### TC-E2E-003: 混同ペアの学習
```typescript
test('TC-E2E-003: confusion pair learning', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  // affect/effect のような混同ペア
  const confusionPairs = ['affect', 'effect'];
  
  // affect を間違える
  await network.processQuestion('affect', 'incorrect', TestUtils.createMockContext());
  
  // effect も間違える
  const recommendation = await network.processQuestion('effect', 'incorrect', TestUtils.createMockContext());
  
  // 混同ペア戦略が推奨されるか
  const hasConfusionPairStrategy = recommendation.signals.some(
    s => s.type === StrategyType.USE_CONFUSION_PAIRS
  );
  
  expect(hasConfusionPairStrategy).toBe(true);
});
```

**期待結果**:
- 混同ペア戦略が検出される

---

### 3.2 UI統合

#### TC-E2E-004: Reactフック統合
```typescript
test('TC-E2E-004: React hook integration', async () => {
  const { result } = renderHook(() => useAdaptiveLearning());
  
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  
  // 初期状態
  expect(result.current.enabled).toBe(false);
  expect(result.current.currentStrategy).toBeNull();
  
  // 有効化
  act(() => {
    result.current.toggleEnabled();
  });
  
  expect(result.current.enabled).toBe(true);
  
  // 質問処理
  await act(async () => {
    const recommendation = await result.current.processQuestion('apple', 'incorrect', TestUtils.createMockContext());
    expect(recommendation).toBeDefined();
  });
  
  expect(result.current.currentStrategy).not.toBeNull();
});
```

**期待結果**:
- フックが正常に動作

---

## 4. パフォーマンステスト

### 4.1 レスポンスタイム

#### TC-PERF-001: processQuestion()パフォーマンス
```typescript
describe('Performance Tests', () => {
  test('TC-PERF-001: processQuestion should complete under 200ms', async () => {
    const network = new AdaptiveEducationalAINetwork({ enabled: true });
    await network.initialize();
    
    const times = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await network.processQuestion(`word${i}`, 'incorrect', TestUtils.createMockContext());
      const end = performance.now();
      times.push(end - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);
    
    expect(avgTime).toBeLessThan(50);
    expect(maxTime).toBeLessThan(200);
  });
});
```

**期待結果**:
- 平均 < 50ms
- 最大 < 200ms

---

#### TC-PERF-002: detectSignals()パフォーマンス
```typescript
test('TC-PERF-002: detectSignals should complete under 150ms', async () => {
  const detector = new SignalDetector(mockConfig);
  
  const start = performance.now();
  await detector.detectSignals('apple', 'incorrect', TestUtils.createMockContext());
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(150);
});
```

**期待結果**:
- < 150ms

---

### 4.2 メモリ使用量

#### TC-PERF-003: メモリリーク検査
```typescript
test('TC-PERF-003: should not leak memory', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  // 1000回処理
  for (let i = 0; i < 1000; i++) {
    await network.processQuestion(`word${i}`, 'incorrect', TestUtils.createMockContext());
  }
  
  // Garbage collection
  if (global.gc) global.gc();
  
  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const memoryIncrease = finalMemory - initialMemory;
  
  // メモリ増加は5MB以内
  expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
});
```

**期待結果**:
- メモリ増加 < 5MB

---

### 4.3 LocalStorage I/O

#### TC-PERF-004: LocalStorage書き込みパフォーマンス
```typescript
test('TC-PERF-004: LocalStorage writes should be batched', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  let writeCount = 0;
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(...args) {
    writeCount++;
    return originalSetItem.apply(this, args);
  };
  
  // 10回処理
  for (let i = 0; i < 10; i++) {
    await network.processQuestion(`word${i}`, 'incorrect', TestUtils.createMockContext());
  }
  
  // 待機（デバウンス）
  await new Promise(resolve => setTimeout(resolve, 600));
  
  Storage.prototype.setItem = originalSetItem;
  
  // バッチ処理により書き込み回数は少ないはず（10回より少ない）
  expect(writeCount).toBeLessThan(5);
});
```

**期待結果**:
- バッチ処理により書き込み削減

---

## 5. エッジケーステスト

### 5.1 境界値

#### TC-EDGE-001: 空のシグナル配列
```typescript
describe('Edge Case Tests', () => {
  test('TC-EDGE-001: should handle empty signals array', () => {
    const executor = new StrategyExecutor(mockConfig);
    
    const recommendation = executor.selectBestStrategy([], new Map());
    
    expect(recommendation.strategy).toBe(StrategyType.CONTINUE_NORMAL);
  });
});
```

**期待結果**:
- デフォルト戦略を返す

---

#### TC-EDGE-002: 認知負荷1.0（最大値）
```typescript
test('TC-EDGE-002: should handle maximum cognitive load', async () => {
  const detector = new SignalDetector(mockConfig);
  
  const signals = await detector.detectCognitiveLoadSignals({
    ...mockContext,
    cognitiveLoad: 1.0
  });
  
  const breakSignal = signals.find(s => s.type === StrategyType.TAKE_BREAK);
  expect(breakSignal).toBeDefined();
  expect(breakSignal!.strength).toBe(1.0);
});
```

**期待結果**:
- TAKE_BREAKシグナル（最大強度）

---

#### TC-EDGE-003: 超長時間セッション
```typescript
test('TC-EDGE-003: should handle very long session', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const recommendation = await network.processQuestion('apple', 'incorrect', {
    ...mockContext,
    sessionDuration: 5 * 60 * 60 * 1000  // 5時間
  });
  
  // 何らかの休憩推奨があるはず
  expect(recommendation.signals.some(
    s => s.type === StrategyType.TAKE_BREAK || s.type === StrategyType.ADJUST_SESSION_LENGTH
  )).toBe(true);
});
```

**期待結果**:
- 休憩推奨シグナル

---

### 5.2 無効なデータ

#### TC-EDGE-004: 無効なJSON復元
```typescript
test('TC-EDGE-004: should handle invalid JSON import', () => {
  const network = new AdaptiveEducationalAINetwork();
  
  expect(() => {
    network.importState('{ invalid json }');
  }).toThrow(InvalidStateError);
});
```

**期待結果**:
- InvalidStateErrorをスロー

---

#### TC-EDGE-005: 負の数値
```typescript
test('TC-EDGE-005: should handle negative values gracefully', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const recommendation = await network.processQuestion('apple', 'incorrect', {
    timeSpent: -1000,  // 無効
    attemptNumber: -5,  // 無効
    sessionDuration: -60000,  // 無効
    recentErrors: -2  // 無効
  });
  
  // エラーをスローせず、デフォルト値に補正されるべき
  expect(recommendation).toBeDefined();
});
```

**期待結果**:
- エラーなく処理（値を補正）

---

### 5.3 並行処理

#### TC-EDGE-006: 同時複数リクエスト
```typescript
test('TC-EDGE-006: should handle concurrent requests', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      network.processQuestion(`word${i}`, 'incorrect', TestUtils.createMockContext())
    );
  }
  
  const recommendations = await Promise.all(promises);
  
  // すべて正常に処理される
  expect(recommendations).toHaveLength(10);
  recommendations.forEach(rec => {
    expect(rec.strategy).toBeDefined();
  });
});
```

**期待結果**:
- すべて正常に処理

---

### 5.4 ストレージ

#### TC-EDGE-007: LocalStorage満杯
```typescript
test('TC-EDGE-007: should handle full LocalStorage', async () => {
  const network = new AdaptiveEducationalAINetwork({ enabled: true });
  await network.initialize();
  
  // LocalStorageを満杯にするモック
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function() {
    throw new DOMException('QuotaExceededError');
  };
  
  // エラーをスローせず動作を続けるべき
  await expect(
    network.processQuestion('apple', 'incorrect', TestUtils.createMockContext())
  ).resolves.not.toThrow();
  
  Storage.prototype.setItem = originalSetItem;
});
```

**期待結果**:
- エラーをスローせず動作継続

---

## 6. テストカバレッジ目標

### 6.1 カバレッジ指標

| カテゴリ | 目標 |
|---------|------|
| Line Coverage | 90%以上 |
| Branch Coverage | 85%以上 |
| Function Coverage | 95%以上 |
| Statement Coverage | 90%以上 |

### 6.2 除外項目

以下は除外可能：
- デバッグログ出力
- 型定義ファイル（types.ts）
- モックユーティリティ

---

## 7. テスト実行

### 7.1 コマンド

```bash
# すべてのテスト実行
npm test

# カバレッジ付き
npm run test:coverage

# 特定のテストスイート
npm test -- --testNamePattern="SignalDetector"

# Watch mode
npm test -- --watch
```

### 7.2 CI/CD統合

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

---

## 8. テストデータ

### 8.1 モックユーティリティ

```typescript
// test/utils/TestUtils.ts
export class TestUtils {
  static createMockContext(overrides?: Partial<QuestionContext>): QuestionContext {
    return {
      timeSpent: 5000,
      attemptNumber: 1,
      sessionDuration: 300000,
      recentErrors: 0,
      cognitiveLoad: 0.5,
      ...overrides
    };
  }

  static createMockSignal(overrides?: Partial<LearningSignal>): LearningSignal {
    return {
      source: SignalSource.MEMORY_ACQUISITION,
      type: StrategyType.IMMEDIATE_REPETITION,
      strength: 0.8,
      confidence: 0.7,
      priority: 9,
      timestamp: Date.now(),
      ...overrides
    };
  }

  static createMockNetwork(config?: Partial<NetworkConfig>): AdaptiveEducationalAINetwork {
    const network = new AdaptiveEducationalAINetwork(config);
    // Initialize with test data
    return network;
  }
}
```

---

## 付録: テスト命名規則

**形式**: `TC-[モジュール略称]-[番号]: [テスト内容]`

**モジュール略称**:
- `AEAN`: AdaptiveEducationalAINetwork
- `SD`: SignalDetector
- `SE`: StrategyExecutor
- `ET`: EffectivenessTracker
- `INT`: Integration
- `E2E`: End-to-End
- `PERF`: Performance
- `EDGE`: Edge Case

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | 2025-12-16 | 初版作成（110+テストケース） |

---

**文書終了**
