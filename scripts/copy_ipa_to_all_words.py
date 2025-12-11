#!/usr/bin/env python3
"""
intermediate-1800-words.csv と junior-high-entrance-words.csv から
all-words.csv にIPAをコピーする高速スクリプト
"""

import csv
from pathlib import Path
from typing import Dict

def load_ipa_mappings() -> Dict[str, str]:
    """既存ファイルからIPAマッピングを読み込み"""
    base_dir = Path(__file__).parent.parent / 'public' / 'data' / 'vocabulary'
    
    ipa_map = {}
    
    source_files = [
        'intermediate-1800-words.csv',
        'junior-high-entrance-words.csv',
        'junior-high-entrance-phrases.csv'
    ]
    
    for filename in source_files:
        filepath = base_dir / filename
        if not filepath.exists():
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # ヘッダーをスキップ
            
            for row in reader:
                if len(row) < 2:
                    continue
                
                word = row[0].strip()
                reading = row[1].strip()
                
                # IPAが含まれている場合のみマッピングに追加
                if reading and any(c in reading for c in 'ˈəɑæɔɪʊɛʃŋɹ'):
                    ipa_map[word] = reading
    
    print(f"✅ {len(ipa_map)}件のIPAマッピングを読み込みました")
    return ipa_map

def update_all_words(ipa_map: Dict[str, str]) -> tuple[int, int]:
    """all-words.csvを更新"""
    base_dir = Path(__file__).parent.parent / 'public' / 'data' / 'vocabulary'
    filepath = base_dir / 'all-words.csv'
    
    rows = []
    updated = 0
    not_found = 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        rows.append(header)
        
        for row in reader:
            if len(row) < 2:
                rows.append(row)
                continue
            
            word = row[0].strip()
            current_reading = row[1].strip()
            
            # IPAがない、またはカタカナのみの場合
            needs_update = not any(c in current_reading for c in 'ˈəɑæɔɪʊɛʃŋɹ')
            
            if needs_update and word in ipa_map:
                row[1] = ipa_map[word]
                updated += 1
                if updated % 100 == 0:
                    print(f"  処理中: {updated}件更新...")
            elif needs_update:
                not_found += 1
            
            rows.append(row)
    
    # 保存
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    return updated, not_found

def main():
    print("="*60)
    print("📁 all-words.csv IPA高速コピー開始")
    print("="*60)
    
    # ステップ1: IPAマッピング読み込み
    ipa_map = load_ipa_mappings()
    
    # ステップ2: all-words.csv更新
    print(f"\n📝 all-words.csv を更新中...")
    updated, not_found = update_all_words(ipa_map)
    
    print(f"\n{'='*60}")
    print(f"🎉 完了!")
    print(f"✅ 更新: {updated}件")
    print(f"⚠️  未発見: {not_found}件")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
