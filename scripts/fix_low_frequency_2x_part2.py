#!/usr/bin/env python3
"""
低頻度単語(2回出現)を修正 - Part 2

2回出現の382語のうち、残りの231語を処理します。
"""

import json
from pathlib import Path

# 2回出現単語の辞書 Part 2 (231語)
LOW_FREQUENCY_2X_PART2_DICT = {
    'freezes': '凍る',
    'freezing': '凍結・凍るような',
    'frequency': '頻度',
    'fried': '揚げた',
    'frustrations': '欲求不満',
    'functionality': '機能性',
    'gains': '利益',
    'gasped': '息を呑んだ',
    'gone': '行った・なくなった',
    'greet': '挨拶する',
    'greeted': '挨拶した',
    'greetings': '挨拶',
    'hang': '掛ける',
    'hanging': 'ぶら下がる',
    'harvest': '収穫',
    'hazardous': '危険な',
    'homeroom': 'ホームルーム',
    'homesick': 'ホームシック',
    'hop': '跳ぶ',
    'hotter': 'より暑い',
    'household': '家庭',
    'hunted': '狩った',
    'hunting': '狩猟',
    'hypertension': '高血圧',
    'illumination': '照明',
    'illustrate': '説明する',
    'illustrated': '図解された',
    'immersed': '浸った',
    'immigration': '移民',
    'incomplete': '不完全な',
    'incorporate': '組み込む',
    'individuality': '個性',
    'industrialization': '工業化',
    'inevitably': '必然的に',
    'inform': '知らせる',
    'ingrained': '染み付いた',
    'inquiry': '調査',
    'insight': '洞察',
    'integration': '統合',
    'intimate': '親密な',
    'intruding': '侵入する',
    'isolate': '隔離する',
    'isolation': '孤立',
    'journal': '日誌',
    'journals': '学術誌',
    'judgment': '判断',
    'kits': 'キット',
    'knowledgeable': '知識豊富な',
    'laboratory': '実験室',
    'launch': '打ち上げ',
    'leagues': 'リーグ',
    'lean': '傾く・痩せた',
    'leftover': '残り物',
    'legendary': '伝説的な',
    'lens': 'レンズ',
    'liberation': '解放',
    'lit': '照らされた',
    'logo': 'ロゴ',
    'loose': '緩い',
    'magnetic': '磁気の',
    'magnets': '磁石',
    'magnitude': '規模',
    'malfunctioned': '故障した',
    'manageable': '管理可能な',
    'manipulates': '操作する',
    'marriage': '結婚',
    'marveled': '驚嘆した',
    "master's": '修士号',
    'medieval': '中世の',
    'merits': '長所',
    'methodology': '方法論',
    'microorganisms': '微生物',
    'microscopes': '顕微鏡',
    'mild': '穏やかな',
    'millennia': '千年紀',
    'missions': '任務',
    'modest': '控えめな',
    'modifications': '修正',
    'modified': '修正された',
    'molecule': '分子',
    "museum's": '博物館の',
    'mysterious': '神秘的な',
    'nanotubes': 'ナノチューブ',
    'narrating': '語る',
    'narration': 'ナレーション',
    'nearby': '近くの',
    'nerves': '神経',
    'nesting': '巣作り',
    'nighttime': '夜間',
    'nitrogen': '窒素',
    'nonviolent': '非暴力の',
    'noodles': '麺',
    'northern': '北の',
    'noticeable': '目立つ',
    'occupation': '職業',
    'offspring': '子孫',
    'oppression': '抑圧',
    'optimism': '楽観主義',
    'orbit': '軌道',
    'organizational': '組織の',
    'organs': '臓器',
    'outright': '完全に',
    'ovation': '拍手喝采',
    'pancakes': 'パンケーキ',
    'panel': 'パネル',
    'partial': '部分的な',
    'passionate': '情熱的な',
    'pathway': '経路',
    'pendulum': '振り子',
    'periodic': '定期的な',
    'permanently': '永久に',
    "person's": '人の',
    'personalities': '個性',
    'persuasive': '説得力のある',
    'petroleum': '石油',
    'photosynthesis': '光合成',
    'picked': '選んだ',
    'pioneered': '開拓した',
    "planet's": '惑星の',
    'planetarium': 'プラネタリウム',
    'poetry': '詩',
    'polar': '極地の',
    'pollutants': '汚染物質',
    'portrayed': '描写した',
    'possessed': '所有した',
    'possesses': '所有する',
    'possessions': '所有物',
    'posters': 'ポスター',
    'pounded': '叩いた',
    'precise': '正確な',
    'premature': '早すぎる',
    'prescription': '処方箋',
    'prescriptions': '処方薬',
    'preventive': '予防的な',
    'programmers': 'プログラマー',
    'progressively': '徐々に',
    'promotional': '宣伝の',
    'promptly': '迅速に',
    'property': '財産',
    'propose': '提案する',
    'proposed': '提案された',
    'protective': '保護的な',
    'publishing': '出版',
    'pulls': '引く',
    'pumping': 'ポンプで送る',
    'quotes': '引用',
    'radiologists': '放射線科医',
    'rainfall': '降雨量',
    'rainforests': '熱帯雨林',
    'reactors': '原子炉',
    'reassured': '安心させた',
    'reassuring': '安心させる',
    'reception': '受付・歓迎会',
    'recovering': '回復する',
    'recyclable': 'リサイクル可能な',
    'reference': '参照',
    'regenerate': '再生する',
    'replicas': '複製品',
    'reproduction': '繁殖',
    'resident': '住民',
    'residential': '住宅の',
    'respectful': '敬意を表す',
    "restaurant's": 'レストランの',
    'retired': '引退した',
    'reunion': '再会',
    'risen': '上昇した',
    'rocky': '岩だらけの',
    'rode': '乗った',
    'sandals': 'サンダル',
    'scenery': '景色',
    'scope': '範囲',
    'senior': '年長の',
    'settled': '定住した',
    'setup': 'セットアップ',
    'sewage': '下水',
    'shouted': '叫んだ',
    'significance': '重要性',
    'simulated': 'シミュレートされた',
    'skeleton': '骨格',
    'skyscrapers': '超高層ビル',
    "slavery's": '奴隷制の',
    'sobering': '冷静にさせる',
    'socioeconomic': '社会経済的な',
    'soda': 'ソーダ',
    'sometime': 'いつか',
    'sophistication': '洗練',
    'sparing': '控えめな',
    'specimens': '標本',
    'spectrum': 'スペクトル',
    'spices': 'スパイス',
    'spiritual': '精神的な',
    'sprawl': '無秩序な拡大',
    'steadily': '着実に',
    'stifled': '抑えた',
    'straightforwardness': '率直さ',
    'strain': '緊張',
    'stuck': '動けない',
    "student's": '学生の',
    'substance': '物質',
    'superposition': '重ね合わせ',
    'surgeon': '外科医',
    'surroundings': '環境',
    'symbolizes': '象徴する',
    'tails': '尾',
    'taken': '取られた',
    'tales': '物語',
    'teased': 'からかった',
    'theology': '神学',
    'theoretically': '理論的には',
    'tillage': '耕作',
    'transistor': 'トランジスタ',
    'transmission': '伝達',
    'trauma': '外傷',
    'turtle': 'カメ',
    'unintended': '意図しない',
    'untreatable': '治療不可能な',
    'utensils': '食器',
    'vanishes': '消える',
    'vastness': '広大さ',
    'verification': '検証',
    'veterinarians': '獣医',
    'veterinary': '獣医の',
    'viable': '実行可能な',
    'wealthier': 'より裕福な',
    'wealthy': '裕福な',
    'weddings': '結婚式',
    'weighed': '重さを量った',
    'winning': '勝利',
    "women's": '女性の',
    "world's": '世界の',
    'yourselves': 'あなた自身',
}

def update_dictionary():
    """辞書ファイルを更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    
    with open(dict_path, encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated = 0
    added = 0
    
    for word, meaning in LOW_FREQUENCY_2X_PART2_DICT.items():
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
                
                if segment.get('meaning') == '(要確認)' and word in LOW_FREQUENCY_2X_PART2_DICT:
                    segment['meaning'] = LOW_FREQUENCY_2X_PART2_DICT[word]
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
    achieved = shortage <= 0
    
    print(f'\n🎯 目標達成状況:')
    print(f'  目標(95%): {target_95}語')
    if achieved:
        print(f'  🎉 目標達成! 超過: {-shortage}語')
    else:
        print(f'  不足: {shortage}語')
    print(f'  達成率: {confirmed/target_95*100:.1f}%')

def main():
    print('=' * 60)
    print('低頻度単語(2回出現) Part 2/2')
    print('=' * 60)
    print()
    
    print(f'対象: {len(LOW_FREQUENCY_2X_PART2_DICT)}語\n')
    
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
