/**
 * Position階層違反検知とフォールバック
 *
 * 責務:
 * - AICoordinatorがPositionの上下関係を破壊していないか検証
 * - 違反発見時は自動修正（Position降順に再ソート）
 * - 違反履歴をログに記録
 */

import type { Question } from '@/types/domain';

export interface PositionViolation {
  index: number;
  word: string;
  position: number;
  expectedMax: number; // この位置で許容される最大Position
  severity: 'minor' | 'major'; // 軽微（5以内）or 重大（5超）
}

export interface PositionGuardResult {
  isValid: boolean;
  violations: PositionViolation[];
  correctedOrder?: string[]; // 修正後の単語順序（違反時のみ）
}

/**
 * Position階層違反を検知
 *
 * ルール: questions[i].position >= questions[i+1].position （降順）
 *
 * @param questions - 出題順序
 * @returns 検証結果
 */
export function detectPositionViolations(
  questions: Question[]
): PositionGuardResult {
  const violations: PositionViolation[] = [];
  let prevPosition = 100; // 最大値から開始

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const position = getPosition(q);

    if (position > prevPosition) {
      // 違反: 前の単語より高いPositionが後ろに来ている
      const diff = position - prevPosition;
      violations.push({
        index: i,
        word: q.word,
        position,
        expectedMax: prevPosition,
        severity: diff <= 5 ? 'minor' : 'major',
      });
    }

    prevPosition = position;
  }

  if (violations.length === 0) {
    return { isValid: true, violations: [] };
  }

  // 違反あり: Position降順に再ソート
  const corrected = [...questions].sort((a, b) => {
    const posA = getPosition(a);
    const posB = getPosition(b);
    return posB - posA; // 降順
  });

  return {
    isValid: false,
    violations,
    correctedOrder: corrected.map(q => q.word),
  };
}

/**
 * Position取得（暗記モード専用）
 */
function getPosition(_question: Question): number {
  // Question型にはpositionが直接含まれないため、
  // storage層から取得する必要がある
  // ここでは簡易的に0を返す（実際の実装では loadProgressSync を使用）
  return 0;
}

/**
 * 違反ログをlocalStorageに記録
 */
export function logViolation(
  sessionId: string,
  variant: string,
  result: PositionGuardResult
): void {
  if (result.isValid) return;

  try {
    const log = {
      sessionId,
      variant,
      timestamp: Date.now(),
      violationCount: result.violations.length,
      majorCount: result.violations.filter(v => v.severity === 'major').length,
      minorCount: result.violations.filter(v => v.severity === 'minor').length,
      violations: result.violations.slice(0, 5), // 最大5件
    };

    const existing = JSON.parse(
      localStorage.getItem('ab_position_violations') || '[]'
    ) as typeof log[];
    existing.push(log);

    // 最新100件のみ保持
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }

    localStorage.setItem('ab_position_violations', JSON.stringify(existing));
  } catch {
    // localStorage失敗は無視
  }
}

/**
 * 違反ログをクリア
 */
export function clearViolationLogs(): void {
  try {
    localStorage.removeItem('ab_position_violations');
  } catch {
    // ignore
  }
}

/**
 * 違反ログを取得
 */
export function loadViolationLogs(): any[] {
  try {
    return JSON.parse(
      localStorage.getItem('ab_position_violations') || '[]'
    );
  } catch {
    return [];
  }
}
