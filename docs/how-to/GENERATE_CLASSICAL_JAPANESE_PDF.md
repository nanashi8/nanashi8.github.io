# 古典（高校受験）縦長PDF（phone / 縦書き）の生成

対象: `public/data/classical-japanese/*.csv`

出力先:

（縦長（phone）のみ生成 / 本文は縦書き）

- `public/data/classical-japanese/print/classical-japanese-phone-kobun-words.pdf`
- `public/data/classical-japanese/print/classical-japanese-phone-kobun-grammar.pdf`
- `public/data/classical-japanese/print/classical-japanese-phone-kobun-knowledge.pdf`
- `public/data/classical-japanese/print/classical-japanese-phone-kobun-works.pdf`
- `public/data/classical-japanese/print/classical-japanese-phone-kanbun-words.pdf`
- `public/data/classical-japanese/print/classical-japanese-phone-kanbun-grammar.pdf`

## 漢文の表示ルール

- **掲載条件**: 漢文（`kanbun-words` / `kanbun-practice`）は、カード単位で「例文（基本構文/例）」があるものだけを掲載します。
- ※ `kanbun-practice`（漢文文法）は、語句そのものに返り点が入っている場合（例: `不二見一レ月`）は、例文が空でも見本として掲載します。
- **返り点の表示**: 語句・例文内の返り点（レ点・一二三四点・上下・甲乙丙丁）を小さく表示します。
- **関連（タグ）**: 漢文では関連タグは表示しません（ページ節約）。

## 古文（単語）の表示ルール

- **例文中の該当語句**: `kobun-words`（古文単語の本）では、見出し語（語句）が例文内に出現する場合、その箇所を **青字** で強調します。
- **語句が出ない例文**: 例文内に見出し語が見つからない場合、ラベルを `例文1（語句なし）` のようにして欠陥を可視化します。

## 生成コマンド

```bash
npm run generate:classical-japanese-pdf
```

## 例文の自動補完（語句が出る引用を採用）

古文単語などで「例文が空」または「例文に語句が出ていない」場合は、`classical-knowledge.csv` 内の引用文プールから **語句を含む引用** を探して `例文1/例文2` に採用します。

```bash
npm run fill:classical-japanese-examples -- --repair-missing-hit
```

- 置換できない語句（引用プールに語句を含む文が無い）は `no-hit headwords` として表示されます。
- その場合は `public/data/classical-japanese/classical-knowledge.csv` に該当語句を含む名文句（引用）を追加して再実行してください。

### Web探索（Wikisource優先）

ローカル引用プールに無い場合は、Web（主に Japanese Wikisource、必要に応じて青空文庫）から本文を取得して **語句を含む1文** を例文として採用できます。

```bash
npm run fill:classical-japanese-examples -- --repair-missing-hit --web
```

- 初回はWeb側の取得があるため時間がかかることがあります（以後はキャッシュで高速化）。
- 対象を絞って試す場合は `--only` が使えます。

時間がかかりすぎる場合は、探索の上限を付けて実行できます（例: 1語あたりの探索を短くする）。

```bash
npm run fill:classical-japanese-examples -- \
  --repair-missing-hit --web \
  --web-max-sources 6 \
  --web-max-snippet-queries 24 \
  --web-time-budget-ms 8000 \
  --web-no-aozora \
  --web-min-interval-ms 500
```

```bash
npm run fill:classical-japanese-examples -- --repair-missing-hit --web --only classical-words
```

### 自動化（修復→集計レポート）

修復を実行したあと、残っている「例文に語句が出ない」件数をJSONで出力します。

```bash
npm run fill:classical-japanese-examples:auto
```

- 出力: `nanashi8.github.io/scripts/output/classical-example-hit-report.json`

ローカルの引用プールで見つからない場合に、青空文庫（公的ドメイン）から例文（短い1文）を探索して採用する:

```bash
npm run fill:classical-japanese-examples -- --repair-missing-hit --web
```

### オプション

- HTMLのみ欲しい（PDFを作らない）:

```bash
npx tsx scripts/generate-classical-japanese-pdf.ts --no-pdf
```

- 章（deck）を限定して生成:

```bash
npx tsx scripts/generate-classical-japanese-pdf.ts --only grammar
```

利用可能な `--only`:

- `grammar`
- `vocabulary`
- `knowledge`
- `words`
- `kanbun-practice`
- `kanbun-words`

- 出力先を変える:

```bash
npx tsx scripts/generate-classical-japanese-pdf.ts --out /tmp/classical-pdf
```

## レイアウト方針

- 英単語PDFと同じく「表紙 + カード連続」のみ（余計な説明文は入れない）
- 意味は赤字
