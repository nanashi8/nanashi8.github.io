# 文法問題データ作成ガイドライン

## 概要

このガイドラインは、NEW HORIZON文法問題データを作成する際の品質基準と検証プロセスを定義します。
**誤りは一切認められません。** すべての問題は厳密な検証を通過する必要があります。

## 必須検証項目

### 1. 問題文と正解の整合性

#### 不定詞問題
- ❌ **間違い**: `"sentence": "To ____ a lie is bad."` + `"correctAnswer": "to tell"`
- ✅ **正しい**: `"sentence": "To ____ a lie is bad."` + `"correctAnswer": "tell"`

**ルール**: 問題文に既に`To`がある場合、空欄には動詞原形のみが入ります。

#### be動詞過去形問題
- ❌ **間違い**: `"sentence": "I ____ late."` + `"correctAnswer": "were"`
- ✅ **正しい**: `"sentence": "I ____ late."` + `"correctAnswer": "was"`

**ルール**: 主語とbe動詞の組み合わせ
- `I, He, She, It` → `was`
- `You, We, They` → `were`

### 2. 日本語訳の品質

#### 文法用語ではなく翻訳を記載
- ❌ **間違い**: `"japanese": "be動詞過去形(I)"`
- ✅ **正しい**: `"japanese": "私は遅れました"`

**ルール**: `japanese`フィールドには必ず英文の日本語訳を記載してください。文法用語や説明ではありません。

### 3. 選択肢と正解の整合性

- ❌ **間違い**: `"choices": ["was", "were"]` + `"correctAnswer": "am"`
- ✅ **正しい**: `"choices": ["was", "were", "am"]` + `"correctAnswer": "was"`

**ルール**: 正解は必ず選択肢に含まれている必要があります。

### 4. 選択肢の品質保証

**最重要ルール**: 正解が1つなら、他の2つの選択肢は明確に誤りでなければなりません。

#### 問題のあるパターン

```json
// ❌ 間違い: 説明で「どちらでも良い」と言いながら両方が選択肢にある
{
  "sentence": "The book ____ I bought yesterday is interesting.",
  "choices": ["that", "which", "who"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞。thatでもwhichでも良い。"
}
```

**問題点**: 
- 説明で「thatでもwhichでも良い」と言っている
- しかし選択肢に両方含まれている
- whichを選ぶと不正解になる
- これは学習者を混乱させる

#### 正しいパターン

```json
// ✅ 正しい: 選択肢は明確に1つだけ正解
{
  "sentence": "The book ____ I bought yesterday is interesting.",
  "choices": ["that", "who", "where"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞はthat。whoは人、whereは場所を指す。"
}
```

```json
// ✅ 正しい: 「どちらでも良い」なら選択肢から除外
{
  "sentence": "The book ____ I bought yesterday is interesting.",
  "choices": ["that", "who", "where"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞。"
}
```

**禁止される説明パターン**:
- 「どちらでも良い」「どちらも正しい」
- 「both are correct」「either is fine」
- 「両方可能」「AでもBでも構わない」

これらの表現を使う場合、選択肢には1つしか含めないこと。

### 5. 重複パターンの回避

#### 二重不定詞
- ❌ **間違い**: `"sentence": "To to tell a lie is bad."`
- ✅ **正しい**: `"sentence": "To tell a lie is bad."`

**ルール**: `To to`、`the the`、`is is`などの重複パターンは文法エラーです。

### 5. sentenceOrdering問題の検証

- `words`配列の要素数と`correctAnswer`の単語数が一致すること
- `words`配列から`correctAnswer`を構成できること
- `wordCount`フィールドが実際の単語数と一致すること

```json
{
  "words": ["To", "tell", "a", "lie", "is", "bad."],
  "correctAnswer": "To tell a lie is bad.",
  "wordCount": 6
}
```

## データ構造の必須フィールド

### fillInBlank / verbForm問題

```json
{
  "id": "vf-g3-u4-001",
  "type": "verbForm",
  "japanese": "私は毎日英語を勉強します",
  "sentence": "I ____ English every day.",
  "choices": ["study", "studies", "studied"],
  "correctAnswer": "study",
  "difficulty": "beginner",
  "explanation": "主語がIなので動詞は原形。",
  "grammarPoint": "一般動詞現在形",
  "hint": "I → 原形"
}
```

### sentenceOrdering問題

```json
{
  "id": "so-g3-u4-001",
  "type": "sentenceOrdering",
  "japanese": "私は本を読むのが好きです",
  "words": ["I", "like", "to", "read", "books."],
  "correctAnswer": "I like to read books.",
  "wordCount": 5,
  "difficulty": "beginner",
  "grammarPoint": "不定詞",
  "hint": "不定詞は to + 動詞原形"
}
```

## 検証プロセス

### 1. 作成時の自己チェック

問題を作成したら、以下を確認してください:

1. [ ] 問題文の空欄位置と正解が文法的に正しいか
1. [ ] 日本語訳が英文の翻訳になっているか(文法用語ではないか)
1. [ ] 選択肢に正解が含まれているか
1. [ ] **選択肢の品質**: 正解が1つなら、他の2つは明確に誤りか
1. [ ] **説明と選択肢の整合性**: 「どちらでも良い」と言いながら両方を選択肢に含めていないか
1. [ ] 重複パターン(To to等)がないか
1. [ ] 主語とbe動詞の組み合わせが正しいか

### 2. スクリプトによる自動検証

```bash
# すべての文法問題を検証
python3 scripts/validate_grammar_questions.py

# 特定のファイルのみ検証
python3 scripts/validate_grammar_questions.py public/data/grammar/grammar_grade3_unit4.json
```

### 3. pre-commit検証

gitコミット時に自動的に検証が実行されます:

```bash
# pre-commitフックのインストール
pip install pre-commit
pre-commit install

# 手動実行
pre-commit run --all-files
```

### 4. CI/CD検証

GitHub Actionsにより、プルリクエスト時とmainブランチへのプッシュ時に自動検証されます。

## よくある間違いと修正方法

### 間違い1: 不定詞問題で"to"が二重になる

```json
// ❌ 間違い
{
  "sentence": "To ____ a lie is bad.",
  "choices": ["to tell", "telling", "telled"],
  "correctAnswer": "to tell"
}

// ✅ 正しい
{
  "sentence": "To ____ a lie is bad.",
  "choices": ["tell", "telling", "told"],
  "correctAnswer": "tell"
}
```

### 間違い2: 日本語訳が文法用語になっている

```json
// ❌ 間違い
{
  "japanese": "be動詞過去形(I)",
  "sentence": "I ____ excited yesterday."
}

// ✅ 正しい
{
  "japanese": "私は昨日興奮していました",
  "sentence": "I ____ excited yesterday."
}
```

### 間違い3: 主語とbe動詞が不一致

```json
// ❌ 間違い
{
  "sentence": "I ____ happy.",
  "correctAnswer": "were"
}

// ✅ 正しい
{
  "sentence": "I ____ happy.",
  "correctAnswer": "was"
}
```

### 間違い4: sentenceOrderingで単語が重複

```json
// ❌ 間違い
{
  "words": ["To", "to", "tell", "a", "lie", "is", "bad."],
  "correctAnswer": "To to tell a lie is bad.",
  "wordCount": 7
}

// ✅ 正しい
{
  "words": ["To", "tell", "a", "lie", "is", "bad."],
  "correctAnswer": "To tell a lie is bad.",
  "wordCount": 6
}
```

## エラー時の対応

検証スクリプトでエラーが検出された場合:

1. エラーメッセージを注意深く読む
1. 該当する問題のID、ファイル、行番号を確認
1. このガイドラインの該当セクションを参照
1. 問題を修正
1. 再度検証スクリプトを実行
1. すべてのエラーが解消されるまで繰り返す

## 品質基準

- **エラー許容度**: 0件(すべてのエラーを解消すること)
- **警告許容度**: 可能な限り0件(正当な理由がある場合のみ許容)
- **レビュー要件**: すべての新規問題は検証スクリプトを通過すること

## 関連ファイル

- 検証スクリプト: `scripts/validate_grammar_questions.py`
- pre-commit設定: `.pre-commit-config.yaml`
- GitHub Actions: `.github/workflows/validate-grammar.yml`
- AI生成指示: `docs/guidelines/AI_GRAMMAR_QUESTION_CREATION.md`
