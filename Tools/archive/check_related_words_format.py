#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
関連語（英語）と意味（日本語）列のフォーマットチェック
- チェック対象: SimpleWord/Resources と Resources 内の CSV
- 判定基準:
  - セル内に日本語（ひらがな/カタカナ/漢字）が含まれているか -> 含まれない場合は「意味がない」扱い
  - 複数の関連語は ';' で区切られている想定。各要素が '英語:日本語' のペアになっているかを簡易判定
- 出力: changes/ にレポートファイルを作成
"""

import csv
from pathlib import Path
from datetime import datetime
import re

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = [ROOT / 'SimpleWord' / 'Resources', ROOT / 'Resources']
REPORT_DIR = ROOT / 'changes'
REPORT_DIR.mkdir(exist_ok=True)

# Japanese char detection
jp_re = re.compile(r'[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]')

files = []
for d in CANDIDATES:
    if d.exists():
        for p in sorted(d.glob('*.csv')):
            files.append(p)

report_lines = []
for p in files:
    report_lines.append(f'File: {p}')
    lines = p.read_text(encoding='utf-8').splitlines()
    data_lines = [ln for ln in lines if not ln.strip().startswith('//')]
    reader = csv.reader(data_lines)
    rows = list(reader)
    if not rows:
        report_lines.append('  EMPTY')
        continue
    header = rows[0]
    try:
        idx = header.index('関連語（英語）と意味（日本語）')
    except ValueError:
        # fallback: assume 5th column
        idx = 4
    entries = rows[1:]
    no_meaning = []
    bad_format = []
    sample_ok = []
    for i, row in enumerate(entries, start=2):
        val = ''
        if idx < len(row):
            val = row[idx].strip()
        if not val:
            no_meaning.append(i)
            continue
        # split by ;
        parts = [p.strip() for p in val.split(';') if p.strip()]
        ok_all = True
        for part in parts:
            # check if contains japanese
            if not jp_re.search(part):
                ok_all = False
            # also detect if contains ':' separating english and japanese
            # if ':' not in part, it's ok if Japanese is present (freeform)
        if ok_all:
            sample_ok.append((i,val))
        else:
            bad_format.append((i,val))
    report_lines.append(f'  total rows: {len(entries)}')
    report_lines.append(f'  empty / missing related-words: {len(no_meaning)}')
    if no_meaning:
        report_lines.append('    lines: ' + ','.join(map(str,no_meaning[:100])))
    report_lines.append(f'  likely-bad-format (no Japanese or missing translations): {len(bad_format)}')
    for ln,val in bad_format[:50]:
        report_lines.append(f'    line{ln}: {val}')
    report_lines.append(f'  sample ok (first 10):')
    for ln,val in sample_ok[:10]:
        report_lines.append(f'    line{ln}: {val}')
    report_lines.append('')

now = datetime.now().strftime('%Y%m%d%H%M%S')
out = REPORT_DIR / f'related_words_report.{now}.txt'
out.write_text('\n'.join(report_lines), encoding='utf-8')
print('Wrote report to', out)
