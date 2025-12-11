#!/usr/bin/env python3
"""
壊れたCSS変数を修正するスクリプト
"""
import re
from pathlib import Path

def fix_css_variables(file_path):
    """壊れたCSS変数を修正する"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 修正パターン
    replacements = [
        # 5重ネスト gray-500 パターン
        (r'var\(--var\(--var\(--var\(--var\(--gray-500\)-500\)-500\)-500\)-100\)', 'var(--gray-100)'),
        (r'var\(--var\(--var\(--var\(--var\(--gray-500\)-500\)-500\)-500\)-200\)', 'var(--gray-200)'),
        (r'var\(--var\(--var\(--var\(--var\(--gray-500\)-500\)-500\)-500\)-300\)', 'var(--gray-300)'),
        (r'var\(--var\(--var\(--var\(--var\(--gray-500\)-500\)-500\)-500\)-600\)', 'var(--gray-600)'),
        (r'var\(--var\(--var\(--var\(--var\(--gray-500\)-500\)-500\)-500\)-900\)', 'var(--gray-900)'),
        
        # 3重ネスト gray-500 パターン
        (r'var\(--var\(--var\(--gray-500\)-500\)-100\)', 'var(--gray-100)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-200\)', 'var(--gray-200)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-300\)', 'var(--gray-300)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-600\)', 'var(--gray-600)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-700\)', 'var(--gray-700)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-800\)', 'var(--gray-800)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-lighter\)', 'var(--gray-lighter)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-light\)', 'var(--gray-light)'),
        (r'var\(--var\(--var\(--gray-500\)-500\)-medium\)', 'var(--gray-medium)'),
        
        # 2重ネスト gray-500 パターン  
        (r'var\(--var\(--gray-500\)-400\)', 'var(--gray-400)'),
        (r'var\(--var\(--gray-500\)-500\)', 'var(--gray-500)'),
        (r'var\(--var\(--gray-500\)-600\)', 'var(--gray-600)'),
        (r'var\(--var\(--gray-500\)-700\)', 'var(--gray-700)'),
        (r'var\(--var\(--gray-500\)-800\)', 'var(--gray-800)'),
        (r'var\(--var\(--gray-500\)-900\)', 'var(--gray-900)'),
        
        # white パターン
        (r'var\(--var\(--var\(--white\)\)\)', 'var(--white)'),
        (r'var\(--var\(--white\)\)', 'var(--white)'),
        (r'var\(--var\(--var\(--white\)\)\)fff', '#ffffff'),
        (r'var\(--var\(--var\(--white\)\)\)9e6', '#9e6'),
        (r'var\(--var\(--var\(--white\)\)\)0f0', '#0f0'),
        (r'var\(--var\(--var\(--white\)\)\)3E0', '#3E0'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 変更箇所をカウント
        changes = 0
        for pattern, _ in replacements:
            changes += len(re.findall(pattern, original_content))
        
        return changes
    
    return 0

if __name__ == '__main__':
    css_files = [
        'nanashi8.github.io/src/styles/themes/dark.css',
        'nanashi8.github.io/src/components/GamificationPanel.css',
        'nanashi8.github.io/src/components/LinguisticRelationsView.css',
    ]
    
    total_changes = 0
    for css_file in css_files:
        file_path = Path(css_file)
        if file_path.exists():
            changes = fix_css_variables(file_path)
            print(f'{css_file}: {changes}箇所修正')
            total_changes += changes
        else:
            print(f'{css_file}: ファイルが見つかりません')
    
    print(f'\n合計: {total_changes}箇所の壊れたCSS変数を修正しました')
