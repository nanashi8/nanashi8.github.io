---
description: 【強制】学習AI関連の修正では対症療法を禁止
applyTo: 'src/ai/**/*.{ts,tsx}, src/storage/progress/progressStorage.ts'
---

# 学習AI修正の強制ガードシステム

## 🚨 絶対ルール（違反厳禁）

### 1. AI担当関数の責任範囲を尊重

**❌ 禁止行為：**
- progressStorage.ts や UI コンポーネント内でハードコードされたカテゴリー判定
- if-else の連鎖による対症療法的な条件分岐
- 「まだまだ」「分からない」のカウントロジックを複数箇所に散在させる

**✅ 必須行動：**
- `determineWordCategory` 関数（AI担当）に完全委譲
- 判定ロジックは `src/ai/utils/categoryDetermination.ts` の1箇所のみ
- 修正前に必ず AI担当関数の仕様を確認

### 2. 修正前の必須確認事項

```typescript
// ✅ チェックリスト
// [ ] AI担当関数 determineWordCategory の現在の判定ロジックを確認した
// [ ] WordProgress のプロパティ定義を確認した
// [ ] 「まだまだ」「分からない」のカウント更新箇所を確認した
// [ ] 既存の正答率計算ロジックを確認した
// [ ] 連続正解/不正解の更新箇所を確認した
```

### 3. プロパティの正しい使用

**WordProgress の重要プロパティ：**
- `memorizationAttempts`: 総出題回数
- `memorizationCorrect`: 「覚えてる」の回数
- `memorizationStillLearning`: 「まだまだ」の回数
- `memorizationIncorrect`: 「分からない」の回数（存在確認必要）
- `consecutiveCorrect`: 連続正解数
- `consecutiveIncorrect`: 連続不正解数（存在確認必要）
- `correctCount`: 総正解数（別システムでの互換性用）
- `incorrectCount`: 総不正解数（別システムでの互換性用）

**⚠️ 注意：**
- `incorrectCount` は累計不正解数であり、連続不正解数ではない
- 連続正解/不正解を判定する場合は `consecutiveCorrect` / `consecutiveIncorrect` を使用

### 4. バグ修正のプロセス

**ステップ1: 根本原因の特定**
```bash
# 1. AI担当関数の仕様を確認
cat src/ai/utils/categoryDetermination.ts

# 2. プロパティの更新箇所を特定
grep -r "memorizationCorrect" src/
grep -r "consecutiveCorrect" src/

# 3. カウント表示の実装を確認
grep -r "まだまだ" src/
grep -r "分からない" src/
```

**ステップ2: AI担当関数を修正（対症療法禁止）**
- ロジックの矛盾を修正
- プロパティの使用を修正
- テストケースを想定

**ステップ3: 呼び出し側の確認**
- progressStorage.ts が AI担当関数を正しく呼び出しているか
- UI が正しいプロパティを表示しているか

### 5. 禁止パターン例

```typescript
// ❌ 対症療法的な修正（禁止）
if (まだまだが増えすぎる) {
  // 強制的に減らす
  wordProgress.memorizationStillLearning--;
}

// ❌ ハードコードされた判定（禁止）
if (totalCorrect >= 2) {
  wordProgress.category = 'mastered';
}

// ✅ 正しい修正方法
// AI担当関数 determineWordCategory 内で判定ロジックを修正
export function determineWordCategory(progress: WordProgress): WordCategory {
  // ここで正しいロジックを実装
}
```

### 6. 修正後の検証

**必須テスト項目：**
1. 「覚えてる」を押した → `memorizationCorrect` が増える
2. 「まだまだ」を押した → `memorizationStillLearning` が増える
3. 「分からない」を押した → 不正解カウントが増える
4. 連続正解時の挙動確認
5. 学習状況タブの表示が正しいか

## 🔒 コードレビューチェックポイント

- [ ] AI担当関数以外でカテゴリー判定をしていないか
- [ ] プロパティを正しく使用しているか（累計 vs 連続の区別）
- [ ] 「まだまだ」を0.5回として計算しているか
- [ ] UI表示と内部ロジックが一致しているか
- [ ] デバッグログで動作確認できるか

## 📝 ドキュメント更新義務

AI関連のロジック修正時は、必ず以下を更新：
- 関数のJSDocコメント
- このガードファイルの例
- 関連する設計ドキュメント
