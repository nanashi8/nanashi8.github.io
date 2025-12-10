# 無効ファイル修正計画

**作成日**: 2025年12月9日  
**対象**: 9ファイル（485問のプレースホルダー）  
**目標**: 段階的に高品質な問題データへ置き換え

---

## 📊 現状分析

### 無効化されているファイル

| ファイル | 文法項目 | 問題数 | 優先度 | 推定工数 |
|---------|---------|--------|--------|---------|
| `grammar_grade2_unit2.json` | 未来表現 (will/be going to) | 60 | 🔴 高 | 3-4時間 |
| `grammar_grade2_unit3.json` | 助動詞 (must/have to) | 60 | 🔴 高 | 3-4時間 |
| `grammar_grade2_unit4.json` | 不定詞 (to + 動詞) | 50 | 🟡 中 | 3-4時間 |
| `grammar_grade2_unit5.json` | 動名詞 (-ing) | 60 | 🟡 中 | 3-4時間 |
| `grammar_grade2_unit6.json` | 接続詞 (when/if/because/that) | 80 | 🔴 高 | 4-5時間 |
| `grammar_grade2_unit7.json` | 比較級・最上級 | 85 | 🟡 中 | 4-5時間 |
| `grammar_grade2_unit8.json` | There is/are | 60 | 🟢 低 | 3-4時間 |
| `grammar_grade2_unit9.json` | 受動態 (be + 過去分詞) | 60 | 🔴 高 | 3-4時間 |
| `grammar_grade3_unit7.json` | 仮定法 (If I were) | 15 | 🟢 低 | 1-2時間 |

**合計**: 530問、推定28-35時間

---

## 🎯 優先順位付け基準

### 1. 教育的重要性
- **高**: 中学2年必修項目（未来表現、助動詞、接続詞、受動態）
- **中**: 応用文法（不定詞、動名詞、比較級）
- **低**: 発展項目（仮定法、There構文）

### 2. 学習順序
- 中2 Unit 2 → Unit 3 → ... の順に学習するため、若い番号を優先

### 3. 問題数
- 問題数が少ないものを先に完了させて、早期成果を出す

---

## 📅 段階的実施計画

### 🚀 Phase 1: クイックウィン（1-2週間）

**目標**: 最も影響の大きい3ファイルを修正

#### Week 1
**1.1 grammar_grade2_unit2.json - 未来表現（60問）**
- 日数: 2日
- 優先理由: 中2最初の重要文法、使用頻度高
- アプローチ:
  ```
  Day 1: fillInBlank (15問) + sentenceOrdering (15問)
  Day 2: paraphrase (15問) + verbForm (10問) + conversation (5問)
  ```

**1.2 grammar_grade2_unit3.json - 助動詞（60問）**
- 日数: 2日
- 優先理由: 日常会話で頻出
- アプローチ: Unit 2と同様の分割作業

**1.3 grammar_grade3_unit7.json - 仮定法（15問）**
- 日数: 1日
- 優先理由: 問題数が少なく、早期完了可能
- アプローチ: sentenceOrdering問題6-20のみ修正

**成果**: 3ファイル（135問）を有効化

---

### 🔥 Phase 2: 中核文法（2-4週間）

**目標**: 使用頻度の高い中核文法を修正

#### Week 2-3
**2.1 grammar_grade2_unit6.json - 接続詞（80問）**
- 日数: 3日
- 優先理由: 複文作成の基礎
- 分割:
  ```
  Day 1: when/if節 (30問)
  Day 2: because/that節 (30問)
  Day 3: 複合問題 (20問)
  ```

**2.2 grammar_grade2_unit9.json - 受動態（60問）**
- 日数: 2日
- 優先理由: 高校入試頻出
- 分割:
  ```
  Day 1: 基本受動態 (30問)
  Day 2: 応用・時制変化 (30問)
  ```

**成果**: +2ファイル（140問）、累計5ファイル（275問）

---

### 💪 Phase 3: 応用文法（4-6週間）

**目標**: 応用的な文法項目を修正

#### Week 4-5
**3.1 grammar_grade2_unit4.json - 不定詞（50問）**
- 日数: 3日
- 分割:
  ```
  Day 1: 名詞的用法 (20問)
  Day 2: 形容詞的・副詞的用法 (20問)
  Day 3: 混合問題 (10問)
  ```

**3.2 grammar_grade2_unit5.json - 動名詞（60問）**
- 日数: 2日
- 分割:
  ```
  Day 1: 動名詞基本 (30問)
  Day 2: 不定詞との使い分け (30問)
  ```

**成果**: +2ファイル（110問）、累計7ファイル（385問）

---

### 🏁 Phase 4: 完成（6-8週間）

**目標**: 残りの文法項目を完了

#### Week 6-7
**4.1 grammar_grade2_unit7.json - 比較級・最上級（85問）**
- 日数: 3日
- 分割:
  ```
  Day 1: 比較級 (30問)
  Day 2: 最上級 (30問)
  Day 3: 原級・混合 (25問)
  ```

**4.2 grammar_grade2_unit8.json - There is/are（60問）**
- 日数: 2日
- 分割:
  ```
  Day 1: 肯定文・否定文 (30問)
  Day 2: 疑問文・応用 (30問)
  ```

**成果**: 全9ファイル（485問）完了 🎉

---

## 🛠️ 作業プロセス（1ファイルあたり）

### Step 1: 準備（15分）
```bash
# ガイドラインを確認
cat docs/guidelines/GRAMMAR_DATA_QUALITY_GUIDELINES.md

# 現在の品質状態を確認
npm run check:grammar-quality

# ファイルをエディタで開く
code public/data/grammar/grammar_grade2_unitX.json
```

### Step 2: 問題タイプ別作成（2-3時間）

#### fillInBlank（穴埋め）- 15問 × 4分 = 60分
```json
{
  "id": "g2-u2-fib-001",
  "type": "fillInBlank",
  "japanese": "私は明日東京へ行きます。",  // ← 英文の日本語訳
  "sentence": "I ____ go to Tokyo tomorrow.",
  "choices": ["will", "am", "was"],
  "correctAnswer": "will",
  "difficulty": "beginner",
  "explanation": "未来のことを表すにはwillを使います。tomorrow（明日）があるので未来形です。",
  "hint": "未来を表す助動詞"
}
```

#### sentenceOrdering（並べ替え）- 15問 × 3分 = 45分
```json
{
  "id": "g2-u2-so-001",
  "type": "sentenceOrdering",
  "japanese": "彼女は来週京都を訪れる予定です。",
  "words": ["is", "going", "to", "visit", "Kyoto", "next", "week", "she"],
  "correctAnswer": "She is going to visit Kyoto next week.",
  "difficulty": "intermediate",
  "grammarPoint": "be going to + 動詞の原形",
  "hint": "be going toの語順"
}
```

#### paraphrase（言い換え）- 15問 × 4分 = 60分
```json
{
  "id": "g2-u2-para-001",
  "type": "paraphrase",
  "japanese": "私は明日テニスをするつもりです。",
  "originalSentence": "I will play tennis tomorrow.",
  "question": "I ____ tennis tomorrow.",
  "correctAnswer": "am going to play",
  "choices": ["am going to play", "played", "am playing"],
  "difficulty": "intermediate",
  "explanation": "willとbe going toは未来表現として言い換え可能です。"
}
```

#### verbForm（動詞変化）- 10問 × 3分 = 30分
```json
{
  "id": "g2-u2-vf-001",
  "type": "verbForm",
  "japanese": "彼は明日サッカーをします。",
  "sentence": "He ____ soccer tomorrow.",
  "verb": "play",
  "choices": ["will play", "plays", "played"],
  "correctAnswer": "will play",
  "difficulty": "beginner",
  "explanation": "tomorrowがあるので未来形will playを使います。"
}
```

#### conversation（会話）- 5問 × 5分 = 25分
```json
{
  "id": "g2-u2-conv-001",
  "type": "conversation",
  "japanese": "明日何をしますか。",
  "dialogue": [
    { "speaker": "A", "text": "What ____ you ____ tomorrow?" },
    { "speaker": "B", "text": "I will visit my grandmother." }
  ],
  "question": "空欄に入る語句を選びなさい。",
  "choices": ["will / do", "are / doing", "did / do"],
  "correctAnswer": "will / do",
  "difficulty": "intermediate",
  "explanation": "未来の予定を尋ねるときはWhat will you do?を使います。"
}
```

### Step 3: レビュー・検証（30分）
```bash
# 自動検証
npm run validate:grammar

# 手動チェック
# - 日本語訳が自然か
# - 英文が文法的に正しいか
# - 選択肢が適切か
# - 難易度設定が適切か
```

### Step 4: テスト（15分）
```bash
# 開発サーバーで動作確認
npm run dev

# ブラウザで実際に問題を解いてみる
# - 表示が正しいか
# - 正解判定が正しいか
# - 説明が分かりやすいか
```

### Step 5: コミット（10分）
```bash
# ファイルの有効化フラグを削除
# "enabled": false の行を削除

# 検証
npm run check:grammar-quality

# コミット
git add public/data/grammar/grammar_grade2_unitX.json
git commit -m "fix: grammar_grade2_unitX.json プレースホルダーを実問題に修正

- 60問の実問題データを作成
- 文法用語を適切な日本語訳に置き換え
- enabled: false フラグを削除して有効化

品質スコア: 100%"

git push
```

---

## 🤖 AI支援ワークフロー

### 効率化のためのAI活用

#### 1. 問題文の一括生成
```python
# scripts/generate_grammar_questions.py
import openai
import json

def generate_questions(unit_topic, count=15):
    """
    AI APIを使って問題文を生成
    """
    prompt = f"""
    中学2年生向けの{unit_topic}の問題を{count}問作成してください。
    
    要件:
    - 日常的なシーン（学校、家族、趣味など）
    - 自然な日本語訳
    - 適切な難易度（beginner, intermediate, advanced）
    - 明確な選択肢（1つの正解、2つの誤答）
    
    出力形式: JSON配列
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return json.loads(response.choices[0].message.content)

# 使用例
questions = generate_questions("未来表現 (will/be going to)", 15)
```

#### 2. 人間レビュー
- AIが生成した問題を1問ずつレビュー
- 不自然な表現を修正
- 文法的な誤りをチェック
- 難易度を調整

#### 3. バリデーション
```bash
npm run validate:grammar
```

---

## 📊 進捗管理

### GitHub Projectsでタスク管理

**ボード構成:**
```
📋 Backlog
  - [ ] grammar_grade2_unit2 (未来表現)
  - [ ] grammar_grade2_unit3 (助動詞)
  - [ ] ...

🚧 In Progress
  - [ ] grammar_grade2_unit2 - fillInBlank (7/15)

✅ Done
  - [x] grammar_grade3_unit7 (仮定法)
```

### 進捗レポート（週次）

```markdown
## 週次レポート Week X

### 完了
- ✅ grammar_grade2_unit2.json (60問)
- ✅ grammar_grade2_unit3.json (60問)

### 進行中
- 🚧 grammar_grade2_unit6.json (35/80問)

### 品質メトリクス
- 修正問題数: 120/485 (24.7%)
- 有効ファイル数: 23/30 (76.7%)
- 品質スコア: 100% (有効ファイルのみ)

### 次週予定
- grammar_grade2_unit6.json 完了
- grammar_grade2_unit9.json 開始
```

---

## 🎯 成功基準

### 各ファイルの完了条件

1. ✅ **全問題が実データに置き換えられている**
   - プレースホルダー文字列: 0件
   - 文法用語: 0件

1. ✅ **品質検証に合格**
   ```bash
   npm run validate:grammar  # エラー0件
   npm run check:grammar-quality  # スコア100%
   ```

1. ✅ **人間による動作確認**
   - ブラウザで全問題タイプを表示
   - 正解判定が正しく動作
   - 説明が分かりやすい

1. ✅ **enabled フラグを削除**
   - `"enabled": false` の行を削除
   - ユニット選択肢に表示される

### プロジェクト全体の完了条件

- ✅ 9ファイル全て有効化
- ✅ 485問全て実問題化
- ✅ 品質スコア: 100% (全30ファイル)
- ✅ CI/CDパイプライン: 全てグリーン

---

## 💡 ベストプラクティス

### 1. 一貫性の維持
- 同じ文法項目内で同じスタイルを使用
- 難易度の段階的な上昇
- 類似問題の適度な分散

### 2. 多様性の確保
- 主語: I, You, He, She, We, They をバランスよく
- 肯定文・否定文・疑問文を混在
- 時制: 現在・過去・未来を適切に配置

### 3. 学習効果の最大化
- 基本 → 応用の順序
- 頻出パターンを重点的に
- 間違えやすいポイントを explanation で補足

### 4. レビューの徹底
```bash
# 作成後の必須チェック
1. 文法的正確性
2. 自然な日本語
3. 適切な難易度
4. 明確な explanation
5. 自動検証合格
```

---

## 📅 タイムライン概要

```
Week 1-2:   Phase 1 (3ファイル、135問) ✅
Week 2-4:   Phase 2 (2ファイル、140問) ✅
Week 4-6:   Phase 3 (2ファイル、110問) ✅
Week 6-8:   Phase 4 (2ファイル、145問) ✅
Week 8:     最終検証・ドキュメント更新 ✅

合計: 約8週間（2ヶ月）
```

---

## 🚀 開始方法

```bash
# 1. この計画を確認
cat docs/plans/PLACEHOLDER_UNITS_RECOVERY_PLAN.md

# 2. Phase 1開始
# grammar_grade2_unit2.json から着手

# 3. 進捗を記録
# GitHub Issuesで週次レポート作成
```

---

**最終更新**: 2025年12月9日  
**次回レビュー**: Phase 1完了時
