#!/usr/bin/env python3
"""
DeepL無料APIを使って英文パッセージを行ごとに日本語に翻訳する。
DeepL API Key不要の代替手段として、deep-translator（Google Translate）を使用。
"""

import sys

def translate_passage_line_by_line():
    """英文パッセージを行ごとに翻訳"""
    
    try:
        from deep_translator import GoogleTranslator
        print("✓ deep-translator ライブラリが利用可能です")
    except ImportError:
        print("⚠ deep-translatorがインストールされていません")
        print("インストールコマンド: pip3 install deep-translator")
        print("\nまたは、手動で翻訳する方法:")
        print("1. https://www.deepl.com/translator を開く")
        print("2. 英文ファイルの内容をコピー")
        print("3. DeepLで翻訳")
        print("4. 翻訳結果をファイルに保存")
        sys.exit(1)
    
    # ファイルパス
    english_file = "public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt"
    output_phrase_file = "public/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions-ja-phrases.txt"
    output_full_file = "public/data/passages-translations/advanced-family-gathering-ja.txt"
    
    # 英文を読み込む
    print(f"\n英文ファイルを読み込み中: {english_file}")
    with open(english_file, 'r', encoding='utf-8') as f:
        english_lines = f.readlines()
    
    print(f"総行数: {len(english_lines)}")
    
    # 翻訳器を初期化
    translator = GoogleTranslator(source='en', target='ja')
    
    # バッチサイズ（一度に翻訳する行数）
    batch_size = 50
    all_translations = []
    
    print("\n翻訳を開始します...")
    print("=" * 80)
    
    # 行ごとに翻訳
    for i, line in enumerate(english_lines, 1):
        stripped = line.strip()
        
        # 空行はそのまま保持
        if not stripped:
            all_translations.append("")
            continue
        
        try:
            # Google翻訳で翻訳
            translation = translator.translate(stripped)
            all_translations.append(translation)
            
            # 進捗を表示（50行ごと）
            if i % 50 == 0:
                print(f"  進捗: {i}/{len(english_lines)} 行完了 ({i*100//len(english_lines)}%)")
            
        except Exception as e:
            print(f"  ✗ 行 {i} でエラー: {e}")
            # エラーの場合は元の英文をそのまま使う
            all_translations.append(stripped)
    
    print("\n" + "=" * 80)
    print("翻訳完了！")
    
    # 行ごとフレーズ訳ファイルに保存
    print(f"\n行ごとフレーズ訳を保存中: {output_phrase_file}")
    with open(output_phrase_file, 'w', encoding='utf-8') as f:
        for line in all_translations:
            f.write(line + '\n')
    
    # 全訳ファイル用に段落形式に整形
    print(f"全訳ファイル（段落形式）を保存中: {output_full_file}")
    
    # 空行を段落区切りとして段落形式に変換
    paragraphs = []
    current_paragraph = []
    
    for line in all_translations:
        if line.strip():
            current_paragraph.append(line.strip())
        else:
            if current_paragraph:
                paragraphs.append(''.join(current_paragraph))
                current_paragraph = []
    
    if current_paragraph:
        paragraphs.append(''.join(current_paragraph))
    
    with open(output_full_file, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(paragraphs))
    
    print("\n" + "=" * 80)
    print("すべての処理が完了しました！")
    print("=" * 80)
    print(f"\n生成されたファイル:")
    print(f"1. 行ごとフレーズ訳: {output_phrase_file}")
    print(f"   - 総行数: {len(all_translations)}")
    print(f"2. 全訳（段落形式）: {output_full_file}")
    print(f"   - 段落数: {len(paragraphs)}")

if __name__ == "__main__":
    translate_passage_line_by_line()
