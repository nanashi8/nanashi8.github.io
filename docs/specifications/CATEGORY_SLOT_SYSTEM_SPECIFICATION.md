# カテゴリーベーススロットシステム仕様書

## 概要

カテゴリーベーススロットシステムは、学習者の進捗状況に基づいて出題を動的に調整する、適応型出題管理システムです。各学習カテゴリー（新規・分からない・まだまだ・定着済）に対して出題枠（スロット）を割り当て、最適な学習体験を提供します。

### 本仕様書の前提（重要）

- **現状実装（as-is）**: `SlotAllocator` / `SlotConfigManager` / `CategoryClassifier` / `CategoryPositionCalculator` の挙動を正とします。
- **将来拡張（to-be）**: 学習理論に基づく改善案（比率の自動可変、より厳密な間隔反復、メタ情報の重み付け等）は **「将来拡張」** として明示し、現状実装と混同しないようにします。
- **注意**: プロジェクト全体では `QuestionScheduler + GamificationAI` による **Position(0-100)降順 + インターリーブ** という別レイヤーが存在します。本書の「カテゴリ」は現状、主に `CategoryClassifier` による判定です。

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                   SlotAllocator（統合管理）                  │
├─────────────────────────────────────────────────────────────┤
│ 1. CategoryClassifier       → カテゴリー分類               │
│ 2. CategoryPositionCalculator → カテゴリー内優先度計算      │
│ 3. SlotConfigManager         → スロット設定管理            │
│ 4. スロット割当 & 再配分                                     │
│ 5. いもづる式学習統合                                        │
│ 6. 出題順序決定                                             │
└─────────────────────────────────────────────────────────────┘
```

## 1. カテゴリー定義

### 1.1 学習カテゴリー（LearningCategory）

現状実装の `CategoryClassifier` は、**Position範囲ではなく**、試行回数・正答率・連続正解/不正解などの学習統計でカテゴリーを判定します。

| カテゴリー | 判定の要点（as-is） | 学習上の意味 |
|---|---|---|
| **new** (新規) | `attempts === 0` | まだ出題されていない（探索フェーズ） |
| **incorrect** (分からない) | 試行回数が少ない場合は `consecutiveCorrect === 0` を重視。十分な試行回数がある場合は **正答率 < 50%** | 取りこぼしが大きく、早期の再露出が必要 |
| **still_learning** (まだまだ) | 試行回数が少ない場合は **連続正解が1以上**。十分な試行回数がある場合は **正答率 50–80%** | 形成中の記憶（適切な復習間隔が有効） |
| **mastered** (定着済) | **連続正解 ≥ 3** または **正答率 ≥ 80%** | 原則は低頻度で確認（忘却対策の軽い復習） |

### 1.2 カテゴリー判定基準

#### CategoryClassifier（カテゴリー分類器）

**初出題（初回解答）の特例（as-is / 要件準拠）**:
- `attempts === 0` は `new`
- 初回解答直後（`attempts === 1`）は、閾値境界での揺れを避けるため、**解答ボタンに対応する標準Position** を保存します。
  - 覚えてる → 15（mastered帯）
  - まだまだ → 50（still_learning帯）
  - 分からない → 70（incorrect帯）
- そして `CategoryClassifier` は `attempts === 1` の場合、**保存済みPositionからカテゴリを確定**します（= 解答ボタンと同名のカテゴリに分類される）。

**再出題（2回目以降）**:
- `CategoryClassifier.determineCategory(progress, mode)` が統計（試行回数、正答率、連続正解/不正解）に基づいて判定します。

## 2. スロット設定（BatchSlotConfig）

### 2.1 デフォルト出題枠比率

#### 暗記モード（memorization）

```typescript
{
  newRatio: 0.70,              // 新規語: 70%
  incorrectRatio: 0.15,        // 分からない: 15%
  stillLearningRatio: 0.10,    // まだまだ: 10%
  masteredRatio: 0.05,         // 定着済: 5%
  chainLearningRatio: 0.30     // いもづる式: 30%（各カテゴリー内）
}
```

#### 和訳モード（translation）

```typescript
{
  newRatio: 0.60,              // 新規語: 60% (復習重視)
  incorrectRatio: 0.20,        // 分からない: 20%
  stillLearningRatio: 0.15,    // まだまだ: 15%
  masteredRatio: 0.05,         // 定着済: 5%
  chainLearningRatio: 0.30
}
```

#### スペルモード（spelling）

```typescript
{
  newRatio: 0.65,
  incorrectRatio: 0.20,
  stillLearningRatio: 0.10,
  masteredRatio: 0.05,
  chainLearningRatio: 0.30
}
```

#### 文法モード（grammar）

```typescript
{
  newRatio: 0.60,
  incorrectRatio: 0.20,
  stillLearningRatio: 0.15,
  masteredRatio: 0.05,
  chainLearningRatio: 0.30
}
```

### 2.2 可変範囲

この節は「ユーザー体験上、枠が不足/過剰なときに学習効率を保つ」ための **将来拡張（to-be）** を含みます。

**現状（as-is）**:
- `SlotConfigManager` による固定比率（デフォルト or localStorageカスタム）
- `SlotAllocator.redistributeSurplus()` による **可用語数に基づく余剰の再配分**（不足時に比率を“増やす”のではなく、出せないカテゴリの枠を他カテゴリに回す）

| カテゴリー | デフォルト（as-is） | 推奨可変範囲（to-be） | 調整条件（to-be） |
|---|---|---|---|
| **分からない** | 15% | 15-30% | 苦手語増加時に自動拡大 |
| **まだまだ** | 10% | 15-30% | 学習中語増加時に自動拡大 |
| **定着済** | 5% | 5-10% | 定着語増加時に微調整 |
| **新規** | 70% | 残り全て | 他カテゴリーの余剰を補完 |

## 3. スロット割当アルゴリズム

### 3.1 割当フロー

```typescript
allocateSlots(params: SlotAllocationParams): SlotAllocationResult {
  // 1. スロット設定を取得
  const slotConfig = getSlotConfig(mode);

  // 2. 単語をカテゴリー別に分類
  const categorizedWords = categorizeWords(questions, progressMap, mode);

  // 3. カテゴリー内Positionを計算してソート
  const sortedByCategory = sortWordsByCategory(categorizedWords, progressMap, mode);

  // 4. スロット数を計算
  const allocatedSlots = calculateSlots(slotConfig, totalSlots, categorizedWords);

  // 5. 余剰スロットを再配分
  const finalSlots = redistributeSurplus(allocatedSlots, categorizedWords, totalSlots);

  // 6. 各カテゴリーからスロット数だけ選出
  const selectedWords = selectFromCategories(sortedByCategory, finalSlots);

  // 7. 出題順序を決定（カテゴリーミックス）
  const orderedQuestions = arrangeQuestions(selectedWords, questions);

  return { allocatedQuestions, stats, categoryDetails };
}
```

### 3.2 スロット数計算

**基本計算**:
```typescript
allocatedSlots = {
  new: Math.floor(totalSlots * slotConfig.newRatio),
  incorrect: Math.floor(totalSlots * slotConfig.incorrectRatio),
  still_learning: Math.floor(totalSlots * slotConfig.stillLearningRatio),
  mastered: Math.floor(totalSlots * slotConfig.masteredRatio)
}
```

**例**: 総スロット数 100問の場合
- 新規: 70問
- 分からない: 15問
- まだまだ: 10問
- 定着済: 5問

### 3.3 余剰スロット再配分

**再配分ルール**:

1. **不足検出**: 各カテゴリーで実際の語数 < 割当スロット数の場合、余剰を計算
2. **優先順位**: `incorrect` > `still_learning` > `new` > `mastered`
3. **再配分**: 優先度順に余剰スロットを追加割当

**例**:
```typescript
// 初期割当
incorrect: 15問割当、実際10語 → 余剰5問
still_learning: 10問割当、実際20語 → 不足なし

// 再配分後
incorrect: 10問（実際の語数まで縮小）
still_learning: 15問（余剰5問を追加）
```

## 4. カテゴリー内優先度計算

### 4.1 CategoryPositionCalculator（カテゴリー内Position計算）

カテゴリ内での順位（優先順位）は、次の情報から決まります。

**優先順位の入力（要件）**:
- **Position**（学習状況から得られる主要スコア）
- **メタデータ**（例: difficultyScore 等、学習者に対する難しさ/負荷の指標）
- **関連分野**（語彙ネットワーク等による関連性。いもづる式学習で強く反映）

現状実装では、`CategoryPositionCalculator` が主に学習ログに基づくスコアを算出し、いもづる式学習が有効な場合は `SlotAllocator` 側で関連性を強く反映します。

#### incorrect（分からない）
- `consecutiveIncorrect` に応じて上げる（1回あたり +5）
- 正答率が低いほど上げる（(100-accuracy) * 0.2、最大 +20 相当）

#### still_learning（まだまだ）
- 正答率が低いほど上げる（(100-accuracy) * 0.2、最大 +20 相当）
- 最終学習から日数が経つほど上げる（days * 0.5、最大 +10）

#### mastered（定着済）
- 最終学習から日数が経つほど上げる（days * 2、最大 +40）

#### new（新規）
- 現状は基準値（attempts=0は35）を基本に据える（バッチ順などは将来拡張余地）

**注意**:
- 現状は `difficultyScore` / `userDifficultyRating` 等の **一部メタ情報** を小さく加点します。
- 品詞・頻出度など、Question由来の追加メタデータ統合は将来拡張の余地があります。
- 語彙ネットワーク（関連分野/関連語の近さ）は、後述の「いもづる式学習（選出）」で強く反映されます。

### 4.2 （将来拡張）メタ情報・関連性の統合

品詞・頻出度・難易度などのメタ情報や、語彙ネットワークに基づく関連性を「カテゴリ内優先度」に組み込むことは学習効率の観点で有効な可能性がありますが、現状は **いもづる式学習（選出）** のみで関連性を扱います。

## 5. いもづる式学習統合

### 5.1 概要

直近出題語と結びつきが強い語を優先的に出題し、記憶の定着を促進します。

この機能は「関連分野（関連性）」の重み付けを担う位置づけです。

### 5.2 実装

**いもづる優先枠**:
- 各カテゴリースロットの **30%** をいもづる式学習用に確保
- 残り **70%** は通常のPosition優先

**通常枠（C案: タイブレークのみ関連性）**:
- 通常枠は基本的にカテゴリ内の優先度（Position中心）で埋める
- ただし **上位の僅差（例: Position差が小さい範囲）** に限り、直近語との関連性が高い語を前に出す（関連性は連続値として“軽く”効かせる）
- 目的: いもづる枠だけに偏らず、通常枠でも自然に関連語が混ざる一方、Positionの優先順位を大きく崩さない
- 運用: この「僅差判定の範囲・閾値」は **内部固定値** とし、設定UIやユーザー調整は行わない

**例**: まだまだカテゴリーに10問割当の場合
- いもづる優先: 3問（直近語と関連性の高い語）
- 通常優先: 7問（Position降順）

### 5.3 選出ロジック

```typescript
selectFromCategoriesWithChaining(sortedByCategory, finalSlots, slotConfig, recentWords) {
  for (const category of categories) {
    const chainSlots = Math.floor(slotCount * 0.3);
    const regularSlots = slotCount - chainSlots;

    // 1. いもづる優先枠: 直近語との結びつきが強い語（強度≥70）
    const chainCandidates = findRelatedWords(
      sortedWords,
      recentWords,
      strengthLookup,
      70  // 結びつき強度の閾値
    );
    selected.push(...chainCandidates.slice(0, chainSlots));

    // 2. 通常枠: Position降順
    const remaining = sortedWords.filter(w => !selected.includes(w));
    selected.push(...remaining.slice(0, regularSlots));
  }
}
```

## 6. 出題順序決定

### 6.1 カテゴリーミックス戦略

**基本パターン**:
```
incorrect → still_learning → new → mastered
(循環)
```

**現状（as-is）**:
- `SlotAllocator.arrangeQuestions()` は `incorrect → still_learning → new → mastered` の順に **ラウンドロビン** で並べます。

**将来拡張（to-be）**:
- `QuestionScheduler` のシグナル（fatigue/struggling等）や、より厳密な間隔反復モデル（例: SM-2系）を用いて、間隔や混ぜ方を動的に調整する余地があります。

## 7. SlotConfigManager（設定管理）

### 7.1 設定の優先順位

1. **LocalStorageのカスタム設定** → ユーザーが手動設定した値
2. **モード別デフォルト設定** → memorization, translation, spelling, grammar
3. **汎用デフォルト設定** → フォールバック値

### 7.2 設定のカスタマイズ

```typescript
const manager = new SlotConfigManager();

// 設定を取得
const config = manager.getSlotConfig('memorization');

// 設定をカスタマイズ
manager.setSlotConfig('memorization', {
  newRatio: 0.50,              // 新規50%
  incorrectRatio: 0.30,        // 分からない30%
  stillLearningRatio: 0.15,    // まだまだ15%
  masteredRatio: 0.05,         // 定着済5%
  chainLearningRatio: 0.40     // いもづる式40%
});

// 設定をリセット
manager.resetSlotConfig('memorization');  // 特定モード
manager.resetSlotConfig();                // 全モード
```

### 7.3 設定の検証と正規化

**自動正規化**:
- 負の値 → 0にクランプ
- 合計が1.0でない → 各比率を正規化
- chainLearningRatio → 0-1にクランプ

**例**:
```typescript
// 入力
{
  newRatio: 0.60,
  incorrectRatio: 0.25,
  stillLearningRatio: 0.10,
  masteredRatio: 0.10
}
// 合計: 1.05（1.0を超過）

// 正規化後
{
  newRatio: 0.571,     // 0.60 / 1.05
  incorrectRatio: 0.238,
  stillLearningRatio: 0.095,
  masteredRatio: 0.095
}
// 合計: 1.0
```

## 8. パフォーマンス最適化

### 8.1 キャッシング

- **設定キャッシュ**: `SlotConfigManager` はモード別設定をメモリキャッシュ
- **計算結果キャッシュ**: Position計算結果を一時保存

### 8.2 処理時間の扱い

- `SlotAllocator.allocateSlots()` は `processingTime` を計測しており、デバッグモードでログ出力できます。
- 具体的な「実測平均」は端末・データ量・ブラウザに依存するため、本書では固定値として断定しません。

## 9. デバッグモード

### 9.1 有効化

- スイッチ類を増やさない方針のため、`SlotAllocator` のデバッグログは **開発環境（DEV）では常に有効** です。
- 本番ビルドではログは無効です（ユーザー操作でON/OFFする仕組みは持ちません）。

### 9.2 出力情報

- スロット割当結果
- カテゴリー統計
- いもづる式学習の選出結果
- 処理時間
- 警告メッセージ

## 10. 統計情報（CategoryStats）

```typescript
interface CategoryStats {
  /** カテゴリー別の語数 */
  counts: {
    new: number,
    incorrect: number,
    still_learning: number,
    mastered: number
  },

  /** カテゴリー別の割り当てスロット数 */
  allocatedSlots: {
    new: number,
    incorrect: number,
    still_learning: number,
    mastered: number
  },

  /** 余剰スロット数 */
  surplusSlots: number,

  /** スロット不足があるか */
  hasShortage: boolean
}
```

## 11. 使用例

### 11.1 基本的な使用

```typescript
import { SlotAllocator } from '@/ai/scheduler';

const allocator = new SlotAllocator();

const result = allocator.allocateSlots({
  questions: allQuestions,        // 全問題リスト
  progressMap: progressCache.wordProgress,
  mode: 'memorization',
  totalSlots: 100,                // 出題数
  useChainLearning: true,         // いもづる式有効
  recentWords: ['apple', 'banana'] // 直近出題語
});

// 結果
console.log(result.allocatedQuestions);  // 出題順に並んだ問題リスト
console.log(result.stats);               // カテゴリー統計
console.log(result.categoryDetails);     // カテゴリー別詳細
```

### 11.2 カスタム設定での使用

```typescript
const allocator = new SlotAllocator();

const result = allocator.allocateSlots({
  questions: allQuestions,
  progressMap: progressCache.wordProgress,
  mode: 'memorization',
  totalSlots: 100,
  slotConfig: {
    newRatio: 0.50,
    incorrectRatio: 0.30,
    stillLearningRatio: 0.15,
    masteredRatio: 0.05,
    chainLearningRatio: 0.40
  }
});
```

### 11.3 アプリ統合（QuestionScheduler）

本システムは `QuestionScheduler.schedule()` の `useCategorySlots: true` で有効化できます。
スイッチ類（localStorageトグル）を増やさない方針のため、**アプリ側から明示指定**します。

```typescript
const scheduler = new QuestionScheduler();
const result = await scheduler.schedule({
  questions,
  mode: 'memorization',
  useCategorySlots: true,
  limits: { learningLimit: null, reviewLimit: null },
  sessionStats: { correct: 0, incorrect: 0, still_learning: 0, mastered: 0, duration: 0 },
});
```

## 12. 今後の拡張予定

### 12.1 機械学習統合

- 学習者の正答パターンから最適な比率を自動学習
- 時間帯、曜日別の最適設定

### 12.2 A/Bテスト

- 異なるスロット設定の効果測定
- 定着率、学習継続率の比較

### 12.3 個人最適化

- 学習者ごとの最適スロット比率を保存
- 学習履歴に基づく動的調整

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|---|---|---|
| 2025-12-29 | 1.0.0 | 初版作成 |
