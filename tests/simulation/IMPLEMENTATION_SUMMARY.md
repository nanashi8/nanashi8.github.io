# 🎯 シミュレーションシステム実装完了

出題機能の問題を検証するための、実在の生徒を模したシミュレーションシステムが完成しました！

## 📦 実装内容

### 1. 生徒プロファイル定義
**ファイル**: `tests/simulation/studentProfiles.ts`

5つの実在的な生徒パターンを定義:
- 🆘 **Struggling_Student**: 苦戦中の生徒（incorrect: 30%, still_learning: 40%）
- 😴 **Overlearning_Student**: 過学習気味の生徒（連続15回正解）
- 😓 **Fatigued_Student**: 疲労中の生徒（25分経過、認知負荷75%）
- 😊 **Optimal_Student**: 最適状態の生徒（エラー率28%）
- 🌱 **Beginner_Student**: 初心者の生徒（未学習80%）

### 2. 解答データ生成器
**ファイル**: `tests/simulation/answerDataGenerator.ts`

プロファイルから以下を生成:
- WordProgressデータ（各単語の学習状態）
- 解答履歴データ
- セッション統計

### 3. シミュレーション実行エンジン
**ファイル**: `tests/simulation/simulationEngine.ts`

機能:
- QuestionSchedulerの動作シミュレーション
- 50ステップにわたるカテゴリー変化の追跡
- シグナル検出の記録
- スナップショット生成

### 4. プログレスバー可視化
**ファイル**: `tests/simulation/visualizeProgress.ts`

機能:
- カテゴリー変化のプログレスバー生成
- 時系列グラフ（Chart.js使用）
- 検出されたシグナルの表示
- HTML形式の美しいレポート出力

### 5. 統合テストランナー
**ファイル**: `tests/simulation/runAllSimulations.ts`

機能:
- 全プロファイルを自動実行
- 統合レポート生成
- ターミナルでの進捗表示

## 🚀 実行方法

### 方法1: npmスクリプト（推奨）
```bash
npm run simulate
```

### 方法2: Bashスクリプト
```bash
bash scripts/run-simulation.sh
```

### 方法3: 直接実行
```bash
npx tsx tests/simulation/runAllSimulations.ts
```

## 📊 出力結果

実行後、以下のファイルが生成されます:

```
test-results/simulation/
├── index.html                           # 📈 統合レポート
├── simulation_struggling_student.html   # 🆘 苦戦中の生徒
├── simulation_overlearning_student.html # 😴 過学習気味の生徒
├── simulation_fatigued_student.html     # 😓 疲労中の生徒
├── simulation_optimal_student.html      # 😊 最適状態の生徒
└── simulation_beginner_student.html     # 🌱 初心者の生徒
```

### 結果の見方

各HTMLファイルには以下が表示されます:

#### 1. カテゴリー変化プログレスバー
```
間違えた (incorrect)      [███████░░░░░░░░░░░░] 15.0% ↓ -15  (30 → 15)
学習中 (still_learning)   [██████████░░░░░░░░░] 25.0% ↓ -15  (40 → 25)
定着 (mastered)          [████████████████████] 50.0% ↑ +30  (20 → 50)
未学習 (new)             [██░░░░░░░░░░░░░░░░░] 10.0% → 0   (10 → 10)
```

#### 2. 時系列変化グラフ
- 50ステップの推移を折れ線グラフで表示
- 各カテゴリーの増減が一目で分かる

#### 3. 検出されたシグナル
- 😓 疲労シグナル: X回検出
- 😰 苦戦シグナル: Y回検出
- 😴 過学習シグナル: Z回検出
- 😊 最適状態シグナル: W回検出

#### 4. 統計情報
- 総ステップ数: 50
- 所要時間: 約100ms
- 正解率: 生徒別
- 平均優先度: 計算値

## ✅ 検証項目

このシミュレーションで以下を確認できます:

### ✅ 1. メタAIのシグナル検出
- [ ] 疲労シグナル（20分超 or 認知負荷70%超）
- [ ] 苦戦シグナル（エラー率40%超）
- [ ] 過学習シグナル（連続10回以上正解）
- [ ] 最適状態シグナル（エラー率20-35%）

### ✅ 2. category管理システム
- [ ] incorrect → still_learning への移行
- [ ] still_learning → mastered への移行
- [ ] new → still_learning への移行
- [ ] 各カテゴリーの正確な計数

### ✅ 3. 優先度計算
- [ ] incorrect単語が上位20%に含まれる
- [ ] still_learning単語が優先出題される
- [ ] DTAブーストが機能する
- [ ] シグナル反映が適用される

### ✅ 4. 問題解消の確認
- [ ] incorrect が減少する
- [ ] still_learning が減少または適切に管理される
- [ ] mastered が増加する
- [ ] 「まだまだ・分からない」が解消される

## 🎯 成功基準

### 苦戦中の生徒（Struggling_Student）
```
✅ incorrect:       30 → 15以下 (50%減)
✅ still_learning:  40 → 30以下 (25%減)
✅ mastered:        20 → 40以上 (100%増)
✅ 苦戦シグナル:    複数回検出
```

### 過学習気味の生徒（Overlearning_Student）
```
✅ new:             20 → 10以下 (50%減)
✅ still_learning:  15 → 25以上 (67%増)
✅ 過学習シグナル:  複数回検出
```

### 疲労中の生徒（Fatigued_Student）
```
✅ mastered単語が上位出題に多く含まれる
✅ incorrect が急増しない
✅ 疲労シグナル: 複数回検出
```

### 最適状態の生徒（Optimal_Student）
```
✅ カテゴリー分布が安定
✅ 最適状態シグナル: 複数回検出
✅ 正解率が維持される
```

### 初心者の生徒（Beginner_Student）
```
✅ new:             80 → 60以下 (25%減)
✅ still_learning:  10 → 30以上 (200%増)
✅ 新規単語が優先出題される
```

## 🔧 カスタマイズ

### 独自の生徒プロファイルを追加

`tests/simulation/studentProfiles.ts`に追加:

```typescript
export const myStudent: StudentProfile = {
  name: 'My_Student',
  description: '独自の生徒',
  totalWords: 100,
  categoryDistribution: {
    incorrect: 25,
    still_learning: 35,
    mastered: 25,
    new: 15,
  },
  // ... 他のパラメータ
};

// allProfilesに追加
export const allProfiles: StudentProfile[] = [
  // ... 既存のプロファイル
  myStudent, // ← 追加
];
```

### シミュレーションステップ数を変更

`runAllSimulations.ts`の`steps`パラメータ:

```typescript
const result = await runSimulation(profile, {
  steps: 100, // ← デフォルトは50
  wordListSize: 100,
  onProgress: (snapshot) => {
    // ...
  },
});
```

## 📚 関連ドキュメント

- [README.md](tests/simulation/README.md) - 詳細な使用方法
- [META_AI_TROUBLESHOOTING.md](docs/guidelines/META_AI_TROUBLESHOOTING.md) - トラブルシューティング
- [QUESTION_SCHEDULER_SPEC.md](docs/specifications/QUESTION_SCHEDULER_SPEC.md) - 詳細仕様

## 🎉 次のステップ

1. **シミュレーションを実行**
   ```bash
   npm run simulate
   ```

2. **結果を確認**
   - ブラウザで`test-results/simulation/index.html`を開く
   - 各生徒の詳細レポートを確認

3. **問題があれば修正**
   - デバッグログを確認
   - QuestionScheduler.ts を修正
   - progressStorage.ts を修正

4. **再度シミュレーション**
   - 修正後、再実行して改善を確認

---

**実行して、出題機能の動作を確認しましょう！** 🚀

```bash
npm run simulate
```
