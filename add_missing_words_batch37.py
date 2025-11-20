#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ37）
残りの47単語から次の20語を追加
"""

import json
import os

# バッチ37: 残りの重要語（ビジネス・社会・科学用語）
BATCH_WORDS = {
    "printers": {
        "word": "printers",
        "reading": "プリンター",
        "meaning": "印刷機・プリンター（printerの複数形）",
        "etymology": "printer の複数形",
        "relatedWords": ["copiers", "devices", "machines"],
        "category": "技術",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "professionalism": {
        "word": "professionalism",
        "reading": "プロフェッショナリズム",
        "meaning": "プロ意識・専門職精神",
        "etymology": "professional（専門的な）+ -ism（主義）",
        "relatedWords": ["expertise", "competence", "dedication"],
        "category": "ビジネス",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "professionally": {
        "word": "professionally",
        "reading": "プロフェッショナリー",
        "meaning": "専門的に・職業的に",
        "etymology": "professional（専門的な）+ -ly（副詞）",
        "relatedWords": ["expertly", "skillfully", "competently"],
        "category": "副詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "professionals": {
        "word": "professionals",
        "reading": "プロフェッショナル",
        "meaning": "専門家・プロ（professionalの複数形）",
        "etymology": "professional の複数形",
        "relatedWords": ["experts", "specialists", "practitioners"],
        "category": "職業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "prosthetics": {
        "word": "prosthetics",
        "reading": "プロステティクス",
        "meaning": "義肢装具学・義肢",
        "etymology": "ギリシャ語 prosthesis（付加）から",
        "relatedWords": ["implants", "replacements", "devices"],
        "category": "医学",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "rays": {
        "word": "rays",
        "reading": "レイ",
        "meaning": "光線・放射線（rayの複数形）",
        "etymology": "ray の複数形",
        "relatedWords": ["beams", "light", "radiation"],
        "category": "科学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "recidivism": {
        "word": "recidivism",
        "reading": "リシディビズム",
        "meaning": "再犯・常習犯罪",
        "etymology": "ラテン語 recidivus（再発する）",
        "relatedWords": ["relapse", "reoffending", "repetition"],
        "category": "社会",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "regimes": {
        "word": "regimes",
        "reading": "レジーム",
        "meaning": "体制・政権（regimeの複数形）",
        "etymology": "regime の複数形",
        "relatedWords": ["governments", "systems", "administrations"],
        "category": "政治",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "relativism": {
        "word": "relativism",
        "reading": "レラティビズム",
        "meaning": "相対主義",
        "etymology": "relative（相対的な）+ -ism（主義）",
        "relatedWords": ["subjectivism", "contextualism", "perspectivism"],
        "category": "哲学",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "reminders": {
        "word": "reminders",
        "reading": "リマインダー",
        "meaning": "思い出させるもの・リマインダー（reminderの複数形）",
        "etymology": "reminder の複数形",
        "relatedWords": ["notifications", "prompts", "memos"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "remittances": {
        "word": "remittances",
        "reading": "リミッタンス",
        "meaning": "送金・仕送り（remittanceの複数形）",
        "etymology": "remittance の複数形",
        "relatedWords": ["transfers", "payments", "money"],
        "category": "ビジネス",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "residues": {
        "word": "residues",
        "reading": "レジデュー",
        "meaning": "残留物・残渣（residueの複数形）",
        "etymology": "residue の複数形",
        "relatedWords": ["remains", "leftovers", "deposits"],
        "category": "科学",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "rots": {
        "word": "rots",
        "reading": "ロット",
        "meaning": "腐る・腐敗する（rotの三単現・複数形）",
        "etymology": "rot の三人称単数現在形",
        "relatedWords": ["decays", "decomposes", "spoils"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "saviorism": {
        "word": "saviorism",
        "reading": "セイビアリズム",
        "meaning": "救世主主義・救済者意識",
        "etymology": "savior（救世主）+ -ism（主義）",
        "relatedWords": ["paternalism", "interventionism", "messianism"],
        "category": "社会",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "shareholders": {
        "word": "shareholders",
        "reading": "シェアホルダー",
        "meaning": "株主（shareholderの複数形）",
        "etymology": "shareholder の複数形",
        "relatedWords": ["investors", "owners", "stakeholders"],
        "category": "ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "sickle": {
        "word": "sickle",
        "reading": "シックル",
        "meaning": "鎌",
        "etymology": "古英語 sicol",
        "relatedWords": ["scythe", "blade", "tool"],
        "category": "道具",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "signage": {
        "word": "signage",
        "reading": "サイニジ",
        "meaning": "標識・看板（総称）",
        "etymology": "sign（標識）+ -age（総称）",
        "relatedWords": ["signs", "markers", "displays"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "signals": {
        "word": "signals",
        "reading": "シグナル",
        "meaning": "信号・合図（signalの複数形）",
        "etymology": "signal の複数形",
        "relatedWords": ["signs", "indicators", "messages"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "skidding": {
        "word": "skidding",
        "reading": "スキッディング",
        "meaning": "滑る・スリップする",
        "etymology": "skid（滑る）+ -ing",
        "relatedWords": ["sliding", "slipping", "gliding"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch37"
    },
    "slaughtering": {
        "word": "slaughtering",
        "reading": "スローターリング",
        "meaning": "屠殺・虐殺",
        "etymology": "slaughter（屠殺する）+ -ing",
        "relatedWords": ["killing", "butchering", "massacring"],
        "category": "動詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch37"
    }
}

def load_dictionary():
    """辞書ファイルを読み込む"""
    dict_path = "public/data/reading-passages-dictionary.json"
    try:
        with open(dict_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ エラー: {dict_path} が見つかりません")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSONデコードエラー: {e}")
        return None

def save_dictionary(dictionary):
    """辞書ファイルを保存する"""
    dict_path = "public/data/reading-passages-dictionary.json"
    try:
        with open(dict_path, 'w', encoding='utf-8') as f:
            json.dump(dictionary, f, ensure_ascii=False, indent=2)
        print(f"✓ {dict_path} を保存しました")
        return True
    except Exception as e:
        print(f"❌ 保存エラー: {e}")
        return False

def main():
    print("=" * 60)
    print("長文読解辞書 単語追加スクリプト（バッチ37）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print(f"📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    if dictionary is None:
        return
    
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ37の単語を追加
    print(f"📝 バッチ37: 残りの重要語（ビジネス・社会・科学用語）（{len(BATCH_WORDS)}個）を追加中...")
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
    
    # 辞書を保存
    if added_count > 0:
        if save_dictionary(dictionary):
            print()
            print(f"✅ {added_count}個の単語を辞書に追加しました")
            if skipped_count > 0:
                print(f"   スキップ: {skipped_count}個")
            print(f"   新しい単語数: {len(dictionary)} (元: {original_count})")
        else:
            print("❌ 辞書の保存に失敗しました")
    else:
        print()
        print("✓ 辞書に追加する単語はありませんでした")
    
    print()
    print("=" * 60)
    print("完了")
    print("=" * 60)

if __name__ == "__main__":
    main()
