#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ12）
食べ物・色・基本名詞関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ12: 食べ物・色・基本名詞関連）
BATCH12_WORDS = {
    "fruit": {
        "word": "fruit",
        "reading": "フルーツ",
        "meaning": "果物",
        "etymology": "ラテン語 fructus（果実）",
        "relatedWords": "apple(アップル): リンゴ, vegetable(ベジタブル): 野菜",
        "category": "食べ物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "cheese": {
        "word": "cheese",
        "reading": "チーズ",
        "meaning": "チーズ",
        "etymology": "ラテン語 caseus（チーズ）",
        "relatedWords": "milk(ミルク): 牛乳, dairy(デアリー): 乳製品",
        "category": "食べ物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "pizza": {
        "word": "pizza",
        "reading": "ピザ",
        "meaning": "ピザ",
        "etymology": "イタリア語 pizza",
        "relatedWords": "pasta(パスタ): パスタ, bread(ブレッド): パン",
        "category": "食べ物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "pasta": {
        "word": "pasta",
        "reading": "パスタ",
        "meaning": "パスタ",
        "etymology": "イタリア語 pasta（生地）",
        "relatedWords": "noodle(ヌードル): 麺, spaghetti(スパゲッティ): スパゲッティ",
        "category": "食べ物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "tofu": {
        "word": "tofu",
        "reading": "トーフ",
        "meaning": "豆腐",
        "etymology": "日本語 豆腐",
        "relatedWords": "soy(ソイ): 大豆, bean(ビーン): 豆",
        "category": "食べ物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "candy": {
        "word": "candy",
        "reading": "キャンディ",
        "meaning": "キャンディ・飴",
        "etymology": "アラビア語 qandi（砂糖）",
        "relatedWords": "sweet(スイート): 甘い物, sugar(シュガー): 砂糖",
        "category": "食べ物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "snack": {
        "word": "snack",
        "reading": "スナック",
        "meaning": "軽食・おやつ",
        "etymology": "中オランダ語 snacken（かじる）",
        "relatedWords": "meal(ミール): 食事, bite(バイト): 一口",
        "category": "食べ物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "recipe": {
        "word": "recipe",
        "reading": "レシピ",
        "meaning": "レシピ・調理法",
        "etymology": "ラテン語 recipere（受け取る）",
        "relatedWords": "cooking(クッキング): 料理, ingredient(イングリーディエント): 材料",
        "category": "料理",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "ingredient": {
        "word": "ingredient",
        "reading": "イングリーディエント",
        "meaning": "材料・成分",
        "etymology": "ラテン語 ingredi（入る）",
        "relatedWords": "component(コンポーネント): 構成要素, element(エレメント): 要素",
        "category": "料理・化学",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "white": {
        "word": "white",
        "reading": "ホワイト",
        "meaning": "白い・白",
        "etymology": "古英語 hwit（白い）",
        "relatedWords": "black(ブラック): 黒, color(カラー): 色",
        "category": "色",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "brown": {
        "word": "brown",
        "reading": "ブラウン",
        "meaning": "茶色い・茶色",
        "etymology": "古英語 brun（茶色の）",
        "relatedWords": "color(カラー): 色, dark(ダーク): 暗い",
        "category": "色",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "yellow": {
        "word": "yellow",
        "reading": "イエロー",
        "meaning": "黄色い・黄色",
        "etymology": "古英語 geolu（黄色の）",
        "relatedWords": "gold(ゴールド): 金色, color(カラー): 色",
        "category": "色",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "beauty": {
        "word": "beauty",
        "reading": "ビューティ",
        "meaning": "美しさ・美",
        "etymology": "ラテン語 bellus（美しい）",
        "relatedWords": "beautiful(ビューティフル): 美しい, pretty(プリティ): かわいい",
        "category": "性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "children": {
        "word": "children",
        "reading": "チルドレン",
        "meaning": "子供たち（childの複数形）",
        "etymology": "child（子供）の複数形",
        "relatedWords": "child(チャイルド): 子供, kid(キッド): 子供",
        "category": "人",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "clock": {
        "word": "clock",
        "reading": "クロック",
        "meaning": "時計",
        "etymology": "ラテン語 clocca（鐘）",
        "relatedWords": "watch(ウォッチ): 腕時計, time(タイム): 時間",
        "category": "物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "bridge": {
        "word": "bridge",
        "reading": "ブリッジ",
        "meaning": "橋",
        "etymology": "古英語 brycg（橋）",
        "relatedWords": "road(ロード): 道路, connect(コネクト): つなぐ",
        "category": "建造物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "hall": {
        "word": "hall",
        "reading": "ホール",
        "meaning": "ホール・広間",
        "etymology": "古英語 heall（広間）",
        "relatedWords": "room(ルーム): 部屋, building(ビルディング): 建物",
        "category": "建造物・場所",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "hotel": {
        "word": "hotel",
        "reading": "ホテル",
        "meaning": "ホテル",
        "etymology": "フランス語 hôtel（宿）",
        "relatedWords": "accommodation(アコモデーション): 宿泊施設, inn(イン): 旅館",
        "category": "建造物・場所",
        "difficulty": "初級",
        "level": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "war": {
        "word": "war",
        "reading": "ウォー",
        "meaning": "戦争",
        "etymology": "古フランス語 werre（戦争）",
        "relatedWords": "battle(バトル): 戦闘, conflict(コンフリクト): 紛争",
        "category": "社会",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "death": {
        "word": "death",
        "reading": "デス",
        "meaning": "死",
        "etymology": "古英語 dēaþ（死）",
        "relatedWords": "die(ダイ): 死ぬ, life(ライフ): 生命",
        "category": "生命",
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
    print("長文読解辞書 単語追加スクリプト（バッチ12）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ12: 食べ物・色・基本名詞関連の単語（{len(BATCH12_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH12_WORDS.items():
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
