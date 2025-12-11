#!/usr/bin/env python3
"""
(要確認)とマークされた単語をAIで修正するスクリプト

使用方法:
1. export OPENAI_API_KEY="your-api-key"  # オプション
2. python3 scripts/fix_unconfirmed_words.py
"""

import json
import os
from pathlib import Path

# OpenAI APIの利用可否を確認
USE_AI = False
try:
    from openai import OpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        client = OpenAI(api_key=api_key)
        USE_AI = True
        print("OpenAI API利用可能 - AIで意味を推測します")
    else:
        print("OPENAI_API_KEY未設定 - 手動修正リストを出力します")
except ImportError:
    print("openai未インストール - 手動修正リストを出力します")

def get_unconfirmed_words(dictionary_path: Path) -> dict:
    """
    辞書から(要確認)の単語を抽出
    """
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    unconfirmed = {}
    for word, data in dictionary.items():
        if data.get('meaning', '') == '(要確認)':
            unconfirmed[word] = data
    
    return unconfirmed

def find_word_contexts(word: str, passages_dir: Path) -> list:
    """
    パッセージファイルから単語の出現文脈を抽出
    """
    contexts = []
    
    for json_file in passages_dir.glob('*.json'):
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'phrases' not in data:
            continue
        
        for phrase in data['phrases']:
            if 'segments' not in phrase:
                continue
            
            # 単語が含まれているかチェック
            for segment in phrase['segments']:
                if segment.get('word', '').lower() == word.lower():
                    contexts.append({
                        'english': phrase.get('english', ''),
                        'japanese': phrase.get('japanese', ''),
                        'file': json_file.name
                    })
                    break
            
            if len(contexts) >= 5:
                break
        
        if len(contexts) >= 5:
            break
    
    return contexts

def infer_meaning_with_ai(word: str, contexts: list) -> str:
    """
    AIで文脈から意味を推測
    """
    if not contexts:
        return "(推測不可)"
    
    # プロンプト作成
    prompt = f"""以下の英文とその日本語訳から、単語「{word}」の意味を推測してください。

単語: {word}

出現例:
"""
    for i, ctx in enumerate(contexts[:5], 1):
        prompt += f"\n{i}. 英文: {ctx['english']}\n   和訳: {ctx['japanese']}\n"
    
    prompt += """
回答形式:
- 一般名詞・動詞・形容詞の場合: 簡潔な日本語の意味（例: "保証する", "新鮮な", "品質"）
- 固有名詞の場合: カタカナまたは漢字表記（例: "グリーンリーフカフェ", "東京"）

意味のみを1行で回答してください。説明は不要です。"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたは英語教育の専門家です。文脈から単語の意味を正確に推測します。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=100
        )
        
        meaning = response.choices[0].message.content.strip()
        # 余計な記号を除去
        meaning = meaning.replace('"', '').replace("'", '')
        return meaning
        
    except Exception as e:
        print(f"  AIエラー ({word}): {e}")
        return "(推測不可)"

def update_dictionary_with_ai(dictionary_path: Path, unconfirmed: dict, passages_dir: Path):
    """
    AIで(要確認)を修正
    """
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated_count = 0
    
    for word, data in unconfirmed.items():
        print(f"\n処理中: {word}")
        
        # 文脈を取得
        contexts = find_word_contexts(word, passages_dir)
        
        if not contexts:
            print(f"  → 出現例が見つかりません")
            continue
        
        print(f"  出現例: {len(contexts)}件")
        
        # AIで意味を推測
        meaning = infer_meaning_with_ai(word, contexts)
        
        if meaning == "(推測不可)":
            print(f"  → 推測できませんでした")
            continue
        
        # 辞書を更新
        dictionary[word]['meaning'] = meaning
        updated_count += 1
        print(f"  → {meaning}")
    
    # 辞書を保存
    with open(dictionary_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    return updated_count

def output_manual_fix_list(unconfirmed: dict, passages_dir: Path, output_path: Path):
    """
    手動修正用のリストを出力
    """
    manual_fix_data = []
    
    for word, data in list(unconfirmed.items())[:50]:  # 最初の50個
        contexts = find_word_contexts(word, passages_dir)
        
        manual_fix_data.append({
            'word': word,
            'passages': data.get('passages', []),
            'contexts': contexts[:3]  # 最大3個の例
        })
    
    # Markdown形式で出力
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# 要確認単語の手動修正リスト\n\n")
        f.write(f"合計: {len(unconfirmed)}個\n\n")
        f.write("以下は上位50個の単語です。\n\n")
        
        for item in manual_fix_data:
            f.write(f"## {item['word']}\n\n")
            f.write(f"**出現パッセージ**: {', '.join(item['passages'][:5])}\n\n")
            f.write("**出現例**:\n\n")
            
            for i, ctx in enumerate(item['contexts'], 1):
                f.write(f"{i}. 英文: {ctx['english']}\n")
                f.write(f"   和訳: {ctx['japanese']}\n\n")
            
            f.write("**推測される意味**: _____________\n\n")
            f.write("---\n\n")
    
    print(f"\n手動修正リストを出力しました: {output_path}")

def main():
    base_dir = Path(__file__).parent.parent
    dictionary_path = base_dir / 'public' / 'data' / 'dictionaries' / 'reading-passages-dictionary.json'
    passages_dir = base_dir / 'public' / 'data' / 'passages-phrase-learning'
    
    print("(要確認)の単語を抽出中...")
    unconfirmed = get_unconfirmed_words(dictionary_path)
    
    print(f"\n(要確認)の単語: {len(unconfirmed)}個")
    
    if USE_AI:
        print("\nAIで意味を推測中...")
        updated = update_dictionary_with_ai(dictionary_path, unconfirmed, passages_dir)
        print(f"\n更新完了: {updated}個")
        
        # 残りの要確認を確認
        remaining = get_unconfirmed_words(dictionary_path)
        if remaining:
            print(f"\n残り(要確認): {len(remaining)}個")
            output_path = base_dir / 'scripts' / 'output' / 'unconfirmed_words_manual.md'
            output_path.parent.mkdir(exist_ok=True)
            output_manual_fix_list(remaining, passages_dir, output_path)
    else:
        # 手動修正用リストを出力
        output_path = base_dir / 'scripts' / 'output' / 'unconfirmed_words_manual.md'
        output_path.parent.mkdir(exist_ok=True)
        output_manual_fix_list(unconfirmed, passages_dir, output_path)

if __name__ == '__main__':
    main()
