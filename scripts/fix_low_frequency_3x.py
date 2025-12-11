#!/usr/bin/env python3
"""
低頻度単語(3回出現)を修正

手動で作成した辞書を使用して、3回出現の(要確認)単語を修正します。
"""

import json
from pathlib import Path

# 3回出現単語の辞書
LOW_FREQUENCY_3X_DICT = {
    'accessibility': 'アクセスしやすさ・利用可能性',
    'acoustic': '音響の',
    'ailments': '病気・不調',
    'architectural': '建築の',
    'arrangements': '配置・手配',
    'assassination': '暗殺',
    'biologist': '生物学者',
    'broader': 'より広い',
    'cards': 'カード',
    'cellular': '細胞の',
    'cleaner': 'より清潔な・清掃員',
    'computational': '計算の',
    'correlates': '相関する',
    'counselor': 'カウンセラー',
    'credit': '信用・クレジット',
    'culinary': '料理の',
    'curricula': 'カリキュラム',
    'curtains': 'カーテン',
    'discount': '割引',
    'displaced': '移動させられた',
    'distribute': '配布する',
    'documentaries': 'ドキュメンタリー',
    'domains': '領域・分野',
    'downtown': '繁華街・中心街',
    'drought': '干ばつ',
    'economical': '経済的な',
    'elaborate': '詳しく説明する・精巧な',
    'encounter': '遭遇する',
    "era's": '時代の',
    'existential': '実存的な',
    'expansion': '拡大',
    'extract': '抽出する',
    'fertile': '肥沃な',
    'flavors': '味・風味',
    'fog': '霧',
    'forgotten': '忘れられた',
    'generational': '世代の',
    'grab': 'つかむ',
    "grandmother's": '祖母の',
    'handmade': '手作りの',
    'hockey': 'ホッケー',
    "hospital's": '病院の',
    'ideal': '理想的な',
    'ignore': '無視する',
    'implications': '影響・意味',
    'institutions': '機関・制度',
    'interpretations': '解釈',
    'locate': '位置を特定する',
    'logistics': '物流・後方支援',
    'longevity': '長寿',
    'miniaturization': '小型化',
    'mortality': '死亡率',
    'necessities': '必需品',
    'nurture': '育てる',
    'oldest': '最も古い',
    "one's": '自分の',
    'pairs': '対・ペア',
    'pose': '引き起こす・ポーズをとる',
    'possess': '所有する',
    'precipitation': '降水',
    'preventable': '予防可能な',
    'procedure': '手順・処置',
    'promoted': '促進された',
    'qubits': '量子ビット',
    'radiation': '放射線',
    'ramen': 'ラーメン',
    'reasonable': '合理的な',
    'refreshing': '爽やかな',
    'refrigerator': '冷蔵庫',
    'regarding': '〜に関して',
    'regulate': '規制する',
    'requirements': '必要条件',
    'resistance': '抵抗',
    'responsible': '責任がある',
    'reveal': '明らかにする',
    'reveals': '明らかにする',
    'rural': '田舎の',
    'screenings': '検査・上映',
    'segregation': '分離・隔離',
    'session': 'セッション・会合',
    'shelves': '棚',
    'shorter': 'より短い',
    'simpler': 'より簡単な',
    'singers': '歌手',
    'slavery': '奴隷制',
    "society's": '社会の',
    'strokes': '脳卒中',
    'tech': '技術',
    'terrestrial': '地球の・陸上の',
    'territory': '領域',
    'topsoil': '表土',
    'uncertainties': '不確実性',
    'underserved': 'サービスが不足している',
    'voyages': '航海',
    'wartime': '戦時中',
}

def update_dictionary():
    """辞書ファイルを更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = 0
    added = 0
    
    for word, meaning in LOW_FREQUENCY_3X_DICT.items():
        if word in dictionary:
            if dictionary[word].get('meaning') == '(要確認)':
                dictionary[word]['meaning'] = meaning
                dictionary[word]['source'] = 'low-frequency-3x-manual'
                updated += 1
        else:
            dictionary[word] = {
                'meaning': meaning,
                'source': 'low-frequency-3x-manual'
            }
            added += 1
    
    # 保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f'📚 辞書更新: {updated}語, 新規追加: {added}語')
    return updated + added

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
                
                if segment.get('meaning') == '(要確認)' and word in LOW_FREQUENCY_3X_DICT:
                    segment['meaning'] = LOW_FREQUENCY_3X_DICT[word]
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
    
    # 目標達成状況
    target_95 = int(total * 0.95)
    shortage = target_95 - confirmed
    print(f'\n🎯 目標達成状況:')
    print(f'  目標(95%): {target_95}語')
    print(f'  不足: {shortage}語')
    print(f'  達成率: {confirmed/target_95*100:.1f}%')
    
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
    print('低頻度単語(3回出現)を修正')
    print('=' * 60)
    print()
    
    print(f'対象: {len(LOW_FREQUENCY_3X_DICT)}語\n')
    
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
