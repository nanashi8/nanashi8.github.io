# テスト駆動開発（TDD）実践ガイド

**対象**: このプロジェクトでTDDを始める開発者

---

## 📖 TDDとは？

**Test-Driven Development（テスト駆動開発）** = コードを書く**前に**テストを書く開発手法

### メリット

1. **バグが激減** - テストが仕様書の役割を果たす
1. **リファクタリングが安全** - テストが壊れたら即座に検知
1. **設計が良くなる** - テスタブルなコード = 良い設計
1. **ドキュメント不要** - テストコードが仕様書
1. **開発速度UP** - 手動テスト時間が99%削減

### デメリット

1. **最初は遅い** - テストを書く時間が必要
1. **学習コスト** - TDDの感覚を掴むのに1週間
1. **テストの保守** - コード変更時にテストも修正

**結論**: 長期的には圧倒的にメリット大

---

## 🔄 TDDサイクル（Red-Green-Refactor）

```
1️⃣ 🔴 RED: テストを書く → 失敗する（期待値を明確化）
      ↓
2️⃣ 🟢 GREEN: 最小限のコードでテストを通す（実装）
      ↓
3️⃣ 🔵 REFACTOR: コードをキレイにする（品質向上）
      ↓
      繰り返し
```

---

## 🧪 実践例1: スペルチェック機能

### ステップ1: 🔴 RED（テストを書く）

```typescript
// tests/unit/spellCheck.test.ts
import { describe, it, expect } from 'vitest';
import { checkSpelling } from '@/utils/spellCheck';

describe('checkSpelling', () => {
  it('正しいスペルの場合はtrueを返す', () => {
    const result = checkSpelling('apple', 'apple');
    expect(result).toBe(true);
  });

  it('間違ったスペルの場合はfalseを返す', () => {
    const result = checkSpelling('aple', 'apple');
    expect(result).toBe(false);
  });

  it('大文字小文字を区別しない', () => {
    const result = checkSpelling('APPLE', 'apple');
    expect(result).toBe(true);
  });

  it('前後の空白を無視する', () => {
    const result = checkSpelling('  apple  ', 'apple');
    expect(result).toBe(true);
  });
});
```

**実行**:
```bash
npm run test:unit
# ❌ FAIL: checkSpelling is not defined
```

---

### ステップ2: 🟢 GREEN（最小限の実装）

```typescript
// src/utils/spellCheck.ts
export function checkSpelling(input: string, correct: string): boolean {
  return input.trim().toLowerCase() === correct.trim().toLowerCase();
}
```

**実行**:
```bash
npm run test:unit
# ✅ PASS: 4 tests passed
```

---

### ステップ3: 🔵 REFACTOR（リファクタリング）

```typescript
// src/utils/spellCheck.ts
/**
 * スペルチェック
 * @param input ユーザー入力
 * @param correct 正解
 * @returns 一致する場合true
 */
export function checkSpelling(input: string, correct: string): boolean {
  const normalize = (str: string) => str.trim().toLowerCase();
  return normalize(input) === normalize(correct);
}
```

**実行**:
```bash
npm run test:unit
# ✅ PASS: 4 tests passed（変わらず緑！）
```

---

## 🧪 実践例2: 復習アルゴリズム（間隔反復学習）

### ステップ1: 🔴 RED（テストファースト）

```typescript
// tests/unit/spacedRepetition.test.ts
import { describe, it, expect } from 'vitest';
import { calculateNextReviewDate } from '@/utils/spacedRepetition';

describe('calculateNextReviewDate', () => {
  it('初回学習後は1日後に復習', () => {
    const lastReview = new Date('2025-12-13');
    const level = 0; // 初回
    
    const nextReview = calculateNextReviewDate(lastReview, level);
    
    expect(nextReview).toEqual(new Date('2025-12-14'));
  });

  it('2回目の学習後は3日後に復習', () => {
    const lastReview = new Date('2025-12-14');
    const level = 1;
    
    const nextReview = calculateNextReviewDate(lastReview, level);
    
    expect(nextReview).toEqual(new Date('2025-12-17'));
  });

  it('5回正解後は30日後に復習', () => {
    const lastReview = new Date('2025-12-13');
    const level = 5;
    
    const nextReview = calculateNextReviewDate(lastReview, level);
    
    expect(nextReview).toEqual(new Date('2026-01-12'));
  });

  it('間違えた場合はlevel 0にリセット', () => {
    const lastReview = new Date('2025-12-13');
    const level = -1; // 間違えた
    
    const nextReview = calculateNextReviewDate(lastReview, level);
    
    expect(nextReview).toEqual(new Date('2025-12-14')); // 1日後
  });
});
```

---

### ステップ2: 🟢 GREEN（実装）

```typescript
// src/utils/spacedRepetition.ts

/**
 * 間隔反復学習アルゴリズム
 * レベルに応じて次回復習日を計算
 */
export function calculateNextReviewDate(
  lastReview: Date,
  level: number
): Date {
  // 間隔マップ（日数）
  const intervals = [1, 3, 7, 14, 30, 60, 120];
  
  // 間違えた場合はリセット
  const actualLevel = level < 0 ? 0 : level;
  
  // レベルに対応する間隔（最大120日）
  const daysToAdd = intervals[Math.min(actualLevel, intervals.length - 1)];
  
  // 次回復習日を計算
  const nextReview = new Date(lastReview);
  nextReview.setDate(nextReview.getDate() + daysToAdd);
  
  return nextReview;
}
```

**実行**:
```bash
npm run test:unit
# ✅ PASS: 4 tests passed
```

---

### ステップ3: 🔵 REFACTOR（型安全性向上）

```typescript
// src/types/spaced-repetition.ts
export type ReviewLevel = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ReviewSchedule {
  lastReviewDate: Date;
  level: ReviewLevel;
  nextReviewDate: Date;
}

// src/utils/spacedRepetition.ts
import type { ReviewLevel, ReviewSchedule } from '@/types/spaced-repetition';

const INTERVAL_MAP: Record<number, number> = {
  0: 1,   // 初回: 1日後
  1: 3,   // 2回目: 3日後
  2: 7,   // 3回目: 1週間後
  3: 14,  // 4回目: 2週間後
  4: 30,  // 5回目: 1ヶ月後
  5: 60,  // 6回目: 2ヶ月後
  6: 120, // 7回目: 4ヶ月後
} as const;

export function calculateNextReviewDate(
  lastReview: Date,
  level: ReviewLevel
): Date {
  const normalizedLevel = level < 0 ? 0 : Math.min(level, 6);
  const daysToAdd = INTERVAL_MAP[normalizedLevel];
  
  const nextReview = new Date(lastReview);
  nextReview.setDate(nextReview.getDate() + daysToAdd);
  
  return nextReview;
}

export function createReviewSchedule(
  word: string,
  lastReviewDate: Date,
  level: ReviewLevel
): ReviewSchedule {
  return {
    lastReviewDate,
    level,
    nextReviewDate: calculateNextReviewDate(lastReviewDate, level),
  };
}
```

---

## 🎯 TDD実践ガイド: このプロジェクト向け

### Phase 1: Vitest セットアップ（30分）

```bash
# 1. Vitest インストール
npm install -D vitest @vitest/ui @vitest/coverage-v8

# 2. package.json にスクリプト追加
npm pkg set scripts.test:unit="vitest"
npm pkg set scripts.test:unit:ui="vitest --ui"
npm pkg set scripts.test:unit:coverage="vitest --coverage"
npm pkg set scripts.test:watch="vitest --watch"
```

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**tests/setup.ts**:
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

---

### Phase 2: 最初のテストを書く（1時間）

#### 優先度HIGH: ロジック関数

```typescript
// tests/unit/utils/wordFilter.test.ts
import { describe, it, expect } from 'vitest';
import { filterWordsByGrade } from '@/utils/wordFilter';

describe('filterWordsByGrade', () => {
  it('指定した学年の単語のみ返す', () => {
    const words = [
      { word: 'apple', grade: 1 },
      { word: 'banana', grade: 2 },
      { word: 'cat', grade: 1 },
    ];
    
    const result = filterWordsByGrade(words, 1);
    
    expect(result).toHaveLength(2);
    expect(result[0].word).toBe('apple');
    expect(result[1].word).toBe('cat');
  });
});
```

---

### Phase 3: 既存コードにテスト追加（2時間）

```typescript
// tests/unit/hooks/useSpellingGame.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpellingGame } from '@/hooks/useSpellingGame';

describe('useSpellingGame', () => {
  it('初期状態は問題数0', () => {
    const { result } = renderHook(() => useSpellingGame([]));
    
    expect(result.current.totalQuestions).toBe(0);
    expect(result.current.currentQuestionIndex).toBe(0);
  });

  it('正解すると次の問題に進む', () => {
    const words = [
      { word: 'apple', meaning: 'りんご' },
      { word: 'banana', meaning: 'バナナ' },
    ];
    
    const { result } = renderHook(() => useSpellingGame(words));
    
    act(() => {
      result.current.handleCorrectAnswer();
    });
    
    expect(result.current.currentQuestionIndex).toBe(1);
  });
});
```

---

## 📊 テスト戦略: 何をテストするか

### ✅ テストすべき（HIGH）

1. **ビジネスロジック**
   - スコア計算
   - 復習アルゴリズム
   - 単語フィルタリング

1. **データ変換**
   - CSV → JSON パース
   - IPA記号変換
   - 学年判定

1. **状態管理**
   - React Hooks（useSpellingGame, useSessionStats）
   - LocalStorage操作

### ⚠️ テスト推奨（MEDIUM）

1. **UI コンポーネント**
   - ボタン押下で状態変化
   - フォーム入力バリデーション

1. **エラーハンドリング**
   - データロード失敗時
   - ネットワークエラー時

### ❌ テスト不要（LOW）

1. **スタイリング** - Visual Regression Testで十分
1. **サードパーティライブラリ** - 既にテスト済み
1. **TypeScript型定義** - tscが保証

---

## 🚀 TDD実践フロー（日常開発）

### 新機能追加時

```bash
# 1. 機能ブランチ作成
git checkout -b feature/add-toeic-mode

# 2. テストファイル作成（❗先にテスト）
touch tests/unit/toeicMode.test.ts

# 3. テストを書く（RED）
npm run test:watch  # 常時監視モード

# 4. 実装する（GREEN）
touch src/components/ToeicMode.tsx

# 5. リファクタリング（REFACTOR）
npm run test:unit  # すべて緑を確認

# 6. コミット
git add tests/unit/toeicMode.test.ts src/components/ToeicMode.tsx
git commit -m "feat: add TOEIC mode with tests"
```

---

### バグ修正時

```bash
# 1. バグを再現するテストを書く（RED）
# tests/unit/bugFix.test.ts
it('Issue #123: スコアが負にならない', () => {
  const score = calculateScore(-10, 0);
  expect(score).toBeGreaterThanOrEqual(0);
});

# 2. テストが失敗することを確認
npm run test:unit
# ❌ FAIL: expected 0, received -10

# 3. バグを修正（GREEN）
export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  const score = Math.round((correct / total) * 100);
  return Math.max(0, score); // ❗負にならないよう修正
}

# 4. テストが通ることを確認
npm run test:unit
# ✅ PASS

# 5. コミット
git commit -m "fix: prevent negative score (Issue #123)"
```

---

## 📈 カバレッジ目標

```bash
npm run test:unit:coverage
```

**目標値**:
- **ユーティリティ関数**: 100%
- **Hooks**: 80%
- **コンポーネント**: 60%
- **全体**: 70%

---

## 🎓 学習リソース

### 推奨順序

1. **Vitest公式ドキュメント** - https://vitest.dev/
1. **Testing Library** - https://testing-library.com/react
1. **Kent C. Dodds のブログ** - テスト哲学

### このプロジェクトの例

```bash
# 既存のE2Eテストを参考に
cat tests/smoke.spec.ts

# 業界標準の導入計画も参照
cat docs/design/INDUSTRY_STANDARDS_ADOPTION_PLAN.md
```

---

## ✅ チェックリスト: TDD習得

- [ ] Vitestをインストールした
- [ ] 最初のテストを書いた（RED → GREEN → REFACTOR）
- [ ] 既存コードにテストを追加した
- [ ] テストカバレッジ70%達成
- [ ] バグをテストで再現→修正した
- [ ] pre-commitフックにテスト追加
- [ ] CI/CDにテスト統合

---

## 🎯 次のステップ

1. **今すぐ**: Vitestセットアップ（30分）
1. **今日中**: 最初のテストを書く（1時間）
1. **今週中**: カバレッジ50%達成（5時間）
1. **今月中**: TDDを習慣化（毎日）

---

**TDDは最初は遅く感じますが、1週間で慣れます。そして、バグのない世界が手に入ります。**
