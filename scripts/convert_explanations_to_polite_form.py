#!/usr/bin/env python3
"""
文法問題の解説文を丁寧語に変換するスクリプト
"""

import json
import re
from pathlib import Path


def convert_to_polite_form(text: str) -> str:
    """
    解説文を丁寧語に変換する
    
    変換ルール:
    1. 「～を使う」→「～を使います」
    2. 「～である」→「～です」
    3. 「～は誤り」→「～は誤りです」
    4. 「～になる」→「～になります」
    5. 「～を表す」→「～を表します」
    6. 「～がある」→「～があります」
    7. 体言止めは「～です」を追加
    """
    if not text:
        return text
    
    # 既に丁寧語になっている場合はスキップ
    if text.endswith('ます。') or text.endswith('です。'):
        return text
    
    result = text
    
    # 1. 動詞の変換（より具体的なパターンから順に）
    replacements = [
        # 特定の動詞パターン
        (r'を使う([。、])', r'を使います\1'),
        (r'使う([。、])', r'使います\1'),
        (r'になる([。、])', r'になります\1'),
        (r'を表す([。、])', r'を表します\1'),
        (r'表す([。、])', r'表します\1'),
        (r'がある([。、])', r'があります\1'),
        (r'である([。、])', r'です\1'),
        (r'を付ける([。、])', r'を付けます\1'),
        (r'付ける([。、])', r'付けます\1'),
        (r'を取る([。、])', r'を取ります\1'),
        (r'取る([。、])', r'取ります\1'),
        (r'決まる([。、])', r'決まります\1'),
        (r'注意する([。、])', r'注意してください\1'),
        (r'覚える([。、])', r'覚えましょう\1'),
        (r'確認する([。、])', r'確認してください\1'),
        (r'を入れる([。、])', r'を入れます\1'),
        (r'入れる([。、])', r'入れます\1'),
        (r'を選ぶ([。、])', r'を選びます\1'),
        (r'選ぶ([。、])', r'選びます\1'),
        (r'を作る([。、])', r'を作ります\1'),
        (r'作る([。、])', r'作ります\1'),
        (r'示す([。、])', r'示します\1'),
        (r'異なる([。、])', r'異なります\1'),
        (r'変わる([。、])', r'変わります\1'),
        (r'を変える([。、])', r'を変えます\1'),
        (r'変える([。、])', r'変えます\1'),
        (r'続く([。、])', r'続きます\1'),
        (r'含む([。、])', r'含みます\1'),
        (r'混同しやすい([。、])', r'混同しやすいです\1'),
        
        # 誤りパターン
        (r'は誤り([。、])', r'は誤りです\1'),
        (r'は間違い([。、])', r'は間違いです\1'),
        (r'×([^。]+)は誤り', r'×\1は誤りです'),
        
        # 注意パターン
        (r'注意([。、])', r'注意してください\1'),
        
        # 体言止めパターン（文末が名詞で終わる場合）
        (r'基本パターン。', r'基本パターンです。'),
        (r'基本形。', r'基本形です。'),
        (r'主語で決まる([：。])', r'主語によって決まります\1'),
        (r'で決まる([。、])', r'で決まります\1'),
    ]
    
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result)
    
    # 文末処理: 。で終わっているが「です」「ます」で終わっていない場合
    sentences = result.split('。')
    polite_sentences = []
    
    for i, sentence in enumerate(sentences):
        if not sentence.strip():
            continue
            
        s = sentence.strip()
        
        # 最後の文または途中の文
        if s:
            # 既に丁寧語で終わっている場合はそのまま
            if s.endswith('ます') or s.endswith('です') or s.endswith('ましょう') or s.endswith('ください'):
                polite_sentences.append(s)
            # コロンで終わる場合はそのまま（例示の前など）
            elif s.endswith('：') or s.endswith(':'):
                polite_sentences.append(s)
            # ×マークで始まる誤り例の場合
            elif '×' in s and 'は誤り' not in s and 'は間違い' not in s:
                # 既に処理済みでなければそのまま
                polite_sentences.append(s)
            else:
                # その他の場合、文末に適切な丁寧語を追加
                # 動詞で終わっている可能性がある場合
                if re.search(r'[るすくつぬぶむゆう]$', s):
                    # 基本的には「ます」を追加
                    s = re.sub(r'る$', r'ります', s)
                    s = re.sub(r'す$', r'します', s) 
                    s = re.sub(r'く$', r'きます', s)
                    s = re.sub(r'つ$', r'ちます', s)
                    s = re.sub(r'ぬ$', r'にます', s)
                    s = re.sub(r'ぶ$', r'びます', s)
                    s = re.sub(r'む$', r'みます', s)
                    s = re.sub(r'ゆ$', r'よいます', s)
                    s = re.sub(r'う$', r'います', s)
                    polite_sentences.append(s)
                # 名詞や形容動詞で終わっている場合
                else:
                    polite_sentences.append(s + 'です')
    
    result = '。'.join(polite_sentences)
    if not result.endswith('。'):
        result += '。'
    
    return result


def process_grammar_file(file_path: Path) -> bool:
    """
    1つの文法ファイルを処理する
    
    Returns:
        bool: 変更があった場合True
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        changed = False
        
        # 各問題のexplanationフィールドを変換
        # 'questions'または'problems'キーを探す
        questions_key = 'questions' if 'questions' in data else 'problems' if 'problems' in data else None
        
        if questions_key:
            for problem in data[questions_key]:
                if 'explanation' in problem and problem['explanation']:
                    original = problem['explanation']
                    converted = convert_to_polite_form(original)
                    
                    if original != converted:
                        problem['explanation'] = converted
                        changed = True
                        print(f"\n変換例 ({file_path.name}):")
                        print(f"  前: {original}")
                        print(f"  後: {converted}")
        
        # 変更があった場合のみファイルを保存
        if changed:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✓ 更新: {file_path.name}")
            return True
        else:
            print(f"  変更なし: {file_path.name}")
            return False
            
    except Exception as e:
        print(f"✗ エラー ({file_path.name}): {e}")
        return False


def main():
    """メイン処理"""
    # 文法ファイルのディレクトリ
    grammar_dir = Path(__file__).parent.parent / 'public' / 'data' / 'grammar'
    
    if not grammar_dir.exists():
        print(f"エラー: ディレクトリが見つかりません: {grammar_dir}")
        return
    
    # すべての文法ファイルを取得
    grammar_files = sorted(grammar_dir.glob('grammar_*.json'))
    
    if not grammar_files:
        print("文法ファイルが見つかりません")
        return
    
    print(f"対象ファイル数: {len(grammar_files)}")
    print("=" * 60)
    
    # 各ファイルを処理
    changed_count = 0
    for file_path in grammar_files:
        if process_grammar_file(file_path):
            changed_count += 1
    
    print("=" * 60)
    print(f"\n完了: {changed_count}/{len(grammar_files)} ファイルを更新しました")


if __name__ == '__main__':
    main()
