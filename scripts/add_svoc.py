#!/usr/bin/env python3
import json
from collections import Counter

def add_svoc_constructions():
    """第5文型SVOC構文30問をGrade 3 Unit 9に追加"""
    filepath = "public/data/grammar/grammar_grade3_unit9.json"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_questions = [
        # call+O+C (8問)
        {"id": "g3-u9-call-001", "type": "fillInBlank", "japanese": "彼らは私をケンと呼びます", "sentence": "They call me ____.", "choices": ["Ken", "to Ken", "calling Ken"], "correctAnswer": "Ken", "difficulty": "intermediate", "explanation": "call + 人 + 名前で「人を~と呼ぶ」という第5文型SVOCの構文として覚えること。They call me Ken.で「彼らは私をケンと呼ぶ」。", "hint": "名前"},
        {"id": "g3-u9-call-002", "type": "sentenceOrdering", "japanese": "私たちは彼をボブと呼びます", "words": ["we", "call", "him", "Bob"], "correctAnswer": "We call him Bob.", "difficulty": "intermediate", "explanation": "call + 人 + 名前という第5文型SVOCの構文として覚えること。", "hint": "call him", "wordCount": 4},
        {"id": "g3-u9-call-003", "type": "fillInBlank", "japanese": "彼女は私を友達と呼んでくれます", "sentence": "She calls me her ____.", "choices": ["friend", "to friend", "friendly"], "correctAnswer": "friend", "difficulty": "intermediate", "explanation": "call + 人 + 名詞で「人を~と呼ぶ」という第5文型SVOCの構文として覚えること。", "hint": "名詞"},
        {"id": "g3-u9-call-004", "type": "paraphrase", "japanese": "彼の名前はマイクです（call）", "originalSentence": "His name is Mike.", "question": "We call him ____.", "correctAnswer": "Mike", "difficulty": "intermediate", "explanation": "call + 人 + 名前という第5文型SVOCに書き換える。We call him Mike.となる。"},
        {"id": "g3-u9-call-005", "type": "conversation", "japanese": "私はそれを奇跡と呼びます", "situation": "説明", "dialogue": [{"speaker": "A", "text": "What do you call it?"}, {"speaker": "B", "text": "I call it a ____."}], "choices": ["miracle", "to miracle", "miraculous"], "correctAnswer": "miracle", "difficulty": "advanced", "explanation": "call + 物 + 名詞で「~を...と呼ぶ」という第5文型SVOCの構文として覚えること。", "hint": "名詞"},
        {"id": "g3-u9-call-006", "type": "sentenceOrdering", "japanese": "人々は彼をヒーローと呼びます", "words": ["people", "call", "him", "a", "hero"], "correctAnswer": "People call him a hero.", "difficulty": "intermediate", "explanation": "call + 人 + 名詞という第5文型SVOCの構文として覚えること。", "hint": "call him", "wordCount": 5},
        {"id": "g3-u9-call-007", "type": "fillInBlank", "japanese": "私たちはこの犬をポチと呼びます", "sentence": "We call this dog ____.", "choices": ["Pochi", "to Pochi", "calling Pochi"], "correctAnswer": "Pochi", "difficulty": "beginner", "explanation": "call + 物 + 名前という第5文型SVOCの構文として覚えること。", "hint": "名前"},
        {"id": "g3-u9-call-008", "type": "fillInBlank", "japanese": "彼らは彼女を天才と呼びます", "sentence": "They call her a ____.", "choices": ["genius", "to genius", "geniuses"], "correctAnswer": "genius", "difficulty": "advanced", "explanation": "call + 人 + 名詞で「人を~と呼ぶ」という第5文型SVOCの構文として覚えること。", "hint": "名詞"},
        
        # make+O+C (形容詞) (8問)
        {"id": "g3-u9-make-svoc-001", "type": "fillInBlank", "japanese": "その知らせは私を幸せにしました", "sentence": "The news made me ____.", "choices": ["happy", "happily", "happiness"], "correctAnswer": "happy", "difficulty": "intermediate", "explanation": "make + 人 + 形容詞で「人を~にする」という第5文型SVOCの構文として覚えること。made me happy「私を幸せにした」。", "hint": "形容詞"},
        {"id": "g3-u9-make-svoc-002", "type": "sentenceOrdering", "japanese": "音楽は私を元気にします", "words": ["music", "makes", "me", "energetic"], "correctAnswer": "Music makes me energetic.", "difficulty": "intermediate", "explanation": "make + 人 + 形容詞という第5文型SVOCの構文として覚えること。", "hint": "makes me", "wordCount": 4},
        {"id": "g3-u9-make-svoc-003", "type": "fillInBlank", "japanese": "その映画は彼女を悲しくさせました", "sentence": "The movie made her ____.", "choices": ["sad", "sadly", "sadness"], "correctAnswer": "sad", "difficulty": "intermediate", "explanation": "make + 人 + 形容詞で「人を~にする」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-make-svoc-004", "type": "paraphrase", "japanese": "その本で私は興奮しました（excited）", "originalSentence": "I was excited by the book.", "question": "The book made me ____.", "correctAnswer": "excited", "difficulty": "intermediate", "explanation": "受動態をmake + 人 + 形容詞という第5文型SVOCに書き換える。The book made me excited.となる。"},
        {"id": "g3-u9-make-svoc-005", "type": "fillInBlank", "japanese": "運動は私を健康にします", "sentence": "Exercise makes me ____.", "choices": ["healthy", "healthily", "health"], "correctAnswer": "healthy", "difficulty": "intermediate", "explanation": "make + 人 + 形容詞で「人を~にする」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-make-svoc-006", "type": "conversation", "japanese": "その話は私を怒らせました", "situation": "感情", "dialogue": [{"speaker": "A", "text": "How did you feel?"}, {"speaker": "B", "text": "The story made me ____."}], "choices": ["angry", "angrily", "anger"], "correctAnswer": "angry", "difficulty": "intermediate", "explanation": "make + 人 + 形容詞という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-make-svoc-007", "type": "sentenceOrdering", "japanese": "その歌は私たちを幸せにしました", "words": ["the", "song", "made", "us", "happy"], "correctAnswer": "The song made us happy.", "difficulty": "beginner", "explanation": "make + 人 + 形容詞という第5文型SVOCの構文として覚えること。", "hint": "made us", "wordCount": 5},
        {"id": "g3-u9-make-svoc-008", "type": "fillInBlank", "japanese": "その経験は彼を強くしました", "sentence": "The experience made him ____.", "choices": ["strong", "strongly", "strength"], "correctAnswer": "strong", "difficulty": "intermediate", "explanation": "make + 人 + 形容詞で「人を~にする」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        
        # keep+O+C (7問)
        {"id": "g3-u9-keep-001", "type": "fillInBlank", "japanese": "彼は部屋をきれいに保ちます", "sentence": "He keeps his room ____.", "choices": ["clean", "cleanly", "cleaning"], "correctAnswer": "clean", "difficulty": "intermediate", "explanation": "keep + 物 + 形容詞で「~を...の状態に保つ」という第5文型SVOCの構文として覚えること。keeps his room clean「部屋をきれいに保つ」。", "hint": "形容詞"},
        {"id": "g3-u9-keep-002", "type": "sentenceOrdering", "japanese": "私は窓を開けたままにしておきます", "words": ["I", "keep", "the", "window", "open"], "correctAnswer": "I keep the window open.", "difficulty": "intermediate", "explanation": "keep + 物 + 形容詞で「~を...の状態に保つ」という第5文型SVOCの構文として覚えること。", "hint": "keep open", "wordCount": 5},
        {"id": "g3-u9-keep-003", "type": "fillInBlank", "japanese": "彼女は子供たちを静かにさせておきます", "sentence": "She keeps the children ____.", "choices": ["quiet", "quietly", "quietness"], "correctAnswer": "quiet", "difficulty": "intermediate", "explanation": "keep + 人 + 形容詞で「人を~の状態に保つ」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-keep-004", "type": "fillInBlank", "japanese": "私たちは食べ物を新鮮に保ちます", "sentence": "We keep the food ____.", "choices": ["fresh", "freshly", "freshness"], "correctAnswer": "fresh", "difficulty": "intermediate", "explanation": "keep + 物 + 形容詞で「~を...の状態に保つ」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-keep-005", "type": "conversation", "japanese": "私は部屋を暖かく保ちます", "situation": "状態維持", "dialogue": [{"speaker": "A", "text": "How do you stay comfortable?"}, {"speaker": "B", "text": "I keep the room ____."}], "choices": ["warm", "warmly", "warmth"], "correctAnswer": "warm", "difficulty": "intermediate", "explanation": "keep + 物 + 形容詞という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-keep-006", "type": "sentenceOrdering", "japanese": "彼はドアを閉めたままにします", "words": ["he", "keeps", "the", "door", "closed"], "correctAnswer": "He keeps the door closed.", "difficulty": "intermediate", "explanation": "keep + 物 + 過去分詞で「~を...の状態に保つ」という第5文型SVOCの構文として覚えること。", "hint": "keeps closed", "wordCount": 5},
        {"id": "g3-u9-keep-007", "type": "fillInBlank", "japanese": "彼女は髪を長く保っています", "sentence": "She keeps her hair ____.", "choices": ["long", "length", "lengthy"], "correctAnswer": "long", "difficulty": "beginner", "explanation": "keep + 物 + 形容詞で「~を...の状態に保つ」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        
        # find+O+C (7問)
        {"id": "g3-u9-find-001", "type": "fillInBlank", "japanese": "私はその問題が難しいとわかりました", "sentence": "I found the problem ____.", "choices": ["difficult", "difficultly", "difficulty"], "correctAnswer": "difficult", "difficulty": "intermediate", "explanation": "find + 物 + 形容詞で「~が...だとわかる」という第5文型SVOCの構文として覚えること。found the problem difficult「その問題が難しいとわかった」。", "hint": "形容詞"},
        {"id": "g3-u9-find-002", "type": "sentenceOrdering", "japanese": "彼はその本が面白いとわかりました", "words": ["he", "found", "the", "book", "interesting"], "correctAnswer": "He found the book interesting.", "difficulty": "intermediate", "explanation": "find + 物 + 形容詞で「~が...だとわかる」という第5文型SVOCの構文として覚えること。", "hint": "found interesting", "wordCount": 5},
        {"id": "g3-u9-find-003", "type": "fillInBlank", "japanese": "彼女はそのテストが簡単だとわかりました", "sentence": "She found the test ____.", "choices": ["easy", "easily", "easiness"], "correctAnswer": "easy", "difficulty": "intermediate", "explanation": "find + 物 + 形容詞で「~が...だとわかる」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-find-004", "type": "paraphrase", "japanese": "私はその映画がつまらないと思いました（boring）", "originalSentence": "I thought the movie was boring.", "question": "I found the movie ____.", "correctAnswer": "boring", "difficulty": "intermediate", "explanation": "think構文をfind + 物 + 形容詞という第5文型SVOCに書き換える。I found the movie boring.となる。"},
        {"id": "g3-u9-find-005", "type": "fillInBlank", "japanese": "私たちはその話が奇妙だとわかりました", "sentence": "We found the story ____.", "choices": ["strange", "strangely", "strangeness"], "correctAnswer": "strange", "difficulty": "intermediate", "explanation": "find + 物 + 形容詞で「~が...だとわかる」という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-find-006", "type": "conversation", "japanese": "私はその仕事が大変だとわかりました", "situation": "発見", "dialogue": [{"speaker": "A", "text": "How was the job?"}, {"speaker": "B", "text": "I found it ____."}], "choices": ["hard", "hardly", "hardness"], "correctAnswer": "hard", "difficulty": "intermediate", "explanation": "find + 物 + 形容詞という第5文型SVOCの構文として覚えること。", "hint": "形容詞"},
        {"id": "g3-u9-find-007", "type": "sentenceOrdering", "japanese": "彼は英語が役に立つとわかりました", "words": ["he", "found", "English", "useful"], "correctAnswer": "He found English useful.", "difficulty": "intermediate", "explanation": "find + 物 + 形容詞で「~が...だとわかる」という第5文型SVOCの構文として覚えること。", "hint": "found useful", "wordCount": 4}
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
    
    print(f"✅ Grade 3 Unit 9に30問追加完了")
    print(f"  - call + O + C: 8問")
    print(f"  - make + O + C(形容詞): 8問")
    print(f"  - keep + O + C: 7問")
    print(f"  - find + O + C: 7問")
    print(f"  総問題数: {data['totalQuestions']}")

if __name__ == "__main__":
    add_svoc_constructions()
