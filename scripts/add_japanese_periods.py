#!/usr/bin/env python3
"""
文法問題の日本語訳の文末に句点「。」を追加するスクリプト
"""

import json
import sys
from pathlib import Path

def add_periods_to_japanese(data):
    """日本語訳の文末に。を追加"""
    modified = False
    
    if isinstance(data, dict):
        for key, value in data.items():
            if key == "japanese" and isinstance(value, str):
                # 既に。で終わっている場合はスキップ
                if not value.endswith("。"):
                    data[key] = value + "。"
                    modified = True
            elif isinstance(value, (dict, list)):
                if add_periods_to_japanese(value):
                    modified = True
    elif isinstance(data, list):
        for item in data:
            if add_periods_to_japanese(item):
                modified = True
    
    return modified

def main():
    grammar_dir = Path("public/data/grammar")
    
    if not grammar_dir.exists():
        print(f"❌ ディレクトリが見つかりません: {grammar_dir}")
        sys.exit(1)
    
    json_files = sorted(grammar_dir.glob("grammar_*.json"))
    
    if not json_files:
        print(f"❌ 文法ファイルが見つかりません: {grammar_dir}")
        sys.exit(1)
    
    total_files = 0
    modified_files = 0
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if add_periods_to_japanese(data):
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    f.write('\n')
                
                modified_files += 1
                print(f"✅ 修正: {json_file.name}")
            
            total_files += 1
            
        except Exception as e:
            print(f"❌ エラー ({json_file.name}): {e}")
            sys.exit(1)
    
    print(f"\n📊 完了: {modified_files}/{total_files}ファイルを修正しました")

if __name__ == "__main__":
    main()
