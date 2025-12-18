# NEW HORIZON準拠 穴埋め問題作成ガイドライン

## ⚠️ 🚨 必読：単元構成の確認（作業開始前）

**このガイドラインを使用する前に必ず確認:**

📄 [`docs/references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md`](../../references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md)

- ❌ Grade 2: Unit 8, 9は存在しません（Unit 0-7のみ）
- ❌ Grade 3: Unit 7, 8, 9は存在しません（Unit 0-6のみ）
- ✅ 検証: `./scripts/validate-unit-structure.sh`

---

## 📚 概要

このドキュメントは、東京書籍『NEW HORIZON English Course』（令和3年度版/令和7年度対応）に準拠した穴埋め問題を作成するための標準ガイドラインです。

**対象教材**: NEW HORIZON English Course（東京書籍）
**対応年度**: 令和3年度版（令和7年度使用教科書）
**問題形式**: 穴埋め選択（Fill-in-the-Blank）
**データ形式**: JSON

---

## 🎯 教育的目標

### コアコンセプト
- **文法の孤立**: 各問題は単一の文法項目（前置詞・冠詞・接続詞など）に焦点を当てる
- **文脈重視**: 文全体の意味を理解した上で適切な語を選ぶ力を養う
- **段階的進行**: 学年・単元に沿った難易度設定
- **実用性**: 中学生が日常的に使う表現を優先
- **紛らわしい選択肢**: 学習者が混同しやすい語を含める

### 学習効果
1. 前置詞・冠詞・接続詞などの機能語の理解強化
1. 文脈に応じた適切な語の選択能力の向上
1. コロケーション（語と語の自然な組み合わせ）の習得
1. NEW HORIZON教科書との完全連動

---

## 📖 NEW HORIZON カリキュラム構成

### 公式リソース

東京書籍は以下の公式資料を提供しています：

**年間指導計画作成資料**（各学年）
- URL: https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/#eigo
- 提供形式: PDF, Word, Excel
- 内容: 単元ごとの配当時数、主な学習活動、評価規準、文法項目詳細

**更新情報**:
- 最終更新: 2025年3月19日（令和7年度版）
- 定期的な更新あり

---

## 📊 学年別文法カリキュラム（穴埋め問題）

### 1年生

**Unit 1-2: 基本前置詞（in/on/at/to/from）**
- 場所の前置詞（in the room, on the desk, at school）
- 時の前置詞（in May, on Monday, at 7 o'clock）
- 移動の前置詞（go to school, come from Japan）

**Unit 3: 冠詞（a/an/the）**
- 不定冠詞（a book, an apple）
- 定冠詞（the sun, the school）
- 無冠詞（play soccer, at home）

**Unit 4: 疑問詞（what/who/when/where/how）**
- What（What is this? What do you like?）
- Who（Who is he? Who are you?）
- When（When do you study? When is your birthday?）
- Where（Where is the school? Where do you live?）
- How（How are you? How do you go?）

**Unit 5: 頻度の副詞（always/usually/often/sometimes/never）**
- 位置（一般動詞の前、be動詞の後）
- 意味の違い

**Unit 6: 接続詞（and/but/or/because）**
- 並列（and）
- 対比（but）
- 選択（or）
- 理由（because）

**Unit 7: 代名詞（I/my/me/mine, he/his/him/his）**
- 主格・所有格・目的格・所有代名詞

### 2年生

**Unit 1: 前置詞の拡張（for/with/without/by）**
- 目的（for you, for breakfast）
- 随伴（with my friend, without money）
- 手段（by bus, by email）

**Unit 2: 接続詞の拡張（when/if/that/before/after）**
- 時（when I was young, before I go, after I eat）
- 条件（if it rains）
- 名詞節（that he is kind）

**Unit 3: 比較級・最上級と前置詞（than/of/in）**
- 比較級（taller than, more beautiful than）
- 最上級（the tallest of, the most beautiful in）

**Unit 4: 不定詞と前置詞（to/for）**
- 目的（to study, for studying）
- 対象（for you to study）

**Unit 5: 動名詞と前置詞（of/in/at）**
- 前置詞+動名詞（good at playing, interested in reading）

**Unit 6: 接続詞 as（理由・時・様態）**
- 理由（as I was tired）
- 時（as I walked）
- 様態（as you know）

### 3年生

**Unit 1: 現在完了と前置詞（for/since）**
- 期間（for three years, for a long time）
- 起点（since last year, since I was young）

**Unit 2: 受動態と前置詞（by/with）**
- 行為者（by my father, by many people）
- 手段・道具（with a pen, with a knife）

**Unit 3: 関係代名詞と前置詞**
- 前置詞+関係代名詞（the house in which, the person with whom）
- 文末の前置詞（the house which I live in）

**Unit 4: 分詞と前置詞**
- 分詞構文と前置詞の組み合わせ

**Unit 5: 間接疑問文と接続詞**
- 疑問詞節（I know what he likes, I don't know where he lives）

**Unit 6: 仮定法と接続詞（if）**
- 仮定法過去（If I were you, If I had money）

---

## 🔧 データ構造仕様

### JSON構造

```json
{
  "grade": 1,
  "totalQuestions": 24,
  "categories": [
    {
      "category": "カテゴリ名（日本語）",
      "grammarPoint": "grammar-point-id",
      "questions": [
        {
          "id": "fb-g1-grammar-001",
          "japanese": "日本語文",
          "sentence": "英語文（空欄は ____ で表示）",
          "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
          "correctAnswer": "正解の語",
          "difficulty": "beginner|intermediate|advanced",
          "explanation": "詳細な解説（150-250文字）",
          "hint": "短いヒント（20-40文字）"
        }
      ]
    }
  ]
}
```

### フィールド詳細

#### grade（必須）
- 型: number
- 値: 1, 2, 3
- 説明: 対象学年

#### totalQuestions（必須）
- 型: number
- 説明: 合計問題数

#### category（必須）
- 型: string
- 説明: 文法カテゴリ名（日本語）
- 例: "時の前置詞（at/on/in）", "冠詞（a/an/the）", "接続詞（when/if）"

#### grammarPoint（必須）
- 型: string
- 説明: 文法項目ID（kebab-case）
- 例: "preposition-time", "article", "conjunction-time"

#### id（必須）
- 型: string
- フォーマット: `fb-g{学年}-{文法略称}-{連番3桁}`
- 例: "fb-g1-prep-time-001", "fb-g2-conj-015", "fb-g3-rel-pron-023"
- 説明: 問題の一意識別子

#### japanese（必須）
- 型: string
- 説明: 日本語の意味文
- 要件:
  - 自然な日本語表現
  - 句点は省略可
  - 中学生が理解できる語彙

#### sentence（必須）
- 型: string
- 説明: 英語文（空欄は `____` で表示）
- 要件:
  - 空欄は必ず1箇所
  - 空欄の前後にスペースを入れる
  - 文末にピリオド/疑問符を付ける

#### choices（必須）
- 型: string[]
- 長さ: 4
- 説明: 選択肢（正解1つ+誤答3つ）
- 要件:
  - 紛らわしい選択肢を含める
  - 同じ品詞・似た機能の語を含める
  - アルファベット順不要

#### correctAnswer（必須）
- 型: string
- 説明: 正解の語
- 要件: choices配列内に存在する値

#### difficulty（必須）
- 型: string
- 値: "beginner", "intermediate", "advanced"
- 目安:
  - beginner: 単元導入期・基本用法
  - intermediate: 単元中盤・応用用法
  - advanced: 単元まとめ・複合用法

#### explanation（必須）
- 型: string
- 長さ: 150-250文字
- 説明: 詳細な解説
- 必須要素:
  1. なぜその語を選ぶか
  1. 文法ルール・用法の説明
  1. 他の選択肢が不適切な理由
  1. 関連する文法事項・コロケーション

#### hint（必須）
- 型: string
- 長さ: 20-40文字
- 説明: 短いヒント
- 例: "時刻 → at", "曜日・日付 → on", "場所の中 → in"

---

## ✅ 作成ルール

### 1. 文法項目の孤立

**✅ 良い例**:
```json
{
  "id": "fb-g1-prep-time-001",
  "japanese": "私は7時に起きます",
  "sentence": "I get up ____ 7 o'clock.",
  "choices": ["at", "on", "in", "to"],
  "correctAnswer": "at"
}
```
焦点: 時の前置詞（時刻 → at）

**❌ 悪い例**:
```json
{
  "sentence": "I get up at 7 and go ____ school.",
  "choices": ["at", "to", "in", "on"]
}
```
問題点: 時の前置詞と移動の前置詞が混在し、焦点がぼやける

### 2. 選択肢の設計

**✅ 良い選択肢**:
```json
{
  "sentence": "I get up ____ 7 o'clock.",
  "choices": ["at", "on", "in", "to"],
  "correctAnswer": "at"
}
```
理由: すべて前置詞で、時間表現に使えそうなもの（学習者が混同しやすい）

**❌ 悪い選択肢**:
```json
{
  "sentence": "I get up ____ 7 o'clock.",
  "choices": ["at", "happy", "running", "because"]
}
```
問題点: 異なる品詞が混在し、前置詞の理解を測定できない

### 3. 難易度設定

**beginner（初級）**:
- 単元導入期の基本用法
- シンプルな文構造
- 頻出前置詞・接続詞（at, on, in, to, and, but）
- 例: "I go ____ school." (to/at/in/on)

**intermediate（中級）**:
- 単元中盤の応用用法
- やや複雑な文構造
- やや難しい前置詞・接続詞（with, without, because, when）
- 例: "I study English ____ my friend." (with/and/to/for)

**advanced（上級）**:
- 単元まとめの複合用法
- 複雑な文構造
- 難しい前置詞・接続詞（since, as, although, despite）
- 例: "I have lived here ____ I was young." (since/for/when/because)

### 4. 解説の書き方

**必須要素**:
1. **正解の理由**（なぜその語を選ぶか）
1. **文法ルール・用法**（一般的なルールの説明）
1. **誤答の理由**（他の選択肢が不適切な理由）
1. **関連事項**（覚えておくべき関連文法・コロケーション）

**✅ 良い解説例**:
```
時刻(○時○分)を表すときはatを使います。At 7 o'clockで「7時に」という意味です。時刻はピンポイントの時点なのでatです。Onは曜日・日付、Inは月・年・季節などの長い時間に使います。Get upは「起きる」という重要な句動詞です。
```

**❌ 悪い解説例**:
```
正解はatです。時刻だからです。
```
問題点: 理由が不十分で、学習者が理解できない

### 5. ヒントの書き方

**✅ 良いヒント**:
- "時刻 → at"
- "曜日・日付 → on"
- "月・年・季節 → in"
- "場所の中 → in"
- "表面 → on"

**❌ 悪いヒント**:
- "よく考えてください"（抽象的すぎる）
- "答えはatです"（答えそのもの）

---

## 📝 カテゴリ別作成ガイド

### 1年生

#### 時の前置詞（at/on/in）

**対象単元**: Unit 1-2
**問題数**: 4-6問

**作成ポイント**:
- at: 時刻（at 7 o'clock, at noon, at night）
- on: 曜日・日付（on Monday, on May 5th, on my birthday）
- in: 月・年・季節（in May, in 2025, in spring, in the morning）

**選択肢設計**:
```json
{
  "choices": ["at", "on", "in", "to"]
}
```

**紛らわしいポイント**:
- at night vs. in the morning
- on my birthday vs. in May

#### 場所の前置詞（in/on/at/to）

**対象単元**: Unit 2-3
**問題数**: 4-6問

**作成ポイント**:
- in: 場所の中（in the room, in Japan, in the box）
- on: 表面（on the desk, on the wall, on the floor）
- at: 地点（at school, at home, at the station）
- to: 移動先（go to school, come to Japan）

**選択肢設計**:
```json
{
  "choices": ["in", "on", "at", "to"]
}
```

#### 冠詞（a/an/the）

**対象単元**: Unit 3
**問題数**: 5-7問

**作成ポイント**:
- a: 子音で始まる語（a book, a pen, a cat）
- an: 母音で始まる語（an apple, an egg, an orange）
- the: 特定のもの（the sun, the school, the teacher）
- 無冠詞: スポーツ・科目・食事（play soccer, study English, have lunch）

**選択肢設計**:
```json
{
  "choices": ["a", "an", "the", "（無冠詞）"]
}
```

**注意点**: 無冠詞の選択肢は空文字列 `""` ではなく、日本語で `"（無冠詞）"` と表記

#### 接続詞（and/but/or/because）

**対象単元**: Unit 6
**問題数**: 4-6問

**作成ポイント**:
- and: 並列（I like soccer and baseball.）
- but: 対比（I like soccer, but I don't like baseball.）
- or: 選択（Do you like soccer or baseball?）
- because: 理由（I like soccer because it's fun.）

**選択肢設計**:
```json
{
  "choices": ["and", "but", "or", "because"]
}
```

### 2年生

#### 接続詞（when/if/that/before/after）

**対象単元**: Unit 2-5
**問題数**: 6-8問

**作成ポイント**:
- when: 時（When I was young, I lived in Tokyo.）
- if: 条件（If it rains, I will stay home.）
- that: 名詞節（I think that he is kind.）
- before: 〜の前に（Before I go to bed, I brush my teeth.）
- after: 〜の後に（After I eat breakfast, I go to school.）

**選択肢設計**:
```json
{
  "choices": ["when", "if", "that", "because"]
}
```

#### 比較級・最上級の前置詞（than/of/in）

**対象単元**: Unit 8
**問題数**: 4-6問

**作成ポイント**:
- than: 比較級（taller than, more beautiful than）
- of: 最上級の範囲（the tallest of the three）
- in: 最上級の範囲（the tallest in my class）

**選択肢設計**:
```json
{
  "choices": ["than", "of", "in", "to"]
}
```

#### 前置詞+動名詞（at/in/of/for）

**対象単元**: Unit 6-7
**問題数**: 5-7問

**作成ポイント**:
- good at -ing: 〜が得意（good at playing soccer）
- interested in -ing: 〜に興味がある（interested in reading books）
- fond of -ing: 〜が好き（fond of listening to music）
- thank you for -ing: 〜してくれてありがとう（thank you for helping me）

**選択肢設計**:
```json
{
  "choices": ["at", "in", "of", "for"]
}
```

### 3年生

#### 現在完了の前置詞（for/since）

**対象単元**: Unit 1
**問題数**: 5-7問

**作成ポイント**:
- for: 期間（for three years, for a long time, for two hours）
- since: 起点（since last year, since I was young, since 2020）

**選択肢設計**:
```json
{
  "choices": ["for", "since", "from", "in"]
}
```

**紛らわしいポイント**:
- for three years vs. since 2020
- for a long time vs. since last year

#### 受動態の前置詞（by/with）

**対象単元**: Unit 2
**問題数**: 4-6問

**作成ポイント**:
- by: 行為者（by my father, by many people, by the teacher）
- with: 手段・道具（with a pen, with a knife, with a computer）

**選択肢設計**:
```json
{
  "choices": ["by", "with", "from", "to"]
}
```

#### 関係代名詞と前置詞

**対象単元**: Unit 5
**問題数**: 5-7問

**作成ポイント**:
- 前置詞+関係代名詞（the house in which I live）
- 文末の前置詞（the house which I live in）

**選択肢設計**:
```json
{
  "choices": ["in", "at", "on", "to"]
}
```

---

## 🚫 禁止事項

### 1. 教科書範囲外の文法

**❌ 禁止例**:
- 1年生で関係代名詞を出題
- 2年生で仮定法を出題
- 3年生で過去完了形を出題

### 2. 複数の文法項目の混在

**❌ 禁止例**:
```json
{
  "sentence": "I go to school ____ 7 o'clock ____ Monday.",
  "choices": ["at/on", "on/at", "in/on", "at/in"]
}
```
問題点: 空欄が2つあり、焦点がぼやける

### 3. 不適切な選択肢

**❌ 禁止例**:
```json
{
  "sentence": "I go ____ school.",
  "choices": ["to", "happy", "running", "because"]
}
```
問題点: 異なる品詞が混在し、前置詞の理解を測定できない

### 4. 曖昧な文脈

**❌ 禁止例**:
```json
{
  "sentence": "I see him ____ the park.",
  "choices": ["in", "at", "on", "to"]
}
```
問題点: in/atの両方が正解になりうる（in the park = 公園の中、at the park = 公園で）

---

## 🎓 品質チェックリスト

作成後、以下を確認してください：

- [ ] 文法項目が単一で明確か
- [ ] 選択肢が同じ品詞・似た機能の語か
- [ ] 正解が文法的に正しく、文脈に適切か
- [ ] 解説が150-250文字で、4要素を含むか
- [ ] ヒントが20-40文字で簡潔か
- [ ] 難易度設定が単元進行に適切か
- [ ] IDが重複していないか
- [ ] JSONフォーマットが正しいか
- [ ] NEW HORIZON単元に対応しているか
- [ ] 中学生が理解できる語彙・表現か
- [ ] 文脈が明確で、正解が一意に定まるか

---

## 📚 参考リソース

### 公式資料
- [東京書籍 年間指導計画作成資料](https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/#eigo)
- NEW HORIZON English Course 教師用指導書

### 関連ガイドライン
- `NEW_HORIZON_GRAMMAR_GUIDELINES.md`（文並び替え問題）
- `NEW_HORIZON_VERB_FORM_GUIDELINES.md`（動詞変化問題）

---

## 📅 更新履歴

- 2025-11-25: 初版作成
  - 穴埋め問題の基本構造定義
  - 学年別カリキュラム整理
  - 作成ルール・品質基準策定

---

## 📧 問い合わせ

このガイドラインに関する質問・提案は、プロジェクト管理者までご連絡ください。
