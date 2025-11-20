#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ35）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ35: 残りの重要語（最終段階）
BATCH_WORDS = {
    "communicators": {
        "word": "communicators",
        "reading": "コミュニケーター",
        "meaning": "伝達者・コミュニケーター（communicatorの複数形）",
        "etymology": "communicate（伝える）+ -or（〜する人）の複数形",
        "relatedWords": ["speakers", "messengers", "transmitters"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "composers": {
        "word": "composers",
        "reading": "コンポーザー",
        "meaning": "作曲家（composerの複数形）",
        "etymology": "compose（作曲する）+ -er（〜する人）の複数形",
        "relatedWords": ["musicians", "songwriters", "artists"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "dehydrated": {
        "word": "dehydrated",
        "reading": "ディハイドレイテッド",
        "meaning": "脱水した・乾燥した",
        "etymology": "de-（除去）+ hydrate（水分を与える）+ -ed",
        "relatedWords": ["dried", "desiccated", "parched"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "desertification": {
        "word": "desertification",
        "reading": "デザーティフィケーション",
        "meaning": "砂漠化",
        "etymology": "desert（砂漠）+ -ification（〜化）",
        "relatedWords": ["degradation", "erosion", "drought"],
        "category": "環境",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "dishonesty": {
        "word": "dishonesty",
        "reading": "ディスオネスティ",
        "meaning": "不正直・不誠実",
        "etymology": "dis-（否定）+ honesty（正直）",
        "relatedWords": ["deception", "fraud", "lying"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "dislike": {
        "word": "dislike",
        "reading": "ディスライク",
        "meaning": "嫌い・嫌う",
        "etymology": "dis-（否定）+ like（好き）",
        "relatedWords": ["hatred", "aversion", "distaste"],
        "category": "名詞・動詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "dispense": {
        "word": "dispense",
        "reading": "ディスペンス",
        "meaning": "分配する・調剤する",
        "etymology": "ラテン語 dispensare（分配する）",
        "relatedWords": ["distribute", "allocate", "administer"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "distractions": {
        "word": "distractions",
        "reading": "ディストラクション",
        "meaning": "気晴らし・注意散漫（distractionの複数形）",
        "etymology": "distraction の複数形",
        "relatedWords": ["interruptions", "diversions", "disturbances"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "divisions": {
        "word": "divisions",
        "reading": "ディビジョン",
        "meaning": "分割・部門（divisionの複数形）",
        "etymology": "division の複数形",
        "relatedWords": ["sections", "departments", "separations"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "dwellers": {
        "word": "dwellers",
        "reading": "ドウェラー",
        "meaning": "住人・居住者（dwellerの複数形）",
        "etymology": "dwell（住む）+ -er（〜する人）の複数形",
        "relatedWords": ["residents", "inhabitants", "occupants"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "gig": {
        "word": "gig",
        "reading": "ギグ",
        "meaning": "単発の仕事・ライブ",
        "etymology": "俗語から",
        "relatedWords": ["job", "performance", "concert"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "grievances": {
        "word": "grievances",
        "reading": "グリーバンス",
        "meaning": "不満・苦情（grievanceの複数形）",
        "etymology": "grievance の複数形",
        "relatedWords": ["complaints", "protests", "objections"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "hydrated": {
        "word": "hydrated",
        "reading": "ハイドレイテッド",
        "meaning": "水分補給された・水和した",
        "etymology": "hydrate（水分を与える）+ -ed",
        "relatedWords": ["moisturized", "watered", "saturated"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "introductions": {
        "word": "introductions",
        "reading": "イントロダクション",
        "meaning": "紹介・導入（introductionの複数形）",
        "etymology": "introduction の複数形",
        "relatedWords": ["presentations", "prefaces", "openings"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "melodies": {
        "word": "melodies",
        "reading": "メロディ",
        "meaning": "旋律・メロディ（melodyの複数形）",
        "etymology": "melody の複数形",
        "relatedWords": ["tunes", "songs", "harmonies"],
        "category": "音楽",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "memorials": {
        "word": "memorials",
        "reading": "メモリアル",
        "meaning": "記念碑・追悼式（memorialの複数形）",
        "etymology": "memorial の複数形",
        "relatedWords": ["monuments", "tributes", "commemorations"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "newcomers": {
        "word": "newcomers",
        "reading": "ニューカマー",
        "meaning": "新参者・新入り（newcomerの複数形）",
        "etymology": "newcomer の複数形",
        "relatedWords": ["beginners", "novices", "arrivals"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "plumbers": {
        "word": "plumbers",
        "reading": "プラマー",
        "meaning": "配管工（plumberの複数形）",
        "etymology": "plumber の複数形",
        "relatedWords": ["technicians", "workers", "craftsmen"],
        "category": "職業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "producers": {
        "word": "producers",
        "reading": "プロデューサー",
        "meaning": "生産者・製作者（producerの複数形）",
        "etymology": "producer の複数形",
        "relatedWords": ["manufacturers", "creators", "makers"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
    },
    "providers": {
        "word": "providers",
        "reading": "プロバイダー",
        "meaning": "提供者・供給者（providerの複数形）",
        "etymology": "provider の複数形",
        "relatedWords": ["suppliers", "sources", "givers"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch35"
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
    print("長文読解辞書 単語追加スクリプト（バッチ35）")
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
    
    # バッチ35の単語を追加
    print(f"📝 バッチ35: 残りの重要語（最終段階）（{len(BATCH_WORDS)}個）を追加中...")
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
