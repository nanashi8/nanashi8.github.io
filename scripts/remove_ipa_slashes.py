#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IPA発音記号のスラッシュ(/)を削除するスクリプト
/ˈeɪbl̩/ (カタカナ) → ˈeɪbl̩ (カタカナ)
"""

import csv
import re
import sys

def remove_slashes_from_ipa(input_file):
    """CSVファイル内のIPA発音記号からスラッシュを削除"""
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    header = rows[0]
    data_rows = rows[1:]
    
    fixed_count = 0
    
    for row in data_rows:
        if len(row) < 2:
            continue
        
        reading = row[1]
        
        # パターン: /IPA/ (カタカナ) を検索
        new_reading = re.sub(r'/([^/]+)/', r'\1', reading)
        
        if new_reading != reading:
            row[1] = new_reading
            fixed_count += 1
    
    # ファイルに書き戻し
    with open(input_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows([header] + data_rows)
    
    return fixed_count

def main():
    files = [
        './public/data/vocabulary/intermediate-1800-words.csv',
        './public/data/vocabulary/junior-high-entrance-words.csv',
        './public/data/vocabulary/junior-high-entrance-phrases.csv',
    ]
    
    total_fixed = 0
    for file in files:
        try:
            count = remove_slashes_from_ipa(file)
            total_fixed += count
            print(f"✅ {file.split('/')[-1]}: {count}箇所修正")
        except Exception as e:
            print(f"❌ エラー ({file.split('/')[-1]}): {e}")
    
    print(f"\n🎉 完了: 合計 {total_fixed}箇所のスラッシュを削除")

if __name__ == '__main__':
    main()
