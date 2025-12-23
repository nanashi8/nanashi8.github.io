/**
 * ML機能の型定義
 */

import type { BaseAISignal, AIAnalysisInput } from '../types';

/**
 * ML予測結果
 */
export interface MLPrediction {
  values: number[];
  confidence: number;
  timestamp: number;
}

/**
 * ML訓練設定
 */
export interface MLTrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
}

/**
 * ML学習結果
 */
export interface MLLearningOutcome {
  wasCorrect: boolean;
  responseTime: number;
  timestamp: number;
  features: number[];
}

/**
 * MLモデルの状態
 */
export interface MLModelState {
  initialized: boolean;
  ready: boolean;
  trainingCount: number;
  lastTrainedAt: number | null;
  accuracy: number | null;
}

/**
 * 特徴量抽出インターフェース
 */
export interface FeatureExtractor {
  extract(input: AIAnalysisInput): number[];
  getFeatureCount(): number;
}

/**
 * シグナルマージ戦略
 */
export interface SignalMergeStrategy<TSignal extends BaseAISignal> {
  merge(ruleSignal: TSignal, mlSignal: TSignal, mlWeight: number): TSignal;
}

/**
 * MLモデルの重み保存データ
 */
export interface SerializedWeights {
  version: string;
  timestamp: number;
  weights: string; // Base64エンコード
  metadata: {
    trainingCount: number;
    accuracy: number | null;
  };
}
