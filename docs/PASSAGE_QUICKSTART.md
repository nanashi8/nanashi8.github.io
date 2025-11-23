# パッセージ作成クイックスタートガイド

## 新しいパッセージを作成する際の手順

### 📋 事前準備

1. **最新のガイドラインを確認**
   ```bash
   # ガイドライン文書を開く
   open docs/PASSAGE_CREATION_GUIDELINES.md
   ```

2. **テンプレートをコピー**
   ```bash
   cp docs/templates/passage-template.txt public/data/passages/[level]-[topic].txt
   ```

3. **現在のカバー率を確認**
   ```bash
   cd scripts
   python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv
   ```

---

## ✍️ 執筆フロー

### Step 1: 企画 (5-10分)
- [ ] トピックを決定（レベルに適した内容）
- [ ] 目標単語数を設定
  - Beginner: 800-1,500語
  - Intermediate: 1,500-2,500語
  - Advanced: 2,500-4,000語
- [ ] 統合する語彙をリストアップ
- [ ] アウトラインを作成

### Step 2: 執筆 (30-60分)
- [ ] テンプレートに沿って執筆
- [ ] 自然な英語表現を重視
- [ ] 語彙を無理なく統合
- [ ] 教育的価値を確保

### Step 3: フォーマット (5-10分)
- [ ] セクションヘッダーを追加
- [ ] 段落の字下げ（4スペース）を適用
- [ ] 会話文を正しくフォーマット
- [ ] Em dash (—) を使用

### Step 4: 品質チェック (10-15分)
```bash
# 自動品質チェックを実行
python3 scripts/passage_quality_check.py public/data/passages/[your-file].txt
```

チェック項目:
- [ ] 文法エラーなし
- [ ] 句読点正しい
- [ ] 段落字下げ統一
- [ ] 自然な英語表現
- [ ] 適切な単語数

### Step 5: 語彙カバレッジ確認 (5分)
```bash
cd scripts
python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv

# カバー率の変化を確認
# 前回: XX.XX% → 今回: YY.YY%
```

### Step 6: コミット & デプロイ (5分)
```bash
git add public/data/passages/[your-file].txt
git commit -m "feat: Add [level]-[topic] passage

Created new passage for [level] level.
- Word count: [XXXX] words
- Integrated [XX] vocabulary words
- Topics: [list main topics]
- Coverage contribution: +[X.XX]%

Quality checks: ✓ Grammar ✓ Formatting ✓ Indentation"

git push
```

---

## 🔧 便利なコマンド

### 全パッセージの品質チェック
```bash
cd scripts
python3 passage_quality_check.py --all
```

### 未使用語彙の確認
```bash
cd scripts
cat output/vocab_unused_all-words.txt | head -100
```

### カバー率の詳細レポート
```bash
cd scripts
python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv > output/coverage_full_report.txt
cat output/coverage_full_report.txt
```

### 特定トピックの語彙を探す
```bash
cd scripts
# 例: 医療関連の語彙
cat output/vocab_unused_all-words.txt | grep -E "medic|hospital|doctor|nurse|patient"

# 例: 科学関連の語彙  
cat output/vocab_unused_all-words.txt | grep -E "scien|research|experiment|laboratory"
```

---

## 📝 執筆のコツ

### 語彙を自然に統合する方法

**❌ 悪い例 (無理な統合):**
```
The student went to the library. The library had many books. 
Some books were about biochemistry and nanotechnology and 
quantum physics. The student liked reading.
```
→ 不自然に専門用語を詰め込んでいる

**✅ 良い例 (自然な統合):**
```
The science museum's technology section fascinated visitors. 
Interactive displays explained complex concepts like quantum 
computing and nanotechnology in accessible ways. Even advanced 
topics like biochemistry became understandable through hands-on 
experiments and clear visual aids.
```
→ 文脈に自然に組み込まれている

### レベル別の語彙選択

**Beginner (初級):**
- 日常生活の基本語彙
- 具体的な名詞・動詞
- シンプルな文構造
- 例: supermarket, shopping, fresh, vegetables, buy

**Intermediate (中級):**
- やや抽象的な概念
- 複文も使用
- 幅広いトピック
- 例: experience, opportunity, appreciate, challenge, improve

**Advanced (上級):**
- 抽象的・学術的語彙
- 複雑な文構造
- 深い分析・考察
- 例: demonstrate, implications, perspective, comprehensive, facilitate

---

## ⚠️ よくある間違いと修正方法

### 1. 段落字下げ忘れ
```
❌ This is a paragraph without indentation.
It continues here.

✅     This is a paragraph with proper 4-space indentation.
It continues here without indentation.
```

### 2. 可算名詞のミス
```
❌ amount of deaths, amount of people
✅ number of deaths, number of people

❌ number of water, number of money
✅ amount of water, amount of money
```

### 3. 冠詞のミス
```
❌ a apple, a hour
✅ an apple, an hour

❌ an university, an European
✅ a university, a European
```

### 4. ダッシュの使い方
```
❌ word - word (single dash with spaces)
✅ word—word (em dash, no spaces)
```

### 5. 会話文の句読点
```
❌ "Hello." she said.
✅ "Hello," she said.

❌ "How are you," he asked.
✅ "How are you?" he asked.
```

---

## 📊 カバー率向上戦略

### 現在の状況 (2025-11-23)
- 総語彙数: 3,281語
- 現在のカバー率: 63.06% (2,068語)
- 未使用: 1,213語
- 目標: 90%以上

### 効率的なカバー率向上方法

1. **テーマ別グループ化**
   - 関連する未使用語彙をグループ化
   - そのテーマに合ったセクションを追加

2. **既存パッセージの拡張**
   - 新規作成より効率的
   - 結論の前にセクション追加
   - 1パッセージあたり30-50語の統合を目標

3. **専門パッセージの作成**
   - 科学技術、医療、法律など
   - 専門用語を自然に使えるコンテキスト
   - Advanced レベルで実施

---

## 🎯 品質基準チェックリスト

コミット前に必ず確認:

### フォーマット
- [ ] ファイル名: `{level}-{topic-slug}.txt`
- [ ] 全段落が4スペースで字下げ
- [ ] セクションヘッダーは字下げなし
- [ ] Em dash (—) 使用

### 文法
- [ ] 主語と動詞の一致
- [ ] 時制の統一
- [ ] 冠詞の正確な使用
- [ ] 可算・不可算名詞の正しい扱い

### スタイル
- [ ] 自然なネイティブレベルの英語
- [ ] 年齢に適した内容
- [ ] 教育的価値が明確
- [ ] 語彙が自然に統合

### 技術的
- [ ] 自動品質チェック合格
- [ ] カバー率の改善確認
- [ ] UTF-8エンコーディング
- [ ] 適切なコミットメッセージ

---

## 📞 問題が発生した場合

### 品質チェックで大量のエラーが出る
1. ガイドラインを再確認
2. テンプレートと比較
3. 既存の良質なパッセージを参考に
4. 一つずつ修正

### 語彙が自然に統合できない
1. 無理に使わない
2. 別のトピックを検討
3. 文脈を作り直す
4. 類義語を探す

### カバー率が上がらない
1. 未使用語彙リストを確認
2. テーマ別にグループ化
3. 適切なコンテキストを選ぶ
4. 複数パッセージでの分散を検討

---

## 📚 参考資料

- **詳細ガイドライン**: `docs/PASSAGE_CREATION_GUIDELINES.md`
- **テンプレート**: `docs/templates/passage-template.txt`
- **既存パッセージ**: `public/data/passages/*.txt`
- **品質チェックツール**: `scripts/passage_quality_check.py`
- **カバレッジツール**: `scripts/vocab_coverage_report.py`

---

## 💡 ヒント

- **小さく始める**: 最初は短めのパッセージから
- **参考にする**: 既存の高品質パッセージを見る
- **反復する**: 書く→チェック→修正のサイクル
- **自然さ優先**: カバー率より質を重視
- **楽しむ**: 興味のあるトピックを選ぶ

---

*最終更新: 2025-11-23*
