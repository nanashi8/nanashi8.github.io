#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSVの「関連分野」列を共通の約20カテゴリに正規化して上書きするスクリプト。
- バックアップを同ディレクトリに `.bak` を付けて保存します。
- セル内の区切り文字（、,;|/）で分割してマッピングを適用。
- 出力は同じCSVで、関連分野セルはセミコロン区切りに統一。

実行例:
python3 Tools/normalize_related_fields.py
"""

import csv
import re
from pathlib import Path
from collections import OrderedDict

# 対象ファイル（絶対パス）
FILES = [
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英単語.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英会話.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学古典単語.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/SimpleWord/Resources/中学英熟語.csv',
    '/Users/yuichinakamura/Documents/20251006_002/SimpleWord/changes/中学英単語_meaning_changes.csv',
]

SEP_RE = re.compile(r'[、,;/|]+')

# 正規化カテゴリ（日本語）: これを約20個に調整
CATEGORIES = [
    '日常',
    '食べ物・飲食',
    '学校・学習',
    '家族・人間関係',
    '交通・移動',
    '住居・建物',
    '仕事・職業',
    '医療・健康',
    '公共・サービス',
    '商業・買い物',
    '自然',
    '動物',
    '植物',
    '天体・天気',
    '文化・芸術・娯楽',
    '感情・思考・認知',
    '物理・状態',
    '文法・表現',
    '方角・場所・地理',
    '時間・頻度',
]

# キーワード→カテゴリマッピング（左側のキーワードを含む分野名を右カテゴリにマップ）
MAPPING = [
    (['日常','daily'], '日常'),
    (['食べ物','food','食事','meal','meat','vegetable','fruit','bread','rice','egg','juice','drink','milk','tea','coffee','飲み物','食べ物','飲食','食事'], '食べ物・飲食'),
    (['school','student','teacher','study','学習','教育'], '学校・学習'),
    (['family','friend','mother','father','家族','ともだち','親族'], '家族・人間関係'),
    (['car','bus','train','plane','taxi','交通','移動','ticket','駅','空港'], '交通・移動'),
    (['house','home','room','building','住居','家','建物','apartment'], '住居・建物'),
    (['job','work','職業','teacher','doctor','nurse','police','firefighter','仕事','職業'], '仕事・職業'),
    (['hospital','health','医療','病院','clinic','doctor','nurse','medical','健康'], '医療・健康'),
    (['public','police','bank','post','公共','サービス','hospital','bank','police'], '公共・サービス'),
    (['market','shop','buy','sell','cashier','商業','買い物','shop','market'], '商業・買い物'),
    (['自然','nature','tree','leaf','flower','grass','plant','植物'], '自然'),
    (['animal','動物','cat','dog','lion','bird','fish','cow','pig','rabbit'], '動物'),
    (['plant','植物','tree','flower','leaf'], '植物'),
    (['sun','moon','star','天体','weather','rain','snow','天気'], '天体・天気'),
    (['music','movie','cinema','文化','culture','趣味','娯楽','芸術','art'], '文化・芸術・娯楽'),
    (['feel','feelings','感情','think','believe','cognitive','思考','記憶','認知'], '感情・思考・認知'),
    (['light','dark','hot','cold','状態','state','物理','physical'], '物理・状態'),
    (['verb','動詞','形容詞','副詞','助動詞','文法','grammar','表現'], '文法・表現'),
    (['north','south','east','west','map','city','town','place','地理','方角','場所'], '方角・場所・地理'),
    (['time','always','sometimes','never','often','時間','頻度'], '時間・頻度'),
]

# 追加：日本語で既に正常な値を直接マップする短縮表
DIRECT_MAP = {
    '日常': '日常',
    '食べ物': '食べ物・飲食',
    '飲み物': '食べ物・飲食',
    '食事': '食べ物・飲食',
    '学校': '学校・学習',
    '学習': '学校・学習',
    '教育': '学校・学習',
    '家族': '家族・人間関係',
    'ともだち': '家族・人間関係',
    '交通': '交通・移動',
    '移動': '交通・移動',
    '住居': '住居・建物',
    '建物': '住居・建物',
    '職業': '仕事・職業',
    '公共': '公共・サービス',
    'サービス': '公共・サービス',
    '商業': '商業・買い物',
    '買い物': '商業・買い物',
    '自然': '自然',
    '動物': '動物',
    '植物': '植物',
    '天体': '天体・天気',
    '文化': '文化・芸術・娯楽',
    '芸術': '文化・芸術・娯楽',
    '娯楽': '文化・芸術・娯楽',
    '感情': '感情・思考・認知',
    '思考': '感情・思考・認知',
    '記憶': '感情・思考・認知',
    '状態': '物理・状態',
    '文法': '文法・表現',
    '表現': '文法・表現',
    '方角': '方角・場所・地理',
    '場所': '方角・場所・地理',
    '地理': '方角・場所・地理',
    '時間': '時間・頻度',
    '頻度': '時間・頻度',
}


def map_token(tok: str) -> str:
    t = tok.strip()
    if not t:
        return None
    # direct map exact
    if t in DIRECT_MAP:
        return DIRECT_MAP[t]
    low = t.lower()
    # keyword mapping
    for keys, cat in MAPPING:
        for k in keys:
            if k.lower() in low or k in t:
                return cat
    # fallback: heuristics
    if any(ch.isalpha() for ch in t):
        # if English word likely, try some simple checks
        if 'verb' in low or 'noun' in low or 'adj' in low or 'v.' in low:
            return '文法・表現'
    return '日常'  # default bucket


def normalize_file(path: Path):
    if not path.exists():
        print(f"SKIP (not found): {path}")
        return
    bak = path.with_suffix(path.suffix + '.bak')
    # create backup
    if not bak.exists():
        content = path.read_bytes()
        bak.write_bytes(content)
        print(f"Backup created: {bak}")

    with path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        # find related column
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
        if not related_col:
            print(f"No related column in {path}, headers={headers}")
            return
        rows = list(reader)

    # process rows and write back
    out_rows = []
    for row in rows:
        cell = (row.get(related_col) or '').strip()
        if not cell:
            row[related_col] = ''
            out_rows.append(row)
            continue
        parts = [p.strip() for p in SEP_RE.split(cell) if p.strip()]
        mapped = []
        for p in parts:
            m = map_token(p)
            if m and m not in mapped:
                mapped.append(m)
        row[related_col] = ';'.join(mapped)
        out_rows.append(row)

    # write back with same headers order
    with path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for r in out_rows:
            writer.writerow(r)
    print(f"Normalized: {path} -> {len(out_rows)} rows")


def main():
    for p in FILES:
        normalize_file(Path(p))

if __name__ == '__main__':
    main()
