---
description: ドキュメント命名規則の強制（AI作業時の必須チェック）- P0最重要
applyTo: '**/*.md'
---

# ドキュメント命名規則 強制装置（AI用）

## 🎯 目的

AI（エージェント）がドキュメントを作成する際、命名規則違反を**絶対に防止**する。

## 🚨 【最優先】ドキュメント作成前の必須確認

**ドキュメント（.mdファイル）を `create_file` ツールで作成する前に、必ずこのチェックリストを実行してください。**

### チェックリスト

- [ ] **ステップ1**: ファイルを配置するディレクトリの命名規則を確認した
- [ ] **ステップ2**: 命名規則に従ったファイル名を決定した
- [ ] **ステップ3**: ファイルを正しい名前で作成した

### 失敗すると何が起きるか

- ❌ Pre-commit Hookでコミットがブロックされる
- ❌ ユーザーが手動でファイル名を修正する必要がある
- ❌ ドキュメントの整理整頓が崩れる
- ❌ 「AIがルールを守っていない」と信頼を失う

---

## 📋 ディレクトリ別命名規則（クイックリファレンス）

**ファイル作成前に、必ずこの表を確認してください。**

| ディレクトリ | 命名規則 | 例（正しい） | 例（間違い） |
|-------------|---------|-------------|-------------|
| `docs/specifications/` | `番号-kebab-case.md` | `01-project-overview.md` | `PROJECT_OVERVIEW.md` |
| `docs/guidelines/` | `UPPER_SNAKE_CASE.md` | `META_AI_TROUBLESHOOTING.md` | `meta-ai-troubleshooting.md` |
| `docs/how-to/` | `UPPER_SNAKE_CASE.md` | `TESTING_GUIDE.md` | `testing-guide.md` ⚠️ |
| `docs/references/` | `UPPER_SNAKE_CASE.md` | `QUICK_REFERENCE.md` | `quick-reference.md` |
| `docs/reports/` | `UPPER_SNAKE_CASE.md` | `DATA_QUALITY_REPORT.md` | `data-quality-report.md` |
| `docs/quality/` | `UPPER_SNAKE_CASE.md` | `QUALITY_CHECKLIST.md` | `quality-checklist.md` |
| `docs/plans/` | `UPPER_SNAKE_CASE.md` | `PHASE_1_TASKS.md` | `phase-1-tasks.md` |
| `docs/processes/` | `UPPER_SNAKE_CASE.md` | `AUTOMATION_GUIDE.md` | `automation-guide.md` |
| `docs/maintenance/` | `UPPER_SNAKE_CASE.md` | `SELF_MANAGING_PROJECT.md` | `self-managing-project.md` |
| `docs/features/` | `kebab-case.md` | `random-skip-feature.md` | `RANDOM_SKIP_FEATURE.md` |
| `docs/development/` | `kebab-case.md` または `UPPER_SNAKE_CASE.md` | `setup.md` or `TYPESCRIPT_DEVELOPMENT_GUIDELINES.md` | 判断が必要 |

### 迷ったら

**99%のケースで `UPPER_SNAKE_CASE.md`（全大文字スネークケース）が正解です。**

以下のディレクトリ**のみ**小文字を使用：
- ✅ `docs/specifications/`: `番号-kebab-case.md`
- ✅ `docs/features/`: `kebab-case.md`

---

## 🔍 実際の手順（例: テストガイドを作成）

### ❌ 間違った手順（過去の失敗例）

```typescript
// ユーザー: 「テストガイドを作成してください」
// AI: 「了解しました」

create_file({
  filePath: '/path/to/docs/how-to/testing-guide.md', // ❌ 小文字で作成
  content: '# テスト実践ガイド...'
})

// 結果: Pre-commit Hookでブロック
// → ユーザーが手動修正を強いられる
```

### ✅ 正しい手順

```typescript
// ユーザー: 「テストガイドを作成してください」
// AI: 「了解しました。まず命名規則を確認します」

// ステップ1: ディレクトリの命名規則を確認
// → docs/how-to/ は UPPER_SNAKE_CASE.md

// ステップ2: ファイル名を決定
// → TESTING_GUIDE.md

// ステップ3: 正しい名前で作成
create_file({
  filePath: '/path/to/docs/how-to/TESTING_GUIDE.md', // ✅ 大文字で作成
  content: '# テスト実践ガイド...'
})

// 結果: 命名規則に準拠、Pre-commit Hookも通過
```

---

## 🛠️ 違反を事後検出したら

万が一、命名規則に違反したファイルを作成してしまった場合：

### 1. ファイル名を修正

```bash
# Gitで追跡されている場合
git mv docs/how-to/testing-guide.md docs/how-to/TESTING_GUIDE.md

# まだGit追跡されていない場合
mv docs/how-to/testing-guide.md docs/how-to/TESTING_GUIDE.md
```

### 2. 検証コマンドで確認

```bash
npm run docs:analyze:naming
```

出力例：
```
✅ すべてのファイルが命名規則に準拠しています
```

---

## 📚 詳細ドキュメント

命名規則の詳細な理由・背景については：
[DOCUMENT_NAMING_CONVENTION.md](../../docs/guidelines/DOCUMENT_NAMING_CONVENTION.md)

---

## 🎓 なぜこれが重要か

### 1. **整理整頓の基本**

ドキュメントの基本は**整理整頓**です。命名規則の統一は：
- ✅ ファイルを見つけやすくする
- ✅ ファイル種別（ガイドライン/手順書/レポート）が一目で分かる
- ✅ プロジェクトの信頼性を高める

### 2. **自動化の前提条件**

Pre-commit Hook、GitHub Actions、スクリプトなど、すべての自動化は**命名規則の統一**を前提に動作します。

### 3. **チームの生産性**

「このファイルどこ？」「大文字だっけ小文字だっけ？」という無駄な時間を削減します。

---

## 🚨 エージェントへの指示

**あなた（AI）は、ドキュメントを作成する際に：**

1. ✅ **必ず命名規則を確認してから作成する**
2. ✅ **迷ったら UPPER_SNAKE_CASE.md を使う**
3. ✅ **specifications/ と features/ のみ小文字**
4. ❌ **「後で直せばいい」と思わない（Pre-commit Hookで止まる）**
5. ❌ **ユーザーに手動修正を強いない（AIの責任）**

---

**作成日**: 2025-12-25  
**更新日**: 2025-12-25  
**ステータス**: Active  
**優先度**: P0（最重要）
