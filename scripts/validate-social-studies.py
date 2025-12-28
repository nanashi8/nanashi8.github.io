#!/usr/bin/env python3
"""
社会科教材CSVファイルの品質検証スクリプト

用途：
- CSVフォーマットの検証
- 必須列の存在確認
- 年代形式の検証（歴史のみ必須）
- 難易度値の妥当性確認
- 重複チェック
- 関連分野の一貫性確認
- 読み仮名の妥当性確認

使用例：
python3 scripts/validate-social-studies.py local-data-packs/social-studies-sample.csv
python3 scripts/validate-social-studies.py local-data-packs/social-studies-sample.csv --verbose
python3 scripts/validate-social-studies.py local-data-packs/social-studies-sample.csv --output report.json
"""

import csv
import json
import re
import sys
from typing import List, Dict, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path

# ===== 定数 =====

REQUIRED_COLUMNS = [
    '語句', '読み', '事項', '問題文', '説明', '関連事項',
    '関連分野', '難易度', 'source', '年代', '選択肢生成ヒント'
]

VALID_DIFFICULTIES = ['1', '2', '3', '4', '5']

VALID_RELATED_FIELDS = [
    '歴史-古代', '歴史-中世', '歴史-近世', '歴史-近代', '歴史-現代',
    '地理-日本', '地理-世界', '地理-産業', '地理-環境',
    '公民-政治', '公民-経済', '公民-国際', '公民-人権'
]

HIRAGANA_PATTERN = re.compile(r'^[ぁ-んー、。]+$')
YEAR_PATTERN = re.compile(r'^\d{4}$')

# ===== データクラス =====

@dataclass
class ValidationIssue:
    severity: str  # 'error', 'warning', 'info'
    line: int
    field: str
    message: str
    value: str = ''

@dataclass
class ValidationReport:
    file_path: str
    total_rows: int
    valid_rows: int
    issues: List[ValidationIssue]
    quality_score: int
    passed: bool

# ===== 検証関数 =====

def validate_headers(headers: List[str]) -> List[ValidationIssue]:
    """ヘッダー検証"""
    issues = []
    
    # 必須列の存在確認
    for col in REQUIRED_COLUMNS:
        if col not in headers:
            issues.append(ValidationIssue(
                severity='error',
                line=1,
                field='header',
                message=f'必須列「{col}」が見つかりません'
            ))
    
    # 列順の確認（推奨）
    for index, col in enumerate(REQUIRED_COLUMNS):
        if index < len(headers) and headers[index] != col:
            issues.append(ValidationIssue(
                severity='warning',
                line=1,
                field='header',
                message=f'列の順序が推奨と異なります。期待: {col}, 実際: {headers[index]}'
            ))
    
    return issues

def validate_row(row: Dict[str, str], line_number: int, all_rows: List[Dict[str, str]]) -> List[ValidationIssue]:
    """行データの検証"""
    issues = []
    
    # 1. 必須フィールドの存在確認
    if not row.get('語句', '').strip():
        issues.append(ValidationIssue('error', line_number, '語句', '語句が空です'))
    
    if not row.get('問題文', '').strip():
        issues.append(ValidationIssue('error', line_number, '問題文', '問題文が空です'))
    
    if not row.get('説明', '').strip():
        issues.append(ValidationIssue('error', line_number, '説明', '説明が空です'))
    
    # 2. 読み仮名の検証
    yomi = row.get('読み', '').strip()
    if yomi:
        if not HIRAGANA_PATTERN.match(yomi):
            issues.append(ValidationIssue(
                'warning', line_number, '読み',
                '読み仮名にひらがな以外の文字が含まれています',
                yomi
            ))
    else:
        issues.append(ValidationIssue('warning', line_number, '読み', '読み仮名が空です'))
    
    # 3. 難易度の検証
    difficulty = row.get('難易度', '').strip()
    if difficulty not in VALID_DIFFICULTIES:
        issues.append(ValidationIssue(
            'error', line_number, '難易度',
            f'難易度は1-5の整数である必要があります',
            difficulty
        ))
    
    # 4. 関連分野の検証
    related_fields = row.get('関連分野', '').strip()
    if related_fields:
        fields = [f.strip() for f in related_fields.split('|')]
        for field in fields:
            if field not in VALID_RELATED_FIELDS:
                issues.append(ValidationIssue(
                    'warning', line_number, '関連分野',
                    f'不明な関連分野: {field}',
                    field
                ))
        
        # 歴史分野の場合、年代が必須
        is_history = any(f.startswith('歴史-') for f in fields)
        if is_history:
            year = row.get('年代', '').strip()
            if not year:
                issues.append(ValidationIssue(
                    'error', line_number, '年代',
                    '歴史分野の問題には年代（4桁西暦）が必須です'
                ))
            elif not YEAR_PATTERN.match(year):
                issues.append(ValidationIssue(
                    'error', line_number, '年代',
                    '年代は4桁の西暦である必要があります',
                    year
                ))
            else:
                year_int = int(year)
                if year_int < 500 or year_int > 2100:
                    issues.append(ValidationIssue(
                        'warning', line_number, '年代',
                        '年代が極端な値です。確認してください',
                        year
                    ))
    else:
        issues.append(ValidationIssue('error', line_number, '関連分野', '関連分野が空です'))
    
    # 5. 問題文の品質チェック
    question = row.get('問題文', '')
    if len(question) < 10:
        issues.append(ValidationIssue(
            'warning', line_number, '問題文',
            '問題文が短すぎる可能性があります（10文字未満）',
            question
        ))
    
    if '？' not in question and '?' not in question:
        issues.append(ValidationIssue(
            'info', line_number, '問題文',
            '問題文に疑問符（？）が含まれていません'
        ))
    
    # 6. 説明文の品質チェック
    explanation = row.get('説明', '')
    if len(explanation) < 20:
        issues.append(ValidationIssue(
            'warning', line_number, '説明',
            '説明が短すぎる可能性があります（20文字未満）',
            explanation
        ))
    
    # 7. 語句の重複チェック
    term = row.get('語句', '')
    duplicates = [r for r in all_rows if r.get('語句') == term]
    if len(duplicates) > 1:
        issues.append(ValidationIssue(
            'warning', line_number, '語句',
            f'語句「{term}」が重複しています（{len(duplicates)}件）'
        ))
    
    # 8. 選択肢生成ヒントの検証
    hints = row.get('選択肢生成ヒント', '').strip()
    if hints:
        hint_list = [h.strip() for h in hints.split('|')]
        if len(hint_list) < 2:
            issues.append(ValidationIssue(
                'info', line_number, '選択肢生成ヒント',
                '選択肢生成ヒントは2つ以上推奨です（|区切り）'
            ))
    
    # 9. 語句と説明の整合性チェック
    if term and term not in explanation:
        issues.append(ValidationIssue(
            'info', line_number, '説明',
            f'説明に語句「{term}」が含まれていません（確認推奨）'
        ))
    
    return issues

def calculate_quality_score(total_rows: int, errors: int, warnings: int, infos: int) -> int:
    """品質スコアの計算（100点満点）"""
    if total_rows == 0:
        return 0
    
    score = 100
    score -= errors * 10
    score -= warnings * 3
    score -= infos * 1
    
    return max(0, score)

def validate_file(file_path: str) -> ValidationReport:
    """CSVファイルの検証"""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            
            # ヘッダー検証
            header_issues = validate_headers(headers)
            issues.extend(header_issues)
            
            # ヘッダーエラーがあれば中断
            if any(i.severity == 'error' for i in header_issues):
                return ValidationReport(
                    file_path=file_path,
                    total_rows=0,
                    valid_rows=0,
                    issues=issues,
                    quality_score=0,
                    passed=False
                )
            
            # 行データの読み込みと検証
            rows = list(reader)
            valid_rows = 0
            
            for index, row in enumerate(rows, start=2):  # ヘッダーが1行目
                row_issues = validate_row(row, index, rows)
                issues.extend(row_issues)
                
                if not any(i.severity == 'error' for i in row_issues):
                    valid_rows += 1
            
            # サマリー計算
            errors = sum(1 for i in issues if i.severity == 'error')
            warnings = sum(1 for i in issues if i.severity == 'warning')
            infos = sum(1 for i in issues if i.severity == 'info')
            
            quality_score = calculate_quality_score(len(rows), errors, warnings, infos)
            passed = quality_score >= 80 and errors == 0
            
            return ValidationReport(
                file_path=file_path,
                total_rows=len(rows),
                valid_rows=valid_rows,
                issues=issues,
                quality_score=quality_score,
                passed=passed
            )
    
    except Exception as e:
        issues.append(ValidationIssue('error', 0, 'file', f'ファイル読み込みエラー: {str(e)}'))
        return ValidationReport(
            file_path=file_path,
            total_rows=0,
            valid_rows=0,
            issues=issues,
            quality_score=0,
            passed=False
        )

def display_report(report: ValidationReport, verbose: bool = False):
    """レポートの表示"""
    print('=' * 42)
    print('社会科教材品質検証レポート')
    print('=' * 42)
    print()
    print(f'ファイル: {report.file_path}')
    print(f'総行数: {report.total_rows}')
    print(f'有効行数: {report.valid_rows}')
    print()
    
    errors = [i for i in report.issues if i.severity == 'error']
    warnings = [i for i in report.issues if i.severity == 'warning']
    infos = [i for i in report.issues if i.severity == 'info']
    
    print('問題サマリー:')
    print(f'  エラー: {len(errors)}')
    print(f'  警告: {len(warnings)}')
    print(f'  情報: {len(infos)}')
    print()
    print(f'品質スコア: {report.quality_score}/100')
    print(f'判定: {"✅ 合格（80点以上）" if report.passed else "❌ 不合格（80点未満またはエラーあり）"}')
    print()
    
    if report.issues:
        print('詳細:')
        print('-' * 42)
        
        if errors:
            print('\n🔴 エラー:')
            for issue in errors:
                print(f'  [行{issue.line}] {issue.field}: {issue.message}')
                if issue.value and verbose:
                    print(f'    値: "{issue.value}"')
        
        if warnings:
            print('\n🟡 警告:')
            for issue in warnings:
                print(f'  [行{issue.line}] {issue.field}: {issue.message}')
                if issue.value and verbose:
                    print(f'    値: "{issue.value}"')
        
        if infos and verbose:
            print('\nℹ️ 情報:')
            for issue in infos:
                print(f'  [行{issue.line}] {issue.field}: {issue.message}')
                if issue.value:
                    print(f'    値: "{issue.value}"')
    else:
        print('✅ 問題は見つかりませんでした！')
    
    print()
    print('=' * 42)

def main():
    """メイン処理"""
    import argparse
    
    parser = argparse.ArgumentParser(description='社会科教材CSVファイルの品質検証')
    parser.add_argument('file', help='検証するCSVファイルのパス')
    parser.add_argument('--verbose', '-v', action='store_true', help='詳細表示（情報レベルの問題も表示）')
    parser.add_argument('--output', '-o', help='JSON形式でレポートを出力するファイルパス')
    parser.add_argument('--strict', action='store_true', help='厳格モード（警告もエラーとして扱う）')
    
    args = parser.parse_args()
    
    if not Path(args.file).exists():
        print(f'エラー: ファイルが見つかりません: {args.file}', file=sys.stderr)
        sys.exit(1)
    
    report = validate_file(args.file)
    display_report(report, args.verbose)
    
    if args.output:
        output_data = {
            'file_path': report.file_path,
            'total_rows': report.total_rows,
            'valid_rows': report.valid_rows,
            'quality_score': report.quality_score,
            'passed': report.passed,
            'summary': {
                'errors': len([i for i in report.issues if i.severity == 'error']),
                'warnings': len([i for i in report.issues if i.severity == 'warning']),
                'infos': len([i for i in report.issues if i.severity == 'info'])
            },
            'issues': [asdict(i) for i in report.issues]
        }
        
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        print(f'レポートを出力しました: {args.output}')
    
    # 終了コード（CIで使用可能）
    if not report.passed:
        sys.exit(1)

if __name__ == '__main__':
    main()
