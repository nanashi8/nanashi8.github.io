---
title: 🚀 業界標準導入計画
created: 2025-12-13
updated: 2025-12-15
status: in-progress
tags: [design, ai, test]
---

# 🚀 業界標準導入計画

**作成日**: 2025年12月13日  
**目的**: 業界標準ツールの段階的導入によるプロジェクト品質の向上

---

## 📊 現状分析

### ✅ 既に導入済み

- TypeScript strict mode
- ESLint
- Playwright E2E testing
- Husky Git hooks
- GitHub Actions CI/CD
- Stylelint
- Markdownlint
- **自己修復システム** ⭐ 業界をリード

### ❌ 未導入の業界標準

| 優先度          | 機能                     | 導入状況 | 業界採用率 |
| --------------- | ------------------------ | -------- | ---------- |
| 🔴 Critical     | **テストカバレッジ計測** | ❌       | 95%        |
| 🟡 Important    | **Prettier**             | ❌       | 99%        |
| 🟡 Important    | **EditorConfig**         | ❌       | 90%        |
| 🟡 Important    | **Commitlint**           | ❌       | 85%        |
| 🟡 Important    | **Bundle Size監視**      | ❌       | 80%        |
| 🟢 Nice-to-have | **.nvmrc**               | ❌       | 75%        |
| 🟢 Nice-to-have | **PR/Issueテンプレート** | ❌       | 70%        |
| 🔴 Critical     | **npm audit自動化**      | ❌       | 95%        |
| 🟡 Important    | **Lighthouse CI**        | ❌       | 60%        |

---

## 🎯 Phase 1: 最重要（今週）

### 1️⃣ テストカバレッジ計測 🔴

**目的**: コード品質の可視化とテスト不足箇所の特定

#### 導入手順

```bash
# 1. 依存関係インストール
npm install --save-dev @vitest/coverage-v8

# 2. vitest.config.ts に設定追加
```

**vitest.config.ts**:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'tests/', '**/*.spec.ts', '**/*.test.ts', '**/types.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

**package.json** に追加:

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:ui": "vitest --ui --coverage"
  }
}
```

#### GitHub Actions統合

**.github/workflows/coverage.yml**:

```yaml
name: Test Coverage

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true
```

#### カバレッジバッジ追加

**README.md**:

```markdown
[![Coverage](https://codecov.io/gh/nanashi8/nanashi8.github.io/branch/main/graph/badge.svg)](https://codecov.io/gh/nanashi8/nanashi8.github.io)
```

---

### 2️⃣ Prettier 🟡

**目的**: コードフォーマットの完全統一

#### 導入手順

```bash
# 1. インストール
npm install --save-dev prettier

# 2. 設定ファイル作成
```

**.prettierrc**:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**.prettierignore**:

```
dist/
node_modules/
playwright-report/
test-results/
coverage/
*.md
public/data/
```

**package.json** に追加:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  }
}
```

#### ESLint統合

```bash
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
```

**eslint.config.js** 更新:

```javascript
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  // ... 既存設定
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  }
);
```

#### Pre-commit統合

**.husky/pre-commit** に追加:

```bash
echo "💅 コードフォーマット中..."
npm run format
git add -A
```

---

### 3️⃣ npm audit 自動化 🔴

**目的**: セキュリティ脆弱性の早期検出

#### GitHub Actions統合

**.github/workflows/security.yml**:

```yaml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # 毎週月曜日

jobs:
  audit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Check for vulnerabilities
        run: npm audit --production --audit-level=high

      - name: Create issue if vulnerabilities found
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔒 Security vulnerabilities detected',
              body: 'npm audit detected security vulnerabilities. Please review and update dependencies.',
              labels: ['security', 'automated']
            })
```

**package.json** に追加:

```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix"
  }
}
```

---

## 🎯 Phase 2: 重要（今月中）

### 4️⃣ EditorConfig 🟡

**目的**: エディタ間の設定統一

**.editorconfig**:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,tsx,js,jsx,json}]
indent_style = space
indent_size = 2

[*.{md,mdx}]
trim_trailing_whitespace = false

[*.css]
indent_style = space
indent_size = 2

[*.py]
indent_style = space
indent_size = 4
```

---

### 5️⃣ Commitlint 🟡

**目的**: コミットメッセージの規約統一

#### 導入手順

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

**commitlint.config.js**:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新機能
        'fix', // バグ修正
        'docs', // ドキュメント
        'style', // コードスタイル
        'refactor', // リファクタリング
        'test', // テスト追加
        'chore', // その他
        'perf', // パフォーマンス改善
        'ci', // CI/CD
        'build', // ビルド
        'revert', // リバート
      ],
    ],
  },
};
```

#### Husky統合

```bash
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
chmod +x .husky/commit-msg
```

#### 例

```bash
✅ feat: add user authentication
✅ fix: resolve login button not working
✅ docs: update README with setup instructions
❌ add feature (❌ 形式エラー)
```

---

### 6️⃣ Bundle Size監視 🟡

**目的**: パフォーマンスリグレッションの検出

#### 導入手順

```bash
npm install --save-dev rollup-plugin-visualizer
```

**vite.config.ts** 更新:

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

**package.json** に追加:

```json
{
  "scripts": {
    "build:analyze": "vite build && open dist/stats.html"
  }
}
```

#### サイズ制限チェック

```bash
npm install --save-dev size-limit @size-limit/preset-app
```

**.size-limit.json**:

```json
[
  {
    "name": "Main Bundle",
    "path": "dist/assets/index-*.js",
    "limit": "200 KB"
  },
  {
    "name": "CSS Bundle",
    "path": "dist/assets/index-*.css",
    "limit": "50 KB"
  }
]
```

**package.json** に追加:

```json
{
  "scripts": {
    "size": "size-limit",
    "size:why": "size-limit --why"
  }
}
```

---

## 🎯 Phase 3: 推奨（来月）

### 7️⃣ .nvmrc 🟢

**目的**: Node.jsバージョンの固定

**.nvmrc**:

```
20
```

**使用方法**:

```bash
nvm use
```

---

### 8️⃣ PR/Issueテンプレート 🟢

#### Pull Requestテンプレート

**.github/pull_request_template.md**:

```markdown
## 📝 変更内容

<!-- 変更内容を簡潔に記述 -->

## 🎯 関連Issue

Closes #

## ✅ チェックリスト

- [ ] TypeScript型エラー: 0件
- [ ] ESLint警告: 0件
- [ ] テストが通る
- [ ] カバレッジが維持/向上
- [ ] ビルドが成功
- [ ] ドキュメント更新済み

## 📸 スクリーンショット（UI変更の場合）

<!-- スクリーンショットを添付 -->

## 🧪 テスト方法

<!-- 動作確認の手順 -->
```

#### Issueテンプレート

**.github/ISSUE_TEMPLATE/bug_report.md**:

```markdown
---
name: Bug Report
about: バグを報告
title: '[BUG] '
labels: bug
assignees: ''
---

## 🐛 バグの内容

<!-- バグの内容を記述 -->

## 📋 再現手順

1.
2.
3.

## 💡 期待される動作

<!-- 期待される動作を記述 -->

## 📸 スクリーンショット

<!-- スクリーンショットを添付 -->

## 🌐 環境

- OS:
- ブラウザ:
- バージョン:
```

**.github/ISSUE_TEMPLATE/feature_request.md**:

```markdown
---
name: Feature Request
about: 新機能を提案
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## 💡 機能の内容

<!-- 機能の内容を記述 -->

## 🎯 目的

<!-- なぜこの機能が必要か -->

## 📝 実装案

<!-- 実装のアイデアがあれば記述 -->
```

---

### 9️⃣ Lighthouse CI 🟡

**目的**: Web Vitalsの継続的監視

#### 導入手順

```bash
npm install --save-dev @lhci/cli
```

**lighthouserc.js**:

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**package.json** に追加:

```json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

---

## 📊 導入スケジュール

| Week | Phase   | 導入項目             | 工数 |
| ---- | ------- | -------------------- | ---- |
| 1    | Phase 1 | テストカバレッジ     | 4h   |
| 1    | Phase 1 | Prettier             | 2h   |
| 1    | Phase 1 | npm audit自動化      | 1h   |
| 2    | Phase 2 | EditorConfig         | 0.5h |
| 2    | Phase 2 | Commitlint           | 1h   |
| 2    | Phase 2 | Bundle Size監視      | 2h   |
| 3-4  | Phase 3 | .nvmrc               | 0.5h |
| 3-4  | Phase 3 | PR/Issueテンプレート | 1h   |
| 3-4  | Phase 3 | Lighthouse CI        | 3h   |

**総工数**: 約15時間

---

## 📈 期待される効果

### 短期（1-2週間）

- ✅ コード品質の可視化
- ✅ フォーマット統一による可読性向上
- ✅ セキュリティリスクの早期検出

### 中期（1-2ヶ月）

- 📈 テストカバレッジ 0% → 80%
- 🎨 コードスタイルの完全統一
- 🔒 脆弱性ゼロの維持
- 📦 バンドルサイズの最適化

### 長期（3ヶ月以上）

- 🏆 業界標準準拠率 93% → 100%
- 🚀 パフォーマンススコア 90+ 維持
- ✨ 開発効率 30% 向上
- 🌟 プロジェクト成熟度 Excellent

---

## 🎯 成功指標

| メトリクス               | 現在  | 目標   |
| ------------------------ | ----- | ------ |
| テストカバレッジ         | 0%    | 80%    |
| ESLint警告               | 56    | 0      |
| セキュリティ脆弱性       | ?     | 0      |
| バンドルサイズ           | 116KB | <150KB |
| Lighthouse Performance   | ?     | 90+    |
| Lighthouse Accessibility | ?     | 100    |
| コミット規約準拠率       | 50%   | 100%   |

---

## 🚀 次のアクション

### 今週（Phase 1）

1. [ ] テストカバレッジ計測導入
1. [ ] Prettier設定
1. [ ] npm audit自動化

### 来週（Phase 2）

1. [ ] EditorConfig追加
1. [ ] Commitlint導入
1. [ ] Bundle Size監視

### 今月末（Phase 3）

1. [ ] .nvmrc作成
1. [ ] PR/Issueテンプレート
1. [ ] Lighthouse CI設定

---

## 📚 関連ドキュメント

- [自己管理型システム](../maintenance/SELF_MANAGING_PROJECT.md)
- [プロジェクト構造検証](./PROJECT_STRUCTURE_VALIDATION.md)
- [品質保証システム](../quality/QUALITY_SYSTEM.md)

---

**🌟 業界標準の導入により、プロジェクトは「世界最高水準」へと進化します！**
