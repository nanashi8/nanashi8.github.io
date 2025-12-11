#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Free Dictionary APIを使用してIPA発音記号を取得し、CSVの読み列を更新
形式: IPA発音記号 (カタカナ́)
例: /ˈeɪbl̩/ (エ́イブル)
"""

import csv
import requests
import time
import json
import sys

def get_ipa_pronunciation(word):
    """
    Free Dictionary APIからIPA発音記号を取得
    https://dictionaryapi.dev/
    """
    # フレーズの場合は最初の単語のみ
    first_word = word.split()[0].lower()
    
    # 特殊文字を除去
    clean_word = ''.join(c for c in first_word if c.isalpha())
    
    if not clean_word:
        return None
    
    try:
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{clean_word}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                # phoneticsセクションからIPAを探す
                for entry in data:
                    if 'phonetics' in entry:
                        for phonetic in entry['phonetics']:
                            if 'text' in phonetic and phonetic['text']:
                                ipa = phonetic['text']
                                # /.../ の形式で返される場合があるので、そのまま使用
                                return ipa
        return None
    except Exception as e:
        print(f"  ⚠️  API Error for '{word}': {e}", file=sys.stderr)
        return None

def update_csv_with_ipa(input_file, output_file, limit=None):
    """
    CSVファイルの読み列をIPA + カタカナ形式に更新
    
    Args:
        input_file: 入力CSVファイルパス
        output_file: 出力CSVファイルパス
        limit: 処理する行数の上限（テスト用、Noneで全行処理）
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    header = rows[0]
    data_rows = rows[1:]
    
    if limit:
        data_rows = data_rows[:limit]
    
    updated_rows = [header]
    success_count = 0
    fail_count = 0
    
    print(f"\n📖 処理開始: {input_file}")
    print(f"   対象行数: {len(data_rows)}行\n")
    
    for i, row in enumerate(data_rows, 1):
        if len(row) < 2:
            updated_rows.append(row)
            continue
        
        word = row[0]  # 語句
        current_reading = row[1]  # 現在の読み
        
        # 既にIPA形式かチェック
        if current_reading.startswith('/') or current_reading.startswith('ˈ') or current_reading.startswith('ə'):
            updated_rows.append(row)
            continue
        
        # IPA発音記号を取得
        ipa = get_ipa_pronunciation(word)
        
        if ipa:
            # 新しい読み: IPA (カタカナ)
            new_reading = f"{ipa} ({current_reading})"
            row[1] = new_reading
            success_count += 1
            print(f"✅ {i:4d}. {word:20s} → {new_reading}")
        else:
            # IPA取得失敗時は元の読みを維持
            fail_count += 1
            print(f"⚠️  {i:4d}. {word:20s} → IPA取得失敗 (元の読み維持)")
        
        updated_rows.append(row)
        
        # API rate limit対策: 100ms待機
        time.sleep(0.1)
        
        # 進捗表示
        if i % 50 == 0:
            print(f"\n--- 進捗: {i}/{len(data_rows)} 行処理完了 (成功: {success_count}, 失敗: {fail_count}) ---\n")
    
    # 結果を保存
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(updated_rows)
    
    print(f"\n" + "="*60)
    print(f"✅ 処理完了: {output_file}")
    print(f"   総行数: {len(data_rows)}行")
    print(f"   成功: {success_count}行")
    print(f"   失敗: {fail_count}行")
    print(f"   成功率: {success_count/len(data_rows)*100:.1f}%")
    print("="*60 + "\n")

def main():
    """メイン処理"""
    
    # 本番モード: 全行処理
    print("\n🚀 本番モード: 全データを処理します\n")
    
    files = [
        'intermediate-1800-words.csv',
        'junior-high-entrance-words.csv',
        'junior-high-entrance-phrases.csv',
    ]
    
    base_path = './public/data/vocabulary'
    
    for filename in files:
        input_path = f"{base_path}/{filename}"
        output_path = input_path  # 元のファイルに上書き
        
        try:
            update_csv_with_ipa(input_path, output_path, limit=None)
        except Exception as e:
            print(f"❌ エラー ({filename}): {e}\n", file=sys.stderr)
            continue
    
    print("\n" + "🎉 全処理完了!")

if __name__ == '__main__':
    main()
