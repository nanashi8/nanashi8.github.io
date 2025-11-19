#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ7）
健康・医療・生活習慣関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ7: 健康・医療・生活習慣関連）
BATCH7_WORDS = {
    "healthcare": {
        "word": "healthcare",
        "reading": "ヘルスケア",
        "meaning": "健康管理・医療",
        "etymology": "health（健康）+ care（ケア）",
        "relatedWords": "health(ヘルス): 健康, medical(メディカル): 医療の",
        "category": "健康・医療",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "healthier": {
        "word": "healthier",
        "reading": "ヘルシアー",
        "meaning": "より健康的な",
        "etymology": "healthy（健康な）の比較級",
        "relatedWords": "healthy(ヘルシー): 健康な, healthiest(ヘルシエスト): 最も健康な",
        "category": "健康",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "unhealthy": {
        "word": "unhealthy",
        "reading": "アンヘルシー",
        "meaning": "不健康な",
        "etymology": "un-（否定）+ healthy（健康な）",
        "relatedWords": "healthy(ヘルシー): 健康な, illness(イルネス): 病気",
        "category": "健康",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "nutrition": {
        "word": "nutrition",
        "reading": "ニュートリション",
        "meaning": "栄養・栄養学",
        "etymology": "ラテン語 nutritio（養う）",
        "relatedWords": "nutritious(ニュートリシャス): 栄養のある, diet(ダイエット): 食事",
        "category": "健康・食事",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "nutritious": {
        "word": "nutritious",
        "reading": "ニュートリシャス",
        "meaning": "栄養のある・栄養価の高い",
        "etymology": "nutrition（栄養）+ -ous（形容詞化）",
        "relatedWords": "nutrition(ニュートリション): 栄養, healthy(ヘルシー): 健康な",
        "category": "健康・食事",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "illness": {
        "word": "illness",
        "reading": "イルネス",
        "meaning": "病気",
        "etymology": "ill（病気の）+ -ness（名詞化）",
        "relatedWords": "disease(ディジーズ): 疾病, sick(シック): 病気の",
        "category": "健康・医療",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "obesity": {
        "word": "obesity",
        "reading": "オビーシティ",
        "meaning": "肥満",
        "etymology": "ラテン語 obesitas（太った状態）",
        "relatedWords": "obese(オビース): 肥満の, overweight(オーバーウェイト): 太り気味の",
        "category": "健康",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "diabetes": {
        "word": "diabetes",
        "reading": "ダイアビーティーズ",
        "meaning": "糖尿病",
        "etymology": "ギリシャ語 diabetes（通り抜ける）",
        "relatedWords": "disease(ディジーズ): 病気, insulin(インスリン): インスリン",
        "category": "医療・病気",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "cancer": {
        "word": "cancer",
        "reading": "キャンサー",
        "meaning": "がん・癌",
        "etymology": "ラテン語 cancer（蟹）",
        "relatedWords": "tumor(チューマー): 腫瘍, disease(ディジーズ): 病気",
        "category": "医療・病気",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "therapy": {
        "word": "therapy",
        "reading": "セラピー",
        "meaning": "治療・療法",
        "etymology": "ギリシャ語 therapeia（治療）",
        "relatedWords": "therapist(セラピスト): 療法士, treatment(トリートメント): 治療",
        "category": "医療",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mental": {
        "word": "mental",
        "reading": "メンタル",
        "meaning": "精神的な・心の",
        "etymology": "ラテン語 mentalis（心の）",
        "relatedWords": "mind(マインド): 心, psychological(サイコロジカル): 心理的な",
        "category": "心理・健康",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "workout": {
        "word": "workout",
        "reading": "ワークアウト",
        "meaning": "運動・トレーニング",
        "etymology": "work（働く）+ out（外に）",
        "relatedWords": "exercise(エクササイズ): 運動, training(トレーニング): 訓練",
        "category": "運動・健康",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "yoga": {
        "word": "yoga",
        "reading": "ヨガ",
        "meaning": "ヨガ",
        "etymology": "サンスクリット語 yoga（結合）",
        "relatedWords": "meditation(メディテーション): 瞑想, exercise(エクササイズ): 運動",
        "category": "運動・健康",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "marathon": {
        "word": "marathon",
        "reading": "マラソン",
        "meaning": "マラソン",
        "etymology": "ギリシャの地名 Marathon",
        "relatedWords": "race(レース): 競走, running(ランニング): 走ること",
        "category": "運動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "stamina": {
        "word": "stamina",
        "reading": "スタミナ",
        "meaning": "持久力・体力",
        "etymology": "ラテン語 stamina（命の糸）",
        "relatedWords": "endurance(エンデュランス): 持久力, energy(エナジー): エネルギー",
        "category": "運動・体力",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "protein": {
        "word": "protein",
        "reading": "プロテイン",
        "meaning": "タンパク質",
        "etymology": "ギリシャ語 proteios（第一の）",
        "relatedWords": "nutrient(ニュートリエント): 栄養素, carbohydrate(カーボハイドレート): 炭水化物",
        "category": "栄養",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "vitamin": {
        "word": "vitamin",
        "reading": "ビタミン",
        "meaning": "ビタミン",
        "etymology": "ラテン語 vita（生命）+ amine（アミン）",
        "relatedWords": "mineral(ミネラル): ミネラル, nutrient(ニュートリエント): 栄養素",
        "category": "栄養",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "calcium": {
        "word": "calcium",
        "reading": "カルシウム",
        "meaning": "カルシウム",
        "etymology": "ラテン語 calx（石灰）",
        "relatedWords": "mineral(ミネラル): ミネラル, bone(ボーン): 骨",
        "category": "栄養・化学",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "immune": {
        "word": "immune",
        "reading": "イミューン",
        "meaning": "免疫の・免疫がある",
        "etymology": "ラテン語 immunis（免除された）",
        "relatedWords": "immunity(イミュニティ): 免疫, antibody(アンティボディ): 抗体",
        "category": "医療・健康",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "hygiene": {
        "word": "hygiene",
        "reading": "ハイジーン",
        "meaning": "衛生",
        "etymology": "ギリシャ語 Hygieia（健康の女神）",
        "relatedWords": "sanitation(サニテーション): 衛生設備, cleanliness(クリーンリネス): 清潔",
        "category": "健康・衛生",
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
    print("長文読解辞書 単語追加スクリプト（バッチ7）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ7: 健康・医療・生活習慣関連の単語（{len(BATCH7_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH7_WORDS.items():
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
