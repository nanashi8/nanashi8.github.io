#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高校受験英熟語データ生成テンプレート
カテゴリーと難易度を指定して、熟語データのテンプレートを生成する
"""

import sys
import csv
from typing import Dict, List

# カテゴリー定義
CATEGORIES = [
    "言語基本",
    "学校・学習", 
    "日常生活",
    "人・社会",
    "自然・環境",
    "食・健康",
    "運動・娯楽",
    "場所・移動",
    "時間・数量",
    "科学・技術"
]

# 難易度定義
DIFFICULTY_LEVELS = ["初級", "中級", "上級"]

# 熟語タイプ別の例
PHRASE_TYPES = {
    "phrasal_verb": {
        "description": "句動詞（動詞 + 前置詞/副詞）",
        "examples": ["look at", "get up", "take off", "give up", "come back"],
        "pattern": "動詞 + 前置詞/副詞の組み合わせ"
    },
    "idiom": {
        "description": "慣用句（意味が直訳できない表現）",
        "examples": ["a piece of cake", "break the ice", "cost an arm and a leg"],
        "pattern": "特定の意味を持つ固定表現"
    },
    "collocation": {
        "description": "コロケーション（自然な語の組み合わせ）",
        "examples": ["make a decision", "take a chance", "do homework"],
        "pattern": "自然に共起する語の組み合わせ"
    }
}

def generate_template(category: str, difficulty: str, count: int, phrase_type: str = None) -> List[Dict]:
    """
    指定されたカテゴリー・難易度の熟語テンプレートを生成
    
    Args:
        category: カテゴリー名
        difficulty: 難易度（初級/中級/上級）
        count: 生成する件数
        phrase_type: 熟語タイプ（phrasal_verb/idiom/collocation）
    
    Returns:
        テンプレートデータのリスト
    """
    templates = []
    
    for i in range(count):
        template = {
            "語句": f"[TODO: 熟語_{i+1}]",
            "読み": "[TODO: カタカナ読み（アクセント記号付き）]",
            "意味": "[TODO: 日本語の意味]",
            "語源等解説": f"[TODO: 語源・成り立ち・使い方の解説] タイプ: {phrase_type or '未指定'}",
            "関連語": "[TODO: 類義語や関連表現（英語+カタカナ読み）]",
            "関連分野": category,
            "難易度": difficulty
        }
        templates.append(template)
    
    return templates

def save_template(templates: List[Dict], output_file: str):
    """テンプレートをCSVファイルに保存"""
    fieldnames = ["語句", "読み", "意味", "語源等解説", "関連語", "関連分野", "難易度"]
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(templates)
    
    print(f"✅ テンプレート生成完了: {output_file}")
    print(f"   件数: {len(templates)}件")

def show_statistics(category: str = None, difficulty: str = None):
    """カテゴリー・難易度別の推奨生成数を表示"""
    print("\n" + "=" * 70)
    print("  熟語データ生成ガイド")
    print("=" * 70)
    
    print("\n【目標データ数】")
    print("  合計: 1,100件")
    print("  ├─ 句動詞: 500件 (45%)")
    print("  ├─ 慣用句: 350件 (32%)")
    print("  └─ コロケーション: 250件 (23%)")
    
    print("\n【難易度別配分】")
    print("  ├─ 初級: 400件 (36%) - 中学1-2年レベル")
    print("  ├─ 中級: 400件 (36%) - 中学3年レベル")
    print("  └─ 上級: 300件 (27%) - 高校受験レベル")
    
    print("\n【カテゴリー別推奨配分】")
    total = 1100
    category_distribution = {
        "言語基本": 0.15,      # 165件
        "学校・学習": 0.10,     # 110件
        "日常生活": 0.15,      # 165件
        "人・社会": 0.15,      # 165件
        "自然・環境": 0.08,     # 88件
        "食・健康": 0.08,      # 88件
        "運動・娯楽": 0.07,     # 77件
        "場所・移動": 0.10,     # 110件
        "時間・数量": 0.10,     # 110件
        "科学・技術": 0.02      # 22件
    }
    
    for cat, ratio in category_distribution.items():
        count = int(total * ratio)
        highlight = " ←" if cat == category else ""
        print(f"  {cat}: {count}件 ({ratio*100:.0f}%){highlight}")
    
    print("\n【熟語タイプ別の特徴】")
    for type_key, info in PHRASE_TYPES.items():
        print(f"\n  {info['description']}")
        print(f"    パターン: {info['pattern']}")
        print(f"    例: {', '.join(info['examples'][:3])}")

def show_quality_checklist():
    """品質チェックリストを表示"""
    print("\n" + "=" * 70)
    print("  熟語データ品質チェックリスト")
    print("=" * 70)
    
    checklist = [
        "✓ 熟語が高校受験レベルとして適切か",
        "✓ 読み仮名にアクセント記号（́）が正しく付いているか",
        "✓ 意味が明確で分かりやすいか",
        "✓ 語源・成り立ちの解説が充実しているか",
        "✓ 関連語が2つ以上含まれているか",
        "✓ 関連語に読み仮名が付いているか",
        "✓ カテゴリーが適切に分類されているか",
        "✓ 難易度が妥当か",
        "✓ 既存の熟語と重複していないか",
        "✓ スペルミスや誤字がないか"
    ]
    
    for item in checklist:
        print(f"  {item}")
    
    print("\n【注意事項】")
    print("  • アクセント記号は必ず母音に付ける（ア́、イ́、ウ́、エ́、オ́）")
    print("  • 読み仮名は全角カタカナで統一")
    print("  • 語源解説には「〜と〜の組み合わせ」を必ず含める")
    print("  • 関連語は「語(読み): 意味」の形式で記載")

def main():
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python3 generate_phrases_template.py <コマンド> [オプション]")
        print("\nコマンド:")
        print("  stats              - 統計情報とガイドを表示")
        print("  checklist          - 品質チェックリストを表示")
        print("  generate <category> <difficulty> <count> [type]")
        print("                     - テンプレートを生成")
        print("\n例:")
        print("  python3 generate_phrases_template.py stats")
        print("  python3 generate_phrases_template.py generate 言語基本 初級 20 phrasal_verb")
        print("  python3 generate_phrases_template.py generate 人・社会 中級 30")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "stats":
        show_statistics()
        show_quality_checklist()
    
    elif command == "checklist":
        show_quality_checklist()
    
    elif command == "generate":
        if len(sys.argv) < 5:
            print("❌ エラー: カテゴリー、難易度、件数を指定してください")
            print("例: python3 generate_phrases_template.py generate 言語基本 初級 20")
            sys.exit(1)
        
        category = sys.argv[2]
        difficulty = sys.argv[3]
        count = int(sys.argv[4])
        phrase_type = sys.argv[5] if len(sys.argv) > 5 else None
        
        # バリデーション
        if category not in CATEGORIES:
            print(f"❌ エラー: 無効なカテゴリー '{category}'")
            print(f"有効なカテゴリー: {', '.join(CATEGORIES)}")
            sys.exit(1)
        
        if difficulty not in DIFFICULTY_LEVELS:
            print(f"❌ エラー: 無効な難易度 '{difficulty}'")
            print(f"有効な難易度: {', '.join(DIFFICULTY_LEVELS)}")
            sys.exit(1)
        
        if phrase_type and phrase_type not in PHRASE_TYPES:
            print(f"❌ エラー: 無効な熟語タイプ '{phrase_type}'")
            print(f"有効なタイプ: {', '.join(PHRASE_TYPES.keys())}")
            sys.exit(1)
        
        # テンプレート生成
        print(f"\n📝 テンプレート生成中...")
        print(f"  カテゴリー: {category}")
        print(f"  難易度: {difficulty}")
        print(f"  件数: {count}件")
        if phrase_type:
            print(f"  タイプ: {PHRASE_TYPES[phrase_type]['description']}")
        
        templates = generate_template(category, difficulty, count, phrase_type)
        
        # ファイル名生成
        type_suffix = f"-{phrase_type}" if phrase_type else ""
        output_file = f"phrases-template-{category}-{difficulty}-{count}{type_suffix}.csv"
        
        save_template(templates, output_file)
        
        print("\n次のステップ:")
        print(f"  1. {output_file} を開く")
        print("  2. [TODO] の部分を実際のデータで置き換える")
        print("  3. 品質チェックリストで確認する")
        print("  4. validate_phrases.py で検証する（次に作成予定）")
        
        show_statistics(category, difficulty)
    
    else:
        print(f"❌ エラー: 不明なコマンド '{command}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
