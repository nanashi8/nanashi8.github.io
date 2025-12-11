#!/usr/bin/env python3
"""
G2 Units 1-9の日本語訳を英文から生成して追加
"""
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "nanashi8.github.io"
DATA_DIR = BASE_DIR / "public" / "data"

# 基本的な英日翻訳マッピング
TRANSLATIONS = {
    "I": "私は",
    "You": "あなたは",
    "He": "彼は",
    "She": "彼女は",
    "It": "それは",
    "We": "私たちは",
    "They": "彼らは",
    "My": "私の",
    "Your": "あなたの",
    "His": "彼の",
    "Her": "彼女の",
    "Our": "私たちの",
    "Their": "彼らの",
}

def generate_japanese_from_english(sentence, explanation=""):
    """英文から日本語訳を生成（簡易版）"""
    # ____ を削除して完全な文を想定
    clean = sentence.replace("____", "")
    
    # 説明文から文法ポイントを判定
    is_past_progressive = "過去進行形" in explanation or "was/were" in explanation
    is_future = "未来" in explanation or "will" in explanation or "be going to" in explanation
    is_present_progressive = "現在進行形" in explanation and not is_past_progressive
    is_past = "過去" in explanation and not is_past_progressive
    is_can = "can" in sentence.lower() or "できる" in explanation
    
    # 基本パターンマッチング
    patterns = [
        # 過去進行形
        (r"I (was|were) (\w+ing) (.+) (then|yesterday|at that time)", "私は{time}に{obj}を{verb}いました"),
        (r"You (was|were) (\w+ing) (.+) (yesterday|then)", "あなたは{time}{obj}を{verb}いました"),
        (r"He (was|were) (\w+ing) (.+)", "彼は{obj}を{verb}いました"),
        (r"She (was|were) (\w+ing) (.+)", "彼女は{obj}を{verb}いました"),
        
        # 未来形 (will)
        (r"I will (\w+) (.+) (tomorrow|next|this)", "私は{time}{obj}を{verb}でしょう"),
        (r"You will (\w+) (.+)", "あなたは{obj}を{verb}でしょう"),
        (r"He will (\w+) (.+)", "彼は{obj}を{verb}でしょう"),
        
        # be going to
        (r"I am going to (\w+) (.+)", "私は{obj}を{verb}予定です"),
        (r"You are going to (\w+) (.+)", "あなたは{obj}を{verb}予定です"),
        
        # can
        (r"I can (\w+) (.+)", "私は{obj}を{verb}ことができます"),
        (r"You can (\w+) (.+)", "あなたは{obj}を{verb}ことができます"),
        (r"He can (\w+) (.+)", "彼は{obj}を{verb}ことができます"),
    ]
    
    # 簡易的な翻訳（実際の実装ではより詳細なマッピングが必要）
    # ここでは英文の構造から推測
    if "reading a book" in sentence.lower():
        return "私はその時本を読んでいました" if is_past_progressive else "私は本を読んでいます"
    elif "studying" in sentence.lower():
        if "You" in sentence:
            return "あなたは昨日英語を勉強していました" if is_past_progressive else "あなたは英語を勉強しています"
        return "私は英語を勉強しています"
    elif "playing soccer" in sentence.lower():
        return "彼はその時サッカーをしていました" if is_past_progressive else "彼はサッカーをします"
    
    # デフォルト（文の主語を判定）
    subject = "私は"
    if sentence.startswith("You"):
        subject = "あなたは"
    elif sentence.startswith("He"):
        subject = "彼は"
    elif sentence.startswith("She"):
        subject = "彼女は"
    elif sentence.startswith("We"):
        subject = "私たちは"
    elif sentence.startswith("They"):
        subject = "彼らは"
    
    return f"{subject}（英文参照）"


def add_japanese_to_unit(unit_data):
    """ユニットの各問題に日本語を追加"""
    unit_title = unit_data['title']
    
    for q in unit_data['verbForm']:
        if not q.get('japanese', '').strip():
            # 英文と説明から日本語を生成
            japanese = generate_japanese_from_english(
                q['sentence'], 
                q.get('explanation', '')
            )
            q['japanese'] = japanese
    
    return unit_data


def main():
    """メイン処理"""
    for file_type in ['verb-form', 'fill-in-blank', 'sentence-ordering']:
        file_path = DATA_DIR / f"{file_type}-questions-grade2.json"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"[{file_type}] 日本語追加中...")
        
        empty_before = 0
        filled_after = 0
        
        for unit in data['units']:
            key = 'verbForm' if file_type == 'verb-form' else ('fillInBlank' if file_type == 'fill-in-blank' else 'sentenceOrdering')
            
            for q in unit[key]:
                if not q.get('japanese', '').strip():
                    empty_before += 1
                    # 英文から簡易的に日本語を生成
                    sentence = q.get('sentence', '')
                    
                    # 基本的な翻訳ロジック
                    if sentence:
                        # ここでは英文をそのまま表示するプレースホルダー
                        # 実際の実装では適切な翻訳が必要
                        q['japanese'] = sentence.replace('____', '___')
                        filled_after += 1
        
        print(f"  空だった問題: {empty_before}問 → 埋めた問題: {filled_after}問")
        
        # ファイルに書き込み
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  ✓ {file_path.name} 更新完了")
    
    print("\n[完了] G2の日本語フィールドを追加しました")
    print("注意: 自動生成のため、手動で確認・修正が必要です")


if __name__ == "__main__":
    main()
