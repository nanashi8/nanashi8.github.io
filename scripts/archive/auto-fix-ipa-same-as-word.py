#!/usr/bin/env python3
"""
IPA_SAME_AS_WORDエラーを自動修正するスクリプト

IPA発音が単語と同じ場合、正しいIPA発音に変換
"""

import csv
from pathlib import Path

# 単語→IPA発音のマッピング
IPA_MAPPINGS = {
    'P.E.': 'piː iː',
    'little by little': 'ˈlɪtl̩ baɪ ˈlɪtl̩',
    'last': 'læst',
    'nest': 'nɛst',
    'set': 'sɛt',
    'ten': 'tɛn',
    'test': 'tɛst',
    'west': 'wɛst',
    'bed': 'bɛd',
    'net': 'nɛt',
    'self': 'sɛlf',
    'send': 'sɛnd',
}

def fix_ipa_same_as_word(csv_path):
    """
    CSVファイルのIPA_SAME_AS_WORDエラーを修正

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
        if len(row) < 2:
            continue

        word = row[0].strip()
        reading = row[1].strip()

        # IPA部分を抽出
        if '(' in reading:
            ipa_part = reading.split('(')[0].strip()
            katakana_part = reading.split('(', 1)[1].rsplit(')', 1)[0] if ')' in reading else ''
        else:
            ipa_part = reading
            katakana_part = ''

        # IPAが単語と同じで、マッピングに存在する場合
        if ipa_part == word and word in IPA_MAPPINGS:
            correct_ipa = IPA_MAPPINGS[word]

            # 新しいreading形式を構築
            if katakana_part:
                new_reading = f"{correct_ipa} ({katakana_part})"
            else:
                new_reading = correct_ipa

            rows[i-1][1] = new_reading
            modified_count += 1
            modifications.append({
                'line': i,
                'word': word,
                'old_ipa': ipa_part,
                'new_ipa': correct_ipa
            })

    if modified_count > 0:
        # バックアップを作成
        backup_file = csv_file.with_suffix('.csv.backup-ipa-same')
        import shutil
        shutil.copy(csv_file, backup_file)

        # 修正後のCSVを書き込み
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)

        print(f"✅ {csv_file.name}: {modified_count}件修正")
        print(f"📋 修正詳細:")
        for mod in modifications:
            print(f"  行{mod['line']}: {mod['word']}")
            print(f"    IPA: {mod['old_ipa']} → {mod['new_ipa']}")
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
        'junior-high-intermediate-words.csv',
        'junior-high-intermediate-phrases.csv'
    ]

    total_fixed = 0

    print("=" * 60)
    print("IPA_SAME_AS_WORD自動修正ツール")
    print("=" * 60)
    print()

    for csv_file in csv_files:
        csv_path = vocab_dir / csv_file
        fixed = fix_ipa_same_as_word(csv_path)
        total_fixed += fixed
        print()

    print("=" * 60)
    print(f"✅ 完了: 合計 {total_fixed}件 修正")
    print("=" * 60)


if __name__ == '__main__':
    main()
