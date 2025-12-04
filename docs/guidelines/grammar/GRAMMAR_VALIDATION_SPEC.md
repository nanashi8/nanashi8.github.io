# 文法問題検証仕様書

## 概要
文法問題データの品質を保証するための検証仕様とテストケース定義。

---

## 検証レベル

### Level 1: スキーマ検証（必須）
すべてのデータが正しい構造を持つことを保証

### Level 2: データ品質検証（必須）
データの内容が品質基準を満たすことを保証

### Level 3: クロスファイル検証（推奨）
複数ファイル間の整合性を保証

### Level 4: ビジネスロジック検証（任意）
教育的観点での品質を保証

---

## Level 1: スキーマ検証

### 1.1 必須フィールドの存在

**テストケース**: すべての問題が必須フィールドを持つ

```python
def test_required_fields_exist(question):
    """必須フィールドの存在チェック"""
    required_fields = [
        'id',
        'japanese', 
        'sentence',
        'verb',
        'choices',
        'correctAnswer',
        'difficulty',
        'explanation',
        'grammarPoint'
    ]
    
    for field in required_fields:
        assert field in question, f"Missing required field: {field}"
```

**期待値**:
- ✅ すべての問題が9つの必須フィールドを持つ
- ❌ 1つでも欠けている場合はエラー

### 1.2 フィールド型の検証

**テストケース**: フィールドが正しいデータ型を持つ

```python
def test_field_types(question):
    """フィールド型の検証"""
    assert isinstance(question['id'], str), "id must be string"
    assert isinstance(question['japanese'], str), "japanese must be string"
    assert isinstance(question['sentence'], str), "sentence must be string"
    assert isinstance(question['verb'], str), "verb must be string"
    assert isinstance(question['choices'], list), "choices must be array"
    assert isinstance(question['correctAnswer'], str), "correctAnswer must be string"
    assert isinstance(question['difficulty'], str), "difficulty must be string"
    assert isinstance(question['explanation'], str), "explanation must be string"
    assert isinstance(question['grammarPoint'], str), "grammarPoint must be string"
```

**期待値**:
- ✅ すべてのフィールドが指定された型である
- ❌ 型不一致の場合はエラー

### 1.3 ID形式の検証

**テストケース**: IDが正しい形式に従う

```python
def test_id_format(question, grade, unit, number):
    """ID形式の検証"""
    pattern = r'^(vf|fb|so)-g[1-3]-u[0-9]-\d{3}$'
    assert re.match(pattern, question['id']), f"Invalid ID format: {question['id']}"
    
    # 詳細検証
    expected_id = f"vf-g{grade}-u{unit}-{number:03d}"
    assert question['id'] == expected_id, f"ID mismatch: expected {expected_id}, got {question['id']}"
```

**期待値**:
- ✅ `vf-g1-u0-001` 形式
- ✅ `fb-g2-u5-020` 形式
- ✅ `so-g3-u9-015` 形式
- ❌ `vf-g1-u0-1` (3桁でない)
- ❌ `vf-g4-u0-001` (grade 4は存在しない)

### 1.4 選択肢数の検証

**テストケース**: 選択肢が正確に4つある

```python
def test_choices_count(question):
    """選択肢数の検証"""
    assert len(question['choices']) == 4, \
        f"Must have exactly 4 choices, got {len(question['choices'])}"
```

**期待値**:
- ✅ choices配列の長さが4
- ❌ 3つ以下または5つ以上

### 1.5 難易度の検証

**テストケース**: 難易度が許可された値である

```python
def test_difficulty_value(question):
    """難易度の検証"""
    allowed_difficulties = ['basic', 'intermediate', 'advanced']
    assert question['difficulty'] in allowed_difficulties, \
        f"Invalid difficulty: {question['difficulty']}"
```

**期待値**:
- ✅ `basic`, `intermediate`, `advanced` のいずれか
- ❌ その他の値

---

## Level 2: データ品質検証

### 2.1 非空フィールドの検証

**テストケース**: 必須フィールドが空でない

```python
def test_non_empty_fields(question):
    """非空フィールドの検証"""
    non_empty_fields = ['japanese', 'sentence', 'correctAnswer', 'explanation']
    
    for field in non_empty_fields:
        value = question[field]
        assert value is not None, f"{field} must not be None"
        assert str(value).strip() != '', f"{field} must not be empty"
```

**期待値**:
- ✅ すべてのフィールドに値が入っている
- ❌ 空文字列 `""`
- ❌ 空白のみ `"   "`
- ❌ `None` / `null`

### 2.2 英文の構造検証

**テストケース**: 英文が____を含む（verb-form, fill-in-blankの場合）

```python
def test_sentence_structure(question, question_type):
    """英文構造の検証"""
    if question_type in ['verb-form', 'fill-in-blank']:
        assert '____' in question['sentence'], \
            "Sentence must contain blank (____)"
        
        # 1つだけ____を含むことを確認
        blank_count = question['sentence'].count('____')
        assert blank_count == 1, \
            f"Sentence must contain exactly 1 blank, got {blank_count}"
```

**期待値**:
- ✅ `I ____ a student.` (1つの____)
- ❌ `I am a student.` (____がない)
- ❌ `I ____ a ____.` (____が2つ)

### 2.3 正解の存在検証

**テストケース**: 正解が選択肢に含まれる

```python
def test_correct_answer_in_choices(question):
    """正解の存在検証"""
    assert question['correctAnswer'] in question['choices'], \
        f"Correct answer '{question['correctAnswer']}' not in choices {question['choices']}"
```

**期待値**:
- ✅ correctAnswer="am", choices=["am", "is", "are", "be"]
- ❌ correctAnswer="was", choices=["am", "is", "are", "be"]

### 2.4 ユニーク性検証

**テストケース**: 英文が重複していない

```python
def test_sentence_uniqueness(all_questions):
    """ユニーク性検証"""
    from collections import Counter
    
    sentences = [q['sentence'] for q in all_questions]
    sentence_counts = Counter(sentences)
    duplicates = {s: count for s, count in sentence_counts.items() if count > 1}
    
    assert len(duplicates) == 0, \
        f"Found {len(duplicates)} duplicate sentences: {list(duplicates.keys())[:5]}"
```

**期待値**:
- ✅ すべての英文が異なる
- ❌ 同じ英文が2回以上登場

**許容範囲**:
- Grade全体で2問以下の重複は許容（99%品質）
- Unit内での重複は一切許容しない

### 2.5 日本語訳の品質検証

**テストケース**: 日本語訳が適切

```python
def test_japanese_quality(question):
    """日本語訳の品質検証"""
    japanese = question['japanese']
    
    # 長さチェック（極端に短いまたは長い訳は不適切）
    assert 2 <= len(japanese) <= 100, \
        f"Japanese translation length should be 2-100 chars, got {len(japanese)}"
    
    # 英語が混ざっていないかチェック（簡易版）
    assert not re.search(r'[a-zA-Z]{3,}', japanese), \
        "Japanese field should not contain English words"
```

**期待値**:
- ✅ `私は学生です`
- ✅ `彼は昨日忙しかったです`
- ❌ `I am a student` (英語のまま)
- ❌ `私` (短すぎる)

---

## Level 3: クロスファイル検証

### 3.1 ファイル間ID一貫性

**テストケース**: verb-form, fill-in-blank, sentence-orderingで同じIDの問題が対応している

```python
def test_cross_file_id_consistency(vf_question, fb_question, so_question):
    """ファイル間ID一貫性"""
    vf_id_base = vf_question['id'].replace('vf-', '')
    fb_id_base = fb_question['id'].replace('fb-', '')
    so_id_base = so_question['id'].replace('so-', '')
    
    assert vf_id_base == fb_id_base == so_id_base, \
        f"ID base mismatch: vf={vf_id_base}, fb={fb_id_base}, so={so_id_base}"
```

**期待値**:
- ✅ vf-g1-u0-001, fb-g1-u0-001, so-g1-u0-001
- ❌ vf-g1-u0-001, fb-g1-u0-002, so-g1-u0-001

### 3.2 ファイル間日本語一貫性

**テストケース**: 3ファイルで同じ日本語訳を使用

```python
def test_cross_file_japanese_consistency(vf_question, fb_question, so_question):
    """ファイル間日本語一貫性"""
    assert vf_question['japanese'] == fb_question['japanese'] == so_question['japanese'], \
        f"Japanese mismatch across files"
```

**期待値**:
- ✅ すべてのファイルで `私は学生です`
- ❌ vf: `私は学生です`, fb: `私は生徒です`

### 3.3 ファイル間問題数一致

**テストケース**: すべてのファイルが同じ問題数を持つ

```python
def test_cross_file_count_consistency(vf_data, fb_data, so_data):
    """ファイル間問題数一致"""
    vf_count = vf_data['totalQuestions']
    fb_count = fb_data['totalQuestions']
    so_count = so_data['totalQuestions']
    
    assert vf_count == fb_count == so_count, \
        f"Question count mismatch: vf={vf_count}, fb={fb_count}, so={so_count}"
```

**期待値**:
- ✅ すべて200問
- ❌ vf: 200, fb: 180, so: 200

---

## Level 4: ビジネスロジック検証

### 4.1 文法ポイント別問題数

**テストケース**: 各Unitに適切な問題数がある

```python
def test_questions_per_unit(unit):
    """Unit別問題数の検証"""
    expected_count = 20  # 各Unitで20問が標準
    actual_count = len(unit['verbForm'])
    
    assert actual_count == expected_count, \
        f"Unit should have {expected_count} questions, got {actual_count}"
```

**期待値**:
- ✅ 各Unit: 20問
- ❌ Unit 0: 15問, Unit 1: 25問

### 4.2 難易度分布の検証

**テストケース**: 適切な難易度分布

```python
def test_difficulty_distribution(grade_questions):
    """難易度分布の検証"""
    from collections import Counter
    
    difficulties = [q['difficulty'] for q in grade_questions]
    distribution = Counter(difficulties)
    
    # 中1: basicが多め、中3: advancedが多め
    if grade == 1:
        assert distribution['basic'] >= distribution['advanced']
    elif grade == 3:
        assert distribution['advanced'] >= distribution['basic']
```

**期待値**:
- Grade 1: basic優位
- Grade 2: intermediate中心
- Grade 3: advanced優位

### 4.3 語彙多様性の検証

**テストケース**: 同じ単語の過度な繰り返しを避ける

```python
def test_vocabulary_diversity(unit_questions):
    """語彙多様性の検証"""
    from collections import Counter
    
    # すべての単語を抽出
    all_words = []
    for q in unit_questions:
        words = q['sentence'].replace('____', '').split()
        all_words.extend(words)
    
    word_counts = Counter(all_words)
    
    # 同じ単語が5回以上登場しないこと（機能語は除く）
    common_words = {'I', 'you', 'he', 'she', 'it', 'we', 'they', 'a', 'an', 'the', 'is', 'am', 'are'}
    for word, count in word_counts.items():
        if word.lower() not in common_words:
            assert count <= 5, \
                f"Word '{word}' appears {count} times (max 5 allowed)"
```

**期待値**:
- ✅ `student` が3回登場
- ❌ `student` が8回登場

---

## 検証ツール実装

### 統合検証スクリプト

```python
#!/usr/bin/env python3
"""
grammar_validator.py - 文法問題の統合検証ツール
"""

import json
import sys
from pathlib import Path
from collections import Counter

class GrammarValidator:
    def __init__(self, file_path):
        self.file_path = Path(file_path)
        with open(file_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        self.errors = []
        self.warnings = []
    
    def validate_all(self):
        """すべての検証を実行"""
        print(f"Validating {self.file_path.name}...")
        
        # Level 1: スキーマ検証
        self.validate_schema()
        
        # Level 2: データ品質検証
        self.validate_data_quality()
        
        # Level 3: ユニーク性検証
        self.validate_uniqueness()
        
        # 結果レポート
        self.print_report()
        
        return len(self.errors) == 0
    
    def validate_schema(self):
        """Level 1: スキーマ検証"""
        required_fields = ['id', 'japanese', 'sentence', 'correctAnswer']
        
        for unit in self.data['units']:
            questions = unit.get('verbForm') or unit.get('fillInBlank') or unit.get('sentenceOrdering')
            
            for i, q in enumerate(questions):
                # 必須フィールド
                for field in required_fields:
                    if field not in q:
                        self.errors.append(f"{unit['unit']}-{i}: Missing field '{field}'")
                
                # 選択肢数
                if 'choices' in q and len(q['choices']) != 4:
                    self.errors.append(f"{q['id']}: Must have 4 choices")
                
                # 正解が選択肢に含まれる
                if 'choices' in q and q['correctAnswer'] not in q['choices']:
                    self.errors.append(f"{q['id']}: Correct answer not in choices")
    
    def validate_data_quality(self):
        """Level 2: データ品質検証"""
        for unit in self.data['units']:
            questions = unit.get('verbForm') or unit.get('fillInBlank') or unit.get('sentenceOrdering')
            
            for q in questions:
                # 空フィールドチェック
                if not q.get('japanese', '').strip():
                    self.errors.append(f"{q['id']}: Empty japanese field")
                
                if not q.get('sentence', '').strip():
                    self.errors.append(f"{q['id']}: Empty sentence field")
                
                # 英文構造チェック（verb-form, fill-in-blankの場合）
                if 'verbForm' in unit or 'fillInBlank' in unit:
                    if '____' not in q.get('sentence', ''):
                        self.warnings.append(f"{q['id']}: Sentence should contain blank (____)")
    
    def validate_uniqueness(self):
        """Level 3: ユニーク性検証"""
        all_sentences = []
        
        for unit in self.data['units']:
            questions = unit.get('verbForm') or unit.get('fillInBlank') or unit.get('sentenceOrdering')
            all_sentences.extend([q['sentence'] for q in questions])
        
        sentence_counts = Counter(all_sentences)
        duplicates = {s: count for s, count in sentence_counts.items() if count > 1}
        
        if duplicates:
            self.warnings.append(f"Found {len(duplicates)} duplicate sentences")
            for sentence, count in list(duplicates.items())[:5]:
                self.warnings.append(f"  '{sentence[:50]}...' ({count}x)")
    
    def print_report(self):
        """検証結果レポート"""
        print(f"\n{'='*60}")
        print(f"Validation Report: {self.file_path.name}")
        print(f"{'='*60}")
        
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors[:10]:
                print(f"  - {error}")
            if len(self.errors) > 10:
                print(f"  ... and {len(self.errors) - 10} more errors")
        else:
            print("\n✅ No errors found")
        
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings[:10]:
                print(f"  - {warning}")
            if len(self.warnings) > 10:
                print(f"  ... and {len(self.warnings) - 10} more warnings")
        else:
            print("\n✅ No warnings")
        
        # 品質スコア
        total_questions = self.data['totalQuestions']
        error_score = max(0, 100 - len(self.errors) * 5)
        warning_score = max(0, 100 - len(self.warnings))
        overall_score = (error_score + warning_score) / 2
        
        print(f"\n📊 Quality Score: {overall_score:.1f}/100")
        print(f"{'='*60}\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: python grammar_validator.py <file1.json> [file2.json ...]")
        sys.exit(1)
    
    all_passed = True
    
    for file_path in sys.argv[1:]:
        validator = GrammarValidator(file_path)
        passed = validator.validate_all()
        all_passed = all_passed and passed
    
    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()
```

---

## 検証チェックリスト

### デプロイ前必須チェック

- [ ] Level 1: スキーマ検証をパス
- [ ] Level 2: データ品質検証をパス
- [ ] Level 3: ユニーク度 ≥ 99%
- [ ] Level 3: 日本語フィールド充足率 = 100%
- [ ] Level 3: クロスファイル整合性をパス
- [ ] エラー数 = 0
- [ ] 警告数 ≤ 5

### 推奨チェック

- [ ] Level 4: Unit別問題数 = 20
- [ ] Level 4: 語彙多様性スコア ≥ 70%
- [ ] Level 4: 難易度分布が適切
- [ ] 手動レビュー実施
- [ ] ネイティブチェック実施

---

## まとめ

### 検証の重要性

1. **品質保証**: データの正確性を保証
2. **早期発見**: 問題を早期に検出
3. **継続的改善**: メトリクスによる改善追跡

### ベストプラクティス

- 生成直後に検証を実行
- エラーゼロを目指す
- 警告も可能な限り解消
- 定期的な検証を習慣化

### 次のステップ

1. grammar_validator.pyを実行
2. エラーを修正
3. 警告を確認
4. 品質スコア90点以上でデプロイ
