#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
不自然なフレーズ分割を検出するスクリプト
"""

import json
from pathlib import Path

def load_json(filepath):
    """JSONファイルを読み込む"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def detect_unnatural_splits():
    """不自然なフレーズ分割を検出"""
    comp_path = Path('public/data/reading-passages-comprehensive.json')
    print(f"\n📄 Comprehensive JSONを読み込んでいます: {comp_path}")
    passages = load_json(comp_path)
    
    issues = []
    
    for passage in passages:
        passage_id = passage.get('id', 'unknown')
        phrases = passage.get('phrases', [])
        
        for i, phrase in enumerate(phrases):
            phrase_id = phrase.get('id', 'unknown')
            words = phrase.get('words', [])
            phrase_meaning = phrase.get('phraseMeaning', '')
            
            # 問題パターン1: "and" で始まるフレーズ
            if words and words[0].lower() == 'and':
                issues.append({
                    'type': '「and」で始まる不自然な分割',
                    'passage': passage_id,
                    'phrase': phrase_id,
                    'words': words,
                    'meaning': phrase_meaning,
                    'context': f"前フレーズ: {phrases[i-1].get('words', []) if i > 0 else 'なし'}"
                })
            
            # 問題パターン2: 1-2語の非常に短いフレーズ（前置詞句など）
            if len(words) <= 2 and i > 0:
                # 前のフレーズが名詞で終わり、現在のフレーズが前置詞で始まる
                prev_phrase = phrases[i-1]
                prev_words = prev_phrase.get('words', [])
                if prev_words and words:
                    if words[0].lower() in ['of', 'to', 'for', 'in', 'on', 'at', 'with', 'from', 'by']:
                        # これは前のフレーズと統合すべき可能性がある
                        pass  # ここでは報告のみ
            
            # 問題パターン3: カンマのみのフレーズ
            if words == [',']:
                issues.append({
                    'type': 'カンマのみのフレーズ',
                    'passage': passage_id,
                    'phrase': phrase_id,
                    'words': words,
                    'meaning': phrase_meaning
                })
            
            # 問題パターン4: 並列構造の不自然な分割
            # 例: "A, B, and C" が "A", "B", "and C" に分割されている
            if len(words) == 2 and words[0] == ',' and i > 0:
                # カンマで始まる2語フレーズ
                issues.append({
                    'type': 'カンマで始まる不自然な分割',
                    'passage': passage_id,
                    'phrase': phrase_id,
                    'words': words,
                    'meaning': phrase_meaning,
                    'context': f"前フレーズ: {phrases[i-1].get('words', []) if i > 0 else 'なし'}"
                })
    
    # レポート出力
    print("\n" + "=" * 60)
    print(f"検出された問題: {len(issues)}件")
    print("=" * 60)
    
    for issue in issues[:50]:  # 最初の50件のみ表示
        print(f"\n種類: {issue['type']}")
        print(f"パッセージ: {issue['passage']}, フレーズ: {issue['phrase']}")
        print(f"単語: {' '.join(issue['words'])}")
        print(f"意味: {issue['meaning']}")
        if 'context' in issue:
            print(f"前後: {issue['context']}")
    
    if len(issues) > 50:
        print(f"\n... 他 {len(issues) - 50} 件")
    
    return issues

def main():
    print("=" * 60)
    print("不自然なフレーズ分割の検出")
    print("=" * 60)
    
    issues = detect_unnatural_splits()
    
    print("\n" + "=" * 60)
    print(f"✅ 完了しました - {len(issues)}件の問題を検出")
    print("=" * 60)

if __name__ == '__main__':
    main()
