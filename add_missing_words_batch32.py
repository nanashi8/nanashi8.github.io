#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ32）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ32: 残りの重要語（名詞・動詞・形容詞）
BATCH_WORDS = {
    "cleanup": {
        "word": "cleanup",
        "reading": "クリーンアップ",
        "meaning": "清掃・浄化",
        "etymology": "clean（清潔な）+ up（上に・完全に）",
        "relatedWords": ["cleaning", "purification", "sanitation"],
        "category": "環境・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "cleanups": {
        "word": "cleanups",
        "reading": "クリーンアップ",
        "meaning": "清掃・浄化（cleanupの複数形）",
        "etymology": "cleanup の複数形",
        "relatedWords": ["cleanings", "purifications", "restorations"],
        "category": "環境・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "firefighters": {
        "word": "firefighters",
        "reading": "ファイヤーファイター",
        "meaning": "消防士（firefighterの複数形）",
        "etymology": "fire（火）+ fighter（戦う人）の複数形",
        "relatedWords": ["firemen", "rescuers", "emergency responders"],
        "category": "職業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "grandchildren": {
        "word": "grandchildren",
        "reading": "グランドチルドレン",
        "meaning": "孫たち（grandchildの複数形）",
        "etymology": "grand（大きな）+ children（子供たち）",
        "relatedWords": ["descendants", "offspring", "family"],
        "category": "家族",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "ill": {
        "word": "ill",
        "reading": "イル",
        "meaning": "病気の・悪い",
        "etymology": "古ノルド語 illr（悪い）",
        "relatedWords": ["sick", "unwell", "diseased"],
        "category": "健康・形容詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "internal": {
        "word": "internal",
        "reading": "インターナル",
        "meaning": "内部の・国内の",
        "etymology": "ラテン語 internus（内部の）",
        "relatedWords": ["inside", "inner", "domestic"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "lifetime": {
        "word": "lifetime",
        "reading": "ライフタイム",
        "meaning": "生涯・一生",
        "etymology": "life（生命）+ time（時間）",
        "relatedWords": ["lifespan", "existence", "duration"],
        "category": "時間・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "lifestyles": {
        "word": "lifestyles",
        "reading": "ライフスタイル",
        "meaning": "生活様式（lifestyleの複数形）",
        "etymology": "lifestyle の複数形",
        "relatedWords": ["ways of life", "habits", "routines"],
        "category": "社会・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "manual": {
        "word": "manual",
        "reading": "マニュアル",
        "meaning": "手動の・手引き書",
        "etymology": "ラテン語 manualis（手の）",
        "relatedWords": ["handbook", "guide", "instructions"],
        "category": "形容詞・名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "nonprofit": {
        "word": "nonprofit",
        "reading": "ノンプロフィット",
        "meaning": "非営利の",
        "etymology": "non-（否定）+ profit（利益）",
        "relatedWords": ["charitable", "voluntary", "NGO"],
        "category": "ビジネス・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "norm": {
        "word": "norm",
        "reading": "ノーム",
        "meaning": "規範・標準",
        "etymology": "ラテン語 norma（定規）",
        "relatedWords": ["standard", "convention", "rule"],
        "category": "社会・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "norms": {
        "word": "norms",
        "reading": "ノーム",
        "meaning": "規範・標準（normの複数形）",
        "etymology": "norm の複数形",
        "relatedWords": ["standards", "conventions", "rules"],
        "category": "社会・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "obstacle": {
        "word": "obstacle",
        "reading": "オブスタクル",
        "meaning": "障害・妨害物",
        "etymology": "ラテン語 obstaculum（妨げ）",
        "relatedWords": ["barrier", "hurdle", "impediment"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "openness": {
        "word": "openness",
        "reading": "オープンネス",
        "meaning": "開放性・率直さ",
        "etymology": "open（開いた）+ -ness（状態）",
        "relatedWords": ["transparency", "frankness", "honesty"],
        "category": "性質・心理",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "outbreaks": {
        "word": "outbreaks",
        "reading": "アウトブレイク",
        "meaning": "発生・流行（outbreakの複数形）",
        "etymology": "outbreak の複数形",
        "relatedWords": ["epidemics", "occurrences", "eruptions"],
        "category": "健康・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "overnight": {
        "word": "overnight",
        "reading": "オーバーナイト",
        "meaning": "一晩中・夜通し",
        "etymology": "over（越えて）+ night（夜）",
        "relatedWords": ["all night", "nightlong", "suddenly"],
        "category": "時間・副詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "oversight": {
        "word": "oversight",
        "reading": "オーバーサイト",
        "meaning": "監視・見落とし",
        "etymology": "over（上から）+ sight（見ること）",
        "relatedWords": ["supervision", "mistake", "error"],
        "category": "ビジネス・一般",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "richness": {
        "word": "richness",
        "reading": "リッチネス",
        "meaning": "豊かさ・豊富さ",
        "etymology": "rich（豊かな）+ -ness（状態）",
        "relatedWords": ["wealth", "abundance", "prosperity"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "sexual": {
        "word": "sexual",
        "reading": "セクシュアル",
        "meaning": "性的な・性の",
        "etymology": "sex（性）+ -ual（形容詞化接尾辞）",
        "relatedWords": ["reproductive", "erotic", "gender"],
        "category": "生物・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
    },
    "sexuality": {
        "word": "sexuality",
        "reading": "セクシュアリティ",
        "meaning": "性・性的指向",
        "etymology": "sexual（性的な）+ -ity（性質）",
        "relatedWords": ["orientation", "identity", "gender"],
        "category": "心理・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch32"
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
    print("長文読解辞書 単語追加スクリプト（バッチ32）")
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
    
    # バッチ32の単語を追加
    print(f"📝 バッチ32: 残りの重要語（名詞・動詞・形容詞）（{len(BATCH_WORDS)}個）を追加中...")
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
