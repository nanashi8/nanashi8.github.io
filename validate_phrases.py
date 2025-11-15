#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
熟語データ品質検証スクリプト
CSVファイルの品質をチェックし、問題点を報告する
"""

import sys
import csv
import re
from typing import List, Dict, Tuple
from collections import Counter

# カテゴリー定義
VALID_CATEGORIES = [
    "言語基本", "学校・学習", "日常生活", "人・社会", "自然・環境",
    "食・健康", "運動・娯楽", "場所・移動", "時間・数量", "科学・技術"
]

# 難易度定義
VALID_DIFFICULTIES = ["初級", "中級", "上級"]

# 必須フィールド
REQUIRED_FIELDS = ["語句", "読み", "意味", "語源等解説", "関連語", "関連分野", "難易度"]

# アクセント記号付き母音
ACCENT_VOWELS = ['ア́', 'イ́', 'ウ́', 'エ́', 'オ́']

class PhraseValidator:
    """熟語データのバリデーター"""
    
    def __init__(self, csv_file: str, existing_phrases: List[str] = None):
        self.csv_file = csv_file
        self.existing_phrases = set(existing_phrases) if existing_phrases else set()
        self.errors = []
        self.warnings = []
        self.info = []
        self.phrases = []
    
    def load_csv(self) -> bool:
        """CSVファイルを読み込む"""
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                # フィールド検証
                if not reader.fieldnames:
                    self.errors.append("ヘッダー行が見つかりません")
                    return False
                
                missing_fields = set(REQUIRED_FIELDS) - set(reader.fieldnames)
                if missing_fields:
                    self.errors.append(f"必須フィールドが不足: {', '.join(missing_fields)}")
                    return False
                
                self.phrases = list(reader)
                return True
        
        except FileNotFoundError:
            self.errors.append(f"ファイルが見つかりません: {self.csv_file}")
            return False
        except Exception as e:
            self.errors.append(f"ファイル読み込みエラー: {str(e)}")
            return False
    
    def validate_all(self) -> Tuple[int, int, int]:
        """すべての検証を実行"""
        if not self.load_csv():
            return 0, 0, 0
        
        for idx, phrase in enumerate(self.phrases, start=2):  # 2行目から（1行目はヘッダー）
            self._validate_phrase(phrase, idx)
        
        self._validate_duplicates()
        self._generate_statistics()
        
        return len(self.errors), len(self.warnings), len(self.info)
    
    def _validate_phrase(self, phrase: Dict, row_num: int):
        """個別の熟語データを検証"""
        
        # 1. 語句の検証
        word = phrase.get("語句", "").strip()
        if not word:
            self.errors.append(f"行{row_num}: 語句が空です")
        elif word.startswith("[TODO"):
            self.warnings.append(f"行{row_num}: 語句が未入力です（{word}）")
        elif not re.search(r'[a-zA-Z]', word):
            self.errors.append(f"行{row_num}: 語句に英字が含まれていません（{word}）")
        
        # 2. 読みの検証
        reading = phrase.get("読み", "").strip()
        if not reading:
            self.errors.append(f"行{row_num}: 読みが空です")
        elif reading.startswith("[TODO"):
            self.warnings.append(f"行{row_num}: 読みが未入力です")
        else:
            # アクセント記号のチェック
            has_accent = any(vowel in reading for vowel in ACCENT_VOWELS)
            if not has_accent:
                self.warnings.append(f"行{row_num}: 読みにアクセント記号がありません（{word}: {reading}）")
            
            # カタカナチェック
            if not re.match(r'^[ァ-ヴー́\s]+$', reading):
                self.errors.append(f"行{row_num}: 読みに不正な文字が含まれています（{reading}）")
        
        # 3. 意味の検証
        meaning = phrase.get("意味", "").strip()
        if not meaning:
            self.errors.append(f"行{row_num}: 意味が空です")
        elif meaning.startswith("[TODO"):
            self.warnings.append(f"行{row_num}: 意味が未入力です")
        elif len(meaning) < 3:
            self.warnings.append(f"行{row_num}: 意味が短すぎます（{word}: {meaning}）")
        
        # 4. 語源等解説の検証
        etymology = phrase.get("語源等解説", "").strip()
        if not etymology:
            self.errors.append(f"行{row_num}: 語源等解説が空です")
        elif etymology.startswith("[TODO"):
            self.warnings.append(f"行{row_num}: 語源等解説が未入力です")
        elif len(etymology) < 20:
            self.warnings.append(f"行{row_num}: 語源等解説が短すぎます（{word}）")
        elif "組み合わせ" not in etymology:
            self.info.append(f"行{row_num}: 語源解説に「組み合わせ」が含まれていません（{word}）")
        
        # 5. 関連語の検証
        related = phrase.get("関連語", "").strip()
        if not related:
            self.errors.append(f"行{row_num}: 関連語が空です")
        elif related.startswith("[TODO"):
            self.warnings.append(f"行{row_num}: 関連語が未入力です")
        else:
            # 関連語のフォーマットチェック（括弧が含まれているか）
            if "(" not in related or ")" not in related:
                self.warnings.append(f"行{row_num}: 関連語に読み仮名が含まれていません（{word}）")
            
            # カンマ区切りで2つ以上あるか
            items = [item.strip() for item in related.split(",")]
            if len(items) < 2:
                self.info.append(f"行{row_num}: 関連語は2つ以上推奨です（{word}）")
        
        # 6. カテゴリーの検証
        category = phrase.get("関連分野", "").strip()
        if not category:
            self.errors.append(f"行{row_num}: 関連分野が空です")
        elif category not in VALID_CATEGORIES:
            self.errors.append(f"行{row_num}: 無効な関連分野（{category}）")
        
        # 7. 難易度の検証
        difficulty = phrase.get("難易度", "").strip()
        if not difficulty:
            self.errors.append(f"行{row_num}: 難易度が空です")
        elif difficulty not in VALID_DIFFICULTIES:
            self.errors.append(f"行{row_num}: 無効な難易度（{difficulty}）")
    
    def _validate_duplicates(self):
        """重複チェック"""
        word_counts = Counter(phrase.get("語句", "").strip().lower() for phrase in self.phrases)
        duplicates = [(word, count) for word, count in word_counts.items() if count > 1]
        
        if duplicates:
            for word, count in duplicates:
                self.errors.append(f"語句の重複: '{word}' が{count}回出現")
        
        # 既存データとの重複チェック
        if self.existing_phrases:
            for phrase in self.phrases:
                word = phrase.get("語句", "").strip().lower()
                if word in self.existing_phrases:
                    self.errors.append(f"既存データと重複: '{word}'")
    
    def _generate_statistics(self):
        """統計情報を生成"""
        if not self.phrases:
            return
        
        # カテゴリー分布
        categories = Counter(phrase.get("関連分野", "") for phrase in self.phrases)
        self.info.append(f"\nカテゴリー分布:")
        for cat, count in categories.most_common():
            self.info.append(f"  {cat}: {count}件")
        
        # 難易度分布
        difficulties = Counter(phrase.get("難易度", "") for phrase in self.phrases)
        self.info.append(f"\n難易度分布:")
        for diff, count in difficulties.most_common():
            self.info.append(f"  {diff}: {count}件")
        
        # TODO件数
        todo_count = sum(1 for phrase in self.phrases 
                        if any("[TODO" in str(v) for v in phrase.values()))
        if todo_count > 0:
            self.warnings.append(f"\nTODO残り: {todo_count}件")
    
    def print_report(self):
        """検証結果を表示"""
        print("\n" + "=" * 70)
        print(f"  熟語データ品質検証レポート: {self.csv_file}")
        print("=" * 70)
        
        print(f"\n📊 基本情報")
        print(f"  総件数: {len(self.phrases)}件")
        
        # エラー
        if self.errors:
            print(f"\n❌ エラー ({len(self.errors)}件):")
            for error in self.errors[:20]:  # 最初の20件のみ表示
                print(f"  • {error}")
            if len(self.errors) > 20:
                print(f"  ... 他{len(self.errors) - 20}件")
        
        # 警告
        if self.warnings:
            print(f"\n⚠️  警告 ({len(self.warnings)}件):")
            for warning in self.warnings[:20]:
                print(f"  • {warning}")
            if len(self.warnings) > 20:
                print(f"  ... 他{len(self.warnings) - 20}件")
        
        # 情報
        if self.info:
            print(f"\nℹ️  情報:")
            for info in self.info:
                print(f"  {info}")
        
        # 総評
        print(f"\n{'='*70}")
        if not self.errors and not self.warnings:
            print("✅ 検証完了: 問題は見つかりませんでした")
        elif not self.errors:
            print(f"✅ エラーなし（警告 {len(self.warnings)}件）")
        else:
            print(f"❌ 検証失敗: {len(self.errors)}件のエラーがあります")
        print("=" * 70)

def load_existing_phrases(csv_file: str) -> List[str]:
    """既存の熟語リストを読み込む"""
    phrases = []
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            phrases = [row.get("語句", "").strip().lower() for row in reader if row.get("語句")]
    except FileNotFoundError:
        pass
    return phrases

def main():
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python3 validate_phrases.py <CSVファイル> [既存データファイル]")
        print("\n例:")
        print("  python3 validate_phrases.py phrases-template-言語基本-初級-20.csv")
        print("  python3 validate_phrases.py new-phrases.csv public/data/junior-high-entrance-words.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    existing_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # 既存データの読み込み
    existing_phrases = []
    if existing_file:
        print(f"既存データを読み込み中: {existing_file}")
        existing_phrases = load_existing_phrases(existing_file)
        print(f"  既存熟語数: {len(existing_phrases)}件\n")
    
    # 検証実行
    validator = PhraseValidator(csv_file, existing_phrases)
    error_count, warning_count, info_count = validator.validate_all()
    validator.print_report()
    
    # 終了コード
    if error_count > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
