# ドキュメント整理計画 - 段階的リンク保持型リファクタリング

**作成日**: 2025-12-19  
**ステータス**: Planning  
**リスクレベル**: High（多数のリンク依存あり）

---

## 📊 現状分析

### ディレクトリ構成（18サブディレクトリ）

```
docs/
├── analysis/ (分析レポート)
├── archive/ (アーカイブ - 20ファイル)
├── data/ (データ仕様)
├── design/ (設計ドキュメント)
├── development/ (開発ガイド)
├── features/ (機能ドキュメント)
├── fixes/ (修正記録)
├── guidelines/ (18ファイル + grammar/, passage/)
│   ├── grammar/ (6ファイル)
│   └── passage/ (5ファイル)
├── maintenance/ (保守ガイド)
├── plans/ (計画ドキュメント)
├── processes/ (9ファイル - 作業プロセス)
├── quality/ (25ファイル - 品質管理)
├── references/ (参照資料)
├── reports/ (レポート)
├── roadmap/ (ロードマップ)
├── specifications/ (28ファイル - 仕様書)
└── templates/ (テンプレート)
```

**総ファイル数**: 約150ファイル

---

## 🔗 重要な依存関係マップ

### 1. メタAI（QuestionScheduler）トライアド

**最高優先度 - 絶対に破壊してはならない**

```
.aitk/instructions/meta-ai-priority.instructions.md
    ↓ 参照
    ├─ docs/guidelines/META_AI_TROUBLESHOOTING.md
    ├─ docs/guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md
    ├─ docs/specifications/QUESTION_SCHEDULER_SPEC.md
    └─ docs/quality/QUESTION_SCHEDULER_QA_PIPELINE.md

参照元:
- tests/simulation/README.md
- tests/simulation/IMPLEMENTATION_SUMMARY.md
- .aitk/instructions/tools.instructions.md
```

**移動不可**: この4ファイルの配置は固定

---

### 2. 文法データ品質システム

```
.aitk/instructions/grammar-data-quality.instructions.md
    ↓ 参照
    ├─ docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md
    ├─ docs/guidelines/AI_GRAMMAR_QUESTION_CREATION.md
    ├─ docs/guidelines/GRAMMAR_QUESTION_VALIDATION.md
    ├─ docs/guidelines/grammar/GRAMMAR_QUALITY_PIPELINE.md
    ├─ docs/guidelines/grammar/NEW_HORIZON_GRAMMAR_GUIDELINES.md
    └─ docs/quality/grammar_quality_report.md

参照元:
- .github/PULL_REQUEST_TEMPLATE.md
- scripts/README.md
- docs/README.md
```

---

### 3. 品質管理システム

```
.aitk/instructions/code-quality.instructions.md
    ↓ 参照
    ├─ docs/quality/QUALITY_SYSTEM.md (中核)
    ├─ docs/quality/QUALITY_AUTOMATION_GUIDE.md
    ├─ docs/quality/INTEGRATED_QUALITY_PIPELINE.md
    └─ docs/quality/HEALTH_CHECK_REPORT.md

参照元:
- README.md (メイン)
- docs/maintenance/SELF_MANAGING_PROJECT.md
- docs/design/PROJECT_STRUCTURE_VALIDATION.md
```

---

### 4. デプロイ・リファクタリング安全システム

```
.aitk/instructions/security-best-practices.instructions.md
.aitk/instructions/refactoring-safety.instructions.md
    ↓ 参照
    ├─ docs/processes/DEPLOYMENT_OPERATIONS.md
    ├─ docs/processes/STUDENT_DEPLOYMENT_GUIDE.md
    ├─ docs/processes/REFACTORING_SAFETY.md
    └─ docs/processes/EMERGENCY_RECOVERY.md

参照元:
- README.md
```

---

### 5. CSS/デザインシステム

```
.aitk/instructions/css-modification-rules.instructions.md
    ↓ 参照
    ├─ docs/design/DESIGN_FREEZE.md
    └─ docs/quality/COLOR_PALETTE_SPECIFICATION.md
```

---

### 6. NEW HORIZON 単元構成システム

```
.aitk/instructions/tools.instructions.md
    ↓ 参照
    └─ docs/references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md (正本)

関連:
- docs/guidelines/grammar/NEW_HORIZON_*.md (3ファイル)
- scripts/validate-unit-structure.sh
```

---

## 🚨 リスク評価

### 🔴 High Risk（移動時に必ずリンク更新が必要）

1. **guidelines/grammar/** (6ファイル)
   - 30+ 箇所から参照されている
   - instructions から直接参照

2. **specifications/QUESTION_SCHEDULER_SPEC.md**
   - メタAIトライアドの一角
   - 5+ 箇所から参照

3. **quality/QUALITY_SYSTEM.md**
   - プロジェクト全体の品質管理の中核
   - 10+ 箇所から参照

### 🟡 Medium Risk（一部リンク更新が必要）

1. **processes/** (9ファイル)
   - README.md、instructions から参照

2. **quality/** (25ファイル)
   - 品質レポートが相互参照

### 🟢 Low Risk（自己完結型）

1. **archive/** (20ファイル)
   - 履歴のみ、参照少ない

2. **reports/** (レポート類)
   - 時系列記録、参照少ない

---

## 📋 Diátaxis 4分類への再配置案

### Tutorial（学習順序ガイド）
**新規**: `docs/tutorials/`

移動候補:
- specifications/01-project-overview.md → tutorials/
- README.md の「はじめに」セクションを抽出

---

### How-to（手順・実践ガイド）
**統合**: `docs/how-to/`（processes + guidelines の実践系を統合）

**移動計画**:
```
processes/DEPLOYMENT_OPERATIONS.md → how-to/deploy-to-production.md
processes/STUDENT_DEPLOYMENT_GUIDE.md → how-to/deploy-for-students.md
processes/EMERGENCY_RECOVERY.md → how-to/emergency-recovery.md
processes/REFACTORING_SAFETY.md → how-to/refactor-safely.md
processes/AUTOMATION_GUIDE.md → how-to/setup-automation.md

guidelines/META_AI_TROUBLESHOOTING.md → how-to/troubleshoot-meta-ai.md
guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md → how-to/understand-scheduler-5min.md
guidelines/DURABILITY_TESTING_GUIDE.md → how-to/test-durability.md
guidelines/SCENARIO_VISUALIZATION_GUIDE.md → how-to/visualize-scenarios.md
```

**保持（原則系はguidelinesに残す）**:
```
guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md (原則)
guidelines/AI_GRAMMAR_QUESTION_CREATION.md (原則)
guidelines/grammar/ (原則＋仕様)
guidelines/passage/ (原則＋仕様)
```

---

### Explanation（概念・背景・設計）
**統合**: `docs/explanation/`（design + roadmap + 一部reports）

**移動計画**:
```
design/ → explanation/design/
roadmap/ → explanation/roadmap/
reports/UNIT_STRUCTURE_ERROR_CORRECTION_PLAN.md → explanation/architecture/
```

---

### Reference（仕様・API・固定情報）
**統合**: `docs/reference/`（specifications + references + data）

**移動計画**:
```
specifications/ → reference/specifications/
references/ → reference/official/ (公式資料)
data/ → reference/data/
```

**例外（品質仕様は別扱い）**:
```
specifications/QUESTION_SCHEDULER_SPEC.md → reference/meta-ai/scheduler-spec.md
```

---

## 🎯 段階的実装計画（6フェーズ）

### Phase 0: 準備（リスク最小化）✅ **最優先**

**目的**: 破壊的変更を防ぐ安全網を構築

**実施内容**:
1. ✅ **Front-Matter追加**（主要30ファイル）
   ```yaml
   ---
   canonical: docs/guidelines/META_AI_TROUBLESHOOTING.md
   status: stable
   lastUpdated: 2025-12-19
   references:
     - .aitk/instructions/meta-ai-priority.instructions.md
     - tests/simulation/README.md
   ---
   ```

2. ✅ **リンクチェッカーCI追加**
   ```yaml
   # .github/workflows/link-checker.yml
   name: Documentation Links Check
   on: [pull_request]
   jobs:
     check-links:
       runs-on: ubuntu-latest
       steps:
         - uses: gaurav-nelson/github-action-markdown-link-check@v1
   ```

3. ✅ **移動禁止リスト作成**
   ```
   # docs/.donotmove
   guidelines/META_AI_TROUBLESHOOTING.md
   guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md
   specifications/QUESTION_SCHEDULER_SPEC.md
   quality/QUESTION_SCHEDULER_QA_PIPELINE.md
   references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md
   ```

**完了条件**: CI通過 + 移動禁止リスト承認

**所要時間**: 1時間

---

### Phase 1: サブフォルダREADME整備 ✅ **並行実施可**

**目的**: ナビゲーション改善（移動なし）

**実施内容**:
1. 各サブフォルダに README.md 追加
   - guidelines/README.md
   - specifications/README.md
   - quality/README.md
   - processes/README.md

2. 役割と目次を明記
   - Diátaxis分類を記載
   - ファイル一覧とカテゴリー

**リスク**: なし（新規ファイル追加のみ）

**所要時間**: 30分

---

### Phase 2: Low Risk移動（archive, reports）

**目的**: リスクの低い履歴・レポート類から開始

**実施内容**:
```bash
# 1. archiveは現状維持（既に整理済み）

# 2. reportsをexplanation/reportsに統合検討
git mv docs/reports docs/explanation/reports
```

**リンク更新箇所**: 5箇所未満

**検証**:
- `npm run test` 全通過
- リンクチェッカー通過
- 手動で主要ページ確認

**ロールバック**:
```bash
git revert HEAD
```

**所要時間**: 30分

---

### Phase 3: Medium Risk移動（processes → how-to）

**目的**: 手順書を how-to/ に統合

**実施内容**:
```bash
# 1. how-to/ ディレクトリ作成
mkdir -p docs/how-to/deployment
mkdir -p docs/how-to/maintenance

# 2. 段階的移動（1ファイルずつコミット）
git mv docs/processes/DEPLOYMENT_OPERATIONS.md docs/how-to/deployment/production.md
git commit -m "docs: Move DEPLOYMENT_OPERATIONS to how-to/deployment/"

# 3. リンク更新（一括）
find . -name "*.md" -type f -exec sed -i '' \
  's|docs/processes/DEPLOYMENT_OPERATIONS.md|docs/how-to/deployment/production.md|g' {} +
git commit -m "docs: Update links to DEPLOYMENT_OPERATIONS"

# 4. instructions更新
vi .aitk/instructions/security-best-practices.instructions.md
git commit -m "docs: Update instruction links"
```

**リンク更新箇所**: 10-15箇所

**検証手順**:
1. `npm run test` 全通過
2. `npm run build` 成功
3. リンクチェッカー通過
4. 手動確認:
   - README.md のリンク
   - .aitk/instructions/ のリンク
   - tests/ のリンク

**ロールバック**:
```bash
git revert HEAD~3..HEAD
```

**所要時間**: 1.5時間

---

### Phase 4: High Risk移動（guidelines → how-to 一部）⚠️ **慎重に**

**目的**: 実践系ガイドを how-to/ に移動（原則系は残す）

**実施内容**:
```bash
# 移動対象（実践系のみ）
git mv docs/guidelines/META_AI_TROUBLESHOOTING.md \
  docs/how-to/meta-ai/troubleshoot.md

git mv docs/guidelines/QUESTION_SCHEDULER_QUICK_GUIDE.md \
  docs/how-to/meta-ai/quick-guide.md

# 保持（原則系）
# guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md
# guidelines/AI_GRAMMAR_QUESTION_CREATION.md
# guidelines/grammar/
# guidelines/passage/
```

**⚠️ 重要**: メタAIトライアドの移動

**リンク更新箇所**: 30+ 箇所

**詳細検証手順**:
1. `grep -r "META_AI_TROUBLESHOOTING" . --include="*.md" --include="*.ts" --include="*.tsx"`
2. 全箇所を手動確認してリスト化
3. 一括置換スクリプト作成
4. Dry-run実行
5. 実行 + コミット
6. テスト全実行
7. 手動確認（10箇所）

**ロールバック**:
```bash
# Phase 4専用ブランチで実施
git checkout -b phase4-guidelines-migration
# 問題発生時
git checkout main
git branch -D phase4-guidelines-migration
```

**所要時間**: 3時間

---

### Phase 5: specifications → reference/

**目的**: 仕様書を reference/ に統合

**実施内容**:
```bash
# 1. reference/specifications/ 作成
mkdir -p docs/reference/specifications
mkdir -p docs/reference/meta-ai

# 2. 段階的移動
git mv docs/specifications/QUESTION_SCHEDULER_SPEC.md \
  docs/reference/meta-ai/scheduler-spec.md

git mv docs/specifications/*.md docs/reference/specifications/
```

**リンク更新箇所**: 50+ 箇所

**所要時間**: 4時間

---

### Phase 6: トップ目次のDiátaxis再編

**目的**: docs/README.md を役割別に再構成

**実施内容**:
```markdown
# 高校受験英語学習アプリ - ドキュメント

## 📚 ドキュメント体系（Diátaxis）

### 🎓 Tutorials（学び始める）
初めての方向け・学習順序ガイド
- [プロジェクト概要](./tutorials/project-overview.md)
- [開発環境セットアップ](./tutorials/setup.md)

### 🔧 How-to（実践する）
具体的な手順書・トラブルシューティング
- **メタAI（QuestionScheduler）**
  - [5分クイックガイド](./how-to/meta-ai/quick-guide.md)
  - [トラブルシューティング](./how-to/meta-ai/troubleshoot.md)
- **デプロイ**
  - [本番デプロイ](./how-to/deployment/production.md)
  - [生徒向けデプロイ](./how-to/deployment/students.md)
  - [緊急復旧](./how-to/maintenance/emergency-recovery.md)

### 📖 Explanation（理解を深める）
概念・背景・設計思想
- [アダプティブ学習AI設計](./explanation/design/adaptive-learning-design.md)
- [品質原則](./explanation/principles/content-quality.md)

### 📋 Reference（調べる）
仕様・API・固定情報
- **メタAI**
  - [QuestionScheduler仕様](./reference/meta-ai/scheduler-spec.md)
  - [品質保証パイプライン](./reference/meta-ai/qa-pipeline.md)
- **文法データ**
  - [NEW HORIZON単元構成](./reference/official/new-horizon-units.md)
  - [文法品質ガイドライン](./reference/grammar/quality-guidelines.md)
```

**所要時間**: 2時間

---

## 🔍 検証マトリクス

### 自動検証（CI）

| チェック項目 | ツール | 実行タイミング |
|------------|--------|--------------|
| Markdownリンク | markdown-link-check | PR時 |
| Front-Matter | custom script | PR時 |
| 孤立ファイル | custom script | 週次 |
| デッドリンク | broken-link-checker | 週次 |

### 手動検証（各Phase完了時）

| 確認項目 | 確認方法 |
|---------|---------|
| メタAIトライアド | tests/simulation/ 実行 |
| 文法品質システム | scripts/ 実行 |
| デプロイガイド | README.md リンククリック |
| instructions参照 | .aitk/instructions/ 全ファイル確認 |

---

## 📦 ロールバック戦略

### 即座のロールバック（Phase単位）

```bash
# 各Phaseは専用ブランチで実施
git checkout -b phase3-processes-migration
# ... 作業 ...
git checkout main
git merge phase3-processes-migration  # 問題なければマージ

# 問題発生時
git checkout main
git branch -D phase3-processes-migration
```

### 段階的ロールバック（ファイル単位）

```bash
# 特定ファイルのみ戻す
git checkout HEAD~1 -- docs/how-to/deployment/production.md
git checkout HEAD~1 -- .aitk/instructions/security-best-practices.instructions.md
git commit -m "Revert: DEPLOYMENT_OPERATIONS migration"
```

---

## ⏱️ 総所要時間見積もり

| Phase | 所要時間 | リスク | 依存関係 |
|-------|---------|-------|---------|
| Phase 0 | 1時間 | なし | なし |
| Phase 1 | 0.5時間 | なし | Phase 0 |
| Phase 2 | 0.5時間 | 低 | Phase 0 |
| Phase 3 | 1.5時間 | 中 | Phase 0 |
| Phase 4 | 3時間 | 高 | Phase 0, 3 |
| Phase 5 | 4時間 | 高 | Phase 0, 4 |
| Phase 6 | 2時間 | 低 | Phase 0-5 |
| **合計** | **12.5時間** | - | - |

**推奨実施ペース**: 週1-2 Phase（3-4週間で完了）

---

## ✅ 完了条件

### Phase 0
- [ ] Front-Matter追加（30ファイル）
- [ ] リンクチェッカーCI追加
- [ ] 移動禁止リスト作成

### Phase 1
- [ ] サブフォルダREADME（4ファイル）

### Phase 2-6
- [ ] 各Phase完了
- [ ] リンク更新完了
- [ ] テスト全通過
- [ ] 手動検証完了

### 最終確認
- [ ] instructions → docs 全リンク確認
- [ ] README.md → docs 全リンク確認
- [ ] tests/ → docs 全リンク確認
- [ ] CI/CD通過
- [ ] デプロイ成功

---

## 📌 次のアクション

**即座に実施**: Phase 0（準備）

1. Front-Matter追加スクリプト作成
2. リンクチェッカーCI追加
3. 移動禁止リスト作成
4. ユーザー承認待ち

**承認後**: Phase 1-6を順次実施

---

**最終更新**: 2025-12-19  
**ステータス**: Draft - ユーザー承認待ち
