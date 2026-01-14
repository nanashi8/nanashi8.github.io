/**
 * ABテスト管理システム
 *
 * 機能の効果測定のためのA/Bテストを管理します。
 * - バリアント割り当て（ユーザーIDベース）
 * - テスト設定の管理
 * - バリアント情報の永続化
 */

export interface ABTestConfig {
  /** テストID（一意識別子） */
  id: string;

  /** テスト名（表示用） */
  name: string;

  /** テストの説明 */
  description: string;

  /** バリアント定義 */
  variants: ABTestVariant[];

  /** 開始日時 */
  startDate: Date;

  /** 終了日時（オプション） */
  endDate?: Date;

  /** アクティブかどうか */
  active: boolean;
}

export interface ABTestVariant {
  /** バリアントID */
  id: string;

  /** バリアント名 */
  name: string;

  /** 割り当て比率（0-100） */
  weight: number;

  /** バリアントの説明 */
  description: string;

  /** 機能フラグ */
  features: Record<string, boolean>;
}

export interface ABTestAssignment {
  /** テストID */
  testId: string;

  /** 割り当てられたバリアントID */
  variantId: string;

  /** 割り当て日時 */
  assignedAt: Date;
}

export interface ABTestStorage {
  getAssignment(testId: string): ABTestAssignment | null;
  setAssignment(assignment: ABTestAssignment): void;
  getAllAssignments(): ABTestAssignment[];
}

/**
 * インメモリストレージ（テスト用）
 */
export function createInMemoryABTestStorage(): ABTestStorage {
  const assignments = new Map<string, ABTestAssignment>();

  return {
    getAssignment(testId: string): ABTestAssignment | null {
      return assignments.get(testId) || null;
    },

    setAssignment(assignment: ABTestAssignment): void {
      assignments.set(assignment.testId, assignment);
    },

    getAllAssignments(): ABTestAssignment[] {
      return Array.from(assignments.values());
    }
  };
}

/**
 * ABテストマネージャー
 */
export class ABTestManager {
  private tests: Map<string, ABTestConfig> = new Map();
  private storage: ABTestStorage;
  private userId: string;

  constructor(storage: ABTestStorage, userId?: string) {
    this.storage = storage;
    // ユーザーIDがない場合は生成（ブラウザセッションで永続化）
    this.userId = userId || this.getOrCreateUserId();
  }

  /**
   * ユーザーIDを取得または生成
   */
  private getOrCreateUserId(): string {
    const storageKey = 'ab_test_user_id';
    let userId = localStorage.getItem(storageKey);

    if (!userId) {
      const token =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID().replace(/-/g, '').slice(0, 9)
          : `${Date.now()}`.slice(-9);
      userId = `user_${Date.now()}_${token}`;
      localStorage.setItem(storageKey, userId);
    }

    return userId;
  }

  /**
   * テストを登録
   */
  registerTest(config: ABTestConfig): void {
    // バリアントの重みの合計が100になることを検証
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Test ${config.id}: Variant weights must sum to 100, got ${totalWeight}`);
    }

    this.tests.set(config.id, config);
  }

  /**
   * テストを取得
   */
  getTest(testId: string): ABTestConfig | undefined {
    return this.tests.get(testId);
  }

  /**
   * すべてのアクティブなテストを取得
   */
  getActiveTests(): ABTestConfig[] {
    const now = new Date();
    return Array.from(this.tests.values()).filter(test => {
      if (!test.active) return false;
      if (test.startDate > now) return false;
      if (test.endDate && test.endDate < now) return false;
      return true;
    });
  }

  /**
   * バリアント割り当て（決定論的ハッシュベース）
   */
  getVariant(testId: string): string | null {
    const test = this.tests.get(testId);
    if (!test || !test.active) {
      return null;
    }

    // 既存の割り当てをチェック
    const existingAssignment = this.storage.getAssignment(testId);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // 新しい割り当てを生成
    const variantId = this.assignVariant(test);

    // 割り当てを保存
    this.storage.setAssignment({
      testId,
      variantId,
      assignedAt: new Date()
    });

    return variantId;
  }

  /**
   * 決定論的にバリアントを割り当て
   */
  private assignVariant(test: ABTestConfig): string {
    // ユーザーIDとテストIDからハッシュを生成
    const hash = this.hashString(`${this.userId}_${test.id}`);

    // ハッシュを0-100の範囲に変換
    const percentage = (hash % 100);

    // 累積重みで割り当て
    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (percentage < cumulative) {
        return variant.id;
      }
    }

    // フォールバック（通常は到達しない）
    return test.variants[0].id;
  }

  /**
   * 文字列を数値ハッシュに変換（シンプルなハッシュ関数）
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  }

  /**
   * 機能フラグをチェック
   */
  isFeatureEnabled(testId: string, featureName: string): boolean {
    const variantId = this.getVariant(testId);
    if (!variantId) return false;

    const test = this.tests.get(testId);
    if (!test) return false;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return false;

    return variant.features[featureName] === true;
  }

  /**
   * すべての割り当てを取得
   */
  getAllAssignments(): ABTestAssignment[] {
    return this.storage.getAllAssignments();
  }

  /**
   * 特定のテストの割り当てをリセット（開発/テスト用）
   */
  resetAssignment(testId: string): void {
    const assignments = this.storage.getAllAssignments();
    const filtered = assignments.filter(a => a.testId !== testId);

    // 全て削除して再登録（簡易的な実装）
    for (const assignment of filtered) {
      this.storage.setAssignment(assignment);
    }
  }
}

/**
 * グローバルABテストマネージャーのインスタンス
 * （シングルトンパターン）
 */
let globalABTestManager: ABTestManager | null = null;

export function getABTestManager(): ABTestManager {
  if (!globalABTestManager) {
    // 本番環境ではlocalStorageベースのストレージを使用
    const storage: ABTestStorage = {
      getAssignment(testId: string): ABTestAssignment | null {
        const key = `ab_test_assignment_${testId}`;
        const data = localStorage.getItem(key);
        if (!data) return null;

        const parsed = JSON.parse(data);
        return {
          ...parsed,
          assignedAt: new Date(parsed.assignedAt)
        };
      },

      setAssignment(assignment: ABTestAssignment): void {
        const key = `ab_test_assignment_${assignment.testId}`;
        localStorage.setItem(key, JSON.stringify(assignment));
      },

      getAllAssignments(): ABTestAssignment[] {
        const assignments: ABTestAssignment[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('ab_test_assignment_')) {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              assignments.push({
                ...parsed,
                assignedAt: new Date(parsed.assignedAt)
              });
            }
          }
        }
        return assignments;
      }
    };

    globalABTestManager = new ABTestManager(storage);
  }

  return globalABTestManager;
}

/**
 * テスト用にマネージャーをリセット
 */
export function resetABTestManager(): void {
  globalABTestManager = null;
}
