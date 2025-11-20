#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ16: 動詞の過去形・派生語・複数形など
BATCH_WORDS = {
    "seen": {
        "word": "seen",
        "reading": "スィーン",
        "meaning": "見た（seeの過去分詞）",
        "etymology": "古英語 sewen（seeの過去分詞）← ゲルマン祖語 *sehwanaz",
        "relatedWords": ["see", "saw", "look", "watch"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Daily Life"],
        "source": "batch16"
    },
    "drove": {
        "word": "drove",
        "reading": "ドロウヴ",
        "meaning": "運転した（driveの過去形）",
        "etymology": "古英語 drāf（driveの過去形）← ゲルマン祖語 *draibijaną",
        "relatedWords": ["drive", "driven", "car", "ride"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Transportation"],
        "source": "batch16"
    },
    "spoke": {
        "word": "spoke",
        "reading": "スポウク",
        "meaning": "話した（speakの過去形）",
        "etymology": "古英語 spræc（speakの過去形）← ゲルマン祖語 *sprekanan",
        "relatedWords": ["speak", "spoken", "talk", "say"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Communication"],
        "source": "batch16"
    },
    "wrote": {
        "word": "wrote",
        "reading": "ロウト",
        "meaning": "書いた（writeの過去形）",
        "etymology": "古英語 wrāt（writeの過去形）← ゲルマン祖語 *writaną",
        "relatedWords": ["write", "written", "pen", "compose"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Education"],
        "source": "batch16"
    },
    "paid": {
        "word": "paid",
        "reading": "ペイド",
        "meaning": "支払った（payの過去形・過去分詞）",
        "etymology": "ラテン語 pacare（平和にする・支払う）← pax（平和）",
        "relatedWords": ["pay", "payment", "money", "cost"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Economics"],
        "source": "batch16"
    },
    "week": {
        "word": "week",
        "reading": "ウィーク",
        "meaning": "週・1週間",
        "etymology": "古英語 wice ← ゲルマン祖語 *wikōn",
        "relatedWords": ["day", "month", "weekend", "weekly"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Time"],
        "source": "batch16"
    },
    "direction": {
        "word": "direction",
        "reading": "ディレクション",
        "meaning": "方向・指示",
        "etymology": "ラテン語 directio（まっすぐにすること）← dirigere（導く）",
        "relatedWords": ["guide", "way", "path", "route"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Geography"],
        "source": "batch16"
    },
    "everywhere": {
        "word": "everywhere",
        "reading": "エヴリウェア",
        "meaning": "どこでも・至る所に",
        "etymology": "every（すべて）+ where（どこ）",
        "relatedWords": ["anywhere", "somewhere", "nowhere", "all"],
        "category": "副詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Geography"],
        "source": "batch16"
    },
    "further": {
        "word": "further",
        "reading": "ファーザー",
        "meaning": "さらに・より遠くへ",
        "etymology": "古英語 furþor（farの比較級）← ゲルマン祖語 *furthera",
        "relatedWords": ["far", "more", "additional", "beyond"],
        "category": "副詞・形容詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch16"
    },
    "worse": {
        "word": "worse",
        "reading": "ワース",
        "meaning": "より悪い（badの比較級）",
        "etymology": "古英語 wiersa ← ゲルマン祖語 *wersizô",
        "relatedWords": ["bad", "worst", "better", "poor"],
        "category": "形容詞・副詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Comparison"],
        "source": "batch16"
    },
    "businesses": {
        "word": "businesses",
        "reading": "ビジネシズ",
        "meaning": "事業・企業（businessの複数形）",
        "etymology": "business（事業）+ -es（複数形）",
        "relatedWords": ["business", "company", "trade", "enterprise"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Economics"],
        "source": "batch16"
    },
    "workers": {
        "word": "workers",
        "reading": "ワーカーズ",
        "meaning": "労働者・作業員（workerの複数形）",
        "etymology": "work（働く）+ -er（する人）+ -s（複数形）",
        "relatedWords": ["work", "employee", "labor", "staff"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Social Studies"],
        "source": "batch16"
    },
    "films": {
        "word": "films",
        "reading": "フィルムズ",
        "meaning": "映画・フィルム（filmの複数形）",
        "etymology": "film（フィルム）+ -s（複数形）← 古英語 filmen（薄い皮）",
        "relatedWords": ["film", "movie", "cinema", "video"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Arts"],
        "source": "batch16"
    },
    "hobbies": {
        "word": "hobbies",
        "reading": "ホビーズ",
        "meaning": "趣味（hobbyの複数形）",
        "etymology": "hobby（趣味）+ -es（複数形）",
        "relatedWords": ["hobby", "interest", "pastime", "activity"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Daily Life"],
        "source": "batch16"
    },
    "trips": {
        "word": "trips",
        "reading": "トリップス",
        "meaning": "旅行・小旅行（tripの複数形）",
        "etymology": "trip（旅行）+ -s（複数形）",
        "relatedWords": ["trip", "travel", "journey", "tour"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Travel"],
        "source": "batch16"
    },
    "visitors": {
        "word": "visitors",
        "reading": "ヴィジターズ",
        "meaning": "訪問者・来客（visitorの複数形）",
        "etymology": "visit（訪問する）+ -or（する人）+ -s（複数形）",
        "relatedWords": ["visit", "guest", "tourist", "caller"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Tourism"],
        "source": "batch16"
    },
    "counts": {
        "word": "counts",
        "reading": "カウンツ",
        "meaning": "数える・重要である（countの三人称単数形）",
        "etymology": "count（数える）+ -s（三人称単数）",
        "relatedWords": ["count", "number", "matter", "total"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Mathematics"],
        "source": "batch16"
    },
    "lets": {
        "word": "lets",
        "reading": "レッツ",
        "meaning": "させる（letの三人称単数形）",
        "etymology": "let（させる）+ -s（三人称単数）",
        "relatedWords": ["let", "allow", "permit", "enable"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Grammar"],
        "source": "batch16"
    },
    "wins": {
        "word": "wins",
        "reading": "ウィンズ",
        "meaning": "勝つ（winの三人称単数形）・勝利",
        "etymology": "win（勝つ）+ -s（三人称単数）",
        "relatedWords": ["win", "victory", "succeed", "beat"],
        "category": "動詞・名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Sports"],
        "source": "batch16"
    },
    "vs": {
        "word": "vs",
        "reading": "ヴァーサス",
        "meaning": "対（versusの略）",
        "etymology": "ラテン語 versus（〜に向かって）← vertere（向ける）",
        "relatedWords": ["versus", "against", "compare", "oppose"],
        "category": "前置詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Sports", "Comparison"],
        "source": "batch16"
    }
}

def load_dictionary():
    """既存の辞書を読み込む"""
    try:
        with open('public/data/reading-passages-dictionary.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠ 辞書ファイルが見つかりません")
        return {}

def save_dictionary(dictionary):
    """辞書を保存"""
    with open('public/data/reading-passages-dictionary.json', 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)

def main():
    print("=" * 60)
    print("長文読解辞書 単語追加スクリプト（バッチ16）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ16の単語を追加
    print(f"📝 バッチ16: 動詞の過去形・派生語・複数形など（{len(BATCH_WORDS)}個）を追加中...")
    added_count = 0
    skipped_count = 0
    
    for word, data in BATCH_WORDS.items():
        if word in dictionary:
            print(f"  - {word} は既に存在します")
            skipped_count += 1
        else:
            dictionary[word] = data
            print(f"  ✓ {word}: {data['meaning']}")
            added_count += 1
    
    # 保存
    save_dictionary(dictionary)
    print(f"✓ public/data/reading-passages-dictionary.json を保存しました")
    print()
    
    # 結果を表示
    new_count = len(dictionary)
    print(f"✅ {added_count}個の単語を辞書に追加しました")
    print(f"   スキップ: {skipped_count}個")
    print(f"   新しい単語数: {new_count} (元: {original_count})")
    print()
    print("=" * 60)
    print("完了")
    print("=" * 60)

if __name__ == "__main__":
    main()
