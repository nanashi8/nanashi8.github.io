---
description: テスト品質保証ガイドライン - AI開発時の必須チェック項目
applyTo: '**/*.{test,spec}.{ts,tsx,js,jsx}'
---

# テスト品質保証ガイドライン

## 🎯 基本原則

### 1. テストは実装の2倍重要

- 実装が変わってもテストが守る
- テストがなければリグレッションを検出できない
- **テスト品質 = プロジェクト品質**

### 2. テストファースト思考

```typescript
// ❌ 実装後にテストを書く
function implement() { ... }
test('works', () => { ... }); // 後付け

// ✅ テストを先に書く
test('should do X when Y', () => { ... });
function implement() { ... } // テストを満たすように実装
```

---

## 📋 実装変更時の必須チェックリスト

### コード変更時（MUST）

```markdown
実装を変更する前に必ず確認：

- [ ] 既存テストを実行（npx vitest run）
- [ ] 関連テストファイルを特定
- [ ] 期待値が変わる場合は更新計画を立てる
- [ ] 新機能には必ずテストを追加
- [ ] 変更後に全テスト実行
- [ ] カバレッジが下がっていないか確認
```

### 閾値・定数変更時（CRITICAL）

```typescript
// 例: 定着判定の閾値を3→5に変更
const CONSOLIDATION_THRESHOLD = 5; // 変更

// 必須: 関連テストをすべて更新
grep -r "CONSOLIDATION_THRESHOLD\|閾値.*3" tests/
// すべてのテストで期待値を3→5に更新
```

---

## 🏗️ テストレベルの明確な区別

### レベル1: 単体テスト（Unit Tests）

**目的**: 単一関数・クラスの動作検証

```typescript
// ✅ 適切な単体テスト
describe('calculatePriority', () => {
  it('returns high priority for recent errors', () => {
    const result = calculatePriority({
      recentErrors: 5,
      lastStudied: Date.now() - 1000,
    });
    expect(result).toBe(10);
  });
});
```

**避けるべき**:

- 複数モジュールの連携をテスト
- 外部API呼び出し
- ファイルI/O
- 複雑な状態セットアップ（6条件など）

### レベル2: 統合テスト（Integration Tests）

**目的**: 複数モジュールの連携検証

```typescript
// ✅ 適切な統合テスト
describe('Learning AI Integration', () => {
  it('updates forgetting curve after correct answer', async () => {
    await memoryAI.processAnswer('word', true);
    const curve = await storage.getForgettingCurve('word');
    expect(curve.nextReview).toBeGreaterThan(Date.now());
  });
});
```

**対象**:

- AI同士の連携（MemoryAI ↔ QuestionScheduler）
- ストレージとの連携
- 複雑な状態遷移
- 6条件定着判定のような複合ロジック

### レベル3: E2Eテスト（End-to-End Tests）

**目的**: ユーザー体験の全体検証

```typescript
// ✅ 適切なE2Eテスト
describe('Complete Learning Flow', () => {
  it('learns a word from first encounter to mastery', async () => {
    // 実際のユーザー操作をシミュレート
    await startSession();
    await answerQuestion('apple', true);
    // ... 複数回の学習
    const mastery = await checkMasteryLevel('apple');
    expect(mastery).toBe('mastered');
  });
});
```

---

## 🎲 非決定的テストの扱い

### ランダム要素を含むテスト

```typescript
// ❌ 単一実行で統計的傾向をテスト
it('fatigue increases errors', () => {
  const result = runSimulation({ fatigue: true });
  expect(result.errors).toBeGreaterThan(baseline.errors);
  // 単一実行では逆転もあり得る
});

// ✅ 複数回実行の平均を取る
it('fatigue increases errors (statistical)', () => {
  const results = Array.from({ length: 10 }, () => runSimulation({ fatigue: true }));
  const avgErrors = mean(results.map((r) => r.errors));
  expect(avgErrors).toBeGreaterThan(baseline.errors);
});

// ✅✅ または決定的なテストに変更
it('fatigue increases error probability', () => {
  const probability = calculateErrorProbability({ fatigue: true });
  expect(probability).toBeGreaterThan(0.5);
  // 計算ロジックのみテスト（決定的）
});
```

### シード値の使用

```typescript
// ✅ 再現可能なランダムテスト
it('generates consistent results with seed', () => {
  const rng = new Random(12345); // 固定シード
  const result1 = runSimulation({ rng });
  const result2 = runSimulation({ rng: new Random(12345) });
  expect(result1).toEqual(result2); // 常に同じ結果
});
```

---

## 🧪 複雑な条件のテスト設計

### 6条件定着判定の例

```typescript
// ❌ 単体テストで6条件すべてをテスト
it('completes acquisition with all conditions', () => {
  // 正答率75%、連続3回、3キュー通過、総6回、直近3回、閾値...
  // 状態セットアップが複雑すぎる
});

// ✅ 各条件を個別にテスト（単体）
describe('Acquisition Conditions', () => {
  it('requires 75% correct rate', () => {
    const progress = { correctRate: 0.74 /* ... */ };
    expect(isComplete(progress)).toBe(false);

    progress.correctRate = 0.75;
    expect(isComplete(progress)).toBe(true);
  });

  it('requires 3 consecutive correct', () => {
    const progress = { consecutiveCorrect: 2 /* ... */ };
    expect(isComplete(progress)).toBe(false);
  });

  // 各条件を個別に検証
});

// ✅✅ 統合テストで全体動作を検証
describe('Acquisition Integration', () => {
  it('completes acquisition in realistic learning flow', async () => {
    const manager = new AcquisitionQueueManager();

    // 実際の学習フローをシミュレート
    manager.enqueueNewWord('word', 4, 'MEMORIZATION');
    for (let i = 0; i < 7; i++) {
      manager.incrementQuestionNumber();
      manager.handleCorrectAnswer('word', getQueue(i), 800);
    }

    const progress = manager.getAcquisitionProgress('word');
    expect(progress.isAcquisitionComplete).toBe(true);
  });
});
```

---

## 📊 テストメトリクスの監視

### 必須メトリクス

```typescript
// テスト実行後に確認
✓ カバレッジ >= 80%
✓ 合格率 >= 95%
✓ 実行時間 < 30秒（単体テスト）
✓ 実行時間 < 3分（統合テスト）
✓ フレーキー率 < 1%（再実行で変わる）
```

### カバレッジ不足の対処

```bash
# カバレッジレポート生成
npm run test:coverage

# 未カバー箇所を確認
open coverage/index.html

# 重要度別に対処
# 🔴 Critical: AIロジック、定着判定
# 🟡 Important: ストレージ、UI
# 🟢 Nice to have: ユーティリティ
```

---

## 🔄 テストメンテナンスプロセス

### 週次チェック

```markdown
毎週金曜日:

- [ ] 全テスト実行（npx vitest run）
- [ ] フレーキーテストの特定（3回実行）
- [ ] カバレッジレポート確認
- [ ] スキップテストのレビュー（it.skip/test.skip）
```

### 月次レビュー

```markdown
毎月最終週:

- [ ] テスト戦略の見直し
- [ ] 不要なテストの削除
- [ ] 統合テスト不足の洗い出し
- [ ] テストドキュメント更新
```

---

## 🚨 絶対に避けるべきアンチパターン

### 1. 実装変更後のテスト無視

```typescript
// ❌ テストを修正せずにコミット
function calculate() {
  return value * 2; // 元は * 3
}
// テストは * 3 を期待したまま → 失敗を放置
```

### 2. テストのためのテスト

```typescript
// ❌ 実装をそのまま複製
it('calculates correctly', () => {
  const result = calculatePriority({ errors: 5, time: 1000 });
  expect(result).toBe(5 * 2 + 1000 / 100); // 実装の複製
});

// ✅ 期待される振る舞いをテスト
it('prioritizes recent errors', () => {
  const high = calculatePriority({ errors: 5, time: 1000 });
  const low = calculatePriority({ errors: 1, time: 1000 });
  expect(high).toBeGreaterThan(low);
});
```

### 3. モックの過度な使用

```typescript
// ❌ すべてをモック
vi.mock('@/storage/progress');
vi.mock('@/ai/memory');
vi.mock('@/utils/time');
// 実際の連携を検証できない

// ✅ 必要最小限のモック
// 外部API・ファイルI/Oのみモック
// 内部モジュールは実物を使用
```

---

## ✅ AI開発時のテストチェックリスト

### 新機能追加時

```markdown
- [ ] 単体テスト: 各関数の正常系・異常系
- [ ] 統合テスト: 既存AIとの連携
- [ ] E2Eテスト: ユーザーシナリオ
- [ ] エッジケース: 境界値・null・undefined
- [ ] パフォーマンステスト: レスポンス時間
- [ ] ドキュメント: テストの意図を明記
```

### リファクタリング時

```markdown
- [ ] 既存テストがすべて通ること
- [ ] テストの期待値を変更していないこと
- [ ] カバレッジが下がっていないこと
- [ ] 新しい実装でも同じ振る舞いをすること
```

### バグ修正時

```markdown
- [ ] バグを再現するテストを追加
- [ ] 修正後にテストが通ること
- [ ] 他の部分に影響していないこと
- [ ] リグレッションテストに追加
```

---

## 📚 参考資料

- テストガイドライン: プロジェクトルートの docs/guidelines/ を参照
- テスト仕様書: プロジェクトルートの docs/specifications/ を参照
- テストメンテナンスプロセス: プロジェクトルートの docs/processes/ を参照
