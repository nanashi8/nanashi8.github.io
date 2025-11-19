import json

def generate_phrase_meaning(phrase):
    """
    フレーズから和訳を生成
    """
    words = phrase['words']
    segments = phrase.get('segments', [])
    text = ' '.join(words).lower().strip()
    
    # セグメントから意味を取得（句読点を除く）
    meanings = []
    for seg in segments:
        word = seg.get('word', '')
        meaning = seg.get('meaning', '')
        
        # 句読点を除外
        if word not in ['.', ',', ';', ':', '!', '?', '-', '—']:
            if meaning and meaning != '-':
                meanings.append(meaning)
    
    # 意味を結合
    if meanings:
        return ''.join(meanings)
    
    # セグメントに意味がない場合、単語から推測
    # "and ..." → "〜と"
    if text.startswith('and '):
        return 'と' + ''.join(meanings) if meanings else 'と'
    
    # "or ..." → "〜または"
    if text.startswith('or '):
        return 'または' + ''.join(meanings) if meanings else 'または'
    
    # "but ..." → "〜しかし"
    if text.startswith('but '):
        return 'しかし' + ''.join(meanings) if meanings else 'しかし'
    
    return ''

def fix_all_empty_meanings(passages):
    """
    すべての空の和訳を修正
    """
    fixed_count = 0
    
    for passage in passages:
        for i, phrase in enumerate(passage['phrases']):
            # 和訳が空の場合
            if not phrase.get('phraseMeaning', '').strip():
                # 前のフレーズと結合して意味を推測
                meaning = generate_phrase_meaning(phrase)
                
                if meaning:
                    phrase['phraseMeaning'] = meaning
                    fixed_count += 1
                else:
                    # それでも意味がない場合、フレーズテキストそのままを和訳として設定
                    # (後で手動修正できるように)
                    phrase['phraseMeaning'] = '[要修正]'
                    fixed_count += 1
    
    return passages, fixed_count

# メイン処理
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

print("=" * 80)
print("すべての空の和訳を補完")
print("=" * 80)

# 和訳が空のフレーズをカウント
empty_count = 0
for passage in passages:
    for phrase in passage['phrases']:
        if not phrase.get('phraseMeaning', '').strip():
            empty_count += 1

print(f"\n和訳が空のフレーズ: {empty_count}")

# 修正
passages, fixed_count = fix_all_empty_meanings(passages)

# 再カウント
still_empty = 0
requires_fix = 0
for passage in passages:
    for phrase in passage['phrases']:
        meaning = phrase.get('phraseMeaning', '').strip()
        if not meaning:
            still_empty += 1
        elif meaning == '[要修正]':
            requires_fix += 1

print(f"修正したフレーズ: {fixed_count}")
print(f"[要修正]マーク: {requires_fix}")
print(f"完全に空: {still_empty}")

# サンプル表示
print("\n" + "=" * 80)
print("【確認】和訳の状態:")
print("=" * 80)
sample_count = 0
for passage in passages:
    for phrase in passage['phrases']:
        text = ' '.join(phrase['words'])
        meaning = phrase.get('phraseMeaning', '')
        
        if not meaning or meaning == '[要修正]':
            status = "⚠️ " if meaning == '[要修正]' else "❌"
            print(f"{status} {text[:60]:<60} → {meaning}")
            sample_count += 1
            
            if sample_count >= 30:
                break
    if sample_count >= 30:
        break

# 統計
total_phrases = sum(len(p['phrases']) for p in passages)
complete = total_phrases - still_empty - requires_fix
print(f"\n全体統計:")
print(f"  総フレーズ数: {total_phrases}")
print(f"  完全な和訳: {complete} ({complete/total_phrases*100:.1f}%)")
print(f"  要修正: {requires_fix} ({requires_fix/total_phrases*100:.1f}%)")
print(f"  空: {still_empty} ({still_empty/total_phrases*100:.1f}%)")

# 保存確認
confirm = input("\nこの変更を保存しますか？ (yes/no): ")

if confirm.lower() == 'yes':
    with open('public/data/reading-passages-comprehensive.json', 'w', encoding='utf-8') as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 変更を保存しました")
else:
    print("\n❌ 変更をキャンセルしました")
