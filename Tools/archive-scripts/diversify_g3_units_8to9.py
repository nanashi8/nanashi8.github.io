#!/usr/bin/env python3
"""
G3 Units 8-9 完全多様化スクリプト
間接疑問文・比較級の20問を全て異なる例文に変更
"""
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "nanashi8.github.io" / "public" / "data"

# ===== Unit 8: 間接疑問文 (Indirect Questions) =====
def build_unit8_indirect():
    """間接疑問文 (疑問詞 + S + V) の20問 - 全て異なる疑問詞・動詞・文脈"""
    vf = [
        {"id": "vf-g3-u8-001", "japanese": "私は彼がどこに住んでいるか知りません", "sentence": "I don't know where he ____.", "verb": "indirect", "choices": ["lives", "live", "living", "lived"], "correctAnswer": "lives", "difficulty": "intermediate", "explanation": "間接疑問文: where + S + V", "hint": "where he lives"},
        {"id": "vf-g3-u8-002", "japanese": "彼女は何が起こったか知っています", "sentence": "She knows what ____.", "verb": "indirect", "choices": ["happened", "happen", "happens", "happening"], "correctAnswer": "happened", "difficulty": "intermediate", "explanation": "間接疑問文: what + V", "hint": "what happened"},
        {"id": "vf-g3-u8-003", "japanese": "私はいつ彼が来るか分かりません", "sentence": "I don't know when he will ____.", "verb": "indirect", "choices": ["come", "comes", "coming", "came"], "correctAnswer": "come", "difficulty": "intermediate", "explanation": "間接疑問文: when + S + V", "hint": "when he will come"},
        {"id": "vf-g3-u8-004", "japanese": "彼はなぜ彼女が泣いているか知っています", "sentence": "He knows why she is ____.", "verb": "indirect", "choices": ["crying", "cry", "cries", "cried"], "correctAnswer": "crying", "difficulty": "intermediate", "explanation": "間接疑問文: why + S + V", "hint": "why she is crying"},
        {"id": "vf-g3-u8-005", "japanese": "私は誰がこれを作ったか知っています", "sentence": "I know who ____ this.", "verb": "indirect", "choices": ["made", "make", "makes", "making"], "correctAnswer": "made", "difficulty": "intermediate", "explanation": "間接疑問文: who + V", "hint": "who made"},
        {"id": "vf-g3-u8-006", "japanese": "彼女はどうやってそこに行くか分かりません", "sentence": "She doesn't know how to ____ there.", "verb": "indirect", "choices": ["get", "gets", "getting", "got"], "correctAnswer": "get", "difficulty": "intermediate", "explanation": "間接疑問文: how to + V", "hint": "how to get"},
        {"id": "vf-g3-u8-007", "japanese": "私はどの本が一番良いか分かりません", "sentence": "I don't know which book ____ the best.", "verb": "indirect", "choices": ["is", "are", "was", "were"], "correctAnswer": "is", "difficulty": "intermediate", "explanation": "間接疑問文: which + N + V", "hint": "which book is"},
        {"id": "vf-g3-u8-008", "japanese": "彼は何時に店が開くか知っています", "sentence": "He knows what time the store ____.", "verb": "indirect", "choices": ["opens", "open", "opening", "opened"], "correctAnswer": "opens", "difficulty": "intermediate", "explanation": "間接疑問文: what time + S + V", "hint": "what time it opens"},
        {"id": "vf-g3-u8-009", "japanese": "私たちはどこで彼女に会えるか知りません", "sentence": "We don't know where we can ____ her.", "verb": "indirect", "choices": ["meet", "meets", "meeting", "met"], "correctAnswer": "meet", "difficulty": "intermediate", "explanation": "間接疑問文: where + S + V", "hint": "where we can meet"},
        {"id": "vf-g3-u8-010", "japanese": "彼女はなぜ彼が怒っているか理解しています", "sentence": "She understands why he is ____.", "verb": "indirect", "choices": ["angry", "anger", "angrily", "angrier"], "correctAnswer": "angry", "difficulty": "intermediate", "explanation": "間接疑問文: why + S + be", "hint": "why he is angry"},
        {"id": "vf-g3-u8-011", "japanese": "私はいつバスが出発するか知りたいです", "sentence": "I want to know when the bus ____.", "verb": "indirect", "choices": ["leaves", "leave", "leaving", "left"], "correctAnswer": "leaves", "difficulty": "intermediate", "explanation": "間接疑問文: when + S + V", "hint": "when the bus leaves"},
        {"id": "vf-g3-u8-012", "japanese": "彼は誰が勝つか予測できます", "sentence": "He can predict who will ____.", "verb": "indirect", "choices": ["win", "wins", "winning", "won"], "correctAnswer": "win", "difficulty": "intermediate", "explanation": "間接疑問文: who + V", "hint": "who will win"},
        {"id": "vf-g3-u8-013", "japanese": "私たちはどうやって問題を解決するか話し合いました", "sentence": "We discussed how to ____ the problem.", "verb": "indirect", "choices": ["solve", "solves", "solving", "solved"], "correctAnswer": "solve", "difficulty": "intermediate", "explanation": "間接疑問文: how to + V", "hint": "how to solve"},
        {"id": "vf-g3-u8-014", "japanese": "彼女は何が必要か教えてくれました", "sentence": "She told me what I ____.", "verb": "indirect", "choices": ["need", "needs", "needing", "needed"], "correctAnswer": "need", "difficulty": "intermediate", "explanation": "間接疑問文: what + S + V", "hint": "what I need"},
        {"id": "vf-g3-u8-015", "japanese": "私はどこで鍵を置いたか忘れました", "sentence": "I forgot where I ____ the key.", "verb": "indirect", "choices": ["put", "puts", "putting", "putted"], "correctAnswer": "put", "difficulty": "intermediate", "explanation": "間接疑問文: where + S + V", "hint": "where I put"},
        {"id": "vf-g3-u8-016", "japanese": "彼はなぜそれが重要か説明しました", "sentence": "He explained why it ____ important.", "verb": "indirect", "choices": ["is", "are", "was", "were"], "correctAnswer": "is", "difficulty": "intermediate", "explanation": "間接疑問文: why + S + V", "hint": "why it is"},
        {"id": "vf-g3-u8-017", "japanese": "私たちはいつ会議が始まるか確認しました", "sentence": "We checked when the meeting ____.", "verb": "indirect", "choices": ["starts", "start", "starting", "started"], "correctAnswer": "starts", "difficulty": "intermediate", "explanation": "間接疑問文: when + S + V", "hint": "when it starts"},
        {"id": "vf-g3-u8-018", "japanese": "彼女はどの道が最短か知っています", "sentence": "She knows which route ____ the shortest.", "verb": "indirect", "choices": ["is", "are", "was", "were"], "correctAnswer": "is", "difficulty": "intermediate", "explanation": "間接疑問文: which + N + V", "hint": "which route is"},
        {"id": "vf-g3-u8-019", "japanese": "私は何が彼を幸せにするか知っています", "sentence": "I know what ____ him happy.", "verb": "indirect", "choices": ["makes", "make", "making", "made"], "correctAnswer": "makes", "difficulty": "intermediate", "explanation": "間接疑問文: what + V", "hint": "what makes"},
        {"id": "vf-g3-u8-020", "japanese": "彼はどうやって成功したか語りました", "sentence": "He told us how he ____.", "verb": "indirect", "choices": ["succeeded", "succeed", "succeeds", "succeeding"], "correctAnswer": "succeeded", "difficulty": "intermediate", "explanation": "間接疑問文: how + S + V", "hint": "how he succeeded"},
    ]
    
    fb = [{"id": f"fb-g3-u8-{i:03d}", "japanese": q["japanese"], "sentence": q["sentence"], "wordCount": len(q["sentence"].split()), "choices": q["choices"], "correctAnswer": q["correctAnswer"], "difficulty": "intermediate", "hint": q["hint"]} for i, q in enumerate(vf, 1)]
    
    so = [
        {"id": "so-g3-u8-001", "japanese": "私は彼がどこに住んでいるか知りません", "sentence": "I don't know where he lives.", "words": ["I", "don't", "know", "where", "he", "lives"], "correctAnswer": "I don't know where he lives", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "where he lives"},
        {"id": "so-g3-u8-002", "japanese": "彼女は何が起こったか知っています", "sentence": "She knows what happened.", "words": ["She", "knows", "what", "happened"], "correctAnswer": "She knows what happened", "wordCount": 4, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "what happened"},
        {"id": "so-g3-u8-003", "japanese": "私はいつ彼が来るか分かりません", "sentence": "I don't know when he will come.", "words": ["I", "don't", "know", "when", "he", "will", "come"], "correctAnswer": "I don't know when he will come", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "when he will come"},
        {"id": "so-g3-u8-004", "japanese": "彼はなぜ彼女が泣いているか知っています", "sentence": "He knows why she is crying.", "words": ["He", "knows", "why", "she", "is", "crying"], "correctAnswer": "He knows why she is crying", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "why she is crying"},
        {"id": "so-g3-u8-005", "japanese": "私は誰がこれを作ったか知っています", "sentence": "I know who made this.", "words": ["I", "know", "who", "made", "this"], "correctAnswer": "I know who made this", "wordCount": 5, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "who made"},
        {"id": "so-g3-u8-006", "japanese": "彼女はどうやってそこに行くか分かりません", "sentence": "She doesn't know how to get there.", "words": ["She", "doesn't", "know", "how", "to", "get", "there"], "correctAnswer": "She doesn't know how to get there", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "how to get"},
        {"id": "so-g3-u8-007", "japanese": "私はどの本が一番良いか分かりません", "sentence": "I don't know which book is the best.", "words": ["I", "don't", "know", "which", "book", "is", "the", "best"], "correctAnswer": "I don't know which book is the best", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "which book is"},
        {"id": "so-g3-u8-008", "japanese": "彼は何時に店が開くか知っています", "sentence": "He knows what time the store opens.", "words": ["He", "knows", "what", "time", "the", "store", "opens"], "correctAnswer": "He knows what time the store opens", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "what time"},
        {"id": "so-g3-u8-009", "japanese": "私たちはどこで彼女に会えるか知りません", "sentence": "We don't know where we can meet her.", "words": ["We", "don't", "know", "where", "we", "can", "meet", "her"], "correctAnswer": "We don't know where we can meet her", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "where we can"},
        {"id": "so-g3-u8-010", "japanese": "彼女はなぜ彼が怒っているか理解しています", "sentence": "She understands why he is angry.", "words": ["She", "understands", "why", "he", "is", "angry"], "correctAnswer": "She understands why he is angry", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "why he is"},
        {"id": "so-g3-u8-011", "japanese": "私はいつバスが出発するか知りたいです", "sentence": "I want to know when the bus leaves.", "words": ["I", "want", "to", "know", "when", "the", "bus", "leaves"], "correctAnswer": "I want to know when the bus leaves", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "when the bus leaves"},
        {"id": "so-g3-u8-012", "japanese": "彼は誰が勝つか予測できます", "sentence": "He can predict who will win.", "words": ["He", "can", "predict", "who", "will", "win"], "correctAnswer": "He can predict who will win", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "who will win"},
        {"id": "so-g3-u8-013", "japanese": "私たちはどうやって問題を解決するか話し合いました", "sentence": "We discussed how to solve the problem.", "words": ["We", "discussed", "how", "to", "solve", "the", "problem"], "correctAnswer": "We discussed how to solve the problem", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "how to solve"},
        {"id": "so-g3-u8-014", "japanese": "彼女は何が必要か教えてくれました", "sentence": "She told me what I need.", "words": ["She", "told", "me", "what", "I", "need"], "correctAnswer": "She told me what I need", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "what I need"},
        {"id": "so-g3-u8-015", "japanese": "私はどこで鍵を置いたか忘れました", "sentence": "I forgot where I put the key.", "words": ["I", "forgot", "where", "I", "put", "the", "key"], "correctAnswer": "I forgot where I put the key", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "where I put"},
        {"id": "so-g3-u8-016", "japanese": "彼はなぜそれが重要か説明しました", "sentence": "He explained why it is important.", "words": ["He", "explained", "why", "it", "is", "important"], "correctAnswer": "He explained why it is important", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "why it is"},
        {"id": "so-g3-u8-017", "japanese": "私たちはいつ会議が始まるか確認しました", "sentence": "We checked when the meeting starts.", "words": ["We", "checked", "when", "the", "meeting", "starts"], "correctAnswer": "We checked when the meeting starts", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "when it starts"},
        {"id": "so-g3-u8-018", "japanese": "彼女はどの道が最短か知っています", "sentence": "She knows which route is the shortest.", "words": ["She", "knows", "which", "route", "is", "the", "shortest"], "correctAnswer": "She knows which route is the shortest", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "which route is"},
        {"id": "so-g3-u8-019", "japanese": "私は何が彼を幸せにするか知っています", "sentence": "I know what makes him happy.", "words": ["I", "know", "what", "makes", "him", "happy"], "correctAnswer": "I know what makes him happy", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "what makes"},
        {"id": "so-g3-u8-020", "japanese": "彼はどうやって成功したか語りました", "sentence": "He told us how he succeeded.", "words": ["He", "told", "us", "how", "he", "succeeded"], "correctAnswer": "He told us how he succeeded", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "間接疑問文", "hint": "how he succeeded"},
    ]
    
    return vf, fb, so

# ===== Unit 9: 比較級・最上級 (Comparatives & Superlatives) =====
def build_unit9_comparatives():
    """比較級・最上級の20問 - 全て異なる形容詞・副詞"""
    vf = [
        {"id": "vf-g3-u9-001", "japanese": "彼は私より背が高いです", "sentence": "He is ____ than me.", "verb": "comparative", "choices": ["taller", "tallest", "tall", "more tall"], "correctAnswer": "taller", "difficulty": "intermediate", "explanation": "比較級: -er", "hint": "taller than"},
        {"id": "vf-g3-u9-002", "japanese": "この本はあの本より面白いです", "sentence": "This book is ____ than that one.", "verb": "comparative", "choices": ["more interesting", "most interesting", "interesting", "interestinger"], "correctAnswer": "more interesting", "difficulty": "intermediate", "explanation": "比較級: more + 形容詞", "hint": "more interesting"},
        {"id": "vf-g3-u9-003", "japanese": "彼女はクラスで最も賢いです", "sentence": "She is the ____ in the class.", "verb": "superlative", "choices": ["smartest", "smarter", "smart", "most smart"], "correctAnswer": "smartest", "difficulty": "intermediate", "explanation": "最上級: the -est", "hint": "the smartest"},
        {"id": "vf-g3-u9-004", "japanese": "これは世界で最も美しい場所です", "sentence": "This is the ____ place in the world.", "verb": "superlative", "choices": ["most beautiful", "more beautiful", "beautiful", "beautifulest"], "correctAnswer": "most beautiful", "difficulty": "intermediate", "explanation": "最上級: the most + 形容詞", "hint": "the most beautiful"},
        {"id": "vf-g3-u9-005", "japanese": "夏は冬より暑いです", "sentence": "Summer is ____ than winter.", "verb": "comparative", "choices": ["hotter", "hottest", "hot", "more hot"], "correctAnswer": "hotter", "difficulty": "intermediate", "explanation": "比較級: -er (子音字重複)", "hint": "hotter than"},
        {"id": "vf-g3-u9-006", "japanese": "彼は家族の中で最も若いです", "sentence": "He is the ____ in his family.", "verb": "superlative", "choices": ["youngest", "younger", "young", "most young"], "correctAnswer": "youngest", "difficulty": "intermediate", "explanation": "最上級: the -est", "hint": "the youngest"},
        {"id": "vf-g3-u9-007", "japanese": "この問題はあれより簡単です", "sentence": "This problem is ____ than that one.", "verb": "comparative", "choices": ["easier", "easiest", "easy", "more easy"], "correctAnswer": "easier", "difficulty": "intermediate", "explanation": "比較級: -ier (y→i)", "hint": "easier than"},
        {"id": "vf-g3-u9-008", "japanese": "彼女は学校で最も人気があります", "sentence": "She is the ____ in the school.", "verb": "superlative", "choices": ["most popular", "more popular", "popular", "popularest"], "correctAnswer": "most popular", "difficulty": "intermediate", "explanation": "最上級: the most + 形容詞", "hint": "the most popular"},
        {"id": "vf-g3-u9-009", "japanese": "今日は昨日より寒いです", "sentence": "Today is ____ than yesterday.", "verb": "comparative", "choices": ["colder", "coldest", "cold", "more cold"], "correctAnswer": "colder", "difficulty": "intermediate", "explanation": "比較級: -er", "hint": "colder than"},
        {"id": "vf-g3-u9-010", "japanese": "これは私が見た中で最も良い映画です", "sentence": "This is the ____ movie I've ever seen.", "verb": "superlative", "choices": ["best", "better", "good", "most good"], "correctAnswer": "best", "difficulty": "intermediate", "explanation": "最上級: 不規則変化 (good-best)", "hint": "the best"},
        {"id": "vf-g3-u9-011", "japanese": "彼の車は私のより速いです", "sentence": "His car is ____ than mine.", "verb": "comparative", "choices": ["faster", "fastest", "fast", "more fast"], "correctAnswer": "faster", "difficulty": "intermediate", "explanation": "比較級: -er", "hint": "faster than"},
        {"id": "vf-g3-u9-012", "japanese": "彼女は三人の中で最も親切です", "sentence": "She is the ____ of the three.", "verb": "superlative", "choices": ["kindest", "kinder", "kind", "most kind"], "correctAnswer": "kindest", "difficulty": "intermediate", "explanation": "最上級: the -est", "hint": "the kindest"},
        {"id": "vf-g3-u9-013", "japanese": "この部屋はあの部屋より広いです", "sentence": "This room is ____ than that one.", "verb": "comparative", "choices": ["larger", "largest", "large", "more large"], "correctAnswer": "larger", "difficulty": "intermediate", "explanation": "比較級: -er", "hint": "larger than"},
        {"id": "vf-g3-u9-014", "japanese": "富士山は日本で最も高い山です", "sentence": "Mt. Fuji is the ____ mountain in Japan.", "verb": "superlative", "choices": ["highest", "higher", "high", "most high"], "correctAnswer": "highest", "difficulty": "intermediate", "explanation": "最上級: the -est", "hint": "the highest"},
        {"id": "vf-g3-u9-015", "japanese": "彼女は私より上手に歌います", "sentence": "She sings ____ than I do.", "verb": "comparative", "choices": ["better", "best", "good", "more good"], "correctAnswer": "better", "difficulty": "intermediate", "explanation": "比較級: 不規則変化 (well-better)", "hint": "better than"},
        {"id": "vf-g3-u9-016", "japanese": "これは店で最も安い商品です", "sentence": "This is the ____ item in the store.", "verb": "superlative", "choices": ["cheapest", "cheaper", "cheap", "most cheap"], "correctAnswer": "cheapest", "difficulty": "intermediate", "explanation": "最上級: the -est", "hint": "the cheapest"},
        {"id": "vf-g3-u9-017", "japanese": "彼は兄より強いです", "sentence": "He is ____ than his brother.", "verb": "comparative", "choices": ["stronger", "strongest", "strong", "more strong"], "correctAnswer": "stronger", "difficulty": "intermediate", "explanation": "比較級: -er", "hint": "stronger than"},
        {"id": "vf-g3-u9-018", "japanese": "これは今年最も重要な試験です", "sentence": "This is the ____ exam this year.", "verb": "superlative", "choices": ["most important", "more important", "important", "importantest"], "correctAnswer": "most important", "difficulty": "intermediate", "explanation": "最上級: the most + 形容詞", "hint": "the most important"},
        {"id": "vf-g3-u9-019", "japanese": "彼の家は私の家より遠いです", "sentence": "His house is ____ than mine.", "verb": "comparative", "choices": ["farther", "farthest", "far", "more far"], "correctAnswer": "farther", "difficulty": "intermediate", "explanation": "比較級: 不規則変化 (far-farther)", "hint": "farther than"},
        {"id": "vf-g3-u9-020", "japanese": "彼女は私が知っている中で最も幸せな人です", "sentence": "She is the ____ person I know.", "verb": "superlative", "choices": ["happiest", "happier", "happy", "most happy"], "correctAnswer": "happiest", "difficulty": "intermediate", "explanation": "最上級: the -iest (y→i)", "hint": "the happiest"},
    ]
    
    fb = [{"id": f"fb-g3-u9-{i:03d}", "japanese": q["japanese"], "sentence": q["sentence"], "wordCount": len(q["sentence"].split()), "choices": q["choices"], "correctAnswer": q["correctAnswer"], "difficulty": "intermediate", "hint": q["hint"]} for i, q in enumerate(vf, 1)]
    
    so = [
        {"id": "so-g3-u9-001", "japanese": "彼は私より背が高いです", "sentence": "He is taller than me.", "words": ["He", "is", "taller", "than", "me"], "correctAnswer": "He is taller than me", "wordCount": 5, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-002", "japanese": "この本はあの本より面白いです", "sentence": "This book is more interesting than that one.", "words": ["This", "book", "is", "more", "interesting", "than", "that", "one"], "correctAnswer": "This book is more interesting than that one", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-003", "japanese": "彼女はクラスで最も賢いです", "sentence": "She is the smartest in the class.", "words": ["She", "is", "the", "smartest", "in", "the", "class"], "correctAnswer": "She is the smartest in the class", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-004", "japanese": "これは世界で最も美しい場所です", "sentence": "This is the most beautiful place in the world.", "words": ["This", "is", "the", "most", "beautiful", "place", "in", "the", "world"], "correctAnswer": "This is the most beautiful place in the world", "wordCount": 9, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-005", "japanese": "夏は冬より暑いです", "sentence": "Summer is hotter than winter.", "words": ["Summer", "is", "hotter", "than", "winter"], "correctAnswer": "Summer is hotter than winter", "wordCount": 5, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-006", "japanese": "彼は家族の中で最も若いです", "sentence": "He is the youngest in his family.", "words": ["He", "is", "the", "youngest", "in", "his", "family"], "correctAnswer": "He is the youngest in his family", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-007", "japanese": "この問題はあれより簡単です", "sentence": "This problem is easier than that one.", "words": ["This", "problem", "is", "easier", "than", "that", "one"], "correctAnswer": "This problem is easier than that one", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-008", "japanese": "彼女は学校で最も人気があります", "sentence": "She is the most popular in the school.", "words": ["She", "is", "the", "most", "popular", "in", "the", "school"], "correctAnswer": "She is the most popular in the school", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-009", "japanese": "今日は昨日より寒いです", "sentence": "Today is colder than yesterday.", "words": ["Today", "is", "colder", "than", "yesterday"], "correctAnswer": "Today is colder than yesterday", "wordCount": 5, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-010", "japanese": "これは私が見た中で最も良い映画です", "sentence": "This is the best movie I've ever seen.", "words": ["This", "is", "the", "best", "movie", "I've", "ever", "seen"], "correctAnswer": "This is the best movie I've ever seen", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-011", "japanese": "彼の車は私のより速いです", "sentence": "His car is faster than mine.", "words": ["His", "car", "is", "faster", "than", "mine"], "correctAnswer": "His car is faster than mine", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-012", "japanese": "彼女は三人の中で最も親切です", "sentence": "She is the kindest of the three.", "words": ["She", "is", "the", "kindest", "of", "the", "three"], "correctAnswer": "She is the kindest of the three", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-013", "japanese": "この部屋はあの部屋より広いです", "sentence": "This room is larger than that one.", "words": ["This", "room", "is", "larger", "than", "that", "one"], "correctAnswer": "This room is larger than that one", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-014", "japanese": "富士山は日本で最も高い山です", "sentence": "Mt Fuji is the highest mountain in Japan.", "words": ["Mt", "Fuji", "is", "the", "highest", "mountain", "in", "Japan"], "correctAnswer": "Mt Fuji is the highest mountain in Japan", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-015", "japanese": "彼女は私より上手に歌います", "sentence": "She sings better than I do.", "words": ["She", "sings", "better", "than", "I", "do"], "correctAnswer": "She sings better than I do", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-016", "japanese": "これは店で最も安い商品です", "sentence": "This is the cheapest item in the store.", "words": ["This", "is", "the", "cheapest", "item", "in", "the", "store"], "correctAnswer": "This is the cheapest item in the store", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-017", "japanese": "彼は兄より強いです", "sentence": "He is stronger than his brother.", "words": ["He", "is", "stronger", "than", "his", "brother"], "correctAnswer": "He is stronger than his brother", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-018", "japanese": "これは今年最も重要な試験です", "sentence": "This is the most important exam this year.", "words": ["This", "is", "the", "most", "important", "exam", "this", "year"], "correctAnswer": "This is the most important exam this year", "wordCount": 8, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
        {"id": "so-g3-u9-019", "japanese": "彼の家は私の家より遠いです", "sentence": "His house is farther than mine.", "words": ["His", "house", "is", "farther", "than", "mine"], "correctAnswer": "His house is farther than mine", "wordCount": 6, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "比較級"},
        {"id": "so-g3-u9-020", "japanese": "彼女は私が知っている中で最も幸せな人です", "sentence": "She is the happiest person I know.", "words": ["She", "is", "the", "happiest", "person", "I", "know"], "correctAnswer": "She is the happiest person I know", "wordCount": 7, "difficulty": "intermediate", "grammarPoint": "比較級・最上級", "hint": "最上級"},
    ]
    
    return vf, fb, so

def update_units_8to9():
    """Units 8-9を更新"""
    vf_path = DATA_DIR / "verb-form-questions-grade3.json"
    fb_path = DATA_DIR / "fill-in-blank-questions-grade3.json"
    so_path = DATA_DIR / "sentence-ordering-grade3.json"
    
    with open(vf_path, 'r', encoding='utf-8') as f:
        vf_data = json.load(f)
    with open(fb_path, 'r', encoding='utf-8') as f:
        fb_data = json.load(f)
    with open(so_path, 'r', encoding='utf-8') as f:
        so_data = json.load(f)
    
    # Unit 8: 間接疑問文
    vf8, fb8, so8 = build_unit8_indirect()
    vf_data['units'][8]['verbForm'] = vf8
    fb_data['units'][8]['fillInBlank'] = fb8
    so_data['units'][8]['sentenceOrdering'] = so8
    print("[OK] Unit 8 (間接疑問文) diversified - 20 unique questions")
    
    # Unit 9: 比較級・最上級
    vf9, fb9, so9 = build_unit9_comparatives()
    vf_data['units'][9]['verbForm'] = vf9
    fb_data['units'][9]['fillInBlank'] = fb9
    so_data['units'][9]['sentenceOrdering'] = so9
    print("[OK] Unit 9 (比較級・最上級) diversified - 20 unique questions")
    
    # 保存
    with open(vf_path, 'w', encoding='utf-8') as f:
        json.dump(vf_data, f, ensure_ascii=False, indent=2)
    with open(fb_path, 'w', encoding='utf-8') as f:
        json.dump(fb_data, f, ensure_ascii=False, indent=2)
    with open(so_path, 'w', encoding='utf-8') as f:
        json.dump(so_data, f, ensure_ascii=False, indent=2)
    
    print("\n[DONE] G3 Units 8-9 diversified and saved")

if __name__ == "__main__":
    update_units_8to9()
