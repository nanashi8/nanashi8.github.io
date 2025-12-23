# 適応学習システムの最新研究とアルゴリズム設計 (2024-2025)

**調査日**: 2025年12月22日  
**参考文献**: Wikipedia (Spaced Repetition, SuperMemo), FSRS論文, SM-18アルゴリズム

---

## 1. 主要な研究知見

### 1.1 スペースドリピティションの科学的根拠

- **Ebbinghaus忘却曲線** (1880s): 記憶は時間とともに指数関数的に減衰
- **Spacing Effect**: 適切な間隔での復習が長期記憶形成に最も効果的
- **Testing Effect**: 想起行為自体が記憶を強化
- **メタ分析結果** (2021, Latimier et al.): スペースドリピティションは科学的に有効性が証明された学習法

### 1.2 最新のアルゴリズム

#### **FSRS (Free Spaced Repetition Scheduler)** - 2023年最新
- **開発**: Junyao Ye et al. (KDD 2022論文)
- **特徴**:
  - 確率的最短経路最適化 (SSP-MMC)
  - 記憶の動的変化を捉える
  - Anki 23.10+, RemNote 1.16+に実装
- **論文**: "Optimizing Spaced Repetition Schedule by Capturing the Dynamics of Memory" (IEEE TKDE 2023)

#### **SuperMemo SM-18** - 2019年
- **特徴**:
  - Two-component model of memory (短期記憶・長期記憶の分離)
  - 数万ユーザーのデータから最適化
  - 個人差を考慮した適応型スケジューリング

#### **Neural Network-based SRS** - 2024年
- **KARL (Knowledge-Aware Retrieval and Representations)** (2024年2月)
- 機械学習による記憶予測モデル

---

## 2. 本プロジェクトへの適用: Position統合設計

### 2.1 Position計算の7つの次元

研究に基づき、以下の7つのAI評価を統合します：

| AI担当 | 測定対象 | 科学的根拠 | 重み係数 |
|--------|---------|-----------|---------|
| **MemoryAI** | 忘却リスク | Ebbinghaus曲線 | 0.20 |
| **CognitiveLoadAI** | 認知負荷 | Working Memory理論 | 0.15 |
| **ErrorPredictionAI** | エラー予測 | Testing Effect | 0.20 |
| **RetentionAI** | 記憶定着度 | Long-term Potentiation | 0.15 |
| **DifficultyAI** | 難易度 | Desirable Difficulty | 0.10 |
| **SpaceRepetitionAI** | 最適間隔偏差 | Spacing Effect | 0.15 |
| **ForgettingRiskAI** | 忘却曲線 | Ebbinghaus関数 | 0.05 |

**合計**: 1.00 (100%)

### 2.2 Position計算式 (0-100スコア)

```typescript
Position = BaseScore + Σ(AI_i × Weight_i) + TimeBoost

BaseScore = 50 - (accuracy × 30) + (consecutiveErrors × 10)
// accuracy=1.0 → 20点 (mastered寄り)
// accuracy=0.0 → 50点 (中間)
// consecutiveErrors=3 → +30点 (incorrect寄り)

AI統合スコア = 
  MemoryAI × 0.20 +
  CognitiveLoadAI × 0.15 +
  ErrorPredictionAI × 0.20 +
  RetentionAI × 0.15 +
  DifficultyAI × 0.10 +
  SpaceRepetitionAI × 0.15 +
  ForgettingRiskAI × 0.05

TimeBoost = min(daysSinceLastReview × 2, 20)
// 最大+20点まで時間ブースト
```

### 2.3 各AI評価の計算式 (研究ベース)

#### MemoryAI: 忘却リスク (0-100)
```typescript
// Ebbinghaus忘却曲線: R(t) = e^(-t/S)
// S = 記憶強度 (Stability)
const stability = calculateStability(accuracy, attempts);
const forgettingRate = Math.exp(-daysSince / stability);
const memoryScore = (1 - forgettingRate) × 100;
```

**根拠**: Ebbinghaus (1885), SM-18の Two-Component Model

#### CognitiveLoadAI: 認知負荷 (0-100)
```typescript
// Sweller's Cognitive Load Theory
const intrinsicLoad = difficultyLevel × 30; // 単語固有の難易度
const extrinsicLoad = (1 - accuracy) × 50; // 学習者の困難度
const germaneLoad = attempts × 5; // 学習努力
const cognitiveScore = intrinsicLoad + extrinsicLoad + germaneLoad;
```

**根拠**: Sweller (1988), Bui et al. (2013) - Working Memory研究

#### ErrorPredictionAI: エラー予測 (0-100)
```typescript
// Predictive error model based on recent performance
const recentErrorRate = recentErrors / recentAttempts;
const errorTrend = (currentErrors - previousErrors) / previousErrors;
const consecutiveWeight = Math.min(consecutiveErrors × 15, 60);
const errorScore = recentErrorRate × 40 + consecutiveWeight;
```

**根拠**: Testing Effect (Karpicke & Roediger, 2007)

#### RetentionAI: 記憶定着度 (0-100)
```typescript
// Long-term Potentiation strength
const retentionStrength = accuracy × successStreak;
const timeDecay = Math.exp(-daysSince / 30); // 30日半減期
const retentionScore = (1 - retentionStrength × timeDecay) × 100;
```

**根拠**: Long-term Memory研究 (Smolen et al., 2016)

#### DifficultyAI: 難易度適応 (0-100)
```typescript
// Desirable Difficulty (Bjork, 1994)
const retrievalDifficulty = attempts × 8; // 試行回数
const timeGap = Math.min(daysSince × 3, 30); // 時間経過
const difficultyScore = retrievalDifficulty + timeGap;
```

**根拠**: Bjork (1994) - Desirable Difficulty Theory

#### SpaceRepetitionAI: 最適間隔偏差 (0-100)
```typescript
// Optimal interval based on SM-2/FSRS
const optimalInterval = calculateOptimalInterval(easiness);
const actualInterval = daysSinceLastReview;
const deviation = Math.abs(actualInterval - optimalInterval);
const spacingScore = Math.min(deviation × 5, 100);
```

**根拠**: SuperMemo SM-2, FSRS算法 (Ye et al., 2022)

#### ForgettingRiskAI: 忘却曲線 (0-100)
```typescript
// Ebbinghaus Forgetting Curve: R(t) = exp(-t/τ)
// τ = retention time constant (depends on difficulty)
const tau = 2.0 / (1 + consecutiveErrors); // エラーが多いほどτ小
const forgettingScore = (1 - Math.exp(-daysSince / tau)) × 100;
```

**根拠**: Ebbinghaus (1885), 忘却曲線の数学的モデル

---

## 3. Easiness Factor (EF) の計算

SuperMemo SM-2アルゴリズムに基づく：

```typescript
// 初期値: EF = 2.5
// 更新式: EF = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
// q = quality (0-5の評価)
// 最小値: EF = 1.3

function updateEasinessFactor(currentEF: number, quality: number): number {
  const delta = 0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02);
  const newEF = currentEF + delta;
  return Math.max(newEF, 1.3); // 最小1.3
}
```

**評価基準 (quality)**:
- 5: 完璧に即答
- 4: 少し迷ったが正解
- 3: 苦労して正解
- 2: 不正解だが見たら思い出した
- 1: 不正解、見ても馴染みがない
- 0: 完全にブラックアウト

---

## 4. Position範囲とカテゴリマッピング

| Position範囲 | カテゴリ | 復習頻度 | 科学的意味 |
|------------|---------|---------|-----------|
| 0-20 | mastered | 低 (7-14日間隔) | 長期記憶定着済み |
| 20-40 | new | 中 (3-5日間隔) | 短期記憶→長期記憶移行中 |
| 40-70 | still_learning | 高 (1-2日間隔) | 記憶形成中、要強化 |
| 70-100 | incorrect | 最高 (即座) | 誤記憶修正・再学習必要 |

**根拠**: Expanding Retrieval Practice (Landauer & Bjork, 1978)

---

## 5. 最適復習間隔 (Optimal Interval)

### SuperMemo SM-2ベース
```typescript
if (repetition === 0) {
  interval = 1; // 初回: 1日後
} else if (repetition === 1) {
  interval = 6; // 2回目: 6日後
} else {
  interval = Math.round(previousInterval × easinessFactor);
  // 3回目以降: 前回間隔 × EF
}
```

### FSRS改良版 (2023年最新)
```typescript
// FSRSはより複雑な確率モデルを使用
// Stability (S) と Difficulty (D) の2パラメータ
const S = calculateStability(retrievability, difficulty);
const D = calculateDifficulty(lapses, successRate);
const interval = S × ln(0.9) / ln(targetRetention);
// targetRetention = 0.9 (90%想起率目標)
```

---

## 6. 実装優先順位

### Phase 1: 基本統合 (即座実装)
1. ✅ WordPosition型を`number`に変更済み
2. ⏳ BaseScore計算 (accuracy + consecutiveErrors)
3. ⏳ 7つのAI評価関数実装
4. ⏳ 重み付き統合計算

### Phase 2: 高度な最適化 (後日)
5. ⏳ Easiness Factor動的更新
6. ⏳ FSRS的確率モデル導入
7. ⏳ Neural Network予測モデル検討

---

## 7. テストケース

### テストデータ1: 新規単語
```typescript
{
  accuracy: 0.0,
  consecutiveErrors: 0,
  attempts: 1,
  daysSince: 0,
  successStreak: 0
}
// Expected Position: 40-50 (new範囲)
```

### テストデータ2: 間違えた単語
```typescript
{
  accuracy: 0.33,
  consecutiveErrors: 3,
  attempts: 5,
  daysSince: 2,
  successStreak: 0
}
// Expected Position: 75-85 (incorrect範囲)
```

### テストデータ3: 定着した単語
```typescript
{
  accuracy: 0.95,
  consecutiveErrors: 0,
  attempts: 10,
  daysSince: 15,
  successStreak: 8
}
// Expected Position: 15-25 (mastered範囲、時間ブーストで若干上昇)
```

---

## 8. 参考文献

### 主要論文
1. **Ebbinghaus, H. (1885)**. "Memory: A Contribution to Experimental Psychology"
2. **Landauer, T. K., & Bjork, R. A. (1978)**. "Optimum rehearsal patterns and name learning"
3. **Karpicke, J. D., & Roediger, H. (2007)**. "Expanding retrieval practice promotes short-term retention"
4. **Ye, J., Su, J., Cao, Y. (2022)**. "A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling" (KDD 2022)
5. **Ye, J., Su, J., Nie, L., Cao, Y., Chen, Y. (2023)**. "Optimizing Spaced Repetition Schedule by Capturing the Dynamics of Memory" (IEEE TKDE)
6. **Latimier, A., Peyre, H., Ramus, F. (2021)**. "A Meta-Analytic Review of the Benefit of Spacing out Retrieval Practice Episodes on Retention"
7. **Tabibian, B. et al. (2019)**. "Enhancing human learning via spaced repetition optimization" (PNAS)

### アルゴリズム実装
- **SuperMemo SM-2**: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
- **FSRS**: https://github.com/open-spaced-repetition/fsrs4anki
- **Anki FSRS**: https://docs.ankiweb.net/deck-options.html#fsrs

---

## 9. 結論

本設計は以下の最新研究成果に基づいています：

1. **科学的根拠**: 40年以上の認知心理学研究
2. **実証済み**: Anki (1000万+ユーザー), SuperMemo (数十年の実績)
3. **最新技術**: FSRS (2023), Neural Network予測 (2024)
4. **適応性**: 個人差を考慮した動的スケジューリング

この設計により、対症療法ではなく、科学的根拠に基づいた本質的な学習最適化が実現されます。
