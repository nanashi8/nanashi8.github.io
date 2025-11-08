# -*- coding: utf-8 -*-
"""
CSVの4列目（語源等解説（日本語））を他列を変えずに簡易ルールで詳しく分解して補足するスクリプト
使い方:
    python3 Tools/update_explanations.py
出力:
    Tools/中学古典単語.updated.csv

注意: 自動生成のため一部表現は一般化しています。最終チェックをお願いします。
"""
import csv
import re
import os

INPUT = os.path.join(os.path.dirname(__file__), '..', 'SimpleWord', 'Resources', '中学古典単語.csv')
OUTPUT = os.path.join(os.path.dirname(__file__), '中学古典単語.updated.csv')

# 文章を生成する補助関数
def generate_detail(orig: str) -> str:
    s = orig.strip()
    # 保守的に元の説明はそのまま先頭に残す
    parts = [s]

    # 判定フラグ
    is_kogo = '古語' in s or '古典' in s
    has_modern = '現代語' in s or '現代' in s
    # 品詞判定（単語の説明に品詞が含まれる場合が多い）
    is_adverb = '副詞' in s
    is_verb = '動詞' in s or '動' in s
    is_adj = '形容' in s or '美しい' in s or 'かわいい' in s

    # 現代語訳の抽出（例: 現代語「明日」とは異なり「朝」の意味 など）
    modern_equivs = re.findall(r'「([^」]+)」', s)
    modern_text = ''
    if modern_equivs:
        modern_text = '、'.join(modern_equivs)

    # 補足説明を作る
    extra = []
    if is_kogo:
        extra.append('語源: 古典日本語（古語）に由来する表現です。')
    if has_modern and not is_kogo:
        extra.append('現代語との関係が記されています。')
    if is_adverb:
        extra.append('品詞: 副詞。文中で程度や様態を強める用法があります。')
    if is_verb:
        extra.append('品詞: 動詞として使われ、動作や状態を表します。')
    if is_adj:
        extra.append('品詞: 形容詞的な性質を持ち、感情や状態を表すことが多いです。')

    # もし":"や","で続きがある場合は、簡易的にそれを補足情報として扱う
    if ':' in s or '：' in s or ',' in s:
        extra.append('注: 説明には関連する語や現代語訳などが含まれています。')

    if modern_text:
        extra.append(f'現代語で近い語: {modern_text}。')

    # 汎用の用法説明
    extra.append('用法: 文脈によって意味が変わることがあるので、例文で確認すると理解が深まります。')

    # 結合して返す
    return ' '.join(parts + extra)


def main():
    rows = []
    with open(INPUT, 'r', encoding='utf-8') as f:
        # ヘッダを保持
        reader = csv.reader(f)
        for r in reader:
            rows.append(r)

    if not rows:
        print('入力ファイルが空です:', INPUT)
        return

    header = rows[0]
    # 期待するカラム数があるかチェック
    for i, r in enumerate(rows[1:], start=2):
        if len(r) < 4:
            # 行が短い場合はそのままにする
            continue
        orig = r[3]
        new = generate_detail(orig)
        r[3] = new

    # 出力
    with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print('更新ファイルを出力しました:', OUTPUT)

if __name__ == '__main__':
    main()
