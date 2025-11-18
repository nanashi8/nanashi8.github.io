#!/usr/bin/env python3
"""
長文読解パッセージの正しい修正スクリプト

修正内容:
1. segmentsから「.」を削除（wordsには残す）
2. meaning空文字列を適切な日本語訳に置換
3. meaning"-"を削除または適切な訳に置換
"""

import json
import os

# 基本的な単語の日本語訳辞書
WORD_MEANINGS = {
    'I': '私は', 'you': 'あなたは', 'he': '彼は', 'she': '彼女は',
    'we': '私たちは', 'they': '彼らは', 'it': 'それは',
    'my': '私の', 'your': 'あなたの', 'his': '彼の', 'her': '彼女の',
    'our': '私たちの', 'their': '彼らの', 'its': 'その',
    'am': 'です', 'is': 'です', 'are': 'です',
    'was': 'でした', 'were': 'でした',
    'have': '持っている', 'has': '持っている', 'had': '持っていた',
    'do': 'する', 'does': 'する', 'did': 'した',
    'will': 'でしょう', 'would': 'だろう',
    'can': 'できる', 'could': 'できた',
    'may': 'かもしれない', 'might': 'かもしれない',
    'must': 'しなければならない', 'should': 'すべきだ',
    'the': 'その', 'a': '一つの', 'an': '一つの',
    'and': 'そして', 'or': 'または', 'but': 'しかし',
    'so': 'だから', 'because': 'なぜなら',
    'if': 'もし', 'when': 'いつ', 'where': 'どこ',
    'what': '何', 'who': '誰', 'which': 'どれ',
    'how': 'どのように', 'why': 'なぜ',
    'to': 'へ', 'in': 'の中に', 'on': 'の上に', 'at': 'で',
    'for': 'のために', 'with': 'と一緒に', 'from': 'から',
    'about': 'について', 'of': 'の', 'by': 'によって',
    'not': 'ではない', 'very': 'とても',
    'all': '全て', 'some': 'いくつかの',
    'many': '多くの', 'much': '多くの',
    'more': 'もっと', 'most': '最も',
    'good': '良い', 'bad': '悪い',
    'new': '新しい', 'old': '古い',
    'first': '最初の', 'last': '最後の',
    'long': '長い', 'short': '短い',
    'big': '大きい', 'small': '小さい',
    'here': 'ここ', 'there': 'そこ',
    'now': '今', 'then': 'その時',
    'today': '今日', 'yesterday': '昨日', 'tomorrow': '明日',
    'yes': 'はい', 'no': 'いいえ',
    'please': 'お願いします', 'thank': '感謝する',
    'hello': 'こんにちは', 'hi': 'やあ',
    'people': '人々', 'person': '人',
    'time': '時間', 'day': '日', 'year': '年',
    'way': '方法', 'thing': 'こと',
    'world': '世界', 'life': '人生',
    'work': '仕事', 'week': '週',
}


def get_word_meaning(word):
    """単語の意味を取得"""
    if not word:
        return ''
    
    word_lower = word.lower()
    return WORD_MEANINGS.get(word_lower, word)


def fix_phrase_segments(phrase):
    """
    フレーズのsegmentsを修正:
    - 「.」「,」などの句読点を削除
    - meaning空文字列を埋める
    - meaning"-"を削除
    """
    if 'segments' not in phrase:
        return phrase
    
    fixed_segments = []
    for seg in phrase['segments']:
        word = seg.get('word', '')
        
        # 句読点（.、,、!、?など）はsegmentsから除外
        if word in ['.', ',', '!', '?', ';', ':', "'", '"', '(', ')']:
            continue
        
        # meaningが空文字列または"-"なら補完
        meaning = seg.get('meaning', '')
        if meaning == '' or meaning == '-':
            seg['meaning'] = get_word_meaning(word)
        
        fixed_segments.append(seg)
    
    phrase['segments'] = fixed_segments
    return phrase


def fix_passage_file(filepath):
    """パッセージファイルを修正"""
    print(f"\n処理中: {os.path.basename(filepath)}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 統計
    punctuation_removed = 0
    meaning_fixed = 0
    
    # 各フレーズを修正
    for phrase in data['phrases']:
        if 'segments' in phrase:
            # 修正前の句読点とmeaning空の数
            original_punct = len([s for s in phrase['segments'] if s.get('word') in ['.', ',', '!', '?', ';', ':']])
            original_empty = len([s for s in phrase['segments'] if s.get('meaning') in ['', '-']])
            
            # segmentsを修正
            phrase = fix_phrase_segments(phrase)
            
            # 修正後
            new_punct = len([s for s in phrase['segments'] if s.get('word') in ['.', ',', '!', '?', ';', ':']])
            new_empty = len([s for s in phrase['segments'] if s.get('meaning') in ['', '-']])
            
            punctuation_removed += original_punct - new_punct
            meaning_fixed += original_empty - new_empty
    
    # ファイルに保存
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ 句読点削除: {punctuation_removed}個")
    print(f"  ✅ meaning修正: {meaning_fixed}単語")
    
    return punctuation_removed, meaning_fixed


def main():
    """メイン処理"""
    prototype_dir = '/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/prototype'
    
    files = [
        'beginner-1.json', 'beginner-2.json', 'beginner-3.json',
        'intermediate-1.json', 'intermediate-2.json', 'intermediate-3.json',
        'intermediate-4.json', 'intermediate-5.json',
        'advanced-1.json', 'advanced-2.json', 'advanced-3.json'
    ]
    
    print("=" * 60)
    print("長文読解パッセージ 正しい修正スクリプト")
    print("=" * 60)
    
    total_punct = 0
    total_meaning = 0
    
    for filename in files:
        filepath = os.path.join(prototype_dir, filename)
        if os.path.exists(filepath):
            punct, meaning = fix_passage_file(filepath)
            total_punct += punct
            total_meaning += meaning
        else:
            print(f"\n⚠️  {filename} が見つかりません")
    
    print("\n" + "=" * 60)
    print("修正完了")
    print("=" * 60)
    print(f"合計句読点削除(segmentsから): {total_punct}個")
    print(f"合計meaning修正: {total_meaning}単語")


if __name__ == '__main__':
    main()
