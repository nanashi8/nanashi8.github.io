#!/bin/bash

# サーバント: passages-originalディレクトリ監視ガード
# 未追跡ファイルを検出し、誤削除を防止

WATCH_DIR="public/data/passages-original"

echo "🛡️  サーバント: passages-originalディレクトリ監視中..."

# 未追跡ファイルを検出
UNTRACKED=$(git ls-files --others --exclude-standard "$WATCH_DIR" | grep -E '\.txt$')

if [ -n "$UNTRACKED" ]; then
  echo ""
  echo "❌ 【危険】未追跡のpassagesファイルを検出しました！"
  echo ""
  echo "🚨 以下のファイルはGitで追跡されていません:"
  echo "$UNTRACKED" | while read -r file; do
    echo "   - $file"
  done
  echo ""
  echo "⚠️  未追跡ファイルは git clean で削除される危険があります"
  echo ""
  echo "💡 修正方法:"
  echo "   git add $WATCH_DIR/*.txt"
  echo ""
  echo "   または個別に追加:"
  echo "$UNTRACKED" | while read -r file; do
    echo "   git add $file"
  done
  echo ""
  echo "🔒 ファイルを追跡してから再度コミットしてください"
  exit 1
fi

# 追跡済みファイル数を確認
TRACKED_COUNT=$(git ls-files "$WATCH_DIR" | grep -E '\.txt$' | wc -l | tr -d ' ')
ACTUAL_COUNT=$(find "$WATCH_DIR" -name "*.txt" -type f | wc -l | tr -d ' ')

if [ "$TRACKED_COUNT" -ne "$ACTUAL_COUNT" ]; then
  echo ""
  echo "⚠️  警告: ファイル数の不一致を検出"
  echo "   追跡済み: ${TRACKED_COUNT}個"
  echo "   実際: ${ACTUAL_COUNT}個"
  echo ""
  echo "💡 すべてのファイルを追跡してください:"
  echo "   git add $WATCH_DIR/*.txt"
  exit 1
fi

echo "✅ passages-originalディレクトリ: すべてのファイルが追跡されています (${TRACKED_COUNT}個)"
