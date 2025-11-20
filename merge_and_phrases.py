#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
「and」で始まる不自然なフレーズ分割を修正するスクリプト
"""

import json
import copy
from pathlib import Path

def load_json(filepath):
    """JSONファイルを読み込む"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filepath):
    """JSONファイルを保存する"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ {filepath} を保存しました")

def merge_and_phrases():
    """「and」で始まるフレーズを前のフレーズと統合"""
    comp_path = Path('public/data/reading-passages-comprehensive.json')
    print(f"\n📄 Comprehensive JSONを読み込んでいます: {comp_path}")
    passages = load_json(comp_path)
    
    merge_count = 0
    
    for passage in passages:
        passage_id = passage.get('id', 'unknown')
        phrases = passage.get('phrases', [])
        
        # 後ろから処理（削除しながら進むため）
        i = len(phrases) - 1
        while i > 0:
            current_phrase = phrases[i]
            current_words = current_phrase.get('words', [])
            
            # 「and」で始まるフレーズを検出
            if current_words and current_words[0].lower() == 'and':
                prev_phrase = phrases[i - 1]
                prev_words = prev_phrase.get('words', [])
                prev_segments = prev_phrase.get('segments', [])
                current_segments = current_phrase.get('segments', [])
                
                # 前のフレーズと統合
                # words配列を統合
                new_words = prev_words + current_words
                
                # segments配列を統合
                new_segments = prev_segments + current_segments
                
                # phraseMeaningを統合（簡易的に連結）
                prev_meaning = prev_phrase.get('phraseMeaning', '')
                current_meaning = current_phrase.get('phraseMeaning', '')
                
                # 意味の統合ロジック
                if current_meaning and current_meaning.startswith('と'):
                    # "と〜" の場合、前の意味に追加
                    new_meaning = prev_meaning + current_meaning[1:] if len(current_meaning) > 1 else prev_meaning
                else:
                    new_meaning = prev_meaning + current_meaning
                
                # 前のフレーズを更新
                prev_phrase['words'] = new_words
                prev_phrase['segments'] = new_segments
                prev_phrase['phraseMeaning'] = new_meaning
                
                # 現在のフレーズを削除
                phrases.pop(i)
                
                merge_count += 1
                print(f"  ✓ {passage_id} - {current_phrase.get('id')}: 統合しました")
            
            i -= 1
        
        # phrase IDを再割り当て（phrase-1, phrase-2, ...）
        for idx, phrase in enumerate(phrases, 1):
            phrase['id'] = f"phrase-{idx}"
    
    # 保存
    if merge_count > 0:
        save_json(passages, comp_path)
        print(f"\n✅ {merge_count}個のフレーズを統合しました")
    else:
        print(f"\n✓ 統合が必要なフレーズはありませんでした")
    
    return merge_count

def main():
    print("=" * 60)
    print("「and」フレーズ統合スクリプト")
    print("=" * 60)
    
    merge_count = merge_and_phrases()
    
    print("\n" + "=" * 60)
    print(f"✅ 完了しました - {merge_count}個のフレーズを統合")
    print("=" * 60)

if __name__ == '__main__':
    main()
