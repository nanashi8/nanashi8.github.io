/**
 * 学習品質測定ユーティリティ
 * データ保存成功率、AI分析精度などを自動測定
 */

export interface QualityEvent {
  type: 'data-save' | 'ai-analysis' | 'category-determination' | 'priority-calculation';
  success?: boolean;
  duration?: number;
  category?: string;
  confidence?: number;
  actualResult?: string;
  errorMessage?: string;
  timestamp: number;
}

export interface QualityMetrics {
  dataSave: {
    totalAttempts: number;
    successRate: number;
    avgDuration: number;
    errorRate: number;
  };
  aiAnalysis: {
    totalAnalyses: number;
    avgConfidence: number;
    accuracy: number;
    lowConfidenceRate: number;
  };
  categoryDetermination: {
    total: number;
    avgConfidence: number;
    accuracy: number;
  };
  priorityCalculation: {
    total: number;
    avgDuration: number;
  };
}

export class QualityMonitor {
  private static events: QualityEvent[] = [];
  private static maxEvents = 1000; // 最大保持イベント数
  private static enabled = import.meta.env.DEV || import.meta.env.MODE === 'quality-test';

  /**
   * データ保存イベントを記録
   */
  static recordDataSave(success: boolean, duration: number, errorMessage?: string): void {
    if (!this.enabled) return;

    this.addEvent({
      type: 'data-save',
      success,
      duration,
      errorMessage,
      timestamp: Date.now(),
    });
  }

  /**
   * AI分析イベントを記録
   */
  static recordAIAnalysis(
    category: string,
    confidence: number,
    actualResult?: string,
    errorMessage?: string
  ): void {
    if (!this.enabled) return;

    this.addEvent({
      type: 'ai-analysis',
      category,
      confidence,
      actualResult,
      errorMessage,
      timestamp: Date.now(),
    });
  }

  /**
   * カテゴリー判定イベントを記録
   */
  static recordCategoryDetermination(
    category: string,
    confidence: number,
    duration: number,
    actualResult?: string
  ): void {
    if (!this.enabled) return;

    this.addEvent({
      type: 'category-determination',
      category,
      confidence,
      duration,
      actualResult,
      timestamp: Date.now(),
    });
  }

  /**
   * 優先度計算イベントを記録
   */
  static recordPriorityCalculation(duration: number, success: boolean = true): void {
    if (!this.enabled) return;

    this.addEvent({
      type: 'priority-calculation',
      duration,
      success,
      timestamp: Date.now(),
    });
  }

  /**
   * イベントを追加（古いイベントを自動削除）
   */
  private static addEvent(event: QualityEvent): void {
    this.events.push(event);

    // 最大数を超えたら古いイベントを削除
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * 品質メトリクスを取得
   */
  static getMetrics(): QualityMetrics {
    const saves = this.events.filter((e) => e.type === 'data-save');
    const analyses = this.events.filter((e) => e.type === 'ai-analysis');
    const categories = this.events.filter((e) => e.type === 'category-determination');
    const priorities = this.events.filter((e) => e.type === 'priority-calculation');

    return {
      dataSave: {
        totalAttempts: saves.length,
        successRate: saves.length > 0 ? saves.filter((e) => e.success).length / saves.length : 0,
        avgDuration:
          saves.length > 0
            ? saves.reduce((a, b) => a + (b.duration || 0), 0) / saves.length
            : 0,
        errorRate: saves.length > 0 ? saves.filter((e) => !e.success).length / saves.length : 0,
      },
      aiAnalysis: {
        totalAnalyses: analyses.length,
        avgConfidence:
          analyses.length > 0
            ? analyses.reduce((a, b) => a + (b.confidence || 0), 0) / analyses.length
            : 0,
        accuracy:
          analyses.filter((e) => e.actualResult).length > 0
            ? analyses.filter((e) => e.actualResult && e.category === e.actualResult).length /
              analyses.filter((e) => e.actualResult).length
            : 0,
        lowConfidenceRate:
          analyses.length > 0
            ? analyses.filter((e) => (e.confidence || 0) < 0.7).length / analyses.length
            : 0,
      },
      categoryDetermination: {
        total: categories.length,
        avgConfidence:
          categories.length > 0
            ? categories.reduce((a, b) => a + (b.confidence || 0), 0) / categories.length
            : 0,
        accuracy:
          categories.filter((e) => e.actualResult).length > 0
            ? categories.filter((e) => e.actualResult && e.category === e.actualResult).length /
              categories.filter((e) => e.actualResult).length
            : 0,
      },
      priorityCalculation: {
        total: priorities.length,
        avgDuration:
          priorities.length > 0
            ? priorities.reduce((a, b) => a + (b.duration || 0), 0) / priorities.length
            : 0,
      },
    };
  }

  /**
   * 品質レポートをコンソールに表示
   */
  static report(): void {
    if (!this.enabled) return;

    const metrics = this.getMetrics();

    console.group('📈 Quality Report');

    console.group('💾 Data Save');
    console.log(`Total Attempts: ${metrics.dataSave.totalAttempts}`);
    console.log(`Success Rate: ${(metrics.dataSave.successRate * 100).toFixed(2)}%`);
    console.log(`Avg Duration: ${metrics.dataSave.avgDuration.toFixed(2)}ms`);
    console.log(`Error Rate: ${(metrics.dataSave.errorRate * 100).toFixed(2)}%`);
    console.groupEnd();

    console.group('🤖 AI Analysis');
    console.log(`Total Analyses: ${metrics.aiAnalysis.totalAnalyses}`);
    console.log(`Avg Confidence: ${(metrics.aiAnalysis.avgConfidence * 100).toFixed(2)}%`);
    console.log(`Accuracy: ${(metrics.aiAnalysis.accuracy * 100).toFixed(2)}%`);
    console.log(
      `Low Confidence Rate: ${(metrics.aiAnalysis.lowConfidenceRate * 100).toFixed(2)}%`
    );
    console.groupEnd();

    console.group('🏷️ Category Determination');
    console.log(`Total: ${metrics.categoryDetermination.total}`);
    console.log(
      `Avg Confidence: ${(metrics.categoryDetermination.avgConfidence * 100).toFixed(2)}%`
    );
    console.log(`Accuracy: ${(metrics.categoryDetermination.accuracy * 100).toFixed(2)}%`);
    console.groupEnd();

    console.group('⚖️ Priority Calculation');
    console.log(`Total: ${metrics.priorityCalculation.total}`);
    console.log(`Avg Duration: ${metrics.priorityCalculation.avgDuration.toFixed(2)}ms`);
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * JSON形式でエクスポート
   */
  static export(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        events: this.events,
        metrics: this.getMetrics(),
      },
      null,
      2
    );
  }

  /**
   * LocalStorageに保存
   */
  static saveToStorage(): void {
    try {
      localStorage.setItem('quality-monitor-data', this.export());
      console.log('✅ Quality data saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save quality data:', error);
    }
  }

  /**
   * LocalStorageから読み込み
   */
  static loadFromStorage(): void {
    try {
      const data = localStorage.getItem('quality-monitor-data');
      if (data) {
        const parsed = JSON.parse(data);
        this.events = parsed.events || [];
        console.log(`✅ Loaded ${this.events.length} quality events from localStorage`);
      }
    } catch (error) {
      console.error('❌ Failed to load quality data:', error);
    }
  }

  /**
   * データをクリア
   */
  static clear(): void {
    this.events = [];
    localStorage.removeItem('quality-monitor-data');
  }

  /**
   * 品質アラート（しきい値を下回った場合）
   */
  static checkThresholds(): void {
    if (!this.enabled) return;

    const metrics = this.getMetrics();

    // データ保存成功率が99%未満
    if (metrics.dataSave.successRate < 0.99 && metrics.dataSave.totalAttempts >= 10) {
      console.warn(
        `⚠️ [QualityMonitor] Data save success rate is low: ${(metrics.dataSave.successRate * 100).toFixed(2)}%`
      );
    }

    // AI分析精度が90%未満
    if (metrics.aiAnalysis.accuracy < 0.9 && metrics.aiAnalysis.totalAnalyses >= 20) {
      console.warn(
        `⚠️ [QualityMonitor] AI analysis accuracy is low: ${(metrics.aiAnalysis.accuracy * 100).toFixed(2)}%`
      );
    }

    // 低信頼度の分析が30%以上
    if (
      metrics.aiAnalysis.lowConfidenceRate > 0.3 &&
      metrics.aiAnalysis.totalAnalyses >= 10
    ) {
      console.warn(
        `⚠️ [QualityMonitor] High rate of low-confidence analyses: ${(metrics.aiAnalysis.lowConfidenceRate * 100).toFixed(2)}%`
      );
    }
  }

  /**
   * 定期的なチェックを開始
   */
  static startPeriodicCheck(intervalMs: number = 60000): NodeJS.Timeout | number {
    return setInterval(() => {
      this.checkThresholds();
    }, intervalMs);
  }
}

// 開発時は自動的にLocalStorageから読み込み
if (QualityMonitor['enabled']) {
  QualityMonitor.loadFromStorage();

  // ページを閉じる前に保存
  window.addEventListener('beforeunload', () => {
    QualityMonitor.saveToStorage();
  });

  // 1分ごとにしきい値チェック
  QualityMonitor.startPeriodicCheck(60000);
}
