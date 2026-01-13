---
description: プロジェクト境界の厳格な保護とファイル配置ルール
applyTo: '**'
priority: critical
---

# プロジェクト境界ガード

## 🚨 重要原則

**プロジェクトルートは `nanashi8.github.io/` ディレクトリ内です。親ディレクトリへの操作は厳禁。**

## 📍 プロジェクト境界の定義

### ✅ プロジェクト内（操作可能）

```
/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/
├── src/
├── public/
├── docs/
├── scripts/
├── tests/
├── config/
├── .aitk/
├── .github/
├── .vscode/
└── (その他全てのファイル)
```

### ⛔ プロジェクト外（操作禁止）

```
/Users/yuichinakamura/Documents/nanashi8-github-io-git/
├── .venv/                          ← Python仮想環境（触らない）
├── nanashi8.github.io/             ← プロジェクト本体
└── *.code-workspace                ← workspace設定（触らない）
```

## 🚫 禁止事項

### 1. 親ディレクトリへのファイル作成

❌ **絶対にしないこと**:
```bash
# 親ディレクトリへの移動・操作
cd ..
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git

# 親ディレクトリへのファイル作成
touch ../.vscode/settings.json
mkdir ../public
cp file.txt ../

# 相対パスで親を参照
../../some-file.txt
```

### 2. プロジェクト外への出力

❌ **禁止**:
```bash
# ビルド出力を親に配置
npm run build --outDir ../dist

# ログを親に保存
echo "log" > ../output.log

# バックアップを親に作成
tar czf ../backup.tar.gz .
```

## ✅ 正しい操作

### ファイル作成は必ずプロジェクト内

```bash
# プロジェクトルートから開始
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io

# 全ての操作はプロジェクト内で完結
mkdir -p tests/new-folder
touch config/new-config.json
npm run build  # デフォルトでdist/に出力
```

### パス指定は絶対パスまたはプロジェクト内相対パス

```bash
# 絶対パス（推奨）
/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/src/file.ts

# プロジェクト内相対パス
./src/file.ts
src/file.ts
```

## 🔍 チェックリスト

コマンド実行前に必ず確認：

- [ ] `pwd` でプロジェクトルート内にいるか確認
- [ ] `cd ..` や `../` を使っていないか確認
- [ ] 作成するファイル・フォルダが `nanashi8.github.io/` 内か確認
- [ ] 出力先が親ディレクトリになっていないか確認

## 📋 よくある誤配置パターン

### パターン1: VSCode設定の誤配置

```bash
# ❌ 誤り: 親ディレクトリに作成
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git
mkdir .vscode
touch .vscode/settings.json

# ✅ 正しい: プロジェクト内に作成
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io
mkdir -p .vscode
touch .vscode/settings.json
```

### パターン2: 設定ファイルの誤配置

```bash
# ❌ 誤り: markdownlintを親に配置
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git
touch .markdownlint.json

# ✅ 正しい: プロジェクト内に配置
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io
touch .markdownlint.json
```

### パターン3: public/dataの誤配置

```bash
# ❌ 誤り: publicフォルダを親に作成
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git
mkdir -p public/data

# ✅ 正しい: プロジェクト内のpublic/
cd /Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io
mkdir -p public/data
```

## 🛡️ 自動ガード

以下のファイルでプロジェクト境界を保護：

1. **`.gitignore`**: 親ディレクトリのファイルをgit管理から除外
2. **このインストラクション**: AIエージェントに境界を明示
3. **定期チェック**: 誤配置ファイルの検出スクリプト

## 📚 関連ドキュメント

- [project-structure.instructions.md](project-structure.instructions.md) - プロジェクト構造全体
- [development-guidelines.instructions.md](development-guidelines.instructions.md) - 開発ガイドライン

## 🚨 違反を発見した場合

誤配置ファイルを発見したら：

1. **即座に報告**: 誤配置の内容と場所を明確に
2. **原因分析**: どのコマンド・操作で発生したか特定
3. **修正**: プロジェクト内への移動または削除
4. **再発防止**: このドキュメントの更新

---

**記憶してください**: プロジェクトの全ては `nanashi8.github.io/` 内に存在します。
