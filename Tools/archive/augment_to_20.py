#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Augment per-file categories up to target (default 20) by reassigning some generic-category rows
(e.g. 日常) to more specific canonical categories based on the word (first column) or related words.
Creates backup .augment.bak and reports in Tools/reports.
"""
from pathlib import Path
import csv
import shutil
import re

ROOT = Path('/Users/yuichinakamura/Documents/20251006_002/SimpleWord')
REPORTS = ROOT / 'Tools' / 'reports'
REPORTS.mkdir(parents=True, exist_ok=True)
TARGET = 20

# Simple mapping heuristics (subset of earlier mapping)
MAPPING_KEYS = {
    '動物': ['動物','animal','bird','fish','cat','dog','cow','pig','horse','chicken','lion','tiger','bee','ant','whale','shark','rabbit','duck','frog'],
    '食べ物・飲食': ['食','food','drink','meal','rice','bread','meat','egg','milk','juice','tea','coffee','restaurant'],
    '学校・学習': ['学','school','study','teacher','student','book','pen','pencil','notebook','learn','read','write'],
    '交通・移動': ['交通','車','bus','train','plane','airport','taxi','ride','station'],
    '地理・天気': ['天','sun','moon','star','rain','snow','map','city','village','sea','ocean','mountain'],
    '文化・芸術': ['music','movie','art','culture','movie','camera','music'],
    '健康・身体': ['病','health','hospital','sick','doctor'],
    '買い物・商業': ['shop','market','buy','bank','store','shop','cashier'],
    'テクノロジー': ['computer','phone','online','tech','通信','camera','laptop'],
    'スポーツ・遊び': ['sport','game','play','football','soccer'],
}

SEP_RE = re.compile(r'[;、,;/|]+')

# reuse map_token-like heuristic
def token_to_canonical(tok):
    s = tok.strip()
    low = s.lower()
    # direct jpn checks
    if any(ch in s for ch in '動物鳥魚猫犬牛豚馬鶏'):
        return '動物'
    if any(ch in s for ch in '食事飲食食べ'):
        return '食べ物・飲食'
    if any(ch in s for ch in '学学校勉強'):
        return '学校・学習'
    if any(ch in s for ch in '車電車飛行機駅空港'):
        return '交通・移動'
    if any(ch in s for ch in '天天気海山地図市村'):
        return '地理・天気'
    if any(sub in low for sub in ['music','movie','art','camera']):
        return '文化・芸術'
    if any(k in low for k in ['computer','phone','online','tech','通信']):
        return 'テクノロジー'
    if any(k in low for k in ['shop','market','bank','store','buy']):
        return '買い物・商業'
    if any(k in low for k in ['hospital','sick','doctor']):
        return '健康・身体'
    if any(k in low for k in ['sport','game','play']):
        return 'スポーツ・遊び'
    # fallback None
    return None


def augment_file(p: Path):
    with p.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    if not fieldnames:
        return None
    related_name = None
    key_field = fieldnames[0]
    for fn in fieldnames:
        if '関連' in fn and '分野' in fn:
            related_name = fn
            break
    if not related_name:
        return None
    # count existing categories
    counts = {}
    for row in rows:
        v = (row.get(related_name) or '').strip()
        if v:
            counts[v] = counts.get(v,0)+1
    unique = set(counts.keys())
    # don't augment tiny files
    if len(rows) < 20:
        return {'path':str(p),'rows':len(rows),'skipped':'too_small','unique_before':len(unique)}
    if len(unique) >= TARGET:
        return {'path':str(p),'rows':len(rows),'skipped':'enough','unique_before':len(unique)}
    # prepare backup
    bak = p.with_suffix(p.suffix + '.augment.bak')
    shutil.copy2(p, bak)
    # candidate rows: those with generic categories (日常 or その他) or those in most common category
    most_common = max(counts.items(), key=lambda x:x[1])[0] if counts else None
    candidates = []
    for i,row in enumerate(rows):
        v = (row.get(related_name) or '').strip()
        if v in ('日常','その他') or v==most_common:
            candidates.append((i,row))
    changed = 0
    # try to assign new categories until reaching target
    for idx,row in candidates:
        if len(unique) >= TARGET:
            break
        key = (row.get(key_field) or '').strip()
        new = None
        # try tokens from related words field too
        rel_words = row.get('関連語（英語）と意味（日本語）') or row.get('関連語（英語）と意味（日本語）', '')
        tokens = [key]
        if rel_words:
            tokens += [t.strip() for t in SEP_RE.split(rel_words) if t.strip()]
        for t in tokens:
            mapped = token_to_canonical(t)
            if mapped and mapped not in unique:
                new = mapped
                break
        if not new:
            # try mapping to any canonical not used yet by scanning token substrings
            for t in tokens:
                for cand, kws in MAPPING_KEYS.items():
                    for kw in kws:
                        if kw in t.lower() or kw in t:
                            if cand not in unique:
                                new = cand
                                break
                    if new:
                        break
                if new:
                    break
        if new and new not in unique:
            # apply
            rows[idx][related_name] = new
            unique.add(new)
            counts[new] = counts.get(new,0)+1
            changed += 1
    # write back
    tmp = p.with_suffix('.tmp')
    with tmp.open('w', newline='', encoding='utf-8') as wf:
        writer = csv.DictWriter(wf, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    shutil.move(str(tmp), str(p))
    report = REPORTS / f"{p.stem}_augment_report.txt"
    with report.open('w', encoding='utf-8') as rf:
        rf.write(f"augment: {p}\nbackup: {bak}\nrows:{len(rows)} changed:{changed}\nunique_after:{len(unique)}\n")
        for k,v in sorted(counts.items(), key=lambda x:-x[1]):
            rf.write(f"{v}\t{k}\n")
    return {'path':str(p),'rows':len(rows),'changed':changed,'unique_after':len(unique),'report':str(report),'backup':str(bak)}


def main():
    results = []
    for f in sorted(ROOT.rglob('*中学*.csv')):
        r = augment_file(f)
        if r:
            results.append(r)
    for r in results:
        print(r)

if __name__ == '__main__':
    main()
