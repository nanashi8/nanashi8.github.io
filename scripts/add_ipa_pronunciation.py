#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSVファイルの「読み」列に国際音声記号(IPA)を追加
形式: IPA発音記号 (カタカナ́)
例: ˈeɪbl̩ (エ́イブル)
"""

import csv
import sys

# サンプル実装: まず10単語で動作確認
SAMPLE_IPA = {
    'a': 'eɪ',
    'able': 'ˈeɪbl̩',
    'about': 'əˈbaʊt',
    'above': 'əˈbʌv',
    'accept': 'əkˈsept',
    'café': 'kæˈfeɪ',
}

def process_file(input_file):
    """CSVファイルを読み込み、IPA発音記号付きで表示"""
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    print(f"\n=== {input_file} ===")
    print(f"総行数: {len(rows)}")
    print(f"\n最初の5行:")
    for i, row in enumerate(rows[:5]):
        if i == 0:
            print(f"ヘッダー: {row}")
        else:
            word = row[0] if len(row) > 0 else ""
            reading = row[1] if len(row) > 1 else ""
            meaning = row[2] if len(row) > 2 else ""
            print(f"{i}. {word} | {reading} | {meaning}")

# 3つのファイルを処理
files = [
    './public/data/vocabulary/intermediate-1800-words.csv',
    './public/data/vocabulary/junior-high-entrance-words.csv',
    './public/data/vocabulary/junior-high-entrance-phrases.csv',
]

for file in files:
    try:
        process_file(file)
    except Exception as e:
        print(f"エラー: {file} - {e}")
