#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Improved English-to-Katakana transliteration for the reading column
- Uses pattern-based greedy replacement for common English graphemes
- Handles simple inflections (ed, ing, s) by preserving ending as katakana
- Creates a backup before writing
- Writes changes and samples
"""
import csv, shutil, time, os, re
SRC = '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英単語.csv'
if not os.path.exists(SRC):
    print('ERROR: source not found', SRC); raise SystemExit(1)
BAK = SRC + '.bakv2.' + time.strftime('%Y%m%d%H%M%S')
shutil.copy2(SRC, BAK)
print('Backup created:', BAK)

# detect katakana presence
katakana_re = re.compile(r'[\u30A0-\u30FF]')
# collapse repeated letters
def collapse_repeats(s):
    return re.sub(r'(\w)\1{2,}', r'\1', s)

# ordered mapping (longest first)
PATTERNS = [
    ('tion', 'ション'), ('sion', 'ション'), ('ture', 'チャー'), ('tional', 'ショナル'),
    ('ough', 'オー'), ('ough', 'オフ'), # will match first occurrence
    ('ight', 'イト'), ('igh', 'アイ'), ('ph', 'フ'), ('sh', 'シュ'), ('ch', 'チ'), ('ck', 'ク'), ('ng', 'ング'), ('qu', 'ク'), ('qu', 'ク'),
    ('ea', 'イー'), ('ee', 'イー'), ('ie', 'イー'), ('ei','イー'), ('ai','エイ'), ('ay','エイ'),
    ('ou','アウ'), ('ow','オウ'), ('oa','オー'), ('oo','ウー'), ('au','オー'), ('aw','オー'),
    ('ar','アー'), ('er','ァー'), ('ir','ァー'), ('or','オー'), ('ur','ァー'),
    ('a','ア'),('i','イ'),('u','ウ'),('e','エ'),('o','オ')
]
# consonant to kana approximate when followed by vowel
CONSONANT_VOWEL = {
    'b':{'a':'バ','i':'ビ','u':'ブ','e':'ベ','o':'ボ'},
    'c':{'a':'カ','i':'キ','u':'ク','e':'セ','o':'コ'},
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
    'x':{'a':'クサ','i':'クシ','u':'クス','e':'クセ','o':'クソ'},
    'b':'バ'
}

# final fallback vowel map
VOWELS = {'a':'ア','i':'イ','u':'ウ','e':'エ','o':'オ'}

# main transliteration

def eng_to_kana(word: str) -> str:
    if not word: return ''
    w = word.lower()
    w = re.sub(r"[^a-z]", '', w)
    w = collapse_repeats(w)
    # strip simple plural/inflection but remember suffix
    suffix = ''
    if w.endswith('ing'):
        w_core = w[:-3]
        suffix = 'ング'
    elif w.endswith('ed'):
        w_core = w[:-2]
        suffix = 'ド'
    elif w.endswith('es'):
        w_core = w[:-2]
        suffix = 'ズ'
    elif w.endswith('s') and len(w)>2:
        w_core = w[:-1]
        suffix = 'ズ'
    else:
        w_core = w
    out = ''
    i = 0
    while i < len(w_core):
        matched = False
        # patterns
        for pat, rep in PATTERNS:
            if w_core.startswith(pat, i):
                out += rep
                i += len(pat)
                matched = True
                break
        if matched:
            continue
        # consonant + vowel pair
        if i+1 < len(w_core) and w_core[i] in CONSONANT_VOWEL and w_core[i+1] in VOWELS:
            c = w_core[i]; v = w_core[i+1]
            out += CONSONANT_VOWEL.get(c, {}).get(v, CONSONANT_VOWEL.get(c, {}).get('a',''))
            i += 2
            continue
        # vowel
        if w_core[i] in VOWELS:
            out += VOWELS[w_core[i]]
            i += 1
            continue
        # consonant at end -> map to consonant+ 'ー' or 'ク' approximations
        ch = w_core[i]
        if ch in CONSONANT_VOWEL:
            # use consonant + 'u' mapping
            out += CONSONANT_VOWEL[ch].get('u', '')
        i += 1
    out += suffix
    # post adjustments: long vowels normalize double kana to 'ー' in many cases
    # replace sequences like アア -> アー
    out = re.sub(r'([アイウエオ])\1+', r'\1ー', out)
    # ensure not empty
    if not out:
        out = word
    return out

# process CSV
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
    reading = row[1].strip()
    # if reading lacks katakana, or contains ascii letters, fix
    if not katakana_re.search(reading):
        word = row[0].strip()
        new = eng_to_kana(reading if reading else word)
        if new != reading:
            row[1] = new
            changed += 1
            if len(samples) < 30:
                samples.append((idx+1, word, reading, new))

# write
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
