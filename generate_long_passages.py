#!/usr/bin/env python3
"""
長文パッセージ自動生成スクリプト (2,500-3,000語対応版)
CSVデータを活用し、自然な英文パッセージを生成
"""

import json
import csv
import random
from pathlib import Path
from collections import defaultdict

class VocabularyManager:
    """CSV語彙データの管理"""
    
    def __init__(self, csv_path="public/data/junior-high-entrance-words.csv"):
        self.csv_path = csv_path
        self.vocab_by_level = defaultdict(list)
        self.vocab_by_category = defaultdict(list)
        self.all_vocab = []
        self.load_csv()
    
    def load_csv(self):
        """CSVから語彙データを読み込み"""
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 意味フィールドから「・」の前の部分のみを取得（自然な日本語訳）
                meaning = row['意味'].split('・')[0].strip()
                
                vocab_item = {
                    'word': row['語句'],
                    'reading': row['読み'],
                    'meaning': meaning,  # 修正: 最初の意味のみ使用
                    'category': row['関連分野'],
                    'difficulty': row['難易度'],
                    'related': row['関連語'],
                    'etymology': row['語源等解説']
                }
                self.all_vocab.append(vocab_item)
                self.vocab_by_level[row['難易度']].append(vocab_item)
                self.vocab_by_category[row['関連分野']].append(vocab_item)
    
    def get_vocab_for_level(self, level):
        """レベルに応じた語彙を取得"""
        if level == "初級":
            return self.vocab_by_level["初級"]
        elif level == "中級":
            return self.vocab_by_level["初級"] + self.vocab_by_level["中級"]
        else:  # 上級
            return self.all_vocab
    
    def get_vocab_by_categories(self, level, categories, limit=None):
        """特定カテゴリの語彙を取得"""
        allowed_vocab = self.get_vocab_for_level(level)
        category_vocab = [v for v in allowed_vocab if v['category'] in categories]
        
        # シャッフルしてランダム性を持たせる
        random.shuffle(category_vocab)
        
        if limit:
            return category_vocab[:min(limit, len(category_vocab))]
        return category_vocab


class LongPassageGenerator:
    """長文パッセージ生成クラス"""
    
    def __init__(self, vocab_manager, theme, level, target_words):
        self.vocab_manager = vocab_manager
        self.theme = theme
        self.level = level
        self.target_words = target_words
        self.phrase_counter = 0
        self.words_used = 0
        self.vocab_used = set()
    
    def create_segment(self, word, meaning, is_unknown=False):
        """単語セグメントを作成"""
        return {
            "word": word,
            "meaning": meaning,
            "isUnknown": is_unknown
        }
    
    def create_phrase(self, words, meaning, segments):
        """フレーズを作成"""
        self.phrase_counter += 1
        self.words_used += len(words)
        return {
            "id": f"phrase-{self.phrase_counter}",
            "words": words,
            "phraseMeaning": meaning,
            "segments": segments,
            "isUnknown": False
        }
    
    def create_simple_phrase(self, words, meaning):
        """シンプルなフレーズを作成（意味をそのまま使用）"""
        segments = [self.create_segment(w, "") for w in words]
        return self.create_phrase(words, meaning, segments)
    
    def generate_introduction_section(self, intro_sentences, topic_vocab=None, target_words=350):
        """導入セクション（自然な構成優先）"""
        phrases = []
        
        # 手動定義の導入文を1回だけ追加（繰り返しなし）
        for words, meaning in intro_sentences:
            phrases.append(self.create_simple_phrase(words, meaning))
        
        return phrases
    
    def generate_topic_section(self, topic_vocab, templates, target_section_words):
        """トピックセクション生成（テンプレートベース）"""
        phrases = []
        section_words = 0
        vocab_idx = 0
        template_idx = 0
        pass_count = 0
        max_passes = 6  # 語彙を最大6回まで繰り返し使用（増強）
        
        # 接続表現のバリエーション（拡充）
        connectors = [
            (["In", "addition", "to", "this"], "これに加えて"),
            (["Also", "we", "should", "know", "that"], "また私たちは知るべきです"),
            (["Furthermore", "it", "is", "important", "to", "understand"], "さらに理解することが重要です"),
            (["Moreover", "we", "can", "see", "that"], "その上私たちは分かります"),
            (["This", "means", "that"], "これは意味します"),
            (["For", "example"], "例えば"),
            (["In", "other", "words"], "言い換えると"),
            (["That", "is", "why"], "だから"),
            (["As", "a", "result"], "その結果"),
            (["On", "the", "other", "hand"], "一方で"),
            (["At", "the", "same", "time"], "同時に"),
            (["In", "this", "context"], "この文脈において"),
            (["From", "this", "perspective"], "この観点から"),
            (["It", "is", "worth", "noting", "that"], "注目に値します"),
        ]
        
        # 説明文のバリエーション（拡充）
        explanations = [
            (["This", "is", "very", "important", "for", "us"], "これは私たちにとってとても重要です"),
            (["We", "can", "learn", "a", "lot", "from", "this"], "私たちはこれから多くを学べます"),
            (["Many", "people", "think", "this", "is", "useful"], "多くの人々がこれは有用だと考えます"),
            (["Students", "should", "understand", "this", "well"], "生徒たちはこれをよく理解すべきです"),
            (["This", "helps", "us", "in", "many", "ways"], "これは多くの点で私たちを助けます"),
            (["We", "need", "to", "remember", "this"], "私たちはこれを覚えておく必要があります"),
            (["This", "makes", "our", "life", "better"], "これは私たちの生活をより良くします"),
            (["Everyone", "can", "benefit", "from", "this"], "誰もがこれから恩恵を受けることができます"),
            (["It", "is", "worth", "considering", "this", "carefully"], "これを慎重に考える価値があります"),
            (["This", "point", "deserves", "our", "attention"], "この点は私たちの注意に値します"),
            (["We", "should", "not", "overlook", "this", "fact"], "この事実を見過ごすべきではありません"),
            (["This", "contributes", "significantly", "to", "our", "understanding"], "これは私たちの理解に大きく貢献します"),
        ]
        
        while section_words < target_section_words and pass_count < max_passes:
            if vocab_idx >= len(topic_vocab):
                # 語彙リストの最後に達したら最初から再開
                vocab_idx = 0
                pass_count += 1
                if pass_count >= max_passes:
                    break
            
            vocab = topic_vocab[vocab_idx]
            word = vocab['word']
            meaning = vocab['meaning']
            
            # テンプレートを順番に使用（全体をカバー）
            template = templates[template_idx % len(templates)]
            words, meaning_template = template
            
            # 単語を挿入
            phrase_words = [w.replace("{word}", word) for w in words]
            phrase_meaning = meaning_template.replace("{meaning}", meaning)
            
            phrases.append(self.create_simple_phrase(phrase_words, phrase_meaning))
            section_words += len(phrase_words)
            template_idx += 1
            vocab_idx += 1
            
            # 接続表現を追加（2フレーズごとに変更）
            if len(phrases) % 2 == 0 and section_words < target_section_words:
                connector = random.choice(connectors)
                phrases.append(self.create_simple_phrase(connector[0], connector[1]))
                section_words += len(connector[0])
            
            # 説明文を追加（4フレーズごとに変更）
            if len(phrases) % 4 == 0 and section_words < target_section_words:
                explanation = random.choice(explanations)
                phrases.append(self.create_simple_phrase(explanation[0], explanation[1]))
                section_words += len(explanation[0])
        
        return phrases
    
    def generate_example_section(self, examples):
        """具体例セクション"""
        phrases = []
        for words, meaning in examples:
            phrases.append(self.create_simple_phrase(words, meaning))
        return phrases
    
    def generate_conclusion_section(self, conclusion_sentences, topic_vocab=None, target_words=350):
        """結論セクション（自然な構成優先）"""
        phrases = []
        
        # 手動定義の結論文を1回だけ追加（繰り返しなし）
        for words, meaning in conclusion_sentences:
            phrases.append(self.create_simple_phrase(words, meaning))
        
        return phrases
    
    def generate_full_passage(self, passage_id, title, sections):
        """完全なパッセージを生成"""
        all_phrases = []
        
        for section in sections:
            all_phrases.extend(section)
        
        return {
            "id": passage_id,
            "title": title,
            "level": self.level,
            "theme": self.theme,
            "targetWordCount": self.target_words,
            "actualWordCount": self.words_used,
            "phrases": all_phrases
        }


class HealthyLivingGenerator:
    """intermediate-3: 健康的な生活習慣（2,500語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "健康的な生活習慣", "中級", 2500
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (150語)
        intro = [
            (["Living", "a", "healthy", "life", "is", "very", "important"], 
             "健康的な生活を送ることはとても重要です"),
            (["We", "need", "to", "think", "about", "our", "health", "every", "day"], 
             "私たちは毎日自分の健康について考える必要があります"),
            (["There", "are", "many", "ways", "to", "stay", "healthy"], 
             "健康を保つための多くの方法があります"),
            (["Good", "food", "exercise", "and", "sleep", "are", "all", "important"], 
             "良い食事、運動、睡眠はすべて重要です"),
            (["Let", "me", "tell", "you", "about", "healthy", "habits"], 
             "健康的な習慣についてお話しします"),
        ]
        food_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["食・健康"], limit=100)
        sections.append(self.generator.generate_introduction_section(intro, food_vocab, 350))
        
        # Section 2: Breakfast and Nutrition (500語)
        food_templates = [
            (["We", "should", "eat", "{word}", "every", "day"], 
             "私たちは毎日{meaning}を食べるべきです"),
            (["{word}", "is", "good", "for", "our", "health"], 
             "{meaning}は私たちの健康に良いです"),
            (["Many", "people", "like", "{word}", "very", "much"], 
             "多くの人々が{meaning}をとても好きです"),
            (["I", "always", "eat", "{word}", "for", "breakfast"], 
             "私はいつも朝食に{meaning}を食べます"),
            (["Eating", "{word}", "helps", "us", "stay", "healthy"], 
             "{meaning}を食べることは私たちが健康でいるのを助けます"),
            (["{word}", "contains", "many", "important", "nutrients"], 
             "{meaning}は多くの重要な栄養素を含んでいます"),
            (["Doctors", "say", "{word}", "is", "very", "important"], 
             "医者たちは{meaning}がとても重要だと言います"),
            (["My", "family", "enjoys", "{word}", "together"], 
             "私の家族は一緒に{meaning}を楽しみます"),
        ]
        sections.append(self.generator.generate_topic_section(food_vocab, food_templates, 900))
        
        # Section 3: Exercise and Sports (900語)
        exercise_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["運動・娯楽"], limit=120)
        exercise_templates = [
            (["I", "enjoy", "{word}", "after", "school"], 
             "私は放課後{meaning}を楽しみます"),
            (["{word}", "helps", "us", "stay", "strong"], 
             "{meaning}は私たちが強くいるのを助けます"),
            (["Many", "students", "do", "{word}", "every", "day"], 
             "多くの生徒が毎日{meaning}をします"),
            (["We", "can", "{word}", "with", "friends"], 
             "私たちは友達と{meaning}ができます"),
            (["Playing", "{word}", "makes", "us", "feel", "happy"], 
             "{meaning}をすることは私たちを幸せにします"),
            (["{word}", "is", "popular", "among", "young", "people"], 
             "{meaning}は若者の間で人気です"),
            (["I", "practice", "{word}", "three", "times", "a", "week"], 
             "私は週に3回{meaning}を練習します"),
            (["My", "coach", "teaches", "us", "{word}"], 
             "私のコーチは私たちに{meaning}を教えます"),
        ]
        sections.append(self.generator.generate_topic_section(exercise_vocab, exercise_templates, 900))
        
        # Section 4: Sleep and Rest (700語)
        time_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["時間・数量"], limit=80)
        sleep_templates = [
            (["We", "need", "{word}", "hours", "of", "sleep"], 
             "私たちは{meaning}時間の睡眠が必要です"),
            (["{word}", "is", "important", "for", "rest"], 
             "{meaning}は休息にとって重要です"),
            (["Good", "sleep", "helps", "{word}", "our", "body"], 
             "良い睡眠は私たちの体を{meaning}助けます"),
            (["I", "go", "to", "bed", "at", "{word}", "o'clock"], 
             "私は{meaning}時に寝ます"),
            (["Sleep", "for", "{word}", "is", "necessary"], 
             "{meaning}のための睡眠は必要です"),
            (["Every", "night", "I", "sleep", "about", "{word}"], 
             "毎晩私は約{meaning}眠ります"),
        ]
        sections.append(self.generator.generate_topic_section(time_vocab, sleep_templates, 700))
        
        # Section 5: Daily Routine (800語)
        daily_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["日常生活"], limit=100)
        daily_templates = [
            (["Every", "day", "I", "{word}", "in", "the", "morning"], 
             "毎日朝に私は{meaning}をします"),
            (["{word}", "is", "part", "of", "my", "routine"], 
             "{meaning}は私の日課の一部です"),
            (["We", "should", "{word}", "regularly"], 
             "私たちは定期的に{meaning}をすべきです"),
            (["I", "always", "remember", "to", "{word}"], 
             "私はいつも{meaning}することを覚えています"),
            (["My", "mother", "helps", "me", "{word}"], 
             "母は私が{meaning}するのを助けます"),
            (["{word}", "makes", "me", "feel", "good"], 
             "{meaning}は私を良い気分にします"),
        ]
        sections.append(self.generator.generate_topic_section(daily_vocab, daily_templates, 800))
        
        # Section 6: Conclusion (450語)
        conclusion = [
            (["These", "healthy", "habits", "are", "very", "important"], 
             "これらの健康的な習慣はとても重要です"),
            (["We", "should", "practice", "them", "every", "day"], 
             "私たちは毎日それらを実践すべきです"),
            (["Good", "health", "helps", "us", "study", "better"], 
             "良い健康は私たちがより良く勉強するのを助けます"),
            (["It", "also", "helps", "us", "enjoy", "life"], 
             "それはまた私たちが人生を楽しむのを助けます"),
            (["When", "we", "are", "healthy", "we", "can", "do", "many", "things"], 
             "私たちが健康なとき多くのことができます"),
            (["We", "can", "play", "sports", "with", "our", "friends"], 
             "私たちは友達とスポーツができます"),
            (["We", "can", "study", "hard", "at", "school"], 
             "私たちは学校で一生懸命勉強できます"),
            (["We", "can", "help", "our", "family", "and", "friends"], 
             "私たちは家族や友達を助けることができます"),
            (["Therefore", "taking", "care", "of", "our", "health", "is", "essential"], 
             "それゆえ私たちの健康を大事にすることは不可欠です"),
            (["Let", "us", "start", "today", "with", "healthy", "habits"], 
             "今日から健康的な習慣を始めましょう"),
            (["Remember", "that", "small", "changes", "can", "make", "a", "big", "difference"], 
             "小さな変化が大きな違いを生むことを覚えておいてください"),
            (["Your", "future", "self", "will", "thank", "you", "for", "these", "choices"], 
             "将来のあなた自身がこれらの選択に感謝するでしょう"),
        ]
        sections.append(self.generator.generate_conclusion_section(conclusion, None, 350))
        
        return self.generator.generate_full_passage(
            "intermediate-3",
            "Healthy Living Habits",
            sections
        )


class CrossCulturalGenerator:
    """intermediate-4: 異文化理解と交流（2,500語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "異文化理解と交流", "中級", 2500
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (150語)
        intro = [
            (["Learning", "about", "different", "cultures", "is", "exciting"], 
             "異なる文化について学ぶことは刺激的です"),
            (["Every", "country", "has", "its", "own", "traditions"], 
             "すべての国には独自の伝統があります"),
            (["We", "can", "learn", "many", "things", "from", "other", "cultures"], 
             "私たちは他の文化から多くのことを学べます"),
            (["Cultural", "exchange", "helps", "us", "understand", "each", "other"], 
             "文化交流は私たちがお互いを理解するのを助けます"),
        ]
        sections.append(self.generator.generate_introduction_section(intro, None, 350))
        
        # Section 2: Travel and Places (600語)
        place_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["場所・移動"], limit=120)
        place_templates = [
            (["I", "want", "to", "visit", "{word}", "someday"], 
             "いつか{meaning}を訪れたいです"),
            (["{word}", "is", "a", "famous", "place", "in", "the", "world"], 
             "{meaning}は世界の有名な場所です"),
            (["Many", "people", "travel", "to", "{word}"], 
             "多くの人々が{meaning}へ旅行します"),
            (["When", "I", "go", "to", "{word}", "I", "feel", "excited"], 
             "{meaning}へ行くとき私はわくわくします"),
            (["{word}", "has", "beautiful", "scenery"], 
             "{meaning}は美しい景色があります"),
            (["Learning", "about", "{word}", "is", "interesting"], 
             "{meaning}について学ぶことは興味深いです"),
        ]
        sections.append(self.generator.generate_topic_section(place_vocab, place_templates, 600))
        
        # Section 3: People and Society (700語)
        people_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["人・社会"], limit=140)
        people_templates = [
            (["{word}", "helps", "us", "understand", "culture"], 
             "{meaning}は私たちが文化を理解するのを助けます"),
            (["We", "learn", "about", "{word}", "in", "different", "countries"], 
             "私たちは異なる国々の{meaning}について学びます"),
            (["Every", "culture", "has", "different", "{word}"], 
             "すべての文化には異なる{meaning}があります"),
            (["{word}", "is", "important", "in", "society"], 
             "{meaning}は社会で重要です"),
            (["People", "respect", "{word}", "everywhere"], 
             "人々はどこでも{meaning}を尊重します"),
            (["Understanding", "{word}", "brings", "people", "together"], 
             "{meaning}を理解することは人々を結びつけます"),
        ]
        sections.append(self.generator.generate_topic_section(people_vocab, people_templates, 850))
        
        # Section 4: School and Learning (650語)
        school_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["学校・学習"], limit=100)
        school_templates = [
            (["Students", "{word}", "about", "other", "cultures"], 
             "生徒たちは他の文化について{meaning}します"),
            (["{word}", "is", "important", "for", "cultural", "exchange"], 
             "{meaning}は文化交流にとって重要です"),
            (["We", "can", "{word}", "with", "international", "students"], 
             "私たちは留学生と{meaning}できます"),
            (["My", "teacher", "helps", "us", "{word}"], 
             "先生は私たちが{meaning}するのを助けます"),
            (["I", "enjoy", "{word}", "at", "school"], 
             "私は学校で{meaning}することを楽しみます"),
        ]
        sections.append(self.generator.generate_topic_section(school_vocab, school_templates, 650))
        
        # Section 5: Conclusion (700語)
        conclusion = [
            (["Cultural", "exchange", "makes", "the", "world", "better"], 
             "文化交流は世界をより良くします"),
            (["We", "should", "respect", "all", "cultures"], 
             "私たちはすべての文化を尊重すべきです"),
            (["Learning", "about", "others", "helps", "us", "grow"], 
             "他者について学ぶことは私たちが成長するのを助けます"),
            (["Let", "us", "be", "open", "to", "new", "experiences"], 
             "新しい経験に心を開きましょう"),
            (["When", "we", "meet", "people", "from", "different", "countries"], 
             "異なる国の人々に会うとき"),
            (["We", "can", "learn", "so", "many", "wonderful", "things"], 
             "私たちはたくさんの素晴らしいことを学ぶことができます"),
            (["They", "teach", "us", "about", "their", "customs", "and", "traditions"], 
             "彼らは自分たちの習慣や伝統について教えてくれます"),
            (["We", "share", "our", "own", "culture", "with", "them"], 
             "私たちは自分たちの文化を彼らと共有します"),
            (["This", "exchange", "creates", "friendship", "and", "understanding"], 
             "この交流は友情と理解を生み出します"),
            (["Together", "we", "can", "build", "a", "peaceful", "world"], 
             "一緒に私たちは平和な世界を築くことができます"),
            (["Every", "person", "has", "something", "valuable", "to", "teach"], 
             "すべての人には教えるべき貴重なことがあります"),
            (["We", "should", "listen", "carefully", "and", "learn", "with", "open", "hearts"], 
             "私たちは注意深く耳を傾け、開かれた心で学ぶべきです"),
        ]
        sections.append(self.generator.generate_conclusion_section(conclusion, None, 350))
        
        return self.generator.generate_full_passage(
            "intermediate-4",
            "Learning from Different Cultures",
            sections
        )


class FutureCareersGenerator:
    """intermediate-5: 将来の夢と職業（3,000語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "将来の夢と職業", "中級", 3000
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (150語)
        intro = [
            (["Thinking", "about", "our", "future", "is", "important"], 
             "私たちの未来について考えることは重要です"),
            (["Many", "students", "wonder", "what", "job", "they", "will", "have"], 
             "多くの生徒たちが自分がどんな仕事に就くか考えます"),
            (["There", "are", "many", "different", "careers", "to", "choose", "from"], 
             "選択できる多くの異なる職業があります"),
            (["We", "should", "learn", "about", "various", "jobs"], 
             "私たちは様々な仕事について学ぶべきです"),
        ]
        sections.append(self.generator.generate_introduction_section(intro, None, 350))
        
        # Section 2: School and Skills (800語)
        school_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["学校・学習"], limit=160)
        school_templates = [
            (["{word}", "is", "important", "for", "our", "future", "career"], 
             "{meaning}は私たちの将来のキャリアにとって重要です"),
            (["We", "need", "to", "{word}", "hard", "at", "school"], 
             "私たちは学校で一生懸命{meaning}する必要があります"),
            (["Good", "{word}", "helps", "us", "get", "better", "jobs"], 
             "良い{meaning}は私たちがより良い仕事を得るのを助けます"),
            (["I", "want", "to", "improve", "my", "{word}", "skills"], 
             "私は{meaning}のスキルを向上させたいです"),
            (["Teachers", "help", "us", "develop", "{word}"], 
             "先生たちは私たちが{meaning}を開発するのを助けます"),
            (["Learning", "{word}", "takes", "time", "and", "effort"], 
             "{meaning}を学ぶことは時間と努力がかかります"),
            (["Everyone", "should", "practice", "{word}", "regularly"], 
             "誰もが定期的に{meaning}を練習すべきです"),
        ]
        sections.append(self.generator.generate_topic_section(school_vocab, school_templates, 950))
        
        # Section 3: People and Society (850語)
        society_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["人・社会"], limit=140)
        society_templates = [
            (["{word}", "plays", "an", "important", "role", "in", "society"], 
             "{meaning}は社会で重要な役割を果たします"),
            (["Many", "people", "work", "as", "{word}"], 
             "多くの人々が{meaning}として働いています"),
            (["We", "can", "help", "society", "through", "{word}"], 
             "私たちは{meaning}を通じて社会を助けることができます"),
            (["{word}", "is", "needed", "in", "every", "community"], 
             "{meaning}はすべてのコミュニティで必要です"),
            (["I", "respect", "people", "who", "work", "in", "{word}"], 
             "私は{meaning}で働く人々を尊重します"),
            (["Understanding", "{word}", "helps", "us", "choose", "careers"], 
             "{meaning}を理解することはキャリアを選ぶのを助けます"),
        ]
        sections.append(self.generator.generate_topic_section(society_vocab, society_templates, 850))
        
        # Section 4: Science and Technology (700語)
        tech_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["科学・技術"], limit=140)
        tech_templates = [
            (["{word}", "is", "changing", "how", "we", "work"], 
             "{meaning}は私たちの働き方を変えています"),
            (["Future", "jobs", "will", "need", "{word}", "skills"], 
             "将来の仕事には{meaning}のスキルが必要になります"),
            (["We", "should", "learn", "about", "{word}"], 
             "私たちは{meaning}について学ぶべきです"),
            (["{word}", "helps", "people", "do", "their", "jobs", "better"], 
             "{meaning}は人々が仕事をより良くするのを助けます"),
            (["Many", "companies", "use", "{word}", "today"], 
             "多くの企業が今日{meaning}を使っています"),
            (["I", "am", "interested", "in", "{word}"], 
             "私は{meaning}に興味があります"),
        ]
        sections.append(self.generator.generate_topic_section(tech_vocab, tech_templates, 700))
        
        # Section 5: Conclusion (800語)
        conclusion = [
            (["Choosing", "a", "career", "is", "an", "important", "decision"], 
             "職業を選ぶことは重要な決断です"),
            (["We", "should", "think", "carefully", "about", "our", "future"], 
             "私たちは自分の未来について慎重に考えるべきです"),
            (["Every", "job", "has", "its", "own", "value"], 
             "すべての仕事には独自の価値があります"),
            (["Let", "us", "work", "hard", "for", "our", "dreams"], 
             "私たちの夢のために一生懸命働きましょう"),
            (["The", "world", "needs", "people", "with", "many", "different", "skills"], 
             "世界は多くの異なるスキルを持つ人々を必要としています"),
            (["Some", "people", "become", "doctors", "and", "help", "sick", "people"], 
             "一部の人々は医者になり病人を助けます"),
            (["Some", "become", "teachers", "and", "educate", "the", "next", "generation"], 
             "一部は教師になり次の世代を教育します"),
            (["Others", "work", "in", "technology", "and", "create", "new", "inventions"], 
             "他の人々は技術分野で働き新しい発明を生み出します"),
            (["No", "matter", "what", "career", "you", "choose"], 
             "あなたがどんなキャリアを選んでも"),
            (["You", "can", "make", "a", "positive", "difference", "in", "the", "world"], 
             "世界に肯定的な変化をもたらすことができます"),
            (["Start", "preparing", "for", "your", "future", "today"], 
             "今日からあなたの未来の準備を始めましょう"),
            (["With", "dedication", "and", "hard", "work", "you", "will", "succeed"], 
             "献身と勤勉であなたは成功するでしょう"),
        ]
        sections.append(self.generator.generate_conclusion_section(conclusion, None, 350))
        
        return self.generator.generate_full_passage(
            "intermediate-5",
            "Thinking About Future Careers",
            sections
        )


class EnvironmentIssuesGenerator:
    """intermediate-1: 環境問題と対策（1,000語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "環境問題と対策", "中級", 1000
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (具体的な導入)
        intro = [
            (["Our", "environment", "is", "very", "important"], 
             "私たちの環境はとても重要です"),
            (["We", "must", "protect", "it", "for", "future", "generations"], 
             "私たちは将来の世代のためにそれを守らなければなりません"),
            (["There", "are", "many", "environmental", "problems", "today"], 
             "今日多くの環境問題があります"),
            (["Air", "pollution", "water", "pollution", "and", "climate", "change", "are", "serious", "issues"],
             "大気汚染、水質汚染、気候変動は深刻な問題です"),
            (["We", "need", "to", "understand", "these", "problems"], 
             "私たちはこれらの問題を理解する必要があります"),
            (["Then", "we", "can", "take", "action", "to", "help"], 
             "そうすれば私たちは助けるための行動を取ることができます"),
        ]
        sections.append(self.generator.generate_introduction_section(intro, None, 350))
        
        # Section 2: Air and Water (具体的な環境問題)
        air_water_content = [
            (["The", "air", "we", "breathe", "is", "becoming", "dirty"], 
             "私たちが吸う空気は汚れてきています"),
            (["Cars", "and", "factories", "produce", "smoke"], 
             "車や工場が煙を出します"),
            (["This", "smoke", "pollutes", "the", "air"], 
             "この煙が空気を汚染します"),
            (["Clean", "air", "is", "important", "for", "our", "health"], 
             "きれいな空気は私たちの健康に重要です"),
            (["Water", "is", "also", "very", "important"], 
             "水もまたとても重要です"),
            (["We", "use", "water", "every", "day", "for", "drinking"], 
             "私たちは毎日飲むために水を使います"),
            (["Rivers", "and", "oceans", "are", "becoming", "polluted"], 
             "川や海が汚染されてきています"),
            (["Plastic", "waste", "is", "a", "big", "problem"], 
             "プラスチックごみは大きな問題です"),
            (["Many", "fish", "and", "sea", "animals", "are", "affected"], 
             "多くの魚や海の動物が影響を受けています"),
            (["We", "must", "keep", "our", "water", "clean"], 
             "私たちは水をきれいに保たなければなりません"),
        ]
        for words, meaning in air_water_content:
            sections[0]['phrases'].append(self.generator.create_simple_phrase(words, meaning))
        
        # Section 3: Forests and Nature (森林と自然)
        forest_content = [
            (["Forests", "are", "the", "lungs", "of", "our", "planet"], 
             "森林は私たちの惑星の肺です"),
            (["Trees", "give", "us", "oxygen", "to", "breathe"], 
             "木は私たちに吸うための酸素を与えます"),
            (["They", "also", "provide", "homes", "for", "animals"], 
             "それらはまた動物のための家を提供します"),
            (["But", "many", "forests", "are", "being", "cut", "down"], 
             "しかし多くの森林が切り倒されています"),
            (["This", "is", "called", "deforestation"], 
             "これは森林破壊と呼ばれます"),
            (["When", "we", "lose", "forests", "we", "lose", "biodiversity"], 
             "森林を失うと私たちは生物多様性を失います"),
            (["Many", "plant", "and", "animal", "species", "disappear"], 
             "多くの植物や動物種が消えます"),
            (["We", "need", "to", "protect", "our", "forests"], 
             "私たちは森林を守る必要があります"),
            (["Planting", "new", "trees", "is", "one", "solution"], 
             "新しい木を植えることは一つの解決策です"),
            (["Every", "tree", "helps", "make", "our", "planet", "healthier"], 
             "すべての木が私たちの惑星をより健康にするのを助けます"),
        ]
        for words, meaning in forest_content:
            sections[0]['phrases'].append(self.generator.create_simple_phrase(words, meaning))
        
        # Section 4: Climate Change (気候変動)
        climate_content = [
            (["Climate", "change", "is", "a", "global", "problem"], 
             "気候変動は世界的な問題です"),
            (["The", "Earth", "is", "getting", "warmer"], 
             "地球は温かくなってきています"),
            (["This", "is", "called", "global", "warming"], 
             "これは地球温暖化と呼ばれます"),
            (["Greenhouse", "gases", "trap", "heat", "in", "the", "atmosphere"], 
             "温室効果ガスが大気中に熱を閉じ込めます"),
            (["Carbon", "dioxide", "is", "one", "main", "greenhouse", "gas"], 
             "二酸化炭素は主な温室効果ガスの一つです"),
            (["Burning", "fossil", "fuels", "releases", "carbon", "dioxide"], 
             "化石燃料を燃やすことが二酸化炭素を放出します"),
            (["The", "weather", "is", "becoming", "more", "extreme"], 
             "天候はより極端になってきています"),
            (["We", "see", "more", "storms", "floods", "and", "droughts"], 
             "私たちはより多くの嵐、洪水、干ばつを見ます"),
            (["Ice", "caps", "are", "melting", "at", "the", "poles"], 
             "極地で氷冠が溶けています"),
            (["Sea", "levels", "are", "rising"], 
             "海面が上昇しています"),
        ]
        for words, meaning in climate_content:
            sections[0]['phrases'].append(self.generator.create_simple_phrase(words, meaning))
        
        # Section 5: What We Can Do (私たちにできること)
        action_content = [
            (["Everyone", "can", "help", "protect", "the", "environment"], 
             "誰もが環境を守るのを助けることができます"),
            (["We", "can", "reduce", "reuse", "and", "recycle"], 
             "私たちは削減、再利用、リサイクルができます"),
            (["Reducing", "means", "using", "less"], 
             "削減とはより少なく使うことを意味します"),
            (["We", "should", "turn", "off", "lights", "when", "not", "needed"], 
             "必要でないときは明かりを消すべきです"),
            (["We", "can", "use", "less", "water", "when", "washing"], 
             "洗うときにより少ない水を使えます"),
            (["Reusing", "means", "using", "things", "again"], 
             "再利用とは物を再び使うことを意味します"),
            (["We", "can", "use", "shopping", "bags", "many", "times"], 
             "買い物袋を何度も使えます"),
            (["Recycling", "means", "making", "new", "things", "from", "old", "materials"], 
             "リサイクルとは古い材料から新しい物を作ることを意味します"),
            (["We", "can", "recycle", "paper", "plastic", "and", "glass"], 
             "紙、プラスチック、ガラスをリサイクルできます"),
            (["Walking", "or", "cycling", "instead", "of", "driving", "helps"], 
             "運転の代わりに歩いたり自転車に乗ったりすることが助けになります"),
        ]
        for words, meaning in action_content:
            sections[0]['phrases'].append(self.generator.create_simple_phrase(words, meaning))
        
        # Section 6: Conclusion (結論)
        conclusion = [
            (["Protecting", "the", "environment", "is", "everyone's", "responsibility"], 
             "環境を守ることは全員の責任です"),
            (["Small", "actions", "can", "make", "a", "big", "difference"], 
             "小さな行動が大きな違いを生むことができます"),
            (["If", "we", "all", "work", "together", "we", "can", "help"], 
             "私たち全員が協力すれば、助けることができます"),
            (["We", "can", "create", "a", "cleaner", "healthier", "planet"], 
             "より清潔でより健康な惑星を作ることができます"),
            (["The", "future", "of", "our", "Earth", "depends", "on", "us"], 
             "私たちの地球の未来は私たちにかかっています"),
            (["Let", "us", "take", "care", "of", "our", "environment", "today"], 
             "今日、私たちの環境の世話をしましょう"),
        ]
        for words, meaning in conclusion:
            all_phrases.append(self.generator.create_simple_phrase(words, meaning))
        
        # 語数をカウント
        word_count = sum(len(p['words']) for p in all_phrases)
        
        return {
            "id": "intermediate-1",
            "title": "Protecting Our Environment",
            "level": "中級",
            "theme": "環境問題と対策",
            "targetWordCount": 1000,
            "actualWordCount": word_count,
            "phrases": all_phrases
        }


class ScienceTechnologyGenerator:
    """intermediate-2: 科学技術の発展（1,200語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "科学技術の発展", "中級", 1200
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (100語)
        intro = [
            (["Science", "and", "technology", "change", "our", "lives"], 
             "科学と技術は私たちの生活を変えます"),
            (["New", "inventions", "help", "us", "every", "day"], 
             "新しい発明が毎日私たちを助けます"),
            (["Let", "me", "tell", "you", "about", "modern", "technology"], 
             "現代の技術についてお話しします"),
        ]
        sections.append(self.generator.generate_introduction_section(intro, None, 350))
        
        # Section 2: Technology (550語)
        tech_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["科学・技術"], limit=120)
        tech_templates = [
            (["{word}", "is", "very", "useful", "in", "modern", "life"], 
             "{meaning}は現代生活でとても有用です"),
            (["We", "use", "{word}", "every", "day"], 
             "私たちは毎日{meaning}を使います"),
            (["{word}", "helps", "people", "communicate"], 
             "{meaning}は人々がコミュニケーションするのを助けます"),
            (["Scientists", "develop", "{word}", "constantly"], 
             "科学者たちは絶えず{meaning}を開発しています"),
            (["{word}", "makes", "our", "work", "easier"], 
             "{meaning}は私たちの仕事を簡単にします"),
        ]
        sections.append(self.generator.generate_topic_section(tech_vocab, tech_templates, 600))
        
        # Section 3: Learning (450語)
        learn_vocab = self.vocab_manager.get_vocab_by_categories("中級", ["学校・学習"], limit=80)
        learn_templates = [
            (["Students", "{word}", "using", "technology"], 
             "生徒たちは技術を使って{meaning}します"),
            (["{word}", "is", "important", "for", "understanding", "science"], 
             "{meaning}は科学を理解するために重要です"),
            (["We", "can", "{word}", "with", "computers"], 
             "私たちはコンピュータで{meaning}できます"),
        ]
        sections.append(self.generator.generate_topic_section(learn_vocab, learn_templates, 450))
        
        # Section 4: Conclusion (150語)
        conclusion = [
            (["Technology", "will", "continue", "to", "grow"], 
             "技術は成長し続けるでしょう"),
            (["We", "should", "learn", "about", "new", "developments"], 
             "私たちは新しい発展について学ぶべきです"),
            (["The", "future", "is", "full", "of", "possibilities"], 
             "未来は可能性に満ちています"),
        ]
        sections.append(self.generator.generate_conclusion_section(conclusion, None, 350))
        
        return self.generator.generate_full_passage(
            "intermediate-2",
            "Science and Technology in Our Lives",
            sections
        )


class SustainableSocietyGenerator:
    """advanced-1: 持続可能な社会の実現（3,000語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "持続可能な社会の実現", "上級", 3000
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (200語)
        intro = [
            (["Sustainability", "is", "one", "of", "the", "most", "important", "issues"], 
             "持続可能性は最も重要な問題の一つです"),
            (["We", "need", "to", "think", "about", "our", "planet's", "future"], 
             "私たちは地球の未来について考える必要があります"),
            (["Creating", "a", "sustainable", "society", "requires", "effort", "from", "everyone"], 
             "持続可能な社会を作るには全員の努力が必要です"),
            (["This", "includes", "protecting", "the", "environment", "and", "using", "resources", "wisely"], 
             "これには環境を守り資源を賢く使うことが含まれます"),
        ]
        sections.append(self.generator.generate_introduction_section(intro, None, 350))
        
        # Section 2: Environment (1200語)
        env_vocab = self.vocab_manager.get_vocab_by_categories("上級", ["自然・環境"], limit=250)
        env_templates = [
            (["{word}", "plays", "a", "crucial", "role", "in", "sustainability"], 
             "{meaning}は持続可能性において重要な役割を果たします"),
            (["We", "must", "protect", "{word}", "for", "future", "generations"], 
             "私たちは将来の世代のために{meaning}を守らなければなりません"),
            (["{word}", "is", "essential", "for", "our", "survival"], 
             "{meaning}は私たちの生存に不可欠です"),
            (["Many", "countries", "are", "working", "to", "preserve", "{word}"], 
             "多くの国が{meaning}を保全するために取り組んでいます"),
            (["Understanding", "{word}", "helps", "us", "make", "better", "decisions"], 
             "{meaning}を理解することはより良い決断をするのに役立ちます"),
            (["Scientists", "study", "{word}", "to", "find", "solutions"], 
             "科学者たちは解決策を見つけるために{meaning}を研究します"),
        ]
        sections.append(self.generator.generate_topic_section(env_vocab, env_templates, 1500))
        
        # Section 3: Society and Technology (1500語)
        society_vocab = self.vocab_manager.get_vocab_by_categories("上級", ["人・社会", "科学・技術"], limit=260)
        society_templates = [
            (["{word}", "contributes", "to", "sustainable", "development"], 
             "{meaning}は持続可能な発展に貢献します"),
            (["Modern", "{word}", "offers", "new", "solutions"], 
             "現代の{meaning}は新しい解決策を提供します"),
            (["Society", "needs", "to", "embrace", "{word}"], 
             "社会は{meaning}を受け入れる必要があります"),
            (["{word}", "can", "help", "address", "global", "challenges"], 
             "{meaning}は世界的な課題に対処するのを助けることができます"),
            (["Implementing", "{word}", "requires", "cooperation"], 
             "{meaning}を実装するには協力が必要です"),
        ]
        sections.append(self.generator.generate_topic_section(society_vocab, society_templates, 1500))
        
        # Section 5: Conclusion (900語)
        conclusion = [
            (["Building", "a", "sustainable", "society", "is", "our", "shared", "responsibility"], 
             "持続可能な社会を築くことは私たちの共通の責任です"),
            (["Every", "action", "we", "take", "matters"], 
             "私たちが取るすべての行動が重要です"),
            (["We", "must", "work", "together", "to", "create", "a", "better", "future"], 
             "より良い未来を創造するために協力しなければなりません"),
            (["The", "choices", "we", "make", "today", "will", "affect", "tomorrow"], 
             "今日私たちが行う選択が明日に影響します"),
            (["Let", "us", "commit", "to", "sustainable", "living"], 
             "持続可能な生活に取り組みましょう"),
        ]
        sections.append(self.generator.generate_conclusion_section(conclusion, None, 350))
        
        return self.generator.generate_full_passage(
            "advanced-1",
            "Building a Sustainable Society",
            sections
        )


class AIFutureSocietyGenerator:
    """advanced-2: AIと未来社会（3,000語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "AIと未来社会", "上級", 3000
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (200語)
        intro = [
            (["Artificial", "intelligence", "is", "transforming", "our", "world"], 
             "人工知能は私たちの世界を変革しています"),
            (["AI", "technology", "affects", "almost", "every", "aspect", "of", "modern", "life"], 
             "AI技術は現代生活のほぼすべての側面に影響を与えます"),
            (["Understanding", "AI", "is", "crucial", "for", "our", "future"], 
             "AIを理解することは私たちの未来にとって重要です"),
        ]
        sections.append(self.generator.generate_introduction_section(intro, None, 350))
        
        # Section 2: Technology (1400語)
        tech_vocab = self.vocab_manager.get_vocab_by_categories("上級", ["科学・技術"], limit=300)
        tech_templates = [
            (["{word}", "is", "revolutionizing", "how", "we", "live"], 
             "{meaning}は私たちの生き方を革新しています"),
            (["AI", "uses", "{word}", "to", "solve", "complex", "problems"], 
             "AIは複雑な問題を解決するために{meaning}を使います"),
            (["{word}", "enables", "machines", "to", "learn", "and", "adapt"], 
             "{meaning}は機械が学習し適応することを可能にします"),
            (["Researchers", "develop", "{word}", "for", "various", "applications"], 
             "研究者たちは様々な応用のために{meaning}を開発しています"),
            (["The", "future", "of", "{word}", "looks", "promising"], 
             "{meaning}の未来は有望に見えます"),
            (["Experts", "predict", "{word}", "will", "transform", "industries"], 
             "専門家たちは{meaning}が産業を変革すると予測しています"),
        ]
        sections.append(self.generator.generate_topic_section(tech_vocab, tech_templates, 1550))
        
        # Section 3: Society (1150語)
        society_vocab = self.vocab_manager.get_vocab_by_categories("上級", ["人・社会"], limit=220)
        society_templates = [
            (["{word}", "will", "be", "affected", "by", "AI", "development"], 
             "{meaning}はAIの発展によって影響を受けるでしょう"),
            (["Society", "must", "adapt", "to", "changes", "in", "{word}"], 
             "社会は{meaning}の変化に適応しなければなりません"),
            (["{word}", "plays", "an", "important", "role", "in", "AI", "ethics"], 
             "{meaning}はAI倫理において重要な役割を果たします"),
            (["We", "need", "to", "consider", "{word}", "carefully"], 
             "私たちは{meaning}を慎重に考慮する必要があります"),
            (["Understanding", "{word}", "helps", "us", "navigate", "change"], 
             "{meaning}を理解することは変化を乗り越えるのに役立ちます"),
        ]
        sections.append(self.generator.generate_topic_section(society_vocab, society_templates, 1150))
        
        # Section 4: Conclusion (800語)
        conclusion = [
            (["AI", "will", "continue", "to", "evolve", "rapidly"], 
             "AIは急速に進化し続けるでしょう"),
            (["We", "must", "ensure", "AI", "benefits", "all", "of", "humanity"], 
             "AIが全人類に利益をもたらすことを確保しなければなりません"),
            (["The", "future", "with", "AI", "holds", "both", "opportunities", "and", "challenges"], 
             "AIのある未来は機会と課題の両方を持っています"),
            (["Let", "us", "work", "together", "to", "shape", "a", "positive", "future"], 
             "ポジティブな未来を形作るために協力しましょう"),
        ]
        sections.append(self.generator.generate_conclusion_section(conclusion, None, 350))
        
        return self.generator.generate_full_passage(
            "advanced-2",
            "AI and Future Society",
            sections
        )


class GlobalDiversityGenerator:
    """advanced-3: グローバル化と多様性（3,000語）"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.generator = LongPassageGenerator(
            vocab_manager, "グローバル化と多様性", "上級", 3000
        )
    
    def generate(self):
        sections = []
        
        # Section 1: Introduction (200語)
        intro = [
            (["Globalization", "connects", "people", "around", "the", "world"], 
             "グローバル化は世界中の人々を結びつけます"),
            (["Diversity", "enriches", "our", "societies", "and", "cultures"], 
             "多様性は私たちの社会と文化を豊かにします"),
            (["Understanding", "different", "perspectives", "is", "essential"], 
             "異なる視点を理解することは不可欠です"),
        ]
        sections.append(self.generator.generate_introduction_section(intro, None, 350))
        
        # Section 2: Society and Culture (1300語)
        society_vocab = self.vocab_manager.get_vocab_by_categories("上級", ["人・社会"], limit=280)
        society_templates = [
            (["{word}", "varies", "across", "different", "cultures"], 
             "{meaning}は異なる文化によって変わります"),
            (["Understanding", "{word}", "helps", "build", "bridges", "between", "communities"], 
             "{meaning}を理解することはコミュニティ間の橋を架けるのに役立ちます"),
            (["{word}", "is", "important", "for", "global", "cooperation"], 
             "{meaning}は世界的な協力にとって重要です"),
            (["Respecting", "{word}", "promotes", "harmony"], 
             "{meaning}を尊重することは調和を促進します"),
            (["Different", "societies", "approach", "{word}", "uniquely"], 
             "異なる社会は{meaning}に独特にアプローチします"),
        ]
        sections.append(self.generator.generate_topic_section(society_vocab, society_templates, 1450))
        
        # Section 3: International Relations (1150語)
        place_vocab = self.vocab_manager.get_vocab_by_categories("上級", ["場所・移動"], limit=220)
        place_templates = [
            (["People", "from", "{word}", "contribute", "to", "global", "diversity"], 
             "{meaning}からの人々が世界の多様性に貢献します"),
            (["{word}", "plays", "a", "role", "in", "international", "cooperation"], 
             "{meaning}は国際協力において役割を果たします"),
            (["Understanding", "{word}", "helps", "us", "appreciate", "differences"], 
             "{meaning}を理解することは違いを評価するのに役立ちます"),
            (["Connections", "between", "{word}", "strengthen", "global", "ties"], 
             "{meaning}間のつながりが世界的な絆を強めます"),
        ]
        sections.append(self.generator.generate_topic_section(place_vocab, place_templates, 1270))
        
        # Section 4: Conclusion (800語)
        conclusion = [
            (["Embracing", "diversity", "makes", "our", "world", "stronger"], 
             "多様性を受け入れることは私たちの世界をより強くします"),
            (["We", "must", "work", "together", "across", "borders"], 
             "私たちは国境を越えて協力しなければなりません"),
            (["Every", "culture", "has", "valuable", "lessons", "to", "teach"], 
             "すべての文化には教えるべき貴重な教訓があります"),
            (["Let", "us", "celebrate", "our", "differences", "and", "find", "common", "ground"], 
             "私たちの違いを祝福し共通点を見つけましょう"),
        ]
        sections.append(self.generator.generate_conclusion_section(conclusion, None, 350))
        
        return self.generator.generate_full_passage(
            "advanced-3",
            "Globalization and Diversity",
            sections
        )


def main():
    """メイン実行関数"""
    print("="*70)
    print("長文パッセージ生成ツール (完全版)")
    print("="*70)
    
    # 語彙マネージャー初期化
    vocab_manager = VocabularyManager()
    print(f"\n✓ CSVデータ読み込み完了: {len(vocab_manager.all_vocab)}語")
    print(f"  - 初級: {len(vocab_manager.vocab_by_level['初級'])}語")
    print(f"  - 中級: {len(vocab_manager.vocab_by_level['中級'])}語")
    print(f"  - 上級: {len(vocab_manager.vocab_by_level['上級'])}語")
    
    # パッセージ生成
    generators = [
        ("intermediate-1", EnvironmentIssuesGenerator(vocab_manager)),
        ("intermediate-2", ScienceTechnologyGenerator(vocab_manager)),
        ("intermediate-3", HealthyLivingGenerator(vocab_manager)),
        ("intermediate-4", CrossCulturalGenerator(vocab_manager)),
        ("intermediate-5", FutureCareersGenerator(vocab_manager)),
        ("advanced-1", SustainableSocietyGenerator(vocab_manager)),
        ("advanced-2", AIFutureSocietyGenerator(vocab_manager)),
        ("advanced-3", GlobalDiversityGenerator(vocab_manager)),
    ]
    
    all_passages = []
    
    for passage_id, generator in generators:
        print(f"\n生成中: {passage_id}...")
        passage = generator.generate()
        
        # 個別ファイルとして保存
        output_file = f"prototype/{passage_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(passage, f, ensure_ascii=False, indent=2)
        
        all_passages.append(passage)
        print(f"✓ {passage_id}: {passage['actualWordCount']}語 "
              f"({len(passage['phrases'])}フレーズ) - {output_file}")
    
    print("\n" + "="*70)
    print(f"✓ {len(all_passages)}パッセージの生成が完了しました")
    print("="*70)
    
    # レベル別サマリー
    by_level = {'中級': [], '上級': []}
    for p in all_passages:
        by_level[p['level']].append(p)
    
    print(f"\n【レベル別サマリー】")
    for level, passages in by_level.items():
        total = sum(p['actualWordCount'] for p in passages)
        print(f"\n{level}: {total:,}語 ({len(passages)}パッセージ)")
        for p in passages:
            print(f"  - {p['id']}: {p['actualWordCount']:,}語 "
                  f"(目標: {p['targetWordCount']:,}語, 達成率: {p['actualWordCount']/p['targetWordCount']*100:.0f}%)")
    
    total_words = sum(p['actualWordCount'] for p in all_passages)
    print(f"\n総語数: {total_words:,}語")
    print(f"目標: 20,000-21,000語")
    print(f"達成率: {total_words/20000*100:.1f}%")

if __name__ == '__main__':
    main()
