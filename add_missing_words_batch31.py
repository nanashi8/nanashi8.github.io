#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ31）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ31: 動詞派生形・名詞・形容詞
BATCH_WORDS = {
    "centralizing": {
        "word": "centralizing",
        "reading": "セントラライジング",
        "meaning": "中央集権化すること（centralizeの現在分詞）",
        "etymology": "central（中央の）+ -ize（動詞化）+ -ing",
        "relatedWords": ["consolidating", "concentrating", "unifying"],
        "category": "動詞派生",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "imported": {
        "word": "imported",
        "reading": "インポーテッド",
        "meaning": "輸入された（importの過去分詞）",
        "etymology": "import（輸入する）+ -ed",
        "relatedWords": ["foreign", "international", "external"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "outsourced": {
        "word": "outsourced",
        "reading": "アウトソースト",
        "meaning": "外部委託された（outsourceの過去分詞）",
        "etymology": "out（外）+ source（源）+ -ed",
        "relatedWords": ["contracted", "delegated", "subcontracted"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "overcame": {
        "word": "overcame",
        "reading": "オーバーケイム",
        "meaning": "克服した（overcomeの過去形）",
        "etymology": "over（越えて）+ came（来た）",
        "relatedWords": ["conquered", "defeated", "surmounted"],
        "category": "動詞過去形",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "pollinated": {
        "word": "pollinate",
        "reading": "ポリネート",
        "meaning": "受粉する・受粉させる",
        "etymology": "pollen（花粉）+ -ate（動詞化接尾辞）",
        "relatedWords": ["fertilize", "cross-pollinate", "pollination"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "polluted": {
        "word": "polluted",
        "reading": "ポルーテッド",
        "meaning": "汚染された（polluteの過去分詞）",
        "etymology": "pollute（汚染する）+ -ed",
        "relatedWords": ["contaminated", "dirty", "tainted"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "treated": {
        "word": "treated",
        "reading": "トリーテッド",
        "meaning": "処理された・扱われた（treatの過去分詞）",
        "etymology": "treat（扱う）+ -ed",
        "relatedWords": ["processed", "handled", "managed"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "updated": {
        "word": "updated",
        "reading": "アップデーテッド",
        "meaning": "更新された（updateの過去分詞）",
        "etymology": "update（更新する）+ -ed",
        "relatedWords": ["revised", "modernized", "renewed"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "cuisine": {
        "word": "cuisine",
        "reading": "キュイジーン",
        "meaning": "料理・料理法",
        "etymology": "フランス語 cuisine（料理）",
        "relatedWords": ["cooking", "gastronomy", "culinary"],
        "category": "食・文化",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "cuisines": {
        "word": "cuisines",
        "reading": "キュイジーン",
        "meaning": "料理・料理法（cuisineの複数形）",
        "etymology": "cuisine の複数形",
        "relatedWords": ["cooking styles", "food traditions", "culinary arts"],
        "category": "食・文化",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "impression": {
        "word": "impression",
        "reading": "インプレッション",
        "meaning": "印象・感想",
        "etymology": "impress（印象づける）+ -ion（行為・結果）",
        "relatedWords": ["perception", "feeling", "sense"],
        "category": "心理・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "incident": {
        "word": "incident",
        "reading": "インシデント",
        "meaning": "出来事・事件",
        "etymology": "ラテン語 incidere（起こる）",
        "relatedWords": ["event", "occurrence", "happening"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "resume": {
        "word": "resume",
        "reading": "リジューム",
        "meaning": "再開する・履歴書",
        "etymology": "ラテン語 resumere（再び取る）",
        "relatedWords": ["continue", "restart", "CV"],
        "category": "動詞・名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "reverse": {
        "word": "reverse",
        "reading": "リバース",
        "meaning": "逆・反対・逆転させる",
        "etymology": "ラテン語 reversus（向きを変えた）",
        "relatedWords": ["opposite", "invert", "backward"],
        "category": "名詞・動詞・形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "showcase": {
        "word": "showcase",
        "reading": "ショーケース",
        "meaning": "陳列ケース・披露する",
        "etymology": "show（見せる）+ case（ケース）",
        "relatedWords": ["display", "exhibit", "present"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "tourism": {
        "word": "tourism",
        "reading": "ツーリズム",
        "meaning": "観光業・観光",
        "etymology": "tour（旅行）+ -ism（行為・制度）",
        "relatedWords": ["travel", "sightseeing", "hospitality"],
        "category": "産業・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "tourists": {
        "word": "tourists",
        "reading": "ツーリスト",
        "meaning": "観光客（touristの複数形）",
        "etymology": "tourist（観光客）の複数形",
        "relatedWords": ["travelers", "visitors", "vacationers"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "wellbeing": {
        "word": "wellbeing",
        "reading": "ウェルビーイング",
        "meaning": "幸福・健康",
        "etymology": "well（良く）+ being（存在）",
        "relatedWords": ["wellness", "health", "happiness"],
        "category": "健康・心理",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "worldview": {
        "word": "worldview",
        "reading": "ワールドビュー",
        "meaning": "世界観",
        "etymology": "world（世界）+ view（見方）",
        "relatedWords": ["perspective", "outlook", "philosophy"],
        "category": "思想・哲学",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch31"
    },
    "worldviews": {
        "word": "worldviews",
        "reading": "ワールドビュー",
        "meaning": "世界観（worldviewの複数形）",
        "etymology": "worldview の複数形",
        "relatedWords": ["perspectives", "philosophies", "beliefs"],
        "category": "思想・哲学",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch31"
    }
}

def load_dictionary():
    """辞書ファイルを読み込む"""
    dict_path = "public/data/reading-passages-dictionary.json"
    try:
        with open(dict_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ エラー: {dict_path} が見つかりません")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSONデコードエラー: {e}")
        return None

def save_dictionary(dictionary):
    """辞書ファイルを保存する"""
    dict_path = "public/data/reading-passages-dictionary.json"
    try:
        with open(dict_path, 'w', encoding='utf-8') as f:
            json.dump(dictionary, f, ensure_ascii=False, indent=2)
        print(f"✓ {dict_path} を保存しました")
        return True
    except Exception as e:
        print(f"❌ 保存エラー: {e}")
        return False

def main():
    print("=" * 60)
    print("長文読解辞書 単語追加スクリプト（バッチ31）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print(f"📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    if dictionary is None:
        return
    
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ31の単語を追加
    print(f"📝 バッチ31: 動詞派生形・名詞・形容詞（{len(BATCH_WORDS)}個）を追加中...")
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
    
    # 辞書を保存
    if added_count > 0:
        if save_dictionary(dictionary):
            print()
            print(f"✅ {added_count}個の単語を辞書に追加しました")
            if skipped_count > 0:
                print(f"   スキップ: {skipped_count}個")
            print(f"   新しい単語数: {len(dictionary)} (元: {original_count})")
        else:
            print("❌ 辞書の保存に失敗しました")
    else:
        print()
        print("✓ 辞書に追加する単語はありませんでした")
    
    print()
    print("=" * 60)
    print("完了")
    print("=" * 60)

if __name__ == "__main__":
    main()
