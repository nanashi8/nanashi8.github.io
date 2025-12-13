# 定期メンテナンスAI ガイド

## 概要

プロジェクトの各要所を定期的に監視し、問題を自動検出・修正するAIシステムです。

## 機能

### 1. データ品質チェック

**対象**: Grammar, Vocabulary, Pronunciation データ

- 品質神経系統を実行して異常を検出
- 語彙多様性、主語多様性、連続パターンをチェック
- CRITICAL異常がある場合は即座に警告

### 2. テストカバレッジチェック

**対象**: すべてのテストファイル

- Vitestでテストを実行
- カバレッジが50%未満の場合に警告
- テスト失敗がある場合は詳細を記録

### 3. 依存関係チェック

**対象**: npm packages

- `npm audit`で脆弱性をスキャン
- Critical/High脆弱性がある場合は自動修正を提案
- 自動修正コマンド: `npm audit fix --force`

### 4. ファイルサイズチェック

**対象**: public/data/*.json

- 10MB超のファイルを検出
- パフォーマンス劣化の可能性を警告

### 5. ドキュメントチェック

**対象**: README, ガイドライン文書

- 必須ドキュメントの存在確認
- 30日以上更新がない場合に通知

### 6. Gitステータスチェック

**対象**: リポジトリ状態

- 未コミットの変更を検出
- リモートとの同期状態を確認
- Push/Pull推奨を通知

## 使用方法

### ローカル実行

```bash
# 基本実行（読み取り専用）
python3 scripts/maintenance_ai.py --verbose

# 自動修正を適用（dry run）
python3 scripts/maintenance_ai.py --auto-fix --verbose

# 自動修正を実際に適用
python3 scripts/maintenance_ai.py --auto-fix --no-dry-run --verbose

# カスタムディレクトリ
python3 scripts/maintenance_ai.py --base-dir /path/to/project

# レポート出力先を指定
python3 scripts/maintenance_ai.py --output custom_report.json
```

### GitHub Actions（自動実行）

**スケジュール**: 毎日午前3時（JST）

**手動実行**:
1. GitHubリポジトリの「Actions」タブを開く
2. 「定期メンテナンスAI」ワークフローを選択
3. 「Run workflow」ボタンをクリック
4. オプションを選択:
   - `auto_fix`: 自動修正を適用する
   - `dry_run`: Dry runモード（デフォルト: true）

## レポート形式

```json
{
  "timestamp": "2025-12-13T22:00:00.000000",
  "total_issues": 5,
  "critical_issues": 1,
  "warning_issues": 2,
  "info_issues": 2,
  "auto_fixable": 1,
  "issues": [
    {
      "category": "data_quality",
      "severity": "CRITICAL",
      "description": "品質神経系統がCRITICAL異常を検出",
      "file_path": null,
      "auto_fix": false,
      "timestamp": "2025-12-13T22:00:05.000000"
    },
    {
      "category": "dependencies",
      "severity": "CRITICAL",
      "description": "Critical脆弱性: 2件",
      "file_path": null,
      "auto_fix": true,
      "timestamp": "2025-12-13T22:00:15.000000"
    }
  ],
  "auto_fixes_available": [
    {
      "type": "npm_audit_fix",
      "command": "npm audit fix --force"
    }
  ]
}
```

## 自動修正

### 対応している自動修正

1. **npm脆弱性修正**
   - コマンド: `npm audit fix --force`
   - 対象: Critical/High脆弱性

### 将来追加予定の自動修正

2. **データ品質修正**
   - 重複問題の自動削除
   - 語彙多様性の自動改善
   - 不適切な選択肢の自動修正

3. **コードフォーマット**
   - Prettier自動実行
   - ESLint自動修正

4. **ドキュメント更新**
   - README の自動更新
   - CHANGELOGの自動生成

## 通知設定

### GitHub Issue自動作成

CRITICAL問題が検出された場合、自動的にIssueが作成されます:

- タイトル: 🚨 定期メンテナンスAI: CRITICAL問題を検出
- ラベル: `maintenance`, `critical`, `automated`
- 内容: 問題の詳細と対処方法

### Slack通知（オプション）

環境変数`SLACK_WEBHOOK_URL`を設定すると、Slackに通知されます:

```bash
# GitHub Secretsに設定
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

通知内容:
- ✅ 問題なし: 緑色
- ⚠️ WARNING問題: 黄色
- 🚨 CRITICAL問題: 赤色

## 統合

### Pre-commit Hookとの連携

```bash
# .husky/pre-commit に追加
echo "python3 scripts/maintenance_ai.py --verbose || true" >> .husky/pre-commit
```

### CI/CDパイプラインとの連携

品質神経系統と連携して、コミット前・CI実行時に自動チェック:

```
Developer → Pre-commit Hook → メンテナンスAI → 品質神経系統 → GitHub Push
                                     ↓
                              CRITICAL検出時はブロック
```

## ベストプラクティス

### 1. 定期的な実行

- **推奨**: 毎日1回（深夜）
- **最低**: 週1回

### 2. CRITICAL問題の即時対応

CRITICAL問題が検出された場合:
1. 即座に確認
2. 24時間以内に修正
3. 修正後、再度メンテナンスAIを実行

### 3. 自動修正の慎重な適用

自動修正を適用する前に:
1. まず`--auto-fix`（dry run）で確認
2. 問題ないことを確認後、`--no-dry-run`で実際に適用
3. テストを実行して問題がないことを確認

### 4. レポートの保管

- 月次でレポートをレビュー
- 傾向分析（問題の増減）
- 改善活動の指標として活用

## トラブルシューティング

### Q: メンテナンスAIがタイムアウトする

**A**: 以下を確認:
- データファイルのサイズが大きすぎないか
- テストが無限ループになっていないか
- `--verbose`オプションで詳細ログを確認

### Q: 自動修正が失敗する

**A**: 以下を試す:
1. 手動で修正コマンドを実行
2. エラーメッセージを確認
3. 依存関係の再インストール: `npm ci`

### Q: レポートが生成されない

**A**: 以下を確認:
- 書き込み権限があるか
- ディスク容量は十分か
- Pythonのバージョンは3.8以上か

## 拡張方法

### 新しいチェック機能を追加

```python
def check_custom_quality(self):
    """カスタム品質チェック"""
    self.log("=" * 60)
    self.log("カスタムチェック開始", "INFO")
    self.log("=" * 60)
    
    # チェックロジック
    if problem_detected:
        self.add_issue(
            "custom_check",
            "WARNING",
            "問題の説明",
            file_path="path/to/file",
            auto_fix=False
        )
```

### 新しい自動修正を追加

```python
if condition:
    self.auto_fixes.append({
        "type": "custom_fix",
        "command": "custom_fix_command --arg"
    })
```

## まとめ

定期メンテナンスAIにより:

✅ **24/7監視**: 問題を見逃さない
✅ **早期発見**: 小さな問題を大きくしない
✅ **自動修正**: 定型的な問題は自動で解決
✅ **レポート**: 改善活動の指標
✅ **通知**: 重要な問題を即座に伝達

プロジェクトの健全性を継続的に維持し、品質を担保します。
