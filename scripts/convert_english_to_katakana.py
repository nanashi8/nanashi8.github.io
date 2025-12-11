#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
括弧内の英語スペルをIPAから推測したカタカナに変換
"""

import csv
import re

# 手動で作成した英語スペル → カタカナマッピング
KATAKANA_READINGS = {
    'Abroad': 'アブロ́ード',
    'Accident': 'ア́クシデント',
    'According': 'アコ́ーディング',
    'Action': 'ア́クション',
    'Actually': 'ア́クチュアリ',
    'Against': 'アゲ́インスト',
    'Ahead': 'アヘ́ッド',
    'Aid': 'エ́イド',
    'Airplane': 'エ́アプレイン',
    'Airport': 'エ́アポート',
    'Area': 'エ́リア',
    'Around': 'アラ́ウンド',
    'August': 'オ́ーガスト',
    'Awesome': 'オ́ーサム',
    'Baby': 'ベ́イビー',
    'Bacon': 'ベ́イコン',
    'Badminton': 'バ́ドミントン',
    'Bake': 'ベ́イク',
    'Bomb': 'ボ́ム',
    'Bookstore': 'ブ́ックストア',
    'Bored': 'ボ́ード',
}

def convert_english_to_katakana(input_file):
    """括弧内の英語スペルをカタカナに変換"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    header = rows[0]
    data_rows = rows[1:]
    
    fixed_count = 0
    not_found = []
    
    for row in data_rows:
        if len(row) < 2:
            continue
        
        word = row[0]
        reading = row[1]
        
        # パターン: IPA (英語スペル)
        match = re.search(r'(.+)\s*\(([A-Z][a-z]+)\)$', reading)
        
        if match:
            ipa_part = match.group(1).strip()
            english_word = match.group(2)
            
            if english_word in KATAKANA_READINGS:
                katakana = KATAKANA_READINGS[english_word]
                new_reading = f"{ipa_part} ({katakana})"
                row[1] = new_reading
                fixed_count += 1
                if fixed_count <= 10:
                    print(f"  ✅ {word}: ({english_word}) → ({katakana})")
            else:
                not_found.append((word, english_word))
    
    # ファイルに書き戻し
    with open(input_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows([header] + data_rows)
    
    return fixed_count, not_found

def main():
    import sys
    
    file_path = './public/data/vocabulary/intermediate-1800-words.csv'
    
    print(f"📝 処理中: {file_path.split('/')[-1]}\n")
    
    count, not_found = convert_english_to_katakana(file_path)
    
    print(f"\n✅ 修正完了: {count}箇所")
    
    if not_found:
        print(f"\n⚠️  マッピング未定義 ({len(not_found)}件):")
        for word, english in not_found[:20]:
            print(f"    '{english}': 'カタカナ',  # {word}")

if __name__ == '__main__':
    main()
