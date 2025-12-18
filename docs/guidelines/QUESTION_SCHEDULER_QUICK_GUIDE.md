---
canonical: docs/guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md
status: stable
lastUpdated: 2025-12-19
diataxisCategory: how-to
references:
  - .aitk/instructions/meta-ai-priority.instructions.md
  - tests/simulation/README.md
  - docs/guidelines/META_AI_TROUBLESHOOTING.md
  - docs/specifications/QUESTION_SCHEDULER_SPEC.md
  - docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md
doNotMove: true
---

# 出題機能トラブルシューティングクイックガイド

**対象**: 開発者・AIアシスタント  
**目的**: 出題不具合を最速で解決するための1ページガイド

---

## 🚨 出題不具合が報告されたら

### **STEP 1: デバッグログを確認（30秒）**

ブラウザのコンソール（F12）で以下を確認：

```
[Category Repair] 修復された単語数: X
→ ない場合: loadProgress()が実行されていない

[QuestionScheduler] カテゴリー統計:
  incorrect: 0        ← ⚠️ 問題: category更新が機能していない
  still_learning: 0   ← ⚠️ 問題: 同上
→ 両方0の場合: updateWordProgress()のLine 1097-1117を確認

[確実性保証] 強制カテゴリー優先配置:
  incorrect優先: 0問  ← ⚠️ 問題: categoryがnull
→ 0問の場合: category管理システム全体を確認
```

---

### **STEP 2: 問題パターンを特定（1分）**

| 症状 | 原因 | 確認ファイル |
|------|------|------------|
| 復習単語が出題されない | category更新が機能していない | progressStorage.ts Line 1097-1117 |
| 優先度が機能していない | DTA閾値が誤っている | QuestionScheduler.ts Line 304-327 |
| シグナルが検出されない | detectSignals()がダミー実装 | QuestionScheduler.ts Line 194-267 |
| 無限ループが発生 | useEffect依存配列が誤っている | SpellingView.tsx Line 270 |
| undefined エラー | scheduledQuestionsではなくquestionsを参照 | 4タブ全て確認 |

---

### **STEP 3: 最優先確認ファイル（3分）**

#### 1. QuestionScheduler.ts（最重要）
```typescript
// Line 194-267: detectSignals() - 空配列でないか確認
// Line 304-327: DTA計算 - 閾値が正しいか確認
// Line 534-600: sortAndBalance() - 確実性保証が実装されているか確認
```

#### 2. progressStorage.ts（最重要）
```typescript
// Line 631: initializeWordProgress() - category: 'new'があるか確認
// Line 1097-1117: updateWordProgress() - category更新ロジックがあるか確認
// Line 131-151: loadProgress() - 修復処理があるか確認
```

#### 3. types.ts（型定義）
```typescript
// WordProgress.category フィールドが存在するか
// ScheduleResult.scheduledQuestions が正しく定義されているか
```

---

### **STEP 4: よくある間違いトップ5**

| 順位 | 間違い | 正解 |
|------|--------|------|
| 1位 | scheduleResult.questions | scheduleResult.scheduledQuestions ✅ |
| 2位 | categoryフィールドがない | categoryフィールド必須 ✅ |
| 3位 | detectSignals()が空配列 | 4種類のシグナル実装 ✅ |
| 4位 | useEffect依存配列にresetStats | 依存配列から削除 ✅ |
| 5位 | 「14AI」と表記 | 「メタAI統合」と表記 ✅ |

---

## 🔍 30秒チェックリスト

修正前に以下を確認：
- [ ] デバッグログでカテゴリー統計を確認した
- [ ] QuestionScheduler.tsのLine 534-600（確実性保証）を確認した
- [ ] progressStorage.tsのLine 1097-1117（category更新）を確認した
- [ ] types.tsでWordProgress.categoryが定義されているか確認した
- [ ] 4タブ全てでscheduledQuestionsを使用しているか確認した

修正後に以下を確認：
- [ ] デバッグログで動作を確認した
- [ ] ブラウザリロードで復習単語が出題されることを確認した
- [ ] 無限ループやエラーが発生していないか確認した

---

## 📞 緊急連絡先

### ドキュメント
- **トラブルシューティング**: `docs/guidelines/META_AI_TROUBLESHOOTING.md`
- **詳細仕様**: `docs/specifications/QUESTION_SCHEDULER_SPEC.md`
- **品質保証**: `docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md`
- **AI指示書**: `.aitk/instructions/meta-ai-priority.instructions.md`

### 重要な行番号
- QuestionScheduler.ts: Line 194-267, 304-327, 534-600
- progressStorage.ts: Line 131-151, 631, 1097-1117
- types.ts: WordProgress interface

---

## 💡 1行アドバイス

**「出題がおかしい」と言われたら、まずデバッグログで`incorrect: 0, still_learning: 0`を確認し、categoryが更新されていないことを疑う。**

---

**このクイックガイドで5分以内に問題を特定し、10分以内に修正できるはずです。**
