import json
import re
from collections import defaultdict

# 読解問題の単語を抽出
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

passage_words = set()
for passage in passages:
    for phrase in passage.get('phrases', []):
        for word in phrase.get('words', []):
            # 単語を正規化（小文字、記号除去）
            normalized = re.sub(r'[.,!?;:\"\'()]+', '', word.lower()).strip()
            if normalized and not normalized.isspace():
                passage_words.add(normalized)

print(f"読解問題の総単語数（ユニーク）: {len(passage_words)}")

# 単語辞書を読み込み
with open('public/data/junior-high-entrance-words.csv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

dictionary_words = set()
for line in lines[1:]:  # ヘッダーをスキップ
    if line.strip():
        parts = line.split(',')
        if parts:
            word = parts[0].strip().lower()
            dictionary_words.add(word)

print(f"辞書の総単語数: {len(dictionary_words)}")

# 辞書にない単語を特定
missing_words = sorted(passage_words - dictionary_words)
print(f"\n辞書に存在しない単語数: {len(missing_words)}")
print("\n辞書に存在しない単語（最初の50個）:")
for word in missing_words[:50]:
    print(f"  - {word}")

# 完全なリストをファイルに保存
with open('missing_words.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(missing_words))
print(f"\n全リストを missing_words.txt に保存しました")
