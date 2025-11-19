#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ8）
教育・学習・コミュニケーション関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ8: 教育・学習・コミュニケーション関連）
BATCH8_WORDS = {
    "classroom": {
        "word": "classroom",
        "reading": "クラスルーム",
        "meaning": "教室",
        "etymology": "class（クラス）+ room（部屋）",
        "relatedWords": "class(クラス): 授業, school(スクール): 学校",
        "category": "教育・場所",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "textbook": {
        "word": "textbook",
        "reading": "テキストブック",
        "meaning": "教科書",
        "etymology": "text（テキスト）+ book（本）",
        "relatedWords": "book(ブック): 本, material(マテリアル): 教材",
        "category": "教育",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "scholarship": {
        "word": "scholarship",
        "reading": "スカラーシップ",
        "meaning": "奨学金・学問",
        "etymology": "scholar（学者）+ -ship（状態）",
        "relatedWords": "scholar(スカラー): 学者, student(スチューデント): 学生",
        "category": "教育",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "literacy": {
        "word": "literacy",
        "reading": "リテラシー",
        "meaning": "読み書き能力・リテラシー",
        "etymology": "literate（読み書きできる）+ -cy（名詞化）",
        "relatedWords": "literate(リテレート): 読み書きできる, education(エデュケーション): 教育",
        "category": "教育・能力",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "online": {
        "word": "online",
        "reading": "オンライン",
        "meaning": "オンラインの・インターネット上の",
        "etymology": "on（上に）+ line（線）",
        "relatedWords": "offline(オフライン): オフラインの, internet(インターネット): インターネット",
        "category": "技術",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "offline": {
        "word": "offline",
        "reading": "オフライン",
        "meaning": "オフラインの・インターネット接続がない",
        "etymology": "off（離れて）+ line（線）",
        "relatedWords": "online(オンライン): オンラインの, disconnected(ディスコネクテッド): 切断された",
        "category": "技術",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "email": {
        "word": "email",
        "reading": "イーメール",
        "meaning": "電子メール",
        "etymology": "electronic（電子の）+ mail（郵便）",
        "relatedWords": "message(メッセージ): メッセージ, internet(インターネット): インターネット",
        "category": "技術・コミュニケーション",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "website": {
        "word": "website",
        "reading": "ウェブサイト",
        "meaning": "ウェブサイト",
        "etymology": "web（網）+ site（場所）",
        "relatedWords": "internet(インターネット): インターネット, webpage(ウェブページ): ウェブページ",
        "category": "技術",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "smartphone": {
        "word": "smartphone",
        "reading": "スマートフォン",
        "meaning": "スマートフォン",
        "etymology": "smart（賢い）+ phone（電話）",
        "relatedWords": "phone(フォン): 電話, mobile(モバイル): 携帯の",
        "category": "技術",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "communication": {
        "word": "communication",
        "reading": "コミュニケーション",
        "meaning": "コミュニケーション・意思疎通",
        "etymology": "ラテン語 communicare（共有する）",
        "relatedWords": "communicate(コミュニケート): 伝達する, conversation(カンバセーション): 会話",
        "category": "コミュニケーション",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "discussion": {
        "word": "discussion",
        "reading": "ディスカッション",
        "meaning": "議論・討論",
        "etymology": "discuss（議論する）+ -ion（名詞化）",
        "relatedWords": "discuss(ディスカス): 議論する, debate(ディベート): 討論",
        "category": "コミュニケーション",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "interview": {
        "word": "interview",
        "reading": "インタビュー",
        "meaning": "面接・インタビュー",
        "etymology": "inter-（間）+ view（見る）",
        "relatedWords": "conversation(カンバセーション): 会話, question(クエスチョン): 質問",
        "category": "コミュニケーション",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "presentation": {
        "word": "presentation",
        "reading": "プレゼンテーション",
        "meaning": "発表・プレゼンテーション",
        "etymology": "present（提示する）+ -ation（名詞化）",
        "relatedWords": "present(プレゼント): 提示する, speech(スピーチ): スピーチ",
        "category": "コミュニケーション",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "memorize": {
        "word": "memorize",
        "reading": "メモライズ",
        "meaning": "暗記する・記憶する",
        "etymology": "memory（記憶）+ -ize（動詞化）",
        "relatedWords": "memory(メモリー): 記憶, remember(リメンバー): 覚えている",
        "category": "学習・認知",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "curious": {
        "word": "curious",
        "reading": "キュリアス",
        "meaning": "好奇心が強い・興味津々の",
        "etymology": "ラテン語 curiosus（注意深い）",
        "relatedWords": "curiosity(キュリオシティ): 好奇心, interested(インタレステッド): 興味がある",
        "category": "性質・心理",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mentor": {
        "word": "mentor",
        "reading": "メンター",
        "meaning": "指導者・助言者",
        "etymology": "ギリシャ神話の人物 Mentor",
        "relatedWords": "teacher(ティーチャー): 教師, guide(ガイド): 案内人",
        "category": "人・教育",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "inspire": {
        "word": "inspire",
        "reading": "インスパイア",
        "meaning": "励ます・鼓舞する",
        "etymology": "ラテン語 inspirare（息を吹き込む）",
        "relatedWords": "inspiration(インスピレーション): 刺激, motivate(モチベート): 動機付ける",
        "category": "心理・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "motivated": {
        "word": "motivated",
        "reading": "モチベーテッド",
        "meaning": "やる気のある・動機付けられた",
        "etymology": "motivate（動機付ける）の過去分詞",
        "relatedWords": "motivation(モチベーション): 動機, inspire(インスパイア): 励ます",
        "category": "心理",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "passion": {
        "word": "passion",
        "reading": "パッション",
        "meaning": "情熱・熱意",
        "etymology": "ラテン語 passio（苦しみ）",
        "relatedWords": "passionate(パッショネイト): 情熱的な, enthusiasm(エンスージアズム): 熱意",
        "category": "心理",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "excellence": {
        "word": "excellence",
        "reading": "エクセレンス",
        "meaning": "卓越・優秀さ",
        "etymology": "ラテン語 excellentia（優れていること）",
        "relatedWords": "excellent(エクセレント): 優れた, quality(クオリティ): 品質",
        "category": "性質・評価",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    }
}

def load_json(filepath):
    """JSONファイルを読み込む"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filepath):
    """JSONファイルを保存する"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ {filepath} を保存しました")

def main():
    print("=" * 60)
    print("長文読解辞書 単語追加スクリプト（バッチ8）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ8: 教育・学習・コミュニケーション関連の単語（{len(BATCH8_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH8_WORDS.items():
        if word_key.lower() not in dictionary:
            dictionary[word_key.lower()] = word_data
            added_count += 1
            print(f"  ✓ {word_data['word']}: {word_data['meaning']}")
        else:
            skipped_count += 1
            print(f"  - {word_key} は既に存在します")
    
    if added_count > 0:
        save_json(dictionary, dict_path)
        print(f"\n✅ {added_count}個の単語を辞書に追加しました")
        print(f"   スキップ: {skipped_count}個")
        print(f"   新しい単語数: {len(dictionary)} (元: {original_count})")
    else:
        print(f"\n✓ 追加する新しい単語はありませんでした")
    
    print("\n" + "=" * 60)
    print("完了")
    print("=" * 60)

if __name__ == '__main__':
    main()
