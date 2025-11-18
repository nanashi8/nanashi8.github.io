#!/usr/bin/env python3
"""
長文読解パッセージで意味が表示されない単語を確認する
"""
import json
import csv
import re

# メイン辞書を読み込み
main_dict = {}
with open('public/data/junior-high-entrance-words.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # ヘッダーをスキップ
    for row in reader:
        if len(row) >= 3:
            word = row[0].strip().lower()
            main_dict[word] = row[2].strip() if len(row) > 2 else ''

# 長文読解辞書を読み込み
reading_dict = {}
try:
    with open('public/data/reading-passages-dictionary.json', 'r', encoding='utf-8') as f:
        reading_data = json.load(f)
        for word, info in reading_data.items():
            reading_dict[word.lower()] = info.get('meaning', '')
except FileNotFoundError:
    print("長文読解辞書が見つかりません")

# 統合パッセージファイルを読み込み
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

# 意味が見つからない単語を収集
missing_words = {}

for passage in passages:
    passage_id = passage.get('id', 'unknown')
    passage_title = passage.get('title', 'Untitled')
    
    for phrase in passage.get('phrases', []):
        for word in phrase.get('words', []):
            # 句読点をスキップ
            if re.match(r'^[.,!?;:]$', word):
                continue
            
            # 句読点を除去して正規化
            word_normalized = re.sub(r'[.,!?;:"\']+', '', word).lower().strip()
            
            # 空の場合はスキップ
            if not word_normalized:
                continue
            
            # 辞書で検索
            if word_normalized not in main_dict and word_normalized not in reading_dict:
                if word_normalized not in missing_words:
                    missing_words[word_normalized] = {
                        'word': word,
                        'passages': []
                    }
                missing_words[word_normalized]['passages'].append({
                    'id': passage_id,
                    'title': passage_title
                })

# 結果を表示
print(f"\n意味が見つからない単語: {len(missing_words)}語\n")
print("=" * 80)

for word_lower, info in sorted(missing_words.items())[:50]:  # 最初の50語のみ表示
    print(f"\n単語: {info['word']}")
    print(f"出現パッセージ: {len(info['passages'])}箇所")
    for p in info['passages'][:3]:  # 最初の3つのみ表示
        print(f"  - {p['id']}: {p['title']}")

print(f"\n\n合計: {len(missing_words)}語が辞書に見つかりませんでした")

# 詳細なリストをファイルに保存
with open('missing_meanings_detailed.txt', 'w', encoding='utf-8') as f:
    for word_lower, info in sorted(missing_words.items()):
        f.write(f"{info['word']}\n")
        for p in info['passages']:
            f.write(f"  {p['id']}: {p['title']}\n")
        f.write("\n")

print(f"詳細リストを missing_meanings_detailed.txt に保存しました")
