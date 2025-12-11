#!/usr/bin/env python3
"""
自動品質改善スクリプト（最適化版）

検出された品質問題を可能な限り自動的に修正します。
フレーズベースフォーマットを正当な形式として認識します。

使用方法:
    python3 scripts/auto_improve_quality.py
    python3 scripts/auto_improve_quality.py --dry-run
    python3 scripts/auto_improve_quality.py --aggressive
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple
import argparse
import subprocess

class AutoQualityImprover:
    """自動品質改善クラス"""
    
    def __init__(self, dry_run: bool = False, aggressive: bool = False):
        self.dry_run = dry_run
        self.aggressive = aggressive
        self.fixes_applied = []
        self.manual_reviews = []
    
    def improve_all(self) -> bool:
        """全ての自動改善を実行"""
        success = True
        
        # 1. 語彙の重複修正
        print("\n🔧 語彙の重複を修正中...")
        if not self.fix_vocabulary_duplicates():
            success = False
        
        # 2. 長文の文構造改善（提案のみ）
        print("\n💡 長文パッセージの文構造を分析中...")
        self.analyze_sentence_structure()
        
        return success
    
    def fix_vocabulary_duplicates(self) -> bool:
        """語彙の重複を自動修正"""
        try:
            if self.dry_run:
                result = subprocess.run(
                    ['python3', 'scripts/fix_vocabulary_duplicates.py', '--dry-run'],
                    capture_output=True,
                    text=True
                )
            else:
                result = subprocess.run(
                    ['python3', 'scripts/fix_vocabulary_duplicates.py'],
                    capture_output=True,
                    text=True
                )
            
            if '削除完了' in result.stdout or '削除予定' in result.stdout:
                # 修正件数を抽出
                for line in result.stdout.split('\n'):
                    if '削除完了' in line or '削除予定' in line:
                        self.fixes_applied.append(f"語彙重複修正: {line.strip()}")
                return True
            
            return True
        except Exception as e:
            print(f"  ⚠️ 語彙重複修正エラー: {e}")
            return False
    
    def fix_passage_formatting(self) -> bool:
        """長文パッセージのフォーマットを自動修正"""
        passages_dir = Path("nanashi8.github.io/public/data/passages")
        
        if not passages_dir.exists():
            print(f"  ⚠️ パッセージディレクトリが見つかりません: {passages_dir}")
            return False
        
        fixed_count = 0
        
        for txt_file in passages_dir.glob("*.txt"):
            if txt_file.name == 'index.json':
                continue
            
            fixes = self._fix_single_passage_formatting(txt_file)
            if fixes > 0:
                fixed_count += 1
                self.fixes_applied.append(f"フォーマット修正: {txt_file.name} ({fixes}箇所)")
        
        if fixed_count > 0:
            print(f"  ✅ {fixed_count}ファイルのフォーマットを修正しました")
        else:
            print(f"  ✅ フォーマット問題はありません")
        
        return True
    
    def analyze_sentence_structure(self):
        """文構造を分析して改善提案を生成"""
        try:
            result = subprocess.run(
                ['python3', 'scripts/validate_passage_quality.py'],
                capture_output=True,
                text=True
            )
            
            # 要改善ファイルを抽出
            for line in result.stdout.split('\n'):
                if '要改善:' in line:
                    # 次の数行を解析
                    pass
                
                # 文構造の問題を検出
                if '従属節が分離' in line or '前置詞句が分離' in line:
                    self.manual_reviews.append(line.strip())
            
            if self.manual_reviews:
                print(f"  💡 {len(self.manual_reviews)}件の文構造改善提案があります")
            else:
                print(f"  ✅ 文構造は良好です")
        
        except Exception as e:
            print(f"  ⚠️ 文構造分析エラー: {e}")
    
    def print_summary(self):
        """修正サマリーを表示"""
        print("\n" + "="*70)
        print("📊 自動品質改善サマリー")
        print("="*70)
        
        if self.dry_run:
            print("\n🔍 DRY RUN モード（実際の変更は行われていません）")
        
        if self.fixes_applied:
            print(f"\n✅ 自動修正: {len(self.fixes_applied)}件")
            for fix in self.fixes_applied:
                print(f"  - {fix}")
        else:
            print(f"\n✅ 自動修正可能な問題はありませんでした")
        
        if self.manual_reviews:
            print(f"\n💡 手動確認推奨: {len(self.manual_reviews)}件")
            for review in self.manual_reviews[:5]:
                print(f"  - {review}")
            if len(self.manual_reviews) > 5:
                print(f"  ... 他 {len(self.manual_reviews) - 5} 件")
            
            print(f"\n  詳細は以下で確認:")
            print(f"    python3 scripts/validate_passage_quality.py")
        
        print("\n" + "="*70)


def main():
    parser = argparse.ArgumentParser(description='自動品質改善')
    parser.add_argument('--dry-run', action='store_true',
                       help='実際に修正せず、プレビューのみ')
    parser.add_argument('--aggressive', action='store_true',
                       help='積極的な修正を適用（実験的）')
    args = parser.parse_args()
    
    improver = AutoQualityImprover(dry_run=args.dry_run, aggressive=args.aggressive)
    
    print("🚀 自動品質改善を開始...")
    
    if args.dry_run:
        print("   (DRY RUN モード: 実際の変更は行いません)")
    
    # 改善実行
    improver.improve_all()
    
    # サマリー表示
    improver.print_summary()
    
    if not args.dry_run:
        print("\n🔍 改善後の品質を検証中...")
        subprocess.run(['python3', 'scripts/validate_all_content.py'])
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
