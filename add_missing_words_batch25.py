#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ25）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ25: 社会・技術関連の重要語
BATCH_WORDS = {
    "brutality": {
        "word": "brutality",
        "reading": "ブルータリティ",
        "meaning": "残虐性・野蛮さ",
        "etymology": "brutal（残虐な）+ -ity（名詞化接尾辞）",
        "relatedWords": ["cruel", "violence", "savage"],
        "category": "社会問題",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "censorship": {
        "word": "censorship",
        "reading": "センサーシップ",
        "meaning": "検閲・言論統制",
        "etymology": "censor（検閲官）+ -ship（状態を表す接尾辞）",
        "relatedWords": ["control", "suppression", "freedom"],
        "category": "政治・社会",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "chatbots": {
        "word": "chatbots",
        "reading": "チャットボット",
        "meaning": "チャットボット（会話型AIプログラム）",
        "etymology": "chat（おしゃべり）+ bot（ロボット）の複数形",
        "relatedWords": ["AI", "automation", "conversation"],
        "category": "技術",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "deployment": {
        "word": "deployment",
        "reading": "デプロイメント",
        "meaning": "配置・展開・実装",
        "etymology": "deploy（配置する）+ -ment（行為・結果）",
        "relatedWords": ["implementation", "distribution", "launch"],
        "category": "技術・ビジネス",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "deployments": {
        "word": "deployments",
        "reading": "デプロイメント",
        "meaning": "配置・展開・実装（deploymentの複数形）",
        "etymology": "deployment の複数形",
        "relatedWords": ["implementations", "launches", "rollouts"],
        "category": "技術・ビジネス",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "disparities": {
        "word": "disparities",
        "reading": "ディスパリティ",
        "meaning": "格差・不均衡（disparityの複数形）",
        "etymology": "disparity（不均等）の複数形",
        "relatedWords": ["inequality", "differences", "gaps"],
        "category": "社会問題",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "embryos": {
        "word": "embryos",
        "reading": "エンブリオ",
        "meaning": "胚・embryoの複数形",
        "etymology": "embryo（胚）の複数形",
        "relatedWords": ["fetus", "development", "biology"],
        "category": "科学・生物",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "exposure": {
        "word": "exposure",
        "reading": "エクスポージャー",
        "meaning": "暴露・露出・経験",
        "etymology": "expose（さらす）+ -ure（行為・結果）",
        "relatedWords": ["contact", "experience", "revelation"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "footprint": {
        "word": "footprint",
        "reading": "フットプリント",
        "meaning": "足跡・影響範囲（特に環境への）",
        "etymology": "foot（足）+ print（跡）",
        "relatedWords": ["impact", "trace", "carbon"],
        "category": "環境",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "hardship": {
        "word": "hardship",
        "reading": "ハードシップ",
        "meaning": "困難・苦難",
        "etymology": "hard（困難な）+ -ship（状態）",
        "relatedWords": ["difficulty", "suffering", "adversity"],
        "category": "感情・状態",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "homelessness": {
        "word": "homelessness",
        "reading": "ホームレスネス",
        "meaning": "ホームレス状態・住居喪失",
        "etymology": "homeless（家のない）+ -ness（状態）",
        "relatedWords": ["poverty", "housing", "shelter"],
        "category": "社会問題",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "incarceration": {
        "word": "incarceration",
        "reading": "インカーセレーション",
        "meaning": "投獄・拘禁",
        "etymology": "incarcerate（投獄する）+ -ion（行為・状態）",
        "relatedWords": ["imprisonment", "detention", "confinement"],
        "category": "法律・社会",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "inequity": {
        "word": "inequity",
        "reading": "イネクイティ",
        "meaning": "不公平・不公正",
        "etymology": "in-（否定）+ equity（公平）",
        "relatedWords": ["injustice", "unfairness", "disparity"],
        "category": "社会問題",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "inequities": {
        "word": "inequities",
        "reading": "イネクイティ",
        "meaning": "不公平・不公正（inequityの複数形）",
        "etymology": "inequity の複数形",
        "relatedWords": ["injustices", "disparities", "imbalances"],
        "category": "社会問題",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "insecurity": {
        "word": "insecurity",
        "reading": "インセキュリティ",
        "meaning": "不安・不安定",
        "etymology": "in-（否定）+ security（安全・安心）",
        "relatedWords": ["uncertainty", "anxiety", "instability"],
        "category": "感情・状態",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "methane": {
        "word": "methane",
        "reading": "メタン",
        "meaning": "メタン（温室効果ガス）",
        "etymology": "methyl（メチル基）+ -ane（化学接尾辞）",
        "relatedWords": ["greenhouse", "gas", "emissions"],
        "category": "科学・環境",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "misinformation": {
        "word": "misinformation",
        "reading": "ミスインフォメーション",
        "meaning": "誤情報・誤った情報",
        "etymology": "mis-（誤った）+ information（情報）",
        "relatedWords": ["fake", "false", "misleading"],
        "category": "メディア・社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "privilege": {
        "word": "privilege",
        "reading": "プリビレッジ",
        "meaning": "特権・恩恵",
        "etymology": "ラテン語 privilegium（個人に対する法）",
        "relatedWords": ["advantage", "right", "benefit"],
        "category": "社会",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "stigma": {
        "word": "stigma",
        "reading": "スティグマ",
        "meaning": "汚名・烙印",
        "etymology": "ギリシャ語 stigma（刻印）",
        "relatedWords": ["shame", "disgrace", "discrimination"],
        "category": "社会・心理",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch25"
    },
    "urgency": {
        "word": "urgency",
        "reading": "アージェンシー",
        "meaning": "緊急性・切迫感",
        "etymology": "urgent（緊急の）+ -cy（状態）",
        "relatedWords": ["emergency", "pressing", "critical"],
        "category": "一般",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch25"
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
    print("長文読解辞書 単語追加スクリプト（バッチ25）")
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
    
    # バッチ25の単語を追加
    print(f"📝 バッチ25: 社会・技術関連の重要語（{len(BATCH_WORDS)}個）を追加中...")
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
