#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
括弧内の英語スペルをカタカナ発音(アクセント付き)に修正するスクリプト
例: (Abroad) → (アブロ́ード)
"""

import csv
import re
import sys

# 英語スペル → カタカナ発音のマッピング
KATAKANA_MAP = {
    'Abroad': 'アブロ́ード',
    'Accident': 'アクシデント',
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

def fix_katakana_in_csv(input_file):
    """CSVファイル内の括弧内英語スペルをカタカナに修正"""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_count = 0
    
    # パターン: (英単語) を検索
    pattern = r'\(([A-Z][a-z]+)\)'
    
    def replace_func(match):
        nonlocal changes_count
        english_word = match.group(1)
        if english_word in KATAKANA_MAP:
            changes_count += 1
            return f"({KATAKANA_MAP[english_word]})"
        return match.group(0)  # マッピングにない場合はそのまま
    
    new_content = re.sub(pattern, replace_func, content)
    
    # ファイルに書き戻し
    if new_content != original_content:
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ {input_file}")
        print(f"   修正箇所: {changes_count}件\n")
    else:
        print(f"⚠️  {input_file}: 修正箇所なし\n")
    
    return changes_count

def main():
    files = [
        './public/data/vocabulary/intermediate-1800-words.csv',
        './public/data/vocabulary/junior-high-entrance-words.csv',
        './public/data/vocabulary/intermediate-1800-phrases.csv',
        './public/data/vocabulary/junior-high-entrance-phrases.csv',
    ]
    
    total_changes = 0
    for file in files:
        try:
            changes = fix_katakana_in_csv(file)
            total_changes += changes
        except Exception as e:
            print(f"❌ エラー ({file}): {e}\n")
    
    print(f"{'='*60}")
    print(f"🎉 完了: 合計 {total_changes}箇所を修正")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
