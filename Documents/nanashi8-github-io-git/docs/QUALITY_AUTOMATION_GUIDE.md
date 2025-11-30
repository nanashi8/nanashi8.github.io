# 品質自動化ガイド - 全コンテンツ品質保証システム

## 概要

このシステムは、英語学習アプリの全コンテンツ（文法・語彙・長文）の品質を自動的に保証します。
あなたの設計思想と実装に完全対応した品質検証を提供します。

## 🎯 設計思想

### 1. **実装ベースの品質基準**
- データ形式に完全対応（JSON, CSV, TXT）
- 実際のアプリケーション動作を反映
- TypeScriptコンポーネントの期待値に準拠

### 2. **教育的価値の最大化**
- 中学生レベルに適した語彙・文法
- 段階的な難易度設定（beginner → intermediate → advanced）
- 自然な英文構造（フレーズ分割の適切性）

### 3. **継続的品質改善**
- 問題の自動検出と具体的な改善提案
- スコアリングによる品質の定量化
- 重複排除による学習効果の最大化

---

## 📊 品質保証の3つの柱

### 🟦 文法問題（Grammar Questions）
**形式**: JSON  
**検証項目**:
- ✅ 問題文の重複排除（1,800問100%ユニーク）
- ✅ Grade別の品質保証（中1, 中2, 中3）
- ✅ 問題タイプ別検証（verb-form, fill-in-blank, sentence-ordering）

**ツール**: `validate_all_content.py`

### 🟨 語彙・スペル（Vocabulary）
**形式**: CSV（日本語ヘッダー）  
**検証項目**:
- ✅ 単語の重複排除（7,830語100%ユニーク）
- ✅ レベル別語彙の整合性
- ✅ CSV形式の正確性（語句, 読み, 意味, etc.）
- ✅ **プレースホルダー検出**（「手動確認必要」「語源情報を追加してください」等）

**ツール**: 
- `validate_all_content.py` - 重複検証 + プレースホルダー検出
- `fix_vocabulary_duplicates.py` - 自動修正

### 🟩 長文読解（Reading Passages）
**形式**: TXT + JSON（index.json）  
**検証項目**:
- ✅ タイトル・IDの重複排除
- ✅ 文字数要件の遵守
  - beginner: 800-1,500語
  - intermediate: 1,500-2,500語
  - advanced: 2,500-4,000語
- ✅ **英文品質の保証**（NEW!）
  - フォーマット: 段落インデント（4スペース）
  - 文構造: 従属節・前置詞句の自然な配置
  - 語彙多様性: レベル別の期待値達成

**ツール**:
- `validate_all_content.py` - 重複 + 品質スコア
- `validate_passage_quality.py` - 詳細な英文品質検証

### 🟪 UI仕様準拠（UI Specifications）
**形式**: TypeScript/TSX/CSS  
**検証項目**:
- ✅ **カラーシステム**: ハードコードされた色の検出
- ✅ **ScoreBoard仕様**: タブ構成・プラン表示の準拠
- ✅ **語句詳細表示**: 意味フィールド・一括開閉機能
- ✅ **question-nav-row**: フォントサイズ・余白設定
- ✅ **非同期処理**: await使用・setTimeout禁止

**ツール**: `validate_ui_specifications.py`

**参照仕様書**: `docs/UI_IMMUTABLE_SPECIFICATIONS.md`

---

## 🚀 使用方法

### 0. UI仕様検証（推奨：コード変更後）

UI仕様書への準拠を検証:

```bash
python3 scripts/validate_ui_specifications.py
```

**検証項目**:
- カラーシステム（ハードコードされた色の検出）
- ScoreBoard仕様（タブ構成・プラン表示）
- 語句詳細表示（意味フィールド・一括開閉）
- question-nav-row（フォントサイズ・余白）
- 非同期処理（await使用・setTimeout禁止）

**出力例**:
```
============================================================
UI仕様書準拠検証
============================================================

[1/5] カラーシステム検証
  ✓ ハードコードされた色は見つかりませんでした

[2/5] ScoreBoard仕様検証
  ✓ タブ「学習状況」が定義されている
  ✓ プラン表示が詳細版を使用している
  ✓ プラン統計表示が存在する

[3/5] 語句詳細表示検証
  ✓ 語句詳細に意味が表示されている
  ✓ 全選択肢詳細の一括開閉機能が実装されている

[4/5] question-nav-row仕様検証
  ✓ .question-text のフォントサイズ: 28px (28px以上)
  ✓ padding: 6px (6px以下)
  ✓ margin-bottom: 10px (10px以下)

[5/5] 非同期処理検証
  ✓ recordWordSkipをawait
  ✓ updateWordProgressをawait
  ✓ addQuizResultをawait
  ✓ setLastAnswerTimeを呼び出し
  ✓ setTimeoutは使用されていません

============================================================
検証結果サマリー
============================================================

✓ UI仕様書への準拠を確認しました
```

### 1. 統合検証（推奨）

全コンテンツを一括検証:

```bash
python3 scripts/validate_all_content.py
```

**出力例**:
```
【文法問題】
  総計: 1800/1800 = 100.00% ✅

【語彙・スペル】
  総計: 7830/7830 = 100.00% ✅

【長文読解】
  タイトル: 10/10 = 100.0% ✅
  英文品質: 平均 74.6/100 ⚠️
    合格(80点以上): 1/3 (33.3%)
    要改善:
      - beginner-supermarket-shopping: 71.9点
      - intermediate-homestay-america: 72.5点

【総合サマリー】
  全コンテンツ合計: 9,640/9,640 = 100.00%
```

### 2. 長文の詳細品質検証

特定パッセージの英文品質を詳細チェック:

```bash
# 単一ファイル
python3 scripts/validate_passage_quality.py --file beginner-cafe-menu.txt

# レベル別
python3 scripts/validate_passage_quality.py --level intermediate

# 全パッセージ
python3 scripts/validate_passage_quality.py
```

---

## 🔍 品質基準の詳細

### 長文英文品質（80点以上で合格）

#### 1. フォーマット品質 (30%)

**段落インデント**:
```
正しい例:
    This is the first line of a paragraph. (4スペース)
This is the continuation without indentation.

誤った例:
This is missing indentation.  ❌
     This has 5 spaces.  ❌
```

#### 2. コンテンツ品質 (40%)

**文字数要件**:
- beginner: 800-1,500語（不足/超過で減点）
- intermediate: 1,500-2,500語
- advanced: 2,500-4,000語

**語彙多様性**:
- beginner: 40%以上のユニーク語彙率
- intermediate: 45%以上
- advanced: 50%以上

#### 3. 文法構造品質 (30%)

**従属節の配置**:
```
❌ 悪い例:
I was nervous.
when I entered the classroom.

✅ 良い例:
I was nervous when I entered the classroom.
```

**前置詞句の配置**:
```
❌ 悪い例:
I played soccer.
with my friends.

✅ 良い例:
I played soccer with my friends.
```

---

## 📋 プレースホルダー検出

### 検出パターン

語彙CSVファイル内の以下のプレースホルダーを自動検出します:

- `手動確認必要`
- `語源情報を追加してください`
- `語源情報が必要です`
- `[TODO]`
- `[FIXME]`
- `[要確認]`
- `[未入力]`

### 検出方法

```bash
python3 scripts/validate_all_content.py
```

出力例:
```
【🔤 語彙・スペル】
  ⚠️ 100.0%  all-words                           (3282/3282)
      ⚠️ プレースホルダー検出: 284件
        - 行29: 'Mr.' (explanationに'語源情報が必要です')
        - 行30: 'Mrs.' (explanationに'語源情報が必要です')
        ... 他281件
  
  総計: 7830/7830 = 100.00%
  ⚠️ 総プレースホルダー数: 284件 - 要修正!
```

### 修正が必要な理由

プレースホルダーが残っていると:
- 和訳タブで正しい日本語訳が表示されない
- スペルタブで意味不明な説明が表示される
- ユーザー体験が大幅に低下

---

## 🛠️ ワークフロー

### 新規長文パッセージ作成時

1. **作成**: .txt ファイルを作成
2. **index.json 更新**: メタデータ追加
3. **品質検証**: `validate_passage_quality.py --file xxx.txt`
4. **問題修正**: インデント、文構造を改善
5. **再検証**: 80点以上を目指す
6. **統合検証**: `validate_all_content.py`

### リリース前チェック

```bash
# 全検証を実行（exit code 0 = 合格）
python3 scripts/validate_all_content.py && \
python3 scripts/validate_passage_quality.py && \
echo "✅ リリース準備完了"
```

---

## 🎉 まとめ

このシステムにより:

- ✅ **文法**: 1,800問100%ユニーク
- ✅ **語彙**: 7,830語100%ユニーク
- ✅ **長文**: タイトル100%ユニーク + 英文品質スコアリング

**あなたの設計思想**（実装ベースの品質基準、教育的価値、継続的改善）に完全対応した品質保証を実現しています。
