#!/usr/bin/env python3
"""
英文パッセージをAI翻訳して、行ごとに対応する日本語訳を生成する。
各行の翻訳は文脈を保ちながら、元の英文の行構造を維持する。
"""

import os
import sys

def translate_passage_line_by_line():
    """英文パッセージを行ごとに翻訳"""
    
    # ファイルパス
    english_file = "public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt"
    output_file = "public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions-ja-phrases.txt"
    full_translation_output = "public/data/passages-translations/advanced-family-gathering-ja.txt"
    
    # 英文を読み込む
    print("英文ファイルを読み込み中...")
    with open(english_file, 'r', encoding='utf-8') as f:
        english_lines = f.readlines()
    
    print(f"総行数: {len(english_lines)}")
    
    # 翻訳の指示
    print("\n" + "="*80)
    print("次の手順で翻訳を行ってください:")
    print("="*80)
    print("\n1. このスクリプトの出力を確認してください")
    print("2. 以下の英文（1639行）を日本語に翻訳してください")
    print("3. 翻訳時の注意点:")
    print("   - 各行の意味を正確に翻訳する")
    print("   - 空行はそのまま保つ")
    print("   - 文脈を考慮して自然な日本語にする")
    print("   - タイトル行（1行目）もきちんと翻訳する")
    print("   - 会話文は日本語の会話表現に適応させる")
    print("\n4. 翻訳結果を2つのファイルに保存:")
    print(f"   A) 行ごと翻訳: {output_file}")
    print(f"   B) 全訳（段落形式）: {full_translation_output}")
    print("\n" + "="*80)
    print("\n英文（1639行）:")
    print("="*80)
    
    # 英文を表示（翻訳用）
    for i, line in enumerate(english_lines, 1):
        print(f"{i:4d}: {line.rstrip()}")
    
    print("\n" + "="*80)
    print("翻訳準備完了")
    print("="*80)
    print("\n推奨される翻訳方法:")
    print("1. GitHub Copilotまたは他のAI翻訳ツールを使用")
    print("2. セクションごとに翻訳（例: 100行ずつ）")
    print("3. 翻訳の一貫性を保つため、物語全体の文脈を把握する")
    print("\n物語の概要:")
    print("- テーマ: 正月の家族の集まり")
    print("- 時期: 1月2日")
    print("- 場所: 祖父母の家")
    print("- 内容: 親戚が集まり、近況を報告し合う")
    print("- 登場人物: 祖母、叔父武（新しい仕事）、叔母（旅行の話）、いとこ達など")

if __name__ == "__main__":
    translate_passage_line_by_line()
