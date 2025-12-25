/**
 * パフォーマンス測定ユーティリティ
 * UI応答時間、データ保存時間、AI分析時間などを自動測定
 */

export interface PerformanceStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();
  private static enabled = import.meta.env.DEV || import.meta.env.MODE === 'performance-test';

  /**
   * 測定開始
   */
  static start(label: string): void {
    if (!this.enabled) return;
    performance.mark(`${label}-start`);
  }

  /**
   * 測定終了して結果を記録
   */
  static end(label: string): number {
    if (!this.enabled) return 0;

    try {
      // startマークが存在するか確認
      const startMarks = performance.getEntriesByName(`${label}-start`, 'mark');
      if (startMarks.length === 0) {
        // startが呼ばれていない場合は静かに無視
        return 0;
      }

      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      const entries = performance.getEntriesByName(label);
      const measure = entries[entries.length - 1] as PerformanceMeasure;
      const duration = measure?.duration || 0;

      // 記録
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      this.measurements.get(label)!.push(duration);

      // 古いマークをクリーンアップ
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);

      return duration;
    } catch {
      // 静かに失敗（開発用機能のためエラーログを出さない）
      return 0;
    }
  }

  /**
   * 統計情報を取得
   */
  static getStats(label: string): PerformanceStats | null {
    const values = this.measurements.get(label);
    if (!values || values.length === 0) return null;

    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: this.percentile(values, 0.50),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99),
    };
  }

  /**
   * パーセンタイル計算
   */
  private static percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * 全測定結果をコンソールに表示
   */
  static report(): void {
    if (!this.enabled) return;

    const data = Array.from(this.measurements.keys())
      .map((label) => {
        const stats = this.getStats(label);
        if (!stats) return null;

        return {
          label,
          count: stats.count,
          avg: `${stats.avg.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          p50: `${stats.p50.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          p99: `${stats.p99.toFixed(2)}ms`,
        };
      })
      .filter(Boolean);

    console.group('📊 Performance Report');
    console.table(data);
    console.groupEnd();
  }

  /**
   * JSON形式でエクスポート
   */
  static export(): string {
    const data = Array.from(this.measurements.keys()).reduce(
      (acc, label) => {
        const stats = this.getStats(label);
        if (stats) {
          acc[label] = stats;
        }
        return acc;
      },
      {} as Record<string, PerformanceStats>
    );

    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        measurements: data,
      },
      null,
      2
    );
  }

  /**
   * 測定データをクリア
   */
  static clear(): void {
    this.measurements.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * 特定のラベルの測定データをクリア
   */
  static clearLabel(label: string): void {
    this.measurements.delete(label);
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
  }

  /**
   * しきい値を超えた場合に警告
   */
  static warnIfSlow(label: string, duration: number, threshold: number): void {
    if (!this.enabled) return;

    if (duration > threshold) {
      console.warn(
        `⚠️ [PerformanceMonitor] ${label} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
  }

  /**
   * 統計付きでログ出力
   */
  static logWithStats(label: string, duration: number): void {
    if (!this.enabled) return;

    const stats = this.getStats(label);
    if (stats && stats.count >= 5) {
      console.log(
        `⏱️ ${label}: ${duration.toFixed(2)}ms (avg: ${stats.avg.toFixed(2)}ms, p95: ${stats.p95.toFixed(2)}ms)`
      );
    } else {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * デコレーター風の測定ヘルパー
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  threshold?: number
): Promise<T> {
  PerformanceMonitor.start(label);
  try {
    const result = await fn();
    const duration = PerformanceMonitor.end(label);

    if (threshold) {
      PerformanceMonitor.warnIfSlow(label, duration, threshold);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end(label);
    throw error;
  }
}

/**
 * 同期関数の測定ヘルパー
 */
export function measureSync<T>(label: string, fn: () => T, threshold?: number): T {
  PerformanceMonitor.start(label);
  try {
    const result = fn();
    const duration = PerformanceMonitor.end(label);

    if (threshold) {
      PerformanceMonitor.warnIfSlow(label, duration, threshold);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.end(label);
    throw error;
  }
}

/**
 * React Hook 用の測定ヘルパー
 */
export function usePerformanceMeasure(componentName: string) {
  if (!PerformanceMonitor['enabled']) return { measure: () => {} };

  return {
    measure: (label: string) => {
      const fullLabel = `${componentName}.${label}`;
      return {
        start: () => PerformanceMonitor.start(fullLabel),
        end: () => PerformanceMonitor.end(fullLabel),
      };
    },
  };
}
