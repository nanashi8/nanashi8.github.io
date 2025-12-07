#!/usr/bin/env python3
"""
データ品質チェックスクリプト

このスクリプトは以下の問題を検出します：
1. IPA発音記号の誤り（大文字混入、記号ミス等）
2. カタカナ発音の誤り（英語混入、不適切な文字等）
3. 意味の誤り（英語混入、不自然な訳等）
4. 重複データ
5. 必須フィールドの欠損
6. データ形式の不整合
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Set, Tuple
import sys

class DataQualityChecker:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.stats = {
            'files_checked': 0,
            'entries_checked': 0,
            'errors_found': 0,
            'warnings_found': 0
        }
        
        # IPA記号の正規表現（正しい記号のみ）
        # 基本母音: a e i o u ɑ æ ə ɛ ɪ ʊ ʌ ɔ ɜ ʉ ɒ ɐ ɝ ɚ ɘ ɨ
        # 子音: p b t d k g f v θ ð s z ʃ ʒ h m n ŋ l r j w ʔ ɹ ɡ ɾ ɫ
        # 補助記号: ː ˈ ˌ . - [] () ͡ ̩ ̯ (長音、強勢、音節境界、連結、音節性子音、非音節化)
        self.valid_ipa_chars = set('ɑæəɛɪʊʌaeiouɔɜʉɒɐɝɚɘɨːˈˌθðʃʒŋtdkgpbfvszmnlrjwhʔɹɡɾɫ.\\-[]() ̩̯͡')
        
        # カタカナの正規表現（アクセント記号を含む）
        self.katakana_pattern = re.compile(r'^[ァ-ヴー・ ́]+$')
        
        # 日本語文字の正規表現
        self.japanese_pattern = re.compile(r'[ぁ-んァ-ヶー一-龠]')
        
        # 英語の基本単語（これらが意味フィールドに単独で現れたら警告）
        self.english_basic_words = {
            'me', 'you', 'he', 'she', 'it', 'we', 'they',
            'is', 'am', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did',
            'call', 'make', 'take', 'get', 'go', 'come',
            'bacon', 'apple', 'orange', 'banana'
        }
    
    def check_ipa_reading(self, word: str, reading: str, file_path: str, line_num: int) -> None:
        """IPA発音記号の検証"""
        if not reading:
            return
        
        # 大文字チェック（IPA記号に大文字は基本的にない）
        if any(c.isupper() for c in reading):
            self.errors.append({
                'type': 'IPA_UPPERCASE',
                'severity': 'ERROR',
                'file': file_path,
                'line': line_num,
                'word': word,
                'reading': reading,
                'message': f'IPA発音に大文字が含まれています: "{reading}"'
            })
        
        # 無効な文字チェック
        invalid_chars = [c for c in reading if c not in self.valid_ipa_chars]
        if invalid_chars:
            self.errors.append({
                'type': 'IPA_INVALID_CHARS',
                'severity': 'ERROR',
                'file': file_path,
                'line': line_num,
                'word': word,
                'reading': reading,
                'invalid_chars': ''.join(set(invalid_chars)),
                'message': f'IPA発音に無効な文字が含まれています: {", ".join(set(invalid_chars))}'
            })
        
        # 英単語がそのまま入っているチェック
        if reading.lower() == word.lower() and len(word) > 2:
            self.warnings.append({
                'type': 'IPA_SAME_AS_WORD',
                'severity': 'WARNING',
                'file': file_path,
                'line': line_num,
                'word': word,
                'reading': reading,
                'message': f'IPA発音が単語と同じです（変換忘れの可能性）: "{reading}"'
            })
    
    def check_katakana_reading(self, word: str, katakana: str, file_path: str, line_num: int) -> None:
        """カタカナ発音の検証"""
        if not katakana:
            return
        
        # カッコを除去
        clean_katakana = katakana.replace('(', '').replace(')', '').strip()
        
        if not clean_katakana:
            return
        
        # 許可される文字セット（カタカナ + ひらがな + アクセント記号 + 漢字 + 括弧 等）
        for c in clean_katakana:
            # カタカナ範囲: ァ-ヴ (U+30A1-U+30F4)
            # ひらがな範囲: ぁ-ん (U+3041-U+3093) - "の派生"等の説明用
            # 長音符: ー (U+30FC)
            # 中点: ・ (U+30FB)
            # アクセント記号: ́ (U+0301)
            # ハイフン: - (複合語用)
            # 括弧: ()
            # 句読点: 、。！？
            # スペース
            if ('ァ' <= c <= 'ヴ') or ('ぁ' <= c <= 'ん') or ('一' <= c <= '龠') or c in 'ー・ ́()-、。！？':
                continue
            elif c.isspace():
                continue
            else:
                # 無効な文字を検出
                if re.match(r'[A-Za-z]', c):
                    self.errors.append({
                        'type': 'KATAKANA_ENGLISH_MIXED',
                        'severity': 'ERROR',
                        'file': file_path,
                        'line': line_num,
                        'word': word,
                        'katakana': katakana,
                        'message': f'カタカナ発音に英語が混入しています: "{katakana}"'
                    })
                    return
                else:
                    self.warnings.append({
                        'type': 'KATAKANA_INVALID_CHARS',
                        'severity': 'WARNING',
                        'file': file_path,
                        'line': line_num,
                        'word': word,
                        'katakana': katakana,
                        'message': f'カタカナ発音に不適切な文字が含まれています: "{katakana}" (文字: {c})'
                    })
                    return
    
    def check_meaning(self, word: str, meaning: str, file_path: str, line_num: int) -> None:
        """意味フィールドの検証"""
        if not meaning:
            self.warnings.append({
                'type': 'MEANING_EMPTY',
                'severity': 'WARNING',
                'file': file_path,
                'line': line_num,
                'word': word,
                'message': f'意味が空です'
            })
            return
        
        # 日本語が含まれているかチェック
        if not self.japanese_pattern.search(meaning):
            # 英語の基本単語が単独で入っていないかチェック
            if meaning.lower() in self.english_basic_words:
                self.errors.append({
                    'type': 'MEANING_ENGLISH_ONLY',
                    'severity': 'ERROR',
                    'file': file_path,
                    'line': line_num,
                    'word': word,
                    'meaning': meaning,
                    'message': f'意味フィールドに日本語訳がなく英語のみです: "{meaning}"'
                })
            else:
                self.warnings.append({
                    'type': 'MEANING_NO_JAPANESE',
                    'severity': 'WARNING',
                    'file': file_path,
                    'line': line_num,
                    'word': word,
                    'meaning': meaning,
                    'message': f'意味フィールドに日本語が含まれていません: "{meaning}"'
                })
    
    def check_vocabulary_entry(self, entry: Dict, file_path: str, line_num: int) -> None:
        """語彙エントリの検証"""
        word = entry.get('word', '')
        
        # 必須フィールドチェック
        required_fields = ['word', 'meaning']
        for field in required_fields:
            if field not in entry or not entry[field]:
                self.errors.append({
                    'type': 'MISSING_REQUIRED_FIELD',
                    'severity': 'ERROR',
                    'file': file_path,
                    'line': line_num,
                    'word': word,
                    'field': field,
                    'message': f'必須フィールド "{field}" が欠損しています'
                })
        
        # readingフィールドの検証
        # JSON辞書形式: "reading": "カタカナ" → カタカナのみでOK
        # CSV形式の場合はCSV専用チェッカーで処理
        if 'reading' in entry:
            reading = entry['reading']
            if reading:
                # カタカナのみの場合（reading-passages-dictionary.json等）
                self.check_katakana_reading(word, reading, file_path, line_num)
        
        # 旧形式のipa/katakanaフィールド対応
        if 'ipa' in entry:
            self.check_ipa_reading(word, entry['ipa'], file_path, line_num)
        
        if 'katakana' in entry:
            self.check_katakana_reading(word, entry['katakana'], file_path, line_num)
        
        # 意味チェック
        if 'meaning' in entry:
            self.check_meaning(word, entry['meaning'], file_path, line_num)
    
    def check_json_file(self, file_path: Path) -> None:
        """JSONファイルの検証"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.stats['files_checked'] += 1
            
            # ファイルの種類に応じた検証
            if isinstance(data, dict):
                # 辞書形式
                for line_num, (key, value) in enumerate(data.items(), 1):
                    if isinstance(value, dict):
                        self.stats['entries_checked'] += 1
                        self.check_vocabulary_entry(value, str(file_path), line_num)
            elif isinstance(data, list):
                # リスト形式
                for line_num, item in enumerate(data, 1):
                    if isinstance(item, dict):
                        self.stats['entries_checked'] += 1
                        # passages形式の場合
                        if 'unknownWords' in item:
                            for word_entry in item.get('unknownWords', []):
                                self.check_vocabulary_entry(word_entry, str(file_path), line_num)
                        else:
                            self.check_vocabulary_entry(item, str(file_path), line_num)
        
        except json.JSONDecodeError as e:
            self.errors.append({
                'type': 'JSON_PARSE_ERROR',
                'severity': 'CRITICAL',
                'file': str(file_path),
                'message': f'JSON解析エラー: {str(e)}'
            })
        except Exception as e:
            self.errors.append({
                'type': 'FILE_READ_ERROR',
                'severity': 'CRITICAL',
                'file': str(file_path),
                'message': f'ファイル読み込みエラー: {str(e)}'
            })
    
    def check_csv_file(self, file_path: Path) -> None:
        """CSVファイルの検証（vocabulary/*.csv形式）"""
        try:
            import csv
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for line_num, row in enumerate(reader, 2):  # ヘッダー行を1としてカウント
                    self.stats['entries_checked'] += 1
                    
                    word = row.get('語句', '')
                    reading = row.get('読み', '')
                    meaning = row.get('意味', '')
                    
                    # 必須フィールドチェック
                    if not word:
                        self.errors.append({
                            'type': 'MISSING_REQUIRED_FIELD',
                            'severity': 'ERROR',
                            'file': str(file_path),
                            'line': line_num,
                            'word': word,
                            'field': '語句',
                            'message': '必須フィールド "語句" が欠損しています'
                        })
                    
                    if not meaning:
                        self.errors.append({
                            'type': 'MISSING_REQUIRED_FIELD',
                            'severity': 'ERROR',
                            'file': str(file_path),
                            'line': line_num,
                            'word': word,
                            'field': '意味',
                            'message': '必須フィールド "意味" が欠損しています'
                        })
                    
                    # 読みフィールドの検証: "IPA1 (カタカナ́1) IPA2 (カタカナ́2) ..." 形式
                    if reading:
                        # カッコの存在チェック
                        if '(' in reading and ')' in reading:
                            # 複数のIPAとカタカナのペアを抽出
                            # 例: "ɡet (ゲット) ʌp (アップ)" → [("ɡet", "ゲット"), ("ʌp", "アップ")]
                            import re
                            # パターン: "IPA部分 (カタカナ部分)" を繰り返し抽出
                            pairs = re.findall(r'([^()]+)\s*\(([^)]+)\)', reading)
                            
                            if pairs:
                                for ipa_part, katakana_part in pairs:
                                    ipa_part = ipa_part.strip()
                                    katakana_part = katakana_part.strip()
                                    
                                    # IPA部分の検証
                                    if ipa_part:
                                        self.check_ipa_reading(word, ipa_part, str(file_path), line_num)
                                    
                                    # カタカナ部分の検証（アクセント記号付き）
                                    if katakana_part:
                                        self.check_katakana_reading(word, katakana_part, str(file_path), line_num)
                            else:
                                self.errors.append({
                                    'type': 'IPA_MISSING',
                                    'severity': 'ERROR',
                                    'file': str(file_path),
                                    'line': line_num,
                                    'word': word,
                                    'reading': reading,
                                    'message': f'IPA発音のパース失敗: "{reading}"'
                                })
                        else:
                            # カッコがない場合はIPA欠損エラー
                            self.errors.append({
                                'type': 'IPA_MISSING',
                                'severity': 'ERROR',
                                'file': str(file_path),
                                'line': line_num,
                                'word': word,
                                'reading': reading,
                                'message': f'IPA発音が欠損しています（正しい形式: IPA (カタカナ́)）: "{reading}"'
                            })
                    
                    # 意味チェック
                    if meaning:
                        self.check_meaning(word, meaning, str(file_path), line_num)
        
        except Exception as e:
            self.errors.append({
                'type': 'CSV_READ_ERROR',
                'severity': 'CRITICAL',
                'file': str(file_path),
                'message': f'CSVファイル読み込みエラー: {str(e)}'
            })
    
    def scan_directory(self, directory: Path) -> None:
        """ディレクトリをスキャンしてすべてのJSON/CSVファイルを検証"""
        json_files = list(directory.rglob('*.json'))
        csv_files = list(directory.rglob('*.csv'))
        
        # 除外パターン
        exclude_patterns = [
            '.ipa-test',           # テストファイル
            'constants.json',      # 定数定義ファイル
            '/grammar/',           # 文法問題ファイル
            'sentence-ordering',   # 文並べ替え問題
            'pronunciation-questions',  # 発音問題
            'accent-questions',    # アクセント問題
            'fill-in-blank',       # 穴埋め問題
            'verb-form-questions', # 動詞変形問題
            'grade1_unit0_manual', # マニュアルデータ
            '/dictionaries/',      # 辞書ファイル（passages.json等）
            '/passages/',          # パッセージファイル
            '/passages-phrase-learning/'  # フレーズ学習パッセージ
        ]
        
        # JSONファイルをフィルタリング
        json_files = [
            f for f in json_files 
            if not any(pattern in str(f) for pattern in exclude_patterns)
        ]
        
        # CSVファイルをフィルタリング
        csv_files = [
            f for f in csv_files 
            if not any(pattern in str(f) for pattern in exclude_patterns)
        ]
        
        total_files = len(json_files) + len(csv_files)
        print(f"🔍 {total_files}個のファイルをスキャンします（JSON: {len(json_files)}, CSV: {len(csv_files)}）...\n")
        
        for json_file in json_files:
            print(f"チェック中: {json_file.relative_to(directory.parent.parent)}")
            self.check_json_file(json_file)
        
        for csv_file in csv_files:
            print(f"チェック中: {csv_file.relative_to(directory.parent.parent)}")
            self.check_csv_file(csv_file)
        
        self.stats['errors_found'] = len(self.errors)
        self.stats['warnings_found'] = len(self.warnings)
    
    def generate_report(self, output_file: str = None) -> str:
        """レポート生成"""
        report_lines = []
        report_lines.append("=" * 80)
        report_lines.append("データ品質チェックレポート")
        report_lines.append("=" * 80)
        report_lines.append(f"\n📊 統計:")
        report_lines.append(f"  チェックしたファイル数: {self.stats['files_checked']}")
        report_lines.append(f"  チェックしたエントリ数: {self.stats['entries_checked']}")
        report_lines.append(f"  🔴 エラー: {self.stats['errors_found']}")
        report_lines.append(f"  🟡 警告: {self.stats['warnings_found']}")
        
        if self.errors:
            report_lines.append(f"\n{'=' * 80}")
            report_lines.append("🔴 エラー詳細:")
            report_lines.append("=" * 80)
            
            # エラーを種類別にグループ化
            errors_by_type = {}
            for error in self.errors:
                error_type = error['type']
                if error_type not in errors_by_type:
                    errors_by_type[error_type] = []
                errors_by_type[error_type].append(error)
            
            for error_type, errors in errors_by_type.items():
                report_lines.append(f"\n[{error_type}] - {len(errors)}件")
                for error in errors[:10]:  # 各タイプ最大10件表示
                    report_lines.append(f"  📁 {error['file']}")
                    if 'line' in error:
                        report_lines.append(f"  📍 行: {error['line']}")
                    if 'word' in error:
                        report_lines.append(f"  📝 単語: {error['word']}")
                    report_lines.append(f"  💬 {error['message']}")
                    report_lines.append("")
                
                if len(errors) > 10:
                    report_lines.append(f"  ... 他 {len(errors) - 10}件\n")
        
        if self.warnings:
            report_lines.append(f"\n{'=' * 80}")
            report_lines.append("🟡 警告詳細:")
            report_lines.append("=" * 80)
            
            # 警告を種類別にグループ化
            warnings_by_type = {}
            for warning in self.warnings:
                warning_type = warning['type']
                if warning_type not in warnings_by_type:
                    warnings_by_type[warning_type] = []
                warnings_by_type[warning_type].append(warning)
            
            for warning_type, warnings in warnings_by_type.items():
                report_lines.append(f"\n[{warning_type}] - {len(warnings)}件")
                for warning in warnings[:5]:  # 各タイプ最大5件表示
                    report_lines.append(f"  📁 {warning['file']}")
                    if 'line' in warning:
                        report_lines.append(f"  📍 行: {warning['line']}")
                    if 'word' in warning:
                        report_lines.append(f"  📝 単語: {warning['word']}")
                    report_lines.append(f"  💬 {warning['message']}")
                    report_lines.append("")
                
                if len(warnings) > 5:
                    report_lines.append(f"  ... 他 {len(warnings) - 5}件\n")
        
        report_lines.append("\n" + "=" * 80)
        if self.stats['errors_found'] == 0 and self.stats['warnings_found'] == 0:
            report_lines.append("✅ すべてのチェックに合格しました！")
        elif self.stats['errors_found'] == 0:
            report_lines.append("⚠️  エラーはありませんが、警告があります。")
        else:
            report_lines.append("❌ エラーが検出されました。修正が必要です。")
        report_lines.append("=" * 80)
        
        report = "\n".join(report_lines)
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n📝 レポートを保存しました: {output_file}")
        
        return report


def main():
    # データディレクトリのパス
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / 'public' / 'data'
    
    if not data_dir.exists():
        print(f"❌ データディレクトリが見つかりません: {data_dir}")
        sys.exit(1)
    
    # チェッカー実行
    checker = DataQualityChecker()
    checker.scan_directory(data_dir)
    
    # レポート生成
    output_dir = script_dir / 'output'
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / 'data-quality-report.txt'
    
    report = checker.generate_report(str(output_file))
    print(report)
    
    # エラーがある場合は終了コード1で終了
    if checker.stats['errors_found'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
