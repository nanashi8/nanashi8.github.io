# AI開発ワークフロー指示書

## 📋 このドキュメントの目的

このドキュメントは、AIアシスタントが効率的に開発作業を進めるための標準ワークフローを定義します。
各作業タイプに対して、必要なドキュメント参照、実装手順、品質チェック項目を明確化し、指示を「パイプライン」として体系化します。

---

## 🎯 作業タイプ別ワークフロー

### 1. UI機能の追加・変更

#### 📖 必須参照ドキュメント
1. **`UI_DEVELOPMENT_GUIDELINES.md`** - ⚠️ 最優先・必読
2. **`DESIGN_SYSTEM_RULES.md`** - ⚠️ デザインルール・カラーシステム定義
3. 該当機能の仕様書（`01-26`シリーズ）
4. `17-styling.md` - デザインシステム
5. `18-dark-mode.md` - ダークモード実装

#### 🔄 実装フロー
```
1. 要件確認
   └─ 該当機能の仕様書を読む

2. デザインルール確認
   ├─ DESIGN_SYSTEM_RULES.mdでカラールール確認
   └─ 既存コンポーネントとの一貫性を確認

3. 実装
   ├─ CSS変数のみ使用（ハードコード色禁止）
   ├─ レスポンシブ対応（デスクトップ/タブレット/モバイル）
   └─ アクセシビリティ考慮

4. 自動デザインチェック（実装後必須）
   ├─ 直接色指定チェック:
   │   grep -rn "background.*#[0-9a-fA-F]\{6\}" src/**/*.css | grep -v "dark-mode"
   ├─ 暗い色の直接使用チェック:
   │   grep -rn "background.*#[0-4][0-9a-fA-F]\{5\}" src/**/*.css | grep -v "dark-mode"
   └─ white/black直接使用チェック:
       grep -rn ":\s*white\|:\s*black" src/**/*.css | grep -v "dark-mode"

5. テスト
   ├─ ライトモードで動作確認
   ├─ ダークモードで動作確認
   └─ レスポンシブ表示確認（3サイズ）

6. デプロイ前チェック
   └─ UI_DEVELOPMENT_GUIDELINES.mdのチェックリスト完了
```

#### ⚠️ 絶対遵守事項
- **色の指定は100%必ずCSS変数を使用**（`var(--background)`など）
- 直接色コード（`#ffffff`、`rgb()`、`white`等）は**完全禁止**
- ライトモード・ダークモード両方でテスト必須
- **実装後は必ず自動デザインチェックを実行**

#### 🎨 カラーシステムの基本原則

**ライトモード（デフォルト）:**
- メイン文字色: `--text-color: #333333` (黒に近いダークグレー)
- メイン背景色: `--background: #ffffff` (白)

**ダークモード:**
- メイン文字色: `--text-color: #e0e0e0` (白に近いライトグレー)
- メイン背景色: `--background: #1a1a1a` (黒に近いダークグレー)

詳細: `DESIGN_SYSTEM_RULES.md`参照

#### ✅ 完了チェックリスト
- [ ] すべての色がCSS変数を使用
- [ ] 自動デザインチェック実行済み（エラーなし）
- [ ] ライトモード動作確認済み
- [ ] ダークモード動作確認済み
- [ ] 両モードでコントラスト十分
- [ ] デスクトップ（1024px+）表示確認
- [ ] タブレット（768-1023px）表示確認
- [ ] モバイル（~767px）表示確認
- [ ] `npm run build` エラーなし

---

### 2. 文法問題の追加（NEW HORIZON準拠）

#### 📖 必須参照ドキュメント
1. **`NEW_HORIZON_GRAMMAR_GUIDELINES.md`** - 文並び替え問題（1,017行）
2. **`NEW_HORIZON_VERB_FORM_GUIDELINES.md`** - 動詞変化問題
3. **`NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md`** - 穴埋め問題
4. `15-data-structures.md` - データ構造仕様

#### 🔄 実装フロー（総合文法問題作成：60問/Unit）

##### A. 文並び替え問題（sentence-ordering）
```
1. 対象確認
   ├─ 学年（1/2/3）
   ├─ 単元（Unit 0-9）
   └─ 文法項目（be動詞、一般動詞など）

2. ガイドライン確認
   └─ NEW_HORIZON_GRAMMAR_GUIDELINES.mdの該当単元セクション読む

3. 問題作成
   ├─ 語数: 3-11語（ガイドライン遵守）
   ├─ 難易度: 学年・単元に適合
   ├─ 文法焦点: 単一の文法項目に集中
   └─ NEW HORIZON教科書準拠

4. JSONファイル編集
   ├─ public/data/sentence-ordering-grade{1,2,3}.json
   ├─ units配列の該当unitに追加
   └─ totalQuestions更新

5. バリデーション
   ├─ JSON構文チェック
   ├─ 重複チェック
   └─ 語数・難易度確認

6. 動作確認
   └─ npm run dev で実際に問題が表示されるか確認
```

##### B. 総合文法問題（grammar_grade{1,2,3}_unit{N}.json）

**📋 問題構成（60問/Unit）:**
- 穴埋め（fillInBlank）: 15問
- 並び替え（sentenceOrdering）: 15問
- 言い換え（paraphrase）: 15問
- 動詞変化（verbForm）: 10問
- 会話（conversation）: 5問

**🔄 完全実装パイプライン:**

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: 企画・準備 (5分)                              │
└─────────────────────────────────────────────────────────┘

1. 単元情報確認
   ├─ 学年: Grade 1/2/3
   ├─ 単元番号: Unit 0-9
   ├─ 文法項目: be動詞、can、現在進行形など
   └─ 学習目標: 該当文法の理解度チェック

2. 既存Unit確認
   ```bash
   # 既存ファイルの確認
   ls public/data/grammar_grade1_unit*.json
   
   # 最新Unitの検証
   python3 << 'CHECK'
   import json
   from collections import Counter
   
   with open('public/data/grammar_grade1_unit5.json') as f:
       data = json.load(f)
   
   print(f"Total: {data['totalQuestions']}問")
   print(f"Types: {data['questionTypes']}")
   CHECK
   ```

┌─────────────────────────────────────────────────────────┐
│ Phase 2: 前半30問作成 (15-20分)                         │
└─────────────────────────────────────────────────────────┘

1. 穴埋め問題（fillInBlank: 15問）
   ├─ beginner: 5問（基本形の穴埋め）
   ├─ intermediate: 6問（やや複雑な文）
   └─ advanced: 4問（応用的な文・長文）
   
   構造:
   {
     "id": "g{grade}-u{unit}-fib-{number}",
     "type": "fillInBlank",
     "japanese": "日本語訳",
     "sentence": "I ____ a student.",
     "choices": ["am", "is", "are", "be"],
     "correctAnswer": "am",
     "difficulty": "beginner",
     "explanation": "主語がIのときはbe動詞はam。",
     "hint": "I am"
   }

2. 並び替え問題（sentenceOrdering: 15問）
   ├─ beginner: 5問（3-5語）
   ├─ intermediate: 5問（6-8語）
   └─ advanced: 5問（9-11語）
   
   構造:
   {
     "id": "g{grade}-u{unit}-so-{number}",
     "type": "sentenceOrdering",
     "japanese": "日本語訳",
     "words": ["am", "I", "student", "a"],
     "correctAnswer": "I am a student.",
     "difficulty": "beginner",
     "explanation": "I am a student.で「私は学生です」。",
     "hint": "I am"
   }

3. 一時保存・検証
   ```bash
   python3 << 'SAVE1'
   import json
   
   questions = []
   # ... 30問のデータ ...
   
   output = {
       "unit": "Unit {N}",
       "title": "{文法項目}",
       "grammar": "{文法説明}",
       "totalQuestions": len(questions),
       "questionTypes": {
           "fillInBlank": 15,
           "sentenceOrdering": 15,
           "paraphrase": 0,
           "verbForm": 0,
           "conversation": 0
       },
       "questions": questions
   }
   
   with open('public/data/grammar_grade{X}_unit{N}.json', 'w', encoding='utf-8') as f:
       json.dump(output, f, ensure_ascii=False, indent=2)
   
   print(f"✅ 一時保存: {len(questions)}問")
   SAVE1
   ```

┌─────────────────────────────────────────────────────────┐
│ Phase 3: 後半30問作成 (15-20分)                         │
└─────────────────────────────────────────────────────────┘

1. 言い換え問題（paraphrase: 15問）
   ├─ beginner: 5問（肯定↔否定、肯定↔疑問）
   ├─ intermediate: 5問（主語変更、時制変更）
   └─ advanced: 5問（複合的変換、疑問詞追加）
   
   構造:
   {
     "id": "g{grade}-u{unit}-para-{number}",
     "type": "paraphrase",
     "japanese": "書き換え指示",
     "originalSentence": "I am a student.",
     "question": "疑問文に書き換えなさい",
     "choices": ["Am I a student?", "I am a student?", ...],
     "correctAnswer": "Am I a student?",
     "difficulty": "beginner",
     "explanation": "be動詞の疑問文はbe動詞を文頭に。",
     "hint": "Am I"
   }

2. 動詞変化問題（verbForm: 10問）
   ├─ beginner: 4問（基本形の選択）
   ├─ intermediate: 3問（三人称単数・進行形）
   └─ advanced: 3問（複雑な時制・助動詞後）
   
   構造:
   {
     "id": "g{grade}-u{unit}-vf-{number}",
     "type": "verbForm",
     "japanese": "動詞変化の説明",
     "sentence": "He ____ to school.",
     "verb": "go",
     "choices": ["go", "goes", "going", "to go"],
     "correctAnswer": "goes",
     "difficulty": "beginner",
     "explanation": "三人称単数現在形はgoesになる。",
     "hint": "三人称単数"
   }

3. 会話問題（conversation: 5問）
   ├─ beginner: 2問（基本応答）
   ├─ intermediate: 2問（状況判断）
   └─ advanced: 1問（複合的会話）
   
   構造:
   {
     "id": "g{grade}-u{unit}-conv-{number}",
     "type": "conversation",
     "japanese": "会話の状況",
     "situation": "挨拶の場面",
     "dialogue": [
       {"speaker": "A", "text": "How are you?"},
       {"speaker": "B", "text": "I ____ fine."}
     ],
     "choices": ["am", "is", "are", "be"],
     "correctAnswer": "am",
     "difficulty": "beginner",
     "explanation": "主語がIのときはam。",
     "hint": "I am"
   }

4. 完全版保存
   ```bash
   python3 << 'SAVE2'
   import json
   
   # 既存30問読み込み
   with open('public/data/grammar_grade{X}_unit{N}.json') as f:
       data = json.load(f)
   
   questions = data['questions']
   
   # 後半30問追加
   # ... paraphrase 15問 ...
   # ... verbForm 10問 ...
   # ... conversation 5問 ...
   
   output = {
       "unit": "Unit {N}",
       "title": "{文法項目}",
       "grammar": "{文法説明}",
       "totalQuestions": len(questions),
       "questionTypes": {
           "fillInBlank": 15,
           "sentenceOrdering": 15,
           "paraphrase": 15,
           "verbForm": 10,
           "conversation": 5
       },
       "questions": questions
   }
   
   with open('public/data/grammar_grade{X}_unit{N}.json', 'w', encoding='utf-8') as f:
       json.dump(output, f, ensure_ascii=False, indent=2)
   
   print(f"✅ Unit {N}完成: {len(questions)}問")
   SAVE2
   ```

┌─────────────────────────────────────────────────────────┐
│ Phase 4: 品質チェック (5-10分)                          │
└─────────────────────────────────────────────────────────┘

1. 重複チェック（必須）
    ```bash
    python3 << 'CHECKDUP'
    import json
    from collections import Counter
    
    with open('public/data/grammar_grade{X}_unit{N}.json') as f:
        data = json.load(f)
    
    sentences = []
    for q in data['questions']:
        if q['type'] == 'fillInBlank':
            sentences.append(q['sentence'])
        elif q['type'] == 'sentenceOrdering':
            sentences.append(q['correctAnswer'])
        elif q['type'] == 'paraphrase':
            sentences.append(q['originalSentence'])
        elif q['type'] == 'verbForm':
            sentences.append(q['sentence'])
        elif q['type'] == 'conversation':
            for d in q['dialogue']:
                sentences.append(d['text'])
    
    counts = Counter(sentences)
    duplicates = {s: c for s, c in counts.items() if c > 1}
    
    if duplicates:
        print(f"❌ 重複発見: {len(duplicates)}件")
        for s, c in duplicates.items():
            print(f"  - \"{s}\" ({c}回)")
    else:
        print(f"✅ Unit {N}: 重複0件")
    CHECKDUP
    ```

2. 重複修正（発見時）
    - 文の一部を変更（動詞・名詞・副詞の置き換え）
    - 文構造を変更（疑問文↔平叙文、主語変更）
    - 再度チェック実行（重複0件まで繰り返し）

3. JSON構文チェック
    ```bash
    # 構文確認
    python3 -c "import json; json.load(open('public/data/grammar_grade{X}_unit{N}.json'))"
    
    # 問題数確認
    python3 -c "import json; data=json.load(open('public/data/grammar_grade{X}_unit{N}.json')); print(f'Total: {len(data[\"questions\"])}')"
    ```

┌─────────────────────────────────────────────────────────┐
│ Phase 5: 動作確認・デプロイ (5分)                       │
└─────────────────────────────────────────────────────────┘

1. ローカル環境確認
    ```bash
    npm run dev
    # → http://localhost:5173 で文法クイズ動作確認
    ```
    
    確認項目:
    ├─ 問題が表示される
    ├─ 選択肢が正しい
    ├─ 正解判定が正しい
    ├─ 解説が表示される
    └─ ヒントが表示される

2. ビルド・デプロイ
    ```bash
    npm run build
    npm run deploy
    ```
```

#### 📊 データフォーマット（問題タイプ別）

**fillInBlank:**
```json
{
  "id": "g1-u0-fib-001",
  "type": "fillInBlank",
  "japanese": "私は学生です。",
  "sentence": "I ____ a student.",
  "choices": ["am", "is", "are", "be"],
  "correctAnswer": "am",
  "difficulty": "beginner",
  "explanation": "主語がIのときはbe動詞はam。I am a student.で「私は学生です」。",
  "hint": "I am"
}
```

**sentenceOrdering:**
```json
{
  "id": "g1-u0-so-001",
  "type": "sentenceOrdering",
  "japanese": "彼女は毎日学校へ行きます。",
  "words": ["goes", "to", "school", "she", "every", "day"],
  "correctAnswer": "She goes to school every day.",
  "difficulty": "medium",
  "explanation": "三人称単数現在形goesを使う。She goes to school every day.で「彼女は毎日学校へ行きます」。",
  "hint": "She goes"
}
```

**paraphrase:**
```json
{
  "id": "g1-u0-para-001",
  "type": "paraphrase",
  "japanese": "肯定文→疑問文",
  "originalSentence": "You are a student.",
  "question": "疑問文に書き換えなさい",
  "choices": ["Are you a student?", "You are a student?", "Do you a student?", "Is you a student?"],
  "correctAnswer": "Are you a student?",
  "difficulty": "beginner",
  "explanation": "be動詞の疑問文はbe動詞を文頭に。Are you a student?で「あなたは学生ですか」。",
  "hint": "Are you"
}
```

**verbForm:**
```json
{
  "id": "g1-u0-vf-001",
  "type": "verbForm",
  "japanese": "be動詞の選択",
  "sentence": "He ____ a teacher.",
  "verb": "be",
  "choices": ["am", "is", "are", "be"],
  "correctAnswer": "is",
  "difficulty": "beginner",
  "explanation": "三人称単数（he）のbe動詞はis。He is a teacher.で「彼は先生です」。",
  "hint": "He is"
}
```

**conversation:**
```json
{
  "id": "g1-u0-conv-001",
  "type": "conversation",
  "japanese": "自己紹介の応答",
  "situation": "初対面の挨拶場面",
  "dialogue": [
    {"speaker": "A", "text": "Are you a student?"},
    {"speaker": "B", "text": "Yes, I ____."}
  ],
  "choices": ["am", "is", "are", "do"],
  "correctAnswer": "am",
  "difficulty": "beginner",
  "explanation": "Are you～?の答えはYes, I am.またはNo, I'm not.。",
  "hint": "Yes, I am"
}
```

#### ⚠️ 絶対遵守事項（品質保証）

1. **重複ゼロ原則**
   - すべての英文が一意であること
   - 会話の各発話も重複チェック対象
   - 重複発見時は即座に修正

2. **難易度分散**
   - beginner/intermediate/advancedのバランス
   - 各問題タイプで適切な難易度配分

3. **文法焦点の統一**
   - 1 Unit = 1文法項目
   - 複数の文法を混在させない

4. **NEW HORIZON準拠**
   - 教科書の語彙・表現を使用
   - 学年レベルに適合した内容

5. **段階的作成**
   - 30問ずつ作成・検証
   - 一気に60問作らない（品質低下防止）

#### 🛠️ 便利なコマンド集

```bash
# 全Unitの問題数確認
for f in public/data/grammar_grade1_unit*.json; do
  python3 -c "import json; d=json.load(open('$f')); print(f'$(basename $f): {d[\"totalQuestions\"]}問')"
done

# 特定Unitの重複チェック
python3 << 'CHECK'
import json, sys
from collections import Counter
with open(sys.argv[1]) as f:
    data = json.load(f)
sentences = []
for q in data['questions']:
    if q['type'] in ['fillInBlank', 'verbForm']:
        sentences.append(q['sentence'])
    elif q['type'] == 'sentenceOrdering':
        sentences.append(q['correctAnswer'])
    elif q['type'] == 'paraphrase':
        sentences.append(q['originalSentence'])
    elif q['type'] == 'conversation':
        sentences.extend([d['text'] for d in q['dialogue']])
counts = Counter(sentences)
dups = {s: c for s, c in counts.items() if c > 1}
print(f"重複: {len(dups)}件" if dups else "✅ 重複なし")
CHECK public/data/grammar_grade1_unit5.json

# 全Unitの重複一括チェック
for f in public/data/grammar_grade1_unit*.json; do
  echo "=== $(basename $f) ==="
  python3 -c "..." $f
done
```

#### ✅ 完了チェックリスト
- [ ] 60問完成（fillInBlank 15 + sentenceOrdering 15 + paraphrase 15 + verbForm 10 + conversation 5）
- [ ] 重複チェック実行済み（重複0件）
- [ ] JSON構文エラーなし
- [ ] 難易度分散適切
- [ ] NEW HORIZON教科書準拠
- [ ] ローカル環境で動作確認済み
- [ ] ビルドエラーなし

---

### 3. 長文パッセージの作成・編集（完全パイプライン）

#### 📖 必須参照ドキュメント
1. **`PASSAGE_CREATION_GUIDELINES.md`** - 作成標準（635行）
2. **`PASSAGE_QUICKSTART.md`** - クイックスタートガイド
3. **`PASSAGE_QUALITY_GUIDE.md`** - 品質基準
4. **`PASSAGE_PHRASE_JSON_CREATION_GUIDE.md`** - フレーズJSON作成
5. `21-reading-passages.md` - 長文読解機能仕様

#### 🔄 完全実装パイプライン

```
```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: 企画・準備 (5-10分)                           │
└─────────────────────────────────────────────────────────┘

1. トピック・レベル決定
   ├─ レベル選択: Beginner/Intermediate/Advanced
   ├─ 目標語数: 800-1500 / 1500-2500 / 2500-4000
   └─ トピック選択: 教育的価値・年齢適合性確認

2. 現在のカバー率確認
   ```bash
   cd scripts
   python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv
   ```
   → 現在のカバー率を記録（例: 63.06%）

3. テンプレート準備
   ```bash
   cp docs/templates/passage-template.txt public/data/passages/{level}-{topic}.txt
   ```

┌─────────────────────────────────────────────────────────┐
│ Phase 2: 執筆 (30-60分)                                 │
└─────────────────────────────────────────────────────────┘

1. パッセージ執筆
   ├─ テンプレートに沿って自然な英語で執筆
   ├─ 段落インデント: 各段落の最初の行に4スペース（必須）
   ├─ Em dash使用: — (not - or --)
   ├─ 語彙を自然に統合
   └─ 教育的価値を確保

2. フォーマット確認
   ├─ セクションヘッダー追加
   ├─ 段落字下げ統一（4スペース）
   ├─ 会話文の正しいフォーマット
   └─ 句読点チェック

┌─────────────────────────────────────────────────────────┐
│ Phase 3: 品質チェック (10-15分)                         │
└─────────────────────────────────────────────────────────┘

1. 自動品質チェック実行
   ```bash
   cd scripts
   python3 passage_quality_check.py ../public/data/passages/{level}-{topic}.txt
   ```
   
   チェック項目:
   ├─ 文法エラーなし
   ├─ 句読点正しい
   ├─ 段落字下げ統一
   ├─ 自然な英語表現
   └─ 適切な単語数

2. 語彙カバレッジ確認
   ```bash
   cd scripts
   python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv
   ```
   → カバー率の変化を確認（前回: XX.XX% → 今回: YY.YY%）

┌─────────────────────────────────────────────────────────┐
│ Phase 4: フレーズ分割・JSON化 (20-30分)                │
└─────────────────────────────────────────────────────────┘

1. フレーズ分割実行
   ```bash
   cd scripts
   python3 split_passages_into_phrases.py
   ```
   → public/data/passages-for-phrase-work/{level}-{topic}.txt 生成

2. 日本語フレーズJSONテンプレート生成
   ```bash
   python3 prepare_japanese_phrase_template.py \
       --passage public/data/passages-for-phrase-work/{level}-{topic}.txt \
       --output public/data/dictionaries/{level}-{topic}-template.json
   ```

3. 日本語訳を追加
    ├─ {level}-{topic}-template.json を開く
    ├─ 各フレーズの "ja" フィールドに日本語訳を記入
    └─ 保存: public/data/dictionaries/{level}-{topic}.json

4. JSON検証
    ```bash
    # JSON構文チェック
    jq . public/data/dictionaries/{level}-{topic}.json
    ```

┌─────────────────────────────────────────────────────────┐
│ Phase 5: 統合・動作確認 (5-10分)                        │
└─────────────────────────────────────────────────────────┘

1. ローカル環境で動作確認
    ```bash
    cd /path/to/project
    npm run dev
    ```
    
    確認項目:
    ├─ 長文読解モードでパッセージが表示される
    ├─ セグメント分割が適切
    ├─ 音声読み上げが動作
    ├─ 辞書機能が動作（日本語訳表示）
    └─ 未学習単語の抽出が動作

┌─────────────────────────────────────────────────────────┐
│ Phase 6: コミット・デプロイ (5分)                       │
└─────────────────────────────────────────────────────────┘

1. Git操作
    ```bash
    git add public/data/passages/{level}-{topic}.txt
    git add public/data/dictionaries/{level}-{topic}.json
    
    git commit -m "feat: Add {level}-{topic} passage
    
    Created new passage for {level} level.
    - Word count: {XXXX} words
    - Integrated {XX} vocabulary words
    - Topics: {list main topics}
    - Coverage contribution: +{X.XX}%
    
    Quality checks: ✓ Grammar ✓ Formatting ✓ Indentation ✓ Dictionary"
    
    git push
    ```

2. デプロイ
    ```bash
    npm run build
    npm run deploy
    ```
```
```

#### ⚠️ 重要なフォーマット規則
```
Section Header

    This is the first line of a paragraph with 4-space indentation.
This is the second line with no indentation.
This is the third line with no indentation.

    New paragraph starts with 4-space indentation again.
Continuation lines have no indentation.
```

#### 🛠️ 便利なコマンド集

```bash
# 全パッセージの品質チェック
cd scripts && python3 passage_quality_check.py --all

# 未使用語彙の確認
cd scripts && cat output/vocab_unused_all-words.txt | head -100

# フレーズカバレッジレポート
cd scripts && python3 phrase_coverage_report.py

# 語彙カバレッジレポート（レマ版）
cd scripts && python3 vocab_coverage_lemma.py
```

#### ✅ 完了チェックリスト（各Phase終了時）

**Phase 1完了:**
- [ ] レベル・トピック決定
- [ ] 現在のカバー率記録
- [ ] テンプレートファイル作成

**Phase 2完了:**
- [ ] 目標語数達成
- [ ] 段落インデント正しい（4スペース）
- [ ] Em dash使用（—）
- [ ] 自然な英語表現（テンプレート感なし）

**Phase 3完了:**
- [ ] passage_quality_check.py 実行済み・エラーなし
- [ ] 語彙カバレッジ向上確認
- [ ] 文法・句読点チェック完了

**Phase 4完了:**
- [ ] フレーズ分割実行済み
- [ ] 日本語訳JSON作成済み
- [ ] JSON構文エラーなし

**Phase 5完了:**
- [ ] ローカル環境で表示確認
- [ ] セグメント分割確認
- [ ] 辞書機能動作確認
- [ ] 音声読み上げ確認

**Phase 6完了:**
- [ ] Git commit実行
- [ ] デプロイ成功
- [ ] 本番環境で動作確認

---

### 4. バグ修正

#### 📖 参照ドキュメント
1. `24-testing-strategy.md` - テスト戦略
2. 該当機能の仕様書（`01-26`シリーズ）
3. UI関連なら `UI_DEVELOPMENT_GUIDELINES.md`

#### 🔄 実装フロー
```
1. 問題の特定
   ├─ エラーメッセージ確認
   ├─ 再現手順の確認
   └─ 影響範囲の特定

2. 原因調査
   ├─ 該当コードの読解
   ├─ 仕様書との照合
   └─ 関連コンポーネント確認

3. 修正実装
   ├─ 最小限の変更
   ├─ 既存機能への影響最小化
   └─ ガイドライン遵守（UI変更の場合）

4. テスト
   ├─ バグ再現しないこと確認
   ├─ 関連機能の動作確認
   └─ リグレッションテスト

5. ドキュメント更新
   └─ 必要に応じて仕様書・ガイドライン更新
```

#### ✅ 完了チェックリスト
- [ ] バグ再現しない
- [ ] 関連機能に影響なし
- [ ] ガイドライン遵守（該当する場合）
- [ ] `npm run build` エラーなし

---

### 5. 新機能の追加

#### 📖 参照ドキュメント
1. `01-project-overview.md` - プロジェクト全体像
2. 関連する機能仕様書（`02-14`シリーズ）
3. `15-data-structures.md` - データ構造
4. `16-storage-strategy.md` - ストレージ戦略
5. `UI_DEVELOPMENT_GUIDELINES.md` - UI実装規則

#### 🔄 実装フロー
```
1. 要件定義
   ├─ 機能の目的・ターゲットユーザー
   ├─ 既存機能との統合ポイント
   └─ データ構造の設計

2. 設計
   ├─ コンポーネント構成
   ├─ 状態管理方法
   ├─ データフロー
   └─ UI/UXデザイン

3. 実装
   ├─ TypeScript/React実装
   ├─ CSS（変数使用必須）
   ├─ データ処理ロジック
   └─ ストレージ連携

4. テスト
   ├─ 単体テスト
   ├─ 統合テスト
   ├─ ライト/ダークモード
   └─ レスポンシブ表示

5. ドキュメント作成
   ├─ 機能仕様書（新規または既存更新）
   ├─ データ構造仕様更新
   └─ README更新

6. デプロイ
   └─ 23-deployment.md参照
```

#### ✅ 完了チェックリスト
- [ ] 機能仕様書作成/更新
- [ ] UI実装ガイドライン遵守
- [ ] データ構造ドキュメント更新
- [ ] ライト/ダークモード対応
- [ ] レスポンシブ対応
- [ ] テスト完了
- [ ] デプロイ成功

---

### 6. データ追加（単語・フレーズ）

#### 📖 必須参照ドキュメント
1. **`19-junior-high-vocabulary.md`** - ⚠️ 中学受験単語仕様（10カテゴリ定義）
2. **`DATA_MANAGEMENT_GUIDE.md`** - ⚠️ データ管理・型安全性ガイド
3. `20-junior-high-phrases.md` - 中学受験フレーズ
4. `15-data-structures.md` - データ構造
5. `public/data/constants.json` - 定数定義（一元管理）

#### 🔄 実装フロー
```
1. 定数確認（一元管理）
   └─ public/data/constants.json で最新の10カテゴリ・難易度定義を確認

2. データ形式確認
   ├─ CSV形式（7列: 語句,読み,意味,語源等解説,関連語,関連分野,難易度）
   ├─ 10カテゴリシステム（厳密一致必須）
   └─ 難易度定義（beginner/intermediate/advanced）

3. カテゴリ確認（重要）
   ├─ constants.json または 19-junior-high-vocabulary.md で確認
   │   1. 言語基本（厳格: 代名詞・冠詞・前置詞・接続詞・be動詞・助動詞・基本副詞のみ）
   │   2. 学校・学習
   │   3. 日常生活
   │   4. 人・社会
   │   5. 自然・環境
   │   6. 食・健康
   │   7. 運動・娯楽
   │   8. 場所・移動
   │   9. 時間・数量
   │   10. 科学・技術
   ├─ 必ず上記10個のいずれか1つを使用
   └─ カテゴリ名は厳密一致（スペース・表記に注意）

4. データ作成
   ├─ 重複チェック
   ├─ カテゴリー分類（10カテゴリから1つ選択）
   ├─ 難易度設定（beginner/intermediate/advanced）
   └─ CSV形式エスケープ（カンマ・改行は引用符で囲む）

5. ファイル配置
   ├─ public/data/vocabulary/junior-high-entrance-words.csv
   └─ public/data/vocabulary/junior-high-entrance-phrases.csv

6. 自動分類（既存データ修正時）
   ├─ 推奨: python3 scripts/classify_words_by_meaning.py（意味ベース・厳格）
   └─ レガシー: python3 scripts/normalize_categories_to_10.py

7. データ検証（必須）
   ├─ npm run validate（ビルド前検証を手動実行）
   ├─ TypeScriptランタイムバリデーション（ブラウザConsole確認）
   └─ エラー0件を確認

8. 動作確認
   ├─ 和訳クイズで表示確認
   ├─ スペルクイズで表示確認
   ├─ 学習設定でカテゴリフィルタ確認（10個+「全ての分野」）
   └─ ブラウザのConsoleで警告がないか確認
```

#### ⚠️ 絶対遵守事項
- **関連分野は必ず10カテゴリのいずれか1つ**（複数指定禁止）
- カテゴリ名は厳密一致（例: 「学校学習」❌ → 「学校・学習」✅）
- CSV内のカンマは必ず引用符で囲む（例: `"word1: 意味1, word2: 意味2"`）
- **データ追加後は必ず `npm run validate` で検証**
- **ビルド前に `npm run build` で自動検証が実行される**

#### 🔒 型安全性チェックポイント

**TypeScript側**:
- `src/types.ts`の`OFFICIAL_CATEGORIES`が定数定義
- `src/utils.ts`の`parseCSV`でランタイムチェック
- 不正なカテゴリはブラウザConsoleに警告表示

**Python側**:
- `public/data/constants.json`から定数読み込み
- `scripts/validate_all_data.py`でビルド前検証
- エラーがあればビルド停止

**一元管理**:
- `public/data/constants.json`が真実の情報源
- TypeScript/Python両方から参照

#### ✅ 完了チェックリスト
- [ ] CSV形式正しい（7列）
- [ ] 重複なし
- [ ] カテゴリーが10個のいずれか（constants.json準拠）
- [ ] カテゴリー名が厳密一致
- [ ] 難易度適切（beginner/intermediate/advanced）
- [ ] `npm run validate` 実行済み（エラー0件）
- [ ] ローカル環境で動作確認済み
- [ ] ブラウザConsoleで警告なし
- [ ] 学習設定でカテゴリが正しく表示

---

## 🚀 デプロイメントワークフロー

### 参照: `23-deployment.md`

#### 標準デプロイ手順
```bash
# 1. ビルド
npm run build

# 2. ローカルプレビュー
npm run preview
# → http://localhost:4173 で確認

# 3. デプロイ
npm run deploy
# または
gh-pages -d dist
```

#### ✅ デプロイ前チェックリスト
- [ ] `npm run build` エラーなし
- [ ] ローカルプレビューで動作確認
- [ ] ライトモード確認
- [ ] ダークモード確認
- [ ] 主要機能の動作確認
- [ ] コンソールエラーなし

---

## 📚 ドキュメント体系の理解

### 主要ドキュメント階層
```
docs/
├── README.md                          # ドキュメント目次
├── AI_WORKFLOW_INSTRUCTIONS.md        # このファイル
├── QUICK_REFERENCE.md                 # クイックリファレンス
├── QUALITY_CHECKLIST.md               # 品質チェックリスト統合
│
├── 01-26: 機能仕様書（番号付き）
│   ├── 01-project-overview.md
│   ├── 02-translation-quiz.md
│   ├── 03-spelling-quiz.md
│   ├── ...
│   └── 26-final-report.md
│
├── ガイドライン（作業別）
│   ├── UI_DEVELOPMENT_GUIDELINES.md         ⚠️ UI作業時必読
│   ├── NEW_HORIZON_GRAMMAR_GUIDELINES.md    ⚠️ 文法問題作成時必読
│   ├── NEW_HORIZON_VERB_FORM_GUIDELINES.md
│   ├── NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md
│   ├── PASSAGE_CREATION_GUIDELINES.md       ⚠️ 長文作成時必読
│   ├── PASSAGE_QUALITY_GUIDE.md
│   └── PASSAGE_PHRASE_JSON_CREATION_GUIDE.md
│
└── その他ガイド
    ├── AWS_MIGRATION_GUIDE.md
    ├── BETA_LAUNCH_GUIDE.md
    └── VS_CODE_SIMPLE_BROWSER_GUIDE.md
```

### ドキュメント選択フローチャート
```
指示を受ける
    │
    ├─ UI関連？
    │   └─→ UI_DEVELOPMENT_GUIDELINES.md 必読
    │
    ├─ 文法問題？
    │   ├─ 文並び替え → NEW_HORIZON_GRAMMAR_GUIDELINES.md
    │   ├─ 動詞変化   → NEW_HORIZON_VERB_FORM_GUIDELINES.md
    │   └─ 穴埋め     → NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md
    │
    ├─ 長文パッセージ？
    │   └─→ PASSAGE_CREATION_GUIDELINES.md 必読
    │
    ├─ 新機能？
    │   └─→ 01-project-overview.md + 該当機能仕様書
    │
    └─ デプロイ？
        └─→ 23-deployment.md
```

---

## 🎯 AI作業効率化のベストプラクティス

### 1. 指示受領時の初期アクション
```
1. 作業タイプを特定（UI/文法/長文/バグ/新機能/データ）
2. 該当ワークフローセクションを参照
3. 必須ドキュメントをリストアップ
4. 実装フローに従って進行
```

### 2. 並列作業の活用
複数の独立した作業は並列実行：
- 複数ファイルの読み込み
- 複数箇所の同時編集（`multi_replace_string_in_file`）
- 複数のバリデーション

### 3. チェックリスト駆動開発
各ワークフローの完了チェックリストを必ず確認し、すべての項目をクリアしてから完了報告。

### 4. ドキュメント更新の習慣
- 新機能追加時は仕様書作成/更新
- ガイドライン変更時は該当ドキュメント更新
- `25-changelog.md` への記録

---

## 🛠️ スクリプト作成時の必須プロセス

### 📋 新規スクリプト作成完了時のチェックリスト

**すべての新規スクリプトについて、作成完了時に以下を必ず実施すること：**

#### 1. スクリプト内ドキュメント
- [ ] 先頭にdocstring追加（用途・機能・使用方法）
- [ ] 主要関数にコメント追加
- [ ] 実行例をコメントで記載

#### 2. scripts/README.mdへの追加
- [ ] スクリプト名と用途を記載
- [ ] 実行方法（コマンド例）
- [ ] 出力例
- [ ] 使用例・ワークフロー

#### 3. 該当する運用ガイドへの追加
- [ ] **Vocabulary関連** → `DATA_MANAGEMENT_GUIDE.md`
- [ ] **パッセージ関連** → `DATA_MANAGEMENT_GUIDE.md`
- [ ] **文法問題関連** → `NEW_HORIZON_GRAMMAR_GUIDELINES.md` または `DATA_MANAGEMENT_GUIDE.md`
- [ ] **フレーズ翻訳関連** → `DATA_MANAGEMENT_GUIDE.md`
- [ ] **その他** → 適切なガイドラインに追加、または新規作成

#### 4. QUICK_REFERENCE.mdへの追加
- [ ] クイックコマンドセクションに追加
- [ ] 該当するワークフローセクションに追加

#### 5. 実行例・トラブルシューティング
- [ ] 典型的な実行例を記載
- [ ] 想定されるエラーと解決策を記載
- [ ] 出力例のスクリーンショットまたはサンプル

### 🔄 スクリプト複雑度による判定基準

#### 🔴 高複雑度（即座にドキュメント化必須）
- 100行以上のコード
- 複数のファイルを処理
- データ構造を変更
- 自動バックアップ機能あり
- 他のスクリプトから呼び出される

**例**: 
- `classify_words_by_meaning.py`
- `split_passages_into_phrases.py`
- `expand_verb_form_questions.py`

**対応**: 作成完了時に即座に上記チェックリストを完了

#### 🟡 中複雑度（2回目の使用時にドキュメント化）
- 50-100行のコード
- 単一ファイルを処理
- 検証・レポート生成

**例**:
- `validate_grammar_questions.py`
- `passage_quality_check.py`

**対応**: 2回目に使用した時点でドキュメント化を提案

#### 🟢 低複雑度（5回以上使用でドキュメント化）
- 50行未満
- ワンタイム処理
- 簡単なデータ変換

**対応**: 使用頻度が高くなった時点でドキュメント化を提案

### 💡 ドキュメント化提案のタイミング

**以下の状況では必ず提案すること：**

1. **スクリプト作成完了時**（高複雑度の場合）
   ```
   「このスクリプトは複雑で再利用可能性が高いです。
   以下をドキュメント化しましょう：
   - scripts/README.mdに追加
   - DATA_MANAGEMENT_GUIDE.mdに詳細を記載
   - QUICK_REFERENCE.mdにクイックコマンドとして追加」
   ```

2. **複雑な作業完了時**
   ```
   「この作業は複数のステップを要しました。
   次回から効率化するため、以下をドキュメント化しましょう：
   - 作業手順書の作成
   - 該当ガイドラインへの追加
   - チェックリストの作成」
   ```

3. **データ構造変更時**
   ```
   「データ構造を変更しました。
   以下を記録しましょう：
   - Migration guideの作成
   - 15-data-structures.mdの更新
   - 既存データの移行スクリプト作成」
   ```

4. **同じ作業を2回以上実施した時**
   ```
   「この作業は2回目です。
   今後も発生する可能性があるため、以下を検討しましょう：
   - 自動化スクリプトの作成
   - ワークフローのドキュメント化
   - チェックリストの作成」
   ```

5. **バグ修正完了時**
   ```
   「このバグは特定の条件で再発する可能性があります。
   トラブルシューティングセクションに追加しましょう。」
   ```

### 📊 定期メンテナンス（月次）

**AIアシスタントは月初に以下を提案すること：**

```bash
# 1. 全スクリプトをリストアップ
ls scripts/*.py

# 2. scripts/README.mdに記載されているか確認
# 3. 該当する運用ガイドにリンクされているか確認
# 4. 使用頻度が高いスクリプトを特定（git logから）
# 5. ドキュメント化されていないスクリプトを洗い出し
```

**チェック項目**:
- [ ] 新規スクリプトがドキュメント化されているか
- [ ] 既存スクリプトのドキュメントが最新か
- [ ] 使用頻度の高いスクリプトが適切に整理されているか
- [ ] トラブルシューティングが充実しているか
- [ ] TypeScript定数とPython定数が同期しているか（constants.json基準）
- [ ] ビルド前検証が正常動作しているか（`npm run validate`）

---

## 🔒 型安全性・データ整合性の維持（常時遵守）

### 定数変更時の必須手順

**10分野システムやカテゴリを変更する場合**:

1. **constants.jsonを更新**（真実の情報源）
   - `public/data/constants.json`の`categories.values`を編集

2. **TypeScript型定義を同期**
   - `src/types.ts`の`OFFICIAL_CATEGORIES`を更新
   - 型エクスポートを確認

3. **Pythonスクリプトを確認**
   - `scripts/validate_all_data.py`がconstants.jsonから読み込むため自動同期
   - `scripts/classify_words_by_meaning.py`は手動更新が必要

4. **ドキュメントを更新**
   - `docs/19-junior-high-vocabulary.md`
   - `docs/DATA_MANAGEMENT_GUIDE.md`

5. **検証**
   ```bash
   # データ検証
   npm run validate
   
   # TypeScriptビルド
   npm run build
   
   # ブラウザConsoleで警告確認
   npm run dev
   ```

### データ追加時の型安全性チェック

**CSVファイル追加・編集時**:

1. **ビルド前検証を実行**
   ```bash
   npm run validate
   ```

2. **エラーがある場合**
   - 10分野不適合 → `python3 scripts/classify_words_by_meaning.py`
   - 難易度不適合 → 該当ファイルを手動修正

3. **成功したらビルド**
   ```bash
   npm run build  # prebuildフックで自動検証
   ```

4. **ランタイムチェック**
   - `npm run dev`でローカル起動
   - ブラウザのConsoleで`[データ整合性警告]`がないか確認

### 型定義の変更履歴

| 日付 | 変更内容 | 影響範囲 |
|------|---------|---------|
| 2025-11-27 | 型安全性強化: リテラル型導入、ランタイムバリデーション追加 | src/types.ts, src/utils.ts |
| 2025-11-27 | 定数の一元管理: constants.json作成 | public/data/constants.json |
| 2025-11-27 | ビルド前検証: validate_all_data.py追加 | scripts/validate_all_data.py, package.json |

---

## 🔄 継続的改善

### このドキュメント自体の更新
- 新しい作業タイプが発生したら追加
- ワークフローに問題があれば改善
- チェックリストに不足項目があれば追加

### フィードバックループ
```
作業実施 → 問題発見 → ワークフロー改善 → ドキュメント更新 → 次回作業効率化
```

---

## 📞 緊急時の対応

### ビルドエラー
1. `npm run build` のエラーメッセージ確認
2. TypeScript型エラーなら該当ファイル修正
3. CSS変数未定義なら `src/index.css` または `src/App.css` 確認

### デプロイ失敗
1. `23-deployment.md` 参照
2. GitHub Pagesの設定確認
3. ビルドファイル（`dist/`）の存在確認

### ダークモード表示異常
1. `UI_DEVELOPMENT_GUIDELINES.md` のチェックリスト確認
2. CSS変数使用しているか確認（ハードコード色がないか）
3. `src/App.css` の `.dark-mode` セクション確認

---

**最終更新**: 2025年11月27日  
**バージョン**: 3.0.0 - 型安全性・データ整合性パイプライン追加
