#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
熟語データバッチ生成ワークフロー
100件単位で熟語データを生成→検証→統合するワークフロー
"""

import os
import sys
import csv
import subprocess
from datetime import datetime
from typing import List, Dict

class BatchWorkflow:
    """バッチ生成ワークフロー管理"""
    
    def __init__(self):
        self.base_dir = "batches"
        self.words_file = "public/data/junior-high-entrance-words.csv"
        self.output_dir = "public/data"
        
        # バッチディレクトリ作成
        os.makedirs(self.base_dir, exist_ok=True)
    
    def create_batch(self, batch_num: int, category: str, difficulty: str, 
                     count: int, phrase_type: str = None) -> str:
        """
        新しいバッチを作成
        
        Args:
            batch_num: バッチ番号
            category: カテゴリー
            difficulty: 難易度
            count: 件数
            phrase_type: 熟語タイプ
        
        Returns:
            バッチディレクトリのパス
        """
        batch_name = f"batch-{batch_num:03d}-{category}-{difficulty}-{count}"
        batch_dir = os.path.join(self.base_dir, batch_name)
        os.makedirs(batch_dir, exist_ok=True)
        
        # テンプレート生成
        type_arg = phrase_type if phrase_type else ""
        template_file = os.path.join(batch_dir, "template.csv")
        
        cmd = [
            "python3", "generate_phrases_template.py",
            "generate", category, difficulty, str(count)
        ]
        if type_arg:
            cmd.append(type_arg)
        
        print(f"\n{'='*70}")
        print(f"  バッチ {batch_num:03d} 作成中")
        print(f"{'='*70}")
        print(f"カテゴリー: {category}")
        print(f"難易度: {difficulty}")
        print(f"件数: {count}件")
        if phrase_type:
            print(f"タイプ: {phrase_type}")
        
        # テンプレート生成スクリプト実行（一時的に出力先を変更）
        original_file = f"phrases-template-{category}-{difficulty}-{count}"
        if phrase_type:
            original_file += f"-{phrase_type}"
        original_file += ".csv"
        
        subprocess.run(cmd, check=True)
        
        # 生成されたファイルをバッチディレクトリに移動
        if os.path.exists(original_file):
            os.rename(original_file, template_file)
        
        # READMEファイル作成
        readme_path = os.path.join(batch_dir, "README.md")
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(f"# バッチ {batch_num:03d}\n\n")
            f.write(f"- **カテゴリー**: {category}\n")
            f.write(f"- **難易度**: {difficulty}\n")
            f.write(f"- **件数**: {count}件\n")
            if phrase_type:
                f.write(f"- **タイプ**: {phrase_type}\n")
            f.write(f"- **作成日**: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
            f.write(f"- **ステータス**: テンプレート作成完了\n\n")
            f.write(f"## ワークフロー\n\n")
            f.write(f"1. ✅ テンプレート生成: `template.csv`\n")
            f.write(f"2. ⏳ データ入力: `template.csv` を編集\n")
            f.write(f"3. ⏳ 検証: `python3 ../validate_phrases.py template.csv`\n")
            f.write(f"4. ⏳ 統合: `python3 ../merge_phrases.py template.csv`\n\n")
            f.write(f"## 次のステップ\n\n")
            f.write(f"1. `{template_file}` を開く\n")
            f.write(f"2. [TODO] の部分を実際のデータで置き換える\n")
            f.write(f"3. `cd {batch_dir}` に移動\n")
            f.write(f"4. `python3 ../../validate_phrases.py template.csv` で検証\n")
        
        print(f"\n✅ バッチ作成完了: {batch_dir}")
        print(f"   テンプレート: {template_file}")
        print(f"   README: {readme_path}")
        
        return batch_dir
    
    def validate_batch(self, batch_dir: str) -> bool:
        """バッチデータを検証"""
        template_file = os.path.join(batch_dir, "template.csv")
        
        if not os.path.exists(template_file):
            print(f"❌ エラー: テンプレートファイルが見つかりません: {template_file}")
            return False
        
        print(f"\n{'='*70}")
        print(f"  バッチ検証中: {batch_dir}")
        print(f"{'='*70}")
        
        # 検証スクリプト実行
        result = subprocess.run(
            ["python3", "validate_phrases.py", template_file, self.words_file],
            capture_output=True,
            text=True
        )
        
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        return result.returncode == 0
    
    def merge_batch(self, batch_dir: str) -> bool:
        """バッチデータを統合"""
        template_file = os.path.join(batch_dir, "template.csv")
        
        if not os.path.exists(template_file):
            print(f"❌ エラー: テンプレートファイルが見つかりません: {template_file}")
            return False
        
        print(f"\n{'='*70}")
        print(f"  バッチ統合中: {batch_dir}")
        print(f"{'='*70}")
        
        # 統合スクリプト実行
        result = subprocess.run(
            ["python3", "merge_phrases.py", template_file],
            capture_output=True,
            text=True
        )
        
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode == 0:
            # 統合成功時、バッチディレクトリに完了マーク
            with open(os.path.join(batch_dir, "COMPLETED"), 'w') as f:
                f.write(f"統合完了: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        return result.returncode == 0
    
    def list_batches(self):
        """バッチ一覧を表示"""
        print(f"\n{'='*70}")
        print(f"  バッチ一覧")
        print(f"{'='*70}")
        
        if not os.path.exists(self.base_dir):
            print("バッチディレクトリが見つかりません")
            return
        
        batches = sorted([d for d in os.listdir(self.base_dir) 
                         if os.path.isdir(os.path.join(self.base_dir, d))])
        
        if not batches:
            print("バッチが見つかりません")
            return
        
        for batch in batches:
            batch_dir = os.path.join(self.base_dir, batch)
            is_completed = os.path.exists(os.path.join(batch_dir, "COMPLETED"))
            status = "✅ 完了" if is_completed else "⏳ 作業中"
            
            template_file = os.path.join(batch_dir, "template.csv")
            count = 0
            if os.path.exists(template_file):
                with open(template_file, 'r', encoding='utf-8') as f:
                    count = sum(1 for _ in f) - 1  # ヘッダー除く
            
            print(f"\n{batch}")
            print(f"  ステータス: {status}")
            print(f"  件数: {count}件")

def main():
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python3 batch_workflow.py <コマンド> [オプション]")
        print("\nコマンド:")
        print("  create <batch_num> <category> <difficulty> <count> [type]")
        print("         - 新しいバッチを作成")
        print("  validate <batch_dir> - バッチを検証")
        print("  merge <batch_dir>    - バッチを統合")
        print("  list                 - バッチ一覧を表示")
        print("\n例:")
        print("  python3 batch_workflow.py create 1 言語基本 初級 20 phrasal_verb")
        print("  python3 batch_workflow.py validate batches/batch-001-言語基本-初級-20")
        print("  python3 batch_workflow.py merge batches/batch-001-言語基本-初級-20")
        print("  python3 batch_workflow.py list")
        sys.exit(1)
    
    workflow = BatchWorkflow()
    command = sys.argv[1]
    
    if command == "create":
        if len(sys.argv) < 6:
            print("❌ エラー: batch_num, category, difficulty, count が必要です")
            sys.exit(1)
        
        batch_num = int(sys.argv[2])
        category = sys.argv[3]
        difficulty = sys.argv[4]
        count = int(sys.argv[5])
        phrase_type = sys.argv[6] if len(sys.argv) > 6 else None
        
        workflow.create_batch(batch_num, category, difficulty, count, phrase_type)
    
    elif command == "validate":
        if len(sys.argv) < 3:
            print("❌ エラー: batch_dir が必要です")
            sys.exit(1)
        
        batch_dir = sys.argv[2]
        success = workflow.validate_batch(batch_dir)
        sys.exit(0 if success else 1)
    
    elif command == "merge":
        if len(sys.argv) < 3:
            print("❌ エラー: batch_dir が必要です")
            sys.exit(1)
        
        batch_dir = sys.argv[2]
        success = workflow.merge_batch(batch_dir)
        sys.exit(0 if success else 1)
    
    elif command == "list":
        workflow.list_batches()
    
    else:
        print(f"❌ エラー: 不明なコマンド '{command}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
