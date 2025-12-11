#!/usr/bin/env python3
"""
パッセージに存在しない単語を辞書から削除
"""
import json
from pathlib import Path

def main():
    print("=" * 120)
    print("パッセージに存在しない単語を削除")
    print("=" * 120)
    
    # 辞書を読み込み
    dict_path = Path('public/data/dictionaries/reading-passages-dictionary.json')
    with open(dict_path, 'r', encoding='utf-8') as f:
        dictionary = json.load(f)
    
    # パッセージから全lemmaを収集
    passage_lemmas = set()
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
    
    for passage_file in passage_files:
        passage_path = Path(f'public/data/passages-phrase-learning/{passage_file}')
        with open(passage_path, 'r', encoding='utf-8') as pf:
            passage_data = json.load(pf)
            for phrase in passage_data.get('phrases', []):
                for segment in phrase.get('segments', []):
                    lemma = segment.get('lemma', '').strip()
                    if lemma:
                        passage_lemmas.add(lemma)
    
    # パッセージに存在しない単語をリストアップ
    words_to_remove = []
    for word in dictionary.keys():
        if word not in passage_lemmas:
            words_to_remove.append(word)
    
    print(f"\n削除対象: {len(words_to_remove)}語")
    print(f"削除対象の例: {sorted(words_to_remove)[:20]}")
    
    # 辞書から削除
    for word in words_to_remove:
        del dictionary[word]
    
    # 辞書を保存
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    # 統計を表示
    confirmed = sum(1 for entry in dictionary.values() if entry.get('meaning') != '(要確認)')
    unconfirmed = sum(1 for entry in dictionary.values() if entry.get('meaning') == '(要確認)')
    total = len(dictionary)
    percentage = (confirmed / total * 100) if total > 0 else 0
    
    print(f"\n📚 辞書更新: {len(words_to_remove)}語削除")
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
    
    print(f"\n{'=' * 120}")
    print(f"✅ 完了: 辞書から{len(words_to_remove)}語を削除")
    print(f"{'=' * 120}")

if __name__ == '__main__':
    main()
