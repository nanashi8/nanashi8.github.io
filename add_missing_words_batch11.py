#!/usr/bin/env python3
"""
長文読解辞書に不足している単語を段階的に追加するスクリプト（バッチ11）
過去形・過去分詞・基本動詞関連の単語を追加
"""

import json
from pathlib import Path

# 追加する単語（バッチ11: 過去形・過去分詞・基本動詞関連）
BATCH11_WORDS = {
    "came": {
        "word": "came",
        "reading": "ケイム",
        "meaning": "来た（comeの過去形）",
        "etymology": "come（来る）の過去形",
        "relatedWords": "come(カム): 来る, arrived(アライブド): 到着した",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "went": {
        "word": "went",
        "reading": "ウェント",
        "meaning": "行った（goの過去形）",
        "etymology": "go（行く）の過去形",
        "relatedWords": "go(ゴー): 行く, left(レフト): 去った",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "saw": {
        "word": "saw",
        "reading": "ソー",
        "meaning": "見た（seeの過去形）",
        "etymology": "see（見る）の過去形",
        "relatedWords": "see(シー): 見る, looked(ルックト): 見た",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "said": {
        "word": "said",
        "reading": "セッド",
        "meaning": "言った（sayの過去形・過去分詞）",
        "etymology": "say（言う）の過去形",
        "relatedWords": "say(セイ): 言う, told(トールド): 伝えた",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "told": {
        "word": "told",
        "reading": "トールド",
        "meaning": "伝えた（tellの過去形・過去分詞）",
        "etymology": "tell（伝える）の過去形",
        "relatedWords": "tell(テル): 伝える, said(セッド): 言った",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "took": {
        "word": "took",
        "reading": "トゥック",
        "meaning": "取った（takeの過去形）",
        "etymology": "take（取る）の過去形",
        "relatedWords": "take(テイク): 取る, taken(テイクン): 取られた",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "got": {
        "word": "got",
        "reading": "ゴット",
        "meaning": "得た・手に入れた（getの過去形・過去分詞）",
        "etymology": "get（得る）の過去形",
        "relatedWords": "get(ゲット): 得る, obtained(オブテインド): 獲得した",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "made": {
        "word": "made",
        "reading": "メイド",
        "meaning": "作った（makeの過去形・過去分詞）",
        "etymology": "make（作る）の過去形",
        "relatedWords": "make(メイク): 作る, created(クリエイテッド): 創造した",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "found": {
        "word": "found",
        "reading": "ファウンド",
        "meaning": "見つけた（findの過去形・過去分詞）",
        "etymology": "find（見つける）の過去形",
        "relatedWords": "find(ファインド): 見つける, discovered(ディスカバード): 発見した",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "felt": {
        "word": "felt",
        "reading": "フェルト",
        "meaning": "感じた（feelの過去形・過去分詞）",
        "etymology": "feel（感じる）の過去形",
        "relatedWords": "feel(フィール): 感じる, sensed(センスド): 感知した",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "stood": {
        "word": "stood",
        "reading": "ストゥッド",
        "meaning": "立った（standの過去形・過去分詞）",
        "etymology": "stand（立つ）の過去形",
        "relatedWords": "stand(スタンド): 立つ, risen(ライズン): 上がった",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "sat": {
        "word": "sat",
        "reading": "サット",
        "meaning": "座った（sitの過去形・過去分詞）",
        "etymology": "sit（座る）の過去形",
        "relatedWords": "sit(シット): 座る, seated(シーテッド): 着席した",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "brought": {
        "word": "brought",
        "reading": "ブロート",
        "meaning": "持ってきた（bringの過去形・過去分詞）",
        "etymology": "bring（持ってくる）の過去形",
        "relatedWords": "bring(ブリング): 持ってくる, carried(キャリード): 運んだ",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "fought": {
        "word": "fought",
        "reading": "フォート",
        "meaning": "戦った（fightの過去形・過去分詞）",
        "etymology": "fight（戦う）の過去形",
        "relatedWords": "fight(ファイト): 戦う, battled(バトルド): 戦闘した",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "won": {
        "word": "won",
        "reading": "ウォン",
        "meaning": "勝った（winの過去形・過去分詞）",
        "etymology": "win（勝つ）の過去形",
        "relatedWords": "win(ウィン): 勝つ, defeated(ディフィーテッド): 負かした",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "lost": {
        "word": "lost",
        "reading": "ロスト",
        "meaning": "失った・負けた（loseの過去形・過去分詞）",
        "etymology": "lose（失う）の過去形",
        "relatedWords": "lose(ルーズ): 失う, missing(ミッシング): 見つからない",
        "category": "動詞・過去形",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "done": {
        "word": "done",
        "reading": "ダン",
        "meaning": "した・完了した（doの過去分詞）",
        "etymology": "do（する）の過去分詞",
        "relatedWords": "do(ドゥ): する, finished(フィニッシュド): 終えた",
        "category": "動詞・過去分詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "shown": {
        "word": "shown",
        "reading": "ショウン",
        "meaning": "示された（showの過去分詞）",
        "etymology": "show（示す）の過去分詞",
        "relatedWords": "show(ショウ): 示す, displayed(ディスプレイド): 表示された",
        "category": "動詞・過去分詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "grown": {
        "word": "grown",
        "reading": "グロウン",
        "meaning": "成長した（growの過去分詞）",
        "etymology": "grow（成長する）の過去分詞",
        "relatedWords": "grow(グロウ): 成長する, developed(ディベロップド): 発達した",
        "category": "動詞・過去分詞",
        "difficulty": "初級",
        "levels": ["初級", "中級", "上級"],
        "passages": ["advanced-1"],
        "source": "manual"
    },
    "spoken": {
        "word": "spoken",
        "reading": "スポークン",
        "meaning": "話された（speakの過去分詞）",
        "etymology": "speak（話す）の過去分詞",
        "relatedWords": "speak(スピーク): 話す, talked(トークド): 話した",
        "category": "動詞・過去分詞",
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
    print("長文読解辞書 単語追加スクリプト（バッチ11）")
    print("=" * 60)
    
    dict_path = Path('public/data/reading-passages-dictionary.json')
    
    print(f"\n📖 辞書を読み込んでいます: {dict_path}")
    dictionary = load_json(dict_path)
    original_count = len(dictionary)
    print(f"  現在の単語数: {original_count}")
    
    added_count = 0
    skipped_count = 0
    
    print(f"\n📝 バッチ11: 過去形・過去分詞・基本動詞関連の単語（{len(BATCH11_WORDS)}個）を追加中...")
    
    for word_key, word_data in BATCH11_WORDS.items():
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
