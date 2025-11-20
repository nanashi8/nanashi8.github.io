#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ36）
残りの67単語から次の20語を追加
"""

import json
import os

# バッチ36: 残りの重要語（専門用語・社会用語）
BATCH_WORDS = {
    "compatriots": {
        "word": "compatriots",
        "reading": "コンパトリオット",
        "meaning": "同胞・同国人（compatriotの複数形）",
        "etymology": "compatriot の複数形",
        "relatedWords": ["countrymen", "nationals", "citizens"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "cynicism": {
        "word": "cynicism",
        "reading": "シニシズム",
        "meaning": "冷笑主義・皮肉",
        "etymology": "ギリシャ語 kynikos（犬儒派の）から",
        "relatedWords": ["skepticism", "pessimism", "distrust"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "dependability": {
        "word": "dependability",
        "reading": "ディペンダビリティ",
        "meaning": "信頼性・頼りになること",
        "etymology": "dependable（頼りになる）+ -ity（性質）",
        "relatedWords": ["reliability", "trustworthiness", "consistency"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "deprecating": {
        "word": "deprecating",
        "reading": "デプリケーティング",
        "meaning": "非推奨にする・軽視する",
        "etymology": "deprecate（非推奨にする）+ -ing",
        "relatedWords": ["disparaging", "belittling", "devaluing"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "devaluing": {
        "word": "devaluing",
        "reading": "ディバリューイング",
        "meaning": "価値を下げる・切り下げる",
        "etymology": "devalue（価値を下げる）+ -ing",
        "relatedWords": ["depreciating", "degrading", "diminishing"],
        "category": "動詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "drumming": {
        "word": "drumming",
        "reading": "ドラミング",
        "meaning": "太鼓を叩くこと・ドラム演奏",
        "etymology": "drum（太鼓）+ -ing",
        "relatedWords": ["percussion", "beating", "tapping"],
        "category": "音楽",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "ethicists": {
        "word": "ethicists",
        "reading": "エシシスト",
        "meaning": "倫理学者（ethicistの複数形）",
        "etymology": "ethic（倫理）+ -ist（専門家）の複数形",
        "relatedWords": ["philosophers", "moralists", "scholars"],
        "category": "職業",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "ex": {
        "word": "ex",
        "reading": "エックス",
        "meaning": "元〜・前〜",
        "etymology": "ラテン語 ex（〜から）",
        "relatedWords": ["former", "previous", "past"],
        "category": "接頭辞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "generalizations": {
        "word": "generalizations",
        "reading": "ジェネラライゼーション",
        "meaning": "一般化・概括（generalizationの複数形）",
        "etymology": "generalization の複数形",
        "relatedWords": ["abstractions", "simplifications", "summaries"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "hoarded": {
        "word": "hoarded",
        "reading": "ホーデッド",
        "meaning": "蓄えた・ため込んだ",
        "etymology": "hoard（蓄える）+ -ed",
        "relatedWords": ["stored", "stockpiled", "accumulated"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "hopping": {
        "word": "hopping",
        "reading": "ホッピング",
        "meaning": "跳ねる・飛び跳ねる",
        "etymology": "hop（跳ねる）+ -ing",
        "relatedWords": ["jumping", "leaping", "bouncing"],
        "category": "動詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "interconnections": {
        "word": "interconnections",
        "reading": "インターコネクション",
        "meaning": "相互接続・相互関係（interconnectionの複数形）",
        "etymology": "interconnection の複数形",
        "relatedWords": ["links", "relationships", "networks"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "interdependence": {
        "word": "interdependence",
        "reading": "インターディペンデンス",
        "meaning": "相互依存",
        "etymology": "inter-（相互）+ dependence（依存）",
        "relatedWords": ["interconnection", "mutuality", "reciprocity"],
        "category": "社会",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "intermittency": {
        "word": "intermittency",
        "reading": "インターミッテンシー",
        "meaning": "断続性・間欠性",
        "etymology": "intermittent（断続的な）+ -cy（性質）",
        "relatedWords": ["irregularity", "discontinuity", "variability"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "invoicing": {
        "word": "invoicing",
        "reading": "インボイシング",
        "meaning": "請求書発行・送り状作成",
        "etymology": "invoice（請求書）+ -ing",
        "relatedWords": ["billing", "charging", "accounting"],
        "category": "ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "monarchies": {
        "word": "monarchies",
        "reading": "モナーキー",
        "meaning": "君主制・王国（monarchyの複数形）",
        "etymology": "monarchy の複数形",
        "relatedWords": ["kingdoms", "empires", "dynasties"],
        "category": "政治",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "nanomachines": {
        "word": "nanomachines",
        "reading": "ナノマシン",
        "meaning": "ナノマシン（nanomachineの複数形）",
        "etymology": "nano-（10億分の1）+ machine の複数形",
        "relatedWords": ["nanorobots", "nanobots", "nanodevices"],
        "category": "科学",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "neurodivergent": {
        "word": "neurodivergent",
        "reading": "ニューロダイバージェント",
        "meaning": "神経多様性のある・神経発達の異なる",
        "etymology": "neuro-（神経）+ divergent（発散する）",
        "relatedWords": ["atypical", "neurodiverse", "different"],
        "category": "医学",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "pluralism": {
        "word": "pluralism",
        "reading": "プルーラリズム",
        "meaning": "多元主義・複数主義",
        "etymology": "plural（複数の）+ -ism（主義）",
        "relatedWords": ["diversity", "multiplicity", "variety"],
        "category": "哲学",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch36"
    },
    "polyrhythms": {
        "word": "polyrhythms",
        "reading": "ポリリズム",
        "meaning": "複合リズム（polyrhythmの複数形）",
        "etymology": "poly-（多数）+ rhythm の複数形",
        "relatedWords": ["rhythms", "beats", "patterns"],
        "category": "音楽",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch36"
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
    print("長文読解辞書 単語追加スクリプト（バッチ36）")
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
    
    # バッチ36の単語を追加
    print(f"📝 バッチ36: 残りの重要語（専門用語・社会用語）（{len(BATCH_WORDS)}個）を追加中...")
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
