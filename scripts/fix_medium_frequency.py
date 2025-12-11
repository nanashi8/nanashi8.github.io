#!/usr/bin/env python3
"""
中頻度単語(3-4回出現)を修正

手動で作成した辞書を使用して、中頻度の(要確認)単語を修正します。
"""

import json
from pathlib import Path

# 中頻度単語の辞書（3-4回出現）
MEDIUM_FREQUENCY_DICT = {
    # 動詞形
    'greeting': '挨拶する・挨拶',
    'frightening': '恐ろしい・怖がらせる',
    'confused': '混乱した',
    'donated': '寄付した',
    'chorused': '合唱した・声を揃えて言った',
    'selected': '選ばれた',
    'declared': '宣言した',
    'warning': '警告・警告する',
    'designated': '指定された',
    'frustrating': 'イライラさせる',
    'thrilled': 'わくわくした・興奮した',
    'whispered': 'ささやいた',
    'recovered': '回復した',
    'spilled': 'こぼした',
    'sighed': 'ため息をついた',
    'advised': '助言した',
    'anticipated': '予想した',
    'remarked': '述べた・意見を言った',
    'prompted': '促した',
    'exemplified': '例証した',
    'orbiting': '軌道を回る',
    'grabbing': 'つかむ',
    'hiking': 'ハイキング・ハイキングする',
    'published': '出版された',
    'pickled': '漬けた・ピクルスにした',
    'concluded': '結論を出した',
    'enforced': '施行した・強制した',
    'accounting': '会計・説明',
    'proceed': '進む・続ける',
    'elevated': '高くした・上昇した',
    
    # 名詞形
    'desserts': 'デザート',
    'decoration': '装飾',
    'balls': 'ボール・舞踏会',
    'transformation': '変化・変身',
    'kilometers': 'キロメートル',
    'vegetation': '植生',
    'destruction': '破壊',
    'champions': 'チャンピオン・優勝者',
    'drivers': '運転手・推進力',
    'prosperity': '繁栄',
    'branches': '枝・支店',
    'attempts': '試み',
    'ideals': '理想',
    'genius': '天才',
    "humanity's": '人類の',
    'equations': '方程式',
    'colonization': '植民地化',
    'collection': '収集・コレクション',
    'preparedness': '準備態勢',
    'permission': '許可',
    'crutches': '松葉杖',
    'hazards': '危険',
    'profession': '職業',
    'priority': '優先事項',
    'encompasses': '包含する',
    'publicity': '宣伝・広報',
    'props': '小道具',
    'dozens': '数十',
    'nervousness': '緊張',
    "people's": '人々の',
    "who's": '誰が',
    'exhibition': '展示会',
    'recognition': '認識・承認',
    'mirrors': '鏡',
    'rockets': 'ロケット',
    'lungs': '肺',
    'circuits': '回路',
    'scarcity': '不足',
    'agencies': '機関・代理店',
    'fans': 'ファン・扇風機',
    
    # 形容詞形
    'instant': '即座の',
    'destructive': '破壊的な',
    'rigorous': '厳格な',
    'supportive': '支援的な',
    'unpredictable': '予測できない',
    'radioactive': '放射性の',
    'productive': '生産的な',
    'resistant': '耐性のある',
    'reliable': '信頼できる',
    'investment': '投資',
    'impressive': '印象的な',
    'initiative': '主導権・率先',
    'incurable': '治療不可能な',
    'permanent': '永続的な',
    'accountant': '会計士',
    'inevitable': '避けられない',
    'dependent': '依存している',
    'sensitive': '敏感な',
    'predictable': '予測可能な',
    'pleasant': '快適な',
    
    # 副詞形
    'briefly': '簡潔に',
    'casually': '何気なく',
    'intensely': '激しく',
    'overwhelmingly': '圧倒的に',
    'sympathetically': '同情的に',
    'roughly': 'おおよそ',
    
    # その他重要語
    'narrator': '語り手',
    'forgot': '忘れた',
    'furniture': '家具',
    'gray': '灰色',
    'hidden': '隠れた',
    'donate': '寄付する',
    'perseverance': '忍耐',
    'theoretical': '理論的な',
    'invisible': '見えない',
    'cultivate': '栽培する・養う',
    'identical': '同一の',
    'melt': '溶ける',
    'harm': '害',
    'interact': '相互作用する',
    'biological': '生物学的な',
    'reinforce': '強化する',
    'discovery': '発見',
    'lighter': 'より軽い',
    'photography': '写真撮影',
    'birth': '誕生',
    'sustain': '維持する',
    'uncertainty': '不確実性',
    'network': 'ネットワーク',
    'respiratory': '呼吸の',
    'absolute': '絶対的な',
    'promote': '促進する',
    'military': '軍の',
    'died': '死んだ',
    'difficulty': '困難',
    'historic': '歴史的な',
    'eager': '熱心な',
    'update': '更新',
    'flavor': '風味',
    'psychological': '心理的な',
    'anytime': 'いつでも',
    'failure': '失敗',
    'fairy': '妖精',
    'prop': '支え・小道具',
    'broke': '壊れた',
    'onto': '〜の上に',
    'dramatic': '劇的な',
    'chaotic': '混沌とした',
    'discomfort': '不快',
    'simulate': 'シミュレートする',
    'closer': 'より近い',
    'galaxy': '銀河',
    'ecology': '生態学',
    'rainforest': '熱帯雨林',
    'underwater': '水中の',
    'algae': '藻類',
}

def update_dictionary():
    """辞書ファイルを更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = 0
    added = 0
    
    for word, meaning in MEDIUM_FREQUENCY_DICT.items():
        if word in dictionary:
            if dictionary[word].get('meaning') == '(要確認)':
                dictionary[word]['meaning'] = meaning
                dictionary[word]['source'] = 'medium-frequency-manual'
                updated += 1
        else:
            dictionary[word] = {
                'meaning': meaning,
                'source': 'medium-frequency-manual'
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
                
                if segment.get('meaning') == '(要確認)' and word in MEDIUM_FREQUENCY_DICT:
                    segment['meaning'] = MEDIUM_FREQUENCY_DICT[word]
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
    print('中頻度単語(3-4回出現)を修正')
    print('=' * 60)
    print()
    
    print(f'対象: {len(MEDIUM_FREQUENCY_DICT)}語\n')
    
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
