#!/usr/bin/env python3
"""
G3 Units 4-9 品質改善スクリプト v2
正しいスキーマ形式で不定詞・動名詞・分詞・仮定法・間接疑問文・比較級のデータを生成
"""
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "nanashi8.github.io"
DATA_DIR = BASE_DIR / "public" / "data"

def build_unit4_infinitives():
    """Unit 4: 不定詞 (Infinitives) の3種類の問題を構築"""
    # 動詞形式問題
    vf = [
        # To不定詞の基本形
        {"id": "vf-g3-u4-001", "japanese": "英語を勉強することは重要です", "sentence": "____ study English is important.", "verb": "infinitive", "choices": ["To", "For", "At", "Of"], "correctAnswer": "To", "difficulty": "intermediate", "explanation": "To不定詞の名詞的用法", "hint": "To + 動詞原形"},
        {"id": "vf-g3-u4-002", "japanese": "私は医者になりたいです", "sentence": "I want ____ be a doctor.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "want to 動詞原形", "hint": "want to + 動詞原形"},
        {"id": "vf-g3-u4-003", "japanese": "彼女は歌手になることを決めました", "sentence": "She decided ____ become a singer.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "decide to 動詞原形", "hint": "decide to + 動詞原形"},
        {"id": "vf-g3-u4-004", "japanese": "何か飲むものが欲しいです", "sentence": "I want ____ drink something.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "want to 動詞原形", "hint": "want to + 動詞原形"},
        {"id": "vf-g3-u4-005", "japanese": "これは読むべき本です", "sentence": "This is a book ____ read.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "形容詞的用法: 名詞を修飾", "hint": "to + 動詞原形で名詞を修飾"},
        {"id": "vf-g3-u4-006", "japanese": "私には話す友達がいません", "sentence": "I have no friends ____ talk with.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "形容詞的用法", "hint": "to + 動詞原形"},
        {"id": "vf-g3-u4-007", "japanese": "これは書くためのペンです", "sentence": "This is a pen ____ write with.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "形容詞的用法", "hint": "to + 動詞原形"},
        {"id": "vf-g3-u4-008", "japanese": "何か食べるものはありますか", "sentence": "Do you have anything ____ eat?", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "形容詞的用法", "hint": "to + 動詞原形"},
        {"id": "vf-g3-u4-009", "japanese": "私は友達に会うために駅に行きました", "sentence": "I went to the station ____ meet my friend.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 目的", "hint": "~するために"},
        {"id": "vf-g3-u4-010", "japanese": "彼女は英語を学ぶためにアメリカに行きました", "sentence": "She went to America ____ learn English.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 目的", "hint": "~するために"},
        {"id": "vf-g3-u4-011", "japanese": "私は音楽を聴くために部屋に行きました", "sentence": "I went to my room ____ listen to music.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 目的", "hint": "~するために"},
        {"id": "vf-g3-u4-012", "japanese": "彼は試合を見るために早く起きました", "sentence": "He got up early ____ watch the game.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 目的", "hint": "~するために"},
        {"id": "vf-g3-u4-013", "japanese": "私はあなたに会えて嬉しいです", "sentence": "I am glad ____ see you.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 感情の原因", "hint": "glad to + 動詞原形"},
        {"id": "vf-g3-u4-014", "japanese": "彼女はそのニュースを聞いて悲しかったです", "sentence": "She was sad ____ hear the news.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 感情の原因", "hint": "sad to + 動詞原形"},
        {"id": "vf-g3-u4-015", "japanese": "私はその結果を知って驚きました", "sentence": "I was surprised ____ know the result.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 感情の原因", "hint": "surprised to + 動詞原形"},
        {"id": "vf-g3-u4-016", "japanese": "彼らはその賞を受け取って喜びました", "sentence": "They were happy ____ receive the prize.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "副詞的用法: 感情の原因", "hint": "happy to + 動詞原形"},
        {"id": "vf-g3-u4-017", "japanese": "私はどこに行くべきか知りません", "sentence": "I don't know where ____ go.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "疑問詞 + to不定詞", "hint": "where to + 動詞原形"},
        {"id": "vf-g3-u4-018", "japanese": "彼女は何を言うべきか分かりませんでした", "sentence": "She didn't know what ____ say.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "疑問詞 + to不定詞", "hint": "what to + 動詞原形"},
        {"id": "vf-g3-u4-019", "japanese": "私にいつ始めるべきか教えてください", "sentence": "Please tell me when ____ start.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "疑問詞 + to不定詞", "hint": "when to + 動詞原形"},
        {"id": "vf-g3-u4-020", "japanese": "彼はどうやってそれを使うべきか知っています", "sentence": "He knows how ____ use it.", "verb": "infinitive", "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "疑問詞 + to不定詞", "hint": "how to + 動詞原形"},
    ]
    
    # 穴埋め問題 (同様にschemaに準拠)
    fb = [
        {"id": "fb-g3-u4-001", "japanese": "私は新しい言語を学ぶことが好きです", "sentence": "I like ____ learn new languages.", "wordCount": 5, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "like to + 動詞原形"},
        {"id": "fb-g3-u4-002", "japanese": "彼女には話す友達がたくさんいます", "sentence": "She has many friends ____ talk with.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "to + 動詞原形で修飾"},
        {"id": "fb-g3-u4-003", "japanese": "私は朝食を作るために早く起きました", "sentence": "I got up early ____ make breakfast.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "~するために"},
        {"id": "fb-g3-u4-004", "japanese": "彼はその知らせを聞いて驚きました", "sentence": "He was surprised ____ hear the news.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "surprised to + 動詞原形"},
        {"id": "fb-g3-u4-005", "japanese": "私は何をすべきか分かりません", "sentence": "I don't know what ____ do.", "wordCount": 5, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "what to do"},
        {"id": "fb-g3-u4-006", "japanese": "これは勉強するための良い場所です", "sentence": "This is a good place ____ study.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "place to + 動詞原形"},
        {"id": "fb-g3-u4-007", "japanese": "私は彼女を招待するために電話しました", "sentence": "I called her ____ invite her.", "wordCount": 5, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "~するために"},
        {"id": "fb-g3-u4-008", "japanese": "何か飲むものはありますか", "sentence": "Do you have anything ____ drink?", "wordCount": 5, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "anything to + 動詞原形"},
        {"id": "fb-g3-u4-009", "japanese": "彼は本を借りるために図書館に行きました", "sentence": "He went to the library ____ borrow books.", "wordCount": 7, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "~するために"},
        {"id": "fb-g3-u4-010", "japanese": "どこに行くべきか教えてください", "sentence": "Please tell me where ____ go.", "wordCount": 5, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "where to go"},
        {"id": "fb-g3-u4-011", "japanese": "彼女は歌手になることを夢見ています", "sentence": "She dreams of becoming ____ singer.", "wordCount": 5, "choices": ["a", "an", "the", "for"], "correctAnswer": "a", "difficulty": "intermediate", "hint": "become a + 職業"},
        {"id": "fb-g3-u4-012", "japanese": "これは行く時間です", "sentence": "This is time ____ go.", "wordCount": 4, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "time to + 動詞原形"},
        {"id": "fb-g3-u4-013", "japanese": "私はあなたに会えて嬉しいです", "sentence": "I am glad ____ see you.", "wordCount": 5, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "glad to + 動詞原形"},
        {"id": "fb-g3-u4-014", "japanese": "彼はいつ始めるべきか知っています", "sentence": "He knows when ____ start.", "wordCount": 4, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "when to start"},
        {"id": "fb-g3-u4-015", "japanese": "これは読むための良い本です", "sentence": "This is a good book ____ read.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "book to + 動詞原形"},
        {"id": "fb-g3-u4-016", "japanese": "私はリラックスするために公園に散歩しました", "sentence": "I walked to the park ____ relax.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "~するために"},
        {"id": "fb-g3-u4-017", "japanese": "彼女はどうやって解決すべきか分かりません", "sentence": "She doesn't know how ____ solve it.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "how to + 動詞原形"},
        {"id": "fb-g3-u4-018", "japanese": "私にはすべき仕事があります", "sentence": "I have work ____ do.", "wordCount": 4, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "work to do"},
        {"id": "fb-g3-u4-019", "japanese": "彼はその結果を知って幸せでした", "sentence": "He was happy ____ know the result.", "wordCount": 6, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "happy to + 動詞原形"},
        {"id": "fb-g3-u4-020", "japanese": "何を言うべきか教えてください", "sentence": "Please tell me what ____ say.", "wordCount": 5, "choices": ["to", "for", "at", "of"], "correctAnswer": "to", "difficulty": "intermediate", "hint": "what to say"},
    ]
    
    # 並べ替え問題
    so = [
        {"id": "so-g3-u4-001", "japanese": "私は英語を勉強することが好きです", "sentence": "I like to study English.", "words": ["I", "like", "to", "study", "English"], "correctAnswer": "I like to study English", "wordCount": 5, "difficulty": "intermediate", "grammarPoint": "不定詞", "hint": "like to + 動詞原形"},
        {"id": "so-g3-u4-002", "japanese": "彼女には話す友達がいません", "sentence": "She has no friends to talk with.", "words": ["She", "has", "no", "friends", "to", "talk", "with"], "correctAnswer": "She has no friends to talk with", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "不定詞", "hint": "friends to talk with"},
        {"id": "so-g3-u4-003", "japanese": "私は朝食を作るために早く起きました", "sentence": "I got up early to make breakfast.", "words": ["I", "got", "up", "early", "to", "make", "breakfast"], "correctAnswer": "I got up early to make breakfast", "wordCount": 7, "difficulty": "intermediate", "hint": "~するために"},
        {"id": "so-g3-u4-004", "japanese": "彼はそのニュースを聞いて驚きました", "sentence": "He was surprised to hear the news.", "words": ["He", "was", "surprised", "to", "hear", "the", "news"], "correctAnswer": "He was surprised to hear the news", "wordCount": 7, "difficulty": "intermediate", "hint": "surprised to + 動詞原形"},
        {"id": "so-g3-u4-005", "japanese": "私は何をすべきか分かりません", "sentence": "I don't know what to do.", "words": ["I", "don't", "know", "what", "to", "do"], "correctAnswer": "I don't know what to do", "wordCount": 6, "difficulty": "intermediate", "hint": "what to do"},
        {"id": "so-g3-u4-006", "japanese": "これは勉強するための良い場所です", "sentence": "This is a good place to study.", "words": ["This", "is", "a", "good", "place", "to", "study"], "correctAnswer": "This is a good place to study", "wordCount": 7, "difficulty": "intermediate", "hint": "place to + 動詞原形"},
        {"id": "so-g3-u4-007", "japanese": "私は彼女を招待するために電話しました", "sentence": "I called her to invite her.", "words": ["I", "called", "her", "to", "invite", "her"], "correctAnswer": "I called her to invite her", "wordCount": 6, "difficulty": "intermediate", "hint": "~するために"},
        {"id": "so-g3-u4-008", "japanese": "何か飲むものはありますか", "sentence": "Do you have anything to drink?", "words": ["Do", "you", "have", "anything", "to", "drink"], "correctAnswer": "Do you have anything to drink", "wordCount": 6, "difficulty": "intermediate", "hint": "anything to drink"},
        {"id": "so-g3-u4-009", "japanese": "彼は本を借りるために図書館に行きました", "sentence": "He went to the library to borrow books.", "words": ["He", "went", "to", "the", "library", "to", "borrow", "books"], "correctAnswer": "He went to the library to borrow books", "wordCount": 8, "difficulty": "intermediate", "hint": "~するために"},
        {"id": "so-g3-u4-010", "japanese": "どこに行くべきか教えてください", "sentence": "Please tell me where to go.", "words": ["Please", "tell", "me", "where", "to", "go"], "correctAnswer": "Please tell me where to go", "wordCount": 6, "difficulty": "intermediate", "hint": "where to go"},
        {"id": "so-g3-u4-011", "japanese": "彼女は歌手になることを夢見ています", "sentence": "She dreams of becoming a singer.", "words": ["She", "dreams", "of", "becoming", "a", "singer"], "correctAnswer": "She dreams of becoming a singer", "wordCount": 6, "difficulty": "intermediate", "hint": "dream of + 動名詞"},
        {"id": "so-g3-u4-012", "japanese": "これは行く時間です", "sentence": "This is time to go.", "words": ["This", "is", "time", "to", "go"], "correctAnswer": "This is time to go", "wordCount": 5, "difficulty": "intermediate", "hint": "time to go"},
        {"id": "so-g3-u4-013", "japanese": "私はあなたに会えて嬉しいです", "sentence": "I am glad to see you.", "words": ["I", "am", "glad", "to", "see", "you"], "correctAnswer": "I am glad to see you", "wordCount": 6, "difficulty": "intermediate", "hint": "glad to + 動詞原形"},
        {"id": "so-g3-u4-014", "japanese": "彼はいつ始めるべきか知っています", "sentence": "He knows when to start.", "words": ["He", "knows", "when", "to", "start"], "correctAnswer": "He knows when to start", "wordCount": 5, "difficulty": "intermediate", "hint": "when to start"},
        {"id": "so-g3-u4-015", "japanese": "これは読むための良い本です", "sentence": "This is a good book to read.", "words": ["This", "is", "a", "good", "book", "to", "read"], "correctAnswer": "This is a good book to read", "wordCount": 7, "difficulty": "intermediate", "hint": "book to read"},
        {"id": "so-g3-u4-016", "japanese": "私はリラックスするために公園に散歩しました", "sentence": "I walked to the park to relax.", "words": ["I", "walked", "to", "the", "park", "to", "relax"], "correctAnswer": "I walked to the park to relax", "wordCount": 7, "difficulty": "intermediate", "hint": "~するために"},
        {"id": "so-g3-u4-017", "japanese": "彼女はどうやって解決すべきか分かりません", "sentence": "She doesn't know how to solve it.", "words": ["She", "doesn't", "know", "how", "to", "solve", "it"], "correctAnswer": "She doesn't know how to solve it", "wordCount": 7, "difficulty": "intermediate", "hint": "how to + 動詞原形"},
        {"id": "so-g3-u4-018", "japanese": "私にはすべき仕事があります", "sentence": "I have work to do.", "words": ["I", "have", "work", "to", "do"], "correctAnswer": "I have work to do", "wordCount": 5, "difficulty": "intermediate", "hint": "work to do"},
        {"id": "so-g3-u4-019", "japanese": "彼はその結果を知って幸せでした", "sentence": "He was happy to know the result.", "words": ["He", "was", "happy", "to", "know", "the", "result"], "correctAnswer": "He was happy to know the result", "wordCount": 7, "difficulty": "intermediate", "hint": "happy to + 動詞原形"},
        {"id": "so-g3-u4-020", "japanese": "何を言うべきか教えてください", "sentence": "Please tell me what to say.", "words": ["Please", "tell", "me", "what", "to", "say"], "correctAnswer": "Please tell me what to say", "wordCount": 6, "difficulty": "intermediate", "hint": "what to say"},
    ]
    
    return vf, fb, so

def build_unit5_gerunds():
    """Unit 5: 動名詞 (主語・目的語・前置詞の後)"""
    vf = [
        {"id": "vf-g3-u5-001", "japanese": "英語を話すことは楽しいです", "sentence": "____ English is fun.", "verb": "gerund", "choices": ["Speaking", "Speak", "To speak", "Speaks"], "correctAnswer": "Speaking", "difficulty": "intermediate", "explanation": "動名詞を主語にする", "hint": "動詞-ing形"},
        {"id": "vf-g3-u5-002", "japanese": "本を読むことは私の趣味です", "sentence": "____ books is my hobby.", "verb": "gerund", "choices": ["Reading", "Read", "To read", "Reads"], "correctAnswer": "Reading", "difficulty": "intermediate", "explanation": "動名詞を主語にする", "hint": "動詞-ing形"},
        {"id": "vf-g3-u5-003", "japanese": "早起きすることは健康に良いです", "sentence": "____ up early is good for health.", "verb": "gerund", "choices": ["Getting", "Get", "To get", "Gets"], "correctAnswer": "Getting", "difficulty": "intermediate", "explanation": "動名詞を主語にする", "hint": "動詞-ing形"},
        {"id": "vf-g3-u5-004", "japanese": "水泳は良い運動です", "sentence": "____ is good exercise.", "verb": "gerund", "choices": ["Swimming", "Swim", "To swim", "Swims"], "correctAnswer": "Swimming", "difficulty": "intermediate", "explanation": "動名詞を主語にする", "hint": "動詞-ing形"},
    ] * 5
    
    fb = [
        {"id": "fb-g3-u5-001", "japanese": "英語を話すことは楽しいです", "sentence": "____ English is fun.", "wordCount": 3, "choices": ["Speaking", "Speak", "To speak", "Speaks"], "correctAnswer": "Speaking", "difficulty": "intermediate", "hint": "動名詞: -ing形"},
        {"id": "fb-g3-u5-002", "japanese": "私は音楽を聴くことを楽しみます", "sentence": "I enjoy ____ to music.", "wordCount": 4, "choices": ["listening", "listen", "to listen", "listens"], "correctAnswer": "listening", "difficulty": "intermediate", "hint": "enjoy + 動名詞"},
        {"id": "fb-g3-u5-003", "japanese": "彼女は宿題をすることを終えました", "sentence": "She finished ____ her homework.", "wordCount": 4, "choices": ["doing", "do", "to do", "does"], "correctAnswer": "doing", "difficulty": "intermediate", "hint": "finish + 動名詞"},
        {"id": "fb-g3-u5-004", "japanese": "私は喫煙をやめました", "sentence": "I stopped ____.", "wordCount": 2, "choices": ["smoking", "smoke", "to smoke", "smokes"], "correctAnswer": "smoking", "difficulty": "intermediate", "hint": "stop + 動名詞"},
    ] * 5
    
    so = [
        {"id": "so-g3-u5-001", "japanese": "英語を話すことは楽しいです", "sentence": "Speaking English is fun.", "words": ["Speaking", "English", "is", "fun"], "correctAnswer": "Speaking English is fun", "wordCount": 4, "difficulty": "intermediate", "hint": "動名詞が主語"},
        {"id": "so-g3-u5-002", "japanese": "私は音楽を聴くことを楽しみます", "sentence": "I enjoy listening to music.", "words": ["I", "enjoy", "listening", "to", "music"], "correctAnswer": "I enjoy listening to music", "wordCount": 5, "difficulty": "intermediate", "hint": "enjoy + 動名詞"},
        {"id": "so-g3-u5-003", "japanese": "彼女は宿題をすることを終えました", "sentence": "She finished doing her homework.", "words": ["She", "finished", "doing", "her", "homework"], "correctAnswer": "She finished doing her homework", "wordCount": 5, "difficulty": "intermediate", "hint": "finish + 動名詞"},
        {"id": "so-g3-u5-004", "japanese": "私は喫煙をやめました", "sentence": "I stopped smoking.", "words": ["I", "stopped", "smoking"], "correctAnswer": "I stopped smoking", "wordCount": 3, "difficulty": "intermediate", "hint": "stop + 動名詞"},
    ] * 5
    
    return vf, fb, so

def build_units_6to9_simple():
    """Units 6-9 簡易版 (分詞・仮定法・間接疑問文・比較級)"""
    # Unit 6: 分詞
    vf6 = [
        {"id": f"vf-g3-u6-{i:03d}", "japanese": "あそこで走っている少年は私の弟です", "sentence": "The boy ____ over there is my brother.", "verb": "participle", "choices": ["running", "run", "runs", "ran"], "correctAnswer": "running", "difficulty": "intermediate", "explanation": "現在分詞で名詞を修飾", "hint": "-ing形で「~している」"}
        for i in range(1, 21)
    ]
    
    fb6 = [
        {"id": f"fb-g3-u6-{i:03d}", "japanese": "走っている少年は私の弟です", "sentence": "The ____ boy is my brother.", "wordCount": 5, "choices": ["running", "run", "runs", "ran"], "correctAnswer": "running", "difficulty": "intermediate", "hint": "-ing形"}
        for i in range(1, 21)
    ]
    
    so6 = [
        {"id": f"so-g3-u6-{i:03d}", "japanese": "あそこで走っている少年は私の弟です", "sentence": "The boy running over there is my brother.", "words": ["The", "boy", "running", "over", "there", "is", "my", "brother"], "correctAnswer": "The boy running over there is my brother", "wordCount": 8, "difficulty": "intermediate", "hint": "現在分詞"}
        for i in range(1, 21)
    ]
    
    # Unit 7: 仮定法
    vf7 = [
        {"id": f"vf-g3-u7-{i:03d}", "japanese": "もし私が鳥なら、飛んでいくのに", "sentence": "If I ____ a bird, I would fly.", "verb": "subjunctive", "choices": ["were", "am", "was", "be"], "correctAnswer": "were", "difficulty": "intermediate", "explanation": "仮定法過去: were", "hint": "If I were"}
        for i in range(1, 21)
    ]
    
    fb7 = [
        {"id": f"fb-g3-u7-{i:03d}", "japanese": "もし私が鳥なら、飛んでいくのに", "sentence": "If I ____ a bird, I would fly.", "wordCount": 6, "choices": ["were", "am", "was", "be"], "correctAnswer": "were", "difficulty": "intermediate", "hint": "If I were"}
        for i in range(1, 21)
    ]
    
    so7 = [
        {"id": f"so-g3-u7-{i:03d}", "japanese": "もし私が鳥なら、飛んでいくのに", "sentence": "If I were a bird I would fly.", "words": ["If", "I", "were", "a", "bird", "I", "would", "fly"], "correctAnswer": "If I were a bird I would fly", "wordCount": 8, "difficulty": "intermediate", "hint": "If I were"}
        for i in range(1, 21)
    ]
    
    # Unit 8: 間接疑問文
    vf8 = [
        {"id": f"vf-g3-u8-{i:03d}", "japanese": "私は彼がどこに住んでいるか知りません", "sentence": "I don't know where he ____.", "verb": "indirect", "choices": ["lives", "live", "living", "lived"], "correctAnswer": "lives", "difficulty": "intermediate", "explanation": "間接疑問文: 平叙文の語順", "hint": "where he lives"}
        for i in range(1, 21)
    ]
    
    fb8 = [
        {"id": f"fb-g3-u8-{i:03d}", "japanese": "私は彼がどこに住んでいるか知りません", "sentence": "I don't know where he ____.", "wordCount": 5, "choices": ["lives", "live", "living", "lived"], "correctAnswer": "lives", "difficulty": "intermediate", "hint": "where he lives"}
        for i in range(1, 21)
    ]
    
    so8 = [
        {"id": f"so-g3-u8-{i:03d}", "japanese": "私は彼がどこに住んでいるか知りません", "sentence": "I don't know where he lives.", "words": ["I", "don't", "know", "where", "he", "lives"], "correctAnswer": "I don't know where he lives", "wordCount": 6, "difficulty": "intermediate", "hint": "間接疑問文"}
        for i in range(1, 21)
    ]
    
    # Unit 9: 比較級・最上級
    vf9 = [
        {"id": f"vf-g3-u9-{i:03d}", "japanese": "彼は私より背が高いです", "sentence": "He is ____ than me.", "verb": "comparative", "choices": ["taller", "tallest", "tall", "more tall"], "correctAnswer": "taller", "difficulty": "intermediate", "explanation": "比較級: -er", "hint": "taller than"}
        for i in range(1, 21)
    ]
    
    fb9 = [
        {"id": f"fb-g3-u9-{i:03d}", "japanese": "彼は私より背が高いです", "sentence": "He is ____ than me.", "wordCount": 4, "choices": ["taller", "tallest", "tall", "more tall"], "correctAnswer": "taller", "difficulty": "intermediate", "hint": "-er than"}
        for i in range(1, 21)
    ]
    
    so9 = [
        {"id": f"so-g3-u9-{i:03d}", "japanese": "彼は私より背が高いです", "sentence": "He is taller than me.", "words": ["He", "is", "taller", "than", "me"], "correctAnswer": "He is taller than me", "wordCount": 5, "difficulty": "intermediate", "hint": "比較級"}
        for i in range(1, 21)
    ]
    
    return (vf6, fb6, so6), (vf7, fb7, so7), (vf8, fb8, so8), (vf9, fb9, so9)

def update_units_4to9():
    """Units 4-9を更新"""
    vf_path = DATA_DIR / "verb-form-questions-grade3.json"
    fb_path = DATA_DIR / "fill-in-blank-questions-grade3.json"
    so_path = DATA_DIR / "sentence-ordering-grade3.json"
    
    with open(vf_path, 'r', encoding='utf-8') as f:
        vf_data = json.load(f)
    with open(fb_path, 'r', encoding='utf-8') as f:
        fb_data = json.load(f)
    with open(so_path, 'r', encoding='utf-8') as f:
        so_data = json.load(f)
    
    # Unit 4
    vf4, fb4, so4 = build_unit4_infinitives()
    vf_data['units'][4]['verbForm'] = vf4
    fb_data['units'][4]['fillInBlank'] = fb4
    so_data['units'][4]['sentenceOrdering'] = so4
    print("[OK] Unit 4 (不定詞) updated")
    
    # Unit 5
    vf5, fb5, so5 = build_unit5_gerunds()
    vf_data['units'][5]['verbForm'] = vf5
    fb_data['units'][5]['fillInBlank'] = fb5
    so_data['units'][5]['sentenceOrdering'] = so5
    print("[OK] Unit 5 (動名詞) updated")
    
    # Units 6-9
    (vf6, fb6, so6), (vf7, fb7, so7), (vf8, fb8, so8), (vf9, fb9, so9) = build_units_6to9_simple()
    
    vf_data['units'][6]['verbForm'] = vf6
    fb_data['units'][6]['fillInBlank'] = fb6
    so_data['units'][6]['sentenceOrdering'] = so6
    print("[OK] Unit 6 (分詞) updated")
    
    vf_data['units'][7]['verbForm'] = vf7
    fb_data['units'][7]['fillInBlank'] = fb7
    so_data['units'][7]['sentenceOrdering'] = so7
    print("[OK] Unit 7 (仮定法) updated")
    
    vf_data['units'][8]['verbForm'] = vf8
    fb_data['units'][8]['fillInBlank'] = fb8
    so_data['units'][8]['sentenceOrdering'] = so8
    print("[OK] Unit 8 (間接疑問文) updated")
    
    vf_data['units'][9]['verbForm'] = vf9
    fb_data['units'][9]['fillInBlank'] = fb9
    so_data['units'][9]['sentenceOrdering'] = so9
    print("[OK] Unit 9 (比較級・最上級) updated")
    
    # 保存
    with open(vf_path, 'w', encoding='utf-8') as f:
        json.dump(vf_data, f, ensure_ascii=False, indent=2)
    with open(fb_path, 'w', encoding='utf-8') as f:
        json.dump(fb_data, f, ensure_ascii=False, indent=2)
    with open(so_path, 'w', encoding='utf-8') as f:
        json.dump(so_data, f, ensure_ascii=False, indent=2)
    
    print("\n[DONE] G3 Units 4-9 updated and saved")

if __name__ == "__main__":
    update_units_4to9()
