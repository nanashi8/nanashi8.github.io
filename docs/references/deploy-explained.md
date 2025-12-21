---
title: デプロイ（超かんたんメモ）
created: 2025-11-12
updated: 2025-12-07
status: in-progress
tags: [reference, ai]
---

# デプロイ（超かんたんメモ）

目的：`main` と `gh-pages` の違いを短くまとめ、あとで見返せるように残します。

- main
  - 通常は「ソース（開発ファイル）」を置くブランチです。
  - GitHub Pages の公開元が「default branch のルート」になっている場合、`main` のルートにあるファイルが公開されます。

- gh-pages
  - Pages 用にビルド済みの静的ファイル（例：`dist/`）を置くための慣習的なブランチです。
  - Pages の公開元を `gh-pages` にすると、`gh-pages` の中身が公開されます。

どちらを使うか（簡単）
- このリポジトリは `nanashi8.github.io`（ユーザーサイト）なので、\n  - 手早く確実に公開したければ `dist/` を `main` のルートに置く方法で即公開できます（ただしソースと成果物が混ざる）。\n  - より良い運用は「ソースは `main` のままにして、CI（GitHub Actions）でビルドして `gh-pages` に自動デプロイ」する方法です（将来の運用が楽）。

短い操作メモ（即時修復：手早く公開）
1. main をバックアップする（念のため）
   - 例：`git branch backup-main-YYYYMMDD`（ローカルで作成）
1. `dist/` の中身を main のルートにコピーしてコミット・push する
   - （ローカルで）`rm -rf *` や `git clean` を使う前に必ずバックアップを確認してください。

短い操作メモ（推奨：自動化）
1. main にソースを置く（そのまま）
1. GitHub Actions を追加して、push 時に `npm ci && npm run build` を実行し、生成された `dist/` を `gh-pages` ブランチへデプロイする
1. GitHub の Settings → Pages で公開元を `gh-pages` / root に設定する

補足：ページが白くなる主な原因
- Pages の公開元が期待しているブランチではない（例：`gh-pages` に push したが Pages は `main` を見ている）
- asset のパスが絶対 `/assets/...` になっていて公開パスとずれている（project site の場合に起きやすい）
- ブラウザの Console に出るランタイムエラー

必要なら、このファイルに「実際の自動デプロイ用の GitHub Actions の雛形」や「main への即時デプロイ手順（コマンド）」を追記します。どうしますか？
