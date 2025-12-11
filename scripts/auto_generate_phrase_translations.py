#!/usr/bin/env python3
"""
英文ファイルと全訳ファイルから、行対応のフレーズ訳を自動生成
全訳を英文の行構造に合わせて分割する
"""
import re

# ファイルパス
english_path = "./public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt"
translation_path = "./public/data/passages-translations/advanced-family-gathering-ja.txt"
output_path = "./public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions-ja-phrases.txt"

# 英文を読み込む
with open(english_path, 'r', encoding='utf-8') as f:
    english_lines = [line.rstrip('\n') for line in f.readlines()]

# 全訳を読み込む（段落形式）
with open(translation_path, 'r', encoding='utf-8') as f:
    full_translation = f.read()

print(f"英文行数: {len(english_lines)}")
print(f"全訳文字数: {len(full_translation)}")

# 全訳を文に分割
sentences = []
current_sentence = ""

for char in full_translation:
    current_sentence += char
    # 文の終わりを検出（。！？」）
    if char in ['。', '！', '？', '」'] and current_sentence.strip():
        sentences.append(current_sentence.strip())
        current_sentence = ""

if current_sentence.strip():
    sentences.append(current_sentence.strip())

print(f"全訳の文数: {len(sentences)}")

# 英文の行を段落/文のグループに分ける
# 空行で区切られた段落を識別
paragraphs = []
current_para = []

for line in english_lines:
    if line.strip():
        current_para.append(line.strip())
    else:
        if current_para:
            paragraphs.append(current_para)
            current_para = []

if current_para:
    paragraphs.append(current_para)

print(f"英文の段落数: {len(paragraphs)}")

# 各段落に対して全訳の文を割り当てる
japanese_lines = []
sentence_idx = 0

for para_idx, para in enumerate(paragraphs):
    # この段落に割り当てる文の数を決定
    # 段落の行数に基づいて文を分配
    para_line_count = len(para)
    
    # この段落に対応する日本語文を取得
    if sentence_idx < len(sentences):
        # 1つの日本語文を段落の行数に分割
        japanese_sentence = sentences[sentence_idx]
        
        if para_line_count == 1:
            # 1行の場合はそのまま
            japanese_lines.append(japanese_sentence)
            japanese_lines.append("")  # 空行
            sentence_idx += 1
        else:
            # 複数行の場合は文を分割
            # 文を適切な位置で分割（句読点、接続詞などで）
            split_parts = re.split(r'([、。！？」])', japanese_sentence)
            
            # 分割結果を整形
            parts = []
            current_part = ""
            for part in split_parts:
                if part in ['、', '。', '！', '？', '」']:
                    current_part += part
                    if current_part.strip():
                        parts.append(current_part.strip())
                    current_part = ""
                elif part.strip():
                    current_part += part
            
            if current_part.strip():
                parts.append(current_part.strip())
            
            # 段落の行数に合わせて分配
            lines_per_group = max(1, len(parts) // para_line_count)
            
            for i in range(para_line_count):
                start_idx = i * lines_per_group
                end_idx = min((i + 1) * lines_per_group, len(parts))
                
                if start_idx < len(parts):
                    japanese_lines.append(''.join(parts[start_idx:end_idx]))
                else:
                    japanese_lines.append("")
                
                japanese_lines.append("")  # 空行
            
            sentence_idx += 1
    else:
        # 文が足りない場合は空行で埋める
        for _ in range(para_line_count):
            japanese_lines.append("")
            japanese_lines.append("")

# 出力（英文の行数に合わせる）
output_lines = []
for i in range(len(english_lines)):
    if i < len(japanese_lines):
        output_lines.append(japanese_lines[i])
    else:
        output_lines.append("")

# ファイルに書き出し
with open(output_path, 'w', encoding='utf-8') as f:
    for line in output_lines:
        f.write(line + '\n')

print(f"\n生成完了!")
print(f"出力行数: {len(output_lines)}")
print(f"出力先: {output_path}")
print(f"\n最初の20行を確認:")
for i in range(min(20, len(output_lines))):
    eng = english_lines[i][:40] + "..." if len(english_lines[i]) > 40 else english_lines[i]
    jpn = output_lines[i][:40] + "..." if len(output_lines[i]) > 40 else output_lines[i]
    print(f"{i+1:3d}. EN: {eng:45s} JA: {jpn}")
