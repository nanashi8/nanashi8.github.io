#!/bin/bash
# 無駄な視覚回帰（内容が仕様上可変の領域のスナップショット比較）を強制的に禁止する
# 目的: カード内容などの可変要素でE2Eが落ち続けるのを防ぐ（レイアウト検証に限定）

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

VIOLATIONS=0

# 禁止するスナップショット名（ここに追加するだけで拡張できる）
# 例: DISALLOWED_SCREENSHOTS=("main-page.png" "scoreboard.png")
DISALLOWED_SCREENSHOTS=(
  "main-page.png"
)

DISALLOWED_REGEX="$(printf '%s\n' "${DISALLOWED_SCREENSHOTS[@]}" | sed 's/[.[\*^$()+?{|]/\\&/g' | paste -sd'|' -)"

if [ -z "$DISALLOWED_REGEX" ]; then
  echo -e "${GREEN}✅ 視覚回帰の無駄検証ガード: OK（禁止リスト空）${NC}"
  exit 0
fi

# 1) 禁止スナップショット名の toHaveScreenshot 使用は禁止
DISALLOWED_USAGE=$(grep -rn \
  --include="*.ts" \
  --exclude-dir="node_modules" \
  --exclude-dir="coverage" \
  --exclude-dir=".git" \
  -E "toHaveScreenshot\(\s*['\"](${DISALLOWED_REGEX})['\"]" \
  tests/ || true)

if [ -n "$DISALLOWED_USAGE" ]; then
  echo -e "${RED}❌ 禁止: 可変内容を含むスナップショット比較が使用されています${NC}"
  echo "$DISALLOWED_USAGE"
  echo ""
  echo "💡 方針: 対象ページは内容が仕様上可変です。DOMの寸法/余白/重なりでレイアウト検証してください。"
  echo "   禁止リスト: ${DISALLOWED_SCREENSHOTS[*]}"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# 2) 禁止スナップショット名のPNG資産も禁止（残っていると誤って復活しやすい）
for name in "${DISALLOWED_SCREENSHOTS[@]}"; do
  base="${name%.png}"
  SNAPSHOT_FILES=$(find tests -path "*/smoke.spec.ts-snapshots/${base}-*.png" 2>/dev/null || true)
  if [ -n "$SNAPSHOT_FILES" ]; then
    echo -e "${RED}❌ 禁止: ${base} のスナップショットPNGが残っています${NC}"
    echo "$SNAPSHOT_FILES"
    echo ""
    echo "💡 方針: 対象ページはDOMレイアウト検証に移行済みのため、PNGスナップショットは削除してください。"
    echo "   禁止リスト: ${DISALLOWED_SCREENSHOTS[*]}"
    echo ""
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ 視覚回帰の無駄検証ガード: OK${NC}"
  exit 0
fi

exit 1
