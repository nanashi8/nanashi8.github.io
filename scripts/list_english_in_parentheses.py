#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
括弧内の英語スペルを元のカタカナ発音に戻すスクリプト
語句列の単語から対応するカタカナ読みを自動検索
"""

import csv
import re
import sys

def fix_english_in_parentheses(input_file):
    """括弧内の英語スペルをカタカナに修正"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    header = rows[0]
    data_rows = rows[1:]
    
    fixed_count = 0
    
    for row in data_rows:
        if len(row) < 2:
            continue
        
        word = row[0]  # 語句
        reading = row[1]  # 読み
        
        # パターン: /IPA/ (英語スペル) を検出
        match = re.match(r'^(/[^/]+/)\s*\(([A-Z][a-z]+)\)$', reading)
        
        if match:
            ipa = match.group(1)
            english_word = match.group(2)
            
            # 元のカタカナ読みを推測
            # 語句が英語スペルと一致する場合、カタカナ化が必要
            word_lower = word.lower()
            english_lower = english_word.lower()
            
            if word_lower == english_lower:
                # 英語からカタカナへの簡易変換
                katakana = english_to_katakana(english_word)
                new_reading = f"{ipa} ({katakana})"
                row[1] = new_reading
                fixed_count += 1
                print(f"修正: {word} | {reading} → {new_reading}")
    
    # ファイルに書き戻し
    with open(input_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows([header] + data_rows)
    
    return fixed_count

def english_to_katakana(word):
    """英語をカタカナに簡易変換"""
    # 基本的な変換ルール
    replacements = {
        'abroad': 'アブロ́ード',
        'accident': 'ア́クシデント',
        'according': 'アコ́ーディング',
        'action': 'ア́クション',
        'actually': 'ア́クチュアリ',
        'against': 'アゲ́インスト',
        'ahead': 'アヘ́ッド',
        'aid': 'エ́イド',
        'airplane': 'エ́アプレイン',
        'airport': 'エ́アポート',
    }
    
    word_lower = word.lower()
    if word_lower in replacements:
        return replacements[word_lower]
    
    # デフォルト: 大文字のままカタカナ表記なし
    return word

def main():
    # まず、問題のあるエントリーをリストアップ
    print("🔍 括弧内に英語スペルが入っているエントリーを検索中...\n")
    
    files = [
        './public/data/vocabulary/intermediate-1800-words.csv',
    ]
    
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        print(f"📄 {file.split('/')[-1]}")
        print(f"   問題のあるエントリー:")
        
        count = 0
        for i, row in enumerate(rows[1:], 1):
            if len(row) >= 2:
                reading = row[1]
                # パターン: (英単語)
                if re.search(r'\([A-Z][a-z]+\)', reading):
                    word = row[0]
                    print(f"   行{i+1}: {word} | {reading}")
                    count += 1
                    if count >= 20:  # 最初の20件のみ表示
                        print(f"   ... (他にもあります)")
                        break
        print()

if __name__ == '__main__':
    main()
