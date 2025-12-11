#!/usr/bin/env python3
"""
関係代名詞の意味を修正するスクリプト
who, whom, which, that の meaning フィールドを正しい訳に更新
"""

import json
import os
from pathlib import Path

# 修正する関係代名詞の辞書
PRONOUN_MEANINGS = {
    'who': '(関係代名詞)その人は',
    'whom': '(関係代名詞)その人を',
    'which': '(関係代名詞)その物等は・を',
    'that': '(関係代名詞)その人・物等は・を',
}

def fix_relative_pronouns_in_file(filepath: Path) -> tuple[int, int]:
    """
    1つのJSONファイル内の関係代名詞の意味を修正
    
    Returns:
        (変更した単語数, 処理したフレーズ数)
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    changed_count = 0
    phrase_count = 0
    
    # phrases 配列を直接処理（passagesではなく）
    if 'phrases' in data:
        for phrase in data['phrases']:
            phrase_count += 1
            if 'segments' in phrase:
                for segment in phrase['segments']:
                    word = segment.get('word', '').lower()
                    if word in PRONOUN_MEANINGS:
                        old_meaning = segment.get('meaning', '')
                        new_meaning = PRONOUN_MEANINGS[word]
                        if old_meaning != new_meaning:
                            segment['meaning'] = new_meaning
                            changed_count += 1
                            print(f"  {filepath.name}: '{segment.get('word')}' の意味を '{old_meaning}' → '{new_meaning}' に変更")
    
    # 変更があった場合のみファイルを書き込み
    if changed_count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    return changed_count, phrase_count

def main():
    # passages-phrase-learning ディレクトリ内のすべてのJSONファイルを処理
    base_dir = Path(__file__).parent.parent / 'public' / 'data' / 'passages-phrase-learning'
    
    if not base_dir.exists():
        print(f"エラー: ディレクトリが見つかりません: {base_dir}")
        return
    
    json_files = list(base_dir.glob('*.json'))
    
    if not json_files:
        print(f"エラー: JSONファイルが見つかりません: {base_dir}")
        return
    
    print(f"{len(json_files)} 個のJSONファイルを処理します...\n")
    
    total_changed = 0
    total_phrases = 0
    files_modified = 0
    
    for json_file in sorted(json_files):
        changed, phrases = fix_relative_pronouns_in_file(json_file)
        total_changed += changed
        total_phrases += phrases
        if changed > 0:
            files_modified += 1
    
    print(f"\n処理完了:")
    print(f"  処理したファイル数: {len(json_files)}")
    print(f"  変更したファイル数: {files_modified}")
    print(f"  処理したフレーズ数: {total_phrases}")
    print(f"  変更した単語数: {total_changed}")

if __name__ == '__main__':
    main()
