#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

def add_grammar_labels_to_conjugations(related_words):
    """活用形に文法用語の説明を追加"""
    
    # 動詞活用の場合
    if '(動詞活用)' in related_words:
        # パターン: (動詞活用)word(reading):meaning, past(reading):meaning, past_participle(reading):meaning, present_participle(reading):meaning, third_person(reading):meaning
        
        # 動詞活用部分を抽出
        match = re.search(r'\(動詞活用\)([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+)', related_words)
        if match:
            base = match.group(1)  # 原形
            past = match.group(2)  # 過去形
            past_part = match.group(3)  # 過去分詞
            pres_part = match.group(4)  # 現在分詞
            third = match.group(5)  # 三単現
            
            # 文法用語を追加
            new_conjugation = (
                f"(動詞活用){base}(原形), "
                f"{past}(過去形), "
                f"{past_part}(過去分詞形), "
                f"{pres_part}(現在分詞形), "
                f"{third}(三単現)"
            )
            
            # be動詞の特殊処理（was/were）
            if 'was/were' in related_words:
                new_conjugation = re.sub(r'was/were\([^)]+\)\:([^,]+)\(過去形\)', r'was/were(過去形):\1', new_conjugation)
            
            related_words = related_words.replace(match.group(0), new_conjugation)
    
    # 代名詞変化の場合
    if '(代名詞)' in related_words:
        # パターン: (代名詞)word(reading):meaning, possessive(reading):meaning, objective(reading):meaning, possessive_pron(reading):meaning
        
        match = re.search(r'\(代名詞\)([^,]+), ([^,]+), ([^,]+), ([^,]+)', related_words)
        if match:
            subjective = match.group(1)  # 主格
            possessive = match.group(2)  # 所有格
            objective = match.group(3)  # 目的格
            poss_pron = match.group(4)  # 所有代名詞
            
            new_pronoun = (
                f"(代名詞){subjective}(主格), "
                f"{possessive}(所有形容詞), "
                f"{objective}(目的格), "
                f"{poss_pron}(所有代名詞)"
            )
            
            related_words = related_words.replace(match.group(0), new_pronoun)
    
    # 比較級・最上級の場合
    if '(比較級)' in related_words:
        # パターン: (比較級)word(reading):meaning, comparative(reading):meaning, superlative(reading):meaning
        
        match = re.search(r'\(比較級\)([^,]+), ([^,]+), ([^,]+)', related_words)
        if match:
            positive = match.group(1)  # 原級
            comparative = match.group(2)  # 比較級
            superlative = match.group(3)  # 最上級
            
            new_comparative = (
                f"(比較級){positive}(原級), "
                f"{comparative}(比較級), "
                f"{superlative}(最上級)"
            )
            
            related_words = related_words.replace(match.group(0), new_comparative)
    
    return related_words

# CSVファイルを処理
input_file = 'public/data/junior-high-entrance-words.csv'
output_file = 'public/data/junior-high-entrance-words_updated.csv'

rows = []
updated_count = 0

print("処理中...")

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows.append(header)
    
    for row in reader:
        if len(row) >= 7:
            word = row[0].strip()
            related_words = row[4]
            
            # 活用形がある場合のみ処理
            if '(動詞活用)' in related_words or '(代名詞)' in related_words or '(比較級)' in related_words:
                new_related_words = add_grammar_labels_to_conjugations(related_words)
                
                if new_related_words != related_words:
                    row[4] = new_related_words
                    updated_count += 1
                    if updated_count <= 10:
                        print(f"Updated: {word}")
            
            rows.append(row)

# 更新されたCSVを保存
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"\n✅ 完了: {updated_count}個の単語に文法用語を追加しました")
print(f"出力ファイル: {output_file}")
