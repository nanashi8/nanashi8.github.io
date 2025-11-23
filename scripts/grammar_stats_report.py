#!/usr/bin/env python3
"""
NEW HORIZON文法問題 統計レポート生成スクリプト

文並び替え問題の詳細な統計情報を生成します。

使用方法:
    python3 scripts/grammar_stats_report.py
    
出力情報:
- 学年別問題数・Unit数
- 語数分布
- 難易度分布
- 文法項目別の問題数
- Unit別の詳細情報
"""

import json
from pathlib import Path
from collections import defaultdict


def generate_stats_report():
    """文法問題の統計レポート生成"""
    
    # スクリプトからの相対パスでデータディレクトリを特定
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'public' / 'data'
    
    files = [
        data_dir / 'sentence-ordering-grade1.json',
        data_dir / 'sentence-ordering-grade2.json',
        data_dir / 'sentence-ordering-grade3.json',
    ]
    
    print("\n" + "=" * 80)
    print("NEW HORIZON Grammar Questions - Statistics Report")
    print("=" * 80)
    print(f"Report Date: 2025-11-23")
    print(f"Data Files: {len([f for f in files if f.exists()])}")
    print("=" * 80)
    
    total_questions = 0
    total_units = 0
    word_count_stats = {"3-5": 0, "6-8": 0, "9-11": 0, "12+": 0}
    difficulty_stats = defaultdict(int)
    grammar_points = defaultdict(int)
    grade_details = []
    
    for filepath in files:
        if not filepath.exists():
            print(f"\n⚠️  File not found: {filepath}")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        grade = data['grade']
        q_count = data['totalQuestions']
        units = data['units']
        
        print(f"\n【Grade {grade}】")
        print(f"  Total Questions: {q_count}")
        print(f"  Total Units: {len(units)}")
        
        total_questions += q_count
        total_units += len(units)
        
        grade_word_stats = {"3-5": 0, "6-8": 0, "9-11": 0, "12+": 0}
        grade_grammar = defaultdict(int)
        
        for unit in units:
            unit_name = unit['unit']
            unit_title = unit['title']
            questions = unit['questions']
            
            print(f"    • {unit_name}: {unit_title} ({len(questions)} questions)")
            
            for q in questions:
                # 語数統計
                wc = q['wordCount']
                if 3 <= wc <= 5:
                    word_count_stats["3-5"] += 1
                    grade_word_stats["3-5"] += 1
                elif 6 <= wc <= 8:
                    word_count_stats["6-8"] += 1
                    grade_word_stats["6-8"] += 1
                elif 9 <= wc <= 11:
                    word_count_stats["9-11"] += 1
                    grade_word_stats["9-11"] += 1
                else:
                    word_count_stats["12+"] += 1
                    grade_word_stats["12+"] += 1
                
                # 難易度統計
                difficulty_stats[q['difficulty']] += 1
                
                # 文法項目統計
                grammar_points[q['grammarPoint']] += 1
                grade_grammar[q['grammarPoint']] += 1
        
        # 学年別統計を保存
        grade_details.append({
            'grade': grade,
            'questions': q_count,
            'units': len(units),
            'word_stats': grade_word_stats,
            'grammar': grade_grammar
        })
    
    # 総合統計
    print("\n" + "=" * 80)
    print("Overall Statistics")
    print("=" * 80)
    print(f"Total Questions: {total_questions}")
    print(f"Total Units: {total_units}")
    print(f"Average Questions/Unit: {total_questions/total_units:.1f}")
    print(f"Average Questions/Grade: {total_questions/len(grade_details):.1f}")
    
    # 語数分布
    print("\n" + "=" * 80)
    print("Word Count Distribution (Overall)")
    print("=" * 80)
    for range_name, count in sorted(word_count_stats.items()):
        if count > 0:
            percentage = count/total_questions*100
            bar = "█" * int(percentage / 2)
            print(f"  {range_name:8s}: {count:3d} ({percentage:5.1f}%) {bar}")
    
    # 学年別語数分布
    print("\n" + "=" * 80)
    print("Word Count Distribution by Grade")
    print("=" * 80)
    for detail in grade_details:
        print(f"\n  Grade {detail['grade']}:")
        for range_name, count in sorted(detail['word_stats'].items()):
            if count > 0:
                percentage = count/detail['questions']*100
                print(f"    {range_name:8s}: {count:3d} ({percentage:5.1f}%)")
    
    # 難易度分布
    print("\n" + "=" * 80)
    print("Difficulty Distribution")
    print("=" * 80)
    for difficulty, count in sorted(difficulty_stats.items()):
        percentage = count/total_questions*100
        bar = "█" * int(percentage / 2)
        print(f"  {difficulty:12s}: {count:3d} ({percentage:5.1f}%) {bar}")
    
    # 文法項目トップ15
    print("\n" + "=" * 80)
    print("Top 15 Grammar Points")
    print("=" * 80)
    sorted_grammar = sorted(grammar_points.items(), key=lambda x: x[1], reverse=True)
    for idx, (grammar, count) in enumerate(sorted_grammar[:15], 1):
        print(f"  {idx:2d}. {grammar:35s}: {count:3d} questions")
    
    # 学年別文法項目トップ5
    print("\n" + "=" * 80)
    print("Top 5 Grammar Points by Grade")
    print("=" * 80)
    for detail in grade_details:
        print(f"\n  Grade {detail['grade']}:")
        sorted_grade_grammar = sorted(detail['grammar'].items(), key=lambda x: x[1], reverse=True)
        for idx, (grammar, count) in enumerate(sorted_grade_grammar[:5], 1):
            print(f"    {idx}. {grammar:30s}: {count:2d} questions")
    
    # 推奨事項
    print("\n" + "=" * 80)
    print("Quality Metrics")
    print("=" * 80)
    
    # 語数分布の妥当性チェック
    short_percentage = word_count_stats["3-5"] / total_questions * 100
    medium_percentage = word_count_stats["6-8"] / total_questions * 100
    long_percentage = word_count_stats["9-11"] / total_questions * 100
    very_long_percentage = word_count_stats["12+"] / total_questions * 100
    
    print(f"\n  Word Count Distribution Quality:")
    print(f"    3-5 words:  {short_percentage:5.1f}% (Target: ~45%)  {'✅' if 40 <= short_percentage <= 50 else '⚠️'}")
    print(f"    6-8 words:  {medium_percentage:5.1f}% (Target: ~50%)  {'✅' if 45 <= medium_percentage <= 55 else '⚠️'}")
    print(f"    9-11 words: {long_percentage:5.1f}% (Target: ~10%)  {'✅' if 5 <= long_percentage <= 15 else '⚠️'}")
    print(f"    12+ words:  {very_long_percentage:5.1f}% (Target: <5%)   {'✅' if very_long_percentage < 5 else '⚠️'}")
    
    # 問題数バランス
    print(f"\n  Questions per Unit:")
    avg_per_unit = total_questions / total_units
    print(f"    Average: {avg_per_unit:.1f} questions/unit")
    print(f"    Balance: {'✅ Balanced' if 4 <= avg_per_unit <= 7 else '⚠️  Consider rebalancing'}")
    
    # 難易度バランス
    print(f"\n  Difficulty Balance:")
    beginner_pct = difficulty_stats.get('beginner', 0) / total_questions * 100
    intermediate_pct = difficulty_stats.get('intermediate', 0) / total_questions * 100
    advanced_pct = difficulty_stats.get('advanced', 0) / total_questions * 100
    print(f"    Beginner:     {beginner_pct:5.1f}% {'✅' if beginner_pct > 0 else '⚠️'}")
    print(f"    Intermediate: {intermediate_pct:5.1f}% {'✅' if intermediate_pct > 0 else '⚠️'}")
    print(f"    Advanced:     {advanced_pct:5.1f}% {'✅' if advanced_pct > 0 else '⚠️'}")
    
    print("\n" + "=" * 80)
    print("✅ Statistics Report Complete")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    generate_stats_report()
