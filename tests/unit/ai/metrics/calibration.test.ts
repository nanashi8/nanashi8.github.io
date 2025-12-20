/**
 * Calibration Metrics Tests
 *
 * ECE/MAE計算の正確性を検証
 */

import { describe, it, expect } from 'vitest';
import {
  calculateECE,
  calculateMAE,
  analyzeCalibration,
  evaluateCalibrationQuality,
  evaluateMAEQuality,
  formatCalibrationResult,
  type Prediction,
} from '../../../../src/ai/metrics/calibration';

describe('Calibration Metrics', () => {
  describe('calculateECE', () => {
    it('完全にキャリブレーションされた予測でECE低い', () => {
      // 予測確率と実際の正解率が近い（同じビン内で）
      const predictions: Prediction[] = [
        { predicted: 0.9, actual: 1 }, // 90%ビン、100%正解 → 誤差0.1
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 1 },
        { predicted: 0.1, actual: 0 }, // 10%ビン、0%正解 → 誤差0.1
        { predicted: 0.1, actual: 0 },
        { predicted: 0.1, actual: 0 },
      ];

      const ece = calculateECE(predictions, 10);
      // 完全に0にはならないが、低い値
      expect(ece).toBeLessThan(0.15);
      expect(ece).toBeGreaterThan(0);
    });

    it('予測が過信でECE>0', () => {
      // 予測0.9だが実際は50%しか正解していない
      const predictions: Prediction[] = [
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 0 },
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 0 },
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 0 },
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 0 },
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 0 },
      ];

      const ece = calculateECE(predictions, 10);
      // 予測0.9、実際0.5、誤差0.4
      expect(ece).toBeGreaterThan(0.3);
    });

    it('空の配列でECE=0', () => {
      const ece = calculateECE([], 10);
      expect(ece).toBe(0);
    });

    it('単一の予測でも計算可能', () => {
      const predictions: Prediction[] = [{ predicted: 0.8, actual: 1 }];
      const ece = calculateECE(predictions, 10);
      expect(ece).toBeGreaterThanOrEqual(0);
      expect(ece).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateMAE', () => {
    it('完璧な予測でMAE=0', () => {
      const predictions: Prediction[] = [
        { predicted: 1.0, actual: 1 },
        { predicted: 0.0, actual: 0 },
        { predicted: 1.0, actual: 1 },
        { predicted: 0.0, actual: 0 },
      ];

      const mae = calculateMAE(predictions);
      expect(mae).toBe(0);
    });

    it('完全に逆の予測でMAE=100', () => {
      const predictions: Prediction[] = [
        { predicted: 0.0, actual: 1 },
        { predicted: 1.0, actual: 0 },
        { predicted: 0.0, actual: 1 },
        { predicted: 1.0, actual: 0 },
      ];

      const mae = calculateMAE(predictions);
      expect(mae).toBe(100);
    });

    it('50%の誤差でMAE=50', () => {
      const predictions: Prediction[] = [
        { predicted: 0.5, actual: 1 }, // 誤差0.5
        { predicted: 0.5, actual: 0 }, // 誤差0.5
      ];

      const mae = calculateMAE(predictions);
      expect(mae).toBe(50);
    });

    it('空の配列でMAE=0', () => {
      const mae = calculateMAE([]);
      expect(mae).toBe(0);
    });

    it('混合的な予測でMAEを正確に計算', () => {
      const predictions: Prediction[] = [
        { predicted: 0.8, actual: 1 }, // 誤差0.2
        { predicted: 0.3, actual: 0 }, // 誤差0.3
        { predicted: 0.6, actual: 1 }, // 誤差0.4
      ];

      // 平均誤差 = (0.2 + 0.3 + 0.4) / 3 = 0.3 = 30%
      const mae = calculateMAE(predictions);
      expect(mae).toBeCloseTo(30, 1);
    });
  });

  describe('analyzeCalibration', () => {
    it('包括的な分析を実行', () => {
      const predictions: Prediction[] = [
        { predicted: 0.9, actual: 1 },
        { predicted: 0.8, actual: 1 },
        { predicted: 0.7, actual: 0 },
        { predicted: 0.6, actual: 1 },
        { predicted: 0.5, actual: 0 },
        { predicted: 0.4, actual: 0 },
        { predicted: 0.3, actual: 0 },
        { predicted: 0.2, actual: 1 },
        { predicted: 0.1, actual: 0 },
        { predicted: 0.05, actual: 0 },
      ];

      const result = analyzeCalibration(predictions, 10);

      expect(result.count).toBe(10);
      expect(result.ece).toBeGreaterThanOrEqual(0);
      expect(result.ece).toBeLessThanOrEqual(1);
      expect(result.mae).toBeGreaterThanOrEqual(0);
      expect(result.mae).toBeLessThanOrEqual(100);
      expect(result.bins).toHaveLength(10);
      expect(result.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.overallAccuracy).toBeLessThanOrEqual(1);
      expect(result.averagePrediction).toBeGreaterThanOrEqual(0);
      expect(result.averagePrediction).toBeLessThanOrEqual(1);
    });

    it('空の配列で適切なデフォルト値を返す', () => {
      const result = analyzeCalibration([], 10);

      expect(result.count).toBe(0);
      expect(result.ece).toBe(0);
      expect(result.mae).toBe(0);
      expect(result.bins).toEqual([]);
      expect(result.overallAccuracy).toBe(0);
      expect(result.averagePrediction).toBe(0);
    });

    it('ビンの重みの合計が1になる', () => {
      const predictions: Prediction[] = Array.from({ length: 100 }, (_, i) => ({
        predicted: i / 100,
        actual: Math.random() > 0.5 ? 1 : 0,
      }));

      const result = analyzeCalibration(predictions, 10);
      const totalWeight = result.bins.reduce((sum, bin) => sum + bin.weight, 0);

      expect(totalWeight).toBeCloseTo(1, 2);
    });

    it('実際の正解率を正確に計算', () => {
      const predictions: Prediction[] = [
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 1 },
        { predicted: 0.9, actual: 0 }, // 4個中3個正解
      ];

      const result = analyzeCalibration(predictions, 10);
      expect(result.overallAccuracy).toBe(0.75); // 75%
    });
  });

  describe('evaluateCalibrationQuality', () => {
    it('ECE 5%以下でexcellent', () => {
      expect(evaluateCalibrationQuality(0.03)).toBe('excellent');
      expect(evaluateCalibrationQuality(0.05)).toBe('excellent');
    });

    it('ECE 5-10%でgood', () => {
      expect(evaluateCalibrationQuality(0.07)).toBe('good');
      expect(evaluateCalibrationQuality(0.10)).toBe('good');
    });

    it('ECE 10-15%でfair', () => {
      expect(evaluateCalibrationQuality(0.12)).toBe('fair');
      expect(evaluateCalibrationQuality(0.15)).toBe('fair');
    });

    it('ECE 15%超でpoor', () => {
      expect(evaluateCalibrationQuality(0.20)).toBe('poor');
      expect(evaluateCalibrationQuality(0.50)).toBe('poor');
    });
  });

  describe('evaluateMAEQuality', () => {
    it('MAE 10%以下でexcellent', () => {
      expect(evaluateMAEQuality(5)).toBe('excellent');
      expect(evaluateMAEQuality(10)).toBe('excellent');
    });

    it('MAE 10-20%でgood', () => {
      expect(evaluateMAEQuality(15)).toBe('good');
      expect(evaluateMAEQuality(20)).toBe('good');
    });

    it('MAE 20-30%でfair', () => {
      expect(evaluateMAEQuality(25)).toBe('fair');
      expect(evaluateMAEQuality(30)).toBe('fair');
    });

    it('MAE 30%超でpoor', () => {
      expect(evaluateMAEQuality(35)).toBe('poor');
      expect(evaluateMAEQuality(50)).toBe('poor');
    });
  });

  describe('formatCalibrationResult', () => {
    it('結果を人間が読める形式でフォーマット', () => {
      const predictions: Prediction[] = [
        { predicted: 0.9, actual: 1 },
        { predicted: 0.8, actual: 1 },
        { predicted: 0.7, actual: 0 },
        { predicted: 0.6, actual: 1 },
        { predicted: 0.5, actual: 0 },
      ];

      const result = analyzeCalibration(predictions, 10);
      const formatted = formatCalibrationResult(result);

      expect(formatted).toContain('キャリブレーション分析結果');
      expect(formatted).toContain('ECE');
      expect(formatted).toContain('MAE');
      expect(formatted).toContain('予測数');
      expect(formatted).toContain('ビン別詳細');
    });
  });

  describe('edge cases', () => {
    it('すべて同じ予測値', () => {
      const predictions: Prediction[] = Array.from({ length: 10 }, () => ({
        predicted: 0.5,
        actual: Math.random() > 0.5 ? 1 : 0,
      }));

      const result = analyzeCalibration(predictions, 10);
      expect(result.ece).toBeGreaterThanOrEqual(0);
      expect(result.mae).toBeGreaterThanOrEqual(0);
    });

    it('予測値が境界値（0, 1）', () => {
      const predictions: Prediction[] = [
        { predicted: 0.0, actual: 0 },
        { predicted: 1.0, actual: 1 },
      ];

      const result = analyzeCalibration(predictions, 10);
      expect(result.ece).toBe(0);
      expect(result.mae).toBe(0);
    });

    it('大量の予測でもパフォーマンス維持', () => {
      const predictions: Prediction[] = Array.from({ length: 10000 }, (_, i) => ({
        predicted: i / 10000,
        actual: Math.random() > 0.5 ? 1 : 0,
      }));

      const startTime = performance.now();
      const result = analyzeCalibration(predictions, 10);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
      expect(result.count).toBe(10000);
    });
  });
});
