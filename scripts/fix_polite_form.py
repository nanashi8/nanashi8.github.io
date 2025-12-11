#!/usr/bin/env python3
"""
丁寧語変換の誤りを修正するスクリプト
"""

import json
import re
from pathlib import Path


def fix_polite_errors(text: str) -> str:
    """
    誤った丁寧語変換を修正する
    """
    if not text:
        return text
    
    result = text
    
    # 誤った変換パターンを修正
    fixes = [
        # 「となりまします」→「となります」
        (r'となりまします', r'となります'),
        # 「書き換えりまします」→「書き換えます」
        (r'書き換えりまします', r'書き換えます'),
        # 「覚えることです」→「覚えてください」(指示の場合)
        (r'を覚えることです', r'を覚えてください'),
        (r'覚えることです', r'覚えてください'),
        (r'構文として覚えてください', r'構文として覚えてください'),  # 既に正しい場合はそのまま
        # その他の誤変換
        (r'([あ-ん])りまします', r'\1ります'),
    ]
    
    for pattern, replacement in fixes:
        result = re.sub(pattern, replacement, result)
    
    return result


def process_grammar_file(file_path: Path) -> bool:
    """
    1つの文法ファイルを処理する
    
    Returns:
        bool: 変更があった場合True
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        changed = False
        
        # 各問題のexplanationフィールドを修正
        questions_key = 'questions' if 'questions' in data else 'problems' if 'problems' in data else None
        
        if questions_key:
            for problem in data[questions_key]:
                if 'explanation' in problem and problem['explanation']:
                    original = problem['explanation']
                    fixed = fix_polite_errors(original)
                    
                    if original != fixed:
                        problem['explanation'] = fixed
                        changed = True
                        print(f"\n修正 ({file_path.name}):")
                        print(f"  前: {original}")
                        print(f"  後: {fixed}")
        
        # 変更があった場合のみファイルを保存
        if changed:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✓ 更新: {file_path.name}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"✗ エラー ({file_path.name}): {e}")
        return False


def main():
    """メイン処理"""
    # 文法ファイルのディレクトリ
    grammar_dir = Path(__file__).parent.parent / 'public' / 'data' / 'grammar'
    
    if not grammar_dir.exists():
        print(f"エラー: ディレクトリが見つかりません: {grammar_dir}")
        return
    
    # すべての文法ファイルを取得
    grammar_files = sorted(grammar_dir.glob('grammar_*.json'))
    
    if not grammar_files:
        print("文法ファイルが見つかりません")
        return
    
    print(f"対象ファイル数: {len(grammar_files)}")
    print("=" * 60)
    
    # 各ファイルを処理
    changed_count = 0
    for file_path in grammar_files:
        if process_grammar_file(file_path):
            changed_count += 1
    
    print("=" * 60)
    print(f"\n完了: {changed_count}/{len(grammar_files)} ファイルを修正しました")


if __name__ == '__main__':
    main()
