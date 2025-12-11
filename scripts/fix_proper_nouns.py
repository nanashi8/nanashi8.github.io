#!/usr/bin/env python3
"""
固有名詞と一般単語（大文字始まり）を処理

大文字で始まる単語を適切に分類して処理します。
"""

import json
from pathlib import Path

# 固有名詞辞書
PROPER_NOUNS_DICT = {
    # 人名
    "Mika's": 'ミカの',
    'Luther': 'ルター（人名）',
    'Anderson': 'アンダーソン（人名）',
    'Patel': 'パテル（人名）',
    'Nakamura': '中村（人名）',
    "Church's": '教会の',
    "Darwin's": 'ダーウィンの',
    "Gandhi's": 'ガンジーの',
    "Columbus's": 'コロンブスの',
    "Magellan's": 'マゼランの',
    "Moore's": 'ムーアの',
    "Children's": '子供の',
    "Women's": '女性の',
    
    # 地名・施設名
    'Louvre': 'ルーヴル美術館',
    'Nazareth': 'ナザレ',
    'Texas': 'テキサス',
    'Amazon': 'アマゾン',
    'Sentosa': 'セントーサ',
    
    # 組織・ブランド名
    'BTS': 'BTS（韓国の音楽グループ）',
    'Blackpink': 'BLACKPINK（韓国の音楽グループ）',
    'Bollywood': 'ボリウッド（インド映画）',
    'WeChat': 'WeChat（中国のアプリ）',
    'Alipay': 'Alipay（中国の決済サービス）',
    'IC': 'IC（集積回路）',
    
    # 歴史・文化用語
    'Enlightenment': '啓蒙時代',
    'Tamil': 'タミル語',
    'Arabian': 'アラビアの',
    
    # その他
    'Pelé': 'ペレ（サッカー選手）',
    'God': '神',
    'Rainforests': '熱帯雨林',
    'Laboratory': '実験室',
    'Biological': '生物学的な',
    'Documentaries': 'ドキュメンタリー',
    'Improper': '不適切な',
}

# 文頭の一般単語（小文字形式も確認）
SENTENCE_START_WORDS = {
    'Wow': 'わあ',
    'Hiking': 'ハイキング',
    'Rural': '田舎の・地方の',
    'Senior': '年長の・上級の',
    'Pancakes': 'パンケーキ',
    'Disagreement': '意見の相違',
    'Fairy': '妖精',
    'AV': 'AV（視聴覚）',
    'Decoration': '装飾',
    'Publicity': '宣伝・広報',
    'Comets': '彗星',
    'Milky': '乳白色の',
}

def update_dictionary():
    """辞書ファイルを更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    # 全ての辞書をマージ
    all_dict = {**PROPER_NOUNS_DICT, **SENTENCE_START_WORDS}
    
    updated = 0
    added = 0
    
    for word, meaning in all_dict.items():
        if word in dictionary:
            # 既存エントリを更新
            if dictionary[word].get('meaning') == '(要確認)':
                dictionary[word]['meaning'] = meaning
                if word in PROPER_NOUNS_DICT:
                    dictionary[word]['source'] = 'proper-noun'
                else:
                    dictionary[word]['source'] = 'sentence-start-word'
                updated += 1
        else:
            # 新規エントリを追加
            dictionary[word] = {
                'meaning': meaning,
                'source': 'proper-noun' if word in PROPER_NOUNS_DICT else 'sentence-start-word'
            }
            added += 1
    
    # 保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f'📚 辞書更新: {updated}語, 新規追加: {added}語')
    print(f'  固有名詞: {len(PROPER_NOUNS_DICT)}語')
    print(f'  文頭単語: {len(SENTENCE_START_WORDS)}語')
    return updated + added

def update_passage_files():
    """全パッセージファイルを更新"""
    passages_dir = Path('public/data/passages-phrase-learning')
    
    # 全ての辞書をマージ
    all_dict = {**PROPER_NOUNS_DICT, **SENTENCE_START_WORDS}
    
    total_updates = 0
    file_count = 0
    
    for passage_file in sorted(passages_dir.glob('*.json')):
        with open(passage_file, encoding='utf-8') as f:
            data = json.load(f)
        
        file_updates = 0
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                
                if segment.get('meaning') == '(要確認)' and word in all_dict:
                    segment['meaning'] = all_dict[word]
                    file_updates += 1
        
        if file_updates > 0:
            # 保存
            with open(passage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            total_updates += file_updates
            file_count += 1
            print(f'  ✅ {passage_file.name}: {file_updates}箇所')
    
    print(f'\n📄 パッセージ更新: {file_count}ファイル, {total_updates}箇所')
    return total_updates

def analyze_remaining():
    """残りの(要確認)を分析"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    total = len(dictionary)
    confirmed = sum(1 for word_entry in dictionary.values() if word_entry.get('meaning') != '(要確認)')
    unconfirmed = total - confirmed
    
    print(f'\n📊 辞書の状態:')
    print(f'  総単語数: {total}語')
    print(f'  意味確定: {confirmed}語 ({confirmed/total*100:.1f}%)')
    print(f'  (要確認): {unconfirmed}語 ({unconfirmed/total*100:.1f}%)')
    
    # パッセージの状態
    passages_dir = Path('public/data/passages-phrase-learning')
    unconfirmed_count = 0
    
    for f in passages_dir.glob('*.json'):
        data = json.load(open(f, encoding='utf-8'))
        for p in data.get('phrases', []):
            for s in p.get('segments', []):
                if s.get('meaning', '') == '(要確認)':
                    unconfirmed_count += 1
    
    print(f'\n📄 パッセージの状態:')
    print(f'  (要確認)箇所: {unconfirmed_count}箇所')

def main():
    print('=' * 60)
    print('固有名詞と大文字始まり単語を処理')
    print('=' * 60)
    print()
    
    print(f'対象: {len(PROPER_NOUNS_DICT) + len(SENTENCE_START_WORDS)}語')
    print(f'  固有名詞: {len(PROPER_NOUNS_DICT)}語')
    print(f'  文頭単語: {len(SENTENCE_START_WORDS)}語\n')
    
    # 辞書を更新
    dict_updates = update_dictionary()
    print()
    
    # パッセージファイルを更新
    passage_updates = update_passage_files()
    
    # 結果分析
    analyze_remaining()
    
    print()
    print('=' * 60)
    print(f'✅ 完了: 辞書{dict_updates}語、パッセージ{passage_updates}箇所を更新')
    print('=' * 60)

if __name__ == '__main__':
    main()
