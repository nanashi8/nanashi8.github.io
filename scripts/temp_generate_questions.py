#!/usr/bin/env python3
"""
文法問題一括生成スクリプト

使用方法:
    python scripts/generate_unit_questions.py grammar_grade2_unit2.json

このスクリプトは、指定された文法ユニットの全問題を生成します。
"""

import json
from pathlib import Path

def generate_future_tense_questions():
    """未来表現(will/be going to)の60問を生成"""
    
    # fillInBlank: 15問
    fill_in_blank = [
        {
            "id": "g2-u2-fib-001",
            "type": "fillInBlank",
            "japanese": "私は明日東京へ行きます。",
            "sentence": "I ____ go to Tokyo tomorrow.",
            "choices": ["will", "am", "was"],
            "correctAnswer": "will",
            "difficulty": "beginner",
            "explanation": "未来のことを表すにはwillを使います。tomorrow（明日）があるので未来形willが正解です。",
            "hint": "未来を表す助動詞"
        },
        {
            "id": "g2-u2-fib-002",
            "type": "fillInBlank",
            "japanese": "彼女は来週京都を訪れる予定です。",
            "sentence": "She ____ visit Kyoto next week.",
            "choices": ["is going to", "goes", "went"],
            "correctAnswer": "is going to",
            "difficulty": "beginner",
            "explanation": "予定を表すにはbe going toを使います。next week（来週）があるので未来形です。主語がsheなのでisを使います。",
            "hint": "予定を表す表現"
        },
        {
            "id": "g2-u2-fib-003",
            "type": "fillInBlank",
            "japanese": "明日は雨が降るでしょう。",
            "sentence": "It ____ rain tomorrow.",
            "choices": ["will", "is", "was"],
            "correctAnswer": "will",
            "difficulty": "beginner",
            "explanation": "天気の予測など、その場で判断した未来のことにはwillを使います。",
            "hint": "予測を表す"
        },
        {
            "id": "g2-u2-fib-004",
            "type": "fillInBlank",
            "japanese": "私たちは今年の夏に沖縄へ行く予定です。",
            "sentence": "We ____ go to Okinawa this summer.",
            "choices": ["are going to", "go", "went"],
            "correctAnswer": "are going to",
            "difficulty": "intermediate",
            "explanation": "事前に決めていた計画にはbe going toを使います。主語がweなのでareを使います。",
            "hint": "計画を表す"
        },
        {
            "id": "g2-u2-fib-005",
            "type": "fillInBlank",
            "japanese": "彼は今夜テレビを見るつもりです。",
            "sentence": "He ____ watch TV tonight.",
            "choices": ["is going to", "watches", "watched"],
            "correctAnswer": "is going to",
            "difficulty": "beginner",
            "explanation": "tonight（今夜）という未来の予定を表すにはbe going toを使います。主語がheなのでisを使います。",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-fib-006",
            "type": "fillInBlank",
            "japanese": "彼らは来月新しい家に引っ越します。",
            "sentence": "They ____ move to a new house next month.",
            "choices": ["will", "are", "moved"],
            "correctAnswer": "will",
            "difficulty": "intermediate",
            "explanation": "next month（来月）という未来のことを表すにはwillを使います。",
            "hint": "未来の行動"
        },
        {
            "id": "g2-u2-fib-007",
            "type": "fillInBlank",
            "japanese": "私は週末に友達と会う予定です。",
            "sentence": "I ____ meet my friends this weekend.",
            "choices": ["am going to", "meet", "met"],
            "correctAnswer": "am going to",
            "difficulty": "beginner",
            "explanation": "週末の予定を表すにはbe going toを使います。主語がIなのでamを使います。",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-fib-008",
            "type": "fillInBlank",
            "japanese": "彼女は来年大学生になります。",
            "sentence": "She ____ be a university student next year.",
            "choices": ["will", "is", "was"],
            "correctAnswer": "will",
            "difficulty": "intermediate",
            "explanation": "next year（来年）という未来のことにはwillを使います。",
            "hint": "未来の状態"
        },
        {
            "id": "g2-u2-fib-009",
            "type": "fillInBlank",
            "japanese": "私たちは今日の午後サッカーをする予定です。",
            "sentence": "We ____ play soccer this afternoon.",
            "choices": ["are going to", "play", "played"],
            "correctAnswer": "are going to",
            "difficulty": "beginner",
            "explanation": "午後の予定を表すにはbe going toを使います。主語がweなのでareを使います。",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-fib-010",
            "type": "fillInBlank",
            "japanese": "彼は将来医者になるでしょう。",
            "sentence": "He ____ be a doctor in the future.",
            "choices": ["will", "is", "was"],
            "correctAnswer": "will",
            "difficulty": "intermediate",
            "explanation": "in the future（将来）という未来の予測にはwillを使います。",
            "hint": "将来の予測"
        },
        {
            "id": "g2-u2-fib-011",
            "type": "fillInBlank",
            "japanese": "私は明日早く起きるつもりです。",
            "sentence": "I ____ get up early tomorrow.",
            "choices": ["am going to", "get", "got"],
            "correctAnswer": "am going to",
            "difficulty": "beginner",
            "explanation": "明日の予定を表すにはbe going toを使います。主語がIなのでamを使います。",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-fib-012",
            "type": "fillInBlank",
            "japanese": "彼女たちは来週コンサートに行きます。",
            "sentence": "They ____ go to a concert next week.",
            "choices": ["will", "are", "went"],
            "correctAnswer": "will",
            "difficulty": "intermediate",
            "explanation": "next week（来週）という未来のことにはwillを使います。",
            "hint": "未来の行動"
        },
        {
            "id": "g2-u2-fib-013",
            "type": "fillInBlank",
            "japanese": "彼は今晩宿題をする予定です。",
            "sentence": "He ____ do his homework tonight.",
            "choices": ["is going to", "does", "did"],
            "correctAnswer": "is going to",
            "difficulty": "beginner",
            "explanation": "tonight（今晩）の予定を表すにはbe going toを使います。主語がheなのでisを使います。",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-fib-014",
            "type": "fillInBlank",
            "japanese": "私たちは来月試験があります。",
            "sentence": "We ____ have an exam next month.",
            "choices": ["will", "are", "had"],
            "correctAnswer": "will",
            "difficulty": "intermediate",
            "explanation": "next month（来月）の予定を表すにはwillを使います。",
            "hint": "未来の予定"
        },
        {
            "id": "g2-u2-fib-015",
            "type": "fillInBlank",
            "japanese": "彼女は明日新しいドレスを買う予定です。",
            "sentence": "She ____ buy a new dress tomorrow.",
            "choices": ["is going to", "buys", "bought"],
            "correctAnswer": "is going to",
            "difficulty": "intermediate",
            "explanation": "明日の予定を表すにはbe going toを使います。主語がsheなのでisを使います。",
            "hint": "予定を表す"
        }
    ]
    
    # sentenceOrdering: 15問
    sentence_ordering = [
        {
            "id": "g2-u2-so-001",
            "type": "sentenceOrdering",
            "japanese": "私は明日映画を見に行きます。",
            "words": ["I", "will", "go", "to", "see", "a", "movie", "tomorrow"],
            "correctAnswer": "I will go to see a movie tomorrow.",
            "difficulty": "beginner",
            "grammarPoint": "will + 動詞の原形",
            "hint": "will の語順"
        },
        {
            "id": "g2-u2-so-002",
            "type": "sentenceOrdering",
            "japanese": "彼女は来週京都を訪れる予定です。",
            "words": ["she", "is", "going", "to", "visit", "Kyoto", "next", "week"],
            "correctAnswer": "She is going to visit Kyoto next week.",
            "difficulty": "intermediate",
            "grammarPoint": "be going to + 動詞の原形",
            "hint": "be going to の語順"
        },
        {
            "id": "g2-u2-so-003",
            "type": "sentenceOrdering",
            "japanese": "彼らは今晩パーティーを開きます。",
            "words": ["they", "will", "have", "a", "party", "tonight"],
            "correctAnswer": "They will have a party tonight.",
            "difficulty": "beginner",
            "grammarPoint": "will + 動詞の原形",
            "hint": "未来を表す文"
        },
        {
            "id": "g2-u2-so-004",
            "type": "sentenceOrdering",
            "japanese": "私たちは来月旅行に行く予定です。",
            "words": ["we", "are", "going", "to", "go", "on", "a", "trip", "next", "month"],
            "correctAnswer": "We are going to go on a trip next month.",
            "difficulty": "intermediate",
            "grammarPoint": "be going to + 動詞の原形",
            "hint": "be going to の語順"
        },
        {
            "id": "g2-u2-so-005",
            "type": "sentenceOrdering",
            "japanese": "彼は来年高校生になります。",
            "words": ["he", "will", "be", "a", "high", "school", "student", "next", "year"],
            "correctAnswer": "He will be a high school student next year.",
            "difficulty": "intermediate",
            "grammarPoint": "will + be",
            "hint": "未来の状態"
        },
        {
            "id": "g2-u2-so-006",
            "type": "sentenceOrdering",
            "japanese": "私は明日早く起きるつもりです。",
            "words": ["I", "am", "going", "to", "get", "up", "early", "tomorrow"],
            "correctAnswer": "I am going to get up early tomorrow.",
            "difficulty": "beginner",
            "grammarPoint": "be going to + 動詞の原形",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-so-007",
            "type": "sentenceOrdering",
            "japanese": "彼女は週末に買い物に行きます。",
            "words": ["she", "will", "go", "shopping", "this", "weekend"],
            "correctAnswer": "She will go shopping this weekend.",
            "difficulty": "beginner",
            "grammarPoint": "will + go shopping",
            "hint": "未来の行動"
        },
        {
            "id": "g2-u2-so-008",
            "type": "sentenceOrdering",
            "japanese": "私たちは今日の午後公園で遊ぶ予定です。",
            "words": ["we", "are", "going", "to", "play", "in", "the", "park", "this", "afternoon"],
            "correctAnswer": "We are going to play in the park this afternoon.",
            "difficulty": "intermediate",
            "grammarPoint": "be going to + 動詞の原形",
            "hint": "be going to の語順"
        },
        {
            "id": "g2-u2-so-009",
            "type": "sentenceOrdering",
            "japanese": "彼は明日テストを受けます。",
            "words": ["he", "will", "take", "a", "test", "tomorrow"],
            "correctAnswer": "He will take a test tomorrow.",
            "difficulty": "beginner",
            "grammarPoint": "will + 動詞の原形",
            "hint": "未来の予定"
        },
        {
            "id": "g2-u2-so-010",
            "type": "sentenceOrdering",
            "japanese": "私は来週友達に会う予定です。",
            "words": ["I", "am", "going", "to", "meet", "my", "friend", "next", "week"],
            "correctAnswer": "I am going to meet my friend next week.",
            "difficulty": "intermediate",
            "grammarPoint": "be going to + 動詞の原形",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-so-011",
            "type": "sentenceOrdering",
            "japanese": "彼女は今晩夕食を作ります。",
            "words": ["she", "will", "cook", "dinner", "tonight"],
            "correctAnswer": "She will cook dinner tonight.",
            "difficulty": "beginner",
            "grammarPoint": "will + 動詞の原形",
            "hint": "未来の行動"
        },
        {
            "id": "g2-u2-so-012",
            "type": "sentenceOrdering",
            "japanese": "私たちは来月東京に引っ越す予定です。",
            "words": ["we", "are", "going", "to", "move", "to", "Tokyo", "next", "month"],
            "correctAnswer": "We are going to move to Tokyo next month.",
            "difficulty": "intermediate",
            "grammarPoint": "be going to + 動詞の原形",
            "hint": "be going to の語順"
        },
        {
            "id": "g2-u2-so-013",
            "type": "sentenceOrdering",
            "japanese": "彼は来年海外に行きます。",
            "words": ["he", "will", "go", "abroad", "next", "year"],
            "correctAnswer": "He will go abroad next year.",
            "difficulty": "intermediate",
            "grammarPoint": "will + 動詞の原形",
            "hint": "未来の予定"
        },
        {
            "id": "g2-u2-so-014",
            "type": "sentenceOrdering",
            "japanese": "私は明日図書館で勉強する予定です。",
            "words": ["I", "am", "going", "to", "study", "at", "the", "library", "tomorrow"],
            "correctAnswer": "I am going to study at the library tomorrow.",
            "difficulty": "intermediate",
            "grammarPoint": "be going to + 動詞の原形",
            "hint": "予定を表す"
        },
        {
            "id": "g2-u2-so-015",
            "type": "sentenceOrdering",
            "japanese": "彼女は来週ピアノのレッスンを受けます。",
            "words": ["she", "will", "have", "a", "piano", "lesson", "next", "week"],
            "correctAnswer": "She will have a piano lesson next week.",
            "difficulty": "intermediate",
            "grammarPoint": "will + 動詞の原形",
            "hint": "未来の予定"
        }
    ]
    
    # 続きは次のコメントで...
    print(f"Generated {len(fill_in_blank)} fillInBlank questions")
    print(f"Generated {len(sentence_ordering)} sentenceOrdering questions")
    
    return {
        "fillInBlank": fill_in_blank,
        "sentenceOrdering": sentence_ordering,
        # 他の問題タイプも追加予定
    }

if __name__ == "__main__":
    questions = generate_future_tense_questions()
    print(json.dumps(questions, ensure_ascii=False, indent=2))
