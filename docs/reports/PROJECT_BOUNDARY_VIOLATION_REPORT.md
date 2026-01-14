# プロジェクト境界違反・原因調査と再発防止策

**作成日**: 2026-01-14  
**調査者**: GitHub Copilot + Servant AI System  
**重要度**: Critical

---

## 📋 発見された問題

### 誤配置されたファイル・フォルダ（親ディレクトリ）

| 項目 | サイズ | 最終更新 | 状態 |
|------|--------|----------|------|
| `.vscode/` | 1.3MB | 2026-01-13 | ✅ 削除済み |
| `.aitk/` | 4KB | 2026-01-05 | ✅ 削除済み |
| `.github/` | 0B | 2026-01-13 | ✅ 削除済み |
| `.vite/` | 8KB | 2025-12-30 | ✅ 削除済み |
| `public/` | 20KB | 2026-01-02 | ✅ 削除済み |
| `.markdownlint.json` | - | 2026-01-11 | ✅ 削除済み |
| `.markdownlintignore` | - | 2026-01-08 | ✅ 削除済み |
| `package-lock.json` | - | 2025-12-12 | ✅ 削除済み |

**合計削除**: 8項目、約1.3MB

---

## 🔍 原因分析

### 1. プロジェクトルートの曖昧性

**問題**:
- Gitリポジトリのルート: `/Users/yuichinakamura/Documents/nanashi8-github-io-git/`
- プロジェクトのルート: `/Users/yuichinakamura/Documents/nanashi8-github-io-git/nanashi8.github.io/`

この二重構造により、AIエージェントや開発者が誤って親ディレクトリで作業することがあった。

### 2. 相対パスの誤用

一部のツールやコマンドが `../` を使って親ディレクトリを参照し、意図せずファイルを作成した可能性がある。

### 3. 作業ディレクトリの不明確さ

VSCodeや他のツールが、時に親ディレクトリをワークスペースルートとして認識し、そこに設定ファイルを作成した。

### 4. 既存指示の不足

`.aitk/instructions/` には45個の指示ファイルがあったが、**プロジェクト境界を明確に定義した指示がなかった**。

---

## 🛡️ 実装した再発防止策

### 1. 新規指示ファイルの作成

**ファイル**: `.aitk/instructions/project-boundary-guard.instructions.md`

**内容**:
- プロジェクト境界の明確な定義
- 禁止操作のリスト（`cd ..`, `../`, 親への出力等）
- 正しい操作パターンの例示
- よくある誤配置パターンの警告

**優先度**: Critical

### 2. 自動検出スクリプト

**ファイル**: `scripts/check-project-boundary.sh`

**機能**:
- 親ディレクトリの誤配置ファイル検出
- プロジェクト内の必須フォルダ確認
- 違反時の詳細レポート（サイズ、更新日）

**実行方法**:
```bash
npm run guard:check-boundary
```

### 3. package.jsonへの統合

**追加スクリプト**:
```json
"guard:check-boundary": "bash scripts/check-project-boundary.sh"
```

他の品質ガードと統合され、定期実行可能。

### 4. 許可リストの明確化

**親ディレクトリに存在を許可するもの**:
- `.venv/` - Python仮想環境（プロジェクト間共有）
- `.git/` - Gitリポジトリ管理
- `nanashi8.github.io/` - プロジェクト本体
- `*.code-workspace` - VSCodeワークスペース設定
- `.DS_Store` - macOSシステムファイル

---

## ✅ 検証結果

### テスト実行

```bash
$ npm run guard:check-boundary

🔍 プロジェクト境界チェック開始...

📁 親ディレクトリの状態:
---
✅ 誤配置ファイルなし - プロジェクト境界は正常です

📂 プロジェクト内の重要フォルダ:
   ✓ src
   ✓ public
   ✓ docs
   ✓ scripts
   ✓ tests
   ✓ config
   ✓ .aitk
   ✓ .github
   ✓ .vscode

✅ プロジェクト境界チェック完了
```

**結果**: すべてのチェックがパス ✅

---

## 📚 追加の推奨事項

### 1. 定期チェックの自動化

GitHub Actionsに統合を検討：

```yaml
- name: Check Project Boundary
  run: npm run guard:check-boundary
```

### 2. Pre-commitフックへの追加

`.husky/pre-commit` に追加：

```bash
npm run guard:check-boundary || echo "⚠️ 境界チェック失敗"
```

### 3. 開発環境のセットアップスクリプト更新

`scripts/setup-dev-environment.sh` に境界チェックを含める。

### 4. ドキュメントの更新

- `README.md` にプロジェクト構造の説明追加
- `docs/INDEX.md` に境界ガードの説明追加

---

## 🎯 期待される効果

### 短期的効果
- ✅ 誤配置ファイルの即時検出
- ✅ AIエージェントの明確なガイダンス
- ✅ プロジェクト境界の可視化

### 長期的効果
- ✅ プロジェクト構造の整合性維持
- ✅ 新規開発者のオンボーディング改善
- ✅ ビルド環境の一貫性確保

---

## 📝 まとめ

### 問題の本質
プロジェクト境界が不明確で、親ディレクトリへの誤配置が発生していた。

### 解決策
1. 明確な境界定義（指示ファイル）
2. 自動検出（スクリプト）
3. 継続的監視（npm スクリプト統合）

### 成果
- 8項目の誤配置を発見・削除
- 再発防止システムを確立
- プロジェクト構造が明確化

---

**関連ドキュメント**:
- [.aitk/instructions/project-boundary-guard.instructions.md](/.aitk/instructions/project-boundary-guard.instructions.md)
- [.aitk/instructions/project-structure.instructions.md](/.aitk/instructions/project-structure.instructions.md)
- [scripts/check-project-boundary.sh](../../scripts/check-project-boundary.sh)

**次回レビュー**: 2026-02-14（1ヶ月後）
