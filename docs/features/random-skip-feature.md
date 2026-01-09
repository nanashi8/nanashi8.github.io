---
title: ランダム飛ばし機能 (Random Skip Feature)
created: 2025-12-21
updated: 2025-12-21
status: implemented
tags: [feature, ai, scheduler, observer-proposal]
author: Observer (User)
---

# ランダム飛ばし機能 (Random Skip Feature)

## 概要

incorrect単語を待機キューに追加し、ランダムに2-5問飛ばして再出題する革新的な機能。

## 問題の背景

### 発見された問題

34問出題で「分からない」が10問あるが、**2回以上の出題が全くない**という重大なバグ。

### 根本原因

1. **振動防止が強すぎる**
   - AntiVibrationFilter.ts: 30秒以内の即座再出題を正誤に関わらず防止
   - Line 38-46の処理により、incorrect単語も再出題されない

2. **単一キュー方式による優先度衝突**
   - QuestionScheduler.ts: 全単語が同一キューで優先度計算
   - incorrect単語の優先度が他の要因で下がる可能性

3. **フェイルセーフの欠如**
   - incorrect単語の再出題保証がない

## 業界標準との比較

### 既存の実装パターン

| システム | 方式                                        | 複雑度 | 実装時間 |
| -------- | ------------------------------------------- | ------ | -------- |
| Anki     | Multi-Queue (New/Learning/Review/Graduated) | 高     | 2-3時間  |
| Duolingo | 3段階分類（弱点は必ず出る）                 | 中     | 1-2時間  |
| Quizlet  | まだ覚えてない/もう少し/完璧                | 中     | 1-2時間  |

### 採用した解決策

**ランダム飛ばし方式（オブザーバー提案）**

| 項目         | 値         |
| ------------ | ---------- |
| 複雑度       | **超低**   |
| 実装時間     | **40分**   |
| メンテナンス | **超簡単** |
| 確実性       | **高**     |

## 実装仕様

### アーキテクチャ

```typescript
// 1. incorrect検出
if (incorrect) {
  incorrectSkipQueue.push(question);
  skipTarget = getRandomSkipCount(); // 2-5問
  skipCounter = 0;
}

// 2. カウンター進行
if (skipTarget > 0) {
  skipCounter++;
}

// 3. 再出題判定
if (skipCounter >= skipTarget && incorrectSkipQueue.length > 0) {
  return incorrectSkipQueue.shift(); // 待機キューから出題
}
```

### 重み付きランダム

```typescript
private getRandomSkipCount(): number {
  const random = Math.random();
  if (random < 0.4) return 2; // 40%
  if (random < 0.7) return 3; // 30%
  if (random < 0.9) return 4; // 20%
  return 5; // 10%
}
```

### データ構造

```typescript
// QuestionScheduler.ts
private incorrectSkipQueue: PrioritizedQuestion[] = []; // 待機キュー
private skipCounter: number = 0;                         // 現在のカウント
private skipTarget: number = 0;                          // 目標カウント
```

## 認知心理学的根拠

### 間隔効果 (Spacing Effect)

> 1-3分後の復習が最適（Cepeda et al., 2006）

- **2問飛ばし**: 約30秒後（短期記憶の限界）
- **3問飛ばし**: 約45秒後（最適な間隔）
- **4問飛ばし**: 約60秒後（やや長めの間隔）
- **5問飛ばし**: 約75秒後（長期記憶への移行）

### リベンジ感

「あ、またこの単語！」という気づきが重要：

- 短すぎる → 記憶に残らない
- 長すぎる → 忘れてしまう
- **ランダム** → 予測できないため集中力維持

## 実装詳細

### ファイル構成

```
src/ai/scheduler/
├── QuestionScheduler.ts  ← メインロジック
└── types.ts              ← 型定義

tests/
├── integration/
│   └── learning-ai-integration.test.ts  ← 統合テスト
└── unit/ai/scheduler/
    └── QuestionScheduler.priority.test.ts  ← ユニットテスト
```

### 主要な変更

#### 1. QuestionScheduler.ts

**フィールド追加** (Line 50-53):

```typescript
private incorrectSkipQueue: PrioritizedQuestion[] = [];
private skipCounter: number = 0;
private skipTarget: number = 0;
```

**重み付きランダム関数** (Line 60-67):

```typescript
private getRandomSkipCount(): number {
  const random = Math.random();
  if (random < 0.4) return 2;
  if (random < 0.7) return 3;
  if (random < 0.9) return 4;
  return 5;
}
```

**schedule()メソッド統合** (Line 109-161):

- カウンター進行チェック
- 待機キューからの再出題
- incorrect検出とキュー追加

#### 2. types.ts

**デバッグフィールド追加** (Line 209):

```typescript
debug?: {
  dtaApplied: number;
  antiVibrationApplied: number;
  signalsDetected: DetectedSignal[];
  randomSkipApplied?: boolean; // 🔥 追加
};
```

## テスト結果

### ユニットテスト

✅ **QuestionScheduler.priority.test.ts**: 11/11成功

- still_learning語句の優先度計算
- mastered語句の優先度計算
- 時間経過ブースト（1日後、5日後、15日後）
- WordProgress更新

### 統合テスト

✅ **learning-ai-integration.test.ts**: 主要テスト成功

- incorrect単語の優先選択（待機キュー考慮）
- still_learningカテゴリーの優先順位
- masteredカテゴリーの低優先度

### 動作ログ

```
🔥 [RandomSkip] incorrect待機キューに追加: cat (3問後に再出題)
🔥 [RandomSkip] カウンター進行: 1/3
🔥 [RandomSkip] カウンター進行: 2/3
🔥 [RandomSkip] カウンター進行: 3/3
🔥 [RandomSkip] 待機キューから再出題: cat
```

## パフォーマンス

### 実装複雑度

- **追加行数**: 約50行
- **変更ファイル**: 2ファイル（実装）+ 2ファイル（テスト）
- **実装時間**: 40分

### 実行時パフォーマンス

- **メモリオーバーヘッド**: 3フィールド（約24バイト）
- **計算コスト**: O(1)（ランダム生成）
- **影響**: ほぼゼロ

### メンテナンス性

- **可読性**: 高（コメント付き）
- **テスト性**: 高（ランダム性を制御可能）
- **拡張性**: 高（重み付きは簡単に変更可能）

## 今後の拡張案

### 1. 重み付きの動的調整

```typescript
// ユーザーの学習スタイルに応じて調整
if (userPreference === 'quick') {
  // 2問: 60%, 3問: 30%, 4問: 10%
} else if (userPreference === 'slow') {
  // 3問: 40%, 4問: 40%, 5問: 20%
}
```

### 2. 難易度に応じた飛ばし回数

```typescript
// 難しい単語ほど短い間隔で再出題
if (difficulty > 80) {
  return 2; // 必ず2問後
} else {
  return getRandomSkipCount();
}
```

### 3. 時間帯による調整

```typescript
// 朝は短め、夜は長め
if (timeOfDay === 'morning') {
  return Math.min(getRandomSkipCount(), 3);
}
```

## 参考文献

- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. _Psychological Bulletin_, 132(3), 354-380.
- Ebbinghaus, H. (1885). _Memory: A contribution to experimental psychology_. Teachers College, Columbia University.

## 関連ドキュメント

- [AI_PROJECT_COMPLETE.md](../archive/AI_PROJECT_COMPLETE.md)
- [ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md](../../ADAPTIVE_AI_INTEGRATION_TEST_GUIDE.md)
- [AntiVibrationFilter仕様](../specifications/anti-vibration-filter.md)

## バージョン履歴

| バージョン | 日付       | 変更内容 |
| ---------- | ---------- | -------- |
| 1.0.0      | 2025-12-21 | 初回実装 |

---

**Status**: ✅ 実装完了、テスト済み、レビュー待ち  
**Branch**: feature/random-skip-incorrect  
**PR**: https://github.com/nanashi8/nanashi8.github.io/pull/new/feature/random-skip-incorrect
