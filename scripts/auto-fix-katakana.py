#!/usr/bin/env python3
"""
カタカナ英語混入エラーの自動修正スクリプト

KATAKANA_ENGLISH_MIXED エラーを自動的に修正します。
英語がそのまま入っているカタカナ部分を適切なカタカナに変換します。
"""

import csv
import re
from pathlib import Path

# 英語→カタカナの変換辞書
ENGLISH_TO_KATAKANA = {
    'August': 'オーガ́スト',
    'Brazil': 'ブラジ́ル',
    'China': 'チャ́イナ',
    'English': 'イ́ングリッシュ',
    'Japan': 'ジャパ́ン',
    'Ms.': 'ミ́ズ',
    'Action': 'ア́クション',
    'action': 'ア́クション',
    'Actually': 'ア́クチュアリー',
    'actually': 'ア́クチュアリー',
    'Difference': 'ディ́ファレンス',
    'Exactly': 'イグザ́クトリー',
    # 注: 't' や 'k' は IPA記号の一部なので修正しない
}

def fix_katakana_english_mixed(csv_file_path: Path, output_path: Path = None):
    """
    CSVファイル内のカタカナ英語混入エラーを修正
    
    Args:
        csv_file_path: 修正対象のCSVファイルパス
        output_path: 出力先パス（Noneの場合は上書き）
    """
    if output_path is None:
        output_path = csv_file_path
    
    fixed_count = 0
    rows = []
    
    # CSVファイルを読み込み
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            original_reading = row.get('読み', '')
            
            if original_reading:
                # カッコ内の英語を検出して修正
                modified = False
                new_reading = original_reading
                
                # パターン: "IPA (English)" を "IPA (カタカナ)" に変換
                def replace_english_in_parentheses(match):
                    nonlocal modified
                    ipa_part = match.group(1)
                    english_part = match.group(2)
                    
                    # 英語部分をカタカナに変換
                    if english_part in ENGLISH_TO_KATAKANA:
                        katakana = ENGLISH_TO_KATAKANA[english_part]
                        modified = True
                        return f"{ipa_part} ({katakana})"
                    
                    return match.group(0)
                
                # "IPA (English)" パターンをマッチ
                new_reading = re.sub(
                    r'([^\s()]+)\s*\(([^)]+)\)',
                    replace_english_in_parentheses,
                    original_reading
                )
                
                if modified:
                    row['読み'] = new_reading
                    fixed_count += 1
                    print(f"修正: {row['語句']}")
                    print(f"  Before: {original_reading}")
                    print(f"  After:  {new_reading}")
            
            rows.append(row)
    
    # 修正後のデータを保存
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n修正完了: {fixed_count}件")
    return fixed_count

def main():
    # all-words.csv を修正
    csv_file = Path('public/data/vocabulary/all-words.csv')
    
    if not csv_file.exists():
        print(f"エラー: {csv_file} が見つかりません")
        return
    
    print(f"修正対象: {csv_file}")
    print("=" * 60)
    
    # バックアップ作成
    backup_file = csv_file.with_suffix('.csv.backup')
    import shutil
    shutil.copy2(csv_file, backup_file)
    print(f"バックアップ作成: {backup_file}")
    print()
    
    # 修正実行
    fixed = fix_katakana_english_mixed(csv_file)
    
    if fixed > 0:
        print(f"\n✅ {fixed}件のエラーを修正しました")
        print(f"バックアップ: {backup_file}")
    else:
        print("\n修正対象のエラーが見つかりませんでした")

if __name__ == '__main__':
    main()
