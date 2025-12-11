#!/usr/bin/env python3
"""
業界標準ツール準拠検証スクリプト

プロジェクトが業界標準のツールとベストプラクティスに準拠しているかを検証します。
"""

import json
import sys
from pathlib import Path
from typing import List, Tuple

# プロジェクトルート
REPO_ROOT = Path(__file__).parent.parent
PROJECT_DIR = REPO_ROOT / "nanashi8.github.io"

# 色定義
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


class IndustryStandardsValidator:
    """業界標準準拠検証"""
    
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []
    
    def validate_all(self) -> bool:
        """全検証を実行"""
        print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
        print(f"{BLUE}🌐 業界標準ツール準拠検証{RESET}")
        print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")
        
        # 各検証を実行
        self._validate_config_files()
        self._validate_package_json()
        self._validate_typescript_config()
        self._validate_git_automation()
        self._validate_test_setup()
        
        # 結果レポート
        return self._report_results()
    
    def _validate_config_files(self):
        """設定ファイルの存在確認"""
        print(f"{BLUE}【必須設定ファイル】{RESET}")
        
        required_files = {
            ".eslintrc.cjs": "ESLint設定",
            ".prettierrc": "Prettier設定",
            ".prettierignore": "Prettier除外設定",
            ".editorconfig": "EditorConfig",
            ".nvmrc": "Node.jsバージョン固定",
            "tsconfig.json": "TypeScript設定",
            "vite.config.ts": "Vite設定",
        }
        
        for file, description in required_files.items():
            file_path = PROJECT_DIR / file
            if file_path.exists():
                self.passed.append(f"{description} ({file})")
                print(f"  {GREEN}✅{RESET} {description} ({file})")
            else:
                self.errors.append(f"{description} ({file}) が見つかりません")
                print(f"  {RED}❌{RESET} {description} ({file})")
        
        print()
    
    def _validate_package_json(self):
        """package.jsonの検証"""
        print(f"{BLUE}【npmスクリプト】{RESET}")
        
        package_json_path = PROJECT_DIR / "package.json"
        
        if not package_json_path.exists():
            self.errors.append("package.json が見つかりません")
            print(f"  {RED}❌{RESET} package.json が見つかりません\n")
            return
        
        with open(package_json_path) as f:
            package_data = json.load(f)
        
        # 必須スクリプト
        required_scripts = {
            "lint": "ESLintチェック",
            "lint:fix": "ESLint自動修正",
            "format": "Prettierフォーマット",
            "format:check": "フォーマット検証",
            "type-check": "TypeScript型チェック",
            "test": "テスト実行",
        }
        
        scripts = package_data.get("scripts", {})
        
        for script, description in required_scripts.items():
            if script in scripts:
                self.passed.append(f"npm run {script}")
                print(f"  {GREEN}✅{RESET} npm run {script} - {description}")
            else:
                self.errors.append(f"npm run {script} が未定義")
                print(f"  {RED}❌{RESET} npm run {script} - 未定義")
        
        # 必須依存パッケージ
        print(f"\n{BLUE}【必須パッケージ】{RESET}")
        
        required_dev_deps = {
            "eslint": "ESLint",
            "@typescript-eslint/parser": "TypeScript ESLint パーサー",
            "@typescript-eslint/eslint-plugin": "TypeScript ESLint プラグイン",
            "prettier": "Prettier",
            "eslint-config-prettier": "ESLint-Prettier統合",
            "vitest": "Vitest",
            "@testing-library/react": "React Testing Library",
            "husky": "Husky (Git hooks)",
            "lint-staged": "lint-staged",
        }
        
        dev_deps = package_data.get("devDependencies", {})
        
        for pkg, description in required_dev_deps.items():
            if pkg in dev_deps:
                version = dev_deps[pkg]
                self.passed.append(f"{pkg}@{version}")
                print(f"  {GREEN}✅{RESET} {description} ({pkg}@{version})")
            else:
                self.errors.append(f"{description} ({pkg}) が未インストール")
                print(f"  {RED}❌{RESET} {description} ({pkg})")
        
        print()
    
    def _validate_typescript_config(self):
        """TypeScript設定の検証"""
        print(f"{BLUE}【TypeScript設定】{RESET}")
        
        tsconfig_path = PROJECT_DIR / "tsconfig.json"
        
        if not tsconfig_path.exists():
            self.errors.append("tsconfig.json が見つかりません")
            print(f"  {RED}❌{RESET} tsconfig.json が見つかりません\n")
            return
        
        try:
            # JSONCをサポートするため、コメントを削除してパース
            content = tsconfig_path.read_text()
            # 単純なコメント削除（完璧ではないが大抵のケースで動作）
            import re
            content = re.sub(r'//.*', '', content)  # 行コメント削除
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)  # ブロックコメント削除
            
            tsconfig = json.loads(content)
        except json.JSONDecodeError as e:
            self.warnings.append(f"tsconfig.jsonのパースに失敗: {e}")
            print(f"  {YELLOW}⚠️{RESET}  tsconfig.jsonのパースに失敗（コメントが原因の可能性）")
            print(f"  {GREEN}✅{RESET} ファイル自体は存在します\n")
            return
        
        compiler_options = tsconfig.get("compilerOptions", {})
        
        # 推奨設定
        recommended_options = {
            "strict": True,
            "noUnusedLocals": True,
            "noUnusedParameters": True,
            "noFallthroughCasesInSwitch": True,
        }
        
        for option, expected_value in recommended_options.items():
            actual_value = compiler_options.get(option)
            if actual_value == expected_value:
                self.passed.append(f"TypeScript {option}: {expected_value}")
                print(f"  {GREEN}✅{RESET} {option}: {expected_value}")
            else:
                self.warnings.append(f"TypeScript {option} が {expected_value} に設定されていません")
                print(f"  {YELLOW}⚠️{RESET}  {option}: {actual_value} (推奨: {expected_value})")
        
        print()
    
    def _validate_git_automation(self):
        """Git自動化の検証"""
        print(f"{BLUE}【Git自動化】{RESET}")
        
        # lint-staged設定
        lintstaged_files = [
            ".lintstagedrc.json",
            ".lintstagedrc.js",
        ]
        
        lintstaged_exists = any((PROJECT_DIR / f).exists() for f in lintstaged_files)
        
        # package.jsonのlint-stagedセクションもチェック
        package_json_path = PROJECT_DIR / "package.json"
        if package_json_path.exists():
            with open(package_json_path) as f:
                package_data = json.load(f)
                if "lint-staged" in package_data:
                    lintstaged_exists = True
        
        if lintstaged_exists:
            self.passed.append("lint-staged設定")
            print(f"  {GREEN}✅{RESET} lint-staged 設定済み")
        else:
            self.warnings.append("lint-staged設定が見つかりません")
            print(f"  {YELLOW}⚠️{RESET}  lint-staged 未設定")
        
        # .husky ディレクトリ
        husky_dir = PROJECT_DIR / ".husky"
        if husky_dir.exists():
            self.passed.append("Husky設定")
            print(f"  {GREEN}✅{RESET} Husky ディレクトリ存在")
        else:
            self.warnings.append("Huskyディレクトリが見つかりません")
            print(f"  {YELLOW}⚠️{RESET}  Husky 未初期化 (npm install後にnpx husky installが必要)")
        
        print()
    
    def _validate_test_setup(self):
        """テスト環境の検証"""
        print(f"{BLUE}【テスト環境】{RESET}")
        
        # vite.config.tsのtest設定確認
        vite_config_path = PROJECT_DIR / "vite.config.ts"
        
        if vite_config_path.exists():
            content = vite_config_path.read_text()
            if "test:" in content or "test {" in content:
                self.passed.append("Vitest設定")
                print(f"  {GREEN}✅{RESET} vite.config.ts にtest設定あり")
            else:
                self.errors.append("vite.config.ts にtest設定がありません")
                print(f"  {RED}❌{RESET} vite.config.ts にtest設定なし")
        
        # テストセットアップファイル
        test_setup_files = [
            "src/tests/setup.ts",
            "src/test/setup.ts",
            "src/setupTests.ts",
        ]
        
        setup_exists = any((PROJECT_DIR / f).exists() for f in test_setup_files)
        
        if setup_exists:
            self.passed.append("テストセットアップファイル")
            print(f"  {GREEN}✅{RESET} テストセットアップファイル存在")
        else:
            self.warnings.append("テストセットアップファイルが見つかりません")
            print(f"  {YELLOW}⚠️{RESET}  テストセットアップファイル未作成")
        
        # テストファイルの存在確認
        test_dirs = [
            PROJECT_DIR / "src" / "tests",
            PROJECT_DIR / "src" / "test",
            PROJECT_DIR / "tests",
            PROJECT_DIR / "test",
        ]
        
        test_files_found = False
        for test_dir in test_dirs:
            if test_dir.exists():
                test_files = list(test_dir.glob("**/*.test.ts*"))
                if test_files:
                    test_files_found = True
                    self.passed.append(f"{len(test_files)}個のテストファイル")
                    print(f"  {GREEN}✅{RESET} {len(test_files)}個のテストファイル検出")
                    break
        
        if not test_files_found:
            self.warnings.append("テストファイルが見つかりません")
            print(f"  {YELLOW}⚠️{RESET}  テストファイル未作成")
        
        print()
    
    def _report_results(self) -> bool:
        """検証結果をレポート"""
        print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
        print(f"{BLUE}📊 検証結果サマリー{RESET}")
        print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")
        
        total = len(self.passed) + len(self.warnings) + len(self.errors)
        
        if self.passed:
            print(f"{GREEN}✅ 成功: {len(self.passed)}項目{RESET}")
        
        if self.warnings:
            print(f"{YELLOW}⚠️  警告: {len(self.warnings)}項目{RESET}")
            for warning in self.warnings[:5]:  # 最初の5件のみ表示
                print(f"   - {warning}")
            if len(self.warnings) > 5:
                print(f"   ... 他 {len(self.warnings) - 5}件")
        
        if self.errors:
            print(f"{RED}❌ エラー: {len(self.errors)}項目{RESET}")
            for error in self.errors:
                print(f"   - {error}")
        
        print()
        
        # 成熟度スコア計算
        score = int((len(self.passed) / max(total, 1)) * 100)
        
        print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
        
        if len(self.errors) == 0:
            if len(self.warnings) == 0:
                print(f"{GREEN}🎉 業界標準準拠: 完璧です！ (スコア: {score}/100){RESET}")
            else:
                print(f"{GREEN}✅ 業界標準準拠: 良好です (スコア: {score}/100){RESET}")
                print(f"{YELLOW}   警告を解消するとさらに改善できます{RESET}")
            print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")
            return True
        else:
            print(f"{RED}❌ 業界標準準拠: 改善が必要です (スコア: {score}/100){RESET}")
            print(f"{RED}   エラーを修正してください{RESET}")
            print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")
            return False


def main() -> int:
    """メインエントリーポイント"""
    validator = IndustryStandardsValidator()
    success = validator.validate_all()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
