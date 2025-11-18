#!/usr/bin/env python3
"""
長文読解データから全単語を抽出し、辞書にない単語をリストアップ
"""

import json
import csv
import os
import re

def load_dictionary():
    """CSVから辞書を読み込み"""
    dictionary = set()
    csv_path = 'public/data/junior-high-entrance-words.csv'
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = row['語句'].lower().strip()
            dictionary.add(word)
    
    print(f'辞書から{len(dictionary)}単語を読み込みました')
    return dictionary

def lemmatize(word, dictionary):
    """
    単語の原形を推定（ComprehensiveReadingView.tsxのgetLemmaと同じロジック）
    """
    word = word.lower().strip()
    
    # 句読点を除去
    word = re.sub(r'[.,!?;:\'"]+$', '', word)
    
    if not word:
        return None
    
    # 既に辞書にある
    if word in dictionary:
        return word
    
    # -s, -es の除去（三単現、複数形）
    if word.endswith('es'):
        base = word[:-2]
        if base in dictionary:
            return base
    if word.endswith('s'):
        base = word[:-1]
        if base in dictionary:
            return base
    
    # -ed の除去（過去形、過去分詞）
    if word.endswith('ed'):
        base = word[:-2]
        if base in dictionary:
            return base
        if base + 'e' in dictionary:
            return base + 'e'
        # 子音の重複を戻す (stopped -> stop)
        if len(base) > 2 and base[-1] == base[-2]:
            deduped = base[:-1]
            if deduped in dictionary:
                return deduped
    
    # -ing の除去（現在分詞、動名詞）
    if word.endswith('ing'):
        base = word[:-3]
        if base in dictionary:
            return base
        if base + 'e' in dictionary:
            return base + 'e'
        # 子音の重複を戻す (running -> run)
        if len(base) > 2 and base[-1] == base[-2]:
            deduped = base[:-1]
            if deduped in dictionary:
                return deduped
    
    # -ly の除去（副詞）
    if word.endswith('ly'):
        base = word[:-2]
        if base in dictionary:
            return base
    
    # -er, -est の除去（比較級、最上級）
    if word.endswith('er'):
        base = word[:-2]
        if base in dictionary:
            return base
    if word.endswith('est'):
        base = word[:-3]
        if base in dictionary:
            return base
    
    return None

def extract_words_from_passages():
    """長文データから全単語を抽出"""
    prototype_dir = 'prototype'
    all_words = set()
    
    for filename in sorted(os.listdir(prototype_dir)):
        if filename.endswith('.json'):
            filepath = os.path.join(prototype_dir, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            for phrase in data.get('phrases', []):
                for word in phrase.get('words', []):
                    # 句読点を除去して正規化
                    clean_word = re.sub(r'[.,!?;:\'"]+$', '', word).lower().strip()
                    if clean_word and not re.match(r'^[.,!?;:\'"]+$', clean_word):
                        all_words.add(clean_word)
    
    return all_words

def main():
    # 辞書を読み込み
    dictionary = load_dictionary()
    
    # 長文から単語を抽出
    all_words = extract_words_from_passages()
    print(f'長文から{len(all_words)}個のユニークな単語を抽出しました')
    
    # 辞書にない単語を特定
    missing_words = []
    for word in sorted(all_words):
        lemma = lemmatize(word, dictionary)
        if lemma is None:
            missing_words.append(word)
    
    # 結果を表示
    print(f'\n辞書にない単語: {len(missing_words)}個')
    print('=' * 60)
    for word in missing_words:
        print(word)
    
    # ファイルに保存
    output_file = 'missing_words_detailed.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f'辞書にない単語: {len(missing_words)}個\n')
        f.write('=' * 60 + '\n')
        for word in missing_words:
            f.write(f'{word}\n')
    
    print(f'\n結果を {output_file} に保存しました')

if __name__ == '__main__':
    main()
