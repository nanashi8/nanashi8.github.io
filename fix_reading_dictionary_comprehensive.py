#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を追加し、
comprehensive JSONの誤った翻訳を修正するスクリプト
"""

import json
import re
from pathlib import Path

# 辞書に追加すべき単語とその意味
MISSING_WORDS = {
    "crises": {
        "word": "crises",
        "reading": "クライシーズ",
        "meaning": "危機（複数形）",
        "etymology": "crisisの複数形",
        "relatedWords": "crisis(クライシス): 危機",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": "crisis"
    },
    "depletion": {
        "word": "depletion",
        "reading": "ディプリーション",
        "meaning": "枯渇・消耗",
        "etymology": "deplete(枯渇させる) + -tion(名詞化)",
        "relatedWords": "deplete(ディプリート): 枯渇させる, depleted(ディプリーティッド): 枯渇した",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": "deplete"
    },
    "optional": {
        "word": "optional",
        "reading": "オプショナル",
        "meaning": "任意の・選択できる",
        "etymology": "option(選択) + -al(形容詞化)",
        "relatedWords": "option(オプション): 選択肢, optionally(オプショナリー): 任意に",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": "option"
    }
}

def load_json(filepath):
    """JSONファイルを読み込む"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_csv_dictionary(filepath):
    """CSVファイルから辞書を読み込む"""
    dictionary = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            parts = line.split(',')
            if len(parts) >= 7:
                word = parts[0].strip().lower()
                dictionary[word] = {
                    'word': parts[0].strip(),
                    'reading': parts[1].strip(),
                    'meaning': parts[2].strip(),
                    'etymology': parts[3].strip(),
                    'relatedWords': parts[4].strip(),
                    'relatedFields': parts[5].strip(),
                    'difficulty': parts[6].strip()
                }
    return dictionary

def save_json(data, filepath):
    """JSONファイルを保存する"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ {filepath} を保存しました")

def update_dictionary():
    """長文読解辞書に不足単語を追加"""
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    
    added_count = 0
    for word_key, word_data in MISSING_WORDS.items():
        if word_key not in dictionary:
            dictionary[word_key] = word_data
            added_count += 1
            print(f"  + {word_data['word']}: {word_data['meaning']}")
        else:
            print(f"  - {word_data['word']} は既に存在します")
    
    if added_count > 0:
        save_json(dictionary, dict_path)
        print(f"\n✓ {added_count}個の単語を辞書に追加しました")
    else:
        print(f"\n✓ 辞書に追加する単語はありませんでした")
    
    return dictionary

def fix_comprehensive_json(dictionary, main_dictionary):
    """comprehensive JSONの誤った翻訳を修正"""
    comp_path = Path('public/data/reading-passages-comprehensive.json')
    
    print(f"\n📄 Comprehensive JSONを読み込んでいます: {comp_path}")
    passages = load_json(comp_path)
    
    fixed_count = 0
    unfixed_words = set()
    
    for passage in passages:
        for phrase in passage.get('phrases', []):
            word_meanings = phrase.get('wordMeanings', {})
            
            for word, meaning in list(word_meanings.items()):
                original_meaning = meaning
                needs_fix = False
                
                # [word]形式の誤訳を修正
                bracket_match = re.match(r'^\[(\w+)\]$', meaning)
                if bracket_match:
                    needs_fix = True
                
                # Sustainability（固有名詞）を修正
                if "Sustainability（固有名詞）" in meaning or "sustainability（固有名詞）" in meaning:
                    needs_fix = True
                
                if needs_fix:
                    # 辞書から正しい意味を取得
                    word_lower = word.lower()
                    
                    # 統合辞書を作成（長文辞書とメイン辞書をマージ）
                    combined_dict = {**main_dictionary, **dictionary}
                    # 統合辞書を作成（長文辞書とメイン辞書をマージ）
                    combined_dict = {**main_dictionary, **dictionary}
                    
                    # まず元の形で辞書を確認
                    if word_lower in combined_dict:
                        correct_meaning = combined_dict[word_lower].get('meaning', '')
                        if correct_meaning:
                            word_meanings[word] = correct_meaning
                            fixed_count += 1
                            continue
                    
                    # 原形変換を試みる
                    # -s, -es の除去
                    if word_lower.endswith('es'):
                        base = word_lower[:-2]
                        if base in combined_dict:
                            meaning = combined_dict[base].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（複数形）"
                                fixed_count += 1
                                continue
                    
                    if word_lower.endswith('s'):
                        base = word_lower[:-1]
                        if base in combined_dict:
                            meaning = combined_dict[base].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（複数形）"
                                fixed_count += 1
                                continue
                    
                    # -ing の除去
                    if word_lower.endswith('ing'):
                        base = word_lower[:-3]
                        if base in combined_dict:
                            meaning = combined_dict[base].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（現在分詞・動名詞）"
                                fixed_count += 1
                                continue
                        # make + ing = making
                        if base + 'e' in combined_dict:
                            meaning = combined_dict[base + 'e'].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（現在分詞・動名詞）"
                                fixed_count += 1
                                continue
                    
                    # -ed の除去
                    if word_lower.endswith('ed'):
                        base = word_lower[:-2]
                        if base in combined_dict:
                            meaning = combined_dict[base].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（過去形・過去分詞）"
                                fixed_count += 1
                                continue
                        if base + 'e' in combined_dict:
                            meaning = combined_dict[base + 'e'].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（過去形・過去分詞）"
                                fixed_count += 1
                                continue
                    
                    # -er, -est の除去（比較級・最上級）
                    if word_lower.endswith('est'):
                        base = word_lower[:-3]
                        if base in combined_dict:
                            meaning = combined_dict[base].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（最上級）"
                                fixed_count += 1
                                continue
                    
                    if word_lower.endswith('er'):
                        base = word_lower[:-2]
                        if base in combined_dict:
                            meaning = combined_dict[base].get('meaning', '')
                            if meaning:
                                word_meanings[word] = f"{meaning}（比較級）"
                                fixed_count += 1
                                continue
                    
                    # どれも見つからない場合
                    unfixed_words.add(word)
    
    if fixed_count > 0:
        save_json(passages, comp_path)
        print(f"\n✓ {fixed_count}個の誤訳を修正しました")
    else:
        print(f"\n✓ 修正する誤訳はありませんでした")
    
    if unfixed_words:
        print(f"\n⚠ 以下の{len(unfixed_words)}個の単語の翻訳が見つかりませんでした:")
        for word in sorted(unfixed_words):
            print(f"  - {word}")

def main():
    print("=" * 60)
    print("長文読解辞書・Comprehensive JSON 修正スクリプト")
    print("=" * 60)
    
    # メイン辞書を読み込む（CSV）
    main_dict_path = Path('public/data/junior-high-entrance-words.csv')
    print(f"\n📖 メイン辞書を読み込んでいます: {main_dict_path}")
    main_dictionary = load_csv_dictionary(main_dict_path)
    print(f"  ✓ {len(main_dictionary)}単語を読み込みました")
    
    # 辞書を更新
    dictionary = update_dictionary()
    
    # Comprehensive JSONを修正
    fix_comprehensive_json(dictionary, main_dictionary)
    
    print("\n" + "=" * 60)
    print("✅ 完了しました")
    print("=" * 60)

if __name__ == '__main__':
    main()
