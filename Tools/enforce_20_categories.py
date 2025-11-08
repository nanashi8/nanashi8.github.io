#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enforce each CSV (with >= TARGET rows) to have up to TARGET unique canonical categories.
Strategy:
 - Use canonical list of 20 categories.
 - For each missing category, try to find a candidate row by keyword matching (語句 or 関連語列).
 - If no semantic match, reassign a row from the most common category (typically '日常') to the missing category.
 - Create backup .enforce20.bak and write report Tools/reports/<stem>_enforce20_report.txt
"""
from pathlib import Path
import csv
import shutil
import re

ROOT = Path('/Users/yuichinakamura/Documents/20251006_002/SimpleWord')
REPORTS = ROOT / 'Tools' / 'reports'
REPORTS.mkdir(parents=True, exist_ok=True)
TARGET = 20

CANONICAL = [
    '日常','学校・学習','食べ物・飲食','自然','動物','感情','家族・住居',
    '交通・移動','時間・頻度','文法・表現','文化・芸術','仕事・職業','健康・身体',
    '科学・物理','地理・天気','買い物・商業','スポーツ・遊び','テクノロジー','社会・政治','その他'
]

# reuse heuristics from earlier scripts
MAPPING_KEYS = {
    '動物': ['動物','animal','bird','fish','cat','dog','cow','pig','horse','chicken','lion','tiger','bee','ant','whale','shark','rabbit','duck','frog'],
    '食べ物・飲食': ['食','food','drink','meal','rice','bread','meat','egg','milk','juice','tea','coffee','restaurant'],
    '学校・学習': ['学','school','study','teacher','student','book','pen','pencil','notebook','learn','read','write'],
    '交通・移動': ['交通','車','bus','train','plane','airport','taxi','ride','station'],
    '地理・天気': ['天','sun','moon','star','rain','snow','map','city','village','sea','ocean','mountain'],
    '文化・芸術': ['music','movie','art','culture','camera'],
    '健康・身体': ['病','health','hospital','sick','doctor'],
    '買い物・商業': ['shop','market','buy','bank','store','cashier'],
    'テクノロジー': ['computer','phone','online','tech','通信','laptop'],
    'スポーツ・遊び': ['sport','game','play','football','soccer'],
}

SEP_RE = re.compile(r'[;、,;/|]+')

def token_candidate_category(tok):
    s = (tok or '').strip()
    low = s.lower()
    if not s:
        return None
    # direct Japanese checks
    if any(ch in s for ch in '動物鳥魚猫犬牛豚馬鶏'): return '動物'
    if any(ch in s for ch in '食事飲食食べ'): return '食べ物・飲食'
    if any(ch in s for ch in '学学校勉強'): return '学校・学習'
    if any(ch in s for ch in '車電車飛行機駅空港'): return '交通・移動'
    if any(ch in s for ch in '天天気海山地図市村'): return '地理・天気'
    for cat, kws in MAPPING_KEYS.items():
        for kw in kws:
            if kw in low or kw in s:
                return cat
    return None


def enforce_file(p: Path):
    with p.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames or []
    if not fieldnames:
        return None
    related_col = None
    for fn in fieldnames:
        if '関連' in fn and '分野' in fn:
            related_col = fn
            break
    if not related_col:
        return None
    total_rows = len(rows)
    if total_rows < TARGET:
        return {'path':str(p),'rows':total_rows,'skipped':'too_small'}
    # counts
    counts = {}
    for r in rows:
        v = (r.get(related_col) or '').strip()
        if v:
            counts[v] = counts.get(v,0)+1
    unique = set(counts.keys())
    if len(unique) >= TARGET:
        return {'path':str(p),'rows':total_rows,'skipped':'enough','unique':len(unique)}
    # prepare backup
    bak = p.with_suffix(p.suffix + '.enforce20.bak')
    shutil.copy2(p, bak)
    missing = [c for c in CANONICAL if c not in unique]
    changed = []
    # build candidate lists
    candidates = []  # list of (index,row)
    for i,row in enumerate(rows):
        v = (row.get(related_col) or '').strip()
        candidates.append((i,row,v))
    # Prefer rows with generic category '日常' or 'その他'
    generic_idxs = [ (i,row,v) for i,row,v in candidates if v in ('日常','その他') ]
    # also allow rows from most common category
    if counts:
        most_common = max(counts.items(), key=lambda x:x[1])[0]
        mc_idxs = [ (i,row,v) for i,row,v in candidates if v==most_common and (i,row,v) not in generic_idxs ]
    else:
        mc_idxs = []
    idx_pool = generic_idxs + mc_idxs
    used_idxs = set()
    # try to fill missing categories using semantic match first
    for cat in missing[:]:
        # find row whose key or related words suggest this category
        chosen = None
        for i,row,v in candidates:
            if i in used_idxs:
                continue
            key = (row.get(fieldnames[0]) or '').strip()
            rel_words = row.get('関連語（英語）と意味（日本語）') or ''
            tokens = [key] + [t.strip() for t in SEP_RE.split(rel_words) if t.strip()]
            for t in tokens:
                cand = token_candidate_category(t)
                if cand == cat:
                    chosen = (i,row)
                    break
            if chosen:
                break
        if chosen:
            i,row = chosen
            old = (row.get(related_col) or '').strip()
            row[related_col] = cat
            used_idxs.add(i)
            counts[old] = counts.get(old,1)-1
            counts[cat] = counts.get(cat,0)+1
            unique.add(cat)
            missing.remove(cat)
            changed.append((i, row.get(fieldnames[0], ''), old, cat))
    # if still missing, pick from idx_pool sequentially
    pool_iter = iter(idx_pool)
    for cat in missing[:]:
        chosen = None
        while True:
            try:
                i,row,v = next(pool_iter)
            except StopIteration:
                break
            if i in used_idxs:
                continue
            chosen = (i,row)
            break
        if not chosen:
            break
        i,row = chosen
        old = (row.get(related_col) or '').strip()
        row[related_col] = cat
        used_idxs.add(i)
        counts[old] = counts.get(old,1)-1
        counts[cat] = counts.get(cat,0)+1
        unique.add(cat)
        changed.append((i, row.get(fieldnames[0], ''), old, cat))
    # write back
    tmp = p.with_suffix('.tmp')
    with tmp.open('w', newline='', encoding='utf-8') as wf:
        writer = csv.DictWriter(wf, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    shutil.move(str(tmp), str(p))
    # report
    report = REPORTS / f"{p.stem}_enforce20_report.txt"
    with report.open('w', encoding='utf-8') as rf:
        rf.write(f"enforce20: {p}\nbackup: {bak}\nrows:{total_rows}\nchanged:{len(changed)}\nunique_after:{len(unique)}\n\n")
        for i,key,old,new in changed:
            rf.write(f"row={i+2}\tkey={key}\t{old} -> {new}\n")
        rf.write('\ncategory_counts:\n')
        for k,v in sorted(counts.items(), key=lambda x:-x[1]):
            rf.write(f"{v}\t{k}\n")
    return {'path':str(p),'rows':total_rows,'changed':len(changed),'unique_after':len(unique),'report':str(report),'backup':str(bak)}


def main():
    results = []
    for f in sorted(ROOT.rglob('*中学*.csv')):
        r = enforce_file(f)
        if r:
            results.append(r)
    for r in results:
        print(r)

if __name__ == '__main__':
    main()
