import json

def complete_all_meanings(passages):
    """
    すべての空の和訳をセグメントから生成
    """
    fixed_count = 0
    
    for passage in passages:
        for phrase in passage['phrases']:
            # 和訳が空の場合
            if not phrase.get('phraseMeaning', '').strip():
                # セグメントから和訳を生成
                segments = phrase.get('segments', [])
                
                if segments:
                    # 全セグメントの意味を結合
                    meanings = []
                    for seg in segments:
                        meaning = seg.get('meaning', '')
                        word = seg.get('word', '')
                        
                        # 意味がある場合は追加
                        if meaning and meaning != '-':
                            # 句読点は除外
                            if word not in ['.', ',', ';', ':', '!', '?', '-']:
                                meanings.append(meaning)
                    
                    # 意味を結合
                    if meanings:
                        phrase['phraseMeaning'] = ''.join(meanings)
                        fixed_count += 1
    
    return passages, fixed_count

# メイン処理
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

print("=" * 80)
print("全フレーズの和訳を補完")
print("=" * 80)

# 和訳が空のフレーズをカウント
empty_count = 0
for passage in passages:
    for phrase in passage['phrases']:
        if not phrase.get('phraseMeaning', '').strip():
            empty_count += 1

print(f"\n和訳が空のフレーズ: {empty_count}")

# 修正
passages, fixed_count = complete_all_meanings(passages)

# 再カウント
still_empty = 0
for passage in passages:
    for phrase in passage['phrases']:
        if not phrase.get('phraseMeaning', '').strip():
            still_empty += 1

print(f"修正したフレーズ: {fixed_count}")
print(f"残りの空フレーズ: {still_empty}")

# サンプル表示
print("\n" + "=" * 80)
print("【確認】最初のパッセージの最初の30フレーズ:")
print("=" * 80)
for i, phrase in enumerate(passages[0]['phrases'][:30], 1):
    text = ' '.join(phrase['words'])
    meaning = phrase.get('phraseMeaning', '')
    status = "✅" if meaning else "❌"
    print(f"{status} {i}. {text[:50]:<50} → {meaning}")

# 統計
total_phrases = sum(len(p['phrases']) for p in passages)
with_meaning = total_phrases - still_empty
print(f"\n全体統計:")
print(f"  総フレーズ数: {total_phrases}")
print(f"  和訳あり: {with_meaning} ({with_meaning/total_phrases*100:.1f}%)")
print(f"  和訳なし: {still_empty} ({still_empty/total_phrases*100:.1f}%)")

# 保存確認
confirm = input("\nこの変更を保存しますか？ (yes/no): ")

if confirm.lower() == 'yes':
    with open('public/data/reading-passages-comprehensive.json', 'w', encoding='utf-8') as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 変更を保存しました")
else:
    print("\n❌ 変更をキャンセルしました")
