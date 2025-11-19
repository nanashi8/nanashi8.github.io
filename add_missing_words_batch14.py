#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ14）
一般的な形容詞・副詞・接続詞関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ14: 一般的な形容詞・副詞・接続詞関連）
BATCH14_WORDS = {
    "easier": {
        "word": "easier",
        "reading": "イージアー",
        "meaning": "より簡単な（easyの比較級）",
        "etymology": "easy（簡単な）の比較級",
        "relatedWords": "easy(イージー): 簡単な, simple(シンプル): 単純な",
        "category": "形容詞・比較級",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "earlier": {
        "word": "earlier",
        "reading": "アーリアー",
        "meaning": "より早い・以前の（earlyの比較級）",
        "etymology": "early（早い）の比較級",
        "relatedWords": "early(アーリー): 早い, before(ビフォー): 前に",
        "category": "形容詞・副詞・比較級",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "bigger": {
        "word": "bigger",
        "reading": "ビガー",
        "meaning": "より大きい（bigの比較級）",
        "etymology": "big（大きい）の比較級",
        "relatedWords": "big(ビッグ): 大きい, large(ラージ): 大きい",
        "category": "形容詞・比較級",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "biggest": {
        "word": "biggest",
        "reading": "ビゲスト",
        "meaning": "最も大きい（bigの最上級）",
        "etymology": "big（大きい）の最上級",
        "relatedWords": "big(ビッグ): 大きい, largest(ラージェスト): 最大の",
        "category": "形容詞・最上級",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "safer": {
        "word": "safer",
        "reading": "セーファー",
        "meaning": "より安全な（safeの比較級）",
        "etymology": "safe（安全な）の比較級",
        "relatedWords": "safe(セーフ): 安全な, secure(セキュア): 安全な",
        "category": "形容詞・比較級",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "powerful": {
        "word": "powerful",
        "reading": "パワフル",
        "meaning": "強力な・力強い",
        "etymology": "power（力）+ -ful（満ちた）",
        "relatedWords": "power(パワー): 力, strong(ストロング): 強い",
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "peaceful": {
        "word": "peaceful",
        "reading": "ピースフル",
        "meaning": "平和な・穏やかな",
        "etymology": "peace（平和）+ -ful（満ちた）",
        "relatedWords": "peace(ピース): 平和, calm(カーム): 穏やかな",
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "useful": {
        "word": "useful",
        "reading": "ユースフル",
        "meaning": "役に立つ・有用な",
        "etymology": "use（使う）+ -ful（満ちた）",
        "relatedWords": "helpful(ヘルプフル): 役立つ, beneficial(ベネフィシャル): 有益な",
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "enjoyable": {
        "word": "enjoyable",
        "reading": "エンジョイアブル",
        "meaning": "楽しい・愉快な",
        "etymology": "enjoy（楽しむ）+ -able（可能な）",
        "relatedWords": "fun(ファン): 楽しい, pleasant(プレザント): 快い",
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "realistic": {
        "word": "realistic",
        "reading": "リアリスティック",
        "meaning": "現実的な・写実的な",
        "etymology": "real（現実の）+ -istic（形容詞化）",
        "relatedWords": "real(リアル): 本物の, practical(プラクティカル): 実用的な",
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "scary": {
        "word": "scary",
        "reading": "スケアリー",
        "meaning": "怖い・恐ろしい",
        "etymology": "scare（怖がらせる）+ -y（形容詞化）",
        "relatedWords": "frightening(フライトニング): 恐ろしい, terrifying(テリファイング): 恐怖の",
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "funny": {
        "word": "funny",
        "reading": "ファニー",
        "meaning": "面白い・おかしい",
        "etymology": "fun（楽しみ）+ -y（形容詞化）",
        "relatedWords": "amusing(アミュージング): 面白い, humorous(ヒューモラス): ユーモアのある",
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "tiny": {
        "word": "tiny",
        "reading": "タイニー",
        "meaning": "とても小さい",
        "etymology": "語源不明",
        "relatedWords": "small(スモール): 小さい, little(リトル): 小さい",
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "whole": {
        "word": "whole",
        "reading": "ホール",
        "meaning": "全体の・完全な",
        "etymology": "古英語 hal（完全な）",
        "relatedWords": "entire(エンタイア): 全体の, complete(コンプリート): 完全な",
        "category": "形容詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "multiple": {
        "word": "multiple",
        "reading": "マルチプル",
        "meaning": "複数の・多数の",
        "etymology": "ラテン語 multiplex（多重の）",
        "relatedWords": "many(メニー): 多くの, several(セブラル): いくつかの",
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "ongoing": {
        "word": "ongoing",
        "reading": "オンゴーイング",
        "meaning": "進行中の・継続中の",
        "etymology": "on（上に）+ going（進行）",
        "relatedWords": "continuing(コンティニューイング): 継続する, current(カレント): 現在の",
        "category": "形容詞",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "instantly": {
        "word": "instantly",
        "reading": "インスタントリー",
        "meaning": "即座に・すぐに",
        "etymology": "instant（即座の）+ -ly（副詞化）",
        "relatedWords": "immediately(イミーディエイトリー): すぐに, quickly(クイックリー): 素早く",
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "importantly": {
        "word": "importantly",
        "reading": "インポータントリー",
        "meaning": "重要なことに",
        "etymology": "important（重要な）+ -ly（副詞化）",
        "relatedWords": "significantly(シグニフィカントリー): 重要なことに, critically(クリティカリー): 決定的に",
        "category": "副詞",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "versus": {
        "word": "versus",
        "reading": "バーサス",
        "meaning": "対・〜に対して",
        "etymology": "ラテン語 versus（〜に向かって）",
        "relatedWords": "against(アゲインスト): 〜に対して, compared to(コンペアド・トゥ): 〜と比べて",
        "category": "前置詞",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "cannot": {
        "word": "cannot",
        "reading": "キャノット",
        "meaning": "〜できない",
        "etymology": "can（できる）+ not（否定）",
        "relatedWords": "can't(キャント): できない, unable(アンエイブル): できない",
        "category": "助動詞",
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
    print("長文読解辞書 単語追加スクリプト（バッチ14）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ14: 一般的な形容詞・副詞・接続詞関連の単語（{len(BATCH14_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH14_WORDS.items():
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
