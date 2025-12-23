---
description: 【全プロジェクト適用】対症療法的修正の完全禁止
applyTo: '**/*'
---

# 🚨 対症療法禁止ポリシー（全プロジェクト適用）

## 📋 概要

このプロジェクトでは、**対症療法的な修正を完全に禁止**します。
すべてのコード変更は、根本原因を特定し、適切な責任分離に基づいて実装する必要があります。

## ❌ 対症療法とは

**定義**: 根本原因を解決せず、表面的な症状だけを修正する行為

**典型的なパターン**:
- ✗ データ判定ロジックを複数箇所にコピー&ペースト
- ✗ 既存の責任を持つ関数を呼ばずに、その場で再実装
- ✗ バグを修正するためだけに、無関係な場所に条件分岐を追加
- ✗ 「とりあえず動けばいい」という短期的な修正
- ✗ 重複コードの放置・増殖
- ✗ Single Source of Truth (SSOT) 原則の違反

## ✅ 正しいアプローチ

### 1. 責任の所在を明確化

```typescript
// ❌ 対症療法: 各所で同じ判定を繰り返す
function displayStatus(word: WordProgress) {
  if (word.correctCount > 5 && word.accuracy > 0.8) {
    return 'mastered';
  }
  // ... 同じロジックが他の10箇所にも存在
}

// ✅ 正しい: Single Source of Truth
import { determineWordPosition } from './ai/utils/categoryDetermination';

function displayStatus(word: WordProgress) {
  return determineWordPosition(word); // AI担当関数に委譲
}
```

### 2. 修正前の必須チェックリスト

#### 🔍 Phase 1: 根本原因の特定
- [ ] この問題は**なぜ**発生したのか？
- [ ] 同じ責任を持つ関数/モジュールは既に存在しないか？
- [ ] 類似のロジックが他の場所に散在していないか？
- [ ] データフロー全体を図示して理解したか？

#### 🎯 Phase 2: 責任分離の確認
- [ ] この処理の責任を持つべきは**どのレイヤー**か？
  - ビジネスロジック層（AI判定、データ処理）
  - データアクセス層（storage、cache）
  - プレゼンテーション層（UI表示）
- [ ] 既存の責任境界を侵犯していないか？
- [ ] Single Responsibility Principle (SRP) を守っているか？

#### 🛠️ Phase 3: 実装の検証
- [ ] 根本原因を解決する実装になっているか？
- [ ] 既存の関数/ユーティリティを最大限活用しているか？
- [ ] 重複コードを作成していないか？
- [ ] 将来の拡張性を考慮しているか？

#### 📝 Phase 4: ドキュメント化
- [ ] なぜこの修正が必要だったのか記録したか？
- [ ] 対症療法ではなく根本治療であることを説明できるか？
- [ ] 修正により影響を受ける範囲を特定したか？

## 🏗️ アーキテクチャ原則

### Single Source of Truth (SSOT)

すべてのデータ・ロジックは**唯一の正式な定義元**を持つ必要があります。

**例: 学習段階（Position）判定**
- ✅ **唯一の正式な定義**: `src/ai/utils/categoryDetermination.ts` の `determineWordPosition()`
- ❌ **禁止**: 他の場所でif-else判定を書く
- ✅ **すべての使用箇所**: この関数をimportして呼び出す

### 責任の階層

```
📊 データ定義層 (types/)
    ↓ 依存
🧠 ビジネスロジック層 (ai/, strategies/)
    ↓ 依存
💾 データ永続化層 (storage/)
    ↓ 依存
🎨 プレゼンテーション層 (components/)
```

**原則**: 下位レイヤーは上位レイヤーに依存してはいけない

## 🚦 コードレビュー時の強制チェック

### 自動検知パターン（要実装）

以下のパターンが検出された場合、CIで自動的に失敗します：

```typescript
// ❌ パターン1: AI担当領域での重複判定
if (consecutiveIncorrect >= 2) { // 対症療法の可能性
  category = 'incorrect';
}

// ❌ パターン2: 責任を持つ関数を使わない再実装
const accuracy = correctCount / (correctCount + incorrectCount);
if (accuracy > 0.8) { // determineWordPosition()を使うべき
  // ...
}

// ❌ パターン3: コメントで対症療法を認めている
// とりあえず動くようにした
// 暫定対応
// TODO: 後で直す
```

### 人的レビューの必須項目

- [ ] **根本原因分析**が行われているか
- [ ] **Single Source of Truth** が守られているか
- [ ] **責任分離**が適切か
- [ ] **重複コード**が発生していないか
- [ ] **将来の保守性**が考慮されているか

## 📚 関連ドキュメント

- [対症療法禁止ポリシー詳細](../../docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md)
- [AI修正ガイドライン](./ai-modification-guard.instructions.md)
- [アーキテクチャ設計原則](../../docs/design/ARCHITECTURE.md)

## ⚠️ 違反時の対応

### 自動検知された場合
1. CIパイプラインが失敗
2. PR がブロックされる
3. 修正が強制される

### レビューで指摘された場合
1. **なぜ対症療法なのか**の説明を受ける
2. **根本治療の方法**を提示される
3. 修正後、再レビュー

### 繰り返し違反した場合
1. プロジェクトメンテナーによる教育セッション
2. アーキテクチャ理解度チェック
3. コミット権限の一時制限（重度の場合）

## 🎓 学習リソース

### 推奨書籍
- "Clean Code" by Robert C. Martin - 責任分離の重要性
- "Refactoring" by Martin Fowler - リファクタリング手法
- "Design Patterns" by Gang of Four - 再利用可能な設計

### プロジェクト内の良い例
- `src/ai/utils/categoryDetermination.ts` - SSSTの実装例
- `src/ai/scheduler/QuestionScheduler.ts` - 責任分離の実装例
- `src/storage/progress/progressStorage.ts` - AI委譲の実装例

---

**このポリシーは全プロジェクトに適用されます。例外は認められません。**
