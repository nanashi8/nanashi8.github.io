#!/usr/bin/env python3
"""
パッセージファイル間の整合性チェックツール

4つのディレクトリ間で英文の一致を確認：
- passages/
- passages-for-phrase-work/
- passages-phrase-learning/
- passages-translations/
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict

# カラー出力用
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def extract_english_from_txt(file_path: Path) -> List[str]:
    """テキストファイルから英文を抽出"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
        return lines
    except Exception as e:
        print(f"{Colors.RED}Error reading {file_path}: {e}{Colors.RESET}")
        return []

def extract_english_from_phrase_json(file_path: Path) -> List[str]:
    """phrases-phrase-learning JSONから英文を抽出"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        english_phrases = []
        if 'phrases' in data:
            for phrase in data['phrases']:
                if 'english' in phrase:
                    english_phrases.append(phrase['english'].strip())
        
        return english_phrases
    except Exception as e:
        print(f"{Colors.RED}Error reading {file_path}: {e}{Colors.RESET}")
        return []

def extract_english_from_translation_json(file_path: Path) -> List[str]:
    """passages-translations JSONから英文を抽出"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        english_phrases = []
        if 'phrases' in data:
            for phrase in data['phrases']:
                if 'english' in phrase:
                    english_phrases.append(phrase['english'].strip())
        
        return english_phrases
    except Exception as e:
        print(f"{Colors.RED}Error reading {file_path}: {e}{Colors.RESET}")
        return []

def check_segment_consistency(file_path: Path) -> List[str]:
    """セグメント配列と英文の整合性チェック"""
    issues = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'phrases' not in data:
            return issues
        
        for i, phrase in enumerate(data['phrases']):
            phrase_id = phrase.get('id', i)
            english = phrase.get('english', '').strip()
            
            # segmentsから英文を再構築
            if 'segments' in phrase:
                reconstructed = ''.join([
                    seg.get('word', '') for seg in phrase['segments']
                ])
                
                # 空白・ハイフン・引用符・特殊記号を除いて正規化して比較
                def normalize_for_comparison(text):
                    # 空白、ハイフン、引用符、記号（%,$,¥,*,•,&等）を削除
                    normalized = text.replace(' ', '').replace('-', '')
                    normalized = normalized.replace('"', '').replace('"', '').replace('"', '')
                    normalized = normalized.replace("'", '').replace("'", '').replace("'", '')
                    normalized = normalized.replace('%', '').replace('$', '').replace('¥', '')
                    normalized = normalized.replace('*', '').replace('•', '').replace('²', '')
                    normalized = normalized.replace('[', '').replace(']', '')
                    normalized = normalized.replace('(', '').replace(')', '')
                    normalized = normalized.replace('&', '').replace('+', '')
                    normalized = normalized.replace('/', '').replace('.', '').replace(':', '')
                    # URLのドット、数式の等号なども削除
                    normalized = normalized.replace('=', '').replace('www', '')
                    return normalized.lower()
                
                english_normalized = normalize_for_comparison(english)
                reconstructed_normalized = normalize_for_comparison(reconstructed)
                
                if english_normalized != reconstructed_normalized:
                    issues.append(
                        f"  Phrase ID {phrase_id}: English text mismatch\n"
                        f"    Expected: {english}\n"
                        f"    Segments: {reconstructed}"
                    )
    
    except Exception as e:
        issues.append(f"  Error checking segments: {e}")
    
    return issues

def find_all_passage_files() -> Dict[str, Dict[str, Path]]:
    """全てのパッセージファイルを検索してグループ化"""
    base_dir = Path(__file__).parent.parent / 'public' / 'data'
    
    directories = {
        # 'passages': base_dir / 'passages',  # 旧形式（廃止予定）- チェック対象外
        'phrase-work': base_dir / 'passages-for-phrase-work',
        'phrase-learning': base_dir / 'passages-phrase-learning',
        'translations': base_dir / 'passages-translations'
    }
    
    # ファイル名をキーにしてグループ化
    file_groups = defaultdict(dict)
    
    for dir_type, dir_path in directories.items():
        if not dir_path.exists():
            continue
        
        for file_path in dir_path.iterdir():
            if file_path.is_file():
                # 拡張子を除いたファイル名
                base_name = file_path.stem
                file_groups[base_name][dir_type] = file_path
    
    return dict(file_groups)

def compare_english_texts(texts1: List[str], texts2: List[str], label1: str, label2: str) -> List[str]:
    """2つの英文リストを比較"""
    issues = []
    
    # 長さの違いをチェック
    if len(texts1) != len(texts2):
        issues.append(
            f"  {Colors.YELLOW}Line count mismatch: "
            f"{label1}={len(texts1)}, {label2}={len(texts2)}{Colors.RESET}"
        )
    
    # 各行を比較
    max_len = max(len(texts1), len(texts2))
    for i in range(max_len):
        text1 = texts1[i] if i < len(texts1) else None
        text2 = texts2[i] if i < len(texts2) else None
        
        if text1 != text2:
            issues.append(
                f"  {Colors.RED}Line {i+1} mismatch:{Colors.RESET}\n"
                f"    {label1}: {text1}\n"
                f"    {label2}: {text2}"
            )
    
    return issues

def check_passage_group(base_name: str, files: Dict[str, Path]) -> Tuple[bool, List[str]]:
    """1つのパッセージグループの整合性をチェック"""
    issues = []
    all_english_texts = {}
    
    # 各ファイルから英文を抽出
    if 'passages' in files:
        all_english_texts['passages'] = extract_english_from_txt(files['passages'])
    
    if 'phrase-work' in files:
        all_english_texts['phrase-work'] = extract_english_from_txt(files['phrase-work'])
    
    if 'phrase-learning' in files:
        all_english_texts['phrase-learning'] = extract_english_from_phrase_json(files['phrase-learning'])
        
        # セグメント整合性チェック
        segment_issues = check_segment_consistency(files['phrase-learning'])
        if segment_issues:
            issues.append(f"{Colors.MAGENTA}Segment consistency issues:{Colors.RESET}")
            issues.extend(segment_issues)
    
    if 'translations' in files:
        all_english_texts['translations'] = extract_english_from_translation_json(files['translations'])
    
    # 全ての組み合わせで比較
    dir_types = list(all_english_texts.keys())
    for i in range(len(dir_types)):
        for j in range(i + 1, len(dir_types)):
            type1, type2 = dir_types[i], dir_types[j]
            comparison_issues = compare_english_texts(
                all_english_texts[type1],
                all_english_texts[type2],
                type1,
                type2
            )
            if comparison_issues:
                issues.append(f"{Colors.CYAN}Comparing {type1} vs {type2}:{Colors.RESET}")
                issues.extend(comparison_issues)
    
    return len(issues) == 0, issues

def main():
    print(f"{Colors.BOLD}{Colors.BLUE}=== Passage Consistency Checker ==={Colors.RESET}\n")
    
    file_groups = find_all_passage_files()
    
    if not file_groups:
        print(f"{Colors.YELLOW}No passage files found.{Colors.RESET}")
        return 0
    
    print(f"Found {len(file_groups)} passage groups to check.\n")
    
    total_checked = 0
    total_issues = 0
    
    for base_name in sorted(file_groups.keys()):
        files = file_groups[base_name]
        print(f"{Colors.BOLD}Checking: {base_name}{Colors.RESET}")
        print(f"  Files found in: {', '.join(files.keys())}")
        
        is_consistent, issues = check_passage_group(base_name, files)
        total_checked += 1
        
        if is_consistent:
            print(f"  {Colors.GREEN}✓ All files are consistent{Colors.RESET}\n")
        else:
            total_issues += 1
            print(f"  {Colors.RED}✗ Issues found:{Colors.RESET}")
            for issue in issues:
                print(issue)
            print()
    
    # サマリー
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"Total checked: {total_checked}")
    print(f"Files with issues: {total_issues}")
    
    if total_issues == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}All passage files are consistent! ✓{Colors.RESET}")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}Found inconsistencies in {total_issues} file(s). Please review.{Colors.RESET}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
