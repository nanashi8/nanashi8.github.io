# ローカルUD依存解析（stanza）運用手順

目的: クラウドに頼らずローカルで依存構造解析（UD）を行い、UI（長文読解）が **依存解析JSONを優先** してSVOCMタグ付けに利用できる状態を作る。

## データフロー

1. パッセージ本文（`.txt`）
2. 1行=1文の入力ファイル生成
3. stanzaでUD依存解析
4. `public/data/passage-parses/<passageId>.json` を生成
5. UIが `/data/passage-parses/<passageId>.json` を読み込み、表示タグ付けに反映

## 1) 依存ライブラリの準備

- `python3 -m pip install -r config/requirements-ud-parse.txt`

初回実行時に stanza の英語モデルがローカルにダウンロードされます（以降はオフラインでも動作）。

## 2) sentencesファイル（1行=1文）を生成

- 単一パッセージ:
  - `python3 scripts/build_passage_sentences.py --passage-id beginner-morning-routine`
- 全パッセージ:
  - `python3 scripts/build_passage_sentences.py --all`

出力:
- `public/data/passages-sentences/<passageId>_sentences.txt`

## 3) UD依存解析JSONを生成

- `python3 scripts/parse_dependency_to_json.py --passage-id beginner-morning-routine`

出力:
- `public/data/passage-parses/<passageId>.json`

## 4) UI側の利用（優先適用）

- 長文読解（Comprehensive）では `public/data/passage-parses/<passageId>.json` が存在する場合、
  文クリック時のSVOCMタグ付けが **UD依存解析ベース** になります。
- JSONが無い場合は、従来通りルールベース解析にフォールバックします。

## トラブルシュート

- JSONが読み込まれない
  - `public/data/passage-parses/<passageId>.json` が存在するか
  - passageIdがUIのpassageId（例: `beginner-morning-routine`）と一致しているか

- 文が一致しない（UD結果が反映されない）
  - `passages-sentences` の文区切りと、UIが表示している文区切りがズレている可能性があります。
  - まずは `scripts/build_passage_sentences.py` を使って生成し、同じ文分割の起点を共有してください。
