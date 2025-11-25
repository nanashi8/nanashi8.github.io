# NEW HORIZON準拠 動詞変化問題作成ガイドライン

## 📚 概要

このドキュメントは、東京書籍『NEW HORIZON English Course』（令和3年度版/令和7年度対応）に準拠した動詞変化問題を作成するための標準ガイドラインです。

**対象教材**: NEW HORIZON English Course（東京書籍）
**対応年度**: 令和3年度版（令和7年度使用教科書）
**問題形式**: 動詞変化選択（Verb Form Selection）
**データ形式**: JSON

---

## 🎯 教育的目標

### コアコンセプト
- **文法の孤立**: 各問題は単一の文法項目（時制・人称・形態）に焦点を当てる
- **段階的進行**: 学年・単元に沿った難易度設定
- **実用性**: 中学生が日常的に使う動詞表現を優先
- **紛らわしい選択肢**: 学習者が混同しやすい形態を含める

### 学習効果
1. 動詞の形態変化の理解強化
2. 時制・人称・態の使い分け習得
3. 文脈に応じた正確な動詞選択能力の向上
4. NEW HORIZON教科書との完全連動

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

## 📊 学年別文法カリキュラム（動詞変化）

### 1年生

**Unit 1-2: be動詞の変化（am/is/are）**
- 主語による使い分け（I am / You are / He is）
- 短縮形（I'm / You're / He's）
- 否定形（am not / isn't / aren't）

**Unit 2: 一般動詞の基本形**
- 原形（I play / You study）
- 主語による形の不変（I/You/We/They）

**Unit 3: 三人称単数現在形（-s/-es）**
- 規則変化：-s（plays, runs, eats）
- 規則変化：-es（子音+y → -ies: studies, tries）
- 規則変化：-es（-s/-sh/-ch/-x/-o: goes, washes, watches）
- 不規則変化：has（have）, does（do）

**Unit 4: 助動詞との組み合わせ**
- can + 原形（can play, can study）
- do/does + 原形（do play, does study）

**Unit 5: 現在進行形（be + -ing）**
- 規則変化：-ing（playing, studying, running）
- e除去：-ing（making, taking, writing）
- 子音重複：-ing（running, swimming, sitting）

**Unit 7: 過去形（-ed）**
- 規則変化：-ed（played, studied, visited）
- 不規則変化：基本形（went, came, had, did, was, were）

### 2年生

**Unit 1: 過去形の拡張**
- 不規則動詞の過去形（saw, made, took, bought, ate）
- 規則変化の復習（-ed）

**Unit 2: be going to + 原形**
- 未来表現（am going to play, is going to study）

**Unit 3: will + 原形**
- 未来表現（will play, will study）

**Unit 4: have to + 原形**
- 義務表現（have to play, has to study）

**Unit 5: 接続詞と時制の一致**
- when/if節（過去形 + 過去形、現在形 + 現在形）

**Unit 6: 不定詞（to + 原形）**
- 名詞的用法（to play, to study）
- 副詞的用法（to play, to study）
- 形容詞的用法（to play, to study）

**Unit 7: 動名詞（-ing）**
- 主語・目的語としての-ing形（playing, studying）

**Unit 8: 比較表現と動詞**
- 比較級・最上級を含む文での動詞形（runs faster, is the fastest）

### 3年生

**Unit 1: 現在完了形（have/has + 過去分詞）**
- 経験（have been, have seen, have visited）
- 継続（have lived, have studied, have known）
- 完了・結果（have finished, have lost, have gone）
- 規則変化：-ed（played, studied, visited）
- 不規則変化：基本形（been, seen, done, gone, taken, eaten）

**Unit 2: 受動態（be + 過去分詞）**
- 現在形受動態（is made, are used, is spoken）
- 過去形受動態（was made, were used, was spoken）
- 助動詞付き受動態（can be made, will be used）

**Unit 3: 現在完了進行形（have/has been + -ing）**
- 継続中の動作（have been playing, has been studying）

**Unit 4: 分詞の形容詞的用法**
- 現在分詞（running boy, sleeping cat）
- 過去分詞（broken window, written book）

**Unit 5: 関係代名詞を含む文での動詞**
- 主格（who plays, which is, that runs）
- 目的格（whom I saw, which I bought）

**Unit 6: 仮定法過去**
- were（If I were you）
- 過去形（If I had, If I could）

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
          "id": "vf-g1-grammar-001",
          "japanese": "日本語文",
          "sentence": "英語文（空欄は ____ で表示）",
          "verb": "原形動詞",
          "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
          "correctAnswer": "正解の動詞形",
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
- 例: "三人称単数（-s/-es）", "過去形（-ed）", "現在完了形"

#### grammarPoint（必須）
- 型: string
- 説明: 文法項目ID（kebab-case）
- 例: "3rd-person-singular", "past-tense", "present-perfect"

#### id（必須）
- 型: string
- フォーマット: `vf-g{学年}-{文法略称}-{連番3桁}`
- 例: "vf-g1-3sg-001", "vf-g2-past-015", "vf-g3-pp-023"
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

#### verb（必須）
- 型: string
- 説明: 動詞の原形
- 例: "play", "study", "go", "be"

#### choices（必須）
- 型: string[]
- 長さ: 4
- 説明: 選択肢（正解1つ+誤答3つ）
- 要件:
  - 紛らわしい選択肢を含める
  - 同じ動詞の異なる形態を含める
  - アルファベット順不要

#### correctAnswer（必須）
- 型: string
- 説明: 正解の動詞形
- 要件: choices配列内に存在する値

#### difficulty（必須）
- 型: string
- 値: "beginner", "intermediate", "advanced"
- 目安:
  - beginner: 単元導入期・基本形
  - intermediate: 単元中盤・応用形
  - advanced: 単元まとめ・複合形

#### explanation（必須）
- 型: string
- 長さ: 150-250文字
- 説明: 詳細な解説
- 必須要素:
  1. なぜその形を選ぶか
  2. 文法ルールの説明
  3. 他の選択肢が不適切な理由
  4. 関連する文法事項

#### hint（必須）
- 型: string
- 長さ: 20-40文字
- 説明: 短いヒント
- 例: "三人称単数現在形は動詞に-sを付ける"

---

## ✅ 作成ルール

### 1. 文法項目の孤立

**✅ 良い例**:
```json
{
  "id": "vf-g1-3sg-001",
  "japanese": "彼は毎日サッカーをします",
  "sentence": "He ____ soccer every day.",
  "verb": "play",
  "choices": ["play", "plays", "played", "playing"],
  "correctAnswer": "plays"
}
```
焦点: 三人称単数現在形の-s

**❌ 悪い例**:
```json
{
  "sentence": "He ____ soccer yesterday and will play tomorrow.",
  "verb": "play",
  "choices": ["play", "plays", "played", "will play"]
}
```
問題点: 時制が複数混在し、焦点がぼやける

### 2. 選択肢の設計

**✅ 良い選択肢**:
```json
{
  "verb": "study",
  "choices": ["study", "studies", "studied", "studying"],
  "correctAnswer": "studies"
}
```
理由: すべて同じ動詞の異なる形態で、学習者が混同しやすい

**❌ 悪い選択肢**:
```json
{
  "verb": "study",
  "choices": ["studies", "plays", "runs", "eats"]
}
```
問題点: 異なる動詞が混在し、動詞変化の理解を測定できない

### 3. 難易度設定

**beginner（初級）**:
- 単元導入期の基本形
- シンプルな主語・述語
- 頻出動詞（be, have, go, play, like, study）
- 例: "I ____ a student." (am/is/are/be)

**intermediate（中級）**:
- 単元中盤の応用形
- 複合的な文構造
- やや難しい動詞（visit, watch, teach, write）
- 例: "She ____ English every day." (teach/teaches/taught/teaching)

**advanced（上級）**:
- 単元まとめの複合形
- 複雑な時制・態
- 不規則動詞・特殊形態
- 例: "They ____ to Tokyo last year." (go/goes/went/gone)

### 4. 解説の書き方

**必須要素**:
1. **正解の理由**（なぜその形を選ぶか）
2. **文法ルール**（一般的なルールの説明）
3. **誤答の理由**（他の選択肢が不適切な理由）
4. **関連事項**（覚えておくべき関連文法）

**✅ 良い解説例**:
```
三人称単数現在形は動詞に-sを付けます。主語がHe（彼＝三人称単数）で、every day（毎日）という現在の習慣を表すため、playにsを付けてplaysとします。I/You/We/Theyならplayのままですが、He/She/Itは必ず-sを付けるルールです。Playedは過去形、playingは進行形なので不適切です。
```

**❌ 悪い解説例**:
```
正解はplaysです。三人称単数だからです。
```
問題点: 理由が不十分で、学習者が理解できない

### 5. ヒントの書き方

**✅ 良いヒント**:
- "三人称単数現在形は動詞に-sを付ける"
- "子音+yで終わる動詞は、yをiに変えてesを付ける"
- "過去形は-edを付ける（規則動詞）"

**❌ 悪いヒント**:
- "よく考えてください"（抽象的すぎる）
- "答えはplaysです"（答えそのもの）

---

## 📝 カテゴリ別作成ガイド

### 1年生

#### 三人称単数現在形（-s/-es）

**対象単元**: Unit 3
**問題数**: 4-6問

**作成ポイント**:
- 規則変化：-s（plays, runs, eats）
- 子音+y：-ies（studies, tries, cries）
- -s/-sh/-ch/-x/-o：-es（goes, washes, watches, fixes）
- 不規則：has（have）

**選択肢設計**:
```json
{
  "verb": "study",
  "choices": ["study", "studies", "studied", "studying"]
}
```

#### 現在進行形（be + -ing）

**対象単元**: Unit 6
**問題数**: 4-6問

**作成ポイント**:
- 規則変化：-ing（playing, studying）
- e除去：-ing（making, taking, writing）
- 子音重複：-ing（running, swimming, sitting）

**選択肢設計**:
```json
{
  "verb": "run",
  "choices": ["run", "runs", "running", "ran"]
}
```

#### 過去形（-ed）

**対象単元**: Unit 7
**問題数**: 5-7問

**作成ポイント**:
- 規則変化：-ed（played, studied, visited）
- 不規則動詞：基本形（went, came, had, did, was, were）

**選択肢設計**:
```json
{
  "verb": "go",
  "choices": ["go", "goes", "went", "gone"]
}
```

### 2年生

#### 未来形（be going to / will）

**対象単元**: Unit 2-3
**問題数**: 5-7問

**作成ポイント**:
- be going to + 原形
- will + 原形
- 主語による be 動詞の変化

**選択肢設計**:
```json
{
  "sentence": "I ____ going to play soccer.",
  "choices": ["am", "is", "are", "be"]
}
```

#### 不定詞・動名詞

**対象単元**: Unit 6-7
**問題数**: 5-7問

**作成ポイント**:
- to + 原形
- -ing形
- 動詞による使い分け（want to / enjoy -ing）

**選択肢設計**:
```json
{
  "verb": "play",
  "choices": ["play", "to play", "playing", "played"]
}
```

### 3年生

#### 現在完了形（have/has + 過去分詞）

**対象単元**: Unit 1
**問題数**: 7-10問

**作成ポイント**:
- 規則変化：-ed（played, studied, visited）
- 不規則変化：基本形（been, seen, done, gone, taken, eaten）
- have/has の使い分け

**選択肢設計**:
```json
{
  "verb": "see",
  "choices": ["see", "saw", "seen", "have seen"]
}
```

#### 受動態（be + 過去分詞）

**対象単元**: Unit 2
**問題数**: 6-8問

**作成ポイント**:
- 現在形受動態（is/are + 過去分詞）
- 過去形受動態（was/were + 過去分詞）
- by の使い方

**選択肢設計**:
```json
{
  "sentence": "This book ____ by many people.",
  "verb": "read",
  "choices": ["read", "reads", "is read", "was read"]
}
```

---

## 🚫 禁止事項

### 1. 教科書範囲外の文法

**❌ 禁止例**:
- 1年生で現在完了形を出題
- 2年生で仮定法を出題
- 3年生で過去完了形を出題

### 2. 複数の文法項目の混在

**❌ 禁止例**:
```json
{
  "sentence": "If I ____ you, I would study harder.",
  "choices": ["am", "was", "were", "be"]
}
```
問題点: 仮定法と時制が混在

### 3. 不適切な選択肢

**❌ 禁止例**:
```json
{
  "verb": "play",
  "choices": ["plays", "eat", "run", "sleep"]
}
```
問題点: 異なる動詞が混在し、動詞変化を測定できない

### 4. 曖昧な文脈

**❌ 禁止例**:
```json
{
  "sentence": "He ____ soccer.",
  "choices": ["play", "plays", "played", "playing"]
}
```
問題点: 時制が特定できない（現在か過去か不明）

---

## 🎓 品質チェックリスト

作成後、以下を確認してください：

- [ ] 文法項目が単一で明確か
- [ ] 選択肢が同じ動詞の異なる形態か
- [ ] 正解が文法的に正しく、文脈に適切か
- [ ] 解説が150-250文字で、4要素を含むか
- [ ] ヒントが20-40文字で簡潔か
- [ ] 難易度設定が単元進行に適切か
- [ ] IDが重複していないか
- [ ] JSONフォーマットが正しいか
- [ ] NEW HORIZON単元に対応しているか
- [ ] 中学生が理解できる語彙・表現か

---

## 📚 参考リソース

### 公式資料
- [東京書籍 年間指導計画作成資料](https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/#eigo)
- NEW HORIZON English Course 教師用指導書

### 関連ガイドライン
- `NEW_HORIZON_GRAMMAR_GUIDELINES.md`（文並び替え問題）
- `NEW_HORIZON_FILL_IN_BLANK_GUIDELINES.md`（穴埋め問題）

---

## 📅 更新履歴

- 2025-11-25: 初版作成
  - 動詞変化問題の基本構造定義
  - 学年別カリキュラム整理
  - 作成ルール・品質基準策定

---

## 📧 問い合わせ

このガイドラインに関する質問・提案は、プロジェクト管理者までご連絡ください。
