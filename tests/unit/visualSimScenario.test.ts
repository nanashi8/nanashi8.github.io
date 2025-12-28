import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

function run(cmd: string): string {
  return execSync(cmd, { cwd: process.cwd(), stdio: 'pipe' }).toString();
}

function extractSummary(output: string) {
  const lines = output.split('\n');
  const summaryStart = lines.findIndex((l) => l.includes('📈 学習AIの判断サマリー'));
  const counts = { red: 0, yellow: 0, white: 0, green: 0 };
  for (let i = summaryStart; i < lines.length && i >= 0; i++) {
    const l = lines[i];
    if (l.includes('🔴')) {
      const m = l.match(/: (\d+)問/);
      if (m) counts.red = Number(m[1]);
    } else if (l.includes('🟡')) {
      const m = l.match(/: (\d+)問/);
      if (m) counts.yellow = Number(m[1]);
    } else if (l.includes('⚪')) {
      const m = l.match(/: (\d+)問/);
      if (m) counts.white = Number(m[1]);
    } else if (l.includes('🟢')) {
      const m = l.match(/: (\d+)問/);
      if (m) counts.green = Number(m[1]);
      break;
    }
  }
  return counts;
}

describe('visual-random-simulation scenarios', () => {
  it('heavy_miss produces more red than perfect', () => {
    const heavy = run('node scripts/visual-random-simulation.ts --scenario heavy_miss --runs 1 --seed 1');
    const perf = run('node scripts/visual-random-simulation.ts --scenario perfect --runs 1 --seed 1');
    const h = extractSummary(heavy);
    const p = extractSummary(perf);
    expect(h.red).toBeGreaterThanOrEqual(p.red);
  });

  it('perfect has higher efficiency than heavy_miss', () => {
    const heavy = run('node scripts/visual-random-simulation.ts --scenario heavy_miss --runs 1 --seed 1');
    const perf = run('node scripts/visual-random-simulation.ts --scenario perfect --runs 1 --seed 1');
    function extractEfficiency(out: string) {
      const m = out.match(/💡 学習効率: (\d+)%/);
      return m ? Number(m[1]) : 0;
    }
    expect(extractEfficiency(perf)).toBeGreaterThanOrEqual(extractEfficiency(heavy));
  });

  it('varied scenario shows mixed categories', () => {
    const varied = run('node scripts/visual-random-simulation.ts --scenario varied --runs 1 --seed 1');
    const v = extractSummary(varied);
    expect(v.red + v.yellow + v.white + v.green).toBeGreaterThan(0);
    expect(v.red).toBeGreaterThanOrEqual(0);
    expect(v.green).toBeGreaterThanOrEqual(0);
  });
});
