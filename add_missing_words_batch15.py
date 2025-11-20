#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# バッチ15: 一般的な名詞・動詞・形容詞（ビジネス・健康・感情関連）
BATCH_WORDS = {
    "business": {
        "word": "business",
        "reading": "ビジネス",
        "meaning": "事業・商売・仕事",
        "etymology": "古英語 bisignis（忙しさ）← bisy（忙しい）",
        "relatedWords": ["company", "trade", "commerce", "enterprise"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Sustainable Society"],
        "source": "batch15"
    },
    "employment": {
        "word": "employment",
        "reading": "エンプロイメント",
        "meaning": "雇用・就職",
        "etymology": "フランス語 emploier（使う）← ラテン語 implicare（巻き込む）",
        "relatedWords": ["job", "work", "occupation", "career"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学3年", "英検準2級"],
        "passages": ["Sustainable Society"],
        "source": "batch15"
    },
    "entertainment": {
        "word": "entertainment",
        "reading": "エンターテインメント",
        "meaning": "娯楽・演芸",
        "etymology": "フランス語 entretenir（楽しませる）← entre-（間）+ tenir（保つ）",
        "relatedWords": ["fun", "amusement", "recreation", "pleasure"],
        "category": "名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Digital Age"],
        "source": "batch15"
    },
    "blood": {
        "word": "blood",
        "reading": "ブラッド",
        "meaning": "血・血液",
        "etymology": "古英語 blōd ← ゲルマン祖語 *blōþam",
        "relatedWords": ["circulation", "vessel", "heart", "oxygen"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Health and Wellness"],
        "source": "batch15"
    },
    "brain": {
        "word": "brain",
        "reading": "ブレイン",
        "meaning": "脳・頭脳",
        "etymology": "古英語 brægen ← ゲルマン祖語 *bragnam",
        "relatedWords": ["mind", "intelligence", "thought", "memory"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Health and Wellness"],
        "source": "batch15"
    },
    "hair": {
        "word": "hair",
        "reading": "ヘア",
        "meaning": "髪・毛",
        "etymology": "古英語 hǣr ← ゲルマン祖語 *hēram",
        "relatedWords": ["head", "cut", "style", "color"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Daily Life"],
        "source": "batch15"
    },
    "teeth": {
        "word": "teeth",
        "reading": "ティース",
        "meaning": "歯（toothの複数形）",
        "etymology": "古英語 tēþ（toothの複数形）← ゲルマン祖語 *tanþiz",
        "relatedWords": ["tooth", "dental", "mouth", "brush"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Health and Wellness"],
        "source": "batch15"
    },
    "count": {
        "word": "count",
        "reading": "カウント",
        "meaning": "数える・数",
        "etymology": "ラテン語 computare（計算する）← com-（共に）+ putare（考える）",
        "relatedWords": ["number", "calculate", "total", "amount"],
        "category": "動詞・名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Mathematics"],
        "source": "batch15"
    },
    "dance": {
        "word": "dance",
        "reading": "ダンス",
        "meaning": "踊る・ダンス",
        "etymology": "フランス語 danser ← 古フランス語 dancier",
        "relatedWords": ["music", "move", "rhythm", "perform"],
        "category": "動詞・名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Arts and Culture"],
        "source": "batch15"
    },
    "hide": {
        "word": "hide",
        "reading": "ハイド",
        "meaning": "隠す・隠れる",
        "etymology": "古英語 hȳdan ← ゲルマン祖語 *hūdijaną",
        "relatedWords": ["conceal", "cover", "secret", "reveal"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Daily Life"],
        "source": "batch15"
    },
    "let": {
        "word": "let",
        "reading": "レット",
        "meaning": "〜させる・許す",
        "etymology": "古英語 lǣtan（許す）← ゲルマン祖語 *lētaną",
        "relatedWords": ["allow", "permit", "enable", "make"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Grammar Patterns"],
        "source": "batch15"
    },
    "match": {
        "word": "match",
        "reading": "マッチ",
        "meaning": "一致する・試合・マッチ",
        "etymology": "古英語 gemæcca（仲間）← ゲルマン祖語 *makōn",
        "relatedWords": ["fit", "suit", "game", "contest"],
        "category": "動詞・名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Sports"],
        "source": "batch15"
    },
    "fix": {
        "word": "fix",
        "reading": "フィックス",
        "meaning": "修理する・固定する",
        "etymology": "ラテン語 fixus（固定された）← figere（固定する）",
        "relatedWords": ["repair", "mend", "correct", "attach"],
        "category": "動詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Daily Life"],
        "source": "batch15"
    },
    "bright": {
        "word": "bright",
        "reading": "ブライト",
        "meaning": "明るい・輝く",
        "etymology": "古英語 beorht ← ゲルマン祖語 *berhtaz",
        "relatedWords": ["light", "shiny", "brilliant", "cheerful"],
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Science"],
        "source": "batch15"
    },
    "mood": {
        "word": "mood",
        "reading": "ムード",
        "meaning": "気分・雰囲気",
        "etymology": "古英語 mōd（心・勇気）← ゲルマン祖語 *mōdaz",
        "relatedWords": ["feeling", "emotion", "atmosphere", "spirit"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Psychology"],
        "source": "batch15"
    },
    "iron": {
        "word": "iron",
        "reading": "アイアン",
        "meaning": "鉄・アイロン",
        "etymology": "古英語 īren ← ゲルマン祖語 *īsarną",
        "relatedWords": ["metal", "steel", "press", "strong"],
        "category": "名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Science", "Daily Life"],
        "source": "batch15"
    },
    "honor": {
        "word": "honor",
        "reading": "オナー",
        "meaning": "名誉・敬意",
        "etymology": "ラテン語 honor（名誉）← honos",
        "relatedWords": ["respect", "dignity", "pride", "glory"],
        "category": "名詞・動詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Social Studies"],
        "source": "batch15"
    },
    "master": {
        "word": "master",
        "reading": "マスター",
        "meaning": "習得する・主人・達人",
        "etymology": "ラテン語 magister（教師・主人）← magis（より）",
        "relatedWords": ["expert", "learn", "skill", "control"],
        "category": "動詞・名詞",
        "difficulty": "中級",
        "levels": ["中学2年", "英検3級"],
        "passages": ["Education"],
        "source": "batch15"
    },
    "welcome": {
        "word": "welcome",
        "reading": "ウェルカム",
        "meaning": "歓迎する・ようこそ",
        "etymology": "古英語 wilcuma（望ましい来訪者）← wil（望み）+ cuma（来る人）",
        "relatedWords": ["greet", "receive", "accept", "invite"],
        "category": "動詞・形容詞・名詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検4級"],
        "passages": ["Daily Life"],
        "source": "batch15"
    },
    "young": {
        "word": "young",
        "reading": "ヤング",
        "meaning": "若い・幼い",
        "etymology": "古英語 geong ← ゲルマン祖語 *jungaz",
        "relatedWords": ["youth", "child", "new", "old"],
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["中学1年", "英検5級"],
        "passages": ["Daily Life"],
        "source": "batch15"
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
    print("長文読解辞書 単語追加スクリプト（バッチ15）")
    print("=" * 60)
    print()
    
    # 辞書を読み込む
    print("📖 辞書を読み込んでいます: public/data/reading-passages-dictionary.json")
    dictionary = load_dictionary()
    original_count = len(dictionary)
    print(f"   現在の単語数: {original_count}")
    print()
    
    # バッチ15の単語を追加
    print(f"📝 バッチ15: 一般的な名詞・動詞・形容詞（ビジネス・健康・感情関連）（{len(BATCH_WORDS)}個）を追加中...")
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
