#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ2）
循環経済・持続可能性関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ2: 循環経済・持続可能性関連）
BATCH2_WORDS = {
    "linear": {
        "word": "linear",
        "reading": "リニア",
        "meaning": "直線的な・線形の",
        "etymology": "ラテン語 linearis（線の）",
        "relatedWords": "line(ライン): 線, nonlinear(ノンリニア): 非線形の",
        "category": "形状・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "discard": {
        "word": "discard",
        "reading": "ディスカード",
        "meaning": "捨てる・破棄する",
        "etymology": "dis-（離れて）+ card（カード）",
        "relatedWords": "dispose(ディスポーズ): 処分する, throw away(スロー アウェイ): 捨てる",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "unsustainable": {
        "word": "unsustainable",
        "reading": "アンサステイナブル",
        "meaning": "持続不可能な",
        "etymology": "un-（否定）+ sustainable（持続可能な）",
        "relatedWords": "sustainable(サステイナブル): 持続可能な, sustain(サステイン): 維持する",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "deplete": {
        "word": "deplete",
        "reading": "ディプリート",
        "meaning": "枯渇させる・使い果たす",
        "etymology": "ラテン語 deplere（空にする）",
        "relatedWords": "depletion(ディプリーション): 枯渇, depleted(ディプリーティッド): 枯渇した",
        "category": "状態・変化",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "finite": {
        "word": "finite",
        "reading": "ファイナイト",
        "meaning": "有限の・限りある",
        "etymology": "ラテン語 finitus（限られた）",
        "relatedWords": "infinite(インフィニット): 無限の, finish(フィニッシュ): 終わる",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "circular": {
        "word": "circular",
        "reading": "サーキュラー",
        "meaning": "循環的な・円形の",
        "etymology": "ラテン語 circularis（円の）",
        "relatedWords": "circle(サークル): 円, circulate(サーキュレート): 循環する",
        "category": "形状・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "durability": {
        "word": "durability",
        "reading": "デュラビリティ",
        "meaning": "耐久性・持続性",
        "etymology": "durable（耐久性のある）+ -ity（名詞化）",
        "relatedWords": "durable(デュラブル): 耐久性のある, endure(エンデュア): 耐える",
        "category": "性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "input": {
        "word": "input",
        "reading": "インプット",
        "meaning": "入力・投入",
        "etymology": "in（中へ）+ put（置く）",
        "relatedWords": "output(アウトプット): 出力, import(インポート): 輸入",
        "category": "行動・概念",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "indefinitely": {
        "word": "indefinitely",
        "reading": "インデフィニットリー",
        "meaning": "無期限に・不定に",
        "etymology": "indefinite（不定の）+ -ly（副詞化）",
        "relatedWords": "indefinite(インデフィニット): 不定の, definite(デフィニット): 明確な",
        "category": "時間・程度",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mimic": {
        "word": "mimic",
        "reading": "ミミック",
        "meaning": "真似る・模倣する",
        "etymology": "ギリシャ語 mimos（真似る人）",
        "relatedWords": "imitate(イミテート): 模倣する, copy(コピー): 複製する",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "organism": {
        "word": "organism",
        "reading": "オーガニズム",
        "meaning": "生物・有機体",
        "etymology": "ギリシャ語 organon（器官）",
        "relatedWords": "organic(オーガニック): 有機の, organize(オーガナイズ): 組織する",
        "category": "生物・科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "bulb": {
        "word": "bulb",
        "reading": "バルブ",
        "meaning": "電球・球根",
        "etymology": "ラテン語 bulbus（球根）",
        "relatedWords": "light bulb(ライト バルブ): 電球, lamp(ランプ): ランプ",
        "category": "物・道具",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "ownership": {
        "word": "ownership",
        "reading": "オーナーシップ",
        "meaning": "所有権・所有",
        "etymology": "owner（所有者）+ -ship（状態）",
        "relatedWords": "owner(オーナー): 所有者, own(オウン): 所有する",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "incentivize": {
        "word": "incentivize",
        "reading": "インセンティバイズ",
        "meaning": "動機付ける・奨励する",
        "etymology": "incentive（動機）+ -ize（〜化する）",
        "relatedWords": "incentive(インセンティブ): 動機・奨励金, motivate(モチベート): 動機付ける",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "platform": {
        "word": "platform",
        "reading": "プラットフォーム",
        "meaning": "基盤・プラットフォーム",
        "etymology": "フランス語 plate-forme（平らな形）",
        "relatedWords": "base(ベース): 基礎, foundation(ファンデーション): 基盤",
        "category": "物・概念",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "borrow": {
        "word": "borrow",
        "reading": "ボロー",
        "meaning": "借りる",
        "etymology": "古英語 borgian",
        "relatedWords": "lend(レンド): 貸す, loan(ローン): 貸付",
        "category": "行動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "cafe": {
        "word": "cafe",
        "reading": "カフェ",
        "meaning": "カフェ・喫茶店",
        "etymology": "フランス語 café（コーヒー）",
        "relatedWords": "restaurant(レストラン): レストラン, coffee(コーヒー): コーヒー",
        "category": "場所",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "broken": {
        "word": "break",
        "reading": "ブレイク",
        "meaning": "壊す・壊れる",
        "etymology": "古英語 brecan",
        "relatedWords": "broken(ブロークン): 壊れた, fracture(フラクチャー): 骨折",
        "category": "状態・変化",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "lifespan": {
        "word": "lifespan",
        "reading": "ライフスパン",
        "meaning": "寿命・耐用年数",
        "etymology": "life（生命）+ span（期間）",
        "relatedWords": "lifetime(ライフタイム): 生涯, longevity(ロンジェビティ): 長寿",
        "category": "時間・期間",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "instruction": {
        "word": "instruction",
        "reading": "インストラクション",
        "meaning": "指示・説明",
        "etymology": "ラテン語 instructio（配置）",
        "relatedWords": "instruct(インストラクト): 指導する, instructor(インストラクター): 指導者",
        "category": "行動・概念",
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
    print("長文読解辞書 単語追加スクリプト（バッチ2）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ2: 循環経済・持続可能性関連の単語（{len(BATCH2_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH2_WORDS.items():
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
