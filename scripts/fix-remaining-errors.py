#!/usr/bin/env python3
"""
残存エラー手動修正スクリプト

eng_to_ipaが認識できなかった単語のIPAを手動で正しい値に修正する。
"""

import csv
from pathlib import Path
from typing import Dict, List

# 修正マッピング（単語 → 正しいIPA発音）
IPA_CORRECTIONS = {
    'affection​ate': 'əˈfɛkʃənət',  # affectionate のタイポ
    'controvert': 'ˌkɑntrəˈvɜrt',
    'copse': 'kɑps',
    'corpulent': 'ˈkɔrpjələnt',
    'P.E.': 'piː iː',
    'p.m.': 'piː ɛm',
    'toothache': 'ˈtuθˌeɪk',
}

# カタカナ修正マッピング
KATAKANA_CORRECTIONS = {
    ('P.E.', 'piː iː'): 'ピ́ー ア́イ',
    ('p.m.', 'P.M.'): 'ピ́ー エ́ム',
    ('TV', 'テレビ'): 'ティ́ーヴィ́ー',
}


def fix_csv_file(file_path: Path) -> int:
    """CSVファイルのエラーを修正"""
    print(f"\n📁 処理中: {file_path.name}")
    
    rows = []
    modified_count = 0
    
    # ファイル読み込み
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row_num, row in enumerate(reader, start=2):
            # 日本語ヘッダー対応
            word = row.get('word', row.get('語句', '')).strip()
            reading = row.get('reading', row.get('読み', '')).strip()
            reading_field = '読み' if '読み' in row else 'reading'
            
            original_reading = reading
            
            # 1. アスタリスク付きIPAの修正
            if '*' in reading or '\u200b' in reading:
                # ゼロ幅スペースを除去
                clean_word = word.replace('\u200b', '')
                
                if clean_word in IPA_CORRECTIONS:
                    # 括弧内のカタカナを抽出
                    import re
                    match = re.search(r'\(([^)]+)\)$', reading)
                    if match:
                        katakana = match.group(1)
                        new_ipa = IPA_CORRECTIONS[clean_word]
                        new_reading = f"{new_ipa} ({katakana})"
                        row[reading_field] = new_reading
                        modified_count += 1
                        print(f"  ✅ 行{row_num}: {word}")
                        print(f"      {reading} → {new_reading}")
            
            # 2. カタカナ英語混入の修正
            elif (word, reading.split('(')[1].rstrip(')') if '(' in reading else '') in KATAKANA_CORRECTIONS or \
                 (word, reading) in [(k[0], k[1]) for k in KATAKANA_CORRECTIONS.keys()]:
                # P.E., p.m., TV の修正
                import re
                if word == 'P.E.' and 'piː iː' in reading:
                    new_katakana = 'ピ́ー ア́イ'
                    new_reading = f"piː iː ({new_katakana})"
                    row[reading_field] = new_reading
                    modified_count += 1
                    print(f"  ✅ 行{row_num}: {word}")
                    print(f"      {reading} → {new_reading}")
                
                elif word == 'p.m.' and 'P.M.' in reading:
                    new_katakana = 'ピ́ー エ́ム'
                    new_reading = f"piː ɛm ({new_katakana})"
                    row[reading_field] = new_reading
                    modified_count += 1
                    print(f"  ✅ 行{row_num}: {word}")
                    print(f"      {reading} → {new_reading}")
                
                elif word == 'TV':
                    # TVの場合、IPAを追加
                    match = re.search(r'\(([^)]+)\)$', reading)
                    if match:
                        # 既にIPA形式
                        katakana = match.group(1)
                        if 'テレビ' in katakana:
                            new_katakana = 'ティ́ーヴィ́ー'
                            ipa_part = reading.split('(')[0].strip()
                            new_reading = f"{ipa_part} ({new_katakana})"
                            row[reading_field] = new_reading
                            modified_count += 1
                            print(f"  ✅ 行{row_num}: {word}")
                            print(f"      {reading} → {new_reading}")
                    else:
                        # カタカナのみ
                        if reading == 'テレビ':
                            new_reading = "tiː viː (ティ́ーヴィ́ー)"
                            row[reading_field] = new_reading
                            modified_count += 1
                            print(f"  ✅ 行{row_num}: {word}")
                            print(f"      {reading} → {new_reading}")
            
            rows.append(row)
    
    # ファイル書き込み（変更があった場合のみ）
    if modified_count > 0:
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f"  💾 {modified_count}件を修正しました")
    else:
        print(f"  ⏭️  変更なし")
    
    return modified_count


def main():
    """メイン処理"""
    print("🚀 残存エラー手動修正スクリプト")
    print("="*60)
    
    vocab_dir = Path("public/data/vocabulary")
    csv_files = sorted(vocab_dir.glob("*.csv"))
    
    total_modified = 0
    for csv_file in csv_files:
        modified = fix_csv_file(csv_file)
        total_modified += modified
    
    print("\n" + "="*60)
    print(f"📊 合計修正: {total_modified}件")
    print("="*60)
    print("\n✅ 完了")


if __name__ == "__main__":
    main()
