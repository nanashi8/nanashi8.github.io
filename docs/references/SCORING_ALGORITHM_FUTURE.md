# スコアリング・間隔反復アルゴリズム改修ガイド

## 現在の方式（カテゴリベース優先度）

### 概要
- カテゴリ（分からない/まだまだ/覚えてる/未学習）で基礎優先度を設定
- 時間経過で優先度を調整（TimeBasedPriorityAI）
- 連続正解・正答率でカテゴリを判定

### 実装箇所
- `src/utils/questionPrioritySorter.ts`: 優先度計算のコア
- `src/ai/nodes/TimeBasedPriorityAI.ts`: 時間ブースト
- カテゴリ判定ロジック: `consecutiveCorrect >= 3` または `正答率 >= 0.8` で「覚えてる」

### 長所
- シンプルで直感的（色丸可視化と相性良好）
- 14AIシステムとの統合が容易
- 実装・調整・テストが簡単

### 短所
- 個人差を反映しない（全員同じ基準）
- 記憶曲線の理論的裏付けが弱い
- 復習間隔が指数的に増加しない

---

## 一般的なアルゴリズム

### 1. SM-2（SuperMemo Algorithm 2, 1987）

**概要**
- 世界で最も普及している間隔反復アルゴリズム
- 各項目に「易しさ係数（EF: Easiness Factor）」を持つ
- 復習間隔 = 前回間隔 × EF

**計算式**
```
初期: EF = 2.5, interval = 1日

正解の場合:
  interval_new = interval_old × EF
  EF_new = EF_old + 0.1 (上限なし)

不正解の場合:
  interval_new = 1日（リセット）
  EF_new = max(1.3, EF_old - 0.2)
```

**採用例**
- Anki（初期バージョン）
- SuperMemo
- Duolingo（改良版）
- Quizlet

**実装難易度**: 中
**効果**: 大（長期記憶に最適化）

---

### 2. Leitner System（1972）

**概要**
- 物理カードの箱システムをデジタル化
- Box 1（毎日）→ Box 2（3日ごと）→ Box 3（1週間ごと）...
- 正解で次の箱、不正解でBox 1へ

**実装**
```typescript
const boxes = [1, 3, 7, 15, 30, 60]; // 日数
let boxIndex = 0;

if (正解) {
  boxIndex = Math.min(boxIndex + 1, boxes.length - 1);
} else {
  boxIndex = 0;
}
nextReviewDate = today + boxes[boxIndex];
```

**採用例**
- 古典的な単語帳アプリ
- シンプルなフラッシュカードシステム

**実装難易度**: 低
**効果**: 中（シンプルだが効果的）

---

### 3. FSRS（Free Spaced Repetition Scheduler, 2023）

**概要**
- 機械学習ベースの最新アルゴリズム
- 個人の記憶曲線を学習して最適化
- 17個のパラメータを最適化

**特徴**
- ユーザーごとに記憶曲線をフィッティング
- 項目の難易度・安定性・検索可能性を推定
- 確率的モデルで次回復習の最適タイミングを予測

**採用例**
- Anki 2.1.45以降（推奨アルゴリズム）
- 最新の研究ベースSRS

**実装難易度**: 高
**効果**: 最大（個人最適化）

**参考**: https://github.com/open-spaced-repetition/fsrs4anki

---

## 導入シナリオ

### オプション1: SM-2の簡易版（推奨・フェーズ4候補）

**追加データ**
```typescript
interface WordProgress {
  // 既存 + 追加
  easinessFactor: number; // 初期 2.5
  reviewInterval: number; // 日数
  nextReviewDate: number; // timestamp
}
```

**優先度計算への統合**
```typescript
// 現在のカテゴリベース + EFベース間隔を併用
const daysSinceReview = (Date.now() - nextReviewDate) / (1000 * 60 * 60 * 24);
if (daysSinceReview > 0) {
  // 復習タイミングを過ぎている → 優先度UP
  priority -= daysSinceReview * 2;
}
```

**メリット**
- 現行方式と共存可能
- 段階的移行が可能（AB テスト容易）
- 長期記憶に最適化

**デメリット**
- LocalStorageスキーマ拡張が必要
- 効果測定に数週間〜数ヶ月必要

---

### オプション2: 箱システム（Leitner）の導入

**追加データ**
```typescript
interface WordProgress {
  // 既存 + 追加
  boxLevel: number; // 0-5
}

const BOX_INTERVALS = [1, 3, 7, 15, 30, 60]; // 分単位に調整可
```

**優先度計算**
```typescript
const minutesSinceStudy = (Date.now() - lastStudied) / (1000 * 60);
const threshold = BOX_INTERVALS[progress.boxLevel];
if (minutesSinceStudy >= threshold) {
  priority -= 10; // 復習タイミング到達
}
```

**メリット**
- 実装が最もシンプル
- 現行の時間バケットと相性良好
- 説明しやすい（ユーザーにも分かりやすい）

**デメリット**
- 個人差を反映しない
- 項目難易度を考慮しない

---

### オプション3: FSRS完全導入（長期目標）

**前提条件**
- 数千〜数万件のユーザー学習データ蓄積
- バックエンドでのパラメータ最適化基盤
- A/Bテスト・効果測定の環境整備

**導入ステップ**
1. FSRS-rsライブラリのWASM化
2. 個人学習履歴の収集（3ヶ月以上）
3. パラメータフィッティング
4. 段階的ロールアウト（10%→50%→100%）

**メリット**
- 理論的に最も効果的
- 個人の記憶特性に最適化

**デメリット**
- 実装コストが極めて高い
- データ蓄積期間が長い
- ブラックボックス化のリスク

---

## 推奨ロードマップ

### フェーズ1-3（現行計画）
- カテゴリベース方式の精緻化
- 連続ミス段階加点、ストリーク減衰、信頼度スコア

### フェーズ4（3-6ヶ月後）
- ユーザーデータ分析で効果を評価
- SM-2簡易版 or Leitner箱システムの導入検討
- AB テストで効果を定量測定

### フェーズ5（1年後）
- 長期効果の分析（4週間後テストの正答率向上）
- FSRS導入の可否判断

---

## 実装時の注意点

### 1. 後方互換性
- 既存ユーザーのデータを壊さない
- 新フィールドは Optional で追加
- フラグでアルゴリズム切替可能に

### 2. テスト戦略
- 長期効果の測定が必須（短期テストだけでは不十分）
- 基準: 4週間後テストの正答率、定着率、学習時間効率
- seed固定での再現性担保

### 3. UX設計
- 復習タイミングの透明性（「次回復習: 3日後」など）
- ユーザーが理解できる説明（「記憶が薄れる前に復習」）
- オプトアウトの提供（旧方式への切替）

### 4. パフォーマンス
- EF/箱レベルの計算は軽量
- LocalStorageの肥大化に注意（定期クリーンアップ）

---

## 参考文献

### 論文・記事
- Wozniak, P. (1990). "SuperMemo Algorithm SM-2"
- Leitner, S. (1972). "So lernt man lernen"
- Tabibian et al. (2019). "Enhancing Human Learning via Spaced Repetition Optimization"
- FSRS論文: https://github.com/open-spaced-repetition/fsrs4anki/wiki

### 実装例
- Anki ソースコード: https://github.com/ankitects/anki
- SuperMemo公式: https://www.supermemo.com/
- FSRS実装: https://github.com/open-spaced-repetition/fsrs-rs

### 比較記事
- "Comparison of spaced repetition algorithms" (Wikipedia)
- "The Best Spaced Repetition Algorithm" (LessWrong)

---

## 次のアクション（フェーズ4着手時）

1. 現行データの分析（平均復習回数、定着率、カテゴリ遷移）
2. SM-2簡易版 vs Leitner の設計比較
3. プロトタイプ実装（フラグ制御）
4. ABテスト設計（サンプルサイズ計算）
5. 長期効果測定の準備（4週間後テストの自動化）
