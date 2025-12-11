#!/usr/bin/env python3
"""
文法・和訳タブの日本語品質検証スクリプト

grammar_*.json, fill-in-blank*.json, sentence-ordering*.json 等の
日本語フィールド（japanese, explanation, hint）の品質を検証します。
"""

import json
from pathlib import Path
from typing import List, Dict, Set

# カラーコード
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class GrammarTranslationValidator:
    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.data_dir = base_path / 'public/data'
        self.errors = []
        self.warnings = []
        self.stats = {
            'total_files': 0,
            'total_questions': 0,
            'empty_japanese': 0,
            'empty_explanation': 0,
            'unnatural_expressions': 0,
            'grammar_term_issues': 0,
            'explanation_clarity': 0,
            'inconsistent_terminology': 0,
        }
        
        # 文法用語の統一チェック用
        self.grammar_terms = {}
    
    def validate_all(self) -> bool:
        """全JSONファイルを検証"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}文法・和訳タブ 日本語品質検証{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        if not self.data_dir.exists():
            self.errors.append(f"❌ ディレクトリが見つかりません: {self.data_dir}")
            self.print_report()
            return False
        
        # 検証対象ファイルのパターン
        # 注: fill-in-blank*.jsonは異なる構造（units配列）のため除外
        patterns = [
            'grammar_grade*.json',
            'sentence-ordering*.json',
            'verb-form*.json',
        ]
        
        json_files = []
        for pattern in patterns:
            json_files.extend(self.data_dir.glob(pattern))
        
        json_files = sorted(set(json_files))
        self.stats['total_files'] = len(json_files)
        
        print(f"検証対象: {len(json_files)} ファイル\n")
        
        for json_file in json_files:
            self.validate_file(json_file)
        
        self.print_report()
        return len(self.errors) == 0
    
    def validate_file(self, json_path: Path):
        """個別JSONファイルを検証"""
        try:
            data = json.loads(json_path.read_text(encoding='utf-8'))
        except Exception as e:
            self.errors.append(f"❌ {json_path.name}: JSON読み込みエラー - {e}")
            return
        
        if 'questions' not in data:
            self.warnings.append(f"⚠️  {json_path.name}: 'questions' フィールドがありません")
            return
        
        questions = data['questions']
        self.stats['total_questions'] += len(questions)
        
        file_errors = 0
        file_warnings = 0
        
        for question in questions:
            q_id = question.get('id', '?')
            japanese = question.get('japanese', '')
            explanation = question.get('explanation', '')
            hint = question.get('hint', '')
            
            # 検証1: 必須フィールドの存在
            if not japanese:
                self.errors.append(
                    f"❌ {json_path.name}: 問題#{q_id} - japanese フィールドが空です"
                )
                self.stats['empty_japanese'] += 1
                file_errors += 1
            
            if not explanation:
                self.warnings.append(
                    f"⚠️  {json_path.name}: 問題#{q_id} - explanation がありません"
                )
                self.stats['empty_explanation'] += 1
                file_warnings += 1
            
            # 検証2: japanese の品質
            if japanese:
                issues = self.validate_japanese_sentence(json_path.name, q_id, japanese)
                file_warnings += len(issues)
            
            # 検証3: explanation の品質
            if explanation:
                issues = self.validate_explanation(json_path.name, q_id, explanation)
                file_warnings += len(issues)
            
            # 検証4: hint の品質
            if hint:
                issues = self.validate_hint(json_path.name, q_id, hint)
                file_warnings += len(issues)
        
        # ファイル単位のサマリー
        status = f"{GREEN}✓{RESET}" if file_errors == 0 else f"{RED}✗{RESET}"
        print(f"{status} {json_path.name}: {len(questions)} 問題 "
              f"(エラー: {file_errors}, 警告: {file_warnings})")
    
    def validate_japanese_sentence(self, filename: str, q_id: str, japanese: str) -> List[str]:
        """日本語文の品質チェック"""
        issues = []
        
        # 1. 文末が適切か（です・ます調 or だ・である調）
        if not any(japanese.endswith(end) for end in 
                   ['。', 'か', 'ます', 'です', 'た', 'ない', 'ません', 'でした', 'ました']):
            self.warnings.append(
                f"⚠️  {filename}: 問題#{q_id} - japanese の文末が不自然\n"
                f"    文: {japanese}"
            )
            issues.append('文末')
        
        # 2. 冗長な表現（文法問題では簡潔さが重要）
        redundant_patterns = [
            ('〜することができます', '〜できます'),
            ('〜することが可能です', '〜できます'),
            ('において', 'で'),
            ('に関して', 'について'),
        ]
        
        for pattern, suggestion in redundant_patterns:
            if pattern in japanese:
                self.warnings.append(
                    f"⚠️  {filename}: 問題#{q_id} - 冗長表現: '{pattern}' → '{suggestion}'\n"
                    f"    文: {japanese}"
                )
                self.stats['unnatural_expressions'] += 1
                issues.append(pattern)
        
        # 3. 不自然な直訳
        if '私は' in japanese and japanese.count('私は') > 1:
            self.warnings.append(
                f"⚠️  {filename}: 問題#{q_id} - '私は' が重複しています\n"
                f"    文: {japanese}"
            )
            issues.append('重複')
        
        return issues
    
    def validate_explanation(self, filename: str, q_id: str, explanation: str) -> List[str]:
        """explanation（解説）の品質チェック"""
        issues = []
        
        # 1. 長さチェック（短すぎる解説は不親切）
        if len(explanation) < 10:
            self.warnings.append(
                f"⚠️  {filename}: 問題#{q_id} - explanation が短すぎます（{len(explanation)}文字）\n"
                f"    解説: {explanation}"
            )
            self.stats['explanation_clarity'] += 1
            issues.append('短い')
        
        # 2. 文法用語の一貫性チェック
        grammar_terms = {
            '一般動詞': ['普通動詞', '動作動詞'],  # 統一すべき用語
            'be動詞': ['ビー動詞', 'be-動詞'],
            '三人称単数': ['3人称単数', '三単現'],
            '過去形': ['過去時制'],
            '現在完了': ['現在完了形', '完了形'],
        }
        
        for standard_term, variants in grammar_terms.items():
            for variant in variants:
                if variant in explanation:
                    self.warnings.append(
                        f"⚠️  {filename}: 問題#{q_id} - 文法用語の不統一: '{variant}' → '{standard_term}'\n"
                        f"    解説: {explanation[:100]}..."
                    )
                    self.stats['inconsistent_terminology'] += 1
                    issues.append(variant)
        
        # 3. 記号の使い方
        if '×' in explanation or '○' in explanation:
            # ×や○を使っている場合、説明があるか
            if '×' in explanation:
                parts = explanation.split('×')
                if len(parts) > 1 and len(parts[1].strip()) < 5:
                    self.warnings.append(
                        f"⚠️  {filename}: 問題#{q_id} - ×の後の説明が不十分\n"
                        f"    解説: {explanation}"
                    )
                    issues.append('×説明不足')
        
        # 4. 専門用語の難易度チェック（中学生向けとして適切か）
        # 注: 補語、主格、目的格、所有格などは中学校で習う正式な文法用語なので除外
        difficult_terms = [
            '鑑みる', '斯く', '然るべき', '概ね', '顕著', '凡そ', '寧ろ', '殊に', '須く',
            # 以下は高校レベルの文法用語
            '仮定法', '倒置', '強調構文', '分詞構文', '関係副詞',
        ]
        
        for term in difficult_terms:
            if term in explanation:
                self.warnings.append(
                    f"⚠️  {filename}: 問題#{q_id} - 中学生には難しい用語: '{term}'\n"
                    f"    解説: {explanation[:100]}..."
                )
                self.stats['grammar_term_issues'] += 1
                issues.append(term)
        
        return issues
    
    def validate_hint(self, filename: str, q_id: str, hint: str) -> List[str]:
        """hint（ヒント）の品質チェック"""
        issues = []
        
        # 1. ヒントが長すぎないか（簡潔であるべき）
        if len(hint) > 30:
            self.warnings.append(
                f"⚠️  {filename}: 問題#{q_id} - hint が長すぎます（{len(hint)}文字）\n"
                f"    ヒント: {hint}"
            )
            issues.append('長い')
        
        # 2. ヒントが答えそのものになっていないか
        obvious_hints = ['答えは', 'これが正解', '選べば', 'を選ぶ']
        for pattern in obvious_hints:
            if pattern in hint:
                self.warnings.append(
                    f"⚠️  {filename}: 問題#{q_id} - hint が答えを示唆しすぎています\n"
                    f"    ヒント: {hint}"
                )
                issues.append('明示的すぎ')
        
        return issues
    
    def print_report(self):
        """検証結果レポート"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}検証結果サマリー{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        print(f"総ファイル数: {self.stats['total_files']}")
        print(f"総問題数: {self.stats['total_questions']}")
        print()
        
        if self.stats['empty_japanese'] > 0:
            print(f"{RED}空のjapanese: {self.stats['empty_japanese']} 件{RESET}")
        
        if self.stats['empty_explanation'] > 0:
            print(f"{YELLOW}空のexplanation: {self.stats['empty_explanation']} 件{RESET}")
        
        print()
        
        # 品質の統計
        if any([
            self.stats['unnatural_expressions'],
            self.stats['grammar_term_issues'],
            self.stats['explanation_clarity'],
            self.stats['inconsistent_terminology']
        ]):
            print(f"{YELLOW}日本語品質の問題:{RESET}")
            
            if self.stats['unnatural_expressions'] > 0:
                print(f"  {YELLOW}冗長・不自然な表現: {self.stats['unnatural_expressions']} 件{RESET}")
            
            if self.stats['grammar_term_issues'] > 0:
                print(f"  {YELLOW}難しすぎる文法用語: {self.stats['grammar_term_issues']} 件{RESET}")
            
            if self.stats['explanation_clarity'] > 0:
                print(f"  {YELLOW}説明が不十分: {self.stats['explanation_clarity']} 件{RESET}")
            
            if self.stats['inconsistent_terminology'] > 0:
                print(f"  {YELLOW}用語の不統一: {self.stats['inconsistent_terminology']} 件{RESET}")
            
            print()
        
        print()
        
        if self.warnings:
            print(f"{YELLOW}警告 ({len(self.warnings)}件):{RESET}")
            for warning in self.warnings[:10]:
                print(f"  {warning}")
            if len(self.warnings) > 10:
                print(f"  {YELLOW}... 他 {len(self.warnings) - 10} 件{RESET}")
            print()
        
        if self.errors:
            print(f"{RED}エラー ({len(self.errors)}件):{RESET}")
            for error in self.errors[:10]:
                print(f"  {error}")
            if len(self.errors) > 10:
                print(f"  {RED}... 他 {len(self.errors) - 10} 件{RESET}")
            print(f"\n{RED}❌ 文法・和訳タブに問題があります{RESET}\n")
            return False
        else:
            print(f"{GREEN}✓ 文法・和訳タブの日本語は適切です{RESET}\n")
            return True


def main():
    """メイン処理"""
    base_path = Path(__file__).parent.parent / 'nanashi8.github.io'
    
    if not base_path.exists():
        print(f"{RED}エラー: プロジェクトディレクトリが見つかりません: {base_path}{RESET}")
        return 1
    
    validator = GrammarTranslationValidator(base_path)
    success = validator.validate_all()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())
