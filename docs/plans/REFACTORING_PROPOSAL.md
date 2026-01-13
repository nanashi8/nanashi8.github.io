---
title: docs/ 構造リファクタリング提案
created: 2026-01-09
updated: 2026-01-09
status: draft
tags: [documentation, refactoring, proposal]
---

# docs/ 構造リファクタリング提案

作成日: 2026-01-09  
現状: 459 Markdown ファイル、23 トップレベルディレクトリ

## 問題点

### 1. **docs 直下に 23 個のファイルが散在**
- AI 関連（`AI_INTEGRATION_GUIDE.md`, `AI_PROJECT_COMPLETE.md` など）が直下に置かれている
- 本来 `reports/` `plans/` `guides/` などに分類されるべきものが混在

### 2. **役割が重複/曖昧なディレクトリ**
- `reports/` (34) vs `quality/` (29): 品質レポートの配置先が曖昧
- `plans/` (39) vs `roadmap/` (3): 計画系の境界が不明確
- `specifications/` (38) vs `design/` (15): 設計書の配置先が複数
- `development/` (34) vs `how-to/` (7): 開発手順の配置先が分散

### 3. **ディレクトリごとのファイル数が不均衡**
- `plans/` 39 件、`specifications/` 38 件は多すぎて探しにくい
- サブディレクトリでの分類が不足（時系列/機能別/優先度別など）

### 4. **命名規則の不統一**
- 一部が `UPPER_CASE.md`（docs 直下）
- 一部が `lower-case.md`（サブディレクトリ内）
- 日付付きファイル名（例: `_2025-12-17.md`）の扱いが不統一

---

## 提案するリファクタリング

### 原則
1. **docs 直下には INDEX.md と README.md のみ**（現状は INDEX.md のみ存在）
2. **役割の明確化と統合**（重複を減らす）
3. **大きなディレクトリにはサブ分類を導入**
4. **命名規則の統一**（`kebab-case.md` 推奨）

---

### 具体的な変更案

#### A. docs 直下の整理（23 ファイル → 0〜2 ファイル）

```
docs/
  INDEX.md              # 既存（全体の目次）
  README.md             # 新規（このリポジトリのドキュメント運用ルール）
  
  # 以下を移動:
  AI_*.md              → guides/ または reports/ へ分類移動
  CONSTELLATION_*.md   → features/ または plans/
  GIT_HISTORY_*.md     → reports/
  GOVERNANCE_*.md      → plans/
  HOW_TO_*.md          → how-to/
  IMPLEMENTATION_*.md  → plans/
  MAINTENANCE_*.md     → maintenance/
  ML_*.md              → guides/
  PHASE*.md            → reports/archive/phases/
  PROTOTYPE_*.md       → testing/ または development/
  QUALITY_*.md         → quality/
  SERVANT_*.md         → features/servant/ または specifications/servant/
```

#### B. ディレクトリの統合・再編成

| 現状 | 統合後 | 理由 |
|------|--------|------|
| `reports/` + `quality/` | `reports/` のみ（サブに `quality/`） | 品質レポートも報告の一種 |
| `plans/` + `roadmap/` | `plans/` のみ（サブに `roadmap/`） | roadmap は計画の一種 |
| `specifications/` + `design/` | `specifications/` のみ（サブに `design/`） | 設計は仕様の詳細化 |
| `development/` + `how-to/` | `guides/` に統合 | 開発手順・ガイドを一元化 |

#### C. サブディレクトリの導入（肥大化対策）

```
plans/  (39 ファイル)
  roadmap/              # 長期計画
  features/             # 機能別計画
  archive/              # 完了・古い計画
  
specifications/  (38 ファイル)
  design/               # 設計書
  api/                  # API 仕様
  data/                 # データ構造仕様
  servant/              # Servant 拡張関連
  
reports/  (34 ファイル)
  quality/              # 品質レポート
  phases/               # フェーズ別完了報告
  analysis/             # 分析レポート
  archive/              # 古いレポート
  
guidelines/  (20 ファイル)
  grammar/              # 既存
  passage/              # 既存
  development/          # 開発ガイドライン
  testing/              # テストガイドライン
```

#### D. 命名規則の統一

- **原則**: `kebab-case.md`
- **日付付き**: `feature-name-YYYY-MM-DD.md`（末尾に配置）
- **複数単語**: ハイフン区切り（例: `adaptive-learning-plan.md`）
- **アンダースコアは使わない**（例外: `AI_` のような頭文字略語は許容するが、できれば `ai-` に統一）

---

## 実施の優先順位

### フェーズ 1: 緊急度高（docs 直下の整理）
- [ ] docs 直下の 23 ファイルを適切なディレクトリに移動
- [ ] `INDEX.md` のリンクを更新
- [ ] `README.md` を新規作成（運用ルール記載）

### フェーズ 2: 中期（ディレクトリ統合）
- [ ] `quality/` を `reports/quality/` に統合
- [ ] `roadmap/` を `plans/roadmap/` に統合
- [ ] `design/` を `specifications/design/` に統合
- [ ] `development/` + `how-to/` を `guides/` に統合

### フェーズ 3: 長期（サブ分類の整備）
- [ ] `plans/` にサブディレクトリ導入
- [ ] `specifications/` にサブディレクトリ導入
- [ ] `reports/` にサブディレクトリ導入
- [ ] 古いファイルを `archive/` 配下に移動

### フェーズ 4: 仕上げ（命名規則統一）
- [ ] `UPPER_CASE.md` を `kebab-case.md` にリネーム
- [ ] 日付付きファイルの命名統一
- [ ] 内部リンクの一括修正

---

## 期待される効果

- **検索性向上**: ファイルが適切に分類され、目的のドキュメントを見つけやすい
- **保守性向上**: 新規ドキュメントの配置先が明確で、ルール違反が減る
- **可読性向上**: ディレクトリ構造が直感的で、チーム/AI の理解が速い
- **Git 履歴の整理**: 古いドキュメントが archive に移動し、現行ドキュメントが明確化

---

## 実施するか？

このリファクタリングは「一気にやる」と影響が大きいため、**段階的に実施**するのが推奨です。

**即実施を推奨**: フェーズ 1（docs 直下の整理）  
**要検討**: フェーズ 2〜4（影響範囲を見極めてから）

---

## 次のアクション候補

1. **フェーズ 1 だけ実施**（docs 直下 → 各ディレクトリへの移動）
2. **全フェーズの詳細計画を作成**（影響調査 + 移行スクリプト）
3. **見送り**（現状維持）

どれにしますか？
