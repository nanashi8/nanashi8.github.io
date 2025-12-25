/**
 * デバッグチェックポイント管理クラス
 * まだまだ語のデータフロー追跡用
 */

interface CheckpointData {
  checkpoint: string;
  label: string;
  timestamp: string;
  performanceTime: number;
  weakWordsCount: number;
  totalCount: number;
  prevCheckpoint?: string;
  timeDiffFromPrev?: number;
}

interface CheckpointHistory {
  [key: string]: CheckpointData;
}

export class DebugCheckpoint {
  private static STORAGE_KEY = 'debug_checkpoint_history';

  /**
   * チェックポイントを記録
   * @param id チェックポイントID (例: "M_1", "S_1", "G_1")
   * @param label 説明ラベル (例: "scheduler入力直前")
   * @param weakWordsCount まだまだ語の数
   * @param totalCount 全単語数
   * @param prevCheckpointId 前のチェックポイントID（差分計算用）
   * @param weakWordsList オプション: まだまだ語のリスト（TOP5表示用）
   */
  static record(
    id: string,
    label: string,
    weakWordsCount: number,
    totalCount: number,
    prevCheckpointId?: string,
    weakWordsList?: string[]
  ): void {
    if (!import.meta.env.DEV) return;

    const now = performance.now();
    const timestamp = new Date().toISOString();
    const timeOnly = timestamp.split('T')[1]; // HH:mm:ss.sssZ

    // 前のチェックポイントとの差分を計算
    let timeDiff: number | undefined;
    let prevData: CheckpointData | undefined;

    if (prevCheckpointId) {
      prevData = this.get(prevCheckpointId);
      if (prevData) {
        timeDiff = now - prevData.performanceTime;
      }
    }

    // コンソール出力
    const timeDiffStr =
      timeDiff !== undefined ? `, Δ${timeDiff.toFixed(2)}ms from ${prevCheckpointId}` : '';
    console.log(
      `🚨 [${id}: ${label} ${timeOnly}] total: ${totalCount}語, まだまだ語: ${weakWordsCount}語 (time: ${now.toFixed(2)}ms${timeDiffStr})`
    );

    // まだまだ語リストがあればTOP5を表示
    if (weakWordsList && weakWordsList.length > 0) {
      console.log(`🚨 [${id}] まだまだ語TOP5:`, weakWordsList.slice(0, 5));
    }

    // localStorageに保存
    const data: CheckpointData = {
      checkpoint: id,
      label,
      timestamp,
      performanceTime: now,
      weakWordsCount,
      totalCount,
      prevCheckpoint: prevCheckpointId,
      timeDiffFromPrev: timeDiff,
    };

    this.save(id, data);
  }

  /**
   * チェックポイントデータを取得
   */
  private static get(id: string): CheckpointData | undefined {
    try {
      const history = this.getHistory();
      return history[id];
    } catch {
      return undefined;
    }
  }

  /**
   * チェックポイントデータを保存
   */
  private static save(id: string, data: CheckpointData): void {
    try {
      const history = this.getHistory();
      history[id] = data;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch {
      // localStorage失敗は無視
    }
  }

  /**
   * 全履歴を取得
   */
  private static getHistory(): CheckpointHistory {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * 全履歴をクリア
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // LocalStorageアクセスエラーを無視
    }
  }

  /**
   * フローサマリーを生成（デバッグパネル用）
   */
  static getFlowSummary(): string {
    const history = this.getHistory();
    const checkpoints = Object.values(history).sort(
      (a, b) => a.performanceTime - b.performanceTime
    );

    if (checkpoints.length === 0) {
      return 'チェックポイントデータなし';
    }

    let summary = '## 🔍 データフロー追跡\n\n';
    summary += '| CP | Label | Time | まだまだ語 | Δ時間 | 状態 |\n';
    summary += '|---|---|---|---|---|---|\n';

    checkpoints.forEach((cp, index) => {
      const status =
        cp.weakWordsCount === 0
          ? '❌ 消失'
          : index > 0 && cp.weakWordsCount < checkpoints[index - 1].weakWordsCount
            ? '⚠️ 減少'
            : '✅ 正常';
      const timeDiff = cp.timeDiffFromPrev ? `${cp.timeDiffFromPrev.toFixed(2)}ms` : '-';

      summary += `| ${cp.checkpoint} | ${cp.label} | ${cp.timestamp.split('T')[1]} | ${cp.weakWordsCount}語 | ${timeDiff} | ${status} |\n`;
    });

    return summary;
  }
}
