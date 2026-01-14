# テスト実践ガイド

このドキュメントでは、プロジェクトで使用しているテスト手法と、その効果・目的について解説します。

## 目次

- [テストとは何か](#テストとは何か)
- [なぜテストが必要か](#なぜテストが必要か)
- [テストの種類](#テストの種類)
- [このプロジェクトのテスト構成](#このプロジェクトのテスト構成)
- [実際のテスト例と解説](#実際のテスト例と解説)
- [テストの運用方法](#テストの運用方法)
- [テストを書く際のベストプラクティス](#テストを書く際のベストプラクティス)

---

## テストとは何か

**テスト**とは、コードが意図した通りに動作するか確認する行為です。

### 日常的な例え

料理に例えると：
- **味見** = テスト
- 完成した料理を食べる前に、途中で味を確認しますよね？
- 塩が足りないか、火が通っているか、確認する行為がテストです

プログラミングでも同じで：
- コードを本番環境に出す前に
- 「このボタンを押したら正しく動くか？」
- 「この計算は正しい結果を返すか？」
を確認するのがテストです。

---

## なぜテストが必要か

### 1. **バグの早期発見**

コードを書いた直後にテストを実行すれば、バグをすぐに見つけられます。

**テストがない場合：**
```
コード変更 → デプロイ → ユーザーが使う → バグ発見 → 修正 → 再デプロイ
（時間がかかる + ユーザーに迷惑）
```

**テストがある場合：**
```
コード変更 → テスト実行 → バグ発見 → 修正 → テスト実行 → OK → デプロイ
（デプロイ前に安全確認）
```

### 2. **コード変更の安全性**

「Aを修正したらBが壊れた」という事故を防ぎます。

**実例（このプロジェクトで実際にあったケース）：**
- 再出題機能（`useQuestionRequeue`）を修正したら、Position計算が壊れた
- でもテストがあったので、デプロイ前に発見できた

### 3. **ドキュメントとしての役割**

テストコードは「このコードがどう動くべきか」を示す実例です。

```typescript
// このテストを読めば、「重複がある場合はskipする」と分かる
it('近い将来に同一IDが存在する場合、挿入せず skip ログを残す', () => {
  // ...
  expect(returned).toBe(questions); // 元のままで変更しない
  expect(entry.decision).toBe('skipped_exists_nearby');
});
```

### 4. **リファクタリングの自信**

「コードをきれいにしたい」と思っても、「壊さないか不安」で手が出せない…  
→ テストがあれば、安心してリファクタリングできます。

---

## テストの種類

プロジェクトでは主に3種類のテストを使用しています。

### 1. ユニットテスト（Unit Test）

**目的：** 小さな機能（関数・コンポーネント）単体の動作確認

**例え：** 車の部品（エンジン、タイヤ）を個別にチェック

**このプロジェクトの例：**
```typescript
// tests/unit/useQuestionRequeue.test.ts
// 「再出題機能」単体の動作を確認
it('重複がなければ挿入する', () => {
  const result = reAddQuestion(question, questions, 0);
  expect(result).toHaveLength(questions.length + 1);
});
```

**メリット：**
- ✅ 高速（数ミリ秒で完了）
- ✅ 問題箇所を特定しやすい
- ✅ 「毎回同じところ」にならないよう、様々なケースを網羅できる

### 2. 統合テスト（Integration Test）

**目的：** 複数の機能を組み合わせた動作確認

**例え：** 車の部品を組み立てて、実際に走るか確認

**このプロジェクトの例：**
```typescript
// tests/integration/learning-ai-e2e.test.ts
// 「解答保存 → LocalStorage → スケジューラー」の連携を確認
it('updateWordProgress → localStorage → QuestionScheduler の完全フロー', () => {
  // 1. 解答を保存
  updateWordProgress('apple', false, 'memorization');
  
  // 2. LocalStorageから読み込めるか
  const progress = loadProgressSync();
  expect(progress.wordProgress['apple'].category).toBe('incorrect');
  
  // 3. スケジューラーが正しく優先度を付けるか
  const scheduled = scheduler.schedule(questions);
  expect(scheduled[0].word).toBe('apple'); // incorrectが最優先
});
```

**メリット：**
- ✅ 実際の使用シーンに近い
- ✅ 複数モジュール間の連携バグを発見できる

### 3. E2Eテスト（End-to-End Test）

**目的：** ユーザーの操作フロー全体を確認

**例え：** 実際に車を運転して、すべてが正常に動くか確認

**このプロジェクトの例：**
```typescript
// tests/e2e/ （Playwrightを使用）
// 「ページを開く → 問題を解答 → 正解表示を確認」
test('暗記モードで解答できる', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="memorization-tab"]');
  await page.click('[data-testid="answer-correct"]');
  await page.waitForSelector('.feedback-correct');
});
```

**メリット：**
- ✅ ユーザー体験そのものを確認
- ✅ リリース前の最終チェック

---

## このプロジェクトのテスト構成

### ディレクトリ構造

```
tests/
├── unit/              # ユニットテスト
│   ├── useQuestionRequeue.test.ts  # 再出題ロジック
│   ├── progressStorage.test.ts     # 進捗保存
│   ├── questionScheduler.test.ts   # 出題スケジューリング
│   └── ...
├── integration/       # 統合テスト
│   ├── learning-ai-e2e.test.ts    # AI学習フロー全体
│   └── ...
└── content/          # データ検証テスト
    └── ...
```

### テストツール

#### **Vitest**
- JavaScriptのテストフレームワーク
- 高速で、Viteとの統合が良い
- `it()` / `expect()` で直感的にテストが書ける

#### **Testing Library (React)**
- Reactコンポーネントのテスト用
- ユーザーの視点でテストできる（「このボタンが見えるか」など）

### テスト実行コマンド

```bash
# すべてのユニットテストを実行
npm run test:unit

# 高速版（APIテストをスキップ）
npm run test:unit:fast

# 特定のファイルだけ実行
npx vitest run tests/unit/useQuestionRequeue.test.ts

# カバレッジ（テストされている範囲）を確認
npm run test:unit:coverage
```

---

## 実際のテスト例と解説

### 例1: 再出題機能のテスト

**背景：**
「分からない」「まだまだ」の単語を数問後に再出題する機能がある。  
ところが「再出題が溜まるのに出てこない」という不具合が報告された。

**問題点：**
- 既存のテストは「正常系」のみで、エッジケースをカバーしていなかった
- 「同じ単語が2回連続で再出題されるか？」などの異常系が未検証

**解決策：**
3つのシナリオテストを追加（`tests/unit/useQuestionRequeue.test.ts`）

#### **テスト1: 重複スキップ**

```typescript
it('近い将来に同一IDが存在する場合、挿入せず skip ログを残す', () => {
  // 準備: 単語 'apple' の学習進捗を設定
  setProgressForWord('apple', {
    memorizationPosition: 80, // Position 80 = 分からない
    memorizationAttempts: 5,
    consecutiveIncorrect: 2,
  });

  // 実行: 質問キューを作成（'apple' が既に5番目に存在）
  const questions = [
    { word: 'q0' },
    { word: 'apple' }, // ← ここに既にいる
    { word: 'q2' },
  ];
  
  const result = reAddQuestion({ word: 'apple' }, questions, 0, 'memorization');

  // 検証: 重複があるので挿入しない（元のまま）
  expect(result).toBe(questions);
  
  // ログを確認
  const logs = JSON.parse(localStorage.getItem('debug_requeue_events'));
  expect(logs[0].decision).toBe('skipped_exists_nearby');
  expect(logs[0].ssotPosition).toBe(80); // SSOT（LocalStorage）から正しく読んでいる
});
```

**このテストの狙い：**
- ✅ 重複チェックが正しく動くか確認
- ✅ LocalStorageの値を優先しているか確認（`ssotPosition: 80`）
- ✅ デバッグログに理由が残るか確認

#### **テスト2: Position-aware挿入**

```typescript
it('重複がなければ挿入し、position-aware で高Position群の近くに寄せる', () => {
  // 高Position語（position: 60）が6番目にいる状況を作る
  const questions = [
    { word: 'q0', position: 0 },
    { word: 'q1', position: 0 },
    // ...
    { word: 'high', position: 60 }, // 5番目
    { word: 'q6', position: 0 },
  ];
  
  const result = reAddQuestion({ word: 'apple', position: 80 }, questions, 0);

  // 検証: 高Position群の近く（6番目）に挿入される
  expect(result[6].word).toBe('apple');
  
  const logs = JSON.parse(localStorage.getItem('debug_requeue_events'));
  expect(logs[0].decision).toBe('inserted');
  expect(logs[0].positionAwareAdjusted).toBe(true); // Position調整が効いた
});
```

**このテストの狙い：**
- ✅ 高Position語が固まっている場所に寄せられるか
- ✅ 単純に「3問後」ではなく、賢く配置できているか

#### **テスト3: 永久抑制されない**

```typescript
it('一度 skip されても、進行後には insert される', () => {
  const questions = [
    { word: 'q0' },
    { word: 'q1' },
    { word: 'apple' }, // 5番目にいる
    { word: 'q6' },
  ];
  
  // 1回目: currentIndex=0 → appleがupcoming内にいるのでskip
  const first = reAddQuestion({ word: 'apple' }, questions, 0);
  expect(first).toBe(questions); // 挿入されない
  
  // 2回目: currentIndex=5 → apple自体を回答した後 → upcoming内にいないのでinsert
  const second = reAddQuestion(questions[5], questions, 5);
  expect(second).toHaveLength(questions.length + 1); // 挿入された！
  
  const logs = JSON.parse(localStorage.getItem('debug_requeue_events'));
  expect(logs[0].decision).toBe('skipped_exists_nearby');
  expect(logs[1].decision).toBe('inserted'); // 進行後は挿入される
});
```

**このテストの狙い：**
- ✅ 「一度skipされたら永久に出ない」という不具合がないか確認
- ✅ 進行すれば正しく挿入されるか確認

### なぜこの3つか？

**問題の本質：**
「溜まるのに再出題されない」
↓
**可能性のある原因：**
1. 重複チェックが厳しすぎて、常にskipされる？
2. Position-aware調整が効かず、新規語に埋もれる？
3. 一度skipされたら二度と挿入されない？

**解決策：**
→ これら3つのケースを個別にテストして、どこに問題があるか切り分けられるようにした

---

## テストの運用方法

### 開発フロー

```
1. コードを書く
   ↓
2. テストを実行
   npm run test:unit:fast
   ↓
3. テストが通らない？
   → コードを修正
   → 2に戻る
   ↓
4. すべて通った！
   → git commit
```

### CI/CD（自動テスト）

GitHub Actionsで、プルリクエスト時に自動でテストを実行：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm run test:unit:fast
```

**メリット：**
- 人間が忘れても、機械が必ずチェックしてくれる
- チームメンバー全員の変更が安全に確認される

### テストカバレッジ

「コードのどれくらいがテストされているか」を示す指標：

```bash
npm run test:unit:coverage
```

```
File                   | % Stmts | % Branch | % Funcs | % Lines
-----------------------|---------|----------|---------|--------
useQuestionRequeue.ts  |   92.5  |   85.3   |  100.0  |  94.1
progressStorage.ts     |   78.2  |   71.4   |   88.9  |  79.5
```

**目標値（このプロジェクト）：**
- 70%以上（vitest.config.tsで設定）
- 重要な機能（スケジューラー、再出題）は90%以上を目指す

---

## テストを書く際のベストプラクティス

### 1. **「毎回同じところ」にならないように**

❌ **悪い例：**
```typescript
// いつも「正常系」だけ
it('問題を追加できる', () => {
  const result = addQuestion(validQuestion);
  expect(result).toBeTruthy();
});
```

✅ **良い例：**
```typescript
// 様々なケースをカバー
it('正常な問題を追加できる', () => { /* ... */ });
it('重複する問題は追加しない', () => { /* ... */ });
it('無効な問題はエラーになる', () => { /* ... */ });
it('上限に達したら追加しない', () => { /* ... */ });
```

### 2. **1テスト = 1つの確認事項**

❌ **悪い例：**
```typescript
it('すべてが動く', () => {
  const result1 = func1();
  expect(result1).toBe(true);
  
  const result2 = func2();
  expect(result2).toBe(true);
  
  const result3 = func3();
  expect(result3).toBe(true);
});
// → どこで失敗したか分かりにくい
```

✅ **良い例：**
```typescript
it('func1が正しく動く', () => {
  expect(func1()).toBe(true);
});

it('func2が正しく動く', () => {
  expect(func2()).toBe(true);
});
```

### 3. **テスト名は日本語でOK（分かりやすさ優先）**

```typescript
// ✅ 何をテストしているか一目瞭然
it('まだまだ語が新規語より優先される', () => { /* ... */ });

// ❌ コードを読まないと分からない
it('should prioritize still learning questions', () => { /* ... */ });
```

### 4. **AAA（Arrange-Act-Assert）パターン**

```typescript
it('重複スキップが動く', () => {
  // Arrange: 準備
  const questions = [{ word: 'apple' }, { word: 'banana' }];
  setProgressForWord('apple', { position: 80 });
  
  // Act: 実行
  const result = reAddQuestion({ word: 'apple' }, questions, 0);
  
  // Assert: 検証
  expect(result).toBe(questions);
  expect(logs[0].decision).toBe('skipped_exists_nearby');
});
```

### 5. **モックの活用**

外部依存（API、ランダム値など）を固定する：

```typescript
// Math.randomを固定（毎回同じ値を返す）
beforeEach(() => {
  mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  mathRandomSpy.mockRestore();
});
```

**なぜ必要？**
- ランダムなテストは「たまに失敗する」ので信頼できない
- 固定することで「常に同じ結果」になり、安定する

---

## まとめ

### テストの価値

| 項目 | 価値 |
|------|------|
| **安心感** | 「壊してないか？」の不安が消える |
| **速度** | バグ修正の時間が短縮される |
| **品質** | ユーザーに届く前にバグを発見 |
| **ドキュメント** | コードの使い方が分かる |
| **チーム** | 他の人の変更も安全に |

### このプロジェクトで守っていること

1. ✅ **新機能には必ずテストを書く**
   - 特に「不具合修正」は、再発防止のためテスト必須

2. ✅ **「毎回同じところ」にならない**
   - 正常系だけでなく、異常系・エッジケースもカバー

3. ✅ **テストは速く保つ**
   - ユニットテストは数秒で完了するように
   - 遅いと誰も実行しなくなる

4. ✅ **カバレッジ70%以上**
   - 機械的な指標だが、最低限の品質保証

### さらに学ぶには

**公式ドキュメント：**
- [Vitest](https://vitest.dev/) - このプロジェクトで使用中
- [Testing Library](https://testing-library.com/) - Reactテスト

**書籍：**
- 『テスト駆動開発』Kent Beck
- 『レガシーコード改善ガイド』Michael Feathers

**このプロジェクトの実例：**
- `tests/unit/useQuestionRequeue.test.ts` - 再出題ロジック
- `tests/integration/learning-ai-e2e.test.ts` - AI学習フロー
- `tests/unit/questionScheduler.test.ts` - スケジューラー

---

## 関連ドキュメント

- [AI統合テストガイド](../testing/ADAPTIVE_AI_INTEGRATION_GUIDE.md)
- [品質保証システム](../reports/QUALITY_ASSURANCE_SYSTEM_REPORT.md)
- [開発ガイドライン](./../guidelines/README.md)
