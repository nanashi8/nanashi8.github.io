import json

# 長文読解辞書を読み込み
with open('public/data/reading-passages-dictionary.json', 'r', encoding='utf-8') as f:
    dictionary = json.load(f)

# 追加する所有格の単語
possessive_words = {
    "didn't": {
        "word": "didn't",
        "reading": "ディドゥントゥ",
        "meaning": "しなかった（did notの短縮形）",
        "etymology": "did not の短縮形",
        "relatedWords": "did not, do not, don't",
        "category": "言語基本",
        "difficulty": "初級",
        "levels": ["beginner"],
        "passages": ["beginner-1"],
        "source": "auto-generated",
        "baseWord": "did not"
    },
    "earth's": {
        "word": "Earth's",
        "reading": "アースズ",
        "meaning": "地球の（所有格）",
        "etymology": "Earth + 's（所有格）",
        "relatedWords": "Earth, planet, world",
        "category": "自然・環境",
        "difficulty": "中級",
        "levels": ["intermediate"],
        "passages": ["intermediate-1"],
        "source": "auto-generated",
        "baseWord": "Earth"
    },
    "everyone's": {
        "word": "everyone's",
        "reading": "エヴリワンズ",
        "meaning": "みんなの（所有格）",
        "etymology": "everyone + 's（所有格）",
        "relatedWords": "everyone, everybody, all",
        "category": "人・社会",
        "difficulty": "初級",
        "levels": ["beginner", "intermediate"],
        "passages": ["intermediate-1"],
        "source": "auto-generated",
        "baseWord": "everyone"
    },
    "life's": {
        "word": "life's",
        "reading": "ライフス",
        "meaning": "人生の、生命の（所有格）",
        "etymology": "life + 's（所有格）",
        "relatedWords": "life, living, existence",
        "category": "人・社会",
        "difficulty": "中級",
        "levels": ["advanced"],
        "passages": [],
        "source": "auto-generated",
        "baseWord": "life"
    },
    "tomorrow's": {
        "word": "tomorrow's",
        "reading": "トゥモローズ",
        "meaning": "明日の、未来の（所有格）",
        "etymology": "tomorrow + 's（所有格）",
        "relatedWords": "tomorrow, future, next day",
        "category": "時間・数量",
        "difficulty": "初級",
        "levels": ["beginner", "intermediate"],
        "passages": [],
        "source": "auto-generated",
        "baseWord": "tomorrow"
    }
}

# 辞書に追加
for word_lower, word_info in possessive_words.items():
    dictionary[word_lower] = word_info

# 保存
with open('public/data/reading-passages-dictionary.json', 'w', encoding='utf-8') as f:
    json.dump(dictionary, f, ensure_ascii=False, indent=2)

print(f"Added {len(possessive_words)} possessive words to reading dictionary")
print(f"Total words in dictionary: {len(dictionary)}")
