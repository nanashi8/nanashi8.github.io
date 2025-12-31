/**
 * MLEnhancedSpecialistAI - 機械学習対応基底クラス
 *
 * 既存の7AIにML機能を注入するための基底クラス
 * ルールベース + ML のハイブリッドアプローチ
 */

import * as tf from '@tensorflow/tfjs';
import type { BaseAISignal, AIAnalysisInput, SpecialistAI } from '../types';
import type {
  MLPrediction,
  MLModelState,
  MLLearningOutcome,
  SerializedWeights
} from './types';
import { logger } from '@/utils/logger';

export abstract class MLEnhancedSpecialistAI<TSignal extends BaseAISignal>
  implements SpecialistAI<TSignal> {

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly icon: string;

  // ML機能
  protected mlModel: tf.LayersModel | null = null;
  protected mlEnabled: boolean = false;
  protected mlState: MLModelState = {
    initialized: false,
    ready: false,
    trainingCount: 0,
    lastTrainedAt: null,
    accuracy: null,
  };

  // Week 5: モデルキャッシュ（グローバルキャッシュ）
  private static modelCache: Map<string, tf.LayersModel> = new Map();
  private static memoryUsage: { current: number; peak: number; lastCheck: number } = {
    current: 0,
    peak: 0,
    lastCheck: Date.now(),
  };

  // 初期化警告の抑制フラグ
  private static initWarningShown: Set<string> = new Set();

  // 重いログのスパム抑制（コンソールが埋まるのを防ぐ）
  private static slowInferenceLastLogAt: Map<string, number> = new Map();
  private static learningErrorLastLogAt: Map<string, number> = new Map();
  private static disablePersonalWeightsPersistence: boolean = false;

  /**
   * ハイブリッド分析（ルールベース + ML）
   * ⚡ パフォーマンス最適化: ML分析のスキップ条件を厳密化
   */
  async analyze(input: AIAnalysisInput): Promise<TSignal> {
    // 1. ルールベース分析（常に実行）
    const ruleSignal = this.analyzeByRules(input);

    // 2. ML分析（条件を満たす場合のみ）
    // ⚡ 最適化: attempts < 50 の場合はML不要（データ不足）
    const attempts = input.progress?.memorizationAttempts || input.progress?.totalAttempts || 0;
    const skipML = attempts < 50;

    if (!skipML && this.canUseML(input)) {
      try {
        const mlSignal = await this.analyzeByML(input);
        return this.mergeSignals(ruleSignal, mlSignal, input);
      } catch (error) {
        // エラーログは抑制（ルールベースで続行）
      }
    }

    return ruleSignal;
  }

  /**
   * ルールベース分析（既存のロジック）
   * 各AIで実装
   */
  protected abstract analyzeByRules(input: AIAnalysisInput): TSignal;

  /**
   * ML分析（新規実装）
   * 各AIで実装
   */
  protected abstract analyzeByML(input: AIAnalysisInput): Promise<TSignal>;

  /**
   * シグナル統合（ルール + ML）
   * 各AIで実装
   */
  protected abstract mergeSignals(
    ruleSignal: TSignal,
    mlSignal: TSignal,
    input: AIAnalysisInput
  ): TSignal;

  /**
   * 特徴量抽出
   * 各AIで実装
   */
  protected abstract extractFeatures(input: AIAnalysisInput): number[];

  /**
   * MLモデルの初期化
   */
  async initializeML(modelPath?: string): Promise<void> {
    if (this.mlState.initialized) {
      logger.info(`[${this.name}] ML already initialized`);
      return;
    }

    try {
      const path = modelPath || `/models/${this.id}/model.json`;

      // Week 5: キャッシュ確認（パスとID両方を含むキー）
      const cacheKey = `${this.id}_${path}`;
      const cachedModel = MLEnhancedSpecialistAI.modelCache.get(cacheKey);

      if (cachedModel) {
        this.mlModel = cachedModel;
        // キャッシュヒット時も個人の重みを再読込（最新の学習状態を反映）
        await this.loadPersonalWeights();
        this.mlState.initialized = true;
        this.mlState.ready = true;
        logger.info(`[${this.name}] ✅ ML model loaded from cache (weights reloaded)`);
        return;
      }

      logger.info(`[${this.name}] Loading ML model from ${path}`);
      this.mlModel = await tf.loadLayersModel(path);

      // 個人の重みを復元
      await this.loadPersonalWeights();

      // Week 5: キャッシュに保存（パスを含むキー）
      MLEnhancedSpecialistAI.modelCache.set(cacheKey, this.mlModel);
      this.updateMemoryUsage();

      this.mlState.initialized = true;
      this.mlState.ready = true;

      logger.info(`[${this.name}] ✅ ML initialized successfully`);
    } catch {
      // モデルファイルがない場合は静かにフォールバックモデルを生成
      this.mlState.initialized = false;
      this.mlState.ready = false;

      // フォールバック: 簡易モデルを生成
      await this.createFallbackModel();
    }
  }

  /**
   * フォールバックモデルの生成
   * 事前訓練モデルがない場合
   */
  private async createFallbackModel(): Promise<void> {
    try {
      const inputDim = this.getFeatureDimension();

      this.mlModel = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [inputDim],
            units: Math.ceil(inputDim * 0.7),
            activation: 'relu',
            kernelInitializer: 'glorotUniform',
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: Math.ceil(inputDim * 0.5),
            activation: 'relu',
          }),
          tf.layers.dense({
            units: this.getOutputDimension(),
            activation: 'sigmoid',
          }),
        ],
      });

      this.mlModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      });

      this.mlState.initialized = true;
      this.mlState.ready = true;
      logger.info(`[${this.name}] ✅ Fallback model created`);
    } catch (error) {
      logger.error(`[${this.name}] Failed to create fallback model`, error);
    }
  }

  /**
   * オンライン学習（リアルタイム改善）
   */
  async learn(input: AIAnalysisInput, outcome: MLLearningOutcome): Promise<void> {
    if (!this.mlEnabled || !this.mlState.ready || !this.mlModel) {
      return;
    }

    try {
      // オンライン学習の頻度を抑制（体感パフォーマンス優先）
      const now = Date.now();
      if (this.mlState.lastTrainedAt && now - this.mlState.lastTrainedAt < 15_000) {
        return;
      }

      const features = this.extractFeatures(input);
      const label = this.normalizeLabelToOutputDim(this.outcomeToLabel(outcome));
      const outputDim = this.getOutputDimension();

      if (!Array.isArray(features) || features.length !== this.getFeatureDimension()) {
        // 形が崩れている場合は学習しない（例外連打で重くなるのを防ぐ）
        return;
      }

      if (label.length !== outputDim) {
        // normalize で揃うはずだが、念のため防御
        return;
      }

      const x = tf.tensor2d([features], [1, features.length]);
      const y = tf.tensor2d([label], [1, outputDim]);

      // 1エポックのみ学習（オンライン学習）
      const history = await this.mlModel.fit(
        x,
        y,
        {
          epochs: 1,
          verbose: 0,
          shuffle: false,
        }
      );

      x.dispose();
      y.dispose();

      this.mlState.trainingCount++;
      this.mlState.lastTrainedAt = now;

      if (history.history.acc) {
        this.mlState.accuracy = history.history.acc[0] as number;
      }

      // 10回学習するごとに保存
      if (this.mlState.trainingCount % 10 === 0) {
        await this.savePersonalWeights();
        logger.debug(`[${this.name}] Weights saved (${this.mlState.trainingCount} trainings)`);
      }
    } catch (error) {
      // 形状不一致などは同じ例外が連打されやすいので、ログをレート制限
      const now = Date.now();
      const last = MLEnhancedSpecialistAI.learningErrorLastLogAt.get(this.id) ?? 0;
      if (now - last > 10_000) {
        MLEnhancedSpecialistAI.learningErrorLastLogAt.set(this.id, now);
        logger.error(`[${this.name}] Learning failed`, error);
      }
    }
  }

  /**
   * ML予測の実行
   */
  protected async predict(features: number[]): Promise<MLPrediction> {
    if (!this.mlModel) {
      throw new Error('ML model not initialized');
    }

    // Week 5: 性能計測開始
    const startTime = performance.now();

    const input = tf.tensor2d([features]);
    const prediction = this.mlModel.predict(input) as tf.Tensor;
    const values = await prediction.data();

    input.dispose();
    prediction.dispose();

    // Week 5: 性能計測終了
    const inferenceTime = performance.now() - startTime;

    // 推論が重い場合の警告（ただしスパム抑制）
    if (import.meta.env.DEV) {
      const thresholdMs = 150;
      if (inferenceTime > thresholdMs) {
        const now = Date.now();
        const last = MLEnhancedSpecialistAI.slowInferenceLastLogAt.get(this.id) ?? 0;
        if (now - last > 10_000) {
          MLEnhancedSpecialistAI.slowInferenceLastLogAt.set(this.id, now);
          console.warn(`[${this.name}] Inference slow: ${inferenceTime.toFixed(2)}ms`);
        }
      }
    }

    return {
      values: Array.from(values),
      confidence: this.calculatePredictionConfidence(Array.from(values)),
      timestamp: Date.now(),
    };
  }

  /**
   * MLが使用可能か判定
   */
  protected canUseML(input: AIAnalysisInput): boolean {
    return (
      this.mlEnabled &&
      this.mlState.ready &&
      this.mlModel !== null &&
      this.hasEnoughData(input)
    );
  }

  /**
   * 十分なデータがあるか
   */
  protected hasEnoughData(input: AIAnalysisInput): boolean {
    const progress = input.progress;
    if (!progress) return false;

    // 最低30回の試行が必要（ML推論が重いため、十分なデータがある単語に限定）
    return (progress.memorizationAttempts ?? 0) >= 30;
  }

  /**
   * 学習結果をラベルに変換
   */
  protected outcomeToLabel(outcome: MLLearningOutcome): number[] {
    // デフォルト: 「誤答っぽさ」を出力次元に合わせて展開（形状不一致で学習が壊れるのを防ぐ）
    const scalar = outcome.wasCorrect ? 0 : 1;
    return Array(this.getOutputDimension()).fill(scalar);
  }

  private normalizeLabelToOutputDim(label: number[]): number[] {
    const outputDim = this.getOutputDimension();
    if (!Array.isArray(label)) return Array(outputDim).fill(0);
    if (label.length === outputDim) return label;
    if (label.length === 1) return Array(outputDim).fill(label[0] ?? 0);
    if (label.length < outputDim) {
      return [...label, ...Array(outputDim - label.length).fill(0)];
    }
    return label.slice(0, outputDim);
  }

  /**
   * 予測の信頼度計算
   */
  protected calculatePredictionConfidence(values: Float32Array | number[]): number {
    // エントロピーベースの信頼度計算
    const entropy = Array.from(values).reduce((sum, val) => {
      if (val > 0 && val < 1) {
        return sum - (val * Math.log2(val) + (1 - val) * Math.log2(1 - val));
      }
      return sum;
    }, 0);

    // エントロピーが低いほど信頼度が高い
    return 1 - (entropy / values.length);
  }

  /**
   * 個人の重みを保存
   */
  protected async savePersonalWeights(): Promise<void> {
    if (!this.mlModel) return;

    // localStorage の容量制限により、学習重みの保存が全体を壊すことがあるため抑制
    if (MLEnhancedSpecialistAI.disablePersonalWeightsPersistence) return;

    try {
      const weights = this.mlModel.getWeights();
      const serialized = await this.serializeWeights(weights);

      const data: SerializedWeights = {
        version: '1.0',
        timestamp: Date.now(),
        weights: serialized,
        metadata: {
          trainingCount: this.mlState.trainingCount,
          accuracy: this.mlState.accuracy,
        },
      };

      const key = `ml-weights-${this.id}`;
      const json = JSON.stringify(data);

      // 1キーが大きすぎると他の保存（AdaptiveNetwork等）が QuotaExceeded で壊れる
      // 目安: 200KB を超える場合は保存しない
      if (json.length > 200_000) {
        // 既存があれば削除して空きを作る
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return;
      }

      localStorage.setItem(key, json);
    } catch (error) {
      // QuotaExceeded は全体パフォーマンス/安定性に直結するため、以後の保存を止める
      MLEnhancedSpecialistAI.disablePersonalWeightsPersistence = true;
      logger.error(`[${this.name}] Failed to save weights`, error);
    }
  }

  /**
   * 個人の重みを読み込み
   */
  protected async loadPersonalWeights(): Promise<void> {
    try {
      const saved = localStorage.getItem(`ml-weights-${this.id}`);
      if (!saved || !this.mlModel) return;

      // 大きすぎる重みは読み込むだけで重く、またlocalStorageを圧迫するので破棄
      if (saved.length > 200_000) {
        try {
          localStorage.removeItem(`ml-weights-${this.id}`);
        } catch {
          // ignore
        }
        return;
      }

      const data: SerializedWeights = JSON.parse(saved);
      const weights = await this.deserializeWeights(data.weights);

      this.mlModel.setWeights(weights);
      this.mlState.trainingCount = data.metadata.trainingCount;
      this.mlState.accuracy = data.metadata.accuracy;

      logger.info(`[${this.name}] Personal weights loaded (${data.metadata.trainingCount} trainings)`);
    } catch (error) {
      logger.warn(`[${this.name}] Failed to load personal weights`, error);
    }
  }

  /**
   * 重みのシリアライズ
   */
  protected async serializeWeights(weights: tf.Tensor[]): Promise<string> {
    const arrays = await Promise.all(
      weights.map(async w => Array.from(await w.data()))
    );
    return btoa(JSON.stringify(arrays));
  }

  /**
   * 重みのデシリアライズ
   */
  protected async deserializeWeights(serialized: string): Promise<tf.Tensor[]> {
    const arrays: number[][] = JSON.parse(atob(serialized));
    return arrays.map(arr => tf.tensor(arr));
  }

  /**
   * 特徴量の次元数
   */
  protected abstract getFeatureDimension(): number;

  /**
   * 出力の次元数
   */
  protected abstract getOutputDimension(): number;

  /**
   * シグナルの妥当性検証（既存のインターフェース）
   */
  abstract validateSignal(signal: TSignal): boolean;

  /**
   * ML機能を有効化
   */
  enableML(): void {
    this.mlEnabled = true;
    logger.info(`[${this.name}] ML enabled`);
  }

  /**
   * ML機能を無効化
   */
  disableML(): void {
    this.mlEnabled = false;
    logger.info(`[${this.name}] ML disabled`);
  }

  /**
   * MLの状態を取得
   */
  getMLState(): MLModelState {
    return { ...this.mlState };
  }

  /**
   * Week 5: メモリ使用量更新
   */
  private updateMemoryUsage(): void {
    try {
      const memInfo = tf.memory();
      const currentMB = memInfo.numBytes / (1024 * 1024);

      MLEnhancedSpecialistAI.memoryUsage.current = currentMB;
      MLEnhancedSpecialistAI.memoryUsage.peak = Math.max(
        MLEnhancedSpecialistAI.memoryUsage.peak,
        currentMB
      );
      MLEnhancedSpecialistAI.memoryUsage.lastCheck = Date.now();

      // 100MB超えで警告
      if (currentMB > 100 && import.meta.env.DEV) {
        console.warn(`[${this.name}] High memory usage: ${currentMB.toFixed(2)}MB`);
      }
    } catch (error) {
      logger.warn(`[${this.name}] Memory check failed`, error);
    }
  }

  /**
   * Week 5: メモリ使用量取得（静的メソッド）
   */
  static getMemoryUsage(): { current: number; peak: number; lastCheck: number } {
    return { ...MLEnhancedSpecialistAI.memoryUsage };
  }

  /**
   * Week 5: キャッシュクリア（静的メソッド）
   */
  static clearModelCache(): void {
    MLEnhancedSpecialistAI.modelCache.forEach((model) => {
      try {
        model.dispose();
      } catch (error) {
        logger.warn('Failed to dispose model', error);
      }
    });
    MLEnhancedSpecialistAI.modelCache.clear();
    logger.info('ML model cache cleared');
  }
}
