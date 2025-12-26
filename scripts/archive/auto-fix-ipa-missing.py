#!/usr/bin/env python3
"""
IPA欠損エラーの自動修正スクリプト

IPA_MISSING エラーを自動的に修正します。
カタカナのみの読みに、IPA発音記号を追加します。
"""

import csv
import re
from pathlib import Path

# カタカナ→IPA発音の変換辞書（主要な単語）
KATAKANA_TO_IPA = {
    'フェ́ブルアリー': 'ˈfɛbruɛri',
    'フラ́ンス': 'fɹæns',
    'フラ́イデイ': 'ˈfɹaɪdeɪ',
    'ジャ́ーマニー': 'ˈdʒɜːməni',
    'イ́ンディア': 'ˈɪndiə',
    'イ́タリー': 'ˈɪtəli',
    'ジャ́ニュアリー': 'ˈdʒænjuɛri',
    'ジャパニ́ーズ': 'dʒæpəˈniːz',
    'ジュラ́イ': 'dʒuˈlaɪ',
    'ジュ́ーン': 'dʒuːn',
    'マ́ーチ': 'mɑːtʃ',
    'メ́イ': 'meɪ',
    'マンダ́イ': 'ˈmʌndeɪ',
    'ノヴェ́ンバー': 'noˈvɛmbə',
    'オクト́ーバー': 'ɒkˈtoʊbə',
    'ラ́シア': 'ˈɹʌʃə',
    'サタ́デイ': 'ˈsætədeɪ',
    'セプテ́ンバー': 'sɛpˈtɛmbə',
    'スペ́イン': 'speɪn',
    'サンダ́イ': 'ˈsʌndeɪ',
    'スウィ́ーデン': 'ˈswiːdn',
    'スェ́ンズデイ': 'ˈθɜːzdeɪ',
    'チュ́ーズデイ': 'ˈtjuːzdeɪ',
    'ウェ́ンズデイ': 'ˈwɛnzdeɪ',
    # 追加: 新規IPA欠損単語
    'コリ́ア': 'kəˈɹiə',
    'マ́ンデイ': 'ˈmʌndeɪ',
    'ミ́スター': 'ˈmɪstə',
    'ミ́シズ': 'ˈmɪsɪz',
    'マウ́ント': 'maʊnt',
    'オリ́ンピック': 'əˈlɪmpɪk',
    'サ́タデイ': 'ˈsætədeɪ',
    'スィンガポ́ール': 'ˈsɪŋəpɔː',
    'サ́ンデイ': 'ˈsʌndeɪ',
    'タ́イランド': 'ˈtaɪlænd',
}

def fix_ipa_missing(csv_file_path: Path, output_path: Path = None):
    """
    CSVファイル内のIPA欠損エラーを修正

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
                # カッコがない場合（IPAが欠損している場合）
                if '(' not in original_reading or ')' not in original_reading:
                    katakana_reading = original_reading.strip()

                    # カタカナ→IPA変換
                    if katakana_reading in KATAKANA_TO_IPA:
                        ipa = KATAKANA_TO_IPA[katakana_reading]
                        new_reading = f"{ipa} ({katakana_reading})"

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
    # 4つのCSVファイルを修正
    base_dir = Path('public/data/vocabulary')
    csv_files = [
        base_dir / 'high-school-entrance-words.csv',
        base_dir / 'high-school-entrance-phrases.csv',
        base_dir / 'junior-high-intermediate-words.csv',
        base_dir / 'junior-high-intermediate-phrases.csv'
    ]

    total_fixed = 0

    for csv_file in csv_files:
        if not csv_file.exists():
            print(f"⚠️ ファイル未検出: {csv_file}")
            continue

        print(f"\n修正対象: {csv_file}")
        print("=" * 60)

        # 修正実行
        fixed = fix_ipa_missing(csv_file)
        total_fixed += fixed

        if fixed > 0:
            print(f"✅ {csv_file.name}: {fixed}件のIPAを追加")
        else:
            print(f"修正対象のエラーなし: {csv_file.name}")

    print(f"\n📊 合計: {total_fixed}件のIPAを追加しました")

if __name__ == '__main__':
    main()
