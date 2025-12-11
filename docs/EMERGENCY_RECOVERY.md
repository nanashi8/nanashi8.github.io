# 🚨 緊急復旧ガイド

**最終更新**: 2025年12月11日  
**対象事故**: リベース事故・SimpleWord混入事故

---

## 📋 目次

1. [自動バックアップシステム](#自動バックアップシステム)
1. [リベース事故からの復旧](#リベース事故からの復旧)
1. [SimpleWord混入の防止と除去](#simpleword混入の防止と除去)
1. [定期的な安全確認](#定期的な安全確認)

---

## 🔒 自動バックアップシステム

### Gitフックによる自動保護

このリポジトリには3つの安全フックが設定されています:

#### 1. **Pre-rebase Hook** (`.git/hooks/pre-rebase`)
リベース前に自動的にバックアップタグを作成します。

**動作**:
- `src/`ディレクトリの存在確認
- ファイル数チェック (最低50ファイル)
- 自動バックアップタグ作成: `backup/pre-rebase-YYYYMMDD-HHMMSS`
- バックアップログ記録: `.git/REBASE_BACKUPS.log`

**失敗時**:
```
❌ ERROR: src/ directory not found!
   Rebase aborted to prevent data loss.
```

#### 2. **Post-rebase Hook** (`.git/hooks/post-rebase`)
リベース後に整合性を自動検証します。

**チェック項目**:
- `src/`ディレクトリの存在
- ファイル数検証 (最低50ファイル)
- SimpleWord混入チェック

**失敗時の復旧手順**:
```bash
# バックアップを確認
git tag -l 'backup/pre-rebase-*'

# 最新のバックアップから復元
LATEST_BACKUP=$(git tag -l 'backup/pre-rebase-*' | tail -1)
git checkout $LATEST_BACKUP -- src/
git add src/
git commit -m "restore: recover src/ from $LATEST_BACKUP"
```

#### 3. **Pre-push Hook** (`.git/hooks/pre-push`)
プッシュ前に最終安全チェックを実行します。

**チェック項目**:
- `src/`ディレクトリの存在とファイル数
- SimpleWord混入チェック
- 必須ファイルの存在確認 (index.html, package.json等)

**失敗時**:
問題を修正してから再度プッシュしてください。緊急時は `--no-verify` で回避可能ですが非推奨です。

---

## 🆘 リベース事故からの復旧

### 症状: src/ディレクトリが消失

#### ステップ1: バックアップの確認
```bash
# バックアップタグを一覧表示
git tag -l 'backup/pre-rebase-*'

# バックアップログを確認
cat .git/REBASE_BACKUPS.log
```

#### ステップ2: 最新バックアップから復元
```bash
# 最新のバックアップタグを取得
LATEST=$(git tag -l 'backup/pre-rebase-*' | sort -r | head -1)
echo "Latest backup: $LATEST"

# src/を復元
git checkout $LATEST -- src/

# 確認
find src -type f | wc -l  # 100+ファイルあることを確認

# コミット
git add src/
git commit -m "restore: recover src/ from $LATEST"
```

#### ステップ3: 動作確認
```bash
npm run build
```

### 症状: ファイル数が異常に少ない

#### ステップ1: 現在の状態確認
```bash
# ファイル数をカウント
find src -type f | wc -l

# 期待値: 100+ファイル
# 異常値: 50以下
```

#### ステップ2: reflogから復元
```bash
# 最近の履歴を確認
git reflog --date=iso | head -20

# 正常だったコミットを見つけて復元
git checkout <commit-hash> -- src/
```

#### ステップ3: タグ付きバックアップポイントから復元
```bash
# 安定版タグを確認
git tag -l 'v*' | tail -5

# v1.18.0から復元
git checkout v1.18.0-before-phase2-refactor -- src/
```

---

## 🚫 SimpleWord混入の防止と除去

### SimpleWordとは

- **SimpleWord**: iOSアプリプロジェクト
- **このリポジトリ**: Webアプリ専用
- **混在の経緯**: 2025年10月6日の初期コミットから共存していたが、現在は分離

### .gitignoreによる自動除外

`.gitignore`に以下が追加されています:

```gitignore
# SimpleWord iOS Project Exclusion
SimpleWord/
SimpleWord.xcodeproj/
SimpleWord 2.xcodeproj/
SimpleWordTests/
SimpleWordUITests/
*.xcworkspace/
*.xcuserstate
# ... (iOS関連ファイル全般)
```

### SimpleWordが混入した場合の除去手順

#### ケース1: Git管理されていない (理想)
```bash
# 単純に削除
rm -rf SimpleWord/ SimpleWord*.xcodeproj/ SimpleWordTests/ SimpleWordUITests/

# .gitignoreで自動的に除外される
```

#### ケース2: Git管理されている (要注意)
```bash
# Git管理から除去
git rm -r SimpleWord/ SimpleWord*.xcodeproj/ SimpleWordTests/ SimpleWordUITests/

# コミット
git commit -m "chore: remove SimpleWord iOS project from git tracking"

# ファイルは.gitignoreで今後除外される
```

#### ケース3: リモートにプッシュ済み
```bash
# ローカルで除去
git rm -r SimpleWord/ SimpleWord*.xcodeproj/ SimpleWordTests/ SimpleWordUITests/
git commit -m "chore: remove SimpleWord iOS project"

# リモートにプッシュ
git push origin main

# 警告: 他の開発者は git pull 後に手動でSimpleWordディレクトリを削除する必要がある
```

### 混入の検知方法

```bash
# Git管理されているSimpleWordファイルを検索
git ls-files | grep -i simple

# ファイル数を表示
git ls-files | grep -c "^SimpleWord/" || echo "0"

# 結果が0なら正常 (Git管理されていない)
# 結果が1以上なら除去が必要
```

---

## 🔍 定期的な安全確認

### 週次チェックリスト

#### 1. ソースコードの整合性
```bash
# src/ファイル数を確認
find src -type f | wc -l
# 期待値: 100+

# 主要ファイルの存在確認
ls -la index.html package.json vite.config.ts src/App.tsx
```

#### 2. SimpleWord混入チェック
```bash
# Git管理状況を確認
git ls-files | grep -i simple || echo "✅ SimpleWord not tracked"

# ディレクトリの存在確認
ls -d SimpleWord* 2>/dev/null || echo "✅ SimpleWord directories not found"
```

#### 3. バックアップの確認
```bash
# バックアップタグの数を確認
git tag -l 'backup/pre-rebase-*' | wc -l

# 最新5つのバックアップを表示
git tag -l 'backup/pre-rebase-*' | sort -r | head -5
```

#### 4. ビルドテスト
```bash
# ビルドが成功することを確認
npm run build

# テストが通ることを確認 (設定されている場合)
npm test
```

### 月次クリーンアップ

#### 古いバックアップタグの削除
```bash
# 30日以上古いバックアップタグを削除
git tag -l 'backup/pre-rebase-*' | sort | head -n -10 | xargs git tag -d
```

#### バックアップログのローテーション
```bash
# バックアップログが大きくなったら先頭100行を残す
tail -100 .git/REBASE_BACKUPS.log > .git/REBASE_BACKUPS.log.tmp
mv .git/REBASE_BACKUPS.log.tmp .git/REBASE_BACKUPS.log
```

---

## 📞 緊急連絡先・参考資料

### このガイドの作成背景

**2025年12月11日の事故**:
1. リベース中断後に`git reset --hard origin/main`を実行
1. origin/mainに`src/`が存在しない状態だった
1. ローカルの完全な`src/`(116ファイル)が消失
1. reflogから`972bfe1`を発見して復元成功

**SimpleWord混入**:
- 2025年10月6日の初期コミットから共存
- リベース事故復旧時に一緒に復元されて発覚
- `.gitignore`とGitフックで今後は自動防止

### 関連ドキュメント

- [REFACTORING_PLAN.md](../development/REFACTORING_PLAN.md)
- [Git Best Practices](https://git-scm.com/book/en/v2)

### 推奨される安全な Git 操作

#### リベースの代わりにマージを使用
```bash
# リベースは危険な場合がある
git pull --rebase origin main  # ❌ 危険

# マージの方が安全
git pull origin main  # ✅ 安全
```

#### リベース前のバックアップ作成 (手動)
```bash
# リベース前に手動でブランチを作成
git branch backup/before-risky-operation

# または、タグを作成
git tag backup/$(date +%Y%m%d-%H%M%S)
```

#### 強制リセットの回避
```bash
# 絶対に使わない
git reset --hard origin/main  # ❌ 危険

# 代わりに状態を確認してから
git status
git diff origin/main
git reset --soft origin/main  # ✅ 比較的安全
```

---

## ✅ チェックリスト: 事故対策の確認

- [ ] Pre-rebase フックが実行可能 (`chmod +x .git/hooks/pre-rebase`)
- [ ] Post-rebase フックが実行可能 (`chmod +x .git/hooks/post-rebase`)
- [ ] Pre-push フックが実行可能 (`chmod +x .git/hooks/pre-push`)
- [ ] `.gitignore`にSimpleWord除外ルールが追加されている
- [ ] バックアップログファイル `.git/REBASE_BACKUPS.log` が作成可能
- [ ] `src/`ディレクトリに100+ファイルが存在する
- [ ] SimpleWordがGit管理から除外されている (`git ls-files | grep -i simple` → 0件)

---

**最後に**: このガイドは実際の事故経験から作成されています。予防が最も重要ですが、万が一の際は落ち着いてこのガイドに従ってください。
