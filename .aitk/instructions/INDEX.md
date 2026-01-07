---
description: 【必ず最初に読む】Instructions体系のエントリーポイント
---

# 🚪 Instructions Entry Point

## 🎯 このファイルの役割

**すべてのコード変更・追加・削除の前に必ず読むエントリーポイント**

このファイルから始めて、あなたの作業に関連する **Category Index → Individual Instructions** へ進んでください。

---

## 📋 3層構造アーキテクチャ

```
🚪 Entry Point (このファイル)
    ↓
📂 Category Index (トピック別索引)
    ↓
📄 Individual Instructions (詳細な指示)
```

**ルール**:
- Entry Point を読まずに直接 Individual Instructions へ行ってはいけません
- Category Index で全体像を把握してから、必要な Individual Instructions を選んでください

---

## 🔍 あなたの状況に応じたカテゴリへジャンプ

### コード変更・修正を行う

→ **[Category: Code Modification](categories/CODE_MODIFICATION.md)** へ進む

必須チェック:
- [ ] 既存の仕様書を確認した
- [ ] バッチ方式に影響しないか確認した
- [ ] Position階層を理解した

---

### 新機能を実装する

→ **[Category: Feature Implementation](categories/FEATURE_IMPLEMENTATION.md)** へ進む

必須チェック:
- [ ] 設計原則を確認した
- [ ] 既存の類似機能を調査した
- [ ] テスト戦略を決めた

---

### パフォーマンス問題を解決する

→ **[Category: Performance](categories/PERFORMANCE.md)** へ進む

必須チェック:
- [ ] パフォーマンス診断を実施した
- [ ] ボトルネックを特定した
- [ ] 対策の優先順位を決めた

---

### ドキュメントを作成・更新する

→ **[Category: Documentation](categories/DOCUMENTATION.md)** へ進む

必須チェック:
- [ ] ドキュメント命名規則を確認した
- [ ] 既存ドキュメントと重複しないか確認した
- [ ] Diátaxis分類を決めた

---

### テストを追加・修正する

→ **[Category: Testing](categories/TESTING.md)** へ進む

必須チェック:
- [ ] テスト品質ガイドを確認した
- [ ] カバレッジ要件を確認した
- [ ] テスト戦略を理解した

---

### エラー・バグを修正する

→ **[Category: Bug Fix & Troubleshooting](categories/BUG_FIX.md)** へ進む

必須チェック:
- [ ] メタAI優先確認ガイドを読んだ
- [ ] 症状的修正を避ける原則を理解した
- [ ] 根本原因を特定した

---

### 品質・コード品質を改善する

→ **[Category: Quality Assurance](categories/QUALITY.md)** へ進む

必須チェック:
- [ ] コード品質チェックリストを確認した
- [ ] リファクタリング安全ガイドを読んだ
- [ ] 後方互換性を確認した

---

### AI関連機能を修正する

→ **[Category: AI & Learning System](categories/AI_SYSTEM.md)** へ進む

必須チェック:
- [ ] QuestionScheduler + GamificationAI の設計を理解した
- [ ] Position階層の不変条件を確認した
- [ ] バッチ方式の3原則を理解した

---

### プロジェクト構造・設定を変更する

→ **[Category: Project Structure](categories/PROJECT.md)** へ進む

必須チェック:
- [ ] プロジェクト構造ガイドを確認した
- [ ] 依存関係への影響を評価した
- [ ] ビルド・デプロイへの影響を確認した

---

## 🚨 緊急時・不明な場合

### 何をすべきかわからない場合

1. **まず止まる**: 推測で実装を開始しない
2. **ユーザーに質問する**: 不明点を明確にする
3. **Category Index を眺める**: 関連するカテゴリを探す

### 複数のカテゴリに関連する変更

1. **すべての関連 Category Index を確認**
2. **衝突するルールがあれば、優先順位で解決**:
   - 不変条件（enforcement）> システム仕様（specification）> ガイドライン（guidelines）
3. **疑問があればユーザーに確認**

---

## 📚 参考: Full Category List

すべてのカテゴリ索引は `categories/` ディレクトリにあります:

```
categories/
├── CODE_MODIFICATION.md      # コード変更・修正
├── FEATURE_IMPLEMENTATION.md # 新機能実装
├── PERFORMANCE.md            # パフォーマンス
├── DOCUMENTATION.md          # ドキュメント
├── TESTING.md                # テスト
├── BUG_FIX.md               # バグ修正
├── QUALITY.md               # 品質保証
├── AI_SYSTEM.md             # AI・学習システム
└── PROJECT.md               # プロジェクト構造
```

---

## 🛡️ サーバント水先案内人

修正開始前に自動ガードが起動します:

```bash
# ガードチェック（リアルタイム）
node scripts/ai-guard-check.mjs "<ユーザー依頼>" [ファイル]

# 統合ワークフロー（推奨）
node scripts/ai-workflow.mjs "<ユーザー依頼>" [ファイル]
```

これらが自動的に:
- 過去の類似失敗を検索
- 関連する Individual Instructions を提示
- 必須チェックリストを表示

---

## 🌳 Decision Trees（判断ツリー）

**判断が必要な時、このセクションから開始してください**

Decision Treesは「何をすべきか判断に迷う」時に、Mermaid図とフローチャートで自動的に正しい方向へ導きます。

### 利用可能なDecision Trees

- [Bug Fix Decision](decision-trees/bug-fix-decision.instructions.md) - バグ修正の判断と手順
- [Feature Implementation Decision](decision-trees/feature-implementation-decision.instructions.md) - 新機能実装の判断
- [Refactoring Decision](decision-trees/refactoring-decision.instructions.md) - リファクタリングの判断
- [Performance Decision](decision-trees/performance-decision.instructions.md) - パフォーマンス最適化の判断
- [Testing Decision](decision-trees/testing-decision.instructions.md) - テスト戦略の判断
- [Documentation Decision](decision-trees/documentation-decision.instructions.md) - ドキュメント作成の判断
- [Maintenance Decision](decision-trees/maintenance-decision.instructions.md) - メンテナンスの判断
- [Deployment Decision](decision-trees/deployment-decision.instructions.md) - デプロイの判断
- [Dependency Decision](decision-trees/dependency-decision.instructions.md) - 依存関係追加の判断
- [Security Decision](decision-trees/security-decision.instructions.md) - セキュリティ対応の判断
- [Quality Decision](decision-trees/quality-decision.instructions.md) - 品質改善の判断
- [Rollback Decision](decision-trees/rollback-decision.instructions.md) - ロールバックの判断

**使い方**: 
1. 状況に応じたDecision Treeを開く
2. Mermaid図のフローチャートに従って判断
3. 最終的に導かれた Category Index または Individual Instructions へ進む

---

## 📐 業界標準アプローチの統合

この体系は以下の業界標準手法を統合しています:

### Architecture Decision Records (ADR)
- **実装箇所**: Individual Instructions の frontmatter と変更履歴
- **目的**: 設計判断の記録と理由の明示
- **例**: `batch-system-enforcement.instructions.md` が「なぜバッチ方式か」を記録

### Policy as Code
- **実装箇所**: `*-enforcement.instructions.md` ファイル群
- **目的**: ポリシーを実行可能な形で強制
- **連携**: `scripts/ai-guard-check.mjs` と `pre-commit-ai-guard.sh` で自動実行

### Decision Trees
- **実装箇所**: `decision-trees/` ディレクトリ（12個のツリー）
- **目的**: 判断を自動化し、正しい方向へ誘導
- **形式**: Mermaid図 + 条件分岐ロジック

---

**次のステップ**: 上記の状況別リンクから **Category Index** へ進んでください。
