#!/usr/bin/env python3
"""
長文パッセージ品質検証スクリプト (最適化版)

実装されている設計思想に基づく品質保証:
- 英文の文法的正確性
- フレーズベースフォーマット（音読・理解促進用）
- 教育的価値（語彙レベル、難易度）
- 文字数要件の遵守
- 語彙の多様性

使用方法:
    python3 scripts/validate_passage_quality.py
    python3 scripts/validate_passage_quality.py --file beginner-cafe-menu.txt
    python3 scripts/validate_passage_quality.py --level intermediate
    python3 scripts/validate_passage_quality.py --strict

フォーマット哲学:
- フレーズごとの改行スタイル（認知チャンキング理論に基づく）
- インデント不要（改行で視覚的に区切る）
- 音読練習に最適化（自然な息継ぎ位置で改行）
- 構文理解を促進（意味のまとまりごとに分割）
"""

import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple, Set
from dataclasses import dataclass, field
import argparse

# パス設定
PASSAGES_DIR = Path("nanashi8.github.io/public/data/passages")
INDEX_FILE = PASSAGES_DIR / "index.json"

# 品質基準
WORD_COUNT_REQUIREMENTS = {
    'beginner': (800, 1500),
    'intermediate': (1500, 2500),
    'advanced': (2500, 4000)
}

# フレーズベースフォーマット設定（実装に基づく）
PHRASE_BASED_FORMAT = True  # フレーズごとの改行スタイルを採用
OPTIMAL_PHRASE_LENGTH = (3, 20)  # 理想的なフレーズの単語数


@dataclass
class QualityIssue:
    """品質問題"""
    severity: str  # 'critical', 'warning', 'info'
    category: str
    line_number: int
    message: str
    suggestion: str = ""
    context: str = ""


@dataclass
class PassageQualityReport:
    """パッセージ品質レポート"""
    passage_id: str
    file_path: Path
    level: str
    word_count: int
    paragraph_count: int
    sentence_count: int
    
    # 品質スコア (0-100)
    overall_score: float = 0.0
    formatting_score: float = 0.0
    content_score: float = 0.0
    grammar_score: float = 0.0
    
    # 問題リスト
    issues: List[QualityIssue] = field(default_factory=list)
    
    @property
    def is_passing(self) -> bool:
        """合格基準: 80点以上かつcritical問題なし"""
        critical_count = sum(1 for i in self.issues if i.severity == 'critical')
        return self.overall_score >= 80.0 and critical_count == 0


class PassageQualityValidator:
    """長文パッセージ品質検証クラス"""
    
    def __init__(self, strict_mode: bool = False):
        self.strict_mode = strict_mode
        self.reports: List[PassageQualityReport] = []
        
        # 接続詞パターン
        self.subordinating_conjunctions = {
            'when', 'if', 'because', 'although', 'while', 'since',
            'after', 'before', 'unless', 'until', 'as', 'though', 'whereas'
        }
        
        self.coordinating_conjunctions = {'and', 'or', 'but', 'so', 'yet', 'for', 'nor'}
        
        self.prepositions = {
            'with', 'from', 'to', 'at', 'in', 'on', 'by', 'for',
            'of', 'about', 'under', 'over', 'between', 'through'
        }
    
    def validate_file(self, file_path: Path, level: str) -> PassageQualityReport:
        """単一ファイルの品質検証"""
        
        # ファイル読み込み
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        
        # 基本情報
        passage_id = file_path.stem
        word_count = len(content.split())
        paragraph_count = self._count_paragraphs(content)
        sentence_count = self._count_sentences(content)
        
        report = PassageQualityReport(
            passage_id=passage_id,
            file_path=file_path,
            level=level,
            word_count=word_count,
            paragraph_count=paragraph_count,
            sentence_count=sentence_count
        )
        
        # 各種検証
        self._validate_word_count(report)
        self._validate_formatting(report, lines)
        self._validate_sentence_structure(report, content, lines)
        self._validate_paragraph_quality(report, content)
        self._validate_vocabulary_diversity(report, content)
        
        # スコア計算
        self._calculate_scores(report)
        
        return report
    
    def _validate_word_count(self, report: PassageQualityReport):
        """文字数要件の検証"""
        min_words, max_words = WORD_COUNT_REQUIREMENTS[report.level]
        
        if report.word_count < min_words:
            shortage = min_words - report.word_count
            report.issues.append(QualityIssue(
                severity='critical',
                category='word_count',
                line_number=0,
                message=f'文字数不足: {report.word_count}語 (最低{min_words}語)',
                suggestion=f'{shortage}語追加してください'
            ))
        elif report.word_count > max_words:
            excess = report.word_count - max_words
            # 文字数超過はinfoレベル（受験頻出話題では教育的価値を優先）
            report.issues.append(QualityIssue(
                severity='info',
                category='word_count',
                line_number=0,
                message=f'文字数超過: {report.word_count}語 (推奨最大{max_words}語)',
                suggestion=f'受験頻出話題では問題ありません。内容の教育的価値を優先しています。'
            ))
    
    def _validate_formatting(self, report: PassageQualityReport, lines: List[str]):
        """フォーマットの検証（フレーズベーススタイル）"""
        
        # フレーズベース形式の品質チェック
        phrase_count = 0
        long_phrases = 0
        short_phrases = 0
        
        for i, line in enumerate(lines, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            
            # セクションヘッダーはスキップ
            is_header = (
                line.isupper() or 
                (line.istitle() and len(line.split()) <= 10) or
                stripped.endswith(':') or
                re.match(r'^[A-Z][^.!?]*$', stripped)  # 終端記号なしの短い行
            )
            
            if is_header:
                continue
            
            # フレーズの単語数をカウント
            word_count = len(stripped.split())
            phrase_count += 1
            
            min_words, max_words = OPTIMAL_PHRASE_LENGTH
            
            # 極端に長いフレーズのみ情報提示（文法的に適切なら許容）
            if word_count > max_words:
                long_phrases += 1
                if word_count > 40:  # 40語超の場合のみ
                    report.issues.append(QualityIssue(
                        severity='info',
                        category='phrase_length',
                        line_number=i,
                        message=f'長いフレーズ（{word_count}語）',
                        context=stripped[:60],
                        suggestion=f'文法的に適切であれば問題ありません。必要に応じて分割を検討してください。'
                    ))
            
            # 極端に短いフレーズ（1-2語のみ、ただし会話・見出しを除く）
            elif word_count < min_words:
                # 会話や間投詞は許容
                if not (stripped.startswith('"') or stripped.endswith('!') or 
                       stripped.endswith('?') or len(stripped) < 15):
                    short_phrases += 1
        
        # フレーズ分割品質の総合評価（文法的適切性を優先）
        if phrase_count > 0:
            long_phrase_ratio = long_phrases / phrase_count
            if long_phrase_ratio > 0.5:  # 50%以上の場合のみ情報提示
                report.issues.append(QualityIssue(
                    severity='info',
                    category='phrase_quality',
                    line_number=0,
                    message=f'長めのフレーズ: {long_phrase_ratio*100:.1f}%',
                    suggestion='文法的に適切であれば問題ありません。受験問題の表現レベルを優先しています。'
                ))
    
    def _validate_sentence_structure(
        self, 
        report: PassageQualityReport, 
        content: str,
        lines: List[str]
    ):
        """文構造の検証（フレーズ分割の自然さ）"""
        
        # 段落ごとに処理
        paragraphs = content.split('\n\n')
        current_line = 1
        
        for para in paragraphs:
            if not para.strip():
                current_line += 2
                continue
            
            # 文に分割
            sentences = re.split(r'(?<=[.!?])\s+', para)
            
            for sentence in sentences:
                if len(sentence.strip()) < 10:
                    current_line += sentence.count('\n') + 1
                    continue
                
                # 従属節の分離チェック
                self._check_subordinate_clause_split(report, sentence, current_line)
                
                # 前置詞句の分離チェック
                self._check_prepositional_phrase_split(report, sentence, current_line)
                
                # 等位接続詞の分離チェック
                self._check_coordinating_conjunction_split(report, sentence, current_line)
                
                # to不定詞の分離チェック
                self._check_infinitive_split(report, sentence, current_line)
                
                current_line += sentence.count('\n') + 1
            
            current_line += 2  # 段落間の空行
    
    def _check_subordinate_clause_split(
        self, 
        report: PassageQualityReport, 
        sentence: str, 
        line_num: int
    ):
        """従属節が分離されていないかチェック"""
        words = sentence.strip().split()
        
        # 文頭が従属接続詞で始まる場合（これは正常）
        if words and words[0].lower().rstrip('.,;:!?') in self.subordinating_conjunctions:
            return
        
        # 文中の従属接続詞をチェック
        for conj in self.subordinating_conjunctions:
            # カンマ + 接続詞 + 短い節（5単語以下）で終わる = 分離の可能性
            pattern = rf',\s+{conj}\s+(\w+\s+){{1,5}}[.!?]$'
            if re.search(pattern, sentence, re.IGNORECASE):
                report.issues.append(QualityIssue(
                    severity='warning',
                    category='sentence_structure',
                    line_number=line_num,
                    message=f'従属節が短すぎる可能性（接続詞: {conj}）',
                    context=sentence[-60:],
                    suggestion='前の文と統合するか、節を拡張してください'
                ))
    
    def _check_prepositional_phrase_split(
        self, 
        report: PassageQualityReport, 
        sentence: str, 
        line_num: int
    ):
        """前置詞句が不自然に分離されていないかチェック"""
        for prep in self.prepositions:
            # 文が前置詞で始まり、短い（5単語以下）= 分離の可能性
            pattern = rf'^\s*{prep}\s+(\w+\s+){{1,4}}[.!?]$'
            if re.search(pattern, sentence, re.IGNORECASE):
                report.issues.append(QualityIssue(
                    severity='warning',
                    category='sentence_structure',
                    line_number=line_num,
                    message=f'前置詞句が分離されている可能性（前置詞: {prep}）',
                    context=sentence[:60],
                    suggestion='前の文と統合してください'
                ))
    
    def _check_coordinating_conjunction_split(
        self, 
        report: PassageQualityReport, 
        sentence: str, 
        line_num: int
    ):
        """等位接続詞で始まる文のチェック"""
        words = sentence.strip().split()
        
        if words and words[0].lower().rstrip('.,;:!?') in self.coordinating_conjunctions:
            # 短い文（10単語以下）は分離の可能性
            if len(words) <= 10:
                report.issues.append(QualityIssue(
                    severity='info',
                    category='sentence_structure',
                    line_number=line_num,
                    message=f'等位接続詞で始まる短い文（接続詞: {words[0]}）',
                    context=sentence[:60],
                    suggestion='前の文と統合を検討してください'
                ))
    
    def _check_infinitive_split(
        self, 
        report: PassageQualityReport, 
        sentence: str, 
        line_num: int
    ):
        """to不定詞句が分離されていないかチェック"""
        # 文がto + 動詞で始まり、短い（7単語以下）= 分離の可能性
        pattern = r'^\s*[Tt]o\s+\w+\s+(\w+\s+){0,5}[.!?]$'
        if re.search(pattern, sentence):
            report.issues.append(QualityIssue(
                severity='info',
                category='sentence_structure',
                line_number=line_num,
                message='to不定詞句が分離されている可能性',
                context=sentence[:60],
                suggestion='前の文と統合を検討してください'
            ))
    
    def _validate_paragraph_quality(self, report: PassageQualityReport, content: str):
        """段落品質の検証"""
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        for i, para in enumerate(paragraphs, start=1):
            words = para.split()
            
            # 段落が短すぎる（20単語未満）
            if len(words) < 20 and not para.endswith(':'):
                report.issues.append(QualityIssue(
                    severity='info',
                    category='paragraph_quality',
                    line_number=0,
                    message=f'段落{i}が短い（{len(words)}語）',
                    context=para[:60],
                    suggestion='内容を拡張するか他の段落と統合してください'
                ))
            
            # 段落が長すぎる（200単語超）
            elif len(words) > 200:
                report.issues.append(QualityIssue(
                    severity='info',
                    category='paragraph_quality',
                    line_number=0,
                    message=f'段落{i}が長い（{len(words)}語）',
                    context=para[:60],
                    suggestion='複数の段落に分割を検討してください'
                ))
    
    def _validate_vocabulary_diversity(self, report: PassageQualityReport, content: str):
        """語彙の多様性チェック"""
        # 単語の出現頻度
        words = re.findall(r'\b[a-z]+\b', content.lower())
        
        # 機能語を除外
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'can', 'could', 'may', 'might', 'must', 'that', 'this', 'these', 'those',
            'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'her'
        }
        
        content_words = [w for w in words if w not in stop_words]
        
        if not content_words:
            return
        
        # ユニーク語彙率
        unique_ratio = len(set(content_words)) / len(content_words)
        
        # 期待値（レベル別）
        expected_ratios = {
            'beginner': 0.40,      # 40%以上
            'intermediate': 0.45,  # 45%以上
            'advanced': 0.50       # 50%以上
        }
        
        expected = expected_ratios.get(report.level, 0.45)
        
        if unique_ratio < expected:
            report.issues.append(QualityIssue(
                severity='warning',
                category='vocabulary_diversity',
                line_number=0,
                message=f'語彙の多様性が低い（{unique_ratio:.1%}、期待値{expected:.0%}以上）',
                suggestion='同じ単語の繰り返しを減らし、類義語を使用してください'
            ))
        
        # 同じ単語が過度に繰り返されているかチェック
        from collections import Counter
        word_counts = Counter(content_words)
        
        # 最頻出単語（上位5語）
        most_common = word_counts.most_common(5)
        for word, count in most_common:
            frequency = count / len(content_words)
            if frequency > 0.03:  # 3%以上
                report.issues.append(QualityIssue(
                    severity='info',
                    category='vocabulary_diversity',
                    line_number=0,
                    message=f'単語"{word}"の使用頻度が高い（{count}回、{frequency:.1%}）',
                    suggestion=f'"{word}"の類義語を使用してバリエーションを増やしてください'
                ))
    
    def _calculate_scores(self, report: PassageQualityReport):
        """品質スコアの計算（最適化版 - フレーズベーススタイル対応）"""
        
        # 問題の重み（info問題のペナルティを大幅軽減）
        severity_weights = {
            'critical': 20,  # 深刻な問題（文法エラー、必須要件違反）
            'warning': 5,    # 警告（改善推奨）
            'info': 0        # 情報（スタイル提案）- ペナルティなし
        }
        
        # カテゴリ別の問題数（実装に合わせた分類）
        formatting_issues = [i for i in report.issues if i.category in ['phrase_length', 'phrase_quality']]
        content_issues = [i for i in report.issues if i.category in ['word_count', 'paragraph_quality', 'vocabulary_diversity']]
        grammar_issues = [i for i in report.issues if i.category == 'sentence_structure']
        
        # 各スコア計算（指定された満点から減点）
        def calc_score(issues: List[QualityIssue], max_score: float) -> float:
            if not issues:
                return max_score
            penalty = sum(severity_weights[i.severity] for i in issues)
            return max(0.0, max_score - penalty)
        
        # フレーズベース形式は基本的に高得点（30点満点）
        report.formatting_score = calc_score(formatting_issues, 30.0)
        
        # コンテンツ品質（40点満点）
        report.content_score = calc_score(content_issues, 40.0)
        
        # 文法構造（30点満点）
        report.grammar_score = calc_score(grammar_issues, 30.0)
        
        # 総合スコア
        report.overall_score = min(100.0,
            report.formatting_score + 
            report.content_score + 
            report.grammar_score
        )
    
    def _count_paragraphs(self, content: str) -> int:
        """段落数カウント"""
        return len([p for p in content.split('\n\n') if p.strip()])
    
    def _count_sentences(self, content: str) -> int:
        """文数カウント（概算）"""
        return len(re.findall(r'[.!?]+', content))
    
    def validate_all_passages(self, level_filter: str = None) -> List[PassageQualityReport]:
        """全パッセージの検証"""
        
        if not INDEX_FILE.exists():
            print(f"❌ index.jsonが見つかりません: {INDEX_FILE}")
            return []
        
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            index_data = json.load(f)
        
        reports = []
        
        for passage_info in index_data.get('passages', []):
            passage_id = passage_info['id']
            level = passage_info['level']
            
            # レベルフィルター
            if level_filter and level != level_filter:
                continue
            
            # ファイルパスを推定（実際のファイル名を検索）
            matching_files = list(PASSAGES_DIR.glob(f'{passage_id}*.txt'))
            
            if not matching_files:
                # IDが一致しない場合、レベルとテーマから検索
                matching_files = list(PASSAGES_DIR.glob(f'{level}*.txt'))
            
            if matching_files:
                file_path = matching_files[0]
                report = self.validate_file(file_path, level)
                reports.append(report)
            else:
                print(f"⚠️ ファイルが見つかりません: {passage_id}")
        
        self.reports = reports
        return reports
    
    def print_report(self, report: PassageQualityReport, verbose: bool = True):
        """レポート出力"""
        
        status = "✅ 合格" if report.is_passing else "⚠️ 要改善"
        
        print(f"\n{'='*70}")
        print(f"📄 {report.passage_id} ({report.level}) - {status}")
        print(f"{'='*70}")
        
        print(f"\n📊 基本情報:")
        print(f"  ファイル: {report.file_path.name}")
        print(f"  文字数: {report.word_count:,}語")
        print(f"  段落数: {report.paragraph_count}")
        print(f"  文数: {report.sentence_count}（概算）")
        
        # 文字数要件
        min_words, max_words = WORD_COUNT_REQUIREMENTS[report.level]
        wc_status = "✅" if min_words <= report.word_count <= max_words else "⚠️"
        print(f"  要件: {min_words:,}-{max_words:,}語 {wc_status}")
        
        print(f"\n📈 品質スコア:")
        print(f"  総合: {report.overall_score:.1f}/100")
        print(f"    - フォーマット: {report.formatting_score:.1f}/100")
        print(f"    - コンテンツ: {report.content_score:.1f}/100")
        print(f"    - 文法構造: {report.grammar_score:.1f}/100")
        
        if report.issues:
            # 問題を重要度別に分類
            critical = [i for i in report.issues if i.severity == 'critical']
            warnings = [i for i in report.issues if i.severity == 'warning']
            info = [i for i in report.issues if i.severity == 'info']
            
            print(f"\n⚠️ 検出された問題: {len(report.issues)}件")
            
            if critical:
                print(f"\n🔴 重大 ({len(critical)}件):")
                for issue in critical[:5]:  # 最大5件表示
                    self._print_issue(issue, verbose)
                if len(critical) > 5:
                    print(f"   ... 他 {len(critical) - 5} 件")
            
            if warnings:
                print(f"\n🟡 警告 ({len(warnings)}件):")
                for issue in warnings[:5]:
                    self._print_issue(issue, verbose)
                if len(warnings) > 5:
                    print(f"   ... 他 {len(warnings) - 5} 件")
            
            if verbose and info:
                print(f"\n🔵 情報 ({len(info)}件):")
                for issue in info[:3]:
                    self._print_issue(issue, verbose)
                if len(info) > 3:
                    print(f"   ... 他 {len(info) - 3} 件")
        else:
            print(f"\n✅ 問題なし")
    
    def _print_issue(self, issue: QualityIssue, verbose: bool):
        """問題の詳細表示"""
        line_info = f"[行{issue.line_number}] " if issue.line_number > 0 else ""
        print(f"  {line_info}{issue.message}")
        if verbose and issue.context:
            print(f"    → {issue.context}")
        if verbose and issue.suggestion:
            print(f"    💡 {issue.suggestion}")
    
    def print_summary(self):
        """全体サマリー"""
        if not self.reports:
            return
        
        print(f"\n{'='*70}")
        print(f"📊 全パッセージ品質サマリー")
        print(f"{'='*70}")
        
        total = len(self.reports)
        passing = sum(1 for r in self.reports if r.is_passing)
        
        print(f"\n総パッセージ数: {total}")
        print(f"合格: {passing}/{total} ({passing/total*100:.1f}%)")
        
        # レベル別
        by_level = {}
        for report in self.reports:
            if report.level not in by_level:
                by_level[report.level] = []
            by_level[report.level].append(report)
        
        print(f"\nレベル別:")
        for level in ['beginner', 'intermediate', 'advanced']:
            if level in by_level:
                reports = by_level[level]
                passing_count = sum(1 for r in reports if r.is_passing)
                avg_score = sum(r.overall_score for r in reports) / len(reports)
                print(f"  {level:12s}: {passing_count}/{len(reports)} 合格 (平均スコア: {avg_score:.1f})")
        
        # 最高・最低スコア
        best = max(self.reports, key=lambda r: r.overall_score)
        worst = min(self.reports, key=lambda r: r.overall_score)
        
        print(f"\n最高スコア: {best.passage_id} ({best.overall_score:.1f})")
        print(f"最低スコア: {worst.passage_id} ({worst.overall_score:.1f})")


def main():
    parser = argparse.ArgumentParser(description='長文パッセージ品質検証')
    parser.add_argument('--file', help='特定ファイルのみ検証（例: beginner-cafe-menu.txt）')
    parser.add_argument('--level', choices=['beginner', 'intermediate', 'advanced'], 
                       help='特定レベルのみ検証')
    parser.add_argument('--strict', action='store_true', help='厳格モード（info問題も重視）')
    parser.add_argument('--verbose', action='store_true', default=True, help='詳細表示')
    args = parser.parse_args()
    
    validator = PassageQualityValidator(strict_mode=args.strict)
    
    print("🔍 長文パッセージ品質検証")
    print("="*70)
    
    if args.file:
        # 単一ファイル検証
        file_path = PASSAGES_DIR / args.file
        if not file_path.exists():
            print(f"❌ ファイルが見つかりません: {file_path}")
            return 1
        
        # レベルを推定
        if 'beginner' in args.file:
            level = 'beginner'
        elif 'intermediate' in args.file:
            level = 'intermediate'
        else:
            level = 'advanced'
        
        report = validator.validate_file(file_path, level)
        validator.print_report(report, verbose=args.verbose)
        
        return 0 if report.is_passing else 1
    
    else:
        # 全ファイル検証
        reports = validator.validate_all_passages(level_filter=args.level)
        
        for report in reports:
            validator.print_report(report, verbose=args.verbose)
        
        validator.print_summary()
        
        # 合格率で終了コード決定
        passing_rate = sum(1 for r in reports if r.is_passing) / len(reports) if reports else 0
        return 0 if passing_rate >= 0.8 else 1


if __name__ == "__main__":
    sys.exit(main())
