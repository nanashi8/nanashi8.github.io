import csv
import sys

# 主要動詞の活用形辞書
VERB_CONJUGATIONS = {
    'go': {
        'past': 'went',
        'past_participle': 'gone',
        'third_person': 'goes',
        'reading': {
            'base': 'ゴウ',
            'past': 'ウェント',
            'past_participle': 'ゴーン',
            'third_person': 'ゴーズ'
        },
        'meaning': {
            'base': '行く',
            'past': '行った',
            'past_participle': '行ったことがある',
            'third_person': '行く(三単現)'
        }
    },
    'have': {
        'past': 'had',
        'past_participle': 'had',
        'third_person': 'has',
        'reading': {
            'base': 'ハヴ',
            'past': 'ハド',
            'past_participle': 'ハド',
            'third_person': 'ハズ'
        },
        'meaning': {
            'base': '持っている',
            'past': '持っていた',
            'past_participle': '持っていた',
            'third_person': '持っている(三単現)'
        }
    },
    'do': {
        'past': 'did',
        'past_participle': 'done',
        'third_person': 'does',
        'reading': {
            'base': 'ドゥー',
            'past': 'ディド',
            'past_participle': 'ダン',
            'third_person': 'ダズ'
        },
        'meaning': {
            'base': 'する',
            'past': 'した',
            'past_participle': 'したことがある',
            'third_person': 'する(三単現)'
        }
    },
    'make': {
        'past': 'made',
        'past_participle': 'made',
        'third_person': 'makes',
        'reading': {
            'base': 'メイク',
            'past': 'メイド',
            'past_participle': 'メイド',
            'third_person': 'メイクス'
        },
        'meaning': {
            'base': '作る',
            'past': '作った',
            'past_participle': '作ったことがある',
            'third_person': '作る(三単現)'
        }
    },
    'take': {
        'past': 'took',
        'past_participle': 'taken',
        'third_person': 'takes',
        'reading': {
            'base': 'テイク',
            'past': 'トゥック',
            'past_participle': 'テイクン',
            'third_person': 'テイクス'
        },
        'meaning': {
            'base': '取る',
            'past': '取った',
            'past_participle': '取ったことがある',
            'third_person': '取る(三単現)'
        }
    },
    'get': {
        'past': 'got',
        'past_participle': 'gotten',
        'third_person': 'gets',
        'reading': {
            'base': 'ゲット',
            'past': 'ガット',
            'past_participle': 'ガトゥン',
            'third_person': 'ゲッツ'
        },
        'meaning': {
            'base': '得る・手に入れる',
            'past': '得た',
            'past_participle': '得たことがある',
            'third_person': '得る(三単現)'
        }
    },
    'see': {
        'past': 'saw',
        'past_participle': 'seen',
        'third_person': 'sees',
        'reading': {
            'base': 'シー',
            'past': 'ソー',
            'past_participle': 'シーン',
            'third_person': 'シーズ'
        },
        'meaning': {
            'base': '見る',
            'past': '見た',
            'past_participle': '見たことがある',
            'third_person': '見る(三単現)'
        }
    },
    'come': {
        'past': 'came',
        'past_participle': 'come',
        'third_person': 'comes',
        'reading': {
            'base': 'カム',
            'past': 'ケイム',
            'past_participle': 'カム',
            'third_person': 'カムズ'
        },
        'meaning': {
            'base': '来る',
            'past': '来た',
            'past_participle': '来たことがある',
            'third_person': '来る(三単現)'
        }
    },
    'know': {
        'past': 'knew',
        'past_participle': 'known',
        'third_person': 'knows',
        'reading': {
            'base': 'ノウ',
            'past': 'ニュー',
            'past_participle': 'ノウン',
            'third_person': 'ノウズ'
        },
        'meaning': {
            'base': '知っている',
            'past': '知っていた',
            'past_participle': '知っていた',
            'third_person': '知っている(三単現)'
        }
    },
    'think': {
        'past': 'thought',
        'past_participle': 'thought',
        'third_person': 'thinks',
        'reading': {
            'base': 'シンク',
            'past': 'ソート',
            'past_participle': 'ソート',
            'third_person': 'シンクス'
        },
        'meaning': {
            'base': '考える',
            'past': '考えた',
            'past_participle': '考えたことがある',
            'third_person': '考える(三単現)'
        }
    }
}

def add_conjugation_to_related_words(word, related_words):
    """動詞の活用形を関連語に追加"""
    if word.lower() not in VERB_CONJUGATIONS:
        return related_words
    
    conj = VERB_CONJUGATIONS[word.lower()]
    
    # 既存の関連語がある場合はカンマで区切る
    if related_words and related_words.strip():
        prefix = related_words + ', '
    else:
        prefix = ''
    
    # 活用形を追加
    conjugation_str = (
        f"(動詞活用){word}({conj['reading']['base']}):{conj['meaning']['base']}, "
        f"{conj['past']}({conj['reading']['past']}):{conj['meaning']['past']}, "
        f"{conj['past_participle']}({conj['reading']['past_participle']}):{conj['meaning']['past_participle']}, "
        f"{conj['third_person']}({conj['reading']['third_person']}):{conj['meaning']['third_person']}"
    )
    
    return prefix + conjugation_str

# CSVファイルを読み込んで処理
input_file = 'public/data/junior-high-entrance-words.csv'
output_file = 'public/data/junior-high-entrance-words_updated.csv'

rows = []
updated_count = 0

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows.append(header)
    
    for row in reader:
        if len(row) >= 7:
            word = row[0].strip()
            related_words = row[4]
            
            # 動詞の活用形を追加
            new_related_words = add_conjugation_to_related_words(word, related_words)
            
            if new_related_words != related_words:
                row[4] = new_related_words
                updated_count += 1
                print(f"Updated: {word}")
            
            rows.append(row)

# 更新されたCSVを保存
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"\n✅ 完了: {updated_count}個の動詞に活用形を追加しました")
print(f"出力ファイル: {output_file}")
print("\n確認後、以下のコマンドで元のファイルを置き換えてください:")
print(f"mv {output_file} {input_file}")
