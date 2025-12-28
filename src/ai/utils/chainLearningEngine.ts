/**
 * いもづる式学習アルゴリズム
 *
 * 既知の単語から関連性の高い未知の単語へと
 * 連鎖的に学習を進めるアルゴリズム
 *
 * 主な機能:
 * 1. 既知語から最適な未知語を選択
 * 2. 関連語クラスターの構築
 * 3. 学習シーケンスの最適化
 */

import type { Question } from '@/types';
import type { WordProgress } from '@/storage/progress/types';
import type { WordRelationship, SemanticCluster } from '@/types/learningEfficiency';
import { wordRelationMapper } from './wordRelationMapper';
import { logger } from '@/utils/logger';

/**
 * いもづる式学習エンジン
 */
export class ChainLearningEngine {
  /**
   * 既知語から最も関連が強い未知語を探す
   */
  findBestUnknownWord(
    masteredWords: string[],
    unknownWords: Question[],
    relationships: WordRelationship[]
  ): Question | null {
    if (unknownWords.length === 0) return null;
    if (masteredWords.length === 0) {
      // 既知語がない場合はランダムに選択
      return unknownWords[0];
    }

    let bestWord: Question | null = null;
    let maxStrength = 0;

    // 各未知語について、既知語との最大関連度を計算
    unknownWords.forEach((unknown) => {
      let maxRelationStrength = 0;

      masteredWords.forEach((mastered) => {
        const strength = wordRelationMapper.getRelationStrength(
          mastered,
          unknown.word,
          relationships
        );
        maxRelationStrength = Math.max(maxRelationStrength, strength);
      });

      if (maxRelationStrength > maxStrength) {
        maxStrength = maxRelationStrength;
        bestWord = unknown;
      }
    });

    if (bestWord !== null) {
      logger.info('[ChainLearning] 最適な未知語を選択', {
        word: (bestWord as Question).word,
        relationStrength: maxStrength,
      });
    }

    return bestWord;
  }

  /**
   * 学習クラスターを構築
   */
  buildLearningCluster(
    seedWord: Question,
    allWords: Question[],
    relationships: WordRelationship[],
    maxSize: number = 10
  ): Question[] {
    const cluster: Question[] = [seedWord];
    const addedWords = new Set([seedWord.word]);

    // シード語と関連が強い語を追加
    for (let i = 0; i < maxSize - 1; i++) {
      let bestWord: Question | null = null;
      let maxStrength = 0;

      allWords.forEach((word) => {
        if (addedWords.has(word.word)) return;

        // クラスター内の全単語との関連度を計算
        let totalStrength = 0;
        cluster.forEach((clusterWord) => {
          const strength = wordRelationMapper.getRelationStrength(
            clusterWord.word,
            word.word,
            relationships
          );
          totalStrength += strength;
        });

        const avgStrength = totalStrength / cluster.length;

        if (avgStrength > maxStrength) {
          maxStrength = avgStrength;
          bestWord = word;
        }
      });

      if (!bestWord || maxStrength < 30) break; // 関連度が低い場合は終了

      cluster.push(bestWord);
      addedWords.add((bestWord as Question).word);
    }

    logger.info('[ChainLearning] クラスター構築完了', {
      size: cluster.length,
      seedWord: seedWord.word,
    });

    return cluster;
  }

  /**
   * いもづる式学習シーケンスを生成
   */
  generateChainedSequence(
    questions: Question[],
    wordProgress: Record<string, WordProgress>,
    relationships: WordRelationship[],
    targetCluster?: SemanticCluster
  ): Question[] {
    logger.info('[ChainLearning] いもづる式シーケンス生成開始', {
      totalQuestions: questions.length,
      targetCluster: targetCluster?.clusterName,
    });

    // 定着済みの単語を抽出
    const masteredWords = Object.entries(wordProgress)
      .filter(([_word, wp]) => wp.masteryLevel === 'mastered')
      .map(([word, _wp]) => word);

    // 未定着の単語を抽出
    let unknownWords = questions.filter((q) => {
      const wp = wordProgress[q.word];
      return !wp || wp.masteryLevel !== 'mastered';
    });

    // 特定クラスターが指定されている場合はフィルター
    if (targetCluster) {
      unknownWords = unknownWords.filter((q) => targetCluster.words.includes(q.word));
    }

    const sequence: Question[] = [];
    const usedWords = new Set<string>();

    // いもづる式に単語を選択
    while (sequence.length < questions.length && unknownWords.length > 0) {
      // 現在の既知語リスト（定着済み + 既に選択した語）
      const currentMastered = [
        ...masteredWords,
        ...sequence.map((q) => q.word).filter((w) => {
          const wp = wordProgress[w];
          return wp && wp.masteryLevel === 'mastered';
        }),
      ];

      // 次の最適な語を選択
      const nextWord = this.findBestUnknownWord(
        currentMastered,
        unknownWords.filter((q) => !usedWords.has(q.word)),
        relationships
      );

      if (!nextWord) break;

      // クラスターを構築
      const cluster = this.buildLearningCluster(
        nextWord,
        unknownWords.filter((q) => !usedWords.has(q.word)),
        relationships,
        Math.min(5, questions.length - sequence.length)
      );

      // クラスター内の語を追加
      cluster.forEach((word) => {
        if (!usedWords.has(word.word)) {
          sequence.push(word);
          usedWords.add(word.word);
        }
      });

      // 未知語リストを更新
      unknownWords = unknownWords.filter((q) => !usedWords.has(q.word));
    }

    logger.info('[ChainLearning] シーケンス生成完了', {
      sequenceLength: sequence.length,
      chainRate: sequence.length / questions.length,
    });

    return sequence;
  }

  /**
   * 難易度を考慮したシーケンス最適化
   */
  optimizeSequenceByDifficulty(
    sequence: Question[],
    wordProgress: Record<string, WordProgress>
  ): Question[] {
    // 各単語の難易度スコアを計算
    const scored = sequence.map((q) => {
      const wp = wordProgress[q.word];
      const difficultyScore = wp?.difficultyScore || 50;
      const attempts = wp?.totalAttempts || 0;

      // 難易度と出題回数を組み合わせた総合スコア
      const totalScore = difficultyScore + attempts * 5;

      return { question: q, score: totalScore };
    });

    // 関連性を保ちつつ、段階的に難易度を上げる
    const optimized: Question[] = [];
    const windowSize = 5; // 5問ごとにソート

    for (let i = 0; i < scored.length; i += windowSize) {
      const window = scored.slice(i, i + windowSize);
      // ウィンドウ内で難易度順にソート
      window.sort((a, b) => a.score - b.score);
      optimized.push(...window.map((s) => s.question));
    }

    return optimized;
  }

  /**
   * 復習語を適切に挿入
   */
  insertReviewWords(
    mainSequence: Question[],
    reviewWords: Question[],
    interval: number = 5
  ): Question[] {
    const result: Question[] = [];
    let reviewIndex = 0;

    mainSequence.forEach((q, index) => {
      result.push(q);

      // interval問ごとに復習語を挿入
      if ((index + 1) % interval === 0 && reviewIndex < reviewWords.length) {
        result.push(reviewWords[reviewIndex]);
        reviewIndex++;
      }
    });

    // 残りの復習語を追加
    while (reviewIndex < reviewWords.length) {
      result.push(reviewWords[reviewIndex]);
      reviewIndex++;
    }

    return result;
  }

  /**
   * 完全ないもづる式学習シーケンスを生成（統合版）
   */
  generateCompleteSequence(
    allQuestions: Question[],
    wordProgress: Record<string, WordProgress>,
    relationships: WordRelationship[],
    options: {
      targetCluster?: SemanticCluster;
      includeReview?: boolean;
      reviewInterval?: number;
    } = {}
  ): Question[] {
    logger.info('[ChainLearning] 完全シーケンス生成開始');

    // 復習語と新規語を分離
    const reviewWords: Question[] = [];
    const newWords: Question[] = [];

    allQuestions.forEach((q) => {
      const wp = wordProgress[q.word];
      if (wp && wp.masteryLevel !== 'mastered' && (wp.totalAttempts || 0) > 0) {
        reviewWords.push(q);
      } else {
        newWords.push(q);
      }
    });

    // いもづる式シーケンス生成
    let sequence = this.generateChainedSequence(
      newWords,
      wordProgress,
      relationships,
      options.targetCluster
    );

    // 難易度で最適化
    sequence = this.optimizeSequenceByDifficulty(sequence, wordProgress);

    // 復習語を挿入
    if (options.includeReview && reviewWords.length > 0) {
      sequence = this.insertReviewWords(
        sequence,
        reviewWords,
        options.reviewInterval || 5
      );
    }

    logger.info('[ChainLearning] 完全シーケンス生成完了', {
      total: sequence.length,
      new: newWords.length,
      review: reviewWords.length,
    });

    return sequence;
  }
}

/**
 * シングルトンインスタンス
 */
export const chainLearningEngine = new ChainLearningEngine();
