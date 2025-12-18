# QuestionScheduler シミュレーションテスト

実在の生徒を模した解答データを使用して、メタAI（QuestionScheduler）の出題機能が正しく動作するかをシミュレーションします。

## 📋 概要

このシミュレーションシステムは以下を検証します:

1. **メタAIのシグナル検出**: 疲労・苦戦・過学習・最適状態の4種類のシグナルが正しく検出されるか
2. **category管理システム**: 単語のカテゴリー（incorrect/still_learning/mastered/new）が正しく更新されるか
3. **優先度計算**: DTAとシグナル反映により、復習単語が優先出題されるか
4. **問題解消**: 「まだまだ・分からない」や「学習中・要復習」が解消されるか

## 🎓 生徒プロファイル

以下の5つの実在的な生徒パターンでテストします:

### 1. Struggling_Student（苦戦中の生徒）
- **特徴**: 復習単語（incorrect/still_learning）が多い
- **期待動作**: メタAIが「苦戦シグナル」を検出し、復習単語を優先出題
- **カテゴリー分布**:
  - incorrect: 30% (間違えた単語)
  - still_learning: 40% (学習中)
  - mastered: 20% (定着)
  - new: 10% (未学習)

### 2. Overlearning_Student（過学習気味の生徒）
- **特徴**: 連続正解が多く、同じ問題ばかり出題されている
- **期待動作**: メタAIが「過学習シグナル」を検出し、新規単語を優先出題
- **カテゴリー分布**:
  - incorrect: 5%
  - still_learning: 15%
  - mastered: 60%
  - new: 20%

### 3. Fatigued_Student（疲労中の生徒）
- **特徴**: 長時間学習で疲労が蓄積（25分経過、認知負荷75%）
- **期待動作**: メタAIが「疲労シグナル」を検出し、簡単な問題（mastered）を優先出題
- **カテゴリー分布**:
  - incorrect: 15%
  - still_learning: 25%
  - mastered: 50%
  - new: 10%

### 4. Optimal_Student（最適な学習状態の生徒）
- **特徴**: エラー率28%（理想的な範囲20-35%）
- **期待動作**: メタAIが「最適状態シグナル」を検出し、現状を維持
- **カテゴリー分布**:
  - incorrect: 10%
  - still_learning: 30%
  - mastered: 40%
  - new: 20%

### 5. Beginner_Student（初心者の生徒）
- **特徴**: ほとんどが未学習の単語（80%）
- **期待動作**: 新規単語を中心に学習を開始
- **カテゴリー分布**:
  - incorrect: 5%
  - still_learning: 10%
  - mastered: 5%
  - new: 80%

## 🚀 実行方法

### 前提条件
- Node.js 16以上
- TypeScript環境

### 実行コマンド

```bash
# シミュレーションを実行
npx tsx tests/simulation/runAllSimulations.ts
```

## 📊 出力結果

シミュレーション完了後、以下のファイルが生成されます:

```
test-results/simulation/
├── index.html                           # 統合レポート（全生徒の概要）
├── simulation_struggling_student.html   # 苦戦中の生徒の詳細結果
├── simulation_overlearning_student.html # 過学習気味の生徒の詳細結果
├── simulation_fatigued_student.html     # 疲労中の生徒の詳細結果
├── simulation_optimal_student.html      # 最適状態の生徒の詳細結果
└── simulation_beginner_student.html     # 初心者の生徒の詳細結果
```

### 結果の見方

各HTMLファイルには以下の情報が含まれます:

#### 1. カテゴリー変化プログレスバー
- **incorrect**: 間違えた単語の数の変化
  - ⬇️ 減少: 良い（復習が進んでいる）
  - ⬆️ 増加: 悪い（新たな誤答が発生）

- **still_learning**: 学習中の単語の数の変化
  - ⬇️ 減少: 良い（定着に向かっている）
  - ⬆️ 増加: 中立（incorrectから移行）

- **mastered**: 定着した単語の数の変化
  - ⬆️ 増加: 良い（学習が進んでいる）
  - ⬇️ 減少: 悪い（定着が崩れている）

- **new**: 未学習の単語の数の変化
  - ⬇️ 減少: 良い（新規単語を学習開始）

#### 2. 時系列変化グラフ
50ステップにわたるカテゴリー分布の変化を折れ線グラフで表示

#### 3. 検出されたシグナル
- 😓 疲労シグナル: 長時間学習や認知負荷が高い
- 😰 苦戦シグナル: エラー率40%超
- 😴 過学習シグナル: 連続10回以上正解
- 😊 最適状態シグナル: エラー率20-35%

#### 4. 統計情報
- 総ステップ数: シミュレーション回数
- 所要時間: 実行時間
- 正解率: 生徒の正解率
- 平均優先度: 出題された問題の平均優先度

## ✅ 成功の判断基準

シミュレーションが成功したと判断するには:

### 苦戦中の生徒（Struggling_Student）
- ✅ `incorrect`が30 → 15以下に減少
- ✅ `still_learning`が40 → 30以下に減少
- ✅ `mastered`が20 → 40以上に増加
- ✅ 「苦戦シグナル」が複数回検出される

### 過学習気味の生徒（Overlearning_Student）
- ✅ `new`が20 → 10以下に減少（新規単語を学習）
- ✅ `still_learning`が15 → 25以上に増加
- ✅ 「過学習シグナル」が複数回検出される

### 疲労中の生徒（Fatigued_Student）
- ✅ 上位出題に`mastered`単語が多く含まれる
- ✅ 「疲労シグナル」が複数回検出される
- ✅ `incorrect`が急激に増えない（無理をしていない）

### 最適状態の生徒（Optimal_Student）
- ✅ カテゴリー分布が大きく変化しない（現状維持）
- ✅ 「最適状態シグナル」が複数回検出される

## 🔍 トラブルシューティング

### シミュレーションが失敗する場合

1. **categoryが更新されない**
   - 確認: `progressStorage.ts` Line 1097-1117
   - 原因: category更新ロジックが未実装

2. **シグナルが検出されない**
   - 確認: `QuestionScheduler.ts` Line 194-267
   - 原因: `detectSignals()`がダミー実装

3. **復習単語が優先出題されない**
   - 確認: `QuestionScheduler.ts` Line 534-600
   - 原因: `sortAndBalance()`の確実性保証が未実装

4. **プログレスバーが表示されない**
   - 確認: Chart.jsのCDN読み込み
   - 対処: インターネット接続を確認

## 📚 関連ドキュメント

- [META_AI_TROUBLESHOOTING.md](../../docs/guidelines/META_AI_TROUBLESHOOTING.md) - トラブルシューティングガイド
- [QUESTION_SCHEDULER_QUICK_GUIDE.md](../../docs/guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md) - クイックガイド
- [QUESTION_SCHEDULER_SPEC.md](../../docs/specifications/QUESTION_SCHEDULER_SPEC.md) - 詳細仕様書

## 📝 カスタマイズ

### 独自の生徒プロファイルを追加

`studentProfiles.ts`に新しいプロファイルを追加:

```typescript
export const customStudent: StudentProfile = {
  name: 'Custom_Student',
  description: 'カスタム生徒の説明',
  totalWords: 100,
  categoryDistribution: {
    incorrect: 20,
    still_learning: 30,
    mastered: 30,
    new: 20,
  },
  patterns: {
    recentErrors: ['abandon', 'ability'],
    consecutiveIncorrect: ['absent'],
    timeGap: 24 * 60 * 60 * 1000,
    consecutiveCorrect: 5,
    errorRate: 0.3,
  },
  session: {
    durationMinutes: 15,
    cognitiveLoad: 0.5,
    answersCount: 50,
  },
};

// allProfilesに追加
export const allProfiles: StudentProfile[] = [
  strugglingStudent,
  overlearningStudent,
  fatiguedStudent,
  optimalStudent,
  beginnerStudent,
  customStudent, // ← 追加
];
```

### シミュレーションステップ数を変更

`runAllSimulations.ts`の`steps`パラメータを変更:

```typescript
const result = await runSimulation(profile, {
  steps: 100, // ← 50から100に変更
  wordListSize: 100,
  onProgress: (snapshot) => {
    // ...
  },
});
```

## 🎯 まとめ

このシミュレーションシステムにより、以下が検証できます:

1. ✅ メタAI（QuestionScheduler）が正しくシグナルを検出する
2. ✅ category更新ロジックが機能し、復習単語が優先出題される
3. ✅ 「まだまだ・分からない」や「学習中・要復習」が解消される
4. ✅ プログレスバーで視覚的に進捗を確認できる

**早速実行して、出題機能の動作を確認しましょう！**

```bash
npx tsx tests/simulation/runAllSimulations.ts
```
