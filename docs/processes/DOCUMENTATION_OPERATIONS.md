---
title: ドキュメント運用ルール
created: 2026-01-09
updated: 2026-01-09
status: implemented
tags: [documentation, operations, guidelines]
---

# ドキュメント運用ルール

このファイルは **docs/ ディレクトリへの新規ファイル追加・編集時のルール** を定めます。  
（ドキュメントの目次・索引は [README.md](README.md) または [INDEX.md](../INDEX.md) を参照）

---

## 新規ファイル作成時のフロー

### 1. 配置先の判断

| 内容 | 配置先 | 例 |
|------|--------|-----|
| 機能の仕様を定める | `specifications/` | API仕様、データ構造、システム要件 |
| 実装・テストの結果報告 | `reports/` | 完了報告、分析結果、パフォーマンス計測 |
| 今後の計画・ロードマップ | `plans/` | 機能追加計画、リファクタリング計画 |
| コーディング規約・ルール | `guidelines/` | 命名規則、品質基準、データ形式 |
| 開発環境・手順 | `development/` | セットアップ、ビルド、デプロイ |
| 使い方・操作手順 | `how-to/` | ユーザー向けガイド、設定方法 |
| 品質管理・テスト | `quality/` | テスト計画、品質レポート、CI/CD |
| 技術情報・用語集 | `references/` | 外部仕様、教科書構造、技術用語 |
| ワークフロー | `processes/` | 作業手順、承認フロー、自動化 |
| 保守・メンテナンス | `maintenance/` | 運用手順、障害対応、定期作業 |

**サブディレクトリの活用**
- AI関連 → 該当ディレクトリ内に `ai/` サブフォルダ
- 文法機能 → `guidelines/grammar/`
- パッセージ機能 → `guidelines/passage/`
- 完了済み計画 → `plans/archive/`

### 2. ファイル名の決定

**推奨形式**: `kebab-case.md`

```
✅ 良い例
adaptive-learning-plan.md
api-specification.md
test-coverage-report.md

❌ 避けるべき例（新規ファイル）
AdaptiveLearningPlan.md
ADAPTIVE_LEARNING_PLAN.md
adaptive learning plan.md
```

**日付付きファイル**: `feature-name-YYYY-MM-DD.md`

### 3. Front Matter の追加（必須）

```yaml
---
title: ドキュメントのタイトル
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft | review | implemented | archived
tags: [tag1, tag2, tag3]
---
```

**status の定義**
- `draft`: 執筆中
- `review`: レビュー待ち
- `implemented`: 実装済み・確定
- `archived`: 古い・非推奨

---

## 既存ファイル編集時の注意

### 必須作業
1. Front Matter の `updated` を今日の日付に変更
2. 大きな変更の場合、`status` も更新

### 禁止事項
- **ファイルの移動**: 他ドキュメントからのリンクが切れる
- **ファイル名変更**: リンク切れの原因になる

**例外**: 参照数が 0 のファイルのみ移動可能

**参照数の確認方法**
```bash
grep -r "filename.md" docs --include="*.md" | wc -l
```

---

## docs 直下への配置について

**原則**: docs 直下には新規ファイルを置かない

**許可されるファイル**
- `INDEX.md`（目次）
- `README.md`（Diátaxis ベースの索引）
- `DOCUMENTATION_OPERATIONS.md`（このファイル）
- 例外的な全体横断ドキュメント（要相談）

**理由**: 既存の docs 直下ファイル（23 件）は歴史的経緯で残っているが、新規作成は構造の乱れを防ぐため避ける。

---

## よくある質問

### Q: specifications/ と design/ の使い分けは？
**A**: 
- `specifications/`: 「何を作るか」（機能要件、API、データ構造）
- `design/`: 「どう作るか」（アーキテクチャ、アルゴリズム）

迷ったら `specifications/` へ。

### Q: reports/ と quality/ の使い分けは？
**A**: 
- `reports/`: 実装完了報告、分析結果
- `quality/`: テスト計画、品質レポート、CI/CD

品質に関する内容は `quality/` を優先。

### Q: 古いドキュメントはどうすれば？
**A**: 
1. Front Matter に `status: archived` を追加
2. ファイル冒頭に警告を追加:
   ```markdown
   > ⚠️ **このドキュメントはアーカイブされています**  
   > 最終更新: YYYY-MM-DD  
   > 現在の情報は [新しいドキュメント](link) を参照してください
   ```
3. 参照数が 0 なら `archive/` 配下に移動可能

---

## 関連ドキュメント

- [README.md](README.md) - Diátaxis ベースのドキュメント索引
- [INDEX.md](../INDEX.md) - 自動生成される目次
- [DOCUMENTATION_ORGANIZATION_PLAN.md](../plans/DOCUMENTATION_ORGANIZATION_PLAN.md) - 整理計画（配線を切らない方式）
- [REFACTORING_IMPACT_ANALYSIS.md](../reports/REFACTORING_IMPACT_ANALYSIS.md) - リファクタリング影響分析

---

**作成日**: 2026-01-09  
**更新日**: 2026-01-09
