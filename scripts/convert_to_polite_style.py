#!/usr/bin/env python3
"""
文法問題の解説を丁寧語に変換するスクリプト
"""

import json
import re
from pathlib import Path

def convert_to_polite(text):
    """解説文を丁寧語に変換"""
    if not text:
        return text
    
    result = text
    
    # パターン1: 「～を使う」→「～を使います」
    result = re.sub(r'([をに])使う([。、])', r'\1使います\2', result)
    
    # パターン2: 「～は誤り」→「～は誤りです」
    result = re.sub(r'は誤り([。、])', r'は誤りです\1', result)
    result = re.sub(r'は間違い([。、])', r'は間違いです\1', result)
    
    # パターン3: 「～を表す」→「～を表します」
    result = re.sub(r'を表す([。、])', r'を表します\1', result)
    
    # パターン4: 「～で決まる」→「～で決まります」「～によって決まる」→「～によって決まります」
    result = re.sub(r'で決まる', r'によって決まります', result)
    
    # パターン5: 「～がある」→「～があります」
    result = re.sub(r'がある([。、])', r'があります\1', result)
    
    # パターン6: 「～になる」→「～になります」
    result = re.sub(r'になる([。、])', r'になります\1', result)
    
    # パターン7: 体言止め「～パターン。」→「～パターンです。」
    result = re.sub(r'パターン。', r'パターンです。', result)
    result = re.sub(r'表現。', r'表現です。', result)
    result = re.sub(r'語順。', r'語順です。', result)
    result = re.sub(r'構文。', r'構文です。', result)
    result = re.sub(r'熟語。', r'熟語です。', result)
    
    # パターン8: 「～すること」→「～してください」
    result = re.sub(r'覚えること([。、])', r'覚えてください\1', result)
    result = re.sub(r'注意([。、])', r'注意してください\1', result)
    
    # パターン9: 「～も可」→「～も可能です」
    result = re.sub(r'も可。', r'も可能です。', result)
    result = re.sub(r'と短縮可能。', r'と短縮できます。', result)
    
    # パターン10: 「～を付ける」→「～を付けます」
    result = re.sub(r'を付ける([。、])', r'を付けます\1', result)
    result = re.sub(r'を取る([。、])', r'を取ります\1', result)
    
    # パターン11: 「～が入る」→「～が入ります」
    result = re.sub(r'が入る([。、])', r'が入ります\1', result)
    
    # パターン12: 「～で始める」→「～で始めます」
    result = re.sub(r'で始める([。、])', r'で始めます\1', result)
    result = re.sub(r'から始める([。、])', r'から始めます\1', result)
    
    # パターン13: 「～を尋ねる」→「～を尋ねます」
    result = re.sub(r'を尋ねる([。、])', r'を尋ねます\1', result)
    
    # パターン14: 「～を意味する」→「～を意味します」
    result = re.sub(r'を意味する([。、])', r'を意味します\1', result)
    
    # パターン15: 「で「～」」→「で「～」という意味です」
    result = re.sub(r'で「([^」]+)」([。、])', r'で「\1」という意味です\2', result)
    
    # パターン16: その他の動詞
    result = re.sub(r'でよく使う([。、])', r'でよく使います\1', result)
    result = re.sub(r'と言う([。、])', r'と言います\1', result)
    
    return result

def convert_file(file_path):
    """ファイル内のすべての解説を丁寧語に変換"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified = False
        count = 0
        
        if 'questions' in data:
            for question in data['questions']:
                if 'explanation' in question:
                    original = question['explanation']
                    converted = convert_to_polite(original)
                    
                    if original != converted:
                        question['explanation'] = converted
                        modified = True
                        count += 1
        
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')
            
            print(f"✅ {file_path.name}: {count}件修正")
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ エラー ({file_path.name}): {e}")
        return False

def main():
    grammar_dir = Path("public/data/grammar")
    
    if not grammar_dir.exists():
        print(f"❌ ディレクトリが見つかりません: {grammar_dir}")
        return
    
    json_files = sorted(grammar_dir.glob("grammar_*.json"))
    
    total_files = 0
    modified_files = 0
    
    print("🔄 解説文を丁寧語に変換中...\n")
    
    for json_file in json_files:
        if convert_file(json_file):
            modified_files += 1
        total_files += 1
    
    print(f"\n📊 完了: {modified_files}/{total_files}ファイルを修正しました")

if __name__ == "__main__":
    main()
