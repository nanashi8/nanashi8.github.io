#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

# カタカナ読みの処理ヘルパー
def get_base_reading(reading):
    """アクセント記号を除去"""
    return reading.replace('́', '')

def generate_past_reading(base_reading):
    """過去形の読みを生成（-ed）"""
    base = get_base_reading(base_reading)
    # 基本的に「エド」「ド」「ト」のいずれか
    # 語尾が t/d なら -ed, 無声音なら -t, 有声音なら -d
    if base.endswith(('ト', 'ド')):
        return base + 'エド'
    elif base.endswith(('ク', 'プ', 'フ', 'ス', 'シュ')):
        return base + 'ト'
    else:
        return base + 'ド'

def generate_ing_reading(base_reading, word):
    """現在分詞の読みを生成（-ing）"""
    base = get_base_reading(base_reading)
    
    # 語尾のe を取る場合
    if word.endswith('e') and not word.endswith('ee'):
        # like → liking: ライク → ライキング
        if base.endswith('ク'):
            return base[:-1] + 'キング'
        elif base.endswith('ブ'):
            return base[:-1] + 'ビング'
        elif base.endswith('ト'):
            return base[:-1] + 'ティング'
        elif base.endswith('ズ'):
            return base[:-1] + 'ジング'
        elif base.endswith('プ'):
            return base[:-1] + 'ピング'
        else:
            return base + 'イング'
    else:
        return base + 'イング'

def generate_s_reading(base_reading, word):
    """三人称単数形の読みを生成（-s/-es）"""
    base = get_base_reading(base_reading)
    
    # es形
    if word.endswith(('s', 'x', 'z', 'ch', 'sh', 'o')):
        if base.endswith('ズ'):
            return base + 'ィズ'
        elif base.endswith('ッシュ'):
            return base + 'ィズ'
        elif base.endswith('チ'):
            return base + 'ィズ'
        else:
            return base + 'エス'
    # y → ies
    elif word.endswith('y') and len(word) > 2 and word[-2] not in 'aeiou':
        if base.endswith('ィ'):
            return base[:-1] + 'ィズ'
        else:
            return base + 'ズ'
    # 通常の -s
    else:
        if base.endswith(('ク', 'プ', 'フ', 'ス', 'シュ', 'ト')):
            return base + 'ス'
        else:
            return base + 'ズ'

# 不規則動詞データベース（読みと意味付き）
IRREGULAR_VERBS = {
    'be': {
        'forms': {'past': ['was', 'were'], 'past_participle': 'been', 'present_participle': 'being', 'third_person': 'is'},
        'readings': {'past': ['ワズ', 'ワー'], 'past_participle': 'ビーン', 'present_participle': 'ビーイング', 'third_person': 'イズ'},
        'meanings': {'past': ['だった'], 'past_participle': 'いた', 'present_participle': 'であること', 'third_person': 'である'}
    },
    'am': {
        'forms': {'past': 'was', 'past_participle': 'been', 'present_participle': 'being', 'third_person': 'is'},
        'readings': {'past': 'ワズ', 'past_participle': 'ビーン', 'present_participle': 'ビーイング', 'third_person': 'イズ'},
        'meanings': {'past': 'だった', 'past_participle': 'いた', 'present_participle': 'であること', 'third_person': 'である'}
    },
    'have': {
        'forms': {'past': 'had', 'past_participle': 'had', 'present_participle': 'having', 'third_person': 'has'},
        'readings': {'past': 'ハッド', 'past_participle': 'ハッド', 'present_participle': 'ハビング', 'third_person': 'ハズ'},
        'meanings': {'past': '持っていた', 'past_participle': '持っていた', 'present_participle': '持つこと', 'third_person': '持つ'}
    },
    'do': {
        'forms': {'past': 'did', 'past_participle': 'done', 'present_participle': 'doing', 'third_person': 'does'},
        'readings': {'past': 'ディッド', 'past_participle': 'ダン', 'present_participle': 'ドゥーイング', 'third_person': 'ダズ'},
        'meanings': {'past': 'した', 'past_participle': 'した', 'present_participle': 'すること', 'third_person': 'する'}
    },
    'go': {
        'forms': {'past': 'went', 'past_participle': 'gone', 'present_participle': 'going', 'third_person': 'goes'},
        'readings': {'past': 'ウェント', 'past_participle': 'ゴーン', 'present_participle': 'ゴーイング', 'third_person': 'ゴーズ'},
        'meanings': {'past': '行った', 'past_participle': '行った', 'present_participle': '行くこと', 'third_person': '行く'}
    },
    'make': {
        'forms': {'past': 'made', 'past_participle': 'made', 'present_participle': 'making', 'third_person': 'makes'},
        'readings': {'past': 'メイド', 'past_participle': 'メイド', 'present_participle': 'メイキング', 'third_person': 'メイクス'},
        'meanings': {'past': '作った', 'past_participle': '作った', 'present_participle': '作ること', 'third_person': '作る'}
    },
    'take': {
        'forms': {'past': 'took', 'past_participle': 'taken', 'present_participle': 'taking', 'third_person': 'takes'},
        'readings': {'past': 'トゥック', 'past_participle': 'テイクン', 'present_participle': 'テイキング', 'third_person': 'テイクス'},
        'meanings': {'past': '取った', 'past_participle': '取った', 'present_participle': '取ること', 'third_person': '取る'}
    },
    'come': {
        'forms': {'past': 'came', 'past_participle': 'come', 'present_participle': 'coming', 'third_person': 'comes'},
        'readings': {'past': 'ケイム', 'past_participle': 'カム', 'present_participle': 'カミング', 'third_person': 'カムズ'},
        'meanings': {'past': '来た', 'past_participle': '来た', 'present_participle': '来ること', 'third_person': '来る'}
    },
    'see': {
        'forms': {'past': 'saw', 'past_participle': 'seen', 'present_participle': 'seeing', 'third_person': 'sees'},
        'readings': {'past': 'ソー', 'past_participle': 'シーン', 'present_participle': 'シーイング', 'third_person': 'シーズ'},
        'meanings': {'past': '見た', 'past_participle': '見た', 'present_participle': '見ること', 'third_person': '見る'}
    },
    'know': {
        'forms': {'past': 'knew', 'past_participle': 'known', 'present_participle': 'knowing', 'third_person': 'knows'},
        'readings': {'past': 'ニュー', 'past_participle': 'ノウン', 'present_participle': 'ノーイング', 'third_person': 'ノウズ'},
        'meanings': {'past': '知っていた', 'past_participle': '知られた', 'present_participle': '知ること', 'third_person': '知る'}
    },
    'get': {
        'forms': {'past': 'got', 'past_participle': 'gotten', 'present_participle': 'getting', 'third_person': 'gets'},
        'readings': {'past': 'ゴット', 'past_participle': 'ゴットン', 'present_participle': 'ゲッティング', 'third_person': 'ゲッツ'},
        'meanings': {'past': '得た', 'past_participle': '得た', 'present_participle': '得ること', 'third_person': '得る'}
    },
    'give': {
        'forms': {'past': 'gave', 'past_participle': 'given', 'present_participle': 'giving', 'third_person': 'gives'},
        'readings': {'past': 'ゲイヴ', 'past_participle': 'ギヴン', 'present_participle': 'ギビング', 'third_person': 'ギヴズ'},
        'meanings': {'past': '与えた', 'past_participle': '与えた', 'present_participle': '与えること', 'third_person': '与える'}
    },
    'find': {
        'forms': {'past': 'found', 'past_participle': 'found', 'present_participle': 'finding', 'third_person': 'finds'},
        'readings': {'past': 'ファウンド', 'past_participle': 'ファウンド', 'present_participle': 'ファインディング', 'third_person': 'ファインズ'},
        'meanings': {'past': '見つけた', 'past_participle': '見つけた', 'present_participle': '見つけること', 'third_person': '見つける'}
    },
    'think': {
        'forms': {'past': 'thought', 'past_participle': 'thought', 'present_participle': 'thinking', 'third_person': 'thinks'},
        'readings': {'past': 'ソート', 'past_participle': 'ソート', 'present_participle': 'シンキング', 'third_person': 'シンクス'},
        'meanings': {'past': '考えた', 'past_participle': '考えた', 'present_participle': '考えること', 'third_person': '考える'}
    },
    'tell': {
        'forms': {'past': 'told', 'past_participle': 'told', 'present_participle': 'telling', 'third_person': 'tells'},
        'readings': {'past': 'トールド', 'past_participle': 'トールド', 'present_participle': 'テリング', 'third_person': 'テルズ'},
        'meanings': {'past': '言った', 'past_participle': '言った', 'present_participle': '言うこと', 'third_person': '言う'}
    },
    'become': {
        'forms': {'past': 'became', 'past_participle': 'become', 'present_participle': 'becoming', 'third_person': 'becomes'},
        'readings': {'past': 'ビケイム', 'past_participle': 'ビカム', 'present_participle': 'ビカミング', 'third_person': 'ビカムズ'},
        'meanings': {'past': 'なった', 'past_participle': 'なった', 'present_participle': 'なること', 'third_person': 'なる'}
    },
    'leave': {
        'forms': {'past': 'left', 'past_participle': 'left', 'present_participle': 'leaving', 'third_person': 'leaves'},
        'readings': {'past': 'レフト', 'past_participle': 'レフト', 'present_participle': 'リービング', 'third_person': 'リーブズ'},
        'meanings': {'past': '去った', 'past_participle': '去った', 'present_participle': '去ること', 'third_person': '去る'}
    },
    'feel': {
        'forms': {'past': 'felt', 'past_participle': 'felt', 'present_participle': 'feeling', 'third_person': 'feels'},
        'readings': {'past': 'フェルト', 'past_participle': 'フェルト', 'present_participle': 'フィーリング', 'third_person': 'フィールズ'},
        'meanings': {'past': '感じた', 'past_participle': '感じた', 'present_participle': '感じること', 'third_person': '感じる'}
    },
    'bring': {
        'forms': {'past': 'brought', 'past_participle': 'brought', 'present_participle': 'bringing', 'third_person': 'brings'},
        'readings': {'past': 'ブロート', 'past_participle': 'ブロート', 'present_participle': 'ブリンギング', 'third_person': 'ブリングズ'},
        'meanings': {'past': '持って来た', 'past_participle': '持って来た', 'present_participle': '持って来ること', 'third_person': '持って来る'}
    },
    'begin': {
        'forms': {'past': 'began', 'past_participle': 'begun', 'present_participle': 'beginning', 'third_person': 'begins'},
        'readings': {'past': 'ビガン', 'past_participle': 'ビガン', 'present_participle': 'ビギニング', 'third_person': 'ビギンズ'},
        'meanings': {'past': '始めた', 'past_participle': '始めた', 'present_participle': '始めること', 'third_person': '始める'}
    },
    'keep': {
        'forms': {'past': 'kept', 'past_participle': 'kept', 'present_participle': 'keeping', 'third_person': 'keeps'},
        'readings': {'past': 'ケプト', 'past_participle': 'ケプト', 'present_participle': 'キーピング', 'third_person': 'キープス'},
        'meanings': {'past': '保った', 'past_participle': '保った', 'present_participle': '保つこと', 'third_person': '保つ'}
    },
    'write': {
        'forms': {'past': 'wrote', 'past_participle': 'written', 'present_participle': 'writing', 'third_person': 'writes'},
        'readings': {'past': 'ロウト', 'past_participle': 'リトン', 'present_participle': 'ライティング', 'third_person': 'ライツ'},
        'meanings': {'past': '書いた', 'past_participle': '書いた', 'present_participle': '書くこと', 'third_person': '書く'}
    },
    'read': {
        'forms': {'past': 'read', 'past_participle': 'read', 'present_participle': 'reading', 'third_person': 'reads'},
        'readings': {'past': 'レッド', 'past_participle': 'レッド', 'present_participle': 'リーディング', 'third_person': 'リーズ'},
        'meanings': {'past': '読んだ', 'past_participle': '読んだ', 'present_participle': '読むこと', 'third_person': '読む'}
    },
    'eat': {
        'forms': {'past': 'ate', 'past_participle': 'eaten', 'present_participle': 'eating', 'third_person': 'eats'},
        'readings': {'past': 'エイト', 'past_participle': 'イートン', 'present_participle': 'イーティング', 'third_person': 'イーツ'},
        'meanings': {'past': '食べた', 'past_participle': '食べた', 'present_participle': '食べること', 'third_person': '食べる'}
    },
    'buy': {
        'forms': {'past': 'bought', 'past_participle': 'bought', 'present_participle': 'buying', 'third_person': 'buys'},
        'readings': {'past': 'ボート', 'past_participle': 'ボート', 'present_participle': 'バイング', 'third_person': 'バイズ'},
        'meanings': {'past': '買った', 'past_participle': '買った', 'present_participle': '買うこと', 'third_person': '買う'}
    },
    'break': {
        'forms': {'past': 'broke', 'past_participle': 'broken', 'present_participle': 'breaking', 'third_person': 'breaks'},
        'readings': {'past': 'ブロウク', 'past_participle': 'ブロウクン', 'present_participle': 'ブレイキング', 'third_person': 'ブレイクス'},
        'meanings': {'past': '壊した', 'past_participle': '壊した', 'present_participle': '壊すこと', 'third_person': '壊す'}
    },
    'send': {
        'forms': {'past': 'sent', 'past_participle': 'sent', 'present_participle': 'sending', 'third_person': 'sends'},
        'readings': {'past': 'セント', 'past_participle': 'セント', 'present_participle': 'センディング', 'third_person': 'センズ'},
        'meanings': {'past': '送った', 'past_participle': '送った', 'present_participle': '送ること', 'third_person': '送る'}
    },
    'hear': {
        'forms': {'past': 'heard', 'past_participle': 'heard', 'present_participle': 'hearing', 'third_person': 'hears'},
        'readings': {'past': 'ハード', 'past_participle': 'ハード', 'present_participle': 'ヒアリング', 'third_person': 'ヒアズ'},
        'meanings': {'past': '聞いた', 'past_participle': '聞いた', 'present_participle': '聞くこと', 'third_person': '聞く'}
    },
    'meet': {
        'forms': {'past': 'met', 'past_participle': 'met', 'present_participle': 'meeting', 'third_person': 'meets'},
        'readings': {'past': 'メット', 'past_participle': 'メット', 'present_participle': 'ミーティング', 'third_person': 'ミーツ'},
        'meanings': {'past': '会った', 'past_participle': '会った', 'present_participle': '会うこと', 'third_person': '会う'}
    },
    'run': {
        'forms': {'past': 'ran', 'past_participle': 'run', 'present_participle': 'running', 'third_person': 'runs'},
        'readings': {'past': 'ラン', 'past_participle': 'ラン', 'present_participle': 'ランニング', 'third_person': 'ランズ'},
        'meanings': {'past': '走った', 'past_participle': '走った', 'present_participle': '走ること', 'third_person': '走る'}
    },
    'sit': {
        'forms': {'past': 'sat', 'past_participle': 'sat', 'present_participle': 'sitting', 'third_person': 'sits'},
        'readings': {'past': 'サット', 'past_participle': 'サット', 'present_participle': 'シッティング', 'third_person': 'シッツ'},
        'meanings': {'past': '座った', 'past_participle': '座った', 'present_participle': '座ること', 'third_person': '座る'}
    },
    'stand': {
        'forms': {'past': 'stood', 'past_participle': 'stood', 'present_participle': 'standing', 'third_person': 'stands'},
        'readings': {'past': 'ストゥッド', 'past_participle': 'ストゥッド', 'present_participle': 'スタンディング', 'third_person': 'スタンズ'},
        'meanings': {'past': '立った', 'past_participle': '立った', 'present_participle': '立つこと', 'third_person': '立つ'}
    },
    'speak': {
        'forms': {'past': 'spoke', 'past_participle': 'spoken', 'present_participle': 'speaking', 'third_person': 'speaks'},
        'readings': {'past': 'スポウク', 'past_participle': 'スポウクン', 'present_participle': 'スピーキング', 'third_person': 'スピークス'},
        'meanings': {'past': '話した', 'past_participle': '話した', 'present_participle': '話すこと', 'third_person': '話す'}
    },
    'fly': {
        'forms': {'past': 'flew', 'past_participle': 'flown', 'present_participle': 'flying', 'third_person': 'flies'},
        'readings': {'past': 'フルー', 'past_participle': 'フロウン', 'present_participle': 'フライング', 'third_person': 'フライズ'},
        'meanings': {'past': '飛んだ', 'past_participle': '飛んだ', 'present_participle': '飛ぶこと', 'third_person': '飛ぶ'}
    },
    'swim': {
        'forms': {'past': 'swam', 'past_participle': 'swum', 'present_participle': 'swimming', 'third_person': 'swims'},
        'readings': {'past': 'スワム', 'past_participle': 'スワム', 'present_participle': 'スイミング', 'third_person': 'スイムズ'},
        'meanings': {'past': '泳いだ', 'past_participle': '泳いだ', 'present_participle': '泳ぐこと', 'third_person': '泳ぐ'}
    },
    'sing': {
        'forms': {'past': 'sang', 'past_participle': 'sung', 'present_participle': 'singing', 'third_person': 'sings'},
        'readings': {'past': 'サング', 'past_participle': 'サング', 'present_participle': 'シンギング', 'third_person': 'シングズ'},
        'meanings': {'past': '歌った', 'past_participle': '歌った', 'present_participle': '歌うこと', 'third_person': '歌う'}
    },
    'drink': {
        'forms': {'past': 'drank', 'past_participle': 'drunk', 'present_participle': 'drinking', 'third_person': 'drinks'},
        'readings': {'past': 'ドランク', 'past_participle': 'ドランク', 'present_participle': 'ドリンキング', 'third_person': 'ドリンクス'},
        'meanings': {'past': '飲んだ', 'past_participle': '飲んだ', 'present_participle': '飲むこと', 'third_person': '飲む'}
    },
    'hold': {
        'forms': {'past': 'held', 'past_participle': 'held', 'present_participle': 'holding', 'third_person': 'holds'},
        'readings': {'past': 'ヘルド', 'past_participle': 'ヘルド', 'present_participle': 'ホールディング', 'third_person': 'ホールズ'},
        'meanings': {'past': '持った', 'past_participle': '持った', 'present_participle': '持つこと', 'third_person': '持つ'}
    },
    'let': {
        'forms': {'past': 'let', 'past_participle': 'let', 'present_participle': 'letting', 'third_person': 'lets'},
        'readings': {'past': 'レット', 'past_participle': 'レット', 'present_participle': 'レッティング', 'third_person': 'レッツ'},
        'meanings': {'past': 'させた', 'past_participle': 'させた', 'present_participle': 'させること', 'third_person': 'させる'}
    },
    'mean': {
        'forms': {'past': 'meant', 'past_participle': 'meant', 'present_participle': 'meaning', 'third_person': 'means'},
        'readings': {'past': 'メント', 'past_participle': 'メント', 'present_participle': 'ミーニング', 'third_person': 'ミーンズ'},
        'meanings': {'past': '意味した', 'past_participle': '意味した', 'present_participle': '意味すること', 'third_person': '意味する'}
    },
    'set': {
        'forms': {'past': 'set', 'past_participle': 'set', 'present_participle': 'setting', 'third_person': 'sets'},
        'readings': {'past': 'セット', 'past_participle': 'セット', 'present_participle': 'セッティング', 'third_person': 'セッツ'},
        'meanings': {'past': '置いた', 'past_participle': '置いた', 'present_participle': '置くこと', 'third_person': '置く'}
    },
    'pay': {
        'forms': {'past': 'paid', 'past_participle': 'paid', 'present_participle': 'paying', 'third_person': 'pays'},
        'readings': {'past': 'ペイド', 'past_participle': 'ペイド', 'present_participle': 'ペイング', 'third_person': 'ペイズ'},
        'meanings': {'past': '支払った', 'past_participle': '支払った', 'present_participle': '支払うこと', 'third_person': '支払う'}
    },
    'grow': {
        'forms': {'past': 'grew', 'past_participle': 'grown', 'present_participle': 'growing', 'third_person': 'grows'},
        'readings': {'past': 'グルー', 'past_participle': 'グロウン', 'present_participle': 'グローイング', 'third_person': 'グロウズ'},
        'meanings': {'past': '成長した', 'past_participle': '成長した', 'present_participle': '成長すること', 'third_person': '成長する'}
    },
    'lose': {
        'forms': {'past': 'lost', 'past_participle': 'lost', 'present_participle': 'losing', 'third_person': 'loses'},
        'readings': {'past': 'ロスト', 'past_participle': 'ロスト', 'present_participle': 'ルージング', 'third_person': 'ルーズィズ'},
        'meanings': {'past': '失った', 'past_participle': '失った', 'present_participle': '失うこと', 'third_person': '失う'}
    },
    'fall': {
        'forms': {'past': 'fell', 'past_participle': 'fallen', 'present_participle': 'falling', 'third_person': 'falls'},
        'readings': {'past': 'フェル', 'past_participle': 'フォールン', 'present_participle': 'フォーリング', 'third_person': 'フォールズ'},
        'meanings': {'past': '落ちた', 'past_participle': '落ちた', 'present_participle': '落ちること', 'third_person': '落ちる'}
    },
    'build': {
        'forms': {'past': 'built', 'past_participle': 'built', 'present_participle': 'building', 'third_person': 'builds'},
        'readings': {'past': 'ビルト', 'past_participle': 'ビルト', 'present_participle': 'ビルディング', 'third_person': 'ビルズ'},
        'meanings': {'past': '建てた', 'past_participle': '建てた', 'present_participle': '建てること', 'third_person': '建てる'}
    },
    'understand': {
        'forms': {'past': 'understood', 'past_participle': 'understood', 'present_participle': 'understanding', 'third_person': 'understands'},
        'readings': {'past': 'アンダストゥッド', 'past_participle': 'アンダストゥッド', 'present_participle': 'アンダスタンディング', 'third_person': 'アンダスタンズ'},
        'meanings': {'past': '理解した', 'past_participle': '理解した', 'present_participle': '理解すること', 'third_person': '理解する'}
    },
    'draw': {
        'forms': {'past': 'drew', 'past_participle': 'drawn', 'present_participle': 'drawing', 'third_person': 'draws'},
        'readings': {'past': 'ドゥルー', 'past_participle': 'ドローン', 'present_participle': 'ドローイング', 'third_person': 'ドローズ'},
        'meanings': {'past': '描いた', 'past_participle': '描いた', 'present_participle': '描くこと', 'third_person': '描く'}
    },
    'spend': {
        'forms': {'past': 'spent', 'past_participle': 'spent', 'present_participle': 'spending', 'third_person': 'spends'},
        'readings': {'past': 'スペント', 'past_participle': 'スペント', 'present_participle': 'スペンディング', 'third_person': 'スペンズ'},
        'meanings': {'past': '使った', 'past_participle': '使った', 'present_participle': '使うこと', 'third_person': '使う'}
    },
    'cut': {
        'forms': {'past': 'cut', 'past_participle': 'cut', 'present_participle': 'cutting', 'third_person': 'cuts'},
        'readings': {'past': 'カット', 'past_participle': 'カット', 'present_participle': 'カッティング', 'third_person': 'カッツ'},
        'meanings': {'past': '切った', 'past_participle': '切った', 'present_participle': '切ること', 'third_person': '切る'}
    },
    'sell': {
        'forms': {'past': 'sold', 'past_participle': 'sold', 'present_participle': 'selling', 'third_person': 'sells'},
        'readings': {'past': 'ソウルド', 'past_participle': 'ソウルド', 'present_participle': 'セリング', 'third_person': 'セルズ'},
        'meanings': {'past': '売った', 'past_participle': '売った', 'present_participle': '売ること', 'third_person': '売る'}
    },
}

def is_verb(meaning):
    """意味から動詞かどうかを判定"""
    verb_patterns = [
        r'する$', r'させる$', r'れる$', r'られる$', r'む$', r'ぶ$', r'ぬ$', 
        r'つ$', r'る$', r'う$', r'く$', r'ぐ$', r'す$'
    ]
    
    meaning_parts = meaning.split('・')
    
    for part in meaning_parts:
        part = part.strip()
        if any(re.search(pattern, part) for pattern in verb_patterns):
            return True
    
    return False

def get_regular_verb_forms(verb):
    """規則動詞の活用形を生成"""
    forms = {}
    
    # 過去形・過去分詞
    if verb.endswith('e'):
        forms['past'] = verb + 'd'
        forms['past_participle'] = verb + 'd'
    elif verb.endswith('y') and len(verb) > 2 and verb[-2] not in 'aeiou':
        forms['past'] = verb[:-1] + 'ied'
        forms['past_participle'] = verb[:-1] + 'ied'
    elif len(verb) >= 3 and verb[-1] not in 'aeiouwxy' and verb[-2] in 'aeiou' and verb[-3] not in 'aeiou':
        forms['past'] = verb + verb[-1] + 'ed'
        forms['past_participle'] = verb + verb[-1] + 'ed'
    else:
        forms['past'] = verb + 'ed'
        forms['past_participle'] = verb + 'ed'
    
    # 三単現
    if verb.endswith(('s', 'x', 'z', 'ch', 'sh', 'o')):
        forms['third_person'] = verb + 'es'
    elif verb.endswith('y') and len(verb) > 2 and verb[-2] not in 'aeiou':
        forms['third_person'] = verb[:-1] + 'ies'
    else:
        forms['third_person'] = verb + 's'
    
    # 現在分詞
    if verb.endswith('ie'):
        forms['present_participle'] = verb[:-2] + 'ying'
    elif verb.endswith('e') and not verb.endswith('ee'):
        forms['present_participle'] = verb[:-1] + 'ing'
    elif len(verb) >= 3 and verb[-1] not in 'aeiouwxy' and verb[-2] in 'aeiou' and verb[-3] not in 'aeiou':
        forms['present_participle'] = verb + verb[-1] + 'ing'
    else:
        forms['present_participle'] = verb + 'ing'
    
    return forms

def generate_meanings(base_meaning):
    """基本形の意味から活用形の意味を生成"""
    meanings = {}
    base_verb = base_meaning.split('・')[0].strip()
    
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
    elif base_verb.endswith('む'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}んだ'
        meanings['past_participle'] = f'{root}まれた'
        meanings['present_participle'] = f'{root}むこと'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('ぶ'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}んだ'
        meanings['past_participle'] = f'{root}ばれた'
        meanings['present_participle'] = f'{root}ぶこと'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('く'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}いた'
        meanings['past_participle'] = f'{root}かれた'
        meanings['present_participle'] = f'{root}くこと'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('ぐ'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}いだ'
        meanings['past_participle'] = f'{root}がれた'
        meanings['present_participle'] = f'{root}ぐこと'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('す'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}した'
        meanings['past_participle'] = f'{root}された'
        meanings['present_participle'] = f'{root}すこと'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('つ'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}った'
        meanings['past_participle'] = f'{root}たれた'
        meanings['present_participle'] = f'{root}つこと'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('う'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}った'
        meanings['past_participle'] = f'{root}われた'
        meanings['present_participle'] = f'{root}うこと'
        meanings['third_person'] = base_verb
    elif base_verb.endswith('ぬ'):
        root = base_verb[:-1]
        meanings['past'] = f'{root}んだ'
        meanings['past_participle'] = f'{root}なれた'
        meanings['present_participle'] = f'{root}ぬこと'
        meanings['third_person'] = base_verb
    else:
        meanings['past'] = f'{base_verb}た'
        meanings['past_participle'] = f'{base_verb}られた'
        meanings['present_participle'] = f'{base_verb}こと'
        meanings['third_person'] = base_verb
    
    return meanings

def add_verb_conjugations(word, meaning, reading, related_words):
    """動詞の活用形を関連語に追加"""
    word_lower = word.lower()
    
    if related_words and related_words.strip():
        prefix = related_words + ', '
    else:
        prefix = ''
    
    # 不規則動詞の場合
    if word_lower in IRREGULAR_VERBS:
        conj = IRREGULAR_VERBS[word_lower]
        forms = conj['forms']
        readings_dict = conj['readings']
        meanings_dict = conj['meanings']
        
        # be/amの特殊処理
        if word_lower in ['be', 'am']:
            if isinstance(forms['past'], list):
                forms_str = (
                    f"(動詞活用){word}({reading}):{meaning}, "
                    f"was/were({readings_dict['past'][0]}/{readings_dict['past'][1]}):{meanings_dict['past'][0]}, "
                    f"{forms['past_participle']}({readings_dict['past_participle']}):{meanings_dict['past_participle']}, "
                    f"{forms['present_participle']}({readings_dict['present_participle']}):{meanings_dict['present_participle']}, "
                    f"{forms['third_person']}({readings_dict['third_person']}):{meanings_dict['third_person']}"
                )
            else:
                forms_str = (
                    f"(動詞活用){word}({reading}):{meaning}, "
                    f"{forms['past']}({readings_dict['past']}):{meanings_dict['past']}, "
                    f"{forms['past_participle']}({readings_dict['past_participle']}):{meanings_dict['past_participle']}, "
                    f"{forms['present_participle']}({readings_dict['present_participle']}):{meanings_dict['present_participle']}, "
                    f"{forms['third_person']}({readings_dict['third_person']}):{meanings_dict['third_person']}"
                )
        else:
            forms_str = (
                f"(動詞活用){word}({reading}):{meaning}, "
                f"{forms['past']}({readings_dict['past']}):{meanings_dict['past']}, "
                f"{forms['past_participle']}({readings_dict['past_participle']}):{meanings_dict['past_participle']}, "
                f"{forms['present_participle']}({readings_dict['present_participle']}):{meanings_dict['present_participle']}, "
                f"{forms['third_person']}({readings_dict['third_person']}):{meanings_dict['third_person']}"
            )
    else:
        # 規則動詞の場合
        forms = get_regular_verb_forms(word_lower)
        meanings_dict = generate_meanings(meaning)
        
        # 読みを生成
        past_reading = generate_past_reading(reading)
        ing_reading = generate_ing_reading(reading, word_lower)
        s_reading = generate_s_reading(reading, word_lower)
        
        forms_str = (
            f"(動詞活用){word}({reading}):{meaning}, "
            f"{forms['past']}({past_reading}):{meanings_dict['past']}, "
            f"{forms['past_participle']}({past_reading}):{meanings_dict['past_participle']}, "
            f"{forms['present_participle']}({ing_reading}):{meanings_dict['present_participle']}, "
            f"{forms['third_person']}({s_reading}):{meanings_dict['third_person']}"
        )
    
    return prefix + forms_str

# CSVファイルを処理
input_file = 'public/data/junior-high-entrance-words.csv'
output_file = 'public/data/junior-high-entrance-words_updated.csv'

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
                if updated_count <= 10:
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
