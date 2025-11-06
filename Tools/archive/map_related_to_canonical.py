#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Map various existing '関連分野' values to a canonical set of ~20 single-token categories.
Writes backups and per-file report. Use from workspace root.
"""
from pathlib import Path
import csv
import shutil
import re

ROOT = Path('/Users/yuichinakamura/Documents/20251006_002/SimpleWord')
REPORTS = ROOT / 'Tools' / 'reports'
REPORTS.mkdir(parents=True, exist_ok=True)

CANONICAL = [
    "日常","学校・学習","食べ物・飲食","自然","動物","感情","家族・住居",
    "交通・移動","時間・頻度","文法・表現","文化・芸術","仕事・職業","健康・身体",
    "科学・物理","地理・天気","買い物・商業","スポーツ・遊び","テクノロジー","社会・政治","その他",
]

# mapping of known variants -> canonical
MAPPING = {
    # english-like variants
    'everyday':'日常','daily':'日常','life':'日常',
    'school':'学校・学習','study':'学校・学習','lesson':'学校・学習',
    'food':'食べ物・飲食','drink':'食べ物・飲食','meal':'食べ物・飲食',
    'nature':'自然','weather':'地理・天気','sea':'自然','ocean':'自然',
    'animal':'動物','bird':'動物','fish':'動物','cat':'動物','dog':'動物',
    'emotion':'感情','happy':'感情','sad':'感情',
    'family':'家族・住居','home':'家族・住居','house':'家族・住居',
    'transport':'交通・移動','bus':'交通・移動','train':'交通・移動','airport':'交通・移動',
    'time':'時間・頻度','hour':'時間・頻度','often':'時間・頻度',
    'phrase':'文法・表現','sentence':'文法・表現','grammar':'文法・表現',
    'music':'文化・芸術','movie':'文化・芸術','art':'文化・芸術',
    'job':'仕事・職業','work':'仕事・職業','career':'仕事・職業',
    'health':'健康・身体','medical':'健康・身体','hospital':'健康・身体',
    'science':'科学・物理','physics':'科学・物理','chemistry':'科学・物理',
    'bank':'買い物・商業','shop':'買い物・商業','market':'買い物・商業','store':'買い物・商業',
    'sport':'スポーツ・遊び','game':'スポーツ・遊び',
    'tech':'テクノロジー','computer':'テクノロジー','online':'テクノロジー','通信':'テクノロジー',
    'society':'社会・政治','politics':'社会・政治','history':'社会・政治',

    # Japanese direct mappings
    '日常':'日常','生活':'日常','毎日':'日常',
    '学校・学習':'学校・学習','学校':'学校・学習','学習':'学校・学習','勉強':'学校・学習',
    '食べ物':'食べ物・飲食','食べ物・飲食':'食べ物・飲食','飲み物':'食べ物・飲食','食事':'食べ物・飲食','料理':'食べ物・飲食','飲食':'食べ物・飲食',
    '自然':'自然','植物':'自然','天気':'地理・天気','天体':'地理・天気','地理':'地理・天気','海':'自然','山':'自然',
    '動物':'動物','哺乳類':'動物','鳥':'動物','魚':'動物','昆虫':'動物',
    '感情':'感情','気持ち':'感情',
    '家族':'家族・住居','住居':'家族・住居','住':'家族・住居','家':'家族・住居','住居・建物':'家族・住居',
    '交通':'交通・移動','交通・移動':'交通・移動','移動':'交通・移動','公共':'交通・移動',
    '時間':'時間・頻度','頻度':'時間・頻度','時':'時間・頻度','時間表現':'時間・頻度',
    '文法':'文法・表現','表現':'文法・表現','表現・文法':'文法・表現','敬語表現':'文法・表現','行動表現':'文法・表現',
    '文化':'文化・芸術','芸術':'文化・芸術','音楽':'文化・芸術','映画':'文化・芸術',
    '仕事':'仕事・職業','職業':'仕事・職業','仕事・職業':'仕事・職業',
    '健康':'健康・身体','医療':'健康・身体','病院':'健康・身体',
    '科学':'科学・物理','物理':'科学・物理',
    '買い物':'買い物・商業','商業':'買い物・商業','店':'買い物・商業','マーケット':'買い物・商業',
    'スポーツ':'スポーツ・遊び','遊び':'スポーツ・遊び',
    'テクノロジー':'テクノロジー','技術':'テクノロジー','通信':'テクノロジー',
    '社会':'社会・政治','政治':'社会・政治','歴史':'社会・政治',
    'その他':'その他',

    # conversation-specific
    '自己紹介':'日常','挨拶':'日常','挨拶表現':'日常','電話':'日常','挨拶・自己紹介':'日常',
    '買い物・商業':'買い物・商業','レストラン':'食べ物・飲食','道案内':'交通・移動','空港':'交通・移動','銀行':'買い物・商業',
    '病気':'健康・身体','病院':'健康・身体','病気・症状':'健康・身体','ホテル':'交通・移動','旅行':'交通・移動',
    'オンライン':'テクノロジー','オンライン会議':'テクノロジー','配達':'買い物・商業',
}

SEP_RE = re.compile(r'[;、,;/|]+')

# priority order when multiple mapped categories appear
PRIORITY = [
    '動物','日常','学校・学習','食べ物・飲食','自然','感情','家族・住居',
    '交通・移動','時間・頻度','文法・表現','文化・芸術','仕事・職業','健康・身体',
    '科学・物理','地理・天気','買い物・商業','スポーツ・遊び','テクノロジー','社会・政治','その他',
]

REPORT_SUMMARY = []


def map_token(tok: str):
    s = tok.strip()
    if not s:
        return None
    low = s.lower()
    if s in MAPPING:
        return MAPPING[s]
    if low in MAPPING:
        return MAPPING[low]
    # try substring matching
    for key, val in MAPPING.items():
        if key in s or key in low:
            return val
    # heuristics
    if any(ch in s for ch in '学校学習勉強'):
        return '学校・学習'
    if any(ch in s for ch in '食事飲食食'):
        return '食べ物・飲食'
    if any(ch in s for ch in '動物鳥魚猫犬'):
        return '動物'
    return 'その他'


def process_file(p: Path):
    with p.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    if not fieldnames:
        return None
    related_name = None
    for fn in fieldnames:
        if '関連' in fn and '分野' in fn:
            related_name = fn
            break
    if not related_name:
        return None
    # key field (語句) for fallback mapping
    key_field = fieldnames[0]
    bak = p.with_suffix(p.suffix + '.canonical.bak')
    shutil.copy2(p, bak)
    diffs = []
    counts = {}
    changed = 0
    for i, row in enumerate(rows, start=2):
        orig = (row.get(related_name) or '').strip()
        key_word = (row.get(key_field) or '').strip()
        if not orig:
            new = ''
        else:
            parts = [t.strip() for t in SEP_RE.split(orig) if t.strip()]
            mapped = []
            for t in parts:
                m = map_token(t)
                if m:
                    mapped.append(m)
            # reduce to single canonical by priority
            sel = None
            for cat in PRIORITY:
                if cat in mapped:
                    sel = cat
                    break
            if not sel:
                sel = mapped[0] if mapped else 'その他'
            new = sel
        # fallback: if key_word suggests a more specific category (e.g. animal), prefer it
        if key_word:
            key_mapped = map_token(key_word)
            if key_mapped and key_mapped not in ('日常', 'その他'):
                if new in ('日常', 'その他') or new != key_mapped:
                    new = key_mapped
        if new != orig:
            diffs.append((i, row, orig, new))
            changed += 1
        row[related_name] = new
        if new:
            counts[new] = counts.get(new, 0) + 1
    # write report
    report = REPORTS / f"{p.stem}_canonical_map_diff.txt"
    with report.open('w', encoding='utf-8') as rf:
        rf.write(f"Report: {p}\n")
        rf.write(f"Backup used: {bak}\n\n")
        rf.write("row\tkey\told_related\tnew_related\n")
        key_field = fieldnames[0]
        for i, row, old, new in diffs:
            key = row.get(key_field, '')
            rf.write(f"{i}\t{key}\t{old}\t{new}\n")
    # write back
    tmp = p.with_suffix('.tmp')
    with tmp.open('w', newline='', encoding='utf-8') as wf:
        writer = csv.DictWriter(wf, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    shutil.move(str(tmp), str(p))
    return {'path': str(p), 'rows': len(rows), 'changed': changed, 'counts': counts, 'report': str(report), 'backup': str(bak)}


def main():
    results = []
    for f in sorted(ROOT.rglob('*中学*.csv')):
        r = process_file(f)
        if r:
            results.append(r)
    # summary print
    for r in results:
        print(f"{r['path']}: rows={r['rows']} changed={r['changed']} unique_categories_after={len(r['counts'])} report={r['report']} backup={r['backup']}")
        for k,v in sorted(r['counts'].items(), key=lambda x:-x[1]):
            print(f"  {v:4d} {k}")
        print()

if __name__ == '__main__':
    main()
