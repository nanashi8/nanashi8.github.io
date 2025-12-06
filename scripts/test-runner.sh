#!/bin/bash
# 効率的なテスト実行スクリプト
# 問題: サーバー起動の重複、タイムアウト、プロセス残存
# 解決: 完全な環境クリーンアップ → サーバー起動確認 → テスト実行

set -e  # エラーで即座に終了

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== テスト環境セットアップ開始 ===${NC}"

# 1. 既存プロセスの完全クリーンアップ
echo -e "${YELLOW}既存プロセスをクリーンアップ中...${NC}"
pkill -f "vite" 2>/dev/null || true
pkill -f "playwright" 2>/dev/null || true
sleep 2

# 2. ポート確認（5173が空いているか）
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}ポート5173が使用中です。プロセスを強制終了します...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 3. 開発サーバー起動
echo -e "${YELLOW}開発サーバーを起動中...${NC}"
cd "$(dirname "$0")/.."
npm run dev > /tmp/vite-server.log 2>&1 &
VITE_PID=$!

# 4. サーバーが完全に起動するまで待機（最大30秒）
echo -e "${YELLOW}サーバー起動を待機中...${NC}"
TIMEOUT=30
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ サーバー起動完了 (${ELAPSED}秒)${NC}"
        break
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    
    # 進捗表示
    if [ $((ELAPSED % 5)) -eq 0 ]; then
        echo -e "${YELLOW}  待機中... ${ELAPSED}/${TIMEOUT}秒${NC}"
    fi
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${RED}✗ サーバー起動タイムアウト${NC}"
    echo -e "${RED}サーバーログ:${NC}"
    tail -20 /tmp/vite-server.log
    kill $VITE_PID 2>/dev/null || true
    exit 1
fi

# 5. テスト実行
echo -e "${BLUE}=== テスト実行開始 ===${NC}"

# テストタイプを引数から取得（デフォルト: smoke-fast）
TEST_TYPE=${1:-smoke-fast}

case $TEST_TYPE in
    smoke-fast)
        echo -e "${YELLOW}超高速スモークテスト実行...${NC}"
        npx playwright test tests/smoke-fast.spec.ts --project=chromium
        ;;
    smoke)
        echo -e "${YELLOW}スモークテスト実行...${NC}"
        npx playwright test tests/smoke.spec.ts --project=chromium
        ;;
    all)
        echo -e "${YELLOW}全テスト実行...${NC}"
        npx playwright test
        ;;
    *)
        echo -e "${YELLOW}カスタムテスト: ${TEST_TYPE}${NC}"
        npx playwright test "$TEST_TYPE"
        ;;
esac

TEST_EXIT_CODE=$?

# 6. クリーンアップ
echo -e "${BLUE}=== クリーンアップ ===${NC}"
kill $VITE_PID 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# 7. 結果表示
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=== ✓ テスト成功 ===${NC}"
    exit 0
else
    echo -e "${RED}=== ✗ テスト失敗 ===${NC}"
    echo -e "${YELLOW}サーバーログ (最新20行):${NC}"
    tail -20 /tmp/vite-server.log
    exit $TEST_EXIT_CODE
fi
