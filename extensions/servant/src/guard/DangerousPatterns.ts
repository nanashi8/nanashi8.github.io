import type { GuardViolation } from './GuardTypes';

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

export function detectDangerousPatternViolations(options: {
  changedFiles: string[];
  diffContent: string;
}): GuardViolation[] {
  const changedFiles = options.changedFiles.map(normalizePath);
  const diff = options.diffContent || '';

  const violations: GuardViolation[] = [];

  const batchRelated = changedFiles.some((f) => /(MemorizationView|QuestionScheduler)/.test(f));
  if (batchRelated) {
    if (/questions\.(sort|splice|push|unshift|reverse)/.test(diff)) {
      violations.push({
        severity: 'error',
        message: 'バッチ配列の変更を検出！（バッチ確定後は配列を変更してはいけません）',
        suggestedActions: ['.aitk/instructions/batch-system-enforcement.instructions.md を確認してください'],
      });
    }

    if (/clearExpiredFlags/.test(diff)) {
      violations.push({
        severity: 'error',
        message: 'clearExpiredFlags 使用を検出！（useCategorySlots=true時は無効化が必要です）',
        suggestedActions: ['.aitk/instructions/batch-system-enforcement.instructions.md を確認してください'],
      });
    }

    if (/(reSchedule|reschedule|再スケジュール)/.test(diff)) {
      violations.push({
        severity: 'error',
        message: '再スケジューリング使用を検出！（バッチ方式では再スケジューリングは禁止です）',
        suggestedActions: ['.aitk/instructions/batch-system-enforcement.instructions.md を確認してください'],
      });
    }
  }

  if (/useEffect[\s\S]*\[/.test(diff)) {
    violations.push({
      severity: 'warning',
      message: 'useEffect依存配列の変更を検出（無限ループの危険性があります）',
      suggestedActions: ['state更新とuseEffect実行の因果関係を確認してください'],
    });
  }

  if (/(correctCount|incorrectCount|attemptCount)/.test(diff) && !/(memorizationCorrect|memorizationAttempts)/.test(diff)) {
    violations.push({
      severity: 'warning',
      message: '古いプロパティ名の可能性（正: memorizationCorrect, memorizationAttempts）',
      suggestedActions: ['型定義ファイルを確認してください'],
    });
  }

  return violations;
}
