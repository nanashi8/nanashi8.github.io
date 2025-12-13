# データ品質テストカバレッジレポート

## 📊 総合データカバレッジ

| カテゴリ       | ファイル数 | テスト済み | カバレッジ   | データ量     |
| -------------- | ---------- | ---------- | ------------ | ------------ |
| **Vocabulary** | 5          | 4          | **80.0%** ✅ | 1.97 MB      |
| **Grammar**    | 39         | 1          | **2.6%** ⚠️  | 8.21 MB      |
| **Questions**  | 2          | 0          | **0.0%** ❌  | 0.07 MB      |
| **Other**      | 54         | 0          | **0.0%** ❌  | 79.00 MB     |
| **合計**       | **100**    | **5**      | **5.0%**     | **89.25 MB** |

## ✅ テスト済みデータ (100%品質保証)

### Vocabulary (80% カバレッジ)

- ✅ `high-school-entrance-words.csv` - 2,662語 (756KB)
- ✅ `high-school-entrance-phrases.csv` - 96フレーズ (27KB)
- ✅ `high-school-intermediate-words.csv` - 1,579語 (337KB)
- ✅ `high-school-intermediate-phrases.csv` - 212フレーズ (44KB)
- **テスト内容**:
  - データ完全性検証 (日本語、IPA、カテゴリ)
  - IPA発音記号妥当性
  - 難易度分布の教育的妥当性

### Grammar (2.6% カバレッジ)

- ✅ `fill-in-blank-questions-grade1.json` - 2,200問題 (1.2MB)
  - verbForm: 200問題
  - fillInBlank: 1,000問題
  - sentenceOrdering: 1,000問題
- **テスト内容**:
  - 英文法学者の視点 (正答一意性、選択肢妥当性、文法正確性)
  - 日本語翻訳者の視点 (日本語訳品質)
  - 教育専門家の視点 (難易度、ID一意性)
  - **64テストすべて通過 (100%)**

## ⚠️ 未テストデータ (品質未保証)

### Grammar Grade2/3 (38ファイル、8.1MB)

- ❌ `fill-in-blank-questions-grade2.json` (107KB)
- ❌ `fill-in-blank-questions-grade3.json` (1.2MB)
- ❌ `verb-form-questions-grade1.json` (1.1MB)
- ❌ `verb-form-questions-grade2.json` (109KB)
- ❌ `verb-form-questions-grade3.json` (1.1MB)
- ❌ `sentence-ordering-grade1.json` (1.2MB)
- ❌ `sentence-ordering-grade2.json` (118KB)
- ❌ `sentence-ordering-grade3.json` (1.2MB)
- ❌ `grammar/grammar_grade*_unit*.json` (30ファイル、~1MB)

### Questions (2ファイル、71KB)

- ❌ `pronunciation-questions.json` (36KB)
- ❌ `accent-questions.json` (34KB)

### Other (54ファイル、79MB)

- ❌ `constants.json`
- ❌ `grade*_unit*_manual.json`
- ❌ その他設定・データファイル

## 🎯 推奨改善計画

### Phase 1: Grammar完全カバレッジ (優先度: 高)

Grade2/3の問題データに同じ品質テストを適用:

```bash
- fill-in-blank-questions-grade2.json
- fill-in-blank-questions-grade3.json
- verb-form-questions-grade2.json
- verb-form-questions-grade3.json
- sentence-ordering-grade2.json
- sentence-ordering-grade3.json
```

**期待カバレッジ向上: 2.6% → 20%**

### Phase 2: Questions品質テスト (優先度: 中)

発音・アクセント問題の品質検証:

```bash
- pronunciation-questions.json
- accent-questions.json
```

**期待カバレッジ向上: 20% → 22%**

### Phase 3: Grammar詳細データ (優先度: 中)

Unit別文法データの構造検証:

```bash
- grammar/grammar_grade*_unit*.json (30ファイル)
```

**期待カバレッジ向上: 22% → 52%**

### Phase 4: その他データ (優先度: 低)

設定ファイルやマニュアルデータの整合性検証

## 📈 データ品質メトリクス

### テスト済みデータの品質

- **Vocabulary**: 100% (4,549エントリー検証済み)
- **Grammar Grade1**: 100% (2,200問題検証済み)
- **テスト通過率**: 64/64 (100%) ✅

### 推定データ品質リスク

- **Grammar Grade2/3**: データ生成プロセスが同じであれば、Grade1と同様の問題が存在する可能性
  - correctAnswer不一致
  - choices重複
  - explanation不足
- **未テストデータ**: 品質保証なし (潜在的バグ数: 不明)

## 🔍 結論

**現在のデータカバレッジ5.0%は、本アプリの根幹であるデータ品質を十分に保証していません。**

テスト済みの5%のデータは100%の品質を達成していますが、残り95%のデータは未検証です。特にGrammar Grade2/3のデータ(8MB)は、Grade1で発見された多数のデータ品質問題と同様の問題を含む可能性が高いです。

**推奨**: Phase 1を優先実施し、全Grammar問題データの品質テストを追加することで、データカバレッジを20%まで向上させ、アプリの信頼性を大幅に改善できます。
