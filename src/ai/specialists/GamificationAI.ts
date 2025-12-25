/**
 * 🎮 GamificationAI - ゲーム設計戦略AI（Phase 4.5強化版 + ML統合）
 *
 * 責任:
 * - モチベーションレベルの評価
 * - Position調整による自然なインターリーブ（新規混入）
 * - 報酬付与タイミングの判定
 * - チャレンジレベルの設定
 * - SNS共有推奨の生成
 *
 * Phase 4.5 ML統合:
 * - TensorFlow.jsによる個人のモチベーションパターン学習
 * - ハイブリッドAI（ルールベース + ML）
 */

import type {
  GamificationSignal,
  ChallengeLevel,
  AIAnalysisInput,
  StorageWordProgress,
} from '../types';
import { MLEnhancedSpecialistAI } from '../ml/MLEnhancedSpecialistAI';

export class GamificationAI extends MLEnhancedSpecialistAI<GamificationSignal> {
  readonly id = 'gamification';
  readonly name = 'Gamification AI';
  readonly icon = '🎮';

  /**
   * Position提案（統合レイヤー用）
   *
   * ゲーミフィケーションAIの立場: モチベーションからPositionを提案
   * - 連続正解が続いている → Position低（達成感を維持）
   * - 正答率が高い → Position低（自信を持たせる）
   */
  proposePosition(
    progress: StorageWordProgress,
    consecutiveCorrect: number,
    accuracy: number
  ): number {
    // === モチベーション維持 ===
    // 連続正解中は簡単な問題を出してモチベーション維持
    const motivationBonus = consecutiveCorrect >= 3 ? -15 : 0; // Position下げる

    // === 自信強化 ===
    // 正答率が高い単語は適度に出題して自信を維持
    const confidenceBonus = accuracy >= 0.8 ? -10 : 0;

    // === 基準Position ===
    const basePosition = 50;

    // === 最終提案 ===
    const proposedPosition = basePosition + motivationBonus + confidenceBonus;

    return Math.max(0, Math.min(100, proposedPosition));
  }

  /**
   * 🎮 インターリーブのためのPosition調整（Position分散）
   *
   * モチベーション維持のため、新規単語の一部をPosition引き上げて散らす
   * → Position降順ソートだけで自然に交互出題を実現
   *
   * @param questions Position計算済みの問題リスト
   * @returns Position調整済みの問題リスト
   */
  adjustPositionForInterleaving<
    T extends { position: number; question?: { word: string }; attempts?: number },
  >(
    questions: T[]
  ): { result: T[]; changed: Array<{ word: string; before: number; after: number }> } {
    const struggling = questions.filter((pq) => pq.position >= 40);
    const newOnes = questions.filter((pq) => pq.position < 40);
    const newBoostable = questions.filter((pq) => pq.position >= 25 && pq.position < 40);

    // 🔍 デバッグログ
    const isDevMode = import.meta.env?.DEV ?? false;

    if (isDevMode) {
      console.log(
        `🎮 [GamificationAI] インターリーブ調整開始: まだまだ${struggling.length}語, 新規${newOnes.length}語, 引き上げ候補(Pos≥25)${newBoostable.length}語`
      );
    }

    if (struggling.length === 0) {
      if (isDevMode)
        console.log('ℹ️ [GamificationAI] まだまだ0語 → Position分散スキップ（正常動作）');
      return { result: questions, changed: [] };
    }

    if (newOnes.length === 0) {
      if (isDevMode) console.log('⚠️ [GamificationAI] 新規0語 → Position分散スキップ');
      return { result: questions, changed: [] };
    }

    // まだまだの数に応じて新規をPosition引き上げ（まだまだより下位に抑える）
    let boostRatio = 0;
    let boostAmount = 0;

    if (struggling.length >= 50) {
      boostRatio = 0.17;
      boostAmount = 10; // +10 → Position 35-48（まだまだの60-69より下）
    } else if (struggling.length >= 20) {
      boostRatio = 0.25;
      boostAmount = 8; // +8 → Position 33-48
    } else if (struggling.length >= 1) {
      boostRatio = 0.33;
      boostAmount = 5; // +5 → Position 30-45（まだまだより確実に下）
    }

    const changed: Array<{ word: string; before: number; after: number }> = [];

    if (boostRatio > 0 && newOnes.length > 0) {
      const toBoost = Math.floor(newOnes.length * boostRatio);
      // Position降順で上位の新規をブースト（Position 20以上の新規のみ対象）
      const sortedNew = [...newOnes]
        .filter((pq) => pq.position >= 20) // Position 20以上のみ（ブースト対象を広げる）
        .sort((a, b) => b.position - a.position);

      const actualBoost = Math.min(toBoost, sortedNew.length);

      if (isDevMode) {
        console.log(
          `✅ [GamificationAI] ${actualBoost}語をPosition +${boostAmount} (比率${(boostRatio * 100).toFixed(0)}%, 候補${sortedNew.length}語)`
        );
      }

      // 元のquestions配列内のオブジェクトを直接書き換え
      for (let i = 0; i < actualBoost; i++) {
        const before = sortedNew[i].position;
        sortedNew[i].position = Math.min(sortedNew[i].position + boostAmount, 59); // 🚨 Position階層の不変条件: 新規は60未満（まだまだより下位）
        const word = sortedNew[i].question?.word || '(unknown)';

        changed.push({ word, before, after: sortedNew[i].position });

        if (isDevMode && i < 5) {
          console.log(`  • ${word}: ${before.toFixed(0)} → ${sortedNew[i].position.toFixed(0)}`);
        }
      }

      // 🔍 Position階層検証（デバッグ用）
      const violatingNew = questions.filter((pq) => {
        const isNew = (pq.attempts ?? 0) === 0;
        const isBoosted = pq.position >= 40;
        return isNew && isBoosted && pq.position >= 60; // 新規がPosition 60以上になっている
      });
      if (violatingNew.length > 0 && isDevMode) {
        console.error(`❌ [Position階層違反] 新規語がPosition 60以上: ${violatingNew.length}語`);
        console.error('🚨 これは「あっちを立てればこっちが立たず」の原因です');
      }

      // localStorage保存（デバッグパネル用）
      try {
        localStorage.setItem(
          'debug_position_hierarchy_new',
          JSON.stringify({
            violations: violatingNew.map((pq) => ({
              word: pq.question?.word || '(unknown)',
              position: pq.position,
              type: 'new_exceeds_60',
            })),
            totalNew: questions.filter((pq) => (pq.attempts ?? 0) === 0 && pq.position >= 40)
              .length,
            violationCount: violatingNew.length,
            timestamp: new Date().toISOString(),
          })
        );
      } catch {
        // localStorage失敗は無視
      }
    } else {
      if (isDevMode) console.warn('⚠️ [GamificationAI] boostRatio=0 or newOnes=0 → 調整なし');
    }

    return { result: questions, changed };
  }

  /**
   * まだまだ語のPosition引き上げ（新規より優先させる）
   * Position 40-70, attempts > 0 の単語を +15 引き上げ
   *
  * 🎯 段階的ブースト戦略:
  * - 分からない（70-100）がある → 通常ブースト（Position 60-69）
  * - 分からないが0になった → 強化ブースト（ただしPosition階層を崩さず60-69の上位に寄せる）
   */
  boostStillLearningQuestions<
    T extends { position: number; attempts?: number; question?: { word: string } },
  >(
    questions: T[]
  ): { result: T[]; changed: Array<{ word: string; before: number; after: number }> } {
    const stillLearning = questions.filter(
      (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) > 0
    );
    const incorrect = questions.filter((pq) => pq.position >= 70 && (pq.attempts ?? 0) > 0);

    const isDevMode = import.meta.env?.DEV ?? false;

    // 🎯 分からないが0になったら「まだまだ集中モード」発動
    const isFocusMode = incorrect.length === 0 && stillLearning.length > 0;

    if (isDevMode) {
      console.log(
        `🎯 [GamificationAI] まだまだ語ブースト開始: ${stillLearning.length}語 ${isFocusMode ? '【集中モード】' : '【通常モード】'}`
      );
      if (isFocusMode) {
        console.log('🔥 [集中モード] 分からない0語 → まだまだを強化ブースト（Position 60-69の上位へ寄せる）');
      }
    }

    if (stillLearning.length === 0) {
      if (isDevMode)
        console.log('ℹ️ [GamificationAI] まだまだ語0語 → ブーストスキップ（正常動作）');
      return { result: questions, changed: [] };
    }

    const changed: Array<{ word: string; before: number; after: number }> = [];

    // まだまだ語を引き上げ
    for (const sq of stillLearning) {
      const before = sq.position;

      let targetPosition: number;
      if (isFocusMode) {
        // 🔥 集中モード: Position階層を崩さず、60-69の上位（68-69）へ寄せる
        // これで新規より確実に優先されつつ、分からない範囲（70+）へ侵入しない
        const boostAmount = before < 50 ? 25 : before < 60 ? 15 : 8;
        targetPosition = Math.min(before + boostAmount, 69);
        targetPosition = Math.max(targetPosition, 68);
      } else {
        // 通常モード: Position 60-69（まだまだ専用ゾーン）
        const boostAmount = before < 50 ? 20 : before < 60 ? 10 : 5;
        targetPosition = Math.min(before + boostAmount, 69);
        targetPosition = Math.max(targetPosition, 60);
      }

      sq.position = targetPosition;
      const word = sq.question?.word || '(unknown)';

      changed.push({ word, before, after: sq.position });

      if (isDevMode && changed.length <= 5) {
        console.log(`  • ${word}: ${before.toFixed(0)} → ${sq.position.toFixed(0)}`);
      }
    }

    // 🔍 Position階層検証（デバッグ用）
    const expectedMin = isFocusMode ? 68 : 60;
    const expectedMax = 69;
    const violatingStill = stillLearning.filter(
      (sq) => sq.position < expectedMin || sq.position > expectedMax
    );
    if (violatingStill.length > 0 && isDevMode) {
      console.error(
        `❌ [Position階層違反] まだまだ語がPosition ${expectedMin}-${expectedMax}範囲外: ${violatingStill.length}語`
      );
      console.error('🚨 これは「あっちを立てればこっちが立たず」の原因です');
      violatingStill.slice(0, 3).forEach((sq) => {
        const word = sq.question?.word || '(unknown)';
        console.error(`  • ${word}: Position ${sq.position}`);
      });
    }

    // localStorage保存（デバッグパネル用）
    try {
      localStorage.setItem(
        'debug_position_hierarchy_still',
        JSON.stringify({
          mode: isFocusMode ? 'focus' : 'normal',
          targetRange: `${expectedMin}-${expectedMax}`,
          violations: violatingStill.map((sq) => ({
            word: sq.question?.word || '(unknown)',
            position: sq.position,
            type:
              sq.position < expectedMin
                ? `still_below_${expectedMin}`
                : `still_above_${expectedMax}`,
          })),
          totalStill: stillLearning.length,
          violationCount: violatingStill.length,
          timestamp: new Date().toISOString(),
        })
      );

      // まだまだ語のブースト結果を保存（デバッグパネル用）
      localStorage.setItem(
        'debug_still_learning_boost',
        JSON.stringify({
          boosted: changed.length,
          changes: changed,
          working: changed.length > 0,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // localStorage失敗は無視
    }

    if (isDevMode) {
      console.log(
        `✅ [GamificationAI] まだまだ語${stillLearning.length}語をPosition 60-69に引き上げ完了（最優先）`
      );
    }

    return { result: questions, changed };
  }

  /**
   * 🎮 カテゴリ別インターリーブ（交互配置）
   *
   * Position降順ソート後に、苦手語（分からない+まだまだ）とPosition引き上げ新規語を交互配置
   * パターン: [苦手語3-5問, 新規1問] のサイクルで配置
   *
   * @param questions Position降順ソート済みの問題リスト
   * @returns インターリーブ済みの問題リスト
   */
  interleaveByCategory<
    T extends { position: number; attempts?: number; question?: { word: string } },
  >(questions: T[]): T[] {
    const isDevMode = import.meta.env?.DEV ?? false;

    // 苦手語（分からない Position≥70 + まだまだ Position 40-70, attempts > 0）を抽出
    const struggling = questions.filter((pq) => pq.position >= 40 && (pq.attempts ?? 0) > 0);

    // Position引き上げ新規語（Position 40-60, attempts = 0）を抽出
    const boostedNew = questions.filter(
      (pq) => pq.position >= 40 && pq.position < 70 && (pq.attempts ?? 0) === 0
    );

    // その他の問題（Position < 40）
    const others = questions.filter((pq) => pq.position < 40);

    if (isDevMode) {
      console.log(
        `🎮 [GamificationAI] カテゴリ別インターリーブ: 苦手語${struggling.length}語（分からない+まだまだ）, Position引き上げ新規${boostedNew.length}語, その他${others.length}語`
      );
    }

    // 苦手語も新規語もない場合は、元のリストを返す
    if (struggling.length === 0 && boostedNew.length === 0) {
      if (isDevMode)
        console.log(
          'ℹ️ [GamificationAI] インターリーブ対象なし（苦手語・Position引き上げ新規語ともに0）'
        );
      return questions;
    }

    // 苦手語のみの場合は、苦手語を先頭に配置
    if (boostedNew.length === 0) {
      if (isDevMode)
        console.log('ℹ️ [GamificationAI] Position引き上げ新規語なし → 苦手語のみ優先配置');
      return [...struggling, ...others];
    }

    // 新規語のみの場合は、新規語を先頭に配置
    if (struggling.length === 0) {
      if (isDevMode)
        console.log('ℹ️ [GamificationAI] 苦手語なし → Position引き上げ新規語のみ優先配置');
      return [...boostedNew, ...others];
    }

    // 交互配置パターン: [苦手語3-5問, 新規1問]（苦手語が主、新規が従）
    const interleaved: T[] = [];
    let strugIdx = 0;
    let newIdx = 0;

    while (strugIdx < struggling.length || newIdx < boostedNew.length) {
      // 苦手語を3-5問追加（主）
      const strugCount = Math.min(Math.floor(Math.random() * 3) + 3, struggling.length - strugIdx);
      for (let i = 0; i < strugCount; i++) {
        interleaved.push(struggling[strugIdx++]);
      }

      // 新規語を1問追加（従）
      if (newIdx < boostedNew.length) {
        interleaved.push(boostedNew[newIdx++]);
      }
    }

    // その他の問題を後ろに追加
    const result = [...interleaved, ...others];

    if (isDevMode) {
      console.log(
        `✅ [GamificationAI] インターリーブ完了: TOP10 = ${result
          .slice(0, 10)
          .map((q) => {
            const word = q.question?.word || '?';
            const category = (q.attempts ?? 0) > 0 ? '苦手' : '新規';
            return `${word}(${category})`;
          })
          .join(', ')}`
      );
    }

    return result;
  }

  protected analyzeByRules(input: AIAnalysisInput): GamificationSignal {
    const { allProgress, sessionStats } = input;

    const motivationLevel = this.calculateMotivationLevel(allProgress, sessionStats);
    const rewardTiming = this.shouldTriggerReward(allProgress, sessionStats);
    const challengeLevel = this.determineChallengeLevel(sessionStats);
    const socialFeedback = this.generateSocialFeedback(allProgress, sessionStats);

    return {
      aiId: 'gamification',
      confidence: this.calculateConfidence(allProgress),
      timestamp: Date.now(),
      motivationLevel,
      rewardTiming,
      challengeLevel,
      socialFeedback,
    };
  }

  /**
   * モチベーションレベルの計算
   */
  private calculateMotivationLevel(
    allProgress: Record<string, StorageWordProgress>,
    sessionStats: any
  ): number {
    let motivation = 0.5; // ベースライン

    // 正答率が高い → モチベーション上昇
    const correctRate =
      sessionStats.totalAttempts > 0
        ? sessionStats.correctAnswers / sessionStats.totalAttempts
        : 0.5;

    if (correctRate >= 0.8) motivation += 0.3;
    else if (correctRate >= 0.6) motivation += 0.2;
    else if (correctRate >= 0.4) motivation += 0.1;
    else motivation -= 0.2; // 低正答率はモチベーション低下

    // 連続正解 → モチベーション上昇
    if (sessionStats.consecutiveIncorrect === 0 && sessionStats.totalAttempts >= 5) {
      motivation += 0.2;
    }

    // 習得語句数 → モチベーション上昇
    const masteredCount = sessionStats.masteredCount || 0;
    const totalWords = Object.keys(allProgress).length;
    const masteryRate = totalWords > 0 ? masteredCount / totalWords : 0;

    if (masteryRate >= 0.7) motivation += 0.2;
    else if (masteryRate >= 0.5) motivation += 0.1;

    // セッション時間 → 長時間学習はモチベーション低下の兆候
    const sessionMinutes = sessionStats.sessionDuration / (1000 * 60);
    if (sessionMinutes > 45) motivation -= 0.2;
    else if (sessionMinutes > 30) motivation -= 0.1;

    return Math.max(0, Math.min(motivation, 1));
  }

  /**
   * 報酬付与タイミングの判定
   */
  private shouldTriggerReward(
    allProgress: Record<string, StorageWordProgress>,
    sessionStats: any
  ): boolean {
    // マイルストーン達成時
    const masteredCount = sessionStats.masteredCount || 0;
    if (masteredCount > 0 && masteredCount % 10 === 0) return true;

    // 高正答率達成時
    const correctRate =
      sessionStats.totalAttempts > 0 ? sessionStats.correctAnswers / sessionStats.totalAttempts : 0;
    if (correctRate >= 0.9 && sessionStats.totalAttempts >= 10) return true;

    // 連続学習日数（実装は簡易版）
    const studyDates = new Set<string>();
    Object.values(allProgress).forEach((p) => {
      if (p.lastStudied) {
        const date = new Date(p.lastStudied).toDateString();
        studyDates.add(date);
      }
    });

    if (studyDates.size >= 7) return true; // 7日連続

    return false;
  }

  /**
   * チャレンジレベルの決定
   */
  private determineChallengeLevel(sessionStats: any): ChallengeLevel {
    const correctRate =
      sessionStats.totalAttempts > 0
        ? sessionStats.correctAnswers / sessionStats.totalAttempts
        : 0.5;

    // 高正答率 → ハードチャレンジ
    if (correctRate >= 0.85) return 'hard';

    // 中正答率 → ミディアムチャレンジ
    if (correctRate >= 0.6) return 'medium';

    // 低正答率 → イージーチャレンジ
    return 'easy';
  }

  /**
   * SNS共有メッセージの生成
   */
  private generateSocialFeedback(
    allProgress: Record<string, StorageWordProgress>,
    sessionStats: any
  ): string {
    const masteredCount = sessionStats.masteredCount || 0;
    const totalAttempts = sessionStats.totalAttempts;
    const correctRate = totalAttempts > 0 ? sessionStats.correctAnswers / totalAttempts : 0;

    // マイルストーン達成
    if (masteredCount >= 100) {
      return `🎉 100語以上マスター！英語学習を続けています！ #英語学習 #継続は力なり`;
    }
    if (masteredCount >= 50) {
      return `🌟 50語マスター達成！着実に成長中！ #英語学習 #目標達成`;
    }
    if (masteredCount >= 10) {
      return `📚 10語マスター！コツコツ頑張っています！ #英語学習 #初心者`;
    }

    // 高正答率
    if (correctRate >= 0.9 && totalAttempts >= 10) {
      return `💯 正答率90%以上！調子がいいです！ #英語学習 #好調`;
    }

    // 連続学習
    const studyDays = this.calculateStudyDays(allProgress);
    if (studyDays >= 30) {
      return `🔥 30日連続学習達成！継続は力なり！ #英語学習 #習慣化`;
    }
    if (studyDays >= 7) {
      return `✨ 1週間連続学習！習慣化できています！ #英語学習 #継続中`;
    }

    return ''; // 共有推奨なし
  }

  /**
   * 学習日数の計算
   */
  private calculateStudyDays(allProgress: Record<string, StorageWordProgress>): number {
    const studyDates = new Set<string>();

    Object.values(allProgress).forEach((p) => {
      if (p.lastStudied) {
        const date = new Date(p.lastStudied).toDateString();
        studyDates.add(date);
      }
    });

    return studyDates.size;
  }

  private calculateConfidence(allProgress: Record<string, StorageWordProgress>): number {
    const totalWords = Object.keys(allProgress).length;
    const studyDays = this.calculateStudyDays(allProgress);

    // 語句数と学習日数で信頼度を計算
    let confidence = 0.3;

    if (totalWords >= 50) confidence += 0.3;
    else if (totalWords >= 20) confidence += 0.2;

    if (studyDays >= 7) confidence += 0.4;
    else if (studyDays >= 3) confidence += 0.2;

    return Math.min(confidence, 1);
  }

  validateSignal(signal: GamificationSignal): boolean {
    if (!signal.aiId || signal.aiId !== 'gamification') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.motivationLevel < 0 || signal.motivationLevel > 1) return false;
    if (typeof signal.rewardTiming !== 'boolean') return false;
    if (typeof signal.socialFeedback !== 'string') return false;

    const validLevels: ChallengeLevel[] = ['easy', 'medium', 'hard'];
    if (!validLevels.includes(signal.challengeLevel)) return false;

    return true;
  }

  // ========================================
  // Phase 4.5: ML統合メソッド
  // ========================================

  protected async analyzeByML(input: AIAnalysisInput): Promise<GamificationSignal> {
    const features = this.extractFeatures(input);
    const prediction = await this.predict(features);

    const challengeValue = prediction.values[1];
    let challengeLevel: ChallengeLevel;
    if (challengeValue < 0.33) challengeLevel = 'easy';
    else if (challengeValue < 0.67) challengeLevel = 'medium';
    else challengeLevel = 'hard';

    return {
      aiId: 'gamification',
      confidence: prediction.confidence,
      timestamp: Date.now(),
      motivationLevel: prediction.values[0],
      rewardTiming: prediction.values[2] > 0.5,
      challengeLevel,
      socialFeedback: '',
    };
  }

  protected mergeSignals(
    ruleSignal: GamificationSignal,
    mlSignal: GamificationSignal,
    input: AIAnalysisInput
  ): GamificationSignal {
    const _totalWords = Object.keys(input.allProgress).length;
    const studyDays = this.calculateStudyDays(input.allProgress);
    const mlWeight = Math.min(Math.max((studyDays - 3) / 10, 0), 0.6);
    const ruleWeight = 1 - mlWeight;

    return {
      aiId: 'gamification',
      confidence: ruleSignal.confidence * ruleWeight + mlSignal.confidence * mlWeight,
      timestamp: Date.now(),
      motivationLevel:
        ruleSignal.motivationLevel * ruleWeight + mlSignal.motivationLevel * mlWeight,
      rewardTiming: ruleSignal.rewardTiming || mlSignal.rewardTiming,
      challengeLevel: studyDays > 7 ? mlSignal.challengeLevel : ruleSignal.challengeLevel,
      socialFeedback: ruleSignal.socialFeedback,
    };
  }

  protected extractFeatures(input: AIAnalysisInput): number[] {
    const { sessionStats, allProgress } = input;
    const totalWords = Object.keys(allProgress).length;
    const studyDays = this.calculateStudyDays(allProgress);
    const masteredCount = sessionStats.masteredCount || 0;

    return [
      sessionStats.currentAccuracy ||
        (sessionStats.totalAttempts > 0
          ? sessionStats.correctAnswers / sessionStats.totalAttempts
          : 0),
      sessionStats.consecutiveCorrect || 0,
      sessionStats.consecutiveIncorrect / 5,
      sessionStats.sessionDuration / (1000 * 60 * 60),
      sessionStats.totalAttempts / 50,
      totalWords / 100,
      studyDays / 30,
      masteredCount / totalWords || 0,
      sessionStats.questionsAnswered || sessionStats.totalAttempts / 50,
      new Date().getHours() / 24,
    ];
  }

  protected getFeatureDimension(): number {
    return 10;
  }
  protected getOutputDimension(): number {
    return 3;
  }
}
