#!/usr/bin/env python3
"""
残りの高頻度単語を修正 (5回以上出現)
- tom (26回): 固有名詞
- cognitive, inadequate, mechanics, notebooks, software (5回)
- disagreement, discourage, frustration, gain, liberate, merit, sibling (2回)
"""
import json
from pathlib import Path

# 高頻度単語の辞書
HIGH_FREQUENCY_DICT = {
    # 26回出現
    'tom': '(人名) トム',
    
    # 5回出現
    'cognitive': '認知の',
    'inadequate': '不十分な',
    'mechanics': '仕組み・機械学',
    'notebooks': 'ノート',
    'software': 'ソフトウェア',
    
    # 2回出現
    'disagreement': '意見の相違',
    'discourage': '落胆させる',
    'frustration': '欲求不満・いらだち',
    'gain': '得る・獲得する',
    'liberate': '解放する',
    'merit': '長所・価値',
    'sibling': '兄弟姉妹',
}

def update_dictionary():
    """辞書を更新"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    updated_count = 0
    for word, meaning in HIGH_FREQUENCY_DICT.items():
        if word in dictionary:
            if dictionary[word].get('meaning') == '(要確認)':
                dictionary[word]['meaning'] = meaning
                dictionary[word]['source'] = 'manual_high_freq'
                updated_count += 1
    
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    return updated_count

def update_passage_files():
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
                if lemma in HIGH_FREQUENCY_DICT:
                    if segment.get('meaning') == '(要確認)':
                        segment['meaning'] = HIGH_FREQUENCY_DICT[lemma]
                        file_updates += 1
        
        if file_updates > 0:
            with open(passage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  ✅ {passage_file}: {file_updates}箇所")
            files_updated += 1
            total_updates += file_updates
    
    return files_updated, total_updates

def analyze_remaining():
    """残りの(要確認)を分析"""
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    confirmed = sum(1 for entry in dictionary.values() if entry.get('meaning') != '(要確認)')
    unconfirmed = sum(1 for entry in dictionary.values() if entry.get('meaning') == '(要確認)')
    total = len(dictionary)
    percentage = (confirmed / total * 100) if total > 0 else 0
    
    print(f"\n📊 辞書の状態:")
    print(f"  総単語数: {total}語")
    print(f"  意味確定: {confirmed}語 ({percentage:.1f}%)")
    print(f"  (要確認): {unconfirmed}語 ({100-percentage:.1f}%)")
    
    target = int(total * 0.95)
    shortage = target - confirmed
    achievement = (confirmed / target * 100) if target > 0 else 0
    
    print(f"\n🎯 目標達成状況:")
    print(f"  目標(95%): {target}語")
    print(f"  不足: {shortage}語")
    print(f"  達成率: {achievement:.1f}%")

def main():
    print("=" * 120)
    print("残りの高頻度単語を修正 (5回以上 + 2回出現)")
    print("=" * 120)
    print(f"\n対象: {len(HIGH_FREQUENCY_DICT)}語\n")
    
    dict_count = update_dictionary()
    print(f"📚 辞書更新: {dict_count}語\n")
    
    files_count, updates_count = update_passage_files()
    print(f"\n📄 パッセージ更新: {files_count}ファイル, {updates_count}箇所")
    
    analyze_remaining()
    
    print(f"\n{'=' * 120}")
    print(f"✅ 完了: 辞書{dict_count}語、パッセージ{updates_count}箇所を更新")
    print(f"{'=' * 120}")

if __name__ == '__main__':
    main()
