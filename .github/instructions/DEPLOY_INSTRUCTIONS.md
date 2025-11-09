# デプロイ手順とベストプラクティス

**作成日**: 2025-11-09  
**対象**: quiz-app Web版プロトタイプ  
**目的**: 安全で再現性のあるデプロイを実現する

---

## 📋 基本原則

### ✅ 必須ルール

1. **デプロイは必ず `web-prototype` ブランチで実行する**
   - `package.json` と `node_modules` が存在するブランチでのみ `npm run deploy` を実行すること
   - `gh-pages` ブランチ上で npm コマンドを実行してはいけない（ENOENT エラーの原因）

2. **自動デプロイを優先する**
   - 可能な限り GitHub Actions による自動デプロイを使用する
   - 手動デプロイは検証目的またはローカルテスト時のみ

3. **デプロイ前にテストを実行する**
   - ローカルで `docs/index.html` を開いて動作確認
   - 簡易 HTTP サーバーで確認: `python3 -m http.server 8000 --directory docs`

---

## 🚀 デプロイ方法

### 方法 A: 自動デプロイ（推奨）

`web-prototype` ブランチに push すると、GitHub Actions が自動的に `gh-pages` にデプロイします。

```bash
# web-prototype ブランチに切り替え
git checkout web-prototype

# 変更をコミット
git add docs/
git commit -m "Update web prototype"

# push（これで自動デプロイが開始される）
git push origin web-prototype
```

**確認方法**:
- GitHub リポジトリの **Actions** タブでワークフローの実行状況を確認
- 成功すると数分後に https://nanashi8.github.io/quiz-app/ に反映される

---

### 方法 B: 手動デプロイ（検証用）

ローカルから手動でデプロイする場合の手順：

```bash
# 1. web-prototype ブランチに切り替え（重要！）
git checkout web-prototype

# 2. 最新を取得
git pull origin web-prototype

# 3. 依存関係をクリーンインストール
npm ci

# 4. ローカルで動作確認（オプション）
python3 -m http.server 8000 --directory docs
# ブラウザで http://localhost:8000 を開いて確認

# 5. デプロイ実行
npm run deploy
```

**成功の確認**:
- 出力に `Published` が表示されること
- `gh-pages` ブランチが更新されること

---

## ⚠️ よくあるエラーと対処法

### エラー 1: `ENOENT: Could not read package.json`

**原因**: `gh-pages` ブランチまたは `package.json` が存在しないブランチで `npm run deploy` を実行した

**対処法**:
```bash
# web-prototype ブランチに切り替える
git checkout web-prototype

# 再度デプロイ
npm run deploy
```

---

### エラー 2: 公開 URL が 404 を返す

**原因**:
- GitHub Pages の Source 設定が間違っている
- デプロイ直後のキャッシュ/伝播待ち
- `gh-pages` ブランチにファイルが存在しない

**対処法**:
1. **Settings → Pages を確認**
   - Source: `gh-pages` ブランチ / `/ (root)` に設定されているか確認

2. **gh-pages ブランチの確認**
   ```bash
   git checkout gh-pages
   ls -la
   # index.html, app.js, styles.css が存在するか確認
   ```

3. **待機してから再確認**
   - GitHub Pages の反映には数分かかる場合がある
   - curl でステータスを確認: `curl -I https://nanashi8.github.io/quiz-app/`

4. **強制的に再デプロイ**
   ```bash
   git checkout web-prototype
   npm run deploy
   ```

---

### エラー 3: Actions が失敗する

**原因**: `package-lock.json` の不整合、または依存関係のバージョン問題

**対処法**:
```bash
# package-lock.json を再生成
rm package-lock.json
npm install

# コミットして再 push
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push origin web-prototype
```

---

## 🔄 ロールバック手順

誤ったデプロイを元に戻す方法：

### 方法 A: gh-pages を前のコミットに戻す

```bash
# gh-pages ブランチに切り替え
git checkout gh-pages

# コミット履歴を確認
git log --oneline

# 前の安全なコミットに戻す（例: HEAD~1）
git reset --hard <commit-id>

# 強制 push
git push origin gh-pages --force
```

---

### 方法 B: 前のバージョンを再デプロイ

```bash
# web-prototype の前のコミットをチェックアウト
git checkout web-prototype
git log --oneline
git checkout <good-commit-id> docs/

# 再デプロイ
npm run deploy

# 元に戻す
git checkout web-prototype
```

---

## 📊 デプロイ後の確認チェックリスト

- [ ] Actions が成功している（緑のチェックマーク）
- [ ] `curl -I https://nanashi8.github.io/quiz-app/` が HTTP/2 200 を返す
- [ ] ブラウザで開いて UI が正しく表示される
- [ ] クイズが動作する（問題選択、回答、次の問題）
- [ ] コンソールにエラーが出ていない

---

## 🤖 AI/Assistant 向けの指示

GitHub Copilot やその他の自動化ツールがデプロイを行う場合：

1. **必ずブランチを確認**:
   ```bash
   git rev-parse --abbrev-ref HEAD
   ```
   - `web-prototype` でない場合は切り替える

2. **package.json の存在を確認**:
   ```bash
   test -f package.json && echo "OK" || echo "NG: package.json not found"
   ```

3. **デプロイは1コマンド**:
   ```bash
   npm run deploy
   ```

4. **エラー時は即座に報告**:
   - ENOENT が出たらブランチを確認して修正手順を提示
   - 404 が続く場合は Settings → Pages の確認を促す

---

## 📚 関連ドキュメント

- [プロジェクト README](../../README.md)
- [GitHub Copilot 指示ファイル](../.github/copilot-instructions.md)
- [ドキュメントインデックス](../../docs/00_INDEX.md)

---

**最終更新**: 2025-11-09
