#!/usr/bin/env python3
"""
低頻度単語(2回出現)を修正 - Part 1

2回出現の382語のうち、最初の150語を処理します。
"""

import json
from pathlib import Path

# 2回出現単語の辞書 Part 1 (150語)
LOW_FREQUENCY_2X_PART1_DICT = {
    'adaptable': '適応できる',
    'administered': '実施された・管理された',
    'advancement': '進歩',
    'advises': '助言する',
    'advisor': '顧問・アドバイザー',
    'advocated': '主張した',
    'aimed': '目指した',
    'aims': '目指す・目的',
    'allegedly': '伝えられるところでは',
    'amendments': '修正・改正',
    'anatomy': '解剖学',
    'apprenticeship': '見習い制度',
    'approvingly': '賛成して',
    'aptitude': '適性',
    'arguably': 'おそらく',
    'argued': '主張した',
    'aristocratic': '貴族的な',
    'arose': '生じた',
    'arrivals': '到着',
    'asphalt': 'アスファルト',
    'assignments': '課題',
    'attainment': '達成',
    'attentively': '注意深く',
    'attorneys': '弁護士',
    'autonomy': '自治・自律',
    "bachelor's": '学士号',
    'backstage': '舞台裏',
    'bell': '鐘・ベル',
    'belt': 'ベルト',
    'bins': 'ゴミ箱',
    'births': '出生',
    'bleaching': '漂白',
    'blessed': '恵まれた',
    'bloodstream': '血流',
    "body's": '体の',
    'booth': 'ブース',
    'boycotts': 'ボイコット',
    'broadened': '広げた',
    'broth': 'スープ',
    'burdens': '負担',
    'cakes': 'ケーキ',
    'campfire': 'キャンプファイヤー',
    'campus': 'キャンパス',
    'canals': '運河',
    'cancerous': '癌の',
    'capacities': '能力・容量',
    'cardboard': '段ボール',
    'cashless': 'キャッシュレス',
    'caution': '注意',
    'cheers': '歓声・乾杯',
    "children's": '子供の',
    'chips': 'チップス・破片',
    'chosen': '選ばれた',
    'cleanliness': '清潔さ',
    'clicked': 'クリックした',
    'closest': '最も近い',
    'compensated': '補償された',
    'complained': '不平を言った',
    'components': '部品',
    'conclusions': '結論',
    'confronted': '直面した',
    'connectivity': '接続性',
    'considerations': '考慮事項',
    'contaminated': '汚染された',
    'contemplated': '熟考した',
    'corridors': '廊下',
    'cosmic': '宇宙の',
    'cows': '牛',
    'crazy': '狂った・おかしい',
    'criticized': '批判した',
    'curators': '学芸員',
    'daunting': '気力をくじく',
    'daytime': '昼間',
    'debris': '破片・がれき',
    'decent': 'まともな',
    'decorative': '装飾的な',
    'deer': '鹿',
    'defeat': '敗北',
    'degrade': '劣化させる',
    'deliberation': '熟考',
    'delicate': '繊細な',
    'delighted': '喜んだ',
    'depicting': '描写する',
    'depression': '憂鬱・不景気',
    'depth': '深さ',
    'describing': '説明する',
    'desu': 'です',
    'diagnosis': '診断',
    'dimension': '次元',
    'disadvantage': '不利',
    'disappointing': 'がっかりさせる',
    'dismissing': '却下する',
    'dispersed': '分散した',
    'displace': '移動させる',
    'disposable': '使い捨ての',
    'disrespectful': '無礼な',
    'distinct': '明確な',
    'distinguish': '区別する',
    'disturbances': '妨害',
    'divorce': '離婚',
    'doctorates': '博士号',
    'dominant': '支配的な',
    'dominate': '支配する',
    'drills': '訓練・ドリル',
    'dumplings': '餃子',
    'earned': '稼いだ',
    'economically': '経済的に',
    'educators': '教育者',
    'effectiveness': '有効性',
    'elders': '年長者',
    'elephants': '象',
    'elusive': 'つかみどころのない',
    'encouragement': '励まし',
    'endured': '耐えた',
    'engine': 'エンジン',
    'engineered': '設計された',
    'envision': '想像する',
    'equitable': '公平な',
    'esports': 'eスポーツ',
    'evil': '悪',
    'examination': '検査',
    'examined': '調べた',
    'examines': '調べる',
    'exceeded': '超えた',
    'exceptional': '並外れた',
    'exile': '追放',
    'expectancies': '期待',
    'expenses': '費用',
    'experiential': '経験的な',
    'experiment': '実験',
    'external': '外部の',
    'extraordinarily': '並外れて',
    'extraordinary': '並外れた',
    'fabric': '織物',
    'fatal': '致命的な',
    'feet': '足',
    'festive': '祝祭の',
    'fifteenth': '15番目',
    'fitness': 'フィットネス',
    'fixtures': '備品',
    'flour': '小麦粉',
    'flourish': '繁栄する',
    'fluid': '流体',
    'followers': 'フォロワー',
    'forehead': '額',
    'forestry': '林業',
    'fortunate': '幸運な',
    'fossilized': '化石化した',
    'fractured': '骨折した',
    'fragments': '破片',
    'framed': '額に入れた',
}

def update_dictionary():
    """辞書ファイルを更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = 0
    added = 0
    
    for word, meaning in LOW_FREQUENCY_2X_PART1_DICT.items():
        if word in dictionary:
            if dictionary[word].get('meaning') == '(要確認)':
                dictionary[word]['meaning'] = meaning
                dictionary[word]['source'] = 'low-frequency-2x-manual'
                updated += 1
        else:
            dictionary[word] = {
                'meaning': meaning,
                'source': 'low-frequency-2x-manual'
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
                
                if segment.get('meaning') == '(要確認)' and word in LOW_FREQUENCY_2X_PART1_DICT:
                    segment['meaning'] = LOW_FREQUENCY_2X_PART1_DICT[word]
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
    confirmed = sum(1 for entry in dictionary.values() if entry.get('meaning') != '(要確認)')
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

def main():
    print('=' * 60)
    print('低頻度単語(2回出現) Part 1/3')
    print('=' * 60)
    print()
    
    print(f'対象: {len(LOW_FREQUENCY_2X_PART1_DICT)}語\n')
    
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
