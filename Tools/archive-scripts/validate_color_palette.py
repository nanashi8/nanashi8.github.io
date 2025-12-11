#!/usr/bin/env python3
"""
22色カラーパレット準拠検証スクリプト

目的:
- 全CSSファイルで直接色指定（#xxxxxx）を検出
- 22色パレット外の色を検出
- グラデーション使用を検出
- var(--xxx)形式のCSS変数使用を推奨

使用方法:
    python scripts/validate_color_palette.py

仕様書: docs/COLOR_PALETTE_SPECIFICATION.md
"""

import re
from pathlib import Path
from typing import List, Tuple

# 22色パレット定義（仕様書準拠）
APPROVED_COLORS = {
    # 基本テキスト色
    '#333333', '#666666', '#999999', '#ffffff', '#000000',
    # 成功色
    '#10b981', '#d1fae5', '#065f46',
    # エラー色
    '#ef4444', '#fee2e2', '#fecaca', '#991b1b',
    # 警告色
    '#f59e0b', '#fff3cd', '#78350f',
    # 情報色
    '#2196f3', '#e7f3ff', '#0056b3', '#60a5fa',
    # アクセント色
    '#3b82f6', '#f44336', '#9c27b0',
    # グレースケール
    '#f8f9fa', '#e9ecef', '#e0e0e0', '#cccccc', '#aaaaaa',
    # プライマリ
    '#667eea', '#8b9ef5',
}

class ColorPaletteValidator:
    def __init__(self, base_path: str = "nanashi8.github.io/src"):
        self.base_path = Path(base_path)
        self.violations = []
        
    def validate(self) -> bool:
        """22色パレット準拠を検証"""
        print("[22色カラーパレット準拠検証]")
        print()
        
        css_files = list(self.base_path.rglob("*.css"))
        
        if not css_files:
            print(f"⚠️  CSSファイルが見つかりません: {self.base_path}")
            return False
            
        print(f"検証対象: {len(css_files)}ファイル")
        print()
        
        # 検証実行
        direct_colors = self._check_direct_color_codes(css_files)
        unapproved_colors = self._check_unapproved_colors(css_files)
        gradients = self._check_gradients(css_files)
        
        # 結果表示
        has_violations = False
        
        if direct_colors:
            print(f"❌ 直接色指定検出: {len(direct_colors)}件")
            for file, line_num, line, color in direct_colors[:10]:
                print(f"  {file}:{line_num} - {color}")
            if len(direct_colors) > 10:
                print(f"  ... 他 {len(direct_colors) - 10}件")
            print()
            has_violations = True
        else:
            print("✅ 直接色指定: なし")
            
        if unapproved_colors:
            print(f"❌ 22色パレット外の色: {len(unapproved_colors)}件")
            for file, line_num, line, color in unapproved_colors[:10]:
                print(f"  {file}:{line_num} - {color}")
            if len(unapproved_colors) > 10:
                print(f"  ... 他 {len(unapproved_colors) - 10}件")
            print()
            has_violations = True
        else:
            print("✅ 22色パレット外の色: なし")
            
        if gradients:
            print(f"❌ グラデーション使用: {len(gradients)}件")
            for file, line_num, line in gradients[:10]:
                print(f"  {file}:{line_num}")
            if len(gradients) > 10:
                print(f"  ... 他 {len(gradients) - 10}件")
            print()
            has_violations = True
        else:
            print("✅ グラデーション: なし")
            
        print()
        
        if has_violations:
            print("❌ 22色パレット準拠違反が見つかりました")
            print()
            print("修正方法:")
            print("  1. 直接色指定を var(--xxx) 形式に変更")
            print("  2. 22色パレット外の色を承認色に置き換え")
            print("  3. グラデーションを単色に変更")
            print()
            print("仕様書: docs/COLOR_PALETTE_SPECIFICATION.md")
            return False
        else:
            print("✅ 全て22色パレットに準拠しています")
            return True
            
    def _check_direct_color_codes(self, files: List[Path]) -> List[Tuple]:
        """直接色指定（#xxxxxx）を検出（var()内を除く）"""
        violations = []
        color_pattern = re.compile(r'(?<!var\(--[a-z-]*):?\s*(#[0-9a-fA-F]{3,6})')
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f, 1):
                        # var(--xxx)内の色は除外
                        if 'var(--' in line:
                            continue
                            
                        matches = color_pattern.findall(line)
                        for color in matches:
                            violations.append((
                                str(file_path.relative_to(self.base_path.parent)),
                                i,
                                line.strip(),
                                color.lower()
                            ))
            except Exception as e:
                print(f"⚠️  ファイル読み込みエラー: {file_path} - {e}")
                
        return violations
        
    def _check_unapproved_colors(self, files: List[Path]) -> List[Tuple]:
        """22色パレット外の色を検出"""
        violations = []
        color_pattern = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})')
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f, 1):
                        # var(--xxx)内の色のみチェック（CSS変数定義）
                        if '--' not in line:
                            continue
                            
                        matches = color_pattern.findall(line)
                        for color_code in matches:
                            # 3桁を6桁に変換
                            if len(color_code) == 3:
                                color_code = ''.join([c*2 for c in color_code])
                            
                            color = f'#{color_code.lower()}'
                            
                            if color not in APPROVED_COLORS:
                                violations.append((
                                    str(file_path.relative_to(self.base_path.parent)),
                                    i,
                                    line.strip(),
                                    color
                                ))
            except Exception as e:
                print(f"⚠️  ファイル読み込みエラー: {file_path} - {e}")
                
        return violations
        
    def _check_gradients(self, files: List[Path]) -> List[Tuple]:
        """linear-gradient使用を検出"""
        violations = []
        gradient_pattern = re.compile(r'linear-gradient\s*\(')
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f, 1):
                        if gradient_pattern.search(line):
                            violations.append((
                                str(file_path.relative_to(self.base_path.parent)),
                                i,
                                line.strip()
                            ))
            except Exception as e:
                print(f"⚠️  ファイル読み込みエラー: {file_path} - {e}")
                
        return violations

def main():
    validator = ColorPaletteValidator()
    success = validator.validate()
    
    if not success:
        exit(1)

if __name__ == "__main__":
    main()
