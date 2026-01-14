# .husky ディレクトリ 完全ガイド

## 🎯 .husky とは

**Husky** は Git フック（Git操作時の自動実行スクリプト）を管理するツールです。

## 📂 標準的な構造

```
.husky/
├── _/                          # husky 内部設定（編集不要）
├── pre-commit                  # コミット前チェック（最重要）
├── commit-msg                  # コミットメッセージ検証
├── pre-push                    # プッシュ前チェック（重いテスト）
├── post-commit                 # コミット後の処理
├── efficiency-guard.sh         # 補助スクリプト（プロジェクト固有）
└── check-doc-naming            # 補助スクリプト（プロジェクト固有）
```

## ⚡ 発火タイミングと実行フロー

### 1. pre-commit（最も重要）

**発火**: `git commit` 実行時、コミット作成**前**

```
ユーザー実行: git commit -m "message"
       ↓
.husky/pre-commit 実行（自動）
       ↓
  ✅ 成功 → コミット作成
  ❌ 失敗 → コミット中止（変更は残る）
```

**典型的な内容**:
```bash
#!/bin/sh
# リント
npm run lint-staged

# 型チェック
npm run typecheck

# ユニットテスト
npm run test:fast

# カスタムガード
bash scripts/hooks/pre-commit-ai-guard.sh
```

**目的**: 
- コード品質の維持
- 壊れたコードのコミット防止
- チーム全体の生産性向上

### 2. commit-msg

**発火**: コミットメッセージ入力後、コミット作成**前**

```
git commit -m "fix: typo"
       ↓
.husky/commit-msg 実行
       ↓
commitlint でメッセージ検証
       ↓
  ✅ 形式OK → コミット作成
  ❌ 形式NG → コミット中止
```

**典型的な内容**:
```bash
#!/bin/sh
npx --no -- commitlint --edit ${1}
```

**検証内容**:
- Conventional Commits形式: `feat:`, `fix:`, `docs:` など
- 長さ制限（50文字推奨）
- 禁止ワード（WIPなど）

### 3. pre-push

**発火**: `git push` 実行時、プッシュ**前**

```
git push origin main
       ↓
.husky/pre-push 実行
       ↓
重いテスト（E2E等）
       ↓
  ✅ 成功 → プッシュ実行
  ❌ 失敗 → プッシュ中止
```

**典型的な内容**:
```bash
#!/bin/sh
# E2Eテスト（時間がかかる）
npm run test:e2e

# ビルド検証
npm run build

# セキュリティ監査
npm audit --audit-level=high
```

**pre-commit との使い分け**:
- **pre-commit**: 高速（<10秒）、毎回実行
- **pre-push**: 遅い（>30秒）、プッシュ時のみ

### 4. post-commit

**発火**: コミット完成**後**（失敗してもコミットは残る）

```
git commit（成功）
       ↓
.husky/post-commit 実行
       ↓
通知・記録（失敗してもOK）
```

**典型的な内容**:
```bash
#!/bin/sh
# 統計記録
node scripts/record-commit-stats.js

# Slack通知
curl -X POST https://hooks.slack.com/...

# AIへのフィードバック
python scripts/learn-from-commit.py
```

## 🔧 ベストプラクティス

### 1. フック自体はシンプルに

❌ **悪い例** - ロジックを直接書く:
```bash
#!/bin/sh
# .husky/pre-commit

# 100行のbashスクリプト...
for file in $(git diff --cached --name-only); do
  # 複雑な処理...
done
```

✅ **良い例** - 実体は scripts/ に:
```bash
#!/bin/sh
# .husky/pre-commit

bash scripts/hooks/pre-commit-checks.sh || exit 1
```

### 2. エラーメッセージを親切に

```bash
#!/bin/sh
if ! npm run lint; then
  echo ""
  echo "❌ リントエラーがあります"
  echo "💡 修正方法: npm run lint:fix"
  echo ""
  exit 1
fi
```

### 3. スキップ機能の提供

```bash
#!/bin/sh
# 緊急時はスキップ可能にする
# 使用: SKIP_HOOKS=1 git commit -m "..."

if [ -n "$SKIP_HOOKS" ]; then
  echo "⚠️  フックをスキップしました"
  exit 0
fi

npm run lint || exit 1
```

**注意**: 乱用厳禁！チームルールで制限

### 4. 段階的なチェック

```bash
#!/bin/sh
# .husky/pre-commit

# 必須: データ破損防止（最優先）
bash scripts/guards/guard-data-integrity.sh || exit 1

# 必須: 構文チェック（高速）
npm run lint:errors-only || exit 1

# 推奨: スタイルチェック（警告のみ）
npm run lint:style || echo "⚠️  スタイル警告があります"

# オプション: 完全検証（スキップ可）
if [ -z "$QUICK_COMMIT" ]; then
  npm run test:unit || exit 1
fi
```

## 📚 ドキュメント導線

### 1. プロジェクトルートの README.md

```markdown
## 開発ワークフロー

コミット時に自動でチェックが実行されます：
- リント
- 型チェック
- ユニットテスト

詳細: [Git Hooks ガイド](.husky/README.md)

緊急時のスキップ: `SKIP_HOOKS=1 git commit -m "..."`
```

### 2. .husky/README.md（推奨）

```markdown
# Git Hooks 設定

## 自動実行されるチェック

### pre-commit（コミット前）
- リント: `npm run lint`
- 型チェック: `npm run typecheck`
- 実体: `scripts/hooks/pre-commit-checks.sh`

### commit-msg（メッセージ検証）
- Conventional Commits 形式チェック
- 例: `feat: 新機能`, `fix: バグ修正`

### pre-push（プッシュ前）
- E2Eテスト（時間がかかります）
- ビルド検証

## 手動実行

```bash
# pre-commitを手動実行
bash .husky/pre-commit

# 特定のスクリプトのみ
bash scripts/hooks/pre-commit-checks.sh
```

## トラブルシューティング

- フックが動かない: `npm run prepare`
- スキップしたい: `SKIP_HOOKS=1 git commit`（緊急時のみ）
```

### 3. package.json の scripts

```json
{
  "scripts": {
    "prepare": "husky",              // npm install時に自動セットアップ
    "hooks:test": "bash .husky/pre-commit",  // フックの手動テスト
    "hooks:skip": "SKIP_HOOKS=1"             // ヘルパー
  }
}
```

### 4. CONTRIBUTING.md

```markdown
## コミット前のチェック

コミット時に自動でチェックが実行されます。
失敗した場合は修正してから再度コミットしてください。

### よくあるエラー

1. **リントエラー**
   ```bash
   npm run lint:fix  # 自動修正
   ```

2. **型エラー**
   ```bash
   npm run typecheck  # エラー確認
   ```

3. **テスト失敗**
   ```bash
   npm run test:unit:watch  # 監視モードで修正
   ```
```

## 🚀 セットアップ方法

### 新規プロジェクト

```bash
# 1. huskyインストール
npm install --save-dev husky

# 2. 初期化
npx husky init

# 3. フック作成
echo "npm run lint" > .husky/pre-commit
chmod +x .husky/pre-commit

# 4. package.jsonに追加
npm pkg set scripts.prepare="husky"
```

### 既存プロジェクト（チーム参加時）

```bash
# クローン後
git clone <repo>
cd <repo>

# 依存関係インストール（huskyも自動セットアップ）
npm install

# ↑ "prepare"スクリプトで .husky が自動セットアップ
```

## ⚙️ 高度な設定

### 条件付き実行

```bash
#!/bin/sh
# .husky/pre-commit

# feature/* ブランチのみ厳格チェック
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ $BRANCH == feature/* ]]; then
  npm run test:all || exit 1
else
  npm run test:fast || exit 1
fi
```

### パフォーマンス最適化

```bash
#!/bin/sh
# .husky/pre-commit

# 変更されたファイルのみチェック
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$')

if [ -n "$STAGED_FILES" ]; then
  # lint-staged を使う（推奨）
  npx lint-staged
fi
```

### lint-staged 連携（推奨）

```json
// package.json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.css": [
      "stylelint --fix"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
npx lint-staged
```

## 🎯 あなたのプロジェクトの現状

現在の構造:
```
.husky/
├── _/
├── pre-commit               # 292行（長い！）
├── commit-msg               # commitlint
├── pre-push                 # プッシュ前チェック
├── post-commit              # コミット後処理
├── efficiency-guard.sh      # カスタム補助スクリプト
└── check-doc-naming         # ドキュメント命名チェック
```

### 推奨改善

1. **pre-commit を分割**
   ```
   .husky/pre-commit (10行程度)
       ↓
   scripts/hooks/pre-commit-main.sh
       ↓ 呼び出し
   scripts/hooks/pre-commit-ai-guard.sh
   scripts/hooks/pre-commit-quality-guard.sh
   ```

2. **補助スクリプトの移動**
   ```
   .husky/efficiency-guard.sh
       ↓ 移動
   scripts/hooks/efficiency-guard.sh
   ```

3. **.husky/README.md の追加**（上記テンプレート参照）

## 🔗 参考リンク

- [Husky 公式](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [lint-staged](https://github.com/okonet/lint-staged)

## ❓ FAQ

**Q: フックが動かない**
```bash
# 実行権限を確認
ls -la .husky/

# 権限付与
chmod +x .husky/pre-commit

# huskyの再インストール
rm -rf .husky
npm run prepare
```

**Q: フックをスキップしたい（緊急）**
```bash
# 1回だけスキップ
SKIP_HOOKS=1 git commit -m "emergency fix"

# または --no-verify（非推奨）
git commit --no-verify -m "emergency fix"
```

**Q: チームメンバーがフックを無視する**
- CI/CDで同じチェックを実行（強制）
- CONTRIBUTING.mdで重要性を説明
- `--no-verify`の使用をログに記録

**Q: フックが遅すぎる**
- 重いチェックは `pre-push` に移動
- `lint-staged`で変更ファイルのみチェック
- キャッシュを活用（ESLint `--cache`等）
