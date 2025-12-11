#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Grade 1 Unit 4: 疑問詞（what/who/when/where/how）
NEW HORIZON準拠・中1文法問題生成スクリプト
60問構成：穴埋め15、並び替え15、言い換え15、動詞変化10、日常英会話5
"""

import json
import os

def create_unit4_questions():
    """Unit 4: 疑問詞の問題60問を生成"""
    
    questions = []
    
    # ========================================
    # 穴埋め問題 (Fill in the Blank) - 15問
    # ========================================
    fill_in_blank = [
        {
            "id": "g1-u4-fib-001",
            "type": "fillInBlank",
            "japanese": "これは何ですか",
            "sentence": "____ is this?",
            "choices": ["What", "Who", "Where", "When"],
            "correctAnswer": "What",
            "difficulty": "beginner",
            "explanation": "「何」を尋ねるときはWhatを使う。最も基本的な疑問詞。",
            "hint": "「何」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-002",
            "type": "fillInBlank",
            "japanese": "あれは誰ですか",
            "sentence": "____ is that?",
            "choices": ["Who", "What", "Which", "Whose"],
            "correctAnswer": "Who",
            "difficulty": "beginner",
            "explanation": "「誰」を尋ねるときはWhoを使う。人物を特定する疑問詞。",
            "hint": "「誰」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-003",
            "type": "fillInBlank",
            "japanese": "あなたはどこに住んでいますか",
            "sentence": "____ do you live?",
            "choices": ["Where", "When", "What", "How"],
            "correctAnswer": "Where",
            "difficulty": "beginner",
            "explanation": "「どこ」を尋ねるときはWhereを使う。場所を尋ねる疑問詞。",
            "hint": "「どこ」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-004",
            "type": "fillInBlank",
            "japanese": "あなたはいつ起きますか",
            "sentence": "____ do you get up?",
            "choices": ["When", "Where", "Why", "What"],
            "correctAnswer": "When",
            "difficulty": "beginner",
            "explanation": "「いつ」を尋ねるときはWhenを使う。時間を尋ねる疑問詞。",
            "hint": "「いつ」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-005",
            "type": "fillInBlank",
            "japanese": "あなたはどうやって学校に行きますか",
            "sentence": "____ do you go to school?",
            "choices": ["How", "Where", "When", "What"],
            "correctAnswer": "How",
            "difficulty": "beginner",
            "explanation": "「どうやって」を尋ねるときはHowを使う。方法・手段を尋ねる疑問詞。",
            "hint": "「どうやって」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-006",
            "type": "fillInBlank",
            "japanese": "あの人は誰ですか",
            "sentence": "____ is that man?",
            "choices": ["Who", "What", "When", "How"],
            "correctAnswer": "Who",
            "difficulty": "beginner",
            "explanation": "「誰」を尋ねるときはWhoを使う。that manと特定の人物を指している。",
            "hint": "人物を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-007",
            "type": "fillInBlank",
            "japanese": "あなたは何を勉強しますか",
            "sentence": "____ do you study?",
            "choices": ["What", "Who", "Where", "Which"],
            "correctAnswer": "What",
            "difficulty": "beginner",
            "explanation": "「何を」を尋ねるときはWhatを使う。studyの目的語を尋ねている。",
            "hint": "「何を」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-008",
            "type": "fillInBlank",
            "japanese": "図書館はどこですか",
            "sentence": "____ is the library?",
            "choices": ["Where", "What", "Who", "When"],
            "correctAnswer": "Where",
            "difficulty": "beginner",
            "explanation": "「どこ」を尋ねるときはWhereを使う。場所を尋ねる基本形。",
            "hint": "場所を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-009",
            "type": "fillInBlank",
            "japanese": "あなたの誕生日はいつですか",
            "sentence": "____ is your birthday?",
            "choices": ["When", "Where", "What", "How"],
            "correctAnswer": "When",
            "difficulty": "beginner",
            "explanation": "「いつ」を尋ねるときはWhenを使う。birthdayの日付を尋ねている。",
            "hint": "「いつ」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-010",
            "type": "fillInBlank",
            "japanese": "あなたは何時に寝ますか",
            "sentence": "____ time do you go to bed?",
            "choices": ["What", "When", "Which", "How"],
            "correctAnswer": "What",
            "difficulty": "beginner",
            "explanation": "「何時」はWhat timeで表す。timeと組み合わせるのはWhat。",
            "hint": "「何時」はWhat ____"
        },
        {
            "id": "g1-u4-fib-011",
            "type": "fillInBlank",
            "japanese": "あなたはどのように英語を勉強しますか",
            "sentence": "____ do you learn English?",
            "choices": ["How", "What", "Why", "Where"],
            "correctAnswer": "How",
            "difficulty": "beginner",
            "explanation": "「どのように」を尋ねるときはHowを使う。学習方法を尋ねている。",
            "hint": "方法を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-012",
            "type": "fillInBlank",
            "japanese": "彼女の名前は何ですか",
            "sentence": "____ is her name?",
            "choices": ["What", "Who", "Whose", "Which"],
            "correctAnswer": "What",
            "difficulty": "beginner",
            "explanation": "「名前は何」はWhat is ~ name?の形。名前そのものを尋ねる。",
            "hint": "「名前は何」はWhat"
        },
        {
            "id": "g1-u4-fib-013",
            "type": "fillInBlank",
            "japanese": "あなたはどこで昼食を食べますか",
            "sentence": "____ do you eat lunch?",
            "choices": ["Where", "When", "What", "How"],
            "correctAnswer": "Where",
            "difficulty": "beginner",
            "explanation": "「どこで」を尋ねるときはWhereを使う。食事の場所を尋ねている。",
            "hint": "「どこで」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-014",
            "type": "fillInBlank",
            "japanese": "彼はいつ東京に行きますか",
            "sentence": "____ does he go to Tokyo?",
            "choices": ["When", "Where", "Why", "How"],
            "correctAnswer": "When",
            "difficulty": "beginner",
            "explanation": "「いつ」を尋ねるときはWhenを使う。三人称単数なのでdoesを使用。",
            "hint": "「いつ」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-fib-015",
            "type": "fillInBlank",
            "japanese": "あなたは何が好きですか",
            "sentence": "____ do you like?",
            "choices": ["What", "Who", "When", "Where"],
            "correctAnswer": "What",
            "difficulty": "beginner",
            "explanation": "「何が」を尋ねるときはWhatを使う。likeの目的語を尋ねている。",
            "hint": "「何が」を尋ねる疑問詞"
        }
    ]
    
    # ========================================
    # 並び替え問題 (Sentence Ordering) - 15問
    # ========================================
    sentence_ordering = [
        {
            "id": "g1-u4-so-001",
            "type": "sentenceOrdering",
            "japanese": "あなたは何が欲しいですか",
            "words": ["do", "want", "What", "you", "?"],
            "correctAnswer": "What do you want?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whatを文頭に置き、do you wantと続ける。疑問詞疑問文の基本語順。",
            "hint": "疑問詞 + do + 主語 + 動詞"
        },
        {
            "id": "g1-u4-so-002",
            "type": "sentenceOrdering",
            "japanese": "彼女は誰ですか",
            "sentence": "Who is she?",
            "words": ["is", "Who", "she", "?"],
            "correctAnswer": "Who is she?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whoを文頭に置き、is sheと続ける。be動詞の疑問詞疑問文。",
            "hint": "疑問詞 + be動詞 + 主語"
        },
        {
            "id": "g1-u4-so-003",
            "type": "sentenceOrdering",
            "japanese": "駅はどこですか",
            "words": ["is", "Where", "the", "station", "?"],
            "correctAnswer": "Where is the station?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whereを文頭に置き、is the stationと続ける。場所を尋ねる基本形。",
            "hint": "疑問詞 + be動詞 + 主語"
        },
        {
            "id": "g1-u4-so-004",
            "type": "sentenceOrdering",
            "japanese": "あなたはいつテニスをしますか",
            "words": ["When", "do", "you", "play", "tennis", "?"],
            "correctAnswer": "When do you play tennis?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whenを文頭に置き、do you play tennisと続ける。時を尋ねる疑問文。",
            "hint": "疑問詞 + do + 主語 + 動詞"
        },
        {
            "id": "g1-u4-so-005",
            "type": "sentenceOrdering",
            "japanese": "あなたはどうやってここに来ますか",
            "words": ["How", "do", "you", "come", "here", "?"],
            "correctAnswer": "How do you come here?",
            "difficulty": "beginner",
            "explanation": "疑問詞Howを文頭に置き、do you come hereと続ける。方法を尋ねる疑問文。",
            "hint": "疑問詞 + do + 主語 + 動詞"
        },
        {
            "id": "g1-u4-so-006",
            "type": "sentenceOrdering",
            "japanese": "あなたは何色が好きですか",
            "words": ["What", "color", "do", "you", "like", "?"],
            "correctAnswer": "What color do you like?",
            "difficulty": "beginner",
            "explanation": "What colorで「何色」を表す。疑問詞 + 名詞 + do you like。",
            "hint": "What + 名詞で具体化"
        },
        {
            "id": "g1-u4-so-007",
            "type": "sentenceOrdering",
            "japanese": "あの女性は誰ですか",
            "words": ["Who", "is", "that", "woman", "?"],
            "correctAnswer": "Who is that woman?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whoを文頭に置き、is that womanと続ける。人物を特定する疑問文。",
            "hint": "疑問詞 + be動詞 + 主語"
        },
        {
            "id": "g1-u4-so-008",
            "type": "sentenceOrdering",
            "japanese": "あなたの学校はどこですか",
            "words": ["Where", "is", "your", "school", "?"],
            "correctAnswer": "Where is your school?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whereを文頭に置き、is your schoolと続ける。所有格 + 名詞が主語。",
            "hint": "疑問詞 + be動詞 + 主語"
        },
        {
            "id": "g1-u4-so-009",
            "type": "sentenceOrdering",
            "japanese": "彼女はいつ音楽を聞きますか",
            "words": ["When", "does", "she", "listen", "to", "music", "?"],
            "correctAnswer": "When does she listen to music?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whenを文頭に置き、does she listen to musicと続ける。三人称単数形。",
            "hint": "疑問詞 + does + 主語 + 動詞"
        },
        {
            "id": "g1-u4-so-010",
            "type": "sentenceOrdering",
            "japanese": "あなたは何スポーツをしますか",
            "words": ["What", "sport", "do", "you", "play", "?"],
            "correctAnswer": "What sport do you play?",
            "difficulty": "beginner",
            "explanation": "What sportで「何スポーツ」を表す。疑問詞 + 名詞の組み合わせ。",
            "hint": "What + 名詞で具体化"
        },
        {
            "id": "g1-u4-so-011",
            "type": "sentenceOrdering",
            "japanese": "彼はどのように英語を学びますか",
            "words": ["How", "does", "he", "learn", "English", "?"],
            "correctAnswer": "How does he learn English?",
            "difficulty": "beginner",
            "explanation": "疑問詞Howを文頭に置き、does he learn Englishと続ける。方法を尋ねる。",
            "hint": "疑問詞 + does + 主語 + 動詞"
        },
        {
            "id": "g1-u4-so-012",
            "type": "sentenceOrdering",
            "japanese": "これは何の本ですか",
            "words": ["What", "book", "is", "this", "?"],
            "correctAnswer": "What book is this?",
            "difficulty": "beginner",
            "explanation": "What bookで「何の本」を表す。疑問詞 + 名詞 + be動詞。",
            "hint": "What + 名詞 + be動詞"
        },
        {
            "id": "g1-u4-so-013",
            "type": "sentenceOrdering",
            "japanese": "あなたはどこで宿題をしますか",
            "words": ["Where", "do", "you", "do", "your", "homework", "?"],
            "correctAnswer": "Where do you do your homework?",
            "difficulty": "intermediate",
            "explanation": "疑問詞Whereと一般動詞doが両方登場。1つ目は疑問詞、2つ目は「する」の意味。",
            "hint": "疑問詞 + do(助動詞) + 主語 + do(動詞)"
        },
        {
            "id": "g1-u4-so-014",
            "type": "sentenceOrdering",
            "japanese": "彼らは何時に夕食を食べますか",
            "words": ["What", "time", "do", "they", "eat", "dinner", "?"],
            "correctAnswer": "What time do they eat dinner?",
            "difficulty": "beginner",
            "explanation": "What timeで「何時」を表す。疑問詞 + 名詞 + do they eat。",
            "hint": "What time + do + 主語 + 動詞"
        },
        {
            "id": "g1-u4-so-015",
            "type": "sentenceOrdering",
            "japanese": "あなたの先生は誰ですか",
            "words": ["Who", "is", "your", "teacher", "?"],
            "correctAnswer": "Who is your teacher?",
            "difficulty": "beginner",
            "explanation": "疑問詞Whoを文頭に置き、is your teacherと続ける。職業・役割を尋ねる。",
            "hint": "疑問詞 + be動詞 + 主語"
        }
    ]
    
    # ========================================
    # 言い換え問題 (Paraphrase) - 15問
    # ========================================
    paraphrase = [
        {
            "id": "g1-u4-para-001",
            "type": "paraphrase",
            "japanese": "あなたの趣味は何ですか",
            "originalSentence": "What is your hobby?",
            "choices": [
                "What do you like to do?",
                "Where is your hobby?",
                "Who is your hobby?",
                "When is your hobby?"
            ],
            "correctAnswer": "What do you like to do?",
            "difficulty": "beginner",
            "explanation": "「趣味は何」はWhat is your hobby?またはWhat do you like to do?で表せる。",
            "hint": "「好きなことは何」という言い換え"
        },
        {
            "id": "g1-u4-para-002",
            "type": "paraphrase",
            "japanese": "あなたの出身はどこですか",
            "originalSentence": "Where are you from?",
            "choices": [
                "Where do you come from?",
                "When are you from?",
                "What are you from?",
                "How are you from?"
            ],
            "correctAnswer": "Where do you come from?",
            "difficulty": "beginner",
            "explanation": "「どこ出身」はWhere are you from?またはWhere do you come from?で表せる。",
            "hint": "come fromで「〜出身」"
        },
        {
            "id": "g1-u4-para-003",
            "type": "paraphrase",
            "japanese": "今何時ですか",
            "originalSentence": "What time is it now?",
            "choices": [
                "What is the time?",
                "When is it now?",
                "How is the time?",
                "Where is the time?"
            ],
            "correctAnswer": "What is the time?",
            "difficulty": "beginner",
            "explanation": "「今何時」はWhat time is it?またはWhat is the time?で表せる。",
            "hint": "the timeで「時刻」を表す"
        },
        {
            "id": "g1-u4-para-004",
            "type": "paraphrase",
            "japanese": "あなたの名前は何ですか",
            "originalSentence": "What is your name?",
            "choices": [
                "What are you called?",
                "Who is your name?",
                "Where is your name?",
                "When is your name?"
            ],
            "correctAnswer": "What are you called?",
            "difficulty": "beginner",
            "explanation": "「名前は何」はWhat is your name?またはWhat are you called?で表せる。",
            "hint": "「何と呼ばれているか」という言い換え"
        },
        {
            "id": "g1-u4-para-005",
            "type": "paraphrase",
            "japanese": "彼女は何歳ですか",
            "originalSentence": "How old is she?",
            "choices": [
                "What is her age?",
                "When is her age?",
                "Where is her age?",
                "Who is her age?"
            ],
            "correctAnswer": "What is her age?",
            "difficulty": "beginner",
            "explanation": "「何歳」はHow old~?またはWhat is ~ age?で表せる。",
            "hint": "ageで「年齢」を表す"
        },
        {
            "id": "g1-u4-para-006",
            "type": "paraphrase",
            "japanese": "これはいくらですか",
            "originalSentence": "How much is this?",
            "choices": [
                "What is the price of this?",
                "When is the price?",
                "Who is the price?",
                "Where is the price?"
            ],
            "correctAnswer": "What is the price of this?",
            "difficulty": "beginner",
            "explanation": "「いくら」はHow much~?またはWhat is the price~?で表せる。",
            "hint": "priceで「値段」を表す"
        },
        {
            "id": "g1-u4-para-007",
            "type": "paraphrase",
            "japanese": "あなたはどう思いますか",
            "originalSentence": "What do you think?",
            "choices": [
                "How about your idea?",
                "When do you think?",
                "Where do you think?",
                "Who do you think?"
            ],
            "correctAnswer": "How about your idea?",
            "difficulty": "intermediate",
            "explanation": "「どう思うか」はWhat do you think?またはHow about your idea?で表せる。",
            "hint": "「あなたの考えはどうか」という言い換え"
        },
        {
            "id": "g1-u4-para-008",
            "type": "paraphrase",
            "japanese": "あなたの仕事は何ですか",
            "originalSentence": "What is your job?",
            "choices": [
                "What do you do?",
                "Where is your job?",
                "When is your job?",
                "Who is your job?"
            ],
            "correctAnswer": "What do you do?",
            "difficulty": "beginner",
            "explanation": "「仕事は何」はWhat is your job?またはWhat do you do?で表せる。",
            "hint": "「何をしているか」で職業を尋ねる"
        },
        {
            "id": "g1-u4-para-009",
            "type": "paraphrase",
            "japanese": "今日の天気はどうですか",
            "originalSentence": "How is the weather today?",
            "choices": [
                "What is the weather like today?",
                "When is the weather?",
                "Who is the weather?",
                "Where is the weather?"
            ],
            "correctAnswer": "What is the weather like today?",
            "difficulty": "beginner",
            "explanation": "「天気はどう」はHow is the weather?またはWhat is the weather like?で表せる。",
            "hint": "What ~ like?で「どんな〜か」"
        },
        {
            "id": "g1-u4-para-010",
            "type": "paraphrase",
            "japanese": "あなたの好きな食べ物は何ですか",
            "originalSentence": "What is your favorite food?",
            "choices": [
                "What food do you like best?",
                "When is your favorite food?",
                "Who is your favorite food?",
                "Where is your favorite food?"
            ],
            "correctAnswer": "What food do you like best?",
            "difficulty": "beginner",
            "explanation": "「好きな食べ物」はWhat is your favorite~?またはWhat ~ do you like best?で表せる。",
            "hint": "like bestで「一番好き」"
        },
        {
            "id": "g1-u4-para-011",
            "type": "paraphrase",
            "japanese": "郵便局への行き方を教えてください",
            "originalSentence": "How can I get to the post office?",
            "choices": [
                "Where is the post office?",
                "When is the post office?",
                "What is the post office?",
                "Who is the post office?"
            ],
            "correctAnswer": "Where is the post office?",
            "difficulty": "beginner",
            "explanation": "「行き方」を尋ねるHow can I get~?は「どこにあるか」Where is~?でも表現可能。",
            "hint": "場所を尋ねることで行き方も分かる"
        },
        {
            "id": "g1-u4-para-012",
            "type": "paraphrase",
            "japanese": "あなたの誕生日はいつですか",
            "originalSentence": "When is your birthday?",
            "choices": [
                "What date is your birthday?",
                "Where is your birthday?",
                "Who is your birthday?",
                "How is your birthday?"
            ],
            "correctAnswer": "What date is your birthday?",
            "difficulty": "beginner",
            "explanation": "「いつ」を尋ねるWhen~?は「何日」を尋ねるWhat date~?でも表現可能。",
            "hint": "dateで「日付」を表す"
        },
        {
            "id": "g1-u4-para-013",
            "type": "paraphrase",
            "japanese": "彼の電話番号は何番ですか",
            "originalSentence": "What is his phone number?",
            "choices": [
                "What number does he have?",
                "When is his number?",
                "Where is his number?",
                "Who is his number?"
            ],
            "correctAnswer": "What number does he have?",
            "difficulty": "beginner",
            "explanation": "「電話番号は何」はWhat is ~ phone number?またはWhat number does ~ have?で表せる。",
            "hint": "「持っている番号」という言い換え"
        },
        {
            "id": "g1-u4-para-014",
            "type": "paraphrase",
            "japanese": "あなたは何語を話しますか",
            "originalSentence": "What language do you speak?",
            "choices": [
                "What do you speak?",
                "When do you speak?",
                "Where do you speak?",
                "Who do you speak?"
            ],
            "correctAnswer": "What do you speak?",
            "difficulty": "beginner",
            "explanation": "「何語」を尋ねるWhat language~?は単にWhat do you speak?でも通じる。",
            "hint": "languageを省略しても通じる"
        },
        {
            "id": "g1-u4-para-015",
            "type": "paraphrase",
            "japanese": "あなたの好きな科目は何ですか",
            "originalSentence": "What is your favorite subject?",
            "choices": [
                "What subject do you like?",
                "When is your favorite subject?",
                "Who is your favorite subject?",
                "Where is your favorite subject?"
            ],
            "correctAnswer": "What subject do you like?",
            "difficulty": "beginner",
            "explanation": "「好きな科目」はWhat is your favorite subject?またはWhat subject do you like?で表せる。",
            "hint": "favoriteを使わない表現"
        }
    ]
    
    # ========================================
    # 動詞変化問題 (Verb Form) - 10問
    # ========================================
    verb_form = [
        {
            "id": "g1-u4-vf-001",
            "type": "verbForm",
            "japanese": "彼女は何を食べますか",
            "sentence": "What ____ she eat?",
            "choices": ["does", "do", "is", "are"],
            "correctAnswer": "does",
            "difficulty": "beginner",
            "explanation": "三人称単数の疑問文はdoesを使う。Whatの後ろはdoes + 主語 + 動詞原形。",
            "hint": "三人称単数の疑問文"
        },
        {
            "id": "g1-u4-vf-002",
            "type": "verbForm",
            "japanese": "あなたはどこで働きますか",
            "sentence": "Where ____ you work?",
            "choices": ["do", "does", "are", "is"],
            "correctAnswer": "do",
            "difficulty": "beginner",
            "explanation": "一般動詞の疑問文はdoを使う。Whereの後ろはdo + 主語 + 動詞原形。",
            "hint": "一般動詞の疑問文"
        },
        {
            "id": "g1-u4-vf-003",
            "type": "verbForm",
            "japanese": "彼らは何をしていますか",
            "sentence": "What ____ they doing?",
            "choices": ["are", "is", "do", "does"],
            "correctAnswer": "are",
            "difficulty": "beginner",
            "explanation": "現在進行形の疑問文はbe動詞を使う。theyなのでareを使う。",
            "hint": "進行形の疑問文"
        },
        {
            "id": "g1-u4-vf-004",
            "type": "verbForm",
            "japanese": "彼はいつ勉強しますか",
            "sentence": "When ____ he study?",
            "choices": ["does", "do", "is", "are"],
            "correctAnswer": "does",
            "difficulty": "beginner",
            "explanation": "三人称単数heの疑問文はdoesを使う。Whenの後ろはdoes he study。",
            "hint": "heの疑問文"
        },
        {
            "id": "g1-u4-vf-005",
            "type": "verbForm",
            "japanese": "あなたたちはどこにいますか",
            "sentence": "Where ____ you?",
            "choices": ["are", "is", "do", "does"],
            "correctAnswer": "are",
            "difficulty": "beginner",
            "explanation": "be動詞の疑問文。youは複数扱いなのでareを使う。",
            "hint": "be動詞の疑問文"
        },
        {
            "id": "g1-u4-vf-006",
            "type": "verbForm",
            "japanese": "彼女はどのように来ますか",
            "sentence": "How ____ she come?",
            "choices": ["does", "do", "is", "are"],
            "correctAnswer": "does",
            "difficulty": "beginner",
            "explanation": "三人称単数sheの疑問文はdoesを使う。Howの後ろはdoes she come。",
            "hint": "sheの疑問文"
        },
        {
            "id": "g1-u4-vf-007",
            "type": "verbForm",
            "japanese": "彼は誰ですか",
            "sentence": "Who ____ he?",
            "choices": ["is", "are", "do", "does"],
            "correctAnswer": "is",
            "difficulty": "beginner",
            "explanation": "be動詞の疑問文。三人称単数heなのでisを使う。",
            "hint": "be動詞の疑問文"
        },
        {
            "id": "g1-u4-vf-008",
            "type": "verbForm",
            "japanese": "あなたたちは何を持っていますか",
            "sentence": "What ____ you have?",
            "choices": ["do", "does", "are", "is"],
            "correctAnswer": "do",
            "difficulty": "beginner",
            "explanation": "一般動詞haveの疑問文。youはdoを使う。",
            "hint": "一般動詞の疑問文"
        },
        {
            "id": "g1-u4-vf-009",
            "type": "verbForm",
            "japanese": "それは何ですか",
            "sentence": "What ____ it?",
            "choices": ["is", "are", "do", "does"],
            "correctAnswer": "is",
            "difficulty": "beginner",
            "explanation": "be動詞の疑問文。三人称単数itなのでisを使う。",
            "hint": "be動詞の疑問文"
        },
        {
            "id": "g1-u4-vf-010",
            "type": "verbForm",
            "japanese": "彼らはいつ帰りますか",
            "sentence": "When ____ they go home?",
            "choices": ["do", "does", "are", "is"],
            "correctAnswer": "do",
            "difficulty": "beginner",
            "explanation": "一般動詞の疑問文。theyはdoを使う。",
            "hint": "一般動詞の疑問文"
        }
    ]
    
    # ========================================
    # 日常英会話問題 (Daily Conversation) - 5問
    # ========================================
    conversation = [
        {
            "id": "g1-u4-conv-001",
            "type": "conversation",
            "japanese": "レストランで注文する時「何にしますか」と聞かれた",
            "scene": "レストランでの注文",
            "question": "What would you like?",
            "choices": [
                "I'd like a hamburger.",
                "I'm fine, thank you.",
                "Yes, I do.",
                "It's Monday."
            ],
            "correctAnswer": "I'd like a hamburger.",
            "difficulty": "beginner",
            "explanation": "What would you like?は「何が欲しいですか」の丁寧な表現。I'd like~で答える。",
            "hint": "I'd like~で「〜が欲しい」"
        },
        {
            "id": "g1-u4-conv-002",
            "type": "conversation",
            "japanese": "道を尋ねる時「駅はどこですか」と聞きたい",
            "scene": "道案内",
            "question": "How can I ask where the station is?",
            "choices": [
                "Where is the station?",
                "What is the station?",
                "Who is the station?",
                "When is the station?"
            ],
            "correctAnswer": "Where is the station?",
            "difficulty": "beginner",
            "explanation": "「どこ」を尋ねるときはWhereを使う。Where is~?で場所を尋ねる。",
            "hint": "場所を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-conv-003",
            "type": "conversation",
            "japanese": "友達に「いつ暇？」と聞きたい",
            "scene": "友達との会話",
            "question": "How can I ask when my friend is free?",
            "choices": [
                "When are you free?",
                "Where are you free?",
                "What are you free?",
                "How are you free?"
            ],
            "correctAnswer": "When are you free?",
            "difficulty": "beginner",
            "explanation": "「いつ」を尋ねるときはWhenを使う。When are you free?で「いつ暇か」。",
            "hint": "「いつ」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-conv-004",
            "type": "conversation",
            "japanese": "初めて会った人に「お名前は？」と聞きたい",
            "scene": "初対面の挨拶",
            "question": "How can I ask someone's name politely?",
            "choices": [
                "What is your name?",
                "Who is your name?",
                "Where is your name?",
                "When is your name?"
            ],
            "correctAnswer": "What is your name?",
            "difficulty": "beginner",
            "explanation": "「名前は何」はWhat is your name?で尋ねる。最も基本的な自己紹介表現。",
            "hint": "「何」を尋ねる疑問詞"
        },
        {
            "id": "g1-u4-conv-005",
            "type": "conversation",
            "japanese": "電話で「どちら様ですか」と聞きたい",
            "scene": "電話での会話",
            "question": "How can I ask who is calling?",
            "choices": [
                "Who is this?",
                "What is this?",
                "Where is this?",
                "When is this?"
            ],
            "correctAnswer": "Who is this?",
            "difficulty": "beginner",
            "explanation": "電話で相手を尋ねるときはWho is this?を使う。thisで相手を指す。",
            "hint": "「誰」を尋ねる疑問詞"
        }
    ]
    
    # すべての問題を結合
    questions = fill_in_blank + sentence_ordering + paraphrase + verb_form + conversation
    
    # 問題数の検証
    assert len(questions) == 60, f"問題数が60問ではありません: {len(questions)}問"
    assert len(fill_in_blank) == 15, f"穴埋め問題が15問ではありません: {len(fill_in_blank)}問"
    assert len(sentence_ordering) == 15, f"並び替え問題が15問ではありません: {len(sentence_ordering)}問"
    assert len(paraphrase) == 15, f"言い換え問題が15問ではありません: {len(paraphrase)}問"
    assert len(verb_form) == 10, f"動詞変化問題が10問ではありません: {len(verb_form)}問"
    assert len(conversation) == 5, f"日常英会話問題が5問ではありません: {len(conversation)}問"
    
    return questions

def main():
    """メイン処理"""
    questions = create_unit4_questions()
    
    # 出力ディレクトリの確保
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    # JSON出力
    output_path = os.path.join(output_dir, 'grammar_grade1_unit4.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Unit 4（疑問詞）60問を生成しました: {output_path}")
    print(f"📊 内訳: 穴埋め15、並び替え15、言い換え15、動詞変化10、日常英会話5")

if __name__ == '__main__':
    main()
