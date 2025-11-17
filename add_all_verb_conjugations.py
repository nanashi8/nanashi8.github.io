#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

# 英語の不規則動詞の活用形データベース（拡張版）
IRREGULAR_VERBS = {
    'be': {'past': ['was', 'were'], 'past_participle': 'been', 'present_participle': 'being', 'third_person': 'is',
           'readings': {'past': ['ワズ', 'ワー'], 'past_participle': 'ビーン', 'present_participle': 'ビーイング', 'third_person': 'イズ'},
           'meanings': {'past': ['だった', 'だった'], 'past_participle': 'である（完了）', 'present_participle': 'であること', 'third_person': 'である'}},
    'have': {'past': 'had', 'past_participle': 'had', 'present_participle': 'having', 'third_person': 'has',
            'readings': {'past': 'ハッド', 'past_participle': 'ハッド', 'present_participle': 'ハビング', 'third_person': 'ハズ'},
            'meanings': {'past': '持っていた', 'past_participle': '持っていた', 'present_participle': '持つこと', 'third_person': '持つ'}},
    'do': {'past': 'did', 'past_participle': 'done', 'present_participle': 'doing', 'third_person': 'does',
          'readings': {'past': 'ディッド', 'past_participle': 'ダン', 'present_participle': 'ドゥーイング', 'third_person': 'ダズ'},
          'meanings': {'past': 'した', 'past_participle': 'した（完了）', 'present_participle': 'すること', 'third_person': 'する'}},
    'go': {'past': 'went', 'past_participle': 'gone', 'present_participle': 'going', 'third_person': 'goes',
          'readings': {'past': 'ウェント', 'past_participle': 'ゴーン', 'present_participle': 'ゴーイング', 'third_person': 'ゴーズ'},
          'meanings': {'past': '行った', 'past_participle': '行ってしまった', 'present_participle': '行くこと', 'third_person': '行く'}},
    'make': {'past': 'made', 'past_participle': 'made', 'present_participle': 'making', 'third_person': 'makes',
            'readings': {'past': 'メイド', 'past_participle': 'メイド', 'present_participle': 'メイキング', 'third_person': 'メイクス'},
            'meanings': {'past': '作った', 'past_participle': '作られた', 'present_participle': '作ること', 'third_person': '作る'}},
    'take': {'past': 'took', 'past_participle': 'taken', 'present_participle': 'taking', 'third_person': 'takes',
            'readings': {'past': 'トゥック', 'past_participle': 'テイクン', 'present_participle': 'テイキング', 'third_person': 'テイクス'},
            'meanings': {'past': '取った', 'past_participle': '取られた', 'present_participle': '取ること', 'third_person': '取る'}},
    'come': {'past': 'came', 'past_participle': 'come', 'present_participle': 'coming', 'third_person': 'comes',
            'readings': {'past': 'ケイム', 'past_participle': 'カム', 'present_participle': 'カミング', 'third_person': 'カムズ'},
            'meanings': {'past': '来た', 'past_participle': '来た（完了）', 'present_participle': '来ること', 'third_person': '来る'}},
    'see': {'past': 'saw', 'past_participle': 'seen', 'present_participle': 'seeing', 'third_person': 'sees',
           'readings': {'past': 'ソー', 'past_participle': 'シーン', 'present_participle': 'シーイング', 'third_person': 'シーズ'},
           'meanings': {'past': '見た', 'past_participle': '見られた', 'present_participle': '見ること', 'third_person': '見る'}},
    'know': {'past': 'knew', 'past_participle': 'known', 'present_participle': 'knowing', 'third_person': 'knows',
            'readings': {'past': 'ニュー', 'past_participle': 'ノウン', 'present_participle': 'ノーイング', 'third_person': 'ノウズ'},
            'meanings': {'past': '知っていた', 'past_participle': '知られている', 'present_participle': '知ること', 'third_person': '知る'}},
    'get': {'past': 'got', 'past_participle': 'gotten', 'present_participle': 'getting', 'third_person': 'gets',
           'readings': {'past': 'ゴット', 'past_participle': 'ゴットン', 'present_participle': 'ゲッティング', 'third_person': 'ゲッツ'},
           'meanings': {'past': '得た', 'past_participle': '得られた', 'present_participle': '得ること', 'third_person': '得る'}},
    'give': {'past': 'gave', 'past_participle': 'given', 'present_participle': 'giving', 'third_person': 'gives',
            'readings': {'past': 'ゲイヴ', 'past_participle': 'ギヴン', 'present_participle': 'ギビング', 'third_person': 'ギヴズ'},
            'meanings': {'past': '与えた', 'past_participle': '与えられた', 'present_participle': '与えること', 'third_person': '与える'}},
    'find': {'past': 'found', 'past_participle': 'found', 'present_participle': 'finding', 'third_person': 'finds',
            'readings': {'past': 'ファウンド', 'past_participle': 'ファウンド', 'present_participle': 'ファインディング', 'third_person': 'ファインズ'},
            'meanings': {'past': '見つけた', 'past_participle': '見つけられた', 'present_participle': '見つけること', 'third_person': '見つける'}},
    'think': {'past': 'thought', 'past_participle': 'thought', 'present_participle': 'thinking', 'third_person': 'thinks',
             'readings': {'past': 'ソート', 'past_participle': 'ソート', 'present_participle': 'シンキング', 'third_person': 'シンクス'},
             'meanings': {'past': '考えた', 'past_participle': '考えられた', 'present_participle': '考えること', 'third_person': '考える'}},
    'tell': {'past': 'told', 'past_participle': 'told', 'present_participle': 'telling', 'third_person': 'tells',
            'readings': {'past': 'トールド', 'past_participle': 'トールド', 'present_participle': 'テリング', 'third_person': 'テルズ'},
            'meanings': {'past': '言った', 'past_participle': '言われた', 'present_participle': '言うこと', 'third_person': '言う'}},
    'become': {'past': 'became', 'past_participle': 'become', 'present_participle': 'becoming', 'third_person': 'becomes',
              'readings': {'past': 'ビケイム', 'past_participle': 'ビカム', 'present_participle': 'ビカミング', 'third_person': 'ビカムズ'},
              'meanings': {'past': 'なった', 'past_participle': 'なった（完了）', 'present_participle': 'なること', 'third_person': 'なる'}},
    'leave': {'past': 'left', 'past_participle': 'left', 'present_participle': 'leaving', 'third_person': 'leaves',
             'readings': {'past': 'レフト', 'past_participle': 'レフト', 'present_participle': 'リービング', 'third_person': 'リーブズ'},
             'meanings': {'past': '去った', 'past_participle': '去られた', 'present_participle': '去ること', 'third_person': '去る'}},
    'feel': {'past': 'felt', 'past_participle': 'felt', 'present_participle': 'feeling', 'third_person': 'feels',
            'readings': {'past': 'フェルト', 'past_participle': 'フェルト', 'present_participle': 'フィーリング', 'third_person': 'フィールズ'},
            'meanings': {'past': '感じた', 'past_participle': '感じられた', 'present_participle': '感じること', 'third_person': '感じる'}},
    'bring': {'past': 'brought', 'past_participle': 'brought', 'present_participle': 'bringing', 'third_person': 'brings',
             'readings': {'past': 'ブロート', 'past_participle': 'ブロート', 'present_participle': 'ブリンギング', 'third_person': 'ブリングズ'},
             'meanings': {'past': '持って来た', 'past_participle': '持って来られた', 'present_participle': '持って来ること', 'third_person': '持って来る'}},
    'begin': {'past': 'began', 'past_participle': 'begun', 'present_participle': 'beginning', 'third_person': 'begins',
             'readings': {'past': 'ビガン', 'past_participle': 'ビガン', 'present_participle': 'ビギニング', 'third_person': 'ビギンズ'},
             'meanings': {'past': '始めた', 'past_participle': '始められた', 'present_participle': '始めること', 'third_person': '始める'}},
    'keep': {'past': 'kept', 'past_participle': 'kept', 'present_participle': 'keeping', 'third_person': 'keeps',
            'readings': {'past': 'ケプト', 'past_participle': 'ケプト', 'present_participle': 'キーピング', 'third_person': 'キープス'},
            'meanings': {'past': '保った', 'past_participle': '保たれた', 'present_participle': '保つこと', 'third_person': '保つ'}},
    'hold': {'past': 'held', 'past_participle': 'held', 'present_participle': 'holding', 'third_person': 'holds',
            'readings': {'past': 'ヘルド', 'past_participle': 'ヘルド', 'present_participle': 'ホールディング', 'third_person': 'ホールズ'},
            'meanings': {'past': '持った', 'past_participle': '持たれた', 'present_participle': '持つこと', 'third_person': '持つ'}},
    'write': {'past': 'wrote', 'past_participle': 'written', 'present_participle': 'writing', 'third_person': 'writes',
             'readings': {'past': 'ロウト', 'past_participle': 'リトン', 'present_participle': 'ライティング', 'third_person': 'ライツ'},
             'meanings': {'past': '書いた', 'past_participle': '書かれた', 'present_participle': '書くこと', 'third_person': '書く'}},
    'stand': {'past': 'stood', 'past_participle': 'stood', 'present_participle': 'standing', 'third_person': 'stands',
             'readings': {'past': 'ストゥッド', 'past_participle': 'ストゥッド', 'present_participle': 'スタンディング', 'third_person': 'スタンズ'},
             'meanings': {'past': '立った', 'past_participle': '立たれた', 'present_participle': '立つこと', 'third_person': '立つ'}},
    'hear': {'past': 'heard', 'past_participle': 'heard', 'present_participle': 'hearing', 'third_person': 'hears',
            'readings': {'past': 'ハード', 'past_participle': 'ハード', 'present_participle': 'ヒアリング', 'third_person': 'ヒアズ'},
            'meanings': {'past': '聞いた', 'past_participle': '聞かれた', 'present_participle': '聞くこと', 'third_person': '聞く'}},
    'let': {'past': 'let', 'past_participle': 'let', 'present_participle': 'letting', 'third_person': 'lets',
           'readings': {'past': 'レット', 'past_participle': 'レット', 'present_participle': 'レッティング', 'third_person': 'レッツ'},
           'meanings': {'past': 'させた', 'past_participle': 'させられた', 'present_participle': 'させること', 'third_person': 'させる'}},
    'mean': {'past': 'meant', 'past_participle': 'meant', 'present_participle': 'meaning', 'third_person': 'means',
            'readings': {'past': 'メント', 'past_participle': 'メント', 'present_participle': 'ミーニング', 'third_person': 'ミーンズ'},
            'meanings': {'past': '意味した', 'past_participle': '意味された', 'present_participle': '意味すること', 'third_person': '意味する'}},
    'set': {'past': 'set', 'past_participle': 'set', 'present_participle': 'setting', 'third_person': 'sets',
           'readings': {'past': 'セット', 'past_participle': 'セット', 'present_participle': 'セッティング', 'third_person': 'セッツ'},
           'meanings': {'past': '置いた', 'past_participle': '置かれた', 'present_participle': '置くこと', 'third_person': '置く'}},
    'meet': {'past': 'met', 'past_participle': 'met', 'present_participle': 'meeting', 'third_person': 'meets',
            'readings': {'past': 'メット', 'past_participle': 'メット', 'present_participle': 'ミーティング', 'third_person': 'ミーツ'},
            'meanings': {'past': '会った', 'past_participle': '会われた', 'present_participle': '会うこと', 'third_person': '会う'}},
    'run': {'past': 'ran', 'past_participle': 'run', 'present_participle': 'running', 'third_person': 'runs',
           'readings': {'past': 'ラン', 'past_participle': 'ラン', 'present_participle': 'ランニング', 'third_person': 'ランズ'},
           'meanings': {'past': '走った', 'past_participle': '走った（完了）', 'present_participle': '走ること', 'third_person': '走る'}},
    'pay': {'past': 'paid', 'past_participle': 'paid', 'present_participle': 'paying', 'third_person': 'pays',
           'readings': {'past': 'ペイド', 'past_participle': 'ペイド', 'present_participle': 'ペイング', 'third_person': 'ペイズ'},
           'meanings': {'past': '支払った', 'past_participle': '支払われた', 'present_participle': '支払うこと', 'third_person': '支払う'}},
    'sit': {'past': 'sat', 'past_participle': 'sat', 'present_participle': 'sitting', 'third_person': 'sits',
           'readings': {'past': 'サット', 'past_participle': 'サット', 'present_participle': 'シッティング', 'third_person': 'シッツ'},
           'meanings': {'past': '座った', 'past_participle': '座られた', 'present_participle': '座ること', 'third_person': '座る'}},
    'speak': {'past': 'spoke', 'past_participle': 'spoken', 'present_participle': 'speaking', 'third_person': 'speaks',
             'readings': {'past': 'スポウク', 'past_participle': 'スポウクン', 'present_participle': 'スピーキング', 'third_person': 'スピークス'},
             'meanings': {'past': '話した', 'past_participle': '話された', 'present_participle': '話すこと', 'third_person': '話す'}},
    'read': {'past': 'read', 'past_participle': 'read', 'present_participle': 'reading', 'third_person': 'reads',
            'readings': {'past': 'レッド', 'past_participle': 'レッド', 'present_participle': 'リーディング', 'third_person': 'リーズ'},
            'meanings': {'past': '読んだ', 'past_participle': '読まれた', 'present_participle': '読むこと', 'third_person': '読む'}},
    'grow': {'past': 'grew', 'past_participle': 'grown', 'present_participle': 'growing', 'third_person': 'grows',
            'readings': {'past': 'グルー', 'past_participle': 'グロウン', 'present_participle': 'グローイング', 'third_person': 'グロウズ'},
            'meanings': {'past': '成長した', 'past_participle': '成長した（完了）', 'present_participle': '成長すること', 'third_person': '成長する'}},
    'lose': {'past': 'lost', 'past_participle': 'lost', 'present_participle': 'losing', 'third_person': 'loses',
            'readings': {'past': 'ロスト', 'past_participle': 'ロスト', 'present_participle': 'ルージング', 'third_person': 'ルーズィズ'},
            'meanings': {'past': '失った', 'past_participle': '失われた', 'present_participle': '失うこと', 'third_person': '失う'}},
    'fall': {'past': 'fell', 'past_participle': 'fallen', 'present_participle': 'falling', 'third_person': 'falls',
            'readings': {'past': 'フェル', 'past_participle': 'フォールン', 'present_participle': 'フォーリング', 'third_person': 'フォールズ'},
            'meanings': {'past': '落ちた', 'past_participle': '落ちた（完了）', 'present_participle': '落ちること', 'third_person': '落ちる'}},
    'send': {'past': 'sent', 'past_participle': 'sent', 'present_participle': 'sending', 'third_person': 'sends',
            'readings': {'past': 'セント', 'past_participle': 'セント', 'present_participle': 'センディング', 'third_person': 'センズ'},
            'meanings': {'past': '送った', 'past_participle': '送られた', 'present_participle': '送ること', 'third_person': '送る'}},
    'build': {'past': 'built', 'past_participle': 'built', 'present_participle': 'building', 'third_person': 'builds',
             'readings': {'past': 'ビルト', 'past_participle': 'ビルト', 'present_participle': 'ビルディング', 'third_person': 'ビルズ'},
             'meanings': {'past': '建てた', 'past_participle': '建てられた', 'present_participle': '建てること', 'third_person': '建てる'}},
    'understand': {'past': 'understood', 'past_participle': 'understood', 'present_participle': 'understanding', 'third_person': 'understands',
                  'readings': {'past': 'アンダストゥッド', 'past_participle': 'アンダストゥッド', 'present_participle': 'アンダスタンディング', 'third_person': 'アンダスタンズ'},
                  'meanings': {'past': '理解した', 'past_participle': '理解された', 'present_participle': '理解すること', 'third_person': '理解する'}},
    'draw': {'past': 'drew', 'past_participle': 'drawn', 'present_participle': 'drawing', 'third_person': 'draws',
            'readings': {'past': 'ドゥルー', 'past_participle': 'ドローン', 'present_participle': 'ドローイング', 'third_person': 'ドローズ'},
            'meanings': {'past': '描いた', 'past_participle': '描かれた', 'present_participle': '描くこと', 'third_person': '描く'}},
    'break': {'past': 'broke', 'past_participle': 'broken', 'present_participle': 'breaking', 'third_person': 'breaks',
             'readings': {'past': 'ブロウク', 'past_participle': 'ブロウクン', 'present_participle': 'ブレイキング', 'third_person': 'ブレイクス'},
             'meanings': {'past': '壊した', 'past_participle': '壊された', 'present_participle': '壊すこと', 'third_person': '壊す'}},
    'spend': {'past': 'spent', 'past_participle': 'spent', 'present_participle': 'spending', 'third_person': 'spends',
             'readings': {'past': 'スペント', 'past_participle': 'スペント', 'present_participle': 'スペンディング', 'third_person': 'スペンズ'},
             'meanings': {'past': '使った', 'past_participle': '使われた', 'present_participle': '使うこと', 'third_person': '使う'}},
    'cut': {'past': 'cut', 'past_participle': 'cut', 'present_participle': 'cutting', 'third_person': 'cuts',
           'readings': {'past': 'カット', 'past_participle': 'カット', 'present_participle': 'カッティング', 'third_person': 'カッツ'},
           'meanings': {'past': '切った', 'past_participle': '切られた', 'present_participle': '切ること', 'third_person': '切る'}},
    'buy': {'past': 'bought', 'past_participle': 'bought', 'present_participle': 'buying', 'third_person': 'buys',
           'readings': {'past': 'ボート', 'past_participle': 'ボート', 'present_participle': 'バイング', 'third_person': 'バイズ'},
           'meanings': {'past': '買った', 'past_participle': '買われた', 'present_participle': '買うこと', 'third_person': '買う'}},
    'eat': {'past': 'ate', 'past_participle': 'eaten', 'present_participle': 'eating', 'third_person': 'eats',
           'readings': {'past': 'エイト', 'past_participle': 'イートン', 'present_participle': 'イーティング', 'third_person': 'イーツ'},
           'meanings': {'past': '食べた', 'past_participle': '食べられた', 'present_participle': '食べること', 'third_person': '食べる'}},
    'sell': {'past': 'sold', 'past_participle': 'sold', 'present_participle': 'selling', 'third_person': 'sells',
            'readings': {'past': 'ソウルド', 'past_participle': 'ソウルド', 'present_participle': 'セリング', 'third_person': 'セルズ'},
            'meanings': {'past': '売った', 'past_participle': '売られた', 'present_participle': '売ること', 'third_person': '売る'}},
    'fly': {'past': 'flew', 'past_participle': 'flown', 'present_participle': 'flying', 'third_person': 'flies',
           'readings': {'past': 'フルー', 'past_participle': 'フロウン', 'present_participle': 'フライング', 'third_person': 'フライズ'},
           'meanings': {'past': '飛んだ', 'past_participle': '飛ばれた', 'present_participle': '飛ぶこと', 'third_person': '飛ぶ'}},
    'swim': {'past': 'swam', 'past_participle': 'swum', 'present_participle': 'swimming', 'third_person': 'swims',
            'readings': {'past': 'スワム', 'past_participle': 'スワム', 'present_participle': 'スイミング', 'third_person': 'スイムズ'},
            'meanings': {'past': '泳いだ', 'past_participle': '泳がれた', 'present_participle': '泳ぐこと', 'third_person': '泳ぐ'}},
    'sing': {'past': 'sang', 'past_participle': 'sung', 'present_participle': 'singing', 'third_person': 'sings',
            'readings': {'past': 'サング', 'past_participle': 'サング', 'present_participle': 'シンギング', 'third_person': 'シングズ'},
            'meanings': {'past': '歌った', 'past_participle': '歌われた', 'present_participle': '歌うこと', 'third_person': '歌う'}},
    'drink': {'past': 'drank', 'past_participle': 'drunk', 'present_participle': 'drinking', 'third_person': 'drinks',
             'readings': {'past': 'ドランク', 'past_participle': 'ドランク', 'present_participle': 'ドリンキング', 'third_person': 'ドリンクス'},
             'meanings': {'past': '飲んだ', 'past_participle': '飲まれた', 'present_participle': '飲むこと', 'third_person': '飲む'}},
}

def is_verb(meaning):
    """意味から動詞かどうかを判定"""
    # 動詞の特徴的なパターン
    verb_patterns = [
        r'する$', r'させる$', r'れる$', r'られる$', r'む$', r'ぶ$', r'ぬ$', 
        r'つ$', r'る$', r'う$', r'く$', r'ぐ$', r'す$'
    ]
    
    # 明示的に動詞でないもの
    non_verb_keywords = ['い', 'な', 'こと', 'もの', 'さ', '的']
    
    meaning_parts = meaning.split('・')
    
    for part in meaning_parts:
        part = part.strip()
        # 非動詞キーワードチェック
        if any(kw in part for kw in non_verb_keywords) and not any(re.search(pattern, part) for pattern in verb_patterns):
            continue
        # 動詞パターンマッチ
        if any(re.search(pattern, part) for pattern in verb_patterns):
            return True
    
    return False

def get_regular_verb_forms(verb, base_meaning):
    """規則動詞の活用形を生成（日本語の意味も含む）"""
    forms = {}
    readings = {}
    meanings = {}
    
    # 基本形の意味から活用形の意味を生成
    base_verb = base_meaning.split('・')[0].strip()
    
    # 過去形・過去分詞（-ed）
    if verb.endswith('e'):
        past_form = verb + 'd'
    elif verb.endswith('y') and len(verb) > 2 and verb[-2] not in 'aeiou':
        past_form = verb[:-1] + 'ied'
    elif len(verb) >= 3 and verb[-1] not in 'aeiouwxy' and verb[-2] in 'aeiou' and verb[-3] not in 'aeiou':
        past_form = verb + verb[-1] + 'ed'
    else:
        past_form = verb + 'ed'
    
    forms['past'] = past_form
    forms['past_participle'] = past_form
    
    # 三単現（-s/-es）
    if verb.endswith(('s', 'x', 'z', 'ch', 'sh', 'o')):
        forms['third_person'] = verb + 'es'
    elif verb.endswith('y') and len(verb) > 2 and verb[-2] not in 'aeiou':
        forms['third_person'] = verb[:-1] + 'ies'
    else:
        forms['third_person'] = verb + 's'
    
    # 現在分詞（-ing）
    if verb.endswith('ie'):
        forms['present_participle'] = verb[:-2] + 'ying'
    elif verb.endswith('e') and not verb.endswith('ee'):
        forms['present_participle'] = verb[:-1] + 'ing'
    elif len(verb) >= 3 and verb[-1] not in 'aeiouwxy' and verb[-2] in 'aeiou' and verb[-3] not in 'aeiou':
        forms['present_participle'] = verb + verb[-1] + 'ing'
    else:
        forms['present_participle'] = verb + 'ing'
    
    # 日本語の意味を生成（簡易版）
    if base_verb.endswith('する'):
        root = base_verb[:-2]
        meanings['past'] = f'{root}した'
        meanings['past_participle'] = f'{root}された'
        meanings['present_participle'] = f'{root}すること'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('る'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}た'
        meanings['past_participle'] = f'{root}られた'
        meanings['present_participle'] = f'{root}ること'
        meanings['third_person'] = base_verb
    else:
        meanings['past'] = f'{base_verb}（過去）'
        meanings['past_participle'] = f'{base_verb}（完了）'
        meanings['present_participle'] = f'{base_verb}こと'
        meanings['third_person'] = base_verb
    
    # カタカナ読みを生成（簡易版 - 実際には辞書の読みを使用）
    readings['past'] = 'エド'
    readings['past_participle'] = 'エド'
    readings['present_participle'] = 'イング'
    readings['third_person'] = 'ス'
    
    return forms, readings, meanings

def add_verb_conjugations(word, meaning, reading, related_words):
    """動詞の活用形を関連語に追加"""
    word_lower = word.lower()
    
    # 既存の関連語
    if related_words and related_words.strip():
        prefix = related_words + ', '
    else:
        prefix = ''
    
    # 不規則動詞の場合
    if word_lower in IRREGULAR_VERBS:
        conj = IRREGULAR_VERBS[word_lower]
        forms = conj
        readings = conj.get('readings', {})
        meanings = conj.get('meanings', {})
        
        # beの特殊処理
        if word_lower == 'be':
            forms_str = (
                f"(動詞活用){word}({reading}):{meaning}, "
                f"was/were({readings['past'][0]}/{readings['past'][1]}):{meanings['past'][0]}, "
                f"{forms['past_participle']}({readings['past_participle']}):{meanings['past_participle']}, "
                f"{forms['present_participle']}({readings['present_participle']}):{meanings['present_participle']}, "
                f"{forms['third_person']}({readings['third_person']}):{meanings['third_person']}"
            )
        else:
            past_form = forms['past'] if isinstance(forms['past'], str) else forms['past'][0]
            past_reading = readings['past'] if isinstance(readings['past'], str) else readings['past'][0]
            past_meaning = meanings['past'] if isinstance(meanings['past'], str) else meanings['past'][0]
            
            forms_str = (
                f"(動詞活用){word}({reading}):{meaning}, "
                f"{past_form}({past_reading}):{past_meaning}, "
                f"{forms['past_participle']}({readings['past_participle']}):{meanings['past_participle']}, "
                f"{forms['present_participle']}({readings['present_participle']}):{meanings['present_participle']}, "
                f"{forms['third_person']}({readings['third_person']}):{meanings['third_person']}"
            )
    else:
        # 規則動詞の場合
        forms, readings, meanings = get_regular_verb_forms(word_lower, meaning)
        
        forms_str = (
            f"(動詞活用){word}({reading}):{meaning}, "
            f"{forms['past']}({readings['past']}):{meanings['past']}, "
            f"{forms['past_participle']}({readings['past_participle']}):{meanings['past_participle']}, "
            f"{forms['present_participle']}({readings['present_participle']}):{meanings['present_participle']}, "
            f"{forms['third_person']}({readings['third_person']}):{meanings['third_person']}"
        )
    
    return prefix + forms_str

# CSVファイルを処理
input_file = 'public/data/junior-high-entrance-words.csv'
output_file = 'public/data/junior-high-entrance-words_with_all_conjugations.csv'

rows = []
updated_count = 0
verb_count = 0

print("処理中...")

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows.append(header)
    
    for row in reader:
        if len(row) >= 7:
            word = row[0].strip()
            reading = row[1].strip()
            meaning = row[2].strip()
            related_words = row[4]
            
            # 既に活用形が追加されているかチェック
            if '(動詞活用)' in related_words:
                rows.append(row)
                continue
            
            # 動詞かどうか判定
            if is_verb(meaning):
                verb_count += 1
                new_related_words = add_verb_conjugations(word, meaning, reading, related_words)
                row[4] = new_related_words
                updated_count += 1
                if updated_count <= 20:  # 最初の20個だけ表示
                    print(f"Updated: {word} - {meaning}")
            
            rows.append(row)

# 更新されたCSVを保存
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"\n✅ 完了!")
print(f"動詞候補: {verb_count}個")
print(f"活用形を追加: {updated_count}個")
print(f"出力ファイル: {output_file}")
print(f"\n確認後、以下のコマンドで元のファイルを置き換えてください:")
print(f"mv {output_file} {input_file}")
