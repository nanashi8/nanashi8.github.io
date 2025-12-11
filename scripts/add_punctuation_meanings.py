#!/usr/bin/env python3
"""
英文の記号・句読点に中学生向けの説明を追加

英文読解で重要な記号の役割を分かりやすく説明します。
"""

import json
from pathlib import Path

# 記号の説明辞書（中学生向け）
PUNCTUATION_DICT = {
    '.': '（ピリオド）文の終わり',
    ',': '（カンマ）区切り・並列',
    '!': '（感嘆符）驚き・強調',
    '?': '（疑問符）質問',
    ':': '（コロン）説明・例示が続く',
    ';': '（セミコロン）文の区切り',
    '—': '（ダッシュ）補足説明・強調',
    '"': '（引用符）会話・引用',
    "'": '（アポストロフィ）所有・省略',
    '(': '（開き括弧）補足情報の開始',
    ')': '（閉じ括弧）補足情報の終了',
}

def update_dictionary():
    """辞書ファイルに記号の説明を追加"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = 0
    added = 0
    
    for symbol, meaning in PUNCTUATION_DICT.items():
        if symbol in dictionary:
            # 既存エントリを更新（空白や(要確認)の場合のみ）
            current = dictionary[symbol].get('meaning', '')
            if not current or current == '(要確認)' or current.strip() == '':
                dictionary[symbol]['meaning'] = meaning
                dictionary[symbol]['source'] = 'punctuation'
                updated += 1
        else:
            # 新規エントリを追加
            dictionary[symbol] = {
                'meaning': meaning,
                'source': 'punctuation'
            }
            added += 1
    
    # 保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f'📚 辞書: {updated}語更新, {added}語追加')
    return updated + added

def update_passage_files():
    """全パッセージファイルの記号に説明を追加"""
    passages_dir = Path('public/data/passages-phrase-learning')
    total_updates = 0
    file_count = 0
    
    for passage_file in sorted(passages_dir.glob('*.json')):
        with open(passage_file, encoding='utf-8') as f:
            data = json.load(f)
        
        file_updates = 0
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                
                # 記号で、意味が空白または(要確認)の場合
                if word in PUNCTUATION_DICT:
                    current = segment.get('meaning', '')
                    if not current or current == '(要確認)' or current.strip() == '':
                        segment['meaning'] = PUNCTUATION_DICT[word]
                        file_updates += 1
        
        if file_updates > 0:
            # 保存
            with open(passage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            total_updates += file_updates
            file_count += 1
            print(f'  ✅ {passage_file.name}: {file_updates}箇所')
    
    print(f'\n📄 パッセージ: {file_count}ファイル, {total_updates}箇所更新')
    return total_updates

def analyze_result():
    """結果を分析"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    total = len(dictionary)
    confirmed = sum(1 for entry in dictionary.values() 
                   if entry.get('meaning') and entry.get('meaning') != '(要確認)')
    unconfirmed = total - confirmed
    
    print(f'\n📊 辞書の状態:')
    print(f'  総単語数: {total}語')
    print(f'  意味確定: {confirmed}語 ({confirmed/total*100:.1f}%)')
    print(f'  (要確認): {unconfirmed}語 ({unconfirmed/total*100:.1f}%)')

def main():
    print('=' * 60)
    print('英文記号・句読点の説明を追加')
    print('=' * 60)
    print()
    
    print(f'対象記号: {len(PUNCTUATION_DICT)}種類')
    for symbol, meaning in PUNCTUATION_DICT.items():
        print(f'  "{symbol}": {meaning}')
    print()
    
    # 辞書を更新
    dict_updates = update_dictionary()
    print()
    
    # パッセージファイルを更新
    passage_updates = update_passage_files()
    
    # 結果分析
    analyze_result()
    
    print()
    print('=' * 60)
    print(f'✅ 完了: 辞書{dict_updates}、パッセージ{passage_updates}箇所を更新')
    print('=' * 60)

if __name__ == '__main__':
    main()
