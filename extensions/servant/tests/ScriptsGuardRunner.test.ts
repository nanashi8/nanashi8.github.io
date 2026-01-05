import { describe, it, expect } from 'vitest';
import { parseGuardViolationsFromOutput } from '../src/guard/ScriptsGuardRunner';

describe('ScriptsGuardRunner.parseGuardViolationsFromOutput', () => {
  it('CRITICAL/HIGH/MEDIUM を severity にマップできる', () => {
    const logs = [
      '⚠️  [HIGH] useEffect依存配列の変更を検出',
      '🚨 [CRITICAL] バッチ配列の変更を検出！',
      '⚠️  [MEDIUM] 古いプロパティ名の可能性',
    ].join('\n');

    const violations = parseGuardViolationsFromOutput(logs);

    expect(violations.length).toBe(3);
    expect(violations[0].severity).toBe('warning');
    expect(violations[1].severity).toBe('error');
    expect(violations[2].severity).toBe('warning');
  });

  it('"❌ CRITICAL:" 行を error として拾える', () => {
    const logs = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '❌ CRITICAL: 変更前の仕様確認（Specチェック）が未記録/期限切れです',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');

    const violations = parseGuardViolationsFromOutput(logs);

    expect(violations.length).toBe(1);
    expect(violations[0].severity).toBe('error');
    expect(violations[0].message).toContain('Specチェック');
  });

  it('関係ない行は無視できる', () => {
    const logs = ['hello', 'world', '✅ ガードチェック完了'].join('\n');
    const violations = parseGuardViolationsFromOutput(logs);
    expect(violations.length).toBe(0);
  });
});
