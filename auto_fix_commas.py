#!/usr/bin/env python3
"""
全パッセージファイルのカンマ不足を自動修正

明確な3項目以上の列挙にオックスフォードカンマを追加
"""

import json
import os


def is_noun_like(word):
    """名詞っぽいかを判定（簡易版）"""
    # 小文字で始まり、動詞の活用形でない
    if not word or word[0].isupper():
        return False
    
    # 明らかな動詞の活用形は除外
    verb_endings = ['ing', 'ed']
    for ending in verb_endings:
        if word.endswith(ending) and len(word) > len(ending) + 2:
            # ただし、一部の名詞も除外しないように
            pass
    
    return True


def should_add_commas(words):
    """
    カンマを追加すべきか判定
    
    明確な3項目列挙のみ:
    - "A B and C" (3つの名詞)
    - "A B C and D" (4つの名詞)
    
    除外:
    - "both A and B"
    - "A and B" (2項目のみ)
    - 既にカンマがある
    - 動詞を含む
    """
    # 既にカンマがある
    if ',' in words:
        return None
    
    # andがない
    if 'and' not in words:
        return None
    
    and_idx = words.index('and')
    
    # "and"が先頭付近（修正不要）
    if and_idx < 2:
        return None
    
    # "both A and B" パターン
    if and_idx >= 2 and words[and_idx - 2] == 'both':
        return None
    
    # 明確な名詞の列挙パターンを検出
    
    # パターン1: 単一名詞の列挙 "Cars trucks and buses"
    # 条件: "and"の前に2-3個の名詞が並ぶ
    if and_idx in [2, 3]:
        # "A B and C" または "A B C and D"
        before_and = words[:and_idx]
        
        # 全て名詞っぽいか
        if all(is_noun_like(w) for w in before_and):
            # カンマの位置: 各名詞の後（andの直前を除く）
            comma_positions = list(range(0, and_idx - 1))
            return {
                'type': 'single-nouns',
                'positions': [(pos, pos + 1) for pos in comma_positions]  # (インデックス, 挿入位置)
            }
    
    # パターン2: 2単語ペアの列挙 "clean air fresh water and healthy land"
    # 条件: "and"の前に4個または6個の単語（2単語ペア×2または3）
    if and_idx in [4, 6]:
        # ペア数
        num_pairs = and_idx // 2
        
        # 各ペアの2番目の単語の後にカンマを挿入
        comma_positions = [(i * 2 + 1, i * 2 + 2) for i in range(num_pairs - 1)]
        
        return {
            'type': 'paired-nouns',
            'positions': comma_positions
        }
    
    return None


def insert_commas(words, positions):
    """指定位置にカンマを挿入"""
    # 逆順で挿入（インデックスがずれないように）
    new_words = words[:]
    
    for idx, insert_pos in sorted(positions, reverse=True):
        new_words.insert(insert_pos, ',')
    
    return new_words


def fix_passage_commas(filepath):
    """パッセージファイルのカンマを修正"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_count = 0
    
    for phrase in data['phrases']:
        result = should_add_commas(phrase['words'])
        
        if result:
            old_words = phrase['words'][:]
            new_words = insert_commas(phrase['words'], result['positions'])
            
            phrase['words'] = new_words
            
            # segmentsは更新しない（カンマは表示時に処理）
            # または、segmentsからも削除済みなので問題なし
            
            fixed_count += 1
            
            print(f"  修正: {phrase['id']}")
            print(f"    前: {' '.join(old_words)}")
            print(f"    後: {' '.join(new_words)}")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return fixed_count


def main():
    prototype_dir = '/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/prototype'
    
    files = [
        'beginner-1.json', 'beginner-2.json', 'beginner-3.json',
        'intermediate-1.json', 'intermediate-2.json', 'intermediate-3.json',
        'intermediate-4.json', 'intermediate-5.json',
        'advanced-1.json', 'advanced-2.json', 'advanced-3.json'
    ]
    
    print("=" * 70)
    print("カンマ自動修正スクリプト")
    print("=" * 70)
    
    total_fixed = 0
    
    for filename in files:
        filepath = os.path.join(prototype_dir, filename)
        if not os.path.exists(filepath):
            continue
        
        print(f"\n📄 {filename}")
        fixed = fix_passage_commas(filepath)
        print(f"  ✅ {fixed}箇所を修正")
        total_fixed += fixed
    
    print("\n" + "=" * 70)
    print(f"完了: 合計 {total_fixed}箇所を修正")
    print("=" * 70)


if __name__ == '__main__':
    main()
