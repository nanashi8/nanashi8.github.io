---
description: AI・学習システム修正時のカテゴリ索引
category: ai-system
---

# 📂 Category: AI & Learning System

## 🎯 このカテゴリの対象

- QuestionScheduler の修正
- GamificationAI の修正
- 他の7つの専門AI（記憶AI、認知負荷AI、エラー予測AI、学習スタイルAI、言語関連AI、文脈AI）の修正
- 出題順序・優先度の調整
- 学習アルゴリズムの改善

---

## 🚨 Critical: このシステムは最重要

**QuestionScheduler + GamificationAI は過去5日間同じ失敗を繰り返した箇所です。**

必ず以下を完了してから修正を開始すること。

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. メタAI優先確認ガイド ⭐ 最優先

📄 **[meta-ai-priority.instructions.md](../meta-ai-priority.instructions.md)**

**出題不具合のキーワードを報告された場合、必ずここから確認**:
- 「復習単語が出題されない」
- 「まだまだ・分からないが出てこない」
- 「スキップばかり出題される」
- 「正解した問題ばかり出る」
- 「間違えた問題が出題されない」
- 「出題順序がおかしい」
- 「優先度が機能していない」
- 「インターリーブがおかしい」

**確認内容**:
- QuestionScheduler.schedule() の動作
- GamificationAI.interleaveByCategory() の動作
- Position管理システム
- デバッグログの確認方法

---

### 2. バッチ方式の3原則 ⭐ Critical

📄 **[batch-system-enforcement.instructions.md](../batch-system-enforcement.instructions.md)**

**不変条件（絶対に守ること）**:
1. バッチが確定すると語句の出題順は決して変更されません
2. バッチが完全に消化されるまで、再計算や再スケジューリングは行いません
3. バッチが完全に消化された後、次のバッチを生成します

**禁止事項**:
- ❌ バッチ確定後に `questions.sort()` / `questions.splice()` / `questions.push()` 等
- ❌ `clearExpiredFlags()` の実行（useCategorySlots=true時）
- ❌ 再スケジューリング（useCategorySlots=true時）

---

### 3. Position階層の不変条件 ⭐ Critical

📄 **[position-hierarchy-enforcement.instructions.md](../position-hierarchy-enforcement.instructions.md)**

**Position階層（0-100）**:
```
70-100: incorrect（分からない）  ← 第1優先
60-69:  still_learning (boosted)  ← 第2優先（まだまだ語引き上げ後）
40-59:  new (boosted)             ← 第3優先（新規語引き上げ後）
20-39:  new (normal)              ← 第4優先
0-19:   mastered（定着済）         ← 第5優先
```

**「あっちを立てればこっちが立たず」を防ぐ制約**:
- まだまだ語ブースト: Position 40-69 → **60-69**（絶対に60未満にしない）
- 新規語ブースト: Position 30-39 → **40-59**（絶対に60以上にしない）
- Position階層の逆転禁止（新規 > まだまだは構造的矛盾）

---

### 4. カテゴリースロット方式 ⭐ Critical

📄 **[category-slots-enforcement.instructions.md](../category-slots-enforcement.instructions.md)**

**useCategorySlots=true時の特別ルール**:
- Position降順ソート後、カテゴリー別に枠を確保
- バッチ確定後は順序固定（Position再計算なし）
- clearExpiredFlags / 再スケジューリング 禁止

---

### 5. 学習AI保護ガイド

📄 **[learning-ai-protection.instructions.md](../learning-ai-protection.instructions.md)**

**7つの専門AI + 1つのメタAI**:
1. 記憶AI（memoryAcquisitionAlgorithm.ts）
2. 認知負荷AI（cognitiveLoadAI.ts）
3. エラー予測AI（errorPredictionAI.ts）
4. 学習スタイルAI（learningStyleAI.ts）
5. 言語関連AI（linguisticRelationsAI.ts）
6. 文脈AI（contextualLearningAI.ts）
7. ゲーミフィケーションAI（gamificationAI.ts）
8. メタAI統合層（QuestionScheduler）

**誤った表記**:
- ❌ 「14AI」（誤り）
- ✅ 「8個のAIシステム」（正しい）

---

## 🔍 トラブルシューティングフロー

```
出題不具合報告
    ↓
1. meta-ai-priority.instructions.md を読む
    ↓
2. デバッグログ確認（ブラウザコンソール）
    ├─ [QuestionScheduler] Position統計
    ├─ [GamificationAI] インターリーブ
    ├─ [振動防止] 除外単語
    └─ [vibrationScore]
    ↓
3. QuestionScheduler.ts の動作確認
    ├─ schedule(): 全体オーケストレーション
    ├─ sortAndBalance(): Position降順ソート
    └─ vibrationPreventionFilter(): 振動防止
    ↓
4. GamificationAI.ts のインターリーブ確認
    ├─ adjustPositionForInterleaving(): 新規語引き上げ (+15)
    ├─ boostStillLearningQuestions(): まだまだ語ブースト (+5～+10、上限69)
    └─ interleaveByCategory(): 苦手語と新規語の交互配置
    ↓
5. Position管理確認（progressStorage.ts）
    ↓
6. 型定義の整合性確認（types.ts）
    ↓
7. 修正実装
    ↓
8. デバッグログで動作確認
    ↓
9. ユーザーに確認依頼
```

---

## 🧪 AI修正後の必須確認

### 1. デバッグログ出力確認

ブラウザコンソールで以下のログが出ているか:
- `[QuestionScheduler] Position統計`
- `[GamificationAI] カテゴリ別インターリーブ`
- `✅ [GamificationAI] インターリーブ完了`
- `[振動防止] 除外単語`
- `[vibrationScore]`

### 2. ユニットテスト

```bash
# Position階層テスト
npm run test:unit:fast -- tests/unit/ai/scheduler/QuestionScheduler.positionHierarchy.test.ts

# カテゴリースロットテスト
npm run test:unit:fast -- tests/unit/ai/scheduler/QuestionScheduler.categorySlots.test.ts

# バッチ方式テスト（該当する場合）
npm run test:unit:fast -- tests/unit/ai/scheduler/QuestionScheduler.priority.test.ts
```

### 3. 実機確認

- 暗記タブで出題順序を確認
- まだまだ・分からない語が優先的に出題されるか
- 新規語が適度に混ざるか（インターリーブ）
- 振動（2語連続出題）が発生しないか

---

## 🚫 よくある間違い（過去の失敗パターン）

### ❌ 避けるべき修正

1. **QuestionSchedulerを経由せずに直接ソート処理を実装**
   - 理由: 7AIのシグナル統合が無効になる
   
2. **Positionフィールドを無視した優先度計算**
   - 理由: Position階層の不変条件違反

3. **GamificationAIのインターリーブ機能を無視**
   - 理由: 苦手語と新規語の交互配置が崩れる

4. **デバッグログを削除する**
   - 理由: トラブルシューティング不可能になる

5. **「14AI」という誤った表記を使用**
   - 正しい表記: 「8個のAIシステム」または「7つの専門AI + 1つのメタAI」

6. **「category優先」という古い用語を使用**
   - 正しい表記: 「Position降順ソート + インターリーブ」

---

## 📚 関連 Individual Instructions 一覧

- [meta-ai-priority.instructions.md](../meta-ai-priority.instructions.md) ⭐ 最優先
- [batch-system-enforcement.instructions.md](../batch-system-enforcement.instructions.md) ⭐ Critical
- [position-hierarchy-enforcement.instructions.md](../position-hierarchy-enforcement.instructions.md) ⭐ Critical
- [category-slots-enforcement.instructions.md](../category-slots-enforcement.instructions.md) ⭐ Critical
- [learning-ai-protection.instructions.md](../learning-ai-protection.instructions.md)
- [ai-terminology.instructions.md](../ai-terminology.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
