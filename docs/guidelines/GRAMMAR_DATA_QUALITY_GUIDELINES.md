---
canonical: docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md
status: stable
lastUpdated: 2025-12-19
diataxisCategory: reference
references:
  - .aitk/instructions/grammar-data-quality.instructions.md
  - .github/PULL_REQUEST_TEMPLATE.md
  - scripts/README.md
  - docs/README.md
  - docs/quality/grammar_quality_report.md
dataPath: public/data/grammar/*.json
doNotMove: true
---

# 文法問題データ品質ガイドライン

## 概要

このガイドラインは、文法問題データ（`public/data/grammar/*.json`）の品質を保証するためのルールと手順を定義します。

## 🎯 核心原則

### 1. **問題文(japanese)は必ず英文の日本語訳であること**

❌ **禁止**: 文法用語を問題文として使用
- 「過去進行形she。」
- 「不規則動詞go。」
- 「一般動詞の疑問文（What）。」
- 「eを取る-ing。」
- 「複数形の変化（-es）。」

✅ **正解**: 英文の意味を表す日本語訳
- 「彼女はテレビを見ていました。」
- 「私は昨日東京へ行きました。」
- 「あなたは何が好きですか。」
- 「彼は手紙を書いています。」
- 「私は2つの箱を持っています。」

### 2. **文法用語は explanation フィールドで説明する**

```json
{
  "japanese": "彼女はテレビを見ていました。",  // ← 英文の訳
  "sentence": "She ____ watching TV.",
  "explanation": "過去進行形は was/were + -ing です。", // ← 文法用語はここで説明
  "correctAnswer": "was"
}
```

## 📋 検証項目チェックリスト

### A. 日本語訳の品質

- [ ] 問題文(japanese)に文法用語が含まれていない
- [ ] 英文(sentence)の意味と日本語訳が一致している
- [ ] 日本語訳が自然な日本語である
- [ ] 日本語訳が句点(。)で終わっている
- [ ] 敬体(です・ます調)で統一されている

#### 検出すべき文法用語パターン

**基本文法用語:**
- 過去進行形、過去形、現在進行形、未来形
- 不規則動詞、一般動詞、be動詞
- 助動詞、疑問詞、比較級、最上級
- 受動態、関係代名詞、複数形
- 三人称、否定文、疑問文、命令文

**変化ルール記述:**
- 「eを取る-ing」→「彼は書いています」
- 「子音を重ねる-ing」→「彼らは走っています」
- 「複数形の変化（-es）」→「私は2つの箱を持っています」

**プレースホルダー:**
- 「問題1。」「穴埋め1。」「並べ替え1。」
- 「〇〇の△△。」（例: bookの複数形。）
- 「〇〇を使う。」（例: 不規則複数形を使う。）

### B. 英文の品質

- [ ] プレースホルダー（"Example sentence"）が残っていない
- [ ] 文法的に正しい英文である
- [ ] 問題の意図が明確である

### C. 選択肢と正解の整合性

- [ ] 正解(correctAnswer)が選択肢(choices)に含まれている
- [ ] 選択肢が明確に区別できる（曖昧な選択肢がない）
- [ ] 不定詞問題で「To ___」形式の場合、選択肢は動詞原形のみ
- [ ] be動詞の主語と正解が一致している（I/He/She/It → was、You/We/They → were）

### D. 説明の品質

- [ ] explanation が敬体(です・ます調)である
- [ ] 文法ルールが正確に説明されている
- [ ] 「どちらでも良い」等の曖昧な表現がない（正解は1つに限定）

## 🔍 検証プロセス

### 1. 自動検証（必須）

**実行コマンド:**
```bash
python3 scripts/validate_grammar_advanced.py
```

**検証内容:**
- 文法用語の完全検出
- プレースホルダーの検出
- 選択肢と正解の整合性
- be動詞と主語の一致
- 不定詞問題のパターンチェック

### 2. 手動レビュー（推奨）

**チェック項目:**
1. 英文と日本語訳の意味が一致しているか
1. 日本語が自然で読みやすいか
1. 難易度設定が適切か
1. hint が適切か

### 3. Git コミット前チェック

**Pre-commit Hook を設定:**
```bash
#!/bin/sh
python3 scripts/validate_grammar_advanced.py
if [ $? -ne 0 ]; then
    echo "❌ 文法データの検証に失敗しました。エラーを修正してください。"
    exit 1
fi
```

## 🛠️ 修正プロセス

### 文法用語を見つけた場合

1. **英文を確認する**
   ```json
   "sentence": "She ____ watching TV."
   ```

1. **英文の意味を日本語訳にする**
   ```
   "She was watching TV." → "彼女はテレビを見ていました。"
   ```

1. **問題文を置き換える**
   ```json
   // Before
   "japanese": "過去進行形she。"
   
   // After
   "japanese": "彼女はテレビを見ていました。"
   ```

1. **文法説明は explanation に記載**
   ```json
   "explanation": "過去進行形は was/were + -ing です。主語がsheなのでwasです。"
   ```

### 一括修正が必要な場合

**Python スクリプトの使用:**
```python
import json
from pathlib import Path

# 修正対象をリスト化
fixes = {
    'grammar_grade1_unit9.json': [
        {'id': 'g1-u9-fib-001', 'old': '不規則動詞go。', 'new': '私は昨日東京へ行きました。'},
        # ... 他の修正
    ]
}

for filename, changes in fixes.items():
    filepath = Path('public/data/grammar') / filename
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for change in changes:
        for q in data['questions']:
            if q['id'] == change['id'] and q['japanese'] == change['old']:
                q['japanese'] = change['new']
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
```

## 📊 品質メトリクス

### 目標

- ✅ 文法用語検出率: 0件
- ✅ プレースホルダー残存: 0件
- ✅ 選択肢不整合: 0件
- ✅ バリデーション合格率: 100%

### 測定方法

```bash
# 文法用語の残存チェック
python3 scripts/validate_grammar_advanced.py

# 統計情報の取得
python3 scripts/analyze_grammar_data_quality.py
```

## 🚫 よくある間違い

### 1. 文法用語を問題文に使用

❌ 間違い:
```json
{
  "japanese": "過去進行形she。",
  "sentence": "She ____ watching TV.",
  "correctAnswer": "was"
}
```

✅ 正解:
```json
{
  "japanese": "彼女はテレビを見ていました。",
  "sentence": "She ____ watching TV.",
  "correctAnswer": "was",
  "explanation": "過去進行形は was/were + -ing です。"
}
```

### 2. 変化ルールを問題文に記載

❌ 間違い:
```json
{
  "japanese": "eを取る-ing。",
  "sentence": "He is ____ a letter.",
  "correctAnswer": "writing"
}
```

✅ 正解:
```json
{
  "japanese": "彼は手紙を書いています。",
  "sentence": "He is ____ a letter.",
  "correctAnswer": "writing",
  "explanation": "writeはeを取ってwritingです。"
}
```

### 3. プレースホルダーの放置

❌ 間違い:
```json
{
  "japanese": "問題1。",
  "sentence": "Example sentence with ____ blank.",
  "choices": ["choice1", "choice2", "choice3"]
}
```

✅ 正解:
```json
{
  "japanese": "私は本を読んでいます。",
  "sentence": "I am ____ a book.",
  "choices": ["reading", "read", "reads"]
}
```

## 🔄 継続的改善

### レビューサイクル

1. **毎週**: 新規追加データの検証
1. **毎月**: 既存データの品質監査
1. **四半期**: ガイドラインの見直しと更新

### フィードバックループ

1. ユーザーからの報告 → Issue 作成
1. パターン分析 → バリデーションルール追加
1. ガイドライン更新 → チーム共有

## 📚 参考資料

- [データスキーマ仕様](../specifications/GRAMMAR_DATA_SCHEMA.md)
- [バリデーションスクリプト](../../scripts/validate_grammar_advanced.py)
- [品質レポート](../quality/README.md)

## ✅ このガイドラインの遵守により

- ✨ ユーザーに自然な日本語で問題が表示される
- 🎯 学習者が文の意味を理解しやすくなる
- 🔍 文法用語による混乱を防ぐ
- 📈 データ品質が継続的に向上する
- 🚀 開発効率が向上する（バグの早期発見）

---

**最終更新**: 2025年12月9日  
**バージョン**: 1.0.0  
**作成者**: AI開発チーム
