import json
import re
import copy

def split_phrase_grammatically(phrase):
    """
    フレーズを文法的な単位に分割する
    """
    words = phrase['words']
    segments = phrase.get('segments', [])
    phrase_meaning = phrase.get('phraseMeaning', '')
    
    # テキストを作成
    text = ' '.join(words)
    
    # 分割ポイントを特定
    split_points = []
    
    # 1. 関係代名詞・関係副詞の直前で分割
    relative_words = ['that', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why']
    for i, word in enumerate(words):
        if word.lower() in relative_words and i > 0:
            split_points.append(i)
    
    # 2. 従属接続詞の直前で分割
    subordinate_conj = ['because', 'since', 'as', 'if', 'unless', 'whether', 
                        'while', 'before', 'after', 'until', 'although', 'though']
    for i, word in enumerate(words):
        if word.lower() in subordinate_conj and i > 0:
            split_points.append(i)
    
    # 3. 等位接続詞の直前で分割（ただし文頭から3単語以上の位置）
    coord_conj = ['and', 'but', 'or', 'so', 'yet']
    for i, word in enumerate(words):
        if word.lower() in coord_conj and i > 2:
            split_points.append(i)
    
    # 4. 長い前置詞句の直前で分割（前置詞 + 2単語以上）
    prepositions = ['of', 'for', 'in', 'on', 'at', 'to', 'from', 'with', 'about', 'without']
    for i, word in enumerate(words):
        if word.lower() in prepositions and i > 0:
            # 前置詞の後に2単語以上あり、かつ前に3単語以上ある場合
            if i >= 3 and len(words) - i >= 3:
                split_points.append(i)
    
    # 分割ポイントをユニーク化してソート
    split_points = sorted(set(split_points))
    
    if not split_points:
        return [phrase]
    
    # 分割を実行
    result = []
    prev_idx = 0
    
    for split_idx in split_points:
        # 前の部分
        chunk_words = words[prev_idx:split_idx]
        chunk_segments = segments[prev_idx:split_idx] if segments else []
        
        if chunk_words:
            # セグメントがない場合は作成
            if not chunk_segments:
                chunk_segments = [{'word': w, 'meaning': '-', 'isUnknown': False} for w in chunk_words]
            
            result.append({
                'id': f"{phrase['id']}-{len(result)+1}",
                'words': chunk_words,
                'phraseMeaning': '',  # 後で推測
                'segments': chunk_segments
            })
        
        prev_idx = split_idx
    
    # 最後の部分
    chunk_words = words[prev_idx:]
    chunk_segments = segments[prev_idx:] if segments else []
    
    if chunk_words:
        if not chunk_segments:
            chunk_segments = [{'word': w, 'meaning': '-', 'isUnknown': False} for w in chunk_words]
        
        result.append({
            'id': f"{phrase['id']}-{len(result)+1}",
            'words': chunk_words,
            'phraseMeaning': '',
            'segments': chunk_segments
        })
    
    # 和訳を推測（簡易版）
    if len(result) == 2 and phrase_meaning:
        # 2つに分割された場合、元の和訳を適切に分ける
        result[0]['phraseMeaning'] = phrase_meaning
        result[1]['phraseMeaning'] = ''
    
    return result

def process_all_passages(passages):
    """
    全パッセージを処理
    """
    new_passages = []
    total_original = 0
    total_new = 0
    
    for passage in passages:
        new_passage = copy.deepcopy(passage)
        new_phrases = []
        phrase_counter = 1
        
        for phrase in passage['phrases']:
            split_phrases = split_phrase_grammatically(phrase)
            
            for sp in split_phrases:
                sp['id'] = f"phrase-{phrase_counter}"
                new_phrases.append(sp)
                phrase_counter += 1
        
        total_original += len(passage['phrases'])
        total_new += len(new_phrases)
        
        new_passage['phrases'] = new_phrases
        new_passages.append(new_passage)
    
    return new_passages, total_original, total_new

# メイン処理
print("=" * 80)
print("全パッセージの文法的分割を実行")
print("=" * 80)

with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

print(f"\n元のフレーズ総数: {sum(len(p['phrases']) for p in passages)}")

new_passages, total_original, total_new = process_all_passages(passages)

print(f"新しいフレーズ総数: {total_new}")
print(f"増加数: {total_new - total_original} (+{(total_new/total_original - 1)*100:.1f}%)")

print("\n各パッセージの変化:")
for i, (old, new) in enumerate(zip(passages, new_passages)):
    old_count = len(old['phrases'])
    new_count = len(new['phrases'])
    print(f"  {old['title']}: {old_count} → {new_count} ({new_count - old_count:+d})")

# サンプル表示
print("\n" + "=" * 80)
print("【サンプル】最初のパッセージの最初の15フレーズ:")
print("=" * 80)
for i, phrase in enumerate(new_passages[0]['phrases'][:15], 1):
    text = ' '.join(phrase['words'])
    meaning = phrase.get('phraseMeaning', '')
    print(f"{i}. {text}")
    if meaning:
        print(f"   → {meaning}")
    print()

# 保存確認
confirm = input("\nこの変更を保存しますか？ (yes/no): ")

if confirm.lower() == 'yes':
    # バックアップ
    with open('public/data/reading-passages-comprehensive.json.backup2', 'w', encoding='utf-8') as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
    
    # 保存
    with open('public/data/reading-passages-comprehensive.json', 'w', encoding='utf-8') as f:
        json.dump(new_passages, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 変更を保存しました")
    print("✅ バックアップを reading-passages-comprehensive.json.backup2 に保存しました")
else:
    print("\n❌ 変更をキャンセルしました")
