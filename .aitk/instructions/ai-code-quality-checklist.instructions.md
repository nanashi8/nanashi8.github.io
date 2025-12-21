---
description: AI実装時の品質保証チェックリスト - 型安全性・リファクタリング・テストの必須確認項目
applyTo: '**/*.{ts,tsx,js,jsx}'
---

# AI実装時の品質保証チェックリスト

## 🎯 目的

このチェックリストは、AI（Copilot/Claude）がコード変更を行う際の**必須確認項目**です。
最近の失敗パターン（2025年12月）を分析し、再発防止のための具体的な手順を定義します。

---

## ❌ 最近の失敗パターン分析

### 事例1: カテゴリー判定の統一化失敗（2025-12-20）

**失敗内容**:
- カテゴリー判定を3箇所から1箇所に統一化
- 誤ったプロパティ名を使用（推測で実装）
  - 誤：`correctCount`, `incorrectCount`, `consecutiveCorrect`
  - 正：`memorizationCorrect`, `memorizationStillLearning`, `memorizationStreak`
- 24テスト失敗を引き起こす

**根本原因**:
1. ✗ 型定義ファイルを確認せずに推測で実装
2. ✗ 元のコードのロジックを十分に確認しなかった
3. ✗ TypeScriptの型チェックを実行しなかった
4. ✗ テストを実行する前に型エラーを検出しなかった
5. ✗ WordProgressの複数モード（暗記専用、汎用）を理解していなかった

**学習ポイント**:
- プロパティ名は**必ず型定義から確認**
- リファクタリング時は**元のコードを完全コピー**
- 実装前に`npm run type-check`を実行
- モード別プロパティの命名規則を理解

---

## ✅ 必須チェックリスト

### Phase 1: 実装前の準備（BEFORE CODING）

#### 1.1 型定義の確認（CRITICAL）

```typescript
// ❌ 悪い例：推測で実装
const correct = progress.correctCount || 0; // プロパティ名が誤り

// ✅ 良い例：型定義を確認してから実装
// 1. src/storage/progress/types.ts を開く
// 2. WordProgress interface を確認
// 3. 正しいプロパティ名をコピー
const correct = progress.memorizationCorrect || 0;
```

**確認手順**:
1. 対象の型定義ファイルを`read_file`で確認
2. プロパティ名を**完全一致**でコピー
3. オプショナル（`?`）かどうかを確認
4. デフォルト値の必要性を判断

**適用ファイル**:
- `src/storage/progress/types.ts` - WordProgress, QuizProgress
- `src/types/question.ts` - Question関連
- `src/ai/types/` - AI関連の型

#### 1.2 既存コードの完全確認（CRITICAL）

**リファクタリング時の必須手順**:

```bash
# ステップ1: git履歴から元のロジックを取得
git show HEAD:src/path/to/file.ts | grep -A 50 "function名"

# ステップ2: 元のロジックを完全コピーして新ファイルに貼り付け
# ステップ3: プロパティ名・変数名を一つずつ確認
# ステップ4: ロジックの差異を絶対に作らない
```

**禁止事項**:
- ❌ 記憶や推測で再実装
- ❌ 「似たような」ロジックで代用
- ❌ プロパティ名の「置き換え」
- ❌ ロジックの「簡略化」や「改善」

**必須事項**:
- ✅ 元のコードを**完全にコピー**
- ✅ 一文字一句変更しない
- ✅ コメントも含めて移植
- ✅ 空白・インデントも維持

#### 1.3 命名規則の理解（HIGH）

**WordProgressのモード別プロパティ**:

```typescript
// 暗記モード専用（memorizationXxx）
memorizationAttempts: number;      // 暗記モード総試行回数
memorizationCorrect: number;       // 暗記モード正解回数
memorizationStillLearning: number; // 「まだまだ」回数
memorizationStreak: number;        // 暗記モード連続正解数

// 汎用プロパティ（将来的に削除予定）
correctCount?: number;             // 旧：正解回数（使用非推奨）
incorrectCount?: number;           // 旧：不正解回数（使用非推奨）
consecutiveCorrect?: number;       // 旧：連続正解（使用非推奨）
```

**使い分けルール**:
- 暗記タブ: `memorizationXxx` を使用
- 和訳タブ: 将来的に `translationXxx` を使用
- スペルタブ: 将来的に `spellingXxx` を使用
- 汎用プロパティは**使用しない**

---

### Phase 2: 実装中のチェック（DURING CODING）

#### 2.1 型チェックの実行（CRITICAL）

**実装後すぐに実行**:

```bash
# TypeScriptコンパイルチェック
npm run type-check

# または
npx tsc --noEmit
```

**エラー発見時の対応**:
1. エラーメッセージを**完全に読む**
2. 型定義ファイルで正しいプロパティを確認
3. エラー箇所を修正
4. 再度`type-check`を実行

#### 2.2 ESLintの実行（HIGH）

```bash
# リント実行
npm run lint

# 自動修正
npm run lint:fix
```

#### 2.3 コード差分の確認（MEDIUM）

```bash
# 変更内容を確認
git diff src/path/to/file.ts

# 変更行数を確認（大量の変更は注意）
git diff --stat
```

**警告サイン**:
- 変更行数が100行を超える → 段階的に分割
- 複数ファイルにまたがる → 影響範囲を確認
- ロジックの大幅な書き換え → 元のコードを再確認

---

### Phase 3: 実装後のテスト（AFTER CODING）

#### 3.1 ユニットテストの実行（CRITICAL）

```bash
# 変更したファイルのテストを実行
npm run test:unit -- src/path/to/file

# 全ユニットテストを実行
npm run test:unit
```

**期待結果**:
- ✅ 既存テストがすべて成功
- ✅ 新規追加した機能のテストを追加
- ❌ テスト失敗時は**即座に修正**

#### 3.2 統合テストの実行（HIGH）

```bash
# Phase 1統合テスト
npm run test:integration

# 暗記タブのテスト
npm run test -- tests/memorization.spec.ts
```

**失敗時の対応**:
1. テストエラーメッセージを読む
2. 期待値と実際の値を比較
3. ロジックの誤りを特定
4. 元のコードと比較

#### 3.3 型カバレッジの確認（MEDIUM）

```bash
# 型カバレッジレポート生成
npm run type-coverage

# 結果を確認
cat coverage/type-coverage.json
```

**目標値**:
- 型カバレッジ: 95%以上
- any型の使用: 0箇所（特別な理由がない限り）

---

## 🔍 セルフレビューチェックリスト

実装完了後、以下をすべて確認してからコミット：

### コード品質

- [ ] TypeScriptの型チェックが成功（`npm run type-check`）
- [ ] ESLintエラーがゼロ（`npm run lint`）
- [ ] ユニットテストがすべて成功
- [ ] 統合テストがすべて成功

### 型安全性

- [ ] プロパティ名を型定義から確認した
- [ ] オプショナルプロパティに`|| 0`や`|| ''`を使用した
- [ ] any型を使用していない
- [ ] 型アサーション（`as`）を最小限に抑えた

### リファクタリング品質

- [ ] 元のコードを完全にコピーした
- [ ] ロジックを一切変更していない
- [ ] プロパティ名を正確に移植した
- [ ] 「まだまだ」の扱いを維持した（0.5点計算）

### テストカバレッジ

- [ ] 新規追加した関数のテストを追加した
- [ ] エッジケースのテストを追加した
- [ ] 既存テストが壊れていない

### ドキュメント

- [ ] 関数にJSDocコメントを追加した
- [ ] 複雑なロジックにコメントを追加した
- [ ] READMEやドキュメントを更新した

---

## 🚨 緊急時の対応手順

### テストが大量に失敗した場合

**Step 1: 影響範囲の特定**

```bash
# 失敗したテストの数を確認
npm run test:unit 2>&1 | grep "failed"

# 失敗したテストのファイルを確認
npm run test:unit -- --reporter=verbose
```

**Step 2: ロールバック判断**

失敗テストが**10個以上**の場合:
1. 即座にgit revert
2. 問題を小さく分割
3. 段階的に再実装

失敗テストが**5個以下**の場合:
1. エラーメッセージを分析
2. 型定義を再確認
3. 元のコードと比較

**Step 3: 原因の特定**

```bash
# 変更前のコードを確認
git show HEAD~1:src/path/to/file.ts

# 変更内容を確認
git diff HEAD~1 src/path/to/file.ts
```

---

## 📚 参考ドキュメント

### 型定義

- src/storage/progress/types.ts - 進捗データの型
- src/types/ - 各種データ型定義
- src/ai/ - AI関連の型と実装

### テスト

- tests/ - テストファイル群
- tests/phase1-integration-test.spec.ts - Phase 1統合テスト

### ガイドライン

- プロジェクトルートの docs/guidelines/ を参照
- プロジェクトルートの docs/specifications/ を参照

---

## 🎓 学習リソース

### 失敗事例から学ぶ

過去の失敗を分析し、同じ間違いを繰り返さない：

1. **カテゴリー判定の失敗（2025-12-20）**
   - 教訓：型定義を必ず確認
   - 教訓：元のコードを完全コピー
   - 教訓：テスト実行前に型チェック

2. **プロパティ名の推測（頻発）**
   - 教訓：推測禁止、必ず型定義から確認
   - 教訓：オートコンプリートを活用
   - 教訓：grep検索で使用箇所を確認

3. **ロジックの「改善」（頻発）**
   - 教訓：リファクタリング ≠ ロジック変更
   - 教訓：動作を維持したまま構造だけ変更
   - 教訓：「まだまだ」の扱いは特に注意

---

## 🤖 AI（Copilot/Claude）への指示

このチェックリストを**必ず守る**こと：

1. **型定義を確認せずに実装しない**
2. **元のコードを完全コピーする**
3. **テスト実行前に型チェックする**
4. **推測で実装しない**
5. **ロジックを勝手に変更しない**

これらを守らない場合、必ず失敗する。
