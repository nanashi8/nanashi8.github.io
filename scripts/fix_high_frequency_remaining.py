#!/usr/bin/env python3
"""
残りの高頻度単語(5回以上)を修正

手動で作成した辞書を使用して、頻出する(要確認)単語を修正します。
"""

import json
from pathlib import Path

# 高頻度単語の辞書（5回以上出現）
HIGH_FREQUENCY_DICT = {
    # 動詞の過去形・派生形
    'wondered': '不思議に思った',
    'warned': '警告した',
    'fascinated': '魅了された',
    'frozen': '凍った・凍結した',
    'predict': '予測する',
    'restore': '復元する・回復する',
    
    # 名詞
    'rejection': '拒絶・却下',
    'calculations': '計算',
    'dinosaur': '恐竜',
    'observation': '観察',
    'cricket': 'クリケット・コオロギ',
    'kids': '子供たち',
    'attitudes': '態度・姿勢',
    'men': '男性たち',
    'amounts': '量・金額',
    'artifacts': '遺物・工芸品',
    'expectations': '期待',
    'circumstances': '状況・事情',
    'shift': '変化・シフト',
    'expectancy': '期待・予想',
    'layer': '層',
    
    # 形容詞
    'electrical': '電気の',
    'immediate': '即座の・直接の',
    'atmospheric': '大気の・雰囲気の',
    'persistent': '持続的な・根気強い',
    'lower': 'より低い',
    
    # 名詞（抽象）
    'estimate': '推定・見積もり',
    'decline': '減少・衰退',
    'warmth': '暖かさ',
    
    # その他
    'exceeding': '超える',
    
    # 固有名詞
    'Sachiko': '幸子（人名）',
}

def update_dictionary():
    """辞書ファイルを更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = 0
    for word, meaning in HIGH_FREQUENCY_DICT.items():
        if word in dictionary and dictionary[word].get('meaning') == '(要確認)':
            dictionary[word]['meaning'] = meaning
            dictionary[word]['source'] = 'high-frequency-manual'
            updated += 1
    
    # 保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f'📚 辞書更新: {updated}語')
    return updated

def update_passage_files():
    """全パッセージファイルを更新"""
    passages_dir = Path('public/data/passages-phrase-learning')
    total_updates = 0
    file_count = 0
    
    for passage_file in sorted(passages_dir.glob('*.json')):
        with open(passage_file, encoding='utf-8') as f:
            data = json.load(f)
        
        file_updates = 0
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '')
                
                if segment.get('meaning') == '(要確認)' and word in HIGH_FREQUENCY_DICT:
                    segment['meaning'] = HIGH_FREQUENCY_DICT[word]
                    file_updates += 1
        
        if file_updates > 0:
            # 保存
            with open(passage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            total_updates += file_updates
            file_count += 1
            print(f'  ✅ {passage_file.name}: {file_updates}箇所')
    
    print(f'\n📄 パッセージ更新: {file_count}ファイル, {total_updates}箇所')
    return total_updates

def analyze_remaining():
    """残りの(要確認)を分析"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    total = len(dictionary)
    confirmed = sum(1 for word_entry in dictionary.values() if word_entry.get('meaning') != '(要確認)')
    unconfirmed = total - confirmed
    
    print(f'\n📊 辞書の状態:')
    print(f'  総単語数: {total}語')
    print(f'  意味確定: {confirmed}語 ({confirmed/total*100:.1f}%)')
    print(f'  (要確認): {unconfirmed}語 ({unconfirmed/total*100:.1f}%)')
    
    # パッセージの状態
    passages_dir = Path('public/data/passages-phrase-learning')
    unconfirmed_count = 0
    
    for f in passages_dir.glob('*.json'):
        data = json.load(open(f, encoding='utf-8'))
        for p in data.get('phrases', []):
            for s in p.get('segments', []):
                if s.get('meaning', '') == '(要確認)':
                    unconfirmed_count += 1
    
    print(f'\n📄 パッセージの状態:')
    print(f'  (要確認)箇所: {unconfirmed_count}箇所')

def main():
    print('=' * 60)
    print('高頻度単語(5回以上)を修正')
    print('=' * 60)
    print()
    
    print(f'対象: {len(HIGH_FREQUENCY_DICT)}語\n')
    
    # 辞書を更新
    dict_updates = update_dictionary()
    print()
    
    # パッセージファイルを更新
    passage_updates = update_passage_files()
    
    # 結果分析
    analyze_remaining()
    
    print()
    print('=' * 60)
    print(f'✅ 完了: 辞書{dict_updates}語、パッセージ{passage_updates}箇所を更新')
    print('=' * 60)

if __name__ == '__main__':
    main()
