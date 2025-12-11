#!/usr/bin/env python3
"""
フレーズファイルのIPA発音記号とカタカナ発音を修正するスクリプト
"""

import csv
import re
from pathlib import Path

def fix_pronunciation(reading: str, phrase: str) -> str:
    """
    発音フィールドを修正
    - IPAが欠けている場合は追加
    - カタカナ発音（括弧書き）が欠けている場合は追加
    """
    # すでに正しい形式（IPA + (カタカナ)）の場合はそのまま
    if '(' in reading and ')' in reading and reading.count('(') == 1:
        return reading
    
    # カタカナのみの場合：IPAが欠けている
    if re.match(r'^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\ś]+$', reading):
        # フレーズから簡易的なIPAを生成
        ipa = generate_simple_ipa(phrase)
        return f"{ipa} ({reading})"
    
    # 大文字英語のみの場合（E-Mail, All Right等）：IPAとカタカナ両方欠けている
    if reading.isupper() or reading.replace(' ', '').replace('-', '').replace('.', '').isalpha():
        katakana = generate_katakana(phrase, reading)
        ipa = generate_simple_ipa(phrase)
        return f"{ipa} ({katakana})"
    
    # IPAのみでカタカナが欠けている場合
    if not '(' in reading:
        katakana = generate_katakana(phrase, reading)
        return f"{reading} ({katakana})"
    
    return reading

def generate_simple_ipa(phrase: str) -> str:
    """フレーズから簡易的なIPAを生成"""
    # 基本的な発音規則マッピング
    ipa_map = {
        'th': 'θ', 'sh': 'ʃ', 'ch': 'tʃ', 'ng': 'ŋ',
        'a': 'ə', 'e': 'e', 'i': 'i', 'o': 'oʊ', 'u': 'u',
        'ai': 'eɪ', 'ay': 'eɪ', 'ee': 'iː', 'oo': 'uː',
        'ar': 'ɑː', 'or': 'ɔː', 'er': 'ɜː', 'ir': 'ɜː', 'ur': 'ɜː'
    }
    
    words = phrase.lower().split()
    ipa_parts = []
    
    for word in words:
        # 基本的な変換
        word_ipa = word
        for pattern, replacement in ipa_map.items():
            word_ipa = word_ipa.replace(pattern, replacement)
        ipa_parts.append(word_ipa)
    
    return ' '.join(ipa_parts)

def generate_katakana(phrase: str, current_reading: str = "") -> str:
    """フレーズからカタカナ発音を生成"""
    # すでにカタカナがある場合はそれを使用
    if re.search(r'[\u30A0-\u30FF]', current_reading):
        match = re.search(r'[\u30A0-\u30FF́\s]+', current_reading)
        if match:
            return match.group(0).strip()
    
    # 基本的な英語→カタカナ変換マッピング
    katakana_map = {
        # 冠詞・前置詞
        'a': 'ア',
        'an': 'アン',
        'the': 'ザ',
        'of': 'オヴ',
        'to': 'トゥ',
        'for': 'フォー',
        'with': 'ウィズ',
        'at': 'アット',
        'in': 'イン',
        'on': 'オン',
        'as': 'アズ',
        'by': 'バイ',
        'from': 'フロム',
        'about': 'アバウト',
        'after': 'アフター',
        'all': 'オール',
        'and': 'アンド',
        'so': 'ソー',
        'be': 'ビー',
        'able': 'エイブル',
        'afraid': 'アフレイド',
        'amazed': 'アメイズド',
        'born': 'ボーン',
        'careful': 'ケアフル',
        'different': 'ディファレント',
        'familiar': 'ファミリアー',
        'famous': 'フェイマス',
        'filled': 'フィルド',
        'full': 'フル',
        'good': 'グッド',
        'interested': 'インタレスティド',
        'proud': 'プラウド',
        'ready': 'レディ',
        'satisfied': 'サティスファイド',
        'surprised': 'サプライズド',
        'sure': 'シュア',
        'used': 'ユースド',
        'worry': 'ウォリー',
        'worried': 'ウォリード',
        'amount': 'アマウント',
        'cup': 'カップ',
        'few': 'フュー',
        'glass': 'グラス',
        'kind': 'カインド',
        'little': 'リトル',
        'lot': 'ロット',
        'piece': 'ピース',
        'variety': 'ヴァラエティ',
        'according': 'アコーディング',
        'while': 'ホワイル',
        'first': 'ファースト',
        'home': 'ホーム',
        'least': 'リースト',
        'night': 'ナイト',
        'time': 'タイム',
        'result': 'リザルト',
        'right': 'ライト',
        'trouble': 'トラブル',
    }
    
    # フレーズを単語に分割してカタカナ化
    words = phrase.lower().replace('-', ' ').split()
    katakana_parts = []
    
    for word in words:
        if word in katakana_map:
            katakana_parts.append(katakana_map[word])
        else:
            # 簡易的な変換
            katakana = word.title()
            katakana_parts.append(katakana)
    
    result = ' '.join(katakana_parts)
    # タイトルケースに変換（各単語の先頭を大文字に）
    return ' '.join(word.capitalize() for word in result.split())

def fix_phrases_file(filepath: Path):
    """フレーズCSVファイルを修正"""
    print(f"処理中: {filepath.name}")
    
    rows = []
    fixed_count = 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            original_reading = row['読み']
            fixed_reading = fix_pronunciation(row['読み'], row['語句'])
            
            if original_reading != fixed_reading:
                fixed_count += 1
                print(f"  修正: {row['語句']}")
                print(f"    前: {original_reading}")
                print(f"    後: {fixed_reading}")
            
            row['読み'] = fixed_reading
            rows.append(row)
    
    # ファイルに書き戻し
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"完了: {fixed_count}件の修正を適用しました\n")

def main():
    """メイン処理"""
    vocab_dir = Path(__file__).parent.parent / 'public' / 'data' / 'vocabulary'
    
    phrase_files = list(vocab_dir.glob('*-phrases.csv'))
    
    print(f"=== フレーズファイルの発音修正 ===")
    print(f"対象ファイル: {len(phrase_files)}件\n")
    
    for filepath in sorted(phrase_files):
        fix_phrases_file(filepath)
    
    print("全ての修正が完了しました！")

if __name__ == '__main__':
    main()
