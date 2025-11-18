#!/usr/bin/env python3
"""
不足している重要な単語をCSVに追加
基本的な派生語、活用形、よく使われる単語を優先的に追加
"""

import csv

# 追加する単語のリスト（基本形のみ。活用形は自動で処理される）
new_words = [
    # 基本動詞
    ("achieve", "アチ́ーヴ", "達成する", "古フランス語 \"achever\" (完成する)が語源", "accomplish(アカ́ンプリッシュ): 成し遂げる, complete(コンプリ́ート): 完成する", "学校・学習", "初級"),
    ("adapt", "アダ́プト", "適応する", "ラテン語 \"adaptare\" (適合させる)が語源", "adjust(アジャ́スト): 調整する, modify(モ́ディファイ): 修正する", "科学・技術", "中級"),
    ("adopt", "アド́プト", "採用する", "ラテン語 \"adoptare\" (選び取る)が語源", "embrace(エンブレ́イス): 受け入れる, accept(アクセ́プト): 受け入れる", "人・社会", "中級"),
    ("advocate", "ア́ドヴォケイト", "提唱する", "ラテン語 \"advocatus\" (呼び寄せられた者)が語源", "support(サポ́ート): 支持する, promote(プロモ́ート): 促進する", "人・社会", "上級"),
    ("affordable", "アフォ́ーダブル", "手頃な", "afford (余裕がある) + able (できる)から", "cheap(チー́プ): 安い, reasonable(リ́ーゾナブル): 手頃な", "日常生活", "中級"),
    ("agriculture", "ア́グリカルチャー", "農業", "ラテン語 \"agricultura\" (田畑の耕作)が語源", "farming(ファ́ーミング): 農作, cultivation(カルティヴェ́イション): 栽培", "自然・環境", "中級"),
    
    # 重要名詞
    ("ability", "アビ́リティ", "能力", "ラテン語 \"habilis\" (扱いやすい)が語源", "capability(ケイパビ́リティ): 能力, skill(スキ́ル): 技能", "学校・学習", "初級"),
    ("access", "ア́クセス", "接近", "ラテン語 \"accessus\" (接近)が語源", "entry(エ́ントリ): 入場, approach(アプロ́ウチ): 接近", "科学・技術", "中級"),
    ("action", "ア́クション", "行動", "ラテン語 \"actio\" (行為)が語源", "act(ア́クト): 行為, deed(ディ́ード): 行為", "人・社会", "初級"),
    ("activities", "アクティ́ヴィティーズ", "活動", "activity の複数形", "actions(ア́クションズ): 行動, events(イヴェ́ンツ): 出来事", "運動・娯楽", "初級"),
    ("awareness", "アウェ́アネス", "認識", "aware (気づいている) + ness (状態)から", "consciousness(コ́ンシャスネス): 意識, knowledge(ノ́リッジ): 知識", "人・社会", "中級"),
    
    # 形容詞
    ("accessible", "アクセ́シブル", "アクセス可能な", "access (接近) + ible (できる)から", "available(アヴェ́イラブル): 利用可能な, reachable(リ́ーチャブル): 到達可能な", "科学・技術", "中級"),
    ("adaptive", "アダ́プティヴ", "適応性のある", "adapt (適応する) + ive (性質)から", "flexible(フレ́クシブル): 柔軟な, adjustable(アジャ́スタブル): 調整可能な", "科学・技術", "上級"),
    ("active", "ア́クティヴ", "活発な", "ラテン語 \"activus\" (活動的な)が語源", "energetic(エナジェ́ティック): 活力のある, busy(ビ́ジー): 忙しい", "運動・娯楽", "初級"),
    ("actual", "ア́クチュアル", "実際の", "ラテン語 \"actualis\" (実践的な)が語源", "real(リ́アル): 現実の, true(トゥルー): 真実の", "言語基本", "中級"),
    
    # 接続詞・前置詞
    ("actually", "ア́クチュアリ", "実際に", "actual (実際の) + ly (副詞)から", "really(リ́アリ): 本当に, in fact(イ́ンファクト): 実は", "言語基本", "中級"),
    ("additionally", "アディショ́ナリ", "さらに", "additional (追加の) + ly (副詞)から", "moreover(モーロ́ウヴァー): さらに, furthermore(ファ́ーザーモア): その上", "言語基本", "上級"),
    ("against", "アゲ́インスト", "〜に対して", "古英語 \"ongean\" (反対に)が語源", "versus(ヴァ́ーサス): 対, opposed to(オポ́ウズドトゥ): 反対して", "言語基本", "初級"),
    
    # その他重要語
    ("ai", "エーア́イ", "人工知能", "Artificial Intelligence の略", "robot(ロ́ウボット): ロボット, machine(マシ́ーン): 機械", "科学・技術", "中級"),
    ("among", "アマ́ング", "〜の間で", "古英語 \"onmang\" (群れの中に)が語源", "between(ビトウィ́ーン): 間に, amid(アミ́ッド): 〜の真ん中に", "言語基本", "初級"),
    ("analysis", "アナ́リシス", "分析", "ギリシャ語 \"analysis\" (解析)が語源", "examination(イグザミネ́イション): 検査, study(スタ́ディ): 研究", "学校・学習", "中級"),
]

def add_words_to_csv():
    """単語をCSVに追加"""
    csv_path = 'public/data/junior-high-entrance-words.csv'
    
    # 既存の単語を読み込み
    existing_words = set()
    existing_rows = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            existing_words.add(row['語句'].lower())
            existing_rows.append(row)
    
    # 新しい単語を追加
    added = 0
    for word_data in new_words:
        word = word_data[0].lower()
        if word not in existing_words:
            existing_rows.append({
                '語句': word_data[0],
                '読み': word_data[1],
                '意味': word_data[2],
                '語源等解説': word_data[3],
                '関連語': word_data[4],
                '関連分野': word_data[5],
                '難易度': word_data[6]
            })
            added += 1
            print(f'追加: {word_data[0]} - {word_data[2]}')
    
    # ソートして保存
    existing_rows.sort(key=lambda x: x['語句'].lower())
    
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(existing_rows)
    
    print(f'\n{added}個の新しい単語を追加しました')
    print(f'合計: {len(existing_rows)}単語')

if __name__ == '__main__':
    add_words_to_csv()
