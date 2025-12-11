#!/usr/bin/env python3
"""
全コンテンツ品質検証スクリプト

文法・和訳・スペル・長文の全タブコンテンツを包括的に検証します。

使用方法:
    python3 scripts/validate_all_content.py
    python3 scripts/validate_all_content.py --type translation  # 和訳のみ
    python3 scripts/validate_all_content.py --export report.json
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from collections import Counter


class ContentValidator:
    """全コンテンツタイプの検証クラス"""
    
    def __init__(self, base_path: str = "nanashi8.github.io/public/data"):
        self.base_path = Path(base_path)
        self.results = {
            'grammar': {},
            'translation': {},
            'spelling': {},
            'reading': {}
        }
    
    # ========== 文法問題検証 ==========
    
    def validate_grammar(self) -> Dict:
        """文法問題の検証（既存のロジック）"""
        grammar_results = {
            'grades': {},
            'summary': {
                'total_questions': 0,
                'total_unique': 0,
                'overall_percentage': 0,
                'total_duplicates': 0
            }
        }
        
        for grade in [1, 2, 3]:
            grade_results = {}
            
            # verb-form
            filepath = self.base_path / f"verb-form-questions-grade{grade}.json"
            if filepath.exists():
                total, unique, pct, dups = self._validate_section(
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
            if filepath.exists():
                total, unique, pct, dups = self._validate_section(
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
            total, unique, pct, dups = self._validate_sentence_ordering(grade)
            grade_results['sentence-ordering'] = {
                'total': total,
                'unique': unique,
                'percentage': pct,
                'duplicates': dups,
                'is_perfect': len(dups) == 0
            }
            
            grammar_results['grades'][grade] = grade_results
            
            # 集計
            for file_type in grade_results.values():
                grammar_results['summary']['total_questions'] += file_type['total']
                grammar_results['summary']['total_unique'] += file_type['unique']
                grammar_results['summary']['total_duplicates'] += len(file_type['duplicates'])
        
        if grammar_results['summary']['total_questions'] > 0:
            grammar_results['summary']['overall_percentage'] = (
                grammar_results['summary']['total_unique'] / 
                grammar_results['summary']['total_questions'] * 100
            )
        
        self.results['grammar'] = grammar_results
        return grammar_results
    
    # ========== 和訳問題検証 ==========
    
    def validate_translation(self) -> Dict:
        """和訳問題の検証"""
        translation_results = {
            'grades': {},
            'summary': {
                'total_questions': 0,
                'total_unique': 0,
                'overall_percentage': 0,
                'total_duplicates': 0
            }
        }
        
        for grade in [1, 2, 3]:
            filepath = self.base_path / f"translation-quiz-grade{grade}.json"
            if not filepath.exists():
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 英文の重複チェック
            english_sentences = {}
            japanese_sentences = {}
            
            for unit in data.get('units', []):
                for q in unit.get('questions', []):
                    qid = q.get('id', 'unknown')
                    
                    # 英文
                    english = q.get('english', '')
                    if english:
                        if english not in english_sentences:
                            english_sentences[english] = []
                        english_sentences[english].append(qid)
                    
                    # 日本語
                    japanese = q.get('japanese', '')
                    if japanese:
                        if japanese not in japanese_sentences:
                            japanese_sentences[japanese] = []
                        japanese_sentences[japanese].append(qid)
            
            # 重複検出
            english_dups = {s: ids for s, ids in english_sentences.items() if len(ids) > 1}
            japanese_dups = {s: ids for s, ids in japanese_sentences.items() if len(ids) > 1}
            
            total_english = sum(len(ids) for ids in english_sentences.values())
            unique_english = len(english_sentences)
            pct_english = (unique_english / total_english * 100) if total_english > 0 else 0
            
            total_japanese = sum(len(ids) for ids in japanese_sentences.values())
            unique_japanese = len(japanese_sentences)
            pct_japanese = (unique_japanese / total_japanese * 100) if total_japanese > 0 else 0
            
            translation_results['grades'][grade] = {
                'english': {
                    'total': total_english,
                    'unique': unique_english,
                    'percentage': pct_english,
                    'duplicates': english_dups,
                    'is_perfect': len(english_dups) == 0
                },
                'japanese': {
                    'total': total_japanese,
                    'unique': unique_japanese,
                    'percentage': pct_japanese,
                    'duplicates': japanese_dups,
                    'is_perfect': len(japanese_dups) == 0
                }
            }
            
            translation_results['summary']['total_questions'] += total_english
            translation_results['summary']['total_unique'] += unique_english
            translation_results['summary']['total_duplicates'] += len(english_dups)
        
        if translation_results['summary']['total_questions'] > 0:
            translation_results['summary']['overall_percentage'] = (
                translation_results['summary']['total_unique'] / 
                translation_results['summary']['total_questions'] * 100
            )
        
        self.results['translation'] = translation_results
        return translation_results
    
    # ========== スペル問題検証 ==========
    
    def validate_spelling(self) -> Dict:
        """スペル問題の検証"""
        spelling_results = {
            'grades': {},
            'summary': {
                'total_questions': 0,
                'total_unique': 0,
                'overall_percentage': 0,
                'total_duplicates': 0
            }
        }
        
        for grade in [1, 2, 3]:
            filepath = self.base_path / f"spelling-quiz-grade{grade}.json"
            if not filepath.exists():
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 単語の重複チェック
            words = {}
            
            for unit in data.get('units', []):
                for q in unit.get('words', []):
                    qid = q.get('id', 'unknown')
                    word = q.get('word', '')
                    
                    if word:
                        if word not in words:
                            words[word] = []
                        words[word].append(qid)
            
            # 重複検出
            word_dups = {w: ids for w, ids in words.items() if len(ids) > 1}
            
            total = sum(len(ids) for ids in words.values())
            unique = len(words)
            pct = (unique / total * 100) if total > 0 else 0
            
            spelling_results['grades'][grade] = {
                'total': total,
                'unique': unique,
                'percentage': pct,
                'duplicates': word_dups,
                'is_perfect': len(word_dups) == 0
            }
            
            spelling_results['summary']['total_questions'] += total
            spelling_results['summary']['total_unique'] += unique
            spelling_results['summary']['total_duplicates'] += len(word_dups)
        
        if spelling_results['summary']['total_questions'] > 0:
            spelling_results['summary']['overall_percentage'] = (
                spelling_results['summary']['total_unique'] / 
                spelling_results['summary']['total_questions'] * 100
            )
        
        self.results['spelling'] = spelling_results
        return spelling_results
    
    # ========== 長文問題検証 ==========
    
    def validate_reading(self) -> Dict:
        """長文問題の検証"""
        reading_results = {
            'grades': {},
            'summary': {
                'total_passages': 0,
                'total_questions': 0,
                'total_unique_passages': 0,
                'total_unique_questions': 0,
                'passage_percentage': 0,
                'question_percentage': 0,
                'total_duplicates': 0
            }
        }
        
        for grade in [1, 2, 3]:
            filepath = self.base_path / f"reading-passages-grade{grade}.json"
            if not filepath.exists():
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # パッセージの重複チェック
            passages = {}
            questions = {}
            
            for passage in data.get('passages', []):
                passage_id = passage.get('id', 'unknown')
                title = passage.get('title', '')
                
                if title:
                    if title not in passages:
                        passages[title] = []
                    passages[title].append(passage_id)
                
                # 質問の重複チェック
                for q in passage.get('questions', []):
                    qid = q.get('id', 'unknown')
                    question_text = q.get('question', '')
                    
                    if question_text:
                        if question_text not in questions:
                            questions[question_text] = []
                        questions[question_text].append(qid)
            
            # 重複検出
            passage_dups = {p: ids for p, ids in passages.items() if len(ids) > 1}
            question_dups = {q: ids for q, ids in questions.items() if len(ids) > 1}
            
            total_passages = sum(len(ids) for ids in passages.values())
            unique_passages = len(passages)
            pct_passages = (unique_passages / total_passages * 100) if total_passages > 0 else 0
            
            total_questions = sum(len(ids) for ids in questions.values())
            unique_questions = len(questions)
            pct_questions = (unique_questions / total_questions * 100) if total_questions > 0 else 0
            
            reading_results['grades'][grade] = {
                'passages': {
                    'total': total_passages,
                    'unique': unique_passages,
                    'percentage': pct_passages,
                    'duplicates': passage_dups,
                    'is_perfect': len(passage_dups) == 0
                },
                'questions': {
                    'total': total_questions,
                    'unique': unique_questions,
                    'percentage': pct_questions,
                    'duplicates': question_dups,
                    'is_perfect': len(question_dups) == 0
                }
            }
            
            reading_results['summary']['total_passages'] += total_passages
            reading_results['summary']['total_unique_passages'] += unique_passages
            reading_results['summary']['total_questions'] += total_questions
            reading_results['summary']['total_unique_questions'] += unique_questions
            reading_results['summary']['total_duplicates'] += len(passage_dups) + len(question_dups)
        
        if reading_results['summary']['total_passages'] > 0:
            reading_results['summary']['passage_percentage'] = (
                reading_results['summary']['total_unique_passages'] / 
                reading_results['summary']['total_passages'] * 100
            )
        
        if reading_results['summary']['total_questions'] > 0:
            reading_results['summary']['question_percentage'] = (
                reading_results['summary']['total_unique_questions'] / 
                reading_results['summary']['total_questions'] * 100
            )
        
        self.results['reading'] = reading_results
        return reading_results
    
    # ========== ヘルパーメソッド ==========
    
    def _validate_section(
        self, 
        filepath: Path, 
        section_name: str, 
        key_field: str = 'sentence'
    ) -> Tuple[int, int, float, Dict[str, List[str]]]:
        """セクション検証のヘルパー"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        sentence_to_ids = {}
        for unit in data.get('units', []):
            if section_name in unit:
                for q in unit[section_name]:
                    if key_field in q and q[key_field]:
                        sentence = q[key_field]
                        qid = q.get('id', 'unknown')
                        
                        if sentence not in sentence_to_ids:
                            sentence_to_ids[sentence] = []
                        sentence_to_ids[sentence].append(qid)
        
        duplicates = {s: ids for s, ids in sentence_to_ids.items() if len(ids) > 1}
        total = sum(len(ids) for ids in sentence_to_ids.values())
        unique = len(sentence_to_ids)
        percentage = (unique / total * 100) if total > 0 else 0
        
        return total, unique, percentage, duplicates
    
    def _validate_sentence_ordering(self, grade: int) -> Tuple[int, int, float, Dict[str, List[str]]]:
        """sentence-ordering検証のヘルパー"""
        filepath = self.base_path / f"sentence-ordering-grade{grade}.json"
        
        if not filepath.exists():
            return 0, 0, 0, {}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        sentence_to_ids = {}
        for unit in data.get('units', []):
            for q in unit.get('sentenceOrdering', []):
                sentence = q.get('correctOrder') or q.get('sentence', '')
                if sentence:
                    qid = q.get('id', 'unknown')
                    
                    if sentence not in sentence_to_ids:
                        sentence_to_ids[sentence] = []
                    sentence_to_ids[sentence].append(qid)
        
        duplicates = {s: ids for s, ids in sentence_to_ids.items() if len(ids) > 1}
        total = sum(len(ids) for ids in sentence_to_ids.values())
        unique = len(sentence_to_ids)
        percentage = (unique / total * 100) if total > 0 else 0
        
        return total, unique, percentage, duplicates
    
    # ========== レポート出力 ==========
    
    def validate_all(self, content_type: str = 'all'):
        """全コンテンツまたは特定タイプを検証"""
        if content_type in ['all', 'grammar']:
            self.validate_grammar()
        
        if content_type in ['all', 'translation']:
            self.validate_translation()
        
        if content_type in ['all', 'spelling']:
            self.validate_spelling()
        
        if content_type in ['all', 'reading']:
            self.validate_reading()
    
    def print_report(self, content_type: str = 'all'):
        """検証結果のレポート出力"""
        print("=" * 70)
        print("【全コンテンツ品質レポート】")
        print("=" * 70)
        
        # 文法
        if content_type in ['all', 'grammar'] and self.results.get('grammar'):
            self._print_grammar_report()
        
        # 和訳
        if content_type in ['all', 'translation'] and self.results.get('translation'):
            self._print_translation_report()
        
        # スペル
        if content_type in ['all', 'spelling'] and self.results.get('spelling'):
            self._print_spelling_report()
        
        # 長文
        if content_type in ['all', 'reading'] and self.results.get('reading'):
            self._print_reading_report()
        
        # 総合サマリー
        if content_type == 'all':
            self._print_overall_summary()
    
    def _print_grammar_report(self):
        """文法レポート"""
        print("\n【📝 文法問題】")
        grammar = self.results['grammar']
        
        for grade, grade_data in grammar['grades'].items():
            print(f"\n  Grade {grade} (中{grade}):")
            for file_type in ['verb-form', 'fill-in-blank', 'sentence-ordering']:
                if file_type in grade_data:
                    data = grade_data[file_type]
                    status = "✅" if data['is_perfect'] else "⚠️"
                    print(f"    {status} {data['percentage']:5.1f}%  {file_type:22s} ({data['unique']:3d}/{data['total']:3d})")
        
        summary = grammar['summary']
        print(f"\n  総計: {summary['total_unique']}/{summary['total_questions']} = {summary['overall_percentage']:.2f}%")
    
    def _print_translation_report(self):
        """和訳レポート"""
        print("\n【🈂️  和訳問題】")
        translation = self.results['translation']
        
        for grade, grade_data in translation['grades'].items():
            print(f"\n  Grade {grade} (中{grade}):")
            
            eng = grade_data['english']
            status = "✅" if eng['is_perfect'] else "⚠️"
            print(f"    {status} {eng['percentage']:5.1f}%  英文                   ({eng['unique']:3d}/{eng['total']:3d})")
            
            jpn = grade_data['japanese']
            status = "✅" if jpn['is_perfect'] else "⚠️"
            print(f"    {status} {jpn['percentage']:5.1f}%  日本語訳               ({jpn['unique']:3d}/{jpn['total']:3d})")
        
        summary = translation['summary']
        if summary['total_questions'] > 0:
            print(f"\n  総計: {summary['total_unique']}/{summary['total_questions']} = {summary['overall_percentage']:.2f}%")
    
    def _print_spelling_report(self):
        """スペルレポート"""
        print("\n【🔤 スペル問題】")
        spelling = self.results['spelling']
        
        for grade, grade_data in spelling['grades'].items():
            status = "✅" if grade_data['is_perfect'] else "⚠️"
            print(f"  {status} Grade {grade}: {grade_data['percentage']:5.1f}%  ({grade_data['unique']:3d}/{grade_data['total']:3d})")
        
        summary = spelling['summary']
        if summary['total_questions'] > 0:
            print(f"\n  総計: {summary['total_unique']}/{summary['total_questions']} = {summary['overall_percentage']:.2f}%")
    
    def _print_reading_report(self):
        """長文レポート"""
        print("\n【📖 長文読解】")
        reading = self.results['reading']
        
        for grade, grade_data in reading['grades'].items():
            print(f"\n  Grade {grade} (中{grade}):")
            
            passages = grade_data['passages']
            status = "✅" if passages['is_perfect'] else "⚠️"
            print(f"    {status} {passages['percentage']:5.1f}%  パッセージ             ({passages['unique']:3d}/{passages['total']:3d})")
            
            questions = grade_data['questions']
            status = "✅" if questions['is_perfect'] else "⚠️"
            print(f"    {status} {questions['percentage']:5.1f}%  質問                   ({questions['unique']:3d}/{questions['total']:3d})")
        
        summary = reading['summary']
        if summary['total_passages'] > 0:
            print(f"\n  パッセージ: {summary['total_unique_passages']}/{summary['total_passages']} = {summary['passage_percentage']:.2f}%")
        if summary['total_questions'] > 0:
            print(f"  質問: {summary['total_unique_questions']}/{summary['total_questions']} = {summary['question_percentage']:.2f}%")
    
    def _print_overall_summary(self):
        """総合サマリー"""
        print("\n" + "=" * 70)
        print("【総合サマリー】")
        
        total_items = 0
        total_unique = 0
        
        if self.results.get('grammar'):
            g = self.results['grammar']['summary']
            total_items += g['total_questions']
            total_unique += g['total_unique']
        
        if self.results.get('translation'):
            t = self.results['translation']['summary']
            total_items += t['total_questions']
            total_unique += t['total_unique']
        
        if self.results.get('spelling'):
            s = self.results['spelling']['summary']
            total_items += s['total_questions']
            total_unique += s['total_unique']
        
        if self.results.get('reading'):
            r = self.results['reading']['summary']
            total_items += r['total_questions']
            total_unique += r['total_unique_questions']
        
        overall_pct = (total_unique / total_items * 100) if total_items > 0 else 0
        
        print(f"  全コンテンツ合計: {total_unique:,}/{total_items:,} = {overall_pct:.2f}%")
        print("=" * 70)
        
        if overall_pct == 100.0:
            print("\n🎉🎉🎉 完璧! 全コンテンツが100%ユニーク! 🎉🎉🎉")
        else:
            print(f"\n⚠️ 改善余地: {100 - overall_pct:.2f}%")


def main():
    """メイン実行"""
    import argparse
    
    parser = argparse.ArgumentParser(description='全コンテンツ品質検証ツール')
    parser.add_argument(
        '--type',
        choices=['all', 'grammar', 'translation', 'spelling', 'reading'],
        default='all',
        help='検証するコンテンツタイプ'
    )
    parser.add_argument(
        '--export',
        type=str,
        help='結果をJSONファイルに出力'
    )
    
    args = parser.parse_args()
    
    validator = ContentValidator()
    
    print("検証中...")
    validator.validate_all(args.type)
    validator.print_report(args.type)
    
    if args.export:
        with open(args.export, 'w', encoding='utf-8') as f:
            json.dump(validator.results, f, ensure_ascii=False, indent=2)
        print(f"\n結果を保存: {args.export}")
    
    # 終了コード判定
    all_perfect = True
    for content_type, data in validator.results.items():
        if data and 'summary' in data:
            summary = data['summary']
            if 'overall_percentage' in summary and summary['overall_percentage'] < 100.0:
                all_perfect = False
                break
    
    sys.exit(0 if all_perfect else 1)


if __name__ == '__main__':
    main()
