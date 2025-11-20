#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive JSON の segments 内の meaning フィールドを辞書から設定するスクリプト
"""

import json
import re
from pathlib import Path

def load_json(filepath):
    """JSONファイルを読み込む"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filepath):
    """JSONファイルを保存する"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ {filepath} を保存しました")

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

def get_word_meaning(word, combined_dict):
    """辞書から単語の意味を取得（原形変換を含む）"""
    if not word or word in ['.', ',', '!', '?', ';', ':', '"', "'", '-']:
        return None
    
    word_lower = word.lower()
    
    # まず元の形で辞書を確認
    if word_lower in combined_dict:
        return combined_dict[word_lower].get('meaning', '')
    
    # 原形変換を試みる
    # -s, -es の除去（複数形）
    if word_lower.endswith('ies'):
        base = word_lower[:-3] + 'y'
        if base in combined_dict:
            return combined_dict[base].get('meaning', '') + "（複数形）"
    
    if word_lower.endswith('es'):
        base = word_lower[:-2]
        if base in combined_dict:
            return combined_dict[base].get('meaning', '') + "（複数形）"
        # try -es -> -e
        if base + 'e' in combined_dict:
            return combined_dict[base + 'e'].get('meaning', '') + "（複数形）"
    
    if word_lower.endswith('s'):
        base = word_lower[:-1]
        if base in combined_dict:
            return combined_dict[base].get('meaning', '') + "（複数形・三単現）"
    
    # -ing の除去（現在分詞・動名詞）
    if word_lower.endswith('ing'):
        base = word_lower[:-3]
        if base in combined_dict:
            return combined_dict[base].get('meaning', '') + "（〜すること）"
        # 子音重複パターン (running -> run)
        if len(base) >= 2 and base[-1] == base[-2]:
            single_base = base[:-1]
            if single_base in combined_dict:
                return combined_dict[single_base].get('meaning', '') + "（〜すること）"
        # e-drop パターン (making -> make)
        if base + 'e' in combined_dict:
            return combined_dict[base + 'e'].get('meaning', '') + "（〜すること）"
    
    # -ed の除去（過去形・過去分詞）
    if word_lower.endswith('ed'):
        base = word_lower[:-2]
        if base in combined_dict:
            return combined_dict[base].get('meaning', '') + "（過去形）"
        # 子音重複パターン (stopped -> stop)
        if len(base) >= 2 and base[-1] == base[-2]:
            single_base = base[:-1]
            if single_base in combined_dict:
                return combined_dict[single_base].get('meaning', '') + "（過去形）"
        # e-drop パターン (moved -> move)
        if base + 'e' in combined_dict:
            return combined_dict[base + 'e'].get('meaning', '') + "（過去形）"
    
    # -er, -est の除去（比較級・最上級）
    if word_lower.endswith('est'):
        base = word_lower[:-3]
        if base in combined_dict:
            return combined_dict[base].get('meaning', '') + "（最上級）"
        if base + 'e' in combined_dict:
            return combined_dict[base + 'e'].get('meaning', '') + "（最上級）"
        # y -> i パターン (happiest -> happy)
        if base + 'y' in combined_dict:
            return combined_dict[base + 'y'].get('meaning', '') + "（最上級）"
    
    if word_lower.endswith('er'):
        base = word_lower[:-2]
        if base in combined_dict:
            return combined_dict[base].get('meaning', '') + "（比較級）"
        if base + 'e' in combined_dict:
            return combined_dict[base + 'e'].get('meaning', '') + "（比較級）"
        # y -> i パターン (happier -> happy)
        if base + 'y' in combined_dict:
            return combined_dict[base + 'y'].get('meaning', '') + "（比較級）"
    
    return None

def fix_segments_meanings():
    """segments内のmeaningフィールドを辞書から設定"""
    
    # メイン辞書を読み込む（CSV）
    main_dict_path = Path('public/data/junior-high-entrance-words.csv')
    print(f"\n📖 メイン辞書を読み込んでいます: {main_dict_path}")
    main_dictionary = load_csv_dictionary(main_dict_path)
    print(f"  ✓ {len(main_dictionary)}単語を読み込みました")
    
    # 長文読解辞書を読み込む（JSON）
    reading_dict_path = Path('public/data/reading-passages-dictionary.json')
    print(f"\n📖 長文読解辞書を読み込んでいます: {reading_dict_path}")
    reading_dictionary = load_json(reading_dict_path)
    print(f"  ✓ {len(reading_dictionary)}単語を読み込みました")
    
    # 辞書を統合（長文辞書が優先）
    combined_dict = {**main_dictionary}
    for word, data in reading_dictionary.items():
        combined_dict[word.lower()] = data
    
    print(f"\n  ✓ 統合辞書: {len(combined_dict)}単語")
    
    # Comprehensive JSONを読み込む
    comp_path = Path('public/data/reading-passages-comprehensive.json')
    print(f"\n📄 Comprehensive JSONを読み込んでいます: {comp_path}")
    passages = load_json(comp_path)
    
    updated_count = 0
    not_found = set()
    
    # 全パッセージを処理
    for passage in passages:
        passage_id = passage.get('id', 'unknown')
        
        for phrase in passage.get('phrases', []):
            phrase_id = phrase.get('id', 'unknown')
            segments = phrase.get('segments', [])
            
            for segment in segments:
                word = segment.get('word', '')
                current_meaning = segment.get('meaning', '')
                
                # 現在の意味が"-"または空の場合のみ更新
                if current_meaning == "-" or not current_meaning:
                    new_meaning = get_word_meaning(word, combined_dict)
                    
                    if new_meaning:
                        segment['meaning'] = new_meaning
                        updated_count += 1
                    else:
                        # 句読点以外で見つからない単語を記録
                        if word not in ['.', ',', '!', '?', ';', ':', '"', "'", '-', '(', ')']:
                            not_found.add(word)
    
    # 保存
    if updated_count > 0:
        save_json(passages, comp_path)
        print(f"\n✅ {updated_count}個のsegment meaningを更新しました")
    else:
        print(f"\n✓ 更新が必要なsegmentはありませんでした")
    
    if not_found:
        print(f"\n⚠ 以下の{len(not_found)}個の単語が辞書に見つかりませんでした:")
        for word in sorted(not_found)[:50]:  # 最初の50個のみ表示
            print(f"  - {word}")
        if len(not_found) > 50:
            print(f"  ... 他{len(not_found) - 50}個")

def main():
    print("=" * 60)
    print("Segments Meaning 修正スクリプト")
    print("=" * 60)
    
    fix_segments_meanings()
    
    print("\n" + "=" * 60)
    print("✅ 完了しました")
    print("=" * 60)

if __name__ == '__main__':
    main()
