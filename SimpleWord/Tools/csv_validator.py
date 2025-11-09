#!/usr/bin/env python3
"""
Simple CSV validator for this project.
Checks all .csv files under SimpleWord/Resources for:
 - presence of header
 - consistent column count across rows
 - no control characters
 - prints summary (lines, data rows)

Usage: python3 Tools/csv_validator.py
"""
import csv
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / 'SimpleWord' / 'Resources'
print('Checking CSVs in', ROOT)

control_re = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

any_fail = False
for path in sorted(ROOT.glob('*.csv')):
    print('\n==', path.name)
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    # drop leading comment lines
    while lines and lines[0].lstrip().startswith('//'):
        lines.pop(0)
    if not lines:
        print('  EMPTY FILE')
        any_fail = True
        continue
    header = lines[0]
    data = lines[1:]
    print('  header:', header)
    print('  total lines incl header:', len(lines))
    print('  data rows:', len(data))
    # parse and check
    reader = csv.reader(lines)
    rows = list(reader)
    expected = len(rows[0])
    bad_rows = []
    ctrl_rows = []
    for i,row in enumerate(rows, start=1):
        if len(row) != expected:
            bad_rows.append((i, len(row)))
        for cell in row:
            if control_re.search(cell):
                ctrl_rows.append((i, cell))
    print('  columns per header:', expected)
    if bad_rows:
        print('  rows with wrong column count (sample):', bad_rows[:5])
        any_fail = True
    else:
        print('  column counts OK')
    if ctrl_rows:
        print('  rows with control chars (sample):', ctrl_rows[:5])
        any_fail = True
    else:
        print('  control chars OK')

if any_fail:
    print('\nValidation FAILED')
    raise SystemExit(2)
else:
    print('\nAll CSVs OK')
