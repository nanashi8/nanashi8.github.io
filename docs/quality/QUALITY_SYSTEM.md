---
canonical: docs/quality/QUALITY_SYSTEM.md
status: stable
lastUpdated: 2025-12-19
diataxisCategory: reference
references:
  - .aitk/instructions/code-quality.instructions.md
  - README.md
  - docs/maintenance/SELF_MANAGING_PROJECT.md
  - docs/design/PROJECT_STRUCTURE_VALIDATION.md
  - docs/quality/INTEGRATED_QUALITY_PIPELINE.md
doNotMove: true
---

# 品質保証システム - 統合ガイド

**最終更新**: 2025-12-19  
**対象**: 英語学習アプリ (nanashi8.github.io)  
**Phase**: Phase 1-2リファクタリング完了

---

## 📋 目次

1. [概要](#概要)
1. [品質パイプライン構成](#品質パイプライン構成)
1. [テスト戦略](#テスト戦略)
1. [システム健康診断](#システム健康診断)
1. [データ品質検証](#データ品質検証)
1. [Git Hooks](#git-hooks)
1. [CI/CD](#cicd)
1. [品質ツール一覧](#品質ツール一覧)
1. [クイックスタート](#クイックスタート)
1. [品質基準](#品質基準)
1. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### 目的

破壊的変更を防ぎ、安定したコード品質とデータ品質を維持するための自動化システム

### 原則

- **自動化優先**: 手動チェックに依存しない
- **早期発見**: コミット前にエラーを検出
- **段階的実行**: 高速チェック → 完全テストの順で実行
- **明確なフィードバック**: エラー原因を即座に特定
- **定期メンテナンス**: 週次の健康診断で技術的負債を検出
- **実装ベース品質**: JSON・CSV・TXT形式に完全対応

### 導入経緯

**2025年11月**: CSSリファクタでクイズ機能が破壊  
→ **対策**: TypeScript型チェック + ESLint + Playwright + Git Hooks導入  
→ **成果**: 破壊的変更の事前検出に成功

**2025年12月**: コードベース肥大化と重複コードの増加  
→ **対策**: システム健康診断パイプライン導入  
→ **成果**: 型定義重複、大きすぎるファイル、localStorage不整合を自動検出

**2025年12月**: Phase 1-2リファクタリング完了  
→ **成果**: ディレクトリ構造整理（11ディレクトリ）、カスタムフック作成（6個）、型定義分割（5ファイル）

---

## 品質パイプライン構成

### 全体フロー

```
開発中
  ↓
コード編集
  ↓
保存時: ESLint自動実行 (VS Code)
  ↓
git add
  ↓
git commit
  ↓
Pre-commit Hook 🛡️
  ├─ TypeScript型チェック (5秒)
  ├─ CSS Lint (3秒)
  └─ ビルドチェック (2秒)
  ↓
コミット成功
  ↓
git push
  ↓
Pre-push Hook 🛡️
  └─ Smart Test (変更関連テストのみ)
  ↓
GitHub Actions CI 🤖
  ├─ TypeScript型チェック
  ├─ CSS Lint
  ├─ ビルドチェック
  ├─ Playwright E2Eテスト
  ├─ データ品質検証
  └─ システム健康診断 (週次)
  ↓
問題検出時
  ↓
GitHubイシュー自動作成
  ├─ ラベル: health-check, maintenance
  ├─ 優先度付き
  └─ 対応チェックリスト
  ↓
デプロイ (main branch)
```

### 実行タイミング

| チェック | ローカル (pre-commit) | ローカル (pre-push) | GitHub Actions | 頻度 |
|---------|---------------------|-------------------|----------------|------|
| TypeScript型チェック | ✅ (5秒) | ❌ | ✅ | 毎コミット |
| CSS Lint | ✅ (3秒) | ❌ | ✅ | 毎コミット |
| ビルド | ✅ (2秒) | ❌ | ✅ | 毎コミット |
| Smart Test | ❌ | ✅ (10-30秒) | ❌ | 毎プッシュ |
| Playwright E2E | ❌ | ❌ | ✅ | PR時/プッシュ時 |
| データ品質検証 | ❌ | ❌ | ✅ | PR時 |
| システム健康診断 | ✅ (10秒) | ❌ | ✅ | 週次 |

---

## テスト戦略

### 1. TypeScript型チェック

**目的**: 型エラーの早期検出

```bash
# 実行コマンド
npm run typecheck

# 内容
tsc --noEmit
```

**検出対象**:
- 型の不一致
- 未定義変数の参照
- nullableチェック漏れ
- 関数の引数/戻り値の型エラー

**成果**:
- 2025年12月11日時点: **0エラー**（Phase 1-2完了後）
- strict mode有効化済み

### 2. ESLint

**目的**: コード品質とReact Hooksルールの検証

```bash
# 実行コマンド
npm run lint

# 自動修正
npm run lint:fix
```

**検出対象**:
- React Hooksの依存配列エラー
- 未使用変数
- console.log残存
- import順序

**現状**: 0エラー、0警告

### 3. CSS Lint

**目的**: CSS品質とBEM命名規約の検証

```bash
# 実行コマンド
npm run lint:css
```

**検出対象**:
- 重複セレクタ
- ハードコード値（CSS変数未使用）
- 深いネスト（3階層以上）

**現状**: 0エラー

### 4. Playwright E2Eテスト

**目的**: 実際のユーザー操作フローの検証

```bash
# 実行コマンド
npm run test:e2e

# ヘッドレスモード
npm run test:e2e:headless
```

**テストケース**:
- 超高速スモークテスト（基本動作確認）
- タブ切り替えテスト
- クイズ機能テスト
- データ保存/復元テスト

**実行環境**: Chromium, Firefox, WebKit

### 5. Smart Test（スマートテスト）

**目的**: 変更に関連するテストのみを実行して高速化

```bash
# 実行コマンド
npm run test:smart
# または
bash scripts/smart-test.sh
```

**動作**:
1. Git diffで変更ファイルを検出
1. 変更タイプを分類（CSS/TypeScript/データ/設定）
1. 関連テストのみ実行
1. 変更が不明な場合は基本テストを実行

**メリット**:
- テスト時間を50-80%削減
- pre-push hookで使用（毎回全テスト不要）
- CI/CDでは全テスト実行（完全性保証）

---

## システム健康診断

### 目的

技術的負債の早期発見と予防的メンテナンス

### 実行方法

```bash
# 週次実行（推奨: 毎週月曜日）
bash scripts/health-check.sh

# GitHub Actionsで自動実行（毎週日曜日 0:00 JST）
```

### 検証項目

#### 1. コードベース健全性

**チェック内容**:
- 巨大ファイルの検出（500行以上）
- 複雑度の高い関数
- 重複コードの検出
- 循環依存の検出

**基準**:
- ファイルサイズ: 500行以下推奨
- 関数の複雑度: Cyclomatic Complexity 10以下
- 重複コード: 10行以上の重複は要リファクタ

#### 2. 型定義品質

**チェック内容**:
- 重複型定義の検出
- anyの使用箇所
- 未使用型定義

**Phase 1-2成果**:
- 型定義を5ファイルに分割（`@/types/*`）
- 重複型定義を統合
- any使用を0に削減

#### 3. カスタムフック品質

**チェック内容**:
- 依存配列の検証
- メモ化の適切性
- エラーハンドリング

**Phase 1-2成果**:
- 6個のカスタムフック作成（485行）
- useVocabularyQuiz (81行)
- useSpeechSynthesis (88行)
- useGrammarQuiz (77行)
- useWordQuiz (82行)
- useSettings (72行)
- useReadingComprehension (85行)

#### 4. localStorage整合性

**チェック内容**:
- 使用されているキーの一覧
- データ構造の検証
- バージョン管理

**検出項目**:
- 未使用キー
- 命名規則違反
- データ型の不整合

#### 5. 依存関係健全性

**チェック内容**:
- npm audit（脆弱性チェック）
- 未使用パッケージの検出
- バージョン不整合

---

## データ品質検証

### 全タブ統合検証

**実行コマンド**:
```bash
# 全タブを検証
python3 scripts/validate_all_content.py

# 特定タブのみ検証
python3 scripts/validate_all_content.py --type grammar
python3 scripts/validate_all_content.py --type translation
python3 scripts/validate_all_content.py --type spelling
python3 scripts/validate_all_content.py --type reading

# JSON出力
python3 scripts/validate_all_content.py --export quality_report.json
```

### タブ別検証仕様

#### 1. 文法問題 (Grammar)

**対象ファイル**:
- `verb-form-questions-grade{1,2,3}.json`
- `fill-in-blank-questions-grade{1,2,3}.json`
- `sentence-ordering-grade{1,2,3}.json`

**検証項目**:
- ✅ `sentence` フィールドの重複チェック
- ✅ `correctOrder` フィールドの重複チェック (G3)
- ✅ グレード別・ファイルタイプ別の品質率

**品質目標**: 1,800/1,800 = **100%**

#### 2. 和訳問題 (Translation)

**対象ファイル**:
- `translation-quiz-grade{1,2,3}.json`

**検証項目**:
- ✅ `english` フィールドの重複チェック
- ✅ `japanese` フィールドの重複チェック
- ✅ 英文と日本語訳の対応関係

**品質目標**: 100% (英文・日本語訳ともに)

#### 3. スペル問題 (Spelling)

**対象ファイル**:
- `spelling-quiz-grade{1,2,3}.json`

**検証項目**:
- ✅ `word` フィールドの重複チェック
- ✅ グレード別の単語ユニーク度
- ✅ 単語の難易度分布

**品質目標**: 100%

#### 4. 長文読解 (Reading)

**対象ファイル**:
- `reading-passages-grade{1,2,3}.json`

**検証項目**:
- ✅ `title` フィールドの重複チェック (パッセージ)
- ✅ `question` フィールドの重複チェック (質問)
- ✅ パッセージと質問の対応関係
- ✅ 質問の多様性（同じ質問文の使い回しを防ぐ）

**品質目標**: 100% (パッセージ・質問ともに)

### 現在の品質状況（2025年12月11日）

```
文法問題:         1,800/1,800 = 100.00% ✅
語彙:             7,830/7,830 = 100.00% ✅
長文タイトル:        10/10    = 100.00% ✅
長文英文品質:     平均74.6/100 ⚠️
文法・和訳タブ:    1,200問    = 100.00% ✅（エラー0件）
```

---

## Git Hooks

### Pre-commit Hook

**実行内容**:
1. TypeScript型チェック（5秒）
1. CSS Lint（3秒）
1. ビルドチェック（2秒）

**エラー時の挙動**:
- コミットを中断
- エラーメッセージを表示
- 修正後に再コミット

**設定場所**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Pre-commit チェック開始..."

# TypeScript型チェック
npm run typecheck || exit 1

# CSS Lint
npm run lint:css || exit 1

# ビルドチェック
npm run build || exit 1

echo "✅ すべてのチェックが完了しました"
```

### Pre-push Hook

**実行内容**:
1. Smart Test（変更関連テストのみ、10-30秒）

**スキップ方法**:
```bash
# 緊急時のみ使用
git push --no-verify
```

**設定場所**: `.husky/pre-push`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Pre-push チェック開始..."

# Smart Test実行
npm run test:smart || {
  echo "❌ テストに失敗しました"
  echo "💡 強制的にプッシュする場合は git push --no-verify を使用してください"
  exit 1
}

echo "✅ テストが完了しました"
```

---

## CI/CD

### GitHub Actions ワークフロー

**設定ファイル**: `.github/workflows/ci.yml`

#### ワークフロー1: CI Check（毎プッシュ時）

```yaml
name: CI Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: TypeScript型チェック
        run: npm run typecheck
      
      - name: CSS Lint
        run: npm run lint:css
      
      - name: ビルドチェック
        run: npm run build
      
      - name: Playwright E2Eテスト
        run: npm run test:e2e:headless
      
      - name: データ品質検証
        run: python3 scripts/validate_all_content.py
```

#### ワークフロー2: Weekly Health Check（毎週日曜日）

```yaml
name: Weekly Health Check

on:
  schedule:
    - cron: '0 15 * * 0'  # 毎週日曜日 0:00 JST

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: システム健康診断
        run: bash scripts/health-check.sh
      
      - name: イシュー作成（問題検出時）
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🏥 システム健康診断: 問題検出',
              body: '詳細はActionsログを確認してください',
              labels: ['health-check', 'maintenance']
            })
```

---

## 品質ツール一覧

### 検証ツール（6つ）

| ツール | 機能 | 実行コマンド |
|-------|------|------------|
| `validate_all_content.py` | 統合品質検証（全タブ） | `python3 scripts/validate_all_content.py` |
| `validate_passage_quality.py` | 長文詳細検証 | `python3 scripts/validate_passage_quality.py` |
| `validate_grammar_translations.py` | 文法・和訳タブ検証 | `python3 scripts/validate_grammar_translations.py` |
| `validate_ui_specifications.py` | UI仕様準拠検証 | `python3 scripts/validate_ui_specifications.py` |
| `validate_design_system.py` | デザインシステム検証 | `python3 scripts/validate_design_system.py` |
| `check_quality_regression.py` | 品質低下検出 | `python3 scripts/check_quality_regression.py` |

### 修正ツール（6つ）

| ツール | 機能 | 実行コマンド |
|-------|------|------------|
| `fix_vocabulary_duplicates.py` | 語彙重複修正 | `python3 scripts/fix_vocabulary_duplicates.py` |
| `fix_hardcoded_colors.py` | 色の自動修正 | `python3 scripts/fix_hardcoded_colors.py` |
| `fix_hardcoded_typography.py` | タイポグラフィ自動修正 | `python3 scripts/fix_hardcoded_typography.py` |
| `fix_hardcoded_spacing.py` | スペーシング自動修正 | `python3 scripts/fix_hardcoded_spacing.py` |
| `fix_rgba_colors.py` | RGBA色のCSS変数化 | `python3 scripts/fix_rgba_colors.py` |
| `auto_improve_quality.py` | 自動品質改善 | `python3 scripts/auto_improve_quality.py` |

### レポートツール（1つ）

| ツール | 機能 | 実行コマンド |
|-------|------|------------|
| `generate_quality_report.py` | 品質レポート生成 | `python3 scripts/generate_quality_report.py` |

### その他ツール

| ツール | 機能 | 実行コマンド |
|-------|------|------------|
| `health-check.sh` | システム健康診断 | `bash scripts/health-check.sh` |
| `smart-test.sh` | スマートテスト | `bash scripts/smart-test.sh` |

---

## クイックスタート

### 日常的な開発

```bash
# コンテンツ編集後
python3 scripts/auto_improve_quality.py        # 自動修正
python3 scripts/validate_all_content.py        # 検証

# フロントエンド開発
npm run lint:fix                               # ESLint自動修正
npm run format                                 # Prettierフォーマット
npm run typecheck                              # TypeScript型チェック
npm test                                       # テスト実行

# Gitコミット（自動チェック実行）
git add .
git commit -m "Your changes"                   # → Huskyが自動実行
git push                                       # → Smart Testが自動実行
```

### リリース前

```bash
# 完全検証
python3 scripts/validate_all_content.py
python3 scripts/check_quality_regression.py
python3 scripts/generate_quality_report.py

# フロントエンド完全テスト
npm run typecheck
npm run lint
npm run build
npm run test:e2e

# システム健康診断
bash scripts/health-check.sh
```

### 品質改善

```bash
# 問題特定
python3 scripts/validate_passage_quality.py
python3 scripts/validate_all_content.py

# 自動修正
python3 scripts/auto_improve_quality.py
npm run lint:fix

# 手動調整（必要に応じて）

# 再検証
python3 scripts/validate_all_content.py
npm run typecheck
```

---

## 品質基準

### コードベース品質

| 項目 | 基準 | 現状 |
|------|------|------|
| TypeScript型エラー | 0エラー | ✅ 0エラー |
| ESLintエラー | 0エラー | ✅ 0エラー |
| ESLint警告 | 0警告 | ✅ 0警告 |
| CSSリントエラー | 0エラー | ✅ 0エラー |
| ビルドエラー | 0エラー | ✅ 0エラー |
| ファイルサイズ | 500行以下推奨 | ✅ 準拠 |
| 関数複雑度 | CC 10以下 | ✅ 準拠 |

### データ品質

| 項目 | 基準 | 現状 |
|------|------|------|
| 文法問題重複 | 0% | ✅ 0% (1,800/1,800) |
| 語彙重複 | 0% | ✅ 0% (7,830/7,830) |
| 和訳問題重複 | 0% | ✅ 0% |
| スペル問題重複 | 0% | ✅ 0% |
| 長文タイトル重複 | 0% | ✅ 0% (10/10) |
| 長文質問重複 | 0% | ✅ 0% |

### テスト品質

| 項目 | 基準 | 現状 |
|------|------|------|
| E2Eテスト成功率 | 100% | ⚠️ 要修正 |
| ユニットテスト成功率 | 100% | ✅ 100% |
| コードカバレッジ | 80%以上推奨 | 📊 測定中 |

---

## トラブルシューティング

### Pre-commit hookが失敗する

#### 原因1: TypeScript型エラー

```bash
# エラー箇所を確認
npm run typecheck

# VS Codeで該当ファイルを開いて修正
code src/path/to/file.ts
```

#### 原因2: CSS Lint エラー

```bash
# エラー箇所を確認
npm run lint:css

# 手動修正後に再コミット
```

#### 原因3: ビルドエラー

```bash
# ビルドログを確認
npm run build

# エラーメッセージを読んで修正
```

### データ品質検証が失敗する

#### 重複データの修正

```bash
# 重複箇所を特定
python3 scripts/validate_all_content.py --type grammar

# 自動修正（可能な場合）
python3 scripts/auto_improve_quality.py

# 手動修正（必要な場合）
# JSONファイルを開いて重複を削除

# 再検証
python3 scripts/validate_all_content.py
```

### Smart Testが失敗する

#### スキップして強制プッシュ

```bash
# 緊急時のみ使用
git push --no-verify
```

#### 問題の特定と修正

```bash
# 変更内容を確認
git diff HEAD~1

# 関連テストを手動実行
npm run test:e2e

# 問題を修正後に再プッシュ
git add .
git commit -m "fix: テスト失敗の修正"
git push
```

### ユニットテストで `Cannot redefine property: Symbol($$jest-matchers-object)` が出る

**症状**: Vitest実行時に `Cannot redefine property: Symbol($$jest-matchers-object)` で落ちる。

**典型原因**: Jest系の `expect` 拡張が同一プロセス内で二重に登録される（例: Playwright/Jest系ツールの混入、IDEのテスト実行機構がVitestではなく別ランナーとして実行している、など）。

**回避策**:

```bash
# ユニットテストは Vitest を直接起動する（推奨）
npm run test:unit

# 1ファイルだけ実行したい場合
./node_modules/.bin/vitest run --config vitest.config.ts tests/unit/your.test.ts
```

**前提**: Playwright(E2E)は `tests/**/*.spec.ts(x)` を使用し、Vitest側は `vitest.config.ts` の `test.include` に含まれるパターンのみを対象にする（E2Eの混入を避ける）。

### システム健康診断で問題が検出された

#### 巨大ファイルの分割

```bash
# 該当ファイルを特定
bash scripts/health-check.sh

# リファクタリング
# - 関数を別ファイルに分割
# - カスタムフックを作成
# - 型定義を @/types/ に移動

# 再検証
bash scripts/health-check.sh
```

#### 重複型定義の統合

```bash
# 重複を特定
grep -r "interface QuizQuestion" src/

# 統合先を決定（例: @/types/quiz.ts）
# 重複定義を削除
# import文を更新

# TypeScript型チェック
npm run typecheck
```

---

## 関連ドキュメント

### 品質関連

- [品質チェックリスト](QUALITY_CHECKLIST.md) - 作業タイプ別チェック項目
- [エラーゼロポリシー](ERROR_ZERO_POLICY_IMPLEMENTATION.md) - エラー0維持の方針
- [文法品質システム](GRAMMAR_QUALITY_SYSTEM.md) - 文法問題の品質基準と管理フロー

### 開発関連

- [プロジェクトREADME](../../README.md) - プロジェクト全体概要
- [開発ガイドライン](../../.github/DEVELOPMENT_GUIDELINES.md) - コーディング規約
- [CSS開発ガイドライン](../development/CSS_DEVELOPMENT_GUIDELINES.md) - CSS規約
- [TypeScript開発ガイドライン](../development/TYPESCRIPT_DEVELOPMENT_GUIDELINES.md) - TypeScript規約

### Instructions（AI開発指示書）

- [コア原則](../../.aitk/instructions/core-principles.instructions.md) - プロジェクト基本方針
- [プロジェクト構造](../../.aitk/instructions/project-structure.instructions.md) - ディレクトリ構造
- [コード品質](../../.aitk/instructions/code-quality.instructions.md) - エラーゼロポリシー詳細
- [カスタムフックパターン](../../.aitk/instructions/patterns/custom-hooks-patterns.instructions.md) - 6個のフック詳細

---

## 改訂履歴

- 2025-12-06: QUALITY_PIPELINE.md初版作成
- 2025-12-11: QUALITY_SYSTEM.mdに統合（INTEGRATED_QUALITY_PIPELINE.md、QUALITY_SYSTEM.mdを統合）
- 2025-12-11: Phase 1-2リファクタリング完了内容を反映
