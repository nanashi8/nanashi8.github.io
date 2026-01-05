import * as fs from 'fs';
import * as path from 'path';

export type NeuralSignalType =
  | 'save'
  | 'precommit:violation'
  | 'precommit:success'
  | 'context:build'
  | 'decision:append';

export interface NeuralSignal {
  timestamp: string; // ISO
  type: NeuralSignalType;
  target?: string; // workspace-relative path
  strength: number; // 0..1
  meta?: Record<string, unknown>;
}

interface SignalDB {
  version: 1;
  signals: NeuralSignal[];
}

export class NeuralSignalStore {
  private workspaceRoot: string;
  private dbPath: string;
  private maxSignals: number;

  constructor(workspaceRoot: string, options?: { maxSignals?: number }) {
    this.workspaceRoot = workspaceRoot;
    this.dbPath = path.join(workspaceRoot, '.vscode', 'neural-signals.json');
    this.maxSignals = options?.maxSignals ?? 2000;
  }

  public load(): SignalDB {
    try {
      if (!fs.existsSync(this.dbPath)) {
        return { version: 1, signals: [] };
      }
      const raw = fs.readFileSync(this.dbPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.version !== 1 || !Array.isArray(parsed?.signals)) {
        return { version: 1, signals: [] };
      }
      return parsed as SignalDB;
    } catch {
      return { version: 1, signals: [] };
    }
  }

  public record(signal: NeuralSignal): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = this.load();
    db.signals.push(signal);

    // truncate
    if (db.signals.length > this.maxSignals) {
      db.signals = db.signals.slice(db.signals.length - this.maxSignals);
    }

    fs.writeFileSync(this.dbPath, JSON.stringify(db, null, 2) + '\n', 'utf-8');
  }

  /**
   * 最新の信号から「起点」候補を推定（時間減衰つき）
   */
  public getHotTargets(options?: { windowHours?: number }): Array<{
    target: string;
    score: number;
    signalTypes: Array<{ type: NeuralSignalType; contribution: number }>;
  }>{
    const windowHours = options?.windowHours ?? 24;
    const now = Date.now();

    // 種類ごとの意味付け（発火モデル）
    // - precommit:violation は強い「注意」信号
    // - decision/context は中〜強
    // - save は弱い「作業中」信号
    const typeWeight: Record<NeuralSignalType, number> = {
      'precommit:violation': 1.0,
      'decision:append': 0.85,
      'context:build': 0.55,
      'precommit:success': 0.25,
      'save': 0.2,
    };

    const db = this.load();
    const scores = new Map<string, number>();
    const counts = new Map<string, number>();
    const typeContributions = new Map<string, Map<NeuralSignalType, number>>();

    for (const s of db.signals) {
      if (!s.target) continue;
      const ts = Date.parse(s.timestamp);
      if (!Number.isFinite(ts)) continue;

      const ageHours = (now - ts) / 36e5;
      if (ageHours < 0 || ageHours > windowHours) continue;

      // exp decay: recent dominates
      const lambda = 0.35;
      const decay = Math.exp(-lambda * ageHours);
      const base = Math.max(0, Math.min(1, s.strength));
      const w = typeWeight[s.type] ?? 0.2;

      // 同一targetの短時間スパムを緩和（sqrtでゆるく減衰）
      const c = (counts.get(s.target) ?? 0) + 1;
      counts.set(s.target, c);
      const repeatDamp = 1 / Math.sqrt(c);

      const add = base * w * decay * repeatDamp;
      scores.set(s.target, (scores.get(s.target) ?? 0) + add);

      // 型別の貢献を記録
      if (!typeContributions.has(s.target)) {
        typeContributions.set(s.target, new Map());
      }
      const tc = typeContributions.get(s.target)!;
      tc.set(s.type, (tc.get(s.type) ?? 0) + add);
    }

    return Array.from(scores.entries())
      .map(([target, score]) => {
        const tc = typeContributions.get(target) || new Map();
        const signalTypes = Array.from(tc.entries())
          .map(([type, contribution]) => ({ type, contribution: Math.round(contribution * 1000) / 1000 }))
          .sort((a, b) => b.contribution - a.contribution);

        return { target, score: Math.round(score * 1000) / 1000, signalTypes };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }
}
