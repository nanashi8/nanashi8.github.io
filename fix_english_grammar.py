#!/usr/bin/env python3
"""
長文読解パッセージの英文校正スクリプト

英語ネイティブ編集者として、以下を修正：
1. リスト項目間のカンマ追加 (A, B, and C)
2. 所有格のアポストロフィ修正
3. 文法的・構成的な問題の修正
"""

import json
import os
import re


def add_commas_to_list(words):
    """
    リスト表現にカンマを追加
    例: ["A", "B", "and", "C"] → ["A", ",", "B", ",", "and", "C"]
    """
    # 3つ以上の項目の列挙を検出
    text = ' '.join(words)
    
    # パターン1: "A B and C" (名詞句の列挙)
    # 例: "clean air fresh water and healthy land"
    # → "clean air , fresh water , and healthy land"
    
    # まず、既にカンマがある場合はスキップ
    if ',' in words:
        return words
    
    # "A and B" のような単純な2項目はカンマ不要
    and_indices = [i for i, w in enumerate(words) if w == 'and']
    
    for and_idx in and_indices:
        if and_idx < 2:
            continue
            
        # andの前の2単語を確認
        before_and = words[max(0, and_idx-2):and_idx]
        
        # andの前が2単語以上で、さらにその前にも単語がある場合
        if and_idx >= 4:
            # 特定のパターンを検出
            # パターン: [名詞] [名詞] [名詞] and [名詞]
            # 例: clean air fresh water and healthy land
            
            # 簡易的にand の位置から逆算
            # 2単語ずつのペアを検出
            before_text = ' '.join(words[:and_idx])
            
            # 3つ以上の名詞句を検出するパターン
            # "word1 word2 word3 word4 and"のようなパターン
            if and_idx >= 5:
                # 名詞句が2つ以上
                insert_positions = []
                
                # 単純なヒューリスティック: and の 2単語前と4単語前にカンマを挿入
                # 例: clean(0) air(1) fresh(2) water(3) and(4) →カンマを1と3の後に
                
                # より正確には、andの前を解析
                # ここでは簡易的に特定パターンのみ処理
                
                # 特定のケース: "A B C D and E F" 
                # → "A B , C D , and E F"
                
                # より簡単なアプローチ: phraseMeaningを見てカンマの位置を判断
                pass
    
    return words


def fix_possessive(words):
    """
    所有格のアポストロフィを修正
    例: "generations ability" → "generations' ability"
    """
    fixed_words = []
    
    for i, word in enumerate(words):
        # 次の単語が名詞で、現在の単語が複数形名詞の場合
        if i < len(words) - 1:
            next_word = words[i + 1]
            
            # generations ability → generations' ability
            if word == 'generations' and next_word in ['ability', 'needs', 'rights']:
                fixed_words.append("generations'")
                continue
            
            # peoples lives → peoples' lives / people's lives
            if word in ['peoples', 'childrens', 'womens', 'mens']:
                if word == 'peoples':
                    fixed_words.append("peoples'")
                elif word == 'childrens':
                    fixed_words.append("children's")
                elif word == 'womens':
                    fixed_words.append("women's")
                elif word == 'mens':
                    fixed_words.append("men's")
                continue
        
        fixed_words.append(word)
    
    return fixed_words


# 具体的な修正パターン（手動で特定した箇所）
COMMA_FIXES = {
    'intermediate-1.json': {
        'phrase-2': {
            'old': ['We', 'depend', 'on', 'clean', 'air', 'fresh', 'water', 'and', 'healthy', 'land'],
            'new': ['We', 'depend', 'on', 'clean', 'air', ',', 'fresh', 'water', ',', 'and', 'healthy', 'land']
        },
        'phrase-11': {
            'old': ['The', 'air', 'we', 'breathe', 'every', 'day', 'is', 'becoming', 'dirty'],
            'new': ['The', 'air', 'we', 'breathe', 'every', 'day', 'is', 'becoming', 'dirty']
        }
    },
    'advanced-1.json': {
        'phrase-3': {
            'old': ['Climate', 'change', 'resource', 'depletion', 'and', 'pollution', 'require', 'urgent', 'action'],
            'new': ['Climate', 'change', ',', 'resource', 'depletion', ',', 'and', 'pollution', 'require', 'urgent', 'action']
        },
        'phrase-7': {
            'old': ['Without', 'compromising', 'future', 'generations', 'ability'],
            'new': ['Without', 'compromising', 'future', "generations'", 'ability']
        }
    }
}


def apply_manual_fixes(data, filename):
    """手動で特定した修正を適用"""
    if filename not in COMMA_FIXES:
        return data, 0
    
    fixes = COMMA_FIXES[filename]
    fix_count = 0
    
    for phrase in data['phrases']:
        phrase_id = phrase['id']
        
        if phrase_id in fixes:
            fix = fixes[phrase_id]
            if phrase['words'] == fix['old']:
                phrase['words'] = fix['new']
                
                # segmentsも更新（カンマを追加）
                if 'segments' in phrase and ',' in fix['new']:
                    # カンマの位置を見つけて、segmentsを再構築
                    new_segments = []
                    for word in fix['new']:
                        if word == ',':
                            new_segments.append({
                                'word': ',',
                                'meaning': '',
                                'isUnknown': False
                            })
                        else:
                            # 元のsegmentから探す
                            found = False
                            for seg in phrase['segments']:
                                if seg['word'] == word:
                                    new_segments.append(seg)
                                    found = True
                                    break
                            
                            if not found:
                                # 新しく追加された単語
                                new_segments.append({
                                    'word': word,
                                    'meaning': word,  # デフォルト
                                    'isUnknown': False
                                })
                    
                    phrase['segments'] = new_segments
                
                fix_count += 1
    
    return data, fix_count


def main():
    """メイン処理"""
    prototype_dir = '/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/prototype'
    
    files = [
        'intermediate-1.json',
        'advanced-1.json'
    ]
    
    print("=" * 60)
    print("長文読解パッセージ 英文校正スクリプト")
    print("=" * 60)
    
    total_fixes = 0
    
    for filename in files:
        filepath = os.path.join(prototype_dir, filename)
        if not os.path.exists(filepath):
            continue
        
        print(f"\n処理中: {filename}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 手動修正を適用
        data, fix_count = apply_manual_fixes(data, filename)
        
        # ファイルに保存
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  ✅ {fix_count}個の修正を適用")
        total_fixes += fix_count
    
    print("\n" + "=" * 60)
    print(f"修正完了: 合計 {total_fixes}箇所")
    print("=" * 60)


if __name__ == '__main__':
    main()
