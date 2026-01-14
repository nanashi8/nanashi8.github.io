#!/bin/bash
# ドットフォルダ整理・マイグレーションスクリプト
# 使用方法: ./scripts/migrate-dotfolders.sh [--dry-run]

set -e  # エラーで停止

# 色付きログ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 DRY RUN モード: 実際の変更は行いません${NC}"
fi

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

run_cmd() {
    if [[ "$DRY_RUN" == true ]]; then
        echo "  [DRY] $1"
    else
        eval "$1"
    fi
}

# ========================================
# Phase 0: 事前チェック
# ========================================

echo ""
echo "=========================================="
echo "Phase 0: 事前チェック"
echo "=========================================="

# 未コミットの変更がないかチェック
if [[ $(git status --porcelain) ]]; then
    log_error "未コミットの変更があります。先にコミットしてください。"
    exit 1
fi
log_info "Git状態: クリーン"

# 必要なフォルダの存在確認
if [[ ! -d ".ai-instructions" ]]; then
    log_error ".ai-instructions が存在しません"
    exit 1
fi
if [[ ! -d ".aitk" ]]; then
    log_error ".aitk が存在しません"
    exit 1
fi
log_info "必要なフォルダ: 存在確認OK"

# ========================================
# Phase 1: バックアップ作成
# ========================================

echo ""
echo "=========================================="
echo "Phase 1: バックアップ作成"
echo "=========================================="

BACKUP_DIR="backup/dotfolder-migration-$(date +%Y%m%d-%H%M%S)"
run_cmd "mkdir -p $BACKUP_DIR"
run_cmd "cp -r .ai-instructions $BACKUP_DIR/"
run_cmd "cp -r .aitk $BACKUP_DIR/"
if [[ -d ".copilot" ]]; then
    run_cmd "cp -r .copilot $BACKUP_DIR/"
fi
run_cmd "cp -r .vscode $BACKUP_DIR/"
log_info "バックアップ作成: $BACKUP_DIR"

# ========================================
# Phase 2: 新構造の作成
# ========================================

echo ""
echo "=========================================="
echo "Phase 2: 新ディレクトリ構造の作成"
echo "=========================================="

run_cmd "mkdir -p .ai/instructions/{core,quality,workflow,content,security,enforcement}"
run_cmd "mkdir -p .ai/copilot"
run_cmd "mkdir -p .ai/context"
run_cmd "mkdir -p .ai/.data/{history,cache}"
log_info ".ai/ 構造作成完了"

run_cmd "mkdir -p .vscode/.ai-data/cache"
log_info ".vscode/.ai-data/ 構造作成完了"

# ========================================
# Phase 3: ファイル移動（.ai-instructions）
# ========================================

echo ""
echo "=========================================="
echo "Phase 3: .ai-instructions → .ai/instructions/core"
echo "=========================================="

run_cmd "mv .ai-instructions/CRITICAL_RULES.md .ai/instructions/core/"
run_cmd "mv .ai-instructions/SPECIFICATION_ENFORCEMENT.md .ai/instructions/core/"
run_cmd "mv .ai-instructions/UI_CHANGE_APPROVALS.md .ai/instructions/core/"
run_cmd "mv .ai-instructions/css-modification-rules.md .ai/instructions/core/"
log_info "コアルール移動完了"

# ========================================
# Phase 4: ファイル移動（.aitk/instructions）
# ========================================

echo ""
echo "=========================================="
echo "Phase 4: .aitk/instructions → .ai/instructions (カテゴリ分け)"
echo "=========================================="

# コアルール
run_cmd "mv .aitk/instructions/core-principles.instructions.md .ai/instructions/core/"
run_cmd "mv .aitk/instructions/mandatory-spec-check.instructions.md .ai/instructions/core/"
run_cmd "mv .aitk/instructions/ssot-enforcement.instructions.md .ai/instructions/core/"
log_info "コア指示移動完了"

# 品質
run_cmd "mv .aitk/instructions/code-quality.instructions.md .ai/instructions/quality/"
run_cmd "mv .aitk/instructions/test-quality.instructions.md .ai/instructions/quality/"
run_cmd "mv .aitk/instructions/error-zero-policy.instructions.md .ai/instructions/quality/"
run_cmd "mv .aitk/instructions/refactoring-safety.instructions.md .ai/instructions/quality/"
run_cmd "mv .aitk/instructions/refactoring-safety-guide.instructions.md .ai/instructions/quality/"
run_cmd "mv .aitk/instructions/ai-code-quality-checklist.instructions.md .ai/instructions/quality/"
log_info "品質指示移動完了"

# ワークフロー
run_cmd "mv .aitk/instructions/work-management.instructions.md .ai/instructions/workflow/"
run_cmd "mv .aitk/instructions/progress-tracking-patterns.instructions.md .ai/instructions/workflow/"
run_cmd "mv .aitk/instructions/passage-addition-workflow.instructions.md .ai/instructions/workflow/"
run_cmd "mv .aitk/instructions/development-guidelines.instructions.md .ai/instructions/workflow/"
log_info "ワークフロー指示移動完了"

# コンテンツ品質
run_cmd "mv .aitk/instructions/grammar-data-quality.instructions.md .ai/instructions/content/"
run_cmd "mv .aitk/instructions/grammar-question-validation.instructions.md .ai/instructions/content/"
run_cmd "mv .aitk/instructions/learning-content-quality-guard.instructions.md .ai/instructions/content/"
run_cmd "mv .aitk/instructions/social-studies-quality-enforcement.instructions.md .ai/instructions/content/"
log_info "コンテンツ指示移動完了"

# セキュリティ
run_cmd "mv .aitk/instructions/security-best-practices.instructions.md .ai/instructions/security/"
log_info "セキュリティ指示移動完了"

# エンフォースメント
run_cmd "mv .aitk/instructions/adaptive-guard-system.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/efficiency-guard.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/modification-enforcement.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/ai-modification-guard.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/specification-enforcement.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/documentation-enforcement.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/batch-system-enforcement.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/category-slots-enforcement.instructions.md .ai/instructions/enforcement/"
run_cmd "mv .aitk/instructions/position-hierarchy-enforcement.instructions.md .ai/instructions/enforcement/"
log_info "エンフォースメント指示移動完了"

# 残りのファイル（その他カテゴリまたは手動分類が必要）
log_warn "以下のファイルは手動分類が必要です："
if [[ -d ".aitk/instructions" ]]; then
    ls -1 .aitk/instructions/*.instructions.md 2>/dev/null || true
fi

# ========================================
# Phase 5: コンテキスト・データ移動
# ========================================

echo ""
echo "=========================================="
echo "Phase 5: コンテキスト・データ移動"
echo "=========================================="

# コンテキスト
run_cmd "mv .aitk/context/* .ai/context/ 2>/dev/null || true"
log_info "コンテキスト移動完了"

# Copilot設定
if [[ -f ".copilot/instructions.md" ]]; then
    run_cmd "mv .copilot/instructions.md .ai/copilot/"
    log_info "Copilot設定移動完了"
fi

# 実行データ
run_cmd "mv .aitk/ai-failure-history.json .ai/.data/history/ 2>/dev/null || true"
run_cmd "mv .aitk/servant_history.json .ai/.data/history/ 2>/dev/null || true"
run_cmd "mv .aitk/failure-patterns.json .ai/.data/history/ 2>/dev/null || true"
run_cmd "mv .aitk/.commit-count .ai/.data/cache/ 2>/dev/null || true"
run_cmd "mv .aitk/spec-check.json .ai/.data/cache/ 2>/dev/null || true"
log_info "実行データ移動完了"

# ========================================
# Phase 6: .vscode 実行データ移動
# ========================================

echo ""
echo "=========================================="
echo "Phase 6: .vscode AI実行データ移動"
echo "=========================================="

cd .vscode
run_cmd "mv ai-action-log.json .ai-data/ 2>/dev/null || true"
run_cmd "mv ai-feedback.json .ai-data/ 2>/dev/null || true"
run_cmd "mv ai-performance-history.json .ai-data/ 2>/dev/null || true"
run_cmd "mv neural-graph.json .ai-data/ 2>/dev/null || true"
run_cmd "mv neural-signals.json .ai-data/ 2>/dev/null || true"
run_cmd "mv project-goals.json .ai-data/ 2>/dev/null || true"
run_cmd "mv project-index.json .ai-data/ 2>/dev/null || true"
run_cmd "mv workflow-patterns.json .ai-data/ 2>/dev/null || true"
if [[ -d "cache" ]]; then
    run_cmd "mv cache/* .ai-data/cache/ 2>/dev/null || true"
    run_cmd "rmdir cache 2>/dev/null || true"
fi
cd ..
log_info ".vscode 実行データ移動完了"

# ========================================
# Phase 7: .gitignore 更新
# ========================================

echo ""
echo "=========================================="
echo "Phase 7: .gitignore 更新"
echo "=========================================="

GITIGNORE_ADDITION="
# ========================================
# AI実行データ・キャッシュ（整理計画対応）
# ========================================

# AI全般の実行データ（.ai/統合後）
.ai/.data/

# VS Code AI実行データ
.vscode/.ai-data/

# pytest キャッシュ
.pytest_cache/
__pycache__/
*.pyc
*.pyo
"

if [[ "$DRY_RUN" == false ]]; then
    echo "$GITIGNORE_ADDITION" >> .gitignore
    log_info ".gitignore 更新完了"
else
    echo "  [DRY] .gitignore に追加予定:"
    echo "$GITIGNORE_ADDITION"
fi

# ========================================
# Phase 8: 古いフォルダ削除
# ========================================

echo ""
echo "=========================================="
echo "Phase 8: 古いフォルダ削除"
echo "=========================================="

log_warn "古いフォルダを削除します（バックアップ済み）"
run_cmd "rm -rf .ai-instructions"
run_cmd "rm -rf .aitk"
if [[ -d ".copilot" ]]; then
    run_cmd "rm -rf .copilot"
fi
log_info "古いフォルダ削除完了"

# ========================================
# Phase 9: README 作成
# ========================================

echo ""
echo "=========================================="
echo "Phase 9: README 作成"
echo "=========================================="

# .ai/README.md
AI_README=".ai/README.md"
cat > "$AI_README" << 'EOF'
# AI指示・設定ディレクトリ

このディレクトリは、AIアシスタント（GitHub Copilot、Servant等）向けの指示、設定、実行データを管理します。

## ディレクトリ構造

- `instructions/` - AI向け指示文書（コミット対象）
  - `core/` - 必須ルール
  - `quality/` - 品質ガード
  - `workflow/` - ワークフローガイド
  - `content/` - コンテンツ品質
  - `security/` - セキュリティ
  - `enforcement/` - エンフォースメント
- `copilot/` - GitHub Copilot固有設定
- `context/` - コンテキスト情報
- `.data/` - 実行データ（.gitignore対象）

## 新しい指示の追加

1. 適切なカテゴリを選択
2. `*.instructions.md` で作成
3. `instructions/README.md` に索引を追加
EOF
log_info ".ai/README.md 作成完了"

# .vscode/README.md
VSCODE_README=".vscode/README.md"
cat > "$VSCODE_README" << 'EOF'
# VS Code ワークスペース設定

## 共有設定（コミット対象）

- `settings.json` - プロジェクト共通設定
- `launch.json` - デバッグ設定
- `tasks.json` - タスク定義
- `extensions.json` - 推奨拡張

## 個人設定（コミット対象外）

- `.ai-data/` - AI実行データ
- `*.local.json` - 個人用オーバーライド

## 推奨拡張のインストール

VS Codeで `Cmd+Shift+P` → "Extensions: Show Recommended Extensions"
EOF
log_info ".vscode/README.md 作成完了"

# ========================================
# 完了
# ========================================

echo ""
echo "=========================================="
echo "✅ マイグレーション完了"
echo "=========================================="
echo ""
log_info "バックアップ: $BACKUP_DIR"
log_info "新構造: .ai/ と .vscode/.ai-data/"
echo ""
log_warn "次のステップ:"
echo "  1. コードベース内の参照を更新:"
echo "     grep -r '\\.aitk' ."
echo "     grep -r 'ai-instructions' ."
echo "  2. テストを実行:"
echo "     npm run test"
echo "  3. フックを確認:"
echo "     git commit --allow-empty -m 'test'"
echo "  4. 問題なければコミット:"
echo "     git add ."
echo "     git commit -m 'refactor: ドットフォルダ整理 (.ai統合)'"
echo ""
log_warn "問題があればロールバック:"
echo "  cp -r $BACKUP_DIR/* ."
echo ""
