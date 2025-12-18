#!/bin/bash
# シミュレーション実行スクリプト

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  QuestionScheduler シミュレーション実行                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ステップ1: 依存関係チェック
echo -e "${BLUE}[1/3]${NC} 依存関係をチェック中..."
if ! command -v npx &> /dev/null; then
    echo -e "${YELLOW}⚠️  npx が見つかりません。Node.jsをインストールしてください。${NC}"
    exit 1
fi

if ! command -v tsx &> /dev/null; then
    echo -e "${YELLOW}📦 tsx をインストール中...${NC}"
    npm install -g tsx
fi

echo -e "${GREEN}✅ 依存関係OK${NC}"
echo ""

# ステップ2: シミュレーション実行
echo -e "${BLUE}[2/3]${NC} シミュレーションを実行中..."
echo ""
npx tsx tests/simulation/runAllSimulations.ts

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}❌ シミュレーションでエラーが発生しました${NC}"
    exit 1
fi

# ステップ3: 結果を開く
echo ""
echo -e "${BLUE}[3/3]${NC} 結果を開いています..."

RESULT_DIR="test-results/simulation"
INDEX_FILE="$RESULT_DIR/index.html"

if [ -f "$INDEX_FILE" ]; then
    echo ""
    echo -e "${GREEN}✅ シミュレーション完了！${NC}"
    echo ""
    echo "📊 結果ファイル:"
    echo "   統合レポート: $INDEX_FILE"

    # ブラウザで開く（OS別）
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$INDEX_FILE"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "$INDEX_FILE" 2>/dev/null || echo "   手動で開いてください: file://$(pwd)/$INDEX_FILE"
    else
        # Windows (Git Bash)
        start "$INDEX_FILE" 2>/dev/null || echo "   手動で開いてください: file://$(pwd)/$INDEX_FILE"
    fi

    echo ""
    echo -e "${GREEN}🎉 シミュレーション結果がブラウザで開きました！${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  結果ファイルが見つかりませんでした${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
