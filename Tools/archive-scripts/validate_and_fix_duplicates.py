#!/usr/bin/env python3
"""
文法問題の重複検証・修正スクリプト

全1,800問(G1/G2/G3 × verb-form/fill-in-blank/sentence-ordering)の
ユニーク度を検証し、重複を検出・報告します。

使用方法:
    python scripts/validate_and_fix_duplicates.py
    python scripts/validate_and_fix_duplicates.py --fix  # 自動修正（今後実装予定）
"""

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, List, Tuple


class GrammarValidator:
    """文法問題の検証クラス"""
    
    def __init__(self, base_path: str = "nanashi8.github.io/public/data"):
        self.base_path = Path(base_path)
        self.results = {}
        
    def validate_section(
        self, 
        filepath: Path, 
        section_name: str, 
        key_field: str = 'sentence'
    ) -> Tuple[int, int, float, Dict[str, List[str]]]:
        """
        特定セクションの重複を検証
        
        Returns:
            (total, unique, percentage, duplicates_dict)
            duplicates_dict = {sentence: [id1, id2, ...]}
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        sentence_to_ids = {}
        for unit in data['units']:
            if section_name in unit:
                for q in unit[section_name]:
                    if key_field in q and q[key_field]:
                        sentence = q[key_field]
                        qid = q.get('id', 'unknown')
                        
                        if sentence not in sentence_to_ids:
                            sentence_to_ids[sentence] = []
                        sentence_to_ids[sentence].append(qid)
        
        # 重複を抽出
        duplicates = {
            sent: ids for sent, ids in sentence_to_ids.items() 
            if len(ids) > 1
        }
        
        total = sum(len(ids) for ids in sentence_to_ids.values())
        unique = len(sentence_to_ids)
        percentage = (unique / total * 100) if total > 0 else 0
        
        return total, unique, percentage, duplicates
    
    def validate_sentence_ordering(
        self, 
        grade: int
    ) -> Tuple[int, int, float, Dict[str, List[str]]]:
        """
        sentence-orderingファイルを検証
        (correctOrderとsentenceの両方に対応)
        """
        filepath = self.base_path / f"sentence-ordering-grade{grade}.json"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        sentence_to_ids = {}
        for unit in data['units']:
            for q in unit['sentenceOrdering']:
                # correctOrderまたはsentenceを使用
                sentence = q.get('correctOrder') or q.get('sentence', '')
                if sentence:
                    qid = q.get('id', 'unknown')
                    
                    if sentence not in sentence_to_ids:
                        sentence_to_ids[sentence] = []
                    sentence_to_ids[sentence].append(qid)
        
        duplicates = {
            sent: ids for sent, ids in sentence_to_ids.items() 
            if len(ids) > 1
        }
        
        total = sum(len(ids) for ids in sentence_to_ids.values())
        unique = len(sentence_to_ids)
        percentage = (unique / total * 100) if total > 0 else 0
        
        return total, unique, percentage, duplicates
    
    def validate_all(self) -> Dict:
        """全グレード・全ファイルタイプを検証"""
        results = {
            'grades': {},
            'summary': {
                'total_questions': 0,
                'total_unique': 0,
                'overall_percentage': 0,
                'total_duplicates': 0
            }
        }
        
        for grade in [1, 2, 3]:
            grade_results = {
                'verb-form': {},
                'fill-in-blank': {},
                'sentence-ordering': {}
            }
            
            # verb-form
            filepath = self.base_path / f"verb-form-questions-grade{grade}.json"
            total, unique, pct, dups = self.validate_section(
                filepath, 'verbForm', 'sentence'
            )
            grade_results['verb-form'] = {
                'total': total,
                'unique': unique,
                'percentage': pct,
                'duplicates': dups,
                'is_perfect': len(dups) == 0
            }
            
            # fill-in-blank
            filepath = self.base_path / f"fill-in-blank-questions-grade{grade}.json"
            total, unique, pct, dups = self.validate_section(
                filepath, 'fillInBlank', 'sentence'
            )
            grade_results['fill-in-blank'] = {
                'total': total,
                'unique': unique,
                'percentage': pct,
                'duplicates': dups,
                'is_perfect': len(dups) == 0
            }
            
            # sentence-ordering
            total, unique, pct, dups = self.validate_sentence_ordering(grade)
            grade_results['sentence-ordering'] = {
                'total': total,
                'unique': unique,
                'percentage': pct,
                'duplicates': dups,
                'is_perfect': len(dups) == 0
            }
            
            results['grades'][grade] = grade_results
            
            # 集計
            for file_type in grade_results.values():
                results['summary']['total_questions'] += file_type['total']
                results['summary']['total_unique'] += file_type['unique']
                results['summary']['total_duplicates'] += len(file_type['duplicates'])
        
        # 全体パーセンテージ
        if results['summary']['total_questions'] > 0:
            results['summary']['overall_percentage'] = (
                results['summary']['total_unique'] / 
                results['summary']['total_questions'] * 100
            )
        
        self.results = results
        return results
    
    def print_report(self):
        """検証結果を出力"""
        if not self.results:
            print("検証を実行してください (validate_all())")
            return
        
        print("=" * 70)
        print("【文法問題品質レポート】")
        print("=" * 70)
        
        for grade, grade_data in self.results['grades'].items():
            print(f"\n【Grade {grade} (中{grade})】")
            
            for file_type in ['verb-form', 'fill-in-blank', 'sentence-ordering']:
                data = grade_data[file_type]
                status = "✅" if data['is_perfect'] else "⚠️"
                
                print(f"  {status} {data['percentage']:5.1f}%  "
                      f"{file_type:22s} "
                      f"({data['unique']:3d}/{data['total']:3d})")
                
                # 重複詳細
                if data['duplicates']:
                    print(f"      重複: {len(data['duplicates'])}件")
                    for i, (sentence, ids) in enumerate(data['duplicates'].items(), 1):
                        if i <= 3:  # 最初の3件のみ表示
                            print(f"        - '{sentence[:50]}...' ({len(ids)}回)")
                            for qid in ids[:3]:  # 最初の3つのIDのみ
                                print(f"          {qid}")
                    
                    if len(data['duplicates']) > 3:
                        print(f"        ... 他{len(data['duplicates']) - 3}件")
        
        print("\n" + "=" * 70)
        print("【総計】")
        summary = self.results['summary']
        print(f"  総問題数: {summary['total_questions']:,}問")
        print(f"  ユニーク: {summary['total_unique']:,}問")
        print(f"  全体品質: {summary['overall_percentage']:.2f}%")
        print(f"  重複パターン: {summary['total_duplicates']}件")
        print("=" * 70)
        
        if summary['overall_percentage'] == 100.0 and summary['total_questions'] == 1800:
            print("\n🎉🎉🎉 完璧! 全1,800問が100%ユニーク! 🎉🎉🎉")
        elif summary['overall_percentage'] == 100.0:
            print(f"\n✅ 100%ユニーク達成!")
        else:
            remaining = 100 - summary['overall_percentage']
            print(f"\n⚠️ 改善余地: {remaining:.2f}% ({summary['total_duplicates']}件の重複)")
    
    def export_duplicates_report(self, output_path: str = "duplicate_report.json"):
        """重複詳細をJSONファイルに出力"""
        if not self.results:
            print("検証を実行してください")
            return
        
        report = {
            'timestamp': '2025-11-29',
            'summary': self.results['summary'],
            'duplicates_by_grade': {}
        }
        
        for grade, grade_data in self.results['grades'].items():
            report['duplicates_by_grade'][f'grade{grade}'] = {
                file_type: {
                    'count': len(data['duplicates']),
                    'details': data['duplicates']
                }
                for file_type, data in grade_data.items()
                if data['duplicates']
            }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n重複レポートを保存: {output_path}")


def main():
    """メイン実行"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='文法問題の重複検証・修正ツール'
    )
    parser.add_argument(
        '--fix',
        action='store_true',
        help='重複を自動修正（今後実装予定）'
    )
    parser.add_argument(
        '--export',
        type=str,
        help='重複レポートをJSONファイルに出力'
    )
    
    args = parser.parse_args()
    
    # 検証実行
    validator = GrammarValidator()
    
    print("検証中...")
    validator.validate_all()
    validator.print_report()
    
    # レポート出力
    if args.export:
        validator.export_duplicates_report(args.export)
    
    # 自動修正（今後実装）
    if args.fix:
        print("\n自動修正機能は今後実装予定です")
        print("現在は手動での修正をお願いします")
        sys.exit(1)
    
    # 終了コード
    if validator.results['summary']['overall_percentage'] == 100.0:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
