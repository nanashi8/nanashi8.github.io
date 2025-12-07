#!/bin/bash

# 開発ガイドラインチェックスクリプト
# 二重経路・二重定義・二重実装・二重記録を検出

echo "🔍 開発ガイドラインチェック実行中..."

# カラーコード
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# エラーカウント
ERROR_COUNT=0
WARNING_COUNT=0

# 変更されたTypeScriptファイルを取得
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ TypeScriptファイルの変更なし"
  exit 0
fi

echo "📝 チェック対象ファイル:"
echo "$CHANGED_FILES"
echo ""

# チェック1: progress.resultsへの直接記録
echo "🔍 チェック1: progress.results への直接記録を検出..."
for file in $CHANGED_FILES; do
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
for file in $CHANGED_FILES; do
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
for file in $CHANGED_FILES; do
  DIFF=$(git diff --cached "$file")
  # updateWordProgressを使用しているが、setLastAnswerTimeを呼んでいない場合
  if echo "$DIFF" | grep -E '^\+.*updateWordProgress' > /dev/null; then
    # 同じ関数内でsetLastAnswerTimeを呼んでいるか確認（簡易チェック）
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
if echo "$CHANGED_FILES" | grep "progressStorage.ts" > /dev/null; then
  file="src/progressStorage.ts"
  if [ -f "$file" ]; then
    # updateWordProgressのmode型定義
    UPDATE_MODES=$(grep -A5 "export async function updateWordProgress" "$file" | grep "mode?" | sed "s/.*mode?: //; s/ \/\/.*//" | tr -d "'\"")
    # QuizResult.mode型定義
    RESULT_MODES=$(grep -A20 "export interface QuizResult" "$file" | grep "mode:" | sed "s/.*mode: //; s/;.*//" | tr -d "'\"")
    
    if [ ! -z "$UPDATE_MODES" ] && [ ! -z "$RESULT_MODES" ]; then
      if [ "$UPDATE_MODES" != "$RESULT_MODES" ]; then
        echo -e "${YELLOW}⚠️  警告: progressStorage.ts${NC}"
        echo "   updateWordProgress と QuizResult のモード型定義が一致していません"
        echo "   updateWordProgress: $UPDATE_MODES"
        echo "   QuizResult: $RESULT_MODES"
        echo ""
        WARNING_COUNT=$((WARNING_COUNT + 1))
      fi
    fi
  fi
fi

# チェック5: questionStartTimeRefの存在確認
echo "🔍 チェック5: 応答時間計測の実装を検出..."
for file in $CHANGED_FILES; do
  if echo "$file" | grep -E 'View\.tsx$' > /dev/null; then
    DIFF=$(git diff --cached "$file")
    # updateWordProgressを使用しているが、questionStartTimeRefがない場合
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

# 結果表示
echo ""
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
