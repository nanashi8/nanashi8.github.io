#!/usr/bin/env python3
"""
文法問題の日本語訳を修正するスクリプト
文法用語になっている日本語訳を適切な日本語訳に置き換えます
"""

import json
from pathlib import Path

# 修正する日本語訳の辞書 {問題ID: 正しい日本語訳}
TRANSLATION_FIXES = {
    # grammar_grade1_unit0.json
    "g1-u0-para-002": "彼は先生ではありません。",
    "g1-u0-conv-005": "はい、そうです。",
    
    # grammar_grade1_unit1.json
    "g1-u1-para-009": "私はサッカーが大好きです。",
    
    # grammar_grade1_unit3.json
    "g1-u3-para-001": "これらは本です。",
    "g1-u3-para-002": "あれらは車です。",
    "g1-u3-para-003": "これはペンです。",
    "g1-u3-para-004": "あれは私のバッグです。",
    "g1-u3-para-009": "あれらは私の友達です。",
    
    # grammar_grade1_unit5.json
    "g1-u5-para-008": "彼女は英語を話せません。",
    
    # grammar_grade1_unit6.json
    "g1-u6-para-014": "彼は寝ていません。",
    
    # grammar_grade1_unit7.json
    "g1-u7-para-001": "ドアを開けなさい。",
    "g1-u7-para-002": "走らないでください。",
    "g1-u7-para-003": "寝なさい。",
    "g1-u7-para-004": "一緒にサッカーをしましょう。",
    "g1-u7-para-006": "ここに座らないでください。",
    "g1-u7-para-007": "窓を閉めてください。",
    "g1-u7-para-008": "バスケをしましょうか。",
    "g1-u7-para-010": "注意しなさい。",
    "g1-u7-para-012": "うるさくしないでください。",
    "g1-u7-para-015": "休んだらどうですか。",
    
    # grammar_grade2_unit0.json
    "g2-u0-para-001": "私は忙しかった。",
    "g2-u0-para-002": "彼らは幸せでした。",
    "g2-u0-para-003": "彼は疲れていました。",
    "g2-u0-para-004": "私は家にいませんでした。",
    "g2-u0-para-005": "彼らは先生ではありませんでした。",
    "g2-u0-para-006": "彼女は幸せでしたか。",
    "g2-u0-para-007": "あなたは忙しかったですか。",
    "g2-u0-para-008": "彼は先生です。",
    "g2-u0-para-009": "私たちは友達です。",
    
    # grammar_grade2_unit1.json
    "g2-u1-para-001": "私は勉強していました。",
    "g2-u1-para-002": "彼らは遊んでいました。",
    "g2-u1-para-003": "彼女は読んでいました。",
    "g2-u1-para-004": "私はテレビを見ていませんでした。",
    "g2-u1-para-005": "彼らは走っていませんでした。",
    "g2-u1-para-006": "彼女は歌っていましたか。",
    "g2-u1-para-007": "あなたは寝ていましたか。",
    "g2-u1-para-008": "私は昼食を食べました。",
    "g2-u1-para-009": "彼女はテニスをしていました。",
}

def fix_grammar_file(file_path: Path, question_id: str, new_japanese: str) -> bool:
    """
    文法ファイル内の特定の問題の日本語訳を修正する
    
    Args:
        file_path: JSONファイルのパス
        question_id: 問題のID
        new_japanese: 新しい日本語訳
    
    Returns:
        修正が成功したかどうか
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 問題を探して修正
        found = False
        for question in data.get('questions', []):
            if question.get('id') == question_id:
                old_japanese = question.get('japanese', '')
                question['japanese'] = new_japanese
                print(f"✓ {question_id}: '{old_japanese}' → '{new_japanese}'")
                found = True
                break
        
        if not found:
            print(f"✗ {question_id}: 問題が見つかりませんでした")
            return False
        
        # ファイルに書き戻す
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return True
        
    except Exception as e:
        print(f"✗ エラー: {file_path} - {e}")
        return False

def main():
    """メイン処理"""
    data_dir = Path(__file__).parent.parent / 'public' / 'data' / 'grammar'
    
    # ファイルごとに問題IDをグループ化
    file_groups = {}
    for question_id, new_japanese in TRANSLATION_FIXES.items():
        # 問題IDからファイル名を推測 (例: g1-u0-para-002 → grammar_grade1_unit0.json)
        parts = question_id.split('-')
        grade = parts[0][1:]  # g1 → 1
        unit = parts[1][1:]  # u0 → 0
        
        file_name = f"grammar_grade{grade}_unit{unit}.json"
        
        if file_name not in file_groups:
            file_groups[file_name] = []
        file_groups[file_name].append((question_id, new_japanese))
    
    # ファイルごとに処理
    total_fixes = 0
    successful_fixes = 0
    
    for file_name, fixes in sorted(file_groups.items()):
        file_path = data_dir / file_name
        print(f"\n{'='*60}")
        print(f"ファイル: {file_name}")
        print(f"{'='*60}")
        
        if not file_path.exists():
            print(f"✗ ファイルが見つかりません: {file_path}")
            continue
        
        for question_id, new_japanese in fixes:
            total_fixes += 1
            if fix_grammar_file(file_path, question_id, new_japanese):
                successful_fixes += 1
    
    # 結果のサマリー
    print(f"\n{'='*60}")
    print(f"修正完了: {successful_fixes}/{total_fixes} 件")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
