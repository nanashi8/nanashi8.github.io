#!/usr/bin/env python3
# Generate katakana suggestions for empty readings without modifying original CSVs
# Output: changes/reading_suggestions.csv with columns: file,line,word,current_reading,suggested_reading

import csv,os,re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
# target CSVs to scan (include both SimpleWord/Resources and root Resources)
targets = [
    root / 'SimpleWord' / 'Resources' / '中学英単語.csv',
    root / 'SimpleWord' / 'Resources' / '中学英熟語.csv',
    root / 'SimpleWord' / 'Resources' / '中学英会話.csv',
    root / 'Resources' / '中学英会話.csv'
]

# romaji->katakana converter (same logic as fill_readings_romaji_to_katakana.py)
 pairs = {
}
# We'll import conversion by copying the logic used previously

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
keys = sorted(pairs.keys(), key=lambda x: -len(x))

fallback = {
    'b':'ブ','c':'ク','d':'ド','f':'フ','g':'グ','h':'ハ','j':'ジ','k':'ク','l':'ル','m':'ム','n':'ン','p':'プ','q':'ク','r':'ル','s':'ス','t':'ト','v':'ヴ','w':'ワ','x':'クス','y':'イ','z':'ズ'
}

import unicodedata

non_ascii_re = re.compile(r'[^\x00-\x7F]')

def romaji_to_katakana(token):
    s0 = token.strip().lower()
    if not s0:
        return ''
    s0 = re.sub(r"[^a-z0-9'-]", ' ', s0)
    parts = s0.split()
    out = []
    for part in parts:
        part = part.replace("'","")
        i = 0
        kat = ''
        while i < len(part):
            if i+1 < len(part) and part[i] == part[i+1] and part[i] not in 'aeiou':
                kat += 'ッ'
                i += 1
                continue
            matched = False
            for k in keys:
                if part.startswith(k, i):
                    kat += pairs[k]
                    i += len(k)
                    matched = True
                    break
            if matched: continue
            ch = part[i]
            if ch in 'aiueo':
                kat += pairs.get(ch, '')
                i += 1
                continue
            if ch.isdigit():
                kat += ch
                i += 1
                continue
            kat += fallback.get(ch, '')
            i += 1
        out.append(kat)
    return ' '.join(out)

# prepare output dir
outdir = root / 'changes'
outdir.mkdir(exist_ok=True)
outpath = outdir / 'reading_suggestions.csv'

with open(outpath, 'w', newline='') as outf:
    writer = csv.writer(outf)
    writer.writerow(['file','line','word','current_reading','suggested_reading'])
    for t in targets:
        if not t.exists():
            continue
        with open(t, newline='') as f:
            reader = csv.reader(f)
            for i,row in enumerate(reader, start=1):
                if i == 1:
                    continue
                word = row[0].strip() if len(row)>0 else ''
                reading = row[1].strip() if len(row)>1 else ''
                if reading == '':
                    suggestion = romaji_to_katakana(word)
                    writer.writerow([str(t.relative_to(root)), i, word, '', suggestion])

print('Generated suggestions at', outpath)
