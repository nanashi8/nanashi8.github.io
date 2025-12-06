# 文法問題作成 品質保証パイプライン

## 概要
G1/G2/G3の文法問題作成で培った品質保証の仕組みとベストプラクティスを体系化したガイドライン。

---

## 📊 達成した品質指標

### 最終結果
- **G1 (中1)**: 600問、重複0件 (100%品質)
- **G2 (中2)**: 600問、重複0件 (100%品質)
- **G3 (中3)**: 600問、重複2件 (99.8%品質)

### 改善実績
- **G3**: 160x重複 → 2x重複 (98.75%改善)
- **G2**: 90%データ破損 → 100%完全復旧
- **G1**: 2x重複 → 0x重複 (100%達成)

---

## 🔧 品質保証の5段階プロセス

### 1. データ設計フェーズ

#### 必須スキーマ定義
```json
{
  "id": "vf-g{grade}-u{unit}-{number:03d}",
  "japanese": "必須: 日本語訳 (空文字列禁止)",
  "sentence": "必須: 英文 (ユニーク性必須)",
  "verb": "文法タイプ",
  "choices": ["選択肢配列"],
  "correctAnswer": "正解",
  "difficulty": "intermediate/basic/advanced",
  "explanation": "文法説明",
  "grammarPoint": "文法ポイント"
}
```

#### 設計原則
1. **ユニーク性**: 全問題で英文がユニークであること
1. **完全性**: 必須フィールドに空文字列を許可しない
1. **一貫性**: Unit間で重複がないこと
1. **多様性**: 同じ文法パターンでも異なる語彙を使用

---

### 2. データ生成フェーズ

#### スクリプト構造のベストプラクティス

```python
def build_unit_questions():
    """
    ベストプラクティス:
    1. 各Unitで20問を生成
    1. パターン配列で管理 (japanese, sentence, answer)
    1. 語彙の多様性を確保
    1. 同じ主語/動詞の連続使用を避ける
    """
    patterns = [
        ("日本語訳1", "English sentence 1 ____.", "answer1"),
        ("日本語訳2", "English sentence 2 ____.", "answer2"),
        # ... 20パターン
    ]
    
    return [
        {
            "id": f"vf-g{grade}-u{unit}-{i+1:03d}",
            "japanese": ja,
            "sentence": en,
            # ... 他のフィールド
        }
        for i, (ja, en, ans) in enumerate(patterns)
    ]
```

#### 避けるべきアンチパターン
❌ **同じ文構造の繰り返し**
```python
# 悪い例
("私は学生です", "I ____ a student.", "am"),
("あなたは学生です", "You ____ a student.", "are"),
("彼は学生です", "He ____ a student.", "is"),
```

✅ **多様な文脈での使用**
```python
# 良い例
("私は学生です", "I ____ a student.", "am"),
("あなたは今日忙しいです", "You ____ busy today.", "are"),
("彼は先生です", "He ____ a teacher.", "is"),
```

---

### 3. 検証フェーズ

#### 3層検証システム

##### Level 1: スキーマ検証
```python
def validate_schema(question):
    """必須フィールドの存在と型をチェック"""
    required_fields = ['id', 'japanese', 'sentence', 'correctAnswer']
    for field in required_fields:
        if field not in question:
            raise ValueError(f"Missing field: {field}")
        if not question[field] or question[field].strip() == '':
            raise ValueError(f"Empty field: {field}")
```

##### Level 2: 重複検出
```python
def detect_duplicates(questions):
    """
    重複パターンの検出:
    1. 完全一致 (sentence)
    1. 日本語重複 (japanese)
    1. ID重複 (id)
    """
    from collections import Counter
    
    sentences = [q['sentence'] for q in questions]
    duplicates = {k: v for k, v in Counter(sentences).items() if v > 1}
    
    if duplicates:
        return f"Found {len(duplicates)} duplicate patterns"
    return "OK"
```

##### Level 3: クロスファイル整合性
```python
def validate_cross_files(vf_data, fb_data, so_data):
    """
    3ファイル間の整合性チェック:
    1. ID一致 (vf-xxx → fb-xxx → so-xxx)
    1. 日本語一致
    1. 問題数一致
    """
    for i, (vf, fb, so) in enumerate(zip(vf_units, fb_units, so_units)):
        assert vf['japanese'] == fb['japanese'] == so['japanese']
        assert vf['id'].replace('vf-', '') == fb['id'].replace('fb-', '')
```

---

### 4. 問題修正フェーズ

#### 重複解消の優先順位

**Priority 1: 文脈を変える**
```python
# Before
"He is taller than me."
"He is younger than me."
"He is stronger than me."

# After
"He is taller than me."
"He looks younger than before."  # 文脈変更
"My brother is stronger than me."  # 主語変更
```

**Priority 2: 語彙を変える**
```python
# Before
"This is the best."
"This is the cheapest."

# After
"This is the best."
"This shirt is the cheapest."  # 主語を具体化
```

**Priority 3: 文法構造を変える**
```python
# Before (疑問文の重複)
"Are you happy?"
"Are you ready?"

# After
"Are you happy?"
"You are ready, aren't you?"  # 付加疑問文に変更
```

---

### 5. 継続的改善フェーズ

#### 品質メトリクスの追跡

```python
def calculate_quality_metrics(data):
    """
    品質指標:
    1. ユニーク度 = unique_sentences / total_sentences * 100
    1. 完全性 = filled_fields / total_fields * 100
    1. 多様性 = unique_vocabulary / total_vocabulary * 100
    """
    total = len(all_sentences)
    unique = len(set(all_sentences))
    uniqueness = unique / total * 100
    
    return {
        "total": total,
        "unique": unique,
        "uniqueness": f"{uniqueness:.1f}%",
        "duplicates": total - unique
    }
```

---

## 📋 チェックリスト

### 生成前チェック
- [ ] 文法ポイントが明確に定義されている
- [ ] 各Unitで20問分の多様なパターンを用意
- [ ] 語彙リストを作成済み（重複回避用）

### 生成後チェック
- [ ] 全問題にjapaneseフィールドが存在
- [ ] 全問題にsentenceフィールドが存在
- [ ] IDフォーマットが正しい (vf-g{grade}-u{unit}-{number:03d})
- [ ] choices配列が4つの選択肢を含む

### 検証チェック
- [ ] validate_grammar_v2.pyでOK判定
- [ ] ユニーク度が95%以上
- [ ] 日本語フィールドの充足率100%
- [ ] クロスファイル整合性確認

### デプロイ前チェック
- [ ] Git commit メッセージが具体的
- [ ] 変更内容を数値で記載 (例: 98.75%改善)
- [ ] 全3ファイル (verb-form, fill-in-blank, sentence-ordering) 更新済み

---

## 🚨 失敗から学んだ教訓

### 教訓1: 検証ツールの落とし穴
**問題**: 空フィールドが"重複なし"と判定される
```python
# バグのある検証ロジック
if q['japanese'] == q2['japanese']:  # 両方空なら一致しない
    duplicates += 1
```

**解決策**: 空フィールドを事前に検出
```python
# 改善後
if not q['japanese'].strip():
    raise ValueError(f"Empty japanese field in {q['id']}")
```

### 教訓2: データ破損の早期発見
**問題**: G2の90%が空フィールドだったが気づかなかった

**解決策**: 生成直後に充足率チェック
```python
def check_completeness(data):
    filled = sum(1 for q in questions if q['japanese'].strip())
    total = len(questions)
    rate = filled / total * 100
    
    if rate < 100:
        raise Warning(f"Completeness: {rate}% (expected 100%)")
```

### 教訓3: Unit間の重複見落とし
**問題**: 同じUnitで異なる問題IDなのに同じ英文

**解決策**: Unit内重複とUnit間重複を分けて検出
```python
def detect_intra_unit_duplicates(unit):
    """Unit内重複"""
    sentences = [q['sentence'] for q in unit['questions']]
    return len(sentences) - len(set(sentences))

def detect_inter_unit_duplicates(all_units):
    """Unit間重複"""
    all_sentences = []
    for unit in all_units:
        all_sentences.extend([q['sentence'] for q in unit['questions']])
    return len(all_sentences) - len(set(all_sentences))
```

---

## 🛠️ 推奨ツール構成

### 1. データ生成スクリプト
```bash
scripts/
├── build_grade1_complete.py      # G1全問題生成
├── build_grade2_complete.py      # G2全問題生成
├── build_grade3_complete.py      # G3全問題生成
└── rebuild_grade2_complete.py    # G2再構築用
```

### 2. 検証スクリプト
```bash
scripts/
├── validate_grammar_v2.py        # 重複・スキーマ検証
├── check_completeness.py         # フィールド充足率
└── cross_file_validator.py       # ファイル間整合性
```

### 3. 修正スクリプト
```bash
scripts/
├── fix_duplicates.py             # 重複自動修正
├── add_japanese_fields.py        # 日本語フィールド追加
└── diversify_patterns.py         # パターン多様化
```

---

## 📈 品質向上の軌跡

### Phase 1: 初期生成
- G1/G2/G3を一括生成
- 問題: 重複多数、一部データ破損

### Phase 2: G3改善
- 160x重複を検出
- Units 3-9を多様化
- 結果: 98.75%改善 (160x → 2x)

### Phase 3: G1完全化
- 2x重複を個別修正
- 類似文を完全に別の例文に変更
- 結果: 100%品質達成 (0重複)

### Phase 4: G2復旧
- 90%データ破損を発見
- 完全再構築 (600問生成)
- Unit 5の5箇所重複を修正
- 結果: 100%品質達成

### 最終状態
- **G1**: 0重複 (100%)
- **G2**: 0重複 (100%)
- **G3**: 2重複 (99.8%)
- **総計**: 1800問中2重複 (99.9%品質)

---

## 🎯 今後の展開

### 自動化パイプライン
```yaml
# CI/CDパイプライン例
grammar_quality_pipeline:
  stages:
    - generate:
        script: python3 scripts/build_grade{1-3}_complete.py
        
    - validate:
        script: |
          python3 scripts/validate_grammar_v2.py
          python3 scripts/check_completeness.py
          
    - quality_gate:
        rules:
          - uniqueness >= 99%
          - completeness == 100%
          - duplicates <= 5
          
    - deploy:
        on_success:
          - git commit -m "Auto-generated grammar questions"
          - git push origin main
```

### AIアシスト生成
```python
def generate_with_llm(grammar_point, count=20):
    """
    LLMを使った問題生成:
    1. 文法ポイントを指定
    1. 多様性の制約を追加
    1. 既存問題との重複チェック
    1. 品質検証後に採用
    """
    prompt = f"""
    Create {count} unique English grammar questions for {grammar_point}.
    Requirements:
    - All sentences must be unique
    - Use diverse vocabulary
    - Avoid similar sentence structures
    - Include Japanese translations
    """
    # LLM呼び出し + 検証
```

---

## 📚 参考資料

### 成功事例
- [G3 Units 3-9多様化](../scripts/diversify_g3_units_8to9.py)
- [G1重複解消](git show 1f50ccb)
- [G2完全再構築](../scripts/rebuild_grade2_complete.py)

### 失敗事例と対策
- G2データ破損 → 充足率チェックの追加
- 検証ツールの盲点 → 空フィールド検出の強化
- Unit間重複 → クロスユニット検証の実装

---

## ✅ クイックスタートガイド

### 新しい文法問題を作成する場合

1. **テンプレートをコピー**
```bash
cp scripts/rebuild_grade2_complete.py scripts/build_new_grammar.py
```

1. **文法ポイントを定義**
```python
def build_unit0_your_grammar():
    patterns = [
        ("日本語1", "English 1 ____.", "answer1"),
        # ... 20パターン
    ]
```

1. **生成実行**
```bash
python3 scripts/build_new_grammar.py
```

1. **検証実行**
```bash
python3 scripts/validate_grammar_v2.py public/data/your-grammar.json
```

1. **品質確認**
- ユニーク度 ≥ 99%
- 完全性 = 100%
- 重複 ≤ 2

1. **デプロイ**
```bash
git add public/data/your-grammar.json
git commit -m "Add new grammar: [文法名] ([問題数]問, [ユニーク度]%)"
git push
```

---

## 🔍 トラブルシューティング

### Q1: 重複が多い場合
**対策**: 語彙リストを拡充し、文脈を多様化
```python
subjects = ["I", "You", "He", "She", "We", "They", "Tom", "Mary", "The dog", ...]
verbs = ["study", "work", "play", "read", "write", "sing", ...]
```

### Q2: 日本語フィールドが空の場合
**対策**: パターン配列に必ず日本語を含める
```python
# 必ず3要素タプル
patterns = [
    ("日本語", "English", "answer"),  # ✓ 正しい
    ("English", "answer"),            # ✗ 間違い
]
```

### Q3: ファイル間で不整合が発生
**対策**: verb-formをマスターとし、他を自動生成
```python
fb_data = create_fill_in_blank_from_verb_form(vf_data)
so_data = create_sentence_ordering_from_verb_form(vf_data)
```

---

## 📊 品質ダッシュボード (例)

```
=== Grammar Quality Report ===

G1 (中1):
  ✓ Total: 600 questions
  ✓ Unique: 600/600 (100.0%)
  ✓ Completeness: 100%
  ✓ Status: EXCELLENT

G2 (中2):
  ✓ Total: 600 questions
  ✓ Unique: 600/600 (100.0%)
  ✓ Completeness: 100%
  ✓ Status: EXCELLENT

G3 (中3):
  ✓ Total: 600 questions
  ✓ Unique: 598/600 (99.8%)
  ✓ Completeness: 100%
  ⚠ Status: VERY GOOD (2 duplicates)

Overall:
  ✓ Total: 1800 questions
  ✓ Unique: 1798/1800 (99.9%)
  ✓ Completeness: 100%
  ✓ Status: EXCELLENT
```

---

## 🎓 まとめ

このパイプラインを活用することで:
1. **高品質な問題を効率的に生成**できる
1. **データ破損を早期に検出**できる
1. **継続的な品質改善**が可能
1. **再現可能なプロセス**を確立

**品質の鍵**: 生成 → 検証 → 修正 → 再検証のサイクルを徹底すること
