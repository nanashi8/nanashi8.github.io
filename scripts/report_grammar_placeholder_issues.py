#!/usr/bin/env python3
"""
文法データのプレースホルダー問題を詳細レポート

485件の文法用語が日本語訳に残っている問題を分析し、
各ファイルの詳細な問題リストを生成する
"""

import json
import re
from pathlib import Path
from collections import defaultdict

def analyze_grammar_file(file_path: Path) -> dict:
    """文法ファイルを分析してプレースホルダー問題を検出"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    issues = {
        'file': file_path.name,
        'total_questions': len(data.get('questions', [])),
        'placeholder_japanese': [],
        'placeholder_sentences': [],
        'placeholder_choices': [],
        'missing_translations': []
    }
    
    # 文法用語パターン(数字で終わる)
    terminology_pattern = re.compile(r'^[^。]*\d+。$')
    
    for idx, q in enumerate(data.get('questions', []), 1):
        q_id = q.get('id', f'unknown-{idx}')
        japanese = q.get('japanese', '')
        sentence = q.get('sentence', '')
        choices = q.get('choices', [])
        
        # 日本語訳が文法用語パターンにマッチ
        if terminology_pattern.match(japanese):
            issues['placeholder_japanese'].append({
                'id': q_id,
                'japanese': japanese,
                'sentence': sentence,
                'type': q.get('type', 'unknown')
            })
        
        # プレースホルダー文
        if 'Example sentence' in sentence or '____ blank' in sentence:
            issues['placeholder_sentences'].append({
                'id': q_id,
                'sentence': sentence
            })
        
        # プレースホルダー選択肢
        if any(c in ['choice1', 'choice2', 'choice3'] for c in choices):
            issues['placeholder_choices'].append({
                'id': q_id,
                'choices': choices
            })
    
    return issues

def generate_report(grammar_dir: Path, output_file: Path):
    """全文法ファイルの問題レポートを生成"""
    
    affected_files = [
        'grammar_grade2_unit2.json',
        'grammar_grade2_unit3.json',
        'grammar_grade2_unit4.json',
        'grammar_grade2_unit5.json',
        'grammar_grade2_unit6.json',
        'grammar_grade2_unit7.json',
        'grammar_grade2_unit8.json',
        'grammar_grade2_unit9.json',
        'grammar_grade3_unit7.json'
    ]
    
    all_issues = []
    summary = {
        'total_files': 0,
        'total_placeholder_japanese': 0,
        'total_placeholder_sentences': 0,
        'total_placeholder_choices': 0
    }
    
    for filename in affected_files:
        file_path = grammar_dir / filename
        if not file_path.exists():
            print(f"⚠️  ファイルが見つかりません: {filename}")
            continue
        
        print(f"分析中: {filename}")
        issues = analyze_grammar_file(file_path)
        
        if issues['placeholder_japanese']:
            all_issues.append(issues)
            summary['total_files'] += 1
            summary['total_placeholder_japanese'] += len(issues['placeholder_japanese'])
            summary['total_placeholder_sentences'] += len(issues['placeholder_sentences'])
            summary['total_placeholder_choices'] += len(issues['placeholder_choices'])
    
    # レポート出力
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# 文法データ プレースホルダー問題 詳細レポート\n\n")
        f.write(f"生成日時: {Path(__file__).stat().st_mtime}\n\n")
        
        f.write("## サマリー\n\n")
        f.write(f"- 影響を受けるファイル数: **{summary['total_files']}ファイル**\n")
        f.write(f"- 文法用語が残っている問題数: **{summary['total_placeholder_japanese']}件**\n")
        f.write(f"- プレースホルダー文が残っている問題数: **{summary['total_placeholder_sentences']}件**\n")
        f.write(f"- プレースホルダー選択肢が残っている問題数: **{summary['total_placeholder_choices']}件**\n\n")
        
        f.write("## 重要性\n\n")
        f.write("これらの問題は**実際の問題データではなく、テンプレート・プレースホルダーのまま**になっています。\n")
        f.write("生徒にこのまま出題することはできません。**すべて手動で適切な日本語訳と英文に置き換える必要があります。**\n\n")
        
        f.write("---\n\n")
        
        # 各ファイルの詳細
        for issues in all_issues:
            f.write(f"## {issues['file']}\n\n")
            f.write(f"- 総問題数: {issues['total_questions']}\n")
            f.write(f"- 文法用語パターン: {len(issues['placeholder_japanese'])}件\n")
            f.write(f"- プレースホルダー文: {len(issues['placeholder_sentences'])}件\n")
            f.write(f"- プレースホルダー選択肢: {len(issues['placeholder_choices'])}件\n\n")
            
            if issues['placeholder_japanese']:
                f.write("### 文法用語が残っている問題\n\n")
                
                # タイプ別にグループ化
                by_type = defaultdict(list)
                for item in issues['placeholder_japanese']:
                    by_type[item['type']].append(item)
                
                for q_type, items in sorted(by_type.items()):
                    f.write(f"#### Type: {q_type}\n\n")
                    f.write("| ID | 日本語(文法用語) | 英文 |\n")
                    f.write("|---|---|---|\n")
                    for item in items:
                        japanese = item['japanese'].replace('|', '\\|')
                        sentence = item['sentence'].replace('|', '\\|')
                        f.write(f"| `{item['id']}` | {japanese} | {sentence} |\n")
                    f.write("\n")
            
            f.write("---\n\n")
        
        # アクションアイテム
        f.write("## 次のステップ\n\n")
        f.write("### オプション1: 手動で各問題を修正\n\n")
        f.write("各ファイルを開いて、以下を修正:\n")
        f.write("1. `japanese` フィールド: 文法用語 → 実際の日本語訳\n")
        f.write("2. `sentence` フィールド: プレースホルダー → 実際の英文\n")
        f.write("3. `choices` フィールド: choice1/2/3 → 実際の選択肢\n")
        f.write("4. `explanation` フィールド: 適切な文法説明を追加\n\n")
        
        f.write("### オプション2: 問題を一時的に無効化\n\n")
        f.write("これらのunitを一時的に非表示にして、後で適切なコンテンツを作成:\n")
        f.write("- Grade 2の全unit (unit2-9)\n")
        f.write("- Grade 3のunit7の一部\n\n")
        
        f.write("### オプション3: AI支援での問題生成\n\n")
        f.write("各文法ポイントに対して、AIを使って適切な問題を生成し、\n")
        f.write("人間がレビュー・修正してから反映する。\n\n")
    
    print(f"\n✅ レポート生成完了: {output_file}")
    print(f"\n📊 サマリー:")
    print(f"   - 影響ファイル: {summary['total_files']}件")
    print(f"   - 文法用語: {summary['total_placeholder_japanese']}件")
    print(f"   - プレースホルダー文: {summary['total_placeholder_sentences']}件")
    print(f"   - プレースホルダー選択肢: {summary['total_placeholder_choices']}件")

if __name__ == '__main__':
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    grammar_dir = project_root / 'public' / 'data' / 'grammar'
    output_file = project_root / 'docs' / 'reports' / 'GRAMMAR_PLACEHOLDER_ISSUES.md'
    
    # reportsディレクトリ作成
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    generate_report(grammar_dir, output_file)
