# Phase 1（P0）実装タスク詳細

## 🎯 目標
業界トップクラスから次世代へ - 即効性の高い改善を2週間で実装

---

## 📋 Task 1: MemoryAI校正システム

### 1.1 確率校正の実装

**ファイル**: `src/ai/models/ForgettingCurveModel.ts`

```typescript
// 追加する機能
interface CalibrationParams {
  alpha: number;  // Sigmoid変換のスケール
  beta: number;   // Sigmoid変換のシフト
}

class ForgettingCurveModel {
  // 既存機能に追加
  static calibrateForgettingRisk(
    rawRisk: number,
    calibrationParams: CalibrationParams
  ): number {
    // Platt Scaling風の校正
    // calibratedRisk = 1 / (1 + exp(alpha * rawRisk + beta))
  }
  
  static learnCalibrationParams(
    predictions: Array<{predicted: number, actual: boolean}>
  ): CalibrationParams {
    // 実績データから校正パラメータを学習
  }
}
```

**実装ステップ**:
1. [ ] `calibrateForgettingRisk()`メソッド実装
2. [ ] `learnCalibrationParams()`実装（最小二乗法）
3. [ ] `localStorage`に校正パラメータを保存
4. [ ] 週次更新ロジック追加
5. [ ] テスト: 合成データでECE計算

**工数**: 3-4日  
**依存**: なし

---

### 1.2 評価メトリクス計算

**ファイル**: `src/ai/evaluation/calibrationMetrics.ts`（新規作成）

```typescript
export interface CalibrationMetrics {
  ece: number;           // Expected Calibration Error
  mae: number;           // Mean Absolute Error
  mse: number;           // Mean Squared Error
  reliability: number;   // 信頼度
}

export function calculateECE(
  predictions: Array<{predicted: number, actual: boolean}>,
  nBins: number = 10
): number {
  // ECE計算: 予測確率をビン分割し、各ビンで実際の正答率との差を計算
}

export function calculateMAE(
  predictions: Array<{predicted: number, actual: number}>
): number {
  // MAE計算: |predicted - actual|の平均
}
```

**実装ステップ**:
1. [ ] `calculateECE()`実装
2. [ ] `calculateMAE()`実装
3. [ ] `calculateMSE()`実装
4. [ ] `generateCalibrationCurve()`実装（プロット用）
5. [ ] テスト: 既知データでの検証

**工数**: 2-3日  
**依存**: なし

---

### 1.3 保持率ダッシュボード

**ファイル**: `src/components/MemoryRetentionPanel.tsx`（新規作成）

```typescript
interface MemoryRetentionPanelProps {
  currentWord?: string;
  allProgress: Record<string, WordProgress>;
}

export function MemoryRetentionPanel({ 
  currentWord, 
  allProgress 
}: MemoryRetentionPanelProps) {
  const prediction = useMemo(() => {
    if (!currentWord) return null;
    return ForgettingCurveModel.predictRetention(
      allProgress[currentWord]
    );
  }, [currentWord, allProgress]);
  
  return (
    <div className="memory-retention-panel">
      {/* 現在の保持率 */}
      <div className="retention-rate">
        <span>記憶保持率: {(prediction?.retentionRate * 100).toFixed(0)}%</span>
      </div>
      
      {/* 半減期 */}
      <div className="half-life">
        <span>半減期: {prediction?.halfLife.toFixed(1)}日</span>
      </div>
      
      {/* 最適復習時刻 */}
      <div className="optimal-review">
        <span>
          次回復習: {new Date(prediction?.optimalReviewTime).toLocaleDateString()}
        </span>
      </div>
      
      {/* 保持率推移グラフ */}
      <RetentionCurveChart word={currentWord} />
    </div>
  );
}
```

**実装ステップ**:
1. [ ] コンポーネント基本構造作成
2. [ ] `RetentionCurveChart`サブコンポーネント実装（Chart.js）
3. [ ] CSS/Tailwindスタイリング
4. [ ] `ScoreBoard.tsx`に統合
5. [ ] レスポンシブ対応
6. [ ] テスト: 各種データパターンで表示確認

**工数**: 3-4日  
**依存**: Task 1.1完了後

---

### 1.4 データ収集基盤

**ファイル**: `src/storage/progress/predictionLogger.ts`（新規作成）

```typescript
interface PredictionLog {
  word: string;
  timestamp: number;
  predictedRetention: number;
  actualCorrect: boolean;
  calibratedRisk: number;
}

export class PredictionLogger {
  private static readonly STORAGE_KEY = 'memory-prediction-log';
  private static readonly MAX_LOGS = 1000;
  
  static log(entry: PredictionLog): void {
    // ログをlocalStorageに追加
  }
  
  static getLogs(since?: number): PredictionLog[] {
    // ログを取得
  }
  
  static calculateMetrics(): CalibrationMetrics {
    // 蓄積ログからメトリクス計算
  }
  
  static cleanup(): void {
    // 古いログを削除（最新1000件のみ保持）
  }
}
```

**実装ステップ**:
1. [ ] `PredictionLogger`クラス実装
2. [ ] `updateWordProgress()`でログ記録呼び出し追加
3. [ ] 週次クリーンアップタスク実装
4. [ ] 統計計算の自動化
5. [ ] テスト: ログの保存・取得・集計

**工数**: 2-3日  
**依存**: Task 1.2完了後

---

### 1.5 オンライン校正更新

**ファイル**: `src/ai/models/ForgettingCurveModel.ts`（拡張）

```typescript
class ForgettingCurveModel {
  // ミニバッチでの漸進的校正
  static updateCalibrationIncremental(
    currentParams: CalibrationParams,
    newBatch: Array<{predicted: number, actual: boolean}>,
    learningRate: number = 0.01
  ): CalibrationParams {
    // オンライン学習（SGD風）で校正パラメータを微調整
    // 初期ユーザーのコールドスタート問題を緩和
  }
  
  static getDefaultParams(): CalibrationParams {
    // グローバル統計から算出したデフォルト値
    return { alpha: 1.0, beta: 0.0 };
  }
}
```

**実装ステップ**:
1. [ ] 漸進的更新ロジック実装
2. [ ] バッチサイズ最適化（N=10, 30, 100）
3. [ ] デフォルトパラメータの保守的設定
4. [ ] 更新頻度制御（過学習防止）
5. [ ] テスト: 小データでの挙動確認

**工数**: 2日  
**依存**: Task 1.1完了後

---

## 📋 Task 2: データ品質とスキーマ管理（新規P0）

### 2.1 スキーマバージョニング

**ファイル**: `src/storage/progress/types.ts`（拡張）

```typescript
export const SCHEMA_VERSION = 3;  // 現在バージョン

export interface WordProgress {
  schemaVersion?: number;  // バージョン識別子
  // ... 既存フィールド
}

export interface StorageSchema {
  version: number;
  migratedAt?: number;
}
```

**ファイル**: `src/storage/progress/migrations.ts`（新規作成）

```typescript
export type MigrationFunction = (oldData: any) => any;

export const migrations: Record<string, MigrationFunction> = {
  'v1-to-v2': (data) => {
    // memoryStrength, halfLife追加
    return { ...data, memoryStrength: 1.0, halfLife: 7 };
  },
  'v2-to-v3': (data) => {
    // forgettingCurveParams追加
    return { 
      ...data, 
      forgettingCurveParams: { alpha: 1.0, beta: 0.0 } 
    };
  }
};

export function migrateWordProgress(
  data: any, 
  targetVersion: number = SCHEMA_VERSION
): WordProgress {
  let current = data.schemaVersion || 1;
  let migrated = { ...data };
  
  while (current < targetVersion) {
    const migrationKey = `v${current}-to-v${current + 1}`;
    if (migrations[migrationKey]) {
      migrated = migrations[migrationKey](migrated);
      current++;
    } else {
      throw new Error(`Migration not found: ${migrationKey}`);
    }
  }
  
  migrated.schemaVersion = targetVersion;
  return migrated as WordProgress;
}
```

**実装ステップ**:
1. [ ] バージョン識別子追加
2. [ ] 既存データのマイグレーション関数実装
3. [ ] `progressStorage.ts`の読込時に自動マイグレーション
4. [ ] ロールバック機能（バックアップ作成）
5. [ ] テスト: 全バージョン→最新への変換

**工数**: 3-4日  
**依存**: なし（即時着手可）

---

### 2.2 データ整合性検証

**ファイル**: `src/storage/progress/validator.ts`（新規作成）

```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixed?: WordProgress;  // 自動修正版
}

export function validateWordProgress(
  data: WordProgress
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixed = { ...data };
  
  // 必須フィールドチェック
  if (!data.word) errors.push('Missing word');
  if (data.correctCount < 0) {
    errors.push('Negative correctCount');
    fixed.correctCount = 0;
  }
  
  // 範囲チェック
  if (data.memoryStrength > 10 || data.memoryStrength < 0) {
    warnings.push('memoryStrength out of range');
    fixed.memoryStrength = Math.max(0, Math.min(10, data.memoryStrength));
  }
  
  // 整合性チェック
  if (data.correctCount + data.incorrectCount !== data.attemptCount) {
    warnings.push('Attempt count mismatch');
    fixed.attemptCount = data.correctCount + data.incorrectCount;
  }
  
  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings, 
    fixed: warnings.length > 0 ? fixed : undefined 
  };
}

export function cleanupDuplicates(
  allProgress: Record<string, WordProgress>
): Record<string, WordProgress> {
  // 重複キーの統合（最新データ優先）
  const seen = new Set<string>();
  const cleaned: Record<string, WordProgress> = {};
  
  Object.entries(allProgress).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      cleaned[normalizedKey] = value;
    } else {
      // 既存より新しければ上書き
      if (value.lastReview > cleaned[normalizedKey].lastReview) {
        cleaned[normalizedKey] = value;
      }
    }
  });
  
  return cleaned;
}
```

**実装ステップ**:
1. [ ] 検証関数実装
2. [ ] 起動時の自動検証・修正
3. [ ] 重複排除ロジック
4. [ ] エラーログ記録
5. [ ] テスト: 異常データでの挙動

**工数**: 2-3日  
**依存**: なし

---

## 📋 Task 3: QuestionScheduler説明可能性

### 2.1 優先度分解データ構造

**ファイル**: `src/ai/scheduler/types.ts`

```typescript
// 既存のPrioritizedQuestionインターフェースに追加
export interface PriorityBreakdown {
  baseCategory: number;       // カテゴリ由来（incorrect=100等）
  baseCategoryName: string;   // 'incorrect' | 'still_learning' | 'new' | 'mastered'
  dtaAdjustment: number;      // 忘却リスク調整
  dtaRisk?: number;           // 忘却リスク値
  timeBoost: number;          // 時間経過ブースト
  daysSinceLastStudy?: number;
  signalPenalty: number;      // メタAIシグナル（疲労等）
  activeSignals?: string[];   // ['fatigue', 'struggling']
  antiVibration: number;      // 振動防止ペナルティ
  timeSinceAnswer?: number;   // 最終回答からの経過時間（秒）
  finalPriority: number;      // 最終優先度
  explanation: string;        // 人間可読な説明
}

export interface PrioritizedQuestion {
  question: Question;
  priority: number;
  status: WordStatus | null;
  signals: any[];
  originalIndex: number;
  antiVibrationApplied?: boolean;
  priorityBreakdown?: PriorityBreakdown;  // 追加
}
```

**実装ステップ**:
1. [ ] 型定義追加
2. [ ] テスト: TypeScriptコンパイル確認

**工数**: 0.5日  
**依存**: なし

---

### 2.2 分解値の計算と記録

**ファイル**: `src/ai/scheduler/QuestionScheduler.ts`

```typescript
// calculatePriorities()メソッドを拡張
private calculatePriorities(
  questions: Question[],
  context: ScheduleContext,
  signals: any[],
  hybridMode = false
): PrioritizedQuestion[] {
  return questions.map((q, index) => {
    const status = this.getWordStatus(q.word, context.mode);
    
    // 基本優先度
    let priority = this.getBasePriority(status);
    const breakdown: PriorityBreakdown = {
      baseCategory: priority,
      baseCategoryName: status?.category || 'new',
      dtaAdjustment: 0,
      timeBoost: 0,
      signalPenalty: 0,
      antiVibration: 0,
      finalPriority: priority,
      explanation: ''
    };
    
    // DTA調整
    if (status?.category === 'mastered') {
      const risk = this.calculateForgettingRisk({...});
      const oldPriority = priority;
      
      if (risk < 30) priority = 5;
      else if (risk < 70) priority = 20;
      else priority = 40;
      
      breakdown.dtaAdjustment = priority - oldPriority;
      breakdown.dtaRisk = risk;
    }
    
    // シグナル反映
    const signalAdjust = this.applySignals(priority, signals, q);
    breakdown.signalPenalty = signalAdjust - priority;
    breakdown.activeSignals = signals.map(s => s.type);
    priority = signalAdjust;
    
    // 時間ブースト
    const boosted = this.applyTimeBoost(priority, status);
    breakdown.timeBoost = boosted - priority;
    breakdown.daysSinceLastStudy = status?.lastStudied 
      ? (Date.now() - status.lastStudied) / (1000 * 60 * 60 * 24)
      : undefined;
    priority = boosted;
    
    breakdown.finalPriority = priority;
    breakdown.explanation = this.generateExplanation(breakdown);
    
    return {
      question: q,
      priority,
      status,
      signals,
      originalIndex: index,
      priorityBreakdown: breakdown
    };
  });
}

private generateExplanation(breakdown: PriorityBreakdown): string {
  const parts: string[] = [];
  
  parts.push(`カテゴリ: ${breakdown.baseCategoryName} (${breakdown.baseCategory})`);
  
  if (breakdown.dtaAdjustment !== 0) {
    parts.push(
      `忘却リスク調整: ${breakdown.dtaAdjustment > 0 ? '+' : ''}${breakdown.dtaAdjustment.toFixed(1)} ` +
      `(リスク値: ${breakdown.dtaRisk?.toFixed(0)})`
    );
  }
  
  if (breakdown.timeBoost !== 0) {
    parts.push(
      `時間ブースト: ${breakdown.timeBoost > 0 ? '+' : ''}${breakdown.timeBoost.toFixed(1)} ` +
      `(${breakdown.daysSinceLastStudy?.toFixed(1)}日経過)`
    );
  }
  
  if (breakdown.signalPenalty !== 0) {
    parts.push(
      `シグナル調整: ${breakdown.signalPenalty > 0 ? '+' : ''}${breakdown.signalPenalty.toFixed(1)} ` +
      `(${breakdown.activeSignals?.join(', ')})`
    );
  }
  
  return parts.join(' | ');
}
```

**実装ステップ**:
1. [ ] `PriorityBreakdown`計算ロジック実装
2. [ ] `generateExplanation()`実装
3. [ ] `applyAntiVibration()`でもbreakdown更新
4. [ ] デバッグログ出力追加
5. [ ] テスト: 各種パターンで分解値確認

**工数**: 3-4日  
**依存**: Task 2.1完了後

---

### 2.3 UI表示

**ファイル**: `src/components/PriorityExplainerModal.tsx`（新規作成）

```typescript
interface PriorityExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: PriorityBreakdown;
  word: string;
}

export function PriorityExplainerModal({
  isOpen,
  onClose,
  breakdown,
  word
}: PriorityExplainerModalProps) {
  return (
    <dialog open={isOpen} className="priority-modal">
      <h2>出題優先度の詳細: {word}</h2>
      
      {/* 優先度の棒グラフ */}
      <PriorityBarChart breakdown={breakdown} />
      
      {/* 詳細説明 */}
      <div className="breakdown-details">
        <div className="detail-row">
          <span>基本カテゴリ:</span>
          <span>{breakdown.baseCategoryName} ({breakdown.baseCategory})</span>
        </div>
        
        {breakdown.dtaAdjustment !== 0 && (
          <div className="detail-row">
            <span>忘却リスク調整:</span>
            <span>{breakdown.dtaAdjustment.toFixed(1)} (リスク: {breakdown.dtaRisk})</span>
          </div>
        )}
        
        {/* 他の項目... */}
      </div>
      
      {/* 人間可読な説明 */}
      <p className="explanation">{breakdown.explanation}</p>
      
      <button onClick={onClose}>閉じる</button>
    </dialog>
  );
}
```

**実装ステップ**:
1. [ ] モーダルコンポーネント作成
2. [ ] `PriorityBarChart`サブコンポーネント実装
3. [ ] 開発モード判定ロジック
4. [ ] `MemorizationView.tsx`に統合（「?」ボタン追加）
5. [ ] CSS/アニメーション
6. [ ] テスト: UI表示確認

**工数**: 2-3日  
**依存**: Task 2.2完了後

---

### 2.4 監査ログ

**ファイル**: `src/ai/scheduler/auditLogger.ts`（新規作成）

```typescript
interface SchedulerAuditLog {
  timestamp: number;
  sessionId: string;
  mode: string;
  totalQuestions: number;
  top20Priorities: Array<{
    word: string;
    priority: number;
    breakdown: PriorityBreakdown;
  }>;
  vibrationScore: number;
  signalCount: number;
  processingTime: number;
}

export class SchedulerAuditLogger {
  private static readonly STORAGE_KEY = 'scheduler-audit-log';
  private static readonly MAX_LOGS = 100;
  private static readonly RETENTION_DAYS = 7;
  
  static log(entry: SchedulerAuditLog): void {
    // 監査ログをlocalStorageに保存
  }
  
  static getLogs(since?: number): SchedulerAuditLog[] {
    // ログを取得
  }
  
  static cleanup(): void {
    // 7日以上古いログを削除
  }
  
  static exportLogs(): string {
    // JSON形式でエクスポート
  }
}
```

**実装ステップ**:
1. [ ] `SchedulerAuditLogger`クラス実装
2. [ ] `QuestionScheduler.schedule()`でログ記録
3. [ ] 自動クリーンアップ実装
4. [ ] エクスポート機能実装
5. [ ] テスト: ログの保存・取得・削除

**工数**: 2日  
**依存**: Task 2.2完了後

---

## � Task 5: フィーチャーフラグとAB実験基盤（新規P0）

### 5.1 フィーチャーフラグ実装

**ファイル**: `src/config/featureFlags.ts`（新規作成）

```typescript
export interface ExperimentConfig {
  id: string;
  name: string;
  variant: 'control' | 'treatment';
  startDate: string;
  endDate?: string;
  sampleRate: number;  // 0.0 - 1.0
  enabled: boolean;
}

// ユーザーIDベースの安定したグループ割当
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function assignVariant(
  userId: string, 
  experimentId: string
): 'control' | 'treatment' {
  try {
    const hash = simpleHash(`${userId}-${experimentId}`);
    return hash % 2 === 0 ? 'control' : 'treatment';
  } catch (error) {
    console.error('Variant assignment failed, defaulting to control', error);
    return 'control';  // フェイルセーフ
  }
}

export function getExperimentVariant(experimentId: string): 'control' | 'treatment' {
  const userId = getUserId();  // localStorage から取得
  return assignVariant(userId, experimentId);
}

// 実験定義
export const EXPERIMENTS: Record<string, ExperimentConfig> = {
  'forgetting-curve-calibration': {
    id: 'forgetting-curve-calibration',
    name: '忘却曲線校正実験',
    variant: getExperimentVariant('forgetting-curve-calibration'),
    startDate: '2025-12-20',
    sampleRate: 0.5,
    enabled: true
  },
  'anti-vibration-hard-block': {
    id: 'anti-vibration-hard-block',
    name: '重複防止強化実験',
    variant: getExperimentVariant('anti-vibration-hard-block'),
    startDate: '2025-12-20',
    sampleRate: 1.0,
    enabled: true
  }
};

export function isFeatureEnabled(experimentId: string): boolean {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment || !experiment.enabled) return false;
  return experiment.variant === 'treatment';
}
```

**実装ステップ**:
1. [ ] フィーチャーフラグモジュール作成
2. [ ] ユーザーIDハッシュ関数実装
3. [ ] フェイルセーフロジック追加
4. [ ] localStorage統合
5. [ ] テスト: 同一ユーザーで安定した割当

**工数**: 2日  
**依存**: なし

---

### 5.2 実験イベント計測

**ファイル**: `src/utils/experimentLogger.ts`（新規作成）

```typescript
export interface ExperimentEvent {
  event_type: string;
  experiment_id: string;
  variant: 'control' | 'treatment';
  user_id: string;
  timestamp: string;
  data: Record<string, any>;
}

export class ExperimentLogger {
  private static readonly STORAGE_KEY = 'experiment-events';
  private static readonly MAX_EVENTS = 500;
  
  static logEvent(
    eventType: string,
    experimentId: string,
    data: Record<string, any>
  ): void {
    try {
      const experiment = EXPERIMENTS[experimentId];
      if (!experiment) return;
      
      const event: ExperimentEvent = {
        event_type: eventType,
        experiment_id: experimentId,
        variant: experiment.variant,
        user_id: getUserId(),
        timestamp: new Date().toISOString(),
        data
      };
      
      const events = this.getEvents();
      events.push(event);
      
      // 古いイベントを削除（最新500件のみ）
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to log experiment event', error);
    }
  }
  
  static getEvents(experimentId?: string): ExperimentEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const events = JSON.parse(stored) as ExperimentEvent[];
      return experimentId 
        ? events.filter(e => e.experiment_id === experimentId)
        : events;
    } catch (error) {
      console.error('Failed to get experiment events', error);
      return [];
    }
  }
  
  static calculateMetrics(experimentId: string): ExperimentMetrics {
    const events = this.getEvents(experimentId);
    const answerEvents = events.filter(e => e.event_type === 'answer_submitted');
    
    const control = answerEvents.filter(e => e.variant === 'control');
    const treatment = answerEvents.filter(e => e.variant === 'treatment');
    
    return {
      control: this.computeGroupMetrics(control),
      treatment: this.computeGroupMetrics(treatment)
    };
  }
  
  private static computeGroupMetrics(events: ExperimentEvent[]): GroupMetrics {
    const correct = events.filter(e => e.data.correct).length;
    const total = events.length;
    
    return {
      accuracy: total > 0 ? correct / total : 0,
      sampleSize: total,
      // 他のKPI計算...
    };
  }
}
```

**実装ステップ**:
1. [ ] イベントロガー実装
2. [ ] メトリクス計算関数実装
3. [ ] `updateWordProgress()`にログ呼び出し追加
4. [ ] クリーンアップロジック
5. [ ] テスト: イベント記録・集計

**工数**: 2-3日  
**依存**: Task 5.1完了後

---

### 5.3 Kill Switch実装

**ファイル**: `src/config/killSwitch.ts`（新規作成）

```typescript
export interface KillSwitchConfig {
  accuracyThreshold: number;      // 正答率下限（例: -0.10）
  errorRateThreshold: number;     // エラー率上限（例: 0.05）
  duplicateRateThreshold: number; // 重複率上限（例: 0.20）
  responseTimeMultiplier: number; // 応答時間倍率上限（例: 2.0）
}

export interface ExperimentMetrics {
  accuracy: number;
  errorRate: number;
  duplicateRate: number;
  responseTimeP95: number;
}

const DEFAULT_KILL_SWITCH_CONFIG: KillSwitchConfig = {
  accuracyThreshold: -0.10,
  errorRateThreshold: 0.05,
  duplicateRateThreshold: 0.20,
  responseTimeMultiplier: 2.0
};

export function checkKillSwitch(
  currentMetrics: ExperimentMetrics,
  baselineMetrics: ExperimentMetrics,
  config: KillSwitchConfig = DEFAULT_KILL_SWITCH_CONFIG
): { shouldStop: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // 正答率チェック
  if (currentMetrics.accuracy < baselineMetrics.accuracy + config.accuracyThreshold) {
    reasons.push(`正答率が基準値より${Math.abs(config.accuracyThreshold * 100)}pt以上低下`);
  }
  
  // エラー率チェック
  if (currentMetrics.errorRate > config.errorRateThreshold) {
    reasons.push(`エラー率が${config.errorRateThreshold * 100}%を超過`);
  }
  
  // 重複率チェック
  if (currentMetrics.duplicateRate > config.duplicateRateThreshold) {
    reasons.push(`重複率が${config.duplicateRateThreshold * 100}%を超過`);
  }
  
  // パフォーマンスチェック
  if (currentMetrics.responseTimeP95 > baselineMetrics.responseTimeP95 * config.responseTimeMultiplier) {
    reasons.push(`応答時間が基準値の${config.responseTimeMultiplier}倍を超過`);
  }
  
  return {
    shouldStop: reasons.length > 0,
    reasons
  };
}

export function disableExperiment(experimentId: string): void {
  const experiment = EXPERIMENTS[experimentId];
  if (experiment) {
    experiment.enabled = false;
    localStorage.setItem(`kill-switch-${experimentId}`, 'true');
    console.warn(`Experiment ${experimentId} has been disabled by kill switch`);
  }
}
```

**実装ステップ**:
1. [ ] Kill Switch設定と判定関数実装
2. [ ] 自動監視ロジック追加（定期チェック）
3. [ ] 手動停止機能（管理画面）
4. [ ] 通知機能（コンソールログ＋警告表示）
5. [ ] テスト: 各閾値での停止動作確認

**工数**: 2日  
**依存**: Task 5.2完了後

---

## �📊 検証タスク

### V1: MemoryAI校正の検証

**手順**:
1. [ ] 合成データ生成（既知の忘却曲線）
2. [ ] 校正前後のECE計算
3. [ ] 目標: ECE < 0.10
4. [ ] レポート作成

**工数**: 1日  
**依存**: Task 1.1, 1.2完了後

---

### V2: 優先度説明の妥当性検証

**手順**:
1. [ ] 5人のユーザーでユーザビリティテスト
2. [ ] 「説明が理解できるか」「納得できるか」を評価
3. [ ] フィードバックを元に改善
4. [ ] レポート作成

**工数**: 2日  
**依存**: Task 2.3完了後

---

## 🎯 Phase 1完了基準

- [ ] すべての実装タスク完了
- [ ] ECE < 0.10達成
- [ ] ユーザビリティテスト合格（理解度 > 80%）
- [ ] 監査ログが正常に記録・閲覧可能
- [ ] 保持率ダッシュボードが正常に動作
- [ ] コードレビュー完了
- [ ] ドキュメント更新完了

**総工数見積**: 20-25日（1人）  
**スケジュール**: 2-3週間

---

## 📝 次のステップ

1. ✅ タスクの詳細レビュー
2. ⬜ GitHub Issueの作成
3. ⬜ 開発環境のセットアップ
4. ⬜ Task 1.1から着手

---

**更新履歴**
- 2025-12-20: 初版策定
