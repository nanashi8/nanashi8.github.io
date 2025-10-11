# -*- coding: utf-8 -*-
"""
中学古典単語.csv の 4 列目（語源等解説）を
・「現代語までの変遷」が分かるように
・直感的に "ピンと来る" 一文〜二文の説明にする
・「例文で確認すると理解が深まります」等の汎用文は入れない
というルールで置換するスクリプト。

使い方:
    python3 Tools/update_explanations_v2.py
出力:
    Tools/中学古典単語.updated.v2.csv

注意: 自動生成のため、専門的な語源解釈は簡潔化しています。重要な語は手動チェックを推奨します。
"""
import csv
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), '..')
INPUT = os.path.join(ROOT, 'SimpleWord', 'Resources', '中学古典単語.csv')
OUTPUT = os.path.join(os.path.dirname(__file__), '中学古典単語.updated.v2.csv')

# 補助: 関連語列から現代語の近似を取得する
def parse_related_modern(related_field: str):
    # 例: 'いみじ:非常に' や 'おもしろい:面白い' などカンマで複数ある場合に対応
    if not related_field:
        return []
    parts = [p.strip() for p in related_field.split(',') if p.strip()]
    moderns = []
    for p in parts:
        # '語:意味' の形式であれば語を取り出す
        if ':' in p:
            tok = p.split(':', 1)[0].strip()
            moderns.append(tok)
        else:
            moderns.append(p)
    return moderns

# 説明生成の主ロジック
def generate_explanation(word: str, reading: str, meaning: str, orig_desc: str, related_field: str):
    s = orig_desc.strip()
    moderns = parse_related_modern(related_field)

    # 既存説明から役立つフラグを抽出
    is_kogo = '古語' in s or '古典' in s or '古語で' in s
    has_modern_statement = '現代語' in s or '現代' in s
    nuance_diff = '異な' in s or 'とは異' in s or 'ニュアンス' in s
    honorific = '尊敬' in s or '謙譲' in s or '謙譲語' in s or '尊敬語' in s

    # まず短い導入文：古典での主要な意味（可能なら与えられた意味を活かす）
    intro = ''
    if is_kogo:
        intro = f'古典では「{meaning}」の意味で用いられました。'
    else:
        intro = f'古典的な用例では「{meaning}」として使われます。'

    # 次に現代語への変遷を明確に書く
    modern_part = ''
    if moderns:
        # 複数ある場合は先頭2つまで表示
        shown = moderns[:2]
        if len(shown) == 1:
            modern_part = f'現代の近い語は「{shown[0]}」です。'
        else:
            modern_part = f'現代の近い語は「{shown[0]}」「{shown[1]}」などです。'
    elif has_modern_statement:
        # 原文に現代語表記が含まれている場合、丸ごと抜粋し短くまとめる
        # 「現代語「明日」とは異なり「朝」の意味」などを簡潔化
        m = re.findall(r'現代語[^。,、]*', s)
        if m:
            modern_part = m[0].replace('現代語', '現代語では') + '。'
        else:
            modern_part = '現代語との対応があります。'

    # ニュアンスの違いが書かれている場合はその要点を短く
    nuance_part = ''
    if nuance_diff:
        # 例: '現代語「明日」とは異なり「朝」の意味' を拾う
        diff_match = re.search(r'現代語[^。]*異な[^。]*', s)
        if diff_match:
            nuance_part = diff_match.group(0) + '。'
        else:
            nuance_part = '現代語とニュアンスの違いがあります。'

    # 敬語系の情報は重要なので明示
    honor_part = ''
    if honorific:
        if '尊敬' in s and '謙譲' in s:
            honor_part = '敬語表現として尊敬・謙譲の用法があります。'
        elif '尊敬' in s or '尊敬語' in s:
            honor_part = '尊敬語として用いられます。'
        elif '謙譲' in s or '謙譲語' in s:
            honor_part = '謙譲語として用いられます。'

    # 語源情報が書かれている場合は簡潔に触れる
    etym_part = ''
    if '語源' in s or '由来' in s or '古典日本語' in s or is_kogo:
        etym_part = '語源的には古典日本語に由来します。'

    # 合成して返す。不要に重複する文は削る。
    parts = [intro]
    if modern_part:
        parts.append(modern_part)
    if nuance_part and nuance_part not in modern_part:
        parts.append(nuance_part)
    if honor_part:
        parts.append(honor_part)
    if etym_part and etym_part not in parts:
        parts.append(etym_part)

    # 最終調整: 文章をつなげて1～3文程度にする
    result = ' '.join(parts)
    # 余分な空白を削る
    result = re.sub(r'\s+', ' ', result).strip()
    return result


def main():
    rows = []
    with open(INPUT, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print('入力ファイルが空です:', INPUT)
        return

    header = rows[0]
    out_rows = [header]
    for i, r in enumerate(rows[1:], start=2):
        # 行が短い場合はそのまま
        if len(r) < 7:
            out_rows.append(r)
            continue
        word = r[0]
        reading = r[1]
        meaning = r[2]
        orig_desc = r[3]
        related = r[4]

        new_desc = generate_explanation(word, reading, meaning, orig_desc, related)
        # 置換
        new_row = r.copy()
        new_row[3] = new_desc
        out_rows.append(new_row)

    # 出力
    with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(out_rows)
    print('更新ファイルを出力しました:', OUTPUT)

if __name__ == '__main__':
    main()
