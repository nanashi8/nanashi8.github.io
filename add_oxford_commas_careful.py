#!/usr/bin/env python3
"""
オックスフォードカンマを慎重に追加

明確な名詞列挙のみ:
1. "A B and C" - 3つの名詞の並列
2. "A B C and D" - 4つ以上の名詞の並列
3. "adj1 noun1 adj2 noun2 and adj3 noun3" - 形容詞+名詞ペアの並列

除外:
- 動詞句の並列 ("reducing reusing and recycling")
- 主語+動詞の構造を含む
- フレーズ断片
"""

import json
import os


def needs_oxford_comma(words):
    """
    オックスフォードカンマが必要か判定
    
    Returns:
        list of (insert_after_index, word) または None
    """
    # 既にカンマがある
    if ',' in words:
        return None
    
    # andがない
    if 'and' not in words:
        return None
    
    and_idx = words.index('and')
    
    # --- パターン1: "Cars trucks and buses" (3つの単数名詞) ---
    # and_idx == 2 (2つの単語の後にand)
    # 動詞が後に続く
    if and_idx == 2:
        # 除外: 主語として不適切
        if words[0][0].islower():  # 小文字で始まる
            return None
        
        # andの後に名詞が1つだけ、その後動詞
        if and_idx + 2 < len(words):
            after_and = words[and_idx + 1]
            next_word = words[and_idx + 2]
            
            # 動詞の特徴
            verb_indicators = ['release', 'are', 'is', 'produce', 'have', 'can', 'will', 'provide']
            
            if next_word in verb_indicators or next_word.endswith('s') or next_word.endswith('ed'):
                # "Cars, trucks, and buses"
                return [
                    (0, ','),  # Cars,
                    (2, ','),  # trucks,
                ]
    
    # --- パターン2: "A B C and D" (4つの単数名詞) ---
    if and_idx == 3:
        if words[0][0].islower():
            return None
        
        if and_idx + 2 < len(words):
            after_and = words[and_idx + 1]
            next_word = words[and_idx + 2]
            
            verb_indicators = ['release', 'are', 'is', 'produce', 'have', 'can', 'will', 'provide', 'often']
            
            if next_word in verb_indicators or (next_word.endswith('s') and next_word not in ['is', 'as']):
                return [
                    (0, ','),
                    (1, ','),
                    (3, ','),
                ]
    
    # --- パターン3: "clean air fresh water and healthy land" (形容詞+名詞のペア) ---
    # and_idx == 4: 2ペア
    # and_idx == 6: 3ペア
    if and_idx in [4, 6]:
        # 全て小文字で始まる（文中の一部）
        if not all(w[0].islower() for w in words[:and_idx] if w.isalpha()):
            return None
        
        # ペア構造の検証
        pairs = []
        for i in range(0, and_idx, 2):
            if i + 1 < and_idx:
                pairs.append((i, i + 1))
        
        if len(pairs) >= 2:
            # andの後もペアか確認
            if and_idx + 2 <= len(words):
                # カンマ挿入位置: 各ペアの2番目の後
                result = []
                for pair_idx, (_, second) in enumerate(pairs[:-1]):  # 最後のペア以外
                    result.append((second, ','))
                
                return result
    
    return None


def fix_passage(filepath):
    """パッセージファイルを修正"""
    filename = os.path.basename(filepath)
    print(f"\n処理中: {filename}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = []
    
    for phrase in data['phrases']:
        changes = needs_oxford_comma(phrase['words'])
        
        if changes:
            original = ' '.join(phrase['words']).replace(' .', '.').replace(' ,', ',')
            
            # カンマを挿入（逆順で）
            for insert_after, comma in sorted(changes, reverse=True, key=lambda x: x[0]):
                phrase['words'].insert(insert_after + 1, comma)
            
            new_text = ' '.join(phrase['words']).replace(' .', '.').replace(' ,', ',')
            
            modified.append({
                'id': phrase['id'],
                'old': original,
                'new': new_text
            })
    
    if modified:
        # 保存
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  ✅ {len(modified)}フレーズを修正")
        
        for item in modified[:5]:  # 最初の5例
            print(f"\n  {item['id']}:")
            print(f"    修正前: {item['old']}")
            print(f"    修正後: {item['new']}")
    else:
        print("  ℹ️  修正不要")
    
    return len(modified)


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
    print("オックスフォードカンマ追加（慎重版）")
    print("=" * 70)
    
    total = 0
    for filename in files:
        filepath = os.path.join(prototype_dir, filename)
        if os.path.exists(filepath):
            count = fix_passage(filepath)
            total += count
    
    print("\n" + "=" * 70)
    print(f"完了: 合計 {total}フレーズを修正")
    print("=" * 70)


if __name__ == '__main__':
    main()
