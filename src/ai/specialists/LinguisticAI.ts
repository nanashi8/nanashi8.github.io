/**
 * 📚 LinguisticAI - 言語学的AI（Phase 4.5強化版 + ML統合）
 *
 * 責任:
 * - 語句の固有難易度評価
 * - 音韻的類似性の分析
 * - 意味的クラスタリング
 * - 文法複雑度の判定
 *
 * Phase 4.5 ML統合:
 * - TensorFlow.jsによる言語的難易度予測
 * - ハイブリッドAI（ルールベース + ML）
 */

import type { LinguisticSignal, AIAnalysisInput, StorageWordProgress } from '../types';
import { MLEnhancedSpecialistAI } from '../ml/MLEnhancedSpecialistAI';

export class LinguisticAI extends MLEnhancedSpecialistAI<LinguisticSignal> {
  readonly id = 'linguistic';
  readonly name = 'Linguistic AI';
  readonly icon = '📚';

  /**
   * Position提案（統合レイヤー用）
   *
   * 言語学AIの立場: 単語の言語学的難易度からPositionを提案
   * - 長い単語 → Position高（覚えにくい）
   * - 不規則な綴り → Position高
   * - 正答率が低い → Position高（実証済みの難易度）
   */
  proposePosition(progress: StorageWordProgress, accuracy: number): number {
    const word = progress.word || '';

    // === 言語学的難易度 ===
    // 単語の長さ
    const lengthFactor = Math.min(word.length * 2, 20); // 最大+20点

    // 不規則な綴り（連続する子音、母音など）
    const irregularityFactor = this.calculateIrregularity(word);

    // === 実証済み難易度 ===
    // 正答率が低い = 実際に難しい
    const empiricalDifficulty = (1 - accuracy) * 30; // 最大+30点

    // === 基準Position ===
    const basePosition = 40; // やや低め（言語学的要因は補助的）

    // === 最終提案 ===
    const proposedPosition = basePosition + lengthFactor + irregularityFactor + empiricalDifficulty;

    return Math.max(0, Math.min(100, proposedPosition));
  }

  private calculateIrregularity(word: string): number {
    // 簡易的な不規則性評価
    const hasDoubleConsonants = /([bcdfghjklmnpqrstvwxyz])\1/.test(word);
    const hasUnusualCombinations = /([qx]|[^aeiou]{4})/.test(word);

    return (hasDoubleConsonants ? 5 : 0) + (hasUnusualCombinations ? 10 : 0);
  }

  protected analyzeByRules(input: AIAnalysisInput): LinguisticSignal {
    const { word, allProgress } = input;

    const inherentDifficulty = this.calculateInherentDifficulty(word);
    const phoneticSimilarity = this.findPhoneticallySimilarWords(word, allProgress);
    const semanticCluster = this.findSemanticCluster(word, allProgress);
    const grammarComplexity = this.assessGrammarComplexity(word);

    return {
      aiId: 'linguistic',
      confidence: 0.8, // 言語学的分析は比較的客観的なので高信頼度
      timestamp: Date.now(),
      inherentDifficulty,
      phoneticSimilarity,
      semanticCluster,
      grammarComplexity,
    };
  }

  /**
   * 固有難易度の計算
   */
  private calculateInherentDifficulty(word: string): number {
    let difficulty = 0;

    // 語長による難易度
    if (word.length > 12) difficulty += 0.3;
    else if (word.length > 8) difficulty += 0.2;
    else if (word.length > 5) difficulty += 0.1;

    // 音節数の推定（母音の数で簡易判定）
    const vowels = word.match(/[aeiou]/gi);
    const syllableCount = vowels ? vowels.length : 1;

    if (syllableCount > 4) difficulty += 0.2;
    else if (syllableCount > 3) difficulty += 0.1;

    // 子音クラスターの存在
    if (/[bcdfghjklmnpqrstvwxyz]{3,}/i.test(word)) {
      difficulty += 0.2;
    }

    // 不規則なスペリング
    if (/gh|ph|th|ough|augh/i.test(word)) {
      difficulty += 0.1;
    }

    return Math.min(difficulty, 1);
  }

  /**
   * 音韻的に類似した語句の検索
   */
  private findPhoneticallySimilarWords(
    word: string,
    allProgress: Record<string, WordProgress>
  ): string[] {
    const similarWords: string[] = [];

    // 簡易実装: Levenshtein距離やサウンデックスを使うべき
    // ここでは先頭・末尾の類似性で判定

    Object.keys(allProgress).forEach((w) => {
      if (w === word) return;

      // 先頭3文字または末尾3文字が一致
      if (
        w.substring(0, 3) === word.substring(0, 3) ||
        w.substring(w.length - 3) === word.substring(word.length - 3)
      ) {
        similarWords.push(w);
      }
    });

    return similarWords.slice(0, 5); // 最大5語
  }

  /**
   * 意味的クラスターの検索
   */
  private findSemanticCluster(word: string, allProgress: Record<string, WordProgress>): string[] {
    // 実際には語義データベース（WordNet等）を使用すべき
    // ここでは語根の共通性で簡易判定

    const cluster: string[] = [];
    const wordRoot = this.extractWordRoot(word);

    Object.keys(allProgress).forEach((w) => {
      if (w === word) return;

      const wRoot = this.extractWordRoot(w);
      if (wordRoot && wRoot && wordRoot === wRoot) {
        cluster.push(w);
      }
    });

    return cluster.slice(0, 5);
  }

  /**
   * 語根の抽出（簡易版）
   */
  private extractWordRoot(word: string): string {
    // 接尾辞を削除
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 's', 'es', 'tion', 'ment'];

    for (const suffix of suffixes) {
      if (word.endsWith(suffix)) {
        return word.substring(0, word.length - suffix.length);
      }
    }

    return word;
  }

  /**
   * 文法複雑度の評価
   */
  private assessGrammarComplexity(word: string): number {
    let complexity = 0;

    // 不規則動詞の判定（簡易版）
    const irregularVerbs = [
      'be',
      'have',
      'do',
      'go',
      'take',
      'get',
      'make',
      'know',
      'think',
      'see',
      'come',
      'want',
      'use',
      'find',
      'give',
    ];

    if (irregularVerbs.some((v) => word.includes(v))) {
      complexity += 0.3;
    }

    // 複合語の判定
    if (word.includes('-') || word.includes(' ')) {
      complexity += 0.2;
    }

    // 抽象名詞の判定
    if (word.endsWith('tion') || word.endsWith('ment') || word.endsWith('ness')) {
      complexity += 0.2;
    }

    return Math.min(complexity, 1);
  }

  validateSignal(signal: LinguisticSignal): boolean {
    if (!signal.aiId || signal.aiId !== 'linguistic') return false;
    if (signal.confidence < 0 || signal.confidence > 1) return false;
    if (signal.inherentDifficulty < 0 || signal.inherentDifficulty > 1) return false;
    if (signal.grammarComplexity < 0 || signal.grammarComplexity > 1) return false;
    if (!Array.isArray(signal.phoneticSimilarity)) return false;
    if (!Array.isArray(signal.semanticCluster)) return false;

    return true;
  }

  // ========================================
  // Phase 4.5: ML統合メソッド
  // ========================================

  protected async analyzeByML(input: AIAnalysisInput): Promise<LinguisticSignal> {
    const features = this.extractFeatures(input);
    const prediction = await this.predict(features);

    return {
      aiId: 'linguistic',
      confidence: prediction.confidence,
      timestamp: Date.now(),
      inherentDifficulty: prediction.values[0],
      phoneticSimilarity: [], // MLでは簡略化
      semanticCluster: [], // MLでは簡略化
      grammarComplexity: prediction.values[1],
    };
  }

  protected mergeSignals(
    ruleSignal: LinguisticSignal,
    mlSignal: LinguisticSignal,
    input: AIAnalysisInput
  ): LinguisticSignal {
    const totalWords = Object.keys(input.allProgress).length;
    const mlWeight = Math.min(Math.max((totalWords - 30) / 50, 0), 0.5);
    const ruleWeight = 1 - mlWeight;

    return {
      aiId: 'linguistic',
      confidence: (ruleSignal.confidence * ruleWeight) + (mlSignal.confidence * mlWeight),
      timestamp: Date.now(),
      inherentDifficulty:
        (ruleSignal.inherentDifficulty * ruleWeight) +
        (mlSignal.inherentDifficulty * mlWeight),
      phoneticSimilarity: ruleSignal.phoneticSimilarity,
      semanticCluster: ruleSignal.semanticCluster,
      grammarComplexity:
        (ruleSignal.grammarComplexity * ruleWeight) +
        (mlSignal.grammarComplexity * mlWeight),
    };
  }

  protected extractFeatures(input: AIAnalysisInput): number[] {
    const { word } = input;
    return [
      word.word.length / 15,
      word.meaning.split(',').length / 5,
      word.ipa ? word.ipa.length / 20 : 0,
      word.katakana ? word.katakana.length / 20 : 0,
      /[^aeiou]{3}/.test(word.word) ? 1 : 0,
      /([bcdfghjklmnpqrstvwxyz])\1/.test(word.word) ? 1 : 0,
      word.word.split('-').length / 3,
      word.word.includes(' ') ? 1 : 0,
      word.word.match(/[A-Z]/g)?.length || 0,
      /(tion|ment|ness|ing|ed)$/.test(word.word) ? 1 : 0,
    ];
  }

  protected getFeatureDimension(): number { return 10; }
  protected getOutputDimension(): number { return 2; }
}
