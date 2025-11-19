#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ10）
日常生活・感情・時間関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ10: 日常生活・感情・時間関連）
BATCH10_WORDS = {
    "happiness": {
        "word": "happiness",
        "reading": "ハピネス",
        "meaning": "幸せ・幸福",
        "etymology": "happy（幸せな）+ -ness（名詞化）",
        "relatedWords": "happy(ハッピー): 幸せな, joy(ジョイ): 喜び",
        "category": "感情",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "sadness": {
        "word": "sadness",
        "reading": "サドネス",
        "meaning": "悲しみ",
        "etymology": "sad（悲しい）+ -ness（名詞化）",
        "relatedWords": "sad(サッド): 悲しい, sorrow(ソロー): 悲しみ",
        "category": "感情",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "excitement": {
        "word": "excitement",
        "reading": "エクサイトメント",
        "meaning": "興奮・わくわく",
        "etymology": "excite（興奮させる）+ -ment（名詞化）",
        "relatedWords": "excited(エクサイテッド): 興奮した, thrill(スリル): スリル",
        "category": "感情",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "kindness": {
        "word": "kindness",
        "reading": "カインドネス",
        "meaning": "親切・優しさ",
        "etymology": "kind（親切な）+ -ness（名詞化）",
        "relatedWords": "kind(カインド): 親切な, generosity(ジェネロシティ): 寛大さ",
        "category": "性質・感情",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "honest": {
        "word": "honest",
        "reading": "オネスト",
        "meaning": "正直な・誠実な",
        "etymology": "ラテン語 honestus（名誉ある）",
        "relatedWords": "honesty(オネスティ): 正直さ, truthful(トゥルースフル): 真実を語る",
        "category": "性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "brave": {
        "word": "brave",
        "reading": "ブレイブ",
        "meaning": "勇敢な",
        "etymology": "イタリア語 bravo（勇敢な）",
        "relatedWords": "courage(カレッジ): 勇気, fearless(フィアレス): 恐れを知らない",
        "category": "性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "dangerous": {
        "word": "dangerous",
        "reading": "デンジャラス",
        "meaning": "危険な",
        "etymology": "danger（危険）+ -ous（形容詞化）",
        "relatedWords": "danger(デンジャー): 危険, risky(リスキー): 危険な",
        "category": "性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "safety": {
        "word": "safety",
        "reading": "セーフティ",
        "meaning": "安全",
        "etymology": "safe（安全な）+ -ty（名詞化）",
        "relatedWords": "safe(セーフ): 安全な, security(セキュリティ): 安全保障",
        "category": "性質・状態",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "emergency": {
        "word": "emergency",
        "reading": "エマージェンシー",
        "meaning": "緊急事態・非常時",
        "etymology": "emerge（現れる）+ -ency（名詞化）",
        "relatedWords": "urgent(アージェント): 緊急の, crisis(クライシス): 危機",
        "category": "状況",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "everyday": {
        "word": "everyday",
        "reading": "エブリデイ",
        "meaning": "毎日の・日常の",
        "etymology": "every（毎）+ day（日）",
        "relatedWords": "daily(デイリー): 毎日の, routine(ルーティーン): 日課",
        "category": "時間・頻度",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "weekend": {
        "word": "weekend",
        "reading": "ウィークエンド",
        "meaning": "週末",
        "etymology": "week（週）+ end（終わり）",
        "relatedWords": "weekday(ウィークデイ): 平日, holiday(ホリデイ): 休日",
        "category": "時間",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "birthday": {
        "word": "birthday",
        "reading": "バースデイ",
        "meaning": "誕生日",
        "etymology": "birth（誕生）+ day（日）",
        "relatedWords": "birth(バース): 誕生, anniversary(アニバーサリー): 記念日",
        "category": "時間・行事",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "holiday": {
        "word": "holiday",
        "reading": "ホリデイ",
        "meaning": "休日・祝日",
        "etymology": "holy（神聖な）+ day（日）",
        "relatedWords": "vacation(バケーション): 休暇, festival(フェスティバル): 祭り",
        "category": "時間・行事",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "hobby": {
        "word": "hobby",
        "reading": "ホビー",
        "meaning": "趣味",
        "etymology": "中英語 hoby（小さな馬）",
        "relatedWords": "interest(インタレスト): 興味, pastime(パスタイム): 気晴らし",
        "category": "活動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "club": {
        "word": "club",
        "reading": "クラブ",
        "meaning": "クラブ・部活",
        "etymology": "古ノルド語 klubba（こん棒）",
        "relatedWords": "team(チーム): チーム, group(グループ): グループ",
        "category": "組織・活動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "teammate": {
        "word": "teammate",
        "reading": "チームメイト",
        "meaning": "チームメイト・仲間",
        "etymology": "team（チーム）+ mate（仲間）",
        "relatedWords": "team(チーム): チーム, partner(パートナー): パートナー",
        "category": "人・関係",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "friendship": {
        "word": "friendship",
        "reading": "フレンドシップ",
        "meaning": "友情",
        "etymology": "friend（友人）+ -ship（状態）",
        "relatedWords": "friend(フレンド): 友人, relationship(リレーションシップ): 関係",
        "category": "関係",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "busy": {
        "word": "busy",
        "reading": "ビジー",
        "meaning": "忙しい",
        "etymology": "古英語 bisig（忙しい）",
        "relatedWords": "occupied(オキュパイド): 使用中の, hectic(ヘクティック): 多忙な",
        "category": "状態",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "tired": {
        "word": "tired",
        "reading": "タイアド",
        "meaning": "疲れた",
        "etymology": "tire（疲れる）の過去分詞",
        "relatedWords": "exhausted(イグゾーステッド): 疲れ果てた, weary(ウィアリー): 疲れた",
        "category": "状態",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "comfortable": {
        "word": "comfortable",
        "reading": "コンフォータブル",
        "meaning": "快適な・心地よい",
        "etymology": "comfort（快適）+ -able（可能な）",
        "relatedWords": "comfort(コンフォート): 快適, cozy(コージー): 居心地の良い",
        "category": "性質・状態",
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
    print("長文読解辞書 単語追加スクリプト（バッチ10）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ10: 日常生活・感情・時間関連の単語（{len(BATCH10_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH10_WORDS.items():
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
