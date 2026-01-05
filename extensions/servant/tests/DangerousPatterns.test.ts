import { describe, it, expect } from 'vitest';
import { detectDangerousPatternViolations } from '../src/guard/DangerousPatterns';

describe('detectDangerousPatternViolations', () => {
  it('MemorizationView / QuestionScheduler 変更 + questions.sort を error として検出する', () => {
    const violations = detectDangerousPatternViolations({
      changedFiles: ['src/components/MemorizationView.tsx'],
      diffContent: '+ questions.sort((a,b)=>b.position-a.position)\n',
    });

    expect(violations.some((v) => v.severity === 'error')).toBe(true);
    expect(violations.map((v) => v.message).join('\n')).toContain('バッチ配列');
  });

  it('関係ないファイルの変更ではバッチ関連 error を出さない', () => {
    const violations = detectDangerousPatternViolations({
      changedFiles: ['src/foo/bar.ts'],
      diffContent: '+ questions.sort()\n+ clearExpiredFlags()\n',
    });

    expect(violations.some((v) => v.message.includes('バッチ配列'))).toBe(false);
    expect(violations.some((v) => v.message.includes('clearExpiredFlags'))).toBe(false);
  });

  it('useEffect依存配列の変更を warning として検出する', () => {
    const violations = detectDangerousPatternViolations({
      changedFiles: ['src/components/SpellingView.tsx'],
      diffContent: '+ useEffect(() => {\n+ }, [foo, bar])\n',
    });

    expect(violations.some((v) => v.severity === 'warning')).toBe(true);
    expect(violations.map((v) => v.message).join('\n')).toContain('useEffect');
  });
});
