#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ18: 環境・科学・社会関連の重要単語
BATCH_WORDS = {
    "ecological": {
        "word": "ecological",
        "reading": "エコロジカル",
        "meaning": "生態学的な・環境の",
        "etymology": "ecology（生態学）+ -ical（〜の）← ギリシャ語 oikos（家）",
        "relatedWords": ["ecology", "environment", "natural", "sustainable"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Environment"],
        "source": "batch18"
    },
    "ecosystem": {
        "word": "ecosystem",
        "reading": "エコシステム",
        "meaning": "生態系",
        "etymology": "eco-（生態）+ system（系）← ギリシャ語 oikos（家）",
        "relatedWords": ["environment", "habitat", "nature", "biology"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Environment"],
        "source": "batch18"
    },
    "endangered": {
        "word": "endangered",
        "reading": "エンデンジャード",
        "meaning": "絶滅危惧の・危険にさらされた",
        "etymology": "en-（〜にする）+ danger（危険）+ -ed（形容詞）",
        "relatedWords": ["danger", "threatened", "risk", "vulnerable"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Environment"],
        "source": "batch18"
    },
    "emissions": {
        "word": "emissions",
        "reading": "エミッションズ",
        "meaning": "排出・排出物（emissionの複数形）",
        "etymology": "emit（排出する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["emit", "pollution", "carbon", "greenhouse"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Environment"],
        "source": "batch18"
    },
    "genetic": {
        "word": "genetic",
        "reading": "ジェネティック",
        "meaning": "遺伝的な・遺伝子の",
        "etymology": "gene（遺伝子）+ -tic（〜の）← ギリシャ語 genesis（起源）",
        "relatedWords": ["gene", "DNA", "hereditary", "biological"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch18"
    },
    "mathematical": {
        "word": "mathematical",
        "reading": "マスマティカル",
        "meaning": "数学的な",
        "etymology": "mathematics（数学）+ -al（〜の）← ギリシャ語 mathema（学習）",
        "relatedWords": ["mathematics", "math", "calculation", "numerical"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Mathematics"],
        "source": "batch18"
    },
    "empathy": {
        "word": "empathy",
        "reading": "エンパシー",
        "meaning": "共感・感情移入",
        "etymology": "ギリシャ語 empatheia（感情）← em-（中に）+ pathos（感情）",
        "relatedWords": ["sympathy", "compassion", "understanding", "feeling"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Psychology"],
        "source": "batch18"
    },
    "ethics": {
        "word": "ethics",
        "reading": "エシックス",
        "meaning": "倫理・倫理学",
        "etymology": "ギリシャ語 ethikos（道徳的な）← ethos（性格・習慣）",
        "relatedWords": ["moral", "values", "principles", "philosophy"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Philosophy"],
        "source": "batch18"
    },
    "racism": {
        "word": "racism",
        "reading": "レイシズム",
        "meaning": "人種差別・人種主義",
        "etymology": "race（人種）+ -ism（主義）",
        "relatedWords": ["racial", "discrimination", "prejudice", "bias"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Issues"],
        "source": "batch18"
    },
    "racial": {
        "word": "racial",
        "reading": "レイシャル",
        "meaning": "人種の・人種的な",
        "etymology": "race（人種）+ -ial（〜の）",
        "relatedWords": ["race", "ethnic", "discrimination", "diversity"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Issues"],
        "source": "batch18"
    },
    "ethnicity": {
        "word": "ethnicity",
        "reading": "エスニシティ",
        "meaning": "民族性・民族的帰属",
        "etymology": "ethnic（民族の）+ -ity（性質）← ギリシャ語 ethnos（民族）",
        "relatedWords": ["ethnic", "culture", "heritage", "identity"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Social Studies"],
        "source": "batch18"
    },
    "governance": {
        "word": "governance",
        "reading": "ガバナンス",
        "meaning": "統治・管理・運営",
        "etymology": "govern（統治する）+ -ance（名詞）← ラテン語 gubernare",
        "relatedWords": ["government", "administration", "management", "control"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Politics"],
        "source": "batch18"
    },
    "initiatives": {
        "word": "initiatives",
        "reading": "イニシアティヴズ",
        "meaning": "主導権・率先（initiativeの複数形）",
        "etymology": "initiate（始める）+ -ive（名詞）+ -s（複数）",
        "relatedWords": ["initiative", "leadership", "action", "project"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Business"],
        "source": "batch18"
    },
    "resilience": {
        "word": "resilience",
        "reading": "レジリエンス",
        "meaning": "回復力・復元力",
        "etymology": "ラテン語 resilire（跳ね返る）← re-（戻る）+ salire（跳ぶ）",
        "relatedWords": ["resilient", "strength", "recovery", "endurance"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Psychology"],
        "source": "batch18"
    },
    "resilient": {
        "word": "resilient",
        "reading": "レジリエント",
        "meaning": "回復力のある・立ち直りの早い",
        "etymology": "ラテン語 resilire（跳ね返る）← re-（戻る）+ salire（跳ぶ）",
        "relatedWords": ["resilience", "strong", "flexible", "adaptable"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Psychology"],
        "source": "batch18"
    },
    "vulnerability": {
        "word": "vulnerability",
        "reading": "ヴァルネラビリティ",
        "meaning": "脆弱性・傷つきやすさ",
        "etymology": "vulnerable（傷つきやすい）+ -ity（性質）← ラテン語 vulnerare（傷つける）",
        "relatedWords": ["vulnerable", "weakness", "risk", "exposure"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Security"],
        "source": "batch18"
    },
    "vulnerabilities": {
        "word": "vulnerabilities",
        "reading": "ヴァルネラビリティーズ",
        "meaning": "脆弱性（vulnerabilityの複数形）",
        "etymology": "vulnerability（脆弱性）+ -s（複数）",
        "relatedWords": ["vulnerable", "weakness", "security", "risk"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Security"],
        "source": "batch18"
    },
    "encryption": {
        "word": "encryption",
        "reading": "エンクリプション",
        "meaning": "暗号化",
        "etymology": "encrypt（暗号化する）+ -ion（名詞）← ギリシャ語 kryptos（隠された）",
        "relatedWords": ["encrypt", "security", "code", "privacy"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Technology"],
        "source": "batch18"
    },
    "cryptography": {
        "word": "cryptography",
        "reading": "クリプトグラフィ",
        "meaning": "暗号法・暗号学",
        "etymology": "ギリシャ語 kryptos（隠された）+ graphia（書くこと）",
        "relatedWords": ["encryption", "security", "code", "cipher"],
        "category": "名詞",
        "difficulty": "上級",
        "levels": ["高校2年", "英検準1級"],
        "passages": ["Technology"],
        "source": "batch18"
    },
    "mindset": {
        "word": "mindset",
        "reading": "マインドセット",
        "meaning": "考え方・心構え",
        "etymology": "mind（心）+ set（設定）",
        "relatedWords": ["attitude", "mentality", "perspective", "outlook"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Psychology"],
        "source": "batch18"
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
    print("長文読解辞書 単語追加スクリプト（バッチ18）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ18の単語を追加
    print(f"📝 バッチ18: 環境・科学・社会関連の重要単語（{len(BATCH_WORDS)}個）を追加中...")
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
