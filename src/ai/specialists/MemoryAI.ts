/**
 * 🧠 MemoryAI - 記憶AI
 *
 * 責任:
 * - 記憶の定着度評価
 * - 忘却リスク計算
 * - カテゴリー判定（new/incorrect/still_learning/mastered）
 * - 時間経過による優先度ブースト
 *
 * Phase 1で実装した時間ブースト修正を統合
 */

import type {
  SpecialistAI,
  MemorySignal,
  AIAnalysisInput,
  WordCategory,
  WordProgress,
} from '../types';

export class MemoryAI implements SpecialistAI<MemorySignal> {
  readonly id = 'memory';
  readonly name = 'Memory AI';
  readonly icon = '🧠';

  /**
   * 記憶分析を実行
   */
  analyze(input: AIAnalysisInput): MemorySignal {
    const { word, progress, currentTab } = input;

    if (!progress || !progress.memorizationAttempts) {
      // 新規語句
      return this.createNewWordSignal(word);
    }

    const category = this.determineCategory(progress);
    const forgettingRisk = this.calculateForgettingRisk(progress);
    const timeBoost = this.calculateTimeBoost(progress, currentTab);
    const retentionStrength = this.calculateRetentionStrength(progress);

    return {
      aiId: 'memory',
      confidence: this.calculateConfidence(progress),
      timestamp: Date.now(),
      forgettingRisk,
      timeBoost,
      category,
      retentionStrength,
    };
  }

  /**
   * カテゴリー判定
   * Phase 1で修正したロジックを適用
   */
  private determineCategory(progress: WordProgress): WordCategory {
    const attempts = progress.memorizationAttempts || 0;
    const correct = progress.memorizationCorrect || 0;
    const stillLearning = progress.memorizationStillLearning || 0;
    const streak = progress.memorizationStreak || 0;

    if (attempts === 0) return 'new';

    // まだまだを0.5回の正解として計算
    const effectiveCorrect = correct + stillLearning * 0.5;
    const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;
    const incorrectCount = attempts - correct - stillLearning;

    // 🟢 覚えてる: 連続3回以上 OR (連続2回 AND 正答率80%以上)
    if (streak >= 3 || (streak >= 2 && accuracy >= 80)) {
      return 'mastered';
    }

    // 🔴 分からない: 連続2回不正解 OR 正答率30%未満
    if (incorrectCount >= 2 || accuracy < 30) {
      return 'incorrect';
    }

    // 🟡 まだまだ: それ以外
    return 'still_learning';
  }

  /**
   * 忘却リスク計算
   * 間隔反復学習アルゴリズムベース
   */
  private calculateForgettingRisk(progress: WordProgress): number {
    const lastStudied = progress.lastStudied || 0;
    const reviewInterval = progress.reviewInterval || 1;

    if (lastStudied === 0) return 0;

    const timeSince = Date.now() - lastStudied;
    const daysSince = timeSince / (1000 * 60 * 60 * 24);

    // 正答率を考慮
    const attempts = progress.memorizationAttempts || 0;
    const correct = progress.memorizationCorrect || 0;
    const stillLearning = progress.memorizationStillLearning || 0;
    const effectiveCorrect = correct + stillLearning * 0.5;
    const accuracy = attempts > 0 ? (effectiveCorrect / attempts) * 100 : 0;

    // 基本忘却リスク
    let risk = (daysSince / reviewInterval) * 100;

    // 正答率が低いほどリスク増加
    if (accuracy < 50) {
      risk *= 1.5;
    } else if (accuracy < 70) {
      risk *= 1.2;
    }

    return Math.min(risk, 200); // 上限200
  }

  /**
   * 時間ブースト計算
   * Phase 1で修正: 分単位に変更
   */
  private calculateTimeBoost(progress: WordProgress, currentTab: string): number {
    const lastStudied = progress.lastStudied || 0;
    if (lastStudied === 0) return 0;

    const timeSince = Date.now() - lastStudied;
    const minutesSince = timeSince / (1000 * 60);

    // 暗記タブでは分単位のブースト
    if (currentTab === 'memorization') {
      if (minutesSince >= 30) return 0.60; // 30分以上: 60%ブースト
      if (minutesSince >= 15) return 0.50; // 15分以上: 50%ブースト
      if (minutesSince >= 5) return 0.30;  // 5分以上: 30%ブースト
      if (minutesSince >= 2) return 0.15;  // 2分以上: 15%ブースト
      return 0;
    }

    // 他のタブでは日単位のブースト
    const daysSince = timeSince / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) return 0.50;   // 7日以上: 50%ブースト
    if (daysSince >= 3) return 0.30;   // 3日以上: 30%ブースト
    if (daysSince >= 1) return 0.15;   // 1日以上: 15%ブースト
    return 0;
  }

  /**
   * 記憶定着度計算 (0-1)
   */
  private calculateRetentionStrength(progress: WordProgress): number {
    const attempts = progress.memorizationAttempts || 0;
    const correct = progress.memorizationCorrect || 0;
    const stillLearning = progress.memorizationStillLearning || 0;
    const streak = progress.memorizationStreak || 0;

    if (attempts === 0) return 0;

    const effectiveCorrect = correct + stillLearning * 0.5;
    const accuracy = effectiveCorrect / attempts;

    // 連続正解回数も考慮
    const streakBonus = Math.min(streak * 0.1, 0.3);

    return Math.min(accuracy + streakBonus, 1);
  }

  /**
   * シグナルの信頼度計算
   */
  private calculateConfidence(progress: WordProgress): number {
    const attempts = progress.memorizationAttempts || 0;

    // 試行回数が多いほど信頼度が高い
    if (attempts >= 10) return 1.0;
    if (attempts >= 5) return 0.8;
    if (attempts >= 3) return 0.6;
    if (attempts >= 1) return 0.4;
    return 0.2;
  }

  /**
   * 新規語句のシグナル生成
   */
  private createNewWordSignal(_word: string): MemorySignal {
    return {
      aiId: 'memory',
      confidence: 0.1, // 新規語句は信頼度低
      timestamp: Date.now(),
      forgettingRisk: 0,
      timeBoost: 0,
      category: 'new',
      retentionStrength: 0,
    };
  }

  /**
   * シグナルの妥当性検証
   */
  validateSignal(signal: MemorySignal): boolean {
    // 必須フィールドチェック
    if (!signal.aiId || signal.aiId !== 'memory') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.forgettingRisk < 0 || signal.forgettingRisk > 200) return false;
    if (signal.timeBoost < 0 || signal.timeBoost > 1) return false;
    if (signal.retentionStrength < 0 || signal.retentionStrength > 1) return false;

    const validCategories: WordCategory[] = ['new', 'incorrect', 'still_learning', 'mastered'];
    if (!validCategories.includes(signal.category)) return false;

    return true;
  }

  /**
   * 最適な復習間隔を計算（間隔反復学習）
   */
  calculateOptimalInterval(streak: number, easinessFactor: number = 2.5): number {
    if (streak === 0) return 0;
    if (streak === 1) return 1;
    if (streak === 2) return 6;

    // SuperMemo SM-2 アルゴリズム
    const previousInterval = this.calculateOptimalInterval(streak - 1, easinessFactor);
    return Math.round(previousInterval * easinessFactor);
  }

  /**
   * 容易度因子を更新（ユーザーの解答品質に基づく）
   */
  updateEasinessFactor(
    currentEF: number,
    quality: number // 0-5: 0=完全に忘れた, 5=完璧に覚えている
  ): number {
    // SuperMemo SM-2 の容易度因子更新式
    const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // EFの最小値は1.3
    return Math.max(newEF, 1.3);
  }
}
