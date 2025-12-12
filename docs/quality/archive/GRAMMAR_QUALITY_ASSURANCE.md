# 文法問題データ品質保証システム

## 概要

文法問題データの品質を保証するための包括的なシステムです。誤りは一切認められません。

## システム構成

### 1. 検証スクリプト

#### `scripts/validate_grammar_advanced.py`
高度な品質検証を実行します。

**検証項目**:
- 不定詞問題での「To ___」パターンと正解の整合性
- be動詞過去形問題の主語と正解の一致
- 日本語訳が文法用語ではなく翻訳であることの確認
- 選択肢と正解の整合性
- 重複パターン（To to等）の検出

**使用方法**:
```bash
python3 scripts/validate_grammar_advanced.py
```

### 2. 自動化

#### pre-commit フック (`.pre-commit-config.yaml`)
コミット時に自動的に検証を実行します。

**セットアップ**:
```bash
pip install pre-commit
pre-commit install
```

#### GitHub Actions (`.github/workflows/validate-grammar.yml`)
プルリクエストとmainブランチへのプッシュ時に自動検証を実行します。

### 3. ドキュメント

#### `docs/guidelines/GRAMMAR_QUESTION_VALIDATION.md`
詳細な品質基準と検証プロセスを定義します。

#### `docs/guidelines/AI_GRAMMAR_QUESTION_CREATION.md`
AI/人間がデータを作成する際の必須ルールを記載します。

#### `.aitk/instructions/grammar-question-validation.instructions.md`
AIツールに自動的に読み込まれる指示ファイルです。

## 使用フロー

### データ作成時

1. **問題を作成**
1. **自己チェック**（ガイドラインを参照）
1. **検証実行**:
   ```bash
   python3 scripts/validate_grammar_advanced.py
   ```
1. **エラー修正**（エラーがあれば）
1. **3-4を繰り返す**（エラーがなくなるまで）
1. **コミット**（pre-commitフックが自動実行）

### データ修正時

同様のフローで検証を通過させてください。

## 主要な検証ルール

### ❌ NG例と ✅ OK例

#### 1. 不定詞問題

```json
// ❌ NG: 既に"To"があるのに"to tell"
{
  "sentence": "To ____ a lie is bad.",
  "correctAnswer": "to tell"
}

// ✅ OK: 動詞原形のみ
{
  "sentence": "To ____ a lie is bad.",
  "correctAnswer": "tell"
}
```

#### 2. be動詞過去形

```json
// ❌ NG: 主語Iに対してwere
{
  "sentence": "I ____ late.",
  "correctAnswer": "were"
}

// ✅ OK: 主語Iにはwas
{
  "sentence": "I ____ late.",
  "correctAnswer": "was"
}
```

#### 3. 日本語訳

```json
// ❌ NG: 文法用語
{
  "japanese": "be動詞過去形(I)"
}

// ✅ OK: 英文の翻訳
{
  "japanese": "私は遅れました"
}
```

#### 4. 重複パターン

```json
// ❌ NG: "To to"は重複エラー
{
  "sentence": "To to tell a lie is bad."
}

// ✅ OK: 重複なし
{
  "sentence": "To tell a lie is bad."
}
```

## エラー時の対応

1. 検証スクリプトのエラーメッセージを確認
1. 該当する問題IDとファイルを特定
1. ガイドライン (`docs/guidelines/GRAMMAR_QUESTION_VALIDATION.md`) を参照
1. 問題を修正
1. 再度検証スクリプトを実行
1. エラーがなくなるまで繰り返す

## 禁止事項

- ✗ 検証スクリプトを通さずにコミット
- ✗ エラーがある状態でpush
- ✗ 文法用語を日本語訳として使用
- ✗ 主語とbe動詞の不一致
- ✗ 不定詞問題での"to"の重複
- ✗ pre-commitフックの無効化

## 関連ファイル

- `scripts/validate_grammar_advanced.py` - 高度検証スクリプト
- `scripts/validate_grammar_questions.py` - 基本検証スクリプト
- `scripts/fix_grammar_errors.py` - 自動修正スクリプト（参考用）
- `.pre-commit-config.yaml` - pre-commit設定
- `.github/workflows/validate-grammar.yml` - GitHub Actions設定
- `docs/guidelines/GRAMMAR_QUESTION_VALIDATION.md` - 詳細ガイドライン
- `docs/guidelines/AI_GRAMMAR_QUESTION_CREATION.md` - AI作成指示
- `.aitk/instructions/grammar-question-validation.instructions.md` - AI指示ファイル

## 品質基準

- **エラー許容度**: 0件（すべてのエラーを解消すること）
- **警告許容度**: 0件推奨
- **検証必須**: すべてのコミット前に検証スクリプトを通過すること

---

**重要**: このシステムは最高品質のデータを保証するために設計されています。すべてのルールに従ってください。
