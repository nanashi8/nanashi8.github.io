#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
簡易CSV重複除去スクリプト
- 対象: SimpleWord/SimpleWord/Resources/中学英単語.csv
- 動作:
  - ヘッダーはそのまま保持
  - "語句" 列をキーに重複を検出
  - より多くの非空カラムを持つ行を優先して保持
  - 同数なら後に出現した行を保持
  - 元ファイルを changes/ にタイムスタンプ付きでバックアップ
  - 処理結果のサマリを標準出力に出力

注意: このスクリプトは簡易的なルールで重複を解消します。必要に応じて手動レビューを実施してください。
"""

import csv
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'SimpleWord' / 'Resources' / '中学英単語.csv'
BACKUP_DIR = ROOT / 'changes'
BACKUP_DIR.mkdir(exist_ok=True)

if not SRC.exists():
    print(f"Error: source file not found: {SRC}")
    sys.exit(2)

with SRC.open('r', encoding='utf-8') as f:
    # CSV may contain comment-like first line; handle lines starting with // by skipping
    lines = f.readlines()

# Strip possible leading comment lines like // filepath: ...
data_lines = [ln for ln in lines if not ln.strip().startswith('//')]

# Parse CSV
reader = csv.reader(data_lines)
rows = list(reader)
if not rows:
    print('Empty CSV')
    sys.exit(0)

header = rows[0]
entries = rows[1:]

kept = {}  # key -> (row, nonempty_count, index)
duplicates = {}

for idx, row in enumerate(entries):
    if len(row) == 0:
        continue
    key = row[0].strip()
    # pad row to header length if needed
    if len(row) < len(header):
        row = row + [''] * (len(header) - len(row))
    nonempty = sum(1 for cell in row[1:] if cell and cell.strip())
    if key in kept:
        prev_row, prev_nonempty, prev_idx = kept[key]
        # prefer row with more non-empty fields, tie-breaker: later index
        replace = False
        if nonempty > prev_nonempty:
            replace = True
        elif nonempty == prev_nonempty:
            replace = True  # keep later occurrence
        if replace:
            duplicates.setdefault(key, []).append(prev_row)
            kept[key] = (row, nonempty, idx)
        else:
            duplicates.setdefault(key, []).append(row)
    else:
        kept[key] = (row, nonempty, idx)

# Build output rows in stable order: keep original first-seen order of chosen rows by their idx
chosen = sorted(((v[2], v[0]) for k, v in kept.items()), key=lambda x: x[0])
output_rows = [header] + [r for _, r in chosen]

# Backup original
timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
backup_path = BACKUP_DIR / f'中学英単語.csv.bak.{timestamp}'
with backup_path.open('w', encoding='utf-8', newline='') as bf:
    bf.writelines(lines)

# Write new CSV
with SRC.open('w', encoding='utf-8', newline='') as out:
    writer = csv.writer(out)
    writer.writerows(output_rows)

# Summary
print('Backup created at:', backup_path)
print('Original rows:', len(entries))
print('Kept unique rows:', len(chosen))
print('Duplicates found:', len(duplicates))
if duplicates:
    print('\nSample duplicates (up to 20 keys):')
    for i, (k, v) in enumerate(duplicates.items()):
        if i >= 20:
            break
        print(f' - {k}: {len(v)+1} occurrences')

print('\nDone.')
