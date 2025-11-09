#!/usr/bin/env python3
# Revert readings that were empty before fill: compare csv to csv.bak.fillkatakana
# For rows where backup had empty reading (col 2), set current reading to empty string.

import sys
import csv
import shutil

if len(sys.argv) < 2:
    print('Usage: python3 revert_fill_from_backup.py path/to/csv')
    sys.exit(1)

csv_path = sys.argv[1]
backup_path = csv_path + '.bak.fillkatakana'

# if backup not exist, exit
import os
if not os.path.exists(backup_path):
    print('Backup not found:', backup_path)
    sys.exit(0)

# read backup
with open(backup_path, newline='') as f:
    reader = csv.reader(f)
    backup_rows = list(reader)

with open(csv_path, newline='') as f:
    reader = csv.reader(f)
    rows = list(reader)

if not backup_rows or not rows:
    print('one of files empty')
    sys.exit(1)

# align lengths
min_len = min(len(backup_rows), len(rows))
changed = 0
for i in range(1, min_len):
    b = backup_rows[i]
    r = rows[i]
    b_read = b[1].strip() if len(b) > 1 else ''
    if b_read == '':
        # if backup reading empty and current reading non-empty, set to empty
        if len(r) > 1 and r[1].strip() != '':
            rows[i][1] = ''
            changed += 1

# write backup of current before overwrite
shutil.copy2(csv_path, csv_path + '.bak.revert')
with open(csv_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f'Done. reverted {changed} readings to empty in {csv_path}. Backup of pre-revert saved to {csv_path}.bak.revert')
