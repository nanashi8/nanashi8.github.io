#!/bin/bash

# 長文パッセージデータ整合性チェックスクリプト
# 使用方法: ./scripts/verify-passage-integrity.sh [PASSAGE_ID]

set -e

if [ -z "$1" ]; then
  echo "使用方法: $0 [PASSAGE_ID]"
  echo "例: $0 J_2022_5"
  exit 1
fi

PASSAGE_ID=$1
BASE_DIR="public/data"

echo "========================================"
echo "  長文パッセージ整合性チェック"
echo "  ID: $PASSAGE_ID"
echo "========================================"
echo ""

# Phase 1: ファイル存在確認
echo "📁 Phase 1: ファイル存在確認"
echo "----------------------------------------"

FILES=(
  "$BASE_DIR/passages-original/$PASSAGE_ID.txt"
  "$BASE_DIR/passages-for-phrase-work/$PASSAGE_ID.txt"
  "$BASE_DIR/passages-sentences/${PASSAGE_ID}_sentences.txt"
  "$BASE_DIR/passages-translations/${PASSAGE_ID}_full.txt"
  "$BASE_DIR/passages-translations/${PASSAGE_ID}_sentences.txt"
  "$BASE_DIR/passages-translations/${PASSAGE_ID}_phrases.txt"
)

ALL_EXISTS=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "✅ $file ($SIZE)"
  else
    echo "❌ $file - ファイルが見つかりません"
    ALL_EXISTS=false
  fi
done

if [ "$ALL_EXISTS" = false ]; then
  echo ""
  echo "❌ エラー: 必要なファイルが不足しています"
  exit 1
fi

echo ""

# Phase 2: 文字コード確認
echo "🔤 Phase 2: 文字コード確認"
echo "----------------------------------------"

for file in "${FILES[@]}"; do
  ENCODING=$(file -b --mime-encoding "$file")
  if [ "$ENCODING" = "utf-8" ] || [ "$ENCODING" = "us-ascii" ]; then
    echo "✅ $file: $ENCODING"
  else
    echo "⚠️  $file: $ENCODING (UTF-8推奨)"
  fi
done

echo ""

# Phase 3: データ数チェック
echo "📊 Phase 3: データ数チェック"
echo "----------------------------------------"

# 語数チェック
WORD_COUNT=$(wc -w < "$BASE_DIR/passages-original/$PASSAGE_ID.txt" | tr -d ' ')
echo "📖 語数: $WORD_COUNT 語"

# フレーズ数チェック（空行を除いた実際のフレーズ行数を数える）
EN_PHRASES=$(grep -v '^$' "$BASE_DIR/passages-for-phrase-work/$PASSAGE_ID.txt" | grep -v '<<<ASTERISK>>>' | wc -l | tr -d ' ')
JA_PHRASES=$(grep -v '^$' "$BASE_DIR/passages-translations/${PASSAGE_ID}_phrases.txt" | wc -l | tr -d ' ')

echo ""
echo "🔹 フレーズ数:"
echo "   英語: $EN_PHRASES"
echo "   日本語: $JA_PHRASES"

if [ "$EN_PHRASES" -eq "$JA_PHRASES" ]; then
  echo "   ✅ フレーズ数一致"
else
  echo "   ❌ フレーズ数不一致 (差分: $((EN_PHRASES - JA_PHRASES)))"
fi

# 文数チェック（空行を除いた実際の文行数を数える）
EN_SENTS=$(grep -v '^$' "$BASE_DIR/passages-sentences/${PASSAGE_ID}_sentences.txt" | wc -l | tr -d ' ')
JA_SENTS=$(grep -v '^$' "$BASE_DIR/passages-translations/${PASSAGE_ID}_sentences.txt" | wc -l | tr -d ' ')

echo ""
echo "🔹 文数:"
echo "   英語: $EN_SENTS"
echo "   日本語: $JA_SENTS"

if [ "$EN_SENTS" -eq "$JA_SENTS" ]; then
  echo "   ✅ 文数一致"
else
  echo "   ❌ 文数不一致 (差分: $((EN_SENTS - JA_SENTS)))"
fi

echo ""

# Phase 4: 最終判定
echo "========================================"
echo "  最終判定"
echo "========================================"

if [ "$ALL_EXISTS" = true ] && [ "$EN_PHRASES" -eq "$JA_PHRASES" ] && [ "$EN_SENTS" -eq "$JA_SENTS" ]; then
  echo "✅ 全チェック合格！"
  echo ""
  echo "📊 サマリー:"
  echo "   - ファイル: 6個全て存在"
  echo "   - 語数: $WORD_COUNT 語"
  echo "   - フレーズ: $EN_PHRASES 個"
  echo "   - 文数: $EN_SENTS 文"
  echo ""
  echo "🎉 パッセージ $PASSAGE_ID は使用可能です"
  exit 0
else
  echo "❌ 整合性チェック失敗"
  echo ""
  echo "以下を確認してください:"
  [ "$ALL_EXISTS" = false ] && echo "  - ファイルが全て存在するか"
  [ "$EN_PHRASES" -ne "$JA_PHRASES" ] && echo "  - フレーズ数が一致するか"
  [ "$EN_SENTS" -ne "$JA_SENTS" ] && echo "  - 文数が一致するか"
  exit 1
fi
