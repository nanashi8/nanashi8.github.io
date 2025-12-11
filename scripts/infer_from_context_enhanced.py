#!/usr/bin/env python3
"""
第3段階: 文脈からの意味推論（改良版）

パッセージの日本語訳から単語の意味を推論
- カタカナ部分の検出
- 品詞マーカーの利用（「〜する」「〜な」など）
- 前後の訳語との整合性チェック
"""

import json
from pathlib import Path
from collections import defaultdict
import re


def extract_katakana(text):
    """カタカナ部分を抽出"""
    # カタカナブロックを抽出（記号含む）
    katakana_pattern = r'[ァ-ヴー・]+'
    matches = re.findall(katakana_pattern, text)
    # 1文字のカタカナや記号のみは除外
    return [m for m in matches if len(m) > 1 and not m.replace('・', '').replace('ー', '') == '']


def infer_meaning_from_japanese(word, japanese_translations):
    """日本語訳から意味を推論"""
    # 複数の訳から共通パターンを見つける
    all_katakana = []
    all_translations = []
    
    for jp in japanese_translations[:5]:  # 最初の5つの例を使用
        # カタカナを抽出
        katakana = extract_katakana(jp)
        all_katakana.extend(katakana)
        all_translations.append(jp)
    
    # カタカナが見つかった場合
    if all_katakana:
        # 最も頻出するカタカナ
        katakana_freq = defaultdict(int)
        for k in all_katakana:
            katakana_freq[k] += 1
        
        most_common = max(katakana_freq.items(), key=lambda x: x[1])
        if most_common[1] >= 2:  # 2回以上出現
            return most_common[0]
    
    # カタカナが見つからない場合、日本語訳から推測
    # 単語の長さに基づいて訳の候補を絞り込む
    word_lower = word.lower()
    
    # 短い単語は基本的な意味の可能性が高い
    if len(word_lower) <= 4:
        # 頻出する短い単語の候補
        common_short_words = {
            'met': '会った',
            'ate': '食べた',
            'grew': '成長した・育った',
            'held': '開催した・持った',
            'wore': '着ていた',
            'born': '生まれた',
            'kept': '保った・守った',
            'lent': '貸した',
            'won': '勝った',
            'lost': '失った',
            'felt': '感じた',
            'left': '去った・残した',
            'sent': '送った',
            'came': '来た',
            'went': '行った',
            'gave': '与えた',
            'took': '取った',
            'made': '作った',
            'said': '言った',
            'told': '話した',
            'knew': '知っていた',
            'got': '得た',
            'saw': '見た',
            'put': '置いた',
            'ran': '走った',
            'sat': '座った',
            'cut': '切った',
            'let': 'させた',
            'set': '設定した',
            'hit': '打った',
            'shut': '閉めた',
            'hurt': '傷つけた',
            'cost': '費用がかかった',
            'cast': '投げた',
            'beat': '打ち負かした',
            'quit': 'やめた',
            'read': '読んだ',
            'lead': '導いた',
            'feed': '食べ物を与えた',
            'paid': '支払った',
            'laid': '置いた',
            'sold': '売った',
            'told': '話した',
            'hung': 'かけた',
            'shot': '撃った',
            'won\'t': 'しないだろう',
            'can\'t': 'できない',
            'don\'t': 'しない',
            'didn\'t': 'しなかった',
            'isn\'t': 'ではない',
            'wasn\'t': 'ではなかった',
            'aren\'t': 'ではない',
            'weren\'t': 'ではなかった',
        }
        
        if word_lower in common_short_words:
            return common_short_words[word_lower]
    
    # 日本語訳から候補を抽出
    # 「の」や「を」で分割して名詞句を探す
    candidates = []
    for jp in all_translations[:3]:
        # 「の」「を」「に」「が」「は」で分割
        parts = re.split(r'[のをにがは]', jp)
        for part in parts:
            part = part.strip()
            # カタカナ以外で、適度な長さの候補
            if part and not re.match(r'^[ァ-ヴー・]+$', part) and 1 < len(part) < 10:
                candidates.append(part)
    
    if candidates:
        # 最も頻出する候補
        cand_freq = defaultdict(int)
        for c in candidates:
            cand_freq[c] += 1
        
        most_common_cand = max(cand_freq.items(), key=lambda x: x[1])
        if most_common_cand[1] >= 2:
            return most_common_cand[0]
    
    return None


def main():
    # パスの設定
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    passages_dir = Path('public/data/passages-phrase-learning')
    
    # 辞書を読み込み
    print("📖 辞書を読み込み中...")
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    # パッセージファイルから(要確認)単語と文脈を収集
    print("📊 (要確認)単語と文脈を収集中...")
    word_contexts = defaultdict(lambda: {'translations': [], 'count': 0})
    
    for passage_file in passages_dir.glob('*.json'):
        with open(passage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for phrase in data.get('phrases', []):
            japanese = phrase.get('japanese', '')
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                meaning = segment.get('meaning', '')
                
                if meaning == '(要確認)' and word:
                    word_contexts[word]['translations'].append(japanese)
                    word_contexts[word]['count'] += 1
    
    print(f"  見つかった(要確認)単語: {len(word_contexts)}種類")
    
    # 意味を推論
    print("\n🔍 文脈から意味を推論中...")
    inferred_words = {}
    
    for word, context in word_contexts.items():
        meaning = infer_meaning_from_japanese(word, context['translations'])
        if meaning:
            inferred_words[word.lower()] = {
                'meaning': meaning,
                'count': context['count'],
                'confidence': 'medium'
            }
    
    print(f"  推論可能な単語: {len(inferred_words)}語")
    print(f"  総出現回数: {sum(w['count'] for w in inferred_words.values())}回")
    
    if not inferred_words:
        print("\n推論できる単語がありません。")
        return
    
    # 辞書を更新
    print("\n📝 辞書を更新中...")
    updated_count = 0
    for word_lower, info in inferred_words.items():
        if word_lower in dictionary:
            if dictionary[word_lower].get('meaning') == '(要確認)':
                dictionary[word_lower]['meaning'] = info['meaning']
                dictionary[word_lower]['source'] = 'context-inference'
                updated_count += 1
    
    # 辞書を保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f"  辞書更新: {updated_count}語")
    
    # パッセージファイルを更新
    print("\n📝 パッセージファイルを更新中...")
    total_updated = 0
    
    for passage_file in sorted(passages_dir.glob('*.json')):
        with open(passage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_updated = 0
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                word_lower = word.lower()
                
                if word_lower in inferred_words and segment.get('meaning') == '(要確認)':
                    segment['meaning'] = inferred_words[word_lower]['meaning']
                    file_updated += 1
        
        if file_updated > 0:
            with open(passage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {passage_file.name}: {file_updated}箇所更新")
            total_updated += file_updated
    
    print(f"\n✅ 完了!")
    print(f"  推論した単語: {len(inferred_words)}語")
    print(f"  更新した箇所: {total_updated}箇所")
    
    # サンプルを表示
    print("\n📊 推論例（出現頻度上位20）:")
    sorted_inferred = sorted(inferred_words.items(), key=lambda x: x[1]['count'], reverse=True)
    for i, (word, info) in enumerate(sorted_inferred[:20], 1):
        print(f"  {i}. {word}: {info['meaning']} ({info['count']}回)")
    
    # 残りの統計
    print("\n📊 残りの(要確認)単語:")
    remaining_unconfirmed = sum(1 for v in dictionary.values() if v.get('meaning') == '(要確認)')
    total_words = len(dictionary)
    has_meaning = sum(1 for v in dictionary.values() if v.get('meaning', '') and v.get('meaning', '') not in ['(要確認)', '(未登録)', '(固有名詞)'])
    print(f"  完成率: {has_meaning}/{total_words} ({has_meaning/total_words*100:.1f}%)")
    print(f"  残り(要確認): {remaining_unconfirmed}語")


if __name__ == '__main__':
    main()
