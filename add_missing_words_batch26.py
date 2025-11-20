#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ26）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ26: ビジネス・社会・技術関連語
BATCH_WORDS = {
    "buffer": {
        "word": "buffer",
        "reading": "バッファー",
        "meaning": "緩衝材・バッファ",
        "etymology": "古フランス語 buffe（打撃）から",
        "relatedWords": ["cushion", "protection", "zone"],
        "category": "技術・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "detection": {
        "word": "detection",
        "reading": "ディテクション",
        "meaning": "検出・発見",
        "etymology": "detect（検出する）+ -ion（行為・結果）",
        "relatedWords": ["discovery", "identification", "sensing"],
        "category": "技術・科学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "determination": {
        "word": "determination",
        "reading": "ディターミネーション",
        "meaning": "決意・決定・測定",
        "etymology": "determine（決定する）+ -ation（行為・状態）",
        "relatedWords": ["resolve", "decision", "commitment"],
        "category": "心理・行動",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "displacement": {
        "word": "displacement",
        "reading": "ディスプレイスメント",
        "meaning": "移動・置き換え・避難",
        "etymology": "displace（移動させる）+ -ment（行為・結果）",
        "relatedWords": ["relocation", "migration", "removal"],
        "category": "社会・物理",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "distribution": {
        "word": "distribution",
        "reading": "ディストリビューション",
        "meaning": "分配・流通・配布",
        "etymology": "distribute（分配する）+ -ion（行為・結果）",
        "relatedWords": ["allocation", "delivery", "supply"],
        "category": "ビジネス・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "evacuation": {
        "word": "evacuation",
        "reading": "エバキュエーション",
        "meaning": "避難・退避",
        "etymology": "evacuate（避難する）+ -ion（行為）",
        "relatedWords": ["escape", "withdrawal", "retreat"],
        "category": "緊急・安全",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "fulfillment": {
        "word": "fulfillment",
        "reading": "フルフィルメント",
        "meaning": "達成・充足・履行",
        "etymology": "fulfill（達成する）+ -ment（行為・結果）",
        "relatedWords": ["satisfaction", "completion", "achievement"],
        "category": "心理・ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "implementation": {
        "word": "implementation",
        "reading": "インプリメンテーション",
        "meaning": "実装・実施・履行",
        "etymology": "implement（実行する）+ -ation（行為・結果）",
        "relatedWords": ["execution", "deployment", "application"],
        "category": "ビジネス・技術",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "inclusion": {
        "word": "inclusion",
        "reading": "インクルージョン",
        "meaning": "包含・包摂・参加",
        "etymology": "include（含む）+ -sion（行為・状態）",
        "relatedWords": ["involvement", "participation", "integration"],
        "category": "社会・教育",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "involvement": {
        "word": "involvement",
        "reading": "インボルブメント",
        "meaning": "関与・参加・巻き込まれること",
        "etymology": "involve（関与する）+ -ment（行為・状態）",
        "relatedWords": ["participation", "engagement", "inclusion"],
        "category": "社会・行動",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "irrigation": {
        "word": "irrigation",
        "reading": "イリゲーション",
        "meaning": "灌漑・水やり",
        "etymology": "irrigate（水を注ぐ）+ -ion（行為）",
        "relatedWords": ["watering", "agriculture", "farming"],
        "category": "農業・環境",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "manufacturing": {
        "word": "manufacturing",
        "reading": "マニュファクチャリング",
        "meaning": "製造・製造業",
        "etymology": "manufacture（製造する）+ -ing（行為）",
        "relatedWords": ["production", "industry", "assembly"],
        "category": "産業・ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "negotiation": {
        "word": "negotiation",
        "reading": "ネゴシエーション",
        "meaning": "交渉・折衝",
        "etymology": "negotiate（交渉する）+ -ion（行為）",
        "relatedWords": ["discussion", "bargaining", "talks"],
        "category": "ビジネス・政治",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "optimization": {
        "word": "optimization",
        "reading": "オプティマイゼーション",
        "meaning": "最適化",
        "etymology": "optimize（最適化する）+ -ation（行為）",
        "relatedWords": ["improvement", "efficiency", "enhancement"],
        "category": "技術・ビジネス",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "performance": {
        "word": "performance",
        "reading": "パフォーマンス",
        "meaning": "性能・業績・公演",
        "etymology": "perform（実行する）+ -ance（行為・状態）",
        "relatedWords": ["execution", "achievement", "show"],
        "category": "一般・ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "persecution": {
        "word": "persecution",
        "reading": "パーセキューション",
        "meaning": "迫害・弾圧",
        "etymology": "persecute（迫害する）+ -ion（行為）",
        "relatedWords": ["oppression", "harassment", "discrimination"],
        "category": "社会・歴史",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "processing": {
        "word": "processing",
        "reading": "プロセッシング",
        "meaning": "処理・加工",
        "etymology": "process（処理する）+ -ing（行為）",
        "relatedWords": ["handling", "treatment", "computation"],
        "category": "技術・産業",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "productivity": {
        "word": "productivity",
        "reading": "プロダクティビティ",
        "meaning": "生産性・生産力",
        "etymology": "productive（生産的な）+ -ity（性質）",
        "relatedWords": ["efficiency", "output", "performance"],
        "category": "ビジネス・経済",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "retirement": {
        "word": "retirement",
        "reading": "リタイアメント",
        "meaning": "退職・引退",
        "etymology": "retire（引退する）+ -ment（行為・状態）",
        "relatedWords": ["pension", "withdrawal", "resignation"],
        "category": "社会・労働",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
    },
    "satisfaction": {
        "word": "satisfaction",
        "reading": "サティスファクション",
        "meaning": "満足・充足",
        "etymology": "satisfy（満足させる）+ -action（行為・状態）",
        "relatedWords": ["contentment", "pleasure", "fulfillment"],
        "category": "感情・心理",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch26"
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
    print("長文読解辞書 単語追加スクリプト（バッチ26）")
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
    
    # バッチ26の単語を追加
    print(f"📝 バッチ26: ビジネス・社会・技術関連語（{len(BATCH_WORDS)}個）を追加中...")
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
