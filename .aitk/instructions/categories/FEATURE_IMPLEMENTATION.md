---
description: 新機能実装時のカテゴリ索引
category: feature-implementation
---

# 📂 Category: Feature Implementation

## 🎯 このカテゴリの対象

- 新機能の実装
- 新しいコンポーネントの追加
- 新しいシステムの構築
- 機能拡張

---

## 🌳 判断が必要な場合: Decision Tree

**新機能実装の判断に迷ったら、Decision Treeから開始してください**:

📄 **[Feature Implementation Decision Tree](../decision-trees/feature-implementation-decision.instructions.md)**

このDecision Treeが自動的に:
- 既存機能との競合チェック
- 実装優先度の判定（P0/P1/P2）
- 実装手順の提示
- 必要なテスト戦略の決定

---

## 📋 必須確認 Individual Instructions（優先順）

### 1. 開発ガイドライン ⭐ 最優先

📄 **[development-guidelines.instructions.md](../development-guidelines.instructions.md)**

**開発の原則**:
- 既存パターンに従う
- DRY（Don't Repeat Yourself）
- KISS（Keep It Simple, Stupid）
- YAGNI（You Aren't Gonna Need It）

---

### 2. コア原則

📄 **[core-principles.instructions.md](../core-principles.instructions.md)**

**設計の基本原則**:
- 単一責任の原則
- 開放閉鎖の原則
- リスコフの置換原則
- インターフェース分離の原則
- 依存性逆転の原則

---

### 3. プロジェクト構造

📄 **[project-structure.instructions.md](../project-structure.instructions.md)**

**ディレクトリ構造**:
```
src/
├── components/      # Reactコンポーネント
├── hooks/          # カスタムフック
├── utils/          # ユーティリティ関数
├── ai/             # AIシステム
│   ├── specialists/  # 専門AI
│   └── scheduler/    # メタAI
├── storage/        # ストレージ層
└── types/          # 型定義
```

---

## 🔍 新機能実装フロー

```
1. 要件定義
   - 何を実装するか
   - なぜ必要か
   - 誰のためか
   ↓
2. 設計
   - 既存パターンを調査
   - アーキテクチャを決定
   - API設計
   ↓
3. 既存システムとの統合確認
   - 既存機能との衝突はないか
   - Position階層に影響しないか
   - バッチ方式に影響しないか
   ↓
4. テスト戦略決定
   - ユニットテスト
   - 統合テスト
   - E2Eテスト
   ↓
5. 実装
   - TDD（Test-Driven Development）推奨
   - 小さい単位でコミット
   ↓
6. テスト作成・実行
   npm run test:unit:fast
   ↓
7. 品質チェック
   npm run quality:check
   ↓
8. ドキュメント作成
   - 使い方
   - 設計判断の理由
   ↓
9. レビュー依頼
```

---

## 🧪 新機能のテスト

### 1. ユニットテスト必須

```typescript
describe('NewFeature', () => {
  it('should do expected behavior', () => {
    // テスト
  });
  
  it('should handle edge cases', () => {
    // エッジケース
  });
  
  it('should handle errors gracefully', () => {
    // エラーハンドリング
  });
});
```

### 2. 統合テスト推奨

```typescript
describe('NewFeature Integration', () => {
  it('should work with existing system', () => {
    // 既存システムとの統合
  });
});
```

### 3. E2Eテスト（必要に応じて）

```typescript
test('User can use new feature', async ({ page }) => {
  // ユーザーシナリオ
});
```

---

## 📝 実装チェックリスト

### 設計フェーズ

- [ ] 要件を明確化した
- [ ] 既存の類似機能を調査した
- [ ] アーキテクチャを決定した
- [ ] API設計を完了した
- [ ] 既存システムとの衝突を確認した

### 実装フェーズ

- [ ] コーディング規約に従った
- [ ] 型定義を追加した
- [ ] エラーハンドリングを実装した
- [ ] デバッグログを追加した
- [ ] コメントを適切に追加した

### テストフェーズ

- [ ] ユニットテストを作成した
- [ ] 統合テストを作成した（必要に応じて）
- [ ] E2Eテストを作成した（必要に応じて）
- [ ] すべてのテストが通る
- [ ] カバレッジ目標を達成した

### 品質フェーズ

- [ ] TypeScriptエラー: 0
- [ ] Lintエラー: 0
- [ ] パフォーマンステストを実施した
- [ ] アクセシビリティを確認した
- [ ] セキュリティを確認した

### ドキュメントフェーズ

- [ ] 使い方ドキュメントを作成した
- [ ] 設計ドキュメントを作成した
- [ ] API ドキュメントを作成した（必要に応じて）

---

## 🚫 禁止事項

- ❌ 既存パターンを無視した独自実装
- ❌ テストなしで実装
- ❌ ドキュメントなしで実装
- ❌ エラーハンドリングなし
- ❌ 型定義なし
- ❌ 大規模な一括実装（小さい単位で）

---

## 📚 関連 Individual Instructions 一覧

- [development-guidelines.instructions.md](../development-guidelines.instructions.md) ⭐ 最優先
- [core-principles.instructions.md](../core-principles.instructions.md) ⭐ Critical
- [project-structure.instructions.md](../project-structure.instructions.md)
- [code-quality.instructions.md](../code-quality.instructions.md)
- [test-quality.instructions.md](../test-quality.instructions.md)
- [documentation-enforcement.instructions.md](../documentation-enforcement.instructions.md)

---

**戻る**: [Entry Point (INDEX.md)](../INDEX.md)
