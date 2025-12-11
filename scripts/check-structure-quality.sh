#!/bin/bash

# ==============================================================================
# Project Structure Quality Check
# ==============================================================================
# Purpose: Validate project structure compliance with Phase 1-2 refactoring
# Usage: bash scripts/check-structure-quality.sh
# Exit: 0 = success, 1 = violations found

set -e

echo "🏗️  Project Structure Quality Check"
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

# ==============================================================================
# 1. Directory Structure Validation
# ==============================================================================
echo "📁 Checking directory structure..."

REQUIRED_DIRS=(
  "src/components"
  "src/hooks"
  "src/types"
  "src/utils"
  "src/constants"
  "src/ai"
  "src/storage"
  "src/features"
  "src/styles"
  "src/tests"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo -e "${RED}✗${NC} Missing required directory: $dir"
    ((ERRORS++))
  else
    echo -e "${GREEN}✓${NC} $dir"
  fi
done

echo ""

# ==============================================================================
# 2. Custom Hooks Validation (6 hooks expected)
# ==============================================================================
echo "🪝 Checking custom hooks..."

EXPECTED_HOOKS=(
  "src/hooks/useVocabularyQuiz.tsx"
  "src/hooks/useSpeechSynthesis.tsx"
  "src/hooks/useGrammarQuiz.tsx"
  "src/hooks/useWordQuiz.tsx"
  "src/hooks/useSettings.tsx"
  "src/hooks/useReadingComprehension.tsx"
)

HOOKS_FOUND=0
for hook in "${EXPECTED_HOOKS[@]}"; do
  if [ -f "$hook" ]; then
    ((HOOKS_FOUND++))
    echo -e "${GREEN}✓${NC} $hook"
  else
    echo -e "${RED}✗${NC} Missing hook: $hook"
    ((ERRORS++))
  fi
done

if [ $HOOKS_FOUND -eq 6 ]; then
  echo -e "${GREEN}✓${NC} All 6 custom hooks present"
else
  echo -e "${RED}✗${NC} Expected 6 hooks, found $HOOKS_FOUND"
fi

echo ""

# ==============================================================================
# 3. Type Definitions Validation (5 files expected)
# ==============================================================================
echo "📘 Checking type definitions..."

EXPECTED_TYPES=(
  "src/types/index.ts"
  "src/types/ui.ts"
  "src/types/ai.ts"
)

TYPES_FOUND=0
for type_file in "${EXPECTED_TYPES[@]}"; do
  if [ -f "$type_file" ]; then
    ((TYPES_FOUND++))
    echo -e "${GREEN}✓${NC} $type_file"
  else
    echo -e "${RED}✗${NC} Missing type file: $type_file"
    ((ERRORS++))
  fi
done

if [ $TYPES_FOUND -eq 3 ]; then
  echo -e "${GREEN}✓${NC} All 3 type definition files present"
else
  echo -e "${RED}✗${NC} Expected 3 type files, found $TYPES_FOUND"
fi

echo ""

# ==============================================================================
# 4. File Size Check (no file should exceed 500 lines)
# ==============================================================================
echo "📏 Checking file sizes..."

LARGE_FILES=$(find src -name "*.ts" -o -name "*.tsx" | while read file; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 500 ]; then
    echo "$file ($lines lines)"
  fi
done)

if [ -z "$LARGE_FILES" ]; then
  echo -e "${GREEN}✓${NC} No files exceed 500 lines"
else
  echo -e "${YELLOW}⚠${NC}  Large files found (>500 lines):"
  echo "$LARGE_FILES" | while read line; do
    echo "  - $line"
    ((WARNINGS++))
  done
fi

echo ""

# ==============================================================================
# 5. Import Pattern Check (@/ path aliases)
# ==============================================================================
echo "🔗 Checking import patterns..."

# Check for relative imports that should use path aliases
BAD_IMPORTS=$(grep -r "from '\.\./\.\./\.\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -z "$BAD_IMPORTS" ]; then
  echo -e "${GREEN}✓${NC} No deep relative imports found"
else
  echo -e "${YELLOW}⚠${NC}  Deep relative imports found (should use @/ aliases):"
  echo "$BAD_IMPORTS" | head -5
  ((WARNINGS++))
fi

echo ""

# ==============================================================================
# 6. Documentation Structure Check
# ==============================================================================
echo "📚 Checking documentation structure..."

DOC_COUNT=$(find docs -name "*.md" -not -path "*/archive/*" | wc -l | tr -d ' ')
echo "  Total docs (excluding archive): $DOC_COUNT"

if [ "$DOC_COUNT" -gt 70 ]; then
  echo -e "${YELLOW}⚠${NC}  Documentation count exceeds target (>70 files)"
  ((WARNINGS++))
elif [ "$DOC_COUNT" -lt 50 ]; then
  echo -e "${YELLOW}⚠${NC}  Documentation count below target (<50 files)"
  ((WARNINGS++))
else
  echo -e "${GREEN}✓${NC} Documentation count within target range (50-70)"
fi

# Check for required documentation
REQUIRED_DOCS=(
  "README.md"
  "docs/README.md"
  ".aitk/instructions/README.md"
  "docs/development/DOCUMENTATION_REVISION_PLAN.md"
  "docs/quality/QUALITY_SYSTEM.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✓${NC} $doc"
  else
    echo -e "${RED}✗${NC} Missing required doc: $doc"
    ((ERRORS++))
  fi
done

echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo "======================================"
echo "📊 Summary"
echo "======================================"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Structure quality check passed!${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Structure quality check passed with warnings${NC}"
  exit 0
else
  echo -e "${RED}❌ Structure quality check failed${NC}"
  exit 1
fi
