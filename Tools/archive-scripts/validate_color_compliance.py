#!/usr/bin/env python3
"""
色準拠検証スクリプト - 22色パレット品質管理

このスクリプトは以下の品質基準を検証します：
1. CSS変数の重複定義（core-palette.css以外での--primary等の定義を禁止）
2. ハードコードされた色コード（#rrggbb、rgb()、rgba()）の検出
3. dark.cssでの古いCSS変数名の使用検出
4. グラデーションの検出（linear-gradient, radial-gradientを禁止）

違反が見つかった場合、エラーを出力してCI/CDを失敗させます。
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

# 許可されたCSS変数名（core-palette.cssで定義された22色）
ALLOWED_CORE_VARIABLES = {
    '--primary', '--primary-hover', '--primary-light',
    '--gray-50', '--gray-100', '--gray-300', '--gray-600', '--gray-800', '--gray-900',
    '--success', '--success-bg',
    '--error', '--error-bg',
    '--warning', '--warning-bg',
    '--info', '--info-bg',
    '--text', '--text-secondary', '--background', '--bg-secondary', '--border'
}

# 禁止された古いCSS変数名
FORBIDDEN_VARIABLES = {
    '--text-color', '--text-tertiary', '--bg-tertiary',
    '--border-color', '--border-color-light',
    '--success-color', '--success-bg-hover', '--success-border', '--success-text', '--success-text-dark',
    '--error-color', '--error-bg-hover', '--error-border', '--error-text', '--error-text-dark',
    '--warning-color', '--warning-bg-hover', '--warning-border', '--warning-text', '--warning-text-dark',
    '--info-color', '--info-bg-hover', '--info-border', '--info-text', '--info-text-dark',
    '--card-bg', '--card-bg-hover', '--card-border', '--card-shadow',
    '--btn-primary-bg', '--btn-primary-hover', '--btn-primary-text',
    '--btn-secondary-bg', '--btn-secondary-hover', '--btn-secondary-text',
    '--btn-disabled-bg', '--btn-disabled-text',
    '--link-color', '--link-hover', '--focus-ring',
    '--overlay-bg', '--overlay-light'
}


def find_css_files(base_path: Path) -> List[Path]:
    """CSSファイルを再帰的に検索"""
    css_files = []
    for pattern in ['**/*.css', '**/*.scss']:
        css_files.extend(base_path.glob(pattern))
    return css_files


def check_variable_redefinition(file_path: Path) -> List[Tuple[int, str]]:
    """CSS変数の重複定義をチェック"""
    errors = []
    
    # core-palette.css自体はスキップ
    if file_path.name == 'core-palette.css':
        return errors
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            # CSS変数定義を検出
            for var in ALLOWED_CORE_VARIABLES:
                # "  --primary: " のようなパターン
                if re.search(rf'^\s*{re.escape(var)}\s*:', line):
                    errors.append((line_num, f"CSS変数 {var} の再定義を検出（core-palette.css以外での定義は禁止）"))
    
    return errors


def check_forbidden_variables(file_path: Path) -> List[Tuple[int, str]]:
    """禁止されたCSS変数の使用をチェック"""
    errors = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            for var in FORBIDDEN_VARIABLES:
                # var(--text-color) のような使用を検出
                if re.search(rf'var\({re.escape(var)}\)', line):
                    errors.append((line_num, f"禁止されたCSS変数 {var} の使用を検出（22色パレットの変数を使用してください）"))
                # 定義も検出
                if re.search(rf'^\s*{re.escape(var)}\s*:', line):
                    errors.append((line_num, f"禁止されたCSS変数 {var} の定義を検出（削除してください）"))
    
    return errors


def check_hardcoded_colors(file_path: Path) -> List[Tuple[int, str]]:
    """ハードコードされた色コードをチェック"""
    errors = []
    
    # 除外パターン
    if file_path.name == 'core-palette.css':
        return errors  # core-palette.cssは色コードを含む唯一のファイル
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            # #rrggbb または #rgb パターン
            hex_colors = re.findall(r'#[0-9a-fA-F]{3,6}\b', line)
            if hex_colors:
                errors.append((line_num, f"ハードコードされた色コード {hex_colors} を検出（CSS変数を使用してください）"))
            
            # rgb()、rgba() パターン
            if re.search(r'rgba?\s*\(', line):
                errors.append((line_num, "rgb()/rgba()の使用を検出（CSS変数を使用してください）"))
    
    return errors


def check_gradients(file_path: Path) -> List[Tuple[int, str]]:
    """グラデーションの使用をチェック"""
    errors = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            if re.search(r'(linear|radial|conic)-gradient\s*\(', line):
                errors.append((line_num, "グラデーションの使用を検出（ソリッドカラーを使用してください）"))
    
    return errors


def main():
    """メイン検証処理"""
    base_path = Path(__file__).parent.parent / 'nanashi8.github.io'
    
    if not base_path.exists():
        print(f"❌ エラー: {base_path} が見つかりません")
        sys.exit(1)
    
    css_files = find_css_files(base_path)
    
    if not css_files:
        print("⚠️  警告: CSSファイルが見つかりませんでした")
        sys.exit(0)
    
    print(f"🔍 {len(css_files)} 個のCSSファイルを検証中...")
    print()
    
    total_errors = 0
    
    for css_file in sorted(css_files):
        file_errors = []
        
        # 各種チェックを実行
        file_errors.extend(check_variable_redefinition(css_file))
        file_errors.extend(check_forbidden_variables(css_file))
        file_errors.extend(check_hardcoded_colors(css_file))
        file_errors.extend(check_gradients(css_file))
        
        if file_errors:
            rel_path = css_file.relative_to(base_path)
            print(f"❌ {rel_path}")
            for line_num, error in sorted(file_errors):
                print(f"   行 {line_num}: {error}")
            print()
            total_errors += len(file_errors)
    
    if total_errors > 0:
        print(f"=" * 60)
        print(f"❌ 検証失敗: {total_errors} 個の品質違反を検出しました")
        print(f"=" * 60)
        print()
        print("修正方法:")
        print("1. dark.css等での古いCSS変数定義を削除")
        print("2. var(--text-color) → var(--text) に置き換え")
        print("3. var(--btn-primary-bg) → var(--primary) に置き換え")
        print("4. ハードコードされた色 → CSS変数に置き換え")
        print("5. グラデーション → ソリッドカラーに置き換え")
        print()
        sys.exit(1)
    else:
        print("=" * 60)
        print("✅ 検証成功: すべてのCSSファイルが品質基準に準拠しています")
        print("=" * 60)
        sys.exit(0)


if __name__ == '__main__':
    main()
