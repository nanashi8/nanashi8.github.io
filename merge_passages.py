#!/usr/bin/env python3
"""
prototypeフォルダの個別JSONファイルをreading-passages-comprehensive.jsonに統合
"""

import json
import os

def merge_passages():
    prototype_dir = 'prototype'
    output_file = 'public/data/reading-passages-comprehensive.json'
    
    passages = []
    
    # prototypeディレクトリ内の全JSONファイルを読み込み
    for filename in sorted(os.listdir(prototype_dir)):
        if filename.endswith('.json'):
            filepath = os.path.join(prototype_dir, filename)
            print(f'読み込み中: {filename}')
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                passages.append(data)
    
    # 統合されたファイルを出力
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
    
    print(f'\n{len(passages)}個のパッセージを {output_file} に統合しました')

if __name__ == '__main__':
    merge_passages()
