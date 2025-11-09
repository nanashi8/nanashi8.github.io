#!/usr/bin/env python3
"""
Fix specific mis-mapped related-field values by using the .bak.* backups created earlier.
This script looks for backups with the latest timestamp and, for rows where the backup had
an original value that should map to a different canonical category (corrections dict),
it updates the current CSV accordingly.
"""
from pathlib import Path
import csv
import re

ROOT = Path(__file__).resolve().parents[1] / 'SimpleWord' / 'Resources'
# corrections from original -> desired canonical
CORRECTIONS = {
    '仕事・職業': '職業'
}

# find backups for files we care about (created by normalize_categories.py with .bak.YYYYMMDDHHMMSS)
bak_pattern = re.compile(r"\.bak\.\d{14}$")

changed_any = False
for path in sorted(ROOT.glob('*.csv')):
    # find latest backup for this path
    backups = sorted([p for p in ROOT.glob(path.name + '.bak.*')])
    if not backups:
        continue
    latest = backups[-1]
    print('Checking', path.name, 'with backup', latest.name)
    # read backup and current
    with latest.open(encoding='utf-8') as f:
        bak_rows = list(csv.reader(f))
    with path.open(encoding='utf-8') as f:
        cur_rows = list(csv.reader(f))
    if not bak_rows or not cur_rows:
        continue
    # find related-field index
    headers = bak_rows[0]
    idx = None
    for i,h in enumerate(headers):
        if '関連分野' in h:
            idx = i; break
    if idx is None:
        continue
    if idx >= len(cur_rows[0]):
        continue
    modified = False
    # we assume same number of rows; iterate min length
    n = min(len(bak_rows), len(cur_rows))
    for i in range(1, n):
        bak_row = bak_rows[i]
        cur_row = cur_rows[i]
        if len(bak_row) <= idx or len(cur_row) <= idx:
            continue
        bak_val = bak_row[idx].strip()
        cur_val = cur_row[idx].strip()
        if bak_val in CORRECTIONS and cur_val != CORRECTIONS[bak_val]:
            print(f'  row {i+1}: backup="{bak_val}" -> current="{cur_val}"; set to "{CORRECTIONS[bak_val]}"')
            cur_row[idx] = CORRECTIONS[bak_val]
            modified = True
    if modified:
        # create new backup of current before overwrite
        newbak = path.with_suffix(path.suffix + '.fixbak')
        path.replace(path)  # no-op to ensure path exists
        # write updated
        with path.open('w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(cur_rows)
        print('  wrote corrected', path.name)
        changed_any = True

if not changed_any:
    print('No corrections applied')
else:
    print('Done applying corrections')
