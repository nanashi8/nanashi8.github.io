# データ生成ツールカタログ

このプロジェクトで作成した、再利用可能な**教材データ**を生成・検証・変換するためのツール群を体系的に紹介します。

---

## 📋 目次

### [A. 英語教材ツール](#a-英語教材ツール)
- [A-1. 英文分割ツール群](#a-1-英文分割ツール群) - 読解補助・問題集生成
- [A-2. 文法データ検証ツール群](#a-2-文法データ検証ツール群) - 文法問題の品質管理
- [A-3. 単語・発音データツール群](#a-3-単語発音データツール群) - IPA・発音記号の自動付与

### [B. 古文教材ツール](#b-古文教材ツール)
- [B-1. 古文PDFジェネレーター](#b-1-古文pdfジェネレーター) - 印刷用教材生成
- [B-2. 古文例文管理ツール](#b-2-古文例文管理ツール) - データ整形・移行

### [C. 社会科教材ツール](#c-社会科教材ツール)
- [C-1. 社会科データ変換ツール](#c-1-社会科データ変換ツール) - CSV/JSON変換
- [C-2. 社会科データ検証ツール](#c-2-社会科データ検証ツール) - データ品質チェック

### [D. プロジェクト管理ツール](#d-プロジェクト管理ツール)
- [D-1. ドキュメント管理ツール](#d-1-ドキュメント管理ツール) - 仕様書・設計書の同期
- [D-2. 品質保証ツール](#d-2-品質保証ツール) - コード品質・データ品質チェック

### [E. クイックリファレンス](#e-クイックリファレンス)
- [シナリオ別ツール早見表](#シナリオ別ツール早見表)
- [よく使うコマンド一覧](#よく使うコマンド一覧)

---

## A. 英語教材ツール

英語学習用のデータ生成・検証・変換を行うツール群です。

---

### A-1. 英文分割ツール群

**🎯 目的**: 英文教材を学習目的に応じた3形式で自動分割し、JSON形式のデジタルコンテンツを生成

**📦 含まれるツール**: 4種類

<details>
<summary><strong>A-1-1. 語句分割ツール (Vocabulary Split)</strong></summary>

#### 概要
英文を単語と熟語のまとまりごとに分割し、各チャンクに`+`プレフィックスを付加。カスタム問題集作成用。

#### 入力データ
- 原文の英文テキストファイル
- 例: `public/data/passages-original/J_2020_4.txt`

#### 出力データ
```json
{
  "vocabularySplit": "+ I / + wake up / + at seven / + every morning / ."
}
```

#### いつ使う
- ✅ 生徒がカスタム問題集を作成できる機能を提供したい時
- ✅ 語句ごとに選択可能なインタラクティブ教材を作りたい時
- ✅ 熟語や句動詞を適切なまとまりで保持したい時

#### 対応する文法パターン
18種類（句動詞、熟語、時間表現、数詞表現、受動態、前置詞句、to不定詞、関係代名詞、比較級、現在完了、疑問詞+to不定詞など）

#### コマンド
```bash
npm run test:vocab-split     # 18パターンのテスト実行（18/18合格確認）
```

#### ソースコード
- `src/utils/vocabularySplitLogic.ts`
- `src/utils/testVocabularySplit.ts`

</details>

<details>
<summary><strong>A-1-2. スラッシュ分割ツール (Slash Split)</strong></summary>

#### 概要
接続詞・前置詞句の前に `/` を挿入して意味のまとまりを明示。スラッシュリーディング教材用。

#### 入力データ
- 原文の英文テキストファイル

#### 出力データ
```json
{
  "slashSplit": "I walk / to school / with friends."
}
```

#### いつ使う
- ✅ 長文読解の補助ツールとして活用したい時
- ✅ 文の構造を視覚的に把握させたい時
- ✅ スラッシュリーディング教材を生成したい時

#### 処理ルール
- 接続詞前に `/` 挿入 (`and`, `but`, `because`, etc.)
- 前置詞句前に `/` 挿入 (`at`, `in`, `to`, `with`, etc.)
- `have to`, `want to`などの熟語は保護

#### コマンド
```bash
npm run test:slash-split     # テスト実行
```

#### ソースコード
- `src/utils/slashSplitLogic.ts`
- `src/utils/testSlashSplit.ts`

</details>

<details>
<summary><strong>A-1-3. 括弧分割ツール (Parentheses Split)</strong></summary>

#### 概要
従属節を `()`、前置詞句を `<>` で囲んで文構造を明示。文法構造理解用。

#### 入力データ
- 原文の英文テキストファイル

#### 出力データ
```json
{
  "parenSplit": "I can't join (because I have to go home by six)."
}
```

#### いつ使う
- ✅ 文法構造を視覚的に教えたい時
- ✅ 主節と従属節を区別して理解させたい時
- ✅ 前置詞句の役割を明示したい時

#### 処理ルール
- 従属節を `()` で囲む (`that`, `because`, `if`, `when`節)
- 前置詞句を `<>` で囲む
- 文構造を損なわないよう配置

#### コマンド
```bash
npm run test:paren-split     # テスト実行
```

#### ソースコード
- `src/utils/parenSplitLogic.ts`
- `src/utils/testParenSplit.ts`

</details>

<details>
<summary><strong>A-1-4. データ生成スクリプト (Generate Split Data)</strong></summary>

#### 概要
英文ファイルを読み込み、上記3形式の分割を一括適用してJSONファイルを生成。

#### 入力データ
- `public/data/passages-original/` 内の`.txt`ファイル
- 対話文形式: `話者名 : 英文`

#### 出力データ
```json
[
  {
    "id": "J_2020_4_1",
    "original": "In our city, we have a good zoo, Smile Zoo.",
    "slashSplit": "In our city, we have a good zoo, Smile Zoo.",
    "parenSplit": "<In our city>, we have a good zoo, Smile Zoo.",
    "vocabularySplit": "+ In our city / , / + we / + have / + a / + good / + zoo / , / + Smile / + Zoo / ."
  }
]
```

#### いつ使う
- ✅ 新しい英文教材を追加した時
- ✅ 既存教材を更新した時
- ✅ 3形式のデータを一括生成したい時

#### 処理フロー
1. テキストファイル読み込み
2. 話者情報を除去して文単位に分割
3. 各文に3つの分割処理を適用
4. JSON形式で `passages-processed/` に保存

#### コマンド
```bash
# 単一ファイル処理
npm run generate:split-data -- public/data/passages-original/J_2020_4.txt

# 全ファイル一括処理
npm run generate:split-data
```

#### ソースコード
- `src/utils/generateSplitData.ts`

</details>

**📊 テストカバレッジ**: 18/18パターン全合格
- 基本パターン(1-12): J_2020_4.txt由来
- 拡張パターン(13-18): 関係代名詞、受動態、to不定詞、比較級、疑問詞+to、現在完了

**📚 詳細ドキュメント**:
- 実装ガイド: `docs/development/vocabulary-tab-split-implementation.md`
- 使用方法: `src/utils/README.md`

---

### A-2. 文法データ検証ツール群

**🎯 目的**: 文法問題データの品質を保証し、データ整合性をチェック

**📦 含まれるツール**: 5種類

<details>
<summary><strong>A-2-1. 文法データ基本検証</strong></summary>

#### 概要
文法問題の基本的なデータ構造と必須フィールドを検証。

#### いつ使う
- ✅ 文法問題を新規追加した時
- ✅ データ形式の変更を行った時
- ✅ ビルド前の品質チェックとして

#### コマンド
```bash
npm run validate:grammar
```

#### ソースコード
- `scripts/validate_grammar_advanced.py`

</details>

<details>
<summary><strong>A-2-2. 文法データ品質分析</strong></summary>

#### 概要
文法問題の品質を詳細に分析し、レポートを生成。

#### いつ使う
- ✅ データ品質の定期チェック時
- ✅ 問題のバランスを確認したい時
- ✅ 品質改善の方針を決定したい時

#### コマンド
```bash
npm run validate:grammar:analyze
```

#### ソースコード
- `scripts/analyze_grammar_data_quality.py`

</details>

<details>
<summary><strong>A-2-3. 文法解説検証</strong></summary>

#### 概要
文法問題の解説文の品質と整合性を検証。

#### いつ使う
- ✅ 解説文を追加・修正した時
- ✅ ビルド前の必須チェック（prebuild）
- ✅ 解説の網羅性を確認したい時

#### コマンド
```bash
npm run validate:grammar:explanations
```

#### ソースコード
- `tools/validate-grammar-explanations.ts`

</details>

<details>
<summary><strong>A-2-4. 文法品質一括チェック</strong></summary>

#### 概要
上記3つの検証を一括実行。

#### いつ使う
- ✅ デプロイ前の最終チェック
- ✅ 文法データの総合的な品質確認

#### コマンド
```bash
npm run check:grammar-quality
```

#### 実行内容
1. `validate:grammar` - 基本検証
2. `validate:grammar:analyze` - 品質分析
3. `validate:grammar:explanations` - 解説検証

</details>

<details>
<summary><strong>A-2-5. 文法整合性チェック</strong></summary>

#### 概要
文法問題とパッセージの整合性をチェック。

#### いつ使う
- ✅ パッセージとの参照関係を確認したい時
- ✅ データリークを検出したい時

#### コマンド
```bash
tsx tools/check-grammar-integrity.ts
```

#### ソースコード
- `tools/check-grammar-integrity.ts`
- `tools/fix-grammar-sentenceordering-passage-leaks.ts`
- `tools/fix-grammar-fill-verb-leaks.ts`

</details>

**📚 関連ドキュメント**:
- 文法データ仕様: `docs/specifications/`
- 品質ガイドライン: `docs/quality/`

---

### A-3. 単語・発音データツール群

**🎯 目的**: 英単語の発音記号（IPA）とカタカナ読みを自動付与・修正

**📦 含まれるツール**: 5種類

<details>
<summary><strong>A-3-1. IPA自動付与</strong></summary>

#### 概要
CMU辞書を使用して英単語にIPA発音記号を自動付与。

#### いつ使う
- ✅ 新しい単語データを追加した時
- ✅ IPA未登録の単語がある時

#### コマンド
```bash
python3 scripts/auto-add-ipa-cmu.py
```

#### 処理内容
- CMU発音辞書から発音を取得
- IPA記号に変換して付与
- 未登録単語をレポート

#### ソースコード
- `scripts/auto-add-ipa-cmu.py`

</details>

<details>
<summary><strong>A-3-2. IPA欠損修正</strong></summary>

#### 概要
IPA記号が欠損している単語を検出・修正。

#### いつ使う
- ✅ IPA欠損エラーが発生した時
- ✅ データ品質チェック時

#### コマンド
```bash
python3 scripts/auto-fix-ipa-missing.py
```

#### ソースコード
- `scripts/auto-fix-ipa-missing.py`

</details>

<details>
<summary><strong>A-3-3. IPA重複修正</strong></summary>

#### 概要
IPAが単語と同じ値になっている誤りを修正。

#### いつ使う
- ✅ IPAデータの整合性チェック時

#### コマンド
```bash
python3 scripts/auto-fix-ipa-same-as-word.py
```

#### ソースコード
- `scripts/auto-fix-ipa-same-as-word.py`

</details>

<details>
<summary><strong>A-3-4. カタカナ読み自動付与</strong></summary>

#### 概要
英単語にカタカナ読みを自動付与。

#### いつ使う
- ✅ 初学者向け教材を作成する時
- ✅ カタカナ読みが未登録の時

#### コマンド
```bash
python3 scripts/auto-fix-katakana.py
```

#### ソースコード
- `scripts/auto-fix-katakana.py`

</details>

<details>
<summary><strong>A-3-5. カタカナ読みクリーニング</strong></summary>

#### 概要
カタカナ読みの表記揺れを統一・修正。

#### いつ使う
- ✅ カタカナ読みの品質向上時

#### コマンド
```bash
python3 scripts/auto-fix-katakana-clean.py
```

#### ソースコード
- `scripts/auto-fix-katakana-clean.py`

</details>

**📚 関連データ**:
- 単語データ: `public/data/vocabulary/`
- CMU辞書: 外部リソース

---

## B. 古文教材ツール

古文学習用のデータ生成・管理を行うツール群です。

---

### B-1. 古文PDFジェネレーター

**🎯 目的**: 古文教材をPDF形式で生成し、印刷用資料を作成

<details>
<summary><strong>B-1-1. 古文PDF生成</strong></summary>

#### 概要
古文データから印刷用PDFを自動生成。

#### 入力データ
- 古文テキストデータ
- メタデータ（作品名、作者、解説等）

#### 出力データ
- PDF形式の教材ファイル

#### いつ使う
- ✅ 古文教材を印刷資料として配布したい時
- ✅ オフライン学習用の資料を作成したい時

#### コマンド
```bash
npm run generate:classical-japanese-pdf
```

#### ソースコード
- `scripts/generate-classical-japanese-pdf.ts`
- `scripts/generate_classical_pdf.py`

</details>

**📚 使い方ガイド**: `docs/how-to/GENERATE_CLASSICAL_JAPANESE_PDF.md`

---

### B-2. 古文例文管理ツール

**🎯 目的**: 古文例文データの整形・移行・品質チェック

**📦 含まれるツール**: 6種類

<details>
<summary><strong>B-2-1. 古文例文自動入力</strong></summary>

#### 概要
古文例文データの欠損を自動補完。

#### いつ使う
- ✅ 例文データが不完全な時
- ✅ データ整備を効率化したい時

#### コマンド
```bash
npm run fill:classical-japanese-examples
```

#### ソースコード
- `scripts/fill-classical-japanese-examples.ts`

</details>

<details>
<summary><strong>B-2-2. 古文読み仮名入力</strong></summary>

#### 概要
古文テキストに読み仮名を自動付与。

#### コマンド
```bash
tsx scripts/fill-classical-japanese-example-full-readings.ts
```

#### ソースコード
- `scripts/fill-classical-japanese-example-full-readings.ts`

</details>

<details>
<summary><strong>B-2-3. 古文例文移行</strong></summary>

#### 概要
古文例文データを新形式に移行。

#### いつ使う
- ✅ データ形式の変更時
- ✅ データ構造の改善時

#### コマンド
```bash
tsx scripts/migrate-classical-japanese-examples.ts
```

#### ソースコード
- `scripts/migrate-classical-japanese-examples.ts`
- `scripts/migrate-kanbun-to-examples.ts`

</details>

<details>
<summary><strong>B-2-4. 古文形式正規化</strong></summary>

#### 概要
古文データの形式を統一・正規化。

#### コマンド
```bash
tsx scripts/normalize-classical-japanese-examples-format.ts
```

#### ソースコード
- `scripts/normalize-classical-japanese-examples-format.ts`

</details>

<details>
<summary><strong>B-2-5. 古文データ品質監査</strong></summary>

#### 概要
古文例文データの品質を監査しレポート生成。

#### いつ使う
- ✅ データ品質の定期チェック時
- ✅ 品質改善の計画時

#### コマンド
```bash
tsx scripts/audit-classical-japanese-examples-quality.ts
```

#### ソースコード
- `scripts/audit-classical-japanese-examples-quality.ts`

</details>

<details>
<summary><strong>B-2-6. 古文知識データ更新</strong></summary>

#### 概要
古文知識データベースを更新。

#### コマンド
```bash
tsx scripts/update-classical-knowledge-works.ts
```

#### ソースコード
- `scripts/update-classical-knowledge-works.ts`

</details>

---

## C. 社会科教材ツール

社会科学習用のデータ変換・検証を行うツール群です。

---

### C-1. 社会科データ変換ツール

**🎯 目的**: 社会科データをCSV/JSON形式間で変換

<details>
<summary><strong>C-1-1. CSV→JSON変換</strong></summary>

#### 概要
CSVファイルをJSON形式に変換。

#### 入力データ
- `local-data-packs/social-studies*.csv`

#### 出力データ
- JSON形式の社会科データ

#### いつ使う
- ✅ CSVで作成したデータをアプリで使いたい時
- ✅ データ形式を統一したい時

#### コマンド
```bash
npm run convert:social-studies
```

#### ソースコード
- `scripts/convert-social-studies-csv.ts`

</details>

<details>
<summary><strong>C-1-2. JSON→CSV変換</strong></summary>

#### 概要
JSONデータをCSV形式に変換。

#### いつ使う
- ✅ Excelで編集したい時
- ✅ CSVでデータを管理したい時

#### コマンド
```bash
python3 scripts/convert-social-json-to-csv.py
```

#### ソースコード
- `scripts/convert-social-json-to-csv.py`

</details>

<details>
<summary><strong>C-1-3. CSV修正ツール</strong></summary>

#### 概要
CSVファイルのカンマ問題を自動修正。

#### いつ使う
- ✅ CSV形式エラーが発生した時
- ✅ データクリーニング時

#### コマンド
```bash
tsx scripts/fix-social-studies-csv-commas.ts
```

#### ソースコード
- `scripts/fix-social-studies-csv-commas.ts`

</details>

---

### C-2. 社会科データ検証ツール

**🎯 目的**: 社会科データの品質を保証

<details>
<summary><strong>C-2-1. 社会科データ検証 (Python版)</strong></summary>

#### 概要
社会科データの構造と内容を検証。

#### いつ使う
- ✅ 社会科データを追加・更新した時
- ✅ データ品質チェック時

#### コマンド
```bash
npm run validate:social-studies
```

#### ソースコード
- `scripts/validate-social-studies.py`

</details>

<details>
<summary><strong>C-2-2. 社会科データ検証 (TypeScript版)</strong></summary>

#### 概要
TypeScriptによる社会科データ検証。

#### コマンド
```bash
tsx scripts/validate-social-studies.ts
```

#### ソースコード
- `scripts/validate-social-studies.ts`

</details>

<details>
<summary><strong>C-2-3. 社会科カバレッジ監査</strong></summary>

#### 概要
社会科データの網羅性を監査。

#### いつ使う
- ✅ データの網羅性を確認したい時
- ✅ 学習範囲の確認時

#### コマンド
```bash
tsx scripts/audit-social-studies-coverage.ts
```

#### ソースコード
- `scripts/audit-social-studies-coverage.ts`

</details>

---

## D. プロジェクト管理ツール

プロジェクト全体の管理・品質保証を行うツール群です。

---

### D-1. ドキュメント管理ツール

**🎯 目的**: 仕様書・設計書・ドキュメントの同期・整合性維持

**📦 含まれるツール**: 7種類

<details>
<summary><strong>D-1-1. インストラクション更新</strong></summary>

#### 概要
AI用インストラクションファイルを更新。

#### いつ使う
- ✅ 仕様変更時
- ✅ 開発ガイドライン更新時

#### コマンド
```bash
npm run update-instructions
```

#### ソースコード
- `scripts/update-instructions.mjs`

</details>

<details>
<summary><strong>D-1-2. 仕様書更新</strong></summary>

#### 概要
プロジェクト仕様書を更新。

#### コマンド
```bash
npm run update-specifications
```

#### ソースコード
- `scripts/update-specifications.mjs`

</details>

<details>
<summary><strong>D-1-3. パイプライン更新</strong></summary>

#### 概要
CI/CDパイプライン設定を更新。

#### コマンド
```bash
npm run update-pipelines
```

#### ソースコード
- `scripts/update-pipelines.mjs`

</details>

<details>
<summary><strong>D-1-4. 全ドキュメント一括更新</strong></summary>

#### 概要
上記3つを一括実行。

#### コマンド
```bash
npm run update-all-docs
```

</details>

<details>
<summary><strong>D-1-5. ドキュメントリンク分析</strong></summary>

#### 概要
ドキュメント間のリンク整合性を分析。

#### いつ使う
- ✅ リンク切れをチェックしたい時
- ✅ ドキュメント構造を確認したい時

#### コマンド
```bash
npm run docs:analyze
```

#### ソースコード
- `scripts/analyze-doc-links.mjs`

</details>

<details>
<summary><strong>D-1-6. ドキュメント命名規則チェック</strong></summary>

#### 概要
ドキュメントの命名規則違反を検出。

#### コマンド
```bash
npm run docs:analyze:naming
```

#### ソースコード
- `scripts/analyze-naming-violations.mjs`

</details>

<details>
<summary><strong>D-1-7. ドキュメント統計</strong></summary>

#### 概要
ドキュメントの統計情報を表示。

#### コマンド
```bash
npm run docs:stats
```

</details>

**📚 ドキュメント管理ガイド**: `docs/DOCUMENTATION_OPERATIONS.md`

---

### D-2. 品質保証ツール

**🎯 目的**: コード品質・データ品質の自動チェック

**📦 含まれるツール**: 10種類以上

<details>
<summary><strong>D-2-1. データ品質チェック</strong></summary>

#### 概要
全データファイルの品質を一括チェック。

#### いつ使う
- ✅ デプロイ前の品質確認
- ✅ 定期的な品質監視

#### コマンド
```bash
npm run check:data-quality
```

#### ソースコード
- `scripts/check-data-quality.sh`
- `scripts/data-quality-check.mjs`

</details>

<details>
<summary><strong>D-2-2. 型チェック</strong></summary>

#### 概要
TypeScriptの型チェックを実行。

#### コマンド
```bash
npm run typecheck
```

</details>

<details>
<summary><strong>D-2-3. ESLintチェック</strong></summary>

#### 概要
JavaScriptコードの品質チェック。

#### コマンド
```bash
npm run lint              # 全警告表示
npm run lint:errors-only  # エラーのみ表示
```

</details>

<details>
<summary><strong>D-2-4. CSSリントチェック</strong></summary>

#### 概要
CSSコードの品質チェック。

#### コマンド
```bash
npm run lint:css          # チェック
npm run lint:css:fix      # 自動修正
```

</details>

<details>
<summary><strong>D-2-5. Markdownリントチェック</strong></summary>

#### 概要
Markdownファイルの品質チェック。

#### コマンド
```bash
npm run lint:md
```

</details>

<details>
<summary><strong>D-2-6. 読解タグチェック</strong></summary>

#### 概要
読解教材の文法タグ整合性をチェック。

#### コマンド
```bash
npm run check:reading-grammar-tags
```

#### ソースコード
- `scripts/check-reading-grammar-tags.ts`

</details>

<details>
<summary><strong>D-2-7. 引用チェック</strong></summary>

#### 概要
読解教材の引用符整合性をチェック。

#### コマンド
```bash
npm run check:reading-quoting
```

#### ソースコード
- `scripts/check-reading-sentence-quoting.ts`

</details>

<details>
<summary><strong>D-2-8. ダークモードチェック</strong></summary>

#### 概要
ダークモード関連コードの混入をチェック。

#### コマンド
```bash
npm run check:no-dark-mode
```

#### ソースコード
- `scripts/check-no-dark-mode.mjs`

</details>

<details>
<summary><strong>D-2-9. 品質一括チェック</strong></summary>

#### 概要
全品質チェックを一括実行（軽量版）。

#### コマンド
```bash
npm run quality:check
```

#### 実行内容
- typecheck
- lint:errors-only
- lint:css
- lint:md
- check:symptomatic-fixes
- check:reading-grammar-tags
- check:reading-quoting

</details>

<details>
<summary><strong>D-2-10. 厳格品質チェック</strong></summary>

#### 概要
全品質チェックを一括実行（厳格版）。

#### コマンド
```bash
npm run quality:strict
```

#### 実行内容
- typecheck
- lint (全警告)
- lint:css
- lint:md
- check:symptomatic-fixes
- check:reading-grammar-tags
- check:reading-quoting

</details>

---

## E. クイックリファレンス

---

### シナリオ別ツール早見表

| やりたいこと | 使うツール番号 | コマンド |
|------------|------------|---------|
| **英語教材** |
| 新しい英文教材を追加 | A-1-4 | `npm run generate:split-data` |
| カスタム問題集機能を実装 | A-1-1 | `npm run test:vocab-split` |
| スラッシュリーディング教材作成 | A-1-2 | `npm run test:slash-split` |
| 文法構造教材作成 | A-1-3 | `npm run test:paren-split` |
| 文法問題を追加 | A-2-1,2,3 | `npm run check:grammar-quality` |
| 単語に発音記号を追加 | A-3-1 | `python3 scripts/auto-add-ipa-cmu.py` |
| **古文教材** |
| 古文PDFを生成 | B-1-1 | `npm run generate:classical-japanese-pdf` |
| 古文例文を整備 | B-2-1 | `npm run fill:classical-japanese-examples` |
| 古文データ品質チェック | B-2-5 | `tsx scripts/audit-classical-japanese-examples-quality.ts` |
| **社会科教材** |
| CSVをJSONに変換 | C-1-1 | `npm run convert:social-studies` |
| 社会科データを検証 | C-2-1 | `npm run validate:social-studies` |
| 社会科カバレッジ確認 | C-2-3 | `tsx scripts/audit-social-studies-coverage.ts` |
| **品質チェック** |
| デプロイ前の総合チェック | D-2-9,10 | `npm run quality:strict` |
| データ品質チェック | D-2-1 | `npm run check:data-quality` |
| ドキュメント整合性チェック | D-1-5,6 | `npm run docs:check` |

---

### よく使うコマンド一覧

#### 🎯 教材生成
```bash
npm run generate:split-data              # 英文分割データ生成
npm run generate:classical-japanese-pdf  # 古文PDF生成
npm run convert:social-studies           # 社会科データ変換
```

#### ✅ 品質チェック
```bash
npm run test:splits                      # 英文分割テスト
npm run check:grammar-quality            # 文法品質チェック
npm run validate:social-studies          # 社会科検証
npm run quality:check                    # 全品質チェック（軽量）
npm run quality:strict                   # 全品質チェック（厳格）
```

#### 📚 ドキュメント管理
```bash
npm run update-all-docs                  # 全ドキュメント更新
npm run docs:check                       # ドキュメント整合性チェック
npm run docs:stats                       # ドキュメント統計
```

#### 🧪 テスト
```bash
npm test                                 # 高速ユニットテスト
npm run test:unit                        # 全ユニットテスト
npm run test:smoke                       # スモークテスト
npm run test:all                         # 全テスト実行
```

---

## 🔧 メンテナンスガイド

### 新しいツールを追加する時

1. **スクリプト作成**: `scripts/` または `tools/` に配置
2. **package.jsonに登録**:
   ```json
   "scripts": {
     "your-tool": "tsx scripts/your-tool.ts"
   }
   ```
3. **このカタログに追加**: 適切なカテゴリに番号付きで追加
4. **使用方法を記載**: 入力・出力・いつ使うかを明記
5. **テスト作成**: 動作確認用のテストを用意

### ツールの命名規則

- **検証系**: `validate:`, `check:`
- **生成系**: `generate:`
- **変換系**: `convert:`
- **修正系**: `fix:`
- **テスト系**: `test:`
- **更新系**: `update:`

---

## 📈 今後の拡張

- [ ] 単語帳自動生成ツール
- [ ] 文法問題自動生成ツール
- [ ] 教材難易度分析ツール
- [ ] 学習進捗シミュレーター
- [ ] 多言語対応ツール

---

**作成日**: 2026年1月10日  
**最終更新**: 2026年1月10日  
**メンテナー**: プロジェクトチーム

### 概要
英文教材を**学習目的に応じた3形式**で自動分割し、JSON形式のデジタルコンテンツとして生成するツール群。

### 🎯 目的
- **カスタム問題集作成**: 語句ごとに+ボタンを配置
- **読解補助**: 意味のまとまりで区切って理解を助ける
- **文構造理解**: 従属節・前置詞句を視覚的に明示

### 📦 ツール一覧

#### 1. **語句分割ツール** (Vocabulary Split)

**何をするツール**: 英文を単語と熟語のまとまりごとに分割し、各チャンクに`+`プレフィックスを付加

**入力データ**: 
- 原文の英文テキストファイル
- 例: `public/data/passages-original/J_2020_4.txt`

**出力データ**:
```json
{
  "vocabularySplit": "+ I / + wake up / + at seven / + every morning / ."
}
```

**いつ使う**:
- 生徒がカスタム問題集を作成できる機能を提供したい時
- 語句ごとに選択可能なインタラクティブ教材を作りたい時
- 熟語や句動詞を適切なまとまりで保持したい時

**対応する文法パターン**: 18種類
1. 句動詞 (`wake up`, `give food`)
2. 熟語 (`have to`, `in front of`)
3. 時間表現 (`at seven`, `every morning`, `for five years`)
4. 数詞表現 (`fifteen years old`, `three dollars`)
5. 受動態 (`by many people`)
6. 前置詞句 (`to school`, `with friends` - 個別分離)
7. to不定詞と前置詞toの区別
8. 関係代名詞節
9. 比較級構文
10. 現在完了
11. 疑問詞+to不定詞
12. その他基本構文

**コマンド**:
```bash
npm run test:vocab-split     # 18パターンのテスト実行
```

**ソースコード**: `src/utils/vocabularySplitLogic.ts`

---

#### 2. **スラッシュ分割ツール** (Slash Split)

**何をするツール**: 接続詞・前置詞句の前に `/` を挿入して意味のまとまりを明示

**入力データ**: 
- 原文の英文テキストファイル

**出力データ**:
```json
{
  "slashSplit": "I walk / to school / with friends."
}
```

**いつ使う**:
- 長文読解の補助ツールとして活用したい時
- 文の構造を視覚的に把握させたい時
- スラッシュリーディング教材を生成したい時

**処理ルール**:
- 接続詞前に `/` 挿入 (`and`, `but`, `because`, etc.)
- 前置詞句前に `/` 挿入 (`at`, `in`, `to`, `with`, etc.)
- `have to`, `want to`などの熟語は保護

**コマンド**:
```bash
npm run test:slash-split     # テスト実行
```

**ソースコード**: `src/utils/slashSplitLogic.ts`

---

#### 3. **括弧分割ツール** (Parentheses Split)

**何をするツール**: 従属節を `()`、前置詞句を `<>` で囲んで文構造を明示

**入力データ**: 
- 原文の英文テキストファイル

**出力データ**:
```json
{
  "parenSplit": "I can't join (because I have to go home by six)."
}
```

**いつ使う**:
- 文法構造を視覚的に教えたい時
- 主節と従属節を区別して理解させたい時
- 前置詞句の役割を明示したい時

**処理ルール**:
- 従属節を `()` で囲む (`that`, `because`, `if`, `when`節)
- 前置詞句を `<>` で囲む
- 文構造を損なわないよう配置

**コマンド**:
```bash
npm run test:paren-split     # テスト実行
```

**ソースコード**: `src/utils/parenSplitLogic.ts`

---

#### 4. **データ生成スクリプト** (Generate Split Data)

**何をするツール**: 英文ファイルを読み込み、上記3形式の分割を一括適用してJSONファイルを生成

**入力データ**: 
- `public/data/passages-original/` 内の`.txt`ファイル
- 対話文形式: `話者名 : 英文`

**出力データ**:
```json
[
  {
    "id": "J_2020_4_1",
    "original": "In our city, we have a good zoo, Smile Zoo.",
    "slashSplit": "In our city, we have a good zoo, Smile Zoo.",
    "parenSplit": "<In our city>, we have a good zoo, Smile Zoo.",
    "vocabularySplit": "+ In our city / , / + we / + have / + a / + good / + zoo / , / + Smile / + Zoo / ."
  }
]
```

**いつ使う**:
- 新しい英文教材を追加した時
- 既存教材を更新した時
- 3形式のデータを一括生成したい時

**処理フロー**:
1. テキストファイル読み込み
2. 話者情報を除去して文単位に分割
3. 各文に3つの分割処理を適用
4. JSON形式で `passages-processed/` に保存

**コマンド**:
```bash
# 単一ファイル処理
npm run generate:split-data -- public/data/passages-original/J_2020_4.txt

# 全ファイル一括処理
npm run generate:split-data
```

**ソースコード**: `src/utils/generateSplitData.ts`

---

## 使い分けガイド

### シナリオ別推奨ツール

| やりたいこと | 使うツール | コマンド |
|------------|----------|---------|
| 新しい英文教材を追加 | データ生成スクリプト | `npm run generate:split-data` |
| カスタム問題集機能を実装 | 語句分割 | `npm run test:vocab-split`で動作確認 |
| スラッシュリーディング教材作成 | スラッシュ分割 | `npm run test:slash-split`で動作確認 |
| 文法構造教材作成 | 括弧分割 | `npm run test:paren-split`で動作確認 |
| 全分割の動作確認 | 全テスト | `npm run test:splits` |
| 新しい熟語に対応 | 各ロジックファイル編集 | 配列に追加後テスト実行 |

### ワークフロー例

#### 📝 新規教材追加ワークフロー

```bash
# 1. 英文ファイルを配置
# public/data/passages-original/NEW_PASSAGE.txt

# 2. データ生成
npm run generate:split-data -- public/data/passages-original/NEW_PASSAGE.txt

# 3. 生成データ確認
# public/data/passages-processed/NEW_PASSAGE_processed.json

# 4. ウェブアプリで読み込み
# (JSONファイルを読み込んで表示)
```

#### 🔧 分割ルール修正ワークフロー

```bash
# 1. ロジックファイル編集
# src/utils/vocabularySplitLogic.ts (例: 新しい句動詞を追加)

# 2. テスト実行
npm run test:vocab-split

# 3. 期待通り動作するか確認
# ✓ 18/18 合格を確認

# 4. 全教材を再生成
npm run generate:split-data
```

---

## 📊 テストカバレッジ

全ツール共通で**18の文法パターン**をテスト:

### 基本パターン (1-12)
J_2020_4.txt の実際の文から抽出:
1. 句動詞: `I wake up at seven every morning.`
2. 接続詞: `First, I brush my teeth and wash my face.`
3. 前置詞句: `Then I eat breakfast with my family.`
4. 通常文: `I usually have toast and juice.`
5. 文頭前置詞句: `After breakfast, I get my bag ready.`
6. 複合文: `I check homework and put books inside.`
7. 複数前置詞句: `Finally, I walk to school with friends.`
8. 固有名詞: `In our city, we have a good zoo, Smile Zoo.`
9. 句動詞: `We can give food to them.`
10. 時間表現: `It will start at eleven in the morning, and we can enjoy it for thirty minutes.`
11. 慣用句: `Right, but I can't join Night Safari because I have to go home by six.`
12. 数詞表現: `We are fifteen years old. So, if we do that, our entrance fee will be three dollars per person.`

### 拡張パターン (13-18)
追加の文法構造:
13. 関係代名詞: `This is the book that I bought yesterday.`
14. 受動態: `English is spoken by many people in the world.`
15. to不定詞: `I want to visit Tokyo to see my friend.`
16. 比較級: `This book is more interesting than that one.`
17. 疑問詞+to: `I don't know how to use this machine.`
18. 現在完了: `I have lived in Tokyo for five years.`

**全テスト合格率**: 18/18 (100%)

---

## 🔧 技術詳細

### アルゴリズム: 語句分割の7段階処理

```typescript
1. イディオム保護      → "in front of", "have to"
2. 時間表現保護        → "at seven", "every morning"
3. 受動態byフレーズ保護 → "by many people"
4. 数詞表現保護        → "fifteen years old"
5. 句動詞保護         → "wake up", "want to"
6. 前置詞句保護        → "to school" (個別に)
7. トークン分割+整形   → "+" プレフィックス付加
```

**キーテクニック**:
- `|||マーカー|||` で保護対象をマーク
- `__PROTECTED_n__` で一時退避（前置詞処理時の干渉防止）
- 正規表現の先読みで境界を正確に検出
- 最長一致ソートで複合熟語を優先処理

### データフロー

```
原文テキスト
    ↓
generateSplitData.ts (文単位に分割)
    ↓
├─ vocabularySplitLogic.ts → "+ I / + wake up / ..."
├─ slashSplitLogic.ts      → "I wake up / at seven / ..."
└─ parenSplitLogic.ts      → "I wake up <at seven> ..."
    ↓
JSON出力 (3形式統合)
    ↓
ウェブアプリで読み込み・表示
```

---

## 📚 関連ドキュメント

- **詳細実装ガイド**: `docs/development/vocabulary-tab-split-implementation.md`
- **ツール使用方法**: `src/utils/README.md`
- **テストスクリプト**: 
  - `src/utils/testVocabularySplit.ts`
  - `src/utils/testSlashSplit.ts`
  - `src/utils/testParenSplit.ts`

---

## 🚀 クイックスタート

```bash
# 1. 全テスト実行（動作確認）
npm run test:splits

# 2. サンプルデータ生成
npm run generate:split-data -- public/data/passages-original/J_2020_4.txt

# 3. 生成されたJSONを確認
cat public/data/passages-processed/J_2020_4_processed.json | jq '.[0]'

# 4. 全教材を一括生成
npm run generate:split-data
```

---

## 🔄 メンテナンス

### 新しい熟語・句動詞を追加

1. **対象ファイルを開く**: `src/utils/vocabularySplitLogic.ts`
2. **配列に追加**:
   ```typescript
   const phrasal_verbs = [
     'wake up', 
     'get up',
     'your_new_phrase'  // ← ここに追加
   ];
   ```
3. **テスト実行**: `npm run test:vocab-split`
4. **全データ再生成**: `npm run generate:split-data`

### トラブルシューティング

**問題**: 特定の表現が正しく分割されない

**解決手順**:
1. テストケースに追加
2. 期待する出力を定義
3. ロジックを修正
4. テストが通るまで繰り返し

**よくある問題**:
- Q: `by many people`が分割される
  - A: `passiveByPhrases`配列に追加
- Q: `to see`が保護される
  - A: ステージ6で`to + 動詞`を除外
- Q: 前置詞句が長すぎる
  - A: 正規表現の先読みに前置詞を追加

---

## 📈 今後の拡張可能性

- [ ] 比較級の`as...as`構文対応
- [ ] 関係代名詞`which`, `who`対応
- [ ] 仮定法過去対応
- [ ] 複雑な接続詞対応（`not only...but also`等）
- [ ] 音声データとの同期マーキング
- [ ] 文法タグの自動付与

---

**作成日**: 2026年1月10日  
**最終更新**: 2026年1月10日  
**メンテナー**: プロジェクトチーム
