#!/usr/bin/env python3
"""
文法問題データの品質分析スクリプト

統計情報を収集し、品質レポートを生成します。
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List

class GrammarDataQualityAnalyzer:
    def __init__(self):
        self.stats = {
            'total_files': 0,
            'enabled_files': 0,
            'disabled_files': 0,
            'total_questions': 0,
            'issues_found': 0,
            'issue_types': defaultdict(int),
            'files_with_issues': [],
        }
        
        # 文法用語パターン
        self.grammar_term_patterns = [
            r'過去進行形', r'過去形', r'現在進行形', r'未来形',
            r'不規則動詞', r'一般動詞', r'be動詞',
            r'助動詞', r'疑問詞', r'比較級', r'最上級',
            r'受動態', r'関係代名詞', r'複数形',
            r'三人称', r'否定文', r'疑問文', r'命令文',
            r'-ing形', r'-ing。', r'-ed形',
            r'[a-zA-Z]+の[^。、]+',
            r'\w+文[（(]',
            r'^[^。]*\d+。$',
            r'を使う。$', r'を取る', r'を重ねる', r'を変える',
            r'穴埋め\d+', r'並べ替え\d+',
        ]
    
    def analyze_file(self, file_path: Path) -> Dict:
        """ファイルを分析"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            return {'error': str(e)}
        
        file_stats = {
            'filename': file_path.name,
            'enabled': data.get('enabled', True),
            'question_count': 0,
            'issues': [],
        }
        
        self.stats['total_files'] += 1
        
        if data.get('enabled') is False:
            self.stats['disabled_files'] += 1
            return file_stats
        
        self.stats['enabled_files'] += 1
        
        # 問題を収集
        questions = []
        if 'questions' in data:
            questions = data['questions']
        elif 'units' in data:
            for unit in data['units']:
                questions.extend(unit.get('questions', []))
        
        file_stats['question_count'] = len(questions)
        self.stats['total_questions'] += len(questions)
        
        # 各問題を分析
        for q in questions:
            issues = self._analyze_question(q)
            if issues:
                file_stats['issues'].extend(issues)
                self.stats['issues_found'] += len(issues)
                for issue in issues:
                    self.stats['issue_types'][issue['type']] += 1
        
        if file_stats['issues']:
            self.stats['files_with_issues'].append(file_path.name)
        
        return file_stats
    
    def _analyze_question(self, q: Dict) -> List[Dict]:
        """問題を分析して問題点をリスト化"""
        issues = []
        q_id = q.get('id', 'unknown')
        
        # 1. 日本語訳の文法用語チェック
        if 'japanese' in q:
            japanese = q['japanese']
            for pattern in self.grammar_term_patterns:
                if re.search(pattern, japanese):
                    issues.append({
                        'type': 'grammar_term_in_japanese',
                        'question_id': q_id,
                        'description': f"日本語訳に文法用語が含まれている: {japanese}",
                        'severity': 'high'
                    })
                    break
        
        # 2. プレースホルダー英文チェック
        if 'sentence' in q:
            sentence = q['sentence']
            if 'Example sentence' in sentence or '____ blank' in sentence:
                issues.append({
                    'type': 'placeholder_sentence',
                    'question_id': q_id,
                    'description': f"プレースホルダー英文: {sentence}",
                    'severity': 'high'
                })
        
        # 3. プレースホルダー選択肢チェック
        if 'choices' in q:
            placeholder_choices = [c for c in q['choices'] if c in ['choice1', 'choice2', 'choice3']]
            if placeholder_choices:
                issues.append({
                    'type': 'placeholder_choices',
                    'question_id': q_id,
                    'description': f"プレースホルダー選択肢: {placeholder_choices}",
                    'severity': 'high'
                })
        
        # 4. 選択肢と正解の不一致
        if 'correctAnswer' in q and 'choices' in q:
            if q['correctAnswer'] not in q['choices']:
                issues.append({
                    'type': 'answer_not_in_choices',
                    'question_id': q_id,
                    'description': f"正解が選択肢に含まれていない: {q['correctAnswer']}",
                    'severity': 'critical'
                })
        
        # 5. be動詞の主語不一致
        if 'sentence' in q and 'correctAnswer' in q:
            if q['correctAnswer'] in ['was', 'were']:
                match = re.match(r'^(\w+)\s+_{2,}', q['sentence'])
                if match:
                    subject = match.group(1)
                    if subject in ['I', 'He', 'She', 'It'] and q['correctAnswer'] == 'were':
                        issues.append({
                            'type': 'be_verb_mismatch',
                            'question_id': q_id,
                            'description': f"主語{subject}にwereは不正",
                            'severity': 'high'
                        })
                    elif subject in ['You', 'We', 'They'] and q['correctAnswer'] == 'was':
                        issues.append({
                            'type': 'be_verb_mismatch',
                            'question_id': q_id,
                            'description': f"主語{subject}にwasは不正",
                            'severity': 'high'
                        })
        
        # 6. 不定詞問題のパターンチェック
        if 'sentence' in q and 'correctAnswer' in q:
            if re.match(r'^To\s+_{2,}', q['sentence']):
                if q['correctAnswer'].lower().startswith('to '):
                    issues.append({
                        'type': 'infinitive_pattern_error',
                        'question_id': q_id,
                        'description': f"不定詞問題で正解が'to'から始まる: {q['correctAnswer']}",
                        'severity': 'high'
                    })
        
        return issues
    
    def generate_report(self) -> str:
        """品質レポートを生成"""
        report = []
        report.append("=" * 80)
        report.append("文法問題データ品質レポート")
        report.append("=" * 80)
        report.append("")
        
        # サマリー
        report.append("📊 統計サマリー")
        report.append("-" * 80)
        report.append(f"  総ファイル数: {self.stats['total_files']}")
        report.append(f"  有効ファイル数: {self.stats['enabled_files']}")
        report.append(f"  無効ファイル数: {self.stats['disabled_files']}")
        report.append(f"  総問題数: {self.stats['total_questions']}")
        report.append(f"  検出された問題: {self.stats['issues_found']}")
        report.append("")
        
        # 品質スコア
        if self.stats['total_questions'] > 0:
            quality_score = (1 - self.stats['issues_found'] / self.stats['total_questions']) * 100
            report.append(f"✨ 品質スコア: {quality_score:.2f}%")
            report.append("")
        
        # 問題タイプ別の内訳
        if self.stats['issue_types']:
            report.append("🔍 問題タイプ別内訳")
            report.append("-" * 80)
            for issue_type, count in sorted(self.stats['issue_types'].items(), key=lambda x: -x[1]):
                report.append(f"  {issue_type}: {count}件")
            report.append("")
        
        # 問題のあるファイル
        if self.stats['files_with_issues']:
            report.append("⚠️  問題のあるファイル")
            report.append("-" * 80)
            for filename in self.stats['files_with_issues']:
                report.append(f"  • {filename}")
            report.append("")
        
        # 結論
        report.append("=" * 80)
        if self.stats['issues_found'] == 0:
            report.append("✅ 全てのファイルが品質基準を満たしています!")
        else:
            report.append(f"❌ {self.stats['issues_found']}件の問題が検出されました。")
            report.append("   修正が必要です。")
        report.append("=" * 80)
        
        return "\n".join(report)


def main():
    """メイン処理"""
    analyzer = GrammarDataQualityAnalyzer()
    
    base_path = Path(__file__).parent.parent / 'public' / 'data' / 'grammar'
    
    print("🔍 文法問題データを分析中...\n")
    
    for file_path in sorted(base_path.glob('grammar_grade*.json')):
        if file_path.exists():
            file_stats = analyzer.analyze_file(file_path)
            if file_stats.get('issues'):
                print(f"⚠️  {file_path.name}: {len(file_stats['issues'])}件の問題")
    
    print("\n")
    print(analyzer.generate_report())
    
    # レポートをファイルに保存
    report_dir = Path(__file__).parent.parent / 'docs' / 'quality'
    report_dir.mkdir(exist_ok=True)
    
    report_path = report_dir / 'grammar_quality_report.md'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(analyzer.generate_report())
    
    print(f"\n📄 レポートを保存しました: {report_path}")


if __name__ == '__main__':
    main()
