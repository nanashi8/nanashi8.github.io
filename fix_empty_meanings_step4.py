#!/usr/bin/env python3
"""
reading-passages-comprehensive.jsonの空白の意味を修正するスクリプト (Step 4)
次の頻出単語（80語）の意味を一括で修正します。
"""

import json
from pathlib import Path

# 次の頻出単語とその意味の辞書
WORD_MEANINGS_STEP4 = {
    'share': '共有する',
    'who': '誰',
    'everyone': 'みんな',
    'affect': '影響を与える',
    'plants': '植物',
    'power': '力',
    'cause': '原因、引き起こす',
    'waste': '無駄、廃棄物',
    'into': '〜の中へ',
    'forests': '森林',
    'trees': '木',
    'there': 'そこに',
    'homes': '家',
    'their': '彼らの',
    'greenhouse': '温室',
    'affects': '影響を与える',
    'means': '意味する',
    'travel': '旅行する',
    'if': 'もし',
    'others': '他の人',
    'add': '加える',
    'reduces': '減らす',
    'education': '教育',
    'support': '支える',
    'benefits': '利益',
    'no': 'いいえ',
    'build': '建てる',
    'science': '科学',
    'explore': '探検する',
    'information': '情報',
    'find': '見つける',
    'feel': '感じる',
    'family': '家族',
    'mental': '精神的な',
    'during': '〜の間',
    'play': '遊ぶ',
    'soccer': 'サッカー',
    'watch': '見る',
    'games': 'ゲーム',
    'sometimes': '時々',
    'fun': '楽しい',
    'way': '方法',
    'learning': '学習',
    'was': 'だった',
    'give': '与える',
    'however': 'しかし',
    'understand': '理解する',
    'dangerous': '危険な',
    'major': '主要な',
    'oceans': '海',
    'millions': '何百万',
    'change': '変化',
    'human': '人間の',
    'gas': 'ガス',
    'electricity': '電気',
    'devices': '装置',
    'light': '光',
    'wind': '風',
    'responsibility': '責任',
    'lives': '生活',
    'eating': '食べること',
    'long': '長い',
    'companies': '会社',
    'prevent': '防ぐ',
    'living': '生活',
    'part': '部分',
    'modern': '現代の',
    'instantly': '即座に',
    'early': '早い',
    'different': '違う',
    'nuclear': '核の',
    'control': '制御する',
    'physical': '身体的な',
    'muscles': '筋肉',
    'iron': '鉄',
    'drink': '飲む',
    'ingredients': '材料',
    'prevents': '防ぐ',
    'mood': '気分',
    'choices': '選択',
    'stay': '滞在する',
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
                if (not meaning or len(meaning.strip()) == 0) and word_lower in WORD_MEANINGS_STEP4:
                    segment['meaning'] = WORD_MEANINGS_STEP4[word_lower]
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
