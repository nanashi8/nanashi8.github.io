#!/usr/bin/env python3
"""
Normalize '関連分野' column in CSVs under SimpleWord/SimpleWord/Resources to the canonical 20 categories.
Creates backups with timestamp before overwriting.
"""
import csv
from pathlib import Path
import shutil
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1] / 'SimpleWord' / 'Resources'
CANONICAL = [
    "日常","学校","家族","食べ物","交通","旅行","健康","動物","自然","地理",
    "科学","文法","文化","時間","テクノロジー","買い物","職業","スポーツ","感情","その他"
]
# mapping of known variants to canonical
MAPPING = {
    '文化・芸術': '文化',
    '時間・頻度': '時間',
    '買い物・商業': '買い物',
    'スポーツ・遊び': 'スポーツ',
    '家族・住居': '家族',
    '学校・学習': '学校',
    '科学・物理': '科学',
    '交通・移動': '交通',
    '地理・天気': '地理',
    '食べ物・飲食': '食べ物',
    '健康・身体': '健康',
    '文法・表現': '文法',
    '仕事・職業': '職業',
    '社会・政治': 'その他',
    '国際関係': 'その他',
    '経済史': 'その他',
    '買い物・商業': '買い物',
    '文法・表現': '文法',
}

print('Normalizing categories in', ROOT)
now = datetime.now().strftime('%Y%m%d%H%M%S')
for path in sorted(ROOT.glob('*.csv')):
    print('\n==', path.name)
    rows = []
    with path.open(encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    if not rows:
        print('  EMPTY SKIP')
        continue
    headers = rows[0]
    idx = None
    for i,h in enumerate(headers):
        if '関連分野' in h:
            idx = i
            break
    if idx is None:
        print('  no related-field header')
        continue
    modified = False
    new_rows = [headers]
    for r in rows[1:]:
        row = list(r)
        if len(row) <= idx:
            new_rows.append(row)
            continue
        cell = row[idx].strip()
        if not cell:
            new_rows.append(row)
            continue
        orig = cell
        # split on semicolon or comma and take first
        if ';' in cell:
            cell = cell.split(';')[0]
        if ',' in cell:
            cell = cell.split(',')[0]
        # split on Japanese dot '・' and take first
        if '・' in cell:
            cell = cell.split('・')[0]
        cell = cell.strip()
        # map variants
        mapped = MAPPING.get(cell, None)
        if mapped is None:
            if cell in CANONICAL:
                mapped = cell
            else:
                # as fallback, try substring matching: if any canonical is substring of cell
                found = None
                for c in CANONICAL:
                    if c in cell:
                        found = c; break
                if found:
                    mapped = found
                else:
                    mapped = 'その他'
        if mapped != orig:
            modified = True
            row[idx] = mapped
            print('  mapped:', orig, '->', mapped)
        new_rows.append(row)
    if modified:
        bak = path.with_suffix(path.suffix + f'.bak.{now}')
        shutil.copy2(path, bak)
        print('  backup:', bak.name)
        # write normalized file
        with path.open('w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(new_rows)
        print('  wrote normalized', path.name)
    else:
        print('  no changes')
print('\nDone')
