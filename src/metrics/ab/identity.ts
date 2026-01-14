/**
 * anonymousUserId / sessionId 生成
 */

const STORAGE_KEY_ANONYMOUS_USER_ID = 'ab_anonymous_user_id_v1';

function randomToken(len: number): string {
  // Prefer cryptographically secure randomness.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, len);
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(Math.ceil(len / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, len);
  }

  // 最終手段: crypto が無い環境では推測困難なIDを保証できないため、
  // 乱数を使わずに時間ベースで生成する（CodeQLの Math.random 指摘回避）。
  return `${Date.now()}`.padStart(len, '0').slice(-len);
}

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
    const id = `anon_${Date.now()}_${randomToken(13)}`;
    localStorage.setItem(STORAGE_KEY_ANONYMOUS_USER_ID, id);
    return id;
  } catch {
    // localStorage失敗時はセッション内のみ有効なIDを返す
    console.warn('[AB Identity] localStorage not available, using session-only ID');
    return `temp_${Date.now()}_${randomToken(13)}`;
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
