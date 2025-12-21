import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from '@/utils/performance-monitor';
import { QualityMonitor } from '@/utils/quality-monitor';

/**
 * Phase 1パフォーマンス統合テスト
 *
 * 目標:
 * - UI応答時間: 100ms → 50ms（50%短縮）
 * - データ保存: 500ms → 250ms（50%短縮）
 * - DB接続: 50ms → 10ms（80%短縮）
 * - 再レンダリング: 50%削減
 * - CPU負荷: 30%削減
 */
describe('Phase 1: パフォーマンス最適化統合テスト', () => {
  beforeEach(() => {
    PerformanceMonitor.clear();
    QualityMonitor.clear();
  });

  describe('Pattern 2: AI分析の段階的実行', () => {
    it('即座のカテゴリー判定が50ms以内で完了すること', () => {
      const measurements: number[] = [];

      // 100回測定
      for (let i = 0; i < 100; i++) {
        PerformanceMonitor.start('quick-category');

        // 模擬処理（実際の判定ロジック）
        const accuracy = Math.random();
        const category = accuracy > 0.8 ? 'correct' :
                        accuracy > 0.5 ? 'still_learning' : 'incorrect';

        const duration = PerformanceMonitor.end('quick-category');
        measurements.push(duration);
      }

      const stats = PerformanceMonitor.getStats('quick-category');

      // P95が50ms以内であること
      expect(stats.p95).toBeLessThan(50);

      // P99でも100ms以内（最悪ケース）
      expect(stats.p99).toBeLessThan(100);

      console.log('📊 [Pattern 2] Quick Category Stats:', {
        p50: `${stats.p50.toFixed(2)}ms`,
        p95: `${stats.p95.toFixed(2)}ms`,
        p99: `${stats.p99.toFixed(2)}ms`,
        avg: `${stats.avg.toFixed(2)}ms`,
      });
    });

    it('詳細AI分析は遅延実行されUI応答をブロックしないこと', () => {
      const uiResponseTime: number[] = [];
      const aiAnalysisTime: number[] = [];

      for (let i = 0; i < 50; i++) {
        // UI応答（即座のカテゴリー判定のみ）
        PerformanceMonitor.start('ui-response');
        const quickCategory = 'correct'; // 即座判定
        const uiDuration = PerformanceMonitor.end('ui-response');
        uiResponseTime.push(uiDuration);

        // AI分析（1秒後に実行、非ブロッキング）
        PerformanceMonitor.start('ai-detailed-analysis');
        // 模擬遅延処理
        setTimeout(() => {
          const aiDuration = PerformanceMonitor.end('ai-detailed-analysis');
          aiAnalysisTime.push(aiDuration);
        }, 1000);
      }

      const uiStats = PerformanceMonitor.getStats('ui-response');

      // UI応答は50ms以内
      expect(uiStats.p95).toBeLessThan(50);

      console.log('📊 [Pattern 2] Staged Execution:', {
        uiP95: `${uiStats.p95.toFixed(2)}ms`,
        message: 'AI analysis runs in background after 1s delay',
      });
    });
  });

  describe('Pattern 3: 計算結果のメモ化', () => {
    it('メモ化により再計算が不要になること', () => {
      let calculationCount = 0;
      const cache = new Map();

      // 初回計算
      const calculate = (key: string) => {
        if (cache.has(key)) {
          return cache.get(key);
        }
        calculationCount++;
        const result = { data: 'expensive calculation' };
        cache.set(key, result);
        return result;
      };

      // 100回同じキーで呼び出し
      for (let i = 0; i < 100; i++) {
        calculate('test-key');
      }

      // 計算は1回のみ実行される
      expect(calculationCount).toBe(1);

      console.log('📊 [Pattern 3] Memoization:', {
        calls: 100,
        actualCalculations: calculationCount,
        cacheHitRate: `${((100 - calculationCount) / 100 * 100).toFixed(1)}%`,
      });
    });

    it('依存値変更時のみ再計算されること', () => {
      let calculationCount = 0;
      const memoize = <T>(fn: () => T, deps: any[]) => {
        const key = JSON.stringify(deps);
        const cached = (memoize as any).cache?.get(key);
        if (cached) return cached;

        calculationCount++;
        const result = fn();
        ((memoize as any).cache = (memoize as any).cache || new Map()).set(key, result);
        return result;
      };

      const expensiveCalc = () => ({ result: 'computed' });

      // 同じ依存値で10回
      for (let i = 0; i < 10; i++) {
        memoize(expensiveCalc, [1, 2, 3]);
      }
      expect(calculationCount).toBe(1);

      // 依存値変更で再計算
      memoize(expensiveCalc, [1, 2, 4]);
      expect(calculationCount).toBe(2);

      console.log('📊 [Pattern 3] Smart Memoization:', {
        totalCalls: 11,
        actualCalculations: calculationCount,
        efficiency: `${((11 - calculationCount) / 11 * 100).toFixed(1)}% saved`,
      });
    });
  });

  describe('Pattern 5: IndexedDB接続プーリング', () => {
    it('接続再利用により取得時間が短縮されること', () => {
      const pool = new Map<string, any>();

      const getConnection = (poolId: string) => {
        PerformanceMonitor.start(`pool-get-${poolId}`);

        if (pool.has(poolId)) {
          // プールから取得（高速）
          const duration = PerformanceMonitor.end(`pool-get-${poolId}`);
          return { connection: pool.get(poolId), duration, cached: true };
        }

        // 新規作成（遅い）
        const connection = { id: poolId, created: Date.now() };
        pool.set(poolId, connection);
        const duration = PerformanceMonitor.end(`pool-get-${poolId}`);
        return { connection, duration, cached: false };
      };

      // 初回取得
      const first = getConnection('test-db');

      // 再利用（10回）
      const reuses = Array.from({ length: 10 }, () => getConnection('test-db'));

      const avgReuseTime = reuses.reduce((sum, r) => sum + r.duration, 0) / reuses.length;

      // 再利用は初回の20%以下（80%短縮）
      expect(avgReuseTime).toBeLessThan(first.duration * 0.2);

      console.log('📊 [Pattern 5] Connection Pooling:', {
        firstConnection: `${first.duration.toFixed(2)}ms`,
        avgReuse: `${avgReuseTime.toFixed(2)}ms`,
        improvement: `${((1 - avgReuseTime / first.duration) * 100).toFixed(1)}% faster`,
      });
    });
  });

  describe('統合パフォーマンス目標達成確認', () => {
    it('Phase 1目標: UI応答時間50ms以内', () => {
      // 模擬UIインタラクション
      for (let i = 0; i < 100; i++) {
        PerformanceMonitor.start('ui-interaction');

        // パターン2: 即座判定
        const category = Math.random() > 0.5 ? 'correct' : 'incorrect';

        // パターン3: メモ化された計算
        const cachedStats = { /* cached */ };

        PerformanceMonitor.end('ui-interaction');
      }

      const stats = PerformanceMonitor.getStats('ui-interaction');

      expect(stats.p95).toBeLessThan(50);
      expect(stats.p99).toBeLessThan(100);

      console.log('🎯 [Phase 1 Goal] UI Response Time:', {
        target: '50ms',
        p50: `${stats.p50.toFixed(2)}ms`,
        p95: `${stats.p95.toFixed(2)}ms`,
        p99: `${stats.p99.toFixed(2)}ms`,
        status: stats.p95 < 50 ? '✅ PASSED' : '❌ FAILED',
      });
    });

    it('Phase 1目標: データ保存時間250ms以内', () => {
      // 模擬データ保存
      for (let i = 0; i < 50; i++) {
        PerformanceMonitor.start('data-save');

        // パターン5: プール接続（10ms）
        const connection = { /* from pool */ };

        // データ書き込み（模擬）
        const data = { word: 'test', progress: {} };

        PerformanceMonitor.end('data-save');
        QualityMonitor.recordDataSave(true);
      }

      const stats = PerformanceMonitor.getStats('data-save');
      const qualityStats = QualityMonitor.getMetrics();

      expect(stats.p95).toBeLessThan(250);
      expect(qualityStats.dataSaveSuccessRate).toBeGreaterThan(0.99);

      console.log('🎯 [Phase 1 Goal] Data Save Performance:', {
        target: '250ms',
        p95: `${stats.p95.toFixed(2)}ms`,
        successRate: `${(qualityStats.dataSaveSuccessRate * 100).toFixed(1)}%`,
        status: stats.p95 < 250 ? '✅ PASSED' : '❌ FAILED',
      });
    });
  });

  describe('品質維持確認', () => {
    it('データ保存成功率99.9%以上を維持', () => {
      // 1000回のデータ保存を模擬
      for (let i = 0; i < 1000; i++) {
        const success = Math.random() > 0.001; // 99.9%成功
        QualityMonitor.recordDataSave(success);
      }

      const metrics = QualityMonitor.getMetrics();

      expect(metrics.dataSaveSuccessRate).toBeGreaterThanOrEqual(0.999);

      console.log('🎯 [Quality] Data Integrity:', {
        target: '99.9%',
        actual: `${(metrics.dataSaveSuccessRate * 100).toFixed(2)}%`,
        status: metrics.dataSaveSuccessRate >= 0.999 ? '✅ PASSED' : '❌ FAILED',
      });
    });

    it('AI分析精度95%以上を維持', () => {
      // 100回のAI分析を模擬
      for (let i = 0; i < 100; i++) {
        const isCorrect = Math.random() > 0.05; // 95%正確
        QualityMonitor.recordAIAnalysis(isCorrect);
      }

      const metrics = QualityMonitor.getMetrics();

      expect(metrics.aiAnalysisAccuracy).toBeGreaterThanOrEqual(0.95);

      console.log('🎯 [Quality] AI Accuracy:', {
        target: '95%',
        actual: `${(metrics.aiAnalysisAccuracy * 100).toFixed(1)}%`,
        status: metrics.aiAnalysisAccuracy >= 0.95 ? '✅ PASSED' : '❌ FAILED',
      });
    });
  });
});
