#!/usr/bin/env python3
"""
検証エラーを自動修正するスクリプト
"""

import json
import re
from pathlib import Path

def fix_infinitive_pattern(file_path: Path):
    """不定詞問題の修正"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    questions = data.get('questions', [])
    
    for q in questions:
        if 'sentence' in q and 'correctAnswer' in q:
            sentence = q['sentence']
            
            # "To ___" パターンで始まる場合
            if re.match(r'^To\s+_{2,}', sentence):
                # 正解から"to "を削除
                if q['correctAnswer'].lower().startswith('to '):
                    old_answer = q['correctAnswer']
                    q['correctAnswer'] = q['correctAnswer'][3:]  # "to "を削除
                    print(f"✓ [{q['id']}] 正解を修正: '{old_answer}' → '{q['correctAnswer']}'")
                    modified = True
                
                # 選択肢から"to "を削除
                if 'choices' in q:
                    new_choices = []
                    for choice in q['choices']:
                        if choice.lower().startswith('to '):
                            new_choice = choice[3:]
                            print(f"✓ [{q['id']}] 選択肢を修正: '{choice}' → '{new_choice}'")
                            new_choices.append(new_choice)
                            modified = True
                        else:
                            new_choices.append(choice)
                    q['choices'] = new_choices
        
        # "To to"パターンの修正
        if 'sentence' in q:
            if re.search(r'\bTo\s+to\b', q['sentence']):
                old_sentence = q['sentence']
                q['sentence'] = re.sub(r'\bTo\s+to\b', 'To', q['sentence'], flags=re.IGNORECASE)
                print(f"✓ [{q['id']}] 文を修正: 'To to' → 'To'")
                modified = True
        
        if 'correctAnswer' in q:
            if re.search(r'\bTo\s+to\b', q['correctAnswer']):
                old_answer = q['correctAnswer']
                q['correctAnswer'] = re.sub(r'\bTo\s+to\b', 'To', q['correctAnswer'], flags=re.IGNORECASE)
                print(f"✓ [{q['id']}] 正解を修正: 'To to' → 'To'")
                modified = True
        
        if 'words' in q:
            # words配列から重複する"to"を削除
            words = q['words']
            if len(words) > 1 and words[0] == 'To' and words[1] == 'to':
                q['words'] = [words[0]] + words[2:]
                q['wordCount'] = len(q['words'])
                print(f"✓ [{q['id']}] words配列を修正: 重複toを削除")
                modified = True
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ {file_path.name} を保存しました\n")
        return True
    return False

def fix_japanese_grammar_terms(file_path: Path):
    """日本語訳の文法用語を修正"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    questions = data.get('questions', [])
    
    # 文法用語と適切な翻訳のマッピング
    translations = {
        'be動詞過去複数': 'その本は面白かったです',  # デフォルト例
        'be動詞過去単数': 'それは良かったです',
    }
    
    for q in questions:
        if 'japanese' in q:
            japanese = q['japanese']
            
            if re.match(r'^be動詞過去(複数|単数)', japanese):
                # 文から適切な翻訳を生成
                if 'sentence' in q:
                    sentence = q['sentence']
                    # 簡易的な翻訳(実際には手動で確認が必要)
                    print(f"⚠️  [{q['id']}] 日本語訳'{japanese}'を手動で修正してください")
                    print(f"    文: {sentence}")
                    modified = True
    
    return modified

def main():
    """メイン処理"""
    base_path = Path(__file__).parent.parent / 'public' / 'data' / 'grammar'
    
    # grammar_grade3_unit4.jsonを修正
    file_path = base_path / 'grammar_grade3_unit4.json'
    if file_path.exists():
        print(f"\n{'='*80}")
        print(f"修正中: {file_path.name}")
        print(f"{'='*80}\n")
        fix_infinitive_pattern(file_path)
    
    # grammar_grade2_unit0.jsonを修正
    file_path = base_path / 'grammar_grade2_unit0.json'
    if file_path.exists():
        print(f"\n{'='*80}")
        print(f"確認中: {file_path.name}")
        print(f"{'='*80}\n")
        fix_japanese_grammar_terms(file_path)
    
    print("\n" + "="*80)
    print("修正完了。python3 scripts/validate_grammar_advanced.py で再検証してください")
    print("="*80 + "\n")

if __name__ == '__main__':
    main()
