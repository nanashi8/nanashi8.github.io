/**
 * EmotionalAI - 感情的サポートスペシャリスト
 *
 * **役割**: 学習者の感情状態を監視し、モチベーション維持と適切なサポートを提供
 *
 * **検出項目**:
 * - 挫折度（連続不正解、長時間停滞）
 * - 自信レベル（連続正解、正答率）
 * - 疲労度（セッション時間、問題数）
 *
 * **アクション**:
 * - Position調整（挫折時は簡単に、好調時は少し難しく）
 * - 休憩提案（疲労検出時）
 * - 励ましメッセージ（状況に応じた適切な言葉）
 *
 * Phase 5: 感情的サポート統合
 */

import type { WordProgress } from '../../storage/progress/types';

/**
 * セッション統計
 */
export interface SessionStats {
  /** 総問題数 */
  totalQuestions: number;
  /** 連続正解数 */
  consecutiveCorrect: number;
  /** 連続不正解数 */
  consecutiveIncorrect: number;
  /** 正答率（0-1） */
  accuracy: number;
  /** セッション時間（分） */
  sessionDuration: number;
  /** 最近の解答履歴（最新10件） */
  recentAnswers?: Array<{
    correct: boolean;
    timestamp: number;
  }>;
}

/**
 * 感情レベル
 */
export type EmotionLevel = 'low' | 'medium' | 'high';

/**
 * 励ましの種類
 */
export type EncouragementType =
  | 'support'      // 挫折時のサポート
  | 'praise'       // 好調時の称賛
  | 'mastery'      // マスター達成時
  | 'standard';    // 通常時

/**
 * EmotionalAI分析結果
 */
export interface EmotionalAnalysis {
  /** 挫折度 */
  frustrationLevel: EmotionLevel;
  /** 自信レベル */
  confidenceLevel: EmotionLevel;
  /** 疲労度 */
  fatigueLevel: EmotionLevel;
  /** 休憩を提案するか */
  suggestBreak: boolean;
  /** 励ましメッセージ */
  encouragement: {
    type: EncouragementType;
    message: string;
  };
  /** Position調整提案 */
  positionAdjustment: {
    delta: number;
    reason: string;
    confidence: number;
  };
}

/**
 * EmotionalAI - 感情サポートスペシャリスト
 */
export class EmotionalAI {
  /**
   * 感情分析を実行
   */
  analyze(
    progress: WordProgress,
    sessionStats: SessionStats
  ): EmotionalAnalysis {
    // 1️⃣ 挫折度の検出
    const frustrationLevel = this.detectFrustration(sessionStats);

    // 2️⃣ 自信レベルの計算
    const confidenceLevel = this.calculateConfidence(sessionStats);

    // 3️⃣ 疲労度の推定
    const fatigueLevel = this.estimateFatigue(sessionStats);

    // 4️⃣ 休憩の提案
    const suggestBreak = this.shouldSuggestBreak(sessionStats, fatigueLevel);

    // 5️⃣ 適切な励ましの選択
    const encouragement = this.selectEncouragement(
      frustrationLevel,
      confidenceLevel,
      progress
    );

    // 6️⃣ Position調整
    const positionAdjustment = this.calculatePositionAdjustment(
      frustrationLevel,
      confidenceLevel,
      fatigueLevel
    );

    return {
      frustrationLevel,
      confidenceLevel,
      fatigueLevel,
      suggestBreak,
      encouragement,
      positionAdjustment
    };
  }

  /**
   * 挫折度の検出（連続不正解、長時間停滞）
   */
  private detectFrustration(stats: SessionStats): EmotionLevel {
    const recentErrors = stats.recentAnswers?.filter(a => !a.correct).length || 0;
    const consecutiveErrors = stats.consecutiveIncorrect || 0;

    // 連続3回以上不正解 or 最近5問中5問不正解
    if (consecutiveErrors >= 3 || recentErrors >= 5) {
      return 'high';
    }

    // 連続2回不正解 or 最近5問中3問不正解
    if (consecutiveErrors >= 2 || recentErrors >= 3) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 自信度の計算（連続正解、正答率）
   */
  private calculateConfidence(stats: SessionStats): EmotionLevel {
    const consecutiveCorrect = stats.consecutiveCorrect || 0;
    const accuracy = stats.accuracy || 0;

    // 連続5回以上正解 & 正答率80%以上
    if (consecutiveCorrect >= 5 && accuracy >= 0.8) {
      return 'high';
    }

    // 連続3回正解 & 正答率60%以上
    if (consecutiveCorrect >= 3 && accuracy >= 0.6) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 疲労度の推定（セッション時間、問題数）
   */
  private estimateFatigue(stats: SessionStats): EmotionLevel {
    const sessionMinutes = stats.sessionDuration || 0;
    const questionCount = stats.totalQuestions || 0;

    // 45分以上 or 50問以上
    if (sessionMinutes > 45 || questionCount > 50) {
      return 'high';
    }

    // 30分以上 or 30問以上
    if (sessionMinutes > 30 || questionCount > 30) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 休憩提案の判定
   */
  private shouldSuggestBreak(
    stats: SessionStats,
    fatigue: EmotionLevel
  ): boolean {
    // 高疲労 → 休憩推奨
    if (fatigue === 'high') return true;

    // 中疲労 + エラー率40%超 → 休憩推奨
    const errorRate = 1 - (stats.accuracy || 0);
    if (fatigue === 'medium' && errorRate > 0.4) {
      return true;
    }

    return false;
  }

  /**
   * 励ましメッセージの選択
   */
  private selectEncouragement(
    frustration: EmotionLevel,
    confidence: EmotionLevel,
    progress: WordProgress
  ): { type: EncouragementType; message: string } {
    // 高挫折 → サポートメッセージ
    if (frustration === 'high') {
      return {
        type: 'support',
        message: this.getSupportMessage(progress)
      };
    }

    // 高自信 → 称賛メッセージ
    if (confidence === 'high') {
      return {
        type: 'praise',
        message: this.getPraiseMessage()
      };
    }

    // マスター達成時
    if (progress.masteryLevel === 'mastered') {
      return {
        type: 'mastery',
        message: this.getMasteryMessage(progress)
      };
    }

    // 通常時
    return {
      type: 'standard',
      message: this.getStandardMessage()
    };
  }

  /**
   * Position調整の計算
   */
  private calculatePositionAdjustment(
    frustration: EmotionLevel,
    confidence: EmotionLevel,
    fatigue: EmotionLevel
  ): { delta: number; reason: string; confidence: number } {
    // 高挫折 → 簡単な問題に切り替え
    if (frustration === 'high') {
      return {
        delta: -15,
        reason: '連続失敗検出 - モチベーション維持のため簡単な問題を提示',
        confidence: 0.9
      };
    }

    // 中挫折 → やや簡単に
    if (frustration === 'medium') {
      return {
        delta: -8,
        reason: '苦戦中 - 少し易しい問題でリズムを取り戻しましょう',
        confidence: 0.7
      };
    }

    // 高自信 & 低疲労 → 少し難しく
    if (confidence === 'high' && fatigue === 'low') {
      return {
        delta: +5,
        reason: '好調です - 少し難易度を上げて成長を促します',
        confidence: 0.8
      };
    }

    // 高疲労 → 簡単な問題で締めくくり
    if (fatigue === 'high') {
      return {
        delta: -10,
        reason: '疲労検出 - 簡単な問題で達成感を得て終了しましょう',
        confidence: 0.75
      };
    }

    // 変更なし
    return {
      delta: 0,
      reason: '通常通り',
      confidence: 0.5
    };
  }

  /**
   * サポートメッセージ（挫折時）
   */
  private getSupportMessage(_progress: WordProgress): string {
    const messages = [
      '大丈夫です。難しい単語ですが、少しずつ覚えていきましょう 💪',
      'このペースで大丈夫。焦らず、一歩ずつ進みましょう',
      '間違えることは学びのチャンス。次は必ず覚えられます',
      '難しい単語ですね。でも、あなたならきっと覚えられます',
      '今は苦戦していても、繰り返せば必ず身につきます'
    ];

    // ランダムに選択（実際にはprogressに基づいてカスタマイズ可能）
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * 称賛メッセージ（好調時）
   */
  private getPraiseMessage(): string {
    const messages = [
      '素晴らしい！この調子です 🎉',
      '完璧です！着実に力がついていますね',
      'すごい集中力です。このまま続けましょう',
      '連続正解！あなたの努力が実を結んでいます',
      '見事です！このペースを維持しましょう'
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * マスターメッセージ（達成時）
   */
  private getMasteryMessage(progress: WordProgress): string {
    const word = progress.word;
    return `🎉 おめでとうございます！「${word}」をマスターしました！`;
  }

  /**
   * 標準メッセージ（通常時）
   */
  private getStandardMessage(): string {
    const messages = [
      '良いペースです。この調子で続けましょう',
      '順調に進んでいます',
      'その調子！一つずつ確実に覚えていきましょう',
      'いい感じです。集中して取り組めていますね'
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}
