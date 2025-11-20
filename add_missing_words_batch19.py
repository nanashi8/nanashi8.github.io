#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ19: 社会・医療・技術関連の派生語と重要単語
BATCH_WORDS = {
    "disabilities": {
        "word": "disabilities",
        "reading": "ディスアビリティーズ",
        "meaning": "障害・障がい（disabilityの複数形）",
        "etymology": "dis-（否定）+ ability（能力）+ -ies（複数）",
        "relatedWords": ["disability", "handicap", "impairment", "challenge"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Issues"],
        "source": "batch19"
    },
    "disabled": {
        "word": "disabled",
        "reading": "ディスエイブルド",
        "meaning": "障害のある・無効にされた",
        "etymology": "dis-（否定）+ able（できる）+ -ed（形容詞）",
        "relatedWords": ["disability", "handicapped", "impaired", "enable"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Social Issues"],
        "source": "batch19"
    },
    "immigrants": {
        "word": "immigrants",
        "reading": "イミグランツ",
        "meaning": "移民（immigrantの複数形）",
        "etymology": "immigrate（移住する）+ -ant（人）+ -s（複数）",
        "relatedWords": ["immigration", "migrate", "refugee", "settler"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Studies"],
        "source": "batch19"
    },
    "refugees": {
        "word": "refugees",
        "reading": "レフュジーズ",
        "meaning": "難民（refugeeの複数形）",
        "etymology": "refuge（避難所）+ -ee（される人）+ -s（複数）",
        "relatedWords": ["refugee", "asylum", "displaced", "immigrant"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Issues"],
        "source": "batch19"
    },
    "minorities": {
        "word": "minorities",
        "reading": "マイノリティーズ",
        "meaning": "少数派・マイノリティ（minorityの複数形）",
        "etymology": "minority（少数派）+ -es（複数）← minor（より小さい）",
        "relatedWords": ["minority", "majority", "group", "diversity"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Studies"],
        "source": "batch19"
    },
    "medications": {
        "word": "medications",
        "reading": "メディケーションズ",
        "meaning": "薬・医薬品（medicationの複数形）",
        "etymology": "medicate（薬を与える）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["medicine", "drug", "treatment", "prescription"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Health"],
        "source": "batch19"
    },
    "therapies": {
        "word": "therapies",
        "reading": "セラピーズ",
        "meaning": "療法・治療（therapyの複数形）",
        "etymology": "therapy（療法）+ -es（複数）← ギリシャ語 therapeia（治療）",
        "relatedWords": ["therapy", "treatment", "healing", "counseling"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Health"],
        "source": "batch19"
    },
    "therapists": {
        "word": "therapists",
        "reading": "セラピスト",
        "meaning": "セラピスト・療法士（therapistの複数形）",
        "etymology": "therapy（療法）+ -ist（する人）+ -s（複数）",
        "relatedWords": ["therapy", "counselor", "psychologist", "healer"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Health"],
        "source": "batch19"
    },
    "infections": {
        "word": "infections",
        "reading": "インフェクションズ",
        "meaning": "感染症・感染（infectionの複数形）",
        "etymology": "infect（感染させる）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["infect", "disease", "virus", "bacteria"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Health"],
        "source": "batch19"
    },
    "symptoms": {
        "word": "symptoms",
        "reading": "シンプトムズ",
        "meaning": "症状（symptomの複数形）",
        "etymology": "symptom（症状）+ -s（複数）← ギリシャ語 symptoma（偶発事）",
        "relatedWords": ["symptom", "sign", "indication", "disease"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Health"],
        "source": "batch19"
    },
    "diagnose": {
        "word": "diagnose",
        "reading": "ダイアグノウズ",
        "meaning": "診断する",
        "etymology": "ギリシャ語 diagnosis（識別）← dia-（通して）+ gnosis（知識）",
        "relatedWords": ["diagnosis", "detect", "identify", "examine"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Health"],
        "source": "batch19"
    },
    "circulation": {
        "word": "circulation",
        "reading": "サーキュレーション",
        "meaning": "循環・流通",
        "etymology": "circulate（循環する）+ -ion（名詞）← ラテン語 circulus（円）",
        "relatedWords": ["circulate", "flow", "blood", "distribution"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch19"
    },
    "digestion": {
        "word": "digestion",
        "reading": "ダイジェスチョン",
        "meaning": "消化",
        "etymology": "digest（消化する）+ -ion（名詞）← ラテン語 digerere（分解する）",
        "relatedWords": ["digest", "stomach", "food", "nutrition"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch19"
    },
    "datasets": {
        "word": "datasets",
        "reading": "データセッツ",
        "meaning": "データセット（datasetの複数形）",
        "etymology": "data（データ）+ set（セット）+ -s（複数）",
        "relatedWords": ["data", "database", "information", "collection"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch19"
    },
    "interfaces": {
        "word": "interfaces",
        "reading": "インターフェイシズ",
        "meaning": "インターフェース・接点（interfaceの複数形）",
        "etymology": "inter-（間）+ face（面）+ -s（複数）",
        "relatedWords": ["interface", "connection", "interaction", "system"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch19"
    },
    "mechanisms": {
        "word": "mechanisms",
        "reading": "メカニズムズ",
        "meaning": "仕組み・機構（mechanismの複数形）",
        "etymology": "mechanism（仕組み）+ -s（複数）← ギリシャ語 mechane（機械）",
        "relatedWords": ["mechanism", "system", "process", "structure"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch19"
    },
    "techniques": {
        "word": "techniques",
        "reading": "テクニークス",
        "meaning": "技術・技法（techniqueの複数形）",
        "etymology": "technique（技術）+ -s（複数）← ギリシャ語 techne（技術）",
        "relatedWords": ["technique", "method", "skill", "procedure"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch19"
    },
    "strategies": {
        "word": "strategies",
        "reading": "ストラテジーズ",
        "meaning": "戦略（strategyの複数形）",
        "etymology": "strategy（戦略）+ -es（複数）← ギリシャ語 strategia（将軍の技術）",
        "relatedWords": ["strategy", "plan", "tactics", "approach"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Business"],
        "source": "batch19"
    },
    "transitions": {
        "word": "transitions",
        "reading": "トランジションズ",
        "meaning": "移行・転換（transitionの複数形）",
        "etymology": "transition（移行）+ -s（複数）← ラテン語 transire（渡る）",
        "relatedWords": ["transition", "change", "shift", "transformation"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch19"
    },
    "interactions": {
        "word": "interactions",
        "reading": "インタラクションズ",
        "meaning": "相互作用・交流（interactionの複数形）",
        "etymology": "interact（相互作用する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["interact", "communication", "exchange", "relationship"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch19"
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
    print("長文読解辞書 単語追加スクリプト（バッチ19）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ19の単語を追加
    print(f"📝 バッチ19: 社会・医療・技術関連の派生語と重要単語（{len(BATCH_WORDS)}個）を追加中...")
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
