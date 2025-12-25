import { describe, it, expect, beforeEach } from 'vitest';
import {
  ABTestManager,
  createInMemoryABTestStorage,
  type ABTestConfig,
  resetABTestManager,
  getABTestManager
} from '@/ai/experiments/ABTestManager';

describe('ABTestManager', () => {
  let manager: ABTestManager;

  beforeEach(() => {
    const storage = createInMemoryABTestStorage();
    manager = new ABTestManager(storage, 'test_user_123');
  });

  const createTestConfig = (overrides?: Partial<ABTestConfig>): ABTestConfig => ({
    id: 'test_1',
    name: 'Calibration Dashboard Test',
    description: 'Test calibration dashboard effectiveness',
    variants: [
      {
        id: 'control',
        name: 'Control',
        weight: 50,
        description: 'No dashboard',
        features: { showCalibration: false }
      },
      {
        id: 'treatment',
        name: 'Treatment',
        weight: 50,
        description: 'With dashboard',
        features: { showCalibration: true }
      }
    ],
    startDate: new Date('2025-01-01'),
    active: true,
    ...overrides
  });

  describe('registerTest', () => {
    it('should register a valid test', () => {
      const config = createTestConfig();
      manager.registerTest(config);

      const retrieved = manager.getTest('test_1');
      expect(retrieved).toEqual(config);
    });

    it('should reject test with invalid weights', () => {
      const config = createTestConfig({
        variants: [
          {
            id: 'control',
            name: 'Control',
            weight: 60, // Total = 110%
            description: 'Control group',
            features: {}
          },
          {
            id: 'treatment',
            name: 'Treatment',
            weight: 50,
            description: 'Treatment group',
            features: {}
          }
        ]
      });

      expect(() => manager.registerTest(config)).toThrow('must sum to 100');
    });

    it('should allow registering multiple tests', () => {
      manager.registerTest(createTestConfig({ id: 'test_1' }));
      manager.registerTest(createTestConfig({ id: 'test_2' }));

      expect(manager.getTest('test_1')).toBeDefined();
      expect(manager.getTest('test_2')).toBeDefined();
    });
  });

  describe('getActiveTests', () => {
    it('should return only active tests', () => {
      manager.registerTest(createTestConfig({ id: 'active_test', active: true }));
      manager.registerTest(createTestConfig({ id: 'inactive_test', active: false }));

      const activeTests = manager.getActiveTests();
      expect(activeTests).toHaveLength(1);
      expect(activeTests[0].id).toBe('active_test');
    });

    it('should respect start and end dates', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000); // 1日前
      const future = new Date(now.getTime() + 86400000); // 1日後

      // 未開始のテスト
      manager.registerTest(createTestConfig({
        id: 'not_started',
        startDate: future,
        active: true
      }));

      // 終了済みのテスト
      manager.registerTest(createTestConfig({
        id: 'ended',
        startDate: past,
        endDate: past,
        active: true
      }));

      // 実行中のテスト
      manager.registerTest(createTestConfig({
        id: 'running',
        startDate: past,
        active: true
      }));

      const activeTests = manager.getActiveTests();
      expect(activeTests).toHaveLength(1);
      expect(activeTests[0].id).toBe('running');
    });
  });

  describe('getVariant', () => {
    beforeEach(() => {
      manager.registerTest(createTestConfig());
    });

    it('should return null for non-existent test', () => {
      const variant = manager.getVariant('non_existent');
      expect(variant).toBeNull();
    });

    it('should return null for inactive test', () => {
      manager.registerTest(createTestConfig({ id: 'inactive', active: false }));
      const variant = manager.getVariant('inactive');
      expect(variant).toBeNull();
    });

    it('should assign a variant', () => {
      const variant = manager.getVariant('test_1');
      expect(variant).toBeDefined();
      expect(['control', 'treatment']).toContain(variant);
    });

    it('should return consistent variant for same user', () => {
      const variant1 = manager.getVariant('test_1');
      const variant2 = manager.getVariant('test_1');
      expect(variant1).toBe(variant2);
    });

    it('should distribute variants according to weights', () => {
      // 多数のユーザーで分布をテスト
      const counts = { v1: 0, v2: 0, v3: 0 };

      for (let i = 0; i < 1000; i++) {
        // 各ユーザーに独立したストレージを作成
        const storage = createInMemoryABTestStorage();
        const testManager = new ABTestManager(storage, `user_${i}`);

        testManager.registerTest(createTestConfig({
          id: 'weighted_test',
          variants: [
            { id: 'v1', name: 'V1', weight: 50, description: '', features: {} },
            { id: 'v2', name: 'V2', weight: 30, description: '', features: {} },
            { id: 'v3', name: 'V3', weight: 20, description: '', features: {} }
          ]
        }));

        const variant = testManager.getVariant('weighted_test');
        if (variant) {
          counts[variant as keyof typeof counts]++;
        }
      }

      // 誤差±5%を許容
      expect(counts.v1).toBeGreaterThan(450);
      expect(counts.v1).toBeLessThan(550);
      expect(counts.v2).toBeGreaterThan(250);
      expect(counts.v2).toBeLessThan(350);
      expect(counts.v3).toBeGreaterThan(150);
      expect(counts.v3).toBeLessThan(250);
    });
  });

  describe('isFeatureEnabled', () => {
    beforeEach(() => {
      manager.registerTest(createTestConfig());
    });

    it('should return true when feature is enabled', () => {
      // ユーザーをtreatmentに割り当てる（決定論的）
      const variant = manager.getVariant('test_1');

      if (variant === 'treatment') {
        expect(manager.isFeatureEnabled('test_1', 'showCalibration')).toBe(true);
      } else {
        expect(manager.isFeatureEnabled('test_1', 'showCalibration')).toBe(false);
      }
    });

    it('should return false for non-existent feature', () => {
      manager.getVariant('test_1');
      expect(manager.isFeatureEnabled('test_1', 'nonExistentFeature')).toBe(false);
    });

    it('should return false for non-existent test', () => {
      expect(manager.isFeatureEnabled('non_existent', 'someFeature')).toBe(false);
    });
  });

  describe('getAllAssignments', () => {
    it('should return all assignments', () => {
      manager.registerTest(createTestConfig({ id: 'test_1' }));
      manager.registerTest(createTestConfig({ id: 'test_2' }));

      manager.getVariant('test_1');
      manager.getVariant('test_2');

      const assignments = manager.getAllAssignments();
      expect(assignments).toHaveLength(2);
      expect(assignments.map(a => a.testId)).toContain('test_1');
      expect(assignments.map(a => a.testId)).toContain('test_2');
    });

    it('should include assignment timestamps', () => {
      manager.registerTest(createTestConfig());
      manager.getVariant('test_1');

      const assignments = manager.getAllAssignments();
      expect(assignments[0].assignedAt).toBeInstanceOf(Date);
    });
  });

  describe('resetAssignment', () => {
    it('should allow reassigning after reset', () => {
      manager.registerTest(createTestConfig());

      const variant1 = manager.getVariant('test_1');
      manager.resetAssignment('test_1');
      const variant2 = manager.getVariant('test_1');

      // 同じユーザーIDなので同じバリアントになるはず
      expect(variant1).toBe(variant2);
    });
  });

  describe('getABTestManager', () => {
    beforeEach(() => {
      resetABTestManager();
      localStorage.clear();
    });

    it('should return singleton instance', () => {
      const manager1 = getABTestManager();
      const manager2 = getABTestManager();
      expect(manager1).toBe(manager2);
    });

    it('should persist user ID across instances', () => {
      const _manager1 = getABTestManager();
      const userId1 = localStorage.getItem('ab_test_user_id');

      resetABTestManager();

      const _manager2 = getABTestManager();
      const userId2 = localStorage.getItem('ab_test_user_id');

      expect(userId1).toBe(userId2);
      expect(userId1).toBeTruthy();
    });
  });
});
