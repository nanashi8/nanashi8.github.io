#!/usr/bin/env python3
"""
文法問題の解説を丁寧語に変換するスクリプト
先生が生徒に教える文体に変更
"""

import json
import re
from pathlib import Path

def convert_to_polite(text):
    """解説文を丁寧語に変換"""
    if not text:
        return text
    
    # 既に丁寧語の場合はスキップ
    if text.endswith('ます。') or text.endswith('ください。') or text.endswith('ましょう。'):
        return text
    
    # 変換ルール
    conversions = [
        # 基本パターン
        (r'。([^。]+)を使う。', r'。\1を使います。'),
        (r'([^。]+)を使う。', r'\1を使います。'),
        (r'。([^。]+)になる。', r'。\1になります。'),
        (r'([^。]+)になる。', r'\1になります。'),
        (r'。([^。]+)である。', r'。\1です。'),
        (r'([^。]+)である。', r'\1です。'),
        
        # 「～は～」パターン
        (r'([^。]+)は([^。]+)。', lambda m: f"{m.group(1)}は{convert_predicate(m.group(2))}。"),
        
        # 「×～」否定パターン
        (r'×([^。]+)は誤り', r'×\1は誤りです'),
        (r'×([^。]+)は間違い', r'×\1は間違いです'),
        (r'×([^。]+)は不可', r'×\1は使えません'),
        
        # 「～を～」パターン
        (r'([^。]+)を取る', r'\1を取ります'),
        (r'([^。]+)を付ける', r'\1を付けます'),
        (r'([^。]+)を付け', r'\1を付け'),
        (r'([^。]+)を表す', r'\1を表します'),
        (r'([^。]+)を意味する', r'\1を意味します'),
        
        # 命令形を丁寧に
        (r'注意', r'注意してください'),
        (r'確認', r'確認してください'),
    ]
    
    result = text
    for pattern, replacement in conversions:
        if callable(replacement):
            result = re.sub(pattern, replacement, result)
        else:
            result = re.sub(pattern, replacement, result)
    
    return result

def convert_predicate(pred):
    """述語部分を丁寧語に変換"""
    # 既に丁寧語
    if pred.endswith('ます') or pred.endswith('です'):
        return pred
    
    # 名詞述語
    if not any(c in pred for c in ['る', 'う', 'く', 'す', 'つ', 'ぬ', 'ぶ', 'む']):
        if not pred.endswith('です'):
            return pred + 'です'
    
    # 動詞
    pred = re.sub(r'使う$', '使います', pred)
    pred = re.sub(r'する$', 'します', pred)
    pred = re.sub(r'なる$', 'なります', pred)
    pred = re.sub(r'ある$', 'あります', pred)
    pred = re.sub(r'取る$', '取ります', pred)
    pred = re.sub(r'付ける$', '付けます', pred)
    pred = re.sub(r'表す$', '表します', pred)
    pred = re.sub(r'決まる$', '決まります', pred)
    pred = re.sub(r'必要$', '必要です', pred)
    pred = re.sub(r'重要$', '重要です', pred)
    
    return pred

def process_explanation(explanation):
    """解説文全体を処理"""
    # 文を分割
    sentences = explanation.split('。')
    polite_sentences = []
    
    for sentence in sentences:
        if not sentence.strip():
            continue
        
        # 各文を変換
        polite = sentence
        
        # 基本的な変換
        polite = re.sub(r'主語([^は]+)には?([^。]+)$', r'主語\1には\2を使います', polite)
        polite = re.sub(r'([^。]+)の後[ろ]?は([^。]+)$', r'\1の後ろは\2です', polite)
        polite = re.sub(r'([^。]+)で「([^」]+)」$', r'\1で「\2」という意味です', polite)
        polite = re.sub(r'be動詞は主語で決まる', r'be動詞は主語によって決まります', polite)
        
        # 「～用」パターン
        polite = re.sub(r'は([^。]+)用$', r'は\1用です', polite)
        
        polite_sentences.append(polite)
    
    return '。'.join(polite_sentences) + '。'

def convert_file(file_path):
    """ファイル内のすべての解説を丁寧語に変換"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified = False
        
        if 'questions' in data:
            for question in data['questions']:
                if 'explanation' in question:
                    original = question['explanation']
                    converted = process_explanation(original)
                    
                    if original != converted:
                        question['explanation'] = converted
                        modified = True
        
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')
            
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
    
    for json_file in json_files:
        if convert_file(json_file):
            modified_files += 1
            print(f"✅ 修正: {json_file.name}")
        total_files += 1
    
    print(f"\n📊 完了: {modified_files}/{total_files}ファイルを修正しました")

if __name__ == "__main__":
    main()
