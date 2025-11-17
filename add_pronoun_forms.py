import csv

# 代名詞の変化形辞書
PRONOUN_CONJUGATIONS = {
    'i': {
        'possessive': 'my',
        'objective': 'me',
        'possessive_pronoun': 'mine',
        'reading': {
            'subjective': 'アイ',
            'possessive': 'マイ',
            'objective': 'ミー',
            'possessive_pronoun': 'マイン'
        },
        'meaning': {
            'subjective': '私は',
            'possessive': '私の',
            'objective': '私を・私に',
            'possessive_pronoun': '私のもの'
        }
    },
    'you': {
        'possessive': 'your',
        'objective': 'you',
        'possessive_pronoun': 'yours',
        'reading': {
            'subjective': 'ユー',
            'possessive': 'ユア',
            'objective': 'ユー',
            'possessive_pronoun': 'ユアズ'
        },
        'meaning': {
            'subjective': 'あなたは',
            'possessive': 'あなたの',
            'objective': 'あなたを・あなたに',
            'possessive_pronoun': 'あなたのもの'
        }
    },
    'he': {
        'possessive': 'his',
        'objective': 'him',
        'possessive_pronoun': 'his',
        'reading': {
            'subjective': 'ヒー',
            'possessive': 'ヒズ',
            'objective': 'ヒム',
            'possessive_pronoun': 'ヒズ'
        },
        'meaning': {
            'subjective': '彼は',
            'possessive': '彼の',
            'objective': '彼を・彼に',
            'possessive_pronoun': '彼のもの'
        }
    },
    'she': {
        'possessive': 'her',
        'objective': 'her',
        'possessive_pronoun': 'hers',
        'reading': {
            'subjective': 'シー',
            'possessive': 'ハー',
            'objective': 'ハー',
            'possessive_pronoun': 'ハーズ'
        },
        'meaning': {
            'subjective': '彼女は',
            'possessive': '彼女の',
            'objective': '彼女を・彼女に',
            'possessive_pronoun': '彼女のもの'
        }
    },
    'it': {
        'possessive': 'its',
        'objective': 'it',
        'possessive_pronoun': 'its',
        'reading': {
            'subjective': 'イット',
            'possessive': 'イッツ',
            'objective': 'イット',
            'possessive_pronoun': 'イッツ'
        },
        'meaning': {
            'subjective': 'それは',
            'possessive': 'それの',
            'objective': 'それを・それに',
            'possessive_pronoun': 'それのもの'
        }
    },
    'we': {
        'possessive': 'our',
        'objective': 'us',
        'possessive_pronoun': 'ours',
        'reading': {
            'subjective': 'ウィー',
            'possessive': 'アワー',
            'objective': 'アス',
            'possessive_pronoun': 'アワーズ'
        },
        'meaning': {
            'subjective': '私たちは',
            'possessive': '私たちの',
            'objective': '私たちを・私たちに',
            'possessive_pronoun': '私たちのもの'
        }
    },
    'they': {
        'possessive': 'their',
        'objective': 'them',
        'possessive_pronoun': 'theirs',
        'reading': {
            'subjective': 'ゼイ',
            'possessive': 'ゼア',
            'objective': 'ゼム',
            'possessive_pronoun': 'ゼアズ'
        },
        'meaning': {
            'subjective': '彼らは',
            'possessive': '彼らの',
            'objective': '彼らを・彼らに',
            'possessive_pronoun': '彼らのもの'
        }
    }
}

def add_pronoun_forms_to_related_words(word, related_words):
    """代名詞の変化形を関連語に追加"""
    if word.lower() not in PRONOUN_CONJUGATIONS:
        return related_words
    
    pron = PRONOUN_CONJUGATIONS[word.lower()]
    
    # 既存の関連語がある場合はカンマで区切る
    if related_words and related_words.strip():
        prefix = related_words + ', '
    else:
        prefix = ''
    
    # 変化形を追加
    forms_str = (
        f"(代名詞){word}({pron['reading']['subjective']}):{pron['meaning']['subjective']}, "
        f"{pron['possessive']}({pron['reading']['possessive']}):{pron['meaning']['possessive']}, "
        f"{pron['objective']}({pron['reading']['objective']}):{pron['meaning']['objective']}, "
        f"{pron['possessive_pronoun']}({pron['reading']['possessive_pronoun']}):{pron['meaning']['possessive_pronoun']}"
    )
    
    return prefix + forms_str

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
            
            # 代名詞の変化形を追加
            new_related_words = add_pronoun_forms_to_related_words(word, related_words)
            
            if new_related_words != related_words:
                row[4] = new_related_words
                updated_count += 1
                print(f"Updated: {word}")
            
            rows.append(row)

# 更新されたCSVを保存
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"\n✅ 完了: {updated_count}個の代名詞に変化形を追加しました")
print(f"出力ファイル: {output_file}")
print("\n確認後、以下のコマンドで元のファイルを置き換えてください:")
print(f"mv {output_file} {input_file}")
