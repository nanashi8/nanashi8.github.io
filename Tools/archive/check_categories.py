#!/usr/bin/env python3
"""
Check that CSV files under SimpleWord/SimpleWord/Resources use only the canonical 20 categories
in their related-field column. Reports non-conforming rows.

Usage: python3 Tools/check_categories.py
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'SimpleWord' / 'Resources'
CANONICAL = [
    "日常","学校","家族","食べ物","交通","旅行","健康","動物","自然","地理",
    "科学","文法","文化","時間","テクノロジー","買い物","職業","スポーツ","感情","その他"
]

print('Checking CSVs in', ROOT)
issues = []
for path in sorted(ROOT.glob('*.csv')):
    with path.open(encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
        if not rows:
            continue
        headers = rows[0]
        # find header index with '関連分野'
        idx = None
        for i,h in enumerate(headers):
            if '関連分野' in h:
                idx = i
                break
        if idx is None:
            continue
        for lineno, row in enumerate(rows[1:], start=2):
            if len(row) <= idx:
                continue
            cell = row[idx].strip()
            if not cell:
                continue
            # if multiple specified (semicolon or comma) flag
            if ';' in cell or ',' in cell:
                issues.append((path.name, lineno, cell, 'multiple'))
                continue
            if cell not in CANONICAL:
                issues.append((path.name, lineno, cell, 'unknown'))

if not issues:
    print('All category values conform to canonical 20.')
else:
    print('Found', len(issues), 'issues:')
    for p,ln,val,kind in issues:
        print(f'- {p}:{ln} -> "{val}" ({kind})')
    raise SystemExit(2)
