# 適応型学習AI統合テストガイド

**作成日**: 2025年12月17日  
**対象**: Phase 0-3 全モード統合完了後の動作確認

---

## 🎯 テスト目的

各モード（暗記・スペル・文法・和訳）で適応型学習AIが正しく機能し、生徒の解答情報が出題にフィードバックされることを確認する。

---

## 📋 テスト前の準備

### 1. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:5173/ を開く

### 2. ブラウザのコンソールを開く

- Chrome: `Cmd + Option + J` (Mac) / `Ctrl + Shift + J` (Windows)
- デバッグログが表示されます

### 3. LocalStorageをクリア（推奨）

```javascript
// ブラウザのコンソールで実行
localStorage.clear();
location.reload();
```

これにより、適応型AIが初期状態から学習を開始します。

---

## 🧪 テストシナリオ

### Phase 0: 暗記モード ✅

#### テスト手順

1. **「暗記」タブを開く**
2. **問題を3問解答する**（覚えてる/まだまだ/分からない）
3. **コンソールログを確認**:
   ```
   [useAdaptiveLearning] Selected question: { word: "...", ... }
   ```
   このログが表示されれば、適応型AIが問題を選択している証拠

#### 期待される動作

- ✅ 初回問題選択時に適応型AIのログが表示される
- ✅ 次の問題選択時に適応型AIのログが表示される
- ✅ 不正解（分からない）の問題が近い位置に再出題される
- ✅ 正解（覚えてる）の問題は間隔を空けて出題される

#### 確認ポイント

```javascript
// コンソールで確認
adaptiveLearning = window.localStorage.getItem('adaptive-learning-MEMORIZATION');
console.log(JSON.parse(adaptiveLearning));
// sessionQuestionCount, currentPhase, personalParams などが記録されている
```

---

### Phase 1: スペルモード ✅

#### テスト手順

1. **「スペル」タブを開く**
2. **問題を開始**
3. **3問を正解・不正解で交互に解答**:
   - 1問目: 正解
   - 2問目: 不正解
   - 3問目: 正解
4. **コンソールログを確認**

#### 期待される動作

- ✅ `handleNext`が呼ばれるたびに適応型AIのログが表示される
- ✅ 不正解の問題が優先的に選ばれる
- ✅ 問題の選択順序が単純なインデックス増加ではない

#### 確認方法

```javascript
// コンソールで実行
const spellingAI = JSON.parse(localStorage.getItem('adaptive-learning-SPELLING'));
console.log('Spelling AI State:', spellingAI);
console.log('Question Count:', spellingAI?.sessionQuestionCount);
console.log('Current Phase:', spellingAI?.currentPhase);
```

---

### Phase 2: 文法モード ✅

#### テスト手順

1. **「文法」タブを開く**
2. **学年・単元を選択**（例: 中1 Unit0）
3. **クイズを開始**
4. **4問を解答**:
   - 2問正解
   - 2問不正解
5. **次の問題ボタンをクリック**
6. **コンソールログを確認**

#### 期待される動作

- ✅ `handleNext`実行時に適応型AIが次の問題を選択
- ✅ 不正解の問題が優先的に選ばれる
- ✅ 単元フィルタリングと適応型AIの選択が両立

#### 確認方法

```javascript
// コンソールで実行
const grammarAI = JSON.parse(localStorage.getItem('adaptive-learning-GRAMMAR'));
console.log('Grammar AI State:', grammarAI);
console.log('Total Questions:', grammarAI?.sessionQuestionCount);
```

---

### Phase 3: 和訳モード ✅

#### テスト手順

1. **「和訳」タブを開く**
2. **問題セットを選択**（例: Junior High 1年）
3. **クイズを開始**
4. **5問を解答**:
   - 2問正解
   - 3問不正解
5. **次へボタンをクリック**
6. **コンソールログを確認**

#### 期待される動作

- ✅ `handleNext`実行時に適応型AIが次の問題を選択
- ✅ 不正解の問題が優先的に選ばれる
- ✅ 復習モードと適応型AIが連携

#### 確認方法

```javascript
// コンソールで実行
const translationAI = JSON.parse(localStorage.getItem('adaptive-learning-TRANSLATION'));
console.log('Translation AI State:', translationAI);
console.log('Session Progress:', translationAI?.sessionProgress);
```

---

## 🔍 統合確認テスト

### テスト1: 個人パラメータの更新（20問後）

全モード共通で、20問解答後に個人パラメータが更新されることを確認。

```javascript
// 20問解答前
const before = JSON.parse(localStorage.getItem('adaptive-learning-MEMORIZATION'));
console.log('Before 20 questions:', before?.personalParams);

// 20問解答後
const after = JSON.parse(localStorage.getItem('adaptive-learning-MEMORIZATION'));
console.log('After 20 questions:', after?.personalParams);
// learningSpeed, memoryRetention が更新されている
```

#### 期待される動作

- ✅ `sessionQuestionCount` が20に達したときに個人パラメータが更新される
- ✅ コンソールに `[useAdaptiveLearning] Personal parameters estimated:` が表示される

---

### テスト2: 学習フェーズの遷移

適応型AIが学習フェーズを自動判定することを確認。

```javascript
const ai = JSON.parse(localStorage.getItem('adaptive-learning-MEMORIZATION'));
console.log('Current Phase:', ai?.currentPhase);
// 'ACQUISITION' → 'CONSOLIDATION' → 'MASTERY' と遷移
```

#### 期待される動作

- ✅ 初期状態は `ACQUISITION`（獲得期）
- ✅ 正解率が向上すると `CONSOLIDATION`（定着期）へ
- ✅ さらに正解率が高まると `MASTERY`（習熟期）へ

---

### テスト3: ScoreBoardの統計表示

モード別の出題回数が正しく表示されることを確認。

#### テスト手順

1. **各モードで5問ずつ解答**
2. **「学習状況」タブを開く**
3. **「学習状況」→「詳細な定着率の内訳」を確認**

#### 期待される表示

```
出題数：1回 5問 2回 0問 3回 0問 4回 0問 5回 0問 6回以上 0問
```

#### 確認ポイント

- ✅ 各モードの出題回数が個別にカウントされている
- ✅ 他のモードで同じ単語を解答しても、カウントが重複しない

---

## 🐛 トラブルシューティング

### 問題: コンソールに適応型AIのログが表示されない

**原因**: ログレベルが`info`以下に設定されていない

**解決策**:
```javascript
// src/utils/logger.ts の設定を確認
// または開発環境でのみログを有効化
```

---

### 問題: 適応型AIが選択した問題がフォールバックされる

**症状**: 常に次のインデックスの問題が選ばれる

**原因**: `selectNextQuestion`が`null`を返している

**確認方法**:
```javascript
// コンソールで実行
adaptiveLearning.selectNextQuestion(questions);
// null が返る場合は、questions が空か、不正な形式
```

**解決策**:
- 問題リストが正しく渡されているか確認
- `questions`が`Question[]`型であることを確認

---

### 問題: 統計が正しくカウントされない

**原因**: `memorizationAttempts`等が正しく増えていない

**確認方法**:
```javascript
const progress = JSON.parse(localStorage.getItem('english-progress'));
console.log(progress.wordProgress['apple']);
// memorizationAttempts, spellingAttempts 等を確認
```

**解決策**:
- `updateWordProgress`が正しく呼ばれているか確認
- モードパラメータが正しく渡されているか確認

---

## ✅ テスト完了チェックリスト

### 全モード共通

- [ ] ビルドが成功する（`npm run build`）
- [ ] 型チェックが通る（`npm run typecheck`）
- [ ] 開発サーバーが起動する（`npm run dev`）

### 暗記モード

- [ ] 適応型AIが問題を選択している
- [ ] 不正解の問題が再出題される
- [ ] LocalStorageにAI状態が保存される

### スペルモード

- [ ] 適応型AIが問題を選択している
- [ ] `handleNext`で適応型AIが呼ばれる
- [ ] 不正解の問題が優先される

### 文法モード

- [ ] 適応型AIが問題を選択している
- [ ] 単元フィルタと適応型AIが連携する
- [ ] 不正解の問題が優先される

### 和訳モード

- [ ] 適応型AIが問題を選択している
- [ ] 復習モードと適応型AIが連携する
- [ ] 不正解の問題が優先される

### 統合機能

- [ ] 20問後に個人パラメータが更新される
- [ ] 学習フェーズが正しく遷移する
- [ ] ScoreBoardの統計がモード別に表示される

---

## 📊 テスト結果の記録

### テスト実施日: ___________

| モード | 適応型AI動作 | 問題選択 | 統計表示 | 備考 |
|--------|------------|---------|---------|------|
| 暗記   | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 |      |
| スペル | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 |      |
| 文法   | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 |      |
| 和訳   | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 | ☐ 成功 ☐ 失敗 |      |

### 発見された問題

1. （記入してください）
2. （記入してください）
3. （記入してください）

### 総合評価

- [ ] 全モードで適応型AIが正常に動作
- [ ] 部分的に動作（詳細を記載）
- [ ] 追加修正が必要

---

**テスト担当者**: ___________  
**承認者**: ___________  
**次のアクション**: ___________
