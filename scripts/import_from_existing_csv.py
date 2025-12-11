#!/usr/bin/env python3
"""
既存CSVから(要確認)単語の意味をインポート

intermediate-1800-words.csv と junior-high-entrance-words.csv に
存在する単語の意味を reading-passages-dictionary.json と
パッセージファイルに反映します。
"""

import json
import csv
from pathlib import Path
from collections import defaultdict

def load_csv_vocabulary():
    """既存CSVファイルから語彙を読み込む"""
    vocab_files = [
        'public/data/vocabulary/intermediate-1800-words.csv',
        'public/data/vocabulary/junior-high-entrance-words.csv'
    ]
    
    csv_vocab = {}
    for csv_file in vocab_files:
        source = 'intermediate-csv' if 'intermediate' in csv_file else 'junior-csv'
        print(f'📖 読み込み中: {csv_file}')
        
        with open(csv_file, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                word = row['語句'].strip()
                meaning = row['意味'].strip()
                
                if word and meaning:
                    # 大文字小文字を区別せずに保存
                    key = word.lower()
                    if key not in csv_vocab:
                        csv_vocab[key] = {
                            'word': word,
                            'meaning': meaning,
                            'source': source
                        }
    
    print(f'✅ CSV語彙: {len(csv_vocab)}語\n')
    return csv_vocab

def update_dictionary(csv_vocab):
    """辞書ファイルを更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = 0
    for word, word_entry in dictionary.items():
        key = word.lower()
        
        # (要確認)で、かつCSVに存在する場合
        if word_entry.get('meaning') == '(要確認)' and key in csv_vocab:
            csv_entry = csv_vocab[key]
            word_entry['meaning'] = csv_entry['meaning']
            word_entry['source'] = csv_entry['source']
            updated += 1
    
    # 保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f'📚 辞書更新: {updated}語')
    return updated

def update_passage_files(csv_vocab):
    """全パッセージファイルを更新"""
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
                key = word.lower()
                
                # (要確認)で、かつCSVに存在する場合
                if segment.get('meaning') == '(要確認)' and key in csv_vocab:
                    csv_entry = csv_vocab[key]
                    segment['meaning'] = csv_entry['meaning']
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
    print('既存CSVから単語意味をインポート')
    print('=' * 60)
    print()
    
    # CSVから語彙を読み込み
    csv_vocab = load_csv_vocabulary()
    
    # 辞書を更新
    dict_updates = update_dictionary(csv_vocab)
    print()
    
    # パッセージファイルを更新
    passage_updates = update_passage_files(csv_vocab)
    
    # 結果分析
    analyze_remaining()
    
    print()
    print('=' * 60)
    print(f'✅ 完了: 辞書{dict_updates}語、パッセージ{passage_updates}箇所を更新')
    print('=' * 60)

if __name__ == '__main__':
    main()
