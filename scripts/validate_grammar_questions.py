#!/usr/bin/env python3
"""
NEW HORIZON文法問題 バリデーションスクリプト

文並び替え問題（sentence-ordering-grade*.json）の品質チェックを実行します。

使用方法:
    python3 scripts/validate_grammar_questions.py
    
チェック項目:
- 必須フィールドの存在確認
- 語数の範囲チェック（3-11語推奨）
- wordCountフィールドの一致確認
- ID形式の検証
- 難易度タグの妥当性
- 総問題数の一致確認
- 語数分布の統計
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple


def validate_grammar_file(filepath: Path) -> Tuple[bool, Dict]:
    """
    文法問題JSONファイルのバリデーション
    
    Args:
        filepath: 検証するJSONファイルのパス
        
    Returns:
        (is_valid, stats): バリデーション結果と統計情報のタプル
    """
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    grade = data.get('grade')
    total = data.get('totalQuestions', 0)
    units = data.get('units', [])
    
    print(f"\n{'='*80}")
    print(f"Validating: {filepath.name}")
    print(f"Grade: {grade}, Total Questions: {total}")
    print(f"{'='*80}\n")
    
    errors = []
    warnings = []
    question_count = 0
    word_count_stats = {"3-5": 0, "6-8": 0, "9-11": 0, "12+": 0}
    difficulty_stats = {"beginner": 0, "intermediate": 0, "advanced": 0}
    
    for unit_idx, unit in enumerate(units):
        unit_name = unit.get('unit', f'Unit {unit_idx}')
        unit_title = unit.get('title', 'No title')
        questions = unit.get('questions', [])
        
        print(f"{unit_name}: {unit_title} ({len(questions)} questions)")
        
        for q_idx, q in enumerate(questions):
            question_count += 1
            
            # 必須フィールドチェック
            required_fields = ['id', 'japanese', 'words', 'difficulty', 'grammarPoint', 'wordCount', 'hint']
            for field in required_fields:
                if field not in q:
                    errors.append(f"  ❌ {unit_name} Q{q_idx+1}: Missing required field '{field}'")
            
            # 語数チェック
            if 'words' in q:
                actual_count = len(q['words'])
                
                # 語数分布
                if 3 <= actual_count <= 5:
                    word_count_stats["3-5"] += 1
                elif 6 <= actual_count <= 8:
                    word_count_stats["6-8"] += 1
                elif 9 <= actual_count <= 11:
                    word_count_stats["9-11"] += 1
                else:
                    word_count_stats["12+"] += 1
                
                # 語数範囲チェック
                if actual_count < 3:
                    errors.append(f"  ❌ {unit_name} Q{q_idx+1} ({q.get('id', 'no-id')}): Too few words ({actual_count}), minimum is 3")
                elif actual_count > 11:
                    warnings.append(f"  ⚠️  {unit_name} Q{q_idx+1} ({q.get('id', 'no-id')}): Too many words ({actual_count}), recommended max is 11")
                
                # wordCountフィールドとの一致チェック
                if 'wordCount' in q and q['wordCount'] != actual_count:
                    errors.append(f"  ❌ {unit_name} Q{q_idx+1} ({q.get('id', 'no-id')}): wordCount mismatch (declared: {q['wordCount']}, actual: {actual_count})")
            
            # ID形式チェック
            if 'id' in q:
                expected_prefix = f"g{grade}-u{unit_idx}-"
                if not q['id'].startswith(expected_prefix):
                    warnings.append(f"  ⚠️  {unit_name} Q{q_idx+1}: ID format '{q['id']}' doesn't match expected prefix '{expected_prefix}...'")
            
            # 難易度チェック
            if 'difficulty' in q:
                valid_difficulties = ['beginner', 'intermediate', 'advanced']
                if q['difficulty'] in valid_difficulties:
                    difficulty_stats[q['difficulty']] += 1
                else:
                    errors.append(f"  ❌ {unit_name} Q{q_idx+1} ({q.get('id', 'no-id')}): Invalid difficulty '{q['difficulty']}' (must be: {', '.join(valid_difficulties)})")
            
            # 日本語と英語の存在チェック
            if 'japanese' in q and not q['japanese'].strip():
                errors.append(f"  ❌ {unit_name} Q{q_idx+1} ({q.get('id', 'no-id')}): Japanese text is empty")
            
            if 'words' in q and len(q['words']) == 0:
                errors.append(f"  ❌ {unit_name} Q{q_idx+1} ({q.get('id', 'no-id')}): Words array is empty")
    
    # 総問題数チェック
    if question_count != total:
        errors.append(f"  ❌ Total questions mismatch: {question_count} actual vs {total} declared in 'totalQuestions'")
    
    # レポート出力
    print(f"\n{'='*80}")
    print("Word Count Distribution:")
    print(f"{'='*80}")
    if question_count > 0:
        print(f"  3-5 words:  {word_count_stats['3-5']:3d} ({word_count_stats['3-5']/question_count*100:5.1f}%)")
        print(f"  6-8 words:  {word_count_stats['6-8']:3d} ({word_count_stats['6-8']/question_count*100:5.1f}%)")
        print(f"  9-11 words: {word_count_stats['9-11']:3d} ({word_count_stats['9-11']/question_count*100:5.1f}%)")
        if word_count_stats['12+'] > 0:
            print(f"  12+ words:  {word_count_stats['12+']:3d} ({word_count_stats['12+']/question_count*100:5.1f}%) ⚠️  Should be minimized!")
    
    print(f"\n{'='*80}")
    print("Difficulty Distribution:")
    print(f"{'='*80}")
    if question_count > 0:
        for diff, count in difficulty_stats.items():
            if count > 0:
                print(f"  {diff:12s}: {count:3d} ({count/question_count*100:5.1f}%)")
    
    # 警告表示
    if warnings:
        print(f"\n{'='*80}")
        print(f"⚠️  Found {len(warnings)} warning(s):")
        print(f"{'='*80}")
        for warning in warnings:
            print(warning)
    
    # エラーレポート
    if errors:
        print(f"\n{'='*80}")
        print(f"❌ Found {len(errors)} error(s):")
        print(f"{'='*80}")
        for error in errors:
            print(error)
        print(f"\n{'='*80}")
        print(f"❌ VALIDATION FAILED for {filepath.name}")
        print(f"{'='*80}")
        return False, {
            'question_count': question_count,
            'word_count_stats': word_count_stats,
            'difficulty_stats': difficulty_stats,
            'errors': len(errors),
            'warnings': len(warnings)
        }
    else:
        print(f"\n{'='*80}")
        print(f"✅ All checks passed for {filepath.name}!")
        print(f"{'='*80}")
        return True, {
            'question_count': question_count,
            'word_count_stats': word_count_stats,
            'difficulty_stats': difficulty_stats,
            'errors': 0,
            'warnings': len(warnings)
        }


def main():
    """メイン処理"""
    
    # スクリプトからの相対パスでデータディレクトリを特定
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'public' / 'data'
    
    files = [
        data_dir / 'sentence-ordering-grade1.json',
        data_dir / 'sentence-ordering-grade2.json',
        data_dir / 'sentence-ordering-grade3.json',
    ]
    
    print("\n" + "="*80)
    print("NEW HORIZON Grammar Questions - Validation Report")
    print("="*80)
    
    all_valid = True
    total_stats = {
        'total_questions': 0,
        'total_errors': 0,
        'total_warnings': 0,
        'word_count_stats': {"3-5": 0, "6-8": 0, "9-11": 0, "12+": 0},
        'difficulty_stats': {"beginner": 0, "intermediate": 0, "advanced": 0}
    }
    
    for filepath in files:
        if filepath.exists():
            is_valid, stats = validate_grammar_file(filepath)
            
            if not is_valid:
                all_valid = False
            
            # 統計集計
            total_stats['total_questions'] += stats['question_count']
            total_stats['total_errors'] += stats['errors']
            total_stats['total_warnings'] += stats['warnings']
            
            for key in total_stats['word_count_stats']:
                total_stats['word_count_stats'][key] += stats['word_count_stats'][key]
            
            for key in total_stats['difficulty_stats']:
                total_stats['difficulty_stats'][key] += stats['difficulty_stats'][key]
        else:
            print(f"\n⚠️  File not found: {filepath}")
            all_valid = False
    
    # 総合統計
    print("\n" + "="*80)
    print("Overall Statistics (All Grades)")
    print("="*80)
    print(f"Total Questions: {total_stats['total_questions']}")
    print(f"Total Errors: {total_stats['total_errors']}")
    print(f"Total Warnings: {total_stats['total_warnings']}")
    
    if total_stats['total_questions'] > 0:
        print(f"\nWord Count Distribution (Overall):")
        for range_name, count in total_stats['word_count_stats'].items():
            if count > 0:
                print(f"  {range_name:8s}: {count:3d} ({count/total_stats['total_questions']*100:5.1f}%)")
        
        print(f"\nDifficulty Distribution (Overall):")
        for diff, count in total_stats['difficulty_stats'].items():
            if count > 0:
                print(f"  {diff:12s}: {count:3d} ({count/total_stats['total_questions']*100:5.1f}%)")
    
    print("\n" + "="*80)
    if all_valid:
        print("✅ ALL FILES PASSED VALIDATION")
    else:
        print("❌ VALIDATION FAILED - Please fix errors above")
    print("="*80 + "\n")
    
    sys.exit(0 if all_valid else 1)


if __name__ == "__main__":
    main()
