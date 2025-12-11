#!/usr/bin/env python3
"""
プレースホルダー問題を含むユニットを無効化

485件のプレースホルダー問題を含む9つのファイルに
`enabled: false`フラグを追加して、本番環境で読み込まれないようにする
"""

import json
from pathlib import Path
from datetime import datetime

def disable_unit(file_path: Path) -> bool:
    """
    文法ユニットファイルにenabledフラグを追加
    
    Args:
        file_path: 処理するJSONファイル
        
    Returns:
        成功した場合True
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # enabledフラグを追加
        data['enabled'] = False
        data['disabledReason'] = 'Contains placeholder/template data - requires proper Japanese translations and English sentences'
        data['disabledDate'] = datetime.now().isoformat()
        
        # ファイルに書き戻し
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        print(f"❌ エラー ({file_path.name}): {e}")
        return False

def main():
    """メイン処理"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    grammar_dir = project_root / 'public' / 'data' / 'grammar'
    
    # プレースホルダー問題を含むファイルのリスト
    placeholder_files = [
        'grammar_grade2_unit2.json',  # 未来表現
        'grammar_grade2_unit3.json',  # 助動詞must/have to
        'grammar_grade2_unit4.json',  # 不定詞
        'grammar_grade2_unit5.json',  # 動名詞
        'grammar_grade2_unit6.json',  # 比較級・最上級
        'grammar_grade2_unit7.json',  # 接続詞
        'grammar_grade2_unit8.json',  # There is/are
        'grammar_grade2_unit9.json',  # 受動態
        'grammar_grade3_unit7.json',  # 仮定法(一部)
    ]
    
    print("\n" + "="*80)
    print("プレースホルダー問題ユニットの無効化")
    print("="*80 + "\n")
    
    success_count = 0
    
    for filename in placeholder_files:
        file_path = grammar_dir / filename
        
        if not file_path.exists():
            print(f"⚠️  ファイルが見つかりません: {filename}")
            continue
        
        print(f"処理中: {filename}")
        
        if disable_unit(file_path):
            success_count += 1
            print(f"✅ {filename} を無効化しました")
        
    print("\n" + "="*80)
    print(f"✅ 完了: {success_count}/{len(placeholder_files)} ファイルを無効化")
    print("="*80 + "\n")
    
    print("📝 次のステップ:")
    print("  1. GrammarQuizView.tsxでenabledフラグをチェックする実装を追加")
    print("  2. 無効化されたユニットは読み込みをスキップ")
    print("  3. validate_grammar_advanced.pyでプレースホルダー検出を追加")
    print("  4. 段階的にAI支援で適切な問題を生成\n")

if __name__ == '__main__':
    main()
