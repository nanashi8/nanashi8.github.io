#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ28）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ28: 名詞・形容詞・副詞の重要語
BATCH_WORDS = {
    "criticism": {
        "word": "criticism",
        "reading": "クリティシズム",
        "meaning": "批判・批評",
        "etymology": "critic（批評家）+ -ism（主義・行為）",
        "relatedWords": ["critique", "review", "analysis"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "etiquette": {
        "word": "etiquette",
        "reading": "エチケット",
        "meaning": "エチケット・礼儀作法",
        "etymology": "フランス語 étiquette（札）から",
        "relatedWords": ["manners", "protocol", "courtesy"],
        "category": "社会・文化",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "fertilization": {
        "word": "fertilization",
        "reading": "ファーティライゼーション",
        "meaning": "受精・施肥",
        "etymology": "fertilize（受精させる）+ -ation（行為）",
        "relatedWords": ["reproduction", "conception", "pollination"],
        "category": "科学・生物",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "immersion": {
        "word": "immersion",
        "reading": "イマージョン",
        "meaning": "没入・浸すこと",
        "etymology": "immerse（浸す）+ -ion（行為・状態）",
        "relatedWords": ["submersion", "absorption", "engagement"],
        "category": "一般・教育",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "indicator": {
        "word": "indicator",
        "reading": "インディケーター",
        "meaning": "指標・指示器",
        "etymology": "indicate（示す）+ -or（〜するもの）",
        "relatedWords": ["sign", "measure", "gauge"],
        "category": "一般・科学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "insomnia": {
        "word": "insomnia",
        "reading": "インソムニア",
        "meaning": "不眠症",
        "etymology": "in-（否定）+ somnia（睡眠）",
        "relatedWords": ["sleeplessness", "wakefulness", "restlessness"],
        "category": "健康・医学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "intensity": {
        "word": "intensity",
        "reading": "インテンシティ",
        "meaning": "強度・激しさ",
        "etymology": "intense（激しい）+ -ity（性質）",
        "relatedWords": ["strength", "power", "force"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "intention": {
        "word": "intention",
        "reading": "インテンション",
        "meaning": "意図・意思",
        "etymology": "intend（意図する）+ -tion（行為・状態）",
        "relatedWords": ["purpose", "aim", "plan"],
        "category": "心理・行動",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "inventory": {
        "word": "inventory",
        "reading": "インベントリー",
        "meaning": "在庫・目録",
        "etymology": "ラテン語 inventorium（発見されたものの一覧）",
        "relatedWords": ["stock", "supply", "list"],
        "category": "ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "marine": {
        "word": "marine",
        "reading": "マリン",
        "meaning": "海の・海洋の",
        "etymology": "ラテン語 marinus（海の）",
        "relatedWords": ["oceanic", "aquatic", "nautical"],
        "category": "環境・科学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "moderation": {
        "word": "moderation",
        "reading": "モデレーション",
        "meaning": "適度・節制",
        "etymology": "moderate（適度な）+ -ion（行為・状態）",
        "relatedWords": ["balance", "restraint", "temperance"],
        "category": "一般・健康",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "perfection": {
        "word": "perfection",
        "reading": "パーフェクション",
        "meaning": "完璧・完成",
        "etymology": "perfect（完璧な）+ -ion（状態）",
        "relatedWords": ["flawlessness", "excellence", "ideal"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "punishment": {
        "word": "punishment",
        "reading": "パニッシュメント",
        "meaning": "罰・処罰",
        "etymology": "punish（罰する）+ -ment（行為・結果）",
        "relatedWords": ["penalty", "discipline", "sanction"],
        "category": "法律・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "reinforcement": {
        "word": "reinforcement",
        "reading": "リインフォースメント",
        "meaning": "強化・補強",
        "etymology": "reinforce（強化する）+ -ment（行為・結果）",
        "relatedWords": ["strengthening", "support", "backing"],
        "category": "一般・心理",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "repetition": {
        "word": "repetition",
        "reading": "レペティション",
        "meaning": "反復・繰り返し",
        "etymology": "repeat（繰り返す）+ -ition（行為）",
        "relatedWords": ["recurrence", "reiteration", "duplication"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "reputation": {
        "word": "reputation",
        "reading": "レピュテーション",
        "meaning": "評判・名声",
        "etymology": "ラテン語 reputatio（考慮）",
        "relatedWords": ["fame", "standing", "prestige"],
        "category": "社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "sacrifice": {
        "word": "sacrifice",
        "reading": "サクリファイス",
        "meaning": "犠牲・献身",
        "etymology": "ラテン語 sacrificium（聖なる行為）",
        "relatedWords": ["offering", "devotion", "surrender"],
        "category": "一般・宗教",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "tension": {
        "word": "tension",
        "reading": "テンション",
        "meaning": "緊張・張力",
        "etymology": "ラテン語 tensio（引っ張ること）",
        "relatedWords": ["stress", "strain", "pressure"],
        "category": "一般・物理",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "translation": {
        "word": "translation",
        "reading": "トランスレーション",
        "meaning": "翻訳・変換",
        "etymology": "translate（翻訳する）+ -ion（行為）",
        "relatedWords": ["interpretation", "conversion", "rendering"],
        "category": "言語・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
    },
    "validation": {
        "word": "validation",
        "reading": "バリデーション",
        "meaning": "検証・確認・承認",
        "etymology": "validate（検証する）+ -ion（行為）",
        "relatedWords": ["verification", "confirmation", "approval"],
        "category": "一般・技術",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch28"
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
    print("長文読解辞書 単語追加スクリプト（バッチ28）")
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
    
    # バッチ28の単語を追加
    print(f"📝 バッチ28: 名詞・形容詞・副詞の重要語（{len(BATCH_WORDS)}個）を追加中...")
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
