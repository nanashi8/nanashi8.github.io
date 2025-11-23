# 長文パッセージ フレーズ学習用JSON作成ガイドライン

## 📋 概要

このガイドラインは、英文長文パッセージから高精度なフレーズ学習用JSONファイルを作成するための標準手順を定めています。

**目的**: 
- 文脈を正確に捉えた自然な日本語訳を提供
- 節・句単位で正確に分割されたフレーズデータ
- 単語レベルでの学習支援（単語カード機能）
- 既存UI（ComprehensiveReadingView.tsx）との完全互換性

---

## 🔄 作成フロー（4段階プロセス）

```
Stage 1: 英文パッセージ（.txt）
   ↓
Stage 2: 高精度全訳（.txt）
   ↓
Stage 3: フレーズ分割 + 辞書マッチング
   ↓
Stage 4: フレーズ学習用JSON（.json）
```

---

## Stage 1: 英文パッセージの準備

### ファイル形式
- **保存先**: `public/data/passages/{level}-{topic-slug}.txt`
- **エンコーディング**: UTF-8
- **命名規則**: 
  - `beginner-` (初級)
  - `intermediate-` (中級)
  - `advanced-` (上級)

### 品質基準
- ✅ 4スペースインデント（段落の先頭）
- ✅ セクション見出しを含む（例: "First Day—Meeting Emma"）
- ✅ 会話文の引用符は統一（" "）
- ✅ em dashの使用（—）
- ✅ スペルチェック完了
- ✅ 文法的に正確

### 例
```
An Australian Student Visits Japan—Two Weeks of Cultural Exchange

    When our teacher announced that our class would host an exchange student from Australia for two weeks, everyone felt excited. "Her name is Emma," the teacher explained.

First Day—Meeting Emma

    Emma arrived on a Monday morning in early October.
```

---

## Stage 2: 高精度全訳の作成

### ファイル形式
- **保存先**: `public/data/passages-translations/{passage-id}-ja.txt`
- **命名規則**: 英文ファイル名 + `-ja.txt`
  - 例: `intermediate-exchange-student-australia-ja.txt`

### 翻訳品質基準

#### ✅ 必須要件
1. **段落構造の完全一致**
   - 英文の段落構造をそのまま保持
   - インデント（4スペース）も英文と同じ位置に
   - セクション見出しも翻訳して保持

2. **自然な日本語**
   - 直訳ではなく、意訳を優先
   - 日本語として違和感のない表現
   - 文脈を考慮した適切な訳語選択

3. **文脈の正確性**
   - 前後の文脈を考慮
   - 代名詞の指示対象を明確に
   - 会話文の話者を明確に

4. **一貫性**
   - 同じ用語は同じ訳語で統一
   - 敬体（です・ます）で統一
   - 固有名詞の表記統一

#### ❌ 避けるべき誤り
- 機械翻訳の直訳的表現
- 文脈を無視した単語の羅列
- 段落の統合・分割
- 原文にない情報の追加
- 重要な情報の省略

### 翻訳プロセス

#### Step 1: 全体構造の把握
```
1. 英文全体を通読
2. セクション構成を確認
3. 主要登場人物・トピックを把握
4. 時系列の流れを理解
```

#### Step 2: 段落ごとの翻訳
```
1. 段落の主題を理解
2. 文ごとに翻訳（文脈考慮）
3. 段落全体の流れを確認
4. 日本語として自然か検証
```

#### Step 3: 品質チェック
```
✓ 原文と段落数が一致しているか
✓ インデントが正しく保持されているか
✓ 会話文の話者が明確か
✓ 代名詞が適切に訳されているか
✓ 誤訳・脱落がないか
✓ 日本語として読みやすいか
```

### 翻訳例

#### 英文
```
    When our teacher announced that our class would host an exchange student from Australia for two weeks, everyone felt excited. "Her name is Emma," the teacher explained. "She's the same age as you and wants to learn about Japanese culture and school life. Please make her feel welcome."
```

#### ✅ 良い翻訳
```
    先生が私たちのクラスでオーストラリアからの交換留学生を2週間受け入れると発表した時、みんな興奮しました。「彼女の名前はエマです」と先生は説明しました。「彼女はあなたたちと同じ年齢で、日本の文化と学校生活について学びたいと思っています。彼女を温かく迎えてください」
```

#### ❌ 悪い翻訳例
```
教師が発表した時、私達のクラスはオーストラリアから交換学生をホストします、2週間、全員が興奮を感じました。
```
**問題点**: 直訳的、語順が不自然、「私達」→「私たち」、段落構造無視

---

## Stage 3: フレーズ分割ルール

### 基本原則

#### 1. 文単位での分割（基本）
- ピリオド（.）、疑問符（?）、感嘆符（!）で1文として区切る
- 1文 = 1フレーズが原則

```javascript
// 例
"Everyone felt excited." → 1フレーズ
"What's Australia like?" → 1フレーズ
```

#### 2. 長文の節・句分割（20語以上）
長い文は節・句で分割して理解しやすくする

**分割ポイント:**
- 接続詞の前（when, if, because, although, while 等）
- コンマで区切られた独立した節
- 関係代名詞節の前

```javascript
// 例: 22語の文
"When our teacher announced that our class would host an exchange student from Australia for two weeks, everyone felt excited."

// ↓ 2フレーズに分割

// フレーズ1（17語）
"When our teacher announced that our class would host an exchange student from Australia for two weeks,"

// フレーズ2（3語）
"everyone felt excited."
```

#### 3. 会話文の特殊処理

**⚠️ 重要: 会話形式によって処理が異なる**

**パターンA: Speaker: "..." 形式（1フレーズとして扱う）**
```
Mom: "Good morning! It's time to get up."
↓
❌ NG: 途中で分割しない
✅ OK: 全体を1フレーズとして保持
フレーズ1: Mom: "Good morning! It's time to get up."
```

**理由**: `Speaker: "dialogue"` 形式は会話文として意味的に完結しているため、分割すると文脈が失われる。

**パターンB: 発言 + 伝達部（通常の文として分割）**
```
"Her name is Emma," the teacher explained.
↓
フレーズ1: "Her name is Emma,"
フレーズ2: the teacher explained.
```

**パターンC: 伝達部 + 発言（通常の文として分割）**
```
The teacher said, "Welcome to Japan!"
↓
フレーズ1: The teacher said,
フレーズ2: "Welcome to Japan!"
```

**判別方法:**
```
行頭が "名詞/代名詞:" で始まる → パターンA（1フレーズ）
文中に引用符がある → パターンB/C（通常分割）
```

#### 4. 句読点の処理
句読点は単語として保持（セグメント作成時）

```javascript
words: ["announced", ",", "everyone", "felt", "excited", "."]
```

### フレーズ長の推奨範囲

| レベル | 推奨語数 | 最大語数 |
|--------|----------|----------|
| 初級 (beginner) | 5-10語 | 15語 |
| 中級 (intermediate) | 10-20語 | 25語 |
| 上級 (advanced) | 15-30語 | 40語 |

### 分割判断フローチャート

```
文を読む
  ↓
Speaker: "..." 形式か？
  ↓ YES                    ↓ NO
全体を1フレーズ           語数は20語以上？
                          ↓ YES                    ↓ NO
                      接続詞がある？            そのまま1フレーズ
                      ↓ YES        ↓ NO
                    その前で分割   会話文（パターンB/C）？
                                  ↓ YES  ↓ NO
                                  分割    1フレーズ
```

### ⚠️ 重要な注意事項

#### 長文分割の必須性
**20単語を超える文は必ず分割すること**

理由:
1. 学習者の認知負荷を軽減
2. 単語カードUIの表示制限（40単語が上限）
3. 意味の理解を助ける適切な粒度

**実装上の確認:**
```python
# 分割前の確認
if len(phrase_words) > 20:
    # 接続詞で分割を試みる
    conjunctions = ["when", "if", "because", "although", "while", 
                    "since", "after", "before", "unless", "until", 
                    "as", "though", "whereas"]
    # 分割処理...
```

#### パッセージID・ファイル名の整合性
**passageLoader.ts と実際のファイルが一致していること**

確認方法:
```bash
# 実際のファイル一覧
ls public/data/passages/*.txt

# passageLoader.ts で定義されているID
grep "id:" src/utils/passageLoader.ts
```

**不一致による404エラーを防ぐ:**
- ファイル追加時は必ず `passageLoader.ts` を更新
- ファイル名変更時は対応するIDも変更
- 存在しないファイルへの参照を残さない

---

## Stage 4: フレーズ学習用JSON作成

### データ構造（TypeScript型定義）

```typescript
interface ReadingPassage {
  id: string;                    // パッセージID
  title: string;                 // タイトル（英語）
  level: string;                 // "beginner" | "intermediate" | "advanced"
  theme?: string;                // テーマ（日本語、任意）
  actualWordCount: number;       // 実際の総単語数
  phrases: ReadingPhrase[];      // フレーズ配列
}

interface ReadingPhrase {
  id?: number;                   // フレーズ通し番号（1, 2, 3...）
  english: string;               // 英文フレーズ
  japanese: string;              // 日本語訳（全訳から正確に抽出）
  phraseMeaning: string;         // japanese のエイリアス（後方互換性）
  segments: ReadingSegment[];    // 単語セグメント配列
  grammarPoint?: string;         // 文法ポイント（任意）
}

interface ReadingSegment {
  word: string;                  // 単語（句読点含む）
  meaning: string;               // 意味（辞書から取得）
  isUnknown: boolean;            // 未知語マーク（初期値 false）
}
```

### フレーズ和訳の作成ルール

#### ✅ 必須ルール

**1. 全訳ファイルから正確に抽出**
```
❌ NG: 単語の意味を機械的に結合
"When" (〜の時) + "our" (私たちの) + "teacher" (先生) + ...
→ "〜の時私たちの先生..." (不自然)

✅ OK: 全訳ファイルから該当箇所を正確に抽出
→ "先生が私たちのクラスでオーストラリアからの交換留学生を2週間受け入れると発表した時、"
```

**2. フレーズ境界の正確性**
- 英文フレーズと日本語訳の範囲を一致させる
- 前後のフレーズと重複・欠落がないこと

**3. 自然な日本語の保持**
- 全訳の品質をそのまま維持
- フレーズ単位でも意味が通じること

#### 検証方法

```python
# 全フレーズの和訳を結合 → 全訳と一致するか確認
combined_translation = "".join([phrase["japanese"] for phrase in phrases])
original_translation = open("passages-translations/xxx-ja.txt").read()

# 段落・句読点を除いて比較
assert normalize(combined_translation) == normalize(original_translation)
```

### 単語セグメント作成ルール

#### 1. 単語分解
```python
# スペース区切りで分割
sentence = "When our teacher announced that our class would host an exchange student,"
words = sentence.split()  # ["When", "our", "teacher", ...]
```

#### 2. 句読点の分離
```python
import re

def split_with_punctuation(word):
    # 単語末尾の句読点を検出
    match = re.match(r'^(.+?)([.,!?;:—"]+)$', word)
    if match:
        return [match.group(1), match.group(2)]
    return [word]

# 例
split_with_punctuation("student,") → ["student", ","]
split_with_punctuation("excited.") → ["excited", "."]
```

#### 3. 辞書マッチング

**使用辞書**: `public/data/reading-passages-dictionary.json`

```python
def get_word_meaning(word, dictionary):
    # 1. 基本形（lemma）に変換
    lemma = get_lemma(word.lower())
    
    # 2. 辞書から意味を取得
    if lemma in dictionary:
        return dictionary[lemma]["meaning"]
    
    # 3. 見つからない場合は空文字
    return ""

# Lemma変換ルール
def get_lemma(word):
    word = word.lower()
    
    # -ing形
    if word.endswith("ing"):
        # running → run, making → make
        base = word[:-3]
        if base[-1] == base[-2]:  # 子音の重複
            return base[:-1]
        return base + "e"  # 推測
    
    # -ed形
    if word.endswith("ed"):
        # studied → study, announced → announce
        base = word[:-2]
        if base.endswith("i"):
            return base[:-1] + "y"
        return base
    
    # -s/-es形
    if word.endswith("es"):
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    
    return word
```

#### 4. 句読点と機能語の処理

**句読点の意味は空文字**
```json
{"word": ",", "meaning": "", "isUnknown": false}
{"word": ".", "meaning": "", "isUnknown": false}
```

**機能語の意味（冠詞・代名詞など）**
```json
{"word": "the", "meaning": "", "isUnknown": false}
{"word": "a", "meaning": "", "isUnknown": false}
{"word": "an", "meaning": "", "isUnknown": false}
```

**接続詞・前置詞は意味を記載**
```json
{"word": "when", "meaning": "〜の時", "isUnknown": false}
{"word": "because", "meaning": "なぜなら", "isUnknown": false}
{"word": "from", "meaning": "〜から", "isUnknown": false}
```

### 文法ポイントの付与（オプション）

重要な文法構文がある場合のみ記載

**推奨文法ポイント（受験頻出）:**
- When節（時を表す接続詞）
- If節（条件を表す接続詞）
- 現在完了（継続・経験・完了・結果）
- 関係代名詞（主格・目的格）
- 不定詞（名詞的・形容詞的・副詞的用法）
- 動名詞
- 受動態
- 比較級・最上級
- 間接疑問文
- 分詞の後置修飾

**記載例:**
```json
{
  "id": 1,
  "english": "When our teacher announced that our class would host an exchange student from Australia for two weeks, everyone felt excited.",
  "japanese": "先生が私たちのクラスでオーストラリアからの交換留学生を2週間受け入れると発表した時、みんな興奮しました。",
  "phraseMeaning": "先生が私たちのクラスでオーストラリアからの交換留学生を2週間受け入れると発表した時、みんな興奮しました。",
  "segments": [...],
  "grammarPoint": "When節（時を表す接続詞）/ that節（接続詞）"
}
```

---

## 📁 ファイル配置規則

### ディレクトリ構造
```
public/data/
├── passages/                          # 英文パッセージ（原文）
│   ├── beginner-supermarket-shopping.txt
│   ├── intermediate-exchange-student-australia.txt
│   └── advanced-technology-future.txt
│
├── passages-translations/              # 高精度全訳（日本語）
│   ├── beginner-supermarket-shopping-ja.txt
│   ├── intermediate-exchange-student-australia-ja.txt
│   └── advanced-technology-future-ja.txt
│
├── passages-phrase-learning/          # フレーズ学習用JSON
│   ├── beginner-supermarket-shopping.json
│   ├── intermediate-exchange-student-australia.json
│   └── advanced-technology-future.json
│
└── reading-passages-dictionary.json   # 単語辞書（共通）
```

### ファイル命名の対応
```
passage ID: intermediate-exchange-student-australia

英文:     passages/intermediate-exchange-student-australia.txt
全訳:     passages-translations/intermediate-exchange-student-australia-ja.txt
JSON:     passages-phrase-learning/intermediate-exchange-student-australia.json
```

---

## 🔧 作成スクリプトの要件

### スクリプト: `scripts/convert_passage_to_phrase_json.py`

#### 入力ファイル
1. 英文パッセージ（必須）
2. 全訳ファイル（必須）
3. 単語辞書（必須）

#### 処理フロー
```python
def convert_passage_to_phrase_json(
    passage_file: str,
    translation_file: str,
    dictionary_file: str,
    output_file: str
):
    # Step 1: ファイル読み込み
    english_text = load_passage(passage_file)
    japanese_text = load_translation(translation_file)
    dictionary = load_dictionary(dictionary_file)
    
    # Step 2: 英文をフレーズに分割
    english_phrases = split_into_phrases(english_text)
    
    # Step 3: 日本語訳をフレーズに対応付け
    japanese_phrases = align_translations(english_phrases, japanese_text)
    
    # Step 4: 各フレーズを単語セグメントに分解
    phrases_data = []
    for i, (en, ja) in enumerate(zip(english_phrases, japanese_phrases)):
        segments = create_segments(en, dictionary)
        grammar_point = detect_grammar_point(en)  # オプション
        
        phrases_data.append({
            "id": i + 1,
            "english": en,
            "japanese": ja,
            "phraseMeaning": ja,
            "segments": segments,
            "grammarPoint": grammar_point
        })
    
    # Step 5: ReadingPassage構造で出力
    passage_data = {
        "id": extract_id(passage_file),
        "title": extract_title(english_text),
        "level": extract_level(passage_file),
        "theme": "",  # 手動で追加
        "actualWordCount": count_words(english_text),
        "phrases": phrases_data
    }
    
    # Step 6: JSON出力
    save_json(passage_data, output_file)
    
    # Step 7: 検証
    validate_output(passage_data, japanese_text)
```

#### 検証機能
```python
def validate_output(passage_data, original_translation):
    """出力JSONの品質を検証"""
    
    # 1. 全フレーズの和訳を結合
    combined = "".join([p["japanese"] for p in passage_data["phrases"]])
    
    # 2. 正規化して比較（空白・改行を除去）
    def normalize(text):
        return re.sub(r'\s+', '', text)
    
    assert normalize(combined) == normalize(original_translation), \
        "フレーズ和訳の結合が全訳と一致しません"
    
    # 3. セグメント数の妥当性チェック
    for phrase in passage_data["phrases"]:
        word_count = len([s for s in phrase["segments"] if s["word"] not in ".,!?;:—\""])
        assert 1 <= word_count <= 40, f"セグメント数が異常: {word_count}"
    
    # 4. 必須フィールドの存在確認
    required_fields = ["id", "english", "japanese", "phraseMeaning", "segments"]
    for phrase in passage_data["phrases"]:
        for field in required_fields:
            assert field in phrase, f"必須フィールド {field} が欠落"
    
    print("✅ 検証完了: すべてのチェックをパス")
```

---

## ✅ 品質チェックリスト

### 英文パッセージ
- [ ] UTF-8エンコーディング
- [ ] 4スペースインデント（段落）
- [ ] セクション見出しあり
- [ ] スペル・文法チェック済み
- [ ] 引用符統一（" "）
- [ ] em dash使用（—）

### 全訳ファイル
- [ ] 段落数が英文と一致
- [ ] インデント位置が一致
- [ ] セクション見出しを翻訳
- [ ] 自然な日本語（意訳優先）
- [ ] 文脈を正確に把握
- [ ] 敬体（です・ます）で統一
- [ ] 固有名詞の表記統一
- [ ] 誤訳・脱落なし

### フレーズJSON
- [ ] id, title, level, actualWordCount 設定済み
- [ ] 全フレーズにid（連番）付与
- [ ] english と japanese が対応
- [ ] phraseMeaning と japanese が同一
- [ ] segments 配列が正しく生成
- [ ] 句読点が単語として保持
- [ ] 辞書マッチング完了
- [ ] grammarPoint 適切に付与（任意）
- [ ] フレーズ和訳の結合 = 全訳
- [ ] **20単語超のフレーズがないか確認**
- [ ] **Speaker: "..." 形式が1フレーズになっているか確認**
- [ ] **passageLoader.ts のIDとファイル名が一致しているか確認**

### 検証テスト
- [ ] JSON構文エラーなし
- [ ] TypeScript型定義に準拠
- [ ] 全フレーズ和訳の結合が全訳と一致
- [ ] セグメント数が妥当（1-40語）
- [ ] **全フレーズの単語数が20語以下（例外: Speaker形式）**
- [ ] 辞書にない単語の確認
- [ ] **404エラーが発生しないか（ファイルパス確認）**
- [ ] UI（ComprehensiveReadingView）で表示確認
- [ ] **会話文が途中で切れていないか確認**

---

## 📊 作業工数見積もり

### 1パッセージあたり

| 工程 | 所要時間 | 備考 |
|------|----------|------|
| Stage 1: 英文確認・修正 | 5-10分 | 既存ファイルがある場合 |
| Stage 2: 全訳作成 | 30-60分 | パッセージ長による |
| Stage 3: フレーズ分割判断 | 10-15分 | 手動確認が必要 |
| Stage 4: JSON生成（スクリプト） | 5分 | 自動処理 |
| 検証・修正 | 10-20分 | 品質チェック |
| **合計** | **60-110分** | 1-2時間/パッセージ |

### 全21パッセージ
- **手動作業**: 約21-42時間
- **スクリプト作成**: 3-4時間（初回のみ）
- **総工数**: 24-46時間

---

## 🎯 優先順位と段階的実装

### Phase 1: プロトタイプ（1パッセージ）
1. intermediate-exchange-student-australia を選択
2. 全訳作成（手動、高品質）
3. 最初の10フレーズを手動でJSON化
4. UI表示確認
5. データ構造の最終調整

### Phase 2: スクリプト開発
1. フレーズ分割ロジック実装
2. 辞書マッチング実装
3. 和訳対応付けロジック実装
4. 検証機能実装
5. 5パッセージでテスト

### Phase 3: 全パッセージ変換
1. 残り15パッセージの全訳作成
2. スクリプトで一括変換
3. 手動で和訳を検証・修正
4. 文法ポイント追加
5. 最終品質チェック

---

## 🔍 トラブルシューティング

### よくある問題と解決策

#### 問題1: フレーズ和訳の結合が全訳と一致しない
**原因**: フレーズ境界の誤認識、和訳の一部欠落
**解決**: 
```python
# デバッグ用に差分を表示
import difflib
diff = difflib.unified_diff(
    normalize(combined).splitlines(),
    normalize(original).splitlines()
)
print("\n".join(diff))
```

#### 問題2: 辞書にない単語が多い
**原因**: 専門用語、固有名詞、辞書の不足
**解決**:
```python
# 未登録単語をリストアップ
missing_words = []
for segment in all_segments:
    if not segment["meaning"] and segment["word"].isalpha():
        missing_words.append(segment["word"])

# reading-passages-dictionary.json に追加
```

#### 問題3: 長文の分割位置が不適切
**原因**: 接続詞・関係詞の検出ミス
**解決**: 手動でフレーズ境界を調整（JSON編集）

#### 問題4: 会話文の話者が不明瞭
**原因**: 伝達部の分離ミス
**解決**:
```python
# パターンマッチングで改善
if re.match(r'^".*," .* (said|explained|asked)', sentence):
    # 発言と伝達部を分割
    parts = re.split(r'(" .* (?:said|explained|asked))', sentence)
```

#### 問題5: 会話文が途中で切れる（Speaker: "..." 形式）
**原因**: `Speaker: "dialogue"` 形式を通常の文として処理している
**解決**:
```python
# 会話形式を検出して1フレーズとして扱う
if re.match(r'^[A-Z][^:]+:\s*"', line):
    # 全体を1フレーズとして保持（分割しない）
    phrases.append(create_phrase(line, keep_whole=True))
```

**実装例（passageAdapter.ts）:**
```typescript
// 会話形式（Speaker: "..."）のパターンをチェック
const conversationMatch = paragraph.match(/^([^:]+):\s*"([^"]+)"$/);

if (conversationMatch) {
    // 会話文の場合: 全体を1つのフレーズとして扱う
    const fullText = paragraph.trim();
    // セグメント生成...
    phrases.push({
        english: fullText,
        japanese: '', // 全訳から抽出
        segments: segments,
    });
}
```

#### 問題6: 404エラー（パッセージが読み込めない）
**原因**: `passageLoader.ts` のIDと実際のファイル名が不一致
**解決**:
```bash
# 1. 実際のファイルを確認
ls public/data/passages/*.txt

# 2. passageLoader.ts のIDを確認
grep "id:" src/utils/passageLoader.ts

# 3. 不一致があれば修正
# 例: intermediate-volunteer → intermediate-community-events
```

**予防策:**
- ファイル追加・変更時は必ず `passageLoader.ts` を更新
- デプロイ前に404エラーチェックを実施

#### 問題7: 長文（40単語超）が分割されない
**原因**: 分割ロジックが実装されていない、または接続詞がない
**解決**:
```typescript
// 20単語超の文を接続詞で自動分割
function splitLongSentence(sentence: string): string[] {
    const words = sentence.trim().split(/\s+/);
    if (words.length <= 20) return [sentence];
    
    // 接続詞で分割
    const conjunctions = /\b(when|if|because|although|while|since|after|before)\b/gi;
    // 分割処理...
}
```

**確認方法:**
```bash
# 40単語超のフレーズを検出
grep -o '\S\+' passage.txt | awk 'BEGIN{count=0} /[.!?]/{if(count>40) print NR": "count" words"; count=0} {count++}'
```

---

## 📚 参考資料

### 関連ドキュメント
- `docs/04-reading-comprehension.md` - 長文読解機能仕様書
- `docs/PASSAGE_CREATION_GUIDELINES.md` - パッセージ作成ガイドライン
- `src/types.ts` - TypeScript型定義
- `src/utils/passageAdapter.ts` - 変換ロジック参考実装

### 使用ツール
- `public/data/reading-passages-dictionary.json` - 単語辞書
- `scripts/convert_passage_to_phrase_json.py` - 変換スクリプト（作成予定）
- `src/components/ComprehensiveReadingView.tsx` - UI表示コンポーネント

---

## 📝 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2025-11-23 | 1.0.0 | 初版作成 |
| 2025-11-23 | 1.1.0 | 会話形式処理の明確化、長文分割の必須化、トラブルシューティング追加 |

---

**作成者**: GitHub Copilot  
**最終更新**: 2025年11月23日  
**ステータス**: 正式版
