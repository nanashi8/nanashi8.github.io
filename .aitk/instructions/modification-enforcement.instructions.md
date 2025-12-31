---
description: 【最優先】コード修正前の強制確認プロセス - すべての修正で必須
applyTo: '**/*.{ts,tsx,js,jsx}'
---

# 🚨 コード修正前の強制確認プロセス【最優先】

## ⛔ 絶対ルール

**いかなるコード修正も、このプロセスを経ずに実行してはならない**

---

## 📋 修正前の強制チェックリスト（必須）

### Phase 1: 仕様書の確認【必須】

```markdown
□ Step 1: 関連する instructions ファイルをすべて読んだ
  - batch-system-enforcement.instructions.md
  - position-hierarchy-enforcement.instructions.md
  - category-slots-enforcement.instructions.md
  - specification-enforcement.instructions.md
  - （該当する他のinstructions）

□ Step 2: 既存コードのコメントを確認した
  - 「調整済み」「最適化済み」等のコメント
  - 設定値の理由コメント
  - TODO/FIXME コメント

□ Step 3: 関連ドキュメントを確認した
  - README.md
  - CHANGELOG.md
  - docs/ 配下の仕様書
```

### Phase 2: ユーザー意図の確認【必須】

```markdown
□ ユーザーは明示的に修正を指示したか？
  - 「〜を変更してください」等の直接的指示
  - 「〜が問題です」等の間接的な要求

□ ユーザーの真の意図は何か？
  - 質問だけで修正を求めていない可能性
  - 情報提供だけで実装を求めていない可能性
  - 提案を求めているが実装は保留の可能性

□ 修正の範囲は明確か？
  - どのファイルを修正すべきか
  - どの設定値を変更すべきか
  - どこまで影響が及ぶか
```

### Phase 3: 影響範囲の分析【必須】

```markdown
□ 修正は以下の設計原則に影響するか？
  - [ ] バッチ方式の3原則
  - [ ] Position階層の不変条件
  - [ ] カテゴリースロット方式
  - [ ] 振動防止機構
  - [ ] 再出題差し込み制御
  - [ ] DTA（直近語ペナルティ）
  - [ ] いもづる式学習
  - [ ] A/Bテスト設定

□ 修正は以下のコンポーネントに影響するか？
  - [ ] QuestionScheduler
  - [ ] MemorizationView
  - [ ] GamificationAI
  - [ ] PositionCalculator
  - [ ] DynamicThresholdAdjuster

□ 修正は以下のデータに影響するか？
  - [ ] questions 配列
  - [ ] wordProgress（進捗データ）
  - [ ] sessionStats（統計）
  - [ ] localStorage 保存データ
```

### Phase 4: リスク評価【必須】

```markdown
□ 副作用のリスク
  - [ ] 無限ループの可能性
  - [ ] 状態更新の連鎖
  - [ ] useEffect の予期しない再実行
  - [ ] 配列の意図しない変更

□ 後方互換性のリスク
  - [ ] 既存の進捗データが壊れる
  - [ ] 既存の設定が無効化される
  - [ ] 既存のテストが失敗する

□ パフォーマンスのリスク
  - [ ] レンダリング回数の増加
  - [ ] メモリ使用量の増加
  - [ ] 処理時間の増加
```

---

## 🚦 判断フロー

### Case A: ユーザーが明示的に修正を指示【実装OK】

```
✅ 条件
- ユーザーが「〜を変更してください」と明示
- 影響範囲が限定的
- リスクが低い

→ 実装を進める（Phase 5へ）
```

### Case B: 影響が設計原則に及ぶ【ユーザー承認必須】

```
⚠️ 条件
- バッチ方式・Position階層等の原則に影響
- 振動防止機構に影響
- 既存の動作が大きく変わる

→ ユーザーに提案して承認を得る（Phase 5へ）
```

### Case C: ユーザー意図が不明確【質問必須】

```
❌ 条件
- ユーザーが質問しているだけ
- 修正を求めているか不明
- 範囲が曖昧

→ ユーザーに質問して明確化する
```

---

## 🛠️ Phase 5: 提案作成【Case B の場合】

### 提案フォーマット

```markdown
# 修正提案

## 📌 現在の問題
（ユーザーが報告した問題）
- 例: 「振動が続いています」
- 例: 「inserted=18回も発生」

## 🔍 原因分析
（調査で判明した根本原因）
- 例: バッチ途中で clearExpiredFlags が配列を再生成している
- 例: 依存配列に questions が含まれていない

## 💡 修正案
（具体的な修正内容）
- 例: useCategorySlots=true の時は clearExpiredFlags をスキップ
- 例: needsBatchRegeneration フラグを追加

## 📊 影響範囲
（どの原則・機能に影響するか）
- バッチ方式: ✅ 原則を強化
- Position階層: 影響なし
- 振動防止: ✅ 改善

## ⚠️ リスク
（予想される副作用）
- リスク1: ...
- リスク2: ...
- 対策: ...

## ✅ テスト計画
（確認方法）
- ユニットテスト: ...
- 実機テスト: ...
- 確認項目: ...

## 🙋 ユーザー承認待ち
この修正案で問題ないでしょうか？
```

### ユーザーへの質問例

```
提案:
現在、バッチ途中で配列が変更されているため、振動が発生しています。
useCategorySlots=true の時は clearExpiredFlags をスキップする修正を提案します。

この修正は「バッチ確定後は配列を変更しない」という原則を強化します。
既存の動作に影響はありませんが、バッチ方式の安定性が向上します。

この修正案で進めてよろしいでしょうか？
```

---

## 🚀 Phase 6: 実装【承認後のみ】

### 実装時の必須ルール

```typescript
// ✅ 1. 最小限の修正
// 既存コードを可能な限り維持し、必要な部分だけ修正

// ✅ 2. 既存の原則を守る
// バッチ方式・Position階層等の原則に従う

// ✅ 3. コメントを残す
// 修正理由と日付をコメントで記録
// 例: // 2025-12-30: バッチ方式強化のため追加（ユーザー承認済み）

// ✅ 4. 実行時検証を追加
if (import.meta.env.DEV) {
  // アサーションで不正な状態を検出
  if (violatesRule) {
    throw new Error('ルール違反を検出');
  }
}

// ✅ 5. ログを残す
console.log('🔄 [バッチ方式] 修正内容の説明');
```

---

## 🧪 Phase 7: テスト【必須】

### テストチェックリスト

```markdown
□ 型エラーなし
  - `get_errors` ツールで確認

□ ユニットテストパス
  - 関連するテストを実行
  - 新しいテストを追加（必要に応じて）

□ 実機テスト
  - 開発サーバーで動作確認
  - コンソールログで動作追跡
  - デバッグパネルで統計確認

□ 副作用の確認
  - 無限ループが発生していない
  - コンソールエラーが出ていない
  - パフォーマンスが劣化していない
```

---

## 📝 Phase 8: 記録【必須】

### 修正履歴の記録

```markdown
# 修正内容を記録する

## ファイル
- batch-system-enforcement.instructions.md に追記
- または CHANGELOG.md に記録

## 記録内容
- 日付
- 問題
- 原因
- 修正内容
- ユーザー承認の有無
- テスト結果
```

---

## ⚡ 緊急時の例外処理

### 緊急修正が必要な場合

```
🚨 条件
- ユーザーが「今すぐ修正してください」と明示
- 本番環境で重大な問題が発生
- セキュリティ上の緊急対応

→ Phase 1, 2, 3 を高速で実行し、実装を優先
→ ただし、事後にユーザーに報告し承認を得る
```

---

## 🎯 違反時の対応

### AI が本プロセスを違反した場合

```
1. 即座に修正を停止
2. ユーザーに謝罪
3. 本プロセスを最初から実行
4. 適切な提案を作成
```

### ユーザーが違反を指摘した場合

```
1. 即座に謝罪
2. 問題を認識
3. 適切な提案を作成
4. ユーザー承認を得る
5. 再実装
```

---

## 📚 関連ドキュメント

### 必読 Instructions

1. **batch-system-enforcement.instructions.md**
   - バッチ方式の3原則
   - 修正禁止事項

2. **position-hierarchy-enforcement.instructions.md**
   - Position階層の不変条件
   - ブースト範囲の制約

3. **category-slots-enforcement.instructions.md**
   - カテゴリースロット方式
   - 5段階パイプライン

4. **specification-enforcement.instructions.md**
   - 仕様書遵守ルール
   - 変更禁止の判断基準

### 補助 Instructions

- learning-ai-protection.instructions.md
- refactoring-safety.instructions.md
- no-fix-on-fix.instructions.md
- no-symptomatic-fixes.instructions.md

---

## 🎓 学習用チェックリスト

### 新しいAIアシスタントへ

```markdown
本システムで作業する前に、必ず以下を確認してください：

□ batch-system-enforcement.instructions.md を読んだ
□ position-hierarchy-enforcement.instructions.md を読んだ
□ category-slots-enforcement.instructions.md を読んだ
□ specification-enforcement.instructions.md を読んだ
□ 本ファイル（modification-enforcement.instructions.md）を理解した

□ バッチ方式の3原則を暗記した
  1. バッチ確定後は配列を一切変更しない
  2. バッチ完全消化まで再計算なし
  3. バッチ完全消化後に次バッチを生成

□ Position階層の5段階を暗記した
  1. incorrect (70-100)
  2. still_learning (60-69)
  3. new ブースト後 (40-59)
  4. new 通常 (20-39)
  5. mastered (0-19)

□ 修正前の強制チェックリストを理解した
  1. 仕様書確認
  2. ユーザー意図確認
  3. 影響範囲分析
  4. リスク評価
  5. 提案作成（必要時）
  6. 実装
  7. テスト
  8. 記録
```

---

## 🔐 このファイル自体の変更ルール

**本ファイル（modification-enforcement.instructions.md）を変更する場合も、同じプロセスを適用してください：**

1. なぜ変更が必要か？
2. どの部分を変更するか？
3. 他の instructions への影響は？
4. ユーザー承認を得たか？

---

## ✅ まとめ

### 修正前に必ずやること

1. **仕様書を読む**
2. **ユーザー意図を確認する**
3. **影響範囲を分析する**
4. **リスクを評価する**

### 判断基準

- ✅ ユーザー明示指示 → 実装OK
- ⚠️ 設計原則に影響 → ユーザー承認必須
- ❌ 意図不明 → 質問必須

### 実装時に必ずやること

1. **最小限の修正**
2. **原則を守る**
3. **コメントを残す**
4. **検証を追加**
5. **ログを残す**

### 実装後に必ずやること

1. **型エラー確認**
2. **テスト実行**
3. **実機確認**
4. **記録を残す**
