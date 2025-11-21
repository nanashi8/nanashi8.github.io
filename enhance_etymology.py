#!/usr/bin/env python3
"""
語源情報を強化するスクリプト
reading-passages-dictionary.json の各単語に対して、
語幹、語根、接頭辞、接尾辞などの形態素情報を追加する
"""

import json
import re
from collections import defaultdict

# 一般的な接頭辞と意味
COMMON_PREFIXES = {
    'un': '否定（〜でない）',
    're': '再び・戻って',
    'dis': '否定・反対・分離',
    'pre': '前に・事前に',
    'post': '後に',
    'mis': '誤って・悪く',
    'over': '過度に・超えて',
    'under': '不足・下に',
    'sub': '下・副',
    'super': '超・上',
    'anti': '反対・対抗',
    'de': '除去・反対・下降',
    'ex': '外へ・元',
    'in': '中へ・否定',
    'im': '中へ・否定',
    'inter': '間・相互',
    'trans': '横切って・超えて',
    'co': '共に',
    'con': '共に',
    'com': '共に',
    'auto': '自己・自動',
    'bi': '二つ',
    'tri': '三つ',
    'multi': '多数',
    'mono': '単一',
    'semi': '半分',
    'fore': '前',
    'mid': '中間',
    'out': '外・超える',
    'up': '上へ',
    'down': '下へ',
    'counter': '反対・対抗',
    'mal': '悪い',
    'non': '非・不',
    'pro': '前へ・賛成',
}

# 一般的な接尾辞と意味
COMMON_SUFFIXES = {
    'ation': '名詞化（行為・状態）',
    'tion': '名詞化（行為・状態）',
    'sion': '名詞化（行為・状態）',
    'ance': '名詞化（状態・行為）',
    'ence': '名詞化（状態・行為）',
    'ment': '名詞化（行為・状態）',
    'ness': '名詞化（〜さ・〜性）',
    'ity': '名詞化（性質・状態）',
    'ty': '名詞化（性質）',
    'ship': '名詞化（状態・関係）',
    'hood': '名詞化（状態・期間）',
    'dom': '名詞化（領域・状態）',
    'age': '名詞化（行為・状態）',
    'ical': '形容詞化（性質）',
    'able': '形容詞化（可能）',
    'ible': '形容詞化（可能）',
    'ious': '形容詞化（性質）',
    'ous': '形容詞化（性質）',
    'ive': '形容詞化（傾向）',
    'al': '形容詞化（関連）',
    'ic': '形容詞化（性質）',
    'ful': '形容詞化（満ちた）',
    'less': '形容詞化（欠如）',
    'ant': '形容詞・名詞（〜する）',
    'ent': '形容詞・名詞（〜する）',
    'ary': '形容詞化（関連）',
    'ory': '形容詞化（関連）',
    'ize': '動詞化（〜化する）',
    'ise': '動詞化（〜化する）',
    'ify': '動詞化（〜化する）',
    'ate': '動詞化・形容詞化',
    'en': '動詞化（〜にする）',
    'ly': '副詞化（〜に・〜く）',
    'ing': '現在分詞・動名詞',
    'ed': '過去形・過去分詞',
    'y': '形容詞化（性質）',
    'er': '人・もの（〜する人）',
    'or': '人・もの（〜する人）',
    'ist': '人（〜する人・主義者）',
    'ian': '人（〜の専門家）',
}

def detect_morphemes(word):
    """単語から形態素（接頭辞・接尾辞・語幹）を検出"""
    word_lower = word.lower()
    prefix = None
    suffix = None
    stem = word_lower
    
    # 接頭辞の検出
    for pref in sorted(COMMON_PREFIXES.keys(), key=len, reverse=True):
        if word_lower.startswith(pref) and len(word_lower) > len(pref) + 2:
            prefix = pref
            stem = word_lower[len(pref):]
            break
    
    # 接尾辞の検出（長い順に確認）
    for suff in sorted(COMMON_SUFFIXES.keys(), key=len, reverse=True):
        if stem.endswith(suff) and len(stem) > len(suff) + 2:
            suffix = suff
            if prefix:
                stem = stem[:-len(suff)]
            else:
                stem = word_lower[:-len(suff)]
            break
    
    return prefix, suffix, stem

def get_stem_for_etymology(word, meaning):
    """語源説明に使う語幹を推測"""
    prefix, suffix, stem = detect_morphemes(word)
    
    # 特定のパターンで語幹を調整
    word_lower = word.lower()
    
    # 一般的な動詞の語幹
    common_verbs = {
        'require': 'quire（求める）',
        'produce': 'duce（導く）',
        'reduce': 'duce（導く）',
        'introduce': 'duce（導く）',
        'conduct': 'duct（導く）',
        'construct': 'struct（建てる）',
        'instruct': 'struct（建てる）',
        'destroy': 'stroy（破壊する）',
        'present': 'sent（存在する）',
        'absent': 'sent（存在する）',
        'record': 'cord（心）',
        'accord': 'cord（心）',
        'discord': 'cord（心）',
        'respect': 'spect（見る）',
        'inspect': 'spect（見る）',
        'expect': 'spect（見る）',
        'suspect': 'spect（見る）',
        'receive': 'ceive（取る）',
        'perceive': 'ceive（取る）',
        'conceive': 'ceive（取る）',
        'contain': 'tain（保つ）',
        'maintain': 'tain（保つ）',
        'obtain': 'tain（保つ）',
        'sustain': 'tain（保つ）',
        'prefer': 'fer（運ぶ）',
        'refer': 'fer（運ぶ）',
        'transfer': 'fer（運ぶ）',
        'differ': 'fer（運ぶ）',
        'permit': 'mit（送る）',
        'submit': 'mit（送る）',
        'commit': 'mit（送る）',
        'admit': 'mit（送る）',
        'describe': 'scribe（書く）',
        'prescribe': 'scribe（書く）',
        'inscribe': 'scribe（書く）',
        'subscribe': 'scribe（書く）',
    }
    
    if word_lower in common_verbs:
        return common_verbs[word_lower]
    
    return stem

def enhance_etymology(word, current_etymology, meaning):
    """語源情報を強化"""
    prefix, suffix, stem = detect_morphemes(word)
    
    # 現在の語源が空でない場合、追記する形で強化
    enhanced = current_etymology.strip()
    
    # 形態素情報がすでに含まれているかチェック
    has_prefix_info = bool(re.search(r'接頭辞|prefix|^[a-z]+-\(', enhanced.lower()))
    has_suffix_info = bool(re.search(r'接尾辞|suffix|-[a-z]+\(', enhanced.lower()))
    has_morpheme_info = bool(re.search(r'語根|語幹|root|stem', enhanced.lower()))
    
    # 形態素情報を追加
    morpheme_parts = []
    
    if prefix and not has_prefix_info:
        morpheme_parts.append(f"{prefix}-（{COMMON_PREFIXES[prefix]}）")
    
    if stem and not has_morpheme_info:
        stem_meaning = get_stem_for_etymology(word, meaning)
        if stem_meaning != stem:
            morpheme_parts.append(f"語根: {stem_meaning}")
        else:
            morpheme_parts.append(f"語幹: {stem}")
    
    if suffix and not has_suffix_info:
        morpheme_parts.append(f"-{suffix}（{COMMON_SUFFIXES[suffix]}）")
    
    # 既存の語源がある場合は追記、ない場合は新規作成
    if morpheme_parts:
        morpheme_info = " + ".join(morpheme_parts)
        
        if enhanced:
            # 既存の語源に形態素情報を追加
            # 既に「←」や「。」がある場合はその前に追加
            if '。' in enhanced:
                parts = enhanced.split('。', 1)
                enhanced = f"{parts[0]}。【形態素】{morpheme_info}。{parts[1]}" if len(parts) > 1 else f"{parts[0]}。【形態素】{morpheme_info}"
            elif '←' in enhanced:
                parts = enhanced.split('←', 1)
                enhanced = f"{parts[0]} ← {parts[1]}。【形態素】{morpheme_info}"
            else:
                enhanced = f"{enhanced}。【形態素】{morpheme_info}"
        else:
            # 語源が空の場合は形態素情報のみ
            enhanced = f"【形態素】{morpheme_info}"
    
    return enhanced

def main():
    # 分析結果を読み込み
    analysis_file = 'etymology_enhancement_needed.json'
    
    print(f"分析結果を読み込んでいます: {analysis_file}")
    try:
        with open(analysis_file, 'r', encoding='utf-8') as f:
            analysis = json.load(f)
    except FileNotFoundError:
        print(f"エラー: {analysis_file} が見つかりません。")
        print("まず analyze_etymology_gaps.py を実行してください。")
        return
    
    words_to_enhance = analysis['words_needing_enhancement']
    print(f"強化対象の単語数: {len(words_to_enhance)}")
    
    # 辞書ファイルを読み込み
    dict_path = 'public/data/reading-passages-dictionary.json'
    print(f"辞書ファイルを読み込んでいます: {dict_path}")
    
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    # 語源情報を強化
    enhanced_count = 0
    
    for item in words_to_enhance:
        word = item['word']
        
        # 辞書から単語データを検索（大文字小文字を区別しない）
        word_key = None
        for key in dictionary.keys():
            if dictionary[key].get('word', '').lower() == word.lower():
                word_key = key
                break
        
        if word_key:
            word_data = dictionary[word_key]
            current_etymology = word_data.get('etymology', '')
            meaning = word_data.get('meaning', '')
            
            # 語源を強化
            enhanced_etymology = enhance_etymology(word, current_etymology, meaning)
            
            # 更新
            if enhanced_etymology != current_etymology:
                dictionary[word_key]['etymology'] = enhanced_etymology
                enhanced_count += 1
    
    print(f"\n強化された単語数: {enhanced_count}")
    
    # バックアップを作成
    backup_path = dict_path + '.backup_before_etymology_enhancement'
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    print(f"バックアップを作成しました: {backup_path}")
    
    # 更新した辞書を保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f"辞書ファイルを更新しました: {dict_path}")
    
    # サンプルを表示
    print("\n=== 更新例（最初の10件） ===")
    count = 0
    for item in words_to_enhance[:10]:
        word = item['word']
        for key in dictionary.keys():
            if dictionary[key].get('word', '').lower() == word.lower():
                print(f"\n{word}:")
                print(f"  変更前: {item['current_etymology']}")
                print(f"  変更後: {dictionary[key]['etymology']}")
                count += 1
                break
        if count >= 10:
            break

if __name__ == '__main__':
    main()
