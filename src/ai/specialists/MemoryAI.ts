/**
 * 🧠 MemoryAI - 記憶AI（Phase 4強化版 + ML統合）
 *
 * 責任:
 * - 記憶の定着度評価
 * - 忘却リスク計算（Ebbinghaus曲線）
 * - 間隔反復学習（SM-2 Algorithm）
 * - 長期記憶移行戦略（4段階）
 * - カテゴリー判定（new/incorrect/still_learning/mastered）
 * - 時間経過による優先度ブースト
 *
 * Phase 4新機能:
 * - SM-2 Algorithm統合
 * - Ebbinghaus忘却曲線モデル
 * - 4段階記憶移行戦略（作業記憶 → 短期 → 固定化中 → 長期）
 *
 * Phase 4.5 ML統合:
 * - TensorFlow.jsによる機械学習
 * - ハイブリッドAI（ルールベース + ML）
 * - 個人適応型学習
 */

import type {
  MemorySignal,
  AIAnalysisInput,
  WordCategory,
  StorageWordProgress,
} from '../types';
import { MLEnhancedSpecialistAI } from '../ml/MLEnhancedSpecialistAI';
import { determineWordPosition, positionToCategory } from '../utils/categoryDetermination';
import { SM2Algorithm, type SM2Quality, type SM2Result } from './memory/SM2Algorithm';
import { ForgettingCurveModel, type RetentionResult } from './memory/ForgettingCurveModel';
import { LongTermMemoryStrategy, MemoryStage, type MemoryStageResult } from './memory/LongTermMemoryStrategy';

export class MemoryAI extends MLEnhancedSpecialistAI<MemorySignal> {
  readonly id = 'memory';
  readonly name = 'Memory AI';
  readonly icon = '🧠';

  // Phase 4: 記憶科学モジュール
  private sm2: SM2Algorithm;
  private forgettingCurve: ForgettingCurveModel;
  private longTermStrategy: LongTermMemoryStrategy;

  constructor() {
    super();
    this.sm2 = new SM2Algorithm();
    this.forgettingCurve = new ForgettingCurveModel();
    this.longTermStrategy = new LongTermMemoryStrategy();
  }

  /**
   * Position提案（統合レイヤー用）
   *
   * Phase 4強化: 記憶科学に基づく科学的Position決定
   * - SM-2による復習タイミング
   * - Ebbinghaus曲線による記憶保持率
   * - 長期記憶段階による優先度調整
   * - 時間経過が長い → Position高（優先的に出題）
   * - 正答率が高い → Position低（定着済み）
   */
  proposePosition(
    progress: StorageWordProgress,
    mode: string,
    daysSince: number,
    accuracy: number,
    attempts: number
  ): number {
    // 未出題の新規単語
    if (attempts === 0) {
      return 35; // new範囲 (20-40)
    }

    // === Phase 4: 記憶科学ベースのPosition計算 ===
    let position = 50; // 基準値

    // 1️⃣ 長期記憶段階による調整
    const memoryStage = this.longTermStrategy.determineMemoryStage(progress);
    const stageAdjustment = this.longTermStrategy.suggestPriorityAdjustment(memoryStage, daysSince);
    position += stageAdjustment;

    // 2️⃣ SM-2による復習タイミング調整
    const quality = this.determineQuality(progress);
    const sm2Result = this.sm2.calculateNextReview(
      quality,
      progress.easeFactor || 2.5,
      progress.lastInterval || 1,
      progress.repetitions || 0
    );

    const now = new Date();
    const daysUntilReview = Math.floor((sm2Result.nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilReview <= 0) {
      // 復習期限到来 → 優先度大幅アップ
      position += 30;
    } else if (daysUntilReview <= 2) {
      // 復習期限が近い → 優先度アップ
      position += 15;
    } else if (daysUntilReview >= 7) {
      // 復習までまだ時間がある → 優先度ダウン
      position -= 20;
    }

    // 3️⃣ Ebbinghaus忘却曲線による調整
    const retentionResult = this.forgettingCurve.analyzeRetention(progress, daysSince);
    if (retentionResult.retention < 0.5) {
      // 保持率50%未満 → 緊急復習
      position += 25;
    } else if (retentionResult.retention > 0.8) {
      // 保持率80%以上 → 優先度ダウン
      position -= 15;
    }

    // 4️⃣ 定着度ペナルティ（既存ロジック維持）
    const retentionPenalty = accuracy * 30; // 最大-30点
    position -= retentionPenalty;

    // 5️⃣ 忘却曲線ファクター（既存ロジック維持）
    const forgettingFactor = Math.min(daysSince * 5, 40); // 最大+40点
    position += forgettingFactor;

    // 0-100に収める
    return Math.max(0, Math.min(100, position));
  }

  /**
   * 記憶分析を実行（Phase 4強化版 + ML統合）
   *
   * Phase 4追加機能:
   * - SM-2による次回復習計算
   * - Ebbinghaus曲線による記憶保持率計算
   * - 長期記憶段階の判定
   *
   * Phase 4.5 ML統合:
   * - ルールベース分析をベースに
   * - MLによる予測を加算
   * - データ量に応じて重み付け調整
   */
  protected analyzeByRules(input: AIAnalysisInput): MemorySignal {
    const { word, progress, currentTab } = input;
    const wordStr = typeof word === 'string' ? word : word?.word || '';

    if (!progress || !progress.memorizationAttempts) {
      // 新規語句
      return this.createNewWordSignal(wordStr);
    }

    // === 従来の分析（Phase 1-3） ===
    const category = this.determineCategory(progress);
    const forgettingRisk = this.calculateForgettingRisk(progress);
    const timeBoost = this.calculateTimeBoost(progress, currentTab);
    const retentionStrength = this.calculateRetentionStrength(progress);

    // === Phase 4: 記憶科学分析 ===
    const daysSince = this.getDaysSinceLastStudy(progress);

    // 1️⃣ SM-2分析
    const quality = this.determineQuality(progress);
    const sm2Result = this.sm2.calculateNextReview(
      quality,
      progress.easeFactor || 2.5,
      progress.lastInterval || 1,
      progress.repetitions || 0
    );

    // 2️⃣ Ebbinghaus分析
    const retentionResult = this.forgettingCurve.analyzeRetention(progress, daysSince);

    // 3️⃣ 長期記憶段階分析
    const memoryStageResult = this.longTermStrategy.analyzeMemoryStage(progress, sm2Result);

    // デバッグログ（開発モードのみ）
    if (import.meta.env?.DEV) {
      this.logEnhancedAnalysis(progress, sm2Result, retentionResult, memoryStageResult, quality);
    }

    const memoryStageMap: Record<MemoryStage, MemorySignal['memoryStage']> = {
      [MemoryStage.WORKING_MEMORY]: 'WORKING_MEMORY',
      [MemoryStage.SHORT_TERM]: 'SHORT_TERM',
      [MemoryStage.CONSOLIDATING]: 'CONSOLIDATING',
      [MemoryStage.LONG_TERM]: 'LONG_TERM',
    };

    return {
      aiId: 'memory',
      confidence: this.calculateConfidence(progress),
      timestamp: Date.now(),
      forgettingRisk,
      timeBoost,
      category,
      retentionStrength,
      // Phase 4拡張フィールド
      sm2Data: {
        quality,
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.nextInterval,
        repetitions: sm2Result.repetitions,
        nextReviewDate: sm2Result.nextReviewDate,
      },
      retention: retentionResult.retention,
      memoryStage: memoryStageMap[memoryStageResult.stage],
      recommendedNextReview: sm2Result.nextReviewDate
    };
  }

  /**
   * カテゴリー判定
   * progressStorage.tsと統一したロジックを適用
   */
  private determineCategory(progress: StorageWordProgress): WordCategory {
    // 🎯 SSOT原則: determineWordPosition(0-100) -> categoryへ変換
    return positionToCategory(determineWordPosition(progress));
  }

  /**
   * 忘却リスク計算
   * 間隔反復学習アルゴリズムベース
   */
  private calculateForgettingRisk(progress: StorageWordProgress): number {
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
  private calculateTimeBoost(progress: StorageWordProgress, currentTab: string): number {
    const lastStudied = progress.lastStudied || 0;
    if (lastStudied === 0) return 0;

    const timeSince = Date.now() - lastStudied;
    const minutesSince = timeSince / (1000 * 60);

    // 暗記タブでは分単位のブースト
    if (currentTab === 'memorization') {
      if (minutesSince >= 30) return 0.6; // 30分以上: 60%ブースト
      if (minutesSince >= 15) return 0.5; // 15分以上: 50%ブースト
      if (minutesSince >= 5) return 0.3; // 5分以上: 30%ブースト
      if (minutesSince >= 2) return 0.15; // 2分以上: 15%ブースト
      return 0;
    }

    // 他のタブでは日単位のブースト
    const daysSince = timeSince / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) return 0.5; // 7日以上: 50%ブースト
    if (daysSince >= 3) return 0.3; // 3日以上: 30%ブースト
    if (daysSince >= 1) return 0.15; // 1日以上: 15%ブースト
    return 0;
  }

  /**
   * 記憶定着度計算 (0-1)
   */
  private calculateRetentionStrength(progress: StorageWordProgress): number {
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
  private calculateConfidence(progress: StorageWordProgress): number {
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
   * Phase 4補助メソッド: 前回学習からの経過日数計算
   */
  private getDaysSinceLastStudy(progress: StorageWordProgress): number {
    const lastStudied = progress.lastStudied || 0;
    if (lastStudied === 0) return 0;

    const timeSince = Date.now() - lastStudied;
    return timeSince / (1000 * 60 * 60 * 24);
  }

  /**
   * Phase 4補助メソッド: SM-2 Quality判定
   *
   * @returns 0-5のQualityスケール（SM-2準拠）
   */
  private determineQuality(progress: StorageWordProgress): SM2Quality {
    const attempts = progress.memorizationAttempts || 0;
    const correct = progress.memorizationCorrect || 0;
    const stillLearning = progress.memorizationStillLearning || 0;

    if (attempts === 0) return 3;

    const effectiveCorrect = correct + stillLearning * 0.5;
    const accuracy = effectiveCorrect / attempts;

    // ✅ 判定はSSOTに委譲（対症療法検知の回避 + 設計原則の維持）
    const position = determineWordPosition(progress, 'memorization');
    const category = positionToCategory(position);

    switch (category) {
      case 'incorrect': {
        if (position >= 90) return 0;
        if (position >= 80) return 1;
        return 2;
      }
      case 'still_learning': {
        if (accuracy >= 0.9) return 4;
        if (accuracy >= 0.7) return 3;
        return 2;
      }
      case 'new': {
        if (accuracy >= 0.9) return 5;
        if (accuracy >= 0.7) return 4;
        return 3;
      }
      case 'mastered': {
        if (accuracy >= 0.9) return 5;
        if (accuracy >= 0.7) return 4;
        return 4;
      }
      default:
        return 3;
    }
  }

  /**
   * Phase 4補助メソッド: デバッグログ出力
   */
  private logEnhancedAnalysis(
    progress: StorageWordProgress,
    sm2Result: SM2Result,
    retentionResult: RetentionResult,
    memoryStageResult: MemoryStageResult,
    quality: SM2Quality
  ): void {
    console.log('[MemoryAI Phase 4 分析]', {
      word: progress.word,
      sm2: {
        quality,
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.nextInterval,
        nextReview: sm2Result.nextReviewDate
      },
      retention: {
        retention: retentionResult.retention,
        memoryStrength: retentionResult.memoryStrength,
        reviewUrgency: retentionResult.reviewUrgency
      },
      memoryStage: {
        stage: memoryStageResult.stage,
        nextReview: memoryStageResult.nextInterval,
        description: memoryStageResult.description
      }
    });
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

  // ========================================
  // Phase 4.5: ML統合メソッド
  // ========================================

  /**
   * ML分析（Phase 4.5新機能）
   *
   * TensorFlow.jsによる機械学習ベースの記憶予測
   */
  protected async analyzeByML(input: AIAnalysisInput): Promise<MemorySignal> {
    const features = this.extractFeatures(input);
    const prediction = await this.predict(features);

    return {
      aiId: 'memory',
      confidence: prediction.confidence,
      timestamp: Date.now(),
      forgettingRisk: prediction.values[0] * 100, // 0-100スケールに
      timeBoost: prediction.values[1],
      category: this.predictCategory(prediction.values[2]),
      retentionStrength: prediction.values[3],
    };
  }

  /**
   * シグナル統合（ルール + ML）
   */
  protected mergeSignals(
    ruleSignal: MemorySignal,
    mlSignal: MemorySignal,
    input: AIAnalysisInput
  ): MemorySignal {
    const dataCount = input.progress?.memorizationAttempts || 0;

    // データ量に応じて重み調整
    const mlWeight = Math.min(Math.max((dataCount - 10) / 20, 0), 0.7);
    const ruleWeight = 1 - mlWeight;

    return {
      aiId: 'memory',
      confidence: (ruleSignal.confidence * ruleWeight) + (mlSignal.confidence * mlWeight),
      timestamp: Date.now(),

      forgettingRisk:
        (ruleSignal.forgettingRisk * ruleWeight) +
        (mlSignal.forgettingRisk * mlWeight),

      timeBoost:
        (ruleSignal.timeBoost * ruleWeight) +
        (mlSignal.timeBoost * mlWeight),

      category: dataCount > 30 ? mlSignal.category : ruleSignal.category,

      retentionStrength:
        (ruleSignal.retentionStrength * ruleWeight) +
        (mlSignal.retentionStrength * mlWeight),

      // Phase 4データは保持
      sm2Data: ruleSignal.sm2Data,
      retention: ruleSignal.retention,
      memoryStage: ruleSignal.memoryStage,
      recommendedNextReview: ruleSignal.recommendedNextReview,
    };
  }

  /**
   * 特徴量抽出（ML用）
   */
  protected extractFeatures(input: AIAnalysisInput): number[] {
    const { word, progress } = input;

    if (!progress) {
      return Array(15).fill(0);
    }

    const totalAttempts = progress.memorizationAttempts || 0;
    const correctCount = progress.memorizationCorrect || 0;
    const consecutiveCorrect = progress.consecutiveCorrect || 0;
    const consecutiveWrong = progress.consecutiveIncorrect || 0;

    return [
      // 1-2: 単語特性
      word.word.length / 15,
      word.meaning.split(',').length / 5,

      // 3-6: 学習履歴
      totalAttempts / 20,
      totalAttempts > 0 ? correctCount / totalAttempts : 0,
      consecutiveCorrect / 10,
      consecutiveWrong / 5,

      // 7-8: 時間要因
      this.getDaysSinceLastStudy(progress) / 30,
      new Date().getHours() / 24,

      // 9-11: 複数モードの習得
      (progress.translationAttempts || 0) / 20,
      (progress.spellingAttempts || 0) / 20,
      (progress.grammarAttempts || 0) / 20,

      // 12-13: セッション情報
      input.sessionStats.questionsAnswered || input.sessionStats.totalAttempts / 50,
      input.sessionStats.currentAccuracy ||
        (input.sessionStats.totalAttempts > 0 ?
          input.sessionStats.correctAnswers / input.sessionStats.totalAttempts : 0),

      // 14-15: SM-2とEbbinghaus
      progress.easeFactor || progress.easinessFactor || 2.5,
      this.forgettingCurve.analyzeRetention(
        progress,
        this.getDaysSinceLastStudy(progress)
      ).retention,
    ];
  }

  /**
   * ML予測値をカテゴリーに変換
   */
  private predictCategory(value: number): WordCategory {
    if (value < 0.25) return 'new';
    if (value < 0.5) return 'incorrect';
    if (value < 0.75) return 'still_learning';
    return 'mastered';
  }

  /**
   * 特徴量の次元数
   */
  protected getFeatureDimension(): number {
    return 15;
  }

  /**
   * 出力の次元数
   */
  protected getOutputDimension(): number {
    return 4; // forgettingRisk, timeBoost, category, retentionStrength
  }
}

