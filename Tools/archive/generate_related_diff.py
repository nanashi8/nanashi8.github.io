#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate per-CSV related-field diff reports comparing pre-augmentation backup (if exists) or .bak -> current file.
Output: Tools/reports/<basename>_related_diff.txt
"""
import csv
from pathlib import Path

FILES = [
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英単語.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英会話.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学古典単語.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英熟語.csv',
]

REPORT_DIR = Path('Tools/reports')
REPORT_DIR.mkdir(parents=True, exist_ok=True)

SEP = ';'


def find_related_col(headers):
    for h in headers:
        if h and '関連分野' in h:
            return h
    for h in headers:
        if h and '分野' in h:
            return h
    return None


def read_rows(path):
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        related = find_related_col(headers)
        rows = list(reader)
    return headers, related, rows


def key_for_row(row, headers):
    # prefer '語句' as key
    if '語句' in headers:
        return row.get('語句','').strip()
    # fallback to concatenation of first two fields
    keys = [row.get(h,'').strip() for h in headers[:2]]
    return '||'.join(keys)


for p in FILES:
    path = Path(p)
    if not path.exists():
        print('MISSING', path)
        continue
    # determine backup path: preaugment then .bak
    pre = path.with_suffix(path.suffix + '.preaugment.bak')
    bak = path.with_suffix(path.suffix + '.bak')
    if pre.exists():
        src = pre
    elif bak.exists():
        src = bak
    else:
        print('NO BACKUP for', path)
        src = None
    if src is None:
        # still attempt to compare original in changes folder? skip
        print('Skipping', path, 'no backup')
        continue
    try:
        headers_old, related_old, rows_old = read_rows(src)
        headers_new, related_new, rows_new = read_rows(path)
    except Exception as e:
        print('ERROR reading', path, e)
        continue
    if related_old is None and related_new is None:
        print('No related column in both for', path)
        continue
    # build maps by key
    map_old = {}
    for r in rows_old:
        k = key_for_row(r, headers_old)
        map_old[k] = (r.get(related_old,'') if related_old else '')
    map_new = {}
    for r in rows_new:
        k = key_for_row(r, headers_new)
        map_new[k] = (r.get(related_new,'') if related_new else '')
    # union keys by order: prefer new rows order
    keys = [key_for_row(r, headers_new) for r in rows_new]
    # add any old-only keys
    for k in map_old.keys():
        if k not in map_new:
            keys.append(k)
    report_path = REPORT_DIR / (path.stem + '_related_diff.txt')
    with report_path.open('w', encoding='utf-8') as out:
        out.write(f'Report: {path}\n')
        out.write(f'Backup used: {src}\n')
        out.write('\n')
        out.write('Key\tOld Related\tNew Related\n')
        changed = 0
        total = 0
        for k in keys:
            old = map_old.get(k,'')
            new = map_new.get(k,'')
            total += 1
            if old != new:
                changed += 1
            out.write(f'{k}\t{old}\t{new}\n')
        out.write('\n')
        out.write(f'Total rows compared: {total}\n')
        out.write(f'Rows with changed related fields: {changed}\n')
    print('Wrote', report_path, 'total=', total, 'changed=', changed)

print('Done')
