/**
 * セッション自動保存とアップデート通知マネージャー
 * 生徒の学習継続性を保証する
 */

interface SessionSnapshot {
  tab: string;
  timestamp: number;
  scrollPos: number;
  quizState?: Record<string, unknown>;
}

class SessionManager {
  private sessionKey = '_app_session_state';
  private updateCheckIntervalMs = 5 * 60 * 1000; // 5分

  /**
   * セッション状態を自動保存（定期的に）
   */
  startAutoSave(getState: () => SessionSnapshot) {
    // 最初に即座に保存
    this.saveSession(getState());

    // その後、定期的に保存（30秒ごと）
    setInterval(() => {
      this.saveSession(getState());
    }, 30 * 1000);

    // ページを離れる際にも保存
    window.addEventListener('beforeunload', () => {
      this.saveSession(getState());
    });
  }

  /**
   * セッション状態を復元
   */
  restoreSession(): SessionSnapshot | null {
    try {
      const saved = sessionStorage.getItem(this.sessionKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved) as SessionSnapshot;
      // 古いセッション（1時間以上前）は破棄
      if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
        sessionStorage.removeItem(this.sessionKey);
        return null;
      }
      return parsed;
    } catch (error) {
      console.warn('Failed to restore session:', error);
      return null;
    }
  }

  /**
   * セッション状態を保存
   */
  private saveSession(state: SessionSnapshot) {
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  /**
   * アップデート通知をリッスン（UIに通知）
   */
  onUpdateAvailable(callback: (timestamp: string) => void) {
    window.addEventListener('sw-update-available', () => {
      callback(new Date().toLocaleTimeString('ja-JP'));
    });
  }

  /**
   * 新しいバージョンの適用（即座 or 学習終了後）
   */
  applyUpdate(immediate = false) {
    if (immediate) {
      // 即座に更新を適用
      window.location.reload();
    } else {
      // 通知を表示（更新確認ボタン付き）
      console.log('新しいバージョンが利用可能です。学習終了後に更新されます。');
    }
  }

  /**
   * セッション記録を削除
   */
  clearSession() {
    sessionStorage.removeItem(this.sessionKey);
  }
}

export const sessionManager = new SessionManager();
