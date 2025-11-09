#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV検証スクリプト
- 対象: SimpleWord の Resources 配下など主要CSVファイル
- チェック項目:
  - ヘッダーの存在と期待ヘッダーとの一致（軽微差分は警告）
  - 各行の列数（ヘッダーに合わせていない行を報告）
  - `語句` が空でないこと
  - `難易度` が 1..3 の整数であること
  - 重複 `語句` の検出
- 出力:
  - changes/ にタイムスタンプ付きのレポートファイル（テキスト）
  - 標準出力にサマリ

コメント行("// ...")はスキップしますn"""

import csv
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
# 検証対象ディレクトリ候補
CANDIDATES = [ROOT / 'SimpleWord' / 'Resources', ROOT / 'Resources']
REPORT_DIR = ROOT / 'changes'
REPORT_DIR.mkdir(exist_ok=True)

EXPECTED_HEADER = ['語句','発音（カタカナ）','和訳','語源等解説（日本語）','関連語（英語）と意味（日本語）','関連分野（日本語）','難易度']

files_to_check = []
for d in CANDIDATES:
    if d.exists():
        for p in d.glob('*.csv'):
            files_to_check.append(p)

if not files_to_check:
    print('No CSV files found to validate in candidates:', CANDIDATES)
    exit(0)

reports = []

for path in files_to_check:
    text = []
    text.append(f'File: {path}')
    lines = path.read_text(encoding='utf-8').splitlines()
    data_lines = [ln for ln in lines if not ln.strip().startswith('//')]
    reader = csv.reader(data_lines)
    rows = list(reader)
    if not rows:
        text.append('  EMPTY FILE')
        reports.append('\n'.join(text))
        continue
    header = rows[0]
    text.append('  Header cols: %d' % len(header))
    # header similarity check
    if header != EXPECTED_HEADER:
        text.append('  Header MISMATCH')
        text.append('    Expected: ' + ','.join(EXPECTED_HEADER))
        text.append('    Found:    ' + ','.join(header))
    else:
        text.append('  Header OK')

    entries = rows[1:]
    missing_key = []
    bad_diff = []
    short_rows = []
    duplicates = {}
    seen = {}

    for i, row in enumerate(entries, start=2):
        # pad
        if len(row) < len(header):
            short_rows.append((i, len(row)))
            row = row + [''] * (len(header)-len(row))
        key = row[0].strip()
        if not key:
            missing_key.append(i)
        # difficulty check
        diff = row[-1].strip() if len(row)>0 else ''
        if not diff.isdigit() or int(diff) < 1 or int(diff) > 3:
            bad_diff.append((i, diff))
        # duplicates
        if key:
            seen.setdefault(key, []).append(i)

    for k, lst in seen.items():
        if len(lst) > 1:
            duplicates[k] = lst

    text.append('  Total data rows: %d' % len(entries))
    text.append('  Missing 語句 rows: %d' % len(missing_key))
    if missing_key:
        text.append('    Lines: ' + ','.join(map(str, missing_key)))
    text.append('  Rows with invalid 難易度: %d' % len(bad_diff))
    if bad_diff:
        text.append('    Samples: ' + '; '.join([f'line{ln}:{val}' for ln,val in bad_diff[:20]]))
    text.append('  Rows with too few columns: %d' % len(short_rows))
    if short_rows:
        text.append('    Samples: ' + '; '.join([f'line{ln}:cols{c}' for ln,c in short_rows[:20]]))
    text.append('  Duplicate 語句 keys: %d' % len(duplicates))
    if duplicates:
        sample = list(duplicates.items())[:20]
        for k,lst in sample:
            text.append(f'    {k}: lines {lst}')

    reports.append('\n'.join(text))

# Write combined report
now = datetime.now().strftime('%Y%m%d%H%M%S')
report_path = REPORT_DIR / f'csv_validation_report.{now}.txt'
report_path.write_text('\n\n'.join(reports), encoding='utf-8')
print('Validation report written to:', report_path)
print('Summary:')
for r in reports:
    # print first two lines of each report for quick summary
    lines = r.splitlines()
    print(' -', lines[0].replace(str(ROOT),'') , '-', lines[1])

print('\nDone.')
