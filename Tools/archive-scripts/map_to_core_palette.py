#!/usr/bin/env python3
"""
既存の71変数を22色コアパレットにマッピングするスクリプト
"""

# 71変数 → 22色のマッピングテーブル
VARIABLE_MAPPING = {
    # Primary系を統合
    'btn-primary-bg': 'primary',
    'btn-primary-hover': 'primary-hover',
    'btn-primary-light': 'primary-light',
    'btn-primary-text': 'text',  # 白テキストは削除し、用途に応じてtextを使用
    'primary-color': 'primary',
    'gradient-primary': 'primary',
    'gradient-primary-start': 'primary',
    'gradient-primary-end': 'primary-hover',
    'gradient-primary-medium': 'primary-hover',
    'gradient-primary-dark': 'primary-hover',
    'gradient-primary-blue': 'primary',
    'accent-purple': 'primary',  # アクセント色はプライマリに統合
    
    # Gray系を6段階に統合
    'gray-lighter': 'gray-50',
    'gray-light': 'gray-100',
    'gray-200': 'gray-100',
    'gray-400': 'gray-300',
    'gray-medium': 'gray-600',
    'gray-500': 'gray-600',
    'gray-700': 'gray-800',
    
    # Success系を2色に統合
    'success-color': 'success',
    'success-dark': 'success',
    'success-light': 'success',
    'success-green-dark': 'success',
    'success-green-darker': 'success',
    'success-text': 'success',
    'success-text-dark': 'success',
    'success-text-darker': 'success',
    'success-text-light': 'success',
    'success-text-green': 'success',
    'success-border': 'success',
    'success-bg-hover': 'success-bg',
    'success-bg-light': 'success-bg',
    'gradient-success': 'success',
    
    # Error系を2色に統合
    'error-color': 'error',
    'error-light': 'error',
    'error-dark': 'error',
    'error-red-dark': 'error',
    'error-red-darker': 'error',
    'error-bright': 'error',
    'error-pink': 'error',
    'error-text': 'error',
    'error-text-dark': 'error',
    'error-text-light': 'error',
    'error-border': 'error',
    'error-bg-hover': 'error-bg',
    'error-bg-light': 'error-bg',
    'gradient-error': 'error',
    'gradient-pink-error': 'error',
    
    # Warning系を2色に統合
    'warning-color': 'warning',
    'warning-dark': 'warning',
    'warning-light': 'warning',
    'warning-yellow': 'warning',
    'warning-gold': 'warning',
    'warning-text': 'warning',
    'warning-text-dark': 'warning',
    'warning-border': 'warning',
    'warning-bg-hover': 'warning-bg',
    'warning-bg-light': 'warning-bg',
    'gradient-warning': 'warning',
    'gold-color': 'warning',  # ゴールド系はwarningに統合
    'gold-light': 'warning',
    
    # Info系を2色に統合
    'info-color': 'info',
    'info-blue': 'info',
    'info-blue-light': 'info',
    'info-blue-lighter': 'info',
    'info-blue-lightest': 'info-bg',
    'info-text': 'info',
    'info-text-dark': 'info',
    'info-border': 'info',
    'info-bg-hover': 'info-bg',
    'info-bg-dark': 'gray-800',  # ダーク背景はgrayに
    'info-bg-darker': 'gray-900',
    'info-bg-darkest': 'gray-900',
    'gradient-info': 'info',
    'accent-blue': 'info',
    'accent-blue-light': 'info',
    
    # その他のアクセントカラーを削除/統合
    'accent-orange': 'warning',
    'accent-red': 'error',
    'accent-indigo': 'primary',
    
    # Background系を統合
    'bg-primary': 'background',
    'background-light': 'background',
    'background-dark': 'background',  # ダークモードで値が変わる
    'bg-tertiary': 'gray-100',
    'bg-secondary': 'gray-50',
    'bg-lavender': 'gray-50',
    'bg-light-blue': 'gray-50',
    'bg-dark': 'gray-900',
    'bg-darker': 'gray-900',
    'gradient-gray': 'gray-100',
    
    # Text系を統合
    'text-color': 'text',
    'text-color-light': 'text',  # ダークモードで値が変わる
    'text-primary': 'text',
    'text-muted': 'text-secondary',
    'text-tertiary': 'text-secondary',
    
    # Border系を統合
    'border-color': 'border',
    'border-color-light': 'gray-100',
    
    # Button系を統合
    'btn-secondary-bg': 'gray-600',
    'btn-secondary-hover': 'gray-800',
    'btn-secondary-text': 'text',
    'btn-disabled-bg': 'gray-100',
    'btn-disabled-text': 'gray-600',
    
    # Card系を統合
    'card-bg': 'background',
    'card-bg-hover': 'gray-50',
    'card-border': 'border',
    'card-shadow': 'shadow-sm',  # シャドウは削除予定
    
    # Link系を統合
    'link-color': 'info',
    'link-hover': 'primary-hover',
    'focus-ring': 'primary-light',
    
    # Overlay系を削除（CSSで直接rgba指定）
    'overlay-bg': None,  # rgba(0,0,0,0.5)
    'overlay-light': None,  # rgba(255,255,255,0.8)
    'overlay-xs': None,
    'backdrop-blur': None,
    
    # Shadow系を削除（CSSで直接指定）
    'shadow-xs': None,
    'shadow-sm': None,
    'shadow-md': None,
    'shadow-lg': None,
    
    # Gradient fade/subtle系を削除（CSSで生成）
    'gradient-primary-fade': None,
    'gradient-primary-subtle': None,
    'gradient-purple': None,
    
    # その他削除
    'white': None,  # #ffffff を直接指定
    'black': None,  # #000000 を直接指定
    'transition-speed': None,  # 0.3s を直接指定
}

def generate_mapping_report():
    """マッピング結果のレポートを生成"""
    
    print("=" * 60)
    print("22色コアパレット マッピングレポート")
    print("=" * 60)
    print()
    
    # 22色ごとにグループ化
    core_22_colors = [
        'primary', 'primary-hover', 'primary-light',
        'gray-50', 'gray-100', 'gray-300', 'gray-600', 'gray-800', 'gray-900',
        'success', 'success-bg',
        'error', 'error-bg',
        'warning', 'warning-bg',
        'info', 'info-bg',
        'text', 'text-secondary',
        'background', 'bg-secondary', 'border'
    ]
    
    for core_color in core_22_colors:
        mapped_vars = [old for old, new in VARIABLE_MAPPING.items() if new == core_color]
        if mapped_vars:
            print(f"✅ --{core_color}")
            for old_var in mapped_vars:
                print(f"   ← --{old_var}")
            print()
    
    # 削除される変数
    deleted_vars = [old for old, new in VARIABLE_MAPPING.items() if new is None]
    print("\n❌ 削除される変数（CSS直接指定に変更）:")
    for var in deleted_vars:
        print(f"   --{var}")
    
    print("\n" + "=" * 60)
    print(f"統合: {len(VARIABLE_MAPPING)} 変数 → 22 色")
    print(f"削除: {len(deleted_vars)} 変数")
    print("=" * 60)

def apply_variable_mapping(project_root: str):
    """CSS変数のマッピングを全CSSファイルに適用"""
    import re
    from pathlib import Path
    
    project_path = Path(project_root)
    css_files = list(project_path.glob('**/*.css'))
    
    # node_modules と dist を除外
    css_files = [f for f in css_files if 'node_modules' not in str(f) and 'dist' not in str(f)]
    
    print(f"\n🔧 {len(css_files)} CSSファイルにマッピングを適用中...")
    
    total_replacements = 0
    
    for css_file in css_files:
        try:
            content = css_file.read_text(encoding='utf-8')
            original_content = content
            file_replacements = 0
            
            # var(--old-variable) を var(--new-variable) に置換
            for old_var, new_var in VARIABLE_MAPPING.items():
                if new_var is None:
                    continue  # 削除対象はスキップ
                
                # パターン: var(--old-variable)
                pattern = re.compile(rf'var\(--{re.escape(old_var)}\)')
                matches = pattern.findall(content)
                
                if matches:
                    replacement = f'var(--{new_var})'
                    content = pattern.sub(replacement, content)
                    file_replacements += len(matches)
            
            # 変更があれば書き戻し
            if content != original_content:
                css_file.write_text(content, encoding='utf-8')
                total_replacements += file_replacements
                print(f"   ✓ {css_file.relative_to(project_path)}: {file_replacements} 置換")
        
        except Exception as e:
            print(f"   ❌ {css_file} の処理に失敗: {e}")
    
    print(f"\n✅ 合計置換数: {total_replacements}")
    print("=" * 60)


if __name__ == '__main__':
    import sys
    import os
    
    if len(sys.argv) > 1 and sys.argv[1] == '--apply':
        # マッピング適用モード
        # プロジェクトルートを自動検出（スクリプトの親ディレクトリ）
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        apply_variable_mapping(project_root)
    else:
        # レポートモード（デフォルト）
        generate_mapping_report()
