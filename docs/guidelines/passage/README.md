# Passage - 長文読解パッセージガイドライン

**Diátaxis分類**: How-to（作成手順） + Reference（品質基準）  
**目的**: 高品質な長文読解パッセージの作成・管理

---

## 📋 ファイル一覧

### 📝 パッセージ作成ガイド

- **[PASSAGE_CREATION_GUIDELINES.md](PASSAGE_CREATION_GUIDELINES.md)** ⭐ - パッセージ作成ガイドライン
  - 段階的追加計画
  - 作成手順とベストプラクティス

- [PASSAGE_QUICKSTART.md](PASSAGE_QUICKSTART.md) - クイックスタートガイド

---

### 🔧 データ作成

- [PASSAGE_PHRASE_JSON_CREATION_GUIDE.md](PASSAGE_PHRASE_JSON_CREATION_GUIDE.md) - Phrase JSON作成ガイド
  - パッセージ内の重要表現の構造化

---

### 📊 品質管理

- **[PASSAGE_QUALITY_GUIDE.md](PASSAGE_QUALITY_GUIDE.md)** - パッセージ品質ガイド
  - 品質基準と検証手順
  - 読みやすさの評価

- [PASSAGE_SOURCE_CORRECTION_REPORT.md](PASSAGE_SOURCE_CORRECTION_REPORT.md) - ソース修正レポート

---

## 🎯 パッセージ作成の原則

### 1. 段階的追加
- Easy → Medium → Hard の順に追加
- 各レベルで品質を確保

### 2. 読みやすさ重視
- 適切な難易度
- 明確な構造
- 教育的価値

### 3. 関連表現の抽出
- パッセージ内の重要表現をPhrase JSONとして構造化
- 学習効率の向上

---

## 📌 品質チェックポイント

### ✅ 必須確認事項

- [ ] 難易度が適切（Easy/Medium/Hard）
- [ ] 文法・語彙が学習者レベルに合致
- [ ] 文章構造が明確
- [ ] 関連表現が適切に抽出されている
- [ ] メタデータ（source, topic等）が正確

---

## 🔗 関連ドキュメント

### 仕様書
- [../../specifications/21-reading-passages.md](../../specifications/21-reading-passages.md) - 長文読解パッセージ仕様

### スクリプト
- [../../../scripts/README.md](../../../scripts/README.md) - パッセージ生成スクリプト
  - `generate_reading_passages.py`
  - `auto_generate_phrase_from_passages.py`

### データ
- `public/data/reading/*.json` - パッセージデータ
- `public/data/phrase/*.json` - 関連表現データ

---

**最終更新**: 2025-12-19
