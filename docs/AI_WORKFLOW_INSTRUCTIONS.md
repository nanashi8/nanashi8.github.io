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

#### 🔄 実装フロー（文並び替えの例）
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

#### 📊 データフォーマット
```json
{
  "question": "彼女は毎日学校へ行きます。",
  "words": ["goes", "to", "school", "she", "every", "day"],
  "correctOrder": [3, 0, 1, 2, 4, 5],
  "answer": "She goes to school every day.",
  "grammarPoint": "三人称単数現在形",
  "difficulty": "medium"
}
```

#### ✅ 完了チェックリスト
- [ ] ガイドライン準拠（語数・文法焦点）
- [ ] NEW HORIZON教科書との整合性
- [ ] JSON構文エラーなし
- [ ] totalQuestions正しく更新
- [ ] ローカル環境で動作確認済み

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

4. パッセージ執筆
   ├─ テンプレートに沿って自然な英語で執筆
   ├─ 段落インデント: 各段落の最初の行に4スペース（必須）
   ├─ Em dash使用: — (not - or --)
   ├─ 語彙を自然に統合
   └─ 教育的価値を確保

5. フォーマット確認
   ├─ セクションヘッダー追加
   ├─ 段落字下げ統一（4スペース）
   ├─ 会話文の正しいフォーマット
   └─ 句読点チェック

┌─────────────────────────────────────────────────────────┐
│ Phase 3: 品質チェック (10-15分)                         │
└─────────────────────────────────────────────────────────┘

6. 自動品質チェック実行
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

7. 語彙カバレッジ確認
   ```bash
   cd scripts
   python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv
   ```
   → カバー率の変化を確認（前回: XX.XX% → 今回: YY.YY%）

┌─────────────────────────────────────────────────────────┐
│ Phase 4: フレーズ分割・JSON化 (20-30分)                │
└─────────────────────────────────────────────────────────┘

8. フレーズ分割実行
   ```bash
   cd scripts
   python3 split_passages_into_phrases.py
   ```
   → public/data/passages-for-phrase-work/{level}-{topic}.txt 生成

9. 日本語フレーズJSONテンプレート生成
   ```bash
   python3 prepare_japanese_phrase_template.py \
       --passage public/data/passages-for-phrase-work/{level}-{topic}.txt \
       --output public/data/dictionaries/{level}-{topic}-template.json
   ```

10. 日本語訳を追加
    ├─ {level}-{topic}-template.json を開く
    ├─ 各フレーズの "ja" フィールドに日本語訳を記入
    └─ 保存: public/data/dictionaries/{level}-{topic}.json

11. JSON検証
    ```bash
    # JSON構文チェック
    jq . public/data/dictionaries/{level}-{topic}.json
    ```

┌─────────────────────────────────────────────────────────┐
│ Phase 5: 統合・動作確認 (5-10分)                        │
└─────────────────────────────────────────────────────────┘

12. ローカル環境で動作確認
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

13. Git操作
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

14. デプロイ
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
2. `20-junior-high-phrases.md` - 中学受験フレーズ
3. `15-data-structures.md` - データ構造

#### 🔄 実装フロー
```
1. データ形式確認
   ├─ CSV形式（7列: 語句,読み,意味,語源等解説,関連語,関連分野,難易度）
   ├─ 10カテゴリシステム（厳密一致必須）
   └─ 難易度定義（初級/中級/上級）

2. カテゴリ確認（重要）
   ├─ 19-junior-high-vocabulary.mdで10カテゴリを確認
   │   1. 言語基本
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

3. データ作成
   ├─ 重複チェック
   ├─ カテゴリー分類（10カテゴリから1つ選択）
   ├─ 難易度設定（初級/中級/上級）
   └─ CSV形式エスケープ（カンマ・改行は引用符で囲む）

4. ファイル配置
   ├─ public/data/vocabulary/junior-high-entrance-words.csv
   └─ public/data/vocabulary/junior-high-entrance-phrases.csv

5. カテゴリ正規化（既存データ修正時）
   └─ python3 scripts/normalize_categories_to_10.py

6. バリデーション
   ├─ CSV構文チェック
   ├─ カテゴリー妥当性（10カテゴリに含まれるか）
   └─ 難易度適切性

7. 動作確認
   ├─ 和訳クイズで表示確認
   ├─ スペルクイズで表示確認
   └─ 学習設定でカテゴリフィルタ確認（10個+「全ての分野」）
```

#### ⚠️ 絶対遵守事項
- **関連分野は必ず10カテゴリのいずれか1つ**（複数指定禁止）
- カテゴリ名は厳密一致（例: 「学校学習」❌ → 「学校・学習」✅）
- CSV内のカンマは必ず引用符で囲む（例: `"word1: 意味1, word2: 意味2"`）

#### ✅ 完了チェックリスト
- [ ] CSV形式正しい（7列）
- [ ] 重複なし
- [ ] カテゴリーが10個のいずれか
- [ ] カテゴリー名が厳密一致
- [ ] 難易度適切（初級/中級/上級）
- [ ] ローカル環境で動作確認済み
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

**最終更新**: 2025年11月25日
**バージョン**: 1.0.0
