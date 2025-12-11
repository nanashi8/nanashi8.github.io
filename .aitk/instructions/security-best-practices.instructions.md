---
description: セキュリティ・リファクタリング統合ガイドライン（AI開発アシスタント用）
applyTo: '**'
---

# 🔐 セキュリティ・リファクタリング統合ガイドライン

**最終更新**: 2025年12月11日  
**対象**: すべての開発・デプロイ作業  
**優先度**: CRITICAL

---

## 🔐 必須セキュリティチェック

### 開発開始前に必ず実施

#### 1. 秘密情報流出の確認

```bash
# 環境変数が正しく設定されているか確認
cat .env.example          # テンプレート（公開OK）
echo "=== 実環境は絶対に表示しない ==="

# Git コミット前のスキャン
# (このスクリプトが pre-commit フックで自動実行される)
npm run security:check
```

**チェック項目**:
- [ ] `.env.production` ファイルが `.gitignore` に含まれている
- [ ] 秘密情報が公開ブランチに含まれていない
- [ ] Sentry DSN など API キーが GitHub Secrets で管理されている
- [ ] 個人情報（メールアドレス、電話番号等）が含まれていない

#### 2. 依存関係の脆弱性確認

```bash
# NPM監査（自動実行）
npm audit

# 重大度HIGH以上の脆弱性があれば修正必須
npm audit fix
npm audit fix --force  # 破壊的変更が必要な場合のみ
```

**GitHub Actions で自動実行**:
- PR作成時に `npm audit` が実行される
- HIGH/CRITICAL脆弱性は自動マージブロック

#### 3. シークレットスキャン確認

GitHub は以下を自動検出・アラート:
- AWS キー、Google API キー
- GitHub Personal Access Token (PAT)
- Slack トークン
- Sentry DSN（既存対応済み）

**対応必須**:
- [ ] GitHub → Settings → Security & analysis で "Secret scanning" を有効化
- [ ] アラート検出時は即座に Secrets を新規生成＆ローテーション

---

## 🛡️ リファクタリング安全チェック

### 大規模変更（10+ ファイル）を開始する前に必ず実施

#### 1. チェックポイント作成（必須）

```bash
# チェックポイントスクリプトで現在の状態を保存
./scripts/refactor-checkpoint.sh save phase2-mywork

# 出力例:
# ✓ Checkpoint created: v1.0-phase2-mywork
# ✓ Tag pushed to origin
# ✓ Backup JSON saved: .refactor-checkpoints/phase2-mywork.json
```

**チェックポイントに含まれる情報**:
- git コミットハッシュ
- src/ ファイル数とハッシュ
- ビルド成功確認
- package.json ロック状態

#### 2. 変更前のベースライン確認

```bash
# src/ ディレクトリのファイル数を確認
SRC_COUNT=$(find src -type f | wc -l)
echo "Current src/ file count: $SRC_COUNT"

# ビルドが成功することを確認
npm run build
npm run typecheck
npm run lint
```

**ガイドライン**:
- src/ ファイル数: 最小 100+（Phase 2 以降）
- ビルド成功: 必須（型エラー・Lint エラー 0）
- 削除予定ファイル: リスト化＆事前承認

#### 3. 大量削除の事前通知

削除ファイルが 5+ の場合:

```bash
# 削除予定ファイルのリスト確認
git status | grep "deleted:"

# または、PR で明記
# "削除予定ファイル:
# - src/old-component/Button.tsx
# - src/old-component/Input.tsx
# - src/old-component/styles.css"
```

---

## 🔄 統合ワークフロー

### Phase ごとの進め方

#### **開発フェーズ（ローカル）**

```
1. チェックポイント作成
   ./scripts/refactor-checkpoint.sh save phase2-feature

2. 秘密情報スキャン
   npm run security:check

3. リファクタリング実施
   (複数回の commit)

4. ビルド＆テスト
   npm run build
   npm run test
   npm run typecheck

5. Git hook でチェック
   (自動実行)
   - pre-commit: リント＆秘密情報確認
   - pre-rebase: チェックポイント確認
   - post-rebase: 整合性チェック
```

#### **PR作成フェーズ（GitHub）**

```
1. PR作成
   git push origin feature/branch-name

2. GitHub Actions 自動実行 (refactoring-safety-check.yml)
   - TypeScript typecheck
   - ESLint チェック
   - Build 検証
   - src/ 整合性チェック
   - SimpleWord 汚染チェック
   - npm audit セキュリティ確認

3. PR レビュー
   - コード品質確認
   - セキュリティチェック確認
   - テスト PASS 確認
```

#### **マージ＆デプロイフェーズ**

```
1. main へマージ
   github.com/pr → "Merge pull request"

2. GitHub Actions 自動実行 (safe-deployment.yml)
   - 品質チェック再実行
   - ステージング環境へデプロイ
   - Health check 実行
   - 本番承認ゲート（手動）
   - 本番環境へデプロイ
```

---

## ✅ チェックリスト

### 開発開始前

- [ ] チェックポイント作成済み: `./scripts/refactor-checkpoint.sh list` で確認
- [ ] 現在のブランチが最新の main から作成: `git branch -vv`
- [ ] ローカルビルド成功: `npm run build`

### 変更中

- [ ] コミットメッセージが意味不明でない（"fix"だけはNG）
- [ ] 大量削除の場合、あらかじめ通知完了
- [ ] TypeScript 型エラー: 0
- [ ] ESLint エラー: 0（警告は許可）

### PR 作成時

- [ ] PR タイトルが変更内容を説明している
- [ ] PR Description に「変更理由」「影響範囲」を記載
- [ ] 秘密情報が含まれていない（例: API キーがコミット歴に残っていないか）
- [ ] GitHub Actions テスト全て PASS

### マージ前

- [ ] コードレビュー: 最低1名以上
- [ ] GitHub Actions テスト: 全て緑チェック
- [ ] セキュリティスキャン: 脆弱性なし
- [ ] ステージング環境で動作確認

### デプロイ承認時

- [ ] 本番デプロイの必要性: 確認
- [ ] ロールバック手順: 理解
- [ ] 生徒への告知: 必要に応じて実施

---

## 🚨 インシデント対応

### Scenario A: セキュリティ脆弱性検出

**HIGH/CRITICAL脆弱性が検出された場合**:

```bash
# 1. 修正パッケージをインストール
npm audit fix --force

# 2. ローカルで検証
npm run build
npm run test

# 3. 新しいブランチで修正
git checkout -b security/fix-vuln-YYYYMMDD

# 4. PR作成＆マージ（優先度HIGH）
git push origin security/fix-vuln-YYYYMMDD
# GitHub で PR 作成 → 即座にマージ
```

**本番デプロイ**: 承認ゲートをスキップできる場合がある

### Scenario B: src/ ファイル大量削除検出

**GitHub Actions で検出された場合**:

```
❌ src/ integrity check failed
   Expected: 100+
   Actual: 95
   This might indicate accidental file loss
```

**対応**:

```bash
# 1. 削除されたファイルを確認
git diff HEAD~1 --name-status | grep '^D'

# 2. 意図的な削除か確認
# - 意図的: PR Description に理由を記載 → チェックポイント値を更新
# - 誤削除: 直前のコミットをrevert

# 3. チェックポイント更新（意図的削除の場合）
./scripts/refactor-checkpoint.sh save phase2-after-cleanup
```

### Scenario C: リベース事故検出

**post-rebase hook でファイル消失検出**:

```
❌ Post-rebase integrity check failed
   src/ file count: 0 (expected: 100+)
   ABORTING rebase
```

**対応**:

```bash
# 1. リベース中止
git rebase --abort

# 2. 直前のチェックポイントから復旧
git reset --hard v1.0-phase2-mywork

# 3. リベース再開（慎重に）
git rebase origin/main
```

---

## 🔍 セキュリティスキャンの詳細

### npm audit

実行対象: 毎回 PR 作成時 + デプロイ前

```bash
npm audit
# 出力例:
# ┌───────────────────────────────────────────────────────────────┐
# │ High      │ Regular Expression Denial of Service    │ minimatch │
# │ Severity  │ Affected versions: < 3.0.5               │           │
# │ CVSS v3   │ https://nvd.nist.gov/vuln/detail/...     │           │
# └───────────────────────────────────────────────────────────────┘
```

**対応**:
- CRITICAL: 即座に修正（本番デプロイ前）
- HIGH: できるだけ修正（1-2日内）
- MODERATE: PR マージ前に修正
- LOW: 任意

### TruffleHog (今後統合予定)

シークレットスキャンツール:
```bash
truffleHog filesystem /path/to/repo \
  --only-verified \
  --json
```

検出対象:
- AWS Access Key ID
- GitHub Personal Access Token
- Slack Bot Token
- Stripe API Key
- etc.

**対応**: 検出された場合、即座に Secrets をローテーション

---

## 📚 参考リソース

### ドキュメント
- [REFACTORING_SAFETY.md](../../docs/REFACTORING_SAFETY.md) - 詳細な安全手順
- [DEPLOYMENT_OPERATIONS.md](../../docs/DEPLOYMENT_OPERATIONS.md) - デプロイ運用ガイド
- [STUDENT_DEPLOYMENT_GUIDE.md](../../docs/STUDENT_DEPLOYMENT_GUIDE.md) - 生徒向けガイド

### スクリプト＆ワークフロー
- `scripts/refactor-checkpoint.sh` - チェックポイント管理
- `.git/hooks/pre-commit` - コミット前チェック
- `.git/hooks/pre-rebase` - リベース前チェック
- `.git/hooks/post-rebase` - リベース後チェック
- `.github/workflows/refactoring-safety-check.yml` - CI/CD 統合
- `.github/workflows/safe-deployment.yml` - デプロイメントゲート

### 外部リソース
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm audit Severity Levels](https://docs.npmjs.com/about/npm-audit)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

---

## 📞 質問・相談

質問・不明な点がある場合:

1. このガイドを確認
2. REFACTORING_SAFETY.md で詳細確認
3. 不明な場合はコミットメッセージで明記して相談

**AI開発アシスタントへの指示例**:
```
"このリファクタリングでファイルを5つ削除しますが、OK ですか？"
→ 自動的にこのガイドに基づいてチェック＆アドバイス
```

---

**最後に**: 安全で信頼できる開発を心がけましょう! 🎯
