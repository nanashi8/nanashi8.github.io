# 学習AIシステム アーキテクチャ仕様書

## 概要

本システムは、複数のAIコンポーネントが協調して、生徒一人ひとりに最適化された学習体験を提供するシステムです。

## 🧠 AIコンポーネント構成

### 1. QuestionScheduler（出題スケジューリングAI）
**責務**: 最適なタイミングと順序で問題を出題する

**主要ロジック**:
- カテゴリーベース優先度（new: 50, learning: 30, incorrect: 0, mastered: 100）
- 時間ベース優先度ブースト（経過時間に応じて優先度上昇）
- アンチバイブレーションフィルター（振動抑制）

**ファイル**: `src/ai/scheduler/QuestionScheduler.ts`

### 2. MemoryAI（記憶定着予測AI）
**責務**: 忘却曲線を個別に予測し、記憶保持率を計算する

**主要機能**:
- 個別忘却曲線パラメータの学習
- 記憶保持率の予測
- 復習最適タイミングの算出

**ファイル**: `src/ai/specialists/MemoryAI.ts`

### 3. LearningAISimulator（学習シミュレーター）
**責務**: 学習AIの動作をシミュレートし、動作検証を可能にする

**機能**:
- 100問の模擬学習セッション
- カテゴリー分布の可視化
- 優先度計算の検証

**ファイル**: `src/ai/simulation/learningAISimulator.ts`

### 4. ProgressStorage（進捗管理）
**責務**: 学習データの永続化とカテゴリー判定

**主要機能**:
- WordProgress の更新
- カテゴリーの判定と保存
- 統計情報の集計

**ファイル**: `src/storage/progress/progressStorage.ts`

## 🎯 カテゴリー判定基準（4タブ統一）

### 現在の統一基準

```typescript
// 総試行回数
const totalAttempts = correctCount + incorrectCount;

if (totalAttempts === 0) {
  category = 'new';              // 未学習
} else if (totalAttempts === 1 && correctCount === 1) {
  category = 'mastered';         // 🟢 1発正解 → 定着済
} else if (consecutiveCorrect >= 3) {
  category = 'mastered';         // 🟢 連続3回正解 → 定着済
} else if (incorrectCount > 0 && consecutiveCorrect < 2) {
  category = 'incorrect';        // 🔴 不正解あり & 連続正解少ない → 要復習
} else {
  category = 'still_learning';   // 🟡 それ以外 → 学習中
}
```

### カテゴリーの意味

| カテゴリー | 日本語 | 条件 | 優先度 | 再出題 |
|-----------|--------|------|--------|--------|
| new | 新規 | 未出題 | 50 | 中程度 |
| mastered | 覚えてる・定着済 | 1発正解 or 連続3回正解 | 100 | 時間経過で再出題 |
| still_learning | まだまだ・学習中 | 学習途中 | 30 | 高頻度 |
| incorrect | 分からない・要復習 | 不正解あり | 0 | 最優先 |

## 🔄 優先度計算フロー

```
1. ベース優先度を決定
   ├─ new: 50
   ├─ learning: 30
   ├─ incorrect: 0
   └─ mastered: 100

2. 時間ブーストを計算
   ├─ 最終学習からの経過時間を取得
   ├─ バケット判定（1時間以内、1日以内、3日以内、7日以内、30日以内、それ以上）
   └─ ブースト値を計算（mastered単語は時間経過で優先度上昇）

3. 最終優先度 = ベース優先度 - (時間ブースト × 係数)
   ※数値が小さいほど優先度が高い
```

## 🔗 AI間の協調関係

```
ProgressStorage (データ管理)
    ↓
    │ updateWordProgress()
    │  ├─ カテゴリー判定
    │  ├─ 統計更新
    │  └─ 保存
    ↓
QuestionScheduler (出題制御)
    ↓
    │ recalculatePriorityAfterAnswer()
    │  ├─ ベース優先度計算
    │  ├─ 時間ブースト計算
    │  └─ 最終優先度決定
    ↓
    │ selectNextQuestion()
    │  ├─ アンチバイブレーションフィルター
    │  ├─ カテゴリーバランス
    │  └─ 重み付き抽選
    ↓
MemoryAI (記憶予測)
    │
    │ predictRetentionRate()
    │  ├─ 忘却曲線計算
    │  └─ 記憶保持率予測
    ↓
学習者（生徒）
```

## 🚨 修正時の必須手順

### Step 1: 現状分析（必須）
```bash
# 1. 現在のカテゴリー判定ロジックを確認
grep -n "category = " src/storage/progress/progressStorage.ts
grep -n "category = " src/ai/simulation/learningAISimulator.ts
grep -n "category = " src/ai/scheduler/QuestionScheduler.ts

# 2. 不整合がないか確認
diff <(grep "category = 'mastered'" src/storage/progress/progressStorage.ts) \
     <(grep "category = 'mastered'" src/ai/simulation/learningAISimulator.ts)
```

### Step 2: 仕様確認（必須）
- 学習AIシミュレーターの期待動作を確認
- 設定タブでシミュレート結果を確認
- 現在のカテゴリー分布を確認

### Step 3: 影響範囲の特定（必須）
```typescript
// 修正が必要なファイルをすべてリストアップ
const filesToUpdate = [
  'src/storage/progress/progressStorage.ts',    // ✅ updateWordProgress, repairMissingCategories
  'src/ai/simulation/learningAISimulator.ts',   // ✅ calculatePriority, updateWordProgressInSimulation
  'src/ai/scheduler/QuestionScheduler.ts',      // ✅ カテゴリー推測ロジック
  // 必要に応じて追加
];
```

### Step 4: 統一的に修正（必須）
- すべての関連ファイルを**同時に**修正
- カテゴリー判定ロジックを**完全に統一**
- コメントで判定基準を明記

### Step 5: テスト（必須）
```bash
# 1. ユニットテスト実行
npm run test -- --grep="category|mastered|learning|incorrect"

# 2. 統合テスト実行
npm run test:integration

# 3. シミュレーターで検証
# → 設定タブでシミュレート実行
```

### Step 6: ドキュメント更新（必須）
- CHANGELOG.md に変更を記録
- この仕様書を更新
- コード内コメントを充実

## 🎓 学習AIシステムの設計思想

### 原則1: 生徒中心設計
すべての判定基準は「生徒がいつ、何を学ぶべきか」を最優先に考える

### 原則2: データ駆動型
感覚ではなく、実際の学習データに基づいて判定

### 原則3: 透明性
なぜその問題が出題されたのか、生徒が理解できるようにする

### 原則4: 適応性
生徒の学習速度に応じて自動調整される

## 🔍 デバッグ方法

### カテゴリー判定のトレース
```typescript
// progressStorage.ts に既に実装済み
console.log(
  `📝 [Category] ${word}: ${action} → ${category} | 
   正解${correctCount}回, 不正解${incorrectCount}回, 
   連続正解${consecutiveCorrect}, 連続不正解${consecutiveIncorrect}`
);
```

### 優先度計算のトレース
```typescript
// progressStorage.ts に既に実装済み
console.log(
  `🎯 [Priority] ${word}: ${priority} 
   (category=${category}, accuracy=${accuracy}%)`
);
```

## 📊 期待される動作

### シナリオ1: 新規単語
```
試行0回 → category='new', priority=50
→ 中程度の頻度で出題
```

### シナリオ2: 1発正解
```
試行1回（正解1） → category='mastered', priority=100
→ 時間経過で再出題（忘却防止）
```

### シナリオ3: 学習中
```
試行3回（正解2, 不正解1） → category='still_learning', priority=30
→ 高頻度で出題
```

### シナリオ4: 連続3回正解
```
consecutiveCorrect=3 → category='mastered', priority=100
→ 時間経過で再出題
```

### シナリオ5: 不正解多数
```
incorrectCount > 0 && consecutiveCorrect < 2 → category='incorrect', priority=0
→ 最優先で出題
```

## 🔄 時間ベース再出題（mastered単語）

mastered（定着済）単語は、時間経過とともに優先度が上がります：

```typescript
// 最終学習からの経過時間
const hoursSinceLastStudy = (now - lastStudied) / (1000 * 60 * 60);

// 時間ブースト（経過時間に応じて増加）
if (hoursSinceLastStudy >= 720) {      // 30日以上
  timeBoost = 100;
} else if (hoursSinceLastStudy >= 168) { // 7日以上
  timeBoost = 70;
} else if (hoursSinceLastStudy >= 72) {  // 3日以上
  timeBoost = 50;
} else if (hoursSinceLastStudy >= 24) {  // 1日以上
  timeBoost = 30;
} else if (hoursSinceLastStudy >= 1) {   // 1時間以上
  timeBoost = 10;
}

// 最終優先度（数値が小さいほど優先）
finalPriority = basePriority - (timeBoost × 0.5);

// 例: mastered単語が30日経過すると
// 100 - (100 × 0.5) = 50 → 新規単語と同じ優先度に
```

## 📝 変更履歴

| 日付 | 変更内容 | 影響範囲 | 理由 |
|------|----------|----------|------|
| 2025-12-21 | ガードレール作成 | - | 学習AIシステム保護のため |
| 2025-12-21 | 1発正解→mastered判定追加 | progressStorage, learningAISimulator | ユーザー要望 |

---

**重要**: この仕様書は学習AIシステムの唯一の信頼できる情報源です。
修正前に必ず最新版を確認してください。
