#!/bin/bash

# テスト品質チェックスクリプト
# 使用法: ./scripts/check-test-quality.sh

set -e

echo "================================"
echo "🧪 テスト品質チェック"
echo "================================"
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# メトリクス初期化
PASS=0
FAIL=0
WARN=0

# 1. テスト実行
echo "📋 Step 1: Running tests..."
if npm run test > test-output.log 2>&1; then
  echo -e "${GREEN}✅ All tests passed${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ Some tests failed${NC}"
  cat test-output.log
  ((FAIL++))
fi
echo ""

# 2. カバレッジチェック
echo "📊 Step 2: Checking coverage..."
npm run test:coverage > /dev/null 2>&1

if [ -f coverage/coverage-summary.json ]; then
  COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
  echo "Coverage: $COVERAGE%"

  if (( $(echo "$COVERAGE >= 80" | bc -l) )); then
    echo -e "${GREEN}✅ Coverage >= 80%${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ Coverage < 80%${NC}"
    ((FAIL++))
  fi
else
  echo -e "${RED}❌ Coverage report not found${NC}"
  ((FAIL++))
fi
echo ""

# 3. フレーキーテストチェック
echo "🔍 Step 3: Checking for flaky tests (3 runs)..."
RESULTS_DIR=./test-results
mkdir -p $RESULTS_DIR

for i in {1..3}; do
  npm run test > "$RESULTS_DIR/run-$i.log" 2>&1 || true
done

FIRST_HASH=$(md5sum "$RESULTS_DIR/run-1.log" | cut -d' ' -f1)
FLAKY=false
for i in 2 3; do
  CURRENT_HASH=$(md5sum "$RESULTS_DIR/run-$i.log" | cut -d' ' -f1)
  if [ "$FIRST_HASH" != "$CURRENT_HASH" ]; then
    FLAKY=true
    break
  fi
done

if [ "$FLAKY" = true ]; then
  echo -e "${YELLOW}⚠️ Flaky tests detected${NC}"
  ((WARN++))
else
  echo -e "${GREEN}✅ No flaky tests${NC}"
  ((PASS++))
fi
echo ""

# 4. スキップテストチェック
echo "⏭️ Step 4: Checking skipped tests..."
SKIP_COUNT=$(grep -r "it.skip\|test.skip\|describe.skip" tests/ 2>/dev/null | wc -l)
echo "Skipped tests: $SKIP_COUNT"

if [ "$SKIP_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ No skipped tests${NC}"
  ((PASS++))
elif [ "$SKIP_COUNT" -le 9 ]; then
  echo -e "${YELLOW}⚠️ $SKIP_COUNT skipped tests (acceptable)${NC}"
  ((WARN++))
else
  echo -e "${RED}❌ Too many skipped tests ($SKIP_COUNT > 9)${NC}"
  ((FAIL++))
fi
echo ""

# 5. 実行時間チェック
echo "⏱️ Step 5: Checking execution time..."
DURATION=$(grep -oP 'Duration\s+\K[\d.]+(?=s)' test-output.log || echo "0")
echo "Execution time: ${DURATION}s"

if (( $(echo "$DURATION <= 30" | bc -l) )); then
  echo -e "${GREEN}✅ Execution time <= 30s${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️ Execution time > 30s${NC}"
  ((WARN++))
fi
echo ""

# 6. テストファイル合格率
echo "📁 Step 6: Checking test file pass rate..."
TOTAL_FILES=$(grep -oP 'Test Files\s+\K\d+' test-output.log | head -1 || echo "0")
PASSED_FILES=$(grep -oP 'Test Files\s+\K\d+(?=\s+passed)' test-output.log || echo "0")

if [ "$TOTAL_FILES" -eq "$PASSED_FILES" ]; then
  echo -e "${GREEN}✅ All test files passed ($PASSED_FILES/$TOTAL_FILES)${NC}"
  ((PASS++))
else
  echo -e "${RED}❌ Some test files failed ($PASSED_FILES/$TOTAL_FILES)${NC}"
  ((FAIL++))
fi
echo ""

# サマリー
echo "================================"
echo "📊 Test Quality Summary"
echo "================================"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠️ Warnings: $WARN${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

# 品質スコア計算
TOTAL=$((PASS + WARN + FAIL))
SCORE=$(echo "scale=1; ($PASS * 100 + $WARN * 50) / ($TOTAL * 100) * 100" | bc)
echo "🎯 Quality Score: ${SCORE}%"

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}✅ Test quality check passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Test quality check failed${NC}"
  exit 1
fi
