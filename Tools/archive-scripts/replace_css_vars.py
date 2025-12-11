#!/usr/bin/env python3
"""
CSS変数名の安全な置換（dry-run対応）
- 古い禁止変数名をコアパレットの変数名に置換（提案に基づく）
- バックアップを作成して安全に上書き
"""
import re
from pathlib import Path
import argparse

REPLACEMENTS = {
    '--text-color': '--text',
    '--text-secondary': '--text-secondary',
    '--text-tertiary': '--text-tertiary',
    '--btn-primary-bg': '--primary',
    '--btn-primary-hover': '--primary-hover',
    '--btn-primary-text': '--primary-text',
    '--btn-secondary-bg': '--secondary',
    '--btn-secondary-hover': '--secondary-hover',
    '--border-color': '--border',
    '--border-color-light': '--border-light',
    '--bg-tertiary': '--bg-tertiary',
    '--success-color': '--success',
    '--success-border': '--success-border',
    '--info-color': '--info',
    '--warning-color': '--warning',
    '--error-color': '--error',
    '--card-bg': '--card-bg',
}

CSS_GLOBS = [
    'nanashi8.github.io/src/**/*.css',
    'nanashi8.github.io/src/**/*.pcss',
]


def process_file(path: Path, dry_run: bool = True):
    text = path.read_text(encoding='utf-8')
    original = text
    counts = {}

    for old, new in REPLACEMENTS.items():
        pattern = re.compile(r'var\(\s*' + re.escape(old) + r"\s*\)")
        new_text = pattern.sub(f'var({new})', text)
        num = len(re.findall(pattern, text))
        if num:
            counts[old] = num
            text = new_text

    if dry_run:
        return counts

    # 書き込み前にバックアップ
    if text != original:
        backup = path.with_suffix(path.suffix + '.backup')
        backup.write_text(original, encoding='utf-8')
        path.write_text(text, encoding='utf-8')
    return counts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='実際に書き換えを適用する')
    args = parser.parse_args()

    files = []
    for g in CSS_GLOBS:
        files.extend(Path('.').glob(g))

    total_changes = 0
    report = {}

    for f in files:
        counts = process_file(f, dry_run=not args.apply)
        if counts:
            report[str(f)] = counts
            total_changes += sum(counts.values())

    if not report:
        print('置換対象は見つかりませんでした')
        return

    print('置換レポート:')
    for f, counts in report.items():
        print(f'  {f}')
        for k, v in counts.items():
            print(f'    {k} -> {REPLACEMENTS[k]} : {v} 箇所')

    print(f'合計: {total_changes} 置換候補')

    if not args.apply:
        print('\n現在はdry-runです。実際の適用は `--apply` を指定してください。')


if __name__ == '__main__':
    main()
