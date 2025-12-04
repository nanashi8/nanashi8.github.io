# 21. 読解長文データセット仕様書

## 📚 概要

中学レベルの長文読解教材データセットです。段落を節・句に分割し、各単語の意味情報を付与しています。未知語マーキングと段階的和訳表示に対応した構造です。

---

## 🎯 データ仕様

### 1. ファイル形式

- **フォーマット**: JSON
- **エンコーディング**: UTF-8
- **ファイル**: `public/data/passages.json`

### 2. データ構造

```json
{
  "id": "passage-001",
  "title": "Modern Technology",
  "level": "中級",
  "theme": "科学技術",
  "targetWordCount": 150,
  "actualWordCount": 148,
  "translation": "現代の技術は...",
  "phrases": [
    {
      "phraseMeaning": "現代の技術は",
      "segments": [
        { "word": "Modern", "meaning": "現代の", "isUnknown": false },
        { "word": "technology", "meaning": "技術", "isUnknown": false }
      ]
    }
  ]
}
```

### 3. テーマ

- 科学技術
- 環境問題
- 日常生活
- 文化・歴史
- スポーツ

### 4. 難易度

- 初級: 80-100語
- 中級: 120-150語
- 上級: 180-200語

---

## 📚 関連ドキュメント

- [04. 長文読解機能](./04-reading-comprehension.md) - 機能詳細
- [19. 中学語彙データセット](./19-junior-high-vocabulary.md)
