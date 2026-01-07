#!/bin/sh
#
# Pre-commit hook: コード品質ガード
#
# このフックは以下を自動実行:
# 1. ファイルサイズチェック（500行警告、1000行エラー）
# 2. 複雑度チェック（サイクロマティック複雑度）
# 3. 危険なパターン検出
#
# インストール方法:
#   ln -sf ../../scripts/pre-commit-quality-guard.sh .git/hooks/pre-commit

set -e

# Ensure we run from repo root even when invoked from .git/hooks
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

echo ""
echo "🏥 [品質ガード] Pre-commit チェック開始"
echo ""

MODE=${QUALITY_GUARD_MODE:-staged}

# 変更されたファイルを取得
# - QUALITY_GUARD_FILES が指定されていればそれを優先（計画時）
# - staged:   git diff --cached
# - working:  git diff + git diff --cached（修正時）
# - all:      working と同じ（明示）
if [ -n "${QUALITY_GUARD_FILES:-}" ]; then
  CHANGED_FILES=$(printf "%s\n" "$QUALITY_GUARD_FILES" | tr ' ' '\n' | grep -E '\.(ts|tsx|js|jsx)$' || true)
else
  case "$MODE" in
    staged)
      CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
      ;;
    working|all)
      STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
      UNSTAGED=$(git diff --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
      CHANGED_FILES=$(printf "%s\n%s\n" "$STAGED" "$UNSTAGED" | sed '/^$/d' | sort -u || true)
      ;;
    *)
      echo "❌ Unknown QUALITY_GUARD_MODE: $MODE (use staged|working|all)"
      exit 1
      ;;
  esac
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ 変更ファイルなし - スキップ"
  exit 0
fi

echo "📁 変更ファイル:"
echo "$CHANGED_FILES" | sed 's/^/   - /'
echo ""

# ========================================
# 1. ファイルサイズチェック
# ========================================
echo "📏 [1/3] ファイルサイズをチェック中..."
echo ""

SIZE_WARNING_COUNT=0
SIZE_ERROR_COUNT=0

for file in $CHANGED_FILES; do
  if [ ! -f "$file" ]; then
    continue
  fi

  LINE_COUNT=$(wc -l < "$file" | tr -d ' ')

  if [ "$LINE_COUNT" -ge 1000 ]; then
    echo "❌ $file: ${LINE_COUNT}行 （上限1000行超過）"
    SIZE_ERROR_COUNT=$((SIZE_ERROR_COUNT + 1))
  elif [ "$LINE_COUNT" -ge 500 ]; then
    echo "⚠️  $file: ${LINE_COUNT}行 （推奨500行超過）"
    SIZE_WARNING_COUNT=$((SIZE_WARNING_COUNT + 1))
  fi
done

if [ $SIZE_ERROR_COUNT -gt 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ CRITICAL: ファイルサイズが1000行を超えています"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 推奨アクション:"
  echo "   1. ファイルを論理的な単位で分割してください"
  echo "   2. UIコンポーネント、ロジック、型定義を別ファイルへ"
  echo "   3. 500行以下を目標にリファクタリング"
  echo ""
  echo "それでも続行する場合:"
  echo "   git commit --no-verify"
  echo ""
  exit 1
fi

if [ $SIZE_WARNING_COUNT -gt 0 ]; then
  echo ""
  echo "⚠️  警告: ${SIZE_WARNING_COUNT}個のファイルが500行を超えています"
  echo "   次回のリファクタリングで分割を検討してください"
  echo ""
fi

# ========================================
# 2. 複雑度チェック
# ========================================
echo "🧮 [2/3] 複雑度をチェック中..."
echo ""

COMPLEXITY_ERROR_COUNT=0

for file in $CHANGED_FILES; do
  if [ ! -f "$file" ]; then
    continue
  fi

  # サイクロマティック複雑度の簡易計算
  # if, for, while, case, catch の数を数える
  IF_COUNT=$(grep -c '\bif\b' "$file" || true)
  FOR_COUNT=$(grep -c '\bfor\b' "$file" || true)
  WHILE_COUNT=$(grep -c '\bwhile\b' "$file" || true)
  CASE_COUNT=$(grep -c '\bcase\b' "$file" || true)
  CATCH_COUNT=$(grep -c '\bcatch\b' "$file" || true)

  COMPLEXITY=$((1 + IF_COUNT + FOR_COUNT + WHILE_COUNT + CASE_COUNT + CATCH_COUNT))

  if [ "$COMPLEXITY" -ge 50 ]; then
    echo "❌ $file: 複雑度 ${COMPLEXITY} （上限50超過）"
    COMPLEXITY_ERROR_COUNT=$((COMPLEXITY_ERROR_COUNT + 1))
  elif [ "$COMPLEXITY" -ge 30 ]; then
    echo "⚠️  $file: 複雑度 ${COMPLEXITY} （推奨30超過）"
  fi
done

if [ $COMPLEXITY_ERROR_COUNT -gt 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ CRITICAL: 複雑度が高すぎます"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 推奨アクション:"
  echo "   1. 長い関数を小さな関数に分割"
  echo "   2. ネストを減らす（早期リターンを使う）"
  echo "   3. 条件分岐を戦略パターン等で置き換え"
  echo ""
  echo "それでも続行する場合:"
  echo "   git commit --no-verify"
  echo ""
  exit 1
fi

# ========================================
# 3. 危険なパターン検出
# ========================================
echo "🔍 [3/3] 危険なパターンをチェック中..."
echo ""

DANGEROUS_PATTERNS_FOUND=0

if [ -n "${QUALITY_GUARD_DIFF:-}" ]; then
  DIFF_CONTENT="$QUALITY_GUARD_DIFF"
else
  case "$MODE" in
    staged)
      DIFF_CONTENT=$(git diff --cached)
      ;;
    working|all)
      DIFF_CONTENT=$(printf "%s\n%s\n" "$(git diff --cached)" "$(git diff)")
      ;;
    *)
      DIFF_CONTENT=$(git diff --cached)
      ;;
  esac
fi

# document.write()の使用（構文エラーの原因）
if echo "$DIFF_CONTENT" | grep -q "document\.write"; then
  echo "🚨 document.write()の使用を検出！"
  echo "   - 大きなデータの埋め込みで構文エラーの原因になります"
  DANGEROUS_PATTERNS_FOUND=1
fi

# 巨大なJSON埋め込み
if echo "$DIFF_CONTENT" | grep -E "^\+.*\{.*\}.*$" | wc -l | awk '{if($1>100) exit 0; else exit 1}'; then
  echo "⚠️  大量のJSON埋め込みを検出"
  echo "   - postMessageやdynamic importの使用を検討してください"
fi

# 過度な try-catch ネスト
if echo "$DIFF_CONTENT" | grep -c "try {" | awk '{if($1>10) exit 0; else exit 1}'; then
  echo "⚠️  try-catch文が多すぎます（10個以上）"
  echo "   - エラーハンドリングの集約を検討してください"
fi

if [ $DANGEROUS_PATTERNS_FOUND -eq 1 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ CRITICAL: 危険なパターンが検出されました"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 1
fi

echo ""
echo "✅ [品質ガード] すべてのチェックをパスしました"
echo ""

exit 0
