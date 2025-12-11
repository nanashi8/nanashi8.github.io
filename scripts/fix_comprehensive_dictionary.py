#!/usr/bin/env python3
"""
第4段階: 頻出単語の大規模辞書マッピング

パッセージファイルに実際に出現する(要確認)単語に対して
正確な日本語の意味を設定
"""

import json
from pathlib import Path
from collections import defaultdict

# 頻出単語の拡張辞書（パッセージファイルに実際に出現する単語）
COMPREHENSIVE_DICTIONARY = {
    # 9回出現
    'amazed': '驚いた',
    'forever': '永遠に・ずっと',
    'terrible': 'ひどい・恐ろしい',
    'entrance': '入口',
    'difficulties': '困難',
    'movement': '動き・運動',
    'greatest': '最も偉大な',
    'teenage': '10代の',
    'professions': '職業',
    'survival': '生存',
    'coverage': '報道・範囲',
    
    # 8回出現
    'polite': '礼儀正しい',
    'production': '生産',
    'importance': '重要性',
    'oxygen': '酸素',
    'treat': '扱う・治療する',
    'rewarding': 'やりがいのある',
    'leave': '去る・残す',
    'storage': '保存・貯蔵',
    'cream': 'クリーム',
    'lots': 'たくさん',
    'weekends': '週末',
    
    # 7回出現
    'replied': '答えた',
    'worried': '心配した',
    'gently': '優しく・穏やかに',
    'warmly': '暖かく',
    'tonight': '今夜',
    'casual': 'カジュアルな・気軽な',
    'goodbye': 'さようなら',
    'gestures': '身振り・ジェスチャー',
    'college': '大学',
    'six': '6',
    'ambitious': '野心的な',
    'politely': '礼儀正しく',
    'magical': '魔法のような',
    'math': '数学',
    'enormously': '非常に',
    'impossible': '不可能な',
    'trip': '旅行',
    'million': '百万',
    'instance': '例・場合',
    'trained': '訓練された',
    'dinosaurs': '恐竜',
    'television': 'テレビ',
    'itself': 'それ自体',
    'bought': '買った',
    'deforestation': '森林伐採',
    'policy': '政策',
    'engineer': '技術者',
    'camp': 'キャンプ',
    'badminton': 'バドミントン',
    'skating': 'スケート',
    'court': 'コート・裁判所',
    'intense': '激しい',
    'exams': '試験',
    'exam': '試験',
    'related': '関連した',
    'cases': '場合・事例',
    'annual': '年次の・毎年の',
    'era': '時代',
    'unprecedented': '前例のない',
    'environmentally': '環境的に',
    'substantial': '実質的な・かなりの',
    'remained': '残った',
    'civil': '市民の',
    'France': 'フランス',
    'enabling': '可能にする',
    
    # 6回出現
    'airport': '空港',
    'shy': '恥ずかしがりの',
    'juice': 'ジュース',
    'larger': 'より大きい',
    'mornings': '朝',
    'beach': '浜辺',
    'expression': '表現',
    'leg': '脚',
    'scene': '場面',
    'harder': 'より難しい',
    'onigiri': 'おにぎり',
    'approached': '近づいた',
    'quick': '速い',
    'gained': '得た',
    'accomplished': '達成した',
    'sophisticated': '洗練された',
    'essay': 'エッセイ・小論文',
    'capabilities': '能力',
    'plays': '演劇・遊ぶ',
    'traveled': '旅行した',
    'billion': '10億',
    'location': '場所',
    'nutrients': '栄養素',
    'recover': '回復する',
    'illnesses': '病気',
    'reefs': 'サンゴ礁',
    'capacity': '容量・能力',
    'contamination': '汚染',
    'moisture': '水分',
    'systematic': '体系的な',
    'analyzing': '分析すること',
    'complicated': '複雑な',
    'snacks': '軽食',
    'expand': '拡大する',
    'realize': '実現する・気づく',
    'dinner': '夕食',
    'decision': '決定',
    'pursuing': '追求すること',
    'partner': 'パートナー',
    'baby': '赤ちゃん',
    'born': '生まれた',
    'seems': 'のように見える',
    'stable': '安定した',
    'cousins': 'いとこ',
    'presence': '存在',
    'figured': '理解した',
    'precious': '貴重な',
    'accumulate': '蓄積する',
    'labor': '労働',
    'overlooked': '見過ごされた',
    'disposal': '処分',
    'efficiency': '効率',
    'outdoor': '屋外の',
    'continuously': '継続的に',
    'complications': '合併症',
    'examine': '調べる',
    'devoted': '専念した',
    'volunteered': 'ボランティアした',
    'earthquake': '地震',
    'tastes': '味',
    'enjoying': '楽しむこと',
    'emphasizes': '強調する',
    'transcending': '超越すること',
    'additional': '追加の',
    'checks': 'チェックする',
    'molecular': '分子の',
    
    # 5回出現
    'traveling': '旅行すること',
    'responded': '応答した',
    'eggs': '卵',
    'confessed': '告白した',
    'head': '頭',
    'confident': '自信のある',
    'overseas': '海外の',
    'politics': '政治',
    'cake': 'ケーキ',
    'effect': '効果',
    'function': '機能',
    'emphasizing': '強調すること',
    'semester': '学期',
    'backdrop': '背景',
    'lent': '貸した',
    'won\'t': 'しないだろう',
    'faster': 'より速い',
    'transition': '移行',
    'rehearsal': 'リハーサル',
    'discouraged': '落胆した',
    'opening': '開始・開口部',
    'list': 'リスト',
    'scheduled': '予定された',
    'formed': '形成された',
    'line': '列・線',
    'tears': '涙',
    'excitedly': '興奮して',
    'kept': '保った',
    'wearing': '着ていること',
    'accomplish': '達成する',
    'meant': '意味した',
    'organizing': '組織すること',
    'largest': '最大の',
    'profit': '利益',
    'newspaper': '新聞',
    'barely': 'かろうじて',
    'known': '知られた',
    'precisely': '正確に',
    'wildlife': '野生生物',
    'guided': '案内された',
    'explore': '探検する',
    'fascinating': '魅力的な',
    'habitat': '生息地',
    'intelligent': '知的な',
    'diet': '食事',
    'zoo': '動物園',
    'pride': '誇り',
    'mammals': '哺乳類',
    'enclosure': '囲い',
    'observing': '観察すること',
    'feed': '餌をやる',
    'protection': '保護',
    'interactive': '双方向の',
    'exhibit': '展示',
    'span': '期間・範囲',
    'endangered': '絶滅危惧種の',
    'conservation': '保全',
    'behaviors': '行動',
    'monitor': '監視する',
    'staff': 'スタッフ',
    'dedicated': '専念した',
    'guided': '案内された',
    'enrichment': '充実',
    'awareness': '意識',
    'ethical': '倫理的な',
    'commitment': '献身',
    'remarkable': '注目すべき',
    'wonders': '驚異',
    'preservation': '保存',
    
    # 4回出現（高頻度）
    'adventure': '冒険',
    'memories': '思い出',
    'nervous': '緊張した',
    'introduced': '紹介した',
    'friendly': '友好的な',
    'gradually': '徐々に',
    'comfortable': '快適な',
    'experiences': '経験',
    'culture': '文化',
    'customs': '習慣',
    'participated': '参加した',
    'impressed': '印象を受けた',
    'kindness': '親切',
    'hospitality': 'もてなし',
    'grateful': '感謝している',
    'farewell': '別れ',
    'bonds': '絆',
    'unforgettable': '忘れられない',
    'treasure': '宝物',
    'forever': '永遠に',
    'exchange': '交換',
    'relationships': '関係',
    'international': '国際的な',
    'perspectives': '視点',
    'appreciate': '感謝する',
    'diversity': '多様性',
    'overcome': '克服する',
    'challenges': '課題',
    'growth': '成長',
    'journey': '旅',
    
    # よくある基本単語
    'everybody': 'みんな',
    'somebody': '誰か',
    'nobody': '誰も〜ない',
    'anybody': '誰でも',
    'everyone': 'みんな',
    'someone': '誰か',
    'anyone': '誰でも',
    'none': 'いずれも〜ない',
    'elsewhere': 'どこか他の場所',
    'nowhere': 'どこにも〜ない',
    'anywhere': 'どこでも',
    'everywhere': 'どこでも',
    'somehow': 'どうにかして',
    'somewhat': 'いくらか',
    'anyway': 'とにかく',
    'anyhow': 'とにかく',
    'meanwhile': '一方で',
    'therefore': 'したがって',
    'however': 'しかしながら',
    'moreover': 'さらに',
    'furthermore': 'さらに',
    'nevertheless': 'それにもかかわらず',
    'otherwise': 'さもなければ',
    'besides': '〜に加えて',
    'indeed': '実に',
    'thus': 'このように',
    'hence': 'したがって',
    'whereas': '一方',
    'whereby': 'それによって',
    'wherein': 'その中で',
}


def main():
    # パスの設定
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    passages_dir = Path('public/data/passages-phrase-learning')
    
    # 辞書を読み込み
    print("📖 辞書を読み込み中...")
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    # パッセージファイル内の(要確認)単語を集計
    print("📊 (要確認)単語を集計中...")
    unconfirmed_words = defaultdict(int)
    
    for passage_file in passages_dir.glob('*.json'):
        with open(passage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '').lower()
                meaning = segment.get('meaning', '')
                
                if meaning == '(要確認)' and word:
                    unconfirmed_words[word] += 1
    
    print(f"  見つかった(要確認)単語: {len(unconfirmed_words)}種類")
    
    # 拡張辞書でマッピング可能な単語を抽出
    fixed_words = {}
    for word, count in unconfirmed_words.items():
        if word in COMPREHENSIVE_DICTIONARY:
            fixed_words[word] = {
                'meaning': COMPREHENSIVE_DICTIONARY[word],
                'count': count
            }
    
    print(f"\n✅ 修正可能な単語: {len(fixed_words)}語")
    print(f"  総出現回数: {sum(w['count'] for w in fixed_words.values())}回")
    
    if not fixed_words:
        print("\n修正する単語がありません。")
        return
    
    # 辞書を更新
    print("\n📝 辞書を更新中...")
    updated_count = 0
    for word, info in fixed_words.items():
        if word in dictionary:
            if dictionary[word].get('meaning') == '(要確認)':
                dictionary[word]['meaning'] = info['meaning']
                dictionary[word]['source'] = 'comprehensive-dictionary'
                updated_count += 1
    
    # 辞書を保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f"  辞書更新: {updated_count}語")
    
    # パッセージファイルを更新
    print("\n📝 パッセージファイルを更新中...")
    total_updated = 0
    
    for passage_file in sorted(passages_dir.glob('*.json')):
        with open(passage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_updated = 0
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '').lower()
                
                if word in fixed_words and segment.get('meaning') == '(要確認)':
                    segment['meaning'] = fixed_words[word]['meaning']
                    file_updated += 1
        
        if file_updated > 0:
            with open(passage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {passage_file.name}: {file_updated}箇所更新")
            total_updated += file_updated
    
    print(f"\n✅ 完了!")
    print(f"  修正した単語: {len(fixed_words)}語")
    print(f"  更新した箇所: {total_updated}箇所")
    
    # 統計
    has_meaning = sum(1 for v in dictionary.values() if v.get('meaning', '') and v.get('meaning', '') not in ['(要確認)', '(未登録)', '(固有名詞)'])
    total = len(dictionary)
    remaining = sum(1 for v in dictionary.values() if v.get('meaning') == '(要確認)')
    
    print(f"\n📊 辞書の状態:")
    print(f"  完成率: {has_meaning}/{total} ({has_meaning/total*100:.1f}%)")
    print(f"  残り(要確認): {remaining}語")
    
    # 上位20語を表示
    print("\n📊 修正した単語（出現頻度上位20）:")
    sorted_fixed = sorted(fixed_words.items(), key=lambda x: x[1]['count'], reverse=True)
    for i, (word, info) in enumerate(sorted_fixed[:20], 1):
        print(f"  {i}. {word}: {info['meaning']} ({info['count']}回)")


if __name__ == '__main__':
    main()
