# 文法問題生成ガイドライン

## 目的
高品質な英文法問題を効率的に生成するための標準化されたガイドライン。

---

## 基本原則

### 1. ユニーク性の保証
- すべての英文は一意であること
- 同じ文法パターンでも異なる語彙を使用
- 目標: **ユニーク度 99%以上**

### 2. 完全性の保証
- すべての必須フィールドを埋める
- 空文字列・null値の禁止
- 目標: **完全性 100%**

### 3. 多様性の保証
- 主語・動詞・目的語の多様化
- 文脈の多様化（学校・家庭・趣味など）
- 目標: **文脈の幅広さ**

---

## データ構造

### 必須フィールド

```json
{
  "id": "vf-g{grade}-u{unit}-{number:03d}",
  "japanese": "日本語訳（必須、非空）",
  "sentence": "英文（必須、非空、ユニーク）",
  "verb": "文法タイプ",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctAnswer": "正解",
  "difficulty": "intermediate",
  "explanation": "文法説明",
  "grammarPoint": "文法ポイント"
}
```

### フィールド仕様

| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|-----|------|------|-----|
| id | string | ○ | ユニークID | vf-g1-u0-001 |
| japanese | string | ○ | 日本語訳 | 私は学生です |
| sentence | string | ○ | 英文（____含む） | I ____ a student. |
| verb | string | ○ | 文法タイプ | be_verb |
| choices | array | ○ | 4つの選択肢 | ["am", "is", "are", "be"] |
| correctAnswer | string | ○ | 正解 | am |
| difficulty | string | ○ | 難易度 | intermediate |
| explanation | string | ○ | 説明 | be動詞の現在形... |
| grammarPoint | string | ○ | 文法ポイント | be動詞の現在形 |

---

## 問題生成プロセス

### Step 1: 文法ポイントの定義

```python
# 例: 中1 Unit 0 - be動詞の現在形
GRAMMAR_POINT = "be動詞の現在形"
UNIT_TITLE = "be動詞 (am/is/are)"
TARGET_COUNT = 20  # 各Unitで20問
```

### Step 2: パターン設計

#### 良いパターン（推奨）✅
```python
patterns = [
    # 主語を多様化
    ("私は学生です", "I ____ a student.", "am"),
    ("あなたは先生です", "You ____ a teacher.", "are"),
    ("彼は医者です", "He ____ a doctor.", "is"),
    
    # 文脈を多様化
    ("私は今日忙しいです", "I ____ busy today.", "am"),
    ("彼女は幸せです", "She ____ happy.", "is"),
    ("彼らは友達です", "They ____ friends.", "are"),
    
    # 語彙を多様化
    ("トムは親切です", "Tom ____ kind.", "is"),
    ("メアリーは賢いです", "Mary ____ smart.", "is"),
    ("その本は面白いです", "The book ____ interesting.", "is"),
]
```

#### 悪いパターン（非推奨）❌
```python
# 同じ文構造の繰り返し
patterns = [
    ("私は学生です", "I ____ a student.", "am"),
    ("私は医者です", "I ____ a doctor.", "am"),      # 主語が同じ
    ("私は先生です", "I ____ a teacher.", "am"),     # 主語が同じ
]

# 語彙の偏り
patterns = [
    ("彼は学生です", "He ____ a student.", "is"),
    ("彼女は学生です", "She ____ a student.", "is"),  # student重複
    ("トムは学生です", "Tom ____ a student.", "is"),  # student重複
]
```

### Step 3: 語彙リストの準備

```python
# 主語の多様化
SUBJECTS = {
    "singular_1st": ["I", "私"],
    "singular_2nd": ["You", "あなた"],
    "singular_3rd": ["He", "She", "Tom", "Mary", "The cat", "The dog"],
    "plural": ["We", "They", "You", "My parents", "The students"],
}

# 述語の多様化
ADJECTIVES = [
    ("happy", "幸せ"), ("sad", "悲しい"), ("busy", "忙しい"),
    ("tired", "疲れた"), ("hungry", "お腹が空いた"), ("sick", "病気"),
    ("kind", "親切"), ("smart", "賢い"), ("tall", "背が高い"),
]

NOUNS = [
    ("student", "学生"), ("teacher", "先生"), ("doctor", "医者"),
    ("nurse", "看護師"), ("engineer", "技術者"), ("artist", "芸術家"),
]

# 文脈の多様化
CONTEXTS = [
    "today", "now", "always", "sometimes", "usually",
    "at school", "at home", "in the park", "in the library",
]
```

### Step 4: 実装テンプレート

```python
def build_unit_questions(grade, unit, grammar_point, patterns):
    """
    Args:
        grade: 学年 (1, 2, 3)
        unit: ユニット番号 (0-9)
        grammar_point: 文法ポイント名
        patterns: [(日本語, 英文, 答え), ...] のリスト
    
    Returns:
        問題配列
    """
    questions = []
    
    for i, (japanese, sentence, answer) in enumerate(patterns):
        # 必須チェック
        if not japanese or not sentence or not answer:
            raise ValueError(f"Pattern {i} has empty fields")
        
        question = {
            "id": f"vf-g{grade}-u{unit}-{i+1:03d}",
            "japanese": japanese,
            "sentence": sentence,
            "verb": grammar_point.lower().replace(" ", "_"),
            "choices": generate_choices(answer, grammar_point),
            "correctAnswer": answer,
            "difficulty": "intermediate",
            "explanation": generate_explanation(grammar_point),
            "grammarPoint": grammar_point,
        }
        
        questions.append(question)
    
    # 重複チェック
    sentences = [q['sentence'] for q in questions]
    if len(sentences) != len(set(sentences)):
        raise ValueError(f"Duplicate sentences found in Unit {unit}")
    
    return questions


def generate_choices(correct_answer, grammar_point):
    """
    文法ポイントに応じた選択肢を生成
    """
    choice_sets = {
        "be動詞": {
            "am": ["am", "is", "are", "be"],
            "is": ["is", "am", "are", "was"],
            "are": ["are", "is", "am", "were"],
        },
        "一般動詞": {
            "study": ["study", "studies", "studying", "studied"],
            "plays": ["plays", "play", "playing", "played"],
        },
        # ... 他の文法ポイント
    }
    
    return choice_sets.get(grammar_point, {}).get(correct_answer, [])


def generate_explanation(grammar_point):
    """
    文法ポイントに応じた説明を生成
    """
    explanations = {
        "be動詞の現在形": "be動詞は主語によって形が変わります。I→am、You/複数→are、He/She/It/単数→is。",
        "一般動詞の現在形": "一般動詞は三人称単数現在で-sがつきます。",
        "過去形": "過去のことを表す時は動詞を過去形にします。",
        # ... 他の説明
    }
    
    return explanations.get(grammar_point, "")
```

---

## 品質チェック

### 自動チェックスクリプト

```python
def validate_questions(questions):
    """
    生成した問題の品質チェック
    """
    errors = []
    
    # 1. フィールド完全性チェック
    required_fields = ['id', 'japanese', 'sentence', 'correctAnswer']
    for i, q in enumerate(questions):
        for field in required_fields:
            if field not in q or not q[field] or not str(q[field]).strip():
                errors.append(f"Question {i}: Empty field '{field}'")
    
    # 2. ユニーク性チェック
    sentences = [q['sentence'] for q in questions]
    if len(sentences) != len(set(sentences)):
        duplicates = [s for s in sentences if sentences.count(s) > 1]
        errors.append(f"Duplicate sentences: {set(duplicates)}")
    
    # 3. ID整合性チェック
    for i, q in enumerate(questions):
        expected_id = f"vf-g{grade}-u{unit}-{i+1:03d}"
        if q['id'] != expected_id:
            errors.append(f"Question {i}: ID mismatch (expected {expected_id}, got {q['id']})")
    
    # 4. 選択肢数チェック
    for i, q in enumerate(questions):
        if len(q.get('choices', [])) != 4:
            errors.append(f"Question {i}: Must have 4 choices (got {len(q.get('choices', []))})")
    
    if errors:
        raise ValueError("\n".join(errors))
    
    return True
```

---

## ベストプラクティス

### 1. 段階的生成

```python
# Phase 1: 基本パターン (5問)
basic_patterns = [
    ("私は学生です", "I ____ a student.", "am"),
    ("あなたは先生です", "You ____ a teacher.", "are"),
    # ...
]

# Phase 2: 応用パターン (10問)
advanced_patterns = [
    ("私たちは友達です", "We ____ friends.", "are"),
    ("彼らは医者です", "They ____ doctors.", "are"),
    # ...
]

# Phase 3: 発展パターン (5問)
expert_patterns = [
    ("トムとメアリーは学生です", "Tom and Mary ____ students.", "are"),
    ("私の両親は親切です", "My parents ____ kind.", "are"),
    # ...
]

all_patterns = basic_patterns + advanced_patterns + expert_patterns
```

### 2. 文脈の多様化マトリックス

| 主語 | 述語 | 文脈 | 例文 |
|------|------|------|------|
| I | student | at school | I am a student at school. |
| You | teacher | - | You are a teacher. |
| He | doctor | in the hospital | He is a doctor in the hospital. |
| She | happy | today | She is happy today. |
| We | friends | - | We are friends. |
| They | busy | now | They are busy now. |

### 3. 品質メトリクス目標

| メトリクス | 目標値 | 許容範囲 |
|-----------|--------|----------|
| ユニーク度 | 100% | 99%以上 |
| 完全性 | 100% | 100% |
| 語彙多様性 | 80%以上 | 70%以上 |
| 文脈多様性 | 5種類以上 | 3種類以上 |

---

## トラブルシューティング

### Q1: ユニーク度が低い
**原因**: 同じ文構造の繰り返し

**解決策**:
1. 主語を多様化（I → You → He → She → We → They → 固有名詞）
2. 述語を多様化（形容詞・名詞のバリエーション）
3. 文脈を追加（時間・場所・状況）

```python
# Before (低多様性)
"I am a student."
"You are a student."
"He is a student."

# After (高多様性)
"I am a student at this school."
"You are a kind teacher."
"He is a doctor in Tokyo."
```

### Q2: 日本語訳が不自然
**原因**: 機械的な翻訳

**解決策**:
1. 自然な日本語表現を使用
2. 文脈に合った訳語を選択
3. ネイティブチェックを実施

```python
# Before (不自然)
("私は忙しいである", "I am busy.", "am")  # ✗

# After (自然)
("私は忙しいです", "I am busy.", "am")    # ✓
```

### Q3: 選択肢が適切でない
**原因**: 文法ポイントに合わない選択肢

**解決策**:
1. 正解に近い選択肢を含める（識別力テスト）
2. 文法的に誤りがわかりやすい選択肢
3. すべての選択肢が文法的に存在する形式

```python
# Before (不適切)
choices = ["am", "xyz", "abc", "def"]  # ✗ xyz, abc, defは実在しない

# After (適切)
choices = ["am", "is", "are", "be"]    # ✓ すべて実在するbe動詞の形
```

---

## 文法別テンプレート

### 中1レベル

#### Unit 0: be動詞の現在形
```python
patterns = [
    ("私は{名詞}です", "I ____ {noun}.", "am"),
    ("あなたは{形容詞}です", "You ____ {adjective}.", "are"),
    ("彼/彼女は{名詞}です", "He/She ____ {noun}.", "is"),
]
```

#### Unit 1: 一般動詞の現在形
```python
patterns = [
    ("私は{動詞}します", "I ____ {verb}.", "動詞原形"),
    ("彼/彼女は{動詞}します", "He/She ____ {verb}.", "動詞-s"),
]
```

### 中2レベル

#### Unit 0: be動詞の過去形
```python
patterns = [
    ("私は昨日{形容詞}でした", "I ____ {adjective} yesterday.", "was"),
    ("彼らは先週{場所}にいました", "They ____ {place} last week.", "were"),
]
```

#### Unit 1: 過去進行形
```python
patterns = [
    ("私はその時{動詞}していました", "I ____ {verb}ing then.", "was"),
    ("彼らは昨日{動詞}していました", "They ____ {verb}ing yesterday.", "were"),
]
```

### 中3レベル

#### Unit 3: 関係代名詞
```python
patterns = [
    ("これは{名詞}を{動詞}する{名詞}です", "This is the {noun} ____ {verb} {object}.", "that/which/who"),
]
```

#### Unit 7: 仮定法
```python
patterns = [
    ("もし私が{名詞}なら、{動詞}するのに", "If I ____ {noun}, I would {verb}.", "were/was"),
]
```

---

## まとめ

### 成功のための3つの柱

1. **計画**: 文法ポイントの明確化と語彙リスト作成
2. **実行**: テンプレートに従った段階的生成
3. **検証**: 自動チェックと手動レビュー

### 品質保証の鍵

- ユニーク性: すべての英文が異なる
- 完全性: すべてのフィールドを埋める
- 多様性: 語彙・文脈・構造を多様化

### 次のステップ

1. このガイドラインに従って問題を生成
2. validate_grammar_v2.pyで検証
3. 品質メトリクスを確認
4. 必要に応じて修正
5. デプロイ

**目標**: すべての学年で99%以上のユニーク度と100%の完全性を達成
