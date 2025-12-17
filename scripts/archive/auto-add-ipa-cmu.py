#!/usr/bin/env python3
"""
CMU辞書ベースIPA発音自動追加スクリプト（改良版）

eng_to_ipaの代わりにCMU発音辞書を使用して高精度なIPA変換を実現。
カタカナのみの読みフィールドに、IPAを追加して「IPA (カタカナ)」形式に変換する。

特徴:
- CMU辞書: 125,000語以上をカバー（精度99%）
- ARPAbetからIPAへの正確な変換
- 未知語は元のeng_to_ipaでフォールバック

使用例:
  python3 scripts/auto-add-ipa-cmu.py
"""

import csv
import re
from pathlib import Path
from typing import Dict, List, Tuple
import sys

# NLTK CMU辞書
try:
    from nltk.corpus import cmudict
    cmu_dict = cmudict.dict()
    print(f"✅ CMU辞書: {len(cmu_dict)}語を読み込み")
except Exception as e:
    print(f"❌ CMU辞書の読み込みに失敗: {e}")
    print("実行: python -c \"import nltk; nltk.download('cmudict')\"")
    sys.exit(1)

# フォールバック用にeng_to_ipaも使用
try:
    import eng_to_ipa as ipa_converter
    HAS_ENG_TO_IPA = True
except ImportError:
    HAS_ENG_TO_IPA = False
    print("⚠️  eng_to_ipaが未インストール（CMU辞書のみ使用）")


class CMUIPAConverter:
    """CMU辞書を使ったIPA変換クラス"""
    
    # ARPAbet → IPA 変換マッピング（完全版）
    ARPABET_TO_IPA = {
        # 母音（ストレスマーカー付き）
        'AA': 'ɑ',   'AA0': 'ɑ',   'AA1': 'ɑ́',   'AA2': 'ɑ',
        'AE': 'æ',   'AE0': 'æ',   'AE1': 'ǽ',   'AE2': 'æ',
        'AH': 'ʌ',   'AH0': 'ə',   'AH1': 'ʌ́',   'AH2': 'ʌ',
        'AO': 'ɔ',   'AO0': 'ɔ',   'AO1': 'ɔ́',   'AO2': 'ɔ',
        'AW': 'aʊ',  'AW0': 'aʊ',  'AW1': 'áʊ',  'AW2': 'aʊ',
        'AY': 'aɪ',  'AY0': 'aɪ',  'AY1': 'áɪ',  'AY2': 'aɪ',
        'EH': 'ɛ',   'EH0': 'ɛ',   'EH1': 'ɛ́',   'EH2': 'ɛ',
        'ER': 'ɜr',  'ER0': 'ər',  'ER1': 'ɜ́r',  'ER2': 'ɜr',
        'EY': 'eɪ',  'EY0': 'eɪ',  'EY1': 'éɪ',  'EY2': 'eɪ',
        'IH': 'ɪ',   'IH0': 'ɪ',   'IH1': 'ɪ́',   'IH2': 'ɪ',
        'IY': 'i',   'IY0': 'i',   'IY1': 'í',   'IY2': 'i',
        'OW': 'oʊ',  'OW0': 'oʊ',  'OW1': 'óʊ',  'OW2': 'oʊ',
        'OY': 'ɔɪ',  'OY0': 'ɔɪ',  'OY1': 'ɔ́ɪ',  'OY2': 'ɔɪ',
        'UH': 'ʊ',   'UH0': 'ʊ',   'UH1': 'ʊ́',   'UH2': 'ʊ',
        'UW': 'u',   'UW0': 'u',   'UW1': 'ú',   'UW2': 'u',
        
        # 子音
        'B': 'b',    'CH': 'ʧ',   'D': 'd',    'DH': 'ð',
        'F': 'f',    'G': 'ɡ',    'HH': 'h',   'JH': 'ʤ',
        'K': 'k',    'L': 'l',    'M': 'm',    'N': 'n',
        'NG': 'ŋ',   'P': 'p',    'R': 'r',    'S': 's',
        'SH': 'ʃ',   'T': 't',    'TH': 'θ',   'V': 'v',
        'W': 'w',    'Y': 'j',    'Z': 'z',    'ZH': 'ʒ'
    }
    
    # ストレスマーカーなしのベース音素（フォールバック用）
    BASE_ARPABET = {
        'AA': 'ɑ', 'AE': 'æ', 'AH': 'ə', 'AO': 'ɔ', 'AW': 'aʊ', 'AY': 'aɪ',
        'EH': 'ɛ', 'ER': 'ər', 'EY': 'eɪ', 'IH': 'ɪ', 'IY': 'i', 'OW': 'oʊ',
        'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'u',
        'B': 'b', 'CH': 'ʧ', 'D': 'd', 'DH': 'ð', 'F': 'f', 'G': 'ɡ',
        'HH': 'h', 'JH': 'ʤ', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n',
        'NG': 'ŋ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ', 'T': 't',
        'TH': 'θ', 'V': 'v', 'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'
    }
    
    def __init__(self):
        self.stats = {
            'processed': 0,
            'cmu_success': 0,
            'fallback_success': 0,
            'skipped': 0,
            'errors': 0
        }
    
    def arpabet_to_ipa(self, arpabet_phones: List[str]) -> str:
        """ARPAbet音素リストをIPAに変換"""
        ipa_parts = []
        for phone in arpabet_phones:
            # 完全一致を優先
            if phone in self.ARPABET_TO_IPA:
                ipa_parts.append(self.ARPABET_TO_IPA[phone])
            else:
                # ストレスマーカーを除去してベース音素で検索
                base_phone = re.sub(r'[0-9]', '', phone)
                if base_phone in self.BASE_ARPABET:
                    ipa_parts.append(self.BASE_ARPABET[base_phone])
                else:
                    # 未知の音素（通常は発生しない）
                    print(f"      ⚠️  未知のARPAbet音素: {phone}")
                    ipa_parts.append(phone.lower())
        
        return ''.join(ipa_parts)
    
    def get_ipa_from_cmu(self, word: str) -> str:
        """CMU辞書からIPA発音を取得"""
        word_lower = word.lower()
        
        # 特殊文字を除去してCMU辞書を検索
        clean_word = re.sub(r'[^a-z]', '', word_lower)
        
        if clean_word in cmu_dict:
            # 複数の発音がある場合は最初のものを使用
            arpabet = cmu_dict[clean_word][0]
            ipa = self.arpabet_to_ipa(arpabet)
            self.stats['cmu_success'] += 1
            return ipa
        
        return ""
    
    def get_ipa_fallback(self, word: str) -> str:
        """フォールバック: eng_to_ipaを使用"""
        if not HAS_ENG_TO_IPA:
            return ""
        
        try:
            ipa_result = ipa_converter.convert(word)
            # アスタリスクがある場合は失敗
            if '*' not in ipa_result:
                self.stats['fallback_success'] += 1
                return ipa_result.strip()
        except Exception:
            pass
        
        return ""
    
    def get_ipa_pronunciation(self, word: str) -> str:
        """英単語からIPA発音を取得（CMU優先、フォールバック付き）"""
        # 1. CMU辞書を試す
        ipa = self.get_ipa_from_cmu(word)
        if ipa:
            return ipa
        
        # 2. eng_to_ipaでフォールバック
        ipa = self.get_ipa_fallback(word)
        if ipa:
            return ipa
        
        # 3. どちらも失敗
        self.stats['errors'] += 1
        return ""
    
    def process_csv_file(self, file_path: Path) -> int:
        """CSVファイルを処理してIPA発音を追加"""
        print(f"\n📁 処理中: {file_path.name}")
        
        rows = []
        modified_count = 0
        
        # ファイル読み込み
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            
            for row_num, row in enumerate(reader, start=2):
                # 日本語ヘッダー対応
                word = row.get('word', row.get('語句', '')).strip()
                reading = row.get('reading', row.get('読み', '')).strip()
                reading_field = '読み' if '読み' in row else 'reading'
                
                # 括弧がない場合（カタカナのみ）→ IPA追加
                if reading and '(' not in reading:
                    # IPA取得
                    ipa = self.get_ipa_pronunciation(word)
                    
                    if ipa:
                        # 「IPA (カタカナ)」形式に変換
                        new_reading = f"{ipa} ({reading})"
                        row[reading_field] = new_reading
                        modified_count += 1
                        print(f"  ✅ 行{row_num}: {word}")
                        print(f"      {reading} → {new_reading}")
                    else:
                        # IPA取得失敗
                        print(f"  ❌ 行{row_num}: {word} - IPA取得失敗")
                else:
                    # すでにIPAあり、またはreadingなし
                    self.stats['skipped'] += 1
                
                rows.append(row)
                self.stats['processed'] += 1
        
        # ファイル書き込み（変更があった場合のみ）
        if modified_count > 0:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            print(f"  💾 {modified_count}件のIPAを追加しました")
        else:
            print(f"  ⏭️  変更なし")
        
        return modified_count
    
    def process_all_files(self):
        """全CSVファイルを処理"""
        vocab_dir = Path("public/data/vocabulary")
        csv_files = sorted(vocab_dir.glob("*.csv"))
        
        print(f"🔍 対象ファイル: {len(csv_files)}件")
        
        total_modified = 0
        for csv_file in csv_files:
            modified = self.process_csv_file(csv_file)
            total_modified += modified
        
        # 統計表示
        print("\n" + "="*60)
        print("📊 処理結果:")
        print(f"  処理済み: {self.stats['processed']}件")
        print(f"  CMU辞書成功: {self.stats['cmu_success']}件")
        print(f"  フォールバック成功: {self.stats['fallback_success']}件")
        print(f"  スキップ: {self.stats['skipped']}件")
        print(f"  エラー: {self.stats['errors']}件")
        print(f"  成功率: {(self.stats['cmu_success'] + self.stats['fallback_success']) / max(1, self.stats['cmu_success'] + self.stats['fallback_success'] + self.stats['errors']) * 100:.1f}%")
        print("="*60)


def main():
    """メイン処理"""
    print("🚀 CMU辞書ベースIPA発音自動追加スクリプト（改良版）")
    print("="*60)
    
    converter = CMUIPAConverter()
    converter.process_all_files()
    
    print("\n✅ 完了")


if __name__ == "__main__":
    main()
