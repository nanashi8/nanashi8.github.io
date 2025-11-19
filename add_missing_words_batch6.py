#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ6）
消費・ライフスタイル・社会関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ6: 消費・ライフスタイル・社会関連）
BATCH6_WORDS = {
    "meatless": {
        "word": "meatless",
        "reading": "ミートレス",
        "meaning": "肉を使わない・菜食の",
        "etymology": "meat（肉）+ -less（〜がない）",
        "relatedWords": "meat(ミート): 肉, vegetarian(ベジタリアン): 菜食主義者",
        "category": "食事",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "seasonal": {
        "word": "seasonal",
        "reading": "シーズナル",
        "meaning": "季節の・季節限定の",
        "etymology": "season（季節）+ -al（形容詞化）",
        "relatedWords": "season(シーズン): 季節, temporary(テンポラリー): 一時的な",
        "category": "時間・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "farmer": {
        "word": "farmer",
        "reading": "ファーマー",
        "meaning": "農家・農民",
        "etymology": "farm（農場）+ -er（人）",
        "relatedWords": "farm(ファーム): 農場, agriculture(アグリカルチャー): 農業",
        "category": "職業・人",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "freshness": {
        "word": "freshness",
        "reading": "フレッシュネス",
        "meaning": "新鮮さ",
        "etymology": "fresh（新鮮な）+ -ness（名詞化）",
        "relatedWords": "fresh(フレッシュ): 新鮮な, quality(クオリティ): 品質",
        "category": "性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "scrap": {
        "word": "scrap",
        "reading": "スクラップ",
        "meaning": "切れ端・残飯",
        "etymology": "古ノルド語 skrap",
        "relatedWords": "waste(ウェイスト): 廃棄物, leftover(レフトオーバー): 残り物",
        "category": "物",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "reusable": {
        "word": "reusable",
        "reading": "リユーザブル",
        "meaning": "再利用可能な",
        "etymology": "re-（再び）+ use（使う）+ -able（可能な）",
        "relatedWords": "reuse(リユース): 再利用する, recyclable(リサイクラブル): リサイクル可能な",
        "category": "環境・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "refillable": {
        "word": "refillable",
        "reading": "リフィラブル",
        "meaning": "詰め替え可能な",
        "etymology": "re-（再び）+ fill（満たす）+ -able（可能な）",
        "relatedWords": "refill(リフィル): 詰め替える, reusable(リユーザブル): 再利用可能な",
        "category": "環境・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "bottle": {
        "word": "bottle",
        "reading": "ボトル",
        "meaning": "瓶・ボトル",
        "etymology": "ラテン語 butticula（小さな樽）",
        "relatedWords": "container(コンテナー): 容器, jar(ジャー): 瓶",
        "category": "物・容器",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "minimal": {
        "word": "minimal",
        "reading": "ミニマル",
        "meaning": "最小限の・最小の",
        "etymology": "minimum（最小）+ -al（形容詞化）",
        "relatedWords": "minimum(ミニマム): 最小, minimize(ミニマイズ): 最小化する",
        "category": "程度・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "purchasing": {
        "word": "purchase",
        "reading": "パーチェス",
        "meaning": "購入する・購入",
        "etymology": "古フランス語 porchacier（追求する）",
        "relatedWords": "buy(バイ): 買う, shopping(ショッピング): 買い物",
        "category": "行動・経済",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "crucial": {
        "word": "crucial",
        "reading": "クルーシャル",
        "meaning": "重要な・決定的な",
        "etymology": "ラテン語 crux（十字架）",
        "relatedWords": "critical(クリティカル): 重大な, essential(エッセンシャル): 不可欠な",
        "category": "重要性",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "insufficient": {
        "word": "insufficient",
        "reading": "インサフィシェント",
        "meaning": "不十分な",
        "etymology": "in-（否定）+ sufficient（十分な）",
        "relatedWords": "sufficient(サフィシェント): 十分な, inadequate(インアデクエイト): 不適切な",
        "category": "程度",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "systemic": {
        "word": "systemic",
        "reading": "システミック",
        "meaning": "組織的な・体系的な",
        "etymology": "system（体系）+ -ic（形容詞化）",
        "relatedWords": "system(システム): 体系, systematic(システマティック): 体系的な",
        "category": "性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "expensive": {
        "word": "expensive",
        "reading": "エクスペンシブ",
        "meaning": "高価な・費用のかかる",
        "etymology": "expense（費用）+ -ive（形容詞化）",
        "relatedWords": "cheap(チープ): 安い, costly(コストリー): 高価な",
        "category": "価格・性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "incentive": {
        "word": "incentive",
        "reading": "インセンティブ",
        "meaning": "動機・奨励金",
        "etymology": "ラテン語 incentivus（刺激する）",
        "relatedWords": "motivation(モチベーション): 動機付け, reward(リワード): 報酬",
        "category": "経済・心理",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "minimum": {
        "word": "minimum",
        "reading": "ミニマム",
        "meaning": "最小・最低限",
        "etymology": "ラテン語 minimus（最小の）",
        "relatedWords": "minimal(ミニマル): 最小の, maximum(マキシマム): 最大",
        "category": "程度・量",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "historical": {
        "word": "historical",
        "reading": "ヒストリカル",
        "meaning": "歴史的な・史実の",
        "etymology": "history（歴史）+ -ical（形容詞化）",
        "relatedWords": "history(ヒストリー): 歴史, historic(ヒストリック): 歴史的に重要な",
        "category": "時間・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mitigation": {
        "word": "mitigation",
        "reading": "ミティゲーション",
        "meaning": "緩和・軽減",
        "etymology": "mitigate（緩和する）+ -ion（名詞化）",
        "relatedWords": "mitigate(ミティゲート): 緩和する, reduce(リデュース): 減らす",
        "category": "行動・概念",
        "difficulty": "上級",
        "levels": ["上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "central": {
        "word": "central",
        "reading": "セントラル",
        "meaning": "中心的な・中央の",
        "etymology": "ラテン語 centralis（中心の）",
        "relatedWords": "center(センター): 中心, core(コア): 核心",
        "category": "位置・性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "inequality": {
        "word": "inequality",
        "reading": "インイクオリティ",
        "meaning": "不平等・不均等",
        "etymology": "in-（否定）+ equality（平等）",
        "relatedWords": "equality(イクオリティ): 平等, disparity(ディスパリティ): 格差",
        "category": "社会・概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
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
    print("長文読解辞書 単語追加スクリプト（バッチ6）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ6: 消費・ライフスタイル・社会関連の単語（{len(BATCH6_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH6_WORDS.items():
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
