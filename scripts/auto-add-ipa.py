#!/usr/bin/env python3
"""
IPA発音自動追加スクリプト

カタカナのみの読みフィールドに、IPAを追加して「IPA (カタカナ)」形式に変換する。
IPA発音は eng_to_ipa ライブラリを使用して自動取得。

使用例:
  python3 scripts/auto-add-ipa.py
"""

import csv
import re
from pathlib import Path
from typing import Dict, List, Tuple
import sys

# eng_to_ipa ライブラリをインストール済みか確認
try:
    import eng_to_ipa as ipa_converter
    print("✅ eng_to_ipa ライブラリが利用可能です")
except ImportError:
    print("❌ eng_to_ipa ライブラリが必要です")
    print("インストール: pip3 install eng-to-ipa")
    sys.exit(1)


class IPAAdder:
    """IPA発音を自動追加するクラス"""
    
    def __init__(self):
        self.stats = {
            'processed': 0,
            'added': 0,
            'skipped': 0,
            'errors': 0
        }
    
    def get_ipa_pronunciation(self, word: str) -> str:
        """英単語からIPA発音を取得"""
        try:
            # eng_to_ipa で変換
            ipa_result = ipa_converter.convert(word)
            
            # アクセント記号を調整（必要に応じて）
            # eng_to_ipaは標準的なIPA記号を返すので、そのまま使用
            return ipa_result.strip()
        except Exception as e:
            print(f"  ⚠️  IPA変換エラー ({word}): {e}")
            return ""
    
    def process_csv_file(self, file_path: Path) -> int:
        """CSVファイルを処理してIPA発音を追加"""
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
                
                # 括弧がない場合（カタカナのみ）→ IPA追加
                if reading and '(' not in reading:
                    # IPA取得
                    ipa = self.get_ipa_pronunciation(word)
                    
                    if ipa:
                        # 「IPA (カタカナ)」形式に変換
                        new_reading = f"{ipa} ({reading})"
                        # 日本語ヘッダー対応
                        if '読み' in row:
                            row['読み'] = new_reading
                        else:
                            row['reading'] = new_reading
                        modified_count += 1
                        self.stats['added'] += 1
                        print(f"  ✅ 行{row_num}: {word}")
                        print(f"      {reading} → {new_reading}")
                    else:
                        # IPA取得失敗
                        self.stats['errors'] += 1
                        print(f"  ❌ 行{row_num}: {word} - IPA取得失敗")
                else:
                    # すでにIPAあり、またはreadingなし
                    self.stats['skipped'] += 1
                
                rows.append(row)
                self.stats['processed'] += 1
        
        # ファイル書き込み（変更があった場合のみ）
        if modified_count > 0:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            print(f"  💾 {modified_count}件のIPAを追加しました")
        else:
            print(f"  ⏭️  変更なし")
        
        return modified_count
    
    def process_all_files(self):
        """全CSVファイルを処理"""
        vocab_dir = Path("public/data/vocabulary")
        csv_files = sorted(vocab_dir.glob("*.csv"))
        
        print(f"🔍 対象ファイル: {len(csv_files)}件")
        
        total_modified = 0
        for csv_file in csv_files:
            modified = self.process_csv_file(csv_file)
            total_modified += modified
        
        # 統計表示
        print("\n" + "="*60)
        print("📊 処理結果:")
        print(f"  処理済み: {self.stats['processed']}件")
        print(f"  IPA追加: {self.stats['added']}件")
        print(f"  スキップ: {self.stats['skipped']}件")
        print(f"  エラー: {self.stats['errors']}件")
        print("="*60)


def main():
    """メイン処理"""
    print("🚀 IPA発音自動追加スクリプト")
    print("="*60)
    
    adder = IPAAdder()
    adder.process_all_files()
    
    print("\n✅ 完了")


if __name__ == "__main__":
    main()
