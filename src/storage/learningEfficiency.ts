/**
 * 学習効率データストレージ
 *
 * 学習効率プロファイルをLocalStorageに保存・読み込み
 */

import type {
  LearningEfficiencyProfile,
  LearningHistoryEntry,
  WordRelationship,
} from '@/types/learningEfficiency';
import { logger } from '@/utils/logger';

const STORAGE_KEY_PREFIX = 'learning-efficiency-';
const PROFILE_KEY = `${STORAGE_KEY_PREFIX}profile`;
const WORD_RELATIONS_KEY = `${STORAGE_KEY_PREFIX}word-relations`;
const HISTORY_MAX_ENTRIES = 1000;

/**
 * 学習効率プロファイルを読み込み
 */
export function loadEfficiencyProfile(): LearningEfficiencyProfile | null {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (!saved) return null;

    const profile = JSON.parse(saved) as LearningEfficiencyProfile;
    logger.info('[LearningEfficiency] プロファイル読み込み成功', {
      score: profile.overallMetrics.efficiencyScore,
      categories: profile.categoryEfficiencies.length,
      historyCount: profile.recentHistory.length,
    });

    return profile;
  } catch (error) {
    logger.error('[LearningEfficiency] プロファイル読み込みエラー', error);
    return null;
  }
}

/**
 * 学習効率プロファイルを保存
 */
export function saveEfficiencyProfile(profile: LearningEfficiencyProfile): void {
  try {
    // 履歴を最新1000件に制限
    if (profile.recentHistory.length > HISTORY_MAX_ENTRIES) {
      profile.recentHistory = profile.recentHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, HISTORY_MAX_ENTRIES);
    }

    profile.updatedAt = Date.now();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    logger.info('[LearningEfficiency] プロファイル保存完了', {
      score: profile.overallMetrics.efficiencyScore,
    });
  } catch (error) {
    logger.error('[LearningEfficiency] プロファイル保存エラー', error);
  }
}

/**
 * 学習履歴エントリーを追加
 */
export function addHistoryEntry(entry: LearningHistoryEntry): void {
  const profile = loadEfficiencyProfile();
  if (!profile) {
    logger.warn('[LearningEfficiency] プロファイルが存在しません');
    return;
  }

  profile.recentHistory.push(entry);
  saveEfficiencyProfile(profile);
}

/**
 * 単語の関連情報を保存
 */
export function saveWordRelations(relations: WordRelationship[]): void {
  try {
    localStorage.setItem(WORD_RELATIONS_KEY, JSON.stringify(relations));
    logger.info('[LearningEfficiency] 関連語データ保存完了', {
      count: relations.length,
    });
  } catch (error) {
    logger.error('[LearningEfficiency] 関連語データ保存エラー', error);
  }
}

/**
 * 単語の関連情報を読み込み
 */
export function loadWordRelations(): WordRelationship[] {
  try {
    const saved = localStorage.getItem(WORD_RELATIONS_KEY);
    if (!saved) return [];

    return JSON.parse(saved) as WordRelationship[];
  } catch (error) {
    logger.error('[LearningEfficiency] 関連語データ読み込みエラー', error);
    return [];
  }
}

/**
 * 特定の単語の関連情報を取得
 */
export function getWordRelation(word: string): WordRelationship | null {
  const relations = loadWordRelations();
  return relations.find((r) => r.word === word) || null;
}

/**
 * 学習効率プロファイルをリセット
 */
export function resetEfficiencyProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    logger.info('[LearningEfficiency] プロファイルリセット完了');
  } catch (error) {
    logger.error('[LearningEfficiency] プロファイルリセットエラー', error);
  }
}

/**
 * 全データをエクスポート
 */
export function exportEfficiencyData(): string {
  const profile = loadEfficiencyProfile();
  const relations = loadWordRelations();

  return JSON.stringify(
    {
      profile,
      relations,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

/**
 * データをインポート
 */
export function importEfficiencyData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);

    if (data.profile) {
      saveEfficiencyProfile(data.profile);
    }

    if (data.relations) {
      saveWordRelations(data.relations);
    }

    logger.info('[LearningEfficiency] データインポート完了');
    return true;
  } catch (error) {
    logger.error('[LearningEfficiency] データインポートエラー', error);
    return false;
  }
}
