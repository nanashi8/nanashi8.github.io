#!/usr/bin/env python3
"""
文法問題データの高度な品質検証スクリプト

今回発見された問題を検出します:
- 不定詞問題での「To ___」パターンと正解の不一致
- be動詞過去形問題の主語と正解の不一致
- 日本語訳が文法用語になっている
- 選択肢に正解が含まれていない
- 重複パターン (To to等)
"""

import json
import re
import sys
from pathlib import Path
from typing import List, Dict

class AdvancedGrammarValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        
    def validate_file(self, file_path: Path) -> bool:
        """JSONファイルを検証"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            self.errors.append(f"{file_path.name}: ファイル読み込みエラー - {e}")
            return False
        
        # enabledフラグのチェック
        if data.get('enabled') is False:
            # 無効化されたユニットは検証をスキップ
            print(f"⏭️  {file_path.name}: 無効化されています ({data.get('disabledReason', 'No reason')})")
            return True
        
        questions = []
        
        # データ構造を判定
        if 'units' in data:
            # sentence-ordering形式
            for unit in data['units']:
                questions.extend(unit.get('questions', []))
        elif 'questions' in data:
            # grammar_gradeX_unitY形式
            questions = data['questions']
        elif 'data' in data and isinstance(data['data'], list):
            # その他の形式
            questions = data['data']
        
        # 各問題を検証
        for q in questions:
            self._validate_question(q, file_path.name)
        
        return len(self.errors) == 0
    
    def _validate_question(self, q: Dict, filename: str):
        """個別の問題を検証"""
        q_id = q.get('id', 'unknown')
        
        # 1. 不定詞問題の検証
        if 'sentence' in q and 'correctAnswer' in q:
            sentence = q['sentence']
            correct_answer = q['correctAnswer']
            
            if re.match(r'^To\s+_{2,}', sentence):
                if correct_answer.lower().startswith('to '):
                    self.errors.append(
                        f"{filename} [{q_id}]: 不定詞エラー - "
                        f"問題文が'To ___'なのに正解が'{correct_answer}'です。"
                        f"動詞原形のみであるべきです。"
                    )
                
                if 'choices' in q:
                    for choice in q['choices']:
                        if choice.lower().startswith('to '):
                            self.errors.append(
                                f"{filename} [{q_id}]: 不定詞エラー - "
                                f"選択肢に'{choice}'があります。動詞原形のみにしてください。"
                            )
        
        # 2. be動詞過去形の検証
        if 'sentence' in q and 'correctAnswer' in q:
            sentence = q['sentence']
            correct_answer = q['correctAnswer']
            
            if correct_answer in ['was', 'were']:
                match = re.match(r'^(\w+)\s+_{2,}', sentence)
                if match:
                    subject = match.group(1)
                    
                    if subject in ['I', 'He', 'She', 'It'] and correct_answer == 'were':
                        self.errors.append(
                            f"{filename} [{q_id}]: be動詞エラー - "
                            f"主語'{subject}'に'were'は不正です。'was'にしてください。"
                        )
                    elif subject in ['You', 'We', 'They'] and correct_answer == 'was':
                        self.errors.append(
                            f"{filename} [{q_id}]: be動詞エラー - "
                            f"主語'{subject}'に'was'は不正です。'were'にしてください。"
                        )
        
        # 3. 日本語訳の検証（文法用語の完全検出）
        if 'japanese' in q:
            japanese = q['japanese']
            
            # プレースホルダーパターン検出 (文法用語+数字)
            if re.match(r'^[^。]*\d+。$', japanese):
                self.errors.append(
                    f"{filename} [{q_id}]: プレースホルダーエラー - "
                    f"'{japanese}'は文法用語のプレースホルダーです。実際の日本語訳に置き換えてください。"
                )
            
            # 文法用語の包括的検出
            grammar_term_patterns = [
                (r'過去進行形', '過去進行形'),
                (r'過去形', '過去形'),
                (r'現在進行形', '現在進行形'),
                (r'未来形', '未来形'),
                (r'不規則動詞', '不規則動詞'),
                (r'一般動詞', '一般動詞'),
                (r'be動詞', 'be動詞'),
                (r'助動詞', '助動詞'),
                (r'疑問詞', '疑問詞'),
                (r'比較級', '比較級'),
                (r'最上級', '最上級'),
                (r'受動態', '受動態'),
                (r'関係代名詞', '関係代名詞'),
                (r'複数形', '複数形'),
                (r'三人称', '三人称'),
                (r'否定文', '否定文（文法用語）'),
                (r'疑問文', '疑問文（文法用語）'),
                (r'命令文', '命令文（文法用語）'),
                (r'感嘆文', '感嘆文'),
                (r'間接疑問', '間接疑問'),
                (r'現在完了', '現在完了'),
                (r'過去完了', '過去完了'),
                (r'未来完了', '未来完了'),
                (r'分詞', '分詞'),
                (r'動名詞', '動名詞'),
                (r'不定詞', '不定詞'),
                (r'-ing形', '-ing形'),
                (r'-ing。', '-ing形の語尾'),
                (r'-ed形', '-ed形'),
                (r'[a-zA-Z]+の[^。、]+', '〇〇の△△パターン'),
                (r'\w+文[（(]', '〇〇文(パターン'),
                (r'を使う。$', '〇〇を使う'),
                (r'を取る', '〇〇を取る'),
                (r'を重ねる', '〇〇を重ねる'),
                (r'を変える', '〇〇を変える'),
                (r'穴埋め\d+', '穴埋め+数字'),
                (r'並べ替え\d+', '並べ替え+数字'),
            ]
            
            for pattern, name in grammar_term_patterns:
                if re.search(pattern, japanese):
                    self.errors.append(
                        f"{filename} [{q_id}]: 日本語訳エラー - "
                        f"'{japanese}'に文法用語「{name}」が含まれています。"
                        f"英文の意味を表す日本語訳に置き換えてください。"
                    )
                    break
        
        # プレースホルダー英文の検出
        if 'sentence' in q:
            sentence = q['sentence']
            if 'Example sentence' in sentence or '____ blank' in sentence:
                self.errors.append(
                    f"{filename} [{q_id}]: プレースホルダーエラー - "
                    f"英文がプレースホルダーのままです: {sentence}"
                )
        
        # プレースホルダー選択肢の検出
        if 'choices' in q:
            choices = q['choices']
            placeholder_choices = [c for c in choices if c in ['choice1', 'choice2', 'choice3', 'form1', 'form2', 'form3']]
            if placeholder_choices:
                self.errors.append(
                    f"{filename} [{q_id}]: プレースホルダーエラー - "
                    f"選択肢にプレースホルダーが含まれています: {placeholder_choices}"
                )
        
        # 4. 選択肢と正解の整合性
        if 'correctAnswer' in q and 'choices' in q:
            if q['correctAnswer'] not in q['choices']:
                self.errors.append(
                    f"{filename} [{q_id}]: 整合性エラー - "
                    f"正解'{q['correctAnswer']}'が選択肢に含まれていません。"
                )
            
            # 選択肢の品質チェック: 正解が1つなら、他は明確に誤りであること
            self._validate_choice_quality(q, filename)
        
        # 5. 重複パターンの検出
        if 'sentence' in q:
            if re.search(r'\bTo\s+to\b', q['sentence'], re.IGNORECASE):
                self.errors.append(
                    f"{filename} [{q_id}]: 文法エラー - "
                    f"'To to'重複パターン: {q['sentence']}"
                )
        
        if 'correctAnswer' in q:
            if re.search(r'\bTo\s+to\b', q['correctAnswer'], re.IGNORECASE):
                self.errors.append(
                    f"{filename} [{q_id}]: 文法エラー - "
                    f"正解文に'To to'重複: {q['correctAnswer']}"
                )
    
    def _validate_choice_quality(self, q: Dict, filename: str):
        """選択肢の品質を検証"""
        q_id = q.get('id', 'unknown')
        choices = q.get('choices', [])
        correct_answer = q.get('correctAnswer', '')
        explanation = q.get('explanation', '')
        
        # 「どちらでも良い」という説明がある場合の警告
        ambiguous_patterns = [
            r'どちらでも(よ|良)い',
            r'どちらも正しい',
            r'(both|either).*correct',
            r'両方.*可能',
        ]
        
        for pattern in ambiguous_patterns:
            if re.search(pattern, explanation, re.IGNORECASE):
                # 選択肢に複数の正解候補がないかチェック
                potentially_correct = []
                for choice in choices:
                    # 例: "that"と"which"が両方選択肢にあり、説明で「どちらでも良い」と言っている
                    if choice != correct_answer and choice in explanation:
                        potentially_correct.append(choice)
                
                if potentially_correct:
                    self.errors.append(
                        f"{filename} [{q_id}]: 選択肢品質エラー - "
                        f"説明に「{pattern}」とありますが、正解は'{correct_answer}'のみです。"
                        f"他の選択肢{potentially_correct}も正解のように見えます。"
                        f"正解が1つなら、他の選択肢は明確に誤りでなければなりません。"
                        f"説明を修正するか、選択肢を変更してください。"
                    )
                    break
    
    def print_results(self):
        """結果を出力"""
        if self.errors:
            print("\n❌ エラーが見つかりました:\n")
            for error in self.errors:
                print(f"  • {error}")
        
        if self.warnings:
            print("\n⚠️  警告:\n")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        if not self.errors and not self.warnings:
            print("\n✅ すべての高度な検証に合格しました!")
        
        return len(self.errors) == 0


def main():
    """メイン処理"""
    validator = AdvancedGrammarValidator()
    
    base_path = Path(__file__).parent.parent / 'public' / 'data'
    
    # 検証対象ファイルを収集
    files = []
    files.extend(base_path.glob('grammar/*.json'))
    files.extend(base_path.glob('*-questions-grade*.json'))
    files.extend(base_path.glob('sentence-ordering-grade*.json'))
    
    print(f"🔍 {len(files)}個のファイルを高度検証中...\n")
    
    for file_path in files:
        if file_path.exists():
            validator.validate_file(file_path)
    
    success = validator.print_results()
    
    if not success:
        print("\n" + "="*80)
        print("❌ 検証失敗: 上記のエラーを修正してください")
        print("="*80 + "\n")
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
