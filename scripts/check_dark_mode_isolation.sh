#!/bin/bash

# ライト/ダークモード分離チェックスクリプト
# このスクリプトはコミット前に実行され、モード間の干渉をチェックします

set -e

echo "🌓 ライト/ダークモード分離チェックを開始..."

ISSUES_FOUND=0

# 1. インラインスタイルで色を固定しているファイルを検出
echo "📋 インラインスタイルの色指定をチェック中..."
INLINE_COLORS=$(grep -r "style={{" src/ --include="*.tsx" --include="*.jsx" | grep -E "backgroundColor|color:" | grep -v "dark:" || true)
if [ ! -z "$INLINE_COLORS" ]; then
  echo "⚠️  警告: インラインスタイルで色が固定されています（ダークモード非対応）:"
  echo "$INLINE_COLORS"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 2. dark: プレフィックスがない背景色を検出
echo "📋 dark: バリアントの欠落をチェック中..."
MISSING_DARK_BG=$(grep -r "className=" src/ --include="*.tsx" --include="*.jsx" | grep -E "bg-(white|gray-[0-9]+|blue-[0-9]+)" | grep -v "dark:bg-" | head -20 || true)
if [ ! -z "$MISSING_DARK_BG" ]; then
  echo "⚠️  警告: 背景色に dark: バリアントがありません:"
  echo "$MISSING_DARK_BG" | head -10
  echo "（最初の10件のみ表示）"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 3. dark: プレフィックスがないテキスト色を検出
MISSING_DARK_TEXT=$(grep -r "className=" src/ --include="*.tsx" --include="*.jsx" | grep -E "text-(gray-[0-9]+|blue-[0-9]+|black)" | grep -v "dark:text-" | head -20 || true)
if [ ! -z "$MISSING_DARK_TEXT" ]; then
  echo "⚠️  警告: テキスト色に dark: バリアントがありません:"
  echo "$MISSING_DARK_TEXT" | head -10
  echo "（最初の10件のみ表示）"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 4. CSSファイルでモード分離されていない色定義を検出
echo "📋 CSSファイルのモード分離をチェック中..."
CSS_FILES=$(find src/ -name "*.css")
for file in $CSS_FILES; do
  # background や color が定義されているが .dark-mode セレクタがないルールを検出
  if grep -q "background:" "$file" || grep -q "color:" "$file"; then
    if ! grep -q ".dark-mode" "$file"; then
      echo "⚠️  警告: $file にダークモード定義がありません"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done

# 結果サマリー
echo ""
echo "============================================"
if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✅ ライト/ダークモード分離チェック: 問題なし"
  exit 0
else
  echo "⚠️  $ISSUES_FOUND 件の潜在的な問題が見つかりました"
  echo "上記の警告を確認してください"
  echo "============================================"
  echo ""
  echo "💡 ヒント:"
  echo "  - インラインスタイルの色定義は Tailwind クラスに変更してください"
  echo "  - すべての色クラスに dark: バリアントを追加してください"
  echo "  - CSSファイルには .dark-mode セレクタを追加してください"
  exit 0  # 警告のみで、コミットはブロックしない
fi
