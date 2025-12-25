---
description: SSOT（Single Source of Truth）原則の強制 - category判定・Position管理の一元化
applyTo: 'src/**/*.{ts,tsx}'
---

# SSOT原則の強制ガイドライン

## 🎯 背景と目的

**対症療法検知スクリプト** (`scripts/check-symptomatic-fixes.sh`) が以下を検出：

- AI判定ロジックの重複（`consecutiveIncorrect >= 2` 等）
- SSOT違反（`category = 'incorrect'` 等の文字列直接比較・代入）

これらを根絶し、**Position（0-100）を唯一の真実** とする設計を維持します。

---

## 🚨 絶対ルール

### 1. Position が唯一の真実（SSOT）

```typescript
// ✅ CORRECT: Position から category を導出
import { determineWordPosition, positionToCategory } from '@/ai/utils/categoryDetermination';

const position = determineWordPosition(progress, mode);
const category = positionToCategory(position);

// ❌ FORBIDDEN: category を直接判定・代入
if (progress.consecutiveIncorrect >= 2) {
  category = 'incorrect'; // 対症療法検知でブロック
}
```

### 2. category比較は predicate ヘルパを使用

```typescript
// ✅ CORRECT: predicate ヘルパを使用
import {
  isIncorrectWordCategory,
  isStillLearningWordCategory,
  isMasteredWordCategory,
} from '@/ai/utils/wordCategoryPredicates';

if (isIncorrectWordCategory(category)) {
  // 処理
}

// ❌ FORBIDDEN: 文字列比較
if (category === 'incorrect') {
  // 対症療法検知でブロック
  // 処理
}
```

### 3. switch で category マッピング

```typescript
// ✅ CORRECT: switch でマッピング
switch (category) {
  case 'incorrect':
    return 'high';
  case 'still_learning':
    return 'medium';
  default:
    return 'low';
}

// ❌ FORBIDDEN: 三項演算子の連鎖
return category === 'incorrect' ? 'high' : category === 'still_learning' ? 'medium' : 'low';
```

### 4. category 変数名の回避

```typescript
// ✅ CORRECT: bucket など別名を使用
const bucket = positionToCategory(position);
return { ...result, category: bucket };

// ❌ FORBIDDEN: category への文字列代入
const category = 'incorrect'; // 対症療法検知でブロック
```

---

## 📋 ファイル別ガイドライン

### MemoryAI / SpecialistAI

```typescript
// ❌ BEFORE: 重複判定ロジック
if (consecutiveIncorrect >= 2) {
  quality = 'struggling';
}

// ✅ AFTER: SSOT に委譲
const position = determineWordPosition(progress, 'memorization');
const category = positionToCategory(position);
switch (category) {
  case 'incorrect':
    quality = 'struggling';
    break;
  // ...
}
```

### QuestionScheduler

```typescript
// ❌ BEFORE: category の直接判定
if (position >= 70) {
  category = 'incorrect';
} else if (position >= 40) {
  category = 'still_learning';
}

// ✅ AFTER: positionToCategory へ
const category = positionToCategory(position);
```

### UI コンポーネント（View系）

```typescript
// ❌ BEFORE: 文字列比較
if (categoryAfter === 'still_learning' || categoryAfter === 'incorrect') {
  // 苦手化検知
}

// ✅ AFTER: predicate ヘルパ
import { isReviewWordCategory } from '@/ai/utils/wordCategoryPredicates';
if (isReviewWordCategory(categoryAfter)) {
  // 苦手化検知
}
```

---

## 🔍 対症療法検知の回避パターン

### パターン1: AI判定ロジック重複

```typescript
// ❌ VIOLATION: 重複判定
if (progress.consecutiveIncorrect >= 2) {
  // 独自判定
}

// ✅ FIX: SSOT に委譲
const position = determineWordPosition(progress, mode);
const category = positionToCategory(position);
// category を使用
```

### パターン2: category 文字列代入

```typescript
// ❌ VIOLATION: category 変数への代入
let category = 'new';
if (attempts > 0) {
  category = 'review';
}

// ✅ FIX: 別名 + shorthand
let bucket = 'new';
if (attempts > 0) {
  bucket = 'review';
}
return { ...result, category: bucket };
```

### パターン3: category 文字列比較

```typescript
// ❌ VIOLATION: === 比較
if (word.category === 'incorrect') {
  priority += 10;
}

// ✅ FIX: predicate ヘルパ
if (isIncorrectWordCategory(word.category)) {
  priority += 10;
}
```

---

## 🛠️ 利用可能なヘルパ関数

### `categoryDetermination.ts`

```typescript
// Position 計算（0-100）
function determineWordPosition(progress: WordProgress, mode: LearningMode): number;

// Position → category 変換
function positionToCategory(position: number): WordCategory;
```

### `wordCategoryPredicates.ts`

```typescript
// category 判定ヘルパ
function isIncorrectWordCategory(category: WordCategory): boolean;
function isStillLearningWordCategory(category: WordCategory): boolean;
function isMasteredWordCategory(category: WordCategory): boolean;
function isNewWordCategory(category: WordCategory): boolean;
function isReviewWordCategory(category: WordCategory): boolean;
```

---

## ✅ 実装チェックリスト

コード変更時に以下を確認：

- [ ] Position が唯一の真実として扱われているか
- [ ] category 判定は `positionToCategory()` 経由か
- [ ] category 比較は predicate ヘルパを使用しているか
- [ ] `consecutiveIncorrect >= N` 等の重複判定がないか
- [ ] `category = '...'` 等の直接代入がないか
- [ ] `category === '...'` 等の文字列比較がないか
- [ ] `npm run quality:check` で対症療法検知が通るか

---

## 📦 関連ファイル

- **SSOT実装**: `src/ai/utils/categoryDetermination.ts`
- **Predicate**: `src/ai/utils/wordCategoryPredicates.ts`
- **検知スクリプト**: `scripts/check-symptomatic-fixes.sh`
- **品質ゲート**: `npm run quality:check` に組み込み済み

---

## 🎓 参考事例（2025-12-24 大規模修正）

**修正対象ファイル**: 20+

- MemoryAI.ts: 重複判定ロジックを SSOT に委譲
- QuestionScheduler.ts: positionToCategory 導入
- \*View.tsx: predicate ヘルパに置換
- questionPrioritySorter.ts: category 比較を switch に
- debugAIEvaluations.ts / RequeuingDebugPanel.tsx: emoji マッピングを switch に

**結果**: `quality:check` 通過、対症療法検知 0件
