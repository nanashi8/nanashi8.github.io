#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ30）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ30: 名詞・動詞派生形・複数形
BATCH_WORDS = {
    "checkups": {
        "word": "checkups",
        "reading": "チェックアップ",
        "meaning": "健康診断・検査（checkupの複数形）",
        "etymology": "check（確認）+ up（上に）の複数形",
        "relatedWords": ["examinations", "inspections", "screenings"],
        "category": "健康・医学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "deadlines": {
        "word": "deadlines",
        "reading": "デッドライン",
        "meaning": "締め切り・期限（deadlineの複数形）",
        "etymology": "dead（終わりの）+ line（線）の複数形",
        "relatedWords": ["due dates", "time limits", "cutoffs"],
        "category": "ビジネス・一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "deficits": {
        "word": "deficits",
        "reading": "デフィシット",
        "meaning": "赤字・不足（deficitの複数形）",
        "etymology": "deficit（不足）の複数形",
        "relatedWords": ["shortages", "shortfalls", "debts"],
        "category": "経済・ビジネス",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "failures": {
        "word": "failures",
        "reading": "フェイリアー",
        "meaning": "失敗・故障（failureの複数形）",
        "etymology": "failure（失敗）の複数形",
        "relatedWords": ["breakdowns", "mistakes", "defeats"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "hypotheses": {
        "word": "hypotheses",
        "reading": "ハイポセシーズ",
        "meaning": "仮説（hypothesisの複数形）",
        "etymology": "hypothesis（仮説）の複数形",
        "relatedWords": ["theories", "assumptions", "propositions"],
        "category": "科学・学術",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "labels": {
        "word": "labels",
        "reading": "ラベル",
        "meaning": "ラベル・札（labelの複数形）",
        "etymology": "label（ラベル）の複数形",
        "relatedWords": ["tags", "stickers", "marks"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "layers": {
        "word": "layers",
        "reading": "レイヤー",
        "meaning": "層・階層（layerの複数形）",
        "etymology": "layer（層）の複数形",
        "relatedWords": ["levels", "strata", "tiers"],
        "category": "一般・科学",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "losses": {
        "word": "losses",
        "reading": "ロス",
        "meaning": "損失・喪失（lossの複数形）",
        "etymology": "loss（損失）の複数形",
        "relatedWords": ["defeats", "damages", "casualties"],
        "category": "一般・ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "managers": {
        "word": "managers",
        "reading": "マネージャー",
        "meaning": "管理者・経営者（managerの複数形）",
        "etymology": "manager（管理者）の複数形",
        "relatedWords": ["supervisors", "directors", "administrators"],
        "category": "ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "obstacles": {
        "word": "obstacles",
        "reading": "オブスタクル",
        "meaning": "障害・妨害（obstacleの複数形）",
        "etymology": "obstacle（障害）の複数形",
        "relatedWords": ["barriers", "hurdles", "impediments"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "payments": {
        "word": "payments",
        "reading": "ペイメント",
        "meaning": "支払い（paymentの複数形）",
        "etymology": "payment（支払い）の複数形",
        "relatedWords": ["installments", "transactions", "remittances"],
        "category": "ビジネス・経済",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "preferences": {
        "word": "preferences",
        "reading": "プレファレンス",
        "meaning": "好み・優先（preferenceの複数形）",
        "etymology": "preference（好み）の複数形",
        "relatedWords": ["choices", "tastes", "priorities"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "pressures": {
        "word": "pressures",
        "reading": "プレッシャー",
        "meaning": "圧力・プレッシャー（pressureの複数形）",
        "etymology": "pressure（圧力）の複数形",
        "relatedWords": ["stresses", "forces", "strains"],
        "category": "一般・物理",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "readers": {
        "word": "readers",
        "reading": "リーダー",
        "meaning": "読者・読み手（readerの複数形）",
        "etymology": "reader（読者）の複数形",
        "relatedWords": ["audience", "viewers", "subscribers"],
        "category": "一般",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "rewards": {
        "word": "rewards",
        "reading": "リワード",
        "meaning": "報酬・褒美（rewardの複数形）",
        "etymology": "reward（報酬）の複数形",
        "relatedWords": ["prizes", "bonuses", "incentives"],
        "category": "一般・ビジネス",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "sectors": {
        "word": "sectors",
        "reading": "セクター",
        "meaning": "部門・分野（sectorの複数形）",
        "etymology": "sector（部門）の複数形",
        "relatedWords": ["industries", "areas", "segments"],
        "category": "ビジネス・経済",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "setbacks": {
        "word": "setbacks",
        "reading": "セットバック",
        "meaning": "後退・挫折（setbackの複数形）",
        "etymology": "set（置く）+ back（後ろに）の複数形",
        "relatedWords": ["reverses", "delays", "obstacles"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "speakers": {
        "word": "speakers",
        "reading": "スピーカー",
        "meaning": "話者・スピーカー（speakerの複数形）",
        "etymology": "speaker（話者）の複数形",
        "relatedWords": ["presenters", "orators", "lecturers"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "utilities": {
        "word": "utilities",
        "reading": "ユーティリティ",
        "meaning": "公共事業・有用性（utilityの複数形）",
        "etymology": "utility（有用性）の複数形",
        "relatedWords": ["services", "facilities", "amenities"],
        "category": "ビジネス・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch30"
    },
    "worries": {
        "word": "worries",
        "reading": "ワリー",
        "meaning": "心配・懸念（worryの複数形または三人称単数形）",
        "etymology": "worry（心配する）の複数形・三人称単数形",
        "relatedWords": ["concerns", "anxieties", "fears"],
        "category": "感情",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "batch30"
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
    print("長文読解辞書 単語追加スクリプト（バッチ30）")
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
    
    # バッチ30の単語を追加
    print(f"📝 バッチ30: 名詞・動詞派生形・複数形（{len(BATCH_WORDS)}個）を追加中...")
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
