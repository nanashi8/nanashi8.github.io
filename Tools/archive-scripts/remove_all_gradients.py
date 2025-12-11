#!/usr/bin/env python3
"""全CSSファイルからlinear-gradientを削除し、単色に置き換えるスクリプト"""

import re
from pathlib import Path

# 処理対象ファイル
FILES = [
    "nanashi8.github.io/src/styles/themes/dark.css",
    "nanashi8.github.io/src/components/GrammarQuizView.css",
    "nanashi8.github.io/src/components/GamificationPanel.css",
    "nanashi8.github.io/src/components/LinguisticRelationsView.css",
    "nanashi8.github.io/src/index.css",
]

# グラデーション置換パターン
GRADIENT_REPLACEMENTS = {
    # Primary gradients
    r'linear-gradient\(135deg,\s*var\(--btn-primary-bg\)\s*0%,\s*var\(--gradient-primary-end\)\s*100%\)': 'var(--btn-primary-bg)',
    r'linear-gradient\(135deg,\s*#667eea\s*0%,\s*#764ba2\s*100%\)': '#667eea',
    r'linear-gradient\(135deg,\s*#4f5bd5\s*0%,\s*#6a3d8f\s*100%\)': '#4f5bd5',
    r'linear-gradient\(135deg,\s*#5568d3\s*0%,\s*#653a8a\s*100%\)': '#5568d3',
    r'linear-gradient\(135deg,\s*#4c6ef5\s*0%,\s*#5f3d8a\s*100%\)': '#4c6ef5',
    r'linear-gradient\(135deg,\s*var\(--btn-primary-light\)\s*0%,\s*#9d7fc2\s*100%\)': 'var(--btn-primary-light)',
    r'linear-gradient\(135deg,\s*var\(--btn-primary-light\)\s*0%,\s*#9b7bc4\s*100%\)': 'var(--btn-primary-light)',
    r'linear-gradient\(135deg,\s*#8b9ef5\s*0%,\s*#9d7fc2\s*100%\)': '#8b9ef5',
    r'linear-gradient\(135deg,\s*var\(--btn-primary-hover\)\s*0%,\s*#653a8a\s*100%\)': 'var(--btn-primary-hover)',
    r'linear-gradient\(90deg,\s*var\(--btn-primary-bg\)\s*0%,\s*var\(--gradient-primary-end\)\s*100%\)': 'var(--btn-primary-bg)',
    r'linear-gradient\(to\s+top,\s*var\(--btn-primary-bg\),\s*var\(--gradient-primary-end\)\)': 'var(--btn-primary-bg)',
    r'linear-gradient\(to\s+right,\s*var\(--accent-indigo\)\s*0%,\s*var\(--btn-primary-bg\)\s*50%,\s*var\(--gradient-primary-end\)\s*100%\)': 'var(--btn-primary-bg)',
    
    # Subtle/transparent gradients
    r'linear-gradient\(135deg,\s*rgba\(102,\s*126,\s*234,\s*0\.2\)\s*0%,\s*rgba\(118,\s*75,\s*162,\s*0\.2\)\s*100%\)': 'rgba(102, 126, 234, 0.2)',
    r'linear-gradient\(135deg,\s*rgba\(102,\s*126,\s*234,\s*0\.1\)\s*0%,\s*rgba\(118,\s*75,\s*162,\s*0\.1\)\s*100%\)': 'rgba(102, 126, 234, 0.1)',
    r'linear-gradient\(to\s+right,\s*rgba\(102,\s*126,\s*234,\s*0\.3\),\s*var\(--btn-primary-bg\)\)': 'var(--btn-primary-bg)',
    
    # Success gradients
    r'linear-gradient\(135deg,\s*var\(--success-color\)\s*0%,\s*#059669\s*100%\)': 'var(--success-color)',
    r'linear-gradient\(135deg,\s*#10b981\s*0%,\s*#059669\s*100%\)': '#10b981',
    r'linear-gradient\(90deg,\s*var\(--success-color\)\s*0%,\s*#34d399\s*100%\)': 'var(--success-color)',
    r'linear-gradient\(90deg,\s*var\(--success-color\)\s*0%,\s*var\(--accent-blue\)\s*100%\)': 'var(--success-color)',
    r'linear-gradient\(90deg,\s*var\(--success-border\)\s*0%,\s*#81C784\s*100%\)': 'var(--success-border)',
    r'linear-gradient\(135deg,\s*var\(--success-green-dark\)\s*0%,\s*#20c997\s*100%\)': 'var(--success-green-dark)',
    r'linear-gradient\(135deg,\s*#d1fae5\s*0%,\s*#a7f3d0\s*100%\)': '#d1fae5',
    
    # Warning gradients
    r'linear-gradient\(135deg,\s*var\(--warning-color\)\s*0%,\s*#d97706\s*100%\)': 'var(--warning-color)',
    r'linear-gradient\(135deg,\s*#f59e0b\s*0%,\s*#d97706\s*100%\)': '#f59e0b',
    r'linear-gradient\(90deg,\s*var\(--warning-color\)\s*0%,\s*#fbbf24\s*100%\)': 'var(--warning-color)',
    r'linear-gradient\(135deg,\s*var\(--warning-yellow\)\s*0%,\s*#fd7e14\s*100%\)': 'var(--warning-yellow)',
    r'linear-gradient\(135deg,\s*#fbbf24\s*0%,\s*#f59e0b\s*100%\)': '#fbbf24',
    r'linear-gradient\(135deg,\s*#fef3c7\s*0%,\s*#fde68a\s*100%\)': '#fef3c7',
    r'linear-gradient\(135deg,\s*var\(--warning-bg\)\s*0%,\s*#fff\s*100%\)': 'var(--warning-bg)',
    r'linear-gradient\(135deg,\s*#3a3a1a\s*0%,\s*#2a2a1a\s*100%\)': '#3a3a1a',
    r'linear-gradient\(to\s+right,\s*#fff9e6\s*0%,\s*var\(--background\)\s*100%\)': '#fff9e6',
    r'linear-gradient\(to\s+right,\s*#3a3000\s*0%,\s*var\(--text-color\)\s*100%\)': '#3a3000',
    r'linear-gradient\(135deg,\s*#fff9e6\s*0%,\s*#fff3d4\s*100%\)': '#fff9e6',
    r'linear-gradient\(135deg,\s*#3d3520\s*0%,\s*#453b25\s*100%\)': '#3d3520',
    r'linear-gradient\(135deg,\s*#4a4a2a\s*0%,\s*var\(--text-color\)\s*100%\)': '#4a4a2a',
    
    # Error gradients
    r'linear-gradient\(135deg,\s*var\(--error-color\)\s*0%,\s*#dc2626\s*100%\)': 'var(--error-color)',
    r'linear-gradient\(135deg,\s*#ef4444\s*0%,\s*#dc2626\s*100%\)': '#ef4444',
    r'linear-gradient\(90deg,\s*var\(--error-color\)\s*0%,\s*#f87171\s*100%\)': 'var(--error-color)',
    r'linear-gradient\(135deg,\s*var\(--error-red-dark\)\s*0%,\s*#e83e8c\s*100%\)': 'var(--error-red-dark)',
    r'linear-gradient\(135deg,\s*#fee2e2\s*0%,\s*#fecaca\s*100%\)': '#fee2e2',
    r'linear-gradient\(135deg,\s*#f093fb\s*0%,\s*var\(--error-pink\)\s*100%\)': '#f093fb',
    r'linear-gradient\(135deg,\s*#f093fb\s*0%,\s*#f5576c\s*100%\)': '#f093fb',
    r'linear-gradient\(135deg,\s*#ff5252\s*0%,\s*var\(--accent-red\)\s*100%\)': '#ff5252',
    r'linear-gradient\(135deg,\s*#5f1e1e\s*0%,\s*var\(--text-color\)\s*100%\)': '#5f1e1e',
    
    # Info/Blue gradients
    r'linear-gradient\(90deg,\s*var\(--accent-blue\)\s*0%,\s*#60a5fa\s*100%\)': 'var(--accent-blue)',
    r'linear-gradient\(135deg,\s*#3b82f6\s*0%,\s*#2563eb\s*100%\)': '#3b82f6',
    r'linear-gradient\(90deg,\s*#2196F3\s*0%,\s*#64B5F6\s*100%\)': '#2196F3',
    r'linear-gradient\(135deg,\s*var\(--accent-indigo\)\s*0%,\s*#f8f9ff\s*100%\)': 'var(--accent-indigo)',
    r'linear-gradient\(to\s+right,\s*var\(--accent-indigo\),\s*var\(--btn-primary-bg\)\)': 'var(--accent-indigo)',
    r'linear-gradient\(135deg,\s*#1e3a5f\s*0%,\s*#2a4a6a\s*100%\)': '#1e3a5f',
    r'linear-gradient\(135deg,\s*#e6f2ff\s*0%,\s*#f0f8ff\s*100%\)': '#e6f2ff',
    r'linear-gradient\(135deg,\s*#e3f2fd\s*0%,\s*#fff\s*100%\)': '#e3f2fd',
    r'linear-gradient\(135deg,\s*#1e3a5f\s*0%,\s*var\(--text-color\)\s*100%\)': '#1e3a5f',
    r'linear-gradient\(135deg,\s*#E3F2FD\s*0%,\s*#BBDEFB\s*100%\)': '#E3F2FD',
    
    # Purple gradients
    r'linear-gradient\(90deg,\s*#9C27B0\s*0%,\s*#BA68C8\s*100%\)': '#9C27B0',
    r'linear-gradient\(135deg,\s*#F3E5F5\s*0%,\s*#E1BEE7\s*100%\)': '#F3E5F5',
    
    # Gray gradients
    r'linear-gradient\(135deg,\s*#6b7280\s*0%,\s*#4b5563\s*100%\)': '#6b7280',
    r'linear-gradient\(135deg,\s*var\(--text-color\)\s*0%,\s*#1e1e1e\s*100%\)': 'var(--text-color)',
    r'linear-gradient\(135deg,\s*#9e9e9e\s*0%,\s*#757575\s*100%\)': '#9e9e9e',
    r'linear-gradient\(135deg,\s*#7e7e7e\s*0%,\s*#616161\s*100%\)': '#7e7e7e',
    r'linear-gradient\(135deg,\s*#868e96\s*0%,\s*#495057\s*100%\)': '#868e96',
    r'linear-gradient\(135deg,\s*#6c757d\s*0%,\s*#343a40\s*100%\)': '#6c757d',
    
    # Background gradients
    r'linear-gradient\(135deg,\s*var\(--bg-secondary\)\s*0%,\s*var\(--background\)\s*100%\)': 'var(--bg-secondary)',
    r'linear-gradient\(135deg,\s*var\(--bg-primary\)\s*0%,\s*var\(--bg-secondary\)\s*100%\)': 'var(--bg-primary)',
    r'linear-gradient\(135deg,\s*#f5f7ff\s*0%,\s*var\(--background\)\s*100%\)': '#f5f7ff',
    r'linear-gradient\(to\s+right,\s*#2a2a3a\s*0%,\s*var\(--btn-primary-bg\)\s*50%,\s*var\(--gradient-primary-end\)\s*100%\)': '#2a2a3a',
    
    # Specialty gradients
    r'linear-gradient\(90deg,\s*#00f260\s*0%,\s*#0575e6\s*100%\)': '#00f260',
    r'linear-gradient\(90deg,\s*var\(--primary-color\),\s*var\(--secondary-color\)\)': 'var(--primary-color)',
    r'linear-gradient\(135deg,\s*var\(--primary-color\),\s*var\(--secondary-color\)\)': 'var(--primary-color)',
    r'linear-gradient\(to\s+right,\s*var\(--success-green-dark\)\s*0%,\s*var\(--warning-yellow\)\s*50%,\s*var\(--error-red-dark\)\s*100%\)': 'var(--success-green-dark)',
    r'linear-gradient\(135deg,\s*#a8edea\s*0%,\s*#fed6e3\s*100%\)': '#a8edea',
    r'linear-gradient\(135deg,\s*#4facfe\s*0%,\s*#00f2fe\s*100%\)': '#4facfe',
    r'linear-gradient\(135deg,\s*#43e97b\s*0%,\s*#38f9d7\s*100%\)': '#43e97b',
    r'linear-gradient\(135deg,\s*#FFF3E0\s*0%,\s*#FFE0B2\s*100%\)': '#FFF3E0',
    r'linear-gradient\(135deg,\s*#ffe0b2\s*0%,\s*#fff\s*100%\)': '#ffe0b2',
    r'linear-gradient\(135deg,\s*#5f3e1e\s*0%,\s*var\(--text-color\)\s*100%\)': '#5f3e1e',
    r'linear-gradient\(135deg,\s*#ffebee\s*0%,\s*#fff\s*100%\)': '#ffebee',
    r'linear-gradient\(135deg,\s*#ffa94d\s*0%,\s*#ff6b35\s*100%\)': '#ffa94d',
    r'linear-gradient\(135deg,\s*#ff922b\s*0%,\s*#e8590c\s*100%\)': '#ff922b',
    r'linear-gradient\(135deg,\s*#3b5bdb\s*0%,\s*#4e3270\s*100%\)': '#3b5bdb',
    r'linear-gradient\(135deg,\s*#E8EAF6\s*0%,\s*#C5CAE9\s*100%\)': '#E8EAF6',
    r'linear-gradient\(135deg,\s*#E8F5E9\s*0%,\s*#C8E6C9\s*100%\)': '#E8F5E9',
}

def remove_gradients_from_file(file_path: Path) -> None:
    """ファイルからグラデーションを削除"""
    if not file_path.exists():
        print(f"⚠️  File not found: {file_path}")
        return
    
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    
    # 全置換パターンを適用
    replacements_made = 0
    for pattern, replacement in GRADIENT_REPLACEMENTS.items():
        matches = len(re.findall(pattern, content))
        if matches > 0:
            content = re.sub(pattern, replacement, content)
            replacements_made += matches
            print(f"  ✓ Replaced {matches} occurrence(s) of pattern")
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        print(f"✅ {file_path.name}: {replacements_made} gradient(s) replaced")
    else:
        print(f"ℹ️  {file_path.name}: No gradients found")

def main():
    """メイン処理"""
    base_path = Path(__file__).parent.parent
    
    print("=" * 60)
    print("グラデーション削除スクリプト実行開始")
    print("=" * 60)
    
    for file_rel_path in FILES:
        file_path = base_path / file_rel_path
        print(f"\n処理中: {file_rel_path}")
        remove_gradients_from_file(file_path)
    
    print("\n" + "=" * 60)
    print("✅ 全ファイルの処理が完了しました")
    print("=" * 60)

if __name__ == "__main__":
    main()
