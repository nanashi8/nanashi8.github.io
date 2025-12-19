---
description: 既知の問題パターン一覧と分類
applyTo: '**'
---

# 既知の問題パターン一覧

**目的**: プロジェクトで発生した/発生する可能性のある問題を体系的に管理

---

## 📊 問題パターン分類

| カテゴリ | 問題数 | 自動修復可能 | 優先度 |
|---------|-------|------------|-------|
| **TypeScript** | 10 | 7 | P0-P1 |
| **React** | 8 | 5 | P1-P2 |
| **Data** | 7 | 4 | P0-P1 |
| **Build** | 6 | 5 | P1 |
| **Test** | 5 | 4 | P1-P2 |
| **Dependency** | 5 | 5 | P0-P2 |
| **Performance** | 4 | 2 | P2 |
| **Security** | 3 | 3 | P0 |
| **Git** | 2 | 2 | P1 |
| **合計** | **50** | **37** | - |

---

## 🔧 TypeScript 問題パターン (10件)

### TP01: undefined エラー

**問題**:
```typescript
TypeError: Cannot read property 'map' of undefined
```

**原因**: オプショナルプロパティの未チェック

**診断**:
```bash
grep -r "\.map\|\.filter\|\.find" src/ | grep -v "?"
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
// Before
questions.map(q => q.id)

// After
questions?.map(q => q.id) || []
```

**優先度**: P0

---

### TP02: 型不一致エラー

**問題**:
```
Type 'string' is not assignable to type 'number'
```

**原因**: 型キャストの欠落

**診断**:
```bash
npx tsc --noEmit 2>&1 | grep "not assignable"
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
// Before
const score: number = userInput;

// After
const score: number = Number(userInput);
```

**優先度**: P0

---

### TP03: any 型の濫用

**問題**:
```typescript
const data: any = fetchData();
```

**原因**: 型定義の怠慢

**診断**:
```bash
grep -r ": any" src/ | wc -l
```

**自動修復**: ⚠️ 半自動（型推論支援）

**修復手順**:
1. 実際のデータ構造を分析
2. 適切な型を定義
3. any を置換

**優先度**: P1

---

### TP04: null/undefined 混在

**問題**:
```typescript
let value: string | null | undefined;
```

**原因**: nullとundefinedの使い分け不明確

**診断**:
```bash
grep -r "| null | undefined" src/
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
// Before
let value: string | null | undefined;

// After (nullに統一)
let value: string | null;
```

**優先度**: P2

---

### TP05: 未使用インポート

**問題**:
```typescript
import { unused } from 'module';
```

**原因**: リファクタリング後の削除忘れ

**診断**:
```bash
npm run lint 2>&1 | grep "is defined but never used"
```

**自動修復**: ✅ 可能（ESLint --fix）

**修復手順**:
```bash
npm run lint -- --fix
```

**優先度**: P2

---

### TP06: 型アサーションの乱用

**問題**:
```typescript
const value = data as SomeType;
```

**原因**: 型安全性の軽視

**診断**:
```bash
grep -r " as " src/ | wc -l
```

**自動修復**: ❌ 不可（手動レビュー必要）

**優先度**: P1

---

### TP07: Promise の未処理

**問題**:
```typescript
async function fetchData() { ... }
fetchData(); // Promise not awaited
```

**原因**: await 忘れ

**診断**:
```bash
npx tsc --noEmit 2>&1 | grep "forgotten await"
```

**自動修復**: ⚠️ 警告のみ

**優先度**: P1

---

### TP08: Enum vs Union Type

**問題**:
```typescript
enum Color { Red, Blue }
```

**原因**: Enum の過剰使用

**診断**:
```bash
grep -r "enum " src/
```

**自動修復**: ✅ 可能（Union Typeに変換）

**修復手順**:
```typescript
// Before
enum Color { Red, Blue }

// After
type Color = 'Red' | 'Blue';
```

**優先度**: P2

---

### TP09: デコレーター未使用

**問題**:
```typescript
class MyClass {
  @deprecated
  oldMethod() {}
}
```

**原因**: tsconfig設定不足

**診断**:
```bash
grep "experimentalDecorators" tsconfig.json
```

**自動修復**: ✅ 可能

**修復手順**:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

**優先度**: P1

---

### TP10: strictモード違反

**問題**:
```typescript
// strict: true でエラー
let value;
value = 10;
```

**原因**: 暗黙的any

**診断**:
```bash
grep "strict" tsconfig.json
```

**自動修復**: ⚠️ 設定変更のみ

**優先度**: P1

---

## ⚛️ React 問題パターン (8件)

### RP01: useEffect 依存配列の欠落

**問題**:
```typescript
useEffect(() => {
  fetchData(id);
}, []); // idが依存配列にない
```

**原因**: 依存配列の理解不足

**診断**:
```bash
npm run lint 2>&1 | grep "React Hook useEffect has a missing dependency"
```

**自動修復**: ⚠️ ESLint提案あり

**修復手順**:
```typescript
useEffect(() => {
  fetchData(id);
}, [id, fetchData]);
```

**優先度**: P0

---

### RP02: 無限レンダリングループ

**問題**:
```typescript
const [state, setState] = useState(0);
setState(state + 1); // レンダリングごとに実行
```

**原因**: useEffect/useCallback の誤用

**診断**: ブラウザのフリーズ

**自動修復**: ❌ 不可

**修復手順**:
```typescript
useEffect(() => {
  setState(state + 1);
}, []); // 初回のみ実行
```

**優先度**: P0

---

### RP03: Key propの欠落

**問題**:
```typescript
{items.map(item => <div>{item}</div>)}
```

**原因**: keyの重要性理解不足

**診断**:
```bash
# Reactの警告を確認
```

**自動修復**: ⚠️ 提案のみ

**修復手順**:
```typescript
{items.map(item => <div key={item.id}>{item}</div>)}
```

**優先度**: P1

---

### RP04: State の直接変更

**問題**:
```typescript
state.value = 10; // ❌
```

**原因**: Reactの原則理解不足

**診断**: UIが更新されない

**自動修復**: ❌ 不可

**修復手順**:
```typescript
setState(prev => ({ ...prev, value: 10 }));
```

**優先度**: P0

---

### RP05: メモ化の欠落

**問題**:
```typescript
function Component({ data }) {
  const processed = data.map(expensiveOperation); // 毎回実行
  return <div>{processed}</div>;
}
```

**原因**: useMemo/useCallbackの未使用

**診断**: React DevTools Profiler

**自動修復**: ⚠️ 提案のみ

**修復手順**:
```typescript
const processed = useMemo(
  () => data.map(expensiveOperation),
  [data]
);
```

**優先度**: P1

---

### RP06: useRef の誤用

**問題**:
```typescript
const [ref, setRef] = useState(null); // useRefを使うべき
```

**原因**: useRefとuseStateの使い分け不明確

**診断**: 不必要な再レンダリング

**自動修復**: ⚠️ 提案のみ

**修復手順**:
```typescript
const ref = useRef(null);
```

**優先度**: P2

---

### RP07: Fragment の未使用

**問題**:
```typescript
return (
  <div>
    <Child1 />
    <Child2 />
  </div>
); // 不必要なdiv
```

**原因**: Fragmentの認知不足

**診断**:
```bash
grep -r "return (\n  <div>" src/
```

**自動修復**: ⚠️ 提案のみ

**修復手順**:
```typescript
return (
  <>
    <Child1 />
    <Child2 />
  </>
);
```

**優先度**: P2

---

### RP08: Controlled vs Uncontrolled

**問題**:
```typescript
<input value={value} /> // onChangeなし
```

**原因**: Controlledコンポーネントの理解不足

**診断**: Reactの警告

**自動修復**: ❌ 不可

**修復手順**:
```typescript
<input 
  value={value} 
  onChange={(e) => setValue(e.target.value)} 
/>
```

**優先度**: P1

---

## 💾 Data 問題パターン (7件)

### DP01: localStorage 破損

**問題**: データが読み込めない

**原因**: 不正なJSON

**診断**:
```javascript
try {
  JSON.parse(localStorage.getItem('key'));
} catch {
  console.error('Corrupted data');
}
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
function safeLoadData(key: string) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
```

**優先度**: P0

---

### DP02: データマイグレーション失敗

**問題**: 旧バージョンのデータが読めない

**原因**: マイグレーションロジック欠落

**診断**: バージョンチェック

**自動修復**: ✅ 可能

**修復手順**:
```typescript
function migrateData(data: any) {
  if (!data.version) {
    // v1 → v2 マイグレーション
    return { ...data, version: 2 };
  }
  return data;
}
```

**優先度**: P0

---

### DP03: ID 重複

**問題**: 同じIDが複数存在

**原因**: ID生成ロジックの不備

**診断**:
```typescript
const ids = questions.map(q => q.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
function fixDuplicateIds(items: Item[]) {
  const seen = new Set();
  return items.map(item => {
    if (seen.has(item.id)) {
      item.id = generateUniqueId();
    }
    seen.add(item.id);
    return item;
  });
}
```

**優先度**: P0

---

### DP04: データ型不一致

**問題**: string vs number の混在

**原因**: 型変換の欠落

**診断**:
```typescript
const hasTypeMismatch = questions.some(q => 
  typeof q.score !== 'number'
);
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
questions.forEach(q => {
  q.score = Number(q.score);
});
```

**優先度**: P1

---

### DP05: 必須フィールドの欠落

**問題**: 必須データがnull/undefined

**原因**: バリデーション不足

**診断**:
```typescript
const invalid = questions.filter(q => 
  !q.id || !q.text || !q.category
);
```

**自動修復**: ⚠️ デフォルト値設定

**修復手順**:
```typescript
function validateQuestion(q: Question) {
  return {
    id: q.id || generateId(),
    text: q.text || 'No text',
    category: q.category || 'uncategorized'
  };
}
```

**優先度**: P1

---

### DP06: 配列の空チェック漏れ

**問題**:
```typescript
questions[0].text // questions が空配列の場合エラー
```

**原因**: 境界チェック不足

**診断**:
```bash
grep -r "\[0\]" src/ | grep -v "length"
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
questions[0]?.text || 'No question'
```

**優先度**: P1

---

### DP07: 日付フォーマット不統一

**問題**: "2023-12-19" vs 1703000000000

**原因**: フォーマット標準化不足

**診断**:
```typescript
const hasInconsistentDates = questions.some(q =>
  typeof q.date === 'number' || typeof q.date === 'string'
);
```

**自動修復**: ✅ 可能

**修復手順**:
```typescript
function normalizeDates(questions: Question[]) {
  return questions.map(q => ({
    ...q,
    date: new Date(q.date).getTime()
  }));
}
```

**優先度**: P2

---

## 🏗️ Build 問題パターン (6件)

### BP01: ビルドサイズ肥大化

**問題**: bundle.js > 1MB

**原因**: 不要な依存関係

**診断**:
```bash
npm run build
du -sh dist/assets/*.js
```

**自動修復**: ⚠️ 提案のみ

**修復手順**:
1. バンドルアナライザー実行
2. 大きいモジュール特定
3. 動的インポートに変更

**優先度**: P1

---

### BP02: ビルド失敗（メモリ不足）

**問題**: JavaScript heap out of memory

**原因**: Node.jsのメモリ上限

**診断**: ビルドログ

**自動修復**: ✅ 可能

**修復手順**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**優先度**: P1

---

### BP03: 環境変数未設定

**問題**: import.meta.env.VITE_API_KEY が undefined

**原因**: .env ファイル不足

**診断**:
```bash
ls .env.local
```

**自動修復**: ⚠️ テンプレート提供

**修復手順**:
```bash
cp .env.example .env.local
```

**優先度**: P0

---

### BP04: import パスエラー

**問題**: Module not found: '@/components/...'

**原因**: tsconfig paths 設定ミス

**診断**:
```bash
grep "paths" tsconfig.json
```

**自動修復**: ✅ 可能

**修復手順**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**優先度**: P0

---

### BP05: CSS の読み込み失敗

**問題**: スタイルが適用されない

**原因**: importの欠落

**診断**:
```bash
grep -r "import.*\.css" src/
```

**自動修復**: ⚠️ 検出のみ

**修復手順**:
```typescript
import './styles.css';
```

**優先度**: P1

---

### BP06: Vite config エラー

**問題**: Invalid configuration

**原因**: 設定ファイルの構文エラー

**診断**:
```bash
npm run build 2>&1 | grep "vite.config"
```

**自動修復**: ❌ 不可

**修復手順**: 手動修正

**優先度**: P0

---

## 🧪 Test 問題パターン (5件)

### TP01: テスト失敗（タイムアウト）

**問題**: Test timeout exceeded

**原因**: 非同期処理の未完了

**診断**: テストログ

**自動修復**: ⚠️ timeout延長のみ

**修復手順**:
```typescript
test('async test', async () => {
  await waitFor(() => expect(element).toBeInTheDocument());
}, 10000); // 10秒に延長
```

**優先度**: P1

---

### TP02: モックの設定漏れ

**問題**: Cannot find module 'module'

**原因**: jest.mock() 不足

**診断**: テストエラーログ

**自動修復**: ⚠️ テンプレート提供

**修復手順**:
```typescript
jest.mock('module', () => ({
  default: jest.fn()
}));
```

**優先度**: P1

---

### TP03: スナップショット不一致

**問題**: Snapshot mismatch

**原因**: UI変更後の更新忘れ

**診断**: テストエラー

**自動修復**: ✅ 可能

**修復手順**:
```bash
npm test -- -u
```

**優先度**: P2

---

### TP04: カバレッジ不足

**問題**: Coverage < 95%

**原因**: テスト不足

**診断**:
```bash
npm test -- --coverage
```

**自動修復**: ❌ 不可

**修復手順**: テスト追加

**優先度**: P1

---

### TP05: E2E テスト失敗

**問題**: Playwright test failed

**原因**: セレクタ変更

**診断**: Playwrightログ

**自動修復**: ⚠️ セレクタ提案

**修復手順**:
```typescript
// Before
await page.click('.button');

// After (data-testid使用)
await page.click('[data-testid="submit-button"]');
```

**優先度**: P1

---

## 📦 Dependency 問題パターン (5件)

### DP01: セキュリティ脆弱性

**問題**: npm audit で Critical

**原因**: 古いパッケージ

**診断**:
```bash
npm audit
```

**自動修復**: ✅ 可能

**修復手順**:
```bash
npm audit fix
```

**優先度**: P0

---

### DP02: バージョン競合

**問題**: peer dependency conflict

**原因**: 互換性のないバージョン

**診断**: npm installエラー

**自動修復**: ⚠️ 提案のみ

**修復手順**:
```bash
npm install package@compatible-version
```

**優先度**: P1

---

### DP03: lockfile の差異

**問題**: package-lock.json が異なる

**原因**: npm install の環境差異

**診断**:
```bash
git diff package-lock.json
```

**自動修復**: ✅ 可能

**修復手順**:
```bash
npm ci
```

**優先度**: P1

---

### DP04: 未使用パッケージ

**問題**: 使っていないライブラリが残存

**原因**: 削除忘れ

**診断**:
```bash
npx depcheck
```

**自動修復**: ✅ 可能

**修復手順**:
```bash
npm uninstall unused-package
```

**優先度**: P2

---

### DP05: パッケージ破損

**問題**: Module not found after install

**原因**: node_modules 破損

**診断**: import エラー

**自動修復**: ✅ 可能

**修復手順**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**優先度**: P1

---

## ⚡ Performance 問題パターン (4件)

### PP01: 初回ロード遅延

**問題**: ページロード > 3秒

**原因**: バンドルサイズ

**診断**:
```bash
npm run build
lighthouse https://nanashi8.github.io
```

**自動修復**: ⚠️ 提案のみ

**修復手順**: コード分割・遅延ロード

**優先度**: P2

---

### PP02: 無限スクロールの重さ

**問題**: 1000+アイテムでフリーズ

**原因**: 仮想化未使用

**診断**: React DevTools Profiler

**自動修復**: ❌ 不可

**修復手順**: react-window導入

**優先度**: P1

---

### PP03: 不必要な再レンダリング

**問題**: 親コンポーネント変更で全子が再レンダリング

**原因**: memo/useMemo未使用

**診断**: React DevTools Profiler

**自動修復**: ⚠️ 提案のみ

**修復手順**: React.memo適用

**優先度**: P2

---

### PP04: メモリリーク

**問題**: メモリ使用量が増加し続ける

**原因**: useEffect cleanup 不足

**診断**: Chrome DevTools Memory

**自動修復**: ❌ 不可

**修復手順**:
```typescript
useEffect(() => {
  const id = setInterval(...);
  return () => clearInterval(id);
}, []);
```

**優先度**: P1

---

## 🔒 Security 問題パターン (3件)

### SP01: APIキー露出

**問題**: ソースコードにAPIキー

**原因**: .envファイル未使用

**診断**:
```bash
grep -r "sk-" src/
grep -r "API_KEY.*=" src/
```

**自動修復**: ⚠️ 検出のみ

**修復手順**:
1. キーを無効化
2. 環境変数に移行
3. Git履歴から削除

**優先度**: P0

---

### SP02: XSS脆弱性

**問題**: dangerouslySetInnerHTML使用

**原因**: サニタイズ不足

**診断**:
```bash
grep -r "dangerouslySetInnerHTML" src/
```

**自動修復**: ⚠️ 提案のみ

**修復手順**: DOMPurify導入

**優先度**: P0

---

### SP03: CORS エラー

**問題**: Access-Control-Allow-Origin

**原因**: サーバー設定不足

**診断**: ブラウザコンソール

**自動修復**: ⚠️ 設定テンプレート

**修復手順**: vite.config.ts設定

**優先度**: P1

---

## 🔗 Git 問題パターン (2件)

### GP01: マージコンフリクト

**問題**: Merge conflict

**原因**: 並行編集

**診断**:
```bash
git status | grep "both modified"
```

**自動修復**: ⚠️ 簡単なケースのみ

**修復手順**:
```bash
git mergetool
```

**優先度**: P1

---

### GP02: 誤コミット

**問題**: 不要なファイルがコミット

**原因**: .gitignore不足

**診断**:
```bash
git status
```

**自動修復**: ✅ 可能

**修復手順**:
```bash
git rm --cached unwanted-file
echo "unwanted-pattern" >> .gitignore
```

**優先度**: P1

---

## 📊 統計サマリー

```
総パターン数: 50
自動修復可能: 37 (74%)
手動対応必要: 13 (26%)

優先度別:
  P0 (Critical): 15 (30%)
  P1 (High): 24 (48%)
  P2 (Medium): 11 (22%)

カテゴリ別トップ3:
  1. TypeScript: 10パターン
  2. React: 8パターン
  3. Data: 7パターン
```

---

**最終更新**: 2025-12-19  
**バージョン**: 1.0.0  
**次のステップ**: 各パターンの詳細診断プレイブック作成
