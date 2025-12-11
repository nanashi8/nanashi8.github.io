#!/usr/bin/env python3
"""
未登録単語・固有名詞を全パッセージから抽出し、
ルールベースで全訳の文脈から意味を推測して辞書に登録するスクリプト

使用方法:
python3 scripts/fix_unregistered_words.py
"""

import json
import re
from pathlib import Path
from collections import defaultdict

def extract_unregistered_words(passages_dir: Path) -> dict:
    """
    未登録単語を抽出
    
    Returns:
        {
            "word": {
                "occurrences": [
                    {
                        "file": "beginner-cafe-menu.json",
                        "phrase_english": "...",
                        "phrase_japanese": "...",
                        "segments": [...]
                    }
                ],
                "count": 3
            }
        }
    """
    unregistered = defaultdict(lambda: {"occurrences": [], "count": 0})
    
    json_files = list(passages_dir.glob('*.json'))
    
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'phrases' not in data:
            continue
        
        for phrase in data['phrases']:
            phrase_english = phrase.get('english', '')
            phrase_japanese = phrase.get('japanese', '')
            
            if 'segments' not in phrase:
                continue
            
            for segment in phrase['segments']:
                meaning = segment.get('meaning', '')
                word = segment.get('word', '')
                
                # 未登録または固有名詞をチェック
                if meaning in ['(未登録)', '(固有名詞)', '']:
                    unregistered[word.lower()]["occurrences"].append({
                        "file": json_file.name,
                        "phrase_english": phrase_english,
                        "phrase_japanese": phrase_japanese,
                        "segments": phrase['segments'],
                        "word_original": word
                    })
                    unregistered[word.lower()]["count"] += 1
    
    return dict(unregistered)

def infer_meaning_from_context(word: str, occurrences: list) -> str:
    """
    ルールベースで全訳の文脈から意味を推測
    """
    # 句読点の場合
    if word in '.,!?;:\'"()—':
        return ""
    
    # 数字の場合
    if re.match(r'^\d+$', word):
        return f"数字の{word}"
    
    # 記号の場合
    if not re.match(r'^[a-zA-Z]', word):
        return ""
    
    if not occurrences:
        return "(推測不可)"
    
    # 複数の出現例から推測
    first_occ = occurrences[0]
    word_original = first_occ['word_original']
    
    # 大文字始まりの場合は固有名詞の可能性が高い
    if word_original[0].isupper() and word not in ['i', 'the', 'a', 'an']:
        # 日本語訳からカタカナ・漢字を抽出
        for occ in occurrences[:3]:
            ja_text = occ['phrase_japanese']
            # カタカナの連続を抽出
            katakana_matches = re.findall(r'[ァ-ヶー]{2,}', ja_text)
            if katakana_matches:
                return f"{katakana_matches[0]}"
            # 漢字の連続を抽出
            kanji_matches = re.findall(r'[一-龥]{2,}', ja_text)
            if kanji_matches:
                return f"{kanji_matches[0]}"
    
    # 一般的な単語の場合、日本語訳の対応部分を推測
    # 簡易的に日本語訳を「/」で分割して対応付け
    for occ in occurrences[:1]:
        phrase_en = occ['phrase_english']
        phrase_ja = occ['phrase_japanese']
        segments = occ['segments']
        
        # 単語のインデックスを見つける
        word_index = -1
        for i, seg in enumerate(segments):
            if seg.get('word', '').lower() == word.lower():
                word_index = i
                break
        
        if word_index == -1:
            continue
        
        # 日本語訳を「/」で分割
        ja_parts = phrase_ja.split('/')
        
        # インデックスが範囲内なら対応する日本語を取得
        if word_index < len(ja_parts):
            candidate = ja_parts[word_index].strip()
            # 助詞を除去
            candidate = re.sub(r'[はをがにへとでや、。]$', '', candidate)
            # カッコを除去
            candidate = re.sub(r'[「」『』（）()]', '', candidate)
            if candidate and len(candidate) > 0:
                return candidate
    
    return "(要確認)"

def update_dictionary(dictionary_path: Path, unregistered: dict):
    """
    辞書ファイルに未登録単語を追加（ルールベースで意味を推測）
    """
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    added_count = 0
    skipped_punctuation = 0
    
    # 出現回数でソート（多い順）
    sorted_words = sorted(unregistered.items(), key=lambda x: x[1]['count'], reverse=True)
    
    for word, info in sorted_words:
        # 既に辞書にある場合はスキップ
        if word in dictionary:
            continue
        
        # 意味を推測
        meaning = infer_meaning_from_context(word, info['occurrences'])
        
        # 句読点など意味が空の場合はスキップ
        if meaning == "":
            skipped_punctuation += 1
            continue
        
        # 辞書に追加
        dictionary[word] = {
            "word": word,
            "reading": "",  # 空欄（後でAIが補完）
            "meaning": meaning,
            "etymology": "",
            "relatedWords": "",
            "category": "未分類",
            "difficulty": "長文専用",
            "source": "auto",
            "passages": list(set([occ['file'].replace('.json', '') for occ in info['occurrences']]))
        }
        
        added_count += 1
        print(f"  {word} ({info['count']}回) → {meaning}")
    
    print(f"\n句読点・記号をスキップ: {skipped_punctuation}個")
    
    # 辞書を保存
    with open(dictionary_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    return added_count

def update_passage_files(passages_dir: Path, dictionary: dict):
    """
    パッセージファイルの未登録単語を辞書の意味で更新
    """
    json_files = list(passages_dir.glob('*.json'))
    total_updated = 0
    
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'phrases' not in data:
            continue
        
        file_updated = 0
        
        for phrase in data['phrases']:
            if 'segments' not in phrase:
                continue
            
            for segment in phrase['segments']:
                word = segment.get('word', '').lower()
                meaning = segment.get('meaning', '')
                
                # 未登録または固有名詞で、辞書に登録されている場合
                if meaning in ['(未登録)', '(固有名詞)', ''] and word in dictionary:
                    segment['meaning'] = dictionary[word]['meaning']
                    file_updated += 1
        
        # 変更があった場合のみ保存
        if file_updated > 0:
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {json_file.name}: {file_updated}箇所更新")
            total_updated += file_updated
    
    return total_updated

def main():
    base_dir = Path(__file__).parent.parent
    passages_dir = base_dir / 'public' / 'data' / 'passages-phrase-learning'
    dictionary_path = base_dir / 'public' / 'data' / 'dictionaries' / 'reading-passages-dictionary.json'
    
    print("未登録単語を抽出中...")
    unregistered = extract_unregistered_words(passages_dir)
    
    print(f"\n未登録単語: {len(unregistered)}個")
    
    # 出現回数でソート（多い順）
    sorted_words = sorted(unregistered.items(), key=lambda x: x[1]['count'], reverse=True)
    
    print("\n上位20個:")
    for word, info in sorted_words[:20]:
        print(f"  {word}: {info['count']}回")
    
    print("\n辞書に追加中...")
    added = update_dictionary(dictionary_path, unregistered)
    print(f"辞書に追加: {added}個")
    
    print("\nパッセージファイルを更新中...")
    
    # 更新後の辞書を読み込み
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = update_passage_files(passages_dir, dictionary)
    print(f"\n合計 {updated}箇所更新しました")

if __name__ == '__main__':
    main()
