#!/usr/bin/env python3
"""
カタカナ英語混入エラーの一括自動修正スクリプト

KATAKANA_ENGLISH_MIXED エラーを自動的に修正します。
英語がそのまま入っているカタカナ部分を適切なカタカナに変換します。
"""

import csv
import re
from pathlib import Path

# 英語→カタカナの大規模変換辞書（264単語）
ENGLISH_TO_KATAKANA = {
    # 既存の修正済み単語
    'August': 'オーガ́スト',
    'Brazil': 'ブラジ́ル',
    'China': 'チャ́イナ',
    'English': 'イ́ングリッシュ',
    'Japan': 'ジャパ́ン',
    'Ms.': 'ミ́ズ',
    
    # A
    'Ahead': 'アヘ́ッド',
    'Aid': 'エ́イド',
    'Airplane': 'エ́アプレイン',
    'Airport': 'エ́アポート',
    'Amazing': 'アメ́イジング',
    'Amount': 'アマ́ウント',
    'Angry': 'ア́ングリー',
    'Animated': 'ア́ニメイティッド',
    'Announcement': 'アナ́ウンスメント',
    'Area': 'エ́リア',
    'Around': 'アラ́ウンド',
    
    # B
    'B': 'ビー',
    'Back': 'バ́ック',
    'Baseball': 'ベ́イスボール',
    'Basketball': 'バ́スケットボール',
    'Bath': 'バ́ス',
    'Bathroom': 'バ́スルーム',
    'Beach': 'ビ́ーチ',
    'Bean': 'ビ́ーン',
    'Because': 'ビコ́ーズ',
    'Bed': 'ベ́ッド',
    'Behavior': 'ビヘ́イビア',
    'Bench': 'ベ́ンチ',
    'Beyond': 'ビヨ́ンド',
    'Bicycle': 'バ́イスィクル',
    'Bike': 'バ́イク',
    'Birthday': 'バ́ースデイ',
    'Bit': 'ビ́ット',
    'Breakfast': 'ブレ́クファスト',
    'Bridge': 'ブリ́ッジ',
    'Bright': 'ブラ́イト',
    'Business': 'ビ́ジネス',
    'Busy': 'ビ́ジー',
    'But': 'バ́ット',
    'By': 'バ́イ',
    'Bye': 'バ́イ',
    
    # C
    'Cabbage': 'キャ́ベツ',
    'Cafe': 'カフェ́',
    'Cake': 'ケ́イク',
    'Careful': 'ケ́アフル',
    'Carefully': 'ケ́アフリー',
    'Carrot': 'キャ́ロット',
    'Certainly': 'サ́ートゥンリー',
    'Challenge': 'チャ́レンジ',
    'Chance': 'チャ́ンス',
    'Choose': 'チュ́ーズ',
    'Church': 'チャ́ーチ',
    'Clock': 'クロ́ック',
    'Cloudy': 'クラ́ウディー',
    'Club': 'クラ́ブ',
    'Colorful': 'カ́ラフル',
    'Cookie': 'ク́ッキー',
    'Cooking': 'ク́ッキング',
    'Countryside': 'カ́ントリーサイド',
    'Couple': 'カ́プル',
    'Courage': 'カ́レッジ',
    'Court': 'コ́ート',
    'Cousin': 'カ́ズン',
    'Cow': 'カ́ウ',
    'Creative': 'クリエ́イティブ',
    'Crowd': 'クラ́ウド',
    'Crowded': 'クラ́ウディッド',
    'Cultural': 'カ́ルチュラル',
    'Culture': 'カ́ルチャー',
    'Curry': 'カ́リー',
    
    # D
    'Difference': 'ディ́フェレンス',
    'Dinner': 'ディ́ナー',
    'Direction': 'ディレ́クション',
    'Dirty': 'ダ́ーティー',
    'Disagree': 'ディスアグリ́ー',
    'Disappear': 'ディスアピ́ア',
    'Disaster': 'ディザ́スター',
    'Discover': 'ディスカ́バー',
    'Discussion': 'ディスカ́ッション',
    'Disease': 'ディジ́ーズ',
    'Dish': 'ディ́ッシュ',
    'Display': 'ディスプレ́イ',
    'Dive': 'ダ́イブ',
    'Dollar': 'ダ́ラー',
    'Domestic': 'ドメ́スティック',
    'Double': 'ダ́ブル',
    'Drama': 'ドラ́マ',
    'Drill': 'ドリ́ル',
    
    # E
    'Earn': 'ア́ーン',
    'Earthquake': 'ア́ースクエイク',
    'Easily': 'イ́ージリー',
    'Effective': 'イフェ́クティブ',
    'Egg': 'エ́ッグ',
    'Eighteen': 'エイティ́ーン',
    'Eighth': 'エ́イス',
    'Eighty': 'エ́イティー',
    'Elderly': 'エ́ルダリー',
    'Establish': 'イスタ́ブリッシュ',
    'Even': 'イ́ーブン',
    'Everybody': 'エ́ブリバディ',
    'Everyone': 'エ́ブリワン',
    'Everything': 'エ́ブリスィング',
    'Everywhere': 'エ́ブリウェア',
    'Exam': 'イグザ́ム',
    'Exception': 'イクセ́プション',
    
    # F
    'Fifteen': 'フィフティ́ーン',
    'Fifth': 'フィ́フス',
    'Fifty': 'フィ́フティー',
    'File': 'ファ́イル',
    'Finally': 'ファ́イナリー',
    'Fishing': 'フィ́ッシング',
    'Fix': 'フィ́ックス',
    'Flight': 'フラ́イト',
    'Focus': 'フォ́ーカス',
    'Fold': 'フォ́ールド',
    'Football': 'フ́ットボール',
    
    # G
    'Gesture': 'ジェ́スチャー',
    'Giant': 'ジャ́イアント',
    'Gift': 'ギ́フト',
    'Glad': 'グラ́ッド',
    'Global': 'グロ́ーバル',
    'Gold': 'ゴ́ールド',
    'Goods': 'グ́ッズ',
    'Gorilla': 'ゴリ́ラ',
    'Grandma': 'グラ́ンマ',
    'Grandpa': 'グラ́ンパ',
    'Grandparent': 'グラ́ンドペアレント',
    'Grapes': 'グレ́イプス',
    'Greatly': 'グレ́イトリー',
    'Grow': 'グロ́ー',
    'Guest': 'ゲ́スト',
    
    # H
    'Hole': 'ホ́ール',
    'Holiday': 'ホ́リデイ',
    'Homework': 'ホ́ームワーク',
    'Hopeful': 'ホ́ープフル',
    'Host': 'ホ́スト',
    'Hotel': 'ホテ́ル',
    'However': 'ハウエ́バー',
    'Hug': 'ハ́グ',
    'Huge': 'ヒュ́ージ',
    'Hunt': 'ハ́ント',
    'Hurt': 'ハ́ート',
    'Husband': 'ハ́ズバンド',
    
    # I
    'Imagine': 'イマ́ジン',
    'Important': 'インポ́ータント',
    'Impossible': 'インポ́ッシブル',
    'In': 'イ́ン',
    'Including': 'インクル́ーディング',
    'Influence': 'イ́ンフルエンス',
    'Injure': 'イ́ンジャー',
    'Injured': 'イ́ンジャード',
    'Ink': 'イ́ンク',
    'Inner': 'イ́ナー',
    
    # J
    'Jog': 'ジョ́グ',
    'Juice': 'ジュ́ース',
    'Just': 'ジャ́スト',
    
    # K
    'Kid': 'キ́ッド',
    'Kilogram': 'キ́ログラム',
    'Kindness': 'カ́インドネス',
    
    # L
    'Like': 'ラ́イク',
    'Living': 'リ́ビング',
    'Lost': 'ロ́スト',
    'Lovely': 'ラ́ブリー',
    'Lucky': 'ラ́ッキー',
    
    # M
    'Many': 'メ́ニー',
    'Match': 'マ́ッチ',
    'Math': 'マ́ス',
    'Maybe': 'メ́イビー',
    'Meaning': 'ミ́ーニング',
    'Medium': 'ミ́ーディアム',
    'Meeting': 'ミ́ーティング',
    'Melon': 'メ́ロン',
    'Mobile': 'モ́バイル',
    'Mom': 'マ́ム',
    'Monkey': 'マ́ンキー',
    'Movement': 'ム́ーブメント',
    
    # N
    'Ninety': 'ナ́インティー',
    'Ninth': 'ナ́インス',
    'Noodle': 'ヌ́ードル',
    'Noon': 'ヌ́ーン',
    'Notebook': 'ノ́ートブック',
    'Nursery': 'ナ́ーサリー',
    
    # O
    'Originally': 'オリ́ジナリー',
    'Out': 'ア́ウト',
    
    # P
    'Panda': 'パ́ンダ',
    'Pardon': 'パ́ードゥン',
    'Peaceful': 'ピ́ースフル',
    'Peach': 'ピ́ーチ',
    'Penguin': 'ペ́ングイン',
    'Pleasure': 'プレ́ジャー',
    'Poet': 'ポ́エット',
    'Pond': 'ポ́ンド',
    'Pop': 'ポ́ップ',
    'Pork': 'ポ́ーク',
    'Potato': 'ポテ́イトゥ',
    'Powerful': 'パ́ワフル',
    'Prefer': 'プリファ́ー',
    'Presentation': 'プレゼンテ́イション',
    'Pressure': 'プレ́ッシャー',
    'Product': 'プロ́ダクト',
    'Professional': 'プロフェ́ッショナル',
    
    # Q
    'Quantity': 'クォ́ンティティー',
    'Quickly': 'クィ́ックリー',
    'Quietly': 'クワ́イエトリー',
    'Quiz': 'クイ́ズ',
    
    # R
    'Racket': 'ラ́ケット',
    'Recently': 'リ́ーセントリー',
    'Recycle': 'リサ́イクル',
    'Remind': 'リマ́インド',
    'Reservation': 'レザベ́イション',
    'Response': 'レスポ́ンス',
    
    # S
    'Sandwich': 'サ́ンドイッチ',
    'Scared': 'スケ́アド',
    'Scary': 'スケ́アリー',
    'Scientist': 'サ́イエンティスト',
    'Seafood': 'シ́ーフード',
    'Seventy': 'セ́ブンティー',
    'Shopping': 'ショ́ッピング',
    'Shorts': 'ショ́ーツ',
    'Shrine': 'シュラ́イン',
    'Simply': 'シ́ンプリー',
    'Sincerely': 'スィンシ́アリー',
    'Solve': 'ソ́ルブ',
    'Souvenir': 'スーベニ́ア',
    'Spaghetti': 'スパゲ́ッティー',
    'Species': 'スピ́ーシーズ',
    'Specific': 'スペスィ́フィック',
    'Stationery': 'ステ́イショナリー',
    'Steak': 'ステ́イク',
    'Strawberry': 'ストロ́ーベリー',
    'Stuff': 'スタ́フ',
    'Subway': 'サ́ブウェイ',
    'Success': 'サクセ́ス',
    'Sunny': 'サ́ニー',
    'Sunrise': 'サ́ンライズ',
    'Sunshine': 'サ́ンシャイン',
    'Supermarket': 'ス́ーパーマーケット',
    'Surf': 'サ́ーフ',
    'Surprised': 'サプラ́イズド',
    'Surprising': 'サプラ́イジング',
    'Swimming': 'スイ́ミング',
    
    # T
    'Tenth': 'テ́ンス',
    'Thank': 'サ́ンク',
    'Ticket': 'ティ́ケット',
    'Time': 'タ́イム',
    'Tiny': 'タ́イニー',
    'Tired': 'タ́イアド',
    'To': 'トゥ́',
    'Traditional': 'トラディ́ショナル',
    
    # U
    'Up': 'ア́ップ',
    
    # W
    'Wait': 'ウェ́イト',
    'Weak': 'ウィ́ーク',
    'Wear': 'ウェ́ア',
    'Welcome': 'ウェ́ルカム',
    'Well': 'ウェ́ル',
    'Wish': 'ウィ́ッシュ',
    'Work': 'ワ́ーク',
    'Would': 'ウ́ッド',
    
    # Y
    'Yellow': 'イェ́ロー',
    'You.': 'ユ́ー',
    'Young': 'ヤ́ング',
    
    # 小文字の単語（IPA記号の可能性があるものは除外）
    # 注: 't', 'k', 'l', 'h', 'd', 'n', 'a', 's', 'j', 'p', 'r' などの
    # 単一文字はIPA記号の可能性が高いため変換しない
    
    # フレーズで使われる小文字単語
    'go': 'ゴ́ー',
    'of': 'オ́ブ',
    'to': 'トゥ́',
    'like': 'ラ́イク',
}

def fix_katakana_english_mixed(csv_file_path: Path, output_path: Path = None):
    """
    CSVファイル内のカタカナ英語混入エラーを修正
    
    Args:
        csv_file_path: 修正対象のCSVファイルパス
        output_path: 出力先パス（Noneの場合は上書き）
    """
    if output_path is None:
        output_path = csv_file_path
    
    fixed_count = 0
    rows = []
    
    print(f"修正対象: {csv_file_path}")
    print("=" * 70)
    
    # CSVファイルを読み込み
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            original_reading = row.get('読み', '')
            word = row.get('語句', '')
            
            if original_reading:
                # カッコ内の英語を検出して修正
                modified = False
                new_reading = original_reading
                
                # 最後の括弧を抽出（カタカナ部分）
                match = re.search(r'^(.+)\s*\(([^)]+)\)$', original_reading)
                if match:
                    ipa_part = match.group(1).strip()
                    paren_content = match.group(2).strip()
                    
                    # カッコ内に英語が含まれている場合
                    if re.search(r'[A-Za-z]', paren_content):
                        # スペース区切りで単語を分割
                        words = paren_content.split()
                        converted_words = []
                        all_converted = True
                        
                        for w in words:
                            if w in ENGLISH_TO_KATAKANA:
                                converted_words.append(ENGLISH_TO_KATAKANA[w])
                            elif w.lower() in ENGLISH_TO_KATAKANA:
                                converted_words.append(ENGLISH_TO_KATAKANA[w.lower()])
                            else:
                                # 変換できない単語がある場合
                                # 元の単語を保持（後で手動修正が必要）
                                converted_words.append(w)
                                all_converted = False
                        
                        if converted_words:
                            katakana = ' '.join(converted_words)
                            new_reading = f"{ipa_part} ({katakana})"
                            modified = True
                
                if modified:
                    print(f"修正: {word}")
                    print(f"  Before: {original_reading}")
                    print(f"  After:  {new_reading}")
                    row['読み'] = new_reading
                    fixed_count += 1
            
            rows.append(row)
    
    # 修正結果を書き込み
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n修正完了: {fixed_count}件")
    return fixed_count

def main():
    # 全ての語彙ファイルを修正
    vocab_dir = Path('public/data/vocabulary')
    csv_files = [
        'high-school-entrance-words.csv',
        'high-school-entrance-phrases.csv',
        'high-school-intermediate-words.csv',
        'high-school-intermediate-phrases.csv',
    ]
    
    total_fixed = 0
    
    for csv_filename in csv_files:
        csv_file = vocab_dir / csv_filename
        
        if not csv_file.exists():
            print(f"⚠️  ファイルが見つかりません: {csv_file}")
            continue
        
        fixed = fix_katakana_english_mixed(csv_file)
        total_fixed += fixed
        print()
    
    print("=" * 70)
    print(f"✅ 合計 {total_fixed}件のカタカナ英語混入を修正しました")

if __name__ == '__main__':
    main()
