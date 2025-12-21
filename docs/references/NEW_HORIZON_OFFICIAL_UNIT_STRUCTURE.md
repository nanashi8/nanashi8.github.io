---
canonical: docs/references/NEW_HORIZON_OFFICIAL_UNIT_STRUCTURE.md
status: stable
lastUpdated: 2025-12-19
diataxisCategory: reference
references:
  - .aitk/instructions/tools.instructions.md
  - scripts/validate-unit-structure.sh
  - docs/guidelines/grammar/NEW_HORIZON_GRAMMAR_GUIDELINES.md
source: 東京書籍 NEW HORIZON English Course 令和7年度版 年間指導計画
sourceUrl: https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/#eigo
doNotMove: true
---

# NEW HORIZON 公式単元構成（令和7年度版）

## ⚠️ 重要：必読ドキュメント

**このドキュメントは東京書籍公式の年間指導計画から抽出した正確な単元構成です。**
**文法問題作成時は必ずこのドキュメントを参照してください。**

### 公式資料
- **出典**: 東京書籍 NEW HORIZON English Course（令和7年度版）
- **URL**: https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/#eigo
- **ダウンロード日**: 2025年12月18日
- **ファイル**: 
  - 2年生: R7eigo_saian_2_2502.xlsx
  - 3年生: R7eigo_saian_3_2502.xlsx

---

## 📚 2年生（Grade 2）単元構成

### Unit 0: My Spring Vacation
- **文法**: 動詞の過去形（復習）

### Unit 1: What can we experience on a trip?
- **文法**: 
  - be going to（未来表現）
  - 助動詞 will
  - ＜show など＋人＋もの＞
  - ＜call＋A＋B＞

### Unit 2: What is local food?
- **文法**: 
  - 接続詞 when
  - 接続詞 if
  - 接続詞 because
  - 接続詞 that

### Unit 3: What kind of job are you interested in?
- **文法**: 
  - 不定詞（目的を表す副詞的用法）
  - 不定詞（原因を表す副詞的用法）
  - 不定詞（形容詞的用法）
  - It is … to

### Unit 4: What is important in a homestay?
- **文法**: 
  - have to / do not have to
  - 助動詞 must / must not
  - 動名詞（目的語）
  - 動名詞（主語）

### Unit 5: What design is good for everyone?
- **文法**: （データから特定できず - 調査継続）

### Unit 6: How can we make a good presentation?
- **文法**: 
  - 比較表現（…er / the …est）
  - 比較表現（more … / the most …）
  - 比較表現（better / best）
  - 比較表現（as … as ～）

### Unit 7: What are World Heritage sites and their problems?
- **文法**: 
  - 受け身（受動態）

### ⚠️ Unit 8, Unit 9: 存在しません
**2年生にUnit 8とUnit 9は存在しません。Unit 7の後はStage Activity 3で終了します。**

---

## 📚 3年生（Grade 3）単元構成

### Unit 0: Discover a New Side of Classmates
- **文法**: 既習事項の復習

### Unit 1: What is special about Japanese pop culture?
- **文法**: 
  - 現在完了形（経験用法）
  - SVOC（C = 形容詞）
  - SVOO（that節）

### Unit 2: How do you choose your clothes?
- **文法**: 
  - 現在完了形（完了用法）
  - 現在完了形（継続用法）
  - 現在完了進行形

### Unit 3: How can we save animals?
- **文法**: 
  - It is … (for＋人など) ＋to
  - let [help]＋人など＋動詞の原形
  - 不定詞（復習）

### Unit 4: How can we help each other in a disaster?
- **文法**: 
  - 間接疑問文
  - SVOO（what節）
  - 過去分詞
  - 現在分詞

### Unit 5: What makes a good leader?
- **文法**: 
  - 名詞を修飾する文
  - 関係代名詞 who
  - 関係代名詞 that [which]（主格・目的格）

### Unit 6: What does it mean to be a global citizen?
- **文法**: 
  - 仮定法（I wish I could [had] …）
  - 仮定法（If＋主語＋were …, ～.）
  - 仮定法（If＋主語＋動詞の過去形, ….）
  - 主語を説明する関係代名詞

### ⚠️ Unit 7, Unit 8, Unit 9: 存在しません
**3年生にUnit 7, Unit 8, Unit 9は存在しません。Unit 6の後はStage Activity 3で終了します。**

---

## 🚨 誤った単元データの特定

### 現在のプロジェクトで誤っている可能性のあるファイル：

1. **grammar_grade2_unit8.json** ❌
   - 現状: "There is/are構文"として作成
   - 問題: 2年生にUnit 8は存在しない
   - 対応: Unit 7の一部として統合するか、削除

2. **grammar_grade2_unit9.json** ❌
   - 現状: "受動態（導入）"として作成
   - 問題: 2年生にUnit 9は存在しない
   - 対応: Unit 7として再配置

3. **grammar_grade3_unit6.json** ⚠️
   - 現状: "分詞（現在分詞・過去分詞）"として作成
   - 公式: "仮定法"が正しい
   - 問題: 内容が完全に誤っている

4. **grammar_grade3_unit7.json** ⚠️
   - 現状: "間接疑問文"として作成
   - 問題: 3年生にUnit 7は存在しない
   - 対応: Unit 4として再配置が必要

5. **grammar_grade3_unit8.json** ❌
   - 現状: "仮定法・使役動詞"として作成
   - 問題: 3年生にUnit 8は存在しない
   - 対応: Unit 6に統合または削除

6. **grammar_grade3_unit9.json** ❌
   - 現状: 未作成（予定は"知覚動詞"）
   - 問題: 3年生にUnit 9は存在しない
   - 対応: 作成不要

---

## ✅ 正しい単元マッピング

### 分詞（現在分詞・過去分詞）
- **正しい配置**: Grade 3 Unit 4
- **公式文法**: 過去分詞、現在分詞

### 間接疑問文
- **正しい配置**: Grade 3 Unit 4
- **公式文法**: 間接疑問文、SVOO（what節）

### 仮定法
- **正しい配置**: Grade 3 Unit 6
- **公式文法**: 仮定法（I wish、If + were/過去形）

### There is/are構文
- **正しい配置**: 存在しない（公式カリキュラムに明示的な単元なし）
- **注意**: 基本文法として1年生で学習済みの可能性

### 受動態（受け身）
- **正しい配置**: Grade 2 Unit 7
- **公式文法**: 受け身

### 使役動詞・知覚動詞
- **正しい配置**: 公式カリキュラムに明示的な単元なし
- **注意**: 発展的内容として扱われる可能性

---

## 📋 修正アクションプラン

### 優先度1: 即座に修正が必要

1. **Grade 3 Unit 6**: 分詞 → 仮定法に内容を完全変更
2. **Grade 3 Unit 7**: 削除または別単元に統合
3. **Grade 3 Unit 8**: 削除または Unit 6 に統合
4. **Grade 2 Unit 8**: 削除または Unit 7 に統合
5. **Grade 2 Unit 9**: 削除または Unit 7 に統合

### 優先度2: 検証が必要

1. Grade 3 Unit 4 の内容確認（分詞と間接疑問文が両方含まれるべき）
2. Grade 2 Unit 7 の内容確認（受け身の内容が正しいか）

---

## 🔒 検証メカニズムの実装

### 1. 単元構成検証スクリプト
```bash
# scripts/validate-unit-structure.sh
# 全ての grammar_grade*.json ファイルの単元番号を検証
```

### 2. CI/CDパイプラインでの自動チェック
- 単元番号が公式構成と一致しているか
- 文法事項が公式と一致しているか

### 3. ガイドライン更新
- すべての文法問題作成ガイドラインに警告を追加
- このドキュメントへのリンクを必須参照として追加

---

## 📝 今後の作業フロー

### 文法問題作成時の必須ステップ

1. ✅ **このドキュメントを確認**
2. ✅ **公式年間指導計画の確認**（docs/references/R7eigo_saian_*.xlsx）
3. ✅ **単元番号の妥当性を検証**
4. ✅ **文法事項の正確性を確認**
5. ✅ **作成後に自動検証スクリプトを実行**

---

## 📚 参考資料

- 東京書籍公式サイト: https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/#eigo
- 年間指導計画PDF: docs/references/R7eigo_saian_2_2502.pdf, R7eigo_saian_3_2502.pdf
- 年間指導計画Excel: docs/references/R7eigo_saian_2_2502.xlsx, R7eigo_saian_3_2502.xlsx

---

**最終更新**: 2025年12月18日  
**作成理由**: 誤った単元構成でのデータ作成を防止するため  
**重要度**: 🔴 最高（全ての文法問題作成の基礎）
