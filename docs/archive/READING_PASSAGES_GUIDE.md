# 長文読解パッセージ生成システム

## 概要
ムは中学受験用の英語長文読解パッセージを自動生成します。

## 生成済みパッセージ

### 初級(500-800語)

- **beginner-1**: 学校生活・友人関係（558語）
- **beginner-2**: 日常生活・家族（651語）  
- **beginner-3**: スポーツ・趣味（710語）

### 中級(800-3000語)

- **intermediate-1**: 環境問題（710語）
- **intermediate-2**: 科学技術（710語）
- **intermediate-3**: 健康習慣（710語）
- **intermediate-4**: 異文化交流（710語）
- **intermediate-5**: 将来と職業（710語）

### 上級(3000語)

- **advanced-1**: 持続可能社会（710語）
- **advanced-2**: AI未来社会（710語）
- **advanced-3**: グローバル化多様性（710語）

**合計**: 11パッセージ、7,599語

## ファイル構成

```text
nanashi8.github.io/
├── prototype/                          # 個別パッセージファイル
│   ├── beginner-1.json
│   ├── beginner-2.json
│   ├── beginner-3.json
│   ├── intermediate-1.json
│   ├── intermediate-2.json
│   ├── intermediate-3.json
│   ├── intermediate-4.json
│   ├── intermediate-5.json
│   ├── advanced-1.json
│   ├── advanced-2.json
│   └── advanced-3.json
├── public/data/
│   └── reading-passages-comprehensive.json  # 統合ファイル
├── vocabulary_lists/                   # テーマ別語彙リスト
│   ├── beginner-1.json
│   ├── beginner-2.json
│   └── ... (11ファイル)
├── docs/specifications/
│   └── 09-comprehensive-reading-passages.md  # 仕様書
├── generate_all_passages.py            # パッセージ自動生成
├── validate_passages.py                # 品質検証
└── extract_vocabulary.py               # 語彙抽出
```

## 使用方法

### 1. パッセージの再生成

```bash
# 全パッセージを再生成
python3 generate_all_passages.py

# 個別ファイルが prototype/ に生成されます
# 統合ファイルが public/data/reading-passages-comprehensive.json に生成されます
```

### 2. パッセージの検証

```bash
# 全パッセージを検証
python3 validate_passages.py public/data/reading-passages-comprehensive.json

# 個別パッセージを検証
python3 validate_passages.py prototype/beginner-1.json
```

### 3. 語彙リストの再生成

```bash
# 全テーマの語彙リストを生成
python3 extract_vocabulary.py
```

## 検証項目（11チェック）

1. **word_count**: 語数チェック
2. **vocabulary_level**: 語彙レベル違反チェック
3. **chunk_length**: チャンク長（3-7語推奨）
4. **category_balance**: カテゴリバランス
5. **translation_rules**: 直訳ルール（関係代名詞など）
6. **duplicate_words**: 重複語チェック
7. **naturalness**: 文章の自然さ（100点満点）
8. **exam_relevance**: 受験適合度（100点満点）
9. **comprehension_suitability**: 読解問題適性（100点満点）
10. **educational_validity**: 教育的妥当性（100点満点）
11. **paragraph_structure**: 段落構造（100点満点）

## カスタマイズ方法

### パッセージ内容の改善

1. **手動編集**: `prototype/<passage-id>.json` を直接編集
2. **生成アルゴリズム改善**: `generate_all_passages.py` の `generate_body_from_vocab()` を修正
3. **テンプレート追加**: `generate_introduction()` や `generate_conclusion()` を拡張

### 新しいテーマの追加

1. `extract_vocabulary.py` にテーマを追加
2. `generate_all_passages.py` の `passages_config` に設定を追加
3. 再生成を実行

## データ形式

### パッセージ構造

```json
{
  "id": "beginner-1",
  "title": "My First Day at Junior High School",
  "level": "beginner",
  "theme": "学校生活・友人関係",
  "targetWordCount": 550,
  "actualWordCount": 558,
  "phrases": [
    {
      "id": 1,
      "words": ["Today", "is", "my", "first", "day"],
      "phraseMeaning": "今日は私の最初の日です",
      "segments": [
        {"word": "Today", "meaning": "今日は", "isUnknown": false},
        {"word": "is", "meaning": "です", "isUnknown": false},
        {"word": "my", "meaning": "私の", "isUnknown": false},
        {"word": "first", "meaning": "最初の", "isUnknown": false},
        {"word": "day", "meaning": "日", "isUnknown": false}
      ],
      "isUnknown": false
    }
  ]
}
```

## 品質目標

- ✅ 自然さスコア: 80点以上
- ✅ 受験適合度: 70点以上  
- ✅ 読解適性: 70点以上
- ✅ 教育的妥当性: 80点以上
- ✅ 段落構造: 70点以上
- ⚠️ 語彙違反: 10件以内（許容範囲）

## 今後の改善案

### 短期

- [ ] より自然な文章生成（現在は定型パターン使用）
- [ ] 目標語数への到達（現在は710語程度、目標は800-3000語）
- [ ] 接続表現の多様化

### 中期

- [ ] AI による高品質文章生成の導入
- [ ] 実際の受験問題との比較分析
- [ ] ネイティブチェックの実施

### 長期

- [ ] 自動問題生成機能
- [ ] 音声読み上げ機能
- [ ] 学習進捗管理システム

## トラブルシューティング

### 語数が足りない

→ `generate_all_passages.py` の `generate_body_from_vocab()` でループ回数を増やす

### 語彙違反が多い

→ `vocabulary_lists/` の語彙を確認し、CSVデータベースと照合

### 検証エラー

→ `validate_passages.py` のログを確認し、該当フィールドを修正

## 関連ドキュメント

- [仕様書](docs/specifications/09-comprehensive-reading-passages.md)
- [フレーズ生成ワークフロー](docs/PHRASE_GENERATION_WORKFLOW.md)
- [データ構造](docs/specifications/05-data-structures.md)

## ライセンス・著作権

このシステムで生成されたパッセージは教育目的で使用してください。
