#!/usr/bin/env python3
"""
すべてのパッセージの'-'意味を修正するスクリプト
"""
import csv
import json
import re

# 基本単語マッピング（機能語と一般的な単語）
BASIC_WORDS = {
    # 代名詞
    'i': '私は', 'me': '私を', 'my': '私の', 'mine': '私のもの', 'myself': '私自身',
    'you': 'あなたは', 'your': 'あなたの', 'yours': 'あなたのもの', 'yourself': 'あなた自身',
    'he': '彼は', 'him': '彼を', 'his': '彼の', 'himself': '彼自身',
    'she': '彼女は', 'her': '彼女を/彼女の', 'hers': '彼女のもの', 'herself': '彼女自身',
    'it': 'それは', 'its': 'その', 'itself': 'それ自身',
    'we': '私たちは', 'us': '私たちを', 'our': '私たちの', 'ours': '私たちのもの', 'ourselves': '私たち自身',
    'they': '彼らは', 'them': '彼らを', 'their': '彼らの', 'theirs': '彼らのもの', 'themselves': '彼ら自身',
    
    # 冠詞
    'a': '1つの', 'an': '1つの', 'the': 'その',
    
    # be動詞
    'am': 'です', 'is': 'です', 'are': 'です',
    'was': 'でした', 'were': 'でした',
    'be': 'である', 'been': 'であった', 'being': 'であること',
    
    # 助動詞
    'have': '持っている', 'has': '持っている', 'had': '持っていた', 'having': '持つこと',
    'do': 'する', 'does': 'する', 'did': 'した', 'doing': 'すること',
    'will': 'するだろう', 'would': 'するだろう',
    'shall': 'するだろう', 'should': 'すべきである',
    'can': 'できる', 'could': 'できた',
    'may': 'かもしれない', 'might': 'かもしれない',
    'must': 'しなければならない',
    
    # 前置詞
    'of': 'の', 'to': 'に', 'in': 'の中に', 'on': 'の上に', 'at': 'で',
    'by': 'によって', 'for': 'のために', 'with': 'と一緒に',
    'from': 'から', 'as': 'として', 'into': 'の中へ', 'onto': 'の上へ',
    'about': '〜について', 'above': '〜の上に', 'across': '〜を横切って',
    'after': '〜の後に', 'against': '〜に対して', 'along': '〜に沿って',
    'among': '〜の間に', 'around': '〜の周りに', 'before': '〜の前に',
    'behind': '〜の後ろに', 'below': '〜の下に', 'beneath': '〜の下に',
    'beside': '〜の隣に', 'between': '〜の間に', 'beyond': '〜を越えて',
    'during': '〜の間', 'inside': '〜の内部に', 'near': '〜の近くに',
    'off': '〜から離れて', 'outside': '〜の外に', 'over': '〜の上に',
    'through': '〜を通って', 'toward': '〜に向かって', 'under': '〜の下に',
    'until': '〜まで', 'up': '上へ', 'upon': '〜の上に', 'within': '〜の内部に',
    'without': '〜なしで',
    
    # 接続詞
    'and': 'そして', 'or': 'または', 'but': 'しかし',
    'so': 'だから', 'yet': 'しかし', 'nor': 'もまた〜ない',
    'if': 'もし', 'than': 'より', 'though': 'けれども',
    'although': 'けれども', 'because': 'なぜなら', 'since': '〜以来',
    'unless': '〜でなければ', 'while': '〜の間',
    
    # 疑問詞
    'who': '誰', 'whom': '誰を', 'whose': '誰の',
    'what': '何', 'which': 'どちら', 'when': 'いつ',
    'where': 'どこで', 'why': 'なぜ', 'how': 'どのように',
    
    # 指示代名詞
    'this': 'これ', 'that': 'それ', 'these': 'これら', 'those': 'それら',
    
    # 副詞
    'not': 'ではない', 'no': 'いいえ', 'yes': 'はい',
    'down': '下へ', 'out': '外へ',
    'again': '再び', 'then': 'その時', 'there': 'そこに', 'here': 'ここに',
    'now': '今', 'too': 'も', 'very': 'とても', 'also': 'また',
    'just': 'ちょうど', 'only': 'だけ', 'even': '〜でさえ',
    'never': '決して〜ない', 'always': 'いつも', 'often': 'しばしば',
    'sometimes': '時々', 'usually': '普通は', 'still': 'まだ',
    'already': 'すでに', 'yet': 'まだ', 'soon': 'すぐに',
    
    # 形容詞・代名詞
    'all': 'すべて', 'any': '何か', 'some': 'いくつかの', 'many': '多くの',
    'much': '多くの', 'more': 'もっと', 'most': 'もっとも',
    'few': '少しの', 'little': '少しの', 'other': '他の', 'another': '別の',
    'both': '両方の', 'either': 'どちらか', 'neither': 'どちらも〜ない',
    'such': 'そのような', 'each': 'それぞれ', 'every': 'すべての',
    'own': '自分自身の', 'same': '同じ',
    
    # 句読点
    '.': '。', ',': '、', '?': '？', '!': '！',
}


def load_main_dict():
    """メイン辞書を読み込み"""
    main_dict = {}
    with open('public/data/junior-high-entrance-words.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # ヘッダースキップ
        for row in reader:
            if len(row) >= 3:
                word = row[0].strip().lower()
                meaning = row[2].strip()
                if meaning and meaning != '-':
                    main_dict[word] = meaning
    return main_dict


def load_reading_dict():
    """長文辞書を読み込み（-を除外）"""
    with open('public/data/reading-passages-dictionary.json', 'r', encoding='utf-8') as f:
        reading_dict_raw = json.load(f)
    
    reading_dict = {}
    for word, data in reading_dict_raw.items():
        meaning = data.get('meaning', '')
        if meaning and meaning != '-':
            reading_dict[word.lower()] = meaning
    return reading_dict


def get_meaning(word, main_dict, reading_dict):
    """単語の意味を取得（複数の辞書から）"""
    word_clean = word.rstrip(',.!?;:')
    word_lower = word_clean.lower()
    
    # 検索順序: 基本単語 > 長文辞書 > メイン辞書
    meaning = (
        BASIC_WORDS.get(word_lower) or
        reading_dict.get(word_lower) or
        main_dict.get(word_lower)
    )
    
    if meaning:
        return meaning
    
    # 大文字始まりの場合、固有名詞として扱う
    if word_clean and word_clean[0].isupper():
        return f"{word_clean}（固有名詞）"
    
    # それでも見つからない場合
    return f"[{word_clean}]"


def fix_passage_meanings():
    """すべてのパッセージの'-'意味を修正"""
    print("辞書を読み込み中...")
    main_dict = load_main_dict()
    reading_dict = load_reading_dict()
    
    print(f"メイン辞書: {len(main_dict)}語")
    print(f"長文辞書: {len(reading_dict)}語")
    print(f"基本単語: {len(BASIC_WORDS)}語")
    
    # パッセージを読み込み
    with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
        passages = json.load(f)
    
    print(f"\nパッセージ数: {len(passages)}")
    
    # 統計
    fixed_count = 0
    not_found_count = 0
    proper_noun_count = 0
    not_found_words = set()
    
    # すべての'-'を修正
    for passage in passages:
        if 'phrases' not in passage:
            continue
        
        for phrase in passage['phrases']:
            if 'wordMeanings' not in phrase:
                continue
            
            for word, meaning in list(phrase['wordMeanings'].items()):
                if meaning == '-':
                    new_meaning = get_meaning(word, main_dict, reading_dict)
                    phrase['wordMeanings'][word] = new_meaning
                    fixed_count += 1
                    
                    if new_meaning.endswith('（固有名詞）'):
                        proper_noun_count += 1
                    elif new_meaning.startswith('[') and new_meaning.endswith(']'):
                        not_found_count += 1
                        not_found_words.add(word.rstrip(',.!?;:').lower())
    
    print(f"\n修正した単語: {fixed_count}個")
    print(f"  - 辞書で見つかった: {fixed_count - proper_noun_count - not_found_count}個")
    print(f"  - 固有名詞として処理: {proper_noun_count}個")
    print(f"  - 見つからなかった: {not_found_count}個")
    
    if not_found_words:
        print(f"\n見つからなかった単語（{len(not_found_words)}個、最初の30個）:")
        for word in sorted(not_found_words)[:30]:
            print(f"  - {word}")
    
    # 保存
    with open('public/data/reading-passages-comprehensive.json', 'w', encoding='utf-8') as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
    
    print("\n✅ パッセージファイルを更新しました")
    
    return not_found_words


if __name__ == '__main__':
    not_found = fix_passage_meanings()
