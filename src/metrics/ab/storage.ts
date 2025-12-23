/**
 * A/Bテストログの localStorage 保存/読込
 */

import type { SessionLog } from './types';

const STORAGE_KEY_SESSION_LOGS = 'ab_session_logs_v1';
const MAX_SESSIONS = 300; // 最新300セッションまで保持

/**
 * セッションログを追加（保持数を超えたら古いものから削除）
 */
export function appendSessionLog(log: SessionLog): void {
  try {
    const logs = loadSessionLogs();
    logs.push(log);

    // 保持数を超えたら古い順に削除
    if (logs.length > MAX_SESSIONS) {
      logs.splice(0, logs.length - MAX_SESSIONS);
    }

    localStorage.setItem(STORAGE_KEY_SESSION_LOGS, JSON.stringify(logs));
  } catch (error) {
    console.error('[AB Storage] Failed to append session log:', error);
  }
}

/**
 * 全セッションログを読み込み
 */
export function loadSessionLogs(): SessionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION_LOGS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[AB Storage] Failed to load session logs:', error);
    return [];
  }
}

/**
 * セッションログをJSON文字列としてエクスポート
 */
export function exportSessionLogsAsJson(): string {
  const logs = loadSessionLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * セッションログをクリア（デバッグ用）
 */
export function clearSessionLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION_LOGS);
  } catch (error) {
    console.error('[AB Storage] Failed to clear session logs:', error);
  }
}
