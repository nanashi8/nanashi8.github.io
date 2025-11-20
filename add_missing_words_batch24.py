#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ24: 残りの単語（一般的な動詞・形容詞・名詞・副詞）
BATCH_WORDS = {
    "fool": {
        "word": "fool",
        "reading": "フール",
        "meaning": "愚か者・だます",
        "etymology": "ラテン語 follis（ふいご・空っぽの頭）",
        "relatedWords": ["foolish", "trick", "deceive", "silly"],
        "category": "名詞・動詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch24"
    },
    "leap": {
        "word": "leap",
        "reading": "リープ",
        "meaning": "跳ぶ・飛躍",
        "etymology": "古英語 hlēapan（跳ぶ）← ゲルマン祖語 *hlaupanan",
        "relatedWords": ["jump", "spring", "bound", "hop"],
        "category": "動詞・名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch24"
    },
    "loop": {
        "word": "loop",
        "reading": "ループ",
        "meaning": "輪・ループ",
        "etymology": "古ノルド語 hlaup（跳躍）",
        "relatedWords": ["circle", "ring", "cycle", "repeat"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Technology"],
        "source": "batch24"
    },
    "pace": {
        "word": "pace",
        "reading": "ペイス",
        "meaning": "ペース・速度",
        "etymology": "ラテン語 passus（歩み）← pandere（広げる）",
        "relatedWords": ["speed", "rate", "tempo", "rhythm"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Sports"],
        "source": "batch24"
    },
    "diary": {
        "word": "diary",
        "reading": "ダイアリー",
        "meaning": "日記",
        "etymology": "ラテン語 diarium（日当）← dies（日）",
        "relatedWords": ["journal", "notebook", "record", "log"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Daily Life"],
        "source": "batch24"
    },
    "filter": {
        "word": "filter",
        "reading": "フィルター",
        "meaning": "フィルター・濾過する",
        "etymology": "フランス語 filtre ← ラテン語 filtrum（フェルト）",
        "relatedWords": ["screen", "strain", "purify", "sift"],
        "category": "名詞・動詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Science"],
        "source": "batch24"
    },
    "profile": {
        "word": "profile",
        "reading": "プロフィール",
        "meaning": "輪郭・プロフィール",
        "etymology": "イタリア語 profilo（輪郭）← pro-（前）+ filum（糸）",
        "relatedWords": ["outline", "description", "biography", "portrait"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch24"
    },
    "portfolio": {
        "word": "portfolio",
        "reading": "ポートフォリオ",
        "meaning": "作品集・資産構成",
        "etymology": "イタリア語 portafoglio ← portare（運ぶ）+ foglio（紙）",
        "relatedWords": ["collection", "folder", "investment", "assets"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Business"],
        "source": "batch24"
    },
    "dairy": {
        "word": "dairy",
        "reading": "デアリー",
        "meaning": "酪農・乳製品",
        "etymology": "中英語 deyerie（乳製品工場）← dey（乳搾り女）",
        "relatedWords": ["milk", "cheese", "butter", "cream"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Food"],
        "source": "batch24"
    },
    "soccer": {
        "word": "soccer",
        "reading": "サッカー",
        "meaning": "サッカー",
        "etymology": "association football の短縮形",
        "relatedWords": ["football", "sport", "game", "team"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Sports"],
        "source": "batch24"
    },
    "volleyball": {
        "word": "volleyball",
        "reading": "バレーボール",
        "meaning": "バレーボール",
        "etymology": "volley（一斉射撃）+ ball（ボール）",
        "relatedWords": ["sport", "team", "net", "game"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Sports"],
        "source": "batch24"
    },
    "olive": {
        "word": "olive",
        "reading": "オリーヴ",
        "meaning": "オリーブ",
        "etymology": "ラテン語 oliva ← ギリシャ語 elaia",
        "relatedWords": ["oil", "tree", "fruit", "Mediterranean"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Food"],
        "source": "batch24"
    },
    "carrots": {
        "word": "carrots",
        "reading": "キャロッツ",
        "meaning": "にんじん（carrotの複数形）",
        "etymology": "carrot（にんじん）+ -s（複数）← ギリシャ語 karoton",
        "relatedWords": ["carrot", "vegetable", "orange", "root"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Food"],
        "source": "batch24"
    },
    "spinach": {
        "word": "spinach",
        "reading": "スピニッチ",
        "meaning": "ほうれん草",
        "etymology": "古フランス語 espinache ← アラビア語 isbanakh",
        "relatedWords": ["vegetable", "green", "leaf", "healthy"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Food"],
        "source": "batch24"
    },
    "caffeine": {
        "word": "caffeine",
        "reading": "カフェイン",
        "meaning": "カフェイン",
        "etymology": "ドイツ語 Kaffein ← フランス語 café（コーヒー）",
        "relatedWords": ["coffee", "tea", "stimulant", "energy"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Health"],
        "source": "batch24"
    },
    "thirteen": {
        "word": "thirteen",
        "reading": "サーティーン",
        "meaning": "13・13の",
        "etymology": "古英語 þrēotīene ← three（3）+ ten（10）",
        "relatedWords": ["number", "teen", "twelve", "fourteen"],
        "category": "数詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Numbers"],
        "source": "batch24"
    },
    "thirty": {
        "word": "thirty",
        "reading": "サーティ",
        "meaning": "30・30の",
        "etymology": "古英語 þrītig ← three（3）+ -tig（10の倍数）",
        "relatedWords": ["number", "twenty", "forty", "age"],
        "category": "数詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Numbers"],
        "source": "batch24"
    },
    "warmer": {
        "word": "warmer",
        "reading": "ウォーマー",
        "meaning": "より暖かい（warmの比較級）",
        "etymology": "warm（暖かい）+ -er（比較級）",
        "relatedWords": ["warm", "hot", "temperature", "heat"],
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Weather"],
        "source": "batch24"
    },
    "warming": {
        "word": "warming",
        "reading": "ウォーミング",
        "meaning": "温暖化・暖めること",
        "etymology": "warm（暖かくする）+ -ing（名詞・現在分詞）",
        "relatedWords": ["warm", "heating", "climate", "global"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Environment"],
        "source": "batch24"
    },
    "unclear": {
        "word": "unclear",
        "reading": "アンクリア",
        "meaning": "不明確な・はっきりしない",
        "etymology": "un-（否定）+ clear（明確な）",
        "relatedWords": ["clear", "vague", "ambiguous", "uncertain"],
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch24"
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
    print("長文読解辞書 単語追加スクリプト（バッチ24）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ24の単語を追加
    print(f"📝 バッチ24: 残りの単語（一般的な動詞・形容詞・名詞・副詞）（{len(BATCH_WORDS)}個）を追加中...")
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
