import json

# 基本的な訳語辞書
translations = {
    'on record': '記録上',
    'for millions': '何百万人のために',
    'from ocean acidification': '海洋酸性化から',
    'to clean energy': 'クリーンエネルギーへ',
    'for the future': '未来のために',
    'from the sun': '太陽から',
    'in many places': '多くの場所で',
    'for entire cities': '都市全体のために',
    'from moving air': '動く空気から',
    'from wind': '風から',
    'from rivers': '川から',
    'on hydropower': '水力発電に',
    'from the Earth': '地球から',
    'for heating': '暖房のために',
    'from organic materials': '有機材料から',
    'from agricultural waste': '農業廃棄物から',
    'in vehicles': '車両で',
    'on solar': '太陽光に',
    'of waste': '廃棄物の',
    'for durability': '耐久性のために',
    'for new products': '新製品のために',
    'as a service': 'サービスとして',
    'of buy': '購入の',
    'to pests': '害虫に',
    'to the soil': '土壌に',
    'for consumers': '消費者のために',
}

def auto_fix_meanings(passages):
    """
    [要修正]のフレーズを自動修正
    """
    fixed_count = 0
    
    for passage in passages:
        for phrase in passage['phrases']:
            meaning = phrase.get('phraseMeaning', '')
            
            if meaning == '[要修正]':
                words = phrase['words']
                segments = phrase.get('segments', [])
                text = ' '.join(words).strip()
                text_lower = text.lower().rstrip('.')
                
                # 辞書から検索
                if text_lower in translations:
                    phrase['phraseMeaning'] = translations[text_lower]
                    fixed_count += 1
                else:
                    # セグメントから和訳を構築
                    meanings = []
                    for seg in segments:
                        word = seg.get('word', '')
                        seg_meaning = seg.get('meaning', '')
                        
                        # 句読点以外で意味があるもの
                        if word not in ['.', ',', ';', ':', '!', '?', '-', '—'] and seg_meaning and seg_meaning != '-':
                            meanings.append(seg_meaning)
                    
                    if meanings:
                        phrase['phraseMeaning'] = ''.join(meanings)
                        fixed_count += 1
    
    return passages, fixed_count

# メイン処理
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

print("=" * 80)
print("[要修正]フレーズの自動修正")
print("=" * 80)

# [要修正]をカウント
needs_fix = 0
for passage in passages:
    for phrase in passage['phrases']:
        if phrase.get('phraseMeaning', '') == '[要修正]':
            needs_fix += 1

print(f"\n[要修正]フレーズ: {needs_fix}")

# 修正
passages, fixed_count = auto_fix_meanings(passages)

# 再カウント
still_needs_fix = 0
for passage in passages:
    for phrase in passage['phrases']:
        if phrase.get('phraseMeaning', '') == '[要修正]':
            still_needs_fix += 1

print(f"修正したフレーズ: {fixed_count}")
print(f"残りの[要修正]: {still_needs_fix}")

# 残りの[要修正]を表示
if still_needs_fix > 0:
    print("\n" + "=" * 80)
    print(f"残りの[要修正]フレーズ（最初の20件）:")
    print("=" * 80)
    count = 0
    for passage in passages:
        for phrase in passage['phrases']:
            if phrase.get('phraseMeaning', '') == '[要修正]':
                text = ' '.join(phrase['words'])
                print(f"  {text}")
                count += 1
                if count >= 20:
                    break
        if count >= 20:
            break

# 統計
total_phrases = sum(len(p['phrases']) for p in passages)
complete = total_phrases - still_needs_fix

print(f"\n全体統計:")
print(f"  総フレーズ数: {total_phrases}")
print(f"  完全な和訳: {complete} ({complete/total_phrases*100:.1f}%)")
print(f"  要修正: {still_needs_fix} ({still_needs_fix/total_phrases*100:.1f}%)")

# 保存確認
confirm = input("\nこの変更を保存しますか？ (yes/no): ")

if confirm.lower() == 'yes':
    with open('public/data/reading-passages-comprehensive.json', 'w', encoding='utf-8') as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 変更を保存しました")
    
    if still_needs_fix > 0:
        print(f"\n⚠️  注意: {still_needs_fix}フレーズは手動で修正が必要です")
else:
    print("\n❌ 変更をキャンセルしました")
