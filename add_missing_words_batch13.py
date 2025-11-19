#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ13）
科学・技術・抽象概念関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ13: 科学・技術・抽象概念関連）
BATCH13_WORDS = {
    "biology": {
        "word": "biology",
        "reading": "バイオロジー",
        "meaning": "生物学",
        "etymology": "ギリシャ語 bios（生命）+ logia（学問）",
        "relatedWords": "science(サイエンス): 科学, chemistry(ケミストリー): 化学",
        "category": "科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "chemistry": {
        "word": "chemistry",
        "reading": "ケミストリー",
        "meaning": "化学",
        "etymology": "アラビア語 al-kīmiyā（錬金術）",
        "relatedWords": "chemical(ケミカル): 化学物質, physics(フィジックス): 物理学",
        "category": "科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "physics": {
        "word": "physics",
        "reading": "フィジックス",
        "meaning": "物理学",
        "etymology": "ギリシャ語 physis（自然）",
        "relatedWords": "science(サイエンス): 科学, mathematics(マスマティクス): 数学",
        "category": "科学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "scientist": {
        "word": "scientist",
        "reading": "サイエンティスト",
        "meaning": "科学者",
        "etymology": "science（科学）+ -ist（人）",
        "relatedWords": "researcher(リサーチャー): 研究者, expert(エキスパート): 専門家",
        "category": "職業・人",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "researcher": {
        "word": "researcher",
        "reading": "リサーチャー",
        "meaning": "研究者",
        "etymology": "research（研究）+ -er（人）",
        "relatedWords": "scientist(サイエンティスト): 科学者, scholar(スカラー): 学者",
        "category": "職業・人",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "database": {
        "word": "database",
        "reading": "データベース",
        "meaning": "データベース",
        "etymology": "data（データ）+ base（基盤）",
        "relatedWords": "data(データ): データ, information(インフォメーション): 情報",
        "category": "技術",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "algorithm": {
        "word": "algorithm",
        "reading": "アルゴリズム",
        "meaning": "アルゴリズム・計算手順",
        "etymology": "アラビアの数学者 al-Khwarizmi",
        "relatedWords": "process(プロセス): 過程, method(メソッド): 方法",
        "category": "技術・数学",
        "difficulty": "上級",
        "levels": ["上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "video": {
        "word": "video",
        "reading": "ビデオ",
        "meaning": "動画・ビデオ",
        "etymology": "ラテン語 video（私は見る）",
        "relatedWords": "film(フィルム): 映画, movie(ムービー): 映画",
        "category": "メディア・技術",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "reality": {
        "word": "reality",
        "reading": "リアリティ",
        "meaning": "現実",
        "etymology": "ラテン語 realis（実在の）",
        "relatedWords": "real(リアル): 本物の, truth(トゥルース): 真実",
        "category": "概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "belief": {
        "word": "belief",
        "reading": "ビリーフ",
        "meaning": "信念・信仰",
        "etymology": "古英語 geleafa（信仰）",
        "relatedWords": "believe(ビリーブ): 信じる, faith(フェイス): 信仰",
        "category": "概念・心理",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "freedom": {
        "word": "freedom",
        "reading": "フリーダム",
        "meaning": "自由",
        "etymology": "free（自由な）+ -dom（状態）",
        "relatedWords": "free(フリー): 自由な, liberty(リバティ): 自由",
        "category": "概念・権利",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "liberty": {
        "word": "liberty",
        "reading": "リバティ",
        "meaning": "自由・解放",
        "etymology": "ラテン語 libertas（自由）",
        "relatedWords": "freedom(フリーダム): 自由, independence(インディペンデンス): 独立",
        "category": "概念・権利",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "independence": {
        "word": "independence",
        "reading": "インディペンデンス",
        "meaning": "独立・自立",
        "etymology": "in-（否定）+ dependence（依存）",
        "relatedWords": "independent(インディペンデント): 独立した, freedom(フリーダム): 自由",
        "category": "概念・状態",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "justice": {
        "word": "justice",
        "reading": "ジャスティス",
        "meaning": "正義・公正",
        "etymology": "ラテン語 justitia（正義）",
        "relatedWords": "fair(フェア): 公正な, equality(イクオリティ): 平等",
        "category": "概念・社会",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "fairness": {
        "word": "fairness",
        "reading": "フェアネス",
        "meaning": "公平性・公正",
        "etymology": "fair（公平な）+ -ness（名詞化）",
        "relatedWords": "fair(フェア): 公平な, justice(ジャスティス): 正義",
        "category": "概念・性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "equity": {
        "word": "equity",
        "reading": "エクイティ",
        "meaning": "公平・衡平",
        "etymology": "ラテン語 aequitas（公平）",
        "relatedWords": "equal(イコール): 平等な, fairness(フェアネス): 公平性",
        "category": "概念・社会",
        "difficulty": "上級",
        "levels": ["上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "discrimination": {
        "word": "discrimination",
        "reading": "ディスクリミネーション",
        "meaning": "差別",
        "etymology": "discriminate（区別する）+ -ion（名詞化）",
        "relatedWords": "prejudice(プレジュディス): 偏見, bias(バイアス): 偏り",
        "category": "社会問題",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "prejudice": {
        "word": "prejudice",
        "reading": "プレジュディス",
        "meaning": "偏見・先入観",
        "etymology": "ラテン語 praejudicium（予断）",
        "relatedWords": "bias(バイアス): 偏り, discrimination(ディスクリミネーション): 差別",
        "category": "心理・社会",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "legacy": {
        "word": "legacy",
        "reading": "レガシー",
        "meaning": "遺産・遺物",
        "etymology": "ラテン語 legare（遺贈する）",
        "relatedWords": "heritage(ヘリテージ): 遺産, inheritance(インヘリタンス): 相続",
        "category": "概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mystery": {
        "word": "mystery",
        "reading": "ミステリー",
        "meaning": "謎・神秘",
        "etymology": "ギリシャ語 mysterion（秘密）",
        "relatedWords": "secret(シークレット): 秘密, puzzle(パズル): 謎",
        "category": "概念",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
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
    print("長文読解辞書 単語追加スクリプト（バッチ13）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ13: 科学・技術・抽象概念関連の単語（{len(BATCH13_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH13_WORDS.items():
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
