#!/usr/bin/env python3
"""
IPA記号の括弧表記を整理するスクリプト

IPA部分の括弧（オプション音素）を適切に処理し、
カタカナ部分からIPA記号を完全に除去
"""

import csv
import re
from pathlib import Path


def clean_ipa_katakana(reading):
    """
    IPA記号とカタカナを分離して整理

    Args:
        reading: 読みフィールド（例: "ˈak(t)ʃj(ʊ)əl (ア́クチュアル)"）

    Returns:
        tuple: (cleaned_reading, was_modified)
    """
    if not reading or '(' not in reading:
        return reading, False

    original = reading

    # カタカナ部分を抽出（最後の括弧）
    # 形式: "IPA (カタカナ́)" から最後の括弧を見つける
    parts = reading.rsplit('(', 1)
    if len(parts) < 2:
        return reading, False

    ipa_with_brackets = parts[0].strip()
    katakana_with_bracket = '(' + parts[1]

    # カタカナ部分を取得
    katakana_match = re.search(r'\(([^)]+)\)$', reading)
    if not katakana_match:
        return reading, False

    katakana_part = katakana_match.group(1)

    # カタカナ部分に英字や IPA記号が含まれているかチェック
    has_english = re.search(r'[A-Za-z]', katakana_part)
    has_ipa = re.search(r'[ɑæəɛɪʊʌɔɜʉɒɐɝɚɘɨäŏɵɞθðʃʒŋʔɹɡɾɫʍ]', katakana_part)

    # 英字やIPA記号が含まれている場合は、カタカナのみを抽出
    if has_english or has_ipa:
        # カタカナとアクセント記号のみを抽出
        cleaned_katakana = re.sub(r'[^ァ-ヴー・ ́]+', '', katakana_part)

        if cleaned_katakana and cleaned_katakana != katakana_part:
            # IPA部分を保持し、カタカナ部分を置換
            new_reading = ipa_with_brackets + f' ({cleaned_katakana})'
            return new_reading, True

    return reading, False


def fix_ipa_katakana_separation(csv_path):
    """
    CSVファイルのIPA/カタカナ分離を修正

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

        cleaned_reading, was_modified = clean_ipa_katakana(reading)

        if was_modified:
            rows[i-1][1] = cleaned_reading
            modified_count += 1
            modifications.append({
                'line': i,
                'word': word,
                'old': reading,
                'new': cleaned_reading
            })

    if modified_count > 0:
        # バックアップを作成
        backup_file = csv_file.with_suffix('.csv.backup-katakana-clean')
        import shutil
        shutil.copy(csv_file, backup_file)

        # 修正後のCSVを書き込み
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)

        print(f"✅ {csv_file.name}: {modified_count}件修正")
        print(f"📋 修正詳細:")
        for mod in modifications[:15]:  # 最初の15件のみ表示
            print(f"  行{mod['line']}: {mod['word']}")
            # 変更前後を比較
            old_kata = re.search(r'\(([^)]+)\)$', mod['old'])
            new_kata = re.search(r'\(([^)]+)\)$', mod['new'])
            if old_kata and new_kata:
                print(f"    カタカナ: ({old_kata.group(1)}) → ({new_kata.group(1)})")

        if len(modifications) > 15:
            print(f"  ... 他{len(modifications) - 15}件")
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
    print("IPA/カタカナ分離整理ツール")
    print("=" * 60)
    print()

    for csv_file in csv_files:
        csv_path = vocab_dir / csv_file
        fixed = fix_ipa_katakana_separation(csv_path)
        total_fixed += fixed
        print()

    print("=" * 60)
    print(f"✅ 完了: 合計 {total_fixed}件 修正")
    print("=" * 60)


if __name__ == '__main__':
    main()
