---
description: 文法問題データ作成時の品質保証とバリデーションルール
applyTo: 'public/data/grammar/**/*.json,public/data/*-questions-grade*.json,public/data/sentence-ordering-grade*.json'
---

# 文法問題データ作成の必須ルール

## 🚨 重要: エラー許容度ゼロ

文法問題データに誤りは一切認められません。すべての問題は自動検証を通過する必要があります。

## 必須検証項目

### 1. 不定詞問題の検証

問題文が `To ___` で始まる場合、正解と選択肢には動詞原形のみを使用:

```json
// ❌ NG: 既に"To"があるのに"to tell"は重複
{"sentence": "To ____ a lie is bad.", "correctAnswer": "to tell"}

// ✅ OK: 動詞原形のみ
{"sentence": "To ____ a lie is bad.", "correctAnswer": "tell"}
```

### 2. be動詞過去形の主語一致

- `I, He, She, It` → `was`
- `You, We, They` → `were`

```json
// ❌ NG: 主語Iに対してwereは誤り
{"sentence": "I ____ late.", "correctAnswer": "were"}

// ✅ OK: 主語Iにはwas
{"sentence": "I ____ late.", "correctAnswer": "was"}
```

### 3. 日本語訳は必ず英文の翻訳

```json
// ❌ NG: 文法用語は不可
{"japanese": "be動詞過去形(I)"}

// ✅ OK: 英文の翻訳
{"japanese": "私は遅れました"}
```

禁止パターン:
- `be動詞過去形(主語)`
- `不定詞(動詞)`
- その他文法用語で始まるもの

### 4. 選択肢に正解を含める

```json
// ❌ NG: 正解が選択肢にない
{"choices": ["was", "were"], "correctAnswer": "am"}

// ✅ OK: 正解が選択肢に含まれる
{"choices": ["was", "were", "am"], "correctAnswer": "was"}
```

### 5. 選択肢の品質保証

**最重要ルール**: 正解が1つなら、他の選択肢は明確に誤りでなければなりません。

```json
// ❌ NG: 説明で「thatでもwhichでも良い」と言いながら選択肢に両方ある
{
  "choices": ["that", "which", "who"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞。thatでもwhichでも良い。"
}

// ✅ OK: 正解が1つで、他は明確に誤り
{
  "choices": ["that", "who", "where"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞はthat。whoは人、whereは場所。"
}

// ✅ OK: 複数正解を認めるなら選択肢から除外
{
  "choices": ["that", "who", "where"],
  "correctAnswer": "that",
  "explanation": "物を指す関係代名詞。"
}
```

**禁止パターン**:
- 説明で「どちらでも良い」「両方正しい」と言いながら、その両方を選択肢に含める
- 選択肢に文法的に正しい複数の答えがある状態

### 6. 重複パターンの禁止

```json
// ❌ NG: "To to"は重複エラー
{"sentence": "To to tell a lie is bad."}

// ✅ OK: 重複なし
{"sentence": "To tell a lie is bad."}
```

## 作成時の必須フロー

1. 問題を作成
2. **選択肢の品質確認**（問題・選択肢・正解をセットで確認）
3. 自己チェック（上記ルール1-6を確認）
4. 検証スクリプト実行: `cd nanashi8.github.io && python3 scripts/validate_all_content.py --type grammar`
5. エラーがなくなるまで修正とリトライ
6. すべてのチェックを通過してからコミット

## 検証の自動化

- **pre-commit**: コミット時に自動検証
- **GitHub Actions**: PR時とpush時に自動検証
- **手動実行**: `python3 scripts/validate_all_content.py --type grammar`

## 関連ドキュメント

- 詳細ガイド: `docs/guidelines/GRAMMAR_QUESTION_VALIDATION.md`
- AI作成指示: `docs/guidelines/AI_GRAMMAR_QUESTION_CREATION.md`
- 品質システム: `docs/quality/QUALITY_SYSTEM.md`
- 検証スクリプト: `scripts/validate_all_content.py`

## 禁止事項

- ✗ 検証なしでコミット
- ✗ エラーがある状態でpush
- ✗ 文法用語を日本語訳として使用
- ✗ 主語とbe動詞の不一致
- ✗ 不定詞問題での"to"の重複
- ✗ 選択肢の品質を確認せずに作成
- ✗ 「どちらでも良い」と言いながら両方を選択肢に含める
- ✗ 問題・選択肢・正解をセットで確認しない
