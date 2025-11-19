#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ4）
交通・建築・エネルギー効率関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ4: 交通・建築・エネルギー効率関連）
BATCH4_WORDS = {
    "neighborhood": {
        "word": "neighborhood",
        "reading": "ネイバーフッド",
        "meaning": "近隣・地域",
        "etymology": "neighbor（隣人）+ -hood（状態）",
        "relatedWords": "neighbor(ネイバー): 隣人, community(コミュニティ): 地域社会",
        "category": "場所・社会",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "truck": {
        "word": "truck",
        "reading": "トラック",
        "meaning": "トラック・貨物自動車",
        "etymology": "ギリシャ語 trochos（車輪）",
        "relatedWords": "vehicle(ビークル): 乗り物, cargo(カーゴ): 貨物",
        "category": "交通・乗り物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "mainstream": {
        "word": "mainstream",
        "reading": "メインストリーム",
        "meaning": "主流・本流",
        "etymology": "main（主要な）+ stream（流れ）",
        "relatedWords": "main(メイン): 主要な, popular(ポピュラー): 人気のある",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "tailpipe": {
        "word": "tailpipe",
        "reading": "テールパイプ",
        "meaning": "排気管・マフラー",
        "etymology": "tail（尾）+ pipe（管）",
        "relatedWords": "exhaust(イグゾースト): 排気, emission(エミッション): 排出",
        "category": "交通・技術",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "grid": {
        "word": "grid",
        "reading": "グリッド",
        "meaning": "送電網・格子",
        "etymology": "古英語 gridiron（格子）",
        "relatedWords": "network(ネットワーク): 網, power grid(パワー グリッド): 送電網",
        "category": "技術・構造",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "infrastructure": {
        "word": "infrastructure",
        "reading": "インフラストラクチャー",
        "meaning": "インフラ・社会基盤",
        "etymology": "infra-（下の）+ structure（構造）",
        "relatedWords": "foundation(ファンデーション): 基盤, facility(ファシリティ): 施設",
        "category": "社会・技術",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "per": {
        "word": "per",
        "reading": "パー",
        "meaning": "〜につき・〜ごとに",
        "etymology": "ラテン語 per（〜を通じて）",
        "relatedWords": "each(イーチ): それぞれ, every(エブリ): 毎",
        "category": "前置詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "capita": {
        "word": "capita",
        "reading": "キャピタ",
        "meaning": "人（per capitaで一人当たり）",
        "etymology": "ラテン語 caput（頭）",
        "relatedWords": "per capita(パー キャピタ): 一人当たり, capital(キャピタル): 首都・資本",
        "category": "統計・経済",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "subway": {
        "word": "subway",
        "reading": "サブウェイ",
        "meaning": "地下鉄",
        "etymology": "sub-（下の）+ way（道）",
        "relatedWords": "metro(メトロ): 地下鉄, underground(アンダーグラウンド): 地下",
        "category": "交通",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "lane": {
        "word": "lane",
        "reading": "レーン",
        "meaning": "車線・小道",
        "etymology": "古英語 lane",
        "relatedWords": "road(ロード): 道路, path(パス): 小道",
        "category": "場所・交通",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "bike": {
        "word": "bike",
        "reading": "バイク",
        "meaning": "自転車・バイク",
        "etymology": "bicycle（自転車）の短縮形",
        "relatedWords": "bicycle(バイシクル): 自転車, motorcycle(モーターサイクル): オートバイ",
        "category": "交通・乗り物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "dependency": {
        "word": "dependency",
        "reading": "ディペンデンシー",
        "meaning": "依存・従属",
        "etymology": "depend（依存する）+ -ency（名詞化）",
        "relatedWords": "depend(ディペンド): 依存する, independent(インディペンデント): 独立した",
        "category": "抽象概念",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "livable": {
        "word": "livable",
        "reading": "リバブル",
        "meaning": "住みやすい・居住可能な",
        "etymology": "live（住む）+ -able（可能な）",
        "relatedWords": "live(リブ): 住む, habitable(ハビタブル): 居住可能な",
        "category": "性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "dirty": {
        "word": "dirty",
        "reading": "ダーティ",
        "meaning": "汚い・不潔な",
        "etymology": "dirt（汚れ）+ -y（形容詞化）",
        "relatedWords": "dirt(ダート): 汚れ, clean(クリーン): きれいな",
        "category": "状態・性質",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "inefficient": {
        "word": "inefficient",
        "reading": "インエフィシェント",
        "meaning": "非効率的な",
        "etymology": "in-（否定）+ efficient（効率的な）",
        "relatedWords": "efficient(エフィシェント): 効率的な, efficiency(エフィシェンシー): 効率",
        "category": "性質",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "insulation": {
        "word": "insulation",
        "reading": "インサレーション",
        "meaning": "断熱・絶縁",
        "etymology": "insulate（絶縁する）+ -ion（名詞化）",
        "relatedWords": "insulate(インサレート): 絶縁する, isolate(アイソレート): 隔離する",
        "category": "建築・技術",
        "difficulty": "中級",
        "levels": ["中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "waste": {
        "word": "waste",
        "reading": "ウェイスト",
        "meaning": "無駄・廃棄物",
        "etymology": "ラテン語 vastare（荒廃させる）",
        "relatedWords": "garbage(ガービッジ): ごみ, trash(トラッシュ): ごみ",
        "category": "環境・物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "window": {
        "word": "window",
        "reading": "ウィンドウ",
        "meaning": "窓",
        "etymology": "古ノルド語 vindauga（風の目）",
        "relatedWords": "door(ドア): ドア, glass(グラス): ガラス",
        "category": "建築・物",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "leak": {
        "word": "leak",
        "reading": "リーク",
        "meaning": "漏れる・漏出",
        "etymology": "古ノルド語 leka",
        "relatedWords": "leakage(リーケージ): 漏出, drip(ドリップ): したたる",
        "category": "状態・行動",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "pane": {
        "word": "pane",
        "reading": "ペイン",
        "meaning": "窓ガラス",
        "etymology": "ラテン語 pannus（布）",
        "relatedWords": "window pane(ウィンドウ ペイン): 窓ガラス, glass(グラス): ガラス",
        "category": "建築・物",
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
    print("長文読解辞書 単語追加スクリプト（バッチ4）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ4: 交通・建築・エネルギー効率関連の単語（{len(BATCH4_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH4_WORDS.items():
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
