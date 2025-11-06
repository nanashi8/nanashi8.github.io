#!/usr/bin/env python3
import sys, csv, re

if len(sys.argv) < 2:
    print('Usage: report_readings_status.py file1.csv file2.csv ...')
    sys.exit(1)

non_ascii = re.compile(r'[^\x00-\x7F]')
ascii_only = re.compile(r'^[A-Za-z0-9\- _]+$')

for p in sys.argv[1:]:
    total = 0
    katakana = 0
    empty = 0
    ascii = 0
    other = 0
    ascii_samples = []
    empty_samples = []
    katakana_samples = []
    with open(p, newline='') as f:
        reader = csv.reader(f)
        rows = list(reader)
    if not rows:
        print(p + ': empty file')
        continue
    for i,r in enumerate(rows[1:], start=2):
        total += 1
        reading = r[1].strip() if len(r) > 1 else ''
        if reading == '':
            empty += 1
            if len(empty_samples) < 10:
                empty_samples.append((i, r[0]))
        elif non_ascii.search(reading):
            katakana += 1
            if len(katakana_samples) < 10:
                katakana_samples.append((i, r[0], reading))
        elif ascii_only.match(reading):
            ascii += 1
            if len(ascii_samples) < 10:
                ascii_samples.append((i, r[0], reading))
        else:
            other += 1
    print('File:', p)
    print(' total rows:', total)
    print(' katakana readings:', katakana)
    print(' empty readings:', empty)
    print(' ascii-only readings:', ascii)
    print(' other readings:', other)
    if ascii_samples:
        print(' ascii samples (line,word,reading):')
        for s in ascii_samples:
            print('  ', s)
    if empty_samples:
        print(' empty samples (line,word):')
        for s in empty_samples:
            print('  ', s)
    if katakana_samples:
        print(' katakana samples (line,word,reading):')
        for s in katakana_samples:
            print('  ', s)
    print('')
