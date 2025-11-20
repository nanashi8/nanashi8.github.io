#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ23: 残りの重要単語（名詞・動詞・形容詞）
BATCH_WORDS = {
    "empower": {
        "word": "empower",
        "reading": "エンパワー",
        "meaning": "力を与える・権限を与える",
        "etymology": "em-（〜にする）+ power（力）",
        "relatedWords": ["power", "enable", "authorize", "strengthen"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Studies"],
        "source": "batch23"
    },
    "innovate": {
        "word": "innovate",
        "reading": "イノヴェイト",
        "meaning": "革新する・新しいものを取り入れる",
        "etymology": "ラテン語 innovare（新しくする）← in-（中に）+ novus（新しい）",
        "relatedWords": ["innovation", "create", "develop", "improve"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch23"
    },
    "revolutionize": {
        "word": "revolutionize",
        "reading": "レヴォリューショナイズ",
        "meaning": "革命を起こす・大変革をもたらす",
        "etymology": "revolution（革命）+ -ize（〜化する）",
        "relatedWords": ["revolution", "transform", "change", "reform"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["History"],
        "source": "batch23"
    },
    "exacerbate": {
        "word": "exacerbate",
        "reading": "イグザサーベイト",
        "meaning": "悪化させる・激化させる",
        "etymology": "ラテン語 exacerbare（激怒させる）← ex-（外へ）+ acerbus（苦い）",
        "relatedWords": ["worsen", "aggravate", "intensify", "escalate"],
        "category": "動詞",
        "difficulty": "上級",
        "levels": ["高校2年", "英検準1級"],
        "passages": ["General"],
        "source": "batch23"
    },
    "contextualize": {
        "word": "contextualize",
        "reading": "コンテクスチュアライズ",
        "meaning": "文脈に位置づける・背景を説明する",
        "etymology": "context（文脈）+ -ualize（〜化する）",
        "relatedWords": ["context", "explain", "interpret", "frame"],
        "category": "動詞",
        "difficulty": "上級",
        "levels": ["高校2年", "英検準1級"],
        "passages": ["Academic"],
        "source": "batch23"
    },
    "integrity": {
        "word": "integrity",
        "reading": "インテグリティ",
        "meaning": "誠実さ・完全性",
        "etymology": "ラテン語 integritas（完全）← integer（完全な）",
        "relatedWords": ["honesty", "wholeness", "completeness", "virtue"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Ethics"],
        "source": "batch23"
    },
    "expertise": {
        "word": "expertise",
        "reading": "エクスパティーズ",
        "meaning": "専門知識・専門技術",
        "etymology": "フランス語 expertise（専門家の意見）← expert（専門家）",
        "relatedWords": ["expert", "skill", "knowledge", "proficiency"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Business"],
        "source": "batch23"
    },
    "momentum": {
        "word": "momentum",
        "reading": "モメンタム",
        "meaning": "勢い・運動量",
        "etymology": "ラテン語 momentum（動き）← movere（動く）",
        "relatedWords": ["force", "impulse", "drive", "energy"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch23"
    },
    "rhetoric": {
        "word": "rhetoric",
        "reading": "レトリック",
        "meaning": "修辞学・美辞麗句",
        "etymology": "ギリシャ語 rhetorike（弁論術）← rhetor（演説家）",
        "relatedWords": ["speech", "eloquence", "persuasion", "oratory"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Literature"],
        "source": "batch23"
    },
    "tolerance": {
        "word": "tolerance",
        "reading": "トレランス",
        "meaning": "寛容・耐性",
        "etymology": "ラテン語 tolerantia（忍耐）← tolerare（耐える）",
        "relatedWords": ["acceptance", "patience", "endurance", "understanding"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Studies"],
        "source": "batch23"
    },
    "solidarity": {
        "word": "solidarity",
        "reading": "ソリダリティ",
        "meaning": "連帯・団結",
        "etymology": "フランス語 solidarité（連帯）← solidaire（連帯した）",
        "relatedWords": ["unity", "cooperation", "fellowship", "support"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Social Studies"],
        "source": "batch23"
    },
    "sovereignty": {
        "word": "sovereignty",
        "reading": "ソヴリンティ",
        "meaning": "主権・統治権",
        "etymology": "古フランス語 souveraineté（最高権力）← souverain（最高の）",
        "relatedWords": ["authority", "independence", "power", "supremacy"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Politics"],
        "source": "batch23"
    },
    "entrepreneurship": {
        "word": "entrepreneurship",
        "reading": "アントレプレナーシップ",
        "meaning": "起業家精神・企業家活動",
        "etymology": "entrepreneur（起業家）+ -ship（状態）← フランス語 entreprendre",
        "relatedWords": ["entrepreneur", "business", "innovation", "enterprise"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Business"],
        "source": "batch23"
    },
    "mobility": {
        "word": "mobility",
        "reading": "モビリティ",
        "meaning": "移動性・機動性",
        "etymology": "mobile（可動の）+ -ity（性質）← ラテン語 mobilis",
        "relatedWords": ["movement", "flexibility", "transportation", "migration"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Transportation"],
        "source": "batch23"
    },
    "credibility": {
        "word": "credibility",
        "reading": "クレディビリティ",
        "meaning": "信頼性・信憑性",
        "etymology": "credible（信頼できる）+ -ity（性質）← ラテン語 credere（信じる）",
        "relatedWords": ["credible", "trustworthiness", "reliability", "believability"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch23"
    },
    "transparency": {
        "word": "transparency",
        "reading": "トランスペアレンシー",
        "meaning": "透明性・明瞭さ",
        "etymology": "transparent（透明な）+ -cy（性質）← ラテン語 transparere",
        "relatedWords": ["transparent", "openness", "clarity", "honesty"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Politics"],
        "source": "batch23"
    },
    "viability": {
        "word": "viability",
        "reading": "ヴァイアビリティ",
        "meaning": "実行可能性・生存能力",
        "etymology": "viable（実行可能な）+ -ity（性質）← ラテン語 vita（生命）",
        "relatedWords": ["viable", "feasibility", "practicality", "sustainability"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Business"],
        "source": "batch23"
    },
    "morality": {
        "word": "morality",
        "reading": "モラリティ",
        "meaning": "道徳性・倫理",
        "etymology": "moral（道徳的な）+ -ity（性質）← ラテン語 moralis",
        "relatedWords": ["moral", "ethics", "virtue", "righteousness"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Philosophy"],
        "source": "batch23"
    },
    "poverty": {
        "word": "poverty",
        "reading": "ポヴァティ",
        "meaning": "貧困・欠乏",
        "etymology": "古フランス語 poverte ← ラテン語 paupertas（貧困）",
        "relatedWords": ["poor", "hardship", "need", "deprivation"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Social Issues"],
        "source": "batch23"
    },
    "injustice": {
        "word": "injustice",
        "reading": "インジャスティス",
        "meaning": "不正・不公平",
        "etymology": "in-（否定）+ justice（正義）← ラテン語 iustitia",
        "relatedWords": ["justice", "unfairness", "wrong", "inequality"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Issues"],
        "source": "batch23"
    }
}

def load_dictionary():
    """既存の辞書を読み込む"""
    try:
        with open('public/data/reading-passages-dictionary.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠ 辞書ファイルが見つかりません")
        return {}

def save_dictionary(dictionary):
    """辞書を保存"""
    with open('public/data/reading-passages-dictionary.json', 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)

def main():
    print("=" * 60)
    print("長文読解辞書 単語追加スクリプト（バッチ23）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ23の単語を追加
    print(f"📝 バッチ23: 残りの重要単語（名詞・動詞・形容詞）（{len(BATCH_WORDS)}個）を追加中...")
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
    
    # 保存
    save_dictionary(dictionary)
    print(f"✓ public/data/reading-passages-dictionary.json を保存しました")
    print()
    
    # 結果を表示
    new_count = len(dictionary)
    print(f"✅ {added_count}個の単語を辞書に追加しました")
    print(f"   スキップ: {skipped_count}個")
    print(f"   新しい単語数: {new_count} (元: {original_count})")
    print()
    print("=" * 60)
    print("完了")
    print("=" * 60)

if __name__ == "__main__":
    main()
