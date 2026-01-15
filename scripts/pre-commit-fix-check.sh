#!/bin/bash
# 修正の修正禁止を強制するpre-commitフック
# 使用方法: ln -sf ../../scripts/pre-commit-fix-check.sh .git/hooks/pre-commit

set -e

echo "🔍 修正の修正パターンをチェック中..."

# pre-commit は非対話で実行されることがある（GUIコミット/ツール実行など）
# FIX_CHECK_NON_INTERACTIVE=1 の場合はプロンプトを出さず、安全側（中断）に倒す
NON_INTERACTIVE=${FIX_CHECK_NON_INTERACTIVE:-0}

# カラーコード
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# エラーカウンター
ERROR_COUNT=0
WARNING_COUNT=0

# 1. コミットメッセージの検証
COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
  COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

  # 修正の修正パターン
  if echo "$COMMIT_MSG" | grep -iE "(fix.*again|re-?fix|再修正|修正の修正|fix.*fix)" > /dev/null; then
    echo -e "${RED}❌ ERROR: コミットメッセージに「修正の修正」パターンが検出されました${NC}"
    echo -e "${RED}   メッセージ: $COMMIT_MSG${NC}"
    echo ""
    echo "根本原因を特定してから再度コミットしてください。"
    echo "参考: .aitk/instructions/no-fix-on-fix.instructions.md"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

# 2. 対症療法キーワードの検出
echo "🔎 対症療法キーワードをチェック中..."

KEYWORDS="TODO.*fix|FIXME|HACK.*fix|temporary.*fix|workaround|quick.*fix|暫定対応|とりあえず"

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -n "$STAGED_FILES" ]; then
  for file in $STAGED_FILES; do
    # ファイルのステージングされた内容をチェック
    MATCHED_LINES=$(git diff --cached "$file" | grep -E "^\+" | grep -E "$KEYWORDS" || true)

    if [ -n "$MATCHED_LINES" ]; then
      echo -e "${RED}❌ ERROR: 対症療法（workaround/暫定対応 等）が検出されました（原則禁止）${NC}"
      echo -e "${RED}   ファイル: $file${NC}"
      echo "$MATCHED_LINES" | while read -r line; do
        echo -e "${RED}   $line${NC}"
      done
      echo ""
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  done
fi

# 3. 同一ファイルの短期間再修正検出
echo "📅 短期間の再修正をチェック中..."

DAYS_THRESHOLD=7
for file in $STAGED_FILES; do
  # Servant改善は連続修正が発生しやすいため、明示的な改善コミットは除外
  if [[ "$file" == extensions/servant/* ]]; then
    if echo "${COMMIT_MSG:-}" | grep -qiE "\b(servant)\b"; then
      continue
    fi
    if [ "${SERVANT_IMPROVEMENT:-0}" = "1" ]; then
      continue
    fi
  fi

  # 過去7日間の該当ファイルへのコミット回数
  RECENT_COMMITS=$(git log --since="$DAYS_THRESHOLD days ago" --oneline -- "$file" | wc -l | tr -d ' ')

  if [ "$RECENT_COMMITS" -ge 2 ]; then
    echo -e "${RED}❌ ERROR: $file は過去${DAYS_THRESHOLD}日間に${RECENT_COMMITS}回修正されています${NC}"
    echo "過去のコミット:"
    git log --since="$DAYS_THRESHOLD days ago" --oneline -- "$file"
    echo ""
    echo "同じファイルを短期間に複数回修正するのは設計エラーの可能性があります。"
    echo "根本原因を見直してください。"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
done

# 4. 型定義変更の検出
echo "🔤 型定義の変更をチェック中..."

TYPE_CHANGES=$(git diff --cached | grep -E "^\+.*export (type|interface)" || true)

if [ -n "$TYPE_CHANGES" ]; then
  echo -e "${YELLOW}⚠️  WARNING: 型定義の変更が検出されました${NC}"
  echo "$TYPE_CHANGES"
  echo ""
  echo "型定義の変更は影響範囲が広い可能性があります。"
  echo "以下を確認してください:"
  echo "  - すべての呼び出し元を更新したか？"
  echo "  - 後方互換性は保たれているか？"
  echo "  - 型エラーは0件か？ (npm run type-check)"
  echo ""
  WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# 5. 条件分岐の追加検出（対症療法の典型パターン）
echo "🔀 条件分岐の追加をチェック中..."

BRANCH_ADDITIONS=$(git diff --cached | grep -E "^\+.*(else if|else\s*{)" | wc -l | tr -d ' ')

if [ "$BRANCH_ADDITIONS" -ge 3 ]; then
  echo -e "${RED}❌ ERROR: 複数の条件分岐追加が検出されました（対症療法の典型／原則禁止）${NC}"
  echo "複数の条件分岐追加で場当たり的に凌ぐのではなく、設計を見直してください。"
  echo ""
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 6. 修正影響範囲のチェック
echo "📊 修正影響範囲をチェック中..."

MODIFIED_FILES_COUNT=$(echo "$STAGED_FILES" | wc -l | tr -d ' ')

if [ "$MODIFIED_FILES_COUNT" -ge 5 ]; then
  echo -e "${YELLOW}⚠️  WARNING: 5ファイル以上の修正が検出されました${NC}"
  echo "影響範囲が広い修正です。以下を確認してください:"
  echo "  - すべての変更箇所をレビューしたか？"
  echo "  - テストケースを追加したか？"
  echo "  - ドキュメントを更新したか？"
  echo ""
  WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# 結果サマリー
echo ""
echo "========================================="
echo "チェック完了"
echo "========================================="
echo -e "${RED}エラー: $ERROR_COUNT${NC}"
echo -e "${YELLOW}警告: $WARNING_COUNT${NC}"
echo ""

# エラーがある場合はコミット拒否
if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "${RED}❌ エラーが検出されたためコミットを中止しました${NC}"
  echo ""
  echo "以下を確認してください:"
  echo "1. 根本原因を特定したか？"
  echo "2. すべての影響範囲を修正したか？"
  echo "3. テストを追加したか？"
  echo ""
  echo "詳細: .aitk/instructions/no-fix-on-fix.instructions.md"
  echo ""
  echo "どうしてもコミットする場合は: git commit --no-verify"
  exit 1
fi

# 警告がある場合は確認を求める
if [ $WARNING_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚠️  警告が${WARNING_COUNT}件あります${NC}"
  echo ""

  if [ "$NON_INTERACTIVE" = "1" ]; then
    echo -e "${RED}❌ 非対話モードのためコミットを中止しました${NC}"
    echo "根本原因の確認・設計見直し後に再実行してください。"
    echo "どうしてもコミットする場合は: git commit --no-verify"
    exit 1
  fi

  echo "このままコミットしますか？ (y/N)"
  read -r response

  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "コミットをキャンセルしました"
    exit 1
  fi
fi

echo -e "${GREEN}✅ チェック完了。コミットを続行します${NC}"
exit 0
