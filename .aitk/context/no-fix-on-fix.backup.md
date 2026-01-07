---
description: 修正の修正を絶対に行わない強制装置
applyTo: '**/*'
---

# 🚫 修正の修正禁止ポリシー - 強制装置

> **CRITICAL ENFORCEMENT**: このルールに違反するコミットは自動リジェクトされます

## 📜 絶対原則

### 原則1: 修正は1回で完結させる

```
❌ 禁止パターン:
1. 機能Aを修正
2. 機能Aの修正が不完全だったので再修正
3. 機能Aの再修正でバグ発生
4. 機能Aの再々修正...

✅ 正しいパターン:
1. 機能Aの問題を完全に分析
2. 根本原因を特定
3. 包括的な修正を1回で実施
4. 完了
```

### 原則2: 対症療法を一切行わない

- **根本原因を特定せずに表面的な修正を行わない**
- **同じ問題に2回目の修正を行う場合は設計エラー**
- **修正の影響範囲を事前に完全に把握する**

## 🔒 強制メカニズム

### レベル1: コード実装前の必須チェック

修正を開始する前に以下を**必ず**確認：

```markdown
## 修正前チェックリスト

- [ ] 根本原因を特定したか？
- [ ] 同じ問題に過去修正した履歴はないか？
- [ ] 影響範囲を完全に洗い出したか？
- [ ] 関連する全ファイルをリストアップしたか？
- [ ] テストケースを準備したか？
- [ ] ドキュメントを更新する必要があるか？
- [ ] この修正で他の箇所が壊れないか？
```

### レベル2: 実装中の強制ルール

#### ルール2.1: 既存修正の検出

修正対象のコードに以下のパターンが含まれる場合は**即座に停止**：

```typescript
// ❌ 危険信号
// TODO: fix this later
// FIXME: temporary workaround
// HACK: quick fix
// XXX: needs refactoring

// ❌ 複数回の修正の痕跡
// Fix #123
// Fix #123 again
// Fix #123 final

// ❌ 条件分岐の積み重ね
if (specialCase1) { /* ... */ }
else if (specialCase2) { /* ... */ }
else if (specialCase3) { /* ... */ }
// これは対症療法の集積
```

#### ルール2.2: 型の不整合検出

```typescript
// ❌ 型の不整合は設計エラー
function oldFunction(): string { /* ... */ }
function newFunction(): number { /* ... */ }

// 両方を使う場所で型変換が必要な場合は設計が間違っている
const result1: string = oldFunction();
const result2: number = newFunction();
```

### レベル3: コミット前の自動検証

#### Git Hookによる強制

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 修正の修正パターンを検出
if git diff --cached | grep -E "(Fix.*again|Re-fix|修正の修正)"; then
  echo "❌ ERROR: 修正の修正が検出されました"
  echo "根本原因を特定してから再度コミットしてください"
  exit 1
fi

# 対症療法キーワードを検出
if git diff --cached | grep -E "(TODO.*fix|FIXME|HACK|temporary|workaround)"; then
  echo "⚠️  WARNING: 対症療法の可能性があるコードが検出されました"
  echo "本当に必要な修正か確認してください"
  echo "続行する場合は --no-verify を使用してください"
  exit 1
fi
```

## 📊 違反パターンの検出と対処

### パターン1: 同一ファイルの短期間再修正

```bash
# 検出方法
git log --since="7 days ago" --oneline -- path/to/file.ts

# 対処
- 該当ファイルの修正履歴を確認
- 根本原因が解決されていない証拠
- アーキテクチャレビューを実施
```

### パターン2: 型定義の頻繁な変更

```typescript
// 7日以内に3回以上変更された型定義は設計エラー
export type OldType = string;  // Day 1
export type OldType = number;  // Day 3
export type OldType = string | number;  // Day 5
// ❌ これは設計が固まっていない証拠
```

### パターン3: 条件分岐の追加

```typescript
// 修正のたびに条件分岐が増える = 対症療法
function processData(data: any) {
  if (data.type === 'old') { /* 元の実装 */ }
  else if (data.type === 'new') { /* 修正1 */ }
  else if (data.type === 'newer') { /* 修正2 */ }
  else if (data.type === 'newest') { /* 修正3 */ }
  // ❌ これは設計を見直すべき
}
```

## 🔧 正しい修正プロセス

### ステップ1: 根本原因分析（RCA: Root Cause Analysis）

```markdown
## 問題分析テンプレート

### 1. 現象の記述
- 何が起きているか？
- いつ起きるか？
- どのような条件で起きるか？

### 2. 影響範囲
- どのコンポーネントが影響を受けるか？
- どのユーザーストーリーに影響するか？
- パフォーマンスへの影響は？

### 3. 根本原因の特定
- なぜこの問題が発生したか？（5 Whys分析）
- 設計上の問題か、実装上の問題か？
- 同様の問題が他にもないか？

### 4. 解決策の設計
- どのように修正するか？
- 影響を受ける全ファイルのリスト
- 必要なテストケース
- ドキュメント更新の必要性
```

### ステップ2: 包括的修正の実施

```typescript
// ✅ 正しい修正: 根本から解決
// Before: 散在していた判定ロジック
// After: 一元化された判定関数

// src/ai/utils/categoryDetermination.ts
export function determineWordPosition(
  progress: WordProgress,
  mode: LearningMode = 'memorization'
): number {
  // 7つのAI評価を統合
  const baseScore = calculateBaseScore(progress, mode);
  const aiScore = calculate7AIScore(progress, mode);
  const timeBoost = calculateTimeBoost(progress);
  
  return Math.min(100, baseScore + aiScore + timeBoost);
}

// ✅ すべての呼び出し元をこの関数に統一
// statistics.ts, progressStorage.ts, QuestionScheduler.ts
// 全てが determineWordPosition() を使用
```

### ステップ3: 影響範囲の完全な検証

```bash
# 修正の影響を受けるすべてのファイルを検証
npm run test
npm run type-check
npm run lint

# 回帰テスト
npm run test:regression

# E2Eテスト
npm run test:e2e
```

## 🎯 成功の指標

### 修正が成功したと言える条件

1. **単一コミット**: 1つの問題に対して1つのコミット
2. **テスト追加**: 同じ問題が再発しないテストが追加されている
3. **ドキュメント**: 修正内容がドキュメント化されている
4. **型安全**: TypeScript strict modeで0エラー
5. **再現性**: 同じ問題が二度と起きない設計になっている

### 失敗の指標（即座に停止）

1. ❌ 同じファイルを7日以内に2回修正
2. ❌ 「再修正」「fix again」等の文言
3. ❌ 型の変更が3回以上
4. ❌ 条件分岐の追加
5. ❌ コメントに「TODO」「FIXME」

## 📝 コミットメッセージ規約

### 許可されるメッセージ

```bash
# ✅ 正しい修正
fix(position): 型不整合によるカウント不具合を根本修正

- determineWordPosition()の戻り値をnumberに統一
- 全ての呼び出し元(3箇所)を数値範囲比較に変更
- 後方互換性のためgetCategoryFromPosition()を追加
- 関連テスト8件追加

Closes #123

# ✅ 包括的なリファクタリング
refactor(position): Position概念の完全統合

- Priority廃止、Positionに一本化
- 7AI評価の統合アルゴリズム実装
- 全UI(5箇所)を数値表示に変更
```

### 禁止されるメッセージ

```bash
# ❌ 修正の修正
fix(position): 前回の修正を再修正

# ❌ 対症療法
fix(position): カウントが0になる問題に暫定対応

# ❌ 不明瞭
fix: バグ修正

# ❌ 複数の問題
fix: カウント修正 and 表示修正 and 型修正
```

## 🚨 エスカレーション

### 以下の場合は即座にレビューを要求

1. 同じ問題に2回目の修正が必要な場合
2. 根本原因が特定できない場合
3. 影響範囲が5ファイル以上の場合
4. 型定義の変更を伴う場合
5. アーキテクチャ変更を伴う場合

### エスカレーション手順

```markdown
1. 作業を停止
2. 問題分析ドキュメントを作成
3. GitHub Issueを起票
4. レビュー依頼
5. 承認後に作業再開
```

## 📚 参考資料

- [NO_SYMPTOMATIC_FIXES_POLICY.md](../../docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md) - 対症療法禁止の詳細
- [QUICK_FIX_GUIDE.md](../../docs/guidelines/QUICK_FIX_GUIDE.md) - 正しい修正手順
- [core-principles.instructions.md](./core-principles.instructions.md) - コア原則

## 🔄 このドキュメントの更新

このポリシーは以下の場合に更新されます：

1. 新しい違反パターンが発見された場合
2. 検出メカニズムを強化した場合
3. プロジェクトの成長に伴い基準を厳格化する場合

---

**最終更新**: 2025年12月22日  
**次回レビュー**: 2026年1月22日
