#!/bin/bash
# パッセージファイル間の整合性チェック（シェルスクリプト版）

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/public/data"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}=== Passage Consistency Checker (Shell Version) ===${NC}\n"

# Python版が利用可能ならそちらを使用
if command -v python3 &> /dev/null; then
    echo -e "${CYAN}Running Python version for detailed analysis...${NC}\n"
    python3 "$SCRIPT_DIR/check_passage_consistency.py"
    exit $?
fi

echo -e "${YELLOW}Python3 not found. Running basic shell checks...${NC}\n"

# 基本的なファイル存在チェック
total_files=0
missing_files=0

for file in "$DATA_DIR/passages-for-phrase-work"/*.txt; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .txt)
        total_files=$((total_files + 1))
        
        echo -e "${BOLD}Checking: $basename${NC}"
        
        # 対応するJSONファイルの存在確認
        phrase_json="$DATA_DIR/passages-phrase-learning/${basename}.json"
        trans_json="$DATA_DIR/passages-translations/${basename}.json"
        
        if [ ! -f "$phrase_json" ]; then
            echo -e "  ${RED}✗ Missing: passages-phrase-learning/${basename}.json${NC}"
            missing_files=$((missing_files + 1))
        else
            echo -e "  ${GREEN}✓ Found: passages-phrase-learning/${basename}.json${NC}"
        fi
        
        if [ ! -f "$trans_json" ]; then
            echo -e "  ${YELLOW}⚠ Missing: passages-translations/${basename}.json${NC}"
        else
            echo -e "  ${GREEN}✓ Found: passages-translations/${basename}.json${NC}"
        fi
        
        echo ""
    fi
done

# サマリー
echo -e "${BOLD}${'='*60}${NC}"
echo "Total checked: $total_files"
echo "Missing corresponding files: $missing_files"

if [ $missing_files -eq 0 ]; then
    echo -e "${GREEN}${BOLD}All corresponding files exist! ✓${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}Some files are missing. Please review.${NC}"
    exit 1
fi
