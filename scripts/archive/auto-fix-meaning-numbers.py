#!/usr/bin/env python3
"""
数字の意味フィールドに日本語説明を追加するスクリプト

MEANING_NO_JAPANESEエラー修正: 数字のみの意味フィールドに日本語説明を追加
"""

import csv
from pathlib import Path

# 数字→日本語のマッピング
NUMBER_MEANINGS = {
    '0': '0（ゼロ、零）',
    '1': '1（いち、一）',
    '2': '2（に、二）',
    '3': '3（さん、三）',
    '4': '4（し、よん、四）',
    '5': '5（ご、五）',
    '6': '6（ろく、六）',
    '7': '7（しち、なな、七）',
    '8': '8（はち、八）',
    '9': '9（きゅう、く、九）',
    '10': '10（じゅう、十）',
    '11': '11（じゅういち、十一）',
    '12': '12（じゅうに、十二）',
    '13': '13（じゅうさん、十三）',
    '14': '14（じゅうし、じゅうよん、十四）',
    '15': '15（じゅうご、十五）',
    '16': '16（じゅうろく、十六）',
    '17': '17（じゅうしち、じゅうなな、十七）',
    '18': '18（じゅうはち、十八）',
    '19': '19（じゅうきゅう、じゅうく、十九）',
    '20': '20（にじゅう、二十）',
    '21': '21（にじゅういち、二十一）',
    '22': '22（にじゅうに、二十二）',
    '23': '23（にじゅうさん、二十三）',
    '24': '24（にじゅうし、にじゅうよん、二十四）',
    '25': '25（にじゅうご、二十五）',
    '26': '26（にじゅうろく、二十六）',
    '27': '27（にじゅうしち、にじゅうなな、二十七）',
    '28': '28（にじゅうはち、二十八）',
    '29': '29（にじゅうきゅう、にじゅうく、二十九）',
    '30': '30（さんじゅう、三十）',
    '40': '40（よんじゅう、四十）',
    '50': '50（ごじゅう、五十）',
    '60': '60（ろくじゅう、六十）',
    '70': '70（しちじゅう、ななじゅう、七十）',
    '80': '80（はちじゅう、八十）',
    '90': '90（きゅうじゅう、くじゅう、九十）',
    '100': '100（ひゃく、百）',
    '1000': '1000（せん、千）',
    '10000': '10000（いちまん、一万）',
}


def fix_number_meanings(csv_path):
    """
    CSVファイルの数字の意味フィールドに日本語を追加
    
    Args:
        csv_path: CSVファイルのパス
    
    Returns:
        int: 修正した行数
    """
    csv_file = Path(csv_path)
    if not csv_file.exists():
        return 0
    
    # CSVを読み込み
    with open(csv_file, 'r', encoding='utf-8') as f:
        rows = list(csv.reader(f))
    
    if len(rows) < 2:
        return 0
    
    header = rows[0]
    modified_count = 0
    modifications = []
    
    # 各行をチェック
    for i, row in enumerate(rows[1:], start=2):
        if len(row) < 3:
            continue
        
        word = row[0].strip()
        reading = row[1].strip()
        meaning = row[2].strip()
        
        # 意味フィールドが純粋な数字のみの場合
        if meaning in NUMBER_MEANINGS:
            new_meaning = NUMBER_MEANINGS[meaning]
            rows[i-1][2] = new_meaning
            modified_count += 1
            modifications.append({
                'line': i,
                'word': word,
                'old': meaning,
                'new': new_meaning
            })
    
    if modified_count > 0:
        # バックアップを作成
        backup_file = csv_file.with_suffix('.csv.backup-meaning')
        import shutil
        shutil.copy(csv_file, backup_file)
        
        # 修正後のCSVを書き込み
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)
        
        print(f"✅ {csv_file.name}: {modified_count}件修正")
        print(f"📋 修正詳細:")
        for mod in modifications[:10]:  # 最初の10件のみ表示
            print(f"  行{mod['line']}: {mod['word']}")
            print(f"    意味: {mod['old']} → {mod['new']}")
        
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
    print("数字の意味フィールド日本語追加ツール")
    print("=" * 60)
    print()
    
    for csv_file in csv_files:
        csv_path = vocab_dir / csv_file
        fixed = fix_number_meanings(csv_path)
        total_fixed += fixed
        print()
    
    print("=" * 60)
    print(f"✅ 完了: 合計 {total_fixed}件 修正")
    print("=" * 60)


if __name__ == '__main__':
    main()
