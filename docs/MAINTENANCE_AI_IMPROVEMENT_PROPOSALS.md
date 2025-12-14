# メンテナンスAI 改善提案

実装済みシステムの分析に基づく、優先度付き改善提案

---

## 🎯 優先度: 高（すぐに実装推奨）

### 1. 業界標準ツールの段階的導入

#### A. Dependabotの活性化 ✅ **既に存在**

**現状**: `.github/dependabot.yml` は既に実装済み
**推奨**: メンテナンスAIとの連携

```python
# scripts/maintenance_ai.py に追加
def check_dependabot_status(self):
    """Dependabot PRの状態をチェック"""
    self.log("Dependabot PR状態チェック", "INFO")
    
    try:
        # GitHub API経由でDependabot PRを取得
        result = subprocess.run(
            ["gh", "pr", "list", "--label", "dependencies", "--json", "number,title,updatedAt"],
            cwd=self.base_dir,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            prs = json.loads(result.stdout)
            
            # 30日以上放置されているPRを警告
            for pr in prs:
                updated = datetime.fromisoformat(pr["updatedAt"].replace("Z", "+00:00"))
                days_old = (datetime.now(updated.tzinfo) - updated).days
                
                if days_old > 30:
                    self.add_issue(
                        "dependencies",
                        "WARNING",
                        f"Dependabot PR #{pr['number']} が{days_old}日間放置されています",
                        auto_fix=False
                    )
                    
    except FileNotFoundError:
        self.add_issue(
            "dependencies",
            "INFO",
            "GitHub CLIがインストールされていません（gh）",
            auto_fix=False
        )
```

**効果**:
- ✅ セキュリティアップデートの遅延を検出
- ✅ 依存関係の最新性を維持

---

#### B. CodeQL統合（セキュリティスキャン）

**実装**: 新規ワークフロー追加

```yaml
# .github/workflows/codeql.yml
name: CodeQL Security Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 10 * * 1'  # 毎週月曜 19:00 JST

jobs:
  analyze:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read

    strategy:
      matrix:
        language: ['javascript', 'python']

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{matrix.language}}"
```

**メンテナンスAI統合**:
```python
def check_security_alerts(self):
    """GitHub Security Alertsをチェック"""
    try:
        # GitHub Security Advisoriesを確認
        result = subprocess.run(
            ["gh", "api", "/repos/{owner}/{repo}/dependabot/alerts", "--jq", "length"],
            cwd=self.base_dir,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            alert_count = int(result.stdout.strip())
            
            if alert_count > 0:
                self.add_issue(
                    "security",
                    "CRITICAL",
                    f"{alert_count}件のセキュリティアラートが未解決です",
                    auto_fix=False
                )
    except Exception as e:
        self.log(f"セキュリティアラートチェックエラー: {e}", "WARNING")
```

**効果**:
- ✅ SQL injection, XSS などの脆弱性自動検出
- ✅ 無料（GitHubパブリックリポジトリ）

---

### 2. 品質神経系統との深い統合

**現状**: `maintenance_ai.py` は `quality_nervous_system.py` を実行するのみ
**問題**: 詳細な問題内容を取得できない

#### 改善案A: JSON出力形式の統一

```python
# scripts/quality_nervous_system.py に追加
def export_json_report(issues: List[Dict], output_path: str = "quality_nervous_system_report.json"):
    """JSON形式でレポート出力"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "total_issues": len(issues),
        "critical_issues": len([i for i in issues if i["severity"] == "CRITICAL"]),
        "issues": issues
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    return output_path

# メイン処理の最後で呼び出し
if __name__ == "__main__":
    # ... 既存の処理 ...
    
    # JSON出力
    if os.environ.get("EXPORT_JSON") == "1":
        export_json_report(all_issues)
```

**メンテナンスAI側の改善**:
```python
def check_data_quality(self):
    """データ品質チェック"""
    self.log("データ品質チェック開始", "INFO")
    
    try:
        # JSON出力を有効化
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
        
        # JSON レポートを読み込み
        report_path = self.base_dir / "quality_nervous_system_report.json"
        if report_path.exists():
            with open(report_path, "r", encoding="utf-8") as f:
                quality_report = json.load(f)
            
            # 詳細な問題を個別に記録
            for issue in quality_report.get("issues", []):
                self.add_issue(
                    "data_quality",
                    issue.get("severity", "WARNING"),
                    f"{issue['file_path']}: {issue['description']}",
                    file_path=issue.get("file_path"),
                    auto_fix=False
                )
                
    except Exception as e:
        self.log(f"品質チェックエラー: {e}", "ERROR")
```

**効果**:
- ✅ 問題の詳細をメンテナンスAIレポートに統合
- ✅ ファイル別・問題別の追跡が可能

---

### 3. 自動修正機能の拡張

**現状**: `auto_fix` フラグはあるが、実装は `npm audit fix` のみ

#### 実装すべき自動修正

##### A. コード品質の自動修正

```python
def apply_code_quality_fixes(self):
    """コード品質の自動修正"""
    fixes = []
    
    # 1. ESLint 自動修正
    fixes.append({
        "type": "eslint",
        "command": "npm run lint:fix",
        "description": "ESLint自動修正"
    })
    
    # 2. Prettier フォーマット
    fixes.append({
        "type": "prettier",
        "command": "npx prettier --write 'src/**/*.{ts,tsx,css}'",
        "description": "コードフォーマット"
    })
    
    # 3. 未使用import削除
    fixes.append({
        "type": "unused-imports",
        "command": "npx ts-prune --ignore 'src/vite-env.d.ts|*.test.ts'",
        "description": "未使用importチェック"
    })
    
    return fixes
```

##### B. データ品質の自動修正

```python
def apply_data_quality_fixes(self):
    """データ品質の自動修正"""
    fixes = []
    
    # 語彙多様性不足の自動修正
    # （既存スクリプトの活用）
    if self._has_vocabulary_diversity_issue():
        fixes.append({
            "type": "vocabulary",
            "command": "python3 scripts/improve_vocabulary_diversity.py --auto-fix",
            "description": "語彙多様性の改善"
        })
    
    # パッセージ品質の自動修正
    if self._has_passage_quality_issue():
        fixes.append({
            "type": "passage",
            "command": "python3 scripts/validate_passage_quality.py --fix",
            "description": "パッセージ品質の修正"
        })
    
    return fixes
```

**効果**:
- ✅ 単純な問題を自動修正
- ✅ 人間は複雑な問題にフォーカス

---

### 4. パフォーマンス測定の追加

**現状**: ファイルサイズチェックのみ
**必要性**: ビルド時間、実行速度の追跡

```python
def check_performance_metrics(self):
    """パフォーマンスメトリクスをチェック"""
    self.log("パフォーマンスメトリクスチェック", "INFO")
    
    # 1. ビルド時間測定
    try:
        start_time = datetime.now()
        
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=self.base_dir,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        build_time = (datetime.now() - start_time).total_seconds()
        
        if build_time > 60:  # 60秒以上
            self.add_issue(
                "performance",
                "WARNING",
                f"ビルド時間が長い: {build_time:.1f}秒（目標: <60秒）",
                auto_fix=False
            )
        else:
            self.log(f"ビルド時間: {build_time:.1f}秒", "SUCCESS")
            
    except subprocess.TimeoutExpired:
        self.add_issue(
            "performance",
            "CRITICAL",
            "ビルドが5分以内に完了しません",
            auto_fix=False
        )
    
    # 2. dist/ サイズチェック
    dist_path = self.base_dir / "dist"
    if dist_path.exists():
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
            self.log(f"ビルドサイズ: {size_mb:.1f}MB", "SUCCESS")
    
    # 3. lighthouse CI スコア（既存ワークフローがあれば）
    lighthouse_report = self.base_dir / "lighthouse-report.json"
    if lighthouse_report.exists():
        with open(lighthouse_report, "r") as f:
            report = json.load(f)
            performance_score = report.get("categories", {}).get("performance", {}).get("score", 0) * 100
            
            if performance_score < 90:
                self.add_issue(
                    "performance",
                    "WARNING",
                    f"Lighthouseパフォーマンススコア: {performance_score}（目標: ≥90）",
                    auto_fix=False
                )
```

**効果**:
- ✅ パフォーマンス劣化を早期検出
- ✅ リリース前のボトルネック特定

---

## 🎯 優先度: 中（1-2週間以内）

### 5. 既存ワークフローとの重複排除

**現状**: 20個のワークフローが存在
```
auto-deploy.yml
auto-fix.yml
build.yml
grammar-quality-check.yml
health-check.yml
maintenance-ai.yml
quality-nervous-system.yml
smoke-test.yml
...
```

**問題**:
- ワークフロー間の重複チェック
- 実行時間の無駄
- CI/CD コストの増加

#### 改善案: 統合ワークフロー

```yaml
# .github/workflows/integrated-quality-pipeline.yml
name: 統合品質パイプライン

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 18 * * *'  # 毎日

jobs:
  # Job 1: 高速チェック（並列実行）
  fast-checks:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        check: [lint, typecheck, unit-test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run ${{ matrix.check }}
  
  # Job 2: データ品質（品質神経系統）
  data-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: python3 scripts/quality_nervous_system.py
  
  # Job 3: メンテナンスAI（スケジュール時のみ）
  maintenance:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    needs: [fast-checks, data-quality]
    steps:
      - uses: actions/checkout@v4
      - run: python3 scripts/maintenance_ai.py --verbose
  
  # Job 4: デプロイ（mainブランチのみ）
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [fast-checks, data-quality]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - run: npm run deploy
```

**効果**:
- ✅ ワークフロー数を20個 → 5-7個に削減
- ✅ CI/CD 実行時間を50%削減
- ✅ 保守性向上

---

### 6. 通知システムの強化

**現状**: GitHub Issueのみ
**必要性**: リアルタイム通知

#### A. Slack統合（既に準備済み）

```python
# scripts/maintenance_ai.py
def send_slack_notification(self, report: Dict[str, Any]):
    """Slack通知を送信"""
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    
    if not webhook_url:
        self.log("Slack webhook URL未設定", "INFO")
        return
    
    # CRITICALがある場合のみ通知
    if report["critical_issues"] == 0:
        return
    
    message = {
        "text": "🚨 メンテナンスAI: CRITICAL問題を検出",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🤖 定期メンテナンスAI レポート"
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*総問題数:* {report['total_issues']}"},
                    {"type": "mrkdwn", "text": f"*CRITICAL:* {report['critical_issues']}"},
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "\n".join([
                        f"• *{i['category']}*: {i['description']}"
                        for i in report['issues']
                        if i['severity'] == 'CRITICAL'
                    ][:5])  # 最初の5件のみ
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "詳細を見る"},
                        "url": f"https://github.com/{os.environ.get('GITHUB_REPOSITORY')}/actions"
                    }
                ]
            }
        ]
    }
    
    try:
        import requests
        response = requests.post(webhook_url, json=message, timeout=10)
        response.raise_for_status()
        self.log("Slack通知送信成功", "SUCCESS")
    except Exception as e:
        self.log(f"Slack通知エラー: {e}", "WARNING")
```

#### B. Email通知

```python
def send_email_notification(self, report: Dict[str, Any]):
    """Email通知（GitHub Actionsの機能を利用）"""
    # GitHub Actionsの標準出力を利用
    if report["critical_issues"] > 0:
        print("::error::CRITICAL問題が検出されました")
        print(f"::set-output name=has_critical::{True}")
```

```yaml
# .github/workflows/maintenance-ai.yml に追加
- name: Email通知
  if: steps.maintenance.outputs.has_critical == 'true'
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{secrets.MAIL_USERNAME}}
    password: ${{secrets.MAIL_PASSWORD}}
    subject: 🚨 メンテナンスAI: CRITICAL問題
    body: file://maintenance_report.json
    to: ${{secrets.NOTIFICATION_EMAIL}}
```

---

### 7. トレンド分析・レポート改善

**現状**: 1回の実行結果のみ
**必要性**: 時系列での品質推移追跡

```python
def track_quality_trends(self):
    """品質トレンドを追跡"""
    history_file = self.base_dir / ".maintenance_history.json"
    
    # 履歴読み込み
    history = []
    if history_file.exists():
        with open(history_file, "r") as f:
            history = json.load(f)
    
    # 今回の結果を追加
    current_result = {
        "timestamp": datetime.now().isoformat(),
        "total_issues": len(self.issues),
        "critical_issues": len([i for i in self.issues if i["severity"] == "CRITICAL"]),
        "warning_issues": len([i for i in self.issues if i["severity"] == "WARNING"]),
        "test_coverage": self._get_test_coverage(),
        "build_time": self._get_last_build_time(),
    }
    
    history.append(current_result)
    
    # 最新30日分のみ保持
    history = history[-30:]
    
    # 保存
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)
    
    # トレンド分析
    if len(history) >= 7:
        # 7日前と比較
        prev = history[-7]
        current = history[-1]
        
        issue_trend = current["total_issues"] - prev["total_issues"]
        
        if issue_trend > 5:
            self.add_issue(
                "trend",
                "WARNING",
                f"問題数が7日前と比較して{issue_trend}件増加しています",
                auto_fix=False
            )
        elif issue_trend < -5:
            self.log(f"品質改善: 問題数が{-issue_trend}件減少しました", "SUCCESS")
```

**ビジュアル化**:
```python
def generate_trend_chart(self):
    """トレンドグラフを生成（matplotlib使用）"""
    try:
        import matplotlib.pyplot as plt
        
        history_file = self.base_dir / ".maintenance_history.json"
        with open(history_file, "r") as f:
            history = json.load(f)
        
        dates = [datetime.fromisoformat(h["timestamp"]) for h in history]
        issues = [h["total_issues"] for h in history]
        
        plt.figure(figsize=(10, 6))
        plt.plot(dates, issues, marker='o')
        plt.title("問題数の推移（過去30日）")
        plt.xlabel("日付")
        plt.ylabel("問題数")
        plt.grid(True)
        plt.savefig(self.base_dir / "maintenance_trend.png")
        
        self.log("トレンドグラフ生成: maintenance_trend.png", "SUCCESS")
        
    except ImportError:
        self.log("matplotlibがインストールされていません", "INFO")
```

---

## 🎯 優先度: 低（将来的な拡張）

### 8. AI駆動の問題診断

```python
def ai_diagnosis(self, issue: Dict[str, Any]) -> str:
    """AIによる問題診断と修正提案"""
    # GitHub Copilot / OpenAI API を利用
    prompt = f"""
    以下の問題を分析し、修正方法を提案してください:
    
    カテゴリ: {issue['category']}
    重要度: {issue['severity']}
    説明: {issue['description']}
    ファイル: {issue.get('file_path', 'N/A')}
    """
    
    # API呼び出し（実装省略）
    # suggestion = call_ai_api(prompt)
    
    return suggestion
```

### 9. カスタムルール・プラグインシステム

```python
# scripts/maintenance_plugins/custom_check.py
class CustomCheck:
    def check(self, project_dir: Path) -> List[Dict]:
        """プロジェクト固有のチェックを実装"""
        issues = []
        
        # 例: NEW HORIZON固有の文法チェック
        # ...
        
        return issues

# maintenance_ai.py
def load_custom_plugins(self):
    """カスタムプラグインを読み込み"""
    plugin_dir = self.base_dir / "scripts" / "maintenance_plugins"
    
    for plugin_file in plugin_dir.glob("*.py"):
        # 動的import
        module = importlib.import_module(f"maintenance_plugins.{plugin_file.stem}")
        plugin = module.CustomCheck()
        
        issues = plugin.check(self.base_dir)
        self.issues.extend(issues)
```

---

## 📊 実装スケジュール

### Week 1: 高優先度（すぐに効果）
- ✅ CodeQL統合 (1日)
- ✅ 品質神経系統のJSON出力統合 (1日)
- ✅ 自動修正機能の拡張 (2日)
- ✅ パフォーマンス測定 (1日)

### Week 2-3: 中優先度（効率化）
- ✅ ワークフロー統合・重複排除 (3日)
- ✅ Slack通知実装 (1日)
- ✅ トレンド分析 (2日)

### Month 2+: 低優先度（高度化）
- AI診断システム
- プラグインシステム
- ダッシュボード開発

---

## 💡 すぐに試せる Quick Wins

### 1. CodeQLの有効化（5分）

```bash
# .github/workflows/codeql.yml を作成
gh workflow enable codeql.yml
```

### 2. Dependabot PRの自動マージ設定（10分）

```yaml
# .github/workflows/auto-merge-dependabot.yml
name: Auto-merge Dependabot PRs

on: pull_request

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - uses: actions/checkout@v4
      - name: Enable auto-merge
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{github.event.pull_request.html_url}}
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

### 3. ビルド時間測定の追加（15分）

```python
# scripts/maintenance_ai.py の check_file_sizes() の後に追加
self.check_performance_metrics()
```

---

## 🎯 最優先で実装すべき3つ

1. **CodeQL統合** - セキュリティ向上（15分）
1. **品質神経系統のJSON統合** - 詳細レポート（30分）
1. **パフォーマンス測定** - ビルド時間追跡（30分）

合計実装時間: **1時間15分**

---

## 📈 期待される改善効果

| 改善項目 | 現状 | 改善後 | 効果 |
|---------|------|--------|------|
| **セキュリティ** | npm auditのみ | +CodeQL | 脆弱性検出率 +80% |
| **問題検出精度** | 基本チェック | +詳細統合 | 誤検知 -50% |
| **CI/CD時間** | 20ワークフロー | 統合パイプライン | 実行時間 -50% |
| **通知速度** | Issue作成のみ | +Slack | 応答時間 -90% |
| **品質可視化** | 単発レポート | +トレンド分析 | 問題早期発見 +70% |

---

## 🚀 次のステップ

1. この提案を確認
1. 優先度の高い改善から実装
1. 1週間後に効果を測定
1. フィードバックに基づき調整

**質問や懸念があれば、お気軽にご相談ください！**
