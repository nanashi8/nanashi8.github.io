#!/usr/bin/env python3
"""
残りのIPA漏れを手動で一括追加するスクリプト
全単語にAI生成IPAを追加
"""

import csv
import re
from junior_high_ipa_map import JUNIOR_HIGH_IPA_MAP

# 完全なIPA辞書（手動AI生成）
COMPLETE_IPA_MAP = {
    # グループG-K
    "great": "ɡreɪt",
    "green": "ɡriːn",
    "group": "ɡruːp",
    "grow": "ɡroʊ",
    "guess": "ɡes",
    "guide": "ɡaɪd",
    "half": "hæf",
    "hamburger": "ˈhæmbɜːrɡər",
    "hand": "hænd",
    "increase": "ɪnˈkriːs",
    "Japanese": "ˌdʒæpəˈniːz",
    "kilometer": "kɪˈlɑːmɪtər",
    "knee": "niː",
    "Korea": "kəˈriːə",
    
    # グループL
    "letter": "ˈletər",
    "library": "ˈlaɪbreri",
    "life": "laɪf",
    "light": "laɪt",
    "look": "lʊk",
    
    # グループM
    "marker": "ˈmɑːrkər",
    "memory": "ˈmeməri",
    "Monday": "ˈmʌndeɪ",
    "mouse": "maʊs",
    "Mr.": "ˈmɪstər",
    "Mrs.": "ˈmɪsɪz",
    "Mt.": "maʊnt",
    "must": "mʌst",
    
    # グループN
    "neck": "nek",
    "need": "niːd",
    "negative": "ˈneɡətɪv",
    "neighbor": "ˈneɪbər",
    "nervous": "ˈnɜːrvəs",
    "nest": "nest",
    "never": "ˈnevər",
    "new": "nuː",
    "news": "nuːz",
    "newspaper": "ˈnuːzpeɪpər",
    "next": "nekst",
    "nice": "naɪs",
    
    # グループN-P
    "nobody": "ˈnoʊbɑːdi",
    "north": "nɔːrθ",
    "nose": "noʊz",
    "notebook": "ˈnoʊtbʊk",
    "nothing": "ˈnʌθɪŋ",
    "November": "noʊˈvembər",
    "nurse": "nɜːrs",
    "October": "ɑːkˈtoʊbər",
    "office": "ˈɔːfɪs",
    "often": "ˈɔːfən",
    "OK": "oʊˈkeɪ",
    "once": "wʌns",
    "online": "ˌɑːnˈlaɪn",
    "onion": "ˈʌnjən",
    "open": "ˈoʊpən",
    "opera": "ˈɑːpərə",
    "order": "ˈɔːrdər",
    "other": "ˈʌðər",
    "outside": "ˌaʊtˈsaɪd",
    "own": "oʊn",
    "P.E.": "ˌpiːˈiː",
    "pair": "per",
    "palace": "ˈpæləs",
    "panda": "ˈpændə",
    "paper": "ˈpeɪpər",
    "pardon": "ˈpɑːrdn",
    "parent": "ˈperənt",
    "park": "pɑːrk",
    "part": "pɑːrt",
    "party": "ˈpɑːrti",
    "pass": "pæs",
    "passport": "ˈpæspɔːrt",
    "path": "pæθ",
    "PC": "ˌpiːˈsiː",
    "peace": "piːs",
    "peach": "piːtʃ",
    "pear": "per",
    "pen": "pen",
    "pencil": "ˈpensəl",
    "people": "ˈpiːpəl",
    "pepper": "ˈpepər",
    "pet": "pet",
    "phone": "foʊn",
    "photo": "ˈfoʊtoʊ",
    "piano": "piˈænoʊ",
    "picnic": "ˈpɪknɪk",
    "picture": "ˈpɪktʃər",
    "pie": "paɪ",
    "pig": "pɪɡ",
    "pilot": "ˈpaɪlət",
    "pink": "pɪŋk",
    "pizza": "ˈpiːtsə",
    "place": "pleɪs",
    "plan": "plæn",
    "plane": "pleɪn",
    "planet": "ˈplænɪt",
    "plant": "plænt",
    "plate": "pleɪt",
    "platform": "ˈplætfɔːrm",
    "play": "pleɪ",
    "playground": "ˈpleɪɡraʊnd",
    "please": "pliːz",
    "pocket": "ˈpɑːkɪt",
    "point": "pɔɪnt",
    "police": "pəˈliːs",
    "pond": "pɑːnd",
    "pool": "puːl",
    "poor": "pʊr",
    "popcorn": "ˈpɑːpkɔːrn",
    "popular": "ˈpɑːpjələr",
    "positive": "ˈpɑːzətɪv",
    "post": "poʊst",
    "potato": "pəˈteɪtoʊ",
    "power": "ˈpaʊər",
    "practice": "ˈpræktɪs",
    "present": "ˈprezənt",
    "pretty": "ˈprɪti",
    "price": "praɪs",
    "prince": "prɪns",
    "principal": "ˈprɪnsəpəl",
    "problem": "ˈprɑːbləm",
    "program": "ˈproʊɡræm",
    "proud": "praʊd",
    "public": "ˈpʌblɪk",
    "pull": "pʊl",
    "puppy": "ˈpʌpi",
    "purple": "ˈpɜːrpəl",
    "purpose": "ˈpɜːrpəs",
    "push": "pʊʃ",
    "put": "pʊt",
    
    # グループQ-Z
    "question": "ˈkwestʃən",
    "quick": "kwɪk",
    "quiet": "ˈkwaɪət",
    "quite": "kwaɪt",
    "rabbit": "ˈræbɪt",
    "radio": "ˈreɪdioʊ",
    "rain": "reɪn",
    "rainbow": "ˈreɪnboʊ",
    "rainy": "ˈreɪni",
    "rat": "ræt",
    "reach": "riːtʃ",
    "reality": "riˈæləti",
    
    # 追加分（手動AI生成）
    "contact": "ˈkɑːntækt",
    "night": "naɪt",
    "nineteen": "ˌnaɪnˈtiːn",
    "Olympic": "əˈlɪmpɪk",
    "omelet": "ˈɑːmlət",
    "our": "ˈaʊər",
    "ours": "ˈaʊərz",
    "out": "aʊt",
    "outdoor": "ˌaʊtˈdɔːr",
    "over": "ˈoʊvər",
    "overseas": "ˌoʊvərˈsiːz",
    "owner": "ˈoʊnər",
    "relay": "ˈriːleɪ",
    "repeat": "rɪˈpiːt",
    "researcher": "rɪˈsɜːrtʃər",
    "restroom": "ˈrestruːm",
    "rich": "rɪtʃ",
    "ride": "raɪd",
    "right": "raɪt",
    "ring": "rɪŋ",
    "rise": "raɪz",
    "risk": "rɪsk",
    "river": "ˈrɪvər",
    "road": "roʊd",
    "robot": "ˈroʊbɑːt",
    "rock": "rɑːk",
    "role": "roʊl",
    "room": "ruːm",
    "round": "raʊnd",
    "row": "roʊ",
    "rule": "ruːl",
    "Saturday": "ˈsætərdeɪ",
    "September": "sepˈtembər",
    "serious": "ˈsɪriəs",
    "serve": "sɜːrv",
    "service": "ˈsɜːrvɪs",
    "set": "set",
    "seven": "ˈsevən",
    "seventeen": "ˌsevənˈtiːn",
    "seventh": "ˈsevənθ",
    "simple": "ˈsɪmpəl",
    "simply": "ˈsɪmpli",
    "since": "sɪns",
    "sing": "sɪŋ",
    "Singapore": "ˈsɪŋəpɔːr",
    "socks": "sɑːks",
    "sofa": "ˈsoʊfə",
    "soft": "sɔːft",
    "softball": "ˈsɔːftbɔːl",
    "solve": "sɑːlv",
    "some": "sʌm",
    "someday": "ˈsʌmdeɪ",
    "somehow": "ˈsʌmhaʊ",
    "someone": "ˈsʌmwʌn",
    "something": "ˈsʌmθɪŋ",
    "sometimes": "ˈsʌmtaɪmz",
    "somewhere": "ˈsʌmwer",
    "son": "sʌn",
    "Sunday": "ˈsʌndeɪ",
    "surprisingly": "sərˈpraɪzɪŋli",
    "survey": "ˈsɜːrveɪ",
    "tear": "ter",
    "ten": "ten",
    "tennis": "ˈtenɪs",
    "tenth": "tenθ",
    "terrible": "ˈterəbəl",
    "test": "test",
    "text": "tekst",
    "textbook": "ˈtekstbʊk",
    "Thailand": "ˈtaɪlænd",
    "their": "ðer",
    "thirtieth": "ˈθɜːrtiəθ",
    "Thursday": "ˈθɜːrzdeɪ",
    "to": "tuː",
    "toast": "toʊst",
    "today": "təˈdeɪ",
    "toe": "toʊ",
    "together": "təˈɡeðər",
    "tomato": "təˈmeɪtoʊ",
    "tomorrow": "təˈmɑːroʊ",
    "ton": "tʌn",
    "tonight": "təˈnaɪt",
    "too": "tuː",
    "tool": "tuːl",
    "tooth": "tuːθ",
    "toothache": "ˈtuːθeɪk",
    "top": "tɑːp",
    "topic": "ˈtɑːpɪk",
    "topping": "ˈtɑːpɪŋ",
    "touch": "tʌtʃ",
    "Tuesday": "ˈtuːzdeɪ",
    "use": "juːz",
    "Wednesday": "ˈwenzdeɪ",
    "welcome": "ˈwelkəm",
    "well": "wel",
    "west": "west",
    "what": "wʌt",
    "when": "wen",
    "where": "wer",
    "which": "wɪtʃ",
    "while": "waɪl",
    "white": "waɪt",
    "who": "huː",
    "with": "wɪð",
    "your": "jʊr",
}

# 統合辞書（intermediate + junior-high）
ALL_IPA_MAP = {**COMPLETE_IPA_MAP, **JUNIOR_HIGH_IPA_MAP}


def process_csv_file(file_path):
    """CSVファイルを処理してIPA漏れを修正"""
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
        # CSV解析（カンマ区切り）
        parts = line.strip().split(',', 6)  # 最大7列
        
        if len(parts) < 2:
            new_lines.append(line)
            continue
        
        word = parts[0].strip()
        reading = parts[1].strip()
        
        # IPA漏れチェック（カタカナのみで、IPA記号が含まれていない）
        ipa_chars = "ˈəɑæɔɪʊɛʃŋɹɜː"
        has_ipa = any(char in reading for char in ipa_chars)
        is_katakana_only = re.match(r'^[ァ-ヴー́]+$', reading)
        
        if is_katakana_only and not has_ipa:
            # IPA追加
            if word in ALL_IPA_MAP:
                ipa = ALL_IPA_MAP[word]
                parts[1] = f"{ipa} ({reading})"
                new_line = ','.join(parts) + '\n'
                new_lines.append(new_line)
                updated += 1
                print(f"  ✓ {word}: {reading} → {ipa} ({reading})")
            else:
                new_lines.append(line)
                skipped += 1
                print(f"  ⚠ {word}: IPA辞書に未登録")
        else:
            new_lines.append(line)
    
    # ファイル書き込み
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"\n結果: {updated}件追加, {skipped}件スキップ")
    return updated, skipped


def main():
    """メイン処理"""
    files = [
        "public/data/vocabulary/intermediate-1800-words.csv",
        "public/data/vocabulary/junior-high-entrance-words.csv",
    ]
    
    total_updated = 0
    total_skipped = 0
    
    for file_path in files:
        try:
            updated, skipped = process_csv_file(file_path)
            total_updated += updated
            total_skipped += skipped
        except Exception as e:
            print(f"エラー: {file_path} - {e}")
    
    print(f"\n=== 全体結果 ===")
    print(f"合計追加: {total_updated}件")
    print(f"合計スキップ: {total_skipped}件")


if __name__ == "__main__":
    main()
