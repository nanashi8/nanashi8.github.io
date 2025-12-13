#!/bin/bash
#
# テスト実装ガード - テストファイル変更時の必須確認
#
# Usage: bash scripts/test-implementation-guard.sh [test-file-path]
#

set -e

TEST_FILE="$1"

if [ -z "$TEST_FILE" ]; then
  echo "❌ エラー: テストファイルパスを指定してください"
  exit 1
fi

echo "🔍 テスト実装ガード: $TEST_FILE"
echo ""

# テストファイルの種類を判定
if [[ "$TEST_FILE" == *"vocabulary"* ]]; then
  DATA_TYPE="CSV (Vocabulary)"
  SPEC_FILES="public/data/vocabulary/*.csv"
elif [[ "$TEST_FILE" == *"grammar"* ]]; then
  DATA_TYPE="JSON (Grammar Questions)"
  SPEC_FILES="public/data/*-questions-*.json"
elif [[ "$TEST_FILE" == *"translation"* ]]; then
  DATA_TYPE="Translation/Grammar"
  SPEC_FILES="public/data/*-questions-*.json"
else
  DATA_TYPE="Unknown"
  SPEC_FILES=""
fi

echo "📋 検出されたデータ型: $DATA_TYPE"
echo ""

# 必須確認事項
echo "⚠️  【必須確認事項】以下を確認してからコミットしてください:"
echo ""
echo "1. 仕様書の確認"
echo "   □ .aitk/instructions/testing-guidelines.instructions.md を読んだ"
echo "   □ データフォーマット仕様を理解した"
echo ""
echo "2. 実データの確認"
if [ -n "$SPEC_FILES" ]; then
  echo "   対象ファイル例:"
  for file in $SPEC_FILES; do
    if [ -f "$file" ]; then
      echo "     - $file"
      echo "       先頭3行:"
      head -n 3 "$file" | sed 's/^/       /'
      break
    fi
  done
fi
echo ""
echo "3. 既存実装の確認"
echo "   □ src/ 配下のパーサー・ローダーを確認した"
echo "   □ 既存のテストが通ることを確認した"
echo ""

# インタラクティブ確認
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "上記をすべて確認しましたか？ (yes/no): " CONFIRMED

if [[ "$CONFIRMED" != "yes" ]]; then
  echo ""
  echo "❌ テスト実装ガードにより中断されました"
  echo ""
  echo "📚 次のステップ:"
  echo "  1. .aitk/instructions/testing-guidelines.instructions.md を読む"
  echo "  2. 実際のデータファイルを確認する"
  echo "  3. 仕様を理解してからテストを実装する"
  echo ""
  exit 1
fi

echo ""
echo "✅ 確認完了 - テスト実装を続行してください"
echo ""

# テストファイルの基本検証
echo "🔍 テストファイルの基本検証..."

# 仕様確認のコメントがあるか
if ! grep -q "仕様" "$TEST_FILE" && ! grep -q "specification" "$TEST_FILE"; then
  echo "⚠️  警告: テストファイルに仕様への言及がありません"
  echo "   テストのコメントに仕様の根拠を記載することを推奨します"
fi

# サンプルデータの確認ログがあるか
if ! grep -q "console.log" "$TEST_FILE" && ! grep -q "Sample" "$TEST_FILE"; then
  echo "⚠️  警告: サンプルデータの確認ログがありません"
  echo "   実データを確認したことをログ出力で示すことを推奨します"
fi

# 誤検出の可能性がある表現
RISKY_PATTERNS=(
  "カタカナ.*混入"
  "不要.*記号"
  "誤.*配置"
)

for pattern in "${RISKY_PATTERNS[@]}"; do
  if grep -q "$pattern" "$TEST_FILE"; then
    echo "⚠️  警告: 「$pattern」という表現が見つかりました"
    echo "   仕様を再確認し、誤検出でないことを確認してください"
  fi
done

echo ""
echo "✅ テスト実装ガード完了"
