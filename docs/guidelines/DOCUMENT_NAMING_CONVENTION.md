---
title: ドキュメント命名規則
created: 2025-12-21
updated: 2025-12-21
status: proposed
tags: [guidelines, documentation, naming]
---

# ドキュメント命名規則（Document Naming Convention）

## 📊 現状分析

### 現在のファイル命名パターン

```
全大文字（UPPER_SNAKE_CASE）: 約200ファイル（66%）
  例: QUESTION_SCHEDULER_SPEC.md, META_AI_TROUBLESHOOTING.md
  
番号付き（kebab-case with prefix）: 約40ファイル（13%）
  例: 01-project-overview.md, 15-data-structures.md
  
小文字（kebab-case）: 約30ファイル（10%）
  例: setup.md, deployment.md, random-skip-feature.md
  
その他: 約30ファイル（10%）
  例: README.md, 14AI_INTEGRATION_GUIDE.md
```

**問題点**:
- 大文字・小文字が混在し、一貫性がない
- ファイル種別が名前から判別できない
- リンク時に大文字小文字を間違えやすい
- 検索性が低い

---

## 🎯 提案：命名規則の体系化

### 基本原則

```
【ファイル種別】がファイル名から即座に判別できる
【検索しやすい】統一されたパターン
【リンクしやすい】タイプミスを防ぐ
【並び順】がディレクトリ内で意味を持つ
```

---

## 📁 命名規則（ディレクトリ別）

### 1. specifications/（仕様書）

**形式**: `番号-kebab-case.md`

```
✅ 推奨:
  01-project-overview.md
  15-data-structures.md
  
❌ 非推奨:
  PROJECT_OVERVIEW.md
  DataStructures.md
```

**理由**:
- 番号で読む順序が明確
- 仕様書は順序が重要
- 小文字で統一して検索しやすく

---

### 2. guidelines/（ガイドライン）

**形式**: `UPPER_SNAKE_CASE.md`

```
✅ 推奨:
  META_AI_TROUBLESHOOTING.md
  GRAMMAR_DATA_QUALITY_GUIDELINES.md
  
❌ 非推奨:
  meta-ai-troubleshooting.md
  grammarQualityGuidelines.md
```

**理由**:
- ガイドラインは「権威ある文書」として大文字
- プロジェクト横断で参照される重要度が高い
- 視覚的に目立ち、見つけやすい

**サブフォルダ**: `guidelines/カテゴリ/GUIDELINE_NAME.md`

```
guidelines/
  ├── grammar/
  │   ├── GRAMMAR_DATA_QUALITY_GUIDELINES.md
  │   └── NEW_HORIZON_GRAMMAR_GUIDELINES.md
  └── passage/
      └── PASSAGE_CREATION_GUIDELINES.md
```

---

### 3. references/（リファレンス）

**形式**: `UPPER_SNAKE_CASE.md`

```
✅ 推奨:
  QUICK_REFERENCE.md
  DATA_MANAGEMENT_GUIDE.md
  VS_CODE_SIMPLE_BROWSER_GUIDE.md
  
❌ 非推奨:
  quick-reference.md
  dataManagementGuide.md
```

**理由**:
- リファレンスは頻繁に参照される
- ガイドラインと同等の重要度
- 大文字で視認性を確保

---

### 4. development/（開発ドキュメント）

**形式**: `kebab-case.md` または `UPPER_SNAKE_CASE.md`

```
✅ 推奨（日常的な手順書）:
  setup.md
  deployment.md
  testing-strategy.md
  
✅ 推奨（重要なガイドライン）:
  TYPESCRIPT_DEVELOPMENT_GUIDELINES.md
  CSS_DEVELOPMENT_GUIDELINES.md
  UI_DEVELOPMENT_GUIDELINES.md
  
❌ 非推奨:
  SetupGuide.md
  DEPLOYMENT.md（重要でないのに大文字）
```

**判断基準**:
- **手順書・作業メモ**: kebab-case（小文字）
- **開発ガイドライン**: UPPER_SNAKE_CASE（大文字）

---

### 5. plans/（計画・提案）

**形式**: `UPPER_SNAKE_CASE.md` + オプショナルな日付サフィックス

```
✅ 推奨:
  ADAPTIVE_AI_INTEGRATION_PLAN_2025-12-17.md
  LINK_FIX_PLAN.md
  PHASE_1_TASKS.md
  
❌ 非推奨:
  adaptive-ai-plan.md
  link_fix_plan_20251217.md
```

**理由**:
- 計画書は公式文書として大文字
- 日付は YYYY-MM-DD 形式で末尾に追加

---

### 6. reports/（レポート）

**形式**: `UPPER_SNAKE_CASE.md` + オプショナルな日付

```
✅ 推奨:
  LEARNING_AI_DATAFLOW_VERIFICATION.md
  CONTENT_QUALITY_TESTING_REPORT.md
  DATA_QUALITY_REPORT_2025-12.md
  
❌ 非推奨:
  learning-ai-report.md
  contentQualityReport.md
```

**理由**:
- レポートは成果物として大文字
- 日付サフィックスで履歴管理

---

### 7. quality/（品質管理）

**形式**: `UPPER_SNAKE_CASE.md`

```
✅ 推奨:
  QUALITY_SYSTEM.md
  QUALITY_CHECKLIST.md
  INTEGRATED_QUALITY_PIPELINE.md
  
❌ 非推奨:
  quality-system.md
  qualityChecklist.md
```

**理由**:
- 品質文書は権威性が必要
- プロジェクト全体に影響する重要文書

---

### 8. how-to/（ハウツー）

**形式**: `UPPER_SNAKE_CASE.md`

```
✅ 推奨:
  QUESTION_SCHEDULER_RECOVERY.md
  VS_CODE_SIMPLE_BROWSER_GUIDE.md
  
❌ 非推奨:
  question-scheduler-recovery.md
  vscode-guide.md
```

**理由**:
- ハウツーは手順書だが、重要度が高い
- 緊急時に素早く見つける必要がある

---

### 9. features/（機能ドキュメント）

**形式**: `kebab-case.md`

```
✅ 推奨:
  random-skip-feature.md
  adaptive-learning-feature.md
  
❌ 非推奨:
  RANDOM_SKIP_FEATURE.md
  RandomSkipFeature.md
```

**理由**:
- 機能説明は日常的な参照
- 小文字で気軽にアクセス可能

---

### 10. processes/（プロセス）

**形式**: `UPPER_SNAKE_CASE.md`

```
✅ 推奨:
  DOCS_REORGANIZATION_PLAN.md
  AUTOMATION_GUIDE.md
  REFACTORING_SAFETY.md
  
❌ 非推奨:
  docs-reorganization.md
  automationGuide.md
```

**理由**:
- プロセスは公式手順として大文字
- チーム全体で遵守すべき文書

---

### 11. maintenance/（保守）

**形式**: `UPPER_SNAKE_CASE.md`

```
✅ 推奨:
  SELF_MANAGING_PROJECT.md
  SERVANT_AUTO_FIX_EXPANSION.md
  
❌ 非推奨:
  self-managing-project.md
  servant-auto-fix.md
```

**理由**:
- 保守文書は長期的な参照
- 重要度が高い

---

### 12. archive/（アーカイブ）

**形式**: 元のファイル名を保持

```
✅ 推奨:
  元のファイル名をそのまま保持
  （リネーム不要）
  
理由:
  - アーカイブは履歴として保存
  - 元の命名を変更するとリンクが断線
```

---

## 📋 特殊なファイル名

### README.md

```
✅ 全ディレクトリ:
  README.md（常に大文字）
  
理由:
  - GitHub標準
  - ディレクトリの説明ファイル
```

### INDEX.md

```
✅ docs/ 直下:
  INDEX.md（常に大文字）
  
理由:
  - 総合目次として特別扱い
```

---

## 🔄 リネーム計画

### Phase 1: 分類と優先順位付け

```bash
# リネームが必要なファイルを抽出
find docs/ -name "*.md" | \
  grep -v archive | \
  grep -v README.md
```

### Phase 2: リンク影響分析

```
被参照数10回以上のファイル:
  - リネーム時にリンク一括更新が必須
  - 慎重に実施
  
被参照数5回以下のファイル:
  - リネーム後に個別修正
```

### Phase 3: 段階的リネーム

```
1. archive以外のファイルを分析
2. 命名規則に従ってリネーム計画作成
3. リンク更新スクリプト作成
4. バッチでリネーム実行
5. リンク断線を修正
```

---

## 🛡️ 命名規則の強制

### Pre-commit Hook

```bash
#!/bin/bash
# 新規ファイルが命名規則に従っているかチェック

for file in $(git diff --cached --name-only | grep "^docs/.*\.md$"); do
  dir=$(dirname "$file")
  base=$(basename "$file")
  
  case "$dir" in
    docs/specifications)
      if ! [[ "$base" =~ ^[0-9]{2}-[a-z-]+\.md$ ]]; then
        echo "❌ $file は番号付きkebab-caseにしてください"
        exit 1
      fi
      ;;
    docs/guidelines|docs/references|docs/quality)
      if ! [[ "$base" =~ ^[A-Z_]+\.md$ ]]; then
        echo "❌ $file はUPPER_SNAKE_CASEにしてください"
        exit 1
      fi
      ;;
  esac
done
```

---

## 📊 効果予測

### メリット

✅ **一貫性**: ファイル種別が名前から即座に判別  
✅ **検索性**: パターンが統一され検索が容易  
✅ **リンク精度**: タイプミスが減少  
✅ **保守性**: 新規ファイル追加時の迷いがなくなる  

### デメリット

⚠️ **リネームコスト**: 約100ファイルのリネームが必要  
⚠️ **リンク更新**: 約500箇所のリンク更新が必要  
⚠️ **学習コスト**: チーム全体が新規則を理解する必要  

---

## ✅ 次のステップ

1. **このドキュメントのレビュー**  
   チームで命名規則を合意

2. **リネーム計画作成**  
   影響範囲を分析してリネームリストを作成

3. **リンク更新スクリプト作成**  
   自動化で断線を防止

4. **段階的実施**  
   重要度の低いファイルから開始

5. **Pre-commit Hook設置**  
   今後の規則遵守を自動化

---

## 📝 関連ドキュメント

- [LINK_FIX_PLAN.md](../plans/LINK_FIX_PLAN.md) - リンク修正計画
- [DOCS_REORGANIZATION_PLAN.md](../processes/DOCS_REORGANIZATION_PLAN.md) - ドキュメント整理計画
- [INDEX.md](../INDEX.md) - 総合目次
