/**
 * sessionKpi.ts
 * セッション内KPIの簡易ロガー（開発用）。
 * - 再出題率（2回以上出題）
 * - 再出題ラグ（不正解→次回出題までの問数）
 * - 新規:復習の比率（近似は拡張で対応）
 */

type ItemStats = {
  timesShown: number;
  timesWrong: number;
  lastWrongIndex?: number;
  lags: number[];
  readds: number;
};

class SessionKpi {
  private map = new Map<string, ItemStats>();
  private seqIndex = 0;
  private startedAt = Date.now();

  reset() {
    this.map.clear();
    this.seqIndex = 0;
    this.startedAt = Date.now();
  }

  onShown(id: string) {
    const s = this.map.get(id) || { timesShown: 0, timesWrong: 0, lags: [], readds: 0 };
    s.timesShown += 1;
    this.map.set(id, s);
    this.seqIndex += 1;
  }

  onAnswer(id: string, isCorrect: boolean) {
    const s = this.map.get(id) || { timesShown: 0, timesWrong: 0, lags: [], readds: 0 };
    if (!isCorrect) {
      s.timesWrong += 1;
      s.lastWrongIndex = this.seqIndex;
    } else if (s.lastWrongIndex !== undefined) {
      const lag = Math.max(0, this.seqIndex - s.lastWrongIndex);
      s.lags.push(lag);
      s.lastWrongIndex = undefined;
    }
    this.map.set(id, s);
  }

  onReAdd(id: string) {
    const s = this.map.get(id) || { timesShown: 0, timesWrong: 0, lags: [], readds: 0 };
    s.readds += 1;
    this.map.set(id, s);
  }

  summarize() {
    const items = Array.from(this.map.values());
    const total = items.length;
    const shownTwice = items.filter((x) => x.timesShown >= 2).length;
    const reappearanceRate = total > 0 ? shownTwice / total : 0;
    const allLags = items.flatMap((x) => x.lags);
    const medianLag = allLags.length
      ? [...allLags].sort((a, b) => a - b)[Math.floor(allLags.length / 2)]
      : 0;
    const p90Lag = allLags.length
      ? [...allLags].sort((a, b) => a - b)[Math.floor(allLags.length * 0.9)]
      : 0;
    return {
      totalItems: total,
      reappearanceRate,
      medianLag,
      p90Lag,
      durationSec: Math.round((Date.now() - this.startedAt) / 1000),
    };
  }
}

export const sessionKpi = new SessionKpi();
