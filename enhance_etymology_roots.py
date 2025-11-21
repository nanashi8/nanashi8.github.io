#!/usr/bin/env python3
"""
語根データベースを使用して語源情報をさらに強化するスクリプト
英語初学者に役立つ一般的な語根の意味を追加する
"""

import json
import re

# 一般的な語根とその意味（英語初学者に重要）
COMMON_ROOTS = {
    # ラテン語由来の語根
    'act': '行う・動く',
    'aqu': '水',
    'aud': '聞く',
    'bene': '良い',
    'bio': '生命',
    'ced': '行く',
    'cede': '行く・譲る',
    'ceed': '行く・進む',
    'cess': '行く',
    'ceive': '取る・受け取る',
    'cept': '取る',
    'chron': '時間',
    'cid': '切る・殺す',
    'cise': '切る',
    'claim': '叫ぶ・宣言する',
    'clud': '閉じる',
    'clude': '閉じる',
    'clus': '閉じる',
    'cogn': '知る',
    'cord': '心',
    'corp': '体',
    'cred': '信じる',
    'cur': '走る・流れる',
    'curs': '走る',
    'dict': '言う',
    'doc': '教える',
    'domin': '支配する',
    'duc': '導く',
    'duce': '導く',
    'duct': '導く',
    'equi': '等しい',
    'fac': '作る・する',
    'fact': '作る',
    'fer': '運ぶ',
    'fid': '信じる',
    'fin': '終わり・境界',
    'flex': '曲げる',
    'flect': '曲げる',
    'form': '形',
    'fort': '強い',
    'fract': '壊す',
    'frag': '壊す',
    'gen': '生む・種類',
    'geo': '地球',
    'grad': '歩く・段階',
    'graph': '書く',
    'gress': '歩く',
    'ject': '投げる',
    'join': '結ぶ',
    'junct': '結ぶ',
    'jur': '法・誓う',
    'labor': '働く',
    'leg': '法・読む',
    'liber': '自由',
    'loc': '場所',
    'log': '言葉・学問',
    'loqu': '話す',
    'luc': '光',
    'man': '手',
    'mand': '命じる',
    'mar': '海',
    'mater': '母',
    'meter': '測る',
    'migr': '移動する',
    'miss': '送る',
    'mit': '送る',
    'mob': '動く',
    'mort': '死',
    'mot': '動く',
    'mov': '動く',
    'nat': '生まれる',
    'nav': '船',
    'nom': '名前',
    'nov': '新しい',
    'oper': '働く',
    'path': '感じる・病気',
    'pater': '父',
    'ped': '足',
    'pel': '押す・駆る',
    'pend': '掛ける・払う',
    'pens': '掛ける・払う',
    'phil': '愛する',
    'phon': '音',
    'photo': '光',
    'plic': '折る',
    'pon': '置く',
    'pop': '人々',
    'port': '運ぶ',
    'pos': '置く',
    'press': '押す',
    'prim': '最初',
    'psych': '心・精神',
    'pub': '人々',
    'puls': '押す',
    'quire': '求める',
    'quest': '求める',
    'reg': '支配する',
    'rupt': '壊す',
    'scrib': '書く',
    'script': '書く',
    'sect': '切る',
    'sequ': '従う',
    'serv': '保つ・仕える',
    'sign': '印・合図',
    'simil': '似ている',
    'sist': '立つ',
    'soc': '仲間',
    'solv': '解く',
    'son': '音',
    'spec': '見る',
    'spect': '見る',
    'spir': '息・精神',
    'sta': '立つ',
    'stat': '立つ',
    'stinct': '刺す',
    'struct': '建てる',
    'tact': '触れる',
    'tain': '保つ',
    'tech': '技術',
    'tend': '伸ばす',
    'tens': '伸ばす',
    'terr': '地・土',
    'test': '証言する',
    'therm': '熱',
    'tort': 'ねじる',
    'tract': '引く',
    'typ': '型',
    'urb': '都市',
    'vac': '空',
    'val': '強い・価値',
    'ven': '来る',
    'vent': '来る',
    'ver': '真実',
    'vers': '回す',
    'vert': '回す',
    'vid': '見る',
    'vis': '見る',
    'vit': '生命',
    'viv': '生きる',
    'voc': '声・呼ぶ',
    'vol': '意志',
    'volv': '回す',
}

# ギリシャ語由来の語根
GREEK_ROOTS = {
    'anthrop': '人間',
    'arch': '支配・古代',
    'auto': '自己',
    'bio': '生命',
    'chron': '時間',
    'cracy': '支配',
    'dem': '人々',
    'derm': '皮膚',
    'dox': '意見',
    'dyn': '力',
    'graph': '書く',
    'gram': '書かれたもの',
    'hydro': '水',
    'log': '言葉・学問',
    'meter': '測る',
    'micro': '小さい',
    'morph': '形',
    'path': '感情・病気',
    'phil': '愛する',
    'phob': '恐れる',
    'phon': '音',
    'photo': '光',
    'polis': '都市',
    'psych': '心・精神',
    'scope': '見る道具',
    'soph': '知恵',
    'tele': '遠い',
    'therm': '熱',
    'theo': '神',
}

# 全ての語根を統合
ALL_ROOTS = {**COMMON_ROOTS, **GREEK_ROOTS}

def find_root_in_word(word, etymology):
    """単語に含まれる語根を検出"""
    word_lower = word.lower()
    
    # 既存の語源から語根情報を抽出
    if etymology:
        # 【形態素】セクションから語根を探す
        morpheme_match = re.search(r'【形態素】.*?語根:\s*([a-z]+)（([^）]+)）', etymology)
        if morpheme_match:
            return morpheme_match.group(1), morpheme_match.group(2)
        
        # 一般的な語根パターンを探す
        for root, meaning in sorted(ALL_ROOTS.items(), key=lambda x: len(x[0]), reverse=True):
            if root in word_lower:
                return root, meaning
    
    # 単語から直接語根を検出
    for root, meaning in sorted(ALL_ROOTS.items(), key=lambda x: len(x[0]), reverse=True):
        if root in word_lower and len(root) >= 3:  # 3文字以上の語根のみ
            return root, meaning
    
    return None, None

def enhance_etymology_with_roots(etymology, word, meaning):
    """語源に語根情報を追加"""
    if not etymology:
        return etymology
    
    # すでに語根情報が含まれているかチェック
    has_detailed_root = bool(re.search(r'語根:\s*[a-z]+（', etymology))
    
    if has_detailed_root:
        # すでに詳細な語根情報がある場合はスキップ
        return etymology
    
    # 語根を検出
    root, root_meaning = find_root_in_word(word, etymology)
    
    if root and root_meaning:
        # 【形態素】セクションを探す
        morpheme_section = re.search(r'【形態素】([^。]+)', etymology)
        
        if morpheme_section:
            morpheme_text = morpheme_section.group(1)
            
            # 語根情報を更新
            if '語根:' in morpheme_text:
                # 既存の語根情報を詳細版に置き換え
                new_morpheme = re.sub(
                    r'語根:\s*[^\s]+',
                    f'語根: {root}（{root_meaning}）',
                    morpheme_text
                )
            elif '語幹:' in morpheme_text:
                # 語幹を語根に置き換え
                new_morpheme = re.sub(
                    r'語幹:\s*[^\s]+',
                    f'語根: {root}（{root_meaning}）',
                    morpheme_text
                )
            else:
                # 語根情報を追加
                parts = morpheme_text.split(' + ')
                # 接頭辞の後、接尾辞の前に語根を挿入
                if len(parts) >= 2:
                    new_morpheme = f"{parts[0]} + 語根: {root}（{root_meaning}） + {' + '.join(parts[1:])}"
                else:
                    new_morpheme = f"{morpheme_text} + 語根: {root}（{root_meaning}）"
            
            # 語源を更新
            enhanced = etymology.replace(morpheme_text, new_morpheme)
            return enhanced
    
    return etymology

def main():
    # 辞書ファイルを読み込み
    dict_path = 'public/data/reading-passages-dictionary.json'
    print(f"辞書ファイルを読み込んでいます: {dict_path}")
    
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    print(f"総単語数: {len(dictionary)}")
    
    # 語根情報を追加
    enhanced_count = 0
    
    for word_key, word_data in dictionary.items():
        word = word_data.get('word', word_key)
        etymology = word_data.get('etymology', '')
        meaning = word_data.get('meaning', '')
        
        if etymology and '【形態素】' in etymology:
            enhanced_etymology = enhance_etymology_with_roots(etymology, word, meaning)
            
            if enhanced_etymology != etymology:
                dictionary[word_key]['etymology'] = enhanced_etymology
                enhanced_count += 1
    
    print(f"\n語根情報を追加した単語数: {enhanced_count}")
    
    # バックアップを作成
    backup_path = dict_path + '.backup_before_root_enhancement'
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    print(f"バックアップを作成しました: {backup_path}")
    
    # 更新した辞書を保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f"辞書ファイルを更新しました: {dict_path}")
    
    # サンプルを表示
    print("\n=== 語根情報追加の例 ===")
    samples = ['produce', 'record', 'respect', 'construct', 'receive', 'prefer', 'describe']
    for sample_word in samples:
        for key, data in dictionary.items():
            if data.get('word', '').lower() == sample_word.lower():
                print(f"\n{data['word']}:")
                print(f"  {data['etymology']}")
                break

if __name__ == '__main__':
    main()
