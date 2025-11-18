#!/usr/bin/env python3
"""
長文読解データに適切な句読点を追加するスクリプト
文の構造を分析して、適切な位置にピリオドとカンマを配置
"""

import json
import os
import re

def analyze_sentence_end(phrase, next_phrase=None):
    """
    フレーズが文の終わりかどうかを判定
    """
    phrase_meaning = phrase.get('phraseMeaning', '')
    words = phrase.get('words', [])
    
    if not words:
        return False
    
    last_word = words[-1].lower()
    
    # 既に句読点がある
    if words[-1] and words[-1][-1] in '.,!?;:':
        return False
    
    # 文末の特徴
    # 1. 日本語訳が文末表現で終わる
    sentence_end_patterns = [
        'です', 'ます', 'だ', 'である', 'した', 'いる', 'ある', 
        'ません', 'ない', 'よう', 'べき', 'られる', 'される'
    ]
    
    for pattern in sentence_end_patterns:
        if phrase_meaning.endswith(pattern):
            return True
    
    # 2. 次のフレーズが大文字で始まる（新しい文の開始）
    if next_phrase:
        next_words = next_phrase.get('words', [])
        if next_words and next_words[0][0].isupper() and next_words[0].lower() not in ['i']:
            return True
    
    return False

def should_add_comma(phrase, next_phrase=None):
    """
    カンマを追加すべきかを判定
    """
    phrase_meaning = phrase.get('phraseMeaning', '')
    words = phrase.get('words', [])
    
    if not words:
        return False
    
    last_word = words[-1].lower()
    
    # 接続詞の後にカンマ
    comma_after = ['but', 'however', 'therefore', 'moreover', 'furthermore', 
                   'nevertheless', 'meanwhile', 'additionally', 'consequently']
    
    if last_word in comma_after:
        return True
    
    # 日本語訳に「、」がある
    if '、' in phrase_meaning or 'が' in phrase_meaning or 'を' in phrase_meaning:
        # 次のフレーズが接続詞で始まる場合はカンマ
        if next_phrase:
            next_words = next_phrase.get('words', [])
            if next_words and next_words[0].lower() in ['and', 'or', 'but', 'so']:
                return True
    
    return False

def add_punctuation_to_words(phrase, punctuation):
    """
    フレーズの最後の単語に句読点を追加し、segmentsも更新
    """
    words = phrase.get('words', [])
    if not words:
        return phrase
    
    last_word = words[-1]
    
    # wordsに句読点を追加（単語自体には付けず、別の要素として追加）
    words.append(punctuation)
    phrase['words'] = words
    
    # segmentsも更新（存在する場合）
    if 'segments' in phrase and phrase['segments']:
        segments = phrase['segments']
        # 句読点を新しいセグメントとして追加
        segments.append({
            'word': punctuation,
            'meaning': '',
            'isUnknown': False
        })
        phrase['segments'] = segments
    
    return phrase

def process_passage(passage_data):
    """
    1つのパッセージデータに句読点を追加
    """
    phrases = passage_data.get('phrases', [])
    total_phrases = len(phrases)
    
    for i, phrase in enumerate(phrases):
        # 次のフレーズを取得
        next_phrase = phrases[i + 1] if i + 1 < total_phrases else None
        
        # 最後のフレーズは必ずピリオド
        if i == total_phrases - 1:
            phrases[i] = add_punctuation_to_words(phrase, '.')
            continue
        
        # 文の終わりを判定
        if analyze_sentence_end(phrase, next_phrase):
            phrases[i] = add_punctuation_to_words(phrase, '.')
        elif should_add_comma(phrase, next_phrase):
            phrases[i] = add_punctuation_to_words(phrase, ',')
    
    passage_data['phrases'] = phrases
    return passage_data

def main():
    prototype_dir = 'prototype'
    
    # prototypeディレクトリ内の全JSONファイルを処理
    for filename in sorted(os.listdir(prototype_dir)):
        if filename.endswith('.json'):
            filepath = os.path.join(prototype_dir, filename)
            print(f'処理中: {filename}')
            
            # JSONファイルを読み込み
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 句読点を追加
            data = process_passage(data)
            
            # ファイルに書き戻し
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f'完了: {filename}')
    
    print('\n全てのファイルの処理が完了しました')

if __name__ == '__main__':
    main()
