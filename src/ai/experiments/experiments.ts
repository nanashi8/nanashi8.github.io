/**
 * ABテストの実験設定
 *
 * 現在実行中のABテストを定義します。
 */

import { getABTestManager } from './ABTestManager';
import type { ABTestConfig } from './ABTestManager';

/**
 * 実験1: キャリブレーションダッシュボードの効果測定
 */
export const CALIBRATION_DASHBOARD_TEST: ABTestConfig = {
  id: 'calibration_dashboard_2025_01',
  name: 'Calibration Dashboard Effectiveness',
  description: 'キャリブレーションダッシュボードがユーザーの学習成果とAI信頼度に与える影響を測定',
  variants: [
    {
      id: 'control',
      name: 'Control (No Dashboard)',
      weight: 50,
      description: 'ダッシュボードなし（従来の体験）',
      features: {
        showCalibrationDashboard: false
      }
    },
    {
      id: 'treatment',
      name: 'Treatment (With Dashboard)',
      weight: 50,
      description: 'キャリブレーションダッシュボード表示',
      features: {
        showCalibrationDashboard: true
      }
    }
  ],
  startDate: new Date('2025-01-01'),
  active: true
};

/**
 * 実験2: 優先度説明の効果測定
 */
export const PRIORITY_EXPLANATION_TEST: ABTestConfig = {
  id: 'priority_explanation_2025_01',
  name: 'Priority Explanation Impact',
  description: '優先度説明バッジがユーザーの理解度とエンゲージメントに与える影響を測定',
  variants: [
    {
      id: 'control',
      name: 'Control (No Explanation)',
      weight: 50,
      description: '優先度スコアのみ表示',
      features: {
        showPriorityExplanation: false
      }
    },
    {
      id: 'treatment',
      name: 'Treatment (With Explanation)',
      weight: 50,
      description: '優先度説明バッジ表示',
      features: {
        showPriorityExplanation: true
      }
    }
  ],
  startDate: new Date('2025-01-01'),
  active: true
};

/**
 * 実験3: 両機能の組み合わせ効果測定
 */
export const COMBINED_FEATURES_TEST: ABTestConfig = {
  id: 'combined_features_2025_01',
  name: 'Combined Features Impact',
  description: 'キャリブレーションダッシュボードと優先度説明の組み合わせ効果を測定',
  variants: [
    {
      id: 'control',
      name: 'Control (Neither)',
      weight: 25,
      description: '両機能なし',
      features: {
        showCalibrationDashboard: false,
        showPriorityExplanation: false
      }
    },
    {
      id: 'calibration_only',
      name: 'Calibration Only',
      weight: 25,
      description: 'キャリブレーションダッシュボードのみ',
      features: {
        showCalibrationDashboard: true,
        showPriorityExplanation: false
      }
    },
    {
      id: 'explanation_only',
      name: 'Explanation Only',
      weight: 25,
      description: '優先度説明のみ',
      features: {
        showCalibrationDashboard: false,
        showPriorityExplanation: true
      }
    },
    {
      id: 'both',
      name: 'Both Features',
      weight: 25,
      description: '両機能あり',
      features: {
        showCalibrationDashboard: true,
        showPriorityExplanation: true
      }
    }
  ],
  startDate: new Date('2025-01-01'),
  active: false // 初期段階では無効化
};

/**
 * ABテストを初期化
 */
export function initializeABTests(): void {
  const manager = getABTestManager();

  // 全テストを登録
  manager.registerTest(CALIBRATION_DASHBOARD_TEST);
  manager.registerTest(PRIORITY_EXPLANATION_TEST);
  manager.registerTest(COMBINED_FEATURES_TEST);
}

/**
 * 特定の機能が有効かチェック
 */
export function isFeatureEnabled(featureName: string): boolean {
  const manager = getABTestManager();

  // 各アクティブなテストをチェック
  const activeTests = manager.getActiveTests();

  for (const test of activeTests) {
    const variantId = manager.getVariant(test.id);
    if (variantId && manager.isFeatureEnabled(test.id, featureName)) {
      return true;
    }
  }

  // デフォルトは全機能有効（ABテストなしの場合）
  return activeTests.length === 0;
}

/**
 * 現在のユーザーの全バリアント割り当てを取得
 */
export function getCurrentAssignments(): Record<string, string> {
  const manager = getABTestManager();
  const assignments: Record<string, string> = {};

  const activeTests = manager.getActiveTests();
  for (const test of activeTests) {
    const variantId = manager.getVariant(test.id);
    if (variantId) {
      assignments[test.id] = variantId;
    }
  }

  return assignments;
}
