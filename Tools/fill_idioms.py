#!/usr/bin/env python3
# fill_idioms.py
# Safely fill missing meanings, etymology and normalize related field to single word

from pathlib import Path
import csv,shutil,datetime

p = Path('../SimpleWord/Resources/中学英熟語.csv').resolve()
if not p.exists():
    p = Path(__file__).parent.parent / 'SimpleWord' / 'Resources' / '中学英熟語.csv'
    p = p.resolve()
if not p.exists():
    print('ERROR: target CSV not found at expected locations')
    print('tried:', p)
    raise SystemExit(1)

bak = p.with_suffix('.csv.bak.' + datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
shutil.copy2(p, bak)
print('backup created:', bak)

# minimal mapping (extendable)
m = {
    'put on':'（服を）着る、（スイッチを）つける',
    'put off':'延期する、（人を）やる気をなくす',
    'put out':'消す、（情報を）公表する',
    'put up':'掲示する、（泊める）',
    'put away':'片付ける、しまう',
    'put back':'元に戻す',
    'put through':'（電話を）つなぐ、（経験を）受けさせる',
    'get up':'起きる',
    'get off':'降りる、（仕事を）終える',
    'get on':'乗る、仲良くする',
    'get out':'外に出る、漏れる',
    'get over':'克服する',
    'get along':'仲良くやる',
    'get through':'切り抜ける、（電話が）つながる',
    'get back':'戻る、取り戻す',
    'get around':'（問題を）回避する、（町を）回る',
    'bring up':'育てる、（話題を）持ち出す',
    'bring out':'発売する、引き立てる',
    'bring back':'思い出させる、持ち帰る',
    'bring about':'引き起こす',
    'go out':'外出する',
    'go in':'入る',
    'go on':'続く、起こる',
    'go off':'鳴る、爆発する、腐る',
    'go over':'復習する、越える',
    'go through':'経験する、調べる',
    'go back':'戻る',
    'go ahead':'先に進める、どうぞ',
    'go away':'去る',
    'go along':'（一緒に）行く、進む',
    'give up':'諦める',
    'give in':'折れる、提出する',
    'give out':'配る、尽きる',
    'give back':'返す',
    'give away':'配る、（秘密を）漏らす',
    'call up':'電話をかける、召喚する',
    'call off':'中止する',
    'call back':'折り返し電話する',
    'call for':'要求する',
    'call on':'訪問する、呼びかける',
    'look at':'見る',
    'look for':'探す',
    'look after':'世話をする',
    'look up':'調べる、見上げる',
    'look into':'調査する',
    'look out':'気をつける',
    'look back':'振り返る',
    'take off':'脱ぐ、離陸する',
    'take on':'引き受ける',
    'take out':'取り出す、連れ出す',
    'take up':'始める（趣味等）',
    'take over':'引き継ぐ',
    'check in':'チェックインする',
    'check out':'チェックアウトする、調べる',
    'make up':'作り上げる、化粧する、仲直りする',
    'make out':'理解する、うまくやる',
    'make for':'〜に向かう、助ける',
    'turn on':'（電気等を）つける',
    'turn off':'（電気等を）消す',
    'turn up':'音量を上げる、現れる',
    'turn down':'断る、下げる',
    'turn in':'提出する、寝る',
    'turn out':'判明する、生産する',
    'find out':'突き止める',
    'come in':'入る',
    'come out':'出る、公表される',
    'come back':'戻る',
    'come across':'偶然出会う、見つける',
    'come up':'持ち上がる、起こる',
    # fall, hand, hold, keep, etc. fallback will be used if missing
}

generic_etymo = '句動詞（動詞＋前置詞/副詞）の表現。動詞と前置詞の組み合わせで意味が変わるため、文脈で覚えるとよい。'

# read
with p.open(newline='',encoding='utf-8') as f:
    rows = list(csv.reader(f))
header = rows[0]
changed = []
for i in range(1,len(rows)):
    row = rows[i]
    # ensure length
    if len(row) < 7:
        row += ['']*(7-len(row))
    phrase = row[0].strip()
    key = phrase.lower()
    meaning = row[2].strip()
    etymo = row[3].strip()
    related = row[5].strip()
    modified = False
    if meaning == '' or meaning.startswith('英熟語:'):
        if key in m:
            row[2] = m[key]
        else:
            row[2] = '（熟語）' + phrase
        modified = True
    if etymo == '' or etymo.startswith('句動詞') or etymo.startswith('英熟語'):
        row[3] = generic_etymo
        modified = True
    # normalize related field to single word
    if related == '':
        row[5] = '日常'
        modified = True
    else:
        sep = None
        for s in [';', '；', ',', '/']:
            if s in related:
                sep = s
                break
        if sep:
            first = related.split(sep)[0].strip()
            if first != related:
                row[5] = first
                modified = True
        else:
            # if contains space-delimited categories, take first
            if ' ' in related:
                first = related.split()[0].strip()
                if first != related:
                    row[5] = first
                    modified = True
    if modified:
        changed.append((i+1, phrase, row[2], row[3], row[5]))

# write back
with p.open('w',newline='',encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print('processed rows:', len(rows)-1)
print('changed rows:', len(changed))
for ln,phrase,mean,etymo,related in changed[:20]:
    print('\nline',ln,'phrase=',phrase)
    print(' meaning=',mean)
    print(' etymo=',etymo[:80])
    print(' related=',related)

print('\ndone')
