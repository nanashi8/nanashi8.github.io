#!/usr/bin/env python3
# Fill empty reading fields (column 2) in CSV by converting romanized ascii reading (column1) to katakana
# Usage: python3 fill_readings_romaji_to_katakana.py path/to/csv

import sys
import csv
import re
import shutil

if len(sys.argv) < 2:
    print('Usage: python3 fill_readings_romaji_to_katakana.py path/to/csv')
    sys.exit(1)

csv_path = sys.argv[1]

# Romaji->katakana mapping (greedy, longest match first)
# This mapping is a pragmatic subset covering common syllables used in the dataset.
pairs = {
    'kyu':'キュ','kyo':'キョ','kya':'キャ',
    'shu':'シュ','sho':'ショ','sha':'シャ',
    'cho':'チョ','cha':'チャ','chu':'チュ',
    'ryo':'リョ','rya':'リャ','ryu':'リュ',
    'gyo':'ギョ','gya':'ギャ','gyu':'ギュ',
    'ja':'ジャ','ju':'ジュ','jo':'ジョ','ji':'ジ',
    'tsu':'ツ','shi':'シ','chi':'チ','fu':'フ','a':'ア','i':'イ','u':'ウ','e':'エ','o':'オ',
    'ka':'カ','ki':'キ','ku':'ク','ke':'ケ','ko':'コ',
    'sa':'サ','su':'ス','se':'セ','so':'ソ','sa':'サ','si':'シ',
    'ta':'タ','te':'テ','to':'ト','ti':'ティ','tu':'トゥ',
    'na':'ナ','ni':'ニ','nu':'ヌ','ne':'ネ','no':'ノ',
    'ha':'ハ','hi':'ヒ','hu':'フ','he':'ヘ','ho':'ホ',
    'ba':'バ','bi':'ビ','bu':'ブ','be':'ベ','bo':'ボ',
    'pa':'パ','pi':'ピ','pu':'プ','pe':'ペ','po':'ポ',
    'ma':'マ','mi':'ミ','mu':'ム','me':'メ','mo':'モ',
    'ya':'ヤ','yu':'ユ','yo':'ヨ',
    'ra':'ラ','ri':'リ','ru':'ル','re':'レ','ro':'ロ',
    'wa':'ワ','wo':'ウォ','wa':'ワ','we':'ウェ','wi':'ウィ','wu':'ウ',
    'ga':'ガ','gi':'ギ','gu':'グ','ge':'ゲ','go':'ゴ',
    'za':'ザ','zu':'ズ','ze':'ゼ','zo':'ゾ',
    'la':'ラ','li':'リ','lu':'ル','le':'レ','lo':'ロ',
    'ba':'バ','be':'ベ','bo':'ボ',
    'vu':'ヴ','va':'ヴァ','vi':'ヴィ','ve':'ヴェ','vo':'ヴォ',
    'ye':'イェ','yi':'イィ',
    'she':'シェ','je':'ジェ','che':'チェ','ti':'ティ','di':'ディ','tu':'トゥ',
    'ph':'フ','th':'ス','ng':'ング',
    '-':'・',
}

# Precompute keys sorted by length desc for greedy matching
keys = sorted(pairs.keys(), key=lambda x: -len(x))

# helper to convert ascii token to katakana

def romaji_to_katakana(s):
    s0 = s.strip().lower()
    if not s0:
        return ''
    # replace common punctuation with space
    s0 = re.sub(r"[^a-z0-9'-]", ' ', s0)
    tokens = s0.split()
    out_parts = []
    for token in tokens:
        # handle contractions like i'm -> im
        token = token.replace("'","")
        # handle double consonant (gemination) denoted by double consonants
        i = 0
        kat = ''
        while i < len(token):
            # gemination
            if i+1 < len(token) and token[i] == token[i+1] and token[i] not in 'aeiou':
                kat += 'ッ'
                i += 1
                continue
            matched = False
            for k in keys:
                if token.startswith(k, i):
                    kat += pairs[k]
                    i += len(k)
                    matched = True
                    break
            if matched:
                continue
            ch = token[i]
            # handle single vowels
            if ch in 'aiueo':
                kat += pairs.get(ch, '')
                i += 1
                continue
            # handle numeric -> keep as is (e.g., 1 -> 1)
            if ch.isdigit():
                kat += ch
                i += 1
                continue
            # fallback: treat unknown consonant as its katakana approximation
            fallback = {
                'b':'ブ','c':'ク','d':'ド','f':'フ','g':'グ','h':'ハ','j':'ジ','k':'ク','l':'ル','m':'ム','n':'ン','p':'プ','q':'ク','r':'ル','s':'ス','t':'ト','v':'ヴ','w':'ワ','x':'クス','y':'イ','z':'ズ'
            }
            kat += fallback.get(ch, '')
            i += 1
        out_parts.append(kat)
    # join with space for multiword tokens
    return ' '.join(out_parts)

# read CSV
rows = []
with open(csv_path, newline='') as f:
    reader = csv.reader(f)
    for row in reader:
        rows.append(row)

if not rows:
    print('empty file')
    sys.exit(1)

header = rows[0]
data = rows[1:]

replaced = []
unchanged = []

for i, r in enumerate(data):
    if len(r) < 2:
        unchanged.append((i+2, r))
        continue
    word = r[0].strip()
    reading = r[1].strip()
    if reading:
        unchanged.append((i+2, r))
        continue
    # propose katakana from word
    kat = romaji_to_katakana(word)
    if not kat:
        # leave empty
        replaced.append((i+2, word, ''))
        data[i][1] = ''
    else:
        data[i][1] = kat
        replaced.append((i+2, word, kat))

# backup and write
shutil.copy2(csv_path, csv_path + '.bak.fillkatakana')
with open(csv_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(data)

print(f'Done: filled {len([x for x in replaced if x[2]])} readings, left {len([x for x in replaced if not x[2]])} empty. Total rows processed={len(data)}')
print('\nSample filled (first 50):')
count = 0
for row in replaced:
    if row[2]:
        print(f'line {row[0]}: {row[1]} -> {row[2]}')
        count += 1
        if count >= 50:
            break

print('\nSample left empty (first 50):')
count = 0
for row in replaced:
    if not row[2]:
        print(f'line {row[0]}: {row[1]}')
        count += 1
        if count >= 50:
            break
