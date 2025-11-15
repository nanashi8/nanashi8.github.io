#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
英熟語データを既存の英単語CSVに追加統合するスクリプト

使用方法:
  python3 merge_phrases.py <熟語CSVファイル>
  
例:
  python3 merge_phrases.py public/data/sample-phrases-50.csv
"""

import csv
import sys
import os
from collections import Counter

def validate_csv_format(filepath):
    """CSVファイルのフォーマットを検証"""
    required_columns = ['語句', '読み', '意味', '語源等解説', '関連語', '関連分野', '難易度']
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            return False, "ヘッダー行が見つかりません"
        
        missing = set(required_columns) - set(fieldnames)
        if missing:
            return False, f"必須列が不足: {', '.join(missing)}"
        
        return True, "OK"

def load_csv(filepath):
    """CSVファイルを読み込む"""
    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # None キーを削除
            if None in row:
                del row[None]
            rows.append(row)
    return rows

def check_duplicates(existing_words, new_phrases):
    """重複をチェック"""
    existing_set = set(row['語句'].lower().strip() for row in existing_words)
    duplicates = []
    
    for phrase in new_phrases:
        word = phrase['語句'].lower().strip()
        if word in existing_set:
            duplicates.append(phrase['語句'])
    
    return duplicates

def merge_and_save(words_file, phrases_file, output_file):
    """単語と熟語をマージして保存"""
    # 検証
    print(f"📋 検証中...")
    valid, msg = validate_csv_format(words_file)
    if not valid:
        print(f"❌ 単語ファイルエラー: {msg}")
        return False
    
    valid, msg = validate_csv_format(phrases_file)
    if not valid:
        print(f"❌ 熟語ファイルエラー: {msg}")
        return False
    
    # 読み込み
    print(f"📖 読み込み中...")
    words = load_csv(words_file)
    phrases = load_csv(phrases_file)
    
    print(f"  単語: {len(words)}件")
    print(f"  熟語: {len(phrases)}件")
    
    # 重複チェック
    print(f"🔍 重複チェック中...")
    duplicates = check_duplicates(words, phrases)
    if duplicates:
        print(f"⚠️  警告: {len(duplicates)}件の重複を検出")
        for dup in duplicates[:5]:  # 最初の5件のみ表示
            print(f"    - {dup}")
        if len(duplicates) > 5:
            print(f"    ... 他 {len(duplicates) - 5}件")
        
        response = input("\n続行しますか？ (y/n): ")
        if response.lower() != 'y':
            print("❌ 中止しました")
            return False
    
    # マージ
    print(f"\n🔗 マージ中...")
    merged = words + phrases
    
    # カテゴリー分布を確認
    category_counts = Counter(row['関連分野'] for row in merged)
    difficulty_counts = Counter(row['難易度'] for row in merged)
    
    # 保存
    print(f"💾 保存中: {output_file}")
    fieldnames = ['語句', '読み', '意味', '語源等解説', '関連語', '関連分野', '難易度']
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(merged)
    
    # レポート
    print(f"\n✅ マージ完了")
    print(f"\n【統計情報】")
    print(f"  総項目数: {len(merged)}件")
    print(f"    - 単語: {len(words)}件")
    print(f"    - 熟語: {len(phrases)}件")
    
    print(f"\n【カテゴリー別分布】")
    for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        percentage = count / len(merged) * 100
        print(f"  {cat}: {count}件 ({percentage:.1f}%)")
    
    print(f"\n【難易度別分布】")
    for diff in ['初級', '中級', '上級']:
        count = difficulty_counts.get(diff, 0)
        percentage = count / len(merged) * 100
        print(f"  {diff}: {count}件 ({percentage:.1f}%)")
    
    return True

def main():
    if len(sys.argv) != 2:
        print("使用方法: python3 merge_phrases.py <熟語CSVファイル>")
        print("例: python3 merge_phrases.py public/data/sample-phrases-50.csv")
        sys.exit(1)
    
    phrases_file = sys.argv[1]
    words_file = 'public/data/junior-high-entrance-words.csv'
    output_file = 'public/data/junior-high-entrance-words-with-phrases.csv'
    
    # ファイル存在チェック
    if not os.path.exists(words_file):
        print(f"❌ 単語ファイルが見つかりません: {words_file}")
        sys.exit(1)
    
    if not os.path.exists(phrases_file):
        print(f"❌ 熟語ファイルが見つかりません: {phrases_file}")
        sys.exit(1)
    
    print("=" * 60)
    print("  英熟語統合スクリプト")
    print("=" * 60)
    print(f"\n単語ファイル: {words_file}")
    print(f"熟語ファイル: {phrases_file}")
    print(f"出力ファイル: {output_file}\n")
    
    success = merge_and_save(words_file, phrases_file, output_file)
    
    if success:
        print(f"\n✨ 成功！統合ファイルを確認してください: {output_file}")
        print(f"\n次のステップ:")
        print(f"  1. {output_file} の内容を確認")
        print(f"  2. 問題なければ以下のコマンドで本番適用:")
        print(f"     mv {output_file} {words_file}")
    else:
        print(f"\n❌ マージに失敗しました")
        sys.exit(1)

if __name__ == '__main__':
    main()
