#!/usr/bin/env python3
"""
パッセージの文法的問題を修正

修正内容:
1. カンマの重複を削除
2. 所有格のアポストロフィを追加
3. 不完全な文を確認（手動確認用にレポート）
"""

import json
import os


def fix_duplicate_commas(phrase):
    """連続するカンマを1つに修正"""
    words = phrase['words']
    fixed_words = []
    
    i = 0
    while i < len(words):
        if i < len(words) - 1 and words[i] == ',' and words[i+1] == ',':
            # カンマが連続している場合、1つだけ追加
            fixed_words.append(',')
            # 連続するカンマをすべてスキップ
            while i < len(words) and words[i] == ',':
                i += 1
        else:
            fixed_words.append(words[i])
            i += 1
    
    return fixed_words


def fix_possessive_apostrophe(phrase):
    """所有格のアポストロフィを追加"""
    words = phrase['words']
    fixed_words = []
    
    for i, word in enumerate(words):
        # 次の単語が名詞で、現在の単語が複数形名詞の場合
        if i < len(words) - 1:
            next_word = words[i + 1]
            
            # generations ability → generations' ability
            if word == 'generations' and next_word in ['ability', 'needs', 'rights', 'future', 'well-being']:
                fixed_words.append("generations'")
                continue
            
            # peoples adapt → peoples' (ただしpeopleの場合はpeople's)
            if word == 'peoples' and next_word not in ['.', ',', 'and', 'or']:
                fixed_words.append("peoples'")
                continue
            
            # children, women, menは不規則複数形
            if word == 'childrens':
                fixed_words.append("children's")
                continue
            if word == 'womens':
                fixed_words.append("women's")
                continue
            if word == 'mens':
                fixed_words.append("men's")
                continue
        
        fixed_words.append(word)
    
    return fixed_words


def fix_passage_file(filepath):
    """パッセージファイルを修正"""
    print(f"\n処理中: {os.path.basename(filepath)}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    comma_fixed = 0
    apostrophe_fixed = 0
    incomplete_sentences = []
    
    for phrase in data['phrases']:
        # カンマ重複修正
        original_words = phrase['words'][:]
        phrase['words'] = fix_duplicate_commas(phrase)
        
        if original_words != phrase['words']:
            comma_fixed += 1
        
        # 所有格修正
        original_words = phrase['words'][:]
        phrase['words'] = fix_possessive_apostrophe(phrase)
        
        if original_words != phrase['words']:
            apostrophe_fixed += 1
        
        # 不完全な文をレポート（修正は手動で行う）
        words = phrase['words']
        if len(words) > 0:
            first_word = words[0].lower()
            if first_word in ['without', 'although', 'because', 'if', 'when', 'while', 'since'] and '.' in words and len(words) < 8:
                incomplete_sentences.append({
                    'id': phrase['id'],
                    'text': ' '.join(words),
                    'meaning': phrase.get('phraseMeaning', '')
                })
    
    # ファイルに保存
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ カンマ重複修正: {comma_fixed}箇所")
    print(f"  ✅ 所有格修正: {apostrophe_fixed}箇所")
    
    if incomplete_sentences:
        print(f"  ⚠️ 不完全な文の可能性: {len(incomplete_sentences)}箇所")
        for item in incomplete_sentences[:3]:
            print(f"     - {item['id']}: {item['text']}")
    
    return comma_fixed, apostrophe_fixed, incomplete_sentences


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
    print("パッセージ文法修正スクリプト")
    print("=" * 70)
    
    total_comma = 0
    total_apostrophe = 0
    all_incomplete = []
    
    for filename in files:
        filepath = os.path.join(prototype_dir, filename)
        if os.path.exists(filepath):
            comma, apostrophe, incomplete = fix_passage_file(filepath)
            total_comma += comma
            total_apostrophe += apostrophe
            all_incomplete.extend([(filename, item) for item in incomplete])
        else:
            print(f"\n⚠️  {filename} が見つかりません")
    
    print("\n" + "=" * 70)
    print("修正完了")
    print("=" * 70)
    print(f"カンマ重複修正: {total_comma}箇所")
    print(f"所有格修正: {total_apostrophe}箇所")
    print(f"不完全文レポート: {len(all_incomplete)}箇所（要手動確認）")
    
    if all_incomplete:
        print("\n【不完全な文のリスト】")
        for filename, item in all_incomplete:
            print(f"{filename} - {item['id']}: {item['text']}")


if __name__ == '__main__':
    main()
