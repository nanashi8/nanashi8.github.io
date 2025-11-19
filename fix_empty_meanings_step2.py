#!/usr/bin/env python3
"""
reading-passages-comprehensive.jsonの空白の意味を修正するスクリプト (Step 2)
次の頻出単語（50語）の意味を一括で修正します。
"""

import json
from pathlib import Path

# 次の頻出単語とその意味の辞書
WORD_MEANINGS_STEP2 = {
    'not': '〜ない',
    'like': '好きだ、〜のような',
    'must': '〜しなければならない',
    'that': 'それ、〜ということ',
    'future': '未来',
    'world': '世界',
    'sleep': '睡眠、眠る',
    'one': '一つ',
    'pollution': '汚染',
    'need': '必要とする',
    'provide': '提供する',
    'do': 'する',
    'food': '食べ物',
    'body': '体',
    'take': '取る',
    'by': '〜によって',
    'activities': '活動',
    'now': '今',
    'my': '私の',
    'day': '日',
    'new': '新しい',
    'better': 'より良い',
    'some': 'いくつかの',
    'has': '持っている',
    'let': '〜させる',
    'clean': 'きれいな、掃除する',
    'air': '空気',
    'eat': '食べる',
    'small': '小さい',
    'much': '多くの',
    'too': '〜すぎる、また',
    'learn': '学ぶ',
    'all': 'すべて',
    'cars': '車',
    'reduce': '減らす',
    'as': '〜として',
    'good': '良い',
    'daily': '毎日の',
    'protect': '守る',
    'work': '働く、仕事',
    'up': '上へ',
    'will': '〜だろう',
    'young': '若い',
    'friends': '友達',
    'together': '一緒に',
    'planet': '惑星',
    'most': 'ほとんど',
    'plastic': 'プラスチック',
    'less': 'より少ない',
    'other': '他の',
}

def fix_empty_meanings(input_file: Path, output_file: Path):
    """空白の意味を修正する"""
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_count = 0
    total_segments = 0
    
    for passage in data:
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                total_segments += 1
                word = segment.get('word', '')
                meaning = segment.get('meaning', '')
                word_lower = word.lower()
                
                # 意味が空白で、辞書に存在する場合
                if (not meaning or len(meaning.strip()) == 0) and word_lower in WORD_MEANINGS_STEP2:
                    segment['meaning'] = WORD_MEANINGS_STEP2[word_lower]
                    fixed_count += 1
    
    print(f"Fixed {fixed_count} meanings out of {total_segments} total segments")
    print(f"Writing to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Done!")

if __name__ == '__main__':
    input_file = Path('public/data/reading-passages-comprehensive.json')
    output_file = Path('public/data/reading-passages-comprehensive.json')
    
    fix_empty_meanings(input_file, output_file)
