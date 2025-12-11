#!/usr/bin/env python3
"""
CSS重複定義検出スクリプト
同じセレクタが複数回定義されている箇所を検出し、統合案を提示
"""
import re
from collections import defaultdict
from pathlib import Path

def parse_css_rules(css_content):
    """CSSルールをパースして、セレクタごとにグループ化"""
    # コメントを削除
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # セレクタとプロパティのペアを抽出
    pattern = r'([^{}]+)\s*\{([^{}]*)\}'
    matches = re.finditer(pattern, css_content)
    
    rules = defaultdict(list)
    line_numbers = defaultdict(list)
    
    for match in matches:
        selector = match.group(1).strip()
        properties = match.group(2).strip()
        start_pos = match.start()
        
        # 行番号を計算
        line_num = css_content[:start_pos].count('\n') + 1
        
        if properties:  # 空のルールは無視
            rules[selector].append(properties)
            line_numbers[selector].append(line_num)
    
    return rules, line_numbers

def detect_duplicates(css_file):
    """重複定義を検出"""
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    rules, line_numbers = parse_css_rules(content)
    
    duplicates = {}
    for selector, prop_list in rules.items():
        if len(prop_list) > 1:
            duplicates[selector] = {
                'count': len(prop_list),
                'properties': prop_list,
                'lines': line_numbers[selector]
            }
    
    return duplicates

def analyze_property_conflicts(prop_list):
    """プロパティの競合を分析"""
    all_props = defaultdict(list)
    
    for idx, props in enumerate(prop_list):
        for line in props.split('\n'):
            line = line.strip()
            if ':' in line:
                prop_name = line.split(':')[0].strip()
                prop_value = line.split(':', 1)[1].strip().rstrip(';')
                all_props[prop_name].append((idx, prop_value))
    
    conflicts = {}
    for prop_name, values in all_props.items():
        if len(set(v[1] for v in values)) > 1:  # 異なる値がある
            conflicts[prop_name] = values
    
    return conflicts

def main():
    css_file = Path(__file__).parent.parent / 'nanashi8.github.io' / 'src' / 'styles' / 'themes' / 'dark.css'
    
    print("🔍 CSS重複定義を検出中...")
    print(f"📁 ファイル: {css_file}\n")
    
    duplicates = detect_duplicates(css_file)
    
    print(f"✅ 検出完了: {len(duplicates)} 個のセレクタに重複定義があります\n")
    print("=" * 80)
    
    # 重複が多い順にソート
    sorted_duplicates = sorted(duplicates.items(), key=lambda x: x[1]['count'], reverse=True)
    
    # 上位20件を詳細表示
    print("\n📊 重複定義トップ20:\n")
    for idx, (selector, info) in enumerate(sorted_duplicates[:20], 1):
        print(f"{idx}. {selector}")
        print(f"   重複回数: {info['count']}回")
        print(f"   行番号: {', '.join(map(str, info['lines']))}")
        
        # プロパティの競合を分析
        conflicts = analyze_property_conflicts(info['properties'])
        if conflicts:
            print(f"   ⚠️  競合するプロパティ: {len(conflicts)}個")
            for prop_name, values in list(conflicts.items())[:3]:  # 最初の3つだけ表示
                print(f"      - {prop_name}:")
                for def_idx, value in values:
                    print(f"        定義{def_idx+1} (L{info['lines'][def_idx]}): {value}")
        print()
    
    # 統計情報
    total_duplicates = sum(d['count'] - 1 for d in duplicates.values())
    print("=" * 80)
    print(f"\n📈 統計:")
    print(f"   - ユニークセレクタ数: {len(duplicates)}")
    print(f"   - 削減可能な重複定義数: {total_duplicates}")
    print(f"   - 予想削減行数: 約 {total_duplicates * 5} 行")
    
    # 重複定義リストをファイルに保存
    output_file = Path(__file__).parent.parent / 'css_duplicates_report.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("CSS重複定義レポート\n")
        f.write("=" * 80 + "\n\n")
        
        for selector, info in sorted_duplicates:
            f.write(f"セレクタ: {selector}\n")
            f.write(f"重複回数: {info['count']}\n")
            f.write(f"行番号: {', '.join(map(str, info['lines']))}\n")
            
            conflicts = analyze_property_conflicts(info['properties'])
            if conflicts:
                f.write(f"競合プロパティ:\n")
                for prop_name, values in conflicts.items():
                    f.write(f"  {prop_name}:\n")
                    for def_idx, value in values:
                        f.write(f"    定義{def_idx+1} (L{info['lines'][def_idx]}): {value}\n")
            f.write("\n" + "-" * 80 + "\n\n")
    
    print(f"\n💾 詳細レポートを保存しました: {output_file}")

if __name__ == '__main__':
    main()
