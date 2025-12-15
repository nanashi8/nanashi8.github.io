#!/usr/bin/env python3
"""
定期メンテナンスAI

プロジェクトの各要所を定期的にチェックし、問題を自動検出・修正します。

メンテナンス対象:
1. データ品質 (Grammar, Vocabulary, Pronunciation)
2. コード品質 (TypeScript, Tests)
3. ドキュメント (README, ガイドライン)
4. 依存関係 (npm packages)
5. パフォーマンス (ビルドサイズ, レスポンス時間)
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse

class MaintenanceAI:
    """定期メンテナンスAI"""

    def __init__(self, base_dir: Path, verbose: bool = False):
        self.base_dir = base_dir
        self.verbose = verbose
        self.issues: List[Dict[str, Any]] = []
        self.auto_fixes: List[Dict[str, Any]] = []

    def log(self, message: str, level: str = "INFO"):
        """ログ出力"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = {
            "INFO": "ℹ️ ",
            "SUCCESS": "✅",
            "WARNING": "⚠️ ",
            "ERROR": "❌",
            "FIX": "🔧"
        }.get(level, "  ")

        if self.verbose or level in ["WARNING", "ERROR", "FIX"]:
            print(f"[{timestamp}] {prefix} {message}")

    def add_issue(self, category: str, severity: str, description: str,
                  file_path: Optional[str] = None, auto_fix: bool = False):
        """問題を記録"""
        issue = {
            "category": category,
            "severity": severity,  # CRITICAL, WARNING, INFO
            "description": description,
            "file_path": file_path,
            "auto_fix": auto_fix,
            "timestamp": datetime.now().isoformat()
        }
        self.issues.append(issue)

        level = "ERROR" if severity == "CRITICAL" else "WARNING"
        self.log(f"[{category}] {description}", level)

    def check_data_quality(self):
        """データ品質チェック"""
        self.log("=" * 60)
        self.log("データ品質チェック開始", "INFO")
        self.log("=" * 60)

        # 品質神経系統を実行（JSON出力を有効化）
        try:
            env = os.environ.copy()
            env["EXPORT_JSON"] = "1"

            result = subprocess.run(
                ["python3", "scripts/quality_nervous_system.py"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=300,
                env=env
            )

            # JSONレポートを読み込み
            report_path = self.base_dir / "tools" / "data" / "quality_nervous_system_report.json"
            if report_path.exists():
                try:
                    with open(report_path, "r", encoding="utf-8") as f:
                        quality_report = json.load(f)

                    # 詳細な問題を個別に記録
                    for issue in quality_report.get("issues", []):
                        self.add_issue(
                            "data_quality",
                            issue.get("severity", "WARNING"),
                            f"{Path(issue.get('file_path', '')).name}: {issue['description']}",
                            file_path=issue.get("file_path"),
                            auto_fix=False
                        )

                    # サマリーログ
                    if quality_report.get("critical_issues", 0) > 0:
                        self.log(f"CRITICAL問題: {quality_report['critical_issues']}件", "ERROR")
                    if quality_report.get("warning_issues", 0) > 0:
                        self.log(f"WARNING: {quality_report['warning_issues']}件", "WARNING")

                    if quality_report.get("total_issues", 0) == 0:
                        self.log("品質神経系統チェック完了: 問題なし", "SUCCESS")

                except json.JSONDecodeError:
                    self.log("JSONレポートの解析に失敗", "WARNING")

            elif result.returncode != 0:
                self.add_issue(
                    "data_quality",
                    "CRITICAL",
                    "品質神経系統がCRITICAL異常を検出",
                    auto_fix=False
                )
                if self.verbose:
                    self.log(result.stdout, "ERROR")

        except subprocess.TimeoutExpired:
            self.add_issue(
                "data_quality",
                "WARNING",
                "品質チェックがタイムアウト（5分超過）",
                auto_fix=False
            )
        except FileNotFoundError:
            self.add_issue(
                "data_quality",
                "WARNING",
                "品質神経系統スクリプトが見つかりません",
                file_path="scripts/quality_nervous_system.py",
                auto_fix=False
            )

    def check_test_coverage(self):
        """テストカバレッジチェック"""
        self.log("=" * 60)
        self.log("テストカバレッジチェック開始", "INFO")
        self.log("=" * 60)

        try:
            # Vitestでカバレッジレポート生成
            result = subprocess.run(
                ["npx", "vitest", "run", "--coverage", "--reporter=json"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=300
            )

            # カバレッジが低い場合は警告
            if "coverage" in result.stdout.lower():
                # パーセンテージを抽出
                coverage_match = re.search(r"(\d+\.?\d*)%", result.stdout)
                if coverage_match:
                    coverage = float(coverage_match.group(1))
                    if coverage < 50:
                        self.add_issue(
                            "test_coverage",
                            "WARNING",
                            f"テストカバレッジが低い: {coverage}% (目標: 50%以上)",
                            auto_fix=False
                        )
                    else:
                        self.log(f"テストカバレッジ: {coverage}%", "SUCCESS")

        except subprocess.TimeoutExpired:
            self.add_issue(
                "test_coverage",
                "WARNING",
                "テスト実行がタイムアウト（5分超過）",
                auto_fix=False
            )
        except Exception as e:
            self.log(f"テストカバレッジチェックエラー: {e}", "WARNING")

    def check_dependencies(self):
        """依存関係チェック"""
        self.log("=" * 60)
        self.log("依存関係チェック開始", "INFO")
        self.log("=" * 60)

        package_json = self.base_dir / "package.json"

        if not package_json.exists():
            self.add_issue(
                "dependencies",
                "CRITICAL",
                "package.jsonが見つかりません",
                file_path="package.json",
                auto_fix=False
            )
            return

        try:
            # npm audit で脆弱性チェック
            result = subprocess.run(
                ["npm", "audit", "--json"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.stdout:
                audit_data = json.loads(result.stdout)
                vulnerabilities = audit_data.get("metadata", {}).get("vulnerabilities", {})

                critical = vulnerabilities.get("critical", 0)
                high = vulnerabilities.get("high", 0)
                moderate = vulnerabilities.get("moderate", 0)

                if critical > 0:
                    self.add_issue(
                        "dependencies",
                        "CRITICAL",
                        f"Critical脆弱性: {critical}件",
                        auto_fix=True
                    )
                    self.auto_fixes.append({
                        "type": "npm_audit_fix",
                        "command": "npm audit fix --force"
                    })

                if high > 0:
                    self.add_issue(
                        "dependencies",
                        "WARNING",
                        f"High脆弱性: {high}件",
                        auto_fix=True
                    )

                if critical == 0 and high == 0 and moderate == 0:
                    self.log("依存関係に脆弱性なし", "SUCCESS")

        except json.JSONDecodeError:
            self.log("npm audit結果のパースエラー", "WARNING")
        except subprocess.TimeoutExpired:
            self.add_issue(
                "dependencies",
                "WARNING",
                "npm auditがタイムアウト",
                auto_fix=False
            )
        except Exception as e:
            self.log(f"依存関係チェックエラー: {e}", "WARNING")

    def check_code_quality(self):
        """コード品質チェック (ESLint, Prettier, Stylelint, Markdownlint)"""
        self.log("=" * 60)
        self.log("コード品質チェック開始", "INFO")
        self.log("=" * 60)

        # ESLintチェック & 自動修正
        try:
            result = subprocess.run(
                ["npm", "run", "lint:errors-only"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=120
            )

            if result.returncode != 0:
                error_lines = [line for line in result.stdout.split('\n') if 'error' in line.lower()]
                if error_lines:
                    self.add_issue(
                        "code_quality",
                        "WARNING",
                        f"ESLintエラー: {len(error_lines)}件検出",
                        auto_fix=True
                    )
                    # ESLint --fixは直接実行
                    self.auto_fixes.append({
                        "type": "eslint_fix",
                        "command": "npx eslint . --ext ts,tsx --fix"
                    })
            else:
                self.log("ESLintチェック: 問題なし", "SUCCESS")
        except Exception as e:
            self.log(f"ESLintチェックエラー: {e}", "WARNING")

        # Prettierフォーマットチェック & 自動修正
        try:
            result = subprocess.run(
                ["npm", "run", "format:check"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                self.add_issue(
                    "code_quality",
                    "INFO",
                    "コードフォーマットの不整合を検出",
                    auto_fix=True
                )
                self.auto_fixes.append({
                    "type": "prettier_format",
                    "command": "npm run format"
                })
            else:
                self.log("Prettierフォーマット: 問題なし", "SUCCESS")
        except Exception as e:
            self.log(f"Prettierチェックエラー: {e}", "WARNING")

        # Stylelintチェック & 自動修正
        try:
            result = subprocess.run(
                ["npx", "stylelint", "**/*.css", "--formatter", "json"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.stdout:
                try:
                    stylelint_results = json.loads(result.stdout)
                    total_warnings = sum(len(r.get("warnings", [])) for r in stylelint_results)

                    if total_warnings > 0:
                        self.add_issue(
                            "code_quality",
                            "WARNING",
                            f"Stylelintの問題: {total_warnings}件検出",
                            auto_fix=True
                        )
                        self.auto_fixes.append({
                            "type": "stylelint_fix",
                            "command": "npx stylelint '**/*.css' --fix"
                        })
                    else:
                        self.log("Stylelintチェック: 問題なし", "SUCCESS")
                except json.JSONDecodeError:
                    self.log("Stylelintチェック: 問題なし", "SUCCESS")
        except Exception as e:
            self.log(f"Stylelintチェックエラー: {e}", "WARNING")

        # Markdownlintチェック & 自動修正
        if (self.base_dir / ".markdownlint.json").exists():
            try:
                result = subprocess.run(
                    ["npx", "markdownlint", "**/*.md", "--ignore", "node_modules", "--json"],
                    cwd=self.base_dir,
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.stdout:
                    try:
                        markdownlint_results = json.loads(result.stdout)
                        total_errors = sum(len(errors) for errors in markdownlint_results.values())

                        if total_errors > 0:
                            self.add_issue(
                                "documentation",
                                "WARNING",
                                f"Markdownlintの問題: {total_errors}件検出",
                                auto_fix=True
                            )
                            self.auto_fixes.append({
                                "type": "markdownlint_fix",
                                "command": "npx markdownlint '**/*.md' --ignore node_modules --fix"
                            })
                        else:
                            self.log("Markdownlintチェック: 問題なし", "SUCCESS")
                    except json.JSONDecodeError:
                        self.log("Markdownlintチェック: 問題なし", "SUCCESS")
            except Exception as e:
                self.log(f"Markdownlintチェックエラー: {e}", "WARNING")

    def check_file_sizes(self):
        """ファイルサイズチェック"""
        self.log("=" * 60)
        self.log("ファイルサイズチェック開始", "INFO")
        self.log("=" * 60)

        # 大きすぎるファイルを検出 (>10MB)
        large_files = []
        data_dir = self.base_dir / "public" / "data"

        if data_dir.exists():
            for file_path in data_dir.rglob("*.json"):
                size_mb = file_path.stat().st_size / (1024 * 1024)
                if size_mb > 10:
                    large_files.append((file_path, size_mb))

        if large_files:
            for file_path, size_mb in large_files:
                self.add_issue(
                    "file_size",
                    "WARNING",
                    f"大きすぎるファイル: {file_path.name} ({size_mb:.1f}MB)",
                    file_path=str(file_path),
                    auto_fix=False
                )
        else:
            self.log("すべてのファイルサイズが適切", "SUCCESS")

    def check_documentation(self):
        """ドキュメントチェック"""
        self.log("=" * 60)
        self.log("ドキュメントチェック開始", "INFO")
        self.log("=" * 60)

        # 必須ドキュメントの存在確認
        required_docs = [
            "README.md",
            "docs/INTEGRATED_QUALITY_PIPELINE.md",
            "docs/quality/EMERGENCY_QUALITY_NERVOUS_SYSTEM_REPORT.md",
            ".aitk/instructions/testing-guidelines.instructions.md"
        ]

        for doc_path in required_docs:
            full_path = self.base_dir / doc_path
            if not full_path.exists():
                self.add_issue(
                    "documentation",
                    "WARNING",
                    f"必須ドキュメントが見つかりません: {doc_path}",
                    file_path=doc_path,
                    auto_fix=False
                )

        # README.mdの最終更新チェック
        readme = self.base_dir / "README.md"
        if readme.exists():
            mtime = datetime.fromtimestamp(readme.stat().st_mtime)
            days_old = (datetime.now() - mtime).days

            if days_old > 30:
                self.add_issue(
                    "documentation",
                    "INFO",
                    f"README.mdが{days_old}日間更新されていません",
                    file_path="README.md",
                    auto_fix=False
                )

        self.log("ドキュメントチェック完了", "SUCCESS")

    def check_performance_metrics(self):
        """パフォーマンスメトリクスをチェック"""
        self.log("=" * 60)
        self.log("パフォーマンスメトリクスチェック", "INFO")
        self.log("=" * 60)

        # 1. ビルド時間測定
        try:
            self.log("ビルド時間を測定中...", "INFO")
            start_time = datetime.now()

            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=300
            )

            build_time = (datetime.now() - start_time).total_seconds()

            if result.returncode == 0:
                if build_time > 60:  # 60秒以上
                    self.add_issue(
                        "performance",
                        "WARNING",
                        f"ビルド時間が長い: {build_time:.1f}秒（目標: <60秒）",
                        auto_fix=False
                    )
                else:
                    self.log(f"ビルド時間: {build_time:.1f}秒 ✓", "SUCCESS")
            else:
                self.add_issue(
                    "performance",
                    "ERROR",
                    "ビルドが失敗しました",
                    auto_fix=False
                )

        except subprocess.TimeoutExpired:
            self.add_issue(
                "performance",
                "CRITICAL",
                "ビルドが5分以内に完了しません",
                auto_fix=False
            )
        except FileNotFoundError:
            self.log("npm が見つかりません（ビルド時間測定スキップ）", "WARNING")

        # 2. dist/ サイズチェック
        dist_path = self.base_dir / "dist"
        if dist_path.exists():
            try:
                total_size = sum(f.stat().st_size for f in dist_path.rglob('*') if f.is_file())
                size_mb = total_size / (1024 * 1024)

                if size_mb > 10:  # 10MB以上
                    self.add_issue(
                        "performance",
                        "WARNING",
                        f"ビルドサイズが大きい: {size_mb:.1f}MB（目標: <10MB）",
                        auto_fix=False
                    )
                else:
                    self.log(f"ビルドサイズ: {size_mb:.1f}MB ✓", "SUCCESS")
            except Exception as e:
                self.log(f"ビルドサイズ測定エラー: {e}", "WARNING")
        else:
            self.log("dist/ ディレクトリが存在しません（サイズチェックスキップ）", "INFO")

        # 3. 大きなファイルの検出（10MB以上）
        large_files = []
        try:
            for file_path in self.base_dir.rglob('*'):
                if file_path.is_file() and not any(
                    part.startswith('.') or part in ['node_modules', 'dist', '.git']
                    for part in file_path.parts
                ):
                    size_mb = file_path.stat().st_size / (1024 * 1024)
                    if size_mb > 10:
                        large_files.append((str(file_path.relative_to(self.base_dir)), size_mb))

            if large_files:
                for file_path, size in large_files:
                    self.add_issue(
                        "performance",
                        "WARNING",
                        f"大きなファイル: {file_path} ({size:.1f}MB)",
                        file_path=file_path,
                        auto_fix=False
                    )
        except Exception as e:
            self.log(f"大きなファイル検出エラー: {e}", "WARNING")

        self.log("パフォーマンスメトリクスチェック完了", "SUCCESS")

    def check_git_status(self):
        """Gitステータスチェック"""
        self.log("=" * 60)
        self.log("Gitステータスチェック開始", "INFO")
        self.log("=" * 60)

        try:
            # 未コミットの変更をチェック
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.stdout.strip():
                lines = result.stdout.strip().split("\n")
                self.add_issue(
                    "git",
                    "INFO",
                    f"未コミットの変更: {len(lines)}ファイル",
                    auto_fix=False
                )
            else:
                self.log("作業ディレクトリがクリーン", "SUCCESS")

            # リモートとの同期状態をチェック
            result = subprocess.run(
                ["git", "rev-list", "--left-right", "--count", "HEAD...@{u}"],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0 and result.stdout.strip():
                ahead, behind = map(int, result.stdout.strip().split())
                if ahead > 0:
                    self.add_issue(
                        "git",
                        "INFO",
                        f"ローカルが{ahead}コミット進んでいます（push推奨）",
                        auto_fix=False
                    )
                if behind > 0:
                    self.add_issue(
                        "git",
                        "WARNING",
                        f"リモートが{behind}コミット進んでいます（pull推奨）",
                        auto_fix=False
                    )

        except subprocess.TimeoutExpired:
            self.log("Gitステータスチェックがタイムアウト", "WARNING")
        except Exception as e:
            self.log(f"Gitステータスチェックエラー: {e}", "WARNING")

    def apply_auto_fixes(self, dry_run: bool = True):
        """自動修正を適用"""
        if not self.auto_fixes:
            self.log("自動修正対象なし", "INFO")
            return

        self.log("=" * 60)
        self.log(f"自動修正適用 (dry_run={dry_run})", "FIX")
        self.log("=" * 60)

        for fix in self.auto_fixes:
            self.log(f"修正タイプ: {fix['type']}", "FIX")
            self.log(f"コマンド: {fix['command']}", "FIX")

            if not dry_run:
                try:
                    # シェルコマンドの場合はshell=Trueを使用
                    use_shell = fix.get('use_shell', False)
                    cmd = fix['command'] if use_shell else fix['command'].split()

                    result = subprocess.run(
                        cmd,
                        cwd=self.base_dir,
                        capture_output=True,
                        text=True,
                        timeout=300,
                        shell=use_shell
                    )

                    if result.returncode == 0:
                        self.log(f"修正成功: {fix['type']}", "SUCCESS")
                    else:
                        self.log(f"修正失敗: {fix['type']}", "ERROR")
                        self.log(result.stderr[:200], "ERROR")

                except Exception as e:
                    self.log(f"修正エラー: {e}", "ERROR")
            else:
                self.log("(dry_run mode - 実行スキップ)", "INFO")

    def generate_report(self) -> Dict[str, Any]:
        """レポート生成"""
        self.log("=" * 60)
        self.log("メンテナンスレポート生成", "INFO")
        self.log("=" * 60)

        report = {
            "timestamp": datetime.now().isoformat(),
            "total_issues": len(self.issues),
            "critical_issues": len([i for i in self.issues if i["severity"] == "CRITICAL"]),
            "warning_issues": len([i for i in self.issues if i["severity"] == "WARNING"]),
            "info_issues": len([i for i in self.issues if i["severity"] == "INFO"]),
            "auto_fixable": len([i for i in self.issues if i["auto_fix"]]),
            "issues": self.issues,
            "auto_fixes_available": self.auto_fixes
        }

        # サマリー表示
        self.log(f"総問題数: {report['total_issues']}", "INFO")
        self.log(f"  CRITICAL: {report['critical_issues']}", "ERROR" if report['critical_issues'] > 0 else "INFO")
        self.log(f"  WARNING: {report['warning_issues']}", "WARNING" if report['warning_issues'] > 0 else "INFO")
        self.log(f"  INFO: {report['info_issues']}", "INFO")
        self.log(f"自動修正可能: {report['auto_fixable']}", "FIX" if report['auto_fixable'] > 0 else "INFO")

        return report

    def save_report(self, report: Dict[str, Any], output_path: Optional[Path] = None):
        """レポートを保存"""
        if output_path is None:
            output_path = self.base_dir / "tools" / "data" / "maintenance_report.json"

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        self.log(f"レポート保存: {output_path}", "SUCCESS")

    def run_full_maintenance(self, auto_fix: bool = False, dry_run: bool = True):
        """完全メンテナンス実行"""
        self.log("🤖 定期メンテナンスAI起動", "INFO")
        self.log(f"実行時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", "INFO")
        self.log(f"対象ディレクトリ: {self.base_dir}", "INFO")
        self.log("")

        # 各種チェック実行
        self.check_data_quality()
        self.check_test_coverage()
        self.check_dependencies()
        self.check_code_quality()  # 🆕 ESLint, Prettierチェック追加
        self.check_file_sizes()
        self.check_documentation()
        self.check_performance_metrics()
        self.check_git_status()

        # 自動修正適用
        if auto_fix and self.auto_fixes:
            self.apply_auto_fixes(dry_run=dry_run)

        # レポート生成・保存
        report = self.generate_report()
        self.save_report(report)

        self.log("")
        self.log("🎉 メンテナンス完了", "SUCCESS")

        # 終了コード判定
        if report["critical_issues"] > 0:
            return 1
        return 0

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description="定期メンテナンスAI")
    parser.add_argument("--base-dir", type=str, default=".",
                       help="プロジェクトのベースディレクトリ")
    parser.add_argument("--auto-fix", action="store_true",
                       help="自動修正を有効化")
    parser.add_argument("--no-dry-run", action="store_true",
                       help="dry_runモードを無効化（実際に修正を適用）")
    parser.add_argument("--verbose", action="store_true",
                       help="詳細ログを出力")
    parser.add_argument("--output", type=str,
                       help="レポート出力先")

    args = parser.parse_args()

    base_dir = Path(args.base_dir).resolve()

    if not base_dir.exists():
        print(f"❌ ディレクトリが見つかりません: {base_dir}")
        return 1

    ai = MaintenanceAI(base_dir, verbose=args.verbose)

    exit_code = ai.run_full_maintenance(
        auto_fix=args.auto_fix,
        dry_run=not args.no_dry_run
    )

    return exit_code

if __name__ == "__main__":
    sys.exit(main())
