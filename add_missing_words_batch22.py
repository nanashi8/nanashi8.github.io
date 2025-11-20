#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ22: 一般的な動詞・形容詞・名詞
BATCH_WORDS = {
    "emit": {
        "word": "emit",
        "reading": "エミット",
        "meaning": "放出する・発する",
        "etymology": "ラテン語 emittere（送り出す）← e-（外へ）+ mittere（送る）",
        "relatedWords": ["emission", "discharge", "release", "radiate"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch22"
    },
    "erase": {
        "word": "erase",
        "reading": "イレイス",
        "meaning": "消す・削除する",
        "etymology": "ラテン語 eradere（削り取る）← e-（外へ）+ radere（削る）",
        "relatedWords": ["delete", "remove", "wipe", "eliminate"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "seize": {
        "word": "seize",
        "reading": "シーズ",
        "meaning": "つかむ・捕らえる",
        "etymology": "古フランス語 seisir（所有する）← ゲルマン祖語 *sakjan",
        "relatedWords": ["grab", "capture", "grasp", "take"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "perceive": {
        "word": "perceive",
        "reading": "パーシーヴ",
        "meaning": "知覚する・理解する",
        "etymology": "ラテン語 percipere（受け取る）← per-（完全に）+ capere（取る）",
        "relatedWords": ["perception", "notice", "observe", "recognize"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Psychology"],
        "source": "batch22"
    },
    "persist": {
        "word": "persist",
        "reading": "パーシスト",
        "meaning": "持続する・固執する",
        "etymology": "ラテン語 persistere（続ける）← per-（通して）+ sistere（立つ）",
        "relatedWords": ["continue", "endure", "persevere", "last"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "relocate": {
        "word": "relocate",
        "reading": "リロケイト",
        "meaning": "移転する・移住する",
        "etymology": "re-（再び）+ locate（配置する）← ラテン語 locus（場所）",
        "relatedWords": ["move", "transfer", "migrate", "resettle"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Geography"],
        "source": "batch22"
    },
    "replicate": {
        "word": "replicate",
        "reading": "レプリケイト",
        "meaning": "複製する・再現する",
        "etymology": "ラテン語 replicare（折り返す）← re-（再び）+ plicare（折る）",
        "relatedWords": ["copy", "duplicate", "reproduce", "repeat"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch22"
    },
    "mobilize": {
        "word": "mobilize",
        "reading": "モビライズ",
        "meaning": "動員する・可動化する",
        "etymology": "mobile（可動の）+ -ize（〜化する）← ラテン語 mobilis",
        "relatedWords": ["organize", "assemble", "rally", "activate"],
        "category": "動詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Social Studies"],
        "source": "batch22"
    },
    "prioritize": {
        "word": "prioritize",
        "reading": "プライオリタイズ",
        "meaning": "優先順位をつける",
        "etymology": "priority（優先）+ -ize（〜化する）← ラテン語 prior（先の）",
        "relatedWords": ["priority", "rank", "organize", "arrange"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "democratize": {
        "word": "democratize",
        "reading": "デモクラタイズ",
        "meaning": "民主化する",
        "etymology": "democracy（民主主義）+ -ize（〜化する）← ギリシャ語 demokratia",
        "relatedWords": ["democracy", "liberalize", "reform", "empower"],
        "category": "動詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Politics"],
        "source": "batch22"
    },
    "explicit": {
        "word": "explicit",
        "reading": "エクスプリシット",
        "meaning": "明示的な・明確な",
        "etymology": "ラテン語 explicitus（展開された）← explicare（明らかにする）",
        "relatedWords": ["clear", "definite", "specific", "obvious"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "immense": {
        "word": "immense",
        "reading": "イメンス",
        "meaning": "巨大な・莫大な",
        "etymology": "ラテン語 immensus（計り知れない）← in-（否定）+ mensus（測られた）",
        "relatedWords": ["huge", "enormous", "vast", "tremendous"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "paramount": {
        "word": "paramount",
        "reading": "パラマウント",
        "meaning": "最高の・最重要の",
        "etymology": "古フランス語 paramont（上に）← par（〜によって）+ amont（上に）",
        "relatedWords": ["supreme", "chief", "primary", "foremost"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "legitimate": {
        "word": "legitimate",
        "reading": "レジティメイト",
        "meaning": "正当な・合法的な",
        "etymology": "ラテン語 legitimatus（合法化された）← lex（法）",
        "relatedWords": ["legal", "valid", "lawful", "authorized"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Law"],
        "source": "batch22"
    },
    "mutual": {
        "word": "mutual",
        "reading": "ミューチュアル",
        "meaning": "相互の・共通の",
        "etymology": "ラテン語 mutuus（相互の）← mutare（変える）",
        "relatedWords": ["reciprocal", "shared", "common", "joint"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["General"],
        "source": "batch22"
    },
    "responsive": {
        "word": "responsive",
        "reading": "レスポンシヴ",
        "meaning": "反応する・応答する",
        "etymology": "respond（応答する）+ -ive（〜的な）← ラテン語 respondere",
        "relatedWords": ["response", "reactive", "sensitive", "attentive"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch22"
    },
    "catastrophic": {
        "word": "catastrophic",
        "reading": "カタストロフィック",
        "meaning": "壊滅的な・悲劇的な",
        "etymology": "catastrophe（大惨事）+ -ic（〜的な）← ギリシャ語 katastrophe",
        "relatedWords": ["catastrophe", "disastrous", "devastating", "tragic"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Science"],
        "source": "batch22"
    },
    "cumulative": {
        "word": "cumulative",
        "reading": "キュミュラティヴ",
        "meaning": "累積的な・蓄積される",
        "etymology": "cumulate（蓄積する）+ -ive（〜的な）← ラテン語 cumulare",
        "relatedWords": ["accumulate", "collective", "total", "aggregate"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Science"],
        "source": "batch22"
    },
    "defensive": {
        "word": "defensive",
        "reading": "ディフェンシヴ",
        "meaning": "防御的な・守備の",
        "etymology": "defend（防御する）+ -ive（〜的な）← ラテン語 defendere",
        "relatedWords": ["defense", "protective", "guarded", "cautious"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Sports"],
        "source": "batch22"
    },
    "memorable": {
        "word": "memorable",
        "reading": "メモラブル",
        "meaning": "記憶に残る・印象的な",
        "etymology": "memory（記憶）+ -able（できる）← ラテン語 memorabilis",
        "relatedWords": ["memory", "unforgettable", "remarkable", "notable"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch22"
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
    print("長文読解辞書 単語追加スクリプト（バッチ22）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ22の単語を追加
    print(f"📝 バッチ22: 一般的な動詞・形容詞・名詞（{len(BATCH_WORDS)}個）を追加中...")
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
