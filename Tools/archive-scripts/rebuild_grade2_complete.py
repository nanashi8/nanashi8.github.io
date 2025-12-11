#!/usr/bin/env python3
"""
G2 (中2) 文法問題の完全再構築
中2レベルの文法に基づいて200問の高品質データを生成
"""
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "nanashi8.github.io"
DATA_DIR = BASE_DIR / "public" / "data"

def build_unit0_past_be():
    """Unit 0: be動詞の過去形 (was/were)"""
    patterns = [
        ("私は昨日幸せでした", "I ____ happy yesterday.", "was"),
        ("あなたは先週忙しかったです", "You ____ busy last week.", "were"),
        ("彼は昨日病気でした", "He ____ sick yesterday.", "was"),
        ("彼女は昨日家にいました", "She ____ at home yesterday.", "was"),
        ("それは昨日寒かったです", "It ____ cold yesterday.", "was"),
        ("私たちは先週東京にいました", "We ____ in Tokyo last week.", "were"),
        ("彼らは昨日ここにいました", "They ____ here yesterday.", "were"),
        ("トムは昨日疲れていました", "Tom ____ tired yesterday.", "was"),
        ("メアリーは先週幸せでした", "Mary ____ happy last week.", "was"),
        ("私の両親は昨日忙しかったです", "My parents ____ busy yesterday.", "were"),
        ("その犬は昨日元気でした", "The dog ____ fine yesterday.", "was"),
        ("あの猫は昨日お腹が空いていました", "The cat ____ hungry yesterday.", "was"),
        ("私は昨日学校にいました", "I ____ at school yesterday.", "was"),
        ("あなたは先週準備ができていました", "You ____ ready last week.", "were"),
        ("彼は昨日怒っていました", "He ____ angry yesterday.", "was"),
        ("彼女は先週悲しかったです", "She ____ sad last week.", "was"),
        ("私たちは昨日公園にいました", "We ____ in the park yesterday.", "were"),
        ("彼らは先週友達でした", "They ____ friends last week.", "were"),
        ("その本は昨日机の上にありました", "The book ____ on the desk yesterday.", "was"),
        ("あなたたちは先週ここにいましたか", "You ____ here last week.", "were"),
    ]
    
    return [
        {
            "id": f"vf-g2-u0-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "be_past",
            "choices": ["was", "were", "am", "are"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "be動詞の過去形。I/He/She/It/単数→was、You/We/They/複数→were。",
            "grammarPoint": "be動詞の過去形"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit1_past_progressive():
    """Unit 1: 過去進行形 (was/were + -ing)"""
    patterns = [
        ("私はその時本を読んでいました", "I ____ reading a book then.", "was"),
        ("あなたは昨日英語を勉強していました", "You ____ studying English yesterday.", "were"),
        ("彼はその時サッカーをしていました", "He ____ playing soccer at that time.", "was"),
        ("彼女は昨日テレビを見ていました", "She ____ watching TV yesterday.", "was"),
        ("私たちはその時歌っていました", "We ____ singing then.", "were"),
        ("彼らは昨日走っていました", "They ____ running yesterday.", "were"),
        ("トムはその時寝ていました", "Tom ____ sleeping at that time.", "was"),
        ("メアリーは昨日料理していました", "Mary ____ cooking yesterday.", "was"),
        ("私は昨日泳いでいました", "I ____ swimming yesterday.", "was"),
        ("あなたたちはその時踊っていました", "You ____ dancing then.", "were"),
        ("彼は昨日絵を描いていました", "He ____ painting yesterday.", "was"),
        ("彼女はその時音楽を聴いていました", "She ____ listening to music then.", "was"),
        ("私たちは昨日買い物していました", "We ____ shopping yesterday.", "were"),
        ("彼らはその時働いていました", "They ____ working at that time.", "were"),
        ("私の母は昨日掃除していました", "My mother ____ cleaning yesterday.", "was"),
        ("私の兄弟たちはその時遊んでいました", "My brothers ____ playing then.", "were"),
        ("犬は昨日吠えていました", "The dog ____ barking yesterday.", "was"),
        ("鳥たちはその時飛んでいました", "The birds ____ flying then.", "were"),
        ("私は昨日朝食を食べていました", "I ____ eating breakfast yesterday.", "was"),
        ("彼らは昨日笑っていました", "They ____ laughing yesterday.", "were"),
    ]
    
    return [
        {
            "id": f"vf-g2-u1-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "past_progressive",
            "choices": ["was", "were", "am", "is"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "過去進行形 (was/were + 動詞-ing)。主語に応じてwas/wereを選びます。",
            "grammarPoint": "過去進行形"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit2_future_will():
    """Unit 2: 未来形 (will)"""
    patterns = [
        ("私は明日博物館を訪れるでしょう", "I ____ visit the museum tomorrow.", "will"),
        ("あなたは今日の午後サッカーをするでしょう", "You ____ play soccer this afternoon.", "will"),
        ("彼は今夜宿題を終えるでしょう", "He ____ finish homework tonight.", "will"),
        ("彼女は明日買い物に行くでしょう", "She ____ go shopping tomorrow.", "will"),
        ("私たちは来週東京を訪れるでしょう", "We ____ visit Tokyo next week.", "will"),
        ("彼らは明日パーティーを開くでしょう", "They ____ have a party tomorrow.", "will"),
        ("雨が明日降るでしょう", "It ____ rain tomorrow.", "will"),
        ("トムは来週彼女に会うでしょう", "Tom ____ meet her next week.", "will"),
        ("メアリーは明日早く起きるでしょう", "Mary ____ get up early tomorrow.", "will"),
        ("私は今夜手紙を書くでしょう", "I ____ write a letter tonight.", "will"),
        ("あなたは明日試験に合格するでしょう", "You ____ pass the exam tomorrow.", "will"),
        ("彼は来月新しい車を買うでしょう", "He ____ buy a new car next month.", "will"),
        ("彼女は明日料理するでしょう", "She ____ cook tomorrow.", "will"),
        ("私たちは来週旅行するでしょう", "We ____ travel next week.", "will"),
        ("彼らは明日泳ぐでしょう", "They ____ swim tomorrow.", "will"),
        ("太陽が明日輝くでしょう", "The sun ____ shine tomorrow.", "will"),
        ("私の父は明日働くでしょう", "My father ____ work tomorrow.", "will"),
        ("私の姉妹は来週帰ってくるでしょう", "My sister ____ come back next week.", "will"),
        ("犬は明日走るでしょう", "The dog ____ run tomorrow.", "will"),
        ("彼らは今夜勉強するでしょう", "They ____ study tonight.", "will"),
    ]
    
    return [
        {
            "id": f"vf-g2-u2-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "will",
            "choices": ["will", "would", "can", "should"],
            "correctAnswer": "will",
            "difficulty": "intermediate",
            "explanation": "未来を表すwill。主語に関わらずwillを使います。",
            "grammarPoint": "未来形 (will)"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit3_be_going_to():
    """Unit 3: 未来形 (be going to)"""
    patterns = [
        ("私は明日映画を見る予定です", "I ____ going to watch a movie tomorrow.", "am"),
        ("あなたは今夜勉強する予定です", "You ____ going to study tonight.", "are"),
        ("彼は来週旅行する予定です", "He ____ going to travel next week.", "is"),
        ("彼女は明日買い物する予定です", "She ____ going to shop tomorrow.", "is"),
        ("私たちは今週末パーティーをする予定です", "We ____ going to have a party this weekend.", "are"),
        ("彼らは明日サッカーをする予定です", "They ____ going to play soccer tomorrow.", "are"),
        ("雨が降る予定です", "It ____ going to rain.", "is"),
        ("トムは明日彼女に会う予定です", "Tom ____ going to meet her tomorrow.", "is"),
        ("メアリーは来週料理する予定です", "Mary ____ going to cook next week.", "is"),
        ("私は今夜本を読む予定です", "I ____ going to read a book tonight.", "am"),
        ("あなたは明日泳ぐ予定です", "You ____ going to swim tomorrow.", "are"),
        ("彼は来月引っ越す予定です", "He ____ going to move next month.", "is"),
        ("彼女は明日絵を描く予定です", "She ____ going to paint tomorrow.", "is"),
        ("私たちは来週キャンプする予定です", "We ____ going to camp next week.", "are"),
        ("彼らは今夜踊る予定です", "They ____ going to dance tonight.", "are"),
        ("雪が降る予定です", "It ____ going to snow.", "is"),
        ("私の兄は明日働く予定です", "My brother ____ going to work tomorrow.", "is"),
        ("私の友達は来週訪れる予定です", "My friends ____ going to visit next week.", "are"),
        ("犬は明日走る予定です", "The dog ____ going to run tomorrow.", "is"),
        ("彼らは今夜歌う予定です", "They ____ going to sing tonight.", "are"),
    ]
    
    return [
        {
            "id": f"vf-g2-u3-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "be_going_to",
            "choices": ["am", "is", "are", "was"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "be going toで未来を表す。主語に応じてam/is/areを選びます。",
            "grammarPoint": "be going to"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit4_have_to():
    """Unit 4: 助動詞 (have to / must)"""
    patterns = [
        ("私は宿題をしなければなりません", "I ____ to do my homework.", "have"),
        ("あなたは早起きしなければなりません", "You ____ to get up early.", "have"),
        ("彼は勉強しなければなりません", "He ____ to study.", "has"),
        ("彼女は働かなければなりません", "She ____ to work.", "has"),
        ("私たちは行かなければなりません", "We ____ to go.", "have"),
        ("彼らは待たなければなりません", "They ____ to wait.", "have"),
        ("トムは練習しなければなりません", "Tom ____ to practice.", "has"),
        ("メアリーは手伝わなければなりません", "Mary ____ to help.", "has"),
        ("私は掃除しなければなりません", "I ____ to clean.", "have"),
        ("あなたは料理しなければなりません", "You ____ to cook.", "have"),
        ("彼は走らなければなりません", "He ____ to run.", "has"),
        ("彼女は書かなければなりません", "She ____ to write.", "has"),
        ("私たちは読まなければなりません", "We ____ to read.", "have"),
        ("彼らは聞かなければなりません", "They ____ to listen.", "have"),
        ("犬は食べなければなりません", "The dog ____ to eat.", "has"),
        ("私は話さなければなりません", "I ____ to talk.", "have"),
        ("あなたは来なければなりません", "You ____ to come.", "have"),
        ("彼は見なければなりません", "He ____ to watch.", "has"),
        ("彼女は学ばなければなりません", "She ____ to learn.", "has"),
        ("私たちは試さなければなりません", "We ____ to try.", "have"),
    ]
    
    return [
        {
            "id": f"vf-g2-u4-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "have_to",
            "choices": ["have", "has", "had", "having"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "have toで義務を表す。三人称単数はhas to、それ以外はhave to。",
            "grammarPoint": "have to"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit5_comparative():
    """Unit 5: 比較級 (-er / more)"""
    patterns = [
        ("彼は私より背が高いです", "He is ____ than me.", "taller"),
        ("この本はあの本より面白いです", "This book is more ____ than that one.", "interesting"),
        ("彼女はクラスで最も賢いです", "She is the ____ in the class.", "smartest"),
        ("この花はより美しいです", "This flower is more ____.", "beautiful"),
        ("今日は昨日より暑いです", "Today is ____ than yesterday.", "hotter"),
        ("彼は私より若いです", "He is ____ than me.", "younger"),
        ("これはより簡単です", "This is ____.", "easier"),
        ("彼女は最も人気があります", "She is the most ____.", "popular"),
        ("冬は夏より寒いです", "Winter is ____ than summer.", "colder"),
        ("これは最も良いです", "This is the ____.", "best"),
        ("彼は私より速く走ります", "He runs ____ than me.", "faster"),
        ("彼女は最も親切です", "She is the ____.", "kindest"),
        ("この部屋はより大きいです", "This room is ____.", "larger"),
        ("富士山は最も高いです", "Mt. Fuji is the ____.", "highest"),
        ("彼はより上手に話します", "He speaks ____.", "better"),
        ("これは最も安いです", "This is the ____.", "cheapest"),
        ("彼は私より強いです", "He is ____ than me.", "stronger"),
        ("これは最も重要です", "This is the most ____.", "important"),
        ("彼女はより遠くに住んでいます", "She lives ____.", "farther"),
        ("私は最も幸せです", "I am the ____.", "happiest"),
    ]
    
    return [
        {
            "id": f"vf-g2-u5-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "comparative",
            "choices": [ans, "good", "bad", "much"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "比較級・最上級。短い語は-er/-est、長い語はmore/most。",
            "grammarPoint": "比較級・最上級"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit6_when_if():
    """Unit 6: 接続詞 (when / if / because)"""
    patterns = [
        ("私が家に帰った時、雨が降っていました", "____ I got home, it was raining.", "When"),
        ("もし明日晴れなら、ピクニックに行きます", "____ it's sunny tomorrow, we'll go on a picnic.", "If"),
        ("私は疲れているので、休みます", "I'll rest ____ I'm tired.", "because"),
        ("彼が来た時、私は勉強していました", "____ he came, I was studying.", "When"),
        ("もしあなたが行くなら、私も行きます", "____ you go, I'll go too.", "If"),
        ("雨だったので、家にいました", "I stayed home ____ it was raining.", "because"),
        ("彼女が電話した時、私は寝ていました", "____ she called, I was sleeping.", "When"),
        ("もし時間があれば、手伝います", "____ I have time, I'll help.", "If"),
        ("忙しいので、行けません", "I can't go ____ I'm busy.", "because"),
        ("朝起きた時、雪が降っていました", "____ I woke up, it was snowing.", "When"),
        ("もし暇なら、一緒に来てください", "____ you're free, please come with me.", "If"),
        ("病気だったので、学校を休みました", "I missed school ____ I was sick.", "because"),
        ("彼が到着した時、パーティーは始まっていました", "____ he arrived, the party had started.", "When"),
        ("もし雨なら、中止します", "____ it rains, we'll cancel.", "If"),
        ("お腹が空いているので、食べます", "I'll eat ____ I'm hungry.", "because"),
        ("私が子供の時、ここに住んでいました", "____ I was a child, I lived here.", "When"),
        ("もし勝てば、嬉しいです", "____ we win, I'll be happy.", "If"),
        ("寒いので、コートを着ます", "I'll wear a coat ____ it's cold.", "because"),
        ("彼女が笑った時、みんな笑いました", "____ she laughed, everyone laughed.", "When"),
        ("もし分からなければ、聞いてください", "____ you don't understand, please ask.", "If"),
    ]
    
    return [
        {
            "id": f"vf-g2-u6-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "conjunction",
            "choices": ["When", "If", "because", "but"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "接続詞。when(時)、if(もし)、because(なぜなら)を使い分ける。",
            "grammarPoint": "接続詞"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit7_infinitive():
    """Unit 7: 不定詞 (to + 動詞)"""
    patterns = [
        ("私は泳ぐことが好きです", "I like ____ swim.", "to"),
        ("彼女は歌うことが好きです", "She loves ____ sing.", "to"),
        ("私は医者になりたいです", "I want ____ be a doctor.", "to"),
        ("彼は英語を学びたいです", "He wants ____ learn English.", "to"),
        ("私たちは旅行することを決めました", "We decided ____ travel.", "to"),
        ("彼らは出発する予定です", "They plan ____ leave.", "to"),
        ("何か飲むものが欲しいです", "I want something ____ drink.", "to"),
        ("読むべき本があります", "I have a book ____ read.", "to"),
        ("私は友達に会うために行きました", "I went ____ meet my friend.", "to"),
        ("彼女は勉強するために図書館に行きました", "She went to the library ____ study.", "to"),
        ("私は料理することを学んでいます", "I'm learning ____ cook.", "to"),
        ("彼は泳ぐことを始めました", "He started ____ swim.", "to"),
        ("私たちは遊ぶことを楽しみました", "We enjoyed ____ play.", "to"),
        ("彼女は話すことを続けました", "She continued ____ talk.", "to"),
        ("私はピアノを弾くことができます", "I can ____ play the piano.", "to"),
        ("彼は走ることが得意です", "He is good at ____ run.", "to"),
        ("何か食べるものはありますか", "Do you have anything ____ eat?", "to"),
        ("これは書くためのペンです", "This is a pen ____ write with.", "to"),
        ("私は手伝うために来ました", "I came ____ help.", "to"),
        ("彼女は見るために止まりました", "She stopped ____ look.", "to"),
    ]
    
    return [
        {
            "id": f"vf-g2-u7-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "infinitive",
            "choices": ["to", "for", "at", "in"],
            "correctAnswer": "to",
            "difficulty": "intermediate",
            "explanation": "不定詞 (to + 動詞原形)。名詞的・形容詞的・副詞的用法がある。",
            "grammarPoint": "不定詞"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit8_passive():
    """Unit 8: 受動態 (be + 過去分詞)"""
    patterns = [
        ("英語は世界中で話されています", "English ____ spoken around the world.", "is"),
        ("この本は多くの人に読まれています", "This book ____ read by many people.", "is"),
        ("その建物は昨年建てられました", "The building ____ built last year.", "was"),
        ("この歌は彼女によって歌われました", "This song ____ sung by her.", "was"),
        ("その手紙は私に書かれました", "The letter ____ written to me.", "was"),
        ("これらの写真は彼によって撮られました", "These pictures ____ taken by him.", "were"),
        ("そのドアは彼女によって開けられました", "The door ____ opened by her.", "was"),
        ("窓は私によって閉められました", "The window ____ closed by me.", "was"),
        ("この料理は母によって作られました", "This dish ____ cooked by my mother.", "was"),
        ("その車は昨日洗われました", "The car ____ washed yesterday.", "was"),
        ("これらの花は庭で育てられました", "These flowers ____ grown in the garden.", "were"),
        ("その映画は多くの人に見られました", "The movie ____ watched by many people.", "was"),
        ("この橋は100年前に作られました", "This bridge ____ built 100 years ago.", "was"),
        ("その問題は彼によって解かれました", "The problem ____ solved by him.", "was"),
        ("これらの本は図書館で借りられました", "These books ____ borrowed from the library.", "were"),
        ("その木は嵐で倒されました", "The tree ____ blown down by the storm.", "was"),
        ("この絵は有名な画家によって描かれました", "This picture ____ painted by a famous artist.", "was"),
        ("その店は午前10時に開けられます", "The store ____ opened at 10 a.m.", "is"),
        ("これらの製品は日本で作られています", "These products ____ made in Japan.", "are"),
        ("その秘密は誰にも知られていません", "The secret ____ known by nobody.", "is"),
    ]
    
    return [
        {
            "id": f"vf-g2-u8-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "passive",
            "choices": ["is", "was", "are", "were"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "受動態 (be動詞 + 過去分詞)。主語の数と時制に注意。",
            "grammarPoint": "受動態"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]

def build_unit9_present_perfect():
    """Unit 9: 現在完了 (have/has + 過去分詞)"""
    patterns = [
        ("私は3年間英語を勉強しています", "I ____ studied English for three years.", "have"),
        ("彼は東京に行ったことがあります", "He ____ been to Tokyo.", "has"),
        ("彼女はちょうど宿題を終えました", "She ____ just finished her homework.", "has"),
        ("私たちは彼に会ったことがありません", "We ____ never met him.", "have"),
        ("彼らはすでに昼食を食べました", "They ____ already eaten lunch.", "have"),
        ("トムは2時間ここにいます", "Tom ____ been here for two hours.", "has"),
        ("メアリーはその映画を見たことがあります", "Mary ____ seen the movie.", "has"),
        ("私は鍵を失くしました", "I ____ lost my key.", "have"),
        ("あなたはその本を読みましたか", "You ____ read the book.", "have"),
        ("彼は朝から忙しいです", "He ____ been busy since morning.", "has"),
        ("彼女はまだ到着していません", "She ____ not arrived yet.", "has"),
        ("私たちは長い間友達です", "We ____ been friends for a long time.", "have"),
        ("彼らはちょうど出発しました", "They ____ just left.", "have"),
        ("私は今までに富士山に登ったことがあります", "I ____ climbed Mt. Fuji before.", "have"),
        ("彼は宿題をまだ終えていません", "He ____ not finished his homework yet.", "has"),
        ("彼女は2012年からここに住んでいます", "She ____ lived here since 2012.", "has"),
        ("私たちはその歌を何度も聞きました", "We ____ heard the song many times.", "have"),
        ("彼らは新しい家を買いました", "They ____ bought a new house.", "have"),
        ("私は彼女に手紙を送りました", "I ____ sent her a letter.", "have"),
        ("彼は先週から病気です", "He ____ been sick since last week.", "has"),
    ]
    
    return [
        {
            "id": f"vf-g2-u9-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "present_perfect",
            "choices": ["have", "has", "had", "having"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "現在完了 (have/has + 過去分詞)。三人称単数はhas、それ以外はhave。",
            "grammarPoint": "現在完了"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]


def create_verb_form_grade2():
    """G2のverb-form問題を生成"""
    data = {
        "grade": 2,
        "totalQuestions": 200,
        "units": [
            {
                "unit": "Unit 0",
                "title": "be動詞の過去形",
                "verbForm": build_unit0_past_be()
            },
            {
                "unit": "Unit 1",
                "title": "過去進行形",
                "verbForm": build_unit1_past_progressive()
            },
            {
                "unit": "Unit 2",
                "title": "未来形 (will)",
                "verbForm": build_unit2_future_will()
            },
            {
                "unit": "Unit 3",
                "title": "未来形 (be going to)",
                "verbForm": build_unit3_be_going_to()
            },
            {
                "unit": "Unit 4",
                "title": "助動詞 (have to)",
                "verbForm": build_unit4_have_to()
            },
            {
                "unit": "Unit 5",
                "title": "比較級・最上級",
                "verbForm": build_unit5_comparative()
            },
            {
                "unit": "Unit 6",
                "title": "接続詞",
                "verbForm": build_unit6_when_if()
            },
            {
                "unit": "Unit 7",
                "title": "不定詞",
                "verbForm": build_unit7_infinitive()
            },
            {
                "unit": "Unit 8",
                "title": "受動態",
                "verbForm": build_unit8_passive()
            },
            {
                "unit": "Unit 9",
                "title": "現在完了",
                "verbForm": build_unit9_present_perfect()
            }
        ]
    }
    
    return data


def create_fill_in_blank_grade2(vf_data):
    """verb-formからfill-in-blankを生成"""
    fb_data = {
        "grade": 2,
        "totalQuestions": 200,
        "units": []
    }
    
    for unit in vf_data['units']:
        fb_unit = {
            "unit": unit['unit'],
            "title": unit['title'],
            "fillInBlank": []
        }
        
        for q in unit['verbForm']:
            fb_q = {
                "id": q['id'].replace('vf-', 'fb-'),
                "japanese": q['japanese'],
                "sentence": q['sentence'],
                "wordCount": len(q['sentence'].split()),
                "choices": q['choices'],
                "correctAnswer": q['correctAnswer'],
                "difficulty": q['difficulty'],
                "grammarPoint": q['grammarPoint'],
                "hint": q['explanation']
            }
            fb_unit['fillInBlank'].append(fb_q)
        
        fb_data['units'].append(fb_unit)
    
    return fb_data


def create_sentence_ordering_grade2(vf_data):
    """verb-formからsentence-orderingを生成"""
    so_data = {
        "grade": 2,
        "totalQuestions": 200,
        "units": []
    }
    
    for unit in vf_data['units']:
        so_unit = {
            "unit": unit['unit'],
            "title": unit['title'],
            "sentenceOrdering": []
        }
        
        for q in unit['verbForm']:
            # ____ を正解の単語に置き換え
            complete_sentence = q['sentence'].replace('____', q['correctAnswer'])
            words = complete_sentence.replace('.', '').replace(',', '').split()
            
            so_q = {
                "id": q['id'].replace('vf-', 'so-'),
                "japanese": q['japanese'],
                "sentence": complete_sentence,
                "words": words,
                "correctAnswer": complete_sentence,
                "wordCount": len(words),
                "difficulty": q['difficulty'],
                "grammarPoint": q['grammarPoint'],
                "hint": q['explanation']
            }
            so_unit['sentenceOrdering'].append(so_q)
        
        so_data['units'].append(so_unit)
    
    return so_data


def main():
    print("=== G2文法問題の完全再構築 ===\n")
    
    # verb-form生成
    print("[1/3] verb-form問題を生成中...")
    vf_data = create_verb_form_grade2()
    vf_file = DATA_DIR / "verb-form-questions-grade2.json"
    with open(vf_file, 'w', encoding='utf-8') as f:
        json.dump(vf_data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {vf_file.name} 作成完了 (200問)")
    
    # fill-in-blank生成
    print("[2/3] fill-in-blank問題を生成中...")
    fb_data = create_fill_in_blank_grade2(vf_data)
    fb_file = DATA_DIR / "fill-in-blank-questions-grade2.json"
    with open(fb_file, 'w', encoding='utf-8') as f:
        json.dump(fb_data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {fb_file.name} 作成完了 (200問)")
    
    # sentence-ordering生成
    print("[3/3] sentence-ordering問題を生成中...")
    so_data = create_sentence_ordering_grade2(vf_data)
    so_file = DATA_DIR / "sentence-ordering-grade2.json"
    with open(so_file, 'w', encoding='utf-8') as f:
        json.dump(so_data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {so_file.name} 作成完了 (200問)")
    
    print("\n[完了] G2の600問を生成しました!")
    print("\n【文法内容】")
    print("  Unit 0: be動詞の過去形 (was/were)")
    print("  Unit 1: 過去進行形 (was/were + -ing)")
    print("  Unit 2: 未来形 (will)")
    print("  Unit 3: 未来形 (be going to)")
    print("  Unit 4: 助動詞 (have to)")
    print("  Unit 5: 比較級・最上級")
    print("  Unit 6: 接続詞 (when/if/because)")
    print("  Unit 7: 不定詞 (to + 動詞)")
    print("  Unit 8: 受動態 (be + 過去分詞)")
    print("  Unit 9: 現在完了 (have/has + 過去分詞)")


if __name__ == "__main__":
    main()
