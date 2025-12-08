# 文法問題データ作成時のAI指示

## 重要: データ品質は最優先事項

文法問題データの作成時は、以下のルールを**厳密に**遵守してください。
誤りは一切認められません。

## 必須検証ルール

### 1. 不定詞問題の検証

問題文が`To ___`で始まる場合:

```json
// ❌ 絶対にNG
{
  "sentence": "To ____ a lie is bad.",
  "choices": ["to tell", "telling", "telled"],
  "correctAnswer": "to tell"  // ← 既にToがあるのに"to tell"は誤り
}

// ✅ 正しい
{
  "sentence": "To ____ a lie is bad.",
  "choices": ["tell", "telling", "told"],
  "correctAnswer": "tell"  // ← 動詞原形のみ
}
```

**ルール**: 問題文に`To`がある場合、空欄には動詞原形のみ。`to`を含めてはいけません。

### 2. be動詞過去形の検証

主語とbe動詞の組み合わせを確認:

```json
// ❌ 絶対にNG
{
  "sentence": "I ____ late yesterday.",
  "correctAnswer": "were"  // ← Iにwereは誤り
}

// ✅ 正しい
{
  "sentence": "I ____ late yesterday.",
  "correctAnswer": "was"  // ← Iにはwas
}
```

**主語とbe動詞の対応表**:
- `I, He, She, It` → `was`
- `You, We, They` → `were`

### 3. 日本語訳は必ず英文の翻訳

```json
// ❌ 絶対にNG
{
  "japanese": "be動詞過去形(I)",  // ← 文法用語は不可
  "sentence": "I ____ excited yesterday."
}

// ✅ 正しい
{
  "japanese": "私は昨日興奮していました",  // ← 英文の翻訳
  "sentence": "I ____ excited yesterday."
}
```

**禁止パターン**:
- `be動詞過去形(主語)`
- `不定詞(動詞)`
- `現在完了(主語)`
- その他、文法用語で始まるもの

### 4. 選択肢に正解を含める

```json
// ❌ 絶対にNG
{
  "choices": ["was", "were"],
  "correctAnswer": "am"  // ← 選択肢にないものを正解にしてはいけない
}

// ✅ 正しい
{
  "choices": ["was", "were", "am"],
  "correctAnswer": "was"  // ← 選択肢に含まれている
}
```

### 5. 選択肢の品質保証（最重要）

**絶対ルール**: 正解が1つなら、他の2つの選択肢は明確に誤りでなければなりません。

```json
// ❌ 絶対にNG: 説明で「どちらでも良い」なのに選択肢に両方
{
  "sentence": "The book ____ I bought is good.",
  "choices": ["that", "which", "who"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞。thatでもwhichでも良い。"
  // ← whichを選ぶと不正解になるが、説明では「どちらでも良い」
}

// ✅ 正しい: 選択肢は1つだけ正解
{
  "sentence": "The book ____ I bought is good.",
  "choices": ["that", "who", "where"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞はthat。whoは人、whereは場所。"
  // ← 他の選択肢は明確に誤り
}
```

**問題・選択肢・正解は必ずセットで確認**:
1. 問題文を読む
2. 正解を確認
3. 他の選択肢が明確に誤りか確認
4. 説明文が選択肢と矛盾していないか確認

**禁止される説明表現**（選択肢に複数候補がある場合）:
- 「どちらでも良い」
- 「どちらも正しい」
- 「both are correct」
- 「AでもBでも構わない」

### 6. 重複パターンの禁止

```json
// ❌ 絶対にNG
{
  "sentence": "To to tell a lie is bad.",  // ← "To to"は重複
  "words": ["To", "to", "tell", "a", "lie", "is", "bad."]
}

// ✅ 正しい
{
  "sentence": "To tell a lie is bad.",
  "words": ["To", "tell", "a", "lie", "is", "bad."]
}
```

**禁止される重複**:
- `To to`
- `the the`
- `a a`
- `is is`
- `are are`

### 6. sentenceOrdering問題の整合性

```json
// ✅ 正しい
{
  "words": ["To", "tell", "a", "lie", "is", "bad."],
  "correctAnswer": "To tell a lie is bad.",
  "wordCount": 6  // ← 単語数が一致
}
```

**検証項目**:
- `words`配列の要素数 = `correctAnswer`の単語数
- `wordCount`フィールド = 実際の単語数
- `words`配列から`correctAnswer`が構成できること

## 作成フロー

1. **問題作成**
   - 文法ポイントを明確にする
   - 問題文を作成
   - 選択肢を作成
   - 正解を決定

2. **自己検証**
   - 上記のルール1-6をすべてチェック
   - 日本語訳が英文の翻訳であることを確認
   - 文法的に正しいことを確認

3. **スクリプト検証**
   ```bash
   python3 scripts/validate_grammar_questions.py
   ```

4. **修正とリトライ**
   - エラーがあれば修正
   - エラーがなくなるまで繰り返す

## チェックリスト

問題作成時に以下をすべて確認:

- [ ] 問題文と正解が文法的に整合している
- [ ] 不定詞問題で`To ___`パターンの場合、正解は動詞原形のみ
- [ ] be動詞問題で主語と正解が一致している
- [ ] 日本語訳が英文の翻訳である(文法用語ではない)
- [ ] 正解が選択肢に含まれている
- [ ] **選択肢の品質**: 正解が1つなら、他の2つは明確に誤り
- [ ] **説明と選択肢の整合性**: 「どちらでも良い」と言いながら両方を選択肢に含めていない
- [ ] 重複パターン(`To to`等)がない
- [ ] sentenceOrdering問題で`words`、`correctAnswer`、`wordCount`が整合している
- [ ] すべてのフィールドが正しく記載されている
- [ ] **問題・選択肢・正解をセットで手動確認した**

## エラー時の対応

検証スクリプトでエラーが出た場合:

1. エラーメッセージを確認
2. 該当する問題IDとファイルを特定
3. 上記のルールを再確認
4. 問題を修正
5. 再度検証スクリプトを実行

## 禁止事項

- 検証スクリプトを通さずにコミットすること
- エラーがある状態でプッシュすること
- ガイドラインに従わずに問題を作成すること
- 文法用語を日本語訳として使用すること
- 主語とbe動詞の不一致を放置すること
- 不定詞問題で`to`を二重に含めること
- **選択肢の品質を確認せずに作成すること**
- **「どちらでも良い」と言いながら両方を選択肢に含めること**
- **問題・選択肢・正解をセットで確認しないこと**

## 参考ドキュメント

- 詳細ガイドライン: `docs/guidelines/GRAMMAR_QUESTION_VALIDATION.md`
- 検証スクリプト: `scripts/validate_grammar_questions.py`
- GitHub Actions: `.github/workflows/validate-grammar.yml`
