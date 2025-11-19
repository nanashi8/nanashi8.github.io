import json
import re

def split_into_grammatical_units(phrase_data):
    """
    フレーズを文法的な単位（節・句）に分割する
    """
    words = phrase_data['words']
    word_meanings = phrase_data.get('wordMeanings', {})
    segments = phrase_data.get('segments', [])
    
    # セグメントから単語と意味を再構築
    if segments:
        word_list = [seg['word'] for seg in segments]
        meaning_dict = {seg['word']: seg['meaning'] for seg in segments if seg.get('meaning')}
    else:
        word_list = words
        meaning_dict = word_meanings
    
    text = ' '.join(word_list)
    
    # 文法的な分割ポイントを特定
    split_points = []
    
    # 1. 接続詞の前で分割 (and, but, or, so, yet, for, nor)
    conjunctions = r'\b(and|but|or|so|yet|for|nor)\b'
    
    # 2. 関係代名詞・関係副詞の前で分割 (that, which, who, whom, whose, when, where, why)
    relative_pronouns = r'\b(that|which|who|whom|whose|when|where|why)\b'
    
    # 3. 従属接続詞の前で分割 (because, if, when, while, although, etc.)
    subordinate_conjunctions = r'\b(because|since|if|unless|when|while|although|though|as|before|after|until)\b'
    
    # テキストを解析して分割ポイントを見つける
    # まず関係代名詞/副詞
    for match in re.finditer(relative_pronouns, text, re.IGNORECASE):
        # 前に名詞がある場合（関係詞節の開始）
        split_points.append(match.start())
    
    # 従属接続詞
    for match in re.finditer(subordinate_conjunctions, text, re.IGNORECASE):
        split_points.append(match.start())
    
    # 接続詞（文中の場合のみ）
    for match in re.finditer(conjunctions, text, re.IGNORECASE):
        if match.start() > 0:  # 文頭でない
            split_points.append(match.start())
    
    # 分割ポイントをソート
    split_points = sorted(set(split_points))
    
    if not split_points:
        return [phrase_data]  # 分割不要
    
    # 単語リストを分割
    result = []
    current_pos = 0
    word_index = 0
    
    for split_pos in split_points + [len(text)]:
        # split_posまでの部分を取得
        chunk = text[current_pos:split_pos].strip()
        if chunk:
            # この部分に含まれる単語を特定
            chunk_words = chunk.split()
            chunk_segments = []
            
            # 対応するセグメントを作成
            for word in chunk_words:
                # 句読点を除去して意味を検索
                clean_word = word.rstrip('.,;:!?')
                meaning = meaning_dict.get(clean_word, meaning_dict.get(word, '-'))
                
                chunk_segments.append({
                    'word': word,
                    'meaning': meaning,
                    'isUnknown': False
                })
            
            result.append({
                'id': f"{phrase_data['id']}-{len(result)+1}",
                'words': chunk_words,
                'phraseMeaning': '',  # 後で手動で設定
                'segments': chunk_segments
            })
        
        current_pos = split_pos
    
    return result

# メインの処理
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

# 最初のパッセージで試してみる
passage = passages[0]
print(f"Passage: {passage['title']}\n")

# 最初の5フレーズを分割
for i, phrase in enumerate(passage['phrases'][:5], 1):
    print(f"\n元のフレーズ {i}:")
    print(f"  {' '.join(phrase['words'])}")
    print(f"  和訳: {phrase['phraseMeaning']}")
    
    split_phrases = split_into_grammatical_units(phrase)
    
    if len(split_phrases) > 1:
        print(f"\n  → {len(split_phrases)}つに分割:")
        for j, sp in enumerate(split_phrases, 1):
            print(f"    {j}. {' '.join(sp['words'])}")
    else:
        print("  → 分割不要")

print("\n" + "="*80)
print("このスクリプトは分析のみです。実際の分割は手動で行います。")
