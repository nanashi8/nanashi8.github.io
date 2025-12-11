#!/usr/bin/env python3
import json
from collections import Counter

def add_emotion_participles():
    """感情を表す分詞の使い分け20問をGrade 3 Unit 6に追加"""
    filepath = "public/data/grammar/grammar_grade3_unit6.json"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_questions = [
        # excited vs exciting (5問)
        {"id": "g3-u6-emotion-001", "type": "fillInBlank", "japanese": "私はその知らせに興奮しました", "sentence": "I was ____ at the news.", "choices": ["excited", "exciting", "excite"], "correctAnswer": "excited", "difficulty": "intermediate", "explanation": "感情を表す分詞は人には-ed、物には-ingという使い分けを構文として覚えること。excited「興奮した(人)」、exciting「興奮させる(物)」。I was excited.で「私は興奮した」。", "hint": "-ed(人)"},
        {"id": "g3-u6-emotion-002", "type": "fillInBlank", "japanese": "そのゲームはとても興奮させるものでした", "sentence": "The game was very ____.", "choices": ["exciting", "excited", "excite"], "correctAnswer": "exciting", "difficulty": "intermediate", "explanation": "物事には-ingを使うという分詞の使い分けを構文として覚えること。The game was exciting.で「ゲームは興奮させるものだった」。", "hint": "-ing(物)"},
        {"id": "g3-u6-emotion-003", "type": "sentenceOrdering", "japanese": "私たちは興奮した子供たちを見ました", "words": ["we", "saw", "the", "excited", "children"], "correctAnswer": "We saw the excited children.", "difficulty": "intermediate", "explanation": "人には-edという分詞の使い分けを構文として覚えること。excited children「興奮した子供たち」。", "hint": "excited", "wordCount": 5},
        {"id": "g3-u6-emotion-004", "type": "paraphrase", "japanese": "その映画は私を興奮させました（exciting）", "originalSentence": "The movie excited me.", "question": "The movie was ____.", "correctAnswer": "exciting", "difficulty": "intermediate", "explanation": "動詞を分詞に変えるとき、物には-ingを使う。The movie was exciting.「その映画は興奮させるものだった」となる。"},
        {"id": "g3-u6-emotion-005", "type": "conversation", "japanese": "私は旅行に興奮しています", "situation": "感情", "dialogue": [{"speaker": "A", "text": "How do you feel?"}, {"speaker": "B", "text": "I'm ____ about the trip."}], "choices": ["excited", "exciting", "excite"], "correctAnswer": "excited", "difficulty": "beginner", "explanation": "人には-edという分詞の使い分けを構文として覚えること。I'm excited.で「私は興奮している」。", "hint": "-ed(人)"},
        
        # interested vs interesting (5問)
        {"id": "g3-u6-emotion-006", "type": "fillInBlank", "japanese": "彼女は音楽に興味があります", "sentence": "She is ____ in music.", "choices": ["interested", "interesting", "interest"], "correctAnswer": "interested", "difficulty": "intermediate", "explanation": "人には-edという分詞の使い分けを構文として覚えること。interested「興味がある(人)」、interesting「興味深い(物)」。be interested in~で「~に興味がある」。", "hint": "-ed(人)"},
        {"id": "g3-u6-emotion-007", "type": "fillInBlank", "japanese": "その本はとても興味深いです", "sentence": "The book is very ____.", "choices": ["interesting", "interested", "interest"], "correctAnswer": "interesting", "difficulty": "intermediate", "explanation": "物には-ingという分詞の使い分けを構文として覚えること。The book is interesting.で「本は興味深い」。", "hint": "-ing(物)"},
        {"id": "g3-u6-emotion-008", "type": "sentenceOrdering", "japanese": "私は興味深い話を聞きました", "words": ["I", "heard", "an", "interesting", "story"], "correctAnswer": "I heard an interesting story.", "difficulty": "intermediate", "explanation": "物には-ingという分詞の使い分けを構文として覚えること。interesting story「興味深い話」。", "hint": "interesting", "wordCount": 5},
        {"id": "g3-u6-emotion-009", "type": "paraphrase", "japanese": "彼は科学に興味があります（interested）", "originalSentence": "He has interest in science.", "question": "He is ____ in science.", "correctAnswer": "interested", "difficulty": "intermediate", "explanation": "名詞を分詞に変えるとき、人には-edを使う。He is interested in science.となる。"},
        {"id": "g3-u6-emotion-010", "type": "fillInBlank", "japanese": "それは興味深いニュースです", "sentence": "It's ____ news.", "choices": ["interesting", "interested", "interest"], "correctAnswer": "interesting", "difficulty": "beginner", "explanation": "物には-ingという分詞の使い分けを構文として覚えること。interesting news「興味深いニュース」。", "hint": "-ing(物)"},
        
        # bored vs boring (4問)
        {"id": "g3-u6-emotion-011", "type": "fillInBlank", "japanese": "私はその授業に退屈しました", "sentence": "I was ____ with the class.", "choices": ["bored", "boring", "bore"], "correctAnswer": "bored", "difficulty": "intermediate", "explanation": "人には-edという分詞の使い分けを構文として覚えること。bored「退屈した(人)」、boring「退屈させる(物)」。I was bored.で「私は退屈した」。", "hint": "-ed(人)"},
        {"id": "g3-u6-emotion-012", "type": "fillInBlank", "japanese": "その映画は退屈でした", "sentence": "The movie was ____.", "choices": ["boring", "bored", "bore"], "correctAnswer": "boring", "difficulty": "intermediate", "explanation": "物には-ingという分詞の使い分けを構文として覚えること。The movie was boring.で「映画は退屈だった」。", "hint": "-ing(物)"},
        {"id": "g3-u6-emotion-013", "type": "sentenceOrdering", "japanese": "彼は退屈な仕事をしています", "words": ["he", "has", "a", "boring", "job"], "correctAnswer": "He has a boring job.", "difficulty": "intermediate", "explanation": "物には-ingという分詞の使い分けを構文として覚えること。boring job「退屈な仕事」。", "hint": "boring", "wordCount": 5},
        {"id": "g3-u6-emotion-014", "type": "conversation", "japanese": "私は退屈しています", "situation": "状態", "dialogue": [{"speaker": "A", "text": "Are you having fun?"}, {"speaker": "B", "text": "No, I'm ____."}], "choices": ["bored", "boring", "bore"], "correctAnswer": "bored", "difficulty": "beginner", "explanation": "人には-edという分詞の使い分けを構文として覚えること。I'm bored.で「私は退屈している」。", "hint": "-ed(人)"},
        
        # surprised vs surprising (3問)
        {"id": "g3-u6-emotion-015", "type": "fillInBlank", "japanese": "私はその結果に驚きました", "sentence": "I was ____ at the result.", "choices": ["surprised", "surprising", "surprise"], "correctAnswer": "surprised", "difficulty": "intermediate", "explanation": "人には-edという分詞の使い分けを構文として覚えること。surprised「驚いた(人)」、surprising「驚くべき(物)」。I was surprised.で「私は驚いた」。", "hint": "-ed(人)"},
        {"id": "g3-u6-emotion-016", "type": "fillInBlank", "japanese": "それは驚くべきニュースでした", "sentence": "It was ____ news.", "choices": ["surprising", "surprised", "surprise"], "correctAnswer": "surprising", "difficulty": "intermediate", "explanation": "物には-ingという分詞の使い分けを構文として覚えること。surprising news「驚くべきニュース」。", "hint": "-ing(物)"},
        {"id": "g3-u6-emotion-017", "type": "sentenceOrdering", "japanese": "彼女は驚いた顔をしました", "words": ["she", "had", "a", "surprised", "look"], "correctAnswer": "She had a surprised look.", "difficulty": "intermediate", "explanation": "人には-edという分詞の使い分けを構文として覚えること。surprised look「驚いた顔」。", "hint": "surprised", "wordCount": 5},
        
        # tired vs tiring (3問)
        {"id": "g3-u6-emotion-018", "type": "fillInBlank", "japanese": "私は疲れています", "sentence": "I am ____.", "choices": ["tired", "tiring", "tire"], "correctAnswer": "tired", "difficulty": "beginner", "explanation": "人には-edという分詞の使い分けを構文として覚えること。tired「疲れた(人)」、tiring「疲れさせる(物)」。I am tired.で「私は疲れている」。", "hint": "-ed(人)"},
        {"id": "g3-u6-emotion-019", "type": "fillInBlank", "japanese": "それは疲れる仕事でした", "sentence": "It was a ____ job.", "choices": ["tiring", "tired", "tire"], "correctAnswer": "tiring", "difficulty": "intermediate", "explanation": "物には-ingという分詞の使い分けを構文として覚えること。tiring job「疲れさせる仕事」。", "hint": "-ing(物)"},
        {"id": "g3-u6-emotion-020", "type": "paraphrase", "japanese": "その旅は私を疲れさせました（tiring）", "originalSentence": "The trip tired me.", "question": "The trip was ____.", "correctAnswer": "tiring", "difficulty": "intermediate", "explanation": "動詞を分詞に変えるとき、物には-ingを使う。The trip was tiring.「その旅は疲れさせるものだった」となる。"}
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
    
    print(f"✅ Grade 3 Unit 6に20問追加完了")
    print(f"  - excited vs exciting: 5問")
    print(f"  - interested vs interesting: 5問")
    print(f"  - bored vs boring: 4問")
    print(f"  - surprised vs surprising: 3問")
    print(f"  - tired vs tiring: 3問")
    print(f"  総問題数: {data['totalQuestions']}")

if __name__ == "__main__":
    add_emotion_participles()
