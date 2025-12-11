#!/usr/bin/env python3
"""
A.M. / P.M. 略語の意味を修正するスクリプト

問題:
- JSONファイルで A.M. が "a", ".", "m", "." の4セグメントに分割されている
- "a" の meaning が「一つの」になっている（誤り）
- "m" の meaning が「メートル」になっている（誤り）

正しい意味:
- A.M. = ante meridiem (ラテン語: 正午の前) = 午前
- P.M. = post meridiem (ラテン語: 正午の後) = 午後

修正方針:
- A.M./P.M.の構成要素セグメント("a", "m", "p")の meaning を空文字列または
  「A.M.の一部」のような説明に変更
"""

import json
import sys
from pathlib import Path
from typing import Dict, List

def fix_am_pm_segments(data: Dict) -> tuple[Dict, int]:
    """A.M./P.M.のセグメントを修正"""
    modifications = 0
    
    if 'phrases' not in data:
        return data, modifications
    
    for phrase in data['phrases']:
        if 'segments' not in phrase:
            continue
        
        segments = phrase['segments']
        i = 0
        while i < len(segments):
            # A.M. パターンをチェック (a . m .)
            if i + 3 < len(segments):
                seg1 = segments[i]
                seg2 = segments[i + 1]
                seg3 = segments[i + 2]
                seg4 = segments[i + 3]
                
                # a . m . のパターン
                if (seg1.get('word', '').lower() == 'a' and 
                    seg2.get('word') == '.' and
                    seg3.get('word', '').lower() == 'm' and 
                    seg4.get('word') == '.'):
                    
                    # "a" の意味を修正
                    if seg1.get('meaning') == '一つの':
                        seg1['meaning'] = ''
                        seg1['reading'] = ''
                        seg1['etymology'] = 'A.M.（午前）の一部。ante meridiem（ラテン語：正午の前）'
                        seg1['relatedWords'] = 'A.M.(エーエム): 午前, P.M.(ピーエム): 午後'
                        modifications += 1
                    
                    # "m" の意味を修正  
                    if seg3.get('meaning') == 'メートル（長さの単位）':
                        seg3['meaning'] = ''
                        seg3['reading'] = ''
                        seg3['etymology'] = 'A.M.（午前）の一部。ante meridiem（ラテン語：正午の前）'
                        seg3['relatedWords'] = 'A.M.(エーエム): 午前, P.M.(ピーエム): 午後'
                        modifications += 1
                
                # p . m . のパターン
                if (seg1.get('word', '').lower() == 'p' and 
                    seg2.get('word') == '.' and
                    seg3.get('word', '').lower() == 'm' and 
                    seg4.get('word') == '.'):
                    
                    # "p" の意味を修正
                    if 'meaning' in seg1:
                        seg1['meaning'] = ''
                        seg1['reading'] = ''
                        seg1['etymology'] = 'P.M.（午後）の一部。post meridiem（ラテン語：正午の後）'
                        seg1['relatedWords'] = 'A.M.(エーエム): 午前, P.M.(ピーエム): 午後'
                        modifications += 1
                    
                    # "m" の意味を修正
                    if seg3.get('meaning') == 'メートル（長さの単位）':
                        seg3['meaning'] = ''
                        seg3['reading'] = ''
                        seg3['etymology'] = 'P.M.（午後）の一部。post meridiem（ラテン語：正午の後）'
                        seg3['relatedWords'] = 'A.M.(エーエム): 午前, P.M.(ピーエム): 午後'
                        modifications += 1
            
            i += 1
    
    return data, modifications

def process_file(file_path: Path) -> int:
    """JSONファイルを処理"""
    print(f"処理中: {file_path.name}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified_data, modifications = fix_am_pm_segments(data)
        
        if modifications > 0:
            # バックアップ作成
            backup_path = file_path.with_suffix('.json.bak')
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  バックアップ作成: {backup_path.name}")
            
            # 修正版を保存
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(modified_data, f, ensure_ascii=False, indent=2)
            print(f"  ✓ {modifications}箇所を修正しました")
            return modifications
        else:
            print(f"  修正箇所なし")
            return 0
            
    except Exception as e:
        print(f"  ✗ エラー: {e}")
        return 0

def main():
    """メイン処理"""
    base_dir = Path(__file__).parent.parent / "public" / "data" / "passages-phrase-learning"
    
    if not base_dir.exists():
        print(f"エラー: ディレクトリが見つかりません: {base_dir}")
        sys.exit(1)
    
    json_files = list(base_dir.glob("*.json"))
    
    if not json_files:
        print(f"エラー: JSONファイルが見つかりません: {base_dir}")
        sys.exit(1)
    
    print(f"\n{len(json_files)}個のJSONファイルを処理します...\n")
    
    total_modifications = 0
    for json_file in sorted(json_files):
        mods = process_file(json_file)
        total_modifications += mods
    
    print(f"\n完了: 合計{total_modifications}箇所を修正しました")

if __name__ == "__main__":
    main()
