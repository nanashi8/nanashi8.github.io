#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
基本的な欠落単語を辞書に追加するスクリプト
challenge, of, time, environmental, resource等
"""

import json

# 基本的な欠落単語
BASIC_WORDS = {
    "challenge": {
        "word": "challenge",
        "reading": "チャレンジ",
        "meaning": "挑戦・課題",
        "etymology": "古フランス語 chalenge から",
        "relatedWords": ["difficulty", "problem", "task"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "of": {
        "word": "of",
        "reading": "オブ",
        "meaning": "〜の",
        "etymology": "古英語 of から",
        "relatedWords": [],
        "category": "前置詞",
        "difficulty": "beginner",
        "levels": ["A1", "A2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "time": {
        "word": "time",
        "reading": "タイム",
        "meaning": "時間・時",
        "etymology": "古英語 tima から",
        "relatedWords": ["moment", "period", "era"],
        "category": "名詞",
        "difficulty": "beginner",
        "levels": ["A1", "A2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "environmental": {
        "word": "environmental",
        "reading": "エンバイロメンタル",
        "meaning": "環境の",
        "etymology": "environment（環境）+ -al（〜の）",
        "relatedWords": ["ecological", "natural", "green"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "resource": {
        "word": "resource",
        "reading": "リソース",
        "meaning": "資源・財源",
        "etymology": "古フランス語 ressource から",
        "relatedWords": ["supply", "asset", "material"],
        "category": "名詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "our": {
        "word": "our",
        "reading": "アワー",
        "meaning": "私たちの",
        "etymology": "古英語 ure から",
        "relatedWords": ["we", "us", "ours"],
        "category": "代名詞",
        "difficulty": "beginner",
        "levels": ["A1", "A2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "that": {
        "word": "that",
        "reading": "ザット",
        "meaning": "あれ・それ・あの",
        "etymology": "古英語 þæt から",
        "relatedWords": ["this", "those", "these"],
        "category": "代名詞・接続詞",
        "difficulty": "beginner",
        "levels": ["A1", "A2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "require": {
        "word": "require",
        "reading": "リクワイア",
        "meaning": "必要とする・要求する",
        "etymology": "ラテン語 requirere から",
        "relatedWords": ["need", "demand", "call for"],
        "category": "動詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "urgent": {
        "word": "urgent",
        "reading": "アージェント",
        "meaning": "緊急の・急を要する",
        "etymology": "ラテン語 urgens から",
        "relatedWords": ["pressing", "critical", "immediate"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "basic_missing"
    },
    "action": {
        "word": "action",
        "reading": "アクション",
        "meaning": "行動・行為",
        "etymology": "ラテン語 actio から",
        "relatedWords": ["act", "deed", "activity"],
        "category": "名詞",
        "difficulty": "beginner",
        "levels": ["A2", "B1"],
        "passages": ["reading"],
        "source": "basic_missing"
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
    print("基本的な欠落単語を辞書に追加")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print(f"📖 辞書を読み込んでいます...")
    dictionary = load_dictionary()
    if dictionary is None:
        return
    
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # 基本単語を追加
    print(f"📝 基本的な欠落単語（{len(BASIC_WORDS)}個）を追加中...")
    added_count = 0
    skipped_count = 0
    
    for word, data in BASIC_WORDS.items():
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
