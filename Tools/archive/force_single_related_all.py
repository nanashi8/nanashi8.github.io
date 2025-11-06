#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ワークスペース内の '中学' を含むCSVを自動検出して、各CSVの "関連分野" を
単一カテゴリ（一語）に強制するスクリプト。
バックアップを作成し、差分レポートを Tools/reports に出力する。
"""
import csv
import shutil
import re
from pathlib import Path

ROOT = Path('/Users/yuichinakamura/Documents/20251006_002/SimpleWord')
REPORTS_DIR = ROOT / 'Tools' / 'reports'
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

CATEGORIES = [
    "動物", "日常","学校・学習","食べ物・飲食","自然","感情","家族・住居",
    "交通・移動","時間・頻度","文法・表現","文化・芸術","仕事・職業","健康・身体",
    "科学・物理","地理・天気","買い物・商業","スポーツ・遊び","テクノロジー","社会・政治","その他",
]
SEP_RE = re.compile(r"[;、,;/|]+")


def find_related_field_name(fieldnames):
    if not fieldnames:
        return None
    for name in fieldnames:
        if "関連" in name and "分野" in name:
            return name
    for name in fieldnames:
        if name.startswith("関連"):
            return name
    return None


def choose_single_category(tokens):
    normalized = [t for t in tokens if t]
    for cat in CATEGORIES:
        for t in normalized:
            if t == cat:
                return cat
    for cat in CATEGORIES:
        for t in normalized:
            if cat in t or t in cat:
                return cat
    if normalized:
        return normalized[0]
    return "その他"


def process(p: Path):
    with p.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    rel = find_related_field_name(fieldnames)
    if not rel:
        return None
    bak = p.with_suffix(p.suffix + '.single.bak')
    shutil.copy2(p, bak)
    diffs = []
    changed = 0
    for i, row in enumerate(rows, start=2):
        orig = (row.get(rel) or '').strip()
        if not orig:
            new = ''
        else:
            tokens = [t.strip() for t in SEP_RE.split(orig) if t.strip()]
            new = choose_single_category(tokens)
        if new != orig:
            diffs.append((i, row, orig, new))
            changed += 1
        row[rel] = new
    report = REPORTS_DIR / f"{p.stem}_single_related_diff.txt"
    with report.open('w', encoding='utf-8') as rf:
        rf.write(f"Report: {p}\n")
        rf.write(f"Backup used: {bak}\n\n")
        rf.write("row\tkey\told_related\tnew_related\n")
        key_field = None
        if fieldnames:
            for fn in fieldnames:
                low = fn.lower()
                if low in ('word', '語', '英単語', '単語', 'word/phrase', '語句') or '語句' in low:
                    key_field = fn
                    break
            if not key_field:
                key_field = fieldnames[0]
        for i, row, old, new in diffs:
            key = row.get(key_field, '')
            rf.write(f"{i}\t{key}\t{old}\t{new}\n")
    tmp = p.with_suffix('.tmp')
    with tmp.open('w', newline='', encoding='utf-8') as wf:
        writer = csv.DictWriter(wf, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    shutil.move(str(tmp), str(p))
    return {'path': str(p), 'rows': len(rows), 'changed': changed, 'report': str(report), 'backup': str(bak)}


def main():
    files = list(ROOT.rglob('*中学*.csv'))
    results = []
    for f in files:
        res = process(f)
        if res:
            results.append(res)
    print('Done. Processed files:')
    for r in results:
        print(f"{r['path']}: rows={r['rows']} changed={r['changed']} report={r['report']} backup={r['backup']}")

if __name__ == '__main__':
    main()
