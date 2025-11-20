#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ29）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ29: 形容詞・副詞・名詞の派生形
BATCH_WORDS = {
    "inappropriate": {
        "word": "inappropriate",
        "reading": "インアプロプリエート",
        "meaning": "不適切な・ふさわしくない",
        "etymology": "in-（否定）+ appropriate（適切な）",
        "relatedWords": ["unsuitable", "improper", "unfit"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "irreplaceable": {
        "word": "irreplaceable",
        "reading": "イリプレイサブル",
        "meaning": "かけがえのない・代えがたい",
        "etymology": "ir-（否定）+ replaceable（交換可能な）",
        "relatedWords": ["unique", "invaluable", "precious"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "malicious": {
        "word": "malicious",
        "reading": "マリシャス",
        "meaning": "悪意のある・意地悪な",
        "etymology": "malice（悪意）+ -ious（形容詞化接尾辞）",
        "relatedWords": ["spiteful", "hostile", "harmful"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "moderate": {
        "word": "moderate",
        "reading": "モデレート",
        "meaning": "適度な・穏健な",
        "etymology": "ラテン語 moderatus（節度のある）",
        "relatedWords": ["reasonable", "mild", "balanced"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "optimal": {
        "word": "optimal",
        "reading": "オプティマル",
        "meaning": "最適な・最良の",
        "etymology": "optimum（最良）+ -al（形容詞化接尾辞）",
        "relatedWords": ["best", "ideal", "perfect"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "oral": {
        "word": "oral",
        "reading": "オーラル",
        "meaning": "口頭の・口の",
        "etymology": "ラテン語 os（口）+ -al",
        "relatedWords": ["spoken", "verbal", "vocal"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "oriented": {
        "word": "oriented",
        "reading": "オリエンテッド",
        "meaning": "志向の・方向付けられた",
        "etymology": "orient（方向付ける）+ -ed",
        "relatedWords": ["directed", "focused", "aimed"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "powerless": {
        "word": "powerless",
        "reading": "パワーレス",
        "meaning": "無力な・力のない",
        "etymology": "power（力）+ -less（〜のない）",
        "relatedWords": ["helpless", "weak", "impotent"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "proven": {
        "word": "proven",
        "reading": "プルーブン",
        "meaning": "証明された・実証済みの",
        "etymology": "prove（証明する）の過去分詞",
        "relatedWords": ["verified", "confirmed", "tested"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "speculative": {
        "word": "speculative",
        "reading": "スペキュレイティブ",
        "meaning": "推測的な・投機的な",
        "etymology": "speculate（推測する）+ -ive",
        "relatedWords": ["theoretical", "hypothetical", "conjectural"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "tedious": {
        "word": "tedious",
        "reading": "ティーディアス",
        "meaning": "退屈な・単調な",
        "etymology": "ラテン語 taedium（退屈）",
        "relatedWords": ["boring", "monotonous", "tiresome"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "understandable": {
        "word": "understandable",
        "reading": "アンダスタンダブル",
        "meaning": "理解できる・無理もない",
        "etymology": "understand（理解する）+ -able（可能）",
        "relatedWords": ["comprehensible", "reasonable", "natural"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "unintentional": {
        "word": "unintentional",
        "reading": "アンインテンショナル",
        "meaning": "意図的でない・故意でない",
        "etymology": "un-（否定）+ intentional（意図的な）",
        "relatedWords": ["accidental", "inadvertent", "unplanned"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "unlucky": {
        "word": "unlucky",
        "reading": "アンラッキー",
        "meaning": "不運な・ついていない",
        "etymology": "un-（否定）+ lucky（幸運な）",
        "relatedWords": ["unfortunate", "hapless", "ill-fated"],
        "category": "形容詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "unmanned": {
        "word": "unmanned",
        "reading": "アンマンド",
        "meaning": "無人の・人のいない",
        "etymology": "un-（否定）+ manned（有人の）",
        "relatedWords": ["automatic", "robotic", "autonomous"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "unpaid": {
        "word": "unpaid",
        "reading": "アンペイド",
        "meaning": "未払いの・無給の",
        "etymology": "un-（否定）+ paid（支払われた）",
        "relatedWords": ["outstanding", "unsettled", "volunteer"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "unevenly": {
        "word": "unevenly",
        "reading": "アニーブンリー",
        "meaning": "不均等に・むらがあって",
        "etymology": "uneven（不均等な）+ -ly（副詞化接尾辞）",
        "relatedWords": ["irregularly", "inconsistently", "asymmetrically"],
        "category": "副詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "underlying": {
        "word": "underlying",
        "reading": "アンダーライイング",
        "meaning": "根底にある・潜在的な",
        "etymology": "under（下の）+ lying（横たわる）",
        "relatedWords": ["fundamental", "basic", "inherent"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "underway": {
        "word": "underway",
        "reading": "アンダーウェイ",
        "meaning": "進行中の・実施中の",
        "etymology": "under（〜の下に）+ way（道）",
        "relatedWords": ["ongoing", "in progress", "happening"],
        "category": "形容詞・副詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
    },
    "misunderstood": {
        "word": "misunderstood",
        "reading": "ミスアンダストゥッド",
        "meaning": "誤解された（misunderstandの過去分詞）",
        "etymology": "mis-（誤って）+ understood（理解された）",
        "relatedWords": ["misinterpreted", "misjudged", "misconstrued"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch29"
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
    print("長文読解辞書 単語追加スクリプト（バッチ29）")
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
    
    # バッチ29の単語を追加
    print(f"📝 バッチ29: 形容詞・副詞・名詞の派生形（{len(BATCH_WORDS)}個）を追加中...")
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
