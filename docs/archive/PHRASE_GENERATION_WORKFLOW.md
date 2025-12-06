# 熟語データ生成ワークフロー

## 概要

高校受験英熟語データを効率的に生成・検証・統合するためのワークフローとツール群。

## ツール構成

### 1. generate_phrases_template.py
**用途**: 熟語データのテンプレート生成

**機能**:
- カテゴリー・難易度・件数を指定してCSVテンプレート生成
- 熟語タイプ（句動詞/慣用句/コロケーション）の指定
- 統計情報とガイドラインの表示

**使用例**:
```bash
# 統計情報を表示
python3 generate_phrases_template.py stats

# テンプレート生成
python3 generate_phrases_template.py generate 言語基本 初級 20 phrasal_verb

# 品質チェックリストを表示
python3 generate_phrases_template.py checklist
```

### 2. validate_phrases.py
**用途**: 熟語データの品質検証

**機能**:
- CSVフォーマット検証
- 必須フィールドチェック
- アクセント記号の検証
- カテゴリー・難易度の妥当性チェック
- 重複チェック（ファイル内 + 既存データ）
- 統計情報の生成

**使用例**:
```bash
# 単独ファイルの検証
python3 validate_phrases.py new-phrases.csv

# 既存データとの重複チェック
python3 validate_phrases.py new-phrases.csv public/data/junior-high-entrance-words.csv
```

### 3. batch_workflow.py
**用途**: バッチ生成ワークフローの管理

**機能**:
- バッチディレクトリの作成
- テンプレート生成の自動化
- バッチ検証の実行
- バッチ統合の実行
- バッチ一覧の表示

**使用例**:
```bash
# バッチ作成
python3 batch_workflow.py create 1 言語基本 初級 20 phrasal_verb

# バッチ検証
python3 batch_workflow.py validate batches/batch-001-言語基本-初級-20

# バッチ統合
python3 batch_workflow.py merge batches/batch-001-言語基本-初級-20

# バッチ一覧表示
python3 batch_workflow.py list
```

### 4. merge_phrases.py
**用途**: 熟語データの統合

**機能**:
- 熟語CSVと既存単語CSVの統合
- 重複チェック
- カテゴリー・難易度別の統計生成

**使用例**:
```bash
python3 merge_phrases.py public/data/new-phrases-100.csv
```

## 標準ワークフロー

### ステップ1: バッチ作成
```bash
# バッチ番号、カテゴリー、難易度、件数、タイプを指定
python3 batch_workflow.py create 1 言語基本 初級 20 phrasal_verb
```

生成されるファイル:
- `batches/batch-001-言語基本-初級-20/template.csv` - データ入力用テンプレート
- `batches/batch-001-言語基本-初級-20/README.md` - バッチ情報とワークフロー

### ステップ2: データ入力
1. `template.csv` を開く
1. `[TODO: ...]` の部分を実際のデータで置き換える
1. 以下の点に注意:
   - 読み仮名にアクセント記号（́）を付ける
   - 語源解説に「〜と〜の組み合わせ」を含める
   - 関連語は2つ以上、読み仮名付きで記載

### ステップ3: 品質検証
```bash
cd batches/batch-001-言語基本-初級-20
python3 ../../validate_phrases.py template.csv ../../public/data/junior-high-entrance-words.csv
```

検証項目:
- ✓ CSVフォーマット
- ✓ 必須フィールド
- ✓ アクセント記号
- ✓ カテゴリー・難易度
- ✓ 重複チェック
- ✓ データ品質

### ステップ4: バッチ統合
```bash
# エラーがなければ統合
python3 batch_workflow.py merge batches/batch-001-言語基本-初級-20
```

統合後:
- `public/data/junior-high-entrance-words-with-phrases.csv` が生成される
- 統合完了マーク `COMPLETED` がバッチディレクトリに作成される

### ステップ5: 本番適用
```bash
# 統合ファイルを確認後、本番環境に適用
mv public/data/junior-high-entrance-words-with-phrases.csv \
   public/data/junior-high-entrance-words.csv
```

## データ生成計画

### 目標: 1,100件の熟語

#### 熟語タイプ別配分
- 句動詞: 500件 (45%)
- 慣用句: 350件 (32%)
- コロケーション: 250件 (23%)

#### 難易度別配分
- 初級: 400件 (36%) - 中学1-2年レベル
- 中級: 400件 (36%) - 中学3年レベル
- 上級: 300件 (27%) - 高校受験レベル

#### カテゴリー別推奨配分
| カテゴリー | 件数 | 比率 |
|-----------|------|------|
| 言語基本 | 165件 | 15% |
| 日常生活 | 165件 | 15% |
| 人・社会 | 165件 | 15% |
| 場所・移動 | 110件 | 10% |
| 時間・数量 | 110件 | 10% |
| 学校・学習 | 110件 | 10% |
| 自然・環境 | 88件 | 8% |
| 食・健康 | 88件 | 8% |
| 運動・娯楽 | 77件 | 7% |
| 科学・技術 | 22件 | 2% |

### バッチ生成戦略

**推奨**: 100件単位でバッチを作成

**Phase 5実行計画**:
1. バッチ1-2: 初級200件（言語基本、日常生活）
1. バッチ3-4: 初級200件（人・社会、場所・移動）
1. バッチ5-6: 中級200件（言語基本、学校・学習）
1. バッチ7-8: 中級200件（人・社会、時間・数量）
1. バッチ9-10: 上級200件（各カテゴリー混合）
1. バッチ11: 残り100件（バランス調整）

## 品質チェックリスト

データ入力時に以下を確認:

### 必須項目
- [ ] 熟語が高校受験レベルとして適切
- [ ] 読み仮名にアクセント記号が正しく付いている
- [ ] 意味が明確で分かりやすい
- [ ] 語源・成り立ちの解説が充実（20文字以上）
- [ ] 関連語が2つ以上含まれている
- [ ] 関連語に読み仮名が付いている
- [ ] カテゴリーが適切に分類されている
- [ ] 難易度が妥当
- [ ] 既存の熟語と重複していない
- [ ] スペルミスや誤字がない

### 推奨事項
- [ ] 語源解説に「〜と〜の組み合わせ」が含まれている
- [ ] 関連語のフォーマット: `語(読み): 意味`
- [ ] 例文や使用例が含まれている（任意）

## トラブルシューティング

### 検証エラー: 重複が検出される
```bash
# 既存データとの重複を確認
python3 validate_phrases.py template.csv public/data/junior-high-entrance-words.csv
```
→ 重複している熟語を別のものに置き換える

### 統合失敗: ファイルが見つからない
```bash
# バッチディレクトリの確認
python3 batch_workflow.py list

# テンプレートファイルの存在確認
ls -l batches/batch-*/template.csv
```

### アクセント記号が正しく表示されない
- UTF-8エンコーディングで保存されているか確認
- エディタの設定を確認（UTF-8）
- 使用可能なアクセント記号: ア́、イ́、ウ́、エ́、オ́

## 参考資料

- [熟語データ仕様書](specifications/08-junior-high-entrance-phrases.md)
- [データ構造定義](specifications/05-data-structures.md)
- [単語データ仕様書](specifications/07-junior-high-entrance-vocabulary.md)

## 作業ログ

バッチ作成履歴を記録:

| バッチ番号 | カテゴリー | 難易度 | 件数 | タイプ | ステータス | 作成日 |
|-----------|-----------|--------|------|--------|-----------|--------|
| 001 | 言語基本 | 初級 | 10 | 句動詞 | ⏳ 作業中 | 2025-01-15 |

## 注意事項

1. **データ品質が最優先**: 急いで大量生成するより、質の高いデータを着実に作成
1. **100件単位で検証**: 小さなバッチで品質を確認してから次へ進む
1. **バックアップ必須**: 統合前に必ずバックアップを作成
1. **統計確認**: 統合後、カテゴリー・難易度のバランスを確認
1. **継続的改善**: 検証で見つかった問題点をフィードバック

## 次のステップ

Phase 3完了後:
1. **Phase 4**: UI/UX拡張（熟語フィルタリング機能）
1. **Phase 5**: データ大量生成（1,100件）
1. **Phase 6**: 統合・テスト・ドキュメント整備
