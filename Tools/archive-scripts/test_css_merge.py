#!/usr/bin/env python3
"""
CSS重複定義統合のテストスクリプト
.calendar-dayなど数個のセレクタで検証
"""
import re
from pathlib import Path
from collections import defaultdict, OrderedDict

def parse_css_rules_simple(css_content, target_selectors):
    """指定されたセレクタのみを抽出"""
    rules = defaultdict(list)
    
    # 各セレクタのブロックを抽出
    for selector in target_selectors:
        # エスケープ
        escaped_selector = re.escape(selector)
        pattern = rf'({escaped_selector}\s*{{[^{{}}]*}})'
        
        matches = re.finditer(pattern, css_content, re.MULTILINE)
        for match in matches:
            full_block = match.group(1)
            start_pos = match.start()
            line_num = css_content[:start_pos].count('\n') + 1
            
            # プロパティ部分を抽出
            props_match = re.search(r'{([^}]*)}', full_block)
            if props_match:
                properties = props_match.group(1).strip()
                rules[selector].append({
                    'properties': properties,
                    'line': line_num,
                    'full_block': full_block
                })
    
    return rules

def merge_properties(prop_list):
    """プロパティをマージ（後方優先）"""
    merged = OrderedDict()
    
    for item in prop_list:
        props = item['properties']
        for line in props.split('\n'):
            line = line.strip()
            if ':' in line and not line.startswith('/*'):
                # セミコロンを除去
                line = line.rstrip(';')
                parts = line.split(':', 1)
                if len(parts) == 2:
                    prop_name = parts[0].strip()
                    prop_value = parts[1].strip()
                    merged[prop_name] = prop_value
    
    return merged

def test_merge(css_file, test_selectors):
    """テスト実行"""
    print(f"🧪 テスト対象セレクタ: {', '.join(test_selectors)}\n")
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    rules = parse_css_rules_simple(content, test_selectors)
    
    for selector, items in rules.items():
        print(f"{'='*80}")
        print(f"セレクタ: {selector}")
        print(f"重複数: {len(items)}")
        print(f"行番号: {', '.join(str(item['line']) for item in items)}")
        print()
        
        if len(items) > 1:
            # 各定義を表示
            for idx, item in enumerate(items, 1):
                print(f"  📍 定義 {idx} (行 {item['line']}):")
                for line in item['properties'].split('\n'):
                    if line.strip():
                        print(f"      {line.strip()}")
                print()
            
            # マージ結果
            merged = merge_properties(items)
            print(f"  ✅ マージ後:")
            print(f"  {selector} {{")
            for prop_name, prop_value in merged.items():
                print(f"    {prop_name}: {prop_value};")
            print(f"  }}")
            print()
            
            # 変更点を分析
            print(f"  📊 変更の影響:")
            all_props = defaultdict(list)
            for idx, item in enumerate(items, 1):
                for line in item['properties'].split('\n'):
                    line = line.strip().rstrip(';')
                    if ':' in line:
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            prop_name = parts[0].strip()
                            prop_value = parts[1].strip()
                            all_props[prop_name].append((idx, item['line'], prop_value))
            
            for prop_name, values in all_props.items():
                if len(set(v[2] for v in values)) > 1:
                    print(f"    ⚠️  {prop_name}: 複数の値あり")
                    for def_idx, line_num, value in values:
                        print(f"       定義{def_idx} (L{line_num}): {value}")
                    final_value = merged[prop_name]
                    print(f"       → 採用: {final_value}")
        else:
            print(f"  ℹ️  重複なし")
        
        print()

def main():
    css_file = Path(__file__).parent.parent / 'nanashi8.github.io' / 'src' / 'styles' / 'themes' / 'dark.css'
    
    # テスト対象（重複が確認されているセレクタ）
    test_selectors = [
        '.calendar-day',
        '.dark-mode .calendar-day',
        '.word-rank',
        '.word-text',
        '.dark-mode .word-text'
    ]
    
    print("🔬 CSS重複統合テスト\n")
    test_merge(css_file, test_selectors)
    
    print("="*80)
    print("\n✅ テスト完了")
    print("\n💡 次のステップ:")
    print("   1. マージ結果が正しいことを確認")
    print("   2. 後方の定義が優先されていることを確認")
    print("   3. 問題なければ本番実行")

if __name__ == '__main__':
    main()
