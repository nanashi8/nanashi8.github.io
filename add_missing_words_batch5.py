#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ5）
建築・技術・エネルギー関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ5: 建築・技術・エネルギー関連）
BATCH5_WORDS = {
    "minimize": {
        "word": "minimize",
        "reading": "ミニマイズ",
        "meaning": "最小化する・最小限にする",
        "etymology": "minimum（最小）+ -ize（〜化する）",
        "relatedWords": "minimum(ミニマム): 最小, minimize(ミニマイズ): 最小化する",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "thermostat": {
        "word": "thermostat",
        "reading": "サーモスタット",
        "meaning": "温度調節器・サーモスタット",
        "etymology": "thermo-（熱の）+ -stat（安定させるもの）",
        "relatedWords": "temperature(テンペラチャー): 温度, control(コントロール): 制御",
        "category": "技術・装置",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "optimize": {
        "word": "optimize",
        "reading": "オプティマイズ",
        "meaning": "最適化する",
        "etymology": "optimal（最適な）+ -ize（〜化する）",
        "relatedWords": "optimal(オプティマル): 最適な, optimization(オプティマイゼーション): 最適化",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "runoff": {
        "word": "runoff",
        "reading": "ランオフ",
        "meaning": "流出・雨水流出",
        "etymology": "run（流れる）+ off（離れて）",
        "relatedWords": "run(ラン): 流れる, drain(ドレイン): 排水",
        "category": "環境・自然",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "rainwater": {
        "word": "rainwater",
        "reading": "レインウォーター",
        "meaning": "雨水",
        "etymology": "rain（雨）+ water（水）",
        "relatedWords": "rain(レイン): 雨, water(ウォーター): 水",
        "category": "環境・自然",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "evaporation": {
        "word": "evaporation",
        "reading": "エバポレーション",
        "meaning": "蒸発",
        "etymology": "evaporate（蒸発する）+ -ion（名詞化）",
        "relatedWords": "evaporate(エバポレート): 蒸発する, vapor(ベイパー): 蒸気",
        "category": "科学・自然",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "maximize": {
        "word": "maximize",
        "reading": "マキシマイズ",
        "meaning": "最大化する",
        "etymology": "maximum（最大）+ -ize（〜化する）",
        "relatedWords": "maximum(マキシマム): 最大, maximal(マキシマル): 最大の",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mass": {
        "word": "mass",
        "reading": "マス",
        "meaning": "質量・大量",
        "etymology": "ラテン語 massa（塊）",
        "relatedWords": "massive(マッシブ): 巨大な, weight(ウェイト): 重さ",
        "category": "物理・量",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "ventilation": {
        "word": "ventilation",
        "reading": "ベンチレーション",
        "meaning": "換気・通風",
        "etymology": "ventilate（換気する）+ -ion（名詞化）",
        "relatedWords": "ventilate(ベンチレート): 換気する, air(エア): 空気",
        "category": "建築・技術",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "indoor": {
        "word": "indoor",
        "reading": "インドア",
        "meaning": "屋内の・室内の",
        "etymology": "in（中の）+ door（ドア）",
        "relatedWords": "outdoor(アウトドア): 屋外の, inside(インサイド): 内側",
        "category": "場所・性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "existing": {
        "word": "existing",
        "reading": "イグジスティング",
        "meaning": "既存の・現存する",
        "etymology": "exist（存在する）+ -ing（現在分詞）",
        "relatedWords": "exist(イグジスト): 存在する, current(カレント): 現在の",
        "category": "状態",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "demolition": {
        "word": "demolition",
        "reading": "デモリション",
        "meaning": "解体・破壊",
        "etymology": "ラテン語 demolitio（破壊）",
        "relatedWords": "demolish(デモリッシュ): 解体する, destroy(デストロイ): 破壊する",
        "category": "建築・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "improvement": {
        "word": "improvement",
        "reading": "インプルーブメント",
        "meaning": "改善・改良",
        "etymology": "improve（改善する）+ -ment（名詞化）",
        "relatedWords": "improve(インプルーブ): 改善する, better(ベター): より良い",
        "category": "抽象概念",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "massive": {
        "word": "massive",
        "reading": "マッシブ",
        "meaning": "巨大な・大規模な",
        "etymology": "ラテン語 massa（塊）",
        "relatedWords": "mass(マス): 質量, huge(ヒュージ): 巨大な",
        "category": "性質・サイズ",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "choose": {
        "word": "choose",
        "reading": "チューズ",
        "meaning": "選ぶ・選択する",
        "etymology": "古英語 ceosan",
        "relatedWords": "choice(チョイス): 選択, select(セレクト): 選ぶ",
        "category": "行動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "discard": {
        "word": "discard",
        "reading": "ディスカード",
        "meaning": "捨てる・処分する",
        "etymology": "dis-（離れて）+ card（カード）",
        "relatedWords": "dispose(ディスポーズ): 処分する, throw away(スロー アウェイ): 捨てる",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "timeless": {
        "word": "timeless",
        "reading": "タイムレス",
        "meaning": "時代を超えた・不変の",
        "etymology": "time（時間）+ -less（〜がない）",
        "relatedWords": "eternal(エターナル): 永遠の, classic(クラシック): 古典的な",
        "category": "性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "ethical": {
        "word": "ethical",
        "reading": "エシカル",
        "meaning": "倫理的な・道徳的な",
        "etymology": "ギリシャ語 ethikos（習慣の）",
        "relatedWords": "ethics(エシックス): 倫理, moral(モラル): 道徳的な",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "huge": {
        "word": "huge",
        "reading": "ヒュージ",
        "meaning": "巨大な・莫大な",
        "etymology": "古フランス語 ahuge",
        "relatedWords": "enormous(エノーマス): 巨大な, massive(マッシブ): 大規模な",
        "category": "サイズ・程度",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "vegan": {
        "word": "vegan",
        "reading": "ビーガン",
        "meaning": "完全菜食主義の・ビーガンの",
        "etymology": "vegetarian（菜食主義者）の短縮形",
        "relatedWords": "vegetarian(ベジタリアン): 菜食主義者, plant-based(プラントベースド): 植物性の",
        "category": "食事・ライフスタイル",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    }
}

def load_json(filepath):
    """JSONファイルを読み込む"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filepath):
    """JSONファイルを保存する"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ {filepath} を保存しました")

def main():
    print("=" * 60)
    print("長文読解辞書 単語追加スクリプト（バッチ5）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ5: 建築・技術・エネルギー関連の単語（{len(BATCH5_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH5_WORDS.items():
        if word_key.lower() not in dictionary:
            dictionary[word_key.lower()] = word_data
            added_count += 1
            print(f"  ✓ {word_data['word']}: {word_data['meaning']}")
        else:
            skipped_count += 1
            print(f"  - {word_key} は既に存在します")
    
    if added_count > 0:
        save_json(dictionary, dict_path)
        print(f"\n✅ {added_count}個の単語を辞書に追加しました")
        print(f"   スキップ: {skipped_count}個")
        print(f"   新しい単語数: {len(dictionary)} (元: {original_count})")
    else:
        print(f"\n✓ 追加する新しい単語はありませんでした")
    
    print("\n" + "=" * 60)
    print("完了")
    print("=" * 60)

if __name__ == '__main__':
    main()
