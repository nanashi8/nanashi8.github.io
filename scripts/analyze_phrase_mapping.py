#!/usr/bin/env python3
"""
英文ファイルとJSONファイルのフレーズ対応を分析
"""
import json

# ファイルパス
txt_path = "./public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt"
json_path = "./public/data/passages-phrase-learning/advanced-family-gathering.json"

# 英文ファイルを読み込む
with open(txt_path, 'r', encoding='utf-8') as f:
    txt_lines = [line.rstrip('\n') for line in f.readlines()]

# JSONファイルを読み込む
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 60)
print("英文ファイルとJSONの対応分析")
print("=" * 60)
print(f"英文行数: {len(txt_lines)}")
print(f"JSONフレーズ数: {len(data['phrases'])}")
print(f"差分: {len(txt_lines) - len(data['phrases'])}")
print()

# 最初の10フレーズを比較
print("最初の10フレーズの比較:")
print("-" * 60)
for i in range(min(10, len(data['phrases']))):
    json_phrase = data['phrases'][i]
    english = json_phrase['english']
    japanese = json_phrase.get('phraseMeaning', json_phrase.get('japanese', ''))
    
    # 英文ファイルの対応する行（複数行の場合がある）
    txt_line = txt_lines[i] if i < len(txt_lines) else "（行不足）"
    
    print(f"\nフレーズ {i+1}:")
    print(f"  JSON英文: {english[:50]}...")
    print(f"  TXT行{i+1}: {txt_line[:50]}...")
    print(f"  日本語: {japanese[:50]}...")

# 英文ファイルの各行に対応するJSONフレーズを探す
print("\n" + "=" * 60)
print("TXTファイルの各行がどのJSONフレーズに含まれるか分析")
print("=" * 60)

# JSONの英文を空白で分割して単語リストを作成
json_phrases_words = []
for phrase in data['phrases']:
    words = phrase['english'].split()
    json_phrases_words.append({
        'id': phrase['id'],
        'english': phrase['english'],
        'japanese': phrase.get('phraseMeaning', phrase.get('japanese', '')),
        'words': words
    })

# 英文ファイルの行をJSONフレーズにマッピング
line_to_phrase_map = []
current_phrase_idx = 0
word_position = 0

for line_idx, line in enumerate(txt_lines[:50]):  # 最初の50行のみ分析
    line_stripped = line.strip()
    if not line_stripped:
        line_to_phrase_map.append({
            'line_num': line_idx + 1,
            'line_text': line_stripped,
            'phrase_id': None,
            'phrase_japanese': ''
        })
        continue
    
    # 現在のフレーズの単語と比較
    if current_phrase_idx < len(json_phrases_words):
        phrase = json_phrases_words[current_phrase_idx]
        
        # この行が現在のフレーズに含まれるか確認
        line_words = line_stripped.split()
        
        # フレーズの単語位置を更新
        if word_position < len(phrase['words']):
            # この行が現在のフレーズの一部かチェック
            is_match = True
            for i, word in enumerate(line_words):
                if word_position + i >= len(phrase['words']):
                    is_match = False
                    break
                if phrase['words'][word_position + i] != word:
                    is_match = False
                    break
            
            if is_match:
                line_to_phrase_map.append({
                    'line_num': line_idx + 1,
                    'line_text': line_stripped[:40] + '...' if len(line_stripped) > 40 else line_stripped,
                    'phrase_id': phrase['id'],
                    'phrase_japanese': phrase['japanese'][:40] + '...' if len(phrase['japanese']) > 40 else phrase['japanese']
                })
                word_position += len(line_words)
                
                # フレーズの終わりに達したら次のフレーズへ
                if word_position >= len(phrase['words']):
                    current_phrase_idx += 1
                    word_position = 0
            else:
                # 次のフレーズに移動
                current_phrase_idx += 1
                word_position = 0
        else:
            current_phrase_idx += 1
            word_position = 0

# マッピング結果を表示
print("\n最初の30行のマッピング:")
for item in line_to_phrase_map[:30]:
    phrase_info = f"フレーズ{item['phrase_id']}: {item['phrase_japanese']}" if item['phrase_id'] else "（空行）"
    print(f"行{item['line_num']:4d}: {item['line_text']:45s} → {phrase_info}")

print("\n" + "=" * 60)
print("推奨される対応方法:")
print("=" * 60)
print("1. JSONファイルは意味のある単位でフレーズ化されている（820フレーズ）")
print("2. 英文ファイルは細かく改行されている（1639行）")
print("3. 各TXT行に対応する日本語訳を生成するには：")
print("   a) TXT各行がどのJSONフレーズに属するか特定")
print("   b) JSONフレーズの日本語訳を分割して各行に割り当て")
print("   c) または、TXT各行を独自に翻訳（全訳を参考に）")
