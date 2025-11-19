#!/usr/bin/env python3
"""
reading-passages-comprehensive.jsonの空白の意味を修正するスクリプト (Step 1)
最頻出の基本単語（上位50語）の意味を一括で修正します。
"""

import json
from pathlib import Path

# 最頻出の基本単語とその意味の辞書
BASIC_WORD_MEANINGS = {
    'and': 'そして',
    'the': 'その',
    'to': '〜へ',
    'can': '〜できる',
    'we': '私たち',
    'is': 'である',
    'a': '一つの',
    'of': '〜の',
    'they': '彼ら',
    'are': 'である',
    'in': '〜の中に',
    'for': '〜のために',
    'it': 'それ',
    'our': '私たちの',
    'us': '私たち',
    'this': 'これ',
    'i': '私',
    'also': 'また',
    'with': '〜と',
    'health': '健康',
    'technology': '技術',
    'people': '人々',
    'these': 'これらの',
    'healthy': '健康的な',
    'when': '〜とき',
    'many': '多くの',
    'use': '使う',
    'or': 'または',
    'help': '助ける',
    'energy': 'エネルギー',
    'you': 'あなた',
    'have': '持っている',
    'make': '作る',
    'on': '〜の上に',
    'at': '〜で',
    'time': '時間',
    'more': 'もっと',
    'be': 'である',
    'exercise': '運動',
    'water': '水',
    'from': '〜から',
    'helps': '助ける',
    'important': '重要な',
    'should': '〜すべき',
    'problems': '問題',
    'about': '〜について',
    'every': '毎',
    'but': 'しかし',
    'life': '人生',
    'your': 'あなたの',
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
                
                # 意味が空白で、基本単語辞書に存在する場合
                if (not meaning or len(meaning.strip()) == 0) and word_lower in BASIC_WORD_MEANINGS:
                    segment['meaning'] = BASIC_WORD_MEANINGS[word_lower]
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
