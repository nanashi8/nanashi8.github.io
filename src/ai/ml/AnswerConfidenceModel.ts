import * as tf from '@tensorflow/tfjs';

export type AnswerConfidenceModelPrediction = {
  pCorrect: number; // 0-1
};

const STORAGE_KEY = 'ml-answer-confidence-v1';
const MAX_STORAGE_CHARS = 120_000; // localStorage安全側（他の保存を壊さない）

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

type PersistedWeights = {
  version: 1;
  savedAt: number;
  specs: tf.io.WeightsManifestEntry[];
  dataB64: string;
  meta: {
    trainCount: number;
  };
};

export class AnswerConfidenceModel {
  private model: tf.LayersModel | null = null;
  private inputDim: number;
  private trainCount = 0;
  private loading: Promise<void> | null = null;

  constructor(inputDim: number) {
    this.inputDim = inputDim;
  }

  async ensureInitialized(): Promise<void> {
    if (this.model) return;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      // 1) 構築
      const model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [this.inputDim],
            units: 16,
            activation: 'relu',
            kernelInitializer: 'glorotUniform',
          }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' }),
        ],
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      });

      this.model = model;

      // 2) 可能なら復元
      await this.loadFromLocalStorage();
    })();

    await this.loading;
  }

  predict(features: number[]): AnswerConfidenceModelPrediction {
    if (!this.model) {
      // 初回は呼び出し側で ensureInitialized をawaitする想定だが、
      // ここは防御的に「中立」を返す。
      return { pCorrect: 0.5 };
    }

    if (!Array.isArray(features) || features.length !== this.inputDim) {
      return { pCorrect: 0.5 };
    }

    const x = tf.tensor2d([features], [1, this.inputDim]);
    const y = this.model.predict(x) as tf.Tensor;
    const value = y.dataSync()[0] ?? 0.5;
    x.dispose();
    y.dispose();

    return { pCorrect: clamp01(value) };
  }

  async learn(features: number[], wasCorrect: boolean): Promise<void> {
    if (!this.model) return;
    if (!Array.isArray(features) || features.length !== this.inputDim) return;

    const x = tf.tensor2d([features], [1, this.inputDim]);
    const y = tf.tensor2d([[wasCorrect ? 1 : 0]], [1, 1]);

    try {
      await this.model.fit(x, y, {
        epochs: 1,
        batchSize: 1,
        shuffle: false,
        verbose: 0,
      });

      this.trainCount += 1;

      // 学習10回ごとに保存（容量を守りつつ）
      if (this.trainCount % 10 === 0) {
        await this.saveToLocalStorage();
      }
    } catch {
      // 学習失敗は無視（UX優先）
    } finally {
      x.dispose();
      y.dispose();
    }
  }

  private async saveToLocalStorage(): Promise<void> {
    if (!this.model) return;
    if (typeof localStorage === 'undefined') return;

    try {
      const weights = this.model.getWeights();
      const named = weights.map((tensor, index) => ({ name: `w${index}`, tensor }));
      const { data, specs } = await tf.io.encodeWeights(named);

      const payload: PersistedWeights = {
        version: 1,
        savedAt: Date.now(),
        specs,
        dataB64: toBase64(data),
        meta: { trainCount: this.trainCount },
      };

      const json = JSON.stringify(payload);
      if (json.length > MAX_STORAGE_CHARS) {
        // 大きすぎる場合は保存しない（他の保存を壊さない）
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        return;
      }

      localStorage.setItem(STORAGE_KEY, json);
    } catch {
      // QuotaExceeded などは無視
    }
  }

  private async loadFromLocalStorage(): Promise<void> {
    if (!this.model) return;
    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PersistedWeights;
      if (!parsed || parsed.version !== 1) return;
      if (!Array.isArray(parsed.specs) || typeof parsed.dataB64 !== 'string') return;

      const data = fromBase64(parsed.dataB64);
      const tensors = await tf.io.decodeWeights(data, parsed.specs);

      // w0..wn の順で復元
      const current = this.model.getWeights();
      const ordered = current.map((_, index) => tensors[`w${index}`]).filter(Boolean) as tf.Tensor[];

      if (ordered.length === current.length) {
        this.model.setWeights(ordered);
        this.trainCount = parsed.meta?.trainCount ?? this.trainCount;
      }

      // decodeWeightsが返したテンソルのうち未使用があっても放置でOK（GC対象）
    } catch {
      // 壊れたデータは破棄
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }
}

let singleton: AnswerConfidenceModel | null = null;

/**
 * 単一インスタンスを返す（モデル初期化は呼び出し側でawait）
 */
export function getAnswerConfidenceModel(inputDim: number): AnswerConfidenceModel {
  if (!singleton) singleton = new AnswerConfidenceModel(inputDim);
  return singleton;
}
