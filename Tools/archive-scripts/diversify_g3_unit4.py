#!/usr/bin/env python3
"""
G3 Unit 4 (不定詞) の20x重複を解消
- 不定詞の3用法(名詞的・形容詞的・副詞的)を20種類の例文で
"""
import json
import os

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "nanashi8.github.io", "public", "data")
VF_FILE = os.path.join(BASE_DIR, "verb-form-questions-grade3.json")
FB_FILE = os.path.join(BASE_DIR, "fill-in-blank-questions-grade3.json")
SO_FILE = os.path.join(BASE_DIR, "sentence-ordering-grade3.json")


def build_unit4_infinitives():
    """Unit 4: 不定詞の20種類の例文 (Unit 5の動名詞と完全に異なる例文)"""
    patterns = [
        # 名詞的用法 (主語)
        ("ピアノを弾くことは難しいです", "To play the piano is difficult.", "play"),
        ("嘘をつくことは悪いことです", "To tell a lie is bad.", "tell"),
        ("外国語を学ぶことは楽しいです", "To learn a foreign language is fun.", "learn"),
        ("毎日練習することが大切です", "To practice every day is important.", "practice"),
        
        # 名詞的用法 (目的語)
        ("私は医者になりたいです", "I want to be a doctor.", "be"),
        ("彼女は歌手になることを決めました", "She decided to become a singer.", "become"),
        ("私たちは明日出発する予定です", "We plan to leave tomorrow.", "leave"),
        ("彼は新しい車を買うことを望んでいます", "He hopes to buy a new car.", "buy"),
        
        # 形容詞的用法
        ("何か飲むものが欲しいです", "I want something to drink.", "drink"),
        ("これは解くべき問題です", "This is a problem to solve.", "solve"),
        ("私には遊ぶ時間がありません", "I have no time to play.", "play"),
        ("書くための紙が必要です", "I need paper to write on.", "write"),
        
        # 副詞的用法 (目的)
        ("私は友達に会うために駅に行きました", "I went to the station to meet my friend.", "meet"),
        ("彼女はお金を稼ぐためにアルバイトをします", "She works part-time to earn money.", "earn"),
        ("私は写真を撮るためにカメラを買いました", "I bought a camera to take pictures.", "take"),
        ("彼は健康でいるために毎日走ります", "He runs every day to stay healthy.", "stay"),
        
        # 副詞的用法 (感情の原因)
        ("私はあなたに会えて嬉しいです", "I am glad to see you.", "see"),
        ("彼女は試験に合格して興奮しました", "She was excited to pass the exam.", "pass"),
        ("私たちはあなたの成功を知って誇りに思います", "We are proud to know your success.", "know"),
        ("彼は招待されて光栄に思いました", "He was honored to be invited.", "be"),
    ]
    
    return [
        {
            "id": f"vf-g3-u4-{i+1:03d}",
            "japanese": ja,
            "sentence": en.replace(verb, "____"),
            "verb": "infinitive",
            "choices": [f"to {verb}", f"{verb}ing", f"{verb}ed", f"{verb}s"],
            "correctAnswer": f"to {verb}",
            "difficulty": "intermediate",
            "explanation": "不定詞は to + 動詞原形で、名詞的・形容詞的・副詞的用法があります。",
            "grammarPoint": "不定詞"
        }
        for i, (ja, en, verb) in enumerate(patterns)
    ]


def update_unit(file_path, unit_num, builder, question_key="verbForm"):
    """指定されたunitを更新"""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # 該当するunitを探す
    for unit in data["units"]:
        if unit["unit"] == f"Unit {unit_num}":
            # 新しい問題で置き換え
            unit[question_key] = builder()
            break
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    # Verb Form
    update_unit(VF_FILE, 4, build_unit4_infinitives, "verbForm")
    print("[OK] Unit 4 (不定詞) verb-form diversified - 20 unique questions")
    
    # Fill-in-Blank
    def fb_builder():
        vf_qs = build_unit4_infinitives()
        return [
            {
                **q,
                "id": q["id"].replace("vf-", "fb-"),
                "wordCount": len(q["sentence"].split()),
            }
            for q in vf_qs
        ]
    
    update_unit(FB_FILE, 4, fb_builder, "fillInBlank")
    print("[OK] Unit 4 (不定詞) fill-in-blank diversified - 20 unique questions")
    
    # Sentence Ordering
    def so_builder():
        vf_qs = build_unit4_infinitives()
        return [
            {
                "id": q["id"].replace("vf-", "so-"),
                "japanese": q["japanese"],
                "sentence": q["sentence"].replace("____", q["correctAnswer"]),
                "words": q["sentence"].replace("____", q["correctAnswer"]).split(),
                "correctAnswer": q["sentence"].replace("____", q["correctAnswer"]),
                "wordCount": len(q["sentence"].replace("____", q["correctAnswer"]).split()),
                "difficulty": "intermediate",
                "grammarPoint": q["grammarPoint"],
                "hint": q["explanation"],
            }
            for q in vf_qs
        ]
    
    update_unit(SO_FILE, 4, so_builder, "sentenceOrdering")
    print("[OK] Unit 4 (不定詞) sentence-ordering diversified - 20 unique questions")
    
    print("\n[DONE] G3 Unit 4 diversified and saved")


if __name__ == "__main__":
    main()
