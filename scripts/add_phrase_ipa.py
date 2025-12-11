#!/usr/bin/env python3
"""
junior-high-entrance-phrases.csvの熟語にIPAを追加
各単語ごとにIPAを生成
"""

import csv
import re
from junior_high_ipa_map import JUNIOR_HIGH_IPA_MAP

# intermediate用辞書も追加
PHRASE_IPA_MAP = {
    # 基本動詞
    "get": "ɡet",
    "go": "ɡoʊ",
    "come": "kʌm",
    "look": "lʊk",
    "listen": "ˈlɪsən",
    "wait": "weɪt",
    "talk": "tɔːk",
    "think": "θɪŋk",
    "take": "teɪk",
    "put": "pʊt",
    "turn": "tɜːrn",
    "pick": "pɪk",
    "give": "ɡɪv",
    "find": "faɪnd",
    "get": "ɡet",
    "run": "rʌn",
    "walk": "wɔːk",
    "sit": "sɪt",
    "stand": "stænd",
    "be": "biː",
    "do": "duː",
    "make": "meɪk",
    "have": "hæv",
    "see": "siː",
    "know": "noʊ",
    "say": "seɪ",
    "tell": "tel",
    "ask": "æsk",
    "call": "kɔːl",
    "feel": "fiːl",
    
    # 前置詞・副詞
    "up": "ʌp",
    "down": "daʊn",
    "in": "ɪn",
    "out": "aʊt",
    "on": "ɑːn",
    "off": "ɔːf",
    "to": "tuː",
    "at": "æt",
    "for": "fɔːr",
    "from": "frʌm",
    "about": "əˈbaʊt",
    "of": "ʌv",
    "with": "wɪð",
    "after": "ˈæftər",
    "before": "bɪˈfɔːr",
    "into": "ˈɪntuː",
    "by": "baɪ",
    "over": "ˈoʊvər",
    "under": "ˈʌndər",
    "near": "nɪr",
    "far": "fɑːr",
    "away": "əˈweɪ",
    "back": "bæk",
    "around": "əˈraʊnd",
    "across": "əˈkrɔːs",
    
    # 名詞
    "bed": "bed",
    "care": "ker",
    "school": "skuːl",
    "home": "hoʊm",
    "attention": "əˈtenʃən",
    "part": "pɑːrt",
    "time": "taɪm",
    "place": "pleɪs",
    "way": "weɪ",
    "hand": "hænd",
    "fun": "fʌn",
    "friends": "frendz",
    "mistake": "mɪˈsteɪk",
    "homework": "ˈhoʊmwɜːrk",
    "test": "test",
    "question": "ˈkwestʃən",
    "answer": "ˈænsər",
    "story": "ˈstɔːri",
    "book": "bʊk",
    "letter": "ˈletər",
    "sports": "spɔːrts",
    "piano": "piˈænoʊ",
    "shopping": "ˈʃɑːpɪŋ",
    "swimming": "ˈswɪmɪŋ",
    "fishing": "ˈfɪʃɪŋ",
    "walk": "wɔːk",
    "picture": "ˈpɪktʃər",
    "breakfast": "ˈbrekfəst",
    "lunch": "lʌntʃ",
    "dinner": "ˈdɪnər",
    "cold": "koʊld",
    "bath": "bæθ",
    "shower": "ˈʃaʊər",
    "music": "ˈmjuːzɪk",
    "lot": "lɑːt",
    
    # 形容詞・副詞
    "interested": "ˈɪntrəstɪd",
    "good": "ɡʊd",
    "long": "lɔːŋ",
    "same": "seɪm",
    "left": "left",
    "right": "raɪt",
    "ready": "ˈredi",
    "sick": "sɪk",
    "better": "ˈbetər",
    "healthy": "ˈhelθi",
    "proud": "praʊd",
    "famous": "ˈfeɪməs",
    "able": "ˈeɪbəl",
    "used": "juːzd",
    
    # 動詞
    "like": "laɪk",
    "play": "pleɪ",
    "read": "riːd",
    "write": "raɪt",
    "eat": "iːt",
    "catch": "kætʃ",
    "sleep": "sliːp",
    "wake": "weɪk",
    "brush": "brʌʃ",
    "stay": "steɪ",
    
    # 冠詞・助動詞
    "a": "ə",
    "an": "ən",
    "the": "ðə",
    "how": "haʊ",
    "would": "wʊd",
    
    # その他
    "hello": "həˈloʊ",
    "goodbye": "ɡʊdˈbaɪ",
    "teeth": "tiːθ",
}

# 統合辞書
ALL_PHRASE_IPA_MAP = {**PHRASE_IPA_MAP, **JUNIOR_HIGH_IPA_MAP}


def add_ipa_to_phrase(phrase, reading):
    """熟語の各単語にIPAを追加"""
    words = phrase.split()
    ipa_parts = []
    
    for word in words:
        # 小文字に変換して辞書検索
        word_lower = word.lower().rstrip('.,!?')
        
        if word_lower in ALL_PHRASE_IPA_MAP:
            ipa = ALL_PHRASE_IPA_MAP[word_lower]
            ipa_parts.append(ipa)
        else:
            # IPAが見つからない場合はスキップ（警告出力）
            print(f"  ⚠ '{word}' in '{phrase}': IPA辞書に未登録")
            return None
    
    # IPA形式: word1 word2,ipa1 (カタカナ1) ipa2 (カタカナ2)
    # 既存の読みを分解してIPAと組み合わせる
    reading_parts = reading.split()
    
    if len(ipa_parts) != len(reading_parts):
        print(f"  ⚠ '{phrase}': 単語数とカタカナ数が不一致")
        return None
    
    combined_parts = []
    for ipa, kata in zip(ipa_parts, reading_parts):
        combined_parts.append(f"{ipa} ({kata})")
    
    return ' '.join(combined_parts)


def process_phrases_csv(file_path):
    """熟語CSVファイルを処理"""
    print(f"\n処理中: {file_path}")
    
    # ファイル読み込み
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # ヘッダー保存
    header = lines[0]
    data_lines = lines[1:]
    
    # 処理カウンター
    updated = 0
    skipped = 0
    
    # 新しいデータ
    new_lines = [header]
    
    for line in data_lines:
        # CSV解析
        parts = line.strip().split(',', 6)
        
        if len(parts) < 2:
            new_lines.append(line)
            continue
        
        phrase = parts[0].strip()
        reading = parts[1].strip()
        
        # IPA記号が既に含まれているかチェック
        ipa_chars = "ˈəɑæɔɪʊɛʃŋɹɜːɡθðʌ"
        has_ipa = any(char in reading for char in ipa_chars)
        
        if not has_ipa:
            # IPAを追加
            new_reading = add_ipa_to_phrase(phrase, reading)
            
            if new_reading:
                parts[1] = new_reading
                new_line = ','.join(parts) + '\n'
                new_lines.append(new_line)
                updated += 1
                print(f"  ✓ {phrase}: {reading} → {new_reading}")
            else:
                new_lines.append(line)
                skipped += 1
        else:
            new_lines.append(line)
    
    # ファイル書き込み
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"\n結果: {updated}件追加, {skipped}件スキップ")
    return updated, skipped


def main():
    """メイン処理"""
    file_path = "public/data/vocabulary/junior-high-entrance-phrases.csv"
    
    try:
        updated, skipped = process_phrases_csv(file_path)
        print(f"\n=== 完了 ===")
        print(f"追加: {updated}件")
        print(f"スキップ: {skipped}件")
    except Exception as e:
        print(f"エラー: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
