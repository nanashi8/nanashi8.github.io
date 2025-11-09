#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Normalize CSVs across the workspace to match project instructions:
- Standardize headers per file category (古典 / 英会話 / 英単語 / 英熟語 / 歴史)
- Normalize difficulty: 初級->1, 中級->2, 上級->3
- Convert 古典 "読み" from katakana to hiragana
- Remove duplicate rows by 語句 (keep first)
- Backup original files to <file>.bak.<timestamp>

Run from repository root.
"""

import csv
import glob
import os
import shutil
import sys
from datetime import datetime

# Expected headers
HEADERS = {
    '古典': '語句,読み（ひらがな）,意味,語源等解説（日本語）,関連語と意味,関連分野,難易度',
    '英会話': '語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度',
    '英単語': '語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度',
    '英熟語': '語句,発音（カタカナ）,和訳,語源等解説（日本語）,関連語（英語）と意味（日本語）,関連分野（日本語）,難易度',
    '歴史': '西暦,史実,経緯,解説,関連史実,関連分野,難易度'
}

# difficulty map
DIFF_MAP = {
    '初級': '1',
    '中級': '2',
    '上級': '3',
    '初': '1',
    '中': '2',
    '上': '3'
}

# simple katakana -> hiragana converter for common katakana range
def kata_to_hira(s: str) -> str:
    out = []
    for ch in s:
        code = ord(ch)
        # Katakana range: U+30A1 - U+30F4 (small a to vu)
        if 0x30A1 <= code <= 0x30F4:
            out.append(chr(code - 0x60))
        else:
            out.append(ch)
    return ''.join(out)


def detect_category(path: str) -> str:
    name = os.path.basename(path)
    if '古典' in name:
        return '古典'
    if '英会話' in name:
        return '英会話'
    if '英単語' in name:
        return '英単語'
    if '英熟語' in name or '熟語' in name:
        return '英熟語'
    if '歴史' in name:
        return '歴史'
    # default to english word format
    return '英単語'


def normalize_file(path: str):
    print('Processing:', path)
    cat = detect_category(path)
    expected_header = HEADERS.get(cat)
    ts = datetime.now().strftime('%Y%m%d%H%M%S')
    bak_path = path + '.bak.' + ts
    shutil.copy2(path, bak_path)
    print(' Backed up to', bak_path)

    rows = []
    seen = set()
    changed = False

    # Read raw
    with open(path, newline='', encoding='utf-8') as rf:
        reader = csv.reader(rf)
        try:
            header = next(reader)
        except StopIteration:
            header = []
        # normalize header to expected header columns count
        for r in reader:
            rows.append(r)

    # Normalize header
    expected_cols = expected_header.split(',') if expected_header else header
    # ensure every row has at least len(expected_cols) columns
    new_rows = []
    for r in rows:
        # strip BOM or stray control at first cell
        r = [c.strip() for c in r]
        # pad
        if len(r) < len(expected_cols):
            r = r + [''] * (len(expected_cols) - len(r))
        # normalize difficulty in last column
        last_idx = len(expected_cols) - 1
        diff = r[last_idx].strip() if last_idx < len(r) else ''
        if diff in DIFF_MAP:
            r[last_idx] = DIFF_MAP[diff]
            changed = True
        else:
            # if contains the words '初級' etc within the cell
            for k,v in DIFF_MAP.items():
                if k in diff:
                    r[last_idx] = v
                    changed = True
                    break
        # also if numeric char like '1','2','3' remains, keep as is

        # 古典読み conversion
        if cat == '古典':
            # second column is reading
            if len(r) >= 2 and r[1]:
                orig = r[1]
                hira = kata_to_hira(orig)
                if hira != orig:
                    r[1] = hira
                    changed = True
        # dedupe by first column (語句)
        key = r[0].strip()
        if key == '':
            # keep blank-key rows as they are (but mark changed if needed)
            new_rows.append(r)
        else:
            if key in seen:
                # skip duplicate
                print('  Skipping duplicate:', key)
                changed = True
            else:
                seen.add(key)
                new_rows.append(r)

    # If header mismatch, write expected header
    write_header = expected_cols

    # Write back file
    with open(path, 'w', newline='', encoding='utf-8') as wf:
        writer = csv.writer(wf)
        writer.writerow(write_header)
        writer.writerows(new_rows)
    print(' Wrote normalized file. Rows:', len(new_rows), 'Header cols:', len(write_header))
    if not changed:
        print(' No content changes detected (only header/backend normalization may have occurred).')


if __name__ == '__main__':
    # find csv files excluding changes/ and backup files
    cwd = os.getcwd()
    patterns = ['**/*.csv']
    files = []
    for p in patterns:
        files.extend(glob.glob(p, recursive=True))
    # filter
    files = [f for f in files if '/changes/' not in f.replace('\\','/') and not f.endswith('.bak') and '.bak.' not in f]
    # ignore some tool outputs
    ignore_prefixes = ['.git', 'build', 'DerivedData']
    files = [f for f in files if not any(seg in f for seg in ignore_prefixes)]

    if not files:
        print('No CSV files found')
        sys.exit(0)

    for f in sorted(files):
        try:
            normalize_file(f)
        except Exception as e:
            print('Error processing', f, e)

    print('\nDone. Please run Tools/csv_validator.py to validate.')
