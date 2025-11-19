#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ1）
Sustainable Societyパッセージの重要単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ1: 環境・エネルギー関連の基本単語）
BATCH1_WORDS = {
    "crisis": {
        "word": "crisis",
        "reading": "クライシス",
        "meaning": "危機",
        "etymology": "ギリシャ語 krisis（決定、転機）",
        "relatedWords": "crises(クライシーズ): 危機（複数形）, critical(クリティカル): 重大な",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "wildfires": {
        "word": "wildfire",
        "reading": "ワイルドファイア",
        "meaning": "山火事・野火",
        "etymology": "wild（野生の）+ fire（火）",
        "relatedWords": "fire(ファイア): 火, forest(フォレスト): 森",
        "category": "自然・環境",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": "wildfire"
    },
    "intensify": {
        "word": "intensify",
        "reading": "インテンシファイ",
        "meaning": "激化する・強める",
        "etymology": "intense（強烈な）+ -fy（〜化する）",
        "relatedWords": "intense(インテンス): 強烈な, intensity(インテンシティ): 強度",
        "category": "状態・変化",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "melting": {
        "word": "melt",
        "reading": "メルト",
        "meaning": "溶ける・溶かす",
        "etymology": "古英語 meltan",
        "relatedWords": "melting(メルティング): 溶けること（現在分詞）, melted(メルティッド): 溶けた（過去形）",
        "category": "状態・変化",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "disrupt": {
        "word": "disrupt",
        "reading": "ディスラプト",
        "meaning": "混乱させる・中断する",
        "etymology": "ラテン語 disrumpere（破壊する）",
        "relatedWords": "disruption(ディスラプション): 混乱, disruptive(ディスラプティブ): 破壊的な",
        "category": "行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "extinction": {
        "word": "extinction",
        "reading": "イクスティンクション",
        "meaning": "絶滅・消滅",
        "etymology": "extinct（絶滅した）+ -ion（名詞化）",
        "relatedWords": "extinct(イクスティンクト): 絶滅した, endanger(エンデンジャー): 危険にさらす",
        "category": "自然・環境",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "reef": {
        "word": "reef",
        "reading": "リーフ",
        "meaning": "岩礁・サンゴ礁",
        "etymology": "オランダ語 rif",
        "relatedWords": "coral reef(コーラル リーフ): サンゴ礁",
        "category": "自然・環境",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "dioxide": {
        "word": "dioxide",
        "reading": "ダイオキサイド",
        "meaning": "二酸化物",
        "etymology": "di-（二つの）+ oxide（酸化物）",
        "relatedWords": "carbon dioxide(カーボンダイオキサイド): 二酸化炭素, oxygen(オキシジェン): 酸素",
        "category": "科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "sunlight": {
        "word": "sunlight",
        "reading": "サンライト",
        "meaning": "日光・太陽光",
        "etymology": "sun（太陽）+ light（光）",
        "relatedWords": "sun(サン): 太陽, sunshine(サンシャイン): 日差し",
        "category": "自然・環境",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "dramatically": {
        "word": "dramatically",
        "reading": "ドラマティカリー",
        "meaning": "劇的に・急激に",
        "etymology": "dramatic（劇的な）+ -ly（副詞化）",
        "relatedWords": "dramatic(ドラマティック): 劇的な, drama(ドラマ): 劇",
        "category": "程度・様子",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": "dramatic"
    },
    "install": {
        "word": "install",
        "reading": "インストール",
        "meaning": "設置する・取り付ける",
        "etymology": "ラテン語 installare（配置する）",
        "relatedWords": "installation(インストレーション): 設置, installer(インストーラー): 設置者",
        "category": "行動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "turbine": {
        "word": "turbine",
        "reading": "タービン",
        "meaning": "タービン・発電機",
        "etymology": "ラテン語 turbo（回転）",
        "relatedWords": "wind turbine(ウィンド タービン): 風力タービン, generator(ジェネレーター): 発電機",
        "category": "科学・技術",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "flow": {
        "word": "flow",
        "reading": "フロー",
        "meaning": "流れる・流れ",
        "etymology": "古英語 flowan",
        "relatedWords": "flowing(フローイング): 流れている, river flow(リバー フロー): 川の流れ",
        "category": "状態・変化",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "mature": {
        "word": "mature",
        "reading": "マチュア",
        "meaning": "成熟した・大人の",
        "etymology": "ラテン語 maturus（熟した）",
        "relatedWords": "maturity(マチュリティ): 成熟, immature(イマチュア): 未熟な",
        "category": "状態・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "heavily": {
        "word": "heavily",
        "reading": "ヘビリー",
        "meaning": "重く・大量に",
        "etymology": "heavy（重い）+ -ly（副詞化）",
        "relatedWords": "heavy(ヘビー): 重い, weight(ウェイト): 重さ",
        "category": "程度・様子",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": "heavy"
    },
    "hydropower": {
        "word": "hydropower",
        "reading": "ハイドロパワー",
        "meaning": "水力発電",
        "etymology": "hydro-（水の）+ power（力）",
        "relatedWords": "hydro(ハイドロ): 水の, power(パワー): 力・電力",
        "category": "科学・技術",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "tap": {
        "word": "tap",
        "reading": "タップ",
        "meaning": "蛇口・軽くたたく",
        "etymology": "古英語 tæppa",
        "relatedWords": "faucet(フォーセット): 蛇口, water tap(ウォーター タップ): 水道の蛇口",
        "category": "物・道具",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "organic": {
        "word": "organic",
        "reading": "オーガニック",
        "meaning": "有機の・オーガニックの",
        "etymology": "ギリシャ語 organikos（器官の）",
        "relatedWords": "organism(オーガニズム): 生物, organize(オーガナイズ): 組織する",
        "category": "科学・自然",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "diversify": {
        "word": "diversify",
        "reading": "ダイバーシファイ",
        "meaning": "多様化する",
        "etymology": "diverse（多様な）+ -fy（〜化する）",
        "relatedWords": "diverse(ダイバース): 多様な, diversity(ダイバーシティ): 多様性",
        "category": "状態・変化",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": None
    },
    "renewable": {
        "word": "renewable",
        "reading": "リニューアブル",
        "meaning": "再生可能な",
        "etymology": "renew（更新する）+ -able（可能な）",
        "relatedWords": "renew(リニュー): 更新する, renewal(リニューアル): 更新",
        "category": "科学・環境",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual",
        "baseWord": "renew"
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
    print("長文読解辞書 単語追加スクリプト（バッチ1）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ1: 環境・エネルギー関連の基本単語（{len(BATCH1_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH1_WORDS.items():
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
