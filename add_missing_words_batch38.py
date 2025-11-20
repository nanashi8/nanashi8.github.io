#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ38・最終バッチ）
残りの27単語を全て追加
"""

import json
import os

# バッチ38: 最終バッチ - 残りの27単語全て
BATCH_WORDS = {
    "soaring": {
        "word": "soaring",
        "reading": "ソーリング",
        "meaning": "急上昇する・高く飛ぶ",
        "etymology": "soar（急上昇する）+ -ing",
        "relatedWords": ["rising", "climbing", "flying"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "spans": {
        "word": "spans",
        "reading": "スパン",
        "meaning": "期間・範囲（spanの複数形・三単現）",
        "etymology": "span の複数形",
        "relatedWords": ["periods", "ranges", "stretches"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "spark": {
        "word": "spark",
        "reading": "スパーク",
        "meaning": "火花・きっかけ",
        "etymology": "古英語 spearca",
        "relatedWords": ["flame", "flash", "ignition"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "sparks": {
        "word": "sparks",
        "reading": "スパークス",
        "meaning": "火花・きっかけ（sparkの複数形・三単現）",
        "etymology": "spark の複数形",
        "relatedWords": ["flames", "flashes", "ignitions"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "specialists": {
        "word": "specialists",
        "reading": "スペシャリスト",
        "meaning": "専門家（specialistの複数形）",
        "etymology": "specialist の複数形",
        "relatedWords": ["experts", "professionals", "authorities"],
        "category": "職業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "specialized": {
        "word": "specialized",
        "reading": "スペシャライズド",
        "meaning": "専門化した・特化した",
        "etymology": "specialize（専門化する）+ -ed",
        "relatedWords": ["focused", "dedicated", "expert"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "sprint": {
        "word": "sprint",
        "reading": "スプリント",
        "meaning": "短距離走・全力疾走",
        "etymology": "スカンジナビア語から",
        "relatedWords": ["dash", "race", "run"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "staggering": {
        "word": "staggering",
        "reading": "スタガーリング",
        "meaning": "驚くべき・よろめく",
        "etymology": "stagger（よろめく）+ -ing",
        "relatedWords": ["astonishing", "shocking", "amazing"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "stains": {
        "word": "stains",
        "reading": "ステイン",
        "meaning": "汚れ・染み（stainの複数形・三単現）",
        "etymology": "stain の複数形",
        "relatedWords": ["spots", "marks", "blemishes"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "stakes": {
        "word": "stakes",
        "reading": "ステイクス",
        "meaning": "賭け金・利害関係（stakeの複数形）",
        "etymology": "stake の複数形",
        "relatedWords": ["risks", "interests", "wagers"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "storytelling": {
        "word": "storytelling",
        "reading": "ストーリーテリング",
        "meaning": "物語を語ること",
        "etymology": "story（物語）+ telling（語ること）",
        "relatedWords": ["narration", "narrative", "recounting"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "subgroups": {
        "word": "subgroups",
        "reading": "サブグループ",
        "meaning": "下位集団・小グループ（subgroupの複数形）",
        "etymology": "subgroup の複数形",
        "relatedWords": ["subdivisions", "subsections", "categories"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "sunset": {
        "word": "sunset",
        "reading": "サンセット",
        "meaning": "日没・夕日",
        "etymology": "sun（太陽）+ set（沈む）",
        "relatedWords": ["dusk", "twilight", "evening"],
        "category": "名詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "supervisor": {
        "word": "supervisor",
        "reading": "スーパーバイザー",
        "meaning": "監督者・管理者",
        "etymology": "supervise（監督する）+ -or（〜する人）",
        "relatedWords": ["manager", "overseer", "director"],
        "category": "職業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "supplement": {
        "word": "supplement",
        "reading": "サプリメント",
        "meaning": "補足・栄養補助食品",
        "etymology": "ラテン語 supplementum（補充）",
        "relatedWords": ["addition", "extra", "complement"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "suppress": {
        "word": "suppress",
        "reading": "サプレス",
        "meaning": "抑圧する・抑える",
        "etymology": "ラテン語 suppressus（抑圧された）",
        "relatedWords": ["repress", "restrain", "control"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "suppressed": {
        "word": "suppressed",
        "reading": "サプレスト",
        "meaning": "抑圧された・抑えられた",
        "etymology": "suppress（抑圧する）+ -ed",
        "relatedWords": ["repressed", "restrained", "controlled"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "surge": {
        "word": "surge",
        "reading": "サージ",
        "meaning": "急増・殺到",
        "etymology": "ラテン語 surgere（立ち上がる）",
        "relatedWords": ["rise", "increase", "swell"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "surgeons": {
        "word": "surgeons",
        "reading": "サージョン",
        "meaning": "外科医（surgeonの複数形）",
        "etymology": "surgeon の複数形",
        "relatedWords": ["doctors", "physicians", "specialists"],
        "category": "職業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "surpassing": {
        "word": "surpassing",
        "reading": "サーパッシング",
        "meaning": "超える・しのぐ",
        "etymology": "surpass（超える）+ -ing",
        "relatedWords": ["exceeding", "outdoing", "beating"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "tailors": {
        "word": "tailors",
        "reading": "テイラー",
        "meaning": "仕立て屋（tailorの複数形）",
        "etymology": "tailor の複数形",
        "relatedWords": ["dressmakers", "seamstresses", "clothiers"],
        "category": "職業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "tradeoffs": {
        "word": "tradeoffs",
        "reading": "トレードオフ",
        "meaning": "トレードオフ・代償（tradeoffの複数形）",
        "etymology": "tradeoff の複数形",
        "relatedWords": ["compromises", "exchanges", "balances"],
        "category": "名詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "undermine": {
        "word": "undermine",
        "reading": "アンダーマイン",
        "meaning": "弱体化させる・損なう",
        "etymology": "under（下）+ mine（掘る）",
        "relatedWords": ["weaken", "sabotage", "damage"],
        "category": "動詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "underrepresentation": {
        "word": "underrepresentation",
        "reading": "アンダーリプレゼンテーション",
        "meaning": "過小代表・代表不足",
        "etymology": "under-（不足）+ representation（代表）",
        "relatedWords": ["inequality", "disparity", "imbalance"],
        "category": "社会",
        "difficulty": "advanced",
        "levels": ["C1", "C2"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "updates": {
        "word": "updates",
        "reading": "アップデート",
        "meaning": "更新・最新情報（updateの複数形）",
        "etymology": "update の複数形",
        "relatedWords": ["revisions", "upgrades", "improvements"],
        "category": "名詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "ups": {
        "word": "ups",
        "reading": "アップス",
        "meaning": "上昇・浮き沈みの上（upの複数形）",
        "etymology": "up の複数形",
        "relatedWords": ["rises", "increases", "highs"],
        "category": "名詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch38"
    },
    "watercolors": {
        "word": "watercolors",
        "reading": "ウォーターカラー",
        "meaning": "水彩画（watercolorの複数形）",
        "etymology": "watercolor の複数形",
        "relatedWords": ["paintings", "art", "aquarelles"],
        "category": "芸術",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch38"
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
    print("長文読解辞書 単語追加スクリプト（バッチ38・最終バッチ）")
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
    
    # バッチ38の単語を追加
    print(f"📝 バッチ38（最終バッチ）: 残りの全単語（{len(BATCH_WORDS)}個）を追加中...")
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
            print("🎉" * 30)
            print(f"✅ {added_count}個の単語を辞書に追加しました")
            if skipped_count > 0:
                print(f"   スキップ: {skipped_count}個")
            print(f"   新しい単語数: {len(dictionary)} (元: {original_count})")
            print("🎉 全てのバッチが完了しました！ 🎉")
            print("🎉" * 30)
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
