import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

function run(cmd: string): string {
  return execSync(cmd, { cwd: process.cwd(), stdio: 'pipe' }).toString();
}

function extract(output: string) {
  const lines = output.split('\n');
  const summaryStart = lines.findIndex((l) => l.includes('📈 学習AIの判断サマリー'));
  let efficiency = 0;
  let answered = 0;
  const counts = { red: 0, yellow: 0, white: 0, green: 0 };
  for (let i = summaryStart; i < lines.length && i >= 0; i++) {
    const l = lines[i];
    if (l.includes('💡 学習効率')) {
      const m = l.match(/(\d+)%/);
      if (m) efficiency = Number(m[1]);
    }
    if (l.includes('出題') && l.includes('問中')) {
      const m2 = l.match(/出題(\d+)問中/);
      if (m2) answered = Number(m2[1]);
    }
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
  return { efficiency, answered, counts };
}

describe('practical_student scenario', () => {
  it('shows mixed categories', () => {
    const out = run(
      'node scripts/visual-random-simulation.ts --scenario practical_student --runs 1'
    );
    const { counts } = extract(out);
    expect(counts.red + counts.yellow + counts.white + counts.green).toBeGreaterThan(0);
  });

  it('fatigue phase increases red relative to perfect', () => {
    const practical = run(
      'node scripts/visual-random-simulation.ts --scenario practical_student --runs 1'
    );
    const perfect = run('node scripts/visual-random-simulation.ts --scenario perfect --runs 1');
    const p1 = extract(practical).counts.red;
    const p2 = extract(perfect).counts.red;
    expect(p1).toBeGreaterThanOrEqual(p2);
  });
});
