#!/usr/bin/env python3
import json
from collections import Counter

def add_prep_gerund_idioms():
    """前置詞+動名詞の熟語20問をGrade 3 Unit 5に追加"""
    filepath = "public/data/grammar/grammar_grade3_unit5.json"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_questions = [
        # look forward to doing (4問)
        {"id": "g3-u5-prep-001", "type": "fillInBlank", "japanese": "私は彼に会うのを楽しみにしています", "sentence": "I'm looking forward to ____ him.", "choices": ["seeing", "see", "seen"], "correctAnswer": "seeing", "difficulty": "intermediate", "explanation": "look forward to + doingで「~を楽しみにする」という熟語として覚えること。toの後は動名詞(~ing)を使う。I'm looking forward to seeing him.で「彼に会うのを楽しみにしている」。", "hint": "動名詞"},
        {"id": "g3-u5-prep-002", "type": "sentenceOrdering", "japanese": "私たちは旅行するのを楽しみにしています", "words": ["we", "are", "looking", "forward", "to", "traveling"], "correctAnswer": "We are looking forward to traveling.", "difficulty": "intermediate", "explanation": "look forward to + doingという熟語として覚えること。toの後は動名詞。", "hint": "to traveling", "wordCount": 6},
        {"id": "g3-u5-prep-003", "type": "conversation", "japanese": "私はあなたの返事を楽しみにしています", "situation": "期待", "dialogue": [{"speaker": "A", "text": "I'll write back soon."}, {"speaker": "B", "text": "I'm looking forward to ____ from you."}], "choices": ["hearing", "hear", "heard"], "correctAnswer": "hearing", "difficulty": "intermediate", "explanation": "look forward to + doingという熟語として覚えること。hear from~で「~から便りをもらう」。", "hint": "動名詞"},
        {"id": "g3-u5-prep-004", "type": "fillInBlank", "japanese": "彼女は試験に合格するのを楽しみにしています", "sentence": "She is looking forward to ____ the exam.", "choices": ["passing", "pass", "passed"], "correctAnswer": "passing", "difficulty": "intermediate", "explanation": "look forward to + doingという熟語として覚えること。toの後は動名詞。", "hint": "動名詞"},
        
        # be used to doing (4問)
        {"id": "g3-u5-prep-005", "type": "fillInBlank", "japanese": "私は早起きに慣れています", "sentence": "I'm used to ____ up early.", "choices": ["getting", "get", "got"], "correctAnswer": "getting", "difficulty": "intermediate", "explanation": "be used to + doingで「~に慣れている」という熟語として覚えること。toの後は動名詞。I'm used to getting up early.で「早起きに慣れている」。used to + 動詞原形(~したものだった)と区別すること。", "hint": "動名詞"},
        {"id": "g3-u5-prep-006", "type": "sentenceOrdering", "japanese": "彼は一人で暮らすのに慣れています", "words": ["he", "is", "used", "to", "living", "alone"], "correctAnswer": "He is used to living alone.", "difficulty": "intermediate", "explanation": "be used to + doingで「~に慣れている」という熟語として覚えること。", "hint": "to living", "wordCount": 6},
        {"id": "g3-u5-prep-007", "type": "paraphrase", "japanese": "彼女は英語を話すことに慣れました（speaking）", "originalSentence": "She got accustomed to speaking English.", "question": "She got used to ____ English.", "correctAnswer": "speaking", "difficulty": "intermediate", "explanation": "get used to + doingで「~に慣れる」という熟語として覚えること。get accustomed toと同じ意味。"},
        {"id": "g3-u5-prep-008", "type": "fillInBlank", "japanese": "私たちは暑い天気に慣れています", "sentence": "We are used to ____ hot weather.", "choices": ["having", "have", "had"], "correctAnswer": "having", "difficulty": "intermediate", "explanation": "be used to + doingという熟語として覚えること。toの後は動名詞。", "hint": "動名詞"},
        
        # Thank you for doing (3問)
        {"id": "g3-u5-prep-009", "type": "fillInBlank", "japanese": "手伝ってくれてありがとう", "sentence": "Thank you for ____ me.", "choices": ["helping", "help", "helped"], "correctAnswer": "helping", "difficulty": "beginner", "explanation": "Thank you for + doingで「~してくれてありがとう」という熟語として覚えること。forの後は動名詞。Thank you for helping me.で「手伝ってくれてありがとう」。", "hint": "動名詞"},
        {"id": "g3-u5-prep-010", "type": "sentenceOrdering", "japanese": "来てくれてありがとう", "words": ["thank", "you", "for", "coming"], "correctAnswer": "Thank you for coming.", "difficulty": "beginner", "explanation": "Thank you for + doingという熟語として覚えること。", "hint": "for coming", "wordCount": 4},
        {"id": "g3-u5-prep-011", "type": "conversation", "japanese": "教えてくれてありがとう", "situation": "感謝", "dialogue": [{"speaker": "A", "text": "Here's how to do it."}, {"speaker": "B", "text": "Thank you for ____ me."}], "choices": ["teaching", "teach", "taught"], "correctAnswer": "teaching", "difficulty": "beginner", "explanation": "Thank you for + doingという熟語として覚えること。", "hint": "動名詞"},
        
        # without doing (3問)
        {"id": "g3-u5-prep-012", "type": "fillInBlank", "japanese": "彼は何も言わずに出て行きました", "sentence": "He left without ____ anything.", "choices": ["saying", "say", "said"], "correctAnswer": "saying", "difficulty": "intermediate", "explanation": "without + doingで「~せずに」という構文として覚えること。withoutの後は動名詞。He left without saying anything.で「何も言わずに出て行った」。", "hint": "動名詞"},
        {"id": "g3-u5-prep-013", "type": "sentenceOrdering", "japanese": "彼女は朝食を食べずに出かけました", "words": ["she", "left", "without", "eating", "breakfast"], "correctAnswer": "She left without eating breakfast.", "difficulty": "intermediate", "explanation": "without + doingで「~せずに」という構文として覚えること。", "hint": "without eating", "wordCount": 5},
        {"id": "g3-u5-prep-014", "type": "fillInBlank", "japanese": "休まずに働き続けました", "sentence": "I kept working without ____.", "choices": ["resting", "rest", "rested"], "correctAnswer": "resting", "difficulty": "intermediate", "explanation": "without + doingで「~せずに」という構文として覚えること。", "hint": "動名詞"},
        
        # by doing (3問)
        {"id": "g3-u5-prep-015", "type": "fillInBlank", "japanese": "一生懸命勉強することで合格しました", "sentence": "I passed the exam by ____ hard.", "choices": ["studying", "study", "studied"], "correctAnswer": "studying", "difficulty": "intermediate", "explanation": "by + doingで「~することによって」という構文として覚えること。byの後は動名詞。I passed by studying hard.で「一生懸命勉強することで合格した」。", "hint": "動名詞"},
        {"id": "g3-u5-prep-016", "type": "sentenceOrdering", "japanese": "練習することで上達できます", "sentence": "あなたは練習することで上達できます", "words": ["you", "can", "improve", "by", "practicing"], "correctAnswer": "You can improve by practicing.", "difficulty": "intermediate", "explanation": "by + doingで「~することによって」という構文として覚えること。", "hint": "by practicing", "wordCount": 5},
        {"id": "g3-u5-prep-017", "type": "paraphrase", "japanese": "彼は走ることで健康を保ちます（running）", "originalSentence": "He stays healthy when he runs.", "question": "He stays healthy by ____.", "correctAnswer": "running", "difficulty": "intermediate", "explanation": "when構文をby + doingに書き換える。by running「走ることによって」となる。"},
        
        # その他の重要熟語 (3問)
        {"id": "g3-u5-prep-018", "type": "fillInBlank", "japanese": "彼女は歌うのが得意です", "sentence": "She is good at ____.", "choices": ["singing", "sing", "sung"], "correctAnswer": "singing", "difficulty": "beginner", "explanation": "be good at + doingで「~が得意だ」という熟語として覚えること。atの後は動名詞。", "hint": "動名詞"},
        {"id": "g3-u5-prep-019", "type": "fillInBlank", "japanese": "私は失敗することを恐れています", "sentence": "I'm afraid of ____.", "choices": ["failing", "fail", "failed"], "correctAnswer": "failing", "difficulty": "intermediate", "explanation": "be afraid of + doingで「~することを恐れる」という熟語として覚えること。ofの後は動名詞。", "hint": "動名詞"},
        {"id": "g3-u5-prep-020", "type": "sentenceOrdering", "japanese": "彼は遅刻したことを謝りました", "words": ["he", "apologized", "for", "being", "late"], "correctAnswer": "He apologized for being late.", "difficulty": "intermediate", "explanation": "apologize for + doingで「~したことを謝る」という熟語として覚えること。", "hint": "for being", "wordCount": 5}
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
    
    print(f"✅ Grade 3 Unit 5に20問追加完了")
    print(f"  - look forward to doing: 4問")
    print(f"  - be used to doing: 4問")
    print(f"  - Thank you for doing: 3問")
    print(f"  - without doing: 3問")
    print(f"  - by doing: 3問")
    print(f"  - その他(be good at/be afraid of/apologize for): 3問")
    print(f"  総問題数: {data['totalQuestions']}")

if __name__ == "__main__":
    add_prep_gerund_idioms()
