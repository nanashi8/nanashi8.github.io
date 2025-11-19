#!/usr/bin/env python3
"""
reading-passages-comprehensive.jsonの空白の意味を修正するスクリプト (Step 3)
次の頻出単語（60語）の意味を一括で修正します。
"""

import json
from pathlib import Path

# 次の頻出単語とその意味の辞書
WORD_MEANINGS_STEP3 = {
    'start': '始める',
    'using': '使うこと',
    'how': 'どのように',
    'students': '生徒',
    'diseases': '病気',
    'hobbies': '趣味',
    'school': '学校',
    'things': '物事',
    'another': '別の',
    'environment': '環境',
    'today': '今日',
    'an': '一つの',
    'space': '空間、宇宙',
    'may': '〜かもしれない',
    'than': '〜より',
    'computers': 'コンピュータ',
    'create': '作る',
    'where': 'どこ',
    'before': '前に',
    'online': 'オンラインで',
    'could': '〜できた',
    'improves': '改善する',
    'music': '音楽',
    'them': '彼ら',
    'after': '後で',
    'nature': '自然',
    'stress': 'ストレス',
    'become': 'なる',
    'environmental': '環境の',
    'humans': '人間',
    'gases': 'ガス',
    'produce': '生産する',
    'heart': '心臓',
    'essential': '必須の',
    'harm': '害',
    'even': '〜さえ',
    'difference': '違い',
    'materials': '材料',
    'products': '製品',
    'vegetables': '野菜',
    'avoid': '避ける',
    'provides': '提供する',
    'scientists': '科学者',
    'matters': '重要である',
    'just': 'ちょうど',
    'digital': 'デジタルの',
    'robots': 'ロボット',
    'hours': '時間',
    'contain': '含む',
    'regular': '定期的な',
    'foods': '食べ物',
    'habits': '習慣',
    'sports': 'スポーツ',
    'me': '私を',
    'practice': '練習する',
    'very': 'とても',
    'often': 'よく',
    'want': '欲しい',
    'years': '年',
    'best': '最高の',
    'so': 'だから',
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
                if (not meaning or len(meaning.strip()) == 0) and word_lower in WORD_MEANINGS_STEP3:
                    segment['meaning'] = WORD_MEANINGS_STEP3[word_lower]
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
