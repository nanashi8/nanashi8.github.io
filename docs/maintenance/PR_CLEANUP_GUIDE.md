# PR整理ガイド

## 現状（2025-12-29時点）

- **18件の自動生成PR**が溜まっています
- 全てDependabot または Copilot SWE エージェント製

## 実施した改善（コミット: a1641dd）

### 1. 依存更新PRの重複解消

**問題**: `auto-fix.yml` と `dependabot.yml` が両方とも依存更新PRを作成していた

**対策**:

- ✅ `auto-fix.yml`の依存更新機能を無効化（CSS lintは継続）
- ✅ Dependabotに一本化

### 2. Dependabot設定の最適化

**変更内容**:

```yaml
# npm パッケージ
- PR上限: 10件 → 5件（溜まりすぎ防止）
- セキュリティ更新を優先グループ化

# GitHub Actions
- 実行頻度: 毎週 → 毎月（更新頻度を抑制）
- PR上限: 5件 → 3件
```

## 溜まっているPRの処理方針

### A. 一括クローズ（推奨）

今回の設定変更により、今後は適切な数のPRのみ作成されます。  
溜まっている18件は一旦クローズして、次回のDependabot実行で必要なものだけ再作成させる：

```bash
# 一括クローズ（レビューが不要な場合）
gh pr list --limit 100 --json number --jq '.[].number' | \
  xargs -I {} gh pr close {} -c "設定見直しによりクローズ。必要な更新は次回Dependabotで再作成"
```

### B. 選別して対応

セキュリティ更新など重要なものだけマージ：

```bash
# セキュリティ関連のみ確認
gh pr list --label dependencies --json number,title,author | \
  jq '.[] | select(.title | contains("security") or contains("esbuild") or contains("vite"))'
```

### C. 自動マージが通らない原因を調査

CIチェックが通っていないPRがある可能性：

```bash
# CI失敗しているPRを確認
gh pr checks --watch
```

## 今後の運用

### 毎週月曜日 9:00（JST）

- Dependabotが最大5件のnpm更新PRを作成
- `auto-merge`ラベル付きでCIが通れば自動マージ

### 毎月1回（月曜日 9:00）

- GitHub Actions更新PRが最大3件作成

### 手動確認が必要なケース

- セキュリティアラート（即座に対応）
- Major version更新（breaking changesの確認）
- テスト失敗したPR（手動調査）

## トラブルシューティング

### Q. 自動マージされない

- `.github/workflows/auto-merge.yml`のチェック条件を確認
- CIビルドが通っているか確認: `gh pr checks <PR番号>`

### Q. PRが多すぎる

- `dependabot.yml`の`open-pull-requests-limit`を減らす
- 不要なActions更新は`interval: monthly`でさらに抑制

### Q. セキュリティ更新が遅い

- Dependabotの`groups.security-updates`で優先化済み
- 即座にマージが必要な場合は手動対応

## 参考

- [Dependabot設定](.github/dependabot.yml)
- [Auto-merge設定](.github/workflows/auto-merge.yml)
- [Auto-fix設定](.github/workflows/auto-fix.yml)
