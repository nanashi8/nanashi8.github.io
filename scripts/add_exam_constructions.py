#!/usr/bin/env python3
import json
from collections import Counter

def add_takes_spend_cost():
    """It takes/spend/cost構文30問をGrade 2 Unit 4に追加"""
    filepath = "public/data/grammar/grammar_grade2_unit4.json"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_questions = [
        # It takes 構文 (12問)
        {"id": "g2-u4-takes-001", "type": "fillInBlank", "japanese": "学校まで30分かかります", "sentence": "It ____ me 30 minutes to get to school.", "choices": ["takes", "take", "taking"], "correctAnswer": "takes", "difficulty": "intermediate", "explanation": "It takes + 人 + 時間 + to doで「人が~するのに時間がかかる」という構文として覚えること。Itは形式主語。It takes me 30 minutes.で「私に30分かかる」。", "hint": "takes"},
        {"id": "g2-u4-takes-002", "type": "sentenceOrdering", "japanese": "その仕事をするのに2時間かかりました", "words": ["it", "took", "me", "two", "hours", "to", "do", "the", "work"], "correctAnswer": "It took me two hours to do the work.", "difficulty": "intermediate", "explanation": "It takes + 人 + 時間 + to doという構文として覚えること。過去形はtook。", "hint": "It took me", "wordCount": 9},
        {"id": "g2-u4-takes-003", "type": "fillInBlank", "japanese": "東京まで行くのに3時間かかります", "sentence": "It takes three hours ____ get to Tokyo.", "choices": ["to", "for", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "It takes + 時間 + to doという構文として覚えること。to不定詞を使う。", "hint": "to不定詞"},
        {"id": "g2-u4-takes-004", "type": "conversation", "japanese": "宿題をするのにどれくらいかかりますか", "situation": "時間について", "dialogue": [{"speaker": "A", "text": "How long does it ____ you to do homework?"}, {"speaker": "B", "text": "It takes about one hour."}], "choices": ["take", "takes", "taking"], "correctAnswer": "take", "difficulty": "intermediate", "explanation": "How long does it take + 人 + to doで「~するのにどれくらいかかりますか」という構文として覚えること。疑問文ではdoes itの後は原形take。", "hint": "原形take"},
        {"id": "g2-u4-takes-005", "type": "paraphrase", "japanese": "私は学校まで20分かかります（20 minutes, get）", "originalSentence": "I need 20 minutes to get to school.", "question": "It ____ me ____ to get to school.", "correctAnswer": "takes 20 minutes", "difficulty": "intermediate", "explanation": "It takes + 人 + 時間 + to doに書き換える。It takes me 20 minutes to get to school.となる。"},
        {"id": "g2-u4-takes-006", "type": "fillInBlank", "japanese": "この本を読むのに1週間かかりました", "sentence": "It ____ me a week to read this book.", "choices": ["took", "takes", "taking"], "correctAnswer": "took", "difficulty": "intermediate", "explanation": "It takes + 人 + 時間 + to doの過去形という構文として覚えること。It took me a week.で「私に1週間かかった」。", "hint": "過去形"},
        {"id": "g2-u4-takes-007", "type": "sentenceOrdering", "japanese": "駅まで歩いて10分かかります", "words": ["it", "takes", "ten", "minutes", "to", "walk", "to", "the", "station"], "correctAnswer": "It takes ten minutes to walk to the station.", "difficulty": "intermediate", "explanation": "It takes + 時間 + to doという構文として覚えること。人を省略することもできる。", "hint": "It takes", "wordCount": 9},
        {"id": "g2-u4-takes-008", "type": "fillInBlank", "japanese": "料理を作るのにどれくらいかかりましたか", "sentence": "How long did it ____ to cook the meal?", "choices": ["take", "took", "takes"], "correctAnswer": "take", "difficulty": "intermediate", "explanation": "How long did it take to doという構文として覚えること。疑問文の過去形ではdid itの後は原形take。", "hint": "原形take"},
        {"id": "g2-u4-takes-009", "type": "sentenceOrdering", "japanese": "彼女は準備するのに30分かかります", "words": ["it", "takes", "her", "thirty", "minutes", "to", "get", "ready"], "correctAnswer": "It takes her thirty minutes to get ready.", "difficulty": "intermediate", "explanation": "It takes + 人 + 時間 + to doという構文として覚えること。herは「彼女に」の意味。", "hint": "It takes her", "wordCount": 8},
        {"id": "g2-u4-takes-010", "type": "fillInBlank", "japanese": "英語を習得するのに何年もかかります", "sentence": "It ____ many years to learn English.", "choices": ["takes", "take", "taking"], "correctAnswer": "takes", "difficulty": "intermediate", "explanation": "It takes + 時間 + to doという構文として覚えること。many yearsは複数だがItが主語なのでtakesを使う。", "hint": "takes"},
        {"id": "g2-u4-takes-011", "type": "conversation", "japanese": "空港まで車で1時間かかります", "situation": "移動時間", "dialogue": [{"speaker": "A", "text": "How do we get there?"}, {"speaker": "B", "text": "It ____ one hour by car."}], "choices": ["takes", "take", "took"], "correctAnswer": "takes", "difficulty": "intermediate", "explanation": "It takes + 時間で「~かかる」という構文として覚えること。by carで「車で」。", "hint": "takes"},
        {"id": "g2-u4-takes-012", "type": "fillInBlank", "japanese": "試験に合格するのに長い時間がかかりました", "sentence": "It took a long time ____ pass the exam.", "choices": ["to", "for", "of"], "correctAnswer": "to", "difficulty": "intermediate", "explanation": "It takes + 時間 + to doという構文として覚えること。to不定詞を使う。", "hint": "to不定詞"},
        
        # spend 構文 (9問)
        {"id": "g2-u4-spend-001", "type": "fillInBlank", "japanese": "私は宿題に2時間を費やしました", "sentence": "I spent two hours ____ my homework.", "choices": ["on", "for", "to"], "correctAnswer": "on", "difficulty": "intermediate", "explanation": "spend + 時間 + on + 名詞で「~に時間を費やす」という構文として覚えること。I spent two hours on my homework.で「宿題に2時間使った」。", "hint": "on"},
        {"id": "g2-u4-spend-002", "type": "fillInBlank", "japanese": "彼女は本を読むのに1時間を費やしました", "sentence": "She spent an hour ____ a book.", "choices": ["reading", "read", "to read"], "correctAnswer": "reading", "difficulty": "intermediate", "explanation": "spend + 時間 + doingで「~するのに時間を費やす」という構文として覚えること。She spent an hour reading.で「読むのに1時間使った」。", "hint": "動名詞"},
        {"id": "g2-u4-spend-003", "type": "sentenceOrdering", "japanese": "私は買い物に100ドル使いました", "words": ["I", "spent", "100", "dollars", "on", "shopping"], "correctAnswer": "I spent 100 dollars on shopping.", "difficulty": "intermediate", "explanation": "spend + お金 + on + 名詞で「~にお金を使う」という構文として覚えること。", "hint": "spent on", "wordCount": 6},
        {"id": "g2-u4-spend-004", "type": "paraphrase", "japanese": "私は勉強に3時間かかりました（studying）", "originalSentence": "It took me three hours to study.", "question": "I spent three hours ____.", "correctAnswer": "studying", "difficulty": "intermediate", "explanation": "It takes構文をspend + 時間 + doingに書き換える。I spent three hours studying.となる。"},
        {"id": "g2-u4-spend-005", "type": "fillInBlank", "japanese": "彼はゲームに多くの時間を使います", "sentence": "He spends a lot of time ____ games.", "choices": ["playing", "play", "to play"], "correctAnswer": "playing", "difficulty": "intermediate", "explanation": "spend + 時間 + doingという構文として覚えること。playing gamesで「ゲームをすること」。", "hint": "動名詞"},
        {"id": "g2-u4-spend-006", "type": "sentenceOrdering", "japanese": "彼女は新しい服に50ドル使いました", "words": ["she", "spent", "50", "dollars", "on", "new", "clothes"], "correctAnswer": "She spent 50 dollars on new clothes.", "difficulty": "intermediate", "explanation": "spend + お金 + on + 名詞で「~にお金を使う」という構文として覚えること。", "hint": "spent on", "wordCount": 7},
        {"id": "g2-u4-spend-007", "type": "fillInBlank", "japanese": "私たちは公園で午後を過ごしました", "sentence": "We spent the afternoon ____ in the park.", "choices": ["walking", "walk", "to walk"], "correctAnswer": "walking", "difficulty": "intermediate", "explanation": "spend + 時間 + doingで「~して時間を過ごす」という構文として覚えること。", "hint": "動名詞"},
        {"id": "g2-u4-spend-008", "type": "conversation", "japanese": "絵を描くのに2時間使いました", "situation": "時間の使い方", "dialogue": [{"speaker": "A", "text": "What did you do?"}, {"speaker": "B", "text": "I spent two hours ____ a picture."}], "choices": ["drawing", "draw", "to draw"], "correctAnswer": "drawing", "difficulty": "intermediate", "explanation": "spend + 時間 + doingという構文として覚えること。drawing a pictureで「絵を描くこと」。", "hint": "動名詞"},
        {"id": "g2-u4-spend-009", "type": "fillInBlank", "japanese": "彼は旅行に多くのお金を使いました", "sentence": "He spent much money ____ the trip.", "choices": ["on", "for", "to"], "correctAnswer": "on", "difficulty": "intermediate", "explanation": "spend + お金 + on + 名詞で「~にお金を使う」という構文として覚えること。", "hint": "on"},
        
        # cost 構文 (9問)
        {"id": "g2-u4-cost-001", "type": "fillInBlank", "japanese": "この本は私に10ドルかかりました", "sentence": "This book ____ me 10 dollars.", "choices": ["cost", "costs", "costed"], "correctAnswer": "cost", "difficulty": "intermediate", "explanation": "物 + cost + 人 + お金で「物が人にお金がかかる」という構文として覚えること。costは過去形も同じ形。This book cost me 10 dollars.で「この本は私に10ドルかかった」。", "hint": "cost"},
        {"id": "g2-u4-cost-002", "type": "sentenceOrdering", "japanese": "そのコンピュータは彼に1000ドルかかりました", "words": ["the", "computer", "cost", "him", "1000", "dollars"], "correctAnswer": "The computer cost him 1000 dollars.", "difficulty": "intermediate", "explanation": "物 + cost + 人 + お金という構文として覚えること。主語は物(the computer)。", "hint": "cost him", "wordCount": 6},
        {"id": "g2-u4-cost-003", "type": "fillInBlank", "japanese": "この車はいくらかかりますか", "sentence": "How much does this car ____?", "choices": ["cost", "costs", "costed"], "correctAnswer": "cost", "difficulty": "intermediate", "explanation": "How much does + 物 + costで「いくらかかりますか」という構文として覚えること。疑問文ではdoesの後は原形cost。", "hint": "原形cost"},
        {"id": "g2-u4-cost-004", "type": "paraphrase", "japanese": "私はこの時計に50ドル払いました（watch, cost）", "originalSentence": "I paid 50 dollars for this watch.", "question": "This watch ____ me ____.", "correctAnswer": "cost 50 dollars", "difficulty": "intermediate", "explanation": "pay構文を物 + cost + 人 + お金に書き換える。This watch cost me 50 dollars.となる。"},
        {"id": "g2-u4-cost-005", "type": "fillInBlank", "japanese": "その旅行は彼女に多くのお金がかかりました", "sentence": "The trip ____ her a lot of money.", "choices": ["cost", "costs", "costed"], "correctAnswer": "cost", "difficulty": "intermediate", "explanation": "物 + cost + 人 + お金という構文として覚えること。costの過去形はcost(同じ形)。", "hint": "cost"},
        {"id": "g2-u4-cost-006", "type": "sentenceOrdering", "japanese": "この服は彼に80ドルかかりました", "words": ["these", "clothes", "cost", "him", "80", "dollars"], "correctAnswer": "These clothes cost him 80 dollars.", "difficulty": "intermediate", "explanation": "物 + cost + 人 + お金という構文として覚えること。", "hint": "cost him", "wordCount": 6},
        {"id": "g2-u4-cost-007", "type": "fillInBlank", "japanese": "新しい自転車は私に200ドルかかりました", "sentence": "A new bike ____ me 200 dollars.", "choices": ["cost", "costs", "costed"], "correctAnswer": "cost", "difficulty": "intermediate", "explanation": "物 + cost + 人 + お金という構文として覚えること。costは不規則動詞で過去形も同じcost。", "hint": "cost"},
        {"id": "g2-u4-cost-008", "type": "conversation", "japanese": "その電話はいくらかかりましたか", "situation": "値段について", "dialogue": [{"speaker": "A", "text": "How much did the phone ____?"}, {"speaker": "B", "text": "It cost 500 dollars."}], "choices": ["cost", "costs", "costed"], "correctAnswer": "cost", "difficulty": "intermediate", "explanation": "How much did + 物 + costで「いくらかかりましたか」という構文として覚えること。過去の疑問文ではdidの後は原形cost。", "hint": "原形cost"},
        {"id": "g2-u4-cost-009", "type": "fillInBlank", "japanese": "その修理は私に多額の費用がかかりました", "sentence": "The repair ____ me a lot.", "choices": ["cost", "costs", "costed"], "correctAnswer": "cost", "difficulty": "intermediate", "explanation": "物 + cost + 人 + お金で「~にお金がかかる」という構文として覚えること。a lotで「たくさん」の意味。", "hint": "cost"}
    ]
    
    data['questions'].extend(new_questions)
    data['totalQuestions'] = len(data['questions'])
    
    type_counts = Counter(q['type'] for q in data['questions'])
    data['questionTypes'] = {
        'fillInBlank': type_counts.get('fillInBlank', 0),
        'sentenceOrdering': type_counts.get('sentenceOrdering', 0),
        'paraphrase': type_counts.get('paraphrase', 0),
        'verbForm': type_counts.get('verbForm', 0),
        'conversation': type_counts.get('conversation', 0)
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Grade 2 Unit 4に30問追加完了")
    print(f"  - It takes構文: 12問")
    print(f"  - spend構文: 9問")
    print(f"  - cost構文: 9問")
    print(f"  総問題数: {data['totalQuestions']}")

if __name__ == "__main__":
    add_takes_spend_cost()
