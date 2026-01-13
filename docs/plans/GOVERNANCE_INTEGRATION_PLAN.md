---
title: プロジェクト全体のガバナンス体系
description: Instructions + Docs の統合アーキテクチャ
date: 2025-12-30
status: PROPOSAL
---

# 🏛️ プロジェクト全体のガバナンス体系

> **統合アプローチ**: Instructions（ポリシー） + Docs（仕様・ガイド） = 完全なガバナンス

## 🎯 目的

- `.aitk/instructions/` (ポリシー・強制装置)
- `docs/` (仕様書・ガイドライン)

これら2つを統合し、**発見可能性**、**保守性**、**一貫性**を最大化する。

---

## 📊 現状分析

### Instructions（40+ files）
```
.aitk/instructions/
├── Core Enforcement (5 files)      - 修正時の強制ルール
├── Decision Trees (4 files)        - 意思決定フローチャート
├── Quality Enforcement (6 files)   - 品質基準
├── Domain-Specific (8 files)       - ドメイン固有ルール
├── Development Guidelines (5 files) - 開発ガイドライン
├── Anti-Patterns (3 files)         - アンチパターン防止
├── Process (2 files)               - プロセス
├── Context-Specific (3 files)      - コンテキスト固有
├── Diagnostics (2 files)           - 診断
└── Patterns (2 files)              - デザインパターン
```

### Docs（300+ files）
```
docs/
├── specifications/ (33 files)      - 機能仕様
├── quality/ (31 files)             - 品質管理
├── guidelines/ (31 files)          - ガイドライン
├── plans/ (31 files)               - 計画
├── development/ (26 files)         - 開発ガイド
├── reports/ (25 files)             - レポート
├── references/ (25 files)          - リファレンス
├── design/ (14 files)              - 設計資料
├── processes/ (13 files)           - プロセス
├── maintenance/ (7 files)          - メンテナンス
├── features/ (5 files)             - 機能説明
├── archive/ (38 files)             - アーカイブ
└── ... (その他)
```

---

## 🏗️ 統合アーキテクチャ（3層構造）

### Layer 1: Navigation Hub（ナビゲーションハブ）

**場所**: プロジェクトルート

```
nanashi8.github.io/
├── GOVERNANCE.md                    【新規】統合ナビゲーション
├── README.md                        既存プロジェクト概要
└── CONTRIBUTING.md                  【新規】コントリビューションガイド
```

#### GOVERNANCE.md の構造

```markdown
# 🏛️ プロジェクトガバナンス

## Quick Navigation

### 🔍 状況別ガイド
- コード修正 → [修正前チェックリスト](link)
- 新機能実装 → [実装ガイド](link)
- 品質問題 → [品質基準](link)
- ドキュメント更新 → [ドキュメント戦略](link)

### 📚 ドキュメント体系
- [Instructions README](../.aitk/instructions/README.md) - ポリシー・強制装置
- [Docs INDEX](INDEX.md) - 仕様書・ガイドライン

### 🎯 重要リンク集
- [QuestionScheduler仕様](link)
- [バッチ方式ルール](link)
- [品質管理システム](link)
```

---

### Layer 2: Category Indexes（カテゴリインデックス）

#### 2.1 Instructions側（既存）
```
.aitk/instructions/
├── README.md                        【作成済】総合ガイド
├── EVOLUTION_PLAN.md                【作成済】進化計画
└── [40+ instructions files]
```

#### 2.2 Docs側（強化版）
```
docs/
├── INDEX.md                         【既存・強化】総合目次
├── STRUCTURE.md                     【新規】構造説明
├── CROSS_REFERENCE.md               【新規】相互参照マップ
└── [300+ documentation files]
```

---

### Layer 3: Individual Documents（個別ドキュメント）

**現状維持** + **相互参照の強化**

---

## 🔗 統合マップ（Instructions ↔ Docs）

### マップ1: バッチ方式

```
Instructions側（ポリシー）:
├── modification-enforcement.instructions.md
├── batch-system-enforcement.instructions.md
├── position-hierarchy-enforcement.instructions.md
└── category-slots-enforcement.instructions.md
    ↓ 参照 ↓
Docs側（仕様・ガイド）:
├── docs/specifications/QUESTION_SCHEDULER_SPEC.md
├── docs/guidelines/META_AI_TROUBLESHOOTING.md
├── docs/design/LEARNING_PHASE_ARCHITECTURE.md
└── docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md
```

### マップ2: 品質管理

```
Instructions側（ポリシー）:
├── code-quality.instructions.md
├── test-quality.instructions.md
├── error-zero-policy.instructions.md
└── documentation-enforcement.instructions.md
    ↓ 参照 ↓
Docs側（仕様・ガイド）:
├── docs/quality/QUALITY_SYSTEM.md
├── docs/quality/QUALITY_AUTOMATION_GUIDE.md
├── docs/quality/INTEGRATED_QUALITY_PIPELINE.md
└── docs/quality/HEALTH_CHECK_REPORT.md
```

### マップ3: データ品質

```
Instructions側（ポリシー）:
├── grammar-data-quality.instructions.md
├── grammar-question-validation.instructions.md
└── learning-content-quality-guard.instructions.md
    ↓ 参照 ↓
Docs側（仕様・ガイド）:
├── docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md
├── docs/guidelines/AI_GRAMMAR_QUESTION_CREATION.md
├── docs/guidelines/grammar/GRAMMAR_QUALITY_PIPELINE.md
└── docs/quality/grammar_quality_report.md
```

---

## 📋 Diátaxis Framework の適用

### Tutorial（チュートリアル）

**目的**: 学習指向（新規ユーザー向け）

```
docs/tutorials/
├── getting-started.md               【新規】プロジェクト開始
├── first-contribution.md            【新規】初めてのコントリビューション
├── question-scheduler-basics.md     【既存から移動】
└── adaptive-ai-introduction.md      【既存から移動】
```

**特徴**:
- 手順を追って実行できる
- 初心者でも理解できる
- 実際に動かせる

---

### How-to Guides（ハウツーガイド）

**目的**: 問題解決指向（特定タスク向け）

```
docs/how-to/
├── fix-vibration.md                 【新規】振動問題の解決
├── add-new-feature.md               【新規】新機能の追加
├── optimize-performance.md          【新規】パフォーマンス最適化
├── update-grammar-data.md           【既存から移動】
├── debug-question-scheduler.md      【既存から移動】
└── create-quality-report.md         【既存から移動】
```

**特徴**:
- 目標指向
- ステップバイステップ
- 実用的

---

### Reference（リファレンス）

**目的**: 情報指向（詳細情報）

```
docs/reference/
├── api/                             【新規カテゴリ】
│   ├── QuestionScheduler.md
│   ├── GamificationAI.md
│   └── PositionCalculator.md
├── data-structures/                 【新規カテゴリ】
│   ├── Question.md
│   ├── WordProgress.md
│   └── SessionStats.md
├── specifications/                  【既存・再編成】
│   ├── QUESTION_SCHEDULER_SPEC.md
│   ├── GRAMMAR_DATA_SPEC.md
│   └── QUALITY_METRICS_SPEC.md
└── glossary.md                      【新規】用語集
```

**特徴**:
- 網羅的
- 正確
- 検索しやすい

---

### Explanation（解説）

**目的**: 理解指向（概念・背景）

```
docs/explanation/
├── architecture/                    【既存design/から移動】
│   ├── LEARNING_PHASE_ARCHITECTURE.md
│   ├── ADAPTIVE_NETWORK_ARCHITECTURE.md
│   └── SYSTEM_OVERVIEW.md
├── design-decisions/                【新規・ADR統合】
│   ├── 0001-batch-system-adoption.md
│   ├── 0002-position-hierarchy-design.md
│   └── 0003-category-slots-implementation.md
├── concepts/                        【新規】
│   ├── learning-phases.md
│   ├── position-hierarchy.md
│   └── adaptive-learning.md
└── best-practices/                  【既存guidelines/から移動】
    ├── code-quality.md
    ├── testing-strategy.md
    └── documentation-style.md
```

**特徴**:
- コンセプト重視
- Why を説明
- 深い理解を促す

---

## 🗂️ ディレクトリ構造（統合後）

### 提案A: Minimal Disruption（最小限の変更）

**現状維持** + **ナビゲーション強化**

```
nanashi8.github.io/
├── GOVERNANCE.md                    【新規】統合ナビゲーション
├── CONTRIBUTING.md                  【新規】
├── README.md                        【既存】
├── .aitk/
│   └── instructions/
│       ├── README.md                【既存】
│       ├── EVOLUTION_PLAN.md        【既存】
│       └── ... (40+ files)
└── docs/
    ├── INDEX.md                     【既存・強化】
    ├── STRUCTURE.md                 【新規】
    ├── CROSS_REFERENCE.md           【新規】
    ├── specifications/              【既存】
    ├── quality/                     【既存】
    ├── guidelines/                  【既存】
    ├── plans/                       【既存】
    └── ... (既存18ディレクトリ)
```

**メリット**:
- 既存リンクが壊れない
- 段階的に移行可能
- リスクが低い

**デメリット**:
- 分類が不明確な部分が残る
- Diátaxisへの移行は将来

---

### 提案B: Diátaxis Migration（段階的移行）

**Diátaxisフレームワークに段階的に移行**

```
nanashi8.github.io/
├── GOVERNANCE.md                    【新規】
├── CONTRIBUTING.md                  【新規】
├── README.md                        【既存】
├── .aitk/
│   └── instructions/
│       ├── README.md                【既存】
│       └── ... (40+ files)
└── docs/
    ├── INDEX.md                     【強化】
    ├── MIGRATION_STATUS.md          【新規】移行状況
    ├── tutorials/                   【新規】Phase 1で作成
    │   └── (新規ファイル + 移動ファイル)
    ├── how-to/                      【新規】Phase 2で作成
    │   └── (新規ファイル + 移動ファイル)
    ├── reference/                   【新規】Phase 3で作成
    │   ├── api/
    │   ├── data-structures/
    │   └── specifications/ (既存specifications/を移動)
    ├── explanation/                 【新規】Phase 4で作成
    │   ├── architecture/ (既存design/を移動)
    │   ├── design-decisions/ (ADR)
    │   └── concepts/
    └── archive/                     【既存】移行前の旧構造を保持
        ├── old-specifications/
        ├── old-guidelines/
        └── ...
```

**メリット**:
- 業界標準に準拠
- 発見可能性が向上
- 保守性が向上

**デメリット**:
- 移行に時間がかかる（4-8週間）
- リンク更新が必要（自動化可能）

---

## 🚀 実装ロードマップ

### Phase 1: ナビゲーション強化（1週間）【推奨】

**即座に価値を提供**

```
□ GOVERNANCE.md 作成
  - Quick Navigation
  - Instructions ↔ Docs マッピング
  - 重要リンク集

□ docs/STRUCTURE.md 作成
  - 現在のディレクトリ構造説明
  - 各カテゴリの目的
  - 命名規則

□ docs/CROSS_REFERENCE.md 作成
  - Instructions → Docs マッピング
  - Docs → Instructions マッピング
  - 依存関係グラフ

□ 既存ファイルへの相互参照追加
  - Instructions に Docs へのリンク追加
  - Docs に Instructions へのリンク追加
```

**成果物**:
- 3つの新規ナビゲーションファイル
- 既存ファイルへの相互参照（約20箇所）
- 発見可能性の大幅向上

---

### Phase 2: Category Indexの強化（1週間）

```
□ Instructions README.md 更新
  - Docs へのリンク追加
  - 統合マップ追加

□ Docs INDEX.md 更新
  - Diátaxis分類の追加
  - Instructions へのリンク追加

□ 検索インデックス作成
  - キーワード → ファイル マッピング
  - トピック → ドキュメント マッピング
```

---

### Phase 3: Diátaxis Pilot（2週間）

```
□ tutorials/ ディレクトリ作成
  - getting-started.md
  - first-contribution.md

□ how-to/ ディレクトリ作成
  - 既存ガイドラインから5-10ファイル移動
  - 新規ハウツーガイド作成

□ リンク自動更新スクリプト作成
  - 旧パス → 新パス 変換
  - 全ファイルのリンク更新
```

---

### Phase 4: Full Diátaxis Migration（4-6週間）

**提案Bを選択した場合のみ**

```
□ reference/ ディレクトリ完成
□ explanation/ ディレクトリ完成
□ archive/ に旧構造を保存
□ 全リンク更新
□ 検証・テスト
```

---

## 📊 比較: 提案A vs 提案B

| 項目 | 提案A: Minimal | 提案B: Diátaxis |
|------|---------------|-----------------|
| **実装期間** | 2週間 | 8-12週間 |
| **リスク** | 低 | 中 |
| **既存リンク** | 維持 | 更新必要 |
| **発見可能性** | +30% | +80% |
| **保守性** | +20% | +60% |
| **業界標準** | 部分的 | 完全準拠 |
| **学習曲線** | なし | 中程度 |
| **ROI** | 即座 | 3ヶ月後 |

---

## 🎯 推奨アプローチ

### Stage 1: Quick Wins（即座に開始）

**提案A Phase 1 を実施**

```
✅ GOVERNANCE.md 作成（1日）
✅ docs/STRUCTURE.md 作成（1日）
✅ docs/CROSS_REFERENCE.md 作成（2日）
✅ 相互参照追加（2日）
```

**期待効果**:
- 発見可能性 +30%
- 新規メンバーのオンボーディング時間 -50%
- ドキュメント探索時間 -40%

---

### Stage 2: Progressive Enhancement（段階的改善）

**提案A Phase 2 + 提案B Phase 3 Pilot**

```
□ Category Index 強化（1週間）
□ Diátaxis Pilot 実施（2週間）
□ フィードバック収集（1週間）
```

**判断ポイント**:
- Diátaxis Pilotの効果測定
- ユーザーフィードバック
- チームの習熟度

---

### Stage 3: Full Migration（必要に応じて）

**提案B Phase 4 を選択的に実施**

```
□ reference/ 移行
□ explanation/ 移行
□ リンク更新自動化
```

**判断基準**:
- Stage 2 の成功
- リソースの確保
- 長期的なROI

---

## 🛠️ 実装ツール

### 1. リンク検証・更新スクリプト

```bash
#!/bin/bash
# scripts/validate-links.sh

# すべてのmdファイルのリンクを検証
find . -name "*.md" -exec markdown-link-check {} \;

# 壊れたリンクを報告
```

### 2. 相互参照生成スクリプト

```typescript
// scripts/generate-cross-references.ts

interface CrossReference {
  instruction: string;
  relatedDocs: string[];
  description: string;
}

const crossReferences: CrossReference[] = [
  {
    instruction: 'batch-system-enforcement.instructions.md',
    relatedDocs: [
      'docs/specifications/QUESTION_SCHEDULER_SPEC.md',
      'docs/guidelines/META_AI_TROUBLESHOOTING.md',
    ],
    description: 'バッチ方式の仕様と実装',
  },
  // ...
];

// Markdown生成
```

### 3. 検索インデックス生成

```typescript
// scripts/generate-search-index.ts

interface SearchIndex {
  keyword: string;
  files: Array<{
    path: string;
    type: 'instruction' | 'doc';
    relevance: number;
  }>;
}

// 全ファイルをスキャンしてインデックス生成
```

---

## 📈 成功指標

### 定量的指標

```
現状:
- ドキュメント発見時間: 平均15分
- 新規メンバーオンボーディング: 2日
- リンク切れ: 約5%（15-20箇所）
- ドキュメント重複率: 10%

目標（Phase 1完了後）:
- ドキュメント発見時間: 平均5分（-67%）
- 新規メンバーオンボーディング: 1日（-50%）
- リンク切れ: 0%
- ドキュメント重複率: 8%

目標（Phase 4完了後）:
- ドキュメント発見時間: 平均2分（-87%）
- 新規メンバーオンボーディング: 4時間（-75%）
- リンク切れ: 0%
- ドキュメント重複率: 3%
```

### 定性的指標

```
✅ ドキュメントが見つけやすい
✅ Instructions と Docs の関係が明確
✅ 業界標準に準拠
✅ 保守が容易
✅ 新規メンバーがすぐに理解できる
```

---

## 💬 Discussion Points

### Q1: どの提案を採用すべきか？

**推奨**: 提案A Phase 1 から開始

**理由**:
- 即座に価値を提供
- リスクが低い
- 段階的に提案Bへ移行可能

### Q2: Diátaxis への完全移行は必要か？

**推奨**: Phase 3 Pilot で評価

**理由**:
- Pilotで効果を測定
- フィードバックを収集
- ROIを確認してから判断

### Q3: 既存のリンクをどうするか？

**推奨**: 段階的更新 + リダイレクト

**理由**:
- 一度に全部は更新しない
- 旧パスへのリダイレクトを設置
- 自動更新スクリプトで効率化

### Q4: メンテナンスコストは？

**推奨**: 自動化でコスト削減

**理由**:
- リンク検証の自動化
- 相互参照の自動生成
- CI/CDパイプラインで検証

---

## 📝 Next Steps

### 今週（即座に開始可能）

1. **GOVERNANCE.md 作成**
   - Quick Navigation セクション
   - Instructions ↔ Docs マッピング
   - 重要リンク集

2. **docs/STRUCTURE.md 作成**
   - 現在の構造説明
   - 各カテゴリの目的

3. **docs/CROSS_REFERENCE.md 作成**
   - バッチ方式マップ
   - 品質管理マップ
   - データ品質マップ

### 来週

1. **相互参照追加**
   - Instructions → Docs
   - Docs → Instructions

2. **リンク検証スクリプト作成**
   - 壊れたリンクの検出
   - 自動修正

3. **フィードバック収集**
   - 実際の使用感
   - 改善点の特定

---

**Status**: PROPOSAL  
**Created**: 2025-12-30  
**Author**: AI Assistant  
**Next Review**: 2026-01-06
