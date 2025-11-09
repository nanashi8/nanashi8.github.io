#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate a combined manual review CSV by joining generated candidates with source row context.
Usage: python3 Tools/generate_manual_review_combined.py
"""
import csv
from pathlib import Path

root = Path('.')
gen = root / 'changes' / 'manual_review_candidates_generated.csv'
out = root / 'changes' / 'manual_review_candidates_combined.csv'

if not gen.exists():
    print('generated file missing:', gen)
    raise SystemExit(1)

with gen.open(newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

fieldnames = ['file','row','key','old_related','new_related','和訳','元関連分野','source_row','report']
with out.open('w', newline='', encoding='utf-8') as wf:
    writer = csv.DictWriter(wf, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        src_path = Path(r['file'])
        # try relative to repo root if not absolute
        if not src_path.exists():
            alt = root / r['file']
            if alt.exists():
                src_path = alt
        src_row_text = ''
        jp = ''
        orig_rel = ''
        if src_path.exists():
            try:
                with src_path.open(newline='', encoding='utf-8') as sf:
                    sreader = csv.DictReader(sf)
                    fnames = sreader.fieldnames or []
                    # find japanese translation and related column names
                    jp_col = None
                    rel_col = None
                    key_col = None
                    for c in fnames:
                        if c and '和訳' in c:
                            jp_col = c
                        if c and '関連分野' in c:
                            rel_col = c
                        # key column heuristics
                        if c and ('語句' in c or 'key' in c.lower() or 'sentence' in c.lower() or 'word' in c.lower()):
                            key_col = c
                    # default key col is first field
                    if not key_col and fnames:
                        key_col = fnames[0]
                    # iterate rows and match by row number if possible
                    try:
                        target = int(r['row'])
                    except:
                        target = None
                    for idx, row in enumerate(sreader, start=2):
                        if target is not None and idx == target:
                            src_row_text = '|'.join([f"{k}={v}" for k,v in row.items()])
                            jp = row.get(jp_col,'') if jp_col else ''
                            orig_rel = row.get(rel_col,'') if rel_col else ''
                            break
                        # fallback: match key value
                        if r['key'] and row.get(key_col,'') == r['key']:
                            src_row_text = '|'.join([f"{k}={v}" for k,v in row.items()])
                            jp = row.get(jp_col,'') if jp_col else ''
                            orig_rel = row.get(rel_col,'') if rel_col else ''
                            break
            except Exception as e:
                src_row_text = f'ERROR_READING_SOURCE:{e}'
        else:
            src_row_text = 'SOURCE_NOT_FOUND'
        outrow = {
            'file': r['file'], 'row': r['row'], 'key': r['key'], 'old_related': r['old_related'], 'new_related': r['new_related'],
            '和訳': jp, '元関連分野': orig_rel, 'source_row': src_row_text, 'report': r.get('report','')
        }
        writer.writerow(outrow)
print('wrote', out)
