#!/usr/bin/env python3
"""
reading-passages-comprehensive.jsonから熟語データを抽出して
junior-high-entrance-words.csv形式のCSVファイルを生成するスクリプト
"""

import json
import csv
import sys
from pathlib import Path

def extract_phrases_from_json(json_path: str) -> list:
    """JSONファイルから熟語データを抽出"""
    with open(json_path, 'r', encoding='utf-8') as f:
        passages = json.load(f)
    
    phrases_data = []
    seen_phrases = set()  # 重複を避けるため
    
    for passage in passages:
        level = passage.get('level', '')
        passage_title = passage.get('title', '')
        
        # レベルを難易度に変換
        difficulty_map = {
            'beginner': '初級',
            '初級': '初級',
            'intermediate': '中級',
            '中級': '中級',
            'advanced': '上級',
            '上級': '上級',
            'Advanced': '上級'
        }
        difficulty = difficulty_map.get(level, '中級')
        
        phrases = passage.get('phrases', [])
        
        for phrase_obj in phrases:
            # wordsとphraseMeaningを取得
            words = phrase_obj.get('words', [])
            phrase_meaning = phrase_obj.get('phraseMeaning', '').strip()
            
            if not words or not phrase_meaning:
                continue
            
            # words配列を結合してフレーズテキストを作成
            phrase_text = ' '.join(words)
            
            # 重複チェック（大文字小文字を区別しない）
            phrase_key = phrase_text.lower()
            if phrase_key in seen_phrases:
                continue
            
            seen_phrases.add(phrase_key)
            
            # CSV行データを作成
            # 形式: 語句,読み,意味,語源等解説,関連語,関連分野,難易度
            phrase_data = {
                'word': phrase_text,
                'reading': '',  # 熟語の読みは空欄
                'meaning': phrase_meaning,
                'etymology': '',  # 語源は空欄
                'relatedWords': '',  # 関連語は空欄
                'category': passage_title,  # パッセージのタイトルを関連分野として使用
                'difficulty': difficulty
            }
            
            phrases_data.append(phrase_data)
    
    return phrases_data

def write_csv(phrases_data: list, output_path: str):
    """熟語データをCSVファイルに書き込む"""
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        
        # ヘッダー行
        writer.writerow(['語句', '読み', '意味', '語源等解説', '関連語', '関連分野', '難易度'])
        
        # データ行
        for phrase in phrases_data:
            writer.writerow([
                phrase['word'],
                phrase['reading'],
                phrase['meaning'],
                phrase['etymology'],
                phrase['relatedWords'],
                phrase['category'],
                phrase['difficulty']
            ])

def main():
    # パスの設定
    script_dir = Path(__file__).parent
    json_path = script_dir / 'public/data/reading-passages-comprehensive.json'
    output_path = script_dir / 'public/data/reading-phrases.csv'
    
    print(f'📖 熟語データを抽出中: {json_path}')
    
    # JSONから熟語を抽出
    phrases_data = extract_phrases_from_json(str(json_path))
    
    print(f'✅ {len(phrases_data)}個の熟語を抽出しました')
    
    # CSVファイルに書き込み
    write_csv(phrases_data, str(output_path))
    
    print(f'💾 CSVファイルを保存しました: {output_path}')
    
    # レベル別の統計を表示
    difficulty_counts = {}
    for phrase in phrases_data:
        diff = phrase['difficulty']
        difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
    
    print('\n📊 難易度別統計:')
    for diff, count in sorted(difficulty_counts.items()):
        print(f'  {diff}: {count}個')

if __name__ == '__main__':
    main()
