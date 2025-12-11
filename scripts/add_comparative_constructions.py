#!/usr/bin/env python3
import json
from collections import Counter

def add_comparative_constructions():
    """比較級の重要構文15問をGrade 2 Unit 7に追加"""
    filepath = "public/data/grammar/grammar_grade2_unit7.json"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_questions = [
        # 比較級 and 比較級 (8問)
        {"id": "g2-u7-comp-001", "type": "fillInBlank", "japanese": "日がどんどん長くなっています", "sentence": "The days are getting longer and ____.", "choices": ["longer", "long", "longest"], "correctAnswer": "longer", "difficulty": "intermediate", "explanation": "比較級 + and + 比較級で「ますます~」という構文として覚えること。longer and longer「ますます長く」。The days are getting longer and longer.で「日がどんどん長くなっている」。", "hint": "比較級"},
        {"id": "g2-u7-comp-002", "type": "sentenceOrdering", "japanese": "彼はますます背が高くなっています", "words": ["he", "is", "getting", "taller", "and", "taller"], "correctAnswer": "He is getting taller and taller.", "difficulty": "intermediate", "explanation": "比較級 + and + 比較級という構文として覚えること。taller and taller「ますます背が高く」。", "hint": "taller and taller", "wordCount": 6},
        {"id": "g2-u7-comp-003", "type": "fillInBlank", "japanese": "天気がますます寒くなっています", "sentence": "It's getting colder and ____.", "choices": ["colder", "cold", "coldest"], "correctAnswer": "colder", "difficulty": "intermediate", "explanation": "比較級 + and + 比較級で「ますます~」という構文として覚えること。colder and colder「ますます寒く」。", "hint": "比較級"},
        {"id": "g2-u7-comp-004", "type": "conversation", "japanese": "英語がますます難しくなっています", "situation": "勉強", "dialogue": [{"speaker": "A", "text": "How is English?"}, {"speaker": "B", "text": "It's getting more and more ____."}], "choices": ["difficult", "difficulter", "most difficult"], "correctAnswer": "difficult", "difficulty": "intermediate", "explanation": "長い形容詞の場合はmore and more + 形容詞で「ますます~」という構文として覚えること。more and more difficult「ますます難しく」。", "hint": "more and more"},
        {"id": "g2-u7-comp-005", "type": "sentenceOrdering", "japanese": "彼女はますます美しくなっています", "words": ["she", "is", "getting", "more", "and", "more", "beautiful"], "correctAnswer": "She is getting more and more beautiful.", "difficulty": "intermediate", "explanation": "長い形容詞の場合はmore and more + 形容詞という構文として覚えること。", "hint": "more and more", "wordCount": 7},
        {"id": "g2-u7-comp-006", "type": "fillInBlank", "japanese": "問題がますます複雑になっています", "sentence": "The problem is getting more and more ____.", "choices": ["complicated", "complicateder", "most complicated"], "correctAnswer": "complicated", "difficulty": "advanced", "explanation": "長い形容詞の場合はmore and more + 形容詞で「ますます~」という構文として覚えること。", "hint": "more and more"},
        {"id": "g2-u7-comp-007", "type": "paraphrase", "japanese": "彼女の英語は日に日に上達しています（better）", "originalSentence": "Her English improves day by day.", "question": "Her English is getting better and ____.", "correctAnswer": "better", "difficulty": "intermediate", "explanation": "比較級 + and + 比較級に書き換える。better and better「ますます良く」となる。"},
        {"id": "g2-u7-comp-008", "type": "fillInBlank", "japanese": "彼はますます速く走れるようになっています", "sentence": "He can run faster and ____.", "choices": ["faster", "fast", "fastest"], "correctAnswer": "faster", "difficulty": "intermediate", "explanation": "比較級 + and + 比較級で「ますます~」という構文として覚えること。faster and faster「ますます速く」。", "hint": "比較級"},
        
        # the 比較級, the 比較級 (7問)
        {"id": "g2-u7-comp-009", "type": "fillInBlank", "japanese": "高ければ高いほど良い", "sentence": "The higher, the ____.", "choices": ["better", "good", "best"], "correctAnswer": "better", "difficulty": "intermediate", "explanation": "the + 比較級, the + 比較級で「~すればするほど...」という構文として覚えること。The higher, the better.「高ければ高いほど良い」。", "hint": "比較級"},
        {"id": "g2-u7-comp-010", "type": "sentenceOrdering", "japanese": "速ければ速いほど良い", "words": ["the", "faster", "the", "better"], "correctAnswer": "The faster, the better.", "difficulty": "intermediate", "explanation": "the + 比較級, the + 比較級という構文として覚えること。The faster, the better.は決まった表現。", "hint": "the 比較級", "wordCount": 4},
        {"id": "g2-u7-comp-011", "type": "fillInBlank", "japanese": "練習すればするほど上手になります", "sentence": "The more you practice, the ____ you become.", "choices": ["better", "good", "best"], "correctAnswer": "better", "difficulty": "intermediate", "explanation": "the + 比較級, the + 比較級で「~すればするほど...」という構文として覚えること。The more you practice, the better you become.で「練習すればするほど上手になる」。", "hint": "比較級"},
        {"id": "g2-u7-comp-012", "type": "conversation", "japanese": "早ければ早いほど良い", "situation": "時間", "dialogue": [{"speaker": "A", "text": "When should we start?"}, {"speaker": "B", "text": "The ____, the better."}], "choices": ["earlier", "early", "earliest"], "correctAnswer": "earlier", "difficulty": "intermediate", "explanation": "the + 比較級, the + 比較級という構文として覚えること。The earlier, the better.で「早ければ早いほど良い」。", "hint": "比較級"},
        {"id": "g2-u7-comp-013", "type": "sentenceOrdering", "japanese": "勉強すればするほど賢くなります", "words": ["the", "more", "you", "study", "the", "smarter", "you", "become"], "correctAnswer": "The more you study, the smarter you become.", "difficulty": "advanced", "explanation": "the + 比較級, the + 比較級という構文として覚えること。", "hint": "the more, the smarter", "wordCount": 8},
        {"id": "g2-u7-comp-014", "type": "fillInBlank", "japanese": "読めば読むほど知識が増えます", "sentence": "The more you read, the ____ knowledge you get.", "choices": ["more", "much", "most"], "correctAnswer": "more", "difficulty": "intermediate", "explanation": "the + 比較級, the + 比較級で「~すればするほど...」という構文として覚えること。the more knowledge「より多くの知識」。", "hint": "比較級"},
        {"id": "g2-u7-comp-015", "type": "paraphrase", "japanese": "忙しいほど幸せです（busy, happy）", "originalSentence": "If I am busier, I am happier.", "question": "The ____, the ____.", "correctAnswer": "busier happier", "difficulty": "advanced", "explanation": "if構文をthe + 比較級, the + 比較級に書き換える。The busier, the happier.となる。"}
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
    
    print(f"✅ Grade 2 Unit 7に15問追加完了")
    print(f"  - 比較級 + and + 比較級: 8問")
    print(f"  - the 比較級, the 比較級: 7問")
    print(f"  総問題数: {data['totalQuestions']}")

if __name__ == "__main__":
    add_comparative_constructions()
