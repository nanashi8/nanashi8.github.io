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

# 既に巨大な“レガシーファイル”を触った場合に、変更を一切コミットできなくなる問題を避ける。
# - HEAD時点で >=1000 行のファイルは「増分が大きすぎる場合のみ」エラー
# - 新規ファイル / 閾値跨ぎ（<1000 → >=1000）は従来通りエラー
LEGACY_MAX_GROWTH_LINES=${QUALITY_GUARD_LEGACY_MAX_GROWTH_LINES:-300}

has_head_commit() {
  git rev-parse --verify HEAD >/dev/null 2>&1
}

head_line_count() {
  # prints line count of file in HEAD, or empty if not found
  file="$1"
  if ! has_head_commit; then
    return 0
  fi
  if git cat-file -e "HEAD:$file" >/dev/null 2>&1; then
    git show "HEAD:$file" | wc -l | tr -d ' '
  fi
}

for file in $CHANGED_FILES; do
  if [ ! -f "$file" ]; then
    continue
  fi

  LINE_COUNT=$(wc -l < "$file" | tr -d ' ')

  HEAD_LINES=$(head_line_count "$file")
  if [ -n "$HEAD_LINES" ]; then
    # shellcheck disable=SC2004
    GROWTH=$((LINE_COUNT - HEAD_LINES))
  else
    GROWTH=0
  fi

  if [ "$LINE_COUNT" -ge 1000 ]; then
    if [ -n "$HEAD_LINES" ] && [ "$HEAD_LINES" -ge 1000 ]; then
      # 既に巨大: “増分”が許容を超えた場合のみブロック
      if [ "$GROWTH" -gt "$LEGACY_MAX_GROWTH_LINES" ]; then
        echo "❌ $file: ${LINE_COUNT}行（HEAD: ${HEAD_LINES}行 / +${GROWTH}行） （レガシー増分上限${LEGACY_MAX_GROWTH_LINES}行超過）"
        SIZE_ERROR_COUNT=$((SIZE_ERROR_COUNT + 1))
      else
        echo "⚠️  $file: ${LINE_COUNT}行（HEAD: ${HEAD_LINES}行 / +${GROWTH}行） （レガシーファイル: 分割推奨）"
        SIZE_WARNING_COUNT=$((SIZE_WARNING_COUNT + 1))
      fi
    else
      # 新規 or 閾値跨ぎ
      echo "❌ $file: ${LINE_COUNT}行 （上限1000行超過）"
      SIZE_ERROR_COUNT=$((SIZE_ERROR_COUNT + 1))
    fi
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

# レガシー複雑度の扱い
# - HEAD時点で既に上限（50）を超えている場合、増分が大きい時だけブロック
LEGACY_MAX_COMPLEXITY_GROWTH=${QUALITY_GUARD_LEGACY_MAX_COMPLEXITY_GROWTH:-25}

head_complexity() {
  file="$1"
  if ! has_head_commit; then
    return 0
  fi
  if ! git cat-file -e "HEAD:$file" >/dev/null 2>&1; then
    return 0
  fi

  IF_COUNT=$(git show "HEAD:$file" | grep -c '\bif\b' 2>/dev/null || true)
  FOR_COUNT=$(git show "HEAD:$file" | grep -c '\bfor\b' 2>/dev/null || true)
  WHILE_COUNT=$(git show "HEAD:$file" | grep -c '\bwhile\b' 2>/dev/null || true)
  CASE_COUNT=$(git show "HEAD:$file" | grep -c '\bcase\b' 2>/dev/null || true)
  CATCH_COUNT=$(git show "HEAD:$file" | grep -c '\bcatch\b' 2>/dev/null || true)

  COMPLEXITY=$((1 + IF_COUNT + FOR_COUNT + WHILE_COUNT + CASE_COUNT + CATCH_COUNT))
  echo "$COMPLEXITY"
}

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

  HEAD_COMPLEXITY=$(head_complexity "$file")
  if [ -n "$HEAD_COMPLEXITY" ]; then
    COMPLEXITY_GROWTH=$((COMPLEXITY - HEAD_COMPLEXITY))
  else
    COMPLEXITY_GROWTH=0
  fi

  if [ "$COMPLEXITY" -ge 50 ]; then
    if [ -n "$HEAD_COMPLEXITY" ] && [ "$HEAD_COMPLEXITY" -ge 50 ]; then
      if [ "$COMPLEXITY_GROWTH" -gt "$LEGACY_MAX_COMPLEXITY_GROWTH" ]; then
        echo "❌ $file: 複雑度 ${COMPLEXITY}（HEAD: ${HEAD_COMPLEXITY} / +${COMPLEXITY_GROWTH}） （レガシー増分上限${LEGACY_MAX_COMPLEXITY_GROWTH}超過）"
        COMPLEXITY_ERROR_COUNT=$((COMPLEXITY_ERROR_COUNT + 1))
      else
        echo "⚠️  $file: 複雑度 ${COMPLEXITY}（HEAD: ${HEAD_COMPLEXITY} / +${COMPLEXITY_GROWTH}） （レガシーファイル: 分割推奨）"
      fi
    else
      echo "❌ $file: 複雑度 ${COMPLEXITY} （上限50超過）"
      COMPLEXITY_ERROR_COUNT=$((COMPLEXITY_ERROR_COUNT + 1))
    fi
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
