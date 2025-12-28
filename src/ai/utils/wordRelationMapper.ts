/**
 * 関連語マッピングシステム
 *
 * 単語間の関連性を自動分析・管理する
 *
 * 機能:
 * 1. 単語の関連性を分析（カテゴリー、語源、文脈）
 * 2. セマンティッククラスターの生成
 * 3. 関連度スコアの計算
 */

import type { Question } from '@/types';
import type { WordRelation, WordRelationship, SemanticCluster } from '@/types/learningEfficiency';
import { logger } from '@/utils/logger';

/**
 * 関連語マッピングエンジン
 */
export class WordRelationMapper {
  /**
   * 単語の関連性を分析
   */
  analyzeWordRelations(word: string, allWords: Question[]): WordRelation[] {
    const relations: WordRelation[] = [];
    const currentWord = allWords.find((q) => q.word === word);
    if (!currentWord) return relations;

    allWords.forEach((targetWord) => {
      if (targetWord.word === word) return;

      // カテゴリー関連
      const categoryRelation = this.analyzeCategoryRelation(currentWord, targetWord);
      if (categoryRelation) {
        relations.push(categoryRelation);
      }

      // 語源関連（接頭辞・接尾辞）
      const derivationRelation = this.analyzeDerivationRelation(currentWord, targetWord);
      if (derivationRelation) {
        relations.push(derivationRelation);
      }

      // 文脈関連（同じ例文に登場）
      const contextRelation = this.analyzeContextRelation(currentWord, targetWord);
      if (contextRelation) {
        relations.push(contextRelation);
      }
    });

    // 関連度順にソート
    return relations.sort((a, b) => b.strength - a.strength);
  }

  /**
   * カテゴリー関連を分析
   */
  private analyzeCategoryRelation(word1: Question, word2: Question): WordRelation | null {
    const fields1 = typeof word1.relatedFields === 'string'
      ? word1.relatedFields.split(',').map(f => f.trim())
      : [];
    const fields2 = typeof word2.relatedFields === 'string'
      ? word2.relatedFields.split(',').map(f => f.trim())
      : [];

    // 共通カテゴリーを探す
    const commonFields = fields1.filter((f) => fields2.includes(f));
    if (commonFields.length === 0) return null;

    // 共通カテゴリー数に応じて関連度を決定
    const strength = Math.min(100, 50 + commonFields.length * 15);

    return {
      relatedWord: word2.word,
      relationType: 'category',
      strength,
    };
  }

  /**
   * 派生語関連を分析
   */
  private analyzeDerivationRelation(word1: Question, word2: Question): WordRelation | null {
    const w1 = word1.word.toLowerCase();
    const w2 = word2.word.toLowerCase();

    // 語源が同じかチェック（簡易版）
    let strength = 0;

    // 接頭辞の共通性
    const commonPrefixes = ['un', 're', 'dis', 'pre', 'post', 'anti', 'de'];
    for (const prefix of commonPrefixes) {
      if (w1.startsWith(prefix) && w2.startsWith(prefix)) {
        strength += 30;
        break;
      }
    }

    // 語幹の類似性
    if (w1.length >= 4 && w2.length >= 4) {
      const stem1 = w1.slice(0, 4);
      const stem2 = w2.slice(0, 4);
      if (stem1 === stem2) {
        strength += 40;
      }
    }

    // 接尾辞の類似性
    const commonSuffixes = ['ing', 'ed', 'er', 'tion', 'ness', 'ly', 'ful', 'less'];
    for (const suffix of commonSuffixes) {
      if (w1.endsWith(suffix) && w2.endsWith(suffix)) {
        strength += 20;
        break;
      }
    }

    return strength > 0
      ? {
          relatedWord: word2.word,
          relationType: 'derivation',
          strength: Math.min(100, strength),
        }
      : null;
  }

  /**
   * 文脈関連を分析
   */
  private analyzeContextRelation(word1: Question, word2: Question): WordRelation | null {
    // 意味や語源の共通性をチェック
    const meaning1 = word1.meaning?.toLowerCase() || '';
    const meaning2 = word2.meaning?.toLowerCase() || '';
    const etymology1 = word1.etymology?.toLowerCase() || '';
    const etymology2 = word2.etymology?.toLowerCase() || '';

    let strength = 0;

    // 意味の類似性をチェック
    if (meaning1 && meaning2) {
      const words1 = meaning1.split(/\s+/);
      const words2 = meaning2.split(/\s+/);
      const commonWords = words1.filter((w) => words2.includes(w) && w.length > 2);
      const similarity = commonWords.length / Math.max(words1.length, words2.length);
      strength = Math.max(strength, similarity * 60);
    }

    // 語源の類似性をチェック
    if (etymology1 && etymology2) {
      const words1 = etymology1.split(/\s+/);
      const words2 = etymology2.split(/\s+/);
      const commonWords = words1.filter((w) => words2.includes(w) && w.length > 2);
      const similarity = commonWords.length / Math.max(words1.length, words2.length);
      strength = Math.max(strength, similarity * 50);
    }

    return strength > 30
      ? {
          relatedWord: word2.word,
          relationType: 'context',
          strength: Math.round(strength),
        }
      : null;
  }

  /**
   * 全単語の関連マップを生成
   */
  buildRelationshipMap(allWords: Question[]): WordRelationship[] {
    logger.info('[WordRelationMapper] 関連マップ生成開始', {
      totalWords: allWords.length,
    });

    const relationships: WordRelationship[] = [];

    allWords.forEach((word, index) => {
      if (index % 100 === 0) {
        logger.info(`[WordRelationMapper] 進捗: ${index}/${allWords.length}`);
      }

      const relations = this.analyzeWordRelations(word.word, allWords);

      relationships.push({
        word: word.word,
        relations: relations.slice(0, 20), // 上位20個まで
        updatedAt: Date.now(),
      });
    });

    logger.info('[WordRelationMapper] 関連マップ生成完了', {
      totalRelationships: relationships.length,
    });

    return relationships;
  }

  /**
   * セマンティッククラスターを生成
   */
  generateSemanticClusters(allWords: Question[]): SemanticCluster[] {
    logger.info('[WordRelationMapper] クラスター生成開始');

    const clusters: SemanticCluster[] = [];
    const categoryMap = new Map<string, Question[]>();

    // カテゴリーごとに単語をグループ化
    allWords.forEach((word) => {
      const categories = typeof word.relatedFields === 'string'
        ? word.relatedFields.split(',').map(f => f.trim())
        : ['その他'];
      categories.forEach((category: string) => {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(word);
      });
    });

    // 各カテゴリーをクラスターに変換
    categoryMap.forEach((words, category) => {
      if (words.length < 5) return; // 5語未満はスキップ

      // 中心単語を選択（最も多くの単語と関連がある単語）
      const centerWord = this.findCenterWord(words);

      // 凝集度を計算
      const cohesion = this.calculateCohesion(words);

      clusters.push({
        clusterId: `cluster-${category.toLowerCase().replace(/\s+/g, '-')}`,
        clusterName: category,
        words: words.map((w) => w.word),
        centerWord: centerWord.word,
        cohesion,
      });
    });

    logger.info('[WordRelationMapper] クラスター生成完了', {
      clusterCount: clusters.length,
    });

    return clusters;
  }

  /**
   * クラスターの中心単語を見つける
   */
  private findCenterWord(words: Question[]): Question {
    // 簡易版: relatedFieldsが最も多い単語を中心とする
    return words.reduce((prev, current) => {
      const prevCount = typeof prev.relatedFields === 'string'
        ? prev.relatedFields.split(',').length
        : 0;
      const currentCount = typeof current.relatedFields === 'string'
        ? current.relatedFields.split(',').length
        : 0;
      return currentCount > prevCount ? current : prev;
    });
  }

  /**
   * クラスターの凝集度を計算
   */
  private calculateCohesion(words: Question[]): number {
    if (words.length < 2) return 100;

    // 共通カテゴリー数の平均
    let totalCommonFields = 0;
    let comparisons = 0;

    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const fields1 = typeof words[i].relatedFields === 'string'
          ? words[i].relatedFields.split(',').map(f => f.trim())
          : [];
        const fields2 = typeof words[j].relatedFields === 'string'
          ? words[j].relatedFields.split(',').map(f => f.trim())
          : [];
        const commonFields = fields1.filter((f: string) => fields2.includes(f));
        totalCommonFields += commonFields.length;
        comparisons++;
      }
    }

    const averageCommon = totalCommonFields / comparisons;
    return Math.min(100, Math.round(averageCommon * 30));
  }

  /**
   * 2つの単語の関連度を取得
   */
  getRelationStrength(
    word1: string,
    word2: string,
    relationships: WordRelationship[]
  ): number {
    const relation = relationships.find((r) => r.word === word1);
    if (!relation) return 0;

    const related = relation.relations.find((r) => r.relatedWord === word2);
    return related?.strength || 0;
  }
}

/**
 * シングルトンインスタンス
 */
export const wordRelationMapper = new WordRelationMapper();
