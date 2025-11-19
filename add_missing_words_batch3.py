#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ3）
農業・食品・環境関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ3: 農業・食品・環境関連）
BATCH3_WORDS = {
    "obsolescence": {
        "word": "obsolescence",
        "reading": "オブソレッセンス",
        "meaning": "陳腐化・旧式化",
        "etymology": "obsolete（時代遅れの）+ -ence（名詞化）",
        "relatedWords": "obsolete(オブソリート): 時代遅れの, outdated(アウトデイティッド): 古い",
        "category": "状態",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "symbiosis": {
        "word": "symbiosis",
        "reading": "シンバイオシス",
        "meaning": "共生",
        "etymology": "ギリシャ語 symbiōsis（共に生きること）",
        "relatedWords": "symbiotic(シンバイオティック): 共生の, cooperation(クーオペレーション): 協力",
        "category": "生物・科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "raw": {
        "word": "raw",
        "reading": "ロー",
        "meaning": "生の・未加工の",
        "etymology": "古英語 hreaw",
        "relatedWords": "cooked(クックト): 調理された, natural(ナチュラル): 自然の",
        "category": "状態・性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "extraction": {
        "word": "extraction",
        "reading": "エクストラクション",
        "meaning": "抽出・採取",
        "etymology": "ラテン語 extractio（引き出すこと）",
        "relatedWords": "extract(エクストラクト): 抽出する, mining(マイニング): 採掘",
        "category": "行動・概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "damage": {
        "word": "damage",
        "reading": "ダメージ",
        "meaning": "損害・傷害",
        "etymology": "ラテン語 damnum（損失）",
        "relatedWords": "harm(ハーム): 害, destroy(デストロイ): 破壊する",
        "category": "状態・行動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "excessive": {
        "word": "excessive",
        "reading": "エクセシブ",
        "meaning": "過度の・過剰な",
        "etymology": "ラテン語 excessus（超過）",
        "relatedWords": "excess(エクセス): 過剰, extreme(エクストリーム): 極端な",
        "category": "程度・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "pesticide": {
        "word": "pesticide",
        "reading": "ペスティサイド",
        "meaning": "農薬・殺虫剤",
        "etymology": "pest（害虫）+ -cide（殺すもの）",
        "relatedWords": "pest(ペスト): 害虫, herbicide(ハービサイド): 除草剤",
        "category": "科学・農業",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "fertilizer": {
        "word": "fertilizer",
        "reading": "ファーティライザー",
        "meaning": "肥料",
        "etymology": "fertile（肥沃な）+ -izer（〜するもの）",
        "relatedWords": "fertile(ファータイル): 肥沃な, fertilize(ファータライズ): 肥やす",
        "category": "農業・科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "insect": {
        "word": "insect",
        "reading": "インセクト",
        "meaning": "昆虫",
        "etymology": "ラテン語 insectum（切り込みのある）",
        "relatedWords": "bug(バグ): 虫, butterfly(バタフライ): 蝶",
        "category": "生物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "nutrient": {
        "word": "nutrient",
        "reading": "ニュートリエント",
        "meaning": "栄養素",
        "etymology": "ラテン語 nutriens（栄養を与える）",
        "relatedWords": "nutrition(ニュートリション): 栄養, nourish(ナリッシュ): 栄養を与える",
        "category": "科学・健康",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "pest": {
        "word": "pest",
        "reading": "ペスト",
        "meaning": "害虫・害獣",
        "etymology": "ラテン語 pestis（疫病）",
        "relatedWords": "pesticide(ペスティサイド): 農薬, vermin(ヴァーミン): 害虫",
        "category": "生物",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "synthetic": {
        "word": "synthetic",
        "reading": "シンセティック",
        "meaning": "合成の・人工の",
        "etymology": "ギリシャ語 synthetikos（組み合わせる）",
        "relatedWords": "synthesis(シンセシス): 合成, artificial(アーティフィシャル): 人工の",
        "category": "科学・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "rotation": {
        "word": "rotation",
        "reading": "ローテーション",
        "meaning": "回転・輪作",
        "etymology": "ラテン語 rotatio（回転）",
        "relatedWords": "rotate(ローテート): 回転する, revolve(リボルブ): 回る",
        "category": "運動・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "maintain": {
        "word": "maintain",
        "reading": "メインテイン",
        "meaning": "維持する・保つ",
        "etymology": "ラテン語 manu tenere（手で保つ）",
        "relatedWords": "maintenance(メインテナンス): 維持・保守, sustain(サステイン): 持続する",
        "category": "行動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "erosion": {
        "word": "erosion",
        "reading": "イロージョン",
        "meaning": "侵食・浸食",
        "etymology": "ラテン語 erosio（侵食）",
        "relatedWords": "erode(イロード): 侵食する, weathering(ウェザリング): 風化",
        "category": "自然・科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "preserve": {
        "word": "preserve",
        "reading": "プリザーブ",
        "meaning": "保存する・守る",
        "etymology": "ラテン語 praeservare（前もって守る）",
        "relatedWords": "conservation(コンサベーション): 保全, protect(プロテクト): 保護する",
        "category": "行動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "livestock": {
        "word": "livestock",
        "reading": "ライブストック",
        "meaning": "家畜",
        "etymology": "live（生きている）+ stock（蓄え）",
        "relatedWords": "cattle(キャトル): 牛, farm animal(ファーム アニマル): 家畜動物",
        "category": "農業・生物",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "fertilize": {
        "word": "fertilize",
        "reading": "ファータライズ",
        "meaning": "肥やす・受精させる",
        "etymology": "fertile（肥沃な）+ -ize（〜化する）",
        "relatedWords": "fertilizer(ファーティライザー): 肥料, fertile(ファータイル): 肥沃な",
        "category": "農業・生物",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "sequester": {
        "word": "sequester",
        "reading": "シークエスター",
        "meaning": "隔離する・貯蔵する",
        "etymology": "ラテン語 sequestrare（分離する）",
        "relatedWords": "sequestration(シークエストレーション): 隔離, isolate(アイソレート): 隔離する",
        "category": "行動・科学",
        "difficulty": "上級",
        "levels": ["上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "unused": {
        "word": "unused",
        "reading": "アンユーズド",
        "meaning": "未使用の・使われていない",
        "etymology": "un-（否定）+ used（使われた）",
        "relatedWords": "use(ユーズ): 使う, employed(エンプロイド): 使用される",
        "category": "状態",
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
    print("長文読解辞書 単語追加スクリプト（バッチ3）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ3: 農業・食品・環境関連の単語（{len(BATCH3_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH3_WORDS.items():
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
