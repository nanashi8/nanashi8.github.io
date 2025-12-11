#!/usr/bin/env python3
"""
パッセージ内残存(要確認)445語 Part1 (A-I)
固有名詞・専門用語を含む
"""
import json
from pathlib import Path

# Part1: A-I (150語)
PART1_DICT = {
    'Accounting': '会計',
    'Affordability': '手頃さ',
    'Amadeus': 'アマデウス(モーツァルトの中間名)',
    'Arabia': 'アラビア',
    'Armada': 'アルマダ(無敵艦隊)',
    'Biologist': '生物学者',
    'Bolivia': 'ボリビア',
    'Childhood': '幼少期',
    'Colombia': 'コロンビア',
    'Colosseum': 'コロッセオ',
    'Contaminated': '汚染された',
    'Cubism': 'キュビズム',
    'Dame': '貴婦人',
    'Dementia': '認知症',
    'Depression': '大恐慌・うつ病',
    'Displaced': '避難した',
    'Douglass': 'ダグラス(人名)',
    'Downtown': 'ダウンタウン',
    'ENIAC': 'ENIAC(初期コンピュータ)',
    'Ecuador': 'エクアドル',
    'Egyptian': 'エジプトの',
    'Electrical': '電気の',
    'Exhibition': '展覧会',
    'Expansion': '拡大',
    'Fog': '霧',
    'Forum': 'フォーラム・広場',
    'Freelance': 'フリーランス',
    'Freezing': '凍結する',
    'Frozen': '凍った',
    'Garcia': 'ガルシア(人名)',
    'Gettysburg': 'ゲティスバーグ',
    'Greeting': '挨拶',
    'Harris': 'ハリス(人名)',
    'II': '2世',
    'Ideal': '理想的な',
    'Inadequately': '不十分に',
    'Inaugural': '就任の',
    'Jackson': 'ジャクソン(人名)',
    'Jr': 'ジュニア',
    'Julian': 'ジュリアン',
    'Ken': 'ケン',
    'Kids': '子供たち',
    'Landscaping': '造園',
    'Letters': '手紙',
    'Licensing': 'ライセンス',
    'Lincoln': 'リンカーン',
    'Liu': '劉(人名)',
    'Macbeth': 'マクベス',
    'Men': '男性',
    'Mozart': 'モーツァルト',
    'Muslim': 'イスラム教徒',
    "O'Brien": "オブライエン(人名)",
    'Periodic': '周期的な',
    'Peru': 'ペルー',
    'Picasso': 'ピカソ',
    'Poaching': '密猟',
    'Polish': 'ポーランドの',
    'Precarious': '不安定な',
    'Preventable': '予防可能な',
    'Proceeds': '収益',
    'Qubits': '量子ビット',
    'Regulatory': '規制の',
    'Substance': '物質',
    'Symphony': '交響曲',
    'Syracuse': 'シラキュース',
    'Telescope': '望遠鏡',
    'Vegetarian': 'ベジタリアン',
    'Venezuela': 'ベネズエラ',
    'Vinci': 'ヴィンチ(ダ・ヴィンチ)',
    'Voltaire': 'ヴォルテール',
    'Warning': '警告',
    'Wealthy': '裕福な',
    'Webb': 'ウェッブ(人名)',
    'Wilson': 'ウィルソン(人名)',
    'Yousafzai': 'ユスフザイ(マララ)',
    'reconvened': '再開した',
    'recounts': '数え直す',
    'recoveries': '回復',
    'recreates': '再現する',
    'redeemed': '償還された',
    'referral': '紹介',
    'refers': '言及する',
    'refined': '洗練された',
    'reform': '改革',
    'reformer': '改革者',
    'refreshments': '軽食',
    'refund': '返金',
    'regained': '取り戻した',
    'regime': '政権',
    'regulatory': '規制の',
    'rehearse': 'リハーサルする',
    'reign': '治世',
    'reinforced': '強化された',
    'relativity': '相対性理論',
    'reliability': '信頼性',
    'reliance': '依存',
    'reluctantly': '渋々',
    'remainder': '残り',
    'remarry': '再婚する',
    'remnants': '残骸',
    'removal': '除去',
    'render': 'する',
    'renewal': '更新',
    'repainting': '塗り直し',
    'repeatedly': '繰り返し',
    'repellent': '虫除け',
    'replenish': '補充する',
    'replica': 'レプリカ',
    'replies': '返信する',
    'reproductive': '生殖の',
    'reptiles': '爬虫類',
    'reschedule': '予定変更する',
    'resolution': '解決',
    'resonated': '共鳴した',
    'resonates': '共鳴する',
    'resorts': 'リゾート',
    'respite': '休息',
    'responsibly': '責任を持って',
    'restraining': '抑制する',
    'restraint': '抑制',
    'restrict': '制限する',
    'restrooms': 'トイレ',
    'resurrection': '復活',
    'retelling': '再話',
    'retention': '保持',
    'retire': '引退する',
    'retrain': '再訓練する',
    'retreating': '後退する',
    'revealing': '明らかにする',
    'revelations': '啓示',
    'revenge': '復讐',
    'revise': '改訂する',
    'revolutionary': '革命的な',
    'rhinos': 'サイ',
    'ribs': '肋骨',
    'rides': '乗る',
    'ridicule': '嘲笑',
    'rigor': '厳格さ',
    'rings': '指輪',
    'rink': 'スケートリンク',
    'rinks': 'スケートリンク(複数)',
    'ripe': '熟した',
    'risky': '危険な',
    'rivaling': '競争する',
    'riversidetown': 'リバーサイドタウン',
}

def update_files():
    """パッセージファイルを更新"""
    passage_files = [
        'advanced-environmental-issues.json',
        'advanced-family-gathering.json',
        'advanced-health-statistics.json',
        'advanced-historical-figures.json',
        'advanced-international-exchange.json',
        'advanced-school-festival.json',
        'advanced-summer-vacation-stories.json',
        'advanced-technology-future.json',
        'beginner-cafe-menu.json',
        'beginner-conversation-daily.json',
        'beginner-supermarket-shopping.json',
        'beginner-weather-seasons.json',
        'beginner-wildlife-park-guide.json',
        'intermediate-career-day.json',
        'intermediate-community-events.json',
        'intermediate-exchange-student-australia-full.json',
        'intermediate-exchange-student-australia.json',
        'intermediate-homestay-america.json',
        'intermediate-hospital-visit.json',
        'intermediate-school-events-year.json',
        'intermediate-school-news.json',
        'intermediate-science-museum.json'
    ]
    
    files_updated = 0
    total_updates = 0
    
    for passage_file in passage_files:
        passage_path = Path(f'public/data/passages-phrase-learning/{passage_file}')
        with open(passage_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_updates = 0
        for phrase in data.get('phrases', []):
            for segment in phrase.get('segments', []):
                lemma = segment.get('lemma', '')
                if lemma in PART1_DICT:
                    if segment.get('meaning') == '(要確認)':
                        segment['meaning'] = PART1_DICT[lemma]
                        file_updates += 1
        
        if file_updates > 0:
            with open(passage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  ✅ {passage_file}: {file_updates}箇所")
            files_updated += 1
            total_updates += file_updates
    
    return files_updated, total_updates

def main():
    print("=" * 80)
    print("Part1 (A-I): 150語を処理")
    print("=" * 80)
    
    files_count, updates_count = update_files()
    print(f"\n📄 更新: {files_count}ファイル, {updates_count}箇所")

if __name__ == '__main__':
    main()
