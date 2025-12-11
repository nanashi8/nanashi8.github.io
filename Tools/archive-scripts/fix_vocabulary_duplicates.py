#!/usr/bin/env python3
"""
語彙CSV重複修正スクリプト

使用方法:
    python3 scripts/fix_vocabulary_duplicates.py
    python3 scripts/fix_vocabulary_duplicates.py --file junior-high-entrance-words.csv
    python3 scripts/fix_vocabulary_duplicates.py --dry-run
"""

import csv
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple
import argparse

VOCAB_DIR = Path("nanashi8.github.io/public/data/vocabulary")

def find_duplicates(file_path: Path) -> Dict[str, List[int]]:
    """CSV内の語句重複を検出"""
    duplicates = defaultdict(list)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=1):
            word = row['語句'].strip().lower()
            duplicates[word].append(idx)
    
    # 重複のみ抽出
    return {word: rows for word, rows in duplicates.items() if len(rows) > 1}

def remove_duplicates(file_path: Path, dry_run: bool = False) -> Tuple[int, int]:
    """重複を削除して上書き保存"""
    seen = set()
    unique_rows = []
    duplicate_count = 0
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            word = row['語句'].strip().lower()
            if word in seen:
                duplicate_count += 1
                continue
            seen.add(word)
            unique_rows.append(row)
    
    if not dry_run:
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(unique_rows)
    
    return len(unique_rows), duplicate_count

def main():
    parser = argparse.ArgumentParser(description='語彙CSVの重複修正')
    parser.add_argument('--file', help='特定ファイルのみ処理 (例: junior-high-entrance-words.csv)')
    parser.add_argument('--dry-run', action='store_true', help='実際には修正せず、プレビューのみ')
    args = parser.parse_args()
    
    if args.file:
        files = [VOCAB_DIR / args.file]
    else:
        files = [
            VOCAB_DIR / "junior-high-entrance-words.csv",
            VOCAB_DIR / "intermediate-1800-words.csv"
        ]
    
    print("🔧 語彙重複修正スクリプト")
    print("=" * 60)
    
    total_removed = 0
    
    for file_path in files:
        if not file_path.exists():
            print(f"⚠️ ファイルが見つかりません: {file_path}")
            continue
        
        print(f"\n📄 処理中: {file_path.name}")
        
        # 重複検出
        duplicates = find_duplicates(file_path)
        if not duplicates:
            print(f"  ✅ 重複なし")
            continue
        
        print(f"  ⚠️ 重複検出: {len(duplicates)}語")
        
        # 最初の3件を表示
        for i, (word, rows) in enumerate(list(duplicates.items())[:3]):
            print(f"    - '{word}': 行{', '.join(map(str, rows))}")
        
        if len(duplicates) > 3:
            print(f"    ... 他 {len(duplicates) - 3} 件")
        
        # 重複削除
        unique_count, removed = remove_duplicates(file_path, args.dry_run)
        total_removed += removed
        
        if args.dry_run:
            print(f"  🔍 [dry-run] 削除予定: {removed}件 (残り: {unique_count}件)")
        else:
            print(f"  ✅ 削除完了: {removed}件 (残り: {unique_count}件)")
    
    print("\n" + "=" * 60)
    if args.dry_run:
        print(f"🔍 [dry-run] 削除予定合計: {total_removed}件")
        print("\n実際に修正する場合は --dry-run を外して再実行してください。")
    else:
        print(f"✅ 修正完了: {total_removed}件の重複を削除")
        print("\n再検証してください:")
        print("  python3 scripts/validate_all_content.py")
    
    return 0 if total_removed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
