---
description: コード品質基準とエラーゼロポリシー
applyTo: '**'
---

# コード品質ガイド

Phase 1-2完了後のコード品質基準とエラーゼロポリシーを定義します。

## 🎯 エラーゼロポリシー

**基本方針**: すべてのエラー・警告を完全に解消する

- ✅ TypeScriptエラー → 0個
- ✅ ESLintエラー/警告 → 0個
- ✅ ビルドエラー → 0個
- ✅ テスト失敗 → 0個（関連テストのみ）
- ❌ 「動作に影響しないから放置」は禁止

## 📋 品質チェック項目

### 1. TypeScript型チェック

**コマンド**:
```bash
npm run typecheck
```

**完全解消必須**:
- ✅ 型エラー（0個）
- ✅ any型の使用禁止（明示的な理由がある場合のみ許可）
- ✅ 未使用変数（`_`プレフィックスで明示的に無視する場合を除く）
- ✅ 型推論の失敗
- ✅ importエラー

**TypeScript設定（tsconfig.json）**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2. ESLint

**コマンド**:
```bash
npm run lint
```

**完全解消必須**:
- ✅ コーディング規約違反（0個）
- ✅ 未使用変数・import（0個）
- ✅ React Hooksルール違反（0個）
- ✅ その他すべての警告（0個）

**ESLint設定（eslint.config.js）**:
```javascript
export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
];
```

### 3. ビルドチェック

**コマンド**:
```bash
npm run build
```

**成功必須**:
- ✅ ビルド成功（エラー0個）
- ✅ バンドルサイズ警告なし
- ✅ アセット最適化完了

**ビルド出力例**:
```
✓ built in 2.51s
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-[hash].css     15.23 kB │ gzip:  4.12 kB
dist/assets/index-[hash].js     143.67 kB │ gzip: 46.89 kB
```

### 4. テスト（スマートテスト）

**コマンド（pre-push）**:
```bash
npm run test:smart
```

**変更に関連するテストのみ実行**:
- ✅ 変更ファイルに関連するテスト実行
- ✅ 基本機能テスト（煙テスト）実行
- ⚠️  テスト失敗時はプッシュ不可（--no-verifyで回避可能）

## 🔒 Git Hooks（Husky）

### Pre-commit Hook

**実行内容**:
1. TypeScript型チェック
2. ESLint実行
3. ビルドチェック

**設定ファイル**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Pre-commit チェック開始..."
echo "⚠️  【重要】すべてのエラー・警告を完全に解消する必要があります"
echo ""

# 1. TypeScript型チェック
echo "🔍 TypeScript型チェック実行中..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript型エラーがあります"
  exit 1
fi

# 2. ESLint
echo "🔍 ESLintチェック実行中..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLintエラーがあります"
  exit 1
fi

# 3. ビルドチェック
echo "🔍 ビルドチェック実行中..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ ビルドエラーがあります"
  exit 1
fi

echo "✨ すべてのチェックが完了しました！"
```

### Pre-push Hook

**実行内容**:
1. スマートテスト実行（変更ファイルに関連するテストのみ）

**設定ファイル**: `.husky/pre-push`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Pre-push チェック開始..."
npm run test:smart

if [ $? -ne 0 ]; then
  echo "❌ テストに失敗しました"
  echo "💡 強制的にプッシュする場合は git push --no-verify を使用してください"
  exit 1
fi

echo "✨ すべてのテストが成功しました！"
```

## 📊 品質メトリクス

### コードベース統計（2025年12月11日）

| 指標 | 数値 | 目標 |
|------|------|------|
| TypeScriptエラー | 0個 | 0個維持 |
| ESLintエラー | 0個 | 0個維持 |
| ビルド成功率 | 100% | 100%維持 |
| srcルートファイル数 | 15個 | 20個以下 |
| 2000行超ファイル | 1個（progressStorage.ts: 3550行） | リファクタリング検討 |
| カスタムフック数 | 6個 | 継続増加 |

### リファクタリング成果（Phase 1-2）

| 項目 | Before | After | 改善 |
|------|--------|-------|------|
| srcルートファイル | 28個 | 15個 | -46% |
| App.tsx | 1651行 | 1623行 | -1.7% |
| SpellingView.tsx | 890行 | 749行 | -15.8% |

## 🧪 テスト戦略

### スマートテスト（test:smart）

**コンセプト**: 変更に関連するテストのみ実行して効率化

**実装**:
```bash
# scripts/smart-test.sh
#!/bin/bash

# 変更ファイルを取得
CHANGED_FILES=$(git diff --name-only HEAD~1)

if echo "$CHANGED_FILES" | grep -q "src/components/"; then
  echo "📝 コンポーネント変更検出 - コンポーネントテスト実行"
  npx playwright test tests/components
elif echo "$CHANGED_FILES" | grep -q "src/hooks/"; then
  echo "🎣 フック変更検出 - フックテスト実行"
  npm run test:hooks
else
  echo "⚡ 基本機能テスト実行"
  npx playwright test tests/smoke-fast.spec.ts
fi
```

### 煙テスト（Smoke Test）

**目的**: 基本動作の保証

**テストファイル**: `tests/smoke-fast.spec.ts`

```typescript
test('超高速煙テスト: アプリの基本動作確認', async ({ page }) => {
  // 1. ページが読み込める
  await page.goto('/');
  
  // 2. 翻訳タブが表示される
  await expect(page.locator('text=翻訳')).toBeVisible();
  
  // 3. 英単語が表示される
  const wordDisplay = page.locator('text=/^[A-Za-z]{4,}$/');
  await expect(wordDisplay).toBeVisible({ timeout: 10000 });
  
  // 4. JavaScriptエラーがない
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  
  expect(errors).toHaveLength(0);
});
```

## 🏥 システム健康診断

**コマンド**:
```bash
npm run health-check
```

**診断項目**:
1. ✅ localStorage キーの一貫性
2. ✅ 重複コンポーネント/関数の検出
3. ✅ useEffect 依存配列の警告
4. ✅ 未使用変数のチェック
5. ✅ CSS クラスの重複
6. ✅ デバッグコード残留チェック（console.log等）
7. ✅ 型定義の重複
8. ✅ 大きすぎるファイルの検出（2000行以上）
9. ✅ import文の整理状況

**推奨サイクル**:
- 毎週: 軽量診断実行
- 毎月: 詳細レポート作成
- 四半期: リファクタリング実施

## 🎨 コーディング規約

### 1. 命名規則

**ファイル名**:
```typescript
// ✅ Good: パスカルケース（コンポーネント）
QuizView.tsx
SpellingView.tsx

// ✅ Good: キャメルケース（フック、ユーティリティ）
useQuizSettings.ts
utils.ts

// ✅ Good: ケバブケース（CSS）
quiz-view.module.css
```

**変数名**:
```typescript
// ✅ Good: キャメルケース
const quizState = useState();
const autoAdvanceDelay = 3;

// ❌ Bad: スネークケース
const quiz_state = useState();
const auto_advance_delay = 3;
```

**定数名**:
```typescript
// ✅ Good: UPPER_SNAKE_CASE
const MAX_QUESTIONS = 100;
const API_ENDPOINT = 'https://api.example.com';

// ✅ Good: オブジェクトはcamelCase
export const OFFICIAL_CATEGORIES = {
  FOOD_HEALTH: '食・健康',
  // ...
} as const;
```

### 2. インポート順序

```typescript
// 1. React
import { useState, useEffect, useCallback } from 'react';

// 2. 外部ライブラリ
import axios from 'axios';

// 3. 型定義
import type { Question, QuizState } from '@/types';

// 4. 定数
import { OFFICIAL_CATEGORIES } from '@/constants';

// 5. カスタムフック
import { useQuizSettings } from '@/hooks/useQuizSettings';

// 6. コンポーネント
import { QuizCard } from '@/components/QuizCard';

// 7. スタイル
import styles from './QuizView.module.css';
```

### 3. コメント規約

```typescript
// ✅ Good: 意図を説明するコメント
// ユーザーが連続3回正解したら難易度を上げる
if (consecutiveCorrect >= 3) {
  increaseDifficulty();
}

// ❌ Bad: コードをそのまま説明
// consecutiveCorrectが3以上の場合
if (consecutiveCorrect >= 3) {
  increaseDifficulty();
}

// ✅ Good: JSDocコメント（型定義、関数）
/**
 * クイズ設定を管理するカスタムフック
 * 
 * @returns autoAdvance, autoAdvanceDelay, setters
 */
export function useQuizSettings() {
  // ...
}
```

### 4. console.log禁止

```typescript
// ❌ Bad: console.logを残す
console.log('Debug:', data);

// ✅ Good: 削除する
// (デバッグ時のみ一時的に使用、コミット前に削除)

// ✅ Good: 意図的なログの場合はコメント
// eslint-disable-next-line no-console
console.error('Critical error:', error);
```

## 📈 CI/CD パイプライン

### GitHub Actions

**ワークフロー**:
1. **CSS品質チェック** (`.github/workflows/css-lint.yml`)
2. **ビルドチェック** (`.github/workflows/build.yml`)
3. **文法データ品質** (`.github/workflows/grammar-quality-check.yml`)

**すべてグリーン必須** ✅

### ローカル開発フロー

```bash
# 1. 開発
npm run dev

# 2. 型チェック
npm run typecheck

# 3. リント
npm run lint

# 4. ビルド
npm run build

# 5. テスト（任意）
npm test

# 6. コミット（pre-commitフックが自動実行）
git commit -m "feat: 新機能追加"

# 7. プッシュ（pre-pushフックが自動実行）
git push origin main
```

## 🚫 アンチパターン

### 1. エラー放置

```typescript
// ❌ Bad: エラーを無視
// @ts-ignore
const result = someFunction();

// ✅ Good: エラーを修正
const result: ResultType = someFunction();
```

### 2. any型の乱用

```typescript
// ❌ Bad: any型
function processData(data: any) {
  // ...
}

// ✅ Good: 適切な型
import type { Question } from '@/types';

function processData(data: Question[]) {
  // ...
}
```

### 3. ビルドエラー無視

```bash
# ❌ Bad: ビルドエラーがあるままプッシュ
npm run build  # エラー発生
git push  # そのままプッシュ

# ✅ Good: ビルド成功を確認
npm run build  # 成功確認
git push
```

## 📚 関連ドキュメント

- [プロジェクト構造](./project-structure.instructions.md)
- [開発ガイドライン](./development-guidelines.instructions.md)
- [健康診断レポート](../../docs/quality/HEALTH_CHECK_REPORT.md)

---

**Last Updated**: 2025年12月11日  
**Version**: 2.0.0（Phase 1-2完了）
