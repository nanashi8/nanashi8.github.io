#!/usr/bin/env python3
"""
長文passage-learning JSONファイルに以下を追加:
1. lemma（原形） - spaCyで自動抽出
2. reading（カタカナ読み） - AI APIで生成
3. etymology（語源） - AI APIで生成
4. relatedWords（関連語） - AI APIで生成
5. relatedFields（関連分野） - AI APIで生成
6. difficulty（難易度） - 単語の難易度を推定

使用方法:
1. pip install spacy openai
2. python -m spacy download en_core_web_sm
3. export OPENAI_API_KEY="your-api-key"
4. python scripts/add_lemma_metadata.py
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import re

try:
    import spacy
except ImportError:
    print("Error: spaCy not installed. Run: pip install spacy")
    print("Then: python -m spacy download en_core_web_sm")
    sys.exit(1)

try:
    from openai import OpenAI
except ImportError:
    print("Error: OpenAI library not installed. Run: pip install openai")
    sys.exit(1)

# spaCyモデルロード
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Error: spaCy English model not found. Run: python -m spacy download en_core_web_sm")
    sys.exit(1)

# OpenAI API設定
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Warning: OPENAI_API_KEY not set. AI metadata generation will be skipped.")
    print("Only lemma extraction will be performed.")
    client = None
else:
    client = OpenAI(api_key=api_key)

def get_lemma(word: str) -> str:
    """spaCyを使って英単語の原形を取得"""
    # 記号や数字はそのまま返す
    if not word.isalpha():
        return word
    
    doc = nlp(word.lower())
    if len(doc) > 0:
        return doc[0].lemma_
    return word.lower()

def estimate_difficulty(word: str) -> str:
    """単語の難易度を推定（簡易版）"""
    # 基本単語リスト（中学レベル）
    beginner_words = {
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that',
        'be', 'have', 'do', 'say', 'go', 'get', 'make', 'know', 'think', 'see',
        'come', 'want', 'use', 'find', 'give', 'tell', 'work', 'call', 'try',
        'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other',
        'time', 'year', 'day', 'thing', 'man', 'world', 'life', 'hand', 'part'
    }
    
    lemma = get_lemma(word)
    
    # 中学レベルの基本語
    if lemma in beginner_words:
        return 'beginner'
    
    # 単語の長さで推定
    if len(word) <= 5:
        return 'beginner'
    elif len(word) <= 8:
        return 'intermediate'
    else:
        return 'advanced'

def generate_metadata_with_ai(words: List[str]) -> Dict[str, Dict[str, str]]:
    """OpenAI APIを使って複数単語のメタデータを一括生成"""
    if not client:
        return {}
    
    # バッチ処理（10単語ずつ）
    batch_size = 10
    all_metadata = {}
    
    for i in range(0, len(words), batch_size):
        batch = words[i:i+batch_size]
        
        prompt = f"""以下の英単語について、日本の中学生向けの学習用メタデータを生成してください。

単語リスト: {', '.join(batch)}

各単語について以下のJSON形式で出力してください:
{{
  "単語": {{
    "reading": "カタカナ読み（正確なアクセント位置を含む）",
    "etymology": "語源や成り立ち（中学生向けに分かりやすく、50文字以内）",
    "relatedWords": "関連する派生語や熟語（カタカナ読みと意味を含む、3つ程度）",
    "relatedFields": "関連分野（日常生活/学校・学習/自然・環境など）"
  }}
}}

例:
{{
  "gather": {{
    "reading": "ギャザー",
    "etymology": "古英語の「集める」から。ga-（一緒に）+ therian（集める）",
    "relatedWords": "gathering（集会、ギャザリング）, gatherer（収集家、ギャザラー）",
    "relatedFields": "日常生活"
  }}
}}

全ての単語について、同じ形式でJSONを生成してください。"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "あなたは英語教育の専門家です。中学生向けの学習コンテンツを作成します。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content
            
            # JSONパース
            # コードブロックを削除
            result_text = re.sub(r'```json\n?', '', result_text)
            result_text = re.sub(r'```\n?', '', result_text)
            
            batch_metadata = json.loads(result_text)
            all_metadata.update(batch_metadata)
            
            print(f"✓ Generated metadata for batch {i//batch_size + 1}: {len(batch)} words")
            
        except Exception as e:
            print(f"Warning: Failed to generate metadata for batch {i//batch_size + 1}: {e}")
            continue
    
    return all_metadata

def process_passage_file(file_path: Path, use_ai: bool = True):
    """1つのpassage JSONファイルを処理"""
    print(f"\nProcessing: {file_path.name}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # データ構造を確認（dict か list か）
    is_single_passage = isinstance(data, dict)
    passages = [data] if is_single_passage else data
    
    # 全単語を収集（重複なし）
    all_words = set()
    for passage in passages:
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                if word and word.isalpha():  # アルファベットのみ
                    all_words.add(word)
    
    print(f"  Found {len(all_words)} unique words")
    
    # AI APIでメタデータ生成
    ai_metadata = {}
    if use_ai and client:
        print(f"  Generating AI metadata...")
        ai_metadata = generate_metadata_with_ai(list(all_words))
    
    # 各segmentにメタデータ追加
    modified_count = 0
    for passage in passages:
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                meaning = segment.get('meaning', '')
                
                # 既にlemmaがある場合はスキップ
                if 'lemma' in segment:
                    continue
                
                # meaningがオブジェクトの場合、展開する
                if isinstance(meaning, dict):
                    # 既存のmeaningオブジェクトから値を取得
                    segment['lemma'] = meaning.get('word', get_lemma(word))
                    segment['reading'] = meaning.get('reading', '')
                    segment['etymology'] = meaning.get('etymology', '')
                    segment['relatedWords'] = meaning.get('relatedWords', '')
                    segment['relatedFields'] = meaning.get('category', '日常生活')
                    segment['difficulty'] = meaning.get('difficulty', estimate_difficulty(word))
                    
                    # meaningを文字列に変換（意味のみ残す）
                    segment['meaning'] = meaning.get('meaning', '')
                else:
                    # meaningが文字列の場合、新規追加
                    segment['lemma'] = get_lemma(word)
                    segment['difficulty'] = estimate_difficulty(word)
                    
                    # AI生成メタデータ追加
                    if word in ai_metadata:
                        meta = ai_metadata[word]
                        segment['reading'] = meta.get('reading', '')
                        segment['etymology'] = meta.get('etymology', '')
                        segment['relatedWords'] = meta.get('relatedWords', '')
                        segment['relatedFields'] = meta.get('relatedFields', '')
                    else:
                        # AI生成失敗時のデフォルト値
                        segment['reading'] = ''
                        segment['etymology'] = ''
                        segment['relatedWords'] = ''
                        segment['relatedFields'] = '日常生活'
                
                modified_count += 1
    
    # ファイル書き込み（元の構造を維持）
    output_data = passages[0] if is_single_passage else passages
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Updated {modified_count} segments")

def main():
    # passage-phrase-learningディレクトリ内の全JSONファイルを処理
    base_dir = Path(__file__).parent.parent / "public" / "data" / "passages-phrase-learning"
    
    if not base_dir.exists():
        print(f"Error: Directory not found: {base_dir}")
        sys.exit(1)
    
    json_files = sorted(base_dir.glob("*.json"))
    
    if not json_files:
        print(f"No JSON files found in {base_dir}")
        sys.exit(1)
    
    print(f"Found {len(json_files)} JSON files")
    
    use_ai = client is not None
    if not use_ai:
        print("\n⚠️  AI metadata generation disabled (no API key)")
        print("Only lemma and difficulty will be added\n")
    
    for json_file in json_files:
        try:
            process_passage_file(json_file, use_ai=use_ai)
        except Exception as e:
            print(f"  ✗ Error processing {json_file.name}: {e}")
            continue
    
    print("\n✅ All files processed")

if __name__ == "__main__":
    main()
