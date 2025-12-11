#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
括弧内の英語スペルを元のカタカナ読みに復元するスクリプト
Git履歴から元の読みを取得して置換
"""

import csv
import re
import subprocess
import sys

def get_original_katakana_from_git(file_path):
    """Git履歴から元のカタカナ読みを取得"""
    try:
        # 1つ前のコミットからファイルを取得
        cmd = ['git', 'show', f'HEAD~1:{file_path}']
        result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
        
        if result.returncode != 0:
            print(f"⚠️  Git履歴取得失敗: {result.stderr}")
            return {}
        
        # CSVをパース
        lines = result.stdout.strip().split('\n')
        reader = csv.reader(lines)
        rows = list(reader)
        
        # 語句 → 元の読み のマッピングを作成
        katakana_map = {}
        for row in rows[1:]:  # ヘッダーをスキップ
            if len(row) >= 2:
                word = row[0]
                original_reading = row[1]
                # アクセント付きカタカナのみ抽出
                if re.search(r'[\u30A0-\u30FF\u0301́]', original_reading):
                    katakana_map[word.lower()] = original_reading
        
        return katakana_map
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return {}

def restore_katakana_in_parentheses(input_file, git_path):
    """括弧内の英語スペルを元のカタカナに復元"""
    
    # Git履歴から元の読みを取得
    print(f"📖 Git履歴から元の読みを取得中: {git_path}")
    katakana_map = get_original_katakana_from_git(git_path)
    print(f"   取得したマッピング数: {len(katakana_map)}件\n")
    
    # CSVを読み込み
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    header = rows[0]
    data_rows = rows[1:]
    
    fixed_count = 0
    
    for row in data_rows:
        if len(row) < 2:
            continue
        
        word = row[0]
        reading = row[1]
        
        # パターン: IPA (英語スペル) を検出
        match = re.search(r'\(([A-Z][a-z]+)\)$', reading)
        
        if match:
            english_word = match.group(1)
            word_lower = word.lower()
            
            # 元のカタカナ読みを取得
            if word_lower in katakana_map:
                original_katakana = katakana_map[word_lower]
                # IPA部分を保持してカタカナのみ置換
                ipa_part = reading.replace(f' ({english_word})', '')
                new_reading = f"{ipa_part} ({original_katakana})"
                row[1] = new_reading
                fixed_count += 1
                if fixed_count <= 10:  # 最初の10件を表示
                    print(f"  修正: {word} | {reading} → {new_reading}")
    
    # ファイルに書き戻し
    with open(input_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows([header] + data_rows)
    
    return fixed_count

def main():
    files = [
        {
            'file': './public/data/vocabulary/intermediate-1800-words.csv',
            'git': 'public/data/vocabulary/intermediate-1800-words.csv'
        },
        {
            'file': './public/data/vocabulary/junior-high-entrance-words.csv',
            'git': 'public/data/vocabulary/junior-high-entrance-words.csv'
        },
    ]
    
    total_fixed = 0
    for item in files:
        print(f"\n{'='*60}")
        print(f"処理: {item['file'].split('/')[-1]}")
        print(f"{'='*60}")
        
        try:
            count = restore_katakana_in_parentheses(item['file'], item['git'])
            total_fixed += count
            print(f"\n✅ 完了: {count}箇所修正\n")
        except Exception as e:
            print(f"❌ エラー: {e}\n")
    
    print(f"\n{'='*60}")
    print(f"🎉 全処理完了: 合計 {total_fixed}箇所を修正")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
