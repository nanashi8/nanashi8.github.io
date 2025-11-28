# GPT-5 mini 生成プロンプト設計（文法問題）

本書は、学年別・形式別の文法問題（verbForm / fillInBlank / sentenceOrdering）を高品質に自動生成するためのプロンプト雛形と出力契約を定義します。最終目的は `public/data/*-gradeN.json` の各ユニットを各形式20問で標準化することです。

## 共通方針
- 出力は厳密な JSON（UTF-8, 無BOM, コメント無し）。
- 各項目で `choices` に `correctAnswer` を必ず含める（verbForm / fillInBlank）。
- 日本語文（`japanese`）の重複を避ける。意味が同一になる言い換えも極力回避。
- 難易度（`difficulty`）は `beginner` / `intermediate` / `advanced` のバランス配分（例: 10/6/4）。
- 文法ポイントや語数（sentenceOrderingの `grammarPoint` / `wordCount`）は一貫性を保つ。
- 出題英文は中学範囲内の自然な表現に限定（和訳→直訳臭を避ける）。

## JSON スキーマ（簡易）
- verbForm
  - id, japanese, sentence, verb, choices[4], correctAnswer, difficulty, explanation, hint
- fillInBlank
  - id, japanese, sentence, choices[4], correctAnswer, difficulty, explanation, hint
- sentenceOrdering
  - id, japanese, words[2..15], correctOrder, difficulty, grammarPoint, wordCount, hint

## ID 命名規則
- Grade 3: `g3-u{UNIT}-{TYPE}-{NNN}`（TYPE: `vf`/`fb`/`so`）
- 例: `g3-u4-vf-012`, `g3-u4-fb-005`, `g3-u4-so-019`

---

## システムメッセージ（共通）
あなたは日本の中学英語の指導要領に準拠した英語教材クリエイターです。以下の制約で問題を作成してください:
- 出力は厳密なJSONのみ。
- 日本語訳は自然で簡潔に。
- 文法機能のカバレッジを意識し、重複を避ける。
- 各問題の説明 `explanation` と `hint` は短く実用的に。

## ユニット文脈プロンプト（例）
- grade: 3
- unit: Unit 4
- title: 分詞の形容詞的用法
- grammar focus: 現在分詞/過去分詞の形容詞的用法（限定/叙述）
- target count: 20

---

## 出力契約（verbForm）
返答は次のキーを持つオブジェクトのみ:
- key: `items`
- value: 配列（長さ=target count）
配列要素の型:
```
{
  "id": "g3-u{UNIT}-vf-{NNN}",
  "japanese": "…",
  "sentence": "The book ____ written in 1990.",
  "verb": "be|modal|…",
  "choices": ["is", "are", "was", "were"],
  "correctAnswer": "was",
  "difficulty": "beginner|intermediate|advanced",
  "explanation": "…",
  "hint": "…"
}
```

### Few-shot（verbForm, 抜粋）
```
{"id":"g3-u1-vf-010","japanese":"この問題は簡単に解かれます","sentence":"This problem ____ solved easily.","verb":"modal","choices":["can be","is","was","has been"],"correctAnswer":"can be","difficulty":"intermediate","explanation":"可能受動: can be + p.p.","hint":"can be + p.p."}
```

---

## 出力契約（fillInBlank）
```
{
  "id": "g3-u{UNIT}-fb-{NNN}",
  "japanese": "…",
  "sentence": "Paper is made ____ wood.",
  "choices": ["from", "of", "by", "with"],
  "correctAnswer": "from",
  "difficulty": "beginner|intermediate|advanced",
  "explanation": "…",
  "hint": "…"
}
```

### Few-shot（fillInBlank, 抜粋）
```
{"id":"g3-u1-fb-003","japanese":"紙は木から作られます","sentence":"Paper is made ____ wood.","choices":["from","of","by","with"],"correctAnswer":"from","difficulty":"intermediate","explanation":"性質が変化 → from。","hint":"be made from"}
```

---

## 出力契約（sentenceOrdering）
```
{
  "id": "g3-u{UNIT}-so-{NNN}",
  "japanese": "…",
  "words": ["The","room","was","cleaned","yesterday"],
  "correctOrder": "The room was cleaned yesterday",
  "difficulty": "beginner|intermediate|advanced",
  "grammarPoint": "…",
  "wordCount": 5,
  "hint": "…"
}
```

### Few-shot（sentenceOrdering, 抜粋）
```
{"id":"g3-u1-so-003","japanese":"この部屋は今掃除されているところだ","words":["This","room","is","being","cleaned","now","."],"difficulty":"intermediate","grammarPoint":"進行形受動","wordCount":7,"hint":"is being + p.p.","correctOrder":"This room is being cleaned now ."}
```

---

## ガードレール
- 禁止: 固有名詞の過度使用、専門外の語彙、和文英訳の直訳癖。
- 必須: 主語と動詞の一致、時制整合、選択肢の一意正解、語順の自然さ。
- バランス: 文型・前置詞句・時表現・受動/能動・助動詞の多様性。

## 評価観点（自動チェック連携）
- スキーマ整合（バリデータv2）。
- `totalQuestions` の整合（保存時に再計算）。
- 日本語重複/英文重複の検出（ユニット内）。
- sentenceOrdering の `wordCount` と `words` 長さ一致。
