#!/usr/bin/env python3
"""
長文読解データから全単語を抽出し、専用の辞書JSONファイルを作成
数字、派生語、活用形、固有名詞、専門用語も全て含む
"""

import json
import csv
import os
import re

def load_main_dictionary():
    """メインの辞書（junior-high-entrance-words.csv）を読み込み"""
    dictionary = {}
    csv_path = 'public/data/junior-high-entrance-words.csv'
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = row['語句'].lower().strip()
            dictionary[word] = {
                'word': row['語句'],
                'reading': row['読み'],
                'meaning': row['意味'],
                'etymology': row['語源等解説'],
                'relatedWords': row['関連語'],
                'category': row['関連分野'],
                'difficulty': row['難易度'],
                'source': 'main'
            }
    
    return dictionary

def extract_all_words_from_passages():
    """長文データから全単語を抽出（重複なし）"""
    prototype_dir = 'prototype'
    all_words = {}  # word -> {level, passages}
    
    for filename in sorted(os.listdir(prototype_dir)):
        if filename.endswith('.json'):
            filepath = os.path.join(prototype_dir, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            level = data.get('level', '不明')
            passage_id = data.get('id', filename)
            
            for phrase in data.get('phrases', []):
                for word in phrase.get('words', []):
                    # 句読点を除去
                    clean_word = re.sub(r'^[.,!?;:\'"]+|[.,!?;:\'"]+$', '', word).strip()
                    if not clean_word:
                        continue
                    
                    lower_word = clean_word.lower()
                    
                    if lower_word not in all_words:
                        all_words[lower_word] = {
                            'original': clean_word,
                            'levels': set(),
                            'passages': set()
                        }
                    
                    all_words[lower_word]['levels'].add(level)
                    all_words[lower_word]['passages'].add(passage_id)
    
    return all_words

def generate_meaning(word, base_word_info=None):
    """単語の意味を自動生成（基本的なルールベース）"""
    word_lower = word.lower()
    
    # 数字
    if word_lower.isdigit():
        return f"{word}（数字）"
    
    # 年号
    if re.match(r'^\d{4}$', word_lower):
        return f"{word}年"
    
    # パーセント、度数など
    if re.match(r'^\d+%$', word_lower):
        return f"{word}パーセント"
    
    # 基本単語の情報がある場合
    if base_word_info:
        base_meaning = base_word_info.get('meaning', '')
        
        # 複数形 (-s, -es)
        if word_lower.endswith('s') and not word_lower.endswith('ss'):
            if word_lower.endswith('ies'):
                return f"{base_meaning}（複数形）"
            elif word_lower.endswith('es'):
                return f"{base_meaning}（複数形）"
            else:
                return f"{base_meaning}（複数形）"
        
        # 過去形・過去分詞 (-ed)
        if word_lower.endswith('ed'):
            return f"{base_meaning}（過去形・過去分詞）"
        
        # 現在分詞・動名詞 (-ing)
        if word_lower.endswith('ing'):
            return f"{base_meaning}（現在分詞・動名詞）"
        
        # 副詞 (-ly)
        if word_lower.endswith('ly'):
            return f"{base_meaning}（副詞形）"
        
        # 名詞形 (-tion, -sion, -ment, -ness, -ity)
        if word_lower.endswith(('tion', 'sion', 'ment', 'ness', 'ity', 'ance', 'ence')):
            return f"{base_meaning}（名詞形）"
        
        # 形容詞形 (-ful, -less, -ous, -ive, -al, -able)
        if word_lower.endswith(('ful', 'less', 'ous', 'ive', 'al', 'able', 'ible')):
            return f"{base_meaning}（形容詞形）"
    
    # 固有名詞（大文字始まり）
    if word[0].isupper():
        # 国名・地名の可能性
        if word_lower in ['america', 'china', 'japan', 'africa', 'europe', 'asia']:
            return f"{word}（地名・国名）"
        
        # 月名
        months = {
            'january': '1月', 'february': '2月', 'march': '3月', 'april': '4月',
            'may': '5月', 'june': '6月', 'july': '7月', 'august': '8月',
            'september': '9月', 'october': '10月', 'november': '11月', 'december': '12月'
        }
        if word_lower in months:
            return months[word_lower]
        
        # 曜日
        days = {
            'monday': '月曜日', 'tuesday': '火曜日', 'wednesday': '水曜日',
            'thursday': '木曜日', 'friday': '金曜日', 'saturday': '土曜日', 'sunday': '日曜日'
        }
        if word_lower in days:
            return days[word_lower]
        
        return f"{word}（固有名詞）"
    
    # 略語
    if word_lower in ['ai', 'iot', 'gps', 'dna', 'un', 'usa', 'uk', 'eu', 'co2', 'pm', 'am']:
        abbreviations = {
            'ai': '人工知能',
            'iot': 'モノのインターネット',
            'gps': '全地球測位システム',
            'dna': 'デオキシリボ核酸',
            'un': '国際連合',
            'usa': 'アメリカ合衆国',
            'uk': 'イギリス',
            'eu': '欧州連合',
            'co2': '二酸化炭素',
            'pm': '午後',
            'am': '午前'
        }
        return abbreviations.get(word_lower, f"{word.upper()}（略語）")
    
    # その他
    return "-"

def find_base_word(word, main_dict):
    """基本形を探す（getLemmaと同じロジック）"""
    word = word.lower()
    
    # 既に辞書にある
    if word in main_dict:
        return word
    
    # -s, -es の除去（三単現、複数形）
    if word.endswith('ies') and len(word) > 3:
        base = word[:-3] + 'y'
        if base in main_dict:
            return base
    
    if word.endswith('es') and len(word) > 2:
        base = word[:-2]
        if base in main_dict:
            return base
    
    if word.endswith('s') and len(word) > 1:
        base = word[:-1]
        if base in main_dict:
            return base
    
    # -ed の除去（過去形、過去分詞）
    if word.endswith('ed') and len(word) > 2:
        base = word[:-2]
        if base in main_dict:
            return base
        if base + 'e' in main_dict:
            return base + 'e'
        # 子音の重複を戻す
        if len(base) > 2 and base[-1] == base[-2]:
            deduped = base[:-1]
            if deduped in main_dict:
                return deduped
    
    # -ing の除去（現在分詞、動名詞）
    if word.endswith('ing') and len(word) > 3:
        base = word[:-3]
        if base in main_dict:
            return base
        if base + 'e' in main_dict:
            return base + 'e'
        # 子音の重複を戻す
        if len(base) > 2 and base[-1] == base[-2]:
            deduped = base[:-1]
            if deduped in main_dict:
                return deduped
    
    # -ly の除去（副詞）
    if word.endswith('ly') and len(word) > 2:
        base = word[:-2]
        if base in main_dict:
            return base
    
    # -er, -est の除去（比較級、最上級）
    if word.endswith('er') and len(word) > 2:
        base = word[:-2]
        if base in main_dict:
            return base
    
    if word.endswith('est') and len(word) > 3:
        base = word[:-3]
        if base in main_dict:
            return base
    
    return None

def create_comprehensive_dictionary():
    """包括的な長文読解用辞書を作成"""
    print('メイン辞書を読み込んでいます...')
    main_dict = load_main_dictionary()
    print(f'メイン辞書: {len(main_dict)}単語')
    
    print('\n長文から全単語を抽出しています...')
    passage_words = extract_all_words_from_passages()
    print(f'長文から抽出: {len(passage_words)}単語')
    
    # 包括的辞書を構築
    comprehensive_dict = {}
    added_from_main = 0
    added_auto = 0
    
    for word_lower, word_info in passage_words.items():
        original = word_info['original']
        levels = list(word_info['levels'])
        passages = list(word_info['passages'])
        
        # メイン辞書にある場合
        if word_lower in main_dict:
            comprehensive_dict[word_lower] = {
                **main_dict[word_lower],
                'levels': levels,
                'passages': passages,
                'source': 'main'
            }
            added_from_main += 1
        else:
            # 基本形を探す
            base_word = find_base_word(word_lower, main_dict)
            base_word_info = main_dict.get(base_word) if base_word else None
            
            # 意味を生成
            meaning = generate_meaning(original, base_word_info)
            
            # 基本情報を設定
            reading = "-"
            etymology = ""
            related_words = ""
            category = "その他"
            difficulty = "長文専用"
            
            if base_word_info:
                reading = f"({base_word_info['reading']}の派生)"
                etymology = f"{base_word_info['word']}の派生形"
                category = base_word_info.get('category', 'その他')
            
            comprehensive_dict[word_lower] = {
                'word': original,
                'reading': reading,
                'meaning': meaning,
                'etymology': etymology,
                'relatedWords': related_words,
                'category': category,
                'difficulty': difficulty,
                'levels': levels,
                'passages': passages,
                'source': 'auto',
                'baseWord': base_word
            }
            added_auto += 1
    
    print(f'\n辞書構築完了:')
    print(f'  メイン辞書から: {added_from_main}単語')
    print(f'  自動生成: {added_auto}単語')
    print(f'  合計: {len(comprehensive_dict)}単語')
    
    # JSONファイルとして保存
    output_file = 'public/data/reading-passages-dictionary.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(comprehensive_dict, f, ensure_ascii=False, indent=2)
    
    print(f'\n{output_file}に保存しました')
    
    # 統計情報を出力
    print('\n=== 統計情報 ===')
    auto_words = [w for w, info in comprehensive_dict.items() if info['source'] == 'auto']
    print(f'自動生成単語の例（最初の20個）:')
    for word in sorted(auto_words)[:20]:
        info = comprehensive_dict[word]
        print(f'  {info["word"]}: {info["meaning"]}')

if __name__ == '__main__':
    create_comprehensive_dictionary()
