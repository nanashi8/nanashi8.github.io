#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv
from pathlib import Path

base = Path('/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources')
# Use Japanese filenames only — English-named CSVs have been removed
inputs = {
    '高校単語.csv': '高校単語.csv',
    'サンプル単語.csv': 'サンプル単語.csv',
}

mapping = {
    'English': '英語',
    'Logic': '論理',
    'Science': '理科',
    'Math': '数学',
    'Geography': '地理',
    'CS': '情報',
    'Economics': '経済',
    'History': '歴史',
    'Arts': '芸術',
    'Social': '社会',
    'Debate': '討論',
    'Law': '法律',
    'Biology': '生物',
    'Physics': '物理',
    'Chemistry': '化学',
    'Engineering': '工学',
    'Design': 'デザイン',
    'Education': '教育',
    'Music': '音楽',
    'Life': '生活',
    'PE': '体育',
    'Shop': '実習',
    'Transport': '交通',
    'Safety': '安全',
    'Vocabulary': '語彙',
    'Study': '学習',
    'Grammar': '文法',
    'Forensics': '法科学',
    'Library': '図書',
    'Urban': '都市',
    'Marketing': 'マーケティング',
    'Statistics': '統計',
}

for in_name, out_name in inputs.items():
    in_path = base / in_name
    out_path = base / out_name
    if not in_path.exists():
        print('input not found:', in_path)
        continue
    rows = []
    with in_path.open('r', encoding='utf-8', newline='') as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)
    if not rows:
        print('empty file:', in_path)
        continue
    # find relatedFields index (case-insensitive)
    header = rows[0]
    rf_idx = None
    for i,h in enumerate(header):
        if h.strip().lower() == 'relatedfields':
            rf_idx = i
            break
    if rf_idx is None:
        print('relatedFields not found in', in_name)
        continue
    out_rows = [header]
    for row in rows[1:]:
        if len(row) <= rf_idx:
            out_rows.append(row)
            continue
        rf = row[rf_idx]
        parts = [p.strip() for p in rf.split(';') if p.strip() != '']
        new_parts = []
        for p in parts:
            new_parts.append(mapping.get(p, p))
        row2 = list(row)
        row2[rf_idx] = ';'.join(new_parts)
        out_rows.append(row2)
    # write out
    with out_path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(out_rows)
    print('wrote', out_path)

print('done')
