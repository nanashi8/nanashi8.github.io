# 緊急復旧ガイド

**最終更新**: 2025年12月2日  
**目的**: 機能損失時に仕様書のみで完全復旧できる手順書

---

## 🚨 緊急時の対応フロー

### 1. 状況確認

```bash
# 現在の状態を確認
git status
git log --oneline -10

# ビルドエラー確認
npm run build

# 型エラー確認
npm run typecheck

# E2Eテスト実行
npm run test:smoke
```

### 2. 即座のロールバック

```bash
# 直前のコミットに戻す
git reset --hard HEAD~1

# 特定のファイルのみ戻す
git checkout HEAD~1 -- src/components/QuizApp.tsx

# 特定のコミットに戻す
git checkout <commit-hash>
```

### 3. 復旧作業開始

以下のセクションから該当する機能の復旧手順を参照

---

## 📚 機能別復旧手順

### A. 和訳クイズ機能が動作しない

#### 症状
- クイズが開始されない
- 選択肢がクリックできない
- スコアが更新されない

#### 原因チェックリスト
- [ ] `QuizState`の型定義は正しいか
- [ ] `useState`の初期化は正しいか
- [ ] イベントハンドラは定義されているか
- [ ] CSV読み込みは成功しているか

#### 復旧手順

**1. 型定義の確認**

`src/types.ts`:
```typescript
export interface Question {
  word: string;
  reading: string;
  meaning: string;
  etymology: string;
  relatedWords: string;
  relatedFields: string;
  category?: string;
  difficulty: string;
  source?: 'junior' | 'intermediate';
  type?: 'word' | 'phrase';
  isPhraseOnly?: boolean;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  totalAnswered: number;
  answered: boolean;
  selectedAnswer: string | null;
}
```

**2. 状態管理の確認**

コンポーネント内で以下の状態が必要:
```typescript
const [questions, setQuestions] = useState<Question[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [score, setScore] = useState(0);
const [totalAnswered, setTotalAnswered] = useState(0);
const [answered, setAnswered] = useState(false);
const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
```

**3. イベントハンドラの確認**

```typescript
const handleAnswerClick = (selectedMeaning: string) => {
  if (answered) return;
  
  setSelectedAnswer(selectedMeaning);
  setAnswered(true);
  setTotalAnswered(prev => prev + 1);
  
  const isCorrect = selectedMeaning === currentQuestion.meaning;
  if (isCorrect) {
    setScore(prev => prev + 1);
  }
  
  // 次の問題へ進む（1秒後）
  setTimeout(() => {
    setCurrentIndex(prev => prev + 1);
    setAnswered(false);
    setSelectedAnswer(null);
  }, 1000);
};
```

**4. CSV読み込みの確認**

```typescript
useEffect(() => {
  const loadQuestions = async () => {
    try {
      const response = await fetch('/data/all-words.csv');
      const csvText = await response.text();
      const parsed = parseCSV(csvText);
      setQuestions(parsed);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };
  
  loadQuestions();
}, []);
```

**5. 選択肢生成の確認**

```typescript
const generateChoices = (correct: string, allQuestions: Question[]): string[] => {
  const choices = [correct];
  
  // 2つの誤答を追加
  const others = allQuestions
    .filter(q => q.meaning !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .map(q => q.meaning);
  
  choices.push(...others);
  
  // シャッフル
  return choices.sort(() => Math.random() - 0.5);
};
```

---

### B. TypeScriptエラーが大量発生

#### 症状
- `npm run typecheck`で多数のエラー
- ビルドが失敗する

#### 復旧手順

**1. エラーログ確認**

```bash
npm run typecheck 2>&1 | tee typescript-errors.log
```

**2. よくあるエラーパターン**

##### パターン1: Propsの型定義不足

```typescript
// ❌ エラー
function Component(props) {
  return <div>{props.title}</div>;
}

// ✅ 修正
interface ComponentProps {
  title: string;
}

function Component({ title }: ComponentProps) {
  return <div>{title}</div>;
}
```

##### パターン2: useState の型指定不足

```typescript
// ❌ エラー
const [data, setData] = useState(null);

// ✅ 修正
const [data, setData] = useState<Question | null>(null);
```

##### パターン3: イベントハンドラの型不足

```typescript
// ❌ エラー
const handleClick = (e) => { };

// ✅ 修正
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { };
```

**3. 段階的修正**

```bash
# 1ファイルずつ修正
# エラー数を確認
npm run typecheck | grep "error TS"

# 修正後、再確認
npm run typecheck
```

---

### C. CSSレイアウトが崩れた

#### 症状
- 要素の位置がずれている
- 色が正しく表示されない
- ダークモードが効かない

#### 復旧手順

**1. 即座のロールバック**

```bash
# CSSファイルを直前の状態に戻す
git checkout HEAD~1 -- src/styles/themes/dark.css

# ビルドして確認
npm run build
npm run dev
```

**2. CSS変数の確認**

`src/styles/variables.css`が正しく読み込まれているか:

```typescript
// App.tsx または main.tsx
import './styles/variables.css';
import './styles/global.css';
import './styles/themes/dark.css';
```

**3. 重複セレクタの検出**

```bash
# 重複チェック
grep -n "\.dark-mode \.quiz-card" src/styles/themes/dark.css

# 2つ以上出力された場合は重複
# 後の定義を残し、前を削除
```

**4. CSS変数の使用確認**

```css
/* ❌ ハードコード値（削除） */
.button {
  color: #ffffff;
  padding: 16px;
}

/* ✅ CSS変数使用 */
.button {
  color: var(--color-text);
  padding: var(--spacing-md);
}
```

---

### D. Pre-commitフックが動作しない

#### 症状
- `git commit`時にチェックが実行されない
- フックがスキップされる

#### 復旧手順

**1. Huskyの再初期化**

```bash
# Huskyをインストール
npm install --save-dev husky

# 初期化
npx husky install

# core.hooksPath設定確認
git config core.hooksPath
# 出力: .husky
```

**2. pre-commitファイルの再作成**

`.husky/pre-commit`:
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

echo "✨ すべてのチェックが完了しました！"
```

**3. 実行権限付与**

```bash
chmod +x .husky/pre-commit
```

**4. 動作確認**

```bash
# テストコミット
git add README.md
git commit -m "test: pre-commit hook"

# フックが実行されることを確認
```

---

### E. Playwrightテストが失敗する

#### 症状
- E2Eテストがすべて失敗
- ブラウザが起動しない

#### 復旧手順

**1. Playwrightの再インストール**

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps
```

**2. テスト設定の確認**

`playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**3. スモークテストの確認**

`tests/smoke.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('アプリが起動する', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});

test('クイズが開始できる', async ({ page }) => {
  await page.goto('/');
  
  // クイズタブをクリック
  await page.click('text=和訳クイズ');
  
  // 問題が表示されることを確認
  await expect(page.locator('.quiz-question')).toBeVisible();
});
```

**4. テスト実行**

```bash
# スモークテストのみ
npm run test:smoke

# 完全テスト
npm run test:e2e

# デバッグモード
npx playwright test --debug
```

---

### F. データが読み込めない

#### 症状
- CSVファイルが読み込めない
- 「データが見つかりません」エラー

#### 復旧手順

**1. ファイルパスの確認**

```typescript
// ❌ 間違ったパス
const response = await fetch('data/all-words.csv');

// ✅ 正しいパス（publicディレクトリ基準）
const response = await fetch('/data/all-words.csv');
```

**2. ファイルの存在確認**

```bash
ls -la public/data/
# all-words.csv が存在することを確認
```

**3. CSV解析関数の確認**

```typescript
function parseCSV(csvText: string): Question[] {
  const lines = csvText.trim().split('\n');
  const questions: Question[] = [];
  
  // ヘッダー行をスキップ
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const parts = line.split(',');
    if (parts.length < 7) continue;
    
    questions.push({
      word: parts[0].trim(),
      reading: parts[1].trim(),
      meaning: parts[2].trim(),
      etymology: parts[3].trim(),
      relatedWords: parts[4].trim(),
      relatedFields: parts[5].trim(),
      difficulty: parts[6].trim(),
    });
  }
  
  return questions;
}
```

**4. エラーハンドリング**

```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const response = await fetch('/data/all-words.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const parsed = parseCSV(csvText);
      
      if (parsed.length === 0) {
        console.warn('No questions loaded');
      }
      
      setQuestions(parsed);
    } catch (error) {
      console.error('Failed to load data:', error);
      // エラーメッセージを表示
      setError('データの読み込みに失敗しました');
    }
  };
  
  loadData();
}, []);
```

---

## 🔧 開発環境の完全再構築

### すべてが壊れた場合の最終手段

**1. クリーンな状態に戻す**

```bash
# node_modules削除
rm -rf node_modules package-lock.json

# キャッシュクリア
rm -rf .vite dist

# Git作業ディレクトリクリーン
git clean -fdx
```

**2. 依存関係の再インストール**

```bash
npm install
```

**3. Huskyの再セットアップ**

```bash
npx husky install
```

**4. ビルドテスト**

```bash
npm run typecheck
npm run build
npm run dev
```

**5. テスト実行**

```bash
npm run test:smoke
```

---

## 📋 チェックリスト

### 復旧完了確認

- [ ] `npm run typecheck` が成功（0エラー）
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` が成功
- [ ] `npm run dev` でアプリ起動
- [ ] Simple BrowserでUI確認
- [ ] 和訳クイズが動作
- [ ] スペルクイズが動作
- [ ] 長文読解が動作
- [ ] 文法問題が動作
- [ ] データが正しく読み込まれる
- [ ] Pre-commitフックが動作
- [ ] E2Eテストが成功

---

## 📞 サポート情報

### 関連ドキュメント

- [CSS開発ガイドライン](../development/CSS_DEVELOPMENT_GUIDELINES.md)
- [TypeScript開発ガイドライン](../development/TYPESCRIPT_DEVELOPMENT_GUIDELINES.md)
- [品質管理パイプライン](../quality/QUALITY_PIPELINE.md)
- [データ構造仕様書](../specifications/15-data-structures.md)

### よくある質問

**Q: ロールバック後も問題が解決しない**  
A: より前のコミットに戻すか、クリーンインストールを実行

**Q: 型エラーが解決できない**  
A: `tsconfig.json`の`strict`設定を一時的に`false`にして原因を特定

**Q: CSSが効かない**  
A: ブラウザのキャッシュをクリア（Cmd+Shift+R）

---

**最終更新**: 2025年12月2日  
**改訂履歴**: 
- 2025-12-02: 初版作成（過去の障害事例を反映）
