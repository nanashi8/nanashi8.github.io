---
description: P1（高優先度）Build/Data/Test問題の診断プレイブック
applyTo: '**'
---

# P1診断プレイブック (Build, Data, Test)

**対象**: 高優先度（24時間以内に対応）12パターン

---

## 📋 対象パターン一覧

| ID | パターン | 自動修復 | カテゴリ |
|----|---------|---------|----------|
| BP02 | メモリ不足 | ⚠️ | Build |
| BP05 | CSS import エラー | ✅ | Build |
| DP06 | 配列境界チェック | ⚠️ | Data |
| DP07 | 日付フォーマット不統一 | ✅ | Data |
| TP02 | テストタイムアウト | ⚠️ | Test |
| TP03 | モック設定不備 | ⚠️ | Test |
| TP04 | スナップショット不一致 | ✅ | Test |
| DP02 | バージョン競合 | ⚠️ | Dependency |
| DP03 | lockfile差分 | ✅ | Dependency |
| PP01 | 初回ロード遅延 | ⚠️ | Performance |
| PP02 | 無限スクロール問題 | ⚠️ | Performance |
| SP03 | CORS エラー | ⚠️ | Security |

---

## 🔨 BP02: メモリ不足

### 問題の説明
```bash
# ❌ 問題: ビルド時のメモリ不足
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory

# ❌ 問題: 大きなバンドルサイズ
chunk-vendors.js  2.5 MB
```

### 診断手順

```bash
# ステップ1: メモリ使用量チェック
echo "=== Step 1: Checking memory usage ==="
node --trace-gc node_modules/.bin/vite build 2>&1 | grep "Memory"

# ステップ2: バンドルサイズ分析
echo "=== Step 2: Analyzing bundle size ==="
npm run build -- --report
du -h dist/*.js | sort -hr | head -10

# ステップ3: 依存関係サイズチェック
echo "=== Step 3: Checking dependency sizes ==="
npx cost-of-modules --no-install | head -20

# ステップ4: Node.js メモリ設定確認
echo "=== Step 4: Checking Node memory settings ==="
grep "max-old-space-size" package.json
```

### 半自動修復手順

```typescript
/**
 * メモリ不足問題の修正
 * レベル: L2 (半自動)
 */
async function healMemoryIssues(): Promise<HealingResult> {
  try {
    // 1. メモリ使用量を分析
    const analysis = await analyzeMemoryUsage();
    
    const issues: string[] = [];
    const fixes: Array<{type: string; action: string}> = [];
    
    // 2. バンドルサイズチェック
    const bundleSize = await getBundleSize();
    if (bundleSize > 2 * 1024 * 1024) { // 2MB以上
      issues.push('Large bundle size');
      fixes.push({
        type: 'bundle-size',
        action: 'Enable code splitting and lazy loading'
      });
    }
    
    // 3. 重い依存関係チェック
    const heavyDeps = await getHeavyDependencies();
    if (heavyDeps.length > 0) {
      issues.push('Heavy dependencies');
      fixes.push({
        type: 'dependencies',
        action: `Replace heavy dependencies: ${heavyDeps.join(', ')}`
      });
    }
    
    if (issues.length === 0) {
      return {
        success: true,
        pattern: 'BP02',
        action: 'no-action',
        message: 'No memory issues found'
      };
    }
    
    // 4. 修復提案を生成
    const suggestions = [
      {
        title: 'Increase Node.js heap size',
        fix: `
// package.json の build スクリプトを更新
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
        `.trim()
      },
      {
        title: 'Enable code splitting',
        fix: `
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@mui/material'],
          'utils': ['lodash', 'date-fns']
        }
      }
    }
  }
});
        `.trim()
      },
      {
        title: 'Lazy load routes',
        fix: `
// Before:
import HomePage from './pages/HomePage';

// After:
const HomePage = lazy(() => import('./pages/HomePage'));

// In router:
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
  </Routes>
</Suspense>
        `.trim()
      }
    ];
    
    // 5. プレビュー
    const approved = await showFixPreview({
      title: 'Memory/Bundle Size Issues',
      issues,
      suggestions
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'BP02',
        action: 'cancelled'
      };
    }
    
    // 6. 自動修復可能な部分を実行
    await createBackup('before-memory-fix');
    
    // 6.1. package.json の build スクリプト更新
    const packageJson = await readJsonFile('package.json');
    packageJson.scripts.build = "NODE_OPTIONS='--max-old-space-size=4096' vite build";
    await writeJsonFile('package.json', packageJson);
    
    // 6.2. vite.config.ts にコード分割追加（既にない場合）
    await addCodeSplittingConfig();
    
    return {
      success: true,
      pattern: 'BP02',
      action: 'partial',
      fixes,
      message: 'Applied automatic fixes. Please review manual optimizations.'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'BP02',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * vite.config.ts にコード分割設定を追加
 */
async function addCodeSplittingConfig(): Promise<void> {
  const viteConfig = await readFile('vite.config.ts');
  
  if (viteConfig.includes('manualChunks')) {
    return; // 既に設定済み
  }
  
  const codeSplitting = `
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@mui/material', '@emotion/react', '@emotion/styled']
        }
      }
    }
  `;
  
  // build セクションに追加
  await insertIntoViteConfig('build', codeSplitting);
}
```

---

## 🎨 BP05: CSS import エラー

### 問題の説明
```typescript
// ❌ 問題: CSS import が解決できない
import './styles.css'; // Cannot find module

// ❌ 問題: PostCSS エラー
// Error: PostCSS plugin postcss-preset-env requires PostCSS 8.
```

### 診断手順

```bash
# ステップ1: CSS import エラー検出
echo "=== Step 1: Finding CSS import errors ==="
npm run build 2>&1 | grep "Cannot find module.*\.css"

# ステップ2: PostCSS 設定チェック
echo "=== Step 2: Checking PostCSS config ==="
cat postcss.config.cjs
npm list postcss

# ステップ3: CSS モジュール設定確認
echo "=== Step 3: Checking CSS modules ==="
grep "css.modules" vite.config.ts

# ステップ4: CSS ファイルの存在確認
echo "=== Step 4: Checking CSS file existence ==="
find src/ -name "*.css" -type f
```

### 自動修復手順

```typescript
/**
 * CSS import エラーの自動修復
 * レベル: L1 (完全自動)
 */
async function healCssImportErrors(): Promise<HealingResult> {
  try {
    // 1. CSS import エラーを収集
    const errors = await detectCssImportErrors();
    
    if (errors.length === 0) {
      return {
        success: true,
        pattern: 'BP05',
        action: 'no-action',
        message: 'No CSS import errors found'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-css-fix');
    
    const fixes: string[] = [];
    
    // 3. 各エラーを修復
    for (const error of errors) {
      const { file, importPath, errorType } = error;
      
      switch (errorType) {
        case 'missing-file':
          // CSS ファイルを作成
          await createFile(importPath, '/* Auto-generated */\n');
          fixes.push(`Created ${importPath}`);
          break;
          
        case 'wrong-extension':
          // .css → .module.css or vice versa
          const correctPath = await findCorrectCssPath(importPath);
          if (correctPath) {
            await replaceInFile(file, importPath, correctPath);
            fixes.push(`Fixed path in ${file}`);
          }
          break;
          
        case 'postcss-version':
          // PostCSS バージョン問題
          await execCommand('npm install -D postcss@latest');
          fixes.push('Updated PostCSS');
          break;
      }
    }
    
    // 4. PostCSS 設定を確認・修正
    await ensurePostcssConfig();
    
    // 5. Vite CSS 設定を確認
    await ensureViteCssConfig();
    
    // 6. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-css-fix');
      return {
        success: false,
        pattern: 'BP05',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'BP05',
      action: 'fixed',
      fixes,
      message: `Fixed ${fixes.length} CSS import errors`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'BP05',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * PostCSS 設定を確保
 */
async function ensurePostcssConfig(): Promise<void> {
  const configExists = await fileExists('postcss.config.cjs');
  
  if (!configExists) {
    const defaultConfig = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
    `.trim();
    
    await createFile('postcss.config.cjs', defaultConfig);
  }
}

/**
 * Vite CSS 設定を確保
 */
async function ensureViteCssConfig(): Promise<void> {
  const viteConfig = await readFile('vite.config.ts');
  
  if (!viteConfig.includes('css:')) {
    const cssConfig = `
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    postcss: './postcss.config.cjs'
  }
    `.trim();
    
    await insertIntoViteConfig('root', cssConfig);
  }
}
```

---

## 📊 DP06: 配列境界チェック

### 問題の説明
```typescript
// ❌ 問題: 境界チェックなし
const first = items[0].name; // items が空なら TypeError!

// ❌ 問題: 負のインデックス
const last = items[-1]; // undefined (意図: 最後の要素)
```

### 診断手順

```bash
# ステップ1: 配列アクセス箇所を検出
echo "=== Step 1: Finding array access ==="
grep -rn "\[0\]\|\[length - 1\]" src/

# ステップ2: Optional chaining チェック
echo "=== Step 2: Checking optional chaining ==="
grep -c "\[0\]\?\." src/**/*.ts

# ステップ3: Array.prototype.at() 使用チェック
echo "=== Step 3: Checking .at() usage ==="
grep -c "\.at(" src/**/*.ts
```

### 半自動修復手順

```typescript
/**
 * 配列境界チェック不足を修正
 * レベル: L2 (半自動)
 */
async function healArrayBoundsChecks(): Promise<HealingResult> {
  try {
    // 1. 危険な配列アクセスをスキャン
    const issues = await scanForUnsafeArrayAccess();
    
    if (issues.length === 0) {
      return {
        success: true,
        pattern: 'DP06',
        action: 'no-action',
        message: 'No unsafe array access found'
      };
    }
    
    // 2. 修復案生成
    const fixes = issues.map(issue => {
      const { file, line, code, pattern } = issue;
      
      if (pattern === 'first-element') {
        return {
          file,
          line,
          issue: 'Unsafe first element access',
          fix: `
// Before:
const first = items[0].name;

// After (Option 1: Optional chaining):
const first = items[0]?.name;

// After (Option 2: Guard):
const first = items.length > 0 ? items[0].name : undefined;

// After (Option 3: at() method):
const first = items.at(0)?.name;
          `.trim()
        };
      }
      
      if (pattern === 'last-element') {
        return {
          file,
          line,
          issue: 'Unsafe last element access',
          fix: `
// Before:
const last = items[items.length - 1];

// After (Recommended: at() method):
const last = items.at(-1);

// Alternative:
const last = items.length > 0 ? items[items.length - 1] : undefined;
          `.trim()
        };
      }
      
      if (pattern === 'arbitrary-index') {
        return {
          file,
          line,
          issue: 'Unsafe array index access',
          fix: `
// Before:
const item = items[index].property;

// After:
const item = items[index]?.property;

// Or with guard:
if (index >= 0 && index < items.length) {
  const item = items[index].property;
}
          `.trim()
        };
      }
    });
    
    // 3. プレビュー
    const approved = await showFixPreview({
      title: 'Unsafe Array Access',
      count: fixes.length,
      fixes
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'DP06',
        action: 'cancelled'
      };
    }
    
    return {
      success: true,
      pattern: 'DP06',
      action: 'manual',
      fixes,
      message: 'Please review and apply suggested fixes'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'DP06',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 📅 DP07: 日付フォーマット不統一

### 問題の説明
```typescript
// ❌ 問題: フォーマットが不統一
const date1 = '2024-01-01';      // ISO
const date2 = '01/01/2024';      // US
const date3 = '2024年1月1日';    // Japanese

// ❌ 問題: タイムゾーン未考慮
new Date().toString(); // ローカルタイムゾーン
```

### 診断手順

```bash
# ステップ1: 日付フォーマットパターンをスキャン
echo "=== Step 1: Finding date format patterns ==="
grep -rn "new Date\|Date\.parse\|toISOString\|toLocaleDateString" src/

# ステップ2: ハードコードされた日付文字列
echo "=== Step 2: Finding hardcoded date strings ==="
grep -rn "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\|[0-9]\{2\}/[0-9]\{2\}/[0-9]\{4\}" src/

# ステップ3: date-fns / dayjs 使用チェック
echo "=== Step 3: Checking date library usage ==="
grep -c "date-fns\|dayjs" package.json
```

### 自動修復手順

```typescript
/**
 * 日付フォーマット不統一を修正
 * レベル: L1 (完全自動 - ISO 8601 に統一)
 */
async function healDateFormatInconsistency(): Promise<HealingResult> {
  try {
    // 1. 日付フォーマットをスキャン
    const inconsistencies = await scanForDateFormats();
    
    if (inconsistencies.length === 0) {
      return {
        success: true,
        pattern: 'DP07',
        action: 'no-action',
        message: 'Date formats are consistent'
      };
    }
    
    // 2. date-fns をインストール（まだなければ）
    const hasDateFns = await hasPackage('date-fns');
    if (!hasDateFns) {
      await execCommand('npm install date-fns');
    }
    
    // 3. バックアップ
    await createBackup('before-date-fix');
    
    const fixes: string[] = [];
    
    // 4. 各ファイルを修正
    for (const file of await getAllTypeScriptFiles()) {
      let content = await readFile(file);
      let changed = false;
      
      // 4.1. date-fns をインポート
      if (content.includes('new Date') || content.includes('toISOString')) {
        if (!content.includes("from 'date-fns'")) {
          content = `import { format, parseISO } from 'date-fns';\n${content}`;
          changed = true;
        }
      }
      
      // 4.2. new Date() → parseISO() または format()
      // toISOString() → format(date, 'yyyy-MM-dd')
      const replacements = [
        {
          from: /new Date\('([0-9]{4}-[0-9]{2}-[0-9]{2})'\)/g,
          to: "parseISO('$1')"
        },
        {
          from: /\.toISOString\(\)\.split\('T'\)\[0\]/g,
          to: ", format(date, 'yyyy-MM-dd')"
        },
        {
          from: /\.toLocaleDateString\(\)/g,
          to: ", format(date, 'yyyy-MM-dd')"
        }
      ];
      
      for (const { from, to } of replacements) {
        if (content.match(from)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      
      if (changed) {
        await writeFile(file, content);
        fixes.push(file);
      }
    }
    
    // 5. 日付ユーティリティを作成
    await createDateUtility();
    
    // 6. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-date-fix');
      return {
        success: false,
        pattern: 'DP07',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'DP07',
      action: 'fixed',
      fixes: fixes.length,
      message: `Unified date formats in ${fixes.length} files`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'DP07',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * 日付ユーティリティを作成
 */
async function createDateUtility(): Promise<void> {
  const utilityCode = `
import { format, parseISO, isValid } from 'date-fns';

/**
 * 統一された日付フォーマット
 */
export const DATE_FORMAT = {
  ISO: 'yyyy-MM-dd',
  DISPLAY: 'yyyy年M月d日',
  FULL: 'yyyy-MM-dd HH:mm:ss',
} as const;

/**
 * 日付を ISO 8601 形式にフォーマット
 */
export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    throw new Error(\`Invalid date: \${date}\`);
  }
  return format(d, DATE_FORMAT.ISO);
}

/**
 * 日付を表示用にフォーマット
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    throw new Error(\`Invalid date: \${date}\`);
  }
  return format(d, DATE_FORMAT.DISPLAY);
}

/**
 * ISO 8601 文字列をパース
 */
export function parseDateISO(dateString: string): Date {
  const date = parseISO(dateString);
  if (!isValid(date)) {
    throw new Error(\`Invalid date string: \${dateString}\`);
  }
  return date;
}
  `.trim();
  
  await createFile('src/utils/date.ts', utilityCode);
}
```

---

## ⏱️ TP02: テストタイムアウト

### 問題の説明
```typescript
// ❌ 問題: テストがタイムアウト
test('loads data', async () => {
  await fetchData(); // 5秒以上かかる
}); // Timeout!

// ❌ 問題: 無限待機
test('waits for element', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  }); // 条件が満たされない
});
```

### 診断手順

```bash
# ステップ1: タイムアウトエラー検出
echo "=== Step 1: Finding timeout errors ==="
npm test 2>&1 | grep -i "timeout\|exceeded"

# ステップ2: 遅いテスト特定
echo "=== Step 2: Finding slow tests ==="
npm test -- --verbose 2>&1 | grep "PASS\|FAIL" | awk '{print $3, $2}'

# ステップ3: timeout 設定確認
echo "=== Step 3: Checking timeout settings ==="
grep "timeout" vitest.config.ts jest.config.js 2>/dev/null
```

### 半自動修復手順

```typescript
/**
 * テストタイムアウトを修正
 * レベル: L2 (半自動)
 */
async function healTestTimeouts(): Promise<HealingResult> {
  try {
    // 1. タイムアウトするテストを特定
    const timeoutTests = await identifyTimeoutTests();
    
    if (timeoutTests.length === 0) {
      return {
        success: true,
        pattern: 'TP02',
        action: 'no-action',
        message: 'No test timeouts found'
      };
    }
    
    // 2. 修復案生成
    const fixes = timeoutTests.map(test => {
      const { file, testName, duration } = test;
      
      return {
        file,
        testName,
        issue: `Test timeout (${duration}ms)`,
        fixes: [
          {
            type: 'increase-timeout',
            code: `
// Option 1: Increase test timeout
test('${testName}', async () => {
  // ... test code
}, { timeout: 10000 }); // 10 seconds
            `.trim()
          },
          {
            type: 'optimize-test',
            code: `
// Option 2: Optimize test with mocks
test('${testName}', async () => {
  // Mock slow operations
  vi.mock('./api', () => ({
    fetchData: vi.fn().mockResolvedValue(mockData)
  }));
  
  // ... test code
});
            `.trim()
          },
          {
            type: 'skip-integration',
            code: `
// Option 3: Skip in unit tests, move to E2E
test.skip('${testName}', async () => {
  // Move to playwright E2E tests
});
            `.trim()
          }
        ]
      };
    });
    
    // 3. グローバル timeout 設定を更新
    await updateGlobalTimeout();
    
    // 4. プレビュー
    const approved = await showFixPreview({
      title: 'Test Timeout Issues',
      count: fixes.length,
      fixes
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'TP02',
        action: 'cancelled'
      };
    }
    
    return {
      success: true,
      pattern: 'TP02',
      action: 'partial',
      fixes,
      message: 'Updated global timeout. Please review individual test fixes.'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP02',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * グローバル timeout 設定を更新
 */
async function updateGlobalTimeout(): Promise<void> {
  const vitestConfig = await readFile('vitest.config.ts');
  
  if (!vitestConfig.includes('testTimeout')) {
    const timeoutConfig = `
  test: {
    testTimeout: 10000, // 10 seconds
    hookTimeout: 10000
  }
    `.trim();
    
    await insertIntoVitestConfig('test', timeoutConfig);
  }
}
```

---

## ✅ TP04: スナップショット不一致

### 問題の説明
```typescript
// ❌ 問題: スナップショットが更新されていない
expect(component).toMatchSnapshot(); // Snapshot mismatch!
```

### 診断手順

```bash
# ステップ1: スナップショット不一致検出
echo "=== Step 1: Detecting snapshot mismatches ==="
npm test 2>&1 | grep -A5 "Snapshot.*failed"

# ステップ2: スナップショットファイル確認
echo "=== Step 2: Checking snapshot files ==="
find . -name "*.snap" -type f | head -10

# ステップ3: 変更されたコンポーネント特定
echo "=== Step 3: Finding changed components ==="
git diff --name-only | grep "\.tsx$\|\.jsx$"
```

### 自動修復手順

```typescript
/**
 * スナップショット不一致を自動修正
 * レベル: L1 (完全自動 - レビュー推奨)
 */
async function healSnapshotMismatches(): Promise<HealingResult> {
  try {
    // 1. スナップショット不一致をチェック
    const result = await execCommand('npm test -- --run');
    
    if (!result.stdout.includes('Snapshot') && !result.stderr.includes('Snapshot')) {
      return {
        success: true,
        pattern: 'TP04',
        action: 'no-action',
        message: 'No snapshot mismatches found'
      };
    }
    
    // 2. 不一致の詳細を収集
    const mismatches = parseSnapshotMismatches(result.stdout + result.stderr);
    
    // 3. バックアップ
    await createBackup('before-snapshot-update');
    
    // 4. スナップショット更新
    await execCommand('npm test -- -u'); // Update snapshots
    
    // 5. 差分をレビュー
    const diff = await execCommand('git diff *.snap');
    
    // 6. 大きな変更がある場合は警告
    if (diff.stdout.split('\n').length > 100) {
      console.warn('⚠️  Large snapshot changes detected. Please review carefully.');
    }
    
    // 7. テスト実行して確認
    const testResult = await execCommand('npm test -- --run');
    
    if (testResult.exitCode !== 0) {
      await restoreBackup('before-snapshot-update');
      return {
        success: false,
        pattern: 'TP04',
        action: 'rollback',
        reason: 'Tests still failing after snapshot update'
      };
    }
    
    return {
      success: true,
      pattern: 'TP04',
      action: 'fixed',
      mismatches: mismatches.length,
      message: `Updated ${mismatches.length} snapshots. Please review changes.`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP04',
      action: 'error',
      error: error.message
    };
  }
}
```

---

**次のステップ**: P2診断プレイブック作成（11パターン）

**最終更新**: 2025-12-19  
**バージョン**: 1.0.0
