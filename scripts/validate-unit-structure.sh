#!/bin/bash

# NEW HORIZON単元構成検証スクリプト
# このスクリプトは文法問題データファイルが公式のNEW HORIZON単元構成に準拠しているかを検証します

set -e

echo "=========================================="
echo "NEW HORIZON 単元構成検証スクリプト"
echo "=========================================="
echo ""

# 公式に存在しない単元の定義
INVALID_UNITS=(
  "grammar_grade2_unit8.json"
  "grammar_grade2_unit9.json"
  "grammar_grade2_unit10.json"
  "grammar_grade3_unit7.json"
  "grammar_grade3_unit8.json"
  "grammar_grade3_unit9.json"
  "grammar_grade3_unit10.json"
)

# 検証結果
ERROR_COUNT=0
WARNING_COUNT=0

echo "📋 ステップ1: 存在しない単元の検出"
echo "----------------------------------------"

DATA_DIR="public/data/grammar"

for invalid_unit in "${INVALID_UNITS[@]}"; do
  if [ -f "$DATA_DIR/$invalid_unit" ]; then
    echo "❌ エラー: $invalid_unit が存在します"
    echo "   → このファイルは公式のNEW HORIZON単元構成に存在しません"
    echo "   → docs/references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md を確認してください"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
done

if [ $ERROR_COUNT -eq 0 ]; then
  echo "✅ 存在しない単元ファイルは見つかりませんでした"
fi

echo ""
echo "📋 ステップ2: 単元タイトルと文法事項の検証"
echo "----------------------------------------"

# 正しい単元構成の定義（JSON形式で検証用）
# Grade 2
declare -A GRADE2_UNITS=(
  ["Unit 0"]="動詞の過去形"
  ["Unit 1"]="be going to|will|未来"
  ["Unit 2"]="接続詞|when|if|because|that"
  ["Unit 3"]="不定詞|to不定詞"
  ["Unit 4"]="have to|must|動名詞"
  ["Unit 5"]=""  # 調査継続
  ["Unit 6"]="比較|比較級|最上級|as.*as"
  ["Unit 7"]="受け身|受動態|be.*過去分詞"
)

# Grade 3
declare -A GRADE3_UNITS=(
  ["Unit 0"]="既習|復習"
  ["Unit 1"]="現在完了|経験|SVOC"
  ["Unit 2"]="現在完了|完了|継続|現在完了進行形"
  ["Unit 3"]="It is.*to|let|help|不定詞"
  ["Unit 4"]="間接疑問|分詞|現在分詞|過去分詞"
  ["Unit 5"]="関係代名詞|who|which|that"
  ["Unit 6"]="仮定法|I wish|If.*were"
)

# 各ファイルを検証
for grade in 2 3; do
  for unit in 0 1 2 3 4 5 6; do
    file="$DATA_DIR/grammar_grade${grade}_unit${unit}.json"

    if [ ! -f "$file" ]; then
      continue
    fi

    echo ""
    echo "🔍 検証中: $file"

    # JSONから単元情報を抽出
    unit_name=$(jq -r '.unit' "$file" 2>/dev/null || echo "")
    title=$(jq -r '.title' "$file" 2>/dev/null || echo "")
    grammar=$(jq -r '.grammar' "$file" 2>/dev/null || echo "")

    echo "   単元: $unit_name"
    echo "   タイトル: $title"
    echo "   文法: $grammar"

    # 期待される文法事項パターンを取得
    if [ $grade -eq 2 ]; then
      expected_pattern="${GRADE2_UNITS["Unit $unit"]}"
    else
      expected_pattern="${GRADE3_UNITS["Unit $unit"]}"
    fi

    if [ -z "$expected_pattern" ]; then
      echo "   ⚠️  警告: 期待される文法事項が定義されていません"
      WARNING_COUNT=$((WARNING_COUNT + 1))
      continue
    fi

    # 正規表現で文法事項を検証
    if echo "$grammar" | grep -qiE "$expected_pattern"; then
      echo "   ✅ 文法事項が正しい範囲内です"
    else
      echo "   ❌ エラー: 文法事項が期待されるパターンと一致しません"
      echo "   → 期待: $expected_pattern"
      echo "   → 実際: $grammar"
      echo "   → docs/references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md を確認してください"
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  done
done

echo ""
echo "=========================================="
echo "📊 検証結果サマリー"
echo "=========================================="
echo "エラー: $ERROR_COUNT 件"
echo "警告: $WARNING_COUNT 件"
echo ""

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ 検証失敗: $ERROR_COUNT 件のエラーが見つかりました"
  echo ""
  echo "修正方法:"
  echo "1. docs/references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md を確認"
  echo "2. 誤った単元ファイルを削除または修正"
  echo "3. 文法事項が公式カリキュラムと一致するように修正"
  echo ""
  exit 1
else
  echo "✅ 検証成功: すべての単元が公式構成に準拠しています"
  exit 0
fi
