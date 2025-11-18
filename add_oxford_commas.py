#!/usr/bin/env python3
"""
英文の自然さを向上させるため、適切な位置にカンマを追加

修正対象:
1. リスト列挙（3つ以上の項目）
2. 複数独立節の接続
3. 導入句の後
"""

import json
import os
import re


def should_add_oxford_comma(words):
    """
    オックスフォードカンマを追加すべきか判定
    
    3項目以上の並列列挙を検出:
    - "A B and C" → "A, B, and C"
    - "clean air fresh water and healthy land" → "clean air, fresh water, and healthy land"
    - "Cars trucks and buses" → "Cars, trucks, and buses"
    
    除外:
    - 既にカンマがある
    - "both A and B"
    - "not only A but also B"
    - 動詞句 "produce and consume"
    - フレーズ断片 "of animals and nature"
    """
    # 既にカンマがある
    if ',' in words:
        return None
    
    # andがない
    if 'and' not in words:
        return None
    
    # 文の先頭が前置詞または小文字 → フレーズ断片の可能性
    if words[0] in ['of', 'to', 'in', 'on', 'at', 'for', 'with']:
        return None
    
    # 文の先頭が小文字 → 文の途中
    if words[0][0].islower():
        return None
    
    and_idx = words.index('and')
    
    # andが先頭付近
    if and_idx < 2:
        return None
    
    # "both A and B" パターン
    if and_idx >= 2 and words[and_idx - 2] == 'both':
        return None
    
    # "not only A but also B"
    if 'not' in words[:and_idx] and 'only' in words[:and_idx]:
        return None
    
    # andの後に単語がない or 句読点のみ
    if and_idx >= len(words) - 1:
        return None
    if words[and_idx + 1] in ['.', ',', '!', '?']:
        return None
    
    # --- 明確な名詞列挙のパターンを検出 ---
    
    # パターン1: "Cars trucks and buses" (1単語ずつの列挙、3項目以上)
    # 条件: and_idx >= 2、全て名詞っぽい
    if and_idx in [2, 3, 4]:
        before_and = words[:and_idx]
        after_and = words[and_idx + 1] if and_idx + 1 < len(words) else None
        
        # 除外: 動詞句
        verb_forms = ['reducing', 'reusing', 'recycling', 'produce', 'consume', 'understand', 'take',
                      'absorb', 'burn', 'release', 'provide', 'separate', 'organize']
        if any(w in verb_forms for w in before_and):
            return None
        
        # 全て名詞っぽい（小文字または大文字で始まる）
        all_noun_like = all(
            (w[0].isupper() or w[0].islower()) and 
            w not in ['different', 'similar', 'important', 'also']
            for w in before_and if w
        )
        
        if all_noun_like and after_and:
            # カンマを挿入する位置: 最後の項目以外の後
            positions = [(i, i + 1) for i in range(and_idx - 1)]
            return positions
    
    # パターン2: "clean air fresh water and healthy land" (2単語ペアの列挙)
    # 条件: and_idx == 4 or 6 or 8（2単語ペア×2または3または4）
    if and_idx in [4, 6, 8]:
        # ペアの構造をチェック
        pairs = []
        for i in range(0, and_idx, 2):
            if i + 1 < and_idx:
                pairs.append((words[i], words[i + 1]))
        
        # 形容詞+名詞または名詞+名詞のペアっぽいか
        valid_pairs = True
        for w1, w2 in pairs:
            # 両方とも小文字で始まる
            if not (w1[0].islower() and w2[0].islower()):
                valid_pairs = False
                break
        
        if valid_pairs and len(pairs) >= 2:
            # andの後も2単語ペアか確認
            if and_idx + 2 < len(words):
                after_words = words[and_idx + 1:and_idx + 3]
                if len(after_words) == 2 and all(w[0].islower() for w in after_words):
                    # 各ペアの2番目の単語の後にカンマ
                    positions = [(i * 2 + 1, i * 2 + 2) for i in range(len(pairs) - 1)]
                    return positions
    
    return None


def add_commas_to_phrase(phrase):
    """フレーズにカンマを追加"""
    positions = should_add_oxford_comma(phrase['words'])
    
    if not positions:
        return phrase, False
    
    # カンマを挿入
    new_words = phrase['words'][:]
    
    # 逆順で挿入（インデックスがずれないように）
    for _, insert_pos in sorted(positions, reverse=True):
        new_words.insert(insert_pos, ',')
    
    phrase['words'] = new_words
    return phrase, True


def fix_passage_file(filepath):
    """パッセージファイルにカンマを追加"""
    filename = os.path.basename(filepath)
    print(f"\n処理中: {filename}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified_count = 0
    examples = []
    
    for phrase in data['phrases']:
        original_words = phrase['words'][:]
        phrase, modified = add_commas_to_phrase(phrase)
        
        if modified:
            modified_count += 1
            
            # 最初の3例を保存
            if len(examples) < 3:
                old_text = ' '.join(original_words).replace(' .', '.').replace(' ,', ',')
                new_text = ' '.join(phrase['words']).replace(' .', '.').replace(' ,', ',')
                examples.append({
                    'id': phrase['id'],
                    'old': old_text,
                    'new': new_text
                })
    
    if modified_count > 0:
        # ファイルに保存
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  ✅ {modified_count}フレーズにカンマを追加")
        
        for ex in examples:
            print(f"\n  例: {ex['id']}")
            print(f"    修正前: {ex['old']}")
            print(f"    修正後: {ex['new']}")
    else:
        print(f"  ℹ️  カンマ追加の必要なし")
    
    return modified_count


def main():
    """メイン処理"""
    prototype_dir = '/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/prototype'
    
    files = [
        'beginner-1.json', 'beginner-2.json', 'beginner-3.json',
        'intermediate-1.json', 'intermediate-2.json', 'intermediate-3.json',
        'intermediate-4.json', 'intermediate-5.json',
        'advanced-1.json', 'advanced-2.json', 'advanced-3.json'
    ]
    
    print("=" * 70)
    print("英文の自然さ向上: カンマ自動追加")
    print("=" * 70)
    
    total_modified = 0
    
    for filename in files:
        filepath = os.path.join(prototype_dir, filename)
        if os.path.exists(filepath):
            count = fix_passage_file(filepath)
            total_modified += count
    
    print("\n" + "=" * 70)
    print("完了")
    print("=" * 70)
    print(f"合計 {total_modified}フレーズにカンマを追加しました")
    
    if total_modified > 0:
        print("\n修正例:")
        print("  - \"clean air fresh water and land\" → \"clean air, fresh water, and land\"")
        print("  - \"cars trucks and buses\" → \"cars, trucks, and buses\"")


if __name__ == '__main__':
    main()
