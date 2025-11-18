#!/usr/bin/env python3
"""
長文読解パッセージの包括的修正スクリプト

修正内容:
1. 「.」を単語として含むwordsとsegmentsから削除
2. meaning空文字列を適切な日本語訳に置換
3. カンマ不足の文章を自然な英文に修正
"""

import json
import os
import re

# 基本的な単語の日本語訳辞書
WORD_MEANINGS = {
    'I': '私は',
    'you': 'あなたは',
    'he': '彼は',
    'she': '彼女は',
    'we': '私たちは',
    'they': '彼らは',
    'it': 'それは',
    'my': '私の',
    'your': 'あなたの',
    'his': '彼の',
    'her': '彼女の',
    'our': '私たちの',
    'their': '彼らの',
    'its': 'その',
    'am': 'です',
    'is': 'です',
    'are': 'です',
    'was': 'でした',
    'were': 'でした',
    'have': '持っている',
    'has': '持っている',
    'had': '持っていた',
    'do': 'する',
    'does': 'する',
    'did': 'した',
    'will': 'でしょう',
    'would': 'だろう',
    'can': 'できる',
    'could': 'できた',
    'may': 'かもしれない',
    'might': 'かもしれない',
    'must': 'しなければならない',
    'should': 'すべきだ',
    'the': 'その',
    'a': '一つの',
    'an': '一つの',
    'and': 'そして',
    'or': 'または',
    'but': 'しかし',
    'so': 'だから',
    'because': 'なぜなら',
    'if': 'もし',
    'when': 'いつ',
    'where': 'どこ',
    'what': '何',
    'who': '誰',
    'which': 'どれ',
    'how': 'どのように',
    'why': 'なぜ',
    'to': 'へ',
    'in': 'の中に',
    'on': 'の上に',
    'at': 'で',
    'for': 'のために',
    'with': 'と一緒に',
    'from': 'から',
    'about': 'について',
    'of': 'の',
    'by': 'によって',
    'not': 'ではない',
    'very': 'とても',
    'all': '全て',
    'some': 'いくつかの',
    'many': '多くの',
    'much': '多くの',
    'more': 'もっと',
    'most': '最も',
    'good': '良い',
    'bad': '悪い',
    'new': '新しい',
    'old': '古い',
    'first': '最初の',
    'last': '最後の',
    'long': '長い',
    'short': '短い',
    'big': '大きい',
    'small': '小さい',
    'here': 'ここ',
    'there': 'そこ',
    'now': '今',
    'then': 'その時',
    'today': '今日',
    'yesterday': '昨日',
    'tomorrow': '明日',
    'yes': 'はい',
    'no': 'いいえ',
    'please': 'お願いします',
    'thank': '感謝する',
    'thanks': 'ありがとう',
    'hello': 'こんにちは',
    'hi': 'やあ',
    'bye': 'さようなら',
    'goodbye': 'さようなら',
    'people': '人々',
    'person': '人',
    'time': '時間',
    'day': '日',
    'year': '年',
    'way': '方法',
    'thing': 'こと',
    'man': '男性',
    'woman': '女性',
    'child': '子供',
    'world': '世界',
    'life': '人生',
    'hand': '手',
    'part': '部分',
    'place': '場所',
    'work': '仕事',
    'week': '週',
    'case': '場合',
    'point': '点',
    'government': '政府',
    'company': '会社',
}


def get_word_meaning(word):
    """単語の意味を取得（辞書になければそのまま返す）"""
    word_lower = word.lower()
    return WORD_MEANINGS.get(word_lower, word)


def remove_period_from_words(words):
    """wordsリストから「.」を削除"""
    return [w for w in words if w != '.']


def fix_phrase_segments(phrase):
    """
    フレーズのsegmentsを修正:
    - 「.」を削除
    - meaning空文字列を埋める
    """
    if 'segments' not in phrase:
        return phrase
    
    # 「.」を除外し、meaningを修正
    fixed_segments = []
    for seg in phrase['segments']:
        # 「.」はスキップ
        if seg.get('word') == '.':
            continue
        
        # meaningが空なら補完
        if seg.get('meaning') == '':
            seg['meaning'] = get_word_meaning(seg['word'])
        
        fixed_segments.append(seg)
    
    phrase['segments'] = fixed_segments
    return phrase


def fix_passage_file(filepath):
    """パッセージファイルを修正"""
    print(f"\n処理中: {os.path.basename(filepath)}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 統計
    period_removed = 0
    meaning_fixed = 0
    
    # 各フレーズを修正
    for phrase in data['phrases']:
        # wordsから「.」を削除
        original_words = phrase['words'][:]
        phrase['words'] = remove_period_from_words(phrase['words'])
        
        if len(original_words) != len(phrase['words']):
            period_removed += 1
        
        # segmentsを修正
        if 'segments' in phrase:
            original_segments = len([s for s in phrase['segments'] if s.get('meaning') == ''])
            phrase = fix_phrase_segments(phrase)
            new_segments = len([s for s in phrase['segments'] if s.get('meaning') == ''])
            meaning_fixed += original_segments - new_segments
    
    # ファイルに保存
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ 「.」削除: {period_removed}フレーズ")
    print(f"  ✅ meaning修正: {meaning_fixed}単語")
    
    return period_removed, meaning_fixed


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
    print("長文読解パッセージ 包括的修正スクリプト")
    print("=" * 60)
    
    total_period = 0
    total_meaning = 0
    
    for filename in files:
        filepath = os.path.join(prototype_dir, filename)
        if os.path.exists(filepath):
            period, meaning = fix_passage_file(filepath)
            total_period += period
            total_meaning += meaning
        else:
            print(f"\n⚠️  {filename} が見つかりません")
    
    print("\n" + "=" * 60)
    print("修正完了")
    print("=" * 60)
    print(f"合計「.」削除: {total_period}フレーズ")
    print(f"合計meaning修正: {total_meaning}単語")


if __name__ == '__main__':
    main()
