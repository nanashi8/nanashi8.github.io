---
description: P1（高優先度）TypeScript/React問題の診断プレイブック
version: 1.0.0
created: 2025-12-19
applyTo: '**'
priority: high
phase: 1
---

# P1診断プレイブック (TypeScript & React)

**対象**: 高優先度（24時間以内に対応）12パターン

---

## 📋 対象パターン一覧

| ID | パターン | 自動修復 | カテゴリ |
|----|---------|---------|----------|
| TP03 | any型の過剰使用 | ⚠️ | TypeScript |
| TP04 | null/undefined混在 | ✅ | TypeScript |
| TP06 | 型アサーション乱用 | ⚠️ | TypeScript |
| TP07 | Promise未処理 | ⚠️ | TypeScript |
| TP08 | enum vs union type | ✅ | TypeScript |
| RP03 | Key prop不足 | ✅ | React |
| RP05 | メモ化不足 | ⚠️ | React |
| RP06 | useRef誤用 | ⚠️ | React |
| RP07 | Fragment不要 | ⚠️ | React |
| RP08 | Controlled/Uncontrolled混在 | ❌ | React |
| DP04 | データ型不一致 | ⚠️ | Data |
| DP05 | 必須フィールド欠如 | ⚠️ | Data |

---

## 🔧 TP03: any型の過剰使用

### 問題の説明
```typescript
// ❌ 問題: any の乱用
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// ❌ 問題: 型安全性の喪失
const result: any = fetchData();
console.log(result.nonexistentProperty); // エラーにならない
```

### 診断手順

```bash
# ステップ1: any 使用箇所をカウント
echo "=== Step 1: Counting 'any' usage ==="
grep -r ": any" src/ | wc -l

# ステップ2: any の詳細リスト
echo "=== Step 2: Listing 'any' locations ==="
grep -rn ": any" src/ | head -20

# ステップ3: 型推論可能な箇所検出
echo "=== Step 3: Finding inferrable types ==="
grep -B2 ": any" src/**/*.ts | grep "="

# ステップ4: noImplicitAny チェック
echo "=== Step 4: Checking noImplicitAny ==="
grep "noImplicitAny" tsconfig.json
```

### 半自動修復手順

```typescript
/**
 * any型の過剰使用を修正
 * レベル: L2 (半自動)
 */
async function healExcessiveAnyUsage(): Promise<HealingResult> {
  try {
    // 1. any 使用箇所を収集
    const anyUsages = await scanForAnyType();
    
    if (anyUsages.length === 0) {
      return {
        success: true,
        pattern: 'TP03',
        action: 'no-action',
        message: 'No excessive any usage found'
      };
    }
    
    // 2. 各箇所を分析
    const fixes = await Promise.all(
      anyUsages.map(async (usage) => {
        const { file, line, context } = usage;
        
        // TypeScript Language Server で型推論
        const inferredType = await inferType(file, line);
        
        return {
          file,
          line,
          before: 'any',
          after: inferredType || 'unknown',
          confidence: inferredType ? 0.9 : 0.5,
          context
        };
      })
    );
    
    // 3. プレビュー
    const approved = await showFixPreview({
      title: 'Replace any with specific types',
      count: fixes.length,
      fixes: fixes.map(f => ({
        location: `${f.file}:${f.line}`,
        change: `any → ${f.after}`,
        confidence: `${(f.confidence * 100).toFixed(0)}%`,
        context: f.context
      }))
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'TP03',
        action: 'cancelled'
      };
    }
    
    // 4. バックアップ & 修復
    await createBackup('before-any-fix');
    
    for (const fix of fixes) {
      await replaceInFile(
        fix.file,
        `: any`,
        `: ${fix.after}`
      );
    }
    
    // 5. noImplicitAny 有効化
    await enableNoImplicitAny();
    
    // 6. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-any-fix');
      return {
        success: false,
        pattern: 'TP03',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'TP03',
      action: 'fixed',
      fixes: fixes.length,
      message: `Replaced ${fixes.length} 'any' types`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP03',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * TypeScript の型推論を取得
 */
async function inferType(file: string, line: number): Promise<string | null> {
  try {
    // TypeScript Language Server API を使用
    const program = ts.createProgram([file], {});
    const sourceFile = program.getSourceFile(file);
    const typeChecker = program.getTypeChecker();
    
    // 該当行のノードを取得
    const node = findNodeAtLine(sourceFile, line);
    if (!node) return null;
    
    // 型を推論
    const type = typeChecker.getTypeAtLocation(node);
    return typeChecker.typeToString(type);
    
  } catch (error) {
    return null;
  }
}

/**
 * noImplicitAny を有効化
 */
async function enableNoImplicitAny(): Promise<void> {
  const tsconfig = await readJsonFile('tsconfig.json');
  tsconfig.compilerOptions.noImplicitAny = true;
  await writeJsonFile('tsconfig.json', tsconfig);
}
```

---

## 🔄 TP04: null/undefined混在

### 問題の説明
```typescript
// ❌ 問題: null と undefined が混在
function getUser(id: string): User | null {
  if (!id) return null;
  return undefined; // 不統一!
}

// ❌ 問題: 型定義の不統一
interface Config {
  apiUrl: string | null;    // null を使用
  timeout?: number;          // undefined を使用
}
```

### 診断手順

```bash
# ステップ1: null 使用箇所
echo "=== Step 1: Finding null usage ==="
grep -rn "| null" src/

# ステップ2: undefined 使用箇所
echo "=== Step 2: Finding undefined usage ==="
grep -rn "| undefined" src/

# ステップ3: 混在チェック
echo "=== Step 3: Checking inconsistency ==="
grep -rn "| null\| | undefined" src/ | head -20
```

### 自動修復手順

```typescript
/**
 * null/undefined混在を統一
 * レベル: L1 (完全自動 - undefined に統一)
 */
async function healNullUndefinedInconsistency(): Promise<HealingResult> {
  try {
    // 1. プロジェクトのポリシー決定
    const policy = 'undefined'; // 推奨: undefined
    
    // 2. 使用箇所スキャン
    const inconsistencies = await scanForNullUndefinedUsage();
    
    if (inconsistencies.length === 0) {
      return {
        success: true,
        pattern: 'TP04',
        action: 'no-action',
        message: 'Null/undefined usage is consistent'
      };
    }
    
    // 3. バックアップ
    await createBackup('before-null-undefined-fix');
    
    const fixes: string[] = [];
    
    // 4. 型定義を統一
    for (const file of await getAllTypeScriptFiles()) {
      let content = await readFile(file);
      let changed = false;
      
      // | null → | undefined
      if (content.includes('| null')) {
        content = content.replace(/\| null/g, '| undefined');
        changed = true;
      }
      
      // : null → : undefined
      if (content.includes(': null')) {
        content = content.replace(/: null/g, ': undefined');
        changed = true;
      }
      
      // return null → return undefined
      if (content.includes('return null')) {
        content = content.replace(/return null/g, 'return undefined');
        changed = true;
      }
      
      if (changed) {
        await writeFile(file, content);
        fixes.push(file);
      }
    }
    
    // 5. ESLint ルール追加
    await addEslintRule('no-null/no-null', 'error');
    
    // 6. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-null-undefined-fix');
      return {
        success: false,
        pattern: 'TP04',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'TP04',
      action: 'fixed',
      fixes: fixes.length,
      message: `Unified null/undefined in ${fixes.length} files`
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

## 🎯 TP06: 型アサーション乱用

### 問題の説明
```typescript
// ❌ 問題: 不必要な型アサーション
const user = data as User; // 型チェックをスキップ

// ❌ 問題: 二重アサーション
const value = data as unknown as CustomType; // 危険!

// ❌ 問題: any 経由
const result = (data as any).property;
```

### 診断手順

```bash
# ステップ1: 型アサーション箇所
echo "=== Step 1: Finding type assertions ==="
grep -rn " as " src/ | wc -l

# ステップ2: 二重アサーション検出
echo "=== Step 2: Finding double assertions ==="
grep -rn " as unknown as " src/

# ステップ3: any アサーション検出
echo "=== Step 3: Finding any assertions ==="
grep -rn " as any" src/
```

### 半自動修復手順

```typescript
/**
 * 型アサーション乱用を修正
 * レベル: L2 (半自動)
 */
async function healTypeAssertionAbuse(): Promise<HealingResult> {
  try {
    // 1. 型アサーション箇所を収集
    const assertions = await scanForTypeAssertions();
    
    // 2. 不要・危険なアサーションを特定
    const problematic = assertions.filter(a => 
      a.type === 'double' || 
      a.type === 'any' || 
      a.unnecessaryConfidence > 0.7
    );
    
    if (problematic.length === 0) {
      return {
        success: true,
        pattern: 'TP06',
        action: 'no-action',
        message: 'No problematic type assertions found'
      };
    }
    
    // 3. 修復案生成
    const fixes = problematic.map(assertion => {
      const { file, line, code, type } = assertion;
      
      if (type === 'double') {
        return {
          file,
          line,
          issue: 'Double assertion (as unknown as)',
          fix: `
// Before:
const value = data as unknown as CustomType;

// After: Use type guard
function isCustomType(data: unknown): data is CustomType {
  return typeof data === 'object' && data !== null && 'property' in data;
}
const value = isCustomType(data) ? data : null;
          `.trim()
        };
      }
      
      if (type === 'any') {
        return {
          file,
          line,
          issue: 'Assertion to any',
          fix: `
// Before:
const result = (data as any).property;

// After: Proper typing
interface DataWithProperty {
  property: string;
}
const result = (data as DataWithProperty).property;
          `.trim()
        };
      }
      
      // 不要なアサーション
      return {
        file,
        line,
        issue: 'Unnecessary assertion',
        fix: 'Remove assertion - type inference works'
      };
    });
    
    // 4. プレビュー
    const approved = await showFixPreview({
      title: 'Type Assertion Issues',
      count: fixes.length,
      fixes
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'TP06',
        action: 'cancelled'
      };
    }
    
    return {
      success: true,
      pattern: 'TP06',
      action: 'manual',
      fixes,
      message: 'Please review and apply suggested fixes'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP06',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## ⚠️ TP07: Promise未処理

### 問題の説明
```typescript
// ❌ 問題: Promise の結果を無視
fetchData(); // 結果を使っていない

// ❌ 問題: エラーハンドリングなし
async function loadUser() {
  const user = await fetchUser(); // エラーキャッチなし
}

// ❌ 問題: floating promise
useEffect(() => {
  fetchData(); // await がない
}, []);
```

### 診断手順

```bash
# ステップ1: ESLint チェック
echo "=== Step 1: Checking floating promises ==="
npm run lint 2>&1 | grep "no-floating-promises"

# ステップ2: try-catch チェック
echo "=== Step 2: Checking error handling ==="
grep -A10 "async function" src/ | grep -c "try"

# ステップ3: Promise チェーン
echo "=== Step 3: Checking Promise chains ==="
grep -rn "\.then(" src/ | grep -v "\.catch("
```

### 半自動修復手順

```typescript
/**
 * Promise未処理を修正
 * レベル: L2 (半自動)
 */
async function healUnhandledPromises(): Promise<HealingResult> {
  try {
    // 1. ESLint で検出
    const issues = await runEslint('@typescript-eslint/no-floating-promises');
    
    if (issues.length === 0) {
      return {
        success: true,
        pattern: 'TP07',
        action: 'no-action',
        message: 'No unhandled promises found'
      };
    }
    
    // 2. 各問題を分析
    const fixes = issues.map(issue => {
      const { file, line, code } = issue;
      
      if (code.includes('useEffect')) {
        return {
          file,
          line,
          issue: 'Floating promise in useEffect',
          fix: `
// Before:
useEffect(() => {
  fetchData();
}, []);

// After:
useEffect(() => {
  const loadData = async () => {
    try {
      await fetchData();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };
  loadData();
}, []);
          `.trim()
        };
      }
      
      if (code.includes('async function')) {
        return {
          file,
          line,
          issue: 'Missing error handling',
          fix: `
// Before:
async function loadUser() {
  const user = await fetchUser();
}

// After:
async function loadUser() {
  try {
    const user = await fetchUser();
    return user;
  } catch (error) {
    console.error('Failed to load user:', error);
    throw error;
  }
}
          `.trim()
        };
      }
      
      return {
        file,
        line,
        issue: 'Floating promise',
        fix: `
// Before:
fetchData();

// After (Option 1: await):
await fetchData();

// After (Option 2: void):
void fetchData(); // Explicitly ignore

// After (Option 3: handle):
fetchData().catch(error => {
  console.error('Error:', error);
});
        `.trim()
      };
    });
    
    // 3. プレビュー
    const approved = await showFixPreview({
      title: 'Unhandled Promise Issues',
      count: fixes.length,
      fixes
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'TP07',
        action: 'cancelled'
      };
    }
    
    return {
      success: true,
      pattern: 'TP07',
      action: 'manual',
      fixes,
      message: 'Please review and apply suggested fixes'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'TP07',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 🔑 RP03: Key prop不足

### 問題の説明
```typescript
// ❌ 問題: key がない
{items.map(item => (
  <div>{item.name}</div>
))}

// ❌ 問題: インデックスを key に使用
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

### 診断手順

```bash
# ステップ1: ESLint チェック
echo "=== Step 1: Checking missing keys ==="
npm run lint 2>&1 | grep "react/jsx-key"

# ステップ2: map 使用箇所
echo "=== Step 2: Finding map usage ==="
grep -rn "\.map(" src/**/*.tsx | wc -l

# ステップ3: インデックス key 検出
echo "=== Step 3: Finding index keys ==="
grep -rn "key={index}" src/
```

### 自動修復手順

```typescript
/**
 * Key prop不足を自動修正
 * レベル: L1 (完全自動)
 */
async function healMissingKeyProps(): Promise<HealingResult> {
  try {
    // 1. ESLint で検出
    const issues = await runEslint('react/jsx-key');
    
    if (issues.length === 0) {
      return {
        success: true,
        pattern: 'RP03',
        action: 'no-action',
        message: 'No missing key props found'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-key-fix');
    
    const fixes: string[] = [];
    
    // 3. 各問題を修復
    for (const issue of issues) {
      const { file, line, code } = issue;
      
      // コードを解析
      const analysis = analyzeMapExpression(code);
      
      if (!analysis) continue;
      
      const { mapVariable, itemVariable, hasId } = analysis;
      
      // 適切な key を決定
      const keyProp = hasId ? `key={${itemVariable}.id}` : `key={\`\${${itemVariable}.name}-\${index}\`}`;
      
      // key prop を追加
      const fixed = code.replace(
        /(<\w+)(\s)/,
        `$1 ${keyProp}$2`
      );
      
      await replaceInFile(file, code, fixed);
      fixes.push(`${file}:${line}`);
    }
    
    // 4. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-key-fix');
      return {
        success: false,
        pattern: 'RP03',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'RP03',
      action: 'fixed',
      fixes: fixes.length,
      message: `Added key props to ${fixes.length} components`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'RP03',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * map 式を解析
 */
function analyzeMapExpression(code: string): {
  mapVariable: string;
  itemVariable: string;
  hasId: boolean;
} | null {
  // {items.map(item => ...)} パターン
  const match = code.match(/(\w+)\.map\((\w+)\s*=>/);
  if (!match) return null;
  
  const mapVariable = match[1];
  const itemVariable = match[2];
  
  // .id を参照しているか
  const hasId = code.includes(`${itemVariable}.id`);
  
  return { mapVariable, itemVariable, hasId };
}
```

---

## 🚀 RP05: メモ化不足

### 問題の説明
```typescript
// ❌ 問題: 重い計算がメモ化されていない
function ExpensiveComponent({ data }) {
  const processed = expensiveCalculation(data); // 毎回計算!
  return <div>{processed}</div>;
}

// ❌ 問題: コンポーネントがメモ化されていない
function ListItem({ item }) {
  return <div>{item.name}</div>; // 親の再レンダリングで毎回再レンダリング
}
```

### 診断手順

```bash
# ステップ1: useMemo 使用率チェック
echo "=== Step 1: Checking useMemo usage ==="
grep -c "useMemo" src/**/*.tsx

# ステップ2: React.memo 使用率チェック
echo "=== Step 2: Checking React.memo usage ==="
grep -c "React.memo\|memo(" src/**/*.tsx

# ステップ3: 重い計算の検出
echo "=== Step 3: Finding expensive calculations ==="
grep -rn "\.map(\|\.filter(\|\.reduce(" src/**/*.tsx | head -20
```

### 半自動修復手順

```typescript
/**
 * メモ化不足を検出して提案
 * レベル: L2 (半自動)
 */
async function healMissingMemoization(): Promise<HealingResult> {
  try {
    // 1. メモ化候補をスキャン
    const candidates = await scanForMemoizationCandidates();
    
    if (candidates.length === 0) {
      return {
        success: true,
        pattern: 'RP05',
        action: 'no-action',
        message: 'No obvious memoization opportunities found'
      };
    }
    
    // 2. 各候補を分析
    const suggestions = candidates.map(candidate => {
      const { file, line, type, code } = candidate;
      
      if (type === 'expensive-calculation') {
        return {
          file,
          line,
          issue: 'Expensive calculation without memoization',
          fix: `
// Before:
const processed = expensiveCalculation(data);

// After: useMemo
const processed = useMemo(
  () => expensiveCalculation(data),
  [data]
);
          `.trim(),
          impact: 'medium'
        };
      }
      
      if (type === 'component-memoization') {
        return {
          file,
          line,
          issue: 'Component re-renders unnecessarily',
          fix: `
// Before:
function ListItem({ item }) {
  return <div>{item.name}</div>;
}

// After: React.memo
const ListItem = memo(function ListItem({ item }) {
  return <div>{item.name}</div>;
});
          `.trim(),
          impact: 'high'
        };
      }
      
      if (type === 'callback-memoization') {
        return {
          file,
          line,
          issue: 'Callback recreated on every render',
          fix: `
// Before:
const handleClick = () => {
  doSomething(value);
};

// After: useCallback
const handleClick = useCallback(
  () => {
    doSomething(value);
  },
  [value]
);
          `.trim(),
          impact: 'low'
        };
      }
    });
    
    // 3. プレビュー
    const approved = await showFixPreview({
      title: 'Memoization Opportunities',
      count: suggestions.length,
      suggestions
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'RP05',
        action: 'cancelled'
      };
    }
    
    return {
      success: true,
      pattern: 'RP05',
      action: 'manual',
      suggestions,
      message: 'Please review and apply suggested optimizations'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'RP05',
      action: 'error',
      error: error.message
    };
  }
}
```

---

**次のステップ**: P1診断プレイブック (Build & Data) 作成

**最終更新**: 2025-12-19  
**バージョン**: 1.0.0
