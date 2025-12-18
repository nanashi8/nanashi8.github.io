# 誤った単元データの修正計画

## 📋 検出された問題

検証スクリプト (`./scripts/validate-unit-structure.sh`) により、以下の5件のエラーが検出されました：

### ❌ エラー1: grammar_grade2_unit8.json
- **問題**: Grade 2にUnit 8は存在しない
- **現在の内容**: "There is/are構文"
- **公式**: Grade 2はUnit 0-7のみ（Unit 7が最終単元）

### ❌ エラー2: grammar_grade2_unit9.json
- **問題**: Grade 2にUnit 9は存在しない
- **現在の内容**: "受動態（導入）"
- **公式**: Grade 2はUnit 0-7のみ

### ❌ エラー3: grammar_grade3_unit7.json
- **問題**: Grade 3にUnit 7は存在しない
- **現在の内容**: "間接疑問文"
- **公式**: Grade 3はUnit 0-6のみ（Unit 6が最終単元）

### ❌ エラー4: grammar_grade3_unit8.json
- **問題**: Grade 3にUnit 8は存在しない
- **現在の内容**: "仮定法・使役動詞"
- **公式**: Grade 3はUnit 0-6のみ

### ❌ エラー5: grammar_grade3_unit9.json (作成予定だった)
- **問題**: Grade 3にUnit 9は存在しない
- **予定内容**: "知覚動詞"
- **公式**: Grade 3はUnit 0-6のみ

---

## 🔍 根本原因分析

### なぜこの問題が発生したか

1. **古いガイドラインの参照**
   - `docs/guidelines/grammar/NEW_HORIZON_GRAMMAR_GUIDELINES.md` の内容が古かった
   - "Unit 8-9: 仮定法・使役動詞・知覚動詞"という記述が誤り

2. **公式資料の未確認**
   - 東京書籍の公式年間指導計画を直接確認していなかった
   - Excel/PDFファイルの実データを検証していなかった

3. **検証メカニズムの不在**
   - 単元構成を自動検証するスクリプトがなかった
   - ガイドラインに警告が記載されていなかった

---

## 📊 正しい単元マッピング

### Grade 2（正しい構成）
```
Unit 0: 動詞の過去形
Unit 1: be going to / will
Unit 2: 接続詞（when/if/because/that）
Unit 3: 不定詞
Unit 4: have to / must / 動名詞
Unit 5: （調査継続）
Unit 6: 比較級・最上級
Unit 7: 受け身（受動態）
```

### Grade 3（正しい構成）
```
Unit 0: 既習事項の復習
Unit 1: 現在完了形（経験用法）
Unit 2: 現在完了形（完了・継続用法）、現在完了進行形
Unit 3: It is ... to / let/help + 人 + 動詞原形
Unit 4: 間接疑問文 / 分詞（現在分詞・過去分詞）
Unit 5: 関係代名詞（who/which/that）
Unit 6: 仮定法（I wish / If + were/過去形）
```

---

## ✅ 修正プラン

### フェーズ1: アーカイブ（バックアップ）

誤ったファイルを削除する前にアーカイブを作成：

```bash
mkdir -p public/data/grammar/archive/incorrect_units_2025-12-18
mv public/data/grammar/grammar_grade2_unit8.json public/data/grammar/archive/incorrect_units_2025-12-18/
mv public/data/grammar/grammar_grade2_unit9.json public/data/grammar/archive/incorrect_units_2025-12-18/
mv public/data/grammar/grammar_grade3_unit7.json public/data/grammar/archive/incorrect_units_2025-12-18/
mv public/data/grammar/grammar_grade3_unit8.json public/data/grammar/archive/incorrect_units_2025-12-18/
# Note: grammar_grade3_unit9.json は作成済みなので移動
```

### フェーズ2: 正しい単元への再配置

#### オプションA: 内容を活用する場合

1. **grammar_grade2_unit9.json（受動態）** → **grammar_grade2_unit7.json**
   - Unit 7の公式文法は「受け身（受動態）」
   - 既存のUnit 7と内容を照合・統合

2. **grammar_grade3_unit7.json（間接疑問文）** → **grammar_grade3_unit4.json**
   - Unit 4の公式文法に「間接疑問文」が含まれる
   - 既存のUnit 4と内容を照合・統合

3. **grammar_grade3_unit6.json（分詞）** → **grammar_grade3_unit4.json**
   - Unit 4の公式文法に「分詞」が含まれる
   - 既存のUnit 4と内容を照合・統合

4. **grammar_grade3_unit8.json（仮定法）** → **grammar_grade3_unit6.json**
   - Unit 6の公式文法は「仮定法」
   - 既存のUnit 6と内容を照合・統合

#### オプションB: 完全に削除する場合

- 誤った単元の問題データをすべてアーカイブに移動
- 公式カリキュラムに基づいて各単元を一から作成し直す

---

## 🚀 実装手順

### Step 1: 現状確認
```bash
# 誤った単元ファイルの内容を確認
ls -la public/data/grammar/grammar_grade2_unit{8,9}.json
ls -la public/data/grammar/grammar_grade3_unit{7,8,9}.json

# 各ファイルの問題数を確認
for file in public/data/grammar/grammar_grade{2,3}_unit{7,8,9}.json; do
  if [ -f "$file" ]; then
    echo "$file: $(jq '.totalQuestions' "$file") questions"
  fi
done
```

### Step 2: アーカイブ作成
```bash
mkdir -p public/data/grammar/archive/incorrect_units_2025-12-18

for file in grammar_grade2_unit8.json grammar_grade2_unit9.json grammar_grade3_unit7.json grammar_grade3_unit8.json; do
  if [ -f "public/data/grammar/$file" ]; then
    cp "public/data/grammar/$file" "public/data/grammar/archive/incorrect_units_2025-12-18/"
  fi
done
```

### Step 3: 検証実行
```bash
./scripts/validate-unit-structure.sh
```

### Step 4: 決定事項の記録
- どのファイルを削除したか
- どのファイルを統合したか
- 新規作成が必要な単元はあるか

---

## 📝 意思決定が必要な事項

### 1. 既存の問題データの扱い

**質問**: 誤った単元番号で作成された問題データ（合計約240問）をどう扱うか？

**選択肢**:
- **A. 活用**: 正しい単元に再配置して活用
- **B. アーカイブ**: アーカイブに保存して新規作成
- **C. 部分活用**: 内容を確認して使えるものだけ再配置

**推奨**: **選択肢C（部分活用）**
- 理由: 誤った単元番号でも、問題の文法的内容は正しい可能性がある
- 手順:
  1. 各ファイルの `grammar` フィールドを確認
  2. 公式カリキュラムと照合
  3. 正しい単元に該当する問題のみ抽出
  4. 残りはアーカイブ

### 2. Grade 2 Unit 8（There is/are構文）

**質問**: "There is/are構文"の問題データをどうするか？

**分析**:
- 公式カリキュラムに"There is/are"の明示的な単元は見当たらない
- 中1の基本文法として学習済みの可能性
- または、Unit 7の一部として含まれる可能性

**推奨**:
- **Grade 1の補足単元として移動**
- または **完全にアーカイブ**（発展学習用として保存）

### 3. 使役動詞・知覚動詞

**質問**: "使役動詞・知覚動詞"の問題データをどうするか？

**分析**:
- 公式カリキュラムに明示的な単元なし
- Grade 3 Unit 3に `let [help]＋人など＋動詞の原形` がある
- 発展的内容として扱われる可能性

**推奨**:
- Unit 3の補足として統合
- または **発展学習用の別カテゴリ**として保存

---

## 🎯 最終目標

### 達成すべき状態

1. ✅ 全ての文法データファイルが公式カリキュラムに準拠
2. ✅ 検証スクリプトがエラーなしで完了
3. ✅ 誤ったデータはすべてアーカイブに保存
4. ✅ ドキュメントに正しい単元構成が記載
5. ✅ 今後の作業で同じ間違いが起きないメカニズムが設置済み

### 検証方法

```bash
# 検証スクリプトがエラーなしで完了することを確認
./scripts/validate-unit-structure.sh

# 期待される出力:
# ✅ 検証成功: すべての単元が公式構成に準拠しています
```

---

## 📅 タイムライン

### 即座に実施（今日）
- [x] 公式資料のダウンロード
- [x] 単元構成マスタードキュメントの作成
- [x] 検証スクリプトの作成
- [x] ガイドラインへの警告追加
- [ ] 誤ったファイルのアーカイブ
- [ ] ユーザーへの報告と意思決定の相談

### 次のステップ（ユーザーの決定後）
- [ ] 誤った単元データの移動/削除
- [ ] 正しい単元への問題データの再配置（必要に応じて）
- [ ] 検証スクリプトの実行確認
- [ ] 最終報告書の作成

---

**作成日**: 2025年12月18日  
**優先度**: 🔴 最高  
**影響範囲**: 文法問題データ全体の整合性
