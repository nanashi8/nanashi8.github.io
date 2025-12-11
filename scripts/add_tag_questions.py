#!/usr/bin/env python3
import json
from collections import Counter

def add_tag_questions():
    """付加疑問文30問をGrade 1 Unit 2に追加"""
    filepath = "public/data/grammar/grammar_grade1_unit2.json"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_questions = [
        # be動詞の付加疑問文 (10問)
        {"id": "g1-u2-tag-001", "type": "fillInBlank", "japanese": "あなたは学生ですよね", "sentence": "You are a student, ____ you?", "choices": ["aren't", "isn't", "don't"], "correctAnswer": "aren't", "difficulty": "intermediate", "explanation": "付加疑問文は「肯定文, 否定疑問?」の形。You are → aren't youとする構文として覚えること。「~ですよね」という確認の意味。", "hint": "aren't"},
        {"id": "g1-u2-tag-002", "type": "fillInBlank", "japanese": "彼は医者ですよね", "sentence": "He is a doctor, ____ he?", "choices": ["isn't", "aren't", "doesn't"], "correctAnswer": "isn't", "difficulty": "intermediate", "explanation": "付加疑問文は「肯定文, 否定疑問?」という構文として覚えること。He is → isn't heとなる。", "hint": "isn't"},
        {"id": "g1-u2-tag-003", "type": "sentenceOrdering", "japanese": "彼らは友達ですよね", "words": ["they", "are", "friends", "aren't", "they"], "correctAnswer": "They are friends, aren't they?", "difficulty": "intermediate", "explanation": "付加疑問文という構文として覚えること。They are → aren't theyと続ける。", "hint": "aren't they", "wordCount": 5},
        {"id": "g1-u2-tag-004", "type": "fillInBlank", "japanese": "それは簡単じゃないですよね", "sentence": "It isn't easy, ____ it?", "choices": ["is", "isn't", "doesn't"], "correctAnswer": "is", "difficulty": "intermediate", "explanation": "付加疑問文は「否定文, 肯定疑問?」の形になる構文として覚えること。isn't → isとなる。", "hint": "is"},
        {"id": "g1-u2-tag-005", "type": "fillInBlank", "japanese": "あなたたちは忙しいですよね", "sentence": "You are busy, ____ you?", "choices": ["aren't", "isn't", "don't"], "correctAnswer": "aren't", "difficulty": "beginner", "explanation": "付加疑問文は「肯定文, 否定疑問?」という構文として覚えること。You are → aren't you。", "hint": "aren't"},
        {"id": "g1-u2-tag-006", "type": "sentenceOrdering", "japanese": "彼女は先生じゃないですよね", "words": ["she", "isn't", "a", "teacher", "is", "she"], "correctAnswer": "She isn't a teacher, is she?", "difficulty": "intermediate", "explanation": "付加疑問文は「否定文, 肯定疑問?」という構文として覚えること。isn't → is。", "hint": "is she", "wordCount": 6},
        {"id": "g1-u2-tag-007", "type": "fillInBlank", "japanese": "これは彼のペンですよね", "sentence": "This is his pen, ____ it?", "choices": ["isn't", "aren't", "doesn't"], "correctAnswer": "isn't", "difficulty": "intermediate", "explanation": "付加疑問文という構文として覚えること。This is → isn't itとなる。", "hint": "isn't"},
        {"id": "g1-u2-tag-008", "type": "conversation", "japanese": "あなたは日本人ですよね", "situation": "確認", "dialogue": [{"speaker": "A", "text": "You are Japanese, ____ you?"}, {"speaker": "B", "text": "Yes, I am."}], "choices": ["aren't", "isn't", "don't"], "correctAnswer": "aren't", "difficulty": "beginner", "explanation": "付加疑問文は「肯定文, 否定疑問?」という構文として覚えること。", "hint": "aren't"},
        {"id": "g1-u2-tag-009", "type": "fillInBlank", "japanese": "私たちは遅刻していないですよね", "sentence": "We aren't late, ____ we?", "choices": ["are", "aren't", "do"], "correctAnswer": "are", "difficulty": "intermediate", "explanation": "付加疑問文は「否定文, 肯定疑問?」という構文として覚えること。aren't → areとなる。", "hint": "are"},
        {"id": "g1-u2-tag-010", "type": "sentenceOrdering", "japanese": "あれは彼女の自転車ですよね", "words": ["that", "is", "her", "bike", "isn't", "it"], "correctAnswer": "That is her bike, isn't it?", "difficulty": "intermediate", "explanation": "付加疑問文という構文として覚えること。That is → isn't it。", "hint": "isn't it", "wordCount": 6},
        
        # 一般動詞の付加疑問文 (15問)
        {"id": "g1-u2-tag-011", "type": "fillInBlank", "japanese": "あなたは英語を勉強しますよね", "sentence": "You study English, ____ you?", "choices": ["don't", "doesn't", "aren't"], "correctAnswer": "don't", "difficulty": "intermediate", "explanation": "一般動詞の付加疑問文は「肯定文, don't/doesn't...?」という構文として覚えること。You study → don't you。", "hint": "don't"},
        {"id": "g1-u2-tag-012", "type": "fillInBlank", "japanese": "彼はサッカーをしますよね", "sentence": "He plays soccer, ____ he?", "choices": ["doesn't", "don't", "isn't"], "correctAnswer": "doesn't", "difficulty": "intermediate", "explanation": "三人称単数の付加疑問文は「肯定文, doesn't...?」という構文として覚えること。He plays → doesn't he。", "hint": "doesn't"},
        {"id": "g1-u2-tag-013", "type": "sentenceOrdering", "japanese": "彼女は音楽が好きですよね", "words": ["she", "likes", "music", "doesn't", "she"], "correctAnswer": "She likes music, doesn't she?", "difficulty": "intermediate", "explanation": "三人称単数の付加疑問文という構文として覚えること。likes → doesn't。", "hint": "doesn't she", "wordCount": 5},
        {"id": "g1-u2-tag-014", "type": "fillInBlank", "japanese": "あなたはテレビを見ないですよね", "sentence": "You don't watch TV, ____ you?", "choices": ["do", "don't", "are"], "correctAnswer": "do", "difficulty": "intermediate", "explanation": "否定文の付加疑問文は「否定文, do/does...?」という構文として覚えること。don't → do。", "hint": "do"},
        {"id": "g1-u2-tag-015", "type": "fillInBlank", "japanese": "彼らは毎日走りますよね", "sentence": "They run every day, ____ they?", "choices": ["don't", "doesn't", "aren't"], "correctAnswer": "don't", "difficulty": "intermediate", "explanation": "複数の付加疑問文は「肯定文, don't...?」という構文として覚えること。They run → don't they。", "hint": "don't"},
        {"id": "g1-u2-tag-016", "type": "sentenceOrdering", "japanese": "彼は朝食を食べないですよね", "words": ["he", "doesn't", "eat", "breakfast", "does", "he"], "correctAnswer": "He doesn't eat breakfast, does he?", "difficulty": "intermediate", "explanation": "否定文の付加疑問文は「否定文, does...?」という構文として覚えること。", "hint": "does he", "wordCount": 6},
        {"id": "g1-u2-tag-017", "type": "fillInBlank", "japanese": "あなたは犬を飼っていますよね", "sentence": "You have a dog, ____ you?", "choices": ["don't", "doesn't", "haven't"], "correctAnswer": "don't", "difficulty": "intermediate", "explanation": "一般動詞haveの付加疑問文は「肯定文, don't...?」という構文として覚えること。", "hint": "don't"},
        {"id": "g1-u2-tag-018", "type": "conversation", "japanese": "彼女は日本語を話しますよね", "situation": "確認", "dialogue": [{"speaker": "A", "text": "She speaks Japanese, ____ she?"}, {"speaker": "B", "text": "Yes, she does."}], "choices": ["doesn't", "don't", "isn't"], "correctAnswer": "doesn't", "difficulty": "intermediate", "explanation": "三人称単数の付加疑問文という構文として覚えること。speaks → doesn't。", "hint": "doesn't"},
        {"id": "g1-u2-tag-019", "type": "fillInBlank", "japanese": "あなたたちは学校に行きますよね", "sentence": "You go to school, ____ you?", "choices": ["don't", "doesn't", "aren't"], "correctAnswer": "don't", "difficulty": "beginner", "explanation": "一般動詞の付加疑問文は「肯定文, don't...?」という構文として覚えること。", "hint": "don't"},
        {"id": "g1-u2-tag-020", "type": "sentenceOrdering", "japanese": "彼は野球をしないですよね", "words": ["he", "doesn't", "play", "baseball", "does", "he"], "correctAnswer": "He doesn't play baseball, does he?", "difficulty": "intermediate", "explanation": "否定文の付加疑問文という構文として覚えること。doesn't → does。", "hint": "does he", "wordCount": 6},
        {"id": "g1-u2-tag-021", "type": "fillInBlank", "japanese": "あなたは本を読みますよね", "sentence": "You read books, ____ you?", "choices": ["don't", "doesn't", "aren't"], "correctAnswer": "don't", "difficulty": "beginner", "explanation": "一般動詞の付加疑問文という構文として覚えること。You read → don't you。", "hint": "don't"},
        {"id": "g1-u2-tag-022", "type": "fillInBlank", "japanese": "彼女は早く起きないですよね", "sentence": "She doesn't get up early, ____ she?", "choices": ["does", "doesn't", "is"], "correctAnswer": "does", "difficulty": "intermediate", "explanation": "否定文の付加疑問文は「否定文, does...?」という構文として覚えること。", "hint": "does"},
        {"id": "g1-u2-tag-023", "type": "sentenceOrdering", "japanese": "彼らはここに住んでいますよね", "words": ["they", "live", "here", "don't", "they"], "correctAnswer": "They live here, don't they?", "difficulty": "intermediate", "explanation": "一般動詞の付加疑問文という構文として覚えること。live → don't。", "hint": "don't they", "wordCount": 5},
        {"id": "g1-u2-tag-024", "type": "conversation", "japanese": "あなたは車を運転しないですよね", "situation": "確認", "dialogue": [{"speaker": "A", "text": "You don't drive a car, ____ you?"}, {"speaker": "B", "text": "No, I don't."}], "choices": ["do", "don't", "are"], "correctAnswer": "do", "difficulty": "intermediate", "explanation": "否定文の付加疑問文は「否定文, do...?」という構文として覚えること。", "hint": "do"},
        {"id": "g1-u2-tag-025", "type": "fillInBlank", "japanese": "彼は数学を勉強しますよね", "sentence": "He studies math, ____ he?", "choices": ["doesn't", "don't", "isn't"], "correctAnswer": "doesn't", "difficulty": "intermediate", "explanation": "三人称単数の付加疑問文という構文として覚えること。studies → doesn't。", "hint": "doesn't"},
        
        # 命令文・Let's の付加疑問文 (5問)
        {"id": "g1-u2-tag-026", "type": "fillInBlank", "japanese": "公園に行きましょうよ", "sentence": "Let's go to the park, ____ we?", "choices": ["shall", "will", "do"], "correctAnswer": "shall", "difficulty": "advanced", "explanation": "Let's の付加疑問文は shall we? という構文として覚えること。Let's go → shall we?は決まった形。", "hint": "shall"},
        {"id": "g1-u2-tag-027", "type": "sentenceOrdering", "japanese": "一緒に昼食を食べましょうよ", "words": ["let's", "have", "lunch", "together", "shall", "we"], "correctAnswer": "Let's have lunch together, shall we?", "difficulty": "advanced", "explanation": "Let's の付加疑問文は shall we? という構文として覚えること。", "hint": "shall we", "wordCount": 6},
        {"id": "g1-u2-tag-028", "type": "fillInBlank", "japanese": "窓を開けてくれませんか", "sentence": "Open the window, ____ you?", "choices": ["will", "shall", "do"], "correctAnswer": "will", "difficulty": "advanced", "explanation": "命令文の付加疑問文は will you? という構文として覚えること。Open → will you?で丁寧な依頼になる。", "hint": "will"},
        {"id": "g1-u2-tag-029", "type": "fillInBlank", "japanese": "映画を見ましょうよ", "sentence": "Let's watch a movie, ____ we?", "choices": ["shall", "will", "do"], "correctAnswer": "shall", "difficulty": "advanced", "explanation": "Let's の付加疑問文は shall we? という構文として覚えること。", "hint": "shall"},
        {"id": "g1-u2-tag-030", "type": "sentenceOrdering", "japanese": "静かにしてくれませんか", "words": ["be", "quiet", "will", "you"], "correctAnswer": "Be quiet, will you?", "difficulty": "advanced", "explanation": "命令文の付加疑問文は will you? という構文として覚えること。", "hint": "will you", "wordCount": 4}
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
    
    print(f"✅ Grade 1 Unit 2に30問追加完了")
    print(f"  - be動詞の付加疑問文: 10問")
    print(f"  - 一般動詞の付加疑問文: 15問")
    print(f"  - Let's/命令文の付加疑問文: 5問")
    print(f"  総問題数: {data['totalQuestions']}")

if __name__ == "__main__":
    add_tag_questions()
