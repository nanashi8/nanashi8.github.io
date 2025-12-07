#!/bin/bash

# 開発ガイドラインチェックスクリプト（拡張版）
# 二重経路・二重定義・二重実装・二重記録を検出
# あらゆる新機能追加に対応

echo "🔍 開発ガイドラインチェック実行中..."

# カラーコード
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# エラーカウント
ERROR_COUNT=0
WARNING_COUNT=0

# 変更されたファイルを取得
CHANGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')
CHANGED_ALL_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$CHANGED_ALL_FILES" ]; then
  echo "✅ 変更ファイルなし"
  exit 0
fi

echo "📝 チェック対象ファイル:"
echo "$CHANGED_ALL_FILES"
echo ""

# ==================== データフロー関連チェック ====================

if [ ! -z "$CHANGED_TS_FILES" ]; then
  echo -e "${BLUE}=== データフロー関連チェック ===${NC}"
  
  # チェック1: progress.resultsへの直接記録
  echo "🔍 チェック1: progress.results への直接記録を検出..."
  for file in $CHANGED_TS_FILES; do
    if git diff --cached "$file" | grep -E '^\+.*progress\.results\.push' > /dev/null; then
      echo -e "${RED}❌ エラー: $file${NC}"
      echo "   progress.results.push() への直接記録が検出されました"
      echo "   → updateWordProgress() を使用してください"
      echo ""
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  done

  # チェック2: addQuizResultとupdateWordProgressの併用
  echo "🔍 チェック2: addQuizResult と updateWordProgress の併用を検出..."
  for file in $CHANGED_TS_FILES; do
    DIFF=$(git diff --cached "$file")
    if echo "$DIFF" | grep -E '^\+.*updateWordProgress' > /dev/null && \
       echo "$DIFF" | grep -E '^\+.*addQuizResult' > /dev/null; then
      echo -e "${YELLOW}⚠️  警告: $file${NC}"
      echo "   updateWordProgress と addQuizResult の両方が使用されています"
      echo "   → 二重記録になっていないか確認してください"
      echo ""
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done

  # チェック3: setLastAnswerTimeの呼び出し確認
  echo "🔍 チェック3: ScoreBoard更新トリガーを検出..."
  for file in $CHANGED_TS_FILES; do
    DIFF=$(git diff --cached "$file")
    if echo "$DIFF" | grep -E '^\+.*updateWordProgress' > /dev/null; then
      if ! echo "$DIFF" | grep -E '^\+.*setLastAnswerTime' > /dev/null; then
        echo -e "${YELLOW}⚠️  警告: $file${NC}"
        echo "   updateWordProgress を使用していますが、setLastAnswerTime が見つかりません"
        echo "   → ScoreBoardが更新されない可能性があります"
        echo ""
        WARNING_COUNT=$((WARNING_COUNT + 1))
      fi
    fi
  done

  # チェック4: 新しいモード追加時の型定義チェック
  echo "🔍 チェック4: モード型定義の一貫性を検出..."
  if echo "$CHANGED_TS_FILES" | grep "progressStorage.ts" > /dev/null; then
    file="src/progressStorage.ts"
    if [ -f "$file" ]; then
      UPDATE_MODES=$(grep -A5 "export async function updateWordProgress" "$file" | grep "mode?" | sed "s/.*mode?: //; s/ \/\/.*//" | tr -d "'\"")
      RESULT_MODES=$(grep -A20 "export interface QuizResult" "$file" | grep "mode:" | sed "s/.*mode: //; s/;.*//" | tr -d "'\"")
      
      if [ ! -z "$UPDATE_MODES" ] && [ ! -z "$RESULT_MODES" ]; then
        if [ "$UPDATE_MODES" != "$RESULT_MODES" ]; then
          echo -e "${YELLOW}⚠️  警告: progressStorage.ts${NC}"
          echo "   updateWordProgress と QuizResult のモード型定義が一致していません"
          echo ""
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
      fi
    fi
  fi

  # チェック5: questionStartTimeRefの存在確認
  echo "🔍 チェック5: 応答時間計測の実装を検出..."
  for file in $CHANGED_TS_FILES; do
    if echo "$file" | grep -E 'View\.tsx$' > /dev/null; then
      DIFF=$(git diff --cached "$file")
      if echo "$DIFF" | grep -E '^\+.*updateWordProgress' > /dev/null; then
        FILE_CONTENT=$(cat "$file" 2>/dev/null || echo "")
        if ! echo "$FILE_CONTENT" | grep "questionStartTimeRef" > /dev/null; then
          echo -e "${YELLOW}⚠️  警告: $file${NC}"
          echo "   updateWordProgress を使用していますが、questionStartTimeRef が見つかりません"
          echo "   → 応答時間が正しく計測されない可能性があります"
          echo ""
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
      fi
    fi
  done
  
  echo ""
fi

# ==================== LocalStorage関連チェック ====================

if [ ! -z "$CHANGED_TS_FILES" ]; then
  echo -e "${BLUE}=== LocalStorage関連チェック ===${NC}"
  
  # チェック6: LocalStorageキーの命名規則
  echo "🔍 チェック6: LocalStorageキーの命名規則を検出..."
  for file in $CHANGED_TS_FILES; do
    DIFF=$(git diff --cached "$file")
    # 新しいlocalStorage.setItem/getItemを検出
    if echo "$DIFF" | grep -E '^\+.*localStorage\.(setItem|getItem)' > /dev/null; then
      # キー名を抽出（簡易的な検出）
      KEYS=$(echo "$DIFF" | grep -oE "localStorage\.(setItem|getItem)\(['\"]([^'\"]+)['\"]" | sed "s/.*['\"]//; s/['\"].*//" | sort -u)
      
      for key in $KEYS; do
        # 命名規則チェック（ハイフン区切り、プレフィックス付き）
        if ! echo "$key" | grep -E '^[a-z]+-[a-z-]+$' > /dev/null; then
          echo -e "${YELLOW}⚠️  警告: $file${NC}"
          echo "   LocalStorageキー '$key' が命名規則に従っていない可能性があります"
          echo "   → 推奨: 'feature-name-setting' の形式（ハイフン区切り、小文字）"
          echo ""
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
      done
    fi
  done
  
  echo ""
fi

# ==================== 型定義関連チェック ====================

if [ ! -z "$CHANGED_TS_FILES" ]; then
  echo -e "${BLUE}=== 型定義関連チェック ===${NC}"
  
  # チェック7: 型定義の重複
  echo "🔍 チェック7: 型定義の重複を検出..."
  if echo "$CHANGED_TS_FILES" | grep -v "types.ts" | xargs grep -l "^export interface" 2>/dev/null | head -1 > /dev/null; then
    DUPLICATE_TYPES=$(echo "$CHANGED_TS_FILES" | grep -v "types.ts" | xargs grep -h "^export interface" 2>/dev/null | sed 's/export interface //; s/ .*//' | sort | uniq -d)
    
    if [ ! -z "$DUPLICATE_TYPES" ]; then
      echo -e "${YELLOW}⚠️  警告: 型定義の重複の可能性${NC}"
      echo "   複数ファイルで同じ型名が定義されています:"
      echo "$DUPLICATE_TYPES" | while read type; do
        echo "   - $type"
      done
      echo "   → types.ts に集約することを検討してください"
      echo ""
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  fi
  
  # チェック8: any型の使用
  echo "🔍 チェック8: any型の使用を検出..."
  for file in $CHANGED_TS_FILES; do
    DIFF=$(git diff --cached "$file")
    ANY_COUNT=$(echo "$DIFF" | grep -cE '^\+.*: any' || echo "0")
    
    if [ "$ANY_COUNT" -gt 0 ]; then
      echo -e "${YELLOW}⚠️  警告: $file${NC}"
      echo "   any型が $ANY_COUNT 箇所で使用されています"
      echo "   → 可能な限り具体的な型定義を使用してください"
      echo ""
      WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
  done
  
  echo ""
fi

# ==================== コンポーネント関連チェック ====================

if [ ! -z "$CHANGED_TS_FILES" ]; then
  echo -e "${BLUE}=== コンポーネント関連チェック ===${NC}"
  
  # チェック9: useEffectの依存配列
  echo "🔍 チェック9: useEffect依存配列の確認..."
  for file in $CHANGED_TS_FILES; do
    DIFF=$(git diff --cached "$file")
    # useEffectで依存配列が空の場合を検出（eslintで検出されるべきだが念のため）
    if echo "$DIFF" | grep -E '^\+.*useEffect.*\(\(\).*\=\>.*\[\]' > /dev/null; then
      # 空の依存配列は意図的な場合もあるので警告のみ
      echo -e "${YELLOW}⚠️  情報: $file${NC}"
      echo "   useEffect with empty dependency array detected"
      echo "   → 意図的な場合はOKですが、依存関係を確認してください"
      echo ""
    fi
  done
  
  # チェック10: 新しいViewコンポーネントの命名
  echo "🔍 チェック10: Viewコンポーネントの命名規則を検出..."
  NEW_VIEW_FILES=$(echo "$CHANGED_TS_FILES" | grep -E "components/.*View\.tsx$" | grep -E "^\+")
  
  if [ ! -z "$NEW_VIEW_FILES" ]; then
    for file in $NEW_VIEW_FILES; do
      if [ -f "$file" ]; then
        FILE_CONTENT=$(cat "$file")
        
        # 必須パターンの確認
        if ! echo "$FILE_CONTENT" | grep "questionStartTimeRef" > /dev/null; then
          echo -e "${YELLOW}⚠️  警告: $file${NC}"
          echo "   新しいViewコンポーネントに questionStartTimeRef がありません"
          echo ""
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
        
        if ! echo "$FILE_CONTENT" | grep "lastAnswerTime" > /dev/null; then
          echo -e "${YELLOW}⚠️  警告: $file${NC}"
          echo "   新しいViewコンポーネントに lastAnswerTime がありません"
          echo ""
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
      fi
    done
  fi
  
  echo ""
fi

# ==================== パフォーマンス関連チェック ====================

if [ ! -z "$CHANGED_TS_FILES" ]; then
  echo -e "${BLUE}=== パフォーマンス関連チェック ===${NC}"
  
  # チェック11: useStateの過剰な使用
  echo "🔍 チェック11: useState使用数の確認..."
  for file in $CHANGED_TS_FILES; do
    if [ -f "$file" ]; then
      FILE_CONTENT=$(cat "$file")
      USESTATE_COUNT=$(echo "$FILE_CONTENT" | grep -cE "useState" || echo "0")
      
      if [ "$USESTATE_COUNT" -gt 10 ]; then
        echo -e "${YELLOW}⚠️  警告: $file${NC}"
        echo "   useStateが $USESTATE_COUNT 回使用されています"
        echo "   → useReducerやカスタムフックの使用を検討してください"
        echo ""
        WARNING_COUNT=$((WARNING_COUNT + 1))
      fi
    fi
  done
  
  echo ""
fi

# ==================== セキュリティ関連チェック ====================

if [ ! -z "$CHANGED_TS_FILES" ]; then
  echo -e "${BLUE}=== セキュリティ関連チェック ===${NC}"
  
  # チェック12: dangerouslySetInnerHTMLの使用
  echo "🔍 チェック12: dangerouslySetInnerHTML の使用を検出..."
  for file in $CHANGED_TS_FILES; do
    DIFF=$(git diff --cached "$file")
    if echo "$DIFF" | grep -E '^\+.*dangerouslySetInnerHTML' > /dev/null; then
      echo -e "${RED}❌ エラー: $file${NC}"
      echo "   dangerouslySetInnerHTML の使用が検出されました"
      echo "   → XSS脆弱性のリスクがあります。本当に必要ですか？"
      echo ""
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  done
  
  echo ""
fi

# 結果表示
echo "=========================================="
if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "${RED}❌ エラー: $ERROR_COUNT 件${NC}"
  echo ""
  echo "エラーを修正してから再度コミットしてください。"
  echo "詳細は .github/DEVELOPMENT_GUIDELINES.md を参照してください。"
  exit 1
fi

if [ $WARNING_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚠️  警告: $WARNING_COUNT 件${NC}"
  echo ""
  echo "警告を確認してください。"
  echo "問題なければコミットを続行できます。"
  echo "詳細は .github/DEVELOPMENT_GUIDELINES.md を参照してください。"
  echo ""
  read -p "コミットを続行しますか? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo -e "${GREEN}✅ 開発ガイドラインチェック完了${NC}"
exit 0
