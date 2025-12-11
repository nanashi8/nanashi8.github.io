#!/usr/bin/env python3
"""
カタカナフィールドからIPA記号を除去する自動修正スクリプト

KATAKANA_INVALID_CHARSエラーを修正:
- カタカナ発音フィールドに含まれるIPA記号を除去
- IPA記号が混入している場合、その文字を削除して正しいカタカナのみに修正
"""

import csv
import re
from pathlib import Path

# IPA記号のセット（カタカナに含まれてはいけない文字）
IPA_SYMBOLS = set('ɑæəɛɪʊʌaeiouɔɜʉɒɐɝɚɘɨäŏɵɞːˈˌθðʃʒŋtdkgpbfvszmnlrjwhxyc ʔɹɡɾɫʍ.\\-[]() ̩̯̠̪̬̥̞̈̊̚͡ʰʷ')

def clean_katakana_field(katakana_text):
    """
    カタカナフィールドからIPA記号を除去
    
    Args:
        katakana_text: 元のカタカナテキスト
    
    Returns:
        tuple: (cleaned_text, was_modified, removed_chars)
    """
    if not katakana_text:
        return katakana_text, False, set()
    
    original = katakana_text
    removed_chars = set()
    
    # 各文字をチェック
    cleaned = []
    for char in katakana_text:
        # IPA記号の場合のみ除去
        # カタカナ、アクセント記号（́）、括弧、スペース、ハイフンは保持
        if char in IPA_SYMBOLS and char not in '() -':
            removed_chars.add(char)
            # IPA記号は削除
            continue
        else:
            # カタカナや許容文字は保持
            cleaned.append(char)
    
    cleaned_text = ''.join(cleaned)
    was_modified = cleaned_text != original
    
    return cleaned_text, was_modified, removed_chars


def fix_katakana_ipa_chars(csv_path):
    """
    CSVファイルのカタカナフィールドからIPA記号を除去
    
    Args:
        csv_path: CSVファイルのパス
    
    Returns:
        int: 修正した行数
    """
    csv_file = Path(csv_path)
    if not csv_file.exists():
        print(f"❌ ファイルが見つかりません: {csv_path}")
        return 0
    
    # CSVを読み込み
    with open(csv_file, 'r', encoding='utf-8') as f:
        rows = list(csv.reader(f))
    
    if len(rows) < 2:
        print(f"⚠️  データが不足しています: {csv_path}")
        return 0
    
    header = rows[0]
    modified_count = 0
    modifications = []
    
    # 各行をチェック
    for i, row in enumerate(rows[1:], start=2):
        if len(row) < 3:
            continue
        
        word = row[0]
        reading = row[1]
        meaning = row[2] if len(row) > 2 else ""
        
        # 読みフィールドから括弧内のカタカナを抽出
        # 形式: "IPA (カタカナ́)" または "カタカナ́"
        katakana_match = re.search(r'\(([^)]+)\)', reading)
        if katakana_match:
            katakana_part = katakana_match.group(1)
            cleaned, was_modified, removed = clean_katakana_field(katakana_part)
            
            if was_modified:
                # 括弧内のカタカナを置換
                new_reading = reading.replace(f'({katakana_part})', f'({cleaned})')
                rows[i-1][1] = new_reading
                modified_count += 1
                modifications.append({
                    'line': i,
                    'word': word,
                    'old': katakana_part,
                    'new': cleaned,
                    'removed': removed
                })
    
    if modified_count > 0:
        # バックアップを作成
        backup_file = csv_file.with_suffix('.csv.backup-ipa-chars')
        with open(backup_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows[:modified_count + 1] if modified_count < len(rows) else rows)
        
        # 修正後のCSVを書き込み
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)
        
        print(f"✅ {csv_file.name}: {modified_count}件修正")
        print(f"📋 修正詳細:")
        for mod in modifications[:10]:  # 最初の10件のみ表示
            removed_str = ', '.join(sorted(mod['removed']))
            print(f"  行{mod['line']}: {mod['word']}")
            print(f"    削除文字: {removed_str}")
            print(f"    変更前: ({mod['old']})")
            print(f"    変更後: ({mod['new']})")
        
        if len(modifications) > 10:
            print(f"  ... 他{len(modifications) - 10}件")
    else:
        print(f"ℹ️  {csv_file.name}: 修正不要")
    
    return modified_count


def main():
    """メイン処理"""
    base_dir = Path(__file__).parent.parent
    vocab_dir = base_dir / 'public' / 'data' / 'vocabulary'
    
    csv_files = [
        'high-school-entrance-words.csv',
        'high-school-entrance-phrases.csv',
        'high-school-intermediate-words.csv',
        'high-school-intermediate-phrases.csv'
    ]
    
    total_fixed = 0
    
    print("=" * 60)
    print("カタカナフィールドIPA記号除去ツール")
    print("=" * 60)
    print()
    
    for csv_file in csv_files:
        csv_path = vocab_dir / csv_file
        fixed = fix_katakana_ipa_chars(csv_path)
        total_fixed += fixed
        print()
    
    print("=" * 60)
    print(f"✅ 完了: 合計 {total_fixed}件 修正")
    print("=" * 60)


if __name__ == '__main__':
    main()
