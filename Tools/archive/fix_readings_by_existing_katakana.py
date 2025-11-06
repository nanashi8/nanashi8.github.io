#!/usr/bin/env python3
# CSVの読み列を、同一語句で既に存在するカタカナ表記があればそれに置換し、なければ空欄にする
# Usage: python3 fix_readings_by_existing_katakana.py path/to/中学英単語.csv

import sys
import csv
import re

if len(sys.argv) < 2:
    print('Usage: python3 fix_readings_by_existing_katakana.py path/to/csv')
    sys.exit(1)

csv_path = sys.argv[1]

rows = []
with open(csv_path, newline='') as f:
    # preserve original newline handling
    reader = csv.reader(f)
    for row in reader:
        rows.append(row)

if not rows:
    print('empty file')
    sys.exit(1)

header = rows[0]
data = rows[1:]

# detect katakana or japanese characters in reading
non_ascii_re = re.compile(r"[^\x00-\x7F]")
# mapping from 語句->preferred katakana reading
mapping = {}
for r in data:
    if len(r) < 2:
        continue
    word = r[0].strip()
    reading = r[1].strip()
    if reading and non_ascii_re.search(reading):
        # prefer first encountered non-ascii reading
        if word not in mapping:
            mapping[word] = reading

# now apply mapping: for rows where reading is ascii-only, replace with mapping if found, else set to empty
ascii_only_re = re.compile(r'^[A-Za-z0-9\- _]+$')
replaced = 0
emptied = 0
unchanged = 0
new_rows = [header]
for r in data:
    row = r.copy()
    if len(row) < 2:
        new_rows.append(row)
        unchanged += 1
        continue
    word = row[0].strip()
    reading = row[1].strip()
    if reading == '':
        new_rows.append(row)
        unchanged += 1
        continue
    if non_ascii_re.search(reading):
        # already contains non-ascii (likely katakana) -> keep
        new_rows.append(row)
        unchanged += 1
        continue
    # reading contains only ascii
    if word in mapping:
        row[1] = mapping[word]
        replaced += 1
    else:
        row[1] = ''
        emptied += 1
    new_rows.append(row)

# write backup
import shutil
shutil.copy2(csv_path, csv_path + '.bak.fix_readings')

with open(csv_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(new_rows)

print(f'Done. replaced={replaced}, emptied={emptied}, unchanged={unchanged}. Backup saved to {csv_path}.bak.fix_readings')
# print examples of mapping used (first 30)
print('\nSample mappings used:')
count = 0
for k,v in mapping.items():
    print(f"{k} -> {v}")
    count += 1
    if count >= 30:
        break
