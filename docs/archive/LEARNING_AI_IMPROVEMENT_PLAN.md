# 学習AI改善計画（実現可能性評価版）

## 評価軸
- **実装難易度**: 既存コードへの影響範囲（低/中/高）
- **効果**: ユーザー体験・学習効果への影響度（小/中/大）
- **テスト容易性**: 検証とメトリクス計測の難易度（易/中/難）
- **優先度**: 即効性と依存関係（P0/P1/P2）

---

## フェーズ1: 即効性改善（2-3日）
**目標**: リスク最小・効果確実な調整で学習体験を底上げ

### 1.1 連続ミスの段階加点
- **実装難易度**: 低（questionPrioritySorter.tsの優先度計算に条件分岐追加）
- **効果**: 中（連続ミス項目のTOP入り安定化→苦手の早期克服）
- **テスト容易性**: 易（2連/3連の模擬データで期待順位を検証）
- **優先度**: P0

**実装内容**:
```typescript
// consecutiveCorrect === 0 かつ incorrectCount >= 2 で加点
let missBoost = 0;
if (progress.consecutiveCorrect === 0 && progress.incorrectCount >= 2) {
  missBoost = progress.incorrectCount >= 3 ? -5 : -2; // 3連ミスで大幅加点
}
finalPriority += missBoost;
```

**期待効果**: 連続3回ミスは確実にTOP3に、2回ミスはTOP10内に配置。

---

### 1.2 時間ブースト後半の増分緩和
- **実装難易度**: 低（BUCKET_BOOST配列の後半値を微調整）
- **効果**: 小-中（長期未復習が急激にTOPへ来すぎる問題を緩和）
- **テスト容易性**: 易（24時間未復習の優先度を比較）
- **優先度**: P0

**実装内容**:
```typescript
// 現在: [..., 95, 98, 100]
// 変更後: [..., 90, 93, 95] で後半の伸びを抑制
const BUCKET_BOOST = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 88, 90, 93, 95];
```

**期待効果**: 定着済み項目の復習タイミングが自然になり、新規と苦手のバランス向上。

---

### 1.3 seed実装（再現性担保）
- **実装難易度**: 低（軽量PRNG導入とMath.random置換）
- **効果**: 大（テスト安定化・バグ再現・比較検証が飛躍的に容易）
- **テスト容易性**: 易（同一seedで結果一致を検証）
- **優先度**: P0

**実装内容**:
```typescript
// mulberry32 PRNG
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
// CLI: --seed <n> で初期化、未指定時はDate.now()
```

**期待効果**: CI安定化、フレーク率0%、開発者間の再現性共有。

---

### 1.4 テスト拡充
- 連続ミス段階加点のアサーション（2連/3連の順位チェック）
- 時間ブースト緩和後の分布検証
- seed固定テスト3種（heavy_miss/perfect/practical_student）

**所要**: 2-3日、リスク: 低、ROI: 高

---

## フェーズ2: 効果大改善（5-7日） ✅ 完了

**目標**: 学習曲線の精緻化とメタAI連携強化

### 2.1 ストリーク減衰（時間ベース） ✅
- **実装難易度**: 中（lastStudiedからの経過時間で減衰率計算）
- **効果**: 大（古い連続正解の過大評価を抑制→真の定着度反映）
- **テスト容易性**: 中（24h/7d経過のモックで減衰を検証）
- **優先度**: P1
- **実装状態**: 完了（visual-random-simulation.tsに実装済み）

**実装内容**:
```typescript
function calculateEffectiveStreak(progress: WordProgress): number {
  if (!progress.lastStudied) return progress.consecutiveCorrect;
  
  const hoursSinceStudy = (Date.now() - progress.lastStudied) / (1000 * 60 * 60);
  const decayFactor = Math.max(0.5, 1 - hoursSinceStudy / (24 * 7)); // 1週間で50%まで減衰
  return progress.consecutiveCorrect * decayFactor;
}
```

**期待効果**: 「1週間前に3連正解」は現在の価値50%に減衰し、復習タイミングが早まる。

**検証結果**: テスト全9件通過。`減衰X.X回`として表示され、時間経過による補正が機能。

---

### 2.2 信頼度スコア（複合指標） ✅
- **実装難易度**: 中（正答率×最近密度の計算ロジック追加）
- **効果**: 大（一度の偶然正解を過大評価しない→より正確な定着判定）
- **テスト容易性**: 中（古い正解vs最近の正解の優先度差を検証）
- **優先度**: P1
- **実装状態**: 完了（visual-random-simulation.tsに実装済み）

**実装内容**:
```typescript
function calculateConfidenceScore(progress: WordProgress): number {
  const total = progress.correctCount + progress.incorrectCount;
  if (total === 0) return 0;
  
  const overallAccuracy = progress.correctCount / total;
  const recentAnswers = progress.answerHistory.slice(-5); // 直近5回
  const recentCorrectCount = recentAnswers.filter(a => a === '✓').length;
  const recentAccuracy = recentAnswers.length > 0 ? recentCorrectCount / recentAnswers.length : 0;
  
  return overallAccuracy * 0.5 + recentAccuracy * 0.5;
}
```

**期待効果**: 最近正解していない「見かけ上の定着」を補正→適切な再出題。

**検証結果**: `信頼度0.XX`として表示。0.75以上で高信頼度定着判定に活用。

---

### 2.3 メタAI理由ログの統合 ✅
- **実装難易度**: 中（visual-random-simulationにメタAIインスタンス追加）
- **効果**: 大（説明可能性向上→調整判断が容易に）
- **テスト容易性**: 易（ログ出力の有無を検証）
- **優先度**: P1
- **実装状態**: 完了（visual-random-simulation.tsに実装済み）

**実装内容**:
```typescript
function generateMetaAILog(item: any): string {
  const signals: string[] = [];
  const strategies: string[] = [];

  // Signal検出
  if (item.incorrectCount >= 3) {
    signals.push('連続ミス検出');
    strategies.push('優先度UP(-5)');
  } else if (item.incorrectCount === 2) {
    signals.push('2連ミス');
    strategies.push('優先度UP(-2)');
  }
  
  // 時間ブースト検出
  if (item.timeBoost >= 90) {
    signals.push('長期未復習');
    strategies.push('時間ブースト大');
  } else if (item.timeBoost >= 70) {
    signals.push('中期未復習');
    strategies.push('時間ブースト中');
  }
  
  // ストリーク減衰検出
  const effectiveStreakNum = parseFloat(item.effectiveStreak || '0');
  const rawStreak = item.consecutiveCorrect || 0;
  if (effectiveStreakNum < rawStreak * 0.8) {
    signals.push('ストリーク減衰中');
    strategies.push('復習促進');
  }
  
  // 信頼度スコア検出
  const confidenceNum = parseFloat(item.confidenceScore || '0');
  if (confidenceNum >= 0.75) {
    signals.push('高信頼度定着');
    strategies.push('出題頻度DOWN');
  } else if (confidenceNum < 0.4 && item.correctCount > 0) {
    signals.push('定着不安定');
    strategies.push('集中復習推奨');
  }

  return `[Signal: ${signals.join('・')}] [Strategy: ${strategies.join('・')}]`;
}
```

**期待効果**: 「なぜこの順序か」が一目瞭然→改善の高速PDCA。

**検証結果**: `🤖 [Signal: 2連ミス] [Strategy: 優先度UP(-2)]`として各項目の判断根拠を表示。

---

**所要**: 5-7日、リスク: 中、ROI: 高  
**実装結果**: 3日で完了。テスト9件全て通過。ストリーク減衰・信頼度スコア・メタAIログが稼働中。

---

## フェーズ3: 戦略的改善（10-14日） ✅ 完了

**目標**: 高度な出題戦略と個別適応の実装

### 3.1 インタリーブ設計（交互出題） ✅
- **実装難易度**: 高（ソート後に枠確保とカテゴリ混在ロジック）
- **効果**: 大（過学習回避・記憶干渉効果→長期記憶定着）
- **テスト容易性**: 難（長期効果の測定が必要）
- **優先度**: P2
- **実装状態**: 完了（visual-random-simulation.tsに実装済み）

**実装内容**:
```typescript
function applyInterleaving(sortedWords: any[]): any[] {
  const args = process.argv.slice(2);
  const interleavingEnabled = args.includes('--interleaving');
  
  if (!interleavingEnabled || sortedWords.length < 10) {
    return applyDifficultySlots(sortedWords);
  }

  // 枠配分: 重ミス枠×4、未学習枠×3、定着間近枠×2、その他×1
  const heavyMissSlots = 4;
  const newItemSlots = 3;
  const nearMasterySlots = 2;
  const otherSlots = 1;

  // カテゴリ別にフィルタリングして枠を埋める
  const heavyMiss = sortedWords.filter(w => w.category === '分からない');
  const newItems = sortedWords.filter(w => w.category === '未学習');
  const struggling = sortedWords.filter(w => w.category === 'まだまだ');
  const nearMastery = struggling.filter(w => parseFloat(w.confidenceScore || '0') >= 0.5);

  const top10: any[] = [];
  top10.push(...heavyMiss.slice(0, heavyMissSlots));
  top10.push(...newItems.slice(0, newItemSlots));
  top10.push(...nearMastery.slice(0, nearMasterySlots));
  
  // 残りを追加
  const usedIds = new Set(top10.map(w => w.questionId));
  const remaining = sortedWords.filter(w => !usedIds.has(w.questionId));
  top10.push(...remaining.slice(0, otherSlots));

  while (top10.length < 10 && remaining.length > 0) {
    const nextItem = remaining.find(w => !usedIds.has(w.questionId));
    if (!nextItem) break;
    top10.push(nextItem);
    usedIds.add(nextItem.questionId);
  }

  return [...top10, ...sortedWords.filter(w => !usedIds.has(w.questionId))];
}
```

**期待効果**: 同一カテゴリの連続出題を回避し、記憶干渉効果により長期記憶定着を促進。

**検証結果**: `🔀 インタリーブモード有効（重ミス×4 | 未学習×3 | 定着間近×2 | その他×1）`として表示。TOP10に各カテゴリが混合配置される。

---

### 3.2 難易度スロット（カテゴリ別最小枠） ✅
- **実装難易度**: 高（優先度計算後に枠調整ロジック追加）
- **効果**: 中-大（偏り防止→学習体験の安定化）
- **テスト容易性**: 中（分布の下限保証を検証）
- **優先度**: P2
- **実装状態**: 完了（visual-random-simulation.tsに実装済み）

**実装内容**:
```typescript
function applyDifficultySlots(sortedWords: any[]): any[] {
  const args = process.argv.slice(2);
  const slotsEnabled = args.includes('--difficulty-slots');
  
  if (!slotsEnabled || sortedWords.length < 10) {
    return sortedWords;
  }

  // 最小枠の定義
  const minSlots = {
    '分からない': 1,
    'まだまだ': 1,
    '覚えてる': 0,  // 低優先度のため最小枠なし
    '未学習': 2     // 新問題は2件以上確保
  };

  // TOP10のカテゴリ分布を確認し、不足を補充
  const top10 = sortedWords.slice(0, 10);
  const categoryDistribution = { /* カウント */ };
  
  for (const [category, minCount] of Object.entries(minSlots)) {
    const shortage = minCount - categoryDistribution[category];
    if (shortage > 0) {
      // 残りから補充して最下位と入れ替え
    }
  }
  
  return result;
}
```

**期待効果**: 各カテゴリの最小枠を保証し、学習の極端な偏りを防止。

**検証結果**: 未学習≥2件、分からない≥1件、まだまだ≥1件がTOP10に含まれることを保証。

---

### 3.3 疲労シグナル連動の緩和戦略 ✅
- **実装難易度**: 高（SignalDetectorの出力を優先度計算に反映）
- **効果**: 大（認知負荷高時に短問・易問を挿入→離脱防止）
- **テスト容易性**: 難（疲労状態のモックが必要）
- **優先度**: P2
- **実装状態**: 完了（visual-random-simulation.tsに実装済み）

**実装内容**:
```typescript
function estimateFatigue(events: AnswerEvent[]): number {
  if (events.length < 5) return 0;
  
  // 直近10回の誤答率と連続誤答から疲労を推定
  const recentEvents = events.slice(-10);
  const errorRate = recentEvents.filter(e => !e.isCorrect).length / recentEvents.length;
  
  let consecutiveErrors = 0;
  for (let i = recentEvents.length - 1; i >= 0; i--) {
    if (!recentEvents[i].isCorrect) consecutiveErrors++;
    else break;
  }
  
  // 疲労スコア: 誤答率70% + 連続誤答30%
  const fatigueScore = errorRate * 0.7 + (consecutiveErrors / 5) * 0.3;
  return Math.min(1.0, fatigueScore);
}

function applyFatigueAdjustment(sortedWords: any[], fatigueScore: number): any[] {
  const args = process.argv.slice(2);
  const fatigueEnabled = args.includes('--fatigue');
  
  if (!fatigueEnabled || fatigueScore < 0.5 || sortedWords.length < 10) {
    return sortedWords;
  }

  // 高疲労時（0.5以上）: 易問を2-3件挿入
  const insertCount = fatigueScore >= 0.7 ? 3 : 2;
  const easyItems = remaining.filter(w => 
    w.category === '覚えてる' || 
    (w.correctCount === 1 && w.incorrectCount === 0)
  );
  
  // TOP10の7-9位付近に易問を挿入
  const adjusted = [...top10.slice(0, 6), ...toInsert, ...top10.slice(6)].slice(0, 10);
  return result;
}
```

**期待効果**: 連続誤答時に易問を挿入し、成功体験を提供してモチベーション維持。

**検証結果**: `😴 疲労検出: 68% - 易問を挿入して認知負荷を緩和`として表示。疲労50%以上で易問2-3件がTOP10に挿入される。

---

**所要**: 10-14日、リスク: 高、ROI: 中-高（長期で効く）  
**実装結果**: 1日で完了。テスト11件全て通過。インタリーブ・難易度スロット・疲労連動が稼働中。

---

## 実行ロードマップ

### Week 1-2: フェーズ1完遂
- Day 1-2: 連続ミス段階加点 + 時間ブースト緩和
- Day 3-4: seed実装 + テスト拡充
- Day 5: 統合テスト・可視化確認

### Week 3-4: フェーズ2着手
- Week 3: ストリーク減衰 + 信頼度スコア
- Week 4: メタAI理由ログ統合 + テスト・ドキュメント

### Week 5-7: フェーズ3（オプション）
- 効果検証とユーザーフィードバックを踏まえて着手判断

---

## リスク管理
- **後方互換**: 既存の動作を壊さないよう、フラグで新機能ON/OFFを制御
- **A/Bテスト**: 本番投入前に旧ロジックと新ロジックの効果を比較
- **ロールバック**: 各フェーズでgitタグを切り、問題時は即座に戻せる体制

---

## KPI（成功指標）
- フェーズ1: CI安定化（フレーク率0%）、連続3ミスのTOP3入り率100%
- フェーズ2: 学習効率の標準偏差<15%、説明可能ログの利用率>80%
- フェーズ3: セッション完了率+10%、長期記憶定着率+15%（4週間後テスト）

---

## 次のアクション
1. フェーズ1の実装着手（連続ミス段階加点から）
2. seed実装の並行進行
3. テスト・可視化でフィードバックループ確立
