---
description: 【最優先】バッチ方式の絶対原則 - 修正には必ずユーザー同意が必要
applyTo: '**/ai/**/*.{ts,tsx},**/components/MemorizationView.tsx'
---

# 🚨 バッチ方式の絶対原則【最優先厳守】

## ⛔ 絶対不変の原則（ユーザー明示指示なしに変更禁止）

### 原則1: バッチ確定後は配列を一切変更しない

```typescript
// 【絶対原則】scheduleCategorySlots()が返したバッチは読み取り専用
const scheduledQuestions = await scheduler.schedule(...);
setQuestions(scheduledQuestions); // この後、配列を変更してはならない

// ❌ 禁止: バッチ途中での配列変更
if (!useCategorySlots) {
  const clearedQuestions = clearExpiredFlags(questions, currentIndex);
  setQuestions(clearedQuestions); // 配列を再生成
}

// ✅ 正解: useCategorySlots=true時は配列変更を無効化
if (!useCategorySlots) {
  // 従来方式でのみ有効
  const clearedQuestions = clearExpiredFlags(questions, currentIndex);
  setQuestions(clearedQuestions);
}
```

### 原則2: バッチ完全消化まで再計算なし

```typescript
// 【絶対原則】バッチ内の全語句が出題されるまで再スケジューリングしない

// ❌ 禁止: バッチ途中での再スケジューリング
useEffect(() => {
  if (needsRescheduling) {
    // 不正解5連打、学習状態変化、50回解答、Position不整合等
    const newBatch = await scheduler.schedule(...);
    setQuestions(newBatch);
  }
}, [needsRescheduling]);

// ✅ 正解: useCategorySlots=true時は再スケジューリングを保留
useEffect(() => {
  if (useCategorySlots) {
    if (needsRescheduling && import.meta.env.DEV) {
      console.log('⏸️ [バッチ方式] バッチ途中の再スケジューリング要求を保留');
    }
    return;
  }
  // 従来方式でのみ再スケジューリング
  if (needsRescheduling) {
    // ...
  }
}, [needsRescheduling, useCategorySlots]);
```

### 原則3: バッチ完全消化後に次バッチを生成

```typescript
// 【絶対原則】最後の語句を解答したら、次のバッチを自動生成

// nextIndex >= questions.length の時
if (nextIndex >= questionsForNextIndex.length) {
  // 🎯 バッチ完全消化
  if (useCategorySlots) {
    console.log('🔄 [バッチ方式] バッチ完全消化 → 次のバッチを生成します');
    
    // 状態をクリア
    setQuestions([]);
    setCurrentQuestion(null);
    setCurrentIndex(0);
    
    // 次バッチ生成をトリガー
    setNeedsBatchRegeneration(true); // 専用フラグで再生成
    return;
  }
  
  // 従来方式: セッション終了
  // ...
}
```

---

## 🔒 変更前の必須確認チェックリスト

コードを修正する前に、以下を**必ず**確認してください：

### Step 1: 仕様書の確認

```markdown
□ category-slots-enforcement.instructions.md を読んだ
□ position-hierarchy-enforcement.instructions.md を読んだ
□ batch-system-enforcement.instructions.md を読んだ（本ファイル）
□ specification-enforcement.instructions.md を読んだ
```

### Step 2: ユーザー意図の確認

```markdown
□ ユーザーは「バッチ方式の変更」を明示的に指示したか？
□ ユーザーは「振動が発生している」等の問題を報告したか？
□ ユーザーは「この原則は変更しても良い」と明示したか？
```

### Step 3: 影響範囲の確認

```markdown
□ 修正は Position階層 に影響するか？
□ 修正は カテゴリースロット方式 に影響するか？
□ 修正は バッチ方式の原則 に影響するか？
□ 修正は 振動防止 に影響するか？
```

### Step 4: ユーザーへの提案

```markdown
□ 影響がある場合、修正案をユーザーに提示した
□ ユーザーから明示的な承認を得た
□ 承認内容をログに記録した
```

---

## 🚫 変更禁止の具体例

### ケース1: clearExpiredFlags の実行

```typescript
// ❌ 禁止（バッチ方式では配列を変更してはならない）
const clearedQuestions = clearExpiredFlags(questions, currentIndex);
if (clearedQuestions !== questions) {
  setQuestions(clearedQuestions);
}

// ✅ 正解
if (!useCategorySlots) {
  const clearedQuestions = clearExpiredFlags(questions, currentIndex);
  if (clearedQuestions !== questions) {
    setQuestions(clearedQuestions);
  }
}
```

### ケース2: 再スケジューリングトリガー

```typescript
// ❌ 禁止（バッチ方式では再計算してはならない）
useEffect(() => {
  if (incorrectStreak >= 5) {
    setNeedsRescheduling(true);
  }
}, [incorrectStreak]);

// ✅ 正解
useEffect(() => {
  if (useCategorySlots) {
    // バッチ方式では保留
    return;
  }
  if (incorrectStreak >= 5) {
    setNeedsRescheduling(true);
  }
}, [incorrectStreak, useCategorySlots]);
```

### ケース3: バッチ途中での差し込み

```typescript
// ❌ 禁止（バッチ方式では差し込みしてはならない）
if (isIncorrect && !useCategorySlots) {
  _reAddQuestion(currentQuestion, questions, currentIndex + 3);
}

// ✅ 正解（既に実装済み）
if (isIncorrect && !useCategorySlots) {
  _reAddQuestion(currentQuestion, questions, currentIndex + 3);
} else if (useCategorySlots) {
  console.log('⏭️ [再出題スキップ] useCategorySlots=true のため再出題無効');
}
```

---

## ✅ 実装済みの保護機構

### 1. setQuestions 安全ラッパー

```typescript
// 連続重複を検出してthrow
const setQuestions = useCallback((value) => {
  const newQuestions = typeof value === 'function' ? value(questions) : value;
  
  if (import.meta.env.DEV && useCategorySlots && newQuestions.length > 1) {
    for (let i = 0; i < newQuestions.length - 1; i++) {
      if (newQuestions[i].word === newQuestions[i + 1].word) {
        throw new Error(`setQuestions連続重複検出: "${newQuestions[i].word}"`);
      }
    }
  }
  
  setQuestionsRaw(newQuestions);
}, [questions, useCategorySlots]);
```

### 2. バッチ受信時検証

```typescript
// スケジューラーから受け取ったバッチの連続重複チェック
if (import.meta.env.DEV && useCategorySlots) {
  for (let i = 0; i < sortedQuestions.length - 1; i++) {
    if (sortedQuestions[i].word === sortedQuestions[i + 1].word) {
      throw new Error(`スケジューラーから連続重複バッチを受信`);
    }
  }
}
```

### 3. scheduleCategorySlots 内検証

```typescript
// バッチ生成時の強制検証
for (let i = 0; i < result.length - 1; i++) {
  if (result[i].word === result[i + 1].word) {
    throw new Error(`バッチ内で連続重複を検出: "${result[i].word}"`);
  }
}
```

### 4. バッチ再生成フラグ

```typescript
// バッチ完全消化時に次バッチを安全に生成
const [needsBatchRegeneration, setNeedsBatchRegeneration] = useState(false);

// 完全消化時
if (useCategorySlots && nextIndex >= questions.length) {
  setQuestions([]);
  setCurrentQuestion(null);
  setCurrentIndex(0);
  setNeedsBatchRegeneration(true); // 専用フラグ
  return;
}

// useEffect で再生成
useEffect(() => {
  if (isLoading && !needsBatchRegeneration) return;
  
  const selectQuestions = async () => {
    if (needsBatchRegeneration) {
      setNeedsBatchRegeneration(false);
      console.log('🔄 [バッチ再生成] フラグをリセットしました');
    }
    // 新しいバッチを生成
  };
}, [needsBatchRegeneration, ...]);
```

---

## 🔧 修正時のフロー

### 1. 問題発見

```
ユーザー報告: 「振動が続いています」「inserted=18回も発生」
```

### 2. 原因調査

```markdown
1. デバッグパネルで現象を確認
2. コンソールログで動作を追跡
3. 該当コードを読み取り
4. 仕様書で設計意図を確認
```

### 3. 提案作成

```markdown
# 修正案

## 問題
- バッチ途中で clearExpiredFlags が配列を再生成している

## 原因
- useCategorySlots=true の時も clearExpiredFlags が実行される

## 修正案
- useCategorySlots=true の時は clearExpiredFlags をスキップ

## 影響範囲
- バッチ方式: ✅ 原則を強化（配列変更を防止）
- Position階層: 影響なし
- 振動防止: ✅ 改善

## ユーザー承認
- [ ] ユーザーに提案を説明
- [ ] ユーザーから承認を得た
```

### 4. 実装

```typescript
// ユーザー承認後に実装
if (!useCategorySlots) {
  const clearedQuestions = clearExpiredFlags(questionsForNextIndex, currentIndex);
  if (clearedQuestions !== questionsForNextIndex) {
    setQuestions(clearedQuestions);
  }
}
```

### 5. テスト

```markdown
1. ユニットテスト実行
2. 実機テスト
3. コンソールログで動作確認
4. ユーザーに報告
```

---

## 📋 定期監査チェックリスト

### 毎週の確認

```markdown
□ useCategorySlots=true が維持されている
□ バッチ途中での配列変更が発生していない
□ バッチ途中での再スケジューリングが発生していない
□ バッチ完全消化後に次バッチが生成される
□ 連続重複検出が機能している
```

### リリース前の確認

```markdown
□ すべての保護機構が有効
□ すべてのアサーションがパス
□ 振動スコアが基準値以下
□ ユニットテストがパス
□ 実機テストで問題なし
```

---

## 🚨 緊急時の対応

### 振動が発生した場合

1. **即座に調査開始**
   ```
   □ コンソールログを確認
   □ inserted/skipped 統計を確認
   □ 連続重複検出ログを確認
   ```

2. **原因を特定**
   ```
   □ どのコードパスで発生したか
   □ どの条件分岐が間違っているか
   □ どの保護機構が無効化されているか
   ```

3. **ユーザーに報告**
   ```
   □ 現象を説明
   □ 原因を説明
   □ 修正案を提示
   ```

4. **ユーザー承認後に修正**
   ```
   □ 最小限の修正
   □ 既存の原則を守る
   □ テストで確認
   ```

---

## 📝 変更履歴の記録

修正を行った場合は、必ず記録を残してください：

```markdown
# 変更履歴

## 2025-12-30: バッチ再生成フラグの追加

### 問題
バッチ完全消化後、次バッチが生成されない

### 原因
useEffect の依存配列に questions が含まれていない

### 修正内容
needsBatchRegeneration フラグを追加し、バッチ完全消化時にフラグを設定

### ユーザー承認
ユーザーからの要求: 「バッチ完全消化後に次バッチを生成してほしい」

### テスト結果
- ユニットテスト: パス
- 実機テスト: 正常動作確認
- 振動スコア: 基準値以下
```

---

## 🎯 まとめ

### 絶対守るべき3原則

1. **バッチ確定後は配列を一切変更しない**
2. **バッチ完全消化まで再計算なし**
3. **バッチ完全消化後に次バッチを生成**

### 修正時の必須フロー

1. **仕様書確認** → 2. **ユーザー意図確認** → 3. **影響範囲確認** → 4. **ユーザー承認** → 5. **実装** → 6. **テスト**

### 緊急連絡先

問題が発生した場合は、必ずユーザーに報告してください。
