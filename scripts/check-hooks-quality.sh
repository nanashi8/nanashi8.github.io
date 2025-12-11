#!/bin/bash

# ==============================================================================
# Custom Hooks Quality Check
# ==============================================================================
# Purpose: Validate custom hooks quality and patterns
# Usage: bash scripts/check-hooks-quality.sh
# Exit: 0 = success, 1 = violations found

set -e

echo "🪝 Custom Hooks Quality Check"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# Expected hooks
HOOKS=(
  "src/hooks/useVocabularyQuiz.ts"
  "src/hooks/useSpeechSynthesis.ts"
  "src/hooks/useGrammarQuiz.ts"
  "src/hooks/useWordQuiz.ts"
  "src/hooks/useSettings.ts"
  "src/hooks/useReadingComprehension.ts"
)

# ==============================================================================
# 1. Hook Existence Check
# ==============================================================================
echo "📋 Checking hook existence..."

for hook in "${HOOKS[@]}"; do
  if [ -f "$hook" ]; then
    echo -e "${GREEN}✓${NC} $hook exists"
  else
    echo -e "${RED}✗${NC} Missing: $hook"
    ((ERRORS++))
  fi
done

echo ""

# ==============================================================================
# 2. Hook Naming Convention
# ==============================================================================
echo "📝 Checking naming conventions..."

INVALID_NAMES=$(find src/hooks -name "*.ts" -o -name "*.tsx" | grep -v "use[A-Z]" || true)

if [ -z "$INVALID_NAMES" ]; then
  echo -e "${GREEN}✓${NC} All hooks follow 'use*' naming convention"
else
  echo -e "${RED}✗${NC} Invalid hook names found:"
  echo "$INVALID_NAMES"
  ((ERRORS++))
fi

echo ""

# ==============================================================================
# 3. Hook Dependencies Check
# ==============================================================================
echo "🔗 Checking React hooks dependencies..."

for hook in "${HOOKS[@]}"; do
  if [ ! -f "$hook" ]; then
    continue
  fi
  
  filename=$(basename "$hook")
  
  # Check for useEffect without dependencies
  if grep -q "useEffect(" "$hook"; then
    if ! grep -q "useEffect.*\[" "$hook"; then
      echo -e "${YELLOW}⚠${NC}  $filename: useEffect without dependency array"
      ((WARNINGS++))
    fi
  fi
  
  # Check for useCallback without dependencies
  if grep -q "useCallback(" "$hook"; then
    if ! grep -q "useCallback.*\[" "$hook"; then
      echo -e "${YELLOW}⚠${NC}  $filename: useCallback without dependency array"
      ((WARNINGS++))
    fi
  fi
  
  # Check for useMemo without dependencies
  if grep -q "useMemo(" "$hook"; then
    if ! grep -q "useMemo.*\[" "$hook"; then
      echo -e "${YELLOW}⚠${NC}  $filename: useMemo without dependency array"
      ((WARNINGS++))
    fi
  fi
done

if [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓${NC} All hooks have proper dependency arrays"
fi

echo ""

# ==============================================================================
# 4. Hook Export Pattern Check
# ==============================================================================
echo "📤 Checking export patterns..."

for hook in "${HOOKS[@]}"; do
  if [ ! -f "$hook" ]; then
    continue
  fi
  
  filename=$(basename "$hook")
  hookname=$(basename "$hook" .ts)
  
  # Check for default export or named export
  if ! grep -q "export.*function.*$hookname" "$hook" && ! grep -q "export default" "$hook"; then
    echo -e "${RED}✗${NC} $filename: No export found"
    ((ERRORS++))
  else
    echo -e "${GREEN}✓${NC} $filename exports correctly"
  fi
done

echo ""

# ==============================================================================
# 5. Type Safety Check
# ==============================================================================
echo "📘 Checking type safety..."

for hook in "${HOOKS[@]}"; do
  if [ ! -f "$hook" ]; then
    continue
  fi
  
  filename=$(basename "$hook")
  
  # Check for 'any' type usage
  ANY_COUNT=$(grep -c ": any" "$hook" || echo "0")
  
  if [ "$ANY_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  $filename: Contains $ANY_COUNT 'any' type(s)"
    ((WARNINGS++))
  fi
done

if [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓${NC} No 'any' types found in hooks"
fi

echo ""

# ==============================================================================
# 6. Hook Size Check
# ==============================================================================
echo "📏 Checking hook sizes..."

for hook in "${HOOKS[@]}"; do
  if [ ! -f "$hook" ]; then
    continue
  fi
  
  filename=$(basename "$hook")
  lines=$(wc -l < "$hook")
  
  if [ "$lines" -gt 150 ]; then
    echo -e "${YELLOW}⚠${NC}  $filename: $lines lines (consider splitting)"
    ((WARNINGS++))
  else
    echo -e "${GREEN}✓${NC} $filename: $lines lines"
  fi
done

echo ""

# ==============================================================================
# 7. Import Pattern Check
# ==============================================================================
echo "🔗 Checking import patterns..."

for hook in "${HOOKS[@]}"; do
  if [ ! -f "$hook" ]; then
    continue
  fi
  
  filename=$(basename "$hook")
  
  # Check for type imports from @/types
  if grep -q "import.*from.*['\"]@/types" "$hook"; then
    echo -e "${GREEN}✓${NC} $filename: Uses @/types path alias"
  elif grep -q "import.*type" "$hook"; then
    echo -e "${YELLOW}⚠${NC}  $filename: Has type imports but doesn't use @/types"
    ((WARNINGS++))
  fi
done

echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo "======================================"
echo "📊 Summary"
echo "======================================"
echo -e "Hooks checked: ${#HOOKS[@]}"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Hooks quality check passed!${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Hooks quality check passed with warnings${NC}"
  exit 0
else
  echo -e "${RED}❌ Hooks quality check failed${NC}"
  exit 1
fi
