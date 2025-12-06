#!/bin/bash

# システム健康診断スクリプト
# コードベースの重複、不整合、未使用コードを検出

echo "🏥 システム健康診断を開始します..."
echo ""

# カラー定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ISSUES=0

# 1. localStorage キーの一貫性チェック
echo "${BLUE}📦 1. localStorage キー一貫性チェック${NC}"
echo "---"

# autoNext関連のキー
AUTONEXT_KEYS=$(grep -r "localStorage\.\(get\|set\)Item.*autoNext" src/ | grep -oE "'[^']+'" | sort | uniq)
echo "autoNext関連キー:"
echo "$AUTONEXT_KEYS"

# 同じ機能で異なるキー名を使っているか確認
AUTONEXT_COUNT=$(echo "$AUTONEXT_KEYS" | wc -l | tr -d ' ')
if [ "$AUTONEXT_COUNT" -gt 2 ]; then
  echo "${YELLOW}⚠️  警告: autoNext設定に複数の異なるキー名が使用されています${NC}"
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: autoNext設定のキー名は統一されています${NC}"
fi
echo ""

# 2. 重複コンポーネント/関数チェック
echo "${BLUE}📋 2. 重複機能チェック${NC}"
echo "---"

# 同じような名前の関数を検出
echo "類似名称の関数:"
grep -rh "^const \|^function " src/ | grep -oE "(const|function) [a-zA-Z_][a-zA-Z0-9_]*" | awk '{print $2}' | sort | uniq -c | awk '$1 > 1 {print $2 " (出現回数: " $1 ")"}'

# handleStartQuiz のような重要な関数の重複
HANDLE_START_COUNT=$(grep -r "const handleStartQuiz\|function handleStartQuiz" src/ | wc -l | tr -d ' ')
if [ "$HANDLE_START_COUNT" -gt 1 ]; then
  echo "${YELLOW}⚠️  警告: handleStartQuiz が複数箇所で定義されています (${HANDLE_START_COUNT}箇所)${NC}"
  grep -rn "const handleStartQuiz\|function handleStartQuiz" src/
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: handleStartQuiz は1箇所のみで定義されています${NC}"
fi
echo ""

# 3. useEffect 依存配列の警告チェック
echo "${BLUE}⚙️  3. useEffect 依存配列チェック${NC}"
echo "---"

ESLINT_DISABLE_COUNT=$(grep -r "eslint-disable.*react-hooks/exhaustive-deps" src/ | wc -l | tr -d ' ')
if [ "$ESLINT_DISABLE_COUNT" -gt 5 ]; then
  echo "${YELLOW}⚠️  警告: exhaustive-deps の無効化が多用されています (${ESLINT_DISABLE_COUNT}箇所)${NC}"
  echo "場所:"
  grep -rn "eslint-disable.*react-hooks/exhaustive-deps" src/
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: exhaustive-deps の無効化は適切な範囲です (${ESLINT_DISABLE_COUNT}箇所)${NC}"
fi
echo ""

# 4. 未使用の状態変数チェック
echo "${BLUE}🗑️  4. 未使用変数チェック${NC}"
echo "---"

# _で始まる変数（意図的に未使用）をカウント
UNUSED_VAR_COUNT=$(grep -r "const \[_[a-zA-Z]" src/ | wc -l | tr -d ' ')
echo "意図的な未使用変数（_prefix）: ${UNUSED_VAR_COUNT}個"

if [ "$UNUSED_VAR_COUNT" -gt 10 ]; then
  echo "${YELLOW}⚠️  警告: 未使用変数が多い可能性があります${NC}"
  echo "場所:"
  grep -rn "const \[_[a-zA-Z]" src/ | head -10
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: 未使用変数は適切な範囲です${NC}"
fi
echo ""

# 5. 重複するCSS クラス名チェック
echo "${BLUE}🎨 5. CSS クラス重複チェック${NC}"
echo "---"

if [ -f "src/App.css" ]; then
  # クラス定義を抽出
  CSS_CLASSES=$(grep -oE '\.[a-zA-Z_-][a-zA-Z0-9_-]*' src/App.css | sort | uniq -c | awk '$1 > 1 {print $2 " (定義回数: " $1 ")"}')
  
  if [ -n "$CSS_CLASSES" ]; then
    echo "${YELLOW}⚠️  警告: 重複定義されているCSSクラス:${NC}"
    echo "$CSS_CLASSES" | head -10
    ISSUES=$((ISSUES + 1))
  else
    echo "${GREEN}✅ OK: CSSクラスの重複はありません${NC}"
  fi
else
  echo "App.css が見つかりません"
fi
echo ""

# 6. コンソールログの残留チェック
echo "${BLUE}📝 6. デバッグコード残留チェック${NC}"
echo "---"

CONSOLE_COUNT=$(grep -r "console\.log\|console\.error\|console\.warn" src/ --include="*.tsx" --include="*.ts" | grep -v "// " | wc -l | tr -d ' ')
echo "コンソール出力: ${CONSOLE_COUNT}箇所"

if [ "$CONSOLE_COUNT" -gt 100 ]; then
  echo "${YELLOW}⚠️  警告: コンソール出力が多すぎます (${CONSOLE_COUNT}箇所)${NC}"
  echo "主な場所:"
  grep -rn "console\.log" src/ --include="*.tsx" --include="*.ts" | grep -v "// " | head -5
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: コンソール出力は適切な範囲です${NC}"
fi
echo ""

# 7. 古いコメントアウトコードチェック
echo "${BLUE}💭 7. コメントアウトコード検出${NC}"
echo "---"

COMMENTED_CODE=$(grep -r "// const \|// function \|// export " src/ | wc -l | tr -d ' ')
if [ "$COMMENTED_CODE" -gt 20 ]; then
  echo "${YELLOW}⚠️  警告: コメントアウトされたコードが多数あります (${COMMENTED_CODE}箇所)${NC}"
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: コメントアウトコードは少ないです (${COMMENTED_CODE}箇所)${NC}"
fi
echo ""

# 8. 型定義の重複チェック
echo "${BLUE}📐 8. 型定義重複チェック${NC}"
echo "---"

# interface や type の重複を検出
TYPE_DEFS=$(grep -rh "^interface \|^type \|^export interface \|^export type " src/ | grep -oE "(interface|type) [a-zA-Z_][a-zA-Z0-9_]*" | awk '{print $2}' | sort | uniq -c | awk '$1 > 1 {print $2 " (定義回数: " $1 ")"}')

if [ -n "$TYPE_DEFS" ]; then
  echo "${YELLOW}⚠️  警告: 重複定義されている型:${NC}"
  echo "$TYPE_DEFS"
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: 型定義の重複はありません${NC}"
fi
echo ""

# 9. ファイルサイズチェック
echo "${BLUE}📏 9. 大きすぎるファイルチェック${NC}"
echo "---"

LARGE_FILES=$(find src/ -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 1000 {print $2 " (" $1 " 行)"}' | grep -v "total")

if [ -n "$LARGE_FILES" ]; then
  echo "${YELLOW}⚠️  警告: 1000行を超える大きなファイル:${NC}"
  echo "$LARGE_FILES"
  ISSUES=$((ISSUES + 1))
else
  echo "${GREEN}✅ OK: すべてのファイルは適切なサイズです${NC}"
fi
echo ""

# 10. importの整理状況チェック
echo "${BLUE}📦 10. import文の整理状況${NC}"
echo "---"

UNUSED_IMPORTS=$(grep -r "^import.*{.*}" src/ --include="*.tsx" --include="*.ts" | grep -c "as _" || echo "0")
echo "未使用を示すimport (_prefix): ${UNUSED_IMPORTS}個"

if [ "$UNUSED_IMPORTS" -gt 5 ]; then
  echo "${YELLOW}⚠️  注意: 未使用のimportがあります${NC}"
  grep -rn "as _" src/ --include="*.tsx" --include="*.ts"
else
  echo "${GREEN}✅ OK: import文は整理されています${NC}"
fi
echo ""

# 総評
echo ""
echo "================================================"
echo "${BLUE}📊 診断結果サマリー${NC}"
echo "================================================"

if [ "$ISSUES" -eq 0 ]; then
  echo "${GREEN}✨ 素晴らしい！問題は検出されませんでした${NC}"
  exit 0
elif [ "$ISSUES" -le 3 ]; then
  echo "${YELLOW}⚠️  軽微な問題が ${ISSUES} 件見つかりました（要確認）${NC}"
  exit 0
else
  echo "${RED}❌ ${ISSUES} 件の問題が検出されました（要対応）${NC}"
  exit 1
fi
