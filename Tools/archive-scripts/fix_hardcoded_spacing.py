#!/usr/bin/env python3
"""
ハードコードされたmargin/paddingを6段階のスペーシングスケールに置き換えるスクリプト
"""

import re
from pathlib import Path
from typing import Dict, Tuple

# スペーシングのマッピング（ハードコード → CSS変数）
# 新6段階: 4px(xs), 8px(sm), 16px(md), 24px(lg), 32px(xl), 48px(2xl)
SPACING_MAPPINGS = {
    # px単位
    '2px': 'var(--space-xs)',     # 2px → 4px
    '3px': 'var(--space-xs)',     # 3px → 4px
    '4px': 'var(--space-xs)',     # 4px
    '5px': 'var(--space-sm)',     # 5px → 8px
    '6px': 'var(--space-sm)',     # 6px → 8px
    '7px': 'var(--space-sm)',     # 7px → 8px
    '8px': 'var(--space-sm)',     # 8px
    '9px': 'var(--space-sm)',     # 9px → 8px
    '10px': 'var(--space-sm)',    # 10px → 8px
    '11px': 'var(--space-sm)',    # 11px → 8px
    '12px': 'var(--space-md)',    # 12px → 16px
    '13px': 'var(--space-md)',    # 13px → 16px
    '14px': 'var(--space-md)',    # 14px → 16px
    '15px': 'var(--space-md)',    # 15px → 16px
    '16px': 'var(--space-md)',    # 16px
    '17px': 'var(--space-md)',    # 17px → 16px
    '18px': 'var(--space-md)',    # 18px → 16px
    '19px': 'var(--space-md)',    # 19px → 16px
    '20px': 'var(--space-lg)',    # 20px → 24px
    '21px': 'var(--space-lg)',    # 21px → 24px
    '22px': 'var(--space-lg)',    # 22px → 24px
    '23px': 'var(--space-lg)',    # 23px → 24px
    '24px': 'var(--space-lg)',    # 24px
    '25px': 'var(--space-lg)',    # 25px → 24px
    '26px': 'var(--space-lg)',    # 26px → 24px
    '28px': 'var(--space-xl)',    # 28px → 32px
    '30px': 'var(--space-xl)',    # 30px → 32px
    '32px': 'var(--space-xl)',    # 32px
    '34px': 'var(--space-xl)',    # 34px → 32px
    '36px': 'var(--space-2xl)',   # 36px → 48px
    '38px': 'var(--space-2xl)',   # 38px → 48px
    '40px': 'var(--space-2xl)',   # 40px → 48px
    '42px': 'var(--space-2xl)',   # 42px → 48px
    '44px': 'var(--space-2xl)',   # 44px → 48px
    '46px': 'var(--space-2xl)',   # 46px → 48px
    '48px': 'var(--space-2xl)',   # 48px
    '50px': 'var(--space-2xl)',   # 50px → 48px
    '52px': 'var(--space-2xl)',   # 52px → 48px
    '56px': 'var(--space-2xl)',   # 56px → 48px
    '60px': 'var(--space-2xl)',   # 60px → 48px
    '64px': 'var(--space-2xl)',   # 64px → 48px
    
    # rem/em単位
    '0.25rem': 'var(--space-xs)',   # 4px
    '0.25em': 'var(--space-xs)',    # 4px
    '0.5rem': 'var(--space-sm)',    # 8px
    '0.5em': 'var(--space-sm)',     # 8px
    '0.75rem': 'var(--space-md)',   # 12px → 16px
    '0.75em': 'var(--space-md)',    # 12px → 16px
    '1rem': 'var(--space-md)',      # 16px
    '1em': 'var(--space-md)',       # 16px
    '1.25rem': 'var(--space-lg)',   # 20px → 24px
    '1.25em': 'var(--space-lg)',    # 20px → 24px
    '1.5rem': 'var(--space-lg)',    # 24px
    '1.5em': 'var(--space-lg)',     # 24px
    '1.75rem': 'var(--space-xl)',   # 28px → 32px
    '1.75em': 'var(--space-xl)',    # 28px → 32px
    '2rem': 'var(--space-xl)',      # 32px
    '2em': 'var(--space-xl)',       # 32px
    '2.5rem': 'var(--space-2xl)',   # 40px → 48px
    '2.5em': 'var(--space-2xl)',    # 40px → 48px
    '3rem': 'var(--space-2xl)',     # 48px
    '3em': 'var(--space-2xl)',      # 48px
}


def fix_spacing_in_file(file_path: Path) -> Tuple[int, int]:
    """
    ファイル内のハードコードされたmargin/paddingをCSS変数に置き換える
    
    Returns:
        (置換数, 処理ファイル数)
    """
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        replacements = 0
        
        # margin/padding プロパティを検出して置換
        spacing_properties = [
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
        ]
        
        for prop in spacing_properties:
            for hardcoded, css_var in SPACING_MAPPINGS.items():
                # margin: 16px; のような単一値パターン
                pattern = re.compile(
                    r'(' + prop + r'\s*:\s*)' + re.escape(hardcoded) + r'(\s*[;}])',
                    re.IGNORECASE
                )
                matches = pattern.findall(content)
                if matches:
                    content = pattern.sub(r'\1' + css_var + r'\2', content)
                    replacements += len(matches)
                
                # margin: 16px 8px; のような複数値パターン
                # 16px を含む部分のみ置換
                pattern_multi = re.compile(
                    r'(' + prop + r'\s*:\s*)([^;{}]*?)' + re.escape(hardcoded) + r'([^;{}]*?)([;}])',
                    re.IGNORECASE
                )
                
                def replace_in_multi(match):
                    prefix = match.group(1)
                    before = match.group(2)
                    after = match.group(3)
                    suffix = match.group(4)
                    
                    # before/after の中の他の値も置換する必要があるが、
                    # 単純化のため、このパスでは個別に処理
                    return prefix + before + css_var + after + suffix
                
                old_content = content
                content = pattern_multi.sub(replace_in_multi, content)
                if content != old_content:
                    replacements += len(pattern_multi.findall(old_content))
        
        # ファイルが変更された場合のみ書き込み
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            return replacements, 1
        
        return 0, 0
    
    except Exception as e:
        print(f"エラー: {file_path}: {e}")
        return 0, 0


def main():
    """メイン処理"""
    base_path = Path(__file__).parent.parent / 'nanashi8.github.io' / 'src'
    
    if not base_path.exists():
        print(f"エラー: ディレクトリが見つかりません: {base_path}")
        return 1
    
    # すべてのCSSファイルを対象
    css_files = list(base_path.glob('**/*.css'))
    
    # variables.css, core-palette.css, dark.css, light.css は除外
    # variables.css, core-palette.css は除外 (dark.css, light.cssは修正対象)
    excluded = ['variables.css', 'core-palette.css']
    css_files = [f for f in css_files if f.name not in excluded]
    
    total_replacements = 0
    total_files = 0
    
    print("📏 ハードコードされたmargin/paddingをスペーシングスケールに変換中...\n")
    
    for file_path in css_files:
        replacements, files = fix_spacing_in_file(file_path)
        if replacements > 0:
            rel_path = file_path.relative_to(base_path)
            print(f"✓ {rel_path}: {replacements}箇所を修正")
            total_replacements += replacements
            total_files += files
    
    print(f"\n{'='*70}")
    print(f"完了: {total_files}ファイル、{total_replacements}箇所を修正しました")
    print(f"{'='*70}")
    
    return 0


if __name__ == '__main__':
    exit(main())
