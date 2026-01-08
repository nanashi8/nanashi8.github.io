// データエクスポート・インポート機能

import { loadProgress, saveProgress } from '@/storage/progress/progressStorage';
import { getAllFromDB, STORES } from '@/storage/indexedDB/indexedDBStorage';
import { getMigrationInfo } from '@/storage/migration/dataMigration';
import { logger } from '@/utils/logger';

// エクスポートデータの型
export interface ExportData {
  version: string;
  exportDate: number;
  progress: any;
  sessionHistory: any[];
  dailyStats: any[];
  settings: any;
}

// 全データをエクスポート
export async function exportAllData(): Promise<string> {
  try {
    const migrationInfo = getMigrationInfo();
    const progress = await loadProgress();

    const exportData: ExportData = {
      version: '1.0',
      exportDate: Date.now(),
      progress,
      sessionHistory: [],
      dailyStats: [],
      settings: {},
    };

    // IndexedDBを使用している場合
    if (migrationInfo.completed && migrationInfo.indexedDBSupported) {
      try {
        exportData.sessionHistory = await getAllFromDB(STORES.SESSION_HISTORY);
        exportData.dailyStats = await getAllFromDB(STORES.DAILY_STATS);

        // 設定データも取得
        const settingsKeys = [
          'user-goal-level',
          'lastLoginDate',
          'loginStreak',
          'radar-improvement-progress',
          'skip-exclude-groups',
        ];

        for (const key of settingsKeys) {
          const value = localStorage.getItem(key);
          if (value) {
            exportData.settings[key] = value;
          }
        }
      } catch {
        logger.warn('IndexedDBデータの取得に失敗、LocalStorageから取得します:');
      }
    }

    // LocalStorageから設定データを取得（フォールバック）
    if (Object.keys(exportData.settings).length === 0) {
      const settingsKeys = [
        'user-goal-level',
        'lastLoginDate',
        'loginStreak',
        'radar-improvement-progress',
        'skip-exclude-groups',
        'daily-plan-target-translation',
        'daily-plan-target-spelling',
        'daily-plan-target-reading',
      ];

      for (const key of settingsKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          exportData.settings[key] = value;
        }
      }
    }

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error('データエクスポートエラー:', error);
    throw new Error('データのエクスポートに失敗しました');
  }
}

// JSONファイルとしてダウンロード
export async function downloadBackup(): Promise<void> {
  try {
    const jsonString = await exportAllData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const filename = `nanashi8-backup-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);

    logger.log(`✅ バックアップ完了: ${filename}`);
  } catch (error) {
    logger.error('バックアップダウンロードエラー:', error);
    alert('バックアップのダウンロードに失敗しました');
  }
}

// データをインポート（復元）
export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString) as ExportData;

    // バージョンチェック
    if (!data.version || !data.progress) {
      throw new Error('無効なバックアップファイルです');
    }

    // 確認ダイアログ
    const confirmed = confirm(
      `バックアップデータを復元しますか？\n\n` +
        `エクスポート日時: ${new Date(data.exportDate).toLocaleString()}\n` +
        `現在のデータは上書きされます。\n\n` +
        `復元前に現在のデータをバックアップすることを推奨します。`
    );

    if (!confirmed) {
      return false;
    }

    // 進捗データを復元
    await saveProgress(data.progress);

    // 設定データを復元
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        localStorage.setItem(key, value as string);
      }
    }

    logger.log('✅ データ復元完了');
    alert('データの復元が完了しました。ページをリロードしてください。');

    return true;
  } catch (error) {
    logger.error('データインポートエラー:', error);
    alert('データの復元に失敗しました。ファイルが破損している可能性があります。');
    return false;
  }
}

// ファイル選択からインポート
export async function importFromFile(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;
        const result = await importData(jsonString);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsText(file);
  });
}

// データサイズを取得（人間が読める形式）
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// エクスポートデータのサイズを取得
export async function getExportDataSize(): Promise<string> {
  try {
    const jsonString = await exportAllData();
    const bytes = new Blob([jsonString]).size;
    return formatBytes(bytes);
  } catch {
    return '不明';
  }
}
