#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV正規化スクリプト
- ヘッダー名のバリエーションを期待ヘッダーに置換
- 難易度文字列(初級/中級/上級)を 1/2/3 に変換
- 語句をキーに重複を解消（非空セル数が多い行を優先）
- 元ファイルを changes/ にバックアップ
- 処理後に簡単なサマリを出力
"""

import csv
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = [ROOT / 'SimpleWord' / 'Resources', ROOT / 'Resources']
BACKUP_DIR = ROOT / 'changes'
BACKUP_DIR.mkdir(exist_ok=True)

EXPECTED_HEADER = ['語句','発音（カタカナ）','和訳','語源等解説（日本語）','関連語（英語）と意味（日本語）','関連分野（日本語）','難易度']

# ヘッダー同士のマッピング（部分一致でも対応）
HEADER_EQUIV = {
    '語句': ['語句', 'フレーズ'],
    '発音（カタカナ）': ['発音（カタカナ）', '読み', '読み（カタカナ）', '発音'],
    '和訳': ['和訳', '意味（日本語）', '意味'],
    '語源等解説（日本語）': ['語源等解説（日本語）', '語源等解説', '語源等解説や覚え方（日本語）', '語源等解説や覚え方'],
    '関連語（英語）と意味（日本語）': ['関連語（英語）と意味（日本語）', '関連語と意味', '関連語（英語）と意味'],
    '関連分野（日本語）': ['関連分野（日本語）', 'シチュエーション（日本語）', '関連分野'],
    '難易度': ['難易度']
}

# 難易度文字列マッピング
DIFF_MAP = {
    '初級': '1',
    '中級': '2',
    '上級': '3',
    '初': '1',
    '中': '2',
    '上': '3'
}

# 逆引き辞書
EQ_REV = {}
for std, variants in HEADER_EQUIV.items():
    for v in variants:
        EQ_REV[v.lower()] = std


def normalize_header(found_header):
    mapped = []
    for h in found_header:
        key = h.strip()
        lower = key.lower()
        if lower in EQ_REV:
            mapped.append(EQ_REV[lower])
        else:
            # try fuzzy partial match
            matched = None
            for v_k, v_std in EQ_REV.items():
                if v_k in lower or lower in v_k:
                    matched = v_std
                    break
            if matched:
                mapped.append(matched)
            else:
                mapped.append(key)
    # Create final header as EXPECTED_HEADER order
    final = EXPECTED_HEADER.copy()
    return final, mapped


def normalize_file(path):
    print('Processing', path)
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    data_lines = [ln for ln in lines if not ln.strip().startswith('//')]
    reader = csv.reader(data_lines)
    rows = list(reader)
    if not rows:
        print('  empty, skip')
        return {'path': path, 'status': 'empty'}
    found_header = rows[0]
    std_header, mapped = normalize_header(found_header)

    # Build index mapping from found columns to expected columns positions
    index_map = {}
    for i, m in enumerate(mapped):
        for exp in EXPECTED_HEADER:
            if m == exp and exp not in index_map:
                index_map[exp] = i

    entries = rows[1:]
    kept = {}
    duplicates = {}

    for idx, row in enumerate(entries, start=2):
        if len(row) < len(found_header):
            row = row + [''] * (len(found_header) - len(row))
        norm = [''] * len(EXPECTED_HEADER)
        for j, exp in enumerate(EXPECTED_HEADER):
            if exp in index_map and index_map[exp] < len(row):
                val = row[index_map[exp]].strip()
            else:
                val = ''
            if exp == '難易度' and val:
                v = val.strip()
                if v in DIFF_MAP:
                    v = DIFF_MAP[v]
                norm[j] = v
            else:
                norm[j] = val
        key = norm[0].strip()
        if not key:
            key = f'__EMPTY_KEY_LINE_{idx}'
        nonempty = sum(1 for c in norm[1:] if c)
        if key in kept:
            prev_row, prev_nonempty, prev_idx = kept[key]
            replace = False
            if nonempty > prev_nonempty:
                replace = True
            elif nonempty == prev_nonempty:
                replace = True
            if replace:
                duplicates.setdefault(key, []).append(prev_row)
                kept[key] = (norm, nonempty, idx)
            else:
                duplicates.setdefault(key, []).append(norm)
        else:
            kept[key] = (norm, nonempty, idx)

    chosen = sorted(((v[2], v[0]) for k, v in kept.items()), key=lambda x: x[0])
    output_rows = [EXPECTED_HEADER] + [r for _, r in chosen]

    now = datetime.now().strftime('%Y%m%d%H%M%S')
    bak = BACKUP_DIR / f'{path.name}.bak.{now}'
    bak.write_text(text, encoding='utf-8')

    with path.open('w', encoding='utf-8', newline='') as out:
        writer = csv.writer(out)
        writer.writerows(output_rows)

    return {'path': path, 'status': 'normalized', 'original_rows': len(entries), 'new_rows': len(chosen), 'duplicates': len(duplicates), 'backup': bak}


def main():
    paths = []
    for d in CANDIDATES:
        if d.exists():
            for p in d.glob('*.csv'):
                paths.append(p)
    if not paths:
        print('No CSVs found to normalize')
        return
    results = []
    for p in paths:
        try:
            res = normalize_file(p)
            results.append(res)
        except Exception as e:
            print('Error processing', p, e)
            results.append({'path': p, 'status': 'error', 'error': str(e)})

    print('\nSummary:')
    for r in results:
        p = r['path']
        s = r['status']
        if s == 'normalized':
            print(f" - {p}: normalized, rows {r['original_rows']} -> {r['new_rows']}, duplicates {r['duplicates']}, backup {r['backup'].name}")
        else:
            print(f" - {p}: {s}")

if __name__ == '__main__':
    main()
