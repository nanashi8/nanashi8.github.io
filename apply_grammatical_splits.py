import json
import copy

# 正しい分割ルール:
# 1. "of our time" は前置詞句として "challenge" を修飾するので分割しない
# 2. "that threaten our future" は関係代名詞節なので分割する
# 3. "and" は等位接続詞だが、文脈による
# 4. "for survival" は前置詞句として "essential" を修飾するので分割する

# 手動で正しい分割を定義
correct_splits = {
    "Sustainability is the defining challenge of our time .": [
        {
            "words": ["Sustainability", "is", "the", "defining", "challenge"],
            "meaning": "持続可能性は決定的な課題です"
        },
        {
            "words": ["of", "our", "time", "."],
            "meaning": "私たちの時代の"
        }
    ],
    "We face environmental crises that threaten our future .": [
        {
            "words": ["We", "face", "environmental", "crises"],
            "meaning": "私たちは環境危機に直面しています"
        },
        {
            "words": ["that", "threaten", "our", "future", "."],
            "meaning": "それは私たちの未来を脅かします"
        }
    ],
    "Climate change resource depletion and pollution require urgent action .": [
        {
            "words": ["Climate", "change"],
            "meaning": "気候変動"
        },
        {
            "words": ["resource", "depletion"],
            "meaning": "資源枯渇"
        },
        {
            "words": ["and", "pollution"],
            "meaning": "と汚染"
        },
        {
            "words": ["require", "urgent", "action", "."],
            "meaning": "は緊急の行動を必要とします"
        }
    ],
    "It is essential for survival .": [
        {
            "words": ["It", "is", "essential"],
            "meaning": "それは不可欠です"
        },
        {
            "words": ["for", "survival", "."],
            "meaning": "生存のために"
        }
    ]
}

def apply_correct_splits(passages):
    """
    全パッセージに正しい分割を適用
    """
    new_passages = []
    
    for passage in passages:
        new_passage = copy.deepcopy(passage)
        new_phrases = []
        phrase_counter = 1
        
        for phrase in passage['phrases']:
            # 現在のフレーズのテキスト
            original_text = ' '.join(phrase['words'])
            
            # 正しい分割が定義されているか確認
            if original_text in correct_splits:
                splits = correct_splits[original_text]
                
                # 各分割に対して新しいフレーズを作成
                for split in splits:
                    new_phrase = {
                        'id': f"phrase-{phrase_counter}",
                        'words': split['words'],
                        'phraseMeaning': split['meaning'],
                        'segments': []
                    }
                    
                    # セグメントを作成
                    for word in split['words']:
                        # 元のセグメントから意味を取得
                        clean_word = word.rstrip('.,;:!?')
                        meaning = '-'
                        
                        for seg in phrase.get('segments', []):
                            if seg['word'] == word or seg['word'] == clean_word:
                                meaning = seg.get('meaning', '-')
                                break
                        
                        new_phrase['segments'].append({
                            'word': word,
                            'meaning': meaning,
                            'isUnknown': False
                        })
                    
                    new_phrases.append(new_phrase)
                    phrase_counter += 1
            else:
                # 分割しない場合はそのまま保持
                phrase_copy = copy.deepcopy(phrase)
                phrase_copy['id'] = f"phrase-{phrase_counter}"
                new_phrases.append(phrase_copy)
                phrase_counter += 1
        
        new_passage['phrases'] = new_phrases
        # actualWordCountは変わらない
        new_passages.append(new_passage)
    
    return new_passages

# テスト実行
with open('public/data/reading-passages-comprehensive.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

print("変更前のフレーズ数:")
for p in passages:
    print(f"  {p['title']}: {len(p['phrases'])}フレーズ")

# 最初のパッセージで確認
print("\n最初のパッセージの変更内容:")
new_passages = apply_correct_splits(passages)

print(f"\n変更後の最初の10フレーズ:")
for i, phrase in enumerate(new_passages[0]['phrases'][:10], 1):
    print(f"{i}. {' '.join(phrase['words'])}")
    print(f"   → {phrase['phraseMeaning']}\n")

# 確認を求める
confirm = input("\nこの変更を適用しますか？ (yes/no): ")

if confirm.lower() == 'yes':
    with open('public/data/reading-passages-comprehensive.json', 'w', encoding='utf-8') as f:
        json.dump(new_passages, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 変更を保存しました")
    print("\n変更後のフレーズ数:")
    for p in new_passages:
        print(f"  {p['title']}: {len(p['phrases'])}フレーズ")
else:
    print("\n❌ 変更をキャンセルしました")
