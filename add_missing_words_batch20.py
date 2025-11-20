#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ20: 動詞・形容詞の派生語と一般的な単語
BATCH_WORDS = {
    "exists": {
        "word": "exists",
        "reading": "イグジスツ",
        "meaning": "存在する（existの三人称単数形）",
        "etymology": "exist（存在する）+ -s（三人称単数）← ラテン語 existere",
        "relatedWords": ["exist", "existence", "being", "present"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Philosophy"],
        "source": "batch20"
    },
    "involves": {
        "word": "involves",
        "reading": "インヴォルヴズ",
        "meaning": "含む・巻き込む（involveの三人称単数形）",
        "etymology": "involve（含む）+ -s（三人称単数）← ラテン語 involvere",
        "relatedWords": ["involve", "include", "require", "entail"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch20"
    },
    "indicates": {
        "word": "indicates",
        "reading": "インディケイツ",
        "meaning": "示す・指し示す（indicateの三人称単数形）",
        "etymology": "indicate（示す）+ -s（三人称単数）← ラテン語 indicare",
        "relatedWords": ["indicate", "show", "suggest", "signal"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Science"],
        "source": "batch20"
    },
    "promotes": {
        "word": "promotes",
        "reading": "プロモウツ",
        "meaning": "促進する・推進する（promoteの三人称単数形）",
        "etymology": "promote（促進する）+ -s（三人称単数）← ラテン語 promovere",
        "relatedWords": ["promote", "encourage", "support", "advance"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Business"],
        "source": "batch20"
    },
    "regulates": {
        "word": "regulates",
        "reading": "レギュレイツ",
        "meaning": "規制する・調整する（regulateの三人称単数形）",
        "etymology": "regulate（規制する）+ -s（三人称単数）← ラテン語 regula（規則）",
        "relatedWords": ["regulate", "control", "manage", "govern"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch20"
    },
    "motivates": {
        "word": "motivates",
        "reading": "モチベイツ",
        "meaning": "動機づける・意欲を起こさせる（motivateの三人称単数形）",
        "etymology": "motivate（動機づける）+ -s（三人称単数）← ラテン語 movere（動かす）",
        "relatedWords": ["motivate", "inspire", "encourage", "drive"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Psychology"],
        "source": "batch20"
    },
    "sustains": {
        "word": "sustains",
        "reading": "サステインズ",
        "meaning": "維持する・持続させる（sustainの三人称単数形）",
        "etymology": "sustain（維持する）+ -s（三人称単数）← ラテン語 sustinere",
        "relatedWords": ["sustain", "maintain", "support", "keep"],
        "category": "動詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Environment"],
        "source": "batch20"
    },
    "solves": {
        "word": "solves",
        "reading": "ソルヴズ",
        "meaning": "解決する（solveの三人称単数形）",
        "etymology": "solve（解決する）+ -s（三人称単数）← ラテン語 solvere",
        "relatedWords": ["solve", "solution", "resolve", "fix"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Mathematics"],
        "source": "batch20"
    },
    "treats": {
        "word": "treats",
        "reading": "トリーツ",
        "meaning": "扱う・治療する（treatの三人称単数形）・ごちそう",
        "etymology": "treat（扱う）+ -s（三人称単数）← ラテン語 tractare",
        "relatedWords": ["treat", "treatment", "handle", "cure"],
        "category": "動詞・名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Health"],
        "source": "batch20"
    },
    "shifts": {
        "word": "shifts",
        "reading": "シフツ",
        "meaning": "移動する・変わる（shiftの三人称単数形）・交代勤務",
        "etymology": "shift（移動する）+ -s（三人称単数）← 古英語 sciftan",
        "relatedWords": ["shift", "change", "move", "transfer"],
        "category": "動詞・名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch20"
    },
    "informed": {
        "word": "informed",
        "reading": "インフォームド",
        "meaning": "知識のある・情報に基づいた",
        "etymology": "inform（知らせる）+ -ed（形容詞）← ラテン語 informare",
        "relatedWords": ["inform", "knowledgeable", "educated", "aware"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Education"],
        "source": "batch20"
    },
    "integrated": {
        "word": "integrated",
        "reading": "インテグレイテッド",
        "meaning": "統合された・一体化した",
        "etymology": "integrate（統合する）+ -ed（形容詞）← ラテン語 integrare",
        "relatedWords": ["integrate", "unified", "combined", "merged"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Technology"],
        "source": "batch20"
    },
    "isolated": {
        "word": "isolated",
        "reading": "アイソレイテッド",
        "meaning": "孤立した・隔離された",
        "etymology": "isolate（孤立させる）+ -ed（形容詞）← イタリア語 isolare",
        "relatedWords": ["isolate", "separated", "alone", "remote"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch20"
    },
    "marginalized": {
        "word": "marginalized",
        "reading": "マージナライズド",
        "meaning": "疎外された・周縁化された",
        "etymology": "marginalize（疎外する）+ -ed（形容詞）← margin（縁）",
        "relatedWords": ["margin", "excluded", "disadvantaged", "oppressed"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Social Issues"],
        "source": "batch20"
    },
    "interconnected": {
        "word": "interconnected",
        "reading": "インターコネクテッド",
        "meaning": "相互接続された・相互に関連した",
        "etymology": "inter-（相互）+ connected（接続された）",
        "relatedWords": ["connect", "linked", "related", "interdependent"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Technology"],
        "source": "batch20"
    },
    "planetary": {
        "word": "planetary",
        "reading": "プラネタリー",
        "meaning": "惑星の・地球規模の",
        "etymology": "planet（惑星）+ -ary（〜の）← ギリシャ語 planetes（さまよう者）",
        "relatedWords": ["planet", "global", "worldwide", "cosmic"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch20"
    },
    "societal": {
        "word": "societal",
        "reading": "ソサイアタル",
        "meaning": "社会の・社会的な",
        "etymology": "society（社会）+ -al（〜の）← ラテン語 societas",
        "relatedWords": ["society", "social", "community", "public"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Studies"],
        "source": "batch20"
    },
    "multicultural": {
        "word": "multicultural",
        "reading": "マルチカルチュラル",
        "meaning": "多文化の・多文化主義の",
        "etymology": "multi-（多）+ cultural（文化の）",
        "relatedWords": ["culture", "diverse", "international", "cosmopolitan"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Social Studies"],
        "source": "batch20"
    },
    "recreational": {
        "word": "recreational",
        "reading": "レクリエーショナル",
        "meaning": "娯楽の・レクリエーションの",
        "etymology": "recreation（娯楽）+ -al（〜の）← ラテン語 recreare（再創造する）",
        "relatedWords": ["recreation", "leisure", "entertainment", "fun"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Sports"],
        "source": "batch20"
    },
    "invaluable": {
        "word": "invaluable",
        "reading": "インヴァリュアブル",
        "meaning": "非常に貴重な・計り知れない価値のある",
        "etymology": "in-（非常に）+ valuable（貴重な）",
        "relatedWords": ["valuable", "priceless", "precious", "essential"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["General"],
        "source": "batch20"
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
    print("長文読解辞書 単語追加スクリプト（バッチ20）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ20の単語を追加
    print(f"📝 バッチ20: 動詞・形容詞の派生語と一般的な単語（{len(BATCH_WORDS)}個）を追加中...")
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
