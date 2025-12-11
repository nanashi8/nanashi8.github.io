#!/usr/bin/env python3
"""
CSS重複定義を安全に統合（メディアクエリ考慮版）
"""
import re
from pathlib import Path
from collections import defaultdict, OrderedDict

def extract_media_queries(css_content):
    """メディアクエリを抽出して除外"""
    media_pattern = r'@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}'
    media_queries = []
    
    for match in re.finditer(media_pattern, css_content, re.DOTALL):
        media_queries.append({
            'content': match.group(0),
            'start': match.start(),
            'end': match.end()
        })
    
    return media_queries

def remove_media_queries(css_content):
    """メディアクエリを一時的に削除"""
    media_pattern = r'@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}'
    placeholders = []
    
    def replacer(match):
        idx = len(placeholders)
        placeholders.append(match.group(0))
        return f'/*__MEDIA_QUERY_{idx}__*/'
    
    cleaned = re.sub(media_pattern, replacer, css_content, flags=re.DOTALL)
    return cleaned, placeholders

def restore_media_queries(css_content, placeholders):
    """メディアクエリを復元"""
    for idx, content in enumerate(placeholders):
        css_content = css_content.replace(f'/*__MEDIA_QUERY_{idx}__*/', content)
    return css_content

def parse_rules(css_content):
    """通常のルールのみをパース（メディアクエリ除外済み）"""
    rules = defaultdict(list)
    
    # セレクタとプロパティのペアを抽出
    pattern = r'([^{}@]+)\s*\{([^{}]*)\}'
    
    for match in re.finditer(pattern, css_content):
        selector = match.group(1).strip()
        properties = match.group(2).strip()
        start = match.start()
        line_num = css_content[:start].count('\n') + 1
        
        # コメントや空のルールはスキップ
        if properties and not selector.startswith('/*'):
            rules[selector].append({
                'properties': properties,
                'line': line_num,
                'start': start,
                'end': match.end()
            })
    
    return rules

def merge_properties(items):
    """プロパティをマージ（後方優先）"""
    merged = OrderedDict()
    
    for item in items:
        props = item['properties']
        for line in props.split('\n'):
            line = line.strip().rstrip(';')
            if ':' in line and not line.startswith('/*'):
                parts = line.split(':', 1)
                if len(parts) == 2:
                    prop_name = parts[0].strip()
                    prop_value = parts[1].strip()
                    merged[prop_name] = prop_value
    
    return merged

def deduplicate_css(css_content, dry_run=False):
    """重複を除去"""
    # メディアクエリを一時的に除外
    cleaned_css, media_placeholders = remove_media_queries(css_content)
    
    # ルールをパース
    rules = parse_rules(cleaned_css)
    
    # 重複をマージ
    merged_rules = []
    stats = {'duplicates': 0, 'merged': 0}
    
    # 元の順序を保持しつつマージ
    processed = set()
    
    for match in re.finditer(r'([^{}@]+)\s*\{([^{}]*)\}', cleaned_css):
        selector = match.group(1).strip()
        
        if selector in processed or selector.startswith('/*'):
            continue
        
        if selector in rules:
            items = rules[selector]
            
            if len(items) > 1:
                # 重複あり：マージ
                merged_props = merge_properties(items)
                
                if not dry_run:
                    # コメント追加
                    comment = f"/* [統合] {len(items)}個の定義をマージ (行: {', '.join(str(i['line']) for i in items)}) */\n"
                    props_text = '\n  '.join(f"{k}: {v};" for k, v in merged_props.items())
                    merged_rules.append(f"{comment}{selector} {{\n  {props_text}\n}}")
                
                stats['duplicates'] += len(items)
                stats['merged'] += 1
            else:
                # 重複なし：そのまま
                if not dry_run:
                    props_text = '\n  '.join(line.strip() for line in items[0]['properties'].split('\n') if line.strip())
                    merged_rules.append(f"{selector} {{\n  {props_text}\n}}")
            
            processed.add(selector)
    
    if dry_run:
        return None, stats
    
    # 結合
    result = '\n\n'.join(merged_rules)
    
    # メディアクエリを復元
    result = restore_media_queries(result, media_placeholders)
    
    return result, stats

def main():
    css_file = Path(__file__).parent.parent / 'nanashi8.github.io' / 'src' / 'styles' / 'themes' / 'dark.css'
    
    print("🔄 CSS重複統合（メディアクエリ安全版）\n")
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_lines = len(content.split('\n'))
    
    # ドライラン
    print("🔍 ドライラン実行中...")
    _, stats = deduplicate_css(content, dry_run=True)
    
    print(f"\n📊 統計:")
    print(f"   - 元のファイル: {original_lines:,} 行")
    print(f"   - 重複定義総数: {stats['duplicates']} 個")
    print(f"   - マージ対象セレクタ: {stats['merged']} 個")
    print(f"   - 予想削減: 約 {(stats['duplicates'] - stats['merged']) * 5} 行")
    
    print(f"\n⚠️  メディアクエリ内の定義は保持されます")
    
    response = input("\n実行しますか？ (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        # バックアップ
        backup_file = css_file.with_suffix('.css.backup')
        import shutil
        shutil.copy2(css_file, backup_file)
        print(f"💾 バックアップ: {backup_file}")
        
        # 実行
        merged, _ = deduplicate_css(content, dry_run=False)
        
        output_file = css_file.with_name('dark.deduplicated.css')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(merged)
        
        merged_lines = len(merged.split('\n'))
        
        print(f"\n✅ 完了！")
        print(f"   新ファイル: {output_file}")
        print(f"   行数: {original_lines:,} → {merged_lines:,}")
        print(f"   削減: {original_lines - merged_lines:,} 行 ({(1 - merged_lines/original_lines)*100:.1f}%)")
        print(f"\n次のステップ:")
        print(f"   1. {output_file} を確認")
        print(f"   2. 動作確認後、置き換え:")
        print(f"      mv {output_file} {css_file}")
    else:
        print("\n❌ キャンセル")

if __name__ == '__main__':
    main()
