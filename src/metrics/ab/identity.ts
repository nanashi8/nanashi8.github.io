/**
 * anonymousUserId / sessionId 生成
 */

const STORAGE_KEY_ANONYMOUS_USER_ID = 'ab_anonymous_user_id_v1';

/**
 * 匿名ユーザーIDを取得または生成（端末内永続）
 */
export function getOrCreateAnonymousUserId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_ANONYMOUS_USER_ID);
    if (existing) {
      return existing;
    }

    // 新規生成: timestamp + 乱数
    const id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY_ANONYMOUS_USER_ID, id);
    return id;
  } catch {
    // localStorage失敗時はセッション内のみ有効なIDを返す
    console.warn('[AB Identity] localStorage not available, using session-only ID');
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * セッションIDを生成（グローバル一意寄り）
 * 形式: anonymousUserId-timestamp-rand
 */
export function createSessionId(): string {
  const userId = getOrCreateAnonymousUserId();
  const timestamp = Date.now();
  // セキュアな乱数生成（CodeQL推奨）
  const rand = crypto.randomUUID().substring(0, 9);
  return `${userId}-${timestamp}-${rand}`;
}
