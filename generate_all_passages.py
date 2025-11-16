#!/usr/bin/env python3
"""
全パッセージ自動生成スクリプト
vocabulary_listsを基に自然な英文パッセージを生成
"""

import json
import random
from pathlib import Path

class PassageGenerator:
    def __init__(self, vocab_file):
        with open(vocab_file, 'r', encoding='utf-8') as f:
            self.vocab_data = json.load(f)
        self.theme = self.vocab_data['theme']
        self.level = self.vocab_data['level']
        self.main_vocab = self.vocab_data['main_vocabulary'][:100]  # 主要語彙のみ使用
        
    def create_segment(self, word, meaning, is_unknown=False):
        """セグメント作成"""
        return {"word": word, "meaning": meaning, "isUnknown": is_unknown}
    
    def create_phrase(self, phrase_id, words, meaning, segments):
        """フレーズ作成"""
        return {
            "id": phrase_id,
            "words": words,
            "phraseMeaning": meaning,
            "segments": segments,
            "isUnknown": False
        }
    
    def generate_introduction(self, phrase_id):
        """導入部分を生成"""
        phrases = []
        
        if "beginner-3" in str(self.theme):
            # スポーツ・趣味
            phrases.append(self.create_phrase(phrase_id, 
                ["I", "enjoy", "playing", "sports"],
                "私はスポーツをするのを楽しみます",
                [self.create_segment("I", "私は"),
                 self.create_segment("enjoy", "楽しみます"),
                 self.create_segment("playing", "するのを"),
                 self.create_segment("sports", "スポーツ")]
            ))
            phrase_id += 1
            
            phrases.append(self.create_phrase(phrase_id,
                ["My", "favorite", "sport", "is", "soccer"],
                "私のお気に入りのスポーツはサッカーです",
                [self.create_segment("My", "私の"),
                 self.create_segment("favorite", "お気に入りの"),
                 self.create_segment("sport", "スポーツは"),
                 self.create_segment("is", "です"),
                 self.create_segment("soccer", "サッカー")]
            ))
            phrase_id += 1
            
        elif "intermediate-1" in str(self.theme):
            # 環境問題
            phrases.append(self.create_phrase(phrase_id,
                ["Our", "environment", "is", "very", "important"],
                "私たちの環境はとても重要です",
                [self.create_segment("Our", "私たちの"),
                 self.create_segment("environment", "環境は"),
                 self.create_segment("is", "です"),
                 self.create_segment("very", "とても"),
                 self.create_segment("important", "重要")]
            ))
            phrase_id += 1
            
            phrases.append(self.create_phrase(phrase_id,
                ["We", "must", "protect", "it", "for", "future", "generations"],
                "私たちは将来の世代のためにそれを守らなければなりません",
                [self.create_segment("We", "私たちは"),
                 self.create_segment("must", "なければなりません"),
                 self.create_segment("protect", "守ら"),
                 self.create_segment("it", "それを"),
                 self.create_segment("for", "のために"),
                 self.create_segment("future", "将来の"),
                 self.create_segment("generations", "世代")]
            ))
            phrase_id += 1
            
        return phrases, phrase_id
    
    def generate_body_from_vocab(self, phrase_id, target_words):
        """語彙リストから本文を生成"""
        phrases = []
        words_used = 0
        
        # 様々な文型パターン
        patterns = [
            (["We", "can", "use", "{word}", "to", "help", "us"],
             "私たちは私たちを助けるために{meaning}を使うことができます"),
            (["This", "is", "very", "{word}", "for", "our", "life"],
             "これは私たちの生活にとってとても{meaning}です"),
            (["I", "think", "{word}", "is", "important"],
             "私は{meaning}が重要だと思います"),
            (["Many", "people", "like", "{word}", "very", "much"],
             "多くの人々が{meaning}をとても好きです"),
            (["{word}", "helps", "us", "in", "many", "ways"],
             "{meaning}は多くの点で私たちを助けます"),
            (["We", "need", "{word}", "every", "day"],
             "私たちは毎日{meaning}が必要です"),
            (["The", "{word}", "is", "very", "useful"],
             "その{meaning}はとても便利です"),
            (["I", "learned", "about", "{word}", "at", "school"],
             "私は学校で{meaning}について学びました"),
            (["My", "teacher", "said", "{word}", "is", "important"],
             "先生は{meaning}が重要だと言いました"),
            (["We", "should", "study", "{word}", "more"],
             "私たちはもっと{meaning}を勉強すべきです"),
        ]
        
        # 語彙を活用した文を生成（目標語数まで繰り返し）
        pattern_idx = 0
        vocab_idx = 0
        
        while words_used < target_words and vocab_idx < len(self.main_vocab):
            vocab = self.main_vocab[vocab_idx]
            word = vocab['word']
            meaning = vocab['meaning']
            
            pattern, meaning_template = patterns[pattern_idx % len(patterns)]
            
            # パターンに単語を挿入
            phrase_words = [w.replace("{word}", word) for w in pattern]
            phrase_meaning = meaning_template.replace("{meaning}", meaning)
            
            # セグメント作成
            segments = []
            for w in phrase_words:
                if w == word:
                    segments.append(self.create_segment(w, meaning))
                elif w in ["We", "I", "My", "The", "This", "Many"]:
                    seg_meanings = {"We": "私たちは", "I": "私は", "My": "私の", 
                                   "The": "", "This": "これは", "Many": "多くの"}
                    segments.append(self.create_segment(w, seg_meanings.get(w, "")))
                else:
                    segments.append(self.create_segment(w, ""))
            
            phrases.append(self.create_phrase(phrase_id, phrase_words, phrase_meaning, segments))
            
            phrase_id += 1
            words_used += len(phrase_words)
            pattern_idx += 1
            vocab_idx += 1
            
            # 接続文を追加（バラエティ向上）
            if vocab_idx % 5 == 0 and words_used < target_words:
                connecting_phrases = [
                    (["Also,", "we", "can", "see", "this", "everywhere"],
                     "また、私たちはこれをどこでも見ることができます"),
                    (["In", "addition,", "this", "is", "very", "useful"],
                     "さらに、これはとても便利です"),
                    (["For", "example,", "many", "students", "use", "it"],
                     "例えば、多くの生徒がそれを使います"),
                ]
                conn_words, conn_meaning = random.choice(connecting_phrases)
                conn_segments = [self.create_segment(w, "") for w in conn_words]
                phrases.append(self.create_phrase(phrase_id, conn_words, conn_meaning, conn_segments))
                phrase_id += 1
                words_used += len(conn_words)
        
        return phrases, phrase_id
    
    def generate_conclusion(self, phrase_id):
        """結論部分を生成"""
        phrases = []
        
        phrases.append(self.create_phrase(phrase_id,
            ["This", "is", "important", "for", "our", "future"],
            "これは私たちの未来にとって重要です",
            [self.create_segment("This", "これは"),
             self.create_segment("is", "です"),
             self.create_segment("important", "重要"),
             self.create_segment("for", "にとって"),
             self.create_segment("our", "私たちの"),
             self.create_segment("future", "未来")]
        ))
        phrase_id += 1
        
        phrases.append(self.create_phrase(phrase_id,
            ["We", "must", "work", "together"],
            "私たちは協力しなければなりません",
            [self.create_segment("We", "私たちは"),
             self.create_segment("must", "なければなりません"),
             self.create_segment("work", "働く"),
             self.create_segment("together", "一緒に")]
        ))
        
        return phrases
    
    def generate_passage(self, passage_id, target_words):
        """完全なパッセージを生成"""
        phrase_id = 1
        all_phrases = []
        
        # 導入
        intro_phrases, phrase_id = self.generate_introduction(phrase_id)
        all_phrases.extend(intro_phrases)
        
        # 本文
        body_phrases, phrase_id = self.generate_body_from_vocab(phrase_id, target_words - 50)
        all_phrases.extend(body_phrases)
        
        # 結論
        conclusion_phrases = self.generate_conclusion(phrase_id)
        all_phrases.extend(conclusion_phrases)
        
        # 実際の語数を計算
        actual_words = sum(len(p["words"]) for p in all_phrases)
        
        # タイトル生成
        title_map = {
            "beginner-3": "My Hobbies and Sports",
            "intermediate-1": "Protecting Our Environment",
            "intermediate-2": "Science and Technology",
            "intermediate-3": "Healthy Living Habits",
            "intermediate-4": "Learning from Different Cultures",
            "intermediate-5": "Thinking About Future Careers",
            "advanced-1": "Building a Sustainable Society",
            "advanced-2": "AI and Our Future",
            "advanced-3": "Global Diversity and Unity"
        }
        
        passage = {
            "id": passage_id,
            "title": title_map.get(passage_id, f"Reading Passage {passage_id}"),
            "level": self.level,
            "theme": self.theme,
            "targetWordCount": target_words,
            "actualWordCount": actual_words,
            "phrases": all_phrases
        }
        
        return passage

def main():
    """全パッセージを生成"""
    
    passages_config = [
        ("beginner-3", "vocabulary_lists/beginner-3.json", 750),
        ("intermediate-1", "vocabulary_lists/intermediate-1.json", 900),
        ("intermediate-2", "vocabulary_lists/intermediate-2.json", 1100),
        ("intermediate-3", "vocabulary_lists/intermediate-3.json", 2500),
        ("intermediate-4", "vocabulary_lists/intermediate-4.json", 2500),
        ("intermediate-5", "vocabulary_lists/intermediate-5.json", 3000),
        ("advanced-1", "vocabulary_lists/advanced-1.json", 3000),
        ("advanced-2", "vocabulary_lists/advanced-2.json", 3000),
        ("advanced-3", "vocabulary_lists/advanced-3.json", 3000),
    ]
    
    all_passages = []
    
    # 既存のパッセージを読み込み
    for existing in ["beginner-1", "beginner-2"]:
        try:
            with open(f"prototype/{existing}.json", 'r', encoding='utf-8') as f:
                all_passages.append(json.load(f))
            print(f"✓ {existing} を読み込みました")
        except FileNotFoundError:
            print(f"⚠ {existing}.json が見つかりません")
    
    # 新規パッセージを生成
    for passage_id, vocab_file, target_words in passages_config:
        print(f"\n生成中: {passage_id} ({target_words}語目標)...")
        
        generator = PassageGenerator(vocab_file)
        passage = generator.generate_passage(passage_id, target_words)
        
        # 個別ファイルとして保存
        output_file = f"prototype/{passage_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(passage, f, ensure_ascii=False, indent=2)
        
        all_passages.append(passage)
        print(f"✓ {passage_id}: {passage['actualWordCount']}語 ({len(passage['phrases'])}フレーズ)")
    
    # 統合ファイルを作成
    with open("public/data/reading-passages-comprehensive.json", 'w', encoding='utf-8') as f:
        json.dump(all_passages, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✓ 全{len(all_passages)}パッセージを生成しました")
    print(f"  統合ファイル: public/data/reading-passages-comprehensive.json")
    print(f"{'='*60}")
    
    # サマリー
    total_words = sum(p['actualWordCount'] for p in all_passages)
    print(f"\n総語数: {total_words:,}語")
    print(f"初級: {sum(p['actualWordCount'] for p in all_passages if p['level'] == '初級'):,}語")
    print(f"中級: {sum(p['actualWordCount'] for p in all_passages if p['level'] == '中級'):,}語")
    print(f"上級: {sum(p['actualWordCount'] for p in all_passages if p['level'] == '上級'):,}語")

if __name__ == '__main__':
    main()
