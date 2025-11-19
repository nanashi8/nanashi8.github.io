#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ9）
一般動詞・形容詞・副詞関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ9: 一般動詞・形容詞・副詞関連）
BATCH9_WORDS = {
    "incredible": {
        "word": "incredible",
        "reading": "インクレディブル",
        "meaning": "信じられない・素晴らしい",
        "etymology": "in-（否定）+ credible（信じられる）",
        "relatedWords": "amazing(アメイジング): 驚くべき, unbelievable(アンビリーバブル): 信じられない",
        "category": "形容詞・評価",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "incredibly": {
        "word": "incredibly",
        "reading": "インクレディブリー",
        "meaning": "信じられないほど・非常に",
        "etymology": "incredible（信じられない）+ -ly（副詞化）",
        "relatedWords": "extremely(エクストリームリー): 極めて, amazingly(アメイジングリー): 驚くほど",
        "category": "副詞・程度",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "increasingly": {
        "word": "increasingly",
        "reading": "インクリーシングリー",
        "meaning": "ますます・次第に",
        "etymology": "increasing（増加する）+ -ly（副詞化）",
        "relatedWords": "more(モア): より多く, gradually(グラデュアリー): 徐々に",
        "category": "副詞・変化",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "widely": {
        "word": "widely",
        "reading": "ワイドリー",
        "meaning": "広く・一般的に",
        "etymology": "wide（広い）+ -ly（副詞化）",
        "relatedWords": "broadly(ブロードリー): 広く, commonly(コモンリー): 一般的に",
        "category": "副詞・範囲",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "easily": {
        "word": "easily",
        "reading": "イージリー",
        "meaning": "簡単に・容易に",
        "etymology": "easy（簡単な）+ -ly（副詞化）",
        "relatedWords": "simply(シンプリー): 単に, effortlessly(エフォートレスリー): 楽々と",
        "category": "副詞・様態",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "carefully": {
        "word": "carefully",
        "reading": "ケアフリー",
        "meaning": "注意深く・慎重に",
        "etymology": "careful（注意深い）+ -ly（副詞化）",
        "relatedWords": "cautiously(コーシャスリー): 用心深く, attentively(アテンティブリー): 注意深く",
        "category": "副詞・様態",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "truly": {
        "word": "truly",
        "reading": "トゥルーリー",
        "meaning": "本当に・真に",
        "etymology": "true（真実の）+ -ly（副詞化）",
        "relatedWords": "really(リアリー): 本当に, genuinely(ジェニュインリー): 心から",
        "category": "副詞・程度",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "fully": {
        "word": "fully",
        "reading": "フリー",
        "meaning": "完全に・十分に",
        "etymology": "full（いっぱいの）+ -ly（副詞化）",
        "relatedWords": "completely(コンプリートリー): 完全に, entirely(エンタイアリー): 全く",
        "category": "副詞・程度",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "highlight": {
        "word": "highlight",
        "reading": "ハイライト",
        "meaning": "強調する・目立たせる",
        "etymology": "high（高い）+ light（光）",
        "relatedWords": "emphasize(エンファサイズ): 強調する, feature(フィーチャー): 特徴づける",
        "category": "動詞・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "emphasize": {
        "word": "emphasize",
        "reading": "エンファサイズ",
        "meaning": "強調する・重視する",
        "etymology": "emphasis（強調）+ -ize（動詞化）",
        "relatedWords": "stress(ストレス): 強調する, highlight(ハイライト): 強調する",
        "category": "動詞・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "facilitate": {
        "word": "facilitate",
        "reading": "ファシリテート",
        "meaning": "容易にする・促進する",
        "etymology": "ラテン語 facilis（容易な）",
        "relatedWords": "enable(イネーブル): 可能にする, help(ヘルプ): 助ける",
        "category": "動詞・行動",
        "difficulty": "上級",
        "levels": ["上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "evaluate": {
        "word": "evaluate",
        "reading": "イバリュエート",
        "meaning": "評価する",
        "etymology": "ラテン語 evaluare（価値を見出す）",
        "relatedWords": "assess(アセス): 評価する, judge(ジャッジ): 判断する",
        "category": "動詞・認知",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "implement": {
        "word": "implement",
        "reading": "インプリメント",
        "meaning": "実施する・実装する",
        "etymology": "ラテン語 implementum（道具）",
        "relatedWords": "execute(エクゼキュート): 実行する, carry out(キャリーアウト): 遂行する",
        "category": "動詞・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "navigate": {
        "word": "navigate",
        "reading": "ナビゲート",
        "meaning": "航行する・操縦する",
        "etymology": "ラテン語 navigare（船で行く）",
        "relatedWords": "guide(ガイド): 案内する, steer(スティア): 操縦する",
        "category": "動詞・移動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "investigate": {
        "word": "investigate",
        "reading": "インベスティゲート",
        "meaning": "調査する・捜査する",
        "etymology": "ラテン語 investigare（追跡する）",
        "relatedWords": "research(リサーチ): 研究する, examine(イグザミン): 調べる",
        "category": "動詞・認知",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mitigate": {
        "word": "mitigate",
        "reading": "ミティゲート",
        "meaning": "緩和する・軽減する",
        "etymology": "ラテン語 mitigare（和らげる）",
        "relatedWords": "reduce(リデュース): 減らす, alleviate(アリビエイト): 緩和する",
        "category": "動詞・行動",
        "difficulty": "上級",
        "levels": ["上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "overcome": {
        "word": "overcome",
        "reading": "オーバーカム",
        "meaning": "克服する・乗り越える",
        "etymology": "over（超えて）+ come（来る）",
        "relatedWords": "conquer(コンカー): 征服する, defeat(ディフィート): 打ち負かす",
        "category": "動詞・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "overwhelm": {
        "word": "overwhelm",
        "reading": "オーバーウェルム",
        "meaning": "圧倒する・打ちのめす",
        "etymology": "over（超えて）+ whelm（覆す）",
        "relatedWords": "overpower(オーバーパワー): 圧倒する, crush(クラッシュ): 押しつぶす",
        "category": "動詞・行動",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "profound": {
        "word": "profound",
        "reading": "プロファウンド",
        "meaning": "深遠な・深い",
        "etymology": "ラテン語 profundus（深い）",
        "relatedWords": "deep(ディープ): 深い, intense(インテンス): 強烈な",
        "category": "形容詞・性質",
        "difficulty": "上級",
        "levels": ["上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "delicious": {
        "word": "delicious",
        "reading": "デリシャス",
        "meaning": "おいしい",
        "etymology": "ラテン語 deliciosus（快い）",
        "relatedWords": "tasty(テイスティ): おいしい, yummy(ヤミー): おいしい",
        "category": "形容詞・味",
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
    print("長文読解辞書 単語追加スクリプト（バッチ9）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ9: 一般動詞・形容詞・副詞関連の単語（{len(BATCH9_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH9_WORDS.items():
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
