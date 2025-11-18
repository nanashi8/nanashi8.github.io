#!/usr/bin/env python3
"""
オックスフォードカンマ追加（手動指定版）

確実に修正が必要なものだけを指定
"""

import json

# 修正対象の明示的リスト
# (ファイル名, フレーズID, 元のwords, 新しいwords)
FIXES = [
    # intermediate-1.json
    ('intermediate-1.json', 'phrase-2', 
     ['We', 'depend', 'on', 'clean', 'air', 'fresh', 'water', 'and', 'healthy', 'land', '.'],
     ['We', 'depend', 'on', 'clean', 'air', ',', 'fresh', 'water', ',', 'and', 'healthy', 'land', '.']),
    
    ('intermediate-1.json', 'phrase-8',
     ['Cars', 'trucks', 'and', 'buses', 'release', 'harmful', 'gases', '.'],
     ['Cars', ',', 'trucks', ',', 'and', 'buses', 'release', 'harmful', 'gases', '.']),
    
    ('intermediate-1.json', 'phrase-24',
     ['Sea', 'turtles', 'dolphins', 'and', 'whales', 'often', 'eat', 'plastic', 'by', 'mistake', '.'],
     ['Sea', 'turtles', ',', 'dolphins', ',', 'and', 'whales', 'often', 'eat', 'plastic', 'by', 'mistake', '.']),
    
    ('intermediate-1.json', 'phrase-36',
     ['Monkeys', 'birds', 'insects', 'and', 'many', 'other', 'creatures', 'live', 'in', 'trees', '.'],
     ['Monkeys', ',', 'birds', ',', 'insects', ',', 'and', 'many', 'other', 'creatures', 'live', 'in', 'trees', '.']),
    
    ('intermediate-1.json', 'phrase-52',
     ['Hurricanes', 'floods', 'and', 'droughts', 'are', 'becoming', 'more', 'common', '.'],
     ['Hurricanes', ',', 'floods', ',', 'and', 'droughts', 'are', 'becoming', 'more', 'common', '.']),
    
    ('intermediate-1.json', 'phrase-66',
     ['Paper', 'plastic', 'glass', 'and', 'metal', 'can', 'all', 'be', 'recycled', '.'],
     ['Paper', ',', 'plastic', ',', 'glass', ',', 'and', 'metal', 'can', 'all', 'be', 'recycled', '.']),
    
    # intermediate-3.json
    ('intermediate-3.json', 'phrase-14',
     ['Rice', 'bread', 'and', 'pasta', 'are', 'good', 'sources', '.'],
     ['Rice', ',', 'bread', ',', 'and', 'pasta', 'are', 'good', 'sources', '.']),
    
    ('intermediate-3.json', 'phrase-16',
     ['Meat', 'fish', 'eggs', 'and', 'beans', 'provide', 'protein', '.'],
     ['Meat', ',', 'fish', ',', 'eggs', ',', 'and', 'beans', 'provide', 'protein', '.']),
    
    ('intermediate-3.json', 'phrase-82',
     ['Soccer', 'basketball', 'and', 'volleyball', 'are', 'popular', 'choices', '.'],
     ['Soccer', ',', 'basketball', ',', 'and', 'volleyball', 'are', 'popular', 'choices', '.']),
    
    # advanced-3.json
    ('advanced-3.json', 'phrase-32',
     ['Buddhism', 'Judaism', 'and', 'many', 'others', '.'],
     ['Buddhism', ',', 'Judaism', ',', 'and', 'many', 'others', '.']),
    
    ('advanced-3.json', 'phrase-87',
     ['Democracies', 'monarchies', 'and', 'authoritarian', 'regimes', '.'],
     ['Democracies', ',', 'monarchies', ',', 'and', 'authoritarian', 'regimes', '.']),
    
    ('advanced-3.json', 'phrase-277',
     ['Stories', 'poems', 'and', 'oral', 'traditions', '.'],
     ['Stories', ',', 'poems', ',', 'and', 'oral', 'traditions', '.']),
]


def apply_fixes():
    """修正を適用"""
    prototype_dir = '/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/prototype'
    
    print("=" * 70)
    print("オックスフォードカンマ追加（手動指定版）")
    print("=" * 70)
    
    # ファイルごとにグループ化
    by_file = {}
    for filename, phrase_id, old_words, new_words in FIXES:
        if filename not in by_file:
            by_file[filename] = []
        by_file[filename].append((phrase_id, old_words, new_words))
    
    # ファイルごとに処理
    for filename, fixes in by_file.items():
        filepath = f"{prototype_dir}/{filename}"
        
        print(f"\n処理中: {filename}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified_count = 0
        
        for phrase_id, old_words, new_words in fixes:
            # フレーズを見つける
            phrase = next((p for p in data['phrases'] if p['id'] == phrase_id), None)
            
            if not phrase:
                print(f"  ⚠️  {phrase_id} が見つかりません")
                continue
            
            # 検証
            if phrase['words'] != old_words:
                print(f"  ⚠️  {phrase_id}: words が期待と異なります")
                print(f"      期待: {old_words}")
                print(f"      実際: {phrase['words']}")
                continue
            
            # 修正
            old_text = ' '.join(old_words).replace(' .', '.').replace(' ,', ',')
            new_text = ' '.join(new_words).replace(' .', '.').replace(' ,', ',')
            
            phrase['words'] = new_words
            modified_count += 1
            
            print(f"\n  ✅ {phrase_id}:")
            print(f"      修正前: {old_text}")
            print(f"      修正後: {new_text}")
        
        # 保存
        if modified_count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"\n  💾 {filename} を保存しました ({modified_count}フレーズ修正)")
    
    print("\n" + "=" * 70)
    print(f"完了: 合計 {len(FIXES)}フレーズを修正しました")
    print("=" * 70)


if __name__ == '__main__':
    apply_fixes()
