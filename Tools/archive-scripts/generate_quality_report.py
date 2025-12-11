#!/usr/bin/env python3
"""
品質レポート生成スクリプト

全コンテンツの品質状況を総合的にレポート化します。
GitHub PRコメントやドキュメント生成に使用できます。

使用方法:
    python3 scripts/generate_quality_report.py
    python3 scripts/generate_quality_report.py --output quality_report.md
    python3 scripts/generate_quality_report.py --format markdown
    python3 scripts/generate_quality_report.py --format json
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import argparse
import subprocess

class QualityReportGenerator:
    """品質レポート生成クラス"""
    
    def __init__(self):
        self.validation_output = ""
        self.passage_quality_output = ""
        self.report_data = {
            'timestamp': datetime.now().isoformat(),
            'grammar': {},
            'vocabulary': {},
            'passages': {},
            'overall': {},
            'recommendations': []
        }
    
    def run_validations(self) -> bool:
        """全検証を実行"""
        try:
            # 統合検証
            result = subprocess.run(
                ['python3', 'scripts/validate_all_content.py'],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent.parent
            )
            self.validation_output = result.stdout
            
            # 長文詳細検証
            result = subprocess.run(
                ['python3', 'scripts/validate_passage_quality.py'],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent.parent
            )
            self.passage_quality_output = result.stdout
            
            return True
        except Exception as e:
            print(f"❌ 検証実行エラー: {e}")
            return False
    
    def parse_results(self):
        """検証結果を解析"""
        # 統合検証結果の解析
        lines = self.validation_output.split('\n')
        
        for line in lines:
            # 文法
            if '文法:' in line and '=' in line:
                parts = line.split('=')
                if len(parts) > 1:
                    self.report_data['grammar']['percentage'] = parts[1].strip()
            
            # 語彙
            elif '語彙:' in line and '=' in line:
                parts = line.split('=')
                if len(parts) > 1:
                    self.report_data['vocabulary']['percentage'] = parts[1].strip()
            
            # 長文
            elif '長文:' in line and '=' in line:
                parts = line.split('=')
                if len(parts) > 1:
                    self.report_data['passages']['title_percentage'] = parts[1].strip()
            
            # 総合
            elif '全コンテンツ合計:' in line and '=' in line:
                parts = line.split('=')
                if len(parts) > 1:
                    self.report_data['overall']['percentage'] = parts[1].strip()
        
        # 長文品質スコアの解析
        if '平均スコア:' in self.validation_output:
            for line in lines:
                if '平均スコア:' in line:
                    parts = line.split(':')
                    if len(parts) > 1:
                        self.report_data['passages']['average_quality_score'] = parts[1].strip()
                        break
        
        # 改善推奨事項の抽出
        if '要改善:' in self.validation_output:
            in_recommendations = False
            for line in lines:
                if '要改善:' in line:
                    in_recommendations = True
                    continue
                if in_recommendations and line.strip().startswith('-'):
                    self.report_data['recommendations'].append(line.strip('- '))
                elif in_recommendations and not line.strip():
                    break
    
    def generate_markdown(self) -> str:
        """Markdown形式のレポート生成"""
        report = []
        
        report.append("# 📊 コンテンツ品質レポート")
        report.append("")
        report.append(f"**生成日時**: {self.report_data['timestamp']}")
        report.append("")
        
        # 総合評価
        overall_pct = self.report_data['overall'].get('percentage', 'N/A')
        if '100' in str(overall_pct):
            status = "🎉 優秀"
            emoji = "✅"
        elif '90' in str(overall_pct) or '95' in str(overall_pct):
            status = "👍 良好"
            emoji = "✅"
        else:
            status = "⚠️ 要改善"
            emoji = "⚠️"
        
        report.append("## 総合評価")
        report.append("")
        report.append(f"**{emoji} 全コンテンツ品質**: {overall_pct} - {status}")
        report.append("")
        
        # カテゴリ別品質
        report.append("## カテゴリ別品質")
        report.append("")
        report.append("| カテゴリ | 品質 | 状態 |")
        report.append("|---------|------|------|")
        
        # 文法
        grammar_pct = self.report_data['grammar'].get('percentage', 'N/A')
        grammar_status = "✅" if '100' in str(grammar_pct) else "⚠️"
        report.append(f"| 📝 文法問題 | {grammar_pct} | {grammar_status} |")
        
        # 語彙
        vocab_pct = self.report_data['vocabulary'].get('percentage', 'N/A')
        vocab_status = "✅" if '100' in str(vocab_pct) else "⚠️"
        report.append(f"| 🔤 語彙・スペル | {vocab_pct} | {vocab_status} |")
        
        # 長文（タイトル）
        passage_title_pct = self.report_data['passages'].get('title_percentage', 'N/A')
        passage_status = "✅" if '100' in str(passage_title_pct) else "⚠️"
        report.append(f"| 📖 長文（タイトル） | {passage_title_pct} | {passage_status} |")
        
        # 長文（英文品質）
        passage_quality = self.report_data['passages'].get('average_quality_score', 'N/A')
        if passage_quality != 'N/A':
            quality_num = float(passage_quality.split('/')[0]) if '/' in passage_quality else 0
            quality_status = "✅" if quality_num >= 80 else "⚠️"
            report.append(f"| 📖 長文（英文品質） | {passage_quality} | {quality_status} |")
        
        report.append("")
        
        # 改善推奨事項
        if self.report_data['recommendations']:
            report.append("## 📋 改善推奨事項")
            report.append("")
            for rec in self.report_data['recommendations']:
                report.append(f"- {rec}")
            report.append("")
        else:
            report.append("## ✅ 改善不要")
            report.append("")
            report.append("全ての品質基準をクリアしています！")
            report.append("")
        
        # 次のステップ
        report.append("## 🚀 次のステップ")
        report.append("")
        
        if self.report_data['recommendations']:
            report.append("1. 上記の改善推奨事項を確認")
            report.append("2. 該当ファイルを修正")
            report.append("3. `python3 scripts/validate_all_content.py` で再検証")
            report.append("4. 品質基準達成後にマージ")
        else:
            report.append("✅ この変更はマージ可能です！")
        
        report.append("")
        
        # 詳細ログ
        report.append("<details>")
        report.append("<summary>📝 詳細ログを表示</summary>")
        report.append("")
        report.append("```")
        report.append(self.validation_output)
        report.append("```")
        report.append("")
        report.append("</details>")
        
        return "\n".join(report)
    
    def generate_json(self) -> str:
        """JSON形式のレポート生成"""
        return json.dumps(self.report_data, indent=2, ensure_ascii=False)
    
    def save_report(self, output_path: Path, format: str = 'markdown'):
        """レポートをファイルに保存"""
        if format == 'markdown':
            content = self.generate_markdown()
        else:
            content = self.generate_json()
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ レポートを保存しました: {output_path}")
        except Exception as e:
            print(f"❌ レポート保存エラー: {e}")


def main():
    parser = argparse.ArgumentParser(description='品質レポート生成')
    parser.add_argument('--output', type=Path, default=Path('quality_report.md'),
                       help='出力ファイルパス（デフォルト: quality_report.md）')
    parser.add_argument('--format', choices=['markdown', 'json'], default='markdown',
                       help='出力形式（デフォルト: markdown）')
    parser.add_argument('--print', action='store_true',
                       help='ファイル保存せずに標準出力に表示')
    args = parser.parse_args()
    
    generator = QualityReportGenerator()
    
    print("🔍 品質レポート生成中...")
    
    # 検証実行
    if not generator.run_validations():
        return 1
    
    # 結果解析
    generator.parse_results()
    
    # レポート生成
    if args.print:
        if args.format == 'markdown':
            print(generator.generate_markdown())
        else:
            print(generator.generate_json())
    else:
        generator.save_report(args.output, args.format)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
