#!/usr/bin/env python3
"""
ハードコードされたfont-sizeを6段階のタイポグラフィスケールに置き換えるスクリプト
"""

import re
from pathlib import Path
from typing import Dict, Tuple

# フォントサイズのマッピング（ハードコード → CSS変数）
# 新6段階: 12px(xs), 16px(sm), 20px(base), 24px(lg), 28px(xl), 32px(2xl)
FONT_SIZE_MAPPINGS = {
    # rem/em単位
    '0.75rem': 'var(--font-xs)',    # 12px
    '0.75em': 'var(--font-xs)',     # 12px
    '0.8em': 'var(--font-xs)',      # ~13px → 12px
    '0.85em': 'var(--font-xs)',     # ~14px → 12px
    '0.875rem': 'var(--font-sm)',   # 14px → 16px
    '0.875em': 'var(--font-sm)',    # 14px → 16px
    '0.9em': 'var(--font-sm)',      # ~14px → 16px
    '0.95em': 'var(--font-sm)',     # ~15px → 16px
    '1em': 'var(--font-sm)',        # 16px
    '1rem': 'var(--font-sm)',       # 16px
    '1.05em': 'var(--font-sm)',     # ~17px → 16px
    '1.05rem': 'var(--font-sm)',    # ~17px → 16px
    '1.1em': 'var(--font-base)',    # ~18px → 20px
    '1.1rem': 'var(--font-base)',   # ~18px → 20px
    '1.125rem': 'var(--font-base)', # 18px → 20px
    '1.125em': 'var(--font-base)',  # 18px → 20px
    '1.2em': 'var(--font-base)',    # ~19px → 20px
    '1.2rem': 'var(--font-base)',   # ~19px → 20px
    '1.25rem': 'var(--font-base)',  # 20px
    '1.25em': 'var(--font-base)',   # 20px
    '1.3em': 'var(--font-lg)',      # ~21px → 24px
    '1.4em': 'var(--font-lg)',      # ~22px → 24px
    '1.5em': 'var(--font-lg)',      # 24px
    '1.5rem': 'var(--font-lg)',     # 24px
    '1.6em': 'var(--font-xl)',      # ~26px → 28px
    '1.75em': 'var(--font-xl)',     # 28px
    '1.75rem': 'var(--font-xl)',    # 28px
    '1.8em': 'var(--font-xl)',      # ~29px → 28px
    '1.875rem': 'var(--font-2xl)',  # 30px → 32px
    '1.9em': 'var(--font-2xl)',     # ~30px → 32px
    '2em': 'var(--font-2xl)',       # 32px
    '2rem': 'var(--font-2xl)',      # 32px
    '2.25rem': 'var(--font-2xl)',   # 36px → 32px
    '2.5em': 'var(--font-2xl)',     # 40px → 32px
    '3em': 'var(--font-2xl)',       # 48px → 32px
    '4rem': 'var(--font-2xl)',      # 64px → 32px
    
    # px単位
    '12px': 'var(--font-xs)',       # 12px
    '13px': 'var(--font-xs)',       # 13px → 12px
    '14px': 'var(--font-sm)',       # 14px → 16px
    '15px': 'var(--font-sm)',       # 15px → 16px
    '16px': 'var(--font-sm)',       # 16px
    '17px': 'var(--font-base)',     # 17px → 20px
    '18px': 'var(--font-base)',     # 18px → 20px
    '19px': 'var(--font-base)',     # 19px → 20px
    '20px': 'var(--font-base)',     # 20px
    '21px': 'var(--font-lg)',       # 21px → 24px
    '22px': 'var(--font-lg)',       # 22px → 24px
    '23px': 'var(--font-lg)',       # 23px → 24px
    '24px': 'var(--font-lg)',       # 24px
    '25px': 'var(--font-xl)',       # 25px → 28px
    '26px': 'var(--font-xl)',       # 26px → 28px
    '27px': 'var(--font-xl)',       # 27px → 28px
    '28px': 'var(--font-xl)',       # 28px
    '29px': 'var(--font-xl)',       # 29px → 28px
    '30px': 'var(--font-2xl)',      # 30px → 32px
    '32px': 'var(--font-2xl)',      # 32px
    '36px': 'var(--font-2xl)',      # 36px → 32px
    '40px': 'var(--font-2xl)',      # 40px → 32px
    '48px': 'var(--font-2xl)',      # 48px → 32px
}


def fix_font_sizes_in_file(file_path: Path) -> Tuple[int, int]:
    """
    ファイル内のハードコードされたfont-sizeをCSS変数に置き換える
    
    Returns:
        (置換数, 処理ファイル数)
    """
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        replacements = 0
        
        # font-size: 16px; のようなパターンを検出して置換
        for hardcoded, css_var in FONT_SIZE_MAPPINGS.items():
            # font-size: 16px; パターン (!important対応)
            pattern = re.compile(
                r'(font-size\s*:\s*)' + re.escape(hardcoded) + r'(\s*(?:!important\s*)?[;}])',
                re.IGNORECASE
            )
            matches = pattern.findall(content)
            if matches:
                content = pattern.sub(r'\1' + css_var + r'\2', content)
                replacements += len(matches)
        
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
    
    # variables.css, core-palette.css は除外 (dark.css, light.cssは修正対象)
    excluded = ['variables.css', 'core-palette.css']
    css_files = [f for f in css_files if f.name not in excluded]
    
    total_replacements = 0
    total_files = 0
    
    print("🔤 ハードコードされたfont-sizeをタイポグラフィスケールに変換中...\n")
    
    for file_path in css_files:
        replacements, files = fix_font_sizes_in_file(file_path)
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
