# 古典（高校受験）A5 PDF の生成

対象: `public/data/classical-japanese/*.csv`

出力先:

- `public/data/classical-japanese/print/classical-japanese-a5.html`
- `public/data/classical-japanese/print/classical-japanese-a5.pdf`

## 生成コマンド

```bash
npm run generate:classical-japanese-pdf
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

## 生成物の意図（設計）

- 各章に「重要ポイント（大きく）」→「付録：全データ（削らない）」の順で収録。
- 重要候補はCSVの `関連事項`（例: 最重要/最頻出/頻出）や種別などから自動抽出。

必要なら、重要抽出の条件やレイアウト密度（ページ数）を調整できます。
