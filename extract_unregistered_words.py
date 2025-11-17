#!/usr/bin/env python3
"""
未登録語彙を抽出して分析するスクリプト
パッセージ内の全単語をCSVと照合し、未登録の単語を特定
"""

import json
import csv
import re
from collections import defaultdict, Counter
from pathlib import Path

class UnregisteredWordExtractor:
    """未登録語彙の抽出と分析"""
    
    def __init__(self, csv_path="public/data/junior-high-entrance-words.csv"):
        self.csv_path = csv_path
        self.registered_words = set()
        self.load_csv()
    
    def load_csv(self):
        """CSVから登録済み語彙を読み込み"""
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                word = row['語句'].lower()
                self.registered_words.add(word)
        print(f"✓ CSV登録語彙数: {len(self.registered_words)}語")
    
    def normalize_word(self, word):
        """単語を正規化（小文字化、記号除去）"""
        # 小文字化
        word = word.lower()
        # アポストロフィ付き単語の処理
        word = word.replace("'", "")
        # 記号を除去
        word = re.sub(r'[^\w]', '', word)
        return word
    
    def get_base_form_candidates(self, word):
        """基本形の候補を生成"""
        word = word.lower()
        candidates = [word]
        
        # 過去形・過去分詞の推測
        if word.endswith('ed'):
            candidates.append(word[:-2])  # played -> play
            candidates.append(word[:-1])  # liked -> like
            if word.endswith('ied'):
                candidates.append(word[:-3] + 'y')  # studied -> study
        
        # 進行形の推測
        if word.endswith('ing'):
            candidates.append(word[:-3])  # playing -> play
            candidates.append(word[:-4])  # running -> run
            candidates.append(word[:-3] + 'e')  # making -> make
        
        # 三人称単数の推測
        if word.endswith('s'):
            candidates.append(word[:-1])  # plays -> play
            if word.endswith('es'):
                candidates.append(word[:-2])  # goes -> go
                candidates.append(word[:-2] + 'e')  # watches -> watch
            if word.endswith('ies'):
                candidates.append(word[:-3] + 'y')  # tries -> try
        
        # 比較級・最上級
        if word.endswith('er'):
            candidates.append(word[:-2])  # bigger -> big
            candidates.append(word[:-1])  # nicer -> nice
        if word.endswith('est'):
            candidates.append(word[:-3])  # biggest -> big
            candidates.append(word[:-2])  # nicest -> nice
        
        # 副詞形
        if word.endswith('ly'):
            candidates.append(word[:-2])  # quickly -> quick
        
        return candidates
    
    def is_registered(self, word):
        """単語がCSVに登録されているか確認"""
        word = self.normalize_word(word)
        
        # 数字や空文字は除外
        if not word or word.isdigit():
            return True
        
        # 直接一致
        if word in self.registered_words:
            return True
        
        # 基本形候補で確認
        for candidate in self.get_base_form_candidates(word):
            if candidate in self.registered_words:
                return True
        
        return False
    
    def extract_from_passage(self, passage_file):
        """パッセージから未登録語を抽出"""
        with open(passage_file, 'r', encoding='utf-8') as f:
            passage = json.load(f)
        
        passage_id = passage['id']
        level = passage['level']
        
        all_words = []
        for phrase in passage['phrases']:
            all_words.extend(phrase['words'])
        
        # 未登録語を特定
        unregistered = []
        for word in all_words:
            normalized = self.normalize_word(word)
            if normalized and not self.is_registered(word):
                unregistered.append(word)
        
        # 頻度カウント
        word_counts = Counter(unregistered)
        
        return {
            'passage_id': passage_id,
            'level': level,
            'total_words': len(all_words),
            'unique_words': len(set([self.normalize_word(w) for w in all_words])),
            'unregistered_words': dict(word_counts),
            'unregistered_count': len(unregistered),
            'unregistered_unique': len(word_counts)
        }
    
    def categorize_words(self, words):
        """未登録語をカテゴリ分類"""
        categories = {
            'function_words': [],  # 機能語（冠詞、代名詞、接続詞など）
            'common_verbs': [],    # 基本動詞
            'adjectives': [],      # 形容詞
            'adverbs': [],         # 副詞
            'nouns': [],           # 名詞
            'proper_nouns': [],    # 固有名詞
            'others': []           # その他
        }
        
        # 機能語リスト
        function_words = {
            'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'can', 'could', 'may', 'might', 'must', 'shall',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their',
            'this', 'that', 'these', 'those',
            'and', 'or', 'but', 'if', 'when', 'where', 'why', 'how',
            'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from',
            'not', 'no', 'yes'
        }
        
        # 基本動詞
        basic_verbs = {
            'go', 'come', 'make', 'take', 'get', 'give', 'know', 'think',
            'see', 'look', 'want', 'need', 'use', 'find', 'tell', 'ask',
            'work', 'feel', 'try', 'leave', 'call', 'keep', 'let', 'begin',
            'seem', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'play',
            'run', 'move', 'live', 'believe', 'bring', 'happen', 'write',
            'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
            'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow',
            'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend',
            'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love',
            'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send',
            'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill',
            'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report'
        }
        
        for word in words:
            word_lower = self.normalize_word(word)
            
            # 固有名詞（大文字始まり）
            if word[0].isupper() and word_lower not in function_words:
                categories['proper_nouns'].append(word)
            # 機能語
            elif word_lower in function_words:
                categories['function_words'].append(word)
            # 基本動詞
            elif any(word_lower.startswith(v) for v in basic_verbs):
                categories['common_verbs'].append(word)
            # 副詞
            elif word_lower.endswith('ly'):
                categories['adverbs'].append(word)
            # その他
            else:
                categories['others'].append(word)
        
        return categories

def main():
    """メイン実行関数"""
    print("="*70)
    print("未登録語彙抽出ツール")
    print("="*70)
    
    extractor = UnregisteredWordExtractor()
    
    # 対象パッセージ
    passages = [
        "prototype/intermediate-3.json",
        "prototype/intermediate-4.json",
        "prototype/intermediate-5.json",
    ]
    
    all_results = []
    all_unregistered = []
    
    for passage_file in passages:
        if not Path(passage_file).exists():
            print(f"⚠️  {passage_file} が見つかりません")
            continue
        
        print(f"\n分析中: {passage_file}")
        result = extractor.extract_from_passage(passage_file)
        all_results.append(result)
        all_unregistered.extend(result['unregistered_words'].keys())
        
        print(f"  総語数: {result['total_words']}語")
        print(f"  ユニーク語数: {result['unique_words']}語")
        print(f"  未登録語出現: {result['unregistered_count']}回")
        print(f"  未登録ユニーク: {result['unregistered_unique']}語")
    
    # 全体の未登録語を集計
    print("\n" + "="*70)
    print("全体サマリー")
    print("="*70)
    
    all_unregistered_counter = Counter(all_unregistered)
    print(f"\n未登録語総数（重複含む）: {len(all_unregistered)}回")
    print(f"未登録語ユニーク数: {len(all_unregistered_counter)}語")
    
    # カテゴリ分類
    print("\n" + "-"*70)
    print("カテゴリ別分類")
    print("-"*70)
    
    categories = extractor.categorize_words(list(all_unregistered_counter.keys()))
    
    for category, words in categories.items():
        if words:
            print(f"\n【{category}】 ({len(words)}語)")
            word_list = sorted(set([extractor.normalize_word(w) for w in words]))[:20]
            print(f"  {', '.join(word_list)}")
            if len(set(words)) > 20:
                print(f"  ... 他{len(set(words)) - 20}語")
    
    # 頻出未登録語トップ30
    print("\n" + "-"*70)
    print("頻出未登録語 TOP 30")
    print("-"*70)
    
    for word, count in all_unregistered_counter.most_common(30):
        print(f"  {word:20s} : {count:3d}回")
    
    # 結果をJSONファイルに保存
    output_file = "public/data/unregistered-words-analysis.json"
    output_data = {
        "generated_at": "2025-11-17",
        "total_passages": len(all_results),
        "total_unregistered_occurrences": len(all_unregistered),
        "unique_unregistered_words": len(all_unregistered_counter),
        "passages": all_results,
        "top_50_unregistered": [
            {"word": word, "count": count} 
            for word, count in all_unregistered_counter.most_common(50)
        ],
        "categorized": {
            category: sorted(set([extractor.normalize_word(w) for w in words]))
            for category, words in categories.items() if words
        }
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 分析結果を保存: {output_file}")
    print("\n次のステップ:")
    print("1. unregistered-words-analysis.json を確認")
    print("2. 機能語や基本単語をCSVに追加するか検討")
    print("3. 固有名詞や専門用語は除外を検討")

if __name__ == '__main__':
    main()
