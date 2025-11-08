#!/bin/bash
# エラーチェック自動化スクリプト
# 使用方法: ./check_common_errors.sh [ファイルパス]

set -e

# 色の定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# チェック対象ファイル
if [ -z "$1" ]; then
    FILES=$(find SimpleWord -name "*.swift" -type f)
else
    FILES="$1"
fi

echo "🔍 SwiftUI よくあるエラーパターンをチェック中..."
echo ""

ERROR_COUNT=0
WARNING_COUNT=0

# パターン1: NavigationLinkで環境オブジェクトが注入されていない可能性
echo "📋 パターン1: NavigationLinkの環境オブジェクトチェック"
while IFS= read -r file; do
    if grep -n "NavigationLink(destination:" "$file" | grep -v "\.environmentObject" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  $file${NC}"
        grep -n "NavigationLink(destination:" "$file" | grep -v "\.environmentObject"
        echo "   → 環境オブジェクトの注入を確認してください"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done <<< "$FILES"
echo ""

# パターン2: .onReceiveの使用（無限ループのリスク）
echo "📋 パターン2: .onReceive使用箇所（無限ループリスク）"
while IFS= read -r file; do
    if grep -n "\.onReceive" "$file" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  $file${NC}"
        grep -n "\.onReceive" "$file"
        echo "   → 無限ループの可能性を確認してください"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done <<< "$FILES"
echo ""

# パターン3: 非推奨の.onChange構文
echo "📋 パターン3: 非推奨の.onChange構文"
while IFS= read -r file; do
    if grep -n "\.onChange(of:.*) { _ in" "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ $file${NC}"
        grep -n "\.onChange(of:.*) { _ in" "$file"
        echo "   → iOS 17では非推奨です"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done <<< "$FILES"
echo ""

# パターン4: NavigationView（iOS 16以降非推奨）
echo "📋 パターン4: NavigationView使用（非推奨）"
while IFS= read -r file; do
    if grep -n "NavigationView" "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ $file${NC}"
        grep -n "NavigationView" "$file"
        echo "   → NavigationStackを使用してください"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done <<< "$FILES"
echo ""

# パターン5: @Published with didSet（無限ループリスク）
echo "📋 パターン5: @Published with didSet（無限ループリスク）"
while IFS= read -r file; do
    if grep -B1 "@Published" "$file" | grep -A5 "didSet" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  $file${NC}"
        grep -n -B1 -A3 "@Published.*didSet" "$file"
        echo "   → 無限ループの可能性を確認してください"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done <<< "$FILES"
echo ""

# 結果サマリー
echo "================================"
echo "チェック完了"
echo "================================"
echo -e "${RED}エラー: $ERROR_COUNT${NC}"
echo -e "${YELLOW}警告: $WARNING_COUNT${NC}"
echo ""

if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ 問題は見つかりませんでした${NC}"
    exit 0
else
    echo "詳細は docs/ERROR_RESOLUTION_PROTOCOL.md を参照してください"
    exit 0
fi
