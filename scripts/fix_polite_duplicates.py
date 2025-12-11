#!/usr/bin/env python3
"""
丁寧語の重複や誤りを修正するスクリプト
"""

import json
import re
from pathlib import Path


def fix_polite_duplicates(text: str) -> str:
    """
    丁寧語の重複や誤りを修正する
    """
    if not text:
        return text
    
    result = text
    
    # 修正パターン
    fixes = [
        # 重複した「です」を修正
        (r'ですです', r'です'),
        (r'ですます', r'です'),
        (r'ますます', r'ます'),
        
        # 「にはamです」→「にはamを使います」
        (r'にはam([。、×])', r'にはamを使います\1'),
        (r'にはis([。、×])', r'にはisを使います\1'),
        (r'にはare([。、×])', r'にはareを使います\1'),
        (r'にはdo([。、×])', r'にはdoを使います\1'),
        (r'にはdoes([。、×])', r'にはdoesを使います\1'),
        (r'にはdid([。、×])', r'にはdidを使います\1'),
        (r'にはcan([。、×])', r'にはcanを使います\1'),
        (r'にはmust([。、×])', r'にはmustを使います\1'),
        (r'にはwill([。、×])', r'にはwillを使います\1'),
        (r'にはwas([。、×])', r'にはwasを使います\1'),
        (r'にはwere([。、×])', r'にはwereを使います\1'),
        
        # その他の改善
        (r'。。', r'。'),
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
                    fixed = fix_polite_duplicates(original)
                    
                    if original != fixed:
                        problem['explanation'] = fixed
                        changed = True
        
        # 変更があった場合のみファイルを保存
        if changed:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
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
    
    # 各ファイルを処理
    changed_count = 0
    for file_path in grammar_files:
        if process_grammar_file(file_path):
            changed_count += 1
            print(f"✓ 更新: {file_path.name}")
    
    print(f"\n完了: {changed_count}/{len(grammar_files)} ファイルを修正しました")


if __name__ == '__main__':
    main()
