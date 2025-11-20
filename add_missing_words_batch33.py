#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ33）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ33: 残りの重要語（動詞・名詞・形容詞）
BATCH_WORDS = {
    "coastlines": {
        "word": "coastlines",
        "reading": "コーストライン",
        "meaning": "海岸線（coastlineの複数形）",
        "etymology": "coast（海岸）+ line（線）の複数形",
        "relatedWords": ["shores", "beaches", "seashores"],
        "category": "地理",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "incite": {
        "word": "incite",
        "reading": "インサイト",
        "meaning": "扇動する・刺激する",
        "etymology": "ラテン語 incitare（駆り立てる）",
        "relatedWords": ["provoke", "stimulate", "encourage"],
        "category": "動詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "misuse": {
        "word": "misuse",
        "reading": "ミスユース",
        "meaning": "誤用・乱用・誤って使う",
        "etymology": "mis-（誤って）+ use（使う）",
        "relatedWords": ["abuse", "misapply", "mishandle"],
        "category": "名詞・動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "misused": {
        "word": "misused",
        "reading": "ミスユースト",
        "meaning": "誤用された・乱用された",
        "etymology": "misuse（誤用する）+ -ed",
        "relatedWords": ["abused", "misapplied", "mishandled"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "orbits": {
        "word": "orbits",
        "reading": "オービット",
        "meaning": "軌道（orbitの複数形または三人称単数形）",
        "etymology": "orbit（軌道）の複数形・三人称単数形",
        "relatedWords": ["paths", "circuits", "trajectories"],
        "category": "科学・宇宙",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "outward": {
        "word": "outward",
        "reading": "アウトワード",
        "meaning": "外側へ・外向きの",
        "etymology": "out（外へ）+ -ward（方向）",
        "relatedWords": ["external", "outside", "exterior"],
        "category": "形容詞・副詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "overlapping": {
        "word": "overlapping",
        "reading": "オーバーラッピング",
        "meaning": "重なり合う（overlapの現在分詞）",
        "etymology": "over（上に）+ lap（重なる）+ -ing",
        "relatedWords": ["overlaying", "coinciding", "intersecting"],
        "category": "形容詞・動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "pollinate": {
        "word": "pollinate",
        "reading": "ポリネート",
        "meaning": "受粉する・受粉させる",
        "etymology": "pollen（花粉）+ -ate（動詞化接尾辞）",
        "relatedWords": ["fertilize", "cross-pollinate", "pollination"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "polling": {
        "word": "polling",
        "reading": "ポーリング",
        "meaning": "投票・世論調査",
        "etymology": "poll（投票）+ -ing（行為）",
        "relatedWords": ["voting", "surveying", "sampling"],
        "category": "政治・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "puns": {
        "word": "puns",
        "reading": "パン",
        "meaning": "駄洒落・言葉遊び（punの複数形）",
        "etymology": "pun（駄洒落）の複数形",
        "relatedWords": ["wordplay", "jokes", "witticisms"],
        "category": "言語・ユーモア",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "purity": {
        "word": "purity",
        "reading": "ピュリティ",
        "meaning": "純度・純粋さ",
        "etymology": "pure（純粋な）+ -ity（性質）",
        "relatedWords": ["cleanness", "innocence", "clarity"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "quizzes": {
        "word": "quizzes",
        "reading": "クイズ",
        "meaning": "クイズ・小テスト（quizの複数形）",
        "etymology": "quiz（クイズ）の複数形",
        "relatedWords": ["tests", "exams", "questions"],
        "category": "教育",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "recharge": {
        "word": "recharge",
        "reading": "リチャージ",
        "meaning": "再充電する・元気を回復する",
        "etymology": "re-（再び）+ charge（充電する）",
        "relatedWords": ["refill", "restore", "revitalize"],
        "category": "動詞・名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "relations": {
        "word": "relations",
        "reading": "リレーション",
        "meaning": "関係・関連（relationの複数形）",
        "etymology": "relation（関係）の複数形",
        "relatedWords": ["relationships", "connections", "associations"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "repayment": {
        "word": "repayment",
        "reading": "リペイメント",
        "meaning": "返済・返金",
        "etymology": "repay（返済する）+ -ment（行為・結果）",
        "relatedWords": ["reimbursement", "refund", "payment"],
        "category": "経済・ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "ripple": {
        "word": "ripple",
        "reading": "リップル",
        "meaning": "さざ波・波及効果",
        "etymology": "擬音語から",
        "relatedWords": ["wave", "undulation", "effect"],
        "category": "自然・比喩",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "scheduling": {
        "word": "scheduling",
        "reading": "スケジューリング",
        "meaning": "予定を立てること・スケジュール管理",
        "etymology": "schedule（予定）+ -ing（行為）",
        "relatedWords": ["planning", "organizing", "arranging"],
        "category": "ビジネス・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "solving": {
        "word": "solving",
        "reading": "ソルビング",
        "meaning": "解決すること（solveの現在分詞）",
        "etymology": "solve（解決する）+ -ing",
        "relatedWords": ["resolving", "fixing", "addressing"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "steer": {
        "word": "steer",
        "reading": "ステア",
        "meaning": "操縦する・導く",
        "etymology": "古英語 stieran（操縦する）",
        "relatedWords": ["guide", "direct", "navigate"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch33"
    },
    "worry": {
        "word": "worry",
        "reading": "ワリー",
        "meaning": "心配・心配する",
        "etymology": "古英語 wyrgan（絞め殺す）",
        "relatedWords": ["concern", "anxiety", "fear"],
        "category": "名詞・動詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch33"
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
    print("長文読解辞書 単語追加スクリプト（バッチ33）")
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
    
    # バッチ33の単語を追加
    print(f"📝 バッチ33: 残りの重要語（動詞・名詞・形容詞）（{len(BATCH_WORDS)}個）を追加中...")
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
