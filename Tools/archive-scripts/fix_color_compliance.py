#!/usr/bin/env python3
"""
色準拠自動修正スクリプト - 安全な22色パレット移行

このスクリプトは以下の修正を実行します：
1. 古いCSS変数名を新しい22色パレットの変数名に置き換え
2. dark.css等での重複CSS変数定義を削除

実行前に必ずGitコミットしてください。
修正後にvalidate_color_compliance.pyで検証します。
"""

import re
import sys
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict

# CSS変数名のマッピング（古い名前 → 新しい名前）
VARIABLE_MAPPING: Dict[str, str] = {
    # テキスト色
    '--text-color': '--text',
    '--text-tertiary': '--text-secondary',  # 3段階目は廃止、セカンダリに統一
    
    # 背景色
    '--bg-tertiary': '--bg-secondary',
    
    # ボーダー色
    '--border-color': '--border',
    '--border-color-light': '--border',
    
    # 成功色（統合）
    '--success-color': '--success',
    '--success-bg-hover': '--success-bg',
    '--success-border': '--success',
    '--success-text': '--success',
    '--success-text-dark': '--success',
    
    # エラー色（統合）
    '--error-color': '--error',
    '--error-bg-hover': '--error-bg',
    '--error-border': '--error',
    '--error-text': '--error',
    '--error-text-dark': '--error',
    
    # 警告色（統合）
    '--warning-color': '--warning',
    '--warning-bg-hover': '--warning-bg',
    '--warning-border': '--warning',
    '--warning-text': '--warning',
    '--warning-text-dark': '--warning',
    
    # 情報色（統合）
    '--info-color': '--info',
    '--info-bg-hover': '--info-bg',
    '--info-border': '--info',
    '--info-text': '--info',
    '--info-text-dark': '--info',
    
    # カード色（背景に統合）
    '--card-bg': '--bg-secondary',
    '--card-bg-hover': '--bg-secondary',
    '--card-border': '--border',
    
    # ボタン色（プライマリに統合）
    '--btn-primary-bg': '--primary',
    '--btn-primary-hover': '--primary-hover',
    '--btn-primary-text': '--text',
    '--btn-secondary-bg': '--bg-secondary',
    '--btn-secondary-hover': '--bg-secondary',
    '--btn-secondary-text': '--text',
    
    # リンク色（プライマリに統合）
    '--link-color': '--primary',
    '--link-hover': '--primary-hover',
}


def create_backup(file_path: Path) -> Path:
    """ファイルのバックアップを作成"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = file_path.with_suffix(f'.backup_{timestamp}{file_path.suffix}')
    shutil.copy2(file_path, backup_path)
    return backup_path


def replace_variable_usage(content: str) -> tuple[str, int]:
    """CSS変数の使用を置き換え（var(--old) → var(--new)）"""
    modified_content = content
    replacements = 0
    
    for old_var, new_var in VARIABLE_MAPPING.items():
        # var(--old-var) を var(--new-var) に置き換え
        pattern = rf'var\({re.escape(old_var)}\)'
        replacement = f'var({new_var})'
        
        modified_content, count = re.subn(pattern, replacement, modified_content)
        replacements += count
    
    return modified_content, replacements


def remove_variable_definitions(content: str, filename: str) -> tuple[str, int]:
    """
    CSS変数定義を削除（core-palette.css以外）
    
    dark.cssの場合、.dark-mode { ... } ブロック内の変数定義を全削除
    """
    if filename == 'core-palette.css':
        return content, 0
    
    removals = 0
    lines = content.split('\n')
    modified_lines = []
    in_dark_mode_block = False
    brace_depth = 0
    skip_line = False
    
    for line in lines:
        # .dark-mode ブロックの検出
        if re.search(r'\.dark-mode\s*\{', line):
            in_dark_mode_block = True
            brace_depth = line.count('{') - line.count('}')
            modified_lines.append(line)
            continue
        
        # ブレースの深さを追跡
        if in_dark_mode_block:
            brace_depth += line.count('{') - line.count('}')
            
            # .dark-modeブロックを抜けた
            if brace_depth <= 0:
                in_dark_mode_block = False
        
        # .dark-modeブロック内で、禁止された変数定義を検出
        if in_dark_mode_block:
            # すべてのCSS変数定義を削除（color-scheme以外）
            if re.search(r'^\s*--[\w-]+\s*:', line) and 'color-scheme' not in line:
                removals += 1
                continue  # この行をスキップ
            
            # コメント行も削除（/* 基本カラー */ など）
            if re.search(r'^\s*/\*.*\*/', line) and not re.search(r'color-scheme', line):
                continue
        
        modified_lines.append(line)
    
    return '\n'.join(modified_lines), removals


def process_css_file(file_path: Path) -> tuple[bool, int, int]:
    """
    CSSファイルを処理
    
    Returns:
        (modified, replacements, removals)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # 変数使用の置き換え
        content, replacements = replace_variable_usage(original_content)
        
        # 変数定義の削除
        content, removals = remove_variable_definitions(content, file_path.name)
        
        if replacements > 0 or removals > 0:
            # バックアップ作成
            backup_path = create_backup(file_path)
            
            # ファイル更新
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ {file_path.name}")
            print(f"   バックアップ: {backup_path.name}")
            print(f"   置き換え: {replacements} 箇所")
            print(f"   削除: {removals} 行")
            
            return True, replacements, removals
        
        return False, 0, 0
        
    except Exception as e:
        print(f"❌ エラー: {file_path} - {e}")
        return False, 0, 0


def main():
    """メイン処理"""
    base_path = Path(__file__).parent.parent / 'nanashi8.github.io'
    
    if not base_path.exists():
        print(f"❌ エラー: {base_path} が見つかりません")
        sys.exit(1)
    
    # CSSファイルを検索
    css_files = list(base_path.glob('**/*.css'))
    
    print("=" * 60)
    print("🔧 22色パレット準拠修正スクリプト")
    print("=" * 60)
    print()
    print(f"対象: {len(css_files)} 個のCSSファイル")
    print()
    
    # 確認
    response = input("修正を実行しますか？ (yes/no): ")
    if response.lower() != 'yes':
        print("キャンセルしました")
        sys.exit(0)
    
    print()
    print("修正中...")
    print()
    
    total_replacements = 0
    total_removals = 0
    modified_files = 0
    
    for css_file in sorted(css_files):
        modified, replacements, removals = process_css_file(css_file)
        if modified:
            modified_files += 1
            total_replacements += replacements
            total_removals += removals
    
    print()
    print("=" * 60)
    print(f"✅ 修正完了")
    print("=" * 60)
    print(f"修正ファイル数: {modified_files}")
    print(f"変数置き換え: {total_replacements} 箇所")
    print(f"変数定義削除: {total_removals} 行")
    print()
    print("次のステップ:")
    print("1. ブラウザで表示確認")
    print("2. python3 scripts/validate_color_compliance.py で検証")
    print("3. 問題なければ git commit")
    print()


if __name__ == '__main__':
    main()
