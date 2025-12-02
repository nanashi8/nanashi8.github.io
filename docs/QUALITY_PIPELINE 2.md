# 品質管理パイプライン

**最終更新**: 2025年12月2日  
**対象**: 英語学習アプリ (nanashi8.github.io)

---

## 📋 目次

1. [概要](#概要)
2. [パイプライン構成](#パイプライン構成)
3. [テスト戦略](#テスト戦略)
4. [Git Hooks](#git-hooks)
5. [CI/CD](#cicd)
6. [品質基準](#品質基準)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### 目的

破壊的変更を防ぎ、安定したコード品質を維持するための自動化パイプライン

### 原則

- **自動化優先**: 手動チェックに依存しない
- **早期発見**: コミット前にエラーを検出
- **段階的実行**: 高速チェック → 完全テストの順で実行
- **明確なフィードバック**: エラー原因を即座に特定

### 導入経緯

**2025年11月**: CSSリファクタでクイズ機能が破壊  
→ **対策**: TypeScript型チェック + ESLint + Playwright + Git Hooks導入  
→ **成果**: 破壊的変更の事前検出に成功

---

## パイプライン構成

### 全体フロー

```
開発中
  ↓
コード編集
  ↓
保存時: ESLint自動実行 (VS Code)
  ↓
git add
  ↓
git commit
  ↓
Pre-commit Hook 🛡️
  ├─ TypeScript型チェック (5秒)
  ├─ CSS Lint (3秒)
  └─ ビルドチェック (2秒)
  ↓
コミット成功
  ↓
git push
  ↓
GitHub Actions CI 🤖
  ├─ TypeScript型チェック
  ├─ CSS Lint
  ├─ ビルドチェック
  └─ Playwright E2Eテスト
  ↓
デプロイ (main branch)
```

### 実行タイミング

| チェック | ローカル (pre-commit) | GitHub Actions |
|---------|---------------------|----------------|
| TypeScript型チェック | ✅ (5秒) | ✅ |
| CSS Lint | ✅ (3秒) | ✅ |
| ビルド | ✅ (2秒) | ✅ |
| Playwright E2E | ❌ (手動) | ✅ |

---

## テスト戦略

### 1. TypeScript型チェック

**目的**: 型エラーの早期検出

```bash
# 実行コマンド
npm run typecheck

# 内容
tsc --noEmit
```

**検出対象**:
- 型の不一致
- 未定義変数の参照
- nullableチェック漏れ
- 関数の引数/戻り値の型エラー

**成果**:
- 2025年12月2日時点: **0エラー**
- 導入前: 11エラー → 段階的修正で解決

### 2. ESLint

**目的**: コード品質とReact Hooksルールの検証

```bash
# 実行コマンド
npm run lint

# 内容
eslint .
```

**検出対象**:
- React Hooks依存配列の不備
- useEffect無限ループリスク
- 未使用変数
- コーディング規約違反

**現状**:
- 2025年12月2日時点: **56 problems** (warnings)
- 修正必要項目:
  - `Date.now()` の純粋性警告
  - `setState` のuseEffect内使用
  - Hook依存配列の不足

### 3. CSS Lint (Stylelint)

**目的**: CSS品質の検証

```bash
# 実行コマンド
npm run lint:css

# 内容
stylelint "src/**/*.css"
```

**設定** (`.stylelintrc.json`):
```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    "no-descending-specificity": null,
    "color-function-notation": "legacy"
  }
}
```

**検出対象**:
- 重複セレクタ（警告）
- 不正なCSS構文
- 色表記の不統一
- セレクタの詳細度問題

### 4. ビルドチェック

**目的**: 本番ビルドの成功を保証

```bash
# 実行コマンド
npm run build

# 内容
vite build
```

**検出対象**:
- モジュール解決エラー
- バンドルエラー
- 依存関係の問題
- デッドコードの検出

**成果**:
- ビルド時間: 約2秒
- バンドルサイズ: 116KB (CSS)

### 5. Playwright E2Eテスト

**目的**: UI動作の自動検証

#### テスト構成

```
tests/
├── smoke.spec.ts           # 高速スモークテスト (10秒)
│   ├─ アプリ起動確認
│   ├─ クイズ開始確認
│   └─ 基本操作確認
│
└── visual-regression.spec.ts  # 完全テスト (30秒)
    ├─ 全画面のスクリーンショット
    ├─ ダークモード確認
    └─ レイアウト崩れ検出
```

#### スモークテスト (smoke.spec.ts)

```typescript
test('アプリが起動する', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});

test('クイズが開始できる', async ({ page }) => {
  await page.goto('/');
  await page.click('text=クイズを始める');
  await expect(page.locator('.quiz-question')).toBeVisible();
});
```

**実行時間**: 約10秒  
**タイミング**: ローカルで手動実行、CIで自動実行

#### Visual Regression テスト

```typescript
test('クイズ画面のスクリーンショット', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('quiz-home.png');
});
```

**実行時間**: 約30秒  
**タイミング**: CI のみ自動実行

#### Smart Test (差分ベース実行)

**スクリプト**: `scripts/smart-test.sh`

```bash
#!/bin/bash
# Git差分から影響範囲を判定し、必要なテストのみ実行

if git diff --name-only HEAD~1 | grep -q "src/components/QuizApp"; then
  echo "QuizApp変更検出 → 完全テスト実行"
  npm run test:e2e
else
  echo "軽微な変更 → スモークテストのみ"
  npm run test:smoke
fi
```

**使用方法**:
```bash
./scripts/smart-test.sh
```

---

## Git Hooks

### Huskyセットアップ

```bash
# インストール済み
npm install --save-dev husky
npx husky install
```

### Pre-commit Hook

**ファイル**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Pre-commit チェック開始..."

# TypeScript型チェック
echo "⏳ TypeScript型チェック実行中..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript型エラーがあります"
  exit 1
fi
echo "✅ TypeScript型チェック完了"

# CSSリント
echo "⏳ CSSチェック実行中..."
npm run lint:css
if [ $? -ne 0 ]; then
  echo "❌ CSSエラーがあります"
  exit 1
fi
echo "✅ CSSチェック完了"

# ビルドチェック
echo "⏳ ビルドチェック実行中..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ ビルドエラーがあります"
  exit 1
fi
echo "✅ ビルドチェック完了"

echo "✨ すべてのチェックに成功しました"
```

**実行タイミング**: `git commit` 実行時  
**所要時間**: 約10秒  
**失敗時**: コミットが中断される

### Pre-commit 実行例

```bash
$ git commit -m "feat: add new component"

🔍 Pre-commit チェック開始...
⏳ TypeScript型チェック実行中...
✅ TypeScript型チェック完了
⏳ CSSチェック実行中...
✅ CSSチェック完了
⏳ ビルドチェック実行中...
✅ ビルドチェック完了
✨ すべてのチェックに成功しました

[main abc1234] feat: add new component
 2 files changed, 50 insertions(+)
```

---

## CI/CD

### GitHub Actions ワークフロー

#### 1. ビルドチェック (`.github/workflows/build.yml`)

```yaml
name: ビルドチェック

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Node.js セットアップ
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: 依存関係インストール
        run: npm ci
      
      - name: TypeScript型チェック
        run: npm run typecheck
      
      - name: ビルド
        run: npm run build
```

#### 2. CSSチェック (`.github/workflows/css-lint.yml`)

```yaml
name: CSS品質チェック

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  css-lint:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Node.js セットアップ
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: 依存関係インストール
        run: npm ci
      
      - name: CSSリント
        run: npm run lint:css
```

#### 3. E2Eテスト (`.github/workflows/e2e.yml`) - 🆕 今後追加予定

```yaml
name: E2Eテスト

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Node.js セットアップ
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: 依存関係インストール
        run: npm ci
      
      - name: Playwright インストール
        run: npx playwright install --with-deps
      
      - name: E2Eテスト実行
        run: npm run test:e2e
      
      - name: テストレポートアップロード
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### バッジ表示

`README.md` にステータスバッジを追加:

```markdown
[![CSS品質チェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/css-lint.yml)
[![ビルドチェック](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/nanashi8/nanashi8.github.io/actions/workflows/build.yml)
```

---

## 品質基準

### コミット可能条件

✅ すべてクリアで初めてコミット可能:

- [ ] TypeScript型エラー: **0件**
- [ ] ビルドエラー: **0件**
- [ ] CSSリントエラー: **0件** (警告は許容)
- [ ] Pre-commit Hook: **すべて成功**

### 推奨基準

望ましい状態（努力目標）:

- [ ] ESLint warnings: **0件**
- [ ] E2Eテスト: **すべて成功**
- [ ] Visual Regression: **差分なし**
- [ ] バンドルサイズ: **前回比+10%以内**

### 品質メトリクス

#### 現在の状態 (2025-12-02)

| 項目 | 現在値 | 目標値 | 状態 |
|-----|-------|-------|------|
| TypeScriptエラー | 0 | 0 | ✅ |
| ESLint problems | 56 | 0 | ⚠️ |
| CSSリントエラー | 0 | 0 | ✅ |
| CSS総行数 | 12,255 | - | - |
| CSS重複ルール | 0 | 0 | ✅ |
| ビルド時間 | 2.4秒 | <5秒 | ✅ |
| CSSバンドルサイズ | 116KB | <150KB | ✅ |

---

## トラブルシューティング

### Pre-commit Hookが実行されない

#### 原因1: Huskyが初期化されていない

```bash
# 解決方法
npx husky install
```

#### 原因2: 実行権限がない

```bash
# 解決方法
chmod +x .husky/pre-commit
```

#### 原因3: Git設定問題

```bash
# core.hooksPath確認
git config core.hooksPath

# 出力例: .husky
# 何も出力されない場合:
git config core.hooksPath .husky
```

### Pre-commit Hookをスキップしたい場合

**⚠️ 緊急時のみ使用**:

```bash
git commit --no-verify -m "emergency fix"
```

### TypeScript型チェックが遅い

#### キャッシュクリア

```bash
# node_modules削除して再インストール
rm -rf node_modules
npm install
```

#### tsconfig最適化

```json
{
  "compilerOptions": {
    "skipLibCheck": true,  // ライブラリの型チェックをスキップ
    "incremental": true     // インクリメンタルビルド有効化
  }
}
```

### CSS Lintエラーが解決しない

#### 個別ルール無効化

```css
/* stylelint-disable-next-line selector-class-pattern */
.legacy-class-name {
  color: red;
}
```

#### ファイル全体を無効化（最終手段）

```css
/* stylelint-disable */
/* ... 既存CSS ... */
/* stylelint-enable */
```

### ビルドが失敗する

#### キャッシュクリア

```bash
# Viteキャッシュ削除
rm -rf node_modules/.vite

# dist削除
rm -rf dist

# 再ビルド
npm run build
```

#### 依存関係の再インストール

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## チェックリスト

### 開発開始時

- [ ] `npm install` で依存関係を最新化
- [ ] `npm run dev` で開発サーバー起動
- [ ] VS Code ESLint拡張機能が動作中

### コミット前

- [ ] `npm run typecheck` で型エラー0件
- [ ] `npm run lint` で確認（警告は後で対処）
- [ ] `npm run build` でビルド成功
- [ ] Simple Browserで目視確認

### プッシュ前

- [ ] ローカルでpre-commitフック成功
- [ ] コミットメッセージが明確
- [ ] 大きな変更は小さくコミット分割

### リリース前

- [ ] GitHub Actions すべて成功
- [ ] E2Eテスト実行・成功
- [ ] バンドルサイズ確認
- [ ] 本番ビルドで動作確認

---

## 参考資料

- [Husky公式ドキュメント](https://typicode.github.io/husky/)
- [Playwright公式ドキュメント](https://playwright.dev/)
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [Stylelint公式ドキュメント](https://stylelint.io/)

---

**改訂履歴**:
- 2025-12-02: 初版作成（パイプライン構築完了後）
