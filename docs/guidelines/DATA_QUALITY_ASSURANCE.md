---
title: データ品質保証ガイドライン
created: 2025-12-07
updated: 2025-12-10
status: in-progress
tags: [guideline]
---

# データ品質保証ガイドライン

## 概要

このドキュメントは、語彙データの品質を保証するためのガイドラインとチェックリストです。

## データ品質チェックの実行方法

### 自動チェック

```bash
# すべてのデータファイルをチェック
cd nanashi8.github.io
bash scripts/check-data-quality.sh
```

レポートは `scripts/output/data-quality-report.txt` に保存されます。

### CI/CD統合

pre-commitフックにデータ品質チェックを追加できます：

```bash
# .husky/pre-commit に追加
npm run check:data-quality
```

## チェック項目

### 1. IPA発音記号（reading フィールド）

#### ✅ 正しい例

```json
{
  "word": "call",
  "reading": "kɔːl"
}
```

#### ❌ 間違った例

```json
{
  "word": "bacon",
  "reading": "bacon"  // ❌ 英単語がそのまま
}

{
  "word": "me",
  "reading": "Me"  // ❌ 大文字が含まれる
}
```

#### 修正方法

- IPA記号の正しい変換を使用: https://tophonetics.com/
- 大文字を使用しない
- 有効なIPA記号のみ使用: ɑæəɛɪʊʌaeiouɔːˈˌθðʃʒŋtdkgpbfvszmnlrjwhʔ

### 2. カタカナ発音

#### ✅ 正しい例

```json
{
  "word": "apple",
  "katakana": "(アップル)"
}
```

#### ❌ 間違った例

```json
{
  "word": "apple",
  "katakana": "(Apple)" // ❌ 英語が混入
}
```

#### 修正方法

- 必ずカタカナで記述
- 英語を混入させない
- カッコ内に記述: (カタカナ)

### 3. 意味（meaning フィールド）

#### ✅ 正しい例

```json
{
  "word": "call",
  "meaning": "〜を呼ぶ"
}

{
  "word": "me",
  "meaning": "私を・私に"
}
```

#### ❌ 間違った例

```json
{
  "word": "call",
  "meaning": "call"  // ❌ 英語のまま
}

{
  "word": "me",
  "meaning": "me"  // ❌ 英語のまま
}
```

#### 修正方法

- 必ず日本語訳を記述
- 文法的役割を明記（〜を、〜に、等）
- 複数の意味がある場合は主要な意味を記述

### 4. 必須フィールド

すべての語彙エントリに以下のフィールドが必須：

```json
{
  "word": "必須",
  "meaning": "必須",
  "reading": "推奨",
  "lemma": "推奨",
  "etymology": "オプション",
  "relatedWords": "オプション",
  "relatedFields": "推奨",
  "difficulty": "推奨"
}
```

## データ作成前のチェックリスト

### 新規データ作成時

- [ ] すべての英単語に正しい日本語訳がある
- [ ] IPA発音記号が正確である（大文字なし）
- [ ] カタカナ発音が正確である（英語混入なし）
- [ ] 必須フィールドがすべて入力されている
- [ ] 難易度が適切に設定されている
- [ ] 関連分野が適切に設定されている

### データ修正時

- [ ] 修正前にバックアップを作成
- [ ] データ品質チェックを実行
- [ ] エラー・警告がゼロになるまで修正
- [ ] 専門家レビュー（可能な場合）

### コミット前

- [ ] `bash scripts/check-data-quality.sh` を実行
- [ ] すべてのエラーを修正
- [ ] レポートを確認

## エラー修正の優先順位

### 優先度: 高（即時修正が必要）

1. **IPA_UPPERCASE**: IPA発音に大文字が含まれる
1. **IPA_INVALID_CHARS**: IPA発音に無効な文字が含まれる
1. **MEANING_ENGLISH_ONLY**: 意味フィールドに英語のみが記述されている
1. **KATAKANA_ENGLISH_MIXED**: カタカナ発音に英語が混入
1. **MISSING_REQUIRED_FIELD**: 必須フィールドの欠損

### 優先度: 中（できるだけ早く修正）

1. **IPA_SAME_AS_WORD**: IPA発音が単語と同じ
1. **MEANING_NO_JAPANESE**: 意味フィールドに日本語が含まれない
1. **KATAKANA_INVALID_CHARS**: カタカナ発音に不適切な文字

### 優先度: 低（時間があれば修正）

1. **MEANING_EMPTY**: 意味が空

## データ品質の自動修正

一部のエラーは自動修正スクリプトで対応可能です：

```bash
# 実装予定: 自動修正スクリプト
python3 scripts/auto-fix-data-quality.py
```

## レビュープロセス

### 内部レビュー

1. データ品質チェックスクリプトを実行
1. すべてのエラーを修正
1. サンプルデータを手動確認

### 外部レビュー（推奨）

大規模なデータ追加・修正時は専門家レビューを推奨：

1. 英語教育の専門家
1. ネイティブスピーカー
1. 辞書編集者

## よくある間違いと修正例

### 間違い1: 英単語がそのまま残っている

```json
// ❌ 間違い
{
  "word": "bacon",
  "reading": "bacon",
  "meaning": "bacon"
}

// ✅ 正しい
{
  "word": "bacon",
  "reading": "ˈbeɪkən",
  "meaning": "ベーコン"
}
```

### 間違い2: 大文字が混入

```json
// ❌ 間違い
{
  "word": "Call me",
  "reading": "Kɔːl Mi"
}

// ✅ 正しい
{
  "word": "call me",
  "reading": "kɔːl miː"
}
```

### 間違い3: カタカナに英語が混入

```json
// ❌ 間違い
{
  "word": "arts and crafts",
  "katakana": "(Arts And Crafts)"
}

// ✅ 正しい
{
  "word": "arts and crafts",
  "katakana": "(アーツ アンド クラフツ)"
}
```

## ツールとリソース

### IPA変換ツール

- https://tophonetics.com/ - 英語→IPA自動変換
- https://ipa-reader.xyz/ - IPA発音確認

### カタカナ変換ツール

- 手動で正確に変換（自動変換は避ける）

### 辞書リソース

- Cambridge Dictionary: https://dictionary.cambridge.org/
- Oxford Learner's Dictionary: https://www.oxfordlearnersdictionaries.com/

## まとめ

データ品質は学習効果に直結します。以下を徹底してください：

1. **作成前**: ガイドラインを確認
1. **作成中**: 正確なデータを入力
1. **作成後**: 品質チェックを実行
1. **コミット前**: すべてのエラーを修正

**品質第一、スピード第二**を心がけてください。
