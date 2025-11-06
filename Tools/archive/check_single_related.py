#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
チェック: ワークスペース内の '*中学*.csv' を走査し、"関連..." 列が
- 空でない場合、区切り文字(';','；','、',',','/') を含まないこと
- 単語（スペースや複数語）であること（日本語の複合語も許容）
問題がある行を一覧で出力する。
"""
from pathlib import Path
import csv
import re

ROOT = Path('/Users/yuichinakamura/Documents/20251006_002/SimpleWord')
SEP_CHARS = ';；、,/'

pattern = re.compile(r'[;；、,/]')

files = list(ROOT.rglob('*中学*.csv'))
problems = []
for f in files:
    with f.open(newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        fnames = reader.fieldnames or []
        rel = None
        for name in fnames:
            if '関連' in name and '分野' in name:
                rel = name
                break
        if not rel:
            continue
        for i, row in enumerate(reader, start=2):
            val = (row.get(rel) or '').strip()
            if not val:
                continue
            if pattern.search(val):
                problems.append((str(f), i, row.get(fnames[0], ''), val))
            # also detect multiple whitespace-separated words in English-like entries
            if ' ' in val and all(ord(c) < 128 for c in val):
                problems.append((str(f), i, row.get(fnames[0], ''), val))

if not problems:
    print('OK: all checked related fields are single-token (no delimiter)')
else:
    print('Found problems:')
    for p in problems:
        print(f"file={p[0]} row={p[1]} key={p[2]} value={p[3]}")
    print(f"total problematic rows: {len(problems)}")
