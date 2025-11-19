import json

def fix_phrase_meanings(passages):
    """
    分割されたフレーズの和訳を修正
    """
    fixed_count = 0
    
    for passage in passages:
        for i, phrase in enumerate(passage['phrases']):
            # 和訳が空の場合、前後から推測
            if not phrase.get('phraseMeaning', '').strip():
                # フレーズの内容から和訳を生成
                words = phrase['words']
                text = ' '.join(words)
                
                # 前置詞句の場合
                if words[0].lower() in ['of', 'for', 'in', 'on', 'at', 'to', 'from', 'with', 'about', 'without']:
                    # セグメントから意味を結合
                    meanings = []
                    for seg in phrase.get('segments', []):
                        meaning = seg.get('meaning', '')
                        if meaning and meaning != '-':
                            meanings.append(meaning)
                    
                    if meanings:
                        phrase['phraseMeaning'] = ''.join(meanings)
                        fixed_count += 1
                
                # 等位接続詞で始まる場合
                elif words[0].lower() in ['and', 'but', 'or', 'so', 'yet']:
                    meanings = []
                    for seg in phrase.get('segments', []):
                        meaning = seg.get('meaning', '')
                        if meaning and meaning != '-':
                            meanings.append(meaning)
                    
                    if meanings:
                        phrase['phraseMeaning'] = ''.join(meanings)
                        fixed_count += 1
                
                # 関係代名詞で始まる場合
                elif words[0].lower() in ['that', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why']:
                    meanings = []
                    for seg in phrase.get('segments', []):
                        meaning = seg.get('meaning', '')
                        if meaning and meaning != '-':
                            meanings.append(meaning)
                    
                    if meanings:
                        phrase['phraseMeaning'] = ''.join(meanings)
                        fixed_count += 1
    
    return passages, fixed_count

# メイン処理
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

print("=" * 80)
print("和訳の補完")
print("=" * 80)

# 和訳が空のフレーズをカウント
empty_meanings = 0
for passage in passages:
    for phrase in passage['phrases']:
        if not phrase.get('phraseMeaning', '').strip():
            empty_meanings += 1

print(f"\n和訳が空のフレーズ: {empty_meanings}")

# 修正
passages, fixed_count = fix_phrase_meanings(passages)

print(f"修正したフレーズ: {fixed_count}")
print(f"残りの空フレーズ: {empty_meanings - fixed_count}")

# サンプル表示
print("\n" + "=" * 80)
print("【修正例】最初のパッセージの最初の20フレーズ:")
print("=" * 80)
for i, phrase in enumerate(passages[0]['phrases'][:20], 1):
    text = ' '.join(phrase['words'])
    meaning = phrase.get('phraseMeaning', '')
    status = "✅" if meaning else "⚠️ "
    print(f"{status} {i}. {text}")
    if meaning:
        print(f"      → {meaning}")
    print()

# 保存確認
confirm = input("\nこの変更を保存しますか？ (yes/no): ")

if confirm.lower() == 'yes':
    with open('public/data/reading-passages-comprehensive.json', 'w', encoding='utf-8') as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 変更を保存しました")
else:
    print("\n❌ 変更をキャンセルしました")
