# 暗記タブ学習効率問題の修正

## 🔴 問題の概要

**症状**: 暗記タブで総出題数が2000回を超えても、「分からない」「まだまだ」が200個以上残る

**原因**: カテゴリー判定ロジックの3つの不具合

## 🐛 不具合の詳細

### 1. 「まだまだ」選択時のカテゴリー強制上書き

**問題箇所**: `src/storage/progress/progressStorage.ts:1150`

```typescript
// ❌ 問題のあったコード
else if (isStillLearning) {
  // 今回「まだまだ」を選択 → 「学習中」（明示的な学習継続の意思表示）
  wordProgress.category = 'still_learning';
}
```

**問題点**:
- 過去の履歴を無視して必ず`still_learning`に分類
- 「分からない」(incorrect) → 「まだまだ」(still_learning) → 履歴がリセット
- 結果: 苦手な単語が永遠に`incorrect`から脱出できない

### 2. 甘すぎる定着判定

**問題箇所**: `src/storage/progress/progressStorage.ts:1144`

```typescript
// ❌ 問題のあったコード
else if (isCorrect && wordProgress.correctCount >= 2) {
  // ✅ 今回正解 & 累積2回以上正解 → 定着（過去に不正解があっても可）
  wordProgress.category = 'mastered';
}
```

**問題点**:
- 累積正解2回だけで定着判定
- 例: 正解2回、不正解10回 → 正答率16%でも「覚えてる」扱い
- 結果: 実際には覚えていない単語が出題されなくなる

### 3. 連続不正解判定の無効化

**問題箇所**: `src/storage/progress/progressStorage.ts:973`

```typescript
// ❌ 問題のあったコード
else if (isStillLearning) {
  // 「まだまだ」は専用カウンターに記録
  wordProgress.memorizationStillLearning = (wordProgress.memorizationStillLearning || 0) + 1;
  // memorizationStreakはそのまま維持
}
```

**問題点**:
- 「分からない」→「まだまだ」→「分からない」で連続カウントが途切れる
- `consecutiveIncorrect`がリセットされて連続不正解判定が機能しない
- 結果: 苦手な単語が優先的に出題されない

## ✅ 修正内容

### 正答率ベースのカテゴリー判定に変更

```typescript
// ✅ 修正後のコード
const accuracy = totalAttempts > 0 ? wordProgress.correctCount / totalAttempts : 0;

if (masteryResult.isMastered) {
  // 定着判定システムが定着と判断 → 即座に定着扱い
  wordProgress.category = 'mastered';
} else if (accuracy >= 0.8 && wordProgress.consecutiveCorrect >= 3) {
  // 🟢 高精度安定型：正答率80%以上 & 連続3回正解
  wordProgress.category = 'mastered';
} else if (accuracy >= 0.7 && totalAttempts >= 5) {
  // 🟢 長期安定型：正答率70%以上 & 5回以上挑戦
  wordProgress.category = 'mastered';
} else if (accuracy < 0.3 || (!isStillLearning && wordProgress.consecutiveIncorrect >= 2)) {
  // 🔴 要復習：正答率30%未満 OR 連続2回不正解
  wordProgress.category = 'incorrect';
} else {
  // 🟡 学習中：それ以外
  wordProgress.category = 'still_learning';
}
```

### 修正の利点

1. **正答率を重視**: 累積正解回数だけでなく、不正解も考慮
2. **「まだまだ」の適切な扱い**: 履歴をリセットせず、正答率に基づいて判定
3. **厳格な定着条件**: 
   - 高精度安定型: 正答率80%以上 & 連続3回正解
   - 長期安定型: 正答率70%以上 & 5回以上挑戦
4. **苦手単語の優先復習**: 正答率30%未満は必ず`incorrect`扱い

## 📊 期待される効果

### Before（修正前）
- 累積正解2回で「覚えてる」判定 → 正答率16%でも出題されない
- 「まだまだ」選択で履歴リセット → 苦手単語が埋もれる
- 連続不正解が機能しない → 優先復習されない

### After（修正後）
- 正答率80%以上 & 連続3回正解で初めて「覚えてる」判定
- 「まだまだ」選択でも正答率ベースで適切に分類
- 正答率30%未満は必ず優先復習対象

### 具体例

**単語A**: 正解2回、不正解10回（正答率16%）
- 修正前: `mastered`（出題されない）❌
- 修正後: `incorrect`（優先復習）✅

**単語B**: 正解4回、不正解1回（正答率80%）、連続3回正解
- 修正前: `mastered`（条件未達）
- 修正後: `mastered`（高精度安定型）✅

**単語C**: 正解7回、不正解3回（正答率70%）、10回挑戦
- 修正前: `still_learning`（条件未達）
- 修正後: `mastered`（長期安定型）✅

## 🎯 影響範囲

### 修正ファイル

1. **progressStorage.ts** (L1136-1162)
   - カテゴリー判定ロジックを正答率ベースに変更

2. **MemoryAI.ts** (L52-82)
   - カテゴリー判定ロジックを統一（暗記タブ専用フィールドを使用）

3. **QuestionScheduler.ts** (L577-599)
   - カテゴリー推測ロジックを統一

### 後方互換性

- ✅ 既存データの自動修復機能あり（progressStorage.ts:L137-155）
- ✅ カテゴリー未設定の単語は初回出題時に適切に判定
- ✅ 学習履歴は保持（正答率計算に使用）

## 🧪 テスト推奨項目

1. **新規単語の学習フロー**
   - 初回正解 → `still_learning`（正答率100%だが試行1回）
   - 連続3回正解 → `mastered`（正答率100% & 連続3回）

2. **苦手単語の復習フロー**
   - 正答率30%未満 → `incorrect`（優先復習）
   - 正答率30%以上 → `still_learning`（通常復習）
   - 正答率80%以上 & 連続3回 → `mastered`（定着）

3. **「まだまだ」ボタンの動作**
   - 「まだまだ」連打 → 正答率ベースで適切に分類
   - 履歴リセットされない

4. **長期学習の単語**
   - 10回挑戦、正答率70%以上 → `mastered`
   - 5回挑戦、正答率70%以上 → `mastered`

## 📝 コミット情報

- **タイプ**: fix(ai)
- **影響**: 暗記タブの学習効率大幅改善
- **破壊的変更**: なし
