#!/usr/bin/env python3
"""
不足している単語を長文読解辞書に追加する
"""
import json

# 追加する単語とその意味
additional_words = {
    "afternoon": {"word": "afternoon", "meaning": "午後", "reading": "アフタヌーン"},
    "arrived": {"word": "arrived", "meaning": "到着した（過去形）", "reading": "アライヴド", "baseWord": "arrive"},
    "bed": {"word": "bed", "meaning": "ベッド・寝床", "reading": "ベッド"},
    "bread": {"word": "bread", "meaning": "パン", "reading": "ブレッド"},
    "breakfast": {"word": "breakfast", "meaning": "朝食", "reading": "ブレックファスト"},
    "course": {"word": "course", "meaning": "コース・過程", "reading": "コース"},
    "cups": {"word": "cups", "meaning": "カップ（複数形）", "reading": "カップス", "baseWord": "cup"},
    "dinner": {"word": "dinner", "meaning": "夕食", "reading": "ディナー"},
    "eggs": {"word": "eggs", "meaning": "卵（複数形）", "reading": "エッグズ", "baseWord": "egg"},
    "first": {"word": "First", "meaning": "最初に・まず", "reading": "ファースト"},
    "future": {"word": "future", "meaning": "未来・将来", "reading": "フューチャー"},
    "hobbies": {"word": "hobbies", "meaning": "趣味（複数形）", "reading": "ホビーズ", "baseWord": "hobby"},
    "mom": {"word": "Mom", "meaning": "お母さん", "reading": "マム"},
    "month": {"word": "month", "meaning": "月・1ヶ月", "reading": "マンス"},
    "morning": {"word": "morning", "meaning": "朝・午前", "reading": "モーニング"},
    "next": {"word": "Next", "meaning": "次に・その次", "reading": "ネクスト"},
    "noon": {"word": "noon", "meaning": "正午・昼", "reading": "ヌーン"},
    "others": {"word": "others'", "meaning": "他の人たちの", "reading": "アザーズ", "baseWord": "other"},
    "plates": {"word": "plates", "meaning": "皿（複数形）", "reading": "プレイツ", "baseWord": "plate"},
    "soon": {"word": "Soon", "meaning": "すぐに・まもなく", "reading": "スーン"},
    "today": {"word": "today", "meaning": "今日", "reading": "トゥデイ"},
    "weekends": {"word": "weekends", "meaning": "週末（複数形）", "reading": "ウィークエンズ", "baseWord": "weekend"},
    "year": {"word": "year", "meaning": "年", "reading": "イヤー"},
    "you": {"word": "you", "meaning": "あなた・あなたたち", "reading": "ユー"}
}

# 長文読解辞書を読み込み
try:
    with open('public/data/reading-passages-dictionary.json', 'r', encoding='utf-8') as f:
        reading_dict = json.load(f)
except FileNotFoundError:
    reading_dict = {}

# 新しい単語を追加
added_count = 0
for word_lower, word_info in additional_words.items():
    if word_lower not in reading_dict:
        reading_dict[word_lower] = {
            "word": word_info["word"],
            "reading": word_info.get("reading", ""),
            "meaning": word_info["meaning"],
            "etymology": "",
            "relatedWords": "",
            "category": "basic",
            "difficulty": "beginner",
            "source": "manual_addition",
            "baseWord": word_info.get("baseWord", "")
        }
        added_count += 1
        print(f"追加: {word_info['word']} - {word_info['meaning']}")

# 保存
with open('public/data/reading-passages-dictionary.json', 'w', encoding='utf-8') as f:
    json.dump(reading_dict, f, ensure_ascii=False, indent=2)

print(f"\n合計 {added_count} 語を追加しました")
print(f"現在の辞書サイズ: {len(reading_dict)} 語")
