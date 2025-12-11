#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全ての英語スペルにカタカナ読み(アクセント付き)を付与
"""

import csv
import re

# 完全なカタカナマッピング (アクセント付き)
COMPLETE_KATAKANA_MAP = {
    'Abroad': 'アブロ́ード',
    'Accident': 'ア́クシデント',
    'According': 'アコ́ーディング',
    'Action': 'ア́クション',
    'Actually': 'ア́クチュアリ',
    'Against': 'アゲ́インスト',
    'Ahead': 'アヘ́ッド',
    'Aid': 'エ́イド',
    'Airplane': 'エ́アプレイン',
    'Airport': 'エ́アポート',
    'Area': 'エ́リア',
    'Around': 'アラ́ウンド',
    'August': 'オ́ーガスト',
    'Awesome': 'オ́ーサム',
    'Baby': 'ベ́イビー',
    'Bacon': 'ベ́イコン',
    'Badminton': 'バ́ドミントン',
    'Bake': 'ベ́イク',
    'Bomb': 'ボ́ム',
    'Bookstore': 'ブ́ックストア',
    'Bored': 'ボ́ード',
    'Boring': 'ボ́ーリング',
    'Born': 'ボ́ーン',
    'Borrow': 'ボ́ロウ',
    'Bottle': 'ボ́トル',
    'Bottom': 'ボ́トム',
    'Bowl': 'ボ́ウル',
    'Brain': 'ブレ́イン',
    'Brazil': 'ブラジ́ル',
    'Breakfast': 'ブレ́ックファスト',
    'Bridge': 'ブリ́ッジ',
    'Bright': 'ブラ́イト',
    'Brown': 'ブラ́ウン',
    'Brush': 'ブラ́シュ',
    'Building': 'ビ́ルディング',
    'Cheese': 'チー́ズ',
    'Chef': 'シェ́フ',
    'Chicken': 'チ́キン',
    'China': 'チャ́イナ',
    'Choice': 'チョ́イス',
    'Choose': 'チュ́ーズ',
    'Church': 'チャ́ーチ',
    'Classmate': 'クラ́スメイト',
    'Classroom': 'クラ́スルーム',
    'Clearly': 'クリ́アリ',
    'Countryside': 'カ́ントリサイド',
    'Couple': 'カ́プル',
    'Courage': 'カ́レッジ',
    'Court': 'コ́ート',
    'Cousin': 'カ́ズン',
    'Cow': 'カ́ウ',
    'Creative': 'クリエ́イティヴ',
    'Crowd': 'クラ́ウド',
    'Crowded': 'クラ́ウディッド',
    'Cultural': 'カ́ルチュラル',
    'Culture': 'カ́ルチャー',
    'Curry': 'カ́リー',
    'Curtain': 'カ́ーテン',
    'Custom': 'カ́スタム',
    'Customer': 'カ́スタマー',
    'Cute': 'キュ́ート',
    'Damage': 'ダ́メージ',
    'Discussion': 'ディスカ́ッション',
    'Disease': 'ディジ́ーズ',
    'Dish': 'ディ́シュ',
    'Display': 'ディスプレ́イ',
    'Dive': 'ダ́イヴ',
    'Dollar': 'ダ́ラー',
    'Domestic': 'ドメ́スティック',
    'Double': 'ダ́ブル',
    'Drama': 'ドラ́マ',
    'Drill': 'ドリ́ル',
    'Driver': 'ドラ́イバー',
    'Drum': 'ドラ́ム',
    'During': 'デュ́アリング',
    'Everybody': 'エ́ヴリバディ',
    'Everyone': 'エ́ヴリワン',
    'Everything': 'エ́ヴリシング',
    'Everywhere': 'エ́ヴリウェア',
    'Exactly': 'イグザ́クトリ',
    'Exam': 'イグザ́ム',
    'Exception': 'イクセ́プション',
    'Excited': 'イクサ́イティッド',
    'Exciting': 'イクサ́イティング',
    'Expensive': 'イクスペ́ンシヴ',
    'Express': 'イクスプレ́ス',
    'Expression': 'イクスプレ́ッション',
    'Factory': 'ファ́クトリ',
    'Fan': 'ファ́ン',
    'Fantastic': 'ファンタ́スティック',
    'Fold': 'フォ́ウルド',
    'Football': 'フ́ットボール',
    'Fortunately': 'フォ́ーチュネイトリ',
    'Forty': 'フォ́ーティ',
    'Fourteen': 'フォーティ́ーン',
    'Fourth': 'フォ́ース',
    'Freedom': 'フリ́ーダム',
    'Freely': 'フリ́ーリ',
    'Fresh': 'フレ́シュ',
    'Friendly': 'フレ́ンドリ',
    'Frog': 'フロ́ッグ',
    'Fruit': 'フルー́ト',
    'Funny': 'ファ́ニー',
    'Garbage': 'ガ́ーベッジ',
    'Headache': 'ヘ́ッデイク',
    'Healthy': 'ヘ́ルシー',
    'Hello': 'ハロ́ウ',
    'Helpful': 'ヘ́ルプフル',
    'Heritage': 'ヘ́リティッジ',
    'Hero': 'ヒ́ーロウ',
    'Hers': 'ハ́ーズ',
    'Herself': 'ハーセ́ルフ',
    'Hi': 'ハ́イ',
    'Hide': 'ハ́イド',
    'Himself': 'ヒムセ́ルフ',
    'Hit': 'ヒ́ット',
    'Hobby': 'ホ́ビー',
    'Instruction': 'インストラ́クション',
    'Interested': 'イ́ンタレスティッド',
    'Interesting': 'イ́ンタレスティング',
    'Internet': 'イ́ンターネット',
    'Interview': 'イ́ンタヴュー',
    'Invention': 'インヴェ́ンション',
    'Issue': 'イ́シュー',
    'Jacket': 'ジャ́ケット',
    'Jail': 'ジェ́イル',
    'Jam': 'ジャ́ム',
    'Japan': 'ジャパ́ン',
    'Jet': 'ジェ́ット',
    'Job': 'ジョ́ブ',
    'Jog': 'ジョ́グ',
    'Juice': 'ジュ́ース',
    'Just': 'ジャ́スト',
    'Limited': 'リ́ミティッド',
    'Living': 'リ́ヴィング',
    'Lost': 'ロ́スト',
    'Lovely': 'ラ́ヴリ',
    'Lucky': 'ラ́ッキー',
    'Monkey': 'マ́ンキー',
    'Movement': 'ム́ーヴメント',
    'Musical': 'ミュ́ージカル',
    'Musician': 'ミュージ́シャン',
    'Of': 'オ́ヴ',
    'Off': 'オ́フ',
    'On': 'オ́ン',
    'Onion': 'ア́ニオン',
    'Operation': 'オペレ́イション',
    'Personal': 'パ́ーソナル',
    'Picnic': 'ピ́クニック',
    'Pie': 'パ́イ',
    'Pig': 'ピ́ッグ',
    'Pineapple': 'パ́イナップル',
    'Pizza': 'ピ́ッツァ',
    'Plastic': 'プラ́スティック',
    'Pleasure': 'プレ́ジャー',
    'Quantity': 'クオ́ンティティ',
    'Quickly': 'クィ́ックリ',
    'Quietly': 'クワ́イエットリ',
    'Quiz': 'クィ́ズ',
    'Racket': 'ラ́ケット',
    'Rainbow': 'レ́インボウ',
    'Rainy': 'レ́イニー',
    'Rapidly': 'ラ́ピッドリ',
    'Rugby': 'ラ́グビー',
    'Sacred': 'セ́イクリッド',
    'Safety': 'セ́イフティ',
    'Sandwich': 'サ́ンドウィッチ',
    'Scared': 'スケ́アド',
    'Scary': 'スケ́アリー',
    'Scientist': 'サ́イエンティスト',
    'Seafood': 'シ́ーフード',
    'Selection': 'セレ́クション',
    'Sincerely': 'スィンシ́アリ',
    'Sixteen': 'スィックスティ́ーン',
    'Sixth': 'スィ́クス',
    'Sixty': 'スィ́クスティ',
    'Skate': 'スケ́イト',
    'Ski': 'スキ́ー',
    'Sleepy': 'スリ́ーピー',
    'Slowly': 'スロ́ウリ',
    'Smartphone': 'スマ́ートフォン',
    'Snack': 'スナ́ック',
    'Snowy': 'スノ́ウイ',
    'Society': 'ソサ́イエティ',
    'Stomachache': 'スタ́マケイク',
    'Straw': 'ストロ́ー',
    'Strawberry': 'ストロ́ーベリー',
    'Stuff': 'スタ́フ',
    'Subway': 'サ́ブウェイ',
    'Success': 'サクセ́ス',
    'Successful': 'サクセ́スフル',
    'Suddenly': 'サ́ドンリ',
    'Suggestion': 'サジェ́スチョン',
    'Theirs': 'ゼ́アーズ',
    'Thirteen': 'サーティ́ーン',
    'Thirteenth': 'サ́ーティーンス',
    'Thirty': 'サ́ーティ',
    'Thousand': 'サ́ウザンド',
    'Ticket': 'ティ́ケット',
    'Time': 'タ́イム',
    'Tiny': 'タ́イニー',
    'Tired': 'タ́イアド',
    'Unfortunately': 'アンフォ́ーチュネイトリ',
    'Up': 'ア́ップ',
    'Very': 'ヴェ́リ',
    'Wish': 'ウィ́シュ',
    'Worry': 'ワ́リー',
    'Worth': 'ワ́ース',
    'Yellow': 'イェ́ロウ',
}

def convert_all_to_katakana(input_file):
    """全ての英語スペルをカタカナに変換"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    header = rows[0]
    data_rows = rows[1:]
    
    fixed_count = 0
    
    for row in data_rows:
        if len(row) < 2:
            continue
        
        word = row[0]
        reading = row[1]
        
        # パターン: IPA (英語スペル)
        match = re.search(r'(.+)\s*\(([A-Z][a-z]+)\)$', reading)
        
        if match:
            ipa_part = match.group(1).strip()
            english_word = match.group(2)
            
            if english_word in COMPLETE_KATAKANA_MAP:
                katakana = COMPLETE_KATAKANA_MAP[english_word]
                new_reading = f"{ipa_part} ({katakana})"
                row[1] = new_reading
                fixed_count += 1
    
    # ファイルに書き戻し
    with open(input_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows([header] + data_rows)
    
    return fixed_count

def main():
    files = [
        './public/data/vocabulary/intermediate-1800-words.csv',
        './public/data/vocabulary/junior-high-entrance-words.csv',
    ]
    
    total = 0
    for file in files:
        count = convert_all_to_katakana(file)
        total += count
        print(f"✅ {file.split('/')[-1]}: {count}箇所変換")
    
    print(f"\n🎉 完了: 合計 {total}箇所を変換")

if __name__ == '__main__':
    main()
