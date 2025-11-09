#!/usr/bin/env python3
# Build mapping word->katakana reading from all CSV files under repo, then apply to target CSVs
# Usage: python3 apply_global_katakana_mapping.py target1.csv target2.csv ...

import sys, csv, os, re, shutil
from glob import glob

if len(sys.argv) < 2:
    print('Usage: python3 apply_global_katakana_mapping.py target1.csv target2.csv ...')
    sys.exit(1)

root = os.path.dirname(os.path.dirname(__file__))
# search for csv files under repository
csv_paths = []
for dirpath, dirnames, filenames in os.walk(root):
    for fn in filenames:
        if fn.endswith('.csv'):
            csv_paths.append(os.path.join(dirpath, fn))

non_ascii_re = re.compile(r"[^\x00-\x7F]")
mapping = {}
for p in csv_paths:
    try:
        with open(p, newline='') as f:
            reader = csv.reader(f)
            rows = list(reader)
    except Exception:
        continue
    for r in rows[1:]:
        if len(r) < 2:
            continue
        word = r[0].strip()
        reading = r[1].strip()
        if reading and non_ascii_re.search(reading):
            if word not in mapping:
                mapping[word] = reading

print(f'Built mapping entries={len(mapping)} from {len(csv_paths)} csv files')
# apply to targets
for target in sys.argv[1:]:
    if not os.path.exists(target):
        print('target not found:', target)
        continue
    with open(target, newline='') as f:
        reader = csv.reader(f)
        rows = list(reader)
    header = rows[0] if rows else []
    data = rows[1:]
    replaced = 0
    unchanged = 0
    for i,r in enumerate(data):
        if len(r) < 2:
            unchanged += 1
            continue
        word = r[0].strip()
        reading = r[1].strip()
        # if reading is ascii or empty, and mapping has katakana, apply
        if (reading == '' or not non_ascii_re.search(reading)) and word in mapping:
            data[i][1] = mapping[word]
            replaced += 1
        else:
            unchanged += 1
    # backup and write
    shutil.copy2(target, target + '.bak.globalmap')
    with open(target, 'w', newline='') as f:
        writer = csv.writer(f)
        if header:
            writer.writerow(header)
        writer.writerows(data)
    print(f'Applied mapping to {target}: replaced={replaced}, unchanged={unchanged}')

# write sample of mapping
print('\nSample mapping (first 80):')
count=0
for k,v in mapping.items():
    print(f'{k} -> {v}')
    count += 1
    if count >= 80:
        break
