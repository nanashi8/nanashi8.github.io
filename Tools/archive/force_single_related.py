#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
複数カテゴリになっている `関連分野` を単一カテゴリ（一語）に強制するスクリプト。
既存の正規化後のカテゴリ（セミコロン区切り等）を読み、CATEGORIESの優先順で
最初に該当するカテゴリを採用します。
バックアップを作成し、差分レポートを Tools/reports に出力します。
"""
import csv
import shutil
import re
from pathlib import Path

TARGET_FILES = [
    "SimpleWord/SimpleWord/Resources/中学英単語.csv",
    "SimpleWord/SimpleWord/Resources/中学英会話.csv",
    "SimpleWord/SimpleWord/Resources/中学英熟語.csv",
    "SimpleWord/SimpleWord/Resources/中学古典単語.csv",
    "SimpleWord/Resources/中学英会話.csv",
]

CATEGORIES = [
    "日常",
    "学校・学習",
    "食べ物・飲食",
    "自然",
    "動物",
    "感情",
    "家族・住居",
    "交通・移動",
    "時間・頻度",
    "文法・表現",
    "文化・芸術",
    "仕事・職業",
    "健康・身体",
    "科学・物理",
    "地理・天気",
    "買い物・商業",
    "スポーツ・遊び",
    "テクノロジー",
    "社会・政治",
    "その他",
]

REPORTS_DIR = Path("Tools/reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

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
    # tokens: list of candidate strings (already stripped)
    # Return one category string from CATEGORIES or 'その他'
    normalized = [t for t in tokens if t]
    # if any token exactly matches a CATEGORIES entry, pick highest-priority
    for cat in CATEGORIES:
        for t in normalized:
            if t == cat:
                return cat
    # if tokens contain a category as substring, or vice versa
    for cat in CATEGORIES:
        for t in normalized:
            if cat in t or t in cat:
                return cat
    # otherwise, try to return first token if non-empty
    if normalized:
        return normalized[0]
    return "その他"


def process_file(p: Path):
    if not p.exists():
        print(f"skip: {p} not found")
        return None
    with p.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    rel_field = find_related_field_name(fieldnames)
    if not rel_field:
        print(f"no related field in {p}; skipping")
        return None
    # backup
    bak = p.with_suffix(p.suffix + '.single.bak')
    shutil.copy2(p, bak)
    diffs = []
    changed = 0
    for i, row in enumerate(rows, start=2):
        orig = (row.get(rel_field) or '').strip()
        if not orig:
            new = ""
        else:
            tokens = [t.strip() for t in SEP_RE.split(orig) if t.strip()]
            new = choose_single_category(tokens)
        if new != orig:
            diffs.append((i, row, orig, new))
            changed += 1
        row[rel_field] = new
    # write report
    report_path = REPORTS_DIR / f"{p.stem}_single_related_diff.txt"
    with report_path.open('w', encoding='utf-8') as rf:
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
    # write back csv
    tmp = p.with_suffix('.tmp')
    with tmp.open('w', newline='', encoding='utf-8') as wf:
        writer = csv.DictWriter(wf, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    shutil.move(str(tmp), str(p))
    return {
        'path': str(p),
        'rows': len(rows),
        'changed': changed,
        'report': str(report_path),
        'backup': str(bak),
    }


def main():
    results = []
    for fp in TARGET_FILES:
        p = Path(fp)
        r = process_file(p)
        if r:
            results.append(r)
    print('Single-category normalization complete. Summary:')
    for r in results:
        print(f"{r['path']}: rows={r['rows']} changed={r['changed']} report={r['report']} backup={r['backup']}")

if __name__ == '__main__':
    main()
