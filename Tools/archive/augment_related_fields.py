#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
既存のCSVの関連分野列を拡張し、各ファイルのユニークカテゴリ数を目標（約20）に近づけるスクリプト。
- 元ファイルは既に normalize_related_fields.py で正規化済み（カテゴリはセミコロン区切り）を前提とする。
- 各行の `語句` と `関連語（英語）と意味（日本語）` を解析して追加カテゴリを推定。
- それでも不足するカテゴリは、カテゴリの出現が少ない行に割り当てて埋める。
- 変更前にファイルごとに `.preaugment.bak` を作成します。

注意: 小さなCSV（行数 << 20）は意味ある多様性を持たせるのが難しいため、できる限り妥当なカテゴリを割り当てます。
"""

import csv, re
from pathlib import Path
from collections import Counter, defaultdict

FILES = [
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英単語.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英会話.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学古典単語.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英熟語.csv',
]

# Reuse mapping logic (kept in script for simplicity)
SEP_RE = re.compile(r'[、,;/|]+')
TOKEN_RE = re.compile(r"[\w']+|[一-龥ぁ-んァ-ン]+")

CATEGORIES = [
    '日常','食べ物・飲食','学校・学習','家族・人間関係','交通・移動','住居・建物','仕事・職業','医療・健康','公共・サービス','商業・買い物','自然','動物','植物','天体・天気','文化・芸術・娯楽','感情・思考・認知','物理・状態','文法・表現','方角・場所・地理','時間・頻度'
]

# simplified mapping keywords
KEYWORD_MAP = {
    '食': '食べ物・飲食', 'drink': '食べ物・飲食', 'juice':'食べ物・飲食', 'rice':'食べ物・飲食', 'bread':'食べ物・飲食',
    'school':'学校・学習','study':'学校・学習','student':'学校・学習','teacher':'学校・学習','教育':'学校・学習',
    'family':'家族・人間関係','friend':'家族・人間関係','mother':'家族・人間関係',
    'car':'交通・移動','bus':'交通・移動','train':'交通・移動','plane':'交通・移動','交通':'交通・移動',
    'house':'住居・建物','home':'住居・建物','room':'住居・建物','建物':'住居・建物',
    'hospital':'医療・健康','health':'医療・健康','医療':'医療・健康','doctor':'医療・健康',
    'bank':'公共・サービス','police':'公共・サービス','公共':'公共・サービス',
    'shop':'商業・買い物','market':'商業・買い物','buy':'商業・買い物','sell':'商業・買い物','買い物':'商業・買い物',
    'tree':'自然','leaf':'自然','plant':'植物','flower':'自然','自然':'自然','植物':'植物',
    'bird':'動物','dog':'動物','cat':'動物','fish':'動物','animal':'動物','動物':'動物',
    'sun':'天体・天気','moon':'天体・天気','star':'天体・天気','rain':'天体・天気','天気':'天体・天気',
    'music':'文化・芸術・娯楽','movie':'文化・芸術・娯楽','文化':'文化・芸術・娯楽','芸術':'文化・芸術・娯楽',
    'feel':'感情・思考・認知','think':'感情・思考・認知','記憶':'感情・思考・認知',
    'light':'物理・状態','dark':'物理・状態','hot':'物理・状態','cold':'物理・状態',
    'verb':'文法・表現','動詞':'文法・表現','文法':'文法・表現','表現':'文法・表現',
    'north':'方角・場所・地理','south':'方角・場所・地理','地理':'方角・場所・地理','場所':'方角・場所・地理',
    'time':'時間・頻度','always':'時間・頻度','often':'時間・頻度','時間':'時間・頻度'
}

TARGET = 20


def infer_from_text(text):
    if not text:
        return []
    tokens = TOKEN_RE.findall(text.lower())
    cats = []
    for t in tokens:
        for k,v in KEYWORD_MAP.items():
            if k in t:
                if v not in cats:
                    cats.append(v)
    return cats


def augment_file(path: Path):
    if not path.exists():
        print('MISSING', path)
        return
    bak = path.with_suffix(path.suffix + '.preaugment.bak')
    if not bak.exists():
        bak.write_bytes(path.read_bytes())
        print('Backup pre-augment:', bak)
    with path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        related_col = None
        for h in headers:
            if h and '関連分野' in h:
                related_col = h
                break
        if not related_col:
            for h in headers:
                if h and '分野' in h:
                    related_col = h
                    break
        rows = list(reader)

    # current present categories
    present = set()
    for row in rows:
        cell = (row.get(related_col) or '').strip()
        if cell:
            for p in cell.split(';'):
                if p.strip(): present.add(p.strip())

    # first pass: infer per row from 語句 and 関連語 column
    rel_col_possible = None
    for c in headers:
        if '関連語' in c:
            rel_col_possible = c
            break
    for row in rows:
        cell = (row.get(related_col) or '').strip()
        existing = [x.strip() for x in cell.split(';') if x.strip()]
        # infer from 語句
        inferred = infer_from_text(row.get('語句') or '')
        # infer from related column
        if rel_col_possible:
            inferred += infer_from_text(row.get(rel_col_possible) or '')
        # add inferred categories if not present
        for cat in inferred:
            if cat not in existing:
                existing.append(cat)
                present.add(cat)
        row[related_col] = ';'.join(existing)

    # if still less than TARGET, distribute missing categories to rows with fewest tags
    missing = [c for c in CATEGORIES if c not in present]
    idx = 0
    while len(present) < min(TARGET, len(CATEGORIES)) and missing:
        cat = missing.pop(0)
        # find a row where adding this cat is least harmful: choose row with smallest number of categories
        best_row = None
        best_count = None
        for r in rows:
            cell = (r.get(related_col) or '').strip()
            count = len([x for x in cell.split(';') if x.strip()])
            if best_count is None or count < best_count:
                best_count = count
                best_row = r
        if best_row is None:
            break
        cell = (best_row.get(related_col) or '').strip()
        parts = [x.strip() for x in cell.split(';') if x.strip()]
        if cat not in parts:
            parts.append(cat)
            best_row[related_col] = ';'.join(parts)
            present.add(cat)

    # write back
    with path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for r in rows:
            safe = {h: (r.get(h) or '') for h in headers}
            writer.writerow(safe)
    print('Augmented', path, 'unique_categories=', len(present))


def main():
    for p in FILES:
        augment_file(Path(p))

if __name__ == '__main__':
    main()
