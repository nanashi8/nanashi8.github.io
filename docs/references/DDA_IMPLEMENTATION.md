# DDA (Dynamic Difficulty Adjustment) 実装ガイド

**最終更新**: 2025年12月18日  
**ステータス**: 実装完了

## 目次

1. [概要](#概要)
2. [DDAとは](#ddaとは)
3. [本プロジェクトでの実装](#本プロジェクトでの実装)
4. [忘却曲線理論](#忘却曲線理論)
5. [実装詳細](#実装詳細)
6. [効果測定](#効果測定)
7. [参考文献](#参考文献)

---

## 概要

本プロジェクトでは、**DDA (Dynamic Difficulty Adjustment: 動的難易度調整)** を実装し、学習者の記憶定着状況に応じて問題の出題タイミングと頻度を最適化しています。

### 従来の問題点

従来のランダム出題や固定スケジュールでは：
- ✗ すでに定着した問題を繰り返し出題（時間の無駄）
- ✗ 忘れかけている重要な問題を見逃す（学習効率低下）
- ✗ 学習者の個別状況を考慮しない（一律的）

### DDAによる解決

DDAを導入することで：
- ✓ 忘却リスクが高い問題を優先的に出題
- ✓ 定着済みの問題は適切な間隔で復習
- ✓ 学習者ごとの習熟度に自動適応

---

## DDAとは

### 定義

**Dynamic Difficulty Adjustment (DDA)** は、ゲーム業界や教育分野で広く使われている技術で、ユーザーのパフォーマンスに基づいてリアルタイムに難易度や課題を調整する仕組みです。

### 教育分野での応用

語学学習における DDA の目的：

1. **学習効率の最大化**
   - 適切なタイミングで適切な問題を出題
   - 「忘れる直前」に復習することで記憶を強化

2. **モチベーション維持**
   - 簡単すぎず、難しすぎない問題を提供
   - 達成感と挑戦のバランス

3. **個別最適化**
   - 学習者ごとの記憶特性に適応
   - 得意・苦手を自動分析

### 関連理論

- **間隔反復学習 (Spaced Repetition)**
- **エビングハウスの忘却曲線**
- **Leitner システム**
- **SuperMemo アルゴリズム**

---

## 本プロジェクトでの実装

### アーキテクチャ

```
学習履歴データ
    ↓
忘却リスク計算
    ↓
DDA 優先度調整
    ↓
振動防止フィルター
    ↓
最終出題順序
```

### 実装ファイル

| ファイル | 役割 |
|---------|------|
| `QuestionScheduler.ts` | DDA のメインロジック |
| `AntiVibrationFilter.ts` | 過度な繰り返しを防止 |
| `types.ts` | 型定義（WordStatus, PrioritizedQuestion 等） |

### 主要コンポーネント

#### 1. 忘却リスク計算

```typescript
/**
 * 忘却リスクスコア: 0-100%
 * - 0%: 完全に定着（今復習する必要なし）
 * - 50%: 忘れかけ（復習推奨）
 * - 100%: ほぼ忘れている（緊急復習必要）
 */
const forgettingRisk = calculateForgettingRisk(
  lastStudied,      // 最終学習時刻
  accuracy,         // 正答率
  reviewInterval    // 推奨復習間隔
);
```

#### 2. DDA 優先度調整

```typescript
// DDA: 忘却リスクに基づく優先度決定
if (forgettingRisk < 50) {
  // 定着済み → 後回し
  priority = 4.5;
} else {
  // 忘れかけ → 優先出題
  priority = 2.0;
}
```

#### 3. 3層防御システム

```
第1層: DDA（マクロ制御）
  忘却リスク < 50% → 後回し
  忘却リスク >= 50% → 優先

第2層: AntiVibrationFilter（ミクロ制御）
  <1分以内: +5.0 penalty
  <5分以内: +2.0 penalty
  3回連続正解: +2.0 penalty

第3層: SessionContext（コンテキスト考慮）
  認知負荷、時刻、疲労度を考慮
```

---

## 忘却曲線理論

### エビングハウスの忘却曲線

ドイツの心理学者ヘルマン・エビングハウス（1885年）が発見した、記憶の保持率が時間とともに低下する現象。

```
記憶保持率
100% |●
     |  ＼
 80% |    ●＼
     |       ＼●
 60% |          ＼●
     |             ＼●
 40% |                ＼●
     |                   ＼●
 20% |                      ＼●
     |_________________________●___
     0  1  6  24  2   7   30  (日)
        時間経過
```

### 復習の最適タイミング

記憶が「忘れる直前」（保持率 50-60%）に復習することで：
- 記憶の再固定化（Reconsolidation）が効果的に発生
- 次回の忘却速度が遅くなる
- 長期記憶への定着が促進される

### 本実装での適用

```typescript
// 忘却リスク50%が臨界点
const CRITICAL_THRESHOLD = 50;

if (forgettingRisk >= CRITICAL_THRESHOLD) {
  // 今復習すべき → 優先度アップ
  scheduleForReview(question);
} else {
  // まだ覚えている → 次の機会に
  deferQuestion(question);
}
```

---

## 実装詳細

### 忘却リスク計算式

```typescript
function calculateForgettingRisk(
  lastStudied: number,
  accuracy: number,
  reviewInterval: number
): number {
  const now = Date.now();
  const daysSinceStudy = (now - lastStudied) / (1000 * 60 * 60 * 24);
  const expectedInterval = reviewInterval || 1;

  // 時間リスク: 経過時間 / 推奨間隔（100%超で忘却危険）
  const timeRisk = (daysSinceStudy / expectedInterval) * 100;

  // 正答率リスク: 低いほど忘れやすい
  const accuracyRisk = (1 - accuracy / 100) * 50;

  return Math.min(100, timeRisk + accuracyRisk);
}
```

### パラメータ説明

| パラメータ | 説明 | 範囲 |
|-----------|------|------|
| `lastStudied` | 最終学習時刻（ミリ秒） | Unix timestamp |
| `accuracy` | 正答率 | 0-100% |
| `reviewInterval` | 推奨復習間隔（日数） | 1-60日 |
| `forgettingRisk` | 忘却リスクスコア | 0-100% |

### 優先度マッピング

```typescript
// 優先度: 0.0（最優先）～ 10.0（最低優先）

const priorityMap = {
  // 緊急: 忘却リスク 80%以上
  urgent: 0.5,
  
  // 高: 忘却リスク 50-79%
  high: 2.0,
  
  // 中: 忘却リスク 20-49%
  medium: 3.5,
  
  // 低: 忘却リスク 0-19%（定着済み）
  low: 4.5,
  
  // 保留: 最近学習した（振動防止）
  deferred: 6.0
};
```

### コード例

```typescript
// src/ai/scheduler/QuestionScheduler.ts 内

private calculateDDAPriority(
  wordStatus: WordStatus,
  forgettingRisk: number
): number {
  // DDA: 忘却リスクベースの優先度決定
  
  // 新規問題
  if (wordStatus.category === 'new') {
    return 3.0; // 中優先度
  }
  
  // 苦手問題（正答率低い）
  if (wordStatus.category === 'incorrect') {
    return 1.0; // 高優先度
  }
  
  // 学習中
  if (wordStatus.category === 'still_learning') {
    return 2.5; // やや高優先度
  }
  
  // 定着済み → 忘却リスクで判定
  if (wordStatus.category === 'mastered') {
    if (forgettingRisk < 50) {
      return 4.5; // 低優先度（後回し）
    } else {
      return 2.0; // 高優先度（復習必要）
    }
  }
  
  return 3.0; // デフォルト
}
```

---

## 効果測定

### 測定指標

1. **学習効率**
   - 時間あたりの定着単語数
   - 復習回数の削減率

2. **記憶定着率**
   - 1週間後の保持率
   - 1ヶ月後の保持率

3. **振動スコア**
   - 0-20: 理想的
   - 21-50: 許容範囲
   - 51-100: 要改善

### A/Bテスト設計

```
グループA（DDA有効）
  ↓ 比較
グループB（ランダム出題）

測定期間: 2週間
サンプル数: 各100名以上
```

### 期待される効果

| 指標 | 期待値 |
|------|--------|
| 学習時間の削減 | 20-30% |
| 定着率の向上 | 10-15% |
| 復習回数の最適化 | 30-40% 削減 |
| ユーザー満足度 | 向上 |

---

## ベストプラクティス

### 1. パラメータチューニング

```typescript
// 推奨パラメータ（実測データに基づき調整）
const DDA_CONFIG = {
  // 忘却リスク閾値
  criticalThreshold: 50,      // 50% で復習推奨
  urgentThreshold: 80,        // 80% で緊急復習
  
  // 優先度範囲
  minPriority: 0.0,
  maxPriority: 10.0,
  
  // 振動防止
  minInterval: 60 * 1000,     // 1分（ミリ秒）
  penaltyDecay: 0.5,          // ペナルティ減衰率
};
```

### 2. ログ監視

```typescript
// 振動スコアの監視
if (scheduleResult.vibrationScore > 50) {
  logger.warn('[DDA] 高い振動スコア検出', {
    score: scheduleResult.vibrationScore,
    threshold: 50,
    action: '出題間隔を調整してください',
  });
}
```

### 3. ユーザーフィードバック

```typescript
// 難易度評価を収集
interface UserFeedback {
  questionId: string;
  difficulty: 'too_easy' | 'just_right' | 'too_hard';
  timestamp: number;
}

// フィードバックに基づき優先度を微調整
function adjustPriorityByFeedback(
  priority: number,
  feedback: UserFeedback
): number {
  switch (feedback.difficulty) {
    case 'too_easy':
      return priority + 1.0; // 優先度下げる
    case 'too_hard':
      return priority - 1.0; // 優先度上げる
    default:
      return priority;
  }
}
```

---

## トラブルシューティング

### 問題: 同じ問題が頻繁に出題される

**原因**: 振動防止フィルターが機能していない

**解決策**:
```typescript
// AntiVibrationFilter の設定を確認
const filterOptions = {
  minTimeSinceLastAnswer: 60 * 1000, // 1分に延長
  consecutiveCorrectThreshold: 2,    // 閾値を下げる
};
```

### 問題: 重要な問題が出題されない

**原因**: 優先度計算が不適切

**解決策**:
```typescript
// 忘却リスク計算を再確認
logger.log('忘却リスク詳細', {
  word: question.word,
  forgettingRisk: risk,
  lastStudied: lastStudied,
  daysSinceStudy: daysSinceStudy,
});
```

### 問題: パフォーマンスが遅い

**原因**: スケジューリング処理に時間がかかる

**解決策**:
```typescript
// キャッシュを活用
const cachedPriorities = new Map<string, number>();

if (cachedPriorities.has(word)) {
  return cachedPriorities.get(word)!;
}
```

---

## 参考文献

### 学術論文

1. **Ebbinghaus, H. (1885)**. "Memory: A Contribution to Experimental Psychology"
   - 忘却曲線の原著

2. **Cepeda, N. J., et al. (2006)**. "Distributed practice in verbal recall tasks: A review and quantitative synthesis"
   - Psychological Bulletin, 132(3), 354-380
   - 間隔反復学習の効果を実証

3. **Pashler, H., et al. (2007)**. "Organizing Instruction and Study to Improve Student Learning"
   - IES Practice Guide
   - 教育現場での実践ガイド

### オンラインリソース

4. **SuperMemo Algorithm**
   - https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
   - SM-2 アルゴリズムの詳細

5. **Anki Documentation**
   - https://docs.ankiweb.net/
   - 実装の参考事例

6. **Leitner System**
   - https://en.wikipedia.org/wiki/Leitner_system
   - フラッシュカード学習法

### 関連プロジェクト

7. **本プロジェクトドキュメント**
   - [14AI統合ガイド](./14AI_INTEGRATION_GUIDE.md)
   - [統一スケジューラー実装完了レポート](./UNIFIED_SCHEDULER_IMPLEMENTATION_COMPLETE.md)
   - [統一スケジューラー計画](../plans/UNIFIED_QUESTION_SCHEDULER_PLAN.md)

---

## まとめ

DDA（Dynamic Difficulty Adjustment）は、学習者の記憶状況に応じて動的に問題の出題タイミングを調整する技術です。

### 本実装の特徴

✅ **科学的根拠**: エビングハウスの忘却曲線理論に基づく  
✅ **個別最適化**: 学習者ごとの習熟度に自動適応  
✅ **振動防止**: 3層防御システムで過度な繰り返しを防止  
✅ **リアルタイム調整**: 学習履歴を即座に反映  
✅ **拡張性**: 新しいアルゴリズムの追加が容易  

### 期待される成果

- **学習効率**: 20-30% 向上
- **記憶定着率**: 10-15% 向上
- **ユーザー体験**: 最適な難易度で快適な学習

### 今後の展開

- 機械学習による自動パラメータ調整
- ユーザーフィードバックの活用
- 多言語対応
- API 化

---

**作成者**: GitHub Copilot  
**レビュー**: 推奨  
**更新頻度**: 四半期ごと
