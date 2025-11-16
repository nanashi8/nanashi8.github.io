#!/usr/bin/env python3
"""
語彙抽出スクリプト
CSVから難易度別・カテゴリ別の語彙リストを抽出し、パッセージ作成を支援
"""

import csv
import json
from collections import defaultdict
from typing import Dict, List, Tuple

CSV_PATH = "public/data/junior-high-entrance-words.csv"

def load_vocabulary() -> Dict[str, List[Dict]]:
    """CSVから語彙を読み込み、難易度別に分類"""
    vocab_by_level = {
        '初級': [],
        '中級': [],
        '上級': []
    }
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            difficulty = row['難易度'].strip()
            if difficulty in vocab_by_level:
                word_data = {
                    'word': row['語句'].strip(),
                    'reading': row['読み'].strip(),
                    'meaning': row['意味'].strip(),
                    'category': row['関連 分野'].strip() if '関連 分野' in row else row.get('関連分野', '').strip(),
                    'related': row['関連語'].strip() if '関連語' in row else '',
                    'etymology': row['語源等解説'].strip() if '語源等解説' in row else row.get('語源 等解説', '').strip(),
                }
                vocab_by_level[difficulty].append(word_data)
    
    return vocab_by_level

def extract_by_category(vocab_list: List[Dict], categories: List[str], limit: int = None) -> List[Dict]:
    """特定カテゴリの語彙を抽出"""
    filtered = [v for v in vocab_list if v['category'] in categories]
    if limit:
        return filtered[:limit]
    return filtered

def get_theme_vocabulary(level: str, theme: str, main_categories: List[str], 
                         sub_categories: List[str] = None, limit: int = None) -> Dict:
    """テーマに適した語彙リストを生成"""
    vocab_by_level = load_vocabulary()
    
    # 指定レベル以下の語彙を取得
    allowed_levels = {
        '初級': ['初級'],
        '中級': ['初級', '中級'],
        '上級': ['初級', '中級', '上級']
    }
    
    all_vocab = []
    for allowed_level in allowed_levels[level]:
        all_vocab.extend(vocab_by_level[allowed_level])
    
    # カテゴリでフィルタリング
    main_vocab = extract_by_category(all_vocab, main_categories)
    sub_vocab = extract_by_category(all_vocab, sub_categories) if sub_categories else []
    
    result = {
        'theme': theme,
        'level': level,
        'main_categories': main_categories,
        'sub_categories': sub_categories or [],
        'main_vocabulary': main_vocab[:limit] if limit else main_vocab,
        'sub_vocabulary': sub_vocab[:limit//2] if limit else sub_vocab,
        'total_available': len(main_vocab) + len(sub_vocab)
    }
    
    return result

def generate_all_theme_vocabularies():
    """全11パッセージのテーマ別語彙リストを生成"""
    themes = [
        # 初級
        {
            'id': 'beginner-1',
            'level': '初級',
            'theme': '学校生活・友人関係',
            'target_words': 550,
            'main_categories': ['学校・学習', '人・社会'],
            'sub_categories': ['日常生活', '時間・数量']
        },
        {
            'id': 'beginner-2',
            'level': '初級',
            'theme': '日常生活・家族',
            'target_words': 650,
            'main_categories': ['日常生活', '人・社会'],
            'sub_categories': ['食・健康', '時間・数量']
        },
        {
            'id': 'beginner-3',
            'level': '初級',
            'theme': 'スポーツ・趣味',
            'target_words': 750,
            'main_categories': ['運動・娯楽', '食・健康'],
            'sub_categories': ['時間・数量', '人・社会']
        },
        
        # 中級
        {
            'id': 'intermediate-1',
            'level': '中級',
            'theme': '環境問題と対策',
            'target_words': 900,
            'main_categories': ['自然・環境', '科学・技術'],
            'sub_categories': ['人・社会', '場所・移動']
        },
        {
            'id': 'intermediate-2',
            'level': '中級',
            'theme': '科学技術の発展',
            'target_words': 1100,
            'main_categories': ['科学・技術', '学校・学習'],
            'sub_categories': ['時間・数量', '人・社会']
        },
        {
            'id': 'intermediate-3',
            'level': '中級',
            'theme': '健康的な生活習慣',
            'target_words': 2500,
            'main_categories': ['食・健康', '運動・娯楽'],
            'sub_categories': ['時間・数量', '日常生活']
        },
        {
            'id': 'intermediate-4',
            'level': '中級',
            'theme': '異文化理解と国際交流',
            'target_words': 2500,
            'main_categories': ['人・社会', '場所・移動'],
            'sub_categories': ['学校・学習', '言語基本']
        },
        {
            'id': 'intermediate-5',
            'level': '中級',
            'theme': '将来の夢と職業',
            'target_words': 3000,
            'main_categories': ['学校・学習', '人・社会'],
            'sub_categories': ['科学・技術', '時間・数量']
        },
        
        # 上級
        {
            'id': 'advanced-1',
            'level': '上級',
            'theme': '持続可能な社会の実現',
            'target_words': 3000,
            'main_categories': ['人・社会', '自然・環境'],
            'sub_categories': ['科学・技術', '時間・数量']
        },
        {
            'id': 'advanced-2',
            'level': '上級',
            'theme': 'AIと未来社会',
            'target_words': 3000,
            'main_categories': ['科学・技術', '人・社会'],
            'sub_categories': ['学校・学習', '時間・数量']
        },
        {
            'id': 'advanced-3',
            'level': '上級',
            'theme': 'グローバル化と多様性',
            'target_words': 3000,
            'main_categories': ['人・社会', '場所・移動'],
            'sub_categories': ['時間・数量', '学校・学習']
        }
    ]
    
    results = {}
    
    for theme_config in themes:
        vocab = get_theme_vocabulary(
            level=theme_config['level'],
            theme=theme_config['theme'],
            main_categories=theme_config['main_categories'],
            sub_categories=theme_config['sub_categories'],
            limit=theme_config['target_words']
        )
        vocab['id'] = theme_config['id']
        vocab['target_words'] = theme_config['target_words']
        results[theme_config['id']] = vocab
    
    return results

def print_vocabulary_summary(theme_vocab: Dict):
    """語彙リストのサマリーを表示"""
    print(f"\n{'='*80}")
    print(f"テーマ: {theme_vocab['theme']}")
    print(f"難易度: {theme_vocab['level']}")
    print(f"目標語数: {theme_vocab['target_words']}語")
    print(f"{'='*80}")
    
    print(f"\nメインカテゴリ: {', '.join(theme_vocab['main_categories'])}")
    print(f"  利用可能語彙: {len(theme_vocab['main_vocabulary'])}語")
    print(f"  サンプル: {', '.join([v['word'] for v in theme_vocab['main_vocabulary'][:10]])}")
    
    if theme_vocab['sub_categories']:
        print(f"\nサブカテゴリ: {', '.join(theme_vocab['sub_categories'])}")
        print(f"  利用可能語彙: {len(theme_vocab['sub_vocabulary'])}語")
        print(f"  サンプル: {', '.join([v['word'] for v in theme_vocab['sub_vocabulary'][:10]])}")
    
    print(f"\n合計利用可能: {theme_vocab['total_available']}語")

def export_vocabulary_lists(output_dir: str = "vocabulary_lists"):
    """全テーマの語彙リストをJSONファイルとして出力"""
    import os
    
    os.makedirs(output_dir, exist_ok=True)
    
    all_themes = generate_all_theme_vocabularies()
    
    # 全体のサマリーを出力
    with open(f"{output_dir}/all_themes_summary.json", 'w', encoding='utf-8') as f:
        summary = {
            theme_id: {
                'theme': data['theme'],
                'level': data['level'],
                'target_words': data['target_words'],
                'main_categories': data['main_categories'],
                'sub_categories': data['sub_categories'],
                'available_vocab': data['total_available']
            }
            for theme_id, data in all_themes.items()
        }
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    # 各テーマ別に詳細ファイルを出力
    for theme_id, vocab_data in all_themes.items():
        with open(f"{output_dir}/{theme_id}.json", 'w', encoding='utf-8') as f:
            json.dump(vocab_data, f, ensure_ascii=False, indent=2)
        
        print_vocabulary_summary(vocab_data)
    
    print(f"\n{'='*80}")
    print(f"語彙リストを {output_dir}/ に出力しました")
    print(f"  - all_themes_summary.json: 全体サマリー")
    print(f"  - [theme-id].json: 各テーマの詳細語彙リスト")
    print(f"{'='*80}")

def get_top_words_by_category(level: str, category: str, limit: int = 50) -> List[Dict]:
    """特定レベル・カテゴリのトップN語を取得"""
    vocab_by_level = load_vocabulary()
    
    allowed_levels = {
        '初級': ['初級'],
        '中級': ['初級', '中級'],
        '上級': ['初級', '中級', '上級']
    }
    
    all_vocab = []
    for allowed_level in allowed_levels[level]:
        all_vocab.extend(vocab_by_level[allowed_level])
    
    category_vocab = [v for v in all_vocab if v['category'] == category]
    return category_vocab[:limit]

if __name__ == '__main__':
    print("語彙抽出スクリプト")
    print("=" * 80)
    
    # 統計情報を表示
    vocab_by_level = load_vocabulary()
    print("\n【語彙データベース統計】")
    for level, vocab_list in vocab_by_level.items():
        print(f"{level}: {len(vocab_list)}語")
    
    # 全テーマの語彙リストを生成・出力
    print("\n【テーマ別語彙リスト生成】")
    export_vocabulary_lists()
    
    print("\n✅ 語彙抽出完了")
    print("\n次のステップ:")
    print("  1. vocabulary_lists/ フォルダ内のJSONファイルを確認")
    print("  2. 各テーマのファイルを参照しながら英文を作成")
    print("  3. 検証スクリプトで語彙レベルをチェック")
