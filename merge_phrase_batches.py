#!/usr/bin/env python3
"""
既存の熟語バッチファイルを統合して junior-high-entrance-phrases.csv を生成
"""

import csv
import sys
from pathlib import Path
from collections import OrderedDict

def merge_phrase_batches():
    """バッチファイルを統合"""
    script_dir = Path(__file__).parent
    data_dir = script_dir / 'public/data'
    
    # バッチファイルのリスト
    batch_files = [
        'batch2-phrases-100-beginner.csv',
        'batch3-phrases-100-beginner.csv',
        'batch4-phrases-100-beginner-final.csv',
        'batch5-phrases-100-intermediate.csv',
        'batch6-phrases-100-intermediate.csv',
        'batch7-phrases-100-intermediate.csv',
        'batch8-phrases-100-intermediate.csv',
        'batch9-phrases-100-advanced.csv',
        'batch10-phrases-100-advanced.csv',
        'batch11-phrases-100-final.csv',
    ]
    
    print('📚 熟語データを統合中...\n')
    
    # 熟語を格納（重複除去のため OrderedDict を使用）
    phrases = OrderedDict()
    difficulty_stats = {'初級': 0, '中級': 0, '上級': 0}
    
    # 各バッチファイルを読み込み
    for batch_file in batch_files:
        file_path = data_dir / batch_file
        
        if not file_path.exists():
            print(f'⚠️  {batch_file}: ファイルが見つかりません（スキップ）')
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                
                for row in reader:
                    phrase = row['語句'].strip()
                    difficulty = row['難易度'].strip()
                    
                    # 重複チェック（最初の出現を保持）
                    if phrase not in phrases:
                        phrases[phrase] = {
                            '語句': phrase,
                            '読み': row['読み'].strip(),
                            '意味': row['意味'].strip(),
                            '語源等解説': row['語源等解説'].strip(),
                            '関連語': row['関連語'].strip(),
                            '関連分野': row['関連分野'].strip(),
                            '難易度': difficulty
                        }
                        
                        if difficulty in difficulty_stats:
                            difficulty_stats[difficulty] += 1
                        
                        count += 1
                
                print(f'✅ {batch_file}: {count}熟語')
        
        except Exception as e:
            print(f'❌ {batch_file}: エラー - {e}')
            continue
    
    print(f'\n📊 統合結果: {len(phrases)}熟語（重複除去済み）\n')
    
    # 難易度別にソート
    difficulty_order = {'初級': 1, '中級': 2, '上級': 3}
    sorted_phrases = sorted(
        phrases.values(),
        key=lambda x: (
            difficulty_order.get(x['難易度'], 99),
            x['語句'].lower()
        )
    )
    
    # CSVファイルに書き込み
    output_path = data_dir / 'junior-high-entrance-phrases.csv'
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['語句', '読み', '意味', '語源等解説', '関連語', '関連分野', '難易度']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(sorted_phrases)
    
    print('📊 難易度別統計:')
    for difficulty, count in sorted(difficulty_stats.items(), key=lambda x: difficulty_order.get(x[0], 99)):
        print(f'  {difficulty}: {count}熟語')
    
    print(f'\n💾 保存完了: {output_path}')
    print(f'📝 総熟語数: {len(phrases)}熟語\n')
    
    return len(phrases)

if __name__ == '__main__':
    try:
        total = merge_phrase_batches()
        print('✨ 統合が完了しました！')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ エラーが発生しました: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
