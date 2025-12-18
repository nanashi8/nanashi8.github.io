# カテゴリ遷移が遅い問題の分析

## 問題の症状

- ユーザーが「覚えてる」を連打しても、「要復習」「学習中」が「定着済み」に移行しない
- シミュレーターでは正常に動作するが、実際の暗記タブでは動作が遅い
- 5問ごとに再スケジューリングされるが、カテゴリ変化が反映されない

## 根本原因の分析

### 1. カテゴリ遷移ロジックの問題

**現在のロジック（progressStorage.ts Lines 1126-1185）:**

```typescript
if (masteryResult.isMastered) {
  wordProgress.category = 'mastered';
} else if (wordProgress.consecutiveIncorrect >= 2) {
  wordProgress.category = 'incorrect';
} else if (wordProgress.consecutiveCorrect >= 3) {
  // 3回以上連続正解 → 定着
  wordProgress.category = 'mastered';
} else if (isCorrect && wordProgress.consecutiveCorrect >= 2) {
  // ✅ 今回正解 & 2回連続正解 → 定着
  wordProgress.category = 'mastered';
}
```

**問題点:**

1. **連続正解のカウント方法**
   - `consecutiveCorrect` は同じ単語を連続で正解した回数
   - しかし、実際の出題では他の単語が間に入るため、連続正解が途切れる
   - 例: A正解 → B正解 → A再出題 の場合、Aの `consecutiveCorrect` はリセットされている

2. **`isMastered` 判定が厳しい**
   - `calculateMastery()` の条件が厳しすぎる可能性
   - 特に初回正解〜2回正解の段階で定着判定されない

3. **再スケジューリングの頻度制限**
   - 5問ごとにしか再スケジューリングされない
   - incorrect/still_learning が4問以下の場合、すぐに反映されない

### 2. シミュレーターとの違い

**シミュレーター:**
- 初期カテゴリを設定して、QuestionScheduler に渡すだけ
- カテゴリ遷移ロジックは使用していない
- 結果として、カテゴリは最初から正しく設定されている

**実際のタブ:**
- `updateWordProgress()` でカテゴリを動的に更新
- 連続正解の判定が厳しい
- 結果として、カテゴリ遷移が遅い

## 解決策

### 短期的な解決策（即時実装）

1. **連続正解の定義を変更**
   - 「同じ単語の連続正解」→「同じ単語の累積正解」
   - `consecutiveCorrect` ではなく、直近N回の正解率で判定

2. **再スケジューリング頻度を上げる**
   - 5問ごと → 3問ごと or 毎回
   - パフォーマンスへの影響は軽微（QuestionScheduler は高速）

3. **カテゴリ遷移条件を緩和**
   ```typescript
   // 改善案:
   if (masteryResult.isMastered) {
     wordProgress.category = 'mastered';
   } else if (isCorrect && wordProgress.correctCount >= 2 && wordProgress.incorrectCount === 0) {
     // 2回正解で不正解なし → 定着
     wordProgress.category = 'mastered';
   } else if (isCorrect && wordProgress.correctCount >= 3) {
     // 3回以上正解（不正解があっても） → 定着傾向
     wordProgress.category = 'mastered';
   }
   ```

### 中期的な解決策

1. **直近N回の正解率を記録**
   ```typescript
   interface WordProgress {
     // ...
     recentResults: boolean[]; // 直近10回の結果
   }
   
   // 直近の正解率で判定
   const recentCorrectRate = recentResults.filter(r => r).length / recentResults.length;
   if (recentCorrectRate >= 0.8) {
     wordProgress.category = 'mastered';
   }
   ```

2. **カテゴリ遷移の明示的なログ**
   - ユーザーに「定着しました！」のフィードバック
   - 遷移が起こったタイミングを可視化

### 長期的な解決策

1. **機械学習ベースの定着判定**
   - 単純な閾値ではなく、複数の要因を考慮
   - ユーザーの学習パターンを分析

2. **ユーザー設定で調整可能に**
   - 「厳しい」「標準」「緩い」の3段階
   - ユーザーの学習スタイルに合わせる

## 実装した修正（完了）

### 1. カテゴリ遷移ロジックの修正（progressStorage.ts）

**問題点:**
```typescript
// ❌ 間違い: 過去の consecutiveIncorrect が優先される
} else if (wordProgress.consecutiveIncorrect >= 2) {
  wordProgress.category = 'incorrect';  // 今回正解しても incorrect のまま！
}
```

**修正後:**
```typescript
// ✅ 正解: 今回の回答を最優先
if (isCorrect && wordProgress.correctCount >= 2) {
  // 今回正解 & 累積2回以上正解 → 定着
  wordProgress.category = 'mastered';
} else if (isCorrect && wordProgress.correctCount >= 1) {
  // 今回正解 & 累積1回以上正解 → 学習中
  wordProgress.category = 'still_learning';
} else if (!isCorrect && !isStillLearning && wordProgress.consecutiveIncorrect >= 2) {
  // 今回も不正解 & 2回以上連続不正解 → 要学習
  wordProgress.category = 'incorrect';
}
```

### 2. 再スケジューリングを毎回実行（MemorizationView.tsx）

```typescript
// ✅ 毎回再スケジューリング（カテゴリ変化を即座に反映）
setRescheduleCounter(prev => prev + 1);
```

## 検証方法

1. **ブラウザコンソールでログ確認**
   ```
   📝 [Category] apple: ✅正解 → mastered | 正解2回, 不正解0回
   ```

2. **localStorage 直接確認**
   ```javascript
   JSON.parse(localStorage.getItem('english-progress')).words.apple.category
   ```

3. **再スケジューリングログ確認**
   ```
   🔄 [MemorizationView] 再スケジューリングトリガー発動
   ```

## 関連ファイル

- `src/storage/progress/progressStorage.ts` - カテゴリ遷移ロジック (Lines 1126-1185)
- `src/components/MemorizationView.tsx` - 再スケジューリングトリガー (Lines 508-517)
- `src/ai/scheduler/QuestionScheduler.ts` - スケジューリングロジック
- `scripts/category-balance-dta-simulation.ts` - シミュレーター

## 次のステップ

1. ✅ この問題をドキュメント化（完了）
2. ⏳ カテゴリ遷移条件を緩和する実装
3. ⏳ 再スケジューリング頻度を上げる
4. ⏳ ユーザーテスト・検証
