#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV の第2列（読み）をカタカナに正規化するスクリプト
- バックアップを作成してから上書きします
- 既に日本語（ひらがな・カタカナ・漢字）が含まれる場合は、ひらがなをカタカナに変換して保持
- 英字／ローマ字の場合は簡易ローマ字→カタカナ変換を行う
- 出力：処理件数・変更件数・変更サンプル
"""
import csv
import shutil
import time
import os
import re

SRC = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'SimpleWord', 'Resources', '中学英単語.csv')
# Above path resolves to Tools/../SimpleWord/Resources/..., adjust if needed
if not os.path.exists(SRC):
    # try repository relative
    SRC = '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英単語.csv'

if not os.path.exists(SRC):
    print('ERROR: source file not found:', SRC)
    raise SystemExit(1)

BAK = SRC + '.bak.' + time.strftime('%Y%m%d%H%M%S')
shutil.copy2(SRC, BAK)
print('Backup created:', BAK)

# helpers
kana_offset = ord('ァ') - ord('ぁ')

def hira_to_kata(s: str) -> str:
    # convert hiragana to katakana
    res = []
    for ch in s:
        code = ord(ch)
        # hiragana range
        if 0x3041 <= code <= 0x3096:
            res.append(chr(code + kana_offset))
        else:
            res.append(ch)
    return ''.join(res)

# detection of Japanese characters
jp_re = re.compile(r'[\u3040-\u30ff\u4e00-\u9fff]')

# simplified romaji->katakana map (longest-first)
ROMAJI_MAP = {
    'kyo':'キョ','kyu':'キュ','kya':'キャ',
    'sho':'ショ','shu':'シュ','sha':'シャ',
    'cho':'チョ','chu':'チュ','cha':'チャ',
    'ryo':'リョ','ryu':'リュ','rya':'リャ',
    'gya':'ギャ','gyu':'ギュ','gyo':'ギョ',
    'ja':'ジャ','ju':'ジュ','jo':'ジョ','ji':'ジ',
    'tya':'チャ','dya':'ヂャ',
    'tsu':'ツ','shi':'シ','chi':'チ','ts':'ツ',
    'a':'ア','i':'イ','u':'ウ','e':'エ','o':'オ',
    'ka':'カ','ki':'キ','ku':'ク','ke':'ケ','ko':'コ',
    'sa':'サ','su':'ス','se':'セ','so':'ソ','si':'シ',
    'ta':'タ','ti':'ティ','tu':'ツ','te':'テ','to':'ト',
    'na':'ナ','ni':'ニ','nu':'ヌ','ne':'ネ','no':'ノ',
    'ha':'ハ','hi':'ヒ','fu':'フ','he':'ヘ','ho':'ホ',
    'ma':'マ','mi':'ミ','mu':'ム','me':'メ','mo':'モ',
    'ya':'ヤ','yu':'ユ','yo':'ヨ',
    'la':'ラ','li':'リ','lu':'ル','le':'レ','lo':'ロ','ra':'ラ','ri':'リ','ru':'ル','re':'レ','ro':'ロ',
    'wa':'ワ','wo':'ヲ','we':'ウェ','wi':'ウィ','va':'ヴァ','vi':'ヴィ','vu':'ヴ',
    'ga':'ガ','gi':'ギ','gu':'グ','ge':'ゲ','go':'ゴ',
    'za':'ザ','zi':'ジ','zu':'ズ','ze':'ゼ','zo':'ゾ',
    'da':'ダ','di':'ディ','du':'ドゥ','de':'デ','do':'ド',
    'ba':'バ','bi':'ビ','bu':'ブ','be':'ベ','bo':'ボ',
    'pa':'パ','pi':'ピ','pu':'プ','pe':'ペ','po':'ポ',
    'n':'ン','-':'ー',' ':' ',"'":"",'!':'','?':'',',':'',
}

# create list of keys sorted by length desc
ROMAJI_KEYS = sorted(ROMAJI_MAP.keys(), key=lambda x: -len(x))

# naive romaji to katakana function

def romaji_to_katakana(s: str) -> str:
    s = s.lower()
    s = s.replace('ph','f')
    s = s.replace('qu','ku')
    s = re.sub(r'[^a-z0-9\-\s\']','', s)
    out = ''
    i = 0
    while i < len(s):
        # double consonant (sokuon) handling: e.g., 'tt'
        if i+1 < len(s) and s[i] == s[i+1] and s[i] not in 'aeiouyn -':
            out += 'ッ'
            i += 1
            continue
        matched = False
        for k in ROMAJI_KEYS:
            if s.startswith(k, i):
                out += ROMAJI_MAP[k]
                i += len(k)
                matched = True
                break
        if not matched:
            ch = s[i]
            # if digit, write as number in brackets or kanji? keep as is
            if ch.isdigit():
                out += ch
            else:
                # fallback map single consonant to katakana approximations
                if ch in 'bcdfghjklmnpqrstvwxyz':
                    # append small vowel 'ァ' to represent consonant? better skip
                    # Attempt to pair with next vowel
                    if i+1 < len(s) and s[i+1] in 'aiueo':
                        # will be matched in next iterations
                        out += ''
                    else:
                        out += ''
                else:
                    # vowels may be handled
                    out += ROMAJI_MAP.get(ch, '')
            i += 1
    # Post-process: replace sequences like 'アイ' etc
    # Remove empty
    out = out.replace('  ',' ')
    # Capitalize spaces remain
    return out

# read and update CSV
rows = []
with open(SRC, newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

header = rows[0] if rows else []
changed = 0
samples = []
for idx in range(1, len(rows)):
    row = rows[idx]
    # ensure at least 7 columns
    while len(row) < 7:
        row.append('')
    word = row[0].strip()
    reading = row[1].strip()
    orig_reading = reading
    new_reading = reading
    if reading:
        # if contains any Japanese, convert hiragana to katakana
        if jp_re.search(reading):
            new_reading = hira_to_kata(reading)
        else:
            # reading is ascii roman or English word; transliterate using romaji->katakana
            new_reading = romaji_to_katakana(reading)
    else:
        # no reading: use word itself
        new_reading = romaji_to_katakana(word) if word else ''
    # if result empty fallback to original reading
    if not new_reading:
        new_reading = orig_reading
    # normalize: strip
    new_reading = new_reading.strip()
    if new_reading != orig_reading:
        rows[idx][1] = new_reading
        changed += 1
        if len(samples) < 20:
            samples.append((idx+1, word, orig_reading, new_reading))

# write back
with open(SRC, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print('Processed rows:', len(rows)-1)
print('Changed readings:', changed)
if samples:
    print('\nSample changes:')
    for s in samples:
        print(s)
print('\nDone')
