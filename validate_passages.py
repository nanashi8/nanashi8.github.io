#!/usr/bin/env python3
"""
長文読解パッセージ検証スクリプト
JSONファイルの品質をチェック
"""

import json
import csv
import re
from typing import Dict, List, Set, Tuple
from collections import Counter

CSV_PATH = "public/data/junior-high-entrance-words.csv"

class PassageValidator:
    def __init__(self):
        self.vocab_db = self._load_vocabulary_database()
        self.basic_function_words = self._get_basic_function_words()
    
    def _get_basic_function_words(self) -> set:
        """基本機能語のセット（チェックから除外）"""
        return {
            # 冠詞・代名詞
            'a', 'an', 'the', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 
            'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
            'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
            'yourselves', 'themselves', 'this', 'that', 'these', 'those',
            # be動詞
            'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            # 助動詞
            'will', 'would', 'can', 'could', 'should', 'shall', 'may', 
            'might', 'must',
            # do動詞
            'do', 'does', 'did', 'doing', 'done',
            # have動詞
            'have', 'has', 'had', 'having',
            # 接続詞・前置詞
            'and', 'or', 'but', 'so', 'if', 'when', 'where', 'who', 'what',
            'which', 'whose', 'whom', 'how', 'why', 'because', 'although',
            'though', 'while', 'as', 'since', 'until', 'unless', 'whether',
            'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by',
            'about', 'into', 'through', 'during', 'before', 'after', 'above',
            'below', 'up', 'down', 'out', 'over', 'under', 'between', 'among',
            # その他の基本語
            'not', 'no', 'yes', 'there', 'here', 'very', 'too', 'so', 'such',
            'some', 'any', 'all', 'both', 'each', 'every', 'many', 'much',
            'more', 'most', 'few', 'little', 'other', 'another', 'one', 'two',
        }
    
    def _lemmatize_simple(self, word: str) -> str:
        """簡易的な原形変換"""
        word = word.lower()
        
        # 複数形を単数形に
        if word.endswith('ies') and len(word) > 4:
            return word[:-3] + 'y'  # studies -> study
        elif word.endswith('es') and len(word) > 3:
            # classes, boxes, watches
            if word.endswith(('sses', 'xes', 'ches', 'shes', 'zes')):
                return word[:-2]
            # goes -> go
            elif word.endswith('oes'):
                return word[:-2]
            else:
                return word[:-1]  # likes -> like
        elif word.endswith('s') and len(word) > 2:
            # books -> book, students -> student
            return word[:-1]
        
        # 過去形・過去分詞を原形に（簡易的）
        if word.endswith('ied') and len(word) > 4:
            return word[:-3] + 'y'  # studied -> study
        elif word.endswith('ed') and len(word) > 3:
            # wanted -> want
            if word.endswith('ted') or word.endswith('ded'):
                return word[:-2]
            else:
                return word[:-2]  # walked -> walk
        
        # 進行形を原形に
        if word.endswith('ing') and len(word) > 4:
            # running -> run (重複子音)
            if len(word) > 5 and word[-4] == word[-5]:
                return word[:-4]
            # making -> make
            elif word[-4] != 'e':
                return word[:-3] + 'e'
            else:
                return word[:-3]  # walking -> walk
        
        return word
        
    def _load_vocabulary_database(self) -> Dict[str, Dict]:
        """CSVから語彙データベースを読み込み"""
        vocab = {}
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                word = row['語句'].strip().lower()
                vocab[word] = {
                    'difficulty': row['難易度'].strip(),
                    'category': row['関連 分野'].strip() if '関連 分野' in row else row.get('関連分野', '').strip(),
                    'meaning': row['意味'].strip()
                }
        return vocab
    
    def validate_passage(self, passage_data: Dict) -> Dict:
        """パッセージを検証"""
        results = {
            'passage_id': passage_data.get('id', 'unknown'),
            'title': passage_data.get('title', 'unknown'),
            'level': passage_data.get('level', 'unknown'),
            'checks': {}
        }
        
        # 1. 語数カウント
        word_count_result = self._check_word_count(passage_data)
        results['checks']['word_count'] = word_count_result
        
        # 2. 語彙レベルチェック
        vocab_level_result = self._check_vocabulary_level(passage_data)
        results['checks']['vocabulary_level'] = vocab_level_result
        
        # 3. チャンク長チェック
        chunk_length_result = self._check_chunk_lengths(passage_data)
        results['checks']['chunk_length'] = chunk_length_result
        
        # 4. カテゴリバランスチェック
        category_result = self._check_category_balance(passage_data)
        results['checks']['category_balance'] = category_result
        
        # 5. 直訳ルールチェック
        translation_result = self._check_translation_rules(passage_data)
        results['checks']['translation_rules'] = translation_result
        
        # 6. 重複語彙チェック
        duplicate_result = self._check_duplicate_words(passage_data)
        results['checks']['duplicate_words'] = duplicate_result
        
        # 7. 文章の自然さチェック
        naturalness_result = self._check_naturalness(passage_data)
        results['checks']['naturalness'] = naturalness_result
        
        # 8. 受験英語の出題傾向チェック
        exam_relevance_result = self._check_exam_relevance(passage_data)
        results['checks']['exam_relevance'] = exam_relevance_result
        
        # 9. 読解問題適性チェック
        comprehension_result = self._check_comprehension_suitability(passage_data)
        results['checks']['comprehension_suitability'] = comprehension_result
        
        # 10. 教育的妥当性チェック
        educational_result = self._check_educational_validity(passage_data)
        results['checks']['educational_validity'] = educational_result
        
        # 11. 段落構造チェック
        structure_result = self._check_paragraph_structure(passage_data)
        results['checks']['paragraph_structure'] = structure_result
        
        # 総合評価
        results['overall'] = self._calculate_overall_score(results['checks'])
        
        return results
    
    def _check_word_count(self, passage: Dict) -> Dict:
        """語数をチェック"""
        total_words = 0
        unique_words = set()
        
        for phrase in passage.get('phrases', []):
            words = phrase.get('words', [])
            total_words += len(words)
            unique_words.update([w.lower() for w in words])
        
        target = passage.get('targetWordCount', 0)
        actual = passage.get('actualWordCount', total_words)
        
        in_range = False
        expected_range = ""
        
        level = passage.get('level', 'unknown')
        if level == 'beginner':
            expected_range = "500-800"
            in_range = 500 <= actual <= 800
        elif level == 'intermediate':
            expected_range = "800-3000"
            in_range = 800 <= actual <= 3000
        elif level == 'advanced':
            expected_range = "3000"
            in_range = 2800 <= actual <= 3200  # 許容範囲
        
        return {
            'status': 'pass' if in_range else 'warning',
            'total_words': actual,
            'unique_words': len(unique_words),
            'target_range': expected_range,
            'in_range': in_range,
            'message': f"語数: {actual}語 (ユニーク: {len(unique_words)}語)"
        }
    
    def _check_vocabulary_level(self, passage: Dict) -> Dict:
        """語彙レベルをチェック"""
        level = passage.get('level', 'unknown')
        level_map = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
        }
        expected_level = level_map.get(level, '初級')
        
        allowed_levels = {
            '初級': ['初級'],
            '中級': ['初級', '中級'],
            '上級': ['初級', '中級', '上級']
        }
        
        violations = []
        level_counts = Counter()
        unknown_words = []
        unknown_words_detail = []
        
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                word_original = segment.get('word', '')
                word = word_original.lower()
                
                # 基本的な機能語は除外
                if word in self.basic_function_words:
                    continue
                
                # 原形に変換
                lemma = self._lemmatize_simple(word)
                
                # まず原形で検索
                found = False
                if word in self.vocab_db:
                    found = True
                    word_data = self.vocab_db[word]
                elif lemma in self.vocab_db:
                    found = True
                    word_data = self.vocab_db[lemma]
                    word = lemma  # 原形を使用
                
                if found:
                    word_level = word_data['difficulty']
                    level_counts[word_level] += 1
                    
                    if word_level not in allowed_levels[expected_level]:
                        violations.append({
                            'word': word_original,
                            'lemma': word,
                            'actual_level': word_level,
                            'expected_level': expected_level,
                            'meaning': word_data['meaning']
                        })
                else:
                    # CSVにない単語
                    if len(word) > 1 and word.isalpha():  # 1文字やパンクチュエーションを除外
                        unknown_words.append(word)
                        unknown_words_detail.append({
                            'original': word_original,
                            'lemma': lemma,
                            'checked': [word, lemma]
                        })
        
        status = 'fail' if violations else 'pass'
        
        return {
            'status': status,
            'level_distribution': dict(level_counts),
            'violations': violations[:10],  # 最初の10件のみ
            'violation_count': len(violations),
            'unknown_words': unknown_words[:20],
            'unknown_words_detail': unknown_words_detail[:10],
            'unknown_count': len(unknown_words),
            'message': f"語彙レベル違反: {len(violations)}件, 未登録語: {len(unknown_words)}件"
        }
    
    def _check_chunk_lengths(self, passage: Dict) -> Dict:
        """チャンク長をチェック"""
        level = passage.get('level', 'unknown')
        
        recommended_ranges = {
            'beginner': (3, 7),
            'intermediate': (5, 10),
            'advanced': (7, 15)
        }
        
        min_len, max_len = recommended_ranges.get(level, (3, 10))
        
        chunk_lengths = []
        too_short = []
        too_long = []
        
        for phrase in passage.get('phrases', []):
            words = phrase.get('words', [])
            length = len(words)
            chunk_lengths.append(length)
            
            if length < min_len:
                too_short.append({'phrase': ' '.join(words), 'length': length})
            elif length > max_len:
                too_long.append({'phrase': ' '.join(words[:5]) + '...', 'length': length})
        
        avg_length = sum(chunk_lengths) / len(chunk_lengths) if chunk_lengths else 0
        
        status = 'pass'
        if len(too_short) > len(chunk_lengths) * 0.3 or len(too_long) > len(chunk_lengths) * 0.1:
            status = 'warning'
        
        return {
            'status': status,
            'average_length': round(avg_length, 1),
            'recommended_range': f"{min_len}-{max_len}語",
            'too_short_count': len(too_short),
            'too_long_count': len(too_long),
            'examples_too_short': too_short[:3],
            'examples_too_long': too_long[:3],
            'message': f"平均チャンク長: {avg_length:.1f}語 (推奨: {min_len}-{max_len}語)"
        }
    
    def _check_category_balance(self, passage: Dict) -> Dict:
        """カテゴリバランスをチェック"""
        category_counts = Counter()
        
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '').lower()
                if word in self.vocab_db:
                    category = self.vocab_db[word]['category']
                    category_counts[category] += 1
        
        total = sum(category_counts.values())
        category_percentages = {
            cat: (count / total * 100) if total > 0 else 0
            for cat, count in category_counts.items()
        }
        
        top_categories = category_counts.most_common(5)
        
        # 1つのカテゴリが80%以上を占めていないかチェック
        status = 'pass'
        if top_categories and total > 0 and top_categories[0][1] / total > 0.8:
            status = 'warning'
        
        # パーセンテージ付きのリストを作成
        top_categories_with_pct = [(cat, count, round(count/total*100, 1)) for cat, count in top_categories] if total > 0 else []
        
        return {
            'status': status,
            'category_distribution': dict(category_counts),
            'category_percentages': {k: round(v, 1) for k, v in category_percentages.items()},
            'top_categories': top_categories_with_pct,
            'message': f"主要カテゴリ: {', '.join([f'{cat}({pct:.0f}%)' for cat, _, pct in top_categories_with_pct[:3]])}" if top_categories_with_pct else "カテゴリ情報なし"
        }
    
    def _check_translation_rules(self, passage: Dict) -> Dict:
        """直訳ルールをチェック"""
        issues = []
        
        # 関係代名詞のチェック
        relative_pronouns = {
            'who': '関係代名詞(その人は)',
            'which': ['関係代名詞(その物は)', '関係代名詞(その動物は)'],
            'that': ['関係代名詞(その人は)', '関係代名詞(その物は)', '関係代名詞(その動物は)']
        }
        
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '').lower()
                meaning = segment.get('meaning', '')
                
                if word in relative_pronouns:
                    expected = relative_pronouns[word]
                    if isinstance(expected, list):
                        if not any(exp in meaning for exp in expected):
                            issues.append({
                                'word': word,
                                'actual_meaning': meaning,
                                'expected_meaning': ' or '.join(expected),
                                'issue': '関係代名詞の直訳が不適切'
                            })
                    else:
                        if expected not in meaning:
                            issues.append({
                                'word': word,
                                'actual_meaning': meaning,
                                'expected_meaning': expected,
                                'issue': '関係代名詞の直訳が不適切'
                            })
        
        status = 'pass' if len(issues) == 0 else 'warning'
        
        return {
            'status': status,
            'issues': issues[:5],
            'issue_count': len(issues),
            'message': f"直訳ルール違反: {len(issues)}件"
        }
    
    def _check_duplicate_words(self, passage: Dict) -> Dict:
        """重複語彙をチェック"""
        word_counts = Counter()
        
        for phrase in passage.get('phrases', []):
            for segment in phrase.get('segments', []):
                word = segment.get('word', '').lower()
                if word in self.vocab_db:  # CSVに登録されている語のみカウント
                    word_counts[word] += 1
        
        # 3回以上出現する語をリストアップ
        frequent_words = [(word, count) for word, count in word_counts.most_common(20) if count >= 3]
        
        unique_vocab_count = len(word_counts)
        
        return {
            'status': 'pass',
            'unique_vocabulary': unique_vocab_count,
            'frequent_words': frequent_words,
            'message': f"ユニーク語彙: {unique_vocab_count}語, 頻出語(3回以上): {len(frequent_words)}語"
        }
    
    def _check_naturalness(self, passage: Dict) -> Dict:
        """文章の自然さをチェック"""
        issues = []
        warnings = []
        
        # 1. 同じ単語の連続をチェック
        for phrase in passage.get('phrases', []):
            words = phrase.get('words', [])
            for i in range(len(words) - 1):
                if words[i].lower() == words[i+1].lower():
                    issues.append({
                        'type': '単語の連続',
                        'phrase': ' '.join(words),
                        'issue': f'"{words[i]}" が連続しています'
                    })
        
        # 2. 不自然に短い文や長い文をチェック
        sentence_lengths = []
        current_sentence = []
        
        for phrase in passage.get('phrases', []):
            words = phrase.get('words', [])
            current_sentence.extend(words)
            
            # 文末記号で文を区切る
            if words and words[-1].rstrip('.,!?;:') != words[-1]:
                sentence_lengths.append(len(current_sentence))
                if len(current_sentence) < 3:
                    warnings.append({
                        'type': '極端に短い文',
                        'sentence': ' '.join(current_sentence),
                        'length': len(current_sentence)
                    })
                elif len(current_sentence) > 40:
                    warnings.append({
                        'type': '極端に長い文',
                        'sentence': ' '.join(current_sentence[:10]) + '...',
                        'length': len(current_sentence)
                    })
                current_sentence = []
        
        # 3. 接続詞の適切な使用をチェック
        conjunctions = ['however', 'therefore', 'moreover', 'furthermore', 'nevertheless']
        conjunction_count = 0
        total_sentences = len(sentence_lengths) if sentence_lengths else 1
        
        for phrase in passage.get('phrases', []):
            words = [w.lower() for w in phrase.get('words', [])]
            for conj in conjunctions:
                if conj in words:
                    conjunction_count += 1
        
        # 接続詞が多すぎる（5文に1回以上）と警告
        if conjunction_count / total_sentences > 0.2:
            warnings.append({
                'type': '接続詞の過剰使用',
                'count': conjunction_count,
                'rate': f'{conjunction_count}/{total_sentences}文'
            })
        
        # 4. 平均文長の確認
        avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0
        
        status = 'pass'
        if len(issues) > 0:
            status = 'warning'
        if len(issues) > 3:
            status = 'fail'
        
        naturalness_score = 100
        naturalness_score -= len(issues) * 10
        naturalness_score -= len(warnings) * 5
        naturalness_score = max(0, naturalness_score)
        
        return {
            'status': status,
            'score': naturalness_score,
            'issues': issues[:5],
            'warnings': warnings[:5],
            'issue_count': len(issues),
            'warning_count': len(warnings),
            'avg_sentence_length': round(avg_sentence_length, 1),
            'message': f"自然さスコア: {naturalness_score}/100, 問題: {len(issues)}件, 警告: {len(warnings)}件"
        }
    
    def _check_exam_relevance(self, passage: Dict) -> Dict:
        """受験英語の出題傾向との適合性をチェック"""
        theme = passage.get('theme', '')
        title = passage.get('title', '')
        level = passage.get('level', 'unknown')
        
        # 高校受験の頻出テーマ
        exam_themes = {
            '頻出度★★★': {
                'keywords': ['環境', '科学', '技術', '学校', '教育', '国際', '社会', 'environment', 
                           'science', 'technology', 'school', 'education', 'international'],
                'topics': ['環境問題', '地球温暖化', 'リサイクル', 'AI', 'ロボット', '国際交流', 
                          '異文化理解', 'SDGs', '持続可能']
            },
            '頻出度★★': {
                'keywords': ['健康', 'スポーツ', '食', '職業', '将来', '日常', 'health', 'sport', 
                           'food', 'career', 'daily'],
                'topics': ['食生活', '運動', '健康習慣', '夢', 'キャリア', '家族', '友人']
            },
            '頻出度★': {
                'keywords': ['歴史', '文化', '旅行', '地理', 'history', 'culture', 'travel'],
                'topics': ['伝統', '文化遺産', '観光', '地域']
            }
        }
        
        # テーマとの適合性チェック
        theme_matches = []
        for frequency, data in exam_themes.items():
            for keyword in data['keywords']:
                if keyword.lower() in theme.lower() or keyword.lower() in title.lower():
                    theme_matches.append({
                        'frequency': frequency,
                        'keyword': keyword
                    })
            for topic in data['topics']:
                if topic in theme or topic in title:
                    theme_matches.append({
                        'frequency': frequency,
                        'topic': topic
                    })
        
        # 受験英語に適した文法事項の確認
        grammar_points = {
            'beginner': ['現在形', '過去形', '未来形', '進行形', '基本的な接続詞'],
            'intermediate': ['現在完了形', '受動態', '関係代名詞', '不定詞', '動名詞', '比較'],
            'advanced': ['過去完了形', '仮定法', '分詞構文', '関係副詞', '強調構文']
        }
        
        expected_grammar = grammar_points.get(level, [])
        
        # 出題形式との適合性
        exam_formats = {
            'beginner': {
                'ideal_length': (500, 800),
                'topics': ['日常生活', '学校', '友人', '家族', '趣味'],
                'description': '基本的な語彙と文法、身近なテーマ'
            },
            'intermediate': {
                'ideal_length': (800, 3000),
                'topics': ['環境', '科学技術', '健康', '異文化', '将来'],
                'description': '社会的なテーマ、抽象的な内容を含む'
            },
            'advanced': {
                'ideal_length': (2800, 3200),
                'topics': ['持続可能性', 'グローバル化', 'AI', '社会問題', '倫理'],
                'description': '複雑な社会問題、高度な論理展開'
            }
        }
        
        format_info = exam_formats.get(level, exam_formats['intermediate'])
        
        # スコアリング
        relevance_score = 70  # 基本スコア
        
        if theme_matches:
            # 頻出度に応じて加点
            for match in theme_matches:
                if match['frequency'] == '頻出度★★★':
                    relevance_score += 10
                elif match['frequency'] == '頻出度★★':
                    relevance_score += 7
                else:
                    relevance_score += 5
        
        relevance_score = min(100, relevance_score)
        
        status = 'pass'
        if relevance_score < 70:
            status = 'warning'
        if relevance_score < 50:
            status = 'fail'
        
        recommendations = []
        if not theme_matches:
            recommendations.append('受験頻出テーマとの関連性を強化することを推奨')
        if relevance_score < 80:
            recommendations.append(f'{level}レベルの典型的な出題テーマ: {", ".join(format_info["topics"][:3])}')
        
        return {
            'status': status,
            'score': relevance_score,
            'theme_matches': theme_matches[:5],
            'match_count': len(theme_matches),
            'expected_grammar': expected_grammar,
            'format_info': format_info,
            'recommendations': recommendations,
            'message': f"受験適合度: {relevance_score}/100, テーマ一致: {len(theme_matches)}件"
        }
    
    def _check_comprehension_suitability(self, passage: Dict) -> Dict:
        """読解問題適性をチェック"""
        text = ' '.join([' '.join(p.get('words', [])) for p in passage.get('phrases', [])])
        text_lower = text.lower()
        
        # 論理展開要素の検出
        logical_elements = {
            '因果関係': ['because', 'so', 'therefore', 'thus', 'as a result', 'consequently'],
            '対比': ['but', 'however', 'although', 'while', 'on the other hand', 'in contrast'],
            '時系列': ['first', 'then', 'next', 'after', 'before', 'finally', 'when', 'while'],
            '例示': ['for example', 'such as', 'like', 'including'],
            '追加': ['also', 'too', 'and', 'moreover', 'furthermore', 'in addition']
        }
        
        detected_elements = {}
        for element_type, markers in logical_elements.items():
            found = [m for m in markers if m in text_lower]
            if found:
                detected_elements[element_type] = found
        
        # 疑問文の検出（推測問題を作りやすい）
        question_markers = text.count('?')
        
        # 主観表現の検出（意見と事実の区別問題）
        subjective_markers = ['think', 'believe', 'feel', 'hope', 'want', 'wish', 'should', 'must']
        subjective_count = sum(1 for marker in subjective_markers if marker in text_lower)
        
        # 対話文の検出（人物理解問題）
        dialogue_markers = text.count('"') + text.count('"') + text.count('"')
        has_dialogue = dialogue_markers >= 2
        
        # スコア計算
        score = 0
        score += len(detected_elements) * 15  # 論理要素の種類
        score += min(20, question_markers * 10)  # 疑問文
        score += min(15, subjective_count * 3)  # 主観表現
        if has_dialogue:
            score += 15  # 対話文
        score = min(100, score + 20)  # ベーススコア20
        
        status = 'pass' if score >= 70 else 'warning' if score >= 50 else 'fail'
        
        features = []
        if detected_elements:
            features.append(f"論理展開要素: {', '.join(detected_elements.keys())}")
        if question_markers > 0:
            features.append(f"疑問文: {question_markers}個")
        if subjective_count > 0:
            features.append(f"主観表現: {subjective_count}個所")
        if has_dialogue:
            features.append("対話文あり")
        
        return {
            'status': status,
            'score': score,
            'detected_elements': detected_elements,
            'question_count': question_markers,
            'subjective_count': subjective_count,
            'has_dialogue': has_dialogue,
            'features': features,
            'message': f"読解適性: {score}/100, 検出要素: {len(detected_elements)}種類"
        }
    
    def _check_educational_validity(self, passage: Dict) -> Dict:
        """教育的妥当性をチェック"""
        text = ' '.join([' '.join(p.get('words', [])) for p in passage.get('phrases', [])])
        text_lower = text.lower()
        theme = passage.get('theme', '')
        level = passage.get('level', '')
        
        issues = []
        
        # 年齢不適切な表現のチェック
        inappropriate_topics = {
            'violence': ['kill', 'murder', 'weapon', 'war', 'fight', 'blood'],
            'adult_content': ['alcohol', 'cigarette', 'smoking', 'drink beer', 'wine'],
            'negative': ['hate', 'stupid', 'idiot', 'ugly', 'terrible']
        }
        
        for topic_type, words in inappropriate_topics.items():
            found = [w for w in words if w in text_lower]
            if found:
                issues.append(f"年齢不適切な可能性: {topic_type} ({', '.join(found)})")
        
        # ステレオタイプ表現のチェック
        stereotype_patterns = [
            (r'\bgirls? (?:like|love|prefer) (?:pink|dolls?|dresses?)', '性別ステレオタイプ'),
            (r'\bboys? (?:like|love|prefer) (?:blue|cars?|sports?)', '性別ステレオタイプ'),
            (r'\b(?:all|every) (?:Japanese|Chinese|American)', '文化的ステレオタイプ')
        ]
        
        for pattern, issue_type in stereotype_patterns:
            if re.search(pattern, text_lower):
                issues.append(issue_type)
        
        # ポジティブ要素のチェック
        positive_elements = {
            'learning': ['learn', 'study', 'understand', 'discover', 'find out'],
            'cooperation': ['together', 'help', 'share', 'team', 'friend'],
            'growth': ['grow', 'improve', 'better', 'try', 'practice']
        }
        
        found_positive = {}
        for element_type, words in positive_elements.items():
            found = [w for w in words if w in text_lower]
            if found:
                found_positive[element_type] = found
        
        # スコア計算
        score = 100
        score -= len(issues) * 20  # 問題あるごとに-20
        score += len(found_positive) * 10  # ポジティブ要素で+10
        score = max(0, min(100, score))
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        strengths = []
        if found_positive:
            strengths.append(f"教育的価値: {', '.join(found_positive.keys())}")
        if not issues:
            strengths.append("年齢適合性: 問題なし")
        
        return {
            'status': status,
            'score': score,
            'issues': issues,
            'positive_elements': found_positive,
            'strengths': strengths,
            'message': f"教育的妥当性: {score}/100, 問題: {len(issues)}件"
        }
    
    def _check_paragraph_structure(self, passage: Dict) -> Dict:
        """段落構造をチェック"""
        text = ' '.join([' '.join(p.get('words', [])) for p in passage.get('phrases', [])])
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        
        # 論理マーカーの検出
        discourse_markers = {
            '導入': ['first', 'at first', 'to begin with', 'one day', 'once'],
            '展開': ['then', 'next', 'after that', 'later', 'soon'],
            '対比': ['but', 'however', 'although', 'on the other hand'],
            '因果': ['because', 'so', 'therefore', 'as a result'],
            '結論': ['finally', 'in conclusion', 'at last', 'in the end']
        }
        
        detected_markers = {}
        for marker_type, markers in discourse_markers.items():
            found = []
            for sentence in sentences:
                sentence_lower = sentence.lower()
                for marker in markers:
                    if marker in sentence_lower:
                        found.append(marker)
            if found:
                detected_markers[marker_type] = list(set(found))
        
        # 文の長さの分析
        sentence_lengths = [len(s.split()) for s in sentences]
        avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0
        
        # 段落推定（改行がない場合は文の長さで推定）
        estimated_paragraphs = max(3, len(sentences) // 5)
        
        # トピック文の推定（最初の文、接続詞で始まる文）
        topic_sentences = 0
        for i, sentence in enumerate(sentences[:10]):  # 最初の10文を確認
            sentence_lower = sentence.lower()
            if i == 0 or any(sentence_lower.startswith(m) for m in ['first', 'second', 'also', 'another', 'finally']):
                topic_sentences += 1
        
        # スコア計算
        score = 0
        score += len(detected_markers) * 15  # 論理マーカーの種類
        score += min(20, topic_sentences * 5)  # トピック文
        if 10 <= avg_sentence_length <= 20:
            score += 20  # 適切な文の長さ
        elif 8 <= avg_sentence_length <= 25:
            score += 10
        if estimated_paragraphs >= 3:
            score += 15  # 段落構成
        score = min(100, score + 20)  # ベーススコア20
        
        status = 'pass' if score >= 70 else 'warning' if score >= 50 else 'fail'
        
        structure_features = []
        if detected_markers:
            structure_features.append(f"論理マーカー: {', '.join(detected_markers.keys())}")
        structure_features.append(f"平均文長: {avg_sentence_length:.1f}語")
        structure_features.append(f"推定段落数: {estimated_paragraphs}")
        structure_features.append(f"トピック文: {topic_sentences}個")
        
        return {
            'status': status,
            'score': score,
            'detected_markers': detected_markers,
            'avg_sentence_length': avg_sentence_length,
            'estimated_paragraphs': estimated_paragraphs,
            'topic_sentences': topic_sentences,
            'structure_features': structure_features,
            'message': f"段落構造: {score}/100, 論理マーカー: {len(detected_markers)}種類"
        }
    
    def _calculate_overall_score(self, checks: Dict) -> Dict:
        """総合評価を計算"""
        statuses = [check['status'] for check in checks.values()]
        
        fail_count = statuses.count('fail')
        warning_count = statuses.count('warning')
        pass_count = statuses.count('pass')
        
        if fail_count > 0:
            overall_status = 'fail'
            overall_message = f"検証失敗: {fail_count}件の重大な問題"
        elif warning_count > 2:
            overall_status = 'warning'
            overall_message = f"要注意: {warning_count}件の警告"
        else:
            overall_status = 'pass'
            overall_message = "全てのチェックに合格"
        
        return {
            'status': overall_status,
            'pass': pass_count,
            'warning': warning_count,
            'fail': fail_count,
            'message': overall_message
        }
    
    def print_validation_report(self, results: Dict):
        """検証レポートを表示"""
        print(f"\n{'='*80}")
        print(f"検証レポート: {results['title']} ({results['passage_id']})")
        print(f"難易度: {results['level']}")
        print(f"{'='*80}")
        
        # 総合評価
        overall = results['overall']
        status_symbol = {
            'pass': '✅',
            'warning': '⚠️',
            'fail': '❌'
        }
        print(f"\n総合評価: {status_symbol[overall['status']]} {overall['message']}")
        print(f"  合格: {overall['pass']}, 警告: {overall['warning']}, 失敗: {overall['fail']}")
        
        # 各チェック結果
        for check_name, check_result in results['checks'].items():
            status = check_result['status']
            message = check_result['message']
            print(f"\n{status_symbol[status]} {check_name}: {message}")
            
            # 詳細情報
            if check_name == 'vocabulary_level':
                if check_result['violation_count'] > 0:
                    print(f"  違反例:")
                    for v in check_result['violations'][:5]:
                        lemma_info = f" (原形: {v['lemma']})" if v.get('lemma') != v['word'].lower() else ""
                        print(f"    - {v['word']}{lemma_info} → {v['actual_level']}: {v['meaning']}")
                if check_result['unknown_count'] > 0:
                    print(f"  未登録語の例 (原形変換後もCSVに未登録):")
                    for detail in check_result.get('unknown_words_detail', [])[:10]:
                        print(f"    - {detail['original']} (原形候補: {detail['lemma']})")
            
            elif check_name == 'chunk_length':
                if check_result['too_short_count'] > 0:
                    print(f"  短すぎるチャンク: {check_result['too_short_count']}件")
                if check_result['too_long_count'] > 0:
                    print(f"  長すぎるチャンク: {check_result['too_long_count']}件")
            
            elif check_name == 'category_balance':
                print(f"  主要カテゴリ:")
                for cat, count, pct in check_result['top_categories'][:3]:
                    print(f"    - {cat}: {count}語 ({pct:.1f}%)")
            
            elif check_name == 'naturalness':
                print(f"  自然さスコア: {check_result['score']}/100")
                if check_result['issue_count'] > 0:
                    print(f"  問題点: {check_result['issue_count']}件")
                    for issue in check_result['issues'][:3]:
                        print(f"    - {issue['type']}: {issue.get('issue', issue.get('sentence', ''))}")
            
            elif check_name == 'exam_relevance':
                print(f"  受験適合度: {check_result['score']}/100")
                if check_result['theme_matches']:
                    print(f"  一致したテーマ:")
                    for match in check_result['theme_matches'][:3]:
                        print(f"    - {match['frequency']}: {match.get('keyword', match.get('topic', ''))}")
                if check_result['recommendations']:
                    print(f"  推奨事項:")
                    for rec in check_result['recommendations']:
                        print(f"    • {rec}")
            
            elif check_name == 'comprehension_suitability':
                print(f"  読解適性スコア: {check_result['score']}/100")
                if check_result['features']:
                    print(f"  検出された特徴:")
                    for feature in check_result['features']:
                        print(f"    - {feature}")
            
            elif check_name == 'educational_validity':
                print(f"  教育的妥当性スコア: {check_result['score']}/100")
                if check_result['strengths']:
                    print(f"  強み:")
                    for strength in check_result['strengths']:
                        print(f"    - {strength}")
                if check_result['issues']:
                    print(f"  要改善:")
                    for issue in check_result['issues']:
                        print(f"    - {issue}")
            
            elif check_name == 'paragraph_structure':
                print(f"  段落構造スコア: {check_result['score']}/100")
                if check_result['structure_features']:
                    print(f"  構造的特徴:")
                    for feature in check_result['structure_features']:
                        print(f"    - {feature}")

def validate_json_file(json_path: str):
    """JSONファイルを検証"""
    validator = PassageValidator()
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 単一パッセージまたはパッセージの配列に対応
    passages = data if isinstance(data, list) else [data]
    
    all_results = []
    for passage in passages:
        results = validator.validate_passage(passage)
        validator.print_validation_report(results)
        all_results.append(results)
    
    # サマリー
    print(f"\n{'='*80}")
    print(f"検証サマリー: {len(all_results)}パッセージ")
    print(f"{'='*80}")
    
    status_counts = Counter([r['overall']['status'] for r in all_results])
    print(f"✅ 合格: {status_counts['pass']}")
    print(f"⚠️  警告: {status_counts['warning']}")
    print(f"❌ 失敗: {status_counts['fail']}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python3 validate_passages.py <json_file_path>")
        print("\n例:")
        print("  python3 validate_passages.py public/data/passages-comprehensive.json")
        print("  python3 validate_passages.py prototype/beginner-1.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    try:
        validate_json_file(json_file)
    except FileNotFoundError:
        print(f"エラー: ファイルが見つかりません: {json_file}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"エラー: 無効なJSONファイル: {json_file}")
        sys.exit(1)
