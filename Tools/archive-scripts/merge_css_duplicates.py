#!/usr/bin/env python3
"""
CSS重複定義を安全に統合するスクリプト
後方の定義を優先し、UIの見た目を維持
"""
import re
from pathlib import Path
from collections import defaultdict, OrderedDict

def parse_css_with_positions(css_content):
    """CSSをパースして位置情報付きで抽出"""
    # コメントを保持したままパース
    rules = []
    
    # セレクタとプロパティのペアを抽出（ネストは考慮しない）
    pattern = r'([^{}]+)\s*\{([^{}]*)\}'
    
    for match in re.finditer(pattern, css_content):
        selector = match.group(1).strip()
        properties = match.group(2).strip()
        start = match.start()
        end = match.end()
        line_num = css_content[:start].count('\n') + 1
        
        # @keyframesやメディアクエリは別扱い
        if selector.startswith('@'):
            rules.append({
                'type': 'at-rule',
                'selector': selector,
                'content': match.group(0),
                'start': start,
                'end': end,
                'line': line_num
            })
        elif properties:
            rules.append({
                'type': 'rule',
                'selector': selector,
                'properties': properties,
                'start': start,
                'end': end,
                'line': line_num
            })
    
    return rules

def merge_properties(prop_lists):
    """複数のプロパティリストをマージ（後方優先）"""
    merged = OrderedDict()
    
    for props in prop_lists:
        for line in props.split('\n'):
            line = line.strip()
            if ':' in line and not line.startswith('/*'):
                # プロパティ名と値を分離
                parts = line.split(':', 1)
                if len(parts) == 2:
                    prop_name = parts[0].strip()
                    prop_value = parts[1].strip()
                    merged[prop_name] = prop_value
    
    return merged

def generate_merged_css(rules):
    """重複を統合した新しいCSSを生成"""
    # セレクタごとにグループ化
    selector_groups = defaultdict(list)
    
    for rule in rules:
        if rule['type'] == 'rule':
            selector_groups[rule['selector']].append(rule)
    
    # 新しいCSSを構築
    output_rules = []
    processed_selectors = set()
    
    for rule in rules:
        if rule['type'] == 'at-rule':
            # @ルールはそのまま保持
            output_rules.append(rule['content'])
        elif rule['type'] == 'rule':
            selector = rule['selector']
            
            # まだ処理していないセレクタの場合
            if selector not in processed_selectors:
                group = selector_groups[selector]
                
                if len(group) > 1:
                    # 重複がある場合：マージ
                    prop_lists = [r['properties'] for r in group]
                    merged_props = merge_properties(prop_lists)
                    
                    # コメントを追加
                    comment = f"/* 統合: {len(group)}個の定義をマージ (元の行: {', '.join(str(r['line']) for r in group)}) */\n"
                    
                    # プロパティを整形
                    props_text = '\n  '.join(f"{k} {v}" for k, v in merged_props.items())
                    
                    output_rules.append(f"{comment}{selector} {{\n  {props_text}\n}}")
                else:
                    # 重複なし：そのまま
                    output_rules.append(f"{selector} {{\n  {rule['properties']}\n}}")
                
                processed_selectors.add(selector)
    
    return '\n\n'.join(output_rules)

def create_backup(file_path):
    """バックアップを作成"""
    backup_path = file_path.with_suffix('.css.backup')
    import shutil
    shutil.copy2(file_path, backup_path)
    return backup_path

def main():
    css_file = Path(__file__).parent.parent / 'nanashi8.github.io' / 'src' / 'styles' / 'themes' / 'dark.css'
    
    print("🔄 CSS重複定義の統合を開始します...")
    print(f"📁 対象ファイル: {css_file}\n")
    
    # バックアップ作成
    print("💾 バックアップを作成中...")
    backup_file = create_backup(css_file)
    print(f"✅ バックアップ完了: {backup_file}\n")
    
    # CSSを読み込み
    with open(css_file, 'r', encoding='utf-8') as f:
        original_content = f.read()
    
    original_lines = len(original_content.split('\n'))
    print(f"📊 元のファイル: {original_lines:,} 行\n")
    
    # パースして統合
    print("🔍 CSSをパース中...")
    rules = parse_css_with_positions(original_content)
    
    print("🔨 重複定義をマージ中...")
    merged_css = generate_merged_css(rules)
    
    merged_lines = len(merged_css.split('\n'))
    reduction = original_lines - merged_lines
    reduction_percent = (reduction / original_lines) * 100
    
    print(f"\n📈 結果:")
    print(f"   - 元の行数: {original_lines:,} 行")
    print(f"   - 統合後: {merged_lines:,} 行")
    print(f"   - 削減: {reduction:,} 行 ({reduction_percent:.1f}%)")
    
    # プレビューモード
    print(f"\n⚠️  これは破壊的な操作です。")
    print(f"   バックアップは {backup_file} に保存されています。")
    
    response = input("\n統合したCSSを保存しますか? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        # 保存
        output_file = css_file.with_name('dark.merged.css')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(merged_css)
        
        print(f"\n✅ 統合完了！")
        print(f"   新しいファイル: {output_file}")
        print(f"\n次のステップ:")
        print(f"   1. {output_file} の内容を確認")
        print(f"   2. 問題なければ元のファイルを置き換え:")
        print(f"      mv {output_file} {css_file}")
        print(f"   3. ブラウザで動作確認")
        print(f"   4. 問題があればバックアップから復元:")
        print(f"      mv {backup_file} {css_file}")
    else:
        print("\n❌ キャンセルしました。")

if __name__ == '__main__':
    main()
