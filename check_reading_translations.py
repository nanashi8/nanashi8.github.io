#!/usr/bin/env python3
"""
読解パッセージの日本語訳チェックツール

このスクリプトは、全パッセージファイルの phraseMeaning をチェックし、
並列要素で読点が欠けている可能性のあるフレーズを検出します。

使用方法:
    python3 check_reading_translations.py > translation_issues.txt
"""

import json
import re
from pathlib import Path

def check_phrase_meaning(meaning: str, phrase_id: str, words: list) -> list:
    """フレーズの意味をチェックして問題を検出"""
    issues = []
    
    # パターン1: 漢字が3つ以上連続（読点なし）
    # 例: 気候変動資源枯渇汚染
    pattern1 = r'([一-龯]{2,})([一-龯]{2,})([一-龯]{2,})'
    if re.search(pattern1, meaning) and '、' not in meaning:
        issues.append('漢字並列（読点欠落の可能性）')
    
    # パターン2: カタカナが長く連続
    # 例: ハリケーン干ばつ洪水
    katakana_words = re.findall(r'[ァ-ヴー]{3,}', meaning)
    if len(katakana_words) >= 3:
        # 読点の数をチェック
        comma_count = meaning.count('、')
        if comma_count < len(katakana_words) - 1:
            issues.append('カタカナ並列（読点欠落の可能性）')
    
    # パターン3: 英単語3つ以上の並列に対応する日本語
    english_words = [w for w in words if w.replace(',', '').replace('.', '').isalpha()]
    # "and" や "or" の位置を確認
    if 'and' in words or 'or' in words:
        and_or_index = words.index('and') if 'and' in words else words.index('or')
        # andの前に2つ以上の単語があり、日本語に読点がない
        if and_or_index >= 2 and '、' not in meaning:
            issues.append('並列構造（読点欠落の可能性）')
    
    return issues

def check_passage_file(filepath: Path) -> dict:
    """パッセージファイルをチェック"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        results = {
            'filename': filepath.name,
            'title': data.get('title', 'Unknown'),
            'level': data.get('level', 'Unknown'),
            'issues': []
        }
        
        for phrase in data.get('phrases', []):
            phrase_id = phrase.get('id', 'unknown')
            meaning = phrase.get('phraseMeaning', '')
            words = phrase.get('words', [])
            
            issues = check_phrase_meaning(meaning, phrase_id, words)
            
            if issues:
                results['issues'].append({
                    'phrase_id': phrase_id,
                    'meaning': meaning,
                    'words': ' '.join(words),
                    'issues': issues
                })
        
        return results
    
    except Exception as e:
        return {
            'filename': filepath.name,
            'error': str(e),
            'issues': []
        }

def main():
    """メイン処理"""
    data_dir = Path('public/data')
    
    # パッセージファイルのリスト
    passage_files = [
        'beginner-1.json', 'beginner-2.json', 'beginner-3.json',
        'intermediate-1.json', 'intermediate-2.json', 'intermediate-3.json',
        'intermediate-4.json', 'intermediate-5.json',
        'advanced-1.json', 'advanced-2.json', 'advanced-3.json'
    ]
    
    print("=" * 80)
    print("読解パッセージ 日本語訳チェック結果")
    print("=" * 80)
    print()
    
    total_issues = 0
    
    for filename in passage_files:
        filepath = data_dir / filename
        if not filepath.exists():
            print(f"⚠️  {filename} が見つかりません")
            continue
        
        result = check_passage_file(filepath)
        
        if 'error' in result:
            print(f"❌ {filename}: エラー - {result['error']}")
            continue
        
        if result['issues']:
            print(f"\n📄 {result['filename']}")
            print(f"   タイトル: {result['title']}")
            print(f"   レベル: {result['level']}")
            print(f"   問題数: {len(result['issues'])} 件")
            print()
            
            # 最初の10件を表示
            for i, issue in enumerate(result['issues'][:10], 1):
                print(f"   {i}. {issue['phrase_id']}")
                print(f"      問題: {', '.join(issue['issues'])}")
                print(f"      現在: {issue['meaning'][:60]}...")
                print(f"      英語: {issue['words'][:60]}...")
                print()
            
            if len(result['issues']) > 10:
                print(f"   ... その他 {len(result['issues']) - 10} 件")
                print()
            
            total_issues += len(result['issues'])
        else:
            print(f"✅ {result['filename']}: 問題なし")
    
    print()
    print("=" * 80)
    print(f"総問題数: {total_issues} 件")
    print("=" * 80)
    print()
    print("【推奨対応】")
    print("1. 優先度「高」: 明らかな並列要素の読点欠落を修正")
    print("2. 優先度「中」: カタカナ・漢字の連続を確認し、必要に応じて読点追加")
    print("3. 優先度「低」: 全体的な日本語の自然さを向上")
    print()

if __name__ == '__main__':
    main()
