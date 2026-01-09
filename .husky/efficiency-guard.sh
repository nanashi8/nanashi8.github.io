#!/bin/bash
# 効率化ガード - 無駄な作業を検出

set -e

# 色定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 静かに実行（通常は出力なし）
WARNINGS=0

# 1. 大量のドキュメント追加を検出
DOCS_ADDED=$(git diff --cached --name-only --diff-filter=A | grep -E '^docs/.*\.md$' | wc -l)
if [ "$DOCS_ADDED" -gt 2 ]; then
  WARNINGS=1
  echo -e "${YELLOW}⚠️  ${DOCS_ADDED}個のドキュメントファイルが追加されています（個人開発では最小限に）${NC}"
fi

# 2. 不要なREADME以外のマークダウンファイル追加を検出
SUMMARY_FILES=$(git diff --cached --name-only --diff-filter=A | grep -E '(SUMMARY|REPORT|COMPLETE).*\.md$' | wc -l)
if [ "$SUMMARY_FILES" -gt 0 ]; then
  WARNINGS=1
  echo -e "${YELLOW}⚠️  サマリー/レポートファイルが追加されています - 本当に必要ですか？${NC}"
fi

# 3. feature/ブランチが残っているか確認
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" == feature/* ]]; then
  WARNINGS=1
  echo -e "${YELLOW}⚠️  feature/ブランチにいます - 個人開発では直接mainにマージを推奨${NC}"
fi

# 4. .aitk/.commit-countをチェック（1回のタスクで5コミット以上は多い）
if [ -f ".aitk/.commit-count" ]; then
  COMMIT_COUNT=$(cat .aitk/.commit-count)
  if [ "$COMMIT_COUNT" -gt 5 ]; then
    WARNINGS=1
    echo -e "${YELLOW}⚠️  コミット数が${COMMIT_COUNT}回です - タスクを細分化しすぎている可能性${NC}"
  fi
fi

# 警告がなければ出力なし
if [ "$WARNINGS" -eq 0 ]; then
  exit 0
fi

echo ""
exit 0
