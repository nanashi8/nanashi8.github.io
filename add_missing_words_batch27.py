#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
長文読解辞書 単語追加スクリプト（バッチ27）
残りの単語から優先度の高い20語を追加
"""

import json
import os

# バッチ27: 動詞の派生形・形容詞・名詞
BATCH_WORDS = {
    "categorizing": {
        "word": "categorizing",
        "reading": "カテゴライジング",
        "meaning": "分類すること（categorizeの現在分詞）",
        "etymology": "category（分類）+ -ize（動詞化）+ -ing",
        "relatedWords": ["classifying", "organizing", "sorting"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "curates": {
        "word": "curates",
        "reading": "キュレート",
        "meaning": "厳選する・管理する（curateの三人称単数形）",
        "etymology": "curate（管理する）の三人称単数形",
        "relatedWords": ["selects", "organizes", "manages"],
        "category": "動詞派生",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "deepens": {
        "word": "deepens",
        "reading": "ディープン",
        "meaning": "深める・深くなる（deepenの三人称単数形）",
        "etymology": "deep（深い）+ -en（動詞化）+ -s",
        "relatedWords": ["intensifies", "strengthens", "expands"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "embodies": {
        "word": "embodies",
        "reading": "エンボディ",
        "meaning": "具現化する・体現する（embodyの三人称単数形）",
        "etymology": "em-（中に）+ body（体）+ -ies",
        "relatedWords": ["represents", "exemplifies", "personifies"],
        "category": "動詞派生",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "equalizes": {
        "word": "equalizes",
        "reading": "イコーライズ",
        "meaning": "均等にする（equalizeの三人称単数形）",
        "etymology": "equal（等しい）+ -ize（動詞化）+ -s",
        "relatedWords": ["balances", "evens", "levels"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "infers": {
        "word": "infers",
        "reading": "インファー",
        "meaning": "推論する・推測する（inferの三人称単数形）",
        "etymology": "infer（推論する）の三人称単数形",
        "relatedWords": ["deduces", "concludes", "assumes"],
        "category": "動詞派生",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "misleads": {
        "word": "misleads",
        "reading": "ミスリード",
        "meaning": "誤解させる（misleadの三人称単数形）",
        "etymology": "mis-（誤って）+ lead（導く）+ -s",
        "relatedWords": ["deceives", "confuses", "tricks"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "perpetuates": {
        "word": "perpetuates",
        "reading": "パーペチュエート",
        "meaning": "永続させる（perpetuateの三人称単数形）",
        "etymology": "perpetuate（永続させる）の三人称単数形",
        "relatedWords": ["maintains", "continues", "preserves"],
        "category": "動詞派生",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "personalizes": {
        "word": "personalizes",
        "reading": "パーソナライズ",
        "meaning": "個人化する（personalizeの三人称単数形）",
        "etymology": "personal（個人の）+ -ize（動詞化）+ -s",
        "relatedWords": ["customizes", "tailors", "adapts"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "precedes": {
        "word": "precedes",
        "reading": "プリシード",
        "meaning": "先行する（precedeの三人称単数形）",
        "etymology": "pre-（前）+ cede（行く）+ -s",
        "relatedWords": ["comes before", "leads", "antecedes"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "predicts": {
        "word": "predicts",
        "reading": "プレディクト",
        "meaning": "予測する（predictの三人称単数形）",
        "etymology": "predict（予測する）の三人称単数形",
        "relatedWords": ["forecasts", "anticipates", "foresees"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "reinforces": {
        "word": "reinforces",
        "reading": "リインフォース",
        "meaning": "強化する（reinforceの三人称単数形）",
        "etymology": "re-（再び）+ in-（中に）+ force（力）+ -s",
        "relatedWords": ["strengthens", "supports", "bolsters"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "resists": {
        "word": "resists",
        "reading": "リジスト",
        "meaning": "抵抗する（resistの三人称単数形）",
        "etymology": "resist（抵抗する）の三人称単数形",
        "relatedWords": ["opposes", "withstands", "defies"],
        "category": "動詞派生",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "degraded": {
        "word": "degraded",
        "reading": "デグレイデッド",
        "meaning": "劣化した・低下した（degradeの過去分詞）",
        "etymology": "de-（下へ）+ grade（等級）+ -ed",
        "relatedWords": ["deteriorated", "declined", "worsened"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "outdated": {
        "word": "outdated",
        "reading": "アウトデイテッド",
        "meaning": "時代遅れの・古くなった",
        "etymology": "out（外へ）+ date（日付）+ -ed",
        "relatedWords": ["obsolete", "old-fashioned", "antiquated"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "paralyzed": {
        "word": "paralyzed",
        "reading": "パラライズド",
        "meaning": "麻痺した・動けなくなった",
        "etymology": "paralyze（麻痺させる）+ -ed",
        "relatedWords": ["immobilized", "disabled", "frozen"],
        "category": "形容詞",
        "difficulty": "advanced",
        "levels": ["B2", "C1"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "problematic": {
        "word": "problematic",
        "reading": "プロブレマティック",
        "meaning": "問題のある・厄介な",
        "etymology": "problem（問題）+ -atic（形容詞化接尾辞）",
        "relatedWords": ["troublesome", "difficult", "challenging"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "reactive": {
        "word": "reactive",
        "reading": "リアクティブ",
        "meaning": "反応的な・受け身の",
        "etymology": "react（反応する）+ -ive（形容詞化接尾辞）",
        "relatedWords": ["responsive", "passive", "defensive"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "repetitive": {
        "word": "repetitive",
        "reading": "リペティティブ",
        "meaning": "反復的な・繰り返しの",
        "etymology": "repeat（繰り返す）+ -itive（形容詞化接尾辞）",
        "relatedWords": ["monotonous", "recurring", "routine"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
    },
    "suspicious": {
        "word": "suspicious",
        "reading": "サスピシャス",
        "meaning": "疑わしい・怪しい",
        "etymology": "suspicion（疑い）+ -ous（形容詞化接尾辞）",
        "relatedWords": ["doubtful", "questionable", "dubious"],
        "category": "形容詞",
        "difficulty": "intermediate",
        "levels": ["B1", "B2"],
        "passages": ["reading"],
        "source": "batch27"
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
    print("長文読解辞書 単語追加スクリプト（バッチ27）")
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
    
    # バッチ27の単語を追加
    print(f"📝 バッチ27: 動詞の派生形・形容詞・名詞（{len(BATCH_WORDS)}個）を追加中...")
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
