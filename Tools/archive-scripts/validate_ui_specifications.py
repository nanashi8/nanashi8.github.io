#!/usr/bin/env python3
"""
UI仕様書準拠検証スクリプト

docs/UI_IMMUTABLE_SPECIFICATIONS.md に記載された仕様に準拠しているかを検証します。
"""

import re
import json
import sys
from pathlib import Path
from typing import List, Dict, Tuple

# カラーコード
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class UISpecValidator:
    def __init__(self, base_path: Path, strict_mode: bool = False):
        self.base_path = base_path
        self.src_path = base_path / 'src'
        self.errors = []
        self.warnings = []
        self.strict_mode = strict_mode
        
        # 既存の技術的負債ファイル（strictモードでは除外）
        # 注: 既存のCSSファイルはすべてリファクタリング前のレガシーコード
        # 新規作成するCSSファイルは必ずCSS変数のみを使用すること
        self.legacy_files = [
            'src/App.css',
            'src/index.css',
            'src/styles/themes/dark.css',
            'src/styles/themes/light.css',
            'src/styles/themes/variables.css',
            'src/components/GamificationPanel.css',
            'src/components/GrammarQuizView.css',
            'src/components/DictionaryView.css',
            'src/components/LinguisticRelationsView.css',
        ] if strict_mode else []
        
    def validate_all(self) -> bool:
        """全ての検証を実行"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}UI仕様書準拠検証{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        # 1. カラーシステム検証
        self.validate_color_system()
        
        # 2. ScoreBoard仕様検証
        self.validate_scoreboard()
        
        # 3. 語句詳細表示検証
        self.validate_word_details()
        
        # 4. question-nav-row検証
        self.validate_question_nav_row()
        
        # 5. 非同期処理検証
        self.validate_async_handling()
        
        # レポート出力
        self.print_report()
        
        return len(self.errors) == 0
    
    def validate_color_system(self):
        """カラーシステムの検証"""
        print(f"{YELLOW}[1/5] カラーシステム検証{RESET}")
        
        # 除外するファイルパターン（チャート系など、複雑な色設定が必要なコンポーネント）
        # 注: 既存の技術的負債を除外。新規コンポーネントは必ずCSS変数を使用すること
        excluded_patterns = [
            'Chart.tsx',  # すべてのチャートコンポーネント
            'RadarChart.tsx',
            'BarChart.tsx',
            'LineChart.tsx',
            'StreakDisplay.tsx',
            'ComprehensiveReadingView.tsx',  # 既存の技術的負債（リファクタリング予定）
        ]
        
        def should_exclude(file_path: Path) -> bool:
            """ファイルを除外すべきか判定"""
            # レガシーファイルをstrictモードで除外
            if self.strict_mode:
                relative_path = str(file_path.relative_to(self.base_path))
                for legacy_file in self.legacy_files:
                    if relative_path == legacy_file:
                        return True
            
            # パターンマッチ除外
            for pattern in excluded_patterns:
                if pattern in file_path.name:
                    return True
            return False
        
        # ハードコードされた色を検索
        hardcoded_patterns = [
            (r'#[0-9a-fA-F]{3,6}', 'カラーコード'),
            (r'rgb\s*\([^)]+\)', 'RGB関数'),
            (r'rgba\s*\([^)]+\)', 'RGBA関数'),
            (r':\s*(white|black|red|blue|green|yellow|purple|orange|pink|gray|grey)\s*[;}]', '色名'),
        ]
        
        # .tsx, .ts, .css ファイルを検索
        files_to_check = list(self.src_path.rglob('*.tsx')) + \
                        list(self.src_path.rglob('*.ts')) + \
                        list(self.src_path.rglob('*.css'))
        
        violations = []
        for file_path in files_to_check:
            # 除外ファイルチェック
            if should_exclude(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    # コメント行はスキップ
                    if line.strip().startswith('//') or line.strip().startswith('/*') or line.strip().startswith('*'):
                        continue
                    
                    for pattern, color_type in hardcoded_patterns:
                        matches = re.finditer(pattern, line, re.IGNORECASE)
                        for match in matches:
                            # CSS変数定義はOK
                            if '--' in line or 'var(' in line:
                                continue
                            # グラデーション等の特殊ケースはワーニング
                            if 'gradient' in line.lower():
                                self.warnings.append(
                                    f"{file_path.relative_to(self.base_path)}:{i} - {color_type}を使用（グラデーション）: {line.strip()[:80]}"
                                )
                                continue
                            
                            violations.append(
                                f"{file_path.relative_to(self.base_path)}:{i} - {color_type}: {match.group()}"
                            )
            except Exception as e:
                self.warnings.append(f"ファイル読み込みエラー: {file_path} - {e}")
        
        if violations:
            self.errors.append(f"❌ ハードコードされた色が見つかりました ({len(violations)}件)")
            for v in violations[:10]:  # 最初の10件のみ表示
                print(f"  {RED}✗{RESET} {v}")
            if len(violations) > 10:
                print(f"  {YELLOW}... 他 {len(violations) - 10} 件{RESET}")
        else:
            print(f"  {GREEN}✓{RESET} ハードコードされた色は見つかりませんでした")
    
    def validate_scoreboard(self):
        """ScoreBoard仕様の検証"""
        print(f"\n{YELLOW}[2/5] ScoreBoard仕様検証{RESET}")
        
        scoreboard_path = self.src_path / 'components' / 'ScoreBoard.tsx'
        if not scoreboard_path.exists():
            self.errors.append("❌ ScoreBoard.tsx が見つかりません")
            return
        
        content = scoreboard_path.read_text(encoding='utf-8')
        
        # タブ構成の検証
        checks = [
            ('breakdown', 'タブ「学習状況」が定義されている'),
            ('plan-text-line', 'プラン表示が詳細版を使用している'),
            ('stat-text-label', 'プラン統計表示が存在する'),
        ]
        
        for keyword, description in checks:
            if keyword in content:
                print(f"  {GREEN}✓{RESET} {description}")
            else:
                self.errors.append(f"❌ {description} - キーワード '{keyword}' が見つかりません")
                print(f"  {RED}✗{RESET} {description}")
    
    def validate_word_details(self):
        """語句詳細表示の検証"""
        print(f"\n{YELLOW}[3/5] 語句詳細表示検証{RESET}")
        
        question_card_path = self.src_path / 'components' / 'QuestionCard.tsx'
        if not question_card_path.exists():
            self.errors.append("❌ QuestionCard.tsx が見つかりません")
            return
        
        content = question_card_path.read_text(encoding='utf-8')
        
        # 意味フィールドの検証
        if 'choiceQuestion.meaning' in content:
            print(f"  {GREEN}✓{RESET} 語句詳細に意味が表示されている")
        else:
            self.errors.append("❌ 語句詳細に意味が表示されていません")
            print(f"  {RED}✗{RESET} 語句詳細に意味が表示されていません")
        
        # 全選択肢詳細開閉の検証
        if 'choicesWithQuestions.map' in content or 'Set(choicesWithQuestions' in content:
            print(f"  {GREEN}✓{RESET} 全選択肢詳細の一括開閉機能が実装されている")
        else:
            self.warnings.append("⚠ 全選択肢詳細の一括開閉機能の確認ができません")
            print(f"  {YELLOW}?{RESET} 全選択肢詳細の一括開閉機能の確認ができません")
    
    def validate_question_nav_row(self):
        """question-nav-row仕様の検証"""
        print(f"\n{YELLOW}[4/5] question-nav-row仕様検証{RESET}")
        
        dark_css_path = self.src_path / 'styles' / 'themes' / 'dark.css'
        if not dark_css_path.exists():
            self.errors.append("❌ dark.css が見つかりません")
            return
        
        content = dark_css_path.read_text(encoding='utf-8')
        
        # .question-text のフォントサイズ検証
        question_text_match = re.search(r'\.question-text\s*{([^}]+)}', content, re.DOTALL)
        if question_text_match:
            styles = question_text_match.group(1)
            font_size_match = re.search(r'font-size:\s*(\d+)px', styles)
            if font_size_match:
                size = int(font_size_match.group(1))
                if size >= 28:
                    print(f"  {GREEN}✓{RESET} .question-text のフォントサイズ: {size}px (28px以上)")
                else:
                    self.errors.append(f"❌ .question-text のフォントサイズが小さすぎます: {size}px (28px必要)")
                    print(f"  {RED}✗{RESET} .question-text のフォントサイズ: {size}px (28px必要)")
        
        # .question-nav-row の余白検証
        nav_row_match = re.search(r'\.question-nav-row\s*{([^}]+)}', content, re.DOTALL)
        if nav_row_match:
            styles = nav_row_match.group(1)
            padding_match = re.search(r'padding:\s*(\d+)px', styles)
            margin_match = re.search(r'margin-bottom:\s*(\d+)px', styles)
            
            issues = []
            if padding_match:
                padding = int(padding_match.group(1))
                if padding <= 6:
                    print(f"  {GREEN}✓{RESET} padding: {padding}px (6px以下)")
                else:
                    issues.append(f"padding: {padding}px (6px推奨)")
            
            if margin_match:
                margin = int(margin_match.group(1))
                if margin <= 10:
                    print(f"  {GREEN}✓{RESET} margin-bottom: {margin}px (10px以下)")
                else:
                    issues.append(f"margin-bottom: {margin}px (10px推奨)")
            
            if issues:
                self.warnings.append(f"⚠ .question-nav-row の余白: {', '.join(issues)}")
    
    def validate_async_handling(self):
        """非同期処理とローディング表示の検証"""
        print(f"\n{YELLOW}[5/5] 非同期処理とローディング表示検証{RESET}")
        
        # 1. App.tsxの検証
        app_path = self.src_path / 'App.tsx'
        if not app_path.exists():
            self.errors.append("❌ App.tsx が見つかりません")
            return
        
        content = app_path.read_text(encoding='utf-8')
        
        # handleSkip関数の検証
        handle_skip_match = re.search(
            r'const handleSkip = async \(\) => \{(.*?)^\s*\};',
            content,
            re.MULTILINE | re.DOTALL
        )
        
        if handle_skip_match:
            skip_body = handle_skip_match.group(1)
            
            checks = [
                ('await recordWordSkip', 'recordWordSkipをawait'),
                ('await updateWordProgress', 'updateWordProgressをawait'),
                ('await addQuizResult', 'addQuizResultをawait'),
                ('setLastAnswerTime', 'setLastAnswerTimeを呼び出し'),
            ]
            
            all_ok = True
            for keyword, description in checks:
                if keyword in skip_body:
                    print(f"  {GREEN}✓{RESET} {description}")
                else:
                    self.errors.append(f"❌ handleSkip: {description}が見つかりません")
                    print(f"  {RED}✗{RESET} {description}が見つかりません")
                    all_ok = False
            
            # setTimeoutの使用チェック（禁止）
            if 'setTimeout' in skip_body:
                self.errors.append("❌ handleSkip内でsetTimeoutが使用されています（禁止）")
                print(f"  {RED}✗{RESET} setTimeout使用（禁止）")
            else:
                print(f"  {GREEN}✓{RESET} setTimeoutは使用されていません")
        else:
            self.errors.append("❌ handleSkip関数が見つかりません")
            print(f"  {RED}✗{RESET} handleSkip関数が見つかりません")
        
        # 2. ローディング表示の禁止チェック
        print(f"\n  {BLUE}ローディング表示検証:{RESET}")
        forbidden_loading_patterns = [
            (r'読み込み中\.\.\.', '「読み込み中...」テキスト'),
            (r'Loading\.\.\.', '「Loading...」テキスト'),
            (r'ローディング', '「ローディング」テキスト'),
            (r'loading-container', 'loading-containerクラス'),
        ]
        
        # 全てのTSX/TSファイルをチェック
        tsx_files = list(self.src_path.glob('**/*.tsx')) + list(self.src_path.glob('**/*.ts'))
        loading_found = False
        
        for tsx_file in tsx_files:
            if 'node_modules' in str(tsx_file):
                continue
            
            tsx_content = tsx_file.read_text(encoding='utf-8')
            relative_path = tsx_file.relative_to(self.src_path)
            
            for pattern, description in forbidden_loading_patterns:
                matches = re.finditer(pattern, tsx_content)
                for match in matches:
                    # コメント内や変数名の一部でないかチェック
                    line_start = tsx_content.rfind('\n', 0, match.start()) + 1
                    line_end = tsx_content.find('\n', match.end())
                    line = tsx_content[line_start:line_end if line_end != -1 else len(tsx_content)]
                    
                    # コメント行は除外
                    if '//' in line[:match.start() - line_start] or line.strip().startswith('//'):
                        continue
                    # JSXコメントは除外
                    if '{/*' in line or '*/}' in line:
                        continue
                    
                    self.errors.append(f"❌ {relative_path}: {description}が使用されています（禁止）")
                    print(f"  {RED}✗{RESET} {relative_path}: {description}")
                    loading_found = True
        
        if not loading_found:
            print(f"  {GREEN}✓{RESET} 禁止されたローディング表示は見つかりませんでした")

    
    def print_report(self):
        """検証レポートを出力"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}検証結果サマリー{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        if self.warnings:
            print(f"{YELLOW}警告 ({len(self.warnings)}件):{RESET}")
            for warning in self.warnings[:5]:
                print(f"  {YELLOW}⚠{RESET} {warning}")
            if len(self.warnings) > 5:
                print(f"  {YELLOW}... 他 {len(self.warnings) - 5} 件{RESET}")
            print()
        
        if self.errors:
            print(f"{RED}エラー ({len(self.errors)}件):{RESET}")
            for error in self.errors:
                print(f"  {RED}✗{RESET} {error}")
            print(f"\n{RED}❌ UI仕様書への準拠に問題があります{RESET}\n")
            return False
        else:
            print(f"{GREEN}✓ UI仕様書への準拠を確認しました{RESET}\n")
            return True


def main():
    """メイン処理"""
    import argparse
    
    parser = argparse.ArgumentParser(description='UI仕様書準拠検証')
    parser.add_argument('--strict', action='store_true', 
                       help='strictモード: 既存の技術的負債を除外（新規コードのみチェック）')
    args = parser.parse_args()
    
    base_path = Path(__file__).parent.parent / 'nanashi8.github.io'
    
    if not base_path.exists():
        print(f"{RED}エラー: プロジェクトディレクトリが見つかりません: {base_path}{RESET}")
        return 1
    
    validator = UISpecValidator(base_path, strict_mode=args.strict)
    
    if args.strict:
        print(f"{BLUE}🔒 Strictモード: 既存の技術的負債を除外し、新規コードのみ検証します{RESET}\n")
    
    success = validator.validate_all()
    
    return 0 if success else 1


if __name__ == '__main__':
    exit(main())
