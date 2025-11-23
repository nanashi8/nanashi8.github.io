#!/usr/bin/env python3
"""
NEW HORIZON文法問題 自動修復スクリプト

バリデーションで検出された問題を自動修復します。

修復項目:
- hintフィールドの自動生成
- totalQuestionsの修正
- 語数不足の問題の警告

使用方法:
    python3 scripts/fix_grammar_questions.py
"""

import json
from pathlib import Path
from typing import Dict


def generate_hint(question: Dict) -> str:
    """
    文法問題に適したヒントを自動生成
    
    Args:
        question: 問題データ
        
    Returns:
        生成されたヒント文字列
    """
    grammar_point = question.get('grammarPoint', '')
    words = question.get('words', [])
    
    if not words:
        return "語順に注意"
    
    first_word = words[0]
    
    # 文法項目に基づいたヒント生成
    if 'be動詞' in grammar_point:
        if '疑問文' in grammar_point:
            return f"{first_word} → be動詞 → 主語 の順"
        elif '否定文' in grammar_point:
            return f"主語 → be動詞 → not の順"
        else:
            return f"{first_word} → be動詞 の順"
    
    elif '一般動詞' in grammar_point or '三人称' in grammar_point:
        if '疑問文' in grammar_point:
            return f"{first_word} → do/does → 主語 → 動詞 の順"
        elif '否定文' in grammar_point:
            return f"主語 → don't/doesn't → 動詞 の順"
        else:
            return f"{first_word} から始める"
    
    elif '過去' in grammar_point:
        if '進行形' in grammar_point:
            return "was/were + 動詞-ing の形"
        elif '疑問文' in grammar_point:
            return f"{first_word} → did → 主語 → 動詞 の順"
        elif '否定文' in grammar_point:
            return "主語 → didn't → 動詞 の順"
        else:
            return "動詞の過去形に注意"
    
    elif '現在進行形' in grammar_point:
        return "be動詞 + 動詞-ing の形"
    
    elif '未来' in grammar_point:
        if 'be going to' in grammar_point:
            return "be going to + 動詞 の形"
        else:
            return "will + 動詞 の形"
    
    elif '助動詞' in grammar_point or 'can' in grammar_point or 'must' in grammar_point or 'should' in grammar_point:
        return "助動詞 + 動詞の原形"
    
    elif '不定詞' in grammar_point:
        return "to + 動詞の原形 の位置に注意"
    
    elif '動名詞' in grammar_point:
        return "動詞-ing形 の位置に注意"
    
    elif '接続詞' in grammar_point:
        return f"{first_word} で文をつなぐ"
    
    elif '比較' in grammar_point:
        if '最上級' in grammar_point:
            return "the + 最上級 の形"
        else:
            return "比較級 + than の形"
    
    elif 'There is' in grammar_point or 'There are' in grammar_point:
        return "There is/are で始める"
    
    elif '受動態' in grammar_point:
        return "be動詞 + 過去分詞 の形"
    
    elif '現在完了' in grammar_point:
        return "have/has + 過去分詞 の形"
    
    elif '関係代名詞' in grammar_point:
        return "関係代名詞の位置に注意"
    
    elif '分詞' in grammar_point:
        return "分詞の修飾位置に注意"
    
    elif '間接疑問' in grammar_point:
        return "疑問詞 + 主語 + 動詞 の順"
    
    elif '仮定法' in grammar_point:
        return "If + 主語 + 過去形 の形"
    
    elif '命令文' in grammar_point:
        return f"{first_word} で始める（動詞の原形）"
    
    elif '疑問詞' in grammar_point or first_word in ['What', 'Who', 'When', 'Where', 'Why', 'How']:
        return f"{first_word} → 動詞 → 主語 の順"
    
    else:
        # デフォルトヒント
        return f"{first_word} から始める"


def fix_grammar_file(filepath: Path) -> bool:
    """
    文法問題JSONファイルの修復
    
    Args:
        filepath: 修復するJSONファイルのパス
        
    Returns:
        修復が成功したかどうか
    """
    
    print(f"\n{'='*80}")
    print(f"Fixing: {filepath.name}")
    print(f"{'='*80}\n")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    grade = data.get('grade')
    units = data.get('units', [])
    
    total_questions = 0
    fixes_applied = 0
    warnings = []
    
    for unit in units:
        unit_name = unit.get('unit', '')
        questions = unit.get('questions', [])
        
        for q_idx, q in enumerate(questions):
            total_questions += 1
            
            # hintフィールドの追加
            if 'hint' not in q or not q['hint']:
                hint = generate_hint(q)
                q['hint'] = hint
                fixes_applied += 1
                print(f"  ✓ {unit_name} Q{q_idx+1}: Added hint: '{hint}'")
            
            # 語数チェック（警告のみ）
            if 'words' in q:
                word_count = len(q['words'])
                if word_count < 3:
                    warnings.append(f"  ⚠️  {unit_name} Q{q_idx+1} ({q.get('id', 'no-id')}): Only {word_count} words (minimum 3 recommended)")
    
    # totalQuestionsの修正
    if data.get('totalQuestions') != total_questions:
        old_total = data.get('totalQuestions')
        data['totalQuestions'] = total_questions
        fixes_applied += 1
        print(f"\n  ✓ Fixed totalQuestions: {old_total} → {total_questions}")
    
    # ファイルに書き戻し
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*80}")
    print(f"Summary for {filepath.name}:")
    print(f"{'='*80}")
    print(f"  Total Questions: {total_questions}")
    print(f"  Fixes Applied: {fixes_applied}")
    print(f"  Warnings: {len(warnings)}")
    
    if warnings:
        print(f"\n  Warnings:")
        for warning in warnings:
            print(warning)
    
    print(f"\n{'='*80}")
    print(f"✅ Fixed {filepath.name}")
    print(f"{'='*80}")
    
    return True


def main():
    """メイン処理"""
    
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'public' / 'data'
    
    files = [
        data_dir / 'sentence-ordering-grade1.json',
        data_dir / 'sentence-ordering-grade2.json',
        data_dir / 'sentence-ordering-grade3.json',
    ]
    
    print("\n" + "="*80)
    print("NEW HORIZON Grammar Questions - Auto-Fix Utility")
    print("="*80)
    
    all_fixed = True
    
    for filepath in files:
        if filepath.exists():
            if not fix_grammar_file(filepath):
                all_fixed = False
        else:
            print(f"\n⚠️  File not found: {filepath}")
            all_fixed = False
    
    print("\n" + "="*80)
    if all_fixed:
        print("✅ ALL FILES FIXED SUCCESSFULLY")
        print("\nNext step: Run validation script to verify fixes:")
        print("  python3 scripts/validate_grammar_questions.py")
    else:
        print("❌ SOME FILES COULD NOT BE FIXED")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
