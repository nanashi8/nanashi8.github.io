// 学習設定管理モジュール

import { logger } from '@/utils/logger';
import type { StudySettings } from './types';

// デフォルト設定
const DEFAULT_STUDY_SETTINGS: StudySettings = {
  maxReviewCount: 10,
};

/**
 * 学習設定を取得
 */
export function getStudySettings(): StudySettings {
  try {
    const stored = localStorage.getItem('study-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        maxReviewCount: settings.maxReviewCount ?? DEFAULT_STUDY_SETTINGS.maxReviewCount,
      };
    }
  } catch (e) {
    logger.error('学習設定の取得エラー:', e);
  }
  return { ...DEFAULT_STUDY_SETTINGS };
}

/**
 * 学習設定を保存
 */
export function saveStudySettings(settings: StudySettings): boolean {
  try {
    localStorage.setItem('study-settings', JSON.stringify(settings));
    return true;
  } catch (e) {
    logger.error('学習設定の保存エラー:', e);
    return false;
  }
}

/**
 * 学習設定を更新（部分更新対応）
 */
export function updateStudySettings(partialSettings: Partial<StudySettings>): boolean {
  const currentSettings = getStudySettings();
  const newSettings = { ...currentSettings, ...partialSettings };
  return saveStudySettings(newSettings);
}
