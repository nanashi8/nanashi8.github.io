#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

# 20個の許可されたカテゴリ
VALID_CATEGORIES = {
    '日常', '学校', '家族', '食べ物', '交通', '旅行', '健康', '動物', '自然', '地理',
    '科学', '文法', '文化', '時間', 'テクノロジー', '買い物', '職業', 'スポーツ', '感情', 'その他'
}

# 既存カテゴリから新カテゴリへのマッピング
CATEGORY_MAPPING = {
    # 基本カテゴリ(そのまま)
    '日常': '日常',
    '学校': '学校',
    '家族': '家族',
    '食べ物': '食べ物',
    '交通': '交通',
    '旅行': '旅行',
    '健康': '健康',
    '動物': '動物',
    '自然': '自然',
    '地理': '地理',
    '科学': '科学',
    '文法': '文法',
    '文化': '文化',
    '時間': '時間',
    'テクノロジー': 'テクノロジー',
    '買い物': '買い物',
    '職業': '職業',
    'スポーツ': 'スポーツ',
    '感情': '感情',
    'その他': 'その他',
    
    # 文法系
    '動詞': '文法',
    '名詞': '文法',
    '形容詞': '文法',
    '副詞': '文法',
    '前置詞': '文法',
    '接続詞': '文法',
    '冠詞': '文法',
    '限定詞': '文法',
    '代名詞': '文法',
    
    # 動作・状態系
    '動作': '日常',
    '状態': '日常',
    '状態変化': '日常',
    '変化': '日常',
    '伝達': '日常',
    '思考': '日常',
    
    # 抽象概念系
    '概念': 'その他',
    '程度': 'その他',
    '位置': 'その他',
    '方向': 'その他',
    '頻度': '時間',
    
    # 社会・経済系
    '社会': 'その他',
    '経済': 'その他',
    '政治': 'その他',
    '法律': 'その他',
    
    # 生活・物品系
    '生活': '日常',
    '人体': '健康',
    '医療': '健康',
    '服装': '日常',
    '色': 'その他',
    '形状': 'その他',
    '材料': 'その他',
    '温度': '自然',
    '価格': '買い物',
    
    # 人間関係・感情系
    '人間関係': '家族',
    '性格': '感情',
    '態度': '感情',
    
    # 学習・芸術系
    '学習': '学校',
    '芸術': '文化',
    '音楽': '文化',
    
    # 自然・生物系
    '植物': '自然',
    '生物': '動物',
    '天気': '自然',
    '気候': '自然',
    '地形': '地理',
    '天体': '科学',
    
    # その他
    'レジャー': '旅行',
    '手続き': 'その他',
    '宗教': '文化',
}

def map_category(old_category):
    """既存カテゴリを新しい20カテゴリにマッピング"""
    if old_category in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[old_category]
    else:
        # マッピングが見つからない場合はその他
        print(f"Warning: Unknown category '{old_category}' mapped to 'その他'")
        return 'その他'

def main():
    input_file = 'public/data/junior-high-entrance-words.csv'
    output_file = 'public/data/junior-high-entrance-words.csv'
    
    rows = []
    
    # CSVを読み込む
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        rows.append(header)
        
        for row in reader:
            if len(row) >= 7:
                # 6番目のカラム(index 5)が関連分野
                old_category = row[5]
                new_category = map_category(old_category)
                row[5] = new_category
                rows.append(row)
            else:
                rows.append(row)
    
    # CSVに書き込む
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    print(f"Updated {len(rows) - 1} entries")
    print("Category update completed successfully!")

if __name__ == '__main__':
    main()
