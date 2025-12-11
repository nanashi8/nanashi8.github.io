#!/usr/bin/env python3
"""
GitHub Modelsを使って英文パッセージを行ごとに日本語に翻訳する。
各行の翻訳は文脈を保ちながら、元の英文の行構造を維持する。
"""

import os
import sys
import json
from openai import OpenAI

def translate_with_github_models():
    """GitHub Modelsを使って翻訳"""
    
    # GitHub Personal Access Tokenを環境変数から取得
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        print("エラー: GITHUB_TOKEN環境変数が設定されていません。")
        print("以下のコマンドで設定してください:")
        print('export GITHUB_TOKEN="your_github_personal_access_token"')
        sys.exit(1)
    
    # ファイルパス
    english_file = "public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt"
    output_phrase_file = "public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions-ja-phrases.txt"
    output_full_file = "public/data/passages-translations/advanced-family-gathering-ja.txt"
    
    # 英文を読み込む
    print("英文ファイルを読み込み中...")
    with open(english_file, 'r', encoding='utf-8') as f:
        english_lines = f.readlines()
    
    print(f"総行数: {len(english_lines)}")
    
    # GitHub Models APIクライアントを初期化
    client = OpenAI(
        base_url="https://models.inference.ai.azure.com",
        api_key=github_token
    )
    
    # バッチサイズ（一度に翻訳する行数）
    batch_size = 100
    all_translations = []
    
    print("\n翻訳を開始します...")
    print("=" * 80)
    
    # バッチごとに翻訳
    for i in range(0, len(english_lines), batch_size):
        batch = english_lines[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(english_lines) + batch_size - 1) // batch_size
        
        print(f"\nバッチ {batch_num}/{total_batches} を翻訳中... (行 {i+1}-{min(i+batch_size, len(english_lines))})")
        
        # バッチ内容を準備
        batch_text = "".join(batch)
        
        # プロンプトを作成
        prompt = f"""以下の英文を日本語に翻訳してください。

重要な注意事項:
1. 各行の意味を正確に翻訳すること
2. 空行はそのまま保つこと
3. 文脈を考慮して自然な日本語にすること
4. 会話文は日本語の会話表現に適応させること
5. 元の行構造を完全に維持すること（行数を変えないこと）
6. 翻訳結果のみを出力し、説明や注釈は不要

これは「正月の家族の集まり」についての物語です。

英文:
{batch_text}

日本語訳:"""

        try:
            # GitHub Models APIで翻訳
            response = client.chat.completions.create(
                model="gpt-4.1",  # 高品質な翻訳のためgpt-4.1を使用
                messages=[
                    {"role": "system", "content": "あなたは優秀な英日翻訳者です。文脈を考慮した正確で自然な日本語訳を提供します。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # 一貫性のある翻訳のため低めに設定
                max_tokens=4000
            )
            
            # 翻訳結果を取得
            translation = response.choices[0].message.content
            all_translations.append(translation)
            
            # 進捗を表示
            lines_in_batch = len([line for line in batch if line.strip()])
            print(f"  ✓ {lines_in_batch}行を翻訳しました")
            
        except Exception as e:
            print(f"  ✗ エラーが発生しました: {e}")
            print("  スキップして次のバッチに進みます...")
            # エラーの場合は元の英文をそのまま使う
            all_translations.append(batch_text)
    
    print("\n" + "=" * 80)
    print("翻訳完了！")
    
    # 翻訳結果を結合
    full_translation_text = "\n".join(all_translations)
    
    # 行ごとフレーズ訳ファイルに保存
    print(f"\n行ごとフレーズ訳を保存中: {output_phrase_file}")
    with open(output_phrase_file, 'w', encoding='utf-8') as f:
        f.write(full_translation_text)
    
    # 全訳ファイル用に段落形式に整形
    print(f"全訳ファイル（段落形式）を保存中: {output_full_file}")
    
    # 空行を段落区切りとして段落形式に変換
    paragraphs = []
    current_paragraph = []
    
    for line in full_translation_text.split('\n'):
        if line.strip():
            current_paragraph.append(line.strip())
        else:
            if current_paragraph:
                paragraphs.append(' '.join(current_paragraph))
                current_paragraph = []
    
    if current_paragraph:
        paragraphs.append(' '.join(current_paragraph))
    
    with open(output_full_file, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(paragraphs))
    
    print("\n" + "=" * 80)
    print("すべての処理が完了しました！")
    print("=" * 80)
    print(f"\n生成されたファイル:")
    print(f"1. 行ごとフレーズ訳: {output_phrase_file}")
    print(f"2. 全訳（段落形式）: {output_full_file}")
    print(f"\n総行数: {len(english_lines)}")
    print(f"翻訳済み行数: {len(full_translation_text.split(chr(10)))}")

if __name__ == "__main__":
    translate_with_github_models()
