#!/usr/bin/env python3
"""
オックスフォードカンマ追加（最も保守的なアプローチ）

修正対象:
- 明確な名詞の並列列挙のみ
- 3項目以上
- 文の主語位置にある名詞列挙

例:
✅ "Cars trucks and buses release gases" → "Cars, trucks, and buses release gases"
✅ "Paper plastic glass and metal can be recycled" → "Paper, plastic, glass, and metal can be recycled"
✅ "Rice bread and pasta are sources" → "Rice, bread, and pasta are sources"

除外:
❌ "I smiled and said" (動詞の並列)
❌ "big and different" (形容詞のみ2つ)
❌ "of animals and nature" (前置詞句)
"""

import json
import os


# 動詞のリスト（除外用）
VERBS = {
    'produce', 'consume', 'release', 'provide', 'create', 'make', 'take',
    'reducing', 'reusing', 'recycling', 'understanding', 'taking',
    'identify', 'diagnose', 'treat', 'explore', 'develop', 'report',
    'raising', 'slaughtering', 'balancing', 'eating', 'provides',
    'increases', 'reduces', 'shows', 'contribute', 'edit', 'light', 'share'
}


def is_clear_noun_list(words, and_idx):
    """
    明確な名詞列挙かどうか判定
    
    条件:
    1. 文の先頭が大文字（主語として機能）
    2. andの前に2つ以上の単語
    3. andの後に名詞が1つだけ
    4. その後に動詞（3人称単数現在、are、can など）
    5. 列挙項目に動詞が含まれない
    """
    # 条件1: 文の先頭が大文字
    if not words[0][0].isupper():
        return False
    
    # 条件2: andの前に2つ以上（3項目列挙）
    if and_idx < 2:
        return False
    
    # 条件3: andの後に単語がある
    if and_idx + 1 >= len(words):
        return False
    
    # 条件4: andの後の次の単語が動詞または助動詞
    if and_idx + 2 < len(words):
        after_noun = words[and_idx + 1]
        next_word = words[and_idx + 2]
        
        # 動詞のインジケーター
        is_verb = (
            next_word in ['release', 'are', 'is', 'can', 'will', 'provide', 'often', 'may'] or
            (next_word.endswith('s') and next_word not in ['is', 'as', 'this']) or
            next_word.endswith('ed')
        )
        
        if not is_verb:
            return False
    else:
        return False
    
    # 条件5: andの前の単語に動詞が含まれない
    before_and = words[:and_idx]
    for word in before_and:
        if word.lower() in VERBS:
            return False
        if word.endswith('ing') and word.lower() in VERBS:
            return False
    
    return True


def needs_oxford_comma(words):
    """
    オックスフォードカンマが必要か判定
    
    Returns:
        list of insert positions または None
    """
    # 既にカンマがある
    if ',' in words:
        return None
    
    # andがない
    if 'and' not in words:
        return None
    
    and_idx = words.index('and')
    
    # 明確な名詞列挙のみ
    if is_clear_noun_list(words, and_idx):
        # カンマを挿入する位置
        # 例: Cars(0) trucks(1) and(2) buses(3) → 0の後、1の後
        positions = list(range(and_idx - 1))
        return positions
    
    return None


def fix_passage(filepath):
    """パッセージファイルを修正"""
    filename = os.path.basename(filepath)
    print(f"\n処理中: {filename}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = []
    
    for phrase in data['phrases']:
        positions = needs_oxford_comma(phrase['words'])
        
        if positions:
            original = ' '.join(phrase['words']).replace(' .', '.').replace(' ,', ',')
            
            # カンマを挿入（逆順で）
            for pos in sorted(positions, reverse=True):
                phrase['words'].insert(pos + 1, ',')
            
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
        
        for item in modified:
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
    print("オックスフォードカンマ追加（最保守版）")
    print("明確な名詞列挙のみを修正します")
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
