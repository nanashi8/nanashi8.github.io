#!/bin/bash
# 全21パッセージのフレーズ学習用JSONを生成

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SCRIPT="$SCRIPT_DIR/convert_preformatted_to_json.py"
PASSAGES_DIR="$PROJECT_ROOT/public/data/passages"
TRANSLATIONS_DIR="$PROJECT_ROOT/public/data/passages-translations"
DICTIONARY="$PROJECT_ROOT/public/data/dictionaries/reading-passages-dictionary.json"
OUTPUT_DIR="$PROJECT_ROOT/public/data/passages-phrase-learning"

cd "$PROJECT_ROOT"

echo "========================================"
echo "フレーズ学習用JSON一括生成開始"
echo "========================================"
echo ""

# 初級レベル (5ファイル)
echo "【初級レベル: 5/5】"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/beginner-cafe-menu.txt" \
  --translation "$TRANSLATIONS_DIR/beginner-cafe-menu-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/beginner-cafe-menu.json" \
  --level beginner \
  --theme "日常生活・食事"
echo "✅ beginner-cafe-menu.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/beginner-conversation-daily.txt" \
  --translation "$TRANSLATIONS_DIR/beginner-conversation-daily-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/beginner-conversation-daily.json" \
  --level beginner \
  --theme "日常会話・学校生活"
echo "✅ beginner-conversation-daily.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/beginner-supermarket-shopping.txt" \
  --translation "$TRANSLATIONS_DIR/beginner-supermarket-shopping-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/beginner-supermarket-shopping.json" \
  --level beginner \
  --theme "買い物・食材"
echo "✅ beginner-supermarket-shopping.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/beginner-weather-seasons.txt" \
  --translation "$TRANSLATIONS_DIR/beginner-weather-seasons-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/beginner-weather-seasons.json" \
  --level beginner \
  --theme "天気・季節"
echo "✅ beginner-weather-seasons.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/beginner-wildlife-park-guide.txt" \
  --translation "$TRANSLATIONS_DIR/beginner-wildlife-park-guide-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/beginner-wildlife-park-guide.json" \
  --level beginner \
  --theme "動物・自然"
echo "✅ beginner-wildlife-park-guide.json 生成完了"

echo ""
echo "【中級レベル: 8/8】"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-exchange-student-australia.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-exchange-student-australia-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-exchange-student-australia.json" \
  --level intermediate \
  --theme "文化交流・学校生活"
echo "✅ intermediate-exchange-student-australia.json 生成完了（既存）"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-career-day.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-career-day-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-career-day.json" \
  --level intermediate \
  --theme "職業・将来"
echo "✅ intermediate-career-day.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-school-events-year.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-school-events-year-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-school-events-year.json" \
  --level intermediate \
  --theme "学校行事・年間予定"
echo "✅ intermediate-school-events-year.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-hospital-visit.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-hospital-visit-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-hospital-visit.json" \
  --level intermediate \
  --theme "医療・健康"
echo "✅ intermediate-hospital-visit.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-science-museum.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-science-museum-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-science-museum.json" \
  --level intermediate \
  --theme "科学・博物館"
echo "✅ intermediate-science-museum.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-school-news.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-school-news-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-school-news.json" \
  --level intermediate \
  --theme "学校ニュース・部活動"
echo "✅ intermediate-school-news.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-community-events.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-community-events-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-community-events.json" \
  --level intermediate \
  --theme "地域イベント・ボランティア"
echo "✅ intermediate-community-events.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/intermediate-homestay-america.txt" \
  --translation "$TRANSLATIONS_DIR/intermediate-homestay-america-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/intermediate-homestay-america.json" \
  --level intermediate \
  --theme "ホームステイ・文化交流"
echo "✅ intermediate-homestay-america.json 生成完了"

echo ""
echo "【上級レベル: 8/8】"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-historical-figures.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-historical-figures-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-historical-figures.json" \
  --level advanced \
  --theme "歴史・偉人"
echo "✅ advanced-historical-figures.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-technology-future.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-technology-future-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-technology-future.json" \
  --level advanced \
  --theme "科学技術・未来"
echo "✅ advanced-technology-future.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-health-statistics.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-health-statistics-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-health-statistics.json" \
  --level advanced \
  --theme "健康・統計"
echo "✅ advanced-health-statistics.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-environmental-issues.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-environmental-issues-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-environmental-issues.json" \
  --level advanced \
  --theme "環境問題・持続可能性"
echo "✅ advanced-environmental-issues.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-summer-vacation-stories.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-summer-vacation-stories-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-summer-vacation-stories.json" \
  --level advanced \
  --theme "夏休み・体験談"
echo "✅ advanced-summer-vacation-stories.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-family-gathering.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-family-gathering-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-family-gathering.json" \
  --level advanced \
  --theme "家族・伝統"
echo "✅ advanced-family-gathering.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-international-exchange.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-international-exchange-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-international-exchange.json" \
  --level advanced \
  --theme "国際交流・多文化"
echo "✅ advanced-international-exchange.json 生成完了"

python3 "$SCRIPT" \
  --passage "$PASSAGES_DIR/advanced-school-festival.txt" \
  --translation "$TRANSLATIONS_DIR/advanced-school-festival-ja.txt" \
  --dictionary "$DICTIONARY" \
  --output "$OUTPUT_DIR/advanced-school-festival.json" \
  --level advanced \
  --theme "学校祭・プロジェクト"
echo "✅ advanced-school-festival.json 生成完了"

echo ""
echo "========================================"
echo "✅ 全21パッセージのJSON生成完了"
echo "========================================"
echo ""
echo "生成されたファイル:"
ls -lh "$OUTPUT_DIR"/*.json | wc -l
echo "個のJSONファイル"
