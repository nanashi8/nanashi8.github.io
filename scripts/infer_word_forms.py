#!/usr/bin/env python3
"""
第2段階: 活用形・派生語の自動推論

既に辞書に原形がある単語の活用形を自動生成
- 複数形: -s, -es, -ies
- 過去形: -ed, -ied  
- 現在分詞: -ing
- 副詞形: -ly
"""

import json
from pathlib import Path
from collections import defaultdict
import re


def find_base_word(word, dictionary):
    """活用形から原形を推測"""
    word_lower = word.lower()
    
    # そのままの形が辞書にあるか
    if word_lower in dictionary and dictionary[word_lower].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
        return None  # 既に意味がある
    
    candidates = []
    
    # 複数形 -s
    if word_lower.endswith('s') and len(word_lower) > 2:
        base = word_lower[:-1]
        if base in dictionary and dictionary[base].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base, 'plural_s', dictionary[base].get('meaning', '')))
    
    # 複数形 -es
    if word_lower.endswith('es') and len(word_lower) > 3:
        base = word_lower[:-2]
        if base in dictionary and dictionary[base].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base, 'plural_es', dictionary[base].get('meaning', '')))
    
    # 複数形 -ies (y -> ies)
    if word_lower.endswith('ies') and len(word_lower) > 4:
        base = word_lower[:-3] + 'y'
        if base in dictionary and dictionary[base].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base, 'plural_ies', dictionary[base].get('meaning', '')))
    
    # 過去形 -ed
    if word_lower.endswith('ed') and len(word_lower) > 3:
        # 通常の -ed
        base = word_lower[:-2]
        if base in dictionary and dictionary[base].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base, 'past_ed', dictionary[base].get('meaning', '')))
        
        # -e + d (hope -> hoped)
        base_e = word_lower[:-1]
        if base_e in dictionary and dictionary[base_e].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base_e, 'past_e_d', dictionary[base_e].get('meaning', '')))
        
        # 子音字重複 (stop -> stopped)
        if len(word_lower) > 4 and word_lower[-3] == word_lower[-4]:
            base_double = word_lower[:-3]
            if base_double in dictionary and dictionary[base_double].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
                candidates.append((base_double, 'past_double', dictionary[base_double].get('meaning', '')))
    
    # 過去形 -ied (y -> ied)
    if word_lower.endswith('ied') and len(word_lower) > 4:
        base = word_lower[:-3] + 'y'
        if base in dictionary and dictionary[base].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base, 'past_ied', dictionary[base].get('meaning', '')))
    
    # 現在分詞 -ing
    if word_lower.endswith('ing') and len(word_lower) > 4:
        # 通常の -ing
        base = word_lower[:-3]
        if base in dictionary and dictionary[base].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base, 'ing', dictionary[base].get('meaning', '')))
        
        # -e削除 + ing (make -> making)
        base_e = word_lower[:-3] + 'e'
        if base_e in dictionary and dictionary[base_e].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base_e, 'ing_e', dictionary[base_e].get('meaning', '')))
        
        # 子音字重複 (run -> running)
        if len(word_lower) > 5 and word_lower[-4] == word_lower[-5]:
            base_double = word_lower[:-4]
            if base_double in dictionary and dictionary[base_double].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
                candidates.append((base_double, 'ing_double', dictionary[base_double].get('meaning', '')))
    
    # 副詞形 -ly
    if word_lower.endswith('ly') and len(word_lower) > 3:
        base = word_lower[:-2]
        if base in dictionary and dictionary[base].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base, 'adverb_ly', dictionary[base].get('meaning', '')))
        
        # -y -> ily (happy -> happily)
        base_y = word_lower[:-3] + 'y'
        if base_y in dictionary and dictionary[base_y].get('meaning') not in ['(要確認)', '(未登録)', '(固有名詞)']:
            candidates.append((base_y, 'adverb_ily', dictionary[base_y].get('meaning', '')))
    
    # 最も長い原形を選択（より具体的な単語を優先）
    if candidates:
        candidates.sort(key=lambda x: len(x[0]), reverse=True)
        return candidates[0]
    
    return None


def generate_meaning(base_word, base_meaning, form_type):
    """活用形に応じた意味を生成"""
    if form_type in ['plural_s', 'plural_es', 'plural_ies']:
        # 複数形
        if base_meaning.endswith('こと'):
            return base_meaning  # 動名詞などはそのまま
        return base_meaning + '（複数形）'
    
    elif form_type in ['past_ed', 'past_e_d', 'past_double', 'past_ied']:
        # 過去形・過去分詞
        return base_meaning + 'た・された'
    
    elif form_type in ['ing', 'ing_e', 'ing_double']:
        # 現在分詞・動名詞
        return base_meaning + 'こと・している'
    
    elif form_type in ['adverb_ly', 'adverb_ily']:
        # 副詞形
        # 形容詞の意味から副詞の意味を推測
        if '〜な' in base_meaning or '〜い' in base_meaning:
            return base_meaning.replace('〜な', '〜に').replace('〜い', '〜く')
        return base_meaning + 'に'
    
    return base_meaning


def main():
    # パスの設定
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    passages_dir = Path('public/data/passages-phrase-learning')
    
    # 辞書を読み込み
    print("📖 辞書を読み込み中...")
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    # パッセージファイル内の(要確認)単語を集計
    print("📊 (要確認)単語を集計中...")
    unconfirmed_words = defaultdict(int)
    
    for passage_file in passages_dir.glob('*.json'):
        with open(passage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                meaning = segment.get('meaning', '')
                
                if meaning == '(要確認)' and word:
                    unconfirmed_words[word] += 1
    
    print(f"  見つかった(要確認)単語: {len(unconfirmed_words)}種類")
    
    # 活用形から原形を推測
    print("\n🔍 活用形を分析中...")
    inferred_words = {}
    
    for word, count in unconfirmed_words.items():
        result = find_base_word(word, dictionary)
        if result:
            base_word, form_type, base_meaning = result
            meaning = generate_meaning(base_word, base_meaning, form_type)
            inferred_words[word.lower()] = {
                'meaning': meaning,
                'base_word': base_word,
                'form_type': form_type,
                'count': count
            }
    
    print(f"  推論可能な単語: {len(inferred_words)}語")
    print(f"  総出現回数: {sum(w['count'] for w in inferred_words.values())}回")
    
    if not inferred_words:
        print("\n推論できる単語がありません。")
        return
    
    # 辞書を更新
    print("\n📝 辞書を更新中...")
    updated_count = 0
    for word_lower, info in inferred_words.items():
        if word_lower in dictionary:
            if dictionary[word_lower].get('meaning') == '(要確認)':
                dictionary[word_lower]['meaning'] = info['meaning']
                dictionary[word_lower]['source'] = 'word-form-inference'
                dictionary[word_lower]['baseWord'] = info['base_word']
                updated_count += 1
    
    # 辞書を保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f"  辞書更新: {updated_count}語")
    
    # パッセージファイルを更新
    print("\n📝 パッセージファイルを更新中...")
    total_updated = 0
    
    for passage_file in sorted(passages_dir.glob('*.json')):
        with open(passage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_updated = 0
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                word_lower = word.lower()
                
                if word_lower in inferred_words and segment.get('meaning') == '(要確認)':
                    segment['meaning'] = inferred_words[word_lower]['meaning']
                    file_updated += 1
        
        if file_updated > 0:
            with open(passage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {passage_file.name}: {file_updated}箇所更新")
            total_updated += file_updated
    
    print(f"\n✅ 完了!")
    print(f"  推論した単語: {len(inferred_words)}語")
    print(f"  更新した箇所: {total_updated}箇所")
    
    # サンプルを表示
    print("\n📊 推論例（出現頻度上位20）:")
    sorted_inferred = sorted(inferred_words.items(), key=lambda x: x[1]['count'], reverse=True)
    for i, (word, info) in enumerate(sorted_inferred[:20], 1):
        print(f"  {i}. {word} ← {info['base_word']}: {info['meaning']} ({info['count']}回)")


if __name__ == '__main__':
    main()
