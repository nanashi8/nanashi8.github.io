# 重要構文追加実装計画

## 現状分析

### 現在実装されている文法項目(30ファイル)
- Grade 1: 基礎文法(be動詞、一般動詞、助動詞can、現在進行形、過去形など) - 10ユニット
- Grade 2: 中級文法(過去進行形、未来、助動詞、不定詞、動名詞、接続詞、比較、受動態など) - 10ユニット  
- Grade 3: 上級文法(受動態、現在完了、関係代名詞、分詞、仮定法、間接疑問文、比較など) - 10ユニット

### 不足している重要構文

#### 高優先度(中学必修)
1. **It is ~ that ... (強調構文)** - Grade 3で必要
2. **so ~ that ... (結果)** - Grade 3で必要
3. **too ~ to ... (~すぎて...できない)** - Grade 3で必要  
4. **~ enough to ... (十分~...できる)** - Grade 3で必要
5. **ask/tell/want ~ to ... (人に...するよう頼む/言う/望む)** - Grade 2-3で必要
6. **It is ~ for ... to ... (人が...するのは~だ)** - Grade 3で必要

#### 中優先度(頻出表現)
7. **not only ~ but also ...** - Grade 3で推奨
8. **both ~ and ...** - Grade 2-3で推奨
9. **either ~ or ...** - Grade 2-3で推奨
10. **neither ~ nor ...** - Grade 3で推奨
11. **would like to ...** - Grade 2で推奨
12. **used to ...** - Grade 3で推奨

#### 低優先度(発展)
13. **make/let/have ~ do ... (使役)** - Grade 3発展
14. **see/hear ~ do/doing ... (知覚動詞)** - Grade 3発展

## 実装方針

### オプション1: 既存ファイルへの追加(推奨)
各ファイルの問題数を調整して重要構文を組み込む

- **Grade 2 Unit 4 (不定詞)**: 現在50問 → ask/tell/want ~ toを追加
- **Grade 3 Unit 4 (不定詞の応用)**: It is ~ for ... to、too ~ to、enough toを追加
- **Grade 2 Unit 6 (接続詞)**: so ~ that、not only ~ but alsoを追加
- **Grade 2 Unit 7 (比較)**: both ~ and、either ~ orを追加
- **Grade 3 Unit 7 (仮定法)**: neither ~ nor、used toを追加

### オプション2: 新規ユニットファイル作成
`grammar_grade3_unit10.json` - 重要構文総合

## 詳細実装計画

### Phase 1: 高優先度構文の追加(即時実施)

#### 1. Grade 2 Unit 4 (不定詞) の拡張
**現状**: 50問 (fillInBlank: 15, sentenceOrdering: 15, paraphrase: 15, conversation: 5)
**追加内容**:
- ask ~ to (5問)
- tell ~ to (5問)  
- want ~ to (5問)
**新構成**: 65問に増加

#### 2. Grade 3 Unit 4 (不定詞の応用) の再構成
**現状**: 60問 (同じパターンの繰り返しが多い)
**追加内容**:
- It is ~ for ... to ... (10問)
- too ~ to ... (10問)
- enough to ... (10問)
**新構成**: 現在の汎用的な問題を削減し、構文特化型に再編成

#### 3. Grade 2 Unit 6 (接続詞) の拡張
**現状**: 60問
**追加内容**:
- so ~ that ... (10問)
- not only ~ but also ... (5問)
**新構成**: 75問に増加

### Phase 2: 中優先度構文の追加(第2フェーズ)

#### 4. Grade 2 Unit 7 (比較) の拡張
**追加内容**:
- both ~ and ... (5問)
- either ~ or ... (5問)

#### 5. Grade 3 Unit 7 (仮定法) の拡張
**追加内容**:
- neither ~ nor ... (5問)
- used to ... (10問)
- would like to ... (5問)

### Phase 3: 発展構文の追加(オプショナル)

#### 6. Grade 3 新規ユニット作成
`grammar_grade3_unit10.json` - 使役動詞・知覚動詞
- make ~ do (10問)
- let ~ do (10問)
- have ~ do (5問)
- see ~ do/doing (10問)
- hear ~ do/doing (10問)
- 計55-60問

## 実装スケジュール

### 即時実施(Phase 1)
1. Grade 2 Unit 4: ask/tell/want ~ to追加 (15問追加)
2. Grade 3 Unit 4: It is for to/too to/enough to追加 (30問置き換え)
3. Grade 2 Unit 6: so that/not only but also追加 (15問追加)

**総追加問題数**: 約60問

### 第2フェーズ(1週間以内)
4. Grade 2 Unit 7: both and/either or追加 (10問追加)
5. Grade 3 Unit 7: neither nor/used to/would like追加 (20問追加)

**総追加問題数**: 約30問

### オプション(必要に応じて)
6. Grade 3 Unit 10新規作成: 使役・知覚動詞 (60問新規)

## 構文の説明方針

すべての重要構文には以下を明記:
- **「構文として覚えること」**という文言を追加
- 各構文の基本形と意味
- 具体的な使用例
- 間違えやすいポイント

例:
```
"explanation": "ask + 人 + to + 動詞の原形で「人に...するよう頼む」という構文として覚えること。She asked me to help her.「彼女は私に手伝ってくれるよう頼んだ」。"
```

## 実装優先順位

### 最優先(今すぐ)
1. ✅ ask/tell/want ~ to (Grade 2 Unit 4)
2. ✅ too ~ to / enough to (Grade 3 Unit 4)
3. ✅ It is for to (Grade 3 Unit 4)

### 高優先(今週中)
4. ⏳ so ~ that (Grade 2 Unit 6)
5. ⏳ not only but also (Grade 2 Unit 6)

### 中優先(来週)
6. ⏳ both and / either or (Grade 2 Unit 7)
7. ⏳ used to / would like (Grade 3 Unit 7)

### 低優先(余裕があれば)
8. ⬜ 使役・知覚動詞 (新規ユニット)

## 問題数の管理

現在の総問題数: 約1,790問(30ファイル × 平均60問)
追加後の総問題数: 約1,880-1,950問

各ファイルの問題数上限: 80問程度まで許容
