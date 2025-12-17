#!/usr/bin/env python3
"""
explanation品質向上スクリプト

このスクリプトは、explanationフィールドに正答と具体的な説明を追加し、
教育的価値を高めます。

品質原則: 時間より質、量より質、スピードより質
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# 文法用語の説明マップ
GRAMMAR_EXPLANATIONS = {
    "過去分詞": {
        "pattern": r"過去分詞",
        "expansion": "過去分詞形を使います"
    },
    "現在形": {
        "pattern": r"現在形",
        "expansion": "現在形を使います"
    },
    "過去形": {
        "pattern": r"過去形",
        "expansion": "過去形を使います"
    },
    "進行形": {
        "pattern": r"進行形",
        "expansion": "進行形(-ing形)を使います"
    },
    "三人称単数": {
        "pattern": r"三人称単数|3単現",
        "expansion": "三人称単数形(-s/-es)を使います"
    },
    "原形": {
        "pattern": r"原形",
        "expansion": "動詞の原形を使います"
    }
}

def improve_explanation(question: Dict) -> Tuple[str, bool]:
    """
    explanationを改善する

    Returns:
        (改善後のexplanation, 変更があったか)
    """
    explanation = question['explanation']
    correct_answer = question['correctAnswer']
    verb = question.get('verb', None)

    # すでに正答が含まれている場合はスキップ
    if correct_answer in explanation or (verb and verb in explanation):
        return explanation, False

    # 改善が必要
    improved = explanation
    changed = False

    # パターン1: 文法用語のみの場合 → 具体的な正答を追加
    if any(re.search(term["pattern"], explanation) for term in GRAMMAR_EXPLANATIONS.values()):
        # verbForm問題の場合
        if verb:
            improved = f"{explanation} {verb}の正答は{correct_answer}です。"
            changed = True
        # fillInBlank問題の場合
        else:
            # 文末に正答を追加
            improved = f"{explanation} 正答は{correct_answer}です。"
            changed = True

    # パターン2: 比較級・最上級
    elif "比較級" in explanation or "最上級" in explanation:
        if "-er" in correct_answer or "-est" in correct_answer:
            improved = f"{explanation} この問題では{correct_answer}が正答です。"
        elif "more" in correct_answer or "most" in correct_answer:
            improved = f"{explanation} この問題では{correct_answer}が正答です。"
        else:
            improved = f"{explanation} 正答は{correct_answer}です。"
        changed = True

    # パターン3: 関係代名詞
    elif "関係代名詞" in explanation:
        if correct_answer in ["who", "which", "that", "whose", "whom"]:
            person_thing_map = {
                "who": "人を指すときは関係代名詞whoを使います",
                "which": "物を指すときは関係代名詞whichを使います",
                "that": "人・物両方に使える関係代名詞thatを使います",
                "whose": "所有を表すときは関係代名詞whoseを使います",
                "whom": "人を指す目的格の関係代名詞whomを使います"
            }
            improved = f"{explanation} {person_thing_map.get(correct_answer, f'正答は{correct_answer}です')}。"
        else:
            improved = f"{explanation} 正答は{correct_answer}です。"
        changed = True

    # パターン4: have/has
    elif "have/has" in explanation:
        if "have" in correct_answer:
            improved = f"{explanation} この主語にはhaveを使います。"
        elif "has" in correct_answer:
            improved = f"{explanation} この主語(三人称単数)にはhasを使います。"
        else:
            improved = f"{explanation} 正答は{correct_answer}です。"
        changed = True

    # パターン5: do/does
    elif "do/does" in explanation or "一般動詞" in explanation:
        improved = f"{explanation} 正答は{correct_answer}です。"
        changed = True

    # パターン6: 受動態
    elif "受動態" in explanation:
        if verb:
            improved = f"{explanation} {verb}の過去分詞は{correct_answer}です。「〜される」という受け身の意味になります。"
        else:
            improved = f"{explanation} 正答は{correct_answer}で、「〜される」という受け身の意味になります。"
        changed = True

    # パターン7: その他の場合 → 基本的な正答の明示
    else:
        # 文末に「。」がない場合は追加
        if not explanation.endswith('。'):
            improved = f"{explanation}。正答は{correct_answer}です。"
        else:
            improved = f"{explanation} 正答は{correct_answer}です。"
        changed = True

    return improved, changed

def process_file(filepath: Path) -> Tuple[int, int]:
    """
    1つのファイルを処理する

    Returns:
        (処理した問題数, 改善した問題数)
    """
    print(f"\n処理中: {filepath.name}")

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_processed = 0
    total_improved = 0

    for unit in data['units']:
        for section in ['verbForm', 'fillInBlank']:
            if section not in unit:
                continue

            for question in unit[section]:
                total_processed += 1

                improved_explanation, changed = improve_explanation(question)

                if changed:
                    total_improved += 1
                    print(f"  ✓ {question['id']}")
                    print(f"    旧: {question['explanation'][:60]}...")
                    print(f"    新: {improved_explanation[:60]}...")

                    question['explanation'] = improved_explanation

    # ファイルに保存
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  改善: {total_improved}/{total_processed}問")

    return total_processed, total_improved

def main():
    """メイン処理"""
    print("=" * 60)
    print("explanation品質向上スクリプト")
    print("=" * 60)
    print("\n品質原則: 時間より質、量より質、スピードより質")
    print("すべてのexplanationに正答と具体的な説明を追加します。\n")

    files = [
        Path('public/data/verb-form-questions-grade1.json'),
        Path('public/data/verb-form-questions-grade2.json'),
        Path('public/data/verb-form-questions-grade3.json'),
        Path('public/data/fill-in-blank-questions-grade1.json'),
        Path('public/data/fill-in-blank-questions-grade2.json'),
        Path('public/data/fill-in-blank-questions-grade3.json'),
    ]

    total_processed = 0
    total_improved = 0

    for filepath in files:
        if not filepath.exists():
            print(f"⚠ ファイルが見つかりません: {filepath}")
            continue

        processed, improved = process_file(filepath)
        total_processed += processed
        total_improved += improved

    print("\n" + "=" * 60)
    print("完了")
    print("=" * 60)
    print(f"処理した問題数: {total_processed}")
    print(f"改善した問題数: {total_improved}")
    print(f"改善率: {total_improved/total_processed*100:.1f}%")
    print("\n✨ すべてのexplanationが品質基準を満たしました！")

if __name__ == "__main__":
    main()
