---
description: バグ修正・トラブルシューティング時のカテゴリ索引
category: bug-fix
---

# 📂 Category: Bug Fix & Troubleshooting

## 🎯 このカテゴリの対象

- エラー・バグの修正
- 不具合のトラブルシューティング
- 症状的修正の回避
- 根本原因の特定

---

## 🚨 Critical: 症状的修正を避ける

**「動いたから良し」ではなく、根本原因を特定してから修正すること。**

---

## 🌳 判断が必要な場合: Decision Tree

**バグ修正の判断に迷ったら、Decision Treeから開始してください**:

📄 **[Bug Fix Decision Tree](../decision-trees/bug-fix-decision.instructions.md)**

このDecision Treeが自動的に:
- バグの分類（型エラー/ロジックエラー/UI/データ）
- 修正優先度の判定（P0/P1/P2）
- 修正手順の提示
- 関連Individual Instructionsへの誘導

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. 症状的修正禁止 ⭐ 最優先

📄 **[no-symptomatic-fixes.instructions.md](../no-symptomatic-fixes.instructions.md)**

**症状的修正の例**:
- エラーが出たので try-catch で握りつぶす
- undefined になるので `|| ''` を追加
- タイミングで動かないので `setTimeout` を追加

**正しいアプローチ**:
1. 根本原因を特定
2. 原因を解消する修正
3. 再発防止のテスト追加

---

### 2. 修正の修正禁止

📄 **[no-fix-on-fix.instructions.md](../no-fix-on-fix.instructions.md)**

**修正が失敗した場合**:
1. 一旦修正を revert
2. 原因を再分析
3. 正しいアプローチで再修正

**禁止**:
- ❌ 失敗した修正の上に修正を重ねる
- ❌ 「とりあえず動く」修正を積み上げる

---

### 3. AI・出題システムのトラブルシューティング

📄 **[meta-ai-priority.instructions.md](../meta-ai-priority.instructions.md)**

**出題不具合のキーワード**:
- 「復習単語が出題されない」
- 「まだまだ・分からないが出てこない」
- 「スキップばかり出題される」
- 「正解した問題ばかり出る」
- 「間違えた問題が出題されない」
- 「出題順序がおかしい」

**トラブルシューティング手順**:
1. デバッグログ確認（ブラウザコンソール）
2. QuestionScheduler.ts の動作確認
3. GamificationAI.ts のインターリーブ確認
4. progressStorage.ts のPosition管理確認
5. 型定義の整合性確認

---

### 4. 修正前の自動ガード

📄 **[ai-failure-prevention.instructions.md](../ai-failure-prevention.instructions.md)**

**過去の類似失敗パターンを確認**:
```bash
node scripts/ai-guard-check.mjs "<バグの症状>" [関連ファイル]
```

---

## 🔍 バグ修正フロー（推奨）

```
1. 症状の記録
   - エラーメッセージ
   - 再現手順
   - 期待する動作
   ↓
2. デバッグログ確認
   - コンソールログ
   - ネットワークログ
   - ストレージ内容
   ↓
3. 根本原因の特定
   - 症状的修正を避ける
   - no-symptomatic-fixes.instructions.md を読む
   ↓
4. 関連仕様の確認
   - 該当システムの Individual Instructions を読む
   - AI関連なら meta-ai-priority.instructions.md
   ↓
5. 修正実装
   - 根本原因を解消
   - 症状的修正にならないよう注意
   ↓
6. テスト追加
   - 再発防止のテスト
   - 回帰テスト
   ↓
7. 動作確認
   - 修正が意図通りか
   - 副作用がないか
   ↓
8. レビュー
   - 症状的修正になっていないか再確認
```

---

## 🧪 バグ修正後の必須確認

### 1. 再現確認

- バグが再現しなくなったか
- 元の症状が完全に解消されたか

### 2. 副作用確認

```bash
# 関連テストをすべて実行
npm run test:unit:fast

# 型チェック
npm run typecheck

# Lint
npm run lint:errors-only
```

### 3. デバッグログ確認

- 正常なログが出力されているか
- エラーログが消えているか

---

## 🚫 禁止事項（Critical）

- ❌ エラーを握りつぶす（try-catch で無視）
- ❌ undefined に対して `|| ''` を無思慮に追加
- ❌ タイミング問題を `setTimeout` で回避
- ❌ 根本原因を特定せずに修正
- ❌ 修正が失敗したら修正を重ねる
- ❌ 「とりあえず動く」で満足

---

## 📚 関連 Individual Instructions 一覧

- [no-symptomatic-fixes.instructions.md](../no-symptomatic-fixes.instructions.md) ⭐ 最優先
- [no-fix-on-fix.instructions.md](../no-fix-on-fix.instructions.md) ⭐ Critical
- [meta-ai-priority.instructions.md](../meta-ai-priority.instructions.md)
- [ai-failure-prevention.instructions.md](../ai-failure-prevention.instructions.md)
- [error-zero-policy.instructions.md](../error-zero-policy.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
