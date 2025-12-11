#!/usr/bin/env python3
"""
JSONファイルからフレーズ訳ファイルと全訳ファイルを生成
"""
import json

# JSONファイルを読み込む
json_path = "./public/data/passages-phrase-learning/advanced-family-gathering.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# フレーズ訳ファイルを生成（英文の各行に対応する日本語）
phrases_output = []
for phrase in data['phrases']:
    # phraseMeaningを使用（より詳細な訳）
    japanese = phrase.get('phraseMeaning', phrase.get('japanese', ''))
    phrases_output.append(japanese)

# フレーズ訳ファイルを保存
phrases_path = "./public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions-ja-phrases.txt"
with open(phrases_path, 'w', encoding='utf-8') as f:
    for line in phrases_output:
        f.write(line + '\n')

print(f"✓ Created phrases file: {len(phrases_output)} lines")

# 全訳ファイルを生成（段落ごとにまとめる）
# 句点で終わるフレーズを段落の区切りとして使用
paragraphs = []
current_paragraph = []

for phrase in data['phrases']:
    japanese = phrase.get('phraseMeaning', phrase.get('japanese', ''))
    current_paragraph.append(japanese)
    
    # 句点（。）で終わる場合は段落区切り
    if japanese.endswith('。') or japanese.endswith('！') or japanese.endswith('？') or japanese.endswith('」'):
        paragraphs.append(''.join(current_paragraph))
        current_paragraph = []

# 残りがあれば追加
if current_paragraph:
    paragraphs.append(''.join(current_paragraph))

# 全訳ファイルを保存
translation_path = "./public/data/passages-translations/advanced-family-gathering-ja.txt"
with open(translation_path, 'w', encoding='utf-8') as f:
    for i, para in enumerate(paragraphs):
        f.write(para)
        if i < len(paragraphs) - 1:
            f.write('\n\n')

print(f"✓ Created translation file: {len(paragraphs)} paragraphs")
print(f"\nPhrases path: {phrases_path}")
print(f"Translation path: {translation_path}")
