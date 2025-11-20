#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ17: 副詞・接続詞・前置詞・一般的な形容詞
BATCH_WORDS = {
    "brightly": {
        "word": "brightly",
        "reading": "ブライトリー",
        "meaning": "明るく・輝いて",
        "etymology": "bright（明るい）+ -ly（副詞語尾）",
        "relatedWords": ["bright", "light", "clearly", "vividly"],
        "category": "副詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Science"],
        "source": "batch17"
    },
    "emotionally": {
        "word": "emotionally",
        "reading": "エモーショナリー",
        "meaning": "感情的に・情緒的に",
        "etymology": "emotional（感情的な）+ -ly（副詞語尾）",
        "relatedWords": ["emotion", "feeling", "mentally", "psychologically"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Psychology"],
        "source": "batch17"
    },
    "digitally": {
        "word": "digitally",
        "reading": "デジタリー",
        "meaning": "デジタル的に・電子的に",
        "etymology": "digital（デジタルの）+ -ly（副詞語尾）",
        "relatedWords": ["digital", "electronically", "online", "virtual"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch17"
    },
    "personally": {
        "word": "personally",
        "reading": "パーソナリー",
        "meaning": "個人的に・自ら",
        "etymology": "personal（個人的な）+ -ly（副詞語尾）",
        "relatedWords": ["personal", "individually", "privately", "directly"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Communication"],
        "source": "batch17"
    },
    "remotely": {
        "word": "remotely",
        "reading": "リモートリー",
        "meaning": "遠隔で・リモートで",
        "etymology": "remote（遠隔の）+ -ly（副詞語尾）",
        "relatedWords": ["remote", "distantly", "online", "virtually"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch17"
    },
    "wisely": {
        "word": "wisely",
        "reading": "ワイズリー",
        "meaning": "賢く・賢明に",
        "etymology": "wise（賢い）+ -ly（副詞語尾）",
        "relatedWords": ["wise", "carefully", "intelligently", "prudently"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["General"],
        "source": "batch17"
    },
    "mindfully": {
        "word": "mindfully",
        "reading": "マインドフリー",
        "meaning": "注意深く・意識的に",
        "etymology": "mindful（注意深い）+ -ly（副詞語尾）",
        "relatedWords": ["mindful", "carefully", "consciously", "attentively"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Psychology"],
        "source": "batch17"
    },
    "respectfully": {
        "word": "respectfully",
        "reading": "リスペクトフリー",
        "meaning": "敬意をもって・丁重に",
        "etymology": "respectful（敬意を表する）+ -ly（副詞語尾）",
        "relatedWords": ["respect", "politely", "courteously", "honorably"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Social Studies"],
        "source": "batch17"
    },
    "dynamically": {
        "word": "dynamically",
        "reading": "ダイナミカリー",
        "meaning": "動的に・活発に",
        "etymology": "dynamic（動的な）+ -ally（副詞語尾）",
        "relatedWords": ["dynamic", "actively", "vigorously", "energetically"],
        "category": "副詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Science"],
        "source": "batch17"
    },
    "exponentially": {
        "word": "exponentially",
        "reading": "エクスポネンシャリー",
        "meaning": "指数関数的に・急激に",
        "etymology": "exponential（指数の）+ -ly（副詞語尾）",
        "relatedWords": ["exponential", "rapidly", "dramatically", "explosively"],
        "category": "副詞",
        "difficulty": "上級",
        "levels": ["高校2年", "英検準1級"],
        "passages": ["Mathematics"],
        "source": "batch17"
    },
    "objectively": {
        "word": "objectively",
        "reading": "オブジェクティヴリー",
        "meaning": "客観的に・公平に",
        "etymology": "objective（客観的な）+ -ly（副詞語尾）",
        "relatedWords": ["objective", "impartially", "fairly", "neutrally"],
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch17"
    },
    "systematically": {
        "word": "systematically",
        "reading": "システマティカリー",
        "meaning": "体系的に・組織的に",
        "etymology": "systematic（体系的な）+ -ally（副詞語尾）",
        "relatedWords": ["systematic", "methodically", "orderly", "organized"],
        "category": "副詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Science"],
        "source": "batch17"
    },
    "subtly": {
        "word": "subtly",
        "reading": "サトリー",
        "meaning": "微妙に・さりげなく",
        "etymology": "subtle（微妙な）+ -ly（副詞語尾）",
        "relatedWords": ["subtle", "slightly", "delicately", "quietly"],
        "category": "副詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Arts"],
        "source": "batch17"
    },
    "uncritically": {
        "word": "uncritically",
        "reading": "アンクリティカリー",
        "meaning": "無批判に・盲目的に",
        "etymology": "un-（否定）+ critical（批判的な）+ -ly（副詞語尾）",
        "relatedWords": ["critical", "blindly", "unquestioningly", "naively"],
        "category": "副詞",
        "difficulty": "上級",
        "levels": ["高校2年", "英検準1級"],
        "passages": ["Critical Thinking"],
        "source": "batch17"
    },
    "thoughtful": {
        "word": "thoughtful",
        "reading": "ソートフル",
        "meaning": "思慮深い・親切な",
        "etymology": "thought（思考）+ -ful（満ちた）",
        "relatedWords": ["think", "considerate", "caring", "kind"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Psychology"],
        "source": "batch17"
    },
    "thankful": {
        "word": "thankful",
        "reading": "サンクフル",
        "meaning": "感謝している・ありがたい",
        "etymology": "thank（感謝する）+ -ful（満ちた）",
        "relatedWords": ["grateful", "appreciative", "pleased", "glad"],
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Daily Life"],
        "source": "batch17"
    },
    "experimental": {
        "word": "experimental",
        "reading": "エクスペリメンタル",
        "meaning": "実験的な・試験的な",
        "etymology": "experiment（実験）+ -al（〜の）",
        "relatedWords": ["experiment", "trial", "test", "innovative"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Science"],
        "source": "batch17"
    },
    "interactive": {
        "word": "interactive",
        "reading": "インタラクティヴ",
        "meaning": "双方向の・対話型の",
        "etymology": "interact（相互作用する）+ -ive（〜的な）",
        "relatedWords": ["interaction", "mutual", "reciprocal", "responsive"],
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Technology"],
        "source": "batch17"
    },
    "immersive": {
        "word": "immersive",
        "reading": "イマーシヴ",
        "meaning": "没入型の・臨場感のある",
        "etymology": "immerse（浸す）+ -ive（〜的な）",
        "relatedWords": ["immersion", "absorbing", "engaging", "virtual"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Technology"],
        "source": "batch17"
    },
    "inclusive": {
        "word": "inclusive",
        "reading": "インクルーシヴ",
        "meaning": "包括的な・包摂的な",
        "etymology": "include（含む）+ -ive（〜的な）",
        "relatedWords": ["include", "comprehensive", "all-embracing", "universal"],
        "category": "形容詞",
        "difficulty": "上級",
        "levels": ["高校1年", "英検2級"],
        "passages": ["Social Studies"],
        "source": "batch17"
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
    print("長文読解辞書 単語追加スクリプト（バッチ17）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ17の単語を追加
    print(f"📝 バッチ17: 副詞・接続詞・前置詞・一般的な形容詞（{len(BATCH_WORDS)}個）を追加中...")
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
