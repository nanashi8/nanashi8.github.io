#!/usr/bin/env python3
"""
改行済みパッセージファイルからフレーズ学習用JSONを生成するスクリプト

使用例:
    python3 convert_preformatted_to_json.py \
        --passage public/data/passages/intermediate-exchange-student-australia.txt \
        --translation public/data/passages-translations/intermediate-exchange-student-australia-ja.txt \
        --dictionary public/data/dictionaries/reading-passages-dictionary.json \
        --output public/data/passages-phrase-learning/intermediate-exchange-student-australia.json \
        --level intermediate \
        --theme "文化交流・学校生活"
"""

import json
import re
import argparse
from pathlib import Path


def load_dictionary(filepath):
    """辞書JSON読み込み"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def split_long_sentence(sentence):
    """20語を超える文を接続詞・関係詞・前置詞句で分割"""
    words = sentence.split()
    if len(words) <= 20:
        return [sentence]
    
    # 分割候補のパターン（優先度順）
    
    # 1. 従属接続詞（最優先）
    subordinating_conjunctions = [
        'when', 'because', 'although', 'while', 'since',
        'after', 'before', 'unless', 'until', 'if', 'though', 
        'whereas', 'whenever', 'wherever'
    ]
    
    # 2. 関係詞
    relative_pronouns = ['which', 'who', 'that', 'where', 'whose', 'whom']
    
    # 3. 前置詞（句の開始位置として）
    prepositions = [
        'with', 'without', 'by', 'during', 'through', 'throughout',
        'among', 'between', 'within', 'beyond', 'despite', 'regarding',
        'concerning', 'including', 'excluding', 'except', 'besides'
    ]
    
    # 全候補リスト
    all_split_points = subordinating_conjunctions + relative_pronouns + prepositions
    
    # 分割を試みる
    for keyword in all_split_points:
        # 大文字小文字を区別しないパターン（単語境界で）
        pattern = r'\b' + keyword + r'\b'
        match = re.search(pattern, sentence, re.IGNORECASE)
        
        if match:
            split_pos = match.start()
            # キーワードの前で分割（キーワードは後半に含める）
            before = sentence[:split_pos].rstrip(' ,')
            after = sentence[split_pos:].strip()
            
            # 分割後の各部分の語数をチェック
            before_words = len(before.split())
            after_words = len(after.split())
            
            # 前半が5語以上、後半が3語以上なら分割
            if before_words >= 5 and after_words >= 3:
                # 前半末尾にカンマがない場合は追加
                if not before.endswith(','):
                    before += ','
                return [before, after]
    
    # 分割できない場合はそのまま返す
    return [sentence]


def load_phrases_from_preformatted_file(filepath):
    """ファイルを読み込み、文単位で分割し、長文は節・句で分割"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    phrases = []
    
    # 段落ごとに処理
    paragraphs = content.split('\n\n')
    
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        
        if not paragraph:
            continue
        
        # 見出し（末尾が — の行）をスキップ
        if paragraph.endswith('—'):
            continue
        
        # セクション見出しをスキップ
        if paragraph.endswith(':') and len(paragraph.split()) <= 5:
            continue
        
        # 文ごとに分割（.!?で区切る）
        sentences = re.split(r'(?<=[.!?])\s+', paragraph)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # 20語を超える文は分割
            word_count = len(sentence.split())
            if word_count > 20:
                split_phrases = split_long_sentence(sentence)
                phrases.extend(split_phrases)
            else:
                phrases.append(sentence)
    
    return phrases


def load_japanese_phrases(filepath):
    """全訳ファイルから日本語フレーズを読み込み（英文と同じ分割ルール）"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    japanese_phrases = []
    
    # 段落ごとに処理
    paragraphs = content.split('\n\n')
    
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        
        if not paragraph:
            continue
        
        # 見出し（末尾が — の行）をスキップ
        if paragraph.endswith('—'):
            continue
        
        # セクション見出しをスキップ
        if paragraph.endswith(':') and len(paragraph) <= 30:
            continue
        
        # 日本語の文区切り（。！？）で分割
        sentences = re.split(r'([。！？])', paragraph)
        
        # 句読点を前の文に結合
        combined_sentences = []
        i = 0
        while i < len(sentences):
            if sentences[i].strip():
                sentence = sentences[i]
                # 次が句読点なら結合
                if i + 1 < len(sentences) and sentences[i + 1] in '。！？':
                    sentence += sentences[i + 1]
                    i += 2
                else:
                    i += 1
                combined_sentences.append(sentence.strip())
            else:
                i += 1
        
        japanese_phrases.extend(combined_sentences)
    
    return japanese_phrases


def create_segments_from_phrase(phrase, dictionary):
    """フレーズを単語セグメントに分解"""
    # 句読点を分離してトークン化
    words = re.findall(r"\w+(?:'\w+)?|[.,!?;:—\"']", phrase)
    
    segments = []
    for word in words:
        # 句読点はそのまま追加
        if word in ".,!?;:—\"'":
            segments.append({
                "word": word,
                "meaning": "",
                "isUnknown": False
            })
            continue
        
        # 単語の意味を辞書から検索
        clean_word = word.lower()
        meaning = dictionary.get(clean_word, "")
        
        segments.append({
            "word": word,
            "meaning": meaning,
            "isUnknown": False
        })
    
    return segments


def detect_grammar_point(phrase):
    """フレーズから文法ポイントを検出（簡易版）"""
    grammar_points = []
    
    # 接続詞
    if re.search(r'\b(when|if|because|although|while|since)\b', phrase, re.I):
        conjunctions = re.findall(r'\b(when|if|because|although|while|since)\b', phrase, re.I)
        grammar_points.append(f"{'/'.join(set([c.capitalize() for c in conjunctions]))}節")
    
    # that節
    if re.search(r'\bthat\b', phrase, re.I):
        grammar_points.append("that節")
    
    # 受動態
    if re.search(r'\b(is|are|was|were|been)\s+\w+ed\b', phrase, re.I):
        grammar_points.append("受動態")
    
    # 現在完了
    if re.search(r'\b(have|has)\s+\w+ed\b', phrase, re.I):
        grammar_points.append("現在完了")
    
    return " / ".join(grammar_points) if grammar_points else None


def convert_preformatted_to_json(passage_file, translation_file, dictionary_file, 
                                  output_file, level, theme):
    """改行済みファイルから直接JSON生成"""
    
    print(f"📖 読み込み中...")
    print(f"  英文: {passage_file}")
    print(f"  全訳: {translation_file}")
    print(f"  辞書: {dictionary_file}")
    
    # 読み込み
    english_phrases = load_phrases_from_preformatted_file(passage_file)
    dictionary = load_dictionary(dictionary_file)
    japanese_phrases = load_japanese_phrases(translation_file)
    
    # タイトル抽出（最初の行）
    with open(passage_file, 'r', encoding='utf-8') as f:
        first_line = f.readline().strip()
    
    # パッセージID抽出（ファイル名から）
    passage_id = Path(passage_file).stem
    
    print(f"\n📊 フレーズ数:")
    print(f"  英語: {len(english_phrases)} フレーズ")
    print(f"  日本語: {len(japanese_phrases)} フレーズ")
    
    if len(english_phrases) != len(japanese_phrases):
        print(f"\n⚠️  警告: フレーズ数が一致しません！")
        print(f"  不足分は手動で調整が必要です")
    
    # フレーズデータ作成
    print(f"\n🔧 フレーズJSON生成中...")
    phrases_data = []
    
    for i, (en, ja) in enumerate(zip(english_phrases, japanese_phrases), 1):
        segments = create_segments_from_phrase(en, dictionary)
        grammar_point = detect_grammar_point(en)
        
        phrase_obj = {
            "id": i,
            "english": en,
            "japanese": ja,
            "phraseMeaning": ja,
            "segments": segments
        }
        
        # 文法ポイントがあれば追加
        if grammar_point:
            phrase_obj["grammarPoint"] = grammar_point
        
        phrases_data.append(phrase_obj)
        
        if i % 10 == 0:
            print(f"  {i}/{len(english_phrases)} フレーズ処理完了")
    
    # 総単語数計算（句読点除く）
    total_words = sum(
        len([s for s in p["segments"] if s["word"] not in ".,!?;:—\"'"])
        for p in phrases_data
    )
    
    # JSON出力
    passage_data = {
        "id": passage_id,
        "title": first_line.replace('—', ' - '),
        "level": level,
        "theme": theme,
        "actualWordCount": total_words,
        "phrases": phrases_data
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(passage_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 生成完了!")
    print(f"  出力: {output_file}")
    print(f"  フレーズ数: {len(phrases_data)}")
    print(f"  総単語数: {total_words}")
    
    # 辞書未登録単語の確認
    missing_words = set()
    for phrase in phrases_data:
        for segment in phrase["segments"]:
            word = segment["word"]
            if word not in ".,!?;:—\"'" and not segment["meaning"]:
                missing_words.add(word.lower())
    
    if missing_words:
        print(f"\n⚠️  辞書未登録単語: {len(missing_words)}語")
        print(f"  {', '.join(sorted(list(missing_words))[:10])}...")
    
    return passage_data


def main():
    parser = argparse.ArgumentParser(
        description='改行済みパッセージファイルからフレーズ学習用JSONを生成'
    )
    parser.add_argument('--passage', required=True, help='英文パッセージファイル(.txt)')
    parser.add_argument('--translation', required=True, help='全訳ファイル(.txt)')
    parser.add_argument('--dictionary', required=True, help='単語辞書(.json)')
    parser.add_argument('--output', required=True, help='出力JSONファイル')
    parser.add_argument('--level', required=True, choices=['beginner', 'intermediate', 'advanced'], 
                       help='難易度レベル')
    parser.add_argument('--theme', default='', help='テーマ（任意）')
    
    args = parser.parse_args()
    
    convert_preformatted_to_json(
        args.passage,
        args.translation,
        args.dictionary,
        args.output,
        args.level,
        args.theme
    )


if __name__ == '__main__':
    main()
