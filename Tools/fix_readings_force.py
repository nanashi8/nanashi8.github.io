#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Force-normalize reading column to Katakana for all rows using improved transliteration.
- Backup created
- For each English word in column 0, compute lemma then transliterate to katakana
- Overwrite reading column with result
- Output statistics and samples
"""
import csv, shutil, time, os, re
SRC = '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英単語.csv'
if not os.path.exists(SRC):
    print('ERROR: source not found', SRC); raise SystemExit(1)
BAK = SRC + '.forcebak.' + time.strftime('%Y%m%d%H%M%S')
shutil.copy2(SRC, BAK)
print('Backup created:', BAK)

# reuse eng_to_kana from v2 implementation
# For simplicity, reimplement similar mapping here
PATTERNS = [
    ('tion', 'ション'), ('sion', 'ション'), ('tial','シャル'), ('ture', 'チャー'), ('ight', 'イト'), ('ough', 'オー'),
    ('ph', 'フ'), ('sh', 'シュ'), ('ch', 'チ'), ('ck', 'ク'), ('ng', 'ング'), ('qu', 'ク'),
    ('ea', 'イー'), ('ee', 'イー'), ('ie', 'イー'), ('ai','エイ'), ('ay','エイ'), ('ow','オウ'), ('oo','ウー'), ('oa','オー'), ('au','オー'),
    ('ar','アー'), ('er','ァー'), ('ir','ァー'), ('or','オー'), ('ur','ァー'),
]
CONSONANT_VOWEL = {
    'b':{'a':'バ','i':'ビ','u':'ブ','e':'ベ','o':'ボ'},
    'c':{'a':'カ','i':'キ','u':'ク','e':'ク','o':'コ'},
    'd':{'a':'ダ','i':'ディ','u':'ド','e':'デ','o':'ド'},
    'f':{'a':'ファ','i':'フィ','u':'フ','e':'フェ','o':'フォ'},
    'g':{'a':'ガ','i':'ギ','u':'グ','e':'ゲ','o':'ゴ'},
    'h':{'a':'ハ','i':'ヒ','u':'フ','e':'ヘ','o':'ホ'},
    'j':{'a':'ジャ','i':'ジ','u':'ジュ','e':'ジェ','o':'ジョ'},
    'k':{'a':'カ','i':'キ','u':'ク','e':'ケ','o':'コ'},
    'l':{'a':'ラ','i':'リ','u':'ル','e':'レ','o':'ロ'},
    'm':{'a':'マ','i':'ミ','u':'ム','e':'メ','o':'モ'},
    'n':{'a':'ナ','i':'ニ','u':'ヌ','e':'ネ','o':'ノ'},
    'p':{'a':'パ','i':'ピ','u':'プ','e':'ペ','o':'ポ'},
    'r':{'a':'ラ','i':'リ','u':'ル','e':'レ','o':'ロ'},
    's':{'a':'サ','i':'シ','u':'ス','e':'セ','o':'ソ'},
    't':{'a':'タ','i':'チ','u':'ツ','e':'テ','o':'ト'},
    'v':{'a':'ヴァ','i':'ヴィ','u':'ヴ','e':'ヴェ','o':'ヴォ'},
    'w':{'a':'ワ','i':'ウィ','u':'ウ','e':'ウェ','o':'ウォ'},
    'y':{'a':'ヤ','i':'イ','u':'ユ','e':'イェ','o':'ヨ'},
    'z':{'a':'ザ','i':'ジ','u':'ズ','e':'ゼ','o':'ゾ'},
    'x':{'a':'クサ','i':'クシ','u':'クス','e':'クセ','o':'クソ'}
}
VOWELS = {'a':'ア','i':'イ','u':'ウ','e':'エ','o':'オ'}

def collapse_repeats(s):
    return re.sub(r'(\w)\1{2,}', r'\1', s)

def eng_to_kana(word: str) -> str:
    if not word: return ''
    w = word.lower()
    w = re.sub(r"[^a-z]", '', w)
    w = collapse_repeats(w)
    suffix = ''
    # prefer to transliterate lemma
    lemma = w
    if w.endswith('ing') and len(w)>4:
        lemma = w[:-3]
        suffix = 'ング'
    elif w.endswith('ed') and len(w)>3:
        lemma = w[:-2]
        suffix = 'ド'
    elif w.endswith('es') and len(w)>3:
        lemma = w[:-2]
        suffix = 'ズ'
    elif w.endswith('s') and len(w)>2:
        lemma = w[:-1]
        suffix = 'ズ'
    else:
        lemma = w
    out = ''
    i = 0
    while i < len(lemma):
        matched = False
        for pat, rep in PATTERNS:
            if lemma.startswith(pat, i):
                out += rep
                i += len(pat)
                matched = True
                break
        if matched:
            continue
        if i+1 < len(lemma) and lemma[i] in CONSONANT_VOWEL and lemma[i+1] in VOWELS:
            c = lemma[i]; v = lemma[i+1]
            out += CONSONANT_VOWEL.get(c, {}).get(v, '')
            i += 2
            continue
        if lemma[i] in VOWELS:
            out += VOWELS[lemma[i]]
            i += 1
            continue
        ch = lemma[i]
        if ch in CONSONANT_VOWEL:
            out += CONSONANT_VOWEL[ch].get('u','')
        i += 1
    out += suffix
    out = re.sub(r'([アイウエオ])\1+', r'\1ー', out)
    if not out:
        out = word
    return out

# process
rows = []
with open(SRC, newline='', encoding='utf-8') as f:
    rows = list(csv.reader(f))
header = rows[0]
changed = 0
samples = []
for idx in range(1, len(rows)):
    row = rows[idx]
    while len(row) < 7:
        row.append('')
    word = row[0].strip()
    new = eng_to_kana(word)
    if row[1].strip() != new:
        old = row[1]
        rows[idx][1] = new
        changed += 1
        if len(samples) < 30:
            samples.append((idx+1, word, old, new))

with open(SRC, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print('Processed rows:', len(rows)-1)
print('Changed readings:', changed)
if samples:
    print('\nSample changes:')
    for s in samples[:30]:
        print(s)
print('\nDone')
