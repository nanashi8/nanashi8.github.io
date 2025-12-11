#!/usr/bin/env python3
"""
フレーズ訳の整合性検証スクリプト

passages-phrase-learning/*.json ファイル内のフレーズ訳が
実際の英文フレーズと適切に対応しているかを検証します。
"""

import json
from pathlib import Path
from typing import List, Dict, Tuple

# カラーコード
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class PhraseTranslationValidator:
    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.phrase_dir = base_path / 'public/data/passages-phrase-learning'
        self.errors = []
        self.warnings = []
        self.stats = {
            'total_files': 0,
            'total_phrases': 0,
            'empty_translations': 0,
            'short_translations': 0,
            'long_translations': 0,
            'missing_english': 0,
            'unnatural_japanese': 0,
            'particle_errors': 0,
            'style_inconsistency': 0,
            'redundant_expressions': 0,
            'inappropriate_vocabulary': 0,
            'question_mismatch': 0,
            'negation_mismatch': 0,
        }
    
    def validate_all(self) -> bool:
        """全JSONファイルを検証"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}フレーズ訳整合性検証{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        if not self.phrase_dir.exists():
            self.errors.append(f"❌ ディレクトリが見つかりません: {self.phrase_dir}")
            self.print_report()
            return False
        
        json_files = list(self.phrase_dir.glob('*.json'))
        self.stats['total_files'] = len(json_files)
        
        print(f"検証対象: {len(json_files)} ファイル\n")
        
        for json_file in sorted(json_files):
            self.validate_file(json_file)
        
        self.print_report()
        return len(self.errors) == 0
    
    def validate_file(self, json_path: Path):
        """個別JSONファイルを検証"""
        try:
            data = json.loads(json_path.read_text(encoding='utf-8'))
        except Exception as e:
            self.errors.append(f"❌ {json_path.name}: JSON読み込みエラー - {e}")
            return
        
        if 'phrases' not in data:
            self.errors.append(f"❌ {json_path.name}: 'phrases' フィールドがありません")
            return
        
        phrases = data['phrases']
        self.stats['total_phrases'] += len(phrases)
        
        file_errors = 0
        file_warnings = 0
        
        for phrase in phrases:
            phrase_id = phrase.get('id', '?')
            english = phrase.get('english', '')
            japanese = phrase.get('japanese', '')
            phrase_meaning = phrase.get('phraseMeaning', '')
            
            # 検証1: 英文フィールドの存在
            if not english:
                self.errors.append(f"❌ {json_path.name}: フレーズ#{phrase_id} - 英文が空です")
                self.stats['missing_english'] += 1
                file_errors += 1
                continue
            
            # 検証2: 日本語訳の存在
            if not japanese and not phrase_meaning:
                self.errors.append(f"❌ {json_path.name}: フレーズ#{phrase_id} - 日本語訳がありません")
                self.stats['empty_translations'] += 1
                file_errors += 1
                continue
            
            # 検証3: japanese と phraseMeaning の一致
            if japanese and phrase_meaning and japanese != phrase_meaning:
                self.warnings.append(
                    f"⚠️  {json_path.name}: フレーズ#{phrase_id} - "
                    f"japanese と phraseMeaning が異なります\n"
                    f"    japanese: {japanese}\n"
                    f"    phraseMeaning: {phrase_meaning}"
                )
                file_warnings += 1
            
            # 使用する訳（japanese を優先）
            translation = japanese or phrase_meaning
            
            # 検証4: 訳の長さ（短すぎる）
            if len(translation) < 3:
                self.warnings.append(
                    f"⚠️  {json_path.name}: フレーズ#{phrase_id} - "
                    f"訳が短すぎます ({len(translation)}文字): '{translation}'"
                )
                self.stats['short_translations'] += 1
                file_warnings += 1
            
            # 検証5: 訳の長さ（長すぎる）
            elif len(translation) > 150:
                self.warnings.append(
                    f"⚠️  {json_path.name}: フレーズ#{phrase_id} - "
                    f"訳が長すぎます ({len(translation)}文字)"
                )
                self.stats['long_translations'] += 1
                file_warnings += 1
            
            # 検証6: 内容の妥当性チェック（簡易版）
            self.validate_content_match(json_path.name, phrase_id, english, translation)
            
            # 検証7: 日本語の自然さチェック
            self.validate_japanese_quality(json_path.name, phrase_id, translation)
        
        # ファイル単位のサマリー
        status = f"{GREEN}✓{RESET}" if file_errors == 0 else f"{RED}✗{RESET}"
        print(f"{status} {json_path.name}: {len(phrases)} フレーズ "
              f"(エラー: {file_errors}, 警告: {file_warnings})")
    
    def validate_content_match(self, filename: str, phrase_id: int, english: str, japanese: str):
        """英文と日本語訳の内容が対応しているか簡易チェック"""
        
        # 明らかな不一致パターンを検出
        mismatches = [
            # 月名の不一致
            ('January', ['お盆', '8月', '夏休み']),
            ('February', ['お盆', '8月', '正月', '1月']),
            ('August', ['正月', '1月', '冬']),
            ('December', ['お盆', '8月', '夏']),
            
            # 季節の不一致
            ('summer', ['冬', '雪', 'スキー']),
            ('winter', ['夏', '海', '水着']),
            
            # 数値の不一致（簡易版）
            ('2nd', ['8日', '15日']),
            ('15th', ['2日', '3日']),
            
            # 人称代名詞のチェック
            ('I\'ve', ['彼は', '彼女は', 'あなたは']),
            ('I\'m', ['彼は', '彼女は', 'あなたは']),
            ('my', ['彼の', '彼女の', 'あなたの']),
            ('He', ['私は', '彼女は']),
            ('She', ['私は', '彼は']),
            
            # 時制のチェック
            ('will', ['〜した', '〜でした']),
            ('was', ['〜します', '〜でしょう']),
            ('were', ['〜します', '〜でしょう']),
        ]
        
        for eng_keyword, jp_keywords in mismatches:
            if eng_keyword.lower() in english.lower():
                for jp_keyword in jp_keywords:
                    if jp_keyword in japanese:
                        self.errors.append(
                            f"❌ {filename}: フレーズ#{phrase_id} - "
                            f"内容の不一致を検出\n"
                            f"    英文に '{eng_keyword}' があるのに、訳に '{jp_keyword}' が含まれています\n"
                            f"    英文: {english[:80]}...\n"
                            f"    訳: {japanese}"
                        )
                        break
        
        # キーワードの存在チェック（英文の主要な名詞が訳に含まれているか）
        # 疑問文かどうかのチェック
        is_question = english.strip().endswith('?')
        has_question_mark_jp = '？' in japanese or '?' in japanese
        
        if is_question and not has_question_mark_jp and '〜か' not in japanese:
            self.warnings.append(
                f"⚠️  {filename}: フレーズ#{phrase_id} - "
                f"英文は疑問文ですが、訳に疑問の表現がありません\n"
                f"    英文: {english[:80]}...\n"
                f"    訳: {japanese}"
            )
            self.stats['question_mismatch'] += 1
        
        # 否定表現のチェック
        has_negation_en = any(neg in english.lower() for neg in ['not', 'never', 'no ', "n't", 'nobody', 'nothing', 'neither'])
        has_negation_jp = any(neg in japanese for neg in ['ない', 'ません', 'ず', 'ぬ', '決して', 'いいえ'])
        
        if has_negation_en and not has_negation_jp:
            self.warnings.append(
                f"⚠️  {filename}: フレーズ#{phrase_id} - "
                f"英文に否定表現がありますが、訳にありません\n"
                f"    英文: {english[:80]}...\n"
                f"    訳: {japanese}"
            )
            self.stats['negation_mismatch'] += 1
    
    def validate_japanese_quality(self, filename: str, phrase_id: int, japanese: str):
        """日本語の自然さと品質をチェック（プロの翻訳家・校正者の観点）"""
        
        if not japanese or len(japanese) < 3:
            return  # 長さチェックで既に警告済み
        
        # 1. 不自然な直訳表現のチェック
        unnatural_patterns = [
            # 英語の語順をそのまま訳したパターン
            ('することができます', '代替案: できます、〜られます'),
            ('することが可能です', '代替案: できます'),
            ('〜であるということ', '代替案: 〜であること、〜だということ'),
            ('〜するということです', '代替案: 〜します、〜することです'),
            ('において', '代替案: で、に（文脈に応じて）'),
            ('に関して', '代替案: について'),
            ('に対して', '代替案: に（文脈に応じて）'),
            ('によって', '代替案: で（文脈に応じて）'),
            
            # 機械翻訳特有の表現
            ('〜ということになります', '代替案: 〜です、〜になります'),
            ('〜というわけです', '代替案: 〜です'),
            ('〜ということができます', '代替案: 〜できます、〜と言えます'),
        ]
        
        for pattern, suggestion in unnatural_patterns:
            if pattern in japanese:
                self.warnings.append(
                    f"⚠️  {filename}: フレーズ#{phrase_id} - "
                    f"不自然な表現: '{pattern}' ({suggestion})\n"
                    f"    訳: {japanese}"
                )
                self.stats['unnatural_japanese'] += 1
                break  # 1つのフレーズにつき1警告まで
        
        # 2. 助詞の誤用パターンチェック
        particle_errors = [
            # よくある助詞の誤用
            ('を見て', 'を見ると' if 'とき' in japanese or 'と' in japanese else None),
            ('が多く', 'が多い' if japanese.endswith('が多く') else None),
            ('は大きく', 'は大きい' if japanese.endswith('は大きく') else None),
            # 二重助詞
            ('では、で', '助詞の重複'),
            ('には、に', '助詞の重複'),
            ('とは、と', '助詞の重複'),
        ]
        
        for error_pattern, hint in particle_errors:
            if hint and error_pattern in japanese:
                self.warnings.append(
                    f"⚠️  {filename}: フレーズ#{phrase_id} - "
                    f"助詞の誤用の可能性: '{error_pattern}' (ヒント: {hint})\n"
                    f"    訳: {japanese}"
                )
                self.stats['particle_errors'] += 1
                break
        
        # 3. 文体の統一性チェック
        has_desu_masu = any(end in japanese for end in ['です', 'ます', 'でした', 'ました'])
        has_da_dearu = any(end in japanese for end in ['だ。', 'である。', 'だった。', 'であった。'])
        
        if has_desu_masu and has_da_dearu:
            self.warnings.append(
                f"⚠️  {filename}: フレーズ#{phrase_id} - "
                f"文体の不統一（です・ます調とだ・である調が混在）\n"
                    f"    訳: {japanese}"
            )
            self.stats['style_inconsistency'] += 1
        
        # 4. 冗長表現のチェック
        redundant_patterns = [
            ('非常に多くの', '代替案: たくさんの、多数の'),
            ('とても大きな', '代替案: 大きな'),
            ('かなり小さな', '代替案: 小さな'),
            ('実際に', '文脈で不要なことが多い'),
            ('基本的に', '文脈で不要なことが多い'),
            ('一般的に', '文脈で不要なことが多い'),
            ('〜したりします', '代替案: 〜します（他の例がない場合）'),
            ('〜というもの', '代替案: 〜（文脈に応じて削除可）'),
        ]
        
        for pattern, suggestion in redundant_patterns:
            if pattern in japanese:
                self.warnings.append(
                    f"⚠️  {filename}: フレーズ#{phrase_id} - "
                    f"冗長表現: '{pattern}' ({suggestion})\n"
                    f"    訳: {japanese}"
                )
                self.stats['redundant_expressions'] += 1
                break
        
        # 5. 中学生向け教材としての語彙の適切性チェック
        difficult_words = [
            # 中学生には難しすぎる語彙
            ('鑑みる', '代替案: 考える、踏まえる'),
            ('斯く', '代替案: このように'),
            ('然るべき', '代替案: 適切な'),
            ('概ね', '代替案: だいたい、ほぼ'),
            ('顕著', '代替案: 目立つ、はっきりした'),
            ('凡そ', '代替案: およそ、約'),
            ('寧ろ', '代替案: むしろ'),
            ('殊に', '代替案: 特に'),
            ('須く', '代替案: すべて（誤用が多い語）'),
            
            # 逆に幼稚すぎる表現（中学生向けではない）
            ('お友達', '代替案: 友達'),
            ('お勉強', '代替案: 勉強'),
            ('ちっちゃい', '代替案: 小さい'),
            ('すっごく', '代替案: とても、非常に'),
        ]
        
        for word, suggestion in difficult_words:
            if word in japanese:
                self.warnings.append(
                    f"⚠️  {filename}: フレーズ#{phrase_id} - "
                    f"中学生向けとして不適切な語彙: '{word}' ({suggestion})\n"
                    f"    訳: {japanese}"
                )
                self.stats['inappropriate_vocabulary'] += 1
                break
        
        # 6. 句読点の適切性チェック
        if len(japanese) > 30:
            # 30文字以上で句点がない場合（読みにくい）
            if '。' not in japanese and '、' not in japanese:
                self.warnings.append(
                    f"⚠️  {filename}: フレーズ#{phrase_id} - "
                    f"句読点がなく読みにくい可能性があります（{len(japanese)}文字）\n"
                    f"    訳: {japanese}"
                )
        
        # 7. カタカナ語の過剰使用チェック
        import re
        katakana_words = re.findall(r'[ァ-ヴー]+', japanese)
        if len(katakana_words) > 3:
            self.warnings.append(
                f"⚠️  {filename}: フレーズ#{phrase_id} - "
                f"カタカナ語が多すぎます（{len(katakana_words)}個）\n"
                f"    訳: {japanese}\n"
                f"    カタカナ語: {', '.join(katakana_words)}"
            )
    
    def print_report(self):
        """検証結果レポート"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}検証結果サマリー{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        print(f"総ファイル数: {self.stats['total_files']}")
        print(f"総フレーズ数: {self.stats['total_phrases']}")
        print()
        
        if self.stats['empty_translations'] > 0:
            print(f"{RED}空の訳: {self.stats['empty_translations']} 件{RESET}")
        
        if self.stats['short_translations'] > 0:
            print(f"{YELLOW}短すぎる訳: {self.stats['short_translations']} 件{RESET}")
        
        if self.stats['long_translations'] > 0:
            print(f"{YELLOW}長すぎる訳: {self.stats['long_translations']} 件{RESET}")
        
        if self.stats['missing_english'] > 0:
            print(f"{RED}英文欠落: {self.stats['missing_english']} 件{RESET}")
        
        print()
        
        # 日本語品質の統計
        if any([
            self.stats['unnatural_japanese'],
            self.stats['particle_errors'],
            self.stats['style_inconsistency'],
            self.stats['redundant_expressions'],
            self.stats['inappropriate_vocabulary']
        ]):
            print(f"{YELLOW}日本語品質の問題:{RESET}")
            
            if self.stats['unnatural_japanese'] > 0:
                print(f"  {YELLOW}不自然な表現: {self.stats['unnatural_japanese']} 件{RESET}")
            
            if self.stats['particle_errors'] > 0:
                print(f"  {YELLOW}助詞の誤用: {self.stats['particle_errors']} 件{RESET}")
            
            if self.stats['style_inconsistency'] > 0:
                print(f"  {YELLOW}文体の不統一: {self.stats['style_inconsistency']} 件{RESET}")
            
            if self.stats['redundant_expressions'] > 0:
                print(f"  {YELLOW}冗長表現: {self.stats['redundant_expressions']} 件{RESET}")
            
            if self.stats['inappropriate_vocabulary'] > 0:
                print(f"  {YELLOW}不適切な語彙: {self.stats['inappropriate_vocabulary']} 件{RESET}")
            
            if self.stats['question_mismatch'] > 0:
                print(f"  {YELLOW}疑問文の不一致: {self.stats['question_mismatch']} 件{RESET}")
            
            if self.stats['negation_mismatch'] > 0:
                print(f"  {YELLOW}否定表現の不一致: {self.stats['negation_mismatch']} 件{RESET}")
            
            print()
        
        print()
        
        if self.warnings:
            print(f"{YELLOW}警告 ({len(self.warnings)}件):{RESET}")
            for warning in self.warnings[:10]:
                print(f"  {warning}")
            if len(self.warnings) > 10:
                print(f"  {YELLOW}... 他 {len(self.warnings) - 10} 件{RESET}")
            print()
        
        if self.errors:
            print(f"{RED}エラー ({len(self.errors)}件):{RESET}")
            for error in self.errors[:10]:
                print(f"  {error}")
            if len(self.errors) > 10:
                print(f"  {RED}... 他 {len(self.errors) - 10} 件{RESET}")
            print(f"\n{RED}❌ フレーズ訳に問題があります{RESET}\n")
            return False
        else:
            print(f"{GREEN}✓ フレーズ訳は適切です{RESET}\n")
            return True


def main():
    """メイン処理"""
    base_path = Path(__file__).parent.parent / 'nanashi8.github.io'
    
    if not base_path.exists():
        print(f"{RED}エラー: プロジェクトディレクトリが見つかりません: {base_path}{RESET}")
        return 1
    
    validator = PhraseTranslationValidator(base_path)
    success = validator.validate_all()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())
