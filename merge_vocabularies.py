#!/usr/bin/env python3
"""
vocabulary_listsフォルダのデータをjunior-high-entrance-words.csvに統合
"""

import json
import csv
import os

def load_existing_dictionary():
    """既存の辞書を読み込み"""
    dictionary = {}
    csv_path = 'public/data/junior-high-entrance-words.csv'
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = row['語句'].lower().strip()
            dictionary[word] = row
    
    return dictionary

def load_vocabulary_lists():
    """vocabulary_listsフォルダから全単語を読み込み"""
    vocab_dir = 'vocabulary_lists'
    all_words = {}
    
    for filename in sorted(os.listdir(vocab_dir)):
        if filename.endswith('.json') and filename != 'all_themes_summary.json':
            filepath = os.path.join(vocab_dir, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # main_vocabularyから単語を抽出
            for vocab in data.get('main_vocabulary', []):
                word = vocab.get('word', '').lower().strip()
                if word and word not in all_words:
                    all_words[word] = {
                        '語句': vocab.get('word', ''),
                        '読み': vocab.get('reading', ''),
                        '意味': vocab.get('meaning', ''),
                        '語源等解説': vocab.get('etymology', ''),
                        '関連語': vocab.get('related', ''),
                        '関連分野': vocab.get('category', ''),
                        '難易度': data.get('level', '初級')
                    }
    
    return all_words

def merge_dictionaries():
    """既存の辞書とvocabulary_listsのデータをマージ"""
    print('既存の辞書を読み込んでいます...')
    existing_dict = load_existing_dictionary()
    print(f'既存の辞書: {len(existing_dict)}単語')
    
    print('\nvocabulary_listsを読み込んでいます...')
    vocab_dict = load_vocabulary_lists()
    print(f'vocabulary_lists: {len(vocab_dict)}単語')
    
    # マージ
    added = 0
    for word, data in vocab_dict.items():
        if word not in existing_dict:
            existing_dict[word] = data
            added += 1
    
    print(f'\n{added}個の新しい単語を追加しました')
    print(f'合計: {len(existing_dict)}単語')
    
    # CSVに書き出し
    output_file = 'public/data/junior-high-entrance-words.csv'
    fieldnames = ['語句', '読み', '意味', '語源等解説', '関連語', '関連分野', '難易度']
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for word in sorted(existing_dict.keys()):
            writer.writerow(existing_dict[word])
    
    print(f'\n{output_file}に保存しました')

if __name__ == '__main__':
    merge_dictionaries()
