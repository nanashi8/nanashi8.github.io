---
description: P2（中優先度）問題の診断プレイブック
version: 1.0.0
created: 2025-12-19
applyTo: '**'
priority: medium
phase: 1
---

# P2診断プレイブック

**対象**: 中優先度（1週間以内に対応）11パターン

---

## 📋 対象パターン一覧

| ID | パターン | 自動修復 | カテゴリ |
|----|---------|---------|----------|
| TP05 | 未使用インポート | ✅ | TypeScript |
| TP09 | Decorator使用 | ⚠️ | TypeScript |
| TP10 | strictモード違反 | ✅ | TypeScript |
| BP01 | バンドルサイズ肥大 | ⚠️ | Build |
| TP01 | テストカバレッジ | ⚠️ | Test |
| TP05 | E2E失敗 | ⚠️ | Test |
| DP04 | 未使用パッケージ | ✅ | Dependency |
| DP05 | package-lock破損 | ✅ | Dependency |
| PP03 | 不必要な再レンダリング | ⚠️ | Performance |
| PP04 | メモリリーク | ❌ | Performance |
| GP02 | 不要ファイルコミット | ✅ | Git |

---

## 🧹 TP05: 未使用インポート

### 問題の説明
```typescript
// ❌ 問題: インポートされているが使われていない
import { useState, useEffect, useMemo } from 'react'; // useMemo が未使用

function Component() {
  const [state, setState] = useState(0);
  
  useEffect(() => {
    // ...
  }, []);
  
  // useMemo を使っていない!
}
```

### 診断手順

```bash
# ステップ1: ESLint で検出
echo "=== Step 1: Finding unused imports ==="
npm run lint 2>&1 | grep "is defined but never used"

# ステップ2: TypeScript コンパイラで検出
echo "=== Step 2: TypeScript unused check ==="
npx tsc --noUnusedLocals --noUnusedParameters --noEmit 2>&1 | grep "is declared but its value is never read"

# ステップ3: ファイルごとの統計
echo "=== Step 3: Counting unused imports ==="
npm run lint 2>&1 | grep "never used" | wc -l
```

### 自動修復手順

```typescript
/**
 * 未使用インポートの自動削除
 * レベル: L1 (完全自動)
 */
async function healUnusedImports(): Promise<HealingResult> {
  try {
    // 1. バックアップ
    await createBackup('before-unused-imports-fix');
    
    // 2. ESLint --fix で自動修正
    const result = await execCommand('npm run lint -- --fix');
    
    // 3. 変更されたファイルを取得
    const changedFiles = await getChangedFiles();
    
    // 4. テスト実行
    const testResult = await testValidator.validate();
    
    if (!testResult) {
      await restoreBackup('before-unused-imports-fix');
      return {
        success: false,
        pattern: 'TP05',
        action: 'rollback',
        reason: 'Tests failed after removing unused imports'
      };
    }
    
    // 5. 成功
    await deleteBackup('before-unused-imports-fix');
    
    return {
      success: true,
      pattern: 'TP05',
      action: 'fixed',
      filesChanged: changedFiles.length,
      message: `Removed unused imports from ${changedFiles.length} files`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP05',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 🎨 TP09: Decorator使用

### 問題の説明
```typescript
// ⚠️ 問題: Decorator は実験的機能
@Component({
  selector: 'app-example'
})
class ExampleComponent {
  @Input() data: string;
}
```

### 診断手順

```bash
# ステップ1: Decorator 使用箇所を検出
echo "=== Step 1: Finding decorator usage ==="
grep -rn "@[A-Z]" src/ | grep -v "@types\|@ts-"

# ステップ2: tsconfig experimentalDecorators チェック
echo "=== Step 2: Checking experimentalDecorators ==="
grep "experimentalDecorators" tsconfig.json

# ステップ3: Babel プラグインチェック
echo "=== Step 3: Checking Babel decorator plugin ==="
grep "plugin-proposal-decorators" package.json
```

### 半自動修復手順

```typescript
/**
 * Decorator 使用の検出と代替提案
 * レベル: L2 (半自動)
 */
async function healDecoratorUsage(): Promise<HealingResult> {
  try {
    // 1. Decorator 使用箇所をスキャン
    const decorators = await scanForDecorators();
    
    if (decorators.length === 0) {
      return {
        success: true,
        pattern: 'TP09',
        action: 'no-action',
        message: 'No decorators found'
      };
    }
    
    // 2. 各 decorator の代替案を生成
    const alternatives = decorators.map(dec => {
      const { file, line, type, code } = dec;
      
      if (type === 'class-decorator') {
        return {
          file,
          line,
          current: code,
          alternative: `
// Before: Decorator
@Component({
  selector: 'app-example'
})
class ExampleComponent { }

// After: Factory function
const ExampleComponent = createComponent({
  selector: 'app-example'
}, class {
  // ...
});
          `.trim()
        };
      }
      
      if (type === 'property-decorator') {
        return {
          file,
          line,
          current: code,
          alternative: `
// Before: Decorator
class Example {
  @Input() data: string;
}

// After: Explicit definition
class Example {
  data: string;
  
  constructor() {
    defineInput(this, 'data');
  }
}
          `.trim()
        };
      }
    });
    
    // 3. experimentalDecorators を有効化（暫定）
    await enableExperimentalDecorators();
    
    // 4. プレビュー
    const approved = await showFixPreview({
      title: 'Decorator Usage (Experimental)',
      message: 'Decorators are experimental. Consider alternatives:',
      alternatives
    });
    
    return {
      success: true,
      pattern: 'TP09',
      action: 'info',
      decorators: decorators.length,
      message: `Found ${decorators.length} decorators. experimentalDecorators enabled.`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP09',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * experimentalDecorators を有効化
 */
async function enableExperimentalDecorators(): Promise<void> {
  const tsconfig = await readJsonFile('tsconfig.json');
  tsconfig.compilerOptions.experimentalDecorators = true;
  tsconfig.compilerOptions.emitDecoratorMetadata = true;
  await writeJsonFile('tsconfig.json', tsconfig);
}
```

---

## 🔒 TP10: strictモード違反

### 問題の説明
```typescript
// ❌ 問題: strictモードで許可されないパターン
function example() {
  with (obj) { // Syntax error in strict mode
    console.log(property);
  }
}

// ❌ 問題: 暗黙のany
function process(data) { // Parameter 'data' implicitly has an 'any' type
  return data.value;
}
```

### 診断手順

```bash
# ステップ1: strict mode チェック
echo "=== Step 1: Checking strict mode ==="
grep "\"strict\"" tsconfig.json

# ステップ2: strict 違反検出
echo "=== Step 2: Detecting strict violations ==="
npx tsc --noEmit 2>&1 | grep -i "strict\|implicitly"

# ステップ3: 個別 strict オプション確認
echo "=== Step 3: Checking individual strict options ==="
grep -E "noImplicitAny|strictNullChecks|strictFunctionTypes" tsconfig.json
```

### 自動修復手順

```typescript
/**
 * strictモード違反を修正
 * レベル: L1 (完全自動)
 */
async function healStrictModeViolations(): Promise<HealingResult> {
  try {
    // 1. 現在の strict 設定を確認
    const tsconfig = await readJsonFile('tsconfig.json');
    const isStrict = tsconfig.compilerOptions?.strict === true;
    
    if (isStrict) {
      return {
        success: true,
        pattern: 'TP10',
        action: 'no-action',
        message: 'Strict mode already enabled'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-strict-mode');
    
    // 3. 段階的に strict を有効化
    const strictOptions = {
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true
    };
    
    // 3.1. 一つずつ有効化してテスト
    const enabledOptions: string[] = [];
    
    for (const [option, value] of Object.entries(strictOptions)) {
      tsconfig.compilerOptions[option] = value;
      await writeJsonFile('tsconfig.json', tsconfig);
      
      // TypeScript チェック
      const tscResult = await execCommand('npx tsc --noEmit');
      
      if (tscResult.exitCode === 0) {
        enabledOptions.push(option);
      } else {
        // エラーがある場合は警告を出して続行
        console.warn(`⚠️  ${option} enabled with ${countErrors(tscResult.stderr)} errors`);
        enabledOptions.push(`${option} (with warnings)`);
      }
    }
    
    // 4. 全体の strict を有効化
    tsconfig.compilerOptions.strict = true;
    await writeJsonFile('tsconfig.json', tsconfig);
    
    // 5. テスト実行
    const testResult = await testValidator.validate();
    
    if (!testResult) {
      await restoreBackup('before-strict-mode');
      return {
        success: false,
        pattern: 'TP10',
        action: 'rollback',
        reason: 'Tests failed with strict mode'
      };
    }
    
    return {
      success: true,
      pattern: 'TP10',
      action: 'fixed',
      enabledOptions,
      message: `Enabled strict mode with ${enabledOptions.length} options`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP10',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 📦 BP01: バンドルサイズ肥大

### 問題の説明
```bash
# ❌ 問題: バンドルサイズが大きすぎる
dist/assets/index-a1b2c3d4.js  1.5 MB

# ⚠️ 警告: First Contentful Paint が遅い
lighthouse: FCP 3.5s (should be < 1.8s)
```

### 診断手順

```bash
# ステップ1: バンドルサイズ確認
echo "=== Step 1: Checking bundle size ==="
npm run build
ls -lh dist/assets/*.js

# ステップ2: バンドル分析
echo "=== Step 2: Analyzing bundle ==="
npm run build -- --mode analyze

# ステップ3: 大きな依存関係特定
echo "=== Step 3: Finding large dependencies ==="
npx cost-of-modules | head -20

# ステップ4: tree-shaking チェック
echo "=== Step 4: Checking tree-shaking ==="
grep "sideEffects" package.json
```

### 半自動修復手順

```typescript
/**
 * バンドルサイズ肥大を修正
 * レベル: L2 (半自動)
 */
async function healLargeBundleSize(): Promise<HealingResult> {
  try {
    // 1. 現在のバンドルサイズを測定
    await execCommand('npm run build');
    const bundleSize = await getBundleSize();
    
    const threshold = 500 * 1024; // 500KB
    
    if (bundleSize < threshold) {
      return {
        success: true,
        pattern: 'BP01',
        action: 'no-action',
        message: `Bundle size OK: ${(bundleSize / 1024).toFixed(0)}KB`
      };
    }
    
    // 2. 問題を分析
    const analysis = await analyzeBundleSize();
    
    const suggestions = [
      {
        title: 'Code Splitting',
        impact: 'high',
        fix: `
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material'],
        }
      }
    }
  }
});
        `.trim()
      },
      {
        title: 'Lazy Loading',
        impact: 'high',
        fix: `
// Before:
import HeavyComponent from './HeavyComponent';

// After:
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// In render:
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
        `.trim()
      },
      {
        title: 'Replace Heavy Dependencies',
        impact: 'medium',
        dependencies: analysis.heavyDependencies,
        fix: analysis.heavyDependencies.map(dep => 
          `Replace ${dep.name} (${dep.size}KB) with lighter alternative`
        ).join('\n')
      }
    ];
    
    // 3. 自動適用可能な最適化
    await createBackup('before-bundle-optimization');
    
    // 3.1. Tree-shaking を有効化
    await enableTreeShaking();
    
    // 3.2. Compression を有効化
    await enableCompression();
    
    // 3.3. Source maps を本番から除外
    await disableProductionSourceMaps();
    
    // 4. 再ビルドして効果を測定
    await execCommand('npm run build');
    const newBundleSize = await getBundleSize();
    const reduction = bundleSize - newBundleSize;
    
    // 5. プレビュー
    await showFixPreview({
      title: 'Bundle Size Optimization',
      before: `${(bundleSize / 1024).toFixed(0)}KB`,
      after: `${(newBundleSize / 1024).toFixed(0)}KB`,
      reduction: `${(reduction / 1024).toFixed(0)}KB (-${((reduction / bundleSize) * 100).toFixed(1)}%)`,
      suggestions
    });
    
    return {
      success: true,
      pattern: 'BP01',
      action: 'partial',
      bundleSizeBefore: bundleSize,
      bundleSizeAfter: newBundleSize,
      reduction,
      message: `Reduced bundle size by ${(reduction / 1024).toFixed(0)}KB. Review additional suggestions.`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'BP01',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * Tree-shaking を有効化
 */
async function enableTreeShaking(): Promise<void> {
  const packageJson = await readJsonFile('package.json');
  packageJson.sideEffects = false;
  await writeJsonFile('package.json', packageJson);
}

/**
 * Compression を有効化
 */
async function enableCompression(): Promise<void> {
  // vite-plugin-compression をインストール
  await execCommand('npm install -D vite-plugin-compression');
  
  // vite.config.ts に追加
  await addToViteConfig('plugins', `
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  `);
}
```

---

## 📊 TP01: テストカバレッジ

### 問題の説明
```bash
# ⚠️ 問題: カバレッジが低い
Statements   : 45.23% ( 123/272 )
Branches     : 32.14% ( 18/56 )
Functions    : 51.35% ( 19/37 )
Lines        : 44.83% ( 117/261 )
```

### 診断手順

```bash
# ステップ1: カバレッジレポート生成
echo "=== Step 1: Generating coverage report ==="
npm run test:coverage

# ステップ2: カバレッジの低いファイル特定
echo "=== Step 2: Finding low coverage files ==="
cat coverage/coverage-summary.json | jq '.total'

# ステップ3: 未テストの関数特定
echo "=== Step 3: Finding untested functions ==="
grep -r "export function" src/ | wc -l
grep -r "test\|describe" tests/ | wc -l
```

### 半自動修復手順

```typescript
/**
 * テストカバレッジ向上支援
 * レベル: L2 (半自動)
 */
async function healLowTestCoverage(): Promise<HealingResult> {
  try {
    // 1. カバレッジレポート生成
    await execCommand('npm run test:coverage');
    const coverage = await readCoverageReport();
    
    const threshold = {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    };
    
    const issues: string[] = [];
    
    if (coverage.statements < threshold.statements) {
      issues.push(`Statements: ${coverage.statements}% (target: ${threshold.statements}%)`);
    }
    if (coverage.branches < threshold.branches) {
      issues.push(`Branches: ${coverage.branches}% (target: ${threshold.branches}%)`);
    }
    if (coverage.functions < threshold.functions) {
      issues.push(`Functions: ${coverage.functions}% (target: ${threshold.functions}%)`);
    }
    if (coverage.lines < threshold.lines) {
      issues.push(`Lines: ${coverage.lines}% (target: ${threshold.lines}%)`);
    }
    
    if (issues.length === 0) {
      return {
        success: true,
        pattern: 'TP01',
        action: 'no-action',
        message: 'Test coverage meets requirements'
      };
    }
    
    // 2. カバレッジの低いファイルを特定
    const lowCoverageFiles = await findLowCoverageFiles(threshold);
    
    // 3. テストテンプレート生成
    const testTemplates = lowCoverageFiles.map(file => ({
      sourceFile: file.path,
      testFile: file.path.replace('src/', 'tests/').replace('.ts', '.test.ts'),
      template: generateTestTemplate(file)
    }));
    
    // 4. プレビュー
    await showFixPreview({
      title: 'Low Test Coverage',
      issues,
      suggestions: testTemplates.map(t => ({
        file: t.sourceFile,
        coverage: `${t.coverage}%`,
        action: `Create ${t.testFile}`
      }))
    });
    
    return {
      success: true,
      pattern: 'TP01',
      action: 'manual',
      lowCoverageFiles: lowCoverageFiles.length,
      message: `Identified ${lowCoverageFiles.length} files needing tests. Review templates.`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP01',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * テストテンプレート生成
 */
function generateTestTemplate(file: { path: string; functions: string[] }): string {
  return `
import { describe, it, expect } from 'vitest';
import { ${file.functions.join(', ')} } from '../${file.path}';

describe('${file.path}', () => {
  ${file.functions.map(fn => `
  describe('${fn}', () => {
    it('should work correctly', () => {
      // TODO: Add test implementation
      expect(${fn}).toBeDefined();
    });
    
    it('should handle edge cases', () => {
      // TODO: Test edge cases
    });
  });
  `).join('\n')}
});
  `.trim();
}
```

---

## 🗑️ DP04: 未使用パッケージ

### 問題の説明
```json
// package.json
{
  "dependencies": {
    "unused-package": "^1.0.0"  // インポートされていない!
  }
}
```

### 診断手順

```bash
# ステップ1: 未使用パッケージ検出
echo "=== Step 1: Finding unused packages ==="
npx depcheck

# ステップ2: 各パッケージの使用箇所確認
echo "=== Step 2: Checking package usage ==="
for pkg in $(jq -r '.dependencies | keys[]' package.json); do
  count=$(grep -r "from '$pkg'" src/ | wc -l)
  [ $count -eq 0 ] && echo "$pkg: NOT USED"
done

# ステップ3: パッケージサイズ確認
echo "=== Step 3: Checking package sizes ==="
npx cost-of-modules --no-install
```

### 自動修復手順

```typescript
/**
 * 未使用パッケージの自動削除
 * レベル: L1 (完全自動)
 */
async function healUnusedPackages(): Promise<HealingResult> {
  try {
    // 1. 未使用パッケージを検出
    const result = await execCommand('npx depcheck --json');
    const depcheck = JSON.parse(result.stdout);
    
    const unusedDeps = depcheck.dependencies || [];
    const unusedDevDeps = depcheck.devDependencies || [];
    
    if (unusedDeps.length === 0 && unusedDevDeps.length === 0) {
      return {
        success: true,
        pattern: 'DP04',
        action: 'no-action',
        message: 'No unused packages found'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-unused-packages-removal');
    
    // 3. 削除
    const removed: string[] = [];
    
    for (const pkg of unusedDeps) {
      await execCommand(`npm uninstall ${pkg}`);
      removed.push(pkg);
    }
    
    for (const pkg of unusedDevDeps) {
      await execCommand(`npm uninstall -D ${pkg}`);
      removed.push(pkg);
    }
    
    // 4. テスト
    const testResult = await testValidator.validate();
    
    if (!testResult) {
      await restoreBackup('before-unused-packages-removal');
      return {
        success: false,
        pattern: 'DP04',
        action: 'rollback',
        reason: 'Tests failed after removing packages'
      };
    }
    
    return {
      success: true,
      pattern: 'DP04',
      action: 'fixed',
      removed,
      message: `Removed ${removed.length} unused packages: ${removed.join(', ')}`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'DP04',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 🔐 DP05: package-lock破損

### 問題の説明
```bash
# ❌ 問題: package-lock.json が破損
npm ERR! code EINTEGRITY
npm ERR! sha512-... integrity checksum failed
```

### 診断手順

```bash
# ステップ1: package-lock の整合性チェック
echo "=== Step 1: Checking package-lock integrity ==="
npm ci 2>&1 | grep -i "integrity\|error"

# ステップ2: node_modules との比較
echo "=== Step 2: Comparing with node_modules ==="
npm ls 2>&1 | grep -i "extraneous\|missing"

# ステップ3: registry チェック
echo "=== Step 3: Checking registry ==="
npm config get registry
```

### 自動修復手順

```typescript
/**
 * package-lock破損の自動修復
 * レベル: L1 (完全自動)
 */
async function healCorruptedPackageLock(): Promise<HealingResult> {
  try {
    // 1. 問題検出
    const ciResult = await execCommand('npm ci');
    
    if (ciResult.exitCode === 0) {
      return {
        success: true,
        pattern: 'DP05',
        action: 'no-action',
        message: 'package-lock.json is valid'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-package-lock-fix');
    
    // 3. クリーンアップ
    await execCommand('rm -rf node_modules package-lock.json');
    
    // 4. 再インストール
    await execCommand('npm install');
    
    // 5. 検証
    const verifyResult = await execCommand('npm ci');
    
    if (verifyResult.exitCode !== 0) {
      await restoreBackup('before-package-lock-fix');
      return {
        success: false,
        pattern: 'DP05',
        action: 'rollback',
        reason: 'Failed to regenerate package-lock.json'
      };
    }
    
    // 6. テスト
    const testResult = await testValidator.validate();
    
    if (!testResult) {
      await restoreBackup('before-package-lock-fix');
      return {
        success: false,
        pattern: 'DP05',
        action: 'rollback',
        reason: 'Tests failed with new package-lock.json'
      };
    }
    
    return {
      success: true,
      pattern: 'DP05',
      action: 'fixed',
      message: 'Regenerated package-lock.json successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'DP05',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 🚀 PP03: 不必要な再レンダリング

### 問題の説明
```typescript
// ❌ 問題: 毎回再レンダリング
function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <>
      <button onClick={() => setCount(count + 1)}>+</button>
      <ExpensiveChild /> {/* count変更で毎回再レンダリング! */}
    </>
  );
}
```

### 診断手順

```bash
# ステップ1: React DevTools Profiler で確認
echo "=== Step 1: Use React DevTools Profiler ==="
echo "Open DevTools → Profiler → Record"

# ステップ2: 再レンダリングの多いコンポーネント検出
echo "=== Step 2: Finding components with high render count ==="
# Profiler の Flame Graph を確認

# ステップ3: memo/useCallback/useMemo 使用率
echo "=== Step 3: Checking optimization usage ==="
grep -c "React.memo\|useCallback\|useMemo" src/**/*.tsx
```

### 半自動修復手順

```typescript
/**
 * 不必要な再レンダリングを検出
 * レベル: L2 (半自動)
 */
async function healUnnecessaryRerenders(): Promise<HealingResult> {
  try {
    // 1. 最適化候補をスキャン
    const candidates = await scanForRerenderOptimizations();
    
    if (candidates.length === 0) {
      return {
        success: true,
        pattern: 'PP03',
        action: 'no-action',
        message: 'No obvious rerender issues found'
      };
    }
    
    // 2. 提案生成
    const suggestions = candidates.map(candidate => {
      const { file, component, issue } = candidate;
      
      return {
        file,
        component,
        issue,
        fix: `
// Option 1: React.memo
const ${component} = memo(function ${component}(props) {
  // ... component code
});

// Option 2: useMemo for expensive calculations
const expensiveValue = useMemo(
  () => calculateExpensiveValue(data),
  [data]
);

// Option 3: useCallback for callbacks
const handleClick = useCallback(
  () => {
    // ... handler code
  },
  [/* dependencies */]
);
        `.trim()
      };
    });
    
    // 3. プレビュー
    await showFixPreview({
      title: 'Unnecessary Rerender Optimizations',
      count: suggestions.length,
      suggestions
    });
    
    return {
      success: true,
      pattern: 'PP03',
      action: 'manual',
      suggestions: suggestions.length,
      message: `Found ${suggestions.length} optimization opportunities. Review suggestions.`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'PP03',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 🗂️ GP02: 不要ファイルコミット

### 問題の説明
```bash
# ❌ 問題: 不要なファイルがコミットされている
git status
  .DS_Store
  node_modules/
  .env.local
  dist/
```

### 診断手順

```bash
# ステップ1: Git で追跡されている不要ファイル検出
echo "=== Step 1: Finding tracked unnecessary files ==="
git ls-files | grep -E "\.DS_Store|\.env\.local|node_modules|dist/"

# ステップ2: .gitignore チェック
echo "=== Step 2: Checking .gitignore ==="
cat .gitignore

# ステップ3: 大きなファイル検出
echo "=== Step 3: Finding large files ==="
git ls-files | xargs du -h | sort -hr | head -20
```

### 自動修復手順

```typescript
/**
 * 不要ファイルコミットの自動修正
 * レベル: L1 (完全自動)
 */
async function healUnnecessaryCommittedFiles(): Promise<HealingResult> {
  try {
    // 1. 不要なファイルパターン
    const unnecessaryPatterns = [
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '.env.local',
      '.env.*.local',
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.vscode/',
      '.idea/'
    ];
    
    // 2. Git で追跡されている不要ファイルを検出
    const trackedFiles = await execCommand('git ls-files');
    const unnecessaryFiles = trackedFiles.stdout
      .split('\n')
      .filter(file => 
        unnecessaryPatterns.some(pattern => 
          file.includes(pattern.replace('*', ''))
        )
      );
    
    if (unnecessaryFiles.length === 0) {
      return {
        success: true,
        pattern: 'GP02',
        action: 'no-action',
        message: 'No unnecessary files tracked'
      };
    }
    
    // 3. バックアップ
    await createBackup('before-git-cleanup');
    
    // 4. .gitignore に追加
    await ensureGitIgnore(unnecessaryPatterns);
    
    // 5. Git から削除（ファイルは保持）
    for (const file of unnecessaryFiles) {
      await execCommand(`git rm --cached ${file}`);
    }
    
    // 6. コミット
    await execCommand(`git add .gitignore`);
    await execCommand(`git commit -m "chore: remove unnecessary tracked files"`);
    
    return {
      success: true,
      pattern: 'GP02',
      action: 'fixed',
      removed: unnecessaryFiles,
      message: `Removed ${unnecessaryFiles.length} unnecessary files from Git tracking`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'GP02',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 📊 P2診断実行フロー

```typescript
/**
 * すべてのP2診断を実行
 */
async function runP2Diagnostics(): Promise<DiagnosticReport> {
  const results: HealingResult[] = [];
  
  const p2Patterns = [
    { id: 'TP05', fn: healUnusedImports },
    { id: 'TP09', fn: healDecoratorUsage },
    { id: 'TP10', fn: healStrictModeViolations },
    { id: 'BP01', fn: healLargeBundleSize },
    { id: 'TP01', fn: healLowTestCoverage },
    { id: 'DP04', fn: healUnusedPackages },
    { id: 'DP05', fn: healCorruptedPackageLock },
    { id: 'PP03', fn: healUnnecessaryRerenders },
    { id: 'GP02', fn: healUnnecessaryCommittedFiles }
    // ... 残り2パターン
  ];
  
  console.log('📋 Starting P2 (Medium Priority) diagnostics...\n');
  
  for (const pattern of p2Patterns) {
    console.log(`Running ${pattern.id}...`);
    const result = await pattern.fn();
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${pattern.id}: ${result.message}`);
    } else {
      console.log(`❌ ${pattern.id}: ${result.error || result.reason}`);
    }
  }
  
  // 統計
  const total = results.length;
  const fixed = results.filter(r => r.action === 'fixed').length;
  const noAction = results.filter(r => r.action === 'no-action').length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 P2 Diagnostic Summary:`);
  console.log(`Total: ${total}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`No action needed: ${noAction}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((fixed / total) * 100).toFixed(0)}%`);
  
  return {
    results,
    stats: { total, fixed, noAction, failed }
  };
}
```

---

**Phase 1 Week 3-4 完了**: 50パターンの診断プレイブック作成完了！

**最終更新**: 2025-12-19  
**バージョン**: 1.0.0  
**次のステップ**: ステージング & デプロイ
