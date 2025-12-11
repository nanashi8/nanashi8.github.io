#!/usr/bin/env python3
"""
G3 Unit 3 (関係代名詞) と Unit 5 (動名詞) の5x重複を解消
- Unit 3: 関係代名詞 (who, which, that) の20種類の例文
- Unit 5: 動名詞の20種類の例文
"""
import json
import os

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "nanashi8.github.io", "public", "data")
VF_FILE = os.path.join(BASE_DIR, "verb-form-questions-grade3.json")
FB_FILE = os.path.join(BASE_DIR, "fill-in-blank-questions-grade3.json")
SO_FILE = os.path.join(BASE_DIR, "sentence-ordering-grade3.json")


def build_unit3_relative_pronouns():
    """Unit 3: 関係代名詞 (who, which, that) の20種類の例文"""
    patterns = [
        ("私には東京に住んでいる友人がいます", "I have a friend ____ lives in Tokyo.", "who"),
        ("私には京都に住んでいる友人がいます", "I have a friend ____ lives in Kyoto.", "who"),
        ("彼女には大阪で働いている兄がいます", "She has a brother ____ works in Osaka.", "who"),
        ("これは私が昨日買った本です", "This is the book ____ I bought yesterday.", "that"),
        ("これは私が先週買った本です", "This is the book ____ I bought last week.", "that"),
        ("あれは彼が先月書いた手紙です", "That is the letter ____ he wrote last month.", "that"),
        ("彼女は英語を話す女性です", "She is a woman ____ speaks English.", "who"),
        ("彼は日本語を話す男性です", "He is a man ____ speaks Japanese.", "who"),
        ("私はフランス語を話す先生を知っています", "I know a teacher ____ speaks French.", "who"),
        ("これは有名な建物です", "This is a famous building ____ everyone knows.", "that"),
        ("これは古い建物です", "This is an old building ____ was built 100 years ago.", "that"),
        ("あれは新しい建物です", "That is a new building ____ was just completed.", "that"),
        ("私が読んだ本はとても面白かったです", "The book ____ I read was very interesting.", "that"),
        ("彼女が見た映画は感動的でした", "The movie ____ she watched was touching.", "that"),
        ("私たちが訪れた場所は美しかったです", "The place ____ we visited was beautiful.", "that"),
        ("英語を教えている先生は親切です", "The teacher ____ teaches English is kind.", "who"),
        ("ピアノを弾いている少女は私の妹です", "The girl ____ is playing the piano is my sister.", "who"),
        ("公園で走っている犬は私のペットです", "The dog ____ is running in the park is my pet.", "that"),
        ("机の上にある本は私のものです", "The book ____ is on the desk is mine.", "that"),
        ("窓の近くに立っている男性は私の父です", "The man ____ is standing near the window is my father.", "who"),
    ]
    return [
        {
            "id": f"vf-g3-u3-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": "relative",
            "choices": ["who", "which", "that", "where"],
            "correctAnswer": ans,
            "difficulty": "intermediate",
            "explanation": "関係代名詞を使って2つの文をつなぎます。",
            "grammarPoint": "関係代名詞"
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]


def build_unit5_gerunds():
    """Unit 5: 動名詞の20種類の例文 (Unit 4の不定詞と完全に異なる例文)"""
    patterns = [
        ("泳ぐことは良い運動です", "____ is good exercise.", "Swimming"),
        ("ランニングは健康に良いです", "____ is good for health.", "Running"),
        ("ダンスは楽しい活動です", "____ is an enjoyable activity.", "Dancing"),
        ("釣りは私の趣味です", "____ is my hobby.", "Fishing"),
        
        ("私は歌うことが好きです", "I like ____.", "singing"),
        ("彼女は絵を描くことが好きです", "She likes ____.", "painting"),
        ("私たちは旅行することが好きです", "We like ____.", "traveling"),
        ("彼は料理することを楽しんでいます", "He enjoys ____.", "cooking"),
        
        ("彼はサッカーをすることが得意です", "He is good at ____ soccer.", "playing"),
        ("彼女はピアノを弾くことが得意です", "She is good at ____ the piano.", "playing"),
        ("私は早起きが得意です", "I am good at ____ up early.", "getting"),
        ("彼らは問題を解くことが得意です", "They are good at ____ problems.", "solving"),
        
        ("読書は知識を増やすのに役立ちます", "____ helps increase knowledge.", "Reading"),
        ("書くことは考えをまとめるのに役立ちます", "____ helps organize thoughts.", "Writing"),
        ("話すことはコミュニケーションに不可欠です", "____ is essential for communication.", "Speaking"),
        ("聞くことは理解の第一歩です", "____ is the first step to understanding.", "Listening"),
        
        ("ショッピングは彼女の趣味です", "____ is her hobby.", "Shopping"),
        ("掃除は毎日の仕事です", "____ is a daily task.", "Cleaning"),
        ("勉強することは成功への鍵です", "____ is the key to success.", "Studying"),
        ("働くことは生活の一部です", "____ is part of life.", "Working"),
    ]
    
    # 正しいchoicesを生成
    result = []
    for i, (ja, en, gerund) in enumerate(patterns):
        # gerundから動詞を推測 (ing除去)
        if gerund.endswith("ying"):
            verb = gerund[:-4] + "y"
        elif gerund.endswith("ing"):
            verb = gerund[:-3]
            # eで終わる動詞の場合
            if verb + "e" in ["write", "dance", "organize"]:
                verb = verb + "e"
        else:
            verb = gerund.lower()
        
        result.append({
            "id": f"vf-g3-u5-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            "verb": verb,
            "choices": [gerund, f"{verb}ed", f"{verb}s", f"to {verb}"],
            "correctAnswer": gerund,
            "difficulty": "intermediate",
            "explanation": "動名詞は動詞のing形で、主語や目的語として使います。",
            "grammarPoint": "動名詞"
        })
    
    return result


def update_units(file_path, unit_builders, question_key="verbForm"):
    """指定されたunitのみを更新"""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    for unit_num, builder in unit_builders.items():
        # 該当するunitを探す
        for unit in data["units"]:
            if unit["unit"] == f"Unit {unit_num}":
                # 新しい問題で置き換え
                unit[question_key] = builder()
                break
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    # Unit 3 (関係代名詞) と Unit 5 (動名詞) のみ更新
    unit_builders = {
        3: build_unit3_relative_pronouns,
        5: build_unit5_gerunds,
    }
    
    # Verb Form
    update_units(VF_FILE, unit_builders, "verbForm")
    print("[OK] Unit 3 (関係代名詞) diversified - 20 unique questions")
    print("[OK] Unit 5 (動名詞) diversified - 20 unique questions")
    
    # Fill-in-Blank
    fb_builders = {}
    for unit_num, vf_builder in unit_builders.items():
        def make_fb_builder(vf_b):
            def fb_builder():
                vf_qs = vf_b()
                return [
                    {
                        "id": q["id"].replace("vf-", "fb-"),
                        "japanese": q["japanese"],
                        "sentence": q["sentence"],
                        "wordCount": len(q["sentence"].split()),
                        "choices": q["choices"],
                        "correctAnswer": q["correctAnswer"],
                        "difficulty": "intermediate",
                        "grammarPoint": q["grammarPoint"],
                        "hint": q["explanation"],
                    }
                    for q in vf_qs
                ]
            return fb_builder
        fb_builders[unit_num] = make_fb_builder(vf_builder)
    
    update_units(FB_FILE, fb_builders, "fillInBlank")
    print("[OK] Fill-in-blank for Units 3,5 updated")
    
    # Sentence Ordering
    so_builders = {}
    for unit_num, vf_builder in unit_builders.items():
        def make_so_builder(vf_b):
            def so_builder():
                vf_qs = vf_b()
                return [
                    {
                        "id": q["id"].replace("vf-", "so-"),
                        "japanese": q["japanese"],
                        "sentence": q["sentence"].replace("____", str(q["correctAnswer"])),
                        "words": q["sentence"].replace("____", str(q["correctAnswer"])).split(),
                        "correctAnswer": q["sentence"].replace("____", str(q["correctAnswer"])),
                        "wordCount": len(q["sentence"].replace("____", str(q["correctAnswer"])).split()),
                        "difficulty": "intermediate",
                        "grammarPoint": q["grammarPoint"],
                        "hint": q["explanation"],
                    }
                    for q in vf_qs
                ]
            return so_builder
        so_builders[unit_num] = make_so_builder(vf_builder)
    
    update_units(SO_FILE, so_builders, "sentenceOrdering")
    print("[OK] Sentence-ordering for Units 3,5 updated")
    
    print("\n[DONE] G3 Units 3,5 diversified and saved")


if __name__ == "__main__":
    main()
