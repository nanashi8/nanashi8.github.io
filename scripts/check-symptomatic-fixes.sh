#!/bin/bash
# 対症療法的修正を自動検知するスクリプト
# 使用方法: ./scripts/check-symptomatic-fixes.sh

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 対症療法検知スクリプトを開始します..."
echo ""

VIOLATIONS_FOUND=0

# ===================================
# パターン1: AI担当領域での重複判定
# ===================================
echo "📋 [1/7] AI担当領域での重複判定をチェック..."

# determineWordPosition を使うべき場所で独自判定している
PATTERN_1=$(grep -rn \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="coverage" \
  --exclude-dir=".git" \
  --exclude="categoryDetermination.ts" \
  'consecutiveIncorrect.*>=.*2\|accuracy.*<.*0\.3\|consecutiveCorrect.*>=.*3.*accuracy.*>=.*0\.8' \
  src/ || true)

if [ -n "$PATTERN_1" ]; then
  echo -e "${RED}❌ 違反検出: AI判定ロジックの重複${NC}"
  echo "$PATTERN_1"
  echo ""
  echo "💡 修正方法: determineWordPosition() を使用してください"
  echo "   import { determineWordPosition } from '@/ai/utils/categoryDetermination';"
  echo ""
  ((VIOLATIONS_FOUND++))
fi

# ===================================
# パターン2: localStorage直接操作
# ===================================
echo "📋 [2/7] localStorage直接操作をチェック..."

PATTERN_2=$(grep -rn \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="coverage" \
  --exclude-dir=".git" \
  --exclude="*Storage.ts" \
  'localStorage\.setItem\|localStorage\.getItem\|localStorage\.removeItem' \
  src/ | grep -v "src/storage/" || true)

if [ -n "$PATTERN_2" ]; then
  echo -e "${YELLOW}⚠️  警告: localStorage の直接操作${NC}"
  echo "$PATTERN_2"
  echo ""
  echo "💡 推奨: storage/配下のユーティリティ関数を使用してください"
  echo ""
  # これは警告のみでエラーにしない
fi

# ===================================
# パターン3: 対症療法を示すコメント
# ===================================
echo "📋 [3/7] 対症療法を示すコメントをチェック..."

PATTERN_3=$(grep -rn \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="coverage" \
  --exclude-dir=".git" \
  -i 'とりあえず\|暫定対応\|TODO.*後で直す\|FIXME.*後で\|一時的な修正\|quick fix\|workaround' \
  src/ || true)

if [ -n "$PATTERN_3" ]; then
  echo -e "${RED}❌ 違反検出: 対症療法を示すコメント${NC}"
  echo "$PATTERN_3"
  echo ""
  echo "💡 修正方法: 根本原因を解決してから commit してください"
  echo ""
  ((VIOLATIONS_FOUND++))
fi

# ===================================
# パターン4: マジックナンバー（日付計算）
# ===================================
echo "📋 [4/7] マジックナンバー（日付計算）をチェック..."

PATTERN_4=$(grep -rn \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="coverage" \
  --exclude-dir=".git" \
  '86400000\|1000 \* 60 \* 60 \* 24' \
  src/ | grep -v "dateUtils" || true)

if [ -n "$PATTERN_4" ]; then
  echo -e "${YELLOW}⚠️  警告: 日付計算のマジックナンバー${NC}"
  echo "$PATTERN_4"
  echo ""
  echo "💡 推奨: 定数化または utils/dateUtils.ts を使用してください"
  echo ""
fi

# ===================================
# パターン5: 重複した型定義
# ===================================
echo "📋 [5/7] 重複した型定義をチェック..."

# 同じ型名が複数ファイルで定義されている（同名チェック）
DUPLICATE_TYPES=$(find src/ -name "*.ts" -not -path "*/node_modules/*" -exec grep -h "^export interface\|^export type\|^interface\|^type" {} \; | \
  sed 's/export //g' | \
  sed 's/{.*//g' | \
  sort | \
  uniq -d || true)

if [ -n "$DUPLICATE_TYPES" ]; then
  echo -e "${YELLOW}⚠️  警告: 重複の可能性がある型定義${NC}"
  echo "$DUPLICATE_TYPES"
  echo ""
  echo "💡 推奨: types/ ディレクトリで一元管理してください"
  echo ""
fi

# ===================================
# パターン6: 直接的な条件分岐の重複
# ===================================
echo "📋 [6/7] 条件分岐の重複をチェック..."

# 同じ条件式が3回以上出現（関数化すべき）
DUPLICATE_CONDITIONS=$(grep -roh \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="coverage" \
  --exclude-dir=".git" \
  'if.*role.*===.*admin\|if.*status.*===.*active\|if.*difficulty.*===.*hard' \
  src/ | \
  sort | \
  uniq -c | \
  awk '$1 >= 3 {print}' || true)

if [ -n "$DUPLICATE_CONDITIONS" ]; then
  echo -e "${YELLOW}⚠️  警告: 重複した条件分岐${NC}"
  echo "$DUPLICATE_CONDITIONS"
  echo ""
  echo "💡 推奨: 条件判定を関数化してください"
  echo ""
fi

# ===================================
# パターン7: Single Source of Truth 違反
# ===================================
echo "📋 [7/7] SSOT違反をチェック..."

# determineWordPosition が存在するのに別の判定を書いている
HAS_DETERMINE_FUNC=$(grep -l "export function determineWordPosition" src/ai/utils/categoryDetermination.ts 2>/dev/null || true)

if [ -n "$HAS_DETERMINE_FUNC" ]; then
  SSOT_VIOLATIONS=$(grep -rn \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir="node_modules" \
    --exclude-dir="coverage" \
    --exclude-dir=".git" \
    --exclude="categoryDetermination.ts" \
    "category.*=.*'incorrect'\|category.*=.*'mastered'\|category.*=.*'still_learning'\|category.*=.*'new'" \
    src/ | \
    grep -v "determineWordPosition\|determinePosition" || true)

  if [ -n "$SSOT_VIOLATIONS" ]; then
    echo -e "${RED}❌ 違反検出: SSOT原則違反（determineWordPositionを使うべき）${NC}"
    echo "$SSOT_VIOLATIONS"
    echo ""
    echo "💡 修正方法: determineWordPosition() を使用してください"
    echo ""
    ((VIOLATIONS_FOUND++))
  fi
fi

# ===================================
# 結果サマリー
# ===================================
echo ""
echo "=================================="
if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ 対症療法は検出されませんでした${NC}"
  echo "=================================="
  exit 0
else
  echo -e "${RED}❌ $VIOLATIONS_FOUND 件の違反が検出されました${NC}"
  echo "=================================="
  echo ""
  echo "📚 詳細: docs/guidelines/NO_SYMPTOMATIC_FIXES_POLICY.md"
  echo "🔧 修正ガイド: .aitk/instructions/no-symptomatic-fixes.instructions.md"
  echo ""
  exit 1
fi
