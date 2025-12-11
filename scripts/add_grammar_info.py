#!/usr/bin/env python3
"""
辞書に文法情報を追加
誤検出を避けるため、確実なパターンのみ処理
"""
import json
from pathlib import Path

dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')

# 除外リスト（誤検出されやすい単語）
EXCLUDE_WORDS = {
    'news', 'its', 'his', 'evening', 'sometimes', 'goods',
    'means', 'cross', 'less', 'business', 'across', 'progress',
    'mass', 'access', 'class', 'pass', 'process', 'witness',
    'address', 'express', 'stress', 'guess', 'press',
}

def add_grammar_suffix(meaning, base_word, grammar_type):
    """意味に文法情報を追加"""
    # 既に文法情報がある場合はスキップ
    if any(marker in meaning for marker in ['複数形', '三単現', '現在分詞', '過去形', '過去分詞', '動名詞', '不規則']):
        return meaning
    
    # 末尾の句読点を保存
    stripped = meaning.rstrip('、。')
    suffix = meaning[len(stripped):]
    
    return f"{stripped}（{base_word}の{grammar_type}）{suffix}"

def process_dictionary():
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated_count = 0
    
    for word, entry in dictionary.items():
        if word in EXCLUDE_WORDS:
            continue
        
        meaning = entry.get('meaning', '')
        updated_meaning = None
        
        # 1. 明らかな複数形パターン
        if word.endswith('s') and len(word) > 3:
            base = word[:-1]
            
            # -ies -> -y
            if word.endswith('ies') and len(word) > 4:
                base = word[:-3] + 'y'
            # -es -> -e または 無し
            elif word.endswith('es') and len(word) > 3:
                if word[:-2] in dictionary:
                    base = word[:-2]
                elif word[:-1] in dictionary:
                    base = word[:-1]
            
            if base in dictionary and base != word:
                base_meaning = dictionary[base].get('meaning', '')
                
                # 動詞の三単現か複数形か判断
                if '〜する' in base_meaning or '〜させる' in base_meaning or '〜になる' in base_meaning:
                    updated_meaning = add_grammar_suffix(meaning, base, '三人称単数現在形')
                else:
                    updated_meaning = add_grammar_suffix(meaning, base, '複数形')
        
        # 2. -ing形（現在分詞・動名詞）
        elif word.endswith('ing') and len(word) > 4:
            # 子音重複パターン
            if len(word) > 4 and word[-4] == word[-5]:
                base = word[:-4]
            else:
                base = word[:-3]
            
            # -e を復元
            if base + 'e' in dictionary:
                base = base + 'e'
            
            if base in dictionary and base != word:
                updated_meaning = add_grammar_suffix(meaning, base, '現在分詞・動名詞形')
        
        # 3. -ed形（過去形・過去分詞）
        elif word.endswith('ed') and len(word) > 3:
            base = word[:-2]
            
            # -ied -> -y
            if word.endswith('ied'):
                base = word[:-3] + 'y'
            # 子音重複パターン
            elif len(word) > 3 and word[-3] == word[-4]:
                base = word[:-3]
            
            # -e を復元
            if base + 'e' in dictionary:
                base = base + 'e'
            
            if base in dictionary and base != word:
                updated_meaning = add_grammar_suffix(meaning, base, '過去形・過去分詞形')
        
        if updated_meaning and updated_meaning != meaning:
            entry['meaning'] = updated_meaning
            updated_count += 1
    
    # 保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    return updated_count, len(dictionary)

if __name__ == '__main__':
    print("=" * 80)
    print("辞書に文法情報を追加")
    print("=" * 80)
    
    updated, total = process_dictionary()
    
    print(f"\n✅ 完了:")
    print(f"  更新: {updated}語")
    print(f"  総単語数: {total}語")
    print(f"  更新率: {updated / total * 100:.1f}%")
