---
description: P0（クリティカル）問題の診断プレイブック
version: 1.0.0
created: 2025-12-19
applyTo: '**'
priority: critical
phase: 1
---

# P0 診断プレイブック

**対象**: クリティカル（即座に対応が必要な問題）15パターン

---

## 🚨 P0問題の特徴

```
クリティカル問題:
- 本番環境で即座に影響
- ユーザー体験の著しい低下
- セキュリティリスク
- データ損失の可能性

対応時間: <1時間
```

---

## 📋 P0パターン一覧

| ID | パターン | 自動修復 | カテゴリ |
|----|---------|---------|----------|
| SP01 | APIキー露出 | ✅ | Security |
| SP02 | XSS脆弱性 | ⚠️ | Security |
| DP01 | localStorage破損 | ✅ | Data |
| TP01 | undefined参照エラー | ✅ | TypeScript |
| TP02 | 型不一致エラー | ⚠️ | TypeScript |
| BP03 | 環境変数未定義 | ✅ | Build |
| BP04 | import path エラー | ✅ | Build |
| BP06 | Vite config エラー | ❌ | Build |
| RP01 | useEffect依存配列 | ⚠️ | React |
| RP02 | 無限レンダリングループ | ⚠️ | React |
| RP04 | State直接変更 | ⚠️ | React |
| DP02 | データマイグレーション失敗 | ❌ | Data |
| DP03 | ID重複 | ✅ | Data |
| DP01 (Dep) | セキュリティ脆弱性 | ⚠️ | Dependency |
| BP01 | ビルド失敗 | ⚠️ | Build |

---

## 🔐 SP01: APIキー露出

### 問題の説明
```typescript
// ❌ 危険: ハードコードされたAPIキー
const API_KEY = 'sk-abc123xyz...';

// ❌ 危険: フロントエンドで直接使用
fetch('https://api.example.com', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});
```

### 診断手順

```bash
# ステップ1: APIキーの存在チェック
echo "=== Step 1: Scanning for API keys ==="
grep -r "sk-[a-zA-Z0-9]" src/
grep -r "AIza[a-zA-Z0-9]" src/
grep -r "AKIA[a-zA-Z0-9]" src/
grep -r "Bearer [a-zA-Z0-9]" src/

# ステップ2: 環境変数チェック
echo "=== Step 2: Checking env files ==="
cat .env 2>/dev/null || echo ".env not found"
cat .env.local 2>/dev/null || echo ".env.local not found"

# ステップ3: Git履歴チェック
echo "=== Step 3: Checking Git history ==="
git log -S"API_KEY" --oneline
git log -S"Bearer" --oneline

# ステップ4: 公開状態チェック
echo "=== Step 4: Checking if keys are exposed ==="
grep -r "VITE_" .env* | grep -v "VITE_PUBLIC_"
```

### 自動修復手順

```typescript
/**
 * APIキー露出の自動修復
 * レベル: L1 (完全自動)
 */
async function healApiKeyExposure(): Promise<HealingResult> {
  const findings: string[] = [];
  const fixes: string[] = [];
  
  try {
    // 1. スキャン
    const hardcodedKeys = await scanForApiKeys([
      /sk-[a-zA-Z0-9]{32,}/g,     // OpenAI
      /AIza[a-zA-Z0-9]{35}/g,      // Google
      /AKIA[a-zA-Z0-9]{16}/g,      // AWS
      /ghp_[a-zA-Z0-9]{36}/g       // GitHub
    ]);
    
    if (hardcodedKeys.length === 0) {
      return {
        success: true,
        pattern: 'SP01',
        action: 'no-action',
        message: 'No hardcoded API keys found'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-api-key-fix');
    
    // 3. 各キーを修復
    for (const finding of hardcodedKeys) {
      const { file, line, key, type } = finding;
      
      // 3.1. .env に移動
      const envVarName = `VITE_${type}_API_KEY`;
      await addToEnvFile('.env.example', envVarName, '');
      await addToEnvFile('.env.local', envVarName, key);
      
      // 3.2. コードを書き換え
      await replaceInFile(
        file,
        key,
        `import.meta.env.${envVarName}`
      );
      
      fixes.push(`${file}:${line} - ${type} key`);
    }
    
    // 4. Git履歴をクリーン
    const inGitHistory = await checkGitHistory(hardcodedKeys);
    if (inGitHistory.length > 0) {
      // Git filter-branch で履歴から削除
      await execCommand(
        `git filter-branch --tree-filter 'git ls-files -z | xargs -0 sed -i "s/${key}/REDACTED/g"' HEAD`
      );
      
      fixes.push('Git history cleaned');
    }
    
    // 5. .gitignore 更新
    await ensureGitIgnore([
      '.env.local',
      '.env.*.local'
    ]);
    
    // 6. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-api-key-fix');
      return {
        success: false,
        pattern: 'SP01',
        action: 'rollback',
        reason: 'Tests failed after fix'
      };
    }
    
    // 7. 成功
    await deleteBackup('before-api-key-fix');
    
    return {
      success: true,
      pattern: 'SP01',
      action: 'fixed',
      findings: findings.length,
      fixes,
      message: `Fixed ${fixes.length} API key exposures`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'SP01',
      action: 'error',
      error: error.message
    };
  }
}
```

### 手動対応が必要な場合

```markdown
1. キーを無効化（最優先）
   - OpenAI: https://platform.openai.com/api-keys
   - GitHub: https://github.com/settings/tokens
   - AWS: AWS Console → IAM

2. 新しいキーを発行

3. .env.local に設定

4. GitHub Secretsに登録（CI/CD用）
   - Settings → Secrets and variables → Actions
```

---

## 🛡️ SP02: XSS脆弱性

### 問題の説明
```typescript
// ❌ 危険: dangerouslySetInnerHTML
function Comment({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}

// ❌ 危険: eval
eval(userInput);

// ❌ 危険: innerHTML
element.innerHTML = userInput;
```

### 診断手順

```bash
# ステップ1: dangerouslySetInnerHTML スキャン
echo "=== Step 1: Scanning for dangerouslySetInnerHTML ==="
grep -rn "dangerouslySetInnerHTML" src/

# ステップ2: eval スキャン
echo "=== Step 2: Scanning for eval ==="
grep -rn "eval(" src/

# ステップ3: innerHTML スキャン
echo "=== Step 3: Scanning for innerHTML ==="
grep -rn "\.innerHTML\s*=" src/

# ステップ4: sanitize チェック
echo "=== Step 4: Checking sanitization ==="
grep -rn "DOMPurify" src/
grep -rn "sanitize" src/

# ステップ5: Content Security Policy チェック
echo "=== Step 5: Checking CSP ==="
grep -r "Content-Security-Policy" index.html vite.config.ts
```

### 半自動修復手順

```typescript
/**
 * XSS脆弱性の半自動修復
 * レベル: L2 (半自動 - プレビュー必要)
 */
async function healXssVulnerability(): Promise<HealingResult> {
  try {
    // 1. スキャン
    const vulnerabilities = await scanForXss();
    
    if (vulnerabilities.length === 0) {
      return {
        success: true,
        pattern: 'SP02',
        action: 'no-action',
        message: 'No XSS vulnerabilities found'
      };
    }
    
    // 2. 修復案生成
    const fixes = vulnerabilities.map(vuln => {
      switch (vuln.type) {
        case 'dangerouslySetInnerHTML':
          return {
            ...vuln,
            fix: `
// Before:
<div dangerouslySetInnerHTML={{ __html: ${vuln.variable} }} />

// After (Option 1: DOMPurify):
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(${vuln.variable}) }} />

// After (Option 2: Plain text):
<div>{${vuln.variable}}</div>
            `.trim()
          };
          
        case 'eval':
          return {
            ...vuln,
            fix: `
// Before:
eval(${vuln.variable});

// After (if JSON):
JSON.parse(${vuln.variable});

// After (if function):
// Refactor to avoid eval - provide context-specific solution
            `.trim()
          };
          
        case 'innerHTML':
          return {
            ...vuln,
            fix: `
// Before:
element.innerHTML = ${vuln.variable};

// After (Option 1: textContent):
element.textContent = ${vuln.variable};

// After (Option 2: DOMPurify):
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(${vuln.variable});
            `.trim()
          };
      }
    });
    
    // 3. ユーザーにプレビュー
    const approved = await showFixPreview({
      title: 'XSS Vulnerabilities Found',
      count: vulnerabilities.length,
      fixes
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'SP02',
        action: 'cancelled',
        reason: 'User rejected fix'
      };
    }
    
    // 4. DOMPurify インストール（必要なら）
    const hasDOMPurify = await hasPackage('dompurify');
    if (!hasDOMPurify) {
      await execCommand('npm install dompurify');
      await execCommand('npm install -D @types/dompurify');
    }
    
    // 5. 各脆弱性を修復
    await createBackup('before-xss-fix');
    
    for (const fix of fixes) {
      await applyFix(fix.file, fix.line, fix.fix);
    }
    
    // 6. Content Security Policy 追加
    await addCSP();
    
    // 7. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-xss-fix');
      return {
        success: false,
        pattern: 'SP02',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'SP02',
      action: 'fixed',
      vulnerabilities: vulnerabilities.length,
      message: `Fixed ${vulnerabilities.length} XSS vulnerabilities`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'SP02',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * Content Security Policy 追加
 */
async function addCSP(): Promise<void> {
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
  `.replace(/\s+/g, ' ').trim();
  
  // index.html に追加
  await addToHtmlHead(
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`
  );
}
```

---

## 💾 DP01: localStorage破損

### 問題の説明
```typescript
// ❌ 問題: 破損したJSON
localStorage.setItem('data', '{broken json');

// ❌ 問題: パース失敗
const data = JSON.parse(localStorage.getItem('data')); // throws!
```

### 診断手順

```bash
# ステップ1: localStorage使用箇所特定
echo "=== Step 1: Finding localStorage usage ==="
grep -rn "localStorage\." src/

# ステップ2: エラーハンドリングチェック
echo "=== Step 2: Checking error handling ==="
grep -A5 "localStorage\.getItem" src/ | grep -c "try"

# ステップ3: バックアップ機構チェック
echo "=== Step 3: Checking backup mechanism ==="
grep -rn "_backup" src/
```

### 自動修復手順

```typescript
/**
 * localStorage破損の自動修復
 * レベル: L1 (完全自動)
 */
function healLocalStorageCorruption(): HealingResult {
  try {
    const keys = Object.keys(localStorage);
    const corruptedKeys: string[] = [];
    const fixedKeys: string[] = [];
    const errors: string[] = [];
    
    // 1. 全キーをスキャン
    for (const key of keys) {
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;
        
        // パース試行
        JSON.parse(data);
        
      } catch (error) {
        corruptedKeys.push(key);
        
        // 2. 修復試行
        try {
          // 2.1. バックアップから復元
          const backupKey = `${key}_backup`;
          const backup = localStorage.getItem(backupKey);
          
          if (backup) {
            JSON.parse(backup); // 検証
            localStorage.setItem(key, backup);
            fixedKeys.push(`${key} (from backup)`);
            continue;
          }
          
          // 2.2. デフォルト値で初期化
          const defaultValue = getDefaultValueForKey(key);
          if (defaultValue) {
            localStorage.setItem(key, JSON.stringify(defaultValue));
            fixedKeys.push(`${key} (default)`);
            continue;
          }
          
          // 2.3. 削除
          localStorage.removeItem(key);
          fixedKeys.push(`${key} (removed)`);
          
        } catch (fixError) {
          errors.push(`${key}: ${fixError.message}`);
        }
      }
    }
    
    // 3. 結果
    if (corruptedKeys.length === 0) {
      return {
        success: true,
        pattern: 'DP01',
        action: 'no-action',
        message: 'No corrupted data found'
      };
    }
    
    return {
      success: true,
      pattern: 'DP01',
      action: 'fixed',
      corruptedKeys,
      fixedKeys,
      errors,
      message: `Fixed ${fixedKeys.length}/${corruptedKeys.length} corrupted keys`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'DP01',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * キーのデフォルト値を取得
 */
function getDefaultValueForKey(key: string): any {
  const defaults: Record<string, any> = {
    'userData': { level: 1, points: 0 },
    'settings': { theme: 'light', language: 'en' },
    'progress': { completed: [], current: null },
    'statistics': { totalQuestions: 0, correctAnswers: 0 }
  };
  
  return defaults[key];
}
```

---

## 🔴 TP01: undefined参照エラー

### 問題の説明
```typescript
// ❌ 問題: undefined参照
const user = getUser();
console.log(user.name); // TypeError: Cannot read property 'name' of undefined

// ❌ 問題: 配列アクセス
const items = getItems();
const first = items[0].id; // TypeError: Cannot read property 'id' of undefined
```

### 診断手順

```bash
# ステップ1: undefined参照箇所特定
echo "=== Step 1: Finding potential undefined references ==="
grep -rn "Cannot read property.*of undefined" src/

# ステップ2: Optional chaining チェック
echo "=== Step 2: Checking optional chaining usage ==="
grep -c "\?\\." src/**/*.ts src/**/*.tsx

# ステップ3: Null check チェック
echo "=== Step 3: Checking null checks ==="
grep -c "if.*!= null" src/**/*.ts src/**/*.tsx
grep -c "if.*!== undefined" src/**/*.ts src/**/*.tsx

# ステップ4: TypeScript strict mode チェック
echo "=== Step 4: Checking strictNullChecks ==="
grep "strictNullChecks" tsconfig.json
```

### 自動修復手順

```typescript
/**
 * undefined参照エラーの自動修復
 * レベル: L1 (完全自動)
 */
async function healUndefinedReference(): Promise<HealingResult> {
  try {
    // 1. スキャン
    const issues = await scanForUndefinedReferences();
    
    if (issues.length === 0) {
      return {
        success: true,
        pattern: 'TP01',
        action: 'no-action',
        message: 'No undefined references found'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-undefined-fix');
    
    // 3. 各問題を修復
    const fixes: string[] = [];
    
    for (const issue of issues) {
      const { file, line, code } = issue;
      
      // パターンマッチング
      const patterns = [
        {
          // obj.prop → obj?.prop
          from: /(\w+)\.(\w+)/g,
          to: '$1?.$2',
          condition: (match: string) => !match.includes('?.')
        },
        {
          // arr[0].prop → arr[0]?.prop
          from: /(\w+)\[(\d+)\]\.(\w+)/g,
          to: '$1[$2]?.$3',
          condition: (match: string) => !match.includes('?.')
        },
        {
          // obj.method() → obj?.method()
          from: /(\w+)\.(\w+)\(/g,
          to: '$1?.$2(',
          condition: (match: string) => !match.includes('?.')
        }
      ];
      
      let fixedCode = code;
      for (const pattern of patterns) {
        if (pattern.condition(code)) {
          fixedCode = code.replace(pattern.from, pattern.to);
        }
      }
      
      if (fixedCode !== code) {
        await replaceInFile(file, code, fixedCode);
        fixes.push(`${file}:${line}`);
      }
    }
    
    // 4. strictNullChecks 有効化
    await enableStrictNullChecks();
    
    // 5. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-undefined-fix');
      return {
        success: false,
        pattern: 'TP01',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'TP01',
      action: 'fixed',
      fixes,
      message: `Fixed ${fixes.length} undefined references`
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
 * strictNullChecks を有効化
 */
async function enableStrictNullChecks(): Promise<void> {
  const tsconfig = await readJsonFile('tsconfig.json');
  
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }
  
  tsconfig.compilerOptions.strictNullChecks = true;
  
  await writeJsonFile('tsconfig.json', tsconfig);
}
```

---

## 🔧 BP03: 環境変数未定義

### 問題の説明
```typescript
// ❌ 問題: 環境変数が未定義
const apiUrl = import.meta.env.VITE_API_URL; // undefined!

// ❌ 問題: ビルドエラー
// ReferenceError: process is not defined
```

### 診断手順

```bash
# ステップ1: 環境変数使用箇所特定
echo "=== Step 1: Finding env variable usage ==="
grep -rn "import\.meta\.env\." src/
grep -rn "process\.env\." src/

# ステップ2: .env ファイルチェック
echo "=== Step 2: Checking .env files ==="
ls -la .env*
cat .env.example

# ステップ3: vite.config チェック
echo "=== Step 3: Checking vite.config ==="
grep "define" vite.config.ts

# ステップ4: 未定義変数リスト
echo "=== Step 4: Listing undefined variables ==="
grep -oh "VITE_[A-Z_]*" src/**/*.{ts,tsx} | sort -u > /tmp/used_vars.txt
grep -oh "VITE_[A-Z_]*" .env.example | sort -u > /tmp/defined_vars.txt
comm -23 /tmp/used_vars.txt /tmp/defined_vars.txt
```

### 自動修復手順

```typescript
/**
 * 環境変数未定義の自動修復
 * レベル: L1 (完全自動)
 */
async function healMissingEnvVars(): Promise<HealingResult> {
  try {
    // 1. 使用されている環境変数を収集
    const usedVars = await scanForEnvVars();
    
    // 2. 定義されている環境変数を収集
    const definedVars = await getDefinedEnvVars();
    
    // 3. 未定義の変数を特定
    const missingVars = usedVars.filter(v => !definedVars.includes(v));
    
    if (missingVars.length === 0) {
      return {
        success: true,
        pattern: 'BP03',
        action: 'no-action',
        message: 'All env variables are defined'
      };
    }
    
    // 4. .env.example に追加
    await createBackup('before-env-fix');
    
    const additions: string[] = [];
    for (const varName of missingVars) {
      const defaultValue = getDefaultEnvValue(varName);
      await appendToFile('.env.example', `${varName}=${defaultValue}\n`);
      additions.push(varName);
    }
    
    // 5. .env.local チェック（存在しなければ作成）
    const envLocalExists = await fileExists('.env.local');
    if (!envLocalExists) {
      await copyFile('.env.example', '.env.local');
    }
    
    // 6. .gitignore 確認
    await ensureGitIgnore(['.env.local']);
    
    // 7. README 更新
    await updateEnvDocumentation(missingVars);
    
    return {
      success: true,
      pattern: 'BP03',
      action: 'fixed',
      additions,
      message: `Added ${additions.length} missing env variables to .env.example`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'BP03',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * 環境変数のデフォルト値を取得
 */
function getDefaultEnvValue(varName: string): string {
  const defaults: Record<string, string> = {
    'VITE_API_URL': 'http://localhost:3000',
    'VITE_APP_NAME': 'My App',
    'VITE_VERSION': '1.0.0',
    'VITE_DEBUG': 'false'
  };
  
  // パターンマッチング
  if (varName.includes('URL')) return 'http://localhost:3000';
  if (varName.includes('KEY')) return 'your-key-here';
  if (varName.includes('DEBUG')) return 'false';
  if (varName.includes('PORT')) return '3000';
  
  return defaults[varName] || '';
}

/**
 * README の環境変数セクションを更新
 */
async function updateEnvDocumentation(vars: string[]): Promise<void> {
  const readme = await readFile('README.md');
  
  const envSection = `
## Environment Variables

Copy \`.env.example\` to \`.env.local\` and fill in the values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Required variables:
${vars.map(v => `- \`${v}\`: Description here`).join('\n')}
  `.trim();
  
  // 既存のセクションを更新 or 追加
  if (readme.includes('## Environment Variables')) {
    // 更新
    await replaceInFile(
      'README.md',
      /## Environment Variables[\s\S]*?(?=##|$)/,
      envSection
    );
  } else {
    // 追加
    await appendToFile('README.md', `\n\n${envSection}\n`);
  }
}
```

---

## 🔗 BP04: import path エラー

### 問題の説明
```typescript
// ❌ 問題: 相対パスエラー
import { helper } from '../../../utils/helper'; // 深すぎる

// ❌ 問題: エイリアス未定義
import { Component } from '@/components/Component'; // @ が解決できない

// ❌ 問題: 拡張子エラー
import data from './data.json'; // JSON import エラー
```

### 診断手順

```bash
# ステップ1: import エラー検出
echo "=== Step 1: Detecting import errors ==="
npx tsc --noEmit 2>&1 | grep "Cannot find module"

# ステップ2: 相対パスの深さチェック
echo "=== Step 2: Checking relative path depth ==="
grep -rn "from '\.\./\.\./\.\./" src/

# ステップ3: エイリアス設定チェック
echo "=== Step 3: Checking path aliases ==="
grep "paths" tsconfig.json
grep "resolve.alias" vite.config.ts

# ステップ4: 存在しないファイル検出
echo "=== Step 4: Finding missing files ==="
grep -oh "from '[^']*'" src/**/*.ts | sed "s/from '//;s/'//" | while read path; do
  [ ! -f "src/$path" ] && echo "Missing: src/$path"
done
```

### 自動修復手順

```typescript
/**
 * import path エラーの自動修復
 * レベル: L1 (完全自動)
 */
async function healImportPathErrors(): Promise<HealingResult> {
  try {
    // 1. エラー検出
    const errors = await detectImportErrors();
    
    if (errors.length === 0) {
      return {
        success: true,
        pattern: 'BP04',
        action: 'no-action',
        message: 'No import path errors found'
      };
    }
    
    // 2. バックアップ
    await createBackup('before-import-fix');
    
    const fixes: string[] = [];
    
    // 3. 各エラーを修復
    for (const error of errors) {
      const { file, line, importPath, errorType } = error;
      
      switch (errorType) {
        case 'deep-relative':
          // ../../../ → @ エイリアス
          const aliasPath = convertToAlias(importPath);
          await replaceInFile(file, importPath, aliasPath);
          fixes.push(`${file}:${line} - alias`);
          break;
          
        case 'missing-extension':
          // data.json → data.json (JSON import 設定)
          await enableJsonImport();
          fixes.push(`${file}:${line} - json import`);
          break;
          
        case 'wrong-path':
          // 正しいパスを検索
          const correctPath = await findCorrectPath(importPath);
          if (correctPath) {
            await replaceInFile(file, importPath, correctPath);
            fixes.push(`${file}:${line} - corrected`);
          }
          break;
      }
    }
    
    // 4. Path alias 設定（必要なら）
    await ensurePathAliases();
    
    // 5. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-import-fix');
      return {
        success: false,
        pattern: 'BP04',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'BP04',
      action: 'fixed',
      fixes,
      message: `Fixed ${fixes.length} import path errors`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'BP04',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * 相対パスをエイリアスに変換
 */
function convertToAlias(relativePath: string): string {
  // ../../../components/Button → @/components/Button
  const cleaned = relativePath.replace(/^(\.\.\/)+/, '');
  return `@/${cleaned}`;
}

/**
 * Path alias 設定を確保
 */
async function ensurePathAliases(): Promise<void> {
  // tsconfig.json
  const tsconfig = await readJsonFile('tsconfig.json');
  if (!tsconfig.compilerOptions.paths) {
    tsconfig.compilerOptions.paths = {
      '@/*': ['./src/*']
    };
    await writeJsonFile('tsconfig.json', tsconfig);
  }
  
  // vite.config.ts
  const viteConfig = await readFile('vite.config.ts');
  if (!viteConfig.includes('resolve.alias')) {
    const aliasConfig = `
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
    `.trim();
    
    await addToViteConfig(aliasConfig);
  }
}

/**
 * JSON import を有効化
 */
async function enableJsonImport(): Promise<void> {
  const tsconfig = await readJsonFile('tsconfig.json');
  tsconfig.compilerOptions.resolveJsonModule = true;
  await writeJsonFile('tsconfig.json', tsconfig);
}
```

---

## ⚛️ RP01: useEffect依存配列

### 問題の説明
```typescript
// ❌ 問題: 依存配列が不完全
useEffect(() => {
  fetchData(userId); // userId が依存配列にない!
}, []); // <- 空配列

// ❌ 問題: 不要な依存
useEffect(() => {
  console.log('mounted');
}, [userId]); // <- userId は不要
```

### 診断手順

```bash
# ステップ1: useEffect 警告検出
echo "=== Step 1: Detecting useEffect warnings ==="
npm run lint 2>&1 | grep "react-hooks/exhaustive-deps"

# ステップ2: useEffect 使用箇所特定
echo "=== Step 3: Finding useEffect usage ==="
grep -rn "useEffect" src/

# ステップ3: ESLint プラグインチェック
echo "=== Step 3: Checking ESLint plugin ==="
grep "eslint-plugin-react-hooks" package.json
```

### 半自動修復手順

```typescript
/**
 * useEffect依存配列の半自動修復
 * レベル: L2 (半自動)
 */
async function healUseEffectDeps(): Promise<HealingResult> {
  try {
    // 1. ESLint で検出
    const warnings = await runEslint('react-hooks/exhaustive-deps');
    
    if (warnings.length === 0) {
      return {
        success: true,
        pattern: 'RP01',
        action: 'no-action',
        message: 'No useEffect dependency issues found'
      };
    }
    
    // 2. 各警告を分析
    const fixes = await Promise.all(
      warnings.map(async (warning) => {
        const { file, line, missingDeps, unnecessaryDeps } = warning;
        
        // コード取得
        const code = await getCodeAtLine(file, line, 10);
        const analysis = analyzeUseEffect(code);
        
        return {
          file,
          line,
          before: analysis.currentDeps,
          after: analysis.suggestedDeps,
          confidence: analysis.confidence,
          impact: analysis.impact
        };
      })
    );
    
    // 3. プレビュー表示
    const approved = await showFixPreview({
      title: 'useEffect Dependency Issues',
      count: fixes.length,
      fixes: fixes.map(f => ({
        location: `${f.file}:${f.line}`,
        before: `[${f.before.join(', ')}]`,
        after: `[${f.after.join(', ')}]`,
        confidence: `${(f.confidence * 100).toFixed(0)}%`,
        impact: f.impact
      }))
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'RP01',
        action: 'cancelled',
        reason: 'User rejected fix'
      };
    }
    
    // 4. バックアップ
    await createBackup('before-useeffect-fix');
    
    // 5. 修復実行
    for (const fix of fixes) {
      await replaceInFile(
        fix.file,
        `[${fix.before.join(', ')}]`,
        `[${fix.after.join(', ')}]`
      );
    }
    
    // 6. テスト
    const testResult = await testValidator.validate();
    if (!testResult) {
      await restoreBackup('before-useeffect-fix');
      return {
        success: false,
        pattern: 'RP01',
        action: 'rollback',
        reason: 'Tests failed'
      };
    }
    
    return {
      success: true,
      pattern: 'RP01',
      action: 'fixed',
      fixes: fixes.length,
      message: `Fixed ${fixes.length} useEffect dependency issues`
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'RP01',
      action: 'error',
      error: error.message
    };
  }
}

/**
 * useEffect コードを分析
 */
function analyzeUseEffect(code: string): {
  currentDeps: string[];
  suggestedDeps: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
} {
  // useEffect 本体から使用されている変数を抽出
  const usedVars = extractUsedVariables(code);
  
  // 現在の依存配列を抽出
  const currentDeps = extractDependencyArray(code);
  
  // 推奨される依存配列
  const suggestedDeps = usedVars.filter(v => {
    // props, state, context は含める
    // 定数は除外
    return isReactiveValue(v);
  });
  
  // 信頼度計算
  const confidence = calculateConfidence(usedVars, suggestedDeps);
  
  // 影響度計算
  const impact = calculateImpact(currentDeps, suggestedDeps);
  
  return { currentDeps, suggestedDeps, confidence, impact };
}
```

---

## 🔄 RP02: 無限レンダリングループ

### 問題の説明
```typescript
// ❌ 問題: useEffect で state 更新
useEffect(() => {
  setCount(count + 1); // 無限ループ!
}, [count]);

// ❌ 問題: オブジェクト生成
useEffect(() => {
  setConfig({ theme: 'dark' }); // 毎回新しいオブジェクト
}, [config]);
```

### 診断手順

```bash
# ステップ1: ブラウザコンソールチェック
echo "=== Step 1: Checking for infinite loop warnings ==="
# "Maximum update depth exceeded" をチェック

# ステップ2: useEffect パターンスキャン
echo "=== Step 2: Scanning for problematic useEffect patterns ==="
grep -A10 "useEffect" src/**/*.tsx | grep "set[A-Z]" | grep -v "return"

# ステップ3: React DevTools Profiler で確認
echo "=== Step 3: Use React DevTools Profiler ==="
echo "Check for components with high render counts"
```

### 半自動修復手順

```typescript
/**
 * 無限レンダリングループの検出と修復
 * レベル: L2 (半自動)
 */
async function healInfiniteRenderLoop(): Promise<HealingResult> {
  try {
    // 1. 問題パターンを検出
    const issues = await scanForInfiniteLoops();
    
    if (issues.length === 0) {
      return {
        success: true,
        pattern: 'RP02',
        action: 'no-action',
        message: 'No infinite render loops detected'
      };
    }
    
    // 2. 各問題を分析
    const fixes = issues.map(issue => {
      const { file, line, pattern } = issue;
      
      switch (pattern) {
        case 'state-update-in-effect':
          return {
            file,
            line,
            issue: 'State update in useEffect with state in deps',
            fix: `
// Before:
useEffect(() => {
  setState(state + 1);
}, [state]);

// After (Option 1: Remove dependency):
useEffect(() => {
  setState(prevState => prevState + 1);
}, []); // Use functional update

// After (Option 2: Add condition):
useEffect(() => {
  if (shouldUpdate) {
    setState(state + 1);
  }
}, [state, shouldUpdate]);
            `.trim()
          };
          
        case 'object-in-dependency':
          return {
            file,
            line,
            issue: 'Object/array in dependency array',
            fix: `
// Before:
useEffect(() => {
  doSomething(config);
}, [config]); // Object identity changes every render

// After (Option 1: useMemo):
const memoizedConfig = useMemo(() => config, [config.key, config.value]);
useEffect(() => {
  doSomething(memoizedConfig);
}, [memoizedConfig]);

// After (Option 2: Individual properties):
useEffect(() => {
  doSomething(config);
}, [config.key, config.value]); // Depend on primitives
            `.trim()
          };
          
        case 'function-recreation':
          return {
            file,
            line,
            issue: 'Function recreated on every render',
            fix: `
// Before:
const handleClick = () => { /* ... */ };
useEffect(() => {
  element.addEventListener('click', handleClick);
}, [handleClick]); // Function recreated every render

// After: useCallback
const handleClick = useCallback(() => {
  /* ... */
}, [/* dependencies */]);
useEffect(() => {
  element.addEventListener('click', handleClick);
}, [handleClick]);
            `.trim()
          };
      }
    });
    
    // 3. プレビュー
    const approved = await showFixPreview({
      title: 'Infinite Render Loop Issues',
      count: fixes.length,
      fixes
    });
    
    if (!approved) {
      return {
        success: false,
        pattern: 'RP02',
        action: 'cancelled',
        reason: 'User rejected fix'
      };
    }
    
    // 4. 手動対応が必要
    return {
      success: true,
      pattern: 'RP02',
      action: 'manual',
      fixes,
      message: 'Please review and apply suggested fixes manually'
    };
    
  } catch (error) {
    return {
      success: false,
      pattern: 'RP02',
      action: 'error',
      error: error.message
    };
  }
}
```

---

## 📊 P0診断実行フロー

```typescript
/**
 * すべてのP0診断を実行
 */
async function runP0Diagnostics(): Promise<DiagnosticReport> {
  const results: HealingResult[] = [];
  
  const p0Patterns = [
    { id: 'SP01', fn: healApiKeyExposure },
    { id: 'SP02', fn: healXssVulnerability },
    { id: 'DP01', fn: healLocalStorageCorruption },
    { id: 'TP01', fn: healUndefinedReference },
    { id: 'BP03', fn: healMissingEnvVars },
    { id: 'BP04', fn: healImportPathErrors },
    { id: 'RP01', fn: healUseEffectDeps },
    { id: 'RP02', fn: healInfiniteRenderLoop }
    // ... 残り7パターン
  ];
  
  console.log('🚨 Starting P0 (Critical) diagnostics...\n');
  
  for (const pattern of p0Patterns) {
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
  
  console.log(`\n📊 P0 Diagnostic Summary:`);
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

**次のステップ**: P1診断プレイブック作成（24パターン）

**最終更新**: 2025-12-19  
**バージョン**: 1.0.0
