#!/usr/bin/env python3
"""
品質低下検出スクリプト

過去の品質メトリクスと比較して、品質の低下を検出します。
継続的改善を保証するため、品質が下がった場合は警告を発します。

使用方法:
    python3 scripts/check_quality_regression.py
    python3 scripts/check_quality_regression.py --baseline quality_baseline.json
    python3 scripts/check_quality_regression.py --update-baseline
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
import argparse

# パス設定
BASELINE_FILE = Path("quality_metrics_baseline.json")
HISTORY_FILE = Path("quality_metrics_history.json")

class QualityMetrics:
    """品質メトリクス"""
    
    def __init__(self):
        self.grammar_quality = 0.0
        self.vocabulary_quality = 0.0
        self.passage_title_quality = 0.0
        self.passage_content_quality = 0.0
        self.grammar_translation_quality = 0.0
        self.ui_specification_compliance = 0.0
        self.overall_quality = 0.0
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        return {
            'grammar_quality': self.grammar_quality,
            'vocabulary_quality': self.vocabulary_quality,
            'passage_title_quality': self.passage_title_quality,
            'passage_content_quality': self.passage_content_quality,
            'grammar_translation_quality': self.grammar_translation_quality,
            'ui_specification_compliance': self.ui_specification_compliance,
            'overall_quality': self.overall_quality,
            'timestamp': self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'QualityMetrics':
        metrics = cls()
        metrics.grammar_quality = data.get('grammar_quality', 0.0)
        metrics.vocabulary_quality = data.get('vocabulary_quality', 0.0)
        metrics.passage_title_quality = data.get('passage_title_quality', 0.0)
        metrics.passage_content_quality = data.get('passage_content_quality', 0.0)
        metrics.grammar_translation_quality = data.get('grammar_translation_quality', 0.0)
        metrics.ui_specification_compliance = data.get('ui_specification_compliance', 0.0)
        metrics.overall_quality = data.get('overall_quality', 0.0)
        metrics.timestamp = data.get('timestamp', '')
        return metrics


class QualityRegressionChecker:
    """品質低下チェッカー"""
    
    def __init__(self):
        self.current_metrics = QualityMetrics()
        self.baseline_metrics = None
        self.regressions: List[Tuple[str, float, float]] = []
        self.improvements: List[Tuple[str, float, float]] = []
    
    def load_current_metrics(self):
        """現在の品質メトリクスを取得"""
        # validate_all_content.py の結果を解析
        try:
            import subprocess
            result = subprocess.run(
                ['python3', 'scripts/validate_all_content.py'],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent.parent
            )
            
            # 出力から品質スコアを抽出
            output = result.stdout
            
            # 文法品質
            if '文法:' in output:
                for line in output.split('\n'):
                    if '文法:' in line and '=' in line:
                        parts = line.split('=')
                        if len(parts) > 1:
                            pct = parts[1].strip().replace('%', '')
                            self.current_metrics.grammar_quality = float(pct)
                            break
            
            # 語彙品質
            if '語彙:' in output:
                for line in output.split('\n'):
                    if '語彙:' in line and '=' in line:
                        parts = line.split('=')
                        if len(parts) > 1:
                            pct = parts[1].strip().replace('%', '')
                            self.current_metrics.vocabulary_quality = float(pct)
                            break
            
            # 長文品質（タイトル）
            if 'タイトル' in output:
                for line in output.split('\n'):
                    if 'タイトル' in line and '=' in line:
                        parts = line.split('=')
                        if len(parts) > 1:
                            pct = parts[1].strip().replace('%', '')
                            self.current_metrics.passage_title_quality = float(pct)
                            break
            
            # 長文品質（英文スコア）
            if '平均スコア:' in output:
                for line in output.split('\n'):
                    if '平均スコア:' in line:
                        parts = line.split(':')
                        if len(parts) > 1:
                            score = parts[1].strip().split('/')[0]
                            self.current_metrics.passage_content_quality = float(score)
                            break
            
            # 文法・和訳タブの品質（エラー数から計算）
            result = subprocess.run(
                ['python3', 'scripts/validate_grammar_translations.py'],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent.parent
            )
            if result.returncode == 0:
                self.current_metrics.grammar_translation_quality = 100.0
            else:
                # エラーがある場合は品質低下
                self.current_metrics.grammar_translation_quality = 0.0
            
            # UI仕様準拠（エラー数から計算）
            result = subprocess.run(
                ['python3', 'scripts/validate_ui_specifications.py'],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent.parent
            )
            if result.returncode == 0:
                self.current_metrics.ui_specification_compliance = 100.0
            else:
                self.current_metrics.ui_specification_compliance = 0.0
            
            # 総合品質
            if '全コンテンツ合計:' in output:
                for line in output.split('\n'):
                    if '全コンテンツ合計:' in line and '=' in line:
                        parts = line.split('=')
                        if len(parts) > 1:
                            pct = parts[1].strip().replace('%', '')
                            self.current_metrics.overall_quality = float(pct)
                            break
            
        except Exception as e:
            print(f"⚠️ 現在の品質メトリクス取得エラー: {e}")
            return False
        
        return True
    
    def load_baseline(self, baseline_file: Path = BASELINE_FILE) -> bool:
        """ベースライン品質を読み込み"""
        if not baseline_file.exists():
            print(f"ℹ️ ベースラインファイルが存在しません: {baseline_file}")
            print(f"   初回実行のため、現在の品質をベースラインとして保存します。")
            return False
        
        try:
            with open(baseline_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.baseline_metrics = QualityMetrics.from_dict(data)
            return True
        except Exception as e:
            print(f"⚠️ ベースライン読み込みエラー: {e}")
            return False
    
    def save_baseline(self, baseline_file: Path = BASELINE_FILE):
        """現在の品質をベースラインとして保存"""
        try:
            with open(baseline_file, 'w', encoding='utf-8') as f:
                json.dump(self.current_metrics.to_dict(), f, indent=2, ensure_ascii=False)
            print(f"✅ ベースラインを保存しました: {baseline_file}")
        except Exception as e:
            print(f"❌ ベースライン保存エラー: {e}")
    
    def save_history(self):
        """品質履歴を追記"""
        history = []
        
        # 既存履歴を読み込み
        if HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            except:
                history = []
        
        # 現在のメトリクスを追加
        history.append(self.current_metrics.to_dict())
        
        # 最新100件のみ保持
        history = history[-100:]
        
        # 保存
        try:
            with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️ 履歴保存エラー: {e}")
    
    def check_regression(self, threshold: float = 1.0) -> bool:
        """品質低下をチェック（threshold: 許容低下率%）"""
        if not self.baseline_metrics:
            return False
        
        metrics_to_check = [
            ('文法品質', self.baseline_metrics.grammar_quality, self.current_metrics.grammar_quality),
            ('語彙品質', self.baseline_metrics.vocabulary_quality, self.current_metrics.vocabulary_quality),
            ('長文タイトル品質', self.baseline_metrics.passage_title_quality, self.current_metrics.passage_title_quality),
            ('長文英文品質', self.baseline_metrics.passage_content_quality, self.current_metrics.passage_content_quality),
            ('文法・和訳タブ品質', self.baseline_metrics.grammar_translation_quality, self.current_metrics.grammar_translation_quality),
            ('UI仕様準拠', self.baseline_metrics.ui_specification_compliance, self.current_metrics.ui_specification_compliance),
            ('総合品質', self.baseline_metrics.overall_quality, self.current_metrics.overall_quality),
        ]
        
        has_regression = False
        
        for name, baseline, current in metrics_to_check:
            if baseline == 0:
                continue
            
            diff = current - baseline
            diff_pct = (diff / baseline) * 100 if baseline > 0 else 0
            
            if diff < -threshold:
                self.regressions.append((name, baseline, current))
                has_regression = True
            elif diff > threshold:
                self.improvements.append((name, baseline, current))
        
        return has_regression
    
    def print_report(self):
        """レポート出力"""
        print("\n" + "="*70)
        print("📊 品質低下検出レポート")
        print("="*70)
        
        print(f"\n⏰ 実行時刻: {self.current_metrics.timestamp}")
        
        if self.baseline_metrics:
            print(f"📅 ベースライン: {self.baseline_metrics.timestamp}")
        
        print(f"\n📈 現在の品質:")
        print(f"  文法:         {self.current_metrics.grammar_quality:.2f}%")
        print(f"  語彙:         {self.current_metrics.vocabulary_quality:.2f}%")
        print(f"  長文タイトル: {self.current_metrics.passage_title_quality:.2f}%")
        print(f"  長文英文:     {self.current_metrics.passage_content_quality:.2f}/100")
        print(f"  文法・和訳:   {self.current_metrics.grammar_translation_quality:.2f}%")
        print(f"  UI仕様準拠:   {self.current_metrics.ui_specification_compliance:.2f}%")
        print(f"  総合:         {self.current_metrics.overall_quality:.2f}%")
        
        if self.regressions:
            print(f"\n🔴 品質低下検出: {len(self.regressions)}件")
            for name, baseline, current in self.regressions:
                diff = current - baseline
                print(f"  {name}: {baseline:.2f} → {current:.2f} ({diff:+.2f})")
        
        if self.improvements:
            print(f"\n🟢 品質改善: {len(self.improvements)}件")
            for name, baseline, current in self.improvements:
                diff = current - baseline
                print(f"  {name}: {baseline:.2f} → {current:.2f} ({diff:+.2f})")
        
        if not self.regressions and not self.improvements and self.baseline_metrics:
            print(f"\n✅ 品質は維持されています")
        
        print("\n" + "="*70)
    
    def suggest_improvements(self):
        """改善提案を生成"""
        if not self.regressions:
            return
        
        print("\n💡 改善提案:")
        
        for name, baseline, current in self.regressions:
            if '文法' in name:
                print(f"\n  【{name}】")
                print(f"    - scripts/validate_all_content.py で重複を確認")
                print(f"    - 問題のある文法問題を特定して修正")
                print(f"    - 新規問題追加時は必ず品質検証を実施")
            
            elif '語彙' in name:
                print(f"\n  【{name}】")
                print(f"    - scripts/fix_vocabulary_duplicates.py で重複修正")
                print(f"    - CSV形式の整合性を確認")
                print(f"    - 語彙追加時は既存との重複チェック")
            
            elif 'タイトル' in name:
                print(f"\n  【{name}】")
                print(f"    - passages/index.json のタイトル重複を確認")
                print(f"    - ユニークなタイトルに変更")
            
            elif '文法・和訳' in name:
                print(f"\n  【{name}】")
                print(f"    - scripts/validate_grammar_translations.py で詳細確認")
                print(f"    - japanese フィールドの文末、冗長表現を修正")
                print(f"    - explanation の長さや難易度を調整")
            
            elif 'UI仕様' in name:
                print(f"\n  【{name}】")
                print(f"    - scripts/validate_ui_specifications.py で詳細確認")
                print(f"    - カラーコードをデザインシステムトークンに置換")
                print(f"    - docs/2-guidelines/ui/DESIGN_SYSTEM_RULES.md を参照")
            
            elif '英文' in name:
                print(f"\n  【{name}】")
                print(f"    - scripts/validate_passage_quality.py で詳細チェック")
                print(f"    - フォーマット: 段落インデント（4スペース）を修正")
                print(f"    - 文構造: 分離された節を統合")
                print(f"    - 語彙: 多様性を向上（類義語使用）")


def main():
    parser = argparse.ArgumentParser(description='品質低下検出')
    parser.add_argument('--baseline', type=Path, help='ベースラインファイルのパス')
    parser.add_argument('--update-baseline', action='store_true', 
                       help='現在の品質をベースラインとして保存')
    parser.add_argument('--auto-update', action='store_true',
                       help='品質が向上した場合、自動的にベースラインを更新')
    parser.add_argument('--threshold', type=float, default=1.0,
                       help='許容低下率（%）デフォルト: 1.0')
    args = parser.parse_args()
    
    checker = QualityRegressionChecker()
    
    print("🔍 品質低下検出を開始...")
    
    # 現在の品質を取得
    if not checker.load_current_metrics():
        print("❌ 現在の品質メトリクス取得に失敗しました")
        return 1
    
    # ベースライン読み込み
    baseline_file = args.baseline or BASELINE_FILE
    has_baseline = checker.load_baseline(baseline_file)
    
    # 履歴に保存
    checker.save_history()
    
    if args.update_baseline or not has_baseline:
        # ベースライン更新
        checker.save_baseline(baseline_file)
        if not has_baseline:
            print("\n✅ 初回実行完了。次回から品質低下を検出します。")
            return 0
    
    # 品質低下チェック
    has_regression = checker.check_regression(threshold=args.threshold)
    
    # 自動ベースライン更新（品質向上時）
    if args.auto_update and checker.improvements and not has_regression:
        print("\n📈 品質向上を検出！ベースラインを自動更新します...")
        checker.save_baseline(baseline_file)
        print("✅ ベースライン更新完了")
    
    # レポート出力
    checker.print_report()
    
    # 改善提案
    if has_regression:
        checker.suggest_improvements()
        print(f"\n⚠️ 品質低下が検出されました。上記の改善提案を参考に修正してください。")
        return 1
    else:
        print(f"\n✅ 品質基準をクリアしています。")
        return 0


if __name__ == "__main__":
    sys.exit(main())
