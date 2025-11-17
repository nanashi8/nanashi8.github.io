#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

# 不規則な比較級・最上級
IRREGULAR_COMPARATIVES = {
    'good': {
        'comparative': 'better', 'superlative': 'best',
        'readings': {'comparative': 'ベター', 'superlative': 'ベスト'},
        'meanings': {'comparative': 'より良い', 'superlative': '最も良い'}
    },
    'well': {
        'comparative': 'better', 'superlative': 'best',
        'readings': {'comparative': 'ベター', 'superlative': 'ベスト'},
        'meanings': {'comparative': 'より良く', 'superlative': '最も良く'}
    },
    'bad': {
        'comparative': 'worse', 'superlative': 'worst',
        'readings': {'comparative': 'ワース', 'superlative': 'ワースト'},
        'meanings': {'comparative': 'より悪い', 'superlative': '最も悪い'}
    },
    'ill': {
        'comparative': 'worse', 'superlative': 'worst',
        'readings': {'comparative': 'ワース', 'superlative': 'ワースト'},
        'meanings': {'comparative': 'より悪い', 'superlative': '最も悪い'}
    },
    'many': {
        'comparative': 'more', 'superlative': 'most',
        'readings': {'comparative': 'モア', 'superlative': 'モウスト'},
        'meanings': {'comparative': 'より多くの', 'superlative': '最も多くの'}
    },
    'much': {
        'comparative': 'more', 'superlative': 'most',
        'readings': {'comparative': 'モア', 'superlative': 'モウスト'},
        'meanings': {'comparative': 'より多くの', 'superlative': '最も多くの'}
    },
    'little': {
        'comparative': 'less', 'superlative': 'least',
        'readings': {'comparative': 'レス', 'superlative': 'リースト'},
        'meanings': {'comparative': 'より少ない', 'superlative': '最も少ない'}
    },
    'far': {
        'comparative': 'farther', 'superlative': 'farthest',
        'readings': {'comparative': 'ファーザー', 'superlative': 'ファーゼスト'},
        'meanings': {'comparative': 'より遠い', 'superlative': '最も遠い'}
    },
}

def is_adjective_or_adverb(meaning, word):
    """形容詞または副詞かどうかを判定"""
    # 形容詞的パターン
    adj_patterns = ['い$', 'な$', '的$', '的な$']
    # 副詞は通常-lyで終わる
    is_adverb = word.endswith('ly')
    
    meaning_parts = meaning.split('・')
    
    for part in meaning_parts:
        part = part.strip()
        # 動詞を除外
        if any(x in part for x in ['する', 'させる']):
            continue
        # 形容詞パターン
        if any(re.search(pattern, part) for pattern in adj_patterns):
            return True
        # 副詞
        if is_adverb and any(x in part for x in ['に', 'く', 'して']):
            return True
    
    return is_adverb

def get_comparative_forms(word):
    """比較級・最上級を生成"""
    # 1音節または2音節の形容詞: -er, -est
    # 3音節以上: more, most
    
    word_lower = word.lower()
    
    # 不規則形
    if word_lower in IRREGULAR_COMPARATIVES:
        return IRREGULAR_COMPARATIVES[word_lower]
    
    # 規則形
    syllable_count = len(re.findall(r'[aeiou]+', word_lower))
    
    # -lyで終わる副詞はmore/most
    if word.endswith('ly'):
        return {
            'comparative': f'more {word}',
            'superlative': f'most {word}',
            'type': 'more_most'
        }
    
    # 2音節で-y, -er, -ow, -leで終わる、または1音節
    if syllable_count <= 1 or (syllable_count == 2 and word_lower.endswith(('y', 'er', 'ow', 'le'))):
        if word_lower.endswith('e'):
            comp = word + 'r'
            sup = word + 'st'
        elif word_lower.endswith('y') and len(word) > 2 and word[-2] not in 'aeiou':
            comp = word[:-1] + 'ier'
            sup = word[:-1] + 'iest'
        elif len(word) >= 3 and word[-1] not in 'aeiou' and word[-2] in 'aeiou' and word[-3] not in 'aeiou':
            # CVC pattern: big -> bigger
            comp = word + word[-1] + 'er'
            sup = word + word[-1] + 'est'
        else:
            comp = word + 'er'
            sup = word + 'est'
        
        return {
            'comparative': comp,
            'superlative': sup,
            'type': 'er_est'
        }
    else:
        # 3音節以上
        return {
            'comparative': f'more {word}',
            'superlative': f'most {word}',
            'type': 'more_most'
        }

def generate_comparative_reading(word, reading, form_type):
    """比較級・最上級の読みを生成"""
    base = reading.replace('́', '')
    
    if form_type == 'more_most':
        return {
            'comparative': f'モア{base}',
            'superlative': f'モウスト{base}'
        }
    else:
        # -er, -est形
        if word.endswith('e'):
            return {
                'comparative': f'{base}ー',
                'superlative': f'{base}スト'
            }
        elif word.endswith('y'):
            return {
                'comparative': f'{base[:-1]}ィアー',
                'superlative': f'{base[:-1]}ィエスト'
            }
        else:
            return {
                'comparative': f'{base}ー',
                'superlative': f'{base}スト'
            }

def generate_comparative_meaning(base_meaning):
    """比較級・最上級の意味を生成"""
    meanings = {}
    base = base_meaning.split('・')[0].strip()
    
    if base.endswith('い'):
        # いい -> より良い
        root = base[:-1]
        meanings['comparative'] = f'より{root}い'
        meanings['superlative'] = f'最も{root}い'
    elif base.endswith('く'):
        # 速く -> より速く
        meanings['comparative'] = f'より{base}'
        meanings['superlative'] = f'最も{base}'
    elif base.endswith('に'):
        # 幸せに -> より幸せに
        meanings['comparative'] = f'より{base}'
        meanings['superlative'] = f'最も{base}'
    else:
        meanings['comparative'] = f'より{base}'
        meanings['superlative'] = f'最も{base}'
    
    return meanings

def add_comparative_forms(word, meaning, reading, related_words):
    """比較級・最上級を関連語に追加"""
    word_lower = word.lower()
    
    if related_words and related_words.strip():
        prefix = related_words + ', '
    else:
        prefix = ''
    
    # 比較級・最上級を取得
    forms = get_comparative_forms(word)
    
    # 不規則形の場合
    if word_lower in IRREGULAR_COMPARATIVES:
        comp_data = IRREGULAR_COMPARATIVES[word_lower]
        forms_str = (
            f"(比較級){word}({reading}):{meaning}, "
            f"{comp_data['comparative']}({comp_data['readings']['comparative']}):{comp_data['meanings']['comparative']}, "
            f"{comp_data['superlative']}({comp_data['readings']['superlative']}):{comp_data['meanings']['superlative']}"
        )
    else:
        # 規則形の場合
        meanings = generate_comparative_meaning(meaning)
        readings = generate_comparative_reading(word_lower, reading, forms.get('type', 'er_est'))
        
        forms_str = (
            f"(比較級){word}({reading}):{meaning}, "
            f"{forms['comparative']}({readings['comparative']}):{meanings['comparative']}, "
            f"{forms['superlative']}({readings['superlative']}):{meanings['superlative']}"
        )
    
    return prefix + forms_str

# CSVファイルを処理
input_file = 'public/data/junior-high-entrance-words.csv'
output_file = 'public/data/junior-high-entrance-words_updated.csv'

rows = []
updated_count = 0
adj_adv_count = 0

print("処理中...")

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows.append(header)
    
    for row in reader:
        if len(row) >= 7:
            word = row[0].strip()
            reading = row[1].strip()
            meaning = row[2].strip()
            related_words = row[4]
            
            # 既に比較級が追加されているかチェック
            if '(比較級)' in related_words:
                rows.append(row)
                continue
            
            # 形容詞・副詞かどうか判定
            if is_adjective_or_adverb(meaning, word):
                adj_adv_count += 1
                new_related_words = add_comparative_forms(word, meaning, reading, related_words)
                row[4] = new_related_words
                updated_count += 1
                if updated_count <= 10:
                    print(f"Updated: {word} - {meaning}")
            
            rows.append(row)

# 更新されたCSVを保存
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"\n✅ 完了!")
print(f"形容詞・副詞候補: {adj_adv_count}個")
print(f"比較級・最上級を追加: {updated_count}個")
print(f"出力ファイル: {output_file}")
