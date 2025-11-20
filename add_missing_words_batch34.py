#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ34）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ34: 残りの重要語（動詞派生・名詞・形容詞）
BATCH_WORDS = {
    "commercialized": {
        "word": "commercialized",
        "reading": "コマーシャライズド",
        "meaning": "商業化された",
        "etymology": "commercial（商業の）+ -ize（動詞化）+ -ed",
        "relatedWords": ["marketed", "monetized", "industrialized"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "favor": {
        "word": "favor",
        "reading": "フェイバー",
        "meaning": "好意・支持・好む",
        "etymology": "ラテン語 favor（好意）",
        "relatedWords": ["preference", "support", "kindness"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "firsthand": {
        "word": "firsthand",
        "reading": "ファーストハンド",
        "meaning": "直接の・じかに",
        "etymology": "first（最初の）+ hand（手）",
        "relatedWords": ["direct", "personal", "immediate"],
        "category": "形容詞・副詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "geometric": {
        "word": "geometric",
        "reading": "ジオメトリック",
        "meaning": "幾何学的な",
        "etymology": "geometry（幾何学）+ -ic（形容詞化接尾辞）",
        "relatedWords": ["mathematical", "angular", "symmetrical"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "graphic": {
        "word": "graphic",
        "reading": "グラフィック",
        "meaning": "図の・生々しい・グラフィック",
        "etymology": "ギリシャ語 graphikos（書かれた）",
        "relatedWords": ["visual", "vivid", "illustration"],
        "category": "形容詞・名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "harms": {
        "word": "harms",
        "reading": "ハーム",
        "meaning": "害・損害（harmの複数形または三人称単数形）",
        "etymology": "harm の複数形・三人称単数形",
        "relatedWords": ["damages", "injuries", "hurts"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "hurts": {
        "word": "hurts",
        "reading": "ハート",
        "meaning": "傷つける・痛む（hurtの三人称単数形）",
        "etymology": "hurt の三人称単数形",
        "relatedWords": ["injures", "harms", "pains"],
        "category": "動詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "instincts": {
        "word": "instincts",
        "reading": "インスティンクト",
        "meaning": "本能・直感（instinctの複数形）",
        "etymology": "instinct の複数形",
        "relatedWords": ["intuitions", "impulses", "urges"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "insults": {
        "word": "insults",
        "reading": "インサルト",
        "meaning": "侮辱・侮辱する（insultの複数形または三人称単数形）",
        "etymology": "insult の複数形・三人称単数形",
        "relatedWords": ["offenses", "abuses", "affronts"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "interpretable": {
        "word": "interpretable",
        "reading": "インタープリタブル",
        "meaning": "解釈可能な",
        "etymology": "interpret（解釈する）+ -able（可能）",
        "relatedWords": ["understandable", "explainable", "comprehensible"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "ion": {
        "word": "ion",
        "reading": "イオン",
        "meaning": "イオン",
        "etymology": "ギリシャ語 ion（行くもの）",
        "relatedWords": ["atom", "particle", "charge"],
        "category": "科学・化学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "ladders": {
        "word": "ladders",
        "reading": "ラダー",
        "meaning": "はしご（ladderの複数形）",
        "etymology": "ladder の複数形",
        "relatedWords": ["steps", "stairs", "rungs"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "livelihoods": {
        "word": "livelihoods",
        "reading": "ライブリフッド",
        "meaning": "生計・暮らし（livelihoodの複数形）",
        "etymology": "livelihood の複数形",
        "relatedWords": ["incomes", "occupations", "means"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "meters": {
        "word": "meters",
        "reading": "メーター",
        "meaning": "メートル・計測器（meterの複数形）",
        "etymology": "meter の複数形",
        "relatedWords": ["measurements", "gauges", "instruments"],
        "category": "名詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "negatives": {
        "word": "negatives",
        "reading": "ネガティブ",
        "meaning": "否定的なもの・ネガ（negativeの複数形）",
        "etymology": "negative の複数形",
        "relatedWords": ["drawbacks", "disadvantages", "opposites"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "occupancy": {
        "word": "occupancy",
        "reading": "オキュパンシー",
        "meaning": "占有・占拠・入居率",
        "etymology": "occupy（占める）+ -ancy（状態）",
        "relatedWords": ["possession", "tenancy", "residence"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "offenders": {
        "word": "offenders",
        "reading": "オフェンダー",
        "meaning": "犯罪者・違反者（offenderの複数形）",
        "etymology": "offender の複数形",
        "relatedWords": ["criminals", "violators", "culprits"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "offense": {
        "word": "offense",
        "reading": "オフェンス",
        "meaning": "違反・犯罪・攻撃",
        "etymology": "ラテン語 offendere（打つ）",
        "relatedWords": ["crime", "violation", "attack"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "operators": {
        "word": "operators",
        "reading": "オペレーター",
        "meaning": "操作員・運営者（operatorの複数形）",
        "etymology": "operator の複数形",
        "relatedWords": ["workers", "managers", "handlers"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
    },
    "overlays": {
        "word": "overlays",
        "reading": "オーバーレイ",
        "meaning": "上に重ねるもの（overlayの複数形または三人称単数形）",
        "etymology": "overlay の複数形・三人称単数形",
        "relatedWords": ["covers", "layers", "coatings"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch34"
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
    print("長文読解辞書 単語追加スクリプト（バッチ34）")
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
    
    # バッチ34の単語を追加
    print(f"📝 バッチ34: 残りの重要語（動詞派生・名詞・形容詞）（{len(BATCH_WORDS)}個）を追加中...")
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
