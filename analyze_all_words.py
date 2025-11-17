import csv
import json

# CSVファイルを読み込んで品詞を分析
input_file = 'public/data/junior-high-entrance-words.csv'

verbs = []
pronouns = []
adjectives = []
adverbs = []
total_words = 0

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    for row in reader:
        if len(row) >= 3:
            word = row[0].strip()
            reading = row[1].strip()
            meaning = row[2].strip()
            total_words += 1
            
            # 意味から品詞を判断
            meaning_lower = meaning.lower()
            
            # 動詞の判定（より包括的に）
            if any(x in meaning for x in ['する', 'させる', '〜る', 'れる', 'られる']) or \
               any(x in meaning_lower for x in ['to ', '...する', '〜する']):
                verbs.append({'word': word, 'reading': reading, 'meaning': meaning})
            
            # 代名詞の判定
            if any(x in meaning for x in ['私', '彼', '彼女', 'それ', 'あなた', 'これ', 'あれ', '誰', '何']) and \
               word.lower() in ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'who', 'what', 'which', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them', 'mine', 'yours', 'hers', 'ours', 'theirs']:
                pronouns.append({'word': word, 'reading': reading, 'meaning': meaning})
            
            # 形容詞の判定
            if any(x in meaning for x in ['い', 'な', '的な']) and not any(x in meaning for x in ['する', 'させる']):
                adjectives.append({'word': word, 'reading': reading, 'meaning': meaning})
            
            # 副詞の判定
            if any(x in meaning for x in ['に', 'く', 'して', 'で']) and word.endswith('ly'):
                adverbs.append({'word': word, 'reading': reading, 'meaning': meaning})

print(f"総単語数: {total_words}")
print(f"\n動詞候補: {len(verbs)}個")
print(f"代名詞候補: {len(pronouns)}個")
print(f"形容詞候補: {len(adjectives)}個")
print(f"副詞候補: {len(adverbs)}個")

# 結果をJSONに保存
result = {
    'total': total_words,
    'verbs': verbs[:20],  # サンプルとして最初の20個
    'pronouns': pronouns,
    'adjectives': adjectives[:20],
    'adverbs': adverbs[:20]
}

with open('word_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("\n動詞の例（最初の20個）:")
for v in verbs[:20]:
    print(f"  {v['word']} - {v['meaning']}")

print("\n代名詞の例:")
for p in pronouns[:15]:
    print(f"  {p['word']} - {p['meaning']}")
