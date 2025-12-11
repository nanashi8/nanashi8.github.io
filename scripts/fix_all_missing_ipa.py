#!/usr/bin/env python3
"""
全てのIPA入力漏れをFree Dictionary APIで修正するスクリプト
カタカナのみ（例: ポ́ケット）または大文字始まり（例: Pocket）のエントリーにIPAを追加
"""

import csv
import re
import time
import urllib.request
import json
from pathlib import Path
from typing import Optional

def get_ipa_pronunciation(word: str) -> Optional[str]:
    """Free Dictionary APIからIPA発音を取得"""
    try:
        # フレーズや複合語の場合は最初の単語のみ
        first_word = word.split()[0].lower()
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{first_word}"
        
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())
            
            if data and len(data) > 0:
                phonetics = data[0].get('phonetics', [])
                for phonetic in phonetics:
                    if 'text' in phonetic and phonetic['text']:
                        ipa = phonetic['text']
                        # スラッシュを除去
                        ipa = ipa.strip('/')
                        return ipa
        return None
    except Exception as e:
        return None

def needs_ipa_fix(reading: str) -> bool:
    """IPAが必要かチェック（カタカナのみ or 大文字始まりの英語）"""
    if not reading or reading.strip() == '':
        return False
    
    reading = reading.strip()
    
    # パターン1: カタカナのみ（アクセント記号含む）例: ポ́ケット
    if re.match(r'^[ァ-ヴー́]+$', reading):
        return True
    
    # パターン2: 大文字始まりの英語のみ 例: Pocket, Amazing
    if re.match(r'^[A-Z][a-z]+$', reading):
        return True
    
    # パターン3: 複数の大文字単語（Title Case）例: Ice Cream, Arts And Crafts
    if re.match(r'^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$', reading):
        return True
    
    return False

def fix_csv_file(csv_path: Path) -> tuple[int, int]:
    """CSVファイル内のIPA漏れを修正"""
    rows = []
    fixed_count = 0
    failed_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        rows.append(header)
        
        for row in reader:
            if len(row) < 3:
                rows.append(row)
                continue
            
            word = row[0]
            reading = row[1]
            
            if needs_ipa_fix(reading):
                print(f"🔍 修正対象: {word} (現在: {reading})")
                
                # APIからIPA取得
                ipa = get_ipa_pronunciation(word)
                time.sleep(0.1)  # レート制限対策
                
                if ipa:
                    # 既存の読みがカタカナならそのまま使用、英語なら後で変換が必要
                    if re.match(r'^[ァ-ヴー́]+$', reading):
                        # カタカナのみの場合
                        new_reading = f"{ipa} ({reading})"
                    else:
                        # 英語の場合はそのまま（後で別スクリプトで変換）
                        new_reading = f"{ipa} ({reading})"
                    
                    row[1] = new_reading
                    fixed_count += 1
                    print(f"  ✅ 修正: {new_reading}")
                else:
                    failed_count += 1
                    print(f"  ❌ API失敗: {word}")
            
            rows.append(row)
    
    # ファイル保存
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    return fixed_count, failed_count

def main():
    base_dir = Path(__file__).parent.parent / 'public' / 'data' / 'vocabulary'
    
    files = [
        'high-school-entrance-words.csv',
        'high-school-entrance-phrases.csv',
        'high-school-intermediate-words.csv',
        'high-school-intermediate-phrases.csv'
    ]
    
    total_fixed = 0
    total_failed = 0
    
    for filename in files:
        filepath = base_dir / filename
        if not filepath.exists():
            print(f"⚠️  ファイル未検出: {filename}")
            continue
        
        print(f"\n{'='*60}")
        print(f"📁 処理中: {filename}")
        print(f"{'='*60}")
        
        fixed, failed = fix_csv_file(filepath)
        total_fixed += fixed
        total_failed += failed
        
        print(f"\n✅ {filename}: {fixed}件修正, {failed}件失敗")
    
    print(f"\n{'='*60}")
    print(f"🎉 全体完了: {total_fixed}件修正, {total_failed}件失敗")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
