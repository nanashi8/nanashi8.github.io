#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ21: 名詞の複数形・派生語・一般的な単語
BATCH_WORDS = {
    "distributions": {
        "word": "distributions",
        "reading": "ディストリビューションズ",
        "meaning": "配分・流通（distributionの複数形）",
        "etymology": "distribute（配分する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["distribution", "spread", "allocation", "delivery"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Economics"],
        "source": "batch21"
    },
    "relationships": {
        "word": "relationships",
        "reading": "リレーションシップス",
        "meaning": "関係（relationshipの複数形）",
        "etymology": "relation（関係）+ -ship（状態）+ -s（複数）",
        "relatedWords": ["relationship", "connection", "bond", "association"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Social Studies"],
        "source": "batch21"
    },
    "partnerships": {
        "word": "partnerships",
        "reading": "パートナーシップス",
        "meaning": "提携・協力関係（partnershipの複数形）",
        "etymology": "partner（パートナー）+ -ship（状態）+ -s（複数）",
        "relatedWords": ["partnership", "collaboration", "alliance", "cooperation"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Business"],
        "source": "batch21"
    },
    "schedules": {
        "word": "schedules",
        "reading": "スケジュールズ",
        "meaning": "予定表・スケジュール（scheduleの複数形）",
        "etymology": "schedule（予定表）+ -s（複数）← ラテン語 schedula（小さな紙）",
        "relatedWords": ["schedule", "timetable", "plan", "agenda"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Daily Life"],
        "source": "batch21"
    },
    "obligations": {
        "word": "obligations",
        "reading": "オブリゲーションズ",
        "meaning": "義務・責務（obligationの複数形）",
        "etymology": "obligate（義務づける）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["obligation", "duty", "responsibility", "commitment"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Studies"],
        "source": "batch21"
    },
    "limitations": {
        "word": "limitations",
        "reading": "リミテーションズ",
        "meaning": "制限・限界（limitationの複数形）",
        "etymology": "limit（制限）+ -ation（名詞）+ -s（複数）",
        "relatedWords": ["limitation", "restriction", "constraint", "boundary"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch21"
    },
    "similarities": {
        "word": "similarities",
        "reading": "シミラリティーズ",
        "meaning": "類似点（similarityの複数形）",
        "etymology": "similar（類似した）+ -ity（性質）+ -es（複数）",
        "relatedWords": ["similarity", "resemblance", "likeness", "commonality"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch21"
    },
    "possibilities": {
        "word": "possibilities",
        "reading": "ポッシビリティーズ",
        "meaning": "可能性（possibilityの複数形）",
        "etymology": "possible（可能な）+ -ity（性質）+ -es（複数）",
        "relatedWords": ["possibility", "potential", "chance", "opportunity"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch21"
    },
    "inequalities": {
        "word": "inequalities",
        "reading": "インイクオリティーズ",
        "meaning": "不平等（inequalityの複数形）",
        "etymology": "in-（否定）+ equal（平等）+ -ity（性質）+ -es（複数）",
        "relatedWords": ["inequality", "disparity", "injustice", "unfairness"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Issues"],
        "source": "batch21"
    },
    "priorities": {
        "word": "priorities",
        "reading": "プライオリティーズ",
        "meaning": "優先事項（priorityの複数形）",
        "etymology": "prior（先の）+ -ity（性質）+ -es（複数）",
        "relatedWords": ["priority", "importance", "precedence", "preference"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch21"
    },
    "discoveries": {
        "word": "discoveries",
        "reading": "ディスカヴァリーズ",
        "meaning": "発見（discoveryの複数形）",
        "etymology": "discover（発見する）+ -y（名詞）+ -es（複数）",
        "relatedWords": ["discovery", "finding", "revelation", "breakthrough"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Science"],
        "source": "batch21"
    },
    "performances": {
        "word": "performances",
        "reading": "パフォーマンシズ",
        "meaning": "公演・演技・性能（performanceの複数形）",
        "etymology": "perform（実行する）+ -ance（名詞）+ -s（複数）",
        "relatedWords": ["performance", "show", "execution", "achievement"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Arts"],
        "source": "batch21"
    },
    "reactions": {
        "word": "reactions",
        "reading": "リアクションズ",
        "meaning": "反応（reactionの複数形）",
        "etymology": "react（反応する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["reaction", "response", "reply", "feedback"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Science"],
        "source": "batch21"
    },
    "intentions": {
        "word": "intentions",
        "reading": "インテンションズ",
        "meaning": "意図・意向（intentionの複数形）",
        "etymology": "intend（意図する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["intention", "purpose", "aim", "goal"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Psychology"],
        "source": "batch21"
    },
    "perceptions": {
        "word": "perceptions",
        "reading": "パーセプションズ",
        "meaning": "知覚・認識（perceptionの複数形）",
        "etymology": "perceive（知覚する）+ -tion（名詞）+ -s（複数）",
        "relatedWords": ["perception", "awareness", "understanding", "insight"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Psychology"],
        "source": "batch21"
    },
    "restrictions": {
        "word": "restrictions",
        "reading": "リストリクションズ",
        "meaning": "制限・規制（restrictionの複数形）",
        "etymology": "restrict（制限する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["restriction", "limitation", "constraint", "regulation"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch21"
    },
    "violations": {
        "word": "violations",
        "reading": "ヴァイオレーションズ",
        "meaning": "違反・侵害（violationの複数形）",
        "etymology": "violate（違反する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["violation", "breach", "infringement", "offense"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Law"],
        "source": "batch21"
    },
    "simulations": {
        "word": "simulations",
        "reading": "シミュレーションズ",
        "meaning": "シミュレーション・模擬実験（simulationの複数形）",
        "etymology": "simulate（模擬する）+ -ion（名詞）+ -s（複数）",
        "relatedWords": ["simulation", "model", "imitation", "replication"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch21"
    },
    "narratives": {
        "word": "narratives",
        "reading": "ナラティヴズ",
        "meaning": "物語・語り（narrativeの複数形）",
        "etymology": "narrate（語る）+ -ive（名詞）+ -s（複数）",
        "relatedWords": ["narrative", "story", "account", "tale"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Literature"],
        "source": "batch21"
    },
    "successes": {
        "word": "successes",
        "reading": "サクセシズ",
        "meaning": "成功（successの複数形）",
        "etymology": "succeed（成功する）+ -cess（名詞）+ -es（複数）",
        "relatedWords": ["success", "achievement", "victory", "accomplishment"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["General"],
        "source": "batch21"
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
    print("長文読解辞書 単語追加スクリプト（バッチ21）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ21の単語を追加
    print(f"📝 バッチ21: 名詞の複数形・派生語・一般的な単語（{len(BATCH_WORDS)}個）を追加中...")
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
